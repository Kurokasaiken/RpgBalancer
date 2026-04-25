/// <reference lib="webworker" />

import { precacheAndRoute } from 'workbox-precaching';
import { createHeadlessDiagnostics } from '@/shared/telemetry/headlessDiagnostics';

const diagnostics = createHeadlessDiagnostics('ServiceWorker');

// Declare service worker global scope
declare const self: ServiceWorkerGlobalScope & { __WB_MANIFEST: unknown };

// Inject manifest for Workbox precaching
precacheAndRoute(self.__WB_MANIFEST);

/**
 * Punch Club Service Worker - Offline-first caching strategy
 *
 * Implements selective caching for the Punch Club sandbox:
 * - Static assets: cache-first (shell + critical assets)
 * - Punch Club routes: network-first with cache fallback
 * - Other routes: network-only (no caching)
 */

// Service Worker version for update tracking
const SW_VERSION = '1.1.0';
const CACHE_VERSION_PREFIX = 'punch-club-v';
const STATIC_CACHE = `${CACHE_VERSION_PREFIX}${SW_VERSION.replace(/\./g, '-')}`;
const DYNAMIC_CACHE = `${CACHE_VERSION_PREFIX}${SW_VERSION.replace(/\./g, '-')}-dynamic`;

/**
 * Cold start performance tracking
 */
interface ColdStartMetrics {
  swActivationTime: number;
  firstFetchTime: number;
  totalTime: number;
}

/**
 * Record performance mark for cold start timing
 */
function recordPerformanceMark(markName: string): void {
  if ('performance' in self && 'mark' in performance) {
    performance.mark(markName);
    diagnostics.info(`Performance mark recorded: ${markName}`);
  }
}

/**
 * Measure cold start metrics and send to client
 */
function measureAndReportColdStart(): void {
  if (!('performance' in self) || !('measure' in performance)) {
    return;
  }

  try {
    // Measure SW activation time
    performance.measure('sw-activation', 'sw-start', 'sw-activated');
    const activationMeasure = performance.getEntriesByName('sw-activation')[0];
    
    // Measure first fetch time
    performance.measure('first-fetch', 'sw-activated', 'first-request');
    const fetchMeasure = performance.getEntriesByName('first-fetch')[0];
    
    // Measure total cold start time
    performance.measure('cold-start-total', 'sw-start', 'first-request');
    const totalMeasure = performance.getEntriesByName('cold-start-total')[0];

    const metrics: ColdStartMetrics = {
      swActivationTime: activationMeasure?.duration || 0,
      firstFetchTime: fetchMeasure?.duration || 0,
      totalTime: totalMeasure?.duration || 0,
    };

    diagnostics.info('Cold start metrics measured', metrics);

    // Send metrics to all active clients
    self.clients.matchAll().then(clients => {
      clients.forEach(client => {
        client.postMessage({
          type: 'PWA_COLD_START_METRICS',
          data: {
            ...metrics,
            timestamp: Date.now(),
            swVersion: SW_VERSION,
          },
        });
      });
    });

    // Clean up performance entries
    performance.clearMarks();
    performance.clearMeasures();
  } catch (error) {
    diagnostics.error('Failed to measure cold start metrics', error);
  }
}

/**
 * Cache management and version mismatch handling
 */
interface CacheVersionInfo {
  version: string;
  timestamp: number;
  cacheName: string;
}

/**
 * Check if cache needs busting
 */
function shouldBustCache(currentVersion: string, cacheName: string): boolean {
  try {
    const cacheVersionKey = `cache-version-${cacheName}`;
    const storedVersion = localStorage.getItem(cacheVersionKey);
    
    if (!storedVersion || storedVersion !== currentVersion) {
      return true;
    }
    
    // Check cache age
    const cacheInfo: CacheVersionInfo = JSON.parse(localStorage.getItem(`${cacheVersionKey}-info`) || '{}');
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours
    
    if (Date.now() - cacheInfo.timestamp > maxAge) {
      return true;
    }
    
    return false;
  } catch (error) {
    diagnostics.error('Error checking cache version', error);
    return true; // Bust cache on error
  }
}

/**
 * Bust old caches and create new ones
 */
async function bustAndCreateCache(cacheName: string, version: string): Promise<void> {
  try {
    // Delete old cache
    await caches.delete(cacheName);
    
    // Create new cache
    const newCacheName = `${CACHE_VERSION_PREFIX}${version.replace(/\./g, '-')}`;
    await caches.open(newCacheName);
    
    // Store version info
    localStorage.setItem(`cache-version-${newCacheName}`, version);
    localStorage.setItem(`cache-version-${newCacheName}-info`, JSON.stringify({
      version,
      timestamp: Date.now(),
      cacheName: newCacheName,
    }));
    
    diagnostics.info('Cache busted and recreated', { oldCache: cacheName, newCache: newCacheName, version });
  } catch (error) {
    diagnostics.error('Failed to bust cache', error);
  }
}

