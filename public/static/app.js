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
        <div class="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
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
              <div class="flex items-center justify-between">
                <div>
                  <h3 class="text-lg leading-6 font-medium text-gray-900">Recent Recommendations</h3>
                  <p class="mt-1 max-w-2xl text-sm text-gray-500">Latest trading recommendations for your portfolios</p>
                </div>
                <div class="flex space-x-2">
                  <button onclick="app.generateRecommendations()" 
                    class="inline-flex items-center px-3 py-2 border border-blue-300 shadow-sm text-sm leading-4 font-medium rounded-md text-blue-700 bg-white hover:bg-blue-50">
                    <i class="fas fa-robot mr-2"></i>
                    Generate AI Recs
                  </button>
                  <button onclick="app.analyzeNews()" 
                    class="inline-flex items-center px-3 py-2 border border-green-300 shadow-sm text-sm leading-4 font-medium rounded-md text-green-700 bg-white hover:bg-green-50">
                    <i class="fas fa-newspaper mr-2"></i>
                    Analyze News
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
}

// Initialize the app
const app = new TraderApp()
window.app = app // Make it globally accessible for button handlers