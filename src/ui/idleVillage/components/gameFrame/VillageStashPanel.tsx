import React, { useMemo, useRef, useState, type CSSProperties } from 'react';
import { useTranslation } from 'react-i18next';
import * as Tooltip from '@radix-ui/react-tooltip';
import { HudPlaque } from '@/ui/idleVillage/skins/primitives/HudPlaque';
import { PanelFrameOrnaments } from '@/ui/idleVillage/skins/primitives/PanelFrameOrnaments';
import { SkinScope } from '@/ui/idleVillage/skins/primitives/SkinScope';
import { EngravedIcon } from './engravedIcons';
import { useHudPanelDrag } from './useHudPanelDrag';
import { villageStashViewModel, type VillageStashRowView } from './villageStashViewModel';
import { stashItemCovers, StashItemTile, StashItemTooltipBody, STASH_TOOLTIP_STYLE } from './stashItemFace';
import {
  countReservations,
  reservedElsewhereCount,
  useVillageStashStore,
} from '@/ui/idleVillage/store/useVillageStashStore';
import { defaultQuestItems } from '@/balancing/config/idleVillage/quests/questItems';
import { QUEST_STASH } from '@/balancing/config/idleVillage/quests/questStash';
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

/** Engraved glyph per item `kind` on the filter tabs (R-353 mockup strip). */
const KIND_TAB_ICON: Record<string, string> = {
  equipment: 'ico-axe',
  consumable: 'ico-vial',
};

const controlButton: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  minWidth: 24,
  minHeight: 24,
  padding: 0,
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
 * Shared cell face — `StashItemTile` (the planner's item-face: lacquer tile +
 * corner ×N badge) as the visual, name + description as sr-only text — used
 * by both modes so the two surfaces never diverge (R-270, R-353 grid restyle).
 */
