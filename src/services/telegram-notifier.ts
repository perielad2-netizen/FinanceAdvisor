// Telegram Notification Service for Trading Recommendations
import type { Bindings } from '../types'

export interface TelegramMessage {
  chat_id: string
  text: string
  parse_mode?: 'HTML' | 'Markdown' | 'MarkdownV2'
  disable_web_page_preview?: boolean
  disable_notification?: boolean
}

export interface RecommendationNotification {
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

export interface MarketAlert {
  type: 'market_open' | 'market_close' | 'high_volatility' | 'breaking_news'
  title: string
  message: string
  severity: 'info' | 'warning' | 'alert'
}

export class TelegramNotifier {
  private botToken: string
  private chatId: string

  constructor(private env: Bindings) {
    this.botToken = env.TELEGRAM_BOT_TOKEN || ''
    this.chatId = env.TELEGRAM_CHAT_ID || ''
  }

  /**
   * Send trading recommendation via Telegram
   */
  async sendRecommendationAlert(recommendation: RecommendationNotification): Promise<boolean> {
    if (!this.botToken || !this.chatId) {
      console.log('⚠️ Telegram bot not configured, skipping notification')
      return false
    }

    try {
      const message = this.formatRecommendationMessage(recommendation)
      await this.sendMessage(message)
      
      console.log(`📱 Telegram notification sent for ${recommendation.symbol} ${recommendation.action}`)
      return true
    } catch (error) {
      console.error('❌ Telegram notification failed:', error)
      return false
    }
  }

  /**
   * Send market alert via Telegram
   */
  async sendMarketAlert(alert: MarketAlert): Promise<boolean> {
    if (!this.botToken || !this.chatId) {
      console.log('⚠️ Telegram bot not configured, skipping alert')
      return false
    }

    try {
      const message = this.formatMarketAlert(alert)
      await this.sendMessage(message)
      
      console.log(`📱 Market alert sent: ${alert.type}`)
      return true
    } catch (error) {
      console.error('❌ Market alert failed:', error)
      return false
    }
  }

  /**
   * Send batch recommendations summary
   */
  async sendBatchSummary(results: {
    portfolioId: string
    totalRecommendations: number
    buySignals: number
    sellSignals: number
    highConfidenceCount: number
    topRecommendations: RecommendationNotification[]
  }): Promise<boolean> {
    if (!this.botToken || !this.chatId) return false

    try {
      const message = this.formatBatchSummary(results)
      await this.sendMessage(message)
      
      console.log(`📱 Batch summary sent: ${results.totalRecommendations} recommendations`)
      return true
    } catch (error) {
      console.error('❌ Batch summary failed:', error)
      return false
    }
  }

  /**
   * Send daily market summary
   */
  async sendDailyMarketSummary(summary: {
    marketRegime: string
    vixLevel: number
    spyChange: number
    topPerformers: Array<{ symbol: string, change: number }>
    recommendations: number
  }): Promise<boolean> {
    if (!this.botToken || !this.chatId) return false

    try {
      const message = this.formatDailyMarketSummary(summary)
      await this.sendMessage(message)
      
      console.log('📱 Daily market summary sent')
      return true
    } catch (error) {
      console.error('❌ Daily summary failed:', error)
      return false
    }
  }

