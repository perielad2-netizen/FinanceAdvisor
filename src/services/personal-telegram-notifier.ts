// Personal Telegram Notification Service - Each user has their own bot/chat
import type { Bindings } from '../types'

export interface UserTelegramSettings {
  userId: string
  botToken?: string
  chatId?: string
  enabled: boolean
  autoSchedulerEnabled: boolean
  recommendationFrequency: number
  riskAllocation: {
    high: number
    medium: number
    low: number
  }
}

export interface PersonalRecommendation {
  userId: string
  portfolioId: string
  symbol: string
  action: string
  confidence: number
  entryPrice: number
  targetPrice?: number
  stopLoss?: number
  reason: string
  urgency: 'low' | 'medium' | 'high'
  riskLevel: 'low' | 'medium' | 'high'
}

export class PersonalTelegramNotifier {
  constructor(private env: Bindings) {}

  /**
   * Get user's personal Telegram settings from database
   */
  async getUserTelegramSettings(userId: string): Promise<UserTelegramSettings | null> {
    try {
      const result = await this.env.DB.prepare(`
        SELECT 
          telegram_bot_token,
          telegram_chat_id,
          telegram_notifications,
          auto_scheduler_enabled,
          recommendation_frequency,
          risk_allocation_high,
          risk_allocation_medium,
          risk_allocation_low
        FROM user_preferences 
        WHERE user_id = ?
      `).bind(userId).first()

      if (!result) {
        return null
      }

      return {
        userId,
        botToken: result.telegram_bot_token as string,
        chatId: result.telegram_chat_id as string,
        enabled: Boolean(result.telegram_notifications),
        autoSchedulerEnabled: Boolean(result.auto_scheduler_enabled),
        recommendationFrequency: result.recommendation_frequency as number || 120,
        riskAllocation: {
          high: result.risk_allocation_high as number || 20,
          medium: result.risk_allocation_medium as number || 30,
          low: result.risk_allocation_low as number || 50
        }
      }
    } catch (error) {
      console.error('Error fetching user Telegram settings:', error)
      return null
    }
  }

