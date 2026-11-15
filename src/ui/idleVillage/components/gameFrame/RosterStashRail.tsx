/**
 * RosterStashRail — the docked left Roster|Stash column of /game
 * (R-339 / PLAN-119 T5, mw-debate `20261115-wanderlust-ui-plan`
 * artifact-r004: D1 segmented tabs, D2 persistent-by-default with collapse
 * chip, D8 the column ends above the bottom-left medallion, D9 tokens only).
 *
 * It replaces the floating roster as the "who do I have" surface: persistent
 * at `left: 0`, never an overlay — it publishes its real occupancy into the
 * shared `useGameLayoutInsets` ledger (`left` = rail width expanded, chip
 * width collapsed, 0 when hidden) so the free-map math always subtracts it.
 *
 * Mutual exclusion (D2): below `rail.mutualExclusionBelowPx` only one side
 * surface may be expanded — when the right drawer holds the ledger
 * (`insets.right > 0`) the rail folds itself and restores when the drawer
 * yields (`mutexCollapsed` keeps the user's intent safe). The inverse —
 * user expands the rail while the drawer is open — is the page's job: it
 * closes the drawer detail.
 *
 * Roster rows reuse the signed roster's derivations (`zanaraRosterState`,
 * `heroLevelView`, `getResidentPortraitUrl`); bars come from
 * `rail.bars` in the layout config — which metric, which label, which skin
 * tokens — never hardcoded here. The stash tab is the shared ledger
 * (`useVillageStashStore`): the same `villageStashViewModel` rows the
 * warehouse shelf renders — icon + name + one effect line — and, when a
 * planner binds `activeStashOwner`, the same click→assign contract.
 * Member stat chips sit on top so the bench condition stays visible while
 * packing (artifact-r004 S1).
 */
import React, { useCallback, useEffect, useMemo, useSyncExternalStore, type CSSProperties } from 'react';
import { useTranslation } from 'react-i18next';
import * as Tooltip from '@radix-ui/react-tooltip';
import { useDraggable, useDndMonitor, type DragEndEvent, type DragStartEvent } from '@dnd-kit/core';
import type { ResidentState } from '@/engine/game/idleVillage/TimeEngine';
import { getResidentPortraitUrl } from '@/engine/game/idleVillage/residentVisualResolver';
import { CASSETTO_LAYOUT_CONFIG } from '@/balancing/config/idleVillage/cassettoLayoutConfig';
import { DEFAULT_GAME_FRAME_CONFIG } from '@/balancing/config/idleVillage/gameFrameConfig';
import type { VillageStashConfig } from '@/balancing/config/idleVillage/villageStashConfig';
import { villageStashViewModel, type VillageStashRowView } from './villageStashViewModel';
import { stashItemCovers, StashItemTile, StashItemTooltipBody, STASH_TOOLTIP_STYLE } from './stashItemFace';
import {
  countReservations,
  useVillageStashStore,
} from '@/ui/idleVillage/store/useVillageStashStore';
import { useGameLayoutInsets } from '@/ui/idleVillage/store/useGameLayoutInsets';
import { useExpeditionRail, type ExpeditionRailTab } from '@/ui/idleVillage/store/useExpeditionRail';
import { zanaraRosterState } from '@/ui/idleVillage/zanara/zanaraRosterState';
import { heroLevelView } from '@/ui/idleVillage/rosterV2/heroLevelViewModel';
import { HudPlaque } from '@/ui/idleVillage/skins/primitives/HudPlaque';
import { EngravedIcon } from './engravedIcons';
import { useDragOutcome, elementCenter } from '@/ui/idleVillage/interaction/useDragOutcome';
import { DragOutcomeFlight } from '@/ui/idleVillage/interaction/DragOutcomeFlight';
import { CustomDragOverlay } from '@/ui/idleVillage/components/CustomDragOverlay';
import type { RosterDropVerdict } from '@/ui/idleVillage/frozen/kits/rosterKit';

