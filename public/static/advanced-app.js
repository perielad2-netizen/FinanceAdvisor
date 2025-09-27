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
      <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 py-4 px-4">
        <div class="max-w-md w-full bg-white rounded-xl shadow-lg overflow-hidden">
          <!-- Header -->
          <div class="text-center p-6 pb-4">
            <div class="mx-auto h-12 w-12 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mb-3">
              <i class="fas fa-robot text-lg text-white"></i>
            </div>
            <h2 class="text-2xl font-extrabold text-gray-900">AI Trader Advisor</h2>
            <p class="mt-1 text-sm text-gray-600">Advanced AI-powered trading intelligence</p>
          </div>
          
          <!-- Auth Mode Toggle -->
          <div class="flex mx-6 mb-4 bg-gray-100 rounded-lg p-1">
            <button id="login-tab" class="flex-1 py-2 px-4 text-sm font-medium rounded-md transition-all duration-200 bg-white text-blue-600 shadow-sm">
              Sign In
            </button>
            <button id="register-tab" class="flex-1 py-2 px-4 text-sm font-medium rounded-md transition-all duration-200 text-gray-500 hover:text-gray-700">
              Register
            </button>
          </div>
          
          <div class="px-6 pb-6">
            <div id="auth-error" class="hidden bg-red-100 border border-red-400 text-red-700 px-3 py-2 rounded mb-4 text-sm"></div>
            <div id="auth-success" class="hidden bg-green-100 border border-green-400 text-green-700 px-3 py-2 rounded mb-4 text-sm"></div>
            
            <!-- Login Form -->
            <form id="login-form" class="space-y-4">
              <div class="space-y-3">
                <input type="email" id="login-email" required 
                  class="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  placeholder="Email address">
                <input type="password" id="login-password" required
                  class="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  placeholder="Password">
              </div>
              
              <button type="submit" 
                class="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white py-3 px-4 rounded-lg hover:from-blue-600 hover:to-indigo-700 font-medium transition-all duration-200 text-sm">
                <i class="fas fa-sign-in-alt mr-2"></i>
                Sign In to AI Platform
              </button>
            </form>
            
            <!-- Registration Form -->
            <form id="register-form" class="space-y-4 hidden">
              <div class="space-y-3">
                <input type="text" id="register-name" required 
                  class="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  placeholder="Full Name">
                <input type="email" id="register-email" required 
                  class="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  placeholder="Email address (for recommendations)">
                <div class="flex space-x-2">
                  <select id="country-code" required class="px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white" style="min-width: 100px;">
                    <option value="+972">🇮🇱 +972</option>
                    <option value="+1">🇺🇸 +1</option>
                    <option value="+44">🇬🇧 +44</option>
                    <option value="+33">🇫🇷 +33</option>
                    <option value="+49">🇩🇪 +49</option>
                    <option value="+39">🇮🇹 +39</option>
                    <option value="+34">🇪🇸 +34</option>
                    <option value="+31">🇳🇱 +31</option>
                    <option value="+32">🇧🇪 +32</option>
                    <option value="+41">🇨🇭 +41</option>
                    <option value="+43">🇦🇹 +43</option>
                    <option value="+45">🇩🇰 +45</option>
                    <option value="+46">🇸🇪 +46</option>
                    <option value="+47">🇳🇴 +47</option>
                    <option value="+358">🇫🇮 +358</option>
                    <option value="+7">🇷🇺 +7</option>
                    <option value="+86">🇨🇳 +86</option>
                    <option value="+81">🇯🇵 +81</option>
                    <option value="+82">🇰🇷 +82</option>
                    <option value="+91">🇮🇳 +91</option>
                    <option value="+61">🇦🇺 +61</option>
                    <option value="+64">🇳🇿 +64</option>
                    <option value="+55">🇧🇷 +55</option>
                    <option value="+54">🇦🇷 +54</option>
                    <option value="+52">🇲🇽 +52</option>
                    <option value="+27">🇿🇦 +27</option>
                    <option value="+20">🇪🇬 +20</option>
                    <option value="+971">🇦🇪 +971</option>
                    <option value="+966">🇸🇦 +966</option>
                    <option value="+90">🇹🇷 +90</option>
                  </select>
                  <input type="tel" id="register-phone" required
                    class="flex-1 px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    placeholder="Phone number (e.g., 501234567)"
                    pattern="[0-9]{7,12}"
                    title="Enter phone number without country code">
                </div>
                <div class="text-xs text-gray-500 mt-1">
                  <span id="phone-preview">Example: +972 501234567</span>
                </div>
                <input type="password" id="register-password" required
                  class="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  placeholder="Password (min 6 characters)">
                <input type="password" id="register-confirm" required
                  class="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  placeholder="Confirm Password">
              </div>
              
              <div class="flex items-start space-x-2">
                <input type="checkbox" id="terms-checkbox" required class="mt-1 rounded border-gray-300">
                <label for="terms-checkbox" class="text-xs text-gray-600">
                  I agree to receive AI trading recommendations via email, Telegram, and WhatsApp notifications to my provided phone number
                </label>
              </div>
              
              <button type="submit" 
                class="w-full bg-gradient-to-r from-green-500 to-green-600 text-white py-3 px-4 rounded-lg hover:from-green-600 hover:to-green-700 font-medium transition-all duration-200 text-sm">
                <i class="fas fa-user-plus mr-2"></i>
                Create AI Trading Account
              </button>
            </form>
            
            <div class="text-center mt-4">
              <button type="button" id="demo-login" 
                class="text-blue-600 hover:text-blue-700 text-sm font-medium">
                <i class="fas fa-play-circle mr-1"></i>
                Try Demo Account (No Registration)
              </button>
            </div>
          </div>
        </div>
      </div>
    `

    // Setup form handlers
    this.setupAuthHandlers()
  }

  setupAuthHandlers() {
    const loginTab = document.getElementById('login-tab')
    const registerTab = document.getElementById('register-tab')
    const loginForm = document.getElementById('login-form')
    const registerForm = document.getElementById('register-form')
    
    // Tab switching
    loginTab.addEventListener('click', () => {
      loginTab.className = 'flex-1 py-2 px-4 text-sm font-medium rounded-md transition-all duration-200 bg-white text-blue-600 shadow-sm'
      registerTab.className = 'flex-1 py-2 px-4 text-sm font-medium rounded-md transition-all duration-200 text-gray-500 hover:text-gray-700'
      loginForm.classList.remove('hidden')
      registerForm.classList.add('hidden')
      this.hideAuthMessages()
    })
    
    registerTab.addEventListener('click', () => {
      registerTab.className = 'flex-1 py-2 px-4 text-sm font-medium rounded-md transition-all duration-200 bg-white text-green-600 shadow-sm'
      loginTab.className = 'flex-1 py-2 px-4 text-sm font-medium rounded-md transition-all duration-200 text-gray-500 hover:text-gray-700'
      registerForm.classList.remove('hidden')
      loginForm.classList.add('hidden')
      this.hideAuthMessages()
    })
    
    // Form handlers
    loginForm.addEventListener('submit', (e) => this.handleLogin(e))
    registerForm.addEventListener('submit', (e) => this.handleRegister(e))
    document.getElementById('demo-login').addEventListener('click', () => this.handleDemoLogin())
    
    // Phone number preview handler
    const countryCodeSelect = document.getElementById('country-code')
    const phonePreview = document.getElementById('phone-preview')
    
    const updatePhonePreview = () => {
      const code = countryCodeSelect.value
      const examples = {
        '+972': '+972 501234567',
        '+1': '+1 5551234567',
        '+44': '+44 7700900123',
        '+33': '+33 612345678',
        '+49': '+49 1511234567',
        '+39': '+39 3123456789',
        '+34': '+34 612345678',
        '+31': '+31 612345678',
        '+32': '+32 470123456',
        '+41': '+41 781234567',
        '+43': '+43 6601234567',
        '+45': '+45 20123456',
        '+46': '+46 701234567',
        '+47': '+47 40123456',
        '+358': '+358 401234567',
        '+7': '+7 9123456789',
        '+86': '+86 13812345678',
        '+81': '+81 9012345678',
        '+82': '+82 1012345678',
        '+91': '+91 9876543210',
        '+61': '+61 412345678',
        '+64': '+64 21123456',
        '+55': '+55 11987654321',
        '+54': '+54 91123456789',
        '+52': '+52 5512345678',
        '+27': '+27 821234567',
        '+20': '+20 1012345678',
        '+971': '+971 501234567',
        '+966': '+966 501234567',
        '+90': '+90 5321234567'
      }
      phonePreview.textContent = `Example: ${examples[code] || code + ' 1234567890'}`
    }
    
    countryCodeSelect.addEventListener('change', updatePhonePreview)
    updatePhonePreview() // Set initial example
  }

  hideAuthMessages() {
    document.getElementById('auth-error').classList.add('hidden')
    document.getElementById('auth-success').classList.add('hidden')
  }

  showAuthMessage(message, type = 'error') {
    this.hideAuthMessages()
    const element = document.getElementById(`auth-${type}`)
    element.textContent = message
    element.classList.remove('hidden')
  }

  async handleRegister(e) {
    e.preventDefault()
    
    const name = document.getElementById('register-name').value.trim()
    const email = document.getElementById('register-email').value.trim()
    const countryCode = document.getElementById('country-code').value
    const phoneNumber = document.getElementById('register-phone').value.trim()
    const password = document.getElementById('register-password').value
    const confirmPassword = document.getElementById('register-confirm').value
    const termsAccepted = document.getElementById('terms-checkbox').checked
    
    // Validation
    if (!name || !email || !phoneNumber || !password) {
      this.showAuthMessage('Please fill in all required fields including phone number')
      return
    }
    
    // Phone number validation (digits only, no country code)
    const phoneRegex = /^[0-9]{7,12}$/
    if (!phoneRegex.test(phoneNumber)) {
      this.showAuthMessage('Please enter a valid phone number (7-12 digits, numbers only)')
      return
    }
    
    // Combine country code with phone number
    const fullPhoneNumber = countryCode + phoneNumber
    
    if (password.length < 6) {
      this.showAuthMessage('Password must be at least 6 characters long')
      return
    }
    
    if (password !== confirmPassword) {
      this.showAuthMessage('Passwords do not match')
      return
    }
    
    if (!termsAccepted) {
      this.showAuthMessage('Please accept the terms to receive recommendations')
      return
    }

    try {
      const response = await axios.post('/auth/register', {
        name,
        email,
        phone: fullPhoneNumber, // Send complete international number
        password,
        notification_preferences: {
          email: true,
          telegram: true,
          whatsapp: true,
          phone: true
        }
      })

      if (response.data.success) {
        this.showAuthMessage('Account created successfully! Please sign in.', 'success')
        
        // Switch to login tab after 2 seconds
        setTimeout(() => {
          document.getElementById('login-tab').click()
          document.getElementById('login-email').value = email
        }, 2000)
      } else {
        this.showAuthMessage(response.data.message || 'Registration failed')
      }
    } catch (error) {
      console.error('Registration error:', error)
      this.showAuthMessage(error.response?.data?.message || 'Registration failed. Please try again.')
    }
  }

  async handleLogin(e) {
    e.preventDefault()
    
    const email = document.getElementById('login-email').value.trim()
    const password = document.getElementById('login-password').value
    
    if (!email || !password) {
      this.showAuthMessage('Please fill in both email and password')
      return
    }

    try {
      const response = await axios.post('/auth/login', { email, password })
      
      if (response.data.success) {
        this.currentUser = response.data.data
        await this.showMainApp()
      } else {
        this.showAuthMessage(response.data.message || 'Login failed')
      }
    } catch (error) {
      console.error('Login error:', error)
      this.showAuthMessage(error.response?.data?.message || 'Login failed. Please try again.')
    }
  }

  async handleDemoLogin() {
    try {
      const response = await axios.post('/auth/demo-login')
      
      if (response.data.success) {
        this.currentUser = response.data.data
        await this.showMainApp()
      } else {
        this.showAuthMessage('Demo login failed. Please try again.')
      }
    } catch (error) {
      console.error('Demo login error:', error)
      this.showAuthMessage('Demo login failed. Please try again.')
    }
  }

  async showMainApp() {
    // Load portfolios first
    await this.loadPortfolios()
    
    document.getElementById('app').innerHTML = `
      <div class="min-h-screen bg-gray-50">
        <!-- Mobile-First Navigation Header -->
        <nav class="bg-white shadow-sm border-b border-gray-200">
          <div class="px-2 sm:px-4">
            <!-- Top Row: Logo + User + Menu Button -->
            <div class="flex items-center justify-between h-14">
              <!-- Logo -->
              <div class="flex items-center">
                <div class="h-8 w-8 bg-gradient-to-r from-blue-500 to-indigo-600 rounded flex items-center justify-center mr-2">
                  <i class="fas fa-robot text-white text-sm"></i>
                </div>
                <h1 class="text-lg sm:text-xl font-bold text-gray-900">AI Trader</h1>
              </div>
              
              <!-- Right Side: Status + Menu -->
              <div class="flex items-center space-x-2">
                <!-- Market Status (mobile compact) -->
                <div id="market-regime" class="flex items-center">
                  <div class="w-2 h-2 sm:w-3 sm:h-3 bg-green-400 rounded-full animate-pulse mr-1"></div>
                  <span class="text-xs sm:text-sm font-medium text-gray-700 hidden sm:inline">Bull</span>
                </div>
                
                <!-- User -->
                <div class="flex items-center">
                  <i class="fas fa-user-circle text-lg text-gray-600 mr-1"></i>
                  <span class="text-sm text-gray-700 hidden sm:inline">${this.currentUser.name}</span>
                </div>
                
                <!-- Mobile Menu Button -->
                <button id="mobile-menu-btn" class="sm:hidden p-2 text-gray-600">
                  <i class="fas fa-bars"></i>
                </button>
              </div>
            </div>
            
            <!-- Bottom Navigation (Mobile: Hidden by default, Desktop: Always visible) -->
            <div id="mobile-nav" class="hidden sm:flex justify-center border-t border-gray-100 py-2">
              <div class="flex space-x-1 sm:space-x-4 overflow-x-auto">
                <a href="#" class="nav-link active whitespace-nowrap" data-page="dashboard">
                  <i class="fas fa-chart-pie"></i><span class="ml-1 text-xs sm:text-sm">Dashboard</span>
                </a>
                <a href="#" class="nav-link whitespace-nowrap" data-page="analysis">
                  <i class="fas fa-brain"></i><span class="ml-1 text-xs sm:text-sm">AI</span>
                </a>
                <a href="#" class="nav-link whitespace-nowrap" data-page="positions">
                  <i class="fas fa-briefcase"></i><span class="ml-1 text-xs sm:text-sm">Positions</span>
                </a>
                <a href="#" class="nav-link whitespace-nowrap" data-page="risk">
                  <i class="fas fa-shield-alt"></i><span class="ml-1 text-xs sm:text-sm">Risk</span>
                </a>
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
    // Mobile menu toggle
    const mobileMenuBtn = document.getElementById('mobile-menu-btn')
    const mobileNav = document.getElementById('mobile-nav')
    
    if (mobileMenuBtn) {
      mobileMenuBtn.addEventListener('click', () => {
        mobileNav.classList.toggle('hidden')
        const icon = mobileMenuBtn.querySelector('i')
        icon.className = mobileNav.classList.contains('hidden') ? 'fas fa-bars' : 'fas fa-times'
      })
    }
    
    // Navigation links
    document.querySelectorAll('.nav-link').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault()
        
        // Update active state
        document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'))
        link.classList.add('active')
        
        // Hide mobile menu after selection
        if (window.innerWidth < 640) {
          mobileNav.classList.add('hidden')
          mobileMenuBtn.querySelector('i').className = 'fas fa-bars'
        }
        
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
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
          <div class="bg-white rounded-lg shadow p-3 sm:p-6">
            <div class="flex items-center">
              <div class="p-1 sm:p-2 bg-green-100 rounded-lg">
                <i class="fas fa-dollar-sign text-green-600 text-sm"></i>
              </div>
              <div class="ml-2 sm:ml-4 min-w-0 flex-1">
                <p class="text-xs sm:text-sm font-medium text-gray-500 truncate">Portfolio</p>
                <p id="portfolio-value" class="text-lg sm:text-2xl font-semibold text-gray-900">$125,430</p>
              </div>
            </div>
          </div>
          
          <div class="bg-white rounded-lg shadow p-3 sm:p-6">
            <div class="flex items-center">
              <div class="p-1 sm:p-2 bg-blue-100 rounded-lg">
                <i class="fas fa-chart-line text-blue-600 text-sm"></i>
              </div>
              <div class="ml-2 sm:ml-4 min-w-0 flex-1">
                <p class="text-xs sm:text-sm font-medium text-gray-500 truncate">Daily</p>
                <p id="daily-change" class="text-lg sm:text-2xl font-semibold text-green-600">+2.3%</p>
              </div>
            </div>
          </div>
          
          <div class="bg-white rounded-lg shadow p-3 sm:p-6">
            <div class="flex items-center">
              <div class="p-1 sm:p-2 bg-purple-100 rounded-lg">
                <i class="fas fa-robot text-purple-600 text-sm"></i>
              </div>
              <div class="ml-2 sm:ml-4 min-w-0 flex-1">
                <p class="text-xs sm:text-sm font-medium text-gray-500 truncate">AI Score</p>
                <p id="ai-confidence" class="text-lg sm:text-2xl font-semibold text-purple-600">87%</p>
              </div>
            </div>
          </div>
          
          <div class="bg-white rounded-lg shadow p-3 sm:p-6">
            <div class="flex items-center">
              <div class="p-1 sm:p-2 bg-yellow-100 rounded-lg">
                <i class="fas fa-exclamation-triangle text-yellow-600 text-sm"></i>
              </div>
              <div class="ml-2 sm:ml-4 min-w-0 flex-1">
                <p class="text-xs sm:text-sm font-medium text-gray-500 truncate">Alerts</p>
                <p id="risk-alerts" class="text-lg sm:text-2xl font-semibold text-yellow-600">3</p>
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
        
        <!-- Telegram Automation & Scheduler -->
        <div class="bg-white rounded-lg shadow p-4 sm:p-6">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-base sm:text-lg font-medium text-gray-900 flex items-center">
              <i class="fab fa-telegram-plane mr-2 text-blue-500"></i>
              <span class="hidden sm:inline">Telegram Automation</span>
              <span class="sm:hidden">Telegram</span>
            </h3>
            <div class="flex items-center space-x-2">
              <span id="scheduler-status" class="text-xs sm:text-sm text-gray-500 hidden sm:inline">Checking...</span>
              <div id="scheduler-indicator" class="w-3 h-3 bg-gray-400 rounded-full"></div>
            </div>
          </div>
          
          <!-- Mobile: 2x3 grid, Desktop: 5x1 grid -->
          <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-4">
            <button id="generate-now-btn" class="bg-gradient-to-r from-green-500 to-green-600 text-white px-2 sm:px-4 py-2 sm:py-3 rounded-lg hover:from-green-600 hover:to-green-700 transition-all duration-200 flex items-center justify-center font-medium shadow-md text-sm">
              <i class="fas fa-bolt mr-1 sm:mr-2"></i>
              <span class="hidden sm:inline">Generate Now</span>
              <span class="sm:hidden">Generate</span>
            </button>
            <button id="start-scheduler-btn" class="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-2 sm:px-4 py-2 sm:py-3 rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200 flex items-center justify-center font-medium shadow-md text-sm">
              <i class="fas fa-play mr-1 sm:mr-2"></i>
              <span class="hidden sm:inline">Start Auto</span>
              <span class="sm:hidden">Start</span>
            </button>
            <button id="stop-scheduler-btn" class="bg-gradient-to-r from-red-500 to-red-600 text-white px-2 sm:px-4 py-2 sm:py-3 rounded-lg hover:from-red-600 hover:to-red-700 transition-all duration-200 flex items-center justify-center font-medium shadow-md text-sm">
              <i class="fas fa-stop mr-1 sm:mr-2"></i>
              <span class="hidden sm:inline">Stop Auto</span>
              <span class="sm:hidden">Stop</span>
            </button>
            <button id="test-telegram-btn" class="bg-gradient-to-r from-purple-500 to-purple-600 text-white px-2 sm:px-4 py-2 sm:py-3 rounded-lg hover:from-purple-600 hover:to-purple-700 transition-all duration-200 flex items-center justify-center font-medium shadow-md text-sm">
              <i class="fab fa-telegram-plane mr-1 sm:mr-2"></i>
              <span class="hidden sm:inline">Test Bot</span>
              <span class="sm:hidden">Test</span>
            </button>
            <button id="scheduler-settings-btn" class="bg-gradient-to-r from-gray-500 to-gray-600 text-white px-2 sm:px-4 py-2 sm:py-3 rounded-lg hover:from-gray-600 hover:to-gray-700 transition-all duration-200 flex items-center justify-center font-medium shadow-md text-sm col-span-2 sm:col-span-1">
              <i class="fas fa-cog mr-1 sm:mr-2"></i>
              <span class="hidden sm:inline">Settings</span>
              <span class="sm:hidden">Settings</span>
            </button>
          </div>
          
          <!-- Scheduler Status Panel -->
          <div id="scheduler-info" class="mt-4 p-3 sm:p-4 bg-gray-50 rounded-lg">
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 text-xs sm:text-sm">
              <div class="flex justify-between sm:block">
                <span class="text-gray-600">Last Run:</span>
                <span id="last-run-time" class="font-medium sm:ml-2">Never</span>
              </div>
              <div class="flex justify-between sm:block">
                <span class="text-gray-600">Next Run:</span>
                <span id="next-run-time" class="font-medium sm:ml-2">Not scheduled</span>
              </div>
              <div class="flex justify-between sm:block">
                <span class="text-gray-600">Interval:</span>
                <span id="run-interval" class="font-medium sm:ml-2">2 hours</span>
              </div>
            </div>
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
    
    // Setup scheduler button handlers
    document.getElementById('generate-now-btn').addEventListener('click', () => this.generateRecommendationsNow())
    document.getElementById('start-scheduler-btn').addEventListener('click', () => this.startScheduler())
    document.getElementById('stop-scheduler-btn').addEventListener('click', () => this.stopScheduler())
    document.getElementById('test-telegram-btn').addEventListener('click', () => this.testTelegram())
    document.getElementById('scheduler-settings-btn').addEventListener('click', () => this.showSchedulerSettings())

    // Load dashboard data and check scheduler status
    await this.loadDashboardData()
    await this.updateSchedulerStatus()
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
        this.portfolios = response.data.data || []
        
        // If no portfolios exist, create a default one for new users
        if (this.portfolios.length === 0) {
          console.log('No portfolios found, creating default portfolio...')
          try {
            const createResponse = await axios.post('/api/portfolios', {
              name: 'My Portfolio',
              base_currency: 'USD'
            })
            if (createResponse.data.success) {
              this.portfolios = [createResponse.data.data]
            }
          } catch (createError) {
            console.log('Could not create default portfolio:', createError)
            // Use a mock portfolio for demo purposes
            this.portfolios = [{
              id: 'demo-portfolio',
              name: 'Demo Portfolio',
              base_currency: 'USD',
              total_value: 100000,
              advisor_mode: true
            }]
          }
        }
        
        if (this.portfolios.length > 0 && !this.selectedPortfolioId) {
          this.selectedPortfolioId = this.portfolios[0].id
        }
      } else {
        console.log('Portfolio API returned error:', response.data.error)
        // Use mock data for demo
        this.portfolios = [{
          id: 'demo-portfolio',
          name: 'Demo Portfolio', 
          base_currency: 'USD',
          total_value: 100000,
          advisor_mode: true
        }]
        this.selectedPortfolioId = this.portfolios[0].id
      }
    } catch (error) {
      console.error('Error loading portfolios:', error)
      // Fallback to mock data to prevent hanging
      this.portfolios = [{
        id: 'demo-portfolio',
        name: 'Demo Portfolio',
        base_currency: 'USD', 
        total_value: 100000,
        advisor_mode: true
      }]
      this.selectedPortfolioId = this.portfolios[0].id
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

  // ==================== SCHEDULER & TELEGRAM METHODS ====================

  /**
   * Generate recommendations manually (button click)
   */
  async generateRecommendationsNow() {
    try {
      this.showNotification('🚀 Generating recommendations now...', 'info')
      
      const response = await axios.post('/api/scheduler/generate-now', {
        settings: {
          maxRecommendationsPerSession: 10,
          minConfidenceLevel: 0.7,
          enableTelegramNotifications: true
        }
      })
      
      if (response.data.success) {
        const count = response.data.count || 0
        this.showNotification(`✅ Generated ${count} recommendations and sent Telegram notifications!`, 'success')
        
        // Update the recommendations display
        if (count > 0) {
          this.displayLatestRecommendations(response.data.recommendations)
        }
      } else {
        this.showNotification(`❌ Failed to generate recommendations: ${response.data.message}`, 'error')
      }
    } catch (error) {
      console.error('Manual generation error:', error)
      this.showNotification('❌ Failed to generate recommendations', 'error')
    }
  }

  /**
   * Start the automated scheduler
   */
  async startScheduler() {
    try {
      this.showNotification('🔄 Starting automated scheduler...', 'info')
      
      const response = await axios.post('/api/scheduler/start', {
        settings: {
          intervalMinutes: 120, // 2 hours
          marketHoursOnly: true,
          riskAllocation: { highRisk: 20, mediumRisk: 30, lowRisk: 50 },
          enableTelegramNotifications: true
        }
      })
      
      if (response.data.success) {
        this.showNotification('✅ Automated scheduler started! You will receive Telegram notifications every 2 hours during market hours.', 'success')
        await this.updateSchedulerStatus()
      } else {
        this.showNotification(`❌ Failed to start scheduler: ${response.data.message}`, 'error')
      }
    } catch (error) {
      console.error('Start scheduler error:', error)
      this.showNotification('❌ Failed to start scheduler', 'error')
    }
  }

  /**
   * Stop the automated scheduler
   */
  async stopScheduler() {
    try {
      this.showNotification('🛑 Stopping automated scheduler...', 'info')
      
      const response = await axios.post('/api/scheduler/stop')
      
      if (response.data.success) {
        this.showNotification('✅ Automated scheduler stopped', 'success')
        await this.updateSchedulerStatus()
      } else {
        this.showNotification(`❌ Failed to stop scheduler: ${response.data.message}`, 'error')
      }
    } catch (error) {
      console.error('Stop scheduler error:', error)
      this.showNotification('❌ Failed to stop scheduler', 'error')
    }
  }

  /**
   * Test Telegram bot connection
   */
  async testTelegram() {
    try {
      this.showNotification('📱 Testing Telegram bot connection...', 'info')
      
      const response = await axios.post('/api/scheduler/test-telegram')
      
      if (response.data.success) {
        this.showNotification(`✅ Telegram bot connected! Bot: ${response.data.botInfo?.username || 'Unknown'}`, 'success')
        
        // Send test notification
        await axios.post('/api/scheduler/send-test-notification')
        this.showNotification('📱 Test notification sent to your Telegram!', 'info')
      } else {
        this.showNotification(`❌ Telegram connection failed: ${response.data.error}`, 'error')
      }
    } catch (error) {
      console.error('Telegram test error:', error)
      this.showNotification('❌ Telegram test failed', 'error')
    }
  }

  /**
   * Update scheduler status display
   */
  async updateSchedulerStatus() {
    try {
      const response = await axios.get('/api/scheduler/status')
      
      if (response.data.success) {
        const status = response.data.status
        
        // Update status text and indicator
        const statusText = document.getElementById('scheduler-status')
        const indicator = document.getElementById('scheduler-indicator')
        const lastRunEl = document.getElementById('last-run-time')
        const nextRunEl = document.getElementById('next-run-time')
        
        if (statusText && indicator) {
          if (status.isRunning) {
            statusText.textContent = 'Status: Active'
            indicator.className = 'w-3 h-3 bg-green-500 rounded-full animate-pulse'
          } else {
            statusText.textContent = 'Status: Stopped'
            indicator.className = 'w-3 h-3 bg-gray-400 rounded-full'
          }
        }
        
        if (lastRunEl) {
          lastRunEl.textContent = status.lastRun 
            ? new Date(status.lastRun).toLocaleString() 
            : 'Never'
        }
        
        if (nextRunEl) {
          nextRunEl.textContent = status.nextRun 
            ? new Date(status.nextRun).toLocaleString()
            : 'Not scheduled'
        }
      }
    } catch (error) {
      console.error('Failed to update scheduler status:', error)
    }
  }

  /**
   * Show scheduler settings modal
   */
  async showSchedulerSettings() {
    try {
      // Load current settings
      const response = await axios.get('/api/scheduler/settings')
      const settings = response.data.settings || {
        intervalMinutes: 120,
        riskAllocation: { highRisk: 20, mediumRisk: 30, lowRisk: 50 },
        enableTelegramNotifications: true
      }
      
      // Create settings modal
      const modalHtml = `
        <div id="settings-modal" class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div class="relative top-20 mx-auto p-5 border w-full max-w-lg shadow-lg rounded-md bg-white">
            <div class="mt-3">
              <div class="flex items-center justify-between mb-4">
                <h3 class="text-lg font-medium text-gray-900">Scheduler Settings</h3>
                <button id="close-settings" class="text-gray-400 hover:text-gray-600">
                  <i class="fas fa-times text-xl"></i>
                </button>
              </div>
              
              <form id="settings-form" class="space-y-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">
                    Recommendation Interval (minutes)
                  </label>
                  <select id="interval-select" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="60" ${settings.intervalMinutes === 60 ? 'selected' : ''}>1 hour</option>
                    <option value="120" ${settings.intervalMinutes === 120 ? 'selected' : ''}>2 hours (recommended)</option>
                    <option value="240" ${settings.intervalMinutes === 240 ? 'selected' : ''}>4 hours</option>
                    <option value="360" ${settings.intervalMinutes === 360 ? 'selected' : ''}>6 hours</option>
                  </select>
                </div>
                
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">
                    Risk Allocation (must total 100%)
                  </label>
                  <div class="grid grid-cols-3 gap-2">
                    <div>
                      <label class="text-xs text-gray-600">High Risk</label>
                      <input id="high-risk" type="number" min="0" max="100" value="${settings.riskAllocation.highRisk}" 
                        class="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500">
                      <span class="text-xs text-gray-500">%</span>
                    </div>
                    <div>
                      <label class="text-xs text-gray-600">Medium Risk</label>
                      <input id="medium-risk" type="number" min="0" max="100" value="${settings.riskAllocation.mediumRisk}"
                        class="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500">
                      <span class="text-xs text-gray-500">%</span>
                    </div>
                    <div>
                      <label class="text-xs text-gray-600">Low Risk</label>
                      <input id="low-risk" type="number" min="0" max="100" value="${settings.riskAllocation.lowRisk}"
                        class="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500">
                      <span class="text-xs text-gray-500">%</span>
                    </div>
                  </div>
                  <p class="text-xs text-gray-500 mt-1">Default: 20% high-risk, 30% medium-risk, 50% low-risk</p>
                </div>
                
                <div class="flex items-center">
                  <input type="checkbox" id="telegram-notifications" ${settings.enableTelegramNotifications ? 'checked' : ''}
                    class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded">
                  <label for="telegram-notifications" class="ml-2 block text-sm text-gray-900">
                    Enable Telegram notifications
                  </label>
                </div>
                
                <div class="flex justify-end space-x-3 pt-4">
                  <button type="button" id="cancel-settings" 
                    class="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors">
                    Cancel
                  </button>
                  <button type="submit" 
                    class="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors">
                    Save Settings
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      `
      
      document.body.insertAdjacentHTML('beforeend', modalHtml)
      
      // Setup modal handlers
      document.getElementById('close-settings').addEventListener('click', this.closeSettingsModal)
      document.getElementById('cancel-settings').addEventListener('click', this.closeSettingsModal)
      document.getElementById('settings-form').addEventListener('submit', (e) => this.saveSchedulerSettings(e))
      
    } catch (error) {
      console.error('Failed to show settings:', error)
      this.showNotification('❌ Failed to load settings', 'error')
    }
  }

  /**
   * Close settings modal
   */
  closeSettingsModal() {
    const modal = document.getElementById('settings-modal')
    if (modal) {
      modal.remove()
    }
  }

  /**
   * Save scheduler settings
   */
  async saveSchedulerSettings(e) {
    e.preventDefault()
    
    try {
      const intervalMinutes = parseInt(document.getElementById('interval-select').value)
      const highRisk = parseInt(document.getElementById('high-risk').value)
      const mediumRisk = parseInt(document.getElementById('medium-risk').value)
      const lowRisk = parseInt(document.getElementById('low-risk').value)
      const enableTelegram = document.getElementById('telegram-notifications').checked
      
      // Validate risk allocation
      if (highRisk + mediumRisk + lowRisk !== 100) {
        this.showNotification('❌ Risk allocation must total 100%', 'error')
        return
      }
      
      const settings = {
        intervalMinutes,
        riskAllocation: { highRisk, mediumRisk, lowRisk },
        enableTelegramNotifications: enableTelegram
      }
      
      const response = await axios.post('/api/scheduler/settings', { settings })
      
      if (response.data.success) {
        this.showNotification('✅ Settings saved successfully', 'success')
        this.closeSettingsModal()
        
        // Update interval display
        const intervalEl = document.getElementById('run-interval')
        if (intervalEl) {
          const hours = Math.floor(intervalMinutes / 60)
          intervalEl.textContent = hours === 1 ? '1 hour' : `${hours} hours`
        }
      } else {
        this.showNotification(`❌ Failed to save settings: ${response.data.message}`, 'error')
      }
    } catch (error) {
      console.error('Save settings error:', error)
      this.showNotification('❌ Failed to save settings', 'error')
    }
  }

  /**
   * Display latest recommendations in the dashboard
   */
  displayLatestRecommendations(recommendations) {
    const container = document.getElementById('recent-recommendations')
    if (!container || !recommendations || recommendations.length === 0) return
    
    container.innerHTML = `
      <div class="space-y-3">
        ${recommendations.slice(0, 5).map(rec => `
          <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div class="flex items-center">
              <div class="w-10 h-10 bg-${rec.action === 'BUY' ? 'green' : 'red'}-100 rounded-lg flex items-center justify-center mr-3">
                <i class="fas fa-${rec.action === 'BUY' ? 'arrow-up text-green-600' : 'arrow-down text-red-600'}"></i>
              </div>
              <div>
                <div class="font-medium text-gray-900">${rec.symbol}</div>
                <div class="text-sm text-gray-600">${rec.action} at $${rec.entryPrice.toFixed(2)}</div>
              </div>
            </div>
            <div class="text-right">
              <div class="text-sm font-medium text-${rec.urgency === 'high' ? 'red' : rec.urgency === 'medium' ? 'yellow' : 'green'}-600">
                ${(rec.confidence * 100).toFixed(0)}% confidence
              </div>
              <div class="text-xs text-gray-500">${rec.urgency} urgency</div>
            </div>
          </div>
        `).join('')}
      </div>
    `
  }

  // ============ SCHEDULER & TELEGRAM METHODS ============
  
  /**
   * Generate recommendations manually (now button)
   */
  async generateRecommendationsNow() {
    try {
      this.showNotification('🎯 Generating recommendations manually...', 'info')
      
      const response = await axios.post('/api/scheduler/generate-now', {
        settings: {
          maxRecommendationsPerSession: 10,
          minConfidenceLevel: 0.7,
          enableTelegramNotifications: true
        }
      })
      
      if (response.data.success) {
        const count = response.data.count || 0
        this.showNotification(`✅ Generated ${count} recommendations successfully!`, 'success')
        
        if (count > 0) {
          // Display recent recommendations
          this.displayRecentRecommendations(response.data.recommendations)
        }
      } else {
        this.showNotification(`❌ ${response.data.message}`, 'error')
      }
    } catch (error) {
      console.error('Manual generation error:', error)
      this.showNotification('❌ Failed to generate recommendations', 'error')
    }
  }

  /**
   * Start automated scheduler
   */
  async startScheduler() {
    try {
      this.showNotification('🚀 Starting automated scheduler...', 'info')
      
      const response = await axios.post('/api/scheduler/start', {
        settings: {
          intervalMinutes: 120, // 2 hours
          marketHoursOnly: true,
          enableTelegramNotifications: true
        }
      })
      
      if (response.data.success) {
        this.showNotification('✅ Scheduler started successfully!', 'success')
        await this.updateSchedulerStatus()
      } else {
        this.showNotification(`❌ ${response.data.message}`, 'error')
      }
    } catch (error) {
      console.error('Scheduler start error:', error)
      this.showNotification('❌ Failed to start scheduler', 'error')
    }
  }

  /**
   * Stop automated scheduler
   */
  async stopScheduler() {
    try {
      this.showNotification('⏹️ Stopping scheduler...', 'info')
      
      const response = await axios.post('/api/scheduler/stop')
      
      if (response.data.success) {
        this.showNotification('✅ Scheduler stopped successfully!', 'success')
        await this.updateSchedulerStatus()
      } else {
        this.showNotification(`❌ ${response.data.message}`, 'error')
      }
    } catch (error) {
      console.error('Scheduler stop error:', error)
      this.showNotification('❌ Failed to stop scheduler', 'error')
    }
  }

  /**
   * Test Telegram bot connection
   */
  async testTelegram() {
    try {
      this.showNotification('🤖 Testing Telegram bot connection...', 'info')
      
      const response = await axios.post('/api/scheduler/test-telegram')
      
      if (response.data.success) {
        this.showNotification(`✅ ${response.data.message}`, 'success')
      } else {
        this.showNotification(`❌ ${response.data.message}`, 'error')
      }
    } catch (error) {
      console.error('Telegram test error:', error)
      this.showNotification('❌ Telegram test failed', 'error')
    }
  }

  /**
   * Update scheduler status display
   */
  async updateSchedulerStatus() {
    try {
      const response = await axios.get('/api/scheduler/status')
      
      if (response.data.success) {
        const status = response.data.status
        
        // Update status indicator
        const indicator = document.getElementById('scheduler-indicator')
        const statusText = document.getElementById('scheduler-status')
        
        if (status.isRunning) {
          indicator.className = 'w-3 h-3 bg-green-500 rounded-full animate-pulse'
          statusText.textContent = 'Status: Running'
        } else {
          indicator.className = 'w-3 h-3 bg-gray-400 rounded-full'
          statusText.textContent = 'Status: Stopped'
        }
        
        // Update time info
        document.getElementById('last-run-time').textContent = 
          status.lastRun ? new Date(status.lastRun).toLocaleString() : 'Never'
        document.getElementById('next-run-time').textContent = 
          status.nextRun ? new Date(status.nextRun).toLocaleString() : 'Not scheduled'
      }
    } catch (error) {
      console.error('Status update error:', error)
      // Don't show error notification for status updates
    }
  }

  /**
   * Show scheduler settings modal
   */
  showSchedulerSettings() {
    const modal = document.createElement('div')
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'
    modal.innerHTML = `
      <div class="bg-white rounded-lg shadow-xl p-6 w-full max-w-md mx-4">
        <div class="flex items-center justify-between mb-6">
          <h3 class="text-xl font-semibold text-gray-900">
            <i class="fas fa-cog mr-2 text-blue-600"></i>
            Scheduler Settings
          </h3>
          <button id="close-settings" class="text-gray-400 hover:text-gray-600">
            <i class="fas fa-times text-xl"></i>
          </button>
        </div>
        
        <form id="settings-form" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Recommendation Interval (minutes)
            </label>
            <select id="interval-setting" class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent">
              <option value="60">1 hour</option>
              <option value="120" selected>2 hours (default)</option>
              <option value="180">3 hours</option>
              <option value="240">4 hours</option>
              <option value="360">6 hours</option>
            </select>
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Risk Allocation
            </label>
            <div class="space-y-2">
              <div class="flex items-center justify-between">
                <span class="text-sm text-gray-600">High Risk:</span>
                <div class="flex items-center space-x-2">
                  <input type="range" id="high-risk-slider" min="0" max="50" value="20" class="flex-1">
                  <span id="high-risk-value" class="text-sm font-medium w-8">20%</span>
                </div>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-sm text-gray-600">Medium Risk:</span>
                <div class="flex items-center space-x-2">
                  <input type="range" id="medium-risk-slider" min="0" max="60" value="30" class="flex-1">
                  <span id="medium-risk-value" class="text-sm font-medium w-8">30%</span>
                </div>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-sm text-gray-600">Low Risk:</span>
                <div class="flex items-center space-x-2">
                  <input type="range" id="low-risk-slider" min="20" max="80" value="50" class="flex-1">
                  <span id="low-risk-value" class="text-sm font-medium w-8">50%</span>
                </div>
              </div>
            </div>
          </div>
          
          <div>
            <label class="flex items-center">
              <input type="checkbox" id="market-hours-only" checked class="mr-2 rounded">
              <span class="text-sm text-gray-700">Run only during market hours</span>
            </label>
          </div>
          
          <div>
            <label class="flex items-center">
              <input type="checkbox" id="telegram-notifications" checked class="mr-2 rounded">
              <span class="text-sm text-gray-700">Enable Telegram notifications</span>
            </label>
          </div>
          
          <div class="flex space-x-3 pt-4">
            <button type="submit" class="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors duration-200">
              Save Settings
            </button>
            <button type="button" id="cancel-settings" class="flex-1 bg-gray-200 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors duration-200">
              Cancel
            </button>
          </div>
        </form>
      </div>
    `
    
    document.body.appendChild(modal)
    
    // Setup slider handlers
    this.setupSettingsSliders()
    
    // Setup event listeners
    document.getElementById('close-settings').addEventListener('click', () => {
      document.body.removeChild(modal)
    })
    
    document.getElementById('cancel-settings').addEventListener('click', () => {
      document.body.removeChild(modal)
    })
    
    document.getElementById('settings-form').addEventListener('submit', (e) => {
      e.preventDefault()
      this.saveSchedulerSettings()
      document.body.removeChild(modal)
    })
    
    // Close modal when clicking outside
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        document.body.removeChild(modal)
      }
    })
  }

  /**
   * Setup settings sliders with real-time updates
   */
  setupSettingsSliders() {
    const highSlider = document.getElementById('high-risk-slider')
    const mediumSlider = document.getElementById('medium-risk-slider')
    const lowSlider = document.getElementById('low-risk-slider')
    
    const highValue = document.getElementById('high-risk-value')
    const mediumValue = document.getElementById('medium-risk-value')
    const lowValue = document.getElementById('low-risk-value')
    
    const updateValues = () => {
      const high = parseInt(highSlider.value)
      const medium = parseInt(mediumSlider.value)
      const low = 100 - high - medium
      
      // Ensure low is within bounds
      if (low < 20) {
        const excess = 20 - low
        if (medium >= excess) {
          mediumSlider.value = medium - excess
        } else {
          highSlider.value = high - (excess - medium)
          mediumSlider.value = 0
        }
        return updateValues() // Recalculate
      }
      
      lowSlider.value = low
      
      highValue.textContent = high + '%'
      mediumValue.textContent = medium + '%'
      lowValue.textContent = low + '%'
    }
    
    highSlider.addEventListener('input', updateValues)
    mediumSlider.addEventListener('input', updateValues)
    lowSlider.addEventListener('input', updateValues)
  }

  /**
   * Save scheduler settings
   */
  async saveSchedulerSettings() {
    try {
      const settings = {
        intervalMinutes: parseInt(document.getElementById('interval-setting').value),
        marketHoursOnly: document.getElementById('market-hours-only').checked,
        enableTelegramNotifications: document.getElementById('telegram-notifications').checked,
        riskAllocation: {
          highRisk: parseInt(document.getElementById('high-risk-slider').value),
          mediumRisk: parseInt(document.getElementById('medium-risk-slider').value),
          lowRisk: parseInt(document.getElementById('low-risk-slider').value)
        }
      }
      
      const response = await axios.post('/api/scheduler/settings', { settings })
      
      if (response.data.success) {
        this.showNotification('✅ Settings saved successfully!', 'success')
        
        // Update interval display
        const hours = Math.floor(settings.intervalMinutes / 60)
        const minutes = settings.intervalMinutes % 60
        let intervalText = ''
        if (hours > 0) intervalText += hours + ' hour' + (hours > 1 ? 's' : '')
        if (minutes > 0) intervalText += (hours > 0 ? ' ' : '') + minutes + ' min'
        document.getElementById('run-interval').textContent = intervalText
        
      } else {
        this.showNotification(`❌ ${response.data.message}`, 'error')
      }
    } catch (error) {
      console.error('Settings save error:', error)
      this.showNotification('❌ Failed to save settings', 'error')
    }
  }

  /**
   * Display recent recommendations in the dashboard
   */
  displayRecentRecommendations(recommendations) {
    if (!recommendations || recommendations.length === 0) return
    
    const container = document.getElementById('recent-recommendations')
    container.innerHTML = `
      <div class="space-y-4">
        ${recommendations.slice(0, 5).map(rec => `
          <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div class="flex items-center">
              <div class="w-10 h-10 bg-${rec.action === 'BUY' ? 'green' : 'red'}-100 rounded-lg flex items-center justify-center mr-3">
                <i class="fas fa-${rec.action === 'BUY' ? 'arrow-up text-green-600' : 'arrow-down text-red-600'}"></i>
              </div>
              <div>
                <div class="font-medium text-gray-900">${rec.symbol}</div>
                <div class="text-sm text-gray-600">${rec.action} at $${rec.entryPrice.toFixed(2)}</div>
              </div>
            </div>
            <div class="text-right">
              <div class="text-sm font-medium text-${rec.urgency === 'high' ? 'red' : rec.urgency === 'medium' ? 'yellow' : 'green'}-600">
                ${(rec.confidence * 100).toFixed(0)}% confidence
              </div>
              <div class="text-xs text-gray-500">${rec.urgency} urgency</div>
            </div>
          </div>
        `).join('')}
        ${recommendations.length > 5 ? `
          <div class="text-center pt-2">
            <span class="text-sm text-gray-500">+${recommendations.length - 5} more recommendations sent to Telegram</span>
          </div>
        ` : ''}
      </div>
    `
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
  @apply text-gray-500 hover:text-gray-700 px-2 sm:px-3 py-2 rounded-md text-xs sm:text-sm font-medium transition-colors duration-200 flex items-center justify-center min-w-0 flex-shrink-0;
}

.nav-link.active {
  @apply text-blue-600 bg-blue-50;
}

/* Mobile navigation */
@media (max-width: 640px) {
  #mobile-nav.hidden {
    display: none !important;
  }
  #mobile-nav {
    display: flex !important;
  }
}
</style>
`

// Add custom styles to head
document.head.insertAdjacentHTML('beforeend', customStyles)

// Initialize the enhanced app
const app = new EnhancedTraderApp()

// Make app globally available for debugging
window.app = app