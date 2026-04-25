/**
 * Quest Telemetry Inspector Hook
 *
 * Advanced hook for querying and filtering quest telemetry data.
 * Provides caching, filtering, and export capabilities for quest analytics.
 * Integrates with PersistenceService for data persistence and caching.
 */

import { useCallback, useMemo, useState, useEffect } from 'react';
import { saveData, loadData } from '@/shared/persistence/PersistenceService';
import { useQuestTelemetry } from './useQuestTelemetry';
import type { QuestTelemetryEntry } from './useQuestTelemetry';
import type { QuestResult, BranchDecision } from '@/engine/quest/types';

/**
 * Filter options for quest telemetry
 */
export interface QuestTelemetryFilters {
  /** Filter by specific quest ID */
  questId?: string;
  /** Filter by risk band (low/medium/high) */
  riskBand?: 'low' | 'medium' | 'high';
  /** Filter by decision type (accept/decline/alternative) */
  decisionType?: 'accept' | 'decline' | 'alternative';
  /** Filter by quest type */
  questType?: string;
  /** Filter by date range */
  dateRange?: {
    start: Date;
    end: Date;
  };
  /** Filter by success/failure outcome */
  outcome?: 'success' | 'failure';
  /** Minimum duration filter (ms) */
  minDuration?: number;
  /** Maximum duration filter (ms) */
  maxDuration?: number;
}

/**
 * Inspector statistics and insights
 */
export interface QuestTelemetryInsights {
  totalFiltered: number;
  successRate: number;
  averageDuration: number;
  riskDistribution: Record<string, number>;
  decisionDistribution: Record<string, number>;
  questTypeDistribution: Record<string, number>;
  durationStats: {
    min: number;
    max: number;
    median: number;
    p95: number;
  };
  recentTrends: {
    dailyCounts: Record<string, number>;
    successTrend: number; // -1 to 1, negative = declining
  };
}

/**
 * Export options
 */
export interface QuestTelemetryExportOptions {
  format: 'csv' | 'json' | 'markdown';
  includeInsights: boolean;
  includeRawData: boolean;
  filename?: string;
}

/**
 * Hook return value
 */
export interface UseQuestTelemetryInspectorReturn {
  /** Filtered telemetry data */
  filteredData: QuestTelemetryEntry[];
  /** Computed insights */
  insights: QuestTelemetryInsights | null;
  /** Current filters */
  filters: QuestTelemetryFilters;
  /** Loading state */
  isLoading: boolean;
  /** Error state */
  error: string | null;
  /** Update filters */
  updateFilters: (newFilters: Partial<QuestTelemetryFilters>) => void;
  /** Clear all filters */
  clearFilters: () => void;
  /** Export filtered data */
  exportData: (options: QuestTelemetryExportOptions) => string;
  /** Refresh data */
  refresh: () => void;
  /** Cache statistics */
  cacheStats: {
    size: number;
    lastUpdate: number;
    hitRate: number;
  };
}

// Cache configuration
const CACHE_KEY = 'quest-telemetry-inspector-cache';
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const MAX_CACHE_SIZE = 1000; // Maximum entries to cache

/**
 * Cache entry structure
 */
interface CacheEntry {
  data: QuestTelemetryEntry[];
  insights: QuestTelemetryInsights;
  timestamp: number;
  filters: QuestTelemetryFilters;
}

/**
 * Calculate risk band for a quest result
 */
function calculateRiskBand(result: QuestResult): 'low' | 'medium' | 'high' {
  // Risk calculation based on duration and success rate
  const duration = (result.durationSeconds || 0) * 1000; // Convert to ms
  const success = result.success;
  
  if (!success) return 'high';
  if (duration > 30000) return 'medium'; // > 30 seconds
  return 'low';
}

/**
 * Extract decision type from branch decisions
 */
function extractDecisionType(decisions: BranchDecision[]): 'accept' | 'decline' | 'alternative' {
  if (decisions.length === 0) return 'accept';
  
  const lastDecision = decisions[decisions.length - 1];
  // Use choiceId to determine decision type
  const choiceId = lastDecision.choiceId || '';
  if (choiceId.includes('accept')) return 'accept';
  if (choiceId.includes('decline')) return 'decline';
  return 'alternative';
}

/**
 * Generate insights from filtered data
 */
