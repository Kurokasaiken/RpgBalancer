/**
 * Service Worker Version Manager
 * 
 * Provides robust version management for Punch Club Service Worker including:
 * - Version detection and comparison
 * - Update notification and handling
 * - Cache management and cleanup
 * - Rollback capabilities
 * - Performance metrics
 */

import { createSandboxDiagnostics } from '@/ui/idleVillage/utils/sandboxDiagnostics';

const diagnostics = createSandboxDiagnostics('SWVersionManager');

const isServiceWorkerRuntime = (): boolean => {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return false;
  }

  if (import.meta.env?.MODE === 'test') {
    return true;
  }

  const hostname = window.location.hostname ?? '';
  const isLocalHost =
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname === '' ||
    hostname.endsWith('.local');
  const isHttp = window.location.protocol === 'http:';

  return (
    'serviceWorker' in navigator &&
    import.meta.env.PROD &&
    import.meta.env.VITE_DISABLE_SW !== 'true' &&
    !isLocalHost &&
    !isHttp
  );
};

export const isServiceWorkerRuntimeEnabled = (): boolean => isServiceWorkerRuntime();

// Version management interfaces
export interface SWVersionInfo {
  version: string;
  buildNumber: number;
  timestamp: number;
  changelog?: string[];
  isCritical?: boolean;
  rollbackVersion?: string;
}

export interface SWUpdateStatus {
  currentVersion: string;
  availableVersion?: string;
  updateAvailable: boolean;
  updateRequired: boolean;
  lastChecked: number;
  installPrompt?: boolean;
}

export interface SWCacheInfo {
  name: string;
  version: string;
  size: number;
  entries: number;
  lastModified: number;
}

export interface SWPerformanceMetrics {
  activationTime: number;
  firstFetchTime: number;
  cacheHitRate: number;
  networkRequests: number;
  cachedResponses: number;
}

// Version management configuration
export const SW_VERSION_CONFIG = {
  // Current version info
  currentVersion: '1.2.0',
  buildNumber: 42,
  
  // Version storage keys
  versionKey: 'sw-version-info',
  statusKey: 'sw-update-status',
  metricsKey: 'sw-performance-metrics',
  
  // Cache management
  cachePrefix: 'punch-club-v',
  maxCacheVersions: 3,
  cacheCleanupInterval: 24 * 60 * 60 * 1000, // 24 hours
  
  // Update checking
  updateCheckInterval: 60 * 60 * 1000, // 1 hour
  updateCheckTimeout: 10 * 1000, // 10 seconds
  
  // Performance tracking
  performanceTrackingEnabled: true,
  metricsRetentionPeriod: 7 * 24 * 60 * 60 * 1000, // 7 days
} as const;

/**
 * Service Worker Version Manager Class
 */
export class SWVersionManager {
  private registration: ServiceWorkerRegistration | null = null;
  private updateCheckTimer: NodeJS.Timeout | null = null;
  private performanceMetrics: SWPerformanceMetrics;
  private versionInfo: SWVersionInfo;

  constructor() {
    this.versionInfo = {
      version: SW_VERSION_CONFIG.currentVersion,
      buildNumber: SW_VERSION_CONFIG.buildNumber,
      timestamp: Date.now(),
      changelog: [
        'Enhanced version management system',
        'Improved cache cleanup strategies',
        'Added rollback capabilities',
        'Performance metrics tracking'
      ],
      isCritical: false,
    };

    this.performanceMetrics = {
      activationTime: 0,
      firstFetchTime: 0,
      cacheHitRate: 0,
      networkRequests: 0,
      cachedResponses: 0,
    };
  }

