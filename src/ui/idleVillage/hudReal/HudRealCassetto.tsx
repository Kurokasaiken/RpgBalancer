/**
 * HudRealCassetto — the expedition planner drawer (dossier on map).
 *
 * R-357 / PLAN-125: DOM drawer rebuilt from the approved golden `.mw/specs/expedition-ui/refs/mockup-r357-cassetto-largo.png`
 * (Director 2026-11-17: «È la base»). RESTORED 2026-11-20 after a parallel session had reverted it to the baked
 * `column-*-extracted.webp` art (cut, stretched, absolute zones, no SUPPLIES block, no wide column).
 * Only the pieces SLICED from the golden stay painted (left rail, north bar, vignette fallback, skull, chest, the CTA button built
 * from the golden's clean right half mirrored — `scripts/build-cassetto3-assets.py`); everything else is live DOM: text, party rack,
 * supplies niches, journey strip, CONFIRM label. No resources band (D-1), no «EXPEDITION CONSOLE», no cost cell (INV-5 amended).
 * Features kept from the parallel session: × discards (adapter-owned), DEATHS%/SUCCESS%, per-quest vignette and pouch count,
 * R-359 slot swap, lateral slide (ExpeditionDrawer).
 *
 * Geometry: a 1024-unit design width (`u`) rendered in `cqw`, column width = `drawer.columnAspect × viewportHeight` (512 px at
 * 1440×900), flush with the screen's right edge. Blocks (`data-block`): quest-banner / party-slots / bag-slots (SUPPLIES) /
 * journey-strip / risk-rewards / launch-cta.
 */
import React, { useSyncExternalStore } from 'react';
import { useTranslation } from 'react-i18next';
import { useGameLayoutInsets } from '@/ui/idleVillage/store/useGameLayoutInsets';
import { ResidentSlotRack } from '@/ui/idleVillage/components/ResidentSlotRack';
import type { ResidentSlotViewModel, SlotSeatPhase } from '@/ui/idleVillage/slots/types';
import { StashItemTile } from '@/ui/idleVillage/components/gameFrame/stashItemFace';
import type { ResourceReadoutItem } from '@/ui/idleVillage/components/gameFrame/ResourceReadout';
import { CASSETTO_LAYOUT_CONFIG } from '@/balancing/config/idleVillage/cassettoLayoutConfig';
import { CASSETTO_WIDE_BREAKPOINT, cassettoColumnSpec, cassettoColumnWidthFor } from './layout/cassettoColumn';

const C = {
  ink: '#f3e7c4',
  muted: '#8fb2a2',
  goldHi: '#f1d88a', /* = HudRealNav C.gold */
  gold: '#c2a355', /* = --skin-hud-brass-mid, the nav's brass */
  /** R-357 palette (Director: «troppo Gold … il componente in basso al centro è il golden standard»): titles and numbers read
   *  ivory/champagne like the bottom nav labels; gold stays for rims, icons and the frame. */
  title: '#e6dcb8', /* = HudRealNav label ink */
  titleSoft: '#c9d6c6',
  danger: '#e86a5e',
  /** The skull emblem's own red (eyes #b70b05, brightened ~10% for legibility on the enamel) — the death % uses it (Director 2026-11-20). */
  bordeaux: '#c9140b',
  shadow: '0 14px 44px rgba(0,0,0,.68)',
} as const;

export interface CassettoLeg { label: string; days: number | string }
export interface CassettoQuest {
  title: string;
  subtitle?: string;
  briefing: string;
  /** Director 2026-11-20 «vignetta da quest»: the quest's own cover art heads the column. Absent = the golden's default
   *  vignette (`cassetto/vignette.webp`). */
  vignette?: string;
  legs: CassettoLeg[];
  /** Explicit total under the legs ("Total: N days"), from the same quest config. */
  totalDays?: number;
  riskLabel: string;
  /** Danger level 1..`riskLevelMax` (the band's index in DANGER_BANDS) → that many skulls light up under the death %. Absent = pending. */
  riskLevel?: number;
  riskLevelMax?: number;
  /** The danger band only exists once the party is full and the forecast has run. While it does not, the value is NOT a danger
   *  reading — it renders muted (INV:cassetto-risk-pending-muted). */
  riskPending?: 'incomplete' | 'computing';
  /** Director ruling 2026-11-20: "% morte" next to the risk value — the party sim's `anyDeathPct`. Absent while pending. */
  deathPct?: number;
  rewards: { icon: string; qty: string }[];
  /** Director ruling 2026-11-20: "% riuscita" next to the reward — the sim's `outcomePct.reward`. */
  successPct?: number;
  /** DEPRECATED (hud-real-cassetto.INV-5 / cassetto-no-cost-cell): kept in the model for source compat, NEVER painted. */
  costPreview?: { icon: string; qty: string; insufficient?: boolean };
}
export interface CassettoLoadoutSlot {
  id: string;
  icon?: string;
  label: string;
  qty?: number;
}

/**
 * The quest bag as SLOT FRAMES (R-337): `bagSlots` niches in order, `null` = empty pouch. Items arrive ONLY by clicking rows in the
 * bound magazzino (`VillageStashPanel`): an empty pouch opens it (`onOpenStash`), a packed tile releases its item (`onReleaseItem`).
 */
