#!/usr/bin/env tsx
/**
 * gameSurfaceCoverage — R-232: matrice unità → test → doc per la superficie
 * `/game`, derivata meccanicamente (mai a mano).
 *
 * Sorgenti:
 *  - unità: partizione di `componentInventory.ts` (dominatori sul grafo
 *    `surfaceImportGraph`, set D di `discoverGameSurface`);
 *  - copertura dichiarata: frontmatter dei contratti
 *    `.mw/contracts/components/<id>.md` e `.mw/contracts/CTR-game-*.md`;
 *  - copertura rilevata:
 *      · unit/integration test = file `tests/**` il cui grafo import
 *        raggiunge un file dello scope dell'unità;
 *      · e2e = spec `*.spec.ts` che importa lo scope O cita un
 *        `data-testid` emesso dai file dello scope;
 *  - documentazione: file `.md` in `src/docs/docs/`, `plans/`, `context/` e
 *    radice che citano `root_file` (path o basename), l'id unità in
 *    backtick, o `components/<id>.md`.
 *
 * Output:
 *  - `.mw/contracts/components/coverage.generated.json` (canonico + sha)
 *  - `src/docs/docs/idle_village/game_surface_coverage.md` (leggibile)
 *
 * CLI:
 *   npx tsx scripts/verification/gameSurfaceCoverage.ts           # report → stdout
 *   npx tsx scripts/verification/gameSurfaceCoverage.ts --write   # rigenera gli artifact
 *   npx tsx scripts/verification/gameSurfaceCoverage.ts --check   # fail-closed: drift
 *   tra matrice corrente e coverage.generated.json committato
 */
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { basename, dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import yaml from 'js-yaml';
import { resolveSpec, specifiersOf, surfaceImportGraph } from './discoverGameSurface';
import { COMPONENTS_DIR_REL, buildPartition, ctrComponentFiles } from './componentInventory';
import { sha256Text } from './gateCore';

export const COVERAGE_JSON_REL = `${COMPONENTS_DIR_REL}/coverage.generated.json`;
export const COVERAGE_MD_REL = 'src/docs/docs/idle_village/game_surface_coverage.md';
export const CONTRACTS_DIR_REL = '.mw/contracts';

const DOC_DIRS = ['src/docs/docs', 'plans', 'context'];
const E2E_SPEC_RE = /\.spec\.tsx?$/;
const TEST_FILE_RE = /\.(test|spec)\.tsx?$/;

/* ------------------------------------------------------------------ */
/* Tipi                                                                */
/* ------------------------------------------------------------------ */

export interface UnitCoverage {
  id: string;
  role: 'ui-component' | 'shared-kernel';
  tier: 1 | 2;
  root_file: string;
  scope_files: string[];
  /** `.mw/contracts/components/<id>.md` se presente. */
  contract_md: string | null;
  /** CTR-game-* che citano l'unità nel frontmatter `components:`. */
  ctr_contracts: string[];
  declared: { fast_checks: string[]; e2e_checks: string[]; invariants: string[] };
  detected: { unit_tests: string[]; e2e_specs: string[]; docs: string[] };
}

export interface CoverageReport {
  schema: 'r232-game-surface-coverage/1';
  generated_at: string;
  units: UnitCoverage[];
  /** Spec e2e che navigano a `/game` — copertura di pagina, non attribuibile a una unità. */
  page_level_e2e: string[];
  stats: {
    units: number;
    ui_components: number;
    with_unit_tests: number;
    with_e2e: number;
    with_docs: number;
    with_contract: number;
    zero_coverage: number;
  };
  content_sha256: string;
}

/* ------------------------------------------------------------------ */
/* Walk + frontmatter                                                  */
/* ------------------------------------------------------------------ */

const toRel = (root: string, abs: string) => relative(root, abs).split('\\').join('/');

function walk(dir: string, match: RegExp, out: string[] = []): string[] {
  if (!existsSync(dir)) return out;
  for (const name of readdirSync(dir)) {
    const abs = join(dir, name);
    const st = statSync(abs);
    if (st.isDirectory()) {
      if (name === 'node_modules' || name.startsWith('.')) continue;
      walk(abs, match, out);
    } else if (match.test(name)) out.push(abs);
  }
  return out.sort();
}

function frontmatter(text: string): Record<string, unknown> | null {
  const m = text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!m) return null;
  try {
    return (yaml.load(m[1]) ?? null) as Record<string, unknown> | null;
  } catch {
    return null;
  }
}

