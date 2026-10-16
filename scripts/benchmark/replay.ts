#!/usr/bin/env tsx
/**
 * PLAN-039 / R-204 — replay benchmark driver.
 *
 * Replays the same task under different dispatch approaches and measures the
 * outcome honestly (the driver re-runs the contract test itself; the agent's
 * own claim is never trusted).
 *
 * Matrix: cases × approaches (raw | contract | context) × repeats.
 * Per run:
 *   git worktree add --detach <wt> <baseCommit>
 *   → seed contract/test files (from a commit or from benchmarks/contracts/)
 *   → install deps (APFS clone of node_modules when package files unchanged,
 *     else npm ci)
 *   → run harness executor on the approach prompt, isolated to the worktree
 *   → verify: run the contract test command ourselves (trust-but-verify)
 *   → score: touched files, forbidden-path violations, golden-path coverage,
 *     wall-clock time split into install/agent/verify
 *   → emit <resultsDir>/<runId>.json + patch artifact; append results.jsonl
 *   → remove the worktree unless --keep-worktrees
 *
 * Usage:
 *   npx tsx scripts/benchmark/replay.ts [--manifest benchmarks/manifest.v1.json]
 *     [--case <id>] [--approach <raw|contract|context>] [--repeats N]
 *     [--keep-worktrees] [--dry-run]
 */

