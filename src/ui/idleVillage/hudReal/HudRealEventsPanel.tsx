/**
 * HudRealEventsPanel — the OPEN Events surface (Director reference 2026-11-26,
 * `.mw/specs/hud-eventi/refs/ref-eventi-panel-aperto-2026-11-26.jpg`: «questo è
 * il componente aperto»). Mounted directly below the docked collapsed bar,
 * which stays the visual header — the reference's own header band is the same
 * art family, so the bar reads as the panel's top.
 *
 * Director behavior 2026-11-26: clicking the closed bar stretches "the part
 * below" downward into this panel; the panel can grow longer and show more
 * rows. The body is assembled from keyed slices (slots band + one tiling row
 * band per event + closing ornament), so height is a function of row count
 * and the open/close animation is a vertical reveal anchored at the top.
 *
 * The four circular slots are the type filters: first is "all", the next
 * three the highest-priority ledger types; the active slot gets the lit
 * green glow. Rows keep the ledger contract — type glyph in the medallion
 * (never colour-only), title + compact countdown in the field, chevron is
 * painted; clicking a row selects the event (the host pans the camera).
 */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  DEFAULT_GAME_FRAME_CONFIG,
  type GameFrameEventLedgerConfig,
  type GameFrameEventTypeConfig,
} from '@/balancing/config/idleVillage/gameFrameConfig';
import { EVENTS_PANEL_CONFIG, type EventsPanelConfig } from '@/balancing/config/idleVillage/eventsPanelConfig';
import { HUD_TYPE, hudPx } from './hudType';
import { HudGlyph } from '@/ui/idleVillage/components/gameFrame/hudIcons';
import { HUD_TONE_COLOR as TONE_COLOR } from '@/ui/idleVillage/components/gameFrame/hudTones';
import type { HudEvent } from '@/ui/idleVillage/components/gameFrame/HudEventLedger';

const FALLBACK_TYPE: Omit<GameFrameEventTypeConfig, 'id'> = {
  labelKey: 'gameFrame.events.types.other',
  icon: 'chronicle',
  tone: 'neutral',
  priority: 99,
};

export interface HudRealEventsPanelProps {
  /** Upcoming events (titles already translated). */
  events: readonly HudEvent[];
  /** Whether the panel is open; the body stretches down on open and retracts on close. */
  open: boolean;
  /** Row selection — the host focuses the event on the map. */
  onSelect?: (event: HudEvent) => void;
  ledgerConfig?: GameFrameEventLedgerConfig;
  config?: EventsPanelConfig;
}

