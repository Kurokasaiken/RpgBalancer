import type { JSX } from 'react';
import { useId, useEffect, useMemo, useRef, useState } from 'react';

export interface HaloCoronaProps {
  timeRemainingMs?: number;
  totalDurationMs?: number;
  size?: number;
  showDebug?: boolean;
}

const TAU = Math.PI * 2;

type ExpiryStage = 'calm' | 'alert' | 'critical';

function getExpiryStage(remainingFraction: number): ExpiryStage {
  if (remainingFraction > 0.5) return 'calm';
  if (remainingFraction > 0.15) return 'alert';
  return 'critical';
}

function lerpColor(
  from: { r: number; g: number; b: number },
  to: { r: number; g: number; b: number },
  t: number
) {
  const clamp = (v: number) => Math.min(255, Math.max(0, v));
  return {
    r: clamp(Math.round(from.r + (to.r - from.r) * t)),
    g: clamp(Math.round(from.g + (to.g - from.g) * t)),
    b: clamp(Math.round(from.b + (to.b - from.b) * t)),
  };
}

const PALETTE_QUEST = {
  base: { r: 218, g: 165, b: 32 },
  alert: { r: 240, g: 180, b: 40 },
  critical: { r: 255, g: 100, b: 20 },
};

export function HaloCorona({
  timeRemainingMs,
  totalDurationMs = 60000,
  size = 120,
  showDebug = false,
}: HaloCoronaProps): JSX.Element {
  const uniqueId = useId().replace(/:/g, '');
  const svgRef = useRef<SVGSVGElement>(null);
  const animStateRef = useRef({ phase: 0, rotationPhase: 0, fillProgress: 0 });
  const [debugInfo, setDebugInfo] = useState<{ fraction: string; stage: string }>({
    fraction: '0%',
    stage: 'calm',
  });

  const remainingFraction = useMemo(() => {
    if (timeRemainingMs === undefined) return 1;
    return Math.max(0, Math.min(timeRemainingMs / totalDurationMs, 1));
  }, [timeRemainingMs, totalDurationMs]);

  const currentStage = useMemo(() => getExpiryStage(remainingFraction), [remainingFraction]);

  // Single thick halo with 3-stage color escalation
  const haloColor = useMemo(() => {
    const alertColor = { r: 240, g: 180, b: 40 };
    const criticalColor = { r: 255, g: 100, b: 20 };

    if (currentStage === 'calm') {
      return PALETTE_QUEST.base;
    }

    const alertProgress = currentStage === 'alert' ? (0.5 - remainingFraction) / 0.35 : 1;
    return lerpColor(alertColor, criticalColor, Math.min(alertProgress, 1));
  }, [currentStage, remainingFraction]);

  const haloRadius = 20;
  const haloCircumference = TAU * haloRadius;

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
      const fillProg = easeViscous(raw) * remainingFraction;
      state.fillProgress = fillProg;
      state.phase += 0.015;

      // Rotate antiorario on alert/critical
      if (currentStage !== 'calm') {
        state.rotationPhase -= 0.02;
      }

      // Pulse intensity scales with urgency
      const pulseIntensity = currentStage === 'calm' ? 0.2 : currentStage === 'alert' ? 0.4 : 0.8;
      const pulse = Math.max(0.7, 1.0 - pulseIntensity * 0.3 * (Math.sin(state.phase) - 0.5));

      const drawn = haloCircumference * Math.min(fillProg, 1);
      const gap = Math.max(0, haloCircumference - drawn);

      const baseRotation = -90;
      const rotation = currentStage !== 'calm' ? baseRotation + state.rotationPhase : baseRotation;

      const haloEl = svgRef.current.querySelector(`[data-halo="${uniqueId}"]`) as SVGCircleElement | null;
      if (haloEl) {
        const opacity = (0.5 + 0.4 * fillProg) * pulse;
        haloEl.setAttribute('stroke', `rgba(${haloColor.r},${haloColor.g},${haloColor.b},${opacity.toFixed(3)})`);
        haloEl.setAttribute('stroke-dasharray', `${drawn.toFixed(2)} ${gap.toFixed(2)}`);
        haloEl.setAttribute('stroke-linecap', fillProg >= 0.999 ? 'butt' : 'round');
        haloEl.setAttribute('transform', `rotate(${rotation})`);
      }

      if (showDebug) {
        setDebugInfo({
          fraction: `${(remainingFraction * 100).toFixed(1)}%`,
          stage: currentStage,
        });
      }

      requestAnimationFrame(loop);
    };

    const frameId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frameId);
  }, [remainingFraction, currentStage, haloColor, uniqueId, haloCircumference, showDebug]);

  const turbFilterId = `turb-${uniqueId}`;
  const glowFilterId = `glow-${uniqueId}`;

  return (
    <div className="flex flex-col items-center gap-4">
      <svg
        ref={svgRef}
        width={size}
        height={size}
        viewBox="-32 -32 64 64"
        className="overflow-visible"
        style={{ display: 'block' }}
      >
        <defs>
          {/* Turbulence filter for organic halo appearance */}
          <filter id={turbFilterId} x="-15%" y="-15%" width="130%" height="130%">
            <feTurbulence type="turbulence" baseFrequency="0.008 0.04" numOctaves="3" result="t">
              <animate attributeName="seed" values="9;10;11;12;9" dur="7.3s" repeatCount="indefinite" />
              <animate attributeName="baseFrequency" values="0.008 0.04;0.010 0.038;0.008 0.042;0.009 0.04;0.008 0.04" dur="11.7s" repeatCount="indefinite" />
            </feTurbulence>
            <feDisplacementMap in="SourceGraphic" in2="t" scale="2.8" xChannelSelector="R" yChannelSelector="G" />
          </filter>

          <filter id={glowFilterId} x="-80%" y="-80%" width="260%" height="260%">
            <feGaussianBlur stdDeviation="2.0" result="b" />
            <feComposite in="SourceGraphic" in2="b" operator="over" />
          </filter>
        </defs>

        {/* Stone core */}
        <circle cx="0" cy="0" r="13" fill="rgba(120,100,80,0.85)" opacity={0.92} />

        {/* Single thick halo — spesso e bello con turbulenza */}
        <circle
          cx="0"
          cy="0"
          r={haloRadius}
          fill="none"
          stroke={`rgba(${haloColor.r},${haloColor.g},${haloColor.b},0.6)`}
          strokeWidth="4.2"
          strokeLinecap="round"
          filter={`url(#${turbFilterId})`}
          opacity={0.78}
          data-halo={uniqueId}
          transform="rotate(-90)"
        />

        {/* Rim with imperfections */}
        <circle
          cx="0"
          cy="0"
          r="14.5"
          fill="none"
          stroke={`rgba(${haloColor.r},${haloColor.g},${haloColor.b},0.48)`}
          strokeWidth="2.2"
          filter={`url(#${glowFilterId})`}
          opacity={0.72}
        />

        {/* Icon placeholder */}
        <text x="0" y="2" textAnchor="middle" dominantBaseline="central" fontSize="16" fill="rgba(255,200,100,0.9)">
          ⚔
        </text>
      </svg>

      {showDebug && (
        <div className="flex flex-col gap-1 text-[11px] font-mono text-amber-100 bg-slate-900 px-3 py-2 rounded border border-amber-800/50">
          <div>Stage: <span className="text-amber-300">{debugInfo.stage}</span></div>
          <div>Remaining: <span className="text-amber-300">{debugInfo.fraction}</span></div>
        </div>
      )}
    </div>
  );
}
