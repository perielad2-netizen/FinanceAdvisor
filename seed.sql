-- Seed data for Real-Time Trader Advisor
-- Test users, tickers, and sample data

-- Insert test users (passwords are 'password123' hashed with bcrypt)
INSERT OR IGNORE INTO users (id, email, password_hash, name, role) VALUES 
  ('demo-user-1', 'demo@trader.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Demo Trader', 'user'),
  ('admin-user-1', 'admin@trader.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Admin User', 'admin');

-- Insert popular tickers
INSERT OR IGNORE INTO tickers (id, symbol, exchange, company_name, default_risk_bucket) VALUES 
  ('ticker-aapl', 'AAPL', 'NASDAQ', 'Apple Inc.', 'core'),
  ('ticker-msft', 'MSFT', 'NASDAQ', 'Microsoft Corporation', 'core'),
  ('ticker-googl', 'GOOGL', 'NASDAQ', 'Alphabet Inc.', 'core'),
  ('ticker-amzn', 'AMZN', 'NASDAQ', 'Amazon.com Inc.', 'core'),
  ('ticker-tsla', 'TSLA', 'NASDAQ', 'Tesla Inc.', 'high'),
  ('ticker-nvda', 'NVDA', 'NASDAQ', 'NVIDIA Corporation', 'high'),
  ('ticker-meta', 'META', 'NASDAQ', 'Meta Platforms Inc.', 'core'),
  ('ticker-nflx', 'NFLX', 'NASDAQ', 'Netflix Inc.', 'high'),
  ('ticker-spy', 'SPY', 'NYSE', 'SPDR S&P 500 ETF Trust', 'core'),
  ('ticker-qqq', 'QQQ', 'NASDAQ', 'Invesco QQQ Trust', 'core');

-- Insert demo portfolio
INSERT OR IGNORE INTO portfolios (id, user_id, name, base_currency, advisor_mode, auto_mode) VALUES 
  ('demo-portfolio-1', 'demo-user-1', 'Tech Growth Portfolio', 'USD', true, false);

-- Insert portfolio settings for demo portfolio
INSERT OR IGNORE INTO portfolio_settings (portfolio_id) VALUES 
  ('demo-portfolio-1');

-- Add tickers to demo portfolio
INSERT OR IGNORE INTO portfolio_tickers (portfolio_id, ticker_id, enabled, risk_bucket_override) VALUES 
  ('demo-portfolio-1', 'ticker-aapl', true, NULL),
  ('demo-portfolio-1', 'ticker-msft', true, NULL),
  ('demo-portfolio-1', 'ticker-googl', true, NULL),
  ('demo-portfolio-1', 'ticker-tsla', true, NULL),
  ('demo-portfolio-1', 'ticker-nvda', true, NULL),
  ('demo-portfolio-1', 'ticker-meta', true, NULL);

-- Insert sample positions
INSERT OR IGNORE INTO positions_snapshot (portfolio_id, ticker_id, qty, avg_price) VALUES 
  ('demo-portfolio-1', 'ticker-aapl', 50, 185.25),
  ('demo-portfolio-1', 'ticker-msft', 30, 412.50),
  ('demo-portfolio-1', 'ticker-googl', 15, 142.75);

-- Insert sample equity snapshot
INSERT OR IGNORE INTO equity_snapshots (portfolio_id, date_utc, equity, open_mv, cash) VALUES 
  ('demo-portfolio-1', date('now'), 50000.00, 35000.00, 15000.00);

-- Insert sample news items
INSERT OR IGNORE INTO news_items (id, ticker_id, source, title, description, url, published_at, sentiment, relevance, is_sponsored, hash) VALUES 
  ('news-1', 'ticker-aapl', 'NEWSAPI_RT', 'Apple Reports Strong Q4 Earnings', 'Apple Inc. exceeded analyst expectations with record iPhone sales and services revenue growth.', 'https://example.com/apple-earnings-q4', datetime('now', '-2 hours'), 1, 0.9, false, 'hash-apple-earnings'),
  ('news-2', 'ticker-tsla', 'FINNHUB', 'Tesla Announces New Gigafactory Location', 'Tesla reveals plans for a new manufacturing facility to meet growing demand for electric vehicles.', 'https://example.com/tesla-gigafactory', datetime('now', '-4 hours'), 1, 0.8, false, 'hash-tesla-gigafactory'),
  ('news-3', 'ticker-meta', 'NEWSAPI_RT', 'Meta Faces Regulatory Scrutiny', 'European regulators announce investigation into Meta''s data practices and market dominance.', 'https://example.com/meta-regulation', datetime('now', '-6 hours'), -1, 0.7, false, 'hash-meta-regulation');

-- Insert sample technical signals
INSERT OR IGNORE INTO signals_intraday (ticker_id, interval, indicators, verdict, last_price) VALUES 
  ('ticker-aapl', '5m', '{"ema_12": 186.5, "ema_26": 184.2, "rsi": 62.3, "adx": 28.5, "atr": 2.15}', 'pass', 186.75),
  ('ticker-msft', '5m', '{"ema_12": 414.2, "ema_26": 412.8, "rsi": 58.1, "adx": 32.1, "atr": 3.25}', 'pass', 414.50),
  ('ticker-tsla', '5m', '{"ema_12": 248.5, "ema_26": 250.1, "rsi": 45.2, "adx": 18.3, "atr": 8.75}', 'hold', 247.25);

-- Insert sample recommendations
INSERT OR IGNORE INTO recommendations (id, portfolio_id, ticker_id, rec_type, qty_suggested, entry_price, take_profit, stop_loss, reason, source_url, status, cooldown_key) VALUES 
  ('rec-1', 'demo-portfolio-1', 'ticker-aapl', 'BUY', 25, 186.75, 196.09, 182.81, 'Strong earnings report and technical breakout above EMA resistance', 'https://example.com/apple-earnings-q4', 'pending', 'AAPL_BUY_20250917'),
  ('rec-2', 'demo-portfolio-1', 'ticker-meta', 'SELL_PARTIAL', 10, NULL, NULL, NULL, 'Regulatory concerns may impact short-term performance', 'https://example.com/meta-regulation', 'pending', 'META_SELL_PARTIAL_20250917');

-- Insert sample schedules
INSERT OR IGNORE INTO schedules (portfolio_id, name, enabled, cron_expr, task_type) VALUES 
  ('demo-portfolio-1', 'Daily Market Analysis', true, '0 9 * * 1-5', 'RUN_ADVISOR'),
  ('demo-portfolio-1', 'End of Day Snapshot', true, '0 16 * * 1-5', 'SNAPSHOT');

-- Insert audit log entry
INSERT OR IGNORE INTO audit_logs (user_id, action, meta) VALUES 
  ('demo-user-1', 'USER_LOGIN', '{"ip": "127.0.0.1", "user_agent": "Demo Browser"}');