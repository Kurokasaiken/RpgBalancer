#!/usr/bin/env tsx
/**
 * componentInventory — PLAN-054 T-002: partizione meccanica esatta di
 * STRICT_FILES (set D di `discoverGameSurface`) in unità di contratto.
 *
 * Modello (deterministico, documentato in decision-report):
 *  - unit root `ui-component`: ogni file `.tsx` che contiene almeno un
 *    elemento JSX — ogni componente UI è una unità a sé, mai piegato.
 *  - file non-componente (.ts/.css/.json, .tsx senza JSX): proprietario =
 *    il dominatore unit-root più vicino nell'import graph (tutti i
 *    percorsi dagli entry point passano per lui → file privato). Se la
 *    catena dei dominatori raggiunge la radice virtuale senza incontrare
 *    una unit root, il file è condiviso → diventa unità `shared-kernel`.
 *  - `shared-kernel` ⇒ `tier: 1` non declassabile. `ui-component` ⇒
 *    `tier: 1` se root di pagina o citato da un `CTR-game-*` adottato,
 *    altrimenti `tier: 2` (T-004 promuove con la copertura certificata).
 *
 * CLI:
 *   npx tsx scripts/verification/componentInventory.ts            # report → stdout
 *   npx tsx scripts/verification/componentInventory.ts --write    # rigenera
 *     .mw/contracts/components/<id>.md (skeleton, mai sovrascrive file
 *     esistenti) + .mw/contracts/components/inventory.json
 *   npx tsx scripts/verification/componentInventory.ts --check    # fail-closed:
 *     partizione corrente vs inventory.json committato + coerenza contratti
 */
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';
import { surfaceImportGraph } from './discoverGameSurface';
import { sha256Text } from './gateCore';

export const COMPONENTS_DIR_REL = '.mw/contracts/components';
export const INVENTORY_REL = `${COMPONENTS_DIR_REL}/inventory.json`;

const VIRTUAL_ROOT = '__surface__';
const GAME_PAGE = 'src/pages/game-frame-pixi.tsx';
const LAB_PAGE = 'src/pages/game-frame.tsx';

/* ------------------------------------------------------------------ */
/* Tipi                                                                */
/* ------------------------------------------------------------------ */

export interface InventoryUnit {
  id: string;
  role: 'ui-component' | 'shared-kernel';
  tier: 1 | 2;
  /** File root da cui derivano id e (per i kernel) il ruolo. */
  root_file: string;
  scope_files: string[];
  /** Perché il tier meccanico è stato assegnato così (audit). */
  tier_source: 'kernel' | 'page' | 'ctr-reference' | 'default';
}

export interface ComponentInventory {
  schema: 'plan054-component-inventory/1';
  generated_at: string;
  /** STRICT_FILES coperti dalla partizione (set D). */
  strict_files: string[];
  units: InventoryUnit[];
  stats: { files: number; units: number; ui_components: number; shared_kernels: number };
  /** sha256 del contenuto canonico (units + strict_files) — drift check. */
  content_sha256: string;
}

/* ------------------------------------------------------------------ */
/* Dominatori                                                          */
/* ------------------------------------------------------------------ */

/**
 * Dominatori iterativi (fixpoint) sul grafo orientato agli entry point.
 * Ritorna idom(v) = il dominatore immediato di ogni nodo; la radice
 * virtuale idom-free. Nodi irraggiungibili restano figli della radice.
 */
function immediateDominators(
  entries: string[],
  edges: Record<string, string[]>,
): Record<string, string> {
  const nodes = new Set<string>(Object.keys(edges));
  for (const list of Object.values(edges)) for (const e of list) nodes.add(e);
  const preds: Record<string, string[]> = {};
  for (const n of nodes) preds[n] = [];
  for (const [from, list] of Object.entries(edges)) {
    for (const to of list) {
      if (!nodes.has(to)) continue;
      preds[to].push(from);
    }
  }
  const dom = new Map<string, Set<string>>();
  const all = [...nodes];
  for (const n of all) dom.set(n, new Set(all));
  dom.set(VIRTUAL_ROOT, new Set([VIRTUAL_ROOT]));
  for (const e of entries) if (nodes.has(e)) dom.set(e, new Set([e, VIRTUAL_ROOT]));

  let changed = true;
  while (changed) {
    changed = false;
    for (const n of all) {
      if (n === VIRTUAL_ROOT || entries.includes(n)) continue;
      const ps = preds[n].filter((p) => p !== n);
      if (!ps.length) {
        /* Irreachato dagli entry: resta figlio della radice virtuale. */
        const target = new Set([n, VIRTUAL_ROOT]);
        if (dom.get(n)!.size !== target.size || ![...target].every((x) => dom.get(n)!.has(x))) {
          dom.set(n, target);
          changed = true;
        }
        continue;
      }
      let inter = new Set(dom.get(ps[0]));
      for (const p of ps.slice(1)) {
        inter = new Set([...inter].filter((x) => dom.get(p)!.has(x)));
      }
      const next = new Set([n, ...inter]);
      const prev = dom.get(n)!;
      if (next.size !== prev.size || ![...next].every((x) => prev.has(x))) {
        dom.set(n, next);
        changed = true;
      }
    }
  }

  const idom: Record<string, string> = {};
  for (const n of all) {
    if (n === VIRTUAL_ROOT) continue;
    const others = [...dom.get(n)!].filter((d) => d !== n);
    /* idom = il dominatore con l'insieme dom più grande (il più vicino). */
    idom[n] = others.reduce((a, b) => (dom.get(a)!.size >= dom.get(b)!.size ? a : b));
  }
  return idom;
}

