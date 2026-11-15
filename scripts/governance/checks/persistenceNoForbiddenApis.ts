/**
 * persistence:no-forbidden-apis — AST check for the Persistence invariant
 * (PLAN-122 T-3, `.windsurf/rules/00-project-invariants.md` §Persistence).
 *
 * Flags, outside the structural allowlist:
 *   - bare `localStorage` / `sessionStorage` identifier usage
 *   - `window.|globalThis.|self.|global.` member or element access to them
 *   - imports/requires of ad-hoc storage middleware (localforage, idb-keyval,
 *     redux-persist, local-storage, store2, web-storage-cache)
 *
 * AST-aware via the TypeScript compiler API (`ts.createSourceFile`,
 * `setParentNodes`) — NOT a raw grep: identifiers are flagged only when used
 * in expression position, so `obj.localStorage` (custom property) and
 * declaration/import positions are not false-positives.
 *
 * Allowlist/baseline: `scripts/governance/registries/persistenceBaseline.json`
 *   - structuralAllowlist: glob paths allowed to touch storage APIs
 *     (the PersistenceService implementations + storage test scaffolding)
 *   - grandfathered: files with pre-existing violations (migration debt —
 *     they pass but are tracked; stale entries are reported as warnings).
 * Any unlisted file using the banned APIs fails.
 *
 * CLI:
 *   tsx scripts/governance/checks/persistenceNoForbiddenApis.ts           # full scan of src/**
 *   tsx scripts/governance/checks/persistenceNoForbiddenApis.ts --files f1.ts f2.tsx
 *   tsx scripts/governance/checks/persistenceNoForbiddenApis.ts --root DIR
 *   tsx scripts/governance/checks/persistenceNoForbiddenApis.ts --verify-grandfathered
 *     # re-audit baseline: print which grandfathered files still violate
 *
 * Exit 1 on any violation; 0 otherwise.
 */
import { readdirSync, readFileSync, existsSync, statSync } from 'node:fs';
import { join, relative, extname } from 'node:path';
import ts from 'typescript';

const ROOT = (() => {
  const i = process.argv.indexOf('--root');
  return i >= 0 ? process.argv[i + 1] : process.cwd();
})();

const BASELINE_PATH = join(ROOT, 'scripts/governance/registries/persistenceBaseline.json');
const SCAN_DIR = 'src';
const CODE_EXT = new Set(['.ts', '.tsx']);

const BANNED_GLOBALS = new Set(['localStorage', 'sessionStorage']);
const WINDOW_OBJECTS = new Set(['window', 'globalThis', 'self', 'global']);
const BANNED_MODULES = new Set([
  'localforage',
  'idb-keyval',
  'redux-persist',
  'local-storage',
  'store2',
  'web-storage-cache',
]);

interface Baseline {
  structuralAllowlist: string[];
  grandfathered: string[];
}

interface Violation {
  file: string;
  line: number;
  rule: string;
  text: string;
}

/** Minimal glob matcher: `**` crosses directories, `*` and `?` do not. */
export function matchGlob(path: string, pattern: string): boolean {
  const rx = pattern
    .replace(/[.+^${}()|[\]\\]/g, '\\$&')
    .replace(/\*\*\//g, '\x01')
    .replace(/\*\*/g, '\x02')
    .replace(/\*/g, '[^/]*')
    .replace(/\?/g, '[^/]')
    .replace(/\x01/g, '(?:.*/)?')
    .replace(/\x02/g, '.*');
  return new RegExp(`^${rx}$`).test(path);
}

function loadBaseline(): Baseline {
  if (!existsSync(BASELINE_PATH)) {
    console.error(`persistence check: baseline registry not found at ${BASELINE_PATH}`);
    process.exit(2);
  }
  return JSON.parse(readFileSync(BASELINE_PATH, 'utf8')) as Baseline;
}

function* walk(dir: string): Generator<string> {
  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const entry of entries) {
    if (entry.name === 'node_modules' || entry.name.startsWith('.')) continue;
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      yield* walk(full);
    } else if (entry.isFile() && CODE_EXT.has(extname(entry.name))) {
      yield full;
    }
  }
}

