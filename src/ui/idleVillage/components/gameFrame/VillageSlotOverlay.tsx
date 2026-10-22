import React from 'react';
import { SkinScope } from '@/ui/idleVillage/skins/primitives/SkinScope';
import {
  footprintOf,
  hasFootprint,
  VILLAGE_BUILDINGS_CONFIG,
  VILLAGE_CANVAS,
  type PaintedVillageBuilding,
} from '@/balancing/config/idleVillage/villageBuildingsConfig';

/**
 * Village slot overlay (PLAN-038, web-debate artifact r003).
 *
 * One decorative SVG layer between the painted background and the DOM pins:
 * state treatments are PAINTED OVER the existing buildings — the painting
 * itself is the building, so `built` regions get no mark at all. `buildable`
 * draws a "surveyor's ring" (dark underlay + brass dashed footprint ellipse)
 * with stake ticks; `locked` gets a feathered radial vignette + dotted ring.
 *
 * Contracts (from the debate):
 *  - `pointer-events: none`, `aria-hidden` — the layer never intercepts
 *    clicks/hovers and never becomes a tooltip-arbitration target.
 *  - Bboxes are authoring data, NEVER rendered — the mark is the derived
 *    footprint ellipse on the ground (cy = y + 0.92h, rx = 0.5w, ry = 0.2·rx),
 *    overridable per building via `ellipseOverride`.
 *  - One stable `<g data-region>` per building regardless of state so pin→region
 *    highlight (`:has()`) and future state changes never alter the structure.
 *  - Pop-in uses the standalone `scale` property (transform belongs to pins).
 *  - All animation is opacity/scale keyframes; count is bounded by the number
 *    of non-built buildings. No per-frame JS.
 */

/** CSS vars so SkinScope themes the overlay like every other HUD surface.
 *  Re-plated to the Roster range (PLAN-043 WS-5): the underlay sits on the
 *  lifted teal lacquer, the ring reads in worn bright brass — the deep
 *  lacquer/base brass pair was invisible over the painted ground. */
const UNDERLAY = 'var(--skin-hud-lacquer-base)';
const BRASS = 'var(--skin-hud-brass-hi)';
const BRASS_HI = 'var(--skin-hud-brass-crest)';

/** Re-export so existing imports keep resolving — the implementation lives in
 *  the config module (PLAN-042: `occludedAt` shares the math). The config
 *  version fixes a latent PLAN-038 bug: `ellipseOverride` is normalized (0–1)
 *  and is now correctly scaled to canvas pixels (the raw use put the
 *  watchtower mark at ~1 px). */
export { footprintOf };

/** Buildable: 4 stake ticks radiating outward from the ring at N/E/S/W. */
const StakeTicks: React.FC<{ cx: number; cy: number; rx: number; ry: number }> = ({ cx, cy, rx, ry }) => (
  <g className="vslot-ticks" stroke={BRASS} strokeWidth={6} strokeLinecap="round" opacity={0.85}>
    {([0, 90, 180, 270] as const).map((deg) => {
      const rad = (deg * Math.PI) / 180;
      const x1 = cx + rx * Math.cos(rad);
      const y1 = cy + ry * Math.sin(rad);
      const dx = Math.cos(rad) * 18;
      const dy = Math.sin(rad) * 18;
      return <line key={deg} x1={x1} y1={y1} x2={x1 + dx} y2={y1 + dy} />;
    })}
  </g>
);

/** Level ≥2: brass pennant on a pole standing ON the ground line at the
 *  region's right edge — planted, never floating over the roofline. */
const Pennant: React.FC<{ b: PaintedVillageBuilding }> = ({ b }) => {
  const ell = footprintOf(b);
  const poleX = ell.cx + ell.rx * 0.92;
  const poleBase = ell.cy + ell.ry * 0.4;
  const poleH = Math.min(150, Math.max(90, b.region.h * VILLAGE_CANVAS.heightPx * 0.5));
  const poleTop = poleBase - poleH;
  return (
    <g className="vslot-pennant">
      <line x1={poleX} y1={poleTop} x2={poleX} y2={poleBase} stroke={UNDERLAY} strokeWidth={8} strokeLinecap="round" />
      <line x1={poleX} y1={poleTop} x2={poleX} y2={poleBase} stroke={BRASS} strokeWidth={3.5} strokeLinecap="round" />
      <path
        d={`M${poleX + 2} ${poleTop + 6} l72 17 -72 17 z`}
        fill={BRASS}
        stroke={UNDERLAY}
        strokeWidth={4}
        strokeLinejoin="round"
      />
    </g>
  );
};

export interface VillageSlotOverlayProps {
  /** PLAN-042: shared `activeBuildingId` — lights the footprint ping of the
   *  matching painted building when a registry row (or pin) is hovered.
   *  `null`/undefined = idle. */
  activeId?: string | null;
}

