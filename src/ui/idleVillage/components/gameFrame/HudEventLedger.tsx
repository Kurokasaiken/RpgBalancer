import React, { useMemo, useState, type CSSProperties } from 'react';
import { useTranslation } from 'react-i18next';
import { GripVertical } from 'lucide-react';
import { trackTelemetryEvent } from '@/analytics/telemetry/telemetryProvider';
import {
  DEFAULT_GAME_FRAME_CONFIG,
  type GameFrameEventLedgerConfig,
  type GameFrameEventTypeConfig,
} from '@/balancing/config/idleVillage/gameFrameConfig';
import { HudGlyph } from './hudIcons';
import { HUD_TONE_COLOR as TONE_COLOR } from './hudTones';
import { useHudPanelDrag } from './useHudPanelDrag';

/** One upcoming event, as the ledger shows it. `title` arrives already translated. */
export interface HudEvent {
  id: string;
  /** Must match an id in `eventLedger.types`; unknown ids render with a neutral fallback. */
  typeId: string;
  title: string;
  /** Whole days until it happens; 0 or less reads as "today". */
  daysLeft: number;
}

export type HudEventSort = 'due' | 'type';

export interface HudEventLedgerProps {
  events: HudEvent[];
  config?: GameFrameEventLedgerConfig;
  /** Telemetry context (where the ledger is mounted). */
  context?: string;
  style?: CSSProperties;
}

const FALLBACK_TYPE: Omit<GameFrameEventTypeConfig, 'id'> = {
  labelKey: 'gameFrame.events.types.other',
  icon: 'chronicle',
  tone: 'neutral',
  priority: 99,
};

/**
 * Material shared with the compact roster (`DragTestContainer` density="compact" +
 * `WanderlustRosterCard` strips), so the two HUD panels read as one family: a dark
 * rounded slab with a faint gold filet, and each row its own thin-bordered strip.
 */
const PANEL_STYLE: CSSProperties = {
  width: 300,
  display: 'flex',
  flexDirection: 'column',
  gap: 6,
  padding: '8px 10px',
  borderRadius: 14,
  background: 'linear-gradient(180deg, rgba(3,2,2,0.95) 0%, rgba(6,4,3,0.98) 100%)',
  border: '1px solid rgba(223,184,87,0.18)',
  boxShadow: 'inset 0 1px 0 rgba(216,177,62,0.08), 0 4px 20px rgba(0,0,0,0.6)',
  pointerEvents: 'auto',
};
const STRIP_STYLE: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '16px minmax(0, 1fr) auto',
  alignItems: 'center',
  gap: 8,
  padding: '4px 8px',
  borderRadius: 8,
  background: 'var(--skin-surface-bg, linear-gradient(160deg, rgba(216,177,62,0.05) 0%, rgba(20,12,7,0.2) 45%, rgba(6,4,3,0.3) 100%))',
  border: '1px solid rgba(223,184,87,0.16)',
  listStyle: 'none',
};
const FONT_DISPLAY = 'var(--wl-font-display, "Cinzel", "Trajan Pro", serif)';
const FONT_SANS = 'var(--wl-font-sans, system-ui, sans-serif)';

/**
 * HUD event ledger — the "what is coming" list: several upcoming events in a small,
 * ordered panel, sortable by due date or grouped by event type. Replaces the single
 * hanging reminder tag. Panel, header and row strips mirror the compact roster.
 *
 * Signal strength follows consequence: the type sets the row's tone, and only rows
 * within `urgentWithinDays` light their countdown, so the panel stays quiet until
 * something actually needs attention.
 */
