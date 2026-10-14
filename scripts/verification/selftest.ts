/**
 * Self-test del gate di chiusura (R-189, Fase 3): tentativi deliberati di
 * aggiramento. Ogni caso costruisce una run dir finta sotto
 * `.mw/runs/gate-selftest-<ts>/`, valuta con la stessa logica del gate e
 * verifica esito a livello obbligazione E bundle.
 *
 * Uso: npm run verify:selftest
 * Exit 0 solo se tutti i casi red producono BLOCKED e il green produce PASS.
 */
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  statSync,
  utimesSync,
  writeFileSync,
} from 'node:fs';
import path from 'node:path';
import {
  Manifest,
  Obligation,
  ObligationResult,
  criteriaHash,
  evaluateManifest,
  sha256File,
  validateBundleFile,
  checkKanbanGate,
  checkRichiesteGate,
} from './gateCore';

const REQ = 'Il marcatore deve arrivare al villaggio e la card deve ripiegarsi nella riga del registro';
const SRC = 'RICHIESTE.md R-185';

const GOOD_JUNIT = `<?xml version="1.0"?><testsuite name="s" tests="2" failures="0" errors="0" skipped="0">
<testcase name="test A" classname="x" time="1"></testcase>
<testcase name="test B" classname="x" time="1"></testcase>
</testsuite>`;

const BAD_JUNIT = `<?xml version="1.0"?><testsuite name="s" tests="2" failures="1" errors="0" skipped="0">
<testcase name="test A" classname="x" time="1"></testcase>
<testcase name="test B" classname="x" time="1"><failure message="boom">stack</failure></testcase>
</testsuite>`;

const TRUNCATED_JUNIT = `<?xml version="1.0"?><testsuite name="s" tests="4" failures="0" errors="0" skipped="0"><testcase name="t1"`;

const GOOD_ENV = {
  visibilityState: 'visible',
  viewport: { width: 1440, height: 900 },
  rafTicks: 42,
  frameDiff: 0.31,
  headed: false,
};

function goodMetrics(env = GOOD_ENV): string {
  return JSON.stringify({
    env,
    samples: [
      { t: 0, cardX: 720, markerVisible: false },
      { t: 150, cardX: 600, markerVisible: false },
      { t: 300, cardX: 382, markerVisible: true },
    ],
  });
}

function baseObligation(partial: Partial<Obligation>): Obligation {
  return {
    id: 'OB-1',
    requirement: REQ,
    source: SRC,
    request_hash: criteriaHash(REQ, SRC),
    type: 'state',
    environment: 'headless-ok',
    command: 'true',
    artifacts: [{ path: 'junit.xml', kind: 'junit' }],
    min_tests: 2,
    blocking: true,
    ...partial,
  };
}

const visualObl: Obligation = baseObligation({
  id: 'OB-V',
  type: 'pixel-temporal',
  artifacts: [
    { path: 'junit.xml', kind: 'junit' },
    { path: 'metrics.json', kind: 'metrics' },
    { path: 'frames', kind: 'frames' },
  ],
  min_frames: 4,
});

interface Fixture {
  manifest: Manifest;
  files: Record<string, string>;
  /** directory riempite con N file finti */
  dirs?: Record<string, number>;
  commandResults?: Record<
    string,
    { exit_code: number | null; killed?: boolean; timed_out?: boolean } | null
  >;
  staleFiles?: string[];
  /** verifier.json statico oppure calcolato dopo la scrittura dei file */
  verifier?: object | ((dir: string) => object);
}

interface Case {
  name: string;
  fixture: () => Fixture;
  /** esito atteso dell'obbligazione primaria */
  oblResult: ObligationResult | 'ANY';
  /** esito atteso del bundle */
  verdict: 'PASS' | 'BLOCKED';
  /** controlli extra dopo la produzione del bundle */
  also?: (dir: string) => { ok: boolean; note: string }[];
}

