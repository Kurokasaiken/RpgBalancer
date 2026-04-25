/**
 * NP-146 – Idle Village Phase E Scenario Exporter
 * 
 * Tick-based scenario serializer with Zod validation for Phase E
 * resident/slot/tag scenarios. Supports versioning, telemetry,
 * and export to JSON/Markdown with filters.
 * 
 * @since 2026-01-14
 * @author Cascade
 */

import { z } from 'zod';
import type { 
  ResidentState
} from '@/engine/game/idleVillage/TimeEngine';
import type { ActivityDefinition } from '@/balancing/config/idleVillage/types';

// === Core Schema Definitions ===

/**
 * Snapshot of a resident at a specific tick for Phase E scenarios.
 */
export const PhaseEResidentSnapshotSchema = z.object({
  /** Unique resident identifier */
  id: z.string(),
  /** Resident display name */
  name: z.string(),
  /** Current status (available, away, exhausted, injured, dead) */
  status: z.enum(['available', 'away', 'exhausted', 'injured', 'dead']),
  /** Current fatigue percentage (0-100) */
  fatigue: z.number().min(0).max(100),
  /** Current HP and max HP */
  hp: z.number().min(0),
  maxHp: z.number().min(0),
  /** Stat tags for validation (strength, perception, etc.) */
  statTags: z.array(z.string()),
  /** Whether resident is a hero */
  isHero: z.boolean(),
  /** Whether resident is injured */
  isInjured: z.boolean(),
  /** Survival statistics */
  survivalCount: z.number().min(0),
  survivalScore: z.number().min(0),
  /** Optional stat snapshot with detailed values */
  statSnapshot: z.record(z.number()).optional(),
});

/**
 * Configuration for an activity slot in Phase E scenarios.
 */
export const PhaseESlotConfigSchema = z.object({
  /** Unique slot identifier */
  id: z.string(),
  /** Activity definition reference */
  activityId: z.string(),
  /** Slot display name */
  name: z.string(),
  /** Slot tags for filtering (village_job, forest_work, etc.) */
  slotTags: z.array(z.string()),
  /** Maximum crew capacity */
  maxCrew: z.number().min(1),
  /** Current occupants */
  currentOccupants: z.number().min(0),
  /** Stat requirements for assignment */
  statRequirements: z.object({
    allOf: z.array(z.string()).optional(),
    anyOf: z.array(z.string()).optional(),
    noneOf: z.array(z.string()).optional(),
  }).optional(),
  /** Whether slot is currently locked */
  isLocked: z.boolean(),
  /** Location on map (x, y coordinates) */
  location: z.object({
    x: z.number(),
    y: z.number(),
  }).optional(),
});

/**
 * Tag configuration for Phase E scenario filtering.
 */
export const PhaseETagConfigSchema = z.object({
  /** Tag identifier */
  id: z.string(),
  /** Tag display name */
  name: z.string(),
  /** Tag category (job, location, resident_type, etc.) */
  category: z.string(),
  /** Tag color for UI display */
  color: z.string().optional(),
  /** Tag description */
  description: z.string().optional(),
});

/**
 * Drop feedback configuration for Phase E scenarios.
 */
export const PhaseEDropFeedbackConfigSchema = z.object({
  /** Slot identifier */
  slotId: z.string(),
  /** Drop feedback state */
  dropState: z.enum(['valid', 'invalid', 'warning', 'neutral']),
  /** Validation message */
  validationMessage: z.string().optional(),
  /** Compatibility score (0-1) */
  compatibilityScore: z.number().min(0).max(1),
  /** Applied visual feedback */
  visualFeedback: z.object({
    highlightColor: z.string().optional(),
    borderColor: z.string().optional(),
    backgroundColor: z.string().optional(),
    icon: z.string().optional(),
  }).optional(),
  /** Validation criteria results */
  validationResults: z.object({
    statRequirements: z.boolean(),
    fatigueThreshold: z.boolean(),
    crewCapacity: z.boolean(),
    tagCompatibility: z.boolean(),
    phaseLock: z.boolean(),
  }),
  /** Timestamp of last validation */
  lastValidatedAt: z.number(),
});

/**
 * Quest timeline tick for Phase E scenarios.
 */
