import { controlsFrame } from '@/generated/slicekit/controlsFrame';

/**
 * Preload the painted-control art (PLAN-128 `controls` slice-kit: round + pill, 5 states each).
 *
 * The state pieces (hover / pressed / selected / disabled) are CSS `background-image`s that the browser only
 * requests when the state first applies — without this, the first hover or selection draws the glow with no
 * ring for a frame or more. The file list comes from the generated manifest (single source of truth), so a
 * re-slice never leaves a stale list here. Idempotent; a no-op outside the browser.
 */
let started = false;
export function preloadControlsArt(): void {
  if (started || typeof Image === 'undefined') return;
  started = true;
  for (const piece of controlsFrame.pieces) {
    const img = new Image();
    img.decoding = 'async';
    img.src = `${controlsFrame.assetBase}${piece.file}`;
  }
}
