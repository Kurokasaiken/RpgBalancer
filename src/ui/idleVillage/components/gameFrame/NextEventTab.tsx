/**
 * NextEventTab — the centre tab of the top HUD (PLAN-067 HUD-3 = P1, R-234).
 *
 * One glyph, the event's name, the days left — what and when, nothing else. Why and what to do live in
 * the tooltip; a click brings the camera there. Calm events shrink the tab and soften it; with nothing to
 * say the tab does not render at all.
 */
import React from 'react';
import { useTranslation } from 'react-i18next';
import { HudPlaque } from '@/ui/idleVillage/skins/primitives';
import { HudGlyph } from './hudIcons';
import { HudTooltip } from './HudTooltip';
import { HUD_TONE_COLOR } from './hudTones';
import { DEFAULT_GAME_FRAME_CONFIG } from '@/balancing/config/idleVillage/gameFrameConfig';
import type { HudEvent } from './HudEventLedger';
import { nextEventModel } from './nextEvent';

export interface NextEventTabProps {
  events: readonly HudEvent[];
  /** Bring the camera to the event (the ledger's own handler). */
  onSelect?: (event: HudEvent) => void;
}

export const NextEventTab: React.FC<NextEventTabProps> = ({ events, onSelect }) => {
  const { t } = useTranslation('idleVillage');
  const { state, event } = nextEventModel(events);
  if (state === 'none' || !event) return null;
  const alarm = state === 'alarm';
  const typeCfg = DEFAULT_GAME_FRAME_CONFIG.eventLedger.types.find((c) => c.id === event.typeId);
  const tone = alarm ? HUD_TONE_COLOR.danger : 'var(--skin-label-primary)';
  const days = event.daysLeft <= 0 ? t('gameFrame.next.today') : t('gameFrame.next.days', { days: event.daysLeft });
  return (
    <HudTooltip label={event.title} hint={t(alarm ? 'gameFrame.next.hintAlarm' : 'gameFrame.next.hintQuiet', { days: event.daysLeft })} side="bottom">
      <button
        type="button"
        data-testid="hud-next-tab"
        data-state={state}
        aria-label={`${event.title} — ${days}`}
        onClick={() => onSelect?.(event)}
        style={{ all: 'unset', cursor: 'pointer', pointerEvents: 'auto', display: 'block', maxWidth: '100%' }}
      >
        <HudPlaque
          shape="hang"
          as="div"
          style={{
            display: 'flex', alignItems: 'center', gap: 10, padding: alarm ? '10px 18px' : '6px 16px',
            borderColor: alarm ? tone : undefined,
          }}
        >
          <span style={{ display: 'inline-flex', width: alarm ? 30 : 24, height: alarm ? 30 : 24, alignItems: 'center', justifyContent: 'center', borderRadius: 8, border: `1px solid color-mix(in srgb, ${tone} 70%, transparent)`, color: tone, flexShrink: 0 }}>
            <HudGlyph iconId={(typeCfg?.icon ?? 'chronicle') as never} label={event.title} size={alarm ? 18 : 15} />
          </span>
          <span style={{ font: `${alarm ? 500 : 400} ${alarm ? 16 : 14}px var(--skin-font-serif)`, fontStyle: alarm ? 'normal' : 'italic', color: alarm ? 'var(--skin-text-primary)' : 'var(--skin-text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', minWidth: 0 }}>
            {event.title}
          </span>
          <span style={{ font: '600 13px var(--skin-font-display)', letterSpacing: '0.06em', color: tone, border: `1px solid color-mix(in srgb, ${tone} 60%, transparent)`, borderRadius: 999, padding: '1px 10px', whiteSpace: 'nowrap', flexShrink: 0 }}>
            {days}
          </span>
        </HudPlaque>
      </button>
    </HudTooltip>
  );
};

export default NextEventTab;
