import type { JSX } from 'react';
import { useId, useEffect, useRef, useState } from 'react';
import { useTranslation } from '@/localization/useTranslation';

/**
 * Props for GenericPoiSkin component
 */
export interface GenericPoiSkinOldProps {
  /** Icon/emoji to render in the center pin */
  icon?: string;
  /** Progress through a fill (0-1) */
  progress?: number;
  /** Corona core color (RGB) */
  coronaCore?: { r: number; g: number; b: number };
  /** Corona glow color (RGB) */
  coronaGlow?: { r: number; g: number; b: number };
  /** Rim gradient colors */
  rimColors?: [string, string, string]; // [stop0, stop1, stop2]
  /** Stone gradient colors */
  stoneColors?: [string, string]; // [stop0, stop1]
  /** Stone ambient glow color */
  stoneAmbient?: string;
  /** Pin icon color */
  pinColor?: string;
  /** Size in pixels */
  size?: number;
  /** Pillar type */
  pillar?: 'wilderness' | 'empire' | 'frontier';
  /** Label below POI */
  label?: string;
  /** Whether the activity is completed */
  isCompleted?: boolean;
  /** Whether hover state is enabled */
  enableHover?: boolean;
  /** Time remaining before expiration in milliseconds (optional) */
  timeRemainingMs?: number;
  /** Threshold for "near expiration" visual warnings in milliseconds (default: 60000ms = 1 minute) */
  expirationThresholdMs?: number;
  /** Whether this POI can expire and disappear (vs. countdown-only) */
  isExpirable?: boolean;
  /** Injury risk percentage (0-100) */
  injuryRisk?: number;
  /** Death risk percentage (0-100) */
  deathRisk?: number;
  /** Danger rating (0-10) */
  dangerRating?: number | string;
  /** Whether to show risk badges below the POI */
  showRiskBadges?: boolean;
}

const TAU = Math.PI * 2;
const STONE_R = 14;
const RIM_R = 19;
const BASE_RIM_SW = 2.8;
const TRACK_R = 28;
const TRACK_SW = 5;
const CIRC = TAU * TRACK_R;

/**
 * Calculate scale-aware border thickness
 * For small sizes (40-60px), increase border thickness to prevent flat appearance
 */
const calculateRimStrokeWidth = (size: number): number => {
  if (size <= 40) return BASE_RIM_SW * 1.8; // 80% thicker for very small
  if (size <= 60) return BASE_RIM_SW * 1.4; // 40% thicker for small
  if (size <= 80) return BASE_RIM_SW * 1.2; // 20% thicker for medium-small
  return BASE_RIM_SW; // Default for larger sizes
};

/**
 * Generic POI Skin Component
 *
 * Renders an animated POI medallion with corona layers, filters, and customizable colors.
 * Based on poi-skin-preview.html pattern with SVG turbulence, displacement, and animated strokes.
 *
 * SVG Layers (bottom to top):
 * 1. Track (invisible guide)
 * 2. Rim (bronze ring with noise)
 * 3. Stone (center field with ambient glow)
 * 4. Pin icon (with flicker animation)
 * 5. Corona glow (outer bloom)
 * 6. Corona turbA (slow animated distortion)
 * 7. Corona turbB (fast animated distortion)
 * 8. Corona reflect (highlight arc following progress)
 *
 * Animations:
 * - Rim breath: opacity 9.4s
 * - Stone ambient: opacity 12.1s
 * - Pin flicker: 4.3s steps
 * - Corona fill: viscous easing to target progress
 * - Corona pulse: sine wave after fill completes
 * - Corona reflect: arc highlight that tracks progress
 */
