#!/usr/bin/env node
/**
 * deployManifest.mjs — PLAN-118 T-0: audit meccanico del deploy slim.
 *
 * Genera `deploy-manifest.json` a partire da:
 *  - la route surface reale di `src/App.tsx` (branch `pathname === '...'` e
 *    `[...].includes(pathname)`), con la semantica di match rilevata;
 *  - le tab del menu prodotte da `navConfig.ts` (shell kept);
 *  - i riferimenti a path `/...` trovati in `src/**` e nei JSON di `public/`
 *    (config-driven: layers.json, regions.json, locales, fonts, manifest PWA);
 *  - l'intero contenuto di `public/` per classificare referenced vs orphan.
 *
 * Uso:
 *   node scripts/deploy/deployManifest.mjs [--profile slim|full] [--check]
 *
 * `--check` confronta col manifest committato e fallisce su drift (OB-1).
 * `--profile slim` (default) marca come kept solo la whitelist Director;
 * `--profile full` marca tutto kept (confronto like-for-like).
 */
import { readdirSync, readFileSync, statSync, existsSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { spawnSync } from 'node:child_process';

const ROOT = new URL('../../', import.meta.url).pathname;
const MANIFEST_PATH = join(ROOT, 'deploy-manifest.json');
const APP_TSX = join(ROOT, 'src/App.tsx');
const PUBLIC_DIR = join(ROOT, 'public');
const SRC_DIR = join(ROOT, 'src');

/** Whitelist Director (R-327 ruling): landing, game, landing target, shell menu. */
const KEPT_ROUTES = new Set(['/', '/game', '/mappa2-lab', '/index.html']);

/** Directory di public/ candidate a diventare dev-public (D-1, da confermare post-audit). */
const DEV_ONLY_CANDIDATE_DIRS = [
  'mockups', 'lab-fan-mock', 'hud-target', 'fork-mountains',
  'spike-land-breath', 'example-circle-star', 'lab-preview', 'labs',
];

const args = new Set(process.argv.slice(2));
const profile = args.has('--profile')
  ? process.argv[process.argv.indexOf('--profile') + 1]
  : 'slim';
const checkOnly = args.has('--check');

/** Estrae i path routable da App.tsx e la semantica di match. */
function extractRouteTable() {
  const src = readText('src/App.tsx');
  const entries = new Map(); // path -> match kind
  for (const m of src.matchAll(/pathname\s*===\s*'([^']+)'/g)) {
    entries.set(m[1], 'exact');
  }
  for (const m of src.matchAll(/\[\s*([^\]]+)\]\.includes\([^)]*pathname\)/g)) {
    for (const lit of m[1].matchAll(/'([^']+)'/g)) {
      entries.set(lit[1], 'exact-set');
    }
  }
  for (const m of src.matchAll(/pathname\.(?:startsWith|includes)\(\s*'([^']+)'/g)) {
    entries.set(m[1], 'prefix');
  }
  return [...entries.entries()].sort(([a], [b]) => a.localeCompare(b))
    .map(([path, match]) => ({ path, match }));
}

/** Sorgente file set: con `.git` presente il manifest è funzione pura di HEAD
 *  (ls-tree + cat-file --batch) — worktree sporco (untracked, modifiche non
 *  committate) non causa drift né qui né sul builder git remoto, il cui
 *  checkout è già HEAD. Senza `.git` (builder Vercel post-clone/upload) si
 *  ripiega sul FS, che lì coincide con l'albero deployato.
 *  DEPLOY_MANIFEST_FS=1 forza la modalità FS (debug). */
const GIT_MODE = !process.env.DEPLOY_MANIFEST_FS && existsSync(join(ROOT, '.git'));

function git(args, opts = {}) {
  const r = spawnSync('git', args, { cwd: ROOT, maxBuffer: 256 * 1024 * 1024, ...opts });
  if (r.status !== 0) throw new Error(`git ${args[0]}: ${String(r.stderr).slice(0, 300)}`);
  return r.stdout;
}

