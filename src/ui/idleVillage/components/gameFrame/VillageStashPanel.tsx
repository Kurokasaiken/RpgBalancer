import React, { useMemo, useState, type CSSProperties } from 'react';
import { useTranslation } from 'react-i18next';
import * as Tooltip from '@radix-ui/react-tooltip';
import { SkinScope } from '@/ui/idleVillage/skins/primitives/SkinScope';
import { useHudPanelDrag } from './useHudPanelDrag';
import { villageStashViewModel, type VillageStashRowView } from './villageStashViewModel';
import { stashItemBonus, stashItemCovers, StashQtyBadge, StashItemTooltipBody, STASH_TOOLTIP_STYLE } from './stashItemFace';
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
const STASH_BACKDROP_SRC = '/assets/ui/hud-real/stash-frame-clean.webp';
/* Backing-image pixel size; the panel keeps its aspect (1147/833 ≈ 1.377). */
const STASH_BACKDROP_W: number = 1147.0;
const STASH_BACKDROP_H: number = 833.0;

/* Painted wells (asset px, measured): interior centres x 144, 349, 550, 752,
 *  954 (pitch ≈ 202.5), rows y centres 280 & 428 (pitch 148); interior
 *  ≈ 102×93, rim outer ≈ 120×112. The DOM grid cells are sized to the rim
 *  outer box so overlays ride the painted rims exactly; the wells are fully
 *  painted in the asset — no CSS rim, no enamel cover (Director 2026-11-25:
 *  «c'è qualcosa che copre i componenti» — the CSS rim WAS the cover). */
const GRID_LEFT: number = 79.0 / STASH_BACKDROP_W;
const GRID_TOP: number = 220.0 / STASH_BACKDROP_H;
const GRID_WIDTH: number = 940.0 / STASH_BACKDROP_W;
const GRID_HEIGHT: number = 268.0 / STASH_BACKDROP_H;
/* cell 130px wide / pitch 202.5 → gap 72.5; rows: cell 120 / pitch 148 → 28.
 *  (container math: 5 cells of 130 + 4 gaps of 72.5 = 940; 2×120 + 28 = 268) */
const GRID_COLGAP_CQW: number = (72.5 / STASH_BACKDROP_W) * 100;
const GRID_ROWGAP_CQH: number = (28.0 / STASH_BACKDROP_H) * 100;

/* Kind filter rings (Director 2026-11-25): round socket buttons in the
 *  time-control/roster ring family seated on the plain recessed enamel
 *  strip (asset rows 125–205, centre 165). Ring Ø keeps the protruding
 *  socket proportion of the time controls. */
const RING_SRC = '/assets/ui/hud-real/C1/ring.webp';
/* Filter-ring glyphs — visual vocabulary of the kind filter, not gameplay
 *  data: `all` wears the stash pouch, each kind its engraved family glyph. */
const STASH_FILTER_RING_ICON: Record<string, EngravedIconId> = {
  all: 'ico-pouch',
  equipment: 'ico-swords',
  consumable: 'ico-vial',
};
const RING_STRIP_CX: number = 516.0 / STASH_BACKDROP_W;
const RING_PITCH: number = 0.1256;
const RING_CY_H: number = (165.0 / STASH_BACKDROP_H) * 100;
const RING_W: number = (99.0 / STASH_BACKDROP_W) * 100;
const RING_H: number = RING_W * (STASH_BACKDROP_W / STASH_BACKDROP_H);

/* Inspector card (asset px, measured): laurel medallion emerald seat centre
 *  (196, 642), interior r ≈ 95; detail text column right of x 400; Use/Pack
 *  lacquer button brass border x 832–1075, y 702–782. No painted chip pill
 *  in the clean frame — the chip renders as engraved caps on the enamel. */
const MEDAL_CX: number = 196.0 / STASH_BACKDROP_W;
const MEDAL_CY: number = 642.0 / STASH_BACKDROP_H;
const DETAIL_TEXT_LEFT: number = 400.0 / STASH_BACKDROP_W;
const CHIP_LEFT: number = 400.0 / STASH_BACKDROP_W;
const CHIP_TOP: number = 713.0 / STASH_BACKDROP_H;
const CHIP_W: number = 340.0 / STASH_BACKDROP_W;
const CHIP_H: number = 38.0 / STASH_BACKDROP_H;
const QTY_LEFT: number = 400.0 / STASH_BACKDROP_W;
const QTY_TOP: number = 752.0 / STASH_BACKDROP_H;
const USE_LEFT: number = 832.0 / STASH_BACKDROP_W;
const USE_TOP: number = 702.0 / STASH_BACKDROP_H;
const USE_W: number = 243.0 / STASH_BACKDROP_W;
const USE_H: number = 80.0 / STASH_BACKDROP_H;

