/**
 * ledgerSplit — PLAN-123: split byte-preserving di `context/DECISION_LOG.md`
 * e digest meccanico di `.mw/desiderata.md`.
 *
 *   npx tsx scripts/ledgerSplit.ts decision-log inventory [--json]
 *   npx tsx scripts/ledgerSplit.ts decision-log split [--dry-run|--apply] [--cutoff YYYY-MM-DD]
 *   npx tsx scripts/ledgerSplit.ts desiderata digest [--check] [--cap N]
 *   npx tsx scripts/ledgerSplit.ts check --cap <chars>
 *
 * Regole meccaniche (ruling Director 2026-11-15: D-1=a, D-2=c, D-3=50k, D-4=no-op):
 *
 * DECISION_LOG (split reale):
 *   - header originale + entry datate `## YYYY-MM-DD —` con data >= cutoff
 *     (default 2026-10-24) → `context/DECISION_LOG.md` (attivo, header
 *     byte-identico);
 *   - tutte le altre sezioni `## ` (14 legacy non-datate — `Decision NNN`,
 *     `Regressions Found & Fixed`, `Open Questions`, `Future Decisions` —
 *     + datate < cutoff) → `context/DECISION_LOG-archive.md` (copia header
 *     + una riga di provenienza).
 *   Invarianti (OB-1/OB-2): multiset sha256-per-sezione identico; riordinando
 *   le sezioni per indice originale sopra l'header originale si riottene il
 *   file byte-per-byte; conteggio sezioni prima == dopo.
 *
 * DESIDERATA (D-2c — digest, NON split):
 *   - `.mw/desiderata.md` canonico RESTA BYTE-INTATTO (egress sancito di
 *     `mw-desiderata-slice`/desiderata_slice — sha256 prima == dopo);
 *   - si genera `.mw/desiderata-digest.md` = header/provenienza + una riga
 *     indice per sezione `## vNN` (titolo + ~100 char) + corpo verbatim del
 *     suffisso vK..vN più grande che mantiene il digest <= cap (50.000).
 *   - il digest è deterministico (nessun timestamp): `--check` lo rigenera
 *     e confronta byte-per-byte con quello su disco.
 *
 * `check --cap` = guard permanente (`npm run ledger:check`): attivo
 * DECISION_LOG <= cap, digest <= cap, indice digest copre tutte le vNN del
 * canonico, digest rigenera byte-identico.
 *
 * Disciplina freeze (T-13): --apply / digest ri-leggono il sorgente dopo la
 * generazione; se l'hash cambia rigenerano una volta, poi se ancora
 * instabile scrivono le parti in .mw/runs/plan123-ledger-split/staged/
 * senza toccare i file di lavoro — nessun byte perso.
 */
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

/* ------------------------------------------------------------- costanti */

export const DECISION_LOG_PARTS = [
  'context/DECISION_LOG.md',
  'context/DECISION_LOG-archive.md',
] as const;

export const DESIDERATA_PATH = path.join('.mw', 'desiderata.md');
export const DESIDERATA_DIGEST_PATH = path.join('.mw', 'desiderata-digest.md');

export const DEFAULT_CUTOFF = '2026-10-24';
export const DEFAULT_CAP = 50_000;
const RUN_DIR = path.join('.mw', 'runs', 'plan123-ledger-split');
const STAGED_DIR = path.join(RUN_DIR, 'staged');
const SPLIT_TAG = 'split PLAN-123 2026-11-15';

const SECTION_HEAD_RE = /^## [^\n]*$/gm;
/** Matchano `title` (heading SENZA il prefisso `## `). */
const DATED_HEAD_RE = /^(\d{4}-\d{2}-\d{2}) — /;
const DECISION_HEAD_RE = /^(Decision \w+)/;
const VN_HEAD_ALL_RE = /^## v(\d+)(?:[^\S\n]*—[^\S\n]*(.*))?$/gm;

