#!/usr/bin/env tsx
/**
 * planForensics — forensic phase ledger for the plan→implementation→closure
 * workflow (PLAN-048 / R-217).
 *
 * Answers: where does wall-clock time actually go? intake / debate /
 * implementation (split by commit class: code / tests / docs / governance /
 * config / mixed) / verification+closure / wait — reconstructed from existing
 * artifacts only. No agent self-report, no new obligations.
 *
 * Sources:
 *   git log --name-status            commits (subject + touched paths)
 *   RICHIESTE.md history (-p)        entry creation + `Stato:` transitions
 *   plans/PLAN-*.md history          plan-file creation (battezzo proxy)
 *   .mw/runs/<run>/bundle.json       produced_at (verified completion)
 *   ../mind-weaver/.mw/runs/<run>/   debate span (events.jsonl / mtimes)
 *   context/plan-timing.jsonl        plan:stamp open/close events
 *
 * Outputs (deterministic — same repo state → same bytes):
 *   context/workflow-timing.jsonl    atomic event ledger (source of truth)
 *   context/WORKFLOW_METRICS.md      derived report (regenerated, never edited)
 *   context/plan-timing.jsonl        backfilled open/close for stamped-less plans
 *
 * Usage:
 *   npm run metrics:report                    # full mine + report
 *   npx tsx scripts/planForensics.ts --since 2026-10-01
 *   npx tsx scripts/planForensics.ts --window-days 30 --json
 */

