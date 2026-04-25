/**
 * Crew Rotation Viewer – NP‑145 Phase E Knowledge Base UI
 * 
 * Read-only viewer for crew rotation configurations with filtering,
 * preference persistence, and telemetry tracking.
 * 
 * @since NP‑145
 */

// Extend Window interface for gtag
declare global {
  interface Window {
    gtag?: (command: string, eventName: string, parameters?: Record<string, any>) => void;
  }
}

import React, { useMemo, useState, useCallback } from 'react';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  CrewRotationSlot,
  CrewRotationConfig,
  CrewRotationKpiTargets,
} from '@/balancing/config/idleVillage/crewRotationConfig';
import {
  DEFAULT_CREW_ROTATION_CONFIG,
  CREW_ROTATION_VIEWER_PREFERENCES_KEY,
  getEnabledCrewRotations,
  filterRotationsByTags,
  getSlotsByActivityTags,
} from '@/balancing/config/idleVillage/crewRotationConfig';
import type { CrewRotation } from '@/balancing/config/idleVillage/crewRotationConfig';

type ViewerPreferences = {
  selectedRotationId?: string;
  selectedTags: string[];
  selectedActivityTags: string[];
  showDisabledRotations: boolean;
  showKpiDetails: boolean;
  showPrerequisites: boolean;
  compactView: boolean;
};

/**
 * Zustand store for viewer state and preferences.
 */
interface CrewRotationViewerState {
  preferences: ViewerPreferences;
  setPreferences: (prefs: Partial<ViewerPreferences>) => void;
  resetPreferences: () => void;
}

const useCrewRotationViewerStore = create<CrewRotationViewerState>()(
  persist(
    (set) => ({
      preferences: {
        selectedTags: [],
        selectedActivityTags: [],
        showDisabledRotations: false,
        showKpiDetails: true,
        showPrerequisites: true,
        compactView: false,
      },
      setPreferences: (prefs) =>
        set((state) => ({
          preferences: { ...state.preferences, ...prefs },
        })),
      resetPreferences: () =>
        set({
          preferences: {
            selectedTags: [],
            selectedActivityTags: [],
            showDisabledRotations: false,
            showKpiDetails: true,
            showPrerequisites: true,
            compactView: false,
          },
        }),
    }),
    {
      name: CREW_ROTATION_VIEWER_PREFERENCES_KEY,
      partialize: (state) => ({ preferences: state.preferences }),
    }
  )
);

/**
 * Props for the CrewRotationViewer component.
 */
export interface CrewRotationViewerProps {
  /** Custom crew rotation configuration (uses default if not provided) */
  config?: CrewRotationConfig;
  /** Whether to show the header with title and controls */
  showHeader?: boolean;
  /** Whether to show the filter panel */
  showFilters?: boolean;
  /** Additional CSS class names */
  className?: string;
  /** Callback when a rotation is selected */
  onRotationSelected?: (rotation: CrewRotation) => void;
  /** Callback when a slot is selected */
  onSlotSelected?: (rotation: CrewRotation, slot: CrewRotationSlot) => void;
}

/**
 * KPI display component for visualizing targets and metrics.
 */
