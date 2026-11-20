import React, { useMemo, useRef, useState, type CSSProperties } from 'react';
import { useTranslation } from 'react-i18next';
import * as Tooltip from '@radix-ui/react-tooltip';
import { HudPlaque } from '@/ui/idleVillage/skins/primitives/HudPlaque';
import { HudScrollBand } from '@/ui/idleVillage/skins/primitives/HudScrollBand';
import { HUD_SCROLL_BAND } from '@/balancing/config/idleVillage/hudScrollBandConfig';
import { PanelFrameOrnaments } from '@/ui/idleVillage/skins/primitives/PanelFrameOrnaments';
import { SkinScope } from '@/ui/idleVillage/skins/primitives/SkinScope';
import { EngravedIcon } from './engravedIcons';
import { useHudPanelDrag } from './useHudPanelDrag';
import { villageStashViewModel, type VillageStashRowView } from './villageStashViewModel';
import { stashItemBonus, stashItemCovers, StashQtyBadge, StashItemTooltipBody, STASH_PANEL_NAME_STYLE, STASH_TOOLTIP_STYLE } from './stashItemFace';
import { VillageStashItemIcon } from './villageStashItemIcons';
import { panelFrame6Frame } from '@/generated/slicekit/panelFrame6Frame';
import { panelFrame7Frame } from '@/generated/slicekit/panelFrame7Frame';
import { frameTopRimPx, thinFrameManifest, type SliceKitFrameManifest } from '@/ui/idleVillage/skins/primitives/sliceKitManifest';
import { preloadControlsArt } from '@/ui/idleVillage/skins/controlsArt';
import {
  countReservations,
  reservedElsewhereCount,
  useVillageStashStore,
} from '@/ui/idleVillage/store/useVillageStashStore';
import { defaultQuestItems } from '@/balancing/config/idleVillage/quests/questItems';
import { QUEST_STASH } from '@/balancing/config/idleVillage/quests/questStash';
import { questPoiById } from '@/balancing/config/idleVillage/quests/questPois';
import { bagAssignEligibility, type BagAssignEligibility } from './expeditionBagAssign';
import type { VillageStashConfig } from '@/balancing/config/idleVillage/villageStashConfig';

/**
 * VillageStashPanel — the village warehouse shelf (PLAN-032 SP-2, PLAN-073).
 *
 * Dual-mode by contract (Director ruling, artifact-r003; R-246 click-only):
 * - **Planner-bound** (`activeStashOwner` set): rows are real buttons —
 *   a click assigns the item to that planner's first free bag slot.
 *   Rows whose stock is fully reserved leave the shelf and return when
 *   released.
 * - **Read-only** (no bound planner): a plain `role="list"` — no buttons,
 *   no mutation affordances. The shelf still shows real
 *   derived availability, and a «N elsewhere» counter explains the global
 *   pool. `hydration !== 'ready'` degrades to the same read-only surface.
 *
 * The ledger (`useVillageStashStore`) is the single source of truth — this
 * panel never owns item state. The panel coexists with the quest detail and
 * drags by its title row via `useHudPanelDrag`.
 */
export interface VillageStashPanelProps {
  config: VillageStashConfig;
  /** Anchored position in the free corridor (page-level geometry). */
  left: number;
  top: number;
  widthPx: number;
  /** Height of the zone the stage solver gives the panel: it never grows past it — the list
   *  scrolls inside, title and capacity footer stay on screen (R-234: 17 px off-screen at 1280×800). */
  maxHeightPx?: number;
  zIndex: number;
  onClose: () => void;
}

const titleId = 'village-stash-panel-title';

/* PLAN-127 slice-kit frame candidates (R-362 frame-smeraldo + R-363 thin
 *  default + tighter header): `?frame=` picks the painted frame on the HUD
 *  plaque — `authored` keeps the emitted geometry, `thin`/`frame6thin` scale
 *  the pieces ×0.5 for a denser panel. Same art in every candidate, only
 *  the DISPLAY weight changes; the header clearance below the band derives
 *  from the active manifest (`frameTopRimPx`), never a hand constant. */
