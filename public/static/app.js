// Real-Time Trader Advisor Frontend Application
class TraderApp {
  constructor() {
    this.currentUser = null
    this.currentPage = 'dashboard'
    this.recommendations = []
    this.portfolios = []
    this.init()
  }

  async init() {
    console.log('Initializing Trader Advisor App...')
    
    // Check authentication
    await this.checkAuth()
    
    // Setup navigation
    this.setupNavigation()
    
    // Setup periodic updates
    this.startPeriodicUpdates()
    
    console.log('App initialized successfully')
  }

  async checkAuth() {
    try {
      const response = await axios.get('/auth/me')
      if (response.data.success) {
        this.currentUser = response.data.data
        this.showMainApp()
      } else {
        this.showLoginForm()
      }
    } catch (error) {
      console.log('Not authenticated, showing login')
      this.showLoginForm()
    }
  }

  showLoginForm() {
    document.getElementById('app').innerHTML = `
      <div class="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div class="max-w-md w-full space-y-8">
          <div class="text-center">
            <i class="fas fa-chart-line text-6xl text-blue-600 mb-4"></i>
            <h2 class="text-3xl font-extrabold text-gray-900">Trader Advisor</h2>
            <p class="mt-2 text-gray-600">Sign in to your account</p>
          </div>
          
          <div id="auth-error" class="hidden bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded"></div>
          
          <form id="login-form" class="mt-8 space-y-6">
            <div class="rounded-md shadow-sm -space-y-px">
              <input type="email" id="email" required 
                class="relative block w-full px-3 py-2 border border-gray-300 rounded-t-md placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Email address">
              <input type="password" id="password" required
                class="relative block w-full px-3 py-2 border border-gray-300 rounded-b-md placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Password">
            </div>
            
            <div>
              <button type="submit" 
                class="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                <i class="fas fa-sign-in-alt mr-2"></i>
                Sign In
              </button>
            </div>
            
            <div class="text-center">
              <button type="button" id="show-register" class="text-blue-600 hover:text-blue-500 text-sm">
                Need an account? Register here
              </button>
            </div>
          </form>
          
          <div id="register-form" class="hidden mt-8 space-y-6">
            <div class="rounded-md shadow-sm -space-y-px">
              <input type="text" id="reg-name" required 
                class="relative block w-full px-3 py-2 border border-gray-300 rounded-t-md placeholder-gray-500 text-gray-900"
                placeholder="Full Name">
              <input type="email" id="reg-email" required 
                class="relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900"
                placeholder="Email address">
              <input type="password" id="reg-password" required
                class="relative block w-full px-3 py-2 border border-gray-300 rounded-b-md placeholder-gray-500 text-gray-900"
                placeholder="Password">
            </div>
            
            <div>
              <button type="submit" 
                class="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700">
                <i class="fas fa-user-plus mr-2"></i>
                Register
              </button>
            </div>
            
            <div class="text-center">
              <button type="button" id="show-login" class="text-blue-600 hover:text-blue-500 text-sm">
                Already have an account? Sign in
              </button>
            </div>
          </div>
        </div>
      </div>
    `

    // Setup form handlers
    this.setupAuthForms()
  }

  setupAuthForms() {
    const loginForm = document.getElementById('login-form')
    const registerForm = document.getElementById('register-form')
    const showRegister = document.getElementById('show-register')
    const showLogin = document.getElementById('show-login')

    showRegister?.addEventListener('click', () => {
      loginForm.classList.add('hidden')
      registerForm.classList.remove('hidden')
    })

    showLogin?.addEventListener('click', () => {
      registerForm.classList.add('hidden')
      loginForm.classList.remove('hidden')
    })

    loginForm?.addEventListener('submit', async (e) => {
      e.preventDefault()
      await this.handleLogin()
    })

    registerForm?.addEventListener('submit', async (e) => {
      e.preventDefault()
      await this.handleRegister()
    })
  }

  async handleLogin() {
    const email = document.getElementById('email').value
    const password = document.getElementById('password').value
    const errorDiv = document.getElementById('auth-error')

    try {
      const response = await axios.post('/auth/login', { email, password })
      
      if (response.data.success) {
        this.currentUser = response.data.data.user
        this.showMainApp()
      } else {
        this.showError(response.data.error)
      }
    } catch (error) {
      this.showError(error.response?.data?.error || 'Login failed')
    }
  }

  async handleRegister() {
    const name = document.getElementById('reg-name').value
    const email = document.getElementById('reg-email').value
    const password = document.getElementById('reg-password').value

    try {
      const response = await axios.post('/auth/register', { name, email, password })
      
      if (response.data.success) {
        // Auto-login after registration
        await this.handleLogin()
      } else {
        this.showError(response.data.error)
      }
    } catch (error) {
      this.showError(error.response?.data?.error || 'Registration failed')
    }
  }

  showError(message) {
    const errorDiv = document.getElementById('auth-error')
    if (errorDiv) {
      errorDiv.textContent = message
      errorDiv.classList.remove('hidden')
    }
  }

  showMainApp() {
    document.getElementById('app').innerHTML = `
      <div class="min-h-screen bg-gray-50">
        <!-- Top Navigation -->
        <nav class="bg-white shadow-sm border-b">
          <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="flex justify-between items-center h-16">
              <div class="flex items-center">
                <i class="fas fa-chart-line text-2xl text-blue-600 mr-3"></i>
                <h1 class="text-xl font-bold text-gray-900">Trader Advisor</h1>
              </div>
              <div class="flex items-center space-x-4">
                <span class="text-sm text-gray-600">Welcome, ${this.currentUser?.name}</span>
                <button id="logout-btn" class="text-sm text-red-600 hover:text-red-800">
                  <i class="fas fa-sign-out-alt mr-1"></i>
                  Logout
                </button>
              </div>
            </div>
          </div>
        </nav>

        <!-- Main Content -->
        <div class="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8 pb-20 md:pb-6">
          <!-- Page Content -->
          <div id="page-content">
            <!-- Content will be loaded here -->
          </div>
        </div>

        <!-- Bottom Navigation (Mobile-First) -->
        <nav class="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 md:hidden">
          <div class="grid grid-cols-4 gap-1">
            <button class="nav-btn flex flex-col items-center py-2 px-1 text-xs" data-page="dashboard">
              <i class="fas fa-home text-lg mb-1"></i>
              <span>Dashboard</span>
            </button>
            <button class="nav-btn flex flex-col items-center py-2 px-1 text-xs" data-page="recommendations">
              <i class="fas fa-bullseye text-lg mb-1"></i>
              <span>Recs</span>
            </button>
            <button class="nav-btn flex flex-col items-center py-2 px-1 text-xs" data-page="portfolio">
              <i class="fas fa-briefcase text-lg mb-1"></i>
              <span>Portfolio</span>
            </button>
            <button class="nav-btn flex flex-col items-center py-2 px-1 text-xs" data-page="settings">
              <i class="fas fa-cog text-lg mb-1"></i>
              <span>Settings</span>
            </button>
          </div>
        </nav>

        <!-- Desktop Navigation Sidebar -->
        <div class="hidden md:fixed md:inset-y-0 md:left-0 md:w-64 md:bg-white md:border-r md:border-gray-200">
          <div class="flex flex-col h-full pt-20">
            <nav class="flex-1 px-4 space-y-2">
              <button class="nav-btn w-full flex items-center px-4 py-2 text-sm rounded-md" data-page="dashboard">
                <i class="fas fa-home mr-3"></i>
                Dashboard
              </button>
              <button class="nav-btn w-full flex items-center px-4 py-2 text-sm rounded-md" data-page="recommendations">
                <i class="fas fa-bullseye mr-3"></i>
                Recommendations
              </button>
              <button class="nav-btn w-full flex items-center px-4 py-2 text-sm rounded-md" data-page="portfolio">
                <i class="fas fa-briefcase mr-3"></i>
                Portfolio
              </button>
              <button class="nav-btn w-full flex items-center px-4 py-2 text-sm rounded-md" data-page="settings">
                <i class="fas fa-cog mr-3"></i>
                Settings
              </button>
            </nav>
          </div>
        </div>
      </div>
    `

    // Setup navigation and load initial data
    this.setupNavigation()
    this.loadPage('dashboard')
    
    // Setup logout handler
    document.getElementById('logout-btn')?.addEventListener('click', this.handleLogout.bind(this))
  }

