/**
 * AtmosphereLayer — atmosphere overlays (PLAN-050 T-013, realizing the
 * PLAN-046 §6 contract).
 *
 * Distinct from `AmbientLayer` (procedural particles on a 2D canvas): the
 * atmosphere layer is DOM — painted sprites for object-like overlays
 * (cloud shadows, bird strips) and noise-masked strips for fog — and it
 * works on BOTH the GPU and the DOM fallback path because it is DOM
 * itself. Fog matter is a baked tileable fractal-noise texture
 * (`scripts/bake-fog-noise.py`) used as a CSS mask over the authored
 * tint; the animation is the mask scrolling inside each veil. Fog is
 * further constrained by a per-scene POOL mask baked from the depth map
 * (`scripts/bake-fog-mask.py`) — fog exists only where the terrain
 * recedes, so it pools on the ground instead of floating mid-air.
 *
 * Camera coherence: each element's img-fraction anchor is mapped through
 * the same `shaderUniforms` window as the artwork every frame, blended
 * toward view-space by the kit's `parallax` (0 = screen-fixed, 1 = glued
 * to the painted ground). Its drift is a pure function of the shared
 * camera clock — frozen `t=` captures are deterministic.
 *
 * Reduced motion mounts nothing at all. An empty `ids` list mounts no
 * loop — same idle-stop invariant as the ticker (PLAN-050 T-011): while
 * mounted the drift IS perpetual temporal work, so the rAF stays live.
 */

import React, { useEffect, useRef } from 'react';
import {
  ATMOSPHERE_KITS,
  type AtmosphereFogKit,
  type AtmosphereKit,
  type AtmosphereSpriteKit,
} from '@/balancing/config/idleVillage/quests/questAtmosphereFx';
import { documentClock, type CameraClock } from './cameraEval';
import { cameraAt } from './depthTransform';
import { fogPoolFrame, fogVeilFrame, overlayFrame } from './atmosphereOverlay';
import { composeTrauma, traumaAt } from './trauma';
import type { CameraShot, QuestDepthFx } from '@/balancing/config/idleVillage/quests/questTheatreFx';

export interface AtmosphereLayerProps {
  /** Kit ids from `sceneManifest.atmosphere` — unknown ids are skipped. */
  ids: string[];
  reducedMotion: boolean;
  clock?: CameraClock;
  /** Per-scene phase offset so overlays don't sync across scenes. */
  seed?: number;
  shot?: CameraShot;
  shotEpoch?: number;
  traumaEpoch?: number | null;
  traumaStrength?: number;
  cfg?: QuestDepthFx;
  imgAspect?: number;
  viewAspect?: number;
  /** Baked depth-derived fog pool mask (`fogMaskForDepth`); without it
   *  fog veils render unpooled. */
  fogMask?: string;
}

/** One renderable element: a sprite img or one veil of a fog kit. */
interface AtmoItem {
  kit: AtmosphereKit;
  /** Veil index inside a fog kit (0 for sprites). */
  index: number;
}

