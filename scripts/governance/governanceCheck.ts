/**
 * governance:check — orchestrator of the repo's mechanical invariant checks
 * (PLAN-122 T-2, kernel mandate in `.windsurf/rules/00-project-invariants.md`
 * §Mandatory safeguards).
 *
 * Composes, does not duplicate (P4): existing gates run as-is; new v1 checks
 * live in `scripts/governance/checks/` and fill gaps declared in
 * `context/governance/invariant-enforcement-matrix.md`.
 *
 * Modes:
 *   --full (default)  run every registered check sequentially
 *   --staged          run only checks whose stagedGlobs intersect
 *                     `git diff --cached --name-only`; file-scoped checks
 *                     (scopedFiles) receive the intersected paths via --files
 *   --selftest        run every check that declares fixtures against
 *                     tests/fixtures/governance/<id>/{violation,clean}:
 *                     violation MUST fail, clean MUST pass (P3 license gate)
 *
 * Timeouts: per-check 30s default (D-4); a check may override via timeoutMs
 * (contracts:check legitimately needs ~60-120s and is therefore full-only).
 * `stagedGlobs: null` = never runs in --staged (too slow or too noisy for a
 * commit hook — documented per check, not silently dropped).
 *
 * Excluded by design (recorded in the matrix ambiguities, Director ruling
 * 2026-11-15): prompt:check (spec pipeline paused, R-208), closure:lint
 * (closing gate, not commit-stage), lint:painter (flagged partial).
 *
 * Exit 1 if any check fails/times out; 0 otherwise.
 */
