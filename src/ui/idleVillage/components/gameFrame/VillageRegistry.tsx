import React, {
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type Ref,
} from 'react';
import { useTranslation } from 'react-i18next';
import { HudPlaque } from '@/ui/idleVillage/skins/primitives/HudPlaque';
import { EngravedIcon } from './engravedIcons';
import {
  VillageBuildingIcon,
  VillageCostIcon,
  VillagePinFrame,
  PIN_FRAME_FOR_CATEGORY,
  type VillageCostResource,
} from './villageBuildingIcons';
import { MockUpgradeControl } from './MockUpgradeControl';
import {
  BUILDING_CATEGORIES,
  hasFootprint,
  toRomanLevel,
  VILLAGE_REGISTRY,
  type VillageBuildingCatalogId,
  type VillageBuildingDefinition,
  type VillageBuildingState,
} from '@/balancing/config/idleVillage/villageBuildingsConfig';
import villageArt from '@/assets/mood/villaggio.png';

/**
 * `VillageRegistry` — the Settlement Registry drawer (PLAN-042, multi-AI
 * debate artifact r005, R-206).
 *
 * A right-edge slide-over `HudPlaque` listing the FULL building catalog —
 * painted pins and registry-only specials share one visual grammar (category
 * frame + state badge), so the drawer teaches the player how to read the
 * painting. Clicking a painted row pins its stage tooltip; clicking a
 * registry-only row drills into an in-drawer detail card (the list stays
 * mounted but hidden, so focus can return to the originating row).
 *
 * Contracts from the debate:
 *  - `role="complementary"`, closed by default, transform-only animation with
 *    a `prefers-reduced-motion` fallback.
 *  - Rows are icon-first but NEVER icon-only: frame, badge, always-visible
 *    name, trailing state glyph, and an on-map/off-map marker.
 *  - Sections group by category with sticky/collapsible headers and
 *    built/total counts; only sections containing a buildable entry start
 *    expanded. Deterministic config order — no search, no virtualization.
 *  - The detail card is a pushed CHILD VIEW inside the drawer, not a floating
 *    sibling plaque; it is the only focus-trapped layer (list stays modeless).
 *  - Escape ownership is focus-scoped: the imperative `escape()` closes the
 *    card first (focus → originating row), then reports back so the drawer
 *    can close; a stage tooltip never closes the drawer by accident.
 */

/** data-testid for the drawer root. */
export const VILLAGE_REGISTRY_ID = 'village-registry';
/** Row badge / trailing-glyph test hooks. */
export const REGISTRY_ROW_ATTR = 'data-registry-row';

const RESOURCES: VillageCostResource[] = ['wood', 'iron', 'gold', 'food'];
type RegistryFilter = 'all' | VillageBuildingState;

/** Imperative surface for the view-level Escape arbitrator + pin→row sync. */
export interface VillageRegistryHandle {
  /** Detail card open → close it (focus returns to the originating row) and
   *  report true; otherwise false so the caller can close the drawer. */
  escape: () => boolean;
  /** Scroll a row into view (pin hover → registry highlight). No-op when the
   *  drawer is closed or a detail card is open. */
  scrollToRow: (id: VillageBuildingCatalogId) => void;
  /** Restore focus to a row — used when a tooltip opened FROM a row closes. */
  focusRow: (id: VillageBuildingCatalogId) => void;
}

/** The registry is a LIST mounted inside the village toolbar's `data-hud-controls` scope
 *  (`VillageScreenView`): the control-pill rule (`.skin-scope [data-hud-controls] button`)
 *  reached its row buttons — 26 px fixed height, `line-height: 1`, caps — and each two-line
 *  row was squeezed into a pill (R-234, T-03). Rows and section headers state their own
 *  geometry; inline styles outrank the scope rule. */
const LIST_BUTTON_RESET: CSSProperties = {
  height: 'auto',
  minHeight: 0,
  lineHeight: 1.3,
  justifyContent: 'flex-start',
  textTransform: 'none',
  letterSpacing: 'normal',
  fontFamily: 'var(--skin-font-serif)',
  fontSize: 12,
  fontWeight: 'normal',
  flexShrink: 0,
};

