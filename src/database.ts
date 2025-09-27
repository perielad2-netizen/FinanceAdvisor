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
        phone_number TEXT,
        role TEXT DEFAULT 'user',
        is_active BOOLEAN DEFAULT TRUE,
        last_login_at DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `).run()

    // Create user preferences table
    await db.prepare(`
      CREATE TABLE IF NOT EXISTS user_preferences (
        id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
        user_id TEXT NOT NULL UNIQUE,
        email_notifications BOOLEAN DEFAULT TRUE,
        telegram_notifications BOOLEAN DEFAULT FALSE,
        whatsapp_notifications BOOLEAN DEFAULT TRUE,
        phone_notifications BOOLEAN DEFAULT FALSE,
        telegram_bot_token TEXT,
        telegram_chat_id TEXT,
        recommendation_frequency INTEGER DEFAULT 120,
        risk_tolerance TEXT DEFAULT 'moderate',
        auto_scheduler_enabled BOOLEAN DEFAULT FALSE,
        risk_allocation_high INTEGER DEFAULT 20,
        risk_allocation_medium INTEGER DEFAULT 30,
        risk_allocation_low INTEGER DEFAULT 50,
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
        total_value REAL DEFAULT 0.0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `).run()

    // Create positions table
    await db.prepare(`
      CREATE TABLE IF NOT EXISTS positions (
        id TEXT PRIMARY KEY,
        portfolio_id TEXT NOT NULL,
        symbol TEXT NOT NULL,
        shares REAL NOT NULL,
        purchase_price REAL NOT NULL,
        current_price REAL,
        purchase_date DATETIME DEFAULT CURRENT_TIMESTAMP,
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

    // Create portfolio_settings table
    await db.prepare(`
      CREATE TABLE IF NOT EXISTS portfolio_settings (
        id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
        portfolio_id TEXT NOT NULL UNIQUE,
        per_trade_fraction REAL DEFAULT 0.02,
        commission_bps INTEGER DEFAULT 5,
        take_profit_pct REAL DEFAULT 0.05,
        stop_loss_pct REAL DEFAULT 0.02,
        sentiment_threshold REAL DEFAULT 0.6,
        max_open_positions INTEGER DEFAULT 10,
        timing_gate_enabled BOOLEAN DEFAULT TRUE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
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

    // Create news_items table
    await db.prepare(`
      CREATE TABLE IF NOT EXISTS news_items (
        id TEXT PRIMARY KEY,
        ticker_id TEXT,
        source TEXT,
        title TEXT NOT NULL,
        description TEXT,
        url TEXT UNIQUE NOT NULL,
        author TEXT,
        published_at DATETIME,
        sentiment INTEGER,
        relevance REAL,
        is_sponsored BOOLEAN DEFAULT FALSE,
        hash TEXT UNIQUE,
        processed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `).run()

    // Create signals_intraday table
    await db.prepare(`
      CREATE TABLE IF NOT EXISTS signals_intraday (
        id TEXT PRIMARY KEY,
        ticker_id TEXT NOT NULL,
        interval TEXT NOT NULL,
        indicators TEXT DEFAULT '{}',
        verdict TEXT DEFAULT 'hold',
        last_price REAL,
        computed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
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

    // Add tickers to any existing portfolios that don't have them
    const portfolios = await db.prepare('SELECT id FROM portfolios').all()
    
    for (const portfolio of portfolios.results || []) {
      for (const [tickerId, symbol] of tickers) {
        await db.prepare(`
          INSERT OR IGNORE INTO portfolio_tickers (
            id, portfolio_id, ticker_id, enabled
          ) VALUES (?, ?, ?, true)
        `).bind(
          'pt-' + Math.random().toString(36).substr(2, 9),
          portfolio.id,
          tickerId
        ).run()
      }
    }

    console.log('Database initialization complete!')
    return true
  } catch (error) {
    console.error('Database initialization failed:', error)
    return false
  }
}