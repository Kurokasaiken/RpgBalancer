/**
 * Conflict Resolver Configuration – NP-106 Support
 * 
 * Configuration for crew scheduler conflict detection and resolution.
 * 
 * @since NP-106
 */

import { z } from 'zod';

/**
 * Conflict resolver thresholds configuration.
 */
export const ConflictResolverThresholdsSchema = z.object({
  crewLimit: z.number().int().positive(),
  fatigueThreshold: z.number().min(0).max(1),
  priorityInversionThreshold: z.number().nonnegative(),
  skillMismatchThreshold: z.number().min(0).max(1),
});

/**
 * Conflict resolver configuration.
 */
export const ConflictResolverConfigSchema = z.object({
  enabled: z.boolean(),
  thresholds: ConflictResolverThresholdsSchema,
  maxSuggestionsPerConflict: z.number().int().positive(),
});

export type ConflictResolverConfig = z.infer<typeof ConflictResolverConfigSchema>;

/**
 * Default conflict resolver configuration.
 */
export const DEFAULT_CONFLICT_RESOLVER_CONFIG: ConflictResolverConfig = {
  enabled: true,
  thresholds: {
    crewLimit: 3,
    fatigueThreshold: 0.8,
    priorityInversionThreshold: 5.0,
    skillMismatchThreshold: 0.3,
  },
  maxSuggestionsPerConflict: 3,
};
