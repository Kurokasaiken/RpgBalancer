import type { ResidentState } from '@/engine/game/idleVillage/TimeEngine';
import { formatResidentLabel } from '@/ui/idleVillage/residentName';

/**
 * Sort modes for roster display
 */
export type RosterSortMode = 'name-asc' | 'name-desc' | 'hp-desc' | 'fatigue-asc';

/**
 * Sort configuration for roster display
 */
export interface RosterSortConfig {
  mode: RosterSortMode;
  /** i18n key for the sort option label. */
  labelKey: string;
  /** Fallback label used when the translation is not available. */
  label: string;
  /** i18n key for the sort option tooltip. */
  tooltipKey: string;
  /** Fallback tooltip used when the translation is not available. */
  tooltip: string;
  /** i18n key for the sort option description. */
  descriptionKey: string;
  /** Fallback description used when the translation is not available. */
  description: string;
}

/**
 * Available sort modes for roster
 */
export const ROSTER_SORT_MODES: Record<RosterSortMode, RosterSortConfig> = {
  'name-asc': {
    mode: 'name-asc',
    labelKey: 'roster.sort.nameAsc',
    label: 'Name A → Z',
    tooltipKey: 'roster.sort.nameAscTooltip',
    tooltip: 'Sort: Name A → Z (click to reverse)',
    descriptionKey: 'roster.sort.nameAscDescription',
    description: 'Sort by display name alphabetically (A to Z)'
  },
  'name-desc': {
    mode: 'name-desc',
    labelKey: 'roster.sort.nameDesc',
    label: 'Name Z → A',
    tooltipKey: 'roster.sort.nameDescTooltip',
    tooltip: 'Sort: Name Z → A (click to reverse)',
    descriptionKey: 'roster.sort.nameDescDescription',
    description: 'Sort by display name alphabetically (Z to A)'
  },
  'hp-desc': {
    mode: 'hp-desc',
    labelKey: 'roster.sort.hpDesc',
    label: 'HP',
    tooltipKey: 'roster.sort.hpDescTooltip',
    tooltip: 'Sort: HP (highest first)',
    descriptionKey: 'roster.sort.hpDescDescription',
    description: 'Sort by current HP (highest first)'
  },
  'fatigue-asc': {
    mode: 'fatigue-asc',
    labelKey: 'roster.sort.fatigueAsc',
    label: 'Fatigue',
    tooltipKey: 'roster.sort.fatigueAscTooltip',
    tooltip: 'Sort: Fatigue (lowest first)',
    descriptionKey: 'roster.sort.fatigueAscDescription',
    description: 'Sort by fatigue (lowest first)'
  }
} as const;

/**
 * Default sort mode for roster
 */
export const DEFAULT_ROSTER_SORT_MODE: RosterSortMode = 'name-asc';

/**
 * Sort residents based on the specified sort mode
 * Uses displayName for alphabetical sorting as required
 */
export function sortResidents(residents: ResidentState[], mode: RosterSortMode): ResidentState[] {
  const sorted = [...residents];
  
  switch (mode) {
    case 'name-asc':
      // Sort by displayName A -> Z (using formatResidentLabel which prioritizes displayName)
      return sorted.sort((a, b) => {
        const aName = formatResidentLabel(a);
        const bName = formatResidentLabel(b);
        return aName.localeCompare(bName);
      });
      
    case 'name-desc':
      // Sort by displayName Z -> A (using formatResidentLabel which prioritizes displayName)
      return sorted.sort((a, b) => {
        const aName = formatResidentLabel(a);
        const bName = formatResidentLabel(b);
        return bName.localeCompare(aName);
      });
      
    case 'hp-desc':
      // Sort by current HP (highest first)
      return sorted.sort((a, b) => b.currentHp - a.currentHp);
      
    case 'fatigue-asc':
      // Sort by fatigue (lowest first)
      return sorted.sort((a, b) => a.fatigue - b.fatigue);
      
    default:
      // Fallback to default sort mode
      return sortResidents(residents, DEFAULT_ROSTER_SORT_MODE);
  }
}

/**
 * Get all available sort modes as an array for UI rendering
 */
export function getRosterSortModes(): RosterSortConfig[] {
  return Object.values(ROSTER_SORT_MODES);
}
