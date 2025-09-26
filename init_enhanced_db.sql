-- Enhanced News Database Schema Update

-- Add new columns to existing news_items table (using ALTER TABLE IF NOT EXISTS pattern)
ALTER TABLE news_items ADD COLUMN financial_relevance REAL DEFAULT 0.5;
ALTER TABLE news_items ADD COLUMN urgency REAL DEFAULT 0.5;
ALTER TABLE news_items ADD COLUMN categories TEXT DEFAULT '[]';
ALTER TABLE news_items ADD COLUMN processed_at DATETIME DEFAULT CURRENT_TIMESTAMP;

-- Update existing records to have default values
UPDATE news_items SET 
  financial_relevance = CASE 
    WHEN relevance >= 0.7 THEN 0.8
    WHEN relevance >= 0.5 THEN 0.6  
    ELSE 0.4 
  END,
  urgency = 0.5,
  categories = '["general"]',
  processed_at = CURRENT_TIMESTAMP
WHERE financial_relevance IS NULL;

-- Insert some enhanced mock data for testing
INSERT OR IGNORE INTO news_items (
  id, title, description, url, source, published_at, sentiment, relevance, 
  is_sponsored, financial_relevance, urgency, categories, processed_at, reason
) VALUES 
(
  'news-enhanced-1',
  'Federal Reserve Maintains Interest Rates Amid Economic Uncertainty',
  'The Federal Reserve decided to keep interest rates unchanged as policymakers assess the impact of recent economic indicators on inflation and employment.',
  'https://example.com/fed-rates',
  'Enhanced Financial RSS',
  datetime('now', '-2 hours'),
  0.1,
  0.95,
  false,
  0.95,
  0.8,
  '["monetary_policy", "economic"]',
  CURRENT_TIMESTAMP,
  'High financial relevance: Federal Reserve policy directly impacts all markets'
),
(
  'news-enhanced-2', 
  'AAPL Stock Analysis: Technical Indicators Show Bullish Signals',
  'Recent technical analysis of AAPL reveals key price levels and trading patterns that could influence near-term price action.',
  'https://example.com/aapl-analysis',
  'Enhanced Financial RSS',
  datetime('now', '-1 hours'),
  0.4,
  0.9,
  false,
  0.9,
  0.7,
  '["technical_analysis", "stocks"]',
  CURRENT_TIMESTAMP,
  'Stock-specific analysis with high trading relevance'
),
(
  'news-enhanced-3',
  'Tech Stocks Rally on Strong Earnings Expectations',
  'Technology sector shows renewed strength as investors anticipate positive quarterly earnings from major companies.',
  'https://example.com/tech-rally',
  'Enhanced Financial RSS',
  datetime('now', '-30 minutes'),
  0.6,
  0.85,
  false,
  0.85,
  0.6,
  '["earnings", "technology"]',
  CURRENT_TIMESTAMP,
  'Sector-wide positive sentiment with earnings catalyst'
);

-- Create indexes for enhanced performance
CREATE INDEX IF NOT EXISTS idx_news_financial_relevance ON news_items(financial_relevance DESC);
CREATE INDEX IF NOT EXISTS idx_news_composite_score ON news_items((financial_relevance * 0.4 + relevance * 0.3 + urgency * 0.3) DESC);