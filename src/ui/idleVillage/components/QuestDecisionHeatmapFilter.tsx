/**
 * Quest Decision Heatmap Filter Component - NP-022
 * 
 * Advanced filtering system for quest decision heatmap.
 * Provides multi-select filters, search functionality, and preset management.
 * 
 * @since 2026-01-13
 * @author Cascade
 */

import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { createSandboxDiagnostics } from '../utils/sandboxDiagnostics';
import {
  type QuestDecisionHeatmapConfig,
  type FilterConfig,
  type QuestDecisionType,
  type QuestPriority,
  type QuestCategory,
  DEFAULT_QUEST_DECISION_HEATMAP_CONFIG,
} from '../config/questDecisionHeatmapConfig';

const diagnostics = createSandboxDiagnostics('QuestDecisionHeatmapFilter', 'filter');

/**
 * Filter state interface
 */
export interface QuestDecisionFilterState {
  decisionTypes: QuestDecisionType[];
  priorities: QuestPriority[];
  categories: QuestCategory[];
  outcomes: ('success' | 'failure' | 'partial' | 'pending')[];
  timeRange?: {
    start: number;
    end: number;
  };
  regions: string[];
  zones: string[];
  decisionMakers: string[];
  searchText: string;
}

/**
 * Filter preset interface
 */
export interface FilterPreset {
  id: string;
  name: string;
  description?: string;
  filters: QuestDecisionFilterState;
  isDefault?: boolean;
  createdAt: number;
}

/**
 * Props for QuestDecisionHeatmapFilter component
 */
export interface QuestDecisionHeatmapFilterProps {
  /** Configuration for the filter */
  config?: Partial<FilterConfig>;
  /** Current filter state */
  filters?: QuestDecisionFilterState;
  /** Available options for filters */
  options?: {
    decisionTypes: QuestDecisionType[];
    priorities: QuestPriority[];
    categories: QuestCategory[];
    outcomes: ('success' | 'failure' | 'partial' | 'pending')[];
    regions: string[];
    zones: string[];
    decisionMakers: string[];
  };
  /** Callback for filter changes */
  onFiltersChange?: (filters: QuestDecisionFilterState) => void;
  /** Callback for preset selection */
  onPresetSelect?: (preset: FilterPreset) => void;
  /** Custom CSS class names */
  className?: string;
  /** Whether filter is visible */
  visible?: boolean;
  /** Whether to show search */
  showSearch?: boolean;
  /** Whether to show presets */
  showPresets?: boolean;
}

/**
 * Individual filter group component
 */
interface FilterGroupProps {
  title: string;
  options: Array<{ value: string; label: string; count?: number }>;
  selectedValues: string[];
  multiSelect?: boolean;
  showCounts?: boolean;
  onChange: (values: string[]) => void;
  searchable?: boolean;
  maxVisible?: number;
}

