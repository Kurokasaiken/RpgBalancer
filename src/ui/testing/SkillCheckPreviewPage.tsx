import React, { useCallback, useEffect, useMemo, useState } from 'react';
import type { StatDefinition } from '@/balancing/config/types';
import { useBalancerConfig } from '@/balancing/hooks/useBalancerConfig';
import { getStatGlyph } from '@/ui/shared/statIconUtils';
import AltVisualsV6Asterism from './AltVisualsV6Asterism';
import type { AxisMetaEntry, AxisValues } from './altVisualsAxis';
import type { StatRow } from './types';

const DEFAULT_ACTIVE_VALUE = 60;
const AXIS_VALUE_RANGE = { min: 25, max: 95 } as const;

/**
 * Clamps a numeric value inside [min, max] and guarantees a finite result.
 */
function clampPercentage(value: number, min = 0, max = 100): number {
  if (!Number.isFinite(value)) return min;
  return Math.max(min, Math.min(max, value));
}

/**
 * Simple deterministic hash so Monte Carlo reshuffles remain reproducible.
 */
function hashString(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash << 5) - hash + input.charCodeAt(i);
    hash |= 0;
  }
  return hash >>> 0;
}

/**
 * Lightweight linear congruential generator for UI-grade randomness.
 */
function createSeededRng(seed: number): () => number {
  let state = seed || 1;
  return () => {
    state = (1664525 * state + 1013904223) % 4294967296;
    return state / 4294967296;
  };
}

/**
 * Shuffles an array using the provided RNG (Fisher–Yates).
 */
function shuffleWithRng<T>(items: T[], rng: () => number): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Builds the pool of selectable stats directly from the balancer config.
 */
function buildBaseStatPool(stats: Record<string, StatDefinition> | undefined): StatDefinition[] {
  if (!stats) return [];
  return Object.values(stats).filter((stat) => stat.baseStat && !stat.isDerived && !stat.isHidden);
}

/**
 * Picks the initial slice of stats from the pool ensuring deterministic order.
 */
function buildInitialStatsFromPool(pool: StatDefinition[]): StatRow[] {
  if (!pool.length) return [];
  const seedSource = JSON.stringify(pool.map((stat) => stat.id).sort());
  const rng = createSeededRng(hashString(seedSource));
  const shuffled = shuffleWithRng(pool, rng);
  return shuffled.slice(0, 5).map((stat, index) => {
    const fallback = index === 0 ? DEFAULT_ACTIVE_VALUE : 0;
    const baseValue = typeof stat.defaultValue === 'number' ? stat.defaultValue : fallback;
    const normalized = clampPercentage(baseValue);
    return {
      id: stat.id,
      name: stat.label,
      questValue: normalized,
      heroValue: normalized,
      isDetrimental: stat.isDetrimental || false,
    } satisfies StatRow;
  });
}

const AXIS_ASSIGNMENT_PATTERNS: Record<number, number[]> = {
  1: [0, 0, 0, 0, 0],
  2: [0, 0, 0, 1, 1],
  3: [0, 0, 1, 1, 2],
  4: [0, 0, 1, 2, 3],
  5: [0, 1, 2, 3, 4],
};

/**
 * Returns the axis assignment pattern for the given amount of active stats.
 */
export function getAxisAssignment(count: number, axes = 5): number[] {
  const clamped = Math.max(0, Math.min(axes, count));
  if (clamped === 0) return [];
  if (clamped >= axes) {
    return AXIS_ASSIGNMENT_PATTERNS[axes] ?? [];
  }
  return AXIS_ASSIGNMENT_PATTERNS[clamped] ?? [];
}

/**
 * Derives the axis meta entries using the balancer config stats and cardinality rules.
 */
export function deriveCardinalAxisMeta(
  stats: StatRow[],
  definitions: Record<string, StatDefinition> | undefined,
  axes = 5,
): AxisMetaEntry[] {
  const payload = buildAxisPayload(stats, definitions, axes);
  return payload?.axisMeta ?? [];
}

interface AxisPayload {
  axisMeta: AxisMetaEntry[];
  axisValues: AxisValues;
}

/**
 * Maps the active stats to both axis meta (name/icon) and the values for player/enemy pillars.
 */
