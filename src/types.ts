// TypeScript types for the Trader Advisor application

export type Bindings = {
  DB: D1Database
  KV?: KVNamespace
  JWT_SECRET: string
  OPENAI_API_KEY?: string
  NEWS_API_KEY?: string
  TWELVEDATA_API_KEY?: string
  FINNHUB_API_KEY?: string
  POLYGON_API_KEY?: string
}

export type Variables = {
  user?: User
}

export interface User {
  id: string
  email: string
  name: string
  role: 'user' | 'admin'
  is_active: boolean
  created_at: string
}

export interface Portfolio {
  id: string
  user_id: string
  name: string
  base_currency: string
  advisor_mode: boolean
  auto_mode: boolean
  created_at: string
}

export interface Ticker {
  id: string
  symbol: string
  exchange?: string
  company_name?: string
  default_risk_bucket: 'core' | 'high'
  is_active: boolean
}

export interface NewsItem {
  id: string
  ticker_id?: string
  source: string
  title: string
  description?: string
  url: string
  author?: string
  published_at?: string
  sentiment?: -1 | 0 | 1
  relevance?: number
  is_sponsored: boolean
  processed_at: string
}

export interface Recommendation {
  id: string
  portfolio_id: string
  ticker_id: string
  rec_type: 'BUY' | 'SELL_FULL' | 'SELL_PARTIAL' | 'MODIFY_SL'
  qty_suggested?: number
  entry_price?: number
  take_profit?: number
  stop_loss?: number
  reason?: string
  source_url?: string
  status: 'pending' | 'delivered' | 'dismissed' | 'expired' | 'acknowledged'
  created_at: string
}

export interface TechnicalSignal {
  id: string
  ticker_id: string
  interval: string
  indicators: Record<string, number>
  verdict: 'pass' | 'hold'
  last_price?: number
  computed_at: string
}

export interface APIResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface JWTPayload {
  user_id: string
  email: string
  role: string
  exp: number
}

// External API types
export interface NewsAPIResponse {
  status: string
  totalResults: number
  articles: Array<{
    title: string
    description: string
    url: string
    urlToImage: string
    publishedAt: string
    source: {
      name: string
    }
    author?: string
  }>
}

export interface MarketDataResponse {
  symbol: string
  price: number
  change: number
  change_percent: number
  volume: number
  timestamp: string
}

export interface OpenAIAnalysisRequest {
  title: string
  description: string
  source_domain?: string
}

export interface OpenAIAnalysisResponse {
  sponsored: boolean
  confidence: number
  relevance: number
  sentiment: -1 | 0 | 1
  rationale: string
}