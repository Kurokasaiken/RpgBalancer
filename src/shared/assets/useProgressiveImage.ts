/**
 * Progressive Image Hook
 * 
 * React hook for progressive image loading with IntersectionObserver.
 * Implements tiny→low→full quality progression with blur-up effect.
 * 
 * @since NP-214 – Character Portrait Lazy Loading
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  type AssetLoadingConfig,
  type ImageSourceSet,
  type ImageQuality,
  DEFAULT_ASSET_LOADING_CONFIG,
  getImageUrl,
} from './assetLoadingConfig';

/**
 * Progressive image state
 */
export interface ProgressiveImageState {
  /** Current image URL */
  currentSrc: string;
  /** Current quality level */
  currentQuality: ImageQuality;
  /** Is image loaded */
  isLoaded: boolean;
  /** Is loading */
  isLoading: boolean;
  /** Load error */
  error: Error | null;
  /** Load progress (0-1) */
  progress: number;
}

/**
 * Use progressive image hook
 */
export function useProgressiveImage(
  sources: ImageSourceSet,
  config: Partial<AssetLoadingConfig> = {}
): ProgressiveImageState {
  const fullConfig: AssetLoadingConfig = {
    ...DEFAULT_ASSET_LOADING_CONFIG,
    ...config,
  };

  const [state, setState] = useState<ProgressiveImageState>({
    currentSrc: sources.tiny || sources.low || sources.full,
    currentQuality: 'tiny',
    isLoaded: false,
    isLoading: false,
    error: null,
    progress: 0,
  });

  const imgRef = useRef<HTMLImageElement | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const currentQualityIndexRef = useRef(0);
  const loadStartTimeRef = useRef(0);

  /**
   * Load image at quality level
   */
  const loadImage = useCallback((quality: ImageQuality): Promise<void> => {
    return new Promise((resolve, reject) => {
      const url = getImageUrl(sources, quality);
      const img = new Image();
      
      const timeout = setTimeout(() => {
        reject(new Error('Image load timeout'));
      }, fullConfig.performance.loadTimeoutMs);

      img.onload = () => {
        clearTimeout(timeout);
        resolve();
      };

      img.onerror = () => {
        clearTimeout(timeout);
        reject(new Error('Image load failed'));
      };

      img.src = url;
    });
  }, [sources, fullConfig.performance.loadTimeoutMs]);

  /**
   * Upgrade to next quality level
   */
  const upgradeQuality = useCallback(async () => {
    if (!fullConfig.progressive.enabled) return;

    const qualities = fullConfig.progressive.qualities;
    const nextIndex = currentQualityIndexRef.current + 1;

    if (nextIndex >= qualities.length) {
      setState(prev => ({ ...prev, isLoaded: true, isLoading: false, progress: 1 }));
      
      if (fullConfig.telemetry.enabled && fullConfig.telemetry.trackLoadTimes) {
        const loadTime = Date.now() - loadStartTimeRef.current;
        console.log('[Telemetry] portrait_loaded', {
          src: sources.full,
          loadTime,
          finalQuality: qualities[qualities.length - 1],
        });
      }
      return;
    }

    const nextQuality = qualities[nextIndex];
    setState(prev => ({ ...prev, isLoading: true }));

    try {
      await loadImage(nextQuality);
      
      const nextSrc = getImageUrl(sources, nextQuality);
      currentQualityIndexRef.current = nextIndex;
      
      setState(prev => ({
        ...prev,
        currentSrc: nextSrc,
        currentQuality: nextQuality,
        isLoading: false,
        progress: (nextIndex + 1) / qualities.length,
      }));

      if (fullConfig.telemetry.enabled && fullConfig.telemetry.trackUpgrades) {
        console.log('[Telemetry] portrait_quality_upgraded', {
          src: sources.full,
          quality: nextQuality,
          index: nextIndex,
        });
      }

      // Schedule next upgrade
      if (nextIndex < qualities.length - 1) {
        setTimeout(() => {
          upgradeQuality();
        }, fullConfig.progressive.upgradeDelayMs);
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error as Error,
        isLoading: false,
      }));
    }
  }, [fullConfig, sources, loadImage]);

  /**
   * Start loading process
   */
  const startLoading = useCallback(() => {
    if (!fullConfig.enabled) return;

    loadStartTimeRef.current = Date.now();
    setState(prev => ({ ...prev, isLoading: true }));

    if (fullConfig.strategy === 'eager') {
      // Load full quality immediately
      const url = getImageUrl(sources, 'full');
      setState(prev => ({
        ...prev,
        currentSrc: url,
        currentQuality: 'full',
        isLoaded: true,
        isLoading: false,
        progress: 1,
      }));
    } else if (fullConfig.strategy === 'progressive') {
      // Start progressive loading
      upgradeQuality();
    }
  }, [fullConfig, sources, upgradeQuality]);

  /**
   * Setup IntersectionObserver
   */
  useEffect(() => {
    if (!fullConfig.enabled || fullConfig.strategy === 'eager') {
      startLoading();
      return;
    }

    const element = imgRef.current;
    if (!element) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !state.isLoading && !state.isLoaded) {
            startLoading();
            observerRef.current?.disconnect();
          }
        });
      },
      {
        rootMargin: fullConfig.observer.rootMargin,
        threshold: fullConfig.observer.threshold,
      }
    );

    observerRef.current.observe(element);

    return () => {
      observerRef.current?.disconnect();
    };
  }, [fullConfig, state.isLoading, state.isLoaded, startLoading]);

  return state;
}

/**
 * Preload images
 */
export function preloadImages(
  sources: ImageSourceSet[],
  quality: ImageQuality = 'low'
): Promise<void[]> {
  const promises = sources.map((source) => {
    return new Promise<void>((resolve, reject) => {
      const url = getImageUrl(source, quality);
      const img = new Image();
      
      img.onload = () => resolve();
      img.onerror = () => reject(new Error('Preload failed'));
      img.src = url;
    });
  });

  return Promise.all(promises);
}
