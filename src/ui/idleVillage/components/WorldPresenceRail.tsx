import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import {
  eventReminderTokens,
  bandForDays,
  REMINDER_BANDS,
  type ReminderBand,
} from '@/balancing/config/idleVillage/eventReminderTokens';

const { gilded } = eventReminderTokens;

/**
 * One active, persistent world presence tracked by the rail (an invasion,
 * a blight, anything with a countdown to a consequence).
 *
 * This is deliberately NOT a toast: no `durationMs`, no auto-dismiss. A row
 * lives exactly as long as `daysLeftValue > 0`, and is provided/removed by
 * whoever owns the presence — the rail only renders what it is given, sorted
 * by urgency.
 */
export interface WorldPresenceRailItem {
  id: string;
  /** Short caps title, e.g. "INVASION" — already translated by the caller. */
  title: string;
  /** Days remaining. Drives sort order, band, and pip fill. */
  daysLeftValue: number;
  /** Pip count (the countdown's original length). Defaults to 5. */
  totalDays?: number;
  /** Overrides the band computed from `daysLeftValue` (distant/closing/imminent). */
  band?: ReminderBand;
  /** Opens the detail view for this presence. */
  onClick?: () => void;
}

export interface WorldPresenceRailProps {
  /** Active presences. The rail sorts by `daysLeftValue` ascending — it never trusts caller order. */
  items: WorldPresenceRailItem[];
  /** Rows shown before collapsing the rest into a "+N" row. Defaults to 3. */
  maxVisible?: number;
  /**
   * Fired on pointer enter/leave of a row with the item's id (or `null` on
   * leave) — the hook for "hover a row, the matching presence resonates on
   * the map." The rail itself never touches the map.
   */
  onHoverItem?: (id: string | null) => void;
  style?: React.CSSProperties;
}

const ROW_WIDTH = 236;
const ROW_HEIGHT = 52;
const PIP_GAP = 3;

/**
 * A single countdown row: glyph + number + title, with a segmented pip track
 * underneath. Pips are discrete (one empties per day), not a continuous bar —
 * a continuous fill reads as motion and stops being noticed; a pip going
 * dark is a discrete state change, which is what actually gets seen.
 */
function PresenceRow({
  item,
  onHover,
}: {
  item: WorldPresenceRailItem;
  onHover: (hovering: boolean) => void;
}): JSX.Element {
  const { t } = useTranslation('idleVillage');
  const band = item.band ?? bandForDays(item.daysLeftValue);
  const bandDef = REMINDER_BANDS[band];
  const bandStateKey = band === 'imminent' ? 'active' : band === 'closing' ? 'urgent' : 'calm';
  const stateTokens = eventReminderTokens.states[bandStateKey];
  const totalDays = item.totalDays ?? 5;
  const filledPips = Math.max(0, Math.min(totalDays, item.daysLeftValue));

  return (
    <motion.button
      type="button"
      onClick={item.onClick}
      onPointerEnter={() => onHover(true)}
      onPointerLeave={() => onHover(false)}
      whileHover={{ x: -2 }}
      transition={{ duration: 0.15 }}
      style={{
        position: 'relative',
        width: ROW_WIDTH,
        height: ROW_HEIGHT,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        gap: 6,
        padding: '6px 10px',
        border: `1px solid ${stateTokens.plaqueBorder}`,
        borderRadius: 8,
        background: 'linear-gradient(135deg, rgba(8,18,31,0.94) 0%, rgba(2,10,14,0.97) 100%)',
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,.06), 0 4px 10px rgba(0,0,0,.4)',
        cursor: item.onClick ? 'pointer' : 'default',
        textAlign: 'left',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
        <span
          aria-hidden="true"
          style={{ fontSize: 12, color: stateTokens.plaqueText, lineHeight: 1, flexShrink: 0 }}
        >
          {bandDef.glyph}
        </span>
        <span
          style={{
            fontSize: 20,
            fontWeight: 700,
            lineHeight: 1,
            color: '#f5ede0',
            fontVariantNumeric: 'tabular-nums',
            textShadow: '0 1px 3px rgba(0,0,0,.8)',
            flexShrink: 0,
          }}
        >
          {item.daysLeftValue}
        </span>
        <span
          style={{
            fontSize: 11,
            letterSpacing: '0.08em',
            color: gilded.frameStroke,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            fontFamily: 'var(--skin-font-display, inherit)',
          }}
        >
          {item.title}
        </span>
      </div>

      <div
        aria-label={t(`world.goblinInvasion.reminder.days_${item.daysLeftValue === 1 ? 'singular' : 'plural'}`)}
        style={{ display: 'flex', gap: PIP_GAP, paddingLeft: 20 }}
      >
        {Array.from({ length: totalDays }, (_, i) => (
          <span
            key={i}
            aria-hidden="true"
            style={{
              flex: 1,
              height: 3,
              borderRadius: 2,
              background: i < filledPips ? stateTokens.plaqueText : 'rgba(255,255,255,0.12)',
              transition: 'background 0.4s ease',
            }}
          />
        ))}
      </div>
    </motion.button>
  );
}

/**
 * Persistent HUD rail for active world presences (invasions, blights — anything
 * with a countdown). Screen-space, not map-space: it does not scale with
 * camera zoom and carries no text on the map itself. Docks to a screen corner
 * (a carved frame's inner edge, once one exists to dock to).
 *
 * Deliberately NOT built on `useHUDNotifications`: that system is a transient
 * toast queue (auto-dismiss, priority fixed at insertion). This list is
 * persistent and re-sorts live as `daysLeftValue` ticks down — a different
 * data shape, not a styling variant of the same one.
 */
export const WorldPresenceRail: React.FC<WorldPresenceRailProps> = ({
  items,
  maxVisible = 3,
  onHoverItem,
  style,
}) => {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const sorted = useMemo(
    () => [...items].sort((a, b) => a.daysLeftValue - b.daysLeftValue),
    [items],
  );
  const visible = sorted.slice(0, maxVisible);
  const overflowCount = sorted.length - visible.length;

  const handleHover = (id: string, hovering: boolean) => {
    const next = hovering ? id : null;
    setHoveredId(next);
    onHoverItem?.(next);
  };

  if (sorted.length === 0) return null;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
        pointerEvents: 'none',
        ...style,
      }}
    >
      <AnimatePresence initial={false}>
        {visible.map((item) => (
          <motion.div
            key={item.id}
            layout
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 12 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            style={{
              pointerEvents: 'auto',
              outline: hoveredId === item.id ? `1px solid ${gilded.frameStroke}` : 'none',
              borderRadius: 8,
            }}
          >
            <PresenceRow item={item} onHover={(hovering) => handleHover(item.id, hovering)} />
          </motion.div>
        ))}
      </AnimatePresence>

      {overflowCount > 0 && (
        <div
          style={{
            width: ROW_WIDTH,
            padding: '4px 10px',
            fontSize: 11,
            letterSpacing: '0.06em',
            color: 'rgba(240,213,139,0.7)',
            textAlign: 'center',
            pointerEvents: 'none',
          }}
        >
          +{overflowCount}
        </div>
      )}
    </div>
  );
};

export default WorldPresenceRail;
