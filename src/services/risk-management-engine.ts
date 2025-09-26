// Advanced Risk Management Engine with Position Sizing and Stop-Loss Optimization
import type { Bindings } from '../types'

export interface RiskParameters {
  // Portfolio-level risk limits
  max_portfolio_risk: number      // Max % of portfolio at risk
  max_position_size: number       // Max % per single position
  max_sector_allocation: number   // Max % per sector
  max_correlation_exposure: number // Max exposure to correlated assets
  
  // Position-level risk controls
  max_position_loss: number       // Max loss per position (%)
  position_sizing_method: 'fixed' | 'kelly' | 'volatility_adjusted' | 'equal_weight'
  stop_loss_method: 'fixed' | 'atr' | 'volatility' | 'support_resistance'
  
  // Market condition adjustments
  volatility_adjustment: boolean  // Adjust sizes based on VIX/volatility
  trend_following_mode: boolean   // Increase sizes in strong trends
  regime_awareness: boolean       // Adjust for bull/bear/sideways markets
  
  // Advanced risk metrics
  var_confidence_level: number    // Value at Risk confidence (0.95, 0.99)
  max_drawdown_limit: number      // Portfolio drawdown limit
  liquidity_requirements: number  // Minimum cash percentage
  
  // Time-based controls
  max_holding_period: number      // Max days to hold losing positions
  profit_taking_rules: {
    partial_profit_1: { pct_gain: number, reduce_by: number }
    partial_profit_2: { pct_gain: number, reduce_by: number }
    trailing_stop: { activation_pct: number, trail_distance: number }
  }
}

export interface PositionSizing {
  symbol: string
  recommended_shares: number
  recommended_dollar_amount: number
  position_size_pct: number
  risk_per_share: number
  total_position_risk: number
  
  sizing_method: string
  reasoning: string[]
  
  // Kelly Criterion specific
  kelly_percentage?: number
  win_probability?: number
  avg_win_loss_ratio?: number
  
  // Volatility adjusted
  volatility_factor?: number
  atr_multiple?: number
  
  // Risk-adjusted metrics
  sharpe_expectation?: number
  max_adverse_excursion?: number
}

export interface StopLossOptimization {
  symbol: string
  current_price: number
  
  // Different stop loss methods
  fixed_percentage_stop: number
  atr_based_stop: number
  volatility_based_stop: number
  support_resistance_stop: number
  
  // Recommended stop loss
  recommended_stop: number
  recommended_method: string
  
  // Stop loss analytics
  probability_of_hit: number      // Chance stop will be hit based on volatility
  risk_reward_ratio: number       // Risk vs potential reward
  expected_holding_period: number  // Days until stop hit or target reached
  
  // Trailing stop suggestions
  trailing_stop_activation: number
  trailing_stop_distance: number
  
  reasoning: string[]
}

export interface RiskMetrics {
  portfolio_var_95: number        // Value at Risk (95% confidence)
  portfolio_var_99: number        // Value at Risk (99% confidence)
  expected_shortfall: number      // Expected loss beyond VaR
  maximum_drawdown: number        // Historical max drawdown
  current_drawdown: number        // Current drawdown from peak
  
  // Concentration risks
  single_position_risk: number    // Largest position risk
  sector_concentration: { [sector: string]: number }
  correlation_risk: number        // Risk from correlated positions
  
  // Liquidity risks
  portfolio_liquidity: number     // Days to liquidate portfolio
  cash_buffer: number            // Available cash percentage
  
  // Market risk factors
  portfolio_beta: number         // Systematic risk
  market_correlation: number     // Correlation to market
  volatility: number            // Portfolio volatility
  
  // Risk-adjusted returns
  sharpe_ratio: number
  sortino_ratio: number         // Downside deviation adjusted
  calmar_ratio: number          // Drawdown adjusted
  
  // Forward-looking risk estimates
  estimated_1d_risk: number     // 1-day risk estimate
  estimated_1w_risk: number     // 1-week risk estimate
  estimated_1m_risk: number     // 1-month risk estimate
}

export interface RiskAlert {
  id: string
  severity: 'info' | 'warning' | 'danger' | 'critical'
  type: 'position_limit' | 'portfolio_limit' | 'drawdown' | 'correlation' | 'liquidity' | 'volatility'
  title: string
  message: string
  affected_symbols: string[]
  recommended_actions: string[]
  auto_actionable: boolean       // Can be automatically resolved
  created_at: string
}

