import React, { useMemo, type CSSProperties } from 'react';
import { useTranslation } from 'react-i18next';
import { DragOverlay, useDndContext, useDraggable, useDroppable } from '@dnd-kit/core';
import { HudPlaque } from '@/ui/idleVillage/skins/primitives/HudPlaque';
import { SkinScope } from '@/ui/idleVillage/skins/primitives/SkinScope';
import { EngravedIcon } from './engravedIcons';
import { useHudPanelDrag } from './useHudPanelDrag';
import { villageStashViewModel, type VillageStashRowView } from './villageStashViewModel';
import { VillageStashItemIcon } from './villageStashItemIcons';
import { STASH_DROPZONE_ID, readStashDragPayload, stashItemDragId } from './stashDnd';
import {
  countReservations,
  reservedElsewhereCount,
  useVillageStashStore,
} from '@/ui/idleVillage/store/useVillageStashStore';
import { defaultQuestItems } from '@/balancing/config/idleVillage/quests/questItems';
import type { VillageStashConfig } from '@/balancing/config/idleVillage/villageStashConfig';

/**
 * VillageStashPanel — the village warehouse shelf (PLAN-032 SP-2, PLAN-073).
 *
 * Dual-mode by contract (Director ruling, artifact-r003):
 * - **Planner-bound** (`activeStashOwner` set): rows are real buttons and
 *   draggables — a click assigns the item to that planner's first free bag
 *   slot, a drag onto a bag slot assigns/swaps, and the whole shelf accepts
 *   bag items dragged back (release). Rows whose stock is fully reserved
 *   leave the shelf and return when released.
 * - **Read-only** (no bound planner): a plain `role="list"` — no buttons,
 *   no drag attributes, no mutation affordances. The shelf still shows real
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

const controlButton: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  minWidth: 24,
  minHeight: 24,
  padding: 0,
};

/** Shared row face — icon + name ×qty + description — used by both modes so the two surfaces never diverge. */
const StashRowFace: React.FC<{ row: VillageStashRowView }> = ({ row }) => {
  const { t } = useTranslation('idleVillage');
  return (
    <>
      <span aria-hidden="true" style={{ color: 'var(--skin-icon-accent)', display: 'inline-flex', alignItems: 'center', paddingTop: 1 }}>
        <VillageStashItemIcon icon={row.icon} size={18} />
      </span>
      <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2, textAlign: 'left' }}>
        <span style={{ font: '600 12px var(--skin-font-sans)', color: 'var(--skin-text-primary)' }}>
          {t(row.nameKey)}
          <span style={{ color: 'var(--skin-icon-accent)', fontVariantNumeric: 'tabular-nums' }} aria-label={t('gameFrame.stash.qty', { qty: row.qty })}>
            {' '}×{row.qty}
          </span>
        </span>
        <span style={{ font: '12px var(--skin-font-sans)', color: 'var(--skin-text-secondary)', whiteSpace: 'normal', overflowWrap: 'break-word' }}>
          {t(row.descKey)}
        </span>
      </span>
    </>
  );
};

const rowChrome = (interactive: boolean): CSSProperties => ({
  display: 'flex',
  alignItems: 'flex-start',
  gap: 'var(--skin-hud-inline-gap)',
  minWidth: 0,
  ...(interactive
    ? {
        width: '100%',
        padding: '4px 6px',
        margin: '-4px -6px',
        border: '1px solid color-mix(in srgb, var(--skin-surface-border) 35%, transparent)',
        borderRadius: 6,
        background: 'none',
        color: 'inherit',
        cursor: 'grab',
      }
    : {}),
});

/**
 * A planner-bound shelf row: click assigns to the first free bag slot and the
 * whole row is the `stash-item:*` draggable. After a successful assign the
 * focus lands on the filled bag slot — deterministic, never to body.
 */