export function buildAxisPayload(
  stats: StatRow[],
  definitions: Record<string, StatDefinition> | undefined,
  axes = 5,
): AxisPayload | null {
  const activeStats: StatRow[] = [];
  const seen = new Set<string>();
  stats.forEach((stat) => {
    if (stat.questValue <= 0 && (stat.heroValue ?? 0) <= 0) return;
    const key = stat.id ?? `${stat.name}-${activeStats.length}`;
    if (seen.has(key)) return;
    seen.add(key);
    activeStats.push(stat);
  });

  if (!activeStats.length) {
    return null;
  }

  const limited = activeStats.slice(0, axes);
  const assignment = getAxisAssignment(limited.length, axes);
  if (!assignment.length) {
    return null;
  }

  const axisMeta: AxisMetaEntry[] = [];
  const enemyValues: number[] = [];
  const playerValues: number[] = [];
  const statValueCache = new Map<string, { enemy: number; player: number }>();

  const getOrCreateStatValues = (stat: StatRow, index: number) => {
    const key = stat.id ?? `${stat.name}-${index}`;
    if (!statValueCache.has(key)) {
      const baseSeed = hashString(`${key}-${index}`);
      const enemyRng = createSeededRng(baseSeed ^ 0xa53c5);
      const playerRng = createSeededRng((baseSeed << 5) ^ 0x1b274);
      const enemy = clampPercentage(getRandomAxisValue(enemyRng));
      const player = clampPercentage(getRandomAxisValue(playerRng));
      statValueCache.set(key, { enemy, player });
    }
    return statValueCache.get(key)!;
  };

  assignment.forEach((statIndex, axisIndex) => {
    const stat = limited[statIndex] ?? limited[0];
    const definition = stat.id ? definitions?.[stat.id] : undefined;
    const name = (stat.name ?? definition?.label ?? `Stat ${axisIndex + 1}`).trim();
    const icon = definition?.icon ?? getStatGlyph(stat.id);
    axisMeta.push({ name, icon: icon || '◆' });
    const statValues = getOrCreateStatValues(stat, statIndex);
    enemyValues.push(statValues.enemy);
    playerValues.push(statValues.player);
  });

  return {
    axisMeta,
    axisValues: { enemy: enemyValues, player: playerValues },
  };
}

function getRandomAxisValue(rng: () => number) {
  const span = Math.max(1, AXIS_VALUE_RANGE.max - AXIS_VALUE_RANGE.min);
  return Math.round(AXIS_VALUE_RANGE.min + rng() * span);
}

/**
 * Skill Check Preview Lab (new V6-only view).
 */
const SkillCheckPreviewPage: React.FC = () => {
  const { config } = useBalancerConfig();
  const baseStatsPool = useMemo(() => buildBaseStatPool(config.stats), [config.stats]);

  const buildInitialStats = useCallback(() => buildInitialStatsFromPool(baseStatsPool), [baseStatsPool]);

  const [stats, setStats] = useState<StatRow[]>(() => buildInitialStats());
  const [injuryPct, setInjuryPct] = useState(30);
  const [deathPct, setDeathPct] = useState(15);
  const [asterismControlsPortal, setAsterismControlsPortal] = useState<HTMLDivElement | null>(null);

  useEffect(() => {
    setStats(buildInitialStats());
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
    setStats(buildInitialStats());
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
    <div className="p-3 md:p-4 text-ivory space-y-4">
      <header className="space-y-1">
        <p className="text-[11px] uppercase tracking-[0.3em] text-slate-500">Skill Check Preview Lab</p>
        <h1 className="text-xl font-cinzel tracking-[0.24em] text-ivory">Dispatch Polygon → Alt V6 Asterism</h1>
        <p className="text-[12px] text-slate-400 max-w-2xl">
          La modalità anime V6 è ora l’unica visuale. Le stat attive vengono trasmesse direttamente al canvas cinematico,
          con i controlli “Riavvia scena” e “Ritira dado” già integrati nel componente V6.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(360px,520px)_1fr]">
        <section className="default-card p-4 space-y-5">
          <div className="space-y-1">
            <p className="text-[10px] uppercase tracking-[0.32em] text-slate-500">Visuale Live</p>
            <h2 className="text-lg font-semibold tracking-[0.16em] text-ivory">AltVisuals V6 · Asterism</h2>
            <p className="text-[12px] text-slate-400">
              Il canvas cinematico usa direttamente la selezione delle stat del balancer. La Stella Perfetta è disabilitata per questa pagina,
              come richiesto dal laboratorio.
            </p>
          </div>

          <AltVisualsV6Asterism
            stats={stats}
            axisMeta={axisMeta}
            axisValues={axisValues}
            preserveAxisValues={preserveAxisValues}
            controlsPortal={asterismControlsPortal}
            enablePerfectStarToggle={false}
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
            <h2 className="text-lg font-semibold tracking-[0.16em] text-ivory">Riavvia scena · Stat config</h2>
            <p className="text-[12px] text-slate-400">
              Gestisci l’asterismo direttamente da qui: prima i controlli cinematici, poi tutta la configurazione delle stats e delle percentuali di rischio.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800/80 bg-slate-950/40 px-4 py-3 space-y-1">
            <p className="text-[10px] uppercase tracking-[0.28em] text-slate-500 text-center">Controlli scena V6</p>
            <div
              ref={setAsterismControlsPortal}
              className="min-h-[86px] flex items-center justify-center"
              aria-label="Controlli AltVisuals V6"
            >
              <p className="text-[11px] text-slate-500">Caricamento comandi…</p>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-[0.28em] text-slate-500">Stats Attive</p>
              <p className="text-lg font-mono text-emerald-200">{activeCount}</p>
            </div>
            <button
              type="button"
              onClick={handleRegenerateStats}
              className="px-3 py-1.5 rounded-full border border-slate-600 text-[10px] uppercase tracking-[0.2em] text-slate-200 hover:border-emerald-400 hover:text-emerald-200"
            >
              Rimescola pool
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
              <div className="px-2 py-1 bg-slate-900/60 border border-slate-700 rounded text-emerald-200 h-[34px] flex items-center">
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
