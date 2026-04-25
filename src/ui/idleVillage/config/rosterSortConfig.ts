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
  label: string;
  description: string;
}

/**
 * Available sort modes for roster
 */
export const ROSTER_SORT_MODES: Record<RosterSortMode, RosterSortConfig> = {
  'name-asc': {
    mode: 'name-asc',
    label: 'Name A → Z',
    description: 'Sort by display name alphabetically (A to Z)'
  },
  'name-desc': {
    mode: 'name-desc',
    label: 'Name Z → A',
    description: 'Sort by display name alphabetically (Z to A)'
  },
  'hp-desc': {
    mode: 'hp-desc',
    label: 'HP',
    description: 'Sort by current HP (highest first)'
  },
  'fatigue-asc': {
    mode: 'fatigue-asc',
    label: 'Fatigue',
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
