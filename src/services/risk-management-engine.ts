// Risk Management Engine Service
import type { D1Database } from '@cloudflare/workers-types'

export class RiskManagementEngine {
  constructor(private env: any) {}

  async calculatePositionSize(
    db: D1Database,
    portfolioId: string,
    symbol: string,
    entryPrice: number,
    targetPrice: number,
    stopLoss: number,
    riskParameters?: any
  ) {
    try {
      // Get portfolio value
      const portfolio = await db.prepare(`
        SELECT cash_balance FROM portfolios WHERE id = ?
      `).bind(portfolioId).first()

      if (!portfolio) {
        throw new Error('Portfolio not found')
      }

      const portfolioValue = portfolio.cash_balance || 10000 // Default $10k
      const riskPerTrade = (riskParameters?.risk_per_trade || 2) / 100 // Default 2%
      const maxPositionSize = (riskParameters?.max_position_size || 20) / 100 // Default 20%

      // Calculate risk per share
      const riskPerShare = Math.abs(entryPrice - stopLoss)
      const maxRiskAmount = portfolioValue * riskPerTrade
      
      // Calculate position sizes
      const riskBasedShares = Math.floor(maxRiskAmount / riskPerShare)
      const maxPositionShares = Math.floor((portfolioValue * maxPositionSize) / entryPrice)
      
      // Take the smaller of the two
      const recommendedShares = Math.min(riskBasedShares, maxPositionShares)
      const positionValue = recommendedShares * entryPrice
      const positionSizePercent = (positionValue / portfolioValue) * 100

      // Calculate potential outcomes
      const potentialGain = (targetPrice - entryPrice) * recommendedShares
      const potentialLoss = (entryPrice - stopLoss) * recommendedShares
      const rewardRiskRatio = Math.abs(potentialGain / potentialLoss)

      return {
        symbol,
        entry_price: entryPrice,
        target_price: targetPrice,
        stop_loss: stopLoss,
        recommended_shares: recommendedShares,
        position_value: positionValue,
        position_size_percent: positionSizePercent,
        risk_per_share: riskPerShare,
        potential_gain: potentialGain,
        potential_loss: potentialLoss,
        reward_risk_ratio: rewardRiskRatio,
        max_risk_amount: maxRiskAmount,
        risk_assessment: rewardRiskRatio >= 2 ? 'Good' : rewardRiskRatio >= 1.5 ? 'Fair' : 'Poor'
      }
    } catch (error) {
      console.error('Position sizing error:', error)
      throw error
    }
  }

  async optimizeStopLoss(
    db: D1Database,
    symbol: string,
    entryPrice: number,
    direction: string,
    riskParameters?: any
  ) {
    try {
      // Mock stop loss optimization based on technical levels and volatility
      const volatility = 0.15 + Math.random() * 0.25 // 15-40% annual volatility
      const dailyVolatility = volatility / Math.sqrt(252) // Convert to daily
      
      const atrMultiplier = riskParameters?.atr_multiplier || 2.0
      const maxRiskPercent = (riskParameters?.max_risk_percent || 3) / 100 // 3% max risk

      const isLong = direction.toLowerCase() === 'long'
      
      // Calculate different stop loss methods
      const atrStopLoss = isLong ? 
        entryPrice - (entryPrice * dailyVolatility * atrMultiplier) :
        entryPrice + (entryPrice * dailyVolatility * atrMultiplier)

      const percentStopLoss = isLong ?
        entryPrice * (1 - maxRiskPercent) :
        entryPrice * (1 + maxRiskPercent)

      const technicalStopLoss = isLong ?
        entryPrice - (entryPrice * 0.05) : // 5% below entry for long
        entryPrice + (entryPrice * 0.05)   // 5% above entry for short

      // Support/resistance levels (mock)
      const supportLevel = entryPrice * (0.95 - Math.random() * 0.05) // 90-95% of entry
      const resistanceLevel = entryPrice * (1.05 + Math.random() * 0.05) // 105-110% of entry
      
      const structuralStopLoss = isLong ? supportLevel : resistanceLevel

      const stopLossOptions = [
        {
          method: 'ATR-based',
          price: atrStopLoss,
          risk_percent: Math.abs((entryPrice - atrStopLoss) / entryPrice) * 100,
          description: `Based on ${atrMultiplier}x Average True Range`
        },
        {
          method: 'Percentage-based',
          price: percentStopLoss,
          risk_percent: maxRiskPercent * 100,
          description: `Fixed ${maxRiskPercent * 100}% risk from entry`
        },
        {
          method: 'Technical Level',
          price: technicalStopLoss,
          risk_percent: Math.abs((entryPrice - technicalStopLoss) / entryPrice) * 100,
          description: 'Based on recent technical levels'
        },
        {
          method: 'Structural Level',
          price: structuralStopLoss,
          risk_percent: Math.abs((entryPrice - structuralStopLoss) / entryPrice) * 100,
          description: isLong ? 'Below key support level' : 'Above key resistance level'
        }
      ]

      // Find optimal stop loss (closest to entry while maintaining good risk/reward)
      const optimalStopLoss = stopLossOptions.reduce((optimal, current) => {
        if (current.risk_percent <= 4 && current.risk_percent < optimal.risk_percent) {
          return current
        }
        return optimal
      }, stopLossOptions[0])

      return {
        symbol,
        entry_price: entryPrice,
        direction,
        optimal_stop_loss: optimalStopLoss,
        all_options: stopLossOptions,
        market_volatility: {
          annual_volatility: volatility * 100,
          daily_volatility: dailyVolatility * 100
        },
        recommendations: [
          'Consider market volatility when setting stop loss',
          'Use structural levels for better probability',
          'Adjust position size if stop loss is too wide',
          'Monitor price action near stop loss levels'
        ]
      }
    } catch (error) {
      console.error('Stop loss optimization error:', error)
      throw error
    }
  }

