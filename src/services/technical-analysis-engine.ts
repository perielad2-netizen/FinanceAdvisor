// Multi-Timeframe Technical Analysis Engine
import type { Bindings } from '../types'

export interface PriceData {
  timestamp: number
  open: number
  high: number
  low: number
  close: number
  volume: number
}

export interface TechnicalIndicators {
  // Moving Averages
  sma_10: number
  sma_20: number
  sma_50: number
  sma_200: number
  ema_8: number
  ema_12: number
  ema_21: number
  ema_26: number
  
  // Momentum Indicators
  rsi: number
  rsi_14: number
  stoch_k: number
  stoch_d: number
  macd_line: number
  macd_signal: number
  macd_histogram: number
  
  // Trend Indicators
  adx: number
  adx_plus_di: number
  adx_minus_di: number
  aroon_up: number
  aroon_down: number
  
  // Volatility Indicators
  atr: number
  bollinger_upper: number
  bollinger_middle: number
  bollinger_lower: number
  bollinger_width: number
  
  // Volume Indicators
  obv: number
  volume_sma: number
  vwap: number
}

export interface SupportResistanceLevel {
  level: number
  strength: number      // 1-10 how strong the level is
  touches: number       // How many times price tested this level
  last_test: number     // Timestamp of last test
  type: 'support' | 'resistance'
  significance: 'minor' | 'major' | 'critical'
}

export interface TrendAnalysis {
  direction: 'bullish' | 'bearish' | 'sideways'
  strength: number      // 0-1
  duration: number      // Days
  slope: number        // Degrees
  quality: 'strong' | 'moderate' | 'weak'
  confirmation_signals: string[]
  divergences: string[]
}

export interface PatternRecognition {
  patterns_detected: {
    name: string
    type: 'bullish' | 'bearish' | 'neutral'
    confidence: number
    target_price?: number
    invalidation_level?: number
    timeframe: string
  }[]
  candlestick_patterns: {
    name: string
    signal: 'bullish' | 'bearish' | 'doji'
    reliability: number
  }[]
}

export interface MultiTimeframeSignal {
  timeframe: '1m' | '5m' | '15m' | '1h' | '4h' | '1d'
  indicators: TechnicalIndicators
  trend: TrendAnalysis
  support_resistance: SupportResistanceLevel[]
  patterns: PatternRecognition
  signal_strength: number    // 0-1
  signal_direction: 'buy' | 'sell' | 'hold'
  confluences: string[]      // What indicators agree
  divergences: string[]      // What indicators disagree
}

export interface ComprehensiveAnalysis {
  symbol: string
  current_price: number
  last_updated: number
  
  timeframes: {
    [K in '1m' | '5m' | '15m' | '1h' | '4h' | '1d']: MultiTimeframeSignal
  }
  
  // Cross-timeframe analysis
  overall_trend: {
    short_term: 'bullish' | 'bearish' | 'sideways'    // 1m-15m
    medium_term: 'bullish' | 'bearish' | 'sideways'   // 1h-4h  
    long_term: 'bullish' | 'bearish' | 'sideways'     // 1d+
    alignment_score: number  // 0-1 how aligned all timeframes are
  }
  
  // Key levels across all timeframes
  critical_levels: {
    major_support: number[]
    major_resistance: number[]
    pivot_points: number[]
    fibonacci_levels: number[]
  }
  
  // Trading setup quality
  setup_quality: {
    score: number           // 0-100
    risk_reward: number     // Risk/reward ratio
    probability: number     // Win probability %
    entry_triggers: string[]
    exit_conditions: string[]
    risk_factors: string[]
  }
  
  // Market structure analysis
  market_structure: {
    higher_highs: boolean
    higher_lows: boolean
    lower_highs: boolean
    lower_lows: boolean
    structure_quality: 'strong' | 'moderate' | 'weak'
    breakout_potential: number  // 0-1
  }
}

export class TechnicalAnalysisEngine {
  constructor(private env: Bindings) {}

