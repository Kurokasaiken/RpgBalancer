/**
 * Regression test permanente — ricevute slice-kit (PLAN-127 OB-14/OB-15, R-247).
 *
 * Usa i tool REALI (slice-audit.mjs, checkSliceKitGate, slice-frame.py
 * journal logic) — non stub: OB-15 richiede che il test di accettazione
 * avversariale giri sugli stessi binari che il pipeline usa.
 *
 * Copre: record completo → verde; passi saltati → rosso con elenco;
 * ricevute stale (golden/spec/tool cambiati) → rosso; `declared:` forgiate
 * senza evidenza → rosso; journal-tamper → rosso; tripwire patch (T-32);
 * scenario avversariale completo: un flusso che salta 3 passi DEVE fallire
 * la chiusura (checkSliceKitGate). Senza slice:audit questo test non
 * esisterebbe — è la prova che l'enforcement morde.
 */
import { createHash } from 'node:crypto';
import {
  existsSync, mkdirSync, readFileSync, writeFileSync, appendFileSync,
} from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { beforeAll, describe, expect, it } from 'vitest';
import { checkSliceKitGate } from '../../../scripts/verification/sliceKitGate';

const ROOT = path.resolve(__dirname, '..', '..', '..');
const TR = path.join(ROOT, 'test-results', 'slicekit');
const AUDIT = path.join(ROOT, 'scripts', 'hud-real', 'slice-audit.mjs');
const TOOLS = {
  'slice-frame.py': 'slice-frame.py',
  'sliceability-gate.mjs': 'sliceability-gate.mjs',
} as const;

const sha12 = (p: string) =>
  createHash('sha256').update(readFileSync(p)).digest('hex').slice(0, 12);
const sha256of = (p: string) =>
  createHash('sha256').update(readFileSync(p)).digest('hex');
const toolSha = (t: keyof typeof TOOLS) =>
  sha12(path.join(ROOT, 'scripts', 'hud-real', TOOLS[t]));

const GOLDEN = 'test-results/slicekit/fixture-golden.png';
const SPEC = 'test-results/slicekit/fixture-adversarial.spec.json';

// PNG 1x1 valido — l'audit lo hash soltanto.
const PNG_1PX = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64',
);

type JournalEntry = Record<string, unknown> & { kind: string };

function writeJournal(surface: string, entries: JournalEntry[]) {
  const p = path.join(TR, `${surface}.journal.jsonl`);
  writeFileSync(
    p,
    entries
      .map((e) =>
        JSON.stringify({
          ts: '2026-11-19T00:00:00Z',
          tool: 'slice-frame.py',
          toolSha: toolSha('slice-frame.py'),
          surface,
          specHash: sha12(path.join(ROOT, SPEC)),
          inputSha: sha12(path.join(ROOT, GOLDEN)),
          ...e,
        }),
      )
      .join('\n') + '\n',
  );
  return p;
}

function receipt(overrides: Record<string, unknown> = {}) {
  return {
    tool: 'sliceability-gate.mjs',
    toolSha: toolSha('sliceability-gate.mjs'),
    at: '2026-11-19T00:00:00Z',
    exitCode: 0,
    spec: SPEC,
    specHash: sha12(path.join(ROOT, SPEC)),
    input: GOLDEN,
    inputSha: sha12(path.join(ROOT, GOLDEN)),
    verdict: 'clean',
    ...overrides,
  };
}

function manifestFor(surface: string) {
  const p = path.join(TR, `${surface}Frame.json`);
  writeFileSync(
    p,
    JSON.stringify({
      surface,
      specVersion: 2,
      source: { path: GOLDEN, sha256: sha256of(path.join(ROOT, GOLDEN)) },
      pieces: [],
    }, null, 2),
  );
  return p;
}

function writeRecord(surface: string, rec: Record<string, unknown>) {
  const p = path.join(TR, `${surface}.json`);
  writeFileSync(p, JSON.stringify({ surface, ...rec }, null, 2));
  return p;
}

