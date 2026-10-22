#!/usr/bin/env tsx
/**
 * populateComponentContracts — PLAN-054 T-004: popola i contratti
 * `.mw/contracts/components/<id>.md` generati da T-002.
 *
 * Per ogni unità dell'inventario committato:
 *  - `fast_checks`: file `*.test.*` (vitest) che importano direttamente lo
 *    scope dell'unità; `e2e_checks`: file `*.spec.*` (playwright) idem;
 *    `e2e_trigger_globs`: scope_files dell'unità quando `e2e_checks` non
 *    è vuoto (diff sullo scope attiva l'e2e).
 *  - Corpo: sezione generata tra sentinelle `plan054:generated` con scopo
 *    e `decision_history` importata dalle bozze SCHEDA PLAN-043 WS-5
 *    (`test-results/plan-043/ws5/cards-draft.json`) — match meccanico per
 *    `scope_files`. Il blocco `plan054:notes` è preservato per note manuali.
 *
 * Invariants/frontmatter esistenti (`invariants`, `e2e_*`) sono preservati.
 *
 * CLI:
 *   tsx scripts/verification/populateComponentContracts.ts          # dry-run report
 *   tsx scripts/verification/populateComponentContracts.ts --write  # riscrive i .md
 */
import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import yaml from 'js-yaml';
import { COMPONENTS_DIR_REL, loadInventory, type InventoryUnit } from './componentInventory';

const CARDS_REL = 'test-results/plan-043/ws5/cards-draft.json';

/* ------------------------------------------------------------------ */
/* SCHEDA WS-5                                                          */
/* ------------------------------------------------------------------ */

interface SchedaCard {
  card_id: string;
  component: string;
  scope_files: string[];
  purpose?: string;
  what_works?: string;
  debate_proposal?: string;
  decision_record?: string;
  status?: string;
  implementation_status?: string;
}

function loadCards(repoRoot: string): { card: SchedaCard; batch: string }[] {
  const p = join(repoRoot, CARDS_REL);
  if (!existsSync(p)) return [];
  const raw = JSON.parse(readFileSync(p, 'utf8')) as { batches?: Record<string, SchedaCard[]> };
  const out: { card: SchedaCard; batch: string }[] = [];
  for (const [batch, cards] of Object.entries(raw.batches ?? {})) {
    for (const card of cards) out.push({ card, batch });
  }
  return out;
}

/* ------------------------------------------------------------------ */
/* Test → unità (import diretti)                                        */
/* ------------------------------------------------------------------ */

const TEST_FILE_RE = /\.(test|spec)\.(ts|tsx)$/;

function collectTestFiles(dir: string, rel = '', out: string[] = []): string[] {
  if (!existsSync(dir)) return out;
  for (const n of readdirSync(dir)) {
    const abs = join(dir, n);
    const r = rel ? `${rel}/${n}` : n;
    if (statSync(abs).isDirectory()) collectTestFiles(abs, r, out);
    else if (TEST_FILE_RE.test(n)) out.push(r);
  }
  return out;
}

const IMP_RE = /from\s+['"]([^'"]+)['"]/g;

function resolveImport(repoRoot: string, fromFile: string, spec: string): string | null {
  if (spec.startsWith('@/')) return `src/${spec.slice(2)}`;
  if (!spec.startsWith('.')) return null;
  const abs = resolve(repoRoot, dirname(fromFile), spec);
  const rel = abs.slice(repoRoot.length + 1).replace(/\\/g, '/');
  return rel.startsWith('src/') ? rel : null;
}

/** Mappa test-file → unit id (import diretti risolti verso STRICT_FILES). */
export function testToUnits(repoRoot: string): Map<string, Set<string>> {
  const inv = loadInventory(repoRoot);
  const unitOf = new Map<string, string>();
  for (const u of inv?.units ?? []) for (const f of u.scope_files) unitOf.set(f, u.id);
  const out = new Map<string, Set<string>>();
  for (const rel of collectTestFiles(join(repoRoot, 'tests'), 'tests')) {
    const abs = join(repoRoot, rel);
    const text = readFileSync(abs, 'utf8');
    const units = new Set<string>();
    for (const m of text.matchAll(IMP_RE)) {
      const base = resolveImport(repoRoot, rel, m[1]);
      if (!base) continue;
      for (const cand of [base, `${base}.ts`, `${base}.tsx`, `${base}/index.ts`, `${base}/index.tsx`]) {
        if (unitOf.has(cand)) {
          units.add(unitOf.get(cand)!);
          break;
        }
      }
    }
    if (units.size) out.set(rel, units);
  }
  return out;
}

