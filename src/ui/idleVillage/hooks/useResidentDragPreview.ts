import { useEffect, useRef, useState } from 'react';
import { createPortraitPreloadConfig } from '@/balancing/config/idleVillage/portraitPreloadConfig';

let dragPreviewHost: HTMLDivElement | null = null;

// Global cache for decoded portrait images
const portraitCache = new Map<string, HTMLImageElement>();
const config = createPortraitPreloadConfig();

/**
 * Preload a portrait image globally to prevent drag delays.
 * Call this during idle time or on hover.
 */
export const preloadPortrait = (url: string) => {
  if (typeof document === 'undefined' || !url) return;
  if (portraitCache.has(url)) return;

  // LRU eviction if we exceed maxPortraits
  if (portraitCache.size >= config.maxPortraits) {
    const firstKey = portraitCache.keys().next().value;
    if (firstKey) portraitCache.delete(firstKey);
  }

  const img = new Image();
  img.crossOrigin = 'anonymous';
  img.src = url;
  portraitCache.set(url, img);
};

const getDragPreviewHost = () => {
  if (typeof document === 'undefined') {
    return null;
  }

  if (!dragPreviewHost) {
    dragPreviewHost = document.createElement('div');
    dragPreviewHost.id = 'resident-drag-preview-host';
    Object.assign(dragPreviewHost.style, {
      position: 'fixed',
      top: '-10000px',
      left: '-10000px',
      width: '0px',
      height: '0px',
      pointerEvents: 'none',
    });
    document.body.appendChild(dragPreviewHost);
  }

  return dragPreviewHost;
};

interface UseResidentDragPreviewOptions {
  residentId: string;
  label: string;
  portraitUrl?: string;
  size?: number; // Default 72px
}

/**
 * Hook that pre-generates a circular drag preview image (Canvas) for a resident.
 * This avoids the "world icon" issue (image not ready) and allows true circular cropping
 * with portraits, which native setDragImage often fails to handle with simple elements.
 */
export function useResidentDragPreview({
  residentId,
  label,
  portraitUrl,
  size = 72,
}: UseResidentDragPreviewOptions) {
  const dragImageRef = useRef<HTMLCanvasElement | null>(null);
  const [isReady, setIsReady] = useState(() => !portraitUrl);

  // Eagerly preload if url changes
  useEffect(() => {
    if (portraitUrl) preloadPortrait(portraitUrl);
  }, [portraitUrl]);

  useEffect(() => {
    let active = true;
    const host = getDragPreviewHost();
    const canvasWrapper = host ? document.createElement('div') : null;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    canvas.style.width = `${size}px`;
    canvas.style.height = `${size}px`;
    const ctx = canvas.getContext('2d');

    if (!ctx) return;

    const renderPreview = (img?: HTMLImageElement, forceReady = false) => {
      if (!active) return;
      
      // Clear
      ctx.clearRect(0, 0, size, size);

      // Center & Radius
      const cx = size / 2;
      const cy = size / 2;
      const radius = (size / 2) - 2; // Leave room for glow/stroke

      // 1. Draw Glow/Shadow (simulated via gradient)
      const gradient = ctx.createRadialGradient(cx, cy, radius - 5, cx, cy, radius + 2);
      gradient.addColorStop(0, 'rgba(251, 191, 36, 0)'); // Transparent inner
      gradient.addColorStop(0.8, 'rgba(251, 191, 36, 0.4)'); // Amber glow
      gradient.addColorStop(1, 'rgba(251, 191, 36, 0)'); // Fade out
      
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, size, size);

      // 2. Clip Circle
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();

      // 3. Background / Image
      ctx.fillStyle = 'rgba(6, 8, 14, 0.95)';
      ctx.fillRect(0, 0, size, size);

      if (img) {
        try {
          // Draw image cover-style
          const scale = Math.max(size / img.width, size / img.height);
          const x = (size / 2) - (img.width / 2) * scale;
          const y = (size / 2) - (img.height / 2) * scale;
          ctx.drawImage(img, x, y, img.width * scale, img.height * scale);
        } catch (e) {
          // Fallback if draw fails
        }
      }

      // 4. Gradient overlay on top of image (for text legibility or style)
      if (img) {
        const overlay = ctx.createLinearGradient(0, 0, size, size);
        overlay.addColorStop(0, 'rgba(255,255,255,0.1)');
        overlay.addColorStop(1, 'rgba(0,0,0,0.3)');
        ctx.fillStyle = overlay;
        ctx.fill();
      }

      // 5. Initials if no image
      if (!img) {
        ctx.fillStyle = '#f7ebd2';
        ctx.font = '700 24px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const initials = label.slice(0, 2).toUpperCase();
        ctx.fillText(initials, cx, cy);
      }

      // Restore clip
      ctx.restore();

      dragImageRef.current = canvas;
      if (canvasWrapper && host && !canvasWrapper.contains(canvas)) {
        canvasWrapper.style.width = `${size}px`;
        canvasWrapper.style.height = `${size}px`;
        canvasWrapper.style.pointerEvents = 'none';
        canvasWrapper.appendChild(canvas);
        host.appendChild(canvasWrapper);
      }
      canvas.dataset.pgDragPreview = 'true';
      canvas.dataset.pgPreviewShape = 'circle';
      canvas.dataset.pgPreviewSource = img ? 'portrait' : 'initials';
      canvas.dataset.pgPreviewBorder = 'none';
      canvas.dataset.dragPreview = 'true'; // Add this for test tracking

      const shouldBeReady = forceReady || img !== undefined || !portraitUrl;
      setIsReady(shouldBeReady);
    };

    if (portraitUrl) {
      let img = portraitCache.get(portraitUrl);
      
      if (!img) {
        // Enforce limits for ad-hoc loads too
        if (portraitCache.size >= config.maxPortraits) {
          const firstKey = portraitCache.keys().next().value;
          if (firstKey) portraitCache.delete(firstKey);
        }
        img = new Image();
        img.crossOrigin = 'anonymous'; // Important for canvas export if needed
        img.src = portraitUrl;
        portraitCache.set(portraitUrl, img);
      }

      const handleLoad = () => renderPreview(img, true);
      const handleError = () => renderPreview(undefined, true);
      
      if (img.complete && img.naturalWidth > 0) {
        handleLoad();
      } else {
        img.addEventListener('load', handleLoad);
        img.addEventListener('error', handleError);
      }
      
      // Cleanup event listeners
      return () => {
        active = false;
        img?.removeEventListener('load', handleLoad);
        img?.removeEventListener('error', handleError);
        if (canvasWrapper && host && host.contains(canvasWrapper)) {
          host.removeChild(canvasWrapper);
        }
      };
    } else {
      renderPreview();
    }

    return () => {
      active = false;
      if (canvasWrapper && host && host.contains(canvasWrapper)) {
        host.removeChild(canvasWrapper);
      }
    };
  }, [residentId, label, portraitUrl, size]);

  return { dragImageRef, isReady };
}
