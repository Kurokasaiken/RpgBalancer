/**
 * PLAN-094: AmbientDirector — deterministic admission scheduler for
 * scheduled ambient life on `/mappa2-lab` (artifact-r003).
 *
 * Contract: integer logical ticks (100 ms), <=1 tick processed per frame,
 * excess discarded + counted; eventSeed = hash32(seed, family, tick,
 * ordinal, zoneId); replay = identical spawn log for identical tick input.
 * The Director admits events; family adapters own sprites/pools/rendering.
 */

export interface ShoalFamilyConfig {
  enabled: boolean;
  probability: number;       // per-slot spawn probability, scaled by intensity
  slotSec: number;
  cooldownSec: number;
  biomeCooldownSec: number;
  maxActive: number;
  alpha: number;
  sizePx: [number, number];
  lifeSec: [number, number];
  speedPxS: [number, number];
}

export interface AmbientDirectorConfig {
  enabled: boolean;
  seed: string;
  intensity: number;
  maxConcurrentGlobal: number;
  families: { shoal: ShoalFamilyConfig };
  rare: { enabled: boolean; attemptSec: number; p: number; globalCooldownSec: number };
}

export const DEFAULT_AMBIENT_DIRECTOR_CONFIG: AmbientDirectorConfig = {
  enabled: true,
  seed: 'mappa2-v1',
  intensity: 0.6,
  maxConcurrentGlobal: 2,
  families: {
    shoal: {
      enabled: true, probability: 0.25, slotSec: 8,
      cooldownSec: 25, biomeCooldownSec: 60, maxActive: 2,
      alpha: 0.16, sizePx: [56, 110], lifeSec: [14, 22], speedPxS: [3, 8],
    },
  },
  rare: { enabled: false, attemptSec: 90, p: 0.15, globalCooldownSec: 180 },
};

/** Deterministic 32-bit hash over mixed parts (integer inputs only). */
export function hash32(...parts: (string | number)[]): number {
  let h = 2166136261 >>> 0;
  for (const p of parts) {
    const s = String(p);
    for (let i = 0; i < s.length; i += 1) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 16777619) >>> 0;
    }
    h ^= 0x9e3779b9;
    h = Math.imul(h, 16777619) >>> 0;
  }
  h ^= h >>> 15; h = Math.imul(h, 2246822519) >>> 0;
  h ^= h >>> 13; h = Math.imul(h, 3266489917) >>> 0;
  return (h ^ (h >>> 16)) >>> 0;
}

export const hash01 = (...parts: (string | number)[]): number => hash32(...parts) / 4294967296;

export interface ShoalZone {
  id: string;
  biome: string;
  cx: number;
  cy: number;
  heading: [number, number];
  maxTravelPx: number;
  tintRow: string;
  weight: number;
}

/** Sea-life form a shoal admission takes (manual lab triggers pick one; natural spawns roll it from the seed). */
export type SeaLifeKind = 'school' | 'giant' | 'turtle' | 'dolphin';
/** Giant species, when the kind is `giant`. */
export type GiantSpecies = 'manta' | 'pescione' | 'martello';

export interface Admission {
  family: 'shoal';
  zoneId: string;
  biome: string;
  tick: number;
  seed: number;
  manual?: boolean;
  kind?: SeaLifeKind;
  species?: GiantSpecies;
}

export interface SpawnRecord {
  simT: number;
  family: string;
  ordinal: number;
  zoneId: string;
  outcome: 'spawned' | 'skipped';
  reason?: string;
}

const TICK_MS = 100;
const EVAL_TICKS = 10;        // 1 Hz
const SPAWNLOG_MAX = 512;

/** Read-only occupancy declarations from independent effects (rare gate). */
export class OccupancyRegistry {
  private decl = new Map<string, { biome: string; weight: number }>();
  declare(id: string, biome: string, weight: number): void { this.decl.set(id, { biome, weight }); }
  release(id: string): void { this.decl.delete(id); }
  count(): number { return this.decl.size; }
}

export class AmbientDirector {
  simT = 0;
  droppedTicks = 0;
  droppedDeltaMs = 0;
  private carryMs = 0;
  private ordinal = 0;
  private lastSpawnTick = new Map<string, number>();
  private lastBiomeTick = new Map<string, number>();
  readonly log: SpawnRecord[] = [];
  private rareLockUntil = -1;
  private lastRareAttempt = -Infinity; // "never fired": first roll may succeed
  rareActive = false;
  nullRareUntil = -1;
  private readonly manualQueue: Admission[] = [];

  constructor(
    private readonly zones: ShoalZone[],
    private readonly cfg: () => AmbientDirectorConfig,
    readonly occupancy: OccupancyRegistry = new OccupancyRegistry(),
  ) {}

  private record(r: SpawnRecord): void {
    this.log.push(r);
    if (this.log.length > SPAWNLOG_MAX) this.log.splice(0, this.log.length - SPAWNLOG_MAX);
  }