/** Drag payload tag: only rail-sourced drags feed the rail's outcome machine —
 *  roster-card drags keep flowing through the floating roster's monitor. */
const RAIL_DRAG_SOURCE = 'roster-rail';

const RAIL = CASSETTO_LAYOUT_CONFIG.rail;
const NARROW_MQ = `(max-width: ${RAIL.mutualExclusionBelowPx}px)`;

const subscribeNarrow = (onChange: () => void) => {
  const mq = window.matchMedia(NARROW_MQ);
  mq.addEventListener('change', onChange);
  return () => mq.removeEventListener('change', onChange);
};
const readNarrow = () => window.matchMedia(NARROW_MQ).matches;
/** True while the viewport sits inside the mutual-exclusion band (≤1100px). */
const useNarrowViewport = () => useSyncExternalStore(subscribeNarrow, readNarrow, () => false);

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

type RailBarValue = (typeof RAIL.bars)[number]['value'];

/** The fill fraction a config bar renders for one resident (0..1). */
const railBarValue = (value: RailBarValue, resident: ResidentState): number =>
  value === 'hp'
    ? resident.maxHp > 0
      ? clamp01(resident.currentHp / resident.maxHp)
      : 0
    : clamp01(1 - resident.fatigue / 100);

/** The compact numeric label a config bar shows next to the fill. */
const railBarText = (value: RailBarValue, resident: ResidentState): string =>
  value === 'hp'
    ? `${resident.currentHp}/${resident.maxHp}`
    : String(Math.round(100 - Math.min(100, Math.max(0, resident.fatigue))));

/** One config-driven micro-bar, skin-token gradient + engraved track. */
const RailBar: React.FC<{ bar: (typeof RAIL.bars)[number]; resident: ResidentState; micro?: boolean }> = ({ bar, resident, micro }) => {
  const { t } = useTranslation('idleVillage');
  const pct = Math.round(railBarValue(bar.value, resident) * 100);
  return (
    <span
      role="img"
      aria-label={`${t(bar.labelKey)} ${pct}%`}
      style={{ display: 'flex', alignItems: 'center', gap: 4, minWidth: 0 }}
    >
      <span
        style={{
          flex: 1,
          height: micro ? 4 : 6,
          borderRadius: 3,
          background: 'var(--skin-inset-bg)',
          boxShadow: 'inset 0 1px 2px rgba(0,0,0,.5)',
          overflow: 'hidden',
        }}
      >
        <span
          style={{
            display: 'block',
            width: `${pct}%`,
            height: '100%',
            borderRadius: 3,
            background: `linear-gradient(90deg, ${bar.fill[0]}, ${bar.fill[1]})`,
          }}
        />
      </span>
      {!micro && (
        <span
          style={{
            font: '600 9px var(--skin-font-display)',
            color: 'var(--skin-text-secondary)',
            fontVariantNumeric: 'tabular-nums',
            flexShrink: 0,
          }}
        >
          {railBarText(bar.value, resident)}
        </span>
      )}
    </span>
  );
};

/** Circular portrait medallion — the mockup's member roundel, token-framed. */
const RailPortrait: React.FC<{ resident: ResidentState; size: number; portrait: 'normal' | 'veiled' | 'fallen' }> = ({ resident, size, portrait }) => (
  <img
    src={getResidentPortraitUrl(resident)}
    alt=""
    aria-hidden
    style={{
      width: size,
      height: size,
      borderRadius: '50%',
      objectFit: 'cover',
      flexShrink: 0,
      border: '1px solid var(--skin-frame-brass)',
      boxShadow: '0 0 0 1px rgba(0,0,0,.55), var(--skin-hud-engrave)',
      filter: portrait === 'normal' ? undefined : 'grayscale(.7) brightness(.65)',
    }}
  />
);

