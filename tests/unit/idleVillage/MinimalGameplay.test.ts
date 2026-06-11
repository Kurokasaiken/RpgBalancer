/**
 * MinimalGameplay Unit Tests — Fase 6: Gameplay Loop Logica
 *
 * Verifica la logica del loop di gioco completo:
 * - Flusso assign → timer → complete → reward
 * - Calcolo risorse dopo completion
 * - Stato HUD: slot occupati, risorse aggiornate
 * - Nessuna corruzione di stato tra attività sequenziali
 *
 * Allineato a: vertical_slice_implementation_plan.md § Fase 6
 * Spec narrativa: minimal_slice/06_status_hud.md
 *
 * NOTA: Test engine-only (pura logica TS).
 * Il test E2E del loop completo appartiene a tests/e2e/minimal_slice_06_gameplay.spec.ts.
 */

import { describe, it, expect } from 'vitest';
import type { ResidentState } from '@/engine/game/idleVillage/TimeEngine';

// ─── Tipi locali per simulazione HUD ─────────────────────────────────────────

interface ResourceState {
  gold: number;
  wood: number;
  food: number;
  xpPool: number;
}

interface ActivitySlot {
  id: string;
  assignedResidentId: string | null;
  timerMs: number;
  maxTimerMs: number;
  status: 'empty' | 'occupied' | 'ready_to_complete';
}

interface HUDState {
  resources: ResourceState;
  slots: ActivitySlot[];
  residents: ResidentState[];
}

// ─── Helpers di simulazione (pure functions) ─────────────────────────────────

function makeResident(id: string, name: string, isBusy = false): ResidentState {
  return {
    id,
    name,
    displayName: name,
    type: 'artisan',
    level: 1,
    currentHp: 20,
    maxHp: 30,
    fatigue: 5,
    isAway: false,
    isInjured: false,
    isBusy,
    assignedSlot: null,
    portraitUrl: null,
    statSnapshot: { rarity: 1 },
  } as unknown as ResidentState;
}

function makeSlot(id: string, durationMs = 30_000): ActivitySlot {
  return {
    id,
    assignedResidentId: null,
    timerMs: durationMs,
    maxTimerMs: durationMs,
    status: 'empty',
  };
}

/** Assegna residente a slot → aggiorna HUD */
function assignToSlot(state: HUDState, residentId: string, slotId: string): HUDState {
  return {
    ...state,
    residents: state.residents.map((r) =>
      r.id === residentId
        ? ({ ...r, isBusy: true, assignedSlot: slotId } as unknown as ResidentState)
        : r,
    ),
    slots: state.slots.map((s) =>
      s.id === slotId
        ? { ...s, assignedResidentId: residentId, status: 'occupied' as const }
        : s,
    ),
  };
}

/** Avanza timer di deltaMs, transiziona a ready se scaduto */
function tickTimer(state: HUDState, slotId: string, deltaMs: number): HUDState {
  return {
    ...state,
    slots: state.slots.map((s) => {
      if (s.id !== slotId || s.status !== 'occupied') return s;
      const remaining = Math.max(0, s.timerMs - deltaMs);
      return {
        ...s,
        timerMs: remaining,
        status: remaining === 0 ? ('ready_to_complete' as const) : ('occupied' as const),
      };
    }),
  };
}

/** Completa attività: applica ricompense, libera slot e residente */
function completeActivity(
  state: HUDState,
  slotId: string,
  rewards: Partial<ResourceState>,
): HUDState {
  const slot = state.slots.find((s) => s.id === slotId);
  if (!slot || slot.status !== 'ready_to_complete') return state;

  return {
    resources: {
      gold: state.resources.gold + (rewards.gold ?? 0),
      wood: state.resources.wood + (rewards.wood ?? 0),
      food: state.resources.food + (rewards.food ?? 0),
      xpPool: state.resources.xpPool + (rewards.xpPool ?? 0),
    },
    slots: state.slots.map((s) =>
      s.id === slotId
        ? { ...makeSlot(slotId, s.maxTimerMs), status: 'empty' as const }
        : s,
    ),
    residents: state.residents.map((r) =>
      r.id === slot.assignedResidentId
        ? ({ ...r, isBusy: false, assignedSlot: null } as unknown as ResidentState)
        : r,
    ),
  };
}

// ─── Stato iniziale ───────────────────────────────────────────────────────────

