#!/usr/bin/env node
/**
 * Sliceability gate — Passo 1ter dello standard SLICEKIT.
 *
 * Esegue `npx -y slicewright inspect` sull'immagine sorgente di una spec
 * slice-kit (o direttamente su un PNG) e riporta gli span stirabili, gli
 * inset rilevati e i findings (smearing, cuciture, bordi ripetuti,
 * padding-contenuto) PRIMA del taglio — il controllo che nel pilota
 * Roster/Stash mancato è costato ~6 respingimenti sugli angoli
 * (2026-11-19, T-32).
 *
 * Uso:
 *   node scripts/hud-real/sliceability-gate.mjs <spec.json|image.png>
 *   node scripts/hud-real/sliceability-gate.mjs spec.json --out review-bundle/gate.json
 *
 * Exit code: 0 nessun finding di livello warning/error · 1 findings presenti ·
 * 2 input/usage failure. I finding vanno annotati nel review bundle della
 * superficie ([P8]): la decisione (inset autoriali / segmenti fissi /
 * rigenerazione) resta umana — questo è un gate informativo, non un veto.
 */
import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, isAbsolute, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');

function usage(msg) {
  if (msg) console.error(msg);
  console.error(
    'uso: sliceability-gate.mjs <spec.json|image.png> [--out <file.json>] [-- --slicewright-args...]',
  );
  process.exit(2);
}

const argv = process.argv.slice(2);
const extraIdx = argv.indexOf('--');
const extra = extraIdx >= 0 ? argv.slice(extraIdx + 1) : [];
const own = extraIdx >= 0 ? argv.slice(0, extraIdx) : argv;
const input = own.find((a) => !a.startsWith('--'));
const outIdx = own.indexOf('--out');
const outPath = outIdx >= 0 ? own[outIdx + 1] : null;
if (!input) usage('manca input');

let imagePath = input;
if (/\.json$/i.test(input)) {
  const specPath = isAbsolute(input) ? input : join(REPO_ROOT, input);
  let spec;
  try {
    spec = JSON.parse(readFileSync(specPath, 'utf8'));
  } catch (e) {
    usage(`spec illeggibile: ${specPath} (${e.message})`);
  }
  const src = spec?.source?.path;
  if (!src) usage(`spec senza source.path: ${specPath}`);
  imagePath = src;
}
const absImage = isAbsolute(imagePath) ? imagePath : join(REPO_ROOT, imagePath);

const run = spawnSync(
  'npx',
  ['-y', 'slicewright', 'inspect', absImage, ...extra],
  { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 },
);
if (run.error) {
  console.error(`slicewright non eseguito: ${run.error.message}`);
  process.exit(2);
}
if (run.status === 2) {
  console.error(run.stderr || 'slicewright: input/usage failure');
  process.exit(2);
}
let report;
try {
  report = JSON.parse(run.stdout);
} catch {
  console.error('output slicewright non-JSON:');
  console.error((run.stdout || '').slice(0, 2000), run.stderr || '');
  process.exit(2);
}
if (outPath) {
  const absOut = isAbsolute(outPath) ? outPath : join(REPO_ROOT, outPath);
  mkdirSync(dirname(absOut), { recursive: true });
  writeFileSync(absOut, JSON.stringify(report, null, 2) + '\n');
}

const findings = report.findings ?? [];
const blocking = findings.filter(
  (f) => f.severity === 'warning' || f.severity === 'error',
);
const ins = report.insets ?? {};
const stretchOf = (axis) =>
  (report.layout?.[axis]?.segments ?? [])
    .filter((s) => s.kind === 'stretch')
    .map((s) => s.end - s.start);

console.log(`sliceability-gate: ${absImage}`);
console.log(
  `  mode=${report.mode} insets(l,r,t,b)=${ins.left},${ins.right},${ins.top},${ins.bottom}` +
    ` stretchX=[${stretchOf('x')}] stretchY=[${stretchOf('y')}]` +
    ` minSize=${report.minSize?.width}x${report.minSize?.height}`,
);
if (findings.length === 0) {
  console.log('  findings: nessuno');
} else {
  for (const f of findings) {
    console.log(`  [${f.severity}] ${f.code}: ${f.message}`);
  }
}
if (outPath) console.log(`  report → ${outPath}`);
process.exit(blocking.length > 0 ? 1 : 0);
