/**
 * PoiMarker — base reference implementation of the map "opportunity" marker.
 *
 * Visual grammar (see visual_design_philosophy.md):
 *   colour + icon  → WHAT it is   (quest / job / event)
 *   timer ring     → WHEN it ends (clockwise fills, counter-clockwise depletes)
 *   material       → WHERE it lives (bronze medallion + obsidian core, so it
 *                    reads as an artifact on the map, not a HUD sticker)
 *
 * Imported verbatim as the working baseline for the POI rework; iterate here.
 * Styling ships as an exported CSS string (`poiMarkerStyles`) injected by the
 * consuming page — component-scoped material, NOT a theme. Any new *skin* still
 * has to be a preset in skinConfigRegistry.
 *
 * Reference page: src/ui/idleVillage/pages/PoiMarkerLabPage.tsx (route /poi-marker-lab)
 */
import React, { CSSProperties, useEffect, useId, useMemo, useState } from "react";

export type PoiType = "quest" | "job" | "event";
export type PoiState =
  | "new"
  | "available"
  | "assigned"
  | "expiring"
  | "expired";

export type PoiMarkerProps = {
  type: PoiType;
  state?: PoiState;

  /**
   * Remaining time as a normalized value:
   * 1 = full, 0 = expired.
   *
   * For "available" this is normally 1.
   */
  progress?: number;

  /** If supplied, the ring counts down automatically. */
  durationMs?: number;
  autoStart?: boolean;
  onExpire?: () => void;

  /** Counter-clockwise is the recommended "deadline" behavior. */
  timerDirection?: "clockwise" | "counterclockwise";

  /** Visual importance only. It does not change the semantic color. */
  importance?: "normal" | "important" | "critical";

  /**
   * Opt-in contact shadow, for markers that must read as an object resting on a
   * surface rather than an icon drawn over it. Off by default: on a plain
   * background a grounding shadow has nothing to ground against, and variants
   * that do not implement it simply ignore the flag.
   */
  grounded?: boolean;

  size?: number;
  selected?: boolean;
  disabled?: boolean;
  className?: string;
  style?: CSSProperties;
  onClick?: () => void;
  onPointerEnter?: () => void;
  onPointerLeave?: () => void;
};

type Palette = {
  base: string;
  light: string;
  dark: string;
  glow: string;
  glowSoft: string;
};

const PALETTES: Record<PoiType, Palette> = {
  quest: {
    // Old honey / amber — intentionally not "yellow UI".
    base: "#B87924",
    light: "#FFE3A0",
    dark: "#5C3210",
    glow: "#F0B83E",
    glowSoft: "#C98B35",
  },
  job: {
    // Oxidized copper / verdigris.
    base: "#4F8B78",
    light: "#B9E1CF",
    dark: "#183B35",
    glow: "#78C5A8",
    glowSoft: "#4E927D",
  },
  event: {
    // Ember / deep crimson, not LED red.
    base: "#A94A35",
    light: "#FFC08B",
    dark: "#421713",
    glow: "#E56B45",
    glowSoft: "#A84C37",
  },
};

const LABELS: Record<PoiType, string> = {
  quest: "Quest",
  job: "Job",
  event: "Event",
};

/**
 * Returns an SVG arc beginning at 12 o'clock.
 * progress = 0..1.
 *
 * Positive direction = clockwise.
 * Negative direction = counter-clockwise.
 */
