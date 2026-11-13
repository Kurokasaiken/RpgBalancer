#!/usr/bin/env node
/**
 * assertDeployShape.mjs — PLAN-118 T-4: gate meccanico post `build:deploy`.
 *
 * Fallisce (exit 1) se in `dist` slim:
 *  - esistono directory dev-only (mockups/, dev-public/, …);
 *  - un `moduleIds` di pagina lab appare in un chunk (manifest moduleIds,
 *    non basename — correzione dibattito);
 *  - manca il manifest moduli o i chunk delle route kept;
 *  - il manifest precache SW contiene immagini fuori whitelist icone;
 *  - un `?raw` import del grafo kept è coperto da `.vercelignore`;
 *  - un file NON-lab di src/ referenzia `dev-public/` (kept→dev-public);
 *  - il deploy-manifest committato non coincide col rigenerato;
 *  - le soglie di deploy-budget.json sono superate (advisory finché !tuned).
 *
 * Uso: node scripts/deploy/assertDeployShape.mjs [--dist dist]
 */
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { execSync } from 'node:child_process';

const ROOT = new URL('../../', import.meta.url).pathname;
const DIST = process.argv.includes('--dist')
  ? process.argv[process.argv.indexOf('--dist') + 1]
  : join(ROOT, 'dist');
const errors = [];
const warnings = [];
const fail = (m) => errors.push(m);
const warn = (m) => warnings.push(m);

// ---- 1. no dev-only dirs ----
const DEV_DIRS = ['mockups', 'lab-fan-mock', 'hud-target', 'fork-mountains',
  'dev-public', 'labs', 'lab-preview', 'example-circle-star', 'spike-land-breath'];
for (const d of DEV_DIRS) {
  if (existsSync(join(DIST, d))) fail(`dir dev-only presente in dist: ${d}/`);
}

