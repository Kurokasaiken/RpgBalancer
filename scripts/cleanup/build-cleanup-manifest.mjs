#!/usr/bin/env node
/**
 * PLAN-132 / R-381 — build the cleanup manifest.
 *
 * Scans the candidate zones, computes size/age/tracked/citations, classifies
 * each entry DELETE / REVIEW / KEEP, and derives protected.txt mechanically
 * (cited paths, baptized assets, sessions/auth, ledger archives, work <24h).
 *
 * Usage: node scripts/cleanup/build-cleanup-manifest.mjs
 * Output: test-results/cleanup/{manifest.csv,protected.txt,delete-candidates.txt,review-candidates.txt}
 */
import { execFileSync, execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const OUT_DIR = path.join(ROOT, 'test-results', 'cleanup');
const AGE_DAYS_LIMIT = 90; // Director ruling R-381 (2026-11-24)
const HOT_MTIME_MS = 24 * 3600 * 1000; // T-13: work <24h is always protected
const REVIEW_BIG_RUN_KB = 50 * 1024; // runs >50MB uncited go to REVIEW at any age

/* ---------- candidate zones ---------- */
// {kind: 'dir'} scans entries at depth 1; {kind:'self'} is the path itself.
const ZONES = [
  { kind: 'dir', dir: '.mw/runs', cat: 'mw-run' },
  { kind: 'dir', dir: '.mw/specs', cat: 'mw-spec' },
  { kind: 'self', dir: '.mw/archive', cat: 'mw-archive' },
  { kind: 'self', dir: '.mw/bugs', cat: 'mw-bugs' },
  { kind: 'self', dir: '.mw/red-first', cat: 'mw-redfirst' },
  { kind: 'self', dir: '.mw/contracts', cat: 'mw-contracts' },
  { kind: 'self', dir: '.mw/ui-catalog', cat: 'mw-catalog' },
  { kind: 'self', dir: '.mw/claude-pack', cat: 'mw-claude-pack' },
  { kind: 'self', dir: '.mw/venv', cat: 'mw-venv' },
  { kind: 'dir', dir: 'test-results', cat: 'test-results' },
  { kind: 'dir', dir: 'scripts', match: /^_tmp/, cat: 'tmp-script' },
  { kind: 'self', dir: 'out', cat: 'tracked-out' },
  { kind: 'self', dir: 'dev-public', cat: 'tracked-dev-public' },
  { kind: 'self', dir: 'marketing', cat: 'tracked-marketing' },
  { kind: 'self', dir: 'deliverables', cat: 'tracked-deliverables' },
  { kind: 'self', dir: 'artifacts', cat: 'tracked-artifacts' },
  { kind: 'self', dir: 'diagnostics', cat: 'tracked-diagnostics' },
  { kind: 'self', dir: 'assets-source', cat: 'tracked-assets-source' },
  { kind: 'self', dir: 'assets_originals', cat: 'assets-originals' },
  { kind: 'dir', dir: 'context/research', cat: 'context-research' },
  { kind: 'self', dir: 'src/docs', cat: 'tracked-docs' },
  { kind: 'self', dir: '.sdx-venv', cat: 'sdx-venv' },
  { kind: 'self', dir: 'venv', cat: 'venv' },
  { kind: 'self', dir: 'dist', cat: 'dist' },
  { kind: 'self', dir: 'dist-playwright', cat: 'dist-playwright' },
  { kind: 'self', dir: 'src-tauri/target', cat: 'cargo-target' },
  { kind: 'self', dir: 'tools/hud-real/venv', cat: 'hudreal-venv' },
  { kind: 'self', dir: 'tools/hud-real/models', cat: 'hudreal-models' },
  { kind: 'self', dir: 'tools/hud-real/__pycache__', cat: 'hudreal-pycache' },
  { kind: 'dir', dir: '.claude/worktrees', cat: 'claude-worktree' },
  { kind: 'self', dir: 'report_tmp.jpg', cat: 'stray' },
  { kind: 'self', dir: 'map.jpg', cat: 'stray' },
  { kind: 'self', dir: 'Map finale.jpg', cat: 'stray' },
  { kind: 'self', dir: 'hd-photo-Map finale', cat: 'stray' },
];

// provider-profile cache dirs (inside each profile root): caches only — NEVER
// cookies/login/local storage/accounts (Director ruling: pulisci solo cache).
const PROFILE_ROOTS = ['.mw/providers/profiles/shared', '.mw/providers/profiles/pool-0'];
const PROFILE_CACHE_DIRS = [
  'Cache', 'Code Cache', 'GPUCache', 'DawnWebGPUCache', 'DawnGraphiteCache',
  'component_crx_cache', 'optimization_guide_model_store', 'WasmTtsEngine',
  'Safe Browsing', 'Local Traces', 'BrowserMetrics', 'GrShaderCache',
  'GraphiteDawnCache', 'ShaderCache',
];

// always protected, no matter what the citation scan finds
const HARD_PROTECTED = [
  '.mw/venv', '.mw/providers/sessions', '.mw/providers/auth',
  '.mw/bugs', '.mw/red-first', '.mw/contracts', '.mw/archive',
  '.mw/desiderata.md', '.mw/desiderata-digest.md',
  'RICHIESTE-backlog.md', 'RICHIESTE-archive.md', 'context/DECISION_LOG-archive.md',
  'map.jpg', 'Map finale.jpg', 'hd-photo-Map finale', // possible map sources → regola 46, REVIEW not delete
];

// baptism / approved-reference markers (regola 46) — basename match
const BAPTISM_RE = /battezzat|approved|golden|visual-fork|baseline|approved-look/i;

// files whose contents count as citation corpus
const CORPUS_GLOBS = [
  'RICHIESTE.md', 'RICHIESTE-backlog.md', 'RICHIESTE-archive.md',
  'context/DECISION_LOG.md', 'context/DECISION_LOG-archive.md',
  'context/recurring-traps.md', 'CANON.md', 'AGENTS.md', 'CURRENT_STATE.md',
  'package.json',
];

/* ---------- helpers ---------- */
const sh = (cmd, args) => {
  try {
    return execFileSync(cmd, args, { cwd: ROOT, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  } catch {
    return '';
  }
};

const duKB = (p) => {
  const out = sh('du', ['-sk', p]).trim();
  const m = out.match(/^(\d+)/);
  return m ? Number(m[1]) : 0;
};

function listDirEntries(zone) {
  const abs = path.join(ROOT, zone.dir);
  if (!fs.existsSync(abs)) return [];
  if (zone.kind === 'self') return [zone.dir];
  return fs.readdirSync(abs, { withFileTypes: true })
    .filter((e) => (zone.match ? zone.match.test(e.name) : true))
    .map((e) => path.join(zone.dir, e.name));
}

function buildCorpus() {
  const files = [...CORPUS_GLOBS];
  for (const d of ['plans', '.windsurf/rules', 'src/docs/docs']) {
    const abs = path.join(ROOT, d);
    if (!fs.existsSync(abs)) continue;
    for (const e of fs.readdirSync(abs, { withFileTypes: true })) {
      if (e.isFile() && /\.md$/.test(e.name)) files.push(path.join(d, e.name));
    }
  }
  const corpus = files
    .map((f) => {
      try {
        return fs.readFileSync(path.join(ROOT, f), 'utf8');
      } catch {
        return '';
      }
    })
    .join('\n');
  return corpus;
}

const trackedSet = new Set(sh('git', ['ls-files']).split('\n').filter(Boolean));
const trackedRoots = new Set([...trackedSet].map((f) => f.split('/').slice(0, -1).join('/')));
const isTracked = (p) => {
  if (trackedSet.has(p)) return true;
  // a directory counts as tracked if any tracked file lives under it
  let cur = p;
  while (cur && cur !== '.') {
    if (trackedRoots.has(cur)) return true;
    cur = path.dirname(cur);
  }
  return false;
};

const corpus = buildCorpus();
const isCited = (p) => {
  if (p.length >= 8 && corpus.includes(p)) return true;
  const base = path.basename(p);
  return base.length >= 8 && corpus.includes(base);
};

const isHot = (p) => {
  try {
    return Date.now() - fs.statSync(path.join(ROOT, p)).mtimeMs < HOT_MTIME_MS;
  } catch {
    return false;
  }
};

/* ---------- candidates ---------- */
const candidates = [];
for (const zone of ZONES) {
  for (const p of listDirEntries(zone)) candidates.push({ path: p, cat: zone.cat });
}
// provider cache dirs
for (const rootDir of PROFILE_ROOTS) {
  const abs = path.join(ROOT, rootDir);
  if (!fs.existsSync(abs)) continue;
  for (const e of fs.readdirSync(abs, { withFileTypes: true })) {
    if (!e.isDirectory()) continue;
    for (const c of PROFILE_CACHE_DIRS) {
      const p = path.join(rootDir, e.name, c);
      if (fs.existsSync(path.join(ROOT, p))) candidates.push({ path: p, cat: 'provider-cache' });
    }
    for (const c of ['component_crx_cache', 'optimization_guide_model_store', 'WasmTtsEngine', 'Safe Browsing', 'Local Traces', 'BrowserMetrics']) {
      const p = path.join(rootDir, c);
      if (fs.existsSync(path.join(ROOT, p))) candidates.push({ path: p, cat: 'provider-cache' });
    }
  }
}

/* ---------- classify ---------- */
const DELETE_CATS = new Set(['cargo-target', 'dist', 'dist-playwright', 'hudreal-venv', 'hudreal-models', 'hudreal-pycache', 'sdx-venv', 'venv', 'provider-cache']);
const REVIEW_CATS = new Set(['tracked-out', 'tracked-dev-public', 'tracked-marketing', 'tracked-deliverables', 'tracked-artifacts', 'tracked-diagnostics', 'tracked-assets-source', 'assets-originals', 'context-research', 'tracked-docs', 'stray', 'mw-spec', 'mw-catalog', 'claude-worktree', 'test-results']);
const rows = [];

for (const c of candidates) {
  const p = c.path;
  const exists = fs.existsSync(path.join(ROOT, p));
  if (!exists) continue;
  const stat = fs.statSync(path.join(ROOT, p));
  const isLink = fs.lstatSync(path.join(ROOT, p)).isSymbolicLink();
  const mtime = stat.mtime;
  const ageDays = Math.floor((Date.now() - mtime.getTime()) / 86400000);
  const sizeKB = isLink ? 0 : duKB(p); // symlink: non seguire (es. .mw/venv → mind-weaver)
  const cited = isCited(p);
  const base = path.basename(p);
  const baptized = BAPTISM_RE.test(base);
  const hot = isHot(p);
  const hard = HARD_PROTECTED.some((h) => p === h || p.startsWith(h + '/'));
  const hasBundle = stat.isDirectory() && fs.existsSync(path.join(ROOT, p, 'bundle.json'));
  const tracked = isTracked(p);

  let cls = 'REVIEW';
  let why = '';
  if (hard) { cls = 'PROTECTED'; why = 'hard-protected'; }
  else if (hot) { cls = 'PROTECTED'; why = 'mtime<24h'; }
  else if (DELETE_CATS.has(c.cat)) { cls = 'DELETE'; why = 'regenerable/approved'; }
  else if (cited) { cls = 'PROTECTED'; why = 'cited'; }
  else if (baptized) { cls = 'PROTECTED'; why = 'baptism-marker'; }
  else if (c.cat === 'mw-run' && hasBundle) { cls = 'REVIEW'; why = 'bundle-uncited'; }
  else if (c.cat === 'mw-run' && ageDays > AGE_DAYS_LIMIT) { cls = 'DELETE'; why = `run>${AGE_DAYS_LIMIT}d-uncited`; }
  else if (c.cat === 'tmp-script' && !cited) { cls = 'DELETE'; why = 'tmp-uncited'; }
  else if (c.cat === 'mw-run' && sizeKB > REVIEW_BIG_RUN_KB) { cls = 'REVIEW'; why = `run>${Math.round(REVIEW_BIG_RUN_KB / 1024)}MB-uncited`; }
  else if (REVIEW_CATS.has(c.cat)) { cls = 'REVIEW'; why = 'review-batch'; }
  else { cls = 'KEEP'; why = 'no-rule'; }

  rows.push({ path: p, cat: c.cat, cls, why, sizeKB, ageDays, tracked, cited });
}

/* ---------- emit ---------- */
fs.mkdirSync(OUT_DIR, { recursive: true });
const esc = (s) => `"${String(s).replaceAll('"', '""')}"`;
const csv = [
  'path,category,classification,reason,size_kb,age_days,tracked,cited',
  ...rows.map((r) => [esc(r.path), r.cat, r.cls, esc(r.why), r.sizeKB, r.ageDays, r.tracked ? 1 : 0, r.cited ? 1 : 0].join(',')),
].join('\n');
fs.writeFileSync(path.join(OUT_DIR, 'manifest.csv'), csv + '\n');
fs.writeFileSync(
  path.join(OUT_DIR, 'protected.txt'),
  rows.filter((r) => r.cls === 'PROTECTED').map((r) => r.path).sort().join('\n') + '\n',
);
fs.writeFileSync(
  path.join(OUT_DIR, 'delete-candidates.txt'),
  rows.filter((r) => r.cls === 'DELETE').map((r) => `${r.path}\t${r.sizeKB}KB\t${r.why}`).sort().join('\n') + '\n',
);
fs.writeFileSync(
  path.join(OUT_DIR, 'review-candidates.txt'),
  rows.filter((r) => r.cls === 'REVIEW').map((r) => `${r.path}\t${r.sizeKB}KB\t${r.why}`).sort().join('\n') + '\n',
);

const sum = (cls) => rows.filter((r) => r.cls === cls).reduce((a, r) => a + r.sizeKB, 0);
const fmt = (kb) => (kb / 1048576).toFixed(2) + 'G';
console.log(`manifest: ${rows.length} entries`);
console.log(`PROTECTED: ${rows.filter((r) => r.cls === 'PROTECTED').length} (${fmt(sum('PROTECTED'))})`);
console.log(`DELETE:    ${rows.filter((r) => r.cls === 'DELETE').length} (${fmt(sum('DELETE'))})`);
console.log(`REVIEW:    ${rows.filter((r) => r.cls === 'REVIEW').length} (${fmt(sum('REVIEW'))})`);
console.log(`KEEP:      ${rows.filter((r) => r.cls === 'KEEP').length} (${fmt(sum('KEEP'))})`);
console.log(`out: ${path.relative(ROOT, OUT_DIR)}/`);
