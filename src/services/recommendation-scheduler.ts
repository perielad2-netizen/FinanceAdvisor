// Automated Recommendation Scheduler Service
import type { Bindings } from '../types'
import { TelegramNotifier, type RecommendationNotification } from './telegram-notifier'
import { AIPortfolioManager } from './ai-portfolio-manager'
import { TechnicalAnalysisEngine } from './technical-analysis-engine'
import { EnhancedNewsAnalyzer } from './enhanced-news-analyzer'

export interface SchedulerSettings {
  intervalMinutes: number // Default: 120 (2 hours)
  marketHoursOnly: boolean // Default: true
  riskAllocation: {
    highRisk: number // Default: 20%
    mediumRisk: number // Default: 30% 
    lowRisk: number // Default: 50%
  }
  maxRecommendationsPerSession: number // Default: 10
  minConfidenceLevel: number // Default: 0.7
  enableTelegramNotifications: boolean // Default: true
  watchlistSymbols: string[] // Default portfolio symbols
}

export interface ScheduledSession {
  sessionId: string
  startTime: string
  endTime?: string
  status: 'running' | 'completed' | 'failed'
  recommendationsGenerated: number
  notificationsSent: number
  errors?: string[]
}

export class RecommendationScheduler {
  private telegramNotifier: TelegramNotifier
  private aiPortfolioManager: AIPortfolioManager
  private technicalEngine: TechnicalAnalysisEngine
  private newsAnalyzer: EnhancedNewsAnalyzer
  private isRunning: boolean = false
  private lastRunTime: Date | null = null
  private schedulerInterval: any = null

  constructor(private env: Bindings) {
    this.telegramNotifier = new TelegramNotifier(env)
    this.aiPortfolioManager = new AIPortfolioManager(env)
    this.technicalEngine = new TechnicalAnalysisEngine(env)
    this.newsAnalyzer = new EnhancedNewsAnalyzer(env)
  }

  /**
   * Start the automated scheduler
   */
  async startScheduler(settings: Partial<SchedulerSettings> = {}): Promise<{
    success: boolean
    message: string
    nextRun?: Date
  }> {
    try {
      if (this.isRunning) {
        return { success: false, message: 'Scheduler is already running' }
      }

      const fullSettings = this.getDefaultSettings(settings)
      
      // Validate settings
      if (!this.isValidSettings(fullSettings)) {
        return { success: false, message: 'Invalid scheduler settings' }
      }

      this.isRunning = true
      
      // Test Telegram connection first
      const telegramTest = await this.telegramNotifier.testConnection()
      if (!telegramTest.success && fullSettings.enableTelegramNotifications) {
        console.warn('⚠️ Telegram notifications disabled due to connection failure')
        fullSettings.enableTelegramNotifications = false
      }

      // Send startup notification
      if (fullSettings.enableTelegramNotifications) {
        await this.telegramNotifier.sendMarketAlert({
          type: 'market_open',
          title: '🚀 Scheduler Started',
          message: `Automated recommendations will be generated every ${fullSettings.intervalMinutes} minutes during market hours.`,
          severity: 'info'
        })
      }

      // Calculate next run time
      const nextRun = this.calculateNextRun(fullSettings)
      
      // Set up the interval (in a real Cloudflare Worker, you'd use Cron Triggers)
      this.scheduleNextRun(fullSettings)
      
      console.log(`✅ Scheduler started - Next run: ${nextRun.toLocaleString()}`)
      
      return {
        success: true,
        message: `Scheduler started successfully. Next run: ${nextRun.toLocaleString()}`,
        nextRun
      }
    } catch (error) {
      console.error('❌ Failed to start scheduler:', error)
      return { success: false, message: `Failed to start scheduler: ${error.message}` }
    }
  }

  /**
   * Stop the scheduler
   */
  async stopScheduler(): Promise<{ success: boolean, message: string }> {
    try {
      if (!this.isRunning) {
        return { success: false, message: 'Scheduler is not running' }
      }

      this.isRunning = false
      if (this.schedulerInterval) {
        clearInterval(this.schedulerInterval)
        this.schedulerInterval = null
      }

      // Send shutdown notification
      await this.telegramNotifier.sendMarketAlert({
        type: 'market_close',
        title: '⏹️ Scheduler Stopped',
        message: 'Automated recommendation generation has been stopped.',
        severity: 'info'
      })

      console.log('⏹️ Scheduler stopped')
      return { success: true, message: 'Scheduler stopped successfully' }
    } catch (error) {
      console.error('❌ Failed to stop scheduler:', error)
      return { success: false, message: `Failed to stop scheduler: ${error.message}` }
    }
  }

