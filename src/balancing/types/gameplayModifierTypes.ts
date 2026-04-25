import { z } from 'zod';

/** Regex enforced for every stat controlled by the registry (stat_<domain>_<slug>). */
export const gameplayStatIdPattern = /^stat_[a-z0-9_]+$/;

/** Literal scopes available to modifiers, exported for config reuse. */
export const modifierScopeValues = ['GLOBAL', 'SESSION', 'LOCATION', 'QUEST', 'RESIDENT'] as const;
/** Scope bucket a modifier belongs to within the resolver pipeline. */
export type ModifierScope = (typeof modifierScopeValues)[number];

/** Supported math operations for modifier application (add/multiply/set). */
export const modifierOperationValues = ['ADD', 'MULT', 'SET'] as const;
export type ModifierOperation = (typeof modifierOperationValues)[number];

/** Default stacking semantics: additive, multiplicative, or override. */
export const stackingModeValues = ['ADDITIVE', 'MULTIPLICATIVE', 'OVERRIDE'] as const;
export type StackingMode = (typeof stackingModeValues)[number];

/** Supported refresh behaviors when the same modifier instance reapplies. */
export const refreshPolicyValues = ['RESET_DURATION', 'IGNORE', 'ADD_DURATION'] as const;
export type RefreshPolicy = (typeof refreshPolicyValues)[number];

/** Valid lifetimes for modifiers. TIMED requires duration metadata. */
export const lifetimeTypeValues = ['INSTANT', 'TIMED', 'SESSION'] as const;
export type LifetimeType = (typeof lifetimeTypeValues)[number];

/** Authoritative owner types to ensure provenance tracking stays consistent. */
export const ownerTypeValues = ['building', 'item', 'trait', 'quest', 'terrain', 'system'] as const;
export type OwnerType = (typeof ownerTypeValues)[number];

/** Declarative ownership metadata stored alongside every modifier. */
export interface GameplayModifierOwner {
  /** Domain entity that emits or governs the modifier. */
  type: OwnerType;
  /** Stable identifier of the owner (namespaced when needed). */
  id: string;
  /** Human friendly label surfaced in UI/telemetry. */
  label: string;
}

/** Lifetime configuration describing how long a modifier remains active. */
export interface GameplayModifierLifetime {
  /** Defines how the modifier is cleared. */
  type: LifetimeType;
  /** Optional tick duration for TIMED lifetimes. */
  durationTicks?: number;
  /** Optional absolute tick for expiration; used for persistence recovery. */
  expiresAt?: number;
}

/** Structured predicates controlling where/when a modifier applies. */
export interface GameplayModifierConditions {
  /** Tag alignment (activity tags, biome markers, etc.). */
  tags?: string[];
  /** Builder-defined predicate identifiers. */
  predicates?: string[];
  /** Explicit resident whitelist when the modifier targets individuals. */
  residentIds?: string[];
  /** Quest-level tagging, e.g., story arcs or theme buckets. */
  questTags?: string[];
  /** Specific quest or phase targets when differentiating per-step effects. */
  questPhaseIds?: string[];
  /** Location identifiers (map slots, buildings) required for activation. */
  locationIds?: string[];
}

export const GameplayModifierSchema = z.object({
  id: z.string().min(1),
  statId: z.string().regex(gameplayStatIdPattern),
  operation: z.enum(modifierOperationValues),
  scope: z.enum(modifierScopeValues),
  value: z.number(),
  mode: z.enum(stackingModeValues).optional(),
  maxStacks: z.number().int().min(1).default(1),
  refreshPolicy: z.enum(refreshPolicyValues).default('RESET_DURATION'),
  conditions: z
    .object({
      tags: z.array(z.string()).optional(),
      predicates: z.array(z.string()).optional(),
      residentIds: z.array(z.string()).optional(),
      questTags: z.array(z.string()).optional(),
      questPhaseIds: z.array(z.string()).optional(),
      locationIds: z.array(z.string()).optional(),
    })
    .optional(),
  lifetime: z
    .object({
      type: z.enum(lifetimeTypeValues),
      durationTicks: z.number().int().nonnegative().optional(),
      expiresAt: z.number().optional(),
    })
    .optional(),
  owner: z.object({
    type: z.enum(ownerTypeValues),
    id: z.string().min(1),
    label: z.string().min(1),
  }),
  metadata: z.record(z.any()).optional(),
  sourceConfigId: z.string().min(1),
  /** Optional quest phase metadata for QUEST scope disambiguation. */
  phaseId: z.string().optional(),
  stackCount: z.number().int().min(0).optional(),
});

export type GameplayModifier = z.infer<typeof GameplayModifierSchema>;
export type GameplayStatId = GameplayModifier['statId'];

/** Declarative stacking policy stored per scope for quick lookup. */
export interface StackingConfig {
  /** Scope where the policy applies. */
  scope: ModifierScope;
  /** Default stacking mode when author does not override it. */
  mode: StackingMode;
  /** Scope-wide stack safety limit (defaults to 1). */
  maxStacks: number;
}

/** Runtime context passed to the resolver to evaluate predicates. */
export interface ModifierContext {
  /** Stat currently being evaluated. */
  statId: GameplayStatId;
  /** Active tags on the target entity or activity. */
  tags?: string[];
  /** Predicates resolved externally (e.g., crew scheduler checks). */
  predicates?: string[];
  /** Resident involved in the computation, if any. */
  residentId?: string;
  /** Quest identifier being evaluated. */
  questId?: string;
  /** Quest tags that already passed filtering upstream. */
  questTags?: string[];
  /** Quest phase currently active across the UI/engine. */
  questPhaseId?: string;
  /** Location or slot identifier driving the computation. */
  locationId?: string;
  /** Current tick used for lifetime comparison. */
  currentTick?: number;
}

/** Options accepted by the resolver entry-point. */
export interface ResolveModifierOptions {
  /** Target stat. */
  statId: GameplayStatId;
  /** Stat baseline before modifiers. */
  baseValue: number;
  /** All candidate modifiers for the stat. */
  modifiers: GameplayModifier[];
  /** Optional runtime context used for predicate filtering. */
  context?: ModifierContext;
  /** Optional callback invoked for telemetry/logging hooks. */
  onModifierApplied?: OnModifierAppliedCallback;
  /** Optional scope subset used to limit evaluation order. */
  scopeFilter?: ModifierScope[];
}

export type OnModifierAppliedCallback = (details: {
  modifier: GameplayModifier;
  scope: ModifierScope;
  valueBefore: number;
  valueAfter: number;
  context?: ModifierContext;
}) => void;

/** Snapshot describing how a single scope changed the stat value. */
export interface ScopeResolutionSnapshot {
  scope: ModifierScope;
  valueBefore: number;
  valueAfter: number;
  appliedModifierIds: string[];
}

/** Result returned by the modifier engine, including breakdown metadata. */
export interface ResolveModifiersResult {
  statId: GameplayStatId;
  baseValue: number;
  finalValue: number;
  breakdown: ScopeResolutionSnapshot[];
}

export const defaultStackingModeByOperation: Record<ModifierOperation, StackingMode> = {
  ADD: 'ADDITIVE',
  MULT: 'MULTIPLICATIVE',
  SET: 'OVERRIDE',
};

export const DEFAULT_STACK_LIMIT = 1;
export const DEFAULT_SCOPE_ORDER: ModifierScope[] = [...modifierScopeValues];