export const VillageSlotOverlay: React.FC<VillageSlotOverlayProps> = ({ activeId }) => {
  /* Painted entries only — registry-only buildings have no footprint (PLAN-042). */
  const buildings = VILLAGE_BUILDINGS_CONFIG.buildings.filter(hasFootprint);

  return (
    <SkinScope
      style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
      aria-hidden="true"
      data-testid="village-slot-overlay"
    >
      <svg
        width="100%"
        height="100%"
        viewBox={`0 0 ${VILLAGE_CANVAS.widthPx} ${VILLAGE_CANVAS.heightPx}`}
        preserveAspectRatio="none"
        style={{ display: 'block' }}
      >
        <defs>
          <radialGradient id="vslot-scrim" cx="50%" cy="55%" r="60%">
            <stop offset="0%" stopColor={UNDERLAY} stopOpacity={0.35} />
            <stop offset="100%" stopColor={UNDERLAY} stopOpacity={0} />
          </radialGradient>
          <style>{`
            .vslot-group { scale: 0; transform-box: fill-box; transform-origin: center; animation: vslot-pop 320ms cubic-bezier(.2,1.4,.3,1) forwards; }
            .vslot-underlay { animation: vslot-breathe 2.4s ease-in-out infinite; }
            @keyframes vslot-pop { from { scale: .5; opacity: 0; } to { scale: 1; opacity: 1; } }
            @keyframes vslot-breathe { 0%,100% { opacity: .55; } 50% { opacity: 1; } }
            .vslot-ping { fill: none; stroke-width: 3; opacity: 0; transition: opacity 140ms ease-out; }
            .vslot-group[data-highlight] .vslot-ping { opacity: 1; }
            @media (prefers-reduced-motion: reduce) {
              .vslot-group, .vslot-underlay { animation: none !important; scale: 1; }
            }
          `}</style>
        </defs>
        {buildings.map((b, i) => (
          <g
            key={b.id}
            data-region={b.id}
            data-state={b.initialState}
            data-highlight={activeId === b.id || undefined}
            className="vslot-group"
            style={{ animationDelay: `${i * 60}ms` }}
          >
            <SlotMark b={b} />
          </g>
        ))}
      </svg>
      {/* Pin → region glow: pure CSS, one-directional. A hovered/focused pin
       *  flips the matching <g> to full highlight via these rules (the id is
       *  interpolated per building in the style block below). */}
      <style>{buildings.map((b) => `
          [data-testid="village-stage"]:has([data-building-pin="${b.id}"]:hover) [data-region="${b.id}"] .vslot-ping,
          [data-testid="village-stage"]:has([data-building-pin="${b.id}"]:focus-visible) [data-region="${b.id}"] .vslot-ping {
            opacity: ${b.initialState === 'built' ? 0.55 : 1};
          }
        `).join('\n')}</style>
    </SkinScope>
  );
};

/** Per-building mark: footprint ellipse for non-built + glow ping + pennant. */
const SlotMark: React.FC<{ b: PaintedVillageBuilding }> = ({ b }) => {
  const ell = footprintOf(b);
  const built = b.initialState === 'built';
  const locked = b.initialState === 'locked';
  const showPennant = built && b.initialLevel >= 2;

  return (
    <>
      {locked && (
        <ellipse cx={ell.cx} cy={ell.cy} rx={ell.rx * 1.9} ry={ell.ry * 3.4} fill="url(#vslot-scrim)" />
      )}
      {!built && (
        <g>
          <ellipse className="vslot-underlay" cx={ell.cx} cy={ell.cy} rx={ell.rx} ry={ell.ry} fill="none" stroke={UNDERLAY} strokeWidth={8} />
          <ellipse
            cx={ell.cx}
            cy={ell.cy}
            rx={ell.rx}
            ry={ell.ry}
            fill="none"
            stroke={BRASS}
            strokeWidth={5}
            strokeDasharray={locked ? '4 10' : '14 10'}
            strokeLinecap="round"
            opacity={locked ? 0.55 : 0.95}
          />
          {!locked && b.stakeTicks && <StakeTicks cx={ell.cx} cy={ell.cy} rx={ell.rx} ry={ell.ry} />}
        </g>
      )}
      {/* Highlight ping — all 11 buildings keep one so pin→region glow works
       *  for built too (it traces the footprint, not a state mark). */}
      <ellipse className="vslot-ping" cx={ell.cx} cy={ell.cy} rx={ell.rx * 1.06} ry={ell.ry * 1.3} stroke={BRASS_HI} />
      {showPennant && <Pennant b={b} />}
    </>
  );
};

export default VillageSlotOverlay;