const asStringList = (v: unknown): string[] =>
  Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : [];

/* ------------------------------------------------------------------ */
/* Test → src reachability                                             */
/* ------------------------------------------------------------------ */

/** Grafo import condiviso, lazy: file assoluto → dipendenze risolte (assolute). */
function makeDepResolver(root: string) {
  const cache = new Map<string, string[]>();
  return (abs: string): string[] => {
    const hit = cache.get(abs);
    if (hit) return hit;
    const text = existsSync(abs) ? readFileSync(abs, 'utf8') : '';
    const deps = specifiersOf(text)
      .map((s) => resolveSpec(root, s, abs))
      .filter((d): d is string => !!d && d.startsWith(root));
    cache.set(abs, deps);
    return deps;
  };
}

/** Tutti i file `src/**` raggiungibili dal file di test via grafo import. */
function srcReachable(root: string, testAbs: string, depsOf: (f: string) => string[]): Set<string> {
  const srcRoot = join(root, 'src') + '/';
  const seen = new Set<string>();
  const reached = new Set<string>();
  const queue = [testAbs];
  while (queue.length) {
    const f = queue.shift()!;
    if (seen.has(f)) continue;
    seen.add(f);
    if (f.startsWith(srcRoot)) reached.add(toRel(root, f));
    for (const d of depsOf(f)) if (!seen.has(d)) queue.push(d);
  }
  return reached;
}