function sha256(text: string): string {
  return createHash('sha256').update(text, 'utf8').digest('hex');
}

/* -------------------------------------------------- DECISION_LOG parsing */

export interface DecisionLogSection {
  /** `YYYY-MM-DD` per entry datate; `Decision-NNN` per legacy Decision;
   *  slug del titolo per le altre legacy (Regressions/Open/Future). */
  id: string;
  /** 'dated' | 'legacy' */
  kind: 'dated' | 'legacy';
  /** data heading per kind 'dated', null altrimenti. */
  date: string | null;
  /** testo completo dell'heading (senza `## `). */
  title: string;
  index: number;
  start: number;
  end: number;
  chars: number;
  sha256: string;
}

export interface DecisionLogDoc {
  header: string;
  sections: DecisionLogSection[];
  sectionTexts: string[];
  sha256: string;
}

/** Parsa il ledger: header = prima del primo `## `; sezione = heading→prossimo. */
export function parseDecisionLog(text: string): DecisionLogDoc {
  const heads: { title: string; start: number }[] = [];
  const re = new RegExp(SECTION_HEAD_RE.source, 'gm');
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) heads.push({ title: m[0].slice(3), start: m.index });
  const header = text.slice(0, heads.length > 0 ? heads[0].start : text.length);
  const sections: DecisionLogSection[] = [];
  const sectionTexts: string[] = [];
  heads.forEach((h, i) => {
    const end = i + 1 < heads.length ? heads[i + 1].start : text.length;
    const body = text.slice(h.start, end);
    const dm = DATED_HEAD_RE.exec(h.title);
    const dec = DECISION_HEAD_RE.exec(h.title);
    const id = dm
      ? dm[1]
      : dec
        ? dec[1].replace(/\s+/g, '-')
        : h.title
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '');
    sectionTexts.push(body);
    sections.push({
      id,
      kind: dm ? 'dated' : 'legacy',
      date: dm ? dm[1] : null,
      title: h.title,
      index: i,
      start: h.start,
      end,
      chars: body.length,
      sha256: sha256(body),
    });
  });
  return { header, sections, sectionTexts, sha256: sha256(text) };
}

/** D-1=a: 'active' sse la sezione è datata con data >= cutoff. */
export function destOfSection(s: DecisionLogSection, cutoff: string): 'active' | 'archive' {
  return s.date !== null && s.date >= cutoff ? 'active' : 'archive';
}

interface DecisionLogSplit {
  active: string;
  archive: string;
}

/** Attivo: header byte-identico. Archivio: copia header + riga provenienza. */
function buildDecisionLogSplit(doc: DecisionLogDoc, cutoff: string): DecisionLogSplit {
  const active: string[] = [];
  const archive: string[] = [];
  doc.sections.forEach((s, i) => {
    (destOfSection(s, cutoff) === 'active' ? active : archive).push(doc.sectionTexts[i]);
  });
  const provenance =
    `# DECISION_LOG-archive — sezioni antecedenti il cutoff ${cutoff} ` +
    `(incluse le 14 legacy non-datate) — ${SPLIT_TAG}. ` +
    `Unico file in scrittura: context/DECISION_LOG.md.\n\n`;
  return {
    active: doc.header + active.join(''),
    archive: doc.header + provenance + archive.join(''),
  };
}

interface UnionCheck {
  ok: boolean;
  recomposedSha256: string;
  originalSha256: string;
  headerIdentical: boolean;
  sectionCountBefore: number;
  sectionCountAfter: number;
  multisetIdentical: boolean;
  orderPreserved: boolean;
}

/** OB-1/OB-2: header attivo identico, multiset sha identico, ricomposizione
 *  ordinata (header originale + sezioni per indice) byte-identica. */
