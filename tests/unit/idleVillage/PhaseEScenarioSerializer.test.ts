/**
 * NP-146 – Phase E Scenario Exporter Unit Tests
 * 
 * Comprehensive test suite for Phase E scenario serializer,
 * CLI functionality, and export validation.
 * 
 * @since 2026-01-14
 * @author Cascade
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import type {
  PhaseEScenario,
  PhaseEResidentSnapshot,
  PhaseESlotConfig,
  PhaseETagConfig,
  PhaseEDropFeedbackConfig,
  PhaseEQuestTimelineTick,
  PhaseEScenarioExportedTelemetryPayload,
} from '@/balancing/idleVillage/PhaseEScenarioSerializer';
import {
  validatePhaseEScenario,
  createPhaseEScenario,
  serializePhaseEScenario,
  deserializePhaseEScenario,
  createResidentSnapshot,
  createSlotConfig,
  createDropFeedbackConfig,
  createQuestTimelineTick,
  phaseEScenarioToMarkdown,
  createPhaseEScenarioExportedTelemetry,
} from '@/balancing/idleVillage/PhaseEScenarioSerializer';
import type { ResidentState } from '@/engine/game/idleVillage/TimeEngine';
import type { ActivityDefinition } from '@/balancing/config/idleVillage/types';

// Mock telemetry
vi.mock('@/analytics/telemetry/telemetryProvider', () => ({
  trackTelemetryEvent: vi.fn(),
}));

describe('PhaseEScenarioSerializer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Schema Validation', () => {
    it('should validate a complete Phase E scenario', () => {
      const scenario = createPhaseEScenario({
        name: 'Test Scenario',
        description: 'A test scenario for validation',
        residents: [
          {
            id: 'resident-1',
            name: 'Test Resident',
            status: 'available',
            fatigue: 25,
            hp: 80,
            maxHp: 100,
            statTags: ['strength', 'perception'],
            isHero: false,
            isInjured: false,
            survivalCount: 0,
            survivalScore: 0,
          },
        ],
        slots: [
          {
            id: 'slot-1',
            activityId: 'forest-work',
            name: 'Forest Work',
            slotTags: ['village_job'],
            maxCrew: 2,
            currentOccupants: 0,
            statRequirements: {
              allOf: ['strength'],
            },
            isLocked: false,
          },
        ],
        tagDefinitions: [
          {
            id: 'job',
            name: 'Job',
            category: 'activity_type',
            color: '#3b82f6',
          },
        ],
      });

      expect(() => validatePhaseEScenario(scenario)).not.toThrow();
    });

    it('should reject invalid scenario data', () => {
      const invalidScenario = {
        // Missing required fields
        id: 'invalid-scenario',
        name: '',
        // Missing generatedAt, residents, slots, etc.
      };

      expect(() => validatePhaseEScenario(invalidScenario)).toThrow();
    });

    it('should reject resident with invalid fatigue', () => {
      const invalidResident = {
        id: 'resident-1',
        name: 'Invalid Resident',
        status: 'available' as const,
        fatigue: 150, // Invalid: > 100
        hp: 80,
        maxHp: 100,
        statTags: [],
        isHero: false,
        isInjured: false,
        survivalCount: 0,
        survivalScore: 0,
      };

      const scenario = createPhaseEScenario({
        residents: [invalidResident],
      });

      expect(() => validatePhaseEScenario(scenario)).toThrow();
    });

    it('should reject slot with negative crew capacity', () => {
      const invalidSlot = {
        id: 'slot-1',
        activityId: 'forest-work',
        name: 'Forest Work',
        slotTags: ['village_job'],
        maxCrew: -1, // Invalid: < 1
        currentOccupants: 0,
        isLocked: false,
      };

      const scenario = createPhaseEScenario({
        slots: [invalidSlot],
      });

      expect(() => validatePhaseEScenario(scenario)).toThrow();
    });
  });

  describe('Scenario Creation', () => {
    it('should create a minimal valid scenario', () => {
      const scenario = createPhaseEScenario();

      expect(scenario.id).toMatch(/^phase-e-scenario-\d+-[a-z0-9]+$/);
      expect(scenario.name).toBe('New Phase E Scenario');
      expect(scenario.description).toBe('A new Phase E scenario for testing');
      expect(scenario.schemaVersion).toBe('1.0.0');
      expect(scenario.author).toBe('system');
      expect(scenario.residents).toEqual([]);
      expect(scenario.slots).toEqual([]);
      expect(scenario.tagDefinitions).toEqual([]);
      expect(scenario.metadata.difficulty).toBe('beginner');
      expect(scenario.metadata.exportSource).toBe('manual');
    });

    it('should create scenario with overrides', () => {
      const overrides = {
        name: 'Custom Scenario',
        description: 'Custom description',
        author: 'test-author',
        tags: ['test', 'custom'],
        metadata: {
          difficulty: 'expert' as const,
          estimatedRuntimeMinutes: 30,
        },
      };

      const scenario = createPhaseEScenario(overrides);

      expect(scenario.name).toBe('Custom Scenario');
      expect(scenario.description).toBe('Custom description');
      expect(scenario.author).toBe('test-author');
      expect(scenario.tags).toEqual(['test', 'custom']);
      expect(scenario.metadata.difficulty).toBe('expert');
      expect(scenario.metadata.estimatedRuntimeMinutes).toBe(30);
    });
  });

  describe('Resident Snapshot Creation', () => {
    const mockResident: ResidentState = {
      id: 'resident-1',
      status: 'available',
      fatigue: 25,
      currentHp: 80,
      maxHp: 100,
      statTags: ['strength', 'perception'],
      isHero: false,
      isInjured: false,
      survivalCount: 5,
      survivalScore: 75,
    } as ResidentState;

    it('should create resident snapshot from ResidentState', () => {
      const snapshot = createResidentSnapshot(mockResident);

      expect(snapshot.id).toBe('resident-1');
      expect(snapshot.name).toBe('resident-1');
      expect(snapshot.status).toBe('available');
      expect(snapshot.fatigue).toBe(25);
      expect(snapshot.hp).toBe(80);
      expect(snapshot.maxHp).toBe(100);
      expect(snapshot.statTags).toEqual(['strength', 'perception']);
      expect(snapshot.isHero).toBe(false);
      expect(snapshot.isInjured).toBe(false);
      expect(snapshot.survivalCount).toBe(5);
      expect(snapshot.survivalScore).toBe(75);
    });

    it('should apply overrides to resident snapshot', () => {
      const overrides = {
        name: 'Custom Resident',
        fatigue: 50,
        isHero: true,
      };

      const snapshot = createResidentSnapshot(mockResident, overrides);

      expect(snapshot.name).toBe('Custom Resident');
      expect(snapshot.fatigue).toBe(50);
      expect(snapshot.isHero).toBe(true);
      // Other fields should remain unchanged
      expect(snapshot.id).toBe('resident-1');
      expect(snapshot.status).toBe('available');
    });
  });

  describe('Slot Config Creation', () => {
    const mockActivity: ActivityDefinition = {
      id: 'forest-work',
      label: 'Forest Work',
      tags: ['job'],
      slotTags: ['village_job', 'outdoor'],
      resolutionEngineId: 'job',
      dangerRating: 0.3,
      statRequirement: {
        allOf: ['strength'],
        anyOf: ['perception', 'agility'],
        noneOf: ['injured'],
      },
    } as ActivityDefinition;

    it('should create slot config from ActivityDefinition', () => {
      const slotConfig = createSlotConfig(mockActivity);

      expect(slotConfig.id).toBe('forest-work');
      expect(slotConfig.activityId).toBe('forest-work');
      expect(slotConfig.name).toBe('Forest Work');
      expect(slotConfig.slotTags).toEqual(['village_job', 'outdoor']);
      expect(slotConfig.maxCrew).toBe(1);
      expect(slotConfig.currentOccupants).toBe(0);
      expect(slotConfig.statRequirements).toEqual({
        allOf: ['strength'],
        anyOf: ['perception', 'agility'],
        noneOf: ['injured'],
      });
      expect(slotConfig.isLocked).toBe(false);
    });

    it('should apply overrides to slot config', () => {
      const overrides = {
        maxCrew: 3,
        currentOccupants: 2,
        isLocked: true,
      };

      const slotConfig = createSlotConfig(mockActivity, 2, overrides);

      expect(slotConfig.maxCrew).toBe(3);
      expect(slotConfig.currentOccupants).toBe(2);
      expect(slotConfig.isLocked).toBe(true);
    });
  });

  describe('Serialization', () => {
    it('should serialize scenario to JSON string', () => {
      const scenario = createPhaseEScenario({
        name: 'Test Scenario',
        residents: [
          {
            id: 'resident-1',
            name: 'Test Resident',
            status: 'available',
            fatigue: 25,
            hp: 80,
            maxHp: 100,
            statTags: ['strength'],
            isHero: false,
            isInjured: false,
            survivalCount: 0,
            survivalScore: 0,
          },
        ],
      });

      const json = serializePhaseEScenario(scenario);
      const parsed = JSON.parse(json);

      expect(parsed.name).toBe('Test Scenario');
      expect(parsed.residents).toHaveLength(1);
      expect(parsed.residents[0].id).toBe('resident-1');
    });

    it('should deserialize JSON to Phase E scenario', () => {
      const originalScenario = createPhaseEScenario({
        name: 'Test Scenario',
        residents: [
          {
            id: 'resident-1',
            name: 'Test Resident',
            status: 'available',
            fatigue: 25,
            hp: 80,
            maxHp: 100,
            statTags: ['strength'],
            isHero: false,
            isInjured: false,
            survivalCount: 0,
            survivalScore: 0,
          },
        ],
      });

      const json = serializePhaseEScenario(originalScenario);
      const deserialized = deserializePhaseEScenario(json);

      expect(deserialized.name).toBe(originalScenario.name);
      expect(deserialized.residents).toHaveLength(1);
      expect(deserialized.residents[0].id).toBe('resident-1');
      expect(deserialized.schemaVersion).toBe(originalScenario.schemaVersion);
    });

    it('should throw on invalid JSON during deserialization', () => {
      const invalidJson = '{ "invalid": json}';

      expect(() => deserializePhaseEScenario(invalidJson)).toThrow();
    });
  });

  describe('Markdown Export', () => {
    it('should convert scenario to Markdown format', () => {
      const scenario = createPhaseEScenario({
        name: 'Test Scenario',
        description: 'A test scenario for Markdown export',
        residents: [
          {
            id: 'resident-1',
            name: 'Test Resident',
            status: 'available',
            fatigue: 25,
            hp: 80,
            maxHp: 100,
            statTags: ['strength', 'perception'],
            isHero: false,
            isInjured: false,
            survivalCount: 0,
            survivalScore: 0,
          },
        ],
        slots: [
          {
            id: 'slot-1',
            activityId: 'forest-work',
            name: 'Forest Work',
            slotTags: ['village_job'],
            maxCrew: 2,
            currentOccupants: 1,
            statRequirements: {
              allOf: ['strength'],
            },
            isLocked: false,
          },
        ],
        tagDefinitions: [
          {
            id: 'job',
            name: 'Job',
            category: 'activity_type',
            color: '#3b82f6',
            description: 'Job activities',
          },
        ],
        dropFeedbackConfigs: [
          {
            slotId: 'slot-1',
            dropState: 'valid',
            compatibilityScore: 0.85,
            validationResults: {
              statRequirements: true,
              fatigueThreshold: true,
              crewCapacity: true,
              tagCompatibility: true,
              phaseLock: false,
            },
            lastValidatedAt: Date.now(),
          },
        ],
        questTimelineTicks: [
          {
            tick: 10,
            questId: 'quest-1',
            questName: 'Test Quest',
            status: 'active',
            progress: 0.5,
            priority: 'normal',
            questType: 'side',
            timeRemainingTicks: 50,
            participatingResidents: ['resident-1'],
          },
        ],
        metadata: {
          difficulty: 'intermediate',
          estimatedRuntimeMinutes: 10,
          filterCriteria: {
            fatigueMin: 20,
            fatigueMax: 80,
          },
        },
      });

      const markdown = phaseEScenarioToMarkdown(scenario);

      expect(markdown).toContain('# Test Scenario');
      expect(markdown).toContain('**Description:** A test scenario for Markdown export');
      expect(markdown).toContain('## Residents (1)');
      expect(markdown).toContain('| resident-1 | Test Resident | available | 25% | 80/100 | strength, perception |');
      expect(markdown).toContain('## Slots (1)');
      expect(markdown).toContain('| slot-1 | Forest Work | 1/2 | 2 | ✓ | village_job |');
      expect(markdown).toContain('## Tag Definitions (1)');
      expect(markdown).toContain('- **Job** (job) - activity_type: Job activities');
      expect(markdown).toContain('## Filter Criteria Used for Export');
      expect(markdown).toContain('- **Fatigue Min:** 20%');
      expect(markdown).toContain('- **Fatigue Max:** 80%');
    });

    it('should handle empty scenario in Markdown', () => {
      const emptyScenario = createPhaseEScenario();
      const markdown = phaseEScenarioToMarkdown(emptyScenario);

      expect(markdown).toContain('# New Phase E Scenario');
      expect(markdown).toContain('## Residents (0)');
      expect(markdown).toContain('No residents in this scenario.');
      expect(markdown).toContain('## Slots (0)');
      expect(markdown).toContain('No slots in this scenario.');
    });
  });

  describe('Telemetry', () => {
    it('should create telemetry payload for scenario export', () => {
      const scenario = createPhaseEScenario({
        name: 'Test Scenario',
        residents: [
          {
            id: 'resident-1',
            name: 'Test Resident',
            status: 'available',
            fatigue: 25,
            hp: 80,
            maxHp: 100,
            statTags: ['strength'],
            isHero: false,
            isInjured: false,
            survivalCount: 0,
            survivalScore: 0,
          },
        ],
        slots: [
          {
            id: 'slot-1',
            activityId: 'forest-work',
            name: 'Forest Work',
            slotTags: ['village_job'],
            maxCrew: 2,
            currentOccupants: 1,
            statRequirements: {
              allOf: ['strength'],
            },
            isLocked: false,
          },
        ],
        dropFeedbackConfigs: [
          {
            slotId: 'slot-1',
            dropState: 'valid',
            compatibilityScore: 0.85,
            validationResults: {
              statRequirements: true,
              fatigueThreshold: true,
              crewCapacity: true,
              tagCompatibility: true,
              phaseLock: false,
            },
            lastValidatedAt: Date.now(),
          },
        ],
        questTimelineTicks: [
          {
            tick: 10,
            questId: 'quest-1',
            questName: 'Test Quest',
            status: 'active',
            progress: 0.5,
            priority: 'normal',
            questType: 'side',
            timeRemainingTicks: 50,
            participatingResidents: ['resident-1'],
          },
        ],
        metadata: {
          difficulty: 'intermediate',
          estimatedRuntimeMinutes: 10,
          filterCriteria: {
            crewIds: ['resident-1'],
            tagFilters: ['job'],
            fatigueMin: 20,
            fatigueMax: 80,
          },
        },
      });

      const payload = createPhaseEScenarioExportedTelemetry(scenario, 'json', 150, 2048);

      expect(payload.eventType).toBe('phase_e_scenario_exported');
      expect(payload.scenarioId).toBe(scenario.id);
      expect(payload.format).toBe('json');
      expect(payload.exportSource).toBe(scenario.metadata.exportSource);
      expect(payload.filterCriteria.crewIds).toEqual(['resident-1']);
      expect(payload.filterCriteria.tagFilters).toEqual(['job']);
      expect(payload.filterCriteria.fatigueMin).toBe(20);
      expect(payload.filterCriteria.fatigueMax).toBe(80);
      expect(payload.exportStats.residentCount).toBe(1);
      expect(payload.exportStats.slotCount).toBe(1);
      expect(payload.exportStats.tagCount).toBe(0);
      expect(payload.exportStats.dropFeedbackConfigCount).toBe(1);
      expect(payload.exportStats.questTimelineTickCount).toBe(1);
      expect(payload.exportStats.fileSizeBytes).toBe(2048);
      expect(payload.exportStats.exportDurationMs).toBe(150);
      expect(payload.metadata.difficulty).toBe('intermediate');
      expect(payload.metadata.estimatedRuntimeMinutes).toBe(10);
    });

    it('should create telemetry payload for Markdown export', () => {
      const scenario = createPhaseEScenario();
      const payload = createPhaseEScenarioExportedTelemetry(scenario, 'markdown', 100);

      expect(payload.format).toBe('markdown');
      expect(payload.exportStats.exportDurationMs).toBe(100);
    });
  });

  describe('Drop Feedback Config Creation', () => {
    it('should create drop feedback config', () => {
      const config = createDropFeedbackConfig(
        'slot-1',
        'valid',
        0.85,
        {
          statRequirements: true,
          fatigueThreshold: true,
          crewCapacity: true,
          tagCompatibility: true,
          phaseLock: false,
        }
      );

      expect(config.slotId).toBe('slot-1');
      expect(config.dropState).toBe('valid');
      expect(config.compatibilityScore).toBe(0.85);
      expect(config.validationResults.statRequirements).toBe(true);
      expect(config.validationResults.fatigueThreshold).toBe(true);
      expect(config.validationResults.crewCapacity).toBe(true);
      expect(config.validationResults.tagCompatibility).toBe(true);
      expect(config.validationResults.phaseLock).toBe(false);
      expect(config.lastValidatedAt).toBeGreaterThan(0);
    });

    it('should apply overrides to drop feedback config', () => {
      const overrides = {
        dropState: 'invalid' as const,
        validationMessage: 'Invalid assignment',
        compatibilityScore: 0.2,
      };

      const config = createDropFeedbackConfig(
        'slot-1',
        'valid',
        0.85,
        {
          statRequirements: false,
          fatigueThreshold: false,
          crewCapacity: false,
          tagCompatibility: false,
          phaseLock: true,
        },
        overrides
      );

      expect(config.dropState).toBe('invalid');
      expect(config.validationMessage).toBe('Invalid assignment');
      expect(config.compatibilityScore).toBe(0.2);
      expect(config.slotId).toBe('slot-1'); // Should remain unchanged
    });
  });

  describe('Quest Timeline Tick Creation', () => {
    it('should create quest timeline tick', () => {
      const tick = createQuestTimelineTick(
        10,
        'quest-1',
        'Test Quest',
        'active',
        0.5
      );

      expect(tick.tick).toBe(10);
      expect(tick.questId).toBe('quest-1');
      expect(tick.questName).toBe('Test Quest');
      expect(tick.status).toBe('active');
      expect(tick.progress).toBe(0.5);
      expect(tick.priority).toBe('normal');
      expect(tick.questType).toBe('side');
      expect(tick.timeRemainingTicks).toBe(100);
      expect(tick.participatingResidents).toEqual([]);
    });

    it('should apply overrides to quest timeline tick', () => {
      const overrides = {
        priority: 'critical' as const,
        questType: 'main' as const,
        timeRemainingTicks: 25,
        participatingResidents: ['resident-1', 'resident-2'],
      };

      const tick = createQuestTimelineTick(
        10,
        'quest-1',
        'Test Quest',
        'active',
        0.5,
        overrides
      );

      expect(tick.priority).toBe('critical');
      expect(tick.questType).toBe('main');
      expect(tick.timeRemainingTicks).toBe(25);
      expect(tick.participatingResidents).toEqual(['resident-1', 'resident-2']);
      expect(tick.tick).toBe(10); // Should remain unchanged
    });
  });

  describe('Edge Cases', () => {
    it('should handle scenario with no stat requirements', () => {
      const slotWithoutRequirements = {
        id: 'slot-1',
        activityId: 'simple-work',
        name: 'Simple Work',
        slotTags: ['village_job'],
        maxCrew: 1,
        currentOccupants: 0,
        isLocked: false,
      };

      const scenario = createPhaseEScenario({
        slots: [slotWithoutRequirements],
      });

      expect(() => validatePhaseEScenario(scenario)).not.toThrow();
      expect(scenario.slots[0].statRequirements).toBeUndefined();
    });

    it('should handle resident with no stat snapshot', () => {
      const residentWithoutSnapshot = {
        id: 'resident-1',
        name: 'Simple Resident',
        status: 'available',
        fatigue: 10,
        hp: 90,
        maxHp: 100,
        statTags: [],
        isHero: false,
        isInjured: false,
        survivalCount: 0,
        survivalScore: 0,
      };

      const scenario = createPhaseEScenario({
        residents: [residentWithoutSnapshot],
      });

      expect(() => validatePhaseEScenario(scenario)).not.toThrow();
      expect(scenario.residents[0].statSnapshot).toBeUndefined();
    });

    it('should handle scenario with no filter criteria', () => {
      const scenario = createPhaseEScenario({
        metadata: {
          difficulty: 'beginner',
          estimatedRuntimeMinutes: 5,
          requiredFeatures: [],
          compatibilityVersion: '1.0.0',
          exportSource: 'manual',
        },
      });

      expect(() => validatePhaseEScenario(scenario)).not.toThrow();
      expect(scenario.metadata.filterCriteria).toBeUndefined();
    });
  });
});
