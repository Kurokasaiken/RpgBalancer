import { createHash } from 'node:crypto';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';

/**
 * Gate di chiusura (R-189): logica pura condivisa tra produceBundle,
 * validateBundle e kanbanLint. Nessun I/O di rete, niente esecuzione
 * di comandi — solo valutazione di manifest, artefatti e ledger.
 *
 * Vocabolario esiti: PASS | FAIL | NOT_RUN | INCONCLUSIVE | INVALID_ENV
 * | WAIVED_DIRECTOR | MISSING_ARTIFACT. La dichiarazione dell'agente
 * non è un input: il gate valuta solo artefatti e hash.
 */

export type ObligationType =
  | 'state'
  | 'dom-temporal'
  | 'pixel-temporal'
  | 'fps'
  | 'human-eye';
export type EnvironmentReq = 'headless-ok' | 'headed-required' | 'human-required';
export type ObligationResult =
  | 'PASS'
  | 'FAIL'
  | 'NOT_RUN'
  | 'INCONCLUSIVE'
  | 'INVALID_ENV'
  | 'WAIVED_DIRECTOR'
  | 'MISSING_ARTIFACT';
export type ArtifactKind =
  | 'junit'
  | 'json'
  | 'frames'
  | 'metrics'
  | 'env'
  | 'video'
  | 'signoff'
  | 'log';

export interface ManifestArtifact {
  path: string;
  kind: ArtifactKind;
}

export interface Obligation {
  id: string;
  requirement: string;
  source: string;
  request_hash?: string;
  type: ObligationType;
  environment: EnvironmentReq;
  command?: string;
  timeout_s?: number;
  min_tests?: number;
  min_frames?: number;
  min_samples?: number;
  /** Se presente, gli errori runtime registrati nell'artefatto metrics oltre questa soglia = FAIL. */
  max_errors?: number;
  artifacts: ManifestArtifact[];
  blocking: boolean;
  waived?: { by: 'director'; reason: string };
}

export interface Manifest {
  task: string;
  run_id: string;
  created_at: string;
  verifier_required?: boolean;
  /** PLAN-044 T-004: file test la cui riproduzione rossa deve risultare registrata e immutata. */
  red_first?: string[];
  obligations: Obligation[];
}

export interface CommandResult {
  exit_code: number | null;
  killed?: boolean;
  timed_out?: boolean;
}

export interface ObligationEvaluation {
  id: string;
  result: ObligationResult;
  reasons: string[];
  artifacts: { path: string; sha256: string | null; exists: boolean }[];
  /** hash del command log (prova dell'esecuzione), fuori dagli artifacts del verifier */
  command_log?: { path: string; sha256: string | null };
}

export interface EnvAttestation {
  visibilityState?: string;
  viewport?: { width?: number; height?: number };
  rafTicks?: number;
  frameDiff?: number;
  headed?: boolean;
}

export interface VerifierEvaluation {
  id: string;
  verdict: 'CONFIRMED' | 'CONTESTED' | 'UNVERIFIABLE';
  criteria_sha256: string;
  evidence_sha256: string[];
}

export interface VerifierFile {
  verifier: string;
  evaluated_at: string;
  evaluations: VerifierEvaluation[];
}

export function sha256Text(text: string): string {
  return createHash('sha256').update(text, 'utf8').digest('hex');
}

export function sha256File(filePath: string): string | null {
  if (!existsSync(filePath) || !statSync(filePath).isFile()) return null;
  return createHash('sha256').update(readFileSync(filePath)).digest('hex');
}

/**
 * Hash canonizzato del contenuto (PLAN-044 T-003): normalizza EOL,
 * trailing whitespace e righe vuote consecutive — i tweak benigni non
 * invalidano un `director_answer`, le modifiche sostanziali sì.
 * Non strippe commenti: un edit ai commenti invalida (fail-closed).
 */
export function canonicalizeText(text: string): string {
  const lines = text.replace(/\r\n?/g, '\n').split('\n').map((l) => l.trimEnd());
  return lines.join('\n').replace(/\n{3,}/g, '\n\n').trim();
}

