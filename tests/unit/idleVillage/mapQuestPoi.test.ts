import { describe, it, expect } from 'vitest';
import { mapQuestPoiView } from '@/ui/idleVillage/components/gameFrame/MapQuestPoi';
import type { QuestAvailability } from '@/ui/idleVillage/components/gameFrame/questAvailability';

const open: QuestAvailability = { progress: 0.8, state: 'available' };
const expiring: QuestAvailability = { progress: 0.2, state: 'expiring' };
const expired: QuestAvailability = { progress: 0, state: 'expired' };

/**
 * Contract (poi_spec scenario 5 + poi_family_spec S-004): a quest POI that has not
 * started is inert — bare medallion, empty halo, it ignores time. The seal writes
 * itself only with the run's `activityProgress` (which requires every required
 * slot filled, Start fired, and the clock running).
 */
describe('mapQuestPoiView', () => {
  it('keeps the seal unwritten while the quest is only available', () => {
    const view = mapQuestPoiView('available', 0.4, open);
    expect(view).toEqual({ state: 'assigned', progress: 0, deadlineWarn: false });
  });

  it('ignores stale progress in the available state even if a value leaks in', () => {
    expect(mapQuestPoiView('available', 1, open).progress).toBe(0);
    expect(mapQuestPoiView('available', 1, undefined).progress).toBe(0);
  });

  it('writes the seal with activityProgress only while the quest runs', () => {
    expect(mapQuestPoiView('in_progress', 0.35, open)).toEqual({
      state: 'assigned',
      progress: 0.35,
      deadlineWarn: false,
    });
    expect(mapQuestPoiView('in_progress', 0, undefined).progress).toBe(0);
  });

  it('closes the seal whole once the run has ended', () => {
    expect(mapQuestPoiView('completed', 1, open).progress).toBe(1);
    expect(mapQuestPoiView('failed', 0.6, open).progress).toBe(1);
  });

  it('surfaces the deadline ring only while the open window is about to lapse', () => {
    expect(mapQuestPoiView('available', 0, open).deadlineWarn).toBe(false);
    expect(mapQuestPoiView('available', 0, expiring).deadlineWarn).toBe(true);
    expect(mapQuestPoiView('available', 0, expired)).toEqual({
      state: 'expired',
      progress: 0,
      deadlineWarn: true,
    });
  });

  it('drops the deadline reading once the expedition has left', () => {
    // Once running, the window no longer matters even if availability is still passed.
    expect(mapQuestPoiView('in_progress', 0.5, expired).deadlineWarn).toBe(false);
    expect(mapQuestPoiView('in_progress', 0.5, expired).state).toBe('assigned');
  });
});