export interface CassettoLoadout {
  slots: (CassettoLoadoutSlot | null)[];
  onReleaseItem: (itemId: string) => void;
  onOpenStash: (trigger: HTMLElement) => void;
}

export interface HudRealCassettoProps {
  quest: CassettoQuest;
  /** The REAL rack view models — the session's `controller.slots`, never lab fabrications. */
  slots: ResidentSlotViewModel[];
  /** @deprecated D-1 (R-357): the drawer carries no resources band. Accepted so callers compile. */
  resourceItems?: ResourceReadoutItem[];
  onSlotClick?: (slotId: string) => void;
  onSlotClear?: (slotId: string) => void;
  /** R-357: pressing the › in the party block opens the roster panel. */
  onOpenRoster?: () => void;
  suppressedResidentIds?: readonly string[];
  /** R-359: seat-phase guard callback for slot-token swap/extract — without it the rack runs swap drags blind. */
  onSlotPhaseChange?: (slotId: string, phase: SlotSeatPhase) => void;
  loadout?: CassettoLoadout;
  canSend?: boolean;
  /** Why CONFIRM is muted, shown inline just above the button. Null/undefined renders nothing. */
  disabledReason?: string | null;
  onConfirm?: () => void;
  /** Director ruling 2026-11-20 «× chiudi e perdi tutto»: the × button (and Esc) CLOSE the planner and the adapter owns the
   *  discard — fold via the edge chip keeps the draft instead. Absent = no × mounts and Escape is inert. */
  onClose?: () => void;
}

/** Design width of the golden in px; every `u(n)` is n/1024 of the column width. */
const DESIGN_W = 1024;
const u = (n: number) => `${(n / DESIGN_W) * 100}cqw`;

/** The smallest legible size, in rendered CSS px, for any caption in the drawer (INV:cassetto-captions-min-size). */
export const CASSETTO_MIN_LABEL_PX = 11;
/** The party rack is rendered unscaled in the DOM drawer; its labels are un-scaled by this factor (kept for API/test compat). */
export const CASSETTO_RACK_SCALE = 1;
const fzMin = (n: number) => `max(${CASSETTO_MIN_LABEL_PX}px, ${u(n)})`;

/** Painted pieces sliced from the golden (PLAN-127 slice-kit location; identical bytes to `cassetto3/`). */
const ASSET = '/assets/ui/hud-real/slicekit/cassetto';
const RAIL_W = 100;
const RAIL_TOP_H = 360;
const RAIL_BOTTOM_H = 376;
/** The CTA button asset (1500×317, both arrow tips, transparent ground) scaled to 880u: 12 px clear of the rail, 10 px of the edge. */
const PLAQUE_W = 1500;
const PLAQUE_H = 317;
const CTA_W = 880, CTA_RIGHT_GAP = 20, CTA_BOTTOM_GAP = 30;  /* lifted: it no longer sits on the screen edge, the south frame bar closes the column under it */
const CTA_H = CTA_W * PLAQUE_H / PLAQUE_W;

/** Viewport-wide variant switch kept for API compatibility (the art no longer varies). */
const WIDE_MQ = `(min-width: ${CASSETTO_WIDE_BREAKPOINT}px)`;
const subscribeWide = (cb: () => void) => {
  const mq = window.matchMedia(WIDE_MQ);
  mq.addEventListener('change', cb);
  return () => mq.removeEventListener('change', cb);
};
const readWide = () => window.matchMedia(WIDE_MQ).matches;
/** The live column spec for the current viewport width — shared with the `ExpeditionDrawer` fold chip. */
export const useCassettoColumnSpec = () => {
  const wide = useSyncExternalStore(subscribeWide, readWide, () => true);
  return cassettoColumnSpec(wide ? 1440 : 1280);
};

/* CONFIRM states read ONLY the skin tokens named in `CASSETTO_LAYOUT_CONFIG.cta.vars` (AC8). */
const CTA_VARS = CASSETTO_LAYOUT_CONFIG.cta.vars;