export function canonicalFileHash(filePath: string): string | null {
  if (!existsSync(filePath) || !statSync(filePath).isFile()) return null;
  return sha256Text(canonicalizeText(readFileSync(filePath, 'utf8')));
}

/** Hash del criterio: ciò che il verificatore deve aver ricevuto verbatim. */
export function criteriaHash(requirement: string, source: string): string {
  return sha256Text(`${requirement}\n${source}`);
}

export interface JunitSummary {
  malformed: boolean;
  tests: number;
  failures: number;
  errors: number;
  skipped: number;
  failedTests: string[];
  skippedTests: string[];
}

/** Parser JUnit minimale, dependency-free, per output Playwright/Vitest. */
export function parseJunit(xml: string): JunitSummary {
  const summary: JunitSummary = {
    malformed: false,
    tests: 0,
    failures: 0,
    errors: 0,
    skipped: 0,
    failedTests: [],
    skippedTests: [],
  };
  // Un junit valido ha sempre suite aperta E chiusa: un file troncato
  // (run interrotto/killato) è NOT_RUN, non una suite vuota.
  if (!/<testsuite[\s>]/.test(xml) || !/<\/testsuite>/.test(xml)) {
    summary.malformed = true;
    return summary;
  }
  // Somma gli attributi di TUTTE le <testsuite> (un junit multi-suite come
  // quello di Playwright conta solo nella prima altrimenti).
  const suiteRe = /<testsuite\b[^>]*>/g;
  let suiteTag: RegExpExecArray | null;
  while ((suiteTag = suiteRe.exec(xml)) !== null) {
    const attr = (name: string): number => {
      const am = suiteTag![0].match(new RegExp(`${name}="(\\d+)"`));
      return am ? Number(am[1]) : 0;
    };
    summary.tests += attr('tests');
    summary.failures += attr('failures');
    summary.errors += attr('errors');
    summary.skipped += attr('skipped');
  }
  // testcase self-closing `<tc/>` = pass; `<tc>...</tc>` = ispezionare il body.
  const caseRe = /<testcase\b[^>]*\/>|<testcase\b[^>]*>[\s\S]*?<\/testcase>/g;
  let m: RegExpExecArray | null;
  while ((m = caseRe.exec(xml)) !== null) {
    const el = m[0];
    const name = el.match(/name="([^"]*)"/)?.[1] ?? '(unnamed)';
    if (/<failure[\s/>]/.test(el)) summary.failedTests.push(name);
    if (/<skipped[\s/>]/.test(el)) summary.skippedTests.push(name);
    if (/<error[\s/>]/.test(el)) summary.failedTests.push(`${name} (error)`);
  }
  return summary;
}

const TEMPORAL_TYPES: ReadonlySet<ObligationType> = new Set<ObligationType>([
  'dom-temporal',
  'pixel-temporal',
  'fps',
]);

export function needsEnvAttestation(type: ObligationType): boolean {
  return type !== 'state' && type !== 'human-eye';
}

/** Attestazione ambiente: prova raccolta DENTRO il run, non un assert a posteriori. */
export function checkEnvAttestation(
  env: EnvAttestation | null,
  type: ObligationType,
  environment: EnvironmentReq,
): { ok: boolean; reasons: string[] } {
  const reasons: string[] = [];
  if (!env) {
    return { ok: false, reasons: ['env attestation assente'] };
  }
  if (env.visibilityState !== 'visible') {
    reasons.push(`visibilityState=${env.visibilityState ?? 'assente'} (atteso 'visible')`);
  }
  const w = env.viewport?.width ?? 0;
  const h = env.viewport?.height ?? 0;
  if (!(w > 0 && h > 0)) {
    reasons.push(`viewport ${w}x${h} non valida`);
  }
  if (!((env.rafTicks ?? 0) > 0)) {
    reasons.push('rAF ticks = 0: le animazioni non sono progredite');
  }
  if (TEMPORAL_TYPES.has(type) && !((env.frameDiff ?? 0) > 0)) {
    reasons.push('frameDiff = 0: nessun cambio di frame osservato');
  }
  if (environment === 'headed-required' && env.headed !== true) {
    reasons.push('environment headed-required ma attestazione headed !== true');
  }
  return { ok: reasons.length === 0, reasons };
}

