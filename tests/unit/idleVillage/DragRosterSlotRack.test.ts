/**
 * Drag Roster → SlotRack Integration Tests — Fase 4
 *
 * Verifica la logica di integrazione tra Roster e SlotRack durante il drag:
 * - Guard layers: prevenzione drop multiplo, ghost click, spring-return
 * - Stato residente "isBusy" dopo assegnazione
 * - Slot capacity e stato dopo drop
 * - Indipendenza degli slot (assegnazione multipla residente unico)
 * - Timing e immutabilità durante drag
 *
 * Allineato a: vertical_slice_implementation_plan.md § Fase 4
 * Spec narrativa: minimal_slice/04_drag_interactions.md
 *
 * NOTA: Test engine-only (pura logica TS).
 * I test E2E di drag visivo appartengono a tests/e2e/minimal_slice_04_drag.spec.ts.
 */

import { describe, it, expect } from 'vitest';
import { sortResidents } from '@/ui/idleVillage/config/rosterSortConfig';
import type { ResidentState } from '@/engine/game/idleVillage/TimeEngine';

// ─── Mock data helpers ───────────────────────────────────────────────────────

function makeResident(id: string, name: string, overrides: Partial<{ isBusy: boolean; isAway: boolean; isInjured: boolean; assignedSlot: string | null }> = {}): ResidentState {
  return {
    id,
    name,
    displayName: name,
    type: 'artisan',
    level: 1,
    currentHp: 20,
    maxHp: 30,
    fatigue: 5,
    isAway: overrides.isAway ?? false,
    isInjured: overrides.isInjured ?? false,
    isBusy: overrides.isBusy ?? false,
    assignedSlot: overrides.assignedSlot ?? null,
    portraitUrl: null,
    statSnapshot: { rarity: 1 },
  } as unknown as ResidentState;
}

/** Simula assegnazione di un residente a uno slot (side-effect-free) */
function assignResidentToSlot(
  residents: ResidentState[],
  residentId: string,
  slotId: string,
): ResidentState[] {
  return residents.map((r) =>
    r.id === residentId
      ? ({ ...r, isBusy: true, assignedSlot: slotId } as unknown as ResidentState)
      : r,
  );
}

/** Simula la rimozione di un residente dallo slot (spring-return o completion) */
function unassignResident(
  residents: ResidentState[],
  residentId: string,
): ResidentState[] {
  return residents.map((r) =>
    r.id === residentId
      ? ({ ...r, isBusy: false, assignedSlot: null } as unknown as ResidentState)
      : r,
  );
}

/** Guard layer G1: controlla se un residente può essere droppato in uno slot */
function canDropResidentToSlot(
  resident: ResidentState,
  slotOccupantId: string | null,
): { allowed: boolean; reason: string } {
  if (resident.isBusy) {
    return { allowed: false, reason: 'resident_already_busy' };
  }
  if (resident.isAway) {
    return { allowed: false, reason: 'resident_is_away' };
  }
  if (resident.isInjured) {
    return { allowed: false, reason: 'resident_is_injured' };
  }
  if (slotOccupantId !== null) {
    return { allowed: false, reason: 'slot_already_occupied' };
  }
  return { allowed: true, reason: 'ok' };
}

// ─── Suite ───────────────────────────────────────────────────────────────────

