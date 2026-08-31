#!/usr/bin/env node
/**
 * PLAN-010 CP-A — snapshot della V6.2.
 *
 * Serve a una cosa sola: quando in V6.3 un numero cambiera', poter dimostrare che
 * la V6.2 NON e' cambiata. Non e' un test di stile: e' l'ancora contro cui CP-I
 * certifichera' il delta.
 *
 *   node scripts/astrolabe/v63-baseline.mjs          # scrive la baseline
 *   node scripts/astrolabe/v63-baseline.mjs --check  # verifica e esce !=0 se differisce
 */
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

/* `import.meta.dirname` esiste solo da Node 20.11: su Node 16 vale `undefined` e
   `resolve` lancia. Lo script moriva invece di verificare, e una verifica che
   esplode e' peggio di nessuna verifica — sembra passata se non si guarda. */
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const OUT = resolve(ROOT, '.mw/baselines/v62-source.json');

/** I file che definiscono il comportamento della V6.2. */
const TRACKED = [
  'src/ui/idleVillage/components/destinyAstrolabeV62/engine.ts',
  'src/ui/idleVillage/components/destinyAstrolabeV62/DestinyAstrolabeV62.tsx',
  'src/ui/idleVillage/components/destinyAstrolabeV62/tarGooRenderer.ts',
  'src/ui/idleVillage/components/destinyAstrolabeV62/tentacles.ts',
  'src/ui/idleVillage/frozen/kits/destinyAstrolabeV62Kit.tsx',
  'src/pages/minimal-destiny-astrolabe-v6-2.tsx',
];

const sha = (p) => createHash('sha256').update(readFileSync(resolve(ROOT, p))).digest('hex');

const current = Object.fromEntries(TRACKED.map((p) => [p, sha(p)]));
const check = process.argv.includes('--check');

if (!check) {
  writeFileSync(OUT, `${JSON.stringify({ files: current }, null, 2)}\n`);
  console.log(`baseline scritta: ${OUT}`);
  for (const [p, h] of Object.entries(current)) console.log(`  ${h.slice(0, 12)}  ${p}`);
  process.exit(0);
}

if (!existsSync(OUT)) {
  console.error('nessuna baseline: esegui prima senza --check');
  process.exit(2);
}

const { files: baseline } = JSON.parse(readFileSync(OUT, 'utf8'));
const drift = TRACKED.filter((p) => baseline[p] !== current[p]);

if (drift.length === 0) {
  console.log(`V6.2 invariata — ${TRACKED.length} file verificati`);
  process.exit(0);
}

console.error('V6.2 E\' CAMBIATA. La pagina di confronto non e\' piu\' un riferimento:');
for (const p of drift) console.error(`  ${p}\n    baseline ${baseline[p]?.slice(0, 12)} -> attuale ${current[p].slice(0, 12)}`);
process.exit(1);