const STALE_SLACK_MS = 60_000;

function readJsonSafe<T = Record<string, unknown>>(filePath: string): T | null {
  try {
    return JSON.parse(readFileSync(filePath, 'utf8')) as T;
  } catch {
    return null;
  }
}

function countFrames(dirPath: string): number {
  try {
    return readdirSync(dirPath).filter((f) =>
      /\.(png|jpe?g|webp)$/i.test(f),
    ).length;
  } catch {
    return 0;
  }
}

function extractEnv(runDir: string, artifacts: ManifestArtifact[]): EnvAttestation | null {
  for (const art of artifacts) {
    if (art.kind === 'env' || art.kind === 'metrics' || art.kind === 'json') {
      const data = readJsonSafe(path.join(runDir, art.path));
      if (data && typeof data === 'object') {
        const env = (data.env ?? data) as EnvAttestation;
        if (env.visibilityState !== undefined || env.rafTicks !== undefined) {
          return env;
        }
      }
    }
  }
  return null;
}

/**
 * Valuta una singola obbligazione contro artefatti reali e risultato del
 * comando già eseguito (o assente). Funzione pura: nessun comando viene
 * lanciato qui.
 */
export function evaluateObligation(
  obl: Obligation,
  runDir: string,
  cmd: CommandResult | null,
  manifestCreatedAt?: string,
): ObligationEvaluation {
  const reasons: string[] = [];
  const artifactInfo = obl.artifacts.flatMap((a) => {
    const full = path.join(runDir, a.path);
    const exists = existsSync(full);
    const base = { path: a.path, sha256: sha256File(full), exists };
    // Una directory (es. kind: frames) va legata per-file: l'hash del
    // verificatore è sui singoli frame, non sul nome della cartella.
    if (exists && statSync(full).isDirectory()) {
      const inner = readdirSync(full)
        .filter((f) => statSync(path.join(full, f)).isFile())
        .sort()
        .map((f) => ({
          path: `${a.path}/${f}`,
          sha256: sha256File(path.join(full, f)),
          exists: true,
        }));
      return [base, ...inner];
    }
    return [base];
  });

  if (obl.waived?.by === 'director') {
    return {
      id: obl.id,
      result: 'WAIVED_DIRECTOR',
      reasons: [`deroga Director: ${obl.waived.reason}`],
      artifacts: artifactInfo,
    };
  }

  // Ogni motivo è taggato con la categoria d'esito a cui contribuisce.
  const tag = (t: 'FAIL' | 'NOT_RUN' | 'INCONCLUSIVE' | 'INVALID_ENV' | 'STALE', msg: string) =>
    reasons.push(`${t}: ${msg}`);

  // Prova obbligatoria mancante
  const missing = artifactInfo.filter((a) => !a.exists);
  if (missing.length > 0) {
    tag('NOT_RUN', `artefatti mancanti: ${missing.map((a) => a.path).join(', ')}`);
  }

  // Evidenza stantia: artefatti più vecchi del manifest
  if (manifestCreatedAt) {
    const created = Date.parse(manifestCreatedAt);
    if (!Number.isNaN(created)) {
      const stale = artifactInfo.filter((a) => {
        if (!a.exists) return false;
        const mtime = statSync(path.join(runDir, a.path)).mtimeMs;
        return mtime < created - STALE_SLACK_MS;
      });
      if (stale.length > 0) {
        tag('STALE', `artefatti precedenti al manifest: ${stale.map((a) => a.path).join(', ')}`);
      }
    }
  }

  // Esito del comando tecnico
  if (obl.command) {
    if (!cmd || cmd.exit_code === null || cmd.killed || cmd.timed_out) {
      tag('NOT_RUN', 'comando non eseguito, interrotto o in timeout');
    } else if (cmd.exit_code !== 0) {
      tag('FAIL', `comando fallito con exit_code=${cmd.exit_code}`);
    }
  }

  // Esito junit per-test
  for (const art of obl.artifacts) {
    if (art.kind !== 'junit') continue;
    const full = path.join(runDir, art.path);
    if (!existsSync(full)) continue;
    const j = parseJunit(readFileSync(full, 'utf8'));
    if (j.malformed) {
      tag('NOT_RUN', `junit non parsabile (run interrotto?): ${art.path}`);
      continue;
    }
    if (j.failures > 0 || j.errors > 0) {
      tag(
        'FAIL',
        `junit: ${j.failures} failure, ${j.errors} errori (${j.failedTests.join('; ') || 'n/a'})`,
      );
    }
    if (j.skipped > 0 || j.skippedTests.length > 0) {
      tag('NOT_RUN', `junit: ${j.skipped} test skippati (${j.skippedTests.join('; ')})`);
    }
    const min = obl.min_tests ?? 0;
    if (min > 0 && j.tests < min) {
      tag('NOT_RUN', `junit: ${j.tests} test eseguiti < ${min} previsti`);
    }
  }

  // Tipo di prova
  if (obl.type === 'pixel-temporal' || obl.type === 'dom-temporal' || obl.type === 'fps') {
    const metrics = obl.artifacts.filter((a) => a.kind === 'metrics');
    const metricsOk = metrics.some((a) => {
      const data = readJsonSafe(path.join(runDir, a.path));
      const samples = (data?.samples ?? data?.frames ?? []) as unknown[];
      return Array.isArray(samples) && samples.length >= (obl.min_samples ?? 2);
    });
    if (metrics.length === 0) {
      tag('INCONCLUSIVE', 'prova temporale senza artefatto metrics: una cattura statica non basta');
    } else if (!metricsOk) {
      tag('INCONCLUSIVE', `metrics senza serie temporale >= ${obl.min_samples ?? 2} campioni`);
    }
    if (obl.max_errors !== undefined) {
      for (const a of metrics) {
        const data = readJsonSafe(path.join(runDir, a.path));
        const errs = Array.isArray(data?.errors) ? (data.errors as string[]) : [];
        if (errs.length > obl.max_errors) {
          tag(
            'FAIL',
            `cattura con ${errs.length} errori runtime (> ${obl.max_errors}): ${String(errs[0]).split('\n')[0].slice(0, 140)}`,
          );
        }
      }
    }
    if (obl.type === 'pixel-temporal' || obl.type === 'fps') {
      const framesDir = obl.artifacts.find((a) => a.kind === 'frames');
      const nFrames = framesDir ? countFrames(path.join(runDir, framesDir.path)) : 0;
      const minF = obl.min_frames ?? 4;
      if (!framesDir || nFrames < minF) {
        tag('INCONCLUSIVE', `frames insufficienti: ${nFrames} < ${minF} (singolo screenshot non basta)`);
      }
    }
  }
  if (obl.type === 'human-eye') {
    const signoff = obl.artifacts.find((a) => a.kind === 'signoff');
    const data = signoff ? readJsonSafe(path.join(runDir, signoff.path)) : null;
    if (!data || typeof data.reviewer !== 'string' || typeof data.note !== 'string') {
      tag('NOT_RUN', 'human-eye senza signoff leggibile (reviewer + note richiesti)');
    }
  }

  // Attestazione ambiente
  if (needsEnvAttestation(obl.type)) {
    const env = extractEnv(runDir, obl.artifacts);
    const envCheck = checkEnvAttestation(env, obl.type, obl.environment);
    if (!envCheck.ok) {
      tag('INVALID_ENV', envCheck.reasons.join('; '));
    }
  }

  // Il command log è la prova durevole dell'esecuzione: il bundle ne lega l'hash.
  const commandLogRel = `command-logs/${obl.id}.log`;
  const commandLog =
    obl.command && existsSync(path.join(runDir, commandLogRel))
      ? { path: commandLogRel, sha256: sha256File(path.join(runDir, commandLogRel)) }
      : undefined;

  // Classificazione finale — precedenza: artefatto mancante > env invalido >
  // fallimento accertato > non eseguito > prova inconcludente.
  let result: ObligationResult = 'PASS';
  const has = (t: string) => reasons.some((r) => r.startsWith(`${t}:`));
  if (missing.length > 0) {
    result = 'MISSING_ARTIFACT';
  } else if (has('INVALID_ENV')) {
    result = 'INVALID_ENV';
  } else if (has('FAIL')) {
    result = 'FAIL';
  } else if (has('NOT_RUN') || has('STALE')) {
    result = 'NOT_RUN';
  } else if (has('INCONCLUSIVE')) {
    result = 'INCONCLUSIVE';
  }

  return { id: obl.id, result, reasons, artifacts: artifactInfo, command_log: commandLog };
}