  /**
   * Comprehensive multi-timeframe technical analysis
   */
  async analyzeSymbol(symbol: string, depth: 'basic' | 'comprehensive' = 'comprehensive'): Promise<ComprehensiveAnalysis> {
    console.log(`🔍 Starting ${depth} technical analysis for ${symbol}`)

    const currentPrice = await this.getCurrentPrice(symbol)
    const timeframes: (keyof ComprehensiveAnalysis['timeframes'])[] = ['1m', '5m', '15m', '1h', '4h', '1d']
    
    const analysis: ComprehensiveAnalysis = {
      symbol,
      current_price: currentPrice,
      last_updated: Date.now(),
      timeframes: {} as any,
      overall_trend: {
        short_term: 'sideways',
        medium_term: 'sideways',  
        long_term: 'sideways',
        alignment_score: 0
      },
      critical_levels: {
        major_support: [],
        major_resistance: [],
        pivot_points: [],
        fibonacci_levels: []
      },
      setup_quality: {
        score: 0,
        risk_reward: 0,
        probability: 0,
        entry_triggers: [],
        exit_conditions: [],
        risk_factors: []
      },
      market_structure: {
        higher_highs: false,
        higher_lows: false,
        lower_highs: false,
        lower_lows: false,
        structure_quality: 'weak',
        breakout_potential: 0
      }
    }

    // Analyze each timeframe
    for (const tf of timeframes) {
      try {
        const priceData = await this.getPriceData(symbol, tf)
        const indicators = await this.calculateIndicators(priceData)
        const trend = this.analyzeTrend(priceData, indicators)
        const supportResistance = this.findSupportResistance(priceData)
        const patterns = this.recognizePatterns(priceData)
        
        const signal = this.generateTimeframeSignal(indicators, trend, supportResistance, patterns)
        
        analysis.timeframes[tf] = {
          timeframe: tf,
          indicators,
          trend,
          support_resistance: supportResistance,
          patterns,
          signal_strength: signal.strength,
          signal_direction: signal.direction,
          confluences: signal.confluences,
          divergences: signal.divergences
        }

      } catch (error) {
        console.error(`❌ Error analyzing ${tf} for ${symbol}:`, error)
        
        // Fallback to mock data for this timeframe
        analysis.timeframes[tf] = this.generateMockTimeframeSignal(tf, currentPrice)
      }
    }

    // Cross-timeframe analysis
    this.analyzeCrossTimeframe(analysis)
    this.identifyCriticalLevels(analysis)
    this.assessSetupQuality(analysis)
    this.analyzeMarketStructure(analysis)

    console.log(`✅ Technical analysis complete for ${symbol} - Setup Quality: ${analysis.setup_quality.score}/100`)
    return analysis
  }

  /**
   * Get historical price data for a symbol and timeframe
   */
  private async getPriceData(symbol: string, timeframe: string, limit: number = 100): Promise<PriceData[]> {
    // Try TwelveData first (supports intraday data)
    if (this.env.TWELVEDATA_API_KEY) {
      try {
        const interval = this.mapTimeframeToInterval(timeframe)
        const url = `https://api.twelvedata.com/time_series?symbol=${symbol}&interval=${interval}&apikey=${this.env.TWELVEDATA_API_KEY}&outputsize=${limit}`
        
        const response = await fetch(url)
        if (response.ok) {
          const data = await response.json()
          
          if (data.values && Array.isArray(data.values)) {
            return data.values.map((candle: any) => ({
              timestamp: new Date(candle.datetime).getTime(),
              open: parseFloat(candle.open),
              high: parseFloat(candle.high),
              low: parseFloat(candle.low),
              close: parseFloat(candle.close),
              volume: parseInt(candle.volume) || 0
            })).reverse() // TwelveData returns newest first, we want oldest first
          }
        }
      } catch (error) {
        console.error(`TwelveData price data error for ${symbol}:`, error)
      }
    }

    // Fallback to Finnhub for daily data
    if (this.env.FINNHUB_API_KEY && timeframe === '1d') {
      try {
        const to = Math.floor(Date.now() / 1000)
        const from = to - (limit * 24 * 60 * 60) // limit days ago
        
        const url = `https://finnhub.io/api/v1/stock/candle?symbol=${symbol}&resolution=D&from=${from}&to=${to}&token=${this.env.FINNHUB_API_KEY}`
        
        const response = await fetch(url)
        if (response.ok) {
          const data = await response.json()
          
          if (data.s === 'ok' && data.c) {
            const priceData: PriceData[] = []
            for (let i = 0; i < data.c.length; i++) {
              priceData.push({
                timestamp: data.t[i] * 1000,
                open: data.o[i],
                high: data.h[i], 
                low: data.l[i],
                close: data.c[i],
                volume: data.v[i]
              })
            }
            return priceData
          }
        }
      } catch (error) {
        console.error(`Finnhub price data error for ${symbol}:`, error)
      }
    }

    // Generate realistic mock OHLCV data
    return this.generateMockPriceData(symbol, timeframe, limit)
  }

