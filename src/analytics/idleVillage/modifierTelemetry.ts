import { trackTelemetryEvent } from '@/analytics/telemetry/telemetryProvider';
import type {
  GameplayModifier,
  GameplayModifierConditions,
  GameplayModifierOwner,
  GameplayStatId,
  ModifierContext,
  ModifierOperation,
  ModifierScope,
  OnModifierAppliedCallback,
} from '@/balancing/types/gameplayModifierTypes';
import { saveData, loadData } from '@/shared/persistence/PersistenceService';
import { FeatureFlags } from '@/shared/config/featureFlags';
import { createHeadlessDiagnostics } from '@/shared/telemetry/headlessDiagnostics';

const diagnostics = createHeadlessDiagnostics('IdleVillageModifierTelemetry');

const MODIFIER_TELEMETRY_CHANNEL = 'gameplay_modifier';
const MODIFIER_TELEMETRY_SESSION_STORAGE_KEY = 'idleVillage_modifier_telemetry_session_v1';

export type ModifierRemovalReason =
  | 'expired'
  | 'manual'
  | 'predicate_failed'
  | 'migration_cleanup'
  | 'unknown';

export type ModifierTelemetryEvent =
  | 'modifier_applied'
  | 'modifier_removed'
  | 'modifier_stack_changed';

interface ModifierTelemetrySessionState {
  sessionId: string;
  createdAt: number;
}

interface ModifierTelemetryContextPayload {
  residentId?: string;
  questId?: string;
  questPhaseId?: string;
  locationId?: string;
  tags?: string[];
  predicates?: string[];
}

interface BaseModifierTelemetryPayload extends Record<string, unknown> {
  channel: typeof MODIFIER_TELEMETRY_CHANNEL;
  timestamp: string;
  sessionId: string;
  modifierId: string;
  statId: GameplayStatId;
  scope: ModifierScope;
  operation: ModifierOperation;
  value: number;
  stackCount: number;
  maxStacks?: number;
  owner: GameplayModifierOwner;
  sourceConfigId: string;
  conditions?: GameplayModifierConditions;
  context?: ModifierTelemetryContextPayload;
  valueBefore?: number;
  valueAfter?: number;
  valueDelta?: number;
}

interface ModifierAppliedTelemetryDetails {
  modifier: GameplayModifier;
  scope: ModifierScope;
  valueBefore: number;
  valueAfter: number;
  context?: ModifierContext;
}

interface ModifierRemovalTelemetryDetails {
  modifier: GameplayModifier;
  scope: ModifierScope;
  reason: ModifierRemovalReason;
  stackCount?: number;
  context?: ModifierContext;
}

interface ModifierStackChangeTelemetryDetails {
  modifier: GameplayModifier;
  scope: ModifierScope;
  previousStackCount: number;
  newStackCount: number;
  context?: ModifierContext;
}

let sessionState: ModifierTelemetrySessionState = createSessionState();

void hydrateSessionState();

export function emitModifierApplied(details: ModifierAppliedTelemetryDetails): void {
  if (!isModifierTelemetryEnabled()) {
    return;
  }

  const payload = buildBasePayload(details.modifier, details.scope, details.context, {
    valueBefore: details.valueBefore,
    valueAfter: details.valueAfter,
    valueDelta: details.valueAfter - details.valueBefore,
  });

  trackTelemetryEvent('modifier_applied', payload);
}

export function emitModifierRemoved(details: ModifierRemovalTelemetryDetails): void {
  if (!isModifierTelemetryEnabled()) {
    return;
  }

  const payload = {
    ...buildBasePayload(details.modifier, details.scope, details.context),
    reason: details.reason,
    stackCount: details.stackCount ?? getStackCount(details.modifier),
  } as BaseModifierTelemetryPayload & { reason: ModifierRemovalReason };

  trackTelemetryEvent('modifier_removed', payload);
}