/** Identifier nodes whose parent position is a name/key, not a global reference. */
const SKIP_PARENT_KINDS = new Set<number>([
  ts.SyntaxKind.PropertyAssignment, // { localStorage: x } key — not a reference
  ts.SyntaxKind.PropertySignature,
  ts.SyntaxKind.PropertyDeclaration,
  ts.SyntaxKind.MethodDeclaration,
  ts.SyntaxKind.MethodSignature,
  ts.SyntaxKind.GetAccessor,
  ts.SyntaxKind.SetAccessor,
  ts.SyntaxKind.Parameter,
  ts.SyntaxKind.EnumMember,
  ts.SyntaxKind.ImportSpecifier,
  ts.SyntaxKind.ImportClause,
  ts.SyntaxKind.NamespaceImport,
  ts.SyntaxKind.BindingElement, // const { localStorage: x } — local alias name
  ts.SyntaxKind.TypeReference,
  ts.SyntaxKind.TypeQuery,
]);

/**
 * Scan one source file's AST for forbidden persistence APIs.
 * `setParentNodes: true` gives us node.parent so we can tell expression-position
 * identifiers (real global references) from keys/declarations.
 */
function scanFile(absPath: string, relPath: string): Violation[] {
  const code = readFileSync(absPath, 'utf8');
  const sf = ts.createSourceFile(relPath, code, ts.ScriptTarget.Latest, /*setParentNodes*/ true);
  const violations: Violation[] = [];

  const lineOf = (node: ts.Node) => sf.getLineAndCharacterOfPosition(node.getStart(sf)).line + 1;
  const textOf = (node: ts.Node) => node.getText(sf).slice(0, 80);

  const visit = (node: ts.Node): void => {
    // import ... from 'localforage' / import('localforage') / require('localforage')
    if (ts.isImportDeclaration(node) && ts.isStringLiteral(node.moduleSpecifier)) {
      const spec = node.moduleSpecifier.text;
      if (BANNED_MODULES.has(spec)) {
        violations.push({ file: relPath, line: lineOf(node), rule: `banned storage-middleware import "${spec}"`, text: textOf(node) });
      }
    }
    if (ts.isCallExpression(node)) {
      const first = node.arguments[0];
      if (
        first &&
        ts.isStringLiteral(first) &&
        BANNED_MODULES.has(first.text) &&
        ((ts.isIdentifier(node.expression) && node.expression.text === 'require') ||
          node.expression.kind === ts.SyntaxKind.ImportKeyword)
      ) {
        violations.push({ file: relPath, line: lineOf(node), rule: `banned storage-middleware import "${first.text}"`, text: textOf(node) });
      }
    }

    // window['localStorage']
    if (
      ts.isElementAccessExpression(node) &&
      ts.isIdentifier(node.expression) &&
      WINDOW_OBJECTS.has(node.expression.text) &&
      node.argumentExpression &&
      ts.isStringLiteral(node.argumentExpression) &&
      BANNED_GLOBALS.has(node.argumentExpression.text)
    ) {
      violations.push({ file: relPath, line: lineOf(node), rule: `forbidden global ${node.expression.text}['${node.argumentExpression.text}']`, text: textOf(node) });
    }

    // bare localStorage / window.localStorage
    if (ts.isIdentifier(node) && BANNED_GLOBALS.has(node.text)) {
      const parent = node.parent;
      if (parent && ts.isPropertyAccessExpression(parent) && parent.name === node) {
        // X.localStorage — flag only when X is a global window-ish object
        if (ts.isIdentifier(parent.expression) && WINDOW_OBJECTS.has(parent.expression.text)) {
          violations.push({ file: relPath, line: lineOf(node), rule: `forbidden global ${parent.expression.text}.${node.text}`, text: textOf(parent) });
        }
        // else: custom object's own property — not the browser global, skip
      } else if (parent && SKIP_PARENT_KINDS.has(parent.kind)) {
        // declaration/name position — not a global reference
      } else {
        violations.push({ file: relPath, line: lineOf(node), rule: `forbidden global ${node.text}`, text: textOf(node) });
      }
    }

    ts.forEachChild(node, visit);
  };
  visit(sf);
  return violations;
}

