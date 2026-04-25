import type { ResidentState, ScheduledActivity } from '../../../src/engine/game/idleVillage/TimeEngine';
import type {
  ResidentRelationshipGraphSourceData,
  ResidentCrewAssignmentRecord,
  ResidentQuestParty,
  ResidentDropFeedbackRecord,
} from '../../../src/ui/idleVillage/hooks/useResidentRelationshipGraph';
import type { CrewSchedulerAnalyticsEvent } from '../../../src/ui/idleVillage/utils/crewSchedulerAnalyticsChannel';

/**
 * Canonical mock dataset shared by hook + UI resident graph tests.
 * Mirrors the config-first data model (residents + activities + quest telemetry + drop analytics).
 */
export interface ResidentGraphMockScenario {
  residents: Record<string, ResidentState>;
  activities: Record<string, ScheduledActivity>;
  activityHistory: ScheduledActivity[];
  questParties: ResidentQuestParty[];
  crewAssignments: ResidentCrewAssignmentRecord[];
  dropFeedback: ResidentDropFeedbackRecord[];
  crewHistory: CrewSchedulerAnalyticsEvent[];
}

export const residentGraphScenario: ResidentGraphMockScenario = {
  residents: {
    'resident_alpha': {
      id: 'resident_alpha',
      displayName: 'Aurora',
      status: 'available',
      fatigue: 20,
      statTags: ['strength', 'bravery'],
      portraitUrl: '/portraits/aurora.png',
      visualProfileId: 'aurora_profile',
      homeId: 'forge',
      currentHp: 110,
      maxHp: 120,
      isInjured: false,
      survivalCount: 3,
      survivalScore: 0.85,
    },
    'resident_beta': {
      id: 'resident_beta',
      displayName: 'Bram',
      status: 'available',
      fatigue: 45,
      statTags: ['agility', 'bravery'],
      portraitUrl: '/portraits/bram.png',
      visualProfileId: 'bram_profile',
      homeId: 'barracks',
      currentHp: 95,
      maxHp: 110,
      isInjured: false,
      survivalCount: 1,
      survivalScore: 0.4,
    },
    'resident_gamma': {
      id: 'resident_gamma',
      displayName: 'Cira',
      status: 'injured',
      fatigue: 72,
      statTags: ['intelligence', 'strategy'],
      portraitUrl: '/portraits/cira.png',
      visualProfileId: 'cira_profile',
      homeId: 'observatory',
      currentHp: 55,
      maxHp: 100,
      isInjured: true,
      survivalCount: 2,
      survivalScore: 0.6,
    },
  },
  activities: {
    'activity_patrol': {
      id: 'activity_patrol',
      activityId: 'patrol',
      characterIds: ['resident_alpha', 'resident_beta'],
      startTime: 1_700_000_000_000,
      endTime: 1_700_000_100_000,
      status: 'completed',
      slotId: 'slot_north_gate',
      isAuto: false,
      isCompleted: true,
      snapshotDeathRisk: 0.1,
    },
    'activity_oracle': {
      id: 'activity_oracle',
      activityId: 'oracle_shift',
      characterIds: ['resident_gamma'],
      startTime: 1_700_000_200_000,
      endTime: 1_700_000_260_000,
      status: 'running',
      slotId: 'slot_observatory',
      isAuto: false,
      isCompleted: false,
      snapshotDeathRisk: 0.05,
    },
  },
  activityHistory: [
    {
      id: 'historical_trial',
      activityId: 'trial_of_fire',
      characterIds: ['resident_alpha', 'resident_gamma'],
      startTime: 1_699_999_500_000,
      endTime: 1_699_999_560_000,
      status: 'completed',
      slotId: 'slot_arena',
      isAuto: false,
      isCompleted: true,
      snapshotDeathRisk: 0.3,
    },
  ],
  questParties: [
    {
      questId: 'quest_embassy',
      participantIds: ['resident_beta', 'resident_gamma'],
      timestamp: 1_699_999_700_000,
      success: false,
    },
    {
      questId: 'quest_dungeon',
      participantIds: ['resident_alpha', 'resident_beta'],
      timestamp: 1_700_000_050_000,
      success: true,
    },
  ],
  crewAssignments: [
    {
      activityId: 'crew_day_shift',
      residentIds: ['resident_alpha', 'resident_beta', 'resident_gamma'],
      timestamp: 1_699_999_800_000,
    },
  ],
  dropFeedback: [
    {
      residentId: 'resident_alpha',
      severity: 'warning',
      timestamp: 1_700_000_108_000,
    },
    {
      residentId: 'resident_beta',
      severity: 'warning',
      timestamp: 1_700_000_110_000,
    },
    {
      residentId: 'resident_gamma',
      severity: 'blocked',
      timestamp: 1_700_000_115_000,
    },
  ],
  crewHistory: [
    {
      type: 'drop_feedback',
      timestamp: 1_700_000_120_000,
      feedbackType: 'blocked',
      residentId: 'resident_gamma',
      activityId: 'slot_observatory',
    },
    {
      type: 'decision',
      timestamp: 1_700_000_130_000,
      decision: {
        residentId: 'resident_alpha',
        slotId: 'slot_north_gate',
        activityId: 'patrol',
        priorityScore: 0.92,
        rationale: 'high synergy',
      },
    },
  ],
};

export const residentGraphConfig = {
  activities: {
    patrol: { tags: [] },
    oracle_shift: { tags: [] },
    trial_of_fire: { tags: ['quest'] },
    quest_embassy: { tags: ['quest'] },
    quest_dungeon: { tags: ['quest'] },
  },
  globalRules: {
    maxFatigueBeforeExhausted: 100,
  },
};

export function createResidentGraphSource(
  overrides: Partial<ResidentRelationshipGraphSourceData> = {},
): ResidentRelationshipGraphSourceData {
  return {
    residents: residentGraphScenario.residents,
    activities: residentGraphScenario.activities,
    activityHistory: residentGraphScenario.activityHistory,
    questParties: residentGraphScenario.questParties,
    crewAssignments: residentGraphScenario.crewAssignments,
    dropFeedback: residentGraphScenario.dropFeedback,
    ...overrides,
  };
}

export function createCrewAnalyticsHistory(): CrewSchedulerAnalyticsEvent[] {
  return [...residentGraphScenario.crewHistory];
}