/** relPath → {sha, bytes} per i blob a HEAD (esclusi symlink/submodule). */
function loadHeadFiles() {
  const map = new Map();
  for (const rec of git(['ls-tree', '-r', '-l', '-z', 'HEAD']).toString('utf8').split('\0')) {
    if (!rec) continue;
    const tab = rec.indexOf('\t');
    const [mode, type, sha, size] = rec.slice(0, tab).trim().split(/\s+/);
    if (type !== 'blob' || !mode.startsWith('100')) continue;
    map.set(rec.slice(tab + 1), { sha, bytes: Number(size) });
  }
  return map;
}

/** Contenuti @HEAD in un unico `git cat-file --batch` (per sha, ordine = input). */
function gitBatchBlobs(paths, headMap) {
  const input = paths.map((p) => headMap.get(p).sha).join('\n') + '\n';
  const buf = git(['cat-file', '--batch'], { input, maxBuffer: 1024 * 1024 * 1024 });
  const texts = new Map();
  let off = 0;
  for (const p of paths) {
    const nl = buf.indexOf(0x0a, off); // '\n'
    const size = Number(buf.toString('utf8', off, nl).split(' ')[2]);
    texts.set(p, buf.toString('utf8', nl + 1, nl + 1 + size));
    off = nl + 1 + size + 1; // blob + '\n' terminator
  }
  return texts;
}

const headFiles = GIT_MODE ? loadHeadFiles() : null;

/** `.vercelignore` = file set escluso dal deploy. In GIT_MODE si legge la
 *  versione committata: è quella che il builder git applica al clone. */
const VERCELIGNORE_SRC = GIT_MODE
  ? (headFiles.has('.vercelignore')
      ? gitBatchBlobs(['.vercelignore'], headFiles).get('.vercelignore')
      : '')
  : (existsSync(join(ROOT, '.vercelignore')) ? readFileSync(join(ROOT, '.vercelignore'), 'utf8') : '');
const IGNORE_PATTERNS = VERCELIGNORE_SRC.split('\n')
  .map(l => l.trim()).filter(l => l && !l.startsWith('#'));
function isIgnored(relPath) {
  const base = relPath.split('/').pop();
  for (const p of IGNORE_PATTERNS) {
    const pat = p.replace(/\/$/, '');
    if (pat.startsWith('*')) { if (base.endsWith(pat.slice(1))) return true; continue; }
    if (pat.includes('/')) { if (relPath === pat || relPath.startsWith(pat + '/')) return true; continue; }
    if (relPath.split('/').includes(pat) || base === pat) return true;
  }
  return base === '.DS_Store';
}

const SRC_TEXT_EXT = /\.(ts|tsx|js|jsx|mjs|css|html|json)$/;
const hasDocsComponent = (rel) => rel.split('/').includes('docs');

// In GIT_MODE: contenuti @HEAD di tutti i sorgenti testuali in un solo batch.
let srcTextPaths = null;
let publicJsonPaths = null;
let headText = null;
if (GIT_MODE) {
  srcTextPaths = [...headFiles.keys()].filter(
    (p) => p.startsWith('src/') && SRC_TEXT_EXT.test(p) && !hasDocsComponent(p));
  publicJsonPaths = [...headFiles.keys()].filter(
    (p) => p.startsWith('public/') && p.endsWith('.json') && !isIgnored(p));
  const extra = ['index.html'].filter((p) => headFiles.has(p));
  headText = gitBatchBlobs([...srcTextPaths, ...publicJsonPaths, ...extra], headFiles);
}

const readText = (rel) => (GIT_MODE ? (headText.get(rel) ?? '') : readFileSync(join(ROOT, rel), 'utf8'));

