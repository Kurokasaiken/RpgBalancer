import React, { useMemo, useState, type CSSProperties } from 'react';
import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react';
import { trackTelemetryEvent } from '@/analytics/telemetry/telemetryProvider';
import {
  DEFAULT_GAME_FRAME_CONFIG,
  type GameFrameEventLedgerConfig,
  type GameFrameEventTypeConfig,
} from '@/balancing/config/idleVillage/gameFrameConfig';
import { HudGlyph } from './hudIcons';
import { HUD_TONE_COLOR as TONE_COLOR } from './hudTones';
import { HudPanel, HudPlaque } from '@/ui/idleVillage/skins/primitives';
import { useHudPanelDrag } from './useHudPanelDrag';
import { useHudMaterial } from './useHudMaterial';

/** One upcoming event, as the ledger shows it. `title` arrives already translated. */
export interface HudEvent {
  id: string;
  /** Must match an id in `eventLedger.types`; unknown ids render with a neutral fallback. */
  typeId: string;
  title: string;
  /** Whole days until it happens; 0 or less reads as "today". */
  daysLeft: number;
  /** Where it happens on the map, as fractions of the world canvas (0-1); lets the host focus the camera on it. */
  at?: { x: number; y: number };
}

export type HudEventSort = 'due' | 'type';

export interface HudEventLedgerProps {
  events: HudEvent[];
  config?: GameFrameEventLedgerConfig;
  /** Telemetry context (where the ledger is mounted). */
  context?: string;
  style?: CSSProperties;
  /** Adds a close (X) button; the host decides how the panel comes back. */
  onClose?: () => void;
  /** Makes rows actionable (e.g. the host pans the camera to the event). */
  onSelect?: (event: HudEvent) => void;
}

const FALLBACK_TYPE: Omit<GameFrameEventTypeConfig, 'id'> = {
  labelKey: 'gameFrame.events.types.other',
  icon: 'chronicle',
  tone: 'neutral',
  priority: 99,
};

/**
 * The surface is `HudPanel` (the HUD's floating-panel primitive — chamfered
 * silhouette, gold filet, filigree); only layout lives here, and each row keeps
 * its own thin-bordered strip.
 */
const PANEL_STYLE: CSSProperties = {
  width: 300,
  display: 'flex',
  flexDirection: 'column',
  gap: 6,
  padding: '9px 12px 10px',
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
  border: '1px solid var(--skin-surface-border, rgba(223,184,87,0.16))',
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
  onClose,
  onSelect,
}) => {
  const { t } = useTranslation('idleVillage');
  const [sort, setSort] = useState<HudEventSort>(config.defaultSort);
  const [expanded, setExpanded] = useState(false);
  const { panelStyle, handleProps } = useHudPanelDrag();
  const Surface = useHudMaterial() === 'lacquer' ? HudPlaque : HudPanel;

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

  // Collapsed: pinned types (threats) always make the cut, the remaining rows go to the most pressing; sort order is kept.
  const visible = useMemo(() => {
    if (expanded) return sorted;
    const shown = new Set<string>();
    for (const event of sorted) {
      if (shown.size < config.maxVisibleRows && config.pinTypesWhenCollapsed.includes(event.typeId)) shown.add(event.id);
    }
    for (const event of sorted) {
      if (shown.size < config.maxVisibleRows) shown.add(event.id);
    }
    return sorted.filter((event) => shown.has(event.id));
  }, [expanded, sorted, config.maxVisibleRows, config.pinTypesWhenCollapsed]);

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
      <li
        key={event.id}
        style={{
          ...STRIP_STYLE,
          // Severity reads before the words: danger rows carry a tone edge and a faint wash.
          borderInlineStart: type.tone === 'danger' ? `3px solid ${TONE_COLOR.danger}` : STRIP_STYLE.border,
          background:
            type.tone === 'danger' && urgent
              ? `color-mix(in srgb, ${TONE_COLOR.danger} 14%, transparent)`
              : STRIP_STYLE.background,
          cursor: onSelect ? 'pointer' : undefined,
        }}
        data-event-type={event.typeId}
        data-urgent={urgent || undefined}
        {...(onSelect
          ? {
              role: 'button' as const,
              tabIndex: 0,
              onClick: () => onSelect(event),
              onKeyDown: (e: React.KeyboardEvent) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onSelect(event);
                }
              },
            }
          : {})}
      >
        <HudGlyph iconId={type.icon} label={t(type.labelKey)} size={14} style={{ color: TONE_COLOR[type.tone] }} />
        <span
          title={event.title}
          style={{
            fontFamily: FONT_DISPLAY,
            fontSize: 13,
            fontWeight: 700,
            color: 'var(--skin-text-primary, #F5F2E8)',
            textShadow: '0 1px 2px rgba(0,0,0,0.7)',
            // Two lines before it gives up: the name is the part that matters.
            display: '-webkit-box',
            WebkitBoxOrient: 'vertical',
            WebkitLineClamp: 2,
            overflow: 'hidden',
            lineHeight: 1.2,
          }}
        >
          {event.title}
        </span>
        <span
          style={{
            fontFamily: FONT_SANS,
            fontSize: 12,
            fontWeight: 600,
            letterSpacing: '0.06em',
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
    <Surface as="section" aria-label={t('gameFrame.events.title')} style={{ ...PANEL_STYLE, ...style, ...panelStyle }}>
      <div
        {...handleProps}
        title={t('gameFrame.panel.dragHint')}
        style={{ ...handleProps.style, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'nowrap' }}
      >
        <span
          style={{
            fontFamily: FONT_DISPLAY,
            fontSize: 12,
            fontWeight: 600,
            letterSpacing: '0.2em',
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
          data-hud-controls=""
          style={{ display: 'flex', gap: 4, marginLeft: 'auto', alignItems: 'center' }}
        >
          {sortOptions.map((option) => {
            const active = option.id === sort;
            return (
              <button
                key={option.id}
                type="button"
                aria-pressed={active}
                onClick={() => changeSort(option.id)}
              >
                {t(option.labelKey)}
              </button>
            );
          })}
          {onClose && (
            <button type="button" onClick={onClose} aria-label={t('gameFrame.panels.close')} title={t('gameFrame.panels.close')}>
              <X />
            </button>
          )}
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
                  fontSize: 12,
                  fontWeight: 600,
                  letterSpacing: '0.16em',
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
        <div data-hud-controls="" style={{ display: 'flex', justifyContent: 'center' }}>
          <button
            type="button"
            onClick={toggleExpanded}
            aria-expanded={expanded}
          >
            {expanded
              ? t('gameFrame.events.showLess')
              : t('gameFrame.events.showMore', { count: sorted.length })}
          </button>
        </div>
      )}
    </Surface>
  );
};

export default HudEventLedger;
