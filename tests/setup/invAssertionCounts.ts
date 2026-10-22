/**
 * invAssertionCounts — PLAN-054 T-005: conteggio asserzioni per test
 * `// INV:<id>` durante le run del sync gate.
 *
 * Attivo solo sotto `SYNC_GATE=1` (o `INV_COUNTS_FILE`): registra in
 * `afterEach` il delta di `expect.getState().assertionCalls` rispetto al
 * `beforeEach` — cioè le asserzioni del tentativo corrente. Per test con
 * `retry` ogni tentativo produce una entry: il gate usa l'ultima entry
 * passed. Il cumulato di `expect.poll`/`toPass` NON è affidabile qui:
 * quei blocchi usano il floor statico (invCounts.resolveExecutedCount).
 *
 * Output: JSONL append in `INV_COUNTS_FILE` (default
 * `test-results/inv-executed-counts.json`), un record per test.
 */
import { appendFileSync, mkdirSync } from 'node:fs';
import { dirname, relative, resolve } from 'node:path';
import { afterEach, beforeEach, expect } from 'vitest';

const ENABLED = process.env.SYNC_GATE === '1' || Boolean(process.env.INV_COUNTS_FILE);
const OUT = process.env.INV_COUNTS_FILE ?? 'test-results/inv-executed-counts.json';

if (ENABLED) {
  let baselineCalls = 0;
  beforeEach(() => {
    baselineCalls = expect.getState().assertionCalls ?? 0;
  });
  afterEach((ctx) => {
    const calls = (expect.getState().assertionCalls ?? 0) - baselineCalls;
    const file = ctx.task.file?.filepath
      ? relative(process.cwd(), resolve(ctx.task.file.filepath)).split('\\').join('/')
      : String(ctx.task.file?.name ?? 'unknown');
    const title = ctx.task.name ?? '';
    const status = ctx.task.result?.state === 'pass' ? 'passed' : ctx.task.result?.state === 'fail' ? 'failed' : 'skipped';
    try {
      mkdirSync(dirname(OUT), { recursive: true });
      appendFileSync(OUT, `${JSON.stringify({ file, title, assertionCalls: calls, status })}\n`);
    } catch {
      /* conteggio non persistibile: il gate fallirà closed sul join */
    }
  });
}