export const PhaseEQuestTimelineTickSchema = z.object({
  /** Tick number */
  tick: z.number().min(0),
  /** Quest identifier */
  questId: z.string(),
  /** Quest name */
  questName: z.string(),
  /** Quest status at this tick */
  status: z.enum(['pending', 'active', 'completed', 'failed', 'expired']),
  /** Quest progress (0-1) */
  progress: z.number().min(0).max(1),
  /** Quest priority */
  priority: z.enum(['low', 'normal', 'high', 'critical']),
  /** Quest type */
  questType: z.enum(['main', 'side', 'daily', 'weekly', 'special']),
  /** Time remaining in ticks */
  timeRemainingTicks: z.number().min(0),
  /** Required resources */
  requiredResources: z.record(z.number()).optional(),
  /** Rewards offered */
  rewards: z.record(z.number()).optional(),
  /** Participating residents */
  participatingResidents: z.array(z.string()),
  /** Quest location on map */
  location: z.object({
    x: z.number(),
    y: z.number(),
  }).optional(),
  /** Additional quest metadata */
  metadata: z.record(z.unknown()).optional(),
});

/**
 * Complete Phase E scenario definition.
 */
export const PhaseEScenarioSchema = z.object({
  /** Schema version for compatibility */
  schemaVersion: z.string().default('1.0.0'),
  /** Unique scenario identifier */
  id: z.string(),
  /** Human-readable scenario name */
  name: z.string(),
  /** Scenario description */
  description: z.string(),
  /** Generation timestamp */
  generatedAt: z.number(),
  /** Author/creator */
  author: z.string().default('system'),
  /** Scenario tags for categorization */
  tags: z.array(z.string()),
  
  /** Village time tick for this scenario */
  tick: z.object({
    /** Current tick number */
    current: z.number().min(0),
    /** Total ticks simulated */
    total: z.number().min(0),
    /** Tick duration in milliseconds */
    durationMs: z.number().min(1),
  }),
  
  /** Resident snapshots */
  residents: z.array(PhaseEResidentSnapshotSchema),
  
  /** Slot configurations */
  slots: z.array(PhaseESlotConfigSchema),
  
  /** Tag definitions */
  tagDefinitions: z.array(PhaseETagConfigSchema),
  
  /** Drop feedback configurations */
  dropFeedbackConfigs: z.array(PhaseEDropFeedbackConfigSchema),
  
  /** Quest timeline ticks */
  questTimelineTicks: z.array(PhaseEQuestTimelineTickSchema),
  
  /** Scenario metadata */
  metadata: z.object({
    /** Scenario difficulty level */
    difficulty: z.enum(['beginner', 'intermediate', 'advanced', 'expert']),
    /** Estimated runtime in minutes */
    estimatedRuntimeMinutes: z.number().min(0),
    /** Required features */
    requiredFeatures: z.array(z.string()),
    /** Compatibility version */
    compatibilityVersion: z.string(),
    /** Export source (manual, auto, test) */
    exportSource: z.enum(['manual', 'auto', 'test']),
    /** Filter criteria used for export */
    filterCriteria: z.object({
      crewIds: z.array(z.string()).optional(),
      tagFilters: z.array(z.string()).optional(),
      fatigueMin: z.number().min(0).max(100).optional(),
      fatigueMax: z.number().min(0).max(100).optional(),
      includeLockedSlots: z.boolean().default(false),
    }).optional(),
  }),
});

// === Type Exports ===

export type PhaseEResidentSnapshot = z.infer<typeof PhaseEResidentSnapshotSchema>;
export type PhaseESlotConfig = z.infer<typeof PhaseESlotConfigSchema>;
export type PhaseETagConfig = z.infer<typeof PhaseETagConfigSchema>;
export type PhaseEDropFeedbackConfig = z.infer<typeof PhaseEDropFeedbackConfigSchema>;
export type PhaseEQuestTimelineTick = z.infer<typeof PhaseEQuestTimelineTickSchema>;
export type PhaseEScenario = z.infer<typeof PhaseEScenarioSchema>;

// === Serialization Functions ===

/**
 * Validates a Phase E scenario object against the schema.
 */
export function validatePhaseEScenario(data: unknown): PhaseEScenario {
  return PhaseEScenarioSchema.parse(data);
}