/* ------------------------------------------------------------------ */
/* Classificazione                                                     */
/* ------------------------------------------------------------------ */

const jsxCache = new Map<string, boolean>();
/** Il file è un componente UI: `.tsx` con almeno un elemento JSX. */
export function isUiComponentFile(rel: string, source: string): boolean {
  if (!rel.endsWith('.tsx')) return false;
  const cached = jsxCache.get(rel);
  if (cached !== undefined) return cached;
  const sf = ts.createSourceFile(rel, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  let found = false;
  const visit = (n: ts.Node) => {
    if (found) return;
    if (ts.isJsxElement(n) || ts.isJsxSelfClosingElement(n) || ts.isJsxFragment(n)) found = true;
    else ts.forEachChild(n, visit);
  };
  visit(sf);
  jsxCache.set(rel, found);
  return found;
}

const kebab = (s: string) =>
  s
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/[_\s]+/g, '-')
    .toLowerCase();

/** id kebab-case deterministico dal basename della root; suffissi anti-collisione. */
function unitIdFor(rootFile: string, taken: Set<string>): string {
  const base = rootFile.split('/').pop()!.replace(/\.(tsx?|css|json)$/, '');
  const dir = rootFile.split('/').slice(-2, -1)[0] ?? '';
  let id = kebab(base);
  if (taken.has(id)) id = `${id}-${kebab(dir)}`;
  let n = 2;
  let cand = id;
  while (taken.has(cand)) cand = `${id}-${n++}`;
  taken.add(cand);
  return cand;
}

/* ------------------------------------------------------------------ */
/* Partizione                                                          */
/* ------------------------------------------------------------------ */

export interface PartitionResult {
  units: InventoryUnit[];
  /** file → unità proprietaria. */
  ownerOf: Record<string, string>;
  errors: string[];
}

/**
 * Costruisce la partizione meccanica. `ctrComponentFiles` = file citati dai
 * contratti `CTR-game-*` legacy (per il tier meccanico `ctr-reference`).
 */