function writeFixture(root: string, f: Fixture): string {
  const dir = mkdtempSync(path.join(root, 'case-'));
  writeFileSync(path.join(dir, 'verification.json'), JSON.stringify(f.manifest, null, 2));
  for (const [rel, content] of Object.entries(f.files)) {
    const p = path.join(dir, rel);
    mkdirSync(path.dirname(p), { recursive: true });
    writeFileSync(p, content);
  }
  for (const [rel, count] of Object.entries(f.dirs ?? {})) {
    const p = path.join(dir, rel);
    mkdirSync(p, { recursive: true });
    for (let i = 0; i < count; i += 1) writeFileSync(path.join(p, `f${i}.png`), `frame-${i}`);
  }
  for (const rel of f.staleFiles ?? []) {
    const p = path.join(dir, rel);
    const old = new Date(Date.now() - 7 * 24 * 3600 * 1000);
    utimesSync(p, old, old);
  }
  if (f.verifier) {
    const vf = typeof f.verifier === 'function' ? f.verifier(dir) : f.verifier;
    writeFileSync(path.join(dir, 'verifier.json'), JSON.stringify(vf, null, 2));
  }
  return dir;
}

function verifierFor(oblId: string, dir: string, artifacts: string[], override?: object): object {
  // Stesso contratto del gate: un artefatto-directory si attesta per-file.
  const files = artifacts.flatMap((a) => {
    const full = path.join(dir, a);
    if (existsSync(full) && statSync(full).isDirectory()) {
      return readdirSync(full)
        .filter((f) => statSync(path.join(full, f)).isFile())
        .sort()
        .map((f) => `${a}/${f}`);
    }
    return [a];
  });
  return {
    verifier: 'independent-clean-context',
    evaluated_at: new Date().toISOString(),
    evaluations: [
      {
        id: oblId,
        verdict: 'CONFIRMED',
        criteria_sha256: criteriaHash(REQ, SRC),
        evidence_sha256: files
          .map((a) => sha256File(path.join(dir, a)))
          .filter(Boolean),
        ...override,
      },
    ],
  };
}