/**
 * Creates a minimal valid Phase E scenario with required fields.
 */
export function createPhaseEScenario(overrides: Partial<PhaseEScenario> = {}): PhaseEScenario {
  const now = Date.now();
  return {
    schemaVersion: '1.0.0',
    id: `phase-e-scenario-${now}-${Math.random().toString(36).substr(2, 9)}`,
    name: 'New Phase E Scenario',
    description: 'A new Phase E scenario for testing',
    generatedAt: now,
    author: 'system',
    tags: [],
    tick: {
      current: 0,
      total: 100,
      durationMs: 1000,
    },
    residents: [],
    slots: [],
    tagDefinitions: [],
    dropFeedbackConfigs: [],
    questTimelineTicks: [],
    metadata: {
      difficulty: 'beginner',
      estimatedRuntimeMinutes: 5,
      requiredFeatures: [],
      compatibilityVersion: '1.0.0',
      exportSource: 'manual',
    },
    ...overrides,
  };
}

/**
 * Serializes a Phase E scenario to JSON string with formatting.
 */
export function serializePhaseEScenario(scenario: PhaseEScenario): string {
  return JSON.stringify(scenario, null, 2);
}

/**
 * Deserializes a JSON string to Phase E scenario with validation.
 */
export function deserializePhaseEScenario(json: string): PhaseEScenario {
  const data = JSON.parse(json);
  return validatePhaseEScenario(data);
}

/**
 * Creates a resident snapshot from a ResidentState.
 */
export function createResidentSnapshot(
  resident: ResidentState,
  overrides: Partial<PhaseEResidentSnapshot> = {}
): PhaseEResidentSnapshot {
  return {
    id: resident.id,
    name: resident.id, // Could be enhanced with display name
    status: resident.status,
    fatigue: resident.fatigue,
    hp: resident.currentHp,
    maxHp: resident.maxHp,
    statTags: resident.statTags || [],
    isHero: resident.isHero,
    isInjured: resident.isInjured,
    survivalCount: resident.survivalCount || 0,
    survivalScore: resident.survivalScore || 0,
    statSnapshot: resident.statSnapshot,
    ...overrides,
  };
}

/**
 * Creates a slot config from an ActivityDefinition.
 */
export function createSlotConfig(
  activity: ActivityDefinition,
  currentOccupants: number = 0,
  overrides: Partial<PhaseESlotConfig> = {}
): PhaseESlotConfig {
  return {
    id: activity.id,
    activityId: activity.id,
    name: activity.label,
    slotTags: activity.slotTags || [],
    maxCrew: 1, // Default, could be configurable
    currentOccupants,
    statRequirements: activity.statRequirement ? {
      allOf: activity.statRequirement.allOf,
      anyOf: activity.statRequirement.anyOf,
      noneOf: activity.statRequirement.noneOf,
    } : undefined,
    isLocked: false,
    ...overrides,
  };
}

/**
 * Creates a drop feedback config.
 */
export function createDropFeedbackConfig(
  slotId: string,
  dropState: PhaseEDropFeedbackConfig['dropState'],
  compatibilityScore: number,
  validationResults: PhaseEDropFeedbackConfig['validationResults'],
  overrides: Partial<PhaseEDropFeedbackConfig> = {}
): PhaseEDropFeedbackConfig {
  return {
    slotId,
    dropState,
    validationMessage: undefined,
    compatibilityScore,
    visualFeedback: undefined,
    validationResults,
    lastValidatedAt: Date.now(),
    ...overrides,
  };
}

/**
 * Creates a quest timeline tick.
 */
export function createQuestTimelineTick(
  tick: number,
  questId: string,
  questName: string,
  status: PhaseEQuestTimelineTick['status'],
  progress: number,
  overrides: Partial<PhaseEQuestTimelineTick> = {}
): PhaseEQuestTimelineTick {
  return {
    tick,
    questId,
    questName,
    status,
    progress,
    priority: 'normal',
    questType: 'side',
    timeRemainingTicks: 100,
    requiredResources: undefined,
    rewards: undefined,
    participatingResidents: [],
    location: undefined,
    metadata: undefined,
    ...overrides,
  };
}

// === Export Utilities ===

/**
 * Prepares Phase E scenario for JSON export with metadata.
 */
