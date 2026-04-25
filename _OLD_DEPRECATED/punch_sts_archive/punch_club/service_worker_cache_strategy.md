# Service Worker Cache Strategy - NP-208

**Date:** 2026-01-24  
**Agent:** Nexus-SW  
**Status:** ✅ COMPLETED  

## Executive Summary

Optimized PWA cache strategy with Workbox integration, precaching, cache invalidation, and background sync. Supports cache-first, network-first, and stale-while-revalidate strategies with versioning.

## Overview

The Service Worker Cache Strategy provides:
- **3 Cache Strategies** - Cache-first, Network-first, Stale-while-revalidate
- **Precaching** - Static asset precaching with versioning
- **Cache Invalidation** - Automatic cleanup of old caches
- **Background Sync** - Offline queue integration
- **Manifest Generator** - CLI tool for precache manifest
- **Config-First Design** - Zod schema validation

## Cache Strategies

### 1. Cache-First
- **Use Case**: Static assets (images, fonts, styles)
- **Flow**: Cache → Network (if miss)
- **Best For**: Immutable resources

```javascript
async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  
  if (cached) return cached;
  
  const response = await fetch(request);
  if (response.ok) {
    cache.put(request, response.clone());
  }
  return response;
}
```

### 2. Network-First
- **Use Case**: API calls, dynamic content
- **Flow**: Network → Cache (if fail)
- **Best For**: Fresh data requirements

```javascript
async function networkFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  
  try {
    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    return await cache.match(request);
  }
}
```

### 3. Stale-While-Revalidate
- **Use Case**: Scripts, HTML
- **Flow**: Cache + Background Network Update
- **Best For**: Balance between speed and freshness

```javascript
async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  
  const fetchPromise = fetch(request)
    .then((response) => {
      if (response.ok) {
        cache.put(request, response.clone());
      }
      return response;
    });
  
  return cached || fetchPromise;
}
```

## Configuration

### Default Config

```typescript
{
  version: 'v1',
  cachePrefix: 'punch-club',
  precacheUrls: ['/', '/index.html', '/manifest.json'],
  runtimeCaching: [
    {
      pattern: '/api/',
      strategy: 'network-first',
      cacheName: 'api-cache',
      maxEntries: 50,
      maxAgeSeconds: 300,
    },
    {
      pattern: '/assets/images/',
      strategy: 'cache-first',
      cacheName: 'image-cache',
      maxEntries: 100,
      maxAgeSeconds: 2592000,
    },
  ],
  skipWaiting: true,
  clientsClaim: true,
  cleanupOldCaches: true,
  offlineFallback: {
    enabled: true,
    pageFallback: '/offline.html',
  },
  backgroundSync: {
    enabled: true,
    queueName: 'offline-queue',
    maxRetentionTime: 86400000,
  },
}
```

## Service Worker Lifecycle

### 1. Install
- Precache static assets
- Skip waiting (optional)

```javascript
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});
```

### 2. Activate
- Clean up old caches
- Claim clients

```javascript
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((names) => {
        return Promise.all(
          names
            .filter((name) => name !== CACHE_NAME)
            .map((name) => caches.delete(name))
        );
      })
      .then(() => self.clients.claim())
  );
});
```

### 3. Fetch
- Route requests to appropriate strategy

```javascript
self.addEventListener('fetch', (event) => {
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirst(request, API_CACHE));
  } else if (request.destination === 'image') {
    event.respondWith(cacheFirst(request, IMAGE_CACHE));
  }
});
```

## Precache Manifest Generator

### CLI Usage

```bash
# Generate manifest
npm run sw:precache

# With options
npm run sw:precache -- --verbose
npm run sw:precache -- --include "assets,images"
npm run sw:precache -- --exclude "*.map"
```

### Manifest Format

```json
{
  "version": "1706097600000",
  "entries": [
    {
      "url": "/index.html",
      "revision": "a1b2c3d4"
    },
    {
      "url": "/assets/app.js",
      "revision": "e5f6g7h8"
    }
  ],
  "generated": "2026-01-24T10:00:00.000Z"
}
```

