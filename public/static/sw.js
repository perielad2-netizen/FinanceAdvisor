// Service Worker for Push Notifications
// This enables the app to receive push notifications even when closed

const CACHE_NAME = 'trader-advisor-v1'
const urlsToCache = [
  '/',
  '/static/advanced-app.js',
  '/static/styles.css',
  '/static/manifest.json'
]

// Install event - cache resources
self.addEventListener('install', (event) => {
  console.log('🔧 Service Worker: Installing...')
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('🔧 Service Worker: Caching app shell')
        return cache.addAll(urlsToCache)
      })
  )
})

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('🔧 Service Worker: Activating...')
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('🔧 Service Worker: Deleting old cache:', cacheName)
            return caches.delete(cacheName)
          }
        })
      )
    })
  )
})

// Fetch event - serve from cache when offline
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version or fetch from network
        return response || fetch(event.request)
      })
  )
})

// Push event - handle incoming push notifications
self.addEventListener('push', (event) => {
  console.log('📱 Service Worker: Push received')
  
  let data = {}
  if (event.data) {
    try {
      data = event.data.json()
    } catch (e) {
      data = { title: 'Trading Recommendation', body: event.data.text() }
    }
  }

  const options = {
    title: data.title || '📈 AI Trading Recommendation',
    body: data.body || 'You have new trading recommendations available.',
    icon: '/static/favicon.ico',
    badge: '/static/favicon.ico',
    tag: 'trading-recommendation',
    data: {
      url: data.url || '/',
      timestamp: Date.now(),
      ...data
    },
    actions: [
      {
        action: 'view',
        title: 'View Recommendations',
        icon: '/static/favicon.ico'
      },
      {
        action: 'dismiss',
        title: 'Dismiss',
        icon: '/static/favicon.ico'
      }
    ],
    requireInteraction: true, // Keep notification visible until user interacts
    vibrate: [200, 100, 200], // Vibration pattern for mobile
    silent: false
  }

  event.waitUntil(
    self.registration.showNotification(data.title || '📈 Trading Recommendation', options)
  )
})

// Notification click event - handle user interaction
self.addEventListener('notificationclick', (event) => {
  console.log('📱 Service Worker: Notification clicked')
  
  event.notification.close()

  if (event.action === 'view') {
    // Open the app and navigate to recommendations
    event.waitUntil(
      clients.openWindow(event.notification.data.url || '/')
    )
  } else if (event.action === 'dismiss') {
    // Just close the notification
    console.log('📱 Service Worker: Notification dismissed')
  } else {
    // Default action - open the app
    event.waitUntil(
      clients.openWindow('/')
    )
  }
})

// Background sync event - for when the user is offline
self.addEventListener('sync', (event) => {
  console.log('🔄 Service Worker: Background sync triggered')
  
  if (event.tag === 'recommendation-sync') {
    event.waitUntil(
      // Handle background sync logic here
      syncRecommendations()
    )
  }
})

// Helper function for background sync
async function syncRecommendations() {
  try {
    console.log('🔄 Service Worker: Syncing recommendations...')
    // This would fetch pending recommendations when back online
    // Implementation would depend on your offline strategy
  } catch (error) {
    console.error('❌ Service Worker: Sync failed:', error)
  }
}

// Handle push subscription changes
self.addEventListener('pushsubscriptionchange', (event) => {
  console.log('📱 Service Worker: Push subscription changed')
  
  event.waitUntil(
    // Re-subscribe the user
    self.registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: null // You'll need to set your VAPID public key here
    }).then((subscription) => {
      // Send new subscription to server
      return fetch('/api/notifications/push/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(subscription)
      })
    })
  )
})

console.log('🔧 Service Worker: Script loaded successfully')