export function buildPartition(
  graph: { files: string[]; edges: Record<string, string[]>; sources: Record<string, string> },
  ctrComponentFiles: string[] = [],
): PartitionResult {
  const { files, edges, sources } = graph;
  const errors: string[] = [];
  const entries = [GAME_PAGE, LAB_PAGE].filter((f) => files.includes(f));
  if (!entries.length) errors.push(`entry point di /game assenti in STRICT_FILES (${GAME_PAGE}, ${LAB_PAGE})`);

  /* Pred edges + nodo virtuale. */
  const g: Record<string, string[]> = { [VIRTUAL_ROOT]: [...entries] };
  for (const f of files) g[f] = (edges[f] ?? []).filter((e) => files.includes(e));
  const idom = immediateDominators([VIRTUAL_ROOT], g);

  const isComponent = (f: string) => isUiComponentFile(f, sources[f] ?? '');
  const componentFiles = new Set(files.filter(isComponent));

  /* Unità: tutti i componenti + i non-componenti la cui catena idom
   * arriva alla radice senza incontrare un altro unit-root. */
  const unitRoots = new Map<string, 'ui-component' | 'shared-kernel'>();
  for (const f of files) if (componentFiles.has(f)) unitRoots.set(f, 'ui-component');
  const sorted = [...files].sort();
  for (const f of sorted) {
    if (unitRoots.has(f)) continue;
    let cur = idom[f];
    while (cur && cur !== VIRTUAL_ROOT && !unitRoots.has(cur)) cur = idom[cur];
    if (cur === VIRTUAL_ROOT || !cur) unitRoots.set(f, 'shared-kernel');
  }
  /* I non-componenti raggiungono un unit-root componente o kernel:
   * ri-cerca includendo anche i kernel appena scoperti. */
  const ownerOf: Record<string, string> = {};
  for (const f of sorted) {
    if (unitRoots.has(f)) {
      ownerOf[f] = f;
      continue;
    }
    let cur: string | undefined = idom[f];
    while (cur && cur !== VIRTUAL_ROOT && !unitRoots.has(cur)) cur = idom[cur];
    if (cur && cur !== VIRTUAL_ROOT && unitRoots.has(cur)) {
      ownerOf[f] = cur;
    } else {
      /* Non dovrebbe accadere: senza dominatore unit-root il file era
       * esso stesso un kernel — segnala e tratta come kernel isolato. */
      errors.push(`file senza dominatore unit-root: ${f}`);
      unitRoots.set(f, 'shared-kernel');
      ownerOf[f] = f;
    }
  }

  /* Raggruppa scope_files per root. */
  const scopeOf = new Map<string, string[]>();
  for (const r of unitRoots.keys()) scopeOf.set(r, []);
  for (const f of sorted) scopeOf.get(ownerOf[f])!.push(f);

  /* File dei CTR per il tier meccanico. */
  const ctrFiles = new Set(ctrComponentFiles);
  const pageRoots = new Set([GAME_PAGE, LAB_PAGE]);

  const taken = new Set<string>();
  const units: InventoryUnit[] = [];
  for (const root of [...unitRoots.keys()].sort()) {
    const role = unitRoots.get(root)!;
    const id = unitIdFor(root, taken);
    let tier: 1 | 2;
    let tier_source: InventoryUnit['tier_source'];
    if (role === 'shared-kernel') {
      tier = 1;
      tier_source = 'kernel';
    } else if (pageRoots.has(root)) {
      tier = 1;
      tier_source = 'page';
    } else if (ctrFiles.has(root) || (scopeOf.get(root) ?? []).some((f) => ctrFiles.has(f))) {
      tier = 1;
      tier_source = 'ctr-reference';
    } else {
      tier = 2;
      tier_source = 'default';
    }
    units.push({ id, role, tier, root_file: root, scope_files: scopeOf.get(root)!, tier_source });
  }
  units.sort((a, b) => a.id.localeCompare(b.id));

  /* Partizione esatta: ogni file in esattamente 1 unità. */
  const seen = new Map<string, number>();
  for (const u of units) for (const f of u.scope_files) seen.set(f, (seen.get(f) ?? 0) + 1);
  for (const f of files) {
    const n = seen.get(f) ?? 0;
    if (n === 0) errors.push(`STRICT_FILES non coperto (0 owner): ${f}`);
    if (n > 1) errors.push(`STRICT_FILES con ${n} owner (>1): ${f}`);
  }
  for (const u of units) for (const f of u.scope_files) if (!files.includes(f)) errors.push(`scope file fuori STRICT_FILES: ${u.id} → ${f}`);

  const ownerById: Record<string, string> = {};
  for (const u of units) for (const f of u.scope_files) ownerById[f] = u.id;
  return { units, ownerOf: ownerById, errors };
}

/* ------------------------------------------------------------------ */
/* Consumatori kernel → check CTR comune                                */
/* ------------------------------------------------------------------ */

/**
 * Per ogni unità kernel K: le unità distinte che importano un file di K.
 * Se |consumers| ≥ 2 serve un `CTR` che includa ≥2 dei consumatori (o K
 * stessa + ≥1) — altrimenti l'interazione condivisa resta non contrattata.
 */
export function kernelConsumers(
  units: InventoryUnit[],
  edges: Record<string, string[]>,
): Record<string, string[]> {
  const unitOf = new Map<string, string>();
  for (const u of units) for (const f of u.scope_files) unitOf.set(f, u.id);
  const out: Record<string, Set<string>> = {};
  for (const u of units) if (u.role === 'shared-kernel') out[u.id] = new Set();
  for (const [from, list] of Object.entries(edges)) {
    const uFrom = unitOf.get(from);
    if (!uFrom) continue;
    for (const to of list) {
      const uTo = unitOf.get(to);
      if (uTo && uTo !== uFrom && out[uTo]) out[uTo].add(uFrom);
    }
  }
  return Object.fromEntries(Object.entries(out).map(([k, v]) => [k, [...v].sort()]));
}

/* ------------------------------------------------------------------ */
/* Emissione                                                           */
/* ------------------------------------------------------------------ */

function yamlScalar(v: unknown): string {
  if (typeof v === 'boolean' || typeof v === 'number') return String(v);
  return JSON.stringify(v);
}