function generateInsights(data: QuestTelemetryEntry[]): QuestTelemetryInsights {
  if (data.length === 0) {
    return {
      totalFiltered: 0,
      successRate: 0,
      averageDuration: 0,
      riskDistribution: {},
      decisionDistribution: {},
      questTypeDistribution: {},
      durationStats: { min: 0, max: 0, median: 0, p95: 0 },
      recentTrends: { dailyCounts: {}, successTrend: 0 },
    };
  }

  const successCount = data.filter(entry => entry.result.success).length;
  const durations = data.map(entry => (entry.result.durationSeconds || 0) * 1000).sort((a, b) => a - b);
  
  // Calculate distributions
  const riskDistribution: Record<string, number> = {};
  const decisionDistribution: Record<string, number> = {};
  const questTypeDistribution: Record<string, number> = {};
  const dailyCounts: Record<string, number> = {};

  data.forEach(entry => {
    // Risk distribution
    const riskBand = calculateRiskBand(entry.result);
    riskDistribution[riskBand] = (riskDistribution[riskBand] || 0) + 1;
    
    // Decision distribution
    const decisionType = extractDecisionType(entry.result.branchDecisions || []);
    decisionDistribution[decisionType] = (decisionDistribution[decisionType] || 0) + 1;
    
    // Quest type distribution (using telemetry data)
    const questType = entry.result.telemetryData?.playerChoices?.[0] || 'unknown';
    questTypeDistribution[questType] = (questTypeDistribution[questType] || 0) + 1;
    
    // Daily counts
    const dateKey = new Date(entry.timestamp).toISOString().split('T')[0];
    dailyCounts[dateKey] = (dailyCounts[dateKey] || 0) + 1;
  });

  // Calculate duration statistics
  const min = durations[0] || 0;
  const max = durations[durations.length - 1] || 0;
  const median = durations[Math.floor(durations.length / 2)] || 0;
  const p95 = durations[Math.floor(durations.length * 0.95)] || 0;

  // Calculate success trend (simple linear regression on last 7 days)
  const dates = Object.keys(dailyCounts).sort();
  const successTrend = dates.length >= 2 ? 
    (dailyCounts[dates[dates.length - 1]] - dailyCounts[dates[0]]) / dates.length : 0;

  return {
    totalFiltered: data.length,
    successRate: successCount / data.length,
    averageDuration: durations.reduce((sum, d) => sum + d, 0) / durations.length,
    riskDistribution,
    decisionDistribution,
    questTypeDistribution,
    durationStats: { min, max, median, p95 },
    recentTrends: { dailyCounts, successTrend },
  };
}

/**
 * Apply filters to telemetry data
 */
function applyFilters(
  data: QuestTelemetryEntry[], 
  filters: QuestTelemetryFilters
): QuestTelemetryEntry[] {
  return data.filter(entry => {
    // Quest ID filter
    if (filters.questId && !entry.questId.includes(filters.questId)) {
      return false;
    }

    // Risk band filter
    if (filters.riskBand) {
      const riskBand = calculateRiskBand(entry.result);
      if (riskBand !== filters.riskBand) return false;
    }

    // Decision type filter
    if (filters.decisionType) {
      const decisionType = extractDecisionType(entry.result.branchDecisions || []);
      if (decisionType !== filters.decisionType) return false;
    }

    // Quest type filter
    if (filters.questType) {
      const entryQuestType = entry.result.telemetryData?.playerChoices?.[0] || 'unknown';
      if (entryQuestType !== filters.questType) return false;
    }

    // Date range filter
    if (filters.dateRange) {
      const entryDate = new Date(entry.timestamp);
      if (entryDate < filters.dateRange.start || entryDate > filters.dateRange.end) {
        return false;
      }
    }

    // Outcome filter
    if (filters.outcome) {
      const success = filters.outcome === 'success';
      if (entry.result.success !== success) return false;
    }

    // Duration filters
    const duration = (entry.result.durationSeconds || 0) * 1000;
    if (filters.minDuration && duration < filters.minDuration) return false;
    if (filters.maxDuration && duration > filters.maxDuration) return false;

    return true;
  });
}

/**
 * Export data to different formats
 */
export function exportData(
  data: QuestTelemetryEntry[],
  insights: QuestTelemetryInsights | null,
  options: QuestTelemetryExportOptions
): string {
  switch (options.format) {
    case 'csv':
      return exportToCSV(data, insights, options);
    case 'json':
      return exportToJSON(data, insights, options);
    case 'markdown':
      return exportToMarkdown(data, insights, options);
    default:
      throw new Error(`Unsupported export format: ${options.format}`);
  }
}