function audit(surface: string, extra: string[] = []) {
  const r = spawnSync(process.execPath, [AUDIT, surface, '--json', ...extra], {
    cwd: ROOT, encoding: 'utf8',
  });
  const stdout = (r.stdout || '').trim();
  const parsed = stdout ? JSON.parse(stdout.slice(stdout.indexOf('{'))) : null;
  return { status: r.status, json: parsed };
}

const fails = (j: any, id: string) =>
  j.results.filter((x: any) => x.id === id && x.verdict === 'fail');

const goodRecord = () => ({
  golden: { path: GOLDEN, sha256: sha256of(path.join(ROOT, GOLDEN)) },
  slop_gate_1bis: { declared: true, evidence: 'OCR+NCC+lighting run — findings in review bundle', at: '2026-11-19T00:00:00Z' },
  sliceability_1ter: receipt(),
  seam_gate: { tool: 'compare-to-oracle.py', toolSha: sha12(path.join(ROOT, 'scripts', 'hud-real', 'compare-to-oracle.py')), at: '2026-11-19T00:00:00Z', exitCode: 0, verdict: 'PASS' },
  V1: { declared: true, evidence: 'vrt V1 spec run, results in night-shift/v2-probe-results.json' },
  V2: { declared: true, evidence: 'vrt V2 spec run' },
  V3: { declared: true, evidence: 'vrt V3 spec run' },
  matrix_coverage: {
    viewports: ['1280x800', '1440x900', '1920x1080', '3440x1440'],
    dprs: [1, 2],
    contents: ['normal', 'long'],
    wkwebview: true,
  },
  director_verdict: { declared: true, evidence: 'board review — Director ruling 2026-11-19' },
});

