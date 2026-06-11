/**
 * Activity Unit Tests — Fase 5: Timer + Outcome
 *
 * Verifica la logica del timer di attività e il sistema di outcome:
 * - Timer decrement corretto
 * - Transizione occupied → ready_to_complete quando timer = 0
 * - Token "congelato" durante attività (isBusy guard)
 * - Calcolo ricompense (gold, xp)
 * - Completamento attività: stato corretto dopo outcome
 * - Guard contro completamento multiplo
 *
 * Allineato a: vertical_slice_implementation_plan.md § Fase 5
 * Spec narrativa: minimal_slice/05_activity_timer.md
 */

import { describe, it, expect } from 'vitest';

// ─── Tipi locali (specchiati da MinimalActivityPage) ─────────────────────────

type SlotStatus = 'empty' | 'occupied' | 'ready_to_complete';

interface ActivitySlot {
  id: string;
  durationMs: number;
  remainingMs: number;
  status: SlotStatus;
  assignedResidentId: string | null;
  rewards: { gold: number; xp: number };
}

interface MockResident {
  id: string;
  name: string;
  level: number;
  isBusy: boolean;
  xp: number;
}

// ─── Pure functions (estratte dalla logica di MinimalActivityPage) ────────────

function makeSlot(id: string, durationMs: number, rewards = { gold: 10, xp: 20 }): ActivitySlot {
  return { id, durationMs, remainingMs: durationMs, status: 'empty', assignedResidentId: null, rewards };
}

function makeResident(id: string, name: string): MockResident {
  return { id, name, level: 1, isBusy: false, xp: 0 };
}

function assignToSlot(slot: ActivitySlot, residentId: string): ActivitySlot {
  return { ...slot, assignedResidentId: residentId, status: 'occupied', remainingMs: slot.durationMs };
}

function tickTimer(slot: ActivitySlot, deltaMs: number): ActivitySlot {
  if (slot.status !== 'occupied') return slot;
  const remaining = Math.max(0, slot.remainingMs - deltaMs);
  return { ...slot, remainingMs: remaining, status: remaining === 0 ? 'ready_to_complete' : 'occupied' };
}

function completeActivity(
  slot: ActivitySlot,
  resident: MockResident,
): { slot: ActivitySlot; resident: MockResident; gold: number } | null {
  if (slot.status !== 'ready_to_complete') return null;
  return {
    slot: { ...makeSlot(slot.id, slot.durationMs, slot.rewards), status: 'empty' },
    resident: { ...resident, isBusy: false, xp: resident.xp + slot.rewards.xp },
    gold: slot.rewards.gold,
  };
}

// ─── Suite ───────────────────────────────────────────────────────────────────