function exportToCSV(
  data: QuestTelemetryEntry[],
  insights: QuestTelemetryInsights | null,
  options: QuestTelemetryExportOptions
): string {
  const headers = [
    'Quest ID',
    'Timestamp',
    'Success',
    'Duration',
    'Quest Type',
    'Risk Band',
    'Decision Type',
    'Branch Count',
  ];

  const rows = data.map(entry => {
    const riskBand = calculateRiskBand(entry.result);
    const decisionType = extractDecisionType(entry.result.branchDecisions || []);
    
    return [
      entry.questId,
      new Date(entry.timestamp).toISOString(),
      entry.result.success ? 'true' : 'false',
      `${(entry.result.durationSeconds || 0) * 1000}ms`,
      entry.result.telemetryData?.playerChoices?.[0] || 'unknown',
      riskBand,
      decisionType,
      (entry.result.branchDecisions || []).length.toString(),
    ];
  });

  let csv = headers.join(',') + '\n';
  csv += rows.map(row => row.join(',')).join('\n');

  if (options.includeInsights && insights) {
    csv += '\n\nInsights\n';
    csv += `Total Filtered,${insights.totalFiltered}\n`;
    csv += `Success Rate,${(insights.successRate * 100).toFixed(2)}%\n`;
    csv += `Average Duration,${insights.averageDuration.toFixed(2)}ms\n`;
  }

  return csv;
}

function exportToJSON(
  data: QuestTelemetryEntry[],
  insights: QuestTelemetryInsights | null,
  options: QuestTelemetryExportOptions
): string {
  const exportData: Record<string, unknown> = {
    exportedAt: new Date().toISOString(),
    filters: options,
  };

  if (options.includeRawData) {
    exportData.data = data;
  }

  if (options.includeInsights && insights) {
    exportData.insights = insights;
  }

  return JSON.stringify(exportData, null, 2);
}

function exportToMarkdown(
  data: QuestTelemetryEntry[],
  insights: QuestTelemetryInsights | null,
  options: QuestTelemetryExportOptions
): string {
  let markdown = `# Quest Telemetry Export\n\n`;
  markdown += `Exported: ${new Date().toISOString()}\n\n`;

  if (options.includeInsights && insights) {
    markdown += `## Insights\n\n`;
    markdown += `- **Total Filtered**: ${insights.totalFiltered}\n`;
    markdown += `- **Success Rate**: ${(insights.successRate * 100).toFixed(2)}%\n`;
    markdown += `- **Average Duration**: ${insights.averageDuration.toFixed(2)}ms\n\n`;

    markdown += `### Risk Distribution\n\n`;
    Object.entries(insights.riskDistribution).forEach(([risk, count]) => {
      markdown += `- **${risk}**: ${count}\n`;
    });

    markdown += `\n### Decision Distribution\n\n`;
    Object.entries(insights.decisionDistribution).forEach(([decision, count]) => {
      markdown += `- **${decision}**: ${count}\n`;
    });
  }

  if (options.includeRawData) {
    markdown += `\n## Raw Data\n\n`;
    markdown += `| Quest ID | Timestamp | Success | Duration | Type | Risk |\n`;
    markdown += `|----------|-----------|---------|----------|------|------|\n`;

    data.slice(0, 100).forEach(entry => { // Limit to first 100 for readability
      const riskBand = calculateRiskBand(entry.result);
      markdown += `| ${entry.questId} | ${new Date(entry.timestamp).toISOString()} | ${entry.result.success} | ${(entry.result.durationSeconds || 0) * 1000}ms | ${entry.result.telemetryData?.playerChoices?.[0] || 'unknown'} | ${riskBand} |\n`;
    });

    if (data.length > 100) {
      markdown += `\n*... and ${data.length - 100} more entries*\n`;
    }
  }

  return markdown;
}

/**
 * Main hook implementation
 */
