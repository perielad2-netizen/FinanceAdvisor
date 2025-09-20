-- Real-Time Trader Advisor Database Schema
-- Initial migration with all core tables

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT CHECK (role IN ('user', 'admin')) DEFAULT 'user',
  is_active BOOLEAN DEFAULT TRUE,
  last_login_at DATETIME,
  push_subscriptions TEXT DEFAULT '{}', -- JSON string for push notification endpoints
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- API Keys (per user, encrypted at rest)
CREATE TABLE IF NOT EXISTS api_keys (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  user_id TEXT NOT NULL,
  provider TEXT CHECK (provider IN ('OPENAI', 'NEWS_REALTIME', 'TWELVEDATA', 'FINNHUB', 'POLYGON', 'SENDGRID', 'TELEGRAM')) NOT NULL,
  key_value TEXT NOT NULL, -- Will be encrypted in application
  is_active BOOLEAN DEFAULT TRUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(user_id, provider)
);

-- Portfolios (real users' watched assets)
CREATE TABLE IF NOT EXISTS portfolios (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  base_currency TEXT DEFAULT 'USD',
  advisor_mode BOOLEAN DEFAULT TRUE,
  auto_mode BOOLEAN DEFAULT FALSE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Portfolio Settings
CREATE TABLE IF NOT EXISTS portfolio_settings (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  portfolio_id TEXT NOT NULL UNIQUE,
  per_trade_fraction REAL DEFAULT 0.02, -- 2% per trade
  commission_bps INTEGER DEFAULT 5, -- 0.05% commission
  take_profit_pct REAL DEFAULT 0.05, -- 5% take profit
  stop_loss_pct REAL DEFAULT 0.02, -- 2% stop loss
  use_atr_dynamic BOOLEAN DEFAULT FALSE,
  atr_lookback_days INTEGER DEFAULT 14,
  atr_sl_mult REAL DEFAULT 2.0,
  atr_tp_mult REAL DEFAULT 3.0,
  partial_tp_enabled BOOLEAN DEFAULT FALSE,
  partial_tp_ratio REAL DEFAULT 0.5, -- Sell 50% at first TP
  partial_tp_level_pct REAL DEFAULT 0.03, -- First TP at 3%
  max_open_positions INTEGER DEFAULT 10,
  sentiment_threshold REAL DEFAULT 0.5, -- Minimum sentiment score
  lookback_hours INTEGER DEFAULT 24, -- Look back 24 hours for news
  cooldown_hours_per_ticker INTEGER DEFAULT 6, -- 6 hour cooldown per ticker
  max_new_trades_per_run INTEGER DEFAULT 5,
  daily_kill_switch_enabled BOOLEAN DEFAULT TRUE,
  daily_max_loss_pct REAL DEFAULT 0.05, -- 5% daily max loss
  max_capital_at_risk_pct REAL DEFAULT 0.20, -- 20% max capital at risk
  trailing_core_pct REAL DEFAULT 0.02, -- 2% trailing stop for core positions
  trailing_risk_pct REAL DEFAULT 0.05, -- 5% trailing stop for risky positions
  timing_gate_enabled BOOLEAN DEFAULT TRUE,
  timing_interval TEXT DEFAULT '5m', -- 1m, 5m, 15m, 30m, 1h
  timing_rule TEXT DEFAULT '{"ema_fast": 12, "ema_slow": 26, "rsi_len": 14, "rsi_buy": 50, "adx_min": 25, "breakout_window": 20}', -- JSON string
  news_filters TEXT DEFAULT '{"blocklist_domains": [], "allowlist_domains": [], "min_relevance": 0.7, "disallow_sponsored": true}', -- JSON string
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (portfolio_id) REFERENCES portfolios(id) ON DELETE CASCADE
);

-- Tickers (available stocks/assets)
CREATE TABLE IF NOT EXISTS tickers (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  symbol TEXT UNIQUE NOT NULL,
  exchange TEXT,
  company_name TEXT,
  default_risk_bucket TEXT CHECK (default_risk_bucket IN ('core', 'high')) DEFAULT 'core',
  is_active BOOLEAN DEFAULT TRUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Portfolio Tickers (which tickers each portfolio watches)
CREATE TABLE IF NOT EXISTS portfolio_tickers (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  portfolio_id TEXT NOT NULL,
  ticker_id TEXT NOT NULL,
  enabled BOOLEAN DEFAULT TRUE,
  risk_bucket_override TEXT CHECK (risk_bucket_override IN ('core', 'high')),
  weight_hint REAL, -- Optional weighting hint
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (portfolio_id) REFERENCES portfolios(id) ON DELETE CASCADE,
  FOREIGN KEY (ticker_id) REFERENCES tickers(id) ON DELETE CASCADE,
  UNIQUE(portfolio_id, ticker_id)
);

-- Positions Snapshot (current holdings users report)
CREATE TABLE IF NOT EXISTS positions_snapshot (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  portfolio_id TEXT NOT NULL,
  ticker_id TEXT NOT NULL,
  qty REAL,
  avg_price REAL,
  last_seen_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (portfolio_id) REFERENCES portfolios(id) ON DELETE CASCADE,
  FOREIGN KEY (ticker_id) REFERENCES tickers(id) ON DELETE CASCADE,
  UNIQUE(portfolio_id, ticker_id)
);

-- Recommendations
CREATE TABLE IF NOT EXISTS recommendations (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  portfolio_id TEXT NOT NULL,
  ticker_id TEXT NOT NULL,
  rec_type TEXT CHECK (rec_type IN ('BUY', 'SELL_FULL', 'SELL_PARTIAL', 'MODIFY_SL')) NOT NULL,
  qty_suggested REAL, -- Nullable for MODIFY_SL
  entry_price REAL,
  take_profit REAL,
  stop_loss REAL,
  reason TEXT,
  source_url TEXT,
  status TEXT CHECK (status IN ('pending', 'delivered', 'dismissed', 'expired', 'acknowledged')) DEFAULT 'pending',
  cooldown_key TEXT, -- For deduplication
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (portfolio_id) REFERENCES portfolios(id) ON DELETE CASCADE,
  FOREIGN KEY (ticker_id) REFERENCES tickers(id) ON DELETE CASCADE
);

-- News Items
CREATE TABLE IF NOT EXISTS news_items (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  ticker_id TEXT,
  source TEXT CHECK (source IN ('NEWSAPI_RT', 'BENZINGA_RT', 'GOOGLE_RSS_FALLBACK', 'FINNHUB', 'POLYGON')),
  title TEXT NOT NULL,
  description TEXT,
  url TEXT UNIQUE NOT NULL,
  author TEXT,
  published_at DATETIME,
  sentiment INTEGER CHECK (sentiment IN (-1, 0, 1)), -- -1: negative, 0: neutral, 1: positive
  relevance REAL CHECK (relevance >= 0 AND relevance <= 1), -- 0-1 relevance score
  is_sponsored BOOLEAN DEFAULT FALSE,
  lang TEXT DEFAULT 'en',
  hash TEXT UNIQUE, -- For deduplication
  raw TEXT DEFAULT '{}', -- JSON string of raw data
  processed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (ticker_id) REFERENCES tickers(id) ON DELETE SET NULL
);

-- Signals Intraday (technical analysis results)
CREATE TABLE IF NOT EXISTS signals_intraday (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  ticker_id TEXT NOT NULL,
  interval TEXT NOT NULL, -- 1m, 5m, 15m, 30m, 1h
  indicators TEXT DEFAULT '{}', -- JSON string: {"ema_12": 150.5, "ema_26": 148.2, "rsi": 65.3, "adx": 28.5}
  verdict TEXT CHECK (verdict IN ('pass', 'hold')) DEFAULT 'hold',
  last_price REAL,
  computed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (ticker_id) REFERENCES tickers(id) ON DELETE CASCADE
);

-- Equity Snapshots (portfolio performance tracking)
CREATE TABLE IF NOT EXISTS equity_snapshots (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  portfolio_id TEXT NOT NULL,
  date_utc DATE NOT NULL,
  equity REAL NOT NULL,
  open_mv REAL DEFAULT 0, -- Open market value
  cash REAL DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (portfolio_id) REFERENCES portfolios(id) ON DELETE CASCADE,
  UNIQUE(portfolio_id, date_utc)
);

-- Schedules (for automated tasks)
CREATE TABLE IF NOT EXISTS schedules (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  portfolio_id TEXT NOT NULL,
  name TEXT NOT NULL,
  enabled BOOLEAN DEFAULT TRUE,
  cron_expr TEXT NOT NULL, -- Cron expression
  task_type TEXT CHECK (task_type IN ('RUN_ADVISOR', 'SNAPSHOT')) NOT NULL,
  last_run_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (portfolio_id) REFERENCES portfolios(id) ON DELETE CASCADE
);

-- Audit Logs (for tracking user actions)
CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  user_id TEXT,
  action TEXT NOT NULL,
  meta TEXT DEFAULT '{}', -- JSON string for additional data
  ip_address TEXT,
  user_agent TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_last_login ON users(last_login_at);

CREATE INDEX IF NOT EXISTS idx_api_keys_user_provider ON api_keys(user_id, provider);
CREATE INDEX IF NOT EXISTS idx_api_keys_active ON api_keys(is_active);

CREATE INDEX IF NOT EXISTS idx_portfolios_user ON portfolios(user_id);

CREATE INDEX IF NOT EXISTS idx_portfolio_tickers_portfolio ON portfolio_tickers(portfolio_id);
CREATE INDEX IF NOT EXISTS idx_portfolio_tickers_ticker ON portfolio_tickers(ticker_id);

CREATE INDEX IF NOT EXISTS idx_positions_portfolio ON positions_snapshot(portfolio_id);
CREATE INDEX IF NOT EXISTS idx_positions_ticker ON positions_snapshot(ticker_id);

CREATE INDEX IF NOT EXISTS idx_recommendations_portfolio ON recommendations(portfolio_id);
CREATE INDEX IF NOT EXISTS idx_recommendations_ticker ON recommendations(ticker_id);
CREATE INDEX IF NOT EXISTS idx_recommendations_status ON recommendations(status);
CREATE INDEX IF NOT EXISTS idx_recommendations_created ON recommendations(created_at);
CREATE INDEX IF NOT EXISTS idx_recommendations_cooldown ON recommendations(cooldown_key);

CREATE INDEX IF NOT EXISTS idx_news_ticker ON news_items(ticker_id);
CREATE INDEX IF NOT EXISTS idx_news_published ON news_items(published_at);
CREATE INDEX IF NOT EXISTS idx_news_source ON news_items(source);
CREATE INDEX IF NOT EXISTS idx_news_sentiment ON news_items(sentiment);
CREATE INDEX IF NOT EXISTS idx_news_relevance ON news_items(relevance);
CREATE INDEX IF NOT EXISTS idx_news_hash ON news_items(hash);

CREATE INDEX IF NOT EXISTS idx_signals_ticker_interval ON signals_intraday(ticker_id, interval);
CREATE INDEX IF NOT EXISTS idx_signals_computed ON signals_intraday(computed_at);
CREATE INDEX IF NOT EXISTS idx_signals_verdict ON signals_intraday(verdict);

CREATE INDEX IF NOT EXISTS idx_equity_portfolio_date ON equity_snapshots(portfolio_id, date_utc);

CREATE INDEX IF NOT EXISTS idx_schedules_portfolio ON schedules(portfolio_id);
CREATE INDEX IF NOT EXISTS idx_schedules_enabled ON schedules(enabled);
CREATE INDEX IF NOT EXISTS idx_schedules_last_run ON schedules(last_run_at);

CREATE INDEX IF NOT EXISTS idx_audit_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs(created_at);

-- Create triggers for updated_at timestamps
CREATE TRIGGER IF NOT EXISTS trigger_users_updated_at 
    AFTER UPDATE ON users
    BEGIN
        UPDATE users SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;

CREATE TRIGGER IF NOT EXISTS trigger_api_keys_updated_at 
    AFTER UPDATE ON api_keys
    BEGIN
        UPDATE api_keys SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;

CREATE TRIGGER IF NOT EXISTS trigger_portfolios_updated_at 
    AFTER UPDATE ON portfolios
    BEGIN
        UPDATE portfolios SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;

CREATE TRIGGER IF NOT EXISTS trigger_portfolio_settings_updated_at 
    AFTER UPDATE ON portfolio_settings
    BEGIN
        UPDATE portfolio_settings SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;

CREATE TRIGGER IF NOT EXISTS trigger_tickers_updated_at 
    AFTER UPDATE ON tickers
    BEGIN
        UPDATE tickers SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;

CREATE TRIGGER IF NOT EXISTS trigger_portfolio_tickers_updated_at 
    AFTER UPDATE ON portfolio_tickers
    BEGIN
        UPDATE portfolio_tickers SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;

CREATE TRIGGER IF NOT EXISTS trigger_positions_snapshot_updated_at 
    AFTER UPDATE ON positions_snapshot
    BEGIN
        UPDATE positions_snapshot SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;

CREATE TRIGGER IF NOT EXISTS trigger_recommendations_updated_at 
    AFTER UPDATE ON recommendations
    BEGIN
        UPDATE recommendations SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;

CREATE TRIGGER IF NOT EXISTS trigger_news_items_updated_at 
    AFTER UPDATE ON news_items
    BEGIN
        UPDATE news_items SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;

CREATE TRIGGER IF NOT EXISTS trigger_signals_intraday_updated_at 
    AFTER UPDATE ON signals_intraday
    BEGIN
        UPDATE signals_intraday SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;

CREATE TRIGGER IF NOT EXISTS trigger_equity_snapshots_updated_at 
    AFTER UPDATE ON equity_snapshots
    BEGIN
        UPDATE equity_snapshots SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;

CREATE TRIGGER IF NOT EXISTS trigger_schedules_updated_at 
    AFTER UPDATE ON schedules
    BEGIN
        UPDATE schedules SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;