// PLAN-118 T-1: estrae le route lab da App.tsx in un registry alias-swappable.
import { readFileSync, writeFileSync, mkdirSync, copyFileSync } from 'node:fs';
const ROOT = new URL('../../', import.meta.url).pathname;
const APP = ROOT + 'src/App.tsx';
const src = readFileSync(APP, 'utf8');
const lines = src.split('\n');
const lineStart = (ln) => lines.slice(0, ln).join('\n').length; // abs offset inizio riga
const lineOf = (abs) => { let n = 0; for (let i = 0, o = 0; i < lines.length; i++) { if (o >= abs) return n; o += lines[i].length + 1; n++; } return lines.length - 1; };

function findBlockEnd(absStart) {
  let depth = 0, inStr = null, inLine = false, inBlock = false;
  for (let i = absStart; i < src.length; i++) {
    const c = src[i], n = src[i + 1];
    if (inLine) { if (c === '\n') inLine = false; continue; }
    if (inBlock) { if (c === '*' && n === '/') { inBlock = false; i++; } continue; }
    if (inStr) { if (c === '\\') { i++; continue; } if (c === inStr) inStr = null; continue; }
    if (c === '/' && n === '/') { inLine = true; i++; continue; }
    if (c === '/' && n === '*') { inBlock = true; i++; continue; }
    if (c === "'" || c === '"' || c === '`') { inStr = c; continue; }
    if (c === '{') depth++;
    if (c === '}') { depth--; if (depth === 0) return i; }
  }
  return -1;
}

