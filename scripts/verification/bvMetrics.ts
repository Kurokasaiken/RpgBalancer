/**
 * bvMetrics — metriche Director-burden della fase BV (PLAN-044 T-007 / S5).
 *
 * Calcola meccanicamente, dai ledger del repo:
 *  - `director_dispositions_per_closure`: (mapping-approvals + director_answers
 *    + gate-file dispositions) / closure — letti da `.mw/mapping-approvals.jsonl`
 *    e `.mw/director-answers.jsonl`; le closure sono i `bundle.json` PASS in
 *    `.mw/runs/` (unità meccanica di chiusura R-208).
 *  - `awaiting_director_wait_minutes`: tempo tra `coverage_exception`
 *    (unverified_behavior) `created_at` e il `director_answer` corrispondente.
 *  - `found-by` trend: distribuzione `agent-bv|director|gate` sui REG in
 *    `.mw/regression/REG-*.md`.
 *  - `zero_defect_closures`: closure la cui finestra non ha prodotto difetti
 *    (REG/.mw/bugs). Invalida SOLO il trend found-by; il denominatore delle
 *    dispositions resta TUTTE le closure.
 *  - seeds dogfood registrati in `.mw/bv-seeds.jsonl` (defect + mis-mapping).
 *
 * Baseline pre-T-003: il confine è il primo director_answer registrato
 * (inizio dell'era delle dispositions). Pre = closure/difetti prima di esso.
 *
 * Criterio di successo CONGIUNTO e anti-gaming (dibattito PLAN-044):
 *   dispositions/closure in trend discendente
 *   AND found-by:director non crescente
 *   AND wait mediana >= floor (sotto floor = flag rubber-stamp, non riduzione)
 *   AND volume minimo: >= 10 closure post-baseline O >= 14 giorni.
 *
 * Uso:
 *   npm run bv:metrics                      → report + scrive .mw/bv-metrics.json
 *   npm run bv:seed -- --kind defect --file <f> --detected-by gate --note "..."
 *   npm run bv:seed -- --kind mismapping --file <f> --detected-by none --note "..."
 *   npm run bv:metrics -- seeds             → lista seed registrati
 */