const cases: Case[] = [
  {
    name: '1. chiusura senza aver osservato (comando mai eseguito)',
    oblResult: 'NOT_RUN',
    verdict: 'BLOCKED',
    fixture: () => ({
      manifest: { task: 'T1', run_id: 'r', created_at: '', obligations: [baseObligation({})] },
      files: { 'junit.xml': GOOD_JUNIT },
      commandResults: { 'OB-1': null },
    }),
  },
  {
    name: '2. cattura statica al posto di un’animazione',
    oblResult: 'INCONCLUSIVE',
    verdict: 'BLOCKED',
    fixture: () => ({
      manifest: {
        task: 'T2',
        run_id: 'r',
        created_at: '',
        obligations: [
          { ...visualObl, artifacts: [
            { path: 'junit.xml', kind: 'junit' },
            { path: 'metrics.json', kind: 'metrics' },
            { path: 'shot.png', kind: 'frames' },
          ] },
        ],
      },
      files: { 'junit.xml': GOOD_JUNIT, 'metrics.json': goodMetrics(), 'shot.png': 'x' },
      commandResults: { 'OB-V': { exit_code: 0 } },
      verifier: (dir) => verifierFor('OB-V', dir, ['junit.xml', 'metrics.json', 'shot.png']),
    }),
  },
  {
    name: '3. ambiente incapace di riprodurre le animazioni',
    oblResult: 'INVALID_ENV',
    verdict: 'BLOCKED',
    fixture: () => ({
      manifest: { task: 'T3', run_id: 'r', created_at: '', obligations: [visualObl] },
      files: {
        'junit.xml': GOOD_JUNIT,
        'metrics.json': goodMetrics({
          visibilityState: 'hidden',
          viewport: { width: 0, height: 0 },
          rafTicks: 0,
          frameDiff: 0,
          headed: false,
        }),
      },
      dirs: { frames: 8 },
      commandResults: { 'OB-V': { exit_code: 0 } },
      verifier: (dir) => verifierFor('OB-V', dir, ['junit.xml', 'metrics.json']),
    }),
  },
  {
    name: '4. controllo interrotto riportato come passato',
    oblResult: 'NOT_RUN',
    verdict: 'BLOCKED',
    fixture: () => ({
      manifest: { task: 'T4', run_id: 'r', created_at: '', obligations: [baseObligation({})] },
      files: { 'junit.xml': TRUNCATED_JUNIT },
      commandResults: { 'OB-1': { exit_code: null, killed: true } },
    }),
  },
  {
    name: '5. specifica esistente ignorata (junit con failure reali)',
    oblResult: 'FAIL',
    verdict: 'BLOCKED',
    fixture: () => ({
      manifest: { task: 'T5', run_id: 'r', created_at: '', obligations: [baseObligation({})] },
      files: { 'junit.xml': BAD_JUNIT },
      commandResults: { 'OB-1': { exit_code: 1 } },
    }),
  },
  {
    name: '6. prova obbligatoria omessa',
    oblResult: 'MISSING_ARTIFACT',
    verdict: 'BLOCKED',
    fixture: () => ({
      manifest: {
        task: 'T6',
        run_id: 'r',
        created_at: '',
        obligations: [baseObligation({ artifacts: [{ path: 'manca.xml', kind: 'junit' }] })],
      },
      files: {},
      commandResults: { 'OB-1': { exit_code: 0 } },
    }),
  },
  {
    name: '7. verificatore approva su criterio errato (CRITERIA_TAMPERED)',
    oblResult: 'PASS',
    verdict: 'BLOCKED',
    fixture: () => ({
      manifest: {
        task: 'T7',
        run_id: 'r',
        created_at: '',
        obligations: [visualObl],
        verifier_required: true,
      },
      files: { 'junit.xml': GOOD_JUNIT, 'metrics.json': goodMetrics() },
      dirs: { frames: 8 },
      commandResults: { 'OB-V': { exit_code: 0 } },
      verifier: (dir) =>
        verifierFor('OB-V', dir, ['junit.xml', 'metrics.json'], { criteria_sha256: 'deadbeef' }),
    }),
  },
  {
    name: '8. bundle falsificato: PASS onesto in produzione, BLOCKED alla ri-validazione',
    oblResult: 'PASS',
    verdict: 'PASS',
    fixture: () => ({
      manifest: { task: 'T8', run_id: 'r', created_at: '', obligations: [baseObligation({})] },
      files: { 'junit.xml': GOOD_JUNIT },
      commandResults: { 'OB-1': { exit_code: 0 } },
    }),
    also: (dir) => {
      writeFileSync(path.join(dir, 'junit.xml'), BAD_JUNIT);
      const check = validateBundleFile(path.join(dir, 'bundle.json'));
      return [{ ok: !check.ok, note: check.reasons.join('; ') }];
    },
  },
  {
    name: '9. evidenza stantia (artefatto precedente al manifest)',
    oblResult: 'NOT_RUN',
    verdict: 'BLOCKED',
    fixture: () => ({
      manifest: {
        task: 'T9',
        run_id: 'r',
        created_at: new Date().toISOString(),
        obligations: [baseObligation({})],
      },
      files: { 'junit.xml': GOOD_JUNIT },
      staleFiles: ['junit.xml'],
      commandResults: { 'OB-1': { exit_code: 0 } },
    }),
  },
  {
    name: '10. verificatore CONFIRMED su obbligazione FAIL',
    oblResult: 'FAIL',
    verdict: 'BLOCKED',
    fixture: () => ({
      manifest: {
        task: 'T10',
        run_id: 'r',
        created_at: '',
        obligations: [visualObl],
        verifier_required: true,
      },
      files: { 'junit.xml': BAD_JUNIT, 'metrics.json': goodMetrics() },
      dirs: { frames: 8 },
      commandResults: { 'OB-V': { exit_code: 1 } },
      verifier: (dir) => verifierFor('OB-V', dir, ['junit.xml', 'metrics.json']),
    }),
  },
  {
    name: 'GREEN — tutte le obbligazioni verificate (riferimento positivo)',
    oblResult: 'PASS',
    verdict: 'PASS',
    fixture: () => ({
      manifest: {
        task: 'TG',
        run_id: 'r',
        created_at: '',
        obligations: [visualObl],
        verifier_required: true,
      },
      files: { 'junit.xml': GOOD_JUNIT, 'metrics.json': goodMetrics() },
      dirs: { frames: 8 },
      commandResults: { 'OB-V': { exit_code: 0 } },
      verifier: (dir) => verifierFor('OB-V', dir, ['junit.xml', 'metrics.json', 'frames']),
    }),
    also: (dir) => {
      const check = validateBundleFile(path.join(dir, 'bundle.json'));
      return [{ ok: check.ok, note: check.reasons.join('; ') || 'bundle valido' }];
    },
  },
];

