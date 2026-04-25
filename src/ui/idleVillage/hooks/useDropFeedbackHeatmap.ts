/**
 * Drop Feedback Heatmap Hook
 * 
 * Aggregates drop feedback telemetry data and provides heatmap dataset.
 * Uses PersistenceService for data storage and retrieval.
 * 
 * @module idleVillage/hooks/useDropFeedbackHeatmap
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import type { DropFeedbackTelemetryPayload } from '../utils/dropFeedbackTelemetry';
import {
  saveData,
  loadData,
  clearData as clearPersistedData,
} from '@/shared/persistence/PersistenceService';

/**
 * Aggregated feedback data for a single slot
 */
export interface SlotFeedbackData {
  /** Slot identifier (activityId or location) */
  slotId: string;
  /** Count of valid feedback events */
  validCount: number;
  /** Count of invalid feedback events */
  invalidCount: number;
  /** Count of warning feedback events */
  warningCount: number;
  /** Count of blocked feedback events */
  blockedCount: number;
  /** Total feedback events */
  totalCount: number;
  /** Most recent event timestamp */
  lastEventTimestamp: number;
  /** Most common validation rule */
  topValidationRule?: string;
}

/**
 * Heatmap dataset with aggregated slot data
 */
export interface HeatmapDataset {
  /** Map of slot ID to feedback data */
  slots: Map<string, SlotFeedbackData>;
  /** Overall statistics */
  stats: {
    totalEvents: number;
    validEvents: number;
    invalidEvents: number;
    warningEvents: number;
    blockedEvents: number;
    uniqueSlots: number;
    dateRange: {
      start: number;
      end: number;
    };
  };
  /** Top invalid hotspots */
  hotspots: Array<{
    slotId: string;
    invalidCount: number;
    percentage: number;
  }>;
}

/**
 * Filter options for heatmap data
 */
export interface HeatmapFilters {
  /** Filter by feedback type */
  feedbackTypes?: Array<'valid' | 'invalid' | 'warning' | 'blocked'>;
  /** Filter by date range */
  dateRange?: {
    start: number;
    end: number;
  };
  /** Filter by slot IDs */
  slotIds?: string[];
  /** Minimum event count threshold */
  minEventCount?: number;
}

/**
 * Hook for managing drop feedback heatmap data
 * 
 * @param filters - Optional filters for data aggregation
 * @returns Heatmap dataset and control functions
 */
