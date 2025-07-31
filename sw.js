/**
 * Service Worker for Pegearts Portfolio
 * Version: 2.0.0
 * Author: Thanatsitt Santisamranwilai
 */

const CACHE_NAME = 'pegearts-portfolio-v2.0.0';
const STATIC_CACHE = `${CACHE_NAME}-static`;
const DYNAMIC_CACHE = `${CACHE_NAME}-dynamic`;
const AUDIO_CACHE = `${CACHE_NAME}-audio`;
const IMAGE_CACHE = `${CACHE_NAME}-images`;

// Cache versioning
const CACHE_VERSION = {
    static: '2.0.0',
    dynamic: '1.1.0',
    audio: '1.0.0',
    images: '1.2.0'
};

// Files to cache immediately
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/css/style.css',
    '/js/main.js',
    '/manifest.json',
    
    // Critical images
    '/images/logo.svg',
    '/images/hero-bg.jpg',
    '/images/profile-avatar.jpg',
    
    // Icons
    '/icons/icon-192x192.png',
    '/icons/icon-512x512.png',
    '/icons/favicon.ico',
    
    // Fonts (if using local fonts)
    '/fonts/Inter-Regular.woff2',
    '/fonts/Inter-Bold.woff2',
    
    // Critical assets
    '/images/portfolio/project-1-thumb.jpg',
    '/images/portfolio/project-2-thumb.jpg',
    '/images/portfolio/project-3-thumb.jpg'
];

// Audio files to cache
const AUDIO_ASSETS = [
    '/assets/audio/voice/natural/Track-1-20250730-100948.m4a',
    '/assets/audio/voice/natural/Track-2-Introduction.m4a',
    '/assets/audio/voice/natural/Track-3-Skills.m4a',
    '/assets/audio/voice/ai/AI-Generated-Voice-1.mp3',
    '/assets/audio/voice/ai/AI-Generated-Voice-2.mp3',
    '/assets/audio/music/background-ambient.mp3',
    '/assets/audio/ui/button-click.mp3',
    '/assets/audio/ui/notification.mp3'
];

// Network-first resources (always try network first)
const NETWORK_FIRST = [
    '/api/',
    '/contact',
    '*.php',
    '*.json'
];

// Cache-first resources (try cache first)
const CACHE_FIRST = [
    '*.css',
    '*.js',
    '*.woff2',
    '*.woff',
    '*.ttf'
];

// Stale-while-revalidate resources
const STALE_WHILE_REVALIDATE = [
    '*.jpg',
    '*.jpeg',
    '*.png',
    '*.svg',
    '*.webp',
    '*.gif'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
    console.log('[SW] Installing Service Worker v' + CACHE_VERSION.static);
    
    event.waitUntil(
        Promise.all([
            // Cache static assets
            caches.open(STATIC_CACHE).then((cache) => {
                console.log('[SW] Caching static assets');
                return cache.addAll(STATIC_ASSETS);
            }),
            
            // Cache audio assets (optional - can be large)
            caches.open(AUDIO_CACHE).then((cache) => {
                console.log('[SW] Caching audio assets');
                // Cache only critical audio files on install
                const criticalAudio = AUDIO_ASSETS.slice(0, 3);
                return cache.addAll(criticalAudio).catch(err => {
                    console.warn('[SW] Some audio files failed to cache:', err);
                });
            })
        ]).then(() => {
            console.log('[SW] Installation complete');
            return self.skipWaiting();
        })
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    console.log('[SW] Activating Service Worker v' + CACHE_VERSION.static);
    
    event.waitUntil(
        Promise.all([
            // Clean up old caches
            caches.keys().then((cacheNames) => {
                return Promise.all(
                    cacheNames.map((cacheName) => {
                        if (cacheName.startsWith('pegearts-portfolio-') && 
                            !cacheName.includes(CACHE_VERSION.static)) {
                            console.log('[SW] Deleting old cache:', cacheName);
                            return caches.delete(cacheName);
                        }
                    })
                );
            }),
            
            // Take control of all clients
            self.clients.claim()
        ]).then(() => {
            console.log('[SW] Activation complete');
        })
    );
});