const RACK_SCOPED_CSS = `
[data-hudreal-cassetto] [data-testid="resident-slot-rack"] {
  --slot-rack-gap: 10px;
  display: grid !important;
  grid-auto-flow: column !important;
  grid-auto-columns: 104px !important;
  grid-template-columns: none !important;
  gap: 6px !important;
  align-items: start !important;
  justify-items: center !important;
}
/* The rack's 9px labels are raised to the legibility floor; two centered balanced lines are fine. */
[data-hudreal-cassetto] [data-testid="resident-slot-rack"] p {
  font-size: ${(CASSETTO_MIN_LABEL_PX / CASSETTO_RACK_SCALE).toFixed(2)}px !important;
  letter-spacing: 0.04em !important;
  line-height: 1.1 !important;
  margin-top: 8px !important;
  text-align: center !important;
  text-wrap: balance;
  white-space: normal !important;
}
/* CONFIRM — the button IS the painted plaque (label inpainted away) with a live DOM label. State looks are filters on the
   picture (tokens); nothing is drawn over it except the text. */
[data-hudreal-cassetto] [data-testid="cassetto-confirm"] .confirm-art { transition: filter 170ms ease; }
[data-hudreal-cassetto] [data-testid="cassetto-confirm"]:not(:disabled):hover .confirm-art { filter: ${CTA_VARS.enamelHoverFilter}; }
[data-hudreal-cassetto] [data-testid="cassetto-confirm"]:not(:disabled):active .confirm-art { filter: ${CTA_VARS.enamelPressFilter}; }
[data-hudreal-cassetto] [data-testid="cassetto-confirm"]:disabled .confirm-art { filter: ${CTA_VARS.enamelDisabled}; }
[data-hudreal-cassetto] [data-testid="cassetto-confirm"] .confirm-text {
  color: ${CTA_VARS.text};
  text-shadow: ${CTA_VARS.textShadow};
  transition: transform 110ms ease, text-shadow 170ms ease;
}
[data-hudreal-cassetto] [data-testid="cassetto-confirm"]:disabled .confirm-text { opacity: ${CTA_VARS.mutedOpacity}; }
[data-hudreal-cassetto] [data-testid="cassetto-confirm"]:not(:disabled):hover .confirm-text { text-shadow: ${CTA_VARS.hoverTextGlow}; }
[data-hudreal-cassetto] [data-testid="cassetto-confirm"]:not(:disabled):active .confirm-text { transform: translateY(1px); }
[data-hudreal-cassetto] [data-testid="cassetto-confirm"]:focus-visible { outline: 2px solid ${CTA_VARS.focusRing}; outline-offset: 3px; border-radius: 999px; }
/* supplies scroller — slim brass scrollbar */
[data-hudreal-cassetto] [data-cassetto-bag-scroll] { scrollbar-width: thin; scrollbar-color: #c2a355 transparent; }
/* Arrows that open a tool (roster / stash): hover ignites them. */
[data-hudreal-cassetto] [data-cassetto-opener] { transition: filter 160ms ease; }
[data-hudreal-cassetto] [data-cassetto-opener]:hover { filter: brightness(1.2); }
[data-hudreal-cassetto] [data-cassetto-opener]:focus-visible { outline: 2px solid ${C.goldHi}; outline-offset: 2px; border-radius: 6px; }
/* Bag niches — pouch brightens on hover, packed tiles lift and glow. */
[data-hudreal-cassetto] [data-testid^="bag-slot-empty-"] img { transition: opacity 160ms ease, filter 160ms ease; }
[data-hudreal-cassetto] [data-testid^="bag-slot-empty-"]:hover img { opacity: 1 !important; filter: drop-shadow(0 0 6px rgba(223,184,87,0.6)) !important; }
[data-hudreal-cassetto] [data-testid^="loadout-item-"] { transition: filter 160ms ease, transform 120ms ease; border-radius: 8px; }
[data-hudreal-cassetto] [data-testid^="loadout-item-"]:hover { filter: brightness(1.18) drop-shadow(0 0 5px rgba(223,184,87,0.45)); transform: translateY(-1px); }
[data-hudreal-cassetto] [data-testid^="loadout-item-"]:active { transform: translateY(0) scale(0.95); }
`;

const CINZEL = 'Cinzel, "EB Garamond", serif';

/** A framed block (well): brass hairline, dark enamel fill. */
const wellStyle: React.CSSProperties = {
  position: 'relative',
  border: `1px solid ${C.gold}55`,
  borderRadius: u(20),
  background: 'linear-gradient(180deg, rgba(4,40,30,.42), rgba(3,32,25,.52))',
  boxShadow: 'inset 0 0 0 1px rgba(240,214,138,.08), inset 0 10px 24px rgba(0,0,0,.28)',
};

/** Small `›` in the corner of a block that opens a tool (roster / stash). The block has no text title (Director 2026-11-17); the
 *  label stays as the accessible name. */
const OpenerArrow: React.FC<{ onPress: (el: HTMLElement) => void; label: string; testId: string }> = ({ onPress, label, testId }) => (
  <button
    type="button"
    data-cassetto-opener=""
    data-testid={testId}
    aria-label={label}
    onClick={(e) => onPress(e.currentTarget)}
    style={{ position: 'absolute', right: u(10), top: u(8), width: u(60), height: u(60), padding: 0, border: 'none', background: 'transparent', cursor: 'pointer', color: C.title, fontSize: fzMin(58), lineHeight: 1, fontFamily: CINZEL, pointerEvents: 'auto', zIndex: 3 }}
  >›</button>
);

/** The % readout (Director 2026-11-20: a big number beside the emblem). Pending → a muted dash, same height. */
const BigPct: React.FC<{ pct?: number; tone: 'danger' | 'gold'; label: string; testId: string; leading?: React.ReactNode }> = ({ pct, tone, label, testId, leading }) => {
  const color = tone === 'danger' ? C.bordeaux : C.goldHi;
  const known = pct != null;
  return (
    <span
      data-testid={known ? testId : `${testId}-pending`}
      role={known ? 'img' : undefined}
      aria-label={known ? label : undefined}
      aria-hidden={known ? undefined : true}
      title={known ? label : undefined}
      style={{ display: 'inline-flex', alignItems: 'center', gap: u(8), fontFamily: CINZEL, fontSize: fzMin(66), fontWeight: 700, letterSpacing: '0.02em', lineHeight: 1, color: known ? color : C.muted, opacity: known ? 1 : 0.55, textShadow: '0 1px 3px rgba(0,0,0,.85)', whiteSpace: 'nowrap' }}
    >
      {leading}
      {known ? `${Math.round(pct as number)}%` : '—'}
    </span>
  );
};

