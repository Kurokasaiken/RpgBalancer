import { useCallback } from 'react';
import type { IdleVillageConfig } from '@/balancing/config/idleVillage/types';

/**
 * Metadata returned for a resource, with fallbacks for missing data.
 */
export interface ResourceMetadata {
  /** Human-readable label, falls back to resourceId if not defined */
  label: string;
  /** Optional icon glyph or emoji */
  icon?: string;
  /** Optional Tailwind color class */
  colorClass?: string;
  /** Optional description text */
  description?: string;
}

/**
 * Hook that provides centralized access to resource metadata from Idle Village config.
 * Returns a function to get metadata for a specific resource ID with consistent fallbacks.
 */
export function useResourceMetadata(config: IdleVillageConfig | null | undefined) {
  return useCallback(
    (resourceId: string): ResourceMetadata => {
      const resourceDef = config?.resources?.[resourceId];

      return {
        label: resourceDef?.label ?? resourceId,
        icon: resourceDef?.icon,
        colorClass: resourceDef?.colorClass,
        description: resourceDef?.description,
      };
    },
    [config?.resources],
  );
}
