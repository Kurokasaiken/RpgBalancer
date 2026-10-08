/**
 * questS1Lab/hud/VerdictCard — verdict presentation in the plinth
 * (PLAN-024): badge + authored flavor + ack affordance, all on skin tokens.
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import type { ResolvedCheck } from '@/ui/idleVillage/questS1Lab/questRun';
import { DEFAULT_QUEST_LAB_PRESENTATION as PRES } from '@/balancing/config/idleVillage/quests/questLabPresentation';
import { Kicker, TONE } from './atoms';

/** Verdict card — replaces the plinth content while a resolution is
 *  presented (artifact §4): badge + authored flavor. HP harms live on the
 *  formation rows, never duplicated here. */
export const VerdictCard: React.FC<{
  check: ResolvedCheck;
  phase: string;
  onAck: () => void;
}> = ({ check, phase, onAck }) => {
  const { t } = useTranslation('idleVillage');
  const mode =
    check.verdict === 'fail' && check.harm === 'death'
      ? 'fail_dead'
      : check.verdict === 'fail' && check.harm === 'wound'
        ? 'fail_wound'
        : check.verdict;
  const tone =
    mode === 'bigwin' || mode === 'win'
      ? TONE.ok
      : mode === 'almost'
        ? TONE.warn
        : TONE.danger;
  return (
    <div className="flex h-full flex-col items-center justify-center gap-2 px-6 text-center">
      <div
        style={{
          borderRadius: 999,
          border: `1px solid color-mix(in srgb, ${tone} 60%, transparent)`,
          padding: '4px 18px',
          fontFamily: 'var(--skin-font-display)',
          fontSize: PRES.type.labelPx,
          fontWeight: 700,
          letterSpacing: '0.28em',
          textTransform: 'uppercase',
          color: tone,
          textShadow: 'var(--skin-incision-label)',
        }}
      >
        {t(`questS1Lab.verdict.${mode}`)}
      </div>
      {check.flavor && (
        <p
          className="max-w-2xl"
          style={{
            fontFamily: 'var(--skin-font-serif)',
            fontSize: PRES.type.numberPx,
            fontStyle: 'italic',
            lineHeight: 1.5,
            color: 'var(--skin-text-primary)',
          }}
        >
          {check.flavor}
        </p>
      )}
      {check.authoredText && (
        <p
          className="max-w-2xl"
          style={{
            fontFamily: 'var(--skin-font-serif)',
            fontSize: PRES.type.bodyPx,
            lineHeight: 1.5,
            color: 'var(--skin-text-secondary)',
          }}
        >
          {check.authoredText}
        </p>
      )}
      {phase === 'verdict' && (
        <button onClick={onAck} data-skin="cta" className="mt-1">
          {t('questS1Lab.verdictAck')}
        </button>
      )}
      {phase === 'harm' && <Kicker tone="muted">{t('questS1Lab.harmInProgress')}</Kicker>}
    </div>
  );
};

export default VerdictCard;
