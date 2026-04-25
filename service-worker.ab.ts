/// <reference lib="webworker" />
declare const self: ServiceWorkerGlobalScope;

/**
 * RPG Balancer Service Worker A/B Router
 * Feature flag-based service worker for parallel testing
 * 
 * @see NP-257 – RPG Balancer Service Worker A/B Router
 */

type RoutingStrategy = 'cache_first' | 'network_first' | 'cache_only' | 'network_only' | 'default';

interface ExperimentRoutingRule {
  pattern: string;
  strategy: RoutingStrategy;
}

interface ExperimentConfig {
  experimentId: string;
  version: string;
  globalStrategy: RoutingStrategy;
  routingRules: ExperimentRoutingRule[];
}

// Service Worker A/B Router
export class SWRouter {
  public readonly config: ExperimentConfig;
  private cacheName: string;
  public readonly version: string;

  constructor(config: ExperimentConfig) {
    this.config = config;
    this.cacheName = `rpg-balancer-${config.experimentId}`;
    this.version = config.version;
  }

  /**
   * Route request based on experiment configuration
   */
  async route(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const pathname = url.pathname;

    // Determine routing strategy based on experiment
    const routingStrategy = this.getRoutingStrategy(pathname);

    switch (routingStrategy) {
      case 'cache_first':
        return this.cacheFirst(request);
      case 'network_first':
        return this.networkFirst(request);
      case 'cache_only':
        return this.cacheOnly(request);
      case 'network_only':
        return this.networkOnly(request);
      default:
        return this.defaultRoute(request);
    }
  }

  /**
   * Get routing strategy for a path
   */
  private getRoutingStrategy(pathname: string): RoutingStrategy {
    // Check for path-specific routing rules
    for (const rule of this.config.routingRules) {
      if (this.matchesPattern(pathname, rule.pattern)) {
        return rule.strategy;
      }
    }

    // Check for global routing strategy
    return this.config.globalStrategy;
  }

  /**
   * Pattern matching helper
   */
  private matchesPattern(pathname: string, pattern: string): boolean {
    if (pattern.startsWith('*')) {
      // Wildcard pattern
      const regex = new RegExp(
        pattern
          .replace(/\*/g, '.*')
          .replace(/\?/g, '\\?')
      );
      return regex.test(pathname);
    }

    // Exact match
    return pathname === pattern;
  }

  /**
   * Cache First Strategy
   */
  private async cacheFirst(request: Request): Promise<Response> {
    const cache = await caches.open(this.cacheName);
    const cachedResponse = await cache.match(request);

    if (cachedResponse) {
      console.log(`[SWRouter-${this.config.experimentId}] Cache HIT: ${request.url}`);
      return cachedResponse;
    }

    try {
      const networkResponse = await fetch(request);
      
      if (networkResponse.ok) {
        console.log(`[SWRouter-${this.config.experimentId}] Network FETCH: ${request.url}`);
        const responseClone = networkResponse.clone();
        await cache.put(request, responseClone);
        return networkResponse;
      }
    } catch (error) {
      console.error(`[SWRouter-${this.config.experimentId}] Network ERROR: ${error}`);
    }

    // Return offline fallback
    return this.getOfflineFallback(request);
  }

  /**
   * Network First Strategy
   */
  private async networkFirst(request: Request): Promise<Response> {
    const cache = await caches.open(this.cacheName);

    try {
      const networkResponse = await fetch(request);
      
      if (networkResponse.ok) {
        console.log(`[SWRouter-${this.config.experimentId}] Network FETCH: ${request.url}`);
        const responseClone = networkResponse.clone();
        await cache.put(request, responseClone);
        return networkResponse;
      }
    } catch (error) {
      console.error(`[SWRouter-${this.config.experimentId}] Network ERROR: ${error}`);
    }

    // Fallback to cache
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      console.log(`[SWRouter-${this.config.experimentId}] Cache FALLBACK: ${request.url}`);
      return cachedResponse;
    }

