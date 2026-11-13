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
  const src = readFileSync(APP_TSX, 'utf8');
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

/** Raccoglie tutti i file sotto una dir come path relativi `/`-prefissati. */
function walkPublic() {
  const out = [];
  const walk = (dir, prefix) => {
    for (const name of readdirSync(dir)) {
      const abs = join(dir, name);
      const rel = `${prefix}/${name}`;
      const st = statSync(abs);
      if (st.isDirectory()) walk(abs, rel);
      else out.push({ path: rel.replace(/^\/public/, ''), bytes: st.size });
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

  const visit = (file, text, isKeptGraph) => {
    for (const m of text.matchAll(/['"`](\/(?:assets|locales|fonts|ui|docs|audio|mockups|labs?[^'"`/]*|lab-fan-mock|fork-mountains|hud-target|spike-[^'"`/]*|example-[^'"`/]*)\/[^'"`\\]*)['"`]/g)) {
      const p = m[1];
      if (p.includes('${')) { dynamicPrefixes.add(p.slice(0, p.indexOf('${'))); continue; }
      referenced.add(p);
      if (isKeptGraph && DEV_ONLY_CANDIDATE_DIRS.some(d => p.startsWith(`/${d}/`))) {
        srcToDevPublic.push({ file: relative(ROOT, file), path: p });
      }
    }
  };

  const walkSrc = (dir) => {
    for (const name of readdirSync(dir)) {
      const abs = join(dir, name);
      const st = statSync(abs);
      if (st.isDirectory()) { if (name !== 'docs') walkSrc(abs); continue; }
      if (!/\.(ts|tsx|js|jsx|mjs|css|html|json)$/.test(name)) continue;
      visit(abs, readFileSync(abs, 'utf8'), true);
    }
  };
  walkSrc(SRC_DIR);
  visit(join(ROOT, 'index.html'), readFileSync(join(ROOT, 'index.html'), 'utf8'), true);

  // JSON config-driven dentro public/ (layers.json, regions.json, …)
  const walkJson = (dir) => {
    for (const name of readdirSync(dir)) {
      const abs = join(dir, name);
      const st = statSync(abs);
      if (st.isDirectory()) { walkJson(abs); continue; }
      if (!name.endsWith('.json')) continue;
      for (const m of readFileSync(abs, 'utf8').matchAll(/"(\/[^"]+)"/g)) referenced.add(m[1]);
    }
  };
  walkJson(PUBLIC_DIR);
  return { referenced, dynamicPrefixes, srcToDevPublic };
}

const routes = extractRouteTable();
// PLAN-118 T-1: la route table autorevole delle lab vive in labRouteData.ts
const LAB_DATA = join(ROOT, 'src/deploy/labRouteData.ts');
if (existsSync(LAB_DATA)) {
  const dataSrc = readFileSync(LAB_DATA, 'utf8');
  const known = new Set(routes.map(r => r.path));
  for (const m of dataSrc.matchAll(/['"](\/[^'"]*)['"]/g)) {
    if (!known.has(m[1])) routes.push({ path: m[1], match: 'registry' });
  }
  routes.sort((a, b) => a.path.localeCompare(b.path));
}
const labRoutes = routes.filter(r => !KEPT_ROUTES.has(r.path));
const keptRoutes = routes.filter(r => KEPT_ROUTES.has(r.path));
const { referenced, dynamicPrefixes, srcToDevPublic } = collectPublicRefs();

const publicFiles = walkPublic();
const orphans = publicFiles
  .filter(f => !referenced.has(f.path)
    && ![...dynamicPrefixes].some(dp => f.path.startsWith(dp)))
  .map(f => ({ path: f.path, bytes: f.bytes }))
  .sort((a, b) => b.bytes - a.bytes);

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
  if (!same) { console.error('[deploy-manifest] DRIFT: rigenera con deployManifest.mjs'); process.exit(1); }
  console.log('[deploy-manifest] OK: committato == rigenerato');
  process.exit(0);
}

writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2) + '\n');
const mb = (b) => `${(b / 1048576).toFixed(1)} MB`;
console.log(`[deploy-manifest] profile=${profile}`);
console.log(`  routes: ${routes.length} totali, kept=${keptRoutes.length}, lab=${labRoutes.length}`);
console.log(`  public: ${publicFiles.length} file, refs=${referenced.size}, orphans=${orphans.length} (${mb(manifest.public.orphanBytes)})`);
console.log(`  dynamicPrefixes=${dynamicPrefixes.size}, srcToDevPublic refs=${srcToDevPublic.length}`);
console.log(`  → ${relative(ROOT, MANIFEST_PATH)}`);