// ---- 2. moduleIds lab assenti dai chunk (manifest) ----
const modManifest = join(DIST, '.vite/manifest.json');
if (!existsSync(modManifest)) {
  fail('dist/.vite/manifest.json mancante (build fatta senza VITE_DEPLOY_SLIM?)');
} else {
  const man = JSON.parse(readFileSync(modManifest, 'utf8'));
  const labSpecs = new Set();
  const labRoutesSrc = readFileSync(join(ROOT, 'src/deploy/labRoutes.ts'), 'utf8');
  for (const m of labRoutesSrc.matchAll(/import\('\.\.\/([^']+)'\)/g)) labSpecs.add(`src/${m[1]}`);
  // I moduli importati ANCHE da App.tsx (tab kept) sono emessi legittimamente.
  const keptSpecs = new Set();
  for (const m of readFileSync(join(ROOT, 'src/App.tsx'), 'utf8').matchAll(/import\('\.?\/?([^']+)'\)/g)) {
    keptSpecs.add(m[1].startsWith('src/') ? m[1] : `src/${m[1]}`);
  }
  for (const key of Object.keys(man)) {
    const norm = key.replace(/^_/, '').replace(/\.(tsx?|jsx?)$/, '');
    for (const spec of labSpecs) {
      const base = spec.replace(/\.(tsx?|jsx?)$/, '');
      if (norm === base && ![...keptSpecs].some(k => norm === k.replace(/\.(tsx?|jsx?)$/, ''))) {
        fail(`modulo lab emesso in un chunk: ${key}`);
      }
    }
  }
}

// ---- 3. chunk kept presenti ----
const assetsDir = join(DIST, 'assets');
const chunks = existsSync(assetsDir) ? readdirSync(assetsDir).filter(f => f.endsWith('.js')) : [];
if (chunks.length === 0) fail('nessun chunk JS emesso');
for (const needle of ['mappa2', 'index']) {
  if (!chunks.some(c => c.toLowerCase().includes(needle))) warn(`chunk kept non trovato per nome: ${needle} (check euristico)`);
}

// ---- 4. precache SW senza immagini fuori whitelist ----
const swPath = join(DIST, 'service-worker.js');
if (existsSync(swPath)) {
  const sw = readFileSync(swPath, 'utf8');
  const entries = sw.match(/url:"[^"]+"/g) ?? [];
  const ICON_ALLOW = /vite\.svg|manifest\.(json|webmanifest)/;
  for (const e of entries) {
    if (/\.(png|jpe?g|webp|avif|gif|svg)/i.test(e) && !ICON_ALLOW.test(e)) {
      fail(`precache contiene immagine fuori whitelist: ${e}`);
    }
  }
}

// ---- 5. ?raw non coperti da .vercelignore ----
const RAW_IMPORTS = ['src/docs/plans/art_direction_plan.md', 'src/docs/prompts/prompt_library.md'];
if (existsSync(join(ROOT, '.vercelignore'))) {
  const pats = readFileSync(join(ROOT, '.vercelignore'), 'utf8').split('\n')
    .map(l => l.trim()).filter(l => l && !l.startsWith('#'));
  for (const raw of RAW_IMPORTS) {
    for (const p of pats) {
      const dir = p.replace(/\/$/, '');
      if (raw === dir || raw.startsWith(dir + '/')) fail(`.vercelignore copre un ?raw import: ${p} → ${raw}`);
    }
  }
}

// ---- 6. kept→dev-public refs (fail solo da file non-lab) ----
const manifest = JSON.parse(readFileSync(join(ROOT, 'deploy-manifest.json'), 'utf8'));
const labModuleDirs = [];
for (const m of readFileSync(join(ROOT, 'src/deploy/labRoutes.ts'), 'utf8')
  .matchAll(/import\('\.\.\/([^']+)'\)/g)) {
  labModuleDirs.push(`src/${m[1]}`); // copre file .tsx E subtree (spikes/ ecc.)
}
const isLabFile = (f) => labModuleDirs.some(d => f === `${d}.tsx` || f === `${d}.ts` || f.startsWith(`${d}/`));
for (const ref of manifest.public.srcToDevPublicRefs ?? manifest.public.keptToDevPublicRefs ?? []) {
  if (!isLabFile(ref.file)) fail(`riferimento a dev-public da file non-lab: ${ref.file} → ${ref.path}`);
}

// ---- 7. drift manifest ----
try {
  execSync(`node ${join(ROOT, 'scripts/deploy/deployManifest.mjs')} --profile slim --check`, { stdio: 'pipe' });
} catch {
  fail('deploy-manifest.json in drift (rigenera con deployManifest.mjs)');
}

// ---- 8. budget (advisory fino a tuned) ----
const dirBytes = (dir) => {
  let t = 0;
  const walk = (d) => { for (const n of readdirSync(d)) { const a = join(d, n); const s = statSync(a); if (s.isDirectory()) walk(a); else t += s.size; } };
  walk(dir); return t;
};
const distBytes = existsSync(DIST) ? dirBytes(DIST) : 0;
const budget = JSON.parse(readFileSync(join(ROOT, 'deploy-budget.json'), 'utf8'));
if (budget.tuned && budget.distMaxBytes && distBytes > budget.distMaxBytes) {
  fail(`dist ${(distBytes / 1048576).toFixed(1)} MB > budget ${(budget.distMaxBytes / 1048576).toFixed(1)} MB`);
} else {
  warn(`dist = ${(distBytes / 1048576).toFixed(1)} MB (budget ${budget.tuned ? 'OK' : 'advisory — da tarare in T-6'})`);
}

if (warnings.length) console.warn(warnings.map(w => `  ⚠ ${w}`).join('\n'));
if (errors.length) {
  console.error(`[assertDeployShape] ${errors.length} FAIL:`);
  for (const e of errors) console.error(`  ✗ ${e}`);
  process.exit(1);
}
console.log(`[assertDeployShape] PASS — dist=${(distBytes / 1048576).toFixed(1)} MB, ${chunks.length} chunk JS, precache senza immagini fuori whitelist`);