/** Verifica meccanica del verificatore indipendente (C3). */
export function checkVerifier(
  manifest: Manifest,
  runDir: string,
  evaluations: ObligationEvaluation[],
): { required: boolean; ok: boolean; reasons: string[] } {
  const reasons: string[] = [];
  const needsVerifier =
    manifest.verifier_required === true ||
    manifest.obligations.some((o) => o.blocking && o.type !== 'state');
  if (!needsVerifier) return { required: false, ok: true, reasons: [] };

  const verifierPath = path.join(runDir, 'verifier.json');
  const vf = readJsonSafe<VerifierFile>(verifierPath);
  if (!vf || !Array.isArray(vf.evaluations)) {
    return {
      required: true,
      ok: false,
      reasons: ['verifier.json assente o malformato (verificatore indipendente richiesto)'],
    };
  }
  // Se verifier_required, il verificatore giudica TUTTE le obbligazioni
  // blocking (un test verde sul criterio sbagliato è esattamente l'incidente);
  // altrimenti solo quelle percettive (type !== 'state').
  const toJudge = manifest.obligations.filter(
    (o) =>
      o.blocking &&
      !o.waived &&
      (manifest.verifier_required === true || o.type !== 'state'),
  );
  for (const obl of toJudge) {
    const ev = vf.evaluations.find((e) => e.id === obl.id);
    if (!ev) {
      reasons.push(`${obl.id}: nessun verdetto del verificatore`);
      continue;
    }
    const expectedCriteria = criteriaHash(obl.requirement, obl.source);
    if (ev.criteria_sha256 !== expectedCriteria) {
      reasons.push(`${obl.id}: CRITERIA_TAMPERED — il verificatore ha giudicato un criterio diverso`);
      continue;
    }
    const evdl = evaluations.find((e) => e.id === obl.id);
    const realHashes = (evdl?.artifacts ?? [])
      .map((a) => a.sha256)
      .filter((h): h is string => typeof h === 'string')
      .sort();
    const echoed = [...ev.evidence_sha256].sort();
    if (JSON.stringify(realHashes) !== JSON.stringify(echoed)) {
      reasons.push(`${obl.id}: il verificatore non ha attestato gli artefatti reali (hash mismatch)`);
      continue;
    }
    if (evdl && evdl.result !== 'PASS') {
      reasons.push(`${obl.id}: verificatore non può confermare un'obbligazione ${evdl.result}`);
      continue;
    }
    if (ev.verdict !== 'CONFIRMED') {
      reasons.push(`${obl.id}: verdetto verificatore ${ev.verdict} — non è una conferma`);
    }
  }
  return { required: true, ok: reasons.length === 0, reasons };
}

