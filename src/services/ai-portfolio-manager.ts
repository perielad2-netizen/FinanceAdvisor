// Advanced AI Portfolio Manager with sophisticated reasoning
import type { Bindings } from '../types'

export interface MarketContext {
  marketRegime: 'bull' | 'bear' | 'sideways' | 'high_volatility'
  vixLevel: number
  sectorRotation: string[]
  economicIndicators: {
    gdp_growth: number
    inflation_rate: number
    fed_rate: number
    unemployment: number
  }
}

export interface MultiTimeframeAnalysis {
  timeframes: {
    '1m': TechnicalSnapshot
    '5m': TechnicalSnapshot
    '15m': TechnicalSnapshot
    '1h': TechnicalSnapshot
    '4h': TechnicalSnapshot
    '1d': TechnicalSnapshot
  }
  alignment_score: number // 0-1 how aligned all timeframes are
  trend_strength: number  // 0-1 overall trend strength
}

interface TechnicalSnapshot {
  price: number
  ema_fast: number
  ema_slow: number
  rsi: number
  macd_signal: 'bullish' | 'bearish' | 'neutral'
  volume_profile: 'high' | 'normal' | 'low'
  support_levels: number[]
  resistance_levels: number[]
  trend_direction: 'up' | 'down' | 'sideways'
  volatility: number
}

export interface EnhancedNewsAnalysis {
  articles: {
    title: string
    sentiment_score: number    // -1 to 1
    impact_score: number      // 0 to 1
    credibility_score: number // 0 to 1  
    topic_categories: string[]
    entities_mentioned: string[]
    time_relevance: number    // 0 to 1 (newer = higher)
    market_moving_potential: number // 0 to 1
  }[]
  aggregated_sentiment: number
  news_momentum: 'accelerating' | 'stable' | 'declining'
  risk_events: string[]
}

export interface AIRecommendation {
  action: 'BUY' | 'SELL' | 'HOLD' | 'REDUCE' | 'INCREASE' | 'CLOSE'
  symbol: string
  confidence_level: number  // 0 to 1
  position_size: number     // As percentage of portfolio
  entry_price: number
  target_prices: number[]   // Multiple profit targets
  stop_loss: number
  time_horizon: '1h' | '4h' | '1d' | '1w' | '1m'
  reasoning: {
    technical_factors: string[]
    fundamental_factors: string[]
    sentiment_factors: string[]
    risk_factors: string[]
    market_context: string[]
  }
  risk_reward_ratio: number
  max_drawdown_expected: number
  probability_of_success: number
  alternative_scenarios: {
    bullish: { target: number, probability: number }
    bearish: { target: number, probability: number }
    sideways: { action: string, probability: number }
  }
}

export class AIPortfolioManager {
  constructor(private env: Bindings) {}

  /**
   * Advanced AI-powered portfolio analysis using sophisticated prompts
   */
  async generateAdvancedRecommendations(
    db: any, 
    portfolioId: string,
    marketContext?: MarketContext
  ): Promise<AIRecommendation[]> {
    console.log('🚀 Starting Advanced AI Portfolio Analysis...')

    // Get portfolio and holdings
    const portfolio = await this.getPortfolioWithHoldings(db, portfolioId)
    if (!portfolio) throw new Error('Portfolio not found')

    const recommendations: AIRecommendation[] = []

    // Analyze each holding and watchlist item
    for (const ticker of portfolio.tickers) {
      try {
        console.log(`🔍 Deep analysis for ${ticker.symbol}...`)

        // Multi-timeframe technical analysis
        const multiTFAnalysis = await this.getMultiTimeframeAnalysis(db, ticker.id, ticker.symbol)
        
        // Enhanced news sentiment analysis
        const newsAnalysis = await this.getEnhancedNewsAnalysis(db, ticker.id, ticker.symbol)
        
        // Current market context
        const currentMarketContext = marketContext || await this.determineMarketContext()

        // Generate AI recommendation using advanced prompting
        const recommendation = await this.callAdvancedAI({
          symbol: ticker.symbol,
          currentPrice: ticker.current_price || await this.getCurrentPrice(ticker.symbol),
          multiTFAnalysis,
          newsAnalysis,
          marketContext: currentMarketContext,
          portfolioContext: {
            totalValue: portfolio.total_value,
            riskTolerance: portfolio.risk_tolerance,
            currentPosition: ticker.position_size || 0,
            avgCostBasis: ticker.avg_cost || 0
          }
        })

        if (recommendation) {
          recommendations.push(recommendation)
        }

      } catch (error) {
        console.error(`❌ Error analyzing ${ticker.symbol}:`, error)
      }
    }

    // Portfolio-level risk analysis and rebalancing suggestions
    const portfolioRebalancing = await this.analyzePortfolioBalance(db, portfolio, recommendations)
    recommendations.push(...portfolioRebalancing)

    return recommendations
  }

