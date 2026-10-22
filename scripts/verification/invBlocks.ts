/**
 * invBlocks — PLAN-054 T-002: estrattore AST dei blocchi `// INV:<id>`
 * dentro i file di test, per il ratchet delle asserzioni su `BASE`.
 *
 * Regole (artifact r009 §2.2 Mode B / WITNESS-12/17):
 *  - blocco `// INV:<id>` = il `test`/`it` che segue il tag + gli hook
 *    racchiudenti (`beforeEach`/`beforeAll`) dello `describe` più interno;
 *  - il dataset di `test.each`/`it.each` è canonizzato **per valore**
 *    (literal-fold); ciò che non è foldable → `extractable: false`
 *    (fail-closed verso Mode B-amend);
 *  - il multiset delle asserzioni = chiamate `expect(...)` dirette nel
 *    body del test, con catena di matcher serializzata;
 *  - il tag stesso fa parte del blocco canonico (rinominarlo = cambio);
 *  - duplicati di `// INV:<id>` (stesso file o file diversi) sono
 *    segnalati dal gate con entrambi i file.
 */
import ts from 'typescript';
import { sha256Text } from './gateCore';

export interface InvAssertion {
  /** Forma canonica: `expect(<arg>)` + catena matcher, whitespace normalizzato. */
  canonical: string;
}

export interface InvBlock {
  id: string;
  file: string;
  /** Titoli describe dalla radice esterna a quella interna. */
  describePath: string[];
  /**
   * Titolo letterale del/dei test che ospitano il tag (stringa canonica;
   * `test.each` conserva i placeholder `%s`/`%i` — il join coi conteggi
   * runtime usa il template matcher di livingSyncGate). Vuoto se il titolo
   * non è un letterale staticamente risolvibile.
   */
  testTitles: string[];
  /** Hash canonico del blocco esteso (hooks + tag + test). */
  blockHash: string;
  /** Multiset canonico delle asserzioni `expect` dirette (ordinato). */
  assertions: string[];
  /** Hash del dataset `test.each` canonizzato per valore (null = non `.each`). */
  datasetHash: string | null;
  /** false → costrutto non estraibile staticamente: fail-closed. */
  extractable: boolean;
  notExtractableReason?: string;
  usesSnapshot: boolean;
  /**
   * Il blocco usa `expect.poll(...)` o matcher `.toPass(...)`: il conteggio
   * runtime cumula i tentativi interni → l'executedCount registrato è il
   * floor statico (asserzioni dirette), mai il cumulato (artifact-r009).
   */
  usesPoll: boolean;
  /** true se il callee del test è `.skip`/`.todo`/`.fixme` → non eseguibile. */
  skipped: boolean;
}

/* ------------------------------------------------------------------ */
/* Canonizzazione                                                      */
/* ------------------------------------------------------------------ */

const stripComments = (s: string) =>
  s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/[^\n]*/g, '$1');

/** Testo canonico di una espressione: commenti via, whitespace collassato. */
export function canonText(node: ts.Node): string {
  return stripComments(node.getText()).replace(/\s+/g, ' ').trim();
}

/** Valore JSON-like o marker non-foldable. */
type Folded = { ok: true; value: unknown } | { ok: false };

const LIT_BINOPS: Partial<Record<ts.SyntaxKind, (a: any, b: any) => unknown>> = {
  [ts.SyntaxKind.PlusToken]: (a, b) => a + b,
  [ts.SyntaxKind.MinusToken]: (a, b) => a - b,
  [ts.SyntaxKind.AsteriskToken]: (a, b) => a * b,
  [ts.SyntaxKind.SlashToken]: (a, b) => a / b,
  [ts.SyntaxKind.PercentToken]: (a, b) => a % b,
};

/**
 * Literal-fold deterministico: numeri, stringhe, booleani, null,
 * undefined, array/object di foldable, unari + - ! ~, binari
 * aritmetici su foldable, `as`/`satisfies`/parentesi, template
 * con sole sostituzioni foldable. Tutto il resto → non foldable.
 */
