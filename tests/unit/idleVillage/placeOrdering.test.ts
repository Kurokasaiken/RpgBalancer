/**
 * placeOrdering — OB-1 (PLAN-117 rev. 5, T0.2).
 *
 * The two-ring fan of an authored Place puts urgent activities on the inner
 * ring (expiring/expired offers and done seals awaiting collection), in
 * urgency order, with a stable order and a capacity from PLACES_CONFIG —
 * never a literal.
 */
import { describe, expect, it } from 'vitest';
import { orderPlaceActivities } from '@/ui/idleVillage/components/gameFrame/placeOrdering';
import { PLACES_CONFIG } from '@/balancing/config/idleVillage/placesConfig';
import type { MapQuestPoiView } from '@/ui/idleVillage/components/gameFrame/MapQuestPoi';

const view = (over: Partial<MapQuestPoiView>): MapQuestPoiView => ({
  state: 'assigned',
  progress: 0.5,
  deadlineWarn: false,
  direction: 'clockwise',
  done: false,
  ...over,
});

const acts = (...ids: string[]) => ids.map((id) => ({ id }));

describe('orderPlaceActivities — inner ring holds the urgent (OB-1)', () => {
  it('expiring and done go inner; running/available stay outer', () => {
    const views = {
      a: view({ state: 'expiring', progress: 0.2, deadlineWarn: true, direction: 'counterclockwise' }),
      b: view({}),
      c: view({ done: true, progress: 1 }),
      d: view({ state: 'expired', progress: 0, direction: 'counterclockwise' }),
    };
    const { inner, outer } = orderPlaceActivities(acts('a', 'b', 'c', 'd'), views);
    expect(inner.map((a) => a.id)).toEqual(['d', 'a', 'c']);
    expect(outer.map((a) => a.id)).toEqual(['b']);
  });

  it('urgency order: expired → expiring by ascending progress → done', () => {
    const views = {
      late: view({ state: 'expiring', progress: 0.8, deadlineWarn: true, direction: 'counterclockwise' }),
      soon: view({ state: 'expiring', progress: 0.1, deadlineWarn: true, direction: 'counterclockwise' }),
      gone: view({ state: 'expired', progress: 0, direction: 'counterclockwise' }),
      fin: view({ done: true, progress: 1 }),
    };
    const { inner } = orderPlaceActivities(acts('late', 'soon', 'gone', 'fin'), views);
    expect(inner.map((a) => a.id)).toEqual(['gone', 'soon', 'late', 'fin']);
  });

  it('stable: same views → same order, and ties keep the input order', () => {
    const views = {
      x: view({ state: 'expiring', progress: 0.5, deadlineWarn: true, direction: 'counterclockwise' }),
      y: view({ state: 'expiring', progress: 0.5, deadlineWarn: true, direction: 'counterclockwise' }),
      z: view({ state: 'expiring', progress: 0.5, deadlineWarn: true, direction: 'counterclockwise' }),
    };
    const first = orderPlaceActivities(acts('x', 'y', 'z'), views);
    const second = orderPlaceActivities(acts('x', 'y', 'z'), views);
    expect(first.inner.map((a) => a.id)).toEqual(['x', 'y', 'z']);
    expect(first).toEqual(second);
  });

  it('inner capacity comes from config and overflow spills to the outer tail', () => {
    const views = {
      a: view({ state: 'expired', progress: 0, direction: 'counterclockwise' }),
      b: view({ state: 'expiring', progress: 0.1, deadlineWarn: true, direction: 'counterclockwise' }),
      c: view({ state: 'expiring', progress: 0.2, deadlineWarn: true, direction: 'counterclockwise' }),
      d: view({ state: 'expiring', progress: 0.3, deadlineWarn: true, direction: 'counterclockwise' }),
      e: view({ state: 'expiring', progress: 0.4, deadlineWarn: true, direction: 'counterclockwise' }),
      f: view({ done: true, progress: 1 }),
      idle: view({}),
    };
    const { inner, outer } = orderPlaceActivities(acts('a', 'b', 'c', 'd', 'e', 'f', 'idle'), views);
    expect(inner).toHaveLength(PLACES_CONFIG.fan.innerRingCapacity);
    // overflow keeps urgency order after the non-urgent tail
    expect(outer.map((a) => a.id)).toEqual(['idle', 'e', 'f']);
  });

  it('an activity without a view is never urgent', () => {
    const { inner, outer } = orderPlaceActivities(acts('noview', 'urg'), {
      urg: view({ done: true, progress: 1 }),
    });
    expect(inner.map((a) => a.id)).toEqual(['urg']);
    expect(outer.map((a) => a.id)).toEqual(['noview']);
  });
});