function main(): void {
  const baseline = loadBaseline();

  // --verify-grandfathered: re-audit the baseline — scans every grandfathered
  // file IGNORING exemptions and prints which still violate (migration audit).
  if (process.argv.includes('--verify-grandfathered')) {
    const stillViolating: string[] = [];
    for (const rel of baseline.grandfathered) {
      const abs = join(ROOT, rel);
      if (!existsSync(abs)) {
        console.warn(`  stale entry (file gone): ${rel}`);
        continue;
      }
      if (scanFile(abs, rel).length > 0) stillViolating.push(rel);
    }
    console.log(`--verify-grandfathered: ${stillViolating.length}/${baseline.grandfathered} entries still violate`);
    for (const rel of stillViolating) console.log(`  ${rel}`);
    return;
  }

  const filesIdx = process.argv.indexOf('--files');
  let targets: string[];
  if (filesIdx >= 0) {
    targets = process.argv.slice(filesIdx + 1).filter((a) => !a.startsWith('--'));
  } else {
    targets = [...walk(join(ROOT, SCAN_DIR))].map((f) => relative(ROOT, f).split('\\').join('/'));
  }

  const isStructural = (rel: string) => baseline.structuralAllowlist.some((p) => matchGlob(rel, p));
  const grandfathered = new Set(baseline.grandfathered);

  const violations: Violation[] = [];
  const warnings: string[] = [];
  let scanned = 0;
  let skippedStructural = 0;
  let skippedGrandfathered = 0;

  for (const rel of targets) {
    if (!CODE_EXT.has(extname(rel))) continue;
    const abs = join(ROOT, rel);
    if (!existsSync(abs) || !statSync(abs).isFile()) {
      warnings.push(`target not found on disk: ${rel}`);
      continue;
    }
    if (isStructural(rel)) {
      skippedStructural += 1;
      continue;
    }
    if (grandfathered.has(rel)) {
      skippedGrandfathered += 1;
      continue;
    }
    scanned += 1;
    violations.push(...scanFile(abs, rel));
  }

  // Baseline hygiene (warnings only): stale or migrated entries.
  if (filesIdx < 0) {
    const onDisk = new Set(targets);
    for (const g of baseline.grandfathered) {
      if (!onDisk.has(g)) warnings.push(`grandfathered entry not on disk (remove it): ${g}`);
      else if (scanFile(join(ROOT, g), g).length === 0) warnings.push(`grandfathered entry now clean — migrated, remove it: ${g}`);
    }
  }

  console.log(
    `persistence:no-forbidden-apis — ${scanned} file(s) scanned` +
      ` (${skippedStructural} structural-allowed, ${skippedGrandfathered} grandfathered)`,
  );
  for (const w of warnings) console.warn(`  warning: ${w}`);
  if (violations.length === 0) {
    console.log('OK — no forbidden persistence APIs outside PersistenceService.');
    return;
  }
  console.error(`FAILED — ${violations.length} violation(s):`);
  for (const v of violations) console.error(`  ${v.file}:${v.line}  [${v.rule}]\n    ${v.text}`);
  console.error(
    '\nAll save/load MUST go through @/shared/persistence/PersistenceService ' +
      '(.windsurf/rules/00-project-invariants.md §Persistence). Legitimate exceptions ' +
      'belong in scripts/governance/registries/persistenceBaseline.json.',
  );
  process.exit(1);
}

main();
