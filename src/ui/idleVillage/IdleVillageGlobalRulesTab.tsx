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
          </div>
        </DefaultSection>
      </div>
    </div>
  );
}
