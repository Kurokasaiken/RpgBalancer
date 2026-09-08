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
 * Soft coastal ripple for the real World Surface map.
 *
 * The baked `Mare.webp` is not moved. A masked copy of the same image is overlaid
 * and displaced by a small SMIL `feTurbulence` + `feDisplacementMap`. The mask is
 * `shallow_mask.webp`, so the motion is confined to the painted coastal structure
 * and the open sea remains still.
 *
 * This keeps the effect off `requestAnimationFrame` (it uses SMIL, which runs on
 * the document timeline) and gives a clean `prefers-reduced-motion` kill switch.
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

  const filterId = `ws-sea-ripple-${worldName}`;
  const imageUrl = `/assets/world/${encodeURIComponent(worldName)}/base/layers/${encodeURIComponent(seaFile)}`;
  const maskUrl = cfg.mask;

  const safeZoom = Math.max(zoom, 0.01);
  const baseFreq = cfg.baseFrequency / safeZoom;
  const scale = cfg.scale * safeZoom;

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
              dur={`${cfg.seconds * 0.7}s`}
              values={scaleValues}
              repeatCount="indefinite"
            />
          </feDisplacementMap>
        </filter>
      </svg>

      <style>{`
        @media (prefers-reduced-motion: reduce) {
          .ws-sea-ripple { filter: none !important; }
        }
      `}</style>

      <img
        className="ws-sea-ripple"
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
