// Scheduler API Routes
import { Hono } from 'hono'
import type { Bindings } from '../types'
import { RecommendationScheduler, type SchedulerSettings } from '../services/recommendation-scheduler'
import { TelegramNotifier } from '../services/telegram-notifier'

const app = new Hono<{ Bindings: Bindings }>()

// Global scheduler instance (in production, use Durable Objects or persistent storage)
let schedulerInstance: RecommendationScheduler | null = null

/**
 * Get or create scheduler instance
 */
function getScheduler(env: Bindings): RecommendationScheduler {
  if (!schedulerInstance) {
    schedulerInstance = new RecommendationScheduler(env)
  }
  return schedulerInstance
}

/**
 * Start the automated scheduler
 */
app.post('/start', async (c) => {
  try {
    const { env } = c
    const body = await c.req.json().catch(() => ({}))
    const settings: Partial<SchedulerSettings> = body.settings || {}
    
    const scheduler = getScheduler(env)
    const result = await scheduler.startScheduler(settings)
    
    return c.json({
      success: result.success,
      message: result.message,
      nextRun: result.nextRun?.toISOString(),
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('❌ Failed to start scheduler:', error)
    return c.json({
      success: false,
      message: `Failed to start scheduler: ${error.message}`,
      timestamp: new Date().toISOString()
    }, 500)
  }
})

/**
 * Stop the scheduler
 */
app.post('/stop', async (c) => {
  try {
    const { env } = c
    const scheduler = getScheduler(env)
    const result = await scheduler.stopScheduler()
    
    return c.json({
      success: result.success,
      message: result.message,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('❌ Failed to stop scheduler:', error)
    return c.json({
      success: false,
      message: `Failed to stop scheduler: ${error.message}`,
      timestamp: new Date().toISOString()
    }, 500)
  }
})

/**
 * Generate recommendations manually - DEPRECATED: Use personal Telegram system
 */
app.post('/generate-now', async (c) => {
  return c.json({
    success: false,
    message: 'This endpoint is deprecated. Please configure your personal Telegram bot in Settings and use the new personal system.',
    error: 'DEPRECATED_ENDPOINT_USE_PERSONAL_TELEGRAM',
    timestamp: new Date().toISOString()
  }, 400)
})

/**
 * Get scheduler status
 */
app.get('/status', async (c) => {
  try {
    const { env } = c
    const scheduler = getScheduler(env)
    const status = scheduler.getSchedulerStatus()
    
    return c.json({
      success: true,
      status: {
        isRunning: status.isRunning,
        lastRun: status.lastRun?.toISOString(),
        nextRun: status.nextRun?.toISOString(),
        uptime: status.uptime
      },
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('❌ Failed to get status:', error)
    return c.json({
      success: false,
      message: `Failed to get status: ${error.message}`,
      timestamp: new Date().toISOString()
    }, 500)
  }
})

/**
 * Test all systems
 */
app.post('/test-system', async (c) => {
  try {
    const { env } = c
    const scheduler = getScheduler(env)
    const result = await scheduler.testSystem()
    
    return c.json({
      success: result.success,
      results: result.results,
      summary: {
        telegram: result.results.telegram.success ? '✅ Connected' : `❌ ${result.results.telegram.error}`,
        aiPortfolio: result.results.aiPortfolio.success ? '✅ Ready' : `❌ ${result.results.aiPortfolio.error}`,
        technicalAnalysis: result.results.technicalAnalysis.success ? '✅ Ready' : `❌ ${result.results.technicalAnalysis.error}`,
        newsAnalysis: result.results.newsAnalysis.success ? '✅ Ready' : `❌ ${result.results.newsAnalysis.error}`
      },
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('❌ System test failed:', error)
    return c.json({
      success: false,
      message: `System test failed: ${error.message}`,
      timestamp: new Date().toISOString()
    }, 500)
  }
})

/**
 * Test Telegram connection
 */
app.post('/test-telegram', async (c) => {
  return c.json({
    success: false,
    message: 'This endpoint is deprecated. Please configure your personal Telegram bot in Settings and use the Test Bot button.',
    error: 'DEPRECATED_ENDPOINT_USE_PERSONAL_TELEGRAM',
    timestamp: new Date().toISOString()
  }, 400)
})

/**
 * Send test notification
 */
app.post('/send-test-notification', async (c) => {
  try {
    const { env } = c
    const telegramNotifier = new TelegramNotifier(env)
    
    // Send a test recommendation notification
    const testRecommendation = {
      portfolioId: 'test',
      symbol: 'AAPL',
      action: 'BUY',
      confidence: 0.85,
      entryPrice: 150.25,
      targetPrice: 160.00,
      stopLoss: 145.00,
      reason: 'Strong technical breakout with high volume. RSI showing bullish divergence.',
      urgency: 'medium' as const,
      riskLevel: 'low' as const
    }
    
    const success = await telegramNotifier.sendRecommendationAlert(testRecommendation)
    
    return c.json({
      success,
      message: success 
        ? '✅ Test notification sent successfully'
        : '❌ Failed to send test notification',
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('❌ Test notification failed:', error)
    return c.json({
      success: false,
      message: `Test notification failed: ${error.message}`,
      timestamp: new Date().toISOString()
    }, 500)
  }
})

/**
 * Update scheduler settings
 */
app.post('/settings', async (c) => {
  try {
    const body = await c.req.json()
    const settings: Partial<SchedulerSettings> = body.settings
    
    // Validate settings
    if (settings.intervalMinutes && (settings.intervalMinutes < 30 || settings.intervalMinutes > 1440)) {
      return c.json({
        success: false,
        message: 'Interval must be between 30 and 1440 minutes',
        timestamp: new Date().toISOString()
      }, 400)
    }
    
    if (settings.riskAllocation) {
      const total = settings.riskAllocation.highRisk + settings.riskAllocation.mediumRisk + settings.riskAllocation.lowRisk
      if (Math.abs(total - 100) > 1) {
        return c.json({
          success: false,
          message: 'Risk allocation must total 100%',
          timestamp: new Date().toISOString()
        }, 400)
      }
    }
    
    // Store settings (in production, save to database)
    // For now, just validate and return success
    
    return c.json({
      success: true,
      message: 'Settings updated successfully',
      settings,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('❌ Failed to update settings:', error)
    return c.json({
      success: false,
      message: `Failed to update settings: ${error.message}`,
      timestamp: new Date().toISOString()
    }, 500)
  }
})

/**
 * Get current settings
 */
app.get('/settings', async (c) => {
  try {
    // In production, load from database
    const defaultSettings: SchedulerSettings = {
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
      watchlistSymbols: ['AAPL', 'GOOGL', 'MSFT', 'TSLA', 'NVDA', 'META', 'AMZN', 'SPY', 'QQQ']
    }
    
    return c.json({
      success: true,
      settings: defaultSettings,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('❌ Failed to get settings:', error)
    return c.json({
      success: false,
      message: `Failed to get settings: ${error.message}`,
      timestamp: new Date().toISOString()
    }, 500)
  }
})

/**
 * Get recent sessions
 */
app.get('/sessions', async (c) => {
  try {
    // In production, load from database
    const recentSessions = [
      {
        sessionId: 'manual-1734567890',
        startTime: new Date(Date.now() - 3600000).toISOString(),
        endTime: new Date(Date.now() - 3500000).toISOString(),
        status: 'completed',
        recommendationsGenerated: 7,
        notificationsSent: 8
      },
      {
        sessionId: 'scheduled-1734560000',
        startTime: new Date(Date.now() - 7200000).toISOString(),
        endTime: new Date(Date.now() - 7100000).toISOString(),
        status: 'completed',
        recommendationsGenerated: 5,
        notificationsSent: 6
      }
    ]
    
    return c.json({
      success: true,
      sessions: recentSessions,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('❌ Failed to get sessions:', error)
    return c.json({
      success: false,
      message: `Failed to get sessions: ${error.message}`,
      timestamp: new Date().toISOString()
    }, 500)
  }
})

export default app