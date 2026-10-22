/**
 * QuestExpeditionDetail — «Dispatch Table» (PLAN-043 WS-3, artifact-r005).
 *
 * The POI's live planning surface, redrawn as a three-zone composition:
 *
 *   CENTER STAGE — ONE draggable planner unit (hero letterbox with the
 *     engraved seals → marching-order rack TESTA→CODA → loadout →
 *     Selection Tray → anchored footer) under the shared anchor-only drag
 *     grammar (`useHudPanelDrag` persists only the user's offset — the
 *     stageZones solver owns the placement once WS-2's provider lands);
 *   RIGHT WING — the forecast plaque, pinned: it never hides while the
 *     party is being edited and keeps the live ±% deltas (desiderata v23);
 *   LEFT WING — the companions roster: drags and keyboard drops land on
 *     the rack through the shared page DndContext.
 *
 * Pure presentation — all numbers come from `resolved` (the frozen offer)
 * and `estimate` (the chunked Monte Carlo), all strings from i18n.
 */
import React, { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import * as Tooltip from '@radix-ui/react-tooltip';
import { useDraggable } from '@dnd-kit/core';
import { Maximize2, Minus, Swords, X } from 'lucide-react';
import { ResidentSlotRack } from '@/ui/idleVillage/components/ResidentSlotRack';
import { HudPlaque, SkinButton, SkinScope } from '@/ui/idleVillage/skins/primitives';
import { HudChip, TONE } from '@/ui/idleVillage/questS1Lab/hud/atoms';
import { useHudPanelDrag } from '@/ui/idleVillage/components/gameFrame/useHudPanelDrag';
import { getHudZoomFactor } from '@/ui/idleVillage/components/gameFrame/hudScale';
import { VillageStashItemIcon } from '@/ui/idleVillage/components/gameFrame/villageStashItemIcons';
import { stashAnnouncement } from '@/ui/idleVillage/components/gameFrame/VillageStashPanel';
import { useVillageStashStore } from '@/ui/idleVillage/store/useVillageStashStore';
import { EngravedIcon, type EngravedIconId } from '@/ui/idleVillage/components/gameFrame/engravedIcons';
import { useReducedMotion } from '@/ui/idleVillage/hooks/useReducedMotion';
import { useMinimalGameplayStore } from '@/store/useMinimalGameplay';
import { useCanonicalRosterBundle } from '@/ui/idleVillage/roster';
import { QUEST_ELIGIBILITY } from '@/balancing/config/idleVillage/quests/questEligibility';
import { formatResidentLabel } from '@/ui/idleVillage/residentName';
import { getResidentPortraitUrl } from '@/engine/game/idleVillage/residentVisualResolver';
import { DEFAULT_GAME_FRAME_CONFIG } from '@/balancing/config/idleVillage/gameFrameConfig';
import { DEFAULT_IDLE_VILLAGE_CONFIG } from '@/balancing/config/idleVillage/defaultConfig';
import type { ResidentSlotViewModel, SlotSeatPhase } from '@/ui/idleVillage/slots/types';
import type { QuestPoi, DangerBand } from '@/balancing/config/idleVillage/quests/questPois';
import { DANGER_BANDS } from '@/balancing/config/idleVillage/quests/questPois';
import { REWARD_TIERS } from '@/balancing/config/idleVillage/quests/rewardTiers';
import { QUEST_STASH, loadoutCoverage } from '@/balancing/config/idleVillage/quests/questStash';
import { toEngineFlag } from '@/balancing/config/idleVillage/quests/questItems';
import type { QuestScenario } from '@/balancing/config/idleVillage/quests/questScenario.schema';
import { QUEST_PLANNER_INFO } from '@/balancing/config/idleVillage/quests/questPlannerInfo';
import type { PartyEstimate, ResolvedQuestOffer } from '@/ui/idleVillage/questS1Lab/questOffer';
import type { ForecastDelta } from '@/ui/idleVillage/questS1Lab/questSimulation';
import { positionalWeights, STAT_ICONS } from '@/ui/idleVillage/questS1Lab/questRun';
import type { ResidentState } from '@/engine/game/idleVillage/TimeEngine';
import type { LabStat } from '@/ui/idleVillage/questS1Lab/questScenario';
import { residentToQuestMember } from '@/ui/idleVillage/questS1Lab/residentToQuestMember';
import { NODE_ART } from '@/ui/idleVillage/questS1Lab/questArt';
import { deriveKeyStats, formatExpeditionSpan, expeditionTotalDays, type BagStockEntry, type LoadoutDuration } from './questExpedition';
import { journeyFasiOf } from './questJourney';
import { STAT_SHORT } from '@/ui/idleVillage/questS1Lab/hud/atoms';
import { getStatIconComponent, lucideStatIcons } from '@/ui/shared/statIconUtils';

const FONT = { display: 'var(--skin-font-display)', serif: 'var(--skin-font-serif)' } as const;

/** Config i18nKeys are authored `idleVillage.…`-prefixed; the namespace is
 *  already `idleVillage` — strip the prefix before `t()`. */
const stripNs = (key: string) => key.replace(/^idleVillage\./, '');

const bandById = (id: string): DangerBand | undefined => DANGER_BANDS.find((b) => b.id === id);

/** engine flag → stash entry: the static catalog join the loadout zone
 *  needs for effect tooltips (`descKey` lives on the stash item). */
const STASH_BY_FLAG = new Map(QUEST_STASH.items.map((i) => [i.flag, i]));

/** Shared tooltip surface styling — same lacquer idiom as QuestRunWindow. */
const TOOLTIP_STYLE: CSSProperties = {
  zIndex: 2000,
  maxWidth: 280,
  padding: '9px 11px',
  borderRadius: 8,
  border: '1px solid color-mix(in srgb, var(--skin-surface-border) 70%, transparent)',
  background: 'var(--skin-hud-lacquer-deep)',
  boxShadow: '0 10px 24px color-mix(in srgb, var(--skin-hud-lacquer-deep) 80%, transparent)',
};

/** WS-3 open choreography (artifact-r005, TS-6): compositor-only keyframes —
 *  a slow scale on the cover art, a fade-up on the lower-third, a staggered
 *  seal stamp. `prefers-reduced-motion` skips all of it at the call site. */
const MOTION_CSS = `
@keyframes qed-hero-scale { from { transform: scale(1.08); } to { transform: scale(1); } }
@keyframes qed-fade-up { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }
@keyframes qed-seal-in { from { opacity: 0; transform: scale(0.92); } to { opacity: 1; transform: scale(1); } }
`;

/** The frozen rack fades its medal during hold, but the planner flight starts only after extraction completes. */
const EXTRACTION_VISIBILITY_CSS = `
[data-testid="quest-expedition-detail"] [data-extracting="true"] [data-testid^="slot-medal-"] {
  opacity: 1 !important;
  transform: none !important;
}
`;

const SECTION_LABEL: CSSProperties = {
  fontFamily: FONT.display,
  fontSize: 12,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  color: TONE.secondary,
};

/**
 * Rich tooltip for a bag item (PLAN-036, R-195): name, effect description,
 * stat coverage and village stock. Tiles stay icon-only — ALL text lives
 * here. `labelKey`/`descKey` may carry the `idleVillage.` prefix (stripped)
 * or be `questS1Lab.*` (verbatim).
 */
/** The planner shell: item tooltips flip/shift inside it instead of spilling over the roster
 *  or other panels (R-234, T-03 — a portalled surface does not know its host's edges). */
export const PlannerBoundaryContext = React.createContext<React.RefObject<HTMLElement | null> | null>(null);

export const BagItemTooltip: React.FC<{ entry: BagStockEntry }> = ({ entry }) => (
  <Tooltip.Portal>
    <BagItemTooltipContent entry={entry} />
  </Tooltip.Portal>
);

/** Mounted only while the tooltip is open, so the boundary is read once the shell exists. */
const BagItemTooltipContent: React.FC<{ entry: BagStockEntry }> = ({ entry }) => {
  const { t } = useTranslation('idleVillage');
  const boundary = React.useContext(PlannerBoundaryContext)?.current ?? undefined;
  const { item, qty } = entry;
  const stash = item.engineFlag ? STASH_BY_FLAG.get(item.engineFlag) : undefined;
  const descKey = item.descKey ?? stash?.descKey;
  const line: CSSProperties = { fontFamily: FONT.serif, fontSize: 12, lineHeight: 1.35, color: TONE.text };
  return (
      <Tooltip.Content side="top" sideOffset={6} collisionBoundary={boundary} collisionPadding={8} style={TOOLTIP_STYLE}>
        <div style={{ fontFamily: FONT.display, fontSize: 13, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--skin-title-color)', marginBottom: 4 }}>
          {t(stripNs(item.labelKey))}
        </div>
        {descKey && <div style={line}>{t(descKey)}</div>}
        {stash?.stats && stash.stats.length > 0 && (
          <div style={{ ...line, color: TONE.secondary }}>
            {t('questExpedition.bag.covers')} {stash.stats.map((s) => STAT_SHORT[s] ?? s).join(' · ')}
          </div>
        )}
        <div style={{ ...line, color: TONE.secondary }}>{t('questExpedition.bag.stock', { qty })}</div>
      </Tooltip.Content>
  );
};

/**
 * A companion tile inside the Selection Tray (WS-3): a compact portrait
 * token the player drags onto a marching-order slot — the payload reaches
 * the expedition session through the shared page DndContext exactly like a
 * roster card (`active.id` = residentId). While dragged, the tile dims and
 * a fixed portal ghost follows the pointer (the rack token's pattern — an
 * in-place transform would paint under the scrollable neighbours).
 */
const TrayResidentTile: React.FC<{ resident: ResidentState }> = ({ resident }) => {
  const drag = useDraggable({ id: resident.id, data: { type: 'resident', residentId: resident.id } });
  const [ghostOrigin, setGhostOrigin] = useState<DOMRect | null>(null);
  useEffect(() => {
    setGhostOrigin(drag.isDragging ? drag.node.current?.getBoundingClientRect() ?? null : null);
  }, [drag.isDragging, drag.node]);
  const name = formatResidentLabel(resident);
  const portrait = getResidentPortraitUrl(resident);
  const initials = name.split(' ').filter(Boolean).slice(0, 2).map((c) => c[0]).join('').toUpperCase();
  return (
    <>
      <div
        ref={drag.setNodeRef}
        {...drag.listeners}
        {...drag.attributes}
        data-resident-id={resident.id}
        data-testid={`tray-resident-${resident.id}`}
        title={name}
        style={{
          flexShrink: 0,
          width: 52,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 3,
          cursor: 'grab',
          opacity: drag.isDragging ? 0.35 : 1,
        }}
      >
        <span
          style={{
            width: 40, height: 40, borderRadius: '50%', overflow: 'hidden',
            border: '2px solid color-mix(in srgb, var(--skin-surface-border) 65%, transparent)',
            background: 'rgba(0,0,0,0.55)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: FONT.display, fontSize: 11, letterSpacing: '0.1em', color: TONE.text,
          }}
        >
          {portrait ? <img src={portrait} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : initials}
        </span>
        <span style={{ fontFamily: FONT.serif, fontSize: 10, color: TONE.secondary, maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {name}
        </span>
      </div>
      {ghostOrigin && drag.transform &&
        createPortal(
          <span
            aria-hidden
            data-testid="tray-resident-ghost"
            className="pointer-events-none fixed flex items-center justify-center overflow-hidden rounded-full bg-black/70"
            style={{
              left: ghostOrigin.left + ghostOrigin.width / 2 - 20 + drag.transform.x,
              top: ghostOrigin.top + drag.transform.y,
              width: 40,
              height: 40,
              zIndex: 10000,
              border: '2px solid var(--skin-title-color, #f0cf6a)',
              boxShadow: '0 6px 18px rgba(0,0,0,0.55), 0 0 12px color-mix(in srgb, var(--skin-title-color, #f0cf6a) 55%, transparent)',
            }}
          >
            {portrait ? <img src={portrait} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : initials}
          </span>,
          document.body,
        )}
    </>
  );
};

/**
 * An engraved read-only seal on the hero (Danger / Reward / Duration) —
 * WS-3: the offer's frozen facts are shown as immutable stamps, never as
 * editable controls.
 */
const EngravedSeal: React.FC<{ testId: string; label: string; value: string; delta?: string | null; icon: EngravedIconId; tone?: 'ok' | 'warn' | 'danger'; hint?: string }> = ({ testId, label, value, delta, icon, tone, hint }) => {
  const color = tone === 'ok' ? TONE.ok : tone === 'warn' ? TONE.warn : tone === 'danger' ? TONE.danger : TONE.text;
  return (
    <span
      data-testid={testId}
      title={hint ?? `${label}: ${value}`}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: 6,
        border: '1px solid color-mix(in srgb, var(--skin-surface-border) 55%, transparent)',
        background: 'color-mix(in srgb, var(--skin-hud-lacquer-deep) 72%, transparent)',
      }}
    >
      <EngravedIcon id={icon} size={13} aria-hidden style={{ color }} />
      <span style={{ fontFamily: FONT.display, fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: TONE.secondary }}>
        {label}
      </span>
      <span style={{ fontFamily: FONT.display, fontSize: 12, color }}>
        {value}
        {delta && <em style={{ fontStyle: 'normal', fontSize: 11, marginLeft: 4 }}>{delta}</em>}
      </span>
    </span>
  );
};

/**
 * A packed bag item: a click releases it back into the shared warehouse
 * pool (PLAN-073 A2; R-246: click-only, no drag affordance).
 */
const PackedBagItem: React.FC<{
  slotIndex: number;
  entry: BagStockEntry;
  onRelease: (itemId: string) => void;
}> = ({ slotIndex, entry, onRelease }) => {
  const { t } = useTranslation('idleVillage');
  return (
    <button
      type="button"
      data-testid={`loadout-item-${entry.item.id}`}
      data-bag-slot-index={slotIndex}
      aria-label={t('questExpedition.bag.removeSlot', { item: t(stripNs(entry.item.labelKey)) })}
      onClick={() => onRelease(entry.item.id)}
      style={{
        width: '100%', height: '100%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        background: 'none', border: 'none', color: 'var(--skin-title-color)', cursor: 'pointer', padding: 0,
      }}
    >
      <VillageStashItemIcon icon={entry.item.icon} size={22} />
    </button>
  );
};

/**
 * One quest bag slot. Empty slots keep the tray-opening affordance;
 * occupied slots release on click.
 */
const QuestBagSlot: React.FC<{
  poiId: string;
  slotIndex: number;
  entry: BagStockEntry | undefined;
  onRelease: (itemId: string) => void;
  onOpenItems: (trigger: HTMLElement) => void;
}> = ({ slotIndex, entry, onRelease, onOpenItems }) => {
  const { t } = useTranslation('idleVillage');
  return (
    <span
      data-testid={`bag-slot-${slotIndex}`}
      style={{
        width: 44, height: 44, borderRadius: 8, display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        border: '1px solid color-mix(in srgb, var(--skin-surface-border) 60%, transparent)',
        background: 'color-mix(in srgb, var(--skin-hud-lacquer-deep) 55%, transparent)',
      }}
    >
      {entry ? (
        <Tooltip.Root delayDuration={120}>
          <Tooltip.Trigger asChild>
            <PackedBagItem slotIndex={slotIndex} entry={entry} onRelease={onRelease} />
          </Tooltip.Trigger>
          <BagItemTooltip entry={entry} />
        </Tooltip.Root>
      ) : (
        <button
          type="button"
          aria-label={t('questExpedition.bag.emptySlot', { index: slotIndex + 1 })}
          onClick={(e) => onOpenItems(e.currentTarget)}
          style={{ width: '100%', height: '100%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: 'none', border: 'none', color: TONE.secondary, cursor: 'pointer', padding: 0 }}
        >
          <EngravedIcon id="ico-pouch" size={16} style={{ opacity: 0.4 }} aria-hidden />
        </button>
      )}
    </span>
  );
};

export interface QuestExpeditionDetailProps {
  poi: QuestPoi;
  scenario: QuestScenario | undefined;
  /** Frozen offer — `null` while the resolution (band sim) is pending. */
  resolved: ResolvedQuestOffer | null;
  resolvePending: boolean;
  slots: ResidentSlotViewModel[];
  /** 'computing' while a fresh sim is in flight, 'incomplete' until every
   *  required slot is filled, else the banded estimate. */
  estimate: PartyEstimate | 'computing';
  /** Signed pp shift vs the previous party configuration (S3 T-2) —
   *  `null` when no real previous sim exists. */
  forecastDelta: ForecastDelta | null;
  /** Planning intel rows: authored `previewHint`s always, `revealHint`s
   *  when an explorer slot unlocked them (D-S3-3). */
  intelHints: { nodeId: string; hint: string; revealed: boolean }[];
  /** Effective expedition duration under the loadout (S3 T-3):
   *  `factor ≠ 1` ⇒ the bag changes the run's real pace. */
  expeditionDuration: LoadoutDuration;
  requiredFilled: boolean;
  /** Village-stocked consumables the bag can hold (PLAN-036): the shelf IS
   *  the picker's catalogue — `qty` feeds each tile's stock badge. */
  items: BagStockEntry[];
  selectedItemIds: string[];
  onToggleItem: (itemId: string) => void;
  /** PLAN-073 D-2: empties this planner's bag back into the shared pool — same
   *  per-owner affordance as the party reset. Rendered only when provided. */
  onReleaseAllItems?: () => void;
  /** Opens the page-owned Village Stash and records this control for focus return. */
  onOpenStash: (trigger: HTMLButtonElement) => void;
  canSend: boolean;
  onSend: () => void;
  onClose: () => void;
  onSlotClear: (slotId: string) => void;
  /** R-257: residents whose seat medallion must not render — carried by a
   *  flight proxy, or mid-exit while the deferred clear is uncommitted. */
  suppressedResidentIds?: readonly string[];
  /** PLAN-043 WS-1 swap guard: the rack reports each seat's extraction phase;
   *  the session's commitSwap refuses a swap while either seat is non-idle. */
  onSlotPhaseChange?: (slotId: string, phase: SlotSeatPhase) => void;
  position?: { x: number; y: number };
}

export const QuestExpeditionDetail: React.FC<QuestExpeditionDetailProps> = ({
  poi,
  scenario,
  resolved,
  resolvePending,
  slots,
  estimate,
  forecastDelta,
  intelHints,
  expeditionDuration,
  requiredFilled,
  items,
  selectedItemIds,
  onToggleItem,
  onReleaseAllItems,
  onOpenStash,
  canSend,
  onSend,
  onClose,
  onSlotClear,
  suppressedResidentIds,
  onSlotPhaseChange,
  position,
}) => {
  const { t } = useTranslation('idleVillage');
  const reducedMotion = useReducedMotion();
  const [minimised, setMinimised] = useState(false);
  /* WS-3 Selection Tray: one on-demand strip with two modes (residents |
   *  items) that replaces the PLAN-036 external popover. Escape/outside
   *  pointer close ONLY the tray; focus returns to the origin control. */
  const [trayMode, setTrayMode] = useState<'items' | 'residents' | null>(null);
  const trayOpen = trayMode !== null;
  const trayRef = useRef<HTMLDivElement | null>(null);
  const trayReturnRef = useRef<HTMLElement | null>(null);
  /* The origin control may unmount while the tray is open (empty bag slot →
   *  item chip): keep its nearest testid ancestor as a re-query fallback so
   *  focus return still lands inside the same slot (AC-20). */
  const trayReturnHostRef = useRef<string | null>(null);
  const shellRef = useRef<HTMLDivElement | null>(null);
  const bodyRef = useRef<HTMLDivElement | null>(null);
  const [bodyOverflows, setBodyOverflows] = useState(false);
  const [hoveredSlotId, setHoveredSlotId] = useState<string | null>(null);
  /* PLAN-073: bag outcomes for THIS planner announce through its own live
   *  region — the shelf's region narrates only global (ownerless) events,
   *  so a mutation is never announced twice. */
  const lastStashEvent = useVillageStashStore((s) => s.lastEvent);
  const bagAnnouncement = lastStashEvent && lastStashEvent.poiId === poi.id ? stashAnnouncement(t, lastStashEvent) : null;
  const [viewport, setViewport] = useState(() => ({ w: window.innerWidth, h: window.innerHeight }));

  const LAYOUT = QUEST_PLANNER_INFO.layout;
  const STAGE = DEFAULT_GAME_FRAME_CONFIG.stageZones;
  const QD = DEFAULT_GAME_FRAME_CONFIG.questDetail;
  const EDGE_INSET = DEFAULT_GAME_FRAME_CONFIG.insets.edgeInsetPx;
  const DAY_TICKS = DEFAULT_IDLE_VILLAGE_CONFIG.globalRules.dayLengthInTimeUnits;

  /* CENTER-unit width: the corridor between the roster's right edge and
   *  the RIGHT WING reservation (`questDetailPosition` already anchors x to
   *  the corridor start — mirror the same arithmetic for the width). The
   *  drag bound below needs this, so it is computed before the hook. */
  const rosterRight = DEFAULT_GAME_FRAME_CONFIG.roster.leftPx + DEFAULT_GAME_FRAME_CONFIG.roster.widthPx;
  /* PLAN-043 WS-5 DEF-06: inside the CSS-zoomed chrome layer all layout
   *  math is in chrome units — `viewport` stores device px (resize listener),
   *  `vpw`/`vph` are the unit-space size everything here is laid out in. */
  const hudZoom = getHudZoomFactor();
  const vpw = viewport.w / hudZoom;
  const vph = viewport.h / hudZoom;
  const corridorW = Math.max(0, vpw - (EDGE_INSET + 8) - QD.ledgerWidthPx - QD.gapPx - (rosterRight + QD.gapPx));
  const plannerWidth = Math.min(LAYOUT.plannerNaturalWidthPx, Math.max(LAYOUT.plannerMinWidthPx, corridorW));

  const anchor = position ?? { x: 120, y: 96 };

  /* Drag containment (AC-01): the CENTER unit may never cross into the
   *  pinned RIGHT WING — its right edge stops `gapPx` short of the wing's
   *  left edge. Interim containment until the stageZones provider owns
   *  zone bounds natively. At viewports narrower than planner + wing the
   *  band would be physically impossible (loX > hiX and the clamp pushed
   *  the unit off-screen left) — floor the bound at edgeInset + width so a
   *  feasible placement always exists; wing overlap beats off-viewport. */
  const dragBoundsRight = Math.max(
    vpw - (EDGE_INSET + QD.gapPx) - LAYOUT.forecastWidthPx - QD.gapPx,
    EDGE_INSET + plannerWidth,
  );
  const { panelStyle, handleProps } = useHudPanelDrag({
    shellRef,
    edgeInsetPx: EDGE_INSET,
    boundsRightPx: dragBoundsRight,
    /* anchor deps: when the solver re-anchors the unit the committed offset
     *  must re-clamp against the NEW base rect, not the stale one. */
    reclampDeps: [trayOpen, vpw, vph, anchor.x, anchor.y],
  });

  useEffect(() => {
    const onResize = () => setViewport({ w: window.innerWidth, h: window.innerHeight });
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const closeTray = useCallback(() => {
    setTrayMode(null);
    let target = trayReturnRef.current;
    if (target && !target.isConnected && trayReturnHostRef.current) {
      const host = document.querySelector<HTMLElement>(`[data-testid="${trayReturnHostRef.current}"]`);
      if (host) {
        target = host.matches('button, [role="button"], [tabindex]')
          ? host
          : host.querySelector<HTMLElement>('button, [role="button"], [tabindex="0"]') ?? host;
      }
    }
    target?.focus?.();
  }, []);

  useEffect(() => {
    if (!trayOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      e.stopPropagation();
      closeTray();
    };
    /* AC-20: click-outside closes the tray EXCEPT drags originating in the
     *  LEFT WING roster and clicks on Forecast rows (row↔slot highlight —
     *  closing mid-edit would lose the tray under a hover gesture). The
     *  planner's own pick controls (toggles, empty slots, bag slots) are
     *  also excluded so consecutive picks re-aim instead of close+open. */
    const onPointerDown = (e: PointerEvent) => {
      const target = e.target as Element | null;
      if (!target) return;
      if (trayRef.current?.contains(target)) return;
      if (
        target.closest('[data-testid="resident-roster-panel"]') ||
        target.closest('[data-testid="quest-expedition-forecast-column"]') ||
        target.closest('[data-testid^="bag-slot-"]') ||
        target.closest('[data-testid^="slot-button-"]')
      ) {
        return;
      }
      closeTray();
    };
    window.addEventListener('keydown', onKey, true);
    window.addEventListener('pointerdown', onPointerDown, true);
    return () => {
      window.removeEventListener('keydown', onKey, true);
      window.removeEventListener('pointerdown', onPointerDown, true);
    };
  }, [trayOpen, closeTray]);

  const compact = vph < LAYOUT.minZeroScrollViewportHeightPx;
  /* WITNESS-WS3-02: the hero resize is a DISCRETE one-frame swap (150→56),
   *  never a layout-property animation — `transition` touches opacity and
   *  transform only. */
  const heroPx = trayOpen ? LAYOUT.heroTrayPx : compact ? LAYOUT.heroCompactPx : LAYOUT.heroRestPx;

  /* Terminal fallback probe (artifact-r005): when the rack/loadout body
   *  needs an internal scroll to stay inside the stage, flag it — hero and
   *  footer stay pinned either way. */
  useEffect(() => {
    const el = bodyRef.current;
    if (!el) return;
    const check = () => setBodyOverflows(el.scrollHeight > el.clientHeight + 1);
    check();
    const ro = new ResizeObserver(check);
    ro.observe(el);
    return () => ro.disconnect();
  }, [compact, trayOpen, slots, selectedItemIds]);

  const dangerBand = resolved ? bandById(resolved.resolvedOffer.bandIds.danger) : undefined;
  const rewardTier = resolved ? REWARD_TIERS.find((rt) => rt.id === resolved.resolvedOffer.bandIds.rewardTier) : undefined;
  /* R-248: the wing's footprint must not collapse and re-expand on every
   *  party edit — while a fresh sim is in flight (or the party is
   *  momentarily incomplete) the LAST completed estimate stays mounted
   *  under the state line, flagged `data-forecast-stale`, instead of the
   *  plaque swapping to a one-line placeholder (the visible resize the
   *  Director reported). A fresh mount keeps nothing and shows the plain
   *  state line, exactly as before. */
  const lastReadyEstimateRef = useRef<Exclude<PartyEstimate, 'incomplete'> | null>(null);
  useEffect(() => {
    if (typeof estimate === 'object') lastReadyEstimateRef.current = estimate;
  }, [estimate]);
  const shownEstimate = !resolvePending
    ? typeof estimate === 'object'
      ? estimate
      : lastReadyEstimateRef.current
    : null;
  const estimateStale = shownEstimate !== null && typeof estimate !== 'object';
  const title = scenario?.title ?? poi.id;
  const panelId = `quest-expedition-${poi.id}`;
  const panelZ = DEFAULT_GAME_FRAME_CONFIG.zLayers.panels;

  /* The dispatch line: authored `offer.dispatch` when present (r005 D-d),
   *  else the objective — never the raw tick span. */
  const dispatchLine = scenario?.offer.dispatch ?? scenario?.offer.objective ?? '';

  /* Duration seal (PLAN-071 T-B2): whole days, `1 day`/`N days` (D-c) — and
   *  the ROUND TRIP, not the site phase alone: `estimatedDurationTicks` is the
   *  authored on-site estimate (loadout-scaled), `fasi.travelDays` covers
   *  out+back. The planner's seal and the run's per-leg journey strip now
   *  project the same total. */
  const journeyFasi = journeyFasiOf(poi);
  const { site: siteDaysWhole, total: durationDays } = expeditionTotalDays(
    expeditionDuration.estimatedTicks,
    journeyFasi?.travelDays ?? 0,
    DAY_TICKS,
  );
  const durationHint = journeyFasi
    ? t('questExpedition.seals.durationBreakdown', {
        out: journeyFasi.travelDays,
        site: siteDaysWhole,
        back: journeyFasi.travelDays,
      })
    : undefined;
  const durationDelta = forecastDelta ? Math.round(forecastDelta.days) : 0;

  /* PLAN-036: authored key-stat tiers (verbatim, never derived by set
   *  subtraction — Rovine `con` legitimately sits in `primaryStats` AND the
   *  secondary tier). The deterministic fallback covers unschematized
   *  scenarios. */
  const keyTiers = useMemo(() => deriveKeyStats(scenario), [scenario]);

  /* Deterministic coverage (r008 §2.4): a key stat is ✓ when the packed bag
   *  covers it via `loadoutCoverage` OR an assigned member's derived quest
   *  stat meets `keyStatCoverageThreshold`. */
  const bagCoveredStats = useMemo(() => loadoutCoverage(selectedItemIds.map(toEngineFlag)), [selectedItemIds]);
  const memberStats = useMemo(
    () =>
      slots
        .map((s) => s.assignedResident)
        .filter((r): r is ResidentState => Boolean(r))
        .map((r) => residentToQuestMember(r, 'member').stats),
    [slots],
  );
  const keyStatCovered = useCallback(
    (stat: LabStat) =>
      bagCoveredStats.includes(stat) ||
      memberStats.some((stats) => (stats[stat] ?? 0) >= QUEST_PLANNER_INFO.keyStatCoverageThreshold),
    [bagCoveredStats, memberStats],
  );

  /* Hero art fallback chain (r005): `coverArt → sceneArt → engraved crest`. */
  const heroArt = scenario?.offer.coverArt ?? (scenario ? NODE_ART[scenario.startNode]?.src : undefined);

  /* Marching order exposure strip (QUEST_RULES §4, AC-08): the static
   *  planning-time profile is driven by the OCCUPIED party size — n=1→100,
   *  2→20/80, 3→0/20/80, 4→0/0/20/80 — and recomputes on member add/remove.
   *  TESTA rides slot 1, CODA follows the last occupied slot; the n=1 edge
   *  shows both tags on the single member (100%). */
  const occupiedCount = useMemo(() => slots.filter((s) => s.assignedResidentId).length, [slots]);
  const exposureWeights = useMemo(() => positionalWeights(Math.max(1, occupiedCount), 0), [occupiedCount]);
  const lastOccupiedIndex = useMemo(
    () => slots.reduce((last, s, i) => (s.assignedResidentId ? i : last), -1),
    [slots],
  );

  /* Selection Tray companion pool — draggable tiles. The assignment gate
   *  still lives in the session (a refused drop returns `false`), so the
   *  tray lists every available resident the rack could take. */
  /* The tray pool mirrors the canonical roster the session validates against
   *  (`residentsById` = ResidentState with a real `status`), gated by the
   *  same assignable-status list — plus the LIVE expedition/death flags the
   *  minimal store carries on MinimalResident. */
  const { residentsById } = useCanonicalRosterBundle();
  const liveResidents = useMinimalGameplayStore((s) => s.state.residents);
  const assignedIds = useMemo(
    () => new Set(slots.map((s) => s.assignedResidentId).filter(Boolean) as string[]),
    [slots],
  );
  const liveById = useMemo(() => new Map(liveResidents.map((r) => [r.id, r])), [liveResidents]);
  const trayResidents = useMemo(
    () =>
      Object.values(residentsById).filter((r) => {
        if (!QUEST_ELIGIBILITY.assignableStatuses.includes(r.status)) return false;
        const live = liveById.get(r.id);
        if (live?.isOnExpedition || live?.isDead) return false;
        return !assignedIds.has(r.id);
      }),
    [residentsById, liveById, assignedIds],
  );

  /** Opens the tray in `mode` and remembers the origin control for focus
   *  return (AC: focus returns to the invoker on close). */
  const openTray = useCallback((mode: 'items' | 'residents', origin?: HTMLElement | null) => {
    const el = origin ?? (document.activeElement as HTMLElement | null);
    trayReturnRef.current = el;
    const host = el?.closest('[data-testid]') as HTMLElement | null;
    trayReturnHostRef.current = host?.dataset.testid ?? null;
    setTrayMode(mode);
  }, []);

  const handleSlotPick = useCallback(
    (slotId: string) => {
      const origin = document.querySelector<HTMLElement>(`[data-testid="slot-button-${slotId}"]`);
      openTray('residents', origin);
    },
    [openTray],
  );

  /** Signed delta badge for a metric — `0` renders nothing (no noise).
   *  R-258: the player reads «%», never «pp» (the deltas are percentage
   *  points internally, but that unit name is sim jargon). */
  const deltaMark = (pp: number, goodWhenDown: boolean) => {
    const v = Math.round(pp);
    if (v === 0) return null;
    const improves = goodWhenDown ? v < 0 : v > 0;
    return (
      <em style={{ fontStyle: 'normal', fontSize: 12, color: improves ? TONE.ok : TONE.danger }}>
        {' '}({v > 0 ? '+' : ''}
        {v}%)
      </em>
    );
  };

  /** The slot a BY MEMBER forecast row refers to (hover → castone link). */
  const slotIdForMember = useCallback(
    (memberId: string) => slots.find((s) => s.assignedResidentId === memberId)?.id ?? null,
    [slots],
  );
  const hoveredMemberId = useMemo(() => {
    if (!hoveredSlotId) return null;
    return slots.find((s) => s.id === hoveredSlotId)?.assignedResidentId ?? null;
  }, [hoveredSlotId, slots]);

  /** Damage exposure under each castone; positional labels remain available
   *  to assistive technology while the percentage is the visible indicator. */
  const renderSlotFooter = useCallback(
    (slot: ResidentSlotViewModel, index: number) => {
      const occupied = Boolean(slot.assignedResidentId);
      const ordinal = slots.slice(0, index + 1).filter((s) => s.assignedResidentId).length - 1;
      const isTesta = occupied && ordinal === 0;
      const isCoda = occupied && index === lastOccupiedIndex;
      const isLeader = slot.role === 'leader';
      const exposurePct = occupied ? Math.round(exposureWeights[Math.max(0, ordinal)] ?? 0) : null;
      const positionLabel = isTesta && isCoda
        ? `${t('questExpedition.marching.testa')} / ${t('questExpedition.marching.coda')}`
        : isTesta
          ? t('questExpedition.marching.testa')
          : isCoda
            ? t('questExpedition.marching.coda')
            : undefined;
      const exposurePosition = positionLabel ?? t('questExpedition.marching.slot', { index: index + 1 });
      const exposureLabel = exposurePct === null
        ? undefined
        : exposurePct === 0
          ? t('questExpedition.marching.exposureNone', { position: exposurePosition })
          : t('questExpedition.marching.exposurePercent', { position: exposurePosition, pct: exposurePct });
      return (
        <div
          data-testid={`exposure-cell-${index}`}
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1, minHeight: 30 }}
        >
          {isLeader && (
            <span data-testid="exposure-leader-crown" title={t('questExpedition.marching.leader')} style={{ color: 'var(--skin-title-color)', lineHeight: 1 }}>
              <EngravedIcon id="role-leader" size={11} aria-hidden />
            </span>
          )}
          <span
            data-testid={`exposure-risk-${index}`}
            data-risk-position={isTesta && isCoda ? 'both' : isTesta ? 'testa' : isCoda ? 'coda' : occupied ? 'middle' : 'empty'}
            aria-label={exposureLabel}
            title={exposureLabel}
            style={{
              fontFamily: FONT.display,
              fontSize: 'var(--skin-hud-caps-size)',
              fontWeight: 'var(--skin-hud-caps-weight)',
              letterSpacing: 'var(--skin-hud-caps-tracking)',
              fontVariantNumeric: 'tabular-nums',
              color: TONE.secondary,
            }}
          >
            {exposurePct === null ? '—' : `${exposurePct}%`}
          </span>
        </div>
      );
    },
    [slots, lastOccupiedIndex, exposureWeights, t],
  );

  const shell: CSSProperties = {
    position: 'fixed',
    left: anchor.x,
    top: anchor.y,
    width: plannerWidth,
    pointerEvents: 'auto',
    ...panelStyle,
    zIndex: panelStyle.zIndex ?? panelZ,
  };

  const minimisedWidth = Math.min(plannerWidth, Math.max(0, vpw - EDGE_INSET * 2));
  const minimisedShell: CSSProperties = {
    ...shell,
    left: (vpw - minimisedWidth) / 2,
    width: minimisedWidth,
    transform: 'none',
  };

  const plaqueStyle: CSSProperties = {
    width: '100%',
    maxHeight: `calc(100vh - ${anchor.y + STAGE.chrome.bottomPx}px)`,
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
    padding: '10px 12px 12px',
    overflow: 'hidden',
  };

  const wingStyle: CSSProperties = {
    position: 'fixed',
    right: EDGE_INSET + QD.gapPx,
    top: STAGE.chrome.topPx + QD.gapPx,
    width: LAYOUT.forecastWidthPx,
    maxHeight: `calc(100vh - ${STAGE.chrome.topPx + QD.gapPx + STAGE.chrome.bottomPx}px)`,
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    padding: '12px 14px 14px',
    zIndex: panelZ,
    pointerEvents: 'auto',
  };

  if (minimised) {
    return (
      <SkinScope>
        <div ref={shellRef} data-hud-panel={panelId} style={minimisedShell}>
          <HudPlaque
            shape="hang"
            as="section"
            aria-label={title}
            data-testid={`floating-panel-${panelId}`}
            style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 'var(--skin-hud-inline-gap)', padding: 'var(--skin-hud-panel-padding)' }}
          >
            <div
              {...handleProps}
              style={{ ...handleProps.style, width: '100%', minWidth: 0, display: 'flex', alignItems: 'center', gap: 'var(--skin-hud-inline-gap)' }}
            >
              <Swords aria-hidden style={{ width: 18, height: 18, color: TONE.accent }} />
              <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: FONT.display, fontSize: 'var(--skin-hud-name-size)', fontWeight: 'var(--skin-hud-name-weight)', letterSpacing: 'var(--skin-hud-name-tracking)', textTransform: 'uppercase', color: 'var(--skin-title-color)' }}>
                {title}
              </span>
              <span data-hud-controls="" style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--skin-hud-inline-gap)', flexShrink: 0 }}>
                <button
                  type="button"
                  data-testid={`floating-panel-close-${panelId}`}
                  aria-label={t('floatingPanel.close')}
                  title={t('floatingPanel.close')}
                  onClick={onClose}
                >
                  <X aria-hidden />
                </button>
                <button
                  type="button"
                  data-testid={`floating-panel-minimize-${panelId}`}
                  aria-label={t('floatingPanel.restore')}
                  title={t('floatingPanel.restore')}
                  onClick={() => setMinimised(false)}
                >
                  <Maximize2 aria-hidden />
                </button>
              </span>
            </div>
          </HudPlaque>
        </div>
      </SkinScope>
    );
  }

  return (
    <PlannerBoundaryContext.Provider value={shellRef}>
    <SkinScope>
      <style>{`${reducedMotion ? '' : MOTION_CSS}${EXTRACTION_VISIBILITY_CSS}`}</style>
      {/* ── CENTER STAGE · the planner unit (draggable; the shared drag
           grammar persists only the user's anchor offset) ────────────── */}
      <div ref={shellRef} data-hud-panel={panelId} style={shell}>
        <HudPlaque
          shape="panel"
          as="section"
          aria-label={title}
          data-testid={`floating-panel-${panelId}`}
          style={plaqueStyle}
        >
          <div
            data-testid="quest-expedition-detail"
            data-poi-id={poi.id}
            data-regime={compact ? 'compact' : 'rest'}
            data-layout-fallback={bodyOverflows ? 'body-scroll' : undefined}
            style={{ display: 'flex', flexDirection: 'column', gap: 10, flex: '1 1 auto', minHeight: 0 }}
          >
            {/* POI-D (Director 2026-10-22): the image carries NO text. Title above it,
             *  dispatch line below it; the three seals live in the right preview wing. */}
            <h2
              data-testid="quest-planner-title"
              style={{ margin: 0, flexShrink: 0, fontFamily: FONT.display, fontSize: 17, lineHeight: 1.15, letterSpacing: '0.06em', color: 'var(--skin-title-color)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
            >
              {title}
            </h2>
            {/* HERO — the letterbox: art behind a scrim, title + dispatch
             *  on the lower edge, the three engraved seals, and the window
             *  controls. It is also the drag handle. */}
            <section
              {...handleProps}
              data-testid="quest-planner-hero"
              aria-label={title}
              style={{
                ...handleProps.style,
                position: 'relative',
                flexShrink: 0,
                height: heroPx,
                borderRadius: 8,
                overflow: 'hidden',
                border: '1px solid color-mix(in srgb, var(--skin-surface-border) 60%, transparent)',
                transition: reducedMotion ? 'none' : 'opacity 160ms ease',
              }}
            >
              {heroArt ? (
                <img
                  src={heroArt}
                  alt=""
                  aria-hidden
                  style={{
                    position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', display: 'block',
                    animation: reducedMotion ? undefined : 'qed-hero-scale 900ms ease-out both',
                  }}
                />
              ) : (
                <div
                  data-testid="quest-planner-hero-crest"
                  style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--skin-hud-lacquer-deep)' }}
                >
                  <EngravedIcon id="ico-banner" size={48} aria-hidden style={{ color: 'color-mix(in srgb, var(--skin-title-color) 30%, transparent)' }} />
                </div>
              )}
              {/* letterbox scrim — cinematic lower band, internal layer only */}
              <div
                aria-hidden
                style={{
                  position: 'absolute', inset: 0,
                  background: 'linear-gradient(180deg, color-mix(in srgb, var(--skin-hud-lacquer-deep) 55%, transparent) 0%, transparent 34%, transparent 55%, color-mix(in srgb, var(--skin-hud-lacquer-deep) 92%, transparent) 100%)',
                }}
              />
              {/* controls — top right, never a drag source */}
              <div data-hud-controls="" style={{ position: 'absolute', top: 6, right: 6, display: 'flex', gap: 4 }}>
                <button
                  type="button"
                  data-testid={`floating-panel-minimize-${panelId}`}
                  aria-label={t('floatingPanel.minimize')}
                  title={t('floatingPanel.minimize')}
                  onClick={() => setMinimised(true)}
                >
                  <Minus aria-hidden />
                </button>
                <button
                  type="button"
                  data-testid={`floating-panel-close-${panelId}`}
                  aria-label={t('floatingPanel.close')}
                  title={t('floatingPanel.close')}
                  onClick={onClose}
                >
                  <X aria-hidden />
                </button>
              </div>
            </section>
            {dispatchLine && heroPx > LAYOUT.heroCompactPx && (
              <p
                data-testid="quest-planner-dispatch"
                style={{ margin: 0, flexShrink: 0, fontFamily: FONT.serif, fontSize: 13, lineHeight: 1.3, color: TONE.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
              >
                {dispatchLine}
              </p>
            )}
            {/* POI-D: the quest's primary then secondary key stats under the dispatch line —
             *  icons only (the shared stat glyphs), the name is the accessible label, never text. */}
            {!compact && keyTiers.primary.length > 0 && (
              <div data-testid="quest-planner-key-stats" style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                {(
                  [
                    { tier: 'primary', stats: keyTiers.primary, size: 16 },
                    { tier: 'secondary', stats: keyTiers.secondary, size: 13 },
                  ] as const
                ).map((group, gi) =>
                  group.stats.length === 0 ? null : (
                    <React.Fragment key={group.tier}>
                      {gi > 0 && <span aria-hidden style={{ width: 1, height: 16, background: 'color-mix(in srgb, var(--skin-surface-border) 60%, transparent)' }} />}
                      <span data-testid={`quest-planner-key-stats-${group.tier}`} style={{ display: 'inline-flex', gap: 5 }}>
                        {group.stats.map((st) => {
                          const covered = keyStatCovered(st);
                          const Icon = getStatIconComponent(STAT_ICONS[st]) ?? lucideStatIcons.star;
                          const name = t(`questExpedition.statName.${st}`);
                          return (
                            <span
                              key={st}
                              role="img"
                              aria-label={`${t(`questExpedition.keyStats.${group.tier}`)}: ${name}`}
                              title={name}
                              data-covered={covered ? 'true' : 'false'}
                              style={{
                                display: 'inline-grid', placeItems: 'center', width: group.size + 12, height: group.size + 12, borderRadius: 999,
                                border: `1px solid color-mix(in srgb, ${covered ? TONE.ok : 'var(--skin-surface-border)'} ${group.tier === 'primary' ? 75 : 45}%, transparent)`,
                                color: covered ? TONE.ok : group.tier === 'primary' ? TONE.text : TONE.secondary,
                              }}
                            >
                              {Icon && <Icon style={{ width: group.size, height: group.size }} aria-hidden />}
                            </span>
                          );
                        })}
                      </span>
                    </React.Fragment>
                  ),
                )}
              </div>
            )}

            {/* BODY — rack + loadout + tray in ONE scroll region (compact /
             *  terminal fallback only; ≥720px renders fully inside). */}
            <div
              ref={bodyRef}
              data-testid="quest-planner-body"
              className="quest-s1-scroll"
              style={{ flex: '1 1 auto', minHeight: 0, overflowY: 'auto', scrollbarGutter: 'stable', display: 'flex', flexDirection: 'column', gap: 10 }}
            >
              {/* MARCHING ORDER — TESTA→CODA rack (64px castones) with the
               *  damage-exposure percentage under each occupied slot. When the CTA is
               *  gated by a missing required member this zone carries the
               *  contract's subtle pulse (killed under reduced motion). */}
              <section
                data-testid="quest-planner-rack"
                className={!requiredFilled && !reducedMotion ? 'animate-pulse' : undefined}
                style={{ flexShrink: 0 }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <span style={SECTION_LABEL}>{t('questExpedition.marching.title')}</span>
                  <span
                    data-testid="exposure-legend"
                    style={{ minWidth: 0, fontFamily: FONT.serif, fontSize: 'var(--skin-hud-caps-size)', color: TONE.secondary }}
                  >
                    {t('questExpedition.marching.exposureLegend')}
                  </span>
                </div>
                <ResidentSlotRack
                  slots={slots}
                  layout="detail"
                  onSlotClear={onSlotClear}
                  suppressedResidentIds={suppressedResidentIds}
                  onSlotClick={handleSlotPick}
                  onSlotHover={setHoveredSlotId}
                  highlightedSlotId={hoveredSlotId}
                  slotSize={64}
                  slotMaterial="hud-gold"
                  slotVariant="hud64"
                  bezelPreset="b"
                  onSlotPhaseChange={onSlotPhaseChange}
                  enableSlotSwap
                  renderSlotFooter={renderSlotFooter}
                />
              </section>

              {/* LOADOUT — bag slots + coverage marks + Village Stash action.
               *  PLAN-073: the header is an explicit grid, not a wrapping flex
               *  row — warehouse icon-button / label / actions on row 1,
               *  coverage on row 2 — so the controls can never overlap the
               *  count label under locale expansion (PLAN-068 overlap at
               *  1280/1440). R-246 bis: «open warehouse» is icon-only. */}
              <section data-testid="quest-expedition-loadout" style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div
                  data-hud-controls=""
                  style={{ display: 'grid', gridTemplateColumns: 'auto minmax(0, 1fr) auto', alignItems: 'center', columnGap: 8, rowGap: 4 }}
                >
                  {/* R-246 bis: warehouse trigger is an icon-only square pill
                   *  (svg:only-child → 26px, T-20-safe) left of the BAG label —
                   *  no text, aria-label/title carry the accessible name. */}
                  <button
                    type="button"
                    data-testid="quest-open-stash"
                    aria-label={t('gameFrame.village.openStash')}
                    title={t('gameFrame.village.openStash')}
                    onClick={(event) => onOpenStash(event.currentTarget)}
                  >
                    <EngravedIcon id="ico-chest" size={13} aria-hidden />
                  </button>
                  <span data-testid="quest-expedition-bag-count" style={{ ...SECTION_LABEL, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {t('questExpedition.loadout', { count: selectedItemIds.length, max: QUEST_STASH.bagSlots })}
                  </span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, flexShrink: 0, whiteSpace: 'nowrap' }}>
                    {onReleaseAllItems && selectedItemIds.length > 0 && (
                      <button
                        type="button"
                        data-testid="quest-bag-release-all"
                        aria-label={t('questExpedition.bag.releaseAll')}
                        title={t('questExpedition.bag.releaseAll')}
                        onClick={onReleaseAllItems}
                        style={{ ...SECTION_LABEL, border: '1px solid color-mix(in srgb, var(--skin-surface-border) 45%, transparent)', borderRadius: 4, padding: '1px 8px', cursor: 'pointer', background: 'none', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                      >
                        {/* PLAN-073/R-240: icon+label wrapped in a span — a bare svg
                         *  counts as `:only-child` (text nodes don't), and the
                         *  hud-controls CSS would pin the button to a 26px square
                         *  with the label overflowing onto the sibling pill. */}
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          <EngravedIcon id="cmd-close" size={12} aria-hidden />
                          {t('questExpedition.bag.releaseAll')}
                        </span>
                      </button>
                    )}
                  </span>
                  {!compact && (scenario?.primaryStats?.length ?? 0) > 0 && (
                    <span data-testid="loadout-coverage" style={{ gridColumn: '1 / -1', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ ...SECTION_LABEL, fontSize: 10 }}>{t('questExpedition.coverage')}</span>
                      {scenario!.primaryStats!.map((s) => {
                        const covered = bagCoveredStats.includes(s);
                        const Icon = getStatIconComponent(STAT_ICONS[s]) ?? lucideStatIcons.star;
                        return (
                          <span
                            key={s}
                            title={STAT_SHORT[s]}
                            style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontFamily: FONT.display, fontSize: 12, color: covered ? TONE.ok : TONE.secondary }}
                          >
                            {Icon && <Icon style={{ width: 12, height: 12 }} aria-hidden />}
                            {STAT_SHORT[s] ?? s} {covered ? '✓' : '—'}
                          </span>
                        );
                      })}
                    </span>
                  )}
                </div>
                <div data-hud-controls="" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  {Array.from({ length: QUEST_STASH.bagSlots }, (_, i) => {
                    const id = selectedItemIds[i];
                    const entry = id ? items.find((e) => e.item.id === id) : undefined;
                    return (
                      <QuestBagSlot
                        key={i}
                        poiId={poi.id}
                        slotIndex={i}
                        entry={entry}
                        onRelease={onToggleItem}
                        onOpenItems={(trigger) => openTray('items', trigger)}
                      />
                    );
                  })}
                </div>
                <span aria-live="polite" style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)', whiteSpace: 'nowrap' }}>
                  {bagAnnouncement}
                </span>
              </section>

              {/* SELECTION TRAY — on-demand ~88px strip, residents|items. */}
              {trayOpen && (
                <section
                  ref={trayRef}
                  data-testid="quest-selection-tray"
                  data-tray-mode={trayMode}
                  role="region"
                  aria-label={t('questExpedition.tray.title')}
                  style={{ flexShrink: 0, height: LAYOUT.trayPx, display: 'flex', flexDirection: 'column', gap: 4, border: '1px solid color-mix(in srgb, var(--skin-surface-border) 45%, transparent)', borderRadius: 8, padding: 6 }}
                >
                  <div role="tablist" aria-label={t('questExpedition.tray.title')} style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                    {(['residents', 'items'] as const).map((mode) => (
                      <button
                        key={mode}
                        type="button"
                        role="tab"
                        data-testid={`quest-tray-mode-${mode}`}
                        aria-selected={trayMode === mode}
                        onClick={(e) => { trayReturnRef.current = e.currentTarget; setTrayMode(mode); }}
                        style={{
                          ...SECTION_LABEL, fontSize: 10, cursor: 'pointer',
                          border: '1px solid color-mix(in srgb, var(--skin-surface-border) 45%, transparent)',
                          borderRadius: 4, padding: '1px 8px',
                          background: trayMode === mode ? 'color-mix(in srgb, var(--skin-title-color) 14%, transparent)' : 'none',
                          color: trayMode === mode ? 'var(--skin-title-color)' : TONE.secondary,
                        }}
                      >
                        {t(`questExpedition.tray.mode${mode === 'items' ? 'Items' : 'Residents'}`)}
                      </button>
                    ))}
                    <span style={{ flex: 1 }} />
                    <button
                      type="button"
                      data-testid="quest-tray-close"
                      aria-label={t('questExpedition.tray.close')}
                      title={t('questExpedition.tray.close')}
                      onClick={closeTray}
                      style={{ background: 'none', border: 'none', color: TONE.secondary, cursor: 'pointer', display: 'inline-flex', padding: 2 }}
                    >
                      <X aria-hidden style={{ width: 12, height: 12 }} />
                    </button>
                  </div>
                  {trayMode === 'items' ? (
                    <div style={{ display: 'flex', gap: 6, overflowX: 'auto', flex: '1 1 auto', minHeight: 0, alignItems: 'center' }}>
                      {items.map((entry) => {
                        const { item, qty } = entry;
                        const selected = selectedItemIds.includes(item.id);
                        const full = !selected && selectedItemIds.length >= QUEST_STASH.bagSlots;
                        return (
                          <Tooltip.Root key={item.id} delayDuration={120}>
                            <Tooltip.Trigger asChild>
                              <button
                                type="button"
                                data-testid={`picker-item-${item.id}`}
                                aria-pressed={selected}
                                aria-label={t(stripNs(item.labelKey))}
                                disabled={full}
                                onClick={() => onToggleItem(item.id)}
                                style={{
                                  position: 'relative', width: 44, height: 44, borderRadius: 8, padding: 0, flexShrink: 0,
                                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                  border: `1px solid color-mix(in srgb, ${selected ? TONE.accent : 'var(--skin-surface-border)'} ${selected ? 85 : 50}%, transparent)`,
                                  background: selected ? `color-mix(in srgb, ${TONE.accent} 22%, transparent)` : 'color-mix(in srgb, var(--skin-hud-lacquer-deep) 55%, transparent)',
                                  color: selected ? TONE.accent : 'var(--skin-title-color)',
                                  opacity: full ? 0.65 : 1,
                                  cursor: full ? 'default' : 'pointer',
                                }}
                              >
                                <VillageStashItemIcon icon={item.icon} size={22} />
                                <span aria-hidden style={{ position: 'absolute', right: 1, bottom: 0, fontFamily: FONT.display, fontSize: 12, lineHeight: 1, color: TONE.secondary }}>
                                  ×{qty}
                                </span>
                              </button>
                            </Tooltip.Trigger>
                            <BagItemTooltip entry={entry} />
                          </Tooltip.Root>
                        );
                      })}
                    </div>
                  ) : (
                    <div style={{ display: 'flex', gap: 8, overflowX: 'auto', flex: '1 1 auto', minHeight: 0, alignItems: 'center' }}>
                      {trayResidents.length === 0 ? (
                        <span style={{ fontFamily: FONT.serif, fontSize: 12, color: TONE.secondary }}>{t('questExpedition.tray.empty')}</span>
                      ) : (
                        trayResidents.map((r) => <TrayResidentTile key={r.id} resident={r} />)
                      )}
                      <span style={{ flexShrink: 0, alignSelf: 'center', fontFamily: FONT.serif, fontSize: 11, color: TONE.secondary, whiteSpace: 'nowrap' }}>
                        {t('questExpedition.tray.dragHint')}
                      </span>
                    </div>
                  )}
                </section>
              )}
            </div>

            {/* FOOTER — anchored: reason line + Back to map + Send expedition. */}
            <footer
              data-testid="quest-planner-footer"
              style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 6, borderTop: '1px solid color-mix(in srgb, var(--skin-text-secondary) 25%, transparent)', paddingTop: 8 }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <SkinButton
                  variant="cta"
                  data-testid="quest-expedition-send"
                  disabled={!canSend}
                  aria-disabled={!canSend}
                  aria-describedby={!canSend ? 'quest-planner-reason-line' : undefined}
                  onClick={onSend}
                  style={{ flex: 1, opacity: canSend ? 1 : 0.65 }}
                >
                  {t('questExpedition.send')}
                </SkinButton>
                <SkinButton
                  variant="secondary"
                  data-testid="quest-expedition-back"
                  onClick={onClose}
                >
                  {t('questExpedition.backToMap')}
                </SkinButton>
              </div>
              {!canSend && (
                <span
                  id="quest-planner-reason-line"
                  data-testid="quest-planner-reason"
                  style={{ fontFamily: FONT.serif, fontSize: 12, color: TONE.secondary }}
                >
                  {t('questExpedition.forecast.incomplete')}
                </span>
              )}
            </footer>
          </div>
        </HudPlaque>
      </div>

      {/* ── RIGHT WING · the pinned forecast — it never yields while the
           party is being edited (live ±% deltas preserved, v23) ─────── */}
      <HudPlaque
        shape="panel"
        as="aside"
        aria-label={t('questExpedition.forecast.title')}
        aria-live="polite"
        data-testid="quest-expedition-forecast-column"
        style={wingStyle}
      >
        {/* Pinned head — title + aggregate + BY MEMBER (adjacent, TESTA→CODA). */}
        <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {/* engraved seals — Danger / Reward / Duration (read-only), now in the preview wing */}
            <div
              data-testid="quest-planner-seals"
              style={{ display: 'flex', flexWrap: 'wrap', gap: 6, animation: reducedMotion ? undefined : 'qed-seal-in 300ms ease-out 180ms both' }}
            >
              {dangerBand && (
                <EngravedSeal
                  testId="quest-expedition-band"
                  label={t('questExpedition.seals.danger')}
                  value={t(stripNs(dangerBand.i18nKey))}
                  icon="ico-target"
                  tone="danger"
                />
              )}
              {rewardTier && resolved && (
                <EngravedSeal
                  testId="quest-expedition-reward"
                  label={t('questExpedition.seals.reward')}
                  value={`${t(stripNs(rewardTier.i18nKey))} · ${resolved.resolvedOffer.rewardResolved}`}
                  icon="ico-chest"
                  tone="ok"
                />
              )}
              <EngravedSeal
                testId="quest-expedition-duration"
                label={t('questExpedition.seals.duration')}
                value={formatExpeditionSpan(durationDays, t)}
                hint={durationHint ? `${t('questExpedition.seals.duration')}: ${formatExpeditionSpan(durationDays, t)} — ${durationHint}` : undefined}
                delta={durationDelta !== 0 ? `${durationDelta > 0 ? '+' : ''}${durationDelta}d` : null}
                icon="ico-gust"
                tone={expeditionDuration.factor < 1 ? 'ok' : expeditionDuration.factor > 1 ? 'warn' : undefined}
              />
            </div>
          <span style={SECTION_LABEL}>{t('questExpedition.forecast.title')}</span>
          <div
            data-testid="quest-expedition-forecast"
            data-forecast-state={estimate === 'computing' ? 'computing' : estimate === 'incomplete' ? 'incomplete' : 'ready'}
            data-forecast-stale={estimateStale || undefined}
            aria-busy={estimateStale || undefined}
            style={{ display: 'flex', flexDirection: 'column', gap: 8 }}
          >
            {/* Fixed-height state seat — the line comes and goes but its
             *  slot never does, so the wing's footprint is identical in
             *  ready/computing/incomplete (R-248: no collapse on edit). */}
            <div style={{ height: 18, overflow: 'hidden' }}>
              <span style={{ fontFamily: FONT.serif, fontSize: 13, lineHeight: '18px', color: TONE.secondary }}>
                {resolvePending
                  ? t('questExpedition.forecast.resolving')
                  : estimate === 'computing'
                    ? t('questExpedition.forecast.computing')
                    : estimate === 'incomplete'
                      ? t('questExpedition.forecast.incomplete')
                      : null}
              </span>
            </div>
            {shownEstimate && (
              <>
                {/* Aggregate — headline chips; the mark after each is the
                 *  signed pp shift vs the previous party configuration. */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  <span data-testid="forecast-reward-pct">
                    <HudChip tone="ok">
                      {t('questExpedition.forecast.reward', { pct: shownEstimate.sim.outcomePct.reward.toFixed(0) })}
                      {forecastDelta && deltaMark(forecastDelta.rewardPp, false)}
                    </HudChip>
                  </span>
                  <span data-testid="forecast-wound-pct">
                    <HudChip tone="warn">
                      {t('questExpedition.forecast.wound', { pct: shownEstimate.sim.anyWoundPct.toFixed(0) })}
                      {forecastDelta && deltaMark(forecastDelta.woundPp, true)}
                    </HudChip>
                  </span>
                  <span data-testid="forecast-death-pct">
                    <HudChip tone="danger">
                      {t('questExpedition.forecast.death', { pct: shownEstimate.sim.anyDeathPct.toFixed(0) })}
                      {forecastDelta && deltaMark(forecastDelta.deathPp, true)}
                    </HudChip>
                  </span>
                  <span data-testid="forecast-wipe-pct">
                    <HudChip tone="danger">
                      {t('questExpedition.forecast.wipe', { pct: shownEstimate.sim.outcomePct.wipe.toFixed(0) })}
                      {forecastDelta && deltaMark(forecastDelta.wipePp, true)}
                    </HudChip>
                  </span>
                </div>

                {/* BY MEMBER — adjacent to the aggregate, TESTA→CODA order;
                 *  hovering a row lights its castone (and vice versa). */}
                <div data-testid="forecast-members" style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  <span style={SECTION_LABEL}>{t('questExpedition.members.title')}</span>
                  {shownEstimate.sim.perMember.map((m) => {
                    const slotId = slotIdForMember(m.id);
                    const lit = hoveredMemberId === m.id;
                    return (
                      <div
                        key={m.id}
                        data-testid={`forecast-member-${m.id}`}
                        data-slot-id={slotId ?? undefined}
                        data-highlighted={lit ? 'true' : undefined}
                        onMouseEnter={() => slotId && setHoveredSlotId(slotId)}
                        onMouseLeave={() => setHoveredSlotId(null)}
                        onFocus={() => slotId && setHoveredSlotId(slotId)}
                        onBlur={() => setHoveredSlotId(null)}
                        tabIndex={0}
                        style={{
                          display: 'flex', alignItems: 'baseline', gap: 8, fontFamily: FONT.serif, fontSize: 12,
                          padding: '1px 4px', borderRadius: 4,
                          background: lit ? 'color-mix(in srgb, var(--skin-title-color) 12%, transparent)' : 'transparent',
                        }}
                      >
                        <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: TONE.text }}>
                          {m.name}
                          <span style={{ color: TONE.secondary }}> · {t(`questExpedition.members.role.${m.role}`)}</span>
                        </span>
                        <span style={{ color: TONE.secondary, whiteSpace: 'nowrap' }}>
                          {t('questExpedition.members.row', { wound: m.woundPct.toFixed(0), death: m.deathPct.toFixed(0) })}
                        </span>
                        {m.downtimeDays >= 0.5 && (
                          <span style={{ color: TONE.secondary, whiteSpace: 'nowrap' }}>
                            {t('questExpedition.members.downtime', { days: Math.max(1, Math.round(m.downtimeDays)) })}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </div>

        {/* The ONE scroll region — Needs → Intel (contract order). R-258:
         *  the WHY attribution list is removed entirely — source names AND
         *  MC stats are sim internals, never player-facing (the fields stay
         *  on the sim result, unrendered). Needs and Intel are authored
         *  scenario info and stay visible even when the forecast is
         *  incomplete — the player reads them while composing. */}
        <div
          data-testid="quest-expedition-forecast-scroll"
          className="quest-s1-scroll"
          style={{ flex: '1 1 auto', minHeight: 0, overflowY: 'auto', borderTop: '1px solid color-mix(in srgb, var(--skin-text-secondary) 25%, transparent)', paddingTop: 8, display: 'flex', flexDirection: 'column', gap: 8 }}
        >
          {/* NEEDS — the authored key-stat tiers; a tier reads covered when
           *  the bag or a member meets the configured bar. */}
          {keyTiers.primary.length > 0 && (
            <div data-testid="forecast-key-stats" style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span style={SECTION_LABEL}>{t('questExpedition.keyStats.title')}</span>
              {(
                [
                  { labelKey: 'questExpedition.keyStats.primary', stats: keyTiers.primary, testid: 'forecast-primary-stats' },
                  { labelKey: 'questExpedition.keyStats.secondary', stats: keyTiers.secondary, testid: 'forecast-secondary-stats' },
                ] as const
              ).map((tier) =>
                tier.stats.length === 0 ? null : (
                  <div key={tier.testid} data-testid={tier.testid} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontFamily: FONT.display, fontSize: 12, letterSpacing: '0.08em', textTransform: 'uppercase', color: TONE.secondary, minWidth: 84 }}>
                      {t(tier.labelKey)}
                    </span>
                    <span style={{ display: 'inline-flex', flexWrap: 'wrap', gap: 4 }}>
                      {tier.stats.map((s) => {
                        const covered = keyStatCovered(s);
                        const Icon = getStatIconComponent(STAT_ICONS[s]) ?? lucideStatIcons.star;
                        return (
                          <span
                            key={s}
                            title={t(`questExpedition.statName.${s}`)}
                            style={{
                              display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 999,
                              border: `1px solid color-mix(in srgb, ${covered ? TONE.ok : 'var(--skin-surface-border)'} 65%, transparent)`,
                              fontFamily: FONT.display, fontSize: 12, color: covered ? TONE.ok : TONE.text,
                            }}
                          >
                            {Icon && <Icon style={{ width: 12, height: 12 }} aria-hidden />}
                            {t(`questExpedition.statName.${s}`)} {covered ? '✓' : '—'}
                          </span>
                        );
                      })}
                    </span>
                  </div>
                ),
              )}
            </div>
          )}

          {/* Intel — authored preview hints always; deeper `revealHint`s
           *  unlock via `revealAtPlanning` (D-S3-3). */}
          {intelHints.length > 0 && (
            <div data-testid="forecast-intel" style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <span style={SECTION_LABEL}>{t('questExpedition.intel.title')}</span>
              {intelHints.map((h) => (
                <div key={`${h.nodeId}-${h.revealed ? 'r' : 'p'}`} data-testid="forecast-intel-row" style={{ fontFamily: FONT.serif, fontSize: 12, color: TONE.text, lineHeight: 1.35 }}>
                  {h.revealed && <HudChip tone="ok">{t('questExpedition.intel.scouted')}</HudChip>} {h.hint}
                </div>
              ))}
            </div>
          )}
        </div>
      </HudPlaque>
    </SkinScope>
    </PlannerBoundaryContext.Provider>
  );
};

export default QuestExpeditionDetail;