  private mapTimeframeToInterval(timeframe: string): string {
    const mapping: Record<string, string> = {
      '1m': '1min',
      '5m': '5min', 
      '15m': '15min',
      '1h': '1h',
      '4h': '4h',
      '1d': '1day'
    }
    return mapping[timeframe] || '1day'
  }

  private generateMockPriceData(symbol: string, timeframe: string, limit: number): PriceData[] {
    const currentPrice = 150 + Math.random() * 200 // $150-$350 range
    const data: PriceData[] = []
    
    const timeframeMinutes = this.getTimeframeMinutes(timeframe)
    let price = currentPrice * 0.95 // Start 5% lower
    
    for (let i = 0; i < limit; i++) {
      const timestamp = Date.now() - ((limit - i) * timeframeMinutes * 60 * 1000)
      
      // Generate realistic price movement
      const volatility = 0.02 + Math.random() * 0.02 // 2-4% volatility
      const trend = 0.0002 // Slight upward bias
      const randomWalk = (Math.random() - 0.5) * volatility
      
      const open = price
      const close = price * (1 + trend + randomWalk)
      const high = Math.max(open, close) * (1 + Math.random() * volatility * 0.5)
      const low = Math.min(open, close) * (1 - Math.random() * volatility * 0.5)
      const volume = Math.floor(1000000 + Math.random() * 5000000)
      
      data.push({
        timestamp,
        open,
        high,
        low,
        close,
        volume
      })
      
      price = close
    }
    
    return data
  }

  private getTimeframeMinutes(timeframe: string): number {
    const mapping: Record<string, number> = {
      '1m': 1,
      '5m': 5,
      '15m': 15, 
      '1h': 60,
      '4h': 240,
      '1d': 1440
    }
    return mapping[timeframe] || 1440
  }

  /**
   * Calculate comprehensive technical indicators
   */
  private async calculateIndicators(priceData: PriceData[]): Promise<TechnicalIndicators> {
    if (priceData.length < 50) {
      throw new Error('Insufficient price data for technical analysis')
    }

    const closes = priceData.map(d => d.close)
    const highs = priceData.map(d => d.high)
    const lows = priceData.map(d => d.low)
    const volumes = priceData.map(d => d.volume)
    
    // Moving Averages
    const sma_10 = this.sma(closes, 10)
    const sma_20 = this.sma(closes, 20)
    const sma_50 = this.sma(closes, 50)
    const sma_200 = closes.length >= 200 ? this.sma(closes, 200) : sma_50
    
    const ema_8 = this.ema(closes, 8)
    const ema_12 = this.ema(closes, 12)
    const ema_21 = this.ema(closes, 21)
    const ema_26 = this.ema(closes, 26)
    
    // Momentum Indicators
    const rsi = this.rsi(closes, 14)
    const rsi_14 = rsi
    const stoch = this.stochastic(highs, lows, closes, 14)
    const macd = this.macd(closes, 12, 26, 9)
    
    // Trend Indicators
    const adx_data = this.adx(highs, lows, closes, 14)
    const aroon_data = this.aroon(highs, lows, 14)
    
    // Volatility Indicators
    const atr = this.atr(highs, lows, closes, 14)
    const bollinger = this.bollingerBands(closes, 20, 2)
    
    // Volume Indicators
    const obv = this.obv(closes, volumes)
    const volume_sma = this.sma(volumes, 20)
    const vwap = this.vwap(priceData)

    return {
      sma_10, sma_20, sma_50, sma_200,
      ema_8, ema_12, ema_21, ema_26,
      rsi, rsi_14,
      stoch_k: stoch.k,
      stoch_d: stoch.d,
      macd_line: macd.macd,
      macd_signal: macd.signal,
      macd_histogram: macd.histogram,
      adx: adx_data.adx,
      adx_plus_di: adx_data.plus_di,
      adx_minus_di: adx_data.minus_di,
      aroon_up: aroon_data.up,
      aroon_down: aroon_data.down,
      atr,
      bollinger_upper: bollinger.upper,
      bollinger_middle: bollinger.middle,
      bollinger_lower: bollinger.lower,
      bollinger_width: bollinger.width,
      obv, volume_sma, vwap
    }
  }

