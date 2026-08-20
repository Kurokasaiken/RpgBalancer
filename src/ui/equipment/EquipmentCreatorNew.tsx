import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { saveData, loadData } from '@/shared/persistence/PersistenceService';
import { trackTelemetryEvent } from '@/analytics/telemetry/telemetryProvider';
import { useSkinPreferences } from '@/ui/idleVillage/hooks/useSkinPreferences';
import { MatericSurface } from '@/ui/designSystem/primitives/MatericSurface';
import { MatericHeading } from '@/ui/designSystem/primitives/MatericHeading';
import { MatericField } from '@/ui/designSystem/primitives/MatericField';
import { MatericButton } from '@/ui/designSystem/primitives/MatericButton';
import { MatericStatBar } from '@/ui/designSystem/primitives/MatericStatBar';
import { calculateItemPower } from '@/balancing/statWeights';
import { calculateEquipmentCost, EQUIPMENT_BASE_BUDGET } from '@/balancing/equipment/equipmentBalancing';
import {
  type EquipmentItem,
  type EquipmentRarity,
  type EquipmentType,
  ALL_EQUIPMENT_TYPES,
  EQUIPMENT_TYPE_TEMPLATES,
  EQUIPMENT_RARITIES,
  EQUIPMENT_RARITY_EXTRA_POINTS,
  createEmptyEquipmentItem,
} from '@/balancing/equipment/equipmentTemplates';

const STORAGE_KEY = 'rpg_balancer_equipment_creator';

/**
 * Canonical equipment creator page for the Balancer.
 *
 * Mirrors the Spell Creator pattern: choose a type, start from a base template,
 * spend a budget of equipment points across any stat, and save the resulting item.
 * The real attack damage comes from the linked base skill; the item only adds stat modifiers.
 */
