import { ALL_PORTRAIT_ASSET_URLS } from '@/balancing/config/idleVillage/medalPortraitAssets';
import { preloadPortrait } from '@/ui/idleVillage/utils/portraitDecodeCache';
import { NODE_ART } from '@/ui/idleVillage/questS1Lab/questArt';

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

/* R-239: the quest theatre's first paint was a ~1.1s black frame — the DOM
 *  `<img>` under `DepthScene` mounts instantly but the big scene jpeg still
 *  has to be fetched+decoded. Warming the authored scene art at boot (idle
 *  decode, retained refs) means a scene beat lands on an already-painted
 *  picture. Unique srcs only — NODE_ART maps many nodes onto shared art. */
const retainedSceneArt: HTMLImageElement[] = [];

/** Unique authored scene-art URLs for every quest node (`NODE_ART`). */
export const questSceneArtUrls = (): string[] => [...new Set(Object.values(NODE_ART).map((a) => a.src))];

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
  const sceneArt = questSceneArtUrls().map((url) => {
    const img = new Image();
    img.src = url;
    retainedSceneArt.push(img);
    return decodeQuietly(img);
  });
  return Promise.allSettled([...portraits, ...cursors, ...sceneArt]).then(() => undefined);
}
