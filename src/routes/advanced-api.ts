// Advanced AI Trading API Routes
import { Hono } from 'hono'
import type { Bindings } from '../types'
import { AIPortfolioManager } from '../services/ai-portfolio-manager'
import { TechnicalAnalysisEngine } from '../services/technical-analysis-engine'
import { PortfolioManager } from '../services/portfolio-manager'
import { RiskManagementEngine } from '../services/risk-management-engine'

const app = new Hono<{ Bindings: Bindings }>()

/**
 * Advanced AI Portfolio Analysis
 */
app.post('/ai-analysis/:portfolioId', async (c) => {
  try {
    const portfolioId = c.req.param('portfolioId')
    const aiManager = new AIPortfolioManager(c.env)
    
    console.log(`🚀 Starting advanced AI analysis for portfolio ${portfolioId}`)
    
    // Initialize database
    if (!c.env.DB) {
      throw new Error('Database not available')
    }
    
    // Generate advanced AI recommendations
    const recommendations = await aiManager.generateAdvancedRecommendations(
      c.env.DB, 
      portfolioId
    )
    
    console.log(`✅ Generated ${recommendations.length} AI recommendations`)
    
    return c.json({
      success: true,
      portfolio_id: portfolioId,
      analysis_timestamp: new Date().toISOString(),
      recommendations,
      summary: {
        total_recommendations: recommendations.length,
        buy_signals: recommendations.filter(r => r.action === 'BUY').length,
        sell_signals: recommendations.filter(r => r.action === 'SELL').length,
        hold_signals: recommendations.filter(r => r.action === 'HOLD').length,
        avg_confidence: recommendations.reduce((sum, r) => sum + r.confidence_level, 0) / recommendations.length
      }
    })
    
  } catch (error) {
    console.error('AI Analysis error:', error)
    return c.json({ 
      success: false, 
      error: error.message || 'AI analysis failed' 
    }, 500)
  }
})

/**
 * Multi-timeframe Technical Analysis
 */
app.get('/technical-analysis/:symbol', async (c) => {
  try {
    const symbol = c.req.param('symbol').toUpperCase()
    const depth = c.req.query('depth') || 'comprehensive'
    
    console.log(`🔍 Technical analysis for ${symbol}`)
    
    const techEngine = new TechnicalAnalysisEngine(c.env)
    const analysis = await techEngine.analyzeSymbol(symbol, depth as any)
    
    return c.json({
      success: true,
      symbol,
      analysis,
      generated_at: new Date().toISOString()
    })
    
  } catch (error) {
    console.error(`Technical analysis error for ${c.req.param('symbol')}:`, error)
    return c.json({ 
      success: false, 
      error: error.message || 'Technical analysis failed' 
    }, 500)
  }
})

/**
 * Portfolio Overview with Advanced Metrics
 */
app.get('/portfolio/:portfolioId/overview', async (c) => {
  try {
    const portfolioId = c.req.param('portfolioId')
    
    console.log(`📊 Getting portfolio overview for ${portfolioId}`)
    
    const portfolioManager = new PortfolioManager(c.env)
    const overview = await portfolioManager.getPortfolioOverview(c.env.DB, portfolioId)
    
    return c.json({
      success: true,
      portfolio_id: portfolioId,
      ...overview,
      last_updated: new Date().toISOString()
    })
    
  } catch (error) {
    console.error(`Portfolio overview error for ${c.req.param('portfolioId')}:`, error)
    return c.json({ 
      success: false, 
      error: error.message || 'Portfolio overview failed' 
    }, 500)
  }
})

/**
 * Execute Trade with Advanced Risk Management
 */
app.post('/portfolio/:portfolioId/trade', async (c) => {
  try {
    const portfolioId = c.req.param('portfolioId')
    const tradeRequest = await c.req.json()
    
    console.log(`🔄 Executing trade for portfolio ${portfolioId}:`, tradeRequest)
    
    // Validate required fields
    const { symbol, side, quantity } = tradeRequest
    if (!symbol || !side || !quantity) {
      return c.json({ 
        success: false, 
        error: 'Missing required fields: symbol, side, quantity' 
      }, 400)
    }
    
    const portfolioManager = new PortfolioManager(c.env)
    const trade = await portfolioManager.executeTrade(c.env.DB, {
      portfolio_id: portfolioId,
      ...tradeRequest
    })
    
    return c.json({
      success: true,
      trade,
      message: `${side.toUpperCase()} order executed: ${quantity} shares of ${symbol}`
    })
    
  } catch (error) {
    console.error(`Trade execution error:`, error)
    return c.json({ 
      success: false, 
      error: error.message || 'Trade execution failed' 
    }, 500)
  }
})

