import { Hono } from 'hono'
import type { Bindings, Variables, APIResponse } from '../types'

export const portfolioRoutes = new Hono<{ Bindings: Bindings; Variables: Variables }>()

// Get user portfolios
portfolioRoutes.get('/', async (c) => {
  try {
    const payload = c.get('jwtPayload') as any
    
    const portfolios = await c.env.DB.prepare(`
      SELECT p.*, ps.per_trade_fraction, ps.max_open_positions, ps.advisor_mode
      FROM portfolios p
      LEFT JOIN portfolio_settings ps ON p.id = ps.portfolio_id
      WHERE p.user_id = ?
      ORDER BY p.created_at DESC
    `).bind(payload.user_id).all()

    return c.json<APIResponse>({ success: true, data: portfolios.results })
  } catch (error) {
    return c.json<APIResponse>({ success: false, error: 'Failed to fetch portfolios' }, 500)
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