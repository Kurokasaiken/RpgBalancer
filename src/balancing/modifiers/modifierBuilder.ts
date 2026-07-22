import { z } from 'zod';
import {
  GameplayModifierSchema,
  type GameplayModifier,
  type GameplayModifierConditions,
  type GameplayModifierLifetime,
  type GameplayModifierOwner,
  type GameplayStatId,
  type LifetimeType,
  type ModifierOperation,
  type ModifierScope,
  type OwnerType,
  type StackingMode,
  defaultStackingModeByOperation,
  gameplayStatIdPattern,
  lifetimeTypeValues,
  modifierOperationValues,
  modifierScopeValues,
  ownerTypeValues,
  refreshPolicyValues,
  stackingModeValues,
} from '@/balancing/types/gameplayModifierTypes';

/**
 * Builder configuration validated at construction time.
 */
export const BuilderConfigSchema = z.object({
  validation: z.boolean().default(true),
  typeCheck: z.boolean().default(true),
  enableTelemetry: z.boolean().default(true),
});

export type BuilderConfig = z.infer<typeof BuilderConfigSchema>;
export const defaultBuilderConfig: BuilderConfig = {
  validation: true,
  typeCheck: true,
  enableTelemetry: true,
};

/** Error thrown when a builder validation step fails. */
export class ModifierBuilderError extends Error {
  field?: string;

  constructor(message: string, field?: string) {
    super(message);
    this.name = 'ModifierBuilderError';
    this.field = field;
  }
}

/** Mutable draft used by the fluent builder. */
interface ModifierDraft {
  id?: string;
  statId?: GameplayStatId;
  operation?: ModifierOperation;
  scope?: ModifierScope;
  value?: number;
  mode?: StackingMode;
  maxStacks?: number;
  refreshPolicy?: 'RESET_DURATION' | 'IGNORE' | 'ADD_DURATION';
  conditions?: GameplayModifierConditions;
  lifetime?: GameplayModifierLifetime;
  owner?: GameplayModifierOwner;
  metadata?: Record<string, unknown>;
  sourceConfigId?: string;
  phaseId?: string;
}

/**
 * Fluent builder for {@link GameplayModifier} objects.
 *
 * Example:
 *
 * ```ts
 * const modifier = new ModifierBuilder(defaultBuilderConfig)
 *   .forStat('stat_core_focus')
 *   .add(5)
 *   .inScope('LOCATION')
 *   .ownedBy('building', 'barracks', 'Barracks')
 *   .fromConfig('idleVillage.modifiers.barracksLvl1')
 *   .withLifetime('SESSION')
 *   .withTags('barracks')
 *   .build();
 * ```
 */
export class ModifierBuilder {
  #draft: ModifierDraft = {};

  #config: BuilderConfig;

  constructor(config: BuilderConfig = defaultBuilderConfig) {
    this.#config = config;
  }

  /** Start from an existing modifier (clone). */
  static fromModifier(modifier: GameplayModifier, config?: BuilderConfig): ModifierBuilder {
    const builder = new ModifierBuilder(config ?? defaultBuilderConfig);
    builder.#draft = { ...modifier };
    return builder;
  }

  /** Set the stat id. */
  forStat(statId: GameplayStatId): this {
    this.#draft.statId = statId;
    return this;
  }

  /** Set the operation and value to ADD. */
  add(value: number): this {
    this.#draft.operation = 'ADD';
    this.#draft.value = value;
    this.#draft.mode = this.#draft.mode ?? defaultStackingModeByOperation.ADD;
    return this;
  }

  /** Set the operation and value to MULT. */
  multiply(value: number): this {
    this.#draft.operation = 'MULT';
    this.#draft.value = value;
    this.#draft.mode = this.#draft.mode ?? defaultStackingModeByOperation.MULT;
    return this;
  }

  /** Set the operation and value to SET. */
  set(value: number): this {
    this.#draft.operation = 'SET';
    this.#draft.value = value;
    this.#draft.mode = this.#draft.mode ?? defaultStackingModeByOperation.SET;
    return this;
  }