export interface Bundle {
  task: string;
  run_id: string;
  produced_at: string;
  manifest_sha256: string;
  verdict: 'PASS' | 'BLOCKED';
  obligations: ObligationEvaluation[];
  verifier: { required: boolean; ok: boolean; reasons: string[] };
  /** Gate file→superficie (PLAN-044 T-002): assente = non valutato. */
  contracts?: { ok: boolean; reasons: string[] };
  /** Gate red-first lockato (PLAN-044 T-004): assente = non valutato. */
  red_first?: { ok: boolean; reasons: string[] };
}

export function evaluateManifest(
  manifest: Manifest,
  runDir: string,
  commandResults: Record<string, CommandResult | null>,
  contracts?: { ok: boolean; reasons: string[] },
  redFirst?: { ok: boolean; reasons: string[] },
): Bundle {
  const manifestPath = path.join(runDir, 'verification.json');
  const evaluations = manifest.obligations.map((obl) =>
    evaluateObligation(obl, runDir, commandResults[obl.id] ?? null, manifest.created_at),
  );
  const verifier = checkVerifier(manifest, runDir, evaluations);
  const blocked =
    evaluations.some((e) => e.result !== 'PASS' && e.result !== 'WAIVED_DIRECTOR' && isBlocking(manifest, e.id)) ||
    !verifier.ok ||
    contracts?.ok === false ||
    redFirst?.ok === false;
  return {
    task: manifest.task,
    run_id: manifest.run_id,
    produced_at: new Date().toISOString(),
    manifest_sha256: sha256File(manifestPath) ?? '',
    verdict: blocked ? 'BLOCKED' : 'PASS',
    obligations: evaluations,
    verifier,
    contracts,
    red_first: redFirst,
  };
}

