/**
 * visualForkGate — gate meccanico del Visual Fork (PLAN-047 T-006, v35 FROZEN;
 * semantica v2 "scope per plan", ruling Director 2026-10-18).
 *
 * Un bundle/diff che tocca file visivi deve avere copertura `visual-fork:`:
 * ogni file visivo nel diff reale deve ricadere sotto la scope list di una
 * visual-fork card (`.mw/runs/<run>/visual-fork*.md`) oppure sotto uno skip
 * puntato dichiarato in un plan. La superficie visiva si deriva dal diff
 * reale (gitChangedFiles), NON dai `files_touched` dichiarati nel plan.
 *
 * Classificazione dei file visivi scoperti (v2 — worktree condiviso):
 *  - non dichiarato in alcun plan → ERRORE (omissione silenziosa: nessun
 *    artefatto reviewed lo rivendica);
 *  - dichiarato in un plan con `Desiderata:` ≥ v35 → ERRORE (regime post-gate:
 *    la copertura card/skip è dovuta subito);
 *  - dichiarato solo in plan pre-v35 o senza desiderata dichiarata → WARNING
 *    (transitorio: la copertura è dovuta alla chiusura di quel plan, non qui).
 * Dichiarazione = basename, path relativo o prefisso `src/` (≥3 segmenti,
 * mai derivato da glob `**`) presente nel testo del plan.
 *
 * Onestà (PLAN-047 §3/§6): il gate certifica presenza + copertura dichiarata,
 * NON la correttezza semantica dello skip né della scope list — quella resta
 * al reviewer umano al battezzo e a chiusura.
 *
 * Forme di marker valide in un plan (`plans/**\/*.md`):
 *   `visual-fork: <path-o-id-card>`              → riferimento a card
 *   `visual-fork: skipped — <motivo> — <puntatore>`  → skip con puntatore
 * Un puntatore placeholder (`<puntatore>`, `<motivo>`) o vuoto NON è valido:
 * serve a non contare le occorrenze normative dentro PLAN-047 stessa.
 */
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { gitChangedFiles } from './contractsCheck';

/** Glob di superficie visiva (PLAN-047 §3): src/ui/**, src/skins/**, config token/skin. */
const VISUAL_PATTERNS: RegExp[] = [
  /^src\/ui\//,
  /^src\/skins\//,
  /skinConfigRegistry/i,
  /skin.*config|config.*skin/i,
  /skin.?tokens?|theme.?tokens?/i,
];

export function isVisualFile(rel: string): boolean {
  return VISUAL_PATTERNS.some((re) => re.test(rel));
}

interface MarkerCorpus {
  /** file che contengono almeno un marker valido (plan o card) */
  files: string[];
  /** testo aggregato dei file con marker valido (per coverage-by-mention) */
  text: string;
  /** marker `visual-fork:` malformati (skip senza puntatore) */
  invalidMarkers: Array<{ file: string; line: string }>;
}

/**
 * Un marker è una **riga dedicata alla dichiarazione** (bullet/quote/backtick
 * ammessi ai margini): le menzioni normative inline dentro PLAN-047 o in prosa
 * non contano — né come marker validi né come marker invalidi.
 */
