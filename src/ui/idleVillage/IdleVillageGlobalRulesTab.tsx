/**
 * Global Rules UI for Idle Village.
 * Allows editing fatigue thresholds, injury parameters, and quest limits
 * in a config-first way using IdleVillageConfig.globalRules.
 */

import { useIdleVillageConfig } from '@/balancing/hooks/useIdleVillageConfig';

export default function IdleVillageGlobalRulesTab() {
  const { config, updateConfig } = useIdleVillageConfig();
  const rules = config.globalRules;

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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <section className="bg-slate/20 border border-slate rounded p-3">
          <h3 className="font-cinzel text-lg mb-2">Fatigue</h3>
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
          </div>
        </section>

        <section className="bg-slate/20 border border-slate rounded p-3">
          <h3 className="font-cinzel text-lg mb-2">Injury & Quests</h3>
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
        </section>
      </div>
    </div>
  );
}
