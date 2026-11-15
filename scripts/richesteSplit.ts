/**
 * richesteSplit — PLAN-121: split byte-preserving di RICHIESTE.md in tre file.
 *
 *   npx tsx scripts/richesteSplit.ts inventory [--json]
 *   npx tsx scripts/richesteSplit.ts split [--dry-run|--apply] [--cutoff YYYY-MM-DD]
 *   npx tsx scripts/richesteSplit.ts check --cap <chars>
 *
 * Regola meccanica (ruling Director 2026-11-15, D-1=b, D-2=150k/2026-11-08):
 *   - entry con `**Data:**` >= cutoff        → RICHIESTE.md (attivo)
 *   - open-family, Data < cutoff o assente   → RICHIESTE-backlog.md
 *   - closed-family, Data < cutoff o assente → RICHIESTE-archive.md
 *
 * Famiglia closed: `fatta*` (qualsiasi token che inizia per "fatta"),
 * `completata/o`, `ritirata`, `superata`, `verificata`, `chiuso`, `✅`.
 * Ogni altro token (incluso status mancante) è open-family — fail-safe.
 *
 * Invarianti verificate dallo split (OB-1/OB-2):
 *   - header di RICHIESTE.md byte-identico all'originale;
 *   - multiset sha256-per-entry identico prima/dopo;
 *   - ordine entry preservato: riconcatenando tutte le entry nell'ordine
 *     originale (indice) sopra l'header originale si riottene il file
 *     byte-per-byte (sha256 uguale).
 *
 * Disciplina freeze (T-13): --apply ri-legge il file dopo la generazione;
 * se l'hash è cambiato rigenera una volta, poi se ancora instabile scrive
 * le parti in .mw/runs/plan121-richeste-split/staged/ senza toccare i file
 * di lavoro ("unstable file, staged") — nessun byte perso.
 */
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

export const RICHIESTE_PARTS = [
  'RICHIESTE.md',
  'RICHIESTE-backlog.md',
  'RICHIESTE-archive.md',
] as const;

export const DEFAULT_CUTOFF = '2026-11-08';
const RUN_DIR = path.join('.mw', 'runs', 'plan121-richeste-split');
const STAGED_DIR = path.join(RUN_DIR, 'staged');
const SPLIT_TAG = 'split PLAN-121 2026-11-15';

const ENTRY_HEAD_RE = /^## (R-\d[\w-]*)[^\n]*$/gm;
const STATUS_RE = /^\*\*Stato:\*\*\s*`([^`]+)`/m;
const DATA_RE = /^\*\*Data:\*\*\s*(\d{4}-\d{2}-\d{2})/m;

/** Token di status appartenenti alla famiglia "chiusa". `fatta` copre anche
 *  le varianti (`fatta (parziale)` ecc.) via startsWith. */
const CLOSED_TOKENS = new Set([
  'completata',
  'completato',
  'ritirata',
  'superata',
  'verificata',
  'chiuso',
  'chiusa',
  '✅',
]);

export interface RichiestaEntry {
  /** id heading, es. `R-001`, `R-340bis`. */
  id: string;
  /** primo token in backtick della prima riga `**Stato:**` (null se assente). */
  status: string | null;
  /** 'closed' | 'open' — open è il default fail-safe. */
  family: 'closed' | 'open';
  /** data `**Data:**` YYYY-MM-DD, null se assente/non parsabile. */
  data: string | null;
  /** indice ordinale dell'entry nel file originale (0-based). */
  index: number;
  /** offset char di inizio/fine blocco nel sorgente. */
  start: number;
  end: number;
  chars: number;
  sha256: string;
}

export interface RichiesteDoc {
  header: string;
  entries: RichiestaEntry[];
  /** testo di ogni entry, stesso ordine di `entries`. */
  entryTexts: string[];
  sha256: string;
}

function sha256(text: string): string {
  return createHash('sha256').update(text, 'utf8').digest('hex');
}

/** Classifica un token di status in famiglia closed/open (fail-safe: open). */
export function statusFamily(token: string | null): 'closed' | 'open' {
  if (!token) return 'open';
  const first = token.trim().toLowerCase().split(/\s+/)[0] ?? '';
  if (first.startsWith('fatta')) return 'closed';
  return CLOSED_TOKENS.has(first) ? 'closed' : 'open';
}

/**
 * Parsa il testo del ledger: header = tutto ciò che precede il primo heading
 * `## R-`; entry = da ogni heading al successivo (o EOF). Ordine = file.
 */