type PanelFrameId = 'authored' | 'thin' | 'frame6thin';
const panelFrame7Thin = thinFrameManifest(panelFrame7Frame, 0.5);
const panelFrame6Thin = thinFrameManifest(panelFrame6Frame, 0.5);
const PANEL_FRAME_CANDIDATES: ReadonlyArray<{ id: PanelFrameId; manifest: SliceKitFrameManifest }> = [
  { id: 'thin', manifest: panelFrame7Thin },
  { id: 'authored', manifest: panelFrame7Frame },
  { id: 'frame6thin', manifest: panelFrame6Thin },
];
const panelFrameParam = new URLSearchParams(window.location.search).get('frame');
const panelFrameActive =
  PANEL_FRAME_CANDIDATES.find((c) => c.id === panelFrameParam)?.manifest ?? PANEL_FRAME_CANDIDATES[0].manifest;
const panelFrameTopRim = frameTopRimPx(panelFrameActive);

/* R-363 detail card: the baptized emerald+brass medallion frames the item
 *  icon — the mockup's inspector grammar (round ornate icon mount). */
const DETAIL_MEDALLION_SRC = '/assets/ui/hud-real/medaglione-battezzato-v3-frame.webp';

/* Preload the painted-control art (PLAN-128 `controls` slice-kit: pill +
 *  round, 5 states each) so the tab strip's first hover doesn't pop. */
preloadControlsArt();

/** Engraved glyph per item `kind` on the filter tabs (R-353 mockup strip). */
const KIND_TAB_ICON: Record<string, string> = {
  equipment: 'ico-axe',
  consumable: 'ico-vial',
};

/** Visually-hidden text kept inside every shelf cell so the grid carries the
 *  same name/description vocabulary the list rows did (screen readers and the
 *  component contract both read it — village-stash-panel.INV-1). */
const srOnlyText: CSSProperties = {
  position: 'absolute',
  width: 1,
  height: 1,
  overflow: 'hidden',
  clip: 'rect(0 0 0 0)',
  whiteSpace: 'nowrap',
};

/**
 * Shared cell face — the painted icon + corner ×N badge pinned inside the
 * well (the well IS the cell's frame; no second tile box inside — Director
 * 2026-11-20: «due quadrati uno dentro l'altro, nn c devono essere»), name +
 * description as sr-only text — used by both modes so the two surfaces never
 * diverge (R-270, R-353 grid restyle).
 */
const StashCellFace: React.FC<{ row: VillageStashRowView; iconPx: number }> = ({ row, iconPx }) => {
  const { t } = useTranslation('idleVillage');
  return (
    <>
      <span aria-hidden style={{ display: 'inline-flex', color: 'var(--skin-title-color)' }}>
        <VillageStashItemIcon icon={row.icon} size={iconPx} />
      </span>
      {row.qty != null && <StashQtyBadge qty={row.qty} />}
      <span style={srOnlyText}>
        {t(row.nameKey)} — {t(row.descKey)}
      </span>
    </>
  );
};

/* R-363 golden slot grammar: every shelf cell is a recessed WELL — dark
 *  lacquer ground sunk under a brass-rimmed border (inset shadow = the
 *  recess), the shared item tile inside carrying the ×N badge. The well is
 *  chrome only: interactivity lives on the cell's button/listitem. */
const wellChrome = (rowPx: number): CSSProperties => ({
  position: 'relative',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  minWidth: 0,
  height: rowPx,
  borderRadius: 10,
  border: '1px solid color-mix(in srgb, var(--skin-hud-brass-hi) 58%, transparent)',
  background:
    'linear-gradient(180deg, color-mix(in srgb, black 40%, var(--skin-hud-lacquer-deep)), var(--skin-hud-lacquer-deep))',
  boxShadow:
    'inset 0 2px 6px color-mix(in srgb, black 62%, transparent), inset 0 -1px 0 color-mix(in srgb, var(--skin-hud-brass-hi) 28%, transparent), inset 0 1px 0 color-mix(in srgb, var(--skin-hud-brass-hi) 22%, transparent)',
});

