/**
 * Quest Telemetry Hook
 *
 * Accumulates and manages quest telemetry data across all quest executions.
 * Provides real-time telemetry aggregation and statistics for quest analytics.
 * Now includes async persistence via PersistenceService for session data.
 */

import { useCallback, useMemo, useState, useEffect, useRef } from 'react';
import { saveData, loadData, clearData } from '@/shared/persistence/PersistenceService';
import type { QuestResult, BranchDecision } from '@/engine/quest/types';
import { useIdleVillageConfigStore } from '@/balancing/config/idleVillage/IdleVillageConfigStore';
import type { QuestTypeDefinition } from '@/balancing/config/idleVillage/types';
import { questTelemetryProfiler } from '@/ui/idleVillage/utils/questTelemetryProfiling';

type SandboxTimeout = ReturnType<typeof globalThis.setTimeout>;

export interface QuestTelemetryEntry {
  questId: string;
  result: QuestResult;
  timestamp: number;
  sessionId: string;
}

export interface AggregatedTelemetry {
  totalQuests: number;
  successRate: number;
  averageDuration: number;
  totalBranches: number;
  averageChoiceTime: number;
  heroicMoments: number;
  branchDecisions: BranchDecision[];
  recentQuests: QuestTelemetryEntry[];
  questTypeBreakdown: Record<string, number>;
}

export interface QuestTelemetryHook {
  telemetry: AggregatedTelemetry;
  isLoading: boolean;
  error: string | null;
  recordQuestResult: (result: QuestResult) => void;
  clearTelemetry: () => void;
  getQuestTypeStats: (questType: string) => {
    count: number;
    successRate: number;
    averageDuration: number;
  };
}

const MAX_RECENT_QUESTS = 10;
const STORAGE_KEY = 'quest-telemetry';

/**
 * Hook for accumulating and managing quest telemetry data.
 * Provides aggregated statistics and real-time telemetry updates with async persistence.
 */