function isBlocking(manifest: Manifest, id: string): boolean {
  return manifest.obligations.find((o) => o.id === id)?.blocking !== false;
}

/** Ri-valida un bundle da disco: hash manifest, artefatti, coerenza verdict. */
export function validateBundleFile(bundlePath: string): { ok: boolean; reasons: string[] } {
  const reasons: string[] = [];
  const bundle = readJsonSafe<Bundle>(bundlePath);
  if (!bundle) return { ok: false, reasons: ['bundle.json non leggibile'] };
  const runDir = path.dirname(bundlePath);

  const manifestPath = path.join(runDir, 'verification.json');
  if (!existsSync(manifestPath)) {
    reasons.push('verification.json assente accanto al bundle');
  } else if (sha256File(manifestPath) !== bundle.manifest_sha256) {
    reasons.push('manifest modificato dopo la produzione del bundle (hash mismatch)');
  }

  for (const ob of bundle.obligations ?? []) {
    for (const a of ob.artifacts ?? []) {
      const full = path.join(runDir, a.path);
      if (a.sha256 === null) continue;
      const actual = sha256File(full);
      if (actual !== a.sha256) {
        reasons.push(`${ob.id}: artefatto ${a.path} manomesso o mancante (FORGED)`);
      }
    }
    if (ob.command_log?.sha256) {
      const actual = sha256File(path.join(runDir, ob.command_log.path));
      if (actual !== ob.command_log.sha256) {
        reasons.push(`${ob.id}: command log manomesso o mancante (FORGED)`);
      }
    }
  }
  const vfPath = path.join(runDir, 'verifier.json');
  if (bundle.verifier?.required && bundle.verifier.ok && !existsSync(vfPath)) {
    reasons.push('verifier.json rimosso dopo la produzione del bundle');
  }
  if (bundle.verdict !== 'PASS') {
    reasons.push(`verdict=${bundle.verdict} — non è un PASS valido`);
  }
  return { ok: reasons.length === 0, reasons };
}

/* ------------------------------------------------------------------ */
/* Gate sui ledger (C4): diff vs baseline git                          */
/* ------------------------------------------------------------------ */

export interface KanbanRowLike {
  id: string;
  status: string;
  notes: string;
  lineNumber: number;
}

const KANBAN_HEADER_TOKENS = new Set(['Prompt ID/Descrizione', 'ID', 'Prompt ID']);
const CLOSING_RE = /^Completato\b/;
const CHIUSURA_TOKENS_RE = /bundle:\s*\S+|waived-director:|nessuna-verifica-tecnica:/;

