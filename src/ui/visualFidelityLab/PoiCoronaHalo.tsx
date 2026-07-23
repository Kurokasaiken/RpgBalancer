import React, { useEffect, useId, useMemo, useRef, useState } from 'react';
import type { PoiPalette } from './poiMedallionRecipe';
import { POI_SKINS } from './poiMedallionRecipe';

/**
 * PoiCoronaHalo — prototype halo for the shared POI/Clock medallion (2026-07-19).
 *
 * Target = ~/Downloads/poi-skin-preview.html, approved by the user, adapted per
 * the AAA critique + follow-up decisions:
 *  - REMOVED: the 12 tick marks + 4 cardinal dots ("stanghette") and the two
 *    plain blurred rings from GenericPoiSkin. The corona itself IS the read.
 *  - KEPT: the rim-breath opacity animation and the hover sweep (color-dodge
 *    gradient rotation) — "the interesting existing ring animation".
 *  - ADDED (AAA critique #1): a bright MENISCUS at the fill-front — the read
 *    cue every meter needs (CarvedBar law, same reasoning).
 *  - ADDED (AAA critique #1): a COLD dark channel/track under the corona, so
 *    the warm energy stacks out by temperature+value (same law as CarvedBar).
 *  - ADDED (AAA critique, proportional milestones): the 3-stage timed machine
 *    is driven by remainingFraction (0..1), NOT absolute ms.
 *  - ADDED: a GENERIC `onExpire` callback — the component does not decide
 *    what happens at zero (disappear vs trigger an event both exist in this
 *    game); the caller wires the behaviour.
 *  - GATED (AAA critique #2, GPU cost): the two turbulence filters only
 *    animate at perf-tier 'high'/'medium' + no prefers-reduced-motion, UNLESS
 *    the medallion is hovered/selected (context-aware detail, per research).
 *  - Particles: lightweight, CSS-only (no per-frame JS), max 5, fixed seeded
 *    angles per instance (Stable Procedural Identity — never re-rolled).
 *
 * THIS IS A LAB PROTOTYPE. Geometry/defs are deliberately close to
 * GenericPoiSkin's existing conventions so a future transplant is a like-for-
 * like swap, not a rewrite.
 */

export type PoiHaloMode = 'fill' | 'timed' | 'ready';
export type PoiHaloStage = 'calm' | 'alert' | 'critical';

export interface PoiCoronaHaloProps {
  palette?: PoiPalette;
  size?: number;
  icon?: string;
  mode: PoiHaloMode;
  /** 0–1, used when mode === 'fill'. */
  progress?: number;
  /** 0–1 (1 = full time left, 0 = expired), used when mode === 'timed'. */
  remainingFraction?: number;
  /** Fired exactly once, the frame remainingFraction reaches 0. Caller decides
   *  the outcome (unmount/"implode" vs dispatch a game event/"detonate") —
   *  this component owns rendering only, never gameplay behaviour. */
  onExpire?: () => void;
  /** Fired exactly once per stage transition (calm→alert→critical). */
  onStageChange?: (stage: PoiHaloStage) => void;
  className?: string;
}

const STONE_R = 14;
const RIM_R = 19;
const RIM_SW = 2.8;
const TRACK_R = 28;
const TRACK_SW = 5;
const TAU = Math.PI * 2;
const CIRC = TAU * TRACK_R;

/** Proportional milestones (AAA critique: NOT absolute ms). */
const ALERT_AT = 0.5;
const CRITICAL_AT = 0.15;

function stageFor(remainingFraction: number): PoiHaloStage {
  if (remainingFraction <= CRITICAL_AT) return 'critical';
  if (remainingFraction <= ALERT_AT) return 'alert';
  return 'calm';
}

/** Blend a palette's corona colour toward the "danger" ember as urgency rises. */
function escalateColor(
  base: { r: number; g: number; b: number },
  stage: PoiHaloStage
): { r: number; g: number; b: number } {
  const ember = POI_SKINS.ember.coronaCore;
  const t = stage === 'critical' ? 0.85 : stage === 'alert' ? 0.4 : 0;
  return {
    r: Math.round(base.r + (ember.r - base.r) * t),
    g: Math.round(base.g + (ember.g - base.g) * t),
    b: Math.round(base.b + (ember.b - base.b) * t),
  };
}

function usePerfGate(isHovered: boolean) {
  const [allowFull, setAllowFull] = useState(true);
  useEffect(() => {
    const tier = document.documentElement.dataset.perfTier;
    const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    setAllowFull(tier !== 'low' && !reducedMotion);
  }, []);
  // Context-aware: always full detail when the player is actually looking at it.
  return allowFull || isHovered;
}

