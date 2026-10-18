import React, { useEffect, useMemo, useRef, useState } from 'react';
import clsx from 'clsx';
import { useTranslation } from '@/localization/useTranslation';
import {
  slotV12SkinData,
  SLOT_WILDERNESS_BRONZE_CONFIG,
} from '@/ui/idleVillage/skins/converted/slotWildernessBronzeConfig';
import type { SlotDebugVisualizationSettings } from '@/balancing/config/idleVillage/slotDebugVisualizationConfig';
import { SlotGemPointer } from './SlotGemPointer';
import { EngravedIcon, type EngravedIconId } from '@/ui/idleVillage/components/gameFrame/engravedIcons';

type SlotState = keyof typeof slotV12SkinData.states;
type SlotStateConfig = (typeof slotV12SkinData.states)[SlotState];
type SlotGeometry = typeof slotV12SkinData.geometry;
type TokenLookup = (key: string) => TokenValue;

/** Slot render variant (PLAN-043 WS-1 T1.1): `lab` is the certified /slot page, `hud64` the 64px quest-planner slot. */
export type SlotVariant = 'lab' | 'hud64';

/**
 * Per-variant paint/material spec — geometry, layering and material tokens only.
 * NO timing/keyframe/rotation fields by construction: the choreography constants are frozen
 * (`bezelSlam 440ms`, `560ms cubic-bezier(0.42,0,0.2,1)`, tooth `70ms … 200ms`, `TEETH_PHASE 0.35`)
 * and live in one place below.
 */
export interface SlotVariantSpec {
  /** SVG viewBox — `-79 -79 158 158` crops the hud64 unit space to the bezel outer radius + margin. */
  viewBox: string;
  /** Fixed DOM box edge (css px). When set, it overrides `sizePx`. */
  domSizePx?: number;
  /** DOM portrait diameter (css px) — hud64 seats a 44px WanderlustMedalOverlay. */
  portraitSizePx: number;
  /** Prefix for every `<defs>` id so lab and hud64 can coexist without id collisions. */
  defPrefix: string;
  /** Worn-brass material deltas (T0.4 contract). */
  material: {
    /** `fn-oxide` feTurbulence baseFrequency — grain-period matched: f_hud = f_lab × (s_hud/s_lab). */
    oxideFreq: string;
    /** `fn-vein` feTurbulence baseFrequency — same period-match. */
    veinFreq: string;
    /** feTurbulence numOctaves — 1 on hud64 (sub-pixel octave aliasing at 0.405 px/unit). */
    filterOctaves: number;
    /** `fn-oxide` noise matrix alpha — halved on hud64. String so markup serializes byte-identically. */
    oxideMatrixAlpha: string;
    /** Opacity of the oxide circle layer over the bezel foundation (string: '0.60' lab ↔ '0.30' hud64). */
    oxideLayerOpacity: string;
    /** Max stops per gradient ramp (hud64 caps at 3; lab uncapped). */
    maxGradientStops: number;
  };
  /** Upper-left bezel specular rim light — hud64 uses crest #d8bd78 at 1px, its only crest use. */
  rimLight: { stroke: string; strokeWidth: number };
}

export const SLOT_VARIANT_SPECS: Record<SlotVariant, SlotVariantSpec> = {
  lab: {
    viewBox: '-120 -120 240 240',
    portraitSizePx: 40,
    defPrefix: '',
    material: {
      oxideFreq: '.20 .16',
      veinFreq: '.012 .085',
      filterOctaves: 4,
      oxideMatrixAlpha: '.48',
      oxideLayerOpacity: '0.60',
      maxGradientStops: 99,
    },
    rimLight: { stroke: 'rgba(255,255,255,0.25)', strokeWidth: 1.6 },
  },
  hud64: {
    viewBox: '-79 -79 158 158',
    domSizePx: 64,
    portraitSizePx: 44,
    defPrefix: 'hud64-',
    material: {
      /* s_lab = 210/240 = 0.875, s_hud = 64/158 ≈ 0.405 → f_hud = f_lab × 0.463. */
      oxideFreq: '.092 .074',
      veinFreq: '.0056 .039',
      filterOctaves: 1,
      oxideMatrixAlpha: '.24',
      oxideLayerOpacity: '0.30',
      maxGradientStops: 3,
    },
    rimLight: { stroke: '#d8bd78', strokeWidth: 1 },
  },
};

/**
 * Experimental bezel presets for the `/bezel-variants` lab page — optical
 * rebalancing studies requested after the "medaglioni decentrati" critique
 * (multi-provider memo `.mw/runs/20261017-qed-ui-critique/artifact-r002.md`).
 * `stock` resolves to the exact certified paint — every knob is optional and
 * absent knobs fall back to the current literals, so existing variants are
 * byte-identical. Presets other than `stock` are LAB-ONLY: do not pass them
 * from production surfaces until a Director ruling promotes one.
 */
export type BezelPreset = 'stock' | 'a' | 'b' | 'c' | 'ab';

/**
 * Resolved paint knobs for a bezel preset. All values are SVG units of the
 * variant's viewBox space (hud64: `-79 -79 158 158`, so 1 unit ≈ 0.405 css px).
 */
export interface BezelKnobs {
  /** Claw angles in deg (0 = east, 90 = south). Default: skin token / [270,30,150]. */
  toothAngles?: number[];
  /**
   * Mid-ring specular mode: `arc` = single ~60° upper-left highlight (stock);
   * `arc+counter` = same arc plus a faint mirrored arc bottom-right;
   * `full` = continuous low-opacity ring, no directional accent.
   */
  rimMode?: 'arc' | 'arc+counter' | 'full';
  /** Drop offset of the outer dark ring. Stock literal: (1.3, 1.7). */
  shadowOffset?: [number, number];
  /** Engraved rivet angles on the bezel mid ring (counterweight accents). */
  rivetAngles?: number[];
  /** Centre angle (deg) of a 90° annulus sector darkened over the bezel band. */
  shadeCenterDeg?: number;
  /** Multiplier on the cavity inset-shadow translates (5,6 / 2.5,3 / 1,1.2). Stock: 1. */
  cavityShadowScale?: number;
}

export const BEZEL_PRESETS: Record<BezelPreset, BezelKnobs> = {
  stock: {},
  /** A — optical rebalance: one claw per diagonal quadrant, mirrored rim light, centred shadow. */
  a: {
    toothAngles: [45, 135, 225, 315],
    rimMode: 'arc+counter',
    shadowOffset: [0, 0.9],
    cavityShadowScale: 0.6,
  },
  /** B — counterweight: stock claws kept, rivets at 3/9 o'clock, darker top quadrant. */
  b: {
    rimMode: 'arc',
    shadowOffset: [1.3, 1.7],
    rivetAngles: [0, 180],
    shadeCenterDeg: 270,
  },
  /** C — concentric: six evenly spaced claws, continuous rim light, near-centred shadow. */
  c: {
    toothAngles: [30, 90, 150, 210, 270, 330],
    rimMode: 'full',
    shadowOffset: [0, 0.6],
    cavityShadowScale: 0.4,
  },
  /** A+B — A's symmetric claws/lighting plus cardinal rivets between the claws. */
  ab: {
    toothAngles: [45, 135, 225, 315],
    rimMode: 'arc+counter',
    shadowOffset: [0, 0.9],
    cavityShadowScale: 0.6,
    rivetAngles: [0, 90, 180, 270],
  },
};

/** Blueprint `slot.role` → engraved glyph id for the empty hud64 cavity. */
const SLOT_ROLE_GLYPHS: Record<string, EngravedIconId> = {
  leader: 'role-leader',
  member: 'role-member',
  bodyguard: 'role-bodyguard',
  scout: 'role-scout',
};

/**
 * Frozen tooth extrusion timing — the single source read by BOTH the CSS transition
 * (normal drop path) and the WAAPI re-bite (swap SeatCycle replay). Do not edit:
 * the 70ms snap and the 200ms delay (~48% of the 440ms slam) are certified bytes.
 */
