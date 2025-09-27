import { Hono } from 'hono'
import type { Bindings, Variables, APIResponse } from '../types'

export const portfolioRoutes = new Hono<{ Bindings: Bindings; Variables: Variables }>()

// Get user portfolios
portfolioRoutes.get('/', async (c) => {
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
    
    const portfolios = await c.env.DB.prepare(`
      SELECT p.*, ps.per_trade_fraction, ps.max_open_positions
      FROM portfolios p
      LEFT JOIN portfolio_settings ps ON p.id = ps.portfolio_id
      WHERE p.user_id = ?
      ORDER BY p.created_at DESC
    `).bind(payload.user_id).all()

    return c.json<APIResponse>({ success: true, data: portfolios.results })
  } catch (error) {
    console.error('Portfolio fetch error:', error)
    return c.json<APIResponse>({ success: false, error: 'Failed to fetch portfolios' }, 500)
  }
})

// Create new portfolio
portfolioRoutes.post('/', async (c) => {
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

    const { name, base_currency } = await c.req.json()
    
    if (!name) {
      return c.json<APIResponse>({ success: false, error: 'Portfolio name is required' }, 400)
    }

    // Create portfolio
    const portfolioId = 'portfolio-' + Math.random().toString(36).substr(2, 9)
    await c.env.DB.prepare(`
      INSERT INTO portfolios (id, user_id, name, base_currency, advisor_mode, auto_mode, total_value)
      VALUES (?, ?, ?, ?, true, false, 100000.00)
    `).bind(portfolioId, payload.user_id, name, base_currency || 'USD').run()

    // Create portfolio settings
    try {
      await c.env.DB.prepare(`
        INSERT INTO portfolio_settings (portfolio_id, per_trade_fraction, max_open_positions)
        VALUES (?, 0.02, 10)
      `).bind(portfolioId).run()
    } catch (error) {
      console.log('Portfolio settings creation skipped (table may not exist)')
    }

    // Return the created portfolio
    const portfolio = {
      id: portfolioId,
      user_id: payload.user_id,
      name,
      base_currency: base_currency || 'USD',
      advisor_mode: true,
      auto_mode: false,
      total_value: 100000.00
    }

    return c.json<APIResponse>({ success: true, data: portfolio })
  } catch (error) {
    console.error('Portfolio creation error:', error)
    return c.json<APIResponse>({ success: false, error: 'Failed to create portfolio' }, 500)
  }
})

// Get portfolio details
portfolioRoutes.get('/:id', async (c) => {
  try {
    const payload = c.get('jwtPayload') as any
    const portfolioId = c.req.param('id')
    
    const portfolio = await c.env.DB.prepare(`
      SELECT p.*, ps.*
      FROM portfolios p
      LEFT JOIN portfolio_settings ps ON p.id = ps.portfolio_id
      WHERE p.id = ? AND p.user_id = ?
    `).bind(portfolioId, payload.user_id).first()

    if (!portfolio) {
      return c.json<APIResponse>({ success: false, error: 'Portfolio not found' }, 404)
    }

    return c.json<APIResponse>({ success: true, data: portfolio })
  } catch (error) {
    return c.json<APIResponse>({ success: false, error: 'Failed to fetch portfolio' }, 500)
  }
})

// Get portfolio tickers
portfolioRoutes.get('/:id/tickers', async (c) => {
  try {
    const payload = c.get('jwtPayload') as any
    const portfolioId = c.req.param('id')
    
    // Verify portfolio ownership
    const portfolio = await c.env.DB.prepare(`
      SELECT id FROM portfolios WHERE id = ? AND user_id = ?
    `).bind(portfolioId, payload.user_id).first()

    if (!portfolio) {
      return c.json<APIResponse>({ success: false, error: 'Portfolio not found' }, 404)
    }

    const tickers = await c.env.DB.prepare(`
      SELECT t.*, pt.enabled, pt.risk_bucket_override
      FROM portfolio_tickers pt
      JOIN tickers t ON pt.ticker_id = t.id
      WHERE pt.portfolio_id = ?
      ORDER BY t.symbol
    `).bind(portfolioId).all()

    return c.json<APIResponse>({ success: true, data: tickers.results })
  } catch (error) {
    return c.json<APIResponse>({ success: false, error: 'Failed to fetch tickers' }, 500)
  }
})