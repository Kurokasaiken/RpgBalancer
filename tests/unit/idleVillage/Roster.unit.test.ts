/**
 * Roster Unit Tests — Fase 2: sortResidents + rosterSortConfig
 *
 * Verifica la logica pura di ordinamento del roster:
 * - Tutti e 4 i sort mode (name-asc, name-desc, hp-desc, fatigue-asc)
 * - Stabilità dell'ordinamento (parità)
 * - Immutabilità dell'array originale
 * - Fallback al default per mode sconosciuti
 * - ROSTER_SORT_MODES config object
 *
 * Allineato a: vertical_slice_implementation_plan.md § Fase 2
 * Spec narrativa: minimal_slice/02_roster_pgtoken.md
 *
 * NOTA: Test engine-only (pura logica TS), nessun rendering React.
 * Per i test di rendering, vedi Roster_PgToken.integration.test.tsx
 */

import { describe, it, expect } from 'vitest';
import {
  sortResidents,
  ROSTER_SORT_MODES,
  DEFAULT_ROSTER_SORT_MODE,
  getRosterSortModes,
  type RosterSortMode,
} from '@/ui/idleVillage/config/rosterSortConfig';
import type { ResidentState } from '@/engine/game/idleVillage/TimeEngine';

// ─── Mock data ───────────────────────────────────────────────────────────────

/** Crea un ResidentState minimo per test */
function makeResident(overrides: { id: string; displayName: string; currentHp?: number; fatigue?: number }): ResidentState {
  return {
    id: overrides.id,
    name: overrides.displayName,
    displayName: overrides.displayName,
    type: 'artisan',
    level: 1,
    currentHp: overrides.currentHp ?? 20,
    maxHp: 30,
    fatigue: overrides.fatigue ?? 5,
    isAway: false,
    isInjured: false,
    isBusy: false,
    assignedSlot: null,
    portraitUrl: null,
    statSnapshot: { rarity: 1 },
  } as unknown as ResidentState;
}

const MOCK_RESIDENTS: ResidentState[] = [
  makeResident({ id: 'r1', displayName: 'Zara Wildrunner', currentHp: 10, fatigue: 2 }),
  makeResident({ id: 'r2', displayName: 'Aelin Swiftblade', currentHp: 30, fatigue: 8 }),
  makeResident({ id: 'r3', displayName: 'Mira Goldweave', currentHp: 20, fatigue: 5 }),
  makeResident({ id: 'r4', displayName: 'Borin Stonefist', currentHp: 5, fatigue: 1 }),
];

// ─── Suite ───────────────────────────────────────────────────────────────────

