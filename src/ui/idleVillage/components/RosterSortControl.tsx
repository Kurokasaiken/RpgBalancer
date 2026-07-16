import type { ChangeEvent } from 'react';
import { useTranslation } from 'react-i18next';
import type { RosterSortMode, RosterSortConfig } from '@/ui/idleVillage/config/rosterSortConfig';
import { getRosterSortModes } from '@/ui/idleVillage/config/rosterSortConfig';
import type { FilterCriterion } from '@/ui/idleVillage/config/rosterFilterConfig';
import { RosterStatFilter, RosterFilterProvider } from './RosterStatFilter';

/**
 * Props for the RosterSortControl component
 */
export interface RosterSortControlProps {
  /** Current sort mode */
  currentMode: RosterSortMode;
  /** Callback when sort mode changes */
  onSortModeChange: (mode: RosterSortMode) => void;
  /** Filter criteria for stat-based filtering */
  filterCriteria?: FilterCriterion[];
  /** Callback when filter criteria changes */
  onFilterCriteriaChange?: (criteria: FilterCriterion[]) => void;
  /** Whether to show the filter UI */
  showFilter?: boolean;
  /** Additional CSS classes */
  className?: string;
}

/**
 * RosterSortControl - Minimal sort control for roster display
 *
 * A simple dropdown component that allows users to sort the roster by:
 * - Name A -> Z (default)
 * - Name Z -> A
 * - HP (highest first)
 * - Fatigue (lowest first)
 *
 * Uses displayName for alphabetical sorting as required by the prompt.
 * 
 * Now includes optional stat-based filtering via RosterStatFilter.
 *
 * @component
 * @example
 * ```tsx
 * <RosterSortControl
 *   currentMode={sortMode}
 *   onSortModeChange={setSortMode}
 *   filterCriteria={filterCriteria}
 *   onFilterCriteriaChange={setFilterCriteria}
 *   showFilter={true}
 *   className="text-xs"
 * />
 * ```
 */
export function RosterSortControl({
  currentMode,
  onSortModeChange,
  filterCriteria = [],
  onFilterCriteriaChange,
  showFilter = false,
  className = '',
}: RosterSortControlProps) {
  const { t } = useTranslation('idleVillage');
  const sortModes = getRosterSortModes();

  const handleChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const newMode = event.target.value as RosterSortMode;
    onSortModeChange(newMode);
  };

  const sortControl = (
    <div className={`flex items-center gap-1 ${className}`}>
      <label
        htmlFor="roster-sort-select"
        className="text-[8px] uppercase text-slate-400 font-medium"
      >
        {t('roster.sort.label', 'Sort')}
      </label>
      <select
        id="roster-sort-select"
        value={currentMode}
        onChange={handleChange}
        className="text-[7px] bg-slate-800 border border-slate-600 rounded px-1 py-0.5 text-slate-200 focus:outline-none focus:ring-1 focus:ring-amber-500"
        data-testid="roster-sort-select"
      >
        {sortModes.map((mode: RosterSortConfig) => (
          <option
            key={mode.mode}
            value={mode.mode}
            className="bg-slate-800 text-slate-200"
          >
            {t(mode.labelKey, mode.label)}
          </option>
        ))}
      </select>
    </div>
  );

  // If filter is not enabled, return only sort control
  if (!showFilter) {
    return sortControl;
  }

  // If filter is enabled, wrap in provider and include filter UI
  return (
    <RosterFilterProvider>
      <div className="flex flex-col gap-2">
        {sortControl}
        <RosterStatFilter className={className} />
      </div>
    </RosterFilterProvider>
  );
}

export default RosterSortControl;