/* ------------------------------------------------------------------ */
/* Emissione                                                            */
/* ------------------------------------------------------------------ */

const FM_RE = /^---\n([\s\S]*?)\n---\n?/;
const NOTES_RE = /<!--\s*plan054:notes\s*-->([\s\S]*?)<!--\s*\/plan054:notes\s*-->/;
const GEN_BEGIN = '<!-- plan054:generated -->';
const GEN_END = '<!-- /plan054:generated -->';
const NOTES_BEGIN = '<!-- plan054:notes -->';
const NOTES_END = '<!-- /plan054:notes -->';

function generatedBody(u: InventoryUnit, cards: { card: SchedaCard; batch: string }[]): string {
  const lines: string[] = [GEN_BEGIN, '', '## Scopo', ''];
  if (cards.length && cards[0].card.purpose) {
    lines.push(cards[0].card.purpose.trim());
  } else {
    lines.push(
      `Unità \`${u.role}\` (tier ${u.tier}, ${u.tier_source}) — contratto vivo PLAN-054.`,
      `Root: \`${u.root_file}\`.`,
    );
  }
  lines.push('', '## Scope', '');
  for (const f of u.scope_files) lines.push(`- \`${f}\``);
  lines.push('', '## Decision history', '');
  lines.push('- PLAN-054 T-002: partizione generata meccanicamente da `componentInventory.ts`.');
  for (const { card, batch } of cards) {
    const bits = [
      `scheda \`${card.card_id}\` (batch ${batch}${card.status ? `, ${card.status}` : ''})`,
    ];
    if (card.decision_record) bits.push(`decisione — ${card.decision_record.trim()}`);
    if (card.debate_proposal) bits.push(`proposta — ${card.debate_proposal.trim()}`);
    if (card.implementation_status) bits.push(`stato — ${card.implementation_status.trim()}`);
    lines.push(`- PLAN-043 WS-5 ${bits.join('; ')}.`);
  }
  lines.push('', GEN_END, '');
  return lines.join('\n');
}

/**
 * Emissione canonica del contratto popolato: frontmatter YAML con i campi
 * meccanici aggiornati (fast/e2e checks, scope re-emesso dall'inventario)
 * e gli altri preservati; corpo = titolo + blocco note preservato +
 * sezione generata.
 */
export function emitPopulatedContract(
  u: InventoryUnit,
  existingFm: Record<string, unknown> | null,
  existingBody: string | null,
  cards: { card: SchedaCard; batch: string }[],
  fastChecks: string[],
  e2eChecks: string[],
): string {
  const fm: Record<string, unknown> = {
    id: u.id,
    kind: 'component',
    role: u.role,
    tier: u.tier,
    root_file: u.root_file,
    scope_files: u.scope_files,
    fast_checks: fastChecks,
    e2e_checks: e2eChecks,
    e2e_trigger_globs: e2eChecks.length ? [...u.scope_files] : (existingFm?.e2e_trigger_globs ?? []),
    invariants: existingFm?.invariants ?? [],
  };
  /* Chiavi custom future sono preservate (aggiunte dopo le canoniche). */
  for (const [k, v] of Object.entries(existingFm ?? {})) if (!(k in fm)) fm[k] = v;
  const head = `---\n${yaml.dump(fm, { lineWidth: 120, noRefs: true, sortKeys: false })}---\n\n`;

  const notes = existingBody ? (existingBody.match(NOTES_RE)?.[1] ?? '') : '';
  const body = [
    `# ${u.id}`,
    '',
    `Unità \`${u.role}\` (tier ${u.tier}, ${u.tier_source}) — contratto vivo PLAN-054. Root: \`${u.root_file}\`.`,
    '',
    NOTES_BEGIN,
    notes.trim() ? notes.trim() : '',
    NOTES_END,
    '',
    generatedBody(u, cards),
  ].join('\n');
  return head + body;
}