/** One roster row: portrait, name + level badge + state, config bars. */
const RosterRow: React.FC<{
  resident: ResidentState;
  locked: boolean;
  lockedLabel?: string;
  selected: boolean;
  onSelect?: (id: string) => void;
  /** Kill-switch while the floating roster panel owns the drag surface. */
  dragDisabled?: boolean;
}> = ({ resident, locked, lockedLabel, selected, onSelect, dragDisabled }) => {
  const { t } = useTranslation('idleVillage');
  const view = zanaraRosterState(resident, locked);
  const { level } = heroLevelView(resident);
  const name = resident.displayName ?? resident.id;
  /* Same payload as the production roster card (`WanderlustRosterCardV2`)
   * plus the rail source tag — the session chain reads `active.id` as the
   * resident id and `data.type` to tell roster drags from slot tokens. */
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: resident.id,
    disabled: !view.interactive || dragDisabled === true,
    data: {
      workerId: resident.id,
      label: name,
      portraitUrl: resident.portraitUrl ?? getResidentPortraitUrl(resident),
      type: 'resident',
      source: RAIL_DRAG_SOURCE,
      resident: { stats: { hp: resident.statSnapshot?.hp ?? 0 }, fatigue: resident.fatigue },
    },
  });
  /* Cursor offset + portrait center for the overlay spring-back — same
   * contract the production card writes on pointerdown. Chained AFTER the
   * dnd-kit listener (its own pointerdown activates the sensor). */
  const handlePointerDown = useCallback(
    (event: React.PointerEvent<HTMLElement>) => {
      listeners?.onPointerDown?.(event);
      const rect = event.currentTarget.getBoundingClientRect();
      (window as unknown as Record<string, unknown>).__dragCursorOffset = {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
        width: rect.width,
        height: rect.height,
      };
      const portraitImg = event.currentTarget.querySelector('img');
      const target = portraitImg?.getBoundingClientRect() ?? rect;
      (window as unknown as Record<string, unknown>).__dragHomeCenter = {
        x: target.left + target.width / 2,
        y: target.top + target.height / 2,
      };
    },
    [listeners],
  );
  const stateLabel =
    view.state === 'locked'
      ? (lockedLabel ?? t('roster.status.locked'))
      : view.labelKey !== null
        ? t(view.labelKey)
        : null;
  const body = (
    <>
      <RailPortrait resident={resident} size={36} portrait={view.portrait} />
      <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 3 }}>
        <span style={{ display: 'flex', alignItems: 'baseline', gap: 6, minWidth: 0 }}>
          <span
            style={{
              minWidth: 0,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              font: 'var(--skin-hud-name-weight) 12px var(--skin-font-display)',
              color: 'var(--skin-title-color)',
              textShadow: 'var(--skin-hud-engrave)',
            }}
          >
            {name}
          </span>
          {level !== null && (
            <span
              style={{
                font: '700 9px var(--skin-font-display)',
                color: 'var(--skin-accent-color, var(--skin-frame-brass))',
                flexShrink: 0,
              }}
            >
              {t('gameFrame.heroLevel.badge', { n: level })}
            </span>
          )}
          {stateLabel && (
            <span
              style={{
                marginLeft: 'auto',
                font: '600 9px var(--skin-font-display)',
                color: 'var(--skin-text-secondary)',
                textTransform: 'uppercase',
                letterSpacing: '.06em',
                flexShrink: 0,
              }}
            >
              {stateLabel}
            </span>
          )}
        </span>
        {RAIL.bars.map((bar) => (
          <RailBar key={bar.id} bar={bar} resident={resident} />
        ))}
      </span>
    </>
  );
  const chrome: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--skin-hud-inline-gap)',
    minWidth: 0,
    width: '100%',
    padding: '7px 8px',
    borderRadius: 8,
    border: `1px solid ${selected ? 'var(--skin-frame-brass)' : 'color-mix(in srgb, var(--skin-surface-border) 35%, transparent)'}`,
    background: selected ? 'var(--skin-raised-bg)' : 'var(--skin-inset-bg)',
    color: 'inherit',
    textAlign: 'left',
    cursor: view.interactive ? 'grab' : 'default',
    /* Grabbed row fades like the production card while the overlay ghosts it. */
    opacity: isDragging ? 0.4 : view.interactive ? 1 : 0.72,
    pointerEvents: isDragging ? 'none' : undefined,
    touchAction: 'none',
  };
  return (
    <div role="listitem" data-testid={`rail-roster-row-${resident.id}`}>
      {view.interactive ? (
        <button
          type="button"
          ref={setNodeRef}
          {...attributes}
          style={chrome}
          onPointerDown={handlePointerDown}
          onClick={() => onSelect?.(resident.id)}
        >
          {body}
        </button>
      ) : (
        <div style={chrome}>{body}</div>
      )}
    </div>
  );
};

