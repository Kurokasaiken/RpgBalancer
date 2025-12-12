/**
 * Global Rules UI for Idle Village.
 * Allows editing fatigue thresholds, injury parameters, and quest limits
 * in a config-first way using IdleVillageConfig.globalRules.
 */

import { useIdleVillageConfig } from '@/balancing/hooks/useIdleVillageConfig';
import { DefaultSection } from '@/ui/components/DefaultUI';

export default function IdleVillageGlobalRulesTab() {
  const { config, updateConfig } = useIdleVillageConfig();
  const rules = config.globalRules;
  const resources = Object.values(config.resources ?? {});

  const DEFAULT_VERB_TONE_COLORS: Record<'neutral' | 'job' | 'quest' | 'danger' | 'system', string> = {
    neutral: '#94A3B8',
    job: '#3B82F6',
    quest: '#34D399',
    danger: '#F87171',
    system: '#38BDF8',
  };

  const handleNumberChange = (key: keyof typeof rules) => (value: string) => {
    const parsed = value === '' ? NaN : Number(value);
    if (Number.isNaN(parsed)) return;
    updateConfig({
      globalRules: {
        ...rules,
        [key]: parsed,
      },
    });
  };

  const handleStartingResourceChange = (resourceId: string, value: string) => {
    const parsed = value === '' ? 0 : Number(value);
    if (Number.isNaN(parsed) || parsed < 0) return;

    const current = rules.startingResources ?? {};
    const next: Record<string, number> = { ...current };

    if (parsed <= 0) {
      delete next[resourceId];
    } else {
      next[resourceId] = parsed;
    }

    updateConfig({
      globalRules: {
        ...rules,
        startingResources: Object.keys(next).length > 0 ? next : undefined,
      },
    });
  };

  const handleStringChange = (key: keyof typeof rules) => (value: string) => {
    updateConfig({
      globalRules: {
        ...rules,
        [key]: value,
      },
    });
  };

  const handleVerbToneColorChange = (tone: 'neutral' | 'job' | 'quest' | 'danger' | 'system') => (value: string) => {
    const current = rules.verbToneColors ?? {};
    const next = {
      ...current,
      [tone]: value,
    };
    updateConfig({
      globalRules: {
        ...rules,
        verbToneColors: next,
      },
    });
  };

  const handleVerbToneColorReset = (tone: 'neutral' | 'job' | 'quest' | 'danger' | 'system') => () => {
    const current = rules.verbToneColors ?? {};
    if (!current[tone]) return;
    const next = { ...current } as Record<string, string>;
    delete next[tone];
    updateConfig({
      globalRules: {
        ...rules,
        verbToneColors: Object.keys(next).length > 0 ? next : undefined,
      },
    });
  };

  return (
    <div className="space-y-4">
      <h2 className="text-lg sm:text-xl font-cinzel tracking-[0.18em] uppercase text-ivory/90">Global Rules</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <DefaultSection title="Fatigue">
          <div className="space-y-2 text-sm">
            <div>
              <label className="block font-bold mb-1">Max Fatigue Before Exhausted</label>
              <input
                type="number"
                value={rules.maxFatigueBeforeExhausted}
                onChange={(e) => handleNumberChange('maxFatigueBeforeExhausted')(e.target.value)}
                className="w-full px-2 py-1 bg-obsidian border border-slate rounded text-ivory"
              />
            </div>
            <div>
              <label className="block font-bold mb-1">Fatigue Recovery Per Day</label>
              <input
                type="number"
                value={rules.fatigueRecoveryPerDay}
                onChange={(e) => handleNumberChange('fatigueRecoveryPerDay')(e.target.value)}
                className="w-full px-2 py-1 bg-obsidian border border-slate rounded text-ivory"
              />
            </div>
            <div>
              <label className="block font-bold mb-1">Day Length (Time Units)</label>
              <input
                type="number"
                value={rules.dayLengthInTimeUnits}
                onChange={(e) => handleNumberChange('dayLengthInTimeUnits')(e.target.value)}
                className="w-full px-2 py-1 bg-obsidian border border-slate rounded text-ivory"
              />
            </div>
            <div>
              <label className="block font-bold mb-1">Fatigue Yellow Threshold</label>
              <input
                type="number"
                value={rules.fatigueYellowThreshold}
                onChange={(e) => handleNumberChange('fatigueYellowThreshold')(e.target.value)}
                className="w-full px-2 py-1 bg-obsidian border border-slate rounded text-ivory"
              />
            </div>
            <div>
              <label className="block font-bold mb-1">Fatigue Red Threshold</label>
              <input
                type="number"
                value={rules.fatigueRedThreshold}
                onChange={(e) => handleNumberChange('fatigueRedThreshold')(e.target.value)}
                className="w-full px-2 py-1 bg-obsidian border border-slate rounded text-ivory"
              />
            </div>
            {resources.length > 0 && (
              <div className="mt-3 pt-2 border-t border-slate-700/70 space-y-1.5 text-xs">
                <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-300">
                  Starting Resources
                </div>
                <div className="space-y-1">
                  {resources.map((res) => {
                    const current = rules.startingResources?.[res.id] ?? 0;
                    return (
                      <div key={res.id} className="flex items-center justify-between gap-2">
                        <span className="text-[10px] text-slate-300 truncate">
                          {res.label}
                          <span className="ml-1 text-slate-500">({res.id})</span>
                        </span>
                        <input
                          type="number"
                          min={0}
                          step={1}
                          value={current}
                          onChange={(e) => handleStartingResourceChange(res.id, e.target.value)}
                          className="w-20 px-2 py-0.5 bg-obsidian border border-slate rounded text-ivory text-[10px] font-mono text-right"
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </DefaultSection>

        <DefaultSection title="Food Economy">
          <div className="space-y-2 text-sm">
            <div>
              <label className="block font-bold mb-1">Food Consumption Per Resident Per Day</label>
              <input
                type="number"
                min={0}
                step={0.1}
                value={rules.foodConsumptionPerResidentPerDay}
                onChange={(e) => handleNumberChange('foodConsumptionPerResidentPerDay')(e.target.value)}
                className="w-full px-2 py-1 bg-obsidian border border-slate rounded text-ivory"
              />
            </div>
            <div>
              <label className="block font-bold mb-1">Base Food Price (Gold per Unit)</label>
              <input
                type="number"
                min={0}
                step={1}
                value={rules.baseFoodPriceInGold}
                onChange={(e) => handleNumberChange('baseFoodPriceInGold')(e.target.value)}
                className="w-full px-2 py-1 bg-obsidian border border-slate rounded text-ivory"
              />
            </div>
          </div>
        </DefaultSection>

        <DefaultSection title="Injury &amp; Quests">
          <div className="space-y-2 text-sm">
            <div>
              <label className="block font-bold mb-1">Base Light Injury Chance At Max Fatigue</label>
              <input
                type="number"
                step="0.01"
                min={0}
                max={1}
                value={rules.baseLightInjuryChanceAtMaxFatigue}
                onChange={(e) => handleNumberChange('baseLightInjuryChanceAtMaxFatigue')(e.target.value)}
                className="w-full px-2 py-1 bg-obsidian border border-slate rounded text-ivory"
              />
            </div>
            <div>
              <label className="block font-bold mb-1">Danger Injury Multiplier Per Point</label>
              <input
                type="number"
                step="0.01"
                value={rules.dangerInjuryMultiplierPerPoint}
                onChange={(e) => handleNumberChange('dangerInjuryMultiplierPerPoint')(e.target.value)}
                className="w-full px-2 py-1 bg-obsidian border border-slate rounded text-ivory"
              />
            </div>
            <div>
              <label className="block font-bold mb-1">Quest XP Formula</label>
              <input
                type="text"
                value={rules.questXpFormula}
                onChange={(e) => handleStringChange('questXpFormula')(e.target.value)}
                className="w-full px-2 py-1 bg-obsidian border border-slate rounded text-ivory font-mono text-xs"
              />
            </div>
            <div>
              <label className="block font-bold mb-1">Max Active Quests</label>
              <input
                type="number"
                min={0}
                value={rules.maxActiveQuests}
                onChange={(e) => handleNumberChange('maxActiveQuests')(e.target.value)}
                className="w-full px-2 py-1 bg-obsidian border border-slate rounded text-ivory"
              />
            </div>
            <div className="mt-3 pt-2 border-t border-slate-700/70 space-y-1.5 text-xs">
              <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-300">
                Quest Spawning
              </div>
              <div className="space-y-1.5">
                <div>
                  <label className="block font-semibold mb-0.5 text-[11px]">Spawn Every N Days</label>
                  <input
                    type="number"
                    min={1}
                    value={rules.questSpawnEveryNDays}
                    onChange={(e) => handleNumberChange('questSpawnEveryNDays')(e.target.value)}
                    className="w-full px-2 py-1 bg-obsidian border border-slate rounded text-ivory text-[11px]"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block font-semibold mb-0.5 text-[11px]">Max Global Offers</label>
                    <input
                      type="number"
                      min={0}
                      value={rules.maxGlobalQuestOffers}
                      onChange={(e) => handleNumberChange('maxGlobalQuestOffers')(e.target.value)}
                      className="w-full px-2 py-1 bg-obsidian border border-slate rounded text-ivory text-[11px]"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold mb-0.5 text-[11px]">Max Offers Per Slot</label>
                    <input
                      type="number"
                      min={0}
                      value={rules.maxQuestOffersPerSlot}
                      onChange={(e) => handleNumberChange('maxQuestOffersPerSlot')(e.target.value)}
                      className="w-full px-2 py-1 bg-obsidian border border-slate rounded text-ivory text-[11px]"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </DefaultSection>

        <DefaultSection title="Verb Colors">
          <div className="space-y-2 text-sm">
            <p className="text-[10px] text-slate-400">
              Configure ring colors for Cultist-style verbs. These values override the built-in palette.
            </p>
            {([
              { tone: 'job' as const, label: 'Job (work / income)' },
              { tone: 'quest' as const, label: 'Quest (opportunities)' },
              { tone: 'danger' as const, label: 'Danger (injury / threats)' },
              { tone: 'system' as const, label: 'System (time / hunger / market)' },
              { tone: 'neutral' as const, label: 'Neutral (misc verbs)' },
            ]).map(({ tone, label }) => {
              const current = rules.verbToneColors?.[tone] ?? DEFAULT_VERB_TONE_COLORS[tone];
              const hasOverride = Boolean(rules.verbToneColors?.[tone]);
              return (
                <div key={tone} className="flex items-center justify-between gap-2">
                  <span className="text-[10px] text-slate-300 truncate">{label}</span>
                  <div className="flex items-center gap-1">
                    <input
                      type="color"
                      value={current}
                      onChange={(e) => handleVerbToneColorChange(tone)(e.target.value)}
                      className="w-8 h-5 rounded border border-slate-600 bg-slate-900 p-0"
                    />
                    {hasOverride && (
                      <button
                        type="button"
                        onClick={handleVerbToneColorReset(tone)}
                        className="px-1.5 py-0.5 rounded-full border border-slate-600 text-[9px] text-slate-300 hover:border-slate-400 hover:text-slate-100"
                      >
                        Reset
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </DefaultSection>
      </div>
    </div>
  );
}