  /**
   * Advanced AI prompting for sophisticated market analysis
   */
  private async callAdvancedAI(context: {
    symbol: string
    currentPrice: number
    multiTFAnalysis: MultiTimeframeAnalysis
    newsAnalysis: EnhancedNewsAnalysis
    marketContext: MarketContext
    portfolioContext: any
  }): Promise<AIRecommendation | null> {

    if (!this.env.OPENAI_API_KEY) {
      console.log('⚠️ No OpenAI key - using enhanced rule-based analysis')
      return this.generateRuleBasedRecommendation(context)
    }

    // Sophisticated prompt engineering for portfolio management
    const systemPrompt = `You are an elite quantitative portfolio manager and trading strategist with 20+ years of experience managing billions in assets. You combine deep technical analysis, fundamental research, and behavioral finance insights to generate superior risk-adjusted returns.

CORE COMPETENCIES:
- Multi-timeframe technical analysis across all major timeframes
- Advanced sentiment analysis and news flow interpretation  
- Market regime identification and adaptive strategy selection
- Position sizing using Kelly Criterion and risk parity principles
- Options strategies for hedging and income generation
- Macro-economic analysis and sector rotation strategies
- Behavioral finance and crowd psychology understanding

ANALYSIS FRAMEWORK:
1. Market Regime Assessment (Bull/Bear/Sideways/High Vol)
2. Multi-Timeframe Alignment (1m to 1d confirmations)
3. News Flow and Sentiment Momentum Analysis
4. Technical Setup Quality and Risk/Reward Assessment
5. Position Sizing Based on Kelly Criterion
6. Risk Management and Downside Protection

DECISION CRITERIA:
- Only recommend trades with >65% probability of success
- Risk/Reward ratio must be >2:1 for new positions
- Consider correlation with existing portfolio positions
- Account for upcoming events (earnings, FOMC, economic data)
- Factor in current market volatility and liquidity conditions

RESPONSE FORMAT: Provide analysis in structured JSON format with detailed reasoning for each component.`

    const userPrompt = `Analyze this trading opportunity for ${context.symbol}:

CURRENT MARKET CONTEXT:
- Market Regime: ${context.marketContext.marketRegime}
- VIX Level: ${context.marketContext.vixLevel}
- Fed Rate: ${context.marketContext.economicIndicators.fed_rate}%
- Inflation: ${context.marketContext.economicIndicators.inflation_rate}%

TECHNICAL ANALYSIS (Multi-Timeframe):
- Current Price: $${context.currentPrice}
- Timeframe Alignment Score: ${context.multiTFAnalysis.alignment_score}/1.0
- Trend Strength: ${context.multiTFAnalysis.trend_strength}/1.0
- 1H Trend: ${context.multiTFAnalysis.timeframes['1h']?.trend_direction || 'unknown'}
- 4H Trend: ${context.multiTFAnalysis.timeframes['4h']?.trend_direction || 'unknown'}  
- Daily Trend: ${context.multiTFAnalysis.timeframes['1d']?.trend_direction || 'unknown'}
- RSI (1H): ${context.multiTFAnalysis.timeframes['1h']?.rsi || 'N/A'}
- Volume Profile: ${context.multiTFAnalysis.timeframes['1h']?.volume_profile || 'normal'}

SENTIMENT & NEWS ANALYSIS:
- Aggregated Sentiment: ${context.newsAnalysis.aggregated_sentiment?.toFixed(2) || 'neutral'}
- News Momentum: ${context.newsAnalysis.news_momentum || 'stable'}
- Risk Events: ${context.newsAnalysis.risk_events?.join(', ') || 'none'}
- Recent Headlines: ${context.newsAnalysis.articles?.slice(0, 3).map(a => a.title).join(' | ') || 'none'}

PORTFOLIO CONTEXT:
- Current Position: ${context.portfolioContext.currentPosition} shares
- Avg Cost Basis: $${context.portfolioContext.avgCostBasis}
- Portfolio Value: $${context.portfolioContext.totalValue}
- Risk Tolerance: ${context.portfolioContext.riskTolerance}

Based on this comprehensive analysis, provide your expert recommendation as a JSON object with the following structure:
{
  "action": "BUY|SELL|HOLD|REDUCE|INCREASE|CLOSE",
  "confidence_level": 0.85,
  "position_size": 0.05,
  "entry_price": 256.25,
  "target_prices": [265.00, 275.00, 290.00],
  "stop_loss": 248.50,
  "time_horizon": "1w",
  "reasoning": {
    "technical_factors": ["Strong bullish momentum", "Multiple timeframe alignment"],
    "fundamental_factors": ["Strong earnings growth", "Market leadership"],
    "sentiment_factors": ["Positive analyst upgrades", "Institutional buying"],
    "risk_factors": ["High volatility expected", "Earnings next week"],
    "market_context": ["Bull market conditions", "Low VIX environment"]
  },
  "risk_reward_ratio": 2.5,
  "probability_of_success": 0.75,
  "alternative_scenarios": {
    "bullish": {"target": 290, "probability": 0.45},
    "bearish": {"target": 240, "probability": 0.25},
    "sideways": {"action": "theta decay play", "probability": 0.30}
  }
}`

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          temperature: 0.3, // Lower temperature for more consistent analysis
          max_tokens: 2000
        })
      })

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`)
      }

      const data = await response.json()
      const aiResponse = data.choices[0]?.message?.content

      if (!aiResponse) {
        throw new Error('No response from OpenAI')
      }

      // Extract JSON from response
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        throw new Error('No valid JSON found in AI response')
      }

      const recommendation: AIRecommendation = JSON.parse(jsonMatch[0])
      recommendation.symbol = context.symbol

      console.log(`✅ AI recommendation for ${context.symbol}: ${recommendation.action} (${(recommendation.confidence_level * 100).toFixed(0)}% confidence)`)
      
      return recommendation

    } catch (error) {
      console.error(`❌ AI analysis error for ${context.symbol}:`, error)
      return this.generateRuleBasedRecommendation(context)
    }
  }

  /**
   * Enhanced rule-based fallback with sophisticated logic
   */
  private generateRuleBasedRecommendation(context: any): AIRecommendation {
    const { symbol, currentPrice, multiTFAnalysis, newsAnalysis } = context

    // Multi-timeframe trend alignment
    const alignmentScore = multiTFAnalysis.alignment_score
    const trendStrength = multiTFAnalysis.trend_strength
    
    // News sentiment impact  
    const sentimentScore = newsAnalysis.aggregated_sentiment || 0
    const newsImpact = Math.abs(sentimentScore) > 0.3 ? 'significant' : 'minimal'

    // Generate recommendation based on enhanced rules
    let action: AIRecommendation['action'] = 'HOLD'
    let confidence = 0.5
    let positionSize = 0.02 // Default 2% position

    // Strong bullish setup
    if (alignmentScore > 0.7 && trendStrength > 0.6 && sentimentScore > 0.2) {
      action = 'BUY'
      confidence = 0.75 + (alignmentScore * 0.2)
      positionSize = 0.03 + (trendStrength * 0.02)
    }
    // Strong bearish setup
    else if (alignmentScore < 0.3 && sentimentScore < -0.3) {
      action = 'SELL'
      confidence = 0.65 + (Math.abs(sentimentScore) * 0.2)
      positionSize = 0.02
    }
    // Moderate bullish with good risk/reward
    else if (alignmentScore > 0.6 && sentimentScore > 0.1) {
      action = 'BUY'
      confidence = 0.65
      positionSize = 0.025
    }

    const stopLossDistance = currentPrice * 0.03 // 3% stop loss
    const targetDistance = currentPrice * 0.06   // 6% target (2:1 R/R)

    return {
      action,
      symbol,
      confidence_level: Math.min(confidence, 0.95),
      position_size: Math.min(positionSize, 0.05),
      entry_price: currentPrice,
      target_prices: [
        currentPrice + targetDistance,
        currentPrice + (targetDistance * 1.5),
        currentPrice + (targetDistance * 2)
      ],
      stop_loss: currentPrice - stopLossDistance,
      time_horizon: '1w',
      reasoning: {
        technical_factors: [
          `Timeframe alignment: ${(alignmentScore * 100).toFixed(0)}%`,
          `Trend strength: ${(trendStrength * 100).toFixed(0)}%`
        ],
        fundamental_factors: ['Enhanced rule-based analysis'],
        sentiment_factors: [
          `News sentiment: ${sentimentScore > 0 ? 'positive' : sentimentScore < 0 ? 'negative' : 'neutral'}`,
          `Impact level: ${newsImpact}`
        ],
        risk_factors: ['Standard volatility assumptions'],
        market_context: ['General market conditions']
      },
      risk_reward_ratio: 2.0,
      max_drawdown_expected: 0.05,
      probability_of_success: confidence,
      alternative_scenarios: {
        bullish: { target: currentPrice * 1.08, probability: 0.4 },
        bearish: { target: currentPrice * 0.94, probability: 0.3 },
        sideways: { action: 'range trading', probability: 0.3 }
      }
    }
  }

  /**
   * Multi-timeframe technical analysis
   */
  private async getMultiTimeframeAnalysis(db: any, tickerId: string, symbol: string): Promise<MultiTimeframeAnalysis> {
    // For now, generate enhanced mock data
    // TODO: Integrate with real technical analysis APIs
    
    const basePrice = await this.getCurrentPrice(symbol)
    const timeframes = ['1m', '5m', '15m', '1h', '4h', '1d'] as const
    
    const analysis: MultiTimeframeAnalysis = {
      timeframes: {} as any,
      alignment_score: 0,
      trend_strength: 0
    }

    let bullishTimeframes = 0
    let totalStrength = 0

    for (const tf of timeframes) {
      const volatility = Math.random() * 0.1 + 0.02
      const trend = Math.random() > 0.5 ? 'up' : Math.random() > 0.3 ? 'down' : 'sideways'
      const rsi = Math.random() * 80 + 10
      
      if (trend === 'up') bullishTimeframes++
      
      const strength = trend === 'up' ? 0.6 + Math.random() * 0.4 : 
                     trend === 'down' ? 0.2 + Math.random() * 0.3 : 
                     0.4 + Math.random() * 0.2
      totalStrength += strength

      analysis.timeframes[tf] = {
        price: basePrice * (1 + (Math.random() - 0.5) * 0.02),
        ema_fast: basePrice * (1 + (Math.random() - 0.5) * 0.01),
        ema_slow: basePrice * (1 + (Math.random() - 0.5) * 0.02),
        rsi,
        macd_signal: rsi > 60 ? 'bullish' : rsi < 40 ? 'bearish' : 'neutral',
        volume_profile: Math.random() > 0.7 ? 'high' : Math.random() > 0.3 ? 'normal' : 'low',
        support_levels: [basePrice * 0.95, basePrice * 0.92, basePrice * 0.88],
        resistance_levels: [basePrice * 1.05, basePrice * 1.08, basePrice * 1.12],
        trend_direction: trend,
        volatility
      }
    }

    analysis.alignment_score = bullishTimeframes / timeframes.length
    analysis.trend_strength = totalStrength / timeframes.length

    return analysis
  }

  /**
   * Enhanced news sentiment analysis
   */
  private async getEnhancedNewsAnalysis(db: any, tickerId: string, symbol: string): Promise<EnhancedNewsAnalysis> {
    const recentNews = await db.prepare(`
      SELECT title, sentiment, relevance, published_at, reason
      FROM news_items 
      WHERE ticker_id = ? 
        AND processed_at > datetime('now', '-24 hours')
        AND is_sponsored = false
      ORDER BY published_at DESC
      LIMIT 10
    `).bind(tickerId).all()

    const articles = (recentNews.results || []).map((news: any) => ({
      title: news.title,
      sentiment_score: news.sentiment || 0,
      impact_score: news.relevance || 0.5,
      credibility_score: 0.8, // Would integrate with source credibility scoring
      topic_categories: ['general'], // Would use NLP for topic extraction
      entities_mentioned: [symbol],
      time_relevance: this.calculateTimeRelevance(news.published_at),
      market_moving_potential: Math.abs(news.sentiment || 0) * (news.relevance || 0.5)
    }))

    const aggregatedSentiment = articles.length > 0 ? 
      articles.reduce((sum, a) => sum + a.sentiment_score, 0) / articles.length : 0

    return {
      articles,
      aggregated_sentiment: aggregatedSentiment,
      news_momentum: this.determineNewsMomentum(articles),
      risk_events: this.identifyRiskEvents(articles)
    }
  }

  private calculateTimeRelevance(publishedAt: string): number {
    const now = new Date()
    const published = new Date(publishedAt)
    const hoursAgo = (now.getTime() - published.getTime()) / (1000 * 60 * 60)
    
    // Linear decay over 24 hours
    return Math.max(0, 1 - (hoursAgo / 24))
  }

  private determineNewsMomentum(articles: any[]): 'accelerating' | 'stable' | 'declining' {
    if (articles.length < 3) return 'stable'
    
    const recent = articles.slice(0, 3).reduce((sum, a) => sum + Math.abs(a.sentiment_score), 0) / 3
    const older = articles.slice(3, 6).reduce((sum, a) => sum + Math.abs(a.sentiment_score), 0) / 3
    
    if (recent > older * 1.2) return 'accelerating'
    if (recent < older * 0.8) return 'declining'
    return 'stable'
  }

  private identifyRiskEvents(articles: any[]): string[] {
    const riskKeywords = ['lawsuit', 'investigation', 'hack', 'breach', 'warning', 'downgrade', 'recession']
    const riskEvents: string[] = []
    
    for (const article of articles) {
      for (const keyword of riskKeywords) {
        if (article.title.toLowerCase().includes(keyword)) {
          riskEvents.push(`${keyword}: ${article.title.substring(0, 50)}...`)
          break
        }
      }
    }
    
    return riskEvents
  }

  /**
   * Determine current market context
   */
  private async determineMarketContext(): Promise<MarketContext> {
    // This would integrate with market data APIs
    // For now, return reasonable defaults
    return {
      marketRegime: 'bull', // Would analyze SPY, VIX, sector performance
      vixLevel: 15 + Math.random() * 10, // 15-25 range
      sectorRotation: ['Technology', 'Healthcare', 'Financials'],
      economicIndicators: {
        gdp_growth: 2.5 + Math.random(),
        inflation_rate: 3.0 + Math.random(),
        fed_rate: 5.25 + Math.random() * 0.5,
        unemployment: 3.5 + Math.random() * 0.5
      }
    }
  }

  private async getCurrentPrice(symbol: string): Promise<number> {
    // Reuse existing price fetching logic
    const engine = new (await import('./recommendation-engine')).RecommendationEngine(this.env)
    return (engine as any).getCurrentPrice(symbol)
  }

  private async getPortfolioWithHoldings(db: any, portfolioId: string) {
    const portfolio = await db.prepare(`
      SELECT p.*, ps.per_trade_fraction, ps.sentiment_threshold, ps.max_open_positions,
             ps.timing_gate_enabled, ps.take_profit_pct, ps.stop_loss_pct
      FROM portfolios p
      LEFT JOIN portfolio_settings ps ON p.id = ps.portfolio_id
      WHERE p.id = ?
    `).bind(portfolioId).first()

    if (!portfolio) return null

    const tickers = await db.prepare(`
      SELECT pt.*, t.symbol, t.company_name
      FROM portfolio_tickers pt
      JOIN tickers t ON pt.ticker_id = t.id
      WHERE pt.portfolio_id = ? AND pt.enabled = true
    `).bind(portfolioId).all()

    return {
      ...portfolio,
      tickers: tickers.results || []
    }
  }

  private async analyzePortfolioBalance(db: any, portfolio: any, recommendations: AIRecommendation[]): Promise<AIRecommendation[]> {
    // Portfolio-level risk analysis and rebalancing suggestions
    // This would analyze correlation, concentration risk, sector allocation etc.
    return [] // Placeholder for now
  }
}