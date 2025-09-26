-- Enhanced News Schema for Financial Filtering and API Usage Tracking

-- Add new columns to existing news_items table
ALTER TABLE news_items ADD COLUMN financial_relevance REAL DEFAULT 0.5;
ALTER TABLE news_items ADD COLUMN urgency REAL DEFAULT 0.5;
ALTER TABLE news_items ADD COLUMN categories TEXT; -- JSON array of categories
ALTER TABLE news_items ADD COLUMN processed_at DATETIME DEFAULT CURRENT_TIMESTAMP;

-- Create API usage tracking table
CREATE TABLE IF NOT EXISTS api_usage_tracking (
  id TEXT PRIMARY KEY,
  api_name TEXT NOT NULL, -- 'finnhub', 'openai', 'newsapi'
  usage_date DATE NOT NULL,
  call_count INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  -- Unique constraint per API per day
  UNIQUE(api_name, usage_date)
);

-- Create news source priorities table
CREATE TABLE IF NOT EXISTS news_source_config (
  id TEXT PRIMARY KEY,
  source_name TEXT UNIQUE NOT NULL,
  priority INTEGER DEFAULT 5, -- 1 (highest) to 10 (lowest)
  daily_limit INTEGER DEFAULT 1000,
  cost_per_call REAL DEFAULT 0.0,
  is_active BOOLEAN DEFAULT true,
  financial_focus REAL DEFAULT 0.5, -- How financially focused this source is
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Insert default source configurations
INSERT OR IGNORE INTO news_source_config (id, source_name, priority, daily_limit, cost_per_call, financial_focus) VALUES
  ('src-finnhub', 'finnhub', 1, 1000, 0.0, 0.95),
  ('src-openai', 'openai', 2, 100, 0.002, 0.0),  -- $0.002 per analysis call
  ('src-newsapi', 'newsapi', 3, 1000, 0.0, 0.6),
  ('src-google-rss', 'google_rss', 4, 9999, 0.0, 0.7),
  ('src-mock', 'mock_enhanced', 5, 9999, 0.0, 0.8);

-- Create financial keywords table for better filtering
CREATE TABLE IF NOT EXISTS financial_keywords (
  id TEXT PRIMARY KEY,
  keyword TEXT UNIQUE NOT NULL,
  category TEXT NOT NULL, -- 'ticker', 'financial', 'market', 'economic'
  weight REAL DEFAULT 1.0, -- Importance weight
  is_active BOOLEAN DEFAULT true,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Insert core financial keywords
INSERT OR IGNORE INTO financial_keywords (id, keyword, category, weight) VALUES
  -- Market terms
  ('kw-stock', 'stock', 'market', 1.5),
  ('kw-market', 'market', 'market', 1.5),
  ('kw-trading', 'trading', 'market', 1.3),
  ('kw-earnings', 'earnings', 'financial', 2.0),
  ('kw-revenue', 'revenue', 'financial', 1.8),
  ('kw-profit', 'profit', 'financial', 1.7),
  
  -- Economic indicators  
  ('kw-fed', 'federal reserve', 'economic', 2.0),
  ('kw-rates', 'interest rate', 'economic', 2.0),
  ('kw-inflation', 'inflation', 'economic', 1.8),
  ('kw-gdp', 'gdp', 'economic', 1.5),
  
  -- Market actions
  ('kw-merger', 'merger', 'market', 1.8),
  ('kw-acquisition', 'acquisition', 'market', 1.8),
  ('kw-ipo', 'ipo', 'market', 1.6),
  ('kw-dividend', 'dividend', 'financial', 1.4),
  
  -- Analysis terms
  ('kw-analyst', 'analyst', 'market', 1.2),
  ('kw-upgrade', 'upgrade', 'market', 1.5),
  ('kw-downgrade', 'downgrade', 'market', 1.5),
  ('kw-target', 'target price', 'market', 1.4);

-- Create news processing queue for batch operations
CREATE TABLE IF NOT EXISTS news_processing_queue (
  id TEXT PRIMARY KEY,
  article_url TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  source TEXT NOT NULL,
  published_at DATETIME,
  priority INTEGER DEFAULT 5, -- 1 (urgent) to 10 (low)
  status TEXT DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
  attempts INTEGER DEFAULT 0,
  max_attempts INTEGER DEFAULT 3,
  financial_score REAL DEFAULT 0.0, -- Pre-calculated financial relevance
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  processed_at DATETIME,
  error_message TEXT
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_news_financial_relevance ON news_items(financial_relevance DESC);
CREATE INDEX IF NOT EXISTS idx_news_urgency ON news_items(urgency DESC);  
CREATE INDEX IF NOT EXISTS idx_news_processed_at ON news_items(processed_at DESC);
CREATE INDEX IF NOT EXISTS idx_api_usage_date ON api_usage_tracking(usage_date DESC);
CREATE INDEX IF NOT EXISTS idx_queue_status ON news_processing_queue(status, priority);
CREATE INDEX IF NOT EXISTS idx_queue_financial_score ON news_processing_queue(financial_score DESC);

-- Create view for enhanced news with scoring
CREATE VIEW IF NOT EXISTS enhanced_news_view AS
SELECT 
  n.*,
  -- Calculate composite relevance score
  (n.financial_relevance * 0.4 + n.relevance * 0.3 + n.urgency * 0.3) as composite_score,
  -- Days since publication
  CAST((julianday('now') - julianday(n.published_at)) AS INTEGER) as days_old,
  -- Source priority
  sc.priority as source_priority,
  sc.financial_focus as source_financial_focus
FROM news_items n
LEFT JOIN news_source_config sc ON n.source = sc.source_name
WHERE n.financial_relevance >= 0.3  -- Only show financially relevant news
ORDER BY composite_score DESC, n.published_at DESC;

-- Create trigger to update API usage tracking
CREATE TRIGGER IF NOT EXISTS update_api_usage
  AFTER INSERT ON news_items
  WHEN NEW.source IN ('finnhub', 'newsapi', 'openai')
BEGIN
  INSERT OR REPLACE INTO api_usage_tracking (
    id, api_name, usage_date, call_count, updated_at
  ) VALUES (
    NEW.source || '-' || date('now'),
    LOWER(NEW.source),
    date('now'),
    COALESCE((
      SELECT call_count FROM api_usage_tracking 
      WHERE api_name = LOWER(NEW.source) AND usage_date = date('now')
    ), 0) + 1,
    CURRENT_TIMESTAMP
  );
END;