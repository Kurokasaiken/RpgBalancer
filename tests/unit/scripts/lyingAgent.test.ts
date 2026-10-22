/**
 * lyingAgent — fixture seeded-fault (PLAN-051 T-006), livello unitario.
 *
 * Scenario: un agente "mente" — l'exit code reale del comando è 1, ma lui
 * ha scritto a mano verifier.json e bundle.json che dichiarano PASS.
 * Il layer di valutazione deve derivare il verdetto dai commandResults
 * eseguiti, mai dai file agente-scritti, e il receipt rigenerato deve
 * portare `generated_by` (un verifier hand-written non è accettato).
 */
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { evaluateManifest, Manifest } from '../../../scripts/verification/gateCore';
import { generateVerifierReceipt } from '../../../scripts/verification/verifierReceipt';

const tmpDirs: string[] = [];
function mkRun(): string {
  const d = mkdtempSync(path.join(tmpdir(), 'lying-'));
  tmpDirs.push(d);
  return d;
}
afterEach(() => {
  while (tmpDirs.length) rmSync(tmpDirs.pop()!, { recursive: true, force: true });
});

const manifest: Manifest = {
  task: 'lying-agent-test',
  run_id: 'lying-agent-test',
  created_at: new Date().toISOString(),
  obligations: [
    {
      id: 'OB-LIE',
      requirement: 'il check deve passare',
      source: 'test fixture',
      type: 'state',
      environment: 'headless-ok',
      blocking: true,
      command: 'exit 1',
      artifacts: [],
    },
  ],
};

describe('lying-agent fixture (PLAN-051 T-006)', () => {
  it('verdetto derivato dai commandResults: FAIL anche se i file dicono PASS', () => {
    const runDir = mkRun();
    // prove fasulle agente-scritte già presenti nel run dir
    writeFileSync(
      path.join(runDir, 'verifier.json'),
      JSON.stringify({ verdict: 'PASS', generated_by: null }),
    );
    writeFileSync(
      path.join(runDir, 'bundle.json'),
      JSON.stringify({ verdict: 'PASS', produced_at: new Date().toISOString() }),
    );

    const bundle = evaluateManifest(
      manifest,
      runDir,
      {
        'OB-LIE': { exit_code: 1, timed_out: false },
      },
      { ok: true, reasons: [] },
      { ok: true, reasons: [] },
    );

    expect(bundle.verdict).toBe('BLOCKED');
    expect(bundle.obligations[0].result).toBe('FAIL');
  });

  it('il receipt meccanico porta generated_by — un verifier hand-written non vale', () => {
    const runDir = mkRun();
    const receipt = generateVerifierReceipt({
      manifest,
      evaluations: [
        { id: 'OB-LIE', result: 'FAIL', reasons: ['exit_code=1'], artifacts: [] },
      ],
      commandResults: {},
      repoRoot: process.cwd(),
      changedFiles: [],
    });
    expect(typeof receipt.generated_by).toBe('string');
    expect(receipt.generated_by.length).toBeGreaterThan(0);
    expect(readFileSync).toBeDefined();
  });
});