export function parseRichieste(text: string): RichiesteDoc {
  const heads: { id: string; start: number }[] = [];
  const re = new RegExp(ENTRY_HEAD_RE.source, 'gm');
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) heads.push({ id: m[1], start: m.index });
  const headerEnd = heads.length > 0 ? heads[0].start : text.length;
  const header = text.slice(0, headerEnd);
  const entries: RichiestaEntry[] = [];
  const entryTexts: string[] = [];
  heads.forEach((h, i) => {
    const end = i + 1 < heads.length ? heads[i + 1].start : text.length;
    const body = text.slice(h.start, end);
    const sm = STATUS_RE.exec(body);
    const status = sm ? sm[1].trim() : null;
    const dm = DATA_RE.exec(body);
    entryTexts.push(body);
    entries.push({
      id: h.id,
      status,
      family: statusFamily(status),
      data: dm ? dm[1] : null,
      index: i,
      start: h.start,
      end,
      chars: body.length,
      sha256: sha256(body),
    });
  });
  return { header, entries, entryTexts, sha256: sha256(text) };
}

/**
 * Destinazione di un'entry secondo la regola PLAN-121.
 * `Data >= cutoff` → 'active'; altrimenti closed → 'archive', open → 'backlog'
 * (Data assente/non parsabile conta come < cutoff).
 */
export function destOf(entry: RichiestaEntry, cutoff: string): 'active' | 'backlog' | 'archive' {
  if (entry.data !== null && entry.data >= cutoff) return 'active';
  return entry.family === 'closed' ? 'archive' : 'backlog';
}

function provenanceLine(fileLabel: string, descr: string, cutoff: string): string {
  return `# ${fileLabel} — ${descr} ${cutoff} (${SPLIT_TAG})\n\n`;
}

interface SplitOutput {
  active: string;
  backlog: string;
  archive: string;
}

/** Genera i tre testi di output. L'header del file attivo è byte-identico;
 *  backlog/archive ricevono copia dell'header + riga di provenienza. */
function buildSplit(doc: RichiesteDoc, cutoff: string): SplitOutput {
  const activeEntries: string[] = [];
  const backlogEntries: string[] = [];
  const archiveEntries: string[] = [];
  doc.entries.forEach((e, i) => {
    const dest = destOf(e, cutoff);
    const text = doc.entryTexts[i];
    if (dest === 'active') activeEntries.push(text);
    else if (dest === 'backlog') backlogEntries.push(text);
    else archiveEntries.push(text);
  });
  return {
    active: doc.header + activeEntries.join(''),
    backlog:
      doc.header +
      provenanceLine(
        'RICHIESTE-backlog',
        'voci open-family antecedenti',
        cutoff,
      ) +
      backlogEntries.join(''),
    archive:
      doc.header +
      provenanceLine('RICHIESTE-archive', 'voci closed-family antecedenti', cutoff) +
      archiveEntries.join(''),
  };
}

interface UnionCheck {
  ok: boolean;
  /** sha256(header originale + entry ricomposte in ordine originale). */
  recomposedSha256: string;
  originalSha256: string;
  headerIdentical: boolean;
  entryCountBefore: number;
  entryCountAfter: number;
  multisetIdentical: boolean;
  orderPreserved: boolean;
}

/**
 * Verifica OB-1/OB-2 sulle tre parti generate rispetto al doc originale:
 * header attivo identico, multiset sha-per-entry identico, e la ricomposizione
 * (header originale + entry in ordine indice) è byte-identica all'originale.
 */
export function unionCheck(original: RichiesteDoc, parts: SplitOutput): UnionCheck {
  const partDocs = [parts.active, parts.backlog, parts.archive].map(parseRichieste);
  const all = partDocs.flatMap((d) => d.entries.map((e, i) => ({ e, text: d.entryTexts[i] })));
  /* L'indice riassegnato dal parsing delle parti è locale a ciascun file:
   * l'ordine originale si recupera via sha256 → indice originale (entry
   * byte-identiche sono intercambiabili senza effetto sul risultato). */
  const origIndexBySha = new Map(original.entries.map((e) => [e.sha256, e.index]));
  const recomposed =
    original.header +
    all
      .sort((a, b) => (origIndexBySha.get(a.e.sha256) ?? 0) - (origIndexBySha.get(b.e.sha256) ?? 0))
      .map((x) => x.text)
      .join('');
  const beforeHashes = original.entries.map((e) => e.sha256).sort();
  const afterHashes = all.map((x) => x.e.sha256).sort();
  const recomposedSha = sha256(recomposed);
  return {
    ok:
      partDocs[0].header === original.header &&
      all.length === original.entries.length &&
      beforeHashes.length === afterHashes.length &&
      beforeHashes.every((h, i) => h === afterHashes[i]) &&
      recomposedSha === original.sha256,
    recomposedSha256: recomposedSha,
    originalSha256: original.sha256,
    headerIdentical: partDocs[0].header === original.header,
    entryCountBefore: original.entries.length,
    entryCountAfter: all.length,
    multisetIdentical:
      beforeHashes.length === afterHashes.length &&
      beforeHashes.every((h, i) => h === afterHashes[i]),
    orderPreserved: recomposedSha === original.sha256,
  };
}

