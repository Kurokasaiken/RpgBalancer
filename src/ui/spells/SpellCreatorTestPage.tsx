import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Sparkles } from 'lucide-react';
import { useSkinPreferences } from '../idleVillage/hooks/useSkinPreferences';
import { saveData } from '../../shared/persistence/PersistenceService';
import { SpellInfoForm } from './components/SpellInfoForm';
import { StatsGrid } from './components/StatsGrid';
import { ActionsBar } from './components/ActionsBar';
import { SpellIdentityCard } from './components/SpellIdentityCard';
import type { Spell } from '../../balancing/spellTypes';
import { createEmptySpell } from '../../balancing/spellTypes';
import { DEFAULT_SPELLS } from '../../balancing/defaultSpells';
import {
  getStatDescription,
  isMalus,
  BUFFABLE_STATS,
} from '../../balancing/spellBalancingConfig';
import { upsertSpell } from '../../balancing/spellStorage';
import { useDefaultStorage } from '../../shared/hooks/useDefaultStorage';
import { SPELL_CORE_STATS, SPELL_ADVANCED_STATS, SPELL_OPTIONAL_STATS } from '../../balancing/spellStatDefinitions';
import { getSpellPreview } from '../../balancing/spell/preview';
import { SpellCostModule } from '../../balancing/modules/spellcost';
import { useSpellConfig } from '../../spells/hooks/useSpellConfig';

/**
 * Helper function to get numeric value from spell field
 */
const getNumericSpellField = (s: Spell, field: keyof Spell): number => {
  const value = s[field];
  return typeof value === 'number' ? value : 0;
};

/**
 * SpellCreatorTestPage component
 * 
 * Modernized version of SpellCreatorNew with V9 skin system integration.
 * Preserves all logic and behavior from the original while adopting:
 * - V9 skin system (useSkinPreferences with CSS variables)
 * - i18n for all user-facing strings
 * - Async PersistenceService instead of localStorage
 * - V9 palette: Obsidian + Azure + Gold/Bronze + Ivory
 * 
 * @returns React component
 */