export function unionCheck(original: DecisionLogDoc, parts: DecisionLogSplit): UnionCheck {
  const partDocs = [parts.active, parts.archive].map(parseDecisionLog);
  const all = partDocs.flatMap((d) => d.sections.map((s, i) => ({ s, text: d.sectionTexts[i] })));
  const origIndexBySha = new Map(original.sections.map((s) => [s.sha256, s.index]));
  const recomposed =
    original.header +
    all
      .sort((a, b) => (origIndexBySha.get(a.s.sha256) ?? 0) - (origIndexBySha.get(b.s.sha256) ?? 0))
      .map((x) => x.text)
      .join('');
  const before = original.sections.map((s) => s.sha256).sort();
  const after = all.map((x) => x.s.sha256).sort();
  const recomposedSha = sha256(recomposed);
  const multiset =
    before.length === after.length && before.every((h, i) => h === after[i]);
  return {
    ok: partDocs[0].header === original.header && multiset && recomposedSha === original.sha256,
    recomposedSha256: recomposedSha,
    originalSha256: original.sha256,
    headerIdentical: partDocs[0].header === original.header,
    sectionCountBefore: original.sections.length,
    sectionCountAfter: all.length,
    multisetIdentical: multiset,
    orderPreserved: recomposedSha === original.sha256,
  };
}

/* --------------------------------------------------- desiderata digest */

export interface DesiderataSection {
  /** numero di versione (vN → N). */
  v: number;
  /** titolo heading dopo `## vN — ` ('' per heading nude come `## v1`). */
  title: string;
  index: number;
  start: number;
  end: number;
  chars: number;
  sha256: string;
}

export interface DesiderataDoc {
  header: string;
  sections: DesiderataSection[];
  sectionTexts: string[];
  sha256: string;
}

/** Parsa il canonico: header = prima di `## v1`; sezione = `## vN`→prossimo. */
export function parseDesiderata(text: string): DesiderataDoc {
  const heads: { v: number; title: string; start: number }[] = [];
  let m: RegExpExecArray | null;
  const reAll = new RegExp(VN_HEAD_ALL_RE.source, 'gm');
  while ((m = reAll.exec(text)) !== null) {
    heads.push({ v: Number(m[1]), title: (m[2] ?? '').trim(), start: m.index });
  }
  const header = text.slice(0, heads.length > 0 ? heads[0].start : text.length);
  const sections: DesiderataSection[] = [];
  const sectionTexts: string[] = [];
  heads.forEach((h, i) => {
    const end = i + 1 < heads.length ? heads[i + 1].start : text.length;
    const body = text.slice(h.start, end);
    sectionTexts.push(body);
    sections.push({
      v: h.v,
      title: h.title,
      index: i,
      start: h.start,
      end,
      chars: body.length,
      sha256: sha256(body),
    });
  });
  return { header, sections, sectionTexts, sha256: sha256(text) };
}

/** Prima riga «di contenuto» del body: salta righe vuote, `---` e label
 *  `**Label:**` (con o senza testo a seguire). Troncata a ~100 char. */
function summaryLine(sectionText: string): string {
  for (const raw of sectionText.split('\n').slice(1)) {
    const line = raw.trim();
    if (!line || line === '---') continue;
    if (/^\*\*[^*\n]+:\*\*/.test(line)) continue;
    return line.length > 100 ? line.slice(0, 97).trimEnd() + '…' : line;
  }
  return '';
}

export interface DesiderataDigest {
  text: string;
  /** prima versione del suffisso verbatim (vK). */
  suffixFrom: number;
  /** numero di sezioni verbatim nel suffisso. */
  suffixCount: number;
  canonicalSha256: string;
}

/** Genera il digest deterministico: header/provenienza + indice completo +
 *  corpo verbatim del suffisso vK..vN più grande sotto cap. */
