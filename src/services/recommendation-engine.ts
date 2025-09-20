// Trading recommendation engine
import type { Bindings } from '../types'

interface TechnicalIndicators {
  ema_12: number
  ema_26: number
  rsi: number
  adx: number
  atr: number
  price: number
}

interface RecommendationRequest {
  portfolioId: string
  tickerId: string
  tickerSymbol: string
  currentPrice: number
  newsImpact?: {
    sentiment: number
    relevance: number
    reason: string
  }
}

interface GeneratedRecommendation {
  type: 'BUY' | 'SELL_FULL' | 'SELL_PARTIAL' | 'MODIFY_SL'
  qty: number
  entryPrice: number
  takeProfit: number
  stopLoss: number
  reason: string
  confidence: number
}

export class RecommendationEngine {
  constructor(private env: Bindings) {}

  async generateRecommendations(db: any, portfolioId: string): Promise<number> {
    console.log(`Generating recommendations for portfolio: ${portfolioId}`)

    // Get portfolio settings
    const portfolio = await db.prepare(`
      SELECT p.*, ps.per_trade_fraction, ps.sentiment_threshold, ps.max_open_positions,
             ps.timing_gate_enabled, ps.take_profit_pct, ps.stop_loss_pct
      FROM portfolios p
      LEFT JOIN portfolio_settings ps ON p.id = ps.portfolio_id
      WHERE p.id = ?
    `).bind(portfolioId).first()

    if (!portfolio) {
      throw new Error('Portfolio not found')
    }

    // Get portfolio tickers
    const tickers = await db.prepare(`
      SELECT pt.*, t.symbol, t.company_name
      FROM portfolio_tickers pt
      JOIN tickers t ON pt.ticker_id = t.id
      WHERE pt.portfolio_id = ? AND pt.enabled = true
    `).bind(portfolioId).all()

    console.log(`Found ${tickers.results?.length || 0} tickers to analyze`)

    let recommendationCount = 0

    for (const tickerData of tickers.results || []) {
      try {
        // Get recent news for this ticker
        const recentNews = await db.prepare(`
          SELECT sentiment, relevance, title, reason, published_at
          FROM news_items 
          WHERE ticker_id = ? 
            AND processed_at > datetime('now', '-24 hours')
            AND is_sponsored = false
            AND relevance >= ?
          ORDER BY published_at DESC
          LIMIT 3
        `).bind(tickerData.ticker_id, portfolio.sentiment_threshold || 0.6).all()

        // Check for existing recommendations (cooldown)
        const existingRec = await db.prepare(`
          SELECT id FROM recommendations
          WHERE portfolio_id = ? AND ticker_id = ?
            AND status IN ('pending', 'delivered')
            AND created_at > datetime('now', '-6 hours')
        `).bind(portfolioId, tickerData.ticker_id).first()

        if (existingRec) {
          console.log(`Skipping ${tickerData.symbol} - recent recommendation exists`)
          continue
        }

        // Get current price and technical analysis
        const currentPrice = await this.getCurrentPrice(tickerData.symbol)
        const technicals = await this.getTechnicalAnalysis(db, tickerData.ticker_id, currentPrice)

        // Process news impact
        let newsImpact = null
        if (recentNews.results && recentNews.results.length > 0) {
          const avgSentiment = recentNews.results.reduce((sum: number, news: any) => 
            sum + (news.sentiment || 0), 0) / recentNews.results.length
          const avgRelevance = recentNews.results.reduce((sum: number, news: any) => 
            sum + (news.relevance || 0), 0) / recentNews.results.length

          newsImpact = {
            sentiment: avgSentiment,
            relevance: avgRelevance,
            reason: recentNews.results[0].title
          }
        }

        // Generate recommendation
        const recommendation = await this.analyzeAndRecommend({
          portfolioId,
          tickerId: tickerData.ticker_id,
          tickerSymbol: tickerData.symbol,
          currentPrice,
          newsImpact
        }, technicals, portfolio)

        if (recommendation) {
          // Store recommendation in database
          const recId = 'rec-' + Math.random().toString(36).substr(2, 9)
          const cooldownKey = `${tickerData.symbol}_${recommendation.type}_${new Date().toISOString().split('T')[0]}`

          await db.prepare(`
            INSERT INTO recommendations (
              id, portfolio_id, ticker_id, rec_type, qty_suggested,
              entry_price, take_profit, stop_loss, reason, status,
              cooldown_key, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, CURRENT_TIMESTAMP)
          `).bind(
            recId,
            portfolioId,
            tickerData.ticker_id,
            recommendation.type,
            recommendation.qty,
            recommendation.entryPrice,
            recommendation.takeProfit,
            recommendation.stopLoss,
            recommendation.reason,
            cooldownKey
          ).run()

          recommendationCount++
          console.log(`Generated ${recommendation.type} recommendation for ${tickerData.symbol}: ${recommendation.reason}`)
        }

      } catch (error) {
        console.error(`Error generating recommendation for ${tickerData.symbol}:`, error)
      }
    }

    console.log(`Recommendation generation complete: ${recommendationCount} recommendations created`)
    return recommendationCount
  }