/** `data-testid` letterali emessi dai sorgenti di una unità. */
function testIdsOf(sources: Record<string, string>, files: string[]): Set<string> {
  const ids = new Set<string>();
  for (const f of files) {
    const text = sources[f];
    if (!text) continue;
    for (const m of text.matchAll(/data-testid\s*=\s*\{?\s*['"`]([A-Za-z0-9_-]+)['"`]/g)) ids.add(m[1]);
  }
  return ids;
}

/* ------------------------------------------------------------------ */
/* Doc scan                                                            */
/* ------------------------------------------------------------------ */

/** Ops artifacts senza autorità documentale (CANON): mai contati come doc. */
const DOC_EXCLUDE_DIRS = ['src/docs/docs/coordinator', 'src/docs/docs/prompts'];

function docIndex(root: string): { file: string; text: string }[] {
  const out: { file: string; text: string }[] = [];
  for (const dir of DOC_DIRS) {
    for (const abs of walk(join(root, dir), /\.md$/)) {
      const rel = toRel(root, abs);
      if (rel === COVERAGE_MD_REL || DOC_EXCLUDE_DIRS.some((d) => rel.startsWith(d + '/'))) continue;
      out.push({ file: rel, text: readFileSync(abs, 'utf8') });
    }
  }
  for (const name of readdirSync(root)) {
    if (name.endsWith('.md') && statSync(join(root, name)).isFile()) {
      out.push({ file: name, text: readFileSync(join(root, name), 'utf8') });
    }
  }
  return out;
}

/** Un doc cita l'unità se menziona root_file (path o basename), l'id in
 *  backtick, `components/<id>.md`, o il nome PascalCase (solo ≥8 char —
 *  nomi corti come `Slot`/`atoms` sono troppo rumorosi). */
function docMentions(unit: { id: string; root_file: string }, text: string): boolean {
  const base = basename(unit.root_file);
  if (text.includes(unit.root_file) || text.includes(base)) return true;
  if (text.includes(`\`${unit.id}\``) || text.includes(`components/${unit.id}.md`)) return true;
  const bare = base.replace(/\.(tsx?|css|json)$/, '');
  if (/^[A-Z]/.test(bare) && bare.length >= 8 && new RegExp(`\\b${bare}\\b`).test(text)) return true;
  return false;
}

/* ------------------------------------------------------------------ */
/* Core                                                                */
/* ------------------------------------------------------------------ */

export function computeCoverage(rootDir: string): { report: CoverageReport; errors: string[] } {
  const root = resolve(rootDir);
  const errors: string[] = [];

  const graph = surfaceImportGraph(root);
  const { units, errors: pErr } = buildPartition(graph, ctrComponentFiles(root));
  errors.push(...pErr);

  const unitsById = new Map<string, UnitCoverage>();

  /* Copertura dichiarata: contratti componente + CTR. */
  const compDir = join(root, COMPONENTS_DIR_REL);
  const contractMd = new Map<string, string>();
  if (existsSync(compDir)) {
    for (const name of readdirSync(compDir)) {
      if (name.endsWith('.md')) contractMd.set(name.replace(/\.md$/, ''), name);
    }
  }
  const declaredByUnit = new Map<string, { fast: Set<string>; e2e: Set<string>; inv: Set<string> }>();
  const decl = (id: string) => {
    let d = declaredByUnit.get(id);
    if (!d) declaredByUnit.set(id, (d = { fast: new Set(), e2e: new Set(), inv: new Set() }));
    return d;
  };
  for (const [id, name] of contractMd) {
    const fm = frontmatter(readFileSync(join(compDir, name), 'utf8')) ?? {};
    const d = decl(id);
    for (const c of asStringList(fm.fast_checks)) d.fast.add(c);
    for (const c of asStringList(fm.e2e_checks)) d.e2e.add(c);
    for (const i of fm.invariants && Array.isArray(fm.invariants) ? fm.invariants : []) {
      if (i && typeof i === 'object' && typeof (i as { id?: unknown }).id === 'string') d.inv.add((i as { id: string }).id);
      else if (typeof i === 'string') d.inv.add(i);
    }
  }

  const ctrByUnit = new Map<string, Set<string>>();
  const contractsDir = join(root, CONTRACTS_DIR_REL);
  if (existsSync(contractsDir)) {
    for (const name of readdirSync(contractsDir).filter((n) => /^CTR-.*\.md$/.test(n))) {
      const fm = frontmatter(readFileSync(join(contractsDir, name), 'utf8'));
      if (!fm) continue;
      const ctrId = typeof fm.id === 'string' ? fm.id : name.replace(/\.md$/, '');
      const checks = [...asStringList(fm.fast_checks), ...asStringList(fm.e2e_checks)];
      const invIds = Array.isArray(fm.invariants)
        ? fm.invariants.map((i) => (i && typeof i === 'object' ? (i as { id?: unknown }).id : null)).filter((x): x is string => typeof x === 'string')
        : [];
      for (const comp of asStringList(fm.components)) {
        let set = ctrByUnit.get(comp);
        if (!set) ctrByUnit.set(comp, (set = new Set()));
        set.add(ctrId);
        const d = decl(comp);
        for (const c of checks) d.e2e.add(c);
        for (const i of invIds) d.inv.add(i);
      }
    }
  }

  for (const u of units) {
    const id = u.id;
    const cov: UnitCoverage = {
      id,
      role: u.role,
      tier: u.tier,
      root_file: u.root_file,
      scope_files: [...u.scope_files].sort(),
      contract_md: contractMd.get(id) ? `${COMPONENTS_DIR_REL}/${contractMd.get(id)}` : null,
      ctr_contracts: [...(ctrByUnit.get(id) ?? new Set())].sort(),
      declared: {
        fast_checks: [...(declaredByUnit.get(id)?.fast ?? new Set())].sort(),
        e2e_checks: [...(declaredByUnit.get(id)?.e2e ?? new Set())].sort(),
        invariants: [...(declaredByUnit.get(id)?.inv ?? new Set())].sort(),
      },
      detected: { unit_tests: [], e2e_specs: [], docs: [] },
    };
    unitsById.set(id, cov);
  }

  /* ownerOf: file → unità (dalla partizione). */
  const ownerOf = new Map<string, UnitCoverage>();
  for (const u of units) for (const f of u.scope_files) ownerOf.set(f, unitsById.get(u.id)!);

  /* Test detection. */
  const depsOf = makeDepResolver(root);
  const testFiles = walk(join(root, 'tests'), TEST_FILE_RE);
  const testIdIndex = new Map<string, Set<UnitCoverage>>();
  for (const u of unitsById.values()) {
    for (const tid of testIdsOf(graph.sources, u.scope_files)) {
      let set = testIdIndex.get(tid);
      if (!set) testIdIndex.set(tid, (set = new Set()));
      set.add(u);
    }
  }

  const pageLevelE2e = new Set<string>();
  for (const testAbs of testFiles) {
    const rel = toRel(root, testAbs);
    const isE2e = E2E_SPEC_RE.test(rel) && (rel.startsWith('tests/e2e/') || rel.startsWith('tests/visual/'));
    const reached = srcReachable(root, testAbs, depsOf);
    const text = readFileSync(testAbs, 'utf8');
    if (isE2e && /goto\(\s*['"`]\/game\b/.test(text)) pageLevelE2e.add(rel);

    const hit = new Set<UnitCoverage>();
    for (const f of reached) {
      const u = ownerOf.get(f);
      if (u) hit.add(u);
    }
    for (const [tid, owners] of testIdIndex) {
      if (text.includes(tid)) for (const u of owners) hit.add(u);
    }
    for (const u of hit) {
      (isE2e ? u.detected.e2e_specs : u.detected.unit_tests).push(rel);
    }
  }
  for (const u of unitsById.values()) {
    u.detected.unit_tests.sort();
    u.detected.e2e_specs.sort();
  }

  /* Doc detection. */
  for (const doc of docIndex(root)) {
    for (const u of unitsById.values()) {
      if (docMentions(u, doc.text)) u.detected.docs.push(doc.file);
    }
  }
  for (const u of unitsById.values()) u.detected.docs.sort();

  const list = [...unitsById.values()].sort((a, b) => a.id.localeCompare(b.id));
  const hasTests = (u: UnitCoverage) => u.detected.unit_tests.length + u.declared.fast_checks.length > 0;
  const hasE2e = (u: UnitCoverage) => u.detected.e2e_specs.length + u.declared.e2e_checks.length > 0;
  const report: CoverageReport = {
    schema: 'r232-game-surface-coverage/1',
    generated_at: new Date().toISOString(),
    units: list,
    page_level_e2e: [...pageLevelE2e].sort(),
    stats: {
      units: list.length,
      ui_components: list.filter((u) => u.role === 'ui-component').length,
      with_unit_tests: list.filter(hasTests).length,
      with_e2e: list.filter(hasE2e).length,
      with_docs: list.filter((u) => u.detected.docs.length > 0).length,
      with_contract: list.filter((u) => u.contract_md !== null || u.ctr_contracts.length > 0).length,
      zero_coverage: list.filter((u) => !hasTests(u) && !hasE2e(u)).length,
    },
    content_sha256: '',
  };
  report.content_sha256 = sha256Text(canonicalCoverage(report));
  return { report, errors };
}

/** Forma canonica: tutto ciò che è derivato (niente timestamp). */
export function canonicalCoverage(r: CoverageReport): string {
  const { generated_at: _g, content_sha256: _s, ...rest } = r;
  return JSON.stringify(rest, null, 2) + '\n';
}

/* ------------------------------------------------------------------ */
/* MD emit                                                             */
/* ------------------------------------------------------------------ */

/** Celle MD compatte: max 6 nomi + `+N`; l'elenco completo sta nel JSON. */
const MD_CELL_MAX = 6;
const cell = (items: string[], empty = '—') => {
  if (!items.length) return empty;
  const shown = items.slice(0, MD_CELL_MAX).map((i) => `\`${basename(i)}\``);
  if (items.length > MD_CELL_MAX) shown.push(`+${items.length - MD_CELL_MAX}`);
  return shown.join(' ');
};

export function emitCoverageMd(r: CoverageReport): string {
  const lines: string[] = [
    '# Game Surface Coverage — `/game`',
    '',
    '<!-- GENERATED — do not edit by hand. Regenerate: npm run surface:coverage -->',
    `<!-- coverage-sha256: ${r.content_sha256} -->`,
    '',
    `Matrice meccanica unità → test → doc (R-232). Unità = partizione di`,
    `\`scripts/verification/componentInventory.ts\` sul set D di`,
    `\`discoverGameSurface.ts\`. Fonte dati: \`${COVERAGE_JSON_REL}\`.`,
    '',
    '## Sintesi',
    '',
    `| unità | ui-component | con unit test | con e2e | con doc | con contratto | zero copertura |`,
    `|---|---|---|---|---|---|---|`,
    `| ${r.stats.units} | ${r.stats.ui_components} | ${r.stats.with_unit_tests} | ${r.stats.with_e2e} | ${r.stats.with_docs} | ${r.stats.with_contract} | ${r.stats.zero_coverage} |`,
    '',
    '## Spec di pagina (navigano a `/game`, copertura trasversale)',
    '',
    ...r.page_level_e2e.map((f) => `- \`${f}\``),
    '',
    '## Matrice',
  ];
  const groups = new Map<string, UnitCoverage[]>();
  for (const u of r.units) {
    const dir = u.root_file.split('/').slice(0, -1).join('/');
    const g = groups.get(dir) ?? [];
    g.push(u);
    groups.set(dir, g);
  }
  for (const [dir, us] of [...groups.entries()].sort()) {
    lines.push('', `### \`${dir}/\``, '', '| unità | tier | scope | unit test | e2e | doc | contratti |', '|---|---|---|---|---|---|---|');
    for (const u of us) {
      const ctrs = [...u.ctr_contracts, ...(u.contract_md ? [basename(u.contract_md)] : [])];
      lines.push(
        `| \`${u.id}\` | ${u.tier} | ${u.scope_files.length} | ${cell([...u.declared.fast_checks, ...u.detected.unit_tests])} | ${cell([...u.declared.e2e_checks, ...u.detected.e2e_specs])} | ${cell(u.detected.docs)} | ${cell(ctrs)} |`,
      );
    }
  }
  const zero = r.units.filter((u) => !u.detected.unit_tests.length && !u.detected.e2e_specs.length && !u.declared.fast_checks.length && !u.declared.e2e_checks.length);
  lines.push('', '## Unità senza copertura rilevata né dichiarata', '');
  if (!zero.length) lines.push('_Nessuna._');
  else for (const u of zero) lines.push(`- \`${u.id}\` — \`${u.root_file}\``);
  lines.push('');
  return lines.join('\n');
}

/* ------------------------------------------------------------------ */
/* CLI                                                                 */
/* ------------------------------------------------------------------ */

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1]);
if (isMain) {
  const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
  const args = process.argv.slice(2);
  const { report, errors } = computeCoverage(root);
  errors.forEach((e) => console.error(`✗ ${e}`));

  if (args.includes('--check')) {
    const p = join(root, COVERAGE_JSON_REL);
    if (!existsSync(p)) {
      console.error(`✗ ${COVERAGE_JSON_REL} assente — esegui npm run surface:coverage`);
      process.exit(1);
    }
    const committed = JSON.parse(readFileSync(p, 'utf8')) as CoverageReport;
    if (committed.content_sha256 !== report.content_sha256) {
      console.error(
        `✗ coverage drift: matrice corrente sha ${report.content_sha256.slice(0, 12)} ≠ ` +
          `committato ${committed.content_sha256.slice(0, 12)} — rigenera con npm run surface:coverage`,
      );
      process.exit(1);
    }
    console.log(`gameSurfaceCoverage: matrice coerente (${report.stats.units} unità, sha ${report.content_sha256.slice(0, 12)}).`);
    process.exit(errors.length ? 1 : 0);
  }

  if (args.includes('--write') && !errors.length) {
    const jsonPath = join(root, COVERAGE_JSON_REL);
    mkdirSync(dirname(jsonPath), { recursive: true });
    writeFileSync(jsonPath, JSON.stringify(report, null, 2) + '\n');
    const mdPath = join(root, COVERAGE_MD_REL);
    mkdirSync(dirname(mdPath), { recursive: true });
    writeFileSync(mdPath, emitCoverageMd(report));
    console.log(
      `coverage → ${COVERAGE_JSON_REL} + ${COVERAGE_MD_REL} ` +
        `(${report.stats.units} unità, zero-coverage: ${report.stats.zero_coverage}, sha ${report.content_sha256.slice(0, 12)})`,
    );
  } else if (!args.includes('--write')) {
    console.log(JSON.stringify(report.stats, null, 2));
  }
  process.exit(errors.length ? 1 : 0);
}
