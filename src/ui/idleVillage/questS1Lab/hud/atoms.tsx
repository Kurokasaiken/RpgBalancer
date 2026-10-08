/**
 * questS1Lab/hud/atoms — small shared pieces for the quest cockpit HUD.
 *
 * PLAN-024: everything here speaks the "Lacquer Atlas" language
 * (src/docs/docs/design/hud_component_guide.md): colours come only from
 * `--skin-*`/`--skin-hud-*` tokens, text never under 12px
 * (`questLabPresentation.type`), display font for labels, serif for phrases.
 */

import React, { useEffect, useState, type CSSProperties } from 'react';
import { useTranslation } from 'react-i18next';
import { DEFAULT_QUEST_LAB_PACING } from '@/balancing/config/idleVillage/quests/questLabPacing';
import { DEFAULT_QUEST_LAB_PRESENTATION as PRES } from '@/balancing/config/idleVillage/quests/questLabPresentation';

/** Semantic tone → skin token. Colour-plus-shape rule (guide §5): these are
 *  paired with an icon/text in the chip callers, never used alone. */
export const TONE = {
  label: 'var(--skin-label-primary)',
  text: 'var(--skin-text-primary)',
  secondary: 'var(--skin-text-secondary)',
  muted: 'var(--skin-text-muted)',
  accent: 'var(--skin-icon-accent)',
  ok: 'var(--skin-status-met)',
  warn: 'var(--skin-status-unmet)',
  danger: 'var(--skin-status-wound)',
  death: 'var(--skin-status-death)',
} as const;
export type Tone = keyof typeof TONE;

/** Chronicle log entry tone by kind. */
export const LOG_TONE: Record<string, Tone> = {
  CHECK: 'accent',
  WOUND: 'warn',
  DEATH: 'danger',
  DEATH_SAVE: 'ok',
  INTERCEPT: 'death',
  LOOT: 'label',
  INFO: 'secondary',
  HARM: 'warn',
  QUEST_END: 'label',
  RETREAT: 'secondary',
  CHOICE: 'muted',
  NODE: 'label',
};

/** Compact stat line — stats drive approach choice, so they must be readable. */
export const statLine = (m: { stats: Record<string, number> }) =>
  `F${m.stats.str} · C${m.stats.con} · A${m.stats.agi} · P${m.stats.perc} · I${m.stats.int} · H${m.stats.cha}`;

/** Short stat codes used across chips and coverage hints. */
export const STAT_SHORT: Record<string, string> = {
  str: 'FOR', con: 'COS', agi: 'AGI', perc: 'PER', int: 'INT', cha: 'CAR',
};

/** Deep-teal scrim pieces — the guide's shadow colour, never grey/brown. */
export const SCRIM = {
  /** Opaque seat under text painted over the scene art. */
  chipBg: 'color-mix(in srgb, var(--skin-hud-lacquer-deep) 86%, transparent)',
  edgeLeft:
    'linear-gradient(90deg, var(--skin-hud-lacquer-deep) 0%, color-mix(in srgb, var(--skin-hud-lacquer-deep) 55%, transparent) 40%, transparent 100%)',
  edgeRight:
    'linear-gradient(270deg, var(--skin-hud-lacquer-deep) 0%, color-mix(in srgb, var(--skin-hud-lacquer-deep) 55%, transparent) 40%, transparent 100%)',
  bottom:
    'linear-gradient(0deg, var(--skin-hud-lacquer-deep) 0%, color-mix(in srgb, var(--skin-hud-lacquer-deep) 60%, transparent) 55%, transparent 100%)',
  top:
    'linear-gradient(180deg, color-mix(in srgb, var(--skin-hud-lacquer-deep) 85%, transparent) 0%, transparent 100%)',
} as const;

/** Small bordered chip — the cockpit's single atom for tagged values.
 *  Colours derive from tokens via color-mix; height/track from config. */