export class RiskManagementEngine {
  private defaultRiskParams: RiskParameters = {
    max_portfolio_risk: 15,        // 15% max portfolio risk
    max_position_size: 10,         // 10% max per position
    max_sector_allocation: 25,     // 25% max per sector
    max_correlation_exposure: 40,  // 40% max in correlated assets
    
    max_position_loss: 5,          // 5% max loss per position
    position_sizing_method: 'kelly',
    stop_loss_method: 'atr',
    
    volatility_adjustment: true,
    trend_following_mode: true,
    regime_awareness: true,
    
    var_confidence_level: 0.95,
    max_drawdown_limit: 20,        // 20% max drawdown
    liquidity_requirements: 10,    // 10% minimum cash
    
    max_holding_period: 60,        // 60 days max for losing positions
    profit_taking_rules: {
      partial_profit_1: { pct_gain: 15, reduce_by: 25 }, // Take 25% profit at 15% gain
      partial_profit_2: { pct_gain: 30, reduce_by: 50 }, // Take 50% profit at 30% gain
      trailing_stop: { activation_pct: 20, trail_distance: 8 } // Trail at 8% after 20% gain
    }
  }

  constructor(private env: Bindings) {}

  /**
   * Calculate optimal position size based on various risk management methods
   */
  async calculatePositionSize(
    db: any,
    portfolioId: string,
    symbol: string,
    entryPrice: number,
    targetPrice: number,
    stopLoss: number,
    riskParams?: Partial<RiskParameters>
  ): Promise<PositionSizing> {
    
    console.log(`🎯 Calculating position size for ${symbol} @ $${entryPrice}`)

    const params = { ...this.defaultRiskParams, ...riskParams }
    const portfolioValue = await this.getPortfolioValue(db, portfolioId)
    
    // Calculate risk per share
    const riskPerShare = Math.abs(entryPrice - stopLoss)
    const potentialReward = Math.abs(targetPrice - entryPrice)
    const riskRewardRatio = potentialReward / riskPerShare
    
    // Get historical performance data for Kelly Criterion
    const historicalData = await this.getSymbolHistoricalPerformance(db, symbol)
    
    let recommendedShares = 0
    let sizingMethod = params.position_sizing_method
    let reasoning: string[] = []

    switch (params.position_sizing_method) {
      case 'fixed':
        recommendedShares = this.calculateFixedPercentageSize(portfolioValue, entryPrice, params.max_position_size)
        reasoning.push(`Fixed ${params.max_position_size}% position sizing`)
        break
        
      case 'kelly':
        const kellySize = await this.calculateKellyCriterion(historicalData, riskPerShare, potentialReward)
        recommendedShares = Math.min(
          kellySize.shares,
          this.calculateFixedPercentageSize(portfolioValue, entryPrice, params.max_position_size)
        )
        sizingMethod = 'kelly'
        reasoning.push(`Kelly Criterion: ${(kellySize.kelly_percentage * 100).toFixed(1)}% allocation`)
        reasoning.push(`Win probability: ${(kellySize.win_probability * 100).toFixed(1)}%`)
        break
        
      case 'volatility_adjusted':
        recommendedShares = await this.calculateVolatilityAdjustedSize(
          db, symbol, portfolioValue, entryPrice, riskPerShare, params
        )
        reasoning.push('Volatility-adjusted position sizing')
        break
        
      case 'equal_weight':
        const targetPositions = 10 // Assume 10 positions target
        recommendedShares = Math.floor((portfolioValue / targetPositions) / entryPrice)
        reasoning.push(`Equal weight sizing (${100/targetPositions}% target per position)`)
        break
    }

    // Apply portfolio-level risk limits
    const maxSharesByPortfolioRisk = this.calculateMaxSharesByPortfolioRisk(
      portfolioValue, entryPrice, riskPerShare, params.max_portfolio_risk
    )
    
    if (recommendedShares > maxSharesByPortfolioRisk) {
      recommendedShares = maxSharesByPortfolioRisk
      reasoning.push(`Limited by ${params.max_portfolio_risk}% max portfolio risk`)
    }

    // Apply volatility adjustments if enabled
    if (params.volatility_adjustment) {
      const volatilityAdjustment = await this.getVolatilityAdjustment(symbol)
      recommendedShares = Math.floor(recommendedShares * volatilityAdjustment.factor)
      reasoning.push(`Volatility adjustment: ${(volatilityAdjustment.factor * 100).toFixed(0)}%`)
    }

    // Market regime adjustments
    if (params.regime_awareness) {
      const regimeAdjustment = await this.getMarketRegimeAdjustment()
      recommendedShares = Math.floor(recommendedShares * regimeAdjustment)
      reasoning.push(`Market regime adjustment: ${(regimeAdjustment * 100).toFixed(0)}%`)
    }

    const dollarAmount = recommendedShares * entryPrice
    const positionSizePct = (dollarAmount / portfolioValue) * 100
    const totalPositionRisk = recommendedShares * riskPerShare

    console.log(`✅ Position sizing complete: ${recommendedShares} shares (${positionSizePct.toFixed(1)}% of portfolio)`)

    return {
      symbol,
      recommended_shares: Math.max(0, recommendedShares),
      recommended_dollar_amount: dollarAmount,
      position_size_pct: positionSizePct,
      risk_per_share: riskPerShare,
      total_position_risk: totalPositionRisk,
      sizing_method: sizingMethod,
      reasoning
    }
  }

