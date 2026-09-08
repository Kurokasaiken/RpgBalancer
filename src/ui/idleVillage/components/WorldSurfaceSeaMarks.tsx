import { defaultSeaMarksConfig, type SeaMarksConfig } from '../config/seaMarksConfig';

export interface WorldSurfaceSeaMarksProps {
  enabled?: boolean;
  zIndex: number;
  /** Optional override. Defaults to {@link defaultSeaMarksConfig}. */
  config?: SeaMarksConfig;
}

/**
 * Sparse, hand-painted sea motion overlay.
 *
 * The baked `Mare.webp` layer stays completely still. This component adds 20-40
 * transparent water marks sampled from real coast/open-water points. Each mark
 * fades in, holds, drifts a few world px, and fades out. Animation is CSS-only
 * (`opacity` and `transform: translate3d()`) so it keeps running in preview panes
 * where `requestAnimationFrame` is frozen, and it promotes cleanly to GPU layers.
 *
 * @see plans/PLAN-013-sea-marks.md
 */
export function WorldSurfaceSeaMarks({
  enabled = true,
  zIndex,
  config,
}: WorldSurfaceSeaMarksProps) {
  const cfg = config ?? defaultSeaMarksConfig;
  if (!enabled || !cfg.enabled || cfg.marks.length === 0) return null;

  const visible = Math.min(99, Math.max(1, cfg.visibleFraction * 100));
  const rampInPct = (visible * 0.22).toFixed(1);
  const rampOutPct = (visible * 0.78).toFixed(1);

  return (
    <div
      aria-hidden="true"
      style={{
        position: 'absolute',
        inset: 0,
        zIndex,
        overflow: 'hidden',
        pointerEvents: 'none',
        maskImage: `url(${cfg.mask})`,
        WebkitMaskImage: `url(${cfg.mask})`,
        maskSize: '100% 100%',
        WebkitMaskSize: '100% 100%',
        maskRepeat: 'no-repeat',
        WebkitMaskRepeat: 'no-repeat',
        maskPosition: '0 0',
        WebkitMaskPosition: '0 0',
      }}
    >
      <style>{`
        @keyframes wsSeaMark {
          0% { opacity: 0; transform: translate3d(0, var(--ws-sea-drift-y), 0) scaleX(var(--ws-sea-flip)); }
          ${rampInPct}% { opacity: var(--ws-sea-opacity); transform: translate3d(0, 0, 0) scaleX(var(--ws-sea-flip)); }
          ${rampOutPct}% { opacity: var(--ws-sea-opacity); transform: translate3d(0, 0, 0) scaleX(var(--ws-sea-flip)); }
          ${visible}% { opacity: 0; transform: translate3d(var(--ws-sea-drift-x), calc(var(--ws-sea-drift-y) * -1), 0) scaleX(var(--ws-sea-flip)); }
          100% { opacity: 0; transform: translate3d(var(--ws-sea-drift-x), calc(var(--ws-sea-drift-y) * -1), 0) scaleX(var(--ws-sea-flip)); }
        }
        @media (prefers-reduced-motion: reduce) {
          .ws-sea-mark { animation: none !important; opacity: 0 !important; }
        }
      `}</style>

      {cfg.marks.map((mark) => (
        <img
          key={`${mark.src}-${mark.x}-${mark.y}`}
          className="ws-sea-mark"
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
            ['--ws-sea-opacity' as string]: cfg.opacity,
            ['--ws-sea-drift-x' as string]: `${mark.driftX}px`,
            ['--ws-sea-drift-y' as string]: `${mark.driftY}px`,
            ['--ws-sea-flip' as string]: mark.flip ? -1 : 1,
            animationName: 'wsSeaMark',
            animationDuration: `${cfg.cycleSeconds}s`,
            animationTimingFunction: 'ease-in-out',
            animationIterationCount: 'infinite',
            animationDelay: `${-mark.delaySeconds}s`,
          }}
        />
      ))}
    </div>
  );
}

export default WorldSurfaceSeaMarks;