const KpiDisplay: React.FC<{
  kpi: CrewRotationKpiTargets;
  compact?: boolean;
  showDetails?: boolean;
}> = ({ kpi, compact = false, showDetails = true }) => {
  if (compact) {
    return (
      <div className="flex gap-2 text-xs">
        <span className="text-amber-300">Stat: {(kpi.minStatMatchScore * 100).toFixed(0)}%</span>
        <span className="text-red-300">Fat: {(kpi.maxFatigueAverage * 100).toFixed(0)}%</span>
        <span className="text-green-300">Spec: {(kpi.minSpecializationScore * 100).toFixed(0)}%</span>
        <span className="text-blue-300">Eff: {kpi.targetEfficiencyMultiplier.toFixed(1)}x</span>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {showDetails && (
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex justify-between">
            <span className="text-slate-400">Min Stat Match:</span>
            <span className="text-amber-300">{(kpi.minStatMatchScore * 100).toFixed(0)}%</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Max Fatigue:</span>
            <span className="text-red-300">{(kpi.maxFatigueAverage * 100).toFixed(0)}%</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Min Specialization:</span>
            <span className="text-green-300">{(kpi.minSpecializationScore * 100).toFixed(0)}%</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Target Efficiency:</span>
            <span className="text-blue-300">{kpi.targetEfficiencyMultiplier.toFixed(1)}x</span>
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Prerequisites display component.
 */
const PrerequisitesDisplay: React.FC<{
  prerequisites: CrewRotationSlot['prerequisites'];
  compact?: boolean;
  showDetails?: boolean;
}> = ({ prerequisites, compact = false, showDetails = true }) => {
  if (compact) {
    const parts = [];
    if (prerequisites.minLevel) parts.push(`Lvl ${prerequisites.minLevel}+`);
    if (prerequisites.maxFatigue) parts.push(`Fat ≤${(prerequisites.maxFatigue * 100).toFixed(0)}%`);
    if (prerequisites.requiredActivityTags?.length) {
      parts.push(`${prerequisites.requiredActivityTags.length} tags`);
    }
    return <span className="text-xs text-slate-400">{parts.join(' • ')}</span>;
  }

  return (
    <div className="space-y-1">
      {showDetails && (
        <div className="text-xs space-y-1">
          {prerequisites.minLevel && (
            <div className="flex justify-between">
              <span className="text-slate-400">Min Level:</span>
              <span className="text-purple-300">{prerequisites.minLevel}</span>
            </div>
          )}
          {prerequisites.maxFatigue && (
            <div className="flex justify-between">
              <span className="text-slate-400">Max Fatigue:</span>
              <span className="text-red-300">{(prerequisites.maxFatigue * 100).toFixed(0)}%</span>
            </div>
          )}
          {prerequisites.requiredActivityTags?.length && (
            <div>
              <span className="text-slate-400">Required Tags:</span>
              <div className="flex flex-wrap gap-1 mt-1">
                {prerequisites.requiredActivityTags.map((tag) => (
                  <span
                    key={tag}
                    className="px-1.5 py-0.5 bg-purple-500/20 text-purple-300 rounded text-xs"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}
          {prerequisites.blacklistedActivityTags?.length && (
            <div>
              <span className="text-slate-400">Blacklisted Tags:</span>
              <div className="flex flex-wrap gap-1 mt-1">
                {prerequisites.blacklistedActivityTags.map((tag) => (
                  <span
                    key={tag}
                    className="px-1.5 py-0.5 bg-red-500/20 text-red-300 rounded text-xs"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

/**
 * Main CrewRotationViewer component.
 */
export const CrewRotationViewer: React.FC<CrewRotationViewerProps> = ({
  config = DEFAULT_CREW_ROTATION_CONFIG,
  showHeader = true,
  showFilters = true,
  className = '',
  onRotationSelected,
  onSlotSelected,
}) => {
  const { preferences, setPreferences } = useCrewRotationViewerStore();
  const [searchQuery, setSearchQuery] = useState('');

  // Get available tags and activity tags from config
  const { availableTags, availableActivityTags } = useMemo(() => {
    const tags = new Set<string>();
    const activityTags = new Set<string>();
    
    config.rotations.forEach(rotation => {
      rotation.tags.forEach(tag => tags.add(tag));
      rotation.slots.forEach(slot => {
        slot.tags.forEach(tag => tags.add(tag));
        slot.supportedActivityTags.forEach(tag => activityTags.add(tag));
      });
    });

    return {
      availableTags: Array.from(tags).sort(),
      availableActivityTags: Array.from(activityTags).sort(),
    };
  }, [config]);

  // Filter rotations based on preferences and search
  const filteredRotations = useMemo(() => {
    let rotations = preferences.showDisabledRotations 
      ? config.rotations 
      : getEnabledCrewRotations(config);

    // Filter by selected tags
    if (preferences.selectedTags.length > 0) {
      rotations = filterRotationsByTags(rotations, preferences.selectedTags);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      rotations = rotations.filter(rotation =>
        rotation.name.toLowerCase().includes(query) ||
        rotation.description?.toLowerCase().includes(query) ||
        rotation.id.toLowerCase().includes(query)
      );
    }

    return rotations;
  }, [config, preferences, searchQuery]);

  // Get selected rotation
  const selectedRotation = useMemo(() => {
    if (!preferences.selectedRotationId) return null;
    return config.rotations.find(r => r.id === preferences.selectedRotationId) || null;
  }, [config, preferences.selectedRotationId]);

  // Get filtered slots for selected rotation
  const filteredSlots = useMemo(() => {
    if (!selectedRotation) return [];
    
    if (preferences.selectedActivityTags.length === 0) {
      return selectedRotation.slots;
    }

    return getSlotsByActivityTags(selectedRotation, preferences.selectedActivityTags);
  }, [selectedRotation, preferences.selectedActivityTags]);

  // Handle rotation selection
  const handleRotationSelect = useCallback((rotation: CrewRotation) => {
    setPreferences({ selectedRotationId: rotation.id });
    onRotationSelected?.(rotation);
    
    // Emit telemetry event
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'crew_rotation_viewed', {
        rotation_id: rotation.id,
        rotation_name: rotation.name,
        tags: rotation.tags.join(','),
      });
    }
  }, [setPreferences, onRotationSelected]);

  // Handle slot selection
  const handleSlotSelect = useCallback((slot: CrewRotationSlot) => {
    if (!selectedRotation) return;
    onSlotSelected?.(selectedRotation, slot);
  }, [selectedRotation, onSlotSelected]);

  // Toggle tag selection
  const toggleTag = useCallback((tag: string, type: 'rotation' | 'activity') => {
    const key = type === 'rotation' ? 'selectedTags' : 'selectedActivityTags';
    const current = preferences[key];
    const isSelected = current.includes(tag);
    
    setPreferences({
      [key]: isSelected ? current.filter(t => t !== tag) : [...current, tag],
    });
  }, [preferences, setPreferences]);

  // Clear all filters
  const clearFilters = useCallback(() => {
    setPreferences({
      selectedTags: [],
      selectedActivityTags: [],
      selectedRotationId: undefined,
    });
    setSearchQuery('');
  }, [setPreferences]);

  return (
    <div className={`crew-rotation-viewer ${className}`}>
      {showHeader && (
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white mb-2">Crew Rotation Knowledge Base</h1>
          <p className="text-slate-400">
            Phase E crew rotation configurations with KPI targets and prerequisites
          </p>
        </div>
      )}

      {showFilters && (
        <div className="mb-6 p-4 bg-black/40 border border-white/10 rounded-lg">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Search
              </label>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search rotations..."
                className="w-full px-3 py-2 bg-black/60 border border-white/10 rounded text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
              />
            </div>

            {/* Show disabled rotations */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="show-disabled"
                checked={preferences.showDisabledRotations}
                onChange={(e) => setPreferences({ showDisabledRotations: e.target.checked })}
                className="mr-2"
              />
              <label htmlFor="show-disabled" className="text-sm text-slate-300">
                Show disabled rotations
              </label>
            </div>

            {/* View options */}
            <div className="flex gap-2">
              <button
                onClick={() => setPreferences({ showKpiDetails: !preferences.showKpiDetails })}
                className={`px-3 py-1 rounded text-xs ${
                  preferences.showKpiDetails
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    : 'bg-white/10 text-slate-400 border border-white/20'
                }`}
              >
                KPI Details
              </button>
              <button
                onClick={() => setPreferences({ showPrerequisites: !preferences.showPrerequisites })}
                className={`px-3 py-1 rounded text-xs ${
                  preferences.showPrerequisites
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    : 'bg-white/10 text-slate-400 border border-white/20'
                }`}
              >
                Prerequisites
              </button>
              <button
                onClick={() => setPreferences({ compactView: !preferences.compactView })}
                className={`px-3 py-1 rounded text-xs ${
                  preferences.compactView
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    : 'bg-white/10 text-slate-400 border border-white/20'
                }`}
              >
                Compact
              </button>
            </div>
          </div>

          {/* Tag filters */}
          <div className="mt-4 space-y-2">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Rotation Tags
              </label>
              <div className="flex flex-wrap gap-1">
                {availableTags.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => toggleTag(tag, 'rotation')}
                    className={`px-2 py-1 rounded text-xs transition-colors ${
                      preferences.selectedTags.includes(tag)
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        : 'bg-white/10 text-slate-400 border border-white/20 hover:bg-white/20'
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Activity Tags
              </label>
              <div className="flex flex-wrap gap-1">
                {availableActivityTags.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => toggleTag(tag, 'activity')}
                    className={`px-2 py-1 rounded text-xs transition-colors ${
                      preferences.selectedActivityTags.includes(tag)
                        ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                        : 'bg-white/10 text-slate-400 border border-white/20 hover:bg-white/20'
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Clear filters */}
          {(preferences.selectedTags.length > 0 || 
            preferences.selectedActivityTags.length > 0 || 
            searchQuery) && (
            <div className="mt-4">
              <button
                onClick={clearFilters}
                className="px-3 py-1 bg-red-500/20 text-red-300 border border-red-500/30 rounded text-xs hover:bg-red-500/30"
              >
                Clear All Filters
              </button>
            </div>
          )}
        </div>
      )}

      {/* Content area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Rotations list */}
        <div className="lg:col-span-1">
          <h2 className="text-lg font-semibold text-white mb-3">
            Rotations ({filteredRotations.length})
          </h2>
          <div className="space-y-2">
            {filteredRotations.map((rotation) => (
              <div
                key={rotation.id}
                onClick={() => handleRotationSelect(rotation)}
                className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                  selectedRotation?.id === rotation.id
                    ? 'bg-amber-500/20 border-amber-500/30'
                    : 'bg-black/40 border-white/10 hover:bg-black/60 hover:border-white/20'
                } ${!rotation.enabled ? 'opacity-50' : ''}`}
              >
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-medium text-white">{rotation.name}</h3>
                  {!rotation.enabled && (
                    <span className="px-2 py-0.5 bg-red-500/20 text-red-300 rounded text-xs">
                      Disabled
                    </span>
                  )}
                </div>
                {rotation.description && (
                  <p className="text-xs text-slate-400 mb-2">{rotation.description}</p>
                )}
                <div className="flex flex-wrap gap-1 mb-2">
                  {rotation.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-1.5 py-0.5 bg-purple-500/20 text-purple-300 rounded text-xs"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                <div className="text-xs text-slate-400">
                  {rotation.slots.length} slots • Version {rotation.version}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Selected rotation details */}
        <div className="lg:col-span-2">
          {selectedRotation ? (
            <div>
              <h2 className="text-lg font-semibold text-white mb-3">
                {selectedRotation.name}
              </h2>
              
              {/* Rotation info */}
              <div className="mb-6 p-4 bg-black/40 border border-white/10 rounded-lg">
                <p className="text-slate-300 mb-3">{selectedRotation.description}</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-slate-400">Version:</span>
                    <span className="ml-2 text-white">{selectedRotation.version}</span>
                  </div>
                  <div>
                    <span className="text-slate-400">Status:</span>
                    <span className={`ml-2 ${selectedRotation.enabled ? 'text-green-300' : 'text-red-300'}`}>
                      {selectedRotation.enabled ? 'Enabled' : 'Disabled'}
                    </span>
                  </div>
                </div>

                {/* Global KPI targets */}
                <div className="mt-4">
                  <h4 className="text-sm font-medium text-white mb-2">Global KPI Targets</h4>
                  <KpiDisplay 
                    kpi={selectedRotation.globalKpiTargets} 
                    compact={preferences.compactView}
                    showDetails={preferences.showKpiDetails}
                  />
                </div>
              </div>

              {/* Slots */}
              <div>
                <h3 className="text-md font-medium text-white mb-3">
                  Slots ({filteredSlots.length})
                </h3>
                <div className="space-y-3">
                  {filteredSlots.map((slot) => (
                    <div
                      key={slot.id}
                      onClick={() => handleSlotSelect(slot)}
                      className="p-4 bg-black/40 border border-white/10 rounded-lg cursor-pointer hover:bg-black/60 hover:border-white/20"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{slot.iconName}</span>
                          <h4 className="font-medium text-white">{slot.label}</h4>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-slate-400">
                            Max: {slot.maxResidents}
                          </span>
                          <span className="text-xs text-amber-300">
                            Priority: {slot.priorityWeight.toFixed(1)}
                          </span>
                          {slot.phaseLocked && (
                            <span className={`px-2 py-0.5 rounded text-xs ${
                              slot.phaseLocked === 'day' 
                                ? 'bg-yellow-500/20 text-yellow-300'
                                : 'bg-blue-500/20 text-blue-300'
                            }`}>
                              {slot.phaseLocked}
                            </span>
                          )}
                        </div>
                      </div>

                      {slot.description && (
                        <p className="text-xs text-slate-400 mb-2">{slot.description}</p>
                      )}

                      {/* Slot tags */}
                      <div className="flex flex-wrap gap-1 mb-3">
                        {slot.tags.map((tag) => (
                          <span
                            key={tag}
                            className="px-1.5 py-0.5 bg-purple-500/20 text-purple-300 rounded text-xs"
                          >
                            {tag}
                          </span>
                        ))}
                        {slot.supportedActivityTags.map((tag) => (
                          <span
                            key={tag}
                            className="px-1.5 py-0.5 bg-green-500/20 text-green-300 rounded text-xs"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>

                      {/* Slot details grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* KPI targets */}
                        <div>
                          <h5 className="text-xs font-medium text-slate-300 mb-1">KPI Targets</h5>
                          <KpiDisplay 
                            kpi={slot.kpiTargets} 
                            compact={preferences.compactView}
                            showDetails={preferences.showKpiDetails}
                          />
                        </div>

                        {/* Prerequisites */}
                        <div>
                          <h5 className="text-xs font-medium text-slate-300 mb-1">Prerequisites</h5>
                          <PrerequisitesDisplay 
                            prerequisites={slot.prerequisites}
                            compact={preferences.compactView}
                            showDetails={preferences.showPrerequisites}
                          />
                        </div>
                      </div>

                      {/* Modifiers */}
                      {slot.modifiers && (
                        <div className="mt-3 pt-3 border-t border-white/10">
                          <h5 className="text-xs font-medium text-slate-300 mb-1">Modifiers</h5>
                          <div className="flex gap-3 text-xs">
                            {slot.modifiers.fatigueMult && (
                              <span className="text-purple-300">
                                Fatigue ×{slot.modifiers.fatigueMult.toFixed(1)}
                              </span>
                            )}
                            {slot.modifiers.riskMult && (
                              <span className="text-red-300">
                                Risk ×{slot.modifiers.riskMult.toFixed(1)}
                              </span>
                            )}
                            {slot.modifiers.yieldMult && (
                              <span className="text-green-300">
                                Yield ×{slot.modifiers.yieldMult.toFixed(1)}
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-slate-400">Select a rotation to view details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CrewRotationViewer;
