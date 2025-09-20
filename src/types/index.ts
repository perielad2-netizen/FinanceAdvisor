// TypeScript types for the Real-Time Trader Advisor

export interface Bindings {
  DB: D1Database;
  KV: KVNamespace;
  JWT_SECRET: string;
  OPENAI_API_KEY?: string;
  NEWS_API_KEY?: string;
  TWELVEDATA_API_KEY?: string;
  FINNHUB_API_KEY?: string;
  POLYGON_API_KEY?: string;
  SENDGRID_API_KEY?: string;
  TELEGRAM_BOT_TOKEN?: string;
  APP_URL?: string;
  CORS_ORIGIN?: string;
}

export interface User {
  id: string;
  email: string;
  password_hash: string;
  name: string;
  role: 'user' | 'admin';
  is_active: boolean;
  last_login_at?: string;
  push_subscriptions: string; // JSON string
  created_at: string;
  updated_at: string;
}

export interface ApiKey {
  id: string;
  user_id: string;
  provider: 'OPENAI' | 'NEWS_REALTIME' | 'TWELVEDATA' | 'FINNHUB' | 'POLYGON' | 'SENDGRID' | 'TELEGRAM';
  key_value: string; // Encrypted
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Portfolio {
  id: string;
  user_id: string;
  name: string;
  base_currency: string;
  advisor_mode: boolean;
  auto_mode: boolean;
  created_at: string;
  updated_at: string;
}

export interface PortfolioSettings {
  id: string;
  portfolio_id: string;
  per_trade_fraction: number;
  commission_bps: number;
  take_profit_pct: number;
  stop_loss_pct: number;
  use_atr_dynamic: boolean;
  atr_lookback_days: number;
  atr_sl_mult: number;
  atr_tp_mult: number;
  partial_tp_enabled: boolean;
  partial_tp_ratio: number;
  partial_tp_level_pct: number;
  max_open_positions: number;
  sentiment_threshold: number;
  lookback_hours: number;
  cooldown_hours_per_ticker: number;
  max_new_trades_per_run: number;
  daily_kill_switch_enabled: boolean;
  daily_max_loss_pct: number;
  max_capital_at_risk_pct: number;
  trailing_core_pct: number;
  trailing_risk_pct: number;
  timing_gate_enabled: boolean;
  timing_interval: string;
  timing_rule: string; // JSON string
  news_filters: string; // JSON string
  created_at: string;
  updated_at: string;
}

export interface Ticker {
  id: string;
  symbol: string;
  exchange?: string;
  company_name?: string;
  default_risk_bucket: 'core' | 'high';
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PortfolioTicker {
  id: string;
  portfolio_id: string;
  ticker_id: string;
  enabled: boolean;
  risk_bucket_override?: 'core' | 'high';
  weight_hint?: number;
  created_at: string;
  updated_at: string;
}

export interface PositionSnapshot {
  id: string;
  portfolio_id: string;
  ticker_id: string;
  qty?: number;
  avg_price?: number;
  last_seen_at: string;
  created_at: string;
  updated_at: string;
}

export interface Recommendation {
  id: string;
  portfolio_id: string;
  ticker_id: string;
  rec_type: 'BUY' | 'SELL_FULL' | 'SELL_PARTIAL' | 'MODIFY_SL';
  qty_suggested?: number;
  entry_price?: number;
  take_profit?: number;
  stop_loss?: number;
  reason?: string;
  source_url?: string;
  status: 'pending' | 'delivered' | 'dismissed' | 'expired' | 'acknowledged';
  cooldown_key?: string;
  created_at: string;
  updated_at: string;
}

export interface NewsItem {
  id: string;
  ticker_id?: string;
  source?: 'NEWSAPI_RT' | 'BENZINGA_RT' | 'GOOGLE_RSS_FALLBACK' | 'FINNHUB' | 'POLYGON';
  title: string;
  description?: string;
  url: string;
  author?: string;
  published_at?: string;
  sentiment?: -1 | 0 | 1;
  relevance?: number;
  is_sponsored: boolean;
  lang: string;
  hash?: string;
  raw: string; // JSON string
  processed_at: string;
  created_at: string;
  updated_at: string;
}

export interface SignalIntraday {
  id: string;
  ticker_id: string;
  interval: string;
  indicators: string; // JSON string
  verdict: 'pass' | 'hold';
  last_price?: number;
  computed_at: string;
  created_at: string;
  updated_at: string;
}

export interface EquitySnapshot {
  id: string;
  portfolio_id: string;
  date_utc: string;
  equity: number;
  open_mv: number;
  cash: number;
  created_at: string;
  updated_at: string;
}

export interface Schedule {
  id: string;
  portfolio_id: string;
  name: string;
  enabled: boolean;
  cron_expr: string;
  task_type: 'RUN_ADVISOR' | 'SNAPSHOT';
  last_run_at?: string;
  created_at: string;
  updated_at: string;
}

export interface AuditLog {
  id: string;
  user_id?: string;
  action: string;
  meta: string; // JSON string
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}

// Request/Response types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
}

export interface AuthResponse {
  user: Omit<User, 'password_hash'>;
  token?: string;
}

export interface CreatePortfolioRequest {
  name: string;
  base_currency?: string;
  advisor_mode?: boolean;
  auto_mode?: boolean;
}

export interface UpdatePortfolioSettingsRequest extends Partial<Omit<PortfolioSettings, 'id' | 'portfolio_id' | 'created_at' | 'updated_at'>> {}

export interface AnalyzeTimingRequest {
  ticker_symbol: string;
  interval?: string;
}

export interface AnalyzeTimingResponse {
  ticker: string;
  interval: string;
  indicators: Record<string, number>;
  verdict: 'pass' | 'hold';
  last_price: number;
  computed_at: string;
}

// Market data types
export interface MarketDataCandle {
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  timestamp: number;
}

export interface TechnicalIndicators {
  ema_12?: number;
  ema_26?: number;
  rsi?: number;
  adx?: number;
  atr?: number;
  bb_upper?: number;
  bb_lower?: number;
  macd?: number;
  macd_signal?: number;
}

// News analysis types
export interface NewsAnalysisResult {
  sentiment: -1 | 0 | 1;
  relevance: number;
  is_sponsored: boolean;
  rationale?: string;
  confidence?: number;
}

// API response wrapper
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Pagination
export interface PaginationParams {
  page?: number;
  limit?: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination?: {
    current_page: number;
    total_pages: number;
    total_items: number;
    per_page: number;
    has_next: boolean;
    has_prev: boolean;
  };
}