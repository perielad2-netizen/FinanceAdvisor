import { Hono } from 'hono'
import type { Bindings, Variables, APIResponse } from '../types'

export const marketRoutes = new Hono<{ Bindings: Bindings; Variables: Variables }>()

// Get all available tickers
marketRoutes.get('/tickers', async (c) => {
  try {
    const search = c.req.query('search') || ''
    const limit = parseInt(c.req.query('limit') || '50')
    
    let query = `
      SELECT id, symbol, exchange, company_name, default_risk_bucket, is_active
      FROM tickers 
      WHERE is_active = true
    `
    
    const params: any[] = []
    
    if (search) {
      query += ` AND (symbol LIKE ? OR company_name LIKE ?)`
      params.push(`%${search.toUpperCase()}%`, `%${search}%`)
    }
    
    query += ` ORDER BY symbol LIMIT ?`
    params.push(limit)
    
    const tickers = await c.env.DB.prepare(query).bind(...params).all()

    return c.json<APIResponse>({ success: true, data: tickers.results })
  } catch (error) {
    return c.json<APIResponse>({ success: false, error: 'Failed to fetch tickers' }, 500)
  }
})

// Get technical analysis for ticker
marketRoutes.get('/analysis/:symbol', async (c) => {
  try {
    const symbol = c.req.param('symbol').toUpperCase()
    const interval = c.req.query('interval') || '5m'
    
    // Get ticker
    const ticker = await c.env.DB.prepare(`
      SELECT id FROM tickers WHERE symbol = ?
    `).bind(symbol).first()

    if (!ticker) {
      return c.json<APIResponse>({ success: false, error: 'Ticker not found' }, 404)
    }

    // Get latest technical signals
    const signal = await c.env.DB.prepare(`
      SELECT * FROM signals_intraday 
      WHERE ticker_id = ? AND interval = ?
      ORDER BY computed_at DESC 
      LIMIT 1
    `).bind(ticker.id, interval).first() as any

    if (!signal) {
      // Return mock technical analysis if no data
      return c.json<APIResponse>({ 
        success: true, 
        data: {
          symbol,
          interval,
          indicators: {
            ema_12: 0,
            ema_26: 0,
            rsi: 50,
            adx: 25,
            atr: 2.5
          },
          verdict: 'hold',
          last_price: 0,
          computed_at: new Date().toISOString(),
          message: 'No technical data available - showing mock data'
        }
      })
    }

    // Parse JSON indicators
    signal.indicators = JSON.parse(signal.indicators || '{}')

    return c.json<APIResponse>({ success: true, data: signal })
  } catch (error) {
    return c.json<APIResponse>({ success: false, error: 'Failed to fetch technical analysis' }, 500)
  }
})

// Get market price for ticker (mock for now)
marketRoutes.get('/price/:symbol', async (c) => {
  try {
    const symbol = c.req.param('symbol').toUpperCase()
    
    // In a real implementation, this would fetch from TwelveData, Finnhub, etc.
    // For now, return mock data
    const mockPrices: Record<string, number> = {
      'AAPL': 185.25,
      'MSFT': 412.50,
      'GOOGL': 142.75,
      'AMZN': 145.30,
      'TSLA': 247.25,
      'NVDA': 875.40,
      'META': 325.80,
      'NFLX': 445.20,
      'SPY': 450.75,
      'QQQ': 385.60
    }
    
    const price = mockPrices[symbol] || 100 + Math.random() * 300
    const change = (Math.random() - 0.5) * 10
    const changePercent = (change / price) * 100

    return c.json<APIResponse>({ 
      success: true, 
      data: {
        symbol,
        price: Math.round(price * 100) / 100,
        change: Math.round(change * 100) / 100,
        change_percent: Math.round(changePercent * 100) / 100,
        volume: Math.floor(Math.random() * 10000000),
        timestamp: new Date().toISOString(),
        note: 'Mock data - connect real market data API'
      }
    })
  } catch (error) {
    return c.json<APIResponse>({ success: false, error: 'Failed to fetch market price' }, 500)
  }
})