export function useDropFeedbackHeatmap(filters?: HeatmapFilters) {
  const [rawEvents, setRawEvents] = useState<DropFeedbackTelemetryPayload[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const PERSISTENCE_KEY = 'idle_village_drop_feedback_events';

  const persistEvents = useCallback(async (events: DropFeedbackTelemetryPayload[]) => {
    try {
      await saveData(PERSISTENCE_KEY, events);
    } catch (persistError) {
      console.warn('[DropFeedbackHeatmap] Failed to persist events', persistError);
      setError(
        persistError instanceof Error
          ? persistError
          : new Error('Failed to persist drop feedback events'),
      );
    }
  }, [PERSISTENCE_KEY]);

  /**
   * Load telemetry events from storage
   */
  const loadEvents = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const events = await loadData<DropFeedbackTelemetryPayload[]>(PERSISTENCE_KEY, []);
      setRawEvents(events);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load events'));
    } finally {
      setLoading(false);
    }
  }, [PERSISTENCE_KEY]);

  /**
   * Add a new telemetry event
   */
  const addEvent = useCallback((event: DropFeedbackTelemetryPayload) => {
    setRawEvents(prev => {
      const updated = [...prev, event];
      void persistEvents(updated);
      return updated;
    });
  }, [persistEvents]);

  /**
   * Clear all telemetry events
   */
  const clearEvents = useCallback(() => {
    setRawEvents([]);
    void clearPersistedData(PERSISTENCE_KEY).catch((persistError) => {
      console.warn('[DropFeedbackHeatmap] Failed to clear persisted events', persistError);
    });
  }, [PERSISTENCE_KEY]);

  /**
   * Filter events based on provided filters
   */
  const filteredEvents = useMemo(() => {
    let events = rawEvents;

    if (filters?.feedbackTypes && filters.feedbackTypes.length > 0) {
      events = events.filter(e => filters.feedbackTypes!.includes(e.feedbackType));
    }

    if (filters?.dateRange) {
      events = events.filter(
        e => e.timestamp >= filters.dateRange!.start && e.timestamp <= filters.dateRange!.end
      );
    }

    if (filters?.slotIds && filters.slotIds.length > 0) {
      events = events.filter(e => e.activityId && filters.slotIds!.includes(e.activityId));
    }

    return events;
  }, [rawEvents, filters]);

  /**
   * Aggregate events into heatmap dataset
   */
  const dataset = useMemo<HeatmapDataset>(() => {
    const slots = new Map<string, SlotFeedbackData>();
    const validationRuleCounts = new Map<string, Map<string, number>>();

    // Aggregate events by slot
    filteredEvents.forEach(event => {
      const slotId = event.activityId || 'unknown';
      
      if (!slots.has(slotId)) {
        slots.set(slotId, {
          slotId,
          validCount: 0,
          invalidCount: 0,
          warningCount: 0,
          blockedCount: 0,
          totalCount: 0,
          lastEventTimestamp: 0,
        });
      }

      const slotData = slots.get(slotId)!;
      
      // Increment counts
      slotData.totalCount++;
      switch (event.feedbackType) {
        case 'valid':
          slotData.validCount++;
          break;
        case 'invalid':
          slotData.invalidCount++;
          break;
        case 'warning':
          slotData.warningCount++;
          break;
        case 'blocked':
          slotData.blockedCount++;
          break;
      }

      // Track validation rules
      if (event.validationRule) {
        if (!validationRuleCounts.has(slotId)) {
          validationRuleCounts.set(slotId, new Map());
        }
        const ruleCounts = validationRuleCounts.get(slotId)!;
        ruleCounts.set(event.validationRule, (ruleCounts.get(event.validationRule) || 0) + 1);
      }

      // Update last event timestamp
      if (event.timestamp > slotData.lastEventTimestamp) {
        slotData.lastEventTimestamp = event.timestamp;
      }
    });

    // Determine top validation rule for each slot
    validationRuleCounts.forEach((ruleCounts, slotId) => {
      const slotData = slots.get(slotId);
      if (slotData) {
        let maxCount = 0;
        let topRule = '';
        ruleCounts.forEach((count, rule) => {
          if (count > maxCount) {
            maxCount = count;
            topRule = rule;
          }
        });
        slotData.topValidationRule = topRule;
      }
    });

    // Apply minimum event count filter
    if (filters?.minEventCount) {
      Array.from(slots.keys()).forEach(slotId => {
        const slotData = slots.get(slotId)!;
        if (slotData.totalCount < filters.minEventCount!) {
          slots.delete(slotId);
        }
      });
    }

    // Calculate overall statistics
    let totalEvents = 0;
    let validEvents = 0;
    let invalidEvents = 0;
    let warningEvents = 0;
    let blockedEvents = 0;
    let minTimestamp = Infinity;
    let maxTimestamp = 0;

    slots.forEach(slotData => {
      totalEvents += slotData.totalCount;
      validEvents += slotData.validCount;
      invalidEvents += slotData.invalidCount;
      warningEvents += slotData.warningCount;
      blockedEvents += slotData.blockedCount;
      
      if (slotData.lastEventTimestamp < minTimestamp) {
        minTimestamp = slotData.lastEventTimestamp;
      }
      if (slotData.lastEventTimestamp > maxTimestamp) {
        maxTimestamp = slotData.lastEventTimestamp;
      }
    });

    // Calculate top invalid hotspots
    const hotspots = Array.from(slots.values())
      .filter(slot => slot.invalidCount > 0)
      .sort((a, b) => b.invalidCount - a.invalidCount)
      .slice(0, 10)
      .map(slot => ({
        slotId: slot.slotId,
        invalidCount: slot.invalidCount,
        percentage: totalEvents > 0 ? (slot.invalidCount / totalEvents) * 100 : 0,
      }));

    return {
      slots,
      stats: {
        totalEvents,
        validEvents,
        invalidEvents,
        warningEvents,
        blockedEvents,
        uniqueSlots: slots.size,
        dateRange: {
          start: minTimestamp === Infinity ? 0 : minTimestamp,
          end: maxTimestamp,
        },
      },
      hotspots,
    };
  }, [filteredEvents, filters?.minEventCount]);

  /**
   * Export dataset to JSON
   */
  const exportJSON = useCallback(() => {
    const exportData = {
      metadata: {
        exportTimestamp: Date.now(),
        filters,
      },
      stats: dataset.stats,
      slots: Array.from(dataset.slots.values()),
      hotspots: dataset.hotspots,
    };

    return JSON.stringify(exportData, null, 2);
  }, [dataset, filters]);

  /**
   * Export dataset to Markdown
   */
  const exportMarkdown = useCallback(() => {
    let md = '# Drop Feedback Heatmap Report\n\n';
    md += `**Generated**: ${new Date().toISOString()}\n\n`;
    
    md += '## Statistics\n\n';
    md += `- **Total Events**: ${dataset.stats.totalEvents}\n`;
    md += `- **Valid**: ${dataset.stats.validEvents} (${((dataset.stats.validEvents / dataset.stats.totalEvents) * 100).toFixed(1)}%)\n`;
    md += `- **Invalid**: ${dataset.stats.invalidEvents} (${((dataset.stats.invalidEvents / dataset.stats.totalEvents) * 100).toFixed(1)}%)\n`;
    md += `- **Warning**: ${dataset.stats.warningEvents} (${((dataset.stats.warningEvents / dataset.stats.totalEvents) * 100).toFixed(1)}%)\n`;
    md += `- **Blocked**: ${dataset.stats.blockedEvents} (${((dataset.stats.blockedEvents / dataset.stats.totalEvents) * 100).toFixed(1)}%)\n`;
    md += `- **Unique Slots**: ${dataset.stats.uniqueSlots}\n\n`;

    md += '## Top Invalid Hotspots\n\n';
    md += '| Rank | Slot ID | Invalid Count | Percentage |\n';
    md += '| --- | --- | --- | --- |\n';
    dataset.hotspots.forEach((hotspot, i) => {
      md += `| ${i + 1} | ${hotspot.slotId} | ${hotspot.invalidCount} | ${hotspot.percentage.toFixed(1)}% |\n`;
    });
    md += '\n';

    md += '## Slot Details\n\n';
    md += '| Slot ID | Valid | Invalid | Warning | Blocked | Total | Top Rule |\n';
    md += '| --- | --- | --- | --- | --- | --- | --- |\n';
    Array.from(dataset.slots.values())
      .sort((a, b) => b.totalCount - a.totalCount)
      .forEach(slot => {
        md += `| ${slot.slotId} | ${slot.validCount} | ${slot.invalidCount} | ${slot.warningCount} | ${slot.blockedCount} | ${slot.totalCount} | ${slot.topValidationRule || '-'} |\n`;
      });

    return md;
  }, [dataset]);

  // Load events on mount
  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  return {
    dataset,
    loading,
    error,
    addEvent,
    clearEvents,
    refreshData: loadEvents,
    exportJSON,
    exportMarkdown,
  };
}

/**
 * Default export for convenience
 */
export default useDropFeedbackHeatmap;