describe('slice:audit — ricevute slice-kit (PLAN-127 OB-12/14/15)', () => {
  beforeAll(() => {
    mkdirSync(TR, { recursive: true });
    writeFileSync(path.join(ROOT, GOLDEN), PNG_1PX);
    writeFileSync(path.join(ROOT, SPEC), JSON.stringify({
      specVersion: 2, surface: 'fixture-adversarial',
      source: { path: GOLDEN }, output: { dir: 'test-results/slicekit/fx' },
      slices: [],
    }));
  });

  it('record completo → exit 0', () => {
    writeRecord('fx-complete', goodRecord());
    writeJournal('fx-complete', [{ kind: 'slice' }]);
    const manifest = manifestFor('fx-complete');
    const r = audit('fx-complete', ['--manifest', manifest]);
    expect(r.status).toBe(0);
    expect(r.json.fails).toBe(0);
  });

  it('3 passi saltati → exit 1 con gli id esatti mancanti', () => {
    const rec = goodRecord() as any;
    delete rec.sliceability_1ter; delete rec.V2; delete rec.director_verdict;
    writeRecord('fx-skip3', rec);
    writeJournal('fx-skip3', [{ kind: 'slice' }]);
    const r = audit('fx-skip3', ['--manifest', manifestFor('fx-skip3')]);
    expect(r.status).toBe(1);
    for (const id of ['sliceability_1ter', 'V2', 'director_verdict']) {
      expect(fails(r.json, id).length).toBe(1);
    }
  });

  it('golden modificato dopo la ricevuta → stale, exit 1', () => {
    writeRecord('fx-stale', goodRecord());
    writeJournal('fx-stale', [{ kind: 'slice' }]);
    const manifest = manifestFor('fx-stale');
    const g = path.join(ROOT, GOLDEN);
    appendFileSync(g, Buffer.from([0])); // golden cambiato post-hoc
    try {
      const r = audit('fx-stale', ['--manifest', manifest]);
      expect(r.status).toBe(1);
      expect(fails(r.json, 'golden').length + fails(r.json, 'sliceability_1ter').length)
        .toBeGreaterThan(0);
    } finally {
      writeFileSync(g, PNG_1PX); // ripristina per gli altri test
    }
  });

  it('declared: senza evidenza → rosso', () => {
    const rec = goodRecord() as any;
    rec.director_verdict = { declared: true }; // niente evidence
    writeRecord('fx-forged', rec);
    writeJournal('fx-forged', [{ kind: 'slice' }]);
    const r = audit('fx-forged', ['--manifest', manifestFor('fx-forged')]);
    expect(r.status).toBe(1);
    expect(fails(r.json, 'director_verdict').length).toBe(1);
  });

  it('journal-tamper: regenerated falsificata → journal_integrity rosso', () => {
    writeRecord('fx-tamper', goodRecord());
    const jp = writeJournal('fx-tamper', [
      { kind: 'patch' }, { kind: 'patch' }, { kind: 'patch' },
    ]);
    // manomissione: azzerare il counter a mano
    appendFileSync(jp, JSON.stringify({
      ts: '2026-11-19T01:00:00Z', kind: 'regenerated',
      tool: 'slice-frame.py', toolSha: 'deadbeef0000',
    }) + '\n');
    const r = audit('fx-tamper', ['--manifest', manifestFor('fx-tamper')]);
    expect(r.status).toBe(1);
    expect(fails(r.json, 'journal_integrity').length).toBe(1);
  });

  it('tripwire: 3 patch senza regenerated → rosso; con regenerated → verde', () => {
    writeRecord('fx-tw', goodRecord());
    const manifest = manifestFor('fx-tw');
    writeJournal('fx-tw', [
      { kind: 'slice' }, { kind: 'patch' }, { kind: 'patch' }, { kind: 'patch' },
    ]);
    expect(fails(audit('fx-tw', ['--manifest', manifest]).json, 'patch_tripwire').length).toBe(1);
    writeJournal('fx-tw', [
      { kind: 'slice' }, { kind: 'patch' }, { kind: 'patch' },
      { kind: 'patch' }, { kind: 'regenerated' }, { kind: 'patch' },
    ]);
    expect(fails(audit('fx-tw', ['--manifest', manifest]).json, 'patch_tripwire').length).toBe(0);
  });

  it('matrix_coverage sotto il minimo [P9] → rosso', () => {
    const rec = goodRecord() as any;
    rec.matrix_coverage = { viewports: ['1440x900'], dprs: [1], contents: ['normal'], wkwebview: false };
    writeRecord('fx-matrix', rec);
    writeJournal('fx-matrix', [{ kind: 'slice' }]);
    const r = audit('fx-matrix', ['--manifest', manifestFor('fx-matrix')]);
    expect(r.status).toBe(1);
    expect(fails(r.json, 'matrix_coverage').length).toBe(1);
  });

  it('OB-15 scenario avversariale: flusso che salta 3 passi → closure:lint blocca', () => {
    // Il flusso ha prodotto spec+manifest+pezzi ma ha saltato gate, probe
    // e verdetto — e ha ignorato la skill. La closure deve fallire con
    // l'elenco delle evidenze mancanti.
    const rec = goodRecord() as any;
    delete rec.sliceability_1ter; delete rec.V1; delete rec.V2;
    delete rec.V3; delete rec.matrix_coverage; delete rec.director_verdict;
    writeRecord('fixture-adversarial', rec);
    writeJournal('fixture-adversarial', [{ kind: 'slice' }]);
    const report = checkSliceKitGate(ROOT, {
      changedFiles: ['src/generated/slicekit/fixture-adversarialFrame.ts'],
    });
    expect(report.checked).toContain('fixture-adversarial');
    expect(report.errors.length).toBeGreaterThan(0);
    expect(report.errors[0]).toContain('fixture-adversarial');
  });

  it('record reale del pilota: l\'audit mostra i passi saltati (OB-14)', () => {
    if (!existsSync(path.join(TR, 'panel-frame6.json'))) return;
    const r = audit('panel-frame6');
    // il pilota ha saltato ricevute — l'audit deve essere rosso e dirlo
    expect(r.status).toBe(1);
    expect(r.json.fails).toBeGreaterThan(0);
  });
});