export function buildDigest(doc: DesiderataDoc, cap: number): DesiderataDigest {
  const lastV = doc.sections.length > 0 ? doc.sections[doc.sections.length - 1].v : 0;
  const indexLines = doc.sections.map((s, i) => {
    const sum = summaryLine(doc.sectionTexts[i]);
    const title = s.title || '(senza titolo in heading)';
    return `- **v${s.v}** — ${title}${sum ? ` — ${sum}` : ''}`;
  });
  const head = (k: number) =>
    `# Desiderata — digest (PLAN-123)\n\n` +
    `> File in read-list AGENTS.md. Generato meccanicamente da\n` +
    `> \`npx tsx scripts/ledgerSplit.ts desiderata digest\` — deterministico,\n` +
    `> non editare a mano. Il canonico \`.mw/desiderata.md\` (sha256\n` +
    `> ${doc.sha256.slice(0, 16)}…, ${doc.sections.length} sezioni v1–v${lastV})\n` +
    `> resta BYTE-INTATTO ed è l'unica fonte per lo slice tooling\n` +
    `> (\`mw-desiderata-slice\`/\`desiderata_slice\`).\n` +
    `> Questo digest: indice completo + corpo verbatim di v${k}–v${lastV}\n` +
    `> (suffisso più grande ≤ ${cap} char).\n\n` +
    `## Indice delle versioni\n\n` +
    indexLines.join('\n') +
    `\n\n## Corpo verbatim — v${k}–v${lastV}\n\n`;
  // suffisso più grande sotto cap: prova k da v1 verso il fondo
  let chosen = doc.sections.length; // indice di inizio (>= length = vuoto)
  for (let k = 0; k < doc.sections.length; k++) {
    const v = doc.sections[k].v;
    const candidate = head(v) + doc.sectionTexts.slice(k).join('');
    if (candidate.length <= cap && Buffer.byteLength(candidate, 'utf8') <= cap) {
      chosen = k;
      break;
    }
  }
  const k = chosen < doc.sections.length ? doc.sections[chosen].v : lastV;
  const text =
    chosen < doc.sections.length
      ? head(k) + doc.sectionTexts.slice(chosen).join('')
      : head(k); // nessuna sezione sta sotto cap: solo indice
  return {
    text,
    suffixFrom: k,
    suffixCount: chosen < doc.sections.length ? doc.sections.length - chosen : 0,
    canonicalSha256: doc.sha256,
  };
}

/* ---------------------------------------------------------- subcommands */

function decisionLogInventory(repoRoot: string, jsonOut: boolean, cutoff: string): number {
  const file = path.join(repoRoot, DECISION_LOG_PARTS[0]);
  const full = readFileSync(file, 'utf8');
  const doc = parseDecisionLog(full);
  const histogram = { active: { count: 0, chars: 0 }, archive: { count: 0, chars: 0 } };
  const byMonth: Record<string, { count: number; chars: number }> = {};
  const sections = doc.sections.map((s) => {
    const dest = destOfSection(s, cutoff);
    histogram[dest].count += 1;
    histogram[dest].chars += s.chars;
    if (s.date) {
      const mo = s.date.slice(0, 7);
      byMonth[mo] = byMonth[mo] ?? { count: 0, chars: 0 };
      byMonth[mo].count += 1;
      byMonth[mo].chars += s.chars;
    }
    return { ...s, dest };
  });
  // desiderata inventory (contestuale: stesso run dir, stesso contratto)
  const desFile = path.join(repoRoot, DESIDERATA_PATH);
  const desFull = existsSync(desFile) ? readFileSync(desFile, 'utf8') : '';
  const des = parseDesiderata(desFull);
  const desInv = {
    file: DESIDERATA_PATH,
    file_chars: desFull.length,
    file_bytes: Buffer.byteLength(desFull, 'utf8'),
    file_sha256: des.sha256,
    header_chars: des.header.length,
    sections: des.sections.map((s) => ({ v: s.v, title: s.title, chars: s.chars, sha256: s.sha256 })),
  };
  const inv = {
    generated_at: new Date().toISOString(),
    plan: 'PLAN-123',
    cutoff,
    decision_log: {
      file: DECISION_LOG_PARTS[0],
      file_chars: full.length,
      file_bytes: Buffer.byteLength(full, 'utf8'),
      file_sha256: doc.sha256,
      header_chars: doc.header.length,
      section_count: doc.sections.length,
      histogram,
      by_month: byMonth,
      sections,
    },
    desiderata: desInv,
  };
  const dir = path.join(repoRoot, RUN_DIR);
  mkdirSync(dir, { recursive: true });
  const out = path.join(dir, 'inventory.json');
  writeFileSync(out, JSON.stringify(inv, null, 2));
  console.log(`inventory → ${out}`);
  console.log(
    `DECISION_LOG: ${doc.sections.length} sezioni · header ${doc.header.length} · file ${full.length} chars`,
  );
  console.log(
    `  active ${histogram.active.count}/${histogram.active.chars} · archive ${histogram.archive.count}/${histogram.archive.chars}`,
  );
  console.log(`desiderata: ${des.sections.length} sezioni vN · ${desFull.length} chars`);
  if (jsonOut) console.log(JSON.stringify(inv, null, 2));
  return 0;
}

