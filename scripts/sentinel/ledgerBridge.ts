/**
 * ledgerBridge — concurrency-safe PLAN-077 ingest for confirmed Sentinel
 * findings (PLAN-078 T-004).
 *
 * Pipeline per confirmed finding:
 *   fingerprint = sha256(oracle_id | component_id | state_node |
 *                 perturbation_kind | normalizeSelector(target))
 *   → resolve ownership (componentResolver)
 *   → dedup scan of the journal (fingerprint match)
 *     · fingerprint absent            → `item_ingested` (defect)
 *     · fingerprint present, OPEN     → `evidence_attached` (aggregate)
 *     · fingerprint present, CLOSED   → `evidence_attached` carrying
 *       prior + current `surface_manifest_hash`; the reducer reopens
 *       iff the manifest drifted (guarded CLOSED→OPEN)
 *   → reproducer `.spec.ts` attached via payload evidence
 *
 * Safety rails:
 *  - `.mw/ledger/.ingest.lock` (stale-age checked) around every mutation;
 *  - per-run cap (`ingest.maxPerRun`);
 *  - `dryRun` writes the intended payloads to `<outDir>/ingest-dryrun.json`
 *    and never touches the journal;
 *  - unresolved ownership → observation in the digest, never an item;
 *  - software-renderer findings are advisory — never ingested.
 */
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { appendRecord, validateJournal, canonicalize } from '../ledger/ledgerCore';
import { deriveState } from '../ledger/workItem';
import type { GatedFinding } from './oracles/index';
import { normalizeSelector } from './selectorNormalizer';
import { resolveComponent, type ResolvedOwnership } from './componentResolver';
import { writeReproducer } from './reproducerGenerator';
import type { SentinelConfig } from './sentinelConfig';
import type { RendererClass } from './rendererBackend';

/* ------------------------------ lock ------------------------------ */

interface LockInfo { pid: number; runId: string; at: string }

/** Acquires `.ingest.lock`; returns the release fn. Throws when a live lock is held. */
export function acquireIngestLock(lockPath: string, runId: string, staleMs: number): () => void {
  if (fs.existsSync(lockPath)) {
    try {
      const info = JSON.parse(fs.readFileSync(lockPath, 'utf8')) as LockInfo;
      const age = Date.now() - new Date(info.at).getTime();
      if (age < staleMs) throw new Error(`ingest lock held by run ${info.runId} (age ${Math.round(age / 1000)}s)`);
      fs.rmSync(lockPath); // stale lock — take over
    } catch (e) {
      if (e instanceof Error && e.message.includes('ingest lock held')) throw e;
      fs.rmSync(lockPath, { force: true }); // corrupt lock — take over
    }
  }
  fs.mkdirSync(path.dirname(lockPath), { recursive: true });
  fs.writeFileSync(lockPath, JSON.stringify({ pid: process.pid, runId, at: new Date().toISOString() } satisfies LockInfo));
  return () => fs.rmSync(lockPath, { force: true });
}

/* --------------------------- fingerprint --------------------------- */

/** Canonical finding fingerprint — viewport/locale/dpr live in affected_matrix, never here. */
export function fingerprintOf(f: GatedFinding, owner: ResolvedOwnership): string {
  return createHash('sha256')
    .update(
      canonicalize([
        f.oracle_id,
        owner.component_id,
        f.state_node,
        f.perturbation_kind,
        normalizeSelector(f.target ?? ''),
      ]),
    )
    .digest('hex');
}

/* ------------------------------ bridge ----------------------------- */

export interface BridgeOutcome {
  ingested: string[];      // item_ids newly created
  evidenced: string[];     // item_ids that received evidence_attached
  reopened: string[];      // item_ids the reducer reopened (manifest drift)
  observations: string[];  // digested, not ingested
  skipped: string[];       // cap reached / unresolved ownership / advisory
  dryRun: boolean;
}

/** Scans journal records for an existing item carrying `fingerprint`. */
function findByFingerprint(records: { type: string; payload: unknown }[], fp: string) {
  for (const rec of records) {
    if (rec.type !== 'item_ingested') continue;
    const p = rec.payload as { fingerprint?: string; item_id?: string; surface_manifest_hash?: string };
    if (p.fingerprint === fp) return p;
  }
  return null;
}

/**
 * Bridges confirmed findings into the ledger. `gated` must already carry
 * the repeat-gate verdict; only `gate === 'confirmed'` is ingest-eligible.
 * `divergent-observation` findings are aggregated into a single observation
 * candidate per family (r004) — never an item.
 */