function yamlList(values: string[], indent: string): string {
  if (!values.length) return ' []';
  return '\n' + values.map((v) => `${indent}- ${yamlScalar(v)}`).join('\n');
}

/** Frontmatter YAML canonico di un contratto componente (generato). */
export function emitComponentFrontmatter(u: InventoryUnit): string {
  return [
    '---',
    `id: ${u.id}`,
    'kind: component',
    `role: ${u.role}`,
    `tier: ${u.tier}`,
    `root_file: ${yamlScalar(u.root_file)}`,
    `scope_files:${yamlList(u.scope_files, '  ')}`,
    'fast_checks: []',
    'e2e_checks: []',
    'e2e_trigger_globs: []',
    'invariants: []',
    '---',
    '',
  ].join('\n');
}

function contractBody(u: InventoryUnit): string {
  return [
    `# ${u.id}`,
    '',
    `Unità \`${u.role}\` (tier ${u.tier}, ${u.tier_source}) — contratto vivo PLAN-054.`,
    `Root: \`${u.root_file}\`.`,
    '',
    '## Scope',
    '',
    ...u.scope_files.map((f) => `- \`${f}\``),
    '',
    '## Decision history',
    '',
    'Partizione generata meccanicamente da `componentInventory.ts` (PLAN-054 T-002).',
    '',
  ].join('\n');
}

/** Contenuto canonico dell'intera partizione (per sha di drift). */
export function canonicalInventory(units: InventoryUnit[], strictFiles: string[]): string {
  return JSON.stringify({ strict_files: strictFiles, units });
}

export function writeInventory(
  repoRoot: string,
  units: InventoryUnit[],
  strictFiles: string[],
): { written: string[]; skipped: string[]; inventory: ComponentInventory } {
  const dir = join(repoRoot, COMPONENTS_DIR_REL);
  mkdirSync(dir, { recursive: true });
  const written: string[] = [];
  const skipped: string[] = [];
  for (const u of units) {
    const file = join(dir, `${u.id}.md`);
    if (existsSync(file)) {
      skipped.push(u.id);
      continue;
    }
    writeFileSync(file, emitComponentFrontmatter(u) + contractBody(u));
    written.push(u.id);
  }
  const inventory: ComponentInventory = {
    schema: 'plan054-component-inventory/1',
    generated_at: new Date().toISOString(),
    strict_files: [...strictFiles].sort(),
    units,
    stats: {
      files: strictFiles.length,
      units: units.length,
      ui_components: units.filter((u) => u.role === 'ui-component').length,
      shared_kernels: units.filter((u) => u.role === 'shared-kernel').length,
    },
    content_sha256: sha256Text(canonicalInventory(units, [...strictFiles].sort())),
  };
  writeFileSync(join(dir, 'inventory.json'), JSON.stringify(inventory, null, 2) + '\n');
  written.push('inventory.json');
  return { written, skipped, inventory };
}

export function loadInventory(repoRoot: string): ComponentInventory | null {
  const p = join(repoRoot, INVENTORY_REL);
  if (!existsSync(p)) return null;
  try {
    return JSON.parse(readFileSync(p, 'utf8')) as ComponentInventory;
  } catch {
    return null;
  }
}

