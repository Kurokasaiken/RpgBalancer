import React from 'react';
import { useTranslation } from 'react-i18next';
import type { Spell } from '../../../balancing/spellTypes';

/**
 * Props for SpellInfoForm component
 */
interface SpellInfoFormProps {
  spell: Spell;
  updateField: (field: keyof Spell, value: Spell[keyof Spell]) => void;
}

/**
 * SpellInfoForm component
 * 
 * Displays additional spell configuration fields including:
 * - CC Effect (for crowd control spells)
 * - Damage Type
 * - Scaling Stat
 * - Tags
 * - Situational Modifiers (JSON)
 * 
 * @param props - Component props
 * @returns React component
 */
export const SpellInfoForm: React.FC<SpellInfoFormProps> = ({ spell, updateField }) => {
  const { t } = useTranslation('spell');

  return (
    <div 
      className="mb-4 rounded-lg p-4"
      style={{
        backgroundColor: 'var(--skin-surface-bg)',
        border: '1px solid var(--skin-surface-border)',
      }}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* CC Effect (only for type cc) */}
        {spell.type === 'cc' && (
          <>
            <div>
              <label 
                className="block text-sm mb-1"
                style={{ color: 'var(--skin-text-secondary)' }}
              >
                {t('effectPercent', 'Effect (%)')}
              </label>
              <input
                type="number"
                value={spell.effect}
                onChange={e => updateField('effect', Number(e.target.value))}
                className="w-full px-2 py-1 rounded text-xs bg-transparent border"
                style={{
                  borderColor: 'var(--skin-surface-border)',
                  color: 'var(--skin-text-primary)',
                }}
              />
            </div>
            <div>
              <label 
                className="block text-sm mb-1"
                style={{ color: 'var(--skin-text-secondary)' }}
              >
                {t('ccEffect', 'CC Effect')}
              </label>
              <select
                value={spell.ccEffect || ''}
                onChange={e => updateField('ccEffect', e.target.value || undefined)}
                className="w-full px-2 py-1 rounded text-xs bg-transparent border cursor-pointer"
                style={{
                  borderColor: 'var(--skin-surface-border)',
                  color: 'var(--skin-text-primary)',
                }}
              >
                <option value="">{t('none', 'None')}</option>
                <option value="stun">{t('stun', 'Stun')}</option>
                <option value="slow">{t('slow', 'Slow')}</option>
                <option value="knockback">{t('knockback', 'Knockback')}</option>
                <option value="silence">{t('silence', 'Silence')}</option>
              </select>
            </div>
          </>
        )}
        {/* Damage Type */}
        <div>
          <label 
            className="block text-sm mb-1"
            style={{ color: 'var(--skin-text-secondary)' }}
          >
            {t('damageType', 'Damage Type')}
          </label>
          <select
            value={spell.damageType || ''}
            onChange={e => updateField('damageType', e.target.value || undefined)}
            className="w-full px-2 py-1 rounded text-xs bg-transparent border cursor-pointer"
            style={{
              borderColor: 'var(--skin-surface-border)',
              color: 'var(--skin-text-primary)',
            }}
          >
            <option value="">{t('none', 'None')}</option>
            <option value="physical">{t('physical', 'Physical')}</option>
            <option value="magical">{t('magical', 'Magical')}</option>
            <option value="true">{t('true', 'True')}</option>
          </select>
        </div>
        {/* Scaling Stat */}
        <div>
          <label 
            className="block text-sm mb-1"
            style={{ color: 'var(--skin-text-secondary)' }}
          >
            {t('scalingStat', 'Scaling Stat')}
          </label>
          <select
            value={spell.scalingStat || ''}
            onChange={e => updateField('scalingStat', e.target.value || undefined)}
            className="w-full px-2 py-1 rounded text-xs bg-transparent border cursor-pointer"
            style={{
              borderColor: 'var(--skin-surface-border)',
              color: 'var(--skin-text-primary)',
            }}
          >
            <option value="">{t('none', 'None')}</option>
            <option value="attack">{t('attack', 'Attack')}</option>
            <option value="magic">{t('magic', 'Magic')}</option>
            <option value="health">{t('health', 'Health')}</option>
            <option value="mana">{t('mana', 'Mana')}</option>
            <option value="defense">{t('defense', 'Defense')}</option>
          </select>
        </div>
        {/* Tags */}
        <div>
          <label 
            className="block text-sm mb-1"
            style={{ color: 'var(--skin-text-secondary)' }}
          >
            {t('tags', 'Tags')}
          </label>
          <input
            type="text"
            value={(spell.tags || []).join(', ')}
            onChange={e => updateField('tags', e.target.value.split(',').map(t => t.trim()).filter(t => t))}
            className="w-full px-2 py-1 rounded text-xs bg-transparent border"
            style={{
              borderColor: 'var(--skin-surface-border)',
              color: 'var(--skin-text-primary)',
            }}
            placeholder={t('tagsPlaceholder', 'comma-separated tags')}
          />
        </div>
        {/* Situational Modifiers (JSON textarea) */}
        <div className="col-span-2">
          <label 
            className="block text-sm mb-1"
            style={{ color: 'var(--skin-text-secondary)' }}
          >
            {t('situationalModifiers', 'Situational Modifiers (JSON array)')}
          </label>
          <textarea
            rows={4}
            value={JSON.stringify(spell.situationalModifiers || [], null, 2)}
            onChange={e => {
              try {
                const parsed = JSON.parse(e.target.value);
                updateField('situationalModifiers', parsed);
              } catch {
                // ignore invalid JSON
              }
            }}
            className="w-full px-2 py-1 rounded text-xs bg-transparent border font-mono"
            style={{
              borderColor: 'var(--skin-surface-border)',
              color: 'var(--skin-text-primary)',
            }}
          />
        </div>
      </div>
    </div>
  );
};