  /**
   * Optimize stop loss placement using multiple methods
   */
  async optimizeStopLoss(
    db: any,
    symbol: string,
    entryPrice: number,
    direction: 'long' | 'short' = 'long',
    riskParams?: Partial<RiskParameters>
  ): Promise<StopLossOptimization> {
    
    console.log(`🛑 Optimizing stop loss for ${symbol} @ $${entryPrice}`)

    const params = { ...this.defaultRiskParams, ...riskParams }
    
    // Get technical analysis data
    const technicalData = await this.getTechnicalAnalysisData(symbol)
    const volatilityData = await this.getVolatilityData(symbol)
    
    // Calculate different stop loss methods
    const fixedPercentageStop = direction === 'long' ? 
      entryPrice * (1 - params.max_position_loss / 100) :
      entryPrice * (1 + params.max_position_loss / 100)
    
    const atrBasedStop = direction === 'long' ?
      entryPrice - (technicalData.atr * 2) :  // 2x ATR below entry
      entryPrice + (technicalData.atr * 2)
    
    const volatilityBasedStop = direction === 'long' ?
      entryPrice - (entryPrice * volatilityData.daily_volatility * 2) :
      entryPrice + (entryPrice * volatilityData.daily_volatility * 2)
    
    const supportResistanceStop = direction === 'long' ?
      technicalData.nearest_support :
      technicalData.nearest_resistance

    // Analyze each method
    const stopLossAnalysis = {
      fixed: { 
        level: fixedPercentageStop, 
        hit_probability: this.calculateStopHitProbability(entryPrice, fixedPercentageStop, volatilityData),
        method: 'Fixed percentage'
      },
      atr: { 
        level: atrBasedStop, 
        hit_probability: this.calculateStopHitProbability(entryPrice, atrBasedStop, volatilityData),
        method: 'ATR-based'
      },
      volatility: { 
        level: volatilityBasedStop, 
        hit_probability: this.calculateStopHitProbability(entryPrice, volatilityBasedStop, volatilityData),
        method: 'Volatility-based'
      },
      technical: { 
        level: supportResistanceStop, 
        hit_probability: this.calculateStopHitProbability(entryPrice, supportResistanceStop, volatilityData),
        method: 'Support/Resistance'
      }
    }

    // Select optimal stop loss (lowest hit probability with reasonable risk)
    let recommendedStop = fixedPercentageStop
    let recommendedMethod = 'Fixed percentage'
    let minHitProbability = 1

    Object.entries(stopLossAnalysis).forEach(([key, analysis]) => {
      const riskPercent = Math.abs((analysis.level - entryPrice) / entryPrice) * 100
      
      // Only consider stops within reasonable risk range (1-8%)
      if (riskPercent >= 1 && riskPercent <= 8 && analysis.hit_probability < minHitProbability) {
        minHitProbability = analysis.hit_probability
        recommendedStop = analysis.level
        recommendedMethod = analysis.method
      }
    })

    // Calculate trailing stop suggestions
    const trailingActivation = direction === 'long' ?
      entryPrice * (1 + params.profit_taking_rules.trailing_stop.activation_pct / 100) :
      entryPrice * (1 - params.profit_taking_rules.trailing_stop.activation_pct / 100)
    
    const trailingDistance = entryPrice * (params.profit_taking_rules.trailing_stop.trail_distance / 100)

    const riskRewardRatio = technicalData.target_price ? 
      Math.abs(technicalData.target_price - entryPrice) / Math.abs(recommendedStop - entryPrice) : 2

    console.log(`✅ Stop loss optimized: ${recommendedMethod} at $${recommendedStop.toFixed(2)}`)

    return {
      symbol,
      current_price: entryPrice,
      
      fixed_percentage_stop: fixedPercentageStop,
      atr_based_stop: atrBasedStop,
      volatility_based_stop: volatilityBasedStop,
      support_resistance_stop: supportResistanceStop,
      
      recommended_stop: recommendedStop,
      recommended_method: recommendedMethod,
      
      probability_of_hit: minHitProbability,
      risk_reward_ratio: riskRewardRatio,
      expected_holding_period: this.calculateExpectedHoldingPeriod(volatilityData),
      
      trailing_stop_activation: trailingActivation,
      trailing_stop_distance: trailingDistance,
      
      reasoning: [
        `${recommendedMethod} provides optimal balance`,
        `Hit probability: ${(minHitProbability * 100).toFixed(1)}%`,
        `Risk/Reward ratio: ${riskRewardRatio.toFixed(1)}:1`
      ]
    }
  }