import { execFileSync, execSync } from 'node:child_process';
import { appendFileSync, copyFileSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const REPO_ROOT = process.cwd();

interface SeedFile {
  path: string;
  fromCommit?: string;
  fromFile?: string;
}

interface BenchCase {
  id: string;
  archetype: string;
  source: string;
  baseCommit: string;
  seedFiles: SeedFile[];
  testCommand: string;
  goldenCommit: string | null;
  goldenPaths: string[];
  forbidden: string[];
}

interface Manifest {
  version: number;
  name: string;
  defaults: {
    repeats: number;
    approaches: string[];
    worktreeRoot: string;
    resultsDir: string;
    model: string;
    /** Arena mode (PLAN-041): per-model runs. When present, each case×approach
     *  runs once per entry (provider pin + model) instead of the default model. */
    models?: { provider: string; model: string }[];
    maxIterations: number;
    taskTimeoutMs: number;
    installTimeoutMs: number;
    verifyTimeoutMs: number;
  };
  cases: BenchCase[];
}

interface RunResult {
  runId: string;
  caseId: string;
  approach: string;
  repeat: number;
  baseCommit: string;
  startedAt: string;
  installMs: number;
  agentMs: number;
  verifyMs: number;
  /** Driver bookkeeping: worktree, seed commit, scoring, cleanup — everything
   *  in totalMs that is neither deps, agent nor verify. The benchmark's own
   *  "governance cost" (R-208: overhead is measured, not estimated). */
  overheadMs: number;
  totalMs: number;
  agentExitCode: number | null;
  agentTimedOut: boolean;
  contractPass: boolean | null;
  verifyExitCode: number | null;
  touchedFiles: string[];
  forbiddenViolations: string[];
  goldenCoverage: number | null;
  evidenceFile: string | null;
  patchFile: string;
  error?: string;
}

/** Minimal glob matcher: supports `**` suffix prefixes and exact paths. */
function matchesPattern(file: string, pattern: string): boolean {
  if (pattern.endsWith('/**')) return file === pattern.slice(0, -3) || file.startsWith(pattern.slice(0, -2));
  if (pattern.includes('**')) {
    const [head, tail] = pattern.split('**');
    return file.startsWith(head) && file.endsWith(tail);
  }
  return file === pattern;
}

function sh(cmd: string, opts: { cwd?: string; timeout?: number; env?: NodeJS.ProcessEnv } = {}): string {
  return execSync(cmd, {
    cwd: opts.cwd ?? REPO_ROOT,
    timeout: opts.timeout ?? 120000,
    env: { ...process.env, ...opts.env },
    stdio: ['ignore', 'pipe', 'pipe'],
    encoding: 'utf8',
  });
}

function git(args: string, cwd = REPO_ROOT): string {
  return sh(`git ${args}`, { cwd });
}

function parseArgs(argv: string[]) {
  const a: Record<string, string | boolean> = {};
  for (let i = 0; i < argv.length; i += 1) {
    const k = argv[i];
    if (k === '--keep-worktrees' || k === '--dry-run') a[k.slice(2)] = true;
    else if (k.startsWith('--')) a[k.slice(2)] = argv[++i];
  }
  return a;
}

/** Install deps into the worktree: APFS-clone node_modules if the manifest's deps match HEAD, else npm ci. */
function installDeps(wt: string, baseCommit: string, timeoutMs: number): number {
  const t0 = Date.now();
  let sameDeps = false;
  try {
    git(`diff --quiet ${baseCommit} HEAD -- package.json package-lock.json`);
    sameDeps = true;
  } catch {
    sameDeps = false;
  }
  if (sameDeps && existsSync(path.join(REPO_ROOT, 'node_modules'))) {
    sh(`cp -Rc "${path.join(REPO_ROOT, 'node_modules')}" "${wt}/node_modules"`, { timeout: timeoutMs });
  } else {
    sh('npm ci --prefer-offline --no-audit --no-fund', { cwd: wt, timeout: timeoutMs });
  }
  return Date.now() - t0;
}

/** Seed contract/test files into the worktree. */
function seedFiles(wt: string, files: SeedFile[]): void {
  for (const f of files) {
    const dest = path.join(wt, f.path);
    mkdirSync(path.dirname(dest), { recursive: true });
    if (f.fromCommit) {
      const content = git(`show ${f.fromCommit}:${f.path}`);
      writeFileSync(dest, content);
    } else if (f.fromFile) {
      copyFileSync(path.join(REPO_ROOT, f.fromFile), dest);
    }
  }
}

function listTouched(wt: string): string[] {
  git('add -A', wt);
  const out = git('diff --cached --name-only', wt);
  return out.split('\n').map((s) => s.trim()).filter(Boolean);
}

export async function runBenchmark(opts: {
  manifestPath?: string;
  caseFilter?: string;
  approachFilter?: string;
  repeats?: number;
  keepWorktrees?: boolean;
  dryRun?: boolean;
  onRunEnd?: (r: RunResult) => void | Promise<void>;
}): Promise<RunResult[]> {
  const manifestPath = path.resolve(REPO_ROOT, opts.manifestPath ?? 'benchmarks/manifest.v1.json');
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8')) as Manifest;
  const d = manifest.defaults;
  const worktreeRoot = path.join(REPO_ROOT, d.worktreeRoot);
  const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const resultsDir = path.join(REPO_ROOT, d.resultsDir, `${manifest.name}-${stamp}`);
  mkdirSync(resultsDir, { recursive: true });
  mkdirSync(worktreeRoot, { recursive: true });

  const repeats = opts.repeats ?? d.repeats;
  const approaches = d.approaches.filter((a) => !opts.approachFilter || a === opts.approachFilter);
  const cases = manifest.cases.filter((c) => !opts.caseFilter || c.id === opts.caseFilter);

  const results: RunResult[] = [];
  const jsonl = path.join(resultsDir, 'results.jsonl');

  const modelLane = d.models && d.models.length > 0 ? d.models : [null as { provider: string; model: string } | null];

  for (const c of cases) {
    for (const approach of approaches) {
      const promptFile = path.join(REPO_ROOT, 'benchmarks/prompts', `${c.id}.${approach}.md`);
      if (!existsSync(promptFile)) {
        console.error(`[bench] SKIP ${c.id}/${approach}: missing prompt ${promptFile}`);
        continue;
      }
      for (const lane of modelLane) {
      /* Two lanes may share a provider (groq hosts gpt-oss and qwen) — the
       * tag must carry the model or the second lane overwrites the first. */
      const laneTag = lane
        ? `-${lane.provider}-${lane.model.split('/').pop()?.replace(/[^a-zA-Z0-9.-]/g, '')}`
        : '';
      for (let rep = 1; rep <= repeats; rep += 1) {
        const runId = `${c.id}-${approach}${laneTag}-r${rep}`;
        const wt = path.join(worktreeRoot, runId);
        const res: RunResult = {
          runId, caseId: c.id, approach, repeat: rep, baseCommit: c.baseCommit,
          startedAt: new Date().toISOString(),
          installMs: 0, agentMs: 0, verifyMs: 0, overheadMs: 0, totalMs: 0,
          agentExitCode: null, agentTimedOut: false,
          contractPass: null, verifyExitCode: null,
          touchedFiles: [], forbiddenViolations: [], goldenCoverage: null,
          evidenceFile: null, patchFile: '',
        };
        const t0 = Date.now();
        console.log(`[bench] ${runId} — worktree @ ${c.baseCommit.slice(0, 8)}`);
        try {
          if (opts.dryRun) throw new Error('dry-run');
          if (existsSync(wt)) {
            try { execFileSync('git', ['worktree', 'remove', '--force', wt], { cwd: REPO_ROOT, stdio: 'pipe' }); } catch { /* fall through to rm */ }
            if (existsSync(wt)) {
              for (let i = 0; i < 3 && existsSync(wt); i += 1) {
                try { rmSync(wt, { recursive: true, force: true, maxRetries: 5 }); } catch { /* retry */ }
              }
              execFileSync('git', ['worktree', 'prune'], { cwd: REPO_ROOT, stdio: 'pipe' });
            }
          }
          execFileSync('git', ['worktree', 'add', '--detach', wt, c.baseCommit], { cwd: REPO_ROOT, stdio: 'pipe' });
          seedFiles(wt, c.seedFiles);
          // Commit the seeds so post-run diff shows only the agent's changes.
          git('add -A', wt);
          execFileSync('git', ['commit', '-q', '-m', 'bench: seed contract files'], { cwd: wt, stdio: 'pipe' });
          res.installMs = installDeps(wt, c.baseCommit, d.installTimeoutMs);
          console.log(`[bench] ${runId} — deps ready in ${Math.round(res.installMs / 1000)}s, running agent`);

          const a0 = Date.now();
          try {
            const out = execFileSync('npx', ['tsx', 'scripts/harness/runPrompt.ts',
              '--file', promptFile, '--workspace', wt, '--id', runId,
              '--no-kanban', '--skip-safeguards',
              /* runPrompt has its own 600s default — pass the manifest budget
               *  so the driver and the executor agree on when a run is late. */
              '--timeout', String(d.taskTimeoutMs)],
              // Grace beyond the harness's own task timeout so it exits
              // itself and writes the evidence file instead of being SIGTERMed.
              { cwd: REPO_ROOT, timeout: d.taskTimeoutMs + 120000, stdio: 'pipe',
                env: { ...process.env,
                  HARNESS_MODEL: lane ? lane.model : d.model,
                  HARNESS_PROVIDER: lane ? lane.provider : '',
                  HARNESS_MAX_ITERATIONS: String(d.maxIterations),
                  HARNESS_TASK_TIMEOUT_MS: String(d.taskTimeoutMs) } });
            res.agentExitCode = 0;
            writeFileSync(path.join(resultsDir, `${runId}.agent.log`), out ?? '');
          } catch (e: unknown) {
            const err = e as { status?: number | null; signal?: string | null; stdout?: Buffer | string; stderr?: Buffer | string };
            res.agentExitCode = typeof err.status === 'number' ? err.status : null;
            res.agentTimedOut = err.signal === 'SIGTERM';
            /* Keep the agent's own log — provider errors and the harness's
             *  real failure reason live on stdout/stderr, otherwise invisible. */
            const agentLog = `${err.stdout ?? ''}\n--- stderr ---\n${err.stderr ?? ''}`;
            writeFileSync(path.join(resultsDir, `${runId}.agent.log`), agentLog);
            const tail = agentLog.trim().split('\n').slice(-6).join(' | ').slice(0, 500);
            if (tail) res.error = tail;
          }
          res.agentMs = Date.now() - a0;
          console.log(`[bench] ${runId} — agent done in ${Math.round(res.agentMs / 1000)}s (exit ${res.agentExitCode})`);

          const v0 = Date.now();
          try {
            sh(c.testCommand, { cwd: wt, timeout: d.verifyTimeoutMs });
            res.verifyExitCode = 0;
            res.contractPass = true;
          } catch (e: unknown) {
            res.verifyExitCode = (e as { status?: number | null }).status ?? null;
            res.contractPass = false;
          }
          res.verifyMs = Date.now() - v0;

          res.touchedFiles = listTouched(wt);
          res.forbiddenViolations = res.touchedFiles.filter((f) => c.forbidden.some((p) => matchesPattern(f, p)));
          res.goldenCoverage = c.goldenPaths.length
            ? c.goldenPaths.filter((g) => res.touchedFiles.includes(g)).length / c.goldenPaths.length
            : null;
          const patchFile = path.join(resultsDir, `${runId}.patch`);
          writeFileSync(patchFile, git('diff --cached', wt));
          res.patchFile = path.relative(REPO_ROOT, patchFile);

          // attach newest harness evidence file for this run id
          try {
            const ev = sh(`ls -t test-results/${runId}-harness-*.json 2>/dev/null | head -1`, {}).trim();
            if (ev) res.evidenceFile = ev;
          } catch { /* no evidence */ }
        } catch (e) {
          res.error = String(e instanceof Error ? e.message : e);
          if (opts.dryRun) res.error = 'dry-run: no execution';
        } finally {
          res.totalMs = Date.now() - t0;
          res.overheadMs = Math.max(0, res.totalMs - res.installMs - res.agentMs - res.verifyMs);
          if (!opts.keepWorktrees && existsSync(wt)) {
            try { execFileSync('git', ['worktree', 'remove', '--force', wt], { cwd: REPO_ROOT, stdio: 'pipe' }); } catch { /* leave */ }
            if (existsSync(wt)) {
              try { rmSync(wt, { recursive: true, force: true, maxRetries: 5 }); } catch { /* leave */ }
              try { execFileSync('git', ['worktree', 'prune'], { cwd: REPO_ROOT, stdio: 'pipe' }); } catch { /* leave */ }
            }
          }
          appendFileSync(jsonl, JSON.stringify(res) + '\n');
          writeFileSync(path.join(resultsDir, `${runId}.json`), JSON.stringify(res, null, 2));
          results.push(res);
          if (opts.onRunEnd) await opts.onRunEnd(res);
          console.log(`[bench] ${runId} — PASS=${res.contractPass} touched=${res.touchedFiles.length} viol=${res.forbiddenViolations.length} total=${Math.round(res.totalMs / 1000)}s`);
        }
      }
      }
    }
  }

  writeReport(resultsDir, manifest.name, results);
  console.log(`[bench] results → ${path.relative(REPO_ROOT, resultsDir)}`);
  return results;
}

function writeReport(dir: string, name: string, results: RunResult[]): void {
  const lines: string[] = [`# Replay benchmark report — ${name}`, '', `Runs: ${results.length}`, '',
    '| case | approach | rep | contract | agent s | verify s | overhead s | touched | violations | golden cov |', '|---|---|---|---|---|---|---|---|---|---|---|'];
  for (const r of results) {
    lines.push(`| ${r.caseId} | ${r.approach} | ${r.repeat} | ${r.contractPass === null ? 'err' : r.contractPass ? 'PASS' : 'FAIL'} | ${Math.round(r.agentMs / 1000)} | ${Math.round(r.verifyMs / 1000)} | ${Math.round(r.overheadMs / 1000)} | ${r.touchedFiles.length} | ${r.forbiddenViolations.length} | ${r.goldenCoverage === null ? '-' : Math.round(r.goldenCoverage * 100) + '%'} |`);
  }
  // per-approach aggregates
  lines.push('', '## Aggregates by approach', '');
  const byApproach = new Map<string, RunResult[]>();
  for (const r of results) byApproach.set(r.approach, [...(byApproach.get(r.approach) ?? []), r]);
  lines.push('| approach | pass rate | mean agent s | mean overhead s | mean total s | mean touched | violations |');
  lines.push('|---|---|---|---|---|---|---|');
  for (const [a, rs] of byApproach) {
    const n = rs.length || 1;
    const pass = rs.filter((r) => r.contractPass).length / n;
    lines.push(`| ${a} | ${Math.round(pass * 100)}% | ${Math.round(rs.reduce((s, r) => s + r.agentMs, 0) / n / 1000)} | ${Math.round(rs.reduce((s, r) => s + r.overheadMs, 0) / n / 1000)} | ${Math.round(rs.reduce((s, r) => s + r.totalMs, 0) / n / 1000)} | ${(rs.reduce((s, r) => s + r.touchedFiles.length, 0) / n).toFixed(1)} | ${rs.reduce((s, r) => s + r.forbiddenViolations.length, 0)} |`);
  }
  writeFileSync(path.join(dir, 'report.md'), lines.join('\n') + '\n');
}

if (process.argv[1]?.endsWith('replay.ts')) {
  const a = parseArgs(process.argv.slice(2));
  runBenchmark({
    manifestPath: a.manifest as string | undefined,
    caseFilter: a.case as string | undefined,
    approachFilter: a.approach as string | undefined,
    repeats: a.repeats ? Number(a.repeats) : undefined,
    keepWorktrees: Boolean(a['keep-worktrees']),
    dryRun: Boolean(a['dry-run']),
  }).then((rs) => {
    const failed = rs.filter((r) => r.contractPass === false).length;
    const errored = rs.filter((r) => r.contractPass === null).length;
    console.log(`[bench] done: ${rs.length} runs, ${failed} contract-fail, ${errored} errored`);
    process.exit(errored > 0 ? 2 : 0);
  }).catch((e) => { console.error('[bench] fatal:', e); process.exit(1); });
}