function makeInitialHUD(): HUDState {
  return {
    resources: { gold: 100, wood: 50, food: 30, xpPool: 0 },
    slots: [makeSlot('slot-0', 30_000), makeSlot('slot-1', 60_000)],
    residents: [
      makeResident('res-1', 'Aelin'),
      makeResident('res-2', 'Borin'),
      makeResident('res-3', 'Mira'),
    ],
  };
}

// ─── Suite ───────────────────────────────────────────────────────────────────

describe('Fase 6 — Gameplay Loop Logica', () => {

  // ── HUD initial state ─────────────────────────────────────────────────────

  describe('HUD: stato iniziale', () => {
    it('HUD-01: HUD iniziale ha risorse corrette', () => {
      const hud = makeInitialHUD();
      expect(hud.resources.gold).toBe(100);
      expect(hud.resources.wood).toBe(50);
      expect(hud.resources.food).toBe(30);
      expect(hud.resources.xpPool).toBe(0);
    });

    it('HUD-02: HUD iniziale ha 2 slot vuoti', () => {
      const hud = makeInitialHUD();
      expect(hud.slots).toHaveLength(2);
      expect(hud.slots.every((s) => s.status === 'empty')).toBe(true);
    });

    it('HUD-03: HUD iniziale ha 3 residenti disponibili', () => {
      const hud = makeInitialHUD();
      expect(hud.residents).toHaveLength(3);
      expect(hud.residents.every((r) => !r.isBusy)).toBe(true);
    });
  });

  // ── Assign → timer ────────────────────────────────────────────────────────

  describe('Step 1: Assign → slot occupato', () => {
    it('LOOP-01: dopo assign, HUD mostra 1 slot occupato', () => {
      let hud = makeInitialHUD();
      hud = assignToSlot(hud, 'res-1', 'slot-0');

      const slot = hud.slots.find((s) => s.id === 'slot-0')!;
      expect(slot.status).toBe('occupied');
      expect(slot.assignedResidentId).toBe('res-1');
    });

    it('LOOP-02: dopo assign, residente è isBusy=true', () => {
      let hud = makeInitialHUD();
      hud = assignToSlot(hud, 'res-1', 'slot-0');

      const aelin = hud.residents.find((r) => r.id === 'res-1')!;
      expect(aelin.isBusy).toBe(true);
    });

    it('LOOP-03: altri slot e residenti non sono modificati', () => {
      let hud = makeInitialHUD();
      hud = assignToSlot(hud, 'res-1', 'slot-0');

      const slot1 = hud.slots.find((s) => s.id === 'slot-1')!;
      const borin = hud.residents.find((r) => r.id === 'res-2')!;
      expect(slot1.status).toBe('empty');
      expect(borin.isBusy).toBe(false);
    });
  });

  // ── Timer tick ────────────────────────────────────────────────────────────

  describe('Step 2: Timer tick → countdown', () => {
    it('LOOP-04: timer decrementa correttamente', () => {
      let hud = makeInitialHUD();
      hud = assignToSlot(hud, 'res-1', 'slot-0');
      hud = tickTimer(hud, 'slot-0', 10_000);

      const slot = hud.slots.find((s) => s.id === 'slot-0')!;
      expect(slot.timerMs).toBe(20_000);
      expect(slot.status).toBe('occupied');
    });

    it('LOOP-05: timer a 0 → stato diventa ready_to_complete', () => {
      let hud = makeInitialHUD();
      hud = assignToSlot(hud, 'res-1', 'slot-0');
      hud = tickTimer(hud, 'slot-0', 30_000);

      const slot = hud.slots.find((s) => s.id === 'slot-0')!;
      expect(slot.timerMs).toBe(0);
      expect(slot.status).toBe('ready_to_complete');
    });

    it('LOOP-06: timer non va sotto zero (clamp a 0)', () => {
      let hud = makeInitialHUD();
      hud = assignToSlot(hud, 'res-1', 'slot-0');
      hud = tickTimer(hud, 'slot-0', 99_999);

      const slot = hud.slots.find((s) => s.id === 'slot-0')!;
      expect(slot.timerMs).toBe(0);
    });
  });

  // ── Complete → rewards ────────────────────────────────────────────────────

  describe('Step 3: Complete → ricompense e stato aggiornato', () => {
    it('LOOP-07: dopo complete, risorse aumentano', () => {
      let hud = makeInitialHUD();
      hud = assignToSlot(hud, 'res-1', 'slot-0');
      hud = tickTimer(hud, 'slot-0', 30_000);
      hud = completeActivity(hud, 'slot-0', { gold: 25, wood: 10 });

      expect(hud.resources.gold).toBe(125);
      expect(hud.resources.wood).toBe(60);
      expect(hud.resources.food).toBe(30); // invariato
    });

    it('LOOP-08: dopo complete, slot torna a empty', () => {
      let hud = makeInitialHUD();
      hud = assignToSlot(hud, 'res-1', 'slot-0');
      hud = tickTimer(hud, 'slot-0', 30_000);
      hud = completeActivity(hud, 'slot-0', { gold: 10 });

      const slot = hud.slots.find((s) => s.id === 'slot-0')!;
      expect(slot.status).toBe('empty');
      expect(slot.assignedResidentId).toBeNull();
    });

    it('LOOP-09: dopo complete, residente torna disponibile', () => {
      let hud = makeInitialHUD();
      hud = assignToSlot(hud, 'res-1', 'slot-0');
      hud = tickTimer(hud, 'slot-0', 30_000);
      hud = completeActivity(hud, 'slot-0', { gold: 10 });

      const aelin = hud.residents.find((r) => r.id === 'res-1')!;
      expect(aelin.isBusy).toBe(false);
    });

    it('LOOP-10: complete su slot "occupied" (non ready) non ha effetto', () => {
      let hud = makeInitialHUD();
      hud = assignToSlot(hud, 'res-1', 'slot-0');
      // Non chiamiamo tickTimer — slot è ancora 'occupied'
      const hudBefore = { ...hud };
      hud = completeActivity(hud, 'slot-0', { gold: 100 });

      // Risorse non cambiano
      expect(hud.resources.gold).toBe(hudBefore.resources.gold);
    });
  });

  // ── Loop completo ─────────────────────────────────────────────────────────

  describe('Full loop: assign → timer → complete → riassegna', () => {
    it('LOOP-11: lo stesso residente può fare due attività sequenziali', () => {
      let hud = makeInitialHUD();

      // Prima attività
      hud = assignToSlot(hud, 'res-1', 'slot-0');
      hud = tickTimer(hud, 'slot-0', 30_000);
      hud = completeActivity(hud, 'slot-0', { gold: 20 });

      // Verifica stato intermedio
      const aelinAfterFirst = hud.residents.find((r) => r.id === 'res-1')!;
      expect(aelinAfterFirst.isBusy).toBe(false);

      // Seconda attività
      hud = assignToSlot(hud, 'res-1', 'slot-0');
      hud = tickTimer(hud, 'slot-0', 30_000);
      hud = completeActivity(hud, 'slot-0', { gold: 20 });

      expect(hud.resources.gold).toBe(140); // 100 + 20 + 20
    });

    it('LOOP-12: due residenti in parallelo non interferiscono', () => {
      let hud = makeInitialHUD();

      hud = assignToSlot(hud, 'res-1', 'slot-0');
      hud = assignToSlot(hud, 'res-2', 'slot-1');

      // Entrambi occupati
      expect(hud.slots[0].status).toBe('occupied');
      expect(hud.slots[1].status).toBe('occupied');

      // Completa solo slot-0
      hud = tickTimer(hud, 'slot-0', 30_000);
      hud = completeActivity(hud, 'slot-0', { gold: 15 });

      // slot-1 non è cambiato
      const slot1 = hud.slots.find((s) => s.id === 'slot-1')!;
      expect(slot1.status).toBe('occupied');
      expect(slot1.assignedResidentId).toBe('res-2');

      // res-2 ancora busy
      const borin = hud.residents.find((r) => r.id === 'res-2')!;
      expect(borin.isBusy).toBe(true);
    });

    it('LOOP-13: xpPool si accumula tra attività multiple', () => {
      let hud = makeInitialHUD();

      hud = assignToSlot(hud, 'res-1', 'slot-0');
      hud = tickTimer(hud, 'slot-0', 30_000);
      hud = completeActivity(hud, 'slot-0', { xpPool: 50 });

      hud = assignToSlot(hud, 'res-1', 'slot-0');
      hud = tickTimer(hud, 'slot-0', 30_000);
      hud = completeActivity(hud, 'slot-0', { xpPool: 75 });

      expect(hud.resources.xpPool).toBe(125);
    });
  });
});
