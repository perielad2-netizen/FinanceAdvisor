import { Hono } from 'hono'
import type { Bindings, Variables, APIResponse } from '../types'
import { PersonalTelegramNotifier } from '../services/personal-telegram-notifier'

export const personalTelegramRoutes = new Hono<{ Bindings: Bindings; Variables: Variables }>()

// Get user's personal Telegram settings
personalTelegramRoutes.get('/settings', async (c) => {
  try {
    // Get auth token from cookie
    const { getCookie } = await import('hono/cookie')
    const token = getCookie(c, 'auth-token')
    
    if (!token) {
      return c.json<APIResponse>({ success: false, error: 'Not authenticated' }, 401)
    }

    let payload
    try {
      payload = JSON.parse(atob(token))
    } catch (error) {
      return c.json<APIResponse>({ success: false, error: 'Invalid token' }, 401)
    }

    // Check if token is expired
    if (payload.exp < Date.now()) {
      return c.json<APIResponse>({ success: false, error: 'Token expired' }, 401)
    }

    const telegramService = new PersonalTelegramNotifier(c.env)
    const settings = await telegramService.getUserTelegramSettings(payload.user_id)

    return c.json<APIResponse>({ 
      success: true, 
      data: settings || {
        userId: payload.user_id,
        botToken: '',
        chatId: '',
        enabled: false,
        autoSchedulerEnabled: false,
        recommendationFrequency: 120,
        riskAllocation: { high: 20, medium: 30, low: 50 }
      }
    })
  } catch (error) {
    console.error('Error fetching Telegram settings:', error)
    return c.json<APIResponse>({ success: false, error: 'Failed to fetch settings' }, 500)
  }
})

// Save user's personal Telegram settings
personalTelegramRoutes.post('/settings', async (c) => {
  try {
    // Get auth token from cookie
    const { getCookie } = await import('hono/cookie')
    const token = getCookie(c, 'auth-token')
    
    if (!token) {
      return c.json<APIResponse>({ success: false, error: 'Not authenticated' }, 401)
    }

    let payload
    try {
      payload = JSON.parse(atob(token))
    } catch (error) {
      return c.json<APIResponse>({ success: false, error: 'Invalid token' }, 401)
    }

    const { 
      botToken, 
      chatId, 
      enabled, 
      autoSchedulerEnabled, 
      recommendationFrequency, 
      riskAllocation 
    } = await c.req.json()

    const settings = {
      userId: payload.user_id,
      botToken: botToken?.trim(),
      chatId: chatId?.trim(),
      enabled: Boolean(enabled),
      autoSchedulerEnabled: Boolean(autoSchedulerEnabled),
      recommendationFrequency: parseInt(recommendationFrequency) || 120,
      riskAllocation: riskAllocation || { high: 20, medium: 30, low: 50 }
    }

    const telegramService = new PersonalTelegramNotifier(c.env)
    const success = await telegramService.saveUserTelegramSettings(settings)

    if (success) {
      return c.json<APIResponse>({ success: true, data: { message: 'Settings saved successfully' } })
    } else {
      return c.json<APIResponse>({ success: false, error: 'Failed to save settings' }, 500)
    }
  } catch (error) {
    console.error('Error saving Telegram settings:', error)
    return c.json<APIResponse>({ success: false, error: 'Failed to save settings' }, 500)
  }
})

// Test user's personal Telegram connection
personalTelegramRoutes.post('/test', async (c) => {
  try {
    // Get auth token from cookie
    const { getCookie } = await import('hono/cookie')
    const token = getCookie(c, 'auth-token')
    
    if (!token) {
      return c.json<APIResponse>({ success: false, error: 'Not authenticated' }, 401)
    }

    let payload
    try {
      payload = JSON.parse(atob(token))
    } catch (error) {
      return c.json<APIResponse>({ success: false, error: 'Invalid token' }, 401)
    }

    const telegramService = new PersonalTelegramNotifier(c.env)
    const result = await telegramService.testUserConnection(payload.user_id)

    return c.json<APIResponse>({ 
      success: result.success, 
      data: { message: result.message },
      error: result.success ? undefined : result.message
    })
  } catch (error) {
    console.error('Error testing Telegram:', error)
    return c.json<APIResponse>({ success: false, error: 'Failed to test connection' }, 500)
  }
})

// Send personal recommendation to user
personalTelegramRoutes.post('/send-recommendation', async (c) => {
  try {
    // Get auth token from cookie
    const { getCookie } = await import('hono/cookie')
    const token = getCookie(c, 'auth-token')
    
    if (!token) {
      return c.json<APIResponse>({ success: false, error: 'Not authenticated' }, 401)
    }

    let payload
    try {
      payload = JSON.parse(atob(token))
    } catch (error) {
      return c.json<APIResponse>({ success: false, error: 'Invalid token' }, 401)
    }

    const recommendation = await c.req.json()
    
    const personalRecommendation = {
      userId: payload.user_id,
      portfolioId: recommendation.portfolioId,
      symbol: recommendation.symbol,
      action: recommendation.action,
      confidence: recommendation.confidence,
      entryPrice: recommendation.entryPrice,
      targetPrice: recommendation.targetPrice,
      stopLoss: recommendation.stopLoss,
      reason: recommendation.reason,
      urgency: recommendation.urgency || 'medium',
      riskLevel: recommendation.riskLevel || 'medium'
    }

    const telegramService = new PersonalTelegramNotifier(c.env)
    const success = await telegramService.sendPersonalRecommendation(personalRecommendation)

    return c.json<APIResponse>({ 
      success, 
      data: { sent: success },
      error: success ? undefined : 'Failed to send recommendation'
    })
  } catch (error) {
    console.error('Error sending personal recommendation:', error)
    return c.json<APIResponse>({ success: false, error: 'Failed to send recommendation' }, 500)
  }
})