-- Simple database initialization for local development
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
);

CREATE TABLE IF NOT EXISTS portfolios (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  base_currency TEXT DEFAULT 'USD',
  advisor_mode BOOLEAN DEFAULT TRUE,
  auto_mode BOOLEAN DEFAULT FALSE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS tickers (
  id TEXT PRIMARY KEY,
  symbol TEXT UNIQUE NOT NULL,
  exchange TEXT,
  company_name TEXT,
  default_risk_bucket TEXT DEFAULT 'core',
  is_active BOOLEAN DEFAULT TRUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Insert some test data
INSERT OR IGNORE INTO tickers (id, symbol, exchange, company_name) VALUES 
  ('ticker-aapl', 'AAPL', 'NASDAQ', 'Apple Inc.'),
  ('ticker-msft', 'MSFT', 'NASDAQ', 'Microsoft Corporation'),
  ('ticker-googl', 'GOOGL', 'NASDAQ', 'Alphabet Inc.'),
  ('ticker-tsla', 'TSLA', 'NASDAQ', 'Tesla Inc.');