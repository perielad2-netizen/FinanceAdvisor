import { Hono } from 'hono'
import type { Bindings, Variables, APIResponse } from '../types'
import { NotificationService } from '../services/notification-service'

export const notificationsRoutes = new Hono<{ Bindings: Bindings; Variables: Variables }>()

// Helper function to get auth payload from cookie
function getAuthPayload(c: any) {
  const { getCookie } = require('hono/cookie')
  const token = getCookie(c, 'auth-token')
  
  if (!token) {
    return null
  }

  try {
    const payload = JSON.parse(atob(token))
    if (payload.exp < Date.now()) {
      return null
    }
    return payload
  } catch (error) {
    return null
  }
}

// Subscribe to push notifications
notificationsRoutes.post('/push/subscribe', async (c) => {
  try {
    const payload = getAuthPayload(c)
    if (!payload) {
      return c.json<APIResponse>({ success: false, error: 'Not authenticated' }, 401)
    }

    const subscription = await c.req.json()
    console.log('📱 Push subscription request for user:', payload.user_id)

    const notificationService = new NotificationService(c.env)
    const success = await notificationService.savePushSubscription(payload.user_id, subscription)

    if (success) {
      return c.json<APIResponse>({ 
        success: true, 
        data: { message: 'Push notifications enabled successfully' }
      })
    } else {
      return c.json<APIResponse>({ success: false, error: 'Failed to save subscription' }, 500)
    }
  } catch (error) {
    console.error('❌ Push subscription error:', error)
    return c.json<APIResponse>({ success: false, error: 'Failed to subscribe to push notifications' }, 500)
  }
})

// Unsubscribe from push notifications
notificationsRoutes.post('/push/unsubscribe', async (c) => {
  try {
    const payload = getAuthPayload(c)
    if (!payload) {
      return c.json<APIResponse>({ success: false, error: 'Not authenticated' }, 401)
    }

    console.log('📱 Push unsubscription request for user:', payload.user_id)

    // Update user preferences to disable push notifications
    await c.env.DB.prepare(`
      UPDATE user_preferences SET
        push_notifications = FALSE,
        push_subscription = NULL,
        updated_at = CURRENT_TIMESTAMP
      WHERE user_id = ?
    `).bind(payload.user_id).run()

    return c.json<APIResponse>({ 
      success: true, 
      data: { message: 'Push notifications disabled successfully' }
    })
  } catch (error) {
    console.error('❌ Push unsubscription error:', error)
    return c.json<APIResponse>({ success: false, error: 'Failed to unsubscribe from push notifications' }, 500)
  }
})

// Get notification preferences
notificationsRoutes.get('/preferences', async (c) => {
  try {
    const payload = getAuthPayload(c)
    if (!payload) {
      return c.json<APIResponse>({ success: false, error: 'Not authenticated' }, 401)
    }

    const result = await c.env.DB.prepare(`
      SELECT 
        push_notifications,
        email_notifications,
        telegram_notifications,
        telegram_bot_token,
        telegram_chat_id
      FROM user_preferences 
      WHERE user_id = ?
    `).bind(payload.user_id).first()

    console.log('📋 Raw DB result:', result)
    
    const preferences = {
      pushEnabled: result ? (result.push_notifications ? true : false) : true, // Default true for new users
      emailEnabled: result ? (result.email_notifications ? true : false) : true, // Default true for new users
      telegramEnabled: result?.telegram_notifications || false,
      telegramConfigured: !!(result?.telegram_bot_token && result?.telegram_chat_id)
    }

    console.log('📋 Converted preferences:', preferences)

    return c.json<APIResponse>({ 
      success: true, 
      data: preferences
    })
  } catch (error) {
    console.error('❌ Get preferences error:', error)
    return c.json<APIResponse>({ success: false, error: 'Failed to get notification preferences' }, 500)
  }
})

