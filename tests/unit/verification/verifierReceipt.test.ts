import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  checkDecisionReport,
  checkVerifier,
  criteriaHash,
  type CommandResult,
  type Manifest,
  type ObligationEvaluation,
  type ObligationResult,
} from '../../../scripts/verification/gateCore';
import {
  generateVerifierReceipt,
  sourceTreeHash,
  type VerifierReceipt,
} from '../../../scripts/verification/verifierReceipt';

const mkRun = () => mkdtempSync(path.join(tmpdir(), 'vrc-'));

function manifest(obligations: Manifest['obligations'], extra: Partial<Manifest> = {}): Manifest {
  return {
    task: 'T-X',
    run_id: 'run-x',
    created_at: new Date().toISOString(),
    obligations,
    ...extra,
  };
}

function evalOf(id: string, result: ObligationResult, hashes: string[] = []): ObligationEvaluation {
  return {
    id,
    result,
    reasons: [],
    artifacts: hashes.map((h) => ({ path: 'a', sha256: h, exists: true })),
  };
}

function writeVerifier(runDir: string, vf: object) {
  writeFileSync(path.join(runDir, 'verifier.json'), JSON.stringify(vf));
}

const perceptiveObl = {
  id: 'OB-1',
  requirement: 'il rendering è visibile',
  source: 'test',
  type: 'pixel-temporal' as const,
  environment: 'headless-ok' as const,
  artifacts: [],
  blocking: true,
};

describe('generateVerifierReceipt (PLAN-044 T-005)', () => {
  it('emette generated_by, exit code e hash meccanici', () => {
    const runDir = mkRun();
    writeFileSync(path.join(runDir, 'art.json'), '{"ok":true}');
    const m = manifest([perceptiveObl], { verifier_required: true });
    const evals: ObligationEvaluation[] = [
      {
        id: 'OB-1',
        result: 'PASS',
        reasons: [],
        artifacts: [{ path: 'art.json', sha256: 'abc123', exists: true }],
      },
    ];
    const cmds: Record<string, CommandResult | null> = { 'OB-1': { exit_code: 0 } };
    const receipt = generateVerifierReceipt({
      manifest: m,
      evaluations: evals,
      commandResults: cmds,
      repoRoot: runDir,
      changedFiles: ['src/x.ts', 'tests/y.test.ts'],
    });
    expect(receipt.generated_by).toContain('produceBundle');
    expect(receipt.evaluations[0].verdict).toBe('CONFIRMED');
    expect(receipt.evaluations[0].exit_code).toBe(0);
    expect(receipt.evaluations[0].criteria_sha256).toBe(
      criteriaHash(perceptiveObl.requirement, perceptiveObl.source),
    );
    expect(receipt.evaluations[0].evidence_sha256).toEqual(['abc123']);
    expect(receipt.tree_sha256).toBeTruthy();
    expect(receipt.tree_files).toBe(2);
  });

  it('marca CONTESTED/UNVERIFIABLE i risultati non-PASS e annota le deroghe', () => {
    const m = manifest([perceptiveObl]);
    const receipt = generateVerifierReceipt({
      manifest: m,
      evaluations: [
        evalOf('OB-1', 'WAIVED_DIRECTOR'),
        evalOf('OB-2', 'FAIL'),
        evalOf('OB-3', 'NOT_RUN'),
      ],
      commandResults: {},
      repoRoot: mkRun(),
    });
    const [w, f, n] = receipt.evaluations;
    expect(w.verdict).toBe('UNVERIFIABLE');
    expect(w.note).toBe('deroga Director');
    expect(f.verdict).toBe('CONTESTED');
    expect(n.verdict).toBe('UNVERIFIABLE');
    expect(n.exit_code).toBeNull();
  });
});