    return this.getOfflineFallback(request);
  }

  /**
   * Cache Only Strategy
   */
  private async cacheOnly(request: Request): Promise<Response> {
    const cache = await caches.open(this.cacheName);
    const cachedResponse = await cache.match(request);

    if (cachedResponse) {
      console.log(`[SWRouter-${this.config.experimentId}] Cache ONLY: ${request.url}`);
      return cachedResponse;
    }

    console.log(`[SWRouter-${this.config.experimentId}] Cache MISS: ${request.url}`);
    return this.getOfflineFallback(request);
  }

  /**
   * Network Only Strategy
   */
  private async networkOnly(request: Request): Promise<Response> {
    try {
      const networkResponse = await fetch(request);
      
      if (networkResponse.ok) {
        console.log(`[SWRouter-${this.config.experimentId}] Network ONLY: ${request.url}`);
        return networkResponse;
      }
    } catch (error) {
      console.error(`[SWRouter-${this.config.experimentId}] Network ERROR: ${error}`);
    }

    return this.getOfflineFallback(request);
  }

  /**
   * Default Route (network first with fallback)
   */
  private async defaultRoute(request: Request): Promise<Response> {
    return this.networkFirst(request);
  }

  /**
   * Get offline fallback response
   */
  private getOfflineFallback(request: Request): Response {
    const url = new URL(request.url);
    
    // Try to serve from offline cache
    if (url.pathname === '/' || url.pathname === '/index.html') {
      return new Response(
        `<!DOCTYPE html>
<html>
  <head>
    <title>RPG Balancer - Offline</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
      body { 
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        display: flex;
        justify-content: center;
        align-items: center;
        height: 100vh;
        margin: 0;
        background: #1a1a1a1;
        color: #ffffff;
      }
      .offline-container {
        text-align: center;
        padding: 2rem;
      }
      .offline-icon {
        font-size: 4rem;
        margin-bottom: 1rem;
      }
      .offline-title {
        font-size: 1.5rem;
        margin-bottom: 0.5rem;
      }
      .offline-message {
        font-size: 1rem;
        opacity: 0.8;
        margin-bottom: 2rem;
      }
      .retry-button {
        background: #4CAF50;
        color: white;
        border: none;
        padding: 0.75rem 1.5rem;
        border-radius: 4px;
        cursor: pointer;
        font-size: 1rem;
        transition: background-color 0.2s;
      }
      .retry-button:hover {
        background: #45a049;
      }
    </style>
  </head>
  <body>
    <div class="offline-container">
      <div class="offline-icon">📱</div>
      <h1 class="offline-title">RPG Balancer</h1>
      <p class="offline-message">
        You're currently offline. Some features may not be available.
      </p>
      <button class="retry-button" onclick="window.location.reload()">
        Try Again
      </button>
    </div>
  </body>
</html>`,
        {
          status: 200,
          statusText: 'OK',
          headers: {
            'Content-Type': 'text/html',
            'Cache-Control': 'no-cache',
          },
        }
      );
    }

    // For other paths, return a generic offline response
    return new Response(
      JSON.stringify({
        error: 'Offline',
        message: 'Resource not available offline',
        path: url.pathname,
        experimentId: this.config.experimentId,
      }),
      {
        status: 503,
        statusText: 'Service Unavailable',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
        },
      }
    );
  }

  /**
   * Clear cache for this experiment
   */
  async clearCache(): Promise<void> {
    const cache = await caches.open(this.cacheName);
    const keys = await cache.keys();
    await Promise.all(keys.map(key => cache.delete(key)));
    console.log(`[SWRouter-${this.config.experimentId}] Cache cleared: ${keys.length} entries`);
  }

  /**
   * Get cache statistics
   */
  async getCacheStats(): Promise<{
    totalEntries: number;
    totalSize: number;
    entries: Array<{
      url: string;
      size: number;
      lastModified: number;
    }>;
  }> {
    const cache = await caches.open(this.cacheName);
    const entries = await cache.keys();
    
    const stats = await Promise.all(
      entries.map(async (key) => {
        const response = await cache.match(key);
        const blob = await response?.blob();
        const lastModifiedHeader = response?.headers?.get('last-modified');
        const lastModified = lastModifiedHeader ? new Date(lastModifiedHeader).getTime() : 0;
        return {
          url: key.url,
          size: blob?.size || 0,
          lastModified,
        };
      })
    );

    const totalSize = stats.reduce((sum, entry) => sum + entry.size, 0);

    return {
      totalEntries: entries.length,
      totalSize,
      entries: stats,
    };
  }

  /**
   * Warm up cache with critical assets
   */
  async warmupCache(urls: string[]): Promise<void> {
    const cache = await caches.open(this.cacheName);
    
    console.log(`[SWRouter-${this.config.experimentId}] Warming up cache with ${urls.length} URLs`);
    
    for (const url of urls) {
      try {
        const response = await fetch(url);
        if (response.ok) {
          await cache.put(url, response);
          console.log(`[SWRouter-${this.config.experimentId}] Warmed: ${url}`);
        }
      } catch (error) {
        console.error(`[SWRouter-${this.config.experimentId}] Warmup ERROR for ${url}:`, error);
      }
    }
  }
}

