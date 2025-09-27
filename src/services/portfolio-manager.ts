// Portfolio Management Service
import type { D1Database } from '@cloudflare/workers-types'

export class PortfolioManager {
  constructor(private env: any) {}

  async getPortfolioOverview(db: D1Database, portfolioId: string) {
    try {
      console.log(`📋 PortfolioManager: Getting overview for ${portfolioId}`)
      
      // Get portfolio basic info
      const portfolio = await db.prepare(`
        SELECT * FROM portfolios WHERE id = ?
      `).bind(portfolioId).first()

      console.log(`📋 PortfolioManager: Found portfolio:`, portfolio)

      if (!portfolio) {
        throw new Error('Portfolio not found')
      }

      // Get portfolio positions
      console.log(`📋 PortfolioManager: Fetching positions for ${portfolioId}`)
      
      // First, get positions without JOIN to see what's in the table
      const positions = await db.prepare(`
        SELECT * FROM positions WHERE portfolio_id = ?
      `).bind(portfolioId).all()
      
      console.log(`📋 PortfolioManager: Raw positions from DB:`, positions.results)
      
      console.log(`📋 PortfolioManager: Found ${positions.results?.length || 0} positions`)

      // Calculate portfolio value and metrics
      let totalValue = 0
      let totalCost = 0
      let dailyChange = 0

      const processedPositions = (positions.results || []).map((position: any) => {
        // Mock current price since it's not in database
        const mockCurrentPrice = 100 + Math.random() * 200 // $100-$300 range
        const currentValue = mockCurrentPrice * (position.quantity || position.qty || 0)
        const costBasis = (position.average_cost || position.avg_price || 100) * (position.quantity || position.qty || 0)
        const unrealizedPL = currentValue - costBasis
        const unrealizedPLPercent = costBasis > 0 ? (unrealizedPL / costBasis) * 100 : 0

        totalValue += currentValue
        totalCost += costBasis
        dailyChange += mockCurrentPrice * (position.quantity || position.qty || 0) * 0.02 // Mock 2% daily change

        return {
          ...position,
          quantity: position.quantity || position.qty || 0,
          average_cost: position.average_cost || position.avg_price || 100,
          current_price: mockCurrentPrice,
          current_value: currentValue,
          cost_basis: costBasis,
          unrealized_pl: unrealizedPL,
          unrealized_pl_percent: unrealizedPLPercent
        }
      })

      const totalPL = totalValue - totalCost
      const totalPLPercent = totalCost > 0 ? (totalPL / totalCost) * 100 : 0
      const dailyChangePercent = totalValue > 0 ? (dailyChange / totalValue) * 100 : 0

      return {
        portfolio: portfolio,
        holdings: processedPositions,  // Keep as 'holdings' for frontend compatibility
        positions: processedPositions,
        summary: {
          total_value: totalValue,
          total_cost: totalCost,
          total_pl: totalPL,
          total_pl_percent: totalPLPercent,
          daily_change: dailyChange,
          daily_change_percent: dailyChangePercent,
          holdings_count: processedPositions.length,
          positions_count: processedPositions.length
        }
      }
    } catch (error) {
      console.error('Portfolio overview error:', error)
      throw error
    }
  }

  async executeTrade(db: D1Database, tradeData: any) {
    try {
      const { portfolio_id, symbol, side, quantity, price = 100 } = tradeData

      // Get or create ticker
      let ticker = await db.prepare(`
        SELECT id FROM tickers WHERE symbol = ?
      `).bind(symbol).first()

      if (!ticker) {
        // Create new ticker
        const result = await db.prepare(`
          INSERT INTO tickers (symbol, company_name, current_price)
          VALUES (?, ?, ?)
        `).bind(symbol, symbol + ' Corp', price).run()
        ticker = { id: result.meta.last_row_id }
      }

      // Insert trade record
      const tradeResult = await db.prepare(`
        INSERT INTO trades (portfolio_id, ticker_id, side, quantity, price, executed_at)
        VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `).bind(portfolio_id, ticker.id, side.toUpperCase(), quantity, price).run()

      // Update holdings
      if (side.toLowerCase() === 'buy') {
        // Check if holding exists
        const existingHolding = await db.prepare(`
          SELECT * FROM holdings WHERE portfolio_id = ? AND ticker_id = ?
        `).bind(portfolio_id, ticker.id).first()

        if (existingHolding) {
          // Update existing holding
          const newQuantity = existingHolding.quantity + quantity
          const newAverageCost = ((existingHolding.quantity * existingHolding.average_cost) + (quantity * price)) / newQuantity

          await db.prepare(`
            UPDATE holdings 
            SET quantity = ?, average_cost = ?, updated_at = CURRENT_TIMESTAMP
            WHERE portfolio_id = ? AND ticker_id = ?
          `).bind(newQuantity, newAverageCost, portfolio_id, ticker.id).run()
        } else {
          // Create new holding
          await db.prepare(`
            INSERT INTO holdings (portfolio_id, ticker_id, quantity, average_cost, created_at, updated_at)
            VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
          `).bind(portfolio_id, ticker.id, quantity, price).run()
        }
      } else if (side.toLowerCase() === 'sell') {
        // Update holding (subtract quantity)
        await db.prepare(`
          UPDATE holdings 
          SET quantity = quantity - ?, updated_at = CURRENT_TIMESTAMP
          WHERE portfolio_id = ? AND ticker_id = ?
        `).bind(quantity, portfolio_id, ticker.id).run()

        // Remove holding if quantity becomes 0 or negative
        await db.prepare(`
          DELETE FROM holdings 
          WHERE portfolio_id = ? AND ticker_id = ? AND quantity <= 0
        `).bind(portfolio_id, ticker.id).run()
      }

      return {
        trade_id: tradeResult.meta.last_row_id,
        portfolio_id,
        symbol,
        side: side.toUpperCase(),
        quantity,
        price,
        executed_at: new Date().toISOString()
      }
    } catch (error) {
      console.error('Trade execution error:', error)
      throw error
    }
  }

  async generateRebalancingPlan(db: D1Database, portfolioId: string) {
    // Mock rebalancing plan
    return {
      current_allocation: {
        'AAPL': 25.5,
        'MSFT': 22.3,
        'GOOGL': 18.7,
        'AMZN': 15.2,
        'TSLA': 12.1,
        'Cash': 6.2
      },
      target_allocation: {
        'AAPL': 20.0,
        'MSFT': 20.0,
        'GOOGL': 20.0,
        'AMZN': 20.0,
        'TSLA': 15.0,
        'Cash': 5.0
      },
      rebalancing_actions: [
        { symbol: 'AAPL', action: 'SELL', shares: 15, reason: 'Overweight by 5.5%' },
        { symbol: 'GOOGL', action: 'BUY', shares: 8, reason: 'Underweight by 1.3%' },
        { symbol: 'AMZN', action: 'BUY', shares: 12, reason: 'Underweight by 4.8%' }
      ],
      estimated_impact: {
        transaction_costs: 12.50,
        tax_implications: 145.30,
        expected_improvement: 2.3 // percentage points
      }
    }
  }
}