export interface VillageRegistryProps {
  /** Drawer visibility — owned by `VillageScreenView` (chip + `r` hotkey). */
  open: boolean;
  /** Full catalog, already config-ordered. */
  buildings: VillageBuildingDefinition[];
  /** Cross-surface highlight (artifact r005 `activeBuildingId`): the row that
   *  matches lights up; `null` clears. */
  activeId: VillageBuildingCatalogId | null;
  /** Row hover/focus reports up so the stage can ping the footprint/pin. */
  onActiveChange: (id: VillageBuildingCatalogId | null) => void;
  /** Painted row click → the view pins the stage tooltip for that pin. */
  onShowTooltip: (id: VillageBuildingCatalogId) => void;
  /** Imperative handle for the view arbitrator. */
  ref?: Ref<VillageRegistryHandle>;
}

/** State badge content — same contract as the pin badge tab. */
const StateBadge: React.FC<{ b: VillageBuildingDefinition }> = ({ b }) => {
  const { t } = useTranslation('idleVillage');
  const common: CSSProperties = {
    display: 'inline-flex',
    minWidth: 16,
    height: 16,
    padding: '0 3px',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    background: 'var(--skin-hud-lacquer-deep)',
    border: '1px solid var(--skin-hud-brass-base)',
    font: '600 10px/1 var(--skin-font-display)',
    letterSpacing: '0.04em',
    flexShrink: 0,
  };
  if (b.initialState === 'locked') {
    return (
      <span aria-hidden="true" style={{ ...common, border: '1px solid var(--skin-surface-border)', color: 'var(--skin-text-secondary)' }}>
        <EngravedIcon id="cmd-lock" size={9} />
      </span>
    );
  }
  if (b.initialState === 'buildable') {
    return (
      <span aria-hidden="true" style={{ ...common, color: 'var(--skin-icon-accent)' }}>+</span>
    );
  }
  return (
    <span aria-hidden="true" title={t('gameFrame.village.levelBadge', { level: toRomanLevel(b.initialLevel), max: toRomanLevel(b.tiers.length) })} style={{ ...common, color: 'var(--skin-title-color)' }}>
      {toRomanLevel(b.initialLevel)}
    </span>
  );
};

/** Trailing state glyph: ▸ built, + buildable, lock locked — redundant
 *  channel next to the badge (scan aid per the debate: icon ≠ only signal). */
const StateGlyph: React.FC<{ state: VillageBuildingState }> = ({ state }) => {
  const { t } = useTranslation('idleVillage');
  if (state === 'locked') {
    return (
      <span role="img" aria-label={t('gameFrame.village.state.locked')} style={{ color: 'var(--skin-text-secondary)', display: 'inline-flex' }}>
        <EngravedIcon id="cmd-lock" size={12} />
      </span>
    );
  }
  if (state === 'buildable') {
    return (
      <span role="img" aria-label={t('gameFrame.village.state.buildable')} style={{ color: 'var(--skin-icon-accent)', font: '600 12px var(--skin-font-display)' }}>
        +
      </span>
    );
  }
  return (
    <span aria-hidden="true" style={{ color: 'var(--skin-icon-accent)', font: '9px var(--skin-font-display)' }}>◆</span>
  );
};

/** Small framed icon for a registry row — the same frame grammar as pins. */
const RowIcon: React.FC<{ b: VillageBuildingDefinition }> = ({ b }) => (
  <span aria-hidden="true" style={{ position: 'relative', display: 'inline-flex', width: 30, height: 30, flexShrink: 0, color: b.initialState === 'locked' ? 'var(--skin-text-secondary)' : 'var(--skin-icon-color)' }}>
    <VillagePinFrame frame={PIN_FRAME_FOR_CATEGORY[b.category]} state={b.initialState} size={30} />
    <span style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <VillageBuildingIcon iconKey={b.iconKey} size={15} />
    </span>
  </span>
);