  /**
   * Test Telegram connection
   */
  async testConnection(): Promise<{ success: boolean, botInfo?: any, error?: string }> {
    if (!this.botToken) {
      return { success: false, error: 'No bot token configured' }
    }

    try {
      const response = await fetch(`https://api.telegram.org/bot${this.botToken}/getMe`)
      const data = await response.json()
      
      if (data.ok) {
        // Send test message
        await this.sendMessage({
          chat_id: this.chatId,
          text: '🤖 <b>Trading Bot Test</b>\\n\\n✅ Connection successful!\\nYour Real-Time Trader Advisor is now connected and ready to send notifications.',
          parse_mode: 'HTML'
        })
        
        return { 
          success: true, 
          botInfo: {
            id: data.result.id,
            username: data.result.username,
            firstName: data.result.first_name
          }
        }
      } else {
        return { success: false, error: data.description }
      }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  /**
   * Send message to Telegram
   */
  private async sendMessage(message: TelegramMessage | string): Promise<any> {
    const messageData: TelegramMessage = typeof message === 'string' 
      ? { chat_id: this.chatId, text: message }
      : { chat_id: this.chatId, ...message }

    const response = await fetch(`https://api.telegram.org/bot${this.botToken}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(messageData)
    })

    const data = await response.json()
    
    if (!data.ok) {
      throw new Error(`Telegram API error: ${data.description}`)
    }
    
    return data
  }

  /**
   * Format trading recommendation message
   */
  private formatRecommendationMessage(rec: RecommendationNotification): TelegramMessage {
    const urgencyEmoji = rec.urgency === 'high' ? '🔥' : rec.urgency === 'medium' ? '⚡' : '📊'
    const actionEmoji = rec.action === 'BUY' ? '🟢' : rec.action.includes('SELL') ? '🔴' : '🔵'
    const riskEmoji = rec.riskLevel === 'high' ? '⚠️' : rec.riskLevel === 'medium' ? '🟡' : '🟢'
    
    const text = `${urgencyEmoji} <b>TRADING SIGNAL</b> ${actionEmoji}

<b>Symbol:</b> ${rec.symbol}
<b>Action:</b> ${rec.action}
<b>Risk Level:</b> ${riskEmoji} ${rec.riskLevel.toUpperCase()}
<b>Confidence:</b> ${(rec.confidence * 100).toFixed(0)}%

💰 <b>Price Levels:</b>
• Entry: $${rec.entryPrice.toFixed(2)}${rec.targetPrice ? `
• Target: $${rec.targetPrice.toFixed(2)}` : ''}${rec.stopLoss ? `
• Stop Loss: $${rec.stopLoss.toFixed(2)}` : ''}

📝 <b>Reasoning:</b>
${rec.reason}

⏰ <i>${new Date().toLocaleString()}</i>`

    return {
      chat_id: this.chatId,
      text,
      parse_mode: 'HTML',
      disable_web_page_preview: true
    }
  }

  /**
   * Format market alert message
   */
  private formatMarketAlert(alert: MarketAlert): TelegramMessage {
    const severityEmoji = alert.severity === 'alert' ? '🚨' : alert.severity === 'warning' ? '⚠️' : 'ℹ️'
    
    const text = `${severityEmoji} <b>${alert.title}</b>

${alert.message}

⏰ <i>${new Date().toLocaleString()}</i>`

    return {
      chat_id: this.chatId,
      text,
      parse_mode: 'HTML',
      disable_web_page_preview: true
    }
  }

  /**
   * Format batch summary message
   */
  private formatBatchSummary(results: any): TelegramMessage {
    const text = `📊 <b>TRADING SESSION SUMMARY</b>

<b>Total Recommendations:</b> ${results.totalRecommendations}
🟢 <b>Buy Signals:</b> ${results.buySignals}
🔴 <b>Sell Signals:</b> ${results.sellSignals}
⭐ <b>High Confidence:</b> ${results.highConfidenceCount}

${results.topRecommendations.length > 0 ? `
<b>🔥 TOP RECOMMENDATIONS:</b>
${results.topRecommendations.slice(0, 3).map((rec: any) => 
  `• ${rec.symbol} ${rec.action} (${(rec.confidence * 100).toFixed(0)}%)`
).join('\\n')}` : ''}

⏰ <i>${new Date().toLocaleString()}</i>`

    return {
      chat_id: this.chatId,
      text,
      parse_mode: 'HTML',
      disable_web_page_preview: true
    }
  }

  /**
   * Format daily market summary
   */
  private formatDailyMarketSummary(summary: any): TelegramMessage {
    const regimeEmoji = summary.marketRegime === 'bull' ? '🐂' : summary.marketRegime === 'bear' ? '🐻' : '📈'
    
    const text = `🌅 <b>DAILY MARKET SUMMARY</b>

${regimeEmoji} <b>Market Regime:</b> ${summary.marketRegime.toUpperCase()}
📊 <b>VIX Level:</b> ${summary.vixLevel.toFixed(1)}
📈 <b>S&P 500:</b> ${summary.spyChange >= 0 ? '+' : ''}${summary.spyChange.toFixed(2)}%

${summary.topPerformers.length > 0 ? `
🚀 <b>TOP PERFORMERS:</b>
${summary.topPerformers.map((perf: any) => 
  `• ${perf.symbol}: ${perf.change >= 0 ? '+' : ''}${perf.change.toFixed(1)}%`
).join('\\n')}` : ''}

🤖 <b>AI Recommendations Generated:</b> ${summary.recommendations}

⏰ <i>${new Date().toLocaleString()}</i>`

    return {
      chat_id: this.chatId,
      text,
      parse_mode: 'HTML',
      disable_web_page_preview: true
    }
  }

  /**
   * Send portfolio performance update
   */
  async sendPortfolioUpdate(update: {
    portfolioId: string
    totalValue: number
    dayChange: number
    dayChangePercent: number
    topPosition: { symbol: string, pnl: number, pnlPercent: number }
    worstPosition: { symbol: string, pnl: number, pnlPercent: number }
  }): Promise<boolean> {
    if (!this.botToken || !this.chatId) return false

    try {
      const changeEmoji = update.dayChange >= 0 ? '🟢' : '🔴'
      
      const text = `💼 <b>PORTFOLIO UPDATE</b>

<b>Total Value:</b> $${update.totalValue.toLocaleString()}
${changeEmoji} <b>Today:</b> ${update.dayChange >= 0 ? '+' : ''}$${Math.abs(update.dayChange).toLocaleString()} (${update.dayChangePercent >= 0 ? '+' : ''}${update.dayChangePercent.toFixed(2)}%)

🏆 <b>Best Position:</b> ${update.topPosition.symbol}
• P&L: ${update.topPosition.pnl >= 0 ? '+' : ''}$${update.topPosition.pnl.toFixed(0)} (${update.topPosition.pnlPercent >= 0 ? '+' : ''}${update.topPosition.pnlPercent.toFixed(1)}%)

📉 <b>Worst Position:</b> ${update.worstPosition.symbol}
• P&L: ${update.worstPosition.pnl >= 0 ? '+' : ''}$${update.worstPosition.pnl.toFixed(0)} (${update.worstPosition.pnlPercent >= 0 ? '+' : ''}${update.worstPosition.pnlPercent.toFixed(1)}%)

⏰ <i>${new Date().toLocaleString()}</i>`

      await this.sendMessage({
        chat_id: this.chatId,
        text,
        parse_mode: 'HTML',
        disable_web_page_preview: true
      })
      
      return true
    } catch (error) {
      console.error('❌ Portfolio update failed:', error)
      return false
    }
  }
}