/** Compact member chip for the stash tab — portrait + name + micro bars. */
const MemberChip: React.FC<{ resident: ResidentState; locked: boolean }> = ({ resident, locked }) => {
  const view = zanaraRosterState(resident, locked);
  return (
    <span
      data-testid={`rail-member-chip-${resident.id}`}
      title={resident.displayName ?? resident.id}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        minWidth: 0,
        maxWidth: 140,
        padding: '3px 6px 3px 3px',
        borderRadius: 999,
        border: '1px solid color-mix(in srgb, var(--skin-surface-border) 40%, transparent)',
        background: 'var(--skin-inset-bg)',
        opacity: view.interactive ? 1 : 0.6,
      }}
    >
      <RailPortrait resident={resident} size={18} portrait={view.portrait} />
      <span
        style={{
          minWidth: 0,
          flex: '0 1 auto',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          font: '600 10px var(--skin-font-display)',
          color: 'var(--skin-text-primary)',
        }}
      >
        {resident.displayName ?? resident.id}
      </span>
      <span style={{ width: 34, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
        {RAIL.bars.map((bar) => (
          <RailBar key={bar.id} bar={bar} resident={resident} micro />
        ))}
      </span>
    </span>
  );
};

/**
 * The rail's stash row: tile + name + a single effect line (artifact-r004
 * S1), the full effect text reachable through the shared stash tooltip.
 * Planner-bound → a real button running the ledger's assign contract;
 * otherwise a read-only listitem.
 */
const RailStashRow: React.FC<{ row: VillageStashRowView; interactive: boolean }> = ({ row, interactive }) => {
  const { t } = useTranslation('idleVillage');
  const owner = useVillageStashStore((s) => s.activeStashOwner);
  const assign = useVillageStashStore((s) => s.assign);
  const face = (
    <>
      <StashItemTile icon={row.icon} qty={row.qty} size={30} iconSize={17} />
      <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 1, textAlign: 'left' }}>
        <span style={{ font: '600 11px var(--skin-font-serif)', color: 'var(--skin-text-primary)' }}>
          {t(row.nameKey)}
        </span>
        <span
          style={{
            font: '11px var(--skin-font-serif)',
            color: 'var(--skin-text-secondary)',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {t(row.descKey)}
        </span>
      </span>
    </>
  );
  return (
    <div role="listitem">
      <Tooltip.Root delayDuration={120}>
        <Tooltip.Trigger asChild>
          {interactive ? (
            <button
              type="button"
              data-testid={`rail-stash-item-${row.itemId}`}
              aria-label={t('gameFrame.stash.addToBag', { item: t(row.nameKey) })}
              onClick={() => {
                if (!owner) return;
                if (assign(owner, row.itemId) === 'ok') {
                  window.requestAnimationFrame(() =>
                    document.querySelector<HTMLElement>(`[data-testid="loadout-item-${row.itemId}"]`)?.focus(),
                  );
                }
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--skin-hud-inline-gap)',
                width: '100%',
                minWidth: 0,
                padding: '4px 6px',
                margin: '-4px -6px',
                border: '1px solid color-mix(in srgb, var(--skin-surface-border) 35%, transparent)',
                borderRadius: 6,
                background: 'none',
                color: 'inherit',
                cursor: 'pointer',
              }}
            >
              {face}
            </button>
          ) : (
            <div
              data-testid={`rail-stash-item-${row.itemId}`}
              style={{ display: 'flex', alignItems: 'center', gap: 'var(--skin-hud-inline-gap)', minWidth: 0, padding: '2px 0' }}
            >
              {face}
            </div>
          )}
        </Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Content side="right" sideOffset={6} collisionPadding={8} style={STASH_TOOLTIP_STYLE}>
            <StashItemTooltipBody labelKey={row.nameKey} descKey={row.descKey} covers={stashItemCovers(row.itemId)} stockQty={row.qty} />
          </Tooltip.Content>
        </Tooltip.Portal>
      </Tooltip.Root>
    </div>
  );
};

