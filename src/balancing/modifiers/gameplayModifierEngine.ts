import {
  DEFAULT_SCOPE_ORDER,
  DEFAULT_STACK_LIMIT,
  defaultStackingModeByOperation,
} from '@/balancing/types/gameplayModifierTypes';
import type {
  GameplayModifier,
  GameplayStatId,
  ModifierContext,
  ModifierScope,
  ResolveModifierOptions,
  ResolveModifiersResult,
  ScopeResolutionSnapshot,
  StackingMode,
} from '@/balancing/types/gameplayModifierTypes';

/** Resolves a stat by applying gameplay modifiers respecting scope order and stacking policy. */
export function resolveModifiers(options: ResolveModifierOptions): ResolveModifiersResult {
  const { statId, baseValue, modifiers, context, onModifierApplied, scopeFilter } = options;
  let cursor = baseValue;
  const scopeBreakdown: ScopeResolutionSnapshot[] = [];
  const scopesToEvaluate = dedupeScopes(scopeFilter);

  for (const scope of scopesToEvaluate) {
    const scopeValueBefore = cursor;
    const scopedModifiers = sortModifiers(selectScopeModifiers(modifiers, statId, scope, context));

    if (scopedModifiers.length === 0) {
      scopeBreakdown.push({
        scope,
        valueBefore: scopeValueBefore,
        valueAfter: cursor,
        appliedModifierIds: [],
      });
      continue;
    }

    const appliedOrder: GameplayModifier[] = [];
    cursor = applyScopeModifiers({
      scope,
      modifiers: scopedModifiers,
      startingValue: cursor,
      context,
      onModifierApplied,
      appliedOrder,
    });

    scopeBreakdown.push({
      scope,
      valueBefore: scopeValueBefore,
      valueAfter: cursor,
      appliedModifierIds: appliedOrder.map((modifier) => modifier.id),
    });
  }

  return {
    statId,
    baseValue,
    finalValue: cursor,
    breakdown: scopeBreakdown,
  };
}

interface ApplyScopeModifiersParams {
  scope: ModifierScope;
  modifiers: GameplayModifier[];
  startingValue: number;
  context?: ModifierContext;
  onModifierApplied?: ResolveModifierOptions['onModifierApplied'];
  appliedOrder: GameplayModifier[];
}

function applyScopeModifiers(params: ApplyScopeModifiersParams): number {
  const { scope, modifiers, startingValue, context, onModifierApplied, appliedOrder } = params;
  let cursor = startingValue;

  const additive = modifiers.filter((modifier) => resolveStackingMode(modifier) === 'ADDITIVE');
  cursor = applyModifierGroup({
    modifiers: additive,
    scope,
    cursor,
    context,
    onModifierApplied,
    appliedOrder,
    computeNextValue: (value, modifier, stacks) => value + modifier.value * stacks,
  });

  const multiplicative = modifiers.filter((modifier) => resolveStackingMode(modifier) === 'MULTIPLICATIVE');
  cursor = applyModifierGroup({
    modifiers: multiplicative,
    scope,
    cursor,
    context,
    onModifierApplied,
    appliedOrder,
    computeNextValue: (value, modifier, stacks) => value * (1 + modifier.value * stacks),
  });

  const overrides = modifiers.filter((modifier) => resolveStackingMode(modifier) === 'OVERRIDE');
  cursor = applyModifierGroup({
    modifiers: overrides,
    scope,
    cursor,
    context,
    onModifierApplied,
    appliedOrder,
    computeNextValue: (_value, modifier) => modifier.value,
  });

  return cursor;
}

interface ApplyModifierGroupParams {
  modifiers: GameplayModifier[];
  scope: ModifierScope;
  cursor: number;
  context?: ModifierContext;
  onModifierApplied?: ResolveModifierOptions['onModifierApplied'];
  appliedOrder: GameplayModifier[];
  computeNextValue: (value: number, modifier: GameplayModifier, stacks: number) => number;
}

function applyModifierGroup(params: ApplyModifierGroupParams): number {
  const { modifiers, scope, context, onModifierApplied, appliedOrder, computeNextValue } = params;
  let cursor = params.cursor;

  for (const modifier of modifiers) {
    const stacks = getEffectiveStackCount(modifier);
    if (stacks === 0) {
      continue;
    }

    const before = cursor;
    cursor = computeNextValue(cursor, modifier, stacks);
    appliedOrder.push(modifier);
    onModifierApplied?.({
      modifier,
      scope,
      valueBefore: before,
      valueAfter: cursor,
      context,
    });
  }

  return cursor;
}

function selectScopeModifiers(
  modifiers: GameplayModifier[],
  statId: GameplayStatId,
  scope: ModifierScope,
  context?: ModifierContext,
): GameplayModifier[] {
  return modifiers.filter(
    (modifier) =>
      modifier.scope === scope &&
      modifier.statId === statId &&
      modifierIsActive(modifier, context),
  );
}

function modifierIsActive(modifier: GameplayModifier, context?: ModifierContext): boolean {
  if (!matchesConditions(modifier, context)) {
    return false;
  }

  if (!modifier.lifetime) {
    return true;
  }

  if (modifier.lifetime.type === 'TIMED') {
    if (typeof modifier.lifetime.expiresAt === 'number' && typeof context?.currentTick === 'number') {
      return context.currentTick <= modifier.lifetime.expiresAt;
    }
  }

  return true;
}

function matchesConditions(modifier: GameplayModifier, context?: ModifierContext): boolean {
  const { conditions } = modifier;
  if (!conditions) {
    return matchesPhaseMetadata(modifier, context);
  }

  if (!matchesList(conditions.tags, context?.tags)) {
    return false;
  }

  if (!matchesList(conditions.predicates, context?.predicates)) {
    return false;
  }

  if (conditions.residentIds && (!context?.residentId || !conditions.residentIds.includes(context.residentId))) {
    return false;
  }

  if (!matchesList(conditions.questTags, context?.questTags)) {
    return false;
  }

  if (conditions.questPhaseIds && (!context?.questPhaseId || !conditions.questPhaseIds.includes(context.questPhaseId))) {
    return false;
  }

  if (conditions.locationIds && (!context?.locationId || !conditions.locationIds.includes(context.locationId))) {
    return false;
  }

  return matchesPhaseMetadata(modifier, context);
}

function matchesPhaseMetadata(modifier: GameplayModifier, context?: ModifierContext): boolean {
  if (!modifier.phaseId) {
    return true;
  }
  return modifier.phaseId === context?.questPhaseId;
}

function matchesList(required?: string[], actual?: string[]): boolean {
  if (!required || required.length === 0) {
    return true;
  }
  if (!actual || actual.length === 0) {
    return false;
  }
  return required.every((entry) => actual.includes(entry));
}

function sortModifiers(modifiers: GameplayModifier[]): GameplayModifier[] {
  return [...modifiers].sort((a, b) => a.id.localeCompare(b.id));
}

function resolveStackingMode(modifier: GameplayModifier): StackingMode {
  return modifier.mode ?? defaultStackingModeByOperation[modifier.operation];
}

function getEffectiveStackCount(modifier: GameplayModifier): number {
  const requested = modifier.stackCount ?? 1;
  const limit = Math.max(0, modifier.maxStacks ?? DEFAULT_STACK_LIMIT);
  return Math.min(Math.max(requested, 0), limit);
}

function dedupeScopes(scopes?: ModifierScope[]): ModifierScope[] {
  const order = scopes && scopes.length > 0 ? scopes : DEFAULT_SCOPE_ORDER;
  return order.filter((scope, index) => order.indexOf(scope) === index);
}