import {
  appendFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { execFileSync } from 'node:child_process';
import os from 'node:os';
import path from 'node:path';

const REPO_ROOT = process.cwd();
const LEDGER_PATH = path.join(REPO_ROOT, 'context', 'workflow-timing.jsonl');
const REPORT_PATH = path.join(REPO_ROOT, 'context', 'WORKFLOW_METRICS.md');
const STAMP_LEDGER = path.join(REPO_ROOT, 'context', 'plan-timing.jsonl');
const RUNS_DIR = path.join(REPO_ROOT, '.mw', 'runs');
const MW_RUNS_DIR = path.resolve(REPO_ROOT, '..', 'mind-weaver', '.mw', 'runs');

export const WAIT_GAP_MS = 45 * 60 * 1000;

/* ---------- types ---------- */

export type CommitClass =
  | 'code'
  | 'tests'
  | 'docs'
  | 'governance'
  | 'config'
  | 'assets'
  | 'other';

export interface RawCommit {
  sha: string;
  at: string;
  subject: string;
  files: { status: string; path: string }[];
}

export interface EntityEvent {
  entity: string;
  kind:
    | 'entry-created'
    | 'entry-edit'
    | 'entry-closed'
    | 'plan-created'
    | 'debate'
    | 'commit'
    | 'bundle'
    | 'verify-artifact'
    | 'stamp-open'
    | 'stamp-close';
  at: string;
  cls?: CommitClass | 'mixed';
  confidence: 'high' | 'low';
  meta?: string;
  /** duration of the interval this event opens (debate spans only) */
  durMs?: number;
}

export interface EntityRow {
  entity: string;
  linked: string[];
  firstAt: string;
  lastAt: string;
  intakeMs: number;
  debateMs: number;
  implMs: number;
  verifyMs: number;
  waitMs: number;
  implSplit: Record<string, number>; // ms per class inside implementation
  /** inferred split of the `unobserved` impl time, weighted by the churn
   *  mix of the entity's implementation commits (squash-commits included) */
  mixSplit?: Record<string, number>;
  /** PLAN-059: feature del plan (path nominati, obbligazioni, traps) */
  features?: PlanFeatures;
  /** PLAN-059: rework — churn fuori-scope, commit post-bundle, retry gate */
  rework?: ReworkStats;
  implCodeShare: number;
  closed: boolean;
}

export interface PlanRichness {
  plan: string;
  lines: number;
  obligations: number;
  directorRulings: number;
  debateArtifacts: number;
  fileTargets: number;
  score: number;
}

/* ---------- PLAN-059: plan features & rework ---------- */

export interface PlanFeatures {
  /** n° di path `src/…` ≥3 segmenti nominati nel plan (scope esplicito) */
  files_named: number;
  /** il plan dichiara obbligazioni verificabili */
  has_obligations: boolean;
  /** riferimenti a trappole ricorrenti (T-NN / context/recurring-traps) */
  traps_cited: number;
  lines: number;
}

/** Rework = sorpresa: lavoro che il plan non aveva previsto o che torna dopo "finito". */
export interface ReworkStats {
  /** share di churn (righe) su file NON coperti dai path nominati nel plan; null se plan assente */
  out_of_plan_churn: number | null;
  /** split out-of-plan: bookkeeping (contabilità meccanica) vs scope (scoperta reale) */
  out_of_plan_split?: OutOfPlanBreakdown | null;
  /** commit attribuiti all'entità dopo il primo bundle prodotto (rework post-"fatto") */
  post_bundle_commits: number;
  /** versioni BLOCKED di bundle.json nella git history dei run dir dell'entità (retry del gate) */
  bundle_retries: number | null;
}

/**
 * Path repo-relativi espliciti nel testo plan. Copre i top-dir del repo
 * (`src/`, `scripts/`, `tests/`, `.mw/`, `plans/`, `context/`, `docs/`,
 * `tools/`, `public/`, `test-results/`) più i file di stato root
 * (`RICHIESTE.md` ecc.). Accettati: ≥3 segmenti (riferimento a directory)
 * o qualsiasi path terminante con estensione file. Mai glob `**`.
 */
export function planNamedPaths(text: string): string[] {
  const out = new Set<string>();
  const re =
    /`?((?:src|scripts|tests|\.mw|\.windsurf|plans|context|docs|tools|public|test-results)\/[A-Za-z0-9_\-./]+)/g;
  for (const m of text.matchAll(re)) {
    const tok = m[1];
    if (/\*$/.test(tok)) continue;
    const clean = tok.replace(/\/+$/, '').replace(/\.+$/, '');
    if (clean.split('/').length >= 3 || /\.[a-z0-9]{1,5}$/i.test(clean)) out.add(clean);
  }
  for (const m of text.matchAll(
    /\b(RICHIESTE|SESSION_HANDOFF|CANON|CURRENT_STATE|DESIGN_PILLARS|PROPOSALS|AGENTS|PLANS)\.md\b/g,
  )) {
    out.add(m[0]);
  }
  return [...out];
}

export function planFeatures(text: string): PlanFeatures {
  return {
    files_named: planNamedPaths(text).length,
    has_obligations: /obbligazion|\bOB-\d/i.test(text),
    traps_cited: (text.match(/\bT-\d{2,}\b/g) ?? []).length +
      (/recurring-traps/i.test(text) ? 1 : 0),
    lines: text.split('\n').length,
  };
}

/** Churn per singolo file da output `git show --numstat` (add+del, binario=1). */
export function fileChurn(numstat: string): Map<string, number> {
  const out = new Map<string, number>();
  for (const line of numstat.split('\n')) {
    const m = line.match(/^(\d+|-)\t(\d+|-)\t(.+)$/);
    if (!m) continue;
    const add = m[1] === '-' ? 1 : Number(m[1]);
    const del = m[2] === '-' ? 1 : Number(m[2]);
    out.set(m[3], (out.get(m[3]) ?? 0) + add + del);
  }
  return out;
}

/** Share di churn su file non coperti dai path nominati nel plan. */
export function outOfPlanShare(files: Map<string, number>, named: string[]): number | null {
  const b = outOfPlanBreakdown(files, named);
  return b ? b.scope + b.bookkeeping : null;
}

/** Contabilità di stato: file mai nominati nei plan ma editati a ogni task. */
const BOOKKEEPING_FILES = new Set([
  'RICHIESTE.md',
  'SESSION_HANDOFF.md',
  'plans/INDEX.md',
  'context/INDEX.md',
  'context/DECISION_LOG.md',
  'CURRENT_STATE.md',
  'src/docs/docs/coordinator/agent_assignments.md',
]);

export interface OutOfPlanBreakdown {
  /** share di churn fuori-plan su file di contabilità (overhead meccanico) */
  bookkeeping: number;
  /** share di churn fuori-plan su altro codice/docs (scope discovery) */
  scope: number;
}

/**
 * Scompone l'out-of-plan in due cause diverse: `bookkeeping` = file di stato
 * che nessun plan nomina (da automatizzare, PLAN-059 T-002) vs `scope` =
 * lavoro vero non previsto dal plan (scope discovery → plan feature debole).
 */
export function outOfPlanBreakdown(
  files: Map<string, number>,
  named: string[],
): OutOfPlanBreakdown | null {
  if (files.size === 0) return null;
  let inPlan = 0, book = 0, tot = 0;
  for (const [f, c] of files) {
    tot += c;
    if (named.some((p) => f === p || f.startsWith(p + '/'))) inPlan += c;
    else if (BOOKKEEPING_FILES.has(f)) book += c;
  }
  if (tot === 0) return null;
  return { bookkeeping: book / tot, scope: (tot - inPlan - book) / tot };
}

/** Versioni BLOCKED del bundle nella git history del path (retry del gate).
 *  `runRel` è repo-relativo (es. `.mw/runs/plan048-forensics`). */
export function bundleRetries(runRel: string): number | null {
  const bundleRel = `${runRel}/bundle.json`;
  let shas: string[];
  try {
    shas = git(['log', '--format=%H', '--', bundleRel])
      .split('\n')
      .filter(Boolean);
  } catch {
    return null;
  }
  if (shas.length < 2) return 0;
  let blocked = 0;
  for (const sha of shas) {
    try {
      const v = JSON.parse(git(['show', `${sha}:${bundleRel}`])) as { verdict?: string };
      if (v.verdict === 'BLOCKED') blocked += 1;
    } catch {
      /* versione non parsabile — ignora */
    }
  }
  return blocked;
}

/* ---------- pure: commit classification ---------- */

const GOVERNANCE_RE =
  /^(scripts\/verification\/|scripts\/(closureLint|contractsCheck|mappingProposal|coverageException|directorAnswer|agentsLint)\.ts|\.windsurf\/rules\/|\.agents\/skills\/|\.devin\/skills\/|coordinator\/skills\/|\.github\/workflows\/)/;
const DOCS_RE =
  /(^|\/)(CHANGELOG|README|AGENTS|CLAUDE|CANON|GLOSSARY|CURRENT_STATE|RICHIESTE|SESSION_HANDOFF|PROPOSALS|DESIGN_PILLARS|DECISION_LOG|KNOWLEDGE_[A-Z_]+)\.md$|\.md$|^context\/|^src\/docs\/|^plans\//;
const TESTS_RE = /(^|\/)(tests?|__tests__|e2e)\/|\.(test|spec)\.[tj]sx?$/;
const CONFIG_RE =
  /(^|\/)(config|configs|balancing\/config|i18n|localization)\/|\.i18n\.|i18next|\.json$/;
const ASSETS_RE = /^public\/|\.(png|jpe?g|webp|gif|svg|mp3|wav|woff2?)$/i;
const GOVERNANCE_FILES = new Set([
  'scripts/closureLint.ts',
  'scripts/contractsCheck.ts',
  'scripts/mappingProposal.ts',
  'scripts/coverageException.ts',
  'scripts/directorAnswer.ts',
  'scripts/agentsLint.ts',
]);

export function classifyPath(f: string): CommitClass {
  if (GOVERNANCE_FILES.has(f) || GOVERNANCE_RE.test(f)) return 'governance';
  if (TESTS_RE.test(f)) return 'tests';
  if (DOCS_RE.test(f)) return 'docs';
  if (ASSETS_RE.test(f)) return 'assets';
  if (CONFIG_RE.test(f)) return 'config';
  if (f.startsWith('src/') || f.startsWith('scripts/')) return 'code';
  return 'other';
}

export function classShares(files: string[]): Partial<Record<CommitClass, number>> {
  const shares: Partial<Record<CommitClass, number>> = {};
  for (const f of files) {
    const cls = classifyPath(f);
    shares[cls] = (shares[cls] ?? 0) + 1;
  }
  const total = files.length || 1;
  for (const k of Object.keys(shares)) shares[k as CommitClass]! /= total;
  return shares;
}

/**
 * Churn-weighted class mix from `git show --numstat` output
 * (`add\tdel\tpath` lines; '-' for binary → counted as 1 unit).
 * Weights each file's class by edited lines — a better effort proxy than
 * file count when one commit mixes code and docs.
 */
export function churnShares(numstat: string): Partial<Record<CommitClass, number>> {
  const churn: Partial<Record<CommitClass, number>> = {};
  for (const line of numstat.split('\n')) {
    const m = line.match(/^(\d+|-)\t(\d+|-)\t(.+)$/);
    if (!m) continue;
    const add = m[1] === '-' ? 1 : Number(m[1]);
    const del = m[2] === '-' ? 1 : Number(m[2]);
    const cls = classifyPath(m[3]);
    churn[cls] = (churn[cls] ?? 0) + add + del;
  }
  const total = Object.values(churn).reduce((a, b) => a + b, 0) || 1;
  for (const k of Object.keys(churn)) churn[k as CommitClass]! /= total;
  return churn;
}

export function classifyCommit(files: string[]): CommitClass | 'mixed' {
  const s = classShares(files);
  const dominant = Object.entries(s).sort((a, b) => b[1] - a[1])[0];
  return dominant && dominant[1] >= 0.7 ? (dominant[0] as CommitClass) : 'mixed';
}

/* ---------- pure: entity extraction ---------- */

const ID_RE = /\b(PLAN-\d+|R-\d+)\b/gi;

export function extractIds(text: string): string[] {
  const out = new Set<string>();
  for (const m of text.matchAll(ID_RE)) {
    const t = m[1].toUpperCase();
    // skip false positives like PLAN-043-S8 sub-plans → keep as PLAN-043
    out.add(t.replace(/^(PLAN-\d+)-.*/, '$1'));
  }
  return [...out];
}

function entityFromPath(p: string): string[] {
  const ids: string[] = [];
  const planFile = p.match(/^plans\/(PLAN-\d+)/i);
  if (planFile) ids.push(planFile[1].toUpperCase());
  return ids;
}

export function attributeCommit(c: RawCommit): { entity: string; confidence: 'high' | 'low' }[] {
  const fromSubject = extractIds(c.subject);
  const fromFiles = c.files.flatMap((f) => entityFromPath(f.path));
  const ids = new Set<string>([...fromSubject, ...fromFiles]);
  if (ids.size === 0) return [];
  return [...ids].map((entity) => ({
    entity,
    confidence: fromSubject.includes(entity) ? 'high' : 'low',
  }));
}

/* ---------- pure: timeline → intervals ---------- */

export function attributeIntervals(events: EntityEvent[]): { phase: string; ms: number }[] {
  const sorted = [...events].sort((a, b) => a.at.localeCompare(b.at));
  const out: { phase: string; ms: number }[] = [];
  for (let i = 1; i < sorted.length; i++) {
    const ms = new Date(sorted[i].at).getTime() - new Date(sorted[i - 1].at).getTime();
    if (ms <= 0) continue;
    out.push({
      phase:
        ms > WAIT_GAP_MS
          ? 'wait'
          : sorted[i].kind === 'commit'
            ? (sorted[i].cls ?? 'other')
            : sorted[i].kind === 'bundle'
              ? 'verification'
              : sorted[i].kind === 'debate'
                ? 'debate'
                : 'docs',
      ms,
    });
  }
  return out;
}

/* ---------- pure: plan richness ---------- */

export function computeRichness(planText: string, debateArtifacts: number): PlanRichness {
  const lines = planText.split('\n');
  const obligations = (planText.match(/\b(?:OB|BV|AC)-\d+\b/g) ?? []).length;
  const rulings = (planText.match(/«[^»]+»|\*"[^"]+"\*/g) ?? []).filter((s) =>
    /procedi|approvo|battezz|scelgo|fatta|ok\b|sì/i.test(s),
  ).length;
  const fileTargets = (planText.match(/(?:src|tests|scripts|context)\/[\w./-]+/g) ?? []).length;
  const score =
    lines.length / 100 + obligations * 2 + rulings * 1.5 + debateArtifacts + fileTargets * 0.5;
  return {
    plan: '',
    lines: lines.length,
    obligations,
    directorRulings: rulings,
    debateArtifacts,
    fileTargets,
    score: Math.round(score * 10) / 10,
  };
}

/* ---------- pure: Spearman rank correlation ---------- */

export function spearman(xs: number[], ys: number[]): number | null {
  if (xs.length < 4 || xs.length !== ys.length) return null;
  const rank = (a: number[]) =>
    a
      .map((v, i) => ({ v, i }))
      .sort((p, q) => p.v - q.v)
      .reduce<number[]>((r, { i }, idx) => ((r[i] = idx + 1), r), []);
  const rx = rank(xs);
  const ry = rank(ys);
  const n = xs.length;
  const d2 = rx.reduce((s, r, i) => s + (r - ry[i]) ** 2, 0);
  return Math.round((1 - (6 * d2) / (n * (n * n - 1))) * 100) / 100;
}

/* ---------- io: git ---------- */

function git(args: string[]): string {
  return execFileSync('git', args, { cwd: REPO_ROOT, maxBuffer: 64 * 1024 * 1024 })
    .toString('utf8');
}

function gitNumstat(sha: string): string {
  try {
    return git(['show', '--format=', '--numstat', sha]);
  } catch {
    return '';
  }
}

export function parseGitLog(text: string): RawCommit[] {
  const commits: RawCommit[] = [];
  // records end with \x1e; the --name-status file list follows it inside the
  // same chunk, up to the next commit header which starts with \x1f
  let pending: RawCommit | null = null;
  const pushFiles = (body: string): void => {
    if (!pending) return;
    for (const l of body.split('\n')) {
      const t = l.trim();
      if (!t) continue;
      const [status, ...rest] = t.split('\t');
      const p = rest.join('\t').trim();
      if (p) pending.files.push({ status, path: p });
    }
  };
  for (const chunk of text.split('\x1e')) {
    const firstField = chunk.indexOf('\x1f');
    const body = firstField < 0 ? chunk : chunk.slice(0, firstField);
    pushFiles(body);
    if (firstField < 0) continue;
    const head = chunk
      .slice(firstField)
      .split('\x1f')
      .map((s) => s.trim())
      .filter(Boolean);
    if (head.length < 3 || !/^[0-9a-f]{7,40}$/.test(head[0])) {
      pending = null;
      continue;
    }
    pending = { sha: head[0], at: head[1], subject: head[2], files: [] };
    commits.push(pending);
  }
  return commits;
}

/* ---------- io: RICHIESTE section edits ---------- */

function richiesteSectionEvents(
  entitySet: Set<string>,
): Map<string, { created?: string; closed?: string; lastEdit?: string }> {
  const out = new Map<string, { created?: string; closed?: string; lastEdit?: string }>();
  if (!existsSync(path.join(REPO_ROOT, 'RICHIESTE.md'))) return out;
  const log = git([
    'log',
    '--format=%x1f%H%x1f%aI%x1e',
    '-p',
    '-U1',
    '--',
    'RICHIESTE.md',
  ]);
  // \x1e ends each record; the diff body follows it inside the same chunk,
  // up to the next commit header which starts with \x1f
  const records: { sha: string; at: string; body: string }[] = [];
  let prev: { sha: string; at: string; body: string } | null = null;
  for (const chunk of log.split('\x1e')) {
    const idx = chunk.indexOf('\x1f');
    const body = idx < 0 ? chunk : chunk.slice(0, idx);
    if (prev) prev.body += body;
    if (idx < 0) continue;
    const head = chunk
      .slice(idx)
      .split('\x1f')
      .map((s) => s.trim())
      .filter(Boolean);
    if (head.length >= 2 && /^[0-9a-f]{40}$/.test(head[0])) {
      prev = { sha: head[0], at: head[1], body: '' };
      records.push(prev);
    }
  }
  const headerCache = new Map<string, Map<number, string>>();
  for (const rec of records) {
    const { sha, at } = rec;
    const hunks = rec.body.split(/^@@/m).slice(1);
    let headers = headerCache.get(sha);
    const getSection = (lineNo: number): string | null => {
      if (!headers) {
        headers = new Map();
        try {
          const content = git(['show', `${sha}:RICHIESTE.md`]);
          content.split('\n').forEach((line, i) => {
            const hm = line.match(/^## (R-\d+|PLAN-\d+)/);
            if (hm) headers!.set(i + 1, hm[1]);
          });
        } catch {
          headers = new Map();
        }
        headerCache.set(sha, headers);
      }
      let best: string | null = null;
      let bestLine = -1;
      for (const [ln, id] of headers) {
        if (ln <= lineNo && ln > bestLine) {
          best = id;
          bestLine = ln;
        }
      }
      return best;
    };
    for (const hunk of hunks) {
      const hm = hunk.match(/^-\d+(?:,\d+)? \+(\d+)(?:,(\d+))?/);
      if (!hm) continue;
      const startNew = Number(hm[1]);
      let offset = 0;
      for (const raw of hunk.split('\n').slice(1)) {
        if (raw.startsWith('+')) {
          const lineNo = startNew + offset;
          const line = raw.slice(1);
          const created = line.match(/^## (R-\d+)/);
          const closedNow = /\*\*Stato:\*\*[^|]*`?fatta/.test(line);
          const isEdit = /\*\*(?:Chiusura|Stato):|bundle:/.test(line);
          if (created) {
            const e = created[1];
            entitySet.add(e);
            const cur = out.get(e) ?? {};
            if (!cur.created || at < cur.created) cur.created = at;
            out.set(e, cur);
          } else if (isEdit) {
            const section = getSection(lineNo);
            if (section) {
              const cur = out.get(section) ?? {};
              cur.lastEdit = at;
              if (closedNow && (!cur.closed || at > cur.closed)) cur.closed = at;
              out.set(section, cur);
            }
          }
          offset++;
        } else if (!raw.startsWith('-')) {
          offset++;
        }
      }
    }
  }
  return out;
}