export function useQuestTelemetry(): QuestTelemetryHook {
  const [telemetryEntries, setTelemetryEntries] = useState<QuestTelemetryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const saveTimeoutRef = useRef<SandboxTimeout | null>(null);
  const questTypes = useIdleVillageConfigStore((state) => state.config.questTypes ?? {});
  const questTypeResolver = useMemo(() => {
    const effectiveQuestTypes = Object.keys(questTypes).length > 0 ? questTypes : {
      'mixed': {
        id: 'mixed',
        label: 'Mixed Quest',
        priority: 0,
        matchers: [],
      },
    };
    return createQuestTypeResolver(effectiveQuestTypes);
  }, [questTypes]);

  // Load telemetry data on mount
  useEffect(() => {
    const loadTelemetry = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const saved = await loadData(STORAGE_KEY, []);
        setTelemetryEntries(normalizeTelemetryEntries(saved));
      } catch (err) {
        console.warn('[useQuestTelemetry] Failed to load telemetry:', err);
        setError('Failed to load telemetry data');
        setTelemetryEntries([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadTelemetry();
  }, []);

  // Debounced save function using Promise-based delay
  const debouncedSave = useCallback(
    async (data: QuestTelemetryEntry[]) => {
      if (saveTimeoutRef.current) {
        globalThis.clearTimeout(saveTimeoutRef.current);
      }

      return new Promise<void>((resolve) => {
        saveTimeoutRef.current = globalThis.setTimeout(async () => {
          try {
            await saveData(STORAGE_KEY, data);
          } catch (err) {
            console.warn('[useQuestTelemetry] Failed to save telemetry:', err);
            setError('Failed to save telemetry data');
          }
          resolve();
        }, 500);
      });
    },
    [],
  );

  const recordQuestResult = useCallback((result: QuestResult) => {
    const entry: QuestTelemetryEntry = {
      questId: result.questId,
      result,
      timestamp: Date.now(),
      sessionId: generateSessionId(),
    };

    setTelemetryEntries((prev) => {
      const newEntries = [entry, ...prev];
      debouncedSave(newEntries.slice(0, MAX_RECENT_QUESTS));
      return newEntries;
    });
  }, [debouncedSave]);

  const clearTelemetry = useCallback(async () => {
    try {
      // Clear any pending save
      if (saveTimeoutRef.current) {
        globalThis.clearTimeout(saveTimeoutRef.current);
        saveTimeoutRef.current = null;
      }

      setTelemetryEntries([]);
      await clearData(STORAGE_KEY);
      setError(null);
    } catch (err) {
      console.warn('[useQuestTelemetry] Failed to clear telemetry:', err);
      setError('Failed to clear telemetry data');
    }
  }, []);

    const aggregatedTelemetry = useMemo((): AggregatedTelemetry => {
    if (telemetryEntries.length === 0) {
      return {
        totalQuests: 0,
        successRate: 0,
        averageDuration: 0,
        totalBranches: 0,
        averageChoiceTime: 0,
        heroicMoments: 0,
        branchDecisions: [],
        recentQuests: [],
        questTypeBreakdown: {},
      };
    }

    // Profile the aggregation
    const markName = questTelemetryProfiler.startMeasurement('telemetry-aggregation', {
      entryCount: telemetryEntries.length
    });

    try {
      // Calculate aggregated metrics
      const totalQuests = telemetryEntries.length;
      const successfulQuests = telemetryEntries.filter((entry) => entry.result.success).length;
      const successRate = totalQuests > 0 ? successfulQuests / totalQuests : 0;

      const totalDuration = telemetryEntries.reduce((sum, entry) => sum + entry.result.durationSeconds, 0);
      const averageDuration = totalQuests > 0 ? totalDuration / totalQuests : 0;

      // Aggregate telemetry data
      const allBranches = telemetryEntries.flatMap((entry) => entry.result.branchDecisions);
      const totalBranches = allBranches.length;

      const choiceTimes = allBranches
        .map((decision) => (decision.outcome.metadata?.lastChoiceTime as number) || 0)
        .filter((time) => time > 0);
      const averageChoiceTime =
        choiceTimes.length > 0 ? choiceTimes.reduce((a, b) => a + b, 0) / choiceTimes.length : 0;

      const heroicMoments = telemetryEntries.reduce(
        (sum, entry) => sum + (entry.result.telemetryData?.heroicMoments ?? 0),
        0,
      );

      // Quest type breakdown
      const questTypeBreakdown = telemetryEntries.reduce((acc, entry) => {
        const questType = questTypeResolver(entry.questId);
        acc[questType] = (acc[questType] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const result = {
        totalQuests,
        successRate,
        averageDuration,
        totalBranches,
        averageChoiceTime,
        heroicMoments,
        branchDecisions: allBranches,
        recentQuests: telemetryEntries.slice(0, MAX_RECENT_QUESTS),
        questTypeBreakdown,
      };

      questTelemetryProfiler.endMeasurement(markName);
      return result;
    } catch (error) {
      questTelemetryProfiler.endMeasurement(markName);
      console.error('Error in telemetry aggregation:', error);
      return {
        totalQuests: 0,
        successRate: 0,
        averageDuration: 0,
        totalBranches: 0,
        averageChoiceTime: 0,
        heroicMoments: 0,
        branchDecisions: [],
        recentQuests: [],
        questTypeBreakdown: {},
      };
    }
  }, [telemetryEntries, questTypeResolver]);

    const getQuestTypeStats = useCallback((questType: string) => {
    const markName = questTelemetryProfiler.startMeasurement(`quest-type-stats-${questType}`, {
      questType,
      totalEntries: telemetryEntries.length
    });

    try {
      const typeEntries = telemetryEntries.filter((entry) => questTypeResolver(entry.questId) === questType);

      if (typeEntries.length === 0) {
        questTelemetryProfiler.endMeasurement(markName);
        return { count: 0, successRate: 0, averageDuration: 0 };
      }

      const count = typeEntries.length;
      const successful = typeEntries.filter(entry => entry.result.success).length;
      const successRate = successful / count;
      const totalDuration = typeEntries.reduce((sum, entry) =>
        sum + entry.result.durationSeconds, 0);
      const averageDuration = totalDuration / count;

      const result = { count, successRate, averageDuration };
      questTelemetryProfiler.endMeasurement(markName);
      return result;
    } catch (error) {
      questTelemetryProfiler.endMeasurement(markName);
      console.error('Error in quest type stats:', error);
      return { count: 0, successRate: 0, averageDuration: 0 };
    }
  }, [telemetryEntries, questTypeResolver]);

  return {
    telemetry: aggregatedTelemetry,
    isLoading,
    error,
    recordQuestResult,
    clearTelemetry,
    getQuestTypeStats,
  };
}

/**
 * Generate a unique session ID for telemetry tracking.
 */
function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
}

type QuestTypeResolver = (questId: string) => string;

function createQuestTypeResolver(questTypes: Record<string, QuestTypeDefinition>): QuestTypeResolver {
  const definitions = Object.values(questTypes ?? {});
  if (definitions.length === 0) {
    return () => 'mixed';
  }

  const ordered = [...definitions].sort(
    (a, b) => (a.priority ?? Number.MAX_SAFE_INTEGER) - (b.priority ?? Number.MAX_SAFE_INTEGER),
  );
  const fallbackDefinition =
    ordered.find((definition) => definition.isFallback) ??
    ordered[ordered.length - 1] ?? {
      id: 'mixed',
      label: 'Mixed Quest',
    };

  return (questId: string) => {
    const normalizedId = questId.toLowerCase();
    for (const definition of ordered) {
      if (definition.matchers && matchesQuestType(normalizedId, definition)) {
        return definition.id;
      }
    }
    return fallbackDefinition.id;
  };
}

function matchesQuestType(questId: string, definition: QuestTypeDefinition): boolean {
  if (!definition.matchers || definition.matchers.length === 0) {
    return false;
  }

  return definition.matchers.some((matcher) => {
    if (matcher.includes?.some((needle) => questId.includes(needle.toLowerCase()))) {
      return true;
    }
    if (matcher.prefixes?.some((prefix) => questId.startsWith(prefix.toLowerCase()))) {
      return true;
    }
    if (matcher.regex) {
      try {
        const regex = new RegExp(matcher.regex, 'i');
        if (regex.test(questId)) {
          return true;
        }
      } catch (err) {
        console.warn('[useQuestTelemetry] Invalid quest type matcher regex:', matcher.regex, err);
      }
    }
    return false;
  });
}

/**
 * Hook for real-time telemetry emission during quest execution.
 * Allows components to subscribe to telemetry events.
 */
interface TelemetryEventDetail<T = unknown> {
  eventType: string;
  data: T;
  timestamp: number;
}

export function useQuestTelemetryEmitter<T = unknown>() {
  const emitTelemetryEvent = useCallback((eventType: string, data: T) => {
    const event = new CustomEvent<TelemetryEventDetail<T>>('quest-telemetry', {
      detail: { eventType, data, timestamp: Date.now() },
    });
    window.dispatchEvent(event);
  }, []);

  return { emitTelemetryEvent };
}

/**
 * Hook for subscribing to telemetry events.
 */
export function useQuestTelemetrySubscriber<T = unknown>(callback: (event: TelemetryEventDetail<T>) => void) {
  const subscribe = useCallback(() => {
    const handler = (event: CustomEvent<TelemetryEventDetail<T>>) => callback(event.detail);

    window.addEventListener('quest-telemetry', handler as EventListener);

    return () => {
      window.removeEventListener('quest-telemetry', handler as EventListener);
    };
  }, [callback]);

  return { subscribe };
}

function normalizeTelemetryEntries(raw: unknown): QuestTelemetryEntry[] {
  if (!Array.isArray(raw)) {
    return [];
  }

  return raw
    .map((entry) => normalizeTelemetryEntry(entry))
    .filter((entry): entry is QuestTelemetryEntry => entry !== null);
}

function normalizeTelemetryEntry(entry: unknown): QuestTelemetryEntry | null {
  if (!entry) return null;

  if (isQuestTelemetryEntry(entry)) {
    return {
      questId: entry.questId,
      result: entry.result,
      timestamp: typeof entry.timestamp === 'number' ? entry.timestamp : Date.now(),
      sessionId: entry.sessionId ?? generateSessionId(),
    };
  }

  if (isQuestResult(entry)) {
    return {
      questId: entry.questId,
      result: entry,
      timestamp: Date.now(),
      sessionId: generateSessionId(),
    };
  }

  return null;
}

function isQuestTelemetryEntry(value: unknown): value is QuestTelemetryEntry {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as QuestTelemetryEntry).questId === 'string' &&
    typeof (value as QuestTelemetryEntry).result === 'object' &&
    (value as QuestTelemetryEntry).result !== null
  );
}

function isQuestResult(value: unknown): value is QuestResult {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as QuestResult).questId === 'string' &&
    typeof (value as QuestResult).success === 'boolean'
  );
}