  /** Set the modifier scope. */
  inScope(scope: ModifierScope): this {
    this.#draft.scope = scope;
    return this;
  }

  /** Set the stacking mode explicitly. */
  withMode(mode: StackingMode): this {
    this.#draft.mode = mode;
    return this;
  }

  /** Set max stack count. */
  withMaxStacks(maxStacks: number): this {
    this.#draft.maxStacks = maxStacks;
    return this;
  }

  /** Set the refresh policy. */
  withRefreshPolicy(policy: 'RESET_DURATION' | 'IGNORE' | 'ADD_DURATION'): this {
    this.#draft.refreshPolicy = policy;
    return this;
  }

  /** Set the lifetime. For TIMED lifetimes use the overload with durationTicks. */
  withLifetime(type: LifetimeType): this;
  withLifetime(type: 'TIMED', durationTicks: number): this;
  withLifetime(type: LifetimeType, durationTicks?: number): this {
    this.#draft.lifetime = { type, durationTicks };
    return this;
  }

  /** Set the modifier owner. */
  ownedBy(type: OwnerType, id: string, label: string): this {
    this.#draft.owner = { type, id, label };
    return this;
  }

  /** Set the source config id (config-first provenance). */
  fromConfig(sourceConfigId: string): this {
    this.#draft.sourceConfigId = sourceConfigId;
    return this;
  }

  /** Set a stable modifier id. */
  withId(id: string): this {
    this.#draft.id = id;
    return this;
  }