export interface RosterStashRailProps {
  /** Canonical resident list (owner: roster provider on /game). */
  residents: ResidentState[];
  /** Stash ledger config (the page's `VILLAGE_STASH_CONFIG`). */
  stashConfig: VillageStashConfig;
  /** Host visibility — the page mounts the rail on map view only. */
  visible?: boolean;
  /** Residents the roster marks locked (phase/quest gating). */
  lockedResidentIds?: readonly string[];
  /** Localized label for the locked state (page resolves the reason). */
  lockedStatusLabel?: string;
  /** Member the page highlights (party seat being filled, etc.). */
  selectedResidentId?: string | null;
  /** Member pick — same routing as the floating roster's `onResidentSelect`. */
  onResidentSelect?: (id: string) => void;
  /** Roster-row drag→slot verdict — same session chain the floating roster's
   *  `onDragEnd` routes (rejected / flightToSlot / void). */
  onDragEnd?: (event: DragEndEvent) => RosterDropVerdict;
  /** Commit when a `flightToSlot` lands — same routing as the roster's. */
  onFlightComplete?: (residentId: string, slotId?: string) => void;
  /** Kill-switch while the floating roster panel owns the drag surface:
   *  one drag source at a time, no double monitor processing. */
  dragEnabled?: boolean;
}

