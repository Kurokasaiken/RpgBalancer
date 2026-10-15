import React, { useCallback, useEffect, useImperativeHandle, useLayoutEffect, useRef, useState, type CSSProperties, type Ref } from 'react';
import { useTranslation } from 'react-i18next';
import { HudPlaque } from '@/ui/idleVillage/skins/primitives/HudPlaque';
import { SkinScope } from '@/ui/idleVillage/skins/primitives/SkinScope';
import { EngravedIcon } from './engravedIcons';
import { VillageBuildingIcon, VillageCostIcon, type VillageCostResource } from './villageBuildingIcons';
import { MockUpgradeControl } from './MockUpgradeControl';
import { trackTelemetryEvent } from '@/analytics/telemetry/telemetryProvider';
import {
  BUILDING_IDS,
  toRomanLevel,
  VILLAGE_BUILDINGS_CONFIG,
  VILLAGE_CANVAS,
  type VillageBuildingCatalogId,
  type VillageBuildingDefinition,
} from '@/balancing/config/idleVillage/villageBuildingsConfig';
import villageArt from '@/assets/mood/villaggio.png';

/**
 * `VillageScreenView` — the full-area village/buildings screen on `/game`
 * (PLAN-035, artifact r005, Desiderata v30).
 *
 * Icon-first pins sit on the cleaned `villaggio.png` painting inside a stage
 * box that keeps the painted `3168/1344` aspect at any viewport, so every
 * normalized anchor lands on its painted roof. Hover/focus opens the single
 * hover-pinnable `HudPlaque` tooltip (§5b.7: 140 ms grace, 📌 pin, X); click
 * pins it. Construction is mock-only: `MockUpgradeControl` is a natively
 * disabled button, and nothing here touches the economy store. Escape is NOT
 * handled internally — the page-level arbitrator calls the imperative
 * `escape()` handle (returns true when it closed a tooltip).
 *
 * Keyboard: the pins form one `role="toolbar"` roving-tabindex group — one
 * Tab stop, arrows/Home/End move in `BUILDING_IDS` order.
 */

/** Single tooltip identity (also `data-testid`); `aria-controls` points here. */
export const VILLAGE_TOOLTIP_ID = 'village-building-tooltip';
/** §5b.7 hoverable grace: pointer leaving pin∪tooltip waits this long before closing. */
export const TOOLTIP_GRACE_MS = 140;
/** Pin diameter; the tooltip is anchored beyond this radius. */
const PIN_PX = 40;
const PIN_HALF = PIN_PX / 2;
/** Gap between pin edge and tooltip. */
const TIP_GAP = 12;
/** Minimum distance of the tooltip from every stage edge. */
const CLAMP_INSET = 8;
/** Side-change hysteresis: keep the previous side while its overflow stays under this. */
const SIDE_HYSTERESIS_PX = 16;
/** Narrow-viewport fallback: tooltip body scrolls above this height. */
const TIP_MAX_BODY_PX = 320;
const TIP_CHROME_RESERVE_PX = 64;

export type TooltipSide = 'right' | 'left' | 'above' | 'below';
export interface TooltipPlacement {
  x: number;
  y: number;
  side: TooltipSide;
}

const clamp = (v: number, min: number, max: number) => Math.min(Math.max(v, min), Math.max(min, max));

/** Total px by which a placement overflows the clamped stage box (0 = fits). */
const overflowPx = (c: { x: number; y: number }, tip: { w: number; h: number }, stage: { w: number; h: number }): number =>
  Math.max(0, CLAMP_INSET - c.x) +
  Math.max(0, c.x + tip.w - (stage.w - CLAMP_INSET)) +
  Math.max(0, CLAMP_INSET - c.y) +
  Math.max(0, c.y + tip.h - (stage.h - CLAMP_INSET));

/**
 * Pure tooltip placement (unit-tested): prefer the side toward the stage
 * centre, fall back to the opposite side, then toward-centre vertically and
 * the last vertical side; clamp both axes to an 8 px inset. `lastSide`
 * survives while its overflow stays under `SIDE_HYSTERESIS_PX`, so a hovering
 * tooltip near a flip boundary does not flicker.
 */