export const HudEventLedger: React.FC<HudEventLedgerProps> = ({
  events,
  config = DEFAULT_GAME_FRAME_CONFIG.eventLedger,
  context = 'game_frame',
  style,
}) => {
  const { t } = useTranslation('idleVillage');
  const [sort, setSort] = useState<HudEventSort>(config.defaultSort);
  const [expanded, setExpanded] = useState(false);
  const { panelStyle, handleProps } = useHudPanelDrag();

  const typeById = useMemo(() => new Map(config.types.map((type) => [type.id, type])), [config.types]);
  const typeOf = (typeId: string): GameFrameEventTypeConfig =>
    typeById.get(typeId) ?? { id: typeId, ...FALLBACK_TYPE };

  const sorted = useMemo(() => {
    const priority = (e: HudEvent) => typeById.get(e.typeId)?.priority ?? FALLBACK_TYPE.priority;
    return [...events].sort((a, b) =>
      sort === 'due'
        ? a.daysLeft - b.daysLeft || priority(a) - priority(b)
        : priority(a) - priority(b) || a.daysLeft - b.daysLeft,
    );
  }, [events, sort, typeById]);

  const visible = expanded ? sorted : sorted.slice(0, config.maxVisibleRows);

  const changeSort = (next: HudEventSort) => {
    if (next === sort) return;
    setSort(next);
    trackTelemetryEvent('event_ledger_sort', {
      eventType: 'event_ledger_sort',
      data: { sort: next, eventCount: events.length },
      context,
      metadata: { previousSort: sort },
    });
  };

  const toggleExpanded = () => {
    const next = !expanded;
    setExpanded(next);
    trackTelemetryEvent('event_ledger_expand', {
      eventType: 'event_ledger_expand',
      data: { expanded: next, eventCount: events.length },
      context,
      metadata: { sort },
    });
  };

  const strip = (event: HudEvent) => {
    const type = typeOf(event.typeId);
    const urgent = event.daysLeft <= config.urgentWithinDays;
    return (
      <li key={event.id} style={STRIP_STYLE} data-event-type={event.typeId} data-urgent={urgent || undefined}>
        <HudGlyph iconId={type.icon} label={t(type.labelKey)} size={14} style={{ color: TONE_COLOR[type.tone] }} />
        <span
          title={event.title}
          style={{
            fontFamily: FONT_DISPLAY,
            fontSize: 12,
            fontWeight: 700,
            color: 'var(--skin-text-primary, #F5F2E8)',
            textShadow: '0 1px 2px rgba(0,0,0,0.7)',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {event.title}
        </span>
        <span
          style={{
            fontFamily: FONT_SANS,
            fontSize: 9,
            fontWeight: 600,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            fontVariantNumeric: 'tabular-nums',
            whiteSpace: 'nowrap',
            color: urgent ? TONE_COLOR[type.tone] : 'var(--skin-label-tertiary, #9a8246)',
          }}
        >
          {event.daysLeft <= 0
            ? t('gameFrame.events.today')
            : t('gameFrame.events.daysLeft', { count: event.daysLeft })}
        </span>
      </li>
    );
  };
  const stripList = (list: HudEvent[]) => (
    <ul style={{ margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>{list.map(strip)}</ul>
  );

  // `visible` follows `sorted`, so in type mode the groups come out in priority order.
  const groups: [string, HudEvent[]][] = [];
  if (sort === 'type') {
    for (const event of visible) {
      const last = groups[groups.length - 1];
      if (last && last[0] === event.typeId) last[1].push(event);
      else groups.push([event.typeId, [event]]);
    }
  }

  const sortOptions: { id: HudEventSort; labelKey: string }[] = [
    { id: 'due', labelKey: 'gameFrame.events.sort.due' },
    { id: 'type', labelKey: 'gameFrame.events.sort.type' },
  ];

  return (
    <section aria-label={t('gameFrame.events.title')} style={{ ...PANEL_STYLE, ...style, ...panelStyle }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'nowrap' }}>
        <span
          {...handleProps}
          role="img"
          aria-label={t('gameFrame.events.move')}
          title={t('gameFrame.events.move')}
          style={{ ...handleProps.style, display: 'inline-flex', color: 'var(--skin-icon-color, #dfb857)' }}
        >
          <GripVertical width={12} height={12} aria-hidden="true" />
        </span>
        <span
          style={{
            fontFamily: FONT_DISPLAY,
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: '0.24em',
            textTransform: 'uppercase',
            color: 'var(--skin-title-color, #f0cf6a)',
            whiteSpace: 'nowrap',
          }}
        >
          {t('gameFrame.events.title')}
          <span style={{ marginLeft: 8, fontVariantNumeric: 'tabular-nums' }}>{events.length}</span>
        </span>
        <div
          role="group"
          aria-label={t('gameFrame.events.sort.ariaLabel')}
          data-roster-controls="compact"
          style={{ display: 'flex', gap: 3, marginLeft: 'auto', alignItems: 'center' }}
        >
          {sortOptions.map((option) => {
            const active = option.id === sort;
            return (
              <button
                key={option.id}
                type="button"
                aria-pressed={active}
                onClick={() => changeSort(option.id)}
                style={{
                  opacity: active ? 1 : 0.55,
                  color: active ? 'var(--skin-title-color, #f0cf6a)' : 'var(--skin-label-primary, #c9a84e)',
                  borderColor: active ? 'var(--skin-icon-color, #d8b13e)' : undefined,
                }}
              >
                {t(option.labelKey)}
              </button>
            );
          })}
        </div>
      </div>

      {events.length === 0 ? (
        <p style={{ margin: 0, fontSize: 12, color: 'var(--skin-label-tertiary, #9a8246)' }}>
          {t('gameFrame.events.empty')}
        </p>
      ) : sort === 'due' ? (
        stripList(visible)
      ) : (
        groups.map(([typeId, list]) => {
          const type = typeOf(typeId);
          return (
            <div key={typeId} style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <span
                style={{
                  fontFamily: FONT_SANS,
                  fontSize: 9,
                  fontWeight: 600,
                  letterSpacing: '0.2em',
                  textTransform: 'uppercase',
                  color: TONE_COLOR[type.tone],
                  opacity: 0.85,
                  paddingLeft: 2,
                }}
              >
                {t(type.labelKey)}
              </span>
              {stripList(list)}
            </div>
          );
        })
      )}

      {sorted.length > config.maxVisibleRows && (
        <div data-roster-controls="compact" style={{ display: 'flex', justifyContent: 'center' }}>
          <button
            type="button"
            onClick={toggleExpanded}
            aria-expanded={expanded}
            style={{ color: 'var(--skin-label-primary, #c9a84e)', padding: '2px 10px' }}
          >
            {expanded
              ? t('gameFrame.events.showLess')
              : t('gameFrame.events.showMore', { count: sorted.length })}
          </button>
        </div>
      )}
    </section>
  );
};

export default HudEventLedger;
