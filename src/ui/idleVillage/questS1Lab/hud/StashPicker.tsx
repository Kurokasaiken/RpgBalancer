/**
 * questS1Lab/hud/StashPicker — R-102 loadout picker as a HudPlaque panel
 * (PLAN-024 T-008): chips are `data-hud-controls` pills with lucide icons,
 * the coverage hint pairs stat icons with ok/warn tones (colour + shape).
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import { QUEST_STASH, loadoutCoverage } from '@/balancing/config/idleVillage/quests/questStash';
import { getStatIconComponent, lucideStatIcons } from '@/ui/shared/statIconUtils';
import { STAT_ICONS } from '@/ui/idleVillage/questS1Lab/questRun';
import type { LabStat } from '@/ui/idleVillage/questS1Lab/questScenario';
import { DEFAULT_QUEST_LAB_PRESENTATION as PRES } from '@/balancing/config/idleVillage/quests/questLabPresentation';
import { HudChip, Kicker, STAT_SHORT, TONE } from './atoms';

/** Stash picker (R-102): pack consumables into the bag before departing.
 *  One shared bag for whichever preset the player launches — cap is
 *  `QUEST_STASH.bagSlots`; chips toggle, the coverage hint compares the pick
 *  against the quest's declared primary stats. */
export const StashPicker: React.FC<{
  loadout: string[];
  onToggle: (flag: string) => void;
  primaryStats: LabStat[];
}> = ({ loadout, onToggle, primaryStats }) => {
  const { t } = useTranslation('idleVillage');
  const coverage = loadoutCoverage(loadout);
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-3">
        <Kicker>{t('questS1Lab.stash.title')}</Kicker>
        <HudChip tone="muted">
          {t('questS1Lab.stash.hint', {
            used: loadout.length,
            slots: QUEST_STASH.bagSlots,
          })}
        </HudChip>
      </div>
      <div data-hud-controls="" className="flex flex-wrap gap-1.5">
        {QUEST_STASH.items.map((item) => {
          const packed = loadout.includes(item.flag);
          const full = !packed && loadout.length >= QUEST_STASH.bagSlots;
          const Icon = getStatIconComponent(item.icon);
          return (
            <button
              key={item.flag}
              type="button"
              disabled={full}
              aria-pressed={packed}
              onClick={() => onToggle(item.flag)}
              title={t(item.descKey)}
              style={{ whiteSpace: 'nowrap', flexShrink: 0, minWidth: 'fit-content' }}
            >
              {Icon && <Icon aria-hidden />}
              <span>{t(item.labelKey).split('—')[0].trim()}</span>
            </button>
          );
        })}
      </div>
      {primaryStats.length > 0 && (
        <div className="flex items-center gap-2">
          <span
            style={{
              fontFamily: 'var(--skin-font-display)',
              fontSize: PRES.type.labelPx,
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
              color: TONE.muted,
            }}
          >
            {t('questS1Lab.stash.coverage')}
          </span>
          {primaryStats.map((s) => {
            const covered = coverage.includes(s);
            const Icon = getStatIconComponent(STAT_ICONS[s]) ?? lucideStatIcons.star;
            return (
              <span
                key={s}
                className="flex items-center gap-1"
                title={STAT_SHORT[s]}
                style={{
                  fontSize: PRES.type.labelPx,
                  fontFamily: 'var(--skin-font-display)',
                  letterSpacing: '0.06em',
                  color: covered ? TONE.ok : TONE.muted,
                }}
              >
                <Icon style={{ width: 13, height: 13 }} aria-hidden />
                {STAT_SHORT[s]} {covered ? '✓' : '—'}
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default StashPicker;
