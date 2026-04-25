/**
 * Lightweight lookup helpers for archetype metadata used by Idle Village UIs.
 */

import { ArchetypeRegistry } from '@/balancing/archetype/ArchetypeRegistry';
import { DEFAULT_ARCHETYPES } from '@/balancing/archetype/constants';
import type { ArchetypeTemplate } from '@/balancing/archetype/types';

const registry = new ArchetypeRegistry(DEFAULT_ARCHETYPES);
const archetypeMap = new Map<string, ArchetypeTemplate>(
  registry.listAll().map((template) => [template.id, template]),
);

export interface ArchetypeSummary {
  id: string;
  name: string;
  description: string;
  category: string;
  tags: string[];
}

/**
 * Returns basic metadata for an archetype id if it exists in the registry.
 */
export function getArchetypeSummary(archetypeId?: string | null): ArchetypeSummary | null {
  if (!archetypeId) {
    return null;
  }
  const template = archetypeMap.get(archetypeId);
  if (!template) {
    return null;
  }
  return {
    id: template.id,
    name: template.name,
    description: template.description,
    category: template.category,
    tags: template.tags,
  };
}
