import { createPortraitPreloadConfig } from '@/balancing/config/idleVillage/portraitPreloadConfig';

// Single decoded-portrait cache shared by the drag preview (PgCard) and every
// WanderlustMedalOverlay (drag overlay, flight proxy, roster slot). Both sides
// must hit the same entry: a preload with crossOrigin="anonymous" and a plain
// <img> request are separate fetch modes, so the medal re-fetched and stayed
// hidden on the first frame it was dropped into the roster.
const portraitCache = new Map<string, HTMLImageElement>();
const config = createPortraitPreloadConfig();

/** Starts (or reuses) the decode of a portrait. Returns null outside the browser. */
export function preloadPortrait(url: string): HTMLImageElement | null {
  if (typeof document === 'undefined' || !url) return null;
  const cached = portraitCache.get(url);
  if (cached) return cached;

  // LRU eviction if we exceed maxPortraits
  if (portraitCache.size >= config.maxPortraits) {
    const firstKey = portraitCache.keys().next().value;
    if (firstKey) portraitCache.delete(firstKey);
  }

  const img = new Image();
  img.src = url;
  portraitCache.set(url, img);
  return img;
}

/** True when the portrait is already decoded and can be painted synchronously. */
export function isPortraitDecoded(url: string): boolean {
  const img = portraitCache.get(url);
  return !!img && img.complete && img.naturalWidth > 0;
}