  /**
   * Calculate comprehensive portfolio risk metrics
   */
  async calculateRiskMetrics(db: any, portfolioId: string): Promise<RiskMetrics> {
    console.log(`📊 Calculating comprehensive risk metrics for portfolio ${portfolioId}`)

    const positions = await this.getPortfolioPositions(db, portfolioId)
    const portfolioValue = await this.getPortfolioValue(db, portfolioId)
    const historicalReturns = await this.getPortfolioHistoricalReturns(db, portfolioId)

    // Value at Risk calculations
    const returns = historicalReturns.map(r => r.return_pct).sort((a, b) => a - b)
    const var95Index = Math.floor(returns.length * 0.05)
    const var99Index = Math.floor(returns.length * 0.01)
    
    const portfolioVar95 = returns.length > 0 ? Math.abs(returns[var95Index] || 0) : 5
    const portfolioVar99 = returns.length > 0 ? Math.abs(returns[var99Index] || 0) : 8
    
    // Expected Shortfall (average loss beyond VaR)
    const lossesbeyondVar95 = returns.slice(0, var95Index + 1)
    const expectedShortfall = lossesbeyondVar95.length > 0 ? 
      Math.abs(lossesbeyondVar95.reduce((sum, r) => sum + r, 0) / lossesbeyondVar95.length) : portfolioVar95

    // Drawdown calculations
    const peaks = this.calculateRunningMax(historicalReturns.map(r => r.portfolio_value))
    const drawdowns = historicalReturns.map((r, i) => ((r.portfolio_value - peaks[i]) / peaks[i]) * 100)
    const maxDrawdown = Math.min(...drawdowns, 0)
    const currentDrawdown = drawdowns[drawdowns.length - 1] || 0

    // Concentration risks
    const positionSizes = positions.map(p => p.position_size_pct)
    const singlePositionRisk = Math.max(...positionSizes, 0)
    
    const sectorConcentration: { [sector: string]: number } = {}
    positions.forEach(pos => {
      const sector = this.getSectorForSymbol(pos.symbol)
      sectorConcentration[sector] = (sectorConcentration[sector] || 0) + pos.position_size_pct
    })

    // Calculate portfolio beta and correlation
    const marketData = await this.getMarketData()
    const portfolioBeta = this.calculatePortfolioBeta(positions, marketData)
    const marketCorrelation = this.calculateMarketCorrelation(historicalReturns, marketData.returns)

    // Volatility calculation
    const volatility = this.calculateVolatility(returns) * Math.sqrt(252) // Annualized

    // Risk-adjusted return metrics
    const avgReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length
    const riskFreeRate = 0.05 // Assume 5% risk-free rate
    const sharpeRatio = (avgReturn - riskFreeRate) / volatility
    
    const downSideReturns = returns.filter(r => r < 0)
    const downSideVolatility = this.calculateVolatility(downSideReturns)
    const sortinoRatio = (avgReturn - riskFreeRate) / downSideVolatility
    const calmarRatio = avgReturn / Math.abs(maxDrawdown / 100)

    // Forward-looking risk estimates
    const estimated1dRisk = portfolioVar95 / Math.sqrt(252) // Daily estimate
    const estimated1wRisk = portfolioVar95 / Math.sqrt(52)  // Weekly estimate
    const estimated1mRisk = portfolioVar95 / Math.sqrt(12)  // Monthly estimate

    return {
      portfolio_var_95: portfolioVar95,
      portfolio_var_99: portfolioVar99,
      expected_shortfall: expectedShortfall,
      maximum_drawdown: maxDrawdown,
      current_drawdown: currentDrawdown,
      
      single_position_risk: singlePositionRisk,
      sector_concentration: sectorConcentration,
      correlation_risk: this.calculateCorrelationRisk(positions),
      
      portfolio_liquidity: this.calculatePortfolioLiquidity(positions),
      cash_buffer: 10, // Would get from actual cash position
      
      portfolio_beta: portfolioBeta,
      market_correlation: marketCorrelation,
      volatility: volatility,
      
      sharpe_ratio: sharpeRatio,
      sortino_ratio: sortinoRatio,
      calmar_ratio: calmarRatio,
      
      estimated_1d_risk: estimated1dRisk,
      estimated_1w_risk: estimated1wRisk,
      estimated_1m_risk: estimated1mRisk
    }
  }

