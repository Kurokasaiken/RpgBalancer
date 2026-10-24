import React, { useMemo, useRef, useState, type CSSProperties } from 'react';
import { useTranslation } from 'react-i18next';
import * as Tooltip from '@radix-ui/react-tooltip';
import { HudPlaque } from '@/ui/idleVillage/skins/primitives/HudPlaque';
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

const controlButton: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  minWidth: 24,
  minHeight: 24,
  padding: 0,
};

/**
 * Shared row face — `StashItemTile` (the planner's item-face: lacquer tile +
 * corner ×N badge) + name + description — used by both modes so the two
 * surfaces never diverge (R-270, village-stash-panel.INV-1).
 */
const StashRowFace: React.FC<{ row: VillageStashRowView }> = ({ row }) => {
  const { t } = useTranslation('idleVillage');
  return (
    <>
      <StashItemTile icon={row.icon} qty={row.qty} size={32} iconSize={18} />
      <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2, textAlign: 'left' }}>
        <span style={{ font: '600 12px var(--skin-font-serif)', color: 'var(--skin-text-primary)' }}>
          {t(row.nameKey)}
        </span>
        <span style={{ font: '12px var(--skin-font-serif)', color: 'var(--skin-text-secondary)', whiteSpace: 'normal', overflowWrap: 'break-word' }}>
          {t(row.descKey)}
        </span>
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
        cursor: 'pointer',
      }
    : {}),
});

/**
 * A planner-bound shelf row: a click assigns to the first free bag slot.
 * After a successful assign the focus lands on the filled bag slot —
 * deterministic, never to body.
 */
const InteractiveStashRow: React.FC<{
  row: VillageStashRowView;
}> = ({ row }) => {
  const { t } = useTranslation('idleVillage');
  const owner = useVillageStashStore((s) => s.activeStashOwner);
  const assign = useVillageStashStore((s) => s.assign);
  return (
    <div role="listitem">
      <StashRowTooltip row={row}>
        <button
          type="button"
          data-testid={`stash-item-${row.itemId}`}
          aria-label={t('gameFrame.stash.addToBag', { item: t(row.nameKey) })}
          onClick={() => {
            if (!owner) return;
            /* Rejects announce through the store's lastEvent live region — no local echo. */
            if (assign(owner, row.itemId) === 'ok') {
              window.requestAnimationFrame(() =>
                document.querySelector<HTMLElement>(`[data-testid="loadout-item-${row.itemId}"]`)?.focus(),
              );
            }
          }}
          style={rowChrome(true)}
        >
          <StashRowFace row={row} />
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
          <div {...handleProps} style={{ display: 'flex', alignItems: 'center', gap: 'var(--skin-hud-inline-gap)', paddingInline: '12px 8px', ...handleProps.style }}>
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

          {/* Global-pool counters: reservations held by other planners or frozen in a run. */}
          {elsewhere > 0 && (
            <span
              data-testid="stash-elsewhere"
              style={{ font: 'var(--skin-hud-caps-weight) var(--skin-hud-caps-size) var(--skin-font-display)', letterSpacing: 'var(--skin-hud-caps-tracking)', textTransform: 'uppercase', color: 'var(--skin-text-secondary)' }}
            >
              {t('gameFrame.stash.elsewhere', { count: elsewhere })}
            </span>
          )}

          {/* Stock: planner-bound rows are buttons; read-only rows stay a plain list.
           *  `data-hud-scroll` picks up the bronze themed scrollbar (skinScope.css). */}
          <div
            role="list"
            data-testid="stash-shelf"
            data-stash-mode={interactive ? 'interactive' : 'readonly'}
            data-hud-scroll=""
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--skin-hud-stack-gap)',
              minHeight: 0,
              overflowY: 'auto',
              scrollbarGutter: 'stable',
            }}
          >
            {vm.rows.length === 0 && (
              <span style={{ font: '12px var(--skin-font-serif)', color: 'var(--skin-text-secondary)' }}>
                {t('gameFrame.stash.empty')}
              </span>
            )}
            {vm.rows.map((row) =>
              interactive ? (
                <InteractiveStashRow key={row.itemId} row={row} />
              ) : (
                <StashRowTooltip key={row.itemId} row={row}>
                  <div role="listitem" style={rowChrome(false)}>
                    <StashRowFace row={row} />
                  </div>
                </StashRowTooltip>
              ),
            )}
          </div>

          {/* Mode hint: how to unlock interactions, or why the shelf is frozen. */}
          {!interactive && (
            <span
              data-testid="stash-mode-hint"
              style={{ font: '12px var(--skin-font-serif)', color: 'var(--skin-text-secondary)' }}
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
        </Tooltip.Provider>
      </SkinScope>
    </div>
  );
};

export default VillageStashPanel;
