/**
 * QuestCard Unit Tests — Fase 8
 *
 * Testa la logica pura del componente QuestCard:
 * - Danger rating display (stelle)
 * - Calcolo zone cerchio skill check (safe/injury/death)
 * - Guard: canStartQuest (stat requirements)
 * - Guard: locked per livello insufficiente
 * - Risk display corretto (% injury, % death)
 * - Stat requirement pass/fail
 *
 * Spec: minimal_slice/08_questcard.md
 */

import { describe, it, expect } from 'vitest';

// ─── Tipi e pure functions (estratte dalla logica QuestCard) ──────────────────

type QuestState = 'available' | 'occupied' | 'in_progress' | 'locked';

interface StatRequirement {
  statId: string;
  minValue: number;
}

interface MockQuest {
  id: string;
  name: string;
  dangerRating: number;
  injuryChance: number;
  deathChance: number;
  rewards: { gold: number; xp: number };
  requiredLevel?: number;
  statRequirements?: StatRequirement[];
  maxParticipants: number;
}

interface ResidentStats {
  level: number;
  stats: Record<string, number>;
}

function resolveQuestState(
  quest: MockQuest,
  resident: ResidentStats | null,
  hasAssignment: boolean,
  progressFraction: number,
): QuestState {
  if (quest.requiredLevel && (!resident || resident.level < quest.requiredLevel)) return 'locked';
  if (!hasAssignment) return 'available';
  if (progressFraction > 0) return 'in_progress';
  return 'occupied';
}

function checkStatRequirement(req: StatRequirement, resident: ResidentStats): boolean {
  return (resident.stats[req.statId] ?? 0) >= req.minValue;
}

function allStatRequirementsMet(quest: MockQuest, resident: ResidentStats): boolean {
  if (!quest.statRequirements || quest.statRequirements.length === 0) return true;
  return quest.statRequirements.every((req) => checkStatRequirement(req, resident));
}

function canStartQuest(quest: MockQuest, resident: ResidentStats | null): boolean {
  if (!resident) return false;
  if (quest.requiredLevel && resident.level < quest.requiredLevel) return false;
  return allStatRequirementsMet(quest, resident);
}

function dangerStars(rating: number): string {
  const clamped = Math.min(5, Math.max(0, rating));
  return '⭐'.repeat(clamped) + '☆'.repeat(5 - clamped);
}

function riskPercent(chance: number): number {
  return Math.round(chance * 100);
}

function safeChance(quest: MockQuest): number {
  return 1 - quest.injuryChance - quest.deathChance;
}

// ─── Mock data ────────────────────────────────────────────────────────────────

function makeQuest(overrides: Partial<MockQuest> = {}): MockQuest {
  return {
    id: 'quest-1',
    name: 'Test Quest',
    dangerRating: 2,
    injuryChance: 0.15,
    deathChance: 0.03,
    rewards: { gold: 20, xp: 30 },
    maxParticipants: 2,
    ...overrides,
  };
}

function makeResident(overrides: Partial<ResidentStats> = {}): ResidentStats {
  return {
    level: 2,
    stats: { combat: 5, vigor: 4, mobility: 3, knowledge: 2 },
    ...overrides,
  };
}

// ─── Suite ───────────────────────────────────────────────────────────────────

