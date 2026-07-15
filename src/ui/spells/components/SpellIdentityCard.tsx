import React from 'react';
import { useTranslation } from 'react-i18next';
import type { Spell } from '../../../balancing/spellTypes';

/**
 * Props for SpellIdentityCard component
 */
interface SpellIdentityCardProps {
  spell: Spell;
  updateField: (field: keyof Spell, value: Spell[keyof Spell]) => void;
  targetBudget: number;
  setTargetBudget: (value: number) => void;
  targetStatOptions?: string[];
}

/**
 * SpellIdentityCard component
 * 
 * Displays core spell identity fields:
 * - Name
 * - Type (damage, heal, shield, buff, debuff, cc)
 * - Target Cost (budget)
 * - Target Stat (for buff/debuff spells)
 * 
 * @param props - Component props
 * @returns React component
 */
export const SpellIdentityCard: React.FC<SpellIdentityCardProps> = ({
  spell,
  updateField,
  targetBudget,
  setTargetBudget,
  targetStatOptions
}) => {
  const { t } = useTranslation('spell');

  return (
    <div 
      className="flex flex-col gap-2 h-full rounded-lg p-4"
      style={{
        backgroundColor: 'var(--skin-surface-bg)',
        border: '1px solid var(--skin-surface-border)',
      }}
    >
      <div 
        className="flex items-center justify-between px-2.5 py-1.5 mb-2 rounded-lg"
        style={{
          backgroundColor: 'var(--skin-surface-base)',
          border: '1px solid var(--skin-surface-border)',
        }}
      >
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="text-xs" aria-hidden="true">🪄</span>
          <span 
            className="text-[10px] font-semibold uppercase truncate"
            style={{ color: 'var(--skin-title-color)' }}
          >
            {t('spellIdentity', 'Spell Identity')}
          </span>
        </div>
        <span 
          className="text-[9px] uppercase tracking-[0.18em] ml-2 truncate"
          style={{ color: 'var(--skin-icon-accent)', opacity: 0.8 }}
        >
          {spell.type}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {/* Name */}
        <div className="flex flex-col gap-1">
          <label 
            className="text-[10px] uppercase tracking-wider font-semibold"
            style={{ color: 'var(--skin-icon-accent)', opacity: 0.7 }}
          >
            {t('name', 'Name')}
          </label>
          <input
            type="text"
            value={spell.name}
            onChange={e => updateField('name', e.target.value)}
            className="w-full px-2 py-1 rounded text-xs bg-transparent border"
            style={{
              borderColor: 'var(--skin-surface-border)',
              color: 'var(--skin-text-primary)',
            }}
            placeholder={t('spellNamePlaceholder', 'Spell Name')}
          />
        </div>

        {/* Type */}
        <div className="flex flex-col gap-1">
          <label 
            className="text-[10px] uppercase tracking-wider font-semibold"
            style={{ color: 'var(--skin-icon-accent)', opacity: 0.7 }}
          >
            {t('type', 'Type')}
          </label>
          <select
            value={spell.type}
            onChange={e => updateField('type', e.target.value)}
            className="w-full px-2 py-1 rounded text-xs bg-transparent border cursor-pointer"
            style={{
              borderColor: 'var(--skin-surface-border)',
              color: 'var(--skin-text-primary)',
            }}
          >
            <option value="damage">{t('damage', 'Damage')}</option>
            <option value="heal">{t('heal', 'Heal')}</option>
            <option value="shield">{t('shield', 'Shield')}</option>
            <option value="buff">{t('buff', 'Buff')}</option>
            <option value="debuff">{t('debuff', 'Debuff')}</option>
            <option value="cc">{t('crowdControl', 'Crowd Control')}</option>
          </select>
        </div>

        {/* Target Budget */}
        <div className="flex flex-col gap-1">
          <label 
            className="text-[10px] uppercase tracking-wider font-semibold"
            style={{ color: 'var(--skin-icon-accent)', opacity: 0.7 }}
          >
            {t('targetCost', 'Target Cost')}
          </label>
          <input
            type="number"
            value={targetBudget}
            onChange={e => setTargetBudget(Number(e.target.value))}
            className="w-full px-2 py-1 rounded text-xs bg-transparent border font-mono text-right"
            style={{
              borderColor: 'var(--skin-surface-border)',
              color: 'var(--skin-text-primary)',
            }}
          />
        </div>

        {/* Target Stat (Buff/Debuff only) */}
        {(spell.type === 'buff' || spell.type === 'debuff') && (
          <div className="flex flex-col gap-1">
            <label 
              className="text-[10px] uppercase tracking-wider font-semibold"
              style={{ color: 'var(--skin-icon-accent)', opacity: 0.7 }}
            >
              {t('targetStat', 'Target Stat')}
            </label>
            <select
              value={spell.targetStat || 'damage'}
              onChange={e => updateField('targetStat', e.target.value)}
              className="w-full px-2 py-1 rounded text-xs bg-transparent border cursor-pointer"
              style={{
                borderColor: 'var(--skin-surface-border)',
                color: 'var(--skin-text-primary)',
              }}
            >
              {targetStatOptions?.map(stat => (
                <option key={stat} value={stat}>
                  {stat.charAt(0).toUpperCase() + stat.slice(1).replace(/([A-Z])/g, ' $1').trim()}
                </option>
              )) || <option value="damage">{t('damage', 'Damage')}</option>}
            </select>
          </div>
        )}
      </div>
    </div>
  );
};
