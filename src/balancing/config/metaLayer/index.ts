/**
 * Meta-Layer config entry point (PLAN-030 / R-164).
 *
 * Loads and validates the assembled v0 config through the Zod schema —
 * parse failures surface at import/test time, never silently.
 */

import { META_LAYER_CONFIG_V0 } from './content';
import { MetaLayerConfigSchema, type MetaLayerConfig } from './schema';

/**
 * Parse and return the canonical meta-layer config.
 * Throws a ZodError on any schema violation.
 */
export function loadMetaLayerConfig(): MetaLayerConfig {
  return MetaLayerConfigSchema.parse(META_LAYER_CONFIG_V0);
}

export * from './schema';
export {
  META_LAYER_CAPABILITY_TAGS,
  META_LAYER_CLOCKS,
  META_LAYER_CONFIG_V0,
  META_LAYER_FAMILIES,
  META_LAYER_INITIAL_QUALITIES,
  META_LAYER_MILESTONES,
  META_LAYER_OFFERS,
  META_LAYER_TUNING,
} from './content';