function arcPath(
  cx: number,
  cy: number,
  radius: number,
  progress: number,
  direction: "clockwise" | "counterclockwise"
) {
  const p = Math.max(0, Math.min(1, progress));

  if (p >= 0.9999) {
    // A complete ring needs two arcs because SVG's A command cannot draw 360°.
    return [
      `M ${cx} ${cy - radius}`,
      `A ${radius} ${radius} 0 1 ${direction === "clockwise" ? 1 : 0} ${cx} ${cy + radius}`,
      `A ${radius} ${radius} 0 1 ${direction === "clockwise" ? 1 : 0} ${cx} ${cy - radius}`,
    ].join(" ");
  }

  if (p <= 0.0001) return "";

  const startAngle = -Math.PI / 2;
  const delta = (Math.PI * 2 - 0.0001) * p;
  const endAngle =
    startAngle +
    (direction === "clockwise" ? delta : -delta);

  const x1 = cx + radius * Math.cos(startAngle);
  const y1 = cy + radius * Math.sin(startAngle);
  const x2 = cx + radius * Math.cos(endAngle);
  const y2 = cy + radius * Math.sin(endAngle);

  const largeArc = p > 0.5 ? 1 : 0;
  const sweep = direction === "clockwise" ? 1 : 0;

  return `M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} ${sweep} ${x2} ${y2}`;
}

function clamp(v: number) {
  return Math.max(0, Math.min(1, v));
}

/**
 * Position of the timer's leading edge.
 * It starts at 12 o'clock and follows the same direction as the arc.
 */
function arcEndpoint(
  cx: number,
  cy: number,
  radius: number,
  progress: number,
  direction: "clockwise" | "counterclockwise"
) {
  const p = clamp(progress);
  const startAngle = -Math.PI / 2;
  const delta = (Math.PI * 2 - 0.0001) * p;
  const angle =
    startAngle +
    (direction === "clockwise" ? delta : -delta);

  return {
    x: cx + radius * Math.cos(angle),
    y: cy + radius * Math.sin(angle),
  };
}

function iconFor(type: PoiType, color: string, light: string) {
  if (type === "quest") {
    // A four-point heraldic star / quest seal.
    return (
      <g fill="none" strokeLinecap="round" strokeLinejoin="round">
        <path
          d="M60 35 L65 52 L85 60 L65 68 L60 85 L55 68 L35 60 L55 52 Z"
          fill={color}
          stroke={light}
          strokeWidth="1.8"
        />
        <circle cx="60" cy="60" r="3.2" fill={light} stroke="none" />
      </g>
    );
  }

  if (type === "job") {
    // Small hammer / craft glyph.
    return (
      <g fill="none" stroke={light} strokeLinecap="round" strokeLinejoin="round">
        <path d="M47 71 L68 50" strokeWidth="6" />
        <path d="M66 47 L75 56" strokeWidth="6" />
        <path d="M40 39 L59 58" stroke={color} strokeWidth="7" />
        <path d="M37 36 L47 33 L55 41 L48 48 L39 45 Z" fill={color} strokeWidth="2" />
      </g>
    );
  }

  // Event: spark / burst.
  return (
    <g fill="none" strokeLinecap="round" strokeLinejoin="round">
      <path
        d="M60 32 L64 50 L80 40 L70 55 L88 60 L70 64 L80 80 L64 70 L60 88 L56 70 L40 80 L50 64 L32 60 L50 55 L40 40 L56 50 Z"
        fill={color}
        stroke={light}
        strokeWidth="1.6"
      />
      <circle cx="60" cy="60" r="3" fill={light} stroke="none" />
    </g>
  );
}

