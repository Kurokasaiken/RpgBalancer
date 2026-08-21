import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Sparkles, Shield } from 'lucide-react';
import { trackTelemetryEvent } from '@/analytics/telemetry/telemetryProvider';
import { useSkinPreferences } from '@/ui/idleVillage/hooks/useSkinPreferences';
import { StatsGrid } from '@/ui/spells/components/StatsGrid';
import { useBalancerConfig } from '@/balancing/hooks/useBalancerConfig';
import { MatericButton } from '@/ui/designSystem/primitives/MatericButton';
import type { EquipmentItem, EquipmentRarity, EquipmentType } from '@/balancing/equipment/equipmentTypes';
import { useSpellConfig } from '@/spells/hooks/useSpellConfig';
import { useEquipmentDefaultStorage } from '@/shared/hooks/useEquipmentDefaultStorage';
import { EquipmentCostModule } from '@/balancing/equipment/EquipmentCostModule';
import { upsertEquipment, getEquipment } from '@/balancing/equipment/equipmentStorage';
import {
  getEquipmentStatTicks,
  getEquipmentTypeConfig,
  getEquipmentStatDescription,
  getEquipmentRarityConfig,
} from '@/balancing/equipment/equipmentBalancingConfig';

const EQUIPMENT_TYPES: EquipmentType[] = [
  'weapon',
  'armor',
  'offhand',
  'trinket',
  'ring',
  'mount',
];

const EQUIPMENT_RARITIES: EquipmentRarity[] = [
  'poor',
  'common',
  'uncommon',
  'rare',
  'epic',
  'legendary',
  'masterpiece',
];

/**
 * Equipment Creator Test Page
 *
 * Mirrors the Spell Creator layout and behavior:
 * - header with live balance
 * - top row: identity card left, preview card right
 * - middle: StatsGrid with configurable ticks
 * - bottom: ActionsBar
 */