  /** Manual lab trigger — tagged, bypasses cadence, respects caps. */
  triggerShoal(zoneId?: string, pick?: { kind?: SeaLifeKind; species?: GiantSpecies }): Admission | null {
    const c = this.cfg();
    // unknown id (zones are baked per seed) falls back to the first zone instead of silently doing nothing
    const z = (zoneId && this.zones.find((q) => q.id === zoneId)) || this.zones[0];
    if (!c.enabled || !c.families.shoal.enabled || !z) return null;
    const seed = hash32(c.seed, 'shoal', 'manual', this.ordinal++);
    const adm: Admission = { family: 'shoal', zoneId: z.id, biome: z.biome, tick: this.simT, seed, manual: true, kind: pick?.kind, species: pick?.species };
    this.manualQueue.push(adm); // drained by the next tick() — no time skew
    return adm;
  }

  /** Advance logical time: <=1 tick/frame, excess discarded deterministically. */
  tick(deltaMs: number, activeCount: () => number, reducedMotion: boolean): Admission[] {
    const out: Admission[] = [];
    this.carryMs += Math.max(0, deltaMs);
    if (this.carryMs >= TICK_MS) {
      this.simT += 1;
      const over = this.carryMs - TICK_MS;
      this.carryMs = 0;
      this.droppedTicks += over >= TICK_MS ? Math.floor(over / TICK_MS) : 0;
      this.droppedDeltaMs += over;
    } else {
      return out;
    }
    const c = this.cfg();
    if (!c.enabled) return out;
    for (const m of this.manualQueue.splice(0)) {
      this.record({ simT: this.simT, family: m.family, ordinal: this.ordinal++, zoneId: m.zoneId, outcome: 'spawned', reason: 'manual' });
      out.push({ ...m, tick: this.simT });
    }

    // rare lock expiry + attempt window (consume-before-check ordering)
    if (this.rareLockUntil >= 0 && this.simT >= this.rareLockUntil) {
      this.rareLockUntil = -1;
      this.rareActive = false;
    }
    const rare = c.rare;
    if (rare.enabled && this.simT % Math.max(1, Math.round((rare.attemptSec * 1000) / TICK_MS)) === 0) {
      const roll = hash01(c.seed, 'rare', this.simT);
      if (roll < rare.p) {
        // consume unconditionally before any asset/occupancy check
        if (this.simT - this.lastRareAttempt >= (rare.globalCooldownSec * 1000) / TICK_MS) {
          this.lastRareAttempt = this.simT;
          this.record({ simT: this.simT, family: 'rare', ordinal: this.ordinal++, zoneId: '-', outcome: 'spawned', reason: 'nullRare' });
          this.rareLockUntil = this.simT + 60; // nullRare holds the lock 6 s
          this.rareActive = true;
          this.nullRareUntil = this.rareLockUntil;
        } else {
          this.record({ simT: this.simT, family: 'rare', ordinal: this.ordinal++, zoneId: '-', outcome: 'skipped', reason: 'cooldown' });
        }
      }
    }
    if (this.rareActive || reducedMotion) return out; // lock held / frozen: no scheduled spawns

    if (this.simT % EVAL_TICKS !== 0) return out;
    const fam = c.families.shoal;
    if (!fam.enabled) return out;
    const slotTicks = Math.max(1, Math.round((fam.slotSec * 1000) / TICK_MS));
    if (this.simT % slotTicks !== 0) return out;

    const ordinal = this.ordinal++;
    for (const z of this.zones) {
      const roll = hash01(c.seed, 'shoal', this.simT, ordinal, z.id);
      if (roll >= fam.probability * c.intensity) continue;
      if (activeCount() + out.length >= Math.min(c.maxConcurrentGlobal, fam.maxActive)) {
        this.record({ simT: this.simT, family: 'shoal', ordinal, zoneId: z.id, outcome: 'skipped', reason: 'cap' });
        break;
      }
      const lastF = this.lastSpawnTick.get('shoal') ?? -Infinity;
      const lastR = this.lastBiomeTick.get(z.biome) ?? -Infinity;
      if (this.simT - lastF < (fam.cooldownSec * 1000) / TICK_MS) {
        this.record({ simT: this.simT, family: 'shoal', ordinal, zoneId: z.id, outcome: 'skipped', reason: 'cooldown' });
        continue;
      }
      if (this.simT - lastR < (fam.biomeCooldownSec * 1000) / TICK_MS) continue;
      this.lastSpawnTick.set('shoal', this.simT);
      this.lastBiomeTick.set(z.biome, this.simT);
      this.record({ simT: this.simT, family: 'shoal', ordinal, zoneId: z.id, outcome: 'spawned' });
      out.push({ family: 'shoal', zoneId: z.id, biome: z.biome, tick: this.simT, seed: hash32(c.seed, 'shoal', this.simT, ordinal, z.id) });
      break; // one admission per eval tick (world-level cap enforced above)
    }
    return out;
  }
}