// Fetch event - handle all network requests
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);
    
    // Skip non-GET requests
    if (request.method !== 'GET') {
        return;
    }
    
    // Skip external requests (except for CDN resources)
    if (url.origin !== location.origin && !isCDNResource(url)) {
        return;
    }
    
    // Handle different types of requests
    if (isAudioRequest(request)) {
        event.respondWith(handleAudioRequest(request));
    } else if (isImageRequest(request)) {
        event.respondWith(handleImageRequest(request));
    } else if (isAPIRequest(request)) {
        event.respondWith(handleAPIRequest(request));
    } else if (isStaticAsset(request)) {
        event.respondWith(handleStaticAsset(request));
    } else {
        event.respondWith(handleGenericRequest(request));
    }
});

// Audio request handler - cache first with network fallback
async function handleAudioRequest(request) {
    try {
        const cache = await caches.open(AUDIO_CACHE);
        const cachedResponse = await cache.match(request);
        
        if (cachedResponse) {
            console.log('[SW] Serving audio from cache:', request.url);
            return cachedResponse;
        }
        
        console.log('[SW] Fetching audio from network:', request.url);
        const networkResponse = await fetch(request);
        
        if (networkResponse.ok) {
            // Clone before caching
            const responseClone = networkResponse.clone();
            cache.put(request, responseClone);
        }
        
        return networkResponse;
    } catch (error) {
        console.error('[SW] Audio request failed:', error);
        return new Response('Audio not available offline', { 
            status: 503,
            statusText: 'Service Unavailable'
        });
    }
}

// Image request handler - stale while revalidate
async function handleImageRequest(request) {
    try {
        const cache = await caches.open(IMAGE_CACHE);
        
        // Serve from cache immediately if available
        const cachedResponse = await cache.match(request);
        
        // Always try to update in background
        const networkPromise = fetch(request).then(response => {
            if (response.ok) {
                cache.put(request, response.clone());
            }
            return response;
        }).catch(() => null);
        
        // Return cached version or wait for network
        return cachedResponse || await networkPromise || createOfflineImageResponse();
    } catch (error) {
        console.error('[SW] Image request failed:', error);
        return createOfflineImageResponse();
    }
}

// API request handler - network first with cache fallback
async function handleAPIRequest(request) {
    try {
        console.log('[SW] API request (network first):', request.url);
        const networkResponse = await fetch(request);
        
        if (networkResponse.ok) {
            // Cache successful API responses for offline access
            const cache = await caches.open(DYNAMIC_CACHE);
            cache.put(request, networkResponse.clone());
        }
        
        return networkResponse;
    } catch (error) {
        console.log('[SW] Network failed, trying cache for API:', request.url);
        const cache = await caches.open(DYNAMIC_CACHE);
        const cachedResponse = await cache.match(request);
        
        if (cachedResponse) {
            return cachedResponse;
        }
        
        // Return offline response for API calls
        return new Response(
            JSON.stringify({
                error: 'Offline',
                message: 'This feature is not available offline'
            }),
            {
                status: 503,
                statusText: 'Service Unavailable',
                headers: { 'Content-Type': 'application/json' }
            }
        );
    }
}

// Static asset handler - cache first
async function handleStaticAsset(request) {
    try {
        const cache = await caches.open(STATIC_CACHE);
        const cachedResponse = await cache.match(request);
        
        if (cachedResponse) {
            return cachedResponse;
        }
        
        const networkResponse = await fetch(request);
        
        if (networkResponse.ok) {
            cache.put(request, networkResponse.clone());
        }
        
        return networkResponse;
    } catch (error) {
        console.error('[SW] Static asset request failed:', error);
        
        // Return offline page for HTML requests
        if (request.destination === 'document') {
            return caches.match('/offline.html') || createOfflineResponse();
        }
        
        throw error;
    }
}

// Generic request handler
async function handleGenericRequest(request) {
    try {
        // Try network first
        const networkResponse = await fetch(request);
        
        // Cache successful responses
        if (networkResponse.ok) {
            const cache = await caches.open(DYNAMIC_CACHE);
            cache.put(request, networkResponse.clone());
        }
        
        return networkResponse;
    } catch (error) {
        // Try cache as fallback
        const cache = await caches.open(DYNAMIC_CACHE);
        const cachedResponse = await cache.match(request);
        
        if (cachedResponse) {
            return cachedResponse;
        }
        
        // Return appropriate offline response
        if (request.destination === 'document') {
            return caches.match('/') || createOfflineResponse();
        }
        
        throw error;
    }
}

// Utility functions
function isAudioRequest(request) {
    const url = new URL(request.url);
    return /\.(mp3|m4a|ogg|wav|aac|flac)$/i.test(url.pathname) ||
           url.pathname.includes('/audio/');
}