const MARKER_LINE_RE = /^[\s>*#|_-]*`?visual-fork:`?\s*(.*?)\s*`?\s*[.,;]?\s*$/;
const SKIP_RE = /^skipped\s*—\s*(.+?)\s*—\s*(.+?)\s*$/;
const PLACEHOLDER_RE = /<[^>]*>/;

/**
 * Ritorna 'valid' | 'invalid' | 'doc'.
 * 'doc' = corpo che contiene placeholder (`<puntatore>`) o forma non-marker:
 * testo schema, non una dichiarazione reale.
 */
function classifyMarkerBody(body: string): 'valid' | 'invalid' | 'doc' {
  const stripped = body.replace(/`/g, '').trim();
  if (!stripped || PLACEHOLDER_RE.test(stripped)) return 'doc';
  const skip = SKIP_RE.exec(stripped);
  if (skip) {
    const puntatore = skip[2].trim();
    return puntatore.length > 0 ? 'valid' : 'invalid';
  }
  if (/^skipped\b/.test(stripped)) return 'invalid'; // skip senza puntatore
  return 'valid';
}

function scanFileForMarkers(abs: string): { valid: boolean; invalid: Array<{ file: string; line: string }> } {
  const invalid: Array<{ file: string; line: string }> = [];
  let valid = false;
  let text: string;
  try {
    text = readFileSync(abs, 'utf8');
  } catch {
    return { valid, invalid };
  }
  for (const line of text.split('\n')) {
    if (!line.includes('visual-fork:')) continue;
    const m = MARKER_LINE_RE.exec(line);
    if (!m) continue;
    const kind = classifyMarkerBody(m[1]);
    if (kind === 'valid') valid = true;
    else if (kind === 'invalid') invalid.push({ file: abs, line: line.trim().slice(0, 160) });
  }
  return { valid, invalid };
}

function* walkMd(dir: string, depth = 4): Generator<string> {
  if (depth < 0 || !existsSync(dir)) return;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) yield* walkMd(p, depth - 1);
    else if (entry.isFile() && entry.name.endsWith('.md')) yield p;
  }
}

function buildCorpus(repoRoot: string): MarkerCorpus {
  const corpus: MarkerCorpus = { files: [], text: '', invalidMarkers: [] };
  const considered: string[] = [];

  const plansDir = path.join(repoRoot, 'plans');
  if (existsSync(plansDir)) {
    for (const f of readdirSync(plansDir)) {
      if (f.endsWith('.md')) considered.push(path.join(plansDir, f));
    }
  }
  // Card: solo .mw/runs/<run>/visual-fork*.md (il template resta fuori).
  const runsDir = path.join(repoRoot, '.mw', 'runs');
  if (existsSync(runsDir)) {
    for (const run of readdirSync(runsDir)) {
      const runDir = path.join(runsDir, run);
      try {
        if (!readdirSync(runDir)) continue;
      } catch {
        continue;
      }
      for (const f of walkMd(runDir, 2)) {
        if (path.basename(f).startsWith('visual-fork')) considered.push(f);
      }
    }
  }

  for (const abs of considered) {
    const { valid, invalid } = scanFileForMarkers(abs);
    corpus.invalidMarkers.push(...invalid);
    const isCard = path.basename(abs).startsWith('visual-fork');
    // Le card contano come corpus di copertura a prescindere dal marker
    // (la scope list vive nella card; il marker vive nel plan che la cita).
    if (valid || isCard) {
      corpus.files.push(abs);
      try {
        corpus.text += '\n' + readFileSync(abs, 'utf8');
      } catch {
        /* ignore */
      }
    }
  }
  return corpus;
}

/**
 * Prefissi `src/…` espliciti estratti da un testo (coverage/attribuzione per
 * scope/regione). Un token che termina in `**` non è una scope list — è un
 * glob normativo (`src/ui/**` in PLAN-047) e non attribuisce né copre nulla.
 * Sotto i 3 segmenti (`src/ui`) è comunque troppo largo: scartato.
 */
const MIN_PREFIX_SEGMENTS = 3;

function srcPrefixes(text: string): string[] {
  const out = new Set<string>();
  for (const m of text.matchAll(/`?(src\/[A-Za-z0-9_\-./]+)/g)) {
    const tok = m[1];
    if (/\*$/.test(tok)) continue;
    const clean = tok.replace(/\/+$/, '');
    if (clean.split('/').length >= MIN_PREFIX_SEGMENTS) out.add(clean);
  }
  return [...out];
}

/** Regime desiderata di un plan: max `vN` nella riga `Desiderata:`; 0 = assente/legacy. */
function planRegime(text: string): number {
  let max = 0;
  for (const line of text.split('\n')) {
    if (!/desiderata/i.test(line)) continue;
    for (const v of line.matchAll(/v(\d+)/gi)) max = Math.max(max, Number(v[1]));
  }
  return max;
}

interface AttributingPlan {
  name: string;
  regime: number;
  text: string;
  prefixes: string[];
}

/** Plan che dichiarano scope: `plans/*.md` e `docs/plans/*.md` (plan storici
 *  dell'era coordinator — superfici reviewed anche loro) tranne `INDEX.md`. */
const ATTRIBUTION_DIRS = ['plans', path.join('docs', 'plans')];

function loadAttributionPlans(repoRoot: string): AttributingPlan[] {
  const out: AttributingPlan[] = [];
  for (const rel of ATTRIBUTION_DIRS) {
    const plansDir = path.join(repoRoot, rel);
    if (!existsSync(plansDir)) continue;
    for (const f of readdirSync(plansDir)) {
      if (!f.endsWith('.md') || f === 'INDEX.md') continue;
      let text: string;
      try {
        text = readFileSync(path.join(plansDir, f), 'utf8');
      } catch {
        continue;
      }
      const name = rel === 'plans' ? f : `${rel}/${f}`;
      out.push({ name, regime: planRegime(text), text, prefixes: srcPrefixes(text) });
    }
  }
  return out;
}

function attributeTo(
  rel: string,
  plans: AttributingPlan[],
): AttributingPlan[] {
  const base = path.basename(rel);
  return plans.filter(
    (p) =>
      p.text.includes(rel) ||
      p.text.includes(base) ||
      p.prefixes.some((pre) => rel.startsWith(pre + '/')),
  );
}

export function checkVisualForkGate(
  repoRoot: string,
  opts: { changedFiles?: string[] } = {},
): { errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];
  const changed = opts.changedFiles ?? gitChangedFiles(repoRoot);
  const visual = changed.filter(isVisualFile);
  if (visual.length === 0) return { errors, warnings };

  const corpus = buildCorpus(repoRoot);
  errors.push(
    ...corpus.invalidMarkers.map(
      (i) =>
        `visual-fork: marker senza puntatore verificabile in ${path.relative(repoRoot, i.file)} — "${i.line}"`,
    ),
  );

  const prefixes = srcPrefixes(corpus.text);
  const uncovered = visual.filter((f) => {
    const base = path.basename(f);
    return !(
      corpus.text.includes(f) ||
      corpus.text.includes(base) ||
      prefixes.some((p) => f === p || f.startsWith(p + '/'))
    );
  });
  if (uncovered.length === 0) return { errors, warnings };

  // v2 "scope per plan": un file scoperto è difetto solo se nessun plan lo
  // dichiara (omissione silenziosa) o se lo dichiara un plan in regime ≥v35.
  const plans = loadAttributionPlans(repoRoot);
  const silent: string[] = [];
  const gated: Array<{ file: string; plans: string[] }> = [];
  const pending: Array<{ file: string; plans: string[] }> = [];
  for (const f of uncovered) {
    const claimants = attributeTo(f, plans);
    if (claimants.length === 0) silent.push(f);
    else if (claimants.some((c) => c.regime >= 35)) {
      gated.push({ file: f, plans: claimants.map((c) => c.name) });
    } else {
      pending.push({ file: f, plans: claimants.map((c) => c.name) });
    }
  }
  if (silent.length > 0) {
    errors.push(
      `visual-fork: file visivi nel diff non coperti e non dichiarati in alcun ` +
        `plan (omissione silenziosa): ${silent.join(', ')}`,
    );
  }
  for (const g of gated) {
    errors.push(
      `visual-fork: ${g.file} dichiarato in plan in regime ≥v35 senza card né ` +
        `skip puntato: ${g.plans.join(', ')}`,
    );
  }
  for (const p of pending) {
    warnings.push(
      `visual-fork: ${p.file} attribuito a plan pre-v35 — copertura ` +
        `transitoria pendente alla sua chiusura: ${p.plans.join(', ')}`,
    );
  }
  return { errors, warnings };
}
