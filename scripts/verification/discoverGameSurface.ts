/**
 * discoverGameSurface — PLAN-043 WS-5 (artifact-r002 §C): mechanical
 * inventory of the /game surface.
 *
 * Sets:
 *   A  = sources bound to HUD_PANELS entries (registry file + the hook that
 *        drives it + the component files each panel id mounts, resolved from
 *        the StagePanelFrame / visibility mounts in the page trees).
 *   B  = every file under src/ui/idleVillage/components/gameFrame/**.
 *   C  = the transitive import graph of the /game page roots
 *        (src/pages/game-frame-pixi.tsx canonical, src/pages/game-frame.tsx
 *        lab) followed through the TS module resolver — static, type-only,
 *        re-export and dynamic imports, inside src/ only.
 *   Dq = explicitly opted-in quest components (the planner lives outside
 *        components/gameFrame; artifact §C lists it as opt-in).
 *
 *   D = A ∪ B ∪ C ∪ Dq — the guarded /game surface.
 *
 * CLI:
 *   npx tsx scripts/verification/discoverGameSurface.ts            # JSON → stdout
 *   npx tsx scripts/verification/discoverGameSurface.ts --out file # JSON → file
 *   npx tsx scripts/verification/discoverGameSurface.ts --emit-manifest tests/unit/idleVillage/gameSurfaceManifest.ts
 */
import ts from 'typescript';
import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { dirname, isAbsolute, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { BASE_SKIN_CSS_VARS } from '../../src/ui/idleVillage/skins/skinCssVariables';

/* ------------------------------------------------------------------ */
/* Configuration                                                       */
/* ------------------------------------------------------------------ */

/** Canonical /game page (production surface). */
const GAME_PAGE = 'src/pages/game-frame-pixi.tsx';
/** Lab page — kept in the graph so lab-only mounts are reported, not lost. */
const LAB_PAGE = 'src/pages/game-frame.tsx';
const GAMEFRAME_DIR = 'src/ui/idleVillage/components/gameFrame';
const REGISTRY_FILE = `${GAMEFRAME_DIR}/hudPanelRegistry.ts`;
const PANELS_HOOK = `${GAMEFRAME_DIR}/useHudPanels.ts`;

/** Dq — quest surfaces explicitly opted into the /game audit (artifact §C):
 *  everything under quests/ and questS1Lab/hud/. */
const QUEST_OPT_IN_DIRS = ['src/ui/idleVillage/quests', 'src/ui/idleVillage/questS1Lab/hud'];

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

export interface PanelBinding {
  id: string;
  /** Component files that implement the panel (not drivers/mounts). */
  sources: string[];
  /** Files that mount or drive the panel (page JSX, stage chrome). */
  mounts: { file: string; via: string }[];
  /** How the binding was resolved: direct data-hud-panel, JSX mount, session wrapper, unresolved. */
  resolution: 'data-hud-panel' | 'jsx-mount' | 'wrapper-prop' | 'hook-panels' | 'unresolved';
  /** Where the panel actually mounts: 'game' | 'lab' | 'both' | 'nowhere'. */
  mountedOn: 'game' | 'lab' | 'both' | 'nowhere';
}

export interface GameSurfaceDiscovery {
  generatedAt: string;
  sets: {
    A: { registry: string[]; panels: Record<string, string[]> };
    B: string[];
    C: { game: string[]; lab: string[] };
    Dq: string[];
    D: string[];
  };
  panelBindings: PanelBinding[];
  /** Files inside components/gameFrame/** not reachable from /game (candidates for removal review). */
  orphans: string[];
  /** For each orphan: files that still reference it (basename or path import). */
  orphanReferences: Record<string, string[]>;
  /** Stage-managed ids declared in config but never opened (dead wiring). */
  stageOnlyIds: { id: string; note: string }[];
  findings: string[];
}

/* ------------------------------------------------------------------ */
/* FS + TS module graph                                                */
/* ------------------------------------------------------------------ */

const toPosix = (p: string) => p.split(sep).join('/');

function walkDir(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const abs = join(dir, name);
    const st = statSync(abs);
    if (st.isDirectory()) walkDir(abs, out);
    else if (/\.(ts|tsx|css)$/.test(name)) out.push(toPosix(abs));
  }
  return out.sort();
}