/* ---------------------------------------------------------- subcommands */

interface Inventory {
  generated_at: string;
  file: string;
  file_chars: number;
  file_bytes: number;
  file_sha256: string;
  header_chars: number;
  cutoff: string;
  entries: (RichiestaEntry & { dest: 'active' | 'backlog' | 'archive' })[];
  status_table: Record<string, { family: string; count: number }>;
  histogram: Record<'active' | 'backlog' | 'archive', { count: number; chars: number }>;
}

function buildInventory(doc: RichiesteDoc, file: string, full: string, cutoff: string): Inventory {
  const statusTable: Record<string, { family: string; count: number }> = {};
  const histogram = {
    active: { count: 0, chars: 0 },
    backlog: { count: 0, chars: 0 },
    archive: { count: 0, chars: 0 },
  };
  const entries = doc.entries.map((e) => {
    const dest = destOf(e, cutoff);
    histogram[dest].count += 1;
    histogram[dest].chars += e.chars;
    const key = e.status ?? '(missing)';
    if (!statusTable[key]) statusTable[key] = { family: e.family, count: 0 };
    statusTable[key].count += 1;
    return { ...e, dest };
  });
  return {
    generated_at: new Date().toISOString(),
    file,
    file_chars: full.length,
    file_bytes: Buffer.byteLength(full, 'utf8'),
    file_sha256: doc.sha256,
    header_chars: doc.header.length,
    cutoff,
    entries,
    status_table: statusTable,
    histogram,
  };
}

function printSplitStats(parts: SplitOutput, check: UnionCheck): void {
  const line = (label: string, text: string) => {
    const d = parseRichieste(text);
    console.log(
      `  ${label}: ${d.entries.length} entry, ${text.length} chars (${Buffer.byteLength(text, 'utf8')} bytes)`,
    );
  };
  line('RICHIESTE.md        ', parts.active);
  line('RICHIESTE-backlog.md', parts.backlog);
  line('RICHIESTE-archive.md', parts.archive);
  console.log('union-check:');
  console.log(`  header attivo byte-identico : ${check.headerIdentical}`);
  console.log(`  entry ${check.entryCountBefore} → ${check.entryCountAfter}`);
  console.log(`  multiset sha-per-entry      : ${check.multisetIdentical}`);
  console.log(`  ordine preservato (sha)     : ${check.orderPreserved}`);
  console.log(`  original sha256  : ${check.originalSha256}`);
  console.log(`  recomposed sha256: ${check.recomposedSha256}`);
  console.log(`  RESULT: ${check.ok ? 'PASS' : 'FAIL'}`);
}

function writeManifest(
  repoRoot: string,
  doc: RichiesteDoc,
  parts: SplitOutput,
  check: UnionCheck,
  cutoff: string,
): string {
  const manifest = {
    plan: 'PLAN-121',
    applied_at: new Date().toISOString(),
    cutoff,
    original_sha256: doc.sha256,
    header_sha256: sha256(doc.header),
    union_check: check,
    entry_order: doc.entries.map((e, i) => ({
      index: e.index,
      id: e.id,
      dest: destOf(e, cutoff),
      sha256: e.sha256,
      status: e.status,
      family: e.family,
      data: e.data,
      order: i,
    })),
    parts: {
      'RICHIESTE.md': { sha256: sha256(parts.active), chars: parts.active.length },
      'RICHIESTE-backlog.md': { sha256: sha256(parts.backlog), chars: parts.backlog.length },
      'RICHIESTE-archive.md': { sha256: sha256(parts.archive), chars: parts.archive.length },
    },
  };
  const dir = path.join(repoRoot, RUN_DIR);
  mkdirSync(dir, { recursive: true });
  const p = path.join(dir, 'split-manifest.json');
  writeFileSync(p, JSON.stringify(manifest, null, 2));
  return p;
}

function cmdInventory(repoRoot: string, jsonOut: boolean, cutoff: string): number {
  const file = path.join(repoRoot, RICHIESTE_PARTS[0]);
  const full = readFileSync(file, 'utf8');
  const doc = parseRichieste(full);
  const inv = buildInventory(doc, RICHIESTE_PARTS[0], full, cutoff);
  const dir = path.join(repoRoot, RUN_DIR);
  mkdirSync(dir, { recursive: true });
  const out = path.join(dir, 'inventory.json');
  writeFileSync(out, JSON.stringify(inv, null, 2));
  console.log(`inventory → ${out}`);
  console.log(`${inv.entries.length} entry · header ${inv.header_chars} chars · file ${inv.file_chars} chars`);
  console.log(
    `active ${inv.histogram.active.count}/${inv.histogram.active.chars} · ` +
      `backlog ${inv.histogram.backlog.count}/${inv.histogram.backlog.chars} · ` +
      `archive ${inv.histogram.archive.count}/${inv.histogram.archive.chars}`,
  );
  console.log('status → family:');
  for (const [tok, v] of Object.entries(inv.status_table).sort((a, b) => b[1].count - a[1].count)) {
    console.log(`  ${tok.padEnd(24)} ${v.family.padEnd(7)} ×${v.count}`);
  }
  if (jsonOut) console.log(JSON.stringify(inv, null, 2));
  return 0;
}