export function placeTooltip(
  pin: { x: number; y: number },
  tip: { w: number; h: number },
  stage: { w: number; h: number },
  lastSide: TooltipSide | null,
): TooltipPlacement {
  const towardH: TooltipSide = pin.x < stage.w / 2 ? 'right' : 'left';
  const towardV: TooltipSide = pin.y < stage.h / 2 ? 'below' : 'above';
  const candidates: Record<TooltipSide, { x: number; y: number }> = {
    right: { x: pin.x + PIN_HALF + TIP_GAP, y: pin.y - tip.h / 2 },
    left: { x: pin.x - PIN_HALF - TIP_GAP - tip.w, y: pin.y - tip.h / 2 },
    above: { x: pin.x - tip.w / 2, y: pin.y - PIN_HALF - TIP_GAP - tip.h },
    below: { x: pin.x - tip.w / 2, y: pin.y + PIN_HALF + TIP_GAP },
  };
  const order: TooltipSide[] = [towardH, towardH === 'right' ? 'left' : 'right', towardV, towardV === 'below' ? 'above' : 'below'];
  let side = order.find((s) => overflowPx(candidates[s], tip, stage) === 0) ?? towardH;
  if (lastSide && lastSide !== side && overflowPx(candidates[lastSide], tip, stage) <= SIDE_HYSTERESIS_PX) side = lastSide;
  const c = candidates[side];
  return {
    x: clamp(c.x, CLAMP_INSET, stage.w - tip.w - CLAMP_INSET),
    y: clamp(c.y, CLAMP_INSET, stage.h - tip.h - CLAMP_INSET),
    side,
  };
}

/** Imperative surface the page-level Escape arbitrator calls. */
export interface VillageScreenViewHandle {
  /** Close the open/pinned tooltip and restore focus to its pin. True = consumed. */
  escape: () => boolean;
}

export interface VillageScreenViewProps {
  /** Warehouse action: open/focus the VillageStash panel. The clicked button is
   *  passed so the panel's close path can return focus to it. */
  onOpenStash: (trigger: HTMLElement) => void;
  /** Emporium action: open/focus the Merchant panel (same focus contract). */
  onOpenMerchant: (trigger: HTMLElement) => void;
  /** Imperative handle for the page arbitrator (`escape()`). */
  ref?: Ref<VillageScreenViewHandle>;
}

const ASPECT = VILLAGE_CANVAS.widthPx / VILLAGE_CANVAS.heightPx;
const BUILDINGS = VILLAGE_BUILDINGS_CONFIG.buildings;
const RESOURCES: VillageCostResource[] = ['wood', 'iron', 'gold', 'food'];

const pinDisc: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: PIN_PX,
  height: PIN_PX,
  borderRadius: '50%',
  background: 'var(--skin-hud-lacquer-deep)',
  border: '1px solid var(--skin-surface-border)',
  boxShadow: 'var(--skin-hud-engrave)',
  position: 'relative',
};

const controlButton: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  minWidth: 24,
  minHeight: 24,
  padding: 0,
};

