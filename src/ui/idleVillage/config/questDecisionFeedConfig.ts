import { z } from 'zod';
import type { RiskDisplayConfig } from '@/balancing/config/idleVillage/riskDisplayConfig';
import { DEFAULT_RISK_DISPLAY_CONFIG } from '@/balancing/config/idleVillage/riskDisplayConfig';

export const QUEST_DECISION_FEED_FILTERS = [
  'all',
  'recent',
  'successful',
  'failed',
  'quick',
  'slow',
  'heroic',
] as const;

export const QUEST_DECISION_FEED_SORTS = [
  'timestamp',
  'duration',
  'choice-time',
  'quest-type',
  'success',
] as const;

export type QuestDecisionFeedFilter = typeof QUEST_DECISION_FEED_FILTERS[number];
export type QuestDecisionFeedSort = typeof QUEST_DECISION_FEED_SORTS[number];

export type QuestDecisionFeedTagRule =
  | 'heroic'
  | 'quick'
  | 'slow'
  | 'highRisk'
  | 'mediumRisk';

export interface QuestDecisionFeedTagDefinition {
  id: string;
  label: string;
  description?: string;
  rule: QuestDecisionFeedTagRule;
  colorClass: string;
}

const RiskBadgeThresholdSchema = z.object({
  enabled: z.boolean(),
  highThreshold: z.number().min(0).max(1),
  mediumThreshold: z.number().min(0).max(1),
});

export const QuestDecisionFeedConfigSchema = z.object({
  filters: z.object({
    availableFilters: z.record(
      z.string(),
      z.object({
        label: z.string(),
        description: z.string(),
      }),
    ),
    availableTags: z.array(
      z.object({
        id: z.string(),
        label: z.string(),
        description: z.string().optional(),
        rule: z.enum(['heroic', 'quick', 'slow', 'highRisk', 'mediumRisk'] as const),
        colorClass: z.string(),
      }),
    ),
  }),
  thresholds: z.object({
    quickDecisionSeconds: z.number().positive(),
    slowDecisionSeconds: z.number().positive(),
    staleDecisionMinutes: z.number().nonnegative(),
  }),
  batching: z.object({
    maxItems: z.number().int().positive(),
    maxExportItems: z.number().int().positive(),
    autoRefreshMs: z.number().int().nonnegative(),
    enableAutoRefresh: z.boolean(),
  }),
  search: z.object({
    minChars: z.number().int().nonnegative(),
    maxQueryLength: z.number().int().positive(),
  }),
  grouping: z.object({
    defaultGroupByQuest: z.boolean(),
    enableQuestTags: z.boolean(),
    maxGroups: z.number().int().positive(),
  }),
  telemetry: z.object({
    enabled: z.boolean(),
    sampleRate: z.number().min(0).max(1),
  }),
  persistence: z.object({
    storageKey: z.string(),
    debounceMs: z.number().int().nonnegative(),
    version: z.number().int().positive(),
  }),
  riskBadge: RiskBadgeThresholdSchema,
});

type QuestDecisionFeedConfigBase = z.infer<typeof QuestDecisionFeedConfigSchema>;

export interface QuestDecisionFeedRiskBadgeConfig
  extends z.infer<typeof RiskBadgeThresholdSchema> {
  displayConfig: RiskDisplayConfig;
}

export interface QuestDecisionFeedConfig extends QuestDecisionFeedConfigBase {
  riskBadge: QuestDecisionFeedRiskBadgeConfig;
}