export function literalFold(expr: ts.Expression): Folded {
  const e = unwrap(expr);
  if (ts.isNumericLiteral(e) || ts.isStringLiteral(e) || ts.isNoSubstitutionTemplateLiteral(e)) {
    const v = ts.isNumericLiteral(e) ? Number(e.text) : e.text;
    return { ok: true, value: v };
  }
  if (e.kind === ts.SyntaxKind.TrueKeyword) return { ok: true, value: true };
  if (e.kind === ts.SyntaxKind.FalseKeyword) return { ok: true, value: false };
  if (e.kind === ts.SyntaxKind.NullKeyword) return { ok: true, value: null };
  if (ts.isIdentifier(e) && e.text === 'undefined') return { ok: true, value: null };
  if (ts.isPrefixUnaryExpression(e)) {
    const v = literalFold(e.operand);
    if (!v.ok || typeof v.value !== 'number') {
      if (e.operator === ts.SyntaxKind.ExclamationToken && v.ok) return { ok: true, value: !v.value };
      return { ok: false };
    }
    if (e.operator === ts.SyntaxKind.MinusToken) return { ok: true, value: -v.value };
    if (e.operator === ts.SyntaxKind.PlusToken) return { ok: true, value: +v.value };
    if (e.operator === ts.SyntaxKind.TildeToken) return { ok: true, value: ~v.value };
    return { ok: false };
  }
  if (ts.isBinaryExpression(e)) {
    const l = literalFold(e.left);
    const r = literalFold(e.right);
    const op = LIT_BINOPS[e.operatorToken.kind];
    if (!l.ok || !r.ok || !op) return { ok: false };
    if (e.operatorToken.kind === ts.SyntaxKind.PlusToken) {
      const a = l.value, b = r.value;
      if (typeof a === 'number' && typeof b === 'number') return { ok: true, value: a + b };
      if (typeof a === 'string' && typeof b === 'string') return { ok: true, value: a + b };
      return { ok: false };
    }
    if (typeof l.value !== 'number' || typeof r.value !== 'number') return { ok: false };
    return { ok: true, value: op(l.value, r.value) };
  }
  if (ts.isArrayLiteralExpression(e)) {
    const out: unknown[] = [];
    for (const el of e.elements) {
      if (ts.isSpreadElement(el)) return { ok: false };
      const v = literalFold(el as ts.Expression);
      if (!v.ok) return { ok: false };
      out.push(v.value);
    }
    return { ok: true, value: out };
  }
  if (ts.isObjectLiteralExpression(e)) {
    const out: Record<string, unknown> = {};
    for (const p of e.properties) {
      if (!ts.isPropertyAssignment(p)) return { ok: false };
      const key = ts.isIdentifier(p.name) || ts.isStringLiteral(p.name) || ts.isNumericLiteral(p.name)
        ? p.name.text
        : null;
      if (key === null) return { ok: false };
      const v = literalFold(p.initializer);
      if (!v.ok) return { ok: false };
      out[key] = v.value;
    }
    return { ok: true, value: out };
  }
  if (ts.isTemplateExpression(e)) {
    let text = e.head.text;
    for (const span of e.templateSpans) {
      const v = literalFold(span.expression);
      if (!v.ok || (typeof v.value !== 'string' && typeof v.value !== 'number')) return { ok: false };
      text += String(v.value) + span.literal.text;
    }
    return { ok: true, value: text };
  }
  return { ok: false };
}

function unwrap(e: ts.Expression): ts.Expression {
  while (
    ts.isParenthesizedExpression(e) ||
    ts.isAsExpression(e) ||
    ts.isSatisfiesExpression(e) ||
    ts.isNonNullExpression(e) ||
    ts.isTypeAssertionExpression(e)
  ) {
    e = e.expression;
  }
  return e;
}

/** Serializzazione canonica per valore (chiavi oggetto ordinate). */
function canonValue(v: unknown): string {
  if (Array.isArray(v)) return `[${v.map(canonValue).join(',')}]`;
  if (v !== null && typeof v === 'object') {
    return `{${Object.keys(v as object)
      .sort()
      .map((k) => `${JSON.stringify(k)}:${canonValue((v as Record<string, unknown>)[k])}`)
      .join(',')}}`;
  }
  return JSON.stringify(v);
}

/* ------------------------------------------------------------------ */
/* Navigazione AST                                                     */
/* ------------------------------------------------------------------ */

/**
 * Nome callee di una call: `test`, `it`, `test.each`, `describe.each`, …
 * Attraversa le call annidate: per `it.each(ds)(t, fn)` la call esterna
 * risolve comunque a `{base:'it', chain:['each']}`.
 */
