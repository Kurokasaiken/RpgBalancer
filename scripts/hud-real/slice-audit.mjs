#!/usr/bin/env node
/**
 * slice:audit — audit delle ricevute di una superficie slice-kit
 * (SLICEKIT Passo 7bis, PLAN-127 OB-12).
 *
 * Rende visibili i passi saltati della pipeline mockup→componente: legge il
 * record `test-results/slicekit/<surface>.json` e il journal append-only
 * `<surface>.journal.jsonl`, verifica che ogni passo abbia la sua ricevuta
 * (evidenza prodotta dal tool, non attestazione), che le ricevute non siano
 * stale (hash input/spec/tool ≠ valore corrente) e che la copertura della
 * matrice probe raggiunga il minimo di profilo [P9].
 *
 * Uso:
 *   npm run slice:audit -- <surface> [--record <file>] [--journal <file>] [--json]
 *
 * Exit code: 0 tutte le ricevute a posto · 1 almeno un FAIL · 2 usage.
 * Le ricevute `declared:` contano come presenti solo se portano `evidence`
 * (file o finding verificabile) — fermano gli skip, non il sabotaggio
 * (boundary dichiarato nel piano).
 */
import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, isAbsolute, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const PROFILE_PATH = join(REPO_ROOT, 'context', 'mockup-pipeline-profile.md');
const TRIPWIRE_PATCH_LIMIT = 3;

const argv = process.argv.slice(2);
const surface = argv.find((a) => !a.startsWith('--'));
const flag = (name) => {
  const i = argv.indexOf(name);
  return i >= 0 ? argv[i + 1] : null;
};
const asJson = argv.includes('--json');
if (!surface) {
  console.error('uso: slice-audit.mjs <surface> [--record <f>] [--journal <f>] [--json]');
  process.exit(2);
}
const recordPath = flag('--record')
  ? resolve(REPO_ROOT, flag('--record'))
  : join(REPO_ROOT, 'test-results', 'slicekit', `${surface}.json`);
const journalPath = flag('--journal')
  ? resolve(REPO_ROOT, flag('--journal'))
  : join(REPO_ROOT, 'test-results', 'slicekit', `${surface}.journal.jsonl`);
const manifestPath = flag('--manifest')
  ? resolve(REPO_ROOT, flag('--manifest'))
  : join(REPO_ROOT, 'public', 'assets', 'ui', 'hud-real', 'slicekit',
    surface, `${surface}Frame.json`);

const sha12 = (p) =>
  createHash('sha256').update(readFileSync(p)).digest('hex').slice(0, 12);
const rel = (p) => (isAbsolute(p) ? p.slice(REPO_ROOT.length + 1) : p);

