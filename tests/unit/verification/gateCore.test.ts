import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  checkEnvAttestation,
  checkKanbanGate,
  checkRichiesteGate,
  criteriaHash,
  evaluateObligation,
  parseJunit,
  parseKanbanRows,
  type Obligation,
} from '../../../scripts/verification/gateCore';

describe('parseJunit', () => {
  it('parses a clean suite', () => {
    const j = parseJunit(
      '<testsuite tests="3" failures="0" errors="0" skipped="0"><testcase name="a"></testcase></testsuite>',
    );
    expect(j.malformed).toBe(false);
    expect(j.tests).toBe(3);
    expect(j.failures).toBe(0);
  });

  it('detects failures and skipped by name', () => {
    const j = parseJunit(
      '<testsuite tests="2" failures="1" skipped="1"><testcase name="bad"><failure/></testcase><testcase name="skip"><skipped/></testcase></testsuite>',
    );
    expect(j.failedTests).toEqual(['bad']);
    expect(j.skippedTests).toEqual(['skip']);
  });

  it('flags truncated xml as malformed', () => {
    expect(parseJunit('<testsuite tests="4"><testcase').malformed).toBe(true);
    expect(parseJunit('not xml').malformed).toBe(true);
  });
});

describe('checkEnvAttestation', () => {
  const good = {
    visibilityState: 'visible',
    viewport: { width: 1440, height: 900 },
    rafTicks: 40,
    frameDiff: 0.2,
  };

  it('accepts a healthy headless env for pixel-temporal', () => {
    expect(checkEnvAttestation(good, 'pixel-temporal', 'headless-ok').ok).toBe(true);
  });

  it('rejects hidden pane (l’incidente originario)', () => {
    const r = checkEnvAttestation(
      { ...good, visibilityState: 'hidden', viewport: { width: 0, height: 0 }, rafTicks: 0 },
      'pixel-temporal',
      'headless-ok',
    );
    expect(r.ok).toBe(false);
    expect(r.reasons.join(' ')).toContain('rAF');
  });

  it('rejects missing attestation and non-headed env for headed-required', () => {
    expect(checkEnvAttestation(null, 'fps', 'headed-required').ok).toBe(false);
    expect(checkEnvAttestation(good, 'fps', 'headed-required').ok).toBe(false);
    expect(
      checkEnvAttestation({ ...good, headed: true }, 'fps', 'headed-required').ok,
    ).toBe(true);
  });
});

describe('parseKanbanRows (fence-agnostic, multi-formato)', () => {
  it('parses 8-column rows even inside an unclosed code fence', () => {
    const content = [
      '```',
      '| R-186 | Completato | 2026-10-14 | Devin | note | ai-worker | ok | Evidence: x |',
    ].join('\n');
    const rows = parseKanbanRows(content);
    expect(rows).toHaveLength(1);
    expect(rows[0].id).toBe('R-186');
    expect(rows[0].status).toBe('Completato');
  });

  it('skips headers and separators', () => {
    const content = '| Prompt ID/Descrizione | Stato | Agente | Data | Note |\n| --- | --- | --- | --- | --- |\n';
    expect(parseKanbanRows(content)).toHaveLength(0);
  });
});

describe('checkKanbanGate', () => {
  const base = '| P-1 | In corso | - | a | - | - | - | - | d | wip |\n';
  const done = '| P-1 | Completato | - | a | - | - | - | - | d | bundle: none/bundle.json |\n';
  const doneNoBundle = '| P-1 | Completato | - | a | - | - | - | - | d | fatto |\n';

  it('blocks a new Completato row without a bundle token', () => {
    expect(checkKanbanGate(base, doneNoBundle, '/tmp').length).toBe(1);
  });

  it('blocks a new Completato row with an invalid bundle path', () => {
    const errs = checkKanbanGate(base, done, '/tmp');
    expect(errs.length).toBe(1);
    expect(errs[0]).toContain('bundle non valido');
  });

  it('grandfathers rows already Completato at baseline', () => {
    const both = doneNoBundle;
    expect(checkKanbanGate(both, both, '/tmp')).toHaveLength(0);
  });

  it('accepts waived-director as explicit closure', () => {
    const waived =
      '| P-1 | Completato | - | a | - | - | - | - | d | waived-director: "il test lo faccio io" |\n';
    expect(checkKanbanGate(base, waived, '/tmp')).toHaveLength(0);
  });
});

describe('checkRichiesteGate', () => {
  const base = '## R-1 — x\n\n**Stato:** `in corso`\n';
  it('blocks fatta without Chiusura', () => {
    const cur = '## R-1 — x\n\n**Stato:** `fatta`\n';
    expect(checkRichiesteGate(base, cur, '/tmp').length).toBe(1);
  });
  it('passes fatta with explicit nessuna-verifica-tecnica', () => {
    const cur =
      '## R-1 — x\n\n**Stato:** `fatta`\n**Chiusura:** nessuna-verifica-tecnica: "analisi"\n';
    expect(checkRichiesteGate(base, cur, '/tmp')).toHaveLength(0);
  });
  it('grandfathers entries already closed at baseline', () => {
    const cur = '## R-1 — x\n\n**Stato:** `fatta`\n';
    expect(checkRichiesteGate(cur, cur, '/tmp')).toHaveLength(0);
  });
});

describe('criteriaHash', () => {
  it('changes when the criterion text changes', () => {
    expect(criteriaHash('req A', 'src')).not.toBe(criteriaHash('req B', 'src'));
  });
});

describe('evaluateObligation — max_errors', () => {
  const baseObl: Obligation = {
    id: 'OB-X',
    requirement: 'nessun errore runtime nella cattura',
    source: 'test',
    type: 'pixel-temporal',
    environment: 'headless-ok',
    min_samples: 2,
    min_frames: 1,
    max_errors: 0,
    artifacts: [
      { path: 'metrics.json', kind: 'metrics' },
      { path: 'frames', kind: 'frames' },
      { path: 'env.json', kind: 'env' },
    ],
    blocking: true,
  };

  const runDirWith = (errors: string[]) => {
    const dir = mkdtempSync(path.join(tmpdir(), 'gate-maxerr-'));
    writeFileSync(
      path.join(dir, 'metrics.json'),
      JSON.stringify({ samples: [{}, {}, {}], errors }),
    );
    mkdirSync(path.join(dir, 'frames'), { recursive: true });
    writeFileSync(path.join(dir, 'frames', 'f_00.jpg'), 'frame');
    writeFileSync(
      path.join(dir, 'env.json'),
      JSON.stringify({ visibilityState: 'visible', rafTicks: 20, frameDiff: 0.9, viewport: { width: 100, height: 100 } }),
    );
    return dir;
  };

  it('FAIL quando metrics.errors supera max_errors', () => {
    const dir = runDirWith(["TypeError: ... 'push'"]);
    const res = evaluateObligation(baseObl, dir, { exit_code: 0 });
    expect(res.result).toBe('FAIL');
    expect(res.reasons.join(' ')).toContain('errori runtime');
  });

  it('PASS quando errors è vuoto', () => {
    const dir = runDirWith([]);
    const res = evaluateObligation(baseObl, dir, { exit_code: 0 });
    expect(res.result).toBe('PASS');
  });
});
