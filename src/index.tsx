import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
// import { jwt } from 'hono/jwt'  // We'll implement basic auth instead
import { serveStatic } from 'hono/cloudflare-workers'
import type { Bindings, Variables } from './types'

// Route imports
import { authRoutes } from './routes/auth'
import { userRoutes } from './routes/users'
import { portfolioRoutes } from './routes/portfolios'
import { newsRoutes } from './routes/news'
import { recommendationRoutes } from './routes/recommendations'
import { marketRoutes } from './routes/market'
import advancedApiRoutes from './routes/advanced-api'
import schedulerApiRoutes from './routes/scheduler-api'
import { initializeDatabase } from './database'

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>()

// Middleware
app.use('*', logger())
app.use('/api/*', cors({
  origin: ['http://localhost:3000', 'https://*.pages.dev'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}))

// Serve static files
app.use('/static/*', serveStatic({ root: './public' }))

// Public routes (no auth required)
app.route('/auth', authRoutes)

// Protected routes (auth required) - simplified for now
app.use('/api/*', async (c, next) => {
  // For now, we'll implement basic auth checking in individual routes
  // TODO: Add proper JWT middleware
  await next()
})

app.route('/api/users', userRoutes)
app.route('/api/portfolios', portfolioRoutes)
app.route('/api/news', newsRoutes)
app.route('/api/recommendations', recommendationRoutes)
app.route('/api/market', marketRoutes)
app.route('/api/advanced', advancedApiRoutes)
app.route('/api/scheduler', schedulerApiRoutes)

// Main application route
app.get('/', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Real-Time Trader Advisor</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <link rel="manifest" href="/static/manifest.json">
        <link rel="icon" type="image/x-icon" href="/static/favicon.ico">
    </head>
    <body class="bg-gray-50 min-h-screen">
        <div id="app" class="min-h-screen">
            <!-- Loading screen -->
            <div class="flex items-center justify-center min-h-screen">
                <div class="text-center">
                    <i class="fas fa-chart-line text-6xl text-blue-600 mb-4"></i>
                    <h1 class="text-4xl font-bold text-gray-800 mb-2">Trader Advisor</h1>
                    <p class="text-gray-600 mb-6">Real-time market intelligence</p>
                    <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                </div>
            </div>
        </div>
        
        <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
        <script src="/static/advanced-app.js"></script>
    </body>
    </html>
  `)
})

// Health check and database initialization
app.get('/api/health', async (c) => {
  // Initialize database on first request
  if (c.env.DB) {
    await initializeDatabase(c.env.DB)
  }
  
  return c.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    database: c.env.DB ? 'connected' : 'not available'
  })
})

export default app