/* D-6/R-367 piastrina (Director 2026-11-20): the ornate brass cornice is the
 *  cell's HOVER/SELECTED treatment — it rides ON the well as an overlay, the
 *  painted icon + ×N badge stay live DOM above it. At rest the shelf keeps
 *  its plain wells; the cornice marks the cell whose item the card previews
 *  (sticky preview = the mockup's selected cell). */
const PIASTRINA_CORNICE_SRC = '/assets/ui/hud-real/piastrina/cornice-hover-a.webp';
const PiastrinaCornice: React.FC<{ visible: boolean }> = ({ visible }) => (
  <img
    src={PIASTRINA_CORNICE_SRC}
    alt=""
    aria-hidden
    data-piastrina-cornice=""
    draggable={false}
    style={{
      position: 'absolute',
      inset: -3,
      width: 'calc(100% + 6px)',
      height: 'calc(100% + 6px)',
      objectFit: 'fill',
      opacity: visible ? 1 : 0,
      transition: 'opacity 140ms ease-out',
      pointerEvents: 'none',
    }}
  />
);

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
        background: 'none',
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
  onPreview: (itemId: string) => void;
  iconPx: number;
  highlighted: boolean;
}> = ({ row, assignState, onPreview, iconPx, highlighted }) => {
  const { t } = useTranslation('idleVillage');
  const pack = useStashPack();
  return (
    <div role="listitem" style={{ position: 'relative', width: '100%', height: '100%' }}>
      <PiastrinaCornice visible={highlighted} />
      <StashRowTooltip row={row}>
        <button
          type="button"
          data-testid={`stash-item-${row.itemId}`}
          data-assign-state={assignState}
          aria-label={t('gameFrame.stash.addToBag', { item: t(row.nameKey) })}
          onClick={() => pack(row.itemId)}
          onMouseEnter={() => onPreview(row.itemId)}
          onFocus={() => onPreview(row.itemId)}
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
  const [detailItemId, setDetailItemId] = useState<string | null>(null);
  const visibleRows = useMemo(
    () => (tab === 'all' ? vm.rows : vm.rows.filter((r) => defaultQuestItems[r.itemId]?.kind === tab)),
    [tab, vm.rows],
  );
  const detailRow = visibleRows.find((r) => r.itemId === detailItemId) ?? visibleRows[0] ?? null;
  const pack = useStashPack();
  const boundBag = activeStashOwner ? bags[activeStashOwner] : undefined;
  const assignStates = useMemo(() => {
    if (!interactive) return {};
    const states: Record<string, BagAssignEligibility> = {};
    const capacity = activeStashOwner ? (questPoiById(activeStashOwner)?.bagSlots ?? QUEST_STASH.bagSlots) : QUEST_STASH.bagSlots;
    for (const row of vm.rows) states[row.itemId] = bagAssignEligibility(boundBag, row.itemId, capacity);
    return states;
  }, [interactive, boundBag, vm.rows]);
  const bagFullHint = interactive && Object.values(assignStates).some((s) => s === 'bagFull');
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
        <section
          aria-labelledby={titleId}
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
          {/* «N / M» stock counter before the painted X */}
          <span
            data-testid="stash-capacity"
            style={{
              ...P(60.0, 3.6, 27.0, 10.5),
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              font: `italic 4.0cqw var(--skin-font-serif)`,
              color: 'var(--skin-title-color)',
              textShadow: '0 1px 2px rgba(0,0,0,0.8)',
            }}
          >
            {t('gameFrame.stash.capacityShort', { count: vm.storedCount, max: vm.capacityMax })}
          </span>
          {/* Close: transparent hit-ring over the painted X button */}
          <button
            type="button"
            data-panel-close=""
            aria-label={t('gameFrame.panels.close')}
            title={t('gameFrame.panels.close')}
            onClick={onClose}
            style={{ ...P(89.4, 1.0, 7.8, 10.8), background: 'none', border: 0, borderRadius: '50%', cursor: 'pointer' }}
          />

          {/* Kind filter rings — round sockets in the time-component family
           *  (Director 2026-11-25), centred as a group on the flattened strip.
           *  Same contract as the pills: radiogroup of stash-tab-{kind}. */}
          <span
            role="radiogroup"
            aria-label={t('gameFrame.stash.filterLabel')}
            data-testid="stash-tabs"
          >
            {tabs.map((id, i) => {
              const active = tab === id;
              const cxFrac = (RING_STRIP_CX + (i - (tabs.length - 1) / 2) * RING_PITCH) * 100;
              const label = id === 'all' ? t('gameFrame.stash.tabs.all') : t(`gameFrame.stash.tabs.${id}`);
              return (
                <button
                  key={id}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  aria-label={label}
                  title={label}
                  data-testid={`stash-tab-${id}`}
                  onClick={() => setTab(id)}
                  style={{
                    ...P(cxFrac - RING_W / 2, RING_CY_H - RING_H / 2, RING_W, RING_H),
                    border: 0,
                    borderRadius: '50%',
                    background: 'radial-gradient(circle at 50% 42%, color-mix(in srgb, var(--skin-hud-enamel-base) 88%, black) 0%, color-mix(in srgb, var(--skin-hud-lacquer-deep) 92%, black) 68%, black 100%)',
                    boxShadow: active
                      ? '0 0 0 2px var(--skin-title-color), 0 0 10px 2px color-mix(in srgb, var(--skin-hud-brass-hi) 55%, transparent), inset 0 2px 5px rgba(0,0,0,0.65)'
                      : 'inset 0 2px 5px rgba(0,0,0,0.65)',
                    color: active ? 'var(--skin-title-color)' : 'color-mix(in srgb, var(--skin-hud-brass-hi) 70%, var(--skin-text-secondary))',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: 0,
                  }}
                >
                  {/* glyph seated inside the ring hole — the hole is ≈ 60% of
                   *  the ring art, the glyph ≈ 2/3 of that */}
                  <span style={{ display: 'inline-flex', width: '40%', height: '40%' }}>
                    <EngravedIcon id={STASH_FILTER_RING_ICON[id] ?? 'ico-dot'} size="100%" />
                  </span>
                  <img
                    src={RING_SRC}
                    alt=""
                    aria-hidden
                    draggable={false}
                    style={{ position: 'absolute', inset: '-7%', width: '114%', height: '114%', objectFit: 'fill', pointerEvents: 'none' }}
                  />
                  <span style={srOnlyText}>{label}</span>
                </button>
              );
            })}
          </span>

          {/* Shelf — the painted 5×2 cell block; cells scroll when more than
           *  ten wells of stock exist (painted scrollbar is decorative). */}
          <div
            role="list"
            data-testid="stash-shelf"
            data-stash-mode={interactive ? 'interactive' : 'readonly'}
            data-stash-view="grid"
            style={{
              ...P(GRID_LEFT * 100, GRID_TOP * 100, GRID_WIDTH * 100, GRID_HEIGHT * 100),
              display: 'grid',
              gridTemplateColumns: 'repeat(5, 1fr)',
              gridAutoRows: '1fr',
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
                  onPreview={setDetailItemId}
                  iconPx={cellIconPx}
                  highlighted={detailRow?.itemId === row.itemId}
                />
              ) : (
                <StashRowTooltip key={row.itemId} row={row}>
                  <div role="listitem" style={{ position: 'relative', width: '100%', height: '100%' }} onMouseEnter={() => setDetailItemId(row.itemId)}>
                    <PiastrinaCornice visible={detailRow?.itemId === row.itemId} />
                    <div style={faceChrome(false)}>
                      <StashCellFace row={row} iconPx={cellIconPx} />
                    </div>
                  </div>
                </StashRowTooltip>
              ),
            )}
          </div>

          {/* Inspector card — texts at the painted card's positions; the
           *  laurel medallion and card fillet are in the backdrop. */}
          {detailRow && (() => {
            const bonus = stashItemBonus(detailRow.itemId);
            const covers = stashItemCovers(detailRow.itemId);
            return (
            <div data-testid="stash-detail" aria-label={t('gameFrame.stash.detailLabel')}>
              {/* Item icon inside the painted laurel medallion — the plain
               *  painted cut-out fills the ring like the mockup (Director
               *  2026-11-25: no baked disc behind it, just the normal icon
               *  on the medallion's dark enamel seat). Interior r ≈ 95
               *  backing px → seat Ø ≈ 25% of panel width, icon ≈ 70%. */}
              <span
                style={{
                  ...P(MEDAL_CX * 100 - 8.3, MEDAL_CY * 100 - 11.45, 16.6, 22.9),
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--skin-title-color)',
                }}
              >
                <VillageStashItemIcon icon={detailRow.icon} size={Math.round(w * 0.14)} />
              </span>
              <div style={{ ...P(DETAIL_TEXT_LEFT * 100, 62.3, 38.0, 8.0), font: `600 3.9cqw var(--skin-font-display)`, letterSpacing: '0.03em', color: 'var(--skin-title-color)', textShadow: '0 1px 2px rgba(0,0,0,0.8)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {t(detailRow.nameKey)}
              </div>
              {bonus ? (
                <div style={{ ...P(DETAIL_TEXT_LEFT * 100, 68.6, 38.0, 5.5), font: `italic 3.0cqw var(--skin-font-serif)`, color: 'color-mix(in srgb, var(--skin-icon-accent) 85%, var(--skin-title-color))', textShadow: '0 1px 2px rgba(0,0,0,0.8)' }}>
                  +{bonus.bonus} {bonus.stats.map((s) => t(`questExpedition.statName.${s}`)).join(' · ')}
                </div>
              ) : covers.length > 0 ? (
                <div style={{ ...P(DETAIL_TEXT_LEFT * 100, 68.6, 38.0, 5.5), font: `italic 3.0cqw var(--skin-font-serif)`, color: 'var(--skin-icon-accent)' }}>
                  {t('questExpedition.bag.covers')} {covers.join(' · ')}
                </div>
              ) : null}
              <div style={{ ...P(DETAIL_TEXT_LEFT * 100, 74.0, 38.0, 10.0), font: `italic 2.4cqw var(--skin-font-serif)`, lineHeight: 1.25, color: 'color-mix(in srgb, var(--skin-text-primary) 90%, white)', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                {t(detailRow.descKey)}
              </div>
              {/* painted «Usable in Expeditions» chip label */}
              <span
                style={{
                  ...P(CHIP_LEFT * 100, CHIP_TOP * 100, CHIP_W * 100, CHIP_H * 100),
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  font: `600 1.75cqw var(--skin-font-display)`,
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  color: 'color-mix(in srgb, var(--skin-icon-accent) 80%, white)',
                  textShadow: '0 1px 1px rgba(0,0,0,0.9)',
                }}
              >
                {t('gameFrame.stash.usableInExpeditions')}
              </span>
              {/* painted «Quantity: N» line */}
              <span style={{ ...P(QTY_LEFT * 100, QTY_TOP * 100, 22.0, 7.0), display: 'flex', alignItems: 'center', font: `italic 3.0cqw var(--skin-font-serif)`, color: 'var(--skin-title-color)', textShadow: '0 1px 2px rgba(0,0,0,0.8)' }}>
                {t('gameFrame.stash.qty', { qty: detailRow.qty })}
              </span>
              {/* Use button — painted green button in the backdrop; the hit
               *  area mounts only when a bag is actually bound (Pack). */}
              {interactive && (
                <button
                  type="button"
                  data-testid="stash-pack-detail"
                  data-assign-state={assignStates[detailRow.itemId] ?? 'eligible'}
                  aria-label={t('gameFrame.stash.addToBag', { item: t(detailRow.nameKey) })}
                  onClick={() => pack(detailRow.itemId)}
                  style={{
                    ...P(USE_LEFT * 100, USE_TOP * 100, USE_W * 100, USE_H * 100),
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'none',
                    border: 0,
                    font: `600 3.6cqw var(--skin-font-display)`,
                    letterSpacing: '0.03em',
                    color: 'color-mix(in srgb, var(--skin-title-color) 92%, white)',
                    textShadow: '0 1px 2px rgba(0,0,0,0.9), 0 0 6px color-mix(in srgb, var(--skin-icon-accent) 50%, transparent)',
                    cursor: 'pointer',
                  }}
                >
                  {t('gameFrame.stash.pack')}
                </button>
              )}
            </div>
            );
          })()}

          {/* Mode hints land in the card's text zone (painted zone, DOM text) */}
          {!interactive && (
            <span data-testid="stash-mode-hint" style={{ ...P(69.0, 62.5, 26.0, 18.0), display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', font: `italic 1.8cqw var(--skin-font-serif)`, color: 'var(--skin-text-secondary)', overflow: 'hidden' }}>
              {hydration !== 'ready' ? t('gameFrame.stash.notReady') : t('gameFrame.stash.openHint')}
            </span>
          )}
          {interactive && bagFullHint && (
            <span data-testid="stash-bag-full-hint" style={{ ...P(69.0, 62.5, 26.0, 10.0), display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', font: `italic 1.8cqw var(--skin-font-serif)`, color: 'var(--skin-text-secondary)' }}>
              {t('gameFrame.stash.bagFullHint')}
            </span>
          )}
          {elsewhere > 0 && (
            <span data-testid="stash-elsewhere" style={{ ...P(69.0, 72.5, 26.0, 6.0), display: 'flex', alignItems: 'center', justifyContent: 'center', font: `1.6cqw var(--skin-font-display)`, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--skin-text-secondary)' }}>
              {t('gameFrame.stash.elsewhere', { count: elsewhere })}
            </span>
          )}

          <span aria-live="polite" style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)', whiteSpace: 'nowrap' }}>
            {announcement}
          </span>
        </section>
        </Tooltip.Provider>
      </SkinScope>
    </div>
  );
};

export default VillageStashPanel;
