import { Hono } from 'hono'
import type { Bindings, Variables, APIResponse } from '../types'

export const newsRoutes = new Hono<{ Bindings: Bindings; Variables: Variables }>()

// Get recent news items with enhanced filtering
newsRoutes.get('/', async (c) => {
  try {
    const limit = parseInt(c.req.query('limit') || '20')
    const offset = parseInt(c.req.query('offset') || '0')
    const minRelevance = parseFloat(c.req.query('min_relevance') || '0.3')
    
    // Use enhanced view with composite scoring
    const news = await c.env.DB.prepare(`
      SELECT n.*, t.symbol, t.company_name,
             COALESCE(n.financial_relevance, n.relevance, 0.5) as financial_relevance,
             COALESCE(n.urgency, 0.5) as urgency,
             (COALESCE(n.financial_relevance, n.relevance, 0.5) * 0.4 + 
              n.relevance * 0.3 + 
              COALESCE(n.urgency, 0.5) * 0.3) as composite_score
      FROM news_items n
      LEFT JOIN tickers t ON n.ticker_id = t.id
      WHERE n.is_sponsored = false 
        AND COALESCE(n.financial_relevance, n.relevance, 0.5) >= ?
      ORDER BY composite_score DESC, n.published_at DESC
      LIMIT ? OFFSET ?
    `).bind(minRelevance, limit, offset).all()

    // Get API usage stats for the day
    const apiStats = await c.env.DB.prepare(`
      SELECT api_name, call_count 
      FROM api_usage_tracking 
      WHERE usage_date = date('now')
    `).all()

    return c.json<APIResponse>({ 
      success: true, 
      data: news.results,
      meta: {
        api_usage_today: apiStats.results || [],
        filter_min_relevance: minRelevance
      }
    })
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

// Enhanced news analysis pipeline with intelligent filtering
newsRoutes.post('/analyze', async (c) => {
  try {
    const body = await c.req.json().catch(() => ({}))
    const symbols = body.symbols || ['AAPL', 'MSFT', 'GOOGL', 'TSLA', 'NVDA']
    
    console.log('🚀 Starting enhanced news analysis...')
    
    // Use enhanced analyzer with intelligent filtering
    const { EnhancedNewsAnalyzer } = await import('../services/enhanced-news-analyzer')
    const analyzer = new EnhancedNewsAnalyzer(c.env)
    
    const processedCount = await analyzer.processAndStoreNews(c.env.DB, symbols)

    // Get API usage statistics
    const apiUsage = await c.env.DB.prepare(`
      SELECT api_name, call_count 
      FROM api_usage_tracking 
      WHERE usage_date = date('now')
    `).all()

    return c.json<APIResponse>({ 
      success: true, 
      data: { 
        processedCount, 
        symbols,
        apiUsage: apiUsage.results || []
      },
      message: `📊 Enhanced analysis complete: ${processedCount} financially relevant articles processed`
    })
  } catch (error) {
    console.error('Enhanced news analysis error:', error)
    return c.json<APIResponse>({ success: false, error: 'Enhanced news analysis failed' }, 500)
  }
})

// Fetch and analyze news for specific ticker with enhanced filtering
newsRoutes.post('/fetch/:symbol', async (c) => {
  try {
    const symbol = c.req.param('symbol').toUpperCase()
    const { EnhancedNewsAnalyzer } = await import('../services/enhanced-news-analyzer')
    const analyzer = new EnhancedNewsAnalyzer(c.env)
    
    // Fetch news specifically for this ticker using enhanced analyzer
    const articles = await analyzer.fetchLatestNews([symbol], 10)
    
    return c.json<APIResponse>({ 
      success: true, 
      data: { articles, symbol, count: articles.length },
      message: `📊 Fetched ${articles.length} financially relevant articles for ${symbol}`
    })
  } catch (error) {
    console.error('Enhanced news fetch error:', error)
    return c.json<APIResponse>({ success: false, error: 'Enhanced news fetch failed' }, 500)
  }
})

// Get API usage statistics
newsRoutes.get('/api-usage', async (c) => {
  try {
    const today = new Date().toISOString().split('T')[0]
    
    const usage = await c.env.DB.prepare(`
      SELECT 
        u.api_name,
        u.call_count,
        u.usage_date,
        sc.daily_limit,
        sc.cost_per_call,
        (u.call_count * 100.0 / sc.daily_limit) as usage_percentage
      FROM api_usage_tracking u
      LEFT JOIN news_source_config sc ON u.api_name = sc.source_name
      WHERE u.usage_date >= date('now', '-7 days')
      ORDER BY u.usage_date DESC, u.api_name
    `).all()

    const limits = await c.env.DB.prepare(`
      SELECT source_name, daily_limit, cost_per_call, financial_focus
      FROM news_source_config
      WHERE is_active = true
      ORDER BY priority
    `).all()

    return c.json<APIResponse>({ 
      success: true, 
      data: {
        current_usage: usage.results || [],
        api_limits: limits.results || [],
        date: today
      }
    })
  } catch (error) {
    console.error('API usage fetch error:', error)
    return c.json<APIResponse>({ success: false, error: 'Failed to fetch API usage' }, 500)
  }
})

// Get financial news with advanced filtering
newsRoutes.get('/financial', async (c) => {
  try {
    const limit = parseInt(c.req.query('limit') || '15')
    const minFinancialRelevance = parseFloat(c.req.query('min_financial') || '0.5')
    const categories = c.req.query('categories')?.split(',') || []
    
    let query = `
      SELECT n.*, t.symbol, t.company_name,
             COALESCE(n.financial_relevance, 0.5) as financial_relevance,
             COALESCE(n.urgency, 0.5) as urgency,
             n.categories
      FROM news_items n
      LEFT JOIN tickers t ON n.ticker_id = t.id
      WHERE n.is_sponsored = false 
        AND COALESCE(n.financial_relevance, 0.5) >= ?
    `
    
    const params = [minFinancialRelevance]
    
    if (categories.length > 0) {
      query += ` AND (`
      categories.forEach((cat, index) => {
        if (index > 0) query += ` OR `
        query += ` n.categories LIKE ?`
        params.push(`%${cat}%`)
      })
      query += `)`
    }
    
    query += ` ORDER BY financial_relevance DESC, urgency DESC, published_at DESC LIMIT ?`
    params.push(limit)

    const news = await c.env.DB.prepare(query).bind(...params).all()

    // Get top financial categories
    const topCategories = await c.env.DB.prepare(`
      SELECT 
        json_extract(value, '$') as category,
        COUNT(*) as count
      FROM news_items,
           json_each(COALESCE(categories, '[]'))
      WHERE published_at > datetime('now', '-7 days')
        AND financial_relevance >= 0.4
      GROUP BY category
      ORDER BY count DESC
      LIMIT 10
    `).all()

    return c.json<APIResponse>({ 
      success: true, 
      data: news.results || [],
      meta: {
        filter_applied: {
          min_financial_relevance: minFinancialRelevance,
          categories: categories.length > 0 ? categories : 'all'
        },
        top_categories: topCategories.results || []
      }
    })
  } catch (error) {
    console.error('Financial news fetch error:', error)
    return c.json<APIResponse>({ success: false, error: 'Failed to fetch financial news' }, 500)
  }
})

// Smart news batch processing with token management
newsRoutes.post('/smart-batch', async (c) => {
  try {
    const body = await c.req.json().catch(() => ({}))
    const symbols = body.symbols || ['AAPL', 'MSFT', 'GOOGL']
    const maxTokens = parseInt(body.max_tokens) || 50 // Conservative limit
    const urgentOnly = body.urgent_only || false
    
    console.log(`🧠 Smart batch processing for ${symbols.length} symbols (max ${maxTokens} tokens)`)
    
    const { EnhancedNewsAnalyzer } = await import('../services/enhanced-news-analyzer')
    const analyzer = new EnhancedNewsAnalyzer(c.env)
    
    // Fetch articles with pre-filtering
    const allArticles = await analyzer.fetchLatestNews(symbols, 30)
    
    // Smart filtering to preserve tokens
    const filteredArticles = allArticles
      .filter(article => {
        // Calculate financial relevance score without AI
        const text = (article.title + ' ' + article.description).toLowerCase()
        const hasFinancialKeywords = ['stock', 'market', 'earnings', 'revenue', 'analyst', 'price'].some(keyword => text.includes(keyword))
        const hasSymbolMention = symbols.some(symbol => text.includes(symbol.toLowerCase()))
        
        return hasFinancialKeywords || hasSymbolMention
      })
      .slice(0, Math.min(maxTokens, 20)) // Hard limit to preserve tokens

    let processedCount = 0
    const results = []

    // Process filtered articles
    for (const article of filteredArticles) {
      try {
        // Use AI analysis sparingly
        const analysis = await analyzer.analyzeNewsWithAI(article.title, article.description, article.url)
        
        if (analysis.financialRelevance >= (urgentOnly ? 0.7 : 0.4)) {
          results.push({
            article,
            analysis,
            processed: true
          })
          processedCount++
        } else {
          results.push({
            article,
            analysis: null,
            processed: false,
            reason: 'Low financial relevance'
          })
        }
        
      } catch (error) {
        console.error(`Error processing ${article.title}:`, error)
        results.push({
          article,
          analysis: null,
          processed: false,
          reason: 'Processing error'
        })
      }
    }

    return c.json<APIResponse>({ 
      success: true, 
      data: {
        symbols,
        articles_fetched: allArticles.length,
        articles_filtered: filteredArticles.length,
        articles_processed: processedCount,
        results: results.slice(0, 15), // Return top 15 for display
        tokens_used_estimate: processedCount,
        tokens_remaining: Math.max(0, maxTokens - processedCount)
      },
      message: `🚀 Smart batch complete: ${processedCount} articles processed, ~${processedCount} tokens used`
    })
  } catch (error) {
    console.error('Smart batch processing error:', error)
    return c.json<APIResponse>({ success: false, error: 'Smart batch processing failed' }, 500)
  }
})