const InteractiveStashRow: React.FC<{
  row: VillageStashRowView;
}> = ({ row }) => {
  const { t } = useTranslation('idleVillage');
  const owner = useVillageStashStore((s) => s.activeStashOwner);
  const assign = useVillageStashStore((s) => s.assign);
  const drag = useDraggable({ id: stashItemDragId(row.itemId), data: { kind: 'stash-item', itemId: row.itemId } });
  return (
    <div role="listitem">
      <button
        type="button"
        ref={drag.setNodeRef}
        {...drag.listeners}
        {...drag.attributes}
        data-testid={`stash-item-${row.itemId}`}
        aria-label={t('gameFrame.stash.addToBag', { item: t(row.nameKey) })}
        title={t(row.descKey)}
        onClick={() => {
          if (!owner) return;
          /* Rejects announce through the store's lastEvent live region — no local echo. */
          if (assign(owner, row.itemId) === 'ok') {
            window.requestAnimationFrame(() =>
              document.querySelector<HTMLElement>(`[data-testid="loadout-item-${row.itemId}"]`)?.focus(),
            );
          }
        }}
        style={{ ...rowChrome(true), opacity: drag.isDragging ? 0.35 : 1 }}
      >
        <StashRowFace row={row} />
      </button>
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

  const drop = useDroppable({ id: STASH_DROPZONE_ID, data: { kind: 'stash-dropzone' } });
  /* The overlay ghost mirrors the shelf row — portaled to body by DragOverlay
   * (T-16: a transform painted inside the panel would clip under siblings).
   * `useDndContext` degrades to defaults outside a provider, so the panel
   * stays testable standalone (unlike useDndMonitor, which throws). */
  const { active } = useDndContext();
  const activeDrag = readStashDragPayload(active?.data.current);
  const draggingItemId = activeDrag?.kind === 'stash-item' ? activeDrag.itemId : null;

  const reserved = useMemo(() => countReservations(bags, committed), [bags, committed]);
  const vm = useMemo(() => villageStashViewModel(config, reserved), [config, reserved]);
  const interactive = hydration === 'ready' && activeStashOwner !== null;
  const draggingRow = draggingItemId ? vm.rows.find((r) => r.itemId === draggingItemId) ?? null : null;
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
      <SkinScope data-hud-controls="">
        <HudPlaque
          shape="panel"
          as="section"
          aria-labelledby={titleId}
          style={{ display: 'flex', flexDirection: 'column', minHeight: 0, flex: '0 1 auto', padding: 'var(--skin-hud-panel-padding)', gap: 'var(--skin-hud-stack-gap)' }}
        >
          {/* Title row: building name left, X right. Drag handle. */}
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
            <button type="button" data-skin="close" aria-label={t('gameFrame.panels.close')} onClick={onClose} style={controlButton}>
              <EngravedIcon id="cmd-close" size={14} />
            </button>
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

          {/* Stock: planner-bound rows are buttons + draggables; read-only rows stay a plain list.
           *  The whole shelf is the dropzone bag items return to. */}
          <div
            ref={drop.setNodeRef}
            role="list"
            data-testid="stash-shelf"
            data-stash-mode={interactive ? 'interactive' : 'readonly'}
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--skin-hud-stack-gap)',
              minHeight: 0,
              overflowY: 'auto',
              outline: drop.isOver ? '1px dashed color-mix(in srgb, var(--skin-icon-accent) 60%, transparent)' : 'none',
              outlineOffset: 2,
            }}
          >
            {vm.rows.length === 0 && (
              <span style={{ font: '12px var(--skin-font-sans)', color: 'var(--skin-text-secondary)' }}>
                {t('gameFrame.stash.empty')}
              </span>
            )}
            {vm.rows.map((row) =>
              interactive ? (
                <InteractiveStashRow key={row.itemId} row={row} />
              ) : (
                <div key={row.itemId} role="listitem" style={rowChrome(false)}>
                  <StashRowFace row={row} />
                </div>
              ),
            )}
          </div>

          {/* Mode hint: how to unlock interactions, or why the shelf is frozen. */}
          {!interactive && (
            <span
              data-testid="stash-mode-hint"
              style={{ font: '12px var(--skin-font-sans)', color: 'var(--skin-text-secondary)' }}
            >
              {hydration !== 'ready' ? t('gameFrame.stash.notReady') : t('gameFrame.stash.openHint')}
            </span>
          )}

          {/* Footer: the capacity label is a display-only count, derived from remaining stock. */}
          <div
            style={{
              borderTop: '1px solid color-mix(in srgb, var(--skin-surface-border) 40%, transparent)',
              paddingTop: 'var(--skin-hud-stack-gap)',
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
        </HudPlaque>
      </SkinScope>
      <DragOverlay dropAnimation={null}>
        {draggingRow ? (
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '4px 8px',
              borderRadius: 6,
              border: '1px solid var(--skin-icon-accent)',
              background: 'color-mix(in srgb, var(--skin-hud-lacquer-deep) 88%, transparent)',
              color: 'var(--skin-title-color)',
              font: '600 12px var(--skin-font-sans)',
              pointerEvents: 'none',
            }}
          >
            <VillageStashItemIcon icon={draggingRow.icon} size={16} />
            {t(draggingRow.nameKey)}
          </div>
        ) : null}
      </DragOverlay>
    </div>
  );
};

export default VillageStashPanel;