export const PoiCoronaHalo: React.FC<PoiCoronaHaloProps> = ({
  palette = POI_SKINS.amber,
  size = 80,
  icon = '⚔',
  mode,
  progress = 0,
  remainingFraction = 1,
  onExpire,
  onStageChange,
  className,
}) => {
  const uid = useId().replace(/:/g, '');
  const [isHovered, setIsHovered] = useState(false);
  const allowFullDetail = usePerfGate(isHovered);

  const stage = mode === 'timed' ? stageFor(remainingFraction) : 'calm';
  const lastStageRef = useRef<PoiHaloStage | null>(null);
  const expiredRef = useRef(false);

  useEffect(() => {
    if (mode !== 'timed') return;
    if (lastStageRef.current !== stage) {
      lastStageRef.current = stage;
      onStageChange?.(stage);
    }
    if (remainingFraction <= 0 && !expiredRef.current) {
      expiredRef.current = true;
      onExpire?.();
    }
    if (remainingFraction > 0) expiredRef.current = false;
  }, [mode, stage, remainingFraction, onStageChange, onExpire]);

  const isReady = mode === 'ready';
  const isTimed = mode === 'timed';

  // Fill mode: clockwise, grows. Timed mode: counter-clockwise, DEPLETES from
  // full — same arc geometry, mirrored direction + escalating colour, so the
  // two never look like the same "cresce=buono" read (AAA critique #ambiguity).
  const fraction = isReady ? 1 : isTimed ? remainingFraction : Math.max(0, Math.min(1, progress));
  const drawn = CIRC * fraction;
  const gap = Math.max(0, CIRC - drawn);
  const isFull = fraction >= 0.999;

  const color = isTimed ? escalateColor(palette.coronaCore, stage) : palette.coronaCore;
  const glow = isTimed ? escalateColor(palette.coronaGlow, stage) : palette.coronaGlow;

  const pulseSpeed = stage === 'critical' ? 0.9 : stage === 'alert' ? 1.6 : 3.4; // seconds, faster = more urgent
  const shouldPulse = isReady || (isTimed && isFull === false && fraction <= ALERT_AT) || (isReady);

  // meniscus: a short bright cap sitting exactly at the fill-front.
  const menLen = CIRC * 0.018;
  const menStart = isTimed
    ? drawn // depleting: front sits at the END of the remaining arc, counter-clockwise
    : drawn - menLen;

  // Fixed per-instance seed for particle angles — Stable Procedural Identity:
  // derived once from uid, never re-rolled per frame/render.
  const particleAngles = useMemo(() => {
    let seed = 0;
    for (let i = 0; i < uid.length; i += 1) seed = (seed * 31 + uid.charCodeAt(i)) >>> 0;
    const rnd = (n: number) => ((seed = (seed * 1103515245 + 12345) >>> 0), (seed / 4294967296) * n);
    return Array.from({ length: 5 }, () => rnd(360));
  }, [uid]);

  const rimGradientId = `rim-${uid}`;
  const stoneGradientId = `stone-${uid}`;
  const stoneAmbientId = `amb-${uid}`;
  const rimHoverId = `rimhov-${uid}`;
  const rimImperfId = `rimimp-${uid}`;
  const coronaGlowFilterId = `cglow-${uid}`;
  const turbAId = `turbA-${uid}`;
  const turbBId = `turbB-${uid}`;
  const clipId = `clip-${uid}`;

  return (
    <div
      className={className}
      style={{ display: 'inline-flex', position: 'relative' }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <svg
        width={size}
        height={size}
        viewBox="-40 -40 80 80"
        style={{ overflow: 'visible', display: 'block', cursor: 'pointer' }}
      >
        <defs>
          <radialGradient id={stoneGradientId} cx="36%" cy="28%" r="70%">
            <stop offset="0%" stopColor={palette.stoneColors[0]} />
            <stop offset="100%" stopColor={palette.stoneColors[1]} />
          </radialGradient>
          <radialGradient id={stoneAmbientId} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={palette.stoneAmbient} />
            <stop offset="100%" stopColor="rgba(0,0,0,0)" />
          </radialGradient>
          <linearGradient id={rimGradientId} x1="14%" y1="4%" x2="86%" y2="96%">
            <stop offset="0%" stopColor={palette.rimColors[0]} />
            <stop offset="28%" stopColor={palette.rimColors[1]} />
            <stop offset="100%" stopColor={palette.rimColors[2]} />
          </linearGradient>
          <linearGradient id={rimHoverId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="rgba(255,255,255,0)" />
            <stop offset="35%" stopColor="rgba(255,255,255,0)" />
            <stop offset="50%" stopColor="rgba(255,255,255,0.85)" />
            <stop offset="65%" stopColor="rgba(255,255,255,0)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0)" />
          </linearGradient>
          {/* rim imperfection — organic, seed FIXED (Stable Procedural Identity) */}
          <filter id={rimImperfId} x="-80%" y="-80%" width="260%" height="260%">
            <feTurbulence type="fractalNoise" baseFrequency=".8 .4" numOctaves="3" seed="22" result="n" />
            <feColorMatrix in="n" type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 .18 0" result="nm" />
            <feComposite in="SourceGraphic" in2="nm" operator="arithmetic" k1="0" k2="1" k3="0.22" k4="0" />
          </filter>
          <filter id={coronaGlowFilterId} x="-80%" y="-80%" width="260%" height="260%" colorInterpolationFilters="sRGB">
            <feGaussianBlur in="SourceGraphic" stdDeviation="1.0" result="g1" />
            <feGaussianBlur in="SourceGraphic" stdDeviation="2.5" result="g2" />
            <feColorMatrix in="g2" type="matrix" values="1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 0 0 .38 0" result="g2d" />
            <feBlend in="g2d" in2="g1" mode="screen" result="b1" />
            <feBlend in="b1" in2="SourceGraphic" mode="screen" />
          </filter>
          {/* corona turbulence — animated ONLY when perf allows (or hovered) */}
          <filter id={turbAId} x="-15%" y="-15%" width="130%" height="130%">
            <feTurbulence type="turbulence" baseFrequency=".008 .04" numOctaves="3" seed="9" result="t">
              {allowFullDetail && (
                <animate attributeName="seed" values="9;10;11;12;9" dur="7.3s" repeatCount="indefinite" />
              )}
            </feTurbulence>
            <feDisplacementMap in="SourceGraphic" in2="t" scale="3.5" xChannelSelector="R" yChannelSelector="G" />
          </filter>
          <filter id={turbBId} x="-8%" y="-8%" width="116%" height="116%">
            <feTurbulence type="turbulence" baseFrequency=".025 .08" numOctaves="2" seed="33" result="t">
              {allowFullDetail && (
                <animate attributeName="seed" values="33;34;35;33" dur="3.1s" repeatCount="indefinite" />
              )}
            </feTurbulence>
            <feDisplacementMap in="SourceGraphic" in2="t" scale="1.8" xChannelSelector="R" yChannelSelector="G" />
          </filter>
          <clipPath id={clipId}><circle cx="0" cy="0" r={STONE_R} /></clipPath>
        </defs>

        <style>{`
          @keyframes ch-rim-breath { 0%,100%{opacity:.92} 45%{opacity:.68} 75%{opacity:.85} }
          .ch-rim-${uid} { animation: ch-rim-breath 9.4s ease-in-out infinite; }
          @keyframes ch-pulse-${uid} {
            0%,100% { opacity: .75; }
            50% { opacity: 1; }
          }
          .ch-pulse-${uid} { animation: ch-pulse-${uid} ${pulseSpeed}s ease-in-out infinite; }
          @keyframes ch-particle-${uid} {
            0% { opacity: 0; transform: scale(0.4); }
            30% { opacity: .8; }
            100% { opacity: 0; transform: scale(1.1) translateY(-6px); }
          }
        `}</style>

        {/* COLD channel/track — the reservoir is always visible, so the warm
            energy stacks out by temperature+value (CarvedBar law). */}
        <circle
          cx="0" cy="0" r={TRACK_R} fill="none"
          stroke="rgba(5,16,28,0.55)" strokeWidth={TRACK_SW}
        />
        <circle
          cx="0" cy="0" r={TRACK_R} fill="none"
          stroke="rgba(60,110,150,0.18)" strokeWidth="1"
        />

        {/* corona glow (wide bloom) */}
        <circle
          cx="0" cy="0" r={TRACK_R} fill="none"
          stroke={`rgba(${glow.r},${glow.g},${glow.b},${0.38 + 0.2 * fraction})`}
          strokeWidth={TRACK_SW + 2}
          strokeDasharray={`${drawn} ${gap}`}
          strokeLinecap={isFull ? 'butt' : 'round'}
          filter={`url(#${coronaGlowFilterId})`}
          transform={isTimed ? `rotate(90) scale(-1,1)` : 'rotate(-90)'}
        />
        {/* corona main arc — turbulent, this IS the energy */}
        <circle
          cx="0" cy="0" r={TRACK_R} fill="none"
          stroke={`rgba(${color.r},${color.g},${color.b},${0.8 + 0.15 * fraction})`}
          strokeWidth={TRACK_SW}
          strokeDasharray={`${drawn} ${gap}`}
          strokeLinecap={isFull ? 'butt' : 'round'}
          filter={`url(#${turbAId})`}
          transform={isTimed ? `rotate(90) scale(-1,1)` : 'rotate(-90)'}
          className={shouldPulse ? `ch-pulse-${uid}` : undefined}
        />
        {/* corona fine highlight arc */}
        <circle
          cx="0" cy="0" r={TRACK_R} fill="none"
          stroke={`rgba(${Math.min(255, color.r + 30)},${Math.min(255, color.g + 20)},${Math.min(255, color.b + 10)},.5)`}
          strokeWidth={TRACK_SW * 0.5}
          strokeDasharray={`${drawn} ${gap}`}
          strokeLinecap={isFull ? 'butt' : 'round'}
          filter={`url(#${turbBId})`}
          transform={isTimed ? `rotate(90) scale(-1,1)` : 'rotate(-90)'}
        />

        {/* MENISCUS — bright cap exactly at the fill-front (glance-read cue) */}
        {!isFull && (
          <circle
            cx="0" cy="0" r={TRACK_R} fill="none"
            stroke="rgba(255,246,220,0.9)"
            strokeWidth={TRACK_SW * 0.7}
            strokeDasharray={`${menLen} ${CIRC - menLen}`}
            strokeDashoffset={-menStart}
            strokeLinecap="round"
            transform={isTimed ? `rotate(90) scale(-1,1)` : 'rotate(-90)'}
          />
        )}

        {/* rim — bronze, KEPT: rim-breath + hover sweep animations */}
        <circle
          cx="0" cy="0" r={RIM_R} fill="none"
          stroke={`url(#${rimGradientId})`} strokeWidth={RIM_SW}
          filter={`url(#${rimImperfId})`}
          opacity={0.86}
          className={`ch-rim-${uid}`}
        />
        <g
          style={{
            opacity: isHovered ? 0.95 : 0,
            mixBlendMode: 'color-dodge',
            transition: isHovered ? 'opacity 0.3s ease-in-out, transform 0.8s ease-out' : 'opacity 0.3s ease-in-out, transform 0s',
            transform: isHovered ? 'rotate(360deg)' : 'rotate(0deg)',
            transformOrigin: '0px 0px',
            pointerEvents: 'none',
          }}
        >
          <circle cx="0" cy="0" r={RIM_R} fill="none" stroke={`url(#${rimHoverId})`} strokeWidth={RIM_SW} />
        </g>

        {/* stone body */}
        <circle cx="0" cy="0" r={STONE_R + 0.8} fill={`url(#${stoneAmbientId})`} />
        <circle cx="0" cy="0" r={STONE_R} fill={`url(#${stoneGradientId})`} />

        {/* pin/icon — two-layer letterpress (shadow + lit) */}
        <g clipPath={`url(#${clipId})`}>
          <g transform="translate(.4,.5)" opacity={0.5}>
            <text x="0" y="1" textAnchor="middle" dominantBaseline="central" fontSize="11" fill="rgba(0,0,0,0.9)">{icon}</text>
          </g>
          <text x="0" y="1" textAnchor="middle" dominantBaseline="central" fontSize="11" fill={palette.pinColor}>{icon}</text>
        </g>

        {/* particles — CSS-only, fixed seeded angles, max 5, perf-gated */}
        {allowFullDetail && particleAngles.map((angle, i) => {
          const r = TRACK_R + 3;
          const x = Math.cos((angle * Math.PI) / 180) * r;
          const y = Math.sin((angle * Math.PI) / 180) * r;
          return (
            <circle
              key={i}
              cx={x} cy={y} r={0.9}
              fill={`rgba(${color.r},${color.g},${color.b},0.8)`}
              style={{
                animation: `ch-particle-${uid} ${3.5 + i * 0.6}s ease-in-out infinite`,
                animationDelay: `${i * 0.7}s`,
              }}
            />
          );
        })}
      </svg>
    </div>
  );
};

export default PoiCoronaHalo;
