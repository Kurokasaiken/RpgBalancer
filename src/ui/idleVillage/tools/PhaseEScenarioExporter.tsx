/**
 * NP-105 – Idle Village Phase E Scenario Exporter
 * 
 * UI component for exporting Phase E scenarios with filters, preview,
 * and download capabilities. Uses the PhaseEScenarioSerializer for data
 * processing and PersistenceService for state management.
 * 
 * @since 2026-01-21
 * @author Cascade
 */

import React, { useState, useCallback, useMemo } from 'react';
import { saveData, loadData } from '@/shared/persistence/PersistenceService';
import type {
  PhaseEScenario,
  createPhaseEScenario,
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
 * Component props
 */
export interface PhaseEScenarioExporterProps {
  /** Optional custom scenario to export */
  scenario?: PhaseEScenario;
  /** Component width */
  width?: number;
  /** Component height */
  height?: number;
  /** Enable debug mode */
  debug?: boolean;
  /** Custom className */
  className?: string;
  /** Export completion callback */
  onExportComplete?: (format: 'json' | 'markdown', stats: PhaseEExportStats) => void;
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
 * Phase E Scenario Exporter Component
 */
export function PhaseEScenarioExporter({
  scenario: externalScenario,
  width = 800,
  height = 600,
  debug = false,
  className = '',
  onExportComplete,
}: PhaseEScenarioExporterProps) {
  // State management
  const [scenario, setScenario] = useState<PhaseEScenario | null>(null);
  const [filters, setFilters] = useState<PhaseEExportFilters>(DEFAULT_EXPORT_FILTERS);
  const [exportFormat, setExportFormat] = useState<'json' | 'markdown'>('json');
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const [previewData, setPreviewData] = useState<string | null>(null);

  // Load or create scenario
  React.useEffect(() => {
    const loadOrCreateScenario = async () => {
      try {
        if (externalScenario) {
          setScenario(externalScenario);
        } else {
          // Try to load from persistence
          const savedScenario = await loadData<PhaseEScenario>(
            'phase_e_scenario_exporter_last_scenario'
          );
          
          if (savedScenario) {
            setScenario(savedScenario);
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
      } catch (error) {
        console.error('Failed to load/create scenario:', error);
        setExportError('Failed to load scenario data');
      }
    };

    loadOrCreateScenario();
  }, [externalScenario]);

  // Save scenario to persistence when it changes
  React.useEffect(() => {
    if (scenario) {
      saveData('phase_e_scenario_exporter_last_scenario', scenario).catch(console.error);
    }
  }, [scenario]);

  // Filter scenario based on current filters
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

  // Calculate export statistics
  const exportStats = useMemo((): PhaseEExportStats | null => {
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

  // Generate preview data
  React.useEffect(() => {
    if (!filteredScenario) return;

    try {
      const preview = exportFormat === 'json' 
        ? serializePhaseEScenario(filteredScenario)
        : phaseEScenarioToMarkdown(filteredScenario);
      
      // Limit preview to first 2000 characters
      const truncatedPreview = preview.length > 2000 
        ? preview.substring(0, 2000) + '\n\n... (truncated for preview)'
        : preview;
      
      setPreviewData(truncatedPreview);
    } catch (error) {
      console.error('Failed to generate preview:', error);
      setPreviewData('Error generating preview');
    }
  }, [filteredScenario, exportFormat]);

  // Export functionality
  const handleExport = useCallback(async () => {
    if (!filteredScenario || isExporting) return;

    setIsExporting(true);
    setExportError(null);

    const startTime = Date.now();

    try {
      let exportData: string;
      let fileName: string;
      let mimeType: string;

      if (exportFormat === 'json') {
        exportData = serializePhaseEScenario(filteredScenario);
        fileName = `phase-e-scenario-${filteredScenario.id}-${Date.now()}.json`;
        mimeType = 'application/json';
      } else {
        exportData = phaseEScenarioToMarkdown(filteredScenario);
        fileName = `phase-e-scenario-${filteredScenario.id}-${Date.now()}.md`;
        mimeType = 'text/markdown';
      }

      // Create blob and trigger download
      const blob = new Blob([exportData], { type: mimeType });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      const exportDurationMs = Date.now() - startTime;
      const fileSizeBytes = new Blob([exportData]).size;

      // Emit telemetry
      const telemetryPayload = createPhaseEScenarioExportedTelemetry(
        filteredScenario,
        exportFormat,
        exportDurationMs,
        fileSizeBytes
      );
      
      emitTelemetryEvent('iv_phasee_exporter_used', telemetryPayload);

      // Call completion callback
      if (onExportComplete && exportStats) {
        onExportComplete(exportFormat, exportStats);
      }

      if (debug) {
        console.log('Export completed:', {
          format: exportFormat,
          fileName,
          fileSizeBytes,
          durationMs: exportDurationMs,
          stats: exportStats,
        });
      }

    } catch (error) {
      console.error('Export failed:', error);
      setExportError('Export failed. Please try again.');
    } finally {
      setIsExporting(false);
    }
  }, [filteredScenario, exportFormat, isExporting, onExportComplete, exportStats, debug]);

  // Filter update handlers
  const updateFilter = useCallback((key: keyof PhaseEExportFilters, value: string | number | boolean) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  }, []);

  // Reset filters
  const resetFilters = useCallback(() => {
    setFilters(DEFAULT_EXPORT_FILTERS);
  }, []);

  if (!scenario) {
    return (
      <div className={`flex items-center justify-center ${className}`} style={{ width, height }}>
        <div className="text-center">
          <div className="text-lg font-semibold mb-2">Loading Scenario...</div>
          <div className="text-sm text-gray-600">Preparing Phase E scenario data</div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white border border-gray-200 rounded-lg shadow-lg ${className}`} style={{ width, height }}>
      <div className="p-6">
        {/* Header */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Phase E Scenario Exporter
          </h2>
          <p className="text-gray-600">
            Export Phase E scenarios with custom filters and preview
          </p>
        </div>

        {/* Scenario Info */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="font-semibold mb-2">Current Scenario</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium">Name:</span> {scenario.name}
            </div>
            <div>
              <span className="font-medium">Version:</span> {scenario.schemaVersion}
            </div>
            <div>
              <span className="font-medium">Residents:</span> {scenario.residents.length}
            </div>
            <div>
              <span className="font-medium">Slots:</span> {scenario.slots.length}
            </div>
          </div>
        </div>

        {/* Export Controls */}
        <div className="mb-6">
          <div className="flex items-center gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Export Format
              </label>
              <select
                value={exportFormat}
                onChange={(e) => setExportFormat(e.target.value as 'json' | 'markdown')}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="json">JSON</option>
                <option value="markdown">Markdown</option>
              </select>
            </div>
            
            <button
              onClick={handleExport}
              disabled={isExporting || !filteredScenario}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {isExporting ? 'Exporting...' : `Export ${exportFormat.toUpperCase()}`}
            </button>
          </div>

          {exportError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
              {exportError}
            </div>
          )}
        </div>

        {/* Filters */}
        <div className="mb-6">
          <h3 className="font-semibold mb-3">Filters</h3>
          
          <div className="grid grid-cols-2 gap-4 mb-4">
            {/* Fatigue Range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fatigue Range: {filters.fatigueMin}% - {filters.fatigueMax}%
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={filters.fatigueMin}
                  onChange={(e) => updateFilter('fatigueMin', parseInt(e.target.value))}
                  className="flex-1"
                />
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={filters.fatigueMax}
                  onChange={(e) => updateFilter('fatigueMax', parseInt(e.target.value))}
                  className="flex-1"
                />
              </div>
            </div>

            {/* Include Locked Slots */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="includeLocked"
                checked={filters.includeLockedSlots}
                onChange={(e) => updateFilter('includeLockedSlots', e.target.checked)}
                className="mr-2"
              />
              <label htmlFor="includeLocked" className="text-sm text-gray-700">
                Include Locked Slots
              </label>
            </div>

            {/* Drop State Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Drop State
              </label>
              <select
                value={filters.dropState}
                onChange={(e) => updateFilter('dropState', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All States</option>
                <option value="valid">Valid</option>
                <option value="invalid">Invalid</option>
                <option value="warning">Warning</option>
                <option value="neutral">Neutral</option>
              </select>
            </div>

            {/* Quest Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Quest Status
              </label>
              <select
                value={filters.questStatus}
                onChange={(e) => updateFilter('questStatus', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="active">Active</option>
                <option value="completed">Completed</option>
                <option value="failed">Failed</option>
                <option value="expired">Expired</option>
              </select>
            </div>
          </div>

          <button
            onClick={resetFilters}
            className="px-3 py-1 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
          >
            Reset Filters
          </button>
        </div>

        {/* Export Statistics */}
        {exportStats && (
          <div className="mb-6 p-4 bg-blue-50 rounded-lg">
            <h3 className="font-semibold mb-2">Export Statistics</h3>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <span className="font-medium">Residents:</span> {exportStats.filteredResidents}/{exportStats.totalResidents}
              </div>
              <div>
                <span className="font-medium">Slots:</span> {exportStats.filteredSlots}/{exportStats.totalSlots}
              </div>
              <div>
                <span className="font-medium">Tags:</span> {exportStats.filteredTags}/{exportStats.totalTags}
              </div>
              <div>
                <span className="font-medium">Drop Feedbacks:</span> {exportStats.filteredDropFeedbackConfigs}/{exportStats.totalDropFeedbackConfigs}
              </div>
              <div>
                <span className="font-medium">Quest Ticks:</span> {exportStats.filteredQuestTimelineTicks}/{exportStats.totalQuestTimelineTicks}
              </div>
            </div>
          </div>
        )}

        {/* Preview */}
        {previewData && (
          <div className="mb-6">
            <h3 className="font-semibold mb-2">Preview ({exportFormat.toUpperCase()})</h3>
            <div className="border border-gray-300 rounded-md p-4 bg-gray-50 max-h-64 overflow-y-auto">
              <pre className="text-xs font-mono whitespace-pre-wrap">
                {previewData}
              </pre>
            </div>
          </div>
        )}

        {/* Debug Info */}
        {debug && (
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded text-sm">
            <div className="font-semibold mb-1">Debug Info:</div>
            <div>Scenario ID: {scenario.id}</div>
            <div>Export Format: {exportFormat}</div>
            <div>Is Exporting: {isExporting}</div>
            <div>Preview Length: {previewData?.length || 0}</div>
          </div>
        )}
      </div>
    </div>
  );
}
