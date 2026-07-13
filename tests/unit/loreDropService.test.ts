import { describe, it, expect } from 'vitest';
import type { LoreDrop, LoreDropState } from '@/balancing/config/lore/loreDropTypes';
import {
  getAssignableCandidates,
  pickLoreDrop,
  assignLoreDrop,
  discoverLoreDrop,
  getLoreDropForEntity,
  getDiscoveredLoreDrops,
  getAssignedLoreDropIds,
} from '@/engine/game/lore/LoreDropService';

const POOL: LoreDrop[] = [
  { id: 'ld-1', title: 'A', body: 'body-a', category: 'history', assignableTo: ['quest'], tags: ['combat'], weight: 1 },
  { id: 'ld-2', title: 'B', body: 'body-b', category: 'location', assignableTo: ['location', 'quest'], tags: ['forest'], weight: 1 },
  { id: 'ld-3', title: 'C', body: 'body-c', category: 'faction', assignableTo: ['building'], tags: ['forge'], weight: 1 },
  { id: 'ld-4', title: 'D', body: 'body-d', category: 'history', assignableTo: ['quest'], tags: [], weight: 2 },
];

const DEFAULT_STATE: LoreDropState = { assigned: {}, discoveredIds: [], loaded: true };

describe('LoreDropService', () => {
  describe('getAssignableCandidates', () => {
    it('returns drops matching entity type and tags', () => {
      const candidates = getAssignableCandidates(POOL, { id: 'q-1', type: 'quest', tags: ['combat'] }, new Set());
      expect(candidates.map((d) => d.id)).toContain('ld-1');
      expect(candidates.map((d) => d.id)).toContain('ld-4');
      expect(candidates.map((d) => d.id)).not.toContain('ld-3');
    });

    it('excludes already used drop ids', () => {
      const candidates = getAssignableCandidates(POOL, { id: 'q-1', type: 'quest', tags: ['combat'] }, new Set(['ld-1']));
      expect(candidates.map((d) => d.id)).not.toContain('ld-1');
    });

    it('allows drops with no tags when entity tags are provided', () => {
      const candidates = getAssignableCandidates(POOL, { id: 'q-1', type: 'quest', tags: ['combat'] }, new Set());
      expect(candidates.map((d) => d.id)).toContain('ld-4');
    });
  });

  describe('pickLoreDrop', () => {
    it('returns null when no candidates exist', () => {
      expect(pickLoreDrop([], () => 0.5)).toBeNull();
    });

    it('picks the only candidate deterministically', () => {
      const single = [POOL[0]];
      expect(pickLoreDrop(single, () => 0.5)).toBe(POOL[0]);
    });

    it('respects weights in a deterministic rng run', () => {
      const candidates = [POOL[0], POOL[3]]; // weights 1 and 2
      const rng = () => 0.8; // 0.8 * 3 = 2.4 -> after first (1) -> 1.4 -> after second (2) -> -0.6 -> second
      const pick = pickLoreDrop(candidates, rng);
      expect(pick?.id).toBe('ld-4');
    });
  });

  describe('assignLoreDrop', () => {
    it('assigns a new lore drop and returns the assignment', () => {
      const result = assignLoreDrop(POOL, { id: 'q-1', type: 'quest', tags: ['combat'] }, DEFAULT_STATE, () => 0.1);
      expect(result.assignment).not.toBeNull();
      expect(result.assignment?.entityId).toBe('q-1');
      expect(result.assignment?.loreDropId).toBe('ld-1');
      expect(result.state.assigned['q-1']).toBeDefined();
    });

    it('returns the existing assignment when one already exists', () => {
      const first = assignLoreDrop(POOL, { id: 'q-1', type: 'quest', tags: ['combat'] }, DEFAULT_STATE, () => 0.1);
      const second = assignLoreDrop(POOL, { id: 'q-1', type: 'quest', tags: ['combat'] }, first.state, () => 0.9);
      expect(second.assignment?.loreDropId).toBe(first.assignment?.loreDropId);
      expect(second.state.assigned['q-1'].loreDropId).toBe(first.assignment?.loreDropId);
    });

    it('does not reuse an already assigned drop id for another entity', () => {
      const first = assignLoreDrop(POOL, { id: 'q-1', type: 'quest', tags: ['combat'] }, DEFAULT_STATE, () => 0.1);
      const second = assignLoreDrop(POOL, { id: 'q-2', type: 'quest', tags: ['combat'] }, first.state, () => 0.1);
      expect(second.assignment?.loreDropId).not.toBe(first.assignment?.loreDropId);
    });

    it('returns null when no matching candidates remain', () => {
      const singleQuestPool = [POOL[0]];
      const state: LoreDropState = { ...DEFAULT_STATE, assigned: { 'q-1': { loreDropId: 'ld-1', entityId: 'q-1', entityType: 'quest', assignedAt: 0, discovered: false } } };
      const result = assignLoreDrop(singleQuestPool, { id: 'q-2', type: 'quest', tags: ['combat'] }, state, () => 0.1);
      expect(result.assignment).toBeNull();
    });
  });

  describe('discoverLoreDrop', () => {
    it('marks the assigned drop as discovered and updates discoveredIds', () => {
      const state: LoreDropState = { ...DEFAULT_STATE, assigned: { 'q-1': { loreDropId: 'ld-1', entityId: 'q-1', entityType: 'quest', assignedAt: 0, discovered: false } } };
      const next = discoverLoreDrop(state, 'q-1', 123);
      expect(next.assigned['q-1'].discovered).toBe(true);
      expect(next.assigned['q-1'].discoveredAt).toBe(123);
      expect(next.discoveredIds).toContain('ld-1');
    });

    it('does not mutate state when no assignment exists', () => {
      const next = discoverLoreDrop(DEFAULT_STATE, 'q-1');
      expect(next).toBe(DEFAULT_STATE);
    });
  });

  describe('getLoreDropForEntity', () => {
    it('returns the assigned drop for an entity', () => {
      const state: LoreDropState = { ...DEFAULT_STATE, assigned: { 'q-1': { loreDropId: 'ld-1', entityId: 'q-1', entityType: 'quest', assignedAt: 0, discovered: false } } };
      expect(getLoreDropForEntity(POOL, state, 'q-1')?.id).toBe('ld-1');
    });

    it('returns null when no assignment exists', () => {
      expect(getLoreDropForEntity(POOL, DEFAULT_STATE, 'q-1')).toBeNull();
    });
  });

  describe('getDiscoveredLoreDrops', () => {
    it('returns discovered drops in order', () => {
      const state: LoreDropState = {
        ...DEFAULT_STATE,
        assigned: {
          'q-1': { loreDropId: 'ld-2', entityId: 'q-1', entityType: 'quest', assignedAt: 0, discovered: true, discoveredAt: 1 },
          'q-2': { loreDropId: 'ld-1', entityId: 'q-2', entityType: 'quest', assignedAt: 0, discovered: true, discoveredAt: 2 },
        },
        discoveredIds: ['ld-2', 'ld-1'],
      };
      const drops = getDiscoveredLoreDrops(POOL, state);
      expect(drops.map((d) => d.id)).toEqual(['ld-2', 'ld-1']);
    });
  });

  describe('getAssignedLoreDropIds', () => {
    it('returns all assigned lore drop ids', () => {
      const state: LoreDropState = {
        ...DEFAULT_STATE,
        assigned: {
          'q-1': { loreDropId: 'ld-1', entityId: 'q-1', entityType: 'quest', assignedAt: 0, discovered: false },
          'q-2': { loreDropId: 'ld-2', entityId: 'q-2', entityType: 'quest', assignedAt: 0, discovered: false },
        },
      };
      expect(getAssignedLoreDropIds(state)).toEqual(['ld-1', 'ld-2']);
    });
  });
});