  /**
   * Generate risk alerts based on current portfolio state
   */
  async generateRiskAlerts(db: any, portfolioId: string, riskMetrics: RiskMetrics): Promise<RiskAlert[]> {
    const alerts: RiskAlert[] = []
    const params = this.defaultRiskParams

    // Portfolio-level alerts
    if (riskMetrics.single_position_risk > params.max_position_size) {
      alerts.push({
        id: `alert-position-size-${Date.now()}`,
        severity: riskMetrics.single_position_risk > params.max_position_size * 1.5 ? 'danger' : 'warning',
        type: 'position_limit',
        title: 'Position Size Limit Exceeded',
        message: `Largest position is ${riskMetrics.single_position_risk.toFixed(1)}% (limit: ${params.max_position_size}%)`,
        affected_symbols: [], // Would identify the actual symbols
        recommended_actions: [
          'Reduce largest position size',
          'Diversify into additional positions',
          'Review position sizing rules'
        ],
        auto_actionable: false,
        created_at: new Date().toISOString()
      })
    }

    // Drawdown alerts
    if (riskMetrics.current_drawdown < -params.max_drawdown_limit / 2) {
      alerts.push({
        id: `alert-drawdown-${Date.now()}`,
        severity: riskMetrics.current_drawdown < -params.max_drawdown_limit ? 'critical' : 'danger',
        type: 'drawdown',
        title: 'Significant Portfolio Drawdown',
        message: `Portfolio down ${Math.abs(riskMetrics.current_drawdown).toFixed(1)}% from peak`,
        affected_symbols: [],
        recommended_actions: [
          'Review and tighten stop losses',
          'Consider defensive positioning',
          'Reduce overall portfolio risk'
        ],
        auto_actionable: false,
        created_at: new Date().toISOString()
      })
    }

    // Sector concentration alerts
    Object.entries(riskMetrics.sector_concentration).forEach(([sector, allocation]) => {
      if (allocation > params.max_sector_allocation) {
        alerts.push({
          id: `alert-sector-${sector}-${Date.now()}`,
          severity: allocation > params.max_sector_allocation * 1.5 ? 'danger' : 'warning',
          type: 'concentration',
          title: `${sector} Sector Overweight`,
          message: `${allocation.toFixed(1)}% allocated to ${sector} (limit: ${params.max_sector_allocation}%)`,
          affected_symbols: [],
          recommended_actions: [
            `Reduce ${sector} sector exposure`,
            'Diversify into other sectors',
            'Review sector allocation limits'
          ],
          auto_actionable: false,
          created_at: new Date().toISOString()
        })
      }
    })

    // High volatility alert
    if (riskMetrics.volatility > 25) {
      alerts.push({
        id: `alert-volatility-${Date.now()}`,
        severity: riskMetrics.volatility > 35 ? 'danger' : 'warning',
        type: 'volatility',
        title: 'High Portfolio Volatility',
        message: `Portfolio volatility at ${riskMetrics.volatility.toFixed(1)}% (elevated)`,
        affected_symbols: [],
        recommended_actions: [
          'Consider reducing position sizes',
          'Add defensive positions',
          'Review correlation of holdings'
        ],
        auto_actionable: false,
        created_at: new Date().toISOString()
      })
    }

    return alerts
  }

