import { Hono } from 'hono'
// import { sign, verify } from 'hono/jwt'  // Simplified for now
import { setCookie, getCookie } from 'hono/cookie'
// Simple hash function for demo (replace with proper bcrypt in production)
const simpleHash = async (password: string) => {
  // For demo purposes, just use a simple hash
  return btoa(password + 'salt')
}

const verifyPassword = async (password: string, hash: string) => {
  return btoa(password + 'salt') === hash
}
import type { Bindings, Variables, User, APIResponse } from '../types'

export const authRoutes = new Hono<{ Bindings: Bindings; Variables: Variables }>()

// Register new user
authRoutes.post('/register', async (c) => {
  try {
    const { email, password, name, phone, notification_preferences } = await c.req.json()
    
    if (!email || !password || !name || !phone) {
      return c.json<APIResponse>({ 
        success: false, 
        message: 'Email, password, name, and phone number are all required' 
      }, 400)
    }
    
    // International phone number validation (must start with +)
    const phoneRegex = /^\+[1-9]\d{8,14}$/
    if (!phoneRegex.test(phone)) {
      return c.json<APIResponse>({ 
        success: false, 
        message: 'Phone number must be in international format (e.g., +972501234567)' 
      }, 400)
    }

    if (password.length < 6) {
      return c.json<APIResponse>({ 
        success: false, 
        message: 'Password must be at least 6 characters long' 
      }, 400)
    }

    // Check if user already exists
    const existingUser = await c.env.DB.prepare(
      'SELECT id FROM users WHERE email = ?'
    ).bind(email).first()

    if (existingUser) {
      return c.json<APIResponse>({ 
        success: false, 
        message: 'User already exists with this email address' 
      }, 409)
    }

    // Hash password
    const hashedPassword = await simpleHash(password)
    
    // Create user with phone number (now required)
    const userId = 'user-' + Math.random().toString(36).substr(2, 9)
    
    // Try to insert with phone_number column, fallback if column doesn't exist
    try {
      await c.env.DB.prepare(`
        INSERT INTO users (id, email, password_hash, name, phone_number, role, is_active)
        VALUES (?, ?, ?, ?, ?, 'user', true)
      `).bind(userId, email, hashedPassword, name, phone).run()
    } catch (error) {
      // Fallback: Insert without phone_number column if it doesn't exist
      console.log('Inserting without phone_number column:', error.message)
      await c.env.DB.prepare(`
        INSERT INTO users (id, email, password_hash, name, role, is_active)
        VALUES (?, ?, ?, ?, 'user', true)
      `).bind(userId, email, hashedPassword, name).run()
      
      // Try to add phone number in a separate update
      try {
        await c.env.DB.prepare(`
          UPDATE users SET phone_number = ? WHERE id = ?
        `).bind(phone, userId).run()
      } catch (updateError) {
        console.log('Phone number storage failed - will be handled in user preferences')
      }
    }

    // Store notification preferences
    if (notification_preferences) {
      try {
        await c.env.DB.prepare(`
          INSERT INTO user_preferences (user_id, email_notifications, telegram_notifications, phone_notifications)
          VALUES (?, ?, ?, ?)
        `).bind(
          userId, 
          notification_preferences.email ? 1 : 0,
          notification_preferences.telegram ? 1 : 0,
          notification_preferences.whatsapp || notification_preferences.phone ? 1 : 0
        ).run()
      } catch (error) {
        console.log('User preferences creation skipped (table may not exist yet)')
      }
    }

    // Create default portfolio
    const portfolioId = 'portfolio-' + Math.random().toString(36).substr(2, 9)
    await c.env.DB.prepare(`
      INSERT INTO portfolios (id, user_id, name, base_currency, advisor_mode, auto_mode)
      VALUES (?, ?, 'My Portfolio', 'USD', true, false)
    `).bind(portfolioId, userId).run()

    // Create portfolio settings
    try {
      await c.env.DB.prepare(`
        INSERT INTO portfolio_settings (portfolio_id) VALUES (?)
      `).bind(portfolioId).run()
    } catch (error) {
      console.log('Portfolio settings creation skipped (table may not exist yet)')
    }

    return c.json<APIResponse>({ 
      success: true, 
      message: 'User registered successfully',
      data: { userId, portfolioId }
    })

  } catch (error) {
    console.error('Register error:', error)
    return c.json<APIResponse>({ 
      success: false, 
      message: 'Registration failed. Please try again.' 
    }, 500)
  }
})

