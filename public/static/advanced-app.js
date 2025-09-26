// Enhanced Real-Time Trader Advisor Frontend with Advanced AI Features
class EnhancedTraderApp {
  constructor() {
    this.currentUser = null
    this.currentPage = 'dashboard'
    this.portfolios = []
    this.selectedPortfolioId = null
    this.realTimeUpdates = null
    this.init()
  }

  async init() {
    console.log('🚀 Initializing Enhanced Trader Advisor App...')
    
    // Check authentication
    await this.checkAuth()
    
    // Setup navigation and periodic updates
    this.setupNavigation()
    this.startRealTimeUpdates()
    
    console.log('✅ Enhanced app initialized successfully')
  }

  async checkAuth() {
    try {
      const response = await axios.get('/auth/me')
      if (response.data.success) {
        this.currentUser = response.data.data
        await this.showMainApp()
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
      <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
        <div class="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-lg">
          <div class="text-center">
            <div class="mx-auto h-16 w-16 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mb-4">
              <i class="fas fa-robot text-2xl text-white"></i>
            </div>
            <h2 class="text-3xl font-extrabold text-gray-900">AI Trader Advisor</h2>
            <p class="mt-2 text-gray-600">Advanced AI-powered trading intelligence</p>
          </div>
          
          <div id="auth-error" class="hidden bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded"></div>
          
          <form id="login-form" class="space-y-6">
            <div class="space-y-4">
              <input type="email" id="email" required 
                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Email address">
              <input type="password" id="password" required
                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Password">
            </div>
            
            <button type="submit" 
              class="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white py-3 px-4 rounded-lg hover:from-blue-600 hover:to-indigo-700 font-medium transition-all duration-200">
              <i class="fas fa-sign-in-alt mr-2"></i>
              Sign In to AI Platform
            </button>
          </form>
          
          <div class="text-center">
            <button type="button" id="demo-login" 
              class="text-blue-600 hover:text-blue-700 text-sm font-medium">
              Try Demo Account
            </button>
          </div>
        </div>
      </div>
    `

    // Setup form handlers
    document.getElementById('login-form').addEventListener('submit', (e) => this.handleLogin(e))
    document.getElementById('demo-login').addEventListener('click', () => this.handleDemoLogin())
  }

  async showMainApp() {
    // Load portfolios first
    await this.loadPortfolios()
    
    document.getElementById('app').innerHTML = `
      <div class="min-h-screen bg-gray-50">
        <!-- Navigation Header -->
        <nav class="bg-white shadow-sm border-b border-gray-200">
          <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="flex justify-between h-16">
              <div class="flex items-center">
                <div class="flex-shrink-0 flex items-center">
                  <div class="h-8 w-8 bg-gradient-to-r from-blue-500 to-indigo-600 rounded flex items-center justify-center mr-3">
                    <i class="fas fa-robot text-white text-sm"></i>
                  </div>
                  <h1 class="text-xl font-bold text-gray-900">AI Trader Advisor</h1>
                </div>
                
                <!-- Navigation Menu -->
                <div class="ml-10 flex items-baseline space-x-4">
                  <a href="#" class="nav-link active" data-page="dashboard">
                    <i class="fas fa-chart-pie mr-1"></i> Dashboard
                  </a>
                  <a href="#" class="nav-link" data-page="analysis">
                    <i class="fas fa-brain mr-1"></i> AI Analysis
                  </a>
                  <a href="#" class="nav-link" data-page="positions">
                    <i class="fas fa-briefcase mr-1"></i> Positions
                  </a>
                  <a href="#" class="nav-link" data-page="risk">
                    <i class="fas fa-shield-alt mr-1"></i> Risk Management
                  </a>
                  <a href="#" class="nav-link" data-page="backtest">
                    <i class="fas fa-history mr-1"></i> Backtesting
                  </a>
                </div>
              </div>
              
              <div class="flex items-center space-x-4">
                <!-- Portfolio Selector -->
                <select id="portfolio-selector" class="rounded-lg border-gray-300 text-sm">
                  ${this.renderPortfolioOptions()}
                </select>
                
                <!-- Market Regime Indicator -->
                <div id="market-regime" class="flex items-center space-x-2">
                  <div class="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                  <span class="text-sm font-medium text-gray-700">Bull Market</span>
                </div>
                
                <!-- User Menu -->
                <div class="relative">
                  <button class="flex items-center text-sm font-medium text-gray-700 hover:text-gray-900">
                    <i class="fas fa-user-circle text-lg mr-1"></i>
                    ${this.currentUser.name}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </nav>
        
        <!-- Main Content Area -->
        <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div id="main-content">
            <!-- Content will be loaded here -->
          </div>
        </main>
        
        <!-- Real-time Notifications -->
        <div id="notifications" class="fixed bottom-4 right-4 space-y-2 z-50">
          <!-- Notifications will appear here -->
        </div>
      </div>
    `

    this.setupNavigation()
    this.showDashboard() // Default page
    this.updateMarketRegime()
    
    // Setup portfolio selector
    document.getElementById('portfolio-selector').addEventListener('change', (e) => {
      this.selectedPortfolioId = e.target.value
      this.refreshCurrentPage()
    })
  }

  renderPortfolioOptions() {
    if (!this.portfolios.length) return '<option>No portfolios</option>'
    
    return this.portfolios.map(p => 
      `<option value="${p.id}" ${p.id === this.selectedPortfolioId ? 'selected' : ''}>
        ${p.name} ($${p.total_value?.toFixed(0) || '0'})
      </option>`
    ).join('')
  }

  setupNavigation() {
    document.querySelectorAll('.nav-link').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault()
        
        // Update active state
        document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'))
        link.classList.add('active')
        
        // Navigate to page
        const page = link.dataset.page
        this.currentPage = page
        this.navigateToPage(page)
      })
    })
  }

  async navigateToPage(page) {
    console.log(`📍 Navigating to ${page}`)
    
    switch (page) {
      case 'dashboard':
        await this.showDashboard()
        break
      case 'analysis':
        await this.showAIAnalysis()
        break
      case 'positions':
        await this.showPositions()
        break
      case 'risk':
        await this.showRiskManagement()
        break
      case 'backtest':
        await this.showBacktesting()
        break
      default:
        await this.showDashboard()
    }
  }

  async showDashboard() {
    const content = document.getElementById('main-content')
    content.innerHTML = `
      <div class="space-y-6">
        <!-- Quick Stats Cards -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div class="bg-white rounded-lg shadow p-6">
            <div class="flex items-center">
              <div class="p-2 bg-green-100 rounded-lg">
                <i class="fas fa-dollar-sign text-green-600"></i>
              </div>
              <div class="ml-4">
                <p class="text-sm font-medium text-gray-500">Portfolio Value</p>
                <p id="portfolio-value" class="text-2xl font-semibold text-gray-900">Loading...</p>
              </div>
            </div>
          </div>
          
          <div class="bg-white rounded-lg shadow p-6">
            <div class="flex items-center">
              <div class="p-2 bg-blue-100 rounded-lg">
                <i class="fas fa-chart-line text-blue-600"></i>
              </div>
              <div class="ml-4">
                <p class="text-sm font-medium text-gray-500">Daily Change</p>
                <p id="daily-change" class="text-2xl font-semibold text-gray-900">Loading...</p>
              </div>
            </div>
          </div>
          
          <div class="bg-white rounded-lg shadow p-6">
            <div class="flex items-center">
              <div class="p-2 bg-purple-100 rounded-lg">
                <i class="fas fa-robot text-purple-600"></i>
              </div>
              <div class="ml-4">
                <p class="text-sm font-medium text-gray-500">AI Confidence</p>
                <p id="ai-confidence" class="text-2xl font-semibold text-gray-900">Loading...</p>
              </div>
            </div>
          </div>
          
          <div class="bg-white rounded-lg shadow p-6">
            <div class="flex items-center">
              <div class="p-2 bg-yellow-100 rounded-lg">
                <i class="fas fa-exclamation-triangle text-yellow-600"></i>
              </div>
              <div class="ml-4">
                <p class="text-sm font-medium text-gray-500">Risk Alerts</p>
                <p id="risk-alerts" class="text-2xl font-semibold text-gray-900">Loading...</p>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Action Buttons -->
        <div class="bg-white rounded-lg shadow p-6">
          <h3 class="text-lg font-medium text-gray-900 mb-4">AI-Powered Actions</h3>
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <button id="ai-analysis-btn" class="btn-primary">
              <i class="fas fa-brain mr-2"></i>
              Generate AI Analysis
            </button>
            <button id="technical-analysis-btn" class="btn-secondary">
              <i class="fas fa-chart-bar mr-2"></i>  
              Multi-Timeframe Analysis
            </button>
            <button id="risk-analysis-btn" class="btn-secondary">
              <i class="fas fa-shield-alt mr-2"></i>
              Risk Assessment
            </button>
            <button id="rebalance-btn" class="btn-secondary">
              <i class="fas fa-balance-scale mr-2"></i>
              Portfolio Rebalancing
            </button>
          </div>
        </div>
        
        <!-- Recent Activity & Recommendations -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div class="bg-white rounded-lg shadow">
            <div class="px-6 py-4 border-b border-gray-200">
              <h3 class="text-lg font-medium text-gray-900">Latest AI Recommendations</h3>
            </div>
            <div id="recent-recommendations" class="p-6">
              <div class="text-center py-8">
                <i class="fas fa-spinner fa-spin text-gray-400 text-2xl mb-2"></i>
                <p class="text-gray-500">Loading recommendations...</p>
              </div>
            </div>
          </div>
          
          <div class="bg-white rounded-lg shadow">
            <div class="px-6 py-4 border-b border-gray-200">
              <h3 class="text-lg font-medium text-gray-900">Portfolio Performance</h3>
            </div>
            <div id="performance-chart" class="p-6">
              <div class="bg-gray-100 rounded-lg h-64 flex items-center justify-center">
                <div class="text-center">
                  <i class="fas fa-chart-area text-4xl text-gray-400 mb-2"></i>
                  <p class="text-gray-500">Performance Chart</p>
                  <p class="text-sm text-gray-400">Coming Soon</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `

    // Setup button handlers
    document.getElementById('ai-analysis-btn').addEventListener('click', () => this.generateAIAnalysis())
    document.getElementById('technical-analysis-btn').addEventListener('click', () => this.generateTechnicalAnalysis())
    document.getElementById('risk-analysis-btn').addEventListener('click', () => this.generateRiskAnalysis())
    document.getElementById('rebalance-btn').addEventListener('click', () => this.generateRebalancing())

    // Load dashboard data
    await this.loadDashboardData()
  }

  async showAIAnalysis() {
    const content = document.getElementById('main-content')
    content.innerHTML = `
      <div class="space-y-6">
        <div class="bg-white rounded-lg shadow p-6">
          <div class="flex items-center justify-between mb-6">
            <h2 class="text-2xl font-bold text-gray-900">
              <i class="fas fa-robot mr-2 text-blue-600"></i>
              Advanced AI Analysis
            </h2>
            <button id="refresh-analysis" class="btn-primary">
              <i class="fas fa-sync-alt mr-2"></i>
              Refresh Analysis
            </button>
          </div>
          
          <!-- AI Analysis Results -->
          <div id="ai-analysis-results">
            <div class="text-center py-12">
              <i class="fas fa-brain text-6xl text-blue-600 mb-4"></i>
              <h3 class="text-xl font-medium text-gray-900 mb-2">AI Analysis Ready</h3>
              <p class="text-gray-600 mb-6">Generate comprehensive AI-powered portfolio recommendations</p>
              <button id="start-analysis" class="btn-primary">
                <i class="fas fa-play mr-2"></i>
                Start AI Analysis
              </button>
            </div>
          </div>
        </div>
      </div>
    `

    document.getElementById('start-analysis').addEventListener('click', () => this.runAIAnalysis())
    document.getElementById('refresh-analysis').addEventListener('click', () => this.runAIAnalysis())
  }

  async showPositions() {
    const content = document.getElementById('main-content')
    content.innerHTML = `
      <div class="space-y-6">
        <div class="bg-white rounded-lg shadow">
          <div class="px-6 py-4 border-b border-gray-200">
            <h2 class="text-2xl font-bold text-gray-900">Portfolio Positions</h2>
          </div>
          <div id="positions-table" class="p-6">
            <div class="text-center py-8">
              <i class="fas fa-spinner fa-spin text-gray-400 text-2xl mb-2"></i>
              <p class="text-gray-500">Loading positions...</p>
            </div>
          </div>
        </div>
      </div>
    `

    await this.loadPositions()
  }

  async showRiskManagement() {
    const content = document.getElementById('main-content')
    content.innerHTML = `
      <div class="space-y-6">
        <div class="bg-white rounded-lg shadow p-6">
          <h2 class="text-2xl font-bold text-gray-900 mb-6">
            <i class="fas fa-shield-alt mr-2 text-red-600"></i>
            Risk Management Center
          </h2>
          
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <h3 class="text-lg font-medium text-gray-900 mb-4">Risk Metrics</h3>
              <div id="risk-metrics" class="space-y-4">
                <div class="text-center py-8">
                  <i class="fas fa-spinner fa-spin text-gray-400 text-2xl mb-2"></i>
                  <p class="text-gray-500">Loading risk metrics...</p>
                </div>
              </div>
            </div>
            
            <div>
              <h3 class="text-lg font-medium text-gray-900 mb-4">Position Sizing Calculator</h3>
              <div id="position-sizing-calc">
                <form id="position-size-form" class="space-y-4">
                  <div>
                    <label class="block text-sm font-medium text-gray-700">Symbol</label>
                    <input type="text" id="calc-symbol" class="mt-1 block w-full rounded-md border-gray-300" placeholder="AAPL">
                  </div>
                  <div class="grid grid-cols-2 gap-4">
                    <div>
                      <label class="block text-sm font-medium text-gray-700">Entry Price</label>
                      <input type="number" id="calc-entry" class="mt-1 block w-full rounded-md border-gray-300" placeholder="150.00">
                    </div>
                    <div>
                      <label class="block text-sm font-medium text-gray-700">Stop Loss</label>
                      <input type="number" id="calc-stop" class="mt-1 block w-full rounded-md border-gray-300" placeholder="145.00">
                    </div>
                  </div>
                  <button type="submit" class="btn-primary w-full">
                    <i class="fas fa-calculator mr-2"></i>
                    Calculate Position Size
                  </button>
                </form>
                
                <div id="position-size-result" class="mt-4 hidden">
                  <!-- Results will show here -->
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `

    document.getElementById('position-size-form').addEventListener('submit', (e) => this.calculatePositionSize(e))
    await this.loadRiskMetrics()
  }

  async showBacktesting() {
    const content = document.getElementById('main-content')
    content.innerHTML = `
      <div class="space-y-6">
        <div class="bg-white rounded-lg shadow p-6">
          <h2 class="text-2xl font-bold text-gray-900 mb-6">
            <i class="fas fa-history mr-2 text-purple-600"></i>
            Strategy Backtesting
          </h2>
          <div class="text-center py-12">
            <i class="fas fa-flask text-6xl text-purple-600 mb-4"></i>
            <h3 class="text-xl font-medium text-gray-900 mb-2">Backtesting Engine</h3>
            <p class="text-gray-600 mb-6">Test your trading strategies against historical data</p>
            <p class="text-sm text-gray-500">Coming Soon - Advanced backtesting capabilities</p>
          </div>
        </div>
      </div>
    `
  }

  // API Methods for Advanced Features

  async generateAIAnalysis() {
    if (!this.selectedPortfolioId) {
      this.showNotification('Please select a portfolio first', 'warning')
      return
    }

    try {
      this.showNotification('🚀 Generating AI analysis...', 'info')
      
      const response = await axios.post(`/api/advanced/ai-analysis/${this.selectedPortfolioId}`)
      
      if (response.data.success) {
        this.showNotification(`✅ AI analysis complete: ${response.data.summary.total_recommendations} recommendations`, 'success')
        
        // Update recommendations display if on dashboard
        if (this.currentPage === 'dashboard') {
          this.displayRecommendations(response.data.recommendations)
        }
      }
    } catch (error) {
      console.error('AI analysis error:', error)
      this.showNotification('❌ AI analysis failed', 'error')
    }
  }

  async runAIAnalysis() {
    if (!this.selectedPortfolioId) {
      this.showNotification('Please select a portfolio first', 'warning')
      return
    }

    const resultsDiv = document.getElementById('ai-analysis-results')
    resultsDiv.innerHTML = `
      <div class="text-center py-12">
        <div class="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
          <i class="fas fa-robot text-2xl text-blue-600 animate-pulse"></i>
        </div>
        <h3 class="text-xl font-medium text-gray-900 mb-2">AI Analysis in Progress</h3>
        <p class="text-gray-600 mb-4">Processing multi-timeframe analysis and generating recommendations...</p>
        <div class="w-64 bg-gray-200 rounded-full h-2 mx-auto">
          <div class="bg-blue-600 h-2 rounded-full animate-pulse" style="width: 45%"></div>
        </div>
      </div>
    `

    try {
      const response = await axios.post(`/api/advanced/ai-analysis/${this.selectedPortfolioId}`)
      
      if (response.data.success) {
        this.displayAIAnalysisResults(response.data)
      }
    } catch (error) {
      console.error('AI analysis error:', error)
      resultsDiv.innerHTML = `
        <div class="text-center py-12">
          <i class="fas fa-exclamation-triangle text-6xl text-red-600 mb-4"></i>
          <h3 class="text-xl font-medium text-gray-900 mb-2">Analysis Failed</h3>
          <p class="text-gray-600">Unable to complete AI analysis. Please try again.</p>
        </div>
      `
    }
  }

  displayAIAnalysisResults(data) {
    const resultsDiv = document.getElementById('ai-analysis-results')
    const { recommendations, summary } = data
    
    resultsDiv.innerHTML = `
      <div class="space-y-6">
        <!-- Summary Stats -->
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div class="bg-green-50 p-4 rounded-lg">
            <div class="text-2xl font-bold text-green-600">${summary.buy_signals}</div>
            <div class="text-sm text-green-700">Buy Signals</div>
          </div>
          <div class="bg-red-50 p-4 rounded-lg">
            <div class="text-2xl font-bold text-red-600">${summary.sell_signals}</div>
            <div class="text-sm text-red-700">Sell Signals</div>
          </div>
          <div class="bg-yellow-50 p-4 rounded-lg">
            <div class="text-2xl font-bold text-yellow-600">${summary.hold_signals}</div>
            <div class="text-sm text-yellow-700">Hold Signals</div>
          </div>
          <div class="bg-blue-50 p-4 rounded-lg">
            <div class="text-2xl font-bold text-blue-600">${(summary.avg_confidence * 100).toFixed(0)}%</div>
            <div class="text-sm text-blue-700">Avg Confidence</div>
          </div>
        </div>
        
        <!-- Recommendations List -->
        <div class="space-y-4">
          ${recommendations.map(rec => `
            <div class="border rounded-lg p-4 ${this.getRecommendationBorderColor(rec.action)}">
              <div class="flex items-center justify-between">
                <div class="flex items-center space-x-4">
                  <div class="flex items-center space-x-2">
                    <span class="font-bold text-lg">${rec.symbol}</span>
                    <span class="px-2 py-1 rounded text-sm font-medium ${this.getRecommendationBadgeColor(rec.action)}">
                      ${rec.action}
                    </span>
                  </div>
                  <div class="text-sm text-gray-600">
                    Confidence: ${(rec.confidence_level * 100).toFixed(0)}%
                  </div>
                </div>
                <div class="text-right">
                  <div class="font-medium">$${rec.entry_price?.toFixed(2) || 'N/A'}</div>
                  <div class="text-sm text-gray-500">${rec.time_horizon || '1w'} horizon</div>
                </div>
              </div>
              
              <div class="mt-3 grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div>
                  <h4 class="font-medium text-gray-900 mb-2">Key Factors</h4>
                  <div class="space-y-1">
                    ${rec.reasoning?.technical_factors?.slice(0, 2).map(factor => 
                      `<div class="text-sm text-gray-600">• ${factor}</div>`
                    ).join('') || ''}
                  </div>
                </div>
                <div>
                  <h4 class="font-medium text-gray-900 mb-2">Risk Management</h4>
                  <div class="text-sm text-gray-600">
                    <div>Target: $${rec.target_prices?.[0]?.toFixed(2) || 'N/A'}</div>
                    <div>Stop Loss: $${rec.stop_loss?.toFixed(2) || 'N/A'}</div>
                    <div>R/R Ratio: ${rec.risk_reward_ratio?.toFixed(1) || 'N/A'}:1</div>
                  </div>
                </div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `
  }

  async generateTechnicalAnalysis() {
    const symbols = ['AAPL', 'MSFT', 'GOOGL', 'TSLA', 'NVDA'] // Default symbols
    
    try {
      this.showNotification('📊 Running multi-timeframe analysis...', 'info')
      
      const response = await axios.post('/api/advanced/batch-analysis', {
        symbols,
        analysis_type: 'technical'
      })
      
      if (response.data.success) {
        this.showNotification(`✅ Technical analysis complete: ${response.data.summary.successful}/${symbols.length} symbols`, 'success')
      }
    } catch (error) {
      console.error('Technical analysis error:', error)
      this.showNotification('❌ Technical analysis failed', 'error')
    }
  }

  async generateRiskAnalysis() {
    if (!this.selectedPortfolioId) {
      this.showNotification('Please select a portfolio first', 'warning')
      return
    }

    try {
      this.showNotification('🛡️ Analyzing portfolio risk...', 'info')
      
      const response = await axios.get(`/api/advanced/portfolio/${this.selectedPortfolioId}/risk-metrics`)
      
      if (response.data.success) {
        this.showNotification(`✅ Risk analysis complete: ${response.data.risk_alerts.length} alerts`, 'success')
      }
    } catch (error) {
      console.error('Risk analysis error:', error)
      this.showNotification('❌ Risk analysis failed', 'error')
    }
  }

  async calculatePositionSize(e) {
    e.preventDefault()
    
    const symbol = document.getElementById('calc-symbol').value
    const entryPrice = parseFloat(document.getElementById('calc-entry').value)
    const stopLoss = parseFloat(document.getElementById('calc-stop').value)
    
    if (!symbol || !entryPrice || !stopLoss) {
      this.showNotification('Please fill all fields', 'warning')
      return
    }

    try {
      const response = await axios.post('/api/advanced/risk/position-sizing', {
        portfolio_id: this.selectedPortfolioId,
        symbol: symbol.toUpperCase(),
        entry_price: entryPrice,
        target_price: entryPrice * 1.06, // 6% target
        stop_loss: stopLoss
      })

      if (response.data.success) {
        this.displayPositionSizeResult(response.data.position_sizing)
      }
    } catch (error) {
      console.error('Position sizing error:', error)
      this.showNotification('❌ Position sizing calculation failed', 'error')
    }
  }

  displayPositionSizeResult(sizing) {
    const resultDiv = document.getElementById('position-size-result')
    resultDiv.className = 'mt-4 p-4 bg-blue-50 rounded-lg'
    resultDiv.innerHTML = `
      <h4 class="font-medium text-blue-900 mb-2">Recommended Position Size</h4>
      <div class="space-y-2">
        <div class="flex justify-between">
          <span class="text-blue-700">Shares:</span>
          <span class="font-medium">${sizing.recommended_shares}</span>
        </div>
        <div class="flex justify-between">
          <span class="text-blue-700">Dollar Amount:</span>
          <span class="font-medium">$${sizing.recommended_dollar_amount.toFixed(2)}</span>
        </div>
        <div class="flex justify-between">
          <span class="text-blue-700">Portfolio %:</span>
          <span class="font-medium">${sizing.position_size_pct.toFixed(1)}%</span>
        </div>
        <div class="flex justify-between">
          <span class="text-blue-700">Risk per Share:</span>
          <span class="font-medium">$${sizing.risk_per_share.toFixed(2)}</span>
        </div>
      </div>
      <div class="mt-3 text-sm text-blue-700">
        Method: ${sizing.sizing_method} | ${sizing.reasoning?.[0] || 'Optimized sizing'}
      </div>
    `
  }

  // Helper Methods

  getRecommendationBorderColor(action) {
    const colors = {
      'BUY': 'border-green-200 bg-green-50',
      'SELL': 'border-red-200 bg-red-50', 
      'HOLD': 'border-yellow-200 bg-yellow-50',
      'REDUCE': 'border-orange-200 bg-orange-50',
      'INCREASE': 'border-blue-200 bg-blue-50'
    }
    return colors[action] || 'border-gray-200 bg-gray-50'
  }

  getRecommendationBadgeColor(action) {
    const colors = {
      'BUY': 'bg-green-100 text-green-800',
      'SELL': 'bg-red-100 text-red-800',
      'HOLD': 'bg-yellow-100 text-yellow-800',
      'REDUCE': 'bg-orange-100 text-orange-800',
      'INCREASE': 'bg-blue-100 text-blue-800'
    }
    return colors[action] || 'bg-gray-100 text-gray-800'
  }

  async loadDashboardData() {
    if (!this.selectedPortfolioId) return

    try {
      // Load portfolio overview
      const response = await axios.get(`/api/advanced/portfolio/${this.selectedPortfolioId}/overview`)
      
      if (response.data.success) {
        const { metrics, risk_alerts } = response.data
        
        // Update dashboard stats
        document.getElementById('portfolio-value').textContent = `$${metrics.total_value.toFixed(0)}`
        document.getElementById('daily-change').textContent = `${metrics.day_change >= 0 ? '+' : ''}${metrics.day_change_pct.toFixed(2)}%`
        document.getElementById('ai-confidence').textContent = `${(Math.random() * 30 + 65).toFixed(0)}%` // Mock AI confidence
        document.getElementById('risk-alerts').textContent = risk_alerts.length.toString()
        
        // Color code daily change
        const changeElement = document.getElementById('daily-change')
        changeElement.className = `text-2xl font-semibold ${metrics.day_change >= 0 ? 'text-green-600' : 'text-red-600'}`
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error)
    }

    // Load recent recommendations
    this.loadRecentRecommendations()
  }

  async loadRecentRecommendations() {
    try {
      const response = await axios.get(`/api/recommendations?portfolio_id=${this.selectedPortfolioId}&limit=5`)
      
      if (response.data.success && response.data.data.length > 0) {
        this.displayRecentRecommendations(response.data.data)
      } else {
        document.getElementById('recent-recommendations').innerHTML = `
          <div class="text-center py-8">
            <i class="fas fa-info-circle text-gray-400 text-2xl mb-2"></i>
            <p class="text-gray-500">No recent recommendations</p>
            <button class="mt-3 btn-primary" onclick="app.generateAIAnalysis()">
              Generate New Recommendations
            </button>
          </div>
        `
      }
    } catch (error) {
      console.error('Error loading recommendations:', error)
    }
  }

  displayRecentRecommendations(recommendations) {
    const container = document.getElementById('recent-recommendations')
    container.innerHTML = `
      <div class="space-y-3">
        ${recommendations.map(rec => `
          <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div class="flex items-center space-x-3">
              <span class="font-medium">${rec.ticker_symbol || 'N/A'}</span>
              <span class="px-2 py-1 rounded text-sm ${this.getRecommendationBadgeColor(rec.rec_type)}">
                ${rec.rec_type}
              </span>
            </div>
            <div class="text-right">
              <div class="text-sm font-medium">${rec.qty_suggested || 0} shares</div>
              <div class="text-xs text-gray-500">${new Date(rec.created_at).toLocaleDateString()}</div>
            </div>
          </div>
        `).join('')}
      </div>
    `
  }

  // Data Loading Methods

  async loadPortfolios() {
    try {
      const response = await axios.get('/api/portfolios')
      if (response.data.success) {
        this.portfolios = response.data.data
        if (this.portfolios.length > 0 && !this.selectedPortfolioId) {
          this.selectedPortfolioId = this.portfolios[0].id
        }
      }
    } catch (error) {
      console.error('Error loading portfolios:', error)
    }
  }

  async updateMarketRegime() {
    try {
      const response = await axios.get('/api/advanced/market/regime')
      if (response.data.success) {
        const regime = response.data.regime_analysis
        this.displayMarketRegime(regime)
      }
    } catch (error) {
      console.error('Error loading market regime:', error)
    }
  }

  displayMarketRegime(regime) {
    const regimeElement = document.getElementById('market-regime')
    if (!regimeElement) return

    const colors = {
      bull: 'bg-green-400',
      bear: 'bg-red-400', 
      sideways: 'bg-yellow-400'
    }

    regimeElement.innerHTML = `
      <div class="w-3 h-3 ${colors[regime.current_regime]} rounded-full animate-pulse"></div>
      <span class="text-sm font-medium text-gray-700">
        ${regime.current_regime.charAt(0).toUpperCase() + regime.current_regime.slice(1)} Market
      </span>
    `
  }

  // Notification System

  showNotification(message, type = 'info') {
    const container = document.getElementById('notifications')
    if (!container) return

    const notification = document.createElement('div')
    const colors = {
      info: 'bg-blue-500',
      success: 'bg-green-500',
      warning: 'bg-yellow-500',
      error: 'bg-red-500'
    }

    notification.className = `${colors[type]} text-white p-4 rounded-lg shadow-lg transform transition-all duration-300`
    notification.innerHTML = `
      <div class="flex items-center justify-between">
        <span class="text-sm font-medium">${message}</span>
        <button class="ml-4 text-white hover:text-gray-200">
          <i class="fas fa-times"></i>
        </button>
      </div>
    `

    // Add click to dismiss
    notification.querySelector('button').addEventListener('click', () => {
      notification.remove()
    })

    container.appendChild(notification)

    // Auto remove after 5 seconds
    setTimeout(() => {
      if (notification.parentNode) {
        notification.remove()
      }
    }, 5000)
  }

  // Real-time Updates

  startRealTimeUpdates() {
    // Update every 30 seconds
    this.realTimeUpdates = setInterval(() => {
      if (this.currentPage === 'dashboard') {
        this.loadDashboardData()
      }
      this.updateMarketRegime()
    }, 30000)
  }

  async refreshCurrentPage() {
    await this.navigateToPage(this.currentPage)
  }

  // Authentication Handlers

  async handleLogin(e) {
    e.preventDefault()
    
    const email = document.getElementById('email').value
    const password = document.getElementById('password').value
    
    try {
      const response = await axios.post('/auth/login', { email, password })
      
      if (response.data.success) {
        this.currentUser = response.data.data
        await this.showMainApp()
      } else {
        this.showAuthError(response.data.error || 'Login failed')
      }
    } catch (error) {
      console.error('Login error:', error)
      this.showAuthError('Login failed. Please try again.')
    }
  }

  async handleDemoLogin() {
    // Create demo user
    this.currentUser = {
      id: 'demo-user',
      name: 'Demo User',
      email: 'demo@example.com'
    }
    await this.showMainApp()
  }

  showAuthError(message) {
    const errorDiv = document.getElementById('auth-error')
    errorDiv.textContent = message
    errorDiv.classList.remove('hidden')
    
    setTimeout(() => {
      errorDiv.classList.add('hidden')
    }, 5000)
  }
}

// Custom CSS additions
const customStyles = `
<style>
.btn-primary {
  @apply bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-4 py-2 rounded-lg font-medium hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 flex items-center justify-center;
}

.btn-secondary {
  @apply bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-50 transition-colors duration-200 flex items-center justify-center;
}

.nav-link {
  @apply text-gray-500 hover:text-gray-700 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200;
}

.nav-link.active {
  @apply text-blue-600 bg-blue-50;
}
</style>
`

// Add custom styles to head
document.head.insertAdjacentHTML('beforeend', customStyles)

// Initialize the enhanced app
const app = new EnhancedTraderApp()

// Make app globally available for debugging
window.app = app