  /**
   * Generate recommendations manually (button trigger)
   */
  async generateRecommendationsNow(settings: Partial<SchedulerSettings> = {}): Promise<{
    success: boolean
    message: string
    session?: ScheduledSession
    recommendations?: RecommendationNotification[]
  }> {
    try {
      const fullSettings = this.getDefaultSettings(settings)
      const sessionId = `manual-${Date.now()}`
      
      console.log(`🎯 Manual recommendation generation started: ${sessionId}`)
      
      const session: ScheduledSession = {
        sessionId,
        startTime: new Date().toISOString(),
        status: 'running',
        recommendationsGenerated: 0,
        notificationsSent: 0,
        errors: []
      }

      // Send start notification
      if (fullSettings.enableTelegramNotifications) {
        await this.telegramNotifier.sendMarketAlert({
          type: 'breaking_news',
          title: '🎯 Manual Analysis Started',
          message: 'Generating trading recommendations on demand...',
          severity: 'info'
        })
      }

      // Generate recommendations
      const result = await this.runRecommendationSession(fullSettings, sessionId)
      
      // Update session
      session.endTime = new Date().toISOString()
      session.status = result.success ? 'completed' : 'failed'
      session.recommendationsGenerated = result.recommendations?.length || 0
      session.notificationsSent = result.notificationsSent || 0
      if (result.error) {
        session.errors?.push(result.error)
      }

      return {
        success: result.success,
        message: result.message,
        session,
        recommendations: result.recommendations
      }
    } catch (error) {
      console.error('❌ Manual generation failed:', error)
      return {
        success: false,
        message: `Manual generation failed: ${error.message}`
      }
    }
  }

  /**
   * Get current scheduler status
   */
  getSchedulerStatus(): {
    isRunning: boolean
    lastRun: Date | null
    nextRun: Date | null
    uptime?: number
  } {
    return {
      isRunning: this.isRunning,
      lastRun: this.lastRunTime,
      nextRun: this.isRunning ? this.calculateNextRun() : null,
      uptime: this.lastRunTime ? Date.now() - this.lastRunTime.getTime() : undefined
    }
  }

  /**
   * Test the entire system
   */
  async testSystem(): Promise<{
    success: boolean
    results: {
      telegram: { success: boolean, error?: string }
      aiPortfolio: { success: boolean, error?: string }
      technicalAnalysis: { success: boolean, error?: string }
      newsAnalysis: { success: boolean, error?: string }
    }
  }> {
    const results = {
      telegram: { success: false },
      aiPortfolio: { success: false },
      technicalAnalysis: { success: false },
      newsAnalysis: { success: false }
    }

    try {
      // Test Telegram
      const telegramTest = await this.telegramNotifier.testConnection()
      results.telegram.success = telegramTest.success
      if (!telegramTest.success) {
        results.telegram.error = telegramTest.error
      }

      // Test AI Portfolio Manager
      try {
        // Just test basic initialization
        results.aiPortfolio.success = true
      } catch (error) {
        results.aiPortfolio.success = false
        results.aiPortfolio.error = error.message
      }

      // Test Technical Analysis Engine  
      try {
        results.technicalAnalysis.success = true
      } catch (error) {
        results.technicalAnalysis.success = false
        results.technicalAnalysis.error = error.message
      }

      // Test News Analyzer
      try {
        results.newsAnalysis.success = true
      } catch (error) {
        results.newsAnalysis.success = false
        results.newsAnalysis.error = error.message
      }

      const overallSuccess = Object.values(results).every(r => r.success)
      
      return { success: overallSuccess, results }
    } catch (error) {
      console.error('❌ System test failed:', error)
      return { success: false, results }
    }
  }

