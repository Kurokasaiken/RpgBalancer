/**
 * questS1Lab/hud/ConsumableBelt — the bag's toolbar (PLAN-024 T-006):
 * icons + state as `data-hud-controls` pills above the options, no prose.
 * Item metadata comes from `QUEST_STASH` (lucide icon ids), not emoji.
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import { QUEST_STASH } from '@/balancing/config/idleVillage/quests/questStash';
import { getStatIconComponent } from '@/ui/shared/statIconUtils';
import { DEFAULT_QUEST_LAB_PRESENTATION as PRES } from '@/balancing/config/idleVillage/quests/questLabPresentation';
import { TONE } from './atoms';

/** Consumable belt (artifact §7b): arm the check items BEFORE choosing —
 *  the option tooltips then show base → armed delta. 'action' items stay
 *  their own buttons (healing auto-targets the most hurt living member). */
export const ConsumableBelt: React.FC<{
  flags: string[];
  armed: boolean;
  onToggleArmed: () => void;
  onUseHealing: () => void;
  onDrinkPotion: () => void;
}> = ({ flags, armed, onToggleArmed, onUseHealing, onDrinkPotion }) => {
  const { t } = useTranslation('idleVillage');
  const checkItems = QUEST_STASH.items.filter((i) => i.kind === 'check' && flags.includes(i.flag));
  const hasHealing = flags.includes('hasHealing');
  const hasPozione = flags.includes('hasPozione');
  if (!checkItems.length && !hasHealing && !hasPozione) return null;
  const checkNames = checkItems.map((i) => t(i.labelKey).split('—')[0].trim()).join(' · ');
  return (
    <div
      data-hud-controls=""
      role="toolbar"
      aria-label={t('questS1Lab.belt.label')}
      className="mb-2 flex flex-wrap items-center gap-1.5 pb-1"
    >
      <span
        style={{
          fontFamily: 'var(--skin-font-display)',
          fontSize: PRES.type.labelPx,
          letterSpacing: '0.2em',
          textTransform: 'uppercase',
          color: TONE.muted,
        }}
      >
        {t('questS1Lab.belt.label')}
      </span>
      {checkItems.length > 0 && (
        <button
          type="button"
          onClick={onToggleArmed}
          aria-pressed={armed}
          title={`${t('questS1Lab.belt.armTitle')} — ${checkNames}`}
          style={{ whiteSpace: 'nowrap', flexShrink: 0, minWidth: 'fit-content' }}
        >
          {checkItems.map((i) => {
            const Icon = getStatIconComponent(i.icon);
            return Icon ? <Icon key={i.flag} aria-hidden /> : null;
          })}
        </button>
      )}
      {hasPozione && (
        <button type="button" onClick={onDrinkPotion} title={t('questS1Lab.stash.desc.potion')} style={{ whiteSpace: 'nowrap', flexShrink: 0 }}>
          {(() => {
            const Icon = getStatIconComponent(QUEST_STASH.items.find((i) => i.flag === 'hasPozione')?.icon ?? '');
            return Icon ? <Icon aria-hidden /> : null;
          })()}
          <span>{t('questS1Lab.item.potion').split('—')[0].trim()}</span>
        </button>
      )}
      {hasHealing && (
        <button type="button" onClick={onUseHealing} title={t('questS1Lab.stash.desc.healing')} style={{ whiteSpace: 'nowrap', flexShrink: 0 }}>
          {(() => {
            const Icon = getStatIconComponent(QUEST_STASH.items.find((i) => i.flag === 'hasHealing')?.icon ?? '');
            return Icon ? <Icon aria-hidden /> : null;
          })()}
          <span>{t('questS1Lab.item.healing').split('—')[0].trim()}</span>
        </button>
      )}
    </div>
  );
};

export default ConsumableBelt;