function printDecisionLogStats(parts: DecisionLogSplit, check: UnionCheck): void {
  for (const [label, text] of [
    ['DECISION_LOG.md        ', parts.active],
    ['DECISION_LOG-archive.md', parts.archive],
  ] as const) {
    const d = parseDecisionLog(text);
    console.log(
      `  ${label}: ${d.sections.length} sezioni, ${text.length} chars (${Buffer.byteLength(text, 'utf8')} bytes)`,
    );
  }
  console.log('union-check:');
  console.log(`  header attivo byte-identico : ${check.headerIdentical}`);
  console.log(`  sezioni ${check.sectionCountBefore} → ${check.sectionCountAfter}`);
  console.log(`  multiset sha-per-sezione    : ${check.multisetIdentical}`);
  console.log(`  ordine preservato (sha)     : ${check.orderPreserved}`);
  console.log(`  original sha256  : ${check.originalSha256}`);
  console.log(`  recomposed sha256: ${check.recomposedSha256}`);
  console.log(`  RESULT: ${check.ok ? 'PASS' : 'FAIL'}`);
}

function writeManifest(
  repoRoot: string,
  doc: DecisionLogDoc,
  parts: DecisionLogSplit,
  check: UnionCheck,
  cutoff: string,
  desSha: string | null,
): string {
  const manifest = {
    plan: 'PLAN-123',
    applied_at: new Date().toISOString(),
    cutoff,
    original_sha256: doc.sha256,
    header_sha256: sha256(doc.header),
    desiderata_sha256_untouched: desSha,
    union_check: check,
    section_order: doc.sections.map((s, i) => ({
      index: s.index,
      id: s.id,
      kind: s.kind,
      date: s.date,
      dest: destOfSection(s, cutoff),
      sha256: s.sha256,
      order: i,
    })),
    parts: {
      'context/DECISION_LOG.md': { sha256: sha256(parts.active), chars: parts.active.length },
      'context/DECISION_LOG-archive.md': {
        sha256: sha256(parts.archive),
        chars: parts.archive.length,
      },
    },
  };
  const dir = path.join(repoRoot, RUN_DIR);
  mkdirSync(dir, { recursive: true });
  const p = path.join(dir, 'split-manifest.json');
  writeFileSync(p, JSON.stringify(manifest, null, 2));
  return p;
}