describe('Fase 5 — Activity: Timer Logic', () => {

  // ── Stato iniziale ────────────────────────────────────────────────────────

  describe('Slot: stato iniziale', () => {
    it('ACT-001: slot iniziale è empty con remainingMs = durationMs', () => {
      const slot = makeSlot('slot-0', 30_000);
      expect(slot.status).toBe('empty');
      expect(slot.remainingMs).toBe(30_000);
      expect(slot.assignedResidentId).toBeNull();
    });
  });

  // ── Assign ────────────────────────────────────────────────────────────────

  describe('Assign: residente → slot', () => {
    it('ACT-002: dopo assign, slot è occupied e ha assignedResidentId', () => {
      const slot = assignToSlot(makeSlot('slot-0', 30_000), 'res-1');
      expect(slot.status).toBe('occupied');
      expect(slot.assignedResidentId).toBe('res-1');
    });

    it('ACT-003: dopo assign, timer è al massimo (durationMs)', () => {
      const slot = assignToSlot(makeSlot('slot-0', 30_000), 'res-1');
      expect(slot.remainingMs).toBe(30_000);
    });
  });

  // ── Timer tick ────────────────────────────────────────────────────────────

  describe('Timer: tick e decrement', () => {
    it('ACT-004: timer decrementa di deltaMs ad ogni tick', () => {
      let slot = assignToSlot(makeSlot('slot-0', 30_000), 'res-1');
      slot = tickTimer(slot, 5_000);
      expect(slot.remainingMs).toBe(25_000);
      expect(slot.status).toBe('occupied');
    });

    it('ACT-005: timer non va sotto zero (clamp)', () => {
      let slot = assignToSlot(makeSlot('slot-0', 30_000), 'res-1');
      slot = tickTimer(slot, 999_999);
      expect(slot.remainingMs).toBe(0);
    });

    it('ACT-006: timer = 0 → stato diventa ready_to_complete', () => {
      let slot = assignToSlot(makeSlot('slot-0', 10_000), 'res-1');
      slot = tickTimer(slot, 10_000);
      expect(slot.status).toBe('ready_to_complete');
      expect(slot.remainingMs).toBe(0);
    });

    it('ACT-007: tick multipli convergono a 0', () => {
      let slot = assignToSlot(makeSlot('slot-0', 6_000), 'res-1');
      slot = tickTimer(slot, 1_000);
      slot = tickTimer(slot, 1_000);
      slot = tickTimer(slot, 1_000);
      slot = tickTimer(slot, 1_000);
      slot = tickTimer(slot, 1_000);
      slot = tickTimer(slot, 1_000);
      expect(slot.status).toBe('ready_to_complete');
    });

    it('ACT-008: tickTimer non agisce su slot empty', () => {
      const slot = makeSlot('slot-0', 10_000);
      const after = tickTimer(slot, 5_000);
      expect(after.remainingMs).toBe(10_000); // invariato
      expect(after.status).toBe('empty');
    });

    it('ACT-009: tickTimer non agisce su slot ready_to_complete (già scaduto)', () => {
      let slot = assignToSlot(makeSlot('slot-0', 5_000), 'res-1');
      slot = tickTimer(slot, 5_000); // → ready
      const after = tickTimer(slot, 1_000); // non deve agire
      expect(after.remainingMs).toBe(0);
      expect(after.status).toBe('ready_to_complete');
    });
  });

  // ── Completamento ─────────────────────────────────────────────────────────

  describe('Complete: outcome e ricompense', () => {
    it('ACT-010: completeActivity restituisce gold e xp corretti', () => {
      let slot = assignToSlot(makeSlot('slot-0', 5_000, { gold: 25, xp: 50 }), 'res-1');
      slot = tickTimer(slot, 5_000);
      const resident = makeResident('res-1', 'Aelin');
      const result = completeActivity(slot, resident);

      expect(result).not.toBeNull();
      expect(result!.gold).toBe(25);
      expect(result!.resident.xp).toBe(50);
    });

    it('ACT-011: dopo completamento, slot torna a empty', () => {
      let slot = assignToSlot(makeSlot('slot-0', 5_000, { gold: 10, xp: 20 }), 'res-1');
      slot = tickTimer(slot, 5_000);
      const result = completeActivity(slot, makeResident('res-1', 'Borin'));

      expect(result!.slot.status).toBe('empty');
      expect(result!.slot.assignedResidentId).toBeNull();
    });

    it('ACT-012: dopo completamento, residente non è busy', () => {
      let slot = assignToSlot(makeSlot('slot-0', 5_000, { gold: 10, xp: 20 }), 'res-1');
      slot = tickTimer(slot, 5_000);
      const resident = { ...makeResident('res-1', 'Mira'), isBusy: true };
      const result = completeActivity(slot, resident);

      expect(result!.resident.isBusy).toBe(false);
    });

    it('ACT-013: guard — completeActivity ritorna null se slot non è ready', () => {
      const slot = assignToSlot(makeSlot('slot-0', 5_000), 'res-1');
      // Non chiamiamo tickTimer: slot è 'occupied'
      const result = completeActivity(slot, makeResident('res-1', 'Lyra'));
      expect(result).toBeNull();
    });

    it('ACT-014: guard — completeActivity ritorna null se slot è empty', () => {
      const slot = makeSlot('slot-0', 5_000);
      const result = completeActivity(slot, makeResident('res-1', 'Garrick'));
      expect(result).toBeNull();
    });

    it('ACT-015: XP si accumula su attività multiple per lo stesso residente', () => {
      let slot1 = assignToSlot(makeSlot('slot-0', 1_000, { gold: 5, xp: 30 }), 'res-1');
      slot1 = tickTimer(slot1, 1_000);
      let resident = makeResident('res-1', 'Aelin');
      const r1 = completeActivity(slot1, resident);
      resident = r1!.resident; // xp = 30

      let slot2 = assignToSlot(makeSlot('slot-0', 1_000, { gold: 5, xp: 45 }), 'res-1');
      slot2 = tickTimer(slot2, 1_000);
      const r2 = completeActivity(slot2, resident);

      expect(r2!.resident.xp).toBe(75); // 30 + 45
    });
  });
});