function calleeName(call: ts.CallExpression): { base: string; chain: string[] } | null {
  let cur: ts.Expression = call.expression;
  const chain: string[] = [];
  while (true) {
    if (ts.isCallExpression(cur)) {
      cur = cur.expression;
      continue;
    }
    if (ts.isPropertyAccessExpression(cur)) {
      chain.unshift(cur.name.text);
      cur = cur.expression;
      continue;
    }
    break;
  }
  if (ts.isIdentifier(cur)) return { base: cur.text, chain };
  return null;
}

const isTestCall = (c: { base: string; chain: string[] }) =>
  (c.base === 'test' || c.base === 'it') && !c.chain.some((p) => p === 'skip' || p === 'todo' || p === 'fixme');
const isDescribeCall = (c: { base: string; chain: string[] }) => c.base === 'describe' || c.base === 'suite';
const isHookCall = (c: { base: string; chain: string[] }) =>
  c.base === 'beforeEach' || c.base === 'beforeAll';

const SKIP_MARKERS = new Set(['skip', 'todo', 'fixme']);

/** Il CallExpression di un statement (gestisce `test.each(...)(...)` doppia call). */
function callOf(stmt: ts.Statement): ts.CallExpression | null {
  if (!ts.isExpressionStatement(stmt) || !ts.isCallExpression(stmt.expression)) return null;
  return stmt.expression;
}

/** Posizioni dei commenti `// INV:<id>` del file. */
export function invTagPositions(text: string): { id: string; pos: number }[] {
  const out: { id: string; pos: number }[] = [];
  const re = /\/\/\s*INV:([A-Za-z0-9][A-Za-z0-9_.-]*)/g;
  for (const m of text.matchAll(re)) out.push({ id: m[1], pos: m.index! });
  return out;
}

/** Serializza `expect(x).not.toBe(y)` → `expect(x)|not.toBe(y)` canonico. */
function canonExpectChain(expectCall: ts.CallExpression): string {
  const arg = expectCall.arguments[0];
  const head = `expect(${arg ? canonText(arg) : ''})`;
  const segments: string[] = [];
  let cur: ts.Node = expectCall.parent;
  while (cur) {
    if (ts.isPropertyAccessExpression(cur)) {
      segments.push(cur.name.text);
      cur = cur.parent;
      continue;
    }
    if (ts.isCallExpression(cur)) {
      const argsText = cur.arguments.map((a) => canonText(a)).join(', ');
      if (segments.length) segments[segments.length - 1] += `(${argsText})`;
      else segments.push(`(${argsText})`);
      cur = cur.parent;
      continue;
    }
    break;
  }
  return head + '|' + segments.join('.');
}

/* ------------------------------------------------------------------ */
/* Estrazione                                                          */
/* ------------------------------------------------------------------ */

export interface ScanResult {
  blocks: InvBlock[];
  /** id → file che lo contengono (>1 = duplicato globale). */
  duplicates: Record<string, string[]>;
  errors: string[];
}

