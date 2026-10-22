/**
 * surfaceManifest — deterministic revision manifest over a declared
 * surface (PLAN-077 T-002, artifact-r012 hardening).
 *
 * A confirmation binds to the EXACT revision the Director inspected; the
 * manifest is what makes "the exact revision" precise:
 *
 *  - entries: `{path, sha256, size}` sorted by path, PLUS `{path,
 *    absent: true}` for every contract-declared file that is missing —
 *    deletion is a first-class fact, never silent.
 *  - a declared glob resolving to ZERO files is `contract_invalid` — most
 *    likely a misconfiguration or a mass deletion; fail closed.
 *  - `allow_empty_surface` is ONLY valid for a `feature` kind with a
 *    non-empty `empty_surface_reason`, zero declared `expected_files`,
 *    and proven virginity: the ledger journal (history_complete required)
 *    must show NO earlier manifest on the same surface that ever had a
 *    present file. Incomplete/degraded history → undecidable →
 *    fail closed and escalate.
 *  - the manifest hash is the revision identity: confirmations, gates and
 *    the CLOSED-watch all compare against it.
 */

import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { canonicalize, type JournalRecord } from './ledgerCore';
import type { ItemKind } from './workItem';

export interface ManifestEntry {
  path: string;
  sha256?: string;
  size?: number;
  absent?: boolean;
}

export type ManifestVerdict = 'ok' | 'contract_invalid' | 'empty_surface_rejected' | 'history_undecidable';

export interface ManifestResult {
  verdict: ManifestVerdict;
  reason?: string;
  entries: ManifestEntry[];
  manifest_hash: string | null;
}

function hashFile(filePath: string): { sha256: string; size: number } {
  const buf = readFileSync(filePath);
  return { sha256: createHash('sha256').update(buf).digest('hex'), size: statSync(filePath).size };
}

export function manifestHash(entries: ManifestEntry[]): string {
  const sorted = [...entries].sort((a, b) => a.path.localeCompare(b.path));
  return createHash('sha256').update(canonicalize(sorted)).digest('hex');
}

/** Minimal glob: `**` (any depth), `*` (one segment), `?`. */
export function expandGlob(glob: string, rootDir: string): string[] {
  const DEEP = '\u0001';
  const re = new RegExp(
    `^${glob
      .replace(/[.+^${}()|[\]\\]/g, '\\$&')
      .replace(/\*\*/g, DEEP)
      .replace(/\*/g, '[^/]*')
      .replace(/\?/g, '[^/]')
      .replace(new RegExp(DEEP, 'g'), '.*')}$`,
  );
  const out: string[] = [];
  const walk = (dir: string): void => {
    for (const ent of readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, ent.name);
      const rel = path.relative(rootDir, full).split(path.sep).join('/');
      if (ent.isDirectory() && ent.name !== 'node_modules' && ent.name !== '.git') walk(full);
      else if (ent.isFile() && re.test(rel)) out.push(rel);
    }
  };
  walk(rootDir);
  return out.sort();
}

/**
 * Virginity check against journal history: the same `surface_id` must
 * never have had a manifest with a present file. Requires a complete,
 * verified journal — otherwise undecidable.
 */
export function surfaceIsVirgin(
  records: JournalRecord[],
  historyComplete: boolean,
  surfaceId: string,
): 'virgin' | 'not_virgin' | 'undecidable' {
  if (!historyComplete) return 'undecidable';
  for (const rec of records) {
    if (rec.type !== 'surface_manifest' && rec.type !== 'attempt_finished') continue;
    const p = rec.payload as { surface_id?: string; entries?: ManifestEntry[]; had_present?: boolean };
    if (p.surface_id !== surfaceId) continue;
    const hadPresent = p.had_present ?? (p.entries ?? []).some((e) => !e.absent);
    if (hadPresent) return 'not_virgin';
  }
  return 'virgin';
}

export interface ManifestContract {
  kind: ItemKind;
  surface_id: string;
  expected_files: string[]; // concrete paths (may be absent → absent:true)
  globs: string[];
  allow_empty_surface?: boolean;
  empty_surface_reason?: string;
}

/** Compute the manifest for a declared surface. Pure + fail closed. */
export function computeManifest(
  contract: ManifestContract,
  rootDir: string,
  journal: { records: JournalRecord[]; history_complete: boolean },
): ManifestResult {
  const entries: ManifestEntry[] = [];

  for (const rel of contract.expected_files) {
    const abs = path.join(rootDir, rel);
    if (existsSync(abs)) {
      entries.push({ path: rel, ...hashFile(abs) });
    } else {
      entries.push({ path: rel, absent: true });
    }
  }

  let globbedCount = 0;
  for (const glob of contract.globs) {
    const hits = expandGlob(glob, rootDir);
    globbedCount += hits.length;
    for (const rel of hits) {
      if (entries.some((e) => e.path === rel)) continue;
      entries.push({ path: rel, ...hashFile(path.join(rootDir, rel)) });
    }
  }

  const declaredNonEmpty = contract.expected_files.length > 0 || contract.globs.length > 0;
  const present = entries.filter((e) => !e.absent);
  const allAbsent = declaredNonEmpty && present.length === 0;

  // A glob resolving to zero hits while the surface expects coverage, or
  // a declared set that is all-absent: fail closed — probably a
  // misconfigured contract or a mass deletion.
  if (contract.globs.length > 0 && globbedCount === 0 && !contract.allow_empty_surface) {
    return { verdict: 'contract_invalid', reason: `globs resolved to zero files on ${contract.surface_id}`, entries, manifest_hash: null };
  }
  if (allAbsent && !contract.allow_empty_surface) {
    return { verdict: 'contract_invalid', reason: `all declared files absent on ${contract.surface_id}`, entries, manifest_hash: null };
  }

  if (present.length === 0 && contract.allow_empty_surface) {
    if (contract.kind !== 'feature') {
      return { verdict: 'empty_surface_rejected', reason: 'empty surface allowed only for feature items', entries, manifest_hash: null };
    }
    if (!contract.empty_surface_reason || contract.expected_files.length > 0) {
      return { verdict: 'empty_surface_rejected', reason: 'allow_empty_surface requires a non-empty reason and zero declared expected files', entries, manifest_hash: null };
    }
    const v = surfaceIsVirgin(journal.records, journal.history_complete, contract.surface_id);
    if (v === 'undecidable') {
      return { verdict: 'history_undecidable', reason: 'journal history incomplete — virginity undecidable, escalate', entries, manifest_hash: null };
    }
    if (v === 'not_virgin') {
      return { verdict: 'empty_surface_rejected', reason: `surface ${contract.surface_id} previously held files — not a virgin feature surface`, entries, manifest_hash: null };
    }
  }

  return { verdict: 'ok', entries, manifest_hash: manifestHash(entries) };
}