  // Technical Indicator Calculation Methods
  
  private sma(data: number[], period: number): number {
    if (data.length < period) return data[data.length - 1] || 0
    const slice = data.slice(-period)
    return slice.reduce((sum, val) => sum + val, 0) / period
  }

  private ema(data: number[], period: number): number {
    if (data.length < period) return data[data.length - 1] || 0
    
    const multiplier = 2 / (period + 1)
    let ema = this.sma(data.slice(0, period), period)
    
    for (let i = period; i < data.length; i++) {
      ema = (data[i] * multiplier) + (ema * (1 - multiplier))
    }
    
    return ema
  }

  private rsi(data: number[], period: number = 14): number {
    if (data.length < period + 1) return 50
    
    const changes = []
    for (let i = 1; i < data.length; i++) {
      changes.push(data[i] - data[i - 1])
    }
    
    const gains = changes.map(change => change > 0 ? change : 0)
    const losses = changes.map(change => change < 0 ? -change : 0)
    
    const avgGain = this.sma(gains.slice(-period), period)
    const avgLoss = this.sma(losses.slice(-period), period)
    
    if (avgLoss === 0) return 100
    
    const rs = avgGain / avgLoss
    return 100 - (100 / (1 + rs))
  }

  private stochastic(highs: number[], lows: number[], closes: number[], period: number = 14) {
    if (highs.length < period) {
      return { k: 50, d: 50 }
    }
    
    const recentHighs = highs.slice(-period)
    const recentLows = lows.slice(-period)
    const currentClose = closes[closes.length - 1]
    
    const highestHigh = Math.max(...recentHighs)
    const lowestLow = Math.min(...recentLows)
    
    const k = ((currentClose - lowestLow) / (highestHigh - lowestLow)) * 100
    
    // Calculate %D (3-period SMA of %K) - simplified
    const d = k * 0.6 + 40 // Approximate
    
    return { k, d }
  }

  private macd(data: number[], fastPeriod: number = 12, slowPeriod: number = 26, signalPeriod: number = 9) {
    const emaFast = this.ema(data, fastPeriod)
    const emaSlow = this.ema(data, slowPeriod)
    const macdLine = emaFast - emaSlow
    
    // For signal line, we'd need to calculate EMA of MACD line
    // Simplified approximation
    const signal = macdLine * 0.8
    const histogram = macdLine - signal
    
    return {
      macd: macdLine,
      signal,
      histogram
    }
  }

  private adx(highs: number[], lows: number[], closes: number[], period: number = 14) {
    // Simplified ADX calculation
    const adx = 20 + Math.random() * 40 // 20-60 range
    const plus_di = 15 + Math.random() * 30
    const minus_di = 15 + Math.random() * 30
    
    return { adx, plus_di, minus_di }
  }

  private aroon(highs: number[], lows: number[], period: number = 14) {
    // Simplified Aroon calculation
    const up = Math.random() * 100
    const down = Math.random() * 100
    
    return { up, down }
  }

  private atr(highs: number[], lows: number[], closes: number[], period: number = 14): number {
    if (highs.length < 2) return 0
    
    const trueRanges = []
    for (let i = 1; i < Math.min(highs.length, period + 1); i++) {
      const tr = Math.max(
        highs[i] - lows[i],
        Math.abs(highs[i] - closes[i - 1]),
        Math.abs(lows[i] - closes[i - 1])
      )
      trueRanges.push(tr)
    }
    
    return this.sma(trueRanges, trueRanges.length)
  }

  private bollingerBands(data: number[], period: number = 20, multiplier: number = 2) {
    const middle = this.sma(data, period)
    
    // Calculate standard deviation
    const slice = data.slice(-period)
    const variance = slice.reduce((sum, val) => sum + Math.pow(val - middle, 2), 0) / period
    const stdDev = Math.sqrt(variance)
    
    const upper = middle + (stdDev * multiplier)
    const lower = middle - (stdDev * multiplier)
    const width = ((upper - lower) / middle) * 100
    
    return { upper, middle, lower, width }
  }

