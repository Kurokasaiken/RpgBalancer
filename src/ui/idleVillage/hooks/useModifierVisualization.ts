import { useMemo } from 'react';
import {
  MODIFIER_VISUALIZATION_CONFIG,
  type ModifierVisualizationContext,
  type ModifierVisualizationEntryConfig,
} from '@/balancing/config/idleVillage/modifierVisualizationConfig';
import type { StatModifierEntry } from '@/ui/styleLab/components/StatModifierDisplay';

export interface UseModifierVisualizationOptions {
  /** Optional entity identifier (slot, resident, quest) to filter entries. */
  entityId?: string | null;
  /** Soft limit for entries returned by the hook. */
  maxEntries?: number;
}

export interface ModifierVisualizationResult {
  entries: StatModifierEntry[];
  isLoading: boolean;
}

const mapEntryToStatModifier = (entry: ModifierVisualizationEntryConfig): StatModifierEntry => ({
  id: entry.id,
  label: entry.label,
  statId: entry.statId,
  scope: entry.scope,
  operation: entry.operation,
  valueLabel: entry.valueLabel,
  description: entry.description,
  owner: entry.owner,
  lifetime: entry.lifetime,
  status: entry.status,
  stackCount: entry.stackCount,
  maxStacks: entry.maxStacks,
  sourceConfigId: entry.sourceConfigId,
});

const filterByEntity = (
  entries: ModifierVisualizationEntryConfig[],
  entityId?: string | null,
): ModifierVisualizationEntryConfig[] => {
  if (!entityId) return entries;
  return entries.filter((entry) => {
    if (!entry.applicableEntityIds || entry.applicableEntityIds.length === 0) {
      return true;
    }
    return entry.applicableEntityIds.includes(entityId);
  });
};

/**
 * Resolves StatModifierDisplay-friendly entries for the selected Idle Village surface.
 * Currently backed by MOCK config data; eventually will read from GM-ENG runtime output.
 */
export function useModifierVisualization(
  context: ModifierVisualizationContext,
  options?: UseModifierVisualizationOptions,
): ModifierVisualizationResult {
  const entityId = options?.entityId ?? null;
  const maxEntries = options?.maxEntries ?? Infinity;

  const entries = useMemo(() => {
    const configEntries = MODIFIER_VISUALIZATION_CONFIG[context] ?? [];
    const filtered = filterByEntity(configEntries, entityId);
    return filtered.slice(0, maxEntries).map(mapEntryToStatModifier);
  }, [context, entityId, maxEntries]);

  return {
    entries,
    isLoading: false,
  };
}