const TOOTH_REBITE = { duration: 70, delay: 200, easing: 'cubic-bezier(0.2, 0, 0, 1)' } as const;
const TOOTH_TRANSITION_CSS = `transform ${TOOTH_REBITE.duration}ms ${TOOTH_REBITE.easing} ${TOOTH_REBITE.delay}ms`;
/** Frozen extraction math: teeth retract over the first 35% of the hold. */
const TEETH_PHASE = 0.35;
/** Fallback bound for the SeatCycle pre-state flip when rAF is throttled. */
const SEAT_FLIP_FALLBACK_MS = 48;

export interface SlotV12RendererProps {
  letter?: string;
  state?: SlotState;
  className?: string;
  extractionProgress?: number; // 0-1 for press-and-hold extraction animation
  pgTokenVisible?: boolean; // Control PG token visibility
  debugVisualization?: SlotDebugVisualizationSettings;
  /** Override rendered size in px (default: geometry.SZ = 210). Inline style wins over CSS class. */
  sizePx?: number;
  /**
   * `hud-gold`: the slot's silver / cool-blue metal in the HUD's brass scale (PLAN-043 F2). Colour tokens only — geometry,
   * choreography and every other page are untouched. Absent = the certified look, byte for byte.
   */
  palette?: 'hud-gold';
  /**
   * Render variant (PLAN-043 WS-1): `lab` (default) is byte-identical to the certified /slot page;
   * `hud64` is the 64px two-plane quest-planner slot (portrait DOM layer between under/over SVG).
   */
  variant?: SlotVariant;
  /**
   * Swap seat counter (PLAN-043 WS-1 T1.2): bumped by `commitSwap` on committed slot↔slot swaps.
   * A new value remounts the keyed SeatCycle subtree → one fresh pre→slam re-bite.
   * `0`/`undefined` = no replay (plain drops already play the cycle via the state transition).
   */
  seatNonce?: number;
  /** Blueprint role — drives the engraved glyph shown in the EMPTY hud64 cavity. */
  role?: string;
  /**
   * Bezel preset (see `BEZEL_PRESETS`). `undefined`/`stock` = certified paint,
   * byte-identical. `b` is the Director-ruled production bezel for `hud64`
   * (R-214: stock claws + 3/9-o'clock rivets + darkened top quadrant);
   * `a`/`c`/`ab` remain lab-only comparisons.
   */
  bezelPreset?: BezelPreset;
}

/**
 * Worn brass for the planner slots: the HUD's brass scale (`--skin-hud-brass-*`: crest #d8bd78 → foot #71501f) with
 * warm shadows instead of the near-black blue of the silver, and a darker low end so the metal is NOT a flat clean
 * gold — the ring keeps its oxide spots and noise on top. Static hex because SVG gradient stops cannot read CSS vars.
 */
export const SLOT_HUD_GOLD_TOKENS: Record<string, string> = {
  'silver.stop0': '#d8bd78',
  'silver.stop1': '#b99a52',
  'silver.stop2': '#8d6a2e',
  'silver.stop3': '#5e4220',
  'silver.stop4': '#33230f',
  'claw.stop0': '#d3b66f',
  'claw.stop1': '#a98648',
  'claw.stop2': '#5a3f1c',
  'bezel.foundation': 'rgba(18,11,4,.98)',
  'bevel.stop0': 'rgba(255,238,178,.26)',
  'bevel.stop1': 'rgba(255,226,150,.09)',
  'bevel.stop2': 'rgba(0,0,0,.06)',
  'bevel.stop3': 'rgba(10,5,0,.30)',
  'tip.glow': 'rgba(226,190,110,.18)',
  'arcane.rgb': '214,178,98',
  'arcane.color': 'rgba(214,178,98,1)',
  /* R-214: cavity in the /game lacquer scale (sea-teal, not the wilderness
   * browns) — the well now reads as the same lacquer as the HUD plaques. */
  'obsidian.stop0': '#040d13',
  'obsidian.stop1': '#06141c',
  'obsidian.stop2': '#09202a',
  'obsidian.stop3': '#0f2a35',
  'obsidian.stop4': '#0a1a22',
  'obsidian.stop5': '#060f16',
  'rim.stop1': 'rgba(12,30,40,.45)',
  'rim.stop2': 'rgba(6,15,22,.82)',
  'rim.stop3': 'rgba(10,26,34,.30)',
};

type TokenValue = string | number | number[];

const colorTokens = SLOT_WILDERNESS_BRONZE_CONFIG.colorTokens as Record<string, TokenValue>;

const getTokenValue = (tokenKey: string): TokenValue => colorTokens[tokenKey] ?? '';

const formatColor = (value: TokenValue): string => {
  if (Array.isArray(value)) {
    return value.join(',');
  }
  return String(value);
};

const createStops = (colors: string[]) =>
  colors.map((color, index) => (
    <stop key={`${color}-${index}`} offset={`${(index / (colors.length - 1)) * 100}%`} stopColor={color} />
  ));

interface SeatCycleProps {
  /** Resolved state config of the slot (occupied/empty presentation). */
  resolvedState: SlotStateConfig;
  extractionProgress: number;
  geometry: SlotGeometry;
  tok: TokenLookup;
  toothAngles: number[];
  debugViz: SlotDebugVisualizationSettings | null;
  /** Swap seat counter — see `SlotV12RendererProps.seatNonce`. */
  seatNonce?: number;
  /** Variant spec (defs prefix, rim light, oxide layer opacity). */
  spec: SlotVariantSpec;
  /** Resolved bezel preset knobs — `BEZEL_PRESETS.stock` is the empty object. */
  bezel: BezelKnobs;
}

/**
 * SeatCycle — keyed bezel+teeth subtree with the swap "re-bite" replay (PLAN-043 WS-1 T1.2).
 *
 * Mounted with `seatNonce > 0` it starts in the PRE state: the bezel subtree renders the exact
 * EMPTY presentation (`medalVisible:false, bezelRotateDeg:-30, bezelScale:1.18`) — slam inactive,
 * teeth retracted. A post-commit effect flips to real props via requestAnimationFrame with a
 * bounded 48ms timeout fallback under an exactly-once flag. On the flip:
 *   - `bezelSlam 440ms both` is ADDED on the live node → the CSS keyframe restart is the single
 *     authoritative replay path (no before/after-style comparison needed by animations);
 *   - the teeth re-extrude via explicit from/to WAAPI keyframes with the frozen timing spec and
 *     `fill:'backwards'` (holds the retracted from-frame through the 200ms delay), cancelled on
 *     finish so no lingering fill can override a later extraction's live transform.
 * Plain drops (nonce undefined) never enter pre-state — the natural `empty→occupied` predicate
 * transition already plays the same cycle, so occupantId is deliberately NOT the key.
 */