/** File dei componenti citati dai contratti `CTR-game-*` (riga `**components:**`). */
export function ctrComponentFiles(repoRoot: string): string[] {
  const dir = join(repoRoot, '.mw/contracts');
  if (!existsSync(dir)) return [];
  const out = new Set<string>();
  for (const name of readdirSync(dir)) {
    if (!/^CTR-game-\d+\.md$/.test(name)) continue;
    const text = readFileSync(join(dir, name), 'utf8');
    const m = text.match(/\*\*components:\*\*\s*([^\n]+)/);
    if (!m) continue;
    for (const part of m[1].split(',')) {
      const t = part.trim().replace(/`/g, '');
      if (t.startsWith('src/')) out.add(t);
    }
  }
  return [...out].sort();
}

/* ------------------------------------------------------------------ */
/* Check                                                               */
/* ------------------------------------------------------------------ */

/**
 * Verifica fail-closed dell'inventario committato vs partizione corrente:
 * sha canonico identico + ogni STRICT_FILE con esattamente 1 owner nei
 * contratti `.md` presenti.
 */
export function checkInventory(repoRoot: string): { errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];
  const inv = loadInventory(repoRoot);
  if (!inv) {
    errors.push(`${INVENTORY_REL} assente o malformato — esegui componentInventory.ts --write`);
    return { errors, warnings };
  }
  const graph = surfaceImportGraph(repoRoot);
  const ctrFiles = ctrComponentFiles(repoRoot);
  const { units, errors: pErr } = buildPartition(graph, ctrFiles);
  errors.push(...pErr);
  const currentSha = sha256Text(canonicalInventory(units, graph.strict_files));
  if (currentSha !== inv.content_sha256) {
    errors.push(
      `inventory drift: la partizione corrente di STRICT_FILES non coincide con ${INVENTORY_REL} — ` +
        `rigenera con componentInventory.ts --write (sha ${currentSha.slice(0, 12)} ≠ ${inv.content_sha256.slice(0, 12)})`,
    );
  }
  /* Ogni unità dell'inventario ha un contratto .md; i contratti non
   * sovrascrivono scope altrui (0/>1 owner = fail-closed). */
  const dir = join(repoRoot, COMPONENTS_DIR_REL);
  const mdFiles = existsSync(dir) ? readdirSync(dir).filter((f) => f.endsWith('.md')) : [];
  const byUnit = new Map(units.map((u) => [u.id, u]));
  const ownerCount = new Map<string, number>();
  for (const name of mdFiles) {
    const text = readFileSync(join(dir, name), 'utf8');
    const fm = text.match(/^---\n([\s\S]*?)\n---/);
    if (!fm) {
      errors.push(`${COMPONENTS_DIR_REL}/${name}: frontmatter mancante`);
      continue;
    }
    const id = (fm[1].match(/^id:\s*(\S+)/m) ?? [])[1];
    if (!id || !byUnit.has(id)) {
      warnings.push(`${COMPONENTS_DIR_REL}/${name}: id "${id ?? '?'}" non in inventory`);
    }
    /* Owner count solo sugli item della lista `scope_files:` — altri campi
     * frontmatter (trigger globs, ecc.) possono citare path `src/` senza
     * essere ownership. */
    const scopeBlock = fm[1].match(/^scope_files:\n((?:\s+-\s+[^\n]+\n?)*)/m);
    if (!scopeBlock) {
      errors.push(`${COMPONENTS_DIR_REL}/${name}: lista scope_files assente`);
      continue;
    }
    for (const m of scopeBlock[1].matchAll(/^\s*-\s*"?(src\/[^"\n]+?)"?\s*$/gm)) {
      ownerCount.set(m[1], (ownerCount.get(m[1]) ?? 0) + 1);
    }
  }
  for (const u of units) {
    if (!mdFiles.includes(`${u.id}.md`)) errors.push(`unità senza contratto: ${COMPONENTS_DIR_REL}/${u.id}.md`);
  }
  for (const f of graph.strict_files) {
    const n = ownerCount.get(f) ?? 0;
    if (n === 0) errors.push(`STRICT_FILES con 0 owner nei contratti: ${f}`);
    else if (n > 1) errors.push(`STRICT_FILES con ${n} owner nei contratti: ${f}`);
  }
  return { errors, warnings };
}

/* ------------------------------------------------------------------ */
/* CLI                                                                 */
/* ------------------------------------------------------------------ */

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1]);
if (isMain) {
  const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
  const args = process.argv.slice(2);
  if (args.includes('--check')) {
    const { errors, warnings } = checkInventory(root);
    warnings.forEach((w) => console.log(`⚠ ${w}`));
    errors.forEach((e) => console.error(`✗ ${e}`));
    if (!errors.length) console.log('componentInventory: partizione coerente, 1 owner per file.');
    process.exit(errors.length ? 1 : 0);
  }
  const graph = surfaceImportGraph(root);
  const { units, errors } = buildPartition(graph, ctrComponentFiles(root));
  errors.forEach((e) => console.error(`✗ ${e}`));
  const consumers = kernelConsumers(units, graph.edges);
  if (args.includes('--write') && !errors.length) {
    const { written, skipped, inventory } = writeInventory(root, units, graph.strict_files);
    console.log(
      `inventory: ${inventory.stats.units} unità (${inventory.stats.ui_components} ui-component, ` +
        `${inventory.stats.shared_kernels} shared-kernel) su ${inventory.stats.files} STRICT_FILES.`,
    );
    console.log(`scritti: ${written.length} contratti (+ inventory.json); preservati: ${skipped.length}`);
    console.log(`kernel con ≥2 consumatori: ${Object.values(consumers).filter((c) => c.length >= 2).length}`);
  } else {
    console.log(JSON.stringify({ strict_files: graph.strict_files.length, units: units.length, units_list: units, kernel_consumers: consumers, errors }, null, 2));
  }
  process.exit(errors.length ? 1 : 0);
}
