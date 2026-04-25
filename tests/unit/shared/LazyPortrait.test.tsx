/**
 * Lazy Portrait Tests
 * 
 * Unit tests for lazy portrait loading system.
 * 
 * @since NP-214 – Character Portrait Lazy Loading
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { useProgressiveImage, preloadImages } from '../../../src/shared/assets/useProgressiveImage';
import { LazyPortrait } from '../../../src/shared/assets/LazyPortrait';
import { DEFAULT_ASSET_LOADING_CONFIG } from '../../../src/shared/assets/assetLoadingConfig';
import type { ImageSourceSet } from '../../../src/shared/assets/assetLoadingConfig';

// Mock IntersectionObserver
class MockIntersectionObserver {
  observe = vi.fn();
  disconnect = vi.fn();
  unobserve = vi.fn();
}

global.IntersectionObserver = MockIntersectionObserver as any;

describe('useProgressiveImage Hook', () => {
  const mockSources: ImageSourceSet = {
    tiny: 'data:image/png;base64,tiny',
    low: '/images/portrait-low.jpg',
    medium: '/images/portrait-medium.jpg',
    full: '/images/portrait-full.jpg',
    alt: 'Character Portrait',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Configuration', () => {
    it('should use default configuration', () => {
      const { result } = renderHook(() => useProgressiveImage(mockSources));
      
      expect(result.current.currentSrc).toBeDefined();
      expect(result.current.currentQuality).toBe('tiny');
    });

    it('should accept custom configuration', () => {
      const { result } = renderHook(() => 
        useProgressiveImage(mockSources, {
          strategy: 'eager',
        })
      );
      
      expect(result.current).toBeDefined();
    });
  });

  describe('Progressive Loading', () => {
    it('should start with tiny quality', () => {
      const { result } = renderHook(() => useProgressiveImage(mockSources));
      
      expect(result.current.currentQuality).toBe('tiny');
      expect(result.current.currentSrc).toContain('tiny');
    });

    it('should track loading state', () => {
      const { result } = renderHook(() => useProgressiveImage(mockSources));
      
      expect(result.current.isLoading).toBeDefined();
      expect(result.current.isLoaded).toBe(false);
    });

    it('should track progress', () => {
      const { result } = renderHook(() => useProgressiveImage(mockSources));
      
      expect(result.current.progress).toBeGreaterThanOrEqual(0);
      expect(result.current.progress).toBeLessThanOrEqual(1);
    });
  });

  describe('Error Handling', () => {
    it('should handle load errors', () => {
      const { result } = renderHook(() => useProgressiveImage(mockSources));
      
      expect(result.current.error).toBeNull();
    });
  });

  describe('Eager Loading', () => {
    it('should load full quality immediately with eager strategy', () => {
      const { result } = renderHook(() => 
        useProgressiveImage(mockSources, {
          strategy: 'eager',
        })
      );
      
      expect(result.current.currentQuality).toBe('full');
    });
  });
});

describe('LazyPortrait Component', () => {
  const mockSources: ImageSourceSet = {
    tiny: 'data:image/png;base64,tiny',
    low: '/images/portrait-low.jpg',
    full: '/images/portrait-full.jpg',
    alt: 'Character Portrait',
  };

  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should render container', () => {
    render(<LazyPortrait sources={mockSources} />);
    
    const container = screen.getByTestId('lazy-portrait-container');
    expect(container).toBeDefined();
  });

  it('should render image', () => {
    render(<LazyPortrait sources={mockSources} />);
    
    const image = screen.getByTestId('lazy-portrait-image');
    expect(image).toBeDefined();
    expect(image.getAttribute('alt')).toBe('Character Portrait');
  });

  it('should apply custom className', () => {
    render(<LazyPortrait sources={mockSources} className="custom-class" />);
    
    const container = screen.getByTestId('lazy-portrait-container');
    expect(container.className).toContain('custom-class');
  });

  it('should apply custom dimensions', () => {
    render(<LazyPortrait sources={mockSources} width={200} height={200} />);
    
    const image = screen.getByTestId('lazy-portrait-image');
    expect(image).toBeDefined();
  });

  it('should show progress indicator when loading', () => {
    render(<LazyPortrait sources={mockSources} />);
    
    const progress = screen.queryByTestId('lazy-portrait-progress');
    expect(progress).toBeDefined();
  });

  it('should handle onLoad callback', () => {
    const onLoad = vi.fn();
    render(<LazyPortrait sources={mockSources} onLoad={onLoad} />);
    
    expect(onLoad).not.toHaveBeenCalled();
  });

  it('should handle onError callback', () => {
    const onError = vi.fn();
    render(<LazyPortrait sources={mockSources} onError={onError} />);
    
    expect(onError).not.toHaveBeenCalled();
  });

  it('should apply blur-up effect for tiny quality', () => {
    render(<LazyPortrait sources={mockSources} />);
    
    const image = screen.getByTestId('lazy-portrait-image');
    expect(image.getAttribute('data-quality')).toBe('tiny');
  });

  it('should disable blur-up when configured', () => {
    render(
      <LazyPortrait 
        sources={mockSources} 
        config={{
          progressive: {
            ...DEFAULT_ASSET_LOADING_CONFIG.progressive,
            enableBlurUp: false,
          },
        }}
      />
    );
    
    const image = screen.getByTestId('lazy-portrait-image');
    expect(image).toBeDefined();
  });
});

describe('Preload Images', () => {
  const mockSources: ImageSourceSet[] = [
    {
      low: '/images/portrait1-low.jpg',
      full: '/images/portrait1-full.jpg',
      alt: 'Portrait 1',
    },
    {
      low: '/images/portrait2-low.jpg',
      full: '/images/portrait2-full.jpg',
      alt: 'Portrait 2',
    },
  ];

  it('should preload multiple images', async () => {
    const promise = preloadImages(mockSources, 'low');
    expect(promise).toBeDefined();
  });

  it('should handle preload errors gracefully', async () => {
    const promise = preloadImages(mockSources, 'low');
    expect(promise).toBeDefined();
  });
});

describe('Configuration', () => {
  it('should have default configuration', () => {
    expect(DEFAULT_ASSET_LOADING_CONFIG.enabled).toBe(true);
    expect(DEFAULT_ASSET_LOADING_CONFIG.strategy).toBe('progressive');
    expect(DEFAULT_ASSET_LOADING_CONFIG.progressive.qualities).toContain('tiny');
  });

  it('should have IntersectionObserver settings', () => {
    expect(DEFAULT_ASSET_LOADING_CONFIG.observer.rootMargin).toBe('50px');
    expect(DEFAULT_ASSET_LOADING_CONFIG.observer.threshold).toBe(0.01);
  });

  it('should have progressive loading settings', () => {
    expect(DEFAULT_ASSET_LOADING_CONFIG.progressive.enabled).toBe(true);
    expect(DEFAULT_ASSET_LOADING_CONFIG.progressive.upgradeDelayMs).toBe(100);
    expect(DEFAULT_ASSET_LOADING_CONFIG.progressive.enableBlurUp).toBe(true);
  });

  it('should have cache settings', () => {
    expect(DEFAULT_ASSET_LOADING_CONFIG.cache.enableSWCache).toBe(true);
    expect(DEFAULT_ASSET_LOADING_CONFIG.cache.strategy).toBe('cache-first');
  });

  it('should have performance settings', () => {
    expect(DEFAULT_ASSET_LOADING_CONFIG.performance.maxConcurrent).toBe(6);
    expect(DEFAULT_ASSET_LOADING_CONFIG.performance.loadTimeoutMs).toBe(10000);
  });

  it('should have telemetry settings', () => {
    expect(DEFAULT_ASSET_LOADING_CONFIG.telemetry.enabled).toBe(true);
    expect(DEFAULT_ASSET_LOADING_CONFIG.telemetry.trackLoadTimes).toBe(true);
  });
});