export const EquipmentCreatorNew: React.FC = () => {
  const { t } = useTranslation('idleVillage');
  useSkinPreferences();

  const [item, setItem] = useState<EquipmentItem>(createEmptyEquipmentItem('weapon'));
  const [draftName, setDraftName] = useState('');

  useEffect(() => {
    const loadDraft = async () => {
      try {
        const saved = await loadData<EquipmentItem | null>(STORAGE_KEY, null);
        if (saved && saved.type) {
          setItem(saved);
          setDraftName(saved.name);
        }
      } catch (error) {
        console.warn('[EquipmentCreator] Failed to load draft:', error);
      }
    };
    void loadDraft();
  }, []);

  const unlockedStats = useMemo(
    () => EQUIPMENT_TYPE_TEMPLATES[item.type].unlockedStats,
    [item.type]
  );

  const power = useMemo(() => calculateItemPower(item.stats), [item.stats]);
  const cost = useMemo(() => calculateEquipmentCost(power), [power]);
  const extraPoints = EQUIPMENT_RARITY_EXTRA_POINTS[item.rarity];
  const budget = EQUIPMENT_BASE_BUDGET + extraPoints;
  const balance = cost - budget;
  const isBalanced = cost <= budget;

  const handleTypeChange = (type: EquipmentType) => {
    const next = createEmptyEquipmentItem(type);
    setItem((prev) => ({
      ...next,
      name: prev.name,
      rarity: prev.rarity,
    }));
  };

  const handleRarityChange = (rarity: EquipmentRarity) => {
    setItem((prev) => ({
      ...prev,
      rarity,
      tags: [prev.type, rarity],
    }));
  };

  const handleStatChange = (stat: string, value: number) => {
    setItem((prev) => ({
      ...prev,
      stats: {
        ...prev.stats,
        [stat]: value,
      },
    }));
  };

  const handleNameChange = (name: string) => {
    setDraftName(name);
    setItem((prev) => ({ ...prev, name }));
  };

  const handleSave = async () => {
    try {
      await saveData(STORAGE_KEY, item);
      trackTelemetryEvent('equipment_creator_save', {
        equipmentId: item.id,
        type: item.type,
        rarity: item.rarity,
        power,
        cost,
        budget,
        context: 'equipment_creator',
        timestamp: Date.now(),
      });
      toast.success(t('equipment.saved'), {
        description: item.name || t('equipment.unnamed'),
      });
    } catch (error) {
      console.error('[EquipmentCreator] Save failed:', error);
      toast.error(t('equipment.saveFailed'));
    }
  };

  return (
    <div className="min-h-screen bg-[var(--skin-background)] text-[var(--skin-text)] p-6">
      <MatericSurface shape="panel" material="bronze" className="max-w-5xl mx-auto p-6">
        <MatericHeading
          title={t('equipment.title')}
          subtitle={t('equipment.subtitle')}
          description={t('equipment.description')}
        />

        <div className="grid gap-6 mt-6">
          <section>
            <h3 className="text-lg font-semibold mb-3">{t('equipment.identity')}</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <MatericField
                label={t('equipment.name')}
                value={
                  <input
                    type="text"
                    value={draftName}
                    onChange={(e) => handleNameChange(e.target.value)}
                    className="w-full rounded-md border border-[var(--skin-line)] bg-[var(--skin-surface)] px-3 py-2 text-[var(--skin-text)]"
                    placeholder={t('equipment.namePlaceholder')}
                  />
                }
              />
              <MatericField
                label={t('equipment.type')}
                value={
                  <select
                    value={item.type}
                    onChange={(e) => handleTypeChange(e.target.value as EquipmentType)}
                    className="w-full rounded-md border border-[var(--skin-line)] bg-[var(--skin-surface)] px-3 py-2 text-[var(--skin-text)]"
                  >
                    {ALL_EQUIPMENT_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {t(`equipment.${type}`)}
                      </option>
                    ))}
                  </select>
                }
              />
              <MatericField
                label={t('equipment.rarity')}
                value={
                  <select
                    value={item.rarity}
                    onChange={(e) => handleRarityChange(e.target.value as EquipmentRarity)}
                    className="w-full rounded-md border border-[var(--skin-line)] bg-[var(--skin-surface)] px-3 py-2 text-[var(--skin-text)]"
                  >
                    {EQUIPMENT_RARITIES.map((rarity) => (
                      <option key={rarity} value={rarity}>
                        {t(`equipment.rarity.${rarity}`)}
                      </option>
                    ))}
                  </select>
                }
              />
            </div>
          </section>

          {item.grantedSkillId && (
            <MatericField
              label={t('equipment.grantedSkill')}
              value={item.grantedSkillId}
            />
          )}

          <section>
            <h3 className="text-lg font-semibold mb-3">{t('equipment.stats')}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {unlockedStats.map((stat) => {
                const value = item.stats[stat] ?? 0;
                return (
                  <MatericField
                    key={stat}
                    label={t(`equipment.stat.${stat}`)}
                    value={
                      <div className="flex items-center gap-3">
                        <input
                          type="range"
                          min={0}
                          max={50}
                          step={1}
                          value={value}
                          onChange={(e) =>
                            handleStatChange(stat as string, Number(e.target.value))
                          }
                          className="flex-1"
                        />
                        <input
                          type="number"
                          min={0}
                          max={50}
                          step={1}
                          value={value}
                          onChange={(e) =>
                            handleStatChange(stat as string, Number(e.target.value))
                          }
                          className="w-20 rounded-md border border-[var(--skin-line)] bg-[var(--skin-surface)] px-2 py-1 text-center text-[var(--skin-text)]"
                        />
                      </div>
                    }
                  />
                );
              })}
            </div>
          </section>

          <section>
            <h3 className="text-lg font-semibold mb-3">{t('equipment.balance')}</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
              <MatericField label={t('equipment.power')} value={Math.round(power)} />
              <MatericField label={t('equipment.cost')} value={cost} />
              <MatericField
                label={t('equipment.budget')}
                value={`${budget} (${EQUIPMENT_BASE_BUDGET} + ${extraPoints})`}
              />
            </div>
            <MatericStatBar
              label={t('equipment.balanceBar')}
              value={cost}
              maxValue={Math.max(1, budget)}
              variant={isBalanced ? 'stamina' : 'fatigue'}
            />
            <p className="text-sm mt-2" aria-live="polite">
              {isBalanced
                ? t('equipment.balanced', { balance })
                : t('equipment.overBudget', { balance })}
            </p>
          </section>

          <div className="flex gap-3">
            <MatericButton variant="cta" onClick={() => void handleSave()}>
              {t('equipment.save')}
            </MatericButton>
          </div>
        </div>
      </MatericSurface>
    </div>
  );
};

export default EquipmentCreatorNew;
