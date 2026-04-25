import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { GameplayModifier } from '../../../src/balancing/types/gameplayModifierTypes';

const trackTelemetryEventMock = vi.fn();
const saveDataMock = vi.fn();
const loadDataMock = vi.fn();
const diagnosticsWarnMock = vi.fn();
const flagState = { value: true };

vi.mock('@/analytics/telemetry/telemetryProvider', () => ({
  trackTelemetryEvent: trackTelemetryEventMock,
}));

vi.mock('@/shared/persistence/PersistenceService', () => ({
  saveData: saveDataMock,
  loadData: loadDataMock,
}));

vi.mock('@/shared/telemetry/headlessDiagnostics', () => ({
  createHeadlessDiagnostics: () => ({ warn: diagnosticsWarnMock }),
}));

vi.mock('@/shared/config/featureFlags', () => ({
  FeatureFlags: {
    archmage: { stsSimulator: false },
    idleVillage: {
      dragPreviewInstrumentation: false,
      get modifierTelemetry() {
        return flagState.value;
      },
    },
  },
}));

const importTelemetryModule = async () => {
  return import('../../../src/analytics/idleVillage/modifierTelemetry');
};

const createModifier = (overrides: Partial<GameplayModifier> = {}): GameplayModifier => ({
  id: 'mod_test',
  statId: 'stat_core_focus',
  operation: 'ADD',
  scope: 'GLOBAL',
  value: 5,
  stackCount: 2,
  maxStacks: 5,
  refreshPolicy: 'RESET_DURATION',
  owner: { type: 'system', id: 'system:test', label: 'System Test' },
  sourceConfigId: 'idleVillage.test.modifier',
  ...overrides,
});

describe('modifierTelemetry helpers', () => {
  beforeEach(() => {
    flagState.value = true;
    trackTelemetryEventMock.mockReset();
    saveDataMock.mockReset();
    loadDataMock.mockReset();
    diagnosticsWarnMock.mockReset();
    loadDataMock.mockResolvedValue(null);
    saveDataMock.mockResolvedValue(undefined);
    vi.resetModules();
  });

  it('emits modifier_applied payload with context and deltas', async () => {
    const { emitModifierApplied } = await importTelemetryModule();
    const modifier = createModifier({ stackCount: 3 });

    emitModifierApplied({
      modifier,
      scope: 'GLOBAL',
      valueBefore: 10,
      valueAfter: 18,
      context: { residentId: 'res_01', locationId: 'slot_east', tags: ['barracks'] },
    });

    expect(trackTelemetryEventMock).toHaveBeenCalledWith(
      'modifier_applied',
      expect.objectContaining({
        modifierId: modifier.id,
        statId: modifier.statId,
        scope: 'GLOBAL',
        stackCount: 3,
        valueBefore: 10,
        valueAfter: 18,
        valueDelta: 8,
        context: expect.objectContaining({ residentId: 'res_01', locationId: 'slot_east' }),
      }),
    );
  });

  it('emits modifier_removed with reason and fallback stack count', async () => {
    const { emitModifierRemoved } = await importTelemetryModule();
    const modifier = createModifier({ stackCount: 4 });

    emitModifierRemoved({ modifier, scope: 'SESSION', reason: 'expired' });

    expect(trackTelemetryEventMock).toHaveBeenCalledWith(
      'modifier_removed',
      expect.objectContaining({
        modifierId: modifier.id,
        reason: 'expired',
        stackCount: 4,
        scope: 'SESSION',
      }),
    );
  });

  it('emits modifier_stack_changed when counts differ', async () => {
    const { emitModifierStackChanged } = await importTelemetryModule();
    const modifier = createModifier();

    emitModifierStackChanged({
      modifier,
      scope: 'GLOBAL',
      previousStackCount: 1,
      newStackCount: 3,
    });

    expect(trackTelemetryEventMock).toHaveBeenCalledWith(
      'modifier_stack_changed',
      expect.objectContaining({
        modifierId: modifier.id,
        previousStackCount: 1,
        newStackCount: 3,
        delta: 2,
      }),
    );
  });

  it('skips modifier_stack_changed when counts are identical', async () => {
    const { emitModifierStackChanged } = await importTelemetryModule();
    const modifier = createModifier();

    emitModifierStackChanged({
      modifier,
      scope: 'GLOBAL',
      previousStackCount: 2,
      newStackCount: 2,
    });

    expect(trackTelemetryEventMock).not.toHaveBeenCalled();
  });

  it('respects feature flag gating for emitters', async () => {
    const { emitModifierApplied } = await importTelemetryModule();
    flagState.value = false;

    emitModifierApplied({
      modifier: createModifier(),
      scope: 'GLOBAL',
      valueBefore: 0,
      valueAfter: 5,
    });

    expect(trackTelemetryEventMock).not.toHaveBeenCalled();
  });

  it('getOnModifierAppliedTelemetryCallback returns handler only when enabled', async () => {
    const { getOnModifierAppliedTelemetryCallback } = await importTelemetryModule();
    const modifier = createModifier();

    const callback = getOnModifierAppliedTelemetryCallback();
    expect(callback).toBeTypeOf('function');

    callback?.({ modifier, scope: 'GLOBAL', valueBefore: 1, valueAfter: 6 });
    expect(trackTelemetryEventMock).toHaveBeenCalledTimes(1);

    trackTelemetryEventMock.mockClear();
    flagState.value = false;
    expect(getOnModifierAppliedTelemetryCallback()).toBeUndefined();
  });
});