/**
 * Notify clients about version mismatch
 */
function notifyVersionMismatch(expectedVersion: string, actualVersion: string): void {
  self.clients.matchAll().then(clients => {
    clients.forEach(client => {
      client.postMessage({
        type: 'PWA_VERSION_MISMATCH',
        data: {
          expectedVersion,
          actualVersion,
          timestamp: Date.now(),
          swVersion: SW_VERSION,
        },
      });
    });
  });
  
  diagnostics.warn('Version mismatch detected', { expectedVersion, actualVersion });
}

/**
 * Handle cache busting on activation
 */
self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    // Record activation mark
    recordPerformanceMark('sw-activated');
    
    // Check for cache busting
    const currentCacheName = `${CACHE_VERSION_PREFIX}${SW_VERSION.replace(/\./g, '-')}`;
    
    if (shouldBustCache(SW_VERSION, currentCacheName)) {
      await bustAndCreateCache(currentCacheName, SW_VERSION);
    }
    
    // Notify waiting clients
    if (self.clients && self.clients.claim) {
      await self.clients.claim();
      
      // Check for version mismatch with clients
      self.clients.matchAll().then(clients => {
        clients.forEach(client => {
          client.postMessage({
            type: 'PWA_SW_UPDATED',
            data: {
              version: SW_VERSION,
              timestamp: Date.now(),
            },
          });
        });
      });
    }
    
    // Measure and report cold start metrics
    measureAndReportColdStart();
  })());
});

/**
 * Handle fetch with cache busting and offline fallback
 */
