import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { BranchDecision, BranchOutcome } from '@/engine/quest/types';
import type { AggregatedTelemetry } from './useQuestTelemetry';
import {
  DEFAULT_QUEST_DECISION_FEED_CONFIG,
  DEFAULT_QUEST_DECISION_FEED_PREFERENCES,
  QuestDecisionFeedPreferencesSchema,
  sanitizeDecisionForExport,
} from '@/ui/idleVillage/config/questDecisionFeedConfig';
import type {
  QuestDecisionFeedConfig,
  QuestDecisionFeedFilter,
  QuestDecisionFeedPreferences,
  QuestDecisionFeedSort,
  QuestDecisionFeedTagDefinition,
  QuestDecisionFeedTagRule,
} from '@/ui/idleVillage/config/questDecisionFeedConfig';
import { saveData, loadData } from '@/shared/persistence/PersistenceService';
import { trackQuestFeedEvent, trackQuestFeedExport } from '@/analytics/idleVillageQuestFeed';

/**
 * Mapping of questId/group identifier to its related decisions.
 */
type DecisionGroupMap = Record<string, BranchDecision[]>;

/**
 * Input parameters for the quest decision feed hook.
 */
export interface UseQuestDecisionFeedParams {
  telemetry?: AggregatedTelemetry | null;
  config?: Partial<QuestDecisionFeedConfig>;
}

function getExtendedOutcome(decision: BranchDecision): ExtendedBranchOutcome {
  if (!decision?.outcome) {
    return { nextPhaseIds: [] } as ExtendedBranchOutcome;
  }
  return decision.outcome as ExtendedBranchOutcome;
}

function getDecisionMetadata(decision: BranchDecision): ExtendedQuestMetadata {
  const outcome = getExtendedOutcome(decision);
  return (outcome.metadata ?? {}) as ExtendedQuestMetadata;
}

function getDecisionSuccess(decision: BranchDecision): boolean {
  const outcome = getExtendedOutcome(decision);
  if (typeof outcome.success === 'boolean') {
    return outcome.success;
  }
  const metadata = getDecisionMetadata(decision);
  if (typeof metadata.success === 'boolean') {
    return metadata.success;
  }
  if (typeof metadata.result === 'string') {
    return metadata.result === 'success';
  }
  return false;
}

function getDecisionDescription(decision: BranchDecision): string {
  const outcome = getExtendedOutcome(decision);
  if (typeof outcome.description === 'string') {
    return outcome.description;
  }
  const metadata = getDecisionMetadata(decision);
  if (typeof metadata.narrativeSummary === 'string') {
    return metadata.narrativeSummary;
  }
  if (typeof metadata.branchReason === 'string') {
    return metadata.branchReason;
  }
  return '';
}

function getDecisionChoice(decision: BranchDecision): string {
  const metadata = getDecisionMetadata(decision);
  const choice = metadata.choiceMade;
  return typeof choice === 'string' ? choice : '';
}

/**
 * Enriched quest metadata describing decision context.
 */
interface ExtendedQuestMetadata {
  questId?: string;
  choiceMade?: string;
  lastChoiceTime?: number;
  isHeroicMoment?: boolean;
  injuryRisk?: number;
  deathRisk?: number;
  duration?: number;
  questType?: string;
  result?: 'success' | 'failure' | string;
  narrativeSummary?: string;
  branchReason?: string;
  success?: boolean;
  [key: string]: unknown;
}

/**
 * Branch outcome enriched with optional telemetry fields.
 */
type ExtendedBranchOutcome = BranchOutcome & {
  success?: boolean;
  description?: string;
  metadata?: ExtendedQuestMetadata;
};

export interface UseQuestDecisionFeedReturn {
  processedDecisions: BranchDecision[];
  groupedDecisions: DecisionGroupMap;
  totalDecisions: number;
  visibleDecisions: number;
  filter: QuestDecisionFeedFilter;
  sort: QuestDecisionFeedSort;
  searchTerm: string;
  groupByQuest: boolean;
  highlightHeroic: boolean;
  tags: string[];
  setFilter: (value: QuestDecisionFeedFilter) => void;
  setSort: (value: QuestDecisionFeedSort) => void;
  setSearchTerm: (value: string) => void;
  setGroupByQuest: (value: boolean) => void;
  setHighlightHeroic: (value: boolean) => void;
  toggleTag: (tagId: string) => void;
  exportDecisions: (format: 'json' | 'csv') => string;
  activeConfig: QuestDecisionFeedConfig;
}

