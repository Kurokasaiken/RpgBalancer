import { useMemo } from 'react';
import { atmosphereAssets, SEA_RIPPLE_FILTER_ID } from '../config/atmosphereAssets';
import type { SeaRippleConfig } from '../config/atmosphereAssets';

export interface WorldSurfaceSeaRippleProps {
  enabled?: boolean;
  /** Only used by `sprite` mode, which paints an overlay of its own. */
  zIndex: number;
  /** Optional override. Defaults to {@link atmosphereAssets.seaRipple}. */
  config?: SeaRippleConfig;
}

/**
 * Coastal water motion for the real World Surface map.
 *
 * WHAT MOVES, and why that is the whole point. In `/sea-effect-lab` the approved
 * variant (`rippleSoft`) puts `feTurbulence` + `feDisplacementMap` on the ONE visible
 * `<img src=Mare.webp>` — no masked copy, no blend, no opacity. `Mare.webp` carries
 * alpha and is transparent over the land, so what the displacement moves is the sea's
 * own alpha edge against the still `Background.webp`: the coastline, plus the painted
 * ink of the shoreline. That is what the Director approved, and it is why the effect
 * reads on coasts and nowhere else — measured, the open sea has a mean 3px gradient of
 * 0.376/255, so ±2 source px of displacement changes luminance by ~0.25 of 255 and is
 * physically invisible; the `Isolotto sud` crop has a p99 gradient of 14.
 *
 * So in `smil` mode this component renders NOTHING VISIBLE. It contributes only the
 * `<filter>` definition, and `WorldSurfaceRenderer` applies it to the sea layer's own
 * `<img>`. There is no second copy of the sea anywhere.
 *
 * WHY THE PREVIOUS VERSION WAS INVISIBLE — twice over, both mathematically.
 *
 * The first port copied the lab's zoom compensation along with the filter:
 * `baseFrequency / zoom` and `scale * zoom`. That is correct in the lab, where the
 * filter sits on an `<img>` already at screen scale, so filter user space IS screen
 * px. In the renderer the same code landed on an element INSIDE the world box — i.e.
 * in world px, inside `transform: scale(camera.zoom)`. There the compensation runs the
 * wrong way, and the error is 1/zoom²: at the real default zoom of 0.18 that is ~31x.
 * The numbers it produced: `scale = 4 × 0.18 = 0.72` world px, so a maximum offset of
 * ±0.36 world px = **±0.065 px on screen**, with a noise wavelength of 2.7 screen px.
 * Sub-pixel grain. Not a tuning problem — an arithmetic one.
 *
 * The fix that followed then removed the displacement and kept the masked copy, which
 * is worse: a pixel-identical, pixel-aligned copy of `Mare.webp` at 50% opacity that
 * translates rigidly has a delta of exactly zero against the layer beneath it at 0%
 * and 100% of its cycle, and is a ghost in between. Three further attenuations stacked
 * on top: `mix-blend-mode: overlay` neutralised by the stacking context its own
 * `z-index` wrapper created, a `shallow_mask.webp` whose mean alpha is 6.8%, and the
 * wrong subject.
 *
 * THE UNITS, stated once so the mistake cannot recur. The sea `<img>` fills the world
 * box, so its filter user space is **world px** (canvas 4240 wide) and does NOT change
 * with camera zoom. Therefore nothing here is divided or multiplied by zoom. To carry
 * the lab's proportions across: the lab's wavelength is 2.71% of the image width and
 * its peak offset 0.065% of it, both zoom-independent. On a 4240-wide box that is a
 * wavelength of ~115 world px (`baseFrequency` 0.0087) and a peak offset of ±2.76
 * world px (`scale` 5.52).
 *
 * `scale` ships at 10 rather than 5.52 on purpose. 5.52 reproduces the lab's amplitude
 * in *source* px; 10 reproduces what the Director actually looked at when he approved
 * it, which was the lab at zoom 0.33 while the map runs at 0.18 — 0.33/0.18 = 1.83x.
 * Matching the amplitude he saw on screen is the honest reading of the approval.
 *
 * @see plans/PLAN-015-sea-ripple-port-and-voronoi.md
 */
export function WorldSurfaceSeaRipple({
  enabled = true,
  zIndex,
  config,
}: WorldSurfaceSeaRippleProps) {
  const cfg = config ?? atmosphereAssets.seaRipple;
  if (!enabled || !cfg.enabled) return null;

  if (cfg.mode === 'sprite') {
    return <SpriteSeaRipple zIndex={zIndex} cfg={cfg} />;
  }

  return <SeaRippleFilterDefs cfg={cfg} />;
}

/** Generate CSS keyframes that step through a sprite sheet row by row. */
export function buildSpriteKeyframes(
  name: string,
  frames: number,
  columns: number,
  rows: number,
): string {
  const steps = Array.from({ length: frames }, (_, i) => {
    const col = i % columns;
    const row = Math.floor(i / columns);
    const pct = ((i / (frames - 1)) * 100).toFixed(2);
    return `${pct}% { background-position: ${-col * 100}% ${-row * 100}%; }`;
  }).join('\n  ');
  return `@keyframes ${name} {\n  ${steps}\n}`;
}

