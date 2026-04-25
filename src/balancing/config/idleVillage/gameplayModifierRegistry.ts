import { resolveModifiers } from '@/balancing/modifiers/gameplayModifierEngine';
import { DEFAULT_SCOPE_ORDER } from '@/balancing/types/gameplayModifierTypes';
import { getOnModifierAppliedTelemetryCallback } from '@/analytics/idleVillage/modifierTelemetry';
import type {
  GameplayModifier,
  GameplayStatId,
  ModifierContext,
  ModifierScope,
  ResolveModifierOptions,
  ResolveModifiersResult,
} from '@/balancing/types/gameplayModifierTypes';

export interface RegisterModifiersOptions {
  /** When true, incoming modifiers override existing ones while keeping non-conflicting entries. */
  merge?: boolean;
}

export interface ResolveStatGraphOptions {
  statId: GameplayStatId;
  baseValue: number;
  context?: ModifierContext;
  /** Optional subset of scopes to evaluate (defaults to full pipeline order). */
  scopes?: ModifierScope[];
  onModifierApplied?: ResolveModifierOptions['onModifierApplied'];
}

interface RegistryIndex {
  byScope: Map<ModifierScope, GameplayModifier[]>;
  byStat: Map<GameplayStatId, GameplayModifier[]>;
}

/**
 * Baseline Idle Village modifiers translated from docs/plans/idle_village_modifiers_plan.md §4.3.
 * Acts as default registry payload until builders author new presets.
 */
export const DEFAULT_IDLE_VILLAGE_MODIFIERS = [
  {
    id: 'mod_barracks_discipline_aura',
    statId: 'stat_core_focus',
    operation: 'ADD',
    scope: 'LOCATION',
    value: 5,
    mode: 'ADDITIVE',
    maxStacks: 1,
    refreshPolicy: 'RESET_DURATION',
    conditions: { tags: ['barracks'] },
    lifetime: { type: 'SESSION' },
    owner: { type: 'building', id: 'barracks_lvl1', label: 'Barracks L1' },
    metadata: { docRef: 'idle_village_modifiers_plan §4.3' },
    sourceConfigId: 'idleVillage.modifiers.barracksLvl1',
  },
  {
    id: 'mod_quest_fog_of_dread',
    statId: 'stat_risk_injury',
    operation: 'MULT',
    scope: 'QUEST',
    value: 0.25,
    mode: 'MULTIPLICATIVE',
    maxStacks: 1,
    refreshPolicy: 'RESET_DURATION',
    lifetime: { type: 'TIMED', durationTicks: 3 },
    owner: { type: 'quest', id: 'trial_fire', label: 'Trial of Fire' },
    metadata: { docRef: 'idle_village_modifiers_plan §4.3' },
    sourceConfigId: 'quests.trial_fire.phase_fog',
    phaseId: 'trial_fire_phase_fog',
  },
] satisfies ReadonlyArray<GameplayModifier>;

let registryPayload: GameplayModifier[] = normalizeModifiers(DEFAULT_IDLE_VILLAGE_MODIFIERS);
let registryIndex: RegistryIndex = buildRegistryIndex(registryPayload);

/** Registers modifiers in the in-memory registry, replacing or merging with previous payload. */
export function registerModifiers(
  modifiers: ReadonlyArray<GameplayModifier>,
  options: RegisterModifiersOptions = {},
): GameplayModifier[] {
  const normalizedIncoming = normalizeModifiers(modifiers);
  const payload = options.merge ? mergePayloads(registryPayload, normalizedIncoming) : normalizedIncoming;
  registryPayload = normalizeModifiers(payload);
  registryIndex = buildRegistryIndex(registryPayload);
  return getAllRegisteredModifiers();
}

/** Returns a clone of all registered modifiers. */
export function getAllRegisteredModifiers(): GameplayModifier[] {
  return registryPayload.map(cloneModifier);
}