function isImageRequest(request) {
    return request.destination === 'image' ||
           /\.(jpg|jpeg|png|gif|webp|svg|bmp|ico)$/i.test(request.url);
}

function isAPIRequest(request) {
    const url = new URL(request.url);
    return url.pathname.startsWith('/api/') ||
           url.pathname.includes('contact') ||
           url.pathname.endsWith('.php') ||
           url.pathname.endsWith('.json');
}

function isStaticAsset(request) {
    return /\.(css|js|woff2?|ttf|eot)$/i.test(request.url);
}

function isCDNResource(url) {
    const cdnDomains = [
        'cdnjs.cloudflare.com',
        'fonts.googleapis.com',
        'fonts.gstatic.com',
        'cdn.jsdelivr.net'
    ];
    return cdnDomains.some(domain => url.hostname.includes(domain));
}

function createOfflineResponse() {
    return new Response(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Offline - Pegearts Portfolio</title>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <style>
                body { 
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    text-align: center;
                    padding: 2rem;
                    margin: 0;
                    min-height: 100vh;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    flex-direction: column;
                }
                .container { max-width: 500px; }
                h1 { font-size: 2rem; margin-bottom: 1rem; }
                p { font-size: 1.1rem; margin-bottom: 2rem; opacity: 0.9; }
                .btn {
                    background: rgba(255,255,255,0.2);
                    border: 2px solid rgba(255,255,255,0.3);
                    color: white;
                    padding: 0.75rem 1.5rem;
                    border-radius: 0.5rem;
                    text-decoration: none;
                    transition: all 0.3s ease;
                    display: inline-block;
                }
                .btn:hover {
                    background: rgba(255,255,255,0.3);
                    transform: translateY(-2px);
                }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>🌐 You're Offline</h1>
                <p>Sorry, this page is not available offline. Please check your internet connection and try again.</p>
                <a href="/" class="btn">← Go to Homepage</a>
            </div>
        </body>
        </html>
    `, {
        status: 200,
        statusText: 'OK',
        headers: { 'Content-Type': 'text/html' }
    });
}

function createOfflineImageResponse() {
    // Return a simple SVG placeholder for images
    const svg = `
        <svg width="400" height="300" xmlns="http://www.w3.org/2000/svg">
            <rect width="100%" height="100%" fill="#f0f0f0"/>
            <text x="50%" y="50%" text-anchor="middle" dy=".3em" 
                  font-family="Arial, sans-serif" font-size="18" fill="#999">
                Image not available offline
            </text>
        </svg>
    `;
    
    return new Response(svg, {
        status: 200,
        statusText: 'OK',
        headers: { 'Content-Type': 'image/svg+xml' }
    });
}

// Background sync for form submissions
self.addEventListener('sync', (event) => {
    if (event.tag === 'contact-form-sync') {
        event.waitUntil(syncContactForm());
    }
});

async function syncContactForm() {
    try {
        // Retrieve queued form data from IndexedDB
        const queuedForms = await getQueuedForms();
        
        for (const formData of queuedForms) {
            try {
                const response = await fetch('/api/contact', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(formData)
                });
                
                if (response.ok) {
                    await removeQueuedForm(formData.id);
                    console.log('[SW] Form synced successfully');
                }
            } catch (error) {
                console.error('[SW] Form sync failed:', error);
            }
        }
    } catch (error) {
        console.error('[SW] Background sync failed:', error);
    }
}

// Push notification handler
self.addEventListener('push', (event) => {
    if (!event.data) return;
    
    const data = event.data.json();
    const options = {
        body: data.body || 'New update available!',
        icon: '/icons/icon-192x192.png',
        badge: '/icons/badge-72x72.png',
        vibrate: [200, 100, 200],
        data: data.data || {},
        actions: [
            {
                action: 'view',
                title: 'View',
                icon: '/icons/view-icon.png'
            },
            {
                action: 'dismiss',
                title: 'Dismiss',
                icon: '/icons/dismiss-icon.png'
            }
        ]
    };
    
    event.waitUntil(
        self.registration.showNotification(data.title || 'Pegearts Portfolio', options)
    );
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    
    if (event.action === 'view') {
        event.waitUntil(
            clients.openWindow(event.notification.data.url || '/')
        );
    }
});

// Helper functions for IndexedDB (simplified)
async function getQueuedForms() {
    // Implementation would use IndexedDB
    return [];
}

async function removeQueuedForm(id) {
    // Implementation would use IndexedDB
    return true;
}

console.log('[SW] Service Worker loaded successfully');
