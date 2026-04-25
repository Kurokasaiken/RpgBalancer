/**
 * NP-105 – Idle Village Phase E Scenario Exporter Hook
 * 
 * Custom hook for managing Phase E scenario export state with
 * PersistenceService integration and telemetry tracking.
 * 
 * @since 2026-01-21
 * @author Cascade
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { saveData, loadData } from '@/shared/persistence/PersistenceService';
import type {
  PhaseEScenario,
  createPhaseEScenario,
  validatePhaseEScenario,
  serializePhaseEScenario,
  phaseEScenarioToMarkdown,
  createPhaseEScenarioExportedTelemetry,
} from '@/balancing/idleVillage/PhaseEScenarioSerializer';

/**
 * Export filter configuration
 */
export interface PhaseEExportFilters {
  /** Selected resident IDs */
  residentIds: string[];
  /** Selected slot IDs */
  slotIds: string[];
  /** Selected tag filters */
  tagFilters: string[];
  /** Minimum fatigue threshold (0-100) */
  fatigueMin: number;
  /** Maximum fatigue threshold (0-100) */
  fatigueMax: number;
  /** Include locked slots */
  includeLockedSlots: boolean;
  /** Drop state filter */
  dropState: 'all' | 'valid' | 'invalid' | 'warning' | 'neutral';
  /** Quest status filter */
  questStatus: 'all' | 'pending' | 'active' | 'completed' | 'failed' | 'expired';
}

/**
 * Export statistics
 */
export interface PhaseEExportStats {
  /** Total residents before filtering */
  totalResidents: number;
  /** Total slots before filtering */
  totalSlots: number;
  /** Total tags before filtering */
  totalTags: number;
  /** Total drop feedback configs before filtering */
  totalDropFeedbackConfigs: number;
  /** Total quest timeline ticks before filtering */
  totalQuestTimelineTicks: number;
  /** Filtered counts */
  filteredResidents: number;
  filteredSlots: number;
  filteredTags: number;
  filteredDropFeedbackConfigs: number;
  filteredQuestTimelineTicks: number;
}

/**
 * Export result
 */
export interface PhaseEExportResult {
  /** Exported data */
  data: string;
  /** File name */
  fileName: string;
  /** MIME type */
  mimeType: string;
  /** File size in bytes */
  fileSizeBytes: number;
  /** Export duration in milliseconds */
  exportDurationMs: number;
  /** Export statistics */
  stats: PhaseEExportStats;
}

/**
 * Hook return type
 */
export interface UsePhaseEScenarioExportReturn {
  /** Current scenario */
  scenario: PhaseEScenario | null;
  /** Loading state */
  isLoading: boolean;
  /** Error state */
  error: string | null;
  /** Current filters */
  filters: PhaseEExportFilters;
  /** Export format */
  exportFormat: 'json' | 'markdown';
  /** Export statistics */
  exportStats: PhaseEExportStats | null;
  /** Filtered scenario */
  filteredScenario: PhaseEScenario | null;
  /** Update scenario */
  updateScenario: (scenario: PhaseEScenario) => Promise<void>;
  /** Update filters */
  updateFilters: (filters: Partial<PhaseEExportFilters>) => void;
  /** Reset filters */
  resetFilters: () => void;
  /** Export scenario */
  exportScenario: (format?: 'json' | 'markdown') => Promise<PhaseEExportResult>;
  /** Set export format */
  setExportFormat: (format: 'json' | 'markdown') => void;
  /** Load scenario from JSON */
  loadScenarioFromJSON: (jsonString: string) => Promise<void>;
  /** Export scenario to JSON string */
  exportScenarioToJSON: () => string;
  /** Export scenario to Markdown string */
  exportScenarioToMarkdown: () => string;
}

/**
 * Default export filters
 */
const DEFAULT_EXPORT_FILTERS: PhaseEExportFilters = {
  residentIds: [],
  slotIds: [],
  tagFilters: [],
  fatigueMin: 0,
  fatigueMax: 100,
  includeLockedSlots: false,
  dropState: 'all',
  questStatus: 'all',
};

/**
 * Persistence key for Phase E scenario exporter
 */
const PHASE_E_EXPORTER_PERSISTENCE_KEY = 'phase_e_scenario_exporter_state';