/**
 * Global router instance
 */
let globalRouter: SWRouter | null = null;

/**
 * Initialize router with experiment configuration
 */
export function initializeRouter(config: ExperimentConfig): SWRouter {
  globalRouter = new SWRouter(config);
  console.log(`[SWRouter] Initialized router for experiment: ${config.experimentId}`);
  return globalRouter;
}

/**
 * Get current router instance
 */
export function getRouter(): SWRouter | null {
  return globalRouter;
}

/**
 * Reset router instance
 */
export function resetRouter(): void {
  globalRouter = null;
}

/**
 * Service Worker event handlers
 */
export const SWEventHandlers = {
  /**
   * Install event handler
   */
  async install(_event: ExtendableEvent): Promise<void> {
    const router = getRouter();
    if (!router) {
      console.error('[SWRouter] Router not initialized');
      return;
    }

    // Warm up cache with critical assets
    const criticalAssets = [
      '/',
      '/index.html',
      '/manifest.json',
      '/favicon.ico',
      '/assets/rpg-balancer/icon-192.png',
    ];

    await router.warmupCache(criticalAssets);

    // Skip waiting for all controlled pages
    self.skipWaiting();
    console.log(`[SWRouter-${router.config.experimentId}] Service Worker installed`);
  },

  /**
   * Activate event handler
   */
  async activate(_event: ExtendableEvent): Promise<void> {
    const router = getRouter();
    if (!router) {
      console.error('[SWRouter] Router not initialized');
      return;
    }

    // Clean up old caches if version changed
    if (router.version !== router.config.version) {
      await router.clearCache();
      console.log(`[SWRouter-${router.config.experimentId}] Updated to version ${router.version}`);
    }

    await self.clients.claim();
    console.log(`[SWRouter-${router.config.experimentId}] Service Worker activated`);
  },

  /**
   * Fetch event handler
   */
  async fetch(event: FetchEvent): Promise<Response> {
    const router = getRouter();
    if (!router) {
      console.error('[SWRouter] Router not initialized, falling back to network');
      return fetch(event.request);
    }

    return router.route(event.request);
  },

  /**
   * Message event handler
   */
  async message(event: ExtendableMessageEvent): Promise<void> {
    const router = getRouter();
    if (!router) {
      console.error('[SWRouter] Router not initialized');
      return;
    }

    const data = event.data;
    
    if (data.type === 'GET_CACHE_STATS') {
      const stats = await router.getCacheStats();
      event.ports[0].postMessage({
        type: 'CACHE_STATS',
        data: stats,
        experimentId: router.config.experimentId,
      });
    } else if (data.type === 'CLEAR_CACHE') {
      await router.clearCache();
      event.ports[0].postMessage({
        type: 'CACHE_CLEARED',
        experimentId: router.config.experimentId,
      });
    } else if (data.type === 'WARMUP_CACHE') {
      await router.warmupCache(data.urls || []);
      event.ports[0].postMessage({
        type: 'CACHE_WARMED',
        experimentId: router.config.experimentId,
        urlsCount: data.urls?.length || 0,
      });
    } else {
      console.warn(`[SWRouter-${router.config.experimentId}] Unknown message type: ${data.type}`);
    }
  },
};

/**
 * Service Worker main entry point
 */
self.addEventListener('install', (event: ExtendableEvent) => {
  event.waitUntil(SWEventHandlers.install(event));
});

self.addEventListener('activate', (event: ExtendableEvent) => {
  event.waitUntil(SWEventHandlers.activate(event));
});

self.addEventListener('fetch', (event: FetchEvent) => {
  event.respondWith(SWEventHandlers.fetch(event));
});

self.addEventListener('message', (event: ExtendableMessageEvent) => {
  event.waitUntil(SWEventHandlers.message(event));
});