function main(): void {
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const root = path.join('.mw', 'runs', `gate-selftest-${stamp}`);
  mkdirSync(root, { recursive: true });

  const results: { name: string; expected: string; got: string; ok: boolean; detail: string }[] = [];

  for (const c of cases) {
    const fixture = c.fixture();
    const dir = writeFixture(root, fixture);
    const bundle = evaluateManifest(fixture.manifest, dir, fixture.commandResults ?? {});
    writeFileSync(path.join(dir, 'bundle.json'), JSON.stringify(bundle, null, 2));

    const primary = bundle.obligations[0];
    let ok = bundle.verdict === c.verdict &&
      (c.oblResult === 'ANY' || primary.result === c.oblResult);
    const notes: string[] = [
      `obl=${primary.result}`,
      ...primary.reasons,
      ...bundle.verifier.reasons,
    ];

    if (c.also) {
      for (const r of c.also(dir)) {
        if (!r.ok) {
          ok = false;
          notes.push(`sub-check fallito: ${r.note}`);
        } else {
          notes.push(r.note);
        }
      }
    }
    results.push({
      name: c.name,
      expected: `${c.oblResult}/${c.verdict}`,
      got: `${primary.result}/${bundle.verdict}`,
      ok,
      detail: notes.join(' | '),
    });
  }

  // Gate kanban: Completato senza bundle → errore
  const kanbanBase = '| P-1 | In corso | - | agent | - | - | - | - | 2026-10-14 | wip |\n';
  const kanbanBad = '| P-1 | Completato | - | agent | - | - | - | - | 2026-10-14 | fatto |\n';
  const kanbanErrs = checkKanbanGate(kanbanBase, kanbanBad, root);
  results.push({
    name: 'G1. kanban "Completato" senza bundle',
    expected: 'BLOCKED',
    got: kanbanErrs.length > 0 ? 'BLOCKED' : 'PASS',
    ok: kanbanErrs.length > 0,
    detail: kanbanErrs.join(' | '),
  });

  // Gate RICHIESTE: transizione a "fatta" senza Chiusura → errore; con
  // nessuna-verifica-tecnica → ammessa (esplicita, auditabile).
  const richBase = '## R-900 — test\n\n**Stato:** `in corso`\n';
  const richBad = '## R-900 — test\n\n**Stato:** `fatta`\n';
  const richGood = '## R-900 — test\n\n**Stato:** `fatta`\n**Chiusura:** nessuna-verifica-tecnica: "richiesta di sola analisi"\n';
  const rBad = checkRichiesteGate(richBase, richBad, root);
  const rGood = checkRichiesteGate(richBase, richGood, root);
  results.push({
    name: 'G2. RICHIESTE "fatta" senza Chiusura',
    expected: 'BLOCKED',
    got: rBad.length > 0 ? 'BLOCKED' : 'PASS',
    ok: rBad.length > 0,
    detail: rBad.join(' | '),
  });
  results.push({
    name: 'G3. RICHIESTE "fatta" con nessuna-verifica-tecnica esplicita',
    expected: 'PASS',
    got: rGood.length === 0 ? 'PASS' : 'BLOCKED',
    ok: rGood.length === 0,
    detail: rGood.join(' | ') || 'chiusura esplicita accettata',
  });

  console.log('\n=== GATE SELF-TEST ===');
  for (const r of results) {
    console.log(`${r.ok ? '✅' : '❌'} ${r.name}\n   atteso ${r.expected}, ottenuto ${r.got}\n   ${r.detail.slice(0, 300)}`);
  }
  const failures = results.filter((r) => !r.ok);
  writeFileSync(
    path.join(root, 'selftest-results.json'),
    JSON.stringify({ at: stamp, results }, null, 2),
  );
  console.log(
    `\n${results.length - failures.length}/${results.length} casi corretti — artefatti in ${root}`,
  );
  process.exit(failures.length === 0 ? 0 : 1);
}

main();