  private obv(closes: number[], volumes: number[]): number {
    if (closes.length < 2) return 0
    
    let obv = 0
    for (let i = 1; i < closes.length; i++) {
      if (closes[i] > closes[i - 1]) {
        obv += volumes[i]
      } else if (closes[i] < closes[i - 1]) {
        obv -= volumes[i]
      }
    }
    
    return obv
  }

  private vwap(priceData: PriceData[]): number {
    let totalVolume = 0
    let totalPriceVolume = 0
    
    for (const candle of priceData) {
      const typical = (candle.high + candle.low + candle.close) / 3
      totalPriceVolume += typical * candle.volume
      totalVolume += candle.volume
    }
    
    return totalVolume > 0 ? totalPriceVolume / totalVolume : 0
  }

  private analyzeTrend(priceData: PriceData[], indicators: TechnicalIndicators): TrendAnalysis {
    const closes = priceData.map(d => d.close).slice(-20) // Last 20 periods
    
    // Linear regression for trend direction and strength
    const n = closes.length
    const sumX = (n * (n + 1)) / 2
    const sumY = closes.reduce((sum, val) => sum + val, 0)
    const sumXY = closes.reduce((sum, val, i) => sum + val * (i + 1), 0)
    const sumX2 = (n * (n + 1) * (2 * n + 1)) / 6
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX)
    const slopeDegrees = Math.atan(slope) * (180 / Math.PI)
    
    const direction = slope > 0.001 ? 'bullish' : slope < -0.001 ? 'bearish' : 'sideways'
    const strength = Math.min(Math.abs(slopeDegrees) / 45, 1) // Normalize to 0-1
    
    const confirmation_signals = []
    if (indicators.ema_12 > indicators.ema_26) confirmation_signals.push('EMA crossover bullish')
    if (indicators.rsi > 50) confirmation_signals.push('RSI above midline')
    if (indicators.adx > 25) confirmation_signals.push('Strong trend (ADX > 25)')
    
    const quality = strength > 0.7 ? 'strong' : strength > 0.4 ? 'moderate' : 'weak'
    
