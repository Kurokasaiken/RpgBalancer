import type { JSX } from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';

export interface HaloCoronaProps {
  timeRemainingMs?: number;
  totalDurationMs?: number;
  coronaCore?: { r: number; g: number; b: number };
  coronaGlow?: { r: number; g: number; b: number };
  baseColor?: string;
  alertColor?: string;
  criticalColor?: string;
  size?: number;
  showDebug?: boolean;
}

const TAU = Math.PI * 2;

// Palettes for states
const PALETTE_QUEST = {
  base: { r: 218, g: 165, b: 32 }, // Ambra
  alert: { r: 240, g: 180, b: 40 },
  critical: { r: 255, g: 100, b: 20 },
  glow: { r: 255, g: 200, b: 80 },
};

const PALETTE_EVENT = {
  base: { r: 200, g: 70, b: 80 }, // Brace (rosso-marrone urgente)
  alert: { r: 220, g: 80, b: 90 },
  critical: { r: 255, g: 50, b: 60 },
  glow: { r: 240, g: 120, b: 100 },
};

const PALETTE_JOB = {
  base: { r: 100, g: 150, b: 80 }, // Verderame
  alert: { r: 130, g: 170, b: 100 },
  critical: { r: 255, g: 100, b: 20 },
  glow: { r: 150, g: 180, b: 120 },
};

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

function colorToRgba(color: { r: number; g: number; b: number }, alpha: number): string {
  return `rgba(${color.r},${color.g},${color.b},${Math.min(1, Math.max(0, alpha))})`;
}

export function HaloCorona({
  timeRemainingMs,
  totalDurationMs = 60000,
  size = 120,
  showDebug = false,
}: HaloCoronaProps): JSX.Element {
  const svgRef = useRef<SVGSVGElement>(null);
  const animStateRef = useRef({ phase: 0, rotationPhase: 0, fillProgress: 0, lastStageTransition: 0 });
  const [debugInfo, setDebugInfo] = useState<{ fraction: string; stage: string; pulse: string }>({
    fraction: '0%',
    stage: 'calm',
    pulse: '1.0',
  });

  const remainingFraction = useMemo(() => {
    if (timeRemainingMs === undefined) return 1;
    return Math.max(0, Math.min(timeRemainingMs / totalDurationMs, 1));
  }, [timeRemainingMs, totalDurationMs]);

  const currentStage = useMemo(() => getExpiryStage(remainingFraction), [remainingFraction]);

  // Palette selection (quest for demo)
  const palette = PALETTE_QUEST;

  // Color based on stage
  const stageColors = useMemo(() => {
    const base = palette.base;
    const alert = palette.alert;
    const critical = palette.critical;

    if (currentStage === 'calm') {
      return { fill: base, glow: palette.glow, pulseIntensity: 0.2 };
    }

    const alertProgress = currentStage === 'alert' ? (0.5 - remainingFraction) / 0.35 : 1;
    const fillColor = lerpColor(alert, critical, Math.min(alertProgress, 1));

    if (currentStage === 'alert') {
      return {
        fill: fillColor,
        glow: lerpColor(palette.glow, critical, alertProgress * 0.5),
        pulseIntensity: 0.4 + 0.2 * alertProgress,
      };
    }

    return {
      fill: critical,
      glow: critical,
      pulseIntensity: 0.8,
    };
  }, [currentStage, remainingFraction]);

  const outerHaloRadius = 18;
  const innerHaloRadius = 14;
  const outerCircumference = TAU * outerHaloRadius;
  const innerCircumference = TAU * innerHaloRadius;

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

      // Antiorario per countdown
      if (currentStage !== 'calm') {
        state.rotationPhase -= 0.02;
      }

      // Pulse basato sullo stadio
      const pulse = Math.max(1 - stageColors.pulseIntensity * 0.3, 0.7 + stageColors.pulseIntensity * 0.3 * Math.sin(state.phase));

      const outerDrawn = outerCircumference * Math.min(fillProg, 1);
      const outerGap = Math.max(0, outerCircumference - outerDrawn);
      const innerDrawn = innerCircumference * Math.min(fillProg, 1);
      const innerGap = Math.max(0, innerCircumference - innerDrawn);

      const baseRotation = -90;
      const rotation = currentStage !== 'calm' ? baseRotation + state.rotationPhase : baseRotation;

      const outerEl = svgRef.current.querySelector('[data-halo="outer"]') as SVGCircleElement | null;
      if (outerEl) {
        const haloColor = colorToRgba(stageColors.glow, (0.5 + 0.3 * fillProg) * pulse);
        outerEl.setAttribute('stroke', haloColor);
        outerEl.setAttribute('stroke-dasharray', `${outerDrawn.toFixed(2)} ${outerGap.toFixed(2)}`);
        outerEl.setAttribute('stroke-linecap', fillProg >= 0.999 ? 'butt' : 'round');
        outerEl.setAttribute('transform', `rotate(${rotation})`);
      }

      const innerEl = svgRef.current.querySelector('[data-halo="inner"]') as SVGCircleElement | null;
      if (innerEl) {
        const innerColor = colorToRgba(stageColors.fill, (0.45 + 0.25 * fillProg) * pulse);
        innerEl.setAttribute('stroke', innerColor);
        innerEl.setAttribute('stroke-dasharray', `${innerDrawn.toFixed(2)} ${innerGap.toFixed(2)}`);
        innerEl.setAttribute('stroke-linecap', fillProg >= 0.999 ? 'butt' : 'round');
        innerEl.setAttribute('transform', `rotate(${rotation})`);
      }

      if (showDebug) {
        setDebugInfo({
          fraction: `${(remainingFraction * 100).toFixed(1)}%`,
          stage: currentStage,
          pulse: pulse.toFixed(2),
        });
      }

      requestAnimationFrame(loop);
    };

    const frameId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frameId);
  }, [remainingFraction, currentStage, stageColors, showDebug]);

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
          <filter id="glow" x="-80%" y="-80%" width="260%" height="260%">
            <feGaussianBlur stdDeviation="3.2" result="b" />
            <feComposite in="SourceGraphic" in2="b" operator="over" />
          </filter>
        </defs>

        {/* Background circle (stone) */}
        <circle cx="0" cy="0" r="13" fill="rgba(120,100,80,0.8)" opacity={0.95} />

        {/* Rim / framing */}
        <circle
          cx="0"
          cy="0"
          r="14.5"
          fill="none"
          stroke={colorToRgba(stageColors.fill, 0.6)}
          strokeWidth="2.4"
          filter="url(#glow)"
          opacity={0.8}
        />

        {/* Outer halo (glow) */}
        <circle
          cx="0"
          cy="0"
          r={outerHaloRadius}
          fill="none"
          stroke={colorToRgba(stageColors.glow, 0.5)}
          strokeWidth="1.8"
          strokeLinecap="round"
          filter="url(#glow)"
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
          stroke={colorToRgba(stageColors.fill, 0.45)}
          strokeWidth="1.4"
          strokeLinecap="round"
          filter="url(#glow)"
          opacity={0.58}
          data-halo="inner"
          transform="rotate(-90)"
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
          <div>Pulse: <span className="text-amber-300">{debugInfo.pulse}</span></div>
        </div>
      )}
    </div>
  );
}