export function scanInvBlocks(
  files: { path: string; text: string }[],
): ScanResult {
  const blocks: InvBlock[] = [];
  const errors: string[] = [];
  const seen = new Map<string, string[]>();

  for (const { path: file, text } of files) {
    const tags = invTagPositions(text);
    if (!tags.length) continue;
    const sf = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);

    /* Tutte le call `test/it` del file in ordine di posizione. */
    const testCalls: { call: ts.CallExpression; callee: { base: string; chain: string[] }; pos: number }[] = [];
    const visit = (n: ts.Node) => {
      if (ts.isCallExpression(n)) {
        /* Salta le call che sono esse stesse il callee di una call più
         * esterna (`it.each(ds)` dentro `it.each(ds)(t,fn)`): il test
         * è la call più esterna. */
        const isCalleeOfOuter =
          n.parent &&
          ((ts.isCallExpression(n.parent) && n.parent.expression === n) ||
            (ts.isPropertyAccessExpression(n.parent) && n.parent.expression === n &&
              n.parent.parent && ts.isCallExpression(n.parent.parent) && n.parent.parent.expression === n.parent));
        if (!isCalleeOfOuter) {
          const callee = calleeName(n);
          if (callee && (callee.base === 'test' || callee.base === 'it')) {
            testCalls.push({ call: n, callee, pos: n.getStart(sf) });
          }
        }
      }
      ts.forEachChild(n, visit);
    };
    visit(sf);

    for (const tag of tags) {
      const prev = seen.get(tag.id) ?? [];
      if (!prev.includes(file)) seen.set(tag.id, [...prev, file]);
      const next = testCalls.filter((t) => t.pos > tag.pos).sort((a, b) => a.pos - b.pos)[0];
      if (!next) {
        blocks.push({
          id: tag.id,
          file,
          describePath: [],
          testTitles: [],
          blockHash: '',
          assertions: [],
          datasetHash: null,
          extractable: false,
          notExtractableReason: 'nessun test/it dopo il tag // INV',
          usesSnapshot: false,
          usesPoll: false,
          skipped: false,
        });
        continue;
      }

      /* Titolo letterale del test (join conteggi runtime). */
      const titleArg = next.call.arguments[0];
      const foldedTitle = titleArg ? literalFold(titleArg) : { ok: false as const };
      const testTitle =
        foldedTitle.ok && typeof foldedTitle.value === 'string'
          ? foldedTitle.value
          : titleArg && ts.isNoSubstitutionTemplateLiteral(titleArg)
            ? titleArg.text
            : null;

      const skipped = next.callee.chain.some((p) => SKIP_MARKERS.has(p));

      /* Describe più interno che racchiude il test. */
      let desc: ts.CallExpression | null = null;
      let anc: ts.Node | undefined = next.call.parent;
      while (anc) {
        if (ts.isCallExpression(anc)) {
          const c = calleeName(anc);
          if (c && isDescribeCall(c)) { desc = anc; break; }
        }
        anc = anc.parent;
      }
      const describePath: string[] = [];
      let d2: ts.Node | undefined = desc;
      while (d2) {
        if (ts.isCallExpression(d2)) {
          const c = calleeName(d2);
          if (c && isDescribeCall(c)) {
            const title = d2.arguments[0] ? canonText(d2.arguments[0]) : '';
            describePath.unshift(title);
          }
        }
        d2 = d2.parent;
      }

      /* Hook beforeEach/beforeAll nello stesso describe + il test taggato. */
      const parts: string[] = [];
      if (desc) {
        const body = desc.arguments
          .filter(ts.isFunctionLike)
          .map((f) => f.body)
          .filter(ts.isBlock)[0];
        if (body) {
          for (const st of body.statements) {
            const call = callOf(st);
            if (!call) continue;
            const c = calleeName(call);
            if (c && isHookCall(c)) parts.push(canonText(st));
          }
        }
      }
      parts.push(`// INV:${tag.id}`);
      parts.push(canonText(next.call));

      /* Asserzioni: `expect(...)` dentro il body del callback del test.
       * Il callback è l'ultimo argomento function-like della call —
       * per `test.each(d)(t, fn)` la call esterna ha (t, fn). */
      const cb = [...next.call.arguments].reverse().find(ts.isFunctionLike);
      const assertions: string[] = [];
      let usesSnapshot = false;
      const usesPoll = cb?.body ? /expect\s*\.\s*poll\s*\(|\.toPass\s*\(/.test(cb.body.getText()) : false;
      if (cb?.body) {
        const walk = (n: ts.Node) => {
          if (ts.isCallExpression(n)) {
            const e = n.expression;
            /* `expect(x)` diretto oppure `expect.poll(cb, opts)`: il
             * polling conta UNA asserzione per blocco (floor statico),
             * coerente con resolveExecutedCount per usesPoll. */
            const isDirect = ts.isIdentifier(e) && e.text === 'expect';
            const isPoll =
              ts.isPropertyAccessExpression(e) &&
              ts.isIdentifier(e.expression) &&
              e.expression.text === 'expect' &&
              e.name.text === 'poll';
            if (isDirect || isPoll) {
              const arg = n.arguments[0];
              const head = `${isPoll ? 'expect.poll' : 'expect'}(${arg ? canonText(arg) : ''})`;
              const outer = ascendChain(n);
              const segments: string[] = [];
              let cur: ts.Node | undefined = n.parent;
              while (cur) {
                if (ts.isPropertyAccessExpression(cur)) {
                  segments.push(cur.name.text);
                  cur = cur.parent;
                  continue;
                }
                if (ts.isCallExpression(cur)) {
                  const argsText = cur.arguments.map((a) => canonText(a)).join(', ');
                  if (segments.length) segments[segments.length - 1] += `(${argsText})`;
                  else segments.push(`(${argsText})`);
                  cur = cur.parent;
                  continue;
                }
                break;
              }
              assertions.push(head + '|' + segments.join('.'));
              if (outer && /toMatch(?:Inline)?Snapshot/.test(outer.getText())) usesSnapshot = true;
            }
          }
          ts.forEachChild(n, walk);
        };
        walk(cb.body);
      }
      if (!assertions.length) {
        /* Fail-closed: nessun expect diretto estraibile (WITNESS-12.2). */
        blocks.push({
          id: tag.id,
          file,
          describePath,
          testTitles: testTitle ? [testTitle] : [],
          blockHash: sha256Text(parts.join('\n')),
          assertions: [],
          datasetHash: null,
          extractable: false,
          notExtractableReason: 'nessuna chiamata expect(...) diretta nel blocco — helper o costrutto non estraibile',
          usesSnapshot,
          usesPoll,
          skipped,
        });
        continue;
      }

      /* Dataset test.each: primo argomento della call `.each`. */
      let datasetHash: string | null = null;
      if (next.callee.chain.includes('each')) {
        const eachCall = findEachCall(next.call);
        const ds = eachCall?.arguments[0];
        if (!ds) {
          errors.push(`${file}: INV:${tag.id} — test.each senza dataset arg risolvibile`);
        } else {
          const folded = literalFold(ds);
          if (!folded.ok) {
            blocks.push({
              id: tag.id,
              file,
              describePath,
              testTitles: testTitle ? [testTitle] : [],
              blockHash: sha256Text(parts.join('\n')),
              assertions: assertions.sort(),
              datasetHash: null,
              extractable: false,
              notExtractableReason: 'dataset test.each non literal-foldable — fail-closed a Mode B-amend',
              usesSnapshot,
              usesPoll,
              skipped,
            });
            continue;
          }
          datasetHash = sha256Text(canonValue(folded.value));
        }
      }

      blocks.push({
        id: tag.id,
        file,
        describePath,
        testTitles: testTitle ? [testTitle] : [],
        blockHash: sha256Text(parts.join('\n')),
        assertions: assertions.sort(),
        datasetHash,
        extractable: true,
        usesSnapshot,
        usesPoll,
        skipped,
      });
    }
  }

  /* Merge dei blocchi con stesso id nello stesso file: uno stesso INV può
   * essere asserto da più test (es. INV-1 a DPR 1 e DPR 2) — il ratchet
   * opera sul multiset unito delle loro asserzioni. */
  const merged = new Map<string, InvBlock>();
  for (const b of blocks) {
    const prev = merged.get(b.id);
    if (!prev) {
      merged.set(b.id, { ...b, assertions: [...b.assertions] });
      continue;
    }
    prev.assertions = [...prev.assertions, ...b.assertions].sort();
    prev.testTitles = [...new Set([...prev.testTitles, ...b.testTitles])];
    prev.extractable = prev.extractable && b.extractable;
    prev.usesSnapshot = prev.usesSnapshot || b.usesSnapshot;
    prev.usesPoll = prev.usesPoll || b.usesPoll;
    prev.skipped = prev.skipped && b.skipped;
    if (b.datasetHash) {
      prev.datasetHash = prev.datasetHash
        ? sha256Text(`${prev.datasetHash}+${b.datasetHash}`)
        : b.datasetHash;
    }
    prev.blockHash = sha256Text([prev.blockHash, b.blockHash].sort().join('+'));
    if (!b.extractable && b.notExtractableReason) prev.notExtractableReason = b.notExtractableReason;
  }

  const duplicates: Record<string, string[]> = {};
  for (const [id, files] of seen) if (files.length > 1) duplicates[id] = files;
  return { blocks: [...merged.values()], duplicates, errors };
}

/** La call `.each(...)` interna di `test.each(ds)(title, fn)`. */
function findEachCall(outer: ts.CallExpression): ts.CallExpression | null {
  let cur: ts.Expression = outer.expression;
  while (ts.isCallExpression(cur) || ts.isPropertyAccessExpression(cur)) {
    if (ts.isCallExpression(cur)) return cur;
    cur = cur.expression;
  }
  return null;
}

/** Risale la catena expect→matcher fino alla call più esterna. */
function ascendChain(expectCall: ts.CallExpression): ts.CallExpression | null {
  let cur: ts.Node = expectCall;
  while (cur.parent && (ts.isPropertyAccessExpression(cur.parent) || ts.isCallExpression(cur.parent))) {
    cur = cur.parent;
  }
  return ts.isCallExpression(cur) ? cur : null;
}

/* ------------------------------------------------------------------ */
/* Ratchet asserzioni BASE ⊆ WT                                        */
/* ------------------------------------------------------------------ */

export interface AssertionRatchetResult {
  errors: string[];
  /** INV nuovi (assenti a BASE) — esenti, li elenchiamo per il report. */
  added: string[];
  changed: string[];
}

/**
 * Multiset ⊆ : ogni asserzione canonica a BASE deve comparire a WT con
 * molteplicità ≥ (rimozione/indebolimento/sostituzione → violazione).
 */
export function assertionRatchet(
  baseBlocks: InvBlock[],
  wtBlocks: InvBlock[],
  opts: { retired?: ReadonlySet<string> } = {},
): AssertionRatchetResult {
  const errors: string[] = [];
  const added: string[] = [];
  const changed: string[] = [];
  const wtById = new Map(wtBlocks.map((b) => [b.id, b]));
  const baseIds = new Set(baseBlocks.map((b) => b.id));
  for (const b of wtBlocks) if (!baseIds.has(b.id)) added.push(b.id);

  for (const base of baseBlocks) {
    const wt = wtById.get(base.id);
    if (!wt) {
      /* PLAN-054 T-005: un `redfirst:retire` con R-NNN a BASE autorizza la
       * rimozione (rename/retire esplicito) — validato dal chiamante. */
      if (!opts.retired?.has(base.id)) {
        errors.push(`INV:${base.id} rimosso dal file ${base.file} — serve red:retire con R-NNN a BASE`);
      }
      continue;
    }
    if (!wt.extractable) {
      errors.push(
        `INV:${base.id} (${wt.file}): non estraibile a WT — ${wt.notExtractableReason ?? 'costrutto non risolvibile'} (Mode B-amend non autorizzato)`,
      );
      continue;
    }
    /* Multiset inclusione. */
    const count = new Map<string, number>();
    for (const a of wt.assertions) count.set(a, (count.get(a) ?? 0) + 1);
    for (const a of base.assertions) {
      const n = count.get(a) ?? 0;
      if (n === 0) {
        errors.push(`INV:${base.id} (${wt.file}): asserzione BASE rimossa/indebolita — ${a.slice(0, 120)}`);
      } else {
        count.set(a, n - 1);
      }
    }
    if (base.datasetHash && wt.datasetHash !== base.datasetHash) {
      errors.push(`INV:${base.id} (${wt.file}): dataset test.each modificato (sha ${base.datasetHash.slice(0, 8)} → ${wt.datasetHash?.slice(0, 8) ?? 'null'})`);
    }
    if (wt.blockHash !== base.blockHash) changed.push(base.id);
  }
  return { errors, added, changed };
}

/* ------------------------------------------------------------------ */
/* Snapshot keyed sul proprietario                                     */
/* ------------------------------------------------------------------ */

/**
 * Chiavi snapshot (`exports['<title> N']`) diverse tra due testi di file
 * `__snapshots__`. Ritorna le chiavi rimosse/modificate: il gate le
 * attribuisce al blocco `// INV:<id>` proprietario via describePath+titolo.
 */
export function snapshotKeyDiff(baseText: string, wtText: string): { removedOrChanged: string[] } {
  const read = (t: string) => {
    const map = new Map<string, string>();
    for (const m of t.matchAll(/exports\[`([^`]+)`\]\s*=\s*`([\s\S]*?)`;/g)) map.set(m[1], m[2]);
    return map;
  };
  const base = read(baseText);
  const wt = read(wtText);
  const removedOrChanged: string[] = [];
  for (const [k, v] of base) if (wt.get(k) !== v) removedOrChanged.push(k);
  return { removedOrChanged };
}