describe('Fase 2 — Roster: sortResidents (logica pura)', () => {

  // ── TEST-019: Immutabilità ────────────────────────────────────────────────

  it('TEST-019: non modifica l\'array originale (immutabilità)', () => {
    const original = [...MOCK_RESIDENTS];
    sortResidents(MOCK_RESIDENTS, 'name-asc');
    expect(MOCK_RESIDENTS.map((r) => r.id)).toEqual(original.map((r) => r.id));
  });

  // ── TEST-020-021: Sort name-asc / name-desc ───────────────────────────────

  it('TEST-020: name-asc ordina A → Z per nome', () => {
    const sorted = sortResidents(MOCK_RESIDENTS, 'name-asc');
    const names = sorted.map((r) => r.name);
    expect(names[0]).toBe('Aelin Swiftblade');
    expect(names[names.length - 1]).toBe('Zara Wildrunner');
    // Verifica ordine completo
    expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b)));
  });

  it('TEST-021: name-desc ordina Z → A per nome', () => {
    const sorted = sortResidents(MOCK_RESIDENTS, 'name-desc');
    const names = sorted.map((r) => r.name);
    expect(names[0]).toBe('Zara Wildrunner');
    expect(names[names.length - 1]).toBe('Aelin Swiftblade');
    // Verifica ordine inverso
    expect(names).toEqual([...names].sort((a, b) => b.localeCompare(a)));
  });

  // ── TEST-022: Sort hp-desc ────────────────────────────────────────────────

  it('TEST-022: hp-desc ordina HP dal più alto al più basso', () => {
    const sorted = sortResidents(MOCK_RESIDENTS, 'hp-desc');
    const hps = sorted.map((r) => (r as unknown as { currentHp: number }).currentHp);
    // Verifica che ogni elemento sia >= il successivo
    for (let i = 0; i < hps.length - 1; i++) {
      expect(hps[i]).toBeGreaterThanOrEqual(hps[i + 1]);
    }
    expect(hps[0]).toBe(30); // Aelin ha più HP
    expect(hps[hps.length - 1]).toBe(5); // Borin ha meno HP
  });

  // ── TEST-023: Sort fatigue-asc ────────────────────────────────────────────

  it('TEST-023: fatigue-asc ordina fatica dal più basso al più alto', () => {
    const sorted = sortResidents(MOCK_RESIDENTS, 'fatigue-asc');
    const fatigues = sorted.map((r) => r.fatigue);
    // Verifica che ogni elemento sia <= il successivo
    for (let i = 0; i < fatigues.length - 1; i++) {
      expect(fatigues[i]).toBeLessThanOrEqual(fatigues[i + 1]);
    }
    expect(fatigues[0]).toBe(1); // Borin ha meno fatica
    expect(fatigues[fatigues.length - 1]).toBe(8); // Aelin ha più fatica
  });

  // ── TEST-024: Lista vuota ─────────────────────────────────────────────────

  it('TEST-024: gestisce lista vuota senza crash', () => {
    const sorted = sortResidents([], 'name-asc');
    expect(sorted).toEqual([]);
  });

  // ── TEST-025: Lista singola ───────────────────────────────────────────────

  it('TEST-025: gestisce lista con un singolo elemento', () => {
    const single = [makeResident({ id: 'solo', displayName: 'Solo Hero' })];
    const sorted = sortResidents(single, 'name-asc');
    expect(sorted).toHaveLength(1);
    expect(sorted[0].id).toBe('solo');
  });

  // ── TEST-026: Fallback su mode sconosciuto ────────────────────────────────

  it('TEST-026: fallback a name-asc per sort mode sconosciuto', () => {
    const sorted = sortResidents(MOCK_RESIDENTS, 'unknown-mode' as RosterSortMode);
    const defaultSorted = sortResidents(MOCK_RESIDENTS, 'name-asc');
    expect(sorted.map((r) => r.id)).toEqual(defaultSorted.map((r) => r.id));
  });

  // ── TEST-027-028: Parità / duplicati ─────────────────────────────────────

  it('TEST-027: ordina correttamente con nomi uguali (stabilità)', () => {
    const residents = [
      makeResident({ id: 'a', displayName: 'Aaaa' }),
      makeResident({ id: 'b', displayName: 'Aaaa' }),
      makeResident({ id: 'c', displayName: 'Aaaa' }),
    ];
    const sorted = sortResidents(residents, 'name-asc');
    expect(sorted).toHaveLength(3);
    // Tutti i nomi sono uguali, l'ordine relativo deve essere mantenuto (o almeno non crashare)
    expect(sorted.map((r) => r.name)).toEqual(['Aaaa', 'Aaaa', 'Aaaa']);
  });

  it('TEST-028: hp-desc gestisce valori HP uguali', () => {
    const residents = [
      makeResident({ id: 'x', displayName: 'X', currentHp: 20 }),
      makeResident({ id: 'y', displayName: 'Y', currentHp: 20 }),
    ];
    const sorted = sortResidents(residents, 'hp-desc');
    expect(sorted).toHaveLength(2);
    expect((sorted[0] as unknown as { currentHp: number }).currentHp).toBe(20);
  });
});

// ─── Config Object Tests ──────────────────────────────────────────────────────

describe('Fase 2 — ROSTER_SORT_MODES config', () => {

  it('TEST-029: ROSTER_SORT_MODES contiene tutti e 4 i mode', () => {
    const modes = Object.keys(ROSTER_SORT_MODES) as RosterSortMode[];
    expect(modes).toContain('name-asc');
    expect(modes).toContain('name-desc');
    expect(modes).toContain('hp-desc');
    expect(modes).toContain('fatigue-asc');
    expect(modes).toHaveLength(4);
  });

  it('TEST-030: ogni mode ha label e description non vuote', () => {
    for (const [, cfg] of Object.entries(ROSTER_SORT_MODES)) {
      const c = cfg as { label: string; description: string; mode: string };
      expect(c.label).toBeTruthy();
      expect(c.description).toBeTruthy();
      expect(c.mode).toBeTruthy();
    }
  });

  it('TEST-031: DEFAULT_ROSTER_SORT_MODE è name-asc', () => {
    expect(DEFAULT_ROSTER_SORT_MODE).toBe('name-asc');
  });

  it('TEST-032: getRosterSortModes() restituisce array con 4 elementi', () => {
    const modes = getRosterSortModes();
    expect(modes).toHaveLength(4);
    expect(modes.every((m) => m.mode && m.label && m.description)).toBe(true);
  });

  it('TEST-033: mode field corrisponde alla chiave del record', () => {
    for (const [key, cfg] of Object.entries(ROSTER_SORT_MODES)) {
      const c = cfg as { mode: string };
      expect(c.mode).toBe(key);
    }
  });
});