  // Helper methods for calculations

  private calculateFixedPercentageSize(portfolioValue: number, entryPrice: number, maxPositionPct: number): number {
    const maxDollarAmount = portfolioValue * (maxPositionPct / 100)
    return Math.floor(maxDollarAmount / entryPrice)
  }

  private async calculateKellyCriterion(historicalData: any, riskPerShare: number, rewardPerShare: number): Promise<{
    shares: number
    kelly_percentage: number
    win_probability: number
    avg_win_loss_ratio: number
  }> {
    // Simplified Kelly Criterion calculation
    const winProbability = historicalData.win_rate || 0.55 // Default 55% if no data
    const avgWin = rewardPerShare
    const avgLoss = riskPerShare
    const winLossRatio = avgWin / avgLoss

    // Kelly formula: f = (bp - q) / b
    // where b = odds received (win/loss ratio), p = win probability, q = loss probability
    const kellyPercentage = (winLossRatio * winProbability - (1 - winProbability)) / winLossRatio
    
    // Conservative Kelly (use 25% of full Kelly to reduce risk)
    const conservativeKelly = Math.max(0, Math.min(kellyPercentage * 0.25, 0.1)) // Max 10%

    return {
      shares: 0, // Will be calculated by caller
      kelly_percentage: conservativeKelly,
      win_probability: winProbability,
      avg_win_loss_ratio: winLossRatio
    }
  }

  private async calculateVolatilityAdjustedSize(
    db: any, 
    symbol: string, 
    portfolioValue: number, 
    entryPrice: number, 
    riskPerShare: number, 
    params: RiskParameters
  ): Promise<number> {
    const volatilityData = await this.getVolatilityData(symbol)
    
    // Base position size
    const baseSize = this.calculateFixedPercentageSize(portfolioValue, entryPrice, params.max_position_size)
    
    // Volatility adjustment factor (lower volatility = larger size)
    const avgVolatility = 0.25 // 25% baseline
    const volatilityFactor = avgVolatility / volatilityData.daily_volatility
    
    // Apply factor but cap at 150% of base size
    return Math.floor(baseSize * Math.min(volatilityFactor, 1.5))
  }

  private calculateMaxSharesByPortfolioRisk(
    portfolioValue: number, 
    entryPrice: number, 
    riskPerShare: number, 
    maxPortfolioRisk: number
  ): number {
    const maxRiskDollars = portfolioValue * (maxPortfolioRisk / 100)
    return Math.floor(maxRiskDollars / riskPerShare)
  }

  private async getVolatilityAdjustment(symbol: string): Promise<{ factor: number }> {
    // Get VIX or symbol-specific volatility
    const marketVolatility = 20 + Math.random() * 10 // Mock 20-30% volatility
    
    // Reduce position sizes when volatility is high
    const factor = marketVolatility > 25 ? 0.8 : marketVolatility < 15 ? 1.2 : 1.0
    
    return { factor }
  }

  private async getMarketRegimeAdjustment(): Promise<number> {
    // Determine market regime and adjust accordingly
    // Bull market: increase sizes, Bear market: decrease sizes
    const regime = Math.random() > 0.6 ? 'bull' : Math.random() > 0.3 ? 'bear' : 'sideways'
    
    switch (regime) {
      case 'bull': return 1.2      // 20% larger positions
      case 'bear': return 0.7      // 30% smaller positions  
      case 'sideways': return 0.9  // 10% smaller positions
      default: return 1.0
    }
  }

  private calculateStopHitProbability(entryPrice: number, stopLoss: number, volatilityData: any): number {
    const stopDistance = Math.abs(stopLoss - entryPrice) / entryPrice
    const dailyVolatility = volatilityData.daily_volatility || 0.02
    
    // Simple probability calculation based on normal distribution
    // Higher volatility = higher chance of hitting stop
    return Math.min(stopDistance / (dailyVolatility * 2), 0.9)
  }

  private calculateExpectedHoldingPeriod(volatilityData: any): number {
    // Higher volatility typically means shorter holding periods
    const baseHoldingPeriod = 15 // 15 days base
    const volatilityAdjustment = 1 / (volatilityData.daily_volatility * 50)
    return Math.max(5, baseHoldingPeriod * volatilityAdjustment)
  }