/* ------------------------------------------------------------------ */
/* Populate                                                             */
/* ------------------------------------------------------------------ */

export interface PopulateResult {
  changed: string[];
  unchanged: string[];
  cardMatches: Record<string, string[]>;
  unmatchedCards: string[];
  errors: string[];
}

export function populateContracts(repoRoot: string, write: boolean): PopulateResult {
  const res: PopulateResult = { changed: [], unchanged: [], cardMatches: {}, unmatchedCards: [], errors: [] };
  const inv = loadInventory(repoRoot);
  if (!inv) {
    res.errors.push(`${COMPONENTS_DIR_REL}/inventory.json assente — esegui componentInventory.ts --write`);
    return res;
  }
  const unitOf = new Map<string, string>();
  for (const u of inv.units) for (const f of u.scope_files) unitOf.set(f, u.id);

  const cards = loadCards(repoRoot);
  const cardsByUnit = new Map<string, { card: SchedaCard; batch: string }[]>();
  const cardUnits = new Map<string, Set<string>>();
  for (const c of cards) {
    for (const f of c.card.scope_files ?? []) {
      const u = unitOf.get(f);
      if (u) {
        cardsByUnit.set(u, [...(cardsByUnit.get(u) ?? []), c]);
        cardUnits.set(c.card.card_id, new Set([...(cardUnits.get(c.card.card_id) ?? []), u]));
      }
    }
  }
  for (const c of cards) {
    if (!cardUnits.has(c.card.card_id)) res.unmatchedCards.push(c.card.card_id);
  }

  const testUnits = testToUnits(repoRoot);
  const unitTests = new Map<string, { fast: string[]; e2e: string[] }>();
  for (const [testFile, units] of testUnits) {
    const isE2e = /\.spec\.(ts|tsx)$/.test(testFile);
    for (const u of units) {
      const cur = unitTests.get(u) ?? { fast: [], e2e: [] };
      (isE2e ? cur.e2e : cur.fast).push(testFile);
      unitTests.set(u, cur);
    }
  }

  for (const u of inv.units) {
    const t = unitTests.get(u.id) ?? { fast: [], e2e: [] };
    const file = join(repoRoot, COMPONENTS_DIR_REL, `${u.id}.md`);
    let fmData: Record<string, unknown> | null = null;
    let body: string | null = null;
    if (existsSync(file)) {
      const text = readFileSync(file, 'utf8');
      const m = text.match(FM_RE);
      if (m) {
        fmData = yaml.load(m[1]) as Record<string, unknown>;
        body = text.slice(m[0].length);
      }
    }
    const next = emitPopulatedContract(
      u,
      fmData,
      body,
      cardsByUnit.get(u.id) ?? [],
      [...t.fast].sort(),
      [...t.e2e].sort(),
    );
    if (!existsSync(file) || readFileSync(file, 'utf8') !== next) {
      res.changed.push(u.id);
      if (write) writeFileSync(file, next);
    } else {
      res.unchanged.push(u.id);
    }
    if (cardsByUnit.has(u.id)) {
      res.cardMatches[u.id] = (cardsByUnit.get(u.id) ?? []).map((c) => c.card.card_id);
    }
  }
  return res;
}

/* ------------------------------------------------------------------ */
/* CLI                                                                  */
/* ------------------------------------------------------------------ */

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1]);
if (isMain) {
  const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
  const write = process.argv.includes('--write');
  const res = populateContracts(root, write);
  console.log(
    `populateComponentContracts ${write ? '(write)' : '(dry-run)'} — ${res.changed.length} da aggiornare, ${res.unchanged.length} invariati`,
  );
  console.log(`SCHEDA WS-5: ${Object.keys(res.cardMatches).length} unità con decision_history, ${res.unmatchedCards.length} card senza match`);
  if (res.unmatchedCards.length) console.log(`  unmatched: ${res.unmatchedCards.join(', ')}`);
  for (const e of res.errors) console.error(`✗ ${e}`);
  process.exit(res.errors.length ? 1 : 0);
}
