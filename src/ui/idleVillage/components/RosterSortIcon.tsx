import { useTranslation } from 'react-i18next';
import { ROSTER_SORT_MODES } from '@/ui/idleVillage/config/rosterSortConfig';
import type { RosterSortMode } from '@/ui/idleVillage/config/rosterSortConfig';

/**
 * Props for the RosterSortIcon component
 */
export interface RosterSortIconProps {
  /** Current sort mode */
  currentMode: RosterSortMode;
  /** Callback when sort mode changes */
  onSortModeChange: (mode: RosterSortMode) => void;
  /** Additional CSS classes */
  className?: string;
}

/**
 * RosterSortIcon - Compact icon-based sort control for roster display
 *
 * A simple icon button that toggles between alphabetical sort modes:
 * - Name A -> Z (default)
 * - Name Z -> A
 *
 * Uses displayName for alphabetical sorting as required by the prompt.
 *
 * @component
 * @example
 * ```tsx
 * <RosterSortIcon
 *   currentMode={sortMode}
 *   onSortModeChange={setSortMode}
 *   className="text-xs"
 * />
 * ```
 */
export function RosterSortIcon({
  currentMode,
  onSortModeChange,
  className = '',
}: RosterSortIconProps) {
  const { t } = useTranslation('idleVillage');
  const handleClick = () => {
    // Toggle between name-asc and name-desc
    const newMode = currentMode === 'name-asc' ? 'name-desc' : 'name-asc';
    onSortModeChange(newMode);
  };

  const isAscending = currentMode === 'name-asc';
  const sortModeConfig = ROSTER_SORT_MODES[currentMode];
  const tooltip = t(sortModeConfig.tooltipKey, sortModeConfig.tooltip);
  
  return (
    <button
      onClick={handleClick}
      className={`rounded-full border border-white/15 bg-white/5 p-1 text-slate-200 transition hover:border-amber-300/70 hover:text-amber-200 ${className}`}
      title={tooltip}
      aria-label={tooltip}
      data-testid="roster-sort-icon"
    >
      {/* Sort icon - arrow indicating direction */}
      <svg 
        width="16" 
        height="16" 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round"
        className={`text-slate-400 ${isAscending ? '' : 'rotate-180'}`}
      >
        <path d="m3 3 18 18"/>
        <path d="m6 10 6-6"/>
        <path d="m11 15 6-6"/>
      </svg>
    </button>
  );
}

export default RosterSortIcon;