/** Module specifiers in a source file — static/type/re-export/dynamic imports. */
function specifiersOf(text: string): string[] {
  const clean = text.replace(/\/\*[\s\S]*?\*\//g, '');
  const out: string[] = [];
  const re = /(?:import|export)\s+(?:[^'";]*?\sfrom\s*)?['"]([^'"]+)['"]|\bimport\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
  for (const m of clean.matchAll(re)) out.push(m[1] ?? m[2]);
  return out;
}

const RESOLVE_EXTS = ['.ts', '.tsx', '.css', '.json'];

/**
 * Fast specifier resolution — the project uses only `@/` → src/,
 * `@docs/` → src/docs/, `@/scripts/` → scripts/ and relative paths.
 * Package imports return null (outside the audited surface).
 */
function resolveSpec(root: string, spec: string, fromAbs: string): string | null {
  let p: string;
  if (spec.startsWith('@/scripts/')) p = join(root, 'scripts', spec.slice('@/scripts/'.length));
  else if (spec.startsWith('@docs/')) p = join(root, 'src/docs', spec.slice('@docs/'.length));
  else if (spec.startsWith('@/')) p = join(root, 'src', spec.slice(2));
  else if (spec.startsWith('.')) p = resolve(dirname(fromAbs), spec);
  else return null;
  if (existsSync(p) && statSync(p).isFile()) return p;
  for (const e of RESOLVE_EXTS) if (existsSync(p + e)) return p + e;
  for (const e of RESOLVE_EXTS) if (existsSync(join(p, `index${e}`))) return join(p, `index${e}`);
  if (/\.js$/.test(p)) {
    for (const e of ['.ts', '.tsx']) {
      const alt = p.replace(/\.js$/, e);
      if (existsSync(alt)) return alt;
    }
  }
  return null;
}

interface Graph {
  /** All resolved files inside src/, per entry point. */
  reachable: Record<string, string[]>;
  /** file → its resolved in-src dependencies. */
  edges: Record<string, string[]>;
  /** file → raw source (cached for binding scans). */
  sources: Record<string, string>;
}

/** BFS over the import graph from the entry points, inside src/ only. */
function buildGraph(root: string, entries: string[]): Graph {
  const srcRoot = join(root, 'src') + sep;
  const reachable: Record<string, Set<string>> = {};
  const edges: Record<string, string[]> = {};
  const sources: Record<string, string> = {};

  const crawl = (entry: string): Set<string> => {
    const seen = new Set<string>();
    const queue = [resolve(root, entry)];
    while (queue.length) {
      const file = queue.shift()!;
      if (seen.has(file) || !file.startsWith(srcRoot)) continue;
      seen.add(file);
      const text = readFileSync(file, 'utf8');
      sources[toPosix(relative(root, file))] = text;
      const deps = specifiersOf(text)
        .map((spec) => resolveSpec(root, spec, file))
        .filter((r): r is string => !!r && r.startsWith(srcRoot) && /\.(ts|tsx|css|json)$/.test(r) && !r.endsWith('.d.ts'));
      edges[toPosix(relative(root, file))] = deps.map((f) => toPosix(relative(root, f)));
      for (const dep of deps) if (!seen.has(dep)) queue.push(dep);
    }
    return seen;
  };

  for (const e of entries) reachable[e] = crawl(e);
  return {
    reachable: Object.fromEntries(Object.entries(reachable).map(([k, v]) => [k, [...v].map((f) => toPosix(relative(root, f))).sort()])),
    edges,
    sources,
  };
}

/* ------------------------------------------------------------------ */
/* Panel binding resolution (set A)                                    */
/* ------------------------------------------------------------------ */

interface ImportMap { [localName: string]: { file: string; spec: string } }

/** localName → {resolved file, exported name} for every import in a source file. */
function importMapOf(root: string, file: string, text: string): ImportMap {
  const sf = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const compilerOptions: ts.CompilerOptions = { baseUrl: root, paths: { '@/*': ['src/*'] } };
  const host = ts.createCompilerHost(compilerOptions);
  const map: ImportMap = {};
  const abs = resolve(root, file);
  sf.forEachChild((node) => {
    if (!ts.isImportDeclaration(node) || !node.moduleSpecifier || !ts.isStringLiteral(node.moduleSpecifier)) return;
    const r = ts.resolveModuleName(node.moduleSpecifier.text, abs, compilerOptions, host).resolvedModule;
    if (!r) return;
    const target = toPosix(relative(root, r.resolvedFileName));
    const clause = node.importClause;
    if (!clause) return;
    if (clause.name) map[clause.name.text] = { file: target, spec: 'default' };
    if (clause.namedBindings && ts.isNamedImports(clause.namedBindings)) {
      for (const el of clause.namedBindings.elements) {
        map[el.name.text] = { file: target, spec: el.propertyName?.text ?? el.name.text };
      }
    } else if (clause.namedBindings && ts.isNamespaceImport(clause.namedBindings)) {
      map[clause.namedBindings.name.text] = { file: target, spec: '*' };
    }
  });
  return map;
}

/** Follow `export { X } from './real'` one level when the import target is a
 *  barrel index file — panel bindings name the implementing file, not the
 *  re-export hub. */
function debarrel(root: string, file: string, spec: string, depth = 0): string {
  if (depth >= 2 || !/\/index\.tsx?$/.test(file) || spec === '*') return file;
  const abs = resolve(root, file);
  if (!existsSync(abs)) return file;
  const sf = ts.createSourceFile(file, readFileSync(abs, 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const compilerOptions: ts.CompilerOptions = { baseUrl: root, paths: { '@/*': ['src/*'] } };
  const host = ts.createCompilerHost(compilerOptions);
  let hit: string | null = null;
  sf.forEachChild((node) => {
    if (hit || !ts.isExportDeclaration(node) || !node.moduleSpecifier || !ts.isStringLiteral(node.moduleSpecifier)) return;
    if (!node.exportClause || !ts.isNamedExports(node.exportClause)) return;
    for (const el of node.exportClause.elements) {
      /* `export { X }` / `export { X as Y }` — el.name is the exported name. */
      if (el.name.text === spec || (el.propertyName?.text ?? el.name.text) === spec) {
        const r = ts.resolveModuleName(node.moduleSpecifier.text, abs, compilerOptions, host).resolvedModule;
        if (r) hit = toPosix(relative(root, r.resolvedFileName));
      }
    }
  });
  return hit ? debarrel(root, hit, spec === 'default' ? 'default' : spec, depth + 1) : file;
}

/**
 * Resolve a JSX tag to implementing files: direct import (through barrels),
 * or a local alias (`const Roster = cond ? A : B`) followed recursively.
 */
function resolveTag(
  root: string,
  sf: ts.SourceFile,
  imports: ImportMap,
  tag: string,
  found: Set<string>,
  depth = 0,
): void {
  const imp = imports[tag];
  if (imp) { found.add(debarrel(root, imp.file, imp.spec)); return; }
  if (depth >= 3) return;
  const decl = findDeclaration(sf, tag);
  if (!decl?.initializer) return;
  const ids = new Set<string>();
  const visit = (n: ts.Node) => {
    if (ts.isIdentifier(n) && /^[A-Z]/.test(n.text)) ids.add(n.text);
    ts.forEachChild(n, visit);
  };
  visit(decl.initializer);
  for (const id of ids) if (id !== tag) resolveTag(root, sf, imports, id, found, depth + 1);
}

/** Capitalized JSX tag names inside a node (component references only). */
function jsxTagsIn(node: ts.Node, out: Set<string> = new Set()): Set<string> {
  const visit = (n: ts.Node) => {
    if ((ts.isJsxElement(n) || ts.isJsxSelfClosingElement(n))) {
      const name = ts.isJsxElement(n) ? n.openingElement.tagName : n.tagName;
      if (ts.isIdentifier(name) && /^[A-Z]/.test(name.text)) out.add(name.text);
    }
    ts.forEachChild(n, visit);
  };
  visit(node);
  return out;
}

/**
 * Resolve the identifier wrapped by `StagePanelFrame` children to component
 * files. Handles: literal JSX children, `{var}` bound to a useMemo/arrow
 * returning JSX, and `{node}` forwarded through a `wrap*` prop into a hook
 * (the questDetail planner case).
 */
function resolveFrameChildren(
  root: string,
  pageFile: string,
  sf: ts.SourceFile,
  imports: ImportMap,
  frame: ts.JsxElement,
  sources: Record<string, string>,
): string[] {
  const found = new Set<string>();
  for (const child of frame.children) {
    if (ts.isJsxElement(child) || ts.isJsxSelfClosingElement(child)) {
      jsxTagsIn(child).forEach((t) => resolveTag(root, sf, imports, t, found));
    } else if (ts.isJsxExpression(child) && child.expression) {
      const expr = child.expression;
      /* {expr}: resolve identifiers to their initializers and harvest JSX. */
      const harvest = (e: ts.Expression, depth: number) => {
        if (depth > 4) return;
        if (ts.isIdentifier(e)) {
          const decl = findDeclaration(sf, e.text);
          if (decl) harvestInitializer(decl);
        } else if (ts.isParenthesizedExpression(e)) harvest(e.expression, depth + 1);
        else if (ts.isArrowFunction(e) || ts.isCallExpression(e) || ts.isConditionalExpression(e)) {
          jsxTagsIn(e).forEach((t) => resolveTag(root, sf, imports, t, found));
        }
      };
      const harvestInitializer = (decl: ts.Node) => {
        /* const x = useMemo(() => (<A/>)) / const x = (<A/>) / const x = (node) => (<W>{node}</W>) */
        jsxTagsIn(decl).forEach((t) => resolveTag(root, sf, imports, t, found));
        /* Wrapper-forward case: the var is a (node) => <Frame>{node}</Frame>
         * passed to a hook prop — the real component sits inside that hook's
         * `wrap(<X/>)` call site. */
        if (ts.isVariableDeclaration(decl) && decl.initializer && ts.isArrowFunction(decl.initializer)) {
          resolveWrapperProp(root, sf, imports, sources, decl.name.getText(), found);
        }
      };
      harvest(expr, 0);
      /* Direct JSX tags inside the expression itself (e.g. `{cond && <X/>}`). */
      jsxTagsIn(expr).forEach((t) => resolveTag(root, sf, imports, t, found));
    } else if (ts.isJsxExpression(child) && !child.expression) {
      /* {(res) => <X/>} render-prop children: tags are inside the arrow. */
      jsxTagsIn(child).forEach((t) => resolveTag(root, sf, imports, t, found));
    }
  }
  /* Frame wrapping a bare forwarded identifier (`{node}` — the questDetail
   * case): the enclosing arrow's variable is handed to a hook prop; the real
   * component sits inside that hook's `prop(<X/>)` call site. */
  if (!found.size) {
    let anc: ts.Node | undefined = frame.parent;
    while (anc && !ts.isArrowFunction(anc) && !ts.isFunctionExpression(anc)) anc = anc.parent;
    const holder = anc?.parent;
    /* arrow inside useCallback(...) inside `const v = ...` — or directly `const v = (n) => <Frame>{n}</Frame>`. */
    let varDecl: ts.VariableDeclaration | undefined;
    let n2: ts.Node | undefined = anc;
    while (n2) {
      if (ts.isVariableDeclaration(n2)) { varDecl = n2; break; }
      n2 = n2.parent;
    }
    if (varDecl) resolveWrapperProp(root, sf, imports, sources, varDecl.name.getText(), found);
  }
  return [...found];
}

/**
 * `varName` is a wrapper function prop (e.g. `wrapDetail: wrapQuestDetail`).
 * Find hook calls receiving `prop: varName`, then harvest the JSX passed to
 * `prop(<X/>)` inside the hook's own file.
 */
function resolveWrapperProp(
  root: string,
  pageSf: ts.SourceFile,
  imports: ImportMap,
  sources: Record<string, string>,
  varName: string,
  found: Set<string>,
): void {
  pageSf.forEachChild(function visit(n) {
    if (ts.isCallExpression(n) && n.arguments.length) {
      const [arg] = n.arguments;
      if (ts.isObjectLiteralExpression(arg)) {
        for (const prop of arg.properties) {
          if (ts.isPropertyAssignment(prop) && ts.isIdentifier(prop.initializer) && prop.initializer.text === varName) {
            const propName = prop.name.getText();
            const hookFile = imports[n.expression.getText()]?.file;
            const hookText = hookFile ? sources[hookFile] : undefined;
            if (hookText) {
              const hookSf = ts.createSourceFile(hookFile, hookText, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
              const hookImports = importMapOf(root, hookFile, hookText);
              hookSf.forEachChild(function walk(m) {
                /* `prop(<X/>)` — also `(prop ?? fallback)(<X/>)` chains. */
                if (ts.isCallExpression(m) && containsIdentifierRef(m.expression, propName) && jsxTagsIn(m).size) {
                  jsxTagsIn(m).forEach((t) => resolveTag(root, hookSf, hookImports, t, found));
                }
                ts.forEachChild(m, walk);
              });
            }
          }
        }
      }
    }
    ts.forEachChild(n, visit);
  });
}

function containsIdentifierRef(node: ts.Node, name: string): boolean {
  let hit = false;
  const visit = (n: ts.Node) => {
    if (ts.isIdentifier(n) && n.text === name) hit = true;
    if (!hit) ts.forEachChild(n, visit);
  };
  visit(node);
  return hit;
}

function findDeclaration(sf: ts.SourceFile, name: string): ts.VariableDeclaration | null {
  let found: ts.VariableDeclaration | null = null;
  const visit = (n: ts.Node) => {
    if (found) return;
    if (ts.isVariableDeclaration(n) && ts.isIdentifier(n.name) && n.name.text === name) found = n;
    ts.forEachChild(n, visit);
  };
  visit(sf);
  return found;
}

/* ------------------------------------------------------------------ */
/* Main discovery                                                      */
/* ------------------------------------------------------------------ */

/** Full mechanical discovery — exported for the anti-drift test. */
export function discoverGameSurface(rootDir: string): GameSurfaceDiscovery {
  const root = resolve(rootDir);
  const findings: string[] = [];

  /* B — the gameFrame glob. */
  const B = walkDir(join(root, GAMEFRAME_DIR)).map((f) => toPosix(relative(root, f)));

  /* C — the import graph from both pages. */
  const graph = buildGraph(root, [GAME_PAGE, LAB_PAGE]);
  const Cgame = new Set(graph.reachable[GAME_PAGE]);
  const Clab = new Set(graph.reachable[LAB_PAGE]);

  /* A — registry + hook + per-panel component bindings. */
  const registryText = readFileSync(resolve(root, REGISTRY_FILE), 'utf8');
  const panelIds = [...registryText.matchAll(/id:\s*'([a-zA-Z]+)'/g)].map((m) => m[1]);

  const pageSf = ts.createSourceFile(GAME_PAGE, graph.sources[GAME_PAGE] ?? '', ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const labSf = ts.createSourceFile(LAB_PAGE, graph.sources[LAB_PAGE] ?? '', ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const pageImports = importMapOf(root, GAME_PAGE, graph.sources[GAME_PAGE] ?? '');
  const labImports = importMapOf(root, LAB_PAGE, graph.sources[LAB_PAGE] ?? '');

  /** All JSX elements named `StagePanelFrame` in a source file, keyed by their panelId attr. */
  const framesByPanel = (sf: ts.SourceFile) => {
    const out = new Map<string, ts.JsxElement[]>();
    const visit = (n: ts.Node) => {
      if (ts.isJsxElement(n) && ts.isIdentifier(n.openingElement.tagName) && n.openingElement.tagName.text === 'StagePanelFrame') {
        const attr = n.openingElement.attributes.properties.find(
          (p): p is ts.JsxAttribute => ts.isJsxAttribute(p) && ts.isIdentifier(p.name) && p.name.text === 'panelId',
        );
        const id = attr?.initializer && ts.isStringLiteral(attr.initializer) ? attr.initializer.text : null;
        if (id) out.set(id, [...(out.get(id) ?? []), n]);
      }
      ts.forEachChild(n, visit);
    };
    visit(sf);
    return out;
  };
  const gameFrames = framesByPanel(pageSf);
  const labFrames = framesByPanel(labSf);

  /** Files that carry a static `data-hud-panel="<id>"` (the component IS the panel). */
  const hudPanelOwners = new Map<string, string[]>();
  for (const [rel, text] of Object.entries(graph.sources)) {
    for (const m of text.matchAll(/data-hud-panel=["']([a-zA-Z-]+)["']/g)) {
      hudPanelOwners.set(m[1], [...(hudPanelOwners.get(m[1]) ?? []), rel]);
    }
  }

  const panelBindings: PanelBinding[] = [];
  const panelsA: Record<string, string[]> = {};

  for (const id of panelIds) {
    const mounts: PanelBinding['mounts'] = [];
    const sources = new Set<string>();

    /* Mounts via StagePanelFrame children (game + lab). */
    for (const f of gameFrames.get(id) ?? []) {
      resolveFrameChildren(root, GAME_PAGE, pageSf, pageImports, f, graph.sources).forEach((s) => sources.add(s));
      mounts.push({ file: GAME_PAGE, via: 'StagePanelFrame' });
    }
    for (const f of labFrames.get(id) ?? []) {
      resolveFrameChildren(root, LAB_PAGE, labSf, labImports, f, graph.sources).forEach((s) => sources.add(s));
      mounts.push({ file: LAB_PAGE, via: 'StagePanelFrame' });
    }

    /* Mounts via `visible.<id> && <X/>` / `visible['<id>'] &&` conditionals. */
    const conditionalMounts = (sf: ts.SourceFile, page: string, imports: ImportMap) => {
      const visit = (n: ts.Node) => {
        if (ts.isBinaryExpression(n) && n.operatorToken.kind === ts.SyntaxKind.AmpersandAmpersandToken) {
          const left = n.left.getText();
          const re = new RegExp(`visible\\.(?:${id})\\b|visible\\[['"\`]${id}['"\`]\\]|visible\\.[a-zA-Z_$]+\\s*===\\s*['"]${id}['"]`);
          if (re.test(left)) {
            jsxTagsIn(n.right).forEach((t) => resolveTag(root, sf, imports, t, sources));
            mounts.push({ file: page, via: 'visible-conditional' });
          }
        }
        ts.forEachChild(n, visit);
      };
      visit(sf);
    };
    conditionalMounts(pageSf, GAME_PAGE, pageImports);
    conditionalMounts(labSf, LAB_PAGE, labImports);

    /* Panels that ARE their data-hud-panel element (quest window, stash…). */
    for (const owner of hudPanelOwners.get(id) ?? []) sources.add(owner);

    /* heroSheet: mounted through useHeroSheet's panelNode (overlay-exempt). */
    if (id === 'heroSheet') {
      for (const f of ['src/ui/idleVillage/components/gameFrame/useHeroSheet.tsx', 'src/ui/idleVillage/components/gameFrame/HeroSheetPanel.tsx']) {
        if (Cgame.has(f) || Clab.has(f) || existsSync(resolve(root, f))) sources.add(f);
      }
      mounts.push({ file: GAME_PAGE, via: 'useHeroSheet.panelNode' });
    }

    const mountedOn: PanelBinding['mountedOn'] =
      mounts.some((m) => m.file === GAME_PAGE) && mounts.some((m) => m.file === LAB_PAGE) ? 'both'
      : mounts.some((m) => m.file === GAME_PAGE) ? 'game'
      : mounts.some((m) => m.file === LAB_PAGE) ? 'lab' : 'nowhere';

    const resolution: PanelBinding['resolution'] =
      (hudPanelOwners.get(id) ?? []).length ? 'data-hud-panel'
      : mounts.length ? (id === 'questDetail' ? 'wrapper-prop' : 'jsx-mount')
      : id === 'heroSheet' ? 'hook-panels' : 'unresolved';

    panelBindings.push({ id, sources: [...sources].sort(), mounts, resolution, mountedOn });
    panelsA[id] = [...sources].sort();
    if (!sources.size) findings.push(`panel "${id}" has no component source on /game (mountedOn=${mountedOn})`);
  }

  /* Stage-only ids: declared in stageZones.panels + StagePanelEscape but never
   * opened — dead wiring pending another WS. */
  const configText = readFileSync(resolve(root, 'src/balancing/config/idleVillage/gameFrameConfig.ts'), 'utf8');
  /* Only the keys of `stageZones.panels` count as stage tenants — slice that
   * braced block by paren counting so nested config keys stay out. */
  const panelsAt = configText.indexOf('panels: {', configText.indexOf('stageZones'));
  let stageIds: string[] = [];
  if (panelsAt >= 0) {
    let depth = 0;
    let end = panelsAt;
    for (; end < configText.length; end++) {
      const ch = configText[end];
      if (ch === '{') depth++;
      else if (ch === '}' && --depth === 0) break;
    }
    const block = configText.slice(panelsAt, end);
    stageIds = [...new Set([...block.matchAll(/^\s{6}([a-zA-Z]+):\s*\{/gm)].map((m) => m[1]))];
  }
  const allSources = Object.values(graph.sources);
  const stageOnlyIds = stageIds
    .filter((id) => !panelIds.includes(id))
    .map((id) => {
      const opened = allSources.some((t) => new RegExp(`(?:open|setOpen|toggle)\\(['"\`]${id}['"\`]`).test(t));
      const mounted = (gameFrames.get(id)?.length ?? 0) + (labFrames.get(id)?.length ?? 0) > 0;
      return { id, note: `stageZones tenant — opened=${opened}, StagePanelFrame mounts=${mounted}` };
    });

  /* Orphans: B files unreachable from /game. */
  const orphans = B.filter((f) => !Cgame.has(f));
  const orphanReferences: Record<string, string[]> = {};
  if (orphans.length) {
    const baseNames = new Map(orphans.map((f) => [f.split('/').pop()!.replace(/\.(tsx?|css)$/, ''), f]));
    for (const [rel, text] of Object.entries(graph.sources)) {
      for (const [base, file] of baseNames) {
        if (new RegExp(`\\b${base}\\b`).test(text) && rel !== file) {
          orphanReferences[file] = [...new Set([...(orphanReferences[file] ?? []), rel])];
        }
      }
    }
    /* References from files outside the graph (pages, tests) — scanned by path. */
    const extraScanDirs = ['src/pages', 'tests', 'src/ui/idleVillage/components/gameFrame'];
    for (const dir of extraScanDirs) {
      const absDir = join(root, dir);
      if (!existsSync(absDir)) continue;
      for (const f of walkDir(absDir)) {
        const rel = toPosix(relative(root, f));
        const text = readFileSync(f, 'utf8');
        for (const [base, file] of baseNames) {
          if (rel !== file && new RegExp(`\\b${base}\\b`).test(text)) {
            orphanReferences[file] = [...new Set([...(orphanReferences[file] ?? []), rel])];
          }
        }
      }
    }
    for (const o of orphans) if (!orphanReferences[o]) orphanReferences[o] = [];
  }

  /* D = A ∪ B ∪ C(game) ∪ Dq — the lab page contributes to the audit of
   * shared files but does not pull lab-only files into the guarded set.
   * §C: C intersects the in-scope perimeter — src/ui/** + src/pages/** —
   * not every dependency is an audited HUD surface file (engine, balancing
   * and store modules stay dependencies, not guarded components). */
  const inScope = (f: string) => f.startsWith('src/ui/') || f.startsWith('src/pages/');
  const Afiles = new Set([REGISTRY_FILE, PANELS_HOOK]);
  for (const b of panelBindings) b.sources.forEach((s) => Afiles.add(s));
  const Dq = QUEST_OPT_IN_DIRS.flatMap((d) =>
    existsSync(join(root, d)) ? walkDir(join(root, d)).map((f) => toPosix(relative(root, f))) : [],
  ).sort();
  const D = [...new Set([...Afiles, ...B, ...[...Cgame].filter(inScope), ...Dq])].sort();

  return {
    generatedAt: new Date().toISOString(),
    sets: {
      A: { registry: [REGISTRY_FILE, PANELS_HOOK], panels: panelsA },
      B,
      C: { game: [...Cgame].sort(), lab: [...Clab].sort() },
      Dq,
      D,
    },
    panelBindings,
    orphans,
    orphanReferences,
    stageOnlyIds,
    findings,
  };
}

/* ------------------------------------------------------------------ */
/* Guard scans — mirrors of the checks in hudGuards.test.ts, exported so */
/* the manifest can baseline pre-existing debt (ratchet: recorded debt   */
/* passes once, NEW violations fail).                                    */
/* ------------------------------------------------------------------ */

const stripComments = (source: string) => source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');

/** CSS colour literals in a file (same regex as the hudGuards check). */
export function colorLiteralOffenses(text: string): string[] {
  return [...new Set(stripComments(text).match(/#[0-9a-fA-F]{3,8}\b|\brgba?\(|\bhsla?\(/g) ?? [])];
}

/** `fontSize`/`font-size`/`text-[Npx]` under 12px (same regex as hudGuards). */
export function smallFontOffenses(text: string): string[] {
  const out: string[] = [];
  for (const m of stripComments(text).matchAll(/fontSize:\s*'?(\d+(?:\.\d+)?)(?:px)?'?(?![\d.]|em|rem|%)|font-size:\s*(\d+(?:\.\d+)?)px|text-\[(\d+(?:\.\d+)?)px\]/g)) {
    if (Number(m[1] ?? m[2] ?? m[3]) < 12) out.push(m[0]);
  }
  return out;
}

/** `--skin-hud-*` token references not defined in BASE_SKIN_CSS_VARS. */
export function missingTokenOffenses(text: string): string[] {
  const out: string[] = [];
  for (const m of text.matchAll(/(?:var\(|-\()(--skin-hud-[a-z0-9-]+)/g)) {
    if (!(m[1] in BASE_SKIN_CSS_VARS)) out.push(m[1]);
  }
  return [...new Set(out)];
}

/**
 * Files the style guards apply to: UI component/style sources on the /game
 * surface. Engine and balancing `.ts` modules legitimately hold palette and
 * gameplay constants — they stay in the drift set but out of style checks.
 */
export const isStyleCheckedFile = (f: string): boolean =>
  (/\.tsx$/.test(f) && f.startsWith('src/ui/')) || /^src\/pages\/game-frame/.test(f) || /\.css$/.test(f);

/** Per-file pre-existing violations across the discovered surface. */
function violationBaseline(root: string, files: string[]) {
  const baseline: Record<string, { colorLiterals?: string[]; smallFonts?: string[]; missingTokens?: string[] }> = {};
  for (const f of files) {
    if (!isStyleCheckedFile(f)) continue;
    const abs = join(root, f);
    if (!existsSync(abs)) continue;
    const text = readFileSync(abs, 'utf8');
    const entry: { colorLiterals?: string[]; smallFonts?: string[]; missingTokens?: string[] } = {};
    if (!f.endsWith('.css')) {
      const c = colorLiteralOffenses(text);
      if (c.length) entry.colorLiterals = c;
      const s = smallFontOffenses(text);
      if (s.length) entry.smallFonts = s;
    }
    const t = missingTokenOffenses(text);
    if (t.length) entry.missingTokens = t;
    if (Object.keys(entry).length) baseline[f] = entry;
  }
  return baseline;
}

/* ------------------------------------------------------------------ */
/* CLI                                                                 */
/* ------------------------------------------------------------------ */

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1]);
if (isMain) {
  const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
  const args = process.argv.slice(2);
  const d = discoverGameSurface(root);
  if (args[0] === '--emit-manifest') {
    const target = args[1];
    const baseline = violationBaseline(root, d.sets.D);
    const body = `/**
 * GENERATED — do not edit by hand.
 * Produced by: npx tsx scripts/verification/discoverGameSurface.ts --emit-manifest ${target}
 * PLAN-043 WS-5 artifact-r002 §C: the mechanically discovered /game surface
 * (D = A ∪ B ∪ C ∪ Dq). The anti-drift test in hudGuards.test.ts recomputes
 * this set and fails when a file lands on /game outside the guarded list.
 */
export const GAME_SURFACE_FILES = [
${d.sets.D.map((f) => `  '${f}',`).join('\n')}
] as const;

/** Registry panel id → implementing component files (set A detail). */
export const GAME_SURFACE_PANEL_BINDINGS: Record<string, readonly string[]> = {
${Object.entries(d.sets.A.panels).map(([id, files]) => `  ${id}: [${files.map((f) => `'${f}'`).join(', ')}],`).join('\n')}
};

/** Shipped /game files still importing lucide-react — migration debt for
 *  B6.2 (map each to the engraved set; dev-tool imports outside D may stay
 *  per Director ruling G.1). New files joining this list fail the guard. */
export const GAME_SURFACE_LUCIDE_FILES: readonly string[] = [
${d.sets.D.filter((f) => {
  const abs = join(root, f);
  return !f.endsWith('.css') && existsSync(abs) && /from\s+['"]lucide-react['"]/.test(readFileSync(abs, 'utf8'));
}).map((f) => `  '${f}',`).join('\n')}
];

/**
 * Pre-existing guard debt on the discovered surface — recorded at baseline
 * (${d.generatedAt}). The ratchet rule: entries here pass once; any NEW
 * violation (new file in the list, or a new offense inside a listed file)
 * fails the hudGuards surface checks. Debt entries are tracked as WS-5
 * defect records and burn down during implementation.
 */
export const GAME_SURFACE_VIOLATION_BASELINE: Record<
  string,
  { colorLiterals?: string[]; smallFonts?: string[]; missingTokens?: string[] }
> = {
${Object.entries(baseline).map(([f, e]) => `  '${f}': { ${[
  e.colorLiterals ? `colorLiterals: [${e.colorLiterals.map((v) => JSON.stringify(v)).join(', ')}]` : '',
  e.smallFonts ? `smallFonts: [${e.smallFonts.map((v) => JSON.stringify(v)).join(', ')}]` : '',
  e.missingTokens ? `missingTokens: [${e.missingTokens.map((v) => JSON.stringify(v)).join(', ')}]` : '',
].filter(Boolean).join(', ')} },`).join('\n')}
};
`;
    writeFileSync(target, body);
    console.log(`manifest → ${target} (${d.sets.D.length} files)`);
  } else {
    const json = JSON.stringify(d, null, 2);
    if (args[0] === '--out' && args[1]) writeFileSync(args[1], json + '\n');
    else console.log(json);
  }
}
