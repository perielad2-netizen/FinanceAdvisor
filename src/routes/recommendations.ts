import { Hono } from 'hono'
import type { Bindings, Variables, APIResponse } from '../types'

export const recommendationRoutes = new Hono<{ Bindings: Bindings; Variables: Variables }>()

// Get recommendations for user's portfolios
recommendationRoutes.get('/', async (c) => {
  try {
    const payload = c.get('jwtPayload') as any
    const status = c.req.query('status') || 'pending'
    const limit = parseInt(c.req.query('limit') || '20')
    
    const recommendations = await c.env.DB.prepare(`
      SELECT r.*, t.symbol, t.company_name, p.name as portfolio_name
      FROM recommendations r
      JOIN tickers t ON r.ticker_id = t.id
      JOIN portfolios p ON r.portfolio_id = p.id
      WHERE p.user_id = ? AND r.status = ?
      ORDER BY r.created_at DESC
      LIMIT ?
    `).bind(payload.user_id, status, limit).all()

    return c.json<APIResponse>({ success: true, data: recommendations.results })
  } catch (error) {
    return c.json<APIResponse>({ success: false, error: 'Failed to fetch recommendations' }, 500)
  }
})

// Get recommendations for specific portfolio
recommendationRoutes.get('/portfolio/:id', async (c) => {
  try {
    const payload = c.get('jwtPayload') as any
    const portfolioId = c.req.param('id')
    const status = c.req.query('status') || 'pending'
    
    // Verify portfolio ownership
    const portfolio = await c.env.DB.prepare(`
      SELECT id FROM portfolios WHERE id = ? AND user_id = ?
    `).bind(portfolioId, payload.user_id).first()

    if (!portfolio) {
      return c.json<APIResponse>({ success: false, error: 'Portfolio not found' }, 404)
    }

    const recommendations = await c.env.DB.prepare(`
      SELECT r.*, t.symbol, t.company_name
      FROM recommendations r
      JOIN tickers t ON r.ticker_id = t.id
      WHERE r.portfolio_id = ? AND r.status = ?
      ORDER BY r.created_at DESC
    `).bind(portfolioId, status).all()

    return c.json<APIResponse>({ success: true, data: recommendations.results })
  } catch (error) {
    return c.json<APIResponse>({ success: false, error: 'Failed to fetch recommendations' }, 500)
  }
})

// Acknowledge recommendation (mark as seen)
recommendationRoutes.post('/:id/acknowledge', async (c) => {
  try {
    const payload = c.get('jwtPayload') as any
    const recId = c.req.param('id')
    
    // Verify recommendation belongs to user
    const rec = await c.env.DB.prepare(`
      SELECT r.id FROM recommendations r
      JOIN portfolios p ON r.portfolio_id = p.id
      WHERE r.id = ? AND p.user_id = ?
    `).bind(recId, payload.user_id).first()

    if (!rec) {
      return c.json<APIResponse>({ success: false, error: 'Recommendation not found' }, 404)
    }

    await c.env.DB.prepare(`
      UPDATE recommendations 
      SET status = 'acknowledged', updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `).bind(recId).run()

    return c.json<APIResponse>({ success: true, message: 'Recommendation acknowledged' })
  } catch (error) {
    return c.json<APIResponse>({ success: false, error: 'Failed to acknowledge recommendation' }, 500)
  }
})

// Dismiss recommendation
recommendationRoutes.post('/:id/dismiss', async (c) => {
  try {
    const payload = c.get('jwtPayload') as any
    const recId = c.req.param('id')
    
    // Verify recommendation belongs to user
    const rec = await c.env.DB.prepare(`
      SELECT r.id FROM recommendations r
      JOIN portfolios p ON r.portfolio_id = p.id
      WHERE r.id = ? AND p.user_id = ?
    `).bind(recId, payload.user_id).first()

    if (!rec) {
      return c.json<APIResponse>({ success: false, error: 'Recommendation not found' }, 404)
    }

    await c.env.DB.prepare(`
      UPDATE recommendations 
      SET status = 'dismissed', updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `).bind(recId).run()

    return c.json<APIResponse>({ success: true, message: 'Recommendation dismissed' })
  } catch (error) {
    return c.json<APIResponse>({ success: false, error: 'Failed to dismiss recommendation' }, 500)
  }
})

// Generate new recommendations for portfolio
recommendationRoutes.post('/generate/:portfolioId', async (c) => {
  try {
    const payload = c.get('jwtPayload') as any
    const portfolioId = c.req.param('portfolioId')
    
    // Verify portfolio ownership
    const portfolio = await c.env.DB.prepare(`
      SELECT id FROM portfolios WHERE id = ? AND user_id = ?
    `).bind(portfolioId, payload.user_id).first()

    if (!portfolio) {
      return c.json<APIResponse>({ success: false, error: 'Portfolio not found' }, 404)
    }

    // Run recommendation engine
    const { RecommendationEngine } = await import('../services/recommendation-engine')
    const engine = new RecommendationEngine(c.env)
    
    const result = await engine.runRecommendationPipeline(c.env.DB, portfolioId)

    return c.json<APIResponse>({ 
      success: true, 
      data: result,
      message: `Generated ${result.recommendationsGenerated} recommendations based on ${result.newsProcessed} news articles`
    })
  } catch (error) {
    console.error('Recommendation generation error:', error)
    return c.json<APIResponse>({ success: false, error: 'Failed to generate recommendations' }, 500)
  }
})