import { useMemo } from 'react';
import { atmosphereAssets } from '../config/atmosphereAssets';
import type { SeaRippleConfig } from '../config/atmosphereAssets';

export interface WorldSurfaceSeaRippleProps {
  enabled?: boolean;
  zIndex: number;
  /** `world` field of the active manifest, e.g. `wanderlust`. */
  worldName: string;
  /** `file` field of the sea layer, e.g. `Mare.webp`. */
  seaFile: string;
  /** Current camera zoom so the ripple stays perceptually constant. */
  zoom: number;
  /** Optional override. Defaults to {@link atmosphereAssets.seaRipple}. */
  config?: SeaRippleConfig;
}

/**
 * Soft coastal water motion for the real World Surface map.
 *
 * The baked `Mare.webp` is not moved. Two modes are supported:
 * - `smil`: a masked copy of the sea layer is displaced by `feTurbulence` +
 *   `feDisplacementMap` (no external asset, runs on the document timeline).
 * - `sprite`: a pre-authored animated sprite sheet is blended over the masked
 *   sea. The sprite is stepped through with CSS keyframes, so it does not need
 *   `requestAnimationFrame`.
 *
 * In both modes motion is confined to `shallow_mask.webp` so the open sea
 * stays still and the effect reads only on painted coastal structure.
 */
export function WorldSurfaceSeaRipple({
  enabled = true,
  zIndex,
  worldName,
  seaFile,
  zoom,
  config,
}: WorldSurfaceSeaRippleProps) {
  const cfg = config ?? atmosphereAssets.seaRipple;
  if (!enabled || !cfg.enabled) return null;

  if (cfg.mode === 'sprite') {
    return <SpriteSeaRipple zIndex={zIndex} cfg={cfg} />;
  }

  return <SmilSeaRipple zIndex={zIndex} worldName={worldName} seaFile={seaFile} cfg={cfg} zoom={zoom} />;
}

/** Generate CSS keyframes that step through a sprite sheet row by row. */
function buildSpriteKeyframes(
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

interface SpriteSeaRippleProps {
  zIndex: number;
  cfg: SeaRippleConfig;
}

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
    <div
      aria-hidden="true"
      style={{
        position: 'absolute',
        inset: 0,
        zIndex,
        pointerEvents: 'none',
        overflow: 'hidden',
      }}
    >
      <style>{`
        ${keyframes}
        .ws-sea-ripple-sprite {
          position: absolute;
          inset: 0;
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
          animation: ${animName} ${spriteCycleSeconds}s steps(${spriteFrames - 1}) infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .ws-sea-ripple-sprite { animation: none !important; opacity: 0 !important; }
        }
      `}</style>
      <div className="ws-sea-ripple-sprite" />
    </div>
  );
}

interface SmilSeaRippleProps {
  zIndex: number;
  worldName: string;
  seaFile: string;
  cfg: SeaRippleConfig;
  zoom: number;
}

function SmilSeaRipple({ zIndex, worldName, seaFile, cfg, zoom }: SmilSeaRippleProps) {
  const filterId = `ws-sea-ripple-${worldName}`;
  const imageUrl = `/assets/world/${encodeURIComponent(worldName)}/base/layers/${encodeURIComponent(seaFile)}`;
  const maskUrl = cfg.mask;

  const safeZoom = Math.max(zoom, 0.01);
  const baseFreq = (cfg.baseFrequency ?? 0.012) / safeZoom;
  const scale = (cfg.scale ?? 4) * safeZoom;

  const turbValues = useMemo(
    () =>
      `${baseFreq} ${baseFreq * 1.6};` +
      `${baseFreq * 1.35} ${baseFreq * 1.15};` +
      `${baseFreq} ${baseFreq * 1.6}`,
    [baseFreq],
  );

  const scaleValues = useMemo(
    () => `${scale * 0.55};${scale};${scale * 0.55}`,
    [scale],
  );

  return (
    <div
      aria-hidden="true"
      style={{
        position: 'absolute',
        inset: 0,
        zIndex,
        pointerEvents: 'none',
        overflow: 'hidden',
      }}
    >
      <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true">
        <filter id={filterId} x="-5%" y="-5%" width="110%" height="110%">
          <feTurbulence
            type="fractalNoise"
            baseFrequency={`${baseFreq} ${baseFreq * 1.6}`}
            numOctaves={2}
            seed={7}
            result="noise"
          >
            <animate
              attributeName="baseFrequency"
              dur={`${cfg.seconds}s`}
              values={turbValues}
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
              dur={`${(cfg.seconds ?? 18) * 0.7}s`}
              values={scaleValues}
              repeatCount="indefinite"
            />
          </feDisplacementMap>
        </filter>
      </svg>

      <style>{`
        @media (prefers-reduced-motion: reduce) {
          .ws-sea-ripple-smil { filter: none !important; }
        }
      `}</style>

      <img
        className="ws-sea-ripple-smil"
        src={imageUrl}
        alt=""
        draggable={false}
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: cfg.imageFit,
          filter: `url(#${filterId})`,
          maskImage: `url(${maskUrl})`,
          WebkitMaskImage: `url(${maskUrl})`,
          maskSize: '100% 100%',
          WebkitMaskSize: '100% 100%',
          maskRepeat: 'no-repeat',
          WebkitMaskRepeat: 'no-repeat',
          maskPosition: '0 0',
          WebkitMaskPosition: '0 0',
        }}
      />
    </div>
  );
}

export default WorldSurfaceSeaRipple;