/**
 * Hook responsible for quest decision feed state, persistence, filtering, and telemetry.
 */
export function useQuestDecisionFeed({
  telemetry,
  config: configOverrides,
}: UseQuestDecisionFeedParams): UseQuestDecisionFeedReturn {
  const activeConfig = useMemo(
    () => mergeQuestDecisionFeedConfig(DEFAULT_QUEST_DECISION_FEED_CONFIG, configOverrides),
    [configOverrides],
  );

  const defaultPreferences = useMemo(
    () => buildDefaultPreferences(activeConfig),
    [activeConfig],
  );

  const [preferences, setPreferences] = useState<QuestDecisionFeedPreferences>(defaultPreferences);
  const [prefsLoaded, setPrefsLoaded] = useState(false);
  const [nowTimestamp, setNowTimestamp] = useState<number>(() => Date.now());
  const saveTimerRef = useRef<ReturnType<typeof globalThis.setTimeout> | null>(null);
  const decisionCount = telemetry?.branchDecisions?.length ?? 0;
  const newestDecisionTimestamp = telemetry?.branchDecisions?.[0]?.timestamp ?? 0;

  useEffect(() => {
    const handle: ReturnType<typeof globalThis.setTimeout> = globalThis.setTimeout(
      () => setNowTimestamp(Date.now()),
      0,
    );
    return () => {
      globalThis.clearTimeout(handle);
    };
  }, [decisionCount, newestDecisionTimestamp]);

  useEffect(() => {
    let mounted = true;
    const loadPreferences = async () => {
      await Promise.resolve();
      if (!mounted) return;
      setPrefsLoaded(false);
      try {
        const raw = await loadData<QuestDecisionFeedPreferences>(
          activeConfig.persistence.storageKey,
          defaultPreferences,
        );
        if (!mounted) return;
        const sanitized = sanitizePreferences(raw, activeConfig, defaultPreferences);
        setPreferences(sanitized);
        setPrefsLoaded(true);
      } catch {
        if (!mounted) return;
        setPreferences(defaultPreferences);
        setPrefsLoaded(true);
      }
    };

    void Promise.resolve().then(() => {
      if (mounted) {
        void loadPreferences();
      }
    });

    return () => {
      mounted = false;
      if (saveTimerRef.current) {
        globalThis.clearTimeout(saveTimerRef.current);
        saveTimerRef.current = null;
      }
    };
  }, [activeConfig, defaultPreferences]);

  useEffect(() => {
    if (!prefsLoaded) return;

    if (saveTimerRef.current) {
      globalThis.clearTimeout(saveTimerRef.current);
    }

    saveTimerRef.current = globalThis.setTimeout(() => {
      saveData(activeConfig.persistence.storageKey, {
        ...preferences,
        version: activeConfig.persistence.version,
      }).catch(() => {
        /* best-effort persistence */
      });
    }, activeConfig.persistence.debounceMs);

    return () => {
      if (saveTimerRef.current) {
        globalThis.clearTimeout(saveTimerRef.current);
        saveTimerRef.current = null;
      }
    };
  }, [preferences, prefsLoaded, activeConfig.persistence]);

  const tagMap = useMemo(() => {
    const map = new Map<string, QuestDecisionFeedTagDefinition>();
    activeConfig.filters.availableTags.forEach((tag) => {
      map.set(tag.id, tag);
    });
    return map;
  }, [activeConfig.filters.availableTags]);

  const normalizedSearch = useMemo(() => preferences.searchTerm.trim().toLowerCase(), [preferences.searchTerm]);
  const shouldApplySearch = normalizedSearch.length >= activeConfig.search.minChars;

  const totalDecisions = telemetry?.branchDecisions?.length ?? 0;

  const processedDecisions = useMemo(() => {
    if (!telemetry?.branchDecisions) return [];

    const quickThreshold = activeConfig.thresholds.quickDecisionSeconds;
    const slowThreshold = activeConfig.thresholds.slowDecisionSeconds;
    const recentCutoff =
      activeConfig.thresholds.staleDecisionMinutes > 0
        ? nowTimestamp - activeConfig.thresholds.staleDecisionMinutes * 60 * 1000
        : null;

    const activeTags = preferences.tags.filter((tagId) => tagMap.has(tagId));

    const filtered = telemetry.branchDecisions
      .filter((decision) => filterDecision(decision, preferences.filter, {
        recentCutoff,
        quickThreshold,
        slowThreshold,
      }))
      .filter((decision) =>
        activeTags.length === 0 || activeTags.some((tagId) => decisionMatchesRule(decision, tagMap.get(tagId)!, activeConfig)),
      )
      .filter((decision) => {
        if (!shouldApplySearch) return true;
        const choice = getDecisionChoice(decision);
        const description = getDecisionDescription(decision);
        return (
          choice.toLowerCase().includes(normalizedSearch) ||
          decision.phaseId.toLowerCase().includes(normalizedSearch) ||
          description.toLowerCase().includes(normalizedSearch)
        );
      });

    const sorted = filtered.sort((a, b) => sortDecisions(a, b, preferences.sort));
    return sorted.slice(0, activeConfig.batching.maxItems);
  }, [
    telemetry,
    preferences.filter,
    preferences.sort,
    normalizedSearch,
    shouldApplySearch,
    activeConfig,
    preferences.tags,
    tagMap,
    nowTimestamp,
  ]);

  const groupedDecisions = useMemo(() => {
    if (!preferences.groupByQuest) {
      return { all: processedDecisions };
    }

    return processedDecisions.reduce<DecisionGroupMap>((groups, decision) => {
      const questId = getDecisionMetadata(decision).questId ?? 'unknown';
      if (!groups[questId]) {
        groups[questId] = [];
      }
      groups[questId].push(decision);
      return groups;
    }, {});
  }, [processedDecisions, preferences.groupByQuest]);

  useEffect(() => {
    if (!prefsLoaded || !activeConfig.telemetry.enabled) return;
    if (!telemetry || telemetry.branchDecisions.length === 0) return;

    const shouldSample = Math.random() <= activeConfig.telemetry.sampleRate;
    if (!shouldSample) return;

    trackQuestFeedEvent({
      filter: preferences.filter,
      sort: preferences.sort,
      searchTerm: preferences.searchTerm || undefined,
      groupByQuest: preferences.groupByQuest,
      tags: preferences.tags,
      totalDecisions,
      visibleDecisions: processedDecisions.length,
      sampleDecision: processedDecisions[0]
        ? {
            phaseId: processedDecisions[0].phaseId,
            timestamp: processedDecisions[0].timestamp,
            success: getDecisionSuccess(processedDecisions[0]),
            choice: getDecisionChoice(processedDecisions[0]) || undefined,
          }
        : undefined,
    });
  }, [processedDecisions, preferences, telemetry, totalDecisions, prefsLoaded, activeConfig.telemetry]);

  const setFilter = useCallback(
    (value: QuestDecisionFeedFilter) => {
      if (!isFilterAllowed(value, activeConfig.filters.availableFilters)) return;
      setPreferences((prev) => ({ ...prev, filter: value }));
    },
    [activeConfig.filters.availableFilters],
  );

  const setSort = useCallback((value: QuestDecisionFeedSort) => {
    setPreferences((prev) => ({ ...prev, sort: value }));
  }, []);

  const setSearchTerm = useCallback(
    (value: string) => {
      const clamped = value.slice(0, activeConfig.search.maxQueryLength);
      setPreferences((prev) => ({ ...prev, searchTerm: clamped }));
    },
    [activeConfig.search.maxQueryLength],
  );

  const setGroupByQuest = useCallback((value: boolean) => {
    setPreferences((prev) => ({ ...prev, groupByQuest: value }));
  }, []);

  const setHighlightHeroic = useCallback((value: boolean) => {
    setPreferences((prev) => ({ ...prev, highlightHeroic: value }));
  }, []);

  const toggleTag = useCallback(
    (tagId: string) => {
      if (!tagMap.has(tagId)) return;
      setPreferences((prev) => {
        const exists = prev.tags.includes(tagId);
        const tags = exists ? prev.tags.filter((id) => id !== tagId) : [...prev.tags, tagId];
        return { ...prev, tags };
      });
    },
    [tagMap],
  );

  const exportDecisions = useCallback(
    (format: 'json' | 'csv') => {
      if (processedDecisions.length === 0) return '';
      const rows = processedDecisions
        .slice(0, activeConfig.batching.maxExportItems)
        .map((decision) =>
          sanitizeDecisionForExport({
            phaseId: decision.phaseId,
            timestamp: decision.timestamp,
            outcome: {
              success: getDecisionSuccess(decision),
              metadata: getDecisionMetadata(decision),
            },
          }),
        );

      if (rows.length === 0) return '';

      const payload = format === 'json' ? JSON.stringify(rows, null, 2) : convertRowsToCsv(rows);

      trackQuestFeedExport({
        format,
        filter: preferences.filter,
        sort: preferences.sort,
        exportedCount: rows.length,
        totalCount: totalDecisions,
      });

      return payload;
    },
    [processedDecisions, activeConfig.batching.maxExportItems, preferences.filter, preferences.sort, totalDecisions],
  );

  return {
    processedDecisions,
    groupedDecisions,
    totalDecisions,
    visibleDecisions: processedDecisions.length,
    filter: preferences.filter,
    sort: preferences.sort,
    searchTerm: preferences.searchTerm,
    groupByQuest: preferences.groupByQuest,
    highlightHeroic: preferences.highlightHeroic,
    tags: preferences.tags,
    setFilter,
    setSort,
    setSearchTerm,
    setGroupByQuest,
    setHighlightHeroic,
    toggleTag,
    exportDecisions,
    activeConfig,
  };
}