export const SpellCreatorTestPage: React.FC = () => {
  const { t } = useTranslation('spell');
  // V9 skin system integration - CSS variables are applied via style props
  useSkinPreferences();

  const {
    spell,
    setSpell,
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
  } = useDefaultStorage();

  const [targetBudget, setTargetBudget] = useState<number>(0);

  const { config, activePreset } = useSpellConfig();
  const [selectedConfigSpellId, setSelectedConfigSpellId] = useState<string>('');
  const configSpells = Object.values(config.spells);
  const selectedConfigSpell = selectedConfigSpellId ? config.spells[selectedConfigSpellId] : undefined;

  const coreStats = SPELL_CORE_STATS;
  const advancedStats = SPELL_ADVANCED_STATS;
  const optionalStats = SPELL_OPTIONAL_STATS;

  /**
   * Calculate total cost from all stat weights
   */
  const calculateCost = (): number => {
    const allStats = [...coreStats, ...advancedStats, ...optionalStats];
    return allStats.reduce((sum, field) => {
      const steps = statSteps[field];
      if (steps && steps.length > 0) {
        const selectedIdx = selectedTicks[field] || 0;
        const selectedStep = steps[selectedIdx];
        return sum + (selectedStep?.weight || 0);
      }
      return sum;
    }, 0);
  };

  /**
   * Calculate balance (cost - target budget)
   */
  const calculateBalance = (): number => {
    return calculateCost() - targetBudget;
  };
  const balance = calculateBalance();

  const preview = getSpellPreview(spell);

  const powerBreakdown = SpellCostModule.calculateSpellPower(spell);
  const recommendedManaCost = SpellCostModule.getRecommendedManaCost(spell);
  const isManaBalanced = SpellCostModule.isBalanced(spell);
  const statEquivalent = SpellCostModule.compareToStatInvestment(spell);

  /**
   * Handle drag start for stat reordering
   */
  const handleDragStart = (e: React.DragEvent, field: string) => {
    e.dataTransfer.setData('text/plain', field);
  };

  /**
   * Handle drag over
   */
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  /**
   * Handle drop for stat reordering
   */
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

  /**
   * Get steps for a given stat field
   */
  const getStatSteps = (field: string) => {
    const stepsForField = statSteps[field];
    if (stepsForField && stepsForField.length > 0) {
      return stepsForField;
    }
    return [{ value: getNumericSpellField(spell, field as keyof Spell), weight: 1 }];
  };

  /**
   * Update a single step in the stat steps
   */
  const updateStatStep = (field: string, idx: number, step: { value: number; weight: number }) => {
    setStatSteps((prev) => {
      const existing = prev[field];
      const steps = [...(existing && existing.length > 0 ? existing : [{ value: getNumericSpellField(spell, field as keyof Spell), weight: 1 }])];
      steps[idx] = step;
      return { ...prev, [field]: steps };
    });
    const currentTick = selectedTicks[field] || 0;
    if (idx === currentTick) {
      updateField(field as keyof Spell, step.value);
    }
  };

  /**
   * Handle tick selection
   */
  const handleSelectTick = (field: string, idx: number) => {
    setSelectedTicks((prev) => ({ ...prev, [field]: idx }));
    const stepsForField = statSteps[field];
    const steps = stepsForField && stepsForField.length > 0
      ? stepsForField
      : [{ value: getNumericSpellField(spell, field as keyof Spell), weight: 1 }];
    if (steps[idx]) {
      updateField(field as keyof Spell, steps[idx].value);
    }
  };

  /**
   * Add a new step to the stat
   */
  const addStatStep = (field: string, idx: number) => {
    setStatSteps((prev) => {
      const existing = prev[field];
      const steps = [...(existing && existing.length > 0 ? existing : [{ value: getNumericSpellField(spell, field as keyof Spell), weight: 1 }])];
      steps.splice(idx + 1, 0, { value: 0, weight: 1 });
      return { ...prev, [field]: steps };
    });
  };

  /**
   * Remove a step from the stat
   */
  const removeStatStep = (field: string, idx: number) => {
    setStatSteps((prev) => {
      const existing = prev[field];
      const steps = [...(existing && existing.length > 0 ? existing : [{ value: getNumericSpellField(spell, field as keyof Spell), weight: 1 }])];
      if (steps.length > 3) steps.splice(idx, 1);
      return { ...prev, [field]: steps };
    });
  };

  /**
   * Update a spell field
   */
  const updateField = (field: keyof Spell, value: Spell[keyof Spell]) => {
    setSpell((prev) => ({ ...prev, [field]: value }));
  };

  /**
   * Handle save spell
   */
  const handleSave = () => {
    const defaultSpell = DEFAULT_SPELLS[0];
    const minimalSpell: Partial<Spell> = { id: spell.id, name: spell.name, type: spell.type };
    (Object.keys(spell) as (keyof Spell)[]).forEach((key) => {
      if (key === 'id' || key === 'name' || key === 'type') return;
      const value = spell[key];
      const defaultValue = defaultSpell[key];
      if (value !== undefined && value !== defaultValue) {
        (minimalSpell as Record<keyof Spell, Spell[keyof Spell]>)[key] = value;
      }
    });
    const finalSpell = minimalSpell as Spell;
    upsertSpell(finalSpell);
    toast.success(t('spellSaved', 'Spell saved successfully!'), {
      description: t('spellAddedToLibrary', `"${finalSpell.name}" has been added to your library`),
    });
    setSpell(createEmptySpell());
  };

  /**
   * Handle reset to defaults
   */
  const handleReset = () => {
    resetToDefaults();
  };

  /**
   * Handle save default configuration
   */
  const handleSaveDefault = async () => {
    const success = await saveDefaultConfig({
      spell,
      statOrder,
      collapsedStats,
      statSteps,
      selectedTicks,
    });

    if (success) {
      toast.success(t('configSaved', 'Configuration saved as default!'), {
        description: t('configSavedDescription', 'Spell, card order, collapsed states, and slider positions saved'),
      });
    } else {
      toast.error(t('saveFailed', 'Failed to save default'), {
        description: t('saveFailedDescription', 'Please try again or check console for errors'),
      });
    }
  };

  /**
   * Handle selection of config spell
   */
  const handleSelectConfigSpell = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const id = event.target.value;
    setSelectedConfigSpellId(id);
    if (!id) return;
    const def = config.spells[id];
    if (!def) return;
    setSpell((prev) => ({
      ...prev,
      name: def.name,
      description: def.description,
    }));
  };

  /**
   * Toggle collapse state for a stat
   * Uses PersistenceService instead of localStorage
   */
  const toggleCollapse = async (field: string) => {
    setCollapsedStats((prev) => {
      const next = new Set(prev);
      if (next.has(field)) {
        next.delete(field);
      } else {
        next.add(field);
      }
      // Persist collapsed state using PersistenceService
      saveData('spellCollapsedStats', Array.from(next));
      saveData('spellBalanceConfig', { collapsedStats: Array.from(next) });
      return next;
    });
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
              <Sparkles 
                className="w-6 h-6"
                style={{ 
                  color: 'var(--skin-icon-accent)',
                  filter: 'drop-shadow(0 0 10px rgba(0, 229, 255, 0.8))',
                }} 
              />
              <span>{t('spellCreator', 'Spell Creator')}</span>
            </h1>
            <p 
              className="text-sm mt-1"
              style={{ color: 'var(--skin-text-secondary)' }}
            >
              V9 Skin System · Obsidian + Azure + Gold
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
              {t('balance', 'Balance')}
            </span>
            <span
              className={`font-mono ${
                balance === 0 ? 'text-green-400' : 'text-amber-400'
              }`}
              style={{ color: balance === 0 ? 'var(--skin-glow-accent)' : 'var(--skin-glow-primary)' }}
            >
              {balance > 0 ? '+' : ''}
              {balance.toFixed(2)}
            </span>
          </div>
        </div>

        <div className="flex flex-col md:flex-row items-stretch gap-4 mb-4">
          <div className="w-full md:w-1/2">
            {configSpells.length > 0 && (
              <div 
                className="mb-3 px-3 py-2 rounded text-[10px] uppercase tracking-[0.18em]"
                style={{
                  backgroundColor: 'var(--skin-surface-bg)',
                  border: '1px solid var(--skin-surface-border)',
                  color: 'var(--skin-text-muted)',
                }}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="mr-2">{t('configLibrary', 'Config Library')}</span>
                  <div className="flex items-center gap-2">
                    {activePreset && (
                      <span 
                        className="text-[9px] normal-case"
                        style={{ color: 'var(--skin-text-secondary)' }}
                      >
                        {activePreset.name}
                      </span>
                    )}
                    <select
                      value={selectedConfigSpellId}
                      onChange={handleSelectConfigSpell}
                      className="px-2 py-1 rounded text-xs bg-transparent border cursor-pointer"
                      style={{
                        borderColor: 'var(--skin-surface-border)',
                        color: 'var(--skin-text-primary)',
                      }}
                    >
                      <option value="">{t('selectSpell', 'Select Spell')}</option>
                      {configSpells.map((def) => (
                        <option key={def.id} value={def.id}>
                          {def.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                {selectedConfigSpell && (
                  <div 
                    className="mt-1 text-[9px] normal-case flex flex-wrap gap-x-3 gap-y-0.5"
                    style={{ color: 'var(--skin-text-secondary)' }}
                  >
                    <span>
                      {t('school', 'School')}:
                      <span 
                        className="ml-1"
                        style={{ color: 'var(--skin-text-primary)' }}
                      >
                        {selectedConfigSpell.school}
                      </span>
                    </span>
                    <span>
                      {t('level', 'Level')}:
                      <span 
                        className="ml-1"
                        style={{ color: 'var(--skin-text-primary)' }}
                      >
                        {selectedConfigSpell.level}
                      </span>
                    </span>
                    <span>
                      {t('range', 'Range')}:
                      <span 
                        className="ml-1"
                        style={{ color: 'var(--skin-text-primary)' }}
                      >
                        {selectedConfigSpell.range}
                      </span>
                    </span>
                    <span>
                      {t('duration', 'Duration')}:
                      <span 
                        className="ml-1"
                        style={{ color: 'var(--skin-text-primary)' }}
                      >
                        {selectedConfigSpell.duration}
                      </span>
                    </span>
                  </div>
                )}
              </div>
            )}
            <SpellIdentityCard
              spell={spell}
              updateField={updateField}
              targetBudget={targetBudget}
              setTargetBudget={setTargetBudget}
              targetStatOptions={Array.from(BUFFABLE_STATS)}
            />
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
                  {t('previewSpell', 'Preview Spell')}
                </span>
                <span 
                  className="text-[11px] font-mono text-right"
                  style={{ color: 'var(--skin-icon-accent)' }}
                >
                  {preview.primaryText}
                  {preview.secondaryText && (
                    <span 
                      className="text-xs ml-2"
                      style={{ color: 'var(--skin-glow-accent)' }}
                    >
                      {preview.secondaryText}
                    </span>
                  )}
                </span>
              </div>

              <div 
                className="mt-2 text-[10px] flex flex-wrap gap-x-4 gap-y-1"
                style={{ color: 'var(--skin-text-muted)' }}
              >
                <span>
                  {t('power', 'Power')}:
                  <span 
                    className="ml-1 font-mono"
                    style={{ color: 'var(--skin-icon-accent)' }}
                  >
                    {powerBreakdown.totalPower.toFixed(1)} HP
                  </span>
                </span>
                <span>
                  ≈ {t('statInvestment', 'Stat Investment')}:
                  <span 
                    className="ml-1 font-mono"
                    style={{ color: 'var(--skin-icon-accent)' }}
                    title={statEquivalent.description}
                  >
                    {statEquivalent.damageEquivalent.toFixed(1)} dmg-equivalent
                  </span>
                </span>
                <span>
                  {t('recommendedMana', 'Recommended Mana')}:
                  <span 
                    className="ml-1 font-mono"
                    style={{ color: 'var(--skin-icon-accent)' }}
                  >
                    {recommendedManaCost}
                  </span>
                </span>
                {typeof spell.manaCost === 'number' && (
                  <span>
                    {t('currentMana', 'Current Mana')}:
                    <span
                      className={`ml-1 font-mono ${
                        isManaBalanced ? 'text-green-400' : 'text-amber-400'
                      }`}
                      style={{ color: isManaBalanced ? 'var(--skin-glow-accent)' : 'var(--skin-glow-primary)' }}
                    >
                      {spell.manaCost}
                    </span>
                  </span>
                )}
              </div>

              {(spell.type === 'buff' || spell.type === 'debuff') && (
                <div className="mt-2">
                  <div 
                    className="text-[11px] flex justify-between items-center"
                    style={{ color: 'var(--skin-text-secondary)' }}
                  >
                    <span>
                      {spell.type === 'buff' ? t('buff', 'Buff') : t('debuff', 'Debuff')} {t('summary', 'Summary')}
                    </span>
                    <span className="flex items-center gap-1 text-[11px]">
                      <span 
                        className={spell.type === 'buff' ? 'text-green-400' : 'text-red-400'}
                        style={{ color: spell.type === 'buff' ? 'var(--skin-glow-accent)' : 'var(--skin-glow-primary)' }}
                      >
                        {spell.type === 'buff' ? t('increases', 'Increases') : t('decreases', 'Decreases')} {spell.targetStat || 'damage'}
                      </span>
                      <span style={{ color: 'var(--skin-text-muted)' }}>{t('by', 'by')}</span>
                      <span 
                        className="font-mono"
                        style={{ color: 'var(--skin-text-primary)' }}
                      >
                        {Math.abs(spell.effect)}%
                      </span>
                      <span style={{ color: 'var(--skin-text-muted)' }}>{t('for', 'for')}</span>
                      <span 
                        className="font-mono"
                        style={{ color: 'var(--skin-text-primary)' }}
                      >
                        {spell.eco} {t('turns', 'turns')}
                      </span>
                    </span>
                  </div>
                </div>
              )}

              <ul 
                className="mt-3 text-xs grid grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-1"
                style={{ color: 'var(--skin-text-primary)' }}
              >
                {spell.effect !== undefined && (
                  <li 
                    className="flex justify-between items-center p-0.5 rounded transition-colors"
                    style={{ borderBottom: '1px solid var(--skin-surface-border)' }}
                  >
                    <span style={{ color: 'var(--skin-text-secondary)' }}>
                      {spell.type === 'buff' || spell.type === 'debuff' ? t('modificationPercent', 'Modification %') : t('effect', 'Effect')}
                    </span>
                    <span 
                      className="font-mono"
                      style={{ color: 'var(--skin-text-primary)' }}
                    >
                      {spell.effect}
                    </span>
                  </li>
                )}
                {Object.entries(spell)
                  .filter(([key, value]) => {
                    const defaultSpell = DEFAULT_SPELLS[0] as Spell;
                    return (
                      key !== 'id' &&
                      key !== 'name' &&
                      key !== 'type' &&
                      key !== 'effect' &&
                      key !== 'targetStat' &&
                      value !== undefined &&
                      value !== defaultSpell[key as keyof Spell] &&
                      typeof value !== 'object'
                    );
                  })
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
                        {key === 'eco' && (spell.type === 'buff' || spell.type === 'debuff')
                          ? t('durationTurns', 'Duration (Turns)')
                          : key.replace(/([A-Z])/g, ' $1').trim()}
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
            getStatDescription={getStatDescription}
            isMalus={isMalus}
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
          />
        </div>

        <div 
          className="my-4"
          style={{ 
            height: '1px',
            background: 'linear-gradient(90deg, transparent, var(--skin-surface-border), transparent)',
          }}
        />

        <SpellInfoForm spell={spell} updateField={updateField} />

        <div 
          className="my-4"
          style={{ 
            height: '1px',
            background: 'linear-gradient(90deg, transparent, var(--skin-surface-border), transparent)',
          }}
        />

        <ActionsBar onReset={handleReset} onSave={handleSave} onSaveDefault={handleSaveDefault} balance={balance} />
      </div>
    </div>
  );
};

export default SpellCreatorTestPage;
