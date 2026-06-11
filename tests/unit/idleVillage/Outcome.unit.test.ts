/**
 * Outcome Unit Tests — Fase 10
 *
 * Testa la logica pura del sistema di outcome post-skill-check:
 * - Calcolo ricompense per ogni esito (success/partial/injury/death)
 * - Applicazione conseguenze (injury status, recovery days)
 * - Aggiornamento stato residente dopo esito
 * - Guard: nessuna ricompensa su death
 * - Ricompense parziali su partial success
 *
 * Spec: minimal_slice/10_outcome.md
 */

import { describe, it, expect } from 'vitest';

// ─── Tipi locali ──────────────────────────────────────────────────────────────

type OutcomeType = 'success' | 'partial' | 'injury' | 'death';
type ResidentStatus = 'available' | 'injured' | 'dead' | 'busy';

interface QuestRewards {
  gold: number;
  xp: number;
  item?: string;
}

interface OutcomeResult {
  type: OutcomeType;
  rewards: QuestRewards;
  residentStatus: ResidentStatus;
  recoveryDays: number;
  consequence: string | null;
}

interface MockResident {
  id: string;
  name: string;
  status: ResidentStatus;
  xp: number;
  gold: number;
  injuryDaysRemaining: number;
}

// ─── Pure functions ───────────────────────────────────────────────────────────

const PARTIAL_REWARD_FACTOR = 0.5;

function computeOutcomeRewards(
  type: OutcomeType,
  baseRewards: QuestRewards,
): QuestRewards {
  switch (type) {
    case 'success':
      return { ...baseRewards };
    case 'partial':
      return {
        gold: Math.round(baseRewards.gold * PARTIAL_REWARD_FACTOR),
        xp: Math.round(baseRewards.xp * PARTIAL_REWARD_FACTOR),
        item: undefined,
      };
    case 'injury':
      return {
        gold: baseRewards.gold,
        xp: Math.round(baseRewards.xp * 0.75),
      };
    case 'death':
      return { gold: 0, xp: 0 };
  }
}

function applyOutcomeToResident(
  resident: MockResident,
  outcome: OutcomeResult,
  resources: { gold: number },
): { resident: MockResident; resources: { gold: number } } {
  return {
    resident: {
      ...resident,
      status: outcome.residentStatus,
      xp: resident.xp + outcome.rewards.xp,
      injuryDaysRemaining: outcome.recoveryDays,
    },
    resources: {
      gold: resources.gold + outcome.rewards.gold,
    },
  };
}

function resolveOutcome(
  type: OutcomeType,
  baseRewards: QuestRewards,
  recoveryDays = 0,
): OutcomeResult {
  const rewards = computeOutcomeRewards(type, baseRewards);
  const residentStatus: ResidentStatus =
    type === 'death'   ? 'dead'     :
    type === 'injury'  ? 'injured'  :
                         'available';
  const consequence =
    type === 'death'  ? 'Il personaggio è caduto in battaglia.' :
    type === 'injury' ? `Ferita — recupero in ${recoveryDays} giorni.` :
    type === 'partial' ? 'Missione parzialmente riuscita.' :
                         null;

  return { type, rewards, residentStatus, recoveryDays, consequence };
}

function makeResident(overrides: Partial<MockResident> = {}): MockResident {
  return {
    id: 'res-1',
    name: 'Aelin Swiftblade',
    status: 'busy',
    xp: 100,
    gold: 0,
    injuryDaysRemaining: 0,
    ...overrides,
  };
}

// ─── Suite ───────────────────────────────────────────────────────────────────

