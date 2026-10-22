/**
 * Unit tests for visualForkGate (PLAN-047 T-006 / v35 FROZEN).
 *
 * Synthetic fixtures: temp dirs con plans/ e .mw/runs/ finti. Copre:
 * - file visivi vs non-visivi;
 * - nessun marker → fail;
 * - marker valido + file coperto → pass;
 * - skip senza puntatore → fail;
 * - placeholder/schema → ignorati (doc, non marker);
 * - file visivo fuori copertura → fail (copertura per menzione/prefisso).
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { checkVisualForkGate, isVisualFile } from '../../../scripts/verification/visualForkGate';

let root: string;
beforeEach(() => {
  root = mkdtempSync(path.join(tmpdir(), 'vfork-'));
  mkdirSync(path.join(root, 'plans'), { recursive: true });
});
afterEach(() => rmSync(root, { recursive: true, force: true }));

const writePlan = (name: string, body: string) =>
  writeFileSync(path.join(root, 'plans', name), body);
const writeCard = (run: string, name: string, body: string) => {
  const dir = path.join(root, '.mw', 'runs', run);
  mkdirSync(dir, { recursive: true });
  writeFileSync(path.join(dir, name), body);
};

describe('isVisualFile', () => {
  it('marca src/ui, src/skins, skin config come visivi', () => {
    expect(isVisualFile('src/ui/idleVillage/panels/Slot.tsx')).toBe(true);
    expect(isVisualFile('src/skins/hud/tokens.ts')).toBe(true);
    expect(isVisualFile('src/ui/idleVillage/skinConfigRegistry.ts')).toBe(true);
    expect(isVisualFile('scripts/closureLint.ts')).toBe(false);
    expect(isVisualFile('plans/PLAN-047-visual-fork-gate.md')).toBe(false);
    expect(isVisualFile('context/INDEX.md')).toBe(false);
  });
});

describe('checkVisualForkGate', () => {
  it('passa se il diff non tocca file visivi', () => {
    const { errors } = checkVisualForkGate(root, {
      changedFiles: ['scripts/closureLint.ts', 'context/INDEX.md'],
    });
    expect(errors).toEqual([]);
  });

  it('fallisce se file visivi nel diff non dichiarati in alcun plan', () => {
    writePlan('PLAN-999-x.md', '# plan\n| T-1 | nessun riferimento ai file toccati |');
    const { errors } = checkVisualForkGate(root, {
      changedFiles: ['src/ui/idleVillage/panels/Slot.tsx'],
    });
    expect(errors.some((e) => e.includes('omissione silenziosa'))).toBe(true);
  });

  it('passa con marker card + file citato nel plan', () => {
    writeCard('run-x', 'visual-fork-slot.md', '# card\nScope: src/ui/idleVillage/panels/Slot.tsx');
    writePlan(
      'PLAN-999-x.md',
      '# plan\n- visual-fork: .mw/runs/run-x/visual-fork-slot.md\nT-1 tocca src/ui/idleVillage/panels/Slot.tsx',
    );
    const { errors } = checkVisualForkGate(root, {
      changedFiles: ['src/ui/idleVillage/panels/Slot.tsx'],
    });
    expect(errors).toEqual([]);
  });

  it('passa con skip puntato che copre il file', () => {
    writePlan(
      'PLAN-999-x.md',
      '# plan\n- visual-fork: skipped — spacing nudge, grammatica conservata — context/DECISION_LOG.md\nT-1: src/ui/idleVillage/panels/Slot.tsx',
    );
    const { errors } = checkVisualForkGate(root, {
      changedFiles: ['src/ui/idleVillage/panels/Slot.tsx'],
    });
    expect(errors).toEqual([]);
  });

  it('fallisce su skip senza puntatore', () => {
    writePlan('PLAN-999-x.md', '# plan\n- visual-fork: skipped — cosmetic fix\n');
    const { errors } = checkVisualForkGate(root, {
      changedFiles: ['src/ui/idleVillage/panels/Slot.tsx'],
    });
    expect(errors.some((e) => e.includes('senza puntatore'))).toBe(true);
  });

  it('ignora lo schema con placeholder (doc, non marker)', () => {
    writePlan(
      'PLAN-047-visual-fork-gate.md',
      '# norm\n`visual-fork: skipped — <motivo> — <puntatore>` e `src/ui/**`',
    );
    const { errors } = checkVisualForkGate(root, {
      changedFiles: ['src/ui/idleVillage/panels/Slot.tsx'],
    });
    expect(errors.some((e) => e.includes('omissione silenziosa'))).toBe(true);
    expect(errors.some((e) => e.includes('senza puntatore'))).toBe(false);
  });

  it('fallisce su file visivo fuori copertura (W-11)', () => {
    writeCard('run-x', 'visual-fork-slot.md', '# card\nScope: src/ui/idleVillage/panels/Slot.tsx');
    writePlan(
      'PLAN-999-x.md',
      '# plan\n- visual-fork: .mw/runs/run-x/visual-fork-slot.md\nT-1: src/ui/idleVillage/panels/Slot.tsx',
    );
    const { errors } = checkVisualForkGate(root, {
      changedFiles: [
        'src/ui/idleVillage/panels/Slot.tsx',
        'src/ui/idleVillage/panels/OtherPanel.tsx',
      ],
    });
    expect(errors.some((e) => e.includes('OtherPanel.tsx'))).toBe(true);
  });

  it('copre via prefisso src/ dichiarato nel corpus', () => {
    writeCard(
      'run-x',
      'visual-fork-panels.md',
      '# card\nScope: famiglia pannelli `src/ui/idleVillage/panels/`',
    );
    writePlan('PLAN-999-x.md', '# plan\n- visual-fork: .mw/runs/run-x/visual-fork-panels.md\n');
    const { errors } = checkVisualForkGate(root, {
      changedFiles: ['src/ui/idleVillage/panels/Deep/NewPanel.tsx'],
    });
    expect(errors).toEqual([]);
  });

  it('una riga di prosa che nomina il marker non conta', () => {
    writePlan(
      'PLAN-999-x.md',
      '# plan\nIl gate richiede il marker `visual-fork:` su ogni decisione estetica.',
    );
    const { errors } = checkVisualForkGate(root, {
      changedFiles: ['src/ui/idleVillage/panels/Slot.tsx'],
    });
    expect(errors.some((e) => e.includes('omissione silenziosa'))).toBe(true);
  });

  it('warn (non fail) su file attribuito a plan pre-v35 — transitorio', () => {
    writePlan(
      'PLAN-099-legacy.md',
      '# plan\n**Desiderata:** v34 FROZEN\nT-1: tocca src/ui/idleVillage/panels/Slot.tsx',
    );
    const { errors, warnings } = checkVisualForkGate(root, {
      changedFiles: ['src/ui/idleVillage/panels/Slot.tsx'],
    });
    expect(errors).toEqual([]);
    expect(warnings.some((w) => w.includes('pre-v35') && w.includes('PLAN-099-legacy.md'))).toBe(true);
  });

  it('fallisce su file attribuito a plan in regime ≥v35 senza copertura', () => {
    writePlan(
      'PLAN-099-new.md',
      '# plan\n**Desiderata:** v35 FROZEN\nT-1: tocca src/ui/idleVillage/panels/Slot.tsx',
    );
    const { errors, warnings } = checkVisualForkGate(root, {
      changedFiles: ['src/ui/idleVillage/panels/Slot.tsx'],
    });
    expect(warnings).toEqual([]);
    expect(errors.some((e) => e.includes('≥v35') && e.includes('PLAN-099-new.md'))).toBe(true);
  });

  it('attribuisce via prefisso src/ dichiarato nel plan (≥3 segmenti)', () => {
    writePlan(
      'PLAN-099-legacy.md',
      '# plan\n**Desiderata:** v30 FROZEN\nScope: famiglia `src/ui/idleVillage/panels/`',
    );
    const { errors, warnings } = checkVisualForkGate(root, {
      changedFiles: ['src/ui/idleVillage/panels/Deep/NewPanel.tsx'],
    });
    expect(errors).toEqual([]);
    expect(warnings.length).toBe(1);
  });

  it('un prefisso glob `src/ui/**` non attribuisce né copre', () => {
    writePlan(
      'PLAN-099-new.md',
      '# plan\n**Desiderata:** v35 FROZEN\nMenzione normativa: `src/ui/**` non è scope.',
    );
    const { errors } = checkVisualForkGate(root, {
      changedFiles: ['src/ui/idleVillage/panels/Slot.tsx'],
    });
    expect(errors.some((e) => e.includes('omissione silenziosa'))).toBe(true);
  });
});
