// Unified Notification Service
// Handles Push Notifications, Email, and Telegram in priority order

import type { Bindings } from '../types'

export interface NotificationData {
  title: string
  body: string
  symbol?: string
  action?: string
  confidence?: number
  entryPrice?: number
  targetPrice?: number
  stopLoss?: number
  reason?: string
  urgency?: 'low' | 'medium' | 'high'
  riskLevel?: 'low' | 'medium' | 'high'
  userId: string
}

export interface UserNotificationPreferences {
  userId: string
  email: string
  pushEnabled: boolean
  pushSubscription?: any
  emailEnabled: boolean
  telegramEnabled: boolean
  telegramBotToken?: string
  telegramChatId?: string
}

export class NotificationService {
  constructor(private env: Bindings) {}

  /**
   * Send notification using all available methods in priority order
   * 1. Push Notification (if subscribed and online)
   * 2. Email (always as backup)
   * 3. Telegram (if configured)
   */
  async sendRecommendationNotification(data: NotificationData): Promise<{
    push: boolean
    email: boolean
    telegram: boolean
    details: string[]
  }> {
    const results = {
      push: false,
      email: false,
      telegram: false,
      details: [] as string[]
    }

    try {
      // Get user preferences
      const preferences = await this.getUserNotificationPreferences(data.userId)
      if (!preferences) {
        results.details.push('❌ User preferences not found')
        return results
      }

      // Format messages for different channels
      const formattedData = this.formatNotificationData(data)

      // 1. Try Push Notification first (instant, best UX)
      if (preferences.pushEnabled && preferences.pushSubscription) {
        try {
          await this.sendPushNotification(preferences.pushSubscription, formattedData)
          results.push = true
          results.details.push('✅ Push notification sent')
        } catch (error) {
          results.details.push(`❌ Push failed: ${error.message}`)
        }
      } else {
        results.details.push('⏭️ Push not available (not subscribed)')
      }

      // 2. Send Email (reliable backup)
      if (preferences.emailEnabled && preferences.email) {
        try {
          await this.sendEmailNotification(preferences.email, formattedData)
          results.email = true
          results.details.push('✅ Email notification sent')
        } catch (error) {
          results.details.push(`❌ Email failed: ${error.message}`)
        }
      } else {
        results.details.push('⏭️ Email disabled')
      }

      // 3. Send Telegram (if configured)
      if (preferences.telegramEnabled && preferences.telegramBotToken && preferences.telegramChatId) {
        try {
          await this.sendTelegramNotification(preferences, formattedData)
          results.telegram = true
          results.details.push('✅ Telegram notification sent')
        } catch (error) {
          results.details.push(`❌ Telegram failed: ${error.message}`)
        }
      } else {
        results.details.push('⏭️ Telegram not configured')
      }

      return results

    } catch (error) {
      console.error('❌ NotificationService: Failed to send notifications:', error)
      results.details.push(`❌ System error: ${error.message}`)
      return results
    }
  }

  /**
   * Send Web Push Notification
   */
  private async sendPushNotification(subscription: any, data: any): Promise<void> {
    // Note: In a real implementation, you'd need VAPID keys and a push service
    // For now, we'll simulate this or use a service like OneSignal
    console.log('📱 Sending push notification:', data.title)
    
    // This would integrate with Web Push Protocol
    // For demo purposes, we'll log it
    const payload = {
      title: data.title,
      body: data.body,
      icon: '/static/favicon.ico',
      data: data
    }

    // In production, you'd use something like:
    // await webpush.sendNotification(subscription, JSON.stringify(payload))
    console.log('📱 Push payload:', payload)
  }