function buildDefaultPreferences(config: QuestDecisionFeedConfig): QuestDecisionFeedPreferences {
  return {
    ...DEFAULT_QUEST_DECISION_FEED_PREFERENCES,
    version: config.persistence.version,
    groupByQuest: config.grouping.defaultGroupByQuest,
    highlightHeroic: DEFAULT_QUEST_DECISION_FEED_PREFERENCES.highlightHeroic,
  };
}

function sanitizePreferences(
  raw: QuestDecisionFeedPreferences,
  config: QuestDecisionFeedConfig,
  fallback: QuestDecisionFeedPreferences,
): QuestDecisionFeedPreferences {
  const parsed = QuestDecisionFeedPreferencesSchema.safeParse(raw);
  const base = parsed.success ? parsed.data : fallback;

  const allowedFilters = Object.keys(config.filters.availableFilters) as QuestDecisionFeedFilter[];
  const filter = allowedFilters.includes(base.filter) ? base.filter : fallback.filter;

  const maxLength = config.search.maxQueryLength;
  const searchTerm = base.searchTerm.slice(0, maxLength);

  const tags = base.tags.filter((tagId) => config.filters.availableTags.some((tag) => tag.id === tagId));

  return {
    ...base,
    version: config.persistence.version,
    filter,
    searchTerm,
    tags,
    groupByQuest: typeof base.groupByQuest === 'boolean' ? base.groupByQuest : fallback.groupByQuest,
    highlightHeroic:
      typeof base.highlightHeroic === 'boolean' ? base.highlightHeroic : fallback.highlightHeroic,
  };
}