const FilterGroup: React.FC<FilterGroupProps> = ({
  title,
  options,
  selectedValues,
  multiSelect = true,
  showCounts = true,
  onChange,
  searchable = false,
  maxVisible = 10,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isExpanded, setIsExpanded] = useState(true);

  const filteredOptions = useMemo(() => {
    let filtered = options;
    
    if (searchable && searchTerm) {
      filtered = options.filter(option =>
        option.label.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    return filtered.slice(0, maxVisible);
  }, [options, searchTerm, searchable, maxVisible]);

  const handleValueChange = useCallback((value: string) => {
    if (multiSelect) {
      const newValues = selectedValues.includes(value)
        ? selectedValues.filter(v => v !== value)
        : [...selectedValues, value];
      onChange(newValues);
    } else {
      onChange([value]);
    }
  }, [selectedValues, multiSelect, onChange]);

  const handleSelectAll = useCallback(() => {
    onChange(filteredOptions.map(option => option.value));
  }, [filteredOptions, onChange]);

  const handleClearAll = useCallback(() => {
    onChange([]);
  }, [onChange]);

  return (
    <div className="bg-gray-800 border border-gray-600 rounded-lg p-3">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-sm font-semibold text-white">{title}</h4>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-gray-400 hover:text-white transition-colors p-1"
        >
          <span className={`transform transition-transform ${isExpanded ? '' : 'rotate-90'}`}>
            ▶
          </span>
        </button>
      </div>

      {isExpanded && (
        <>
          {searchable && (
            <div className="mb-2">
              <input
                type="text"
                placeholder={`Search ${title.toLowerCase()}...`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-gray-700 text-white text-xs rounded px-2 py-1 border border-gray-600 focus:outline-none focus:border-blue-500"
              />
            </div>
          )}

          {multiSelect && (
            <div className="flex items-center space-x-2 mb-2">
              <button
                onClick={handleSelectAll}
                className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded transition-colors"
              >
                All
              </button>
              <button
                onClick={handleClearAll}
                className="text-xs bg-gray-600 hover:bg-gray-700 text-white px-2 py-1 rounded transition-colors"
              >
                Clear
              </button>
            </div>
          )}

          <div className="space-y-1 max-h-32 overflow-y-auto">
            {filteredOptions.map(option => (
              <label
                key={option.value}
                className="flex items-center space-x-2 cursor-pointer hover:bg-gray-700 p-1 rounded"
              >
                <input
                  type={multiSelect ? 'checkbox' : 'radio'}
                  checked={selectedValues.includes(option.value)}
                  onChange={() => handleValueChange(option.value)}
                  className="text-blue-500 focus:ring-blue-500 bg-gray-700 border-gray-600"
                />
                <span className="text-xs text-gray-300 flex-1">{option.label}</span>
                {showCounts && option.count !== undefined && (
                  <span className="text-xs text-gray-500">({option.count})</span>
                )}
              </label>
            ))}
          </div>

          {filteredOptions.length === 0 && (
            <div className="text-xs text-gray-500 text-center py-2">
              No options found
            </div>
          )}
        </>
      )}
    </div>
  );
};

/**
 * Time range picker component
 */
interface TimeRangePickerProps {
  value?: { start: number; end: number };
  onChange: (range?: { start: number; end: number }) => void;
  maxDate?: number;
}

const TimeRangePicker: React.FC<TimeRangePickerProps> = ({
  value,
  onChange,
  maxDate = Date.now(),
}) => {
  const [isEnabled, setIsEnabled] = useState(!!value);
  const [startDate, setStartDate] = useState(value ? new Date(value.start) : new Date());
  const [endDate, setEndDate] = useState(value ? new Date(value.end) : new Date());

  const handleToggle = useCallback(() => {
    if (isEnabled) {
      onChange(undefined);
    } else {
      const now = new Date();
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      onChange({
        start: weekAgo.getTime(),
        end: now.getTime(),
      });
    }
    setIsEnabled(!isEnabled);
  }, [isEnabled, onChange]);

  const handleStartDateChange = useCallback((date: Date) => {
    setStartDate(date);
    if (isEnabled) {
      onChange({
        start: date.getTime(),
        end: endDate.getTime(),
      });
    }
  }, [isEnabled, endDate, onChange]);

  const handleEndDateChange = useCallback((date: Date) => {
    setEndDate(date);
    if (isEnabled) {
      onChange({
        start: startDate.getTime(),
        end: date.getTime(),
      });
    }
  }, [isEnabled, startDate, onChange]);

  const formatDate = (date: Date): string => {
    return date.toISOString().split('T')[0];
  };

  return (
    <div className="bg-gray-800 border border-gray-600 rounded-lg p-3">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-sm font-semibold text-white">Time Range</h4>
        <button
          onClick={handleToggle}
          className={`text-xs px-2 py-1 rounded transition-colors ${
            isEnabled
              ? 'bg-blue-600 hover:bg-blue-700 text-white'
              : 'bg-gray-600 hover:bg-gray-700 text-white'
          }`}
        >
          {isEnabled ? 'Enabled' : 'Disabled'}
        </button>
      </div>

      {isEnabled && (
        <div className="space-y-2">
          <div>
            <label className="text-xs text-gray-400 block mb-1">Start Date</label>
            <input
              type="date"
              value={formatDate(startDate)}
              max={formatDate(endDate)}
              onChange={(e) => handleStartDateChange(new Date(e.target.value))}
              className="w-full bg-gray-700 text-white text-xs rounded px-2 py-1 border border-gray-600 focus:outline-none focus:border-blue-500"
            />
          </div>
          
          <div>
            <label className="text-xs text-gray-400 block mb-1">End Date</label>
            <input
              type="date"
              value={formatDate(endDate)}
              min={formatDate(startDate)}
              max={formatDate(new Date(maxDate))}
              onChange={(e) => handleEndDateChange(new Date(e.target.value))}
              className="w-full bg-gray-700 text-white text-xs rounded px-2 py-1 border border-gray-600 focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Preset manager component
 */
interface PresetManagerProps {
  presets: FilterPreset[];
  currentPreset?: string;
  onSelect: (preset: FilterPreset) => void;
  onSave: (preset: Omit<FilterPreset, 'id' | 'createdAt'>) => void;
  onDelete: (presetId: string) => void;
}

const PresetManager: React.FC<PresetManagerProps> = ({
  presets,
  currentPreset,
  onSelect,
  onSave,
  onDelete,
}) => {
  const [isCreating, setIsCreating] = useState(false);
  const [newPresetName, setNewPresetName] = useState('');
  const [newPresetDescription, setNewPresetDescription] = useState('');

  const handleSavePreset = useCallback(() => {
    if (newPresetName.trim()) {
      onSave({
        name: newPresetName.trim(),
        description: newPresetDescription.trim(),
        filters: {}, // This would be populated with current filters
      });
      
      setNewPresetName('');
      setNewPresetDescription('');
      setIsCreating(false);
    }
  }, [newPresetName, newPresetDescription, onSave]);

  return (
    <div className="bg-gray-800 border border-gray-600 rounded-lg p-3">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-sm font-semibold text-white">Presets</h4>
        <button
          onClick={() => setIsCreating(!isCreating)}
          className="text-xs bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded transition-colors"
        >
          + New
        </button>
      </div>

      {isCreating && (
        <div className="space-y-2 mb-3 p-2 bg-gray-700 rounded">
          <input
            type="text"
            placeholder="Preset name"
            value={newPresetName}
            onChange={(e) => setNewPresetName(e.target.value)}
            className="w-full bg-gray-600 text-white text-xs rounded px-2 py-1 border border-gray-500 focus:outline-none focus:border-blue-500"
          />
          <textarea
            placeholder="Description (optional)"
            value={newPresetDescription}
            onChange={(e) => setNewPresetDescription(e.target.value)}
            className="w-full bg-gray-600 text-white text-xs rounded px-2 py-1 border border-gray-500 focus:outline-none focus:border-blue-500 resize-none"
            rows={2}
          />
          <div className="flex space-x-2">
            <button
              onClick={handleSavePreset}
              className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded transition-colors"
            >
              Save
            </button>
            <button
              onClick={() => {
                setIsCreating(false);
                setNewPresetName('');
                setNewPresetDescription('');
              }}
              className="text-xs bg-gray-600 hover:bg-gray-700 text-white px-2 py-1 rounded transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="space-y-1 max-h-32 overflow-y-auto">
        {presets.map(preset => (
          <div
            key={preset.id}
            className={`flex items-center justify-between p-2 rounded cursor-pointer ${
              currentPreset === preset.id ? 'bg-blue-600' : 'hover:bg-gray-700'
            }`}
            onClick={() => onSelect(preset)}
          >
            <div className="flex-1">
              <div className="text-xs text-white font-medium">{preset.name}</div>
              {preset.description && (
                <div className="text-xs text-gray-400">{preset.description}</div>
              )}
            </div>
            {!preset.isDefault && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(preset.id);
                }}
                className="text-xs text-red-400 hover:text-red-300 px-1"
              >
                ×
              </button>
            )}
          </div>
        ))}
      </div>

      {presets.length === 0 && (
        <div className="text-xs text-gray-500 text-center py-2">
          No presets saved
        </div>
      )}
    </div>
  );
};

/**
 * Main Quest Decision Heatmap Filter component
 */
export const QuestDecisionHeatmapFilter: React.FC<QuestDecisionHeatmapFilterProps> = ({
  config: userConfig,
  filters: initialFilters,
  options,
  onFiltersChange,
  onPresetSelect,
  className = '',
  visible = true,
  showSearch = true,
  showPresets = true,
}) => {
  const config = useMemo(() => ({
    ...DEFAULT_QUEST_DECISION_HEATMAP_CONFIG.filter,
    ...userConfig,
  }), [userConfig]);

  const [filters, setFilters] = useState<QuestDecisionFilterState>(() => ({
    decisionTypes: config.filters.decisionTypes,
    priorities: config.filters.priorities,
    categories: config.filters.categories,
    outcomes: config.filters.outcomes || [],
    timeRange: config.filters.timeRange,
    regions: config.filters.regions || [],
    zones: config.filters.zones || [],
    decisionMakers: config.filters.decisionMakers || [],
    searchText: '',
  }));

  const [presets, setPresets] = useState<FilterPreset[]>([
    {
      id: 'all',
      name: 'All Decisions',
      description: 'Show all quest decisions',
      filters: {
        decisionTypes: Object.values(QuestDecisionType),
        priorities: Object.values(QuestPriority),
        categories: Object.values(QuestCategory),
        outcomes: ['success', 'failure', 'partial', 'pending'],
        regions: [],
        zones: [],
        decisionMakers: [],
        searchText: '',
      },
      isDefault: true,
      createdAt: Date.now(),
    },
    {
      id: 'recent-success',
      name: 'Recent Success',
      description: 'Show successful decisions from last week',
      filters: {
        decisionTypes: [QuestDecisionType.ACCEPT, QuestDecisionType.STRATEGIC],
        priorities: [QuestPriority.HIGH, QuestPriority.MEDIUM],
        categories: [QuestCategory.COMBAT, QuestCategory.EXPLORATION],
        outcomes: ['success'],
        timeRange: {
          start: Date.now() - 7 * 24 * 60 * 60 * 1000,
          end: Date.now(),
        },
        regions: [],
        zones: [],
        decisionMakers: [],
        searchText: '',
      },
      createdAt: Date.now(),
    },
  ]);

  const [currentPreset, setCurrentPreset] = useState<string>('all');
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Update filters when prop changes
  useEffect(() => {
    if (initialFilters) {
      setFilters(initialFilters);
    }
  }, [initialFilters]);

  // Notify parent of filter changes
  useEffect(() => {
    onFiltersChange?.(filters);
  }, [filters, onFiltersChange]);

  // Handle filter updates
  const updateFilters = useCallback((updates: Partial<QuestDecisionFilterState>) => {
    setFilters(prev => ({ ...prev, ...updates }));
    setCurrentPreset(''); // Clear preset when manually changing filters
  }, []);

  const handleDecisionTypesChange = useCallback((values: QuestDecisionType[]) => {
    updateFilters({ decisionTypes: values });
  }, [updateFilters]);

  const handlePrioritiesChange = useCallback((values: QuestPriority[]) => {
    updateFilters({ priorities: values });
  }, [updateFilters]);

  const handleCategoriesChange = useCallback((values: QuestCategory[]) => {
    updateFilters({ categories: values });
  }, [updateFilters]);

  const handleOutcomesChange = useCallback((values: ('success' | 'failure' | 'partial' | 'pending')[]) => {
    updateFilters({ outcomes: values });
  }, [updateFilters]);

  const handleTimeRangeChange = useCallback((timeRange?: { start: number; end: number }) => {
    updateFilters({ timeRange });
  }, [updateFilters]);

  const handleRegionsChange = useCallback((values: string[]) => {
    updateFilters({ regions: values });
  }, [updateFilters]);

  const handleZonesChange = useCallback((values: string[]) => {
    updateFilters({ zones: values });
  }, [updateFilters]);

  const handleDecisionMakersChange = useCallback((values: string[]) => {
    updateFilters({ decisionMakers: values });
  }, [updateFilters]);

  const handleSearchChange = useCallback((searchText: string) => {
    updateFilters({ searchText });
  }, [updateFilters]);

  // Preset management
  const handlePresetSelect = useCallback((preset: FilterPreset) => {
    setFilters(preset.filters);
    setCurrentPreset(preset.id);
    onPresetSelect?.(preset);
  }, [onPresetSelect]);

  const handlePresetSave = useCallback((preset: Omit<FilterPreset, 'id' | 'createdAt'>) => {
    const newPreset: FilterPreset = {
      ...preset,
      id: `preset-${Date.now()}`,
      createdAt: Date.now(),
    };
    setPresets(prev => [...prev, newPreset]);
  }, []);

  const handlePresetDelete = useCallback((presetId: string) => {
    setPresets(prev => prev.filter(p => p.id !== presetId));
    if (currentPreset === presetId) {
      setCurrentPreset('all');
      handlePresetSelect(presets[0]); // Select default preset
    }
  }, [currentPreset, presets, handlePresetSelect]);

  // Reset filters
  const handleReset = useCallback(() => {
    const defaultPreset = presets.find(p => p.isDefault);
    if (defaultPreset) {
      handlePresetSelect(defaultPreset);
    }
  }, [presets, handlePresetSelect]);

  // Get position classes
  const getPositionClasses = (): string => {
    switch (config.position) {
      case 'top': return 'top-0 left-0 right-0';
      case 'right': return 'top-0 right-0 bottom-0';
      case 'bottom': return 'bottom-0 left-0 right-0';
      case 'left': return 'top-0 left-0 bottom-0';
      case 'floating': return 'top-4 left-4';
      default: return 'top-0 left-0 right-0';
    }
  };

  if (!visible) {
    return null;
  }

  return (
    <div
      className={`bg-gray-800 border border-gray-600 rounded-lg p-4 ${getPositionClasses()} ${
        config.position === 'floating' ? 'absolute z-10 shadow-lg' : 'relative'
      } ${className}`}
      style={{
        minWidth: config.position === 'floating' ? '250px' : 'auto',
        maxWidth: config.position === 'floating' ? '350px' : 'none',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-white">Filters</h3>
        
        <div className="flex items-center space-x-2">
          {config.showReset && (
            <button
              onClick={handleReset}
              className="text-xs bg-gray-600 hover:bg-gray-700 text-white px-2 py-1 rounded transition-colors"
            >
              Reset
            </button>
          )}
          
          {config.collapsible && (
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="text-gray-400 hover:text-white transition-colors p-1"
            >
              <span className={`transform transition-transform ${isCollapsed ? 'rotate-90' : ''}`}>
                ▶
              </span>
            </button>
          )}
        </div>
      </div>

      {!isCollapsed && (
        <>
          {/* Search */}
          {showSearch && (
            <div className="mb-4">
              <input
                type="text"
                placeholder="Search quests..."
                value={filters.searchText}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="w-full bg-gray-700 text-white text-xs rounded px-3 py-2 border border-gray-600 focus:outline-none focus:border-blue-500"
              />
            </div>
          )}

          {/* Filter Groups */}
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {/* Decision Types */}
            <FilterGroup
              title="Decision Types"
              options={options?.decisionTypes.map(type => ({
                value: type,
                label: type.charAt(0).toUpperCase() + type.slice(1),
              })) || []}
              selectedValues={filters.decisionTypes}
              multiSelect={config.multiSelect}
              showCounts={config.showCounts}
              onChange={handleDecisionTypesChange}
              searchable={true}
            />

            {/* Priorities */}
            <FilterGroup
              title="Priorities"
              options={options?.priorities.map(priority => ({
                value: priority,
                label: priority.charAt(0).toUpperCase() + priority.slice(1),
              })) || []}
              selectedValues={filters.priorities}
              multiSelect={config.multiSelect}
              showCounts={config.showCounts}
              onChange={handlePrioritiesChange}
              searchable={false}
            />

            {/* Categories */}
            <FilterGroup
              title="Categories"
              options={options?.categories.map(category => ({
                value: category,
                label: category.charAt(0).toUpperCase() + category.slice(1),
              })) || []}
              selectedValues={filters.categories}
              multiSelect={config.multiSelect}
              showCounts={config.showCounts}
              onChange={handleCategoriesChange}
              searchable={true}
            />

            {/* Outcomes */}
            {filters.outcomes && (
              <FilterGroup
                title="Outcomes"
                options={filters.outcomes.map(outcome => ({
                  value: outcome,
                  label: outcome.charAt(0).toUpperCase() + outcome.slice(1),
                }))}
                selectedValues={filters.outcomes}
                multiSelect={config.multiSelect}
                showCounts={config.showCounts}
                onChange={handleOutcomesChange}
                searchable={false}
              />
            )}

            {/* Time Range */}
            <TimeRangePicker
              value={filters.timeRange}
              onChange={handleTimeRangeChange}
            />

            {/* Regions */}
            {options?.regions && options.regions.length > 0 && (
              <FilterGroup
                title="Regions"
                options={options.regions.map(region => ({
                  value: region,
                  label: region,
                }))}
                selectedValues={filters.regions}
                multiSelect={config.multiSelect}
                showCounts={config.showCounts}
                onChange={handleRegionsChange}
                searchable={true}
              />
            )}

            {/* Zones */}
            {options?.zones && options.zones.length > 0 && (
              <FilterGroup
                title="Zones"
                options={options.zones.map(zone => ({
                  value: zone,
                  label: zone,
                }))}
                selectedValues={filters.zones}
                multiSelect={config.multiSelect}
                showCounts={config.showCounts}
                onChange={handleZonesChange}
                searchable={true}
              />
            )}

            {/* Decision Makers */}
            {options?.decisionMakers && options.decisionMakers.length > 0 && (
              <FilterGroup
                title="Decision Makers"
                options={options.decisionMakers.map(maker => ({
                  value: maker,
                  label: maker,
                }))}
                selectedValues={filters.decisionMakers}
                multiSelect={config.multiSelect}
                showCounts={config.showCounts}
                onChange={handleDecisionMakersChange}
                searchable={true}
              />
            )}
          </div>

          {/* Presets */}
          {showPresets && (
            <div className="mt-4 pt-4 border-t border-gray-600">
              <PresetManager
                presets={presets}
                currentPreset={currentPreset}
                onSelect={handlePresetSelect}
                onSave={handlePresetSave}
                onDelete={handlePresetDelete}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
};
