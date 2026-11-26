import React, { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { useTranslation } from 'react-i18next';
import * as Tooltip from '@radix-ui/react-tooltip';
import { SkinScope } from '@/ui/idleVillage/skins/primitives/SkinScope';
import { useHudPanelDrag } from './useHudPanelDrag';
import { villageStashViewModel, type VillageStashRowView } from './villageStashViewModel';
import { stashItemCovers, StashQtyBadge, StashItemTooltipBody, STASH_TOOLTIP_STYLE } from './stashItemFace';
import { VillageStashItemIcon } from './villageStashItemIcons';
import { EngravedIcon, type EngravedIconId } from './engravedIcons';
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

/* R-367/PLAN-125 1:1 mockup rebuild — 2026-11-25 clean-frame regeneration
 *  (Director: «devi farti rigenerare le cose in modo pulito da gemini»):
 *  the backing is NOT the erase-patched mockup extraction anymore — it is a
 *  clean Gemini regeneration of the signed frame with ALL live content
 *  removed (no painted text, no painted items, empty medallion seat, empty
 *  lacquer button), flood-fill alpha-cut from navy #0a1622 per
 *  MOCKUP-TO-ASSET-GATE 3 («se l'inpaint lascia giunte/ghost, rigenerare il
 *  frame vuoto invece di accumulare toppe»). Zone geometry measured on the
 *  asset with grid overlay (scripts/hud-real/build-stash-frame-clean.py). */
const STASH_BACKDROP_SRC = '/assets/ui/hud-real/stash-frame-no-grid.webp';
/* Backing-image pixel size; the panel keeps its aspect (1147/833 ≈ 1.377). */
const STASH_BACKDROP_W: number = 1146.0;
const STASH_BACKDROP_H: number = 831.0;

/* Painted wells (asset px, measured): interior centres x 144, 349, 550, 752,
 *  954 (pitch ≈ 202.5), rows y centres 280 & 428 (pitch 148); interior
 *  ≈ 102×93, rim outer ≈ 120×112. The DOM grid cells are sized to the rim
 *  outer box so overlays ride the painted rims exactly; the wells are fully
 *  painted in the asset — no CSS rim, no enamel cover (Director 2026-11-25:
 *  «c'è qualcosa che copre i componenti» — the CSS rim WAS the cover). */
const GRID_LEFT: number = 74.0 / STASH_BACKDROP_W;
const GRID_TOP: number = 209.0 / STASH_BACKDROP_H;
const GRID_WIDTH: number = 949.0 / STASH_BACKDROP_W;
const GRID_HEIGHT: number = 427.0 / STASH_BACKDROP_H;
/* cell 130px wide / pitch 202.5 → gap 72.5; rows: cell 120 / pitch 148 → 28.
 *  (container math: 5 cells of 130 + 4 gaps of 72.5 = 940; 2×120 + 28 = 268) */
const GRID_COLGAP_CQW: number = (63.5 / STASH_BACKDROP_W) * 100;
const GRID_ROWGAP_CQH: number = (17.5 / STASH_BACKDROP_H) * 100;
/* Row height is explicit (asset px 122 of 831), not 1fr: the wells are CSS now, so the alcove can sit
 *  lower in the frame, clear of the filters (Director 2026-11-26). */
const SQUARE_SOCKET_SRC = '/assets/ui/hud-real/controls/square-socket-normal.webp';

/* Three rows of five, as the frame shows at rest. */
const ALCOVE_MIN_SLOTS = 15;
/* Scrollbar track in the right gutter (asset px). Drawn in the DOM, not in the backing. */
const SCROLL_TRACK_X: number = 1018.0;
const SCROLL_TRACK_Y: number = 225.0;
const SCROLL_TRACK_W: number = 22.0;
const SCROLL_TRACK_H: number = 445.0;
const GRID_ROW_CQH: number = (130.5 / STASH_BACKDROP_H) * 100;

/* Kind filter rings (Director 2026-11-25): round socket buttons in the
 *  time-control/roster ring family seated on the plain recessed enamel
 *  strip (asset rows 125–205, centre 165). Ring Ø keeps the protruding
 *  socket proportion of the time controls. */
/* Filter-ring glyphs — visual vocabulary of the kind filter, not gameplay
 *  data: `all` wears the stash pouch, each kind its engraved family glyph. */
const STASH_FILTER_RING_ICON: Record<string, EngravedIconId> = {
  all: 'ico-pouch',
  equipment: 'ico-swords',
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
      {/* 1:1 mockup: the painted item icon fills most of the well, sitting
       *  directly on the dark lacquer; the ×N badge pins bottom-right. */}
      <span
        aria-hidden
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          width: iconPx,
          height: iconPx,
          color: 'var(--skin-title-color)',
        }}
      >
        <VillageStashItemIcon icon={row.icon} size={iconPx} />
      </span>
      {row.qty != null && (
        /* cell box = painted rim outer; the badge pins inside the stone
         *  interior (≈ 9% inset), not on the brass rim (clean-frame port) */
        <span aria-hidden style={{ position: 'absolute', inset: '9%', pointerEvents: 'none' }}>
          <StashQtyBadge qty={row.qty} />
        </span>
      )}
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