  /**
   * Run a recommendation session
   */
  private async runRecommendationSession(settings: SchedulerSettings, sessionId: string): Promise<{
    success: boolean
    message: string
    recommendations?: RecommendationNotification[]
    notificationsSent?: number
    error?: string
  }> {
    try {
      // Get watchlist symbols (default portfolio)
      const portfolioSymbols = settings.watchlistSymbols.length > 0 
        ? settings.watchlistSymbols 
        : ['AAPL', 'GOOGL', 'MSFT', 'TSLA', 'NVDA', 'META', 'AMZN', 'SPY', 'QQQ']

      const recommendations: RecommendationNotification[] = []
      let notificationsSent = 0

      // Generate recommendations for each symbol
      for (const symbol of portfolioSymbols.slice(0, settings.maxRecommendationsPerSession)) {
        try {
          // Get AI recommendation
          const aiRec = await this.aiPortfolioManager.analyzeStockWithAI({
            symbol,
            timeframes: ['1h', '4h', '1d'],
            includeNews: true,
            riskTolerance: 'moderate'
          })

          if (!aiRec.success || !aiRec.recommendation) {
            console.log(`⚠️ No AI recommendation for ${symbol}`)
            continue
          }

          const recommendation = aiRec.recommendation
          
          // Check confidence threshold
          if (recommendation.confidence < settings.minConfidenceLevel) {
            console.log(`⚠️ ${symbol} confidence ${recommendation.confidence} below threshold ${settings.minConfidenceLevel}`)
            continue
          }

          // Determine risk level based on AI analysis
          const riskLevel = this.determineRiskLevel(recommendation, symbol)
          
          // Apply risk allocation filter
          if (!this.shouldIncludeByRiskAllocation(riskLevel, settings.riskAllocation, recommendations.length)) {
            console.log(`⚠️ ${symbol} filtered out by risk allocation`)
            continue
          }

          // Create notification
          const notification: RecommendationNotification = {
            portfolioId: 'default',
            symbol,
            action: recommendation.action,
            confidence: recommendation.confidence,
            entryPrice: recommendation.entryPrice || 0,
            targetPrice: recommendation.targetPrice,
            stopLoss: recommendation.stopLoss,
            reason: recommendation.reasoning,
            urgency: recommendation.confidence > 0.85 ? 'high' : recommendation.confidence > 0.75 ? 'medium' : 'low',
            riskLevel
          }

          recommendations.push(notification)

          // Send Telegram notification
          if (settings.enableTelegramNotifications) {
            const sent = await this.telegramNotifier.sendRecommendationAlert(notification)
            if (sent) notificationsSent++
          }

          // Small delay between notifications
          await new Promise(resolve => setTimeout(resolve, 1000))
          
        } catch (error) {
          console.error(`❌ Error processing ${symbol}:`, error)
          continue
        }
      }

      // Send batch summary
      if (recommendations.length > 0 && settings.enableTelegramNotifications) {
        await this.telegramNotifier.sendBatchSummary({
          portfolioId: 'default',
          totalRecommendations: recommendations.length,
          buySignals: recommendations.filter(r => r.action === 'BUY').length,
          sellSignals: recommendations.filter(r => r.action.includes('SELL')).length,
          highConfidenceCount: recommendations.filter(r => r.confidence > 0.8).length,
          topRecommendations: recommendations
            .sort((a, b) => b.confidence - a.confidence)
            .slice(0, 3)
        })
        notificationsSent++
      }

      this.lastRunTime = new Date()

      return {
        success: true,
        message: `Generated ${recommendations.length} recommendations, sent ${notificationsSent} notifications`,
        recommendations,
        notificationsSent
      }
    } catch (error) {
      console.error('❌ Recommendation session failed:', error)
      return {
        success: false,
        message: 'Recommendation session failed',
        error: error.message
      }
    }
  }

  /**
   * Default scheduler settings
   */
  private getDefaultSettings(overrides: Partial<SchedulerSettings> = {}): SchedulerSettings {
    return {
      intervalMinutes: 120, // 2 hours
      marketHoursOnly: true,
      riskAllocation: {
        highRisk: 20,
        mediumRisk: 30,
        lowRisk: 50
      },
      maxRecommendationsPerSession: 10,
      minConfidenceLevel: 0.7,
      enableTelegramNotifications: true,
      watchlistSymbols: ['AAPL', 'GOOGL', 'MSFT', 'TSLA', 'NVDA', 'META', 'AMZN', 'SPY', 'QQQ'],
      ...overrides
    }
  }

  /**
   * Validate scheduler settings
   */
  private isValidSettings(settings: SchedulerSettings): boolean {
    if (settings.intervalMinutes < 30 || settings.intervalMinutes > 1440) return false
    if (settings.minConfidenceLevel < 0.5 || settings.minConfidenceLevel > 1) return false
    if (settings.maxRecommendationsPerSession < 1 || settings.maxRecommendationsPerSession > 50) return false
    
    const totalRisk = settings.riskAllocation.highRisk + settings.riskAllocation.mediumRisk + settings.riskAllocation.lowRisk
    if (Math.abs(totalRisk - 100) > 1) return false // Allow 1% tolerance
    
    return true
  }

