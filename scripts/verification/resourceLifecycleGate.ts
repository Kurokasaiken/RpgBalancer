/**
 * resourceLifecycleGate — gate "no unowned resources" (MW PLAN-071, R-LIFECYCLE).
 *
 * Delegates the mechanical check to `~/.mw/bin/mw-reap --gate <repoRoot>`:
 * fails on expired registry entries, L1 leak candidates and L3 orphan
 * servers under the project cwd. If the tool is absent the gate is a
 * warning, never a silent pass — the invariant is a rule, the tool is its
 * enforcement.
 */
import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const REAPER = path.join(os.homedir(), '.mw', 'bin', 'mw-reap');

export function checkResourceLifecycleGate(repoRoot: string): {
  errors: string[];
  warnings: string[];
} {
  if (!existsSync(REAPER)) {
    return {
      errors: [],
      warnings: [
        'resource-lifecycle gate: ~/.mw/bin/mw-reap non trovato — installare i tool MW (PLAN-071)',
      ],
    };
  }
  try {
    const out = execFileSync(REAPER, ['--gate', repoRoot], {
      encoding: 'utf8',
      timeout: 60_000,
    });
    return { errors: [], warnings: out.trim() ? [out.trim()] : [] };
  } catch (err) {
    const msg =
      err && typeof err === 'object' && 'stdout' in err
        ? String((err as { stdout?: unknown }).stdout ?? '').trim()
        : String(err);
    return {
      errors: [
        `resource-lifecycle gate: risorse unowned nel progetto — chiudi, adopta (mw-adopt) o uccidi (mw-kill): ${msg}`,
      ],
      warnings: [],
    };
  }
}
