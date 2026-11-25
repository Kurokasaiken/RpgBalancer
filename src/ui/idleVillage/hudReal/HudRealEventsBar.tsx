/**
 * HudRealEventsBar — collapsed docked Events surface, specular to the slim
 * Time bar. Director reference 2026-11-25: the right gem is red for dangers;
 * other colours denote other event categories. The painted gem carries the
 * tone, while the left medallion keeps a type glyph so the sign is never
 * colour-only.
 */
import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  DEFAULT_GAME_FRAME_CONFIG,
  type GameFrameEventLedgerConfig,
  type GameFrameEventTypeConfig,
} from '@/balancing/config/idleVillage/gameFrameConfig';
import { EVENTS_BAR_CONFIG, type EventsBarConfig } from '@/balancing/config/idleVillage/eventsBarConfig';
import { HUD_TYPE, hudPx } from './hudType';
import { HudGlyph } from '@/ui/idleVillage/components/gameFrame/hudIcons';
import type { HudEvent } from '@/ui/idleVillage/components/gameFrame/HudEventLedger';
import { selectEventsBarEvent } from '@/ui/idleVillage/components/gameFrame/eventsBarModel';

const FALLBACK_TYPE: Omit<GameFrameEventTypeConfig, 'id'> = {
  labelKey: 'gameFrame.events.types.other',
  icon: 'chronicle',
  tone: 'neutral',
  priority: 99,
};

export interface HudRealEventsBarProps {
  /** Upcoming events in the host's current order; titles already translated. */
  events: readonly HudEvent[];
  /** Whether the linked Events panel is open. */
  open?: boolean;
  /** Toggles the linked Events panel. */
  onToggle?: () => void;
  /** Ledger type registry — tones, icons and pinned collapsed types. */
  ledgerConfig?: GameFrameEventLedgerConfig;
  /** Visual/geometry contract of the signed bar art. */
  config?: EventsBarConfig;
}