  /** Add condition tags. */
  withTags(...tags: string[]): this {
    this.#draft.conditions = {
      ...this.#draft.conditions,
      tags: [...(this.#draft.conditions?.tags ?? []), ...tags],
    };
    return this;
  }

  /** Add condition predicates. */
  withPredicates(...predicates: string[]): this {
    this.#draft.conditions = {
      ...this.#draft.conditions,
      predicates: [...(this.#draft.conditions?.predicates ?? []), ...predicates],
    };
    return this;
  }

  /** Limit the modifier to specific residents. */
  forResidents(...residentIds: string[]): this {
    this.#draft.conditions = {
      ...this.#draft.conditions,
      residentIds: [...(this.#draft.conditions?.residentIds ?? []), ...residentIds],
    };
    return this;
  }

  /** Limit the modifier to specific locations. */
  forLocations(...locationIds: string[]): this {
    this.#draft.conditions = {
      ...this.#draft.conditions,
      locationIds: [...(this.#draft.conditions?.locationIds ?? []), ...locationIds],
    };
    return this;
  }

  /** Add quest tags to conditions. */
  withQuestTags(...questTags: string[]): this {
    this.#draft.conditions = {
      ...this.#draft.conditions,
      questTags: [...(this.#draft.conditions?.questTags ?? []), ...questTags],
    };
    return this;
  }

  /** Add quest phase ids to conditions. */
  withQuestPhaseIds(...questPhaseIds: string[]): this {
    this.#draft.conditions = {
      ...this.#draft.conditions,
      questPhaseIds: [...(this.#draft.conditions?.questPhaseIds ?? []), ...questPhaseIds],
    };
    return this;
  }

  /** Set the quest phase id for QUEST scope. */
  withPhaseId(phaseId: string): this {
    this.#draft.phaseId = phaseId;
    return this;
  }

  /** Attach arbitrary metadata (must be serializable). */
  withMetadata(metadata: Record<string, unknown>): this {
    this.#draft.metadata = { ...this.#draft.metadata, ...metadata };
    return this;
  }

  /** Derive a stable id from owner and stat if not explicitly set. */
  #deriveId(): string {
    const ownerPart = this.#draft.owner ? `${this.#draft.owner.type}_${this.#draft.owner.id}` : 'unknown';
    const statPart = this.#draft.statId ?? 'unknown';
    const opPart = this.#draft.operation ?? 'mod';
    return `mod_${ownerPart}_${statPart}_${opPart}`;
  }

  /**
   * Build and validate the final GameplayModifier.
   * Throws {@link ModifierBuilderError} when validation is enabled and required fields are missing.
   */
  build(): GameplayModifier {
    if (this.#config.validation) {
      this.#validate();
    }

    const modifier: GameplayModifier = {
      id: this.#draft.id ?? this.#deriveId(),
      statId: this.#draft.statId!,
      operation: this.#draft.operation!,
      scope: this.#draft.scope!,
      value: this.#draft.value!,
      mode: this.#draft.mode,
      maxStacks: this.#draft.maxStacks ?? 1,
      refreshPolicy: this.#draft.refreshPolicy ?? 'RESET_DURATION',
      conditions: this.#draft.conditions,
      lifetime: this.#draft.lifetime,
      owner: this.#draft.owner!,
      metadata: this.#draft.metadata,
      sourceConfigId: this.#draft.sourceConfigId!,
      phaseId: this.#draft.phaseId,
    };

    const parsed = GameplayModifierSchema.safeParse(modifier);
    if (this.#config.validation && !parsed.success) {
      const issues = parsed.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`).join('; ');
      throw new ModifierBuilderError(`Schema validation failed: ${issues}`);
    }

    return parsed.success ? parsed.data : modifier;
  }

  #validate(): void {
    if (!this.#draft.statId) {
      throw new ModifierBuilderError('statId is required; use forStat()', 'statId');
    }
    if (!gameplayStatIdPattern.test(this.#draft.statId)) {
      throw new ModifierBuilderError(`statId must match ${gameplayStatIdPattern.toString()}`, 'statId');
    }
    if (!this.#draft.operation) {
      throw new ModifierBuilderError('operation is required; use add(), multiply(), or set()', 'operation');
    }
    if (modifierOperationValues.indexOf(this.#draft.operation) === -1) {
      throw new ModifierBuilderError(`operation must be one of ${modifierOperationValues.join(', ')}`, 'operation');
    }
    if (this.#draft.value === undefined || Number.isNaN(this.#draft.value)) {
      throw new ModifierBuilderError('value is required; use add(), multiply(), or set()', 'value');
    }
    if (!this.#draft.scope) {
      throw new ModifierBuilderError('scope is required; use inScope()', 'scope');
    }
    if (modifierScopeValues.indexOf(this.#draft.scope) === -1) {
      throw new ModifierBuilderError(`scope must be one of ${modifierScopeValues.join(', ')}`, 'scope');
    }
    if (!this.#draft.owner) {
      throw new ModifierBuilderError('owner is required; use ownedBy()', 'owner');
    }
    if (ownerTypeValues.indexOf(this.#draft.owner.type) === -1) {
      throw new ModifierBuilderError(`owner.type must be one of ${ownerTypeValues.join(', ')}`, 'owner.type');
    }
    if (!this.#draft.sourceConfigId) {
      throw new ModifierBuilderError('sourceConfigId is required; use fromConfig()', 'sourceConfigId');
    }
    if (this.#draft.lifetime && this.#draft.lifetime.type === 'TIMED' && this.#draft.lifetime.durationTicks === undefined) {
      throw new ModifierBuilderError('TIMED lifetime requires durationTicks', 'lifetime.durationTicks');
    }
    if (this.#draft.mode && stackingModeValues.indexOf(this.#draft.mode) === -1) {
      throw new ModifierBuilderError(`mode must be one of ${stackingModeValues.join(', ')}`, 'mode');
    }
    if (
      this.#draft.refreshPolicy &&
      refreshPolicyValues.indexOf(this.#draft.refreshPolicy) === -1
    ) {
      throw new ModifierBuilderError(
        `refreshPolicy must be one of ${refreshPolicyValues.join(', ')}`,
        'refreshPolicy',
      );
    }
    if (this.#draft.lifetime && lifetimeTypeValues.indexOf(this.#draft.lifetime.type) === -1) {
      throw new ModifierBuilderError(
        `lifetime.type must be one of ${lifetimeTypeValues.join(', ')}`,
        'lifetime.type',
      );
    }
  }
}

/**
 * Convenience factory for creating a builder with the default config.
 */
export function createModifierBuilder(config?: BuilderConfig): ModifierBuilder {
  return new ModifierBuilder(config);
}