function mergeQuestDecisionFeedConfig(
  base: QuestDecisionFeedConfig,
  overrides?: Partial<QuestDecisionFeedConfig>,
): QuestDecisionFeedConfig {
  const clone: QuestDecisionFeedConfig = {
    ...base,
    filters: {
      ...base.filters,
      availableFilters: { ...base.filters.availableFilters },
      availableTags: [...base.filters.availableTags],
    },
    thresholds: { ...base.thresholds },
    batching: { ...base.batching },
    search: { ...base.search },
    grouping: { ...base.grouping },
    telemetry: { ...base.telemetry },
    persistence: { ...base.persistence },
    riskBadge: {
      ...base.riskBadge,
      displayConfig: { ...base.riskBadge.displayConfig },
    },
  };

  if (!overrides) {
    return clone;
  }

  return {
    ...clone,
    ...overrides,
    filters: {
      ...clone.filters,
      ...overrides.filters,
      availableFilters: {
        ...clone.filters.availableFilters,
        ...(overrides.filters?.availableFilters ?? {}),
      },
      availableTags: overrides.filters?.availableTags ?? clone.filters.availableTags,
    },
    thresholds: {
      ...clone.thresholds,
      ...(overrides.thresholds ?? {}),
    },
    batching: {
      ...clone.batching,
      ...(overrides.batching ?? {}),
    },
    search: {
      ...clone.search,
      ...(overrides.search ?? {}),
    },
    grouping: {
      ...clone.grouping,
      ...(overrides.grouping ?? {}),
    },
    telemetry: {
      ...clone.telemetry,
      ...(overrides.telemetry ?? {}),
    },
    persistence: {
      ...clone.persistence,
      ...(overrides.persistence ?? {}),
    },
    riskBadge: {
      ...clone.riskBadge,
      ...(overrides.riskBadge ?? {}),
      displayConfig: {
        ...clone.riskBadge.displayConfig,
        ...(overrides.riskBadge?.displayConfig ?? {}),
      },
    },
  };
}