## Cache Management

### Versioning
- Each cache has version suffix
- Old versions cleaned on activate

```javascript
const CACHE_NAME = `punch-club-v1`;
```

### Size Limits
- maxEntries: Limit cache entries
- maxAgeSeconds: Expire old entries

```typescript
{
  maxEntries: 100,
  maxAgeSeconds: 2592000, // 30 days
}
```

### Manual Cleanup

```javascript
// Clear all caches
caches.keys().then((names) => {
  names.forEach((name) => caches.delete(name));
});
```

## Offline Fallback

### Page Fallback

```javascript
if (request.mode === 'navigate') {
  return cache.match('/offline.html');
}
```

### Image Fallback

```javascript
if (request.destination === 'image') {
  return cache.match('/assets/offline-image.png');
}
```

## Background Sync

### Queue Integration

```javascript
self.addEventListener('sync', (event) => {
  if (event.tag === 'offline-queue') {
    event.waitUntil(syncOfflineQueue());
  }
});
```

## Usage

### Register Service Worker

```typescript
if ('serviceWorker' in navigator) {
  navigator.serviceWorker
    .register('/sw.js')
    .then((registration) => {
      console.log('SW registered:', registration);
    })
    .catch((error) => {
      console.error('SW registration failed:', error);
    });
}
```

### Update Service Worker

```typescript
navigator.serviceWorker.ready.then((registration) => {
  registration.update();
});
```

### Skip Waiting

```typescript
navigator.serviceWorker.addEventListener('controllerchange', () => {
  window.location.reload();
});

// Send message to SW
navigator.serviceWorker.controller.postMessage({
  type: 'SKIP_WAITING'
});
```

## Performance Optimization

### 1. Precache Critical Assets
- HTML, CSS, JS
- Fonts, icons
- Critical images

### 2. Runtime Caching
- API responses (short TTL)
- Images (long TTL)
- Scripts (stale-while-revalidate)

### 3. Cache Limits
- Prevent unbounded growth
- LRU eviction

## Best Practices

### 1. Cache Strategy Selection
- **Static assets**: cache-first
- **API calls**: network-first
- **HTML/Scripts**: stale-while-revalidate

### 2. Versioning
- Use content hashing
- Update version on deploy
- Clean old caches

### 3. Offline Support
- Provide fallback pages
- Queue failed requests
- Sync when online

### 4. Testing
- Test install/activate
- Test cache strategies
- Test offline scenarios

## Troubleshooting

### Issue: Cache Not Updating

**Solution**: Update cache version

```javascript
const CACHE_VERSION = 'v2'; // Increment version
```

### Issue: Service Worker Not Installing

**Solution**: Check console for errors

```javascript
navigator.serviceWorker.register('/sw.js')
  .catch((error) => console.error('Registration failed:', error));
```

### Issue: Old Cache Not Clearing

**Solution**: Verify activate event

```javascript
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) => {
      return Promise.all(
        names
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
});
```

## Integration with NP-207 Offline Queue

```typescript
// Queue failed requests
self.addEventListener('fetch', (event) => {
  event.respondWith(
    fetch(event.request).catch(() => {
      // Add to offline queue
      return queueRequest(event.request);
    })
  );
});

// Sync when online
self.addEventListener('sync', (event) => {
  if (event.tag === 'offline-queue') {
    event.waitUntil(processQueue());
  }
});
```

## Resources

### Internal Documentation
- `public/sw.js` - Service worker implementation
- `src/ui/punchClub/config/swCacheConfig.ts` - Configuration
- `scripts/punchClub/generateSWPrecache.ts` - Manifest generator

### Related Documentation
- NP-207 Offline Queue System
- PC-M3 PWA Implementation

## Conclusion

The Service Worker Cache Strategy provides optimized PWA caching with Workbox integration, precaching, cache invalidation, and background sync. Supports multiple cache strategies with config-first design and automatic versioning.

---

**Last Updated:** 2026-01-24  
**Next Review:** 2026-04-24  
**Maintainer:** Nexus-SW (Cascade AI)
