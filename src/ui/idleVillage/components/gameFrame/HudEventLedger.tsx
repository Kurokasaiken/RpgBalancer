import React, { useMemo, useState, type CSSProperties } from 'react';
import { useTranslation } from 'react-i18next';
import { EngravedIcon } from './engravedIcons';
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
  /** The row is mounted but not yet shown: an announcement card is still travelling to it and hands over on arrival. */
  arriving?: boolean;
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
 * its own thin-bordered strip. Every measure is a Roster token (guide §4.2): the
 * ledger must read as the same family as the Roster panel, not as a second one.
 */
const PANEL_STYLE: CSSProperties = {
  width: 300,
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--skin-hud-stack-gap)',
  padding: 'var(--skin-hud-panel-padding)',
  pointerEvents: 'auto',
};
const STRIP_STYLE: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'var(--skin-hud-control-icon-size) minmax(0, 1fr) auto',
  alignItems: 'center',
  gap: 'var(--skin-hud-row-column-gap)',
  padding: 'var(--skin-hud-row-padding)',
  borderRadius: 'var(--skin-hud-row-radius)',
  background: 'var(--skin-surface-bg)',
  border: '1px solid var(--skin-hud-row-filet)',
  listStyle: 'none',
  transition: 'border-color 120ms ease-out',
};
const FONT_DISPLAY = 'var(--skin-font-display)';
const FONT_SERIF = 'var(--skin-font-serif)';
const FONT_SANS = 'var(--skin-font-sans)';
/** Short label (countdown, group): the Roster's `caps` scale without the capitals; capitals are for the header and filters only. */
const LABEL_STYLE: CSSProperties = {
  fontFamily: FONT_SANS,
  fontSize: 'var(--skin-hud-caps-size)',
  fontWeight: 'var(--skin-hud-caps-weight)' as CSSProperties['fontWeight'],
  letterSpacing: 'var(--skin-hud-caps-tracking)',
};

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
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [focusedId, setFocusedId] = useState<string | null>(null);
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
    const actionable = Boolean(onSelect);
    const type = typeOf(event.typeId);
    const urgent = event.daysLeft <= config.urgentWithinDays;
    return (
      <li
        key={event.id}
        style={{
          ...STRIP_STYLE,
          // Severity reads before the words: danger rows carry a tone edge and a faint wash.
          borderInlineStart: type.tone === 'danger' ? `var(--skin-hud-bar-gap) solid ${TONE_COLOR.danger}` : STRIP_STYLE.border,
          ...(hoveredId === event.id || focusedId === event.id ? { borderColor: 'var(--skin-hud-row-filet-hover)' } : null),
          background:
            type.tone === 'danger' && urgent
              ? `color-mix(in srgb, ${TONE_COLOR.danger} 14%, transparent)`
              : STRIP_STYLE.background,
          cursor: onSelect ? 'pointer' : undefined,
          // Keeps its place in the list (the card measures it) but stays invisible until the card arrives.
          opacity: event.arriving ? 0 : 1,
          transition: 'opacity 280ms ease-out',
        }}
        data-event-id={event.id}
        data-event-type={event.typeId}
        data-urgent={urgent || undefined}
        onMouseEnter={actionable ? () => setHoveredId(event.id) : undefined}
        onMouseLeave={actionable ? () => setHoveredId(null) : undefined}
        onFocus={actionable ? (e) => setFocusedId(e.currentTarget.matches(':focus-visible') ? event.id : null) : undefined}
        onBlur={actionable ? () => setFocusedId(null) : undefined}
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
        <HudGlyph
          iconId={type.icon}
          label={t(type.labelKey)}
          style={{ color: TONE_COLOR[type.tone], width: 'var(--skin-hud-control-icon-size)', height: 'var(--skin-hud-control-icon-size)' }}
        />
        <span
          title={event.title}
          style={{
            fontFamily: FONT_SERIF,
            fontSize: 'var(--skin-hud-name-size)',
            fontWeight: 500,
            color: 'var(--skin-body-color)',
            // Two lines before it gives up (the full text is in the title): the name is the part that matters.
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
            ...LABEL_STYLE,
            fontVariantNumeric: 'tabular-nums',
            whiteSpace: 'nowrap',
            color: urgent ? TONE_COLOR[type.tone] : 'var(--skin-text-secondary)',
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
    <ul style={{ margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 'var(--skin-hud-row-gap)' }}>{list.map(strip)}</ul>
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
        style={{ ...handleProps.style, display: 'flex', alignItems: 'center', gap: 'var(--skin-hud-stack-gap)', flexWrap: 'nowrap' }}
      >
        <span
          style={{
            fontFamily: FONT_DISPLAY,
            fontSize: 'var(--skin-hud-title-size)',
            fontWeight: 'var(--skin-hud-title-weight)' as CSSProperties['fontWeight'],
            letterSpacing: 'var(--skin-hud-title-tracking)',
            color: 'var(--skin-title-color)',
            whiteSpace: 'nowrap',
          }}
        >
          {t('gameFrame.events.title')}
          <span style={{ marginLeft: 'var(--skin-hud-stack-gap)', fontVariantNumeric: 'tabular-nums', color: 'var(--skin-body-color)' }}>{events.length}</span>
        </span>
        <div
          role="group"
          aria-label={t('gameFrame.events.sort.ariaLabel')}
          data-hud-controls=""
          style={{ display: 'flex', gap: 'var(--skin-hud-control-gap)', marginLeft: 'auto', alignItems: 'center' }}
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
              <EngravedIcon id="cmd-close" />
            </button>
          )}
        </div>
      </div>

      {events.length === 0 ? (
        <p style={{ margin: 0, fontFamily: FONT_SERIF, fontSize: 'var(--skin-hud-name-size)', lineHeight: 1.4, color: 'var(--skin-body-color)' }}>
          {t('gameFrame.events.empty')}
        </p>
      ) : sort === 'due' ? (
        stripList(visible)
      ) : (
        groups.map(([typeId, list]) => {
          const type = typeOf(typeId);
          return (
            <div key={typeId} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--skin-hud-bar-gap)' }}>
              <span style={{ ...LABEL_STYLE, color: TONE_COLOR[type.tone], paddingLeft: 'var(--skin-hud-control-gap)' }}>
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