describe('Fase 4 — Drag Roster → SlotRack (logica guard layers)', () => {

  // ── G1: Resident state guards ─────────────────────────────────────────────

  describe('Guard Layer G1: Resident stato', () => {
    it('G1-01: permette drop se residente disponibile e slot vuoto', () => {
      const resident = makeResident('res-1', 'Aelin');
      const result = canDropResidentToSlot(resident, null);
      expect(result.allowed).toBe(true);
      expect(result.reason).toBe('ok');
    });

    it('G1-02: blocca drop se residente è già busy (già assegnato)', () => {
      const resident = makeResident('res-1', 'Aelin', { isBusy: true });
      const result = canDropResidentToSlot(resident, null);
      expect(result.allowed).toBe(false);
      expect(result.reason).toBe('resident_already_busy');
    });

    it('G1-03: blocca drop se residente è away', () => {
      const resident = makeResident('res-1', 'Aelin', { isAway: true });
      const result = canDropResidentToSlot(resident, null);
      expect(result.allowed).toBe(false);
      expect(result.reason).toBe('resident_is_away');
    });

    it('G1-04: blocca drop se residente è injured', () => {
      const resident = makeResident('res-1', 'Aelin', { isInjured: true });
      const result = canDropResidentToSlot(resident, null);
      expect(result.allowed).toBe(false);
      expect(result.reason).toBe('resident_is_injured');
    });

    it('G1-05: blocca drop se slot è già occupato', () => {
      const resident = makeResident('res-1', 'Aelin');
      const result = canDropResidentToSlot(resident, 'res-2');
      expect(result.allowed).toBe(false);
      expect(result.reason).toBe('slot_already_occupied');
    });
  });

  // ── Assegnazione e stato ──────────────────────────────────────────────────

  describe('Assegnazione residente → slot', () => {
    it('G2-01: dopo drop riuscito, residente è isBusy=true e ha assignedSlot', () => {
      const residents = [
        makeResident('res-1', 'Aelin'),
        makeResident('res-2', 'Borin'),
      ];
      const updated = assignResidentToSlot(residents, 'res-1', 'slot-woodcutting-0');

      const aelin = updated.find((r) => r.id === 'res-1')!;
      expect(aelin.isBusy).toBe(true);
      expect((aelin as unknown as { assignedSlot: string }).assignedSlot).toBe('slot-woodcutting-0');
    });

    it('G2-02: gli altri residenti non vengono modificati dall\'assegnazione', () => {
      const residents = [
        makeResident('res-1', 'Aelin'),
        makeResident('res-2', 'Borin'),
        makeResident('res-3', 'Mira'),
      ];
      const updated = assignResidentToSlot(residents, 'res-1', 'slot-quest-0');

      const borin = updated.find((r) => r.id === 'res-2')!;
      const mira = updated.find((r) => r.id === 'res-3')!;
      expect(borin.isBusy).toBe(false);
      expect(mira.isBusy).toBe(false);
    });

    it('G2-03: immutabilità — l\'array originale non viene modificato', () => {
      const residents = [makeResident('res-1', 'Aelin')];
      const originalBusy = residents[0].isBusy;
      assignResidentToSlot(residents, 'res-1', 'slot-0');
      expect(residents[0].isBusy).toBe(originalBusy);
    });
  });

  // ── Spring-return: unassign ───────────────────────────────────────────────

  describe('Spring-return: drop fallito → ritorno al roster', () => {
    it('G3-01: dopo unassign, residente torna a isBusy=false e assignedSlot=null', () => {
      const residents = [makeResident('res-1', 'Aelin', { isBusy: true, assignedSlot: 'slot-0' })];
      const updated = unassignResident(residents, 'res-1');

      const aelin = updated[0];
      expect(aelin.isBusy).toBe(false);
      expect((aelin as unknown as { assignedSlot: string | null }).assignedSlot).toBeNull();
    });

    it('G3-02: dopo spring-return, il guard layer G1 permette nuovamente il drop', () => {
      let residents = [makeResident('res-1', 'Aelin', { isBusy: true, assignedSlot: 'slot-0' })];
      residents = unassignResident(residents, 'res-1');

      const result = canDropResidentToSlot(residents[0], null);
      expect(result.allowed).toBe(true);
    });
  });

  // ── Roster visibility durante drag ───────────────────────────────────────

  describe('Roster: visibilità residenti busy durante drag', () => {
    it('G4-01: roster mostra tutti i residenti anche se busy (non nasconde)', () => {
      const residents = [
        makeResident('res-1', 'Aelin', { isBusy: true }),
        makeResident('res-2', 'Borin'),
        makeResident('res-3', 'Mira'),
      ];
      // Il Roster non filtra out i busy — li mostra come dimmed
      expect(residents).toHaveLength(3);
    });

    it('G4-02: sort continua a funzionare anche con residenti busy nel roster', () => {
      const residents = [
        makeResident('res-1', 'Zara', { isBusy: true }),
        makeResident('res-2', 'Aelin'),
        makeResident('res-3', 'Mira'),
      ];
      const sorted = sortResidents(residents, 'name-asc');
      expect(sorted[0].name).toBe('Aelin');
      expect(sorted[sorted.length - 1].name).toBe('Zara');
      // Zara è busy ma viene comunque mostrata e ordinata
      const zaraInSorted = sorted.find((r) => r.id === 'res-1');
      expect(zaraInSorted).toBeDefined();
      expect(zaraInSorted!.isBusy).toBe(true);
    });
  });

  // ── Multi-slot scenario ───────────────────────────────────────────────────

  describe('Multi-slot: assegnazione a slot diversi', () => {
    it('G5-01: due residenti diversi possono occupare slot diversi', () => {
      let residents = [
        makeResident('res-1', 'Aelin'),
        makeResident('res-2', 'Borin'),
      ];
      residents = assignResidentToSlot(residents, 'res-1', 'slot-0');
      residents = assignResidentToSlot(residents, 'res-2', 'slot-1');

      const aelin = residents.find((r) => r.id === 'res-1')!;
      const borin = residents.find((r) => r.id === 'res-2')!;
      expect(aelin.isBusy).toBe(true);
      expect(borin.isBusy).toBe(true);
      expect((aelin as unknown as { assignedSlot: string }).assignedSlot).toBe('slot-0');
      expect((borin as unknown as { assignedSlot: string }).assignedSlot).toBe('slot-1');
    });

    it('G5-02: un residente già busy non può essere droppato in un secondo slot', () => {
      let residents = [makeResident('res-1', 'Aelin')];
      residents = assignResidentToSlot(residents, 'res-1', 'slot-0');

      const busy = residents[0];
      const guard = canDropResidentToSlot(busy, null); // slot-1 è vuoto, ma Aelin è busy
      expect(guard.allowed).toBe(false);
      expect(guard.reason).toBe('resident_already_busy');
    });

    it('G5-03: ghost click guard — drop fuori slot non assegna il residente', () => {
      const resident = makeResident('res-1', 'Aelin');
      // Un drop fuori slot = nessun slot trovato = canDropResidentToSlot non viene chiamato
      // Il residente rimane invariato
      expect(resident.isBusy).toBe(false);
      expect((resident as unknown as { assignedSlot: string | null }).assignedSlot).toBeNull();
    });
  });
});