  private async analyzeAndRecommend(
    request: RecommendationRequest,
    technicals: TechnicalIndicators,
    portfolio: any
  ): Promise<GeneratedRecommendation | null> {

    const { tickerSymbol, currentPrice, newsImpact } = request
    const { per_trade_fraction = 0.02, take_profit_pct = 0.05, stop_loss_pct = 0.02 } = portfolio

    // Technical analysis signals
    const emaSignal = technicals.ema_12 > technicals.ema_26 ? 'bullish' : 'bearish'
    const rsiSignal = technicals.rsi < 30 ? 'oversold' : technicals.rsi > 70 ? 'overbought' : 'neutral'
    const adxStrength = technicals.adx > 25 ? 'strong' : 'weak'

    // News sentiment impact
    const newsSignal = newsImpact ? 
      (newsImpact.sentiment > 0.3 ? 'positive' : newsImpact.sentiment < -0.3 ? 'negative' : 'neutral') : 'neutral'

    // Decision logic
    let recommendation: GeneratedRecommendation | null = null

    // BUY Signal Logic
    if (emaSignal === 'bullish' && rsiSignal === 'oversold' && adxStrength === 'strong' && 
        (newsSignal === 'positive' || newsSignal === 'neutral')) {
      
      const qty = Math.floor((10000 * per_trade_fraction) / currentPrice) // Assume $10k portfolio
      
      recommendation = {
        type: 'BUY',
        qty,
        entryPrice: currentPrice,
        takeProfit: currentPrice * (1 + take_profit_pct),
        stopLoss: currentPrice * (1 - stop_loss_pct),
        reason: `Technical breakout: EMA bullish cross, RSI oversold (${technicals.rsi.toFixed(1)}), strong ADX (${technicals.adx.toFixed(1)})${newsImpact ? `. Positive news: ${newsImpact.reason}` : ''}`,
        confidence: 0.85
      }
    }
    
    // SELL Signal Logic (negative news impact)
    else if (newsSignal === 'negative' && newsImpact && newsImpact.relevance > 0.7) {
      recommendation = {
        type: 'SELL_PARTIAL',
        qty: 0, // Will be calculated based on current holdings
        entryPrice: currentPrice,
        takeProfit: 0,
        stopLoss: 0,
        reason: `Negative news impact: ${newsImpact.reason}. Sentiment: ${newsImpact.sentiment.toFixed(2)}`,
        confidence: 0.75
      }
    }
    
    // MODIFY_SL Logic (trailing stop adjustment)
    else if (emaSignal === 'bullish' && technicals.rsi > 60 && technicals.adx > 20) {
      const newStopLoss = currentPrice * (1 - (stop_loss_pct * 0.8)) // Tighter stop loss
      
      recommendation = {
        type: 'MODIFY_SL',
        qty: 0,
        entryPrice: currentPrice,
        takeProfit: 0,
        stopLoss: newStopLoss,
        reason: `Trailing stop adjustment: Price momentum strong (RSI: ${technicals.rsi.toFixed(1)}), tightening stop loss to ${newStopLoss.toFixed(2)}`,
        confidence: 0.70
      }
    }

    return recommendation
  }