/** Returns modifiers scoped by the provided bucket, optionally filtered by stat. */
export function getModifiersByScope(scope: ModifierScope, statId?: GameplayStatId): GameplayModifier[] {
  const scopedList = registryIndex.byScope.get(scope) ?? [];
  const filtered = statId ? scopedList.filter((modifier) => modifier.statId === statId) : scopedList;
  return filtered.map(cloneModifier);
}

/** Returns modifiers targeting a specific stat across optional scopes. */
export function getModifiersByStat(statId: GameplayStatId, scopes?: ModifierScope[]): GameplayModifier[] {
  const statBucket = registryIndex.byStat.get(statId) ?? [];
  if (!scopes || scopes.length === 0) {
    return statBucket.map(cloneModifier);
  }
  const scopeSet = new Set(dedupeScopes(scopes));
  return statBucket.filter((modifier) => scopeSet.has(modifier.scope)).map(cloneModifier);
}

/** Resolves a stat graph using the registered modifiers. */
export function resolveStatGraph(options: ResolveStatGraphOptions): ResolveModifiersResult {
  const scopesToEvaluate = dedupeScopes(options.scopes);
  const modifiers = scopesToEvaluate.flatMap((scope) => getModifiersByScope(scope, options.statId));
  const telemetryCallback = getOnModifierAppliedTelemetryCallback();
  const onModifierApplied = options.onModifierApplied ?? telemetryCallback;

  return resolveModifiers({
    statId: options.statId,
    baseValue: options.baseValue,
    modifiers,
    context: options.context,
    onModifierApplied,
    scopeFilter: scopesToEvaluate,
  });
}

function mergePayloads(base: GameplayModifier[], incoming: GameplayModifier[]): GameplayModifier[] {
  const map = new Map<string, GameplayModifier>();
  for (const modifier of base) {
    map.set(modifier.id, modifier);
  }
  for (const modifier of incoming) {
    map.set(modifier.id, modifier);
  }
  return Array.from(map.values());
}

function buildRegistryIndex(modifiers: GameplayModifier[]): RegistryIndex {
  const byScope = new Map<ModifierScope, GameplayModifier[]>();
  const byStat = new Map<GameplayStatId, GameplayModifier[]>();

  for (const scope of DEFAULT_SCOPE_ORDER) {
    byScope.set(scope, []);
  }

  for (const modifier of modifiers) {
    const scopeBucket = byScope.get(modifier.scope) ?? [];
    scopeBucket.push(modifier);
    byScope.set(modifier.scope, scopeBucket);

    const statBucket = byStat.get(modifier.statId) ?? [];
    statBucket.push(modifier);
    byStat.set(modifier.statId, statBucket);
  }

  return { byScope, byStat };
}

function normalizeModifiers(modifiers: ReadonlyArray<GameplayModifier>): GameplayModifier[] {
  return modifiers.map(cloneModifier);
}

function cloneModifier(modifier: GameplayModifier): GameplayModifier {
  return {
    ...modifier,
    owner: { ...modifier.owner },
    conditions: modifier.conditions
      ? {
          tags: modifier.conditions.tags ? [...modifier.conditions.tags] : undefined,
          predicates: modifier.conditions.predicates ? [...modifier.conditions.predicates] : undefined,
          residentIds: modifier.conditions.residentIds
            ? [...modifier.conditions.residentIds]
            : undefined,
          questTags: modifier.conditions.questTags ? [...modifier.conditions.questTags] : undefined,
          questPhaseIds: modifier.conditions.questPhaseIds
            ? [...modifier.conditions.questPhaseIds]
            : undefined,
          locationIds: modifier.conditions.locationIds ? [...modifier.conditions.locationIds] : undefined,
        }
      : undefined,
    lifetime: modifier.lifetime
      ? {
          ...modifier.lifetime,
        }
      : undefined,
  };
}

function dedupeScopes(scopes?: ModifierScope[]): ModifierScope[] {
  const order = scopes && scopes.length > 0 ? scopes : DEFAULT_SCOPE_ORDER;
  const seen = new Set<ModifierScope>();
  const result: ModifierScope[] = [];
  for (const scope of order) {
    if (seen.has(scope)) {
      continue;
    }
    seen.add(scope);
    result.push(scope);
  }
  return result;
}