/**
 * Position Sizing Calculator
 */
app.post('/risk/position-sizing', async (c) => {
  try {
    const request = await c.req.json()
    const { portfolio_id, symbol, entry_price, target_price, stop_loss } = request
    
    if (!portfolio_id || !symbol || !entry_price || !target_price || !stop_loss) {
      return c.json({
        success: false,
        error: 'Missing required fields: portfolio_id, symbol, entry_price, target_price, stop_loss'
      }, 400)
    }
    
    console.log(`🎯 Calculating position size for ${symbol}`)
    
    const riskEngine = new RiskManagementEngine(c.env)
    const positionSizing = await riskEngine.calculatePositionSize(
      c.env.DB,
      portfolio_id,
      symbol,
      entry_price,
      target_price,
      stop_loss,
      request.risk_parameters
    )
    
    return c.json({
      success: true,
      position_sizing: positionSizing,
      calculated_at: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('Position sizing error:', error)
    return c.json({ 
      success: false, 
      error: error.message || 'Position sizing calculation failed' 
    }, 500)
  }
})

/**
 * Stop Loss Optimization
 */
app.post('/risk/stop-loss-optimization', async (c) => {
  try {
    const request = await c.req.json()
    const { symbol, entry_price, direction = 'long' } = request
    
    if (!symbol || !entry_price) {
      return c.json({
        success: false,
        error: 'Missing required fields: symbol, entry_price'
      }, 400)
    }
    
    console.log(`🛑 Optimizing stop loss for ${symbol}`)
    
    const riskEngine = new RiskManagementEngine(c.env)
    const stopLossOptimization = await riskEngine.optimizeStopLoss(
      c.env.DB,
      symbol,
      entry_price,
      direction,
      request.risk_parameters
    )
    
    return c.json({
      success: true,
      stop_loss_optimization: stopLossOptimization,
      calculated_at: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('Stop loss optimization error:', error)
    return c.json({ 
      success: false, 
      error: error.message || 'Stop loss optimization failed' 
    }, 500)
  }
})

/**
 * Portfolio Risk Metrics
 */
app.get('/portfolio/:portfolioId/risk-metrics', async (c) => {
  try {
    const portfolioId = c.req.param('portfolioId')
    
    console.log(`📊 Calculating risk metrics for portfolio ${portfolioId}`)
    
    const riskEngine = new RiskManagementEngine(c.env)
    const riskMetrics = await riskEngine.calculateRiskMetrics(c.env.DB, portfolioId)
    const riskAlerts = await riskEngine.generateRiskAlerts(c.env.DB, portfolioId, riskMetrics)
    
    return c.json({
      success: true,
      portfolio_id: portfolioId,
      risk_metrics: riskMetrics,
      risk_alerts: riskAlerts,
      calculated_at: new Date().toISOString()
    })
    
  } catch (error) {
    console.error(`Risk metrics error for ${c.req.param('portfolioId')}:`, error)
    return c.json({ 
      success: false, 
      error: error.message || 'Risk metrics calculation failed' 
    }, 500)
  }
})

/**
 * Portfolio Rebalancing Suggestions
 */
app.get('/portfolio/:portfolioId/rebalancing', async (c) => {
  try {
    const portfolioId = c.req.param('portfolioId')
    
    console.log(`⚖️ Generating rebalancing plan for portfolio ${portfolioId}`)
    
    const portfolioManager = new PortfolioManager(c.env)
    const rebalancingPlan = await portfolioManager.generateRebalancingPlan(c.env.DB, portfolioId)
    
    return c.json({
      success: true,
      portfolio_id: portfolioId,
      rebalancing_plan: rebalancingPlan,
      generated_at: new Date().toISOString()
    })
    
  } catch (error) {
    console.error(`Rebalancing error for ${c.req.param('portfolioId')}:`, error)
    return c.json({ 
      success: false, 
      error: error.message || 'Rebalancing calculation failed' 
    }, 500)
  }
})

/**
 * Batch Analysis for Multiple Symbols
 */
app.post('/batch-analysis', async (c) => {
  try {
    const { symbols, analysis_type = 'technical' } = await c.req.json()
    
    if (!symbols || !Array.isArray(symbols) || symbols.length === 0) {
      return c.json({
        success: false,
        error: 'symbols array is required'
      }, 400)
    }
    
    console.log(`🔄 Batch ${analysis_type} analysis for ${symbols.length} symbols`)
    
    const results: any[] = []
    const techEngine = new TechnicalAnalysisEngine(c.env)
    
    // Process up to 10 symbols to avoid timeout
    const symbolsToProcess = symbols.slice(0, 10)
    
    for (const symbol of symbolsToProcess) {
      try {
        if (analysis_type === 'technical') {
          const analysis = await techEngine.analyzeSymbol(symbol, 'basic')
          results.push({
            symbol,
            success: true,
            analysis: {
              setup_quality_score: analysis.setup_quality.score,
              overall_trend: analysis.overall_trend,
              signal_direction: analysis.timeframes['1h']?.signal_direction || 'hold',
              confidence: analysis.timeframes['1h']?.signal_strength || 0
            }
          })
        }
      } catch (error) {
        results.push({
          symbol,
          success: false,
          error: error.message
        })
      }
    }
    
    return c.json({
      success: true,
      analysis_type,
      symbols_analyzed: symbolsToProcess.length,
      results,
      summary: {
        successful: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length,
        buy_signals: results.filter(r => r.success && r.analysis?.signal_direction === 'buy').length,
        sell_signals: results.filter(r => r.success && r.analysis?.signal_direction === 'sell').length
      }
    })
    
  } catch (error) {
    console.error('Batch analysis error:', error)
    return c.json({ 
      success: false, 
      error: error.message || 'Batch analysis failed' 
    }, 500)
  }
})

/**
 * Market Regime Detection
 */
app.get('/market/regime', async (c) => {
  try {
    console.log('🌍 Detecting market regime')
    
    // This would integrate with more sophisticated market regime detection
    // For now, provide enhanced mock data based on multiple indicators
    
    const regimeData = {
      current_regime: Math.random() > 0.6 ? 'bull' : Math.random() > 0.3 ? 'bear' : 'sideways',
      confidence: 0.7 + Math.random() * 0.25, // 70-95% confidence
      regime_duration_days: Math.floor(Math.random() * 60) + 10, // 10-70 days
      
      market_indicators: {
        vix_level: 15 + Math.random() * 20,        // VIX 15-35
        spy_trend: Math.random() > 0.5 ? 'up' : 'down',
        sector_rotation: ['Technology', 'Healthcare', 'Energy'].sort(() => Math.random() - 0.5).slice(0, 2),
        breadth_indicators: {
          advancing_stocks_pct: 30 + Math.random() * 40, // 30-70%
          new_highs_vs_lows: (Math.random() - 0.5) * 100, // -50 to +50
          volume_trend: Math.random() > 0.5 ? 'increasing' : 'decreasing'
        }
      },
      
      trading_recommendations: {
        position_sizing_adjustment: Math.random() > 0.5 ? 'increase' : 'decrease',
        sector_focus: ['Technology', 'Financials', 'Healthcare'][Math.floor(Math.random() * 3)],
        volatility_strategy: Math.random() > 0.5 ? 'trend_following' : 'mean_reversion'
      },
      
      regime_probability: {
        bull: Math.random() * 0.4 + 0.1,    // 10-50%
        bear: Math.random() * 0.3 + 0.05,   // 5-35%
        sideways: Math.random() * 0.4 + 0.15 // 15-55%
      }
    }
    
    // Normalize probabilities
    const total = regimeData.regime_probability.bull + 
                 regimeData.regime_probability.bear + 
                 regimeData.regime_probability.sideways
    
    regimeData.regime_probability.bull /= total
    regimeData.regime_probability.bear /= total  
    regimeData.regime_probability.sideways /= total
    
    return c.json({
      success: true,
      regime_analysis: regimeData,
      analyzed_at: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('Market regime detection error:', error)
    return c.json({ 
      success: false, 
      error: error.message || 'Market regime detection failed' 
    }, 500)
  }
})

/**
 * Advanced Performance Analytics
 */
app.get('/portfolio/:portfolioId/performance', async (c) => {
  try {
    const portfolioId = c.req.param('portfolioId')
    const timeframe = c.req.query('timeframe') || '1M' // 1D, 1W, 1M, 3M, 6M, 1Y
    
    console.log(`📈 Performance analytics for portfolio ${portfolioId} (${timeframe})`)
    
    // This would calculate detailed performance metrics
    // For now, provide comprehensive mock analytics
    
    const performanceData = {
      timeframe,
      portfolio_id: portfolioId,
      
      returns: {
        total_return: (Math.random() - 0.3) * 20,      // -6% to +14%
        annualized_return: (Math.random() - 0.2) * 25, // -5% to +20%
        benchmark_return: (Math.random() - 0.1) * 15,  // -1.5% to +13.5%
        excess_return: 0, // Will calculate below
        
        best_day: Math.random() * 8 + 1,               // 1-9%
        worst_day: -(Math.random() * 6 + 1),           // -1% to -7%
        positive_days_pct: 45 + Math.random() * 20     // 45-65%
      },
      
      risk_metrics: {
        volatility: 12 + Math.random() * 18,           // 12-30%
        max_drawdown: -(Math.random() * 15 + 3),       // -3% to -18%
        sharpe_ratio: Math.random() * 2 - 0.5,         // -0.5 to +1.5
        sortino_ratio: Math.random() * 2.5 - 0.2,      // -0.2 to +2.3
        beta: 0.7 + Math.random() * 0.8,               // 0.7 to 1.5
        
        var_95: Math.random() * 4 + 1,                 // 1-5% daily VaR
        correlation_to_spy: 0.4 + Math.random() * 0.5  // 40-90% correlation
      },
      
      position_analysis: {
        total_trades: Math.floor(Math.random() * 50) + 10,
        winning_trades: 0, // Will calculate
        win_rate: 40 + Math.random() * 30,             // 40-70%
        avg_win: Math.random() * 8 + 2,                // 2-10%
        avg_loss: -(Math.random() * 4 + 1),            // -1% to -5%
        
        best_trade: Math.random() * 25 + 5,            // 5-30%
        worst_trade: -(Math.random() * 15 + 3),        // -3% to -18%
        avg_holding_period: Math.floor(Math.random() * 20) + 5, // 5-25 days
        
        sector_performance: {
          'Technology': (Math.random() - 0.3) * 20,
          'Healthcare': (Math.random() - 0.2) * 15,
          'Financials': (Math.random() - 0.4) * 18,
          'Energy': (Math.random() - 0.1) * 25
        }
      },
      
      monthly_returns: Array.from({ length: 12 }, (_, i) => ({
        month: new Date(2024, i, 1).toLocaleString('default', { month: 'short' }),
        return_pct: (Math.random() - 0.3) * 12 // -3.6% to +8.4% monthly
      })),
      
      drawdown_periods: [
        {
          start_date: '2024-08-15',
          end_date: '2024-09-02',
          duration_days: 18,
          max_drawdown_pct: -8.5,
          recovery_date: '2024-09-15'
        }
      ]
    }
    
    // Calculate derived metrics
    performanceData.returns.excess_return = 
      performanceData.returns.total_return - performanceData.returns.benchmark_return
    
    performanceData.position_analysis.winning_trades = 
      Math.floor(performanceData.position_analysis.total_trades * 
                performanceData.position_analysis.win_rate / 100)
    
    return c.json({
      success: true,
      performance_analytics: performanceData,
      generated_at: new Date().toISOString()
    })
    
  } catch (error) {
    console.error(`Performance analytics error for ${c.req.param('portfolioId')}:`, error)
    return c.json({ 
      success: false, 
      error: error.message || 'Performance analytics failed' 
    }, 500)
  }
})

export default app