  async calculateRiskMetrics(db: D1Database, portfolioId: string) {
    try {
      // Mock risk calculations
      return {
        portfolio_beta: 0.8 + Math.random() * 0.6, // 0.8-1.4
        value_at_risk_95: Math.random() * 5 + 1, // 1-6% daily VaR
        expected_shortfall: Math.random() * 8 + 2, // 2-10%
        maximum_drawdown: Math.random() * 15 + 5, // 5-20%
        sharpe_ratio: Math.random() * 2 - 0.3, // -0.3 to 1.7
        sortino_ratio: Math.random() * 2.5 - 0.2, // -0.2 to 2.3
        correlation_to_market: 0.4 + Math.random() * 0.4, // 40-80%
        concentration_risk: Math.random() * 30 + 10, // 10-40% in largest position
        currency_exposure: {
          USD: 85 + Math.random() * 10,
          EUR: Math.random() * 8,
          GBP: Math.random() * 5,
          Others: Math.random() * 7
        },
        sector_concentration: {
          Technology: 25 + Math.random() * 20,
          Healthcare: 15 + Math.random() * 15,
          Financials: 12 + Math.random() * 18,
          Energy: Math.random() * 15,
          Others: 20 + Math.random() * 15
        }
      }
    } catch (error) {
      console.error('Risk metrics error:', error)
      throw error
    }
  }

  async generateRiskAlerts(db: D1Database, portfolioId: string, riskMetrics: any) {
    const alerts = []

    if (riskMetrics.concentration_risk > 25) {
      alerts.push({
        level: 'high',
        type: 'concentration',
        message: `High concentration risk: ${riskMetrics.concentration_risk.toFixed(1)}% in largest position`,
        recommendation: 'Consider reducing position size or diversifying'
      })
    }

    if (riskMetrics.value_at_risk_95 > 4) {
      alerts.push({
        level: 'medium',
        type: 'volatility',
        message: `High daily VaR: ${riskMetrics.value_at_risk_95.toFixed(1)}%`,
        recommendation: 'Consider reducing overall exposure or hedging'
      })
    }

    if (riskMetrics.maximum_drawdown > 15) {
      alerts.push({
        level: 'high',
        type: 'drawdown',
        message: `Maximum drawdown exceeds ${riskMetrics.maximum_drawdown.toFixed(1)}%`,
        recommendation: 'Review stop loss strategies and position sizing'
      })
    }

    if (riskMetrics.sector_concentration.Technology > 40) {
      alerts.push({
        level: 'medium',
        type: 'sector_concentration',
        message: `High technology sector exposure: ${riskMetrics.sector_concentration.Technology.toFixed(1)}%`,
        recommendation: 'Consider diversifying across other sectors'
      })
    }

    return alerts
  }
}