export function preparePhaseEScenarioExport(scenario: PhaseEScenario): {
  scenario: PhaseEScenario;
  exportMetadata: {
    exportedAt: number;
    exportedBy: string;
    format: 'json';
    version: string;
  };
} {
  return {
    scenario,
    exportMetadata: {
      exportedAt: Date.now(),
      exportedBy: 'phase-e-scenario-exporter',
      format: 'json',
      version: '1.0.0',
    },
  };
}

/**
 * Converts Phase E scenario to Markdown format.
 */
export function phaseEScenarioToMarkdown(scenario: PhaseEScenario): string {
  const lines = [
    `# ${scenario.name}`,
    '',
    `**Description:** ${scenario.description}`,
    `**Generated:** ${new Date(scenario.generatedAt).toISOString()}`,
    `**Author:** ${scenario.author}`,
    `**Version:** ${scenario.schemaVersion}`,
    '',
    `## Scenario Metadata`,
    '',
    `- **Difficulty:** ${scenario.metadata.difficulty}`,
    `- **Estimated Runtime:** ${scenario.metadata.estimatedRuntimeMinutes} minutes`,
    `- **Tags:** ${scenario.tags.join(', ') || 'None'}`,
    `- **Export Source:** ${scenario.metadata.exportSource}`,
    '',
    `## Tick Information`,
    '',
    `- **Current Tick:** ${scenario.tick.current}`,
    `- **Total Ticks:** ${scenario.tick.total}`,
    `- **Duration:** ${scenario.tick.durationMs}ms`,
    '',
    `## Residents (${scenario.residents.length})`,
    '',
  ];

  if (scenario.residents.length > 0) {
    lines.push('| ID | Name | Status | Fatigue | HP | Tags |');
    lines.push('|----|------|--------|----------|----|------|');
    scenario.residents.forEach(resident => {
      lines.push(`| ${resident.id} | ${resident.name} | ${resident.status} | ${resident.fatigue}% | ${resident.hp}/${resident.maxHp} | ${resident.statTags.join(', ')} |`);
    });
    lines.push('');
  } else {
    lines.push('No residents in this scenario.', '');
  }

  lines.push(`## Slots (${scenario.slots.length})`, '');

  if (scenario.slots.length > 0) {
    lines.push('| ID | Activity | Crew | Max | Locked | Tags |');
    lines.push('|----|----------|------|-----|--------|------|');
    scenario.slots.forEach(slot => {
      const crewInfo = `${slot.currentOccupants}/${slot.maxCrew}`;
      const lockedInfo = slot.isLocked ? '🔒' : '✓';
      lines.push(`| ${slot.id} | ${slot.name} | ${crewInfo} | ${slot.maxCrew} | ${lockedInfo} | ${slot.slotTags.join(', ')} |`);
    });
    lines.push('');
  } else {
    lines.push('No slots in this scenario.', '');
  }

  lines.push(`## Drop Feedback Configs (${scenario.dropFeedbackConfigs.length})`, '');

  if (scenario.dropFeedbackConfigs.length > 0) {
    lines.push('| Slot ID | State | Compatibility | Validation Message |');
    lines.push('|---------|-------|---------------|-------------------|');
    scenario.dropFeedbackConfigs.forEach(config => {
      const stateIcon = config.dropState === 'valid' ? '✅' : config.dropState === 'invalid' ? '❌' : config.dropState === 'warning' ? '⚠️' : '➖';
      const compatibilityPct = `${(config.compatibilityScore * 100).toFixed(1)}%`;
      const message = config.validationMessage || 'No message';
      lines.push(`| ${config.slotId} | ${stateIcon} ${config.dropState} | ${compatibilityPct} | ${message} |`);
    });
    lines.push('');
  } else {
    lines.push('No drop feedback configs in this scenario.', '');
  }

  lines.push(`## Quest Timeline Ticks (${scenario.questTimelineTicks.length})`, '');

  if (scenario.questTimelineTicks.length > 0) {
    lines.push('| Tick | Quest | Status | Progress | Priority | Type | Time Remaining |');
    lines.push('|-----|-------|--------|----------|----------|------|----------------|');
    scenario.questTimelineTicks.forEach(tick => {
      const statusIcon = tick.status === 'completed' ? '✅' : tick.status === 'active' ? '🔄' : tick.status === 'failed' ? '❌' : tick.status === 'expired' ? '⏰' : '⏳';
      const progressPct = `${(tick.progress * 100).toFixed(1)}%`;
      lines.push(`| ${tick.tick} | ${tick.questName} | ${statusIcon} ${tick.status} | ${progressPct} | ${tick.priority} | ${tick.questType} | ${tick.timeRemainingTicks} |`);
    });
    lines.push('');
  } else {
    lines.push('No quest timeline ticks in this scenario.', '');
  }

  lines.push(`## Tag Definitions (${scenario.tagDefinitions.length})`, '');

  if (scenario.tagDefinitions.length > 0) {
    scenario.tagDefinitions.forEach(tag => {
      lines.push(`- **${tag.name}** (${tag.id}) - ${tag.category}: ${tag.description || 'No description'}`);
    });
    lines.push('');
  }

  if (scenario.metadata.filterCriteria) {
    lines.push('## Filter Criteria Used for Export', '');
    const fc = scenario.metadata.filterCriteria;
    if (fc.crewIds) lines.push(`- **Crew IDs:** ${fc.crewIds.join(', ')}`);
    if (fc.tagFilters) lines.push(`- **Tag Filters:** ${fc.tagFilters.join(', ')}`);
    if (fc.fatigueMin !== undefined) lines.push(`- **Fatigue Min:** ${fc.fatigueMin}%`);
    if (fc.fatigueMax !== undefined) lines.push(`- **Fatigue Max:** ${fc.fatigueMax}%`);
    lines.push(`- **Include Locked Slots:** ${fc.includeLockedSlots ? 'Yes' : 'No'}`);
    lines.push('');
  }

  lines.push('---', '');
  lines.push(`*Generated by Phase E Scenario Exporter v${scenario.schemaVersion}*`);

  return lines.join('\n');
}

