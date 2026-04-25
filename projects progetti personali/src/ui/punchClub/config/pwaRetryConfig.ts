/**
 * PWA Retry Configuration
 * 
 * Configuration for PWA install retry logic, offline detection, and user messaging
 * Designed to meet PC-M2 KPIs: install success ≥90%, cold start <3s
 */

/**
 * Retry strategy configuration
 */
export interface PWARetryStrategy {
  /** Maximum number of retry attempts */
  maxRetries: number;
  /** Initial delay in milliseconds */
  initialDelay: number;
  /** Maximum delay in milliseconds */
  maxDelay: number;
  /** Exponential backoff multiplier */
  backoffMultiplier: number;
  /** Jitter factor to prevent thundering herd */
  jitterFactor: number;
}

/**
 * Offline detection configuration
 */
export interface PWAOfflineDetection {
  /** Enable offline detection */
  enabled: boolean;
  /** Check interval in milliseconds */
  checkInterval: number;
  /** Timeout for network requests in milliseconds */
  requestTimeout: number;
  /** Number of failed requests before considering offline */
  failureThreshold: number;
  /** URLs to test for connectivity */
  testUrls: string[];
}

/**
 * User messaging configuration
 */
export interface PWAMessagingConfig {
  /** Enable user notifications */
  enabled: boolean;
  /** Show offline banner */
  showOfflineBanner: boolean;
  /** Show retry prompts */
  showRetryPrompts: boolean;
  /** Auto-dismiss delay in milliseconds */
  autoDismissDelay: number;
  /** Message localization */
  messages: {
    offline: string;
    retryAvailable: string;
    installFailed: string;
    retrySuccess: string;
    versionMismatch: string;
  };
}

/**
 * Cache management configuration
 */
export interface PWACacheConfig {
  /** Enable cache busting */
  enableBusting: boolean;
  /** Cache version */
  version: string;
  /** Cache invalidation strategy */
  invalidationStrategy: 'version' | 'timestamp' | 'manual';
  /** Maximum cache age in milliseconds */
  maxAge: number;
  /** Cache size limit in bytes */
  maxSize: number;
}

/**
 * Performance thresholds for KPI monitoring
 */
export interface PWAPerformanceThresholds {
  /** Cold start time threshold in milliseconds */
  coldStartThreshold: number;
  /** Install success rate threshold (0-1) */
  installSuccessThreshold: number;
  /** SW activation time threshold in milliseconds */
  swActivationThreshold: number;
  /** Cache hit rate threshold (0-1) */
  cacheHitRateThreshold: number;
}

/**
 * Complete PWA retry configuration
 */
export interface PWARetryConfig {
  /** Retry strategy for failed installs */
  retry: PWARetryStrategy;
  /** Offline detection settings */
  offline: PWAOfflineDetection;
  /** User messaging settings */
  messaging: PWAMessagingConfig;
  /** Cache management settings */
  cache: PWACacheConfig;
  /** Performance thresholds */
  thresholds: PWAPerformanceThresholds;
  /** Enable debug logging */
  debug: boolean;
}

/**
 * Default retry strategy with exponential backoff
 */
export const DEFAULT_RETRY_STRATEGY: PWARetryStrategy = {
  maxRetries: 3,
  initialDelay: 1000, // 1 second
  maxDelay: 30000, // 30 seconds
  backoffMultiplier: 2,
  jitterFactor: 0.1, // 10% jitter
};

/**
 * Default offline detection configuration
 */
export const DEFAULT_OFFLINE_DETECTION: PWAOfflineDetection = {
  enabled: true,
  checkInterval: 30000, // 30 seconds
  requestTimeout: 5000, // 5 seconds
  failureThreshold: 3,
  testUrls: [
    '/', // App root
    '/manifest.json', // PWA manifest
    'https://httpbin.org/get', // External connectivity test
  ],
};

/**
 * Default user messaging configuration
 */
export const DEFAULT_MESSAGING_CONFIG: PWAMessagingConfig = {
  enabled: true,
  showOfflineBanner: true,
  showRetryPrompts: true,
  autoDismissDelay: 5000, // 5 seconds
  messages: {
    offline: 'You\'re currently offline. Some features may be unavailable.',
    retryAvailable: 'Install failed. Would you like to try again?',
    installFailed: 'Installation failed. Please check your connection and try again.',
    retrySuccess: 'Installation completed successfully!',
    versionMismatch: 'A new version is available. Please refresh the page.',
  },
};

