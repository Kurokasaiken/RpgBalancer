import { useEffect, useState } from 'react';

export type AltVisualsV8Quality = 'high' | 'preview';

const QUALITY_STORAGE_KEY = 'alt-visuals-v8-quality';

function detectInitialQuality(): AltVisualsV8Quality {
  if (typeof window === 'undefined') {
    return 'high';
  }

  const stored = window.localStorage.getItem(QUALITY_STORAGE_KEY) as AltVisualsV8Quality | null;
  if (stored === 'high' || stored === 'preview') {
    return stored;
  }

  const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  const lowThreads = typeof navigator !== 'undefined' && navigator.hardwareConcurrency
    ? navigator.hardwareConcurrency <= 4
    : false;

  if (reducedMotion || lowThreads) {
    return 'preview';
  }

  return 'high';
}

export function useAltVisualsV8Quality(): AltVisualsV8Quality {
  const [quality, setQuality] = useState<AltVisualsV8Quality>(() => detectInitialQuality());

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const media = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    if (!media) {
      return;
    }

    const handler = (event: MediaQueryListEvent) => {
      setQuality(event.matches ? 'preview' : 'high');
    };

    media.addEventListener('change', handler);
    return () => {
      media.removeEventListener('change', handler);
    };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    window.localStorage.setItem(QUALITY_STORAGE_KEY, quality);
  }, [quality]);

  return quality;
}