// === Telemetry Payload ===

/**
 * Telemetry payload for phase_e_scenario_exported events.
 */
export interface PhaseEScenarioExportedTelemetryPayload {
  /** Event type */
  eventType: 'phase_e_scenario_exported';
  /** Timestamp */
  timestamp: number;
  /** Scenario ID */
  scenarioId: string;
  /** Export format */
  format: 'json' | 'markdown';
  /** Export source */
  exportSource: 'manual' | 'auto' | 'test';
  /** Filter criteria used */
  filterCriteria: {
    crewIds?: string[];
    tagFilters?: string[];
    fatigueMin?: number;
    fatigueMax?: number;
    includeLockedSlots?: boolean;
  };
  /** Export statistics */
  exportStats: {
    residentCount: number;
    slotCount: number;
    tagCount: number;
    dropFeedbackConfigCount: number;
    questTimelineTickCount: number;
    fileSizeBytes?: number;
    exportDurationMs: number;
  };
  /** Additional metadata */
  metadata: {
    schemaVersion: string;
    difficulty: string;
    estimatedRuntimeMinutes: number;
    requiredFeatures: string[];
  };
}

/**
 * Creates telemetry payload for scenario export events.
 */
export function createPhaseEScenarioExportedTelemetry(
  scenario: PhaseEScenario,
  format: 'json' | 'markdown',
  exportDurationMs: number,
  fileSizeBytes?: number
): PhaseEScenarioExportedTelemetryPayload {
  return {
    eventType: 'phase_e_scenario_exported',
    timestamp: Date.now(),
    scenarioId: scenario.id,
    format,
    exportSource: scenario.metadata.exportSource,
    filterCriteria: scenario.metadata.filterCriteria || {},
    exportStats: {
      residentCount: scenario.residents.length,
      slotCount: scenario.slots.length,
      tagCount: scenario.tagDefinitions.length,
      dropFeedbackConfigCount: scenario.dropFeedbackConfigs.length,
      questTimelineTickCount: scenario.questTimelineTicks.length,
      fileSizeBytes,
      exportDurationMs,
    },
    metadata: {
      schemaVersion: scenario.schemaVersion,
      difficulty: scenario.metadata.difficulty,
      estimatedRuntimeMinutes: scenario.metadata.estimatedRuntimeMinutes,
      requiredFeatures: scenario.metadata.requiredFeatures,
    },
  };
}
