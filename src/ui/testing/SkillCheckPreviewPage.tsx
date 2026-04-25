import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useBalancerConfig } from '@/balancing/hooks/useBalancerConfig';
import AltVisualsV6Asterism from './AltVisualsV6Asterism';
import type { StatRow } from './types';
import {
  DEFAULT_ACTIVE_VALUE,
  clampPercentage,
  buildBaseStatPool,
  buildInitialStatsFromPool,
  buildAxisPayload,
} from './skillCheckHelpers';

declare global {
  interface Window {
    __skillCheckSeedOverride?: string | (() => string | undefined);
    __skillCheckForceReseed?: (seed?: string) => void;
  }
}

function resolveSkillCheckSeedOverride() {
  if (typeof window === 'undefined') return undefined;
  const override = window.__skillCheckSeedOverride;
  if (typeof override === 'function') {
    return override();
  }
  return override;
}

/**
 * Skill Check Preview Lab (V6 Asterism).
 */
const SkillCheckPreviewPage: React.FC = () => {
  const { config } = useBalancerConfig();
  const baseStatsPool = useMemo(() => buildBaseStatPool(config.stats), [config.stats]);

  const buildInitialStats = useCallback(
    (seed?: string) => buildInitialStatsFromPool(baseStatsPool, seed ?? resolveSkillCheckSeedOverride()),
    [baseStatsPool],
  );

  const [stats, setStats] = useState<StatRow[]>(() => buildInitialStats(resolveSkillCheckSeedOverride()));
  const [injuryPct, setInjuryPct] = useState(30);
  const [deathPct, setDeathPct] = useState(15);
  const [asterismControlsPortal, setAsterismControlsPortal] = useState<HTMLDivElement | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const win = window as typeof window & {
      __skillCheckSeedOverride?: string | (() => string | undefined);
      __skillCheckForceReseed?: (seed?: string) => void;
    };
    win.__skillCheckForceReseed = (seed) => {
      win.__skillCheckSeedOverride = seed;
      const nextSeed = typeof seed === 'string' ? seed : resolveSkillCheckSeedOverride();
      const nextStats = buildInitialStats(nextSeed);
      if (import.meta.env?.DEV) {
        console.debug('[SkillCheckPreview] __skillCheckForceReseed invoked', { seed: nextSeed });
      }
      setStats(nextStats);
    };
    return () => {
      delete win.__skillCheckForceReseed;
    };
  }, [buildInitialStats]);

  const safePct = useMemo(() => {
    const injury = clampPercentage(injuryPct);
    const death = clampPercentage(deathPct);
    return clampPercentage(100 - (injury + death));
  }, [injuryPct, deathPct]);

  const activeStats = useMemo(() => stats.filter((stat) => stat.questValue > 0), [stats]);
  const activeCount = activeStats.length;

  const handleStatToggle = useCallback((index: number, enabled: boolean) => {
    setStats((prev) => {
      const next = [...prev];
      const current = next[index];
      if (!current) return prev;
      const value = enabled
        ? Math.max(current.questValue || DEFAULT_ACTIVE_VALUE, DEFAULT_ACTIVE_VALUE)
        : 0;
      next[index] = {
        ...current,
        questValue: value,
        heroValue: value,
      };
      return next;
    });
  }, []);

  const handleStatValueChange = useCallback((index: number, raw: string) => {
    setStats((prev) => {
      const next = [...prev];
      const current = next[index];
      if (!current) return prev;
      const parsed = raw === '' ? 0 : Number(raw);
      const clamped = clampPercentage(parsed);
      next[index] = { ...current, questValue: clamped, heroValue: clamped };
      return next;
    });
  }, []);

  const handleStatNameChange = useCallback((index: number, name: string) => {
    setStats((prev) => {
      const next = [...prev];
      const current = next[index];
      if (!current) return prev;
      next[index] = { ...current, name };
      return next;
    });
  }, []);

  const handleRegenerateStats = useCallback(() => {
    const seed = resolveSkillCheckSeedOverride();
    const nextStats = buildInitialStats(seed);
    if (import.meta.env?.DEV) {
      console.debug('[SkillCheckPreview] handleRegenerateStats', { seed });
    }
    setStats(nextStats);
  }, [buildInitialStats]);

  const axisPayload = useMemo(() => buildAxisPayload(stats, config.stats), [stats, config.stats]);
  const axisMeta = axisPayload?.axisMeta;
  const axisValues = axisPayload?.axisValues;
  const preserveAxisValues = Boolean(axisPayload);

  const riskSummary = useMemo(
    () => [
      { label: 'Safe %', value: `${safePct}%`, accent: 'text-emerald-300' },
      { label: 'Injury %', value: `${injuryPct}%`, accent: 'text-amber-300' },
      { label: 'Death %', value: `${deathPct}%`, accent: 'text-rose-300' },
    ],
    [safePct, injuryPct, deathPct],
  );

  return (
    <div className="p-3 md:p-4 text-ivory space-y-4" data-testid="skill-check-preview-page">
      <header className="space-y-1">
        <p className="text-[11px] uppercase tracking-[0.3em] text-slate-500">Skill Check Preview Lab</p>
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold tracking-[0.16em] text-ivory">
            Riavvia scena · Stat config
          </h2>
          <span className="sr-only" data-testid="skill-check-controls-heading">
            Configurazione Skill Check
          </span>
        </div>
        <p className="text-[12px] text-slate-400 max-w-2xl">
          La visuale V6 continua a fungere da riferimento anime: le stat attive alimentano l’asterismo e mantengono l’allineamento con il tema Gilded Observatory.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(360px,520px)_1fr]">
        <section className="default-card p-4 space-y-5">
          <div className="space-y-1">
            <p className="text-[10px] uppercase tracking-[0.32em] text-slate-500">Visuale Live</p>
            <h2 className="text-lg font-semibold tracking-[0.16em] text-ivory">
              AltVisuals V6 · Asterism
            </h2>
            <p className="text-[12px] text-slate-400">
              Il canvas cinematico usa direttamente la selezione delle stat del balancer. La Stella Perfetta è disabilitata per questa pagina, come richiesto dal laboratorio.
            </p>
          </div>

          <AltVisualsV6Asterism
            stats={stats}
            axisMeta={axisMeta}
            axisValues={axisValues}
            preserveAxisValues={preserveAxisValues}
            controlsPortal={asterismControlsPortal}
            enablePerfectStarToggle={false}
            data-testid="alt-visuals-asterism"
          />

          {activeStats.length === 0 && (
            <div className="rounded-2xl border border-amber-500/40 bg-amber-500/5 px-4 py-3 text-[12px] text-amber-200">
              Attiva almeno una statistica per alimentare l’asterismo V6.
            </div>
          )}
        </section>

        <section className="default-card p-4 space-y-6">
          <div className="space-y-1">
            <p className="text-[10px] uppercase tracking-[0.28em] text-slate-500">Controlli & Setup</p>
            <h2 className="text-lg font-semibold tracking-[0.16em] text-ivory">
              Riavvia scena · Stat config
            </h2>
            <p className="text-[12px] text-slate-400">
              Gestisci l’asterismo direttamente da qui: prima i controlli cinematici, poi tutta la configurazione delle stats e delle percentuali di rischio.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800/80 bg-slate-950/40 px-4 py-3 space-y-1">
            <p className="text-[10px] uppercase tracking-[0.28em] text-slate-500 text-center">Controlli scena V6</p>
            <div
              ref={setAsterismControlsPortal}
              className="min-h-21.5 flex items-center justify-center"
              aria-label="Controlli AltVisuals V6"
            >
              <p className="text-[11px] text-slate-500">Caricamento comandi…</p>
            </div>
          </div>

          <div className="flex items-center justify-between" data-testid="skill-check-stats-summary">
            <div>
              <p
                className="text-[10px] uppercase tracking-[0.28em] text-slate-500"
                data-testid="skill-check-active-stats-label"
              >
                Stats Attive
              </p>
              <p className="text-lg font-mono text-emerald-200" data-testid="skill-check-active-stats-count">
                {activeCount}
              </p>
            </div>
            <button
              type="button"
              onClick={handleRegenerateStats}
              className="px-5 py-2 rounded-full border border-amber-400/60 bg-amber-500/10 text-[10px] uppercase tracking-[0.2em] text-amber-100 hover:bg-amber-500/20 active:scale-95 transition-all shadow-[0_0_20px_rgba(251,191,36,0.25)] focus:outline-none focus:ring-2 focus:ring-amber-400/80 focus:ring-offset-2 focus:ring-offset-slate-900"
              data-testid="reroll-dice-button"
            >
              Ritira dado
            </button>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <div className="rounded-2xl border border-slate-800/80 bg-slate-950/40 px-3 py-2">
              <p className="text-[10px] uppercase tracking-[0.28em] text-slate-500">Distribuzione</p>
              <p className="text-[11px] text-slate-500">Le stats attive sono mappate sui 5 assi dell’asterismo.</p>
            </div>
            {riskSummary.map((entry) => (
              <div key={entry.label} className="rounded-2xl border border-slate-800/80 bg-slate-950/40 px-3 py-2">
                <p className="text-[10px] uppercase tracking-[0.28em] text-slate-500">{entry.label}</p>
                <p className={`text-lg font-mono ${entry.accent}`}>{entry.value}</p>
                <p className="text-[11px] text-slate-500">Config condivisa con il simulatore injury/death.</p>
              </div>
            ))}
          </div>

          <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
            {stats.map((stat, index) => {
              const isActive = stat.questValue > 0;
              return (
                <div
                  key={`${stat.id}-${index}`}
                  className="flex items-center gap-2 rounded-2xl border border-slate-800/80 bg-slate-950/40 px-3 py-2"
                  data-testid={`stat-row-${index}`}
                  data-stat-id={stat.id ?? `${stat.name}-${index}`}
                >
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(event) => handleStatToggle(index, event.target.checked)}
                    className="size-4 shrink-0 accent-emerald-400 cursor-pointer"
                  />
                  <div className="flex-1">
                    <input
                      type="text"
                      value={stat.name}
                      onChange={(event) => handleStatNameChange(index, event.target.value)}
                      className="w-full bg-transparent text-[12px] font-semibold text-cyan-200 focus:outline-none"
                    />
                  </div>
                  <div className={`flex items-center gap-1 ${isActive ? 'opacity-100' : 'opacity-30'}`}>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={stat.questValue}
                      disabled={!isActive}
                      onChange={(event) => handleStatValueChange(index, event.target.value)}
                      className="w-16 bg-slate-900/60 border border-slate-700 rounded px-2 py-1 text-right text-[11px] text-emerald-200 focus:outline-none"
                    />
                    <span className="text-[10px] text-slate-500">%</span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="grid grid-cols-3 gap-2 text-[11px]">
            <label className="space-y-1">
              <span className="block font-semibold text-slate-400">Injury %</span>
              <input
                type="number"
                min={0}
                max={100}
                value={injuryPct}
                onChange={(event) => setInjuryPct(clampPercentage(Number(event.target.value) || 0))}
                className="w-full px-2 py-1 bg-slate-900/60 border border-slate-700 rounded text-amber-200"
              />
            </label>
            <label className="space-y-1">
              <span className="block font-semibold text-slate-400">Death %</span>
              <input
                type="number"
                min={0}
                max={100}
                value={deathPct}
                onChange={(event) => setDeathPct(clampPercentage(Number(event.target.value) || 0))}
                className="w-full px-2 py-1 bg-slate-900/60 border border-slate-700 rounded text-rose-200"
              />
            </label>
            <div className="space-y-1">
              <span className="block font-semibold text-slate-400">Safe %</span>
              <div className="px-2 py-1 bg-slate-900/60 border border-slate-700 rounded text-emerald-200 h-8.5 flex items-center">
                {safePct}%
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default SkillCheckPreviewPage;