describe('Fase 10 — Outcome: Logica Ricompense e Conseguenze', () => {

  describe('computeOutcomeRewards', () => {
    const BASE: QuestRewards = { gold: 40, xp: 80, item: 'Spada' };

    it('OUT-001: success → ricompense complete', () => {
      const r = computeOutcomeRewards('success', BASE);
      expect(r.gold).toBe(40);
      expect(r.xp).toBe(80);
      expect(r.item).toBe('Spada');
    });

    it('OUT-002: partial → gold e xp al 50%, nessun item', () => {
      const r = computeOutcomeRewards('partial', BASE);
      expect(r.gold).toBe(20);
      expect(r.xp).toBe(40);
      expect(r.item).toBeUndefined();
    });

    it('OUT-003: injury → gold completo, xp al 75%', () => {
      const r = computeOutcomeRewards('injury', BASE);
      expect(r.gold).toBe(40);
      expect(r.xp).toBe(60);
    });

    it('OUT-004: death → gold=0, xp=0', () => {
      const r = computeOutcomeRewards('death', BASE);
      expect(r.gold).toBe(0);
      expect(r.xp).toBe(0);
    });

    it('OUT-005: partial con gold dispari → arrotondamento', () => {
      const r = computeOutcomeRewards('partial', { gold: 7, xp: 7 });
      expect(r.gold).toBe(4);
      expect(r.xp).toBe(4);
    });
  });

  describe('resolveOutcome: stato residente e conseguenze', () => {
    it('OUT-006: success → residentStatus available', () => {
      const o = resolveOutcome('success', { gold: 20, xp: 50 });
      expect(o.residentStatus).toBe('available');
    });

    it('OUT-007: injury → residentStatus injured + recoveryDays', () => {
      const o = resolveOutcome('injury', { gold: 20, xp: 50 }, 2);
      expect(o.residentStatus).toBe('injured');
      expect(o.recoveryDays).toBe(2);
    });

    it('OUT-008: death → residentStatus dead', () => {
      const o = resolveOutcome('death', { gold: 0, xp: 0 });
      expect(o.residentStatus).toBe('dead');
    });

    it('OUT-009: success → consequence null', () => {
      const o = resolveOutcome('success', { gold: 20, xp: 30 });
      expect(o.consequence).toBeNull();
    });

    it('OUT-010: injury → consequence contiene testo ferita', () => {
      const o = resolveOutcome('injury', { gold: 20, xp: 30 }, 2);
      expect(o.consequence).toContain('Ferita');
    });

    it('OUT-011: death → consequence contiene testo morte', () => {
      const o = resolveOutcome('death', { gold: 0, xp: 0 });
      expect(o.consequence).toContain('caduto');
    });

    it('OUT-012: partial → consequence contiene testo parziale', () => {
      const o = resolveOutcome('partial', { gold: 20, xp: 30 });
      expect(o.consequence).toContain('parzialmente');
    });
  });

  describe('applyOutcomeToResident', () => {
    it('OUT-013: success aggiorna xp e gold del residente', () => {
      const resident = makeResident({ xp: 100 });
      const outcome = resolveOutcome('success', { gold: 25, xp: 50 });
      const result = applyOutcomeToResident(resident, outcome, { gold: 100 });

      expect(result.resident.xp).toBe(150);
      expect(result.resources.gold).toBe(125);
    });

    it('OUT-014: death non aggiunge gold/xp', () => {
      const resident = makeResident({ xp: 100 });
      const outcome = resolveOutcome('death', { gold: 50, xp: 100 });
      const result = applyOutcomeToResident(resident, outcome, { gold: 100 });

      expect(result.resident.xp).toBe(100);
      expect(result.resources.gold).toBe(100);
      expect(result.resident.status).toBe('dead');
    });

    it('OUT-015: injury imposta injuryDaysRemaining', () => {
      const resident = makeResident();
      const outcome = resolveOutcome('injury', { gold: 30, xp: 60 }, 3);
      const result = applyOutcomeToResident(resident, outcome, { gold: 0 });

      expect(result.resident.status).toBe('injured');
      expect(result.resident.injuryDaysRemaining).toBe(3);
    });

    it('OUT-016: success → injuryDaysRemaining rimane 0', () => {
      const resident = makeResident();
      const outcome = resolveOutcome('success', { gold: 10, xp: 20 });
      const result = applyOutcomeToResident(resident, outcome, { gold: 0 });

      expect(result.resident.injuryDaysRemaining).toBe(0);
    });

    it('OUT-017: immutabilità — residente originale non modificato', () => {
      const resident = makeResident({ xp: 50 });
      const outcome = resolveOutcome('success', { gold: 10, xp: 30 });
      applyOutcomeToResident(resident, outcome, { gold: 0 });

      expect(resident.xp).toBe(50);
    });
  });
});