/* ---------- io: run dirs (bundles + debates) ---------- */

interface RunInfo {
  entity: string;
  bundleAt?: string;
  /** per-run debate spans — never merged across runs */
  spans: [string, string][];
  /** mtimes of verification artifacts (command-logs, evidence, metrics…) —
   *  real mid-session timestamps that split otherwise-unobserved impl */
  verifyAt: string[];
  artifacts: number;
  /** PLAN-059: run dir names (repo-relative) — used for bundle retry mining */
  dirs: string[];
}

function scanRuns(dir: string, acc: Map<string, RunInfo>): void {
  if (!existsSync(dir)) return;
  for (const name of readdirSync(dir)) {
    const full = path.join(dir, name);
    let st;
    try {
      st = statSync(full);
    } catch {
      continue;
    }
    if (!st.isDirectory()) continue;
    const idm = name.match(/(plan-?\d+|r-?\d+)/i);
    if (!idm) continue;
    const norm = idm[1].toLowerCase().replace('-', '');
    const entity = /^r\d+$/.test(norm)
      ? `R-${norm.slice(1)}`
      : `PLAN-${norm.replace(/^plan/, '')}`;
    const info: RunInfo =
      acc.get(entity) ?? { entity, spans: [], verifyAt: [], artifacts: 0, dirs: [] };
    info.dirs.push(path.relative(REPO_ROOT, full));
    const bundle = path.join(full, 'bundle.json');
    if (existsSync(bundle)) {
      try {
        const b = JSON.parse(readFileSync(bundle, 'utf8'));
        const at: string | undefined = b.produced_at;
        if (at && (!info.bundleAt || at > info.bundleAt)) info.bundleAt = at;
      } catch {
        /* malformed bundle — skip */
      }
    }
    // debate span: events.jsonl first→last ts, else file mtime span
    const evFile = path.join(full, 'events.jsonl');
    let first: number | null = null;
    let last: number | null = null;
    if (existsSync(evFile)) {
      for (const line of readFileSync(evFile, 'utf8').split('\n')) {
        if (!line.trim()) continue;
        try {
          const e = JSON.parse(line);
          if (e.ts) {
            const t = new Date(e.ts).getTime();
            if (first === null || t < first) first = t;
            if (last === null || t > last) last = t;
          }
        } catch {
          /* skip malformed line */
        }
      }
    }
    if (first === null) {
      // fallback: mtime span over debate artifacts only (bundle.json, logs and
      // verifier outputs land much later and must NOT stretch the span)
      const DEBATE_FILES = /^(artifact-r\d+|prompt.*|final|caller_final|context|desiderata-slice|report|metadata|state)\.(md|json)$/;
      for (const f of readdirSync(full)) {
        if (!DEBATE_FILES.test(f)) continue;
        const fp = path.join(full, f);
        try {
          const fs = statSync(fp);
          if (!fs.isFile()) continue;
          if (first === null || fs.mtimeMs < first) first = fs.mtimeMs;
          if (last === null || fs.mtimeMs > last) last = fs.mtimeMs;
        } catch {
          continue;
        }
      }
      // a debate is hours, not months: cap bogus spans (copied/restored files)
      if (first !== null && last !== null && last - first > 24 * 3600 * 1000) {
        first = null;
        last = null;
      }
    }
    info.artifacts = Math.max(
      info.artifacts,
      readdirSync(full).filter((f) => /^artifact-r\d+\.md$/.test(f)).length,
    );
    // verification-artifact mtimes: real mid-session timestamps that split
    // otherwise-unobserved impl time (run output, not commit time)
    const SKIP = /^(artifact-r\d+|prompt.*|final|caller_final|context|desiderata-slice|report|metadata|state|bundle|events)\.(md|json|jsonl)$/;
    const collect = (dir: string, depth: number): void => {
      if (depth > 2) return;
      for (const f of readdirSync(dir)) {
        const fp = path.join(dir, f);
        try {
          const fs = statSync(fp);
          if (fs.isDirectory()) {
            if (/^(conversations|raw)$/.test(f)) continue; // debate plumbing
            collect(fp, depth + 1);
            continue;
          }
          if (!fs.isFile() || SKIP.test(f)) continue;
          info.verifyAt.push(fs.mtime.toISOString());
        } catch {
          continue;
        }
      }
    };
    collect(full, 0);
    if (first !== null && last !== null && last > first) {
      info.spans.push([new Date(first).toISOString(), new Date(last).toISOString()]);
    }
    acc.set(entity, info);
  }
}

