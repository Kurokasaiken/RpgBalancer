import type { PresentationRules, VisualStateMapping } from '../types';

/**
 * Default Wanderlust presentation rules.
 *
 * - `threat.active` truthy  → visual state `threatened`
 * - `corruption.active` truthy → visual state `corrupted`
 */
const WANDERLUST_DEFAULT_MAPPINGS: VisualStateMapping[] = [
  {
    stateKey: 'threat.active',
    condition: 'truthy',
    visualStateId: 'threatened',
    priority: 10,
  },
  {
    stateKey: 'corruption.active',
    condition: 'truthy',
    visualStateId: 'corrupted',
    priority: 5,
  },
];

/**
 * Registry of named presentation rule sets.
 */
export const PRESENTATION_RULES_REGISTRY: Record<string, PresentationRules> = {
  wanderlust_default: {
    version: '1.0.0',
    visualStateMappings: WANDERLUST_DEFAULT_MAPPINGS,
    defaultVisualStateId: 'default',
  },
};

/**
 * Resolve a named rule set, falling back to the default.
 */
export function getPresentationRules(key: string): PresentationRules {
  return PRESENTATION_RULES_REGISTRY[key] ?? PRESENTATION_RULES_REGISTRY.wanderlust_default;
}
