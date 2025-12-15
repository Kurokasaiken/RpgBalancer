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
      .filter(([, value]) => {
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

  if (Array.isArray(requirement.allOf)) {
    requirement.allOf.forEach((tag) => {
      if (!tags.has(tag)) {
        missingAllOf.push(tag);
      }
    });
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
