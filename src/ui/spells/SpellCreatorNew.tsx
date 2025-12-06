import React, { useState } from 'react';
import { toast } from 'sonner';
import { SpellInfoForm } from '../spell/components/SpellInfoForm';
import { StatsGrid } from '../spell/components/StatsGrid';
import { ActionsBar } from '../spell/components/ActionsBar';
import { SpellIdentityCard } from '../spell/components/SpellIdentityCard';
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

const getNumericSpellField = (s: Spell, field: keyof Spell): number => {
  const value = s[field];
  return typeof value === 'number' ? value : 0;
};

export const SpellCreatorNew: React.FC = () => {
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

  const calculateBalance = (): number => {
    return calculateCost() - targetBudget;
  };
  const balance = calculateBalance();

  const preview = getSpellPreview(spell);

  const powerBreakdown = SpellCostModule.calculateSpellPower(spell);
  const recommendedManaCost = SpellCostModule.getRecommendedManaCost(spell);
  const isManaBalanced = SpellCostModule.isBalanced(spell);
  const statEquivalent = SpellCostModule.compareToStatInvestment(spell);

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

  const getStatSteps = (field: string) => {
    const stepsForField = statSteps[field];
    if (stepsForField && stepsForField.length > 0) {
      return stepsForField;
    }
    return [{ value: getNumericSpellField(spell, field as keyof Spell), weight: 1 }];
  };

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

  const addStatStep = (field: string, idx: number) => {
    setStatSteps((prev) => {
      const existing = prev[field];
      const steps = [...(existing && existing.length > 0 ? existing : [{ value: getNumericSpellField(spell, field as keyof Spell), weight: 1 }])];
      steps.splice(idx + 1, 0, { value: 0, weight: 1 });
      return { ...prev, [field]: steps };
    });
  };

  const removeStatStep = (field: string, idx: number) => {
    setStatSteps((prev) => {
      const existing = prev[field];
      const steps = [...(existing && existing.length > 0 ? existing : [{ value: getNumericSpellField(spell, field as keyof Spell), weight: 1 }])];
      if (steps.length > 3) steps.splice(idx, 1);
      return { ...prev, [field]: steps };
    });
  };

  const updateField = (field: keyof Spell, value: Spell[keyof Spell]) => {
    setSpell((prev) => ({ ...prev, [field]: value }));
  };

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
    toast.success('Spell saved successfully!', {
      description: `"${finalSpell.name}" has been added to your library`,
    });
    setSpell(createEmptySpell());
  };

  const handleReset = () => {
    resetToDefaults();
  };

  const handleSaveDefault = () => {
    const success = saveDefaultConfig({
      spell,
      statOrder,
      collapsedStats,
      statSteps,
      selectedTicks,
    });

    if (success) {
      toast.success('Configuration saved as default!', {
        description: 'Spell, card order, collapsed states, and slider positions saved',
      });
    } else {
      toast.error('Failed to save default', {
        description: 'Please try again or check console for errors',
      });
    }
  };

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

  const toggleCollapse = (field: string) => {
    setCollapsedStats((prev) => {
      const next = new Set(prev);
      if (next.has(field)) {
        next.delete(field);
      } else {
        next.add(field);
      }
      localStorage.setItem('spellCollapsedStats', JSON.stringify(Array.from(next)));
      localStorage.setItem('spellBalanceConfig', JSON.stringify({ collapsedStats: Array.from(next) }));
      return next;
    });
  };

  return (
    <div className="h-full overflow-y-auto bg-[radial-gradient(circle_at_top,#020617_0,#020617_55%,#000000_100%)] p-4 relative text-slate-100">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(148,163,184,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.08)_1px,transparent_1px)] bg-size-[22px_22px] opacity-40" />
        <div className="absolute w-80 h-80 bg-cyan-500/15 rounded-full blur-3xl -top-10 -left-20" />
        <div className="absolute w-80 h-80 bg-indigo-500/20 rounded-full blur-3xl bottom-0 -right-16" />
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-semibold tracking-[0.25em] uppercase text-indigo-200 drop-shadow-[0_0_12px_rgba(129,140,248,0.8)]">
              Spell Creator
            </h1>
            <p className="mt-1 text-[10px] md:text-xs text-slate-400 uppercase tracking-[0.25em]">
              Arcane Tech Glass · Config-Driven
            </p>
          </div>
          <div className="flex items-center gap-4 bg-slate-900/80 px-4 py-2 rounded-2xl border border-indigo-500/40 shadow-[0_0_20px_rgba(79,70,229,0.5)]">
            <span className="text-xs uppercase tracking-[0.22em] text-slate-400 font-semibold">
              Balance
            </span>
            <span
              className={`text-lg font-mono drop-shadow-[0_0_8px_currentColor] ${
                balance === 0 ? 'text-emerald-400' : 'text-red-400'
              }`}
            >
              {balance > 0 ? '+' : ''}
              {balance.toFixed(2)}
            </span>
          </div>
        </div>

        <div className="flex flex-col md:flex-row items-stretch gap-4 mb-4">
          <div className="w-full md:w-5/12">
            {configSpells.length > 0 && (
              <div className="mb-3 bg-slate-900/70 border border-indigo-500/40 rounded-2xl px-3 py-2 text-[10px] uppercase tracking-[0.18em] text-slate-400">
                <div className="flex items-center justify-between mb-1">
                  <span className="mr-2">Config Library</span>
                  <div className="flex items-center gap-2">
                    {activePreset && (
                      <span className="text-[9px] text-slate-500 normal-case">
                        {activePreset.name}
                      </span>
                    )}
                    <select
                      value={selectedConfigSpellId}
                      onChange={handleSelectConfigSpell}
                      className="bg-slate-950/80 border border-indigo-500/40 rounded px-2 py-1 text-[10px] tracking-[0.12em] text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-400"
                    >
                      <option value="">Select Spell</option>
                      {configSpells.map((def) => (
                        <option key={def.id} value={def.id}>
                          {def.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                {selectedConfigSpell && (
                  <div className="mt-1 text-[9px] text-slate-400 normal-case flex flex-wrap gap-x-3 gap-y-0.5">
                    <span>
                      School:
                      <span className="ml-1 text-slate-200">{selectedConfigSpell.school}</span>
                    </span>
                    <span>
                      Level:
                      <span className="ml-1 text-slate-200">{selectedConfigSpell.level}</span>
                    </span>
                    <span>
                      Range:
                      <span className="ml-1 text-slate-200">{selectedConfigSpell.range}</span>
                    </span>
                    <span>
                      Duration:
                      <span className="ml-1 text-slate-200">{selectedConfigSpell.duration}</span>
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

          <div className="w-full md:w-7/12 min-w-[300px]">
            <div className="backdrop-blur-md bg-slate-900/70 border border-cyan-500/40 rounded-2xl p-4 h-full shadow-[0_0_24px_rgba(34,211,238,0.35)] overflow-y-auto">
              <div className="flex justify-between items-center text-lg font-bold text-cyan-100 mb-2 border-b border-cyan-500/30 pb-1">
                <span>Preview Spell</span>
                <span className="text-sm font-mono text-cyan-400">
                  {preview.primaryText}
                  {preview.secondaryText && (
                    <span className="text-xs text-cyan-300 ml-2">{preview.secondaryText}</span>
                  )}
                </span>
              </div>

              <div className="mt-2 text-[10px] text-slate-400 flex flex-wrap gap-x-4 gap-y-1">
                <span>
                  Power:
                  <span className="ml-1 font-mono text-cyan-300">
                    {powerBreakdown.totalPower.toFixed(1)} HP
                  </span>
                </span>
                <span>
                  ≈ Stat Investment:
                  <span className="ml-1 font-mono text-cyan-300" title={statEquivalent.description}>
                    {statEquivalent.damageEquivalent.toFixed(1)} dmg-equivalent
                  </span>
                </span>
                <span>
                  Recommended Mana:
                  <span className="ml-1 font-mono text-cyan-300">
                    {recommendedManaCost}
                  </span>
                </span>
                {typeof spell.manaCost === 'number' && (
                  <span>
                    Current Mana:
                    <span
                      className={`ml-1 font-mono ${
                        isManaBalanced ? 'text-emerald-300' : 'text-amber-300'
                      }`}
                    >
                      {spell.manaCost}
                    </span>
                  </span>
                )}
              </div>

              {(spell.type === 'buff' || spell.type === 'debuff') && (
                <div className="mt-2 p-2 bg-slate-900/70 rounded border border-cyan-500/30">
                  <div className="flex items-center gap-2 text-sm">
                    <span className={spell.type === 'buff' ? 'text-emerald-400' : 'text-red-400'}>
                      {spell.type === 'buff' ? 'Increases' : 'Decreases'} {spell.targetStat || 'damage'}
                    </span>
                    <span className="text-slate-500">by</span>
                    <span className="font-bold text-slate-50">{Math.abs(spell.effect)}%</span>
                    <span className="text-slate-500">for</span>
                    <span className="font-bold text-slate-50">{spell.eco} turns</span>
                  </div>
                </div>
              )}

              <ul className="mt-3 text-xs text-cyan-50 grid grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-1">
                {spell.effect !== undefined && (
                  <li className="flex justify-between items-center hover:bg-cyan-500/10 p-0.5 rounded transition-colors border-b border-cyan-500/10">
                    <span className="font-medium text-cyan-300/70 capitalize truncate mr-2">
                      {spell.type === 'buff' || spell.type === 'debuff' ? 'Modification %' : 'Effect'}
                    </span>
                    <span className="font-mono text-cyan-300 font-bold drop-shadow-[0_0_4px_rgba(34,211,238,0.4)]">
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
                      className="flex justify-between items-center hover:bg-cyan-500/10 p-0.5 rounded transition-colors border-b border-cyan-500/10"
                    >
                      <span className="font-medium text-cyan-300/70 capitalize truncate mr-2" title={key}>
                        {key === 'eco' && (spell.type === 'buff' || spell.type === 'debuff')
                          ? 'Duration (Turns)'
                          : key.replace(/([A-Z])/g, ' $1').trim()}
                      </span>
                      <span className="font-mono text-cyan-300 font-bold drop-shadow-[0_0_4px_rgba(34,211,238,0.4)]">
                        {String(value)}
                      </span>
                    </li>
                  ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="h-px bg-linear-to-r from-transparent via-slate-300/40 to-transparent my-8" />

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

        <div className="h-px bg-linear-to-r from-transparent via-slate-300/40 to-transparent my-8" />

        <SpellInfoForm spell={spell} updateField={updateField} />

        <div className="h-px bg-linear-to-r from-transparent via-slate-300/40 to-transparent my-8" />

        <ActionsBar onReset={handleReset} onSave={handleSave} onSaveDefault={handleSaveDefault} balance={balance} />
      </div>
    </div>
  );
};

export default SpellCreatorNew;
