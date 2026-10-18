/**
 * surfaceMap — layer file/glob → superficie (PLAN-044 T-002 / S1a).
 *
 * La mappa dichiara, per ogni superficie, i glob dei file coperti e gli
 * `expected_checks` (id di contratto CTR o nomi di check) da rieseguire
 * quando la superficie è toccata. I campi `proposed_by`/`approved_at`/
 * `source` sono audit — non autorizzazione: l'autorizzazione è il batch
 * `mapping-proposal` approvato dal Director sullo sha256 esatto.
 *
 * Anti-glob: un entry che copre > `max_files_per_entry` file o un glob su
 * directory root richiede `anti_glob_confirmed: true` (conferma esplicita
 * per-entry, parte del batch approvato).
 */
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

export const SURFACE_MAP_REL = '.mw/surface-map.json';
export const PROPOSALS_DIR_REL = '.mw/mapping-proposals';
export const APPROVALS_REL = '.mw/mapping-approvals.jsonl';
export const EXCEPTIONS_REL = '.mw/coverage-exceptions.jsonl';
export const DIRECTOR_ANSWERS_REL = '.mw/director-answers.jsonl';

export interface SurfaceEntry {
  id: string;
  globs: string[];
  expected_checks: string[];
  anti_glob_confirmed?: boolean;
  proposed_by?: string;
  approved_at?: string | null;
  source?: string;
}

export interface SurfaceMap {
  schema_version: number;
  anti_glob: { max_files_per_entry: number; forbid_root_glob: boolean };
  surfaces: SurfaceEntry[];
}

/** Chiave funzionale dell'entry: i campi audit non contano per l'approvazione. */
export function functionalKey(e: SurfaceEntry): string {
  return JSON.stringify({
    id: e.id,
    globs: [...e.globs].sort(),
    expected_checks: [...e.expected_checks].sort(),
    anti_glob_confirmed: e.anti_glob_confirmed === true,
  });
}

export function parseSurfaceMap(text: string): SurfaceMap {
  const parsed = JSON.parse(text) as SurfaceMap;
  if (!Array.isArray(parsed.surfaces)) {
    throw new Error('surface-map: campo "surfaces" mancante o non array');
  }
  if (!parsed.anti_glob || typeof parsed.anti_glob.max_files_per_entry !== 'number') {
    throw new Error('surface-map: campo "anti_glob.max_files_per_entry" mancante');
  }
  const ids = new Set<string>();
  for (const s of parsed.surfaces) {
    if (!s.id || !Array.isArray(s.globs) || !Array.isArray(s.expected_checks)) {
      throw new Error(`surface-map: entry malformata (${JSON.stringify(s).slice(0, 80)})`);
    }
    if (ids.has(s.id)) throw new Error(`surface-map: id duplicato "${s.id}"`);
    ids.add(s.id);
  }
  return parsed;
}

export function loadSurfaceMap(repoRoot: string): SurfaceMap | null {
  const p = path.join(repoRoot, SURFACE_MAP_REL);
  if (!existsSync(p)) return null;
  return parseSurfaceMap(readFileSync(p, 'utf8'));
}

/** Glob minimale: `**` = qualunque profondità, `*` = dentro un segmento, `?` = un carattere. */
export function globToRegExp(glob: string): RegExp {
  const re = glob
    .split('')
    .reduce<string[]>((acc, ch, i, arr) => {
      if (ch === '*') {
        if (arr[i + 1] === '*') return acc; // gestito dal primo '*'
        if (arr[i - 1] === '*') {
          acc.push('.*');
          return acc;
        }
        acc.push('[^/]*');
        return acc;
      }
      if (ch === '?') {
        acc.push('[^/]');
        return acc;
      }
      acc.push(ch.replace(/[.+^${}()|[\]\\]/g, '\\$&'));
      return acc;
    }, [])
    .join('');
  return new RegExp(`^${re}$`);
}

export function globMatch(glob: string, file: string): boolean {
  const g = glob.replace(/^\.\//, '');
  const f = file.replace(/^\.\//, '');
  if (globToRegExp(g).test(f)) return true;
  // Convenienza: un glob senza wildcard iniziale matcha anche come suffisso
  // di path (`gameFrame/HudGameMenu.tsx` ↔ `src/.../gameFrame/HudGameMenu.tsx`).
  if (!g.includes('/') && globToRegExp(`**/${g}`).test(f)) return true;
  return false;
}

export function surfaceFor(file: string, map: SurfaceMap): SurfaceEntry[] {
  return map.surfaces.filter((s) => s.globs.some((g) => globMatch(g, file)));
}

/**
 * Un glob è "root-level" se il primo segmento contiene un wildcard
 * (`*.md`, `*`): matcha potenzialmente qualunque file alla radice del repo.
 */
export function isRootLevelGlob(glob: string): boolean {
  const first = glob.replace(/^\.\//, '').split('/')[0];
  return /[*?]/.test(first);
}

export interface AntiGlobIssue {
  surface_id: string;
  glob: string;
  reason: string;
  matched?: number;
}

/** Valida le entry contro l'inventario file corrente del repo. */
export function checkAntiGlob(
  map: SurfaceMap,
  allFiles: string[],
): AntiGlobIssue[] {
  const issues: AntiGlobIssue[] = [];
  const maxFiles = map.anti_glob.max_files_per_entry;
  for (const s of map.surfaces) {
    if (s.anti_glob_confirmed === true) continue;
    if (map.anti_glob.forbid_root_glob) {
      for (const g of s.globs) {
        if (isRootLevelGlob(g)) {
          issues.push({
            surface_id: s.id,
            glob: g,
            reason: `glob su directory root (>${maxFiles} file potenziali) — richiede anti_glob_confirmed`,
          });
        }
      }
    }
    const matched = allFiles.filter((f) => s.globs.some((g) => globMatch(g, f))).length;
    if (matched > maxFiles) {
      issues.push({
        surface_id: s.id,
        glob: s.globs.join(', '),
        reason: `entry copre ${matched} file (> K=${maxFiles}) — richiede anti_glob_confirmed per-entry`,
        matched,
      });
    }
  }
  return issues;
}

export interface MapDiff {
  added: SurfaceEntry[];
  changed: SurfaceEntry[];
  removedIds: string[];
}

/** Diff funzionale tra baseline (HEAD) e mappa corrente. */
export function diffSurfaceMaps(
  baseline: SurfaceMap | null,
  current: SurfaceMap,
): MapDiff {
  const baseById = new Map((baseline?.surfaces ?? []).map((s) => [s.id, s]));
  const curById = new Map(current.surfaces.map((s) => [s.id, s]));
  const added: SurfaceEntry[] = [];
  const changed: SurfaceEntry[] = [];
  for (const s of current.surfaces) {
    const prev = baseById.get(s.id);
    if (!prev) added.push(s);
    else if (functionalKey(prev) !== functionalKey(s)) changed.push(s);
  }
  const removedIds = [...baseById.keys()].filter((id) => !curById.has(id));
  return { added, changed, removedIds };
}

export interface MappingProposal {
  created_at: string;
  created_by: string;
  entries: SurfaceEntry[];
  removed_ids: string[];
}

/** Le chiavi funzionali degli entry approvati da un batch proposal. */
export function approvedKeys(proposal: MappingProposal): {
  entries: Set<string>;
  removed: Set<string>;
} {
  return {
    entries: new Set(proposal.entries.map(functionalKey)),
    removed: new Set(proposal.removed_ids),
  };
}