/**
 * The displacement filter, and nothing else — no element, no box, no stacking context.
 *
 * SMIL rather than a JS ticker because `<animate>` runs off the document timeline, so
 * it needs no rAF loop of its own. Note that this does NOT mean it survives a hidden
 * document: a hidden document stops its whole timeline, SMIL included. Judge this in a
 * real browser window.
 */
function SeaRippleFilterDefs({ cfg }: { cfg: SeaRippleConfig }) {
  const bf = cfg.baseFrequency ?? 0.0087;
  const scale = cfg.scale ?? 10;
  const seconds = cfg.seconds ?? 18;

  // Same shape as the lab: X rises while Y falls, so the noise field DEFORMS rather
  // than scrolls. A scrolling field reads as a texture sliding over the painting; a
  // deforming one reads as the painting itself moving.
  const bfValues = [
    `${bf} ${bf * 1.6}`,
    `${bf * 1.35} ${bf * 1.15}`,
    `${bf} ${bf * 1.6}`,
  ].join(';');

  return (
    <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true" focusable="false">
      {/* Filter region is exactly the element box, not the usual -5%/110% margin.
          The peak offset is scale/2 = ±5 world px on a 4240×2828 box, so the margin
          buys nothing and costs 13% more raster area (4664×3110 vs 4240×2828) on a
          surface that is already over the 4096 px edge WebKit refuses to composite
          (`TEXTURE_EDGE_LIMIT_PX` in useFrameMetrics.ts, which "fails blank rather
          than throwing"). Verified rendering intact on Chromium; Safari/Tauri WebView
          is the one still to check. */}
      <filter id={SEA_RIPPLE_FILTER_ID} x="0" y="0" width="100%" height="100%">
        <feTurbulence
          type="fractalNoise"
          baseFrequency={`${bf} ${bf * 1.6}`}
          numOctaves={2}
          seed={7}
          result="noise"
        >
          <animate
            attributeName="baseFrequency"
            dur={`${seconds}s`}
            values={bfValues}
            repeatCount="indefinite"
          />
        </feTurbulence>
        <feDisplacementMap
          in="SourceGraphic"
          in2="noise"
          xChannelSelector="R"
          yChannelSelector="G"
          scale={scale}
        >
          <animate
            attributeName="scale"
            dur={`${seconds * 0.7}s`}
            values={`${scale * 0.55};${scale};${scale * 0.55}`}
            repeatCount="indefinite"
          />
        </feDisplacementMap>
      </filter>
    </svg>
  );
}

interface SpriteSeaRippleProps {
  zIndex: number;
  cfg: SeaRippleConfig;
}

/**
 * Pre-authored animated sprite sheet blended over the masked sea — the Director's
 * "opzione 3". Stepped with CSS keyframes, so no rAF.
 *
 * `zIndex` and `mix-blend-mode` sit on the SAME element on purpose. When the z-index
 * lived on a parent wrapper it created a stacking context, and a blend mode inside a
 * stacking context has nothing outside it to blend with — the overlay silently
 * composited as `normal` against its own transparent parent instead of against the
 * painted sea.
 */
function SpriteSeaRipple({ zIndex, cfg }: SpriteSeaRippleProps) {
  const {
    spriteSrc,
    spriteFrames = 1,
    spriteColumns = 1,
    spriteRows = 1,
    spriteCycleSeconds = 1,
    mask,
    blendMode,
    opacity,
  } = cfg;

  const animName = 'wsSeaRippleSprite';
  const keyframes = useMemo(
    () => buildSpriteKeyframes(animName, spriteFrames, spriteColumns, spriteRows),
    [spriteFrames, spriteColumns, spriteRows],
  );

  return (
    <>
      <style>{`
        ${keyframes}
        .ws-sea-ripple-sprite {
          position: absolute;
          inset: 0;
          pointer-events: none;
          background-image: url(${spriteSrc});
          background-size: ${spriteColumns * 100}% ${spriteRows * 100}%;
          background-repeat: no-repeat;
          mask-image: url(${mask});
          -webkit-mask-image: url(${mask});
          mask-size: 100% 100%;
          -webkit-mask-size: 100% 100%;
          mask-repeat: no-repeat;
          -webkit-mask-repeat: no-repeat;
          mask-position: 0 0;
          -webkit-mask-position: 0 0;
          opacity: ${opacity ?? 0.35};
          mix-blend-mode: ${blendMode ?? 'overlay'};
          animation: ${animName} ${spriteCycleSeconds}s steps(${Math.max(1, spriteFrames - 1)}) infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .ws-sea-ripple-sprite { animation: none !important; opacity: 0 !important; }
        }
      `}</style>
      <div className="ws-sea-ripple-sprite" style={{ zIndex }} />
    </>
  );
}

export default WorldSurfaceSeaRipple;