  setupNavigation() {
    document.querySelectorAll('.nav-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const page = btn.dataset.page
        this.loadPage(page)
      })
    })
  }

  async loadPage(page) {
    this.currentPage = page
    
    // Update active navigation
    document.querySelectorAll('.nav-btn').forEach(btn => {
      if (btn.dataset.page === page) {
        btn.classList.add('text-blue-600', 'bg-blue-50')
      } else {
        btn.classList.remove('text-blue-600', 'bg-blue-50')
      }
    })

    // Load page content
    const contentDiv = document.getElementById('page-content')
    
    switch (page) {
      case 'dashboard':
        await this.loadDashboard()
        break
      case 'recommendations':
        await this.loadRecommendations()
        break
      case 'portfolio':
        await this.loadPortfolio()
        break
      case 'settings':
        this.loadSettings()
        break
      default:
        contentDiv.innerHTML = '<div class="text-center py-12">Page not found</div>'
    }
  }

  async loadDashboard() {
    const contentDiv = document.getElementById('page-content')
    contentDiv.innerHTML = `
      <div class="space-y-6">
        <div class="md:ml-64">
          <h2 class="text-2xl font-bold text-gray-900 mb-6">Dashboard</h2>
          
          <!-- Stats Cards -->
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div class="bg-white overflow-hidden shadow rounded-lg">
              <div class="p-5">
                <div class="flex items-center">
                  <div class="flex-shrink-0">
                    <i class="fas fa-bullseye text-2xl text-blue-600"></i>
                  </div>
                  <div class="ml-5 w-0 flex-1">
                    <dl>
                      <dt class="text-sm font-medium text-gray-500 truncate">Active Recommendations</dt>
                      <dd class="text-lg font-medium text-gray-900" id="active-recs">-</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
            
            <div class="bg-white overflow-hidden shadow rounded-lg">
              <div class="p-5">
                <div class="flex items-center">
                  <div class="flex-shrink-0">
                    <i class="fas fa-chart-line text-2xl text-green-600"></i>
                  </div>
                  <div class="ml-5 w-0 flex-1">
                    <dl>
                      <dt class="text-sm font-medium text-gray-500 truncate">Portfolio Value</dt>
                      <dd class="text-lg font-medium text-gray-900" id="portfolio-value">$50,000</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
            
            <div class="bg-white overflow-hidden shadow rounded-lg">
              <div class="p-5">
                <div class="flex items-center">
                  <div class="flex-shrink-0">
                    <i class="fas fa-newspaper text-2xl text-yellow-600"></i>
                  </div>
                  <div class="ml-5 w-0 flex-1">
                    <dl>
                      <dt class="text-sm font-medium text-gray-500 truncate">News Items Today</dt>
                      <dd class="text-lg font-medium text-gray-900" id="news-count">-</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
            
            <div class="bg-white overflow-hidden shadow rounded-lg">
              <div class="p-5">
                <div class="flex items-center">
                  <div class="flex-shrink-0">
                    <i class="fas fa-clock text-2xl text-purple-600"></i>
                  </div>
                  <div class="ml-5 w-0 flex-1">
                    <dl>
                      <dt class="text-sm font-medium text-gray-500 truncate">Last Update</dt>
                      <dd class="text-lg font-medium text-gray-900" id="last-update">Just now</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Recent Recommendations -->
          <div class="bg-white shadow overflow-hidden sm:rounded-md mb-6">
            <div class="px-4 py-5 sm:px-6 border-b border-gray-200">
              <div class="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
                <div>
                  <h3 class="text-lg leading-6 font-medium text-gray-900">Recent Recommendations</h3>
                  <p class="mt-1 max-w-2xl text-sm text-gray-500">Latest trading recommendations for your portfolios</p>
                </div>
                <!-- Advanced AI Features Grid -->
                <div class="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 mb-4">
                  <button id="generate-ai-recs" onclick="app.generateAdvancedAIRecommendations()" 
                    class="flex flex-col items-center justify-center p-3 border border-purple-300 shadow-sm text-xs font-medium rounded-md text-purple-700 bg-white hover:bg-purple-50 transition-colors">
                    <i class="fas fa-brain text-lg mb-1"></i>
                    <span class="text-center">Advanced AI</span>
                  </button>
                  
                  <button onclick="app.showTechnicalAnalysis()" 
                    class="flex flex-col items-center justify-center p-3 border border-blue-300 shadow-sm text-xs font-medium rounded-md text-blue-700 bg-white hover:bg-blue-50 transition-colors">
                    <i class="fas fa-chart-line text-lg mb-1"></i>
                    <span class="text-center">Technical</span>
                  </button>
                  
                  <button onclick="app.showPortfolioOverview()" 
                    class="flex flex-col items-center justify-center p-3 border border-green-300 shadow-sm text-xs font-medium rounded-md text-green-700 bg-white hover:bg-green-50 transition-colors">
                    <i class="fas fa-briefcase text-lg mb-1"></i>
                    <span class="text-center">Portfolio</span>
                  </button>
                  
                  <button onclick="app.showRiskManagement()" 
                    class="flex flex-col items-center justify-center p-3 border border-red-300 shadow-sm text-xs font-medium rounded-md text-red-700 bg-white hover:bg-red-50 transition-colors">
                    <i class="fas fa-shield-alt text-lg mb-1"></i>
                    <span class="text-center">Risk Mgmt</span>
                  </button>
                  
                  <button onclick="app.showMarketRegime()" 
                    class="flex flex-col items-center justify-center p-3 border border-yellow-300 shadow-sm text-xs font-medium rounded-md text-yellow-700 bg-white hover:bg-yellow-50 transition-colors">
                    <i class="fas fa-globe text-lg mb-1"></i>
                    <span class="text-center">Market</span>
                  </button>
                  
                  <button onclick="app.analyzeNews()" 
                    class="flex flex-col items-center justify-center p-3 border border-teal-300 shadow-sm text-xs font-medium rounded-md text-teal-700 bg-white hover:bg-teal-50 transition-colors">
                    <i class="fas fa-newspaper text-lg mb-1"></i>
                    <span class="text-center">News</span>
                  </button>
                  
                  <button onclick="app.showPositionSizing()" 
                    class="flex flex-col items-center justify-center p-3 border border-pink-300 shadow-sm text-xs font-medium rounded-md text-pink-700 bg-white hover:bg-pink-50 transition-colors">
                    <i class="fas fa-calculator text-lg mb-1"></i>
                    <span class="text-center">Position</span>
                  </button>
                  
                  <button onclick="app.generateRecommendations()" 
                    class="flex flex-col items-center justify-center p-3 border border-indigo-300 shadow-sm text-xs font-medium rounded-md text-indigo-700 bg-white hover:bg-indigo-50 transition-colors">
                    <i class="fas fa-lightbulb text-lg mb-1"></i>
                    <span class="text-center">Basic Recs</span>
                  </button>
                </div>
              </div>
            </div>
            <div id="recent-recommendations" class="border-t border-gray-200">
              <!-- Recommendations will be loaded here -->
            </div>
          </div>

          <!-- Market Overview -->
          <div class="bg-white shadow overflow-hidden sm:rounded-md">
            <div class="px-4 py-5 sm:px-6">
              <h3 class="text-lg leading-6 font-medium text-gray-900">Market Overview</h3>
              <p class="mt-1 max-w-2xl text-sm text-gray-500">Current market prices for your watchlist</p>
            </div>
            <div id="market-overview" class="border-t border-gray-200">
              <!-- Market data will be loaded here -->
            </div>
          </div>
        </div>
      </div>
    `
    
    // Load dashboard data
    await this.loadDashboardData()
  }

  async loadDashboardData() {
    try {
      // Load recommendations
      const recsResponse = await axios.get('/api/recommendations?limit=5')
      if (recsResponse.data.success) {
        this.recommendations = recsResponse.data.data
        document.getElementById('active-recs').textContent = this.recommendations.length
        this.renderRecentRecommendations()
      }

      // Load news count (mock for now)
      document.getElementById('news-count').textContent = '12'
      
      // Load market data
      this.loadMarketOverview()

    } catch (error) {
      console.error('Failed to load dashboard data:', error)
    }
  }

  renderRecentRecommendations() {
    const container = document.getElementById('recent-recommendations')
    
    if (this.recommendations.length === 0) {
      container.innerHTML = `
        <div class="px-4 py-5 sm:px-6 text-center text-gray-500">
          <i class="fas fa-info-circle text-2xl mb-2"></i>
          <p>No active recommendations</p>
        </div>
      `
      return
    }

    const html = this.recommendations.map(rec => `
      <div class="px-4 py-4 border-b border-gray-200 last:border-b-0">
        <div class="flex items-center justify-between">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${this.getRecTypeColor(rec.rec_type)}">
                ${rec.rec_type}
              </span>
            </div>
            <div class="ml-4">
              <div class="text-sm font-medium text-gray-900">${rec.symbol}</div>
              <div class="text-sm text-gray-500">${rec.company_name}</div>
            </div>
          </div>
          <div class="text-right">
            <div class="text-sm font-medium text-gray-900">
              ${rec.entry_price ? '$' + rec.entry_price.toFixed(2) : 'Market'}
            </div>
            <div class="text-sm text-gray-500">${this.formatTime(rec.created_at)}</div>
          </div>
        </div>
        ${rec.reason ? `<div class="mt-2 text-sm text-gray-600">${rec.reason}</div>` : ''}
      </div>
    `).join('')

    container.innerHTML = html
  }

  async loadMarketOverview() {
    const container = document.getElementById('market-overview')
    const symbols = ['AAPL', 'MSFT', 'GOOGL', 'TSLA', 'NVDA']
    
    try {
      const promises = symbols.map(symbol => 
        axios.get(`/api/market/price/${symbol}`)
      )
      
      const results = await Promise.all(promises)
      const prices = results.map(r => r.data.data)
      
      const html = prices.map(price => `
        <div class="px-4 py-4 border-b border-gray-200 last:border-b-0">
          <div class="flex items-center justify-between">
            <div class="text-sm font-medium text-gray-900">${price.symbol}</div>
            <div class="text-right">
              <div class="text-sm font-medium text-gray-900">$${price.price}</div>
              <div class="text-sm ${price.change >= 0 ? 'text-green-600' : 'text-red-600'}">
                ${price.change >= 0 ? '+' : ''}${price.change} (${price.change_percent.toFixed(2)}%)
              </div>
            </div>
          </div>
        </div>
      `).join('')
      
      container.innerHTML = html
      
    } catch (error) {
      container.innerHTML = `
        <div class="px-4 py-5 text-center text-gray-500">
          <p>Unable to load market data</p>
        </div>
      `
    }
  }

  async loadRecommendations() {
    const contentDiv = document.getElementById('page-content')
    contentDiv.innerHTML = `
      <div class="md:ml-64 space-y-6">
        <h2 class="text-2xl font-bold text-gray-900">Recommendations</h2>
        
        <div class="bg-white shadow overflow-hidden sm:rounded-md">
          <div class="px-4 py-5 sm:px-6 border-b border-gray-200">
            <h3 class="text-lg leading-6 font-medium text-gray-900">Active Recommendations</h3>
          </div>
          <div id="recommendations-list">
            <div class="px-4 py-5 text-center">
              <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p class="mt-2 text-gray-500">Loading recommendations...</p>
            </div>
          </div>
        </div>
      </div>
    `
    
    // Load recommendations data
    try {
      const response = await axios.get('/api/recommendations')
      if (response.data.success) {
        this.renderRecommendationsList(response.data.data)
      }
    } catch (error) {
      document.getElementById('recommendations-list').innerHTML = `
        <div class="px-4 py-5 text-center text-red-600">
          <p>Failed to load recommendations</p>
        </div>
      `
    }
  }

  renderRecommendationsList(recommendations) {
    const container = document.getElementById('recommendations-list')
    
    if (recommendations.length === 0) {
      container.innerHTML = `
        <div class="px-4 py-12 text-center text-gray-500">
          <i class="fas fa-bullseye text-4xl mb-4"></i>
          <p class="text-lg">No active recommendations</p>
          <p class="text-sm">We'll notify you when new opportunities arise</p>
        </div>
      `
      return
    }

    const html = recommendations.map(rec => `
      <div class="border-b border-gray-200 last:border-b-0">
        <div class="px-4 py-6">
          <div class="flex items-start justify-between">
            <div class="flex items-start space-x-3">
              <div class="flex-shrink-0">
                <span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${this.getRecTypeColor(rec.rec_type)}">
                  ${rec.rec_type.replace('_', ' ')}
                </span>
              </div>
              <div class="min-w-0 flex-1">
                <div class="text-lg font-medium text-gray-900">${rec.symbol}</div>
                <div class="text-sm text-gray-500 mb-2">${rec.company_name}</div>
                ${rec.reason ? `<div class="text-sm text-gray-700 mb-3">${rec.reason}</div>` : ''}
                
                <div class="grid grid-cols-2 gap-4 text-sm">
                  ${rec.entry_price ? `<div><span class="text-gray-500">Entry:</span> <span class="font-medium">$${rec.entry_price.toFixed(2)}</span></div>` : ''}
                  ${rec.take_profit ? `<div><span class="text-gray-500">Target:</span> <span class="font-medium text-green-600">$${rec.take_profit.toFixed(2)}</span></div>` : ''}
                  ${rec.stop_loss ? `<div><span class="text-gray-500">Stop:</span> <span class="font-medium text-red-600">$${rec.stop_loss.toFixed(2)}</span></div>` : ''}
                  ${rec.qty_suggested ? `<div><span class="text-gray-500">Qty:</span> <span class="font-medium">${rec.qty_suggested}</span></div>` : ''}
                </div>
              </div>
            </div>
            <div class="flex flex-col space-y-2">
              <button onclick="app.acknowledgeRecommendation('${rec.id}')" 
                class="inline-flex items-center px-3 py-1 border border-green-300 shadow-sm text-sm leading-4 font-medium rounded-md text-green-700 bg-white hover:bg-green-50">
                <i class="fas fa-check mr-1"></i>
                Acknowledge
              </button>
              <button onclick="app.dismissRecommendation('${rec.id}')" 
                class="inline-flex items-center px-3 py-1 border border-red-300 shadow-sm text-sm leading-4 font-medium rounded-md text-red-700 bg-white hover:bg-red-50">
                <i class="fas fa-times mr-1"></i>
                Dismiss
              </button>
            </div>
          </div>
          <div class="mt-3 text-xs text-gray-500">
            Created ${this.formatTime(rec.created_at)}
          </div>
        </div>
      </div>
    `).join('')

    container.innerHTML = html
  }

  async acknowledgeRecommendation(recId) {
    try {
      await axios.post(`/api/recommendations/${recId}/acknowledge`)
      this.loadRecommendations() // Reload page
    } catch (error) {
      console.error('Failed to acknowledge recommendation:', error)
    }
  }

  async dismissRecommendation(recId) {
    try {
      await axios.post(`/api/recommendations/${recId}/dismiss`)
      this.loadRecommendations() // Reload page
    } catch (error) {
      console.error('Failed to dismiss recommendation:', error)
    }
  }

  async loadPortfolio() {
    const contentDiv = document.getElementById('page-content')
    contentDiv.innerHTML = `
      <div class="md:ml-64 space-y-6">
        <h2 class="text-2xl font-bold text-gray-900">Portfolio</h2>
        
        <div class="bg-white shadow overflow-hidden sm:rounded-md">
          <div class="px-4 py-5 sm:px-6">
            <h3 class="text-lg leading-6 font-medium text-gray-900">Portfolio Overview</h3>
            <p class="mt-1 max-w-2xl text-sm text-gray-500">Your current holdings and watchlist</p>
          </div>
          <div class="border-t border-gray-200 px-4 py-5">
            <p class="text-gray-600">Portfolio functionality coming soon...</p>
            <p class="text-sm text-gray-500 mt-2">This will show your current positions, watchlist, and performance metrics.</p>
          </div>
        </div>
      </div>
    `
  }

  loadSettings() {
    const contentDiv = document.getElementById('page-content')
    contentDiv.innerHTML = `
      <div class="md:ml-64 space-y-6">
        <h2 class="text-2xl font-bold text-gray-900">Settings</h2>
        
        <div class="bg-white shadow overflow-hidden sm:rounded-lg">
          <div class="px-4 py-5 sm:px-6">
            <h3 class="text-lg leading-6 font-medium text-gray-900">Account Settings</h3>
          </div>
          <div class="border-t border-gray-200 px-4 py-5">
            <div class="space-y-4">
              <div>
                <label class="text-sm font-medium text-gray-700">Name</label>
                <p class="text-sm text-gray-900">${this.currentUser?.name}</p>
              </div>
              <div>
                <label class="text-sm font-medium text-gray-700">Email</label>
                <p class="text-sm text-gray-900">${this.currentUser?.email}</p>
              </div>
              <div>
                <label class="text-sm font-medium text-gray-700">Role</label>
                <p class="text-sm text-gray-900 capitalize">${this.currentUser?.role}</p>
              </div>
            </div>
          </div>
        </div>

        <div class="bg-white shadow overflow-hidden sm:rounded-lg">
          <div class="px-4 py-5 sm:px-6">
            <h3 class="text-lg leading-6 font-medium text-gray-900">API Configuration</h3>
            <p class="mt-1 max-w-2xl text-sm text-gray-500">Configure your external API keys for real-time data</p>
          </div>
          <div class="border-t border-gray-200 px-4 py-5">
            <p class="text-gray-600">API key management coming soon...</p>
            <p class="text-sm text-gray-500 mt-2">You'll be able to configure your OpenAI, news, and market data API keys here.</p>
          </div>
        </div>
      </div>
    `
  }

  async handleLogout() {
    try {
      await axios.post('/auth/logout')
      this.currentUser = null
      this.showLoginForm()
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  startPeriodicUpdates() {
    // Update dashboard every 30 seconds if on dashboard
    setInterval(() => {
      if (this.currentPage === 'dashboard' && this.currentUser) {
        document.getElementById('last-update').textContent = new Date().toLocaleTimeString()
        this.loadDashboardData()
      }
    }, 30000)
  }

  getRecTypeColor(type) {
    switch (type) {
      case 'BUY':
        return 'bg-green-100 text-green-800'
      case 'SELL_FULL':
        return 'bg-red-100 text-red-800'
      case 'SELL_PARTIAL':
        return 'bg-orange-100 text-orange-800'
      case 'MODIFY_SL':
        return 'bg-blue-100 text-blue-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  async generateAdvancedAIRecommendations() {
    try {
      // Get first portfolio ID (assume user has at least one)
      const portfoliosResponse = await axios.get('/api/portfolios')
      if (!portfoliosResponse.data.success || !portfoliosResponse.data.data.length) {
        alert('No portfolios found. Please create a portfolio first.')
        return
      }
      
      const portfolioId = portfoliosResponse.data.data[0].id
      
      // Show loading state
      const button = document.getElementById('generate-ai-recs')
      const originalText = button.innerHTML
      button.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Generating AI Analysis...'
      button.disabled = true
      
      // Call advanced AI analysis endpoint
      const response = await axios.post(`/api/advanced/ai-analysis/${portfolioId}`)
      
      if (response.data.success) {
        this.showAIAnalysisResults(response.data)
        this.showNotification('Advanced AI analysis completed successfully!', 'success')
      } else {
        throw new Error(response.data.error || 'AI analysis failed')
      }
      
    } catch (error) {
      console.error('Advanced AI analysis failed:', error)
      this.showNotification('AI analysis failed: ' + (error.response?.data?.error || error.message), 'error')
    } finally {
      // Reset button
      const button = document.getElementById('generate-ai-recs')
      if (button) {
        button.innerHTML = '<i class="fas fa-brain mr-2"></i>Generate Advanced AI Analysis'
        button.disabled = false
      }
    }
  }

  async generateRecommendations() {
    try {
      // Get first portfolio ID (assume user has at least one)
      const portfoliosResponse = await axios.get('/api/portfolios')
      if (!portfoliosResponse.data.success || !portfoliosResponse.data.data.length) {
        alert('No portfolios found. Please create a portfolio first.')
        return
      }

      const portfolioId = portfoliosResponse.data.data[0].id
      
      // Show loading state
      const button = event.target
      const originalText = button.innerHTML
      button.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Generating...'
      button.disabled = true

      const response = await axios.post(`/api/recommendations/generate/${portfolioId}`)
      
      if (response.data.success) {
        alert(`Success! ${response.data.message}`)
        // Reload recommendations
        this.loadDashboardData()
      } else {
        alert(`Error: ${response.data.error}`)
      }
    } catch (error) {
      console.error('Generate recommendations error:', error)
      alert('Failed to generate recommendations. Please try again.')
    } finally {
      // Reset button
      const button = event.target
      button.innerHTML = '<i class="fas fa-robot mr-2"></i>Generate AI Recs'
      button.disabled = false
    }
  }

  async analyzeNews() {
    try {
      // Show loading state
      const button = event.target
      const originalText = button.innerHTML
      button.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Analyzing...'
      button.disabled = true

      const response = await axios.post('/api/news/analyze')
      
      if (response.data.success) {
        alert(`Success! ${response.data.message}`)
        // Update news count
        document.getElementById('news-count').textContent = response.data.data.processedCount
      } else {
        alert(`Error: ${response.data.error}`)
      }
    } catch (error) {
      console.error('Analyze news error:', error)
      alert('Failed to analyze news. Please try again.')
    } finally {
      // Reset button
      const button = event.target
      button.innerHTML = '<i class="fas fa-newspaper mr-2"></i>Analyze News'
      button.disabled = false
    }
  }

  formatTime(dateString) {
    const date = new Date(dateString)
    const now = new Date()
    const diff = now - date
    
    if (diff < 60000) return 'Just now'
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`
    return date.toLocaleDateString()
  }

  // ============ ADVANCED AI FEATURES ============

  async showAIAnalysisResults(data) {
    const modalHtml = `
      <div class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50" id="ai-analysis-modal">
        <div class="relative top-20 mx-auto p-5 border w-11/12 max-w-6xl shadow-lg rounded-md bg-white">
          <div class="mt-3">
            <div class="flex justify-between items-center mb-6">
              <h3 class="text-2xl font-bold text-gray-900">
                <i class="fas fa-brain text-purple-600 mr-3"></i>
                Advanced AI Portfolio Analysis
              </h3>
              <button onclick="document.getElementById('ai-analysis-modal').remove()" 
                class="text-gray-400 hover:text-gray-600">
                <i class="fas fa-times text-xl"></i>
              </button>
            </div>
            
            <!-- Summary Cards -->
            <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div class="bg-blue-50 p-4 rounded-lg">
                <div class="text-sm font-medium text-blue-600">Total Recommendations</div>
                <div class="text-2xl font-bold text-blue-900">${data.summary.total_recommendations}</div>
              </div>
              <div class="bg-green-50 p-4 rounded-lg">
                <div class="text-sm font-medium text-green-600">Buy Signals</div>
                <div class="text-2xl font-bold text-green-900">${data.summary.buy_signals}</div>
              </div>
              <div class="bg-red-50 p-4 rounded-lg">
                <div class="text-sm font-medium text-red-600">Sell Signals</div>
                <div class="text-2xl font-bold text-red-900">${data.summary.sell_signals}</div>
              </div>
              <div class="bg-purple-50 p-4 rounded-lg">
                <div class="text-sm font-medium text-purple-600">Avg Confidence</div>
                <div class="text-2xl font-bold text-purple-900">${(data.summary.avg_confidence * 100).toFixed(1)}%</div>
              </div>
            </div>
            
            <!-- Recommendations List -->
            <div class="space-y-4 max-h-96 overflow-y-auto">
              ${data.recommendations.map(rec => `
                <div class="border rounded-lg p-4 ${this.getAIActionColor(rec.action)}">
                  <div class="flex justify-between items-start mb-3">
                    <div class="flex items-center space-x-3">
                      <span class="text-lg font-bold">${rec.symbol}</span>
                      <span class="px-3 py-1 rounded-full text-sm font-medium ${this.getActionBadgeColor(rec.action)}">${rec.action}</span>
                      <span class="text-sm text-gray-600">Confidence: ${(rec.confidence_level * 100).toFixed(1)}%</span>
                    </div>
                    <div class="text-right">
                      <div class="text-sm text-gray-600">Position Size</div>
                      <div class="font-bold">${(rec.position_size * 100).toFixed(1)}%</div>
                    </div>
                  </div>
                  
                  <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                    <div>
                      <div class="text-xs text-gray-500">Entry Price</div>
                      <div class="font-semibold">$${rec.entry_price.toFixed(2)}</div>
                    </div>
                    <div>
                      <div class="text-xs text-gray-500">Target Prices</div>
                      <div class="font-semibold">$${rec.target_prices.join(', $')}</div>
                    </div>
                    <div>
                      <div class="text-xs text-gray-500">Stop Loss</div>
                      <div class="font-semibold">$${rec.stop_loss.toFixed(2)}</div>
                    </div>
                  </div>
                  
                  <div class="space-y-2">
                    <div class="text-sm">
                      <span class="font-medium">Risk/Reward:</span> ${rec.risk_reward_ratio.toFixed(1)}:1
                      <span class="ml-4 font-medium">Time Horizon:</span> ${rec.time_horizon}
                      <span class="ml-4 font-medium">Success Probability:</span> ${(rec.probability_of_success * 100).toFixed(1)}%
                    </div>
                    
                    <!-- Reasoning -->
                    <div class="bg-gray-50 p-3 rounded text-sm">
                      <div class="font-medium mb-2">Analysis Reasoning:</div>
                      <div class="space-y-1">
                        ${rec.reasoning.technical_factors?.map(factor => `<div>• <span class="text-blue-700">Technical:</span> ${factor}</div>`).join('') || ''}
                        ${rec.reasoning.sentiment_factors?.map(factor => `<div>• <span class="text-green-700">Sentiment:</span> ${factor}</div>`).join('') || ''}
                        ${rec.reasoning.risk_factors?.map(factor => `<div>• <span class="text-red-700">Risk:</span> ${factor}</div>`).join('') || ''}
                      </div>
                    </div>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        </div>
      </div>
    `
    
    document.body.insertAdjacentHTML('beforeend', modalHtml)
  }

  async showTechnicalAnalysis() {
    const symbol = prompt('Enter symbol for technical analysis (e.g., AAPL):')
    if (!symbol) return
    
    try {
      const response = await axios.get(`/api/advanced/technical-analysis/${symbol.toUpperCase()}`)
      
      if (response.data.success) {
        const analysis = response.data.analysis
        this.showTechnicalAnalysisModal(symbol, analysis)
      } else {
        throw new Error(response.data.error)
      }
    } catch (error) {
      console.error('Technical analysis error:', error)
      this.showNotification('Technical analysis failed: ' + (error.response?.data?.error || error.message), 'error')
    }
  }

  showTechnicalAnalysisModal(symbol, analysis) {
    const modalHtml = `
      <div class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50" id="technical-modal">
        <div class="relative top-10 mx-auto p-5 border w-11/12 max-w-6xl shadow-lg rounded-md bg-white">
          <div class="flex justify-between items-center mb-6">
            <h3 class="text-2xl font-bold text-gray-900">
              <i class="fas fa-chart-line text-blue-600 mr-3"></i>
              Technical Analysis - ${symbol}
            </h3>
            <button onclick="document.getElementById('technical-modal').remove()" class="text-gray-400 hover:text-gray-600">
              <i class="fas fa-times text-xl"></i>
            </button>
          </div>
          
          <!-- Setup Quality Score -->
          <div class="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-lg mb-6">
            <div class="flex items-center justify-between">
              <div>
                <h4 class="text-lg font-semibold">Setup Quality Score</h4>
                <p class="text-gray-600">Overall trading setup quality assessment</p>
              </div>
              <div class="text-right">
                <div class="text-4xl font-bold ${analysis.setup_quality.score > 70 ? 'text-green-600' : analysis.setup_quality.score > 40 ? 'text-yellow-600' : 'text-red-600'}">
                  ${analysis.setup_quality.score}/100
                </div>
                <div class="text-sm text-gray-500">Risk/Reward: ${analysis.setup_quality.risk_reward.toFixed(1)}:1</div>
              </div>
            </div>
          </div>
          
          <!-- Timeframe Analysis -->
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            ${Object.entries(analysis.timeframes).map(([tf, data]) => `
              <div class="border rounded-lg p-4">
                <div class="flex justify-between items-center mb-3">
                  <h5 class="font-semibold">${tf.toUpperCase()}</h5>
                  <span class="px-2 py-1 rounded text-xs font-medium ${data.signal_direction === 'buy' ? 'bg-green-100 text-green-800' : data.signal_direction === 'sell' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'}">
                    ${data.signal_direction.toUpperCase()}
                  </span>
                </div>
                
                <div class="space-y-2 text-sm">
                  <div>Trend: <span class="font-medium">${data.trend.direction}</span></div>
                  <div>Strength: <span class="font-medium">${(data.trend.strength * 100).toFixed(0)}%</span></div>
                  <div>Signal: <span class="font-medium">${(data.signal_strength * 100).toFixed(0)}%</span></div>
                  <div class="text-xs text-gray-600">RSI: ${data.indicators.rsi.toFixed(1)}</div>
                </div>
              </div>
            `).join('')}
          </div>
          
          <!-- Overall Trend -->
          <div class="bg-gray-50 p-4 rounded-lg mb-6">
            <h5 class="font-semibold mb-3">Overall Trend Analysis</h5>
            <div class="grid grid-cols-3 gap-4 text-center">
              <div>
                <div class="text-sm text-gray-600">Short Term</div>
                <div class="font-bold ${analysis.overall_trend.short_term === 'bullish' ? 'text-green-600' : analysis.overall_trend.short_term === 'bearish' ? 'text-red-600' : 'text-gray-600'}">${analysis.overall_trend.short_term}</div>
              </div>
              <div>
                <div class="text-sm text-gray-600">Medium Term</div>
                <div class="font-bold ${analysis.overall_trend.medium_term === 'bullish' ? 'text-green-600' : analysis.overall_trend.medium_term === 'bearish' ? 'text-red-600' : 'text-gray-600'}">${analysis.overall_trend.medium_term}</div>
              </div>
              <div>
                <div class="text-sm text-gray-600">Long Term</div>
                <div class="font-bold ${analysis.overall_trend.long_term === 'bullish' ? 'text-green-600' : analysis.overall_trend.long_term === 'bearish' ? 'text-red-600' : 'text-gray-600'}">${analysis.overall_trend.long_term}</div>
              </div>
            </div>
          </div>
          
          <!-- Key Levels -->
          <div class="grid grid-cols-2 gap-4">
            <div class="border rounded-lg p-4">
              <h5 class="font-semibold mb-3 text-green-600">Support Levels</h5>
              <div class="space-y-1">
                ${analysis.critical_levels.major_support.map(level => `<div class="text-sm">$${level.toFixed(2)}</div>`).join('')}
              </div>
            </div>
            <div class="border rounded-lg p-4">
              <h5 class="font-semibold mb-3 text-red-600">Resistance Levels</h5>
              <div class="space-y-1">
                ${analysis.critical_levels.major_resistance.map(level => `<div class="text-sm">$${level.toFixed(2)}</div>`).join('')}
              </div>
            </div>
          </div>
        </div>
      </div>
    `
    
    document.body.insertAdjacentHTML('beforeend', modalHtml)
  }

  async showPortfolioOverview() {
    try {
      const portfoliosResponse = await axios.get('/api/portfolios')
      if (!portfoliosResponse.data.success || !portfoliosResponse.data.data.length) {
        this.showNotification('No portfolios found. Please create a portfolio first.', 'error')
        return
      }
      
      const portfolioId = portfoliosResponse.data.data[0].id
      const response = await axios.get(`/api/advanced/portfolio/${portfolioId}/overview`)
      
      if (response.data.success) {
        this.showPortfolioOverviewModal(response.data)
      } else {
        throw new Error(response.data.error)
      }
    } catch (error) {
      console.error('Portfolio overview error:', error)
      this.showNotification('Portfolio overview failed: ' + (error.response?.data?.error || error.message), 'error')
    }
  }

  showPortfolioOverviewModal(data) {
    const metrics = data.metrics
    const positions = data.positions
    
    const modalHtml = `
      <div class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50" id="portfolio-modal">
        <div class="relative top-10 mx-auto p-5 border w-11/12 max-w-6xl shadow-lg rounded-md bg-white">
          <div class="flex justify-between items-center mb-6">
            <h3 class="text-2xl font-bold text-gray-900">
              <i class="fas fa-briefcase text-green-600 mr-3"></i>
              Portfolio Overview
            </h3>
            <button onclick="document.getElementById('portfolio-modal').remove()" class="text-gray-400 hover:text-gray-600">
              <i class="fas fa-times text-xl"></i>
            </button>
          </div>
          
          <!-- Portfolio Metrics -->
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div class="bg-blue-50 p-4 rounded-lg">
              <div class="text-sm font-medium text-blue-600">Total Value</div>
              <div class="text-2xl font-bold text-blue-900">$${metrics.total_value.toLocaleString()}</div>
              <div class="text-sm ${metrics.day_change >= 0 ? 'text-green-600' : 'text-red-600'}">
                ${metrics.day_change >= 0 ? '+' : ''}${metrics.day_change_pct.toFixed(2)}% today
              </div>
            </div>
            
            <div class="bg-green-50 p-4 rounded-lg">
              <div class="text-sm font-medium text-green-600">Total Return</div>
              <div class="text-2xl font-bold text-green-900">${metrics.total_return_pct.toFixed(1)}%</div>
              <div class="text-sm text-gray-600">Annualized: ${metrics.annualized_return.toFixed(1)}%</div>
            </div>
            
            <div class="bg-purple-50 p-4 rounded-lg">
              <div class="text-sm font-medium text-purple-600">Sharpe Ratio</div>
              <div class="text-2xl font-bold text-purple-900">${metrics.sharpe_ratio.toFixed(2)}</div>
              <div class="text-sm text-gray-600">Win Rate: ${metrics.win_rate.toFixed(1)}%</div>
            </div>
            
            <div class="bg-red-50 p-4 rounded-lg">
              <div class="text-sm font-medium text-red-600">Max Drawdown</div>
              <div class="text-2xl font-bold text-red-900">${Math.abs(metrics.max_drawdown).toFixed(1)}%</div>
              <div class="text-sm text-gray-600">VaR 95%: ${metrics.var_95.toFixed(1)}%</div>
            </div>
          </div>
          
          <!-- Positions -->
          <div class="mb-6">
            <h4 class="text-lg font-semibold mb-4">Current Positions (${positions.length})</h4>
            <div class="overflow-x-auto">
              <table class="min-w-full divide-y divide-gray-200">
                <thead class="bg-gray-50">
                  <tr>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Symbol</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quantity</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Avg Price</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Current Price</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">P&L</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">% of Portfolio</th>
                  </tr>
                </thead>
                <tbody class="bg-white divide-y divide-gray-200">
                  ${positions.map(pos => `
                    <tr>
                      <td class="px-6 py-4 text-sm font-medium text-gray-900">${pos.symbol}</td>
                      <td class="px-6 py-4 text-sm text-gray-500">${pos.quantity.toLocaleString()}</td>
                      <td class="px-6 py-4 text-sm text-gray-500">$${pos.avg_entry_price.toFixed(2)}</td>
                      <td class="px-6 py-4 text-sm text-gray-500">$${pos.current_price.toFixed(2)}</td>
                      <td class="px-6 py-4 text-sm ${pos.unrealized_pnl >= 0 ? 'text-green-600' : 'text-red-600'}">
                        ${pos.unrealized_pnl >= 0 ? '+' : ''}$${pos.unrealized_pnl.toFixed(0)} (${pos.unrealized_pnl_pct.toFixed(1)}%)
                      </td>
                      <td class="px-6 py-4 text-sm text-gray-500">${pos.position_size_pct.toFixed(1)}%</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          </div>
          
          <!-- Risk Alerts -->
          ${data.risk_alerts && data.risk_alerts.length > 0 ? `
            <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h4 class="text-lg font-semibold text-yellow-800 mb-3">
                <i class="fas fa-exclamation-triangle mr-2"></i>
                Risk Alerts (${data.risk_alerts.length})
              </h4>
              <div class="space-y-2">
                ${data.risk_alerts.map(alert => `
                  <div class="text-sm">
                    <span class="font-medium">${alert.title}:</span> ${alert.description}
                  </div>
                `).join('')}
              </div>
            </div>
          ` : ''}
        </div>
      </div>
    `
    
    document.body.insertAdjacentHTML('beforeend', modalHtml)
  }

  async showRiskManagement() {
    try {
      const portfoliosResponse = await axios.get('/api/portfolios')
      if (!portfoliosResponse.data.success || !portfoliosResponse.data.data.length) {
        this.showNotification('No portfolios found. Please create a portfolio first.', 'error')
        return
      }
      
      const portfolioId = portfoliosResponse.data.data[0].id
      const response = await axios.get(`/api/advanced/portfolio/${portfolioId}/risk-metrics`)
      
      if (response.data.success) {
        this.showRiskManagementModal(response.data)
      } else {
        throw new Error(response.data.error)
      }
    } catch (error) {
      console.error('Risk management error:', error)
      this.showNotification('Risk analysis failed: ' + (error.response?.data?.error || error.message), 'error')
    }
  }

  showRiskManagementModal(data) {
    const metrics = data.risk_metrics
    const alerts = data.risk_alerts
    
    const modalHtml = `
      <div class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50" id="risk-modal">
        <div class="relative top-10 mx-auto p-5 border w-11/12 max-w-6xl shadow-lg rounded-md bg-white">
          <div class="flex justify-between items-center mb-6">
            <h3 class="text-2xl font-bold text-gray-900">
              <i class="fas fa-shield-alt text-red-600 mr-3"></i>
              Risk Management Dashboard
            </h3>
            <button onclick="document.getElementById('risk-modal').remove()" class="text-gray-400 hover:text-gray-600">
              <i class="fas fa-times text-xl"></i>
            </button>
          </div>
          
          <!-- Risk Metrics Grid -->
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div class="bg-red-50 p-4 rounded-lg">
              <div class="text-sm font-medium text-red-600">Value at Risk (95%)</div>
              <div class="text-2xl font-bold text-red-900">${metrics.portfolio_var_95.toFixed(2)}%</div>
              <div class="text-xs text-gray-600">1-day estimate: ${metrics.estimated_1d_risk.toFixed(2)}%</div>
            </div>
            
            <div class="bg-orange-50 p-4 rounded-lg">
              <div class="text-sm font-medium text-orange-600">Portfolio Beta</div>
              <div class="text-2xl font-bold text-orange-900">${metrics.portfolio_beta.toFixed(2)}</div>
              <div class="text-xs text-gray-600">Market correlation: ${(metrics.market_correlation * 100).toFixed(0)}%</div>
            </div>
            
            <div class="bg-yellow-50 p-4 rounded-lg">
              <div class="text-sm font-medium text-yellow-600">Volatility</div>
              <div class="text-2xl font-bold text-yellow-900">${metrics.volatility.toFixed(1)}%</div>
              <div class="text-xs text-gray-600">Annualized</div>
            </div>
            
            <div class="bg-purple-50 p-4 rounded-lg">
              <div class="text-sm font-medium text-purple-600">Concentration Risk</div>
              <div class="text-2xl font-bold text-purple-900">${metrics.single_position_risk.toFixed(1)}%</div>
              <div class="text-xs text-gray-600">Largest position</div>
            </div>
          </div>
          
          <!-- Risk-Adjusted Returns -->
          <div class="bg-gray-50 p-4 rounded-lg mb-6">
            <h4 class="font-semibold mb-3">Risk-Adjusted Returns</h4>
            <div class="grid grid-cols-3 gap-4">
              <div class="text-center">
                <div class="text-sm text-gray-600">Sharpe Ratio</div>
                <div class="text-xl font-bold">${metrics.sharpe_ratio.toFixed(2)}</div>
              </div>
              <div class="text-center">
                <div class="text-sm text-gray-600">Sortino Ratio</div>
                <div class="text-xl font-bold">${metrics.sortino_ratio.toFixed(2)}</div>
              </div>
              <div class="text-center">
                <div class="text-sm text-gray-600">Calmar Ratio</div>
                <div class="text-xl font-bold">${metrics.calmar_ratio.toFixed(2)}</div>
              </div>
            </div>
          </div>
          
          <!-- Risk Alerts -->
          ${alerts && alerts.length > 0 ? `
            <div class="mb-6">
              <h4 class="font-semibold mb-3">Active Risk Alerts</h4>
              <div class="space-y-3">
                ${alerts.map(alert => `
                  <div class="border-l-4 ${alert.severity === 'critical' ? 'border-red-500 bg-red-50' : alert.severity === 'high' ? 'border-orange-500 bg-orange-50' : 'border-yellow-500 bg-yellow-50'} p-4">
                    <div class="flex justify-between items-start">
                      <div>
                        <h5 class="font-medium">${alert.title}</h5>
                        <p class="text-sm text-gray-600 mt-1">${alert.message}</p>
                      </div>
                      <span class="px-2 py-1 rounded text-xs font-medium ${alert.severity === 'critical' ? 'bg-red-100 text-red-800' : alert.severity === 'high' ? 'bg-orange-100 text-orange-800' : 'bg-yellow-100 text-yellow-800'}">
                        ${alert.severity.toUpperCase()}
                      </span>
                    </div>
                    ${alert.recommended_actions && alert.recommended_actions.length > 0 ? `
                      <div class="mt-3">
                        <div class="text-sm font-medium">Recommended Actions:</div>
                        <ul class="text-sm text-gray-600 mt-1 space-y-1">
                          ${alert.recommended_actions.map(action => `<li>• ${action}</li>`).join('')}
                        </ul>
                      </div>
                    ` : ''}
                  </div>
                `).join('')}
              </div>
            </div>
          ` : ''}
          
          <!-- Sector Exposure -->
          <div>
            <h4 class="font-semibold mb-3">Sector Exposure</h4>
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
              ${Object.entries(metrics.sector_concentration).map(([sector, allocation]) => `
                <div class="text-center p-3 border rounded">
                  <div class="text-sm text-gray-600">${sector}</div>
                  <div class="text-lg font-bold">${allocation.toFixed(1)}%</div>
                </div>
              `).join('')}
            </div>
          </div>
        </div>
      </div>
    `
    
    document.body.insertAdjacentHTML('beforeend', modalHtml)
  }

  async showMarketRegime() {
    try {
      const response = await axios.get('/api/advanced/market/regime')
      
      if (response.data.success) {
        this.showMarketRegimeModal(response.data.regime_analysis)
      } else {
        throw new Error(response.data.error)
      }
    } catch (error) {
      console.error('Market regime error:', error)
      this.showNotification('Market regime analysis failed: ' + (error.response?.data?.error || error.message), 'error')
    }
  }

  showMarketRegimeModal(data) {
    const modalHtml = `
      <div class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50" id="regime-modal">
        <div class="relative top-10 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
          <div class="flex justify-between items-center mb-6">
            <h3 class="text-2xl font-bold text-gray-900">
              <i class="fas fa-globe text-yellow-600 mr-3"></i>
              Market Regime Analysis
            </h3>
            <button onclick="document.getElementById('regime-modal').remove()" class="text-gray-400 hover:text-gray-600">
              <i class="fas fa-times text-xl"></i>
            </button>
          </div>
          
          <!-- Current Regime -->
          <div class="text-center mb-6 p-6 ${data.current_regime === 'bull' ? 'bg-green-50 border border-green-200' : data.current_regime === 'bear' ? 'bg-red-50 border border-red-200' : 'bg-yellow-50 border border-yellow-200'} rounded-lg">
            <h4 class="text-3xl font-bold mb-2 ${data.current_regime === 'bull' ? 'text-green-600' : data.current_regime === 'bear' ? 'text-red-600' : 'text-yellow-600'}">${data.current_regime.toUpperCase()} MARKET</h4>
            <p class="text-lg">Confidence: ${(data.confidence * 100).toFixed(1)}%</p>
            <p class="text-sm text-gray-600">Duration: ${data.regime_duration_days} days</p>
          </div>
          
          <!-- Regime Probabilities -->
          <div class="grid grid-cols-3 gap-4 mb-6">
            <div class="text-center p-4 border rounded-lg">
              <div class="text-lg font-bold text-green-600">${(data.regime_probability.bull * 100).toFixed(1)}%</div>
              <div class="text-sm text-gray-600">Bull Market</div>
            </div>
            <div class="text-center p-4 border rounded-lg">
              <div class="text-lg font-bold text-red-600">${(data.regime_probability.bear * 100).toFixed(1)}%</div>
              <div class="text-sm text-gray-600">Bear Market</div>
            </div>
            <div class="text-center p-4 border rounded-lg">
              <div class="text-lg font-bold text-yellow-600">${(data.regime_probability.sideways * 100).toFixed(1)}%</div>
              <div class="text-sm text-gray-600">Sideways</div>
            </div>
          </div>
          
          <!-- Market Indicators -->
          <div class="grid grid-cols-2 gap-6 mb-6">
            <div>
              <h4 class="font-semibold mb-3">Market Indicators</h4>
              <div class="space-y-2 text-sm">
                <div>VIX Level: <span class="font-medium">${data.market_indicators.vix_level.toFixed(1)}</span></div>
                <div>SPY Trend: <span class="font-medium ${data.market_indicators.spy_trend === 'up' ? 'text-green-600' : 'text-red-600'}">${data.market_indicators.spy_trend}</span></div>
                <div>Advancing Stocks: <span class="font-medium">${data.market_indicators.breadth_indicators.advancing_stocks_pct.toFixed(1)}%</span></div>
                <div>Volume Trend: <span class="font-medium">${data.market_indicators.breadth_indicators.volume_trend}</span></div>
              </div>
            </div>
            
            <div>
              <h4 class="font-semibold mb-3">Trading Recommendations</h4>
              <div class="space-y-2 text-sm">
                <div>Position Sizing: <span class="font-medium">${data.trading_recommendations.position_sizing_adjustment}</span></div>
                <div>Sector Focus: <span class="font-medium">${data.trading_recommendations.sector_focus}</span></div>
                <div>Strategy: <span class="font-medium">${data.trading_recommendations.volatility_strategy.replace('_', ' ')}</span></div>
              </div>
            </div>
          </div>
          
          <!-- Sector Rotation -->
          <div class="bg-gray-50 p-4 rounded-lg">
            <h4 class="font-semibold mb-3">Current Sector Rotation</h4>
            <div class="flex flex-wrap gap-2">
              ${data.market_indicators.sector_rotation.map(sector => `
                <span class="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">${sector}</span>
              `).join('')}
            </div>
          </div>
        </div>
      </div>
    `
    
    document.body.insertAdjacentHTML('beforeend', modalHtml)
  }

  async showPositionSizing() {
    const modalHtml = `
      <div class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50" id="position-sizing-modal">
        <div class="relative top-10 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
          <div class="flex justify-between items-center mb-6">
            <h3 class="text-2xl font-bold text-gray-900">
              <i class="fas fa-calculator text-pink-600 mr-3"></i>
              Position Sizing Calculator
            </h3>
            <button onclick="document.getElementById('position-sizing-modal').remove()" class="text-gray-400 hover:text-gray-600">
              <i class="fas fa-times text-xl"></i>
            </button>
          </div>
          
          <form id="position-sizing-form" class="space-y-6">
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Symbol</label>
                <input type="text" id="ps-symbol" class="w-full px-3 py-2 border border-gray-300 rounded-md" placeholder="AAPL" required>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Entry Price ($)</label>
                <input type="number" id="ps-entry" class="w-full px-3 py-2 border border-gray-300 rounded-md" step="0.01" required>
              </div>
            </div>
            
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Target Price ($)</label>
                <input type="number" id="ps-target" class="w-full px-3 py-2 border border-gray-300 rounded-md" step="0.01" required>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Stop Loss ($)</label>
                <input type="number" id="ps-stop" class="w-full px-3 py-2 border border-gray-300 rounded-md" step="0.01" required>
              </div>
            </div>
            
            <div>
              <button type="submit" class="w-full bg-pink-600 text-white py-3 px-4 rounded-md hover:bg-pink-700">
                <i class="fas fa-calculator mr-2"></i>Calculate Position Size
              </button>
            </div>
          </form>
          
          <div id="position-sizing-results" class="mt-6 hidden">
            <!-- Results will be populated here -->
          </div>
        </div>
      </div>
    `
    
    document.body.insertAdjacentHTML('beforeend', modalHtml)
    
    // Add form handler
    document.getElementById('position-sizing-form').addEventListener('submit', (e) => {
      e.preventDefault()
      this.calculatePositionSize()
    })
  }

  async calculatePositionSize() {
    try {
      const portfoliosResponse = await axios.get('/api/portfolios')
      if (!portfoliosResponse.data.success || !portfoliosResponse.data.data.length) {
        this.showNotification('No portfolios found. Please create a portfolio first.', 'error')
        return
      }
      
      const portfolioId = portfoliosResponse.data.data[0].id
      const symbol = document.getElementById('ps-symbol').value.toUpperCase()
      const entryPrice = parseFloat(document.getElementById('ps-entry').value)
      const targetPrice = parseFloat(document.getElementById('ps-target').value)
      const stopLoss = parseFloat(document.getElementById('ps-stop').value)
      
      const response = await axios.post('/api/advanced/risk/position-sizing', {
        portfolio_id: portfolioId,
        symbol,
        entry_price: entryPrice,
        target_price: targetPrice,
        stop_loss: stopLoss
      })
      
      if (response.data.success) {
        this.showPositionSizingResults(response.data.position_sizing)
      } else {
        throw new Error(response.data.error)
      }
    } catch (error) {
      console.error('Position sizing error:', error)
      this.showNotification('Position sizing failed: ' + (error.response?.data?.error || error.message), 'error')
    }
  }

  showPositionSizingResults(data) {
    const resultsHtml = `
      <div class="border-t pt-6">
        <h4 class="text-lg font-semibold mb-4">Position Sizing Results</h4>
        
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div class="bg-blue-50 p-4 rounded-lg text-center">
            <div class="text-sm font-medium text-blue-600">Recommended Shares</div>
            <div class="text-2xl font-bold text-blue-900">${data.recommended_shares.toLocaleString()}</div>
          </div>
          
          <div class="bg-green-50 p-4 rounded-lg text-center">
            <div class="text-sm font-medium text-green-600">Dollar Amount</div>
            <div class="text-2xl font-bold text-green-900">$${data.recommended_dollar_amount.toLocaleString()}</div>
          </div>
          
          <div class="bg-purple-50 p-4 rounded-lg text-center">
            <div class="text-sm font-medium text-purple-600">Position Size</div>
            <div class="text-2xl font-bold text-purple-900">${data.position_size_pct.toFixed(1)}%</div>
          </div>
          
          <div class="bg-red-50 p-4 rounded-lg text-center">
            <div class="text-sm font-medium text-red-600">Total Risk</div>
            <div class="text-2xl font-bold text-red-900">$${data.total_position_risk.toFixed(0)}</div>
          </div>
        </div>
        
        <div class="bg-gray-50 p-4 rounded-lg">
          <div class="text-sm font-medium mb-2">Sizing Method: ${data.sizing_method}</div>
          <div class="space-y-1 text-sm text-gray-600">
            ${data.reasoning.map(reason => `<div>• ${reason}</div>`).join('')}
          </div>
        </div>
      </div>
    `
    
    document.getElementById('position-sizing-results').innerHTML = resultsHtml
    document.getElementById('position-sizing-results').classList.remove('hidden')
  }

  // Helper methods for styling
  getAIActionColor(action) {
    switch (action) {
      case 'BUY': return 'border-green-200 bg-green-50'
      case 'SELL': return 'border-red-200 bg-red-50'
      case 'HOLD': return 'border-gray-200 bg-gray-50'
      case 'REDUCE': return 'border-orange-200 bg-orange-50'
      case 'INCREASE': return 'border-blue-200 bg-blue-50'
      default: return 'border-gray-200 bg-white'
    }
  }

  getActionBadgeColor(action) {
    switch (action) {
      case 'BUY': return 'bg-green-100 text-green-800'
      case 'SELL': return 'bg-red-100 text-red-800'  
      case 'HOLD': return 'bg-gray-100 text-gray-800'
      case 'REDUCE': return 'bg-orange-100 text-orange-800'
      case 'INCREASE': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  showNotification(message, type = 'info') {
    const colors = {
      success: 'bg-green-100 border-green-400 text-green-700',
      error: 'bg-red-100 border-red-400 text-red-700',
      warning: 'bg-yellow-100 border-yellow-400 text-yellow-700',
      info: 'bg-blue-100 border-blue-400 text-blue-700'
    }
    
    const notification = document.createElement('div')
    notification.className = `fixed top-4 right-4 max-w-sm p-4 border rounded-md ${colors[type]} z-50`
    notification.innerHTML = `
      <div class="flex justify-between items-start">
        <div class="text-sm">${message}</div>
        <button onclick="this.parentElement.parentElement.remove()" class="ml-2 text-current opacity-50 hover:opacity-75">
          <i class="fas fa-times"></i>
        </button>
      </div>
    `
    
    document.body.appendChild(notification)
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
      if (notification.parentElement) {
        notification.remove()
      }
    }, 5000)
  }
}

// Initialize the app
const app = new TraderApp()
window.app = app // Make it globally accessible for button handlers