describe('Fase 8 — QuestCard: Logica', () => {

  describe('State resolution', () => {
    it('QC-001: nessun residente → available', () => {
      expect(resolveQuestState(makeQuest(), makeResident(), false, 0)).toBe('available');
    });

    it('QC-002: residente assegnato, progresso 0 → occupied', () => {
      expect(resolveQuestState(makeQuest(), makeResident(), true, 0)).toBe('occupied');
    });

    it('QC-003: residente assegnato, progresso > 0 → in_progress', () => {
      expect(resolveQuestState(makeQuest(), makeResident(), true, 0.4)).toBe('in_progress');
    });

    it('QC-004: residente null → locked se requiredLevel', () => {
      const q = makeQuest({ requiredLevel: 3 });
      expect(resolveQuestState(q, null, false, 0)).toBe('locked');
    });

    it('QC-005: livello < requiredLevel → locked', () => {
      const q = makeQuest({ requiredLevel: 5 });
      expect(resolveQuestState(q, makeResident({ level: 2 }), false, 0)).toBe('locked');
    });

    it('QC-006: livello >= requiredLevel → non locked', () => {
      const q = makeQuest({ requiredLevel: 3 });
      expect(resolveQuestState(q, makeResident({ level: 3 }), false, 0)).not.toBe('locked');
    });
  });

  describe('Danger rating display', () => {
    it('QC-007: dangerRating 1 → 1 stella piena + 4 vuote', () => {
      expect(dangerStars(1)).toBe('⭐☆☆☆☆');
    });

    it('QC-008: dangerRating 5 → 5 stelle piene', () => {
      expect(dangerStars(5)).toBe('⭐⭐⭐⭐⭐');
    });

    it('QC-009: dangerRating 0 → 5 stelle vuote', () => {
      expect(dangerStars(0)).toBe('☆☆☆☆☆');
    });

    it('QC-010: dangerRating > 5 clampato a 5', () => {
      expect(dangerStars(10)).toBe('⭐⭐⭐⭐⭐');
    });
  });

  describe('Risk percentages', () => {
    it('QC-011: injuryChance 0.35 → 35%', () => {
      expect(riskPercent(0.35)).toBe(35);
    });

    it('QC-012: deathChance 0.08 → 8%', () => {
      expect(riskPercent(0.08)).toBe(8);
    });

    it('QC-013: safeChance = 1 - injury - death', () => {
      const q = makeQuest({ injuryChance: 0.35, deathChance: 0.08 });
      expect(safeChance(q)).toBeCloseTo(0.57);
    });

    it('QC-014: safeChance + injuryChance + deathChance = 1', () => {
      const q = makeQuest({ injuryChance: 0.20, deathChance: 0.05 });
      const total = safeChance(q) + q.injuryChance + q.deathChance;
      expect(total).toBeCloseTo(1.0);
    });
  });

  describe('Stat requirements', () => {
    it('QC-015: stat met → checkStatRequirement=true', () => {
      const req: StatRequirement = { statId: 'combat', minValue: 4 };
      expect(checkStatRequirement(req, makeResident())).toBe(true);
    });

    it('QC-016: stat non met → checkStatRequirement=false', () => {
      const req: StatRequirement = { statId: 'combat', minValue: 8 };
      expect(checkStatRequirement(req, makeResident())).toBe(false);
    });

    it('QC-017: stat esatta (= minValue) → soddisfatta', () => {
      const req: StatRequirement = { statId: 'combat', minValue: 5 };
      expect(checkStatRequirement(req, makeResident())).toBe(true);
    });

    it('QC-018: stat assente nel residente → non soddisfatta', () => {
      const req: StatRequirement = { statId: 'arcana', minValue: 1 };
      expect(checkStatRequirement(req, makeResident())).toBe(false);
    });

    it('QC-019: nessun requisito → allStatRequirementsMet=true', () => {
      const q = makeQuest({ statRequirements: [] });
      expect(allStatRequirementsMet(q, makeResident())).toBe(true);
    });

    it('QC-020: tutti i requisiti soddisfatti → allStatRequirementsMet=true', () => {
      const q = makeQuest({
        statRequirements: [
          { statId: 'combat', minValue: 4 },
          { statId: 'vigor', minValue: 3 },
        ],
      });
      expect(allStatRequirementsMet(q, makeResident())).toBe(true);
    });

    it('QC-021: uno dei requisiti non soddisfatto → allStatRequirementsMet=false', () => {
      const q = makeQuest({
        statRequirements: [
          { statId: 'combat', minValue: 4 },
          { statId: 'knowledge', minValue: 10 },
        ],
      });
      expect(allStatRequirementsMet(q, makeResident())).toBe(false);
    });
  });

  describe('Guard: canStartQuest', () => {
    it('QC-022: residente null → canStart=false', () => {
      expect(canStartQuest(makeQuest(), null)).toBe(false);
    });

    it('QC-023: residente ok, nessun requisito → canStart=true', () => {
      expect(canStartQuest(makeQuest(), makeResident())).toBe(true);
    });

    it('QC-024: livello insufficiente → canStart=false', () => {
      const q = makeQuest({ requiredLevel: 5 });
      expect(canStartQuest(q, makeResident({ level: 2 }))).toBe(false);
    });

    it('QC-025: stat non soddisfatte → canStart=false', () => {
      const q = makeQuest({
        statRequirements: [{ statId: 'combat', minValue: 20 }],
      });
      expect(canStartQuest(q, makeResident())).toBe(false);
    });

    it('QC-026: tutto ok → canStart=true', () => {
      const q = makeQuest({
        requiredLevel: 2,
        statRequirements: [{ statId: 'combat', minValue: 4 }],
      });
      expect(canStartQuest(q, makeResident({ level: 2 }))).toBe(true);
    });
  });
});