export const PoiMarker: React.FC<PoiMarkerProps> = ({
  type,
  state = "available",
  progress = 1,
  durationMs,
  autoStart = true,
  onExpire,
  timerDirection = "counterclockwise",
  importance = "normal",
  size = 112,
  selected = false,
  disabled = false,
  className = "",
  style,
  onClick,
  onPointerEnter,
  onPointerLeave,
}) => {
  const reactId = useId();
  const id = `poi-${reactId.replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const palette = PALETTES[type];

  const [currentProgress, setCurrentProgress] = useState(
    clamp(progress)
  );

  useEffect(() => {
    setCurrentProgress(clamp(progress));
  }, [progress]);

  useEffect(() => {
    if (!autoStart || !durationMs) return;
    if (state !== "assigned" && state !== "expiring") return;
    if (currentProgress <= 0) return;

    const startedAt = performance.now();
    const initial = currentProgress;

    let frame = 0;

    const tick = (now: number) => {
      const elapsed = now - startedAt;
      const next = clamp(initial - elapsed / durationMs);

      setCurrentProgress(next);

      if (next <= 0) {
        cancelAnimationFrame(frame);
        onExpire?.();
        return;
      }

      frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(frame);
    // Intentionally start a new timer only when duration/state/progress changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoStart, durationMs, state]);

  const ringProgress =
    state === "available" || state === "new"
      ? 1
      : currentProgress;

  const ring = useMemo(
    () =>
      arcPath(
        60,
        60,
        47,
        ringProgress,
        timerDirection
      ),
    [ringProgress, timerDirection]
  );

  const timerTip = useMemo(
    () =>
      arcEndpoint(
        60,
        60,
        47,
        ringProgress,
        timerDirection
      ),
    [ringProgress, timerDirection]
  );

  const urgent = state === "expiring";
  const isExpired = state === "expired" || currentProgress <= 0;

  const importanceClass =
    importance === "critical"
      ? "poi--critical"
      : importance === "important"
        ? "poi--important"
        : "";

  const cssVars = {
    "--poi-base": palette.base,
    "--poi-light": palette.light,
    "--poi-dark": palette.dark,
    "--poi-glow": palette.glow,
    "--poi-glow-soft": palette.glowSoft,
    "--poi-size": `${size}px`,
  } as CSSProperties;

  return (
    <button
      type="button"
      aria-label={`${LABELS[type]} ${isExpired ? "expired" : "available"}`}
      className={[
        "poi",
        `poi--${type}`,
        `poi--${state}`,
        importanceClass,
        selected ? "poi--selected" : "",
        disabled ? "poi--disabled" : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      style={{ ...cssVars, ...style }}
      onClick={onClick}
      onPointerEnter={onPointerEnter}
      onPointerLeave={onPointerLeave}
      disabled={disabled}
    >
      <svg
        className="poi__svg"
        viewBox="0 0 120 120"
        role="img"
        aria-hidden="true"
      >
        <defs>
          {/* Ambient bloom */}
          <filter
            id={`${id}-glow`}
            x="-80%"
            y="-80%"
            width="260%"
            height="260%"
          >
            <feGaussianBlur stdDeviation="5" result="blur" />
            <feColorMatrix
              in="blur"
              type="matrix"
              values={`
                1 0 0 0 0
                0 1 0 0 0
                0 0 1 0 0
                0 0 0 0.75 0
              `}
            />
          </filter>

          {/* Small bloom for the timer leading edge */}
          <filter
            id={`${id}-edgeGlow`}
            x="-200%"
            y="-200%"
            width="500%"
            height="500%"
          >
            <feGaussianBlur stdDeviation="2.2" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Organic metal texture.
              feTurbulence fills the whole filter region and feBlend emits it
              even where the source is transparent, which paints a translucent
              noise square around the marker. The feComposite below clips the
              grain to the source's alpha — do not remove it. */}
          <filter
            id={`${id}-metal`}
            x="-6%"
            y="-6%"
            width="112%"
            height="112%"
          >
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.035"
              numOctaves="3"
              seed="19"
              result="noise"
            />
            <feColorMatrix
              in="noise"
              type="matrix"
              values="
                0.18 0 0 0 0
                0 0.14 0 0 0
                0 0 0.08 0 0
                0 0 0 0.20 0"
              result="tintNoise"
            />
            <feComposite
              in="tintNoise"
              in2="SourceAlpha"
              operator="in"
              result="tintInside"
            />
            <feBlend
              in="SourceGraphic"
              in2="tintInside"
              mode="soft-light"
            />
          </filter>

          {/* Very subtle organic distortion */}
          <filter
            id={`${id}-organic`}
            x="-30%"
            y="-30%"
            width="160%"
            height="160%"
          >
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.035"
              numOctaves="2"
              seed="7"
              result="t"
            />
            <feDisplacementMap
              in="SourceGraphic"
              in2="t"
              scale="1.15"
              xChannelSelector="R"
              yChannelSelector="G"
            />
          </filter>

          <radialGradient id={`${id}-core`} cx="36%" cy="28%" r="80%">
            <stop offset="0%" stopColor="#453F2B" />
            <stop offset="30%" stopColor="#1B1A14" />
            <stop offset="72%" stopColor="#090B0A" />
            <stop offset="100%" stopColor="#020303" />
          </radialGradient>

          <linearGradient
            id={`${id}-bronze`}
            x1="20%"
            y1="5%"
            x2="80%"
            y2="95%"
          >
            <stop offset="0%" stopColor={palette.light} />
            <stop offset="12%" stopColor={palette.base} />
            <stop offset="42%" stopColor={palette.dark} />
            <stop offset="72%" stopColor="#120B07" />
            <stop offset="88%" stopColor={palette.base} />
            <stop offset="100%" stopColor="#050504" />
          </linearGradient>

          {/* Ambient bloom as a real falloff: a blurred solid disc gets clipped
              by the filter region and leaves a visible rectangle on the map. */}
          <radialGradient id={`${id}-ambient`} cx="50%" cy="50%" r="50%">
            <stop offset="55%" stopColor={palette.glow} stopOpacity="1" />
            <stop offset="78%" stopColor={palette.glow} stopOpacity="0.45" />
            <stop offset="100%" stopColor={palette.glow} stopOpacity="0" />
          </radialGradient>

          <radialGradient id={`${id}-innerGlow`} cx="50%" cy="45%" r="65%">
            <stop offset="0%" stopColor={palette.glow} stopOpacity="0.28" />
            <stop offset="42%" stopColor={palette.glow} stopOpacity="0.08" />
            <stop offset="100%" stopColor={palette.glow} stopOpacity="0" />
          </radialGradient>

          <linearGradient id={`${id}-shine`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFF8D7" stopOpacity="0.78" />
            <stop offset="18%" stopColor={palette.light} stopOpacity="0.25" />
            <stop offset="48%" stopColor="#FFF8D7" stopOpacity="0" />
            <stop offset="100%" stopColor="#FFF8D7" stopOpacity="0" />
          </linearGradient>

          <filter id={`${id}-shadow`} x="-50%" y="-50%" width="200%" height="220%">
            <feGaussianBlur in="SourceAlpha" stdDeviation="4" result="blur" />
            <feOffset dy="3" result="offset" />
            <feColorMatrix
              in="offset"
              type="matrix"
              values="
                0 0 0 0 0
                0 0 0 0 0
                0 0 0 0 0
                0 0 0 .65 0"
            />
            <feBlend in="SourceGraphic" />
          </filter>
        </defs>

        {/* Ground shadow: this is what makes it feel attached to the map. */}
        <ellipse
          cx="60"
          cy="108"
          rx="28"
          ry="5"
          fill="#000"
          opacity="0.55"
          filter={`url(#${id}-shadow)`}
        />

        {/* Ambient color — restrained so it doesn't look like a HUD marker. */}
        <circle
          cx="60"
          cy="60"
          r="58"
          fill={`url(#${id}-ambient)`}
          opacity={
            state === "expired"
              ? 0
              : importance === "critical"
                ? 0.20
                : importance === "important"
                  ? 0.13
                  : 0.075
          }
          className="poi__ambient"
        />

        {/* Ghost ring / material halo. */}
        <circle
          cx="60"
          cy="60"
          r="50"
          fill="none"
          stroke={palette.dark}
          strokeWidth="1"
          opacity="0.55"
          className="poi__ghost-ring"
        />

        {/* Timer underglow */}
        {!isExpired && (
          <path
            d={ring}
            fill="none"
            stroke={palette.glow}
            strokeWidth="6"
            strokeLinecap="round"
            opacity={urgent ? 0.40 : 0.22}
            filter={`url(#${id}-glow)`}
            className="poi__timer-glow"
          />
        )}

        {/* Timer itself */}
        {!isExpired && (
          <path
            d={ring}
            fill="none"
            stroke={palette.light}
            strokeWidth={urgent ? 3.2 : 2.6}
            strokeLinecap="round"
            opacity={urgent ? 0.96 : 0.88}
            filter={`url(#${id}-organic)`}
            className="poi__timer"
          />
        )}

        {/* A bright leading edge follows the timer itself. */}
        {!isExpired && (
          <circle
            cx={timerTip.x}
            cy={timerTip.y}
            r={urgent ? 3.4 : 2.7}
            fill={palette.light}
            filter={`url(#${id}-edgeGlow)`}
            className="poi__timer-edge"
          />
        )}

        {/* Outer physical medallion */}
        <circle
          cx="60"
          cy="60"
          r="38"
          fill={`url(#${id}-bronze)`}
          stroke="#080806"
          strokeWidth="2.5"
          filter={`url(#${id}-metal)`}
          className="poi__medallion"
        />

        {/* Bevel */}
        <circle
          cx="60"
          cy="60"
          r="34.5"
          fill="none"
          stroke={palette.light}
          strokeWidth="1.5"
          opacity="0.62"
          className="poi__bevel"
        />

        <circle
          cx="60"
          cy="60"
          r="32.5"
          fill="none"
          stroke="#090806"
          strokeWidth="2"
          opacity="0.85"
        />

        {/* Dark glass / obsidian core */}
        <circle
          cx="60"
          cy="60"
          r="27.5"
          fill={`url(#${id}-core)`}
          stroke="#000"
          strokeWidth="1.5"
        />

        {/* Colored light trapped inside the material */}
        <circle
          cx="60"
          cy="60"
          r="27"
          fill={`url(#${id}-innerGlow)`}
          opacity={state === "expired" ? 0.15 : 1}
          className="poi__inner-light"
        />

        {/* Specular diagonal */}
        <path
          d="M34 47 C43 31, 62 29, 77 38"
          fill="none"
          stroke={`url(#${id}-shine)`}
          strokeWidth="2"
          strokeLinecap="round"
          opacity="0.55"
        />

        {/* Tiny patina / material marks */}
        <g
          opacity="0.20"
          stroke={palette.light}
          strokeWidth="0.65"
          strokeLinecap="round"
        >
          <path d="M33 63 l3 -1" />
          <path d="M84 67 l2 1" />
          <path d="M43 87 l2 -1" />
          <path d="M76 31 l2 2" />
          <path d="M31 53 l2 -1" />
        </g>

        {/* Semantic icon */}
        <g
          opacity={isExpired ? 0.30 : 1}
          className="poi__icon"
        >
          {iconFor(type, palette.base, palette.light)}
        </g>

        {/* Selection brackets — deliberately understated. */}
        {selected && (
          <g
            fill="none"
            stroke={palette.light}
            strokeWidth="1.4"
            opacity="0.95"
            className="poi__selection"
          >
            <path d="M19 43 L19 34 L28 34" />
            <path d="M101 43 L101 34 L92 34" />
            <path d="M19 77 L19 86 L28 86" />
            <path d="M101 77 L101 86 L92 86" />
          </g>
        )}
      </svg>
    </button>
  );
};

