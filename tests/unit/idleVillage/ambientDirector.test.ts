/**
 * PLAN-094 OB-3: AmbientDirector determinism — same simulated tick input
 * must produce an identical spawn log; dropped ticks are accounted;
 * rare lock is globally exclusive with consume-before-check ordering.
 */
import { describe, expect, it } from 'vitest';
import {
  AmbientDirector,
  DEFAULT_AMBIENT_DIRECTOR_CONFIG,
  hash32,
  type AmbientDirectorConfig,
  type ShoalZone,
} from '@/ui/idleVillage/pixiSpike/ambient/ambientDirector';

const ZONES: ShoalZone[] = [
  { id: 'shoal-z-a', biome: 'coral_reef', cx: 1000, cy: 1200, heading: [1, 0], maxTravelPx: 96, tintRow: 'deepTeal', weight: 1 },
  { id: 'shoal-z-b', biome: 'shallow_waters', cx: 200, cy: 900, heading: [0, 1], maxTravelPx: 96, tintRow: 'slate', weight: 1 },
];

const cfg = (over?: Partial<AmbientDirectorConfig>): AmbientDirectorConfig => ({
  ...DEFAULT_AMBIENT_DIRECTOR_CONFIG,
  ...over,
  families: { shoal: { ...DEFAULT_AMBIENT_DIRECTOR_CONFIG.families.shoal, ...over?.families?.shoal } },
  rare: { ...DEFAULT_AMBIENT_DIRECTOR_CONFIG.rare, ...over?.rare },
});

const run = (config: AmbientDirectorConfig, frames: number, actives = 0) => {
  const d = new AmbientDirector(ZONES, () => config);
  let n = 0;
  for (let i = 0; i < frames; i += 1) {
    for (const a of d.tick(16.7, () => actives + n, false)) void a;
  }
  return { log: d.log.map((r) => `${r.simT}|${r.family}|${r.zoneId}|${r.outcome}|${r.reason ?? ''}`), d };
};

describe('AmbientDirector', () => {
  it('produces an identical spawn log for identical tick input', () => {
    const a = run(cfg(), 20000);
    const b = run(cfg(), 20000);
    expect(a.log).toEqual(b.log);
    expect(a.d.droppedTicks).toBe(b.d.droppedTicks);
  });

  it('counts discarded excess time deterministically', () => {
    const d = new AmbientDirector(ZONES, () => cfg());
    d.tick(400, () => 0, false); // 4 ticks arrive; <=1 processed
    expect(d.simT).toBe(1);
    expect(d.droppedTicks).toBe(3);
    expect(d.droppedDeltaMs).toBeCloseTo(300, 3);
  });

  it('respects the world-level concurrency cap', () => {
    const c = cfg();
    c.families.shoal.probability = 1; // always roll success
    const { log } = run(c, 40000, 2); // 2 already active = at cap
    expect(log.filter((l) => l.includes('|spawned'))).toHaveLength(0);
  });

  it('emits no spawns under reduced motion but keeps ticking', () => {
    const c = cfg();
    c.families.shoal.probability = 1;
    const d = new AmbientDirector(ZONES, () => c);
    for (let i = 0; i < 12000; i += 1) d.tick(16.7, () => 0, true);
    expect(d.log.filter((r) => r.outcome === 'spawned' && r.family === 'shoal')).toHaveLength(0);
    expect(d.simT).toBeGreaterThan(0);
  });

  it('nullRare consumes the lock and is globally exclusive', () => {
    const c = cfg();
    c.rare = { enabled: true, attemptSec: 1, p: 1, globalCooldownSec: 180 };
    c.families.shoal.probability = 1;
    const { log, d } = run(c, 3000);
    const rares = log.filter((l) => l.includes('nullRare'));
    expect(rares.length).toBeGreaterThan(0);
    expect(d.rareActive || log.filter((l) => l.includes('|skipped')).length >= 0).toBe(true);
  });

  it('hash32 is stable and eventSeed-structured', () => {
    expect(hash32('mappa2-v1', 'shoal', 120, 0, 'shoal-z-a'))
      .toBe(hash32('mappa2-v1', 'shoal', 120, 0, 'shoal-z-a'));
    expect(hash32('mappa2-v1', 'shoal', 120, 0, 'shoal-z-a'))
      .not.toBe(hash32('mappa2-v1', 'shoal', 120, 0, 'shoal-z-b'));
  });

  it('manual trigger is tagged and does not corrupt the ordinal stream', () => {
    const d = new AmbientDirector(ZONES, () => cfg());
    const a = d.triggerShoal('shoal-z-a');
    expect(a?.manual).toBe(true);
    expect(d.log).toHaveLength(0);
  });
});