function cmdSplit(repoRoot: string, apply: boolean, cutoff: string): number {
  const file = path.join(repoRoot, RICHIESTE_PARTS[0]);
  const read = () => readFileSync(file, 'utf8');
  let full = read();
  let doc = parseRichieste(full);
  let parts = buildSplit(doc, cutoff);
  let check = unionCheck(doc, parts);
  if (!apply) {
    console.log(`split --dry-run (cutoff ${cutoff})`);
    printSplitStats(parts, check);
    return check.ok ? 0 : 1;
  }
  // freeze discipline (T-13): rileggi dopo la generazione.
  const after = read();
  if (sha256(after) !== doc.sha256) {
    console.log('RICHIESTE.md cambiato durante la generazione — rigenero (T-13, tentativo 2)');
    full = after;
    doc = parseRichieste(full);
    parts = buildSplit(doc, cutoff);
    check = unionCheck(doc, parts);
    if (sha256(read()) !== doc.sha256) {
      const dir = path.join(repoRoot, STAGED_DIR);
      mkdirSync(dir, { recursive: true });
      writeFileSync(path.join(dir, 'RICHIESTE.md'), parts.active);
      writeFileSync(path.join(dir, 'RICHIESTE-backlog.md'), parts.backlog);
      writeFileSync(path.join(dir, 'RICHIESTE-archive.md'), parts.archive);
      console.log(`unstable file, staged → ${STAGED_DIR}/ (nessun file di lavoro mutato)`);
      return 2;
    }
  }
  if (!check.ok) {
    console.error('union-check FALLITO — nessun file scritto');
    printSplitStats(parts, check);
    return 1;
  }
  writeFileSync(path.join(repoRoot, 'RICHIESTE.md'), parts.active);
  writeFileSync(path.join(repoRoot, 'RICHIESTE-backlog.md'), parts.backlog);
  writeFileSync(path.join(repoRoot, 'RICHIESTE-archive.md'), parts.archive);
  const manifestPath = writeManifest(repoRoot, doc, parts, check, cutoff);
  console.log('split --apply completato:');
  printSplitStats(parts, check);
  console.log(`manifest → ${manifestPath}`);
  return 0;
}

function cmdCheck(repoRoot: string, cap: number): number {
  const file = path.join(repoRoot, RICHIESTE_PARTS[0]);
  if (!existsSync(file)) {
    console.error(`${RICHIESTE_PARTS[0]} assente`);
    return 1;
  }
  const text = readFileSync(file, 'utf8');
  const chars = text.length;
  const bytes = Buffer.byteLength(text, 'utf8');
  const ok = chars <= cap && bytes <= cap;
  console.log(
    `richeste:check ${RICHIESTE_PARTS[0]} = ${chars} chars / ${bytes} bytes (cap ${cap}) → ${ok ? 'PASS' : 'FAIL'}`,
  );
  return ok ? 0 : 1;
}

function main(): void {
  const args = process.argv.slice(2);
  const cmd = args[0];
  const cutoffArg = args[args.indexOf('--cutoff') + 1];
  const cutoff = args.includes('--cutoff') && cutoffArg ? cutoffArg : DEFAULT_CUTOFF;
  const repoRoot = process.cwd();
  let code: number;
  switch (cmd) {
    case 'inventory':
      code = cmdInventory(repoRoot, args.includes('--json'), cutoff);
      break;
    case 'split':
      code = cmdSplit(repoRoot, args.includes('--apply'), cutoff);
      break;
    case 'check': {
      const capIdx = args.indexOf('--cap');
      const cap = capIdx >= 0 ? Number(args[capIdx + 1]) : NaN;
      if (!Number.isFinite(cap) || cap <= 0) {
        console.error('uso: richesteSplit.ts check --cap <chars>');
        code = 2;
        break;
      }
      code = cmdCheck(repoRoot, cap);
      break;
    }
    default:
      console.error(
        'uso: richesteSplit.ts <inventory [--json] | split [--dry-run|--apply] [--cutoff D] | check --cap N>',
      );
      code = 2;
  }
  process.exit(code);
}

if (process.argv[1] && /richesteSplit\.ts$/.test(process.argv[1])) main();
