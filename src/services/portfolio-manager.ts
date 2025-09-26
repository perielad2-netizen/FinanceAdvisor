// Advanced Portfolio Tracking and Position Management System
import type { Bindings } from '../types'

export interface Position {
  id: string
  portfolio_id: string
  symbol: string
  side: 'long' | 'short'
  quantity: number
  avg_entry_price: number
  current_price: number
  market_value: number
  unrealized_pnl: number
  unrealized_pnl_pct: number
  realized_pnl: number
  total_pnl: number
  
  // Risk management
  stop_loss?: number
  take_profit?: number
  trailing_stop?: number
  position_size_pct: number    // % of portfolio
  max_loss_pct: number         // Max loss allowed on this position
  
  // Timestamps
  opened_at: string
  last_updated: string
  
  // Position metrics
  hold_duration_days: number
  max_drawdown: number
  max_runup: number
  
  // AI signals
  entry_signal_confidence: number
  current_signal?: 'hold' | 'add' | 'reduce' | 'close'
  signal_updated_at?: string
}

export interface PortfolioMetrics {
  total_value: number
  total_cash: number
  total_positions_value: number
  day_change: number
  day_change_pct: number
  
  // Performance metrics
  total_return: number
  total_return_pct: number
  annualized_return: number
  sharpe_ratio: number
  max_drawdown: number
  win_rate: number
  
  // Risk metrics
  portfolio_beta: number
  volatility: number
  var_95: number              // Value at Risk (95% confidence)
  concentration_risk: number   // % in largest position
  sector_exposure: { [sector: string]: number }
  
  // Position summary
  total_positions: number
  profitable_positions: number
  losing_positions: number
  avg_position_size: number
  
  // Recent activity
  trades_today: number
  trades_this_week: number
  trades_this_month: number
}

export interface Trade {
  id: string
  portfolio_id: string
  symbol: string
  side: 'buy' | 'sell'
  quantity: number
  price: number
  total_amount: number
  fees: number
  net_amount: number
  
  // Trade context
  trade_type: 'market' | 'limit' | 'stop' | 'stop_limit'
  order_source: 'manual' | 'ai_recommendation' | 'stop_loss' | 'take_profit' | 'trailing_stop'
  recommendation_id?: string
  
  // Execution details
  executed_at: string
  settlement_date: string
  status: 'pending' | 'filled' | 'partial' | 'cancelled' | 'rejected'
  
  // Performance tracking (for sells)
  holding_period_days?: number
  realized_pnl?: number
  realized_pnl_pct?: number
}

export interface RiskAlert {
  id: string
  portfolio_id: string
  type: 'position_risk' | 'portfolio_risk' | 'market_risk' | 'concentration' | 'drawdown'
  severity: 'low' | 'medium' | 'high' | 'critical'
  title: string
  description: string
  suggested_actions: string[]
  created_at: string
  acknowledged: boolean
}

export interface PortfolioRebalancing {
  current_allocation: { [symbol: string]: number }
  target_allocation: { [symbol: string]: number }
  rebalancing_trades: {
    symbol: string
    action: 'buy' | 'sell'
    quantity: number
    reason: string
    priority: number
  }[]
  expected_impact: {
    risk_reduction: number
    return_optimization: number
    cost_estimate: number
  }
}

export class PortfolioManager {
  constructor(private env: Bindings) {}

  /**
   * Get comprehensive portfolio overview with real-time updates
   */
  async getPortfolioOverview(db: any, portfolioId: string): Promise<{
    portfolio: any
    positions: Position[]
    metrics: PortfolioMetrics
    recent_trades: Trade[]
    risk_alerts: RiskAlert[]
  }> {
    console.log(`📊 Generating portfolio overview for ${portfolioId}`)

    // Get portfolio basic info
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

    // Get all positions with current market data
    const positions = await this.getCurrentPositions(db, portfolioId)
    
    // Calculate comprehensive portfolio metrics
    const metrics = await this.calculatePortfolioMetrics(db, portfolioId, positions)
    
    // Get recent trading activity
    const recent_trades = await this.getRecentTrades(db, portfolioId, 10)
    
    // Generate risk alerts
    const risk_alerts = await this.generateRiskAlerts(db, portfolioId, positions, metrics)

    return {
      portfolio,
      positions,
      metrics,
      recent_trades,
      risk_alerts
    }
  }