/** Danger level as skulls: `level` of `max` lit (the small copy of the emblem), the rest dimmed. */
const SkullLevel: React.FC<{ level?: number; max: number; label: string }> = ({ level, max, label }) => (
  <span data-testid="cassetto-risk-value" role="img" aria-label={label} title={label} data-risk-level={level ?? 0} style={{ display: 'inline-flex', gap: u(6), alignItems: 'center' }}>
    {Array.from({ length: max }, (_, i) => (
      <img key={i} src={`${ASSET}/skull.webp`} alt="" draggable={false} data-skull={i < (level ?? 0) ? 'on' : 'off'} style={{ width: u(40), height: u(40), objectFit: 'contain', filter: i < (level ?? 0) ? 'none' : 'grayscale(1) brightness(.55)', opacity: i < (level ?? 0) ? 1 : 0.4 }} />
    ))}
  </span>
);

/** Party seats, THREE at a time, bigger (Director 2026-11-20: «mettine 3, più grandi e il pulsante per far vedere quello dopo»):
 *  a clipped viewport of `PARTY_VISIBLE` columns that slides one seat per click; the arrows only mount when there are more seats than fit. */
const PARTY_VISIBLE = 3;
const PARTY_COL_PX = 104;
const PARTY_GAP_PX = 6;
const PartyPager: React.FC<{ count: number; children: React.ReactNode; prevLabel: string; nextLabel: string }> = ({ count, children, prevLabel, nextLabel }) => {
  const [first, setFirst] = React.useState(0);
  const max = Math.max(0, count - PARTY_VISIBLE);
  const at = Math.min(first, max);
  const arrow = (dir: -1 | 1, label: string, disabled: boolean): React.ReactNode => (
    <button
      type="button"
      data-testid={dir < 0 ? 'cassetto-party-prev' : 'cassetto-party-next'}
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={() => setFirst(Math.max(0, Math.min(max, at + dir)))}
      style={{ flexShrink: 0, width: u(58), height: u(58), borderRadius: '50%', padding: 0, border: `1.5px solid ${C.gold}`, color: C.title, fontFamily: CINZEL, fontSize: fzMin(40), lineHeight: 1, cursor: disabled ? 'default' : 'pointer', opacity: disabled ? 0.3 : 1, display: 'grid', placeItems: 'center', pointerEvents: 'auto', background: 'radial-gradient(circle at 35% 28%, #17503f, #08241d 75%)', boxShadow: '0 2px 6px rgba(0,0,0,.6), inset 0 0 0 1px rgba(240,214,138,.2)' }}
    >{dir < 0 ? '‹' : '›'}</button>
  );
  return (
    <div data-cassetto-party-pager="" data-first={at} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: u(6) }}>
      {count > PARTY_VISIBLE && arrow(-1, prevLabel, at <= 0)}
      <div style={{ width: PARTY_VISIBLE * PARTY_COL_PX + (PARTY_VISIBLE - 1) * PARTY_GAP_PX, overflow: 'hidden', zoom: 1.15, padding: '12px 0 4px' }}>
        <div style={{ transform: `translateX(-${at * (PARTY_COL_PX + PARTY_GAP_PX)}px)`, transition: 'transform 220ms cubic-bezier(0.22, 1, 0.36, 1)', width: 'max-content' }}>{children}</div>
      </div>
      {count > PARTY_VISIBLE && arrow(1, nextLabel, at >= max)}
    </div>
  );
};