/**
 * The shared stash tooltip (R-270: same vocabulary on both surfaces —
 * name · desc · covers · stock). Wraps the row element it triggers on;
 * the village `qty` IS the remaining stock.
 */
const StashRowTooltip: React.FC<{ row: VillageStashRowView; children: React.ReactElement }> = ({ row, children }) => (
  <Tooltip.Root delayDuration={120}>
    <Tooltip.Trigger asChild>{children}</Tooltip.Trigger>
    <Tooltip.Portal>
      <Tooltip.Content side="top" sideOffset={6} collisionPadding={8} style={STASH_TOOLTIP_STYLE}>
        <StashItemTooltipBody labelKey={row.nameKey} descKey={row.descKey} covers={stashItemCovers(row.itemId)} stockQty={row.qty} />
      </Tooltip.Content>
    </Tooltip.Portal>
  </Tooltip.Root>
);

/* R-339/PLAN-119 T3-S2 (artifact-r004 D7): the bound shelf marks each row's
 * assign eligibility BEFORE the click — `data-assign-state` mirrors the
 * ledger's own reject reasons (`eligible` | `packed` | `bagFull`). Eligible
 * rows carry a faint accent wash; packed/bagFull rows dim but STAY
 * clickable — the click still flows to the ledger, which announces the
 * localized reject (`alreadyInBag`/`bagFull`) through lastEvent. The shelf
 * never duplicates the mutation check: `assign` stays the only authority. */
const cellChrome = (interactive: boolean, assignState?: BagAssignEligibility): CSSProperties => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  position: 'relative',
  minWidth: 0,
  ...(interactive
    ? {
        /* R-363: the button is the well's transparent hit-surface — the
         *  recessed chrome lives on the listitem (WELL_CHROME); the
         *  eligibility wash/dim still lands inside the well. */
        width: '100%',
        height: '100%',
        padding: 0,
        border: 0,
        borderRadius: 9,
        background: 'none',
        color: 'inherit',
        cursor: 'pointer',
        ...(assignState === 'eligible'
          ? {
              background: 'color-mix(in srgb, var(--skin-icon-accent) 10%, transparent)',
            }
          : {}),
        ...(assignState === 'packed' || assignState === 'bagFull' ? { opacity: 0.55 } : {}),
      }
    : {}),
});


/** Single assign authority shared by the grid cell and the detail card's
 *  Pack control: a click assigns to the bound planner's first free bag slot,
 *  and on success the focus lands on the filled bag slot — deterministic,
 *  never to body. Rejects announce through the store's lastEvent live region. */
const useStashPack = () => {
  const owner = useVillageStashStore((s) => s.activeStashOwner);
  const assign = useVillageStashStore((s) => s.assign);
  return (itemId: string) => {
    if (!owner) return;
    if (assign(owner, itemId) === 'ok') {
      window.requestAnimationFrame(() =>
        document.querySelector<HTMLElement>(`[data-testid="loadout-item-${itemId}"]`)?.focus(),
      );
    }
  };
};

/**
 * A planner-bound shelf cell: a click assigns to the first free bag slot;
 * hover/focus previews the item in the detail card (R-353).
 */
const InteractiveStashCell: React.FC<{
  row: VillageStashRowView;
  assignState: BagAssignEligibility;
  onPreview: (itemId: string) => void;
  rowPx: number;
  iconPx: number;
}> = ({ row, assignState, onPreview, rowPx, iconPx }) => {
  const { t } = useTranslation('idleVillage');
  const pack = useStashPack();
  return (
    <div role="listitem" style={wellChrome(rowPx)}>
      <StashRowTooltip row={row}>
        <button
          type="button"
          data-testid={`stash-item-${row.itemId}`}
          data-assign-state={assignState}
          aria-label={t('gameFrame.stash.addToBag', { item: t(row.nameKey) })}
          onClick={() => pack(row.itemId)}
          onMouseEnter={() => onPreview(row.itemId)}
          onFocus={() => onPreview(row.itemId)}
          style={cellChrome(true, assignState)}
        >
          <StashCellFace row={row} iconPx={iconPx} />
        </button>
      </StashRowTooltip>
    </div>
  );
};