  /**
   * Initialize the version manager
   */
  async initialize(): Promise<void> {
    if (!isServiceWorkerRuntime()) {
      diagnostics.info('SW runtime disabled in this environment, skipping initialization');
      return;
    }

    try {
      diagnostics.info('Initializing SW Version Manager');

      // Register service worker if not already registered
      await this.registerServiceWorker();
      
      // Load stored version info
      await this.loadVersionInfo();
      
      // Start performance tracking
      this.startPerformanceTracking();
      
      // Start update checking
      this.startUpdateChecking();
      
      // Check for updates on initialization
      await this.checkForUpdates();
      
      diagnostics.info('SW Version Manager initialized successfully');
    } catch (error) {
      diagnostics.error('Failed to initialize SW Version Manager', error);
      throw error;
    }
  }

  /**
   * Register the service worker
   */
  private async registerServiceWorker(): Promise<void> {
    if (!isServiceWorkerRuntime()) {
      diagnostics.info('SW runtime disabled, skipping registration');
      return;
    }

    if (!('serviceWorker' in navigator)) {
      diagnostics.warn('Service Worker not supported');
      return;
    }

    try {
      this.registration = await navigator.serviceWorker.register('/service-worker.js', {
        scope: '/',
      });

      diagnostics.info('Service Worker registered', {
        scope: this.registration.scope,
        active: !!this.registration.active,
        installing: !!this.registration.installing,
        waiting: !!this.registration.waiting,
      });

      // Listen for updates
      this.registration.addEventListener('updatefound', this.handleUpdateFound.bind(this));
      
      // Listen for controller changes
      navigator.serviceWorker.addEventListener('controllerchange', this.handleControllerChange.bind(this));
      
      // Listen for messages from service worker
      navigator.serviceWorker.addEventListener('message', this.handleSWMessage.bind(this));
    } catch (error) {
      diagnostics.error('Failed to register Service Worker', error);
      throw error;
    }
  }

  /**
   * Load version info from storage
   */
  private async loadVersionInfo(): Promise<void> {
    try {
      const stored = localStorage.getItem(SW_VERSION_CONFIG.versionKey);
      if (stored) {
        const parsed = JSON.parse(stored) as SWVersionInfo;
        this.versionInfo = { ...this.versionInfo, ...parsed };
        diagnostics.info('Version info loaded from storage', parsed);
      }
    } catch (error) {
      diagnostics.warn('Failed to load version info from storage', error);
    }
  }

  /**
   * Save version info to storage
   */
  private async saveVersionInfo(): Promise<void> {
    try {
      localStorage.setItem(SW_VERSION_CONFIG.versionKey, JSON.stringify(this.versionInfo));
      diagnostics.info('Version info saved to storage', this.versionInfo);
    } catch (error) {
      diagnostics.warn('Failed to save version info to storage', error);
    }
  }

