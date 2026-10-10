import { describe, it, expect } from 'vitest';
import { mapQuestPoiView } from '@/ui/idleVillage/components/gameFrame/MapQuestPoi';
import { EXPIRING_BELOW, type QuestAvailability } from '@/ui/idleVillage/components/gameFrame/questAvailability';

const open: QuestAvailability = { progress: 0.8, state: 'available' };
const expiring: QuestAvailability = { progress: 0.2, state: 'expiring' };
const expired: QuestAvailability = { progress: 0, state: 'expired' };

/**
 * Contract (poi_spec scenario 5 + poi_family_spec S-004 + poi_cooldown_spec):
 * a quest POI that has not started is inert — bare medallion, empty halo, it
 * ignores time. The seal writes itself clockwise only with the run's
 * `activityProgress` (which requires every required slot filled, Start fired,
 * and the clock running). Only the `expiring` deadline flag flips the seal to
 * a warn countdown that appears whole and unwrites counter-clockwise.
 */
describe('mapQuestPoiView', () => {
  it('keeps the seal unwritten while the quest is only available', () => {
    const view = mapQuestPoiView('available', 0.4, open);
    expect(view).toEqual({ state: 'assigned', progress: 0, deadlineWarn: false, direction: 'clockwise' });
  });

  it('ignores stale progress in the available state even if a value leaks in', () => {
    expect(mapQuestPoiView('available', 1, open).progress).toBe(0);
    expect(mapQuestPoiView('available', 1, undefined).progress).toBe(0);
  });

  it('writes the seal with activityProgress only while the quest runs, clockwise', () => {
    expect(mapQuestPoiView('in_progress', 0.35, open)).toEqual({
      state: 'assigned',
      progress: 0.35,
      deadlineWarn: false,
      direction: 'clockwise',
    });
    expect(mapQuestPoiView('in_progress', 0, undefined).progress).toBe(0);
  });

  it('closes the seal whole once the run has ended', () => {
    expect(mapQuestPoiView('completed', 1, open).progress).toBe(1);
    expect(mapQuestPoiView('failed', 0.6, open).progress).toBe(1);
  });

  it('turns the seal into the warn countdown when the window is about to lapse', () => {
    const view = mapQuestPoiView('available', 0, expiring);
    // The flag lands at EXPIRING_BELOW of the window left: the warn seal is
    // renormalised to appear whole and drains to zero exactly at the deadline.
    expect(view).toEqual({
      state: 'expiring',
      progress: expiring.progress / EXPIRING_BELOW,
      deadlineWarn: true,
      direction: 'counterclockwise',
    });
  });

  it('starts the warn seal whole the moment the flag lands', () => {
    const atThreshold: QuestAvailability = { progress: EXPIRING_BELOW - 1e-6, state: 'expiring' };
    const view = mapQuestPoiView('available', 0, atThreshold);
    expect(view.state).toBe('expiring');
    expect(view.progress).toBeCloseTo(1, 5);
    expect(view.direction).toBe('counterclockwise');
  });

  it('lets the expired opportunity fade out', () => {
    expect(mapQuestPoiView('available', 0, open).deadlineWarn).toBe(false);
    expect(mapQuestPoiView('available', 0, expired)).toEqual({
      state: 'expired',
      progress: 0,
      deadlineWarn: true,
      direction: 'counterclockwise',
    });
  });

  it('drops the deadline reading once the expedition has left', () => {
    // Once running, the window no longer matters even if availability is still passed.
    const view = mapQuestPoiView('in_progress', 0.5, expired);
    expect(view.deadlineWarn).toBe(false);
    expect(view.state).toBe('assigned');
    expect(view.direction).toBe('clockwise');
  });
});
