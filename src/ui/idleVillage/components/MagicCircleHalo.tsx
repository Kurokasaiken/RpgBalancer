/**
 * MagicCircleHalo — arcane inscription that writes itself around a quest POI.
 *
 * The halo is the readable timer of a running quest (Pillar 2, Cultist Sim):
 * instead of a ring that drains, an inscription materialises character by
 * character. Driven purely by the `progress` prop, so the caller owns the
 * clock and this component owns the visual grammar.
 *
 * Invariants (desiderata v3, FROZEN):
 * - Nothing is rendered around the POI at progress 0 — no ring, no track,
 *   no faded guide that telegraphs the path.
 * - Writing starts at 12 o'clock and advances clockwise.
 * - A character that has been lit stays lit; progress only ever adds.
 * - The writing itself forms the circle; there is no separate circular border.
 * - At completion the formation locks in with a stronger energy pulse.
 *
 * Rendering budget (Pillar 1): plain SVG + CSS keyframes, no PixiJS and no
 * per-frame JavaScript. Each character animates exactly once, on mount.
 * Animation is skipped entirely on low perf tier or `prefers-reduced-motion`.
 */

import { useEffect, useId, useMemo, useState } from 'react';
import type { JSX } from 'react';
import { useSkinPreferences } from '@/ui/idleVillage/hooks/useSkinPreferences';
import {
  getMagicCircleHaloSkinForPreset,
  resolveMagicCircleHaloPresetId,
  type MagicCircleHaloConfig,
} from '@/ui/idleVillage/skins/magicCircleHaloSkinConfig';

export interface MagicCircleHaloProps {
  /**
   * Fraction of the inscription that has been written, 0–1. Values outside
   * the range are clamped. Monotonic input is expected: characters are never
   * removed once lit.
   */
  progress: number;
  /**
   * When true the inscription has closed: the writing stops and the whole
   * circle pulses, signalling that the POI is ready to be opened.
   */
  isComplete?: boolean;
  /** Override the rendered box size in pixels. */
  size?: number;
  /** Override the Style Lab preset id used to resolve the skin. */
  skinPresetId?: string;
  /** Extra class names for the positioning wrapper. */
  className?: string;
}

/** A single placed character of the inscription. */
interface PlacedGlyph {
  index: number;
  x: number;
  y: number;
  rotation: number;
  path: string;
}

/**
 * Deterministic pseudo-random in [0, 1) derived from an integer seed.
 * Used instead of Math.random so a given glyph index always renders the same
 * shape and wobble across re-renders and remounts.
 * @param seed - Integer seed
 * @returns A stable value in [0, 1)
 */
