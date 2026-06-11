import { describe, it, expect } from 'vitest';
import { expireQuestOffersIfNeeded } from '@/engine/game/idleVillage/TimeEngine';
import type { VillageState, QuestOffer } from '@/engine/game/idleVillage/TimeEngine';

const makeOffer = (id: string, expiresAtTime?: number): QuestOffer => ({
  id,
  activityId: 'quest_city_rats',
  slotId: 'village_square',
  createdAtTime: 0,
  ...(expiresAtTime !== undefined ? { expiresAtTime } : {}),
});

const makeState = (offers: QuestOffer[]): VillageState => ({
  currentTime: 0,
  resources: {},
  residents: {},
  activities: {},
  eventLog: [],
  questOffers: Object.fromEntries(offers.map((o) => [o.id, o])),
});

describe('expireQuestOffersIfNeeded', () => {
  it('removes offers whose expiry time has passed', () => {
    const state = makeState([makeOffer('a', 10), makeOffer('b', 30)]);
    const next = expireQuestOffersIfNeeded(state, 20);
    expect(Object.keys(next.questOffers ?? {})).toEqual(['b']);
  });

  it('emits a quest_offer_expired event per removed offer', () => {
    const state = makeState([makeOffer('a', 10)]);
    const next = expireQuestOffersIfNeeded(state, 20);
    expect(next.eventLog).toHaveLength(1);
    expect(next.eventLog[0].type).toBe('quest_offer_expired');
    expect(next.eventLog[0].payload.offerId).toBe('a');
  });

  it('keeps offers without an expiry forever', () => {
    const state = makeState([makeOffer('a')]);
    const next = expireQuestOffersIfNeeded(state, 1_000_000);
    expect(next).toBe(state);
  });

  it('expires exactly at the expiry time (inclusive)', () => {
    const state = makeState([makeOffer('a', 10)]);
    const next = expireQuestOffersIfNeeded(state, 10);
    expect(next.questOffers).toEqual({});
  });
});