export const HudRealCassetto: React.FC<HudRealCassettoProps> = ({
  quest, slots, onSlotClick, onSlotClear, onOpenRoster, suppressedResidentIds, onSlotPhaseChange, loadout, canSend = true, disabledReason, onConfirm, onClose,
}) => {
  const { t } = useTranslation('idleVillage');
  const spec = useCassettoColumnSpec();

  /* The docked drawer publishes the screen width it occupies (`aspect × viewportHeight`, capped) into the shared insets ledger;
   * unmount restores 0 (INV-4). */
  React.useEffect(() => {
    const publish = useGameLayoutInsets.getState().publish;
    const update = () => publish({ right: Math.round(cassettoColumnWidthFor(spec, window.innerHeight)) });
    update();
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('resize', update);
      publish({ right: 0 });
    };
  }, [spec]);

  /* INV:cassetto-close — Esc (and a click on the map, below) closes (same handler, same discard semantics owned by the adapter). Ignored when
   * another handler already took the key (an open roster/stash menu) or while typing. No onClose → Esc is inert. */
  React.useEffect(() => {
    if (!onClose) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape' || e.defaultPrevented) return;
      const el = document.activeElement as HTMLElement | null;
      if (el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable)) return;
      onClose();
    };
    /* Director 2026-11-20: no × — the planner closes when you CLICK THE MAP outside it. Only a real click on the map canvas counts:
     * a pan/drag (moved > 6 px or held > 500 ms) does not, nor does anything inside the cassetto, the floating panels, a POI marker
     * or another HUD surface (those are DOM, the map is the only <canvas> under them). The adapter owns the discard (same as Esc). */
    let down: { x: number; y: number; t: number } | null = null;
    const onDown = (e: PointerEvent) => { down = { x: e.clientX, y: e.clientY, t: Date.now() }; };
    const onUp = (e: PointerEvent) => {
      const d = down; down = null;
      if (!d || e.button !== 0) return;
      if (Math.hypot(e.clientX - d.x, e.clientY - d.y) > 6 || Date.now() - d.t > 500) return;
      const target = e.target as HTMLElement | null;
      if (!(target instanceof HTMLCanvasElement) || target.closest('[data-hudreal-cassetto]')) return;
      onClose();
    };
    window.addEventListener('keydown', onKey);
    window.addEventListener('pointerdown', onDown, true);
    window.addEventListener('pointerup', onUp, true);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('pointerdown', onDown, true);
      window.removeEventListener('pointerup', onUp, true);
    };
  }, [onClose]);

  const cap = CASSETTO_LAYOUT_CONFIG.drawer.widthMaxPxExtracted;

  return (
    <div
      data-hudreal-cassetto=""
      style={{
        position: 'absolute', inset: 0,
        display: 'flex', alignItems: 'stretch', justifyContent: 'flex-end',
        fontFamily: '"EB Garamond", serif', color: C.ink,
        filter: `drop-shadow(${C.shadow})`,
        pointerEvents: 'none',
      }}
    >
      <style>{RACK_SCOPED_CSS}</style>
      {/* `cqw` resolves against the nearest ANCESTOR container: the outer box is the container (width), the inner box carries the
       *  `u()`-sized padding. */}
      <div
        data-cassetto-column=""
        style={{
          position: 'relative',
          width: `min(${spec.aspect} * 100vh, ${cap}px)`,
          containerType: 'inline-size',
          pointerEvents: 'auto',
          overflow: 'hidden',
        }}
      >
        {/* enamel field — starts under the rail, NOT at the column edge (no green bar left of the frame) */}
        <div aria-hidden style={{ position: 'absolute', left: u(36), right: 0, top: 0, bottom: 0, background: 'linear-gradient(90deg, #0a4a32 0%, #0c5439 45%, #0a4a33 100%)', pointerEvents: 'none' }} />
        <div
          style={{
            position: 'absolute', inset: 0,
            display: 'flex', flexDirection: 'column',
            paddingLeft: u(RAIL_W - 12), paddingRight: u(30), paddingBottom: u(CTA_H + CTA_BOTTOM_GAP + 30),
            boxSizing: 'border-box',
          }}
        >
          {/* ---------- painted frame (sliced from the golden) ---------- */}
          <div aria-hidden style={{ position: 'absolute', left: 0, top: u(RAIL_TOP_H - 4), bottom: u(RAIL_BOTTOM_H - 4), width: u(RAIL_W), backgroundImage: `url(${ASSET}/rail-mid.webp)`, backgroundRepeat: 'repeat-y', backgroundSize: `${u(RAIL_W)} auto`, pointerEvents: 'none' }} />
          <img aria-hidden alt="" draggable={false} src={`${ASSET}/rail-top.webp`} style={{ position: 'absolute', left: 0, top: 0, width: u(RAIL_W), height: u(RAIL_TOP_H), pointerEvents: 'none' }} />
          <img aria-hidden alt="" draggable={false} src={`${ASSET}/rail-bottom.webp`} style={{ position: 'absolute', left: 0, bottom: 0, width: u(RAIL_W), height: u(RAIL_BOTTOM_H), pointerEvents: 'none' }} />


          {/* south frame bar: the north bar mirrored vertically closes the frame under the button */}
          <img aria-hidden alt="" draggable={false} src={`${ASSET}/frame-top.webp`} style={{ position: 'absolute', left: u(92), bottom: 0, width: u(932), height: u(24), transform: 'scaleY(-1)', pointerEvents: 'none', zIndex: 2 }} />
          {/* north frame bar (sliced from the golden) — sits ABOVE the vignette, never cropped by it */}
          <img aria-hidden alt="" draggable={false} src={`${ASSET}/frame-top.webp`} style={{ position: 'absolute', left: u(92), top: 0, width: u(932), height: u(24), pointerEvents: 'none', zIndex: 2 }} />

          {/* ---------- quest-banner: vignette + title + briefing ---------- */}
          <div data-block="quest-banner" style={{ display: 'contents' }}>
            {/* Vignette: FIXED height in the golden's proportion (936×262 → a wide strip), thin champagne frame under it. A quest with its
             *  own cover art is cropped to the same strip (centre). */}
            {/* Bold champagne frame (Director 2026-11-20: «2 · Cornice più marcata»): a solid brass band like the left rail — bright
             *  centre line between darker edges — with the golden's corner curls and the bottom gem riding on it. */}
            <div data-cassetto-vignette-frame="" style={{ position: 'relative', flex: '0 0 auto', marginTop: u(32), marginLeft: u(6), marginRight: u(-14), padding: u(11), borderRadius: u(4),
              background: 'linear-gradient(135deg, #f6e3a0 0%, #c8a95a 28%, #f1d88a 50%, #b89844 74%, #8f7330 100%)',
              boxShadow: `0 3px 10px rgba(0,0,0,.55), inset 0 0 0 1px rgba(255,244,200,.55), inset 0 0 0 ${u(4)} rgba(122,90,30,.55)` }}>
              <div style={{ position: 'relative', height: u(228), overflow: 'hidden', borderRadius: u(2), boxShadow: 'inset 0 0 0 1px rgba(20,12,4,.85), 0 0 0 1px rgba(20,12,4,.7)' }}>
                <img
                  alt="" aria-hidden draggable={false}
                  data-cassetto-vignette=""
                  src={quest.vignette ?? `${ASSET}/vignette.webp`}
                  style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: quest.vignette ? 'center 18%' : 'left top' }}
                />
              </div>
              {([['left', 'top', ''], ['right', 'top', 'scaleX(-1)'], ['left', 'bottom', 'scaleY(-1)'], ['right', 'bottom', 'scale(-1,-1)']] as const).map(([h, v, tf]) => (
                <img key={`${h}${v}`} aria-hidden alt="" draggable={false} src={`${ASSET}/cart-corner.webp`} style={{ position: 'absolute', [h]: u(-8), [v]: u(-8), width: u(60), height: u(58), transform: tf || undefined, pointerEvents: 'none', filter: 'drop-shadow(0 1px 1px rgba(0,0,0,.6))' }} />
              ))}
              <img aria-hidden alt="" draggable={false} src={`${ASSET}/cart-gem.webp`} style={{ position: 'absolute', left: '50%', bottom: u(-24), width: u(132), height: u(42), transform: 'translateX(-50%)', pointerEvents: 'none', filter: 'drop-shadow(0 1px 1px rgba(0,0,0,.6))' }} />
            </div>
            {/* Title cartouche: one panel for title + briefing, double champagne filet, corner curls and the bottom gem from the golden,
             *  a separator line between the two. */}
            <div data-cassetto-cartouche="" style={{ position: 'relative', flex: '0 0 auto', marginTop: u(32), marginBottom: u(8), padding: `${u(14)} ${u(26)} ${u(20)}`, textAlign: 'center', border: `1px solid ${C.gold}cc`, background: 'linear-gradient(180deg, rgba(4,40,30,.45), rgba(3,30,24,.55))' }}>
              <div aria-hidden style={{ position: 'absolute', inset: u(5), border: `1px solid ${C.gold}66`, pointerEvents: 'none' }} />
              {([['left', 'top', ''], ['right', 'top', 'scaleX(-1)'], ['left', 'bottom', 'scaleY(-1)'], ['right', 'bottom', 'scale(-1,-1)']] as const).map(([h, v, tf]) => (
                <img key={`${h}${v}`} aria-hidden alt="" draggable={false} src={`${ASSET}/cart-corner.webp`} style={{ position: 'absolute', [h]: u(-3), [v]: u(-3), width: u(56), height: u(54), transform: tf || undefined, pointerEvents: 'none' }} />
              ))}
              <img aria-hidden alt="" draggable={false} src={`${ASSET}/cart-gem.webp`} style={{ position: 'absolute', left: '50%', bottom: u(-22), width: u(132), height: u(42), transform: 'translateX(-50%)', pointerEvents: 'none' }} />
              <div style={{ position: 'relative', fontFamily: CINZEL, fontSize: fzMin(50), fontWeight: 700, lineHeight: 1.12, letterSpacing: '0.05em', textTransform: 'uppercase', color: C.title, textShadow: '0 2px 4px rgba(0,0,0,.8)' }}>
                {quest.title}
              </div>
              <div aria-hidden style={{ height: 1, margin: `${u(12)} ${u(8)}`, background: `linear-gradient(90deg, transparent, ${C.gold}, transparent)` }} />
              <p style={{ position: 'relative', margin: 0, fontStyle: 'italic', fontSize: fzMin(36), lineHeight: 1.3, color: C.titleSoft }}>
                {quest.briefing}
              </p>
            </div>
          </div>

          {/* ---------- party-slots ---------- */}
          <div data-block="party-slots" style={{ ...wellStyle, marginTop: u(6), flex: '1 1 auto', display: 'flex', flexDirection: 'column', justifyContent: 'center', minHeight: u(200) }}>
            {onOpenRoster && <OpenerArrow label={t('gameFrame.cassetto.openRoster', 'Open the roster')} testId="cassetto-party-title" onPress={() => onOpenRoster()} />}
            <div data-cassetto-rack="" style={{ padding: `${u(20)} 0` }}>
              <PartyPager count={slots.length} prevLabel={t('gameFrame.cassetto.prevSeat', 'Previous seats')} nextLabel={t('gameFrame.cassetto.nextSeat', 'Next seats')}>
                <ResidentSlotRack
                  slots={slots}
                  layout="detail"
                  slotSize={42}
                  slotMaterial="hud-gold"
                  slotVariant="hud64"
                  bezelPreset="draghiGlifo"
                  onSlotClick={onSlotClick}
                  onSlotClear={onSlotClear}
                  suppressedResidentIds={suppressedResidentIds}
                  onSlotPhaseChange={onSlotPhaseChange}
                  enableSlotSwap
                />
              </PartyPager>
            </div>
          </div>

          {/* ---------- bag-slots: SUPPLIES (R-337 niches; per-quest count, scrolls sideways when they do not fit) ---------- */}
          <div data-block="bag-slots" style={{ ...wellStyle, marginTop: u(10), paddingBottom: u(14), flexShrink: 0 }}>
            {loadout && <OpenerArrow label={t('gameFrame.cassetto.openStash', 'Open the stash')} testId="cassetto-supplies-title" onPress={(el) => loadout.onOpenStash(el)} />}
            <div data-cassetto-bag-scroll="" style={{ display: 'flex', padding: `${u(22)} ${u(28)} ${u(4)}`, overflowX: 'auto', overflowY: 'hidden' }}>
              {loadout && (
                <div data-cassetto-bag="" style={{ display: 'flex', gap: u(18), alignItems: 'center', margin: '0 auto', flexShrink: 0 }}>
                  {loadout.slots.map((slot, i) => (
                    <span
                      key={i}
                      data-testid={`bag-slot-${i}`}
                      style={{
                        width: u(170), height: u(104), flexShrink: 0, borderRadius: u(14),
                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                        border: `1px solid ${C.gold}${slot ? '' : '88'}`,
                        background: 'linear-gradient(180deg, rgba(4,28,26,.8), rgba(2,18,18,.8))',
                        boxShadow: 'inset 0 0 0 1px rgba(240,214,138,.10), inset 0 4px 10px rgba(0,0,0,.45)',
                      }}
                    >
                      {slot ? (
                        <button
                          type="button"
                          data-testid={`loadout-item-${slot.id}`}
                          data-bag-slot-index={i}
                          aria-label={t('questExpedition.bag.removeSlot', { item: slot.label })}
                          title={slot.label}
                          onClick={() => loadout.onReleaseItem(slot.id)}
                          style={{ padding: 0, border: 'none', background: 'transparent', cursor: 'pointer', display: 'inline-flex' }}
                        >
                          <StashItemTile icon={slot.icon} qty={slot.qty} size={46} iconSize={26} />
                        </button>
                      ) : (
                        <button
                          type="button"
                          data-testid={`bag-slot-empty-${i}`}
                          aria-label={t('questExpedition.bag.emptySlot', { index: i + 1 })}
                          onClick={(e) => loadout.onOpenStash(e.currentTarget)}
                          style={{ width: '100%', height: '100%', padding: 0, border: 'none', background: 'transparent', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                        >
                          <img src={`${ASSET}/supply-bag.webp`} alt="" draggable={false} aria-hidden style={{ width: u(78), height: u(78), opacity: 0.9, filter: 'drop-shadow(0 2px 3px rgba(0,0,0,.6))' }} />
                        </button>
                      )}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ---------- journey-strip (no text title) ---------- */}
          <div data-block="journey-strip" style={{ ...wellStyle, marginTop: u(10), padding: `${u(16)} 0 ${u(10)}`, flexShrink: 0 }}>
            <div style={{ position: 'relative', margin: `0 ${u(22)}`, height: u(84) }}>
              <svg viewBox="0 0 912 84" preserveAspectRatio="none" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} aria-hidden>
                <defs>
                  <linearGradient id="cas-leg-dark" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#1d4a43" /><stop offset="1" stopColor="#0d2a2a" /></linearGradient>
                  <linearGradient id="cas-leg-lit" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#1fb978" /><stop offset="1" stopColor="#0b7a4e" /></linearGradient>
                </defs>
                <polygon points="2,42 36,4 304,4 344,42 304,80 36,80" fill="url(#cas-leg-dark)" stroke={C.gold} strokeWidth="2.5" strokeLinejoin="round" />
                <polygon points="300,4 604,4 644,42 604,80 300,80 340,42" fill="url(#cas-leg-lit)" stroke={C.goldHi} strokeWidth="2.5" strokeLinejoin="round" />
                <polygon points="600,4 874,4 910,42 874,80 600,80 640,42" fill="url(#cas-leg-dark)" stroke={C.gold} strokeWidth="2.5" strokeLinejoin="round" />
              </svg>
              <div style={{ position: 'absolute', inset: 0, display: 'flex' }}>
                {quest.legs.map((leg, i) => (
                  <div key={i} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontFamily: CINZEL, fontSize: fzMin(36), fontWeight: 700, color: i === 1 ? '#eafff5' : C.title, textShadow: '0 1px 3px rgba(0,0,0,.9)' }}>
                      {typeof leg.days === 'number' ? t('gameFrame.cassetto.legDays', { count: leg.days }) : leg.days}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ display: 'flex', margin: `${u(8)} ${u(22)} 0` }}>
              {quest.legs.map((leg, i) => (
                <div key={i} style={{ flex: 1, textAlign: 'center' }}>
                  <span style={{ fontSize: fzMin(28), letterSpacing: '0.13em', textTransform: 'uppercase', color: C.muted, lineHeight: 1.15 }}>{leg.label}</span>
                </div>
              ))}
            </div>
            {quest.totalDays != null && (
              <div data-testid="cassetto-journey-total" style={{ textAlign: 'center', marginTop: u(6) }}>
                <span style={{ fontSize: fzMin(26), letterSpacing: '0.12em', textTransform: 'uppercase', color: C.muted }}>
                  {t('gameFrame.cassetto.journeyTotal', { count: quest.totalDays })}
                </span>
              </div>
            )}
          </div>

          {/* ---------- risk-rewards (no text title; NO cost cell — INV-5) ---------- */}
          <div data-block="risk-rewards" style={{ ...wellStyle, marginTop: u(10), padding: `${u(16)} ${u(20)} ${u(16)}`, display: 'flex', alignItems: 'center', flexShrink: 0 }}>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: u(14), justifyContent: 'center' }} data-risk-state={quest.riskPending ?? 'ready'}>
              <img src={`${ASSET}/skull.webp`} alt="" draggable={false} style={{ width: u(150), height: u(150), flexShrink: 0 }} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: u(12), alignItems: 'flex-start' }}>
                <BigPct pct={quest.deathPct} tone="danger" testId="cassetto-death-pct" label={t('questExpedition.forecast.death', { pct: Math.round(quest.deathPct ?? 0) })} />
                <SkullLevel level={quest.riskPending ? undefined : quest.riskLevel} max={quest.riskLevelMax ?? 4} label={`${t('gameFrame.cassetto.risk', 'Risk')}: ${quest.riskPending === 'computing' ? '…' : quest.riskLabel}`} />
              </div>
            </div>
            <div aria-hidden style={{ width: 1, alignSelf: 'stretch', margin: `${u(8)} 0`, background: `linear-gradient(180deg, transparent, ${C.gold}99, transparent)` }} />
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: u(14), justifyContent: 'center' }}>
              <img src={`${ASSET}/chest.webp`} alt="" draggable={false} style={{ width: u(150), height: u(150), flexShrink: 0 }} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: u(12), alignItems: 'flex-start' }}>
                <BigPct pct={quest.successPct} tone="gold" testId="cassetto-success-pct" label={t('questExpedition.forecast.reward', { pct: Math.round(quest.successPct ?? 0) })} leading={<img src={`${ASSET}/laurel.webp`} alt="" aria-hidden draggable={false} data-laurel="" style={{ width: u(66), height: u(66), flexShrink: 0, opacity: quest.successPct != null ? 1 : 0.4, filter: quest.successPct != null ? 'drop-shadow(0 1px 2px rgba(0,0,0,.6))' : 'grayscale(.8) brightness(.7)' }} />} />
                <span role="group" aria-label={t('gameFrame.cassetto.reward', 'Reward')} style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: u(10) }}>
                  {quest.rewards.map((r) => (
                    <span key={r.icon} style={{ display: 'inline-flex', alignItems: 'center', gap: u(8), fontFamily: CINZEL, fontSize: fzMin(46), fontWeight: 700, color: C.title }}>
                      <img src={`/assets/ui/resources/res-${r.icon}-64.webp`} alt="" style={{ width: u(40), height: u(40) }} draggable={false} />
                      {r.qty}
                    </span>
                  ))}
                </span>
              </div>
            </div>
          </div>

          {/* ---------- launch-cta: inline reason + the CONFIRM button ---------- */}
          <div data-block="launch-cta" style={{ display: 'contents' }}>
            {!canSend && disabledReason && (
              /* Director 2026-11-20: the line under the block is NOT painted. The reason stays in the DOM for the disabled button
               * (aria-describedby, INV-2) but is visually hidden. */
              <div
                id="cassetto-confirm-reason"
                data-testid="cassetto-confirm-reason"
                style={{ position: 'absolute', width: 1, height: 1, margin: -1, padding: 0, overflow: 'hidden', clip: 'rect(0 0 0 0)', whiteSpace: 'nowrap', border: 0 }}
              >
                {disabledReason}
              </div>
            )}
            <button
              type="button"
              data-testid="cassetto-confirm"
              onClick={onConfirm}
              disabled={!canSend}
              aria-label={t('gameFrame.cassetto.confirm', 'CONFIRM')}
              aria-describedby={!canSend && disabledReason ? 'cassetto-confirm-reason' : undefined}
              style={{
                position: 'absolute', right: u(CTA_RIGHT_GAP), bottom: u(CTA_BOTTOM_GAP), width: u(CTA_W), height: u(CTA_H),
                padding: 0, border: 'none', background: 'transparent',
                cursor: canSend ? 'pointer' : 'default',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              <img className="confirm-art" aria-hidden alt="" draggable={false} src={`${ASSET}/cta-plaque.webp`} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }} />
              <span className="confirm-text" style={{ position: 'relative', fontFamily: CINZEL, fontSize: fzMin(36), fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
                {t('gameFrame.cassetto.confirm', 'CONFIRM')}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HudRealCassetto;