/** Raccoglie tutti i file sotto public/ come path relativi `/`-prefissati. */
function walkPublic() {
  const out = [];
  if (GIT_MODE) {
    for (const [p, meta] of headFiles) {
      if (!p.startsWith('public/') || isIgnored(p)) continue;
      out.push({ path: p.slice('public'.length), bytes: meta.bytes });
    }
    return out;
  }
  const walk = (dir, prefix) => {
    for (const name of readdirSync(dir)) {
      const abs = join(dir, name);
      const rel = `${prefix}/${name}`;
      const st = statSync(abs);
      if (st.isDirectory()) { if (!isIgnored(rel.replace(/^\/public\//, 'public/'))) walk(abs, rel); continue; }
      if (isIgnored(rel.replace(/^\/public\//, 'public/'))) continue;
      out.push({ path: rel.replace(/^\/public/, ''), bytes: st.size });
    }
  };
  walk(PUBLIC_DIR, '/public');
  return out;
}

/** Literal `/...` in sorgenti testuali (src code + JSON public). */
function collectPublicRefs() {
  const referenced = new Set(['/manifest.json', '/favicon.ico']);
  const dynamicPrefixes = new Set();
  const srcToDevPublic = [];

  const visit = (relFile, text, isKeptGraph) => {
    for (const m of text.matchAll(/['"`](\/(?:assets|locales|fonts|ui|docs|audio|mockups|labs?[^'"`/]*|lab-fan-mock|fork-mountains|hud-target|spike-[^'"`/]*|example-[^'"`/]*)\/[^'"`\\]*)['"`]/g)) {
      const p = m[1];
      if (p.includes('${')) { dynamicPrefixes.add(p.slice(0, p.indexOf('${'))); continue; }
      referenced.add(p);
      if (isKeptGraph && DEV_ONLY_CANDIDATE_DIRS.some(d => p.startsWith(`/${d}/`))) {
        srcToDevPublic.push({ file: relFile, path: p });
      }
    }
  };

  if (GIT_MODE) {
    for (const rel of srcTextPaths) visit(rel, headText.get(rel), true);
    if (headText.has('index.html')) visit('index.html', headText.get('index.html'), true);
    for (const rel of publicJsonPaths) {
      for (const m of headText.get(rel).matchAll(/"(\/[^"]+)"/g)) referenced.add(m[1]);
    }
    return { referenced, dynamicPrefixes, srcToDevPublic };
  }

  const walkSrc = (dir) => {
    for (const name of readdirSync(dir)) {
      const abs = join(dir, name);
      const st = statSync(abs);
      if (st.isDirectory()) { if (name !== 'docs') walkSrc(abs); continue; }
      if (!/\.(ts|tsx|js|jsx|mjs|css|html|json)$/.test(name)) continue;
      visit(relative(ROOT, abs), readFileSync(abs, 'utf8'), true);
    }
  };
  walkSrc(SRC_DIR);
  visit('index.html', readFileSync(join(ROOT, 'index.html'), 'utf8'), true);

  // JSON config-driven dentro public/ (layers.json, regions.json, …)
  const walkJson = (dir, prefix = 'public') => {
    for (const name of readdirSync(dir)) {
      const abs = join(dir, name);
      const rel = `${prefix}/${name}`;
      const st = statSync(abs);
      if (st.isDirectory()) { if (!isIgnored(rel)) walkJson(abs, rel); continue; }
      if (!name.endsWith('.json') || isIgnored(rel)) continue;
      for (const m of readFileSync(abs, 'utf8').matchAll(/"(\/[^"]+)"/g)) referenced.add(m[1]);
    }
  };
  walkJson(PUBLIC_DIR);
  return { referenced, dynamicPrefixes, srcToDevPublic };
}

const routes = extractRouteTable();
// PLAN-118 T-1: la route table autorevole delle lab vive in labRouteData.ts
const LAB_DATA = join(ROOT, 'src/deploy/labRouteData.ts');
if (GIT_MODE ? headFiles.has('src/deploy/labRouteData.ts') : existsSync(LAB_DATA)) {
  const dataSrc = readText('src/deploy/labRouteData.ts');
  const known = new Set(routes.map(r => r.path));
  for (const m of dataSrc.matchAll(/['"](\/[^'"]*)['"]/g)) {
    if (!known.has(m[1])) routes.push({ path: m[1], match: 'registry' });
  }
  routes.sort((a, b) => a.path.localeCompare(b.path));
}
const labRoutes = routes.filter(r => !KEPT_ROUTES.has(r.path));
const keptRoutes = routes.filter(r => KEPT_ROUTES.has(r.path));
const { referenced, dynamicPrefixes, srcToDevPublic } = collectPublicRefs();
// Ordinamento deterministico: la walk FS segue readdir (ordine OS-dipendente),
// ls-tree è già ordinato — uniformiamo perché --check confronta il JSON.
srcToDevPublic.sort((a, b) => (a.file + '' + a.path).localeCompare(b.file + '' + b.path));

const publicFiles = walkPublic();
const orphans = publicFiles
  .filter(f => !referenced.has(f.path)
    && ![...dynamicPrefixes].some(dp => f.path.startsWith(dp)))
  .map(f => ({ path: f.path, bytes: f.bytes }))
  .sort((a, b) => b.bytes - a.bytes || a.path.localeCompare(b.path));

const manifest = {
  generated: new Date().toISOString(),
  generator: 'scripts/deploy/deployManifest.mjs',
  profile,
  keptRoutes,
  labPaths: labRoutes.map(r => r.path),
  routeMatchSemantics: Object.fromEntries(routes.map(r => [r.path, r.match])),
  public: {
    totalFiles: publicFiles.length,
    referencedCount: referenced.size,
    dynamicPrefixes: [...dynamicPrefixes].sort(),
    devOnlyCandidateDirs: DEV_ONLY_CANDIDATE_DIRS,
    srcToDevPublicRefs: srcToDevPublic,
    orphanCandidates: orphans.slice(0, 500),
    orphanBytes: orphans.reduce((s, o) => s + o.bytes, 0),
  },
};

if (checkOnly) {
  const prev = JSON.parse(readFileSync(MANIFEST_PATH, 'utf8'));
  const strip = ({ generated: _g, ...rest }) => rest;
  const same = JSON.stringify(strip(prev)) === JSON.stringify(strip(manifest));
  if (!same) {
    // Diagnosi minima: quale sezione diverge + primi path (es. file untracked
    // uploadati da un deploy CLI, o file committati senza rigenerare).
    const diffs = [];
    const pp = prev.public ?? {};
    const mp = manifest.public;
    if (pp.totalFiles !== mp.totalFiles) diffs.push(`public.totalFiles ${pp.totalFiles} → ${mp.totalFiles}`);
    if (pp.referencedCount !== mp.referencedCount) diffs.push(`referencedCount ${pp.referencedCount} → ${mp.referencedCount}`);
    if (pp.orphanBytes !== mp.orphanBytes) diffs.push(`orphanBytes ${pp.orphanBytes} → ${mp.orphanBytes}`);
    const prevRefs = pp.srcToDevPublicRefs ?? pp.keptToDevPublicRefs ?? [];
    if (prevRefs.length !== mp.srcToDevPublicRefs.length)
      diffs.push(`srcToDevPublicRefs ${prevRefs.length} → ${mp.srcToDevPublicRefs.length}`);
    const prevOr = new Set((pp.orphanCandidates ?? []).map((o) => o.path));
    const nowOr = new Set(mp.orphanCandidates.map((o) => o.path));
    for (const p of [...prevOr].filter((x) => !nowOr.has(x)).slice(0, 8)) diffs.push(`- orphan solo nel committato: ${p}`);
    for (const p of [...nowOr].filter((x) => !prevOr.has(x)).slice(0, 8)) diffs.push(`+ orphan solo nel rigenerato: ${p}`);
    if (!diffs.length) diffs.push('diff in routes/refs/bytes — confronta il JSON');
    console.error(`[deploy-manifest] DRIFT (sorgente: ${GIT_MODE ? 'HEAD' : 'FS'}) — rigenera con deployManifest.mjs`);
    for (const d of diffs) console.error(`  ${d}`);
    process.exit(1);
  }
  console.log(`[deploy-manifest] OK: committato == rigenerato (sorgente: ${GIT_MODE ? 'HEAD' : 'FS'})`);
  process.exit(0);
}

writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2) + '\n');
const mb = (b) => `${(b / 1048576).toFixed(1)} MB`;
console.log(`[deploy-manifest] profile=${profile} source=${GIT_MODE ? 'HEAD' : 'FS'}`);
console.log(`  routes: ${routes.length} totali, kept=${keptRoutes.length}, lab=${labRoutes.length}`);
console.log(`  public: ${publicFiles.length} file, refs=${referenced.size}, orphans=${orphans.length} (${mb(manifest.public.orphanBytes)})`);
console.log(`  dynamicPrefixes=${dynamicPrefixes.size}, srcToDevPublic refs=${srcToDevPublic.length}`);
console.log(`  → ${relative(ROOT, MANIFEST_PATH)}`);