export const EquipmentCreatorTestPage: React.FC = () => {
  const { t } = useTranslation('idleVillage');
  useSkinPreferences();

  const {
    equipment,
    setEquipment,
    statOrder,
    setStatOrder,
    collapsedStats,
    setCollapsedStats,
    statSteps,
    setStatSteps,
    selectedTicks,
    setSelectedTicks,
    saveDefaultConfig,
    resetToDefaults,
  } = useEquipmentDefaultStorage();
  const { config } = useSpellConfig();
  const { config: balancerConfig } = useBalancerConfig();

  const [skillSearch, setSkillSearch] = useState('');

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const editId = searchParams.get('id');
    if (!editId) return;
    getEquipment(editId).then((loaded) => {
      if (!loaded) return;
      setEquipment(loaded);
      setStatOrder(Object.keys(loaded.stats));
      const steps: Record<string, { value: number; weight: number }[]> = {};
      const ticks: Record<string, number> = {};
      for (const [field, value] of Object.entries(loaded.stats)) {
        const defaultSteps = getEquipmentStatTicks(field);
        const matchIdx = defaultSteps.findIndex((s) => s.value === value);
        ticks[field] = matchIdx >= 0 ? matchIdx : 0;
        steps[field] = defaultSteps.map((s) => ({ value: s.value, weight: s.weight }));
      }
      setStatSteps(steps);
      setSelectedTicks(ticks);
      setCollapsedStats({});
    });
  }, [setEquipment, setStatOrder, setStatSteps, setSelectedTicks, setCollapsedStats]);

  const { cost, budget, balance, isBalanced, power, tier } = useMemo(() => {
    const breakdown = EquipmentCostModule.getCompleteCost(equipment);
    return {
      ...breakdown,
      power: breakdown.power,
    };
  }, [equipment]);

  const rarityConfig = useMemo(
    () => getEquipmentRarityConfig(equipment.rarity),
    [equipment.rarity]
  );

  const getStatSteps = (field: string) => {
    return statSteps[field] || getEquipmentStatTicks(field);
  };

  const updateEquipmentStat = (field: string, idx: number) => {
    const steps = getStatSteps(field);
    const step = steps[idx];
    if (!step) return;

    setEquipment((prev) => ({
      ...prev,
      stats: {
        ...prev.stats,
        [field]: step.value,
      },
    }));
  };

  const handleSelectTick = (field: string, idx: number) => {
    setSelectedTicks((prev) => ({ ...prev, [field]: idx }));
    updateEquipmentStat(field, idx);
  };

  const updateStatStep = (field: string, idx: number, step: { value: number; weight: number }) => {
    setStatSteps((prev) => {
      const existing = prev[field] || [];
      const steps = [...existing];
      steps[idx] = step;
      return { ...prev, [field]: steps };
    });

    const currentTick = selectedTicks[field] || 0;
    if (currentTick === idx) {
      updateEquipmentStat(field, idx);
    }
  };

  const addStatStep = (field: string, idx: number) => {
    setStatSteps((prev) => {
      const existing = prev[field] || [];
      const steps = [...existing];
      steps.splice(idx + 1, 0, { value: 0, weight: 0 });
      return { ...prev, [field]: steps };
    });
  };

  const removeStatStep = (field: string, idx: number) => {
    setStatSteps((prev) => {
      const existing = prev[field] || [];
      if (existing.length <= 1) return prev;
      const steps = [...existing];
      steps.splice(idx, 1);
      return { ...prev, [field]: steps };
    });
  };

  const handleTypeChange = (type: EquipmentType) => {
    const nextTypeConfig = getEquipmentTypeConfig(type);
    const nextSteps: Record<string, { value: number; weight: number }[]> = {};
    const nextTicks: Record<string, number> = {};
    const nextStats: Record<string, number> = {};

    for (const stat of nextTypeConfig.unlockedStats) {
      nextSteps[stat] = getEquipmentStatTicks(stat);
      nextTicks[stat] = 0;
      nextStats[stat] = nextSteps[stat][0]?.value ?? 0;
    }

    setEquipment((prev) => ({
      ...prev,
      id: prev.id,
      type,
      slot: nextTypeConfig.slot,
      grantedSkillIds: [...(nextTypeConfig.grantedSkillIds || [])],
      stats: nextStats,
    }));
    setStatOrder(nextTypeConfig.unlockedStats);
    setStatSteps(nextSteps);
    setSelectedTicks(nextTicks);
  };

  const handleRarityChange = (rarity: EquipmentRarity) => {
    setEquipment((prev) => ({
      ...prev,
      rarity,
      tags: [prev.type, rarity],
    }));
  };

  const handleNameChange = (name: string) => {
    setEquipment((prev) => ({ ...prev, name }));
  };

  const handleAddGrantedSkill = (spellId: string) => {
    setEquipment((prev) => {
      const current = prev.grantedSkillIds || [];
      if (current.includes(spellId)) return prev;
      return { ...prev, grantedSkillIds: [...current, spellId] };
    });
  };

  const handleRemoveGrantedSkill = (spellId: string) => {
    setEquipment((prev) => ({
      ...prev,
      grantedSkillIds: (prev.grantedSkillIds || []).filter((id) => id !== spellId),
    }));
  };

  const handleAddStat = (field: string) => {
    if (statOrder.includes(field)) return;
    const steps = getEquipmentStatTicks(field);
    const value = steps[0]?.value ?? 0;
    setStatOrder((prev) => [...prev, field]);
    setStatSteps((prev) => ({ ...prev, [field]: steps }));
    setSelectedTicks((prev) => ({ ...prev, [field]: 0 }));
    setEquipment((prev) => ({
      ...prev,
      stats: { ...prev.stats, [field]: value },
    }));
  };

  const handleDragStart = (e: React.DragEvent, field: string) => {
    e.dataTransfer.setData('text/plain', field);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, targetField: string) => {
    e.preventDefault();
    const draggedField = e.dataTransfer.getData('text/plain');
    if (draggedField === targetField) return;

    setStatOrder((prev) => {
      const newOrder = [...prev];
      const draggedIdx = newOrder.indexOf(draggedField);
      const targetIdx = newOrder.indexOf(targetField);
      if (draggedIdx !== -1 && targetIdx !== -1) {
        newOrder.splice(draggedIdx, 1);
        newOrder.splice(targetIdx, 0, draggedField);
      }
      return newOrder;
    });
  };

  const toggleCollapse = (field: string) => {
    setCollapsedStats((prev) => {
      const next = new Set(prev);
      if (next.has(field)) {
        next.delete(field);
      } else {
        next.add(field);
      }
      return next;
    });
  };

  const handleSave = async () => {
    try {
      const final: EquipmentItem = { ...equipment };
      await upsertEquipment(final);
      await saveDefaultConfig({
        equipment: final,
        statOrder,
        collapsedStats,
        statSteps,
        selectedTicks,
      });
      trackTelemetryEvent('equipment_creator_save', {
        equipmentId: final.id,
        type: final.type,
        rarity: final.rarity,
        cost,
        budget,
        context: 'equipment_creator',
        timestamp: Date.now(),
      });
      toast.success(t('equipment.saved'), {
        description: final.name || t('equipment.unnamed'),
      });
      setEquipment((prev) => ({ ...prev, id: crypto.randomUUID() }));
    } catch (error) {
      console.error('[EquipmentCreator] Save failed:', error);
      toast.error(t('equipment.saveFailed'));
    }
  };

  const handleSaveDefault = async () => {
    const success = await saveDefaultConfig({
      equipment,
      statOrder,
      collapsedStats,
      statSteps,
      selectedTicks,
    });
    if (success) {
      toast.success(t('equipment.defaultSaved'));
    } else {
      toast.error(t('equipment.saveFailed'));
    }
  };

  return (
    <div
      className="min-h-screen p-8 overflow-y-auto"
      style={{
        backgroundColor: 'var(--skin-surface-bg)',
        color: 'var(--skin-text-primary)',
      }}
    >
      <div
        className="max-w-7xl mx-auto rounded-lg p-6"
        style={{
          backgroundColor: 'var(--skin-surface-base)',
          border: '1px solid var(--skin-surface-border)',
          boxShadow: '0 0 20px rgba(0, 229, 255, 0.1)',
        }}
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1
              className="text-2xl font-semibold tracking-[0.2em] flex items-center gap-3"
              style={{ color: 'var(--skin-title-color)' }}
            >
              <Shield
                className="w-6 h-6"
                style={{
                  color: 'var(--skin-icon-accent)',
                  filter: 'drop-shadow(0 0 10px rgba(0, 229, 255, 0.8))',
                }}
              />
              <span>{t('equipment.title')}</span>
            </h1>
            <p
              className="text-sm mt-1"
              style={{ color: 'var(--skin-text-secondary)' }}
            >
              {t('equipment.subtitle')}
            </p>
          </div>
          <div
            className="px-4 py-2 rounded"
            style={{
              backgroundColor: 'var(--skin-surface-bg)',
              border: '1px solid var(--skin-surface-border)',
            }}
          >
            <span
              className="text-xs uppercase tracking-wider mr-2"
              style={{ color: 'var(--skin-text-muted)' }}
            >
              {t('equipment.balance')}
            </span>
            <span
              className="font-mono"
              style={{
                color: isBalanced
                  ? 'var(--skin-glow-accent)'
                  : 'var(--skin-glow-primary)',
              }}
            >
              {balance > 0 ? '+' : ''}
              {balance.toFixed(1)}
            </span>
          </div>
        </div>

        <div className="flex flex-col md:flex-row items-stretch gap-4 mb-4">
          <div className="w-full md:w-1/2">
            <div
              className="h-full rounded-lg p-4"
              style={{
                backgroundColor: 'var(--skin-surface-bg)',
                border: '1px solid var(--skin-surface-border)',
              }}
            >
              <div
                className="flex justify-between items-center px-2.5 py-1.5 mb-2 rounded-lg"
                style={{
                  backgroundColor: 'var(--skin-surface-base)',
                  border: '1px solid var(--skin-surface-border)',
                }}
              >
                <span
                  className="text-[11px] font-semibold uppercase truncate flex items-center gap-2"
                  style={{ color: 'var(--skin-title-color)' }}
                >
                  <Sparkles
                    className="w-4 h-4"
                    style={{
                      color: 'var(--skin-icon-accent)',
                      filter: 'drop-shadow(0 0 8px rgba(0, 229, 255, 0.8))',
                    }}
                  />
                  {t('equipment.identity')}
                </span>
                <span
                  className="text-[11px] font-mono text-right"
                  style={{ color: 'var(--skin-icon-accent)' }}
                >
                  {t(`equipment.types.${equipment.type}`)}
                </span>
              </div>

              <div className="space-y-3">
                <div>
                  <label
                    className="block text-[10px] uppercase tracking-wider mb-1"
                    style={{ color: 'var(--skin-text-muted)' }}
                  >
                    {t('equipment.name')}
                  </label>
                  <input
                    type="text"
                    value={equipment.name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    className="w-full rounded px-3 py-2 text-sm"
                    style={{
                      backgroundColor: 'var(--skin-surface-base)',
                      border: '1px solid var(--skin-surface-border)',
                      color: 'var(--skin-text-primary)',
                    }}
                    placeholder={t('equipment.namePlaceholder')}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label
                      className="block text-[10px] uppercase tracking-wider mb-1"
                      style={{ color: 'var(--skin-text-muted)' }}
                    >
                      {t('equipment.type')}
                    </label>
                    <select
                      value={equipment.type}
                      onChange={(e) => handleTypeChange(e.target.value as EquipmentType)}
                      className="w-full rounded px-2 py-2 text-xs"
                      style={{
                        backgroundColor: 'var(--skin-surface-base)',
                        border: '1px solid var(--skin-surface-border)',
                        color: 'var(--skin-text-primary)',
                      }}
                    >
                      {EQUIPMENT_TYPES.map((type) => (
                        <option key={type} value={type}>
                          {t(`equipment.types.${type}`)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label
                      className="block text-[10px] uppercase tracking-wider mb-1"
                      style={{ color: 'var(--skin-text-muted)' }}
                    >
                      {t('equipment.rarityLabel')}
                    </label>
                    <select
                      value={equipment.rarity}
                      onChange={(e) => handleRarityChange(e.target.value as EquipmentRarity)}
                      className="w-full rounded px-2 py-2 text-xs"
                      style={{
                        backgroundColor: 'var(--skin-surface-base)',
                        border: '1px solid var(--skin-surface-border)',
                        color: 'var(--skin-text-primary)',
                      }}
                    >
                      {EQUIPMENT_RARITIES.map((rarity) => (
                        <option key={rarity} value={rarity}>
                          {t(`equipment.rarity.${rarity}`)}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label
                    className="block text-[10px] uppercase tracking-wider mb-1"
                    style={{ color: 'var(--skin-text-muted)' }}
                  >
                    {t('equipment.grantedSkill')}
                  </label>
                  <div
                    className="text-xs rounded p-2"
                    style={{
                      backgroundColor: 'var(--skin-surface-base)',
                      border: '1px solid var(--skin-surface-border)',
                      color: 'var(--skin-text-secondary)',
                    }}
                  >
                    <div className="flex flex-wrap gap-2 mb-2">
                      {(equipment.grantedSkillIds || []).map((spellId) => {
                        const spell = config.spells[spellId];
                        return (
                          <span
                            key={spellId}
                            className="flex items-center gap-1 px-2 py-1 rounded text-[10px]"
                            style={{
                              backgroundColor: 'var(--skin-surface-bg)',
                              color: 'var(--skin-text-primary)',
                              border: '1px solid var(--skin-surface-border)',
                            }}
                          >
                            {spell?.name ?? spellId}
                            <button
                              type="button"
                              onClick={() => handleRemoveGrantedSkill(spellId)}
                              className="ml-1 hover:opacity-70"
                              title={t('equipment.removeSkill')}
                            >
                              ×
                            </button>
                          </span>
                        );
                      })}
                    </div>
                    <input
                      type="text"
                      value={skillSearch}
                      onChange={(e) => setSkillSearch(e.target.value)}
                      className="w-full rounded px-2 py-1.5 mb-1 text-[10px]"
                      style={{
                        backgroundColor: 'var(--skin-surface-bg)',
                        border: '1px solid var(--skin-surface-border)',
                        color: 'var(--skin-text-primary)',
                      }}
                      placeholder={t('equipment.searchSkill')}
                    />
                    <select
                      value=""
                      onChange={(e) => {
                        if (e.target.value) handleAddGrantedSkill(e.target.value);
                        e.target.value = '';
                      }}
                      className="w-full rounded px-2 py-1.5 text-[10px]"
                      style={{
                        backgroundColor: 'var(--skin-surface-bg)',
                        border: '1px solid var(--skin-surface-border)',
                        color: 'var(--skin-text-primary)',
                      }}
                    >
                      <option value="">{t('equipment.addSkill')}</option>
                      {Object.values(config.spells)
                        .filter((spell) => !(equipment.grantedSkillIds || []).includes(spell.id))
                        .filter((spell) =>
                          skillSearch.trim() === '' ||
                          spell.name.toLowerCase().includes(skillSearch.toLowerCase()) ||
                          spell.id.toLowerCase().includes(skillSearch.toLowerCase())
                        )
                        .map((spell) => (
                          <option key={spell.id} value={spell.id}>
                            {spell.name} ({spell.id})
                          </option>
                        ))}
                    </select>
                  </div>
                </div>

                <div
                  className="mt-3 text-[10px]"
                  style={{ color: 'var(--skin-text-muted)' }}
                >
                  {t('equipment.description')}
                </div>
              </div>
            </div>
          </div>

          <div className="w-full md:w-1/2 min-w-75">
            <div
              className="h-full overflow-y-auto flex flex-col rounded-lg p-4"
              style={{
                backgroundColor: 'var(--skin-surface-bg)',
                border: '1px solid var(--skin-surface-border)',
              }}
            >
              <div
                className="flex justify-between items-center px-2.5 py-1.5 mb-2 rounded-lg"
                style={{
                  backgroundColor: 'var(--skin-surface-base)',
                  border: '1px solid var(--skin-surface-border)',
                }}
              >
                <span
                  className="text-[11px] font-semibold uppercase truncate flex items-center gap-2"
                  style={{ color: 'var(--skin-title-color)' }}
                >
                  <Sparkles
                    className="w-4 h-4"
                    style={{
                      color: 'var(--skin-icon-accent)',
                      filter: 'drop-shadow(0 0 8px rgba(0, 229, 255, 0.8))',
                    }}
                  />
                  {t('equipment.preview')}
                </span>
                <span
                  className="text-[11px] font-mono text-right"
                  style={{ color: 'var(--skin-icon-accent)' }}
                >
                  {t('equipment.tier')} {tier}
                </span>
              </div>

              <div
                className="mt-2 text-[10px] flex flex-wrap gap-x-4 gap-y-1"
                style={{ color: 'var(--skin-text-muted)' }}
              >
                <span>
                  {t('equipment.power')}:
                  <span
                    className="ml-1 font-mono"
                    style={{ color: 'var(--skin-icon-accent)' }}
                  >
                    {power.toFixed(1)} HP
                  </span>
                </span>
                <span>
                  {t('equipment.cost')}:
                  <span
                    className="ml-1 font-mono"
                    style={{ color: 'var(--skin-icon-accent)' }}
                  >
                    {cost.toFixed(1)}
                  </span>
                </span>
                <span>
                  {t('equipment.budget')}:
                  <span
                    className="ml-1 font-mono"
                    style={{ color: 'var(--skin-icon-accent)' }}
                  >
                    {budget} ({rarityConfig.extraPoints >= 0 ? '+' : ''}{rarityConfig.extraPoints})
                  </span>
                </span>
              </div>

              <ul
                className="mt-3 text-xs grid grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-1"
                style={{ color: 'var(--skin-text-primary)' }}
              >
                {Object.entries(equipment.stats)
                  .filter(([, value]) => value !== 0 && value !== undefined)
                  .map(([key, value]) => (
                    <li
                      key={key}
                      className="flex justify-between items-center p-0.5 rounded transition-colors"
                      style={{
                        borderBottom: '1px solid var(--skin-surface-border)',
                      }}
                    >
                      <span
                        className="font-medium capitalize truncate mr-2"
                        style={{
                          color: 'var(--skin-icon-accent)',
                          opacity: 0.7,
                        }}
                        title={key}
                      >
                        {t(`equipment.stat.${key}`)}
                      </span>
                      <span
                        className="font-mono font-bold"
                        style={{
                          color: 'var(--skin-icon-accent)',
                          filter: 'drop-shadow(0 0 4px rgba(0, 229, 255, 0.4))',
                        }}
                      >
                        {String(value)}
                      </span>
                    </li>
                  ))}
              </ul>

              <div
                className="mt-4 text-[10px]"
                style={{ color: 'var(--skin-text-muted)' }}
              >
                {isBalanced
                  ? t('equipment.balanced', { balance: balance.toFixed(1), interpolation: { escapeValue: false } })
                  : t('equipment.overBudget', { balance: balance.toFixed(1), interpolation: { escapeValue: false } })}
              </div>
            </div>
          </div>
        </div>

        <div
          className="my-4"
          style={{
            height: '1px',
            background: 'linear-gradient(90deg, transparent, var(--skin-surface-border), transparent)',
          }}
        />

        <div className="mt-4">
          <StatsGrid
            statOrder={statOrder}
            getStatDescription={getEquipmentStatDescription}
            isMalus={() => false}
            collapsedStats={collapsedStats}
            toggleCollapse={toggleCollapse}
            getStatSteps={getStatSteps}
            updateStatStep={updateStatStep}
            addStatStep={addStatStep}
            removeStatStep={removeStatStep}
            selectedTicks={selectedTicks}
            onSelectTick={handleSelectTick}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            getStatLabel={(field) => t(`equipment.stat.${field}`, field)}
          />
        </div>

        <div className="mt-4 flex items-center gap-2">
          <select
            value=""
            onChange={(e) => {
              if (e.target.value) handleAddStat(e.target.value);
              e.target.value = '';
            }}
            className="flex-1 rounded px-2 py-2 text-xs"
            style={{
              backgroundColor: 'var(--skin-surface-base)',
              border: '1px solid var(--skin-surface-border)',
              color: 'var(--skin-text-primary)',
            }}
          >
            <option value="">{t('equipment.addStat', '+ Stat')}</option>
            {Object.values(balancerConfig?.stats || {})
              .filter((stat) => !statOrder.includes(stat.id) && !['id', 'name', 'description'].includes(stat.id))
              .map((stat) => (
                <option key={stat.id} value={stat.id}>
                  {stat.name || t(`equipment.stat.${stat.id}`, stat.id)}
                </option>
              ))}
          </select>
        </div>

        <div
          className="my-4"
          style={{
            height: '1px',
            background: 'linear-gradient(90deg, transparent, var(--skin-surface-border), transparent)',
          }}
        />

        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex gap-3">
            <MatericButton variant="cta" onClick={() => void handleSave()}>
              {t('equipment.save')}
            </MatericButton>
            <MatericButton variant="secondary" onClick={() => void handleSaveDefault()}>
              {t('equipment.saveDefault')}
            </MatericButton>
            <MatericButton variant="utility" onClick={() => void resetToDefaults()}>
              {t('equipment.reset')}
            </MatericButton>
          </div>
          <div
            className="px-4 py-2 rounded text-sm font-mono"
            style={{
              backgroundColor: 'var(--skin-surface-bg)',
              border: '1px solid var(--skin-surface-border)',
              color: isBalanced
                ? 'var(--skin-glow-accent)'
                : 'var(--skin-glow-primary)',
            }}
          >
            {t('equipment.balance')}: {balance > 0 ? '+' : ''}{balance.toFixed(1)}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EquipmentCreatorTestPage;