export function GenericPoiSkinOld(props: GenericPoiSkinOldProps): JSX.Element {
  const {
    icon = '🗺',
    progress = 0.5,
    coronaCore = { r: 210, g: 138, b: 28 },
    coronaGlow = { r: 180, g: 105, b: 10 },
    rimColors = ['#fce890', '#c09030', '#200e02'],
    stoneColors = ['#1e1608', '#030202'],
    stoneAmbient = 'rgba(255,220,120,.22)',
    pinColor = 'rgba(205,190,148,.72)',
    size = 80,
    label,
    isCompleted = false,
    enableHover = true,
    timeRemainingMs,
    expirationThresholdMs = 60000, // Default: 1 minute
    isExpirable = false,
    injuryRisk,
    deathRisk,
    dangerRating,
    showRiskBadges = false,
  } = props;

  const { t } = useTranslation('idleVillage');

  const uniqueId = useId().replace(/:/g, '');
  const svgRef = useRef<SVGSVGElement>(null);
  const animStateRef = useRef({ phase: 0, reflPhase: 0, fillProgress: 0, rotationPhase: 0 });
  const [isHovered, setIsHovered] = useState(false);

  // Calculate scale-aware rim stroke width
  const rimStrokeWidth = calculateRimStrokeWidth(size);

  // Calculate hover scale (5% enlargement)
  const hoverScale = isHovered && enableHover ? 1.05 : 1.0;

  // Calculate completed state colors
  const completedPinColor = isCompleted ? 'rgba(128, 128, 128, 0.72)' : pinColor;
  const completedCoronaCore = isCompleted ? { r: 128, g: 128, b: 128 } : coronaCore;
  const completedCoronaGlow = isCompleted ? { r: 128, g: 128, b: 128 } : coronaGlow;

  // Calculate expiration state
  const isNearExpiration = timeRemainingMs !== undefined && timeRemainingMs < expirationThresholdMs;
  const expirationRatio = timeRemainingMs !== undefined && timeRemainingMs > 0
    ? Math.min(timeRemainingMs / expirationThresholdMs, 1)
    : 1;

  // Calculate color transition: Orange (255, 165, 0) -> Red (255, 0, 0)
  // When expirationRatio = 1 (far from expiration): use original colors
  // When expirationRatio = 0 (at expiration): pure red
  const expirationColorShift = isNearExpiration ? 1 - expirationRatio : 0;
  const expiredCoronaCore = isNearExpiration
    ? {
        r: Math.round(coronaCore.r + (255 - coronaCore.r) * expirationColorShift),
        g: Math.round(coronaCore.g * (1 - expirationColorShift)),
        b: Math.round(coronaCore.b * (1 - expirationColorShift)),
      }
    : coronaCore;
  const expiredCoronaGlow = isNearExpiration
    ? {
        r: Math.round(coronaGlow.r + (255 - coronaGlow.r) * expirationColorShift),
        g: Math.round(coronaGlow.g * (1 - expirationColorShift)),
        b: Math.round(coronaGlow.b * (1 - expirationColorShift)),
      }
    : coronaGlow;

  // SVG element IDs
  const sfId = `sf-${uniqueId}`;
  const saId = `sa-${uniqueId}`;
  const bzId = `bz-${uniqueId}`;
  const frId = `fr-${uniqueId}`;
  const fimId = `fim-${uniqueId}`;
  const fnId = `fn-${uniqueId}`;
  const ftkId = `ftk-${uniqueId}`;
  const ftaId = `fta-${uniqueId}`;
  const ftbId = `ftb-${uniqueId}`;
  const fgId = `fg-${uniqueId}`;
  const fpgId = `fpg-${uniqueId}`;
  const fdId = `fd-${uniqueId}`;
  const cpId = `cp-${uniqueId}`;

  // Scale factor
  const scaleFactor = size / 160; // Base size is 160

  // Easing function (viscous)
  const easeViscous = (t: number) => {
    if (t <= 0) return 0;
    if (t >= 1) return 1;
    return t < 0.08 ? (t / 0.08) * (t / 0.08) * 0.08 : 0.08 + ((t - 0.08) / (1 - 0.08)) * 0.92;
  };

  // Animation loop
  useEffect(() => {
    if (!svgRef.current) return;

    const state = animStateRef.current;
    let t0: number | null = null;

    const loop = (now: number) => {
      if (!t0) t0 = now;
      if (!svgRef.current) return;

      const raw = Math.min((now - t0) / 7000, 1); // Fill over 7s
      const fillProg = easeViscous(raw) * progress;
      const filled = raw >= 1;

      state.phase += 0.015;
      state.reflPhase += 0.0008;
      state.fillProgress = fillProg;

      // Counterclockwise rotation when near expiration
      if (isNearExpiration) {
        state.rotationPhase -= 0.02; // Constant counterclockwise rotation
      }

      const pulse = filled ? 0.6 + 0.4 * Math.sin(state.phase) : 1.0;
      const reflO = Math.sin(state.reflPhase) * 0.5 + 0.5;

      // Update corona arcs
      const drawn = CIRC * Math.min(fillProg, 1);
      const gap = Math.max(0, CIRC - drawn);
      const da = `${drawn.toFixed(2)} ${gap.toFixed(2)}`;
      const cap = fillProg >= 0.999 ? 'butt' : 'round';

      // Corona glow
      const glowEl = svgRef.current.querySelector('[data-corona="glow"]') as SVGCircleElement;
      if (glowEl) {
        glowEl.setAttribute(
          'stroke',
          `rgba(${expiredCoronaGlow.r},${expiredCoronaGlow.g},${expiredCoronaGlow.b},${((0.38 + 0.2 * fillProg) * pulse).toFixed(3)})`
        );
        glowEl.setAttribute('stroke-dasharray', da);
        glowEl.setAttribute('stroke-linecap', cap);
        // Apply rotation
        const baseRotation = -90; // Base offset to start at top
        const rotation = isNearExpiration ? baseRotation + state.rotationPhase : baseRotation;
        glowEl.setAttribute('transform', `rotate(${rotation})`);
      }

      // Corona turb A
      const turbAEl = svgRef.current.querySelector('[data-corona="turb-a"]') as SVGCircleElement;
      if (turbAEl) {
        turbAEl.setAttribute(
          'stroke',
          `rgba(${expiredCoronaCore.r},${expiredCoronaCore.g},${expiredCoronaCore.b},${((0.78 + 0.15 * fillProg) * pulse).toFixed(3)})`
        );
        turbAEl.setAttribute('stroke-dasharray', da);
        turbAEl.setAttribute('stroke-linecap', cap);
        // Apply rotation
        const baseRotation = -90;
        const rotation = isNearExpiration ? baseRotation + state.rotationPhase : baseRotation;
        turbAEl.setAttribute('transform', `rotate(${rotation})`);
      }

      // Corona turb B
      const turbBEl = svgRef.current.querySelector('[data-corona="turb-b"]') as SVGCircleElement;
      if (turbBEl) {
        turbBEl.setAttribute('stroke-dasharray', da);
        turbBEl.setAttribute('stroke-linecap', cap);
        // Apply rotation
        const baseRotation = -90;
        const rotation = isNearExpiration ? baseRotation + state.rotationPhase : baseRotation;
        turbBEl.setAttribute('transform', `rotate(${rotation})`);
      }

      // Corona reflect
      const reflectEl = svgRef.current.querySelector('[data-corona="reflect"]') as SVGCircleElement;
      if (reflectEl) {
        if (fillProg > 0.12) {
          const refLen = CIRC * 0.14;
          const maxOffset = Math.max(0, drawn - refLen - CIRC * 0.04);
          const refStart = maxOffset * reflO;
          const refGap = CIRC - refLen;
          reflectEl.setAttribute('stroke-dasharray', `${refLen.toFixed(2)} ${refGap.toFixed(2)}`);
          reflectEl.setAttribute('stroke-dashoffset', `${-refStart}`);
          reflectEl.setAttribute('stroke-linecap', 'round');
          reflectEl.style.opacity = (0.6 * fillProg * pulse).toFixed(3);
          // Apply rotation
          const baseRotation = -90;
          const rotation = isNearExpiration ? baseRotation + state.rotationPhase : baseRotation;
          reflectEl.setAttribute('transform', `rotate(${rotation})`);
        } else {
          reflectEl.style.opacity = '0';
        }
      }

      requestAnimationFrame(loop);
    };

    const frameId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frameId);
  }, [progress, completedCoronaCore, completedCoronaGlow, expiredCoronaCore, expiredCoronaGlow, isNearExpiration]);

  const scaledSize = size * 2; // Internal size is 160, scale down via viewBox

  return (
    <div className="flex flex-col items-center gap-3">
      <svg
        ref={svgRef}
        width={size}
        height={size}
        viewBox="-80 -80 160 160"
        className="overflow-visible transition-all duration-300 ease-out cursor-pointer"
        style={{
          display: 'block',
          transform: `scale(${hoverScale})`,
          borderRadius: '50%',
          filter: isHovered && enableHover 
            ? 'brightness(1.15) drop-shadow(0 0 12px var(--pulse-glow-heavy, rgba(201, 162, 39, 0.6)))' 
            : undefined,
          '--pulse-glow-color': `rgba(${expiredCoronaGlow.r}, ${expiredCoronaGlow.g}, ${expiredCoronaGlow.b}, 0.22)`,
          '--pulse-glow-heavy': `rgba(${expiredCoronaGlow.r}, ${expiredCoronaGlow.g}, ${expiredCoronaGlow.b}, 0.55)`,
        } as React.CSSProperties}
        onMouseEnter={() => enableHover && setIsHovered(true)}
        onMouseLeave={() => enableHover && setIsHovered(false)}
      >
        <defs>
          {/* Radial gradient for stone field */}
          <radialGradient id={sfId} cx="36%" cy="28%" r="70%">
            <stop offset="0%" stopColor={stoneColors[0]} />
            <stop offset="100%" stopColor={stoneColors[1]} />
          </radialGradient>

          {/* Ambient glow for stone */}
          <radialGradient id={saId} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={stoneAmbient} />
            <stop offset="100%" stopColor="rgba(0,0,0,0)" />
          </radialGradient>

          {/* Rim bronze gradient */}
          <linearGradient id={bzId} x1="14%" y1="4%" x2="86%" y2="96%">
            <stop offset="0%" stopColor={rimColors[0]} />
            <stop offset="28%" stopColor={rimColors[1]} />
            <stop offset="100%" stopColor={rimColors[2]} />
          </linearGradient>

          {/* Specular highlight for hover */}
          <linearGradient id="rimHoverSpecular" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="rgba(255,255,255,0)" />
            <stop offset="35%" stopColor="rgba(255,255,255,0)" />
            <stop offset="50%" stopColor="rgba(255,255,255,0.85)" />
            <stop offset="65%" stopColor="rgba(255,255,255,0)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0)" />
          </linearGradient>

          {/* Rim glow filter */}
          <filter id={frId} x="-80%" y="-80%" width="260%" height="260%">
            <feGaussianBlur stdDeviation="1.0" result="b" />
            <feComposite in="SourceGraphic" in2="b" operator="over" />
          </filter>

          {/* Rim imperfections (noise) */}
          <filter id={fimId} x="-5%" y="-5%" width="110%" height="110%">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.8 0.4"
              numOctaves="3"
              seed="22"
              result="n"
            />
            <feColorMatrix
              in="n"
              type="matrix"
              values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 .18 0"
              result="nm"
            />
            <feComposite in="SourceGraphic" in2="nm" operator="arithmetic" k1="0" k2="1" k3="0.22" k4="0" />
          </filter>

          {/* Stone noise */}
          <filter id={fnId} x="-5%" y="-5%" width="110%" height="110%">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.55"
              numOctaves="4"
              seed="7"
              stitchTiles="stitch"
              result="n"
            />
            <feColorMatrix
              in="n"
              type="matrix"
              values="0 0 0 0 .058 0 0 0 0 .040 0 0 0 0 .016 0 0 0 .22 0"
              result="c"
            />
            <feBlend in="SourceGraphic" in2="c" mode="overlay" />
          </filter>

          {/* Track noise */}
          <filter id={ftkId} x="-5%" y="-5%" width="110%" height="110%">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.35 0.15"
              numOctaves="4"
              seed="3"
              stitchTiles="stitch"
              result="n"
            />
            <feColorMatrix
              in="n"
              type="matrix"
              values="0 0 0 0 .04  0 0 0 0 .03  0 0 0 0 .02  0 0 0 .30 0"
              result="c"
            />
            <feBlend in="SourceGraphic" in2="c" mode="overlay" />
          </filter>

          {/* Corona turb A (slow displacement) */}
          <filter id={ftaId} x="-15%" y="-15%" width="130%" height="130%">
            <feTurbulence
              type="turbulence"
              baseFrequency="0.008 0.04"
              numOctaves="3"
              seed="9"
              result="t"
            >
              <animate attributeName="seed" values="9;10;11;12;9" dur="7.3s" repeatCount="indefinite" />
              <animate
                attributeName="baseFrequency"
                values="0.008 0.04;0.010 0.038;0.008 0.042;0.009 0.04;0.008 0.04"
                dur="11.7s"
                repeatCount="indefinite"
              />
            </feTurbulence>
            <feDisplacementMap in="SourceGraphic" in2="t" scale="3.5" xChannelSelector="R" yChannelSelector="G" result="d" />
            <feGaussianBlur in="d" stdDeviation="0.4" />
          </filter>

          {/* Corona turb B (fast displacement) */}
          <filter id={ftbId} x="-8%" y="-8%" width="116%" height="116%">
            <feTurbulence type="turbulence" baseFrequency="0.025 0.08" numOctaves="2" seed="33" result="t">
              <animate attributeName="seed" values="33;34;35;33" dur="3.1s" repeatCount="indefinite" />
            </feTurbulence>
            <feDisplacementMap in="SourceGraphic" in2="t" scale="1.8" xChannelSelector="R" yChannelSelector="G" />
          </filter>

          {/* Corona glow (final bloom) */}
          <filter id={fgId} x="-80%" y="-80%" width="260%" height="260%" colorInterpolationFilters="sRGB">
            <feGaussianBlur in="SourceGraphic" stdDeviation="1.0" result="g1" />
            <feGaussianBlur in="SourceGraphic" stdDeviation="2.5" result="g2" />
            <feColorMatrix
              in="g2"
              type="matrix"
              values="1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 0 0 .38 0"
              result="g2d"
            />
            <feBlend in="g2d" in2="g1" mode="screen" result="b1" />
            <feBlend in="b1" in2="SourceGraphic" mode="screen" />
          </filter>

          {/* Particle glow (unused but included for completeness) */}
          <filter id={fpgId} x="-600%" y="-600%" width="1300%" height="1300%">
            <feGaussianBlur stdDeviation="2.2" />
          </filter>

          {/* Drop shadow */}
          <filter id={fdId} x="-60%" y="-50%" width="220%" height="220%">
            <feDropShadow dx="0" dy="3" stdDeviation="4.5" floodColor="rgba(0,0,0,.55)" />
            <feDropShadow dx="0" dy="0.8" stdDeviation="1.5" floodColor="rgba(0,0,0,.35)" />
          </filter>

          {/* Clip path for stone */}
          <clipPath id={cpId}>
            <circle cx="0" cy="0" r={STONE_R} />
          </clipPath>

          {/* Clip path for rim (to prevent filter bounding box artifacts) */}
          <clipPath id={`${cpId}-rim`}>
            <circle cx="0" cy="0" r={RIM_R + 2} />
          </clipPath>

          {/* Clip path for track/corona (to prevent filter bounding box artifacts) */}
          <clipPath id={`${cpId}-track`}>
            <circle cx="0" cy="0" r={TRACK_R + 2} />
          </clipPath>
        </defs>

        {/* Base group with shadow */}
        <g filter={`url(#${fdId})`}>
          {/* Track (invisible) */}
          <g clipPath={`url(#${cpId}-track)`}>
            <circle cx="0" cy="0" r={TRACK_R} fill="none" stroke="rgba(0,0,0,.58)" strokeWidth={TRACK_SW} filter={`url(#${ftkId})`} />
          </g>

          {/* Outer rim edge */}
          <circle cx="0" cy="0" r={RIM_R + rimStrokeWidth / 2 + 0.8} fill="none" stroke="rgba(0,0,0,.72)" strokeWidth="1.8" />

          {/* Rim (with breath animation) */}
          <style>{`
            @keyframes rimBreath {
              0%, 100% { opacity: 0.92; }
              45% { opacity: 0.68; }
              75% { opacity: 0.85; }
            }
            [data-rim] {
              animation: rimBreath 9.4s ease-in-out infinite;
            }
            @keyframes stoneAmbient {
              0%, 100% { opacity: 0.15; }
              50% { opacity: 0.32; }
            }
            [data-stone-ambient] {
              animation: stoneAmbient 12.1s ease-in-out infinite;
            }
            @keyframes pinFlicker {
              0%, 100% { opacity: 1; }
              4% { opacity: 0.84; }
              4.8% { opacity: 1; }
              30% { opacity: 0.90; }
              31% { opacity: 1; }
              62% { opacity: 0.74; }
              63% { opacity: 1; }
            }
            [data-pin-flicker] {
              animation: pinFlicker 4.3s steps(1, end) infinite;
            }
            @keyframes specularSweep {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}</style>

          <g data-rim clipPath={`url(#${cpId}-rim)`}>
            <circle
              cx="0"
              cy="0"
              r={RIM_R}
              fill="none"
              stroke={`url(#${bzId})`}
              strokeWidth={rimStrokeWidth}
              filter={`url(#${fimId})`}
              opacity="0.92"
            />
            <circle cx="0" cy="0" r={RIM_R - rimStrokeWidth / 2 - 0.5} fill="none" stroke="rgba(0,0,0,.50)" strokeWidth="0.7" />
          </g>

          {/* Specular metallic sweep overlay on rim */}
          <g 
            style={{
              opacity: isHovered && enableHover ? 0.95 : 0,
              mixBlendMode: 'color-dodge',
              transition: isHovered && enableHover
                ? 'opacity 0.3s ease-in-out, transform 0.8s ease-out'
                : 'opacity 0.3s ease-in-out, transform 0s',
              transform: isHovered && enableHover ? 'rotate(360deg)' : 'rotate(0deg)',
              transformOrigin: '0px 0px',
              pointerEvents: 'none',
            }}
          >
            <circle
              cx="0"
              cy="0"
              r={RIM_R}
              fill="none"
              stroke="url(#rimHoverSpecular)"
              strokeWidth={rimStrokeWidth}
            />
          </g>

          {/* Stone ambient glow */}
          <circle cx="0" cy="0" r={STONE_R + 0.8} fill={`url(#${saId})`} data-stone-ambient />

          {/* Stone field */}
          <g clipPath={`url(#${cpId})`}>
            <circle cx="0" cy="0" r={STONE_R} fill={`url(#${sfId})`} filter={`url(#${fnId})`} opacity="0.98" />
          </g>

          {/* Pin icon */}
          <g clipPath={`url(#${cpId})`}>
            <g transform="translate(.3,.4)" opacity="0.55">
              <path d="M0,-5 L0,4" fill="none" stroke="rgba(0,0,0,.95)" strokeWidth="1.4" strokeLinecap="round" />
              <path d="M-2.8,-.3 L2.8,-.3" fill="none" stroke="rgba(0,0,0,.90)" strokeWidth="1.0" strokeLinecap="round" />
              <path d="M-.6,3.4 L.6,3.4 L0,5.2 Z" fill="rgba(0,0,0,.90)" />
            </g>
            <g data-pin-flicker opacity="0.50">
              <text x="0" y="1" textAnchor="middle" dominantBaseline="central" fontSize="10" fill={completedPinColor}>
                {icon}
              </text>
            </g>
          </g>

          {/* Stone rim */}
          <circle cx="0.15" cy="0.18" r={STONE_R} fill="none" stroke="rgba(0,0,0,.42)" strokeWidth="1.2" />
        </g>

        {/* Corona layers (animated) */}
        <g clipPath={`url(#${cpId}-track)`}>
          <circle cx="0" cy="0" r={TRACK_R} fill="none" stroke={`rgba(${coronaGlow.r},${coronaGlow.g},${coronaGlow.b},.50)`} strokeWidth={TRACK_SW + 2} filter={`url(#${fgId})`} transform="rotate(-90)" data-corona="glow" />

          <circle
            cx="0"
            cy="0"
            r={TRACK_R}
            fill="none"
            stroke={`rgba(${coronaCore.r},${coronaCore.g},${coronaCore.b},.88)`}
            strokeWidth={TRACK_SW}
            strokeLinecap="butt"
            filter={`url(#${ftaId})`}
            transform="rotate(-90)"
            data-corona="turb-a"
          />

          <circle
            cx="0"
            cy="0"
            r={TRACK_R}
            fill="none"
            stroke={`rgba(${Math.min(255, coronaCore.r + 30)},${Math.min(255, coronaCore.g + 20)},${Math.min(255, coronaCore.b + 10)},.45)`}
            strokeWidth={TRACK_SW * 0.5}
            strokeLinecap="butt"
            filter={`url(#${ftbId})`}
            transform="rotate(-90)"
            data-corona="turb-b"
          />

          <circle
            cx="0"
            cy="0"
            r={TRACK_R}
            fill="none"
            stroke={`rgba(${Math.min(255, coronaCore.r + 60)},${Math.min(255, coronaCore.g + 50)},${Math.min(255, coronaCore.b + 30)},.28)`}
            strokeWidth={TRACK_SW * 0.6}
            strokeLinecap="round"
            transform="rotate(-90)"
            data-corona="reflect"
          />
        </g>
      </svg>

      {/* Label */}
      {label && <div className="text-xs font-semibold text-amber-200 tracking-wider">{label}</div>}

      {/* Risk Badges */}
      {showRiskBadges && (injuryRisk !== undefined || deathRisk !== undefined || dangerRating !== undefined) && (
        <div className="flex flex-wrap items-center justify-center gap-1.5 mt-2">
          {/* Injury Risk Badge */}
          {injuryRisk !== undefined && (
            <div 
              className="flex items-center px-2.5 py-1 text-[10px] font-semibold tracking-wider uppercase rounded border select-none transition-all duration-200 hover:scale-105"
              style={{
                background: 'linear-gradient(135deg, #15110f 0%, #0c0908 100%)',
                border: '1px solid rgba(192, 140, 34, 0.35)',
                color: 'rgba(230, 220, 200, 0.95)',
                boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.08), 0 2px 4px rgba(0,0,0,0.8)',
              }}
              title={t('idleVillage:poiDetail.risk.injury.title')}
            >
              {/* Stylized blood drop icon */}
              <svg width="10" height="12" viewBox="0 0 24 24" fill="none" className="mr-1.5 shrink-0">
                <path d="M12 3C12 3 6 11 6 15C6 18.3 8.7 21 12 21C15.3 21 18 18.3 18 15C18 11 12 3 12 3Z" fill="#ef4444" stroke="#7f1d1d" strokeWidth="1" />
              </svg>
              <span>{t('idleVillage:poiDetail.risk.injury.label', { defaultValue: 'INJURY: {risk}%', risk: injuryRisk })}</span>
            </div>
          )}

          {/* Death Risk Badge */}
          {deathRisk !== undefined && (
            <div 
              className="flex items-center px-2.5 py-1 text-[10px] font-semibold tracking-wider uppercase rounded border select-none transition-all duration-200 hover:scale-105"
              style={{
                background: 'linear-gradient(135deg, #15110f 0%, #0c0908 100%)',
                border: '1px solid rgba(192, 140, 34, 0.35)',
                color: 'rgba(230, 220, 200, 0.95)',
                boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.08), 0 2px 4px rgba(0,0,0,0.8)',
              }}
              title={t('idleVillage:poiDetail.risk.death.title')}
            >
              {/* Stylized golden skull icon */}
              <svg width="11" height="12" viewBox="0 0 24 24" fill="none" className="mr-1.5 shrink-0">
                <path
                  d="M12 2C7.58 2 4 5.58 4 10C4 12.87 5.5 15.38 7.75 16.78L7 21L10 20L12 22L14 20L17 21L16.25 16.78C18.5 15.38 20 12.87 20 10C20 5.58 16.42 2 12 2ZM9 9C9.55 9 10 9.45 10 10C10 10.55 9.55 11 9 11C8.45 11 8 10.55 8 10C8 9.45 8.45 9 9 9ZM15 9C15.55 9 16 9.45 16 10C16 10.55 15.55 11 15 11C14.45 11 14 10.55 14 10C14 9.45 14.45 9 15 9Z"
                  fill="#ffd700"
                  stroke="#8b6508"
                  strokeWidth="1"
                />
              </svg>
              <span>{t('idleVillage:poiDetail.risk.death.label', { defaultValue: 'DEATH: {risk}%', risk: deathRisk })}</span>
            </div>
          )}

          {/* Danger Rating Badge */}
          {dangerRating !== undefined && (
            <div 
              className="flex items-center px-2.5 py-1 text-[10px] font-semibold tracking-wider uppercase rounded border select-none transition-all duration-200 hover:scale-105"
              style={{
                background: 'linear-gradient(135deg, #15110f 0%, #0c0908 100%)',
                border: '1px solid rgba(192, 140, 34, 0.35)',
                color: 'rgba(230, 220, 200, 0.95)',
                boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.08), 0 2px 4px rgba(0,0,0,0.8)',
              }}
              title={t('idleVillage:poiDetail.risk.danger.title')}
            >
              {/* Stylized warning triangle icon */}
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" className="mr-1.5 shrink-0">
                <path
                  d="M12 2L2 22H22L12 2ZM12 18C11.45 18 11 17.55 11 17C11 16.45 11.45 16 12 16C12.55 16 13 16.45 13 17C13 17.55 12.55 18 12 18ZM11 14V10C11 9.45 11.45 9 12 9C12.55 9 13 9.45 13 10V14C13 14.55 12.55 15 12 15C12.45 15 11 14.55 11 14Z"
                  fill="#f97316"
                  stroke="#7c2d12"
                  strokeWidth="1"
                />
              </svg>
              <span>{t('idleVillage:poiDetail.risk.danger.label', { defaultValue: 'DANGER: {rating}', rating: dangerRating })}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
