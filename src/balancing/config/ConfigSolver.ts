import type { BalancerConfig, StatDefinition } from './types';
import { validateFormula, executeFormula } from './FormulaEngine';

export interface SolveError {
  /** Stat che l'utente ha provato a modificare. */
  statId: string;
  /** Stat lockate o derivate coinvolte che impediscono la soluzione. */
  blockingStats: string[];
  message: string;
}

export interface SolveResult {
  /** Nuovo set di valori simulati per tutte le stat. */
  values: Record<string, number>;
  /** Stat che sono effettivamente cambiate rispetto all'input. */
  changed: string[];
  /** Presente solo se l'operazione non è applicabile con i lock correnti. */
  error?: SolveError;
}

interface DependencyGraph {
  /** Tutte le stat derivate (config-driven). */
  derivedStats: string[];
  /** Per ogni derivata, l'elenco delle stat usate nella formula. */
  inputs: Record<string, string[]>;
  /** Per ogni stat, le derivate che dipendono da essa. */
  dependents: Record<string, string[]>;
  /** Ordine topologico delle derivate (solo tra derivate). */
  topoOrder: string[];
}

function clamp(value: number, min: number, max: number): number {
  if (Number.isNaN(value)) return min;
  if (value < min) return min;
  if (value > max) return max;
  return value;
}

function approxEqual(a: number | undefined, b: number | undefined, eps = 1e-6): boolean {
  if (a === undefined && b === undefined) return true;
  if (a === undefined || b === undefined) return false;
  return Math.abs(a - b) <= eps;
}

function buildDependencyGraph(config: BalancerConfig): DependencyGraph {
  const derivedStats: string[] = [];
  const inputs: Record<string, string[]> = {};
  const dependents: Record<string, string[]> = {};

  const statIds = Object.keys(config.stats);

  for (const statId of statIds) {
    const def = config.stats[statId];
    if (!def.isDerived || !def.formula) continue;

    const validation = validateFormula(def.formula, statIds);
    const used = validation.valid ? validation.usedStats : [];

    derivedStats.push(statId);
    inputs[statId] = used;

    for (const dep of used) {
      if (!dependents[dep]) dependents[dep] = [];
      dependents[dep].push(statId);
    }
  }

  // Costruisci ordine topologico solo sulle derivate
  const indegree: Record<string, number> = {};
  for (const d of derivedStats) indegree[d] = 0;

  for (const d of derivedStats) {
    const ins = inputs[d] || [];
    for (const s of ins) {
      const statDef = config.stats[s];
      if (statDef && statDef.isDerived && indegree[d] !== undefined) {
        indegree[d] += 1;
      }
    }
  }

  const queue: string[] = [];
  for (const d of derivedStats) {
    if (indegree[d] === 0) queue.push(d);
  }

  const topoOrder: string[] = [];
  while (queue.length > 0) {
    const current = queue.shift() as string;
    topoOrder.push(current);

    const outs = dependents[current] || [];
    for (const next of outs) {
      if (indegree[next] !== undefined) {
        indegree[next] -= 1;
        if (indegree[next] === 0) queue.push(next);
      }
    }
  }

  // In caso di cicli, fallback all'ordine così com'è
  if (topoOrder.length !== derivedStats.length) {
    return { derivedStats, inputs, dependents, topoOrder: derivedStats.slice() };
  }

  return { derivedStats, inputs, dependents, topoOrder };
}

function evaluateDerived(
  derivedId: string,
  candidateInputValues: Record<string, number>,
  stats: Record<string, StatDefinition>,
): number {
  const def = stats[derivedId];
  if (!def || !def.formula) return candidateInputValues[derivedId] ?? 0;
  return executeFormula(def.formula, candidateInputValues);
}

interface SolveForTargetVarResult {
  success: boolean;
  newValue?: number;
  error?: SolveError;
}