function cmdDecisionLogSplit(repoRoot: string, apply: boolean, cutoff: string): number {
  const file = path.join(repoRoot, DECISION_LOG_PARTS[0]);
  const read = () => readFileSync(file, 'utf8');
  let full = read();
  let doc = parseDecisionLog(full);
  let parts = buildDecisionLogSplit(doc, cutoff);
  let check = unionCheck(doc, parts);
  if (!apply) {
    console.log(`decision-log split --dry-run (cutoff ${cutoff})`);
    printDecisionLogStats(parts, check);
    return check.ok ? 0 : 1;
  }
  // freeze discipline (T-13): rileggi dopo la generazione.
  const after = read();
  if (sha256(after) !== doc.sha256) {
    console.log('DECISION_LOG.md cambiato durante la generazione — rigenero (T-13, tentativo 2)');
    full = after;
    doc = parseDecisionLog(full);
    parts = buildDecisionLogSplit(doc, cutoff);
    check = unionCheck(doc, parts);
    if (sha256(read()) !== doc.sha256) {
      const dir = path.join(repoRoot, STAGED_DIR);
      mkdirSync(dir, { recursive: true });
      writeFileSync(path.join(dir, 'DECISION_LOG.md'), parts.active);
      writeFileSync(path.join(dir, 'DECISION_LOG-archive.md'), parts.archive);
      console.log(`unstable file, staged → ${STAGED_DIR}/ (nessun file di lavoro mutato)`);
      return 2;
    }
  }
  if (!check.ok) {
    console.error('union-check FALLITO — nessun file scritto');
    printDecisionLogStats(parts, check);
    return 1;
  }
  writeFileSync(file, parts.active);
  writeFileSync(path.join(repoRoot, DECISION_LOG_PARTS[1]), parts.archive);
  const desPath = path.join(repoRoot, DESIDERATA_PATH);
  const desSha = existsSync(desPath) ? sha256(readFileSync(desPath, 'utf8')) : null;
  const manifestPath = writeManifest(repoRoot, doc, parts, check, cutoff, desSha);
  console.log('decision-log split --apply completato:');
  printDecisionLogStats(parts, check);
  console.log(`manifest → ${manifestPath}`);
  return 0;
}

function cmdDesiderataDigest(repoRoot: string, checkOnly: boolean, cap: number): number {
  const file = path.join(repoRoot, DESIDERATA_PATH);
  const outFile = path.join(repoRoot, DESIDERATA_DIGEST_PATH);
  const read = () => readFileSync(file, 'utf8');
  let doc = parseDesiderata(read());
  let digest = buildDigest(doc, cap);
  if (checkOnly) {
    if (!existsSync(outFile)) {
      console.error(`${DESIDERATA_DIGEST_PATH} assente — generare con 'desiderata digest'`);
      return 1;
    }
    const onDisk = readFileSync(outFile, 'utf8');
    const ok = onDisk === digest.text;
    console.log(
      `desiderata digest --check: rigenerato ${digest.text.length} chars vs disco ${onDisk.length} chars → ${ok ? 'IDENTICO' : 'DIVERSO (rigenerare)'}`,
    );
    return ok ? 0 : 1;
  }
  // freeze discipline (T-13): il canonico non deve cambiare durante la generazione
  const after = read();
  if (sha256(after) !== doc.sha256) {
    console.log('desiderata.md cambiato durante la generazione — rigenero (T-13, tentativo 2)');
    doc = parseDesiderata(after);
    digest = buildDigest(doc, cap);
    if (sha256(read()) !== doc.sha256) {
      const dir = path.join(repoRoot, STAGED_DIR);
      mkdirSync(dir, { recursive: true });
      writeFileSync(path.join(dir, 'desiderata-digest.md'), digest.text);
      console.log(`unstable file, staged → ${STAGED_DIR}/ (nessun file di lavoro mutato)`);
      return 2;
    }
  }
  writeFileSync(outFile, digest.text);
  console.log(
    `desiderata digest → ${DESIDERATA_DIGEST_PATH}: ${digest.text.length} chars ` +
      `(${Buffer.byteLength(digest.text, 'utf8')} bytes) · verbatim v${digest.suffixFrom}+ ` +
      `(${digest.suffixCount} sezioni) · canonico sha256 ${digest.canonicalSha256.slice(0, 16)}… INTATTO`,
  );
  return digest.text.length <= cap ? 0 : 1;
}