const SeatCycle: React.FC<SeatCycleProps> = ({
  resolvedState,
  extractionProgress,
  geometry,
  tok,
  toothAngles,
  debugViz,
  seatNonce,
  spec,
  bezel,
}) => {
  const [pre, setPre] = useState(() => (seatNonce ?? 0) > 0);
  const toothRefs = useRef<(SVGGElement | null)[]>([]);
  const wasPreRef = useRef(pre);

  /* Post-commit flip — exactly once: whichever of rAF / timeout fires first sets the flag and
   * cancels the loser; effect cleanup cancels both handles (StrictMode-safe: the second mount
   * effect reschedules from scratch while `pre` survives the remount). */
  useEffect(() => {
    if (!pre) return;
    let flipped = false;
    let raf = 0;
    let timer = 0;
    const flip = () => {
      if (flipped) return;
      flipped = true;
      cancelAnimationFrame(raf);
      clearTimeout(timer);
      setPre(false);
    };
    raf = requestAnimationFrame(flip);
    timer = window.setTimeout(flip, SEAT_FLIP_FALLBACK_MS);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(timer);
    };
  }, [pre]);

  /* WAAPI teeth re-bite — fires only on the pre→flip transition of the keyed replay.
   * Explicit from/to keyframes: deterministic by construction, zero transition-boundary
   * dependence; `fill:'backwards'` holds the retracted pose through the 200ms delay;
   * cancel-on-finish leaves the committed closed inline style authoritative. */
  useEffect(() => {
    const wasPre = wasPreRef.current;
    wasPreRef.current = pre;
    if (!wasPre || pre) return;
    const retractPx = geometry.TOOTH_HEIGHT + 2;
    for (const el of toothRefs.current) {
      if (!el || typeof el.animate !== 'function') continue;
      const anim = el.animate(
        [{ transform: `translate(0px, ${retractPx}px)` }, { transform: 'translate(0px, 0px)' }],
        { duration: TOOTH_REBITE.duration, delay: TOOTH_REBITE.delay, easing: TOOTH_REBITE.easing, fill: 'backwards' },
      );
      anim.onfinish = () => anim.cancel();
    }
  }, [pre, geometry.TOOTH_HEIGHT]);

  /* Single derivation point: the pre-state presentation override is applied HERE, where the
   * bezel transform / tooth extrusion / slam predicate are computed — the first committed DOM
   * of a fresh key therefore carries every transition-bearing style at pre-state values
   * atomically (bezel scale(1.18) rotate(-30deg), no `animation` property, teeth retracted). */
  const eff = pre ? slotV12SkinData.states.empty : resolvedState;
  const clampedProgress = Math.min(extractionProgress, 1.0);
  const bezelProgress = extractionProgress > 0 ? Math.max(0, (clampedProgress - TEETH_PHASE) / (1 - TEETH_PHASE)) : 0;
  const extractionScale = 1.0 + bezelProgress * 0.08;
  const extractionRotation = 0 - bezelProgress * 30;
  const springScale = extractionProgress > 1.0 ? extractionScale * (1.0 + (extractionProgress - 1.0) * 0.15) : extractionScale;
  const bezelClosed = (eff.bezelRotateDeg ?? 0) === 0;
  const teethExtrusion = extractionProgress > 0 ? Math.max(0, 1 - clampedProgress / TEETH_PHASE) : bezelClosed ? 1 : 0;
  const bezelTransform =
    extractionProgress > 0
      ? `scale(${springScale}) rotate(${extractionRotation}deg)`
      : `scale(${eff.bezelScale ?? 1}) rotate(${eff.bezelRotateDeg ?? 0}deg)`;
  const bezelSlamActive = eff.medalVisible && extractionProgress === 0 && (eff.bezelRotateDeg ?? 0) === 0;
  const P = spec.defPrefix;

  return (
    <g
      className="slot-v12__bezel"
      clipPath={`url(#${P}slot-v12-clip-bezel)`}
      style={{
        transform: bezelTransform,
        transformOrigin: '0px 0px',
        // Heavy-bronze lock choreography: slam + micro-rebound + dead stop.
        // Skipped while extracting (JS drives the transform there).
        ...(bezelSlamActive ? { animation: 'bezelSlam 440ms both' } : {}),
        // Only apply drop-shadow in debug mode
        ...(debugViz ? {
          filter: `drop-shadow(0 0 24px ${debugViz?.colors?.bezel || '#FF5C8D'})`,
        } : {}),
      }}
      data-layer="bezel"
      data-seat-nonce={seatNonce}
    >
      {(() => {
        // Use thinner bezel matching HTML reference
        const ringW = 4; // Fixed width like in HTML
        const R_BZ_MID = (geometry.R_BZ_IN + geometry.R_BZ_OUT) / 2;
        return (
          <>
            <circle cx="0" cy="0" r={R_BZ_MID} fill="none" stroke={formatColor(tok('bezel.foundation'))} strokeWidth={ringW + 3} />
            <circle cx="0" cy="0" r={R_BZ_MID} fill="none" stroke={`url(#${P}slot-v12-silver)`} strokeWidth={ringW} />
            <circle cx="0" cy="0" r={R_BZ_MID} fill="none" stroke={`url(#${P}slot-v12-bevel)`} strokeWidth={ringW} />
            <circle cx="0" cy="0" r={R_BZ_MID} fill="none" stroke="rgba(10,10,16,0)" strokeWidth={ringW} filter={`url(#${P}fn-oxide)`} opacity={spec.material.oxideLayerOpacity} />

            {/* Oxide spots */}
            {[[28, 5.4, 0.34], [118, 3.0, 0.24], [204, 6.8, 0.18], [312, 3.8, 0.28], [72, 2.4, 0.15], [250, 5.5, 0.22]].map(([angle, size, opacity], i) => {
              const rad = (angle * Math.PI) / 180;
              const x = R_BZ_MID * Math.cos(rad);
              const y = R_BZ_MID * Math.sin(rad);
              return (
                <ellipse
                  key={`oxide-${i}`}
                  cx={x.toFixed(2)}
                  cy={y.toFixed(2)}
                  rx={size}
                  ry={size * 0.44}
                  fill={`rgba(8,8,14,${opacity})`}
                  transform={`rotate(${angle + 40}, ${x.toFixed(2)}, ${y.toFixed(2)})`}
                  filter={`url(#${P}fn-oxide)`}
                />
              );
            })}

            {/* Quadrant shade — preset-only annulus sector darkening the bezel
                band (clip-bezel clips to a disc, so the sector is drawn as a
                ring wedge, never covering the cavity). */}
            {bezel.shadeCenterDeg !== undefined && (() => {
              const half = 45;
              const a0 = ((bezel.shadeCenterDeg - half) * Math.PI) / 180;
              const a1 = ((bezel.shadeCenterDeg + half) * Math.PI) / 180;
              const r0 = geometry.R_BZ_IN - 0.5;
              const r1 = geometry.R_BZ_OUT + 0.5;
              const d = `M${r1 * Math.cos(a0)},${r1 * Math.sin(a0)} `
                + `A${r1},${r1} 0 0 1 ${r1 * Math.cos(a1)},${r1 * Math.sin(a1)} `
                + `L${r0 * Math.cos(a1)},${r0 * Math.sin(a1)} `
                + `A${r0},${r0} 0 0 0 ${r0 * Math.cos(a0)},${r0 * Math.sin(a0)} Z`;
              return <path d={d} fill="rgba(4,3,8,0.20)" />;
            })()}

            {/* Decorative lines */}
            {(() => {
              type LineType = 'curve' | 'line';
              interface DecorLine {
                type: LineType;
                coords: number[];
              }
              const decorLines: DecorLine[] = [
                { type: 'curve', coords: [-0.36, -0.16, -0.16, -0.26, 0.06, -0.10, 0.22, -0.22] },
                { type: 'line', coords: [0.30, 0.28, 0.44, 0.38] },
                { type: 'line', coords: [-0.20, 0.44, -0.06, 0.50] }
              ];
              return decorLines.map((line, i) => {
                const [c0, c1, c2, c3, c4, c5, c6, c7] = line.coords;
                const d = line.type === 'curve'
                  ? `M${R_BZ_MID * c0},${R_BZ_MID * c1} C${R_BZ_MID * c2},${R_BZ_MID * c3} ${R_BZ_MID * c4},${R_BZ_MID * c5} ${R_BZ_MID * c6},${R_BZ_MID * c7}`
                  : `M${R_BZ_MID * c0},${R_BZ_MID * c1} L${R_BZ_MID * c2},${R_BZ_MID * c3}`;
                return (
                  <g key={`decor-${i}`}>
                    <path d={d} fill="none" stroke="rgba(255,255,255,0.055)" strokeWidth="0.44" strokeLinecap="round" />
                    <path d={d} fill="none" stroke="rgba(0,0,0,0.30)" strokeWidth="0.34" strokeLinecap="round" transform="translate(0.25, 0.30)" />
                  </g>
                );
              });
            })()}

            {(bezel.rimMode ?? 'arc') === 'full' ? (
              <circle cx="0" cy="0" r={R_BZ_MID - 1} fill="none" stroke={spec.rimLight.stroke} strokeWidth={spec.rimLight.strokeWidth} opacity="0.42" />
            ) : (
              <>
                <circle cx="0" cy="0" r={R_BZ_MID - 1} fill="none" stroke={spec.rimLight.stroke} strokeWidth={spec.rimLight.strokeWidth}
                  strokeDasharray={`${R_BZ_MID * 1.04} 999`} strokeDashoffset={`${R_BZ_MID * 1.30}`} strokeLinecap="round" />
                {bezel.rimMode === 'arc+counter' && (
                  <circle cx="0" cy="0" r={R_BZ_MID - 1} fill="none" stroke={spec.rimLight.stroke} strokeWidth={spec.rimLight.strokeWidth}
                    strokeDasharray={`${R_BZ_MID * 1.04} 999`} strokeDashoffset={`${R_BZ_MID * 1.30 + Math.PI * R_BZ_MID}`} strokeLinecap="round" opacity="0.38" />
                )}
              </>
            )}
            <circle cx="0" cy="0" r={R_BZ_MID + 0.4} fill="none" stroke="rgba(0,0,0,0.70)" strokeWidth="2.8"
              transform={`translate(${(bezel.shadowOffset ?? [1.3, 1.7])[0]}, ${(bezel.shadowOffset ?? [1.3, 1.7])[1]})`} />
            <circle cx="0" cy="0" r={geometry.R_BZ_OUT} fill="none" stroke="rgba(3,2,1,0.92)" strokeWidth="2.2" />
            <circle cx="0" cy="0" r={geometry.R_BZ_OUT + 0.7} fill="none" stroke="rgba(172,134,34,0.12)" strokeWidth="0.65" />
            <circle cx="0" cy="0" r={geometry.R_BZ_IN} fill="none" stroke="rgba(3,2,1,0.85)" strokeWidth="1.6" />
            <circle cx="0" cy="0" r={geometry.R_BZ_IN - 0.4} fill="none" stroke="rgba(255,252,200,0.040)" strokeWidth="0.60" />

            {/* Rotating segments */}
            <g style={{ animation: 'seg-spin 65s linear infinite' }}>
              {Array.from({ length: 16 }, (_, i) => {
                const angle = (i / 16) * Math.PI * 2;
                const isLong = i % 4 === 0;
                const segLength = isLong ? 7.8 : 4.2;
                const segWidth = isLong ? 1.1 : 0.75;
                const opacityBase = 0.15 + 0.25 * Math.abs(Math.sin(angle * 2 + 0.4));
                const x = R_BZ_MID * Math.cos(angle);
                const y = R_BZ_MID * Math.sin(angle);
                return (
                  <g key={`seg-${i}`} transform={`translate(${x.toFixed(2)}, ${y.toFixed(2)}) rotate(${(angle * 180 / Math.PI + 90).toFixed(1)})`}>
                    <rect x={-segLength / 2} y="-0.48" width={segLength} height={segWidth + 0.55} rx="0.24"
                      fill={`rgba(0,0,0,${(0.34 + opacityBase * 0.24).toFixed(2)})`} />
                    <rect x={-segLength / 2} y="0" width={segLength} height={segWidth} rx="0.24"
                      fill={`rgba(5,5,9,${(0.60 + opacityBase * 0.15).toFixed(2)})`} />
                    <rect x={-segLength / 2 + 0.5} y="0.1" width={segLength * 0.48} height="0.48" rx="0.16"
                      fill={`rgba(255,255,255,${(opacityBase + 0.09).toFixed(2)})`} />
                  </g>
                );
              })}
            </g>

            {/* Engraved rivets — preset-only counterweight accents on the mid ring */}
            {bezel.rivetAngles?.map((deg, i) => {
              const rad = (deg * Math.PI) / 180;
              const x = R_BZ_MID * Math.cos(rad);
              const y = R_BZ_MID * Math.sin(rad);
              return (
                <g key={`rivet-${i}`} transform={`translate(${x.toFixed(2)}, ${y.toFixed(2)})`}>
                  <circle r="2.6" fill="rgba(0,0,0,0.55)" transform="translate(0.45, 0.55)" />
                  <circle r="2.3" fill={`url(#${P}slot-v12-silver)`} />
                  <circle r="2.3" fill={`url(#${P}slot-v12-bevel)`} opacity="0.7" />
                  <circle r="2.3" fill="none" stroke="rgba(2,2,6,0.85)" strokeWidth="0.7" />
                  <circle cx="-0.7" cy="-0.8" r="0.75" fill="rgba(255,255,255,0.42)" />
                </g>
              );
            })}

            {/* Complex teeth - removed fn-silver filter to prevent gray square artifact */}
            {/* Extruded only when the bezel is closed; they retract as phase 1 of extraction */}
            {toothAngles.map((deg, i) => {
              const angle = (deg * Math.PI) / 180;
              const x = geometry.R_BZ_IN * Math.cos(angle);
              const y = geometry.R_BZ_IN * Math.sin(angle);
              const TH = geometry.TOOTH_HEIGHT;
              const TW = geometry.TOOTH_WIDTH;
              const path = `M${-TW/2},0 Q${-TW/2-0.8},${TH*0.12} 0,${TH*0.16} Q${TW/2+0.8},${TH*0.12} ${TW/2},0 L 0.8,${-TH} L -0.8,${-TH} Z`;
              // Local +y (after the group rotation) points away from the slot
              // center: translating by (1-extrusion)*(TH+2) slides the tooth
              // back under the bezel ring.
              const retractPx = (1 - teethExtrusion) * (TH + 2);
              const teethStyle: React.CSSProperties = {
                transform: `translate(0px, ${retractPx.toFixed(2)}px)`,
                // JS drives per-frame retraction during extraction; on
                // insertion the teeth SNAP out (70ms, hard) synced to the
                // ~48% contact frame of the 440ms bezelSlam (≈200ms delay),
                // so the bite lands ON the impact instead of gliding out late.
                transition: extractionProgress > 0 ? 'none' : TOOTH_TRANSITION_CSS,
              };
              return (
                <g key={`tooth-${i}`} transform={`translate(${x.toFixed(2)}, ${y.toFixed(2)}) rotate(${(deg - 90).toFixed(1)})`}>
                <g ref={(el) => { toothRefs.current[i] = el; }} style={teethStyle}>
                  <path d={path} fill="rgba(0,0,0,0.75)" transform="translate(0.7, 1.0)" />
                  <path d={path} fill={`url(#${P}slot-v12-claw)`} />
                  <path d={path} fill={`url(#${P}slot-v12-bevel)`} opacity="0.75" />
                  <path d={path} fill="none" stroke="rgba(2,2,6,0.88)" strokeWidth="0.9" />
                  <path d={`M${-TW/2+0.7},0 L -0.6,${-TH+2}`} fill="none" stroke="rgba(255,255,255,0.34)" strokeWidth="0.9" strokeLinecap="round" />
                  <ellipse cx="0" cy={`${-TH+1}`} rx="2.2" ry="1.0" fill="rgba(0,0,0,0.48)" />
                  <circle cx="0" cy={`${-TH}`} r="0.9" fill={formatColor(tok('tip.glow'))} />
                </g>
                </g>
              );
            })}
          </>
        );
      })()}
    </g>
  );
};