function solveForTargetVar(
  graph: DependencyGraph,
  derivedId: string,
  targetVarId: string,
  targetDerivedValue: number,
  baseValues: Record<string, number>,
  stats: Record<string, StatDefinition>,
  sourceStatIdForError: string,
): SolveForTargetVarResult {
  const derivedDef = stats[derivedId];
  const varDef = stats[targetVarId];
  if (!derivedDef || !derivedDef.formula || !varDef) {
    return { success: false, error: { statId: sourceStatIdForError, blockingStats: [derivedId], message: 'Invalid derived configuration' } };
  }

  const inputs = graph.inputs[derivedId] || [];
  const varMin = varDef.min;
  const varMax = varDef.max;
  if (varMin === varMax) {
    return {
      success: false,
      error: {
        statId: sourceStatIdForError,
        blockingStats: [derivedId, targetVarId],
        message: 'No range available to solve for target variable',
      },
    };
  }

  // Base context with all inputs frozen from current values
  const baseCtx: Record<string, number> = {};
  for (const inp of inputs) {
    const def = stats[inp];
    const fallback = def ? def.defaultValue : 0;
    baseCtx[inp] = baseValues[inp] ?? fallback;
  }

  const evalWith = (x: number): number => {
    const ctx: Record<string, number> = { ...baseCtx, [targetVarId]: x };
    return evaluateDerived(derivedId, ctx, stats);
  };

  const lowVal = evalWith(varMin);
  const highVal = evalWith(varMax);

  if (!Number.isFinite(lowVal) || !Number.isFinite(highVal)) {
    return {
      success: false,
      error: {
        statId: sourceStatIdForError,
        blockingStats: [derivedId, targetVarId],
        message: 'Formula produced non-finite values',
      },
    };
  }

  const minOut = Math.min(lowVal, highVal);
  const maxOut = Math.max(lowVal, highVal);
  const tolerance = 1e-4;

  // Se il target è completamente fuori range, consideriamo impossibile.
  if (targetDerivedValue < minOut - tolerance || targetDerivedValue > maxOut + tolerance) {
    return {
      success: false,
      error: {
        statId: sourceStatIdForError,
        blockingStats: [derivedId, targetVarId],
        message: 'Target value cannot be achieved within variable bounds',
      },
    };
  }

  // Binary search best-effort (assume monotonicità ragionevole nell'intervallo)
  let lo = varMin;
  let hi = varMax;
  let bestX = lo;
  let bestDiff = Number.POSITIVE_INFINITY;

  for (let i = 0; i < 40; i++) {
    const mid = (lo + hi) / 2;
    const midVal = evalWith(mid);
    const diff = Math.abs(midVal - targetDerivedValue);
    if (diff < bestDiff) {
      bestDiff = diff;
      bestX = mid;
    }

    if (diff <= tolerance) {
      break;
    }

    // Direzione best-effort
    if (midVal < targetDerivedValue) {
      if (lowVal < highVal) {
        lo = mid;
      } else {
        hi = mid;
      }
    } else {
      if (lowVal < highVal) {
        hi = mid;
      } else {
        lo = mid;
      }
    }
  }

  const clamped = clamp(bestX, varMin, varMax);
  return { success: true, newValue: clamped };
}

function enforceLockedDerived(
  graph: DependencyGraph,
  stats: Record<string, StatDefinition>,
  values: Record<string, number>,
  originalValues: Record<string, number>,
  changedStatId: string,
): SolveError | undefined {
  for (const derivedId of graph.derivedStats) {
    const def = stats[derivedId];
    if (!def || !def.isDerived || !def.formula || !def.isLocked) continue;

    const inputs = graph.inputs[derivedId] || [];
    const originalTarget = originalValues[derivedId];
    const targetValue = originalTarget ?? values[derivedId] ?? def.defaultValue;

    const unlockedInputs = inputs.filter((id) => {
      const s = stats[id];
      return s && !s.isLocked && id !== changedStatId;
    });

    const targetVarId = unlockedInputs[0];
    if (!targetVarId) {
      const blockingStats = Array.from(
        new Set([
          derivedId,
          ...inputs.filter((id) => stats[id]?.isLocked),
        ]),
      );
      return {
        statId: changedStatId,
        blockingStats,
        message: `Cannot satisfy locked derived stat "${def.label}" with current locks`,
      };
    }

    const solveRes = solveForTargetVar(
      graph,
      derivedId,
      targetVarId,
      targetValue,
      values,
      stats,
      changedStatId,
    );

    if (!solveRes.success || solveRes.error) {
      return solveRes.error;
    }

    if (solveRes.newValue !== undefined) {
      values[targetVarId] = solveRes.newValue;
    }
  }

  return undefined;
}