  private async getCurrentPrice(symbol: string): Promise<number> {
    // Mock price data - in production, integrate with TwelveData/Finnhub/Polygon
    const mockPrices: Record<string, number> = {
      'AAPL': 185.25 + (Math.random() - 0.5) * 10,
      'MSFT': 412.50 + (Math.random() - 0.5) * 20,
      'GOOGL': 142.75 + (Math.random() - 0.5) * 8,
      'TSLA': 247.25 + (Math.random() - 0.5) * 15,
      'NVDA': 875.40 + (Math.random() - 0.5) * 40,
      'META': 325.80 + (Math.random() - 0.5) * 18,
      'NFLX': 445.20 + (Math.random() - 0.5) * 25,
      'SPY': 450.75 + (Math.random() - 0.5) * 5,
      'QQQ': 385.60 + (Math.random() - 0.5) * 12
    }

    return mockPrices[symbol] || (100 + Math.random() * 300)
  }

  private async getTechnicalAnalysis(db: any, tickerId: string, currentPrice: number): Promise<TechnicalIndicators> {
    // Check if we have recent technical data
    const existing = await db.prepare(`
      SELECT indicators, last_price FROM signals_intraday
      WHERE ticker_id = ? AND computed_at > datetime('now', '-1 hour')
      ORDER BY computed_at DESC LIMIT 1
    `).bind(tickerId).first()

    if (existing) {
      try {
        const indicators = JSON.parse(existing.indicators)
        return {
          ema_12: indicators.ema_12 || currentPrice * 0.98,
          ema_26: indicators.ema_26 || currentPrice * 0.97,
          rsi: indicators.rsi || 50,
          adx: indicators.adx || 25,
          atr: indicators.atr || currentPrice * 0.02,
          price: existing.last_price || currentPrice
        }
      } catch (error) {
        console.error('Error parsing technical indicators:', error)
      }
    }

    // Generate mock technical indicators
    const mockTechnicals = this.generateMockTechnicals(currentPrice)
    
    // Store in database for future use
    try {
      const signalId = 'signal-' + Math.random().toString(36).substr(2, 9)
      const verdict = mockTechnicals.ema_12 > mockTechnicals.ema_26 && mockTechnicals.rsi > 50 ? 'pass' : 'hold'
      
      await db.prepare(`
        INSERT OR REPLACE INTO signals_intraday (
          id, ticker_id, interval, indicators, verdict, last_price, computed_at
        ) VALUES (?, ?, '5m', ?, ?, ?, CURRENT_TIMESTAMP)
      `).bind(
        signalId,
        tickerId,
        JSON.stringify(mockTechnicals),
        verdict,
        currentPrice
      ).run()
    } catch (error) {
      console.error('Error storing technical indicators:', error)
    }

    return mockTechnicals
  }

  private generateMockTechnicals(currentPrice: number): TechnicalIndicators {
    // Generate realistic technical indicators
    const volatility = Math.random() * 0.1 + 0.02 // 2-12% volatility
    
    return {
      ema_12: currentPrice * (1 + (Math.random() - 0.5) * 0.03), // ±3% from current price
      ema_26: currentPrice * (1 + (Math.random() - 0.5) * 0.05), // ±5% from current price
      rsi: Math.random() * 80 + 10, // 10-90 RSI range
      adx: Math.random() * 60 + 10, // 10-70 ADX range
      atr: currentPrice * volatility, // ATR based on volatility
      price: currentPrice
    }
  }

  // Method to run the complete recommendation pipeline
  async runRecommendationPipeline(db: any, portfolioId: string): Promise<{
    newsProcessed: number
    recommendationsGenerated: number
  }> {
    console.log('Starting complete recommendation pipeline...')

    // First, process latest news
    const newsAnalyzer = new (await import('./news-analyzer')).NewsAnalyzer(this.env)
    const newsProcessed = await newsAnalyzer.processAndStoreNews(db)

    // Then generate recommendations based on news and technical analysis
    const recommendationsGenerated = await this.generateRecommendations(db, portfolioId)

    console.log('Recommendation pipeline complete:', { newsProcessed, recommendationsGenerated })
    
    return { newsProcessed, recommendationsGenerated }
  }
}