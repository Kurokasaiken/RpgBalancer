/**
 * questRevealSchedule — R-200 / PLAN-037 contracts.
 *
 * (a) `questRevealSchedule` — authored order, delay = initialDelayMs +
 *     index × staggerMs, wall-clock and deterministic; empty input → empty.
 * (b) `isQuestPoiRevealed` — additive reveal: Director force, the stagger
 *     clock, or a live run each mount the marker; nothing un-reveals.
 * (c) `gameFrameConfig.questReveal` — config-first pacing: enabled, typed
 *     defaults (1000/5000), validated by the Zod schema.
 */
import { describe, expect, it } from 'vitest';
import { DEFAULT_GAME_FRAME_CONFIG } from '@/balancing/config/idleVillage/gameFrameConfig';
import { QUEST_POIS } from '@/balancing/config/idleVillage/quests/questPois';
import { isQuestPoiRevealed, questRevealSchedule } from '@/ui/idleVillage/components/gameFrame/questRevealSchedule';

describe('questRevealSchedule', () => {
  it('schedules one entry per offer in authored order (goblin → rovine)', () => {
    const schedule = questRevealSchedule(QUEST_POIS, { initialDelayMs: 1000, staggerMs: 5000 });
    expect(schedule.map((e) => e.poiId)).toEqual(QUEST_POIS.map((p) => p.id));
    expect(schedule[0].poiId).toBe('poi-goblin');
    expect(schedule.map((e) => e.delayMs)).toEqual([1000, 6000]);
  });

  it('honours arbitrary timings; empty offer list → empty schedule', () => {
    const schedule = questRevealSchedule(
      [{ id: 'a' }, { id: 'b' }, { id: 'c' }],
      { initialDelayMs: 200, staggerMs: 900 },
    );
    expect(schedule.map((e) => e.delayMs)).toEqual([200, 1100, 2000]);
    expect(questRevealSchedule([], { initialDelayMs: 0, staggerMs: 5000 })).toEqual([]);
  });

  it('is deterministic — same inputs, same schedule', () => {
    const timing = { initialDelayMs: 1000, staggerMs: 5000 };
    expect(questRevealSchedule(QUEST_POIS, timing)).toEqual(questRevealSchedule(QUEST_POIS, timing));
  });
});

describe('isQuestPoiRevealed', () => {
  const base = { revealAll: false, autoRevealedIds: new Set<string>(), hasLiveRun: false };

  it('is hidden until any channel reveals it', () => {
    expect(isQuestPoiRevealed('poi-goblin', base)).toBe(false);
    expect(isQuestPoiRevealed('poi-goblin', { ...base, autoRevealedIds: new Set(['poi-goblin']) })).toBe(true);
  });

  it('a Director force reveals every offer at once', () => {
    expect(isQuestPoiRevealed('poi-rovine', { ...base, revealAll: true })).toBe(true);
  });

  it('a live run mounts its own POI without waiting for a reveal slot (D-5)', () => {
    expect(isQuestPoiRevealed('poi-rovine', { ...base, hasLiveRun: true })).toBe(true);
  });

  it('the stagger reveals only the offers whose turn has come', () => {
    const autoRevealedIds = new Set(['poi-goblin']);
    expect(isQuestPoiRevealed('poi-goblin', { ...base, autoRevealedIds })).toBe(true);
    expect(isQuestPoiRevealed('poi-rovine', { ...base, autoRevealedIds })).toBe(false);
  });
});

describe('gameFrameConfig.questReveal', () => {
  it('ships enabled with the R-200 pacing defaults (1s first, 5s stagger)', () => {
    const { questReveal } = DEFAULT_GAME_FRAME_CONFIG;
    expect(questReveal.enabled).toBe(true);
    expect(questReveal.initialDelayMs).toBe(1000);
    expect(questReveal.staggerMs).toBe(5000);
  });
});
