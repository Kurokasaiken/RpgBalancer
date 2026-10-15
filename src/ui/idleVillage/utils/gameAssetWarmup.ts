import { ALL_PORTRAIT_ASSET_URLS } from '@/balancing/config/idleVillage/medalPortraitAssets';
import { preloadPortrait } from '@/ui/idleVillage/utils/portraitDecodeCache';

// Cursor images named in gameFrameCursors.css, every density the image-set may pick.
// A CSS cursor is fetched on first use: cold, the browser shows the fallback
// keyword (the white system hand) until the PNG arrives.
const CURSOR_NAMES = [
  'point-default', 'point-interact', 'point-inspect', 'point-wait', 'point-disabled',
  'hand-grab', 'hand-drag', 'hand-pan', 'hand-drop-yes', 'hand-drop-no',
] as const;
const CURSOR_URLS = CURSOR_NAMES.flatMap((name) =>
  ['', '@1.5x', '@2x'].map((density) => `/assets/ui/cursors/game-${name}${density}.png`),
);

// Held for the page lifetime so the decoded cursors are not collected.
const retainedCursors: HTMLImageElement[] = [];

const decodeQuietly = (img: HTMLImageElement | null) => (img ? img.decode().catch(() => undefined) : undefined);

/**
 * Loads and decodes what /game needs on its first interaction but does not
 * render at boot: portraits (roster, hero sheet, medallion) live in panels that
 * are closed while the veil is up, and cursors load only when first shown.
 * Resolves when everything settled (failures included) — never rejects.
 */
export function warmGameAssets(): Promise<void> {
  if (typeof document === 'undefined') return Promise.resolve();
  const portraits = ALL_PORTRAIT_ASSET_URLS.map((url) => decodeQuietly(preloadPortrait(url)));
  const cursors = CURSOR_URLS.map((url) => {
    const img = new Image();
    img.src = url;
    retainedCursors.push(img);
    return decodeQuietly(img);
  });
  return Promise.allSettled([...portraits, ...cursors]).then(() => undefined);
}
