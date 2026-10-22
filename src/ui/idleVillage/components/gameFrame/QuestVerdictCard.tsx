/**
 * QuestVerdictCardBody — R-259: the shared verdict presentation for a
 * resolved check. The skill-check column's verdict card and the external
 * outcome toast render the SAME body (verdict chip + harm chips + flavor +
 * authored consequence) so the popup is identical to the skill-check
 * result — Director verbatim: «il msg popup deve essere identico
 * all'esito d quello dello skill check».
 *
 * Harm reaches the surface only as chips (R-234, guide §4): `harmLines`
 * stay in the chronicle, never in prose here. Callers supply the verdict
 * label/tone (the column derives them from the forced presentation mode,
 * the toast from `check.verdict`) and wrap the body in their own chrome.
 */
import React from 'react';
import { useTranslation } from 'react-i18next';
import { HudChip } from '@/ui/idleVillage/questS1Lab/hud/atoms';
import type { ResolvedCheck } from '@/ui/idleVillage/questS1Lab/questRun';

const FONT = {
  serif: 'var(--skin-font-serif)',
} as const;

export interface QuestVerdictCardBodyProps {
  /** The resolved check being presented. */
  check: ResolvedCheck;
  /** Translated verdict label (e.g. `t('questS1Lab.verdict.win')`). */
  verdictLabel: string;
  /** HudChip tone for the verdict chip. */
  verdictTone: 'ok' | 'warn' | 'danger' | 'label';
}

/** Chips + flavor + authored text — the identical result block. */
export const QuestVerdictCardBody: React.FC<QuestVerdictCardBodyProps> = ({ check, verdictLabel, verdictTone }) => {
  const { t } = useTranslation('idleVillage');
  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <HudChip tone={verdictTone}>{verdictLabel}</HudChip>
        {check.harm === 'wound' && <HudChip tone="warn">{t('questS1Lab.harmChip.wound')}</HudChip>}
        {check.harm === 'death' && <HudChip tone="danger">{t('questS1Lab.harmChip.death')}</HudChip>}
      </div>
      {check.flavor && (
        <p style={{ margin: 0, fontFamily: FONT.serif, fontStyle: 'italic', fontSize: 13, lineHeight: 1.45, color: 'var(--skin-text-primary)' }}>
          {check.flavor}
        </p>
      )}
      {check.authoredText && (
        <p style={{ margin: 0, fontFamily: FONT.serif, fontSize: 12, lineHeight: 1.4, color: 'var(--skin-text-secondary)' }}>
          {check.authoredText}
        </p>
      )}
    </>
  );
};

export default QuestVerdictCardBody;