import { execSync, spawnSync } from 'node:child_process';
import { readdirSync, statSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();
const TSX = join(ROOT, 'node_modules', '.bin', 'tsx');
const DEFAULT_TIMEOUT_MS = 30_000;
const FIXTURES_ROOT = 'tests/fixtures/governance';

interface CheckDef {
  /** Human-readable check name (also the fixture dir name for fixture checks). */
  id: string;
  /** tsx script + args, relative to repo root. */
  cmd: string[];
  /** Per-check timeout (default 30s). */
  timeoutMs?: number;
  /**
   * Globs describing the check's target set for --staged mode.
   * `null` = full-mode only (documented in `note`).
   */
  stagedGlobs: string[] | null;
  /** If true, the check accepts `--files <paths>` and is given the staged intersection. */
  scopedFiles?: boolean;
  /** Fixture dir name under tests/fixtures/governance for --selftest. */
  fixtures?: string;
  /** Documented reason for full-only registration, etc. */
  note?: string;
}

const CHECKS: CheckDef[] = [
  {
    id: 'invariant-matrix',
    cmd: ['scripts/verification/invariantMatrixCheck.ts'],
    stagedGlobs: ['context/governance/**', '.windsurf/rules/**', '**/AGENTS.md', '**/CLAUDE.md'],
    note: 'ledger↔matrix completeness guard (OB-1)',
  },
  {
    id: 'persistence:no-forbidden-apis',
    cmd: ['scripts/governance/checks/persistenceNoForbiddenApis.ts'],
    stagedGlobs: ['src/**/*.ts', 'src/**/*.tsx'],
    scopedFiles: true,
    fixtures: 'persistence-no-forbidden-apis',
  },
  {
    id: 'skin:no-adhoc-css',
    cmd: ['scripts/governance/checks/skinNoAdhocCss.ts'],
    stagedGlobs: ['**/*.css'],
    scopedFiles: true,
    fixtures: 'skin-no-adhoc-css',
  },
  {
    id: 'agents:lint',
    cmd: ['scripts/agentsLint.ts'],
    stagedGlobs: ['**/AGENTS.md', '**/CLAUDE.md'],
  },
  {
    id: 'foreground:lint',
    cmd: ['scripts/foregroundLint.ts'],
    // Scans its own SCAN_DIRS (repo-state, not delta) but is fast (~1s) and
    // invariant-level: green at HEAD must stay green — staged scope is the
    // point. (Former committed violations removed 2026-11-15.)
    stagedGlobs: ['scripts/**', 'tools/**', '.github/**', '**/*.mjs'],
  },
  {
    id: 'shutdown:lint-capability',
    cmd: ['scripts/shutdownManager/lintCapability.ts'],
    stagedGlobs: ['scripts/**', 'tools/**', '.husky/**', 'package.json', '**/*.plist'],
    // Rule-50 static enforcement: stays in staged scope. Typical ~10s
    // standalone, observed >30s once under load — 90s ceiling.
    timeoutMs: 90_000,
  },
  {
    id: 'contracts:index-sync',
    cmd: ['scripts/verification/contractsIndexSync.ts'],
    stagedGlobs: ['.mw/contracts/**', 'src/docs/docs/idle_village/COMPONENT_MASTER_INDEX.md'],
  },
  {
    id: 'trusted:check',
    cmd: ['scripts/verification/trustedLock.ts', 'check'],
    stagedGlobs: null,
    note: 'full-only — trust-set drift (repo-state) would block unrelated commits',
  },
  {
    id: 'contracts:check',
    cmd: ['scripts/contractsCheck.ts'],
    stagedGlobs: null,
    timeoutMs: 180_000,
    note: 'full-only — exceeds the 30s hook budget (D-4)',
  },
  {
    id: 'i18n:validate',
    cmd: ['scripts/i18n/validateKeys.ts'],
    stagedGlobs: null,
    note: 'full-only — pre-existing missing-keys debt would block unrelated commits',
  },
];

// ---------------------------------------------------------------------------

/** Minimal glob matcher: `**` crosses directories, `*` and `?` do not. */
function matchGlob(path: string, pattern: string): boolean {
  const rx = pattern
    .replace(/[.+^${}()|[\]\\]/g, '\\$&')
    .replace(/\*\*\//g, '\x01')
    .replace(/\*\*/g, '\x02')
    .replace(/\*/g, '[^/]*')
    .replace(/\?/g, '[^/]')
    .replace(/\x01/g, '(?:.*/)?')
    .replace(/\x02/g, '.*');
  return new RegExp(`^${rx}$`).test(path);
}

type Verdict = 'PASS' | 'FAIL' | 'TIMEOUT' | 'SKIP' | 'ERROR';

interface Result {
  id: string;
  verdict: Verdict;
  durationMs: number;
  detail?: string;
}

function runCheck(def: CheckDef, extraArgs: string[]): { verdict: Verdict; output: string; durationMs: number } {
  const tsx = existsSync(TSX) ? TSX : 'tsx';
  const started = Date.now();
  const res = spawnSync(tsx, [...def.cmd, ...extraArgs], {
    cwd: ROOT,
    encoding: 'utf8',
    timeout: def.timeoutMs ?? DEFAULT_TIMEOUT_MS,
    maxBuffer: 4 * 1024 * 1024,
  });
  const durationMs = Date.now() - started;
  const output = `${res.stdout ?? ''}${res.stderr ?? ''}`.trim();
  if (res.error && (res.error as NodeJS.ErrnoException).code === 'ETIMEDOUT') {
    return { verdict: 'TIMEOUT', output, durationMs };
  }
  if (res.signal === 'SIGTERM' && res.status === null) {
    return { verdict: 'TIMEOUT', output, durationMs };
  }
  if (res.error) {
    return { verdict: 'ERROR', output: `${output}\n${String(res.error)}`, durationMs };
  }
  return { verdict: res.status === 0 ? 'PASS' : 'FAIL', output, durationMs };
}

function stagedFiles(): string[] {
  try {
    return execSync('git diff --cached --name-only --diff-filter=ACMR', { cwd: ROOT, encoding: 'utf8' })
      .split('\n')
      .filter(Boolean);
  } catch {
    console.error('governance:check --staged — could not read staged files (not a git repo?)');
    process.exit(2);
  }
}

/** Recursively collect files under a fixture path (file or directory). */
function collectFixtureFiles(path: string): string[] {
  const abs = join(ROOT, path);
  if (!existsSync(abs)) return [];
  if (statSync(abs).isFile()) return [path];
  const out: string[] = [];
  const walk = (dir: string): void => {
    for (const e of readdirSync(dir, { withFileTypes: true })) {
      const full = join(dir, e.name);
      if (e.isDirectory()) walk(full);
      else if (e.isFile() && !e.name.endsWith('.md')) out.push(full);
    }
  };
  walk(abs);
  return out;
}

function fixtureTargets(fixtureId: string, kind: 'violation' | 'clean'): string[] {
  const base = join(FIXTURES_ROOT, fixtureId);
  // Support both `violation.<ext>` single file and `violation/` directory.
  const asDir = collectFixtureFiles(join(base, kind));
  if (asDir.length > 0) return asDir;
  const parent = join(ROOT, base);
  if (!existsSync(parent)) return [];
  return readdirSync(parent)
    .filter((f) => f === kind || f.startsWith(`${kind}.`))
    .filter((f) => statSync(join(parent, f)).isFile())
    .map((f) => join(base, f));
}

// ---------------------------------------------------------------------------

function reportRow(r: Result): void {
  const sec = (r.durationMs / 1000).toFixed(1);
  console.log(`  [${r.verdict.padEnd(7)}] ${r.id} (${sec}s)${r.detail ? ` — ${r.detail}` : ''}`);
}

async function main(): Promise<void> {
  const mode = process.argv.includes('--selftest')
    ? 'selftest'
    : process.argv.includes('--staged')
      ? 'staged'
      : 'full';

  console.log(`governance:check — mode: ${mode}`);

  const results: Result[] = [];

  if (mode === 'selftest') {
    for (const def of CHECKS) {
      if (!def.fixtures) {
        results.push({ id: def.id, verdict: 'SKIP', durationMs: 0, detail: 'no fixtures — cannot license demotions (P3)' });
        continue;
      }
      const violation = fixtureTargets(def.fixtures, 'violation');
      const clean = fixtureTargets(def.fixtures, 'clean');
      if (violation.length === 0 || clean.length === 0) {
        results.push({ id: def.id, verdict: 'ERROR', durationMs: 0, detail: `fixture pair incomplete (violation=${violation.length}, clean=${clean.length})` });
        continue;
      }
      const vRes = runCheck(def, ['--files', ...violation]);
      const vOk = vRes.verdict === 'FAIL'; // violation MUST fail
      const cRes = runCheck(def, ['--files', ...clean]);
      const cOk = cRes.verdict === 'PASS'; // clean MUST pass
      const durationMs = vRes.durationMs + cRes.durationMs;
      if (vOk && cOk) {
        results.push({ id: def.id, verdict: 'PASS', durationMs, detail: 'violation fails, clean passes — licensed' });
      } else {
        results.push({
          id: def.id,
          verdict: 'FAIL',
          durationMs,
          detail: `violation ${vOk ? 'fails (ok)' : `did NOT fail (${vRes.verdict})`}; clean ${cOk ? 'passes (ok)' : `did NOT pass (${cRes.verdict})`}`,
        });
        if (!vOk) console.error(vRes.output);
        if (!cOk) console.error(cRes.output);
      }
    }
    // Orphan fixture dirs without a registered check → warning only.
    const fxRoot = join(ROOT, FIXTURES_ROOT);
    if (existsSync(fxRoot)) {
      for (const e of readdirSync(fxRoot, { withFileTypes: true })) {
        if (e.isDirectory() && !CHECKS.some((c) => c.fixtures === e.name)) {
          console.warn(`  warning: fixture dir ${e.name} has no registered check`);
        }
      }
    }
  } else if (mode === 'staged') {
    const staged = stagedFiles();
    console.log(`  staged files: ${staged.length}`);
    for (const def of CHECKS) {
      if (def.stagedGlobs === null) {
        results.push({ id: def.id, verdict: 'SKIP', durationMs: 0, detail: def.note ?? 'full-only' });
        continue;
      }
      const matched = staged.filter((f) => def.stagedGlobs!.some((g) => matchGlob(f, g)));
      if (matched.length === 0) {
        results.push({ id: def.id, verdict: 'SKIP', durationMs: 0, detail: 'no staged files in target set' });
        continue;
      }
      const extra = def.scopedFiles ? ['--files', ...matched] : [];
      const r = runCheck(def, extra);
      results.push({ id: def.id, verdict: r.verdict, durationMs: r.durationMs, detail: `${matched.length} staged file(s) in scope` });
      if (r.verdict !== 'PASS' && r.output) console.error(r.output);
    }
  } else {
    for (const def of CHECKS) {
      const r = runCheck(def, []);
      results.push({ id: def.id, verdict: r.verdict, durationMs: r.durationMs, detail: def.note });
      if (r.verdict !== 'PASS' && r.output) console.error(r.output);
    }
  }

  console.log('\n  ── results ──');
  for (const r of results) reportRow(r);

  const failures = results.filter((r) => r.verdict === 'FAIL' || r.verdict === 'TIMEOUT' || r.verdict === 'ERROR');
  const ran = results.filter((r) => r.verdict !== 'SKIP');
  console.log(`\n  ${ran.length} check(s) run, ${failures.length} failed.`);
  if (failures.length > 0) {
    process.exit(1);
  }
  console.log('  governance:check OK.');
}

main();
