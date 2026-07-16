import type { ChangeEvent } from 'react';
import React, { createContext, useContext, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import type { FilterCriterion, FilterOperator, FilterStatKey } from '@/ui/idleVillage/config/rosterFilterConfig';
import {
  FILTER_OPERATORS,
  FILTER_STAT_KEYS,
  getFilterOperators,
  getFilterStatKeys,
  getStatDisplayConfig
} from '@/ui/idleVillage/config/rosterFilterConfig';

/**
 * Context for roster filter state
 * Provides local UI state management for filter criteria
 */
interface RosterFilterContextValue {
  /** Current filter criteria */
  criteria: FilterCriterion[];
  /** Add a new filter criterion */
  addCriterion: (criterion: FilterCriterion) => void;
  /** Remove a filter criterion by index */
  removeCriterion: (index: number) => void;
  /** Update a filter criterion by index */
  updateCriterion: (index: number, criterion: FilterCriterion) => void;
  /** Clear all filter criteria */
  clearCriteria: () => void;
  /** Check if any filters are active */
  hasActiveFilters: boolean;
}

const RosterFilterContext = createContext<RosterFilterContextValue | undefined>(undefined);

/**
 * Props for the RosterFilterProvider component
 */
export interface RosterFilterProviderProps {
  /** Children components that consume the filter context */
  children: ReactNode;
}

/**
 * Provider component for roster filter state
 * Manages local UI state for filter criteria using React Context
 * 
 * @component
 * @example
 * ```tsx
 * <RosterFilterProvider>
 *   <YourComponent />
 * </RosterFilterProvider>
 * ```
 */
export function RosterFilterProvider({ children }: RosterFilterProviderProps) {
  const [criteria, setCriteria] = useState<FilterCriterion[]>([]);

  const addCriterion = (criterion: FilterCriterion) => {
    setCriteria((prev) => [...prev, criterion]);
  };

  const removeCriterion = (index: number) => {
    setCriteria((prev) => prev.filter((_, i) => i !== index));
  };

  const updateCriterion = (index: number, criterion: FilterCriterion) => {
    setCriteria((prev) => {
      const updated = [...prev];
      updated[index] = criterion;
      return updated;
    });
  };

  const clearCriteria = () => {
    setCriteria([]);
  };

  const value: RosterFilterContextValue = {
    criteria,
    addCriterion,
    removeCriterion,
    updateCriterion,
    clearCriteria,
    hasActiveFilters: criteria.length > 0
  };

  return (
    <RosterFilterContext.Provider value={value}>
      {children}
    </RosterFilterContext.Provider>
  );
}

/**
 * Hook to access the roster filter context
 * Throws an error if used outside of RosterFilterProvider
 * 
 * @returns The roster filter context value
 * @throws Error if used outside of RosterFilterProvider
 */
export function useRosterFilter(): RosterFilterContextValue {
  const context = useContext(RosterFilterContext);
  if (!context) {
    throw new Error('useRosterFilter must be used within a RosterFilterProvider');
  }
  return context;
}

/**
 * Props for the RosterStatFilter component
 */
export interface RosterStatFilterProps {
  /** Additional CSS classes */
  className?: string;
}

/**
 * RosterStatFilter - UI component for stat-based filtering
 * 
 * Provides controls for filtering residents by their stats:
 * - Stat selection dropdown (HP, damage, etc.)
 * - Operator selection dropdown (>, <, =, >=, <=)
 * - Threshold number input
 * - Add/Remove filter buttons
 * - Clear all filters button
 * 
 * Uses existing UI primitives and follows config-first principles.
 * All user-facing strings use i18n with idleVillage namespace.
 * 
 * @component
 * @example
 * ```tsx
 * <RosterFilterProvider>
 *   <RosterStatFilter className="text-xs" />
 * </RosterFilterProvider>
 * ```
 */
export function RosterStatFilter({ className = '' }: RosterStatFilterProps) {
  const { t } = useTranslation('idleVillage');
  const { criteria, addCriterion, removeCriterion, clearCriteria, hasActiveFilters } = useRosterFilter();
  
  // State for new filter being created
  const [newStat, setNewStat] = useState<FilterStatKey>('hp');
  const [newOperator, setNewOperator] = useState<FilterOperator>('>');
  const [newThreshold, setNewThreshold] = useState<number>(0);

  const handleAddFilter = () => {
    addCriterion({
      stat: newStat,
      operator: newOperator,
      threshold: newThreshold
    });
    // Reset threshold after adding, keep stat/operator for convenience
    setNewThreshold(0);
  };

  const handleStatChange = (event: ChangeEvent<HTMLSelectElement>) => {
    setNewStat(event.target.value as FilterStatKey);
  };

  const handleOperatorChange = (event: ChangeEvent<HTMLSelectElement>) => {
    setNewOperator(event.target.value as FilterOperator);
  };

  const handleThresholdChange = (event: ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(event.target.value);
    setNewThreshold(Number.isNaN(value) ? 0 : value);
  };

  const statKeys = getFilterStatKeys();
  const operators = getFilterOperators();

  return (
    <div className={`flex flex-col gap-2 ${className}`} data-testid="roster-stat-filter">
      {/* Filter Controls */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* Stat Selection */}
        <div className="flex items-center gap-1">
          <label
            htmlFor="filter-stat-select"
            className="text-[8px] uppercase text-slate-400 font-medium"
          >
            {t('roster.filter.statLabel', 'Stat')}
          </label>
          <select
            id="filter-stat-select"
            value={newStat}
            onChange={handleStatChange}
            className="text-[7px] bg-slate-800 border border-slate-600 rounded px-1 py-0.5 text-slate-200 focus:outline-none focus:ring-1 focus:ring-amber-500"
            data-testid="filter-stat-select"
          >
            {statKeys.map((stat) => {
              const config = getStatDisplayConfig(stat);
              return (
                <option
                  key={stat}
                  value={stat}
                  className="bg-slate-800 text-slate-200"
                >
                  {t(config.labelKey, config.label)}
                </option>
              );
            })}
          </select>
        </div>

        {/* Operator Selection */}
        <div className="flex items-center gap-1">
          <label
            htmlFor="filter-operator-select"
            className="text-[8px] uppercase text-slate-400 font-medium"
          >
            {t('roster.filter.operatorLabel', 'Operator')}
          </label>
          <select
            id="filter-operator-select"
            value={newOperator}
            onChange={handleOperatorChange}
            className="text-[7px] bg-slate-800 border border-slate-600 rounded px-1 py-0.5 text-slate-200 focus:outline-none focus:ring-1 focus:ring-amber-500"
            data-testid="filter-operator-select"
          >
            {operators.map((op) => (
              <option
                key={op.label}
                value={op.label}
                className="bg-slate-800 text-slate-200"
              >
                {t(op.labelKey, op.label)}
              </option>
            ))}
          </select>
        </div>

        {/* Threshold Input */}
        <div className="flex items-center gap-1">
          <label
            htmlFor="filter-threshold-input"
            className="text-[8px] uppercase text-slate-400 font-medium"
          >
            {t('roster.filter.thresholdLabel', 'Threshold')}
          </label>
          <input
            id="filter-threshold-input"
            type="number"
            value={newThreshold}
            onChange={handleThresholdChange}
            className="text-[7px] bg-slate-800 border border-slate-600 rounded px-1 py-0.5 text-slate-200 focus:outline-none focus:ring-1 focus:ring-amber-500 w-16"
            data-testid="filter-threshold-input"
            aria-label={t('roster.filter.thresholdAriaLabel', 'Filter threshold value')}
          />
        </div>

        {/* Add Filter Button */}
        <button
          onClick={handleAddFilter}
          className="text-[7px] bg-amber-600 hover:bg-amber-700 text-white px-2 py-0.5 rounded transition-colors focus:outline-none focus:ring-1 focus:ring-amber-500"
          data-testid="add-filter-button"
          aria-label={t('roster.filter.addFilterAriaLabel', 'Add filter')}
        >
          {t('roster.filter.addFilter', 'Add')}
        </button>

        {/* Clear All Button */}
        {hasActiveFilters && (
          <button
            onClick={clearCriteria}
            className="text-[7px] bg-slate-600 hover:bg-slate-700 text-white px-2 py-0.5 rounded transition-colors focus:outline-none focus:ring-1 focus:ring-slate-500"
            data-testid="clear-filters-button"
            aria-label={t('roster.filter.clearFiltersAriaLabel', 'Clear all filters')}
          >
            {t('roster.filter.clearFilters', 'Clear')}
          </button>
        )}
      </div>

      {/* Active Filters Display */}
      {criteria.length > 0 && (
        <div className="flex flex-wrap gap-1" data-testid="active-filters">
          {criteria.map((criterion, index) => {
            const statConfig = getStatDisplayConfig(criterion.stat);
            const operatorConfig = FILTER_OPERATORS[criterion.operator];
            
            return (
              <div
                key={index}
                className="text-[7px] bg-slate-700 border border-slate-600 rounded px-2 py-0.5 text-slate-200 flex items-center gap-1"
                data-testid={`active-filter-${index}`}
              >
                <span>{t(statConfig.labelKey, statConfig.label)}</span>
                <span>{t(operatorConfig.labelKey, operatorConfig.label)}</span>
                <span>{criterion.threshold}</span>
                <button
                  onClick={() => removeCriterion(index)}
                  className="text-slate-400 hover:text-red-400 ml-1 focus:outline-none"
                  aria-label={t('roster.filter.removeFilterAriaLabel', 'Remove filter')}
                  data-testid={`remove-filter-${index}`}
                >
                  ×
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default RosterStatFilter;