/**
 * CSS can live beside the component or be copied into your global stylesheet.
 */
export const poiMarkerStyles = `
.poi {
  --poi-size: 112px;
  position: relative;
  display: inline-flex;
  width: var(--poi-size);
  height: var(--poi-size);
  padding: 0;
  margin: 0;
  border: 0;
  background: transparent;
  appearance: none;
  cursor: pointer;
  touch-action: manipulation;
  isolation: isolate;
  transition:
    transform 180ms ease,
    filter 180ms ease;
}

.poi:focus-visible {
  outline: 2px solid var(--poi-light);
  outline-offset: 4px;
}

.poi:hover:not(:disabled) {
  transform: scale(1.035);
}

.poi:active:not(:disabled) {
  transform: scale(.985);
}

.poi__svg {
  width: 100%;
  height: 100%;
  overflow: visible;
}

.poi__medallion {
  transform-origin: 60px 60px;
  animation: poi-medallion-breathe 7.5s ease-in-out infinite;
}

.poi__timer {
  transform-origin: 60px 60px;
}

.poi__timer-edge {
  transform-origin: 60px 60px;
  animation: poi-edge-breathe 2.8s ease-in-out infinite;
}

.poi__ambient {
  transform-origin: 60px 60px;
  animation: poi-ambient-breathe 6s ease-in-out infinite;
}

.poi__ghost-ring {
  transform-origin: 60px 60px;
  animation: poi-ghost-breathe 8s ease-in-out infinite;
}

.poi--new .poi__timer {
  animation: poi-new-ring 900ms cubic-bezier(.18,.72,.2,1) both;
}

.poi--new .poi__medallion {
  animation:
    poi-arrive 700ms cubic-bezier(.2,.9,.2,1) both,
    poi-medallion-breathe 7.5s ease-in-out 700ms infinite;
}

.poi--assigned .poi__timer,
.poi--expiring .poi__timer {
  transition: opacity 250ms linear;
}

.poi--expiring .poi__ambient {
  animation:
    poi-ambient-breathe 1.7s ease-in-out infinite,
    poi-expiring-flicker 3.2s steps(1, end) infinite;
}

.poi--expiring .poi__timer-edge {
  animation: poi-edge-breathe .9s ease-in-out infinite;
}

.poi--important {
  filter: drop-shadow(0 0 4px color-mix(in srgb, var(--poi-glow) 25%, transparent));
}

.poi--critical {
  filter: drop-shadow(0 0 7px color-mix(in srgb, var(--poi-glow) 45%, transparent));
}

.poi--critical .poi__ambient {
  animation:
    poi-ambient-breathe 1.8s ease-in-out infinite,
    poi-critical-flicker 2.4s steps(2, end) infinite;
}

.poi--selected .poi__medallion {
  animation:
    poi-selected-breathe 1.8s ease-in-out infinite;
}

.poi--disabled,
.poi--expired {
  cursor: default;
  filter: grayscale(.35);
}

.poi--expired .poi__ghost-ring {
  opacity: .18;
}

.poi--expired .poi__medallion {
  opacity: .68;
}

.poi--expired .poi__icon {
  opacity: .3;
}

@keyframes poi-medallion-breathe {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.012); }
}

@keyframes poi-ambient-breathe {
  0%, 100% { opacity: .82; }
  50% { opacity: 1; }
}

@keyframes poi-ghost-breathe {
  0%, 100% { opacity: .42; }
  50% { opacity: .68; }
}

@keyframes poi-edge-breathe {
  0%, 100% { opacity: .75; transform: scale(1); }
  50% { opacity: 1; transform: scale(1.16); }
}

@keyframes poi-edge-rotate {
  from { rotate: 0deg; }
  to { rotate: 360deg; }
}

@keyframes poi-arrive {
  0% {
    transform: scale(.55);
    opacity: 0;
  }
  60% {
    transform: scale(1.06);
    opacity: 1;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

@keyframes poi-new-ring {
  0% {
    opacity: 0;
    stroke-width: 8;
  }
  100% {
    opacity: 1;
    stroke-width: 2.6;
  }
}

@keyframes poi-expiring-flicker {
  0%, 100% { opacity: 1; }
  48% { opacity: .86; }
  50% { opacity: .98; }
  72% { opacity: .78; }
  74% { opacity: .96; }
}

@keyframes poi-critical-flicker {
  0%, 100% { opacity: 1; }
  25% { opacity: .78; }
  26% { opacity: 1; }
  68% { opacity: .84; }
  69% { opacity: .96; }
}

@keyframes poi-selected-breathe {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.025);
  }
}

@media (prefers-reduced-motion: reduce) {
  .poi,
  .poi * {
    animation: none !important;
    transition: none !important;
  }
}
`;

export default PoiMarker;