/** Collapsed Events bar mounted in the top-right chrome reserve. */
export const HudRealEventsBar: React.FC<HudRealEventsBarProps> = ({
  events,
  open = false,
  onToggle,
  ledgerConfig = DEFAULT_GAME_FRAME_CONFIG.eventLedger,
  config: BAR = EVENTS_BAR_CONFIG,
}) => {
  const { t } = useTranslation('idleVillage');
  const selected = selectEventsBarEvent(events, ledgerConfig.pinTypesWhenCollapsed);
  const typeConfig = selected
    ? ledgerConfig.types.find((type) => type.id === selected.typeId) ?? { id: selected.typeId, ...FALLBACK_TYPE }
    : { id: 'empty', ...FALLBACK_TYPE };
  const tone = selected ? typeConfig.tone : 'neutral';
  const countdown = selected
    ? selected.daysLeft <= 0
      ? t('gameFrame.events.today')
      : t('gameFrame.events.daysLeft', { count: selected.daysLeft })
    : t('gameFrame.events.empty');
  const title = selected?.title ?? t('gameFrame.events.title');
  const typeLabel = t(typeConfig.labelKey);
  const actionLabel = open ? t('gameFrame.events.bar.close') : t('gameFrame.events.bar.open');
  const ariaLabel = selected
    ? t('gameFrame.events.bar.selectedAriaLabel', { count: events.length, type: typeLabel, title, countdown, action: actionLabel })
    : t('gameFrame.events.bar.ariaLabel', { count: events.length, action: actionLabel });
  const medallionLeft = BAR.medallion.cx - BAR.medallion.r;
  const medallionTop = BAR.medallion.cy - BAR.medallion.r;
  const gemLeft = BAR.gem.cx - BAR.gem.r;
  const gemTop = BAR.gem.cy - BAR.gem.r;
  const gemFilter = BAR.gemFilters[tone];

  return (
    <button
      type="button"
      data-hudreal-events-bar=""
      data-event-id={selected?.id ?? 'none'}
      data-event-type={selected?.typeId ?? 'none'}
      data-gem-tone={tone}
      data-events-count={events.length}
      aria-label={ariaLabel}
      aria-expanded={open}
      onClick={onToggle}
      style={{
        position: 'relative',
        width: BAR.art.w,
        height: BAR.art.h,
        padding: 0,
        border: 0,
        background: 'transparent',
        cursor: onToggle ? 'pointer' : 'default',
        userSelect: 'none',
        color: BAR.colors.text,
      }}
    >
      <style>{`
[data-hudreal-events-bar]:focus { outline: none; }
[data-hudreal-events-bar]:focus-visible { outline: 2px solid ${BAR.colors.focus}; outline-offset: 3px; }
[data-hudreal-events-bar]:not(:disabled):hover { filter: brightness(1.12); }
`}</style>
      <img src={BAR.asset} alt="" draggable={false} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', display: 'block', pointerEvents: 'none' }} />
      {gemFilter && (
        <img
          src={BAR.asset}
          alt=""
          draggable={false}
          data-events-gem-filter=""
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            display: 'block',
            pointerEvents: 'none',
            clipPath: `circle(${BAR.gem.r}px at ${BAR.gem.cx}px ${BAR.gem.cy}px)`,
            filter: gemFilter,
          }}
        />
      )}
      <span
        aria-hidden="true"
        style={{
          position: 'absolute',
          left: medallionLeft,
          top: medallionTop,
          width: BAR.medallion.r * 2,
          height: BAR.medallion.r * 2,
          display: 'grid',
          placeItems: 'center',
          color: BAR.colors.gold,
          filter: `drop-shadow(${BAR.colors.shadow})`,
          pointerEvents: 'none',
        }}
      >
        <HudGlyph iconId={typeConfig.icon} label={typeLabel} size={BAR.content.iconSizePx} />
      </span>
      <span
        style={{
          position: 'absolute',
          left: BAR.field.x,
          top: BAR.field.y,
          width: BAR.field.w,
          height: BAR.field.h,
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr) auto',
          gridTemplateRows: 'auto auto',
          alignItems: 'center',
          columnGap: BAR.content.horizontalGapPx,
          pointerEvents: 'none',
          textShadow: BAR.colors.shadow,
        }}
      >
        <span
          data-events-bar-title=""
          style={{
            gridColumn: '1 / -1',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            fontFamily: BAR.fonts.title,
            fontSize: hudPx(HUD_TYPE.body),
            fontWeight: BAR.content.titleWeight,
            letterSpacing: BAR.content.titleTrackingPx,
            color: BAR.colors.text,
          }}
        >
          {title}
        </span>
        <span
          data-events-bar-type=""
          style={{
            minWidth: 0,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            fontFamily: BAR.fonts.body,
            fontSize: hudPx(HUD_TYPE.caption),
            color: BAR.colors.dim,
          }}
        >
          {selected ? typeLabel : countdown}
        </span>
        {selected && (
          <span
            data-events-bar-countdown=""
            style={{
              minWidth: BAR.content.countdownMinWidthPx,
              textAlign: 'right',
              fontFamily: BAR.fonts.body,
              fontSize: hudPx(HUD_TYPE.secondary),
              fontWeight: BAR.content.countdownWeight,
              color: BAR.colors.gold,
              whiteSpace: 'nowrap',
            }}
          >
            {countdown}
          </span>
        )}
      </span>
      {open && (
        <span
          aria-hidden="true"
          style={{
            position: 'absolute',
            left: gemLeft,
            top: gemTop,
            width: BAR.gem.r * 2,
            height: BAR.gem.r * 2,
            borderRadius: '50%',
            boxShadow: `0 0 0 2px ${BAR.colors.gold}, 0 0 10px ${BAR.colors.glow}`,
            pointerEvents: 'none',
          }}
        />
      )}
    </button>
  );
};