  /**
   * Send Email Notification using Resend API
   */
  private async sendEmailNotification(email: string, data: any): Promise<void> {
    console.log('📧 Sending email notification to:', email)

    const htmlContent = this.generateEmailHTML(data)
    
    // Use Resend API (3000 emails/month free)
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'AI Trader Advisor <notifications@traderadvisor.com>',
        to: [email],
        subject: data.title,
        html: htmlContent
      })
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Email API error: ${response.status} - ${error}`)
    }

    console.log('📧 Email sent successfully to:', email)
  }

  /**
   * Send Telegram Notification (existing implementation)
   */
  private async sendTelegramNotification(preferences: UserNotificationPreferences, data: any): Promise<void> {
    const message = this.formatTelegramMessage(data)
    
    const response = await fetch(`https://api.telegram.org/bot${preferences.telegramBotToken}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: preferences.telegramChatId,
        text: message,
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
   * Get user notification preferences from database
   */
  private async getUserNotificationPreferences(userId: string): Promise<UserNotificationPreferences | null> {
    try {
      // Get user email from users table
      const userResult = await this.env.DB.prepare(`
        SELECT email FROM users WHERE id = ?
      `).bind(userId).first()

      if (!userResult) return null

      // Get preferences from user_preferences table
      const prefsResult = await this.env.DB.prepare(`
        SELECT 
          push_notifications,
          push_subscription,
          email_notifications,
          telegram_notifications,
          telegram_bot_token,
          telegram_chat_id
        FROM user_preferences 
        WHERE user_id = ?
      `).bind(userId).first()

      return {
        userId,
        email: userResult.email as string,
        pushEnabled: prefsResult?.push_notifications || true, // Default enabled
        pushSubscription: prefsResult?.push_subscription ? JSON.parse(prefsResult.push_subscription as string) : null,
        emailEnabled: prefsResult?.email_notifications !== false, // Default enabled
        telegramEnabled: prefsResult?.telegram_notifications || false,
        telegramBotToken: prefsResult?.telegram_bot_token as string,
        telegramChatId: prefsResult?.telegram_chat_id as string
      }
    } catch (error) {
      console.error('❌ Failed to get user notification preferences:', error)
      return null
    }
  }

  /**
   * Save push notification subscription
   */
  async savePushSubscription(userId: string, subscription: any): Promise<boolean> {
    try {
      // Update or insert push subscription
      await this.env.DB.prepare(`
        INSERT INTO user_preferences (
          user_id, push_notifications, push_subscription
        ) VALUES (?, ?, ?)
        ON CONFLICT(user_id) DO UPDATE SET
          push_notifications = ?,
          push_subscription = ?,
          updated_at = CURRENT_TIMESTAMP
      `).bind(
        userId,
        true,
        JSON.stringify(subscription),
        true,
        JSON.stringify(subscription)
      ).run()

      console.log('✅ Push subscription saved for user:', userId)
      return true
    } catch (error) {
      console.error('❌ Failed to save push subscription:', error)
      return false
    }
  }

  /**
   * Format notification data for different channels
   */
  private formatNotificationData(data: NotificationData): any {
    const urgencyEmoji = { low: '🟢', medium: '🟡', high: '🔴' }[data.urgency || 'medium']
    const actionEmoji = data.action === 'BUY' ? '📈' : data.action === 'SELL' ? '📉' : '⏸️'
    
    return {
      title: `${actionEmoji} ${data.symbol} - ${data.action} Signal`,
      body: `${urgencyEmoji} ${data.confidence}% confidence • $${data.entryPrice?.toFixed(2)}`,
      symbol: data.symbol,
      action: data.action,
      confidence: data.confidence,
      entryPrice: data.entryPrice,
      targetPrice: data.targetPrice,
      stopLoss: data.stopLoss,
      reason: data.reason,
      urgency: data.urgency,
      riskLevel: data.riskLevel
    }
  }

  /**
   * Generate HTML email content
   */
  private generateEmailHTML(data: any): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5; }
          .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center; }
          .content { padding: 30px; }
          .recommendation { background: #f8f9fa; border-radius: 8px; padding: 20px; margin: 20px 0; border-left: 4px solid #007bff; }
          .price { font-size: 24px; font-weight: bold; color: #28a745; }
          .footer { background: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📈 AI Trading Recommendation</h1>
            <p>Your personal AI advisor has new insights</p>
          </div>
          <div class="content">
            <div class="recommendation">
              <h2>${data.title}</h2>
              <p><strong>Action:</strong> ${data.action}</p>
              <p><strong>Confidence:</strong> ${data.confidence}%</p>
              <p class="price">Entry Price: $${data.entryPrice?.toFixed(2)}</p>
              ${data.targetPrice ? `<p><strong>Target:</strong> $${data.targetPrice.toFixed(2)}</p>` : ''}
              ${data.stopLoss ? `<p><strong>Stop Loss:</strong> $${data.stopLoss.toFixed(2)}</p>` : ''}
              <p><strong>Risk Level:</strong> ${data.riskLevel?.toUpperCase()}</p>
              <p><strong>Reasoning:</strong> ${data.reason}</p>
            </div>
            <p>This is a personalized recommendation based on your portfolio and risk preferences.</p>
            <p><a href="https://your-app-domain.com" style="background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">View Full Analysis</a></p>
          </div>
          <div class="footer">
            <p>AI Trader Advisor • Powered by advanced market analysis</p>
            <p>This is an automated message. Please do not reply to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `
  }

  /**
   * Format Telegram message (existing implementation)
   */
  private formatTelegramMessage(data: any): string {
    const urgencyEmoji = { low: '🟢', medium: '🟡', high: '🔴' }[data.urgency || 'medium']
    const actionEmoji = data.action === 'BUY' ? '📈' : data.action === 'SELL' ? '📉' : '⏸️'
    
    return `${actionEmoji} **AI RECOMMENDATION**

🏷️ **Symbol**: ${data.symbol}
⚡ **Action**: ${data.action}
📊 **Confidence**: ${data.confidence}%
💰 **Entry Price**: $${data.entryPrice?.toFixed(2)}
${data.targetPrice ? `🎯 **Target**: $${data.targetPrice.toFixed(2)}\n` : ''}${data.stopLoss ? `🛑 **Stop Loss**: $${data.stopLoss.toFixed(2)}\n` : ''}
${urgencyEmoji} **Risk Level**: ${data.riskLevel?.toUpperCase()}

💡 **Reason**: ${data.reason}

⚠️ *Personal recommendation for your portfolio*
🤖 *AI Trader Advisor*`
  }
}