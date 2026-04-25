import type { ResidentState } from './TimeEngine';
import type { StatRequirement } from '@/balancing/config/idleVillage/types';

export interface StatMatchResult {
  matches: boolean;
  missingAllOf: string[];
  anyOfMatched: boolean;
  blockedBy: string[];
}

/**
 * Collect the stat tags that describe a resident. Preference order:
 * 1. Explicit resident.statTags (already curated).
 * 2. Keys of resident.statSnapshot with truthy values (fallback).
 */
export function getResidentStatTags(resident: ResidentState): string[] {
  if (Array.isArray(resident.statTags) && resident.statTags.length > 0) {
    return resident.statTags;
  }

  if (resident.statSnapshot) {
    return Object.entries(resident.statSnapshot)
      .filter(([key, value]) => {
        if (key === 'hp') return false; // Exclude hp from stat tags
        if (typeof value === 'number') {
          return Number.isFinite(value) && value > 0;
        }
        return Boolean(value);
      })
      .map(([key]) => key);
  }

  return [];
}

export function evaluateStatRequirement(
  resident: ResidentState,
  requirement?: StatRequirement,
): StatMatchResult {
  const tags = new Set(getResidentStatTags(resident));
  const missingAllOf: string[] = [];
  const blockedBy: string[] = [];

  if (!requirement) {
    return {
      matches: true,
      missingAllOf,
      anyOfMatched: true,
      blockedBy,
    };
  }

  // Handle numeric requirements (like HP >= 200)
  if (requirement.allOf && Array.isArray(requirement.allOf)) {
    for (const item of requirement.allOf) {
      // Check if this is a numeric requirement object
      if (typeof item === 'object' && item !== null && 'stat' in item && 'operator' in item && 'value' in item) {
        const numericReq = item as { stat: string; operator: string; value: number };
        const statValue = getNumericStatValue(resident, numericReq.stat);
        
        if (!evaluateNumericRequirement(statValue, numericReq.operator, numericReq.value)) {
          missingAllOf.push(`${numericReq.stat} ${numericReq.operator} ${numericReq.value}`);
        }
      } else if (typeof item === 'string') {
        // Handle tag-based requirements
        if (!tags.has(item)) {
          missingAllOf.push(item);
        }
      }
    }
  }

  let anyOfMatched = true;
  if (Array.isArray(requirement.anyOf) && requirement.anyOf.length > 0) {
    anyOfMatched = requirement.anyOf.some((tag) => tags.has(tag));
  }

  if (Array.isArray(requirement.noneOf)) {
    requirement.noneOf.forEach((tag) => {
      if (tags.has(tag)) {
        blockedBy.push(tag);
      }
    });
  }

  const matches = missingAllOf.length === 0 && anyOfMatched && blockedBy.length === 0;

  return {
    matches,
    missingAllOf,
    anyOfMatched,
    blockedBy,
  };
}

function getNumericStatValue(resident: ResidentState, statName: string): number {
  switch (statName) {
    case 'hp':
      return resident.currentHp ?? resident.statSnapshot?.hp ?? 0;
    default:
      return resident.statSnapshot?.[statName] ?? 0;
  }
}

function evaluateNumericRequirement(value: number, operator: string, requiredValue: number): boolean {
  switch (operator) {
    case '>=':
      return value >= requiredValue;
    case '>':
      return value > requiredValue;
    case '<=':
      return value <= requiredValue;
    case '<':
      return value < requiredValue;
    case '==':
      return value === requiredValue;
    case '!=':
      return value !== requiredValue;
    default:
      return false;
  }
}
