import { Hono } from 'hono'
import type { Bindings, Variables, APIResponse } from '../types'

export const newsRoutes = new Hono<{ Bindings: Bindings; Variables: Variables }>()

// Get recent news items
newsRoutes.get('/', async (c) => {
  try {
    const limit = parseInt(c.req.query('limit') || '20')
    const offset = parseInt(c.req.query('offset') || '0')
    
    const news = await c.env.DB.prepare(`
      SELECT n.*, t.symbol, t.company_name
      FROM news_items n
      LEFT JOIN tickers t ON n.ticker_id = t.id
      WHERE n.is_sponsored = false
      ORDER BY n.published_at DESC
      LIMIT ? OFFSET ?
    `).bind(limit, offset).all()

    return c.json<APIResponse>({ success: true, data: news.results })
  } catch (error) {
    return c.json<APIResponse>({ success: false, error: 'Failed to fetch news' }, 500)
  }
})

// Get news for specific ticker
newsRoutes.get('/ticker/:symbol', async (c) => {
  try {
    const symbol = c.req.param('symbol').toUpperCase()
    const limit = parseInt(c.req.query('limit') || '10')
    
    const news = await c.env.DB.prepare(`
      SELECT n.*, t.symbol, t.company_name
      FROM news_items n
      JOIN tickers t ON n.ticker_id = t.id
      WHERE t.symbol = ? AND n.is_sponsored = false
      ORDER BY n.published_at DESC
      LIMIT ?
    `).bind(symbol, limit).all()

    return c.json<APIResponse>({ success: true, data: news.results })
  } catch (error) {
    return c.json<APIResponse>({ success: false, error: 'Failed to fetch ticker news' }, 500)
  }
})

// Trigger news analysis (manual trigger for testing)
newsRoutes.post('/analyze', async (c) => {
  try {
    const { url, title, description } = await c.req.json()
    
    if (!c.env.OPENAI_API_KEY) {
      return c.json<APIResponse>({ 
        success: false, 
        error: 'OpenAI API key not configured' 
      }, 400)
    }

    // This would normally be called by the news ingestion worker
    // For now, just return a mock analysis
    const analysis = {
      sponsored: false,
      confidence: 0.85,
      relevance: 0.7,
      sentiment: 1,
      rationale: 'Positive earnings report with strong revenue growth'
    }

    return c.json<APIResponse>({ 
      success: true, 
      data: analysis,
      message: 'News analyzed (mock response)'
    })
  } catch (error) {
    return c.json<APIResponse>({ success: false, error: 'Analysis failed' }, 500)
  }
})