export const AtmosphereLayer: React.FC<AtmosphereLayerProps> = ({
  ids,
  reducedMotion,
  clock = documentClock,
  seed = 0,
  shot,
  shotEpoch = 0,
  traumaEpoch = null,
  traumaStrength = 0,
  cfg,
  imgAspect = 1,
  viewAspect = 1,
  fogMask,
}) => {
  const hostRef = useRef<HTMLDivElement>(null);
  const elRefs = useRef<(HTMLElement | null)[]>([]);
  const poolRefs = useRef<(HTMLElement | null)[]>([]);
  /* R-241 jank: the per-frame loop writes ONLY composited properties —
   * `transform` (translate+scale, scroll folded into translateX for fog)
   * and `opacity`. width/height/mask writes triggered layout+paint every
   * frame; the pool mask is skipped entirely while its value is unchanged
   * (static camera → zero style writes). */
  const poolMaskRef = useRef<(string | null)[]>([]);
  const veilTileRef = useRef<(string | null)[]>([]);
  const kits = ids
    .map((id) => ATMOSPHERE_KITS[id])
    .filter((k): k is AtmosphereKit => k != null && k.enabled);
  const items: AtmoItem[] = kits.flatMap((kit) =>
    kit.kind === 'fog' ? Array.from({ length: kit.layers }, (_, i) => ({ kit, index: i })) : [{ kit, index: 0 }],
  );
  const live = useRef({ shot, shotEpoch, traumaEpoch, traumaStrength, cfg, imgAspect, viewAspect, clock });
  useEffect(() => {
    live.current = { shot, shotEpoch, traumaEpoch, traumaStrength, cfg, imgAspect, viewAspect, clock };
  });

  useEffect(() => {
    const host = hostRef.current;
    if (reducedMotion || !host || items.length === 0 || !shot || !cfg) return undefined;
    let raf = 0;
    const draw = () => {
      const { shot: s, shotEpoch: epoch, traumaEpoch: tEp, traumaStrength: tSt, cfg: c, imgAspect: ia, viewAspect: va, clock: ck } =
        live.current;
      const w = host.clientWidth;
      const h = host.clientHeight;
      if (w > 0 && h > 0 && s && c) {
        const now = ck();
        let state = cameraAt(s, now - epoch);
        if (tEp != null && tSt > 0) {
          state = composeTrauma(state, traumaAt(now - tEp, tSt, c.trauma), c.trauma);
        }
        const tSec = now / 1000;
        kits.forEach((kit, ki) => {
          if (kit.kind !== 'fog') return;
          const pool = poolRefs.current[ki];
          if (!pool) return;
          const pf = fogPoolFrame(kit, state, c, ia, va);
          const maskSize = `${(pf.width * w).toFixed(1)}px ${(pf.height * h).toFixed(1)}px`;
          const maskPos = `${(pf.left * w).toFixed(1)}px ${(pf.top * h).toFixed(1)}px`;
          /* A static camera yields identical mask strings every frame —
             writing them again still dirties style+paint. Skip when same. */
          const key = `${maskSize}|${maskPos}`;
          if (poolMaskRef.current[ki] !== key) {
            poolMaskRef.current[ki] = key;
            pool.style.maskSize = maskSize;
            pool.style.maskPosition = maskPos;
            pool.style.setProperty('-webkit-mask-size', maskSize);
            pool.style.setProperty('-webkit-mask-position', maskPos);
          }
        });
        items.forEach(({ kit, index }, i) => {
          const el = elRefs.current[i];
          if (!el) return;
          if (kit.kind === 'sprite') {
            const f = overlayFrame(kit as AtmosphereSpriteKit, state, c, ia, va, tSec, seed * 0.37 + i * 0.61);
            /* Composited only: the img keeps its natural size and a uniform
               scale lands the camera width — identical to the old
               width-only CSS resize (height followed proportionally). */
            const s = Math.max(0.001, (f.width * w) / kit.widthPx);
            el.style.transform = `translate(${(f.left * w).toFixed(1)}px, ${(f.top * h).toFixed(1)}px) scale(${s.toFixed(4)})`;
          } else {
            const f = fogVeilFrame(kit as AtmosphereFogKit, index, state, c, ia, va, tSec, seed * 0.37 + i * 0.61);
            /* The veil is a host-sized element under translate+scale: the
               rect comes from scale alone, and the noise scroll rides in
               translateX — a veil always spans past both edges, so sliding
               it by a tile fraction is identical to scrolling the mask.
               The slide is CLAMPED to the right-edge overscan: beyond it the
               rect would expose the viewport edge — the pattern stalls
               briefly instead of ever showing a gap.
               mask-size is the LOCAL tile that the element scale carries to
               the on-screen square `veilPx` (sx·tileX = sy·tileY = veilPx) —
               it only changes with the camera, so identical strings skip. */
            const veilPx = f.height * h;
            const rightOverscan = (f.left + f.width - 1) * w;
            const slide = Math.min(f.scroll * veilPx, Math.max(0, rightOverscan));
            const tx = f.left * w - slide;
            el.style.transform = `translate(${tx.toFixed(1)}px, ${(f.top * h).toFixed(1)}px) scale(${f.width.toFixed(4)}, ${f.height.toFixed(4)})`;
            el.style.opacity = String(f.alpha);
            const sx = Math.max(0.0001, f.width);
            const tile = `${(veilPx / sx).toFixed(1)}px ${h.toFixed(1)}px`;
            if (veilTileRef.current[i] !== tile) {
              veilTileRef.current[i] = tile;
              el.style.maskSize = tile;
              el.style.setProperty('-webkit-mask-size', tile);
            }
          }
        });
      }
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
    // items are derived from registry constants — length is the honest dep.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reducedMotion, items.length, seed, !!shot, !!cfg]);

  if (reducedMotion || items.length === 0) return null;
  /* Item index of each kit's first element inside the flat `items` list —
   *  keeps elRefs aligned with the rAF loop. */
  const starts: number[] = [];
  {
    let acc = 0;
    for (const kit of kits) {
      starts.push(acc);
      acc += kit.kind === 'fog' ? kit.layers : 1;
    }
  }
  return (
    <div
      ref={hostRef}
      data-testid="atmosphere-layer"
      aria-hidden
      style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}
    >
      {kits.map((kit, ki) =>
        kit.kind === 'sprite' ? (
          <img
            key={`${kit.asset}:${ki}`}
            ref={(el) => {
              elRefs.current[starts[ki]] = el;
            }}
            src={kit.asset}
            alt=""
            draggable={false}
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              transformOrigin: '0 0',
              opacity: kit.alpha,
              mixBlendMode: kit.blend === 'normal' ? undefined : kit.blend,
              filter:
                [
                  kit.blurPx > 0 ? `blur(${kit.blurPx}px)` : null,
                  kit.silhouette ? 'brightness(0)' : null,
                ]
                  .filter(Boolean)
                  .join(' ') || undefined,
              willChange: 'transform',
            }}
          />
        ) : (
          /* The pool wrapper masks the whole fog kit by scene depth —
           *  fog exists only where the baked mask says the terrain
           *  recedes (pools on the ground, never a suspended band). */
          <div
            key={`pool:${ki}`}
            ref={(el) => {
              poolRefs.current[ki] = el;
            }}
            data-fog-pool
            style={{
              position: 'absolute',
              inset: 0,
              maskImage: fogMask ? `url(${fogMask})` : undefined,
              WebkitMaskImage: fogMask ? `url(${fogMask})` : undefined,
              maskRepeat: 'no-repeat',
              WebkitMaskRepeat: 'no-repeat',
              maskSize: '100% 100%',
              WebkitMaskSize: '100% 100%',
            }}
          >
            {Array.from({ length: kit.layers }, (_, index) => (
              <div
                key={`fog:${index}`}
                ref={(el) => {
                  elRefs.current[starts[ki] + index] = el;
                }}
                data-fog-veil={index}
                style={{
                  position: 'absolute',
                  left: 0,
                  top: 0,
                  /* Host-sized: the per-frame scale carries the real rect;
                     origin 0 0 keeps the translate+scale mapping exact. */
                  width: '100%',
                  height: '100%',
                  transformOrigin: '0 0',
                  /* The strip is solid `color`; the baked noise tile masks
                   *  it into fibrous matter (seamless X → perpetual scroll). */
                  background: kit.color,
                  opacity: kit.alpha,
                  mixBlendMode: kit.blend === 'normal' ? undefined : kit.blend,
                  maskImage: `url(${kit.texture})`,
                  WebkitMaskImage: `url(${kit.texture})`,
                  maskRepeat: 'repeat-x',
                  WebkitMaskRepeat: 'repeat-x',
                  willChange: 'transform, opacity',
                }}
              />
            ))}
          </div>
        ),
      )}
    </div>
  );
};