function filterDecision(
  decision: BranchDecision,
  filter: QuestDecisionFeedFilter,
  options: { recentCutoff: number | null; quickThreshold: number; slowThreshold: number },
): boolean {
  switch (filter) {
    case 'recent':
      return options.recentCutoff === null || decision.timestamp >= options.recentCutoff;
    case 'successful':
      return getDecisionSuccess(decision);
    case 'failed':
      return !getDecisionSuccess(decision);
    case 'quick': {
      const choiceTime = getChoiceTime(decision);
      return choiceTime > 0 && choiceTime < options.quickThreshold;
    }
    case 'slow': {
      const choiceTime = getChoiceTime(decision);
      return choiceTime > options.slowThreshold;
    }
    case 'heroic':
      return getDecisionMetadata(decision).isHeroicMoment === true;
    default:
      return true;
  }
}

function decisionMatchesRule(
  decision: BranchDecision,
  tag: QuestDecisionFeedTagDefinition,
  config: QuestDecisionFeedConfig,
): boolean {
  switch (tag.rule as QuestDecisionFeedTagRule) {
    case 'heroic':
      return getDecisionMetadata(decision).isHeroicMoment === true;
    case 'quick':
      return getChoiceTime(decision) > 0 && getChoiceTime(decision) < config.thresholds.quickDecisionSeconds;
    case 'slow':
      return getChoiceTime(decision) > config.thresholds.slowDecisionSeconds;
    case 'highRisk':
      return getRiskLevel(decision, config) === 'high';
    case 'mediumRisk': {
      const level = getRiskLevel(decision, config);
      return level === 'medium';
    }
    default:
      return false;
  }
}

function getRiskLevel(
  decision: BranchDecision,
  config: QuestDecisionFeedConfig,
): 'low' | 'medium' | 'high' {
  const metadata = getDecisionMetadata(decision);
  const injury = normalizeRisk(metadata.injuryRisk);
  const death = normalizeRisk(metadata.deathRisk);
  const maxRisk = Math.max(injury, death);

  if (maxRisk >= config.riskBadge.highThreshold) return 'high';
  if (maxRisk >= config.riskBadge.mediumThreshold) return 'medium';
  return 'low';
}

function normalizeRisk(value: unknown): number {
  if (typeof value !== 'number') return 0;
  const normalized = value > 1 ? value / 100 : value;
  if (!Number.isFinite(normalized)) return 0;
  return Math.max(0, Math.min(1, normalized));
}

function getChoiceTime(decision: BranchDecision): number {
  const meta = getDecisionMetadata(decision);
  return typeof meta.lastChoiceTime === 'number' ? meta.lastChoiceTime : 0;
}

function sortDecisions(a: BranchDecision, b: BranchDecision, sort: QuestDecisionFeedSort): number {
  switch (sort) {
    case 'duration': {
      const durationA = getDecisionMetadata(a).duration ?? 0;
      const durationB = getDecisionMetadata(b).duration ?? 0;
      return durationB - durationA;
    }
    case 'choice-time':
      return getChoiceTime(b) - getChoiceTime(a);
    case 'quest-type': {
      const questTypeA = (getDecisionMetadata(a).questType ?? a.phaseId).toLowerCase();
      const questTypeB = (getDecisionMetadata(b).questType ?? b.phaseId).toLowerCase();
      return questTypeA.localeCompare(questTypeB);
    }
    case 'success':
      return Number(getDecisionSuccess(b)) - Number(getDecisionSuccess(a));
    case 'timestamp':
    default:
      return b.timestamp - a.timestamp;
  }
}

function isFilterAllowed(
  value: QuestDecisionFeedFilter,
  availableFilters: QuestDecisionFeedConfig['filters']['availableFilters'],
): boolean {
  return Object.prototype.hasOwnProperty.call(availableFilters, value);
}

function convertRowsToCsv(rows: ReturnType<typeof sanitizeDecisionForExport>[]): string {
  const headers = Object.keys(rows[0]);
  const csvRows = [headers.join(',')];

  rows.forEach((row) => {
    const values = headers.map((header) => {
      const value = row[header as keyof typeof row];
      if (value === undefined || value === null) {
        return '';
      }
      const stringValue = String(value);
      if (stringValue.includes(',') || stringValue.includes('"')) {
        return `"${stringValue.replace(/"/g, '""')}"`;
      }
      return stringValue;
    });
    csvRows.push(values.join(','));
  });

  return csvRows.join('\n');
}