/**
 * Il kanban ha tabelle in più formati (5, 8 e 10 colonne) e almeno un code
 * fence storicamente non chiuso che inghiotte righe reali: per il gate la
 * scansione è volutamente fence-agnostic. In TUTTI i formati la colonna 1 è
 * lo stato; il token di chiusura viene cercato nell'intera riga.
 */
export function parseKanbanRows(content: string): KanbanRowLike[] {
  const rows: KanbanRowLike[] = [];
  content.split(/\r?\n/).forEach((line, i) => {
    const t = line.trim();
    if (!t.startsWith('|') || line.includes('---')) return;
    const cols = line.split('|').slice(1, -1).map((c) => c.trim());
    if (cols.length < 4 || KANBAN_HEADER_TOKENS.has(cols[0])) return;
    rows.push({
      id: cols[0],
      status: cols[1],
      notes: line,
      lineNumber: i + 1,
    });
  });
  return rows;
}

const BUNDLE_RE = /bundle:\s*(\S+)/;

/** Nuove transizioni a Completato devono citare bundle valido o deroga esplicita. */
export function checkKanbanGate(
  baselineContent: string,
  currentContent: string,
  repoRoot: string,
): string[] {
  const errors: string[] = [];
  const baseline = new Map(parseKanbanRows(baselineContent).map((r) => [r.id, r]));
  for (const row of parseKanbanRows(currentContent)) {
    if (!CLOSING_RE.test(row.status)) continue;
    const prev = baseline.get(row.id);
    if (prev && CLOSING_RE.test(prev.status)) continue; // grandfathered
    if (!CHIUSURA_TOKENS_RE.test(row.notes)) {
      errors.push(
        `Linea ${row.lineNumber} (${row.id}): "Completato" richiede "bundle: <path>/bundle.json" (o waived-director: / nessuna-verifica-tecnica:) nella riga.`,
      );
      continue;
    }
    const m = BUNDLE_RE.exec(row.notes);
    if (m) {
      const check = validateBundleFile(path.resolve(repoRoot, m[1]));
      if (!check.ok) {
        errors.push(
          `Linea ${row.lineNumber} (${row.id}): bundle non valido — ${check.reasons.join('; ')}`,
        );
      }
    }
  }
  return errors;
}