export const HudChip: React.FC<{
  tone?: Tone;
  title?: string;
  className?: string;
  style?: CSSProperties;
  children: React.ReactNode;
}> = ({ tone = 'label', title, className, style, children }) => (
  <span
    title={title}
    className={className}
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 5,
      padding: '2px 9px',
      borderRadius: 999,
      border: `1px solid color-mix(in srgb, ${TONE[tone]} 55%, transparent)`,
      background: `color-mix(in srgb, ${TONE[tone]} 12%, var(--skin-hud-lacquer-deep))`,
      color: TONE[tone],
      fontSize: PRES.type.labelPx,
      fontFamily: 'var(--skin-font-display)',
      letterSpacing: '0.08em',
      textTransform: 'uppercase',
      whiteSpace: 'nowrap',
      ...style,
    }}
  >
    {children}
  </span>
);

/** Section eyebrow label — display font, tracked, ≥12px (guide §3.5). */
export const Kicker: React.FC<{ children: React.ReactNode; tone?: Tone }> = ({ children, tone = 'label' }) => (
  <div
    style={{
      fontFamily: 'var(--skin-font-display)',
      fontSize: PRES.type.labelPx,
      letterSpacing: 'var(--skin-label-tracking)',
      textTransform: 'uppercase',
      color: TONE[tone],
      textShadow: 'var(--skin-incision-label)',
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
    }}
  >
    {children}
  </div>
);

/** Quest progress — POI-quest pattern (desiderata v4): when full, the quest is done. */
export const QuestProgress: React.FC<{ beat: number; ended: boolean; beats: readonly string[] }> = ({ beat, ended, beats }) => (
  <div className="flex items-center gap-1.5">
    {beats.map((label, i) => {
      const done = ended || i < beat;
      const active = !ended && i === beat;
      return (
        <div key={label} className="flex items-center gap-1.5" title={label}>
          <div
            className="h-2.5 w-2.5 rotate-45 transition-all duration-500"
            style={{
              border: `1px solid ${done || active ? 'var(--skin-surface-border)' : 'color-mix(in srgb, var(--skin-text-muted) 40%, transparent)'}`,
              background: done
                ? 'var(--skin-title-color)'
                : active
                  ? 'color-mix(in srgb, var(--skin-title-color) 30%, transparent)'
                  : 'var(--skin-hud-lacquer-deep)',
              boxShadow: done ? '0 0 8px color-mix(in srgb, var(--skin-title-color) 60%, transparent)' : undefined,
            }}
          />
          {i < beats.length - 1 && (
            <div
              className="h-px w-4 transition-colors duration-500"
              style={{
                background: done
                  ? 'color-mix(in srgb, var(--skin-title-color) 55%, transparent)'
                  : 'color-mix(in srgb, var(--skin-text-muted) 25%, transparent)',
              }}
            />
          )}
        </div>
      );
    })}
  </div>
);

/** Camp alertness badge — named states, not a meter (Director 2026-10-03:
 *  noise removed). Nothing renders while the camp is quiet; one fumble shows
 *  "allertato", a second (or a loud entry) shows "sveglio". */
export const CampAlertBadge: React.FC<{ flags: string[] }> = ({ flags }) => {
  const { t } = useTranslation('idleVillage');
  const sveglio = flags.includes('campoSveglio');
  const allertato = flags.includes('campoAllertato');
  if (!sveglio && !allertato) return null;
  return (
    <HudChip tone={sveglio ? 'danger' : 'warn'} title={t('questS1Lab.camp.tooltip')}>
      {t(sveglio ? 'questS1Lab.camp.awake' : 'questS1Lab.camp.alerted')}
    </HudChip>
  );
};

/** Mount-triggered fade-in for narrative text — opacity transition only,
 *  no standalone CSS (skin invariant); remount via `key` restarts it. */
export const FadeIn: React.FC<{ children: React.ReactNode; delayMs?: number }> = ({ children, delayMs = 0 }) => {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(id);
  }, []);
  return (
    <div
      className="transition-opacity ease-out"
      style={{
        opacity: visible ? 1 : 0,
        transitionDuration: `${DEFAULT_QUEST_LAB_PACING.fadeMs}ms`,
        transitionDelay: `${delayMs}ms`,
      }}
    >
      {children}
    </div>
  );
};