export const RosterStashRail: React.FC<RosterStashRailProps> = ({
  residents,
  stashConfig,
  visible = true,
  lockedResidentIds,
  lockedStatusLabel,
  selectedResidentId,
  onResidentSelect,
  onDragEnd,
  onFlightComplete,
  dragEnabled = true,
}) => {
  const { t } = useTranslation('idleVillage');
  const expanded = useExpeditionRail((s) => s.expanded);
  const tab = useExpeditionRail((s) => s.tab);
  const setTab = useExpeditionRail((s) => s.setTab);
  const setExpanded = useExpeditionRail((s) => s.setExpanded);
  const applyDrawerMutex = useExpeditionRail((s) => s.applyDrawerMutex);
  const rightInset = useGameLayoutInsets((s) => s.insets.right);
  const publish = useGameLayoutInsets((s) => s.publish);
  const narrow = useNarrowViewport();

  /* D2: inside the narrow band the open drawer folds the rail; the fold is
   *  marked mutex-owned so the rail restores when the drawer yields. */
  useEffect(() => {
    applyDrawerMutex(narrow && rightInset > 0);
  }, [narrow, rightInset, applyDrawerMutex]);

  /* Honest occupancy: the ledger always sees the width the map loses —
   *  rail width expanded, chip width collapsed, 0 hidden/unmounted. */
  const occupiedPx = visible ? (expanded ? RAIL.widthPx : RAIL.chipWidthPx) : 0;
  useEffect(() => {
    publish({ left: occupiedPx });
    return () => publish({ left: 0 });
  }, [occupiedPx, publish]);

  const bags = useVillageStashStore((s) => s.bags);
  const committed = useVillageStashStore((s) => s.committed);
  const hydration = useVillageStashStore((s) => s.hydration);
  const activeStashOwner = useVillageStashStore((s) => s.activeStashOwner);
  const reserved = useMemo(() => countReservations(bags, committed), [bags, committed]);
  const stash = useMemo(() => villageStashViewModel(stashConfig, reserved), [stashConfig, reserved]);
  const stashInteractive = hydration === 'ready' && activeStashOwner !== null;

  /* Roster-row drag machine — the same outcome state the floating roster
   *  runs (`useDragOutcome`): rail-sourced drags only, the page owns the
   *  DndContext/sensors/collision so slot magnets Just Work. */
  const { state: dragVisualState, startDrag, startFlight, springBack, settle } = useDragOutcome();
  const residentsById = useMemo(
    () => Object.fromEntries(residents.map((r) => [r.id, r])),
    [residents],
  );
  useDndMonitor({
    onDragStart: (event: DragStartEvent) => {
      if (event.active.data.current?.source !== RAIL_DRAG_SOURCE) return;
      startDrag(String(event.active.id));
    },
    onDragEnd: (event: DragEndEvent) => {
      if (event.active.data.current?.source !== RAIL_DRAG_SOURCE) return;
      const residentId = String(event.active.id);
      const verdict = onDragEnd?.(event);
      if (!event.over || verdict === false) {
        springBack(residentId);
        return;
      }
      if (verdict && typeof verdict === 'object' && 'flightToSlot' in verdict) {
        const { slotId, element } = verdict.flightToSlot;
        const target = elementCenter(element);
        if (target) startFlight({ residentId, slotId, isInset: true, toX: target.x, toY: target.y });
        else {
          /* Slot not rendered (closed detail): commit without animation. */
          settle();
          onFlightComplete?.(residentId, slotId);
        }
        return;
      }
      settle();
    },
  });

  if (!visible) return null;

  const tabs: { id: ExpeditionRailTab; label: string; icon: 'nav-company' | 'ico-chest' }[] = [
    { id: 'roster', label: t('gameFrame.roster.title'), icon: 'nav-company' },
    { id: 'stash', label: t('gameFrame.rail.tabStash'), icon: 'ico-chest' },
  ];

  /* Collapsed — the only folded form (D2): a slim edge chip that expands. */
  if (!expanded) {
    return (
      <button
        type="button"
        data-testid="rail-expand-chip"
        aria-label={t('gameFrame.rail.expand')}
        onClick={() => setExpanded(true)}
        style={{
          position: 'fixed',
          left: 0,
          top: RAIL.marginPx,
          width: RAIL.chipWidthPx,
          height: 72,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 4,
          border: '1px solid color-mix(in srgb, var(--skin-frame-brass) 55%, transparent)',
          borderLeft: 'none',
          borderRadius: '0 10px 10px 0',
          background: 'var(--skin-raised-bg)',
          color: 'var(--skin-title-color)',
          cursor: 'pointer',
          zIndex: DEFAULT_GAME_FRAME_CONFIG.zLayers.floating,
        }}
      >
        <EngravedIcon id="nav-company" size={16} aria-hidden />
        <EngravedIcon id="cmd-chevron-right" size={12} aria-hidden style={{ opacity: 0.7 }} />
      </button>
    );
  }

  return (
    <>
    <HudPlaque
      shape="panel"
      as="section"
      aria-label={t('gameFrame.rail.ariaLabel')}
      data-testid="roster-stash-rail"
      data-hud-controls=""
      style={{
        position: 'fixed',
        left: 0,
        top: RAIL.marginPx,
        bottom: RAIL.bottomInsetPx,
        width: RAIL.widthPx,
        display: 'flex',
        flexDirection: 'column',
        padding: '14px 12px 12px',
        zIndex: DEFAULT_GAME_FRAME_CONFIG.zLayers.floating,
        minHeight: 0,
      }}
    >
      {/* Segmented tabs — the only navigation the column has (D1). */}
      <div role="tablist" aria-label={t('gameFrame.rail.tablist')} style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
        {tabs.map(({ id, label, icon }) => {
          const active = tab === id;
          return (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={active}
              data-testid={`rail-tab-${id}`}
              onClick={() => setTab(id)}
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 5,
                padding: '5px 4px',
                borderRadius: 6,
                border: `1px solid ${active ? 'var(--skin-frame-brass)' : 'transparent'}`,
                background: active ? 'var(--skin-raised-bg)' : 'transparent',
                color: active ? 'var(--skin-title-color)' : 'var(--skin-text-secondary)',
                font: 'var(--skin-hud-caps-weight) var(--skin-hud-caps-size) var(--skin-font-display)',
                letterSpacing: 'var(--skin-hud-caps-tracking)',
                textTransform: 'uppercase',
                cursor: 'pointer',
              }}
            >
              <EngravedIcon id={icon} size={13} aria-hidden />
              {label}
            </button>
          );
        })}
        <button
          type="button"
          data-testid="rail-collapse-chip"
          aria-label={t('gameFrame.rail.collapse')}
          onClick={() => setExpanded(false)}
          style={{
            flexShrink: 0,
            display: 'grid',
            placeItems: 'center',
            width: 24,
            border: '1px solid color-mix(in srgb, var(--skin-frame-brass) 45%, transparent)',
            borderRadius: 6,
            background: 'var(--skin-inset-bg)',
            color: 'var(--skin-text-secondary)',
            cursor: 'pointer',
          }}
        >
          <EngravedIcon id="cmd-chevron-left" size={12} aria-hidden />
        </button>
      </div>

      {/* Body — scrolls inside the plaque, capped above the medallion. */}
      <div
        role="tabpanel"
        style={{ flex: 1, minHeight: 0, overflowY: 'auto', marginTop: 8, display: 'flex', flexDirection: 'column', gap: 6 }}
      >
        {tab === 'roster' ? (
          <div role="list" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {residents.map((resident) => (
              <RosterRow
                key={resident.id}
                resident={resident}
                locked={lockedResidentIds?.includes(resident.id) ?? false}
                lockedLabel={lockedStatusLabel}
                selected={resident.id === selectedResidentId}
                onSelect={onResidentSelect}
                dragDisabled={!dragEnabled}
              />
            ))}
          </div>
        ) : (
          <>
            {/* Member stat chips — bench condition stays visible while packing. */}
            <div aria-label={t('gameFrame.rail.memberStats')} style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
              {residents.map((resident) => (
                <MemberChip key={resident.id} resident={resident} locked={lockedResidentIds?.includes(resident.id) ?? false} />
              ))}
            </div>
            {hydration !== 'ready' ? (
              <p style={{ margin: 0, font: '11px var(--skin-font-serif)', color: 'var(--skin-text-secondary)' }}>
                {t('gameFrame.stash.notReady')}
              </p>
            ) : stash.rows.length === 0 ? (
              <p style={{ margin: 0, font: '11px var(--skin-font-serif)', color: 'var(--skin-text-secondary)' }}>
                {t('gameFrame.stash.empty')}
              </p>
            ) : (
              <div role="list" aria-label={t('gameFrame.stash.title')} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {stash.rows.map((row) => (
                  <RailStashRow key={row.itemId} row={row} interactive={stashInteractive} />
                ))}
              </div>
            )}
            <span
              style={{
                marginTop: 'auto',
                font: 'var(--skin-hud-caps-weight) var(--skin-hud-caps-size) var(--skin-font-display)',
                letterSpacing: 'var(--skin-hud-caps-tracking)',
                color: 'var(--skin-text-secondary)',
              }}
            >
              {t('gameFrame.stash.capacity', { count: stash.storedCount, max: stash.capacityMax })}
            </span>
          </>
        )}
      </div>
    </HudPlaque>
    {/* Rail drag visuals — same ghost/medallion and slot-flight as the
     *  floating roster (`CustomDragOverlay` + `DragOutcomeFlight` inside
     *  the page's DndContext/DragProvider). */}
    <CustomDragOverlay
      residentsById={residentsById}
      usePgCardPreview={true}
      dragVisualState={dragVisualState}
    />
    <DragOutcomeFlight
      state={dragVisualState}
      residentsById={residentsById}
      onComplete={(residentId, slotId) => {
        settle();
        onFlightComplete?.(residentId, slotId);
      }}
    />
    </>
  );
};