function stableNoise(seed: number): number {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

/**
 * Places every character of the inscription on the circumference.
 * @param config - Resolved skin configuration
 * @param size - Rendered box size in pixels
 * @param settled - When true the formation wobble is removed
 * @returns The placed glyphs, ordered from the start angle onwards
 */
function placeGlyphs(
  config: MagicCircleHaloConfig,
  size: number,
  settled: boolean,
): PlacedGlyph[] {
  const center = size / 2;
  const baseRadius = center * config.radiusRatio;
  const step = 360 / config.glyphCount;
  const direction = config.clockwise ? 1 : -1;

  return Array.from({ length: config.glyphCount }, (_, index) => {
    const angleDeg = config.startAngleDeg + direction * step * index;
    const angleRad = (angleDeg * Math.PI) / 180;
    const wobble = settled
      ? 0
      : (stableNoise(index + 1) - 0.5) * 2 * config.formationJitterPx;
    const radius = baseRadius + wobble;

    return {
      index,
      x: center + radius * Math.cos(angleRad),
      y: center + radius * Math.sin(angleRad),
      // Glyph "up" points radially outward, so the inscription reads along
      // the circumference. At 12 o'clock (-90deg) rotation is zero.
      rotation: angleDeg + 90,
      path: config.glyphPaths[
        Math.floor(stableNoise(index * 7 + 3) * config.glyphPaths.length) %
          config.glyphPaths.length
      ],
    };
  });
}

/**
 * MagicCircleHalo — see module docblock for the visual contract.
 * @param props - Component props
 * @returns The inscription layer, or an empty layer while nothing is lit yet
 */
export function MagicCircleHalo({
  progress,
  isComplete = false,
  size,
  skinPresetId,
  className,
}: MagicCircleHaloProps): JSX.Element {
  const { presetId } = useSkinPreferences();
  const resolvedPresetId = resolveMagicCircleHaloPresetId(skinPresetId ?? presetId);
  const config = getMagicCircleHaloSkinForPreset(resolvedPresetId).config;
  const boxSize = size ?? config.size;

  const rawId = useId();
  const uid = rawId.replace(/:/g, '');

  // Perf/accessibility gate: mirrors GenericPoiSkin so a low tier or a
  // reduced-motion preference gets the same inscription without animation.
  const [animate, setAnimate] = useState(true);
  useEffect(() => {
    const tier = document.documentElement.dataset.perfTier;
    const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    setAnimate(tier !== 'low' && !reducedMotion);
  }, []);

  const clampedProgress = Math.min(1, Math.max(0, Number.isFinite(progress) ? progress : 0));
  const visibleCount = isComplete
    ? config.glyphCount
    : Math.min(config.glyphCount, Math.floor(clampedProgress * config.glyphCount));

  const glyphs = useMemo(
    () => placeGlyphs(config, boxSize, isComplete),
    [config, boxSize, isComplete],
  );

  const { palette } = config;
  const glyphScale = config.glyphSize / 14;

  return (
    <div
      className={className}
      style={{ width: boxSize, height: boxSize, pointerEvents: 'none' }}
      data-testid="magic-circle-halo"
      data-progress={clampedProgress.toFixed(3)}
      data-complete={isComplete ? 'true' : 'false'}
      aria-hidden
    >
      <svg
        width={boxSize}
        height={boxSize}
        viewBox={`0 0 ${boxSize} ${boxSize}`}
        style={{ overflow: 'visible', display: 'block' }}
      >
        <style>{`
          @keyframes magic-circle-write-${uid} {
            0%   { opacity: 0; filter: drop-shadow(0 0 ${palette.glowRadius * 3}px ${palette.glowColor}); }
            16%  { opacity: 1; filter: drop-shadow(0 0 ${palette.glowRadius * 2.4}px ${palette.glowColor}); }
            55%  { opacity: .82; filter: drop-shadow(0 0 ${palette.glowRadius * 1.2}px ${palette.glowColor}); }
            78%  { opacity: 1; filter: drop-shadow(0 0 ${palette.glowRadius * 1.7}px ${palette.glowColor}); }
            100% { opacity: 1; filter: drop-shadow(0 0 ${palette.glowRadius}px ${palette.glowColor}); }
          }
          @keyframes magic-circle-stroke-${uid} {
            0%   { stroke-width: ${config.glyphStrokeWidth * 2.6}; }
            16%  { stroke-width: ${config.glyphStrokeWidth * 1.9}; }
            100% { stroke-width: ${config.glyphStrokeWidth}; }
          }
          @keyframes magic-circle-lock-${uid} {
            0%, 100% { opacity: .88; filter: drop-shadow(0 0 ${palette.completionGlowRadius * 0.7}px ${palette.glowColor}); }
            50%      { opacity: 1;   filter: drop-shadow(0 0 ${palette.completionGlowRadius}px ${palette.glowColor}); }
          }
          @keyframes magic-circle-burst-${uid} {
            0%   { opacity: .85; transform: scale(.92); }
            100% { opacity: 0;   transform: scale(1.14); }
          }
          [data-mc-glyph="${uid}"] {
            opacity: 1;
            filter: drop-shadow(0 0 ${palette.glowRadius}px ${palette.glowColor});
          }
          [data-mc-animate="${uid}"] [data-mc-glyph="${uid}"] {
            animation: magic-circle-write-${uid} ${config.materialiseDurationMs}ms ease-out both;
          }
          [data-mc-animate="${uid}"] [data-mc-glyph="${uid}"] path {
            animation: magic-circle-stroke-${uid} ${config.materialiseDurationMs}ms ease-out both;
          }
          [data-mc-animate="${uid}"][data-mc-complete="${uid}"] [data-mc-inscription="${uid}"] {
            animation: magic-circle-lock-${uid} ${config.completionPulseDurationMs}ms ease-in-out infinite;
          }
          [data-mc-burst="${uid}"] {
            animation: magic-circle-burst-${uid} ${config.completionPulseDurationMs * 0.55}ms ease-out both;
            transform-origin: center;
          }
        `}</style>

        <g
          {...(animate ? { 'data-mc-animate': uid } : {})}
          {...(animate && isComplete ? { 'data-mc-complete': uid } : {})}
        >
          {/*
            Completion burst. Mounted only once the inscription has closed, so
            it can never read as a pre-existing track: it is the "system locking
            into place" pulse, and its one-shot animation runs on mount.
          */}
          {isComplete && animate && (
            <circle
              data-mc-burst={uid}
              cx={boxSize / 2}
              cy={boxSize / 2}
              r={(boxSize / 2) * config.radiusRatio}
              fill="none"
              stroke={palette.pulseColor}
              strokeWidth={1.5}
            />
          )}

          <g data-mc-inscription={uid}>
            {glyphs.slice(0, visibleCount).map((glyph) => (
              <g
                key={glyph.index}
                data-mc-glyph={uid}
                transform={`translate(${glyph.x.toFixed(2)} ${glyph.y.toFixed(2)}) rotate(${glyph.rotation.toFixed(2)})`}
              >
                <path
                  d={glyph.path}
                  transform={`scale(${glyphScale.toFixed(4)}) translate(-5 -7)`}
                  fill="none"
                  stroke={palette.glyphColor}
                  strokeWidth={config.glyphStrokeWidth}
                  strokeLinecap="butt"
                  strokeLinejoin="round"
                  vectorEffect="non-scaling-stroke"
                />
              </g>
            ))}
          </g>
        </g>
      </svg>
    </div>
  );
}

export default MagicCircleHalo;
