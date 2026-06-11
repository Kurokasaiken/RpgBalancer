/**
 * SkillCheck Unit Tests — Fase 9
 *
 * Testa la logica pura del sistema skill check stile Dispatch:
 * - Calcolo zone cerchio (safe/injury/death da probabilità)
 * - Distribuzione corretta (safe + injury + death = 1)
 * - Risoluzione tiro deterministico
 * - Casi edge: 0% death, 0% injury, 100% safe
 * - Archi SVG: proporzioni corrette
 *
 * Spec: minimal_slice/09_skillcheck.md
 * Allineato: idle_village_ftue_plan.md § 6.2 SkillCheckEngine
 */

import { describe, it, expect } from 'vitest';

// ─── Tipi locali ──────────────────────────────────────────────────────────────

type SkillCheckOutcome = 'safe' | 'injury' | 'death';

interface SkillCheckChances {
  safe: number;
  injury: number;
  death: number;
}

interface SkillCheckConfig {
  injuryChance: number;
  deathChance: number;
}

// ─── Pure functions ───────────────────────────────────────────────────────────

function computeChances(config: SkillCheckConfig): SkillCheckChances {
  const death = Math.max(0, Math.min(1, config.deathChance));
  const injury = Math.max(0, Math.min(1, config.injuryChance));
  const safe = Math.max(0, 1 - injury - death);
  return { safe, injury, death };
}

function rollSkillCheck(rng: number, chances: SkillCheckChances): SkillCheckOutcome {
  if (rng < chances.death) return 'death';
  if (rng < chances.death + chances.injury) return 'injury';
  return 'safe';
}

function computeArcLengths(chances: SkillCheckChances, circumference: number): {
  safeArc: number;
  injuryArc: number;
  deathArc: number;
} {
  return {
    safeArc:   chances.safe   * circumference,
    injuryArc: chances.injury * circumference,
    deathArc:  chances.death  * circumference,
  };
}

function totalChances(chances: SkillCheckChances): number {
  return chances.safe + chances.injury + chances.death;
}

// ─── Suite ───────────────────────────────────────────────────────────────────

describe('Fase 9 — SkillCheck: Logica Dispatch', () => {

  describe('computeChances: distribuzione zone', () => {
    it('SC-001: safe + injury + death = 1.0', () => {
      const chances = computeChances({ injuryChance: 0.35, deathChance: 0.08 });
      expect(totalChances(chances)).toBeCloseTo(1.0);
    });

    it('SC-002: 0% death, 15% injury → 85% safe', () => {
      const chances = computeChances({ injuryChance: 0.15, deathChance: 0.0 });
      expect(chances.safe).toBeCloseTo(0.85);
      expect(chances.death).toBe(0);
    });

    it('SC-003: quest sicura → 100% safe', () => {
      const chances = computeChances({ injuryChance: 0.0, deathChance: 0.0 });
      expect(chances.safe).toBeCloseTo(1.0);
      expect(chances.injury).toBe(0);
      expect(chances.death).toBe(0);
    });

    it('SC-004: quest mortale → corretto split', () => {
      const chances = computeChances({ injuryChance: 0.55, deathChance: 0.35 });
      expect(chances.safe).toBeCloseTo(0.10);
      expect(chances.injury).toBeCloseTo(0.55);
      expect(chances.death).toBeCloseTo(0.35);
    });

    it('SC-005: valori negativi clampati a 0', () => {
      const chances = computeChances({ injuryChance: -0.1, deathChance: -0.2 });
      expect(chances.injury).toBe(0);
      expect(chances.death).toBe(0);
      expect(chances.safe).toBeCloseTo(1.0);
    });

    it('SC-006: valori > 1 clampati a 1', () => {
      const chances = computeChances({ injuryChance: 1.5, deathChance: 0.5 });
      expect(chances.injury).toBeLessThanOrEqual(1);
      expect(chances.death).toBeLessThanOrEqual(1);
      expect(chances.safe).toBeGreaterThanOrEqual(0);
    });
  });

  describe('rollSkillCheck: risoluzione deterministico', () => {
    const chances: SkillCheckChances = { safe: 0.57, injury: 0.35, death: 0.08 };

    it('SC-007: rng=0.0 → death (zona iniziale)', () => {
      expect(rollSkillCheck(0.0, chances)).toBe('death');
    });

    it('SC-008: rng=0.07 (< death 0.08) → death', () => {
      expect(rollSkillCheck(0.07, chances)).toBe('death');
    });

    it('SC-009: rng=0.08 (= death) → injury (death non incluso)', () => {
      expect(rollSkillCheck(0.08, chances)).toBe('injury');
    });

    it('SC-010: rng=0.40 (in injury zone) → injury', () => {
      expect(rollSkillCheck(0.40, chances)).toBe('injury');
    });

    it('SC-011: rng=0.43 (= death + injury) → safe', () => {
      expect(rollSkillCheck(0.43, chances)).toBe('safe');
    });

    it('SC-012: rng=0.99 → safe', () => {
      expect(rollSkillCheck(0.99, chances)).toBe('safe');
    });

    it('SC-013: 100% safe → sempre safe', () => {
      const allSafe: SkillCheckChances = { safe: 1, injury: 0, death: 0 };
      expect(rollSkillCheck(0.0, allSafe)).toBe('safe');
      expect(rollSkillCheck(0.5, allSafe)).toBe('safe');
      expect(rollSkillCheck(0.99, allSafe)).toBe('safe');
    });

    it('SC-014: 0% safe → mai safe se injury+death=1', () => {
      const noSafe: SkillCheckChances = { safe: 0, injury: 0.5, death: 0.5 };
      expect(rollSkillCheck(0.25, noSafe)).not.toBe('safe');
      expect(rollSkillCheck(0.75, noSafe)).not.toBe('safe');
    });
  });

  describe('computeArcLengths: proporzioni SVG', () => {
    const CIRCUMFERENCE = 502; // 2π * 80

    it('SC-015: archi si sommano alla circonferenza totale', () => {
      const chances = computeChances({ injuryChance: 0.35, deathChance: 0.08 });
      const arcs = computeArcLengths(chances, CIRCUMFERENCE);
      const total = arcs.safeArc + arcs.injuryArc + arcs.deathArc;
      expect(total).toBeCloseTo(CIRCUMFERENCE, 0);
    });

    it('SC-016: 100% safe → safeArc = circumference, altri = 0', () => {
      const chances: SkillCheckChances = { safe: 1, injury: 0, death: 0 };
      const arcs = computeArcLengths(chances, CIRCUMFERENCE);
      expect(arcs.safeArc).toBeCloseTo(CIRCUMFERENCE);
      expect(arcs.injuryArc).toBe(0);
      expect(arcs.deathArc).toBe(0);
    });

    it('SC-017: proporzioni preservate', () => {
      const chances: SkillCheckChances = { safe: 0.5, injury: 0.3, death: 0.2 };
      const arcs = computeArcLengths(chances, 100);
      expect(arcs.safeArc).toBeCloseTo(50);
      expect(arcs.injuryArc).toBeCloseTo(30);
      expect(arcs.deathArc).toBeCloseTo(20);
    });
  });
});
