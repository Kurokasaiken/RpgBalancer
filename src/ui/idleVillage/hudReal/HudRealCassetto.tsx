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
import { paintedGround, paintedBoxFrame, paintedNiche, PAINTED_PIECES } from '@/ui/idleVillage/skins/primitives/paintedPieces';
import { HudScrollBandX } from '@/ui/idleVillage/skins/primitives/HudScrollBandX';
import { EngravedIcon, type EngravedIconId } from '@/ui/idleVillage/components/gameFrame/engravedIcons';

const C = {
  ink: '#f3e7c4',
  /** Labels and small captions: warm cream, as in the mockup (CUTBOUND/Leader/Risk ≈ (251,244,217)) — the old cool grey-green (#8fb2a2) read pale on the emerald (Director 2026-11-21). */
  muted: '#cfc796', /* muted gold for labels — the new mockup's «Outbound/Expedition Leader» ink (196,191,145), a notch lifted; titles/values stay full gold */
  goldHi: '#f1d88a', /* = HudRealNav C.gold */
  gold: '#c2a355', /* = --skin-hud-brass-mid, the nav's brass */
  /** R-357 palette (Director: «troppo Gold … il componente in basso al centro è il golden standard»): titles and numbers read
   *  ivory/champagne like the bottom nav labels; gold stays for rims, icons and the frame. */
  title: '#f7efd8', /* = the HUD's value ink (measured: Gold/Food numbers) — brighter than the old nav label ink #e6dcb8 */
  titleSoft: '#c9d6c6',
  /** Mockup gold for values and glyphs ((233,217,145)–(252,235,139)); the nav's champagne for rims stays `goldHi`. */
  goldInk: '#f3e193',
  /** Briefing under the title: warm gold-cream — the mockup's description is gold (251,241,138); softened toward the HUD's «Day 1» ink so it does not shout. */
  briefing: '#ecdca0',
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
  /** DEPRECATED 2026-11-21: the corner `›` opener was removed (Director); kept so callers compile. Not used by the cassetto. */
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
/* generated frame corners: 1 source px = FRAME_S u; the rail's right edge sits at ~101 u (content padding is RAIL_W - 12) */
const FRAME_S = 0.72;
const FRAME_LEFT = -16;
const FRAME_TL_H = 520 * FRAME_S;
const FRAME_BL_H = 520 * FRAME_S;  /* the bottom corner is the TOP corner mirrored (Director 2026-11-21: «togli il ricciolo grande di sotto») */
const FRAME_OV = 70 * FRAME_S;  /* the mid rail runs this far UNDER each corner, whose rail end fades out over the same distance */
/** The CTA button asset (1500×317, both arrow tips, transparent ground) scaled to 880u: 12 px clear of the rail, 10 px of the edge. */
const [PLAQUE_W, PLAQUE_H] = PAINTED_PIECES.plaque.size;  /* Gemini-generated plaque (2026-11-21), clean on magenta, keyed — replaces the cropped golden slice */
const CTA_W = 820, CTA_BOTTOM_GAP = 34;  /* centred in the content column (the big bottom-left curl is gone — Director 2026-11-21) */
const CTA_CENTER_U = 541;  /* centre of the content area: (rail padding 88 + (1024 − right padding 30)) / 2 */
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
[data-hudreal-cassetto] { --slot-rack-slot-label-color: #d9d29f; }
/* empty seat: the role glyph in gold like the mockup's seats (the shared renderer paints it arcane-olive; scoped to the cassetto only) */
[data-hudreal-cassetto] [data-layer="role-glyph"] { color: #f3e193 !important; opacity: .95; }
[data-hudreal-cassetto] [data-testid="resident-slot-rack"] p {
  color: #d9d29f !important;
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
/* Bag niches — pouch brightens on hover, packed tiles lift and glow. */
[data-hudreal-cassetto] [data-testid^="bag-slot-empty-"] img { transition: opacity 160ms ease, filter 160ms ease; }
[data-hudreal-cassetto] [data-testid^="bag-slot-empty-"]:hover img { opacity: 1 !important; filter: drop-shadow(0 0 6px rgba(223,184,87,0.6)) !important; }
[data-hudreal-cassetto] [data-testid^="loadout-item-"] { transition: filter 160ms ease, transform 120ms ease; border-radius: 8px; }
[data-hudreal-cassetto] [data-testid^="loadout-item-"]:hover { filter: brightness(1.18) drop-shadow(0 0 5px rgba(223,184,87,0.45)); transform: translateY(-1px); }
[data-hudreal-cassetto] [data-testid^="loadout-item-"]:active { transform: translateY(0) scale(0.95); }
`;

const CINZEL = 'Marcellus, "Cardo", serif';

/** A framed block (well): brass hairline, dark enamel fill. */
const wellStyle: React.CSSProperties = {
  position: 'relative',
  /* Gemini-generated frame (2026-11-21, Director «i componenti interni + curati»): fine brass double border + four corner flourishes,
   * sliced like the mockup's section boxes. Corners 130×105 of the 1024×254 source are kept, the straight edges stretch. */
  ...paintedBoxFrame({ y: u(44), x: u(55) }, u(2)),
  /* WELL = the top bars' recipe (measured 2026-11-21 on the day/resource bars: core black-teal (1,17,26), lum 12–18; a narrow green glow on
   * the inner edge, lighter at top and bottom, lum 24–30 — ~80% black / 20% green). Saturated emerald is kept for accents only
   * (Outbound segment, CTA, gems). The previous pass (full top→bottom emerald) inverted the balance (Director: «non c'è bilanciamento»). */
  background: [
    'linear-gradient(180deg, rgba(18,92,66,.42) 0%, rgba(18,92,66,0) 16%, rgba(18,92,66,0) 84%, rgba(18,92,66,.34) 100%)',
    'linear-gradient(180deg, #03161d 0%, #01111a 50%, #021612 100%)',
  ].join(', '),
  boxShadow: 'inset 0 0 0 1px rgba(30,120,84,.35), inset 0 0 14px rgba(24,110,78,.30), inset 0 0 34px rgba(0,0,0,.55)',
};

/** The % readout (Director 2026-11-20: a big number beside the emblem). Pending → a muted dash, same height. */
const BigPct: React.FC<{ pct?: number; tone: 'danger' | 'gold'; label: string; testId: string; leading?: React.ReactNode; size?: number }> = ({ pct, tone, label, testId, leading, size = 66 }) => {
  const color = tone === 'danger' ? C.bordeaux : C.goldHi;
  const known = pct != null;
  return (
    <span
      data-testid={known ? testId : `${testId}-pending`}
      role={known ? 'img' : undefined}
      aria-label={known ? label : undefined}
      aria-hidden={known ? undefined : true}
      title={known ? label : undefined}
      style={{ display: 'inline-flex', alignItems: 'center', gap: u(8), fontFamily: CINZEL, fontSize: fzMin(size), fontWeight: 700, letterSpacing: '0.02em', lineHeight: 1, color: known ? color : C.muted, opacity: known ? 1 : 0.55, textShadow: '0 1px 3px rgba(0,0,0,.85)', whiteSpace: 'nowrap' }}
    >
      {leading}
      {known ? `${Math.round(pct as number)}%` : '—'}
    </span>
  );
};

/** Danger level as skulls: `level` of `max` lit (the small copy of the emblem), the rest dimmed. */
const SkullLevel: React.FC<{ level?: number; max: number; label: string }> = ({ level, max, label }) => (
  <span data-testid="cassetto-risk-value" role="img" aria-label={label} title={label} data-risk-level={level ?? 0} style={{ display: 'inline-flex', gap: u(5), alignItems: 'center' }}>
    {Array.from({ length: max }, (_, i) => (
      <img key={i} src={`${ASSET}/skull.webp`} alt="" draggable={false} data-skull={i < (level ?? 0) ? 'on' : 'off'} style={{ width: u(44), height: u(44), objectFit: 'contain', filter: i < (level ?? 0) ? 'none' : 'grayscale(1) brightness(.55)', opacity: i < (level ?? 0) ? 1 : 0.4 }} />
    ))}
  </span>
);

/** Journey bar art: centre of each segment as % of the image width (measured on the generated bar: lit segment 22–365, middle 375–685, right 690–1000 of 1024). */
const JOURNEY_CENTERS = [18.9, 51.8, 82.5];

/** Journey: the leg shown lit (the mockup lights Outbound) and the engraved glyph of each leg (outbound / on site / return). */
const ACTIVE_LEG = 0;
const LEG_ICONS: EngravedIconId[] = ['ico-target', 'ico-axe', 'ico-gust'];

/** Vignette geometry (design units): the picture starts just under the north bar's centre line and its top-left corner is a quarter circle of radius CORNER_R. */
const VIGNETTE_TOP = 22;
const VIGNETTE_H = 262;
const CORNER_R = 130;

/** A row that scrolls sideways under the shared engraved band — NOT arrow buttons (Director 2026-11-21: «non voglio pulsanti per andare a
 *  destra o sinistra, ma la barra come hanno già roster e stash»). The band lives in the positioned ancestor; hidden while the row fits. */
const BandedRow: React.FC<{ attrs?: Record<string, string>; rowStyle: React.CSSProperties; children: React.ReactNode }> = ({ attrs, rowStyle, children }) => {
  const ref = React.useRef<HTMLDivElement>(null);
  return (
    <>
      <div ref={ref} data-hud-scroll-band="" {...attrs} style={{ overflowX: 'auto', overflowY: 'hidden', ...rowStyle }}>{children}</div>
      <HudScrollBandX scrollRef={ref} />
    </>
  );
};

/** Party seats, THREE visible at a time, bigger (Director 2026-11-20); the rest scroll sideways under the band. */
const PARTY_VISIBLE = 3;
const PARTY_COL_PX = 104;
const PARTY_GAP_PX = 6;
const PartyScroller: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div data-cassetto-party-scroller="" style={{ position: 'relative', display: 'flex', justifyContent: 'center' }}>
    <BandedRow
      attrs={{ 'data-cassetto-party-scroll': '' }}
      rowStyle={{ width: PARTY_VISIBLE * PARTY_COL_PX + (PARTY_VISIBLE - 1) * PARTY_GAP_PX, zoom: 1.15, padding: '12px 0 22px' }}
    >
      <div style={{ width: 'max-content' }}>{children}</div>
    </BandedRow>
  </div>
);

export const HudRealCassetto: React.FC<HudRealCassettoProps> = ({
  quest, slots, onSlotClick, onSlotClear, suppressedResidentIds, onSlotPhaseChange, loadout, canSend = true, disabledReason, onConfirm, onClose,
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
        fontFamily: '"Cardo", serif', color: C.ink,
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
        {/* enamel field — starts under the rail, NOT at the column edge (no bar left of the frame). The frame lattice
         *  is ritagliata: its gaps are truly transparent and show what is underneath, so no DOM rectangle may sit under
         *  them — a backing rect pokes outside the organic silhouette as a coloured corner
         *  (Director 2026-11-21 quinquies: «un angolo colorato invece di essere ritagliato … eliminarlo e basta»). */}
        {/* mask on the left edge: the enamel's straight left boundary shows through the lattice gaps as a flat
         *  dark rectangle running the full column height («il rettangolo … sia sopra che sotto», Director 2026-11-21).
         *  Fading it in under the opaque ornament removes the hard line — same fix as the vignette's left edge. */}
        <div aria-hidden style={{ position: 'absolute', left: u(36), right: 0, top: 0, bottom: 0, ...paintedGround(), pointerEvents: 'none',
          WebkitMaskImage: `linear-gradient(90deg, transparent 0, #000 ${u(120)})`, maskImage: `linear-gradient(90deg, transparent 0, #000 ${u(120)})` }} />
        <div
          style={{
            position: 'absolute', inset: 0,
            display: 'flex', flexDirection: 'column',
            paddingLeft: u(RAIL_W - 12), paddingRight: u(30), paddingBottom: u(CTA_H + CTA_BOTTOM_GAP + 30),
            boxSizing: 'border-box',
          }}
        >
          {/* ---------- painted frame (sliced from the golden) ---------- */}
          {/* LEFT FRAME + NORTH/SOUTH BARS — Gemini-generated corners (Director 2026-11-21: the old pieces were cropped from the golden at a
           *  fixed width and carried cut leaves and button remains). TL corner (rounded arc over the painting + bar), bottom corner = the top corner flipped vertically (rounded arc into the rim, no curl),
           *  a folded mid rail between them; the bar / rim run to the right edge INSIDE the corner images (last columns replicated), so no seam. Scale FRAME_S u per source px. */}
          <div aria-hidden style={{ position: 'absolute', left: u(FRAME_LEFT), top: u(FRAME_TL_H - FRAME_OV), bottom: u(FRAME_BL_H - FRAME_OV), width: u(205 * FRAME_S), backgroundImage: `url(${ASSET}/rail-mid-fold.webp)`, backgroundRepeat: 'no-repeat', backgroundSize: '100% 100%', pointerEvents: 'none' }} />
          <img aria-hidden alt="" draggable={false} src={`${ASSET}/frame-corner-tl.webp`} style={{ position: 'absolute', left: u(FRAME_LEFT), top: 0, width: u(1447 * FRAME_S), height: u(520 * FRAME_S), pointerEvents: 'none', zIndex: 3 }} />
          <img aria-hidden alt="" draggable={false} src={`${ASSET}/frame-corner-tl.webp`} style={{ position: 'absolute', left: u(FRAME_LEFT), bottom: 0, width: u(1447 * FRAME_S), height: u(520 * FRAME_S), transform: 'scaleY(-1)', pointerEvents: 'none', zIndex: 3 }} />

          {/* ---------- quest-banner: vignette + title + briefing ---------- */}
          <div data-block="quest-banner" style={{ display: 'contents' }}>
            {/* Vignette: FIXED height in the golden's proportion (936×262 → a wide strip), thin champagne frame under it. A quest with its
             *  own cover art is cropped to the same strip (centre). */}
            {/* Vignette, NO frame (Director 2026-11-21 «Remove frame»). The mockup's top-left is ROUNDED — the rail's gold arm sweeps over the
             *  painting — so the picture gets the same quarter-circle corner and a gold arc along it (Director: «dobbiamo ottenere quell'effetto
             *  invece di questo squadrato»). The painting runs to the right edge, sits under the north frame bar and dissolves into the panel
             *  at the bottom (mask); the title cartouche below carries the first border. */}
            {/* marginLeft -50: the picture starts under the opaque vine cluster and fades in, so its straight left edge
             *  never coincides with a see-through notch of the corner — a hard edge there reads as a coloured square
             *  («quel quadrato», Director 2026-11-21). Same trick as the bottom mask, on the left edge. */}
            <div data-cassetto-vignette-frame="" style={{ position: 'relative', flex: '0 0 auto', marginTop: u(VIGNETTE_TOP), marginLeft: u(-50), marginRight: u(-14),
              WebkitMaskImage: `linear-gradient(90deg, transparent 0, #000 ${u(70)})`, maskImage: `linear-gradient(90deg, transparent 0, #000 ${u(70)})` }}>
              <div style={{ position: 'relative', height: u(VIGNETTE_H), overflow: 'hidden', borderTopLeftRadius: u(CORNER_R),
                WebkitMaskImage: 'linear-gradient(180deg, #000 0%, #000 74%, transparent 100%)', maskImage: 'linear-gradient(180deg, #000 0%, #000 74%, transparent 100%)' }}>
                <img
                  alt="" aria-hidden draggable={false}
                  data-cassetto-vignette=""
                  src={quest.vignette ?? `${ASSET}/vignette.webp`}
                  style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: quest.vignette ? 'center 18%' : 'left top',
                    /* the mockup's painting is luminous (mean luma ~92); the quest cover arts are dark forests (~58) → lift them so the head of the column reads bright */
                    filter: 'brightness(1.55) contrast(1.06) saturate(1.15)' }}
                />
                {/* soft daylight bloom */}
                <div aria-hidden style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: 'radial-gradient(ellipse at 50% 22%, rgba(255,238,170,.22), transparent 62%)' }} />
              </div>
            </div>
            {/* Title cartouche: one panel for title + briefing, double champagne filet, corner curls and the bottom gem from the golden,
             *  a separator line between the two. */}
            <div data-cassetto-cartouche="" style={{ position: 'relative', flex: '0 0 auto', marginTop: u(14), marginBottom: u(8), padding: `${u(14)} ${u(26)} ${u(20)}`, textAlign: 'center', border: `1px solid ${C.gold}cc`, background: 'linear-gradient(180deg, rgba(4,40,30,.45), rgba(3,30,24,.55))' }}>
              <div aria-hidden style={{ position: 'absolute', inset: u(5), border: `1px solid ${C.gold}66`, pointerEvents: 'none' }} />
              {([['left', 'top', ''], ['right', 'top', 'scaleX(-1)'], ['left', 'bottom', 'scaleY(-1)'], ['right', 'bottom', 'scale(-1,-1)']] as const).map(([h, v, tf]) => (
                <img key={`${h}${v}`} aria-hidden alt="" draggable={false} src={`${ASSET}/cart-corner.webp`} style={{ position: 'absolute', [h]: u(-3), [v]: u(-3), width: u(56), height: u(54), transform: tf || undefined, pointerEvents: 'none' }} />
              ))}
              <img aria-hidden alt="" draggable={false} src={`${ASSET}/cart-gem.webp`} style={{ position: 'absolute', left: '50%', bottom: u(-22), width: u(132), height: u(42), transform: 'translateX(-50%)', pointerEvents: 'none' }} />
              <div style={{ position: 'relative', fontFamily: CINZEL, fontSize: fzMin(54), fontWeight: 700, lineHeight: 1.1, letterSpacing: '0.05em', textTransform: 'uppercase',
                /* HUD gold (the «Day 1» ink, measured (243,225,147)) as a lit gradient — the mockup's title is warm gold (252,235,139) */
                background: 'linear-gradient(180deg, #fff3b4 0%, #f3e193 45%, #dcb857 100%)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent',
                filter: 'drop-shadow(0 2px 3px rgba(0,0,0,.85))' }}>
                {quest.title}
              </div>
              <div aria-hidden style={{ height: 1, margin: `${u(12)} ${u(8)}`, background: `linear-gradient(90deg, transparent, ${C.gold}, transparent)` }} />
              <p style={{ position: 'relative', margin: 0, fontStyle: 'italic', fontSize: fzMin(37), lineHeight: 1.3, color: C.briefing, textShadow: '0 1px 2px rgba(0,0,0,.7)' }}>
                {quest.briefing}
              </p>
            </div>
          </div>

          {/* ---------- party-slots ---------- */}
          <div data-block="party-slots" style={{ ...wellStyle, marginTop: u(6), flex: '1 1 auto', display: 'flex', flexDirection: 'column', justifyContent: 'center', minHeight: u(200) }}>
            <div data-cassetto-rack="" style={{ padding: `${u(20)} 0` }}>
              <PartyScroller>
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
              </PartyScroller>
            </div>
          </div>

          {/* ---------- bag-slots: SUPPLIES (R-337 niches; per-quest count, scrolls sideways when they do not fit) ---------- */}
          <div data-block="bag-slots" style={{ ...wellStyle, marginTop: u(10), flexShrink: 0 }}>
            <BandedRow attrs={{ 'data-cassetto-bag-scroll': '' }} rowStyle={{ display: 'flex', padding: `${u(22)} ${u(28)} ${u(30)}` }}>
              {loadout && (
                <div data-cassetto-bag="" style={{ display: 'flex', gap: u(18), alignItems: 'center', margin: '0 auto', flexShrink: 0 }}>
                  {loadout.slots.map((slot, i) => (
                    <span
                      key={i}
                      data-testid={`bag-slot-${i}`}
                      style={{
                        width: u(170), height: u(104), flexShrink: 0,
                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                        /* Gemini-generated niche (2026-11-21, second pass: the first had a hairline that vanished at this size): bold polished
                         * brass frame, chamfered corners with studs, recessed deep-green interior. Corners (90 px of the source) keep their
                         * studs; edges and interior stretch. An empty niche is dimmed so a filled one reads as the lit one. */
                        ...paintedNiche(u(15), u(2)),
                        opacity: slot ? 1 : 0.85,
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
                          <span aria-hidden style={{ fontFamily: CINZEL, fontSize: fzMin(70), lineHeight: 1, color: C.goldInk, opacity: 1, textShadow: '0 1px 3px rgba(0,0,0,.8)' }}>+</span>
                        </button>
                      )}
                    </span>
                  ))}
                </div>
              )}
            </BandedRow>
          </div>

          {/* ---------- journey-strip (no text title) ----------
           *  New mockup (Director 2026-11-21 «il viaggio è superiore, prendiamo quello», redone after «ancora sbagliato»): ONE pill split by
           *  slanted cuts into three segments — rounded outer ends, near-black teal with a gold edge, the active one emerald; a small emerald
           *  diamond centred on the top and bottom edge of every segment, one on each slanted joint and one on each end; the engraved icon sits
           *  ABOVE the leg name. The days are game data the mockup does not show: they go in a small caption row under the pill. */}
          <div data-block="journey-strip" style={{ ...wellStyle, marginTop: u(10), padding: `${u(20)} 0 ${u(12)}`, flexShrink: 0 }}>
            <div style={{ position: 'relative', margin: `0 ${u(30)}` }}>
              {/* Gemini-generated bar (Director 2026-11-21: «Outbound ecc… fatti creare da Gemini»): one pill, left segment emerald (lit), two dark
               *  recessed segments, gold edge, emerald gems — keyed from magenta, empty: icons and names are live DOM on top. */}
              <img data-cassetto-journey-art="" aria-hidden alt="" draggable={false} src={`${ASSET}/journey-bar.webp`} style={{ display: 'block', width: '100%', height: 'auto' }} />
              {quest.legs.map((leg, i) => (
                <div key={i} style={{ position: 'absolute', top: 0, bottom: 0, left: `${JOURNEY_CENTERS[i] ?? 50}%`, transform: 'translateX(-50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: u(2), pointerEvents: 'none' }}>
                  <EngravedIcon id={LEG_ICONS[i] ?? 'ico-dot'} size={Math.round((38 / 1024) * 512)} style={{ color: i === ACTIVE_LEG ? '#fff3b4' : C.goldInk, filter: 'drop-shadow(0 1px 2px rgba(0,0,0,.8))' }} />
                  <span style={{ fontFamily: CINZEL, fontSize: fzMin(28), fontWeight: 700, letterSpacing: '0.03em', lineHeight: 1.05, color: i === ACTIVE_LEG ? '#fff6cf' : C.goldInk, textShadow: '0 1px 3px rgba(0,0,0,.9)', whiteSpace: 'nowrap' }}>{leg.label}</span>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', margin: `${u(6)} ${u(30)} 0` }}>
              {quest.legs.map((leg, i) => (
                <div key={i} data-testid={`cassetto-leg-days-${i}`} style={{ flex: 1, textAlign: 'center', fontFamily: CINZEL, fontSize: fzMin(26), letterSpacing: '0.06em', color: C.muted }}>
                  {typeof leg.days === 'number' ? t('gameFrame.cassetto.legDays', { count: leg.days }) : leg.days}
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

          {/* ---------- risk-rewards: TWO wells with labels (new mockup v3, Director 2026-11-21 «Risk/reward + journey»; amends the 2026-11-20
           *  «captions gone» ruling — the mockup writes «Risk» and «Reward»). NO cost cell (INV-5). Each well: emblem left, then label,
           *  then the value row; the sim's % stay (2026-11-20 ruling): death % in the skull's red, success % with the laurel. ---------- */}
          <div data-block="risk-rewards" style={{ marginTop: u(10), display: 'flex', gap: u(14), flexShrink: 0 }}>
            <div data-testid="cassetto-risk-well" data-risk-state={quest.riskPending ?? 'ready'} style={{ ...wellStyle, borderImage: 'none', border: `${u(3)} solid ${C.goldHi}`, borderRadius: u(44), boxShadow: `inset 0 0 0 ${u(4)} rgba(0,0,0,.5), inset 0 0 0 ${u(5.5)} rgba(243,225,147,.42), inset 0 0 0 ${u(7)} rgba(30,120,84,.35), inset 0 0 16px rgba(24,110,78,.32), inset 0 0 34px rgba(0,0,0,.55), 0 2px 6px rgba(0,0,0,.5)`, flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: u(12), padding: `${u(18)} ${u(14)} ${u(18)} ${u(16)}` }}>
              <img src={`${ASSET}/skull.webp`} alt="" draggable={false} style={{ width: u(128), height: u(128), flexShrink: 0 }} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: u(8), alignItems: 'flex-start', minWidth: 0 }}>
                <span data-testid="cassetto-risk-label" style={{ fontFamily: CINZEL, fontSize: fzMin(38), fontWeight: 700, letterSpacing: '0.04em', color: C.goldInk, textShadow: '0 1px 3px rgba(0,0,0,.9)', lineHeight: 1 }}>{t('gameFrame.cassetto.risk', 'Risk')}</span>
                <SkullLevel level={quest.riskPending ? undefined : quest.riskLevel} max={quest.riskLevelMax ?? 4} label={`${t('gameFrame.cassetto.risk', 'Risk')}: ${quest.riskPending === 'computing' ? '…' : quest.riskLabel}`} />
                <BigPct pct={quest.deathPct} tone="danger" testId="cassetto-death-pct" size={48} label={t('questExpedition.forecast.death', { pct: Math.round(quest.deathPct ?? 0) })} />
              </div>
            </div>
            <div data-testid="cassetto-reward-well" style={{ ...wellStyle, borderImage: 'none', border: `${u(3)} solid ${C.goldHi}`, borderRadius: u(44), boxShadow: `inset 0 0 0 ${u(4)} rgba(0,0,0,.5), inset 0 0 0 ${u(5.5)} rgba(243,225,147,.42), inset 0 0 0 ${u(7)} rgba(30,120,84,.35), inset 0 0 16px rgba(24,110,78,.32), inset 0 0 34px rgba(0,0,0,.55), 0 2px 6px rgba(0,0,0,.5)`, flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: u(12), padding: `${u(18)} ${u(14)} ${u(18)} ${u(16)}` }}>
              <img src={`${ASSET}/chest.webp`} alt="" draggable={false} style={{ width: u(128), height: u(128), flexShrink: 0 }} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: u(8), alignItems: 'flex-start', minWidth: 0 }}>
                <span data-testid="cassetto-reward-label" style={{ fontFamily: CINZEL, fontSize: fzMin(38), fontWeight: 700, letterSpacing: '0.04em', color: C.goldInk, textShadow: '0 1px 3px rgba(0,0,0,.9)', lineHeight: 1 }}>{t('gameFrame.cassetto.reward', 'Reward')}</span>
                <span role="group" aria-label={t('gameFrame.cassetto.reward', 'Reward')} style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: u(10) }}>
                  {quest.rewards.map((r) => (
                    <span key={r.icon} style={{ display: 'inline-flex', alignItems: 'center', gap: u(8), fontFamily: CINZEL, fontSize: fzMin(50), fontWeight: 700, color: C.goldInk, textShadow: '0 1px 3px rgba(0,0,0,.85)' }}>
                      <img src={`/assets/ui/resources/res-${r.icon}-64.webp`} alt="" style={{ width: u(40), height: u(40) }} draggable={false} />
                      {r.qty}
                    </span>
                  ))}
                </span>
                <BigPct pct={quest.successPct} tone="gold" testId="cassetto-success-pct" size={48} label={t('questExpedition.forecast.reward', { pct: Math.round(quest.successPct ?? 0) })} leading={<img src={`${ASSET}/laurel.webp`} alt="" aria-hidden draggable={false} data-laurel="" style={{ width: u(46), height: u(46), flexShrink: 0, opacity: quest.successPct != null ? 1 : 0.4 }} />} />
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
                position: 'absolute', left: u(CTA_CENTER_U - CTA_W / 2), bottom: u(CTA_BOTTOM_GAP), width: u(CTA_W), height: u(CTA_H),
                padding: 0, border: 'none', background: 'transparent',
                cursor: canSend ? 'pointer' : 'default',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                /* centre the label on the lacquer BODY, not on the image: measured on cta-plaque.webp the body centre is 29 px below / 7.5 px right of the image centre (crest above, asymmetric tips) → pad = 2×offset */
                paddingTop: u(CTA_H * 0.152), paddingLeft: u(CTA_W * 0.01),
              }}
            >
              <img aria-hidden alt="" draggable={false} src={`${ASSET}/cta-plaque.webp`} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }} />
              {/* enamel-only layer: the state filters hit the lacquer and leave the brass gold (Director 2026-11-21: the disabled plaque looked dead) */}
              <img className="confirm-art" aria-hidden alt="" draggable={false} src={`${ASSET}/cta-plaque-enamel.webp`} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }} />
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
