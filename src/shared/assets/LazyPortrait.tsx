/**
 * Lazy Portrait Component
 * 
 * React component for lazy loading character portraits with progressive loading.
 * Implements blur-up placeholders and IntersectionObserver integration.
 * 
 * @since NP-214 – Character Portrait Lazy Loading
 */

import React, { useRef, useEffect } from 'react';
import { useProgressiveImage } from './useProgressiveImage';
import type { ImageSourceSet, AssetLoadingConfig } from './assetLoadingConfig';

/**
 * Lazy portrait props
 */
export interface LazyPortraitProps {
  /** Image sources */
  sources: ImageSourceSet;
  /** Custom configuration */
  config?: Partial<AssetLoadingConfig>;
  /** CSS class name */
  className?: string;
  /** CSS style */
  style?: React.CSSProperties;
  /** Width */
  width?: number | string;
  /** Height */
  height?: number | string;
  /** On load callback */
  onLoad?: () => void;
  /** On error callback */
  onError?: (error: Error) => void;
}

/**
 * Lazy Portrait Component
 */
export const LazyPortrait: React.FC<LazyPortraitProps> = ({
  sources,
  config,
  className,
  style,
  width,
  height,
  onLoad,
  onError,
}) => {
  const imgRef = useRef<HTMLImageElement>(null);
  const { currentSrc, currentQuality, isLoaded, error, progress } = useProgressiveImage(sources, config);

  // Handle load callback
  useEffect(() => {
    if (isLoaded && onLoad) {
      onLoad();
    }
  }, [isLoaded, onLoad]);

  // Handle error callback
  useEffect(() => {
    if (error && onError) {
      onError(error);
    }
  }, [error, onError]);

  // Apply blur-up effect
  const enableBlurUp = config?.progressive?.enableBlurUp ?? true;
  const blurAmount = config?.progressive?.blurAmount ?? 20;
  const shouldBlur = enableBlurUp && currentQuality === 'tiny' && !isLoaded;

  const imgStyle: React.CSSProperties = {
    width: width || '100%',
    height: height || 'auto',
    transition: 'filter 0.3s ease-in-out, opacity 0.3s ease-in-out',
    filter: shouldBlur ? `blur(${blurAmount}px)` : 'none',
    opacity: isLoaded ? 1 : 0.9,
    ...style,
  };

  return (
    <div
      className={className}
      style={{ position: 'relative', overflow: 'hidden' }}
      data-testid="lazy-portrait-container"
    >
      <img
        ref={imgRef}
        src={currentSrc}
        alt={sources.alt}
        style={imgStyle}
        data-quality={currentQuality}
        data-loaded={isLoaded}
        data-progress={progress}
        data-testid="lazy-portrait-image"
      />
      
      {!isLoaded && (
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            width: `${progress * 100}%`,
            height: '2px',
            backgroundColor: 'rgba(59, 130, 246, 0.8)',
            transition: 'width 0.3s ease-in-out',
          }}
          data-testid="lazy-portrait-progress"
        />
      )}
      
      {error && (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            color: 'red',
            fontSize: '12px',
          }}
          data-testid="lazy-portrait-error"
        >
          Failed to load
        </div>
      )}
    </div>
  );
};