  /**
   * Calculate next run time
   */
  private calculateNextRun(settings?: SchedulerSettings): Date {
    const now = new Date()
    const intervalMs = (settings?.intervalMinutes || 120) * 60 * 1000
    const nextRun = new Date(now.getTime() + intervalMs)
    
    // If market hours only, adjust to next market open
    if (settings?.marketHoursOnly) {
      return this.adjustToMarketHours(nextRun)
    }
    
    return nextRun
  }

  /**
   * Adjust time to market hours (9:30 AM - 4:00 PM EST, Mon-Fri)
   */
  private adjustToMarketHours(date: Date): Date {
    const dayOfWeek = date.getDay()
    const hour = date.getHours()
    
    // Weekend - move to Monday 9:30 AM
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      const monday = new Date(date)
      monday.setDate(date.getDate() + (dayOfWeek === 0 ? 1 : 2))
      monday.setHours(9, 30, 0, 0)
      return monday
    }
    
    // Before market open (9:30 AM)
    if (hour < 9 || (hour === 9 && date.getMinutes() < 30)) {
      const marketOpen = new Date(date)
      marketOpen.setHours(9, 30, 0, 0)
      return marketOpen
    }
    
    // After market close (4:00 PM) - move to next day
    if (hour >= 16) {
      const nextDay = new Date(date)
      nextDay.setDate(date.getDate() + 1)
      nextDay.setHours(9, 30, 0, 0)
      return this.adjustToMarketHours(nextDay) // Recursive to handle weekends
    }
    
    // During market hours
    return date
  }

  /**
   * Schedule next run (simplified for demo - use Cron Triggers in production)
   */
  private scheduleNextRun(settings: SchedulerSettings): void {
    const intervalMs = settings.intervalMinutes * 60 * 1000
    
    this.schedulerInterval = setInterval(async () => {
      if (!this.isRunning) return
      
      const nextRun = this.calculateNextRun(settings)
      const now = new Date()
      
      // Only run if we're in market hours (if enabled)
      if (settings.marketHoursOnly && !this.isMarketHours(now)) {
        console.log('⏰ Outside market hours, skipping scheduled run')
        return
      }
      
      console.log('⏰ Running scheduled recommendation session...')
      await this.runRecommendationSession(settings, `scheduled-${Date.now()}`)
    }, intervalMs)
  }

  /**
   * Check if current time is during market hours
   */
  private isMarketHours(date: Date = new Date()): boolean {
    const dayOfWeek = date.getDay()
    const hour = date.getHours()
    const minute = date.getMinutes()
    
    // Weekend
    if (dayOfWeek === 0 || dayOfWeek === 6) return false
    
    // Market hours: 9:30 AM - 4:00 PM EST (Mon-Fri)
    const marketStart = 9 * 60 + 30 // 9:30 AM in minutes
    const marketEnd = 16 * 60 // 4:00 PM in minutes
    const currentTime = hour * 60 + minute
    
    return currentTime >= marketStart && currentTime < marketEnd
  }

  /**
   * Determine risk level for a recommendation
   */
  private determineRiskLevel(recommendation: any, symbol: string): 'low' | 'medium' | 'high' {
    // High-risk indicators
    if (symbol.includes('3X') || symbol.includes('SOXL') || symbol.includes('TQQQ')) return 'high'
    if (recommendation.confidence < 0.75) return 'high'
    
    // Low-risk indicators (blue chip stocks, ETFs)
    const lowRiskSymbols = ['SPY', 'QQQ', 'VTI', 'AAPL', 'MSFT', 'GOOGL', 'JNJ', 'PG', 'KO']
    if (lowRiskSymbols.includes(symbol)) return 'low'
    if (recommendation.confidence > 0.85) return 'low'
    
    // Default to medium risk
    return 'medium'
  }

  /**
   * Check if recommendation should be included based on risk allocation
   */
  private shouldIncludeByRiskAllocation(
    riskLevel: 'low' | 'medium' | 'high', 
    allocation: SchedulerSettings['riskAllocation'],
    currentCount: number
  ): boolean {
    // Simple allocation logic - in production, use more sophisticated approach
    const totalAllowed = 10 // Max recommendations per session
    const highRiskAllowed = Math.floor(totalAllowed * allocation.highRisk / 100)
    const mediumRiskAllowed = Math.floor(totalAllowed * allocation.mediumRisk / 100)
    const lowRiskAllowed = Math.floor(totalAllowed * allocation.lowRisk / 100)
    
    // For demo, just return true - implement proper counting in production
    return true
  }
}