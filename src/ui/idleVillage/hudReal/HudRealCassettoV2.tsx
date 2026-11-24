/**
 * HudRealCassettoV2 — the expedition planner drawer (dossier on map), V2.
 *
 * Copied verbatim from the FROZEN V1 baseline (`HudRealCassetto.tsx`, see
 * `src/docs/docs/idle_village/trusted/hud_real_cassetto_trusted.md`) and fixed per the R-374 aesthetic audit:
 * well-content clearance off the painted frame band, CTA centred on the whole panel, `paintedBoxFrame` on the
 * risk/reward wells, cartouche breathing room, `u()`-scaled seats/icons (no `zoom`), party overflow fade,
 * engraved pouch glyph for empty niches, vignette flush to the screen edge, dead `subtitle` removed.
 *
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
import { paintedBoxFrame, paintedNiche, PAINTED_PIECES } from '@/ui/idleVillage/skins/primitives/paintedPieces';
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
  /** Reward tier 1..`rewardLevelMax`, sourced from the POI's authored offer tier. R-378 (Director 2026-11-24):
   *  the mirrored chest scale was REMOVED — the field stays in the model (tier data), nothing paints it. */
  rewardLevel?: number;
  rewardLevelMax?: number;
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

export interface HudRealCassettoV2Props {
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
const CTA_W = 820, CTA_BOTTOM_GAP = 34;
/* V2 (R-374 rev2, re-axed by OB-7 app-2 Director 2026-11-21): the plaque centres on the PERCEIVED enamel card
 * (the field the eye reads starts ~u120 where the fade-in ends → u560), the same axis the centred content
 * column shares (padL u148 / padR u52): blocks and CTA share one centre, so nothing drifts. */
const CTA_CENTER_U = 560;
const CTA_H = CTA_W * PLAQUE_H / PLAQUE_W;
/** The plaque's three painted emeralds — centres measured on the 1500×381 `cta-plaque.webp` (emerald mask):
 *  left tip (110,225), crest (751,95), right tip (1390,222) → x%/y%/glow-width%/pulse-delay-s. */
const CTA_JEWELS: readonly (readonly [number, number, number, number])[] = [
  [7.3, 59, 9, 0.35],
  [50, 23.6, 11, 0],
  [92.7, 58.3, 9, 0.7],
];

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

const CINZEL = 'Marcellus, "Cardo", serif';

const RACK_SCOPED_CSS = `
[data-hudreal-cassetto] [data-testid="resident-slot-rack"] {
  --slot-rack-gap: 10px;
  display: grid !important;
  grid-auto-flow: column !important;
  /* V2 (R-374): seat columns/gap in cqw so the rack keeps the golden's proportion at any column width —
   * replaces fixed px + zoom (unsupported on Firefox). 230u ≈ 118 px at the 512 px column. */
  grid-auto-columns: ${u(170)} !important; /* in sync with PARTY_SEAT_U (R-378) */
  grid-template-columns: none !important;
  gap: ${u(12)} !important;
  align-items: start !important;
  justify-items: center !important;
}
/* The rack's 9px labels are raised to the legibility floor; two centered balanced lines are fine.
 * Director 2026-11-22 «testo cn font corretti»: the golden paints the seat labels in the ENGRAVED display
 * serif (warm gold, title case) — not the body serif the rack inherits. Same family the role glyphs use. */
[data-hudreal-cassetto] { --slot-rack-slot-label-color: #f3e193; }
/* empty seat: the role glyph in gold like the mockup's seats (the shared renderer paints it arcane-olive; scoped to the cassetto only) */
[data-hudreal-cassetto] [data-layer="role-glyph"] { color: #f3e193 !important; opacity: .95; }
[data-hudreal-cassetto] [data-testid="resident-slot-rack"] p {
  color: #f3e193 !important;
  font-family: ${CINZEL} !important;
  text-transform: capitalize !important;
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
/* CTA jewels (R-378): when the party is complete the plaque's three emeralds pulse — the «now clickable»
 *  signal the Director asked for («quando è completo si illuminano i gioielli»). Glow discs in screen blend
 *  over the painted gems; staggered so the crest leads the tips. */
@keyframes cassettoJewelPulse {
  0%, 100% { opacity: .5; transform: translate(-50%, -50%) scale(.82); }
  50% { opacity: 1; transform: translate(-50%, -50%) scale(1.18); }
}
[data-hudreal-cassetto] .cta-jewel {
  position: absolute; aspect-ratio: 1; border-radius: 50%; pointer-events: none;
  background: radial-gradient(circle, rgba(196,255,224,.95) 0%, rgba(96,240,172,.6) 38%, transparent 68%);
  mix-blend-mode: screen;
  animation: cassettoJewelPulse 2.4s ease-in-out infinite;
}
@media (prefers-reduced-motion: reduce) {
  [data-hudreal-cassetto] .cta-jewel { animation: none; opacity: .75; }
}
`;

/** A framed block (well): brass hairline, dark enamel fill. */
const wellStyle: React.CSSProperties = {
  position: 'relative',
  /* Gemini-generated frame (2026-11-21, Director «i componenti interni + curati»): fine brass double border + four corner flourishes,
   * sliced like the mockup's section boxes. Corners 130×105 of the 1024×254 source are kept, the straight edges stretch. */
  ...paintedBoxFrame({ y: u(44), x: u(55) }, u(2)),
  /* WELL recipe — rebalanced toward TEAL (OB-7 app-1, Director 2026-11-21: «troppo nero in proporzione»; was
   * ~80% black / 20% green): the green glow band widens (0–30% / 70–100%, was 16%/84%) and the core lifts
   * toward nero-teal. Saturated emerald stays for accents only (Outbound segment, CTA, gems). */
  background: [
    'linear-gradient(180deg, rgba(18,92,66,.52) 0%, rgba(18,92,66,.14) 30%, rgba(18,92,66,.14) 70%, rgba(18,92,66,.44) 100%)',
    'linear-gradient(180deg, #04222b 0%, #01141c 50%, #03302a 100%)',
  ].join(', '),
  boxShadow: 'inset 0 0 0 1px rgba(30,120,84,.42), inset 0 0 18px rgba(24,110,78,.34), inset 0 0 34px rgba(0,0,0,.50)',
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

/** Level scale as lit/dimmed emblems: `level` of `max` lit (the small copy of the well's emblem), the rest dimmed.
 *  Shared by risk (skulls) and reward (chests — OB-7 app-5: «5 simboli anche lui»). */
const EmblemLevel: React.FC<{ src: string; level?: number; max: number; label: string; testId: string; dataAttr: string }> = ({ src, level, max, label, testId, dataAttr }) => (
  <span data-testid={testId} role="img" aria-label={label} title={label} data-level={level ?? 0} style={{ display: 'inline-flex', gap: u(5), alignItems: 'center' }}>
    {Array.from({ length: max }, (_, i) => (
      <img key={i} src={src} alt="" draggable={false} {...{ [dataAttr]: i < (level ?? 0) ? 'on' : 'off' }} style={{ width: u(44), height: u(44), objectFit: 'contain', filter: i < (level ?? 0) ? 'none' : 'grayscale(1) brightness(.55)', opacity: i < (level ?? 0) ? 1 : 0.4 }} />
    ))}
  </span>
);

/** Journey pill art: centre of each segment as % of the image width (measured on journey-pill.webp 1498×270:
 *  lit Outbound interior ~60–460 → 17.4%, middle ~580–980 → 52%, right ~1040–1420 → 82%). */
const JOURNEY_CENTERS = [17.4, 52, 82];

/** Journey: the leg shown lit (the mockup lights Outbound) and the engraved glyph of each leg (outbound / on site / return).
 *  R-378 (Director 2026-11-24 «nuove icone x la parte del viaggio»): a striding boot for the march out, a bannered
 *  tent for the camp on site, a curved arrow for the way back. */
const ACTIVE_LEG = 0;
const LEG_ICONS: EngravedIconId[] = ['ico-boot', 'ico-tent', 'ico-return'];

/** Vignette geometry (design units): the picture starts just under the north bar's centre line and its top-left corner is a quarter circle of radius CORNER_R. */
const VIGNETTE_TOP = 22;
const VIGNETTE_H = 262;
const CORNER_R = 130;

/** A row that scrolls sideways under the shared engraved band — NOT arrow buttons (Director 2026-11-21: «non voglio pulsanti per andare a
 *  destra o sinistra, ma la barra come hanno già roster e stash»). The band lives in the positioned ancestor; hidden while the row fits.
 *  R-378 (Director 2026-11-24 «la barra … occupa troppo spazio, falla + piccola (meno spessa)»): the cassetto's bands run slimmer
 *  than the shared 14 px — `CASSETTO_BAND_PX`. */
const CASSETTO_BAND_PX = 8;
const BandedRow: React.FC<{ attrs?: Record<string, string>; rowStyle: React.CSSProperties; children: React.ReactNode }> = ({ attrs, rowStyle, children }) => {
  const ref = React.useRef<HTMLDivElement>(null);
  return (
    <>
      <div ref={ref} data-hud-scroll-band="" {...attrs} style={{ overflowX: 'auto', overflowY: 'hidden', ...rowStyle }}>{children}</div>
      <HudScrollBandX scrollRef={ref} heightPx={CASSETTO_BAND_PX} />
    </>
  );
};

/** Party seats, THREE visible at a time, bigger (Director 2026-11-20); the rest scroll sideways under the band.
 *  V2 (R-374): all-`u()` geometry (scales with the column, no `zoom`) and a soft mask on the scroller edges so a
 *  clipped seat fades instead of hard-cutting — the overflow affordance the audit asked for. */
const PARTY_VISIBLE = 3;
/* OB-7 app-7 (Director 2026-11-21): «le proporzioni vanno ritoccate» — seats slimmed 230→205 u, peek 105→80 u;
 * the well's painted frame and the journey bar below are NOT touched. Keep `grid-auto-columns` in sync.
 * R-378 (Director 2026-11-24 «gli slot pg sn troppo grandi e toccano il frame, rimpicciolisci un po'»): seats
 * 205→170 u, peek 80→62 u — the seat columns now sit clear of the well's painted frame. */
const PARTY_SEAT_U = 170;
const PARTY_GAP_U = 12;
/* Window = 3 full seats + a visible sliver of the 4th: the partial seat under the edge mask is the affordance that
 * says «there is more» — the scroll band alone did not read (R-374 F6). */
const PARTY_PEEK_U = 62;
const PartyScroller: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div data-cassetto-party-scroller="" style={{ position: 'relative', display: 'flex', justifyContent: 'center' }}>
    <BandedRow
      attrs={{ 'data-cassetto-party-scroll': '' }}
      rowStyle={{
        width: u(PARTY_VISIBLE * PARTY_SEAT_U + (PARTY_VISIBLE - 1) * PARTY_GAP_U + PARTY_PEEK_U),
        padding: `${u(20)} 0 ${u(30)}`,
        WebkitMaskImage: 'linear-gradient(90deg, transparent, #000 9%, #000 91%, transparent)',
        maskImage: 'linear-gradient(90deg, transparent, #000 9%, #000 91%, transparent)',
      }}
    >
      <div style={{ width: 'max-content' }}>{children}</div>
    </BandedRow>
  </div>
);

export const HudRealCassettoV2: React.FC<HudRealCassettoV2Props> = ({
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
        {/* enamel field — starts under the rail, NOT at the column edge (no bar left of the frame). The frame pieces carry
         *  their own painted emerald backing baked INTO the lattice gaps (fix-joint-shards.py pass 5), so no DOM rectangle
         *  may sit under them — a backing rect pokes outside the organic silhouette as a coloured corner
         *  (Director 2026-11-21 quinquies: «un angolo colorato invece di essere ritagliato … eliminarlo e basta»). */}
        {/* mask on the left edge: the enamel's straight left boundary shows through the lattice gaps as a flat
         *  dark rectangle running the full column height («il rettangolo … sia sopra che sotto», Director 2026-11-21).
         *  Fading it in under the opaque ornament removes the hard line — same fix as the vignette's left edge. */}
        <div aria-hidden style={{ position: 'absolute', left: u(36), right: 0, top: 0, bottom: 0,
          /* BAPTIZED (Director 2026-11-22 «battezzo»): the OUTER field is BLACK — heavy nero veil over the
           *  marble texture («cornice oro su velluto nero con cammei verdi»); inner frames/wells keep their
           *  own enamel fills — do NOT darken them (ruling: «non dentro i frame interni»). */
          background: `linear-gradient(rgba(3,5,5,.86), rgba(3,5,5,.86)), url(${PAINTED_PIECES.ground.src}) center / cover no-repeat, #060807`,
          pointerEvents: 'none',
          WebkitMaskImage: `linear-gradient(90deg, transparent 0, #000 ${u(120)})`, maskImage: `linear-gradient(90deg, transparent 0, #000 ${u(120)})` }} />
        <div
          style={{
            position: 'absolute', inset: 0,
            display: 'flex', flexDirection: 'column',
            /* V2 (R-374 rev2 → OB-7 app-2 «troppo vicini al frame a sinistra, spazio vuoto a destra»): the whole
             * shared axis shifts RIGHT — padL 148 u gives ~47 u clearance past the rail's right edge (~101 u)
             * and padR 52 u tightens the dead space on the right; the content column (148..972) centres on
             * u560, the perceived enamel-card axis the CTA shares. */
            paddingLeft: u(148), paddingRight: u(52), paddingBottom: u(CTA_H + CTA_BOTTOM_GAP + 30),
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
             *  («quel quadrato», Director 2026-11-21). V2 (R-374): marginRight pushed to -30 so the right edge of the
             *  vignette reaches the screen edge instead of hard-cutting ~8 px short (audit F7). */}
            <div data-cassetto-vignette-frame="" style={{ position: 'relative', flex: '0 0 auto', marginTop: u(VIGNETTE_TOP), marginLeft: u(-50), marginRight: u(-30),
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
            {/* Title + briefing, FREE-FLOATING on the enamel (R-378, Director 2026-11-24: «la parte del titolo e
             *  flavour text nn m piace cm è resa» — the boxed cartouche is gone). The engraved title runs between
             *  two hairline rules that taper into the dark, the golden's gem ornament divides title from
             *  briefing, and the flavour text breathes without a frame. */}
            <div data-cassetto-cartouche="" style={{ position: 'relative', flex: '0 0 auto', marginTop: u(2), marginBottom: u(6), padding: `0 ${u(28)}`, textAlign: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: u(18) }}>
                <span aria-hidden style={{ flex: '1 1 0', height: u(2), background: `linear-gradient(90deg, transparent, ${C.gold}aa)` }} />
                <div style={{ fontFamily: CINZEL, fontSize: fzMin(46), fontWeight: 700, lineHeight: 1.05, letterSpacing: '0.06em', textTransform: 'uppercase', whiteSpace: 'nowrap',
                  /* HUD gold (the «Day 1» ink, measured (243,225,147)) as a lit gradient — the mockup's title is warm gold (252,235,139) */
                  background: 'linear-gradient(180deg, #fff3b4 0%, #f3e193 45%, #dcb857 100%)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent',
                  filter: 'drop-shadow(0 2px 3px rgba(0,0,0,.85))' }}>
                  {quest.title}
                </div>
                <span aria-hidden style={{ flex: '1 1 0', height: u(2), background: `linear-gradient(90deg, ${C.gold}aa, transparent)` }} />
              </div>
              <img aria-hidden alt="" draggable={false} src={`${ASSET}/cart-gem.webp`} style={{ display: 'block', width: u(128), height: 'auto', margin: `0 auto`, pointerEvents: 'none' }} />
              <p style={{ margin: `${u(-4)} auto 0`, maxWidth: '96%', fontStyle: 'italic', fontSize: fzMin(36), lineHeight: 1.32, color: C.briefing, textShadow: '0 1px 2px rgba(0,0,0,.7)', textWrap: 'balance' }}>
                {quest.briefing}
              </p>
            </div>
          </div>

          {/* ---------- party-slots ---------- */}
          <div data-block="party-slots" style={{ ...wellStyle, marginTop: u(18), flex: '1 1 auto', display: 'flex', flexDirection: 'column', justifyContent: 'center', minHeight: u(200) }}>
            <div data-cassetto-rack="" style={{ padding: `${u(40)} 0 ${u(30)}` }}>
              <PartyScroller>
                <ResidentSlotRack
                  slots={slots}
                  layout="detail"
                  slotSize={36}
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
          <div data-block="bag-slots" style={{ ...wellStyle, marginTop: u(22), flexShrink: 0 }}>
            <BandedRow attrs={{ 'data-cassetto-bag-scroll': '' }} rowStyle={{ display: 'flex', padding: `${u(40)} ${u(28)} ${u(34)}` }}>
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
          <div data-block="journey-strip" style={{ ...wellStyle, marginTop: u(22), padding: `${u(44)} 0 ${u(30)}`, flexShrink: 0 }}>
            {/* V2 (R-374 rev2): the pill's decorated ends must not touch the well's painted frame — inset 56 u. */}
            <div style={{ position: 'relative', margin: `0 ${u(56)}` }}>
              {/* Gemini-generated pill, ORNATE pass (Director 2026-11-22 «il componente viaggi è ancora quello vecchio»):
               *  `journey-pill.webp` — lit emerald Outbound, two dark recessed segments, slanted cuts with branch flourishes,
               *  8 emerald gems — keyed, empty: icons and names stay live DOM on top (i18n). */}
              <img data-cassetto-journey-art="" aria-hidden alt="" draggable={false} src={`${ASSET}/journey-pill.webp`} style={{ display: 'block', width: '100%', height: 'auto' }} />
              {quest.legs.map((leg, i) => (
                <div key={i} style={{ position: 'absolute', top: 0, bottom: 0, left: `${JOURNEY_CENTERS[i] ?? 50}%`, transform: 'translateX(-50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: u(2), pointerEvents: 'none' }}>
                  <EngravedIcon id={LEG_ICONS[i] ?? 'ico-dot'} size={u(52)} style={{ color: i === ACTIVE_LEG ? '#fff3b4' : C.goldInk, filter: 'drop-shadow(0 1px 2px rgba(0,0,0,.8))' }} />
                  <span style={{ fontFamily: CINZEL, fontSize: fzMin(28), fontWeight: 700, letterSpacing: '0.03em', lineHeight: 1.05, color: i === ACTIVE_LEG ? '#fff6cf' : C.goldInk, textShadow: '0 1px 3px rgba(0,0,0,.9)', whiteSpace: 'nowrap' }}>{leg.label}</span>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', margin: `${u(6)} ${u(56)} 0` }}>
              {quest.legs.map((leg, i) => (
                <div key={i} data-testid={`cassetto-leg-days-${i}`} style={{ flex: 1, textAlign: 'center', fontFamily: CINZEL, fontSize: fzMin(26), letterSpacing: '0.06em', color: C.muted }}>
                  {typeof leg.days === 'number' ? t('gameFrame.cassetto.legDays', { count: leg.days }) : leg.days}
                </div>
              ))}
            </div>
            {quest.totalDays != null && (
              <div data-testid="cassetto-journey-total" style={{ textAlign: 'center', marginTop: u(6) }}>
                <span style={{ fontFamily: CINZEL, fontSize: fzMin(26), letterSpacing: '0.12em', textTransform: 'uppercase', color: C.muted }}>
                  {t('gameFrame.cassetto.journeyTotal', { count: quest.totalDays })}
                </span>
              </div>
            )}
          </div>

          {/* ---------- risk-rewards: TWO wells, NO labels (OB-7 app-5, Director 2026-11-21: «nn voglio le scritte
           *  risk e reward» — amends the 2026-11-21 «Risk/reward + journey» labels ruling). Each well: big emblem
           *  left, then a column — the sim's % ON TOP and aligned («% sopra, n sotto, e allinearsi bene»). Risk
           *  keeps its lit/dimmed skull scale; the chest scale is GONE (R-378, Director 2026-11-24: «elimina i 5
           *  forzieri speculari ai 5 teschi (i teschi rimangono)»). The reward well carries the CONCRETE
           *  reward under the % («mostriamo nel reward il reward, sotto la % di vittoria, presentato bene») —
           *  visible before the commit (Pillar 4), tooltip keeps the detail. NO cost cell (INV-5). ---------- */}
          <div data-block="risk-rewards" style={{ marginTop: u(22), display: 'flex', gap: u(14), flexShrink: 0 }}>
            <div data-testid="cassetto-risk-well" data-risk-state={quest.riskPending ?? 'ready'} style={{ ...wellStyle, flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: u(12), padding: `${u(38)} ${u(16)} ${u(28)} ${u(20)}` }}>
              <img src={`${ASSET}/skull.webp`} alt="" draggable={false} style={{ width: u(128), height: u(128), flexShrink: 0 }} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: u(10), alignItems: 'flex-start', minWidth: 0 }}>
                <BigPct pct={quest.deathPct} tone="danger" testId="cassetto-death-pct" size={48} label={t('questExpedition.forecast.death', { pct: Math.round(quest.deathPct ?? 0) })} />
                <EmblemLevel src={`${ASSET}/skull.webp`} level={quest.riskPending ? undefined : quest.riskLevel} max={quest.riskLevelMax ?? 4} testId="cassetto-risk-value" dataAttr="data-skull" label={`${t('gameFrame.cassetto.risk', 'Risk')}: ${quest.riskPending === 'computing' ? '…' : quest.riskLabel}`} />
              </div>
            </div>
            <div data-testid="cassetto-reward-well" style={{ ...wellStyle, flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: u(12), padding: `${u(38)} ${u(16)} ${u(28)} ${u(20)}` }}>
              <img src={`${ASSET}/chest.webp`} alt="" draggable={false} style={{ width: u(128), height: u(128), flexShrink: 0 }} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: u(10), alignItems: 'flex-start', minWidth: 0 }}>
                <BigPct pct={quest.successPct} tone="gold" testId="cassetto-success-pct" size={48} label={t('questExpedition.forecast.reward', { pct: Math.round(quest.successPct ?? 0) })} leading={<img src={`${ASSET}/laurel.webp`} alt="" aria-hidden draggable={false} data-laurel="" style={{ width: u(46), height: u(46), flexShrink: 0, opacity: quest.successPct != null ? 1 : 0.4 }} />} />
                {/* the concrete reward, in gold-rimmed insets under the victory % — readable at a glance, `title` carries the detail */}
                <div data-testid="cassetto-reward-items" role="group" aria-label={t('gameFrame.cassetto.reward', 'Reward')} style={{ display: 'flex', flexWrap: 'wrap', gap: u(8), marginTop: u(2) }}>
                  {quest.rewards.map((r) => (
                    <span key={r.icon} title={`${r.qty} ${r.icon}`} style={{ display: 'inline-flex', alignItems: 'center', gap: u(6), padding: `${u(5)} ${u(11)}`, borderRadius: u(6), border: `1px solid ${C.gold}66`, background: 'rgba(4,40,30,.42)', boxShadow: 'inset 0 1px 0 rgba(255,238,170,.08), 0 1px 3px rgba(0,0,0,.4)', fontFamily: CINZEL, fontSize: fzMin(30), fontWeight: 700, color: C.goldInk, textShadow: '0 1px 2px rgba(0,0,0,.85)', whiteSpace: 'nowrap' }}>
                      <img src={`/assets/ui/resources/res-${r.icon}-64.webp`} alt="" style={{ width: u(34), height: u(34) }} draggable={false} />
                      {r.qty}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* ---------- launch-cta: inline reason + the CONFIRM button ---------- */}
          <div data-block="launch-cta" style={{ display: 'contents' }}>
            {!canSend && disabledReason && (
              /* Director 2026-11-22 («togli le scritte party incomplete ecc.»): the reason is NOT painted —
               * supersedes OB-7 iss-a «motivo-visibile». It stays in the DOM sr-only so `aria-describedby`
               * still announces it to screen readers. INV-2 «motivo inline visibile» amended by ruling. */
              <div
                id="cassetto-confirm-reason"
                data-testid="cassetto-confirm-reason"
                className="sr-only"
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
              {/* R-378 (Director 2026-11-24): when the plan is complete the plaque's jewels LIGHT UP — pulsing
               *  glows pinned on the three painted emeralds (left tip / crest / right tip of cta-plaque.webp,
               *  centres measured on the 1500×381 source). Disabled → nothing: the lit gems ARE the affordance. */}
              {canSend && (
                <span aria-hidden data-testid="cassetto-cta-jewels" style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
                  {CTA_JEWELS.map(([x, y, w, delay]) => (
                    <i key={`${x}-${y}`} className="cta-jewel" style={{ left: `${x}%`, top: `${y}%`, width: `${w}%`, animationDelay: `${delay}s` }} />
                  ))}
                </span>
              )}
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

export default HudRealCassettoV2;
