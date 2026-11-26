/**
 * HudRealEventsBar — collapsed docked Events surface.
 *
 * Director ruling 2026-11-26: this is not a forked Events frame. It consumes
 * the same reusable Time shell layers and slim geometry as HudRealTime,
 * mirrored geometrically. The central painted time controls are hidden by the
 * shell's black live-content well; Events then mounts its own reading inside.
 * The medallion keeps a type glyph while the gem disc carries tone, so the
 * sign is never colour-only.
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
import { TIME_SLIM_BAR } from './timeSlimGeometry';
import { resolveTimeShellLayout, TIME_SLIM_SHELL_EMPTY_ASSET } from './timeShellGeometry';
import { HudRealTimeShellLayers } from './HudRealTimeShell';

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
  /** Events live-content contract; the shell itself stays Time-owned. */
  config?: EventsBarConfig;
}

/**
 * Pick the event the collapsed bar represents. Pinned types (threat first in
 * the ledger config) outrank everything else; inside the chosen group the
 * nearest deadline wins. Rows still travelling into the ledger stay hidden
 * until their hand-off completes. Local by design: behavior is tested through
 * the rendered bar, preserving the fast-refresh component-only export.
 */
function selectEventsBarEvent(
  events: readonly HudEvent[],
  pinnedTypeIds: readonly string[],
): HudEvent | undefined {
  const visible = events.filter((event) => !event.arriving);
  if (visible.length === 0) return undefined;
  const pinned = visible.filter((event) => pinnedTypeIds.includes(event.typeId));
  const candidates = pinned.length > 0 ? pinned : visible;
  return candidates.reduce((best, event) => (event.daysLeft < best.daysLeft ? event : best), candidates[0]);
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
  /* Director 2026-11-25: compact visual countdown at the end of the single
   *  line (`5d`/`5g`); the aria string keeps the localized readable form. */
  const compactCountdown = countdown.replace(/(\d+)\s+(\p{L})/u, '$1$2');
  const title = selected?.title ?? t('gameFrame.events.title');
  const typeLabel = t(typeConfig.labelKey);
  const actionLabel = open ? t('gameFrame.events.bar.close') : t('gameFrame.events.bar.open');
  const ariaLabel = selected
    ? t('gameFrame.events.bar.selectedAriaLabel', { count: events.length, type: typeLabel, title, countdown, action: actionLabel })
    : t('gameFrame.events.bar.ariaLabel', { count: events.length, action: actionLabel });

  /* Shared shell, mirrored mathematically: the medallion moves to the right
   *  while live text below remains unmirrored. */
  const shellBar = TIME_SLIM_BAR;
  const baseShellDial = DEFAULT_GAME_FRAME_CONFIG.timeOfDay.dialSlim;
  const shellDial = {
    ...baseShellDial,
    frame: baseShellDial.frame ? { ...baseShellDial.frame, url: BAR.assets.medallionFrame } : undefined,
  };
  const shellLayout = resolveTimeShellLayout(shellBar, shellDial, true);
  const frameSize = shellDial.frame?.size ?? 0;
  const frameCenter = shellLayout.frameCenter ?? { x: shellLayout.dialCenter.cx, y: shellLayout.dialCenter.cy };
  const frameLeft = frameCenter.x - frameSize / 2;
  const frameTop = frameCenter.y - frameSize / 2;
  const gemClipRadius = shellDial.disc;
  const gemClipCenter = {
    x: frameSize / 2 + shellLayout.dialCenter.cx - frameCenter.x,
    y: frameSize / 2 + shellLayout.dialCenter.cy - frameCenter.y,
  };
  const gemFilter = BAR.gemFilters[tone];
  const well = shellLayout.contentWell;
  const fieldX = well.x + BAR.content.wellPaddingXPx;
  const fieldW = Math.max(0, frameLeft - BAR.content.medallionClearancePx - fieldX);
  const medallionIcon = BAR.content.medallionIconSizePx;

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
        width: shellBar.w,
        height: shellBar.h,
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
      <HudRealTimeShellLayers bar={shellBar} asset={TIME_SLIM_SHELL_EMPTY_ASSET} dial={shellDial} mirrored />
      <img
        src={BAR.assets.neutralGem}
        alt=""
        draggable={false}
        data-events-gem-tone={tone}
        style={{
          position: 'absolute',
          left: frameLeft,
          top: frameTop,
          width: frameSize,
          height: frameSize,
          display: 'block',
          pointerEvents: 'none',
          transform: 'scaleX(-1)',
          clipPath: `circle(${gemClipRadius}px at ${gemClipCenter.x}px ${gemClipCenter.y}px)`,
          filter: gemFilter || undefined,
        }}
      />
      {open && (
        <span
          aria-hidden="true"
          data-events-open-ring=""
          style={{
            position: 'absolute',
            left: shellLayout.dialCenter.cx - shellDial.wellR,
            top: shellLayout.dialCenter.cy - shellDial.wellR,
            width: shellDial.wellR * 2,
            height: shellDial.wellR * 2,
            borderRadius: '50%',
            boxShadow: `0 0 0 2px ${BAR.colors.gold}, 0 0 10px ${BAR.colors.glow}`,
            pointerEvents: 'none',
          }}
        />
      )}
      <span
        aria-hidden="true"
        data-events-medallion-glyph=""
        style={{
          position: 'absolute',
          left: shellLayout.dialCenter.cx - medallionIcon / 2,
          top: shellLayout.dialCenter.cy - medallionIcon / 2,
          width: medallionIcon,
          height: medallionIcon,
          display: 'grid',
          placeItems: 'center',
          color: BAR.colors.gold,
          filter: `drop-shadow(${BAR.colors.shadow})`,
          pointerEvents: 'none',
        }}
      >
        <HudGlyph iconId={typeConfig.icon} label={typeLabel} size={medallionIcon} />
      </span>
      <span
        style={{
          position: 'absolute',
          left: fieldX,
          top: well.y + BAR.content.wellPaddingYPx,
          width: fieldW,
          height: well.h - BAR.content.wellPaddingYPx * 2,
          display: 'flex',
          alignItems: 'center',
          columnGap: BAR.content.horizontalGapPx,
          pointerEvents: 'none',
          textShadow: BAR.colors.shadow,
        }}
      >
        <span
          data-events-bar-title=""
          style={{
            flex: '1 1 auto',
            minWidth: 0,
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
          {selected ? title : countdown}
        </span>
        <span
          data-events-bar-type=""
          style={{
            position: 'absolute',
            width: 1,
            height: 1,
            overflow: 'hidden',
            clipPath: 'inset(50%)',
            whiteSpace: 'nowrap',
          }}
        >
          {typeLabel}
        </span>
        {selected && (
          <span
            data-events-bar-countdown=""
            style={{
              flex: '0 0 auto',
              minWidth: BAR.content.countdownMinWidthPx,
              marginLeft: 'auto',
              paddingLeft: BAR.content.countdownGapPx,
              textAlign: 'right',
              fontFamily: BAR.fonts.body,
              fontSize: hudPx(HUD_TYPE.body),
              fontWeight: BAR.content.countdownWeight,
              color: BAR.colors.dim,
              fontVariantNumeric: 'tabular-nums',
              whiteSpace: 'nowrap',
            }}
          >
            {compactCountdown}
          </span>
        )}
      </span>
    </button>
  );
};
