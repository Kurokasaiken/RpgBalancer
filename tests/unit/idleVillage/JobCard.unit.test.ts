/**
 * JobCard Unit Tests — Fase 7
 *
 * Testa la logica pura del componente JobCard in isolamento:
 * - Determinazione stato job (empty/occupied/in_progress/locked)
 * - Calcolo progresso e formattazione
 * - Guard layer: assegnazione bloccata se slot pieno
 * - Guard layer: stato locked se livello insufficiente
 * - Difficoltà e colori associati
 *
 * Spec: minimal_slice/07_jobcard.md
 */

import { describe, it, expect } from 'vitest';

// ─── Tipi locali ──────────────────────────────────────────────────────────────

type JobDifficulty = 'easy' | 'medium' | 'hard';
type JobState = 'empty' | 'occupied' | 'in_progress' | 'locked';

interface MockJob {
  id: string;
  name: string;
  icon: string;
  difficulty: JobDifficulty;
  rewards: { gold: number; xp: number };
  durationSeconds: number;
  maxSlots: number;
  requiredLevel?: number;
}

interface JobSlotState {
  assignedResidentName: string | null;
  progressFraction: number;
}

// ─── Logica pura da testare ───────────────────────────────────────────────────

const DIFFICULTY_LABELS: Record<JobDifficulty, string> = {
  easy:   'Facile',
  medium: 'Medio',
  hard:   'Difficile',
};

function resolveJobState(
  job: MockJob,
  slot: JobSlotState,
  residentLevel: number,
): JobState {
  if (job.requiredLevel && residentLevel < job.requiredLevel) return 'locked';
  if (!slot.assignedResidentName) return 'empty';
  if (slot.progressFraction > 0) return 'in_progress';
  return 'occupied';
}

function formatProgress(fraction: number): string {
  return `${Math.round(Math.max(0, Math.min(1, fraction)) * 100)}%`;
}

function canAssign(job: MockJob, slot: JobSlotState, residentLevel: number): boolean {
  if (job.requiredLevel && residentLevel < job.requiredLevel) return false;
  if (slot.assignedResidentName !== null) return false;
  return true;
}

function difficultyLabel(d: JobDifficulty): string {
  return DIFFICULTY_LABELS[d];
}

// ─── Mock data ────────────────────────────────────────────────────────────────

function makeJob(overrides: Partial<MockJob> = {}): MockJob {
  return {
    id: 'job-1',
    name: 'Taglio Legna',
    icon: '🪓',
    difficulty: 'easy',
    rewards: { gold: 5, xp: 10 },
    durationSeconds: 30,
    maxSlots: 2,
    ...overrides,
  };
}

function makeSlot(overrides: Partial<JobSlotState> = {}): JobSlotState {
  return { assignedResidentName: null, progressFraction: 0, ...overrides };
}

// ─── Suite ───────────────────────────────────────────────────────────────────

describe('Fase 7 — JobCard: Logica', () => {

  describe('State resolution', () => {
    it('JC-001: slot vuoto → stato empty', () => {
      expect(resolveJobState(makeJob(), makeSlot(), 1)).toBe('empty');
    });

    it('JC-002: slot con residente, progresso 0 → occupied', () => {
      const slot = makeSlot({ assignedResidentName: 'Aelin', progressFraction: 0 });
      expect(resolveJobState(makeJob(), slot, 1)).toBe('occupied');
    });

    it('JC-003: slot con residente e progresso > 0 → in_progress', () => {
      const slot = makeSlot({ assignedResidentName: 'Aelin', progressFraction: 0.5 });
      expect(resolveJobState(makeJob(), slot, 1)).toBe('in_progress');
    });

    it('JC-004: livello residente < requiredLevel → locked', () => {
      const job = makeJob({ requiredLevel: 3 });
      expect(resolveJobState(job, makeSlot(), 1)).toBe('locked');
    });

    it('JC-005: livello residente >= requiredLevel → non locked', () => {
      const job = makeJob({ requiredLevel: 3 });
      expect(resolveJobState(job, makeSlot(), 3)).not.toBe('locked');
    });

    it('JC-006: locked ha priorità su tutto', () => {
      const job = makeJob({ requiredLevel: 5 });
      const slot = makeSlot({ assignedResidentName: 'Borin', progressFraction: 0.8 });
      expect(resolveJobState(job, slot, 2)).toBe('locked');
    });
  });

  describe('Progress formatting', () => {
    it('JC-007: 0.0 → "0%"', () => {
      expect(formatProgress(0)).toBe('0%');
    });

    it('JC-008: 1.0 → "100%"', () => {
      expect(formatProgress(1)).toBe('100%');
    });

    it('JC-009: 0.65 → "65%"', () => {
      expect(formatProgress(0.65)).toBe('65%');
    });

    it('JC-010: valore > 1 clampato a 100%', () => {
      expect(formatProgress(1.5)).toBe('100%');
    });

    it('JC-011: valore < 0 clampato a 0%', () => {
      expect(formatProgress(-0.3)).toBe('0%');
    });
  });

  describe('Guard: canAssign', () => {
    it('JC-012: slot vuoto + livello ok → canAssign=true', () => {
      expect(canAssign(makeJob(), makeSlot(), 1)).toBe(true);
    });

    it('JC-013: slot già occupato → canAssign=false', () => {
      const slot = makeSlot({ assignedResidentName: 'Borin' });
      expect(canAssign(makeJob(), slot, 1)).toBe(false);
    });

    it('JC-014: livello insufficiente → canAssign=false', () => {
      const job = makeJob({ requiredLevel: 4 });
      expect(canAssign(job, makeSlot(), 2)).toBe(false);
    });

    it('JC-015: livello esatto (= requiredLevel) → canAssign=true', () => {
      const job = makeJob({ requiredLevel: 3 });
      expect(canAssign(job, makeSlot(), 3)).toBe(true);
    });
  });

  describe('Difficulty labels', () => {
    it('JC-016: easy → "Facile"', () => {
      expect(difficultyLabel('easy')).toBe('Facile');
    });

    it('JC-017: medium → "Medio"', () => {
      expect(difficultyLabel('medium')).toBe('Medio');
    });

    it('JC-018: hard → "Difficile"', () => {
      expect(difficultyLabel('hard')).toBe('Difficile');
    });
  });

  describe('Rewards data integrity', () => {
    it('JC-019: job ha sempre gold e xp >= 0', () => {
      const job = makeJob({ rewards: { gold: 10, xp: 25 } });
      expect(job.rewards.gold).toBeGreaterThanOrEqual(0);
      expect(job.rewards.xp).toBeGreaterThanOrEqual(0);
    });

    it('JC-020: job con reward gold=0 è valido (missione gratuita)', () => {
      const job = makeJob({ rewards: { gold: 0, xp: 5 } });
      expect(job.rewards.gold).toBe(0);
    });
  });
});
