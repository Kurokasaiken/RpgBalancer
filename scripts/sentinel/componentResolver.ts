/**
 * componentResolver — resolves a Sentinel finding to its owning living
 * contract (`PLAN-054`) and PLAN-077 surface (PLAN-078 T-004).
 *
 * Ownership is resolved from the finding's normalized `target`:
 *  - `data-testid`/`data-hud-panel` tokens are searched inside every
 *    contract's `root_file` + `scope_files` (testids live in source);
 *  - `root_file` hits outrank `scope_files` hits;
 *  - the owning surface is the `.mw/surface-map.json` entry whose globs
 *    cover the component's `root_file`;
 *  - unresolved findings NEVER ingest — they degrade to digest observations
 *    (owner integrity: r004).
 */
import fs from 'node:fs';
import path from 'node:path';
import { computeManifest, expandGlob } from '../ledger/surfaceManifest';

export interface ResolvedOwnership {
  component_id: string;
  surface_id: string | null;
  scope_files: string[];
  /** sha256 over the sorted content-hashes of scope_files — reopen gate key. */
  surface_manifest_hash: string;
  confidence: 'root-file' | 'scope-file' | 'unresolved';
}

interface ContractDoc {
  id: string;
  root_file?: string;
  scope_files: string[];
}

/** Extracts the identifying token from a normalized selector. */
export function identityToken(target: string | undefined): string | null {
  if (!target) return null;
  const m = target.match(/data-(?:testid|hud-panel|stage-panel|skin|building-pin|nav-id)="([^"]+)"/);
  if (m) return m[1];
  const cls = target.match(/\.([\w-]+)/);
  return cls?.[1] ?? null;
}

/** Parses a contract markdown's frontmatter-lite fields (id, root_file, scope_files). */
function parseContract(file: string): ContractDoc | null {
  const text = fs.readFileSync(file, 'utf8');
  const id = text.match(/^id:\s*(\S+)/m)?.[1];
  if (!id) return null;
  const root = text.match(/^root_file:\s*(\S+)/m)?.[1];
  const scope: string[] = [];
  const scopeBlock = text.match(/^scope_files:\n((?:\s*-\s+.+\n?)+)/m);
  if (scopeBlock) {
    for (const line of scopeBlock[1].split('\n')) {
      const m = line.match(/^\s*-\s+(\S+)/);
      if (m) scope.push(m[1]);
    }
  }
  return { id, root_file: root, scope_files: scope.length ? scope : root ? [root] : [] };
}

/** Loads every component contract under `contractsDir`. */
export function loadContracts(contractsDir = '.mw/contracts/components'): ContractDoc[] {
  if (!fs.existsSync(contractsDir)) return [];
  return fs
    .readdirSync(contractsDir)
    .filter((f) => f.endsWith('.md'))
    .map((f) => parseContract(path.join(contractsDir, f)))
    .filter((c): c is ContractDoc => c !== null);
}

interface SurfaceMap {
  surfaces: { id: string; globs: string[] }[];
}

/** Content-hash manifest over a contract's scope files (reopen-gate key).
 *  Delegates to PLAN-077 `computeManifest` so the hash is the SAME revision
 *  identity the ledger uses — `sha256` over sorted {path, sha256, size}. */
export function manifestHashOf(scopeFiles: string[], rootDir = '.'): string {
  const result = computeManifest(
    { kind: 'defect', surface_id: '__sentinel__', expected_files: scopeFiles, globs: [] },
    rootDir,
    { records: [], history_complete: true },
  );
  return result.manifest_hash ?? '';
}

/** Finds the surface whose globs cover `file`. */
export function surfaceForFile(file: string, mapPath = '.mw/surface-map.json', rootDir = '.'): string | null {
  if (!fs.existsSync(mapPath)) return null;
  const map = JSON.parse(fs.readFileSync(mapPath, 'utf8')) as SurfaceMap;
  for (const s of map.surfaces) {
    for (const g of s.globs) {
      if (expandGlob(g, rootDir).includes(file)) return s.id;
    }
  }
  return null;
}

/**
 * Resolves a finding target to contract + surface. `cache` lets a run scan
 * the filesystem once for repeated testids.
 */
export function resolveComponent(
  target: string | undefined,
  opts: {
    contractsDir?: string;
    surfaceMapPath?: string;
    rootDir?: string;
    _cache?: Map<string, ContractDoc[]>;
  } = {},
): ResolvedOwnership {
  const rootDir = opts.rootDir ?? '.';
  const token = identityToken(target);
  const unresolved: ResolvedOwnership = {
    component_id: 'unresolved',
    surface_id: null,
    scope_files: [],
    surface_manifest_hash: '',
    confidence: 'unresolved',
  };
  if (!token) return unresolved;

  const cacheKey = `${opts.contractsDir ?? '.mw/contracts/components'}:${token}`;
  const contracts = loadContracts(opts.contractsDir);

  // Score contracts: a scope/root file containing the token is a hit.
  const hits = opts._cache?.get(cacheKey) ?? contracts.filter((c) =>
    c.scope_files.concat(c.root_file ? [c.root_file] : []).some((f) => {
      const p = path.join(rootDir, f);
      return fs.existsSync(p) && fs.readFileSync(p, 'utf8').includes(token);
    }),
  );
  opts._cache?.set(cacheKey, hits);
  if (hits.length === 0) return unresolved;

  const rootHit = hits.find((c) => c.root_file && fs.existsSync(path.join(rootDir, c.root_file)) && fs.readFileSync(path.join(rootDir, c.root_file), 'utf8').includes(token));
  const best = rootHit ?? hits[0];
  const surface = best.root_file ? surfaceForFile(best.root_file, opts.surfaceMapPath, rootDir) : null;
  return {
    component_id: best.id,
    surface_id: surface,
    scope_files: best.scope_files,
    surface_manifest_hash: manifestHashOf(best.scope_files, rootDir),
    confidence: rootHit ? 'root-file' : 'scope-file',
  };
}