/**
 * Simple telemetry event emitter for Phase E Scenario Exporter
 * In a full implementation, this would integrate with the central analytics system
 */
function emitTelemetryEvent(eventType: string, data: Record<string, unknown>): void {
  // For now, just log to console. In production, this would emit to the analytics system
  console.log(`[Phase E Exporter Telemetry] ${eventType}:`, data);
  
  // TODO: Integrate with central analytics system when available
  // Example: analytics.emit(eventType, data);
}

/**
 * Phase E Scenario Export Hook
 */
export function usePhaseEScenarioExport(
  initialScenario?: PhaseEScenario
): UsePhaseEScenarioExportReturn {
  // State management
  const [scenario, setScenario] = useState<PhaseEScenario | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<PhaseEExportFilters>(DEFAULT_EXPORT_FILTERS);
  const [exportFormat, setExportFormat] = useState<'json' | 'markdown'>('json');

  /**
   * Save state to persistence
   */
  const saveState = useCallback(async (state: {
    scenario: PhaseEScenario | null;
    filters: PhaseEExportFilters;
    exportFormat: 'json' | 'markdown';
  }) => {
    try {
      await saveData(PHASE_E_EXPORTER_PERSISTENCE_KEY, state);
    } catch (err) {
      console.error('Failed to save Phase E exporter state:', err);
    }
  }, []);

  /**
   * Load state from persistence
   */
  const loadState = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      if (initialScenario) {
        setScenario(initialScenario);
      } else {
        // Try to load from persistence
        const savedState = await loadData<{
          scenario: PhaseEScenario | null;
          filters: PhaseEExportFilters;
          exportFormat: 'json' | 'markdown';
        }>(PHASE_E_EXPORTER_PERSISTENCE_KEY, {
          scenario: null,
          filters: DEFAULT_EXPORT_FILTERS,
          exportFormat: 'json',
        });

        if (savedState.scenario) {
          setScenario(savedState.scenario);
          setFilters(savedState.filters);
          setExportFormat(savedState.exportFormat);
        } else {
          // Create a sample scenario for demonstration
          const sampleScenario = createPhaseEScenario({
            name: 'Sample Phase E Scenario',
            description: 'A sample scenario demonstrating the Phase E exporter functionality',
            residents: [
              {
                id: 'resident-1',
                name: 'Alice',
                status: 'available',
                fatigue: 25,
                hp: 80,
                maxHp: 100,
                statTags: ['strength', 'perception'],
                isHero: false,
                isInjured: false,
                survivalCount: 5,
                survivalScore: 75,
              },
              {
                id: 'resident-2',
                name: 'Bob',
                status: 'exhausted',
                fatigue: 85,
                hp: 60,
                maxHp: 100,
                statTags: ['agility', 'intelligence'],
                isHero: true,
                isInjured: false,
                survivalCount: 3,
                survivalScore: 60,
              },
            ],
            slots: [
              {
                id: 'slot-1',
                activityId: 'forest-gathering',
                name: 'Forest Gathering',
                slotTags: ['village_job', 'outdoor'],
                maxCrew: 3,
                currentOccupants: 2,
                statRequirements: {
                  allOf: ['strength'],
                  anyOf: ['perception', 'agility'],
                },
                isLocked: false,
              },
              {
                id: 'slot-2',
                activityId: 'library-study',
                name: 'Library Study',
                slotTags: ['village_job', 'indoor'],
                maxCrew: 2,
                currentOccupants: 1,
                statRequirements: {
                  allOf: ['intelligence'],
                },
                isLocked: true,
              },
            ],
            tagDefinitions: [
              {
                id: 'strength',
                name: 'Strength',
                category: 'stat',
                color: '#ff6b6b',
                description: 'Physical strength attribute',
              },
              {
                id: 'village_job',
                name: 'Village Job',
                category: 'activity_type',
                color: '#4ecdc4',
                description: 'Regular village work activities',
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
                tick: 0,
                questId: 'quest-1',
                questName: 'Gather Resources',
                status: 'active',
                progress: 0.3,
                priority: 'normal',
                questType: 'main',
                timeRemainingTicks: 50,
                participatingResidents: ['resident-1'],
              },
            ],
          });
          setScenario(sampleScenario);
        }
      }
    } catch (err) {
      console.error('Failed to load Phase E exporter state:', err);
      setError('Failed to load saved state');
    } finally {
      setIsLoading(false);
    }
  }, [initialScenario]);

  /**
   * Update scenario
   */
  const updateScenario = useCallback(async (newScenario: PhaseEScenario) => {
    try {
      const validatedScenario = validatePhaseEScenario(newScenario);
      setScenario(validatedScenario);
      await saveState({
        scenario: validatedScenario,
        filters,
        exportFormat,
      });

      // Emit telemetry
      emitTelemetryEvent('iv_phasee_scenario_updated', {
        scenarioId: validatedScenario.id,
        scenarioName: validatedScenario.name,
        residentCount: validatedScenario.residents.length,
        slotCount: validatedScenario.slots.length,
        timestamp: Date.now(),
      });
    } catch (err) {
      console.error('Failed to update scenario:', err);
      setError('Failed to update scenario');
      throw err;
    }
  }, [filters, exportFormat, saveState]);

  /**
   * Update filters
   */
  const updateFilters = useCallback((newFilters: Partial<PhaseEExportFilters>) => {
    const updatedFilters = { ...filters, ...newFilters };
    setFilters(updatedFilters);
    saveState({
      scenario,
      filters: updatedFilters,
      exportFormat,
    });
  }, [scenario, exportFormat, saveState, filters]);

  /**
   * Reset filters
   */
  const resetFilters = useCallback(() => {
    setFilters(DEFAULT_EXPORT_FILTERS);
    saveState({
      scenario,
      filters: DEFAULT_EXPORT_FILTERS,
      exportFormat,
    });
  }, [scenario, exportFormat, saveState]);

  /**
   * Set export format
   */
  const setExportFormatState = useCallback((format: 'json' | 'markdown') => {
    setExportFormat(format);
    saveState({
      scenario,
      filters,
      exportFormat: format,
    });
  }, [scenario, filters, saveState]);

  /**
   * Filter scenario based on current filters
   */
  const filteredScenario = useMemo(() => {
    if (!scenario) return null;

    const filteredResidents = scenario.residents.filter(resident => {
      // Resident ID filter
      if (filters.residentIds.length > 0 && !filters.residentIds.includes(resident.id)) {
        return false;
      }
      // Fatigue range filter
      if (resident.fatigue < filters.fatigueMin || resident.fatigue > filters.fatigueMax) {
        return false;
      }
      return true;
    });

    const filteredSlots = scenario.slots.filter(slot => {
      // Slot ID filter
      if (filters.slotIds.length > 0 && !filters.slotIds.includes(slot.id)) {
        return false;
      }
      // Locked slots filter
      if (!filters.includeLockedSlots && slot.isLocked) {
        return false;
      }
      // Tag filter
      if (filters.tagFilters.length > 0) {
        const hasMatchingTag = filters.tagFilters.some(tag => 
          slot.slotTags.includes(tag)
        );
        if (!hasMatchingTag) return false;
      }
      return true;
    });

    const filteredDropFeedbackConfigs = scenario.dropFeedbackConfigs.filter(config => {
      // Drop state filter
      if (filters.dropState !== 'all' && config.dropState !== filters.dropState) {
        return false;
      }
      return true;
    });

    const filteredQuestTimelineTicks = scenario.questTimelineTicks.filter(tick => {
      // Quest status filter
      if (filters.questStatus !== 'all' && tick.status !== filters.questStatus) {
        return false;
      }
      return true;
    });

    // Filter tags based on usage in filtered data
    const usedTagIds = new Set([
      ...filteredResidents.flatMap(r => r.statTags),
      ...filteredSlots.flatMap(s => s.slotTags),
    ]);
    const filteredTags = scenario.tagDefinitions.filter(tag => 
      usedTagIds.has(tag.id)
    );

    return {
      ...scenario,
      residents: filteredResidents,
      slots: filteredSlots,
      tagDefinitions: filteredTags,
      dropFeedbackConfigs: filteredDropFeedbackConfigs,
      questTimelineTicks: filteredQuestTimelineTicks,
      metadata: {
        ...scenario.metadata,
        filterCriteria: {
          crewIds: filters.residentIds,
          tagFilters: filters.tagFilters,
          fatigueMin: filters.fatigueMin,
          fatigueMax: filters.fatigueMax,
          includeLockedSlots: filters.includeLockedSlots,
        },
      },
    };
  }, [scenario, filters]);

  /**
   * Calculate export statistics
   */
  const exportStats = useMemo(() => {
    if (!scenario || !filteredScenario) return null;

    return {
      totalResidents: scenario.residents.length,
      totalSlots: scenario.slots.length,
      totalTags: scenario.tagDefinitions.length,
      totalDropFeedbackConfigs: scenario.dropFeedbackConfigs.length,
      totalQuestTimelineTicks: scenario.questTimelineTicks.length,
      filteredResidents: filteredScenario.residents.length,
      filteredSlots: filteredScenario.slots.length,
      filteredTags: filteredScenario.tagDefinitions.length,
      filteredDropFeedbackConfigs: filteredScenario.dropFeedbackConfigs.length,
      filteredQuestTimelineTicks: filteredScenario.questTimelineTicks.length,
    };
  }, [scenario, filteredScenario]);

  /**
   * Export scenario
   */
  const exportScenario = useCallback(async (format: 'json' | 'markdown' = exportFormat): Promise<PhaseEExportResult> => {
    if (!filteredScenario) {
      throw new Error('No scenario available for export');
    }

    const startTime = Date.now();

    try {
      let exportData: string;
      let fileName: string;
      let mimeType: string;

      if (format === 'json') {
        exportData = serializePhaseEScenario(filteredScenario);
        fileName = `phase-e-scenario-${filteredScenario.id}-${Date.now()}.json`;
        mimeType = 'application/json';
      } else {
        exportData = phaseEScenarioToMarkdown(filteredScenario);
        fileName = `phase-e-scenario-${filteredScenario.id}-${Date.now()}.md`;
        mimeType = 'text/markdown';
      }

      const exportDurationMs = Date.now() - startTime;
      const fileSizeBytes = new Blob([exportData]).size;

      // Emit telemetry
      const telemetryPayload = createPhaseEScenarioExportedTelemetry(
        filteredScenario,
        format,
        exportDurationMs,
        fileSizeBytes
      );
      
      emitTelemetryEvent('iv_phasee_exporter_used', telemetryPayload);

      return {
        data: exportData,
        fileName,
        mimeType,
        fileSizeBytes,
        exportDurationMs,
        stats: exportStats!,
      };
    } catch (err) {
      console.error('Export failed:', err);
      throw new Error('Export failed. Please try again.');
    }
  }, [filteredScenario, exportFormat, exportStats]);

  /**
   * Load scenario from JSON
   */
  const loadScenarioFromJSON = useCallback(async (jsonString: string): Promise<void> => {
    try {
      const parsedData = JSON.parse(jsonString);
      const validatedScenario = validatePhaseEScenario(parsedData);
      await updateScenario(validatedScenario);
    } catch (err) {
      console.error('Failed to load scenario from JSON:', err);
      setError('Failed to load scenario from JSON');
      throw err;
    }
  }, [updateScenario]);

  /**
   * Export scenario to JSON string
   */
  const exportScenarioToJSON = useCallback((): string => {
    if (!scenario) {
      throw new Error('No scenario available');
    }
    return serializePhaseEScenario(scenario);
  }, [scenario]);

  /**
   * Export scenario to Markdown string
   */
  const exportScenarioToMarkdownString = useCallback((): string => {
    if (!scenario) {
      throw new Error('No scenario available');
    }
    return phaseEScenarioToMarkdown(scenario);
  }, [scenario]);

  // Initialize
  useEffect(() => {
    loadState();
  }, [loadState]);

  return {
    scenario,
    isLoading,
    error,
    filters,
    exportFormat,
    exportStats,
    filteredScenario,
    updateScenario,
    updateFilters,
    resetFilters,
    exportScenario,
    setExportFormat: setExportFormatState,
    loadScenarioFromJSON,
    exportScenarioToJSON,
    exportScenarioToMarkdown: exportScenarioToMarkdownString,
  };
}