// ---- 1. lazy decls ----
const lazies = new Map();
lines.forEach((l, i) => {
  const m = l.match(/^const (\w+) = lazy\(\(\) => import\('([^']+)'\)(\.then\(m => \(\{ default: m\.(\w+) \}\)\))?\);/);
  if (m) lazies.set(m[1], { spec: m[2], named: m[4] || null, line: i });
});

// ---- 2. is*Path consts ----
const pathConsts = new Map();
for (let i = 0; i < lines.length; i++) {
  let m = lines[i].match(/^  const (is\w+Path) = typeof window !== 'undefined' && window\.location\.pathname === '([^']+)';/);
  if (m) { pathConsts.set(m[1], { paths: [m[2]], start: i, end: i }); continue; }
  m = lines[i].match(/^  const (is\w+Path) =\s*$/);
  if (!m) continue;
  let j = i + 1, txt = '';
  while (j < Math.min(i + 5, lines.length) && !lines[j - 1].includes(';')) { txt += lines[j] + ' '; j++; }
  const one = txt.match(/pathname === '([^']+)'/);
  const set = txt.match(/\[\s*([^\]]+)\]\.includes\([^)]*pathname\)/);
  if (one) pathConsts.set(m[1], { paths: [one[1]], start: i, end: j - 1 });
  else if (set) pathConsts.set(m[1], { paths: [...set[1].matchAll(/'([^']+)'/g)].map(x => x[1]), start: i, end: j - 1 });
}

// ---- 3. if (isXPath) blocks ----
const KEPT = new Set(['/', '/game', '/mappa2-lab', '/index.html']);
const ifBlocks = [];
for (const [name, info] of pathConsts) {
  const li = lines.findIndex(l => l.trim() === `if (${name}) {`);
  if (li === -1) continue;
  const end = findBlockEnd(lineStart(li) + lines[li].indexOf('{'));
  const block = src.slice(lineStart(li), end + 1);
  const comps = [...block.matchAll(/<(\w+)[\s/>]/g)].map(x => x[1]).filter(n => lazies.has(n));
  ifBlocks.push({ name, line: li, endLine: lineOf(end), block, comp: comps[0] || null, comps, paths: info.paths });
}

// ---- 4. uso dei lazy fuori dagli if-block e fuori dalle decl ----
const killIfLines = new Set();
let firstIfLine = Infinity;
for (const b of ifBlocks) { for (let i = b.line; i <= b.endLine; i++) killIfLines.add(i); firstIfLine = Math.min(firstIfLine, b.line); }
const outsideLines = lines.filter((_, i) => !killIfLines.has(i) && ![...lazies.values()].some(l => l.line === i)).join('\n');
const usedOutside = new Set([...lazies.keys()].filter(n => new RegExp(`\\b${n}\\b`).test(outsideLines)));

const labIfs = ifBlocks.filter(b => !b.paths.some(p => KEPT.has(p)));
const registry = [], skipped = [];
for (const b of labIfs) {
  if (!b.comp || b.comps.length !== 1) { skipped.push({ paths: b.paths, comps: b.comps }); continue; }
  const lz = lazies.get(b.comp);
  for (const p of b.paths) registry.push({ path: p, comp: b.comp, spec: lz.spec, named: lz.named });
}
const labOnlyComps = new Set(registry.map(r => r.comp).filter(c => !usedOutside.has(c)));

// ---- 5. emit registry files ----
mkdirSync(ROOT + 'src/deploy', { recursive: true });
const pathsSorted = [...new Set(registry.map(r => r.path))].sort();
writeFileSync(ROOT + 'src/deploy/labRouteData.ts',
`// GENERATO da scripts/deploy/_transformT1.mjs — PLAN-118 T-1. Non editare a mano.
export const LAB_PATHS: readonly string[] = ${JSON.stringify(pathsSorted, null, 1)};
export const LAB_PATHS_SET: ReadonlySet<string> = new Set(LAB_PATHS);
`);
const lazyLine = (r) => `lazy(() => import('${r.spec.replace(/^\.\//, '../')}')${r.named ? `.then(m => ({ default: m.${r.named} }))` : ''})`;
const hdr = `import { lazy } from 'react';
import type { ComponentType, LazyExoticComponent } from 'react';
export { LAB_PATHS, LAB_PATHS_SET } from './labRouteData';
export type LabRouteComponents = Record<string, LazyExoticComponent<ComponentType>>;
`;
writeFileSync(ROOT + 'src/deploy/labRoutes.ts', `${hdr}
export const LAB_ROUTE_COMPONENTS: LabRouteComponents = {
${registry.map(r => `  ${JSON.stringify(r.path)}: ${lazyLine(r)},`).join('\n')}
};
`);
writeFileSync(ROOT + 'src/deploy/labRoutes.slim.ts', `${hdr}
// Profilo slim (VITE_DEPLOY_SLIM): nessun componente lab -> nessun import() nel grafo.
export const LAB_ROUTE_COMPONENTS: LabRouteComponents = {};
`);

// ---- 6. kill set: lab ifs (non kept), lazy lab-only, is*Path non piu' usati ----
const kill = new Set();
const skippedLines = new Set(skipped.flatMap(() => [])); // skipped restano intatti
const skippedBlockLines = new Set();
// i lab if con skipped NON vengono rimossi
const skippedNames = new Set(labIfs.filter(b => skipped.some(s => s.paths === b.paths)).map(b => b.name));
for (const b of labIfs) {
  if (skippedNames.has(b.name)) continue;
  for (let i = b.line; i <= b.endLine; i++) kill.add(i);
}
for (const n of labOnlyComps) kill.add(lazies.get(n).line);
// is*Path ancora referenziati dopo la rimozione? conta su outsideLines
for (const [name, info] of pathConsts) {
  const uses = (outsideLines.match(new RegExp(`\\b${name}\\b`, 'g')) || []).length - 1; // meno la decl
  if (uses <= 0 && !skippedNames.has(name)) for (let i = info.start; i <= info.end; i++) kill.add(i);
}

// ---- 7. riscrittura ----
const firstKilledIf = Math.min(...labIfs.filter(b => !skippedNames.has(b.name)).map(b => b.line));
const anchorLine = lines.findIndex((_, i) => i > firstKilledIf && !kill.has(i));
const keptIfLines = new Set();
for (const b of ifBlocks.filter(b => b.paths.some(p => KEPT.has(p)))) for (let i = b.line; i <= b.endLine; i++) keptIfLines.add(i);
for (const i of keptIfLines) kill.delete(i); // i kept if RESTANO
// attenzione: keptIfLines sottrae righe condivise? i blocchi non si sovrappongono — ok
const out = [];
lines.forEach((l, i) => {
  if (i === anchorLine) {
    out.push(`  {`,
      `    const labPathname = typeof window !== 'undefined' ? window.location.pathname : '';`,
      `    const LabComponent = LAB_ROUTE_COMPONENTS[labPathname];`,
      `    if (LabComponent) {`,
      `      return (`,
      `        <ErrorBoundary componentName={labPathname}>`,
      `          <Suspense fallback={null}>`,
      `            <LabComponent />`,
      `          </Suspense>`,
      `        </ErrorBoundary>`,
      `      );`,
      `    }`,
      `    if (LAB_PATHS_SET.has(labPathname)) {`,
      `      return <RouteUnavailable />;`,
      `    }`,
      `  }`, ``);
  }
  if (!kill.has(i)) out.push(l);
});
let final = out.join('\n');
final = final.replace(
  /(import \{[^\n]*\} from 'react';)/,
  `$1\nimport { LAB_ROUTE_COMPONENTS, LAB_PATHS_SET } from './deploy/labRoutes';\nimport { RouteUnavailable } from './deploy/RouteUnavailable';`
);
writeFileSync(APP + '.bak', src);
writeFileSync(APP, final);
console.log(JSON.stringify({
  lazies: lazies.size, pathConsts: pathConsts.size, ifBlocks: ifBlocks.length, labIfs: labIfs.length,
  registryEntries: registry.length, labPaths: pathsSorted.length,
  labCompsRemoved: labOnlyComps.size, constsRemoved: [...pathConsts.keys()].filter(k => { const i = pathConsts.get(k); let r = false; for (let x = i.start; x <= i.end; x++) if (kill.has(x)) r = true; return r; }).length,
  skipped, anchorLine,
}, null, 1));