self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);
  
  // Skip non-GET requests and external resources
  if (request.method !== 'GET' || url.origin !== self.location.origin) {
    return;
  }
  
  event.respondWith((async () => {
    try {
      // Try cache first with version check
      const cacheName = `${CACHE_VERSION_PREFIX}${SW_VERSION.replace(/\./g, '-')}`;
      const cache = await caches.open(cacheName);
      
      // Check if cache needs busting
      if (shouldBustCache(SW_VERSION, cacheName)) {
        await bustAndCreateCache(cacheName, SW_VERSION);
        const freshCache = await caches.open(`${CACHE_VERSION_PREFIX}${SW_VERSION.replace(/\./g, '-')}`);
        const response = await fetch(request);
        if (response.ok) {
          await freshCache.put(request, response.clone());
        }
        return response;
      }
      
      // Try cache first
      const cachedResponse = await cache.match(request);
      if (cachedResponse) {
        // Record first fetch mark if not already recorded
        if (!performanceMarksRef['first-request']) {
          performanceMarksRef['first-request'] = true;
          recordPerformanceMark('first-request');
        }
        return cachedResponse;
      }
      
      // Record first fetch mark
      if (!performanceMarksRef['first-request']) {
        performanceMarksRef['first-request'] = true;
        recordPerformanceMark('first-request');
      }
      
      // Fetch from network
      const networkResponse = await fetch(request);
      
      if (networkResponse.ok) {
        // Cache successful responses
        await cache.put(request, networkResponse.clone());
      }
      
      return networkResponse;
    } catch (error) {
      diagnostics.error('Fetch failed, trying offline fallback', error);
      
      // Try to get from any cache as fallback
      const cachesKeys = await caches.keys();
      for (const cacheKey of cachesKeys) {
        if (cacheKey.startsWith(CACHE_VERSION_PREFIX)) {
          const cache = await caches.open(cacheKey);
          const cachedResponse = await cache.match(request);
          if (cachedResponse) {
            return cachedResponse;
          }
        }
      }
      
      // Return offline fallback page for navigation requests
      if (request.mode === 'navigate') {
        return new Response(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>Offline - Punch Club</title>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1">
              <style>
                body { 
                  font-family: system-ui, -apple-system, sans-serif; 
                  display: flex; 
                  align-items: center; 
                  justify-content: center; 
                  min-height: 100vh; 
                  margin: 0; 
                  background: #1a1a1a; 
                  color: #fff; 
                  text-align: center; 
                }
                .offline-container { 
                  max-width: 400px; 
                  padding: 2rem; 
                }
                .offline-icon { 
                  font-size: 4rem; 
                  margin-bottom: 1rem; 
                }
                h1 { 
                  margin: 0 0 1rem 0; 
                  font-size: 1.5rem; 
                }
                p { 
                  margin: 0 0 2rem 0; 
                  opacity: 0.8; 
                }
                button { 
                  background: #2563eb; 
                  color: white; 
                  border: none; 
                  padding: 0.75rem 1.5rem; 
                  border-radius: 0.5rem; 
                  cursor: pointer; 
                  font-size: 1rem; 
                }
                button:hover { 
                  background: #1d4ed8; 
                }
              </style>
            </head>
            <body>
              <div class="offline-container">
                <div class="offline-icon">📱</div>
                <h1>You're offline</h1>
                <p>Please check your internet connection and try again.</p>
                <button onclick="window.location.reload()">Retry</button>
              </div>
            </body>
          </html>
        `, {
          status: 200,
          statusText: 'OK',
          headers: new Headers({
            'Content-Type': 'text/html',
          }),
        });
      }
      
      // Return error for other requests
      return new Response('Offline', {
        status: 503,
        statusText: 'Service Unavailable',
      });
    }
  })());
});

/**
 * Handle message events from clients
 */
self.addEventListener('message', (event) => {
  const { type, data } = event.data;
  
  switch (type) {
    case 'PWA_GET_VERSION':
      // Respond with current SW version
      event.ports[0].postMessage({
        type: 'PWA_VERSION_RESPONSE',
        data: {
          version: SW_VERSION,
          timestamp: Date.now(),
        },
      });
      break;
      
    case 'PWA_FORCE_UPDATE':
      // Force cache refresh
      bustAndCreateCache(`${CACHE_VERSION_PREFIX}${SW_VERSION.replace(/\./g, '-')}`, SW_VERSION).then(() => {
        event.ports[0].postMessage({
          type: 'PWA_UPDATE_COMPLETE',
          data: {
            version: SW_VERSION,
            timestamp: Date.now(),
          },
        });
      });
      break;
      
    case 'PWA_CHECK_VERSION':
      // Check for version mismatch
      {
        const clientVersion = data.version;
        if (clientVersion && clientVersion !== SW_VERSION) {
          notifyVersionMismatch(SW_VERSION, clientVersion);
        }
      }
      break;

    case 'PWA_CRASH_RECOVERY_RESET':
      // Handle crash recovery reset request
      handleCrashRecoveryReset(data);
      break;

    case 'PWA_CRASH_WATCHDOG_TELEMETRY':
      // Handle watchdog telemetry
      diagnostics.info('Crash watchdog telemetry received', data);
      break;
      
    default:
      diagnostics.warn('Unknown message type', { type, data });
  }
});

/**
 * Handle crash recovery reset from watchdog
 */
async function handleCrashRecoveryReset(data: { timestamp: number }): Promise<void> {
  try {
    diagnostics.info('Handling crash recovery reset', { timestamp: data.timestamp });
    
    // Clear all caches
    const cacheNames = await caches.keys();
    await Promise.all(cacheNames.map(name => caches.delete(name)));
    
    // Recreate essential caches
    const staticCache = await caches.open(STATIC_CACHE);
    await staticCache.addAll(STATIC_ASSETS);
    
    diagnostics.info('Crash recovery reset completed');
    
    // Notify clients
    self.clients.matchAll().then(clients => {
      clients.forEach(client => {
        client.postMessage({
          type: 'PWA_CRASH_RECOVERY_COMPLETED',
          data: {
            timestamp: Date.now(),
            swVersion: SW_VERSION,
          },
        });
      });
    });
  } catch (error) {
    diagnostics.error('Crash recovery reset failed', error);
    
    // Notify clients of failure
    self.clients.matchAll().then(clients => {
      clients.forEach(client => {
        client.postMessage({
          type: 'PWA_CRASH_RECOVERY_FAILED',
          data: {
            timestamp: Date.now(),
            error: error instanceof Error ? error.message : String(error),
          },
        });
      });
    });
  }
}

/**
 * Performance marks reference (shared across events)
 */
const performanceMarksRef: Record<string, true> = {};
function notifyUpdateAvailable(): void {
  self.clients.matchAll().then(clients => {
    clients.forEach(client => {
      client.postMessage({
        type: 'PWA_UPDATE_AVAILABLE',
        data: {
          newVersion: SW_VERSION,
          timestamp: Date.now(),
        },
      });
    });
  });
}

// Static assets to cache immediately
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  // Icons will be added when manifest is complete
];

// Punch Club specific routes to cache
const PUNCH_CLUB_ROUTES = [
  '/punch-club',
  '/punch-club-mobile',
  '/punch-club-light',
];

self.addEventListener('install', (event: ExtendableEvent) => {
  diagnostics.info('Service Worker installing');
  
  // Record initial performance mark for cold start tracking
  recordPerformanceMark('sw-start');

  event.waitUntil(
    (async () => {
      const cache = await caches.open(STATIC_CACHE);
      try {
        await cache.addAll(STATIC_ASSETS);
        diagnostics.info('Static assets cached successfully');
      } catch (error) {
        diagnostics.warn('Failed to cache some static assets', error);
      }

      // Force activation
      await (self as ServiceWorkerGlobalScope).skipWaiting();
    })()
  );
});

self.addEventListener('activate', (event: ExtendableEvent) => {
  diagnostics.info('Service Worker activating');
  
  // Record activation performance mark
  recordPerformanceMark('sw-activated');

  event.waitUntil(
    (async () => {
      // Clean up old caches
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames
          .filter(name => name !== STATIC_CACHE && name !== DYNAMIC_CACHE)
          .map(name => caches.delete(name))
      );

      // Take control of all clients
      await (self as ServiceWorkerGlobalScope).clients.claim();
      
      // Check if this is a new version and notify about update
      const oldVersion = await caches.match('sw-version');
      if (!oldVersion || (await oldVersion.text()) !== SW_VERSION) {
        // Store new version
        const versionCache = await caches.open(DYNAMIC_CACHE);
        await versionCache.put('sw-version', new Response(SW_VERSION));
        
        // Notify clients about update
        notifyUpdateAvailable();
      }

      diagnostics.info('Service Worker activated and claimed clients');
    })()
  );
});

let isFirstFetch = true;

self.addEventListener('fetch', (event: FetchEvent) => {
  const { request } = event;
  const url = new URL(request.url);

  // Only handle GET requests
  if (request.method !== 'GET') return;

  // Track first fetch for cold start metrics
  if (isFirstFetch) {
    isFirstFetch = false;
    recordPerformanceMark('first-request');
    measureAndReportColdStart();
  }

  // Handle Punch Club routes with network-first strategy
  if (PUNCH_CLUB_ROUTES.some(route => url.pathname.startsWith(route))) {
    event.respondWith(networkFirstStrategy(request));
    return;
  }

  // Handle static assets with cache-first strategy
  if (STATIC_ASSETS.some(asset => url.pathname === asset) ||
      url.pathname.match(/\.(js|css|png|jpg|jpeg|svg|ico|woff|woff2)$/)) {
    event.respondWith(cacheFirstStrategy(request));
    return;
  }

  // Everything else: network-only
  event.respondWith(fetch(request));
});

// Handle messages from clients
self.addEventListener('message', (event) => {
  const { type } = event.data;

  switch (type) {
    case 'GET_VERSION':
      // Respond with current SW version
      event.ports[0].postMessage({
        type: 'SW_VERSION',
        version: SW_VERSION,
      });
      break;

    case 'SKIP_WAITING':
      // Skip waiting and activate immediately
      if (self.skipWaiting) {
        self.skipWaiting();
      }
      break;

    default:
      // Ignore unknown message types
      break;
  }
});

/**
 * Network-first strategy with cache fallback
 * Good for dynamic content that should be fresh but works offline
 */
async function networkFirstStrategy(request: Request): Promise<Response> {
  try {
    // Try network first
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      // Cache successful responses
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
      diagnostics.info('Cached Punch Club response', { url: request.url });
    }
    return networkResponse;
  } catch (error) {
    // Network failed, try cache
    diagnostics.warn('Network failed for Punch Club route, trying cache', {
      url: request.url,
      error: error instanceof Error ? error.message : String(error)
    });

    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      diagnostics.info('Served Punch Club from cache', { url: request.url });
      return cachedResponse;
    }

    // No cache available, return offline fallback
    return new Response(
      JSON.stringify({
        error: 'Offline',
        message: 'Punch Club is currently offline. Please check your connection.'
      }),
      {
        status: 503,
        statusText: 'Service Unavailable',
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

/**
 * Cache-first strategy
 * Good for static assets that don't change often
 */
async function cacheFirstStrategy(request: Request): Promise<Response> {
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    diagnostics.info('Served static asset from cache', { url: request.url });
    return cachedResponse;
  }

  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, networkResponse.clone());
      diagnostics.info('Cached static asset', { url: request.url });
    }
    return networkResponse;
  } catch (error) {
    diagnostics.warn('Failed to fetch static asset', {
      url: request.url,
      error: error instanceof Error ? error.message : String(error)
    });

    // Return a basic offline response for critical assets
    if (request.url.includes('/manifest.json')) {
      return new Response(
        JSON.stringify({
          name: 'Punch Club Offline',
          short_name: 'Punch Club',
          description: 'Offline mode - check connection for full experience'
        }),
        {
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    throw error;
  }
}

// Listen for messages from the main thread
self.addEventListener('message', (event: ExtendableMessageEvent) => {
  if (event.data?.type === 'SKIP_WAITING') {
    diagnostics.info('Received SKIP_WAITING message');
    (self as ServiceWorkerGlobalScope).skipWaiting();
  }
});

export {};