export const SlotV12Renderer: React.FC<SlotV12RendererProps> = ({
  letter = 'A',
  state = 'empty',
  className,
  extractionProgress = 0,
  pgTokenVisible = false,
  debugVisualization,
  sizePx,
  palette,
  variant = 'lab',
  seatNonce,
  role,
  bezelPreset,
}) => {
  const { t } = useTranslation('idleVillage');
  const tok = (key: string): TokenValue => (palette === 'hud-gold' ? SLOT_HUD_GOLD_TOKENS[key] : undefined) ?? getTokenValue(key);

  const ARCANE_RGB = String(tok('arcane.rgb') || '162,188,255');
  const geometry = slotV12SkinData.geometry;
  const stateConfig = slotV12SkinData.states[state] ?? slotV12SkinData.states.occupied;
  const bezel = BEZEL_PRESETS[bezelPreset ?? 'stock'];
  const rawToothAngles = tok('tooth.positions.deg');
  const toothAngles = bezel.toothAngles ?? (Array.isArray(rawToothAngles) ? rawToothAngles : [270, 30, 150]);
  const segments = Number(tok('segments.n') ?? 16);

  const gradients = useMemo(
    () => ({
      cavity: [
        formatColor(tok('obsidian.stop0')),
        formatColor(tok('obsidian.stop1')),
        formatColor(tok('obsidian.stop2')),
        formatColor(tok('obsidian.stop3')),
        formatColor(tok('obsidian.stop4')),
        formatColor(tok('obsidian.stop5')),
      ],
      collar: [
        formatColor(tok('bronze.stop0')),
        formatColor(tok('bronze.stop1')),
        formatColor(tok('bronze.stop2')),
        formatColor(tok('bronze.stop3')),
        formatColor(tok('bronze.stop4')),
      ],
      bezel: [
        formatColor(tok('silver.stop0')),
        formatColor(tok('silver.stop1')),
        formatColor(tok('silver.stop2')),
        formatColor(tok('silver.stop3')),
        formatColor(tok('silver.stop4')),
      ],
      medal: [
        formatColor(tok('outer.fill.stop0')),
        formatColor(tok('outer.fill.stop1')),
        formatColor(tok('outer.fill.stop2')),
        formatColor(tok('outer.fill.stop3')),
        formatColor(tok('outer.fill.stop4')),
        formatColor(tok('outer.fill.stop5')),
      ],
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `tok` only reads `palette`
    [palette],
  );

  const resolvedState =
    'sealVisible' in stateConfig ? stateConfig : slotV12SkinData.states.occupied;
  const debugViz = debugVisualization?.enabled ? debugVisualization : null;
  const spec = SLOT_VARIANT_SPECS[variant];
  const P = spec.defPrefix;
  const isHud64 = variant === 'hud64';
  const cavityShadowScale = bezel.cavityShadowScale ?? 1;

  // Extraction is a two-phase sequence:
  //   phase 1 (progress 0 -> TEETH_PHASE): the teeth retract into the bezel
  //   phase 2 (TEETH_PHASE -> 1): the bezel counter-rotates/opens
  // Insertion is the inverse handled via CSS (bezel closes, THEN teeth extrude).
  const clampedProgress = Math.min(extractionProgress, 1.0); // Clamp to 1.0 for normal animation

  // Bezel only starts moving after the teeth have fully retracted
  const bezelProgress = extractionProgress > 0
    ? Math.max(0, (clampedProgress - TEETH_PHASE) / (1 - TEETH_PHASE))
    : 0;
  const extractionScale = 1.0 + (bezelProgress * 0.08); // 1.0 -> 1.08 (teeth touch medal)
  const extractionRotation = 0 - (bezelProgress * 30); // 0° -> -30°

  // Add spring effect for overshoot
  const springScale = extractionProgress > 1.0
    ? extractionScale * (1.0 + (extractionProgress - 1.0) * 0.15) // Reduced spring overshoot
    : extractionScale;

  /* Bezel transform for the `.slot-v12__bezel` class rule (the element's inline
   *  transform — derived inside SeatCycle — wins anyway; kept identical here). */
  const bezelTransform = extractionProgress > 0 
    ? `scale(${springScale}) rotate(${extractionRotation}deg)`
    : `scale(${resolvedState.bezelScale ?? 1}) rotate(${resolvedState.bezelRotateDeg ?? 0}deg)`;

  const bezelStartScale = slotV12SkinData.states.empty.bezelScale ?? 1.18;
  const bezelStartRotate = slotV12SkinData.states.empty.bezelRotateDeg ?? -30;

  const cssText = useMemo(
    () => `
      .slot-v12 {
        position: relative;
        width: ${geometry.SZ}px;
        height: ${geometry.SZ}px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        /* Removed drop-shadow to eliminate gray square artifact */
        /* filter: drop-shadow(0 18px 32px rgba(0, 0, 0, 0.75)); */
      }

      .slot-v12__halo {
        position: absolute;
        inset: 0;
        border-radius: 50%;
        background: radial-gradient(circle, rgba(255, 200, 55, 0.15), transparent 70%);
        filter: blur(24px);
        opacity: ${resolvedState.haloVisible ? 1 : 0};
        transition: opacity 220ms ease-out;
      }

      .slot-v12__seal {
        opacity: ${resolvedState.sealVisible ? 1 : 0};
        animation: sealPulse 14s ease-in-out infinite;
      }

      .slot-v12__arcane {
        stroke: ${formatColor(tok('arcane.color'))};
        opacity: ${resolvedState.arcaneAlpha ?? 0.06};
        stroke-width: ${(resolvedState.arcaneStrokeWidth ?? 1.6)}px;
        animation: arcaneBreathe ${resolvedState.arcaneDuration ?? '13s'} ease-in-out infinite;
      }

      .slot-v12__bezel {
        transform: ${bezelTransform};
        transition: transform 560ms cubic-bezier(0.42, 0, 0.2, 1);
      }

      /* Heavy-bronze lock: the ring ACCELERATES into home (peak velocity at
         contact), impacts with a micro scale-compression (the "clunk"), kicks
         back ~2.4° at high speed, does one damped bounce, then dead-stops on a
         linear tail (metal-on-metal). No soft ease-out anywhere near the hit. */
      @keyframes bezelSlam {
        /* approach: accelerate — fastest the instant before contact */
        0% {
          transform: scale(${bezelStartScale}) rotate(${bezelStartRotate}deg);
          animation-timing-function: cubic-bezier(0.66, 0, 0.9, 0.25);
        }
        /* CONTACT at peak velocity + scale compression = the impact */
        48% {
          transform: scale(0.99) rotate(0deg);
          animation-timing-function: cubic-bezier(0.1, 0.9, 0.15, 1);
        }
        /* elastic micro-rebound backward, near-instant kick */
        58% {
          transform: scale(1) rotate(-2.4deg);
          animation-timing-function: cubic-bezier(0.95, 0, 1, 1);
        }
        /* slam back to home, hard (linear) */
        66% {
          transform: scale(1) rotate(0.6deg);
          animation-timing-function: linear;
        }
        /* second damped bounce */
        72% {
          transform: scale(1) rotate(-0.5deg);
          animation-timing-function: linear;
        }
        /* DEAD STOP — no easing tail, freezes */
        76% {
          transform: scale(1) rotate(0deg);
        }
        100% {
          transform: scale(1) rotate(0deg);
        }
      }

      @keyframes arcaneBreathe {
        0%, 100% { opacity: 0.55; }
        50% { opacity: 1; }
      }

      @keyframes sealPulse {
        0%, 100% { opacity: 0.1; }
        50% { opacity: 0.22; }
      }

      @keyframes segmentSpin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }

      .slot-v12__segments {
        animation: segmentSpin 65s linear infinite;
      }
    `,
    [
      geometry.SZ,
      resolvedState.arcaneAlpha,
      resolvedState.arcaneDuration,
      resolvedState.arcaneStrokeWidth,
      resolvedState.bezelRotateDeg,
      resolvedState.bezelScale,
      resolvedState.haloVisible,
      resolvedState.sealVisible,
      bezelTransform,
      bezelStartScale,
      bezelStartRotate,
      // eslint-disable-next-line react-hooks/exhaustive-deps -- `tok` only reads `palette`
      palette,
    ],
  );

  const renderDebugLabel = (text: string, translateY: number) => {
    if (!debugViz?.showLabels) return null;
    const width = Math.max(80, text.length * 6);
    const halfWidth = width / 2;
    return (
      <g aria-hidden transform={`translate(0, ${translateY})`}>
        <rect
          x={-halfWidth}
          y={-9}
          width={width}
          height={18}
          rx={18}
          fill={debugViz.colors.labelBackdrop}
          opacity={0.95}
        />
        <text
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize={8}
          fontWeight={700}
          fill={debugViz.colors.labelText}
        >
          {text}
        </text>
      </g>
    );
  };

  const stateLabel = t('idleVillage:slotRack.states.' + state, state);

  /* Even-sampled cap for hud64 gradient ramps (contract: ≤3 stops). */
  const capStops = (stops: string[]): string[] =>
    stops.length <= spec.material.maxGradientStops
      ? stops
      : [stops[0], stops[Math.floor((stops.length - 1) / 2)], stops[stops.length - 1]];
  /* hud64: crest (#d8bd78 = ramp stop0 of the hud-gold bezel) is reserved to the
   * 1px rim light — it is dropped from the bezel ramp per the material contract. */
  const bezelRamp = isHud64 ? [gradients.bezel[1], gradients.bezel[2], gradients.bezel[4]] : gradients.bezel;

  const defsNode = (
    <defs>
      {/* Complex filters from HTML reference */}
      <filter id={`${P}fn-basalt`} x="-4%" y="-4%" width="108%" height="108%">
        <feTurbulence type="fractalNoise" baseFrequency=".88" numOctaves={spec.material.filterOctaves} seed="7" stitchTiles="stitch" result="n" />
        <feColorMatrix in="n" type="matrix" values="0 0 0 0 .014 0 0 0 0 .009 0 0 0 0 .003 0 0 0 .28 0" result="c" />
        <feBlend in="SourceGraphic" in2="c" mode="overlay" />
      </filter>
      <filter id={`${P}fn-vein`} x="-8%" y="-8%" width="116%" height="116%">
        <feTurbulence type="turbulence" baseFrequency={spec.material.veinFreq} numOctaves={spec.material.filterOctaves} seed="5" stitchTiles="stitch" result="n" />
        <feColorMatrix in="n" type="matrix" values="0 0 0 0 .018 0 0 0 0 .010 0 0 0 0 .003 0 0 0 .26 0" result="c" />
        <feBlend in="SourceGraphic" in2="c" mode="overlay" />
      </filter>
      <filter id={`${P}fn-silver`} x="-5%" y="-5%" width="110%" height="110%">
        <feTurbulence type="fractalNoise" baseFrequency=".55 .72" numOctaves={isHud64 ? 1 : 5} seed="31" stitchTiles="stitch" result="n" />
        <feColorMatrix in="n" type="matrix" values="0 0 0 0 .032 0 0 0 0 .032 0 0 0 0 .038 0 0 0 .28 0" result="c" />
        <feBlend in="SourceGraphic" in2="c" mode="overlay" />
      </filter>
      <filter id={`${P}fn-oxide`} x="-10%" y="-10%" width="120%" height="120%">
        <feTurbulence type="fractalNoise" baseFrequency={spec.material.oxideFreq} numOctaves={spec.material.filterOctaves} seed="17" stitchTiles="stitch" result="n" />
        <feColorMatrix in="n" type="matrix" values={`0 0 0 0 .008 0 0 0 0 .008 0 0 0 0 .010 0 0 0 ${spec.material.oxideMatrixAlpha} 0`} result="c" />
        <feComposite in="c" in2="SourceGraphic" operator="in" result="masked" />
        <feBlend in="SourceGraphic" in2="masked" mode="multiply" />
      </filter>
      <filter id={`${P}fg-arcane`} x="-150%" y="-150%" width="400%" height="400%" colorInterpolationFilters="sRGB">
        <feGaussianBlur in="SourceGraphic" stdDeviation="5" result="b" />
        <feColorMatrix in="b" type="matrix" values=".42 0 0 0 .10 0 .52 0 0 .16 0 0 1.0 0 .50 0 0 0 .85 0" />
      </filter>

      {/* Gradients matching HTML reference */}
      <radialGradient id={`${P}slot-v12-cavity`} cx="38%" cy="34%" r="65%">
        {createStops(capStops(gradients.cavity))}
      </radialGradient>
      <radialGradient id={`${P}slot-v12-rim`} cx="50%" cy="50%" r="50%">
        {isHud64 ? (
          <>
            <stop offset="62%" stopColor="rgba(0,0,0,0)" />
            <stop offset="97%" stopColor="rgba(88,60,24,.80)" />
            <stop offset="100%" stopColor="rgba(40,24,8,.30)" />
          </>
        ) : (
          <>
            <stop offset="62%" stopColor="rgba(0,0,0,0)" />
            <stop offset="88%" stopColor="rgba(70,48,20,.45)" />
            <stop offset="97%" stopColor="rgba(88,60,24,.80)" />
            <stop offset="100%" stopColor="rgba(40,24,8,.30)" />
          </>
        )}
      </radialGradient>
      <radialGradient id={`${P}slot-v12-silver`} cx="26%" cy="22%" r="74%">
        {createStops(bezelRamp)}
      </radialGradient>
      <linearGradient id={`${P}slot-v12-bevel`} x1="20%" y1="16%" x2="80%" y2="84%">
        {isHud64 ? (
          <>
            <stop offset="0%" stopColor={formatColor(tok('bevel.stop0'))} />
            <stop offset="60%" stopColor={formatColor(tok('bevel.stop2'))} />
            <stop offset="100%" stopColor={formatColor(tok('bevel.stop3'))} />
          </>
        ) : (
          <>
            <stop offset="0%" stopColor={formatColor(tok('bevel.stop0'))} />
            <stop offset="26%" stopColor={formatColor(tok('bevel.stop1'))} />
            <stop offset="60%" stopColor={formatColor(tok('bevel.stop2'))} />
            <stop offset="100%" stopColor={formatColor(tok('bevel.stop3'))} />
          </>
        )}
      </linearGradient>
      <linearGradient id={`${P}slot-v12-claw`} x1="20%" y1="10%" x2="80%" y2="90%">
        <stop offset="0%" stopColor={formatColor(tok('claw.stop0'))} />
        <stop offset="38%" stopColor={formatColor(tok('claw.stop1'))} />
        <stop offset="100%" stopColor={formatColor(tok('claw.stop2'))} />
      </linearGradient>
      <linearGradient id={`${P}slot-v12-collar`} x1="14%" y1="4%" x2="86%" y2="96%">
        {createStops(capStops(gradients.collar))}
      </linearGradient>
      {!isHud64 && (
        <>
          <radialGradient id="slot-v12-medal-outer" cx="14%" cy="4%" x2="86%" y2="96%">
            {createStops(gradients.medal)}
          </radialGradient>
          <linearGradient id="slot-v12-medal-shine" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="rgba(255,240,165,.28)" />
            <stop offset="22%" stopColor="rgba(255,225,135,.08)" />
            <stop offset="100%" stopColor="rgba(0,0,0,.55)" />
          </linearGradient>
          <linearGradient id="slot-v12-medal-ring" x1="12%" y1="8%" x2="88%" y2="92%">
            <stop offset="0%" stopColor="#f0d070" />
            <stop offset="16%" stopColor="#c88430" />
            <stop offset="46%" stopColor="#7c3e10" />
            <stop offset="80%" stopColor="#3c1c04" />
            <stop offset="100%" stopColor="#160a02" />
          </linearGradient>
          <radialGradient id="slot-v12-medal-field" cx="40%" cy="33%" r="70%">
            <stop offset="0%" stopColor={formatColor(tok('field.stop0'))} />
            <stop offset="38%" stopColor={formatColor(tok('field.stop1'))} />
            <stop offset="72%" stopColor={formatColor(tok('field.stop2'))} />
            <stop offset="100%" stopColor={formatColor(tok('field.stop3'))} />
          </radialGradient>
          <clipPath id="slot-v12-clip-medal">
            <circle cx="0" cy="0" r={geometry.R_MED_OUT} />
          </clipPath>
        </>
      )}
      <clipPath id={`${P}slot-v12-clip-cavity`}>
        <circle cx="0" cy="0" r={geometry.R_CAV + 4} />
      </clipPath>
      <clipPath id={`${P}slot-v12-clip-bezel`}>
        <circle cx="0" cy="0" r={geometry.R_BZ_OUT + 2} />
      </clipPath>
    </defs>
  );

  const cavityLayer = (
    <g clipPath={`url(#${P}slot-v12-clip-cavity)`}>
      <circle cx="0" cy="0" r={geometry.R_CAV} fill={`url(#${P}slot-v12-cavity)`} />
      <circle cx="0" cy="0" r={geometry.R_CAV} fill={`url(#${P}slot-v12-cavity)`} filter={`url(#${P}fn-vein)`} opacity="0.38" />
      <circle cx="0" cy="0" r={geometry.R_CAV} fill={`url(#${P}slot-v12-cavity)`} filter={`url(#${P}fn-basalt)`} opacity="0.52" />
      <circle cx="0" cy="0" r={geometry.R_CAV} fill={`url(#${P}slot-v12-rim)`} />
      
      {/* Arcane circle — lab only: on hud64 the cavity reads as a clean
          lacquer well + engraved role glyph (R-214, decorative rings removed). */}
      {!isHud64 && (
      <circle
        cx="0"
        cy="0"
        r={geometry.R_ARC}
        fill="none"
        stroke={`rgba(${ARCANE_RGB},${resolvedState.arcaneAlpha ?? 0.06})`}
        strokeWidth={resolvedState.arcaneStrokeWidth ?? 1.6}
        filter={`url(#${P}fg-arcane)`}
        style={{ animation: `arcane-breathe ${resolvedState.arcaneDuration ?? '13s'} ease-in-out infinite` }}
      />
      )}
          
          {/* Inset shadows */}
          <circle cx="0" cy="0" r={geometry.R_CAV} fill="none" stroke="rgba(0,0,0,0.96)" strokeWidth="20" transform={`translate(${5 * cavityShadowScale},${6 * cavityShadowScale})`} opacity="0.32" />
          <circle cx="0" cy="0" r={geometry.R_CAV} fill="none" stroke="rgba(0,0,0,0.72)" strokeWidth="9" transform={`translate(${2.5 * cavityShadowScale},${3 * cavityShadowScale})`} opacity="0.28" />
          <circle cx="0" cy="0" r={geometry.R_CAV} fill="none" stroke="rgba(0,0,0,0.36)" strokeWidth="4" transform={`translate(${1 * cavityShadowScale},${1.2 * cavityShadowScale})`} opacity="0.24" />
          
          {/* Specular highlight */}
          <circle cx="0" cy="0" r={geometry.R_CAV - 1} fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="1.0"
            strokeDasharray={`${geometry.R_CAV * 1.06} 999`} strokeDashoffset={`${geometry.R_CAV * 1.28}`} strokeLinecap="round" />
          
          {/* Engraved rings — lab only (R-214: meaningless circles on hud64) */}
          {!isHud64 && [geometry.R_RING1, geometry.R_RING2].map((R, i) => {
            const w = i === 0 ? 2.4 : 1.6;
            return (
              <g key={`ring-${i}`}>
                <circle cx="0" cy="0" r={R} fill="none" stroke="rgba(0,0,0,0.92)" strokeWidth={`${w + 2.6}`} transform="translate(0.65, 0.75)" />
                <circle cx="0" cy="0" r={R} fill="none" stroke="rgba(0,0,0,0.96)" strokeWidth={w} />
                <circle cx="0" cy="0" r={R + w * 0.28} fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="0.50"
                  strokeDasharray={`${R * 1.08} 999`} strokeDashoffset={`${R * 1.35}`} strokeLinecap="round" />
                <circle cx="0" cy="0" r={R - w * 0.28} fill="none" stroke="rgba(0,0,0,0.52)" strokeWidth="0.55"
                  strokeDasharray={`${R * 1.02} 999`} strokeDashoffset={`${R * 0.55}`} strokeLinecap="round" />
              </g>
            );
          })}
          
          {/* Cavity border */}
          <circle cx="0" cy="0" r={geometry.R_CAV} fill="none" stroke="rgba(2,1,1,0.95)" strokeWidth="3.2" />
          <circle cx="0" cy="0" r={geometry.R_CAV + 1.2} fill="none" stroke="rgba(185,140,36,0.18)" strokeWidth="0.8" />
          <circle cx="0" cy="0" r={geometry.R_CAV} fill="none" stroke="rgba(255,255,255,0.20)" strokeWidth="0.9"
            strokeDasharray={`${geometry.R_CAV * 0.65} 999`} strokeDashoffset={`${geometry.R_CAV * 0.82}`} strokeLinecap="round" />
          
          {/* Seal - only when empty; lab only (hud64 empty cavity carries the
              engraved role glyph instead — R-214) */}
          {!isHud64 && resolvedState.sealVisible && (
            <g className="slot-v12__seal" opacity="0.16">
              <circle cx="0" cy="0" r={geometry.R_SEAL} fill="none" stroke={`rgba(${ARCANE_RGB},0.42)`} strokeWidth="0.46" />
              <circle cx="0" cy="0" r={geometry.R_SEAL * 0.54} fill="none" stroke={`rgba(${ARCANE_RGB},0.42)`} strokeWidth="0.46" />
              <circle cx="0" cy="0" r={geometry.R_SEAL * 0.16} fill="none" stroke={`rgba(${ARCANE_RGB},0.42)`} strokeWidth="0.46" />
              {Array.from({ length: 6 }, (_, i) => {
                const angle = (i / 6) * Math.PI * 2;
                return (
                  <line
                    key={`seal-line-${i}`}
                    x1={geometry.R_SEAL * 0.20 * Math.cos(angle)}
                    y1={geometry.R_SEAL * 0.20 * Math.sin(angle)}
                    x2={geometry.R_SEAL * 0.96 * Math.cos(angle)}
                    y2={geometry.R_SEAL * 0.96 * Math.sin(angle)}
                    stroke={`rgba(${ARCANE_RGB},0.42)`}
                    strokeWidth="0.46"
                  />
                );
              })}
              <polygon
                points={Array.from({ length: 6 }, (_, i) => {
                  const angle = (i / 6) * Math.PI * 2 - Math.PI / 6;
                  return `${(geometry.R_SEAL * 0.96 * Math.cos(angle)).toFixed(2)},${(geometry.R_SEAL * 0.96 * Math.sin(angle)).toFixed(2)}`;
                }).join(' ')}
                fill="none"
                stroke={`rgba(${ARCANE_RGB},0.42)`}
                strokeWidth="0.46"
                opacity="0.55"
              />
            </g>
          )}
        </g>
  );

  /* Engraved role glyph — hud64 empty cavity only (PLAN-043 WS-1): the slot's
   * declared role is etched on the obsidian, replaced by the portrait on seat. */
  const roleGlyphId = isHud64 && !resolvedState.medalVisible && role ? SLOT_ROLE_GLYPHS[role] : undefined;
  const glyphHalf = geometry.R_CAV * 0.4;
  const roleGlyph = roleGlyphId ? (
    <EngravedIcon
      id={roleGlyphId}
      x={-glyphHalf}
      y={-glyphHalf}
      width={glyphHalf * 2}
      height={glyphHalf * 2}
      style={{ color: `rgba(${ARCANE_RGB},0.55)` }}
      data-layer="role-glyph"
    />
  ) : null;

  const medalLayer = resolvedState.medalVisible && !isHud64 ? (
          <g clipPath="url(#slot-v12-clip-medal)" data-layer="medal">
            <circle cx="0" cy="0" r={geometry.R_MED_OUT} fill="#1a0c04" />
            <circle cx="0" cy="0" r={geometry.R_MED_OUT} fill="url(#slot-v12-medal-outer)" opacity="0.90" 
              style={{ animation: 'rim-idle 9.4s ease-in-out infinite' }} />
            <circle cx="0" cy="0" r={geometry.R_MED_OUT} fill="url(#slot-v12-medal-shine)" opacity="0.42" />
            <circle cx="0" cy="0" r={geometry.R_MED_OUT - 1.5} fill="none" stroke="rgba(255,250,178,0.52)" strokeWidth="0.9"
              strokeDasharray={`${geometry.R_MED_OUT * 1.58} 999`} strokeDashoffset={`${geometry.R_MED_OUT * 1.82}`} strokeLinecap="round" />
            <circle cx="0" cy="0" r={geometry.R_MED_RING} fill="#130902" />
            <circle cx="0" cy="0" r={geometry.R_MED_RING} fill="url(#slot-v12-medal-ring)" opacity="0.65" />
            <circle cx="0" cy="0" r={geometry.R_MED_RING} fill="none" stroke="rgba(0,0,0,0.72)" strokeWidth="2.2" transform="translate(0.3, 0.35)" />
            <circle cx="0" cy="0" r={geometry.R_MED_RING - 0.4} fill="none" stroke="rgba(255,222,120,0.14)" strokeWidth="0.7" />
            <circle cx="0" cy="0" r={geometry.R_MED_FLD} fill="url(#slot-v12-medal-field)" />
            {/* PG Token or Letter - unified piece */}
            {pgTokenVisible ? (
              <text
                x="0"
                y="1.5"
                textAnchor="middle"
                dominantBaseline="middle"
                fontFamily="system-ui, -apple-system, sans-serif"
                fontSize={geometry.R_MED_POR * 0.65}
                fontWeight="700"
                fill="rgba(255,255,255,0.92)"
                style={{ pointerEvents: 'none' }}
              >
                {t('idleVillage:medalOverlay.token', { defaultValue: 'PG' })}
              </text>
            ) : (
              <text
                x="0"
                y="1.5"
                textAnchor="middle"
                dominantBaseline="middle"
                fontFamily="Cinzel, Georgia, serif"
                fontSize={geometry.R_MED_POR * 0.80}
                fontWeight="600"
                fill="rgba(200,155,50,0.68)"
                style={{ pointerEvents: 'none' }}
              >
                {letter}
              </text>
            )}
            <circle cx="0" cy="0" r={geometry.R_MED_POR} fill="none" stroke="rgba(180,110,28,0.28)" strokeWidth="1.5" />
            <circle cx="0" cy="0" r={geometry.R_MED_POR} fill="none" stroke="rgba(0,0,0,0.60)" strokeWidth="1.8" transform="translate(0.28, 0.35)" />
            <circle cx="0" cy="0" r={geometry.R_MED_POR - 0.3} fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="0.6"
              strokeDasharray={`${geometry.R_MED_POR * 1.90} 999`} strokeDashoffset={`${geometry.R_MED_POR * 2.12}`} strokeLinecap="round" />
            <circle cx="0" cy="0" r={geometry.R_MED_FLD} fill="none" stroke="rgba(0,0,0,0.48)" strokeWidth="4"
              strokeDasharray={`${geometry.R_MED_FLD * Math.PI} ${geometry.R_MED_FLD * Math.PI}`} strokeDashoffset={`-${geometry.R_MED_FLD * Math.PI / 4}`} strokeLinecap="round" />
            
            {/* Debug visualization - moved to the end to appear on top */}
            {debugViz && (
              <>
                <circle cx="0" cy="0" r={geometry.R_MED_OUT + 5} fill={debugViz.colors.medal} opacity="1.0" />
                <circle cx="0" cy="0" r={geometry.R_MED_OUT + 5} fill="none" stroke={debugViz.colors.medal} strokeWidth="3" />
              </>
            )}
          </g>
  ) : null;

  /* Layer 4: gem pointer at 6 o'clock — the seated counterpart of the dragged
   * token's gem. Painted after the bezel so it sits above the frame. */
  const gemPointer = resolvedState.medalVisible ? <SlotGemPointer cy={geometry.R_MED_OUT + 4} /> : null;

  const seatCycle = (
    /* Layer 3: Bezel + Teeth — keyed SeatCycle subtree (PLAN-043 WS-1 T1.2). */
    <SeatCycle
      key={seatNonce}
      resolvedState={resolvedState}
      extractionProgress={extractionProgress}
      geometry={geometry}
      tok={tok}
      toothAngles={toothAngles}
      debugViz={debugViz}
      seatNonce={seatNonce}
      spec={spec}
      bezel={bezel}
    />
  );

  if (isHud64) {
    /* Two-plane layout (PLAN-043 WS-1 T1.1): under-SVG (socket/cavity/arcane/glyph)
     * → DOM portrait (44px, mounted by the rack at z-10) → over-SVG (bezel+teeth,
     * pointer-events:none, overflow:visible for the bounded slam overhang). */
    const bitePx = spec.portraitSizePx / 2 - (geometry.R_BZ_IN - geometry.TOOTH_HEIGHT) * ((spec.domSizePx ?? 64) / 158);
    const planeStyle: React.CSSProperties = { display: 'block', width: '100%', height: '100%' };
    return (
      <div
        className={clsx('slot-v12', `slot-v12--${state}`, className)}
        data-slot-state={state}
        data-variant="hud64"
        data-bite={bitePx.toFixed(2)}
        style={{ width: spec.domSizePx, height: spec.domSizePx }}
      >
        <style dangerouslySetInnerHTML={{ __html: cssText }} />
        <div className="slot-v12__halo" aria-hidden />
        <svg
          className="slot-v12__under"
          viewBox={spec.viewBox}
          role="img"
          aria-label={t('idleVillage:slotRack.ariaLabel', { defaultValue: 'Slot {state}', state: stateLabel })}
          style={planeStyle}
        >
          {defsNode}
          {cavityLayer}
          {roleGlyph}
        </svg>
        <svg
          className="slot-v12__over"
          viewBox={spec.viewBox}
          aria-hidden="true"
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', overflow: 'visible', pointerEvents: 'none', zIndex: 20 }}
        >
          {seatCycle}
          {gemPointer}
          {debugViz && renderDebugLabel('GHIERA', -geometry.R_BZ_OUT - 26)}
        </svg>
      </div>
    );
  }

  return (
    <div className={clsx('slot-v12', `slot-v12--${state}`, className)} data-slot-state={state} style={sizePx ? { width: sizePx, height: sizePx } : undefined}>
      <style dangerouslySetInnerHTML={{ __html: cssText }} />
      <div className="slot-v12__halo" aria-hidden />
      <svg viewBox="-120 -120 240 240" role="img" aria-label={t('idleVillage:slotRack.ariaLabel', { defaultValue: 'Slot {state}', state: stateLabel })}>
        {defsNode}

        {/* Layer 1: Cavity with complex filters and clipPath */}
        {cavityLayer}

        {/* Layer 2: Medal - only when occupied */}
        {medalLayer}

        {seatCycle}

        {/* Layer 4: Gem pointer at 6 o'clock — the seated counterpart of the
            dragged token's gem. Drawn AFTER the bezel so it is always mounted
            ABOVE the frame and never swallowed when the token snaps home. */}
        {gemPointer}

        {debugViz && renderDebugLabel('MEDAGLIA · layer 2', geometry.R_MED_OUT + 26)}
        {debugViz && renderDebugLabel('GHIERA', -geometry.R_BZ_OUT - 26)}
      </svg>
    </div>
  );
};

export default SlotV12Renderer;