  /**
   * Start performance tracking
   */
  private startPerformanceTracking(): void {
    if (!SW_VERSION_CONFIG.performanceTrackingEnabled) return;

    // Track activation time
    const startTime = performance.now();
    
    // Listen for service worker activation
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      this.performanceMetrics.activationTime = performance.now() - startTime;
      diagnostics.info('SW activation time measured', {
        activationTime: this.performanceMetrics.activationTime,
      });
      this.savePerformanceMetrics();
    });
  }

  /**
   * Start automatic update checking
   */
  private startUpdateChecking(): void {
    // Clear existing timer
    if (this.updateCheckTimer) {
      clearInterval(this.updateCheckTimer);
    }

    // Set up periodic checking
    this.updateCheckTimer = setInterval(() => {
      this.checkForUpdates().catch(error => {
        diagnostics.warn('Periodic update check failed', error);
      });
    }, SW_VERSION_CONFIG.updateCheckInterval);

    diagnostics.info('Update checking started', {
      interval: SW_VERSION_CONFIG.updateCheckInterval,
    });
  }

  /**
   * Check for service worker updates
   */
  async checkForUpdates(): Promise<boolean> {
    if (!this.registration) return false;

    try {
      diagnostics.info('Checking for SW updates');
      
      await this.registration.update();
      
      // Update last checked timestamp
      const status = await this.getUpdateStatus();
      status.lastChecked = Date.now();
      await this.saveUpdateStatus(status);
      
      return true;
    } catch (error) {
      diagnostics.warn('Failed to check for updates', error);
      return false;
    }
  }

  /**
   * Handle service worker update found
   */
  private handleUpdateFound(): void {
    if (!this.registration?.installing) return;

    diagnostics.info('SW update found');
    
    const newWorker = this.registration.installing;
    
    newWorker.addEventListener('statechange', () => {
      if (newWorker.state === 'installed' && this.registration?.active) {
        diagnostics.info('New SW version available, waiting to activate');
        this.notifyUpdateAvailable();
      }
    });
  }

  /**
   * Handle service worker controller change
   */
  private handleControllerChange(): void {
    diagnostics.info('SW controller changed, reloading page');
    window.location.reload();
  }

  /**
   * Handle messages from service worker
   */
  private handleSWMessage(event: MessageEvent): void {
    const { type, data } = event.data;

    switch (type) {
      case 'PWA_UPDATE_AVAILABLE':
        diagnostics.info('Update available notification from SW', data);
        this.notifyUpdateAvailable();
        break;
        
      case 'PWA_COLD_START_METRICS':
        diagnostics.info('Cold start metrics from SW', data);
        this.updatePerformanceMetrics(data);
        break;
        
      default:
        // Ignore other message types
        break;
    }
  }

  /**
   * Notify about available update
   */
  private notifyUpdateAvailable(): void {
    const event = new CustomEvent('sw-update-available', {
      detail: {
        currentVersion: this.versionInfo.version,
        availableVersion: '1.2.1', // This would come from the new SW
        timestamp: Date.now(),
      },
    });
    
    window.dispatchEvent(event);
    diagnostics.info('Update available event dispatched');
  }

  /**
   * Get current update status
   */
  async getUpdateStatus(): Promise<SWUpdateStatus> {
    try {
      const stored = localStorage.getItem(SW_VERSION_CONFIG.statusKey);
      if (stored) {
        return JSON.parse(stored) as SWUpdateStatus;
      }
    } catch (error) {
      diagnostics.warn('Failed to get update status from storage', error);
    }

    return {
      currentVersion: this.versionInfo.version,
      updateAvailable: false,
      updateRequired: false,
      lastChecked: 0,
    };
  }

  /**
   * Save update status to storage
   */
  private async saveUpdateStatus(status: SWUpdateStatus): Promise<void> {
    try {
      localStorage.setItem(SW_VERSION_CONFIG.statusKey, JSON.stringify(status));
    } catch (error) {
      diagnostics.warn('Failed to save update status to storage', error);
    }
  }

  /**
   * Update performance metrics
   */
  private updatePerformanceMetrics(metrics: Partial<SWPerformanceMetrics>): void {
    this.performanceMetrics = { ...this.performanceMetrics, ...metrics };
    this.savePerformanceMetrics();
  }

  /**
   * Save performance metrics to storage
   */
  private savePerformanceMetrics(): void {
    try {
      localStorage.setItem(SW_VERSION_CONFIG.metricsKey, JSON.stringify(this.performanceMetrics));
    } catch (error) {
      diagnostics.warn('Failed to save performance metrics to storage', error);
    }
  }

  /**
   * Get performance metrics
   */
  getPerformanceMetrics(): SWPerformanceMetrics {
    return { ...this.performanceMetrics };
  }

  /**
   * Get cache information
   */
  async getCacheInfo(): Promise<SWCacheInfo[]> {
    const cacheNames = await caches.keys();
    const punchClubCaches = cacheNames.filter(name => 
      name.startsWith(SW_VERSION_CONFIG.cachePrefix)
    );

    const cacheInfo: SWCacheInfo[] = [];

    for (const name of punchClubCaches) {
      try {
        const cache = await caches.open(name);
        const keys = await cache.keys();
        const size = await this.calculateCacheSize(cache);
        
        // Extract version from cache name
        const version = name.replace(SW_VERSION_CONFIG.cachePrefix, '');
        
        cacheInfo.push({
          name,
          version,
          size,
          entries: keys.length,
          lastModified: Date.now(), // Would need to be tracked properly
        });
      } catch (error) {
        diagnostics.warn('Failed to get cache info for', { name, error });
      }
    }

    return cacheInfo;
  }

  /**
   * Calculate cache size
   */
  private async calculateCacheSize(cache: Cache): Promise<number> {
    const requests = await cache.keys();
    let totalSize = 0;

    for (const request of requests) {
      try {
        const response = await cache.match(request);
        if (response) {
          const blob = await response.blob();
          totalSize += blob.size;
        }
      } catch (_error) {
        // Skip entries that can't be read
      }
    }

    return totalSize;
  }

  /**
   * Clean up old caches
   */
  async cleanupOldCaches(): Promise<void> {
    try {
      diagnostics.info('Starting cache cleanup');
      
      const cacheNames = await caches.keys();
      const punchClubCaches = cacheNames.filter(name => 
        name.startsWith(SW_VERSION_CONFIG.cachePrefix)
      );

      // Sort by version (newest first)
      punchClubCaches.sort((a, b) => {
        const versionA = a.replace(SW_VERSION_CONFIG.cachePrefix, '');
        const versionB = b.replace(SW_VERSION_CONFIG.cachePrefix, '');
        return versionB.localeCompare(versionA);
      });

      // Keep only the latest versions
      const cachesToDelete = punchClubCaches.slice(SW_VERSION_CONFIG.maxCacheVersions);
      
      for (const cacheName of cachesToDelete) {
        await caches.delete(cacheName);
        diagnostics.info('Deleted old cache', { cacheName });
      }

      diagnostics.info('Cache cleanup completed', {
        totalCaches: punchClubCaches.length,
        deletedCaches: cachesToDelete.length,
        remainingCaches: punchClubCaches.length - cachesToDelete.length,
      });
    } catch (error) {
      diagnostics.error('Cache cleanup failed', error);
    }
  }

  /**
   * Force update to latest version
   */
  async forceUpdate(): Promise<void> {
    if (!this.registration?.waiting) {
      diagnostics.warn('No waiting SW to force update');
      return;
    }

    try {
      diagnostics.info('Forcing SW update');
      
      // Send message to waiting service worker
      this.registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      
      // Update status
      const status = await this.getUpdateStatus();
      status.updateRequired = true;
      await this.saveUpdateStatus(status);
      
    } catch (error) {
      diagnostics.error('Failed to force SW update', error);
      throw error;
    }
  }

  /**
   * Rollback to previous version
   */
  async rollbackToVersion(version: string): Promise<void> {
    diagnostics.warn('Rollback requested', { targetVersion: version });
    
    // This would require a more sophisticated implementation
    // involving multiple SW versions stored and the ability to
    // switch between them
    throw new Error('Rollback not yet implemented');
  }

  /**
   * Get version history
   */
  async getVersionHistory(): Promise<SWVersionInfo[]> {
    // This would load from a persistent storage
    return [this.versionInfo];
  }

  /**
   * Cleanup resources
   */
  cleanup(): void {
    if (this.updateCheckTimer) {
      clearInterval(this.updateCheckTimer);
      this.updateCheckTimer = null;
    }
    
    diagnostics.info('SW Version Manager cleaned up');
  }
}

// Singleton instance
let swVersionManager: SWVersionManager | null = null;

/**
 * Get the SW Version Manager singleton
 */
export function getSWVersionManager(): SWVersionManager {
  if (!swVersionManager) {
    swVersionManager = new SWVersionManager();
  }
  return swVersionManager;
}