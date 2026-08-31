import { atmosphereAssets } from '../config/atmosphereAssets';

export interface WorldSurfaceWavesProps {
  enabled?: boolean;
  zIndex: number;
}

/**
 * Wave hatches breaking along the coastline.
 *
 * Replaces the Pixi displacement ripple, for two reasons. The tactical plan budgets
 * water as "texture/sprite motion (no UV ripple se non profilato)" and the
 * displacement filter is precisely that ripple, unprofiled. And it did not work:
 * shifting the sampling coordinates of a low-contrast baked sea moves nothing an eye
 * can catch, so the effect cost a WebGL context and a ticker to render as nothing.
 *
 * Each mark spends most of its cycle invisible, fades in over a couple of seconds,
 * drifts a few world px, and fades out. Their delays are scattered, so at any moment
 * only a handful are showing and the coast reads as breaking here and there rather
 * than pulsing as one.
 *
 * Positions come from the shoreline itself — sampled in `build-terrain-masks.mjs`
 * from the sea layer's own alpha — so every mark sits on a real coast.
 */
export function WorldSurfaceWaves({ enabled = true, zIndex }: WorldSurfaceWavesProps) {
  if (!enabled) return null;

  const cfg = atmosphereAssets.waves;
  if (!cfg || cfg.marks.length === 0) return null;

  const visible = Math.min(99, Math.max(1, cfg.visibleFraction * 100));
  // Ramp on, hold, ramp off. The hold used to be the point: the water was meant to
  // read as still with a hint of movement. That was the wrong target — with 7 marks
  // holding motionless for most of a 30s cycle the sea measured as pixel-identical
  // frame to frame, and read as a painting. Now the marks drift throughout, and the
  // ramps exist only to hide their appearance and departure.
  const rampInPct = (visible * 0.16).toFixed(1);
  const rampOutPct = (visible * 0.84).toFixed(1);

  return (
    <div
      aria-hidden="true"
      style={{
        position: 'absolute',
        inset: 0,
        zIndex,
        overflow: 'hidden',
        pointerEvents: 'none',
        maskImage: 'url(/assets/atmosphere/terrain/sea_mask.webp)',
        WebkitMaskImage: 'url(/assets/atmosphere/terrain/sea_mask.webp)',
        maskSize: '100% 100%',
        WebkitMaskSize: '100% 100%',
        maskRepeat: 'no-repeat',
        WebkitMaskRepeat: 'no-repeat',
        maskPosition: '0 0',
        WebkitMaskPosition: '0 0',
      }}
    >
      <style>{`
        @keyframes wsWaveBreak {
          0% {
            opacity: 0;
            transform: translate3d(calc(var(--ws-wave-drift) * -0.5), var(--ws-wave-bob), 0) scaleX(var(--ws-wave-flip));
          }
          ${rampInPct}% { opacity: var(--ws-wave-opacity); }
          ${rampOutPct}% { opacity: var(--ws-wave-opacity); }
          ${visible}% {
            opacity: 0;
            transform: translate3d(calc(var(--ws-wave-drift) * 0.5), calc(var(--ws-wave-bob) * -1), 0) scaleX(var(--ws-wave-flip));
          }
          100% {
            opacity: 0;
            transform: translate3d(calc(var(--ws-wave-drift) * 0.5), calc(var(--ws-wave-bob) * -1), 0) scaleX(var(--ws-wave-flip));
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .ws-wave { animation: none !important; opacity: 0 !important; }
        }
      `}</style>

      {cfg.marks.map((mark) => (
        <img
          key={`${mark.src}-${mark.x}-${mark.y}`}
          className="ws-wave"
          src={`/assets/atmosphere/${mark.src}`}
          alt=""
          style={{
            position: 'absolute',
            left: mark.x,
            top: mark.y,
            width: mark.width,
            height: mark.height,
            objectFit: 'contain',
            objectPosition: 'top center',
            opacity: 0,
            willChange: 'transform, opacity',
            ['--ws-wave-opacity' as string]: cfg.opacity,
            ['--ws-wave-bob' as string]: `${cfg.bobWorldPx}px`,
            // Alternate the drift direction per mark, so the sea does not read as
            // one sheet of water sliding the same way.
            ['--ws-wave-drift' as string]: `${mark.flip ? -cfg.driftWorldPx : cfg.driftWorldPx}px`,
            ['--ws-wave-flip' as string]: mark.flip ? -1 : 1,
            animationName: 'wsWaveBreak',
            animationDuration: `${cfg.cycleSeconds}s`,
            // Linear, not eased: an eased drift spends most of its life nearly
            // stopped at the turning points, which is the stillness being removed.
            animationTimingFunction: 'linear',
            animationIterationCount: 'infinite',
            animationDelay: `${-mark.delaySeconds}s`,
          }}
        />
      ))}
    </div>
  );
}

export default WorldSurfaceWaves;