export const HudRealEventsPanel: React.FC<HudRealEventsPanelProps> = ({
  events,
  open,
  onSelect,
  ledgerConfig = DEFAULT_GAME_FRAME_CONFIG.eventLedger,
  config: PANEL = EVENTS_PANEL_CONFIG,
}) => {
  const { t } = useTranslation('idleVillage');
  const [filter, setFilter] = useState<string>('all');
  /* Mount/retract choreography: the body stays mounted while the closing
   *  retract plays, then unmounts. */
  const [rendered, setRendered] = useState(open);
  const [expanded, setExpanded] = useState(false);
  /* Unmount after the retract plays out: the height transitionend is the
   *  clock (no direct setTimeout — sandbox-clock invariant). If the panel
   *  never expanded (flash click) there is no transition to hear, so the
   *  close effect unmounts immediately instead. */
  const expandedRef = useRef(expanded);
  expandedRef.current = expanded;

  useEffect(() => {
    if (open) {
      setRendered(true);
      const raf = requestAnimationFrame(() => requestAnimationFrame(() => setExpanded(true)));
      return () => cancelAnimationFrame(raf);
    }
    if (!expandedRef.current) setRendered(false);
    setExpanded(false);
  }, [open]);

  const typeById = useMemo(() => new Map(ledgerConfig.types.map((type) => [type.id, type])), [ledgerConfig.types]);
  const typeOf = (typeId: string): GameFrameEventTypeConfig => typeById.get(typeId) ?? { id: typeId, ...FALLBACK_TYPE };
  const priority = (e: HudEvent) => typeOf(e.typeId).priority;

  /* Filter slots: "all" + the three highest-priority types that exist in the
   *  registry (the reference has exactly four slots). */
  const slotTypes = useMemo(
    () => [...ledgerConfig.types].sort((a, b) => a.priority - b.priority).slice(0, 3),
    [ledgerConfig.types],
  );
  const slotIds = ['all', ...slotTypes.map((type) => type.id)];

  const rows = useMemo(() => {
    const visible = events.filter((event) => !event.arriving);
    const filtered = filter === 'all' ? visible : visible.filter((event) => event.typeId === filter);
    return [...filtered].sort((a, b) => priority(a) - priority(b) || a.daysLeft - b.daysLeft);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [events, filter, typeById]);

  const scrollable = rows.length > PANEL.behavior.maxRows;
  const rowCount = Math.max(Math.min(rows.length, PANEL.behavior.maxRows), 1);
  const visibleHeight = PANEL.art.bodytopH + rowCount * PANEL.art.rowH + PANEL.art.bottomH;

  if (!rendered) return null;

  const countdownOf = (daysLeft: number) =>
    (daysLeft <= 0 ? t('gameFrame.events.today') : t('gameFrame.events.daysLeft', { count: daysLeft })).replace(/(\d+)\s+(\p{L})/u, '$1$2');

  return (
    <div
      data-hudreal-events-panel=""
      data-open={open || undefined}
      onTransitionEnd={(event) => {
        if (event.propertyName === 'height' && !open) setRendered(false);
      }}
      role="region"
      aria-label={t('gameFrame.events.title')}
      style={{
        position: 'absolute',
        left: 0,
        top: 0,
        width: PANEL.art.w,
        height: expanded ? visibleHeight : 0,
        overflow: 'hidden',
        transition: `height ${expanded ? PANEL.behavior.expandMs : PANEL.behavior.collapseMs}ms cubic-bezier(0.22, 0.9, 0.3, 1)`,
        pointerEvents: open ? 'auto' : 'none',
      }}
    >
      <div style={{ position: 'relative', width: PANEL.art.w, opacity: expanded ? 1 : 0.35, transition: `opacity ${PANEL.behavior.expandMs}ms ease-out` }}>
        <img src={PANEL.assets.bodytop} alt="" draggable={false} style={{ display: 'block', width: PANEL.art.w, height: PANEL.art.bodytopH, pointerEvents: 'none' }} />
        {/* Filter slots — transparent round buttons over the painted slots;
         *  the active one carries the lit green glow. */}
        {slotIds.map((slotId, index) => {
          const slot = PANEL.slots[index];
          const active = filter === slotId;
          const label = slotId === 'all' ? t('gameFrame.events.all') : t(typeOf(slotId).labelKey);
          return (
            <button
              key={slotId}
              type="button"
              data-events-panel-slot={slotId}
              aria-pressed={active}
              aria-label={label}
              title={label}
              onClick={() => setFilter(slotId)}
              style={{
                position: 'absolute',
                left: slot.cx - slot.r,
                top: slot.cy - slot.r,
                width: slot.r * 2,
                height: slot.r * 2,
                padding: 0,
                border: 0,
                borderRadius: '50%',
                background: 'transparent',
                cursor: 'pointer',
                display: 'grid',
                placeItems: 'center',
                color: slotId === 'all' ? PANEL.colors.gold : TONE_COLOR[typeOf(slotId).tone] ?? PANEL.colors.gold,
                filter: `drop-shadow(${PANEL.colors.shadow})`,
                boxShadow: active ? `0 0 10px 4px ${PANEL.colors.slotLit}, inset 0 0 8px ${PANEL.colors.slotLit}` : 'none',
              }}
            >
              {/* Director 2026-11-26: the slots are the type filters — each
               *  carries its type glyph so the filter reads at a glance. */}
              <HudGlyph iconId={slotId === 'all' ? 'chronicle' : typeOf(slotId).icon} label={label} size={15} />
            </button>
          );
        })}
        <div
          data-events-panel-rows=""
          style={{
            position: 'relative',
            height: rowCount * PANEL.art.rowH,
            overflowY: scrollable ? 'auto' : 'hidden',
            scrollbarWidth: 'thin',
          }}
        >
          {rows.length === 0 && (
            <div style={{ position: 'relative', width: PANEL.art.w, height: PANEL.art.rowH }}>
              <img src={PANEL.assets.row} alt="" draggable={false} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }} />
              <span
                style={{
                  position: 'absolute',
                  left: PANEL.row.field.x,
                  top: 0,
                  width: PANEL.row.field.w,
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  fontFamily: PANEL.fonts.body,
                  fontSize: hudPx(HUD_TYPE.secondary),
                  color: PANEL.colors.dim,
                  textShadow: PANEL.colors.shadow,
                  pointerEvents: 'none',
                }}
              >
                {t('gameFrame.events.empty')}
              </span>
            </div>
          )}
          {rows.map((event) => {
            const type = typeOf(event.typeId);
            const typeLabel = t(type.labelKey);
            return (
              <button
                key={event.id}
                type="button"
                data-events-panel-row={event.id}
                data-event-type={event.typeId}
                onClick={() => onSelect?.(event)}
                style={{
                  position: 'relative',
                  display: 'block',
                  width: PANEL.art.w,
                  height: PANEL.art.rowH,
                  padding: 0,
                  border: 0,
                  background: 'transparent',
                  cursor: onSelect ? 'pointer' : 'default',
                  textAlign: 'left',
                }}
              >
                <img src={PANEL.assets.row} alt="" draggable={false} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }} />
                <span
                  aria-hidden="true"
                  style={{
                    position: 'absolute',
                    left: PANEL.row.medallion.cx - PANEL.row.medallion.r,
                    top: PANEL.row.medallion.cy - PANEL.row.medallion.r,
                    width: PANEL.row.medallion.r * 2,
                    height: PANEL.row.medallion.r * 2,
                    display: 'grid',
                    placeItems: 'center',
                    color: TONE_COLOR[type.tone] ?? PANEL.colors.gold,
                    filter: `drop-shadow(${PANEL.colors.shadow})`,
                    pointerEvents: 'none',
                  }}
                >
                  <HudGlyph iconId={type.icon} label={typeLabel} size={PANEL.row.iconSizePx} />
                </span>
                <span
                  style={{
                    position: 'absolute',
                    left: PANEL.row.field.x,
                    top: 0,
                    width: PANEL.row.field.w,
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    columnGap: 8,
                    textShadow: PANEL.colors.shadow,
                    pointerEvents: 'none',
                  }}
                >
                  <span
                    style={{
                      flex: '1 1 auto',
                      minWidth: 0,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      fontFamily: PANEL.fonts.title,
                      fontSize: hudPx(HUD_TYPE.body),
                      fontWeight: PANEL.row.titleWeight,
                      color: PANEL.colors.text,
                    }}
                  >
                    {event.title}
                  </span>
                  <span
                    data-events-panel-row-countdown=""
                    style={{
                      flex: '0 0 auto',
                      fontFamily: PANEL.fonts.body,
                      fontSize: hudPx(HUD_TYPE.secondary),
                      fontWeight: PANEL.row.countdownWeight,
                      color: PANEL.colors.gold,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {countdownOf(event.daysLeft)}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
        <img src={PANEL.assets.bottom} alt="" draggable={false} style={{ display: 'block', width: PANEL.art.w, height: PANEL.art.bottomH, pointerEvents: 'none' }} />
      </div>
    </div>
  );
};