/** Guard permanente (npm run ledger:check). */
function cmdCheck(repoRoot: string, cap: number): number {
  let ok = true;
  const line = (label: string, pass: boolean, detail: string) => {
    if (!pass) ok = false;
    console.log(`  ${label}: ${detail} → ${pass ? 'PASS' : 'FAIL'}`);
  };
  // 1. DECISION_LOG attivo <= cap
  const dlPath = path.join(repoRoot, DECISION_LOG_PARTS[0]);
  if (!existsSync(dlPath)) {
    line('DECISION_LOG attivo', false, 'file assente');
  } else {
    const t = readFileSync(dlPath, 'utf8');
    const bytes = Buffer.byteLength(t, 'utf8');
    line('DECISION_LOG attivo', t.length <= cap && bytes <= cap, `${t.length} chars / ${bytes} bytes (cap ${cap})`);
  }
  // 2. digest <= cap + copertura vNN + determinismo
  const digPath = path.join(repoRoot, DESIDERATA_DIGEST_PATH);
  const desPath = path.join(repoRoot, DESIDERATA_PATH);
  if (!existsSync(digPath)) {
    line('desiderata-digest', false, 'file assente');
  } else {
    const t = readFileSync(digPath, 'utf8');
    const bytes = Buffer.byteLength(t, 'utf8');
    line('desiderata-digest', t.length <= cap && bytes <= cap, `${t.length} chars / ${bytes} bytes (cap ${cap})`);
    if (existsSync(desPath)) {
      const des = parseDesiderata(readFileSync(desPath, 'utf8'));
      const covered = des.sections.every(
        (s) =>
          new RegExp(`^## v${s.v}\\b`, 'm').test(t) ||
          new RegExp(`\\*\\*v${s.v}\\*\\*`).test(t),
      );
      line(
        'digest copre tutte le vNN',
        covered,
        `${des.sections.length} sezioni v${des.sections[0]?.v ?? '?'}–v${des.sections[des.sections.length - 1]?.v ?? '?'}`,
      );
      const regen = buildDigest(des, cap).text === t;
      line('digest deterministico', regen, 'rigenerazione byte-identica');
    } else {
      line('desiderata canonico', false, `${DESIDERATA_PATH} assente`);
    }
  }
  console.log(`ledger:check RESULT: ${ok ? 'PASS' : 'FAIL'}`);
  return ok ? 0 : 1;
}

function main(): void {
  const args = process.argv.slice(2);
  const repoRoot = process.cwd();
  const capIdx = args.indexOf('--cap');
  const cap = capIdx >= 0 ? Number(args[capIdx + 1]) : DEFAULT_CAP;
  const cutoffIdx = args.indexOf('--cutoff');
  const cutoff = cutoffIdx >= 0 ? args[cutoffIdx + 1] : DEFAULT_CUTOFF;
  let code: number;
  if (args[0] === 'decision-log' && args[1] === 'inventory') {
    code = decisionLogInventory(repoRoot, args.includes('--json'), cutoff);
  } else if (args[0] === 'decision-log' && args[1] === 'split') {
    code = cmdDecisionLogSplit(repoRoot, args.includes('--apply'), cutoff);
  } else if (args[0] === 'desiderata' && args[1] === 'digest') {
    if (!Number.isFinite(cap) || cap <= 0) {
      console.error('uso: ledgerSplit.ts desiderata digest [--check] [--cap N]');
      code = 2;
    } else {
      code = cmdDesiderataDigest(repoRoot, args.includes('--check'), cap);
    }
  } else if (args[0] === 'check') {
    if (!Number.isFinite(cap) || cap <= 0) {
      console.error('uso: ledgerSplit.ts check --cap <chars>');
      code = 2;
    } else {
      code = cmdCheck(repoRoot, cap);
    }
  } else {
    console.error(
      'uso: ledgerSplit.ts <decision-log inventory [--json] | decision-log split [--dry-run|--apply] [--cutoff D] | desiderata digest [--check] [--cap N] | check --cap N>',
    );
    code = 2;
  }
  process.exit(code);
}

if (process.argv[1] && /ledgerSplit\.ts$/.test(process.argv[1])) main();
