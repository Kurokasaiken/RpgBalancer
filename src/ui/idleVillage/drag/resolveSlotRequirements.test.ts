import { describe, it, expect } from 'vitest';
import type { IdleVillageConfig } from '@/balancing/config/idleVillage/types';
import { DEFAULT_IDLE_VILLAGE_CONFIG } from '@/balancing/config/idleVillage/defaultConfig';
import {
  resolveSlotRequirements,
  resolveSlotForActivity,
  resolveMaxCrewSize,
} from './resolveSlotRequirements';

const cloneConfig = (): IdleVillageConfig =>
  JSON.parse(JSON.stringify(DEFAULT_IDLE_VILLAGE_CONFIG)) as IdleVillageConfig;

describe('resolveSlotRequirements', () => {
  it('groups activities per slot and surfaces fatigue + requirement metadata', () => {
    const config = cloneConfig();
    config.globalRules.maxFatigueBeforeExhausted = 77;
    config.mapSlots = {
      square: { ...config.mapSlots.village_square, id: 'square', slotTags: ['city'], isInitiallyUnlocked: true },
    };
    config.activities = {
      job_square: {
        ...config.activities.job_city_rats,
        id: 'job_square',
        label: 'Square Job',
        slotTags: ['city'],
        metadata: { maxCrewSize: 3, mapSlotId: 'square' },
      },
    };

    const summary = resolveSlotRequirements({ config });

    expect(summary.square).toBeDefined();
    expect(summary.square.fatigueLimit).toBe(77);
    expect(summary.square.activities).toHaveLength(1);
    expect(summary.square.activities[0]).toMatchObject({
      activityId: 'job_square',
      label: 'Square Job',
      maxCrewSize: 3,
      statRequirement: config.activities.job_square.statRequirement,
    });
  });

  it('respects slot filter and ignores non-matching slots', () => {
    const config = cloneConfig();
    config.mapSlots = {
      village_square: { ...config.mapSlots.village_square, id: 'village_square', slotTags: ['village'] },
      village_gate: { ...config.mapSlots.village_gate, id: 'village_gate', slotTags: ['world'] },
    };

    const summary = resolveSlotRequirements({ config, slotFilter: ['village_gate'] });

    expect(Object.keys(summary)).toEqual(['village_gate']);
    expect(summary.village_gate.slotId).toBe('village_gate');
  });
});

describe('resolveSlotForActivity', () => {
  it('prefers metadata mapSlotId before tag matching', () => {
    const config = cloneConfig();
    const activity = {
      ...config.activities.job_city_rats,
      metadata: { ...config.activities.job_city_rats.metadata, mapSlotId: 'custom_slot' },
    };
    const slotId = resolveSlotForActivity(activity, {
      custom_slot: {
        ...config.mapSlots.village_square,
        id: 'custom_slot',
        slotTags: ['ignored'],
      },
    });

    expect(slotId).toBe('custom_slot');
  });

  it('falls back to slot tag matching when metadata mapSlotId is missing', () => {
    const config = cloneConfig();
    const activity = {
      ...config.activities.job_city_rats,
      metadata: { ...(config.activities.job_city_rats.metadata ?? {}), mapSlotId: undefined },
      slotTags: ['wilderness'],
    };
    const slotId = resolveSlotForActivity(activity, {
      wilderness_slot: {
        ...config.mapSlots.village_gate,
        id: 'wilderness_slot',
        slotTags: ['wilderness'],
      },
      city_slot: {
        ...config.mapSlots.village_square,
        id: 'city_slot',
        slotTags: ['city'],
      },
    });

    expect(slotId).toBe('wilderness_slot');
  });
});

describe('resolveMaxCrewSize', () => {
  it('returns crew size from metadata when provided', () => {
    const config = cloneConfig();
    const activity = {
      ...config.activities.job_city_rats,
      metadata: { ...config.activities.job_city_rats.metadata, maxCrewSize: 4 },
    };

    expect(resolveMaxCrewSize(activity)).toBe(4);
  });

  it('falls back to numeric maxSlots when metadata is missing', () => {
    const config = cloneConfig();
    const activity = { ...config.activities.job_city_rats, maxSlots: 2 };

    expect(resolveMaxCrewSize(activity)).toBe(2);
  });

  it('falls back to slot tag length and finally default crew size', () => {
    const config = cloneConfig();
    const tagActivity = { ...config.activities.job_city_rats, maxSlots: undefined, metadata: {}, slotTags: ['a', 'b'] };
    const noHintActivity = { ...config.activities.job_city_rats, maxSlots: undefined, metadata: {}, slotTags: [] };

    expect(resolveMaxCrewSize(tagActivity)).toBe(2);
    expect(resolveMaxCrewSize(noHintActivity)).toBe(1);
  });
});