// ---------------------------------------------------------------- matrix
// Il minimo di matrice vive nel profilo [P9] come blocco ```json
// `matrixMin` — machine-readable così l'audit non duplica la regola.
function matrixMin() {
  try {
    const md = readFileSync(PROFILE_PATH, 'utf8');
    const m = md.match(/```json\s*matrixMin\s*([\s\S]*?)```/);
    if (!m) return null;
    return JSON.parse(m[1]);
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------- journal
function readJournal() {
  if (!existsSync(journalPath)) return [];
  return readFileSync(journalPath, 'utf8')
    .split('\n').filter(Boolean)
    .map((l) => { try { return JSON.parse(l); } catch { return null; } })
    .filter(Boolean);
}

// ---------------------------------------------------------------- checks
const results = [];
const check = (id, verdict, detail) =>
  results.push({ id, verdict, detail }); // verdict: pass | fail | declared

function checkReceipt(name, receipt, { tool = false } = {}) {
  if (receipt == null) {
    check(name, 'fail', 'ricevuta mancante');
    return null;
  }
  if (typeof receipt !== 'object') {
    check(name, 'fail',
      `ricevuta non strutturata (${JSON.stringify(receipt).slice(0, 50)}) — ` +
      'serve oggetto con evidenza, vedi Passo 7bis');
    return null;
  }
  if (receipt.declared === true) {
    if (!receipt.evidence) {
      check(name, 'fail', 'ricevuta declared: senza campo `evidence`');
      return null;
    }
    check(name, 'declared', `declared con evidenza: ${String(receipt.evidence).slice(0, 80)}`);
    return receipt;
  }
  // ricevuta tool-written: verifica anti-staleness sui campi hash presenti
  const stale = [];
  if (receipt.inputSha && receipt.input) {
    const p = join(REPO_ROOT, receipt.input);
    stale.push(...(existsSync(p) && sha12(p) !== receipt.inputSha
      ? [`inputSha≠${receipt.input} (golden cambiato dopo la ricevuta)`] : []));
    if (!existsSync(p)) stale.push(`input mancante: ${receipt.input}`);
  }
  if (receipt.specHash && receipt.spec) {
    const p = join(REPO_ROOT, receipt.spec);
    stale.push(...(existsSync(p) && sha12(p) !== receipt.specHash
      ? [`specHash≠${receipt.spec}`] : []));
    if (!existsSync(p)) stale.push(`spec mancante: ${receipt.spec}`);
  }
  if (receipt.toolSha && receipt.tool) {
    const toolAbs = join(REPO_ROOT, 'scripts', 'hud-real', receipt.tool);
    if (existsSync(toolAbs) && sha12(toolAbs) !== receipt.toolSha) {
      stale.push(`toolVersion≠${receipt.tool} (logica del tool cambiata)`);
    }
  }
  if (receipt.exitCode === 2) stale.push('ricevuta con exitCode=2 (tool fallito)');
  if (stale.length) {
    check(name, 'fail', `stale: ${stale.join('; ')}`);
    return null;
  }
  check(name, tool ? 'pass' : 'declared',
    receipt.at ? `ricevuta tool ${receipt.at.slice(0, 19)}` : 'ricevuta presente');
  return receipt;
}

// ------------------------------------------------------------------ main
const record = existsSync(recordPath)
  ? JSON.parse(readFileSync(recordPath, 'utf8'))
  : null;
const journal = readJournal();
const min = matrixMin();

if (!record) {
  console.log(`✗ record: ${rel(recordPath)} mancante — nessun passo della pipeline registrato`);
  if (asJson) console.log(JSON.stringify({ surface, results: [{ id: 'record', verdict: 'fail' }] }));
  process.exit(1);
}

// 1 — golden selezionato e verificabile (declared con hash → verificato)
if (record.golden?.sha256 && record.golden?.path) {
  const p = join(REPO_ROOT, record.golden.path);
  const ok = existsSync(p) &&
    createHash('sha256').update(readFileSync(p)).digest('hex')
      .startsWith(record.golden.sha256.slice(0, 12));
  check('golden', ok ? 'pass' : 'fail',
    ok ? record.golden.path : `sha256 non verificabile su ${record.golden.path}`);
} else {
  check('golden', 'fail', 'record.golden{path,sha256} mancante');
}

// 2 — Passo 1bis slop gate (campo esistente; declared ammesso con evidenza)
checkReceipt('slop_gate_1bis', record.slop_gate_1bis);

// 3 — Passo 1ter gate affettabilità (tool-written, anti-stale)
checkReceipt('sliceability_1ter', record.sliceability_1ter, { tool: true });

// 4 — slicing: manifest generato + source.sha256 del manifest = golden corrente
const manifestRel = rel(manifestPath);
const manifestAbs = manifestPath;
if (existsSync(manifestAbs)) {
  const man = JSON.parse(readFileSync(manifestAbs, 'utf8'));
  const srcSha = man?.source?.sha256;
  const goldenP = record.golden?.path ? join(REPO_ROOT, record.golden.path) : null;
  const ok = srcSha && goldenP && existsSync(goldenP) &&
    createHash('sha256').update(readFileSync(goldenP)).digest('hex') === srcSha;
  check('sliced_manifest', ok ? 'pass' : 'fail',
    ok ? manifestRel : `manifest.source.sha256 ≠ golden corrente (${manifestRel})`);
} else {
  check('sliced_manifest', 'fail', `manifest mancante: ${manifestRel}`);
}

// 5 — seam gate / oracle diff. Il record machine-shape (compare-to-oracle)
// è già evidenza tool-written: `checks[]`+`verdict` in quel formato valgono.
if (record.seam_gate != null) {
  checkReceipt('seam_gate', record.seam_gate);
} else if (Array.isArray(record.checks) && record.verdict) {
  check('seam_gate', 'pass',
    `oracle diff tool-written: verdict=${record.verdict}, ${record.checks.length} checks`);
} else {
  checkReceipt('seam_gate', undefined);
}

// 6 — probe V1/V2/V3 + matrix_coverage vs minimo profilo [P9]
for (const v of ['V1', 'V2', 'V3']) {
  checkReceipt(v, record[v]);
}
if (min) {
  const cov = record.matrix_coverage;
  if (!cov) {
    check('matrix_coverage', 'fail',
      'record.matrix_coverage mancante — la probe non dichiara cosa ha coperto');
  } else {
    const misses = [];
    for (const vp of min.viewports ?? []) {
      if (!(cov.viewports ?? []).includes(vp)) misses.push(`viewport ${vp}`);
    }
    for (const d of min.dprs ?? []) {
      if (!(cov.dprs ?? []).includes(d)) misses.push(`dpr ${d}`);
    }
    for (const c of min.contents ?? []) {
      if (!(cov.contents ?? []).includes(c)) misses.push(`content ${c}`);
    }
    if (min.wkwebview && !cov.wkwebview) misses.push('lane WKWebView');
    check('matrix_coverage', misses.length ? 'fail' : 'pass',
      misses.length ? `sotto il minimo [P9]: ${misses.join(', ')}`
        : 'copertura ≥ minimo [P9]');
  }
} else {
  check('matrix_coverage', 'declared',
    'matrixMin non trovato nel profilo [P9] — copertura non verificabile');
}

// 7 — verdetto umano: declared con evidenza (board/witness). Il `verdict`
// machine-shape è del diff, non del Director — non vale come verdetto umano.
checkReceipt('director_verdict',
  record.director_verdict ?? record.mounted?.verdict);

// 8 — journal: integrità (ogni entry porta provenienza tool verificabile —
// una entry `regenerated` scritta a mano per azzerare il counter è
// journal-tamper, OB-15) + tripwire patch counter (T-32).
const journalBad = journal.filter((e) => {
  if (!e.kind || !e.tool || !e.toolSha) return true;
  const toolAbs = join(REPO_ROOT, 'scripts', 'hud-real', e.tool);
  return existsSync(toolAbs) && sha12(toolAbs) !== e.toolSha;
});
if (journalBad.length > 0) {
  check('journal_integrity', 'fail',
    `${journalBad.length} entry journal senza provenienza tool valida (tamper?)`);
} else {
  check('journal_integrity', 'pass',
    journal.length === 0 ? 'journal assente' : `${journal.length} entry con provenienza`);
}
const patches = journal.reduce((n, e) =>
  e.kind === 'regenerated' ? 0 : e.kind === 'patch' ? n + 1 : n, 0);
if (patches >= TRIPWIRE_PATCH_LIMIT) {
  check('patch_tripwire', 'fail',
    `${patches} patch senza \`regenerated\` nel journal (T-32 ≥${TRIPWIRE_PATCH_LIMIT})`);
} else {
  check('patch_tripwire', 'pass',
    journal.length === 0 ? 'journal assente (0 patch)'
      : `${patches} patch dall'ultimo regenerated`);
}

// --------------------------------------------------------------- report
const fails = results.filter((r) => r.verdict === 'fail');
if (asJson) {
  console.log(JSON.stringify({
    surface, recordPath: rel(recordPath), journalPath: rel(journalPath),
    results, fails: fails.length,
  }, null, 2));
} else {
  console.log(`slice:audit — ${surface}`);
  const icon = { pass: '✓', fail: '✗', declared: '△' };
  for (const r of results) {
    console.log(`  ${icon[r.verdict]} ${r.id.padEnd(20)} ${r.detail ?? ''}`);
  }
  console.log(fails.length
    ? `  ${fails.length} FAIL — pipeline incompleta, la superficie non può chiudere`
    : '  pipeline completa (ricevute `declared` = stop dello skip, non prova)');
}
process.exit(fails.length ? 1 : 0);