/* R-339/PLAN-119 T3-S2 (artifact-r004 D7): the bound shelf marks each row's
 * assign eligibility BEFORE the click — `data-assign-state` mirrors the
 * ledger's own reject reasons (`eligible` | `packed` | `bagFull`). */
const faceChrome = (interactive: boolean, assignState?: BagAssignEligibility): CSSProperties => ({
  ...alcoveSocketStyle,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  position: 'relative',
  minWidth: 0,
  /* Both modes fill the whole well — the read-only face used to size to the
   *  icon alone, leaving cells off-centre inside the painted rims. */
  width: '100%',
  height: '100%',
  ...(interactive
    ? {
        padding: 0,
        border: 0,
        color: 'inherit',
        cursor: 'pointer',
        ...(assignState === 'eligible'
          ? { background: 'color-mix(in srgb, var(--skin-icon-accent) 10%, transparent)' }
          : {}),
        ...(assignState === 'packed' || assignState === 'bagFull' ? { opacity: 0.55 } : {}),
      }
    : {}),
});

/**
 * A planner-bound shelf cell: a click assigns to the first free bag slot;
 * hover/focus previews the item in the detail card (R-353).
 */
const InteractiveStashCell: React.FC<{
  row: VillageStashRowView;
  assignState: BagAssignEligibility;
  iconPx: number;
}> = ({ row, assignState, iconPx }) => {
  const { t } = useTranslation('idleVillage');
  const pack = useStashPack();
  return (
    <div role="listitem" style={{ position: 'relative', width: '100%', height: '100%' }}>
      <StashRowTooltip row={row}>
        <button
          type="button"
          data-testid={`stash-item-${row.itemId}`}
          data-assign-state={assignState}
          data-alcove="square"
          className="stash-alcove-face"
          aria-label={t('gameFrame.stash.addToBag', { item: t(row.nameKey) })}
          onClick={() => pack(row.itemId)}
          style={faceChrome(true, assignState)}
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

/* Percentage-position helper — every DOM overlay hangs off the painted
 *  backdrop's own pixel grid so the render stays 1:1 with the mockup. */
const P = (x: number, y: number, w: number, h: number): CSSProperties => ({
  position: 'absolute',
  left: `${x}%`,
  top: `${y}%`,
  width: `${w}%`,
  height: `${h}%`,
});

const alcoveSocketStyle: CSSProperties = {
  backgroundImage: `url(${SQUARE_SOCKET_SRC})`,
  backgroundRepeat: 'no-repeat',
  backgroundPosition: 'center',
  backgroundSize: '100% 100%',
};

export const VillageStashPanel: React.FC<VillageStashPanelProps> = ({ config, left, top, widthPx, maxHeightPx, zIndex, onClose }) => {
  const { t } = useTranslation('idleVillage');
  const { panelStyle, handleProps } = useHudPanelDrag();
  const hydration = useVillageStashStore((s) => s.hydration);
  const bags = useVillageStashStore((s) => s.bags);
  const committed = useVillageStashStore((s) => s.committed);
  const elsewhere = useVillageStashStore((s) => reservedElsewhereCount(s, s.activeStashOwner));
  const activeStashOwner = useVillageStashStore((s) => s.activeStashOwner);
  const lastEvent = useVillageStashStore((s) => s.lastEvent);

  const reserved = useMemo(() => countReservations(bags, committed), [bags, committed]);
  const vm = useMemo(() => villageStashViewModel(config, reserved), [config, reserved]);
  const interactive = hydration === 'ready' && activeStashOwner !== null;
  /* Kind tabs (config-first): pill strip over the painted tab row — only the
   *  kinds the shelf can actually stock. */
  const kinds = useMemo(() => {
    const seen = new Set<string>();
    for (const it of config.items) {
      const k = defaultQuestItems[it.itemId]?.kind;
      if (k) seen.add(k);
    }
    return [...seen];
  }, [config.items]);
  const [tab, setTab] = useState<string>('all');
  /* Scroll thumb state: the shelf scrolls inside; the DOM bar shows only when the rows overflow. */
  const [scrollTop, setScrollTop] = useState(0);
  const [shelfEl, setShelfEl] = useState<HTMLDivElement | null>(null);
  const [trackEl, setTrackEl] = useState<HTMLDivElement | null>(null);
  const [scrollMetrics, setScrollMetrics] = useState({ scrollHeight: 0, clientHeight: 0 });
  const visibleRows = useMemo(
    () => (tab === 'all' ? vm.rows : vm.rows.filter((r) => defaultQuestItems[r.itemId]?.kind === tab)),
    [tab, vm.rows],
  );
  const visibleCapacity = ALCOVE_MIN_SLOTS;
  const needsScroll = visibleRows.length > visibleCapacity;
  useEffect(() => {
    if (!shelfEl) return;
    const measure = () => setScrollMetrics({ scrollHeight: shelfEl.scrollHeight, clientHeight: shelfEl.clientHeight });
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(shelfEl);
    return () => observer.disconnect();
  }, [shelfEl, visibleRows.length, tab]);
  const boundBag = activeStashOwner ? bags[activeStashOwner] : undefined;
  const assignStates = useMemo(() => {
    if (!interactive) return {};
    const states: Record<string, BagAssignEligibility> = {};
    const capacity = activeStashOwner ? (questPoiById(activeStashOwner)?.bagSlots ?? QUEST_STASH.bagSlots) : QUEST_STASH.bagSlots;
    for (const row of vm.rows) states[row.itemId] = bagAssignEligibility(boundBag, row.itemId, capacity);
    return states;
  }, [interactive, boundBag, vm.rows]);
  const bagFullHint = interactive && Object.values(assignStates).some((state) => state === 'bagFull');
  const announcement = lastEvent && lastEvent.poiId === undefined ? stashAnnouncement(t, lastEvent) : null;

  /* 1:1 geometry: the panel is the backing image itself — width sets the
   *  scale, height follows the 752:702 aspect; a shorter zone shrinks width
   *  to keep the proportions rather than clipping the painted frame. */
  let w = widthPx;
  let h = (w * STASH_BACKDROP_H) / STASH_BACKDROP_W;
  if (maxHeightPx && h > maxHeightPx) {
    h = maxHeightPx;
    w = (h * STASH_BACKDROP_W) / STASH_BACKDROP_H;
  }
  const tabs: string[] = ['all', ...kinds];
  /* Painted icons fill ≈ 80% of the 102px well interior (asset px) —
   *  in panel px that's ≈ 0.071·w. */
  const cellIconPx = Math.max(8, Math.round(w * 0.078));
  const fillerCount = visibleRows.length === 0
    ? visibleCapacity
    : visibleRows.length < visibleCapacity
      ? visibleCapacity - visibleRows.length
      : (5 - (visibleRows.length % 5)) % 5;
  const scrollOverflow = needsScroll && scrollMetrics.scrollHeight > scrollMetrics.clientHeight + 1;
  const thumbHeightPct = scrollOverflow ? Math.max(18, Math.min(100, (scrollMetrics.clientHeight / scrollMetrics.scrollHeight) * 100)) : 100;
  const scrollRange = Math.max(1, scrollMetrics.scrollHeight - scrollMetrics.clientHeight);
  const thumbTopPct = scrollOverflow ? (scrollTop / scrollRange) * (100 - thumbHeightPct) : 0;
  const scrollTrackTo = (clientY: number) => {
    if (!shelfEl || !trackEl || !scrollOverflow) return;
    const rect = trackEl.getBoundingClientRect();
    const thumbPx = (thumbHeightPct / 100) * rect.height;
    const ratio = (clientY - rect.top - thumbPx / 2) / Math.max(1, rect.height - thumbPx);
    shelfEl.scrollTop = Math.max(0, Math.min(1, ratio)) * scrollRange;
  };

  return (
    <div
      data-hud-panel="villageStash"
      tabIndex={-1}
      style={{
        position: 'fixed',
        left,
        top,
        width: w,
        height: h,
        zIndex: panelStyle.zIndex ?? zIndex,
        pointerEvents: 'auto',
        outline: 'none',
        ...panelStyle,
      }}
    >
      <SkinScope data-hud-controls="" style={{ position: 'relative', width: '100%', height: '100%' }}>
        <Tooltip.Provider delayDuration={120}>
        <section data-hud-controls="" aria-labelledby={titleId}
          style={{ position: 'relative', width: '100%', height: '100%', containerType: 'size', overflow: 'hidden' }}
        >
          <img src={STASH_BACKDROP_SRC} alt="" aria-hidden draggable={false} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }} />

          {/* Title — the erased «VILLAGE STASH» band, Cinzel like the mockup */}
          <div
            {...handleProps}
            style={{
              ...P(20.5, 3.6, 40.0, 10.5),
              display: 'flex',
              alignItems: 'center',
              ...handleProps.style,
            }}
          >
            <span
              id={titleId}
              style={{
                font: `700 4.1cqw var(--skin-font-display)`,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                color: 'var(--skin-title-color)',
                textShadow: '0 1px 2px rgba(0,0,0,0.8)',
                whiteSpace: 'nowrap',
              }}
            >
              {t('gameFrame.stash.title')}
            </span>
          </div>
          {/* Close — the same round control as the kind filters (data-ctl=round), so the two read as one family. */}
          <button
            type="button"
            data-ctl="round"
            data-panel-close=""
            aria-label={t('gameFrame.panels.close')}
            title={t('gameFrame.panels.close')}
            onClick={onClose}
            style={{
              position: 'absolute',
              left: `calc(${(1054 / STASH_BACKDROP_W) * 100}% - 21px)`,
              top: `calc(${(74 / STASH_BACKDROP_H) * 100}% - 21px)`,
              ['--round-size' as string]: '42px',
            }}
          >
            <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true" style={{ width: 24, height: 24 }}>
              <path d="M5.5 5.5 L18.5 18.5 M18.5 5.5 L5.5 18.5" stroke="currentColor" strokeWidth="3.1" strokeLinecap="round" fill="none" />
            </svg>
          </button>

          {/* Kind filters — same round socket family, seated in the title row
           *  immediately left of the close control (R-391). */}
          <div
            role="group"
            aria-label={t('gameFrame.stash.filterLabel')}
            data-testid="stash-filters"
            style={{
              position: 'absolute',
              right: `calc(${100 - (1054 / STASH_BACKDROP_W) * 100}% + 32px)`,
              top: `calc(${(74 / STASH_BACKDROP_H) * 100}% - 15px)`,
              display: 'flex',
              justifyContent: 'flex-end',
              gap: 8,
            }}
          >
            {tabs.map((id) => {
              const active = tab === id;
              const label = id === 'all' ? t('gameFrame.stash.tabs.all') : t(`gameFrame.stash.tabs.${id}`);
              return (
                <button
                  key={id}
                  type="button"
                  data-ctl="round"
                  data-testid={`stash-filter-${id}`}
                  aria-pressed={active}
                  data-state={active ? 'selected' : undefined}
                  aria-label={label}
                  title={label}
                  onClick={() => setTab(id)}
                >
                  <EngravedIcon id={STASH_FILTER_RING_ICON[id] ?? 'ico-dot'} className="h-3 w-3 shrink-0" />
                </button>
              );
            })}
          </div>

          {/* Shelf — the painted 5×2 cell block; cells scroll when more than
           *  ten wells of stock exist (painted scrollbar is decorative). */}
          <div
            ref={setShelfEl}
            onScroll={(e) => setScrollTop(e.currentTarget.scrollTop)}
            role="list"
            data-testid="stash-shelf"
            data-stash-mode={interactive ? 'interactive' : 'readonly'}
            data-stash-view="grid"
            style={{
              ...P(GRID_LEFT * 100, GRID_TOP * 100, GRID_WIDTH * 100, GRID_HEIGHT * 100),
              display: 'grid',
              gridTemplateColumns: 'repeat(5, 1fr)',
              gridAutoRows: `${GRID_ROW_CQH}cqh`,
              columnGap: `${GRID_COLGAP_CQW}cqw`,
              rowGap: `${GRID_ROWGAP_CQH}cqh`,
              overflowY: 'auto',
              overflowX: 'hidden',
              scrollbarWidth: 'none',
            }}
          >
            {vm.rows.length === 0 && (
              <span style={{ gridColumn: '1 / -1', font: '2cqw var(--skin-font-serif)', color: 'var(--skin-text-secondary)' }}>
                {t('gameFrame.stash.empty')}
              </span>
            )}
            {vm.rows.length > 0 && visibleRows.length === 0 && (
              <span style={{ gridColumn: '1 / -1', font: '2cqw var(--skin-font-serif)', color: 'var(--skin-text-secondary)' }}>
                {t('gameFrame.stash.filterEmpty')}
              </span>
            )}
            {visibleRows.map((row) =>
              interactive ? (
                <InteractiveStashCell
                  key={row.itemId}
                  row={row}
                  assignState={assignStates[row.itemId] ?? 'eligible'}
                  iconPx={cellIconPx}
                />
              ) : (
                <StashRowTooltip key={row.itemId} row={row}>
                  <div role="listitem" style={{ position: 'relative', width: '100%', height: '100%' }}>
                    <div data-alcove="square" className="stash-alcove-face" style={faceChrome(false)}>
                      <StashCellFace row={row} iconPx={cellIconPx} />
                    </div>
                  </div>
                </StashRowTooltip>
              ),
            )}
            {Array.from({ length: fillerCount }, (_, i) => (
              <div
                key={`empty-alcove-${i}`}
                aria-hidden="true"
                data-testid="stash-empty-alcove"
                data-alcove="square"
                className="stash-alcove-face"
                style={{ ...alcoveSocketStyle, width: '100%', height: '100%' }}
              />
            ))}
          </div>

          {scrollOverflow && (
            <div
              ref={setTrackEl}
              data-testid="stash-scroll-track"
              aria-hidden="true"
              onPointerDown={(e) => {
                e.currentTarget.setPointerCapture(e.pointerId);
                scrollTrackTo(e.clientY);
              }}
              onPointerMove={(e) => {
                if (e.buttons === 1) scrollTrackTo(e.clientY);
              }}
              style={{
                ...P((SCROLL_TRACK_X / STASH_BACKDROP_W) * 100, (SCROLL_TRACK_Y / STASH_BACKDROP_H) * 100, (SCROLL_TRACK_W / STASH_BACKDROP_W) * 100, (SCROLL_TRACK_H / STASH_BACKDROP_H) * 100),
                borderRadius: 999,
                border: '1px solid rgba(184, 147, 63, 0.72)',
                background: 'linear-gradient(180deg, rgba(5, 24, 20, 0.92), rgba(9, 44, 33, 0.9))',
                boxShadow: 'inset 0 1px 5px rgba(0,0,0,0.75)',
                cursor: 'pointer',
              }}
            >
              <div
                data-testid="stash-scroll-thumb"
                style={{
                  position: 'absolute',
                  left: '18%',
                  width: '64%',
                  top: `${thumbTopPct}%`,
                  height: `${thumbHeightPct}%`,
                  borderRadius: 999,
                  background: 'linear-gradient(180deg, #9ed7af, #2f7754 45%, #173f30)',
                  boxShadow: '0 0 5px rgba(98, 210, 151, 0.55), inset 0 1px 2px rgba(255,255,255,0.28)',
                }}
              />
            </div>
          )}



          {bagFullHint && (
            <span data-testid="stash-bag-full-hint" style={srOnlyText}>
              {t('gameFrame.stash.bagFullHint')}
            </span>
          )}
          {elsewhere > 0 && (
            <span data-testid="stash-elsewhere" style={srOnlyText}>
              {t('gameFrame.stash.elsewhere', { count: elsewhere })}
            </span>
          )}
          <span aria-live="polite" style={srOnlyText}>
            {announcement}
          </span>
        </section>
        </Tooltip.Provider>
      </SkinScope>
    </div>
  );
};

export default VillageStashPanel;
