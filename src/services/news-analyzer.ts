// News fetching and analysis service
import type { Bindings } from '../types'

interface NewsAPIResponse {
  status: string
  totalResults: number
  articles: Array<{
    title: string
    description: string
    url: string
    urlToImage: string
    publishedAt: string
    source: { name: string }
    author?: string
  }>
}

interface OpenAIResponse {
  choices: Array<{
    message: {
      content: string
    }
  }>
}

interface NewsAnalysis {
  sponsored: boolean
  confidence: number
  relevance: number
  sentiment: -1 | 0 | 1
  rationale: string
  ticker?: string
}

export class NewsAnalyzer {
  constructor(private env: Bindings) {}

  async fetchLatestNews(query: string = 'stock market'): Promise<any[]> {
    if (!this.env.NEWS_API_KEY) {
      console.log('NEWS_API_KEY not configured, using mock data')
      return this.getMockNews()
    }

    try {
      const url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&sortBy=publishedAt&language=en&pageSize=20`
      
      const response = await fetch(url, {
        headers: {
          'X-API-Key': this.env.NEWS_API_KEY
        }
      })

      if (!response.ok) {
        throw new Error(`NewsAPI error: ${response.status}`)
      }

      const data: NewsAPIResponse = await response.json()
      return data.articles || []
      
    } catch (error) {
      console.error('News fetch error:', error)
      return this.getMockNews()
    }
  }

  async analyzeNewsWithOpenAI(title: string, description: string, url: string): Promise<NewsAnalysis> {
    if (!this.env.OPENAI_API_KEY) {
      console.log('OPENAI_API_KEY not configured, using mock analysis')
      return this.getMockAnalysis(title)
    }

    try {
      const prompt = `Analyze this financial news article for trading relevance:

Title: "${title}"
Description: "${description}"
URL: ${url}

Please respond with a JSON object containing:
1. "sponsored": boolean (true if this is sponsored/advertorial content)
2. "confidence": number 0-1 (confidence in the analysis)
3. "relevance": number 0-1 (how relevant this is for stock trading)
4. "sentiment": -1, 0, or 1 (negative, neutral, positive market sentiment)
5. "rationale": string (brief explanation of the analysis)
6. "ticker": string or null (stock ticker symbol if mentioned, e.g., "AAPL")

Focus on:
- Is this genuine news or sponsored content?
- Does this affect stock prices?
- What's the market sentiment?
- Which specific stocks are mentioned?

Respond only with valid JSON.`

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: 'You are a financial news analyst. Respond only with valid JSON.' },
            { role: 'user', content: prompt }
          ],
          max_tokens: 300,
          temperature: 0.3
        })
      })

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`)
      }

      const data: OpenAIResponse = await response.json()
      const content = data.choices[0]?.message?.content

      if (!content) {
        throw new Error('No response from OpenAI')
      }

      // Parse JSON response
      const analysis = JSON.parse(content.trim())
      