  private calculateRunningMax(values: number[]): number[] {
    const runningMax: number[] = []
    let currentMax = values[0] || 0
    
    for (const value of values) {
      currentMax = Math.max(currentMax, value)
      runningMax.push(currentMax)
    }
    
    return runningMax
  }

  private calculateVolatility(returns: number[]): number {
    if (returns.length < 2) return 0.2 // Default 20%
    
    const mean = returns.reduce((sum, r) => sum + r, 0) / returns.length
    const variance = returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / (returns.length - 1)
    return Math.sqrt(variance)
  }

  private calculatePortfolioBeta(positions: any[], marketData: any): number {
    // Simplified beta calculation
    return 0.8 + Math.random() * 0.6 // Mock beta between 0.8 and 1.4
  }

  private calculateMarketCorrelation(portfolioReturns: any[], marketReturns: any[]): number {
    // Simplified correlation calculation
    return 0.6 + Math.random() * 0.3 // Mock correlation between 0.6 and 0.9
  }

  private calculateCorrelationRisk(positions: any[]): number {
    // Analyze correlation between positions
    // High correlation = higher risk
    return Math.random() * 40 + 20 // Mock 20-60% correlation risk
  }

  private calculatePortfolioLiquidity(positions: any[]): number {
    // Estimate days to liquidate entire portfolio
    return Math.random() * 5 + 1 // Mock 1-6 days
  }

  private getSectorForSymbol(symbol: string): string {
    const sectorMap: { [key: string]: string } = {
      'AAPL': 'Technology',
      'MSFT': 'Technology', 
      'GOOGL': 'Technology',
      'META': 'Technology',
      'TSLA': 'Consumer Discretionary',
      'NVDA': 'Technology',
      'JPM': 'Financials',
      'JNJ': 'Healthcare',
      'PG': 'Consumer Staples'
    }
    return sectorMap[symbol] || 'Unknown'
  }

  // Placeholder methods for data retrieval (would be implemented with real data sources)

  private async getPortfolioValue(db: any, portfolioId: string): Promise<number> {
    const portfolio = await db.prepare('SELECT total_value FROM portfolios WHERE id = ?').bind(portfolioId).first()
    return portfolio?.total_value || 10000
  }

  private async getPortfolioPositions(db: any, portfolioId: string): Promise<any[]> {
    const positions = await db.prepare('SELECT * FROM positions WHERE portfolio_id = ?').bind(portfolioId).all()
    return positions.results || []
  }

  private async getSymbolHistoricalPerformance(db: any, symbol: string): Promise<any> {
    // Would return historical win rate, avg returns, etc.
    return {
      win_rate: 0.55 + Math.random() * 0.2, // 55-75% win rate
      avg_return: 0.08 + Math.random() * 0.04 // 8-12% average return
    }
  }

  private async getPortfolioHistoricalReturns(db: any, portfolioId: string): Promise<any[]> {
    // Would return daily portfolio values and returns
    const returns = []
    let portfolioValue = 10000
    
    for (let i = 0; i < 252; i++) { // One year of daily returns
      const dailyReturn = (Math.random() - 0.48) * 0.03 // Slightly positive bias
      portfolioValue *= (1 + dailyReturn)
      
      returns.push({
        date: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString(),
        portfolio_value: portfolioValue,
        return_pct: dailyReturn * 100
      })
    }
    
    return returns.reverse()
  }

  private async getTechnicalAnalysisData(symbol: string): Promise<any> {
    // Would integrate with technical analysis engine
    const currentPrice = 150 + Math.random() * 200
    return {
      atr: currentPrice * 0.03, // 3% ATR
      nearest_support: currentPrice * 0.95,
      nearest_resistance: currentPrice * 1.05,
      target_price: currentPrice * 1.08
    }
  }

  private async getVolatilityData(symbol: string): Promise<any> {
    return {
      daily_volatility: 0.015 + Math.random() * 0.025, // 1.5-4% daily volatility
      weekly_volatility: 0.04 + Math.random() * 0.06,
      monthly_volatility: 0.08 + Math.random() * 0.12
    }
  }

  private async getMarketData(): Promise<any> {
    return {
      returns: Array.from({ length: 252 }, () => (Math.random() - 0.48) * 0.02),
      vix: 15 + Math.random() * 15, // VIX 15-30
      spy_price: 450 + Math.random() * 50
    }
  }
}