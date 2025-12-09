import React, { useMemo, useState } from 'react';
import { ArchetypeRegistry } from '../../balancing/archetype/ArchetypeRegistry';
import { BUDGET_TIERS } from '../../balancing/archetype/constants';
import type { ArchetypeTemplate, BalanceConfiguration } from '../../balancing/archetype/types';
import { ArchetypeMatchupService, type ArchetypeMatchupResult } from '../../balancing/archetype/ArchetypeMatchupService';
import { CounterpickValidator, type CounterpickValidationResult } from '../../balancing/archetype/CounterpickValidator';
import { loadSpells } from '../../balancing/spellStorage';
import type { Spell } from '../../balancing/spellTypes';
import balanceConfigJson from '../../balancing/archetype/balance_config.json';

export const ArchetypeTestingLab: React.FC = () => {
  const balanceConfig = balanceConfigJson as BalanceConfiguration;
  const configBudgetTiers = balanceConfig.budgetTiers || [];

  const [registry] = useState(() => new ArchetypeRegistry());
  const archetypes = registry.listAll();
  const spells = loadSpells();

  const [archetypeAId, setArchetypeAId] = useState<string>(archetypes[0]?.id ?? '');
  const [archetypeBId, setArchetypeBId] = useState<string>(archetypes[1]?.id ?? archetypes[0]?.id ?? '');
  const [budgetTierName, setBudgetTierName] = useState<string>(BUDGET_TIERS[2]?.name ?? BUDGET_TIERS[0]?.name ?? '');
  const [iterations, setIterations] = useState<number>(2000);
  const [turnLimit, setTurnLimit] = useState<number>(100);
  const [spellAId, setSpellAId] = useState<string>('');
  const [spellBId, setSpellBId] = useState<string>('');
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<ArchetypeMatchupResult | null>(null);

  const [counterBudgetTierName, setCounterBudgetTierName] = useState<string>(
    configBudgetTiers[configBudgetTiers.length - 1]?.name ?? configBudgetTiers[0]?.name ?? ''
  );
  const [counterIterations, setCounterIterations] = useState<number>(2000);
  const [isCounterRunning, setIsCounterRunning] = useState(false);
  const [counterResults, setCounterResults] = useState<CounterpickValidationResult[] | null>(null);

  const archetypeA = useMemo<ArchetypeTemplate | undefined>(
    () => archetypes.find(a => a.id === archetypeAId),
    [archetypes, archetypeAId],
  );
  const archetypeB = useMemo<ArchetypeTemplate | undefined>(
    () => archetypes.find(a => a.id === archetypeBId),
    [archetypes, archetypeBId],
  );

  const archetypeById = useMemo(() => {
    const map = new Map<string, ArchetypeTemplate>();
    archetypes.forEach(a => map.set(a.id, a));
    return map;
  }, [archetypes]);

  const budgetTier = useMemo(
    () => BUDGET_TIERS.find(t => t.name === budgetTierName) ?? BUDGET_TIERS[0],
    [budgetTierName],
  );

  const spellA: Spell | undefined = spells.find(s => s.id === spellAId);
  const spellB: Spell | undefined = spells.find(s => s.id === spellBId);

  const handleRun = () => {
    if (!archetypeA || !archetypeB || !budgetTier) return;

    setIsRunning(true);
    try {
      const matchupResult = ArchetypeMatchupService.runMatchup({
        archetypeA,
        archetypeB,
        budget: budgetTier.points,
        iterations,
        turnLimit,
        spellsA: spellA ? [spellA] : undefined,
        spellsB: spellB ? [spellB] : undefined,
      });
      setResult(matchupResult);
    } finally {
      setIsRunning(false);
    }
  };

  const handleRunCounterValidation = () => {
    if (!balanceConfig.counterMatrix || Object.keys(balanceConfig.counterMatrix).length === 0) {
      setCounterResults([]);
      return;
    }

    setIsCounterRunning(true);
    try {
      const results = CounterpickValidator.validate({
        archetypes,
        balanceConfig,
        iterations: counterIterations,
        budgetTierName: counterBudgetTierName || undefined,
      });
      setCounterResults(results);
    } finally {
      setIsCounterRunning(false);
    }
  };

  const resolveArchetypeName = (id: string) => {
    const a = archetypeById.get(id);
    return a ? `${a.name} (${a.category})` : id;
  };

  const winRateA = result ? result.summary.winRates.entity1 * 100 : 0;
  const winRateB = result ? result.summary.winRates.entity2 * 100 : 0;

  return (
    <div className="observatory-page">
      <div className="observatory-shell space-y-4">
        <header className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-[0.3em] uppercase text-indigo-200">
            Archetype 1v1 Testing
          </h1>
          <p className="text-[10px] text-slate-400 uppercase tracking-[0.22em]">
            Monte Carlo · Archetype vs Archetype · Config-Driven
          </p>
        </header>

        <div className="grid gap-4 md:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
          <section className="observatory-panel space-y-4">
            <h2 className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-300">
              Setup Matchup
            </h2>

            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-[0.22em] text-slate-400">
                  Archetype A
                </label>
                <select
                  value={archetypeAId}
                  onChange={e => setArchetypeAId(e.target.value)}
                  className="w-full rounded-md bg-slate-900/80 border border-slate-700 px-2 py-1.5 text-xs text-slate-100"
                >
                  {archetypes.map(a => (
                    <option key={a.id} value={a.id}>
                      {a.name} ({a.category})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-[0.22em] text-slate-400">
                  Archetype B
                </label>
                <select
                  value={archetypeBId}
                  onChange={e => setArchetypeBId(e.target.value)}
                  className="w-full rounded-md bg-slate-900/80 border border-slate-700 px-2 py-1.5 text-xs text-slate-100"
                >
                  {archetypes.map(a => (
                    <option key={a.id} value={a.id}>
                      {a.name} ({a.category})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-[0.22em] text-slate-400">
                  Budget Tier
                </label>
                <select
                  value={budgetTierName}
                  onChange={e => setBudgetTierName(e.target.value)}
                  className="w-full rounded-md bg-slate-900/80 border border-slate-700 px-2 py-1.5 text-xs text-slate-100"
                >
                  {BUDGET_TIERS.map(tier => (
                    <option key={tier.name} value={tier.name}>
                      {tier.name} ({tier.points} HP)
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[10px]">
                <div className="space-y-1">
                  <label className="block uppercase tracking-[0.22em] text-slate-400">
                    Iterations
                  </label>
                  <input
                    type="number"
                    min={100}
                    step={100}
                    value={iterations}
                    onChange={e => setIterations(Number(e.target.value) || 0)}
                    className="w-full rounded-md bg-slate-900/80 border border-slate-700 px-2 py-1.5 text-xs text-slate-100"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block uppercase tracking-[0.22em] text-slate-400">
                    Turn Limit
                  </label>
                  <input
                    type="number"
                    min={10}
                    step={10}
                    value={turnLimit}
                    onChange={e => setTurnLimit(Number(e.target.value) || 0)}
                    className="w-full rounded-md bg-slate-900/80 border border-slate-700 px-2 py-1.5 text-xs text-slate-100"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-[0.22em] text-slate-400">
                  Spell A (optional)
                </label>
                <select
                  value={spellAId}
                  onChange={e => setSpellAId(e.target.value)}
                  className="w-full rounded-md bg-slate-900/80 border border-slate-700 px-2 py-1.5 text-xs text-slate-100"
                >
                  <option value="">None</option>
                  {spells.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-[0.22em] text-slate-400">
                  Spell B (optional)
                </label>
                <select
                  value={spellBId}
                  onChange={e => setSpellBId(e.target.value)}
                  className="w-full rounded-md bg-slate-900/80 border border-slate-700 px-2 py-1.5 text-xs text-slate-100"
                >
                  <option value="">None</option>
                  {spells.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <button
              type="button"
              onClick={handleRun}
              disabled={isRunning || !archetypeA || !archetypeB || !budgetTier}
              className="inline-flex items-center justify-center rounded-full border border-emerald-400/70 bg-emerald-500/10 px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.3em] text-emerald-200 hover:bg-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isRunning ? 'Running…' : 'Run Monte Carlo'}
            </button>
          </section>

          <section className="observatory-panel space-y-4">
            <h2 className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-300">
              Results
            </h2>

            {!result && (
              <p className="text-[11px] text-slate-500">
                Configura il matchup e avvia una simulazione per vedere win rate, TTK e metriche.
              </p>
            )}

            {result && (
              <div className="space-y-4 text-[11px] text-slate-200">
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg border border-slate-700 bg-slate-900/80 p-3">
                    <div className="text-[10px] uppercase tracking-[0.22em] text-slate-400 mb-1">
                      Win Rate A
                    </div>
                    <div className="text-lg font-mono text-emerald-300">
                      {winRateA.toFixed(1)}%
                    </div>
                    <div className="text-[10px] text-slate-500 mt-1">
                      {archetypeA?.name}
                    </div>
                  </div>
                  <div className="rounded-lg border border-slate-700 bg-slate-900/80 p-3">
                    <div className="text-[10px] uppercase tracking-[0.22em] text-slate-400 mb-1">
                      Win Rate B
                    </div>
                    <div className="text-lg font-mono text-rose-300">
                      {winRateB.toFixed(1)}%
                    </div>
                    <div className="text-[10px] text-slate-500 mt-1">
                      {archetypeB?.name}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg border border-slate-700 bg-slate-900/80 p-3">
                    <div className="text-[10px] uppercase tracking-[0.22em] text-slate-400 mb-1">
                      Average Turns
                    </div>
                    <div className="text-lg font-mono text-cyan-300">
                      {result.combatStatistics.averageTurns.toFixed(2)}
                    </div>
                    <div className="text-[10px] text-slate-500 mt-1">
                      Median: {result.combatStatistics.medianTurns.toFixed(1)} · Min/Max: {result.combatStatistics.minTurns}/{result.combatStatistics.maxTurns}
                    </div>
                  </div>

                  <div className="rounded-lg border border-slate-700 bg-slate-900/80 p-3 space-y-1">
                    <div className="text-[10px] uppercase tracking-[0.22em] text-slate-400 mb-1">
                      Damage Metrics (EDPT Approx)
                    </div>
                    <div className="flex justify-between text-[10px] text-slate-300">
                      <span>A (avg DPT):</span>
                      <span className="font-mono text-emerald-300">{result.damageMetrics.entity1.average.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-[10px] text-slate-300">
                      <span>B (avg DPT):</span>
                      <span className="font-mono text-rose-300">{result.damageMetrics.entity2.average.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                      <span>Overkill A/B:</span>
                      <span className="font-mono">{result.damageMetrics.averageOverkill.entity1.toFixed(1)} / {result.damageMetrics.averageOverkill.entity2.toFixed(1)}</span>
                    </div>
                  </div>
                </div>

                <div className="rounded-lg border border-slate-700 bg-slate-900/80 p-3 space-y-1">
                  <div className="text-[10px] uppercase tracking-[0.22em] text-slate-400 mb-1">
                    HP Efficiency (Damage / HP Lost)
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-300">
                    <span>A:</span>
                    <span className="font-mono text-emerald-300">{result.hpEfficiency.entity1.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-300">
                    <span>B:</span>
                    <span className="font-mono text-rose-300">{result.hpEfficiency.entity2.toFixed(2)}</span>
                  </div>
                </div>

                {result.sampleCombats.length > 0 && (
                  <div className="rounded-lg border border-slate-700 bg-slate-900/80 p-3 max-h-64 overflow-y-auto">
                    <div className="text-[10px] uppercase tracking-[0.22em] text-slate-400 mb-1">
                      Sample Combat Log (first simulation)
                    </div>
                    {result.sampleCombats[0].turnByTurnLog?.map((t, idx) => (
                      <div key={idx} className="text-[10px] text-slate-300">
                        T{t.turnNumber}: {t.attacker} → {t.defender} · dmg {t.damageDealt} · HP left {t.defenderHPRemaining}
                      </div>
                    )) || (
                      <div className="text-[10px] text-slate-500">Nessun log dettagliato disponibile.</div>
                    )}
                  </div>
                )}
              </div>
            )}
          </section>
        </div>

        <section className="observatory-panel space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-300">
                Counter Matrix Validation
              </h2>
              <p className="text-[10px] text-slate-500 mt-1">
                Usa il counter matrix definito in <code>balance_config.json</code> per verificare se i matchup attesi
                (Strong / Weak / Even) rispettano i win rate target.
              </p>
            </div>

            <div className="flex flex-wrap items-end gap-3 text-[10px]">
              <div className="space-y-1">
                <label className="block uppercase tracking-[0.22em] text-slate-400">Budget Tier</label>
                <select
                  value={counterBudgetTierName}
                  onChange={e => setCounterBudgetTierName(e.target.value)}
                  className="min-w-40 rounded-md bg-slate-900/80 border border-slate-700 px-2 py-1.5 text-xs text-slate-100"
                >
                  {configBudgetTiers.map(tier => (
                    <option key={tier.name} value={tier.name}>
                      {tier.name} ({tier.points} HP)
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="block uppercase tracking-[0.22em] text-slate-400">Iterations</label>
                <input
                  type="number"
                  min={500}
                  step={500}
                  value={counterIterations}
                  onChange={e => setCounterIterations(Number(e.target.value) || 0)}
                  className="w-24 rounded-md bg-slate-900/80 border border-slate-700 px-2 py-1.5 text-xs text-slate-100"
                />
              </div>

              <button
                type="button"
                onClick={handleRunCounterValidation}
                disabled={isCounterRunning || !balanceConfig.counterMatrix || Object.keys(balanceConfig.counterMatrix).length === 0}
                className="inline-flex items-center justify-center rounded-full border border-amber-400/70 bg-amber-500/10 px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.3em] text-amber-200 hover:bg-amber-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isCounterRunning ? 'Validating…' : 'Run Counter Validation'}
              </button>
            </div>
          </div>

          {!balanceConfig.counterMatrix || Object.keys(balanceConfig.counterMatrix).length === 0 ? (
            <p className="text-[11px] text-slate-500">
              Nessun <code>counterMatrix</code> definito in <code>balance_config.json</code>. Aggiungi le relazioni
              di counterpick per utilizzare questa sezione.
            </p>
          ) : counterResults === null ? (
            <p className="text-[11px] text-slate-500">
              Esegui una validazione per vedere se i matchup definiti nel counter matrix rispettano i win rate attesi.
            </p>
          ) : counterResults.length === 0 ? (
            <p className="text-[11px] text-emerald-300">
              Nessun matchup da validare oppure tutti i dati sono vuoti.
            </p>
          ) : (
            <div className="space-y-2 text-[10px]">
              <div className="flex justify-between items-center text-slate-400">
                <span>
                  Matchup validati: <span className="text-slate-200 font-mono">{counterResults.length}</span>
                </span>
                <span>
                  Fail:
                  {
                    ' '
                  }
                  <span className="text-rose-300 font-mono">
                    {counterResults.filter(r => !r.passed).length}
                  </span>
                </span>
              </div>

              <div className="max-h-72 overflow-y-auto rounded-lg border border-slate-800 bg-slate-950/80">
                <table className="min-w-full text-left text-[10px]">
                  <thead className="bg-slate-900/80 text-slate-400">
                    <tr>
                      <th className="px-3 py-2 font-semibold">Attacker</th>
                      <th className="px-3 py-2 font-semibold">Defender</th>
                      <th className="px-3 py-2 font-semibold">Relation</th>
                      <th className="px-3 py-2 font-semibold">Budget</th>
                      <th className="px-3 py-2 font-semibold">Expected WR</th>
                      <th className="px-3 py-2 font-semibold">Actual WR</th>
                      <th className="px-3 py-2 font-semibold text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {counterResults.map((r, idx) => {
                      const [minWr, maxWr] = r.expectedRange;
                      const actualPercent = r.actualWinRate * 100;
                      const rangeLabel = `${(minWr * 100).toFixed(1)}–${(maxWr * 100).toFixed(1)}%`;
                      const statusLabel = r.passed ? 'OK' : 'FAIL';
                      const statusClass = r.passed
                        ? 'text-emerald-300 bg-emerald-500/10 border-emerald-400/60'
                        : 'text-rose-300 bg-rose-500/10 border-rose-400/60';

                      return (
                        <tr key={`${r.attackerId}-${r.defenderId}-${idx}`} className="border-t border-slate-800">
                          <td className="px-3 py-1.5 text-slate-200">{resolveArchetypeName(r.attackerId)}</td>
                          <td className="px-3 py-1.5 text-slate-300">{resolveArchetypeName(r.defenderId)}</td>
                          <td className="px-3 py-1.5 text-slate-300">{r.relation}</td>
                          <td className="px-3 py-1.5 text-slate-400 font-mono">{r.budget}</td>
                          <td className="px-3 py-1.5 text-slate-300 font-mono">{rangeLabel}</td>
                          <td className="px-3 py-1.5 text-slate-200 font-mono">{actualPercent.toFixed(1)}%</td>
                          <td className="px-3 py-1.5 text-right">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full border text-[9px] ${statusClass}`}>
                              {statusLabel}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};