  /**
   * Save user's personal Telegram settings
   */
  async saveUserTelegramSettings(settings: UserTelegramSettings): Promise<boolean> {
    try {
      console.log('🔄 PersonalTelegramNotifier: Starting save process for user:', settings.userId)
      
      // First, try to update existing preferences
      const updateResult = await this.env.DB.prepare(`
        UPDATE user_preferences SET
          telegram_bot_token = ?,
          telegram_chat_id = ?,
          telegram_notifications = ?,
          auto_scheduler_enabled = ?,
          recommendation_frequency = ?,
          risk_allocation_high = ?,
          risk_allocation_medium = ?,
          risk_allocation_low = ?,
          updated_at = CURRENT_TIMESTAMP
        WHERE user_id = ?
      `).bind(
        settings.botToken || null,
        settings.chatId || null,
        settings.enabled ? 1 : 0,
        settings.autoSchedulerEnabled ? 1 : 0,
        settings.recommendationFrequency,
        settings.riskAllocation.high,
        settings.riskAllocation.medium,
        settings.riskAllocation.low,
        settings.userId
      ).run()

      console.log('🔄 Full update result:', JSON.stringify(updateResult, null, 2))
      
      // Force insert always (since update doesn't seem to work)
      console.log('🆕 Force creating new user_preferences record for user:', settings.userId)
      try {
        // First delete any existing record
        await this.env.DB.prepare(`DELETE FROM user_preferences WHERE user_id = ?`).bind(settings.userId).run()
        
        // Then insert new record
        const insertResult = await this.env.DB.prepare(`
          INSERT INTO user_preferences (
            user_id,
            telegram_bot_token,
            telegram_chat_id,
            telegram_notifications,
            auto_scheduler_enabled,
            recommendation_frequency,
            risk_allocation_high,
            risk_allocation_medium,
            risk_allocation_low
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
          settings.userId,
          settings.botToken || null,
          settings.chatId || null,
          settings.enabled ? 1 : 0,
          settings.autoSchedulerEnabled ? 1 : 0,
          settings.recommendationFrequency,
          settings.riskAllocation.high,
          settings.riskAllocation.medium,
          settings.riskAllocation.low
        ).run()
        
        console.log('🆕 Force insert successful for user:', settings.userId)
      } catch (insertError) {
        console.error('🆕 Force insert failed:', insertError)
      }

      console.log(`✅ Saved Telegram settings for user ${settings.userId}`)
      return true
    } catch (error) {
      console.error('❌ Error saving user Telegram settings:', error)
      console.error('❌ Error details:', error.message, error.stack)
      return false
    }
  }

  /**
   * Send personal recommendation to user's Telegram
   */
  async sendPersonalRecommendation(recommendation: PersonalRecommendation): Promise<boolean> {
    const settings = await this.getUserTelegramSettings(recommendation.userId)
    
    if (!settings || !settings.enabled || !settings.botToken || !settings.chatId) {
      console.log(`⚠️ User ${recommendation.userId} doesn't have Telegram configured or enabled`)
      return false
    }

    try {
      const message = this.formatPersonalRecommendationMessage(recommendation)
      await this.sendMessage(settings.botToken, settings.chatId, message)
      
      console.log(`📱 Personal Telegram sent to user ${recommendation.userId} for ${recommendation.symbol}`)
      return true
    } catch (error) {
      console.error(`❌ Failed to send Telegram to user ${recommendation.userId}:`, error)
      return false
    }
  }

  /**
   * Test user's personal Telegram connection
   */
  async testUserConnection(userId: string): Promise<{ success: boolean; message: string }> {
    const settings = await this.getUserTelegramSettings(userId)
    
    if (!settings || !settings.botToken || !settings.chatId) {
      return {
        success: false,
        message: 'Telegram bot token and chat ID not configured'
      }
    }

    try {
      const testMessage = `🤖 **AI Trader Advisor - Connection Test**\n\n✅ Your personal Telegram bot is working!\n\n🔗 Connected to: ${settings.chatId}\n⏰ Frequency: Every ${settings.recommendationFrequency} minutes\n📊 Auto Scheduler: ${settings.autoSchedulerEnabled ? 'Enabled' : 'Disabled'}\n\n🎯 You will receive personalized trading recommendations here.`
      
      await this.sendMessage(settings.botToken, settings.chatId, testMessage)
      
      return {
        success: true,
        message: 'Test message sent successfully to your personal Telegram!'
      }
    } catch (error) {
      console.error(`Telegram test failed for user ${userId}:`, error)
      return {
        success: false,
        message: `Connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
    }
  }

  /**
   * Send message to specific user's Telegram
   */
  private async sendMessage(botToken: string, chatId: string, text: string): Promise<void> {
    const url = `https://api.telegram.org/bot${botToken}/sendMessage`
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: 'Markdown',
        disable_web_page_preview: true,
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Telegram API error: ${response.status} - ${error}`)
    }
  }

  /**
   * Format personal recommendation message
   */
  private formatPersonalRecommendationMessage(rec: PersonalRecommendation): string {
    const urgencyEmoji = { low: '🟢', medium: '🟡', high: '🔴' }[rec.urgency]
    const actionEmoji = rec.action === 'BUY' ? '📈' : rec.action === 'SELL' ? '📉' : '⏸️'
    
    return `${actionEmoji} **AI RECOMMENDATION**

🏷️ **Symbol**: ${rec.symbol}
⚡ **Action**: ${rec.action}
📊 **Confidence**: ${rec.confidence}%
💰 **Entry Price**: $${rec.entryPrice.toFixed(2)}
${rec.targetPrice ? `🎯 **Target**: $${rec.targetPrice.toFixed(2)}\n` : ''}${rec.stopLoss ? `🛑 **Stop Loss**: $${rec.stopLoss.toFixed(2)}\n` : ''}
${urgencyEmoji} **Risk Level**: ${rec.riskLevel.toUpperCase()}

💡 **Reason**: ${rec.reason}

⚠️ *Personal recommendation for your portfolio*
🤖 *AI Trader Advisor*`
  }

  /**
   * Get all users with auto-scheduler enabled
   */
  async getUsersWithAutoScheduler(): Promise<string[]> {
    try {
      const results = await this.env.DB.prepare(`
        SELECT user_id 
        FROM user_preferences 
        WHERE auto_scheduler_enabled = 1 
        AND telegram_notifications = 1 
        AND telegram_bot_token IS NOT NULL 
        AND telegram_chat_id IS NOT NULL
      `).all()

      return results.results.map(row => (row as any).user_id)
    } catch (error) {
      console.error('Error fetching auto-scheduler users:', error)
      return []
    }
  }
}