/* ---------- io: plan files ---------- */

function planFiles(): Map<string, string> {
  const out = new Map<string, string>();
  const dir = path.join(REPO_ROOT, 'plans');
  if (!existsSync(dir)) return out;
  for (const f of readdirSync(dir)) {
    const m = f.match(/^(PLAN-\d+)/i);
    if (m && f.endsWith('.md')) out.set(m[1].toUpperCase(), path.join(dir, f));
  }
  // some plans live under src/docs/docs/plans
  const alt = path.join(REPO_ROOT, 'src', 'docs', 'docs', 'plans');
  if (existsSync(alt)) {
    for (const f of readdirSync(alt)) {
      const m = f.match(/^(PLAN-\d+)/i);
      if (m && f.endsWith('.md') && !out.has(m[1].toUpperCase()))
        out.set(m[1].toUpperCase(), path.join(alt, f));
    }
  }
  return out;
}

/* ---------- io: R ↔ PLAN linkage ---------- */

function linkEntities(
  richieste: string,
  planTextByEntity: Map<string, string>,
): Map<string, string[]> {
  const links = new Map<string, Set<string>>();
  const add = (a: string, b: string) => {
    if (!links.has(a)) links.set(a, new Set());
    links.get(a)!.add(b);
  };
  const sections = richieste.split(/^## /m).slice(1);
  for (const s of sections) {
    const rm = s.match(/^(R-\d+)/);
    if (!rm) continue;
    for (const id of extractIds(s)) if (id !== rm[1]) add(rm[1], id);
  }
  for (const [plan, text] of planTextByEntity) {
    const rm = text.match(/\*\*Richiesta:\*\*\s*(R-\d+)/);
    if (rm) {
      add(plan, rm[1]);
      add(rm[1], plan);
    }
  }
  return new Map([...links].map(([k, v]) => [k, [...v]]));
}

/* ---------- io: plan-timing stamps ---------- */

interface StampEvent {
  plan: string;
  event: string;
  at: string;
}

function readStamps(): StampEvent[] {
  if (!existsSync(STAMP_LEDGER)) return [];
  return readFileSync(STAMP_LEDGER, 'utf8')
    .split('\n')
    .filter(Boolean)
    .flatMap((l) => {
      try {
        return [JSON.parse(l) as StampEvent];
      } catch {
        return [];
      }
    });
}

/* ---------- report ---------- */

function fmtDur(ms: number): string {
  if (ms <= 0) return '—';
  const m = Math.round(ms / 60000);
  return m >= 60 ? `${Math.floor(m / 60)}h${String(m % 60).padStart(2, '0')}m` : `${m}m`;
}

function pct(part: number, total: number): string {
  return total > 0 ? `${Math.round((part / total) * 100)}%` : '—';
}

export function renderReport(
  rows: EntityRow[],
  richness: PlanRichness[],
  unattrCommits: EntityEvent[] = [],
  gate?: GateStats,
): string {
  const L: string[] = [];
  L.push('# Workflow Metrics — forensics report (PLAN-048)');
  L.push('');
  L.push('> Auto-generated by `npm run metrics:report` — do not edit.');
  L.push('> **Limit: wall-clock between artifacts ≠ agent effort.** `wait` = gap');
  L.push('> >45min with no artifact outside the impl window (Director wait /');
  L.push('> pause / lost context). `unobserved` = impl interval with no intermediate');
  L.push('> commits — work happened inside a session, committed later (squash).');
  L.push('');
  L.push('## Per entity');
  L.push('');
  L.push(
    '| entity | window | intake | debate | implementation (code·docs·gov·tests·unobs) | verify+closure | status |',
  );
  L.push('|---|---|---|---|---|---|---|');
  const implCls = [
    'code',
    'docs',
    'governance',
    'tests',
    'config',
    'mixed',
    'verification',
    'unobserved',
    'other',
  ];
  for (const r of rows) {
    const implTotal = Object.values(r.implSplit).reduce((a, b) => a + b, 0);
    let split = implTotal
      ? implCls
          .filter((c) => (r.implSplit[c] ?? 0) > 0)
          .map((c) => `${c} ${pct(r.implSplit[c] ?? 0, implTotal)}`)
          .join(' · ')
      : '—';
    // inferred split of unobserved time from the impl commits' churn mix
    const unobsMs = r.implSplit['unobserved'] ?? 0;
    if (r.mixSplit && unobsMs > 0) {
      const mx = Object.entries(r.mixSplit)
        .sort((a, b) => b[1] - a[1])
        .filter(([, v]) => v > 0)
        .map(([c, v]) => `${c} ${pct(v, unobsMs)}`)
        .join(' · ');
      if (mx) split += ` → unobs≈ ${mx} (file-mix)`;
    }
    L.push(
      `| ${r.entity} | ${r.firstAt.slice(0, 10)} → ${r.lastAt.slice(0, 10)} | ${fmtDur(r.intakeMs)} | ${fmtDur(r.debateMs)} | ${fmtDur(r.implMs)}${split !== '—' ? ` — ${split}` : ''} | ${fmtDur(r.verifyMs)} | ${r.closed ? 'closed' : 'open'} |`,
    );
  }
  L.push('');
  L.push('## Where the time goes (aggregate, attributed intervals)');
  L.push('');
  const agg = new Map<string, number>();
  for (const r of rows) {
    // intake net of its internal >45min gaps (counted in wait): the span of an
    // open request sitting in queue for months is lead time, not active work
    agg.set('intake', (agg.get('intake') ?? 0) + Math.max(0, r.intakeMs - r.waitMs));
    agg.set('debate', (agg.get('debate') ?? 0) + r.debateMs);
    for (const [k, v] of Object.entries(r.implSplit)) {
      agg.set(`impl:${k}`, (agg.get(`impl:${k}`) ?? 0) + v);
    }
    agg.set('verify+closure', (agg.get('verify+closure') ?? 0) + r.verifyMs);
    agg.set('wait', (agg.get('wait') ?? 0) + r.waitMs);
  }
  const waitTot = agg.get('wait') ?? 0;
  agg.delete('wait');
  const tot = [...agg.values()].reduce((a, b) => a + b, 0);
  for (const [k, v] of [...agg.entries()].sort((a, b) => b[1] - a[1])) {
    if (v > 0) L.push(`- **${k}**: ${fmtDur(v)} (${pct(v, tot)} of active work)`);
  }
  const unattrCls = new Map<string, number>();
  for (const e of unattrCommits) {
    if (e.cls) unattrCls.set(e.cls, (unattrCls.get(e.cls) ?? 0) + 1);
  }
  const unattrTop = [...unattrCls.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([k, n]) => `${k}×${n}`)
    .join(' ');
  const mixAgg = new Map<string, number>();
  let mixTot = 0;
  for (const r of rows) {
    if (!r.mixSplit) continue;
    for (const [k, v] of Object.entries(r.mixSplit)) {
      mixAgg.set(k, (mixAgg.get(k) ?? 0) + v);
      mixTot += v;
    }
  }
  if (mixTot > 0) {
    const mixStr = [...mixAgg.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([k, v]) => `${k} ${pct(v, mixTot)}`)
      .join(' · ');
    L.push(
      `- **impl:unobserved — inferred composition** (churn file-mix dei commit di impl, non tempo osservato): ${mixStr}`,
    );
  }
  L.push(`- **wait** (gaps >45min, idle/attesa Director — not work): ${fmtDur(waitTot)}`);
  L.push(
    `- **unattributed commits**: ${unattrCommits.length}${unattrTop ? ` (${unattrTop})` : ''} — no entity id, >12h from any active entity`,
  );
  L.push('');
  L.push('## Plan features → smoothness (PLAN-059 — rework, non richness)');
  L.push('');
  L.push(
    '> Rework = sorpresa: churn su file NON nominati nel plan, commit dopo il primo bundle,',
  );
  L.push(
    '> retry del gate (versioni BLOCKED nella git history del bundle). La correlazione',
  );
  L.push(
    '> richness→velocità precedente era confusa da scope; questa misura cosa il plan',
  );
  L.push('> NON ha previsto. `oop books` = churn su file di contabilità che nessun plan nomina');
  L.push('> (RICHIESTE/INDEX/HANDOFF/DECISION_LOG — overhead automatizzabile); `oop scope` =');
  L.push('> churn su file di lavoro fuori dai path del plan (scope discovery).');
  L.push('');
  const withFeat = rows.filter((r) => r.features && r.rework);
  if (withFeat.length > 0) {
    L.push(
      '| entity | files_named | oblig | traps | impl | oop books | oop scope | post-bundle commits | bundle retries |',
    );
    L.push('|---|---|---|---|---|---|---|---|---|');
    for (const r of [...withFeat].sort(
      (a, b) => (b.rework!.out_of_plan_split?.scope ?? -1) - (a.rework!.out_of_plan_split?.scope ?? -1),
    )) {
      const f = r.features!;
      const w = r.rework!;
      const s = w.out_of_plan_split;
      L.push(
        `| ${r.entity} | ${f.files_named} | ${f.has_obligations ? 'yes' : '—'} | ${f.traps_cited} | ${fmtDur(r.implMs)} | ${
          s ? pct(s.bookkeeping, 1) : w.out_of_plan_churn !== null ? pct(w.out_of_plan_churn, 1) : '—'
        } | ${s ? pct(s.scope, 1) : '—'} | ${w.post_bundle_commits} | ${w.bundle_retries ?? '—'} |`,
      );
    }
    const corr = withFeat.filter((r) => r.rework!.out_of_plan_split?.scope != null && r.implMs > 0);
    if (corr.length >= 4) {
      const rho = spearman(
        corr.map((r) => r.features!.files_named),
        corr.map((r) => -(r.rework!.out_of_plan_split!.scope)),
      );
      L.push('');
      L.push(
        `Spearman ρ (files_named vs −oop scope churn): **${rho ?? 'n/a'}** — n=${corr.length}, directional.`,
      );
    }
  } else {
    L.push('Nessuna entità con plan + rework misurabile ancora.');
  }
  void richness;
  if (gate) {
    L.push('');
    L.push('## Gate cost (PLAN-051 T-006)');
    L.push('');
    const v = Object.entries(gate.verdicts)
      .sort((a, b) => b[1] - a[1])
      .map(([k, n]) => `${k} ${n}`)
      .join(' · ');
    L.push(`- **Ultimi bundle per run** (n=${gate.bundles_total}): ${v || '—'}`);
    const or_ = Object.entries(gate.obligation_results)
      .sort((a, b) => b[1] - a[1])
      .map(([k, n]) => `${k} ${n}`)
      .join(' · ');
    L.push(`- **Risultati obbligazioni** (tutti i bundle): ${or_ || '—'}`);
    const d = gate.director_burden;
    L.push(
      `- **Director burden** (azioni registrate): answers ${d.answers} · exceptions ${d.coverage_exceptions} · mapping-approvals ${d.mapping_approvals} · trust-approvals ${d.trust_approvals}`,
    );
    if (gate.trust.sealed_files != null) {
      L.push(
        `- **Trust anchor**: ${gate.trust.sealed_files} file sigillati @ ${gate.trust.sealed_at} — ledger fuori-repo attivo`,
      );
    }
    L.push(
      `- _Gap di misura noto:_ bundle.json viene sovrascritto a ogni run → il flip-rate BLOCKED→PASS (retry / falsi positivi) non è osservabile su disco; va journalato o stimato da seeded-fault (trustedLock.test copre tamper, lock riforgiato, drift non approvato).`,
    );
  }
  L.push('');
  return L.join('\n');
}

/* ---------- gate cost (PLAN-051 T-006) ---------- */

export interface GateStats {
  bundles_total: number;
  verdicts: Record<string, number>;
  obligation_results: Record<string, number>;
  skipped_obligations: number;
  director_burden: {
    answers: number;
    coverage_exceptions: number;
    mapping_approvals: number;
    trust_approvals: number;
  };
  trust: { sealed_files: number | null; sealed_at: string | null };
}

function countJsonl(file: string): number {
  if (!existsSync(file)) return 0;
  return readFileSync(file, 'utf8').split('\n').filter((l) => l.trim()).length;
}

/**
 * Scansiona gli ultimi bundle per run dir e i ledger di disposizione.
 * Onestà: i bundle vengono sovrascritti a ogni run → la storia dei verdict
 * per-run non esiste su disco; quello che si può misurare è la distribuzione
 * corrente e il carico Director. Il flip-rate BLOCKED→PASS (retry/false
 * positive) richiede journaling dei verdict — gap di misura dichiarato.
 */
export function collectGateStats(repoRoot: string): GateStats {
  const stats: GateStats = {
    bundles_total: 0,
    verdicts: {},
    obligation_results: {},
    skipped_obligations: 0,
    director_burden: {
      answers: countJsonl(path.join(repoRoot, '.mw', 'director-answers.jsonl')),
      coverage_exceptions: countJsonl(path.join(repoRoot, '.mw', 'coverage-exceptions.jsonl')),
      mapping_approvals: countJsonl(path.join(repoRoot, '.mw', 'mapping-approvals.jsonl')),
      trust_approvals: countJsonl(
        path.join(os.homedir(), '.rpg-approvals', 'ledger.jsonl'),
      ),
    },
    trust: { sealed_files: null, sealed_at: null },
  };
  const runsDir = path.join(repoRoot, '.mw', 'runs');
  if (existsSync(runsDir)) {
    for (const name of readdirSync(runsDir)) {
      const bf = path.join(runsDir, name, 'bundle.json');
      if (!existsSync(bf)) continue;
      try {
        const b = JSON.parse(readFileSync(bf, 'utf8')) as {
          verdict?: string;
          obligations?: { result?: string }[];
        };
        stats.bundles_total += 1;
        stats.verdicts[b.verdict ?? 'unknown'] = (stats.verdicts[b.verdict ?? 'unknown'] ?? 0) + 1;
        for (const o of b.obligations ?? []) {
          const r = o.result ?? 'unknown';
          stats.obligation_results[r] = (stats.obligation_results[r] ?? 0) + 1;
          if (r === 'SKIPPED') stats.skipped_obligations += 1;
        }
      } catch {
        /* malformed bundle — skip */
      }
    }
  }
  const lockPath = path.join(repoRoot, '.mw', 'trusted.lock.json');
  if (existsSync(lockPath)) {
    try {
      const lock = JSON.parse(readFileSync(lockPath, 'utf8')) as {
        sealed_at?: string;
        entries?: Record<string, string>;
      };
      stats.trust.sealed_files = Object.keys(lock.entries ?? {}).length;
      stats.trust.sealed_at = lock.sealed_at ?? null;
    } catch {
      /* malformed lock — leave nulls */
    }
  }
  return stats;
}

/* ---------- main ---------- */

function main(): void {
  const args = process.argv.slice(2);
  const json = args.includes('--json');
  const windowDays =
    Number(args[args.indexOf('--window-days') + 1]) || 45;
  const sinceIdx = args.indexOf('--since');
  const since =
    sinceIdx >= 0
      ? args[sinceIdx + 1]
      : new Date(Date.now() - windowDays * 86400_000).toISOString().slice(0, 10);

  // 1. commits in window
  const commits = parseGitLog(
    git(['log', `--since=${since}`, '--format=%x1f%H%x1f%aI%x1f%s%x1e', '--name-status']),
  );

  // 2. entity set
  const entitySet = new Set<string>();
  for (const c of commits) for (const { entity } of attributeCommit(c)) entitySet.add(entity);
  for (const plan of planFiles().keys()) entitySet.add(plan);
  const richiesteNow = existsSync(path.join(REPO_ROOT, 'RICHIESTE.md'))
    ? readFileSync(path.join(REPO_ROOT, 'RICHIESTE.md'), 'utf8')
    : '';
  for (const m of richiesteNow.matchAll(/^## (R-\d+)/gm)) entitySet.add(m[1]);

  // 3. RICHIESTE history → entry events
  const sectionEvents = richiesteSectionEvents(entitySet);

  // 4. run dirs
  const runs = new Map<string, RunInfo>();
  scanRuns(RUNS_DIR, runs);
  scanRuns(MW_RUNS_DIR, runs);
  for (const e of runs.keys()) entitySet.add(e);

  // 5. plan file creation commits (name-status A on plans/PLAN-NNN*)
  const planCreated = new Map<string, string>();
  for (const c of commits) {
    for (const f of c.files) {
      const pm = f.path.match(/^plans\/(PLAN-\d+)[^/]*\.md$/i);
      if (pm && f.status === 'A') {
        const e = pm[1].toUpperCase();
        if (!planCreated.get(e) || c.at < planCreated.get(e)!) planCreated.set(e, c.at);
      }
    }
  }
  // plans created before the window — pickaxe per plan, cheap
  for (const e of entitySet) {
    if (e.startsWith('PLAN-') && !planCreated.has(e)) {
      try {
        const out = git([
          'log',
          '--format=%aI',
          '--diff-filter=A',
          '--',
          `plans/${e}*.md`,
        ]).trim();
        const first = out.split('\n').filter(Boolean).pop();
        if (first) planCreated.set(e, first);
      } catch {
        /* no history */
      }
    }
  }

  // 6. plan text for linkage + richness (current content)
  const planText = new Map<string, string>();
  for (const [plan, fp] of planFiles()) {
    try {
      planText.set(plan, readFileSync(fp, 'utf8'));
    } catch {
      /* unreadable */
    }
  }
  const links = linkEntities(richiesteNow, planText);

  // 7. build events
  const events: EntityEvent[] = [];
  /** entity → attributed commits (for churn-mix inference on unobserved impl) */
  const commitRefs = new Map<string, { sha: string; at: string }[]>();
  const orphanCommits: RawCommit[] = [];
  for (const c of commits) {
    const attrs = attributeCommit(c);
    if (attrs.length === 0) {
      orphanCommits.push(c);
      continue;
    }
    const cls = classifyCommit(c.files.map((f) => f.path));
    for (const a of attrs) {
      const refs = commitRefs.get(a.entity) ?? [];
      refs.push({ sha: c.sha, at: c.at });
      commitRefs.set(a.entity, refs);
      events.push({
        entity: a.entity,
        kind: 'commit',
        at: c.at,
        cls,
        confidence: a.confidence,
        meta: c.subject.slice(0, 80),
      });
    }
  }
  for (const [e, se] of sectionEvents) {
    if (se.created) events.push({ entity: e, kind: 'entry-created', at: se.created, confidence: 'high' });
    if (se.closed) events.push({ entity: e, kind: 'entry-closed', at: se.closed, confidence: 'high' });
    if (se.lastEdit && se.lastEdit !== se.closed)
      events.push({ entity: e, kind: 'entry-edit', at: se.lastEdit, confidence: 'low' });
  }
  for (const [e, at] of planCreated)
    events.push({ entity: e, kind: 'plan-created', at, confidence: 'high' });
  for (const [e, info] of runs) {
    if (info.bundleAt)
      events.push({ entity: e, kind: 'bundle', at: info.bundleAt, confidence: 'high' });
    for (const [ds, de] of info.spans) {
      events.push({
        entity: e,
        kind: 'debate',
        at: ds,
        confidence: 'high',
        meta: 'start',
        durMs: new Date(de).getTime() - new Date(ds).getTime(),
      });
      events.push({ entity: e, kind: 'debate', at: de, confidence: 'high', meta: 'end' });
    }
    for (const at of info.verifyAt) {
      events.push({ entity: e, kind: 'verify-artifact', at, confidence: 'low' });
    }
  }
  const stamps = readStamps();
  for (const s of stamps) {
    events.push({
      entity: s.plan,
      kind: s.event === 'close' ? 'stamp-close' : 'stamp-open',
      at: s.at,
      confidence: 'high',
    });
  }

  // recency fallback: a commit with no id is attributed to the entity whose
  // latest event precedes it by ≤12h (the work the agent was actually on)
  const RECENCY_MS = 12 * 3600 * 1000;
  const lastEventAt = new Map<string, number>();
  for (const ev of events) {
    const t = new Date(ev.at).getTime();
    if (!Number.isNaN(t)) lastEventAt.set(ev.entity, Math.max(lastEventAt.get(ev.entity) ?? 0, t));
  }
  for (const c of orphanCommits) {
    const t = new Date(c.at).getTime();
    let best: string | null = null;
    let bestDelta = RECENCY_MS;
    for (const [e, at] of lastEventAt) {
      const d = t - at;
      if (d >= 0 && d <= bestDelta) {
        best = e;
        bestDelta = d;
      }
    }
    if (best) {
      const refs = commitRefs.get(best) ?? [];
      refs.push({ sha: c.sha, at: c.at });
      commitRefs.set(best, refs);
      events.push({
        entity: best,
        kind: 'commit',
        at: c.at,
        cls: classifyCommit(c.files.map((f) => f.path)),
        confidence: 'low',
        meta: c.subject.slice(0, 80),
      });
      lastEventAt.set(best, t);
    } else {
      events.push({
        entity: 'unattributed',
        kind: 'commit',
        at: c.at,
        cls: classifyCommit(c.files.map((f) => f.path)),
        confidence: 'low',
        meta: c.subject.slice(0, 80),
      });
    }
  }

  // 8. write ledger (deterministic ordering)
  events.sort(
    (a, b) =>
      a.entity.localeCompare(b.entity) ||
      new Date(a.at).getTime() - new Date(b.at).getTime(),
  );
  mkdirSync(path.dirname(LEDGER_PATH), { recursive: true });
  writeFileSync(LEDGER_PATH, events.map((e) => JSON.stringify(e)).join('\n') + '\n');

  // 9. build rows (merge linked entities into the R- row when present)
  const rowsByKey = new Map<string, EntityEvent[]>();
  const canon = (e: string): string => {
    const linked = links.get(e) ?? [];
    const r = [e, ...linked].find((x) => x.startsWith('R-'));
    return r ?? e;
  };
  for (const e of entitySet) {
    const key = canon(e);
    const list = rowsByKey.get(key) ?? [];
    rowsByKey.set(key, list);
  }
  for (const ev of events) rowsByKey.get(canon(ev.entity))?.push(ev);

  const rows: EntityRow[] = [];
  const STRONG_KINDS = new Set([
    'entry-created',
    'entry-closed',
    'plan-created',
    'bundle',
    'debate',
    'stamp-open',
    'stamp-close',
  ]);
  for (const [key, evs] of rowsByKey) {
    if (key === 'unattributed') continue;
    // weak rows: only bare commit mentions, no lifecycle evidence → ledger only
    const strong = evs.filter((e) => STRONG_KINDS.has(e.kind));
    const commitsOnly = evs.filter((e) => e.kind === 'commit').length;
    if (strong.length === 0 && commitsOnly < 3) continue;
    if (evs.length === 0) continue;
    const t = (s: string) => new Date(s).getTime();
    // NOTE: epoch sort — lexicographic ISO ordering breaks on mixed offsets
    // ('...+02:00' vs '...Z')
    const sorted = [...evs].sort((a, b) => t(a.at) - t(b.at));
    const debateEndAt = [...sorted]
      .reverse()
      .find((e) => e.kind === 'debate' && e.meta === 'end')?.at;
    const planLandedAt = [
      sorted.find((e) => e.kind === 'stamp-open'),
      sorted.find((e) => e.kind === 'plan-created'),
    ]
      .filter((e): e is EntityEvent => !!e)
      .sort((a, b) => t(a.at) - t(b.at))[0]?.at;
    const implEnd =
      [...sorted].reverse().find((e) => e.kind === 'bundle')?.at ??
      sorted.find((e) => e.kind === 'entry-closed')?.at ??
      sorted.find((e) => e.kind === 'stamp-close')?.at;
    // impl starts when the plan is usable: plan-landed after debate-end wins,
    // unless the doc landed after the last bundle (squash-commit artifact) —
    // then fall back to debate-end; plan-landed alone only if nothing better
    const implStart =
      (planLandedAt &&
      (!implEnd || t(planLandedAt) <= t(implEnd)) &&
      (!debateEndAt || t(planLandedAt) > t(debateEndAt))
        ? planLandedAt
        : debateEndAt) ??
      planLandedAt ??
      sorted[0].at;
    // closure belongs to the canon entity itself — a linked plan closing
    // must not mark the parent request closed
    const closeAt =
      sorted.find((e) => e.kind === 'entry-closed' && e.entity === key)?.at ??
      sorted.find((e) => e.kind === 'stamp-close' && e.entity === key)?.at;
    const implSplit: Record<string, number> = {};
    let implMs = 0;
    let waitMs = 0;
    for (let i = 1; i < sorted.length; i++) {
      const prev = sorted[i - 1];
      const cur = sorted[i];
      const ms = t(cur.at) - t(prev.at);
      if (ms <= 0) continue;
      if (closeAt && t(prev.at) >= t(closeAt)) continue; // post-closure bookkeeping
      // inside the impl window every interval is work-in-flight: commit-typed
      // when it ends on a commit, 'unobserved' when silent (work committed
      // later, e.g. squash-commits). wait applies only OUTSIDE impl.
      if (implEnd && t(prev.at) >= t(implStart) && t(cur.at) <= t(implEnd)) {
        // a verify-artifact burst = verification; the gap *before* a burst
        // was the work that produced it, not verification — stays unobserved
        const bucket =
          cur.kind === 'commit'
            ? (cur.cls ?? 'other')
            : cur.kind === 'verify-artifact' && prev.kind === 'verify-artifact'
              ? 'verification'
              : 'unobserved';
        implSplit[bucket] = (implSplit[bucket] ?? 0) + ms;
        implMs += ms;
        continue;
      }
      if (ms > WAIT_GAP_MS) waitMs += ms;
    }
    // intake = lead time to the plan becoming usable (includes debate spans
    // and Director approval gaps); debate shown separately as its subset
    const intakeMs = Math.max(0, t(implStart) - t(sorted[0].at));
    const debateMs = sorted
      .filter((e) => e.kind === 'debate' && e.meta === 'start')
      .reduce((s, e) => s + (e.durMs ?? 0), 0);
    const verifyMs =
      implEnd && closeAt && t(closeAt) > t(implEnd)
        ? t(closeAt) - t(implEnd)
        : 0;
    // mixSplit: distribute `unobserved` impl time by the churn mix of the
    // entity's own impl commits — squash-commits land post-close, so the
    // evidence window extends 24h past it (labeled 'inferred' in the report)
    let mixSplit: Record<string, number> | undefined;
    const unobs = implSplit['unobserved'] ?? 0;
    if (unobs > 0) {
      const lo = t(implStart);
      const hi = closeAt ? t(closeAt) + 24 * 3600 * 1000 : t(sorted[sorted.length - 1].at);
      const members = [key, ...(links.get(key) ?? [])];
      const churn: Record<string, number> = {};
      let tot = 0;
      for (const m of members) {
        for (const ref of commitRefs.get(m) ?? []) {
          const at = t(ref.at);
          if (at < lo || at > hi) continue;
          for (const [cls, share] of Object.entries(churnShares(gitNumstat(ref.sha)))) {
            churn[cls] = (churn[cls] ?? 0) + share; // per-commit share, summed
            tot += share;
          }
        }
      }
      if (tot > 0) {
        mixSplit = {};
        for (const [cls, c] of Object.entries(churn)) {
          mixSplit[cls] = Math.round((c / tot) * unobs);
        }
      }
    }
    // PLAN-059 T-001: rework metrics. Churn per-file sui commit impl
    // (stessa window del mixSplit: implStart → closeAt + 24h per gli
    // squash-commit), confrontato coi path nominati nel plan; commit dopo
    // il primo bundle = rework post-"fatto"; retry = verdict BLOCKED
    // nella git history dei bundle dei run dir.
    const members = [key, ...(links.get(key) ?? [])];
    const planTextFor = members
      .map((m) => planText.get(m))
      .filter((x): x is string => !!x)
      .join('\n');
    const features = planTextFor ? planFeatures(planTextFor) : undefined;
    const named = planTextFor ? planNamedPaths(planTextFor) : [];
    const implChurn = new Map<string, number>();
    const firstBundleAt = [...sorted].find((e) => e.kind === 'bundle')?.at;
    let postBundleCommits = 0;
    {
      const lo = t(implStart);
      const hi = closeAt ? t(closeAt) + 24 * 3600 * 1000 : t(sorted[sorted.length - 1].at);
      for (const m of members) {
        for (const ref of commitRefs.get(m) ?? []) {
          const at = t(ref.at);
          if (at < lo || at > hi) continue;
          if (firstBundleAt && at > t(firstBundleAt)) postBundleCommits += 1;
          for (const [f, c] of fileChurn(gitNumstat(ref.sha))) {
            implChurn.set(f, (implChurn.get(f) ?? 0) + c);
          }
        }
      }
    }
    let retries = 0;
    let retriesKnown = false;
    for (const d of runs.get(key)?.dirs ?? []) {
      const n = bundleRetries(d);
      if (n !== null) {
        retries += n;
        retriesKnown = true;
      }
    }
    const rework: ReworkStats | undefined =
      features || implChurn.size > 0
        ? {
            out_of_plan_churn: planTextFor ? outOfPlanShare(implChurn, named) : null,
            out_of_plan_split: planTextFor ? outOfPlanBreakdown(implChurn, named) : null,
            post_bundle_commits: postBundleCommits,
            bundle_retries: retriesKnown ? retries : null,
          }
        : undefined;
    rows.push({
      entity: key,
      linked: links.get(key) ?? [],
      firstAt: sorted[0].at,
      lastAt: sorted[sorted.length - 1].at,
      intakeMs,
      debateMs,
      implMs,
      verifyMs,
      waitMs,
      implSplit,
      mixSplit,
      features,
      rework,
      implCodeShare: implMs > 0 ? (implSplit['code'] ?? 0) / implMs : 0,
      closed: !!closeAt,
    });
  }
  rows.sort((a, b) => new Date(a.lastAt).getTime() - new Date(b.lastAt).getTime());

  // 10. richness
  const richness: PlanRichness[] = [];
  for (const [plan, text] of planText) {
    const r = computeRichness(text, runs.get(plan)?.artifacts ?? 0);
    r.plan = plan;
    richness.push(r);
  }

  // 11. backfill plan-timing.jsonl (open/close for bundle-bearing plans w/o stamp)
  const stampedOpen = new Set(stamps.filter((s) => s.event === 'open').map((s) => s.plan));
  const stampedClose = new Set(stamps.filter((s) => s.event === 'close').map((s) => s.plan));
  let backfilled = 0;
  for (const [e, info] of runs) {
    if (!e.startsWith('PLAN-') || !info.bundleAt) continue;
    if (!stampedOpen.has(e) && planCreated.get(e)) {
      appendFileSync(
        STAMP_LEDGER,
        JSON.stringify({
          plan: e,
          event: 'open',
          at: planCreated.get(e),
          lane: 'local',
          kind: 'backfill',
          text: 'planForensics: plan file created (battezzo proxy)',
        }) + '\n',
      );
      stampedOpen.add(e);
      backfilled++;
    }
    if (!stampedClose.has(e)) {
      appendFileSync(
        STAMP_LEDGER,
        JSON.stringify({
          plan: e,
          event: 'close',
          at: info.bundleAt,
          kind: 'backfill',
          text: 'planForensics: bundle produced_at',
        }) + '\n',
      );
      stampedClose.add(e);
      backfilled++;
    }
  }

  // 12. report
  const report = renderReport(
    rows,
    richness,
    events.filter((e) => e.entity === 'unattributed'),
    collectGateStats(REPO_ROOT),
  );
  writeFileSync(REPORT_PATH, report);
  if (json) {
    console.log(JSON.stringify({ rows, richness, events: events.length, backfilled }, null, 1));
  } else {
    console.log(
      `[planForensics] ${events.length} events · ${rows.length} entities · ${backfilled} stamps backfilled\n` +
        `  ledger: ${path.relative(REPO_ROOT, LEDGER_PATH)}\n  report: ${path.relative(REPO_ROOT, REPORT_PATH)}`,
    );
  }
}

if (process.argv[1] && process.argv[1].endsWith('planForensics.ts')) main();
