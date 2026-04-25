/**
 * Minimal Job Types for Idle Village
 * 
 * Simplified job system with static entities only.
 * No lifecycle, no status, no complex state management.
 */

export type JobType = 
  | 'wood-gathering'
  | 'rat-hunting'
  | 'explore-ruins'
  | 'scout-forest'
  | 'defend-village'
  | 'raid-camp';

export interface Job {
  id: string;
  type: JobType;
  createdAt: number;
}

/**
 * Create a new job with generated ID
 */
export function createJob(type: JobType): Job {
  return {
    id: `job-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    type,
    createdAt: Date.now(),
  };
}

/**
 * Job type configuration for display purposes
 */
export const JOB_CONFIG = {
  'wood-gathering': {
    name: 'Wood Gathering',
    description: 'Collect wood from the nearby forest',
  },
  'rat-hunting': {
    name: 'Rat Hunting',
    description: 'Hunt rats in the village outskirts',
  },
  'explore-ruins': {
    name: 'Explore Ruins',
    description: 'Investigate ancient ruins for treasures',
  },
  'scout-forest': {
    name: 'Scout Forest',
    description: 'Survey the forest for resources and dangers',
  },
  'defend-village': {
    name: 'Defend Village',
    description: 'Protect village from incoming threats',
  },
  'raid-camp': {
    name: 'Raid Enemy Camp',
    description: 'Attack enemy camp to eliminate threats',
  },
} as const;