  /**
   * Get current positions with real-time pricing and P&L
   */
  async getCurrentPositions(db: any, portfolioId: string): Promise<Position[]> {
    // Get positions from database
    const dbPositions = await db.prepare(`
      SELECT 
        id, portfolio_id, symbol, side, quantity, avg_entry_price,
        stop_loss, take_profit, trailing_stop, position_size_pct, max_loss_pct,
        opened_at, last_updated, entry_signal_confidence,
        max_drawdown, max_runup, realized_pnl
      FROM positions 
      WHERE portfolio_id = ? AND quantity > 0
      ORDER BY market_value DESC
    `).bind(portfolioId).all()

    const positions: Position[] = []

    for (const pos of dbPositions.results || []) {
      // Get current market price
      const currentPrice = await this.getCurrentPrice(pos.symbol)
      
      // Calculate position metrics
      const marketValue = pos.quantity * currentPrice
      const costBasis = pos.quantity * pos.avg_entry_price
      const unrealizedPnL = marketValue - costBasis
      const unrealizedPnLPct = (unrealizedPnL / costBasis) * 100
      
      // Calculate hold duration
      const openedAt = new Date(pos.opened_at)
      const holdDuration = (Date.now() - openedAt.getTime()) / (1000 * 60 * 60 * 24)
      
      // Get latest AI signal for this position
      const aiSignal = await this.getLatestPositionSignal(db, pos.id)
      
      const position: Position = {
        id: pos.id,
        portfolio_id: pos.portfolio_id,
        symbol: pos.symbol,
        side: pos.side || 'long',
        quantity: pos.quantity,
        avg_entry_price: pos.avg_entry_price,
        current_price: currentPrice,
        market_value: marketValue,
        unrealized_pnl: unrealizedPnL,
        unrealized_pnl_pct: unrealizedPnLPct,
        realized_pnl: pos.realized_pnl || 0,
        total_pnl: unrealizedPnL + (pos.realized_pnl || 0),
        
        stop_loss: pos.stop_loss,
        take_profit: pos.take_profit,
        trailing_stop: pos.trailing_stop,
        position_size_pct: pos.position_size_pct || 0,
        max_loss_pct: pos.max_loss_pct || 5,
        
        opened_at: pos.opened_at,
        last_updated: new Date().toISOString(),
        
        hold_duration_days: holdDuration,
        max_drawdown: pos.max_drawdown || 0,
        max_runup: pos.max_runup || 0,
        
        entry_signal_confidence: pos.entry_signal_confidence || 0,
        current_signal: aiSignal?.signal,
        signal_updated_at: aiSignal?.updated_at
      }

      // Update position in database with latest metrics
      await this.updatePositionMetrics(db, position)
      
      positions.push(position)
    }

    return positions
  }

  /**
   * Execute a trade (buy/sell) with comprehensive tracking
   */
  async executeTrade(db: any, tradeRequest: {
    portfolio_id: string
    symbol: string
    side: 'buy' | 'sell'
    quantity: number
    price?: number
    trade_type?: 'market' | 'limit'
    order_source?: string
    recommendation_id?: string
  }): Promise<Trade> {
    
    const {
      portfolio_id,
      symbol,
      side,
      quantity,
      price,
      trade_type = 'market',
      order_source = 'manual',
      recommendation_id
    } = tradeRequest

    console.log(`🔄 Executing ${side} order: ${quantity} shares of ${symbol}`)

    // Get current market price if not provided
    const executionPrice = price || await this.getCurrentPrice(symbol)
    
    // Calculate trade amounts
    const totalAmount = quantity * executionPrice
    const fees = this.calculateTradingFees(totalAmount)
    const netAmount = side === 'buy' ? totalAmount + fees : totalAmount - fees

    // Generate trade ID
    const tradeId = 'trade-' + Date.now() + '-' + Math.random().toString(36).substr(2, 6)

    // Create trade record
    const trade: Trade = {
      id: tradeId,
      portfolio_id,
      symbol,
      side,
      quantity,
      price: executionPrice,
      total_amount: totalAmount,
      fees,
      net_amount: netAmount,
      trade_type,
      order_source,
      recommendation_id,
      executed_at: new Date().toISOString(),
      settlement_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), // T+2
      status: 'filled'
    }

