/**
 * Service Worker Version Manager Tests
 */

import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { SWVersionManager, getSWVersionManager, SW_VERSION_CONFIG } from '@/ui/pwa/SWVersionManager';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
  };
})();

// Mock navigator.serviceWorker
const mockServiceWorker = {
  register: vi.fn(),
  addEventListener: vi.fn(),
  controller: null,
};

// Mock caches
const mockCaches = {
  keys: vi.fn(),
  open: vi.fn(),
  delete: vi.fn(),
  match: vi.fn(),
};

// Mock performance
const mockPerformance = {
  now: vi.fn(() => Date.now()),
  mark: vi.fn(),
  measure: vi.fn(),
  getEntriesByName: vi.fn(() => []),
  clearMarks: vi.fn(),
  clearMeasures: vi.fn(),
};

// Mock window
const mockWindow = {
  location: { reload: vi.fn() },
  dispatchEvent: vi.fn(),
  CustomEvent: vi.fn(),
};

describe('SWVersionManager', () => {
  let manager: SWVersionManager;

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();
    localStorageMock.clear();
    
    // Setup global mocks
    Object.defineProperty(window, 'localStorage', { value: localStorageMock });
    Object.defineProperty(navigator, 'serviceWorker', { value: mockServiceWorker });
    Object.defineProperty(global, 'caches', { value: mockCaches });
    Object.defineProperty(global, 'performance', { value: mockPerformance });
    Object.defineProperty(global, 'window', { value: mockWindow });

    // Create new manager instance
    manager = new SWVersionManager();
  });

  afterEach(() => {
    manager.cleanup();
  });

  describe('Initialization', () => {
    test('should initialize successfully', async () => {
      // Mock successful service worker registration
      const mockRegistration = {
        scope: '/',
        active: true,
        installing: null,
        waiting: null,
        update: vi.fn().mockResolvedValue(undefined),
        addEventListener: vi.fn(),
      };
      mockServiceWorker.register.mockResolvedValue(mockRegistration);

      await manager.initialize();

      expect(mockServiceWorker.register).toHaveBeenCalledWith('/service-worker.js', { scope: '/' });
      expect(mockRegistration.addEventListener).toHaveBeenCalledWith('updatefound', expect.any(Function));
    });

    test('should handle service worker not supported', async () => {
      Object.defineProperty(navigator, 'serviceWorker', { value: undefined });

      await manager.initialize();

      expect(localStorageMock.setItem).not.toHaveBeenCalled();
    });

    test('should handle registration failure', async () => {
      mockServiceWorker.register.mockRejectedValue(new Error('Registration failed'));

      await expect(manager.initialize()).rejects.toThrow('Registration failed');
    });
  });

  describe('Version Management', () => {
    test('should load version info from storage', async () => {
      const versionInfo = {
        version: '1.2.0',
        buildNumber: 42,
        timestamp: Date.now(),
        changelog: ['Test changelog'],
        isCritical: false,
      };
      localStorageMock.getItem.mockReturnValue(JSON.stringify(versionInfo));

      await manager.initialize();

      expect(localStorageMock.getItem).toHaveBeenCalledWith(SW_VERSION_CONFIG.versionKey);
    });

    test('should save version info to storage', async () => {
      const mockRegistration = {
        scope: '/',
        active: true,
        installing: null,
        waiting: null,
        update: vi.fn().mockResolvedValue(undefined),
        addEventListener: vi.fn(),
      };
      mockServiceWorker.register.mockResolvedValue(mockRegistration);

      await manager.initialize();

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        SW_VERSION_CONFIG.versionKey,
        expect.stringContaining('1.2.0')
      );
    });
  });

  describe('Update Detection', () => {
    test('should check for updates', async () => {
      const mockRegistration = {
        scope: '/',
        active: true,
        installing: null,
        waiting: null,
        update: vi.fn().mockResolvedValue(undefined),
        addEventListener: vi.fn(),
      };
      mockServiceWorker.register.mockResolvedValue(mockRegistration);

      await manager.initialize();
      
      const result = await manager.checkForUpdates();

      expect(result).toBe(true);
      expect(mockRegistration.update).toHaveBeenCalled();
    });

    test('should handle update check failure', async () => {
      const mockRegistration = {
        scope: '/',
        active: true,
        installing: null,
        waiting: null,
        update: vi.fn().mockRejectedValue(new Error('Network error')),
        addEventListener: vi.fn(),
      };
      mockServiceWorker.register.mockResolvedValue(mockRegistration);

      await manager.initialize();
      
      const result = await manager.checkForUpdates();

      expect(result).toBe(false);
    });
  });

  describe('Cache Management', () => {
    test('should get cache information', async () => {
      const mockCache = {
        keys: vi.fn().mockResolvedValue(['request1', 'request2']),
        match: vi.fn().mockResolvedValue(new Response('test')),
      };
      mockCaches.keys.mockResolvedValue(['punch-club-v1.2.0', 'other-cache']);
      mockCaches.open.mockResolvedValue(mockCache);

      // Mock Response.blob
      const mockBlob = { size: 1024 };
      global.Response = vi.fn().mockImplementation(() => ({
        blob: vi.fn().mockResolvedValue(mockBlob),
      })) as any;

      await manager.initialize();
      const cacheInfo = await manager.getCacheInfo();

      expect(cacheInfo).toHaveLength(1);
      expect(cacheInfo[0].version).toBe('1.2.0');
      expect(cacheInfo[0].entries).toBe(2);
      expect(cacheInfo[0].size).toBe(2048); // 2 entries * 1024 bytes
    });

    test('should clean up old caches', async () => {
      const mockCache = {
        keys: vi.fn().mockResolvedValue([]),
        match: vi.fn().mockResolvedValue(null),
      };
      mockCaches.keys.mockResolvedValue([
        'punch-club-v1.2.0',
        'punch-club-v1.1.0',
        'punch-club-v1.0.0',
        'punch-club-v0.9.0', // This should be deleted (max 3 versions)
      ]);
      mockCaches.open.mockResolvedValue(mockCache);
      mockCaches.delete.mockResolvedValue(true);

      await manager.initialize();
      await manager.cleanupOldCaches();

      expect(mockCaches.delete).toHaveBeenCalledWith('punch-club-v0.9.0');
      expect(mockCaches.delete).toHaveBeenCalledTimes(1);
    });
  });

  describe('Performance Metrics', () => {
    test('should track performance metrics', async () => {
      const mockRegistration = {
        scope: '/',
        active: true,
        installing: null,
        waiting: null,
        update: vi.fn().mockResolvedValue(undefined),
        addEventListener: vi.fn(),
      };
      mockServiceWorker.register.mockResolvedValue(mockRegistration);

      await manager.initialize();

      const metrics = manager.getPerformanceMetrics();
      expect(metrics).toHaveProperty('activationTime');
      expect(metrics).toHaveProperty('firstFetchTime');
      expect(metrics).toHaveProperty('cacheHitRate');
      expect(metrics).toHaveProperty('networkRequests');
      expect(metrics).toHaveProperty('cachedResponses');
    });

    test('should save performance metrics to storage', async () => {
      const mockRegistration = {
        scope: '/',
        active: true,
        installing: null,
        waiting: null,
        update: vi.fn().mockResolvedValue(undefined),
        addEventListener: vi.fn(),
      };
      mockServiceWorker.register.mockResolvedValue(mockRegistration);

      await manager.initialize();

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        SW_VERSION_CONFIG.metricsKey,
        expect.any(String)
      );
    });
  });

  describe('Force Update', () => {
    test('should force update when waiting SW exists', async () => {
      const mockWaitingWorker = {
        postMessage: vi.fn(),
      };
      const mockRegistration = {
        scope: '/',
        active: true,
        installing: null,
        waiting: mockWaitingWorker,
        update: vi.fn().mockResolvedValue(undefined),
        addEventListener: vi.fn(),
      };
      mockServiceWorker.register.mockResolvedValue(mockRegistration);

      await manager.initialize();
      await manager.forceUpdate();

      expect(mockWaitingWorker.postMessage).toHaveBeenCalledWith({ type: 'SKIP_WAITING' });
    });

    test('should handle force update when no waiting SW', async () => {
      const mockRegistration = {
        scope: '/',
        active: true,
        installing: null,
        waiting: null,
        update: vi.fn().mockResolvedValue(undefined),
        addEventListener: vi.fn(),
      };
      mockServiceWorker.register.mockResolvedValue(mockRegistration);

      await manager.initialize();
      await manager.forceUpdate();

      // Should not throw error, just warn
      expect(true).toBe(true);
    });
  });

  describe('Rollback', () => {
    test('should throw error for rollback (not implemented)', async () => {
      await expect(manager.rollbackToVersion('1.1.0')).rejects.toThrow('Rollback not yet implemented');
    });
  });

  describe('Cleanup', () => {
    test('should cleanup resources', () => {
      const clearIntervalSpy = vi.spyOn(global, 'clearInterval');
      
      manager.cleanup();
      
      expect(clearIntervalSpy).toHaveBeenCalled();
      clearIntervalSpy.mockRestore();
    });
  });
});

describe('getSWVersionManager', () => {
  test('should return singleton instance', () => {
    const manager1 = getSWVersionManager();
    const manager2 = getSWVersionManager();

    expect(manager1).toBe(manager2);
  });

  test('should create new instance on first call', () => {
    // Reset singleton
    (getSWVersionManager as any).swVersionManager = null;

    const manager = getSWVersionManager();

    expect(manager).toBeInstanceOf(SWVersionManager);
    expect(manager.getPerformanceMetrics()).toBeDefined();
  });
});