export const VillageScreenView: React.FC<VillageScreenViewProps> = ({ onOpenStash, onOpenMerchant, ref }) => {
  const { t } = useTranslation('idleVillage');
  const [entered, setEntered] = useState(false);
  const [tooltip, setTooltip] = useState<{ id: VillageBuildingCatalogId; pinned: boolean } | null>(null);
  const [pos, setPos] = useState<TooltipPlacement | null>(null);
  const [stageSize, setStageSize] = useState<{ w: number; h: number }>({ w: 0, h: 0 });
  const [roverIndex, setRoverIndex] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const tooltipNodeRef = useRef<HTMLElement | null>(null);
  const pinRefs = useRef(new Map<VillageBuildingCatalogId, HTMLButtonElement>());
  /* Latest tooltip state inside the grace timer: the 140 ms callback must see
   * the pinned flag as it is when the timer fires, not when it was scheduled
   * (a click landing between leave and fire pins the tooltip — the close must
   * not commit). */
  const tooltipStateRef = useRef(tooltip);
  tooltipStateRef.current = tooltip;
  const closeTimer = useRef<number | null>(null);
  const lastSideRef = useRef<TooltipSide | null>(null);
  /* Focus-restore suppression: `closeTooltip(true)` focuses the pin that owned
   * the tooltip, and the pin's `onFocus` would instantly re-open it (focus =
   * hover). The flag lets exactly that synthetic focus land without reopening;
   * a later genuine Tab back to the pin still opens the tooltip. */
  const suppressFocusOpenRef = useRef(false);
  const coarsePointer = useRef(typeof window !== 'undefined' && Boolean(window.matchMedia?.('(pointer: coarse)').matches));

  useEffect(() => {
    const timer = window.setTimeout(() => setEntered(true), 30);
    return () => window.clearTimeout(timer);
  }, []);

  /* Stage sizing: JS measurement, not CSS — `aspect-ratio` + `max-*` does not
   * re-shrink the long axis reliably across browsers, and the pins must land
   * on painted pixels at every window size. */
  useLayoutEffect(() => {
    const node = containerRef.current;
    if (!node) return undefined;
    const measure = () => {
      const w = node.clientWidth;
      const h = node.clientHeight;
      const sw = Math.min(w, h * ASPECT);
      setStageSize((prev) => {
        const next = { w: sw, h: sw / ASPECT };
        return prev.w === next.w && prev.h === next.h ? prev : next;
      });
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const cancelClose = useCallback(() => {
    if (closeTimer.current !== null) {
      window.clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  }, []);

  const closeTooltip = useCallback((restoreFocus: boolean) => {
    const current = tooltipStateRef.current;
    cancelClose();
    setTooltip(null);
    setPos(null);
    if (restoreFocus && current) {
      suppressFocusOpenRef.current = true;
      pinRefs.current.get(current.id)?.focus();
    }
  }, [cancelClose]);

  const scheduleClose = useCallback(() => {
    cancelClose();
    closeTimer.current = window.setTimeout(() => {
      closeTimer.current = null;
      if (!tooltipStateRef.current?.pinned) {
        setTooltip(null);
        setPos(null);
      }
    }, TOOLTIP_GRACE_MS);
  }, [cancelClose]);

  useEffect(() => cancelClose, [cancelClose]);

  const openTooltip = useCallback((id: VillageBuildingCatalogId) => {
    cancelClose();
    setTooltip((prev) => (prev?.pinned ? prev : { id, pinned: false }));
  }, [cancelClose]);

  const pinTooltip = useCallback((id: VillageBuildingCatalogId) => {
    cancelClose();
    setTooltip({ id, pinned: true });
  }, [cancelClose]);

  /* Imperative Escape for the page arbitrator (artifact r005): closes the
   * tooltip and returns true; false hands the keypress back to the page,
   * which exits to the map. One keypress = exactly one dismissal. */
  useImperativeHandle(ref, () => ({
    escape: () => {
      if (!tooltipStateRef.current) return false;
      closeTooltip(true);
      return true;
    },
  }), [closeTooltip]);

  /* Measure the mounted tooltip against the stage (not the viewport) and flip
   * + clamp it; a ResizeObserver re-places it when fonts/content resize it. */
  useLayoutEffect(() => {
    if (!tooltip) {
      lastSideRef.current = null;
      return undefined;
    }
    const tip = tooltipNodeRef.current;
    const stage = stageSize;
    if (!tip || stage.w === 0) return undefined;
    const building = BUILDINGS.find((b) => b.id === tooltip.id);
    if (!building) return undefined;
    const place = () => {
      const rect = tip.getBoundingClientRect();
      const pin = { x: building.anchor.x * stage.w, y: building.anchor.y * stage.h };
      const next = placeTooltip(pin, { w: rect.width, h: rect.height }, stage, lastSideRef.current);
      lastSideRef.current = next.side;
      setPos((prev) => (prev && prev.x === next.x && prev.y === next.y && prev.side === next.side ? prev : next));
    };
    place();
    const observer = new ResizeObserver(place);
    observer.observe(tip);
    return () => observer.disconnect();
  }, [tooltip, stageSize]);

  const activeBuilding = tooltip ? BUILDINGS.find((b) => b.id === tooltip.id) : undefined;
  const tipBodyMaxPx = Math.max(120, Math.min(TIP_MAX_BODY_PX, stageSize.h - TIP_CHROME_RESERVE_PX));

  const onToolbarKeyDown = (event: React.KeyboardEvent) => {
    const keys: Record<string, number> = {
      ArrowRight: roverIndex + 1,
      ArrowDown: roverIndex + 1,
      ArrowLeft: roverIndex - 1,
      ArrowUp: roverIndex - 1,
      Home: 0,
      End: BUILDING_IDS.length - 1,
    };
    const next = keys[event.key];
    if (next === undefined) return;
    event.preventDefault();
    const clamped = (next + BUILDING_IDS.length) % BUILDING_IDS.length;
    setRoverIndex(clamped);
    pinRefs.current.get(BUILDING_IDS[clamped])?.focus();
  };

  const pinHandlers = (b: VillageBuildingDefinition) => ({
    onPointerEnter: (event: React.PointerEvent) => {
      if (event.pointerType === 'touch' || coarsePointer.current) return;
      openTooltip(b.id);
    },
    onPointerLeave: () => {
      if (coarsePointer.current) return;
      scheduleClose();
    },
    onFocus: () => {
      if (suppressFocusOpenRef.current) {
        suppressFocusOpenRef.current = false;
        return;
      }
      openTooltip(b.id);
    },
    onBlur: () => scheduleClose(),
    onClick: () => {
      pinTooltip(b.id);
      trackTelemetryEvent('village_building_pin', { buildingId: b.id });
    },
  });

  /* Focus counts like the pointer: Tab from a pin into the tooltip's buttons
   * must cancel the blur-scheduled close, and leaving the tooltip may close it. */
  const tooltipHandlers = {
    onPointerEnter: cancelClose,
    onPointerLeave: () => {
      if (!tooltipStateRef.current?.pinned) scheduleClose();
    },
    onFocus: cancelClose,
    onBlur: () => {
      if (!tooltipStateRef.current?.pinned) scheduleClose();
    },
  };

  const levelBadge = (b: VillageBuildingDefinition) =>
    b.initialState === 'locked' ? t('gameFrame.village.state.locked') : t('gameFrame.village.levelBadge', { level: toRomanLevel(b.initialLevel), max: toRomanLevel(b.tiers.length) });

  return (
    <div data-testid="village-screen-view" style={{ position: 'absolute', inset: 0 }}>
      <SkinScope data-hud-controls="" style={{ position: 'absolute', inset: 0 }}>
        <div
          ref={containerRef}
          role="toolbar"
          aria-label={t('gameFrame.village.pinsToolbar')}
          aria-orientation="horizontal"
          onKeyDown={onToolbarKeyDown}
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'var(--skin-hud-lacquer-deep)',
            opacity: entered ? 1 : 0,
            transition: 'opacity 240ms ease-out',
          }}
        >
          {/* Stage box: keeps the painted aspect so anchors land on the roofs. */}
          <div
            data-testid="village-stage"
            style={{ position: 'relative', width: stageSize.w, height: stageSize.h, overflow: 'hidden', borderRadius: 'var(--skin-hud-row-radius)' }}
          >
            <img
              src={villageArt}
              alt={t('gameFrame.village.ariaLabel')}
              draggable={false}
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'fill', userSelect: 'none' }}
            />
            {stageSize.w > 0 &&
              BUILDINGS.map((b, index) => {
                const isTip = tooltip?.id === b.id;
                return (
                  <button
                    key={b.id}
                    ref={(node) => {
                      if (node) pinRefs.current.set(b.id, node);
                      else pinRefs.current.delete(b.id);
                    }}
                    type="button"
                    data-building-pin={b.id}
                    tabIndex={index === roverIndex ? 0 : -1}
                    aria-label={`${t(b.nameKey)} — ${levelBadge(b)}`}
                    aria-expanded={isTip}
                    aria-controls={isTip ? VILLAGE_TOOLTIP_ID : undefined}
                    aria-pressed={isTip && tooltip.pinned}
                    {...pinHandlers(b)}
                    style={{
                      position: 'absolute',
                      left: `${b.anchor.x * 100}%`,
                      top: `${b.anchor.y * 100}%`,
                      transform: 'translate(-50%, -50%)',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 3,
                      padding: 0,
                      cursor: 'pointer',
                      background: 'none',
                      border: 'none',
                      color: b.initialState === 'locked' ? 'var(--skin-text-secondary)' : 'var(--skin-icon-color)',
                    }}
                  >
                    <span style={pinDisc}>
                      <VillageBuildingIcon iconKey={b.iconKey} size={20} />
                      {b.initialState !== 'built' && (
                        <span
                          aria-hidden="true"
                          style={{
                            position: 'absolute',
                            right: -3,
                            top: -3,
                            display: 'inline-flex',
                            width: 16,
                            height: 16,
                            borderRadius: '50%',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: 'var(--skin-hud-lacquer-deep)',
                            border: '1px solid var(--skin-surface-border)',
                            color: b.initialState === 'locked' ? 'var(--skin-text-secondary)' : 'var(--skin-icon-accent)',
                          }}
                        >
                          <EngravedIcon id={b.initialState === 'locked' ? 'cmd-lock' : 'ico-spark'} size={10} />
                        </span>
                      )}
                    </span>
                    <span
                      aria-hidden="true"
                      style={{
                        font: 'var(--skin-hud-caps-weight) var(--skin-hud-caps-size) var(--skin-font-display)',
                        letterSpacing: 'var(--skin-hud-caps-tracking)',
                        color: 'var(--skin-title-color)',
                        background: 'var(--skin-hud-lacquer-deep)',
                        borderRadius: 'var(--skin-hud-row-radius)',
                        padding: '1px 6px',
                        textShadow: 'var(--skin-hud-engrave)',
                      }}
                    >
                      {toRomanLevel(b.initialLevel)}
                    </span>
                  </button>
                );
              })}

            {/* The single hover-pinnable tooltip (§5b.7 + artifact r005). The
             *  measured box is a positioned wrapper: `HudPlaque` does not
             *  forward refs, so the wrapper carries ref + handlers. */}
            {activeBuilding && (
              <div
                ref={tooltipNodeRef as React.RefObject<HTMLDivElement>}
                data-testid={VILLAGE_TOOLTIP_ID}
                id={VILLAGE_TOOLTIP_ID}
                role="group"
                aria-label={t(activeBuilding.nameKey)}
                {...tooltipHandlers}
                style={{
                  position: 'absolute',
                  left: pos?.x ?? 0,
                  top: pos?.y ?? 0,
                  visibility: pos ? 'visible' : 'hidden',
                  width: 300,
                  pointerEvents: 'auto',
                }}
              >
              <HudPlaque
                shape="panel"
                as="div"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  padding: 'var(--skin-hud-panel-padding)',
                  gap: 'var(--skin-hud-stack-gap)',
                }}
              >
                {/* Header: name + category/level + pin + close. */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--skin-hud-inline-gap)' }}>
                  <span aria-hidden="true" style={{ color: 'var(--skin-icon-accent)', display: 'inline-flex' }}>
                    <VillageBuildingIcon iconKey={activeBuilding.iconKey} size={20} />
                  </span>
                  <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <span
                      style={{
                        font: 'var(--skin-hud-name-weight) var(--skin-hud-name-size) var(--skin-font-display)',
                        letterSpacing: 'var(--skin-hud-name-tracking)',
                        color: 'var(--skin-title-color)',
                        textShadow: 'var(--skin-hud-engrave)',
                      }}
                    >
                      {t(activeBuilding.nameKey)}
                    </span>
                    <span style={{ font: 'var(--skin-hud-caps-weight) var(--skin-hud-caps-size) var(--skin-font-display)', letterSpacing: 'var(--skin-hud-caps-tracking)', color: 'var(--skin-text-secondary)', textTransform: 'uppercase' }}>
                      {t(`gameFrame.village.category.${activeBuilding.category}`)} · {levelBadge(activeBuilding)}
                    </span>
                  </span>
                  <button
                    type="button"
                    data-testid="village-tooltip-pin"
                    aria-label={tooltip?.pinned ? t('gameFrame.panels.unpin') : t('gameFrame.panels.pin')}
                    aria-pressed={tooltip?.pinned ?? false}
                    onClick={() => {
                      if (tooltip?.pinned) setTooltip({ id: activeBuilding.id, pinned: false });
                      else pinTooltip(activeBuilding.id);
                    }}
                    style={{ ...controlButton, color: tooltip?.pinned ? 'var(--skin-icon-accent)' : 'var(--skin-icon-color)' }}
                  >
                    <EngravedIcon id="cmd-pin" size={14} />
                  </button>
                  <button type="button" data-skin="close" aria-label={t('gameFrame.panels.close')} onClick={() => closeTooltip(true)} style={controlButton}>
                    <EngravedIcon id="cmd-close" size={14} />
                  </button>
                </div>

                {/* Body: the only scrollable region on short viewports. */}
                <div style={{ maxHeight: tipBodyMaxPx, overflowY: 'auto', overscrollBehavior: 'contain', display: 'flex', flexDirection: 'column', gap: 'var(--skin-hud-stack-gap)' }}>
                  <span style={{ font: '13px var(--skin-font-serif)', color: 'var(--skin-text-primary)' }}>{t(activeBuilding.descKey)}</span>
                  {activeBuilding.initialState === 'locked' ? (
                    <span style={{ font: 'italic 12px var(--skin-font-sans)', color: 'var(--skin-text-secondary)', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                      <EngravedIcon id="cmd-lock" size={12} />
                      {/* Zod: `locked` ⇒ `unlockHintKey` present (superRefine). */}
                      {activeBuilding.unlockHintKey ? t(activeBuilding.unlockHintKey) : null}
                    </span>
                  ) : (
                    <>
                      <span style={{ font: '600 12px var(--skin-font-sans)', color: 'var(--skin-icon-accent)', fontVariantNumeric: 'tabular-nums' }}>
                        {t('gameFrame.village.effectLabel')}:{' '}
                        {t(activeBuilding.effectKey, {
                          value: activeBuilding.initialLevel > 0 ? activeBuilding.tiers[activeBuilding.initialLevel - 1].effectValue : 0,
                          next: activeBuilding.tiers[Math.min(activeBuilding.initialLevel, activeBuilding.tiers.length - 1)].effectValue,
                        })}
                      </span>
                      {activeBuilding.initialLevel < activeBuilding.tiers.length && (
                        <span style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 'var(--skin-hud-inline-gap)', font: '12px var(--skin-font-sans)', color: 'var(--skin-text-secondary)' }}>
                          <span>{t('gameFrame.village.costLabel')}:</span>
                          {RESOURCES.map((res) => {
                            const amount = activeBuilding.tiers[activeBuilding.initialLevel].cost[res];
                            if (amount <= 0) return null;
                            const label = t(`gameFrame.resources.${res}`);
                            return (
                              <span key={res} title={label} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontVariantNumeric: 'tabular-nums', color: 'var(--skin-text-primary)' }}>
                                <VillageCostIcon resource={res} label={label} size={15} />
                                {amount}
                              </span>
                            );
                          })}
                          <span style={{ fontVariantNumeric: 'tabular-nums' }}>
                            · {t('gameFrame.village.daysShort', { days: activeBuilding.tiers[activeBuilding.initialLevel].buildDays })}
                          </span>
                        </span>
                      )}
                    </>
                  )}
                </div>

                {/* Footer stays outside the scroll region (artifact r005). */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--skin-hud-inline-gap)', borderTop: '1px solid var(--skin-surface-border)', paddingTop: 'var(--skin-hud-stack-gap)' }}>
                  {activeBuilding.initialState === 'locked' ? <span /> : <MockUpgradeControl building={activeBuilding} />}
                  {activeBuilding.panelAction === 'villageStash' && (
                    <button
                      type="button"
                      data-testid="village-open-stash"
                      onClick={(event) => {
                        trackTelemetryEvent('village_panel_action', { panel: 'villageStash' });
                        onOpenStash(event.currentTarget);
                      }}
                    >
                      {t('gameFrame.village.openStash')}
                    </button>
                  )}
                  {activeBuilding.panelAction === 'merchant' && (
                    <button
                      type="button"
                      data-testid="village-open-merchant"
                      onClick={(event) => {
                        trackTelemetryEvent('village_panel_action', { panel: 'merchant' });
                        onOpenMerchant(event.currentTarget);
                      }}
                    >
                      {t('gameFrame.village.openMerchant')}
                    </button>
                  )}
                </div>
              </HudPlaque>
              </div>
            )}
          </div>
        </div>
      </SkinScope>
    </div>
  );
};

export default VillageScreenView;