/** One registry row (button). */
const RegistryRow: React.FC<{
  b: VillageBuildingDefinition;
  active: boolean;
  onHover: (id: VillageBuildingCatalogId | null) => void;
  onActivate: (b: VillageBuildingDefinition) => void;
  onKeyDown: (event: React.KeyboardEvent<HTMLButtonElement>) => void;
  rowRef: (node: HTMLButtonElement | null) => void;
}> = ({ b, active, onHover, onActivate, onKeyDown, rowRef }) => {
  const { t } = useTranslation('idleVillage');
  const painted = hasFootprint(b);
  return (
    <button
      type="button"
      ref={rowRef}
      {...{ [REGISTRY_ROW_ATTR]: b.id }}
      data-slot-kind={b.slotKind}
      data-state={b.initialState}
      data-active={active || undefined}
      aria-label={`${t(b.nameKey)} — ${t(`gameFrame.village.category.${b.category}`)} · ${t(`gameFrame.village.state.${b.initialState}`)}${painted ? ` · ${t('gameFrame.village.registry.onMap')}` : ` · ${t('gameFrame.village.registry.offMap')}`}`}
      onPointerEnter={() => onHover(b.id)}
      onPointerLeave={() => onHover(null)}
      onFocus={() => onHover(b.id)}
      onBlur={() => onHover(null)}
      onClick={() => onActivate(b)}
      onKeyDown={onKeyDown}
      style={{
        ...LIST_BUTTON_RESET,
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--skin-hud-inline-gap)',
        width: '100%',
        padding: '6px 8px',
        borderRadius: 'var(--skin-hud-row-radius)',
        border: `1px solid ${active ? 'var(--skin-hud-brass-hi)' : 'var(--skin-surface-border)'}`,
        /* Registry-only rows get a muted "not on the map" treatment; the
         *  active state is the internal brass glow (never a ghost ellipse). */
        background: active
          ? 'color-mix(in srgb, var(--skin-hud-brass-base) 22%, var(--skin-hud-lacquer-deep))'
          : painted
            ? 'var(--skin-hud-lacquer-base)'
            : 'color-mix(in srgb, var(--skin-hud-lacquer-deep) 70%, transparent)',
        boxShadow: active ? '0 0 0 1px var(--skin-hud-brass-hi), 0 0 14px color-mix(in srgb, var(--skin-hud-brass-hi) 35%, transparent) inset' : undefined,
        color: 'var(--skin-text-primary)',
        cursor: 'pointer',
        textAlign: 'left',
        opacity: painted ? 1 : 0.88,
        transition: 'background 120ms ease-out, border-color 120ms ease-out, box-shadow 120ms ease-out',
      }}
    >
      <RowIcon b={b} />
      <StateBadge b={b} />
      <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 1 }}>
        <span style={{ font: 'var(--skin-hud-name-weight) var(--skin-hud-name-size) var(--skin-font-display)', letterSpacing: 'var(--skin-hud-name-tracking)', color: 'var(--skin-title-color)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {t(b.nameKey)}
        </span>
        <span style={{ font: '10px var(--skin-font-serif)', color: 'var(--skin-text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {t(b.descKey)}
        </span>
      </span>
      {/* On-map marker: painted rows get the map glyph, registry-only a muted
       *  dash — the spatial contract is explicit, never implied. */}
      <span
        role="img"
        aria-label={painted ? t('gameFrame.village.registry.onMap') : t('gameFrame.village.registry.offMap')}
        title={painted ? t('gameFrame.village.registry.onMap') : t('gameFrame.village.registry.offMap')}
        style={{ color: painted ? 'var(--skin-icon-accent)' : 'var(--skin-text-secondary)', display: 'inline-flex', opacity: painted ? 1 : 0.6 }}
      >
        {painted ? <EngravedIcon id="nav-village" size={12} /> : <span style={{ font: '600 10px var(--skin-font-display)' }}>·</span>}
      </span>
      <StateGlyph state={b.initialState} />
    </button>
  );
};

export const VillageRegistry: React.FC<VillageRegistryProps> = ({
  open,
  buildings,
  activeId,
  onActiveChange,
  onShowTooltip,
  ref,
}) => {
  const { t } = useTranslation('idleVillage');
  const [detailId, setDetailId] = useState<VillageBuildingCatalogId | null>(null);
  const [filter, setFilter] = useState<RegistryFilter>('all');
  /* Sections containing a buildable entry start expanded; the rest collapsed. */
  const [collapsed, setCollapsed] = useState<Set<string>>(
    () => new Set(BUILDING_CATEGORIES.filter((cat) => !buildings.some((b) => b.category === cat && b.initialState === 'buildable'))),
  );
  const rootRef = useRef<HTMLDivElement>(null);
  const rowRefs = useRef(new Map<VillageBuildingCatalogId, HTMLButtonElement>());
  const listRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const detailIdRef = useRef(detailId);
  detailIdRef.current = detailId;
  /* The row that spawned the open card — focus returns here on back/Escape. */
  const originRowRef = useRef<VillageBuildingCatalogId | null>(null);

  const detailBuilding = detailId ? buildings.find((b) => b.id === detailId) : undefined;

  const openCard = useCallback((b: VillageBuildingDefinition) => {
    originRowRef.current = b.id;
    setDetailId(b.id);
    onActiveChange(b.id);
  }, [onActiveChange]);

  const closeCard = useCallback(() => {
    const origin = originRowRef.current;
    setDetailId(null);
    onActiveChange(null);
    if (origin) {
      /* Focus restore by id — survives filtering/collapse because the list
       *  stays mounted while the card is open. */
      requestAnimationFrame(() => rowRefs.current.get(origin)?.focus());
    }
  }, [onActiveChange]);

  useImperativeHandle(ref, () => ({
    escape: () => {
      if (!detailIdRef.current) return false;
      closeCard();
      return true;
    },
    scrollToRow: (id) => {
      rowRefs.current.get(id)?.scrollIntoView({ block: 'nearest' });
    },
    focusRow: (id) => {
      rowRefs.current.get(id)?.focus();
    },
  }), [closeCard]);

  /* Reset to list view whenever the drawer closes — the next open always
   *  starts at the list, never at a stale card. */
  useEffect(() => {
    if (!open) setDetailId(null);
  }, [open]);

  /* When the card mounts, move focus inside it (the back button) — the card
   *  is the only trapped layer in the drawer. */
  useEffect(() => {
    if (detailId) cardRef.current?.querySelector<HTMLElement>('[data-registry-back]')?.focus();
  }, [detailId]);

  /* Focus trap for the card view only (artifact r004: list is modeless). */
  const onCardKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== 'Tab' || !cardRef.current) return;
    const focusables = cardRef.current.querySelectorAll<HTMLElement>('button, [tabindex="0"]');
    if (focusables.length === 0) return;
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  /* Vertical arrow roving across the visible rows (same convention as the
   *  pin toolbar's ←→). */
  const onRowKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
    /* The drawer lives INSIDE the pin toolbar's keydown scope — without
     *  stopPropagation the toolbar's roving handler would steal focus back
     *  to a pin on every arrow press. */
    event.stopPropagation();
    const rows = Array.from(rootRef.current?.querySelectorAll<HTMLElement>(`[${REGISTRY_ROW_ATTR}]`) ?? []);
    const index = rows.indexOf(event.currentTarget);
    if (index < 0) return;
    event.preventDefault();
    const next = (index + (event.key === 'ArrowDown' ? 1 : -1) + rows.length) % rows.length;
    rows[next]?.focus();
  };

  const filtered = useMemo(
    () => buildings.filter((b) => filter === 'all' || b.initialState === filter),
    [buildings, filter],
  );
  const sections = useMemo(
    () =>
      BUILDING_CATEGORIES.map((cat) => {
        const entries = filtered.filter((b) => b.category === cat);
        const all = buildings.filter((b) => b.category === cat);
        return { cat, entries, built: all.filter((b) => b.initialState === 'built').length, total: all.length };
      }).filter((s) => s.entries.length > 0),
    [buildings, filtered],
  );

  const activateRow = (b: VillageBuildingDefinition) => {
    if (hasFootprint(b)) {
      /* Painted rows open the stage tooltip (pinned) — the row keeps its
       *  data-active highlight; focus returns to the ROW on dismissal. */
      onShowTooltip(b.id);
    } else {
      openCard(b);
    }
  };

  const toggleSection = (cat: string) =>
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });

  const levelLine = (b: VillageBuildingDefinition) =>
    b.initialState === 'locked' ? t('gameFrame.village.state.locked') : t('gameFrame.village.levelBadge', { level: toRomanLevel(b.initialLevel), max: toRomanLevel(b.tiers.length) });

  return (
    <div
      ref={rootRef}
      data-testid={VILLAGE_REGISTRY_ID}
      id={VILLAGE_REGISTRY_ID}
      role="complementary"
      aria-label={t('gameFrame.village.registry.title')}
      aria-hidden={!open}
      data-open={open || undefined}
      style={{
        position: 'absolute',
        right: 8,
        top: '7.5%',
        width: 'min(400px, 94%)',
        maxHeight: '85%',
        display: 'flex',
        pointerEvents: open ? 'auto' : 'none',
        /* Transform-only slide-over (GPU-friendly); reduced-motion swaps the
         *  slide for a plain opacity fade. */
        transform: open ? 'translateX(0)' : 'translateX(calc(100% + 12px))',
        opacity: open ? 1 : 0,
        transition: 'transform 260ms cubic-bezier(.2,.9,.3,1), opacity 200ms ease-out',
        visibility: open ? 'visible' : 'hidden',
      }}
    >
      <style>{`
        @media (prefers-reduced-motion: reduce) {
          [data-testid="${VILLAGE_REGISTRY_ID}"] { transition: opacity 120ms ease-out !important; transform: none !important; }
          [data-testid="${VILLAGE_REGISTRY_ID}"][aria-hidden="true"] { transform: none !important; }
        }
      `}</style>
      <HudPlaque
        shape="panel"
        as="div"
        style={{
          display: 'flex',
          flexDirection: 'column',
          width: '100%',
          maxHeight: '100%',
          padding: 'var(--skin-hud-panel-padding)',
          gap: 'var(--skin-hud-stack-gap)',
          overflow: 'hidden',
        }}
      >
        {/* Header — title + close control. */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--skin-hud-inline-gap)', flexShrink: 0 }}>
          <span
            style={{
              flex: 1,
              font: 'var(--skin-hud-caps-weight) var(--skin-hud-caps-size) var(--skin-font-display)',
              letterSpacing: 'var(--skin-hud-caps-tracking)',
              color: 'var(--skin-title-color)',
              textTransform: 'uppercase',
            }}
          >
            {t('gameFrame.village.registry.title')}
          </span>
          <span style={{ font: '10px var(--skin-font-serif)', color: 'var(--skin-text-secondary)' }}>
            {t('gameFrame.village.registry.hint')}
          </span>
        </div>

        {/* LIST VIEW — stays mounted (hidden) while the card is open so row
         *  focus can return by id. */}
        <div
          ref={listRef}
          data-testid="village-registry-list"
          style={{ display: detailId ? 'none' : 'flex', flexDirection: 'column', gap: 'var(--skin-hud-stack-gap)', minHeight: 0 }}
        >
          {/* Filter chips — All / Built / Buildable / Locked. */}
          <div role="group" aria-label={t('gameFrame.village.registry.filterLabel')} style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
            {(['all', 'built', 'buildable', 'locked'] as const).map((f) => (
              <button
                key={f}
                type="button"
                data-registry-filter={f}
                aria-pressed={filter === f}
                onClick={() => setFilter(f)}
                style={{
                  padding: '2px 8px',
                  borderRadius: 10,
                  border: `1px solid ${filter === f ? 'var(--skin-hud-brass-hi)' : 'var(--skin-surface-border)'}`,
                  background: filter === f ? 'color-mix(in srgb, var(--skin-hud-brass-base) 28%, var(--skin-hud-lacquer-deep))' : 'var(--skin-hud-lacquer-deep)',
                  color: filter === f ? 'var(--skin-title-color)' : 'var(--skin-text-secondary)',
                  font: '10px var(--skin-font-display)',
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  cursor: 'pointer',
                }}
              >
                {t(`gameFrame.village.registry.filter.${f}`)}
              </button>
            ))}
          </div>

          {/* Scrollable sections. */}
          <div style={{ overflowY: 'auto', overscrollBehavior: 'contain', display: 'flex', flexDirection: 'column', gap: 4, minHeight: 0 }}>
            {sections.map(({ cat, entries, built, total }) => {
              const isCollapsed = collapsed.has(cat);
              return (
                <section key={cat} data-registry-section={cat} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <button
                    type="button"
                    aria-expanded={!isCollapsed}
                    onClick={() => toggleSection(cat)}
                    style={{
                      ...LIST_BUTTON_RESET,
                      position: 'sticky',
                      top: 0,
                      zIndex: 1,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      width: '100%',
                      padding: '4px 6px',
                      borderRadius: 'var(--skin-hud-row-radius)',
                      border: 'none',
                      background: 'var(--skin-hud-lacquer-deep)',
                      color: 'var(--skin-text-secondary)',
                      font: 'var(--skin-hud-caps-weight) 10px var(--skin-font-display)',
                      letterSpacing: 'var(--skin-hud-caps-tracking)',
                      textTransform: 'uppercase',
                      cursor: 'pointer',
                    }}
                  >
                    <span aria-hidden="true" style={{ position: 'relative', display: 'inline-flex', width: 14, height: 14 }}>
                      <VillagePinFrame frame={PIN_FRAME_FOR_CATEGORY[cat]} state="built" size={14} />
                    </span>
                    <span style={{ flex: 1, textAlign: 'left' }}>{t(`gameFrame.village.category.${cat}`)}</span>
                    <span style={{ fontVariantNumeric: 'tabular-nums' }}>
                      {t('gameFrame.village.registry.sectionCount', { built, total })}
                    </span>
                    <span aria-hidden="true" style={{ transition: 'rotate 140ms ease-out', rotate: isCollapsed ? '-90deg' : '0deg' }}>▾</span>
                  </button>
                  {!isCollapsed &&
                    entries.map((b) => (
                      <RegistryRow
                        key={b.id}
                        b={b}
                        active={activeId === b.id}
                        onHover={onActiveChange}
                        onActivate={activateRow}
                        onKeyDown={onRowKeyDown}
                        rowRef={(node) => {
                          if (node) rowRefs.current.set(b.id, node);
                          else rowRefs.current.delete(b.id);
                        }}
                      />
                    ))}
                </section>
              );
            })}
          </div>
        </div>

        {/* DETAIL VIEW — pushed child of the drawer; the only trapped layer. */}
        {detailBuilding && (
          <div
            ref={cardRef}
            data-testid="village-registry-card"
            role="dialog"
            aria-modal="true"
            aria-label={t(detailBuilding.nameKey)}
            onKeyDown={onCardKeyDown}
            style={{ display: 'flex', flexDirection: 'column', gap: 'var(--skin-hud-stack-gap)', minHeight: 0, overflowY: 'auto', overscrollBehavior: 'contain' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--skin-hud-inline-gap)' }}>
              <button
                type="button"
                data-registry-back=""
                aria-label={t('gameFrame.village.registry.back')}
                onClick={closeCard}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: 'var(--skin-icon-color)', cursor: 'pointer', padding: '2px 0', font: '11px var(--skin-font-display)', letterSpacing: '0.05em' }}
              >
                <EngravedIcon id="cmd-chevron-left" size={14} />
                {t('gameFrame.village.registry.back')}
              </button>
            </div>

            {/* 21:9 framed art — painted entries show the real painted
             *  building (object-fit crop on its region); registry-only
             *  entries get the engraved glyph tile fallback. */}
            <div
              data-testid="village-registry-art"
              aria-hidden="true"
              style={{
                position: 'relative',
                aspectRatio: '21 / 9',
                borderRadius: 'var(--skin-hud-row-radius)',
                border: '1px solid var(--skin-hud-brass-base)',
                overflow: 'hidden',
                background: 'var(--skin-hud-lacquer-deep)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              {hasFootprint(detailBuilding) ? (
                <img
                  src={villageArt}
                  alt=""
                  loading="lazy"
                  style={{
                    position: 'absolute',
                    inset: 0,
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    objectPosition: `${(detailBuilding.region.x + detailBuilding.region.w / 2) * 100}% ${(detailBuilding.region.y + detailBuilding.region.h / 2) * 100}%`,
                    transform: `scale(${Math.min(3, 0.6 / Math.max(detailBuilding.region.w, detailBuilding.region.h))})`,
                  }}
                />
              ) : (
                <span style={{ position: 'relative', display: 'inline-flex', width: 72, height: 72, color: 'var(--skin-icon-color)' }}>
                  <VillagePinFrame frame={PIN_FRAME_FOR_CATEGORY[detailBuilding.category]} state={detailBuilding.initialState} size={72} />
                  <span style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <VillageBuildingIcon iconKey={detailBuilding.iconKey} size={36} />
                  </span>
                </span>
              )}
            </div>

            {/* Name + state. */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--skin-hud-inline-gap)' }}>
              <span style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
                <span style={{ font: 'var(--skin-hud-name-weight) var(--skin-hud-name-size) var(--skin-font-display)', letterSpacing: 'var(--skin-hud-name-tracking)', color: 'var(--skin-title-color)', textShadow: 'var(--skin-hud-engrave)' }}>
                  {t(detailBuilding.nameKey)}
                </span>
                <span style={{ font: 'var(--skin-hud-caps-weight) var(--skin-hud-caps-size) var(--skin-font-display)', letterSpacing: 'var(--skin-hud-caps-tracking)', color: 'var(--skin-text-secondary)', textTransform: 'uppercase' }}>
                  {t(`gameFrame.village.category.${detailBuilding.category}`)} · {levelLine(detailBuilding)} · {hasFootprint(detailBuilding) ? t('gameFrame.village.registry.onMap') : t('gameFrame.village.registry.offMap')}
                </span>
              </span>
            </div>
            <span style={{ font: '13px var(--skin-font-serif)', color: 'var(--skin-text-primary)' }}>{t(detailBuilding.descKey)}</span>

            {detailBuilding.initialState === 'locked' && detailBuilding.unlockHintKey && (
              <span style={{ font: 'italic 12px var(--skin-font-sans)', color: 'var(--skin-text-secondary)', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <EngravedIcon id="cmd-lock" size={12} />
                {t(detailBuilding.unlockHintKey)}
              </span>
            )}

            {/* Effect ladder — every tier, not just next. */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span style={{ font: 'var(--skin-hud-caps-weight) var(--skin-hud-caps-size) var(--skin-font-display)', letterSpacing: 'var(--skin-hud-caps-tracking)', color: 'var(--skin-text-secondary)', textTransform: 'uppercase' }}>
                {t('gameFrame.village.registry.effectLadder')}
              </span>
              {detailBuilding.tiers.map((tier) => (
                <div
                  key={tier.level}
                  data-tier={tier.level}
                  data-current={detailBuilding.initialLevel === tier.level || undefined}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '3px 6px',
                    borderRadius: 'var(--skin-hud-row-radius)',
                    border: `1px solid ${detailBuilding.initialLevel === tier.level ? 'var(--skin-hud-brass-hi)' : 'var(--skin-surface-border)'}`,
                    background: detailBuilding.initialLevel === tier.level ? 'color-mix(in srgb, var(--skin-hud-brass-base) 20%, transparent)' : 'transparent',
                    font: '11px var(--skin-font-sans)',
                    color: 'var(--skin-text-primary)',
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  <span style={{ minWidth: 22, font: '600 10px var(--skin-font-display)', color: 'var(--skin-icon-accent)' }}>{toRomanLevel(tier.level)}</span>
                  <span style={{ flex: 1 }}>
                    {t(detailBuilding.effectKey, {
                      value: tier.effectValue,
                      next: detailBuilding.tiers[tier.level]?.effectValue ?? tier.effectValue,
                    })}
                  </span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: 'var(--skin-text-secondary)' }}>
                    {RESOURCES.map((res) => {
                      const amount = tier.cost[res];
                      if (amount <= 0) return null;
                      const label = t(`gameFrame.resources.${res}`);
                      return (
                        <span key={res} title={label} style={{ display: 'inline-flex', alignItems: 'center', gap: 2 }}>
                          <VillageCostIcon resource={res} label={label} size={12} />
                          {amount}
                        </span>
                      );
                    })}
                    <span>· {t('gameFrame.village.daysShort', { days: tier.buildDays })}</span>
                  </span>
                </div>
              ))}
            </div>

            {/* Mock honesty: the preview control is natively disabled. */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--skin-hud-inline-gap)', borderTop: '1px solid var(--skin-surface-border)', paddingTop: 'var(--skin-hud-stack-gap)' }}>
              {detailBuilding.initialState === 'locked' ? <span /> : <MockUpgradeControl building={detailBuilding} />}
            </div>
          </div>
        )}
      </HudPlaque>
    </div>
  );
};

export default VillageRegistry;
