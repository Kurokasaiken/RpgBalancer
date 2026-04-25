import type { ResourceDeltaDefinition } from '@/balancing/config/idleVillage/types';

/**
 * Shared structure describing the visual preview metadata for Verb/Activity cards.
 */
export interface VerbDetailPreview {
  rewards: ResourceDeltaDefinition[];
  injuryPercentage: number;
  deathPercentage: number;
  note?: string;
}