export const DEFAULT_QUEST_DECISION_FEED_CONFIG: QuestDecisionFeedConfig = {
  filters: {
    availableFilters: {
      all: {
        label: 'All',
        description: 'Show every quest decision in chronological order.',
      },
      recent: {
        label: 'Recent',
        description: 'Show the latest decisions based on telemetry timestamp.',
      },
      successful: {
        label: 'Successful',
        description: 'Only show branches that ended with success.',
      },
      failed: {
        label: 'Failed',
        description: 'Only show failed or negative outcomes.',
      },
      quick: {
        label: 'Quick',
        description: 'Decisions faster than the quick threshold.',
      },
      slow: {
        label: 'Slow',
        description: 'Decisions slower than the slow threshold.',
      },
      heroic: {
        label: 'Heroic',
        description: 'Highlight hero moments detected by telemetry.',
      },
    },
    availableTags: [
      {
        id: 'tag-heroic',
        label: 'Heroic',
        description: 'Force highlight heroic branches regardless of filter.',
        rule: 'heroic',
        colorClass: 'text-amber-300 border-amber-400/50',
      },
      {
        id: 'tag-quick',
        label: 'Quick',
        description: 'Surface decisions under quick threshold.',
        rule: 'quick',
        colorClass: 'text-blue-300 border-blue-400/40',
      },
      {
        id: 'tag-slow',
        label: 'Slow',
        description: 'Surface decisions above slow threshold.',
        rule: 'slow',
        colorClass: 'text-orange-300 border-orange-400/40',
      },
      {
        id: 'tag-risk',
        label: 'High Risk',
        description: 'Highlight branches with high injury/death risk.',
        rule: 'highRisk',
        colorClass: 'text-red-300 border-red-400/40',
      },
      {
        id: 'tag-risk-medium',
        label: 'Medium Risk',
        description: 'Highlight branches with medium risk.',
        rule: 'mediumRisk',
        colorClass: 'text-yellow-300 border-yellow-400/40',
      },
    ],
  },
  thresholds: {
    quickDecisionSeconds: 2,
    slowDecisionSeconds: 10,
    staleDecisionMinutes: 30,
  },
  batching: {
    maxItems: 50,
    maxExportItems: 200,
    autoRefreshMs: 5000,
    enableAutoRefresh: true,
  },
  search: {
    minChars: 2,
    maxQueryLength: 64,
  },
  grouping: {
    defaultGroupByQuest: false,
    enableQuestTags: true,
    maxGroups: 10,
  },
  telemetry: {
    enabled: true,
    sampleRate: 1,
  },
  persistence: {
    storageKey: 'idle_village_quest_feed_prefs',
    debounceMs: 350,
    version: 1,
  },
  riskBadge: {
    enabled: true,
    highThreshold: 0.6,
    mediumThreshold: 0.3,
    displayConfig: DEFAULT_RISK_DISPLAY_CONFIG,
  },
};

export const QuestDecisionFeedPreferencesSchema = z.object({
  version: z.number().int().positive().default(1),
  filter: z.enum(QUEST_DECISION_FEED_FILTERS).default('all'),
  sort: z.enum(QUEST_DECISION_FEED_SORTS).default('timestamp'),
  searchTerm: z.string().max(DEFAULT_QUEST_DECISION_FEED_CONFIG.search.maxQueryLength).default(''),
  groupByQuest: z.boolean().default(DEFAULT_QUEST_DECISION_FEED_CONFIG.grouping.defaultGroupByQuest),
  tags: z.array(z.string()).max(DEFAULT_QUEST_DECISION_FEED_CONFIG.grouping.maxGroups).default([]),
  highlightHeroic: z.boolean().default(true),
});

export type QuestDecisionFeedPreferences = z.infer<typeof QuestDecisionFeedPreferencesSchema>;

export const DEFAULT_QUEST_DECISION_FEED_PREFERENCES: QuestDecisionFeedPreferences =
  QuestDecisionFeedPreferencesSchema.parse({});

export interface QuestDecisionFeedExportRow {
  phaseId: string;
  questId?: string;
  timestamp: number;
  success: boolean;
  choice?: string;
  choiceTime?: number;
  injuryRisk?: number;
  deathRisk?: number;
  heroic?: boolean;
}

export function sanitizeDecisionForExport(decision: {
  phaseId: string;
  timestamp: number;
  outcome: {
    success: boolean;
    metadata?: Record<string, unknown>;
  };
}): QuestDecisionFeedExportRow {
  const injuryRiskRaw = (decision.outcome.metadata?.injuryRisk as number | undefined) ?? 0;
  const deathRiskRaw = (decision.outcome.metadata?.deathRisk as number | undefined) ?? 0;
  const normalizeRisk = (value: number) => (value > 1 ? value / 100 : value);

  return {
    phaseId: decision.phaseId,
    questId: (decision.outcome.metadata?.questId as string | undefined) ?? undefined,
    timestamp: decision.timestamp,
    success: decision.outcome.success,
    choice: (decision.outcome.metadata?.choiceMade as string | undefined) ?? undefined,
    choiceTime: (decision.outcome.metadata?.lastChoiceTime as number | undefined) ?? undefined,
    injuryRisk: Number(normalizeRisk(injuryRiskRaw).toFixed(3)),
    deathRisk: Number(normalizeRisk(deathRiskRaw).toFixed(3)),
    heroic: decision.outcome.metadata?.isHeroicMoment === true,
  };
}