// Update notification preferences
notificationsRoutes.post('/preferences', async (c) => {
  try {
    const payload = getAuthPayload(c)
    if (!payload) {
      return c.json<APIResponse>({ success: false, error: 'Not authenticated' }, 401)
    }

    const { pushEnabled, emailEnabled, telegramEnabled } = await c.req.json()
    console.log('⚙️ Updating notification preferences for user:', payload.user_id)
    console.log('📋 Received preferences:', { pushEnabled, emailEnabled, telegramEnabled })

    // Check if user preferences exist
    const existingPrefs = await c.env.DB.prepare(`
      SELECT id FROM user_preferences WHERE user_id = ?
    `).bind(payload.user_id).first()

    if (existingPrefs) {
      // Update existing record
      await c.env.DB.prepare(`
        UPDATE user_preferences 
        SET push_notifications = ?, 
            email_notifications = ?,
            telegram_notifications = ?,
            updated_at = CURRENT_TIMESTAMP
        WHERE user_id = ?
      `).bind(
        pushEnabled ? 1 : 0,
        emailEnabled ? 1 : 0,
        telegramEnabled ? 1 : 0,
        payload.user_id
      ).run()
    } else {
      // Insert new record
      await c.env.DB.prepare(`
        INSERT INTO user_preferences (
          user_id, push_notifications, email_notifications, telegram_notifications
        ) VALUES (?, ?, ?, ?)
      `).bind(
        payload.user_id,
        pushEnabled ? 1 : 0,
        emailEnabled ? 1 : 0,
        telegramEnabled ? 1 : 0
      ).run()
    }

    console.log('✅ Preferences saved successfully:', { 
      user_id: payload.user_id,
      push: pushEnabled ? 1 : 0,
      email: emailEnabled ? 1 : 0,
      telegram: telegramEnabled ? 1 : 0
    })

    return c.json<APIResponse>({ 
      success: true, 
      data: { message: 'Notification preferences updated successfully' }
    })
  } catch (error) {
    console.error('❌ Update preferences error:', error)
    return c.json<APIResponse>({ success: false, error: 'Failed to update notification preferences' }, 500)
  }
})

// Test notification (send a test to all configured channels)
notificationsRoutes.post('/test', async (c) => {
  try {
    const payload = getAuthPayload(c)
    if (!payload) {
      return c.json<APIResponse>({ success: false, error: 'Not authenticated' }, 401)
    }

    console.log('🧪 Test notification request for user:', payload.user_id)

    const notificationService = new NotificationService(c.env)
    const testData = {
      title: 'Test Notification',
      body: 'Your AI Trading Advisor is working perfectly!',
      symbol: 'TEST',
      action: 'BUY',
      confidence: 85,
      entryPrice: 100.00,
      targetPrice: 110.00,
      stopLoss: 95.00,
      reason: 'This is a test notification to verify your notification settings.',
      urgency: 'medium' as const,
      riskLevel: 'medium' as const,
      userId: payload.user_id
    }

    const results = await notificationService.sendRecommendationNotification(testData)

    return c.json<APIResponse>({ 
      success: true, 
      data: {
        message: 'Test notification sent',
        results: results
      }
    })
  } catch (error) {
    console.error('❌ Test notification error:', error)
    return c.json<APIResponse>({ success: false, error: 'Failed to send test notification' }, 500)
  }
})

// Send recommendation notification (used by the recommendation system)
notificationsRoutes.post('/send-recommendation', async (c) => {
  try {
    const payload = getAuthPayload(c)
    if (!payload) {
      return c.json<APIResponse>({ success: false, error: 'Not authenticated' }, 401)
    }

    const recommendationData = await c.req.json()
    console.log('📢 Sending recommendation notification for user:', payload.user_id)

    const notificationService = new NotificationService(c.env)
    const notificationData = {
      ...recommendationData,
      userId: payload.user_id
    }

    const results = await notificationService.sendRecommendationNotification(notificationData)

    return c.json<APIResponse>({ 
      success: true, 
      data: {
        message: 'Recommendation notification sent',
        results: results
      }
    })
  } catch (error) {
    console.error('❌ Send recommendation notification error:', error)
    return c.json<APIResponse>({ success: false, error: 'Failed to send recommendation notification' }, 500)
  }
})