export async function bridgeFindings(
  gated: GatedFinding[],
  cfg: SentinelConfig,
  opts: {
    runId: string;
    outDir: string;
    dryRun?: boolean;
    rendererClass?: RendererClass;
    /** Repo root for contract/surface resolution — injectable for tests. */
    rootDir?: string;
    affectedMatrix?: Record<string, string[]>; // signature → ["1280x720/it-IT", …]
  },
): Promise<BridgeOutcome> {
  const dryRun = opts.dryRun ?? cfg.ingest.dryRun;
  const out: BridgeOutcome = { ingested: [], evidenced: [], reopened: [], observations: [], skipped: [], dryRun };

  const eligible = gated.filter((f) => f.gate === 'confirmed' && f.severity === 'defect');
  const divergent = gated.filter((f) => f.gate === 'divergent-observation');

  // divergent candidates → SENTINEL-<hash> observation (digest only)
  const famSeen = new Set<string>();
  for (const f of divergent) {
    const fam = f.signature_family ?? f.signature;
    if (famSeen.has(fam)) continue;
    famSeen.add(fam);
    out.observations.push(`SENTINEL-${createHash('sha256').update(fam).digest('hex').slice(0, 12)}`);
  }

  if (eligible.length === 0) return out;

  const journal = validateJournal(cfg.ingest.ledgerDir);
  const state = journal.ok ? deriveState(journal.records) : null;
  const dryPayloads: unknown[] = [];
  let release: (() => void) | null = null;
  if (!dryRun) release = acquireIngestLock(cfg.ingest.ingestLockFile, opts.runId, cfg.ingest.ingestLockStaleMs);

  try {
    let budget = cfg.ingest.maxPerRun;
    for (const f of eligible) {
      if (budget <= 0) {
        out.skipped.push(`${f.signature} (per-run cap ${cfg.ingest.maxPerRun})`);
        continue;
      }
      if (opts.rendererClass === 'software') {
        out.skipped.push(`${f.signature} (software-renderer advisory)`);
        continue;
      }

      const owner = resolveComponent(f.target, {
        contractsDir: cfg.ingest.contractsDir,
        surfaceMapPath: cfg.ingest.surfaceMapPath,
        rootDir: opts.rootDir ?? '.',
      });
      // A defect needs both a component owner AND a declared surface —
      // `surfaces: []` would produce an unanchored item (r004 owner integrity).
      if (owner.confidence === 'unresolved' || !owner.surface_id) {
        out.observations.push(`unresolved:${f.signature.slice(0, 12)}`);
        continue;
      }

      const fp = fingerprintOf(f, owner);
      const itemId = `SENTINEL-${fp.slice(0, 12)}`;
      const existing = findByFingerprint(journal.records, fp);
      const priorItem = existing && state ? state.items.get(existing.item_id ?? '') : null;
      const reproducer = writeReproducer(f, owner, opts.runId, opts.outDir);

      if (!existing) {
        budget--;
        const payload = {
          item_id: itemId,
          kind: 'defect',
          title: `[Sentinel] ${f.title}`,
          fingerprint: fp,
          signature_family: f.signature_family,
          surfaces: owner.surface_id ? [owner.surface_id] : [],
          expected_files: owner.scope_files.slice(0, 5),
          requires_director_confirmation: true,
          surface_manifest_hash: owner.surface_manifest_hash,
          source_ref: `${opts.runId}#${f.signature}`,
          evidence: {
            oracle_id: f.oracle_id,
            state_node: f.state_node,
            perturbation_kind: f.perturbation_kind,
            exact_matches: f.exactMatches,
            reproducer: path.relative('.', reproducer),
            affected_matrix: opts.affectedMatrix?.[f.signature] ?? [],
            ...f.evidence,
          },
        };
        if (dryRun) {
          dryPayloads.push({ type: 'item_ingested', payload });
        } else {
          appendRecord('item_ingested', payload, cfg.ingest.ledgerDir);
        }
        out.ingested.push(itemId);
      } else {
        const payload = {
          item_id: existing.item_id,
          fingerprint: fp,
          prior_manifest_hash: existing.surface_manifest_hash ?? null,
          surface_manifest_hash: owner.surface_manifest_hash,
          source_ref: `${opts.runId}#${f.signature}`,
          reproducer: path.relative('.', reproducer),
        };
        if (dryRun) {
          dryPayloads.push({ type: 'evidence_attached', payload });
        } else {
          appendRecord('evidence_attached', payload, cfg.ingest.ledgerDir);
        }
        if (priorItem && (priorItem.status === 'CLOSED' || priorItem.status === 'WITHDRAWN')) {
          out.reopened.push(existing.item_id!);
        } else {
          out.evidenced.push(existing.item_id!);
        }
      }
    }
    if (dryRun && dryPayloads.length) {
      fs.mkdirSync(opts.outDir, { recursive: true });
      fs.writeFileSync(path.join(opts.outDir, 'ingest-dryrun.json'), JSON.stringify(dryPayloads, null, 2));
    }
  } finally {
    release?.();
  }

  return out;
}
