import type { JSX } from 'react';
import { useId, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from '@/localization/useTranslation';
import { computeStageState, colorToRgba, type ColorPalette } from './expiryStageEngine';
import { getPoiPalette } from '../../../visualFidelityLab/poiMedallionRecipe';

export interface GenericPoiSkinProps {
  icon?: string;
  progress?: number;
  coronaCore?: { r: number; g: number; b: number };
  coronaGlow?: { r: number; g: number; b: number };
  rimColors?: [string, string, string];
  stoneColors?: [string, string];
  stoneAmbient?: string;
  pinColor?: string;
  size?: number;
  pillar?: 'wilderness' | 'empire' | 'frontier';
  label?: string;
  isCompleted?: boolean;
  enableHover?: boolean;
  timeRemainingMs?: number;
  totalDurationMs?: number; // Ignored if isExpirable is false; default: 60000 (60s)
  expirationThresholdMs?: number; // Deprecated: kept for backwards compat, use totalDurationMs instead
  isExpirable?: boolean;
  cardKind?: 'quest' | 'event' | 'job' | 'activity';
  injuryRisk?: number;
  deathRisk?: number;
  dangerRating?: number | string;
  showRiskBadges?: boolean;
  shape?: 'stone' | 'circle';
}

const TAU = Math.PI * 2;

function desaturate(color: { r: number; g: number; b: number }): { r: number; g: number; b: number } {
  const v = Math.round((color.r + color.g + color.b) / 3);
  return { r: v, g: v, b: v };
}

type IconKind = 'sword' | 'hammer' | 'scroll' | 'lens' | 'emoji';

function resolveIconKind(icon: string): IconKind {
  if (/[⚔🗡🛡]/u.test(icon)) return 'sword';
  if (/[🪓🔨⛏🛠🔧]/u.test(icon)) return 'hammer';
  if (/[📜📃🗞📄✉]/u.test(icon)) return 'scroll';
  if (/[🔍🧭🗺🌲🌳]/u.test(icon)) return 'lens';
  return 'emoji';
}

function PoiIconPaths({ kind, color }: { kind: IconKind; color: string }): JSX.Element {
  switch (kind) {
    case 'sword':
      return (
        <>
          <path d="M0,-7 L1.2,-4 L1.2,4 L0,7 L-1.2,4 L-1.2,-4 Z" fill={color} fillOpacity={0.68} stroke="none" />
          <path d="M0,-7 L0,5" stroke={color} strokeWidth="1.6" strokeLinecap="round" />
          <path d="M-3.8,-.5 L3.8,-.5" stroke={color} strokeWidth="1.3" strokeLinecap="round" />
          <path d="M-.8,5 L.8,5 L0,7 Z" fill={color} fillOpacity={0.7} />
          <path d="M-.3,-6 L-.2,3" stroke={color} strokeWidth="0.5" strokeLinecap="round" />
        </>
      );
    case 'hammer':
      return (
        <>
          <path d="M-.8,-7 L.8,-7 L.8,-1 L-.8,-1 Z" fill="none" stroke={color} strokeWidth="1.2" strokeLinejoin="round" />
          <rect x="-3.8" y="-7.8" width="7.6" height="3.6" rx="0.5" fill={color} fillOpacity={0.22} stroke={color} strokeWidth="1.1" />
          <path d="M0,-1 L0,6.5" stroke={color} strokeWidth="1.6" strokeLinecap="round" />
          <path d="M-.6,-1.2 L.6,-1.2" stroke={color} strokeWidth="0.6" />
        </>
      );
    case 'scroll':
      return (
        <>
          <path d="M-4,-5.5 C-4,-7 -2.5,-7.5 -1.5,-6.5 L-1.5,6.5 C-2.5,7.5 -4,7 -4,5.5 Z" fill={color} fillOpacity={0.18} stroke={color} strokeWidth="1" />
          <path d="M4,-5.5 C4,-7 2.5,-7.5 1.5,-6.5 L1.5,6.5 C2.5,7.5 4,7 4,5.5 Z" fill={color} fillOpacity={0.18} stroke={color} strokeWidth="1" />
          <rect x="-1.5" y="-6.5" width="3" height="13" fill={color} fillOpacity={0.15} />
          <line x1="-1" y1="-3" x2="1" y2="-3" stroke={color} strokeWidth="0.7" />
          <line x1="-1" y1="-.5" x2="1" y2="-.5" stroke={color} strokeWidth="0.7" />
          <line x1="-1" y1="2" x2="0.4" y2="2" stroke={color} strokeWidth="0.7" />
        </>
      );
    case 'lens':
      return (
        <>
          <circle cx="0" cy="0" r="4.5" stroke={color} strokeWidth="1.2" fill="none" />
          <path d="M3.2,3.2 L6.5,6.5" stroke={color} strokeWidth="1.4" strokeLinecap="round" />
        </>
      );
    case 'emoji':
    default:
      return (
        <text x="0" y="1" textAnchor="middle" dominantBaseline="central" fontSize="10" fill={color}>
          {kind === 'emoji' ? '🗺' : ''}
        </text>
      );
  }
}

function PoiIcon({ icon, color, clipPathId }: { icon: string; color: string; clipPathId: string }): JSX.Element {
  const kind = resolveIconKind(icon);
  if (kind === 'emoji') {
    return (
      <g clipPath={`url(#${clipPathId})`}>
        <text x="0" y="1" textAnchor="middle" dominantBaseline="central" fontSize="10" fill={color}>
          {icon || '🗺'}
        </text>
      </g>
    );
  }
  return (
    <g clipPath={`url(#${clipPathId})`}>
      <g transform="translate(.6,.7)" opacity={0.55}>
        <PoiIconPaths kind={kind} color="rgba(0,0,0,0.85)" />
      </g>
      <g>
        <PoiIconPaths kind={kind} color={color} />
      </g>
    </g>
  );
}

export function GenericPoiSkin(props: GenericPoiSkinProps): JSX.Element {
  const {
    icon = '🗺',
    progress = 0,
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
    totalDurationMs = 60000,
    expirationThresholdMs = 60000,
    isExpirable = false,
    cardKind,
    injuryRisk,
    deathRisk,
    dangerRating,
    showRiskBadges = false,
    shape = 'circle',
  } = props;

  const { t } = useTranslation('idleVillage');
  const uniqueId = useId().replace(/:/g, '');
  const svgRef = useRef<SVGSVGElement>(null);
  const animStateRef = useRef({ phase: 0, fillProgress: 0, rotationPhase: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const isStone = shape === 'stone';
  const completedPinColor = isCompleted ? 'rgba(128, 128, 128, 0.72)' : pinColor;
  const completedCoronaCore = isCompleted ? desaturate(coronaCore) : coronaCore;
  const completedCoronaGlow = isCompleted ? desaturate(coronaGlow) : coronaGlow;

  // Expiry stage machine (3-stage monotonous escalation)
  const remainingFraction = useMemo(() => {
    if (!isExpirable || timeRemainingMs === undefined || totalDurationMs === undefined) return 1;
    return Math.max(0, Math.min(timeRemainingMs / totalDurationMs, 1));
  }, [isExpirable, timeRemainingMs, totalDurationMs]);

  // Get palette for POI type (quest/event/job/activity)
  const poiPalette = useMemo(() => {
    const palette = getPoiPalette(cardKind);
    return palette as ColorPalette;
  }, [cardKind]);

  const stageState = useMemo(() => {
    if (!isExpirable) {
      // No expiry: use calm state with coronaCore/coronaGlow
      return {
        stage: 'calm' as const,
        fillColor: completedCoronaCore,
        glowColor: completedCoronaGlow,
        pulseIntensity: 0.2,
        rotationActive: false,
      };
    }
    return computeStageState(remainingFraction, poiPalette);
  }, [isExpirable, remainingFraction, poiPalette, completedCoronaCore, completedCoronaGlow]);

  const expiredCoronaCore = stageState.fillColor;
  const expiredCoronaGlow = stageState.glowColor;
  const showUrgentPulse = isExpirable && stageState.stage !== 'calm';

  const stoneGradientId = `sg-${uniqueId}`;
  const stoneAmbientId = `sa-${uniqueId}`;
  const rimGradientId = `bz-${uniqueId}`;
  const rimHoverGradientId = `rh-${uniqueId}`;
  const bloomGradientId = `bl-${uniqueId}`;
  const specularGradientId = `sp-${uniqueId}`;
  const glowFilterId = `gf-${uniqueId}`;
  const bigBloomFilterId = `bb-${uniqueId}`;
  const stoneNoiseFilterId = `fn-${uniqueId}`;
  const stoneDispFilterId = `dp-${uniqueId}`;
  const clipId = `cp-${uniqueId}`;

  const stoneRx = isStone ? 14 : 13;
  const stoneRy = isStone ? 17 : 13;
  const rimRx = isStone ? 15.5 : 14.5;
  const rimRy = isStone ? 18.5 : 14.5;
  const bloomRx = isStone ? 30 : 32;
  const bloomRy = isStone ? 28 : 32;
  const shadowCx = isStone ? 2 : 1.8;
  const shadowCy = isStone ? 21 : 16;
  const outerHaloRadius = isStone ? 23 : 22;
  const innerHaloRadius = 18.5;

  const outerCircumference = TAU * outerHaloRadius;
  const innerCircumference = TAU * innerHaloRadius;
  const viewBox = isStone ? '-32 -34 64 70' : '-32 -32 64 64';

  const easeViscous = (t: number) => {
    if (t <= 0) return 0;
    if (t >= 1) return 1;
    return t < 0.08 ? (t / 0.08) * (t / 0.08) * 0.08 : 0.08 + ((t - 0.08) / 0.92) * 0.92;
  };

  useEffect(() => {
    if (!svgRef.current) return;
    const state = animStateRef.current;
    let t0: number | null = null;

    const loop = (now: number) => {
      if (!svgRef.current) return;
      if (!t0) t0 = now;

      const raw = Math.min((now - t0) / 7000, 1);
      const fillProg = easeViscous(raw) * progress;
      state.fillProgress = fillProg;
      state.phase += 0.015;

      if (stageState.rotationActive) state.rotationPhase -= 0.02;

      // Pulse based on stage + completion
      const basePulse = fillProg >= 0.999
        ? 0.6 + 0.4 * Math.sin(state.phase)
        : 1.0 - stageState.pulseIntensity * 0.3 * (Math.sin(state.phase) - 0.5);

      const outerDrawn = outerCircumference * Math.min(fillProg, 1);
      const outerGap = Math.max(0, outerCircumference - outerDrawn);
      const innerDrawn = innerCircumference * Math.min(fillProg, 1);
      const innerGap = Math.max(0, innerCircumference - innerDrawn);

      const baseRotation = -90;
      const rotation = stageState.rotationActive ? baseRotation + state.rotationPhase : baseRotation;

      const outerEl = svgRef.current.querySelector('[data-halo="outer"]') as SVGCircleElement | null;
      if (outerEl) {
        const haloColor = `rgba(${expiredCoronaGlow.r},${expiredCoronaGlow.g},${expiredCoronaGlow.b},${(0.5 + 0.3 * fillProg) * pulse})`;
        outerEl.setAttribute('stroke', haloColor);
        outerEl.setAttribute('stroke-dasharray', `${outerDrawn.toFixed(2)} ${outerGap.toFixed(2)}`);
        outerEl.setAttribute('stroke-linecap', fillProg >= 0.999 ? 'butt' : 'round');
        outerEl.setAttribute('transform', `rotate(${rotation})`);
      }

      const innerEl = svgRef.current.querySelector('[data-halo="inner"]') as SVGCircleElement | null;
      if (innerEl) {
        const innerColor = `rgba(${expiredCoronaCore.r},${expiredCoronaCore.g},${expiredCoronaCore.b},${(0.45 + 0.25 * fillProg) * pulse})`;
        innerEl.setAttribute('stroke', innerColor);
        innerEl.setAttribute('stroke-dasharray', `${innerDrawn.toFixed(2)} ${innerGap.toFixed(2)}`);
        innerEl.setAttribute('stroke-linecap', fillProg >= 0.999 ? 'butt' : 'round');
        innerEl.setAttribute('transform', `rotate(${rotation})`);
      }

      requestAnimationFrame(loop);
    };

    const frameId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frameId);
  }, [progress, expiredCoronaCore, expiredCoronaGlow, stageState, outerCircumference, innerCircumference]);

  const haloColor = `rgba(${expiredCoronaGlow.r},${expiredCoronaGlow.g},${expiredCoronaGlow.b},0.5)`;
  const innerHaloColor = `rgba(${expiredCoronaCore.r},${expiredCoronaCore.g},${expiredCoronaCore.b},0.55)`;

  const hoverScale = isHovered && enableHover ? 1.05 : 1.0;

  return (
    <div className="flex flex-col items-center gap-3 select-none">
      <svg
        ref={svgRef}
        width={size}
        height={size}
        viewBox={viewBox}
        className="overflow-visible transition-all duration-300 ease-out cursor-pointer"
        style={{
          display: 'block',
          transform: `scale(${hoverScale})`,
          filter: isHovered && enableHover ? 'brightness(1.15)' : undefined,
        }}
        onMouseEnter={() => enableHover && setIsHovered(true)}
        onMouseLeave={() => enableHover && setIsHovered(false)}
      >
        <defs>
          <radialGradient id={stoneGradientId} cx="36%" cy="28%" r="72%">
            <stop offset="0%" stopColor={stoneColors[0]} />
            <stop offset="100%" stopColor={stoneColors[1]} />
          </radialGradient>

          <radialGradient id={stoneAmbientId} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={stoneAmbient} />
            <stop offset="100%" stopColor="rgba(0,0,0,0)" />
          </radialGradient>

          <linearGradient id={rimGradientId} x1="14%" y1="4%" x2="86%" y2="96%">
            <stop offset="0%" stopColor={rimColors[0]} />
            <stop offset="45%" stopColor={rimColors[1]} />
            <stop offset="100%" stopColor={rimColors[2]} />
          </linearGradient>

          <linearGradient id={rimHoverGradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="rgba(255,255,255,0)" />
            <stop offset="35%" stopColor="rgba(255,255,255,0)" />
            <stop offset="50%" stopColor="rgba(255,255,255,0.85)" />
            <stop offset="65%" stopColor="rgba(255,255,255,0)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0)" />
          </linearGradient>

          <radialGradient id={bloomGradientId} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={`rgb(${expiredCoronaGlow.r},${expiredCoronaGlow.g},${expiredCoronaGlow.b})`} stopOpacity={isStone ? 0.18 : 0.28} />
            <stop offset="55%" stopColor={`rgb(${expiredCoronaGlow.r},${expiredCoronaGlow.g},${expiredCoronaGlow.b})`} stopOpacity={0.06} />
            <stop offset="100%" stopColor={`rgb(${expiredCoronaGlow.r},${expiredCoronaGlow.g},${expiredCoronaGlow.b})`} stopOpacity={0} />
          </radialGradient>

          <radialGradient id={specularGradientId} cx="30%" cy="22%" r="54%">
            <stop offset="0%" stopColor="rgba(255,230,160,.12)" />
            <stop offset="100%" stopColor="rgba(255,220,140,0)" />
          </radialGradient>

          <filter id={glowFilterId} x="-80%" y="-80%" width="260%" height="260%">
            <feGaussianBlur stdDeviation="3.2" result="b" />
            <feComposite in="SourceGraphic" in2="b" operator="over" />
          </filter>

          <filter id={bigBloomFilterId} x="-120%" y="-120%" width="340%" height="340%">
            <feGaussianBlur stdDeviation="9" />
          </filter>

          <filter id={stoneNoiseFilterId} x="-5%" y="-5%" width="110%" height="110%">
            <feTurbulence type="fractalNoise" baseFrequency="0.55" numOctaves="4" seed={isStone ? 7 : 6} stitchTiles="stitch" result="n" />
            <feColorMatrix in="n" type="matrix" values="0 0 0 0 .055 0 0 0 0 .038 0 0 0 0 .018 0 0 0 .24 0" result="c" />
            <feBlend in="SourceGraphic" in2="c" mode="overlay" />
          </filter>

          <filter id={stoneDispFilterId} x="-12%" y="-10%" width="124%" height="120%">
            <feTurbulence type="turbulence" baseFrequency={isStone ? '0.038 0.028' : '0.030'} numOctaves="3" seed={isStone ? 7 : 15} result="t" />
            <feDisplacementMap in="SourceGraphic" in2="t" scale="3.8" xChannelSelector="R" yChannelSelector="G" />
          </filter>

          <clipPath id={clipId}>
            {isStone ? <ellipse cx="0" cy="0" rx={stoneRx} ry={stoneRy} /> : <circle cx="0" cy="0" r={stoneRx} />}
          </clipPath>
        </defs>

        <style>{`
          @keyframes poi-bloom-pulse { 0%,100%{opacity:${isStone ? 0.55 : 0.62}} 50%{opacity:${isStone ? 0.9 : 0.85}} }
          @keyframes poi-rim-breath { 0%,100%{opacity:0.85} 50%{opacity:0.65} }
          @keyframes poi-pin-flicker { 0%,100%{opacity:1} 4%{opacity:0.84} 4.8%{opacity:1} 30%{opacity:0.9} 31%{opacity:1} 62%{opacity:0.74} 63%{opacity:1} }
          [data-poi-bloom]{animation:poi-bloom-pulse 3.8s ease-in-out infinite;transform-origin:center}
          [data-poi-rim]{animation:poi-rim-breath 5s ease-in-out infinite}
          [data-poi-pin]{animation:poi-pin-flicker 4.3s steps(1,end) infinite}
        `}</style>

        {isStone ? (
          <ellipse cx="0" cy="0" rx={bloomRx} ry={bloomRy} fill={`url(#${bloomGradientId})`} filter={`url(#${bigBloomFilterId})`} data-poi-bloom />
        ) : (
          <circle cx="0" cy="0" r={bloomRx} fill={`url(#${bloomGradientId})`} filter={`url(#${bigBloomFilterId})`} data-poi-bloom />
        )}

        <ellipse cx={shadowCx} cy={shadowCy} rx="12" ry="3" fill="rgba(0,0,0,.60)" style={{ filter: isStone ? 'blur(3.5px)' : 'blur(3px)' }} />

        {isStone ? (
          <ellipse cx="0" cy="0" rx="23" ry="25" fill="none" stroke="rgba(192,160,60,.08)" strokeWidth="1.8" />
        ) : (
          <circle cx="0" cy="0" r="22" fill="none" stroke="rgba(192,160,60,.08)" strokeWidth="1.8" />
        )}

        <circle
          cx="0"
          cy="0"
          r={outerHaloRadius}
          fill="none"
          stroke={haloColor}
          strokeWidth="2"
          strokeLinecap="round"
          filter={`url(#${glowFilterId})`}
          opacity={0.68}
          data-halo="outer"
          transform="rotate(-90)"
        />

        <circle
          cx="0"
          cy="0"
          r={innerHaloRadius}
          fill="none"
          stroke={innerHaloColor}
          strokeWidth="1.6"
          strokeLinecap="round"
          filter={`url(#${glowFilterId})`}
          opacity={0.58}
          data-halo="inner"
          transform="rotate(-90)"
        />

        {showUrgentPulse && (
          <ellipse
            cx="0"
            cy="0"
            rx={isStone ? 18 : 17}
            ry={isStone ? 21 : 17}
            fill="none"
            stroke={`rgb(${expiredCoronaGlow.r},${expiredCoronaGlow.g},${expiredCoronaGlow.b})`}
            strokeWidth="1.2"
            opacity={1}
          >
            <animate attributeName="rx" values={`${isStone ? 18 : 17};${isStone ? 30 : 29};${isStone ? 18 : 17}`} dur="2.1s" repeatCount="indefinite" />
            <animate attributeName="ry" values={`${isStone ? 21 : 17};${isStone ? 34 : 29};${isStone ? 21 : 17}`} dur="2.1s" repeatCount="indefinite" />
            <animate attributeName="opacity" values=".48;0;.48" dur="2.1s" repeatCount="indefinite" />
          </ellipse>
        )}

        {isStone ? (
          <ellipse cx="0" cy="0" rx={rimRx} ry={rimRy} fill="none" stroke={`url(#${rimGradientId})`} strokeWidth="3.0" filter={`url(#${glowFilterId})`} opacity={0.85} data-poi-rim />
        ) : (
          <circle cx="0" cy="0" r={rimRx} fill="none" stroke={`url(#${rimGradientId})`} strokeWidth="3.0" filter={`url(#${glowFilterId})`} opacity={0.86} data-poi-rim />
        )}

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
          {isStone ? (
            <ellipse cx="0" cy="0" rx={rimRx} ry={rimRy} fill="none" stroke={`url(#${rimHoverGradientId})`} strokeWidth="3.0" />
          ) : (
            <circle cx="0" cy="0" r={rimRx} fill="none" stroke={`url(#${rimHoverGradientId})`} strokeWidth="3.0" />
          )}
        </g>

        {isStone ? (
          <ellipse cx="0" cy="0" rx={rimRx} ry={rimRy} fill="none" stroke="rgba(255,235,148,.34)" strokeWidth="0.8" strokeDasharray="20 100" strokeDashoffset="20" strokeLinecap="round" />
        ) : (
          <circle cx="0" cy="0" r={rimRx} fill="none" stroke="rgba(255,235,148,.32)" strokeWidth="0.8" strokeDasharray="22 71" strokeDashoffset="18" strokeLinecap="round" />
        )}

        {isStone ? (
          <>
            <ellipse cx="0" cy="0" rx={stoneRx} ry={stoneRy} fill={`url(#${stoneGradientId})`} filter={`url(#${stoneDispFilterId})`} opacity={0.95} />
            <ellipse cx="0" cy="0" rx={stoneRx} ry={stoneRy} fill={`url(#${stoneGradientId})`} filter={`url(#${stoneNoiseFilterId})`} opacity={0.55} />
          </>
        ) : (
          <>
            <circle cx="0" cy="0" r={stoneRx} fill={`url(#${stoneGradientId})`} filter={`url(#${stoneDispFilterId})`} opacity={0.95} />
            <circle cx="0" cy="0" r={stoneRx} fill={`url(#${stoneGradientId})`} filter={`url(#${stoneNoiseFilterId})`} opacity={0.52} />
          </>
        )}

        {isStone ? (
          <ellipse cx="0" cy="0" rx={stoneRx} ry={stoneRy} fill={`url(#${specularGradientId})`} />
        ) : (
          <circle cx="0" cy="0" r={stoneRx} fill={`url(#${specularGradientId})`} />
        )}

        {isStone ? (
          <ellipse cx="0" cy="0" rx={stoneRx + 0.8} ry={stoneRy + 0.8} fill={`url(#${stoneAmbientId})`} />
        ) : (
          <circle cx="0" cy="0" r={stoneRx + 0.8} fill={`url(#${stoneAmbientId})`} />
        )}

        <g data-poi-pin>
          <PoiIcon icon={icon} color={completedPinColor} clipPathId={clipId} />
        </g>

        {isStone ? (
          <>
            <ellipse cx="0" cy="0" rx={stoneRx} ry={stoneRy} fill="none" stroke="rgba(0,0,0,.55)" strokeWidth="1.8" transform="translate(.3,.4)" />
            <ellipse cx="0" cy="0" rx={stoneRx - 0.4} ry={stoneRy - 0.4} fill="none" stroke="rgba(255,222,130,.12)" strokeWidth="0.6" />
          </>
        ) : (
          <>
            <circle cx="0" cy="0" r={stoneRx} fill="none" stroke="rgba(0,0,0,.55)" strokeWidth="1.8" transform="translate(.3,.4)" />
            <circle cx="0" cy="0" r={stoneRx - 0.4} fill="none" stroke="rgba(255,222,130,.12)" strokeWidth="0.6" />
          </>
        )}
      </svg>

      {label && (
        <div
          className="font-serif uppercase whitespace-nowrap pointer-events-none"
          style={{
            fontFamily: "'Cinzel', 'Trajan Pro', serif",
            fontSize: '6px',
            letterSpacing: '0.28em',
            color: 'rgba(210,178,90,.70)',
            textShadow: '0 1px 6px rgba(0,0,0,.95)',
            marginTop: '10px',
          }}
        >
          {label}
        </div>
      )}

      {showRiskBadges && (injuryRisk !== undefined || deathRisk !== undefined || dangerRating !== undefined) && (
        <div className="flex flex-wrap items-center justify-center gap-1.5 mt-2">
          {injuryRisk !== undefined && (
            <div className="flex items-center px-2.5 py-1 text-[10px] font-semibold tracking-wider uppercase rounded border select-none" style={{ background: 'linear-gradient(135deg, #15110f 0%, #0c0908 100%)', border: '1px solid rgba(192, 140, 34, 0.35)', color: 'rgba(230, 220, 200, 0.95)', boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.08), 0 2px 4px rgba(0,0,0,0.8)' }} title={t('idleVillage:poiDetail.risk.injury.title')}>
              <svg width="10" height="12" viewBox="0 0 24 24" fill="none" className="mr-1.5 shrink-0">
                <path d="M12 3C12 3 6 11 6 15C6 18.3 8.7 21 12 21C15.3 21 18 18.3 18 15C18 11 12 3 12 3Z" fill="#ef4444" stroke="#7f1d1d" strokeWidth="1" />
              </svg>
              <span>{t('idleVillage:poiDetail.risk.injury.label', { defaultValue: 'INJURY: {risk}%', risk: injuryRisk })}</span>
            </div>
          )}
          {deathRisk !== undefined && (
            <div className="flex items-center px-2.5 py-1 text-[10px] font-semibold tracking-wider uppercase rounded border select-none" style={{ background: 'linear-gradient(135deg, #15110f 0%, #0c0908 100%)', border: '1px solid rgba(192, 140, 34, 0.35)', color: 'rgba(230, 220, 200, 0.95)', boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.08), 0 2px 4px rgba(0,0,0,0.8)' }} title={t('idleVillage:poiDetail.risk.death.title')}>
              <svg width="11" height="12" viewBox="0 0 24 24" fill="none" className="mr-1.5 shrink-0">
                <path d="M12 2C7.58 2 4 5.58 4 10C4 12.87 5.5 15.38 7.75 16.78L7 21L10 20L12 22L14 20L17 21L16.25 16.78C18.5 15.38 20 12.87 20 10C20 5.58 16.42 2 12 2ZM9 9C9.55 9 10 9.45 10 10C10 10.55 9.55 11 9 11C8.45 11 8 10.55 8 10C8 9.45 8.45 9 9 9ZM15 9C15.55 9 16 9.45 16 10C16 10.55 15.55 11 15 11C14.45 11 14 10.55 14 10C14 9.45 14.45 9 15 9Z" fill="#ffd700" stroke="#8b6508" strokeWidth="1" />
              </svg>
              <span>{t('idleVillage:poiDetail.risk.death.label', { defaultValue: 'DEATH: {risk}%', risk: deathRisk })}</span>
            </div>
          )}
          {dangerRating !== undefined && (
            <div className="flex items-center px-2.5 py-1 text-[10px] font-semibold tracking-wider uppercase rounded border select-none" style={{ background: 'linear-gradient(135deg, #15110f 0%, #0c0908 100%)', border: '1px solid rgba(192, 140, 34, 0.35)', color: 'rgba(230, 220, 200, 0.95)', boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.08), 0 2px 4px rgba(0,0,0,0.8)' }} title={t('idleVillage:poiDetail.risk.danger.title')}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" className="mr-1.5 shrink-0">
                <path d="M12 2L2 22H22L12 2ZM12 18C11.45 18 11 17.55 11 17C11 16.45 11.45 16 12 16C12.55 16 13 16.45 13 17C13 17.55 12.55 18 12 18ZM11 14V10C11 9.45 11.45 9 12 9C12.55 9 13 9.45 13 10V14C13 14.55 12.55 15 12 15C12.45 15 11 14.55 11 14Z" fill="#f97316" stroke="#7c2d12" strokeWidth="1" />
              </svg>
              <span>{t('idleVillage:poiDetail.risk.danger.label', { defaultValue: 'DANGER: {rating}', rating: dangerRating })}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
