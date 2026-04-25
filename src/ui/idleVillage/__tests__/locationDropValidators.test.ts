import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { MockedFunction } from 'vitest';
import { validateResidentDrop } from '../utils/locationDropValidators';
import type { IdleVillageConfig } from '@/balancing/config/idleVillage/types';
import type { ResidentState } from '@/engine/game/idleVillage/TimeEngine';
import type { WorkerPickerTelemetryStore } from '@/ui/idleVillage/utils/workerPickerTelemetry';
import { createTelemetryTestStore } from '@/ui/idleVillage/tests/testUtils/createTelemetryStore';

// Mock window object for telemetry
const mockWindow = {
  __sandboxTelemetry: createTelemetryTestStore(),
} as Window & { __sandboxTelemetry: WorkerPickerTelemetryStore };

describe('locationDropValidators', () => {
  let mockConfig: IdleVillageConfig;
  let mockResident: ResidentState;
  let mockDiagnostics: {
    debug: MockedFunction<(message: string, payload: Record<string, unknown>) => void>;
    info: MockedFunction<(message: string, payload: Record<string, unknown>) => void>;
    warn: MockedFunction<(message: string, payload: Record<string, unknown>) => void>;
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockWindow.__sandboxTelemetry = createTelemetryTestStore();
    global.window = mockWindow as unknown as Window & typeof globalThis;
    
    mockConfig = {
      version: '1.0.0',
      resources: {},
      activities: {
        'test-activity': {
          id: 'test-activity',
          label: 'Test Activity',
          description: 'Test activity for validation',
          tags: ['job'],
          slotTags: ['village_job'],
          resolutionEngineId: 'job',
          statRequirement: {
            allOf: ['strength'],
          },
          metadata: {
            fatigueThreshold: 80,
            crewLimit: 2,
          },
        },
        'invasion-activity': {
          id: 'invasion-activity',
          label: 'Invasion Activity',
          description: 'Invasion activity for validation',
          tags: ['quest', 'combat'],
          slotTags: ['world_quest'],
          resolutionEngineId: 'quest_combat',
          statRequirement: {
            anyOf: ['combat', 'magic'],
          },
          metadata: {
            fatigueThreshold: 60,
            crewLimit: 1,
          },
        },
      },
      questTypes: {},
      mapSlots: {},
      locations: {},
      residents: {},
      passiveEffects: {},
      buildings: {},
      variance: {
      difficultyCategories: {
        normal: {
          id: 'normal',
          label: 'Normal',
          minMultiplier: 0.9,
          maxMultiplier: 1.1,
          weight: 1,
        },
      },
      rewardCategories: {
        normal: {
          id: 'normal',
          label: 'Normal',
          minMultiplier: 0.9,
          maxMultiplier: 1.1,
          weight: 1,
        },
      },
    },
      globalRules: {
        maxFatigueBeforeExhausted: 100,
        defaultActivityFatigueGain: 10,
        fatigueRecoveryPerDay: 20,
        dayLengthInTimeUnits: 24,
        fatigueYellowThreshold: 60,
        fatigueRedThreshold: 80,
        baseLightInjuryChanceAtMaxFatigue: 0.1,
        dangerInjuryMultiplierPerPoint: 0.01,
        injuryTiers: {
          light: {
            id: 'light',
            label: 'Light',
            recoveryTimeInDays: 1,
          },
        },
        ticksPerDay: 24,
        ticksPerNight: 8,
        fatigueRecoveryPerNightTick: 1,
        productionHaltFatigueThreshold: 80,
        foodConsumptionPerResidentPerDay: 2,
        baseFoodPriceInGold: 10,
        questXpFormula: 'level * 100',
        maxActiveQuests: 3,
        questSpawnEveryNDays: 1,
        maxGlobalQuestOffers: 5,
        maxQuestOffersPerSlot: 2,
      },
      overlaySettings: {
        enabled: false,
        defaultPosition: 'top-right',
        defaultSize: 'medium',
        defaultZoom: 1,
        alwaysOnTop: true,
        transparency: false,
        enabledWidgets: [],
        autoHideTimeoutSeconds: 0,
        showSystemTrayIcon: false,
      },
    } as IdleVillageConfig;

    mockResident = {
      id: 'resident-1',
      name: 'Test Resident',
      status: 'available',
      fatigue: 50,
      statTags: ['strength', 'combat'],
      currentHp: 100,
      maxHp: 100,
      isHero: false,
      isInjured: false,
      survivalCount: 0,
      survivalScore: 0,
    } as ResidentState;

    mockDiagnostics = {
      debug: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
    };

  });

  it('should validate successful drop with matching requirements', () => {
    const result = validateResidentDrop({
      resident: mockResident,
      slotId: 'slot-1',
      activityId: 'test-activity',
      currentAssignments: {},
      config: mockConfig,
      diagnostics: mockDiagnostics,
    });

    expect(result.valid).toBe(true);
    expect(mockDiagnostics.info).toHaveBeenCalledWith('validateResidentDrop:success', expect.any(Object));
  });

  it('should reject drop with missing required tags', () => {
    const weakResident = {
      ...mockResident,
      statTags: ['intelligence'], // Missing 'strength'
    };

    const result = validateResidentDrop({
      resident: weakResident,
      slotId: 'slot-1',
      activityId: 'test-activity',
      currentAssignments: {},
      config: mockConfig,
      diagnostics: mockDiagnostics,
    });

    expect(result.valid).toBe(false);
    expect(result.reason).toContain('Missing required tags');
    expect(mockDiagnostics.warn).toHaveBeenCalledWith('validateResidentDrop:missing-required-tags', expect.any(Object));
  });

  it('should reject drop when fatigue exceeds threshold', () => {
    const tiredResident = {
      ...mockResident,
      fatigue: 90, // Above threshold of 80
    };

    const result = validateResidentDrop({
      resident: tiredResident,
      slotId: 'slot-1',
      activityId: 'test-activity',
      currentAssignments: {},
      config: mockConfig,
      diagnostics: mockDiagnostics,
    });

    expect(result.valid).toBe(false);
    expect(result.reason).toContain('Fatigue 90 exceeds threshold 80');
    expect(mockDiagnostics.warn).toHaveBeenCalledWith('validateResidentDrop:fatigue-exceeded', expect.any(Object));
  });

  it('should reject drop when crew limit is reached', () => {
    const result = validateResidentDrop({
      resident: mockResident,
      slotId: 'slot-1',
      activityId: 'test-activity',
      currentAssignments: {
        'slot-2': 'other-resident-1',
        'slot-3': 'other-resident-2', // Crew limit of 2 reached
      },
      config: mockConfig,
      diagnostics: mockDiagnostics,
    });

    expect(result.valid).toBe(false);
    expect(result.reason).toContain('Crew limit 2 reached');
    expect(mockDiagnostics.warn).toHaveBeenCalledWith('validateResidentDrop:crew-limit-reached', expect.any(Object));
  });

  it('should allow re-drop on already assigned slot', () => {
    const result = validateResidentDrop({
      resident: mockResident,
      slotId: 'slot-1',
      activityId: 'test-activity',
      currentAssignments: {
        'slot-1': 'resident-1', // Already assigned
      },
      config: mockConfig,
      diagnostics: mockDiagnostics,
    });

    expect(result.valid).toBe(true);
    expect(mockDiagnostics.info).toHaveBeenCalledWith('validateResidentDrop:already-assigned', expect.any(Object));
  });

  it('should reject drop when resident assigned elsewhere', () => {
    const result = validateResidentDrop({
      resident: mockResident,
      slotId: 'slot-2',
      activityId: 'test-activity',
      currentAssignments: {
        'slot-1': 'resident-1', // Assigned to different slot
      },
      config: mockConfig,
      diagnostics: mockDiagnostics,
    });

    expect(result.valid).toBe(false);
    expect(result.reason).toContain('already assigned to another activity');
    expect(mockDiagnostics.warn).toHaveBeenCalledWith('validateResidentDrop:already-assigned-elsewhere', expect.any(Object));
  });

  it('should handle invasion-aware validation with no rules', () => {
    const result = validateResidentDrop({
      resident: mockResident,
      slotId: 'slot-1',
      activityId: 'test-activity',
      currentAssignments: {},
      config: mockConfig,
      diagnostics: mockDiagnostics,
      invasionType: 'unknown-invasion',
    });

    expect(result.valid).toBe(true);
    expect(mockDiagnostics.debug).toHaveBeenCalledWith('validateInvasionRequirements:no-rules', expect.any(Object));
  });

  it('should handle invasion-aware validation with forbidden tags', () => {
    const invasionConfig = {
      ...mockConfig,
      global: {
        invasionRules: {
          'undead-invasion': {
            forbiddenTags: ['holy'],
          },
        },
      },
    } as IdleVillageConfig;

    const holyResident = {
      ...mockResident,
      statTags: ['holy', 'strength'],
    };

    const result = validateResidentDrop({
      resident: holyResident,
      slotId: 'slot-1',
      activityId: 'test-activity',
      currentAssignments: {},
      config: invasionConfig,
      diagnostics: mockDiagnostics,
      invasionType: 'undead-invasion',
    });

    expect(result.valid).toBe(false);
    expect(result.reason).toContain('tag forbidden during undead-invasion');
  });

  it('should emit telemetry events when enabled', () => {
    // Clear previous events
    mockWindow.__sandboxTelemetry.events = [];

    validateResidentDrop({
      resident: mockResident,
      slotId: 'slot-1',
      activityId: 'test-activity',
      currentAssignments: {},
      config: mockConfig,
      diagnostics: mockDiagnostics,
      enableTelemetry: true,
    });

    expect(mockWindow.__sandboxTelemetry.events).toHaveLength(1);
    expect(mockWindow.__sandboxTelemetry.events[0]).toMatchObject({
      type: 'assignment_success',
      slotId: 'slot-1',
      residentId: 'resident-1',
    });
  });

  it('should not emit telemetry events when disabled', () => {
    // Clear previous events
    mockWindow.__sandboxTelemetry.events = [];

    validateResidentDrop({
      resident: mockResident,
      slotId: 'slot-1',
      activityId: 'test-activity',
      currentAssignments: {},
      config: mockConfig,
      diagnostics: mockDiagnostics,
      enableTelemetry: false,
    });

    expect(mockWindow.__sandboxTelemetry.events).toHaveLength(0);
  });

  it('should handle activity not found error', () => {
    const result = validateResidentDrop({
      resident: mockResident,
      slotId: 'slot-1',
      activityId: 'non-existent-activity',
      currentAssignments: {},
      config: mockConfig,
      diagnostics: mockDiagnostics,
    });

    expect(result.valid).toBe(false);
    expect(result.reason).toContain('Activity non-existent-activity not found in config');
    expect(mockDiagnostics.warn).toHaveBeenCalledWith('validateResidentDrop:activity-not-found', expect.any(Object));
  });

  it('should measure performance and include in diagnostics', () => {
    validateResidentDrop({
      resident: mockResident,
      slotId: 'slot-1',
      activityId: 'test-activity',
      currentAssignments: {},
      config: mockConfig,
      diagnostics: mockDiagnostics,
    });

    // Check that duration is tracked in diagnostics calls
    expect(mockDiagnostics.debug).toHaveBeenCalledWith('validateResidentDrop:start', expect.any(Object));
    expect(mockDiagnostics.info).toHaveBeenCalledWith('validateResidentDrop:success', expect.any(Object));
    
    // Get the actual calls and check duration property
    const debugCall = mockDiagnostics.debug.mock.calls.find((call: [string, Record<string, unknown>]) => call[0] === 'validateResidentDrop:start');
    const infoCall = mockDiagnostics.info.mock.calls.find((call: [string, Record<string, unknown>]) => call[0] === 'validateResidentDrop:success');
    
    expect(debugCall).toBeDefined();
    expect(infoCall).toBeDefined();
    expect(infoCall?.[1]).toHaveProperty('duration');
    expect(typeof infoCall?.[1]?.duration).toBe('number');
  });
});