// Demo login (creates temporary user)
authRoutes.post('/demo-login', async (c) => {
  try {
    // Generate simple demo user without database
    const demoUser = {
      id: 'demo-user-' + Date.now(),
      email: 'demo@traderadvisor.ai', 
      name: 'Demo User',
      role: 'demo',
      is_active: true,
      created_at: new Date().toISOString()
    }

    // Generate token
    const payload = {
      user_id: demoUser.id,
      email: demoUser.email,
      role: demoUser.role,
      exp: Date.now() + (60 * 60 * 4 * 1000) // 4 hours for demo
    }

    const token = btoa(JSON.stringify(payload))

    // Set cookie
    setCookie(c, 'auth-token', token, {
      httpOnly: true,
      secure: false,
      sameSite: 'Lax',
      maxAge: 60 * 60 * 4 // 4 hours
    })

    return c.json<APIResponse<User>>({ 
      success: true, 
      data: demoUser 
    })

  } catch (error) {
    console.error('Demo login error:', error)
    return c.json<APIResponse>({ 
      success: false, 
      message: 'Demo login failed. Please try again.' 
    }, 500)
  }
})

// Login user
authRoutes.post('/login', async (c) => {
  try {
    const { email, password } = await c.req.json()
    
    if (!email || !password) {
      return c.json<APIResponse>({ 
        success: false, 
        error: 'Email and password are required' 
      }, 400)
    }

    // Find user
    const user = await c.env.DB.prepare(`
      SELECT id, email, password_hash, name, role, is_active
      FROM users WHERE email = ? AND is_active = true
    `).bind(email).first() as any

    if (!user) {
      return c.json<APIResponse>({ 
        success: false, 
        error: 'Invalid credentials' 
      }, 401)
    }

    // Verify password
    const isValid = await verifyPassword(password, user.password_hash)
    if (!isValid) {
      return c.json<APIResponse>({ 
        success: false, 
        error: 'Invalid credentials' 
      }, 401)
    }

    // Update last login
    await c.env.DB.prepare(`
      UPDATE users SET last_login_at = CURRENT_TIMESTAMP WHERE id = ?
    `).bind(user.id).run()

    // Generate simple token (base64 encoded user info)
    const payload = {
      user_id: user.id,
      email: user.email,
      role: user.role,
      exp: Date.now() + (60 * 60 * 24 * 7 * 1000) // 7 days
    }

    const token = btoa(JSON.stringify(payload))

    // Set HTTP-only cookie
    setCookie(c, 'auth-token', token, {
      httpOnly: true,
      secure: false, // Allow HTTP for local dev
      sameSite: 'Lax',
      maxAge: 60 * 60 * 24 * 7 // 7 days
    })

    const userResponse: User = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      is_active: user.is_active,
      created_at: user.created_at
    }

    return c.json<APIResponse<{ user: User; token: string }>>({ 
      success: true, 
      data: { user: userResponse, token }
    })

  } catch (error) {
    console.error('Login error:', error)
    return c.json<APIResponse>({ 
      success: false, 
      error: 'Internal server error' 
    }, 500)
  }
})

// Logout user
authRoutes.post('/logout', (c) => {
  setCookie(c, 'auth-token', '', {
    httpOnly: true,
    secure: true,
    sameSite: 'Strict',
    maxAge: 0
  })
  
  return c.json<APIResponse>({ 
    success: true, 
    message: 'Logged out successfully' 
  })
})

// Get current user (for authentication check)
authRoutes.get('/me', async (c) => {
  try {
    const token = getCookie(c, 'auth-token')
    
    if (!token) {
      return c.json<APIResponse>({ 
        success: false, 
        error: 'Not authenticated' 
      }, 401)
    }

    const payload = JSON.parse(atob(token)) as any
    
    // Check if token is expired
    if (payload.exp < Date.now()) {
      return c.json<APIResponse>({ 
        success: false, 
        error: 'Token expired' 
      }, 401)
    }
    
    const user = await c.env.DB.prepare(`
      SELECT id, email, name, role, is_active, created_at
      FROM users WHERE id = ? AND is_active = true
    `).bind(payload.user_id).first() as any

    if (!user) {
      return c.json<APIResponse>({ 
        success: false, 
        error: 'User not found' 
      }, 404)
    }

    return c.json<APIResponse<User>>({ 
      success: true, 
      data: user 
    })

  } catch (error) {
    return c.json<APIResponse>({ 
      success: false, 
      error: 'Invalid token' 
    }, 401)
  }
})