/**
 * Default cache management configuration
 */
export const DEFAULT_CACHE_CONFIG: PWACacheConfig = {
  enableBusting: true,
  version: '1.1.0',
  invalidationStrategy: 'version',
  maxAge: 86400000, // 24 hours
  maxSize: 50 * 1024 * 1024, // 50MB
};

/**
 * Default performance thresholds for PC-M2 KPIs
 */
export const DEFAULT_PERFORMANCE_THRESHOLDS: PWAPerformanceThresholds = {
  coldStartThreshold: 3000, // 3 seconds
  installSuccessThreshold: 0.9, // 90%
  swActivationThreshold: 1000, // 1 second
  cacheHitRateThreshold: 0.8, // 80%
};

/**
 * Default PWA retry configuration
 */
export const DEFAULT_PWA_RETRY_CONFIG: PWARetryConfig = {
  retry: DEFAULT_RETRY_STRATEGY,
  offline: DEFAULT_OFFLINE_DETECTION,
  messaging: DEFAULT_MESSAGING_CONFIG,
  cache: DEFAULT_CACHE_CONFIG,
  thresholds: DEFAULT_PERFORMANCE_THRESHOLDS,
  debug: false,
};

/**
 * Calculate retry delay with exponential backoff and jitter
 */
export function calculateRetryDelay(
  attempt: number,
  strategy: PWARetryStrategy = DEFAULT_RETRY_STRATEGY
): number {
  const exponentialDelay = strategy.initialDelay * Math.pow(strategy.backoffMultiplier, attempt);
  const cappedDelay = Math.min(exponentialDelay, strategy.maxDelay);
  
  // Add jitter to prevent thundering herd
  const jitter = cappedDelay * strategy.jitterFactor * Math.random();
  const finalDelay = cappedDelay + jitter;
  
  return Math.floor(finalDelay);
}

/**
 * Check if retry should be attempted based on strategy
 */
export function shouldRetry(
  attempt: number,
  error?: Error,
  strategy: PWARetryStrategy = DEFAULT_RETRY_STRATEGY
): boolean {
  if (attempt >= strategy.maxRetries) {
    return false;
  }
  
  // Don't retry on certain error types
  if (error) {
    const nonRetryableErrors = [
      'NotAllowedError', // User denied permission
      'NotSupportedError', // PWA not supported
      'SecurityError', // Security restrictions
    ];
    
    if (nonRetryableErrors.includes(error.name)) {
      return false;
    }
  }
  
  return true;
}

/**
 * Generate cache key with version
 */
export function generateCacheKey(key: string, version: string): string {
  return `${version}-${key}`;
}

/**
 * Check if cache entry is expired
 */
export function isCacheExpired(timestamp: number, maxAge: number): boolean {
  return Date.now() - timestamp > maxAge;
}

/**
 * Format retry attempt for display
 */
export function formatRetryAttempt(attempt: number, maxRetries: number): string {
  return `Attempt ${attempt + 1} of ${maxRetries}`;
}

/**
 * Get localized message based on key
 */
export function getMessage(
  key: keyof PWAMessagingConfig['messages'],
  config: PWAMessagingConfig = DEFAULT_MESSAGING_CONFIG
): string {
  return config.messages[key] || key;
}

/**
 * Validate configuration
 */
export function validateConfig(config: PWARetryConfig): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  // Validate retry strategy
  if (config.retry.maxRetries < 0 || config.retry.maxRetries > 10) {
    errors.push('maxRetries must be between 0 and 10');
  }
  
  if (config.retry.initialDelay < 100 || config.retry.initialDelay > 60000) {
    errors.push('initialDelay must be between 100ms and 60s');
  }
  
  if (config.retry.backoffMultiplier < 1 || config.retry.backoffMultiplier > 5) {
    errors.push('backoffMultiplier must be between 1 and 5');
  }
  
  // Validate thresholds
  if (config.thresholds.installSuccessThreshold < 0 || config.thresholds.installSuccessThreshold > 1) {
    errors.push('installSuccessThreshold must be between 0 and 1');
  }
  
  if (config.thresholds.coldStartThreshold < 1000 || config.thresholds.coldStartThreshold > 10000) {
    errors.push('coldStartThreshold must be between 1s and 10s');
  }
  
  // Validate cache config
  if (config.cache.maxSize < 1024 * 1024 || config.cache.maxSize > 100 * 1024 * 1024) {
    errors.push('maxSize must be between 1MB and 100MB');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
}