    // Store trade in database
    await db.prepare(`
      INSERT INTO trades (
        id, portfolio_id, symbol, side, quantity, price, total_amount,
        fees, net_amount, trade_type, order_source, recommendation_id,
        executed_at, settlement_date, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      trade.id, trade.portfolio_id, trade.symbol, trade.side, trade.quantity,
      trade.price, trade.total_amount, trade.fees, trade.net_amount,
      trade.trade_type, trade.order_source, trade.recommendation_id,
      trade.executed_at, trade.settlement_date, trade.status
    ).run()

    // Update position
    await this.updatePosition(db, portfolio_id, symbol, side, quantity, executionPrice, trade.id)

    // Update portfolio cash balance
    await this.updatePortfolioCash(db, portfolio_id, side === 'buy' ? -netAmount : netAmount)

    console.log(`✅ Trade executed: ${trade.id}`)
    return trade
  }

  /**
   * Update position after trade execution
   */
  private async updatePosition(
    db: any,
    portfolioId: string,
    symbol: string,
    side: 'buy' | 'sell',
    quantity: number,
    price: number,
    tradeId: string
  ) {
    // Get existing position
    const existingPosition = await db.prepare(`
      SELECT * FROM positions 
      WHERE portfolio_id = ? AND symbol = ?
    `).bind(portfolioId, symbol).first()

    if (!existingPosition) {
      // Create new position (for buys)
      if (side === 'buy') {
        const positionId = 'pos-' + Date.now() + '-' + Math.random().toString(36).substr(2, 6)
        
        await db.prepare(`
          INSERT INTO positions (
            id, portfolio_id, symbol, side, quantity, avg_entry_price,
            position_size_pct, max_loss_pct, opened_at, last_updated
          ) VALUES (?, ?, ?, 'long', ?, ?, 2.0, 5.0, ?, ?)
        `).bind(
          positionId, portfolioId, symbol, quantity, price,
          new Date().toISOString(), new Date().toISOString()
        ).run()
        
        console.log(`📈 New position opened: ${symbol} - ${quantity} shares @ $${price}`)
      } else {
        throw new Error(`Cannot sell ${symbol} - no existing position`)
      }
    } else {
      // Update existing position
      if (side === 'buy') {
        // Add to position - calculate new average price
        const totalShares = existingPosition.quantity + quantity
        const totalCost = (existingPosition.quantity * existingPosition.avg_entry_price) + (quantity * price)
        const newAvgPrice = totalCost / totalShares
        
        await db.prepare(`
          UPDATE positions 
          SET quantity = ?, avg_entry_price = ?, last_updated = ?
          WHERE id = ?
        `).bind(totalShares, newAvgPrice, new Date().toISOString(), existingPosition.id).run()
        
        console.log(`📈 Position increased: ${symbol} - ${totalShares} shares @ avg $${newAvgPrice.toFixed(2)}`)
        
      } else {
        // Reduce/close position
        const remainingShares = existingPosition.quantity - quantity
        
        if (remainingShares <= 0) {
          // Close position completely
          const realizedPnL = quantity * (price - existingPosition.avg_entry_price)
          
          await db.prepare(`
            UPDATE positions 
            SET quantity = 0, realized_pnl = COALESCE(realized_pnl, 0) + ?, last_updated = ?
            WHERE id = ?
          `).bind(realizedPnL, new Date().toISOString(), existingPosition.id).run()
          
          console.log(`📉 Position closed: ${symbol} - Realized P&L: $${realizedPnL.toFixed(2)}`)
          
        } else {
          // Partial close
          const realizedPnL = quantity * (price - existingPosition.avg_entry_price)
          
          await db.prepare(`
            UPDATE positions 
            SET quantity = ?, realized_pnl = COALESCE(realized_pnl, 0) + ?, last_updated = ?
            WHERE id = ?
          `).bind(remainingShares, realizedPnL, new Date().toISOString(), existingPosition.id).run()
          
          console.log(`📉 Position reduced: ${symbol} - ${remainingShares} shares remaining`)
        }
      }
    }
  }

  /**
   * Calculate comprehensive portfolio performance metrics
   */
  private async calculatePortfolioMetrics(db: any, portfolioId: string, positions: Position[]): Promise<PortfolioMetrics> {
    // Get portfolio cash balance
    const portfolio = await db.prepare(`
      SELECT total_value, cash_balance, created_at FROM portfolios WHERE id = ?
    `).bind(portfolioId).first()

    const totalCash = portfolio?.cash_balance || 10000
    const totalPositionsValue = positions.reduce((sum, pos) => sum + pos.market_value, 0)
    const totalValue = totalCash + totalPositionsValue
    
    // Calculate day change (simplified - would need historical data)
    const dayChange = positions.reduce((sum, pos) => sum + pos.unrealized_pnl * 0.1, 0) // Mock daily change
    const dayChangePct = totalValue > 0 ? (dayChange / totalValue) * 100 : 0

    // Get historical trades for performance calculations
    const allTrades = await db.prepare(`
      SELECT * FROM trades 
      WHERE portfolio_id = ? AND status = 'filled'
      ORDER BY executed_at ASC
    `).bind(portfolioId).all()

    const trades = allTrades.results || []
    
    // Calculate total return
    const totalInvested = 10000 // Starting portfolio value
    const totalReturn = totalValue - totalInvested
    const totalReturnPct = (totalReturn / totalInvested) * 100
    
    // Calculate performance metrics (simplified)
    const portfolioAge = portfolio ? 
      (Date.now() - new Date(portfolio.created_at).getTime()) / (1000 * 60 * 60 * 24 * 365) : 1
    const annualizedReturn = totalReturnPct / portfolioAge
    
    // Risk metrics (simplified calculations)
    const volatility = 15 + Math.random() * 10 // Mock volatility 15-25%
    const sharpeRatio = annualizedReturn / volatility
    const maxDrawdown = Math.min(...positions.map(p => p.max_drawdown), 0)
    const portfolioBeta = 0.8 + Math.random() * 0.6 // Mock beta 0.8-1.4
    
    // Win rate calculation
    const closedTrades = trades.filter((t: any) => t.realized_pnl !== null)
    const profitableTrades = closedTrades.filter((t: any) => (t.realized_pnl || 0) > 0)
    const winRate = closedTrades.length > 0 ? (profitableTrades.length / closedTrades.length) * 100 : 0
    
    // Position statistics
    const profitablePositions = positions.filter(p => p.unrealized_pnl > 0).length
    const losingPositions = positions.filter(p => p.unrealized_pnl < 0).length
    const avgPositionSize = positions.length > 0 ? 
      positions.reduce((sum, p) => sum + p.position_size_pct, 0) / positions.length : 0
    
    // Concentration risk (% in largest position)
    const concentrationRisk = positions.length > 0 ? 
      Math.max(...positions.map(p => p.position_size_pct)) : 0
    
    // Sector exposure (simplified)
    const sectorExposure: { [sector: string]: number } = {
      'Technology': positions.filter(p => ['AAPL', 'MSFT', 'GOOGL', 'META'].includes(p.symbol))
        .reduce((sum, p) => sum + p.position_size_pct, 0),
      'Healthcare': 0,
      'Financials': 0,
      'Consumer': 0
    }
    
    // Recent activity
    const today = new Date().toISOString().split('T')[0]
    const thisWeek = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
    const thisMonth = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    
    const tradesToday = trades.filter((t: any) => t.executed_at.startsWith(today)).length
    const tradesThisWeek = trades.filter((t: any) => t.executed_at >= thisWeek).length
    const tradesThisMonth = trades.filter((t: any) => t.executed_at >= thisMonth).length
    
    // Value at Risk (95% confidence) - simplified calculation
    const var95 = totalValue * 0.05 * Math.sqrt(volatility / 100) // 5% of portfolio value adjusted for volatility

    return {
      total_value: totalValue,
      total_cash: totalCash,
      total_positions_value: totalPositionsValue,
      day_change: dayChange,
      day_change_pct: dayChangePct,
      
      total_return: totalReturn,
      total_return_pct: totalReturnPct,
      annualized_return: annualizedReturn,
      sharpe_ratio: sharpeRatio,
      max_drawdown: maxDrawdown,
      win_rate: winRate,
      
      portfolio_beta: portfolioBeta,
      volatility: volatility,
      var_95: var95,
      concentration_risk: concentrationRisk,
      sector_exposure: sectorExposure,
      
      total_positions: positions.length,
      profitable_positions: profitablePositions,
      losing_positions: losingPositions,
      avg_position_size: avgPositionSize,
      
      trades_today: tradesToday,
      trades_this_week: tradesThisWeek,
      trades_this_month: tradesThisMonth
    }
  }

  /**
   * Generate intelligent portfolio rebalancing suggestions
   */
  async generateRebalancingPlan(db: any, portfolioId: string): Promise<PortfolioRebalancing> {
    const positions = await this.getCurrentPositions(db, portfolioId)
    
    // Current allocation
    const totalValue = positions.reduce((sum, pos) => sum + pos.market_value, 0)
    const currentAllocation: { [symbol: string]: number } = {}
    
    positions.forEach(pos => {
      currentAllocation[pos.symbol] = (pos.market_value / totalValue) * 100
    })
    
    // Target allocation (this would be more sophisticated in practice)
    const targetAllocation: { [symbol: string]: number } = {
      'AAPL': 15,
      'MSFT': 12,
      'GOOGL': 10,
      'TSLA': 8,
      'NVDA': 10,
      // Cash target
      'CASH': 20
    }
    
    // Generate rebalancing trades
    const rebalancingTrades: PortfolioRebalancing['rebalancing_trades'] = []
    
    Object.entries(currentAllocation).forEach(([symbol, currentPct]) => {
      const targetPct = targetAllocation[symbol] || 5 // Default 5% if not specified
      const difference = targetPct - currentPct
      
      if (Math.abs(difference) > 2) { // Only rebalance if difference > 2%
        const dollarAmount = (difference / 100) * totalValue
        const currentPrice = positions.find(p => p.symbol === symbol)?.current_price || 100
        const quantity = Math.abs(Math.floor(dollarAmount / currentPrice))
        
        if (quantity > 0) {
          rebalancingTrades.push({
            symbol,
            action: difference > 0 ? 'buy' : 'sell',
            quantity,
            reason: `Rebalance from ${currentPct.toFixed(1)}% to ${targetPct}%`,
            priority: Math.abs(difference) > 5 ? 1 : 2
          })
        }
      }
    })
    
    return {
      current_allocation: currentAllocation,
      target_allocation: targetAllocation,
      rebalancing_trades: rebalancingTrades.sort((a, b) => a.priority - b.priority),
      expected_impact: {
        risk_reduction: Math.random() * 10 + 5, // 5-15%
        return_optimization: Math.random() * 5 + 2, // 2-7%
        cost_estimate: rebalancingTrades.length * 10 // $10 per trade estimate
      }
    }
  }

  /**
   * Generate risk alerts based on portfolio analysis
   */
  private async generateRiskAlerts(
    db: any, 
    portfolioId: string, 
    positions: Position[], 
    metrics: PortfolioMetrics
  ): Promise<RiskAlert[]> {
    const alerts: RiskAlert[] = []
    
    // Concentration risk alert
    if (metrics.concentration_risk > 25) {
      alerts.push({
        id: 'alert-concentration-' + Date.now(),
        portfolio_id: portfolioId,
        type: 'concentration',
        severity: metrics.concentration_risk > 40 ? 'high' : 'medium',
        title: 'High Concentration Risk',
        description: `Portfolio has ${metrics.concentration_risk.toFixed(1)}% allocation in single position`,
        suggested_actions: [
          'Consider reducing largest position',
          'Diversify into different sectors',
          'Review position sizing strategy'
        ],
        created_at: new Date().toISOString(),
        acknowledged: false
      })
    }
    
    // Drawdown alert
    if (metrics.max_drawdown < -10) {
      alerts.push({
        id: 'alert-drawdown-' + Date.now(),
        portfolio_id: portfolioId,
        type: 'drawdown',
        severity: metrics.max_drawdown < -20 ? 'critical' : 'high',
        title: 'Significant Portfolio Drawdown',
        description: `Portfolio experiencing ${Math.abs(metrics.max_drawdown).toFixed(1)}% drawdown`,
        suggested_actions: [
          'Review stop loss levels',
          'Consider defensive positioning',
          'Reduce position sizes temporarily'
        ],
        created_at: new Date().toISOString(),
        acknowledged: false
      })
    }
    
    // Individual position risk alerts
    positions.forEach(position => {
      if (position.unrealized_pnl_pct < -15) {
        alerts.push({
          id: 'alert-position-' + position.symbol + '-' + Date.now(),
          portfolio_id: portfolioId,
          type: 'position_risk',
          severity: position.unrealized_pnl_pct < -25 ? 'high' : 'medium',
          title: `${position.symbol} Significant Loss`,
          description: `${position.symbol} position down ${Math.abs(position.unrealized_pnl_pct).toFixed(1)}%`,
          suggested_actions: [
            'Review exit strategy',
            'Consider stop loss adjustment',
            'Analyze fundamental changes'
          ],
          created_at: new Date().toISOString(),
          acknowledged: false
        })
      }
    })
    
    return alerts
  }

  private async getRecentTrades(db: any, portfolioId: string, limit: number = 10): Promise<Trade[]> {
    const trades = await db.prepare(`
      SELECT * FROM trades 
      WHERE portfolio_id = ? 
      ORDER BY executed_at DESC 
      LIMIT ?
    `).bind(portfolioId, limit).all()

    return (trades.results || []).map((trade: any) => ({
      id: trade.id,
      portfolio_id: trade.portfolio_id,
      symbol: trade.symbol,
      side: trade.side,
      quantity: trade.quantity,
      price: trade.price,
      total_amount: trade.total_amount,
      fees: trade.fees,
      net_amount: trade.net_amount,
      trade_type: trade.trade_type,
      order_source: trade.order_source,
      recommendation_id: trade.recommendation_id,
      executed_at: trade.executed_at,
      settlement_date: trade.settlement_date,
      status: trade.status,
      holding_period_days: trade.holding_period_days,
      realized_pnl: trade.realized_pnl,
      realized_pnl_pct: trade.realized_pnl_pct
    }))
  }

  private async getLatestPositionSignal(db: any, positionId: string) {
    // This would get the latest AI signal for a position
    // For now, return mock signal
    return {
      signal: Math.random() > 0.5 ? 'hold' : Math.random() > 0.5 ? 'add' : 'reduce',
      updated_at: new Date().toISOString()
    }
  }

  private async updatePositionMetrics(db: any, position: Position) {
    // Update position with latest calculated metrics
    await db.prepare(`
      UPDATE positions 
      SET 
        current_price = ?,
        market_value = ?,
        unrealized_pnl = ?,
        unrealized_pnl_pct = ?,
        hold_duration_days = ?,
        last_updated = ?
      WHERE id = ?
    `).bind(
      position.current_price,
      position.market_value,
      position.unrealized_pnl,
      position.unrealized_pnl_pct,
      position.hold_duration_days,
      position.last_updated,
      position.id
    ).run().catch(() => {
      // Handle case where position table doesn't have these columns yet
      console.log('Position metrics update skipped - schema may need update')
    })
  }

  private async updatePortfolioCash(db: any, portfolioId: string, cashChange: number) {
    await db.prepare(`
      UPDATE portfolios 
      SET cash_balance = COALESCE(cash_balance, 10000) + ?
      WHERE id = ?
    `).bind(cashChange, portfolioId).run().catch(() => {
      console.log('Cash balance update skipped - schema may need update')
    })
  }

  private calculateTradingFees(amount: number): number {
    // Simple fee calculation: $0.50 per trade + 0.005% of trade value
    return 0.50 + (amount * 0.00005)
  }

  private async getCurrentPrice(symbol: string): Promise<number> {
    // Reuse existing price fetching logic
    const engine = new (await import('./recommendation-engine')).RecommendationEngine(this.env)
    return (engine as any).getCurrentPrice(symbol)
  }
}