export function emitModifierStackChanged(details: ModifierStackChangeTelemetryDetails): void {
  if (!isModifierTelemetryEnabled()) {
    return;
  }

  if (details.previousStackCount === details.newStackCount) {
    return;
  }

  const payload = {
    ...buildBasePayload(details.modifier, details.scope, details.context),
    previousStackCount: details.previousStackCount,
    newStackCount: details.newStackCount,
    delta: details.newStackCount - details.previousStackCount,
  } as BaseModifierTelemetryPayload & {
    previousStackCount: number;
    newStackCount: number;
    delta: number;
  };

  trackTelemetryEvent('modifier_stack_changed', payload);
}

export function getOnModifierAppliedTelemetryCallback(): OnModifierAppliedCallback | undefined {
  if (!isModifierTelemetryEnabled()) {
    return undefined;
  }

  return ({ modifier, scope, valueBefore, valueAfter, context }) =>
    emitModifierApplied({ modifier, scope, valueBefore, valueAfter, context });
}

export function isModifierTelemetryEnabled(): boolean {
  return Boolean(FeatureFlags.idleVillage?.modifierTelemetry);
}

function buildBasePayload(
  modifier: GameplayModifier,
  scope: ModifierScope,
  context?: ModifierContext,
  extras: Partial<Pick<BaseModifierTelemetryPayload, 'valueBefore' | 'valueAfter' | 'valueDelta'>> = {},
): BaseModifierTelemetryPayload {
  return {
    channel: MODIFIER_TELEMETRY_CHANNEL,
    timestamp: new Date().toISOString(),
    sessionId: getSessionId(),
    modifierId: modifier.id,
    statId: modifier.statId,
    scope,
    operation: modifier.operation,
    value: modifier.value,
    stackCount: getStackCount(modifier),
    maxStacks: modifier.maxStacks,
    owner: modifier.owner,
    sourceConfigId: modifier.sourceConfigId,
    conditions: modifier.conditions,
    context: normalizeContext(context),
    ...extras,
  };
}

function getStackCount(modifier: GameplayModifier): number {
  return typeof modifier.stackCount === 'number' ? modifier.stackCount : 1;
}

function normalizeContext(context?: ModifierContext): ModifierTelemetryContextPayload | undefined {
  if (!context) {
    return undefined;
  }

  const payload: ModifierTelemetryContextPayload = {
    residentId: context.residentId,
    questId: context.questId,
    questPhaseId: context.questPhaseId,
    locationId: context.locationId,
    tags: context.tags?.length ? [...context.tags] : undefined,
    predicates: context.predicates?.length ? [...context.predicates] : undefined,
  };

  return Object.values(payload).some((value) =>
    Array.isArray(value) ? value.length > 0 : value !== undefined,
  )
    ? payload
    : undefined;
}

function createSessionState(): ModifierTelemetrySessionState {
  return {
    sessionId: `modifier_session_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`,
    createdAt: Date.now(),
  };
}

function getSessionId(): string {
  return sessionState.sessionId;
}

async function hydrateSessionState(): Promise<void> {
  try {
    const stored = await loadData<ModifierTelemetrySessionState | null>(
      MODIFIER_TELEMETRY_SESSION_STORAGE_KEY,
      null,
    );

    if (stored?.sessionId) {
      sessionState = stored;
      return;
    }

    await persistSessionState();
  } catch (error) {
    diagnostics.warn('Failed to hydrate modifier telemetry session', serializeError(error));
  }
}

async function persistSessionState(): Promise<void> {
  try {
    await saveData(MODIFIER_TELEMETRY_SESSION_STORAGE_KEY, sessionState);
  } catch (error) {
    diagnostics.warn('Failed to persist modifier telemetry session', serializeError(error));
  }
}

function serializeError(error: unknown): Record<string, unknown> {
  if (error instanceof Error) {
    return { message: error.message, stack: error.stack };
  }
  return { message: String(error) };
}