/**
 * The localized line announced for a ledger event — shared by the shelf and the
 * planner's own live region so a mutation reads the same everywhere. Rejects
 * map their `reason` to the matching feedback key.
 */
export function stashAnnouncement(
  t: (key: string, opts?: Record<string, unknown>) => string,
  lastEvent: ReturnType<typeof useVillageStashStore.getState>['lastEvent'],
): string | null {
  if (!lastEvent) return null;
  const itemLabel = lastEvent.itemId ? t(defaultQuestItems[lastEvent.itemId]?.labelKey ?? lastEvent.itemId) : undefined;
  const opts = itemLabel ? { item: itemLabel } : undefined;
  switch (lastEvent.kind) {
    case 'assign':
      return t('gameFrame.stash.announce.assigned', opts);
    case 'release':
      return t('gameFrame.stash.announce.released', opts);
    case 'swap':
      return t('gameFrame.stash.announce.swapped', opts);
    case 'releaseAll':
      return t('gameFrame.stash.announce.releasedAll');
    case 'reject':
      return lastEvent.reason ? t(`gameFrame.stash.${lastEvent.reason}`) : null;
    default:
      return null;
  }
}

export const VillageStashPanel: React.FC<VillageStashPanelProps> = ({ config, left, top, widthPx, maxHeightPx, zIndex, onClose }) => {
  const { t } = useTranslation('idleVillage');
  const { panelStyle, handleProps } = useHudPanelDrag();
  const hydration = useVillageStashStore((s) => s.hydration);
  const bags = useVillageStashStore((s) => s.bags);
  const committed = useVillageStashStore((s) => s.committed);
  const activeStashOwner = useVillageStashStore((s) => s.activeStashOwner);
  const lastEvent = useVillageStashStore((s) => s.lastEvent);
  const elsewhere = useVillageStashStore((s) => reservedElsewhereCount(s, s.activeStashOwner));

  const reserved = useMemo(() => countReservations(bags, committed), [bags, committed]);
  const vm = useMemo(() => villageStashViewModel(config, reserved), [config, reserved]);
  const interactive = hydration === 'ready' && activeStashOwner !== null;
  /* R-353 mockup restyle: kind tabs + tile grid + hover/focus detail card.
   *  Tabs derive from the kinds configured for this shelf (config-first) so
   *  the strip never advertises a category the store cannot hold; the
   *  radiogroup pattern mirrors HudRealTime's speed pills. */
  const kinds = useMemo(() => {
    const seen = new Set<string>();
    for (const it of config.items) {
      const k = defaultQuestItems[it.itemId]?.kind;
      if (k) seen.add(k);
    }
    return [...seen];
  }, [config.items]);
  const [tab, setTab] = useState<string>('all');
  /* Director ruling 2026-11-20: grid only — the R-363 list view is dropped. */
  const [detailItemId, setDetailItemId] = useState<string | null>(null);
  const shelfRef = useRef<HTMLDivElement | null>(null);
  const visibleRows = useMemo(
    () => (tab === 'all' ? vm.rows : vm.rows.filter((r) => defaultQuestItems[r.itemId]?.kind === tab)),
    [tab, vm.rows],
  );
  /* Sticky preview: the last hovered/focused cell wins, falling back to the
   *  first visible row — the card never renders empty while the shelf has
   *  stock (inventory-inspector idiom, no click needed). */
  const detailRow = visibleRows.find((r) => r.itemId === detailItemId) ?? visibleRows[0] ?? null;
  /* Tight zones (720p): the inspector is sacrificed below the configured
   *  panel height — the shelf keeps its tile rows instead of a clipped card. */
  const detailFits = !maxHeightPx || maxHeightPx >= config.panel.detailMinPanelHeightPx;
  const hintFits = !maxHeightPx || maxHeightPx >= config.panel.hintMinPanelHeightPx;
  const pack = useStashPack();
  /* T3-S2: per-row assign eligibility for the BOUND planner's sparse bag —
   *  `bags[owner]` keeps slot positions; an absent bag counts as empty.
   *  `bagFull` is true only when the bag has no free slot AND at least one
   *  unpacked row remains on the shelf — a full bag with nothing left to
   *  pack needs no hint. */
  const boundBag = activeStashOwner ? bags[activeStashOwner] : undefined;
  const assignStates = useMemo(() => {
    if (!interactive) return {};
    const states: Record<string, BagAssignEligibility> = {};
    /* Per-quest well count (Director 2026-11-20): the bound owner's
     *  authored `bagSlots`, global stash default as fallback. */
    const capacity = activeStashOwner ? (questPoiById(activeStashOwner)?.bagSlots ?? QUEST_STASH.bagSlots) : QUEST_STASH.bagSlots;
    for (const row of vm.rows) states[row.itemId] = bagAssignEligibility(boundBag, row.itemId, capacity);
    return states;
  }, [interactive, boundBag, vm.rows]);
  const bagFullHint = interactive && Object.values(assignStates).some((s) => s === 'bagFull');
  /* Live-region split (no double announce): the bound planner's own region
   * narrates events that carry its poiId; the shelf narrates global events
   * (undefined poiId — commit releases, run-scoped mutations). */
  const announcement = lastEvent && lastEvent.poiId === undefined ? stashAnnouncement(t, lastEvent) : null;

  return (
    <div
      data-hud-panel="villageStash"
      tabIndex={-1}
      style={{
        position: 'fixed',
        left,
        top,
        width: widthPx,
        maxHeight: maxHeightPx,
        display: 'flex',
        flexDirection: 'column',
        zIndex: panelStyle.zIndex ?? zIndex,
        pointerEvents: 'auto',
        outline: 'none',
        ...panelStyle,
      }}
    >
      {/* The zone box (`maxHeightPx`) only bites if the whole chain is a
       *  shrinking flex column: outer div → scope → plaque. Without the
       *  scope's `minHeight: 0` + column the plaque kept content height and
       *  painted the frame past the panel rect / off-screen at 720p. */}
      <SkinScope data-hud-controls="" style={{ display: 'flex', flexDirection: 'column', flex: '0 1 auto', minHeight: 0 }}>
        {/* Shared stash tooltips (R-270): the panel mounts its own provider —
         *  the planner's app-level provider is not guaranteed above a
         *  page-anchored sibling surface. */}
        <Tooltip.Provider delayDuration={120}>
        <HudPlaque
          shape="field"
          tone="enamel"
          as="section"
          aria-labelledby={titleId}
          style={{
            display: 'flex',
            flexDirection: 'column',
            minHeight: 0,
            flex: '0 1 auto',
            /* R-363: top = --skin-hud-frame-top token + the active frame's
             *  rim reach (frameTopRimPx — thin ×0.5 ≈ 0.5px) so the header
             *  sits ~8px under the painted band, not under the corner
             *  knuckles' bbox. Sides/bottom = plaque clearance + padding. */
            padding: `calc(var(--skin-hud-frame-top) + ${panelFrameTopRim}px) calc(var(--skin-hud-plaque-clearance) + var(--skin-hud-panel-padding)) calc(var(--skin-hud-plaque-clearance) + var(--skin-hud-panel-padding))`,
            gap: 'var(--skin-hud-stack-gap)',
          }}
        >
          {/* Golden header (R-363): icon + title left, «N/N» count then
           *  minimise/close right — the mockup's title grammar; the count
           *  derives from the view model (config capacity, never hardcoded).
           *  The 34px left inset the R-353 corner emblem needed is gone: the
           *  thin knuckles' opaque mass hugs the panel edges. */}
          <div {...handleProps} style={{ display: 'flex', alignItems: 'center', gap: 'var(--skin-hud-inline-gap)', ...handleProps.style }}>
            <span
              id={titleId}
              style={{
                flex: 1,
                minWidth: 0,
                font: 'var(--skin-hud-name-weight) var(--skin-hud-name-size) var(--skin-font-display)',
                letterSpacing: 'var(--skin-hud-name-tracking)',
                color: 'var(--skin-title-color)',
                textShadow: 'var(--skin-hud-engrave)',
              }}
            >
              {t('gameFrame.stash.title')}
            </span>
            {kinds.length > 0 && (
              <span
                role="radiogroup"
                aria-label={t('gameFrame.stash.filterLabel')}
                data-testid="stash-tabs"
                data-hud-controls=""
                style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--skin-hud-control-gap, 6px)' }}
              >
                {(['all', ...kinds] as const).map((id) => {
                const active = tab === id;
                return (
                  /* R-363 golden tab strip revised (Director 2026-11-20): the
                   *  small dark pills of the Roster control family — same
                   *  [data-hud-controls] grammar; aria-checked carries the
                   *  active-tab state (skinScope.css matches it to the
                   *  pressed look). */
                  <button
                    key={id}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    aria-label={id === 'all' ? t('gameFrame.stash.tabs.all') : t(`gameFrame.stash.tabs.${id}`)}
                    title={id === 'all' ? t('gameFrame.stash.tabs.all') : t(`gameFrame.stash.tabs.${id}`)}
                    data-ctl="round"
                    data-state={active ? 'selected' : undefined}
                    data-testid={`stash-tab-${id}`}
                    onClick={() => setTab(id)}
                  >
                    <EngravedIcon
                      id={id === 'all' ? 'ico-chest' : KIND_TAB_ICON[id] ?? 'ico-pouch'}
                      size={12}
                      aria-hidden
                    />
                  </button>
                );
              })}
              </span>
            )}
            <span data-hud-controls="" style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--skin-hud-inline-gap)', flexShrink: 0 }}>
              <button type="button" data-ctl="round" data-panel-close="" aria-label={t('gameFrame.panels.close')} title={t('gameFrame.panels.close')} onClick={onClose}>
                <EngravedIcon id="cmd-close" size={14} />
              </button>
            </span>
          </div>

          {/* Engraved rule under the title — the mockups' divider grammar
           *  (line · diamond · line), Director 2026-11-21 depth pass. */}
          <div data-skin="titlesep" aria-hidden style={{ margin: '1px 0 0' }}>
            <span style={{ color: 'var(--skin-titlesep-diamond-color)', textShadow: 'var(--skin-titlesep-diamond-glow)', fontSize: 7, lineHeight: 1 }}>◆</span>
          </div>

          {/* Global-pool counters: reservations held by other planners or frozen in a run. */}
          {elsewhere > 0 && (
            <span
              data-testid="stash-elsewhere"
              style={{ font: 'var(--skin-hud-caps-weight) var(--skin-hud-caps-size) var(--skin-font-display)', letterSpacing: 'var(--skin-hud-caps-tracking)', textTransform: 'uppercase', color: 'var(--skin-text-secondary)' }}
            >
              {t('gameFrame.stash.elsewhere', { count: elsewhere })}
            </span>
          )}

          {/* Stock: planner-bound cells are buttons; read-only cells stay a
           *  plain list. The shelf is a grid of recessed wells (R-363 golden
           *  slot grammar); each listitem still carries the item's
           *  name/description as sr-only text. `data-hud-scroll` picks up
           *  the bronze themed scrollbar. */}
          <div
            role="list"
            ref={shelfRef}
            data-testid="stash-shelf"
            data-stash-mode={interactive ? 'interactive' : 'readonly'}
            data-stash-view="grid"
            data-hud-scroll-band=""
            style={{
              display: 'grid',
              gridTemplateColumns: `repeat(${config.panel.shelfColumns}, ${config.panel.shelfRowPx}px)`,
              justifyContent: 'center',
              gap: 'var(--skin-hud-stack-gap)',
              alignContent: 'start',
              /* Director 2026-11-21 «due righe insieme»: the shelf always
               *  shows `shelfVisibleRows` tile rows before scrolling. */
              minHeight: `calc(${config.panel.shelfVisibleRows} * ${config.panel.shelfRowPx}px + ${config.panel.shelfVisibleRows - 1} * var(--skin-hud-stack-gap))`,
              overflowY: 'auto',
              scrollbarGutter: 'stable',
              /* The engraved band overlays this gutter — overlay
               *  scrollbars reserve nothing, so pad it explicitly. */
              paddingRight: HUD_SCROLL_BAND.widthPx + 4,
            }}
          >
            {vm.rows.length === 0 && (
              <span style={{ gridColumn: '1 / -1', font: '12px var(--skin-font-serif)', color: 'var(--skin-text-secondary)' }}>
                {t('gameFrame.stash.empty')}
              </span>
            )}
            {vm.rows.length > 0 && visibleRows.length === 0 && (
              <span style={{ gridColumn: '1 / -1', font: '12px var(--skin-font-serif)', color: 'var(--skin-text-secondary)' }}>
                {t('gameFrame.stash.filterEmpty')}
              </span>
            )}
            {visibleRows.map((row) =>
              interactive ? (
                <InteractiveStashCell
                  key={row.itemId}
                  row={row}
                  assignState={assignStates[row.itemId] ?? 'eligible'}
                  onPreview={setDetailItemId}
                  rowPx={config.panel.shelfRowPx}
                  iconPx={config.panel.shelfIconPx}
                />
              ) : (
                <StashRowTooltip key={row.itemId} row={row}>
                  <div role="listitem" style={wellChrome(config.panel.shelfRowPx)} onMouseEnter={() => setDetailItemId(row.itemId)}>
                    <StashCellFace row={row} iconPx={config.panel.shelfIconPx} />
                  </div>
                </StashRowTooltip>
              ),
            )}
          </div>

          {/* Item detail card (R-363 golden grammar): the hovered/focused
           *  cell's item as the mockup's inspector — medallion-framed icon,
           *  engraved name, «+N Stat» line (config bonus), description, the
           *  «Usable in expeditions» effect pill, Pack + quantity on the
           *  right. Same data the shared tooltip already joins — nothing
           *  new, only the layout is the mockup's. */}
          {detailFits && detailRow && (() => {
            const bonus = stashItemBonus(detailRow.itemId);
            const covers = stashItemCovers(detailRow.itemId);
            return (
            <div
              data-testid="stash-detail"
              aria-label={t('gameFrame.stash.detailLabel')}
              style={{
                /* Director 2026-11-20: the "in grande" inspector gets its own
                 *  minimal pretty frame — one rounded lacquer box, brass hairline,
                 *  no stacked squares. */
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                /* Tight zones (720p): the inspector compresses and clips its
                 *  own tail instead of pushing the plaque past the frame. */
                flexShrink: 1,
                minHeight: 0,
                overflow: 'hidden',
                borderRadius: 10,
                border: '1px solid color-mix(in srgb, var(--skin-hud-brass-hi) 42%, transparent)',
                background:
                  'linear-gradient(180deg, color-mix(in srgb, var(--skin-hud-lacquer-base) 55%, transparent), color-mix(in srgb, var(--skin-hud-lacquer-deep) 70%, transparent))',
                boxShadow:
                  'inset 0 1px 0 color-mix(in srgb, var(--skin-title-color) 12%, transparent), inset 0 -8px 18px color-mix(in srgb, black 22%, transparent)',
                padding: '8px 10px',
              }}
            >
              <span style={{ position: 'relative', width: 56, height: 56, flexShrink: 0 }}>
                <img src={DETAIL_MEDALLION_SRC} alt="" aria-hidden style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} />
                <span style={{ position: 'absolute', inset: '16%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--skin-title-color)' }}>
                  <VillageStashItemIcon icon={detailRow.icon} size={28} />
                </span>
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ ...STASH_PANEL_NAME_STYLE, fontSize: 15 }}>{t(detailRow.nameKey)}</div>
                {bonus ? (
                  <div style={{ font: '12px var(--skin-font-serif)', color: 'var(--skin-title-color)', textShadow: 'var(--skin-hud-engrave)' }}>
                    +{bonus.bonus} {bonus.stats.map((s) => t(`questExpedition.statName.${s}`)).join(' · ')}
                  </div>
                ) : covers.length > 0 ? (
                  <div style={{ font: '12px var(--skin-font-serif)', color: 'var(--skin-icon-accent)' }}>
                    {t('questExpedition.bag.covers')} {covers.join(' · ')}
                  </div>
                ) : null}
                <div style={{ font: '12px var(--skin-font-serif)', lineHeight: 1.3, color: 'var(--skin-text-secondary)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {t(detailRow.descKey)}
                </div>
                <div style={{ marginTop: 4 }}>
                  <span
                    style={{
                      display: 'inline-block',
                      padding: '2px 9px',
                      borderRadius: 999,
                      border: '1px solid color-mix(in srgb, var(--skin-icon-accent) 55%, transparent)',
                      background: 'color-mix(in srgb, var(--skin-icon-accent) 12%, transparent)',
                      boxShadow: 'inset 0 1px 0 color-mix(in srgb, var(--skin-title-color) 18%, transparent)',
                      font: 'var(--skin-hud-caps-weight) 10px var(--skin-font-display)',
                      letterSpacing: 'var(--skin-hud-caps-tracking)',
                      textTransform: 'uppercase',
                      color: 'var(--skin-icon-accent)',
                    }}
                  >
                    {t('gameFrame.stash.usableInExpeditions')}
                  </span>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0, alignSelf: 'center' }}>
                {interactive && (
                  <button
                    type="button"
                    data-ctl="pill"
                    data-testid="stash-pack-detail"
                    data-assign-state={assignStates[detailRow.itemId] ?? 'eligible'}
                    aria-label={t('gameFrame.stash.addToBag', { item: t(detailRow.nameKey) })}
                    onClick={() => pack(detailRow.itemId)}
                  >
                    {t('gameFrame.stash.pack')}
                  </button>
                )}
                <span style={{ font: '12px var(--skin-font-serif)', color: 'var(--skin-text-secondary)' }}>
                  {t('gameFrame.stash.qty', { qty: detailRow.qty })}
                </span>
              </div>
            </div>
            );
          })()}

          {/* Mode hint: how to unlock interactions, or why the shelf is
           *  frozen — dropped in tight zones like the detail card (720p:
           *  the shelf keeps its two tile rows instead). */}
          {!interactive && hintFits && (
            <span
              data-testid="stash-mode-hint"
              style={{ font: '12px var(--skin-font-serif)', color: 'var(--skin-text-secondary)' }}
            >
              {hydration !== 'ready' ? t('gameFrame.stash.notReady') : t('gameFrame.stash.openHint')}
            </span>
          )}

          {/* T3-S2: bound-planner consequence hint — the bag is full, so
           *  further clicks only announce the `bagFull` reject. The hint
           *  says it upfront (D7: bag slots render as affordances, the
           *  shelf explains why a pack can't land). */}
          {interactive && bagFullHint && (
            <span
              data-testid="stash-bag-full-hint"
              style={{ font: '12px var(--skin-font-serif)', color: 'var(--skin-text-secondary)' }}
            >
              {t('gameFrame.stash.bagFullHint')}
            </span>
          )}

          <span aria-live="polite" style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)', whiteSpace: 'nowrap' }}>
            {announcement}
          </span>
          {/* PLAN-127 slice-kit frame (R-362/363): the painted smeraldo frame
           *  drawn from the active candidate manifest — `?frame=` swaps the
           *  weight, `thin` ×0.5 is the default. `corniciStash` is the
           *  variant tag variant-tagged pieces filter on. Decoration only,
           *  same layer as the seat line. */}
          <PanelFrameOrnaments variant="corniciStash" manifest={panelFrameActive} />
          {/* Shared engraved scroll band (PLAN-125 Fase 7a): overlay on the
           *  shelf's right gutter — the shelf keeps its real scroll. */}
          <HudScrollBand scrollRef={shelfRef} />
        </HudPlaque>
        </Tooltip.Provider>
      </SkinScope>
    </div>
  );
};

export default VillageStashPanel;