      // Validate response structure
      return {
        sponsored: analysis.sponsored || false,
        confidence: Math.max(0, Math.min(1, analysis.confidence || 0.5)),
        relevance: Math.max(0, Math.min(1, analysis.relevance || 0.5)),
        sentiment: [-1, 0, 1].includes(analysis.sentiment) ? analysis.sentiment : 0,
        rationale: analysis.rationale || 'Analysis completed',
        ticker: analysis.ticker || null
      }

    } catch (error) {
      console.error('OpenAI analysis error:', error)
      return this.getMockAnalysis(title)
    }
  }

  async processAndStoreNews(db: any): Promise<number> {
    console.log('Starting news processing pipeline...')
    
    // Fetch latest news
    const articles = await this.fetchLatestNews('Apple OR Microsoft OR Tesla OR NVIDIA OR stock market')
    console.log(`Fetched ${articles.length} articles`)

    let processedCount = 0

    for (const article of articles.slice(0, 5)) { // Process first 5 articles
      try {
        // Check if article already exists
        const existing = await db.prepare(
          'SELECT id FROM news_items WHERE url = ?'
        ).bind(article.url).first()

        if (existing) {
          continue // Skip if already processed
        }

        // Analyze with OpenAI
        const analysis = await this.analyzeNewsWithOpenAI(
          article.title,
          article.description || '',
          article.url
        )

        // Skip sponsored content
        if (analysis.sponsored) {
          console.log(`Skipping sponsored content: ${article.title}`)
          continue
        }

        // Find ticker if mentioned
        let tickerId = null
        if (analysis.ticker) {
          const ticker = await db.prepare(
            'SELECT id FROM tickers WHERE symbol = ?'
          ).bind(analysis.ticker.toUpperCase()).first()
          
          if (ticker) {
            tickerId = ticker.id
          }
        }

        // Store news item
        const newsId = 'news-' + Math.random().toString(36).substr(2, 9)
        const hash = btoa(article.url).replace(/[^a-zA-Z0-9]/g, '').substr(0, 16)

        await db.prepare(`
          INSERT INTO news_items (
            id, ticker_id, source, title, description, url, author,
            published_at, sentiment, relevance, is_sponsored, hash,
            processed_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        `).bind(
          newsId,
          tickerId,
          article.source?.name || 'NewsAPI',
          article.title,
          article.description,
          article.url,
          article.author,
          article.publishedAt,
          analysis.sentiment,
          analysis.relevance,
          analysis.sponsored,
          hash
        ).run()

        processedCount++
        console.log(`Processed: ${article.title} (sentiment: ${analysis.sentiment}, relevance: ${analysis.relevance})`)

      } catch (error) {
        console.error(`Error processing article "${article.title}":`, error)
      }
    }

    console.log(`News processing complete: ${processedCount} articles processed`)
    return processedCount
  }

  private getMockNews() {
    return [
      {
        title: "Apple Reports Strong Q4 Earnings Beat",
        description: "Apple Inc. exceeded analyst expectations with iPhone sales growth and services revenue expansion.",
        url: "https://example.com/apple-earnings-q4-2024",
        source: { name: "Mock Financial News" },
        publishedAt: new Date().toISOString(),
        author: "Mock Reporter"
      },
      {
        title: "Tesla Announces New Gigafactory in Texas",
        description: "Tesla reveals plans for expanded manufacturing capacity to meet growing EV demand.",
        url: "https://example.com/tesla-gigafactory-texas-2024",
        source: { name: "Mock Tech News" },
        publishedAt: new Date(Date.now() - 3600000).toISOString(),
        author: "Tech Correspondent"
      },
      {
        title: "Microsoft Cloud Revenue Surges 25%",
        description: "Microsoft's Azure and Office 365 drive strong quarterly performance.",
        url: "https://example.com/microsoft-cloud-growth-2024",
        source: { name: "Mock Business Wire" },
        publishedAt: new Date(Date.now() - 7200000).toISOString(),
        author: "Business Reporter"
      }
    ]
  }

  private getMockAnalysis(title: string): NewsAnalysis {
    // Generate realistic mock analysis based on title
    const isPositive = title.includes('beat') || title.includes('surge') || title.includes('growth') || title.includes('strong')
    const isNegative = title.includes('drop') || title.includes('fall') || title.includes('concern') || title.includes('down')
    
    let sentiment: -1 | 0 | 1 = 0
    if (isPositive) sentiment = 1
    if (isNegative) sentiment = -1

    let ticker: string | null = null
    if (title.toUpperCase().includes('APPLE') || title.toUpperCase().includes('AAPL')) ticker = 'AAPL'
    if (title.toUpperCase().includes('TESLA') || title.toUpperCase().includes('TSLA')) ticker = 'TSLA'
    if (title.toUpperCase().includes('MICROSOFT') || title.toUpperCase().includes('MSFT')) ticker = 'MSFT'
    if (title.toUpperCase().includes('NVIDIA') || title.toUpperCase().includes('NVDA')) ticker = 'NVDA'

    return {
      sponsored: false,
      confidence: 0.85,
      relevance: ticker ? 0.9 : 0.6,
      sentiment,
      rationale: `Mock analysis: ${sentiment === 1 ? 'Positive' : sentiment === -1 ? 'Negative' : 'Neutral'} sentiment detected based on title keywords`,
      ticker
    }
  }
}