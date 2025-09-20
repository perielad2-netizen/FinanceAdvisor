// Database initialization utilities
import type { D1Database } from '@cloudflare/workers-types'

export async function initializeDatabase(db: D1Database) {
  try {
    console.log('Initializing database tables...')
    
    // Create users table
    await db.prepare(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        name TEXT NOT NULL,
        role TEXT DEFAULT 'user',
        is_active BOOLEAN DEFAULT TRUE,
        last_login_at DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `).run()

    // Create portfolios table
    await db.prepare(`
      CREATE TABLE IF NOT EXISTS portfolios (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        name TEXT NOT NULL,
        base_currency TEXT DEFAULT 'USD',
        advisor_mode BOOLEAN DEFAULT TRUE,
        auto_mode BOOLEAN DEFAULT FALSE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `).run()

    // Create tickers table
    await db.prepare(`
      CREATE TABLE IF NOT EXISTS tickers (
        id TEXT PRIMARY KEY,
        symbol TEXT UNIQUE NOT NULL,
        exchange TEXT,
        company_name TEXT,
        default_risk_bucket TEXT DEFAULT 'core',
        is_active BOOLEAN DEFAULT TRUE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `).run()

    // Create recommendations table
    await db.prepare(`
      CREATE TABLE IF NOT EXISTS recommendations (
        id TEXT PRIMARY KEY,
        portfolio_id TEXT NOT NULL,
        ticker_id TEXT NOT NULL,
        rec_type TEXT NOT NULL,
        qty_suggested REAL,
        entry_price REAL,
        take_profit REAL,
        stop_loss REAL,
        reason TEXT,
        source_url TEXT,
        status TEXT DEFAULT 'pending',
        cooldown_key TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `).run()

    // Insert sample tickers
    const tickers = [
      ['ticker-aapl', 'AAPL', 'NASDAQ', 'Apple Inc.'],
      ['ticker-msft', 'MSFT', 'NASDAQ', 'Microsoft Corporation'],
      ['ticker-googl', 'GOOGL', 'NASDAQ', 'Alphabet Inc.'],
      ['ticker-tsla', 'TSLA', 'NASDAQ', 'Tesla Inc.'],
      ['ticker-nvda', 'NVDA', 'NASDAQ', 'NVIDIA Corporation']
    ]

    for (const [id, symbol, exchange, company] of tickers) {
      await db.prepare(`
        INSERT OR IGNORE INTO tickers (id, symbol, exchange, company_name)
        VALUES (?, ?, ?, ?)
      `).bind(id, symbol, exchange, company).run()
    }

    console.log('Database initialization complete!')
    return true
  } catch (error) {
    console.error('Database initialization failed:', error)
    return false
  }
}