function forwardRecomputeDerived(
  graph: DependencyGraph,
  stats: Record<string, StatDefinition>,
  values: Record<string, number>,
): void {
  for (const derivedId of graph.topoOrder) {
    const def = stats[derivedId];
    if (!def || !def.isDerived || !def.formula) continue;
    if (def.isLocked) continue; // I lock sulle derivate vengono già gestiti a parte

    const inputs = graph.inputs[derivedId] || [];
    const ctx: Record<string, number> = {};
    for (const inp of inputs) {
      const s = stats[inp];
      const fallback = s ? s.defaultValue : 0;
      ctx[inp] = values[inp] ?? fallback;
    }

    const raw = executeFormula(def.formula, ctx);
    const clamped = clamp(raw, def.min, def.max);
    values[derivedId] = clamped;
  }
}

export function solveConfigChange(
  config: BalancerConfig,
  currentValues: Record<string, number>,
  changedStatId: string,
  requestedValue: number,
): SolveResult {
  const stats = config.stats;
  const def = stats[changedStatId];

  if (!def) {
    return {
      values: currentValues,
      changed: [],
      error: {
        statId: changedStatId,
        blockingStats: [],
        message: 'Unknown stat',
      },
    };
  }

  if (def.isLocked) {
    return {
      values: currentValues,
      changed: [],
      error: {
        statId: changedStatId,
        blockingStats: [changedStatId],
        message: 'Stat is locked',
      },
    };
  }

  const graph = buildDependencyGraph(config);
  const values: Record<string, number> = { ...currentValues };

  // Applica il valore richiesto, clampato ai limiti della stat
  const clampedRequested = clamp(requestedValue, def.min, def.max);

  if (def.isDerived && def.formula) {
    // Edit su stat derivata: risolviamo per una delle input (prima non lockata nella formula)
    const inputs = graph.inputs[changedStatId] || [];
    const targetVarId = inputs.find((id) => {
      const s = stats[id];
      return s && !s.isLocked;
    });

    if (!targetVarId) {
      return {
        values: currentValues,
        changed: [],
        error: {
          statId: changedStatId,
          blockingStats: [changedStatId, ...inputs.filter((id) => stats[id]?.isLocked)],
          message: 'All inputs of derived stat are locked',
        },
      };
    }

    const solveRes = solveForTargetVar(
      graph,
      changedStatId,
      targetVarId,
      clampedRequested,
      values,
      stats,
      changedStatId,
    );

    if (!solveRes.success || solveRes.error) {
      return {
        values: currentValues,
        changed: [],
        error: solveRes.error,
      };
    }

    if (solveRes.newValue !== undefined) {
      values[targetVarId] = solveRes.newValue;
    }
  } else {
    // Edit su stat base/non derivata: aggiorniamo direttamente il valore locale
    values[changedStatId] = clampedRequested;
  }

  // Enforce sui lock delle derivate ("derivata = costante", basi aggiustate dove possibile)
  const lockError = enforceLockedDerived(graph, stats, values, currentValues, changedStatId);
  if (lockError) {
    return {
      values: currentValues,
      changed: [],
      error: lockError,
    };
  }

  // Forward pass: ricalcolo di tutte le derivate non lockate, in ordine topologico
  forwardRecomputeDerived(graph, stats, values);

  const changed: string[] = [];
  for (const id of Object.keys(values)) {
    if (!approxEqual(values[id], currentValues[id])) {
      changed.push(id);
    }
  }

  return { values, changed };
}