export function useQuestTelemetryInspector(
  initialFilters?: Partial<QuestTelemetryFilters>
): UseQuestTelemetryInspectorReturn {
  const { telemetry } = useQuestTelemetry();
  const [filters, setFilters] = useState<QuestTelemetryFilters>(initialFilters || {});
  const [cacheStats, setCacheStats] = useState({ size: 0, lastUpdate: 0, hitRate: 0 });
  const [cacheData, setCacheData] = useState<Map<string, CacheEntry>>(new Map());
  const [cacheHits, setCacheHits] = useState(0);
  const [cacheMisses, setCacheMisses] = useState(0);

  // Generate cache key from filters
  const cacheKey = useMemo(() => {
    return JSON.stringify(filters);
  }, [filters]);

  // Update cache statistics
  const updateCacheStats = useCallback(() => {
    const totalRequests = cacheHits + cacheMisses;
    const hitRate = totalRequests > 0 ? cacheHits / totalRequests : 0;

    setCacheStats({
      size: cacheData.size,
      lastUpdate: Date.now(),
      hitRate,
    });
  }, [cacheData.size, cacheHits, cacheMisses]);

  // Get current timestamp for cache operations
  const getCurrentTimestamp = useCallback(() => Date.now(), []);

  // Save cache to persistence
  const saveCache = useCallback(async () => {
    try {
      await saveData(CACHE_KEY, cacheData);
    } catch (err) {
      console.warn('Failed to save telemetry inspector cache:', err);
    }
  }, [cacheData]);

  // Load cache from persistence on mount
  useEffect(() => {
    const loadCache = async () => {
      try {
        const cached = await loadData<Map<string, CacheEntry>>(CACHE_KEY, new Map());
        if (cached) {
          setCacheData(cached);
          updateCacheStats();
        }
      } catch (err) {
        console.warn('Failed to load telemetry inspector cache:', err);
      }
    };

    loadCache();
  }, [updateCacheStats]);

  // Cache hit/miss tracking effect
  useEffect(() => {
    const cached = cacheData.get(cacheKey);
    const now = getCurrentTimestamp();

    if (cached && (now - cached.timestamp) < CACHE_TTL) {
      // Update cache hits asynchronously
      queueMicrotask(() => {
        setCacheHits(prev => prev + 1);
        updateCacheStats();
      });
    } else {
      // Update cache misses asynchronously
      queueMicrotask(() => {
        setCacheMisses(prev => prev + 1);
        updateCacheStats();
      });
    }
  }, [cacheKey, cacheData, getCurrentTimestamp, updateCacheStats]);

  // Get filtered data with caching
  const filteredData = useMemo(() => {
    const cached = cacheData.get(cacheKey);
    const now = getCurrentTimestamp();

    // Check if we have a valid cache entry
    if (cached && (now - cached.timestamp) < CACHE_TTL) {
      return cached.data;
    }

    // Generate new filtered data
    const allEntries = telemetry.recentQuests;
    const filtered = applyFilters(allEntries, filters);
    const insights = generateInsights(filtered);

    // Update cache (with size limit)
    const newCache = new Map(cacheData);
    if (newCache.size >= MAX_CACHE_SIZE) {
      // Remove oldest entry
      const oldestKey = Array.from(newCache.keys())[0];
      newCache.delete(oldestKey);
    }

    newCache.set(cacheKey, {
      data: filtered,
      insights,
      timestamp: now,
      filters,
    });

    // Trigger async cache save
    queueMicrotask(() => {
      setCacheData(newCache);
      updateCacheStats();
      saveCache();
    });

    return filtered;
  }, [telemetry.recentQuests, filters, cacheKey, getCurrentTimestamp, cacheData, updateCacheStats, saveCache]);

  // Generate insights
  const insights = useMemo(() => {
    const cached = cacheData.get(cacheKey);
    return cached?.insights || generateInsights(filteredData);
  }, [filteredData, cacheKey, cacheData]);

  // Update filters
  const updateFilters = useCallback((newFilters: Partial<QuestTelemetryFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  // Clear filters
  const clearFilters = useCallback(() => {
    setFilters({});
  }, []);

  // Export data
  const exportDataFn = useCallback((options: QuestTelemetryExportOptions) => {
    return exportData(filteredData, insights, options);
  }, [filteredData, insights]);

  // Refresh data
  const refresh = useCallback(() => {
    // Clear cache and force refresh
    setCacheData(new Map());
    setCacheHits(0);
    setCacheMisses(0);
    updateCacheStats();
  }, [updateCacheStats]);

  return {
    filteredData,
    insights,
    filters,
    isLoading: false,
    error: null,
    updateFilters,
    clearFilters,
    exportData: exportDataFn,
    refresh,
    cacheStats,
  };
}