describe('checkVerifier — generated_by richiesto (T-005)', () => {
  const m = manifest([perceptiveObl]);
  const evals = [evalOf('OB-1', 'PASS', ['h1'])];

  it('rifiuta un verifier.json scritto a mano (LLM demosso ad advisory)', () => {
    const runDir = mkRun();
    writeVerifier(runDir, {
      verifier: 'independent-clean-context',
      evaluated_at: new Date().toISOString(),
      evaluations: [
        {
          id: 'OB-1',
          verdict: 'CONFIRMED',
          criteria_sha256: criteriaHash(perceptiveObl.requirement, perceptiveObl.source),
          evidence_sha256: ['h1'],
        },
      ],
    });
    const r = checkVerifier(m, runDir, evals);
    expect(r.ok).toBe(false);
    expect(r.reasons.join(' ')).toContain('generated_by');
  });

  it('accetta il receipt meccanico', () => {
    const runDir = mkRun();
    const receipt: VerifierReceipt = generateVerifierReceipt({
      manifest: m,
      evaluations: evals,
      commandResults: { 'OB-1': { exit_code: 0 } },
      repoRoot: runDir,
    });
    writeVerifier(runDir, receipt);
    const r = checkVerifier(m, runDir, evals);
    expect(r.ok).toBe(true);
  });

  it('il receipt su un FAIL non può confermare', () => {
    const runDir = mkRun();
    const evalsFail = [evalOf('OB-1', 'FAIL', ['h1'])];
    const receipt = generateVerifierReceipt({
      manifest: m,
      evaluations: evalsFail,
      commandResults: {},
      repoRoot: runDir,
    });
    writeVerifier(runDir, receipt);
    const r = checkVerifier(m, runDir, evalsFail);
    expect(r.ok).toBe(false);
  });
});

describe('sourceTreeHash', () => {
  it('cambia se cambia il contenuto dell’albero', () => {
    const root = mkRun();
    mkdirSync(path.join(root, 'src'), { recursive: true });
    writeFileSync(path.join(root, 'src', 'a.ts'), 'v1');
    const h1 = sourceTreeHash(root, ['src/a.ts']);
    writeFileSync(path.join(root, 'src', 'a.ts'), 'v2');
    const h2 = sourceTreeHash(root, ['src/a.ts']);
    expect(h1.sha256).not.toBe(h2.sha256);
  });

  it('ignora i file exempt', () => {
    const root = mkRun();
    const h = sourceTreeHash(root, ['.mw/director-answers.jsonl', '.mw/red-first.jsonl']);
    expect(h.files).toBe(0);
    // RICHIESTE.md non è exempt — il gate lo valuta (fatta senza bundle).
    expect(sourceTreeHash(root, ['RICHIESTE.md']).files).toBe(1);
  });
});

describe('checkDecisionReport (PLAN-044 T-006)', () => {
  it('assente + required → rosso', () => {
    const r = checkDecisionReport(mkRun(), true);
    expect(r.ok).toBe(false);
  });

  it('assente + non required → verde', () => {
    expect(checkDecisionReport(mkRun(), false).ok).toBe(true);
  });

  it('schema-check: manca "escalated" → rosso', () => {
    const runDir = mkRun();
    writeFileSync(
      path.join(runDir, 'decision-report.json'),
      JSON.stringify({ resolved: ['a'], open: [] }),
    );
    const r = checkDecisionReport(runDir, true);
    expect(r.ok).toBe(false);
    expect(r.reasons.join(' ')).toContain('escalated');
  });

  it('tre campi array → verde (contenuto advisory)', () => {
    const runDir = mkRun();
    writeFileSync(
      path.join(runDir, 'decision-report.json'),
      JSON.stringify({ resolved: ['x'], open: [], escalated: [{ id: 'E', why: 'needs Director' }] }),
    );
    expect(checkDecisionReport(runDir, true).ok).toBe(true);
  });

  it('JSON malformato → rosso', () => {
    const runDir = mkRun();
    writeFileSync(path.join(runDir, 'decision-report.json'), '{oops');
    expect(checkDecisionReport(runDir, false).ok).toBe(false);
  });
});
