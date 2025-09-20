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

// Trigger news analysis pipeline
newsRoutes.post('/analyze', async (c) => {
  try {
    const { NewsAnalyzer } = await import('../services/news-analyzer')
    const analyzer = new NewsAnalyzer(c.env)
    
    const processedCount = await analyzer.processAndStoreNews(c.env.DB)

    return c.json<APIResponse>({ 
      success: true, 
      data: { processedCount },
      message: `Processed ${processedCount} news articles`
    })
  } catch (error) {
    console.error('News analysis error:', error)
    return c.json<APIResponse>({ success: false, error: 'News analysis failed' }, 500)
  }
})

// Fetch and analyze news for specific ticker
newsRoutes.post('/fetch/:symbol', async (c) => {
  try {
    const symbol = c.req.param('symbol').toUpperCase()
    const { NewsAnalyzer } = await import('../services/news-analyzer')
    const analyzer = new NewsAnalyzer(c.env)
    
    // Fetch news specifically for this ticker
    const articles = await analyzer.fetchLatestNews(`${symbol} stock`)
    
    return c.json<APIResponse>({ 
      success: true, 
      data: { articles: articles.slice(0, 5), symbol },
      message: `Fetched news for ${symbol}`
    })
  } catch (error) {
    console.error('News fetch error:', error)
    return c.json<APIResponse>({ success: false, error: 'News fetch failed' }, 500)
  }
})