import { appendFileSync, existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const RUNS_REL = path.join('.mw', 'runs');
const REGRESSION_REL = path.join('.mw', 'regression');
const BUGS_REL = path.join('.mw', 'bugs');
const SEEDS_REL = path.join('.mw', 'bv-seeds.jsonl');
const METRICS_REL = path.join('.mw', 'bv-metrics.json');
const APPROVALS_REL = path.join('.mw', 'mapping-approvals.jsonl');
const ANSWERS_REL = path.join('.mw', 'director-answers.jsonl');
const EXCEPTIONS_REL = path.join('.mw', 'coverage-exceptions.jsonl');

/** Sotto la floor la risposta Director è rubber-stamp, non riduzione di burden. */
export const WAIT_FLOOR_MINUTES = 5;
export const MIN_CLOSURES_FOR_TREND = 10;
export const MIN_DAYS_FOR_TREND = 14;

export interface SeedRecord {
  kind: 'defect' | 'mismapping';
  file: string;
  detected_by: 'gate' | 'agent-bv' | 'director' | 'none';
  seeded_at: string;
  seeded_by?: string;
  note?: string;
}

function readJsonl<T>(filePath: string): T[] {
  if (!existsSync(filePath)) return [];
  return readFileSync(filePath, 'utf8')
    .split('\n')
    .filter((l) => l.trim().startsWith('{'))
    .map((l) => JSON.parse(l) as T);
}

interface Closure {
  run_id: string;
  produced_at: string;
  verdict: string;
}

function loadClosures(repoRoot: string): Closure[] {
  const dir = path.join(repoRoot, RUNS_REL);
  if (!existsSync(dir)) return [];
  const out: Closure[] = [];
  for (const name of readdirSync(dir)) {
    const bp = path.join(dir, name, 'bundle.json');
    if (!existsSync(bp) || !statSync(bp).isFile()) continue;
    try {
      const b = JSON.parse(readFileSync(bp, 'utf8')) as {
        run_id?: string;
        produced_at?: string;
        verdict?: string;
      };
      if (b.verdict === 'PASS' && b.produced_at) {
        out.push({ run_id: b.run_id ?? name, produced_at: b.produced_at, verdict: b.verdict });
      }
    } catch {
      // bundle malformato → ignorato dalla metrica (il gate lo gestisce)
    }
  }
  return out.sort((a, b) => a.produced_at.localeCompare(b.produced_at));
}

interface Timed { at: string }

function loadDispositions(repoRoot: string): Timed[] {
  const approvals = readJsonl<{ approved_at?: string }>(path.join(repoRoot, APPROVALS_REL))
    .filter((a) => a.approved_at)
    .map((a) => ({ at: a.approved_at! }));
  const answers = readJsonl<{ answered_at?: string; kind?: string }>(path.join(repoRoot, ANSWERS_REL))
    .filter((a) => a.answered_at)
    .map((a) => ({ at: a.answered_at! }));
  return [...approvals, ...answers].sort((a, b) => a.at.localeCompare(b.at));
}

interface DefectEvent {
  at: string;
  source: string;
  found_by?: string;
}

const ISO_DATE_RE = /\d{4}-\d{2}-\d{2}/;
const FOUND_BY_RE = /found-by:\**\s*`?([a-zA-Z][\w-]*)/;

function loadDefects(repoRoot: string): { events: DefectEvent[]; foundBy: Record<string, number>; regMissing: number } {
  const events: DefectEvent[] = [];
  const foundBy: Record<string, number> = {};
  let regMissing = 0;
  const regDir = path.join(repoRoot, REGRESSION_REL);
  if (existsSync(regDir)) {
    for (const name of readdirSync(regDir).filter((f) => /^REG-.*\.md$/i.test(f))) {
      const content = readFileSync(path.join(regDir, name), 'utf8');
      const dateMatch = content.match(ISO_DATE_RE);
      const fb = content.match(FOUND_BY_RE)?.[1] ?? null;
      if (fb) foundBy[fb] = (foundBy[fb] ?? 0) + 1;
      else regMissing += 1;
      events.push({
        at: dateMatch ? `${dateMatch[0]}T00:00:00Z` : new Date(statSync(path.join(regDir, name)).mtimeMs).toISOString(),
        source: `${REGRESSION_REL}/${name}`,
        found_by: fb ?? undefined,
      });
    }
  }
  const bugsDir = path.join(repoRoot, BUGS_REL);
  if (existsSync(bugsDir)) {
    for (const name of readdirSync(bugsDir)) {
      const m = name.match(/^(\d{4})-?(\d{2})-?(\d{2})/);
      if (!m) continue;
      events.push({
        at: `${m[1]}-${m[2]}-${m[3]}T00:00:00Z`,
        source: `${BUGS_REL}/${name}`,
      });
    }
  }
  return { events: events.sort((a, b) => a.at.localeCompare(b.at)), foundBy, regMissing };
}

interface WaitSample {
  exception_id: string;
  wait_minutes: number | null; // null = ancora in awaiting
}

function loadWaits(repoRoot: string): WaitSample[] {
  const exceptions = readJsonl<{
    id?: string;
    unverified_behavior?: boolean;
    created_at?: string;
  }>(path.join(repoRoot, EXCEPTIONS_REL));
  const answers = readJsonl<{
    kind?: string;
    exception_id?: string;
    answered_at?: string;
  }>(path.join(repoRoot, ANSWERS_REL));
  const waits: WaitSample[] = [];
  for (const exc of exceptions) {
    if (exc.unverified_behavior !== true || !exc.id || !exc.created_at) continue;
    const ans = answers.find(
      (a) => a.kind === 'coverage_exception' && a.exception_id === exc.id,
    );
    if (!ans?.answered_at) {
      waits.push({ exception_id: exc.id, wait_minutes: null });
      continue;
    }
    waits.push({
      exception_id: exc.id,
      wait_minutes: (Date.parse(ans.answered_at) - Date.parse(exc.created_at)) / 60000,
    });
  }
  return waits;
}

export function loadSeeds(repoRoot: string): SeedRecord[] {
  return readJsonl<SeedRecord>(path.join(repoRoot, SEEDS_REL));
}

function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const s = [...values].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

export interface BvMetrics {
  generated_at: string;
  baseline_boundary: string | null;
  closures: { total: number; pre: number; post: number };
  dispositions: { total: number; pre: number; post: number };
  director_dispositions_per_closure: { pre: number | null; post: number | null };
  awaiting_director_wait_minutes: {
    samples: number;
    pending: number;
    median: number | null;
    max: number | null;
    floor_minutes: number;
  };
  found_by: Record<string, number>;
  reg_without_found_by: number;
  zero_defect_closures: number;
  seeds: { total: number; by_kind: Record<string, number>; by_detected_by: Record<string, number> };
  trend: {
    volume_ok: boolean;
    dispositions_descending: boolean | null;
    foundby_director_non_increasing: boolean | null;
    wait_above_floor: boolean | null;
    verdict: 'ON_TRACK' | 'RUBBER_STAMP_RISK' | 'NOT_IMPROVING' | 'INSUFFICIENT_DATA';
    notes: string[];
  };
}

export function computeBvMetrics(repoRoot: string, opts: { floorMinutes?: number } = {}): BvMetrics {
  const floor = opts.floorMinutes ?? WAIT_FLOOR_MINUTES;
  const closures = loadClosures(repoRoot);
  const dispositions = loadDispositions(repoRoot);
  const { events: defects, foundBy, regMissing } = loadDefects(repoRoot);
  const waits = loadWaits(repoRoot);
  const seeds = loadSeeds(repoRoot);

  // Baseline pre-T-003: primo director_answer = inizio era dispositions.
  const boundary = dispositions.length > 0 ? dispositions[0].at : null;
  const pre = (at: string) => boundary !== null && at < boundary;
  const post = (at: string) => boundary === null || at >= boundary;

  const preClosures = closures.filter((c) => pre(c.produced_at)).length;
  const postClosures = closures.length - preClosures;
  const preDispositions = dispositions.filter((d) => pre(d.at)).length;
  const postDispositions = dispositions.length - preDispositions;

  const perClosure = (disp: number, cls: number) => (cls > 0 ? disp / cls : null);

  // zero_defect_closures: la finestra di una closure va dalla closure
  // precedente alla sua produced_at; difetti = REG + .mw/bugs.
  let zeroDefect = 0;
  let windowStart: string | null = null;
  for (const c of closures) {
    const inWindow = defects.filter(
      (d) => (windowStart === null || d.at > windowStart) && d.at <= c.produced_at,
    );
    if (inWindow.length === 0) zeroDefect += 1;
    windowStart = c.produced_at;
  }

  const waitValues = waits.filter((w) => w.wait_minutes !== null).map((w) => w.wait_minutes!);
  const waitMedian = median(waitValues);
  const pendingWaits = waits.filter((w) => w.wait_minutes === null).length;

  // Trend: volume minimo prima di dichiarare trend.
  const postDays =
    boundary !== null && closures.length > 0
      ? (Date.now() - Date.parse(boundary)) / 86400000
      : 0;
  const volumeOk = postClosures >= MIN_CLOSURES_FOR_TREND || postDays >= MIN_DAYS_FOR_TREND;

  const preRate = perClosure(preDispositions, preClosures);
  const postRate = perClosure(postDispositions, postClosures);
  const dispositionsDescending =
    preRate !== null && postRate !== null ? postRate < preRate : null;

  const directorShare = (list: { at: string; found_by?: string }[]) => {
    const tagged = list.filter((d) => d.found_by);
    if (tagged.length === 0) return null;
    return tagged.filter((d) => d.found_by === 'director').length / tagged.length;
  };
  const preShare = directorShare(defects.filter((d) => pre(d.at)));
  const postShare = directorShare(defects.filter((d) => post(d.at)));
  const foundbyNonIncreasing =
    preShare !== null && postShare !== null ? postShare <= preShare : null;

  const waitAboveFloor = waitMedian !== null ? waitMedian >= floor : null;

  const notes: string[] = [];
  let verdict: BvMetrics['trend']['verdict'];
  if (!volumeOk) {
    verdict = 'INSUFFICIENT_DATA';
    notes.push(
      `volume insufficiente: ${postClosures} closure post-baseline (<${MIN_CLOSURES_FOR_TREND}) e ${postDays.toFixed(1)} giorni (<${MIN_DAYS_FOR_TREND})`,
    );
  } else if (waitAboveFloor === false) {
    verdict = 'RUBBER_STAMP_RISK';
    notes.push(
      `mediana awaiting_director ${waitMedian?.toFixed(1)}min < floor ${floor}min — risposte troppo rapide = flag rubber-stamp, non riduzione di burden`,
    );
  } else if (
    dispositionsDescending === true &&
    (foundbyNonIncreasing === true || foundbyNonIncreasing === null) &&
    waitAboveFloor !== false
  ) {
    verdict = 'ON_TRACK';
    notes.push('dispositions/closure in calo, found-by:director non crescente, wait >= floor');
  } else {
    verdict = 'NOT_IMPROVING';
    notes.push(
      `dispositions/closure ${preRate?.toFixed(2) ?? 'n/a'} → ${postRate?.toFixed(2) ?? 'n/a'}; found-by:director ${preShare?.toFixed(2) ?? 'n/a'} → ${postShare?.toFixed(2) ?? 'n/a'}`,
    );
  }
  if (foundbyNonIncreasing === null) {
    notes.push('found-by:director non misurabile (pochi difetti con found-by — zero_defect_closures alto?)');
  }
  if (pendingWaits > 0) notes.push(`${pendingWaits} coverage_exception in awaiting_director`);

  return {
    generated_at: new Date().toISOString(),
    baseline_boundary: boundary,
    closures: { total: closures.length, pre: preClosures, post: postClosures },
    dispositions: { total: dispositions.length, pre: preDispositions, post: postDispositions },
    director_dispositions_per_closure: { pre: preRate, post: postRate },
    awaiting_director_wait_minutes: {
      samples: waitValues.length,
      pending: pendingWaits,
      median: waitMedian,
      max: waitValues.length ? Math.max(...waitValues) : null,
      floor_minutes: floor,
    },
    found_by: foundBy,
    reg_without_found_by: regMissing,
    zero_defect_closures: zeroDefect,
    seeds: {
      total: seeds.length,
      by_kind: seeds.reduce<Record<string, number>>((a, s) => ({ ...a, [s.kind]: (a[s.kind] ?? 0) + 1 }), {}),
      by_detected_by: seeds.reduce<Record<string, number>>(
        (a, s) => ({ ...a, [s.detected_by]: (a[s.detected_by] ?? 0) + 1 }),
        {},
      ),
    },
    trend: {
      volume_ok: volumeOk,
      dispositions_descending: dispositionsDescending,
      foundby_director_non_increasing: foundbyNonIncreasing,
      wait_above_floor: waitAboveFloor,
      verdict,
      notes,
    },
  };
}

function main(): void {
  const repoRoot = process.cwd();
  const [cmd, ...rest] = process.argv.slice(2);
  const arg = (name: string): string | undefined => {
    const i = rest.indexOf(`--${name}`);
    return i >= 0 ? rest[i + 1] : undefined;
  };

  if (cmd === 'seed') {
    const kind = arg('kind');
    const file = arg('file');
    const detectedBy = arg('detected-by') ?? 'none';
    if (!kind || !file || !['defect', 'mismapping'].includes(kind)) {
      console.error('uso: bv:seed -- --kind <defect|mismapping> --file <f> [--detected-by gate|agent-bv|director|none] [--note "..."]');
      process.exit(2);
    }
    const rec: SeedRecord = {
      kind: kind as SeedRecord['kind'],
      file,
      detected_by: detectedBy as SeedRecord['detected_by'],
      seeded_at: new Date().toISOString(),
      seeded_by: process.env.USER ?? 'agent',
      note: arg('note'),
    };
    const p = path.join(repoRoot, SEEDS_REL);
    mkdirSync(path.dirname(p), { recursive: true });
    appendFileSync(p, `${JSON.stringify(rec)}\n`);
    console.log(`seed registrato → ${SEEDS_REL}: ${kind} su ${file} (detected_by=${detectedBy})`);
    return;
  }

  if (cmd === 'seeds') {
    const seeds = loadSeeds(repoRoot);
    if (seeds.length === 0) {
      console.log('nessun seed registrato');
      return;
    }
    for (const s of seeds) {
      console.log(`${s.seeded_at}  ${s.kind.padEnd(11)} ${s.detected_by.padEnd(9)} ${s.file}${s.note ? ` — ${s.note}` : ''}`);
    }
    return;
  }

  const metrics = computeBvMetrics(repoRoot);
  mkdirSync(path.join(repoRoot, '.mw'), { recursive: true });
  writeFileSync(path.join(repoRoot, METRICS_REL), JSON.stringify(metrics, null, 2));

  const f = (n: number | null) => (n === null ? 'n/a' : n.toFixed(2));
  console.log('\n=== BV METRICS (Director burden, PLAN-044 T-007) ===');
  console.log(`baseline boundary (primo director_answer): ${metrics.baseline_boundary ?? 'n/a'}`);
  console.log(
    `closures: ${metrics.closures.total} (pre ${metrics.closures.pre} / post ${metrics.closures.post})` +
      ` — dispositions: ${metrics.dispositions.total} (pre ${metrics.dispositions.pre} / post ${metrics.dispositions.post})`,
  );
  console.log(
    `director_dispositions_per_closure: ${f(metrics.director_dispositions_per_closure.pre)} → ${f(metrics.director_dispositions_per_closure.post)}`,
  );
  const w = metrics.awaiting_director_wait_minutes;
  console.log(
    `awaiting_director_wait_minutes: median ${f(w.median)} max ${f(w.max)} (${w.samples} risposte, ${w.pending} pending, floor ${w.floor_minutes}min)`,
  );
  console.log(`found-by: ${JSON.stringify(metrics.found_by)} — REG senza found-by: ${metrics.reg_without_found_by}`);
  console.log(`zero_defect_closures: ${metrics.zero_defect_closures}`);
  console.log(`seeds: ${metrics.seeds.total} ${JSON.stringify(metrics.seeds.by_kind)} detected_by ${JSON.stringify(metrics.seeds.by_detected_by)}`);
  console.log(`\nTREND: ${metrics.trend.verdict}`);
  for (const n of metrics.trend.notes) console.log(`  • ${n}`);
  console.log(`\nscritto → ${METRICS_REL}`);

  process.exit(metrics.trend.verdict === 'NOT_IMPROVING' ? 1 : 0);
}

if (process.argv[1] && process.argv[1].endsWith('bvMetrics.ts')) main();