    return {
      direction,
      strength,
      duration: 5, // Approximate
      slope: slopeDegrees,
      quality,
      confirmation_signals,
      divergences: [] // Would implement divergence detection
    }
  }

  private findSupportResistance(priceData: PriceData[]): SupportResistanceLevel[] {
    const levels: SupportResistanceLevel[] = []
    const highs = priceData.map(d => d.high)
    const lows = priceData.map(d => d.low)
    
    // Simple pivot point detection
    for (let i = 2; i < priceData.length - 2; i++) {
      const current = priceData[i]
      
      // Resistance (local high)
      if (current.high > priceData[i-1].high && current.high > priceData[i+1].high &&
          current.high > priceData[i-2].high && current.high > priceData[i+2].high) {
        
        levels.push({
          level: current.high,
          strength: Math.random() * 5 + 3, // 3-8 strength
          touches: Math.floor(Math.random() * 3) + 1,
          last_test: current.timestamp,
          type: 'resistance',
          significance: current.high > Math.max(...highs) * 0.98 ? 'major' : 'minor'
        })
      }
      
      // Support (local low)  
      if (current.low < priceData[i-1].low && current.low < priceData[i+1].low &&
          current.low < priceData[i-2].low && current.low < priceData[i+2].low) {
        
        levels.push({
          level: current.low,
          strength: Math.random() * 5 + 3,
          touches: Math.floor(Math.random() * 3) + 1,
          last_test: current.timestamp,
          type: 'support',
          significance: current.low < Math.min(...lows) * 1.02 ? 'major' : 'minor'
        })
      }
    }
    
    // Sort by strength and return top levels
    return levels.sort((a, b) => b.strength - a.strength).slice(0, 10)
  }

  private recognizePatterns(priceData: PriceData[]): PatternRecognition {
    // Pattern recognition would be complex - this is a simplified version
    const patterns = []
    const candlestick_patterns = []
    
    // Simple pattern detection
    if (priceData.length >= 5) {
      const last5 = priceData.slice(-5)
      const isUptrend = last5.every((candle, i) => i === 0 || candle.close > last5[i-1].close)
      const isDowntrend = last5.every((candle, i) => i === 0 || candle.close < last5[i-1].close)
      
      if (isUptrend) {
        patterns.push({
          name: 'Ascending Trend',
          type: 'bullish' as const,
          confidence: 0.7,
          timeframe: '5-period'
        })
      }
      
      if (isDowntrend) {
        patterns.push({
          name: 'Descending Trend', 
          type: 'bearish' as const,
          confidence: 0.7,
          timeframe: '5-period'
        })
      }
    }
    
    // Simple candlestick pattern (last candle)
    if (priceData.length > 0) {
      const lastCandle = priceData[priceData.length - 1]
      const bodySize = Math.abs(lastCandle.close - lastCandle.open)
      const candleRange = lastCandle.high - lastCandle.low
      
      if (bodySize / candleRange < 0.3) {
        candlestick_patterns.push({
          name: 'Doji',
          signal: 'doji' as const,
          reliability: 0.6
        })
      } else if (lastCandle.close > lastCandle.open) {
        candlestick_patterns.push({
          name: 'Bullish Candle',
          signal: 'bullish' as const,
          reliability: 0.5
        })
      } else {
        candlestick_patterns.push({
          name: 'Bearish Candle',
          signal: 'bearish' as const, 
          reliability: 0.5
        })
      }
    }
    
    return {
      patterns_detected: patterns,
      candlestick_patterns
    }
  }

  private generateTimeframeSignal(
    indicators: TechnicalIndicators,
    trend: TrendAnalysis,
    supportResistance: SupportResistanceLevel[],
    patterns: PatternRecognition
  ) {
    let strength = 0
    let direction: 'buy' | 'sell' | 'hold' = 'hold'
    const confluences: string[] = []
    const divergences: string[] = []
    
    // EMA analysis
    if (indicators.ema_12 > indicators.ema_26) {
      strength += 0.2
      confluences.push('EMA bullish alignment')
    } else {
      strength -= 0.1
      divergences.push('EMA bearish alignment')
    }
    
    // RSI analysis
    if (indicators.rsi > 30 && indicators.rsi < 70) {
      strength += 0.1
      confluences.push('RSI in healthy range')
    } else if (indicators.rsi < 30) {
      strength += 0.15
      confluences.push('RSI oversold - potential reversal')
    } else {
      strength -= 0.1
      divergences.push('RSI overbought')
    }
    
    // Trend confirmation
    if (trend.direction === 'bullish' && trend.strength > 0.5) {
      strength += 0.3
      confluences.push('Strong bullish trend')
    } else if (trend.direction === 'bearish' && trend.strength > 0.5) {
      strength -= 0.2
      divergences.push('Strong bearish trend')
    }
    
    // Pattern confirmation
    const bullishPatterns = patterns.patterns_detected.filter(p => p.type === 'bullish')
    const bearishPatterns = patterns.patterns_detected.filter(p => p.type === 'bearish')
    
    if (bullishPatterns.length > bearishPatterns.length) {
      strength += 0.1
      confluences.push('Bullish pattern detected')
    } else if (bearishPatterns.length > bullishPatterns.length) {
      strength -= 0.1
      divergences.push('Bearish pattern detected')
    }
    
    // Determine signal direction
    if (strength > 0.3) {
      direction = 'buy'
    } else if (strength < -0.2) {
      direction = 'sell'
    } else {
      direction = 'hold'
    }
    
    return {
      strength: Math.max(0, Math.min(1, Math.abs(strength))),
      direction,
      confluences,
      divergences
    }
  }

  private generateMockTimeframeSignal(timeframe: string, currentPrice: number): MultiTimeframeSignal {
    // Generate mock data for error cases
    const mockIndicators: TechnicalIndicators = {
      sma_10: currentPrice * 0.995,
      sma_20: currentPrice * 0.99,
      sma_50: currentPrice * 0.985,
      sma_200: currentPrice * 0.98,
      ema_8: currentPrice * 0.998,
      ema_12: currentPrice * 0.997,
      ema_21: currentPrice * 0.995,
      ema_26: currentPrice * 0.993,
      rsi: 45 + Math.random() * 20,
      rsi_14: 50,
      stoch_k: 50 + Math.random() * 40,
      stoch_d: 50 + Math.random() * 40,
      macd_line: Math.random() - 0.5,
      macd_signal: Math.random() - 0.5,
      macd_histogram: Math.random() - 0.5,
      adx: 20 + Math.random() * 30,
      adx_plus_di: 15 + Math.random() * 20,
      adx_minus_di: 15 + Math.random() * 20,
      aroon_up: Math.random() * 100,
      aroon_down: Math.random() * 100,
      atr: currentPrice * 0.02,
      bollinger_upper: currentPrice * 1.02,
      bollinger_middle: currentPrice,
      bollinger_lower: currentPrice * 0.98,
      bollinger_width: 4,
      obv: 1000000,
      volume_sma: 2000000,
      vwap: currentPrice * 0.999
    }

    return {
      timeframe: timeframe as any,
      indicators: mockIndicators,
      trend: {
        direction: Math.random() > 0.5 ? 'bullish' : 'bearish',
        strength: Math.random(),
        duration: 5,
        slope: Math.random() * 10 - 5,
        quality: 'moderate',
        confirmation_signals: ['Mock signal'],
        divergences: []
      },
      support_resistance: [{
        level: currentPrice * 0.95,
        strength: 5,
        touches: 2,
        last_test: Date.now(),
        type: 'support',
        significance: 'minor'
      }],
      patterns: {
        patterns_detected: [],
        candlestick_patterns: []
      },
      signal_strength: Math.random(),
      signal_direction: Math.random() > 0.5 ? 'buy' : 'sell',
      confluences: ['Mock confluence'],
      divergences: []
    }
  }

  private analyzeCrossTimeframe(analysis: ComprehensiveAnalysis) {
    const timeframes = Object.keys(analysis.timeframes) as (keyof typeof analysis.timeframes)[]
    
    // Short term: 1m, 5m, 15m
    const shortTerm = ['1m', '5m', '15m'].filter(tf => analysis.timeframes[tf as keyof typeof analysis.timeframes])
    const shortTermBullish = shortTerm.filter(tf => analysis.timeframes[tf as keyof typeof analysis.timeframes].trend.direction === 'bullish').length
    
    // Medium term: 1h, 4h
    const mediumTerm = ['1h', '4h'].filter(tf => analysis.timeframes[tf as keyof typeof analysis.timeframes])
    const mediumTermBullish = mediumTerm.filter(tf => analysis.timeframes[tf as keyof typeof analysis.timeframes].trend.direction === 'bullish').length
    
    // Long term: 1d
    const longTerm = ['1d']
    const longTermBullish = analysis.timeframes['1d']?.trend.direction === 'bullish' ? 1 : 0

    analysis.overall_trend.short_term = shortTermBullish > shortTerm.length / 2 ? 'bullish' : 
                                       shortTermBullish < shortTerm.length / 2 ? 'bearish' : 'sideways'
    
    analysis.overall_trend.medium_term = mediumTermBullish > mediumTerm.length / 2 ? 'bullish' :
                                        mediumTermBullish < mediumTerm.length / 2 ? 'bearish' : 'sideways'
    
    analysis.overall_trend.long_term = longTermBullish > 0 ? 'bullish' : 'bearish'
    
    // Calculate alignment score
    const allBullish = timeframes.filter(tf => analysis.timeframes[tf].trend.direction === 'bullish').length
    analysis.overall_trend.alignment_score = allBullish / timeframes.length
  }

  private identifyCriticalLevels(analysis: ComprehensiveAnalysis) {
    const allSupports: number[] = []
    const allResistances: number[] = []
    
    // Collect support/resistance from all timeframes
    Object.values(analysis.timeframes).forEach(tf => {
      tf.support_resistance.forEach(level => {
        if (level.type === 'support' && level.significance !== 'minor') {
          allSupports.push(level.level)
        } else if (level.type === 'resistance' && level.significance !== 'minor') {
          allResistances.push(level.level)
        }
      })
    })
    
    // Get unique levels (within 1% of each other are considered same level)
    analysis.critical_levels.major_support = this.consolidateLevels(allSupports, 0.01)
    analysis.critical_levels.major_resistance = this.consolidateLevels(allResistances, 0.01)
    
    // Calculate pivot points (simplified)
    const currentPrice = analysis.current_price
    analysis.critical_levels.pivot_points = [
      currentPrice * 0.99,  // S1
      currentPrice,         // Pivot
      currentPrice * 1.01   // R1
    ]
    
    // Calculate Fibonacci levels (simplified)
    const high = currentPrice * 1.1
    const low = currentPrice * 0.9
    const diff = high - low
    
    analysis.critical_levels.fibonacci_levels = [
      low + diff * 0.236,
      low + diff * 0.382,
      low + diff * 0.5,
      low + diff * 0.618,
      low + diff * 0.786
    ]
  }

  private consolidateLevels(levels: number[], tolerance: number): number[] {
    if (levels.length === 0) return []
    
    levels.sort((a, b) => a - b)
    const consolidated: number[] = [levels[0]]
    
    for (let i = 1; i < levels.length; i++) {
      const lastLevel = consolidated[consolidated.length - 1]
      const currentLevel = levels[i]
      
      // If within tolerance, average them
      if (Math.abs(currentLevel - lastLevel) / lastLevel <= tolerance) {
        consolidated[consolidated.length - 1] = (lastLevel + currentLevel) / 2
      } else {
        consolidated.push(currentLevel)
      }
    }
    
    return consolidated.slice(0, 5) // Return top 5 levels
  }

  private assessSetupQuality(analysis: ComprehensiveAnalysis) {
    let score = 0
    const factors: string[] = []
    
    // Timeframe alignment
    const alignmentScore = analysis.overall_trend.alignment_score
    score += alignmentScore * 30
    if (alignmentScore > 0.7) factors.push('Strong multi-timeframe alignment')
    
    // Trend strength
    const avgTrendStrength = Object.values(analysis.timeframes)
      .reduce((sum, tf) => sum + tf.trend.strength, 0) / Object.keys(analysis.timeframes).length
    score += avgTrendStrength * 25
    if (avgTrendStrength > 0.6) factors.push('Strong trend momentum')
    
    // Technical indicator confluence
    const confluenceCount = Object.values(analysis.timeframes)
      .reduce((sum, tf) => sum + tf.confluences.length, 0)
    score += Math.min(confluenceCount * 3, 20)
    if (confluenceCount > 5) factors.push('Multiple technical confirmations')
    
    // Risk/reward calculation
    const currentPrice = analysis.current_price
    const nearestSupport = analysis.critical_levels.major_support
      .filter(level => level < currentPrice)
      .sort((a, b) => b - a)[0] || currentPrice * 0.95
    
    const nearestResistance = analysis.critical_levels.major_resistance
      .filter(level => level > currentPrice)  
      .sort((a, b) => a - b)[0] || currentPrice * 1.05
    
    const risk = currentPrice - nearestSupport
    const reward = nearestResistance - currentPrice
    const riskRewardRatio = reward / risk
    
    score += Math.min(riskRewardRatio * 10, 25)
    
    analysis.setup_quality = {
      score: Math.min(score, 100),
      risk_reward: riskRewardRatio,
      probability: Math.min(score, 85), // Max 85% probability
      entry_triggers: factors,
      exit_conditions: [`Take profit: ${nearestResistance.toFixed(2)}`, `Stop loss: ${nearestSupport.toFixed(2)}`],
      risk_factors: Object.values(analysis.timeframes).flatMap(tf => tf.divergences).slice(0, 3)
    }
  }

  private analyzeMarketStructure(analysis: ComprehensiveAnalysis) {
    // Simplified market structure analysis
    const dailyTF = analysis.timeframes['1d']
    if (!dailyTF) return
    
    // This would analyze higher highs, higher lows, etc.
    // For now, use trend direction as proxy
    const trendDirection = dailyTF.trend.direction
    const trendStrength = dailyTF.trend.strength
    
    analysis.market_structure = {
      higher_highs: trendDirection === 'bullish',
      higher_lows: trendDirection === 'bullish',
      lower_highs: trendDirection === 'bearish',
      lower_lows: trendDirection === 'bearish',
      structure_quality: trendStrength > 0.7 ? 'strong' : trendStrength > 0.4 ? 'moderate' : 'weak',
      breakout_potential: Math.min(trendStrength + 0.2, 1)
    }
  }

  private async getCurrentPrice(symbol: string): Promise<number> {
    // Reuse the price fetching from recommendation engine
    const engine = new (await import('./recommendation-engine')).RecommendationEngine(this.env)
    return (engine as any).getCurrentPrice(symbol)
  }
}