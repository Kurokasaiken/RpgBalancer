import type { JSX } from 'react';
import { useEffect, useId, useMemo, useRef } from 'react';

export interface ClockPoiSkinProps {
  isDayPhase: boolean;
  cycleProgress: number; // 0-1: progress through current phase
  isPaused: boolean;
  size?: number;
  enableHover?: boolean;
}

const TAU = Math.PI * 2;

export function ClockPoiSkin({
  isDayPhase,
  cycleProgress,
  isPaused,
  size = 120,
  enableHover = false,
}: ClockPoiSkinProps): JSX.Element {
  const uniqueId = useId().replace(/:/g, '');
  const svgRef = useRef<SVGSVGElement>(null);
  const animStateRef = useRef({ phase: 0, fillProgress: 0 });

  const isStone = false; // Clock is always circle
  const stoneRx = 13;
  const rimRx = 14.5;
  const bloomRx = 32;
  const shadowCx = 1.8;
  const shadowCy = 16;
  const outerHaloRadius = 22;
  const innerHaloRadius = 18.5;

  const outerCircumference = TAU * outerHaloRadius;
  const innerCircumference = TAU * innerHaloRadius;
  const viewBox = '-32 -32 64 64';

  // Clock colors (day/night based, no expiry escalation)
  const dayCoronaCore = { r: 255, g: 215, b: 110 }; // Warm gold for day
  const dayCoronaGlow = { r: 255, g: 230, b: 150 };
  const nightCoronaCore = { r: 100, g: 150, b: 220 }; // Cool blue for night
  const nightCoronaGlow = { r: 150, g: 190, b: 255 };

  const coronaCore = isDayPhase ? dayCoronaCore : nightCoronaCore;
  const coronaGlow = isDayPhase ? dayCoronaGlow : nightCoronaGlow;

  // Progress arc (shows cycle progress, no expiry escalation)
  const fillProgress = useMemo(() => {
    if (cycleProgress === undefined) return 0;
    return Math.max(0, Math.min(cycleProgress, 1));
  }, [cycleProgress]);

  // No rotation for clock (unlike expiry timer), just fill
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
      const fill = easeViscous(raw) * fillProgress;
      state.fillProgress = fill;
      state.phase += 0.015;

      // Pulse when paused
      const pulse = isPaused ? 0.7 + 0.3 * Math.sin(state.phase) : 1.0;

      const outerDrawn = outerCircumference * Math.min(fill, 1);
      const outerGap = Math.max(0, outerCircumference - outerDrawn);
      const innerDrawn = innerCircumference * Math.min(fill, 1);
      const innerGap = Math.max(0, innerCircumference - innerDrawn);

      const baseRotation = -90; // Start from top

      const outerEl = svgRef.current.querySelector('[data-halo="outer"]') as SVGCircleElement | null;
      if (outerEl) {
        const haloColor = `rgba(${coronaGlow.r},${coronaGlow.g},${coronaGlow.b},${(0.5 + 0.3 * fill) * pulse})`;
        outerEl.setAttribute('stroke', haloColor);
        outerEl.setAttribute('stroke-dasharray', `${outerDrawn.toFixed(2)} ${outerGap.toFixed(2)}`);
        outerEl.setAttribute('stroke-linecap', fill >= 0.999 ? 'butt' : 'round');
        outerEl.setAttribute('transform', `rotate(${baseRotation})`);
      }

      const innerEl = svgRef.current.querySelector('[data-halo="inner"]') as SVGCircleElement | null;
      if (innerEl) {
        const innerColor = `rgba(${coronaCore.r},${coronaCore.g},${coronaCore.b},${(0.45 + 0.25 * fill) * pulse})`;
        innerEl.setAttribute('stroke', innerColor);
        innerEl.setAttribute('stroke-dasharray', `${innerDrawn.toFixed(2)} ${innerGap.toFixed(2)}`);
        innerEl.setAttribute('stroke-linecap', fill >= 0.999 ? 'butt' : 'round');
        innerEl.setAttribute('transform', `rotate(${baseRotation})`);
      }

      requestAnimationFrame(loop);
    };

    const frameId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frameId);
  }, [fillProgress, isPaused, coronaCore, coronaGlow, outerCircumference, innerCircumference]);

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
        }}
      >
        <defs>
          <radialGradient id={stoneGradientId} cx="36%" cy="28%" r="72%">
            <stop offset="0%" stopColor="rgba(180,150,100,1)" />
            <stop offset="100%" stopColor="rgba(100,80,60,1)" />
          </radialGradient>

          <radialGradient id={stoneAmbientId} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(40,30,20,.6)" />
            <stop offset="100%" stopColor="rgba(0,0,0,0)" />
          </radialGradient>

          <linearGradient id={rimGradientId} x1="14%" y1="4%" x2="86%" y2="96%">
            <stop offset="0%" stopColor={`rgb(${coronaCore.r},${coronaCore.g},${coronaCore.b})`} />
            <stop offset="45%" stopColor={`rgb(${Math.round(coronaCore.r * 0.8)},${Math.round(coronaCore.g * 0.8)},${Math.round(coronaCore.b * 0.8)})`} />
            <stop offset="100%" stopColor="rgba(100,80,60,1)" />
          </linearGradient>

          <linearGradient id={rimHoverGradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="rgba(255,255,255,0)" />
            <stop offset="35%" stopColor="rgba(255,255,255,0)" />
            <stop offset="50%" stopColor="rgba(255,255,255,0.85)" />
            <stop offset="65%" stopColor="rgba(255,255,255,0)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0)" />
          </linearGradient>

          <radialGradient id={bloomGradientId} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={`rgb(${coronaGlow.r},${coronaGlow.g},${coronaGlow.b})`} stopOpacity={0.28} />
            <stop offset="55%" stopColor={`rgb(${coronaGlow.r},${coronaGlow.g},${coronaGlow.b})`} stopOpacity={0.06} />
            <stop offset="100%" stopColor={`rgb(${coronaGlow.r},${coronaGlow.g},${coronaGlow.b})`} stopOpacity={0} />
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
            <feTurbulence type="fractalNoise" baseFrequency="0.55" numOctaves="4" seed="6" stitchTiles="stitch" result="n" />
            <feColorMatrix in="n" type="matrix" values="0 0 0 0 .055 0 0 0 0 .038 0 0 0 0 .018 0 0 0 .24 0" result="c" />
            <feBlend in="SourceGraphic" in2="c" mode="overlay" />
          </filter>

          <filter id={stoneDispFilterId} x="-12%" y="-10%" width="124%" height="120%">
            <feTurbulence type="turbulence" baseFrequency="0.030" numOctaves="3" seed="15" result="t" />
            <feDisplacementMap in="SourceGraphic" in2="t" scale="3.8" xChannelSelector="R" yChannelSelector="G" />
          </filter>

          <clipPath id={clipId}>
            <circle cx="0" cy="0" r={stoneRx} />
          </clipPath>
        </defs>

        <style>{`
          @keyframes clock-bloom-pulse { 0%,100%{opacity:0.62} 50%{opacity:0.85} }
          @keyframes clock-rim-breath { 0%,100%{opacity:0.85} 50%{opacity:0.65} }
          [data-clock-bloom]{animation:clock-bloom-pulse 3.8s ease-in-out infinite;transform-origin:center}
          [data-clock-rim]{animation:clock-rim-breath 5s ease-in-out infinite}
        `}</style>

        {/* Bloom layer */}
        <circle cx="0" cy="0" r={bloomRx} fill={`url(#${bloomGradientId})`} filter={`url(#${bigBloomFilterId})`} data-clock-bloom />

        {/* Shadow */}
        <ellipse cx={shadowCx} cy={shadowCy} rx="12" ry="3" fill="rgba(0,0,0,.60)" style={{ filter: 'blur(3px)' }} />

        {/* Outer guide ring */}
        <circle cx="0" cy="0" r="22" fill="none" stroke="rgba(192,160,60,.08)" strokeWidth="1.8" />

        {/* Outer halo (glow) */}
        <circle
          cx="0"
          cy="0"
          r={outerHaloRadius}
          fill="none"
          stroke={`rgba(${coronaGlow.r},${coronaGlow.g},${coronaGlow.b},0.5)`}
          strokeWidth="2"
          strokeLinecap="round"
          filter={`url(#${glowFilterId})`}
          opacity={0.68}
          data-halo="outer"
          transform="rotate(-90)"
        />

        {/* Inner halo (core) */}
        <circle
          cx="0"
          cy="0"
          r={innerHaloRadius}
          fill="none"
          stroke={`rgba(${coronaCore.r},${coronaCore.g},${coronaCore.b},0.45)`}
          strokeWidth="1.6"
          strokeLinecap="round"
          filter={`url(#${glowFilterId})`}
          opacity={0.58}
          data-halo="inner"
          transform="rotate(-90)"
        />

        {/* Rim */}
        <circle cx="0" cy="0" r={rimRx} fill="none" stroke={`url(#${rimGradientId})`} strokeWidth="3.0" filter={`url(#${glowFilterId})`} opacity={0.86} data-clock-rim />

        {/* Hover shimmer */}
        <g
          style={{
            opacity: enableHover ? 0 : 0,
            mixBlendMode: 'color-dodge',
            transition: 'opacity 0.3s ease-in-out, transform 0.8s ease-out',
            transform: 'rotate(0deg)',
            transformOrigin: '0px 0px',
            pointerEvents: 'none',
          }}
        >
          <circle cx="0" cy="0" r={rimRx} fill="none" stroke={`url(#${rimHoverGradientId})`} strokeWidth="3.0" />
        </g>

        {/* Deco line (menisco) */}
        <circle cx="0" cy="0" r={rimRx} fill="none" stroke="rgba(255,235,148,.32)" strokeWidth="0.8" strokeDasharray="22 71" strokeDashoffset="18" strokeLinecap="round" />

        {/* Core stone */}
        <circle cx="0" cy="0" r={stoneRx} fill={`url(#${stoneGradientId})`} filter={`url(#${stoneDispFilterId})`} opacity={0.95} />
        <circle cx="0" cy="0" r={stoneRx} fill={`url(#${stoneGradientId})`} filter={`url(#${stoneNoiseFilterId})`} opacity={0.52} />

        {/* Specular highlight */}
        <circle cx="0" cy="0" r={stoneRx} fill={`url(#${specularGradientId})`} />

        {/* Ambient */}
        <circle cx="0" cy="0" r={stoneRx + 0.8} fill={`url(#${stoneAmbientId})`} />

        {/* Phase icon (sun/moon) */}
        <g data-poi-pin>
          {isDayPhase ? (
            <circle cx="0" cy="0" r="4.5" fill={`rgba(${coronaCore.r},${coronaCore.g},${coronaCore.b},0.9)`} />
          ) : (
            <circle cx="0" cy="0" r="4.5" fill={`rgba(${coronaCore.r},${coronaCore.g},${coronaCore.b},0.9)`} />
          )}
        </g>

        {/* Border */}
        <circle cx="0" cy="0" r={stoneRx} fill="none" stroke="rgba(0,0,0,.55)" strokeWidth="1.8" transform="translate(.3,.4)" />
        <circle cx="0" cy="0" r={stoneRx - 0.4} fill="none" stroke="rgba(255,222,130,.12)" strokeWidth="0.6" />
      </svg>
    </div>
  );
}