const CLOSING_STATES = new Set(['fatta', 'completata']);
const STATUS_RE = /\*\*Stato:\*\*\s*`([^`]+)`/;
const CHIUSURA_RE = /\*\*Chiusura:\*\*/;

interface RichiestaSection {
  id: string;
  status: string | null;
  body: string;
}

function parseRichieste(content: string): Map<string, RichiestaSection> {
  const map = new Map<string, RichiestaSection>();
  const re = /^## (R-\d+)[^\n]*$/gm;
  const heads: { id: string; idx: number }[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(content)) !== null) heads.push({ id: m[1], idx: m.index });
  heads.forEach((h, i) => {
    const end = i + 1 < heads.length ? heads[i + 1].idx : content.length;
    const body = content.slice(h.idx, end);
    const sm = STATUS_RE.exec(body);
    map.set(h.id, { id: h.id, status: sm ? sm[1].trim() : null, body });
  });
  return map;
}

/**
 * Nuove transizioni a `fatta`/`completata` in RICHIESTE.md devono avere una
 * riga **Chiusura:** con bundle: / waived-director: / nessuna-verifica-tecnica:.
 */
export function checkRichiesteGate(
  baselineContent: string,
  currentContent: string,
  repoRoot: string,
): string[] {
  const errors: string[] = [];
  const baseline = parseRichieste(baselineContent);
  for (const sec of Array.from(parseRichieste(currentContent).values())) {
    if (!sec.status || !CLOSING_STATES.has(sec.status)) continue;
    const prev = baseline.get(sec.id);
    if (prev && prev.status && CLOSING_STATES.has(prev.status)) continue; // grandfathered
    // Il token conta solo sulla riga **Chiusura:** — la parola "bundle:"
    // può comparire nel resto della sezione senza essere una citazione.
    const chiusura = sec.body.split('\n').find((ln) => CHIUSURA_RE.test(ln));
    if (!chiusura) {
      errors.push(
        `${sec.id}: transizione a "${sec.status}" senza riga "**Chiusura:**" (bundle:, waived-director: o nessuna-verifica-tecnica:).`,
      );
      continue;
    }
    const bm = BUNDLE_RE.exec(chiusura);
    if (bm) {
      const check = validateBundleFile(path.resolve(repoRoot, bm[1]));
      if (!check.ok) {
        errors.push(`${sec.id}: bundle non valido — ${check.reasons.join('; ')}`);
      }
    } else if (!/waived-director:|nessuna-verifica-tecnica:/.test(chiusura)) {
      errors.push(
        `${sec.id}: la riga Chiusura deve citare bundle:, waived-director: "<motivo>" o nessuna-verifica-tecnica: "<motivo>".`,
      );
    }
  }
  return errors;
}

/**
 * Gate igiene AGENTS (PLAN-044 T-001 / S0): i file di istruzioni agente
 * ANNIDATI (`AGENTS.md` / `CLAUDE.md` sotto la root) sono pointer alla fonte
 * unica, non fonti proprie. I pattern del workflow sospeso R-208 (board
 * kanban, pipeline di dispatch coordinator/ai-worker/harness, prompt-spec)
 * non possono comparire in un file annidato: se compaiono è drift
 * reintrodotto → rosso.
 *
 * I file di root sono esenti: sono la fonte unica e documentano
 * legittimamente lo stato "in pausa" del workflow.
 */
const AGENT_INSTRUCTION_FILES = new Set(['agents.md', 'claude.md']);

const AGENTS_GATE_SKIP_DIRS = new Set([
  'node_modules', '.git', 'dist', 'build', 'venv', '.venv', '.mw',
  'archive', 'test-results', 'coverage', '.next', '.turbo', 'out',
  'worktrees',
]);

const SUSPENDED_WORKFLOW_PATTERNS: { name: string; re: RegExp }[] = [
  { name: 'board kanban (sospesa R-208)', re: /kanban/i },
  { name: 'board agent_assignments (sospesa R-208)', re: /agent_assignments/i },
  { name: 'pipeline coordinator (sospesa R-208)', re: /coordinator/i },
  { name: 'pipeline ai-worker (sospesa R-208)', re: /ai[-_ ]?worker/i },
  { name: 'pipeline prompt-spec (sospesa R-208)', re: /prompt[-_ ]?spec/i },
  { name: 'pipeline harness (sospesa R-208)', re: /\bharness\b/i },
  { name: 'pipeline dispatch (sospesa R-208)', re: /\bdispatch\b/i },
];

function* walkAgentFiles(dir: string): Generator<string> {
  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!AGENTS_GATE_SKIP_DIRS.has(entry.name)) yield* walkAgentFiles(full);
    } else if (entry.isFile() && AGENT_INSTRUCTION_FILES.has(entry.name.toLowerCase())) {
      yield full;
    }
  }
}

export function checkNestedAgentsGate(repoRoot: string): string[] {
  const errors: string[] = [];
  for (const file of walkAgentFiles(repoRoot)) {
    const rel = path.relative(repoRoot, file).split(path.sep).join('/');
    if (!rel.includes('/')) continue; // root = fonte unica, esente
    let content: string;
    try {
      content = readFileSync(file, 'utf8');
    } catch {
      continue;
    }
    for (const { name, re } of SUSPENDED_WORKFLOW_PATTERNS) {
      if (re.test(content)) {
        errors.push(
          `${rel}: "${name}" — i file agente annidati sono pointer alla fonte unica (root AGENTS.md + .windsurf/rules/); il workflow sospeso non può essere reintrodotto (PLAN-044 T-001).`,
        );
      }
    }
  }
  return errors;
}