const StashCellFace: React.FC<{ row: VillageStashRowView }> = ({ row }) => {
  const { t } = useTranslation('idleVillage');
  return (
    <>
      <StashItemTile icon={row.icon} qty={row.qty} size={44} iconSize={22} />
      <span style={srOnlyText}>
        {t(row.nameKey)} — {t(row.descKey)}
      </span>
    </>
  );
};

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
        width: '100%',
        padding: '5px 4px',
        margin: '-5px -4px',
        border: '1px solid color-mix(in srgb, var(--skin-surface-border) 35%, transparent)',
        borderRadius: 8,
        background: 'none',
        color: 'inherit',
        cursor: 'pointer',
        ...(assignState === 'eligible'
          ? {
              background: 'color-mix(in srgb, var(--skin-icon-accent) 10%, transparent)',
              borderColor: 'color-mix(in srgb, var(--skin-icon-accent) 45%, transparent)',
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
}> = ({ row, assignState, onPreview }) => {
  const { t } = useTranslation('idleVillage');
  const pack = useStashPack();
  return (
    <div role="listitem">
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
          <StashCellFace row={row} />
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
  /* Folded to a title strip — same affordance as the quest window's minimise
   *  (R-246 follow-up): icon + name + the live capacity count survive.
   *  `minimisedAt` guards the restore: the folded pill sits exactly where
   *  minimise was, so a fast second click must not be a valid restore —
   *  a deliberate click (≥350ms later) still is. */
  const [minimised, setMinimised] = useState(false);
  const minimisedAt = useRef(0);
  const minimise = () => { minimisedAt.current = Date.now(); setMinimised(true); };
  const restore = () => { if (Date.now() - minimisedAt.current >= 350) setMinimised(false); };

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
  const [detailItemId, setDetailItemId] = useState<string | null>(null);
  const visibleRows = useMemo(
    () => (tab === 'all' ? vm.rows : vm.rows.filter((r) => defaultQuestItems[r.itemId]?.kind === tab)),
    [tab, vm.rows],
  );
  /* Sticky preview: the last hovered/focused cell wins, falling back to the
   *  first visible row — the card never renders empty while the shelf has
   *  stock (inventory-inspector idiom, no click needed). */
  const detailRow = visibleRows.find((r) => r.itemId === detailItemId) ?? visibleRows[0] ?? null;
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
    for (const row of vm.rows) states[row.itemId] = bagAssignEligibility(boundBag, row.itemId, QUEST_STASH.bagSlots);
    return states;
  }, [interactive, boundBag, vm.rows]);
  const bagFullHint = interactive && Object.values(assignStates).some((s) => s === 'bagFull');
  /* Live-region split (no double announce): the bound planner's own region
   * narrates events that carry its poiId; the shelf narrates global events
   * (undefined poiId — commit releases, run-scoped mutations). */
  const announcement = lastEvent && lastEvent.poiId === undefined ? stashAnnouncement(t, lastEvent) : null;

  /* Folded strip: same fixed shell + drag handle, one hairline plaque —
   *  icon, name and the capacity count stay readable at a glance. */
  if (minimised) {
    return (
      <div
        data-hud-panel="villageStash"
        tabIndex={-1}
        style={{
          position: 'fixed',
          left,
          top,
          width: widthPx,
          zIndex: panelStyle.zIndex ?? zIndex,
          pointerEvents: 'auto',
          outline: 'none',
          ...panelStyle,
        }}
      >
        <SkinScope data-hud-controls="">
          <HudPlaque
            shape="hang"
            as="section"
            aria-label={t('gameFrame.stash.title')}
            data-testid="stash-minimised"
            /* R-251: insets must clear the plaque's bronze band (~8px painted
             *  inside the silhouette) — 10px vertical keeps every control
             *  visibly off the band; 18px+4 keeps the chest off the end caps. */
            style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 'var(--skin-hud-inline-gap)', padding: '10px 18px' }}
          >
            <div {...handleProps} style={{ display: 'flex', alignItems: 'center', gap: 'var(--skin-hud-inline-gap)', flex: 1, minWidth: 0, paddingLeft: 4, ...handleProps.style }}>
              <EngravedIcon id="ico-chest" size={14} aria-hidden style={{ color: 'var(--skin-title-color)', flexShrink: 0 }} />
              <span
                style={{
                  minWidth: 0,
                  font: 'var(--skin-hud-name-weight) var(--skin-hud-name-size) var(--skin-font-display)',
                  letterSpacing: 'var(--skin-hud-name-tracking)',
                  color: 'var(--skin-title-color)',
                  textShadow: 'var(--skin-hud-engrave)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {t('gameFrame.stash.title')}
              </span>
              <span
                data-testid="stash-minimised-count"
                style={{ font: 'var(--skin-hud-caps-weight) var(--skin-hud-caps-size) var(--skin-font-display)', letterSpacing: 'var(--skin-hud-caps-tracking)', color: 'var(--skin-text-secondary)', flexShrink: 0 }}
              >
                {vm.storedCount}/{vm.capacityMax}
              </span>
            </div>
            {/* Same control slots as the expanded header: restore sits where
             *  minimise was — the icon does not move under the pointer, and it
             *  no longer rides the plaque's right border. */}
            <span data-hud-controls="" style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--skin-hud-inline-gap)', flexShrink: 0 }}>
              <button
                type="button"
                data-testid="stash-restore"
                aria-label={t('floatingPanel.restore')}
                title={t('floatingPanel.restore')}
                onClick={restore}
                style={controlButton}
              >
                <EngravedIcon id="cmd-panels" size={13} />
              </button>
              <button type="button" data-skin="close" aria-label={t('gameFrame.panels.close')} onClick={onClose} style={controlButton}>
                <EngravedIcon id="cmd-close" size={14} />
              </button>
            </span>
          </HudPlaque>
        </SkinScope>
      </div>
    );
  }

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
      <SkinScope data-hud-controls="">
        {/* Shared stash tooltips (R-270): the panel mounts its own provider —
         *  the planner's app-level provider is not guaranteed above a
         *  page-anchored sibling surface. */}
        <Tooltip.Provider delayDuration={120}>
        <HudPlaque
          shape="panel"
          as="section"
          aria-labelledby={titleId}
          style={{ display: 'flex', flexDirection: 'column', minHeight: 0, flex: '0 1 auto', padding: 'var(--skin-hud-panel-padding)', gap: 'var(--skin-hud-stack-gap)' }}
        >
          {/* Title row: building icon + name left, X right. Drag handle.
           *  R-251 bis: the expanded row uses the SAME content insets as the
           *  collapsed strip (plaque padding 10 + this 12/8 = the strip's
           *  22/18) — collapsing changes the glyph, never the geometry. */}
          <div {...handleProps} style={{ display: 'flex', alignItems: 'center', gap: 'var(--skin-hud-inline-gap)', paddingInline: '34px 8px', ...handleProps.style }}>
            <EngravedIcon id="ico-chest" size={14} aria-hidden style={{ color: 'var(--skin-title-color)', flexShrink: 0 }} />
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
            <span data-hud-controls="" style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--skin-hud-inline-gap)', flexShrink: 0 }}>
              <button
                type="button"
                data-testid="stash-minimise"
                aria-label={t('floatingPanel.minimize')}
                title={t('floatingPanel.minimize')}
                onClick={minimise}
                style={controlButton}
              >
                <EngravedIcon id="cmd-minimize" size={13} />
              </button>
              <button type="button" data-skin="close" aria-label={t('gameFrame.panels.close')} onClick={onClose} style={controlButton}>
                <EngravedIcon id="cmd-close" size={14} />
              </button>
            </span>
          </div>

          {/* Kind tabs (R-353): radiogroup filter for the shelf grid. Labels
           *  resolve per-kind from i18n; the strip stays in both modes —
           *  filtering is a view concern, not a mutation. */}
          {kinds.length > 0 && (
            <div
              role="radiogroup"
              aria-label={t('gameFrame.stash.filterLabel')}
              data-testid="stash-tabs"
              style={{ display: 'flex', gap: 6, flexWrap: 'wrap', paddingInlineStart: 22 }}
            >
              {(['all', ...kinds] as const).map((id) => {
                const active = tab === id;
                return (
                  <button
                    key={id}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    data-testid={`stash-tab-${id}`}
                    onClick={() => setTab(id)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 5,
                      padding: '3px 10px',
                      borderRadius: 999,
                      border: `1px solid color-mix(in srgb, ${active ? 'var(--skin-icon-accent)' : 'var(--skin-surface-border)'} ${active ? 70 : 40}%, transparent)`,
                      background: active
                        ? 'color-mix(in srgb, var(--skin-icon-accent) 18%, transparent)'
                        : 'color-mix(in srgb, var(--skin-hud-lacquer-deep) 45%, transparent)',
                      color: active ? 'var(--skin-title-color)' : 'var(--skin-text-secondary)',
                      font: 'var(--skin-hud-caps-weight) var(--skin-hud-caps-size) var(--skin-font-display)',
                      letterSpacing: 'var(--skin-hud-caps-tracking)',
                      textTransform: 'uppercase',
                      cursor: 'pointer',
                    }}
                  >
                    <EngravedIcon
                      id={id === 'all' ? 'ico-chest' : KIND_TAB_ICON[id] ?? 'ico-pouch'}
                      size={12}
                      aria-hidden
                    />
                    {id === 'all' ? t('gameFrame.stash.tabs.all') : t(`gameFrame.stash.tabs.${id}`)}
                  </button>
                );
              })}
            </div>
          )}

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
           *  plain list. The shelf is a tile grid (R-353 mockup); each
           *  listitem still carries the item's name/description as sr-only
           *  text. `data-hud-scroll` picks up the bronze themed scrollbar. */}
          <div
            role="list"
            data-testid="stash-shelf"
            data-stash-mode={interactive ? 'interactive' : 'readonly'}
            data-hud-scroll=""
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(52px, 1fr))',
              gap: 'var(--skin-hud-stack-gap)',
              alignContent: 'start',
              minHeight: 0,
              overflowY: 'auto',
              scrollbarGutter: 'stable',
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
                />
              ) : (
                <StashRowTooltip key={row.itemId} row={row}>
                  <div role="listitem" style={cellChrome(false)} onMouseEnter={() => setDetailItemId(row.itemId)}>
                    <StashCellFace row={row} />
                  </div>
                </StashRowTooltip>
              ),
            )}
          </div>

          {/* Item detail card (R-353 mockup): the hovered/focused cell's item
           *  in the shared tooltip vocabulary — name, effect, stat coverage,
           *  stock — with a Pack affordance when a planner is bound. */}
          {detailRow && (
            <div
              data-testid="stash-detail"
              aria-label={t('gameFrame.stash.detailLabel')}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 10,
                borderTop: '1px solid color-mix(in srgb, var(--skin-surface-border) 40%, transparent)',
                paddingTop: 'var(--skin-hud-stack-gap)',
              }}
            >
              <StashItemTile icon={detailRow.icon} qty={detailRow.qty} size={52} iconSize={28} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <StashItemTooltipBody
                  labelKey={detailRow.nameKey}
                  descKey={detailRow.descKey}
                  covers={stashItemCovers(detailRow.itemId)}
                  stockQty={detailRow.qty}
                />
              </div>
              {interactive && (
                <button
                  type="button"
                  data-testid="stash-pack-detail"
                  data-assign-state={assignStates[detailRow.itemId] ?? 'eligible'}
                  aria-label={t('gameFrame.stash.addToBag', { item: t(detailRow.nameKey) })}
                  onClick={() => pack(detailRow.itemId)}
                  style={{
                    flexShrink: 0,
                    alignSelf: 'center',
                    padding: '5px 14px',
                    borderRadius: 999,
                    border: '1px solid color-mix(in srgb, var(--skin-icon-accent) 60%, transparent)',
                    background: 'color-mix(in srgb, var(--skin-icon-accent) 16%, transparent)',
                    color: 'var(--skin-title-color)',
                    font: 'var(--skin-hud-caps-weight) var(--skin-hud-caps-size) var(--skin-font-display)',
                    letterSpacing: 'var(--skin-hud-caps-tracking)',
                    textTransform: 'uppercase',
                    cursor: 'pointer',
                  }}
                >
                  {t('gameFrame.stash.pack')}
                </button>
              )}
            </div>
          )}

          {/* Mode hint: how to unlock interactions, or why the shelf is frozen. */}
          {!interactive && (
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

          {/* Footer: the capacity label is a display-only count, derived from remaining stock. */}
          <div
            style={{
              borderTop: '1px solid color-mix(in srgb, var(--skin-surface-border) 40%, transparent)',
              paddingTop: 'var(--skin-hud-stack-gap)',
              /* R-353: the corner ornament's bottom tail grazes the frame edge —
               *  the caption starts clear of it. */
              paddingInlineStart: 26,
              font: 'var(--skin-hud-caps-weight) var(--skin-hud-caps-size) var(--skin-font-display)',
              letterSpacing: 'var(--skin-hud-caps-tracking)',
              textTransform: 'uppercase',
              color: 'var(--skin-label-primary)',
            }}
          >
            {t('gameFrame.stash.capacity', { count: vm.storedCount, max: vm.capacityMax })}
          </div>

          <span aria-live="polite" style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)', whiteSpace: 'nowrap' }}>
            {announcement}
          </span>
          {/* R-353 mockup frame: painted filigree corners + inner filet over
           *  the plaque edge — decoration only, same layer as the seat line. */}
          <PanelFrameOrnaments />
        </HudPlaque>
        </Tooltip.Provider>
      </SkinScope>
    </div>
  );
};

export default VillageStashPanel;
