/**
 * questS1Lab/hud/ContextStrip — content of the top `hang` plaque: location,
 * beat, objective, affordances. Controls go through `data-hud-controls`
 * (guide §5) — one pill style for every button.
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import { BookOpenText, TrendingUp } from 'lucide-react';
import type { QuestId } from '@/ui/idleVillage/questS1Lab/questRun';
import { CampAlertBadge, HudChip, Kicker, QuestProgress, TONE } from './atoms';

export interface ContextStripProps {
  questId: QuestId;
  seed: number;
  beats: readonly string[];
  currentBeat: number;
  ended: boolean;
  gold: number;
  flags: string[];
  inCombat: boolean;
  combatTurn: number;
  turnsTotal: number;
  presenting: boolean;
  paceFast: boolean;
  onPaceChange: (fast: boolean) => void;
  onSkip: () => void;
  logOpen: boolean;
  onToggleLog: () => void;
  /** Quest X-ray forecast (R-082): pill in the strip, panel over the stage. */
  forecastOpen: boolean;
  onToggleForecast: () => void;
  onRetreat: () => void;
  onReset: () => void;
}

/** CONTEXT STRIP — inside the `hang` plaque: location, beat, objective,
 *  affordances. One `data-hud-controls` group for every control. */
export const ContextStrip: React.FC<ContextStripProps> = ({
  questId, seed, beats, currentBeat, ended, gold, flags,
  inCombat, combatTurn, turnsTotal,
  presenting, paceFast, onPaceChange, onSkip,
  logOpen, onToggleLog, forecastOpen, onToggleForecast,
  onRetreat, onReset,
}) => {
  const { t } = useTranslation('idleVillage');
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex min-w-0 items-center gap-4">
        <div className="w-52 shrink-0">
          <Kicker>{t('questS1Lab.kickerRun', { seed })}</Kicker>
          <h3 className="truncate" style={{ fontSize: 'var(--skin-subtitle-size, 15px)' }}>
            {t(`questS1Lab.quests.${questId}.title`)}
          </h3>
        </div>
        <QuestProgress beat={currentBeat} ended={ended} beats={beats} />
        <span className="hidden shrink-0 items-center gap-2 lg:flex">
          <HudChip tone="label">
            {gold} {t('questS1Lab.gold')}
          </HudChip>
          <CampAlertBadge flags={flags} />
          {inCombat && (
            <HudChip tone="danger">
              {t('questS1Lab.combatTurn', { turn: combatTurn, turns: turnsTotal })}
            </HudChip>
          )}
        </span>
      </div>
      <div data-hud-controls="" className="flex shrink-0 flex-wrap items-center justify-end gap-1.5">
        {/* Pace chosen BEFORE the check (Director D1) — one factor scales
            every beat; locked while a resolution is on stage. */}
        <span role="group" title={t('questS1Lab.pace.title')} className="flex items-center gap-1">
          {(['full', 'fast'] as const).map((p) => (
            <button
              key={p}
              type="button"
              disabled={presenting}
              aria-pressed={(p === 'fast') === paceFast}
              onClick={() => onPaceChange(p === 'fast')}
              style={{ whiteSpace: 'nowrap', flexShrink: 0 }}
            >
              {t(`questS1Lab.pace.${p}`)}
            </button>
          ))}
        </span>
        {!ended && (
          <button
            type="button"
            onClick={onToggleForecast}
            aria-pressed={forecastOpen}
            title={t('questS1Lab.sim.open')}
            style={{ whiteSpace: 'nowrap', flexShrink: 0 }}
          >
            <TrendingUp size={13} aria-hidden />
            <span>{t('questS1Lab.sim.pill')}</span>
          </button>
        )}
        {presenting && (
          <button type="button" onClick={onSkip} style={{ color: TONE.text, whiteSpace: 'nowrap', flexShrink: 0 }}>
            {t('questS1Lab.skip')}
          </button>
        )}
        <button type="button" onClick={onToggleLog} aria-pressed={logOpen} style={{ whiteSpace: 'nowrap', flexShrink: 0 }}>
          <BookOpenText size={13} aria-hidden />
          <span>{t('questS1Lab.logToggle')}</span>
        </button>
        {!ended && (
          <button onClick={onRetreat} style={{ color: TONE.danger, whiteSpace: 'nowrap', flexShrink: 0 }}>
            {t('questS1Lab.retreat')}
          </button>
        )}
        <button onClick={onReset} style={{ whiteSpace: 'nowrap', flexShrink: 0 }}>
          {t('questS1Lab.reset')}
        </button>
      </div>
    </div>
  );
};

export default ContextStrip;
