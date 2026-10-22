/**
 * verification — receipts, final gate, blob archive (PLAN-077 T-004).
 *
 *  - Closed vocabularies: check kinds/results, receipt classifications,
 *    infra reasons, gate failures. A receipt payload outside the vocab is
 *    rejected by the dispatcher BEFORE it enters the journal.
 *  - `classifyChecks`: a failing check scoped `infra` (env, quota,
 *    harness) is never a defect; `unreliable`/`not_run` make the whole
 *    verification untrustworthy → infra, `verification_unreliable`.
 *  - `finalGateCheck` (anti-TOCTOU, artifact-r012): before CLOSED the
 *    surface manifest is recomputed on disk and compared with BOTH the
 *    attempt's recorded hash and the active confirmation's bound
 *    revision; the contract hash is recomputed too, and the blob
 *    archive for the manifest must exist and verify.
 *  - `archiveSurface` / `verifyArchive`: content-addressed store under
 *    `.mw/ledger/blobs/<manifest_hash>/` — every present entry's blob is
 *    named by its sha256; `absent:true` entries live in manifest.json
 *    only. CLOSED certifies the archived revision, not the worktree.
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync, copyFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { canonicalize, type JournalRecord } from './ledgerCore';
import { computeManifest, manifestHash, type ManifestEntry } from './surfaceManifest';
import type { BlockedReason, NextAction, WorkItem } from './workItem';

/* ---------------- closed vocabularies ---------------- */

export const CHECK_KINDS = [
  'targeted_regression',
  'integration',
  'build',
  'lint',
  'artifact_link',
  'visual',
  'environment',
] as const;
export type CheckKind = (typeof CHECK_KINDS)[number];

export const CHECK_RESULTS = ['pass', 'fail', 'not_run', 'unreliable'] as const;
export type CheckResult = (typeof CHECK_RESULTS)[number];

export interface VerificationCheck {
  id: string;
  kind: CheckKind;
  result: CheckResult;
  /** `infra` = environment/quota/harness — never counts as the defect. */
  scope?: 'target' | 'infra';
  detail?: string;
}

export const RECEIPT_CLASSIFICATIONS = ['pass', 'defect_persisted', 'infra'] as const;
export type ReceiptClassification = (typeof RECEIPT_CLASSIFICATIONS)[number];

export const INFRA_REASONS: readonly BlockedReason[] = [
  'env_invalid',
  'verification_incomplete',
  'unrelated_infra_regression',
  'quota_exhausted',
  'verification_unreliable',
];

export interface ReceiptVerdict {
  classification: ReceiptClassification;
  blocked_reason?: BlockedReason;
  next_action?: NextAction;
}

/**
 * Fold a check list into the receipt classification (closed rules):
 *  1. any `not_run`/`unreliable` → the verification itself is not
 *     trustworthy → infra / verification_unreliable (a check never run
 *     can never read as passed);
 *  2. an infra-scoped or environment-kind failure → infra / env_invalid;
 *  3. any target-scoped failure → defect_persisted (drives retry);
 *  4. otherwise pass.
 */
export function classifyChecks(checks: VerificationCheck[]): ReceiptVerdict {
  if (checks.some((c) => c.result === 'not_run' || c.result === 'unreliable')) {
    return { classification: 'infra', blocked_reason: 'verification_unreliable', next_action: 'retry_after_env_fix' };
  }
  if (checks.some((c) => c.result === 'fail' && (c.scope === 'infra' || c.kind === 'environment'))) {
    return { classification: 'infra', blocked_reason: 'env_invalid', next_action: 'retry_after_env_fix' };
  }
  if (checks.some((c) => c.result === 'fail')) {
    return { classification: 'defect_persisted' };
  }
  return { classification: 'pass' };
}

/** Payload-vocab guard for the dispatcher (verification_receipt events). */
export function validateReceiptPayload(p: Record<string, unknown>): string | null {
  const cls = p.classification as string | undefined;
  if (!cls || !(RECEIPT_CLASSIFICATIONS as readonly string[]).includes(cls)) {
    return `verification_receipt: classification '${cls}' not in ${RECEIPT_CLASSIFICATIONS.join('/')}`;
  }
  if (cls === 'infra') {
    const reason = p.reason as string | undefined;
    if (reason && !(INFRA_REASONS as readonly string[]).includes(reason)) {
      return `verification_receipt: infra reason '${reason}' not in ${INFRA_REASONS.join('/')}`;
    }
  }
  const checks = (p.checks ?? []) as VerificationCheck[];
  for (const c of checks) {
    if (!(CHECK_KINDS as readonly string[]).includes(c.kind)) return `verification_receipt: check kind '${c.kind}' unknown`;
    if (!(CHECK_RESULTS as readonly string[]).includes(c.result)) return `verification_receipt: check result '${c.result}' unknown`;
  }
  return null;
}

/* ---------------- final gate (anti-TOCTOU) ---------------- */

export type GateFailure =
  | 'not_director_confirmed'
  | 'no_active_confirmation'
  | 'surface_drifted' // recomputed manifest ≠ confirmed revision
  | 'contract_drifted' // contract hash changed since the confirmation
  | 'manifest_invalid' // recompute returned a non-ok verdict
  | 'archive_missing' // no blob archive for the confirmed revision
  | 'archive_corrupt'; // archive exists but blobs don't re-hash

export interface GateResult {
  ok: boolean;
  failures: GateFailure[];
  detail?: string;
}

function contractHashOf(c: WorkItem['contract']): string {
  const { contract_hash: _omit, ...rest } = c;
  return createHash('sha256').update(canonicalize(rest)).digest('hex');
}

/**
 * The gate every DIRECTOR_CONFIRMED item must pass before CLOSED.
 * Recomputes the surface manifest on disk NOW and requires it to equal
 * the revision the Director confirmed — a drifted surface can never be
 * closed on a stale confirmation.
 */
export function finalGateCheck(
  item: WorkItem,
  opts: {
    rootDir: string;
    ledgerDir: string;
    journal: { records: JournalRecord[]; history_complete: boolean };
    /** Optional: the contract_hash recorded when the confirmation was taken. */
    confirmed_contract_hash?: string;
  },
): GateResult {
  const failures: GateFailure[] = [];
  let detail: string | undefined;

  if (item.status !== 'DIRECTOR_CONFIRMED') failures.push('not_director_confirmed');
  const conf = item.active_confirmation;
  const waived = !item.contract.requires_director_confirmation;
  if (!conf?.active && !waived) failures.push('no_active_confirmation');

  if (conf?.active || waived) {
    // The revision to certify: the confirmed one, or (confirmation waived)
    // the manifest hash the latest attempt itself produced.
    const attempt = conf
      ? item.attempts.find((a) => a.attempt_id === conf.attempt_id)
      : item.attempts.filter((a) => !a.superseded).at(-1);
    const boundRevision = conf?.active ? conf.revision_hash : attempt?.surface_manifest_hash;
    const res = computeManifest(
      {
        kind: item.kind,
        surface_id: item.contract.surfaces[0] ?? item.item_id,
        expected_files: item.contract.expected_files,
        globs: [], // contract globs aren't modelled on the item yet — expected_files drive the gate
        allow_empty_surface: item.contract.allow_empty_surface,
        empty_surface_reason: item.contract.empty_surface_reason,
      },
      opts.rootDir,
      opts.journal,
    );
    if (res.verdict !== 'ok' || !res.manifest_hash) {
      failures.push('manifest_invalid');
      detail = res.reason;
    } else if (
      res.manifest_hash !== boundRevision ||
      (attempt?.surface_manifest_hash !== undefined && res.manifest_hash !== attempt.surface_manifest_hash)
    ) {
      failures.push('surface_drifted');
    } else {
      const av = verifyArchive(opts.ledgerDir, res.manifest_hash, res.entries);
      if (!av.exists) failures.push('archive_missing');
      else if (!av.ok) failures.push('archive_corrupt');
    }
    if (opts.confirmed_contract_hash && opts.confirmed_contract_hash !== contractHashOf(item.contract)) {
      failures.push('contract_drifted');
    }
  }

  return { ok: failures.length === 0, failures, detail };
}

/* ---------------- content-addressed blob archive ---------------- */

const BLOBS = (ledgerDir: string, hash: string) => path.join(ledgerDir, 'blobs', hash);

/**
 * Freeze the surface revision: copy every present entry's content to
 * `blobs/<manifest_hash>/<sha256>` and write `manifest.json` beside them.
 * Idempotent — re-archiving the same manifest is a no-op write.
 */
export function archiveSurface(
  ledgerDir: string,
  rootDir: string,
  entries: ManifestEntry[],
): { archive_dir: string; manifest_hash: string } {
  const hash = manifestHash(entries);
  const dir = BLOBS(ledgerDir, hash);
  mkdirSync(dir, { recursive: true });
  for (const e of entries) {
    if (e.absent || !e.sha256) continue;
    const src = path.join(rootDir, e.path);
    const dst = path.join(dir, e.sha256);
    if (!existsSync(dst)) copyFileSync(src, dst);
  }
  writeFileSync(path.join(dir, 'manifest.json'), JSON.stringify(entries, null, 2));
  return { archive_dir: dir, manifest_hash: hash };
}

/**
 * Referential integrity: every non-absent manifest entry must have a blob
 * named by its sha256 that re-hashes to the same value.
 */
export function verifyArchive(
  ledgerDir: string,
  manifest_hash: string,
  entries: ManifestEntry[],
): { exists: boolean; ok: boolean; bad?: string[] } {
  const dir = BLOBS(ledgerDir, manifest_hash);
  if (!existsSync(path.join(dir, 'manifest.json'))) return { exists: false, ok: false };
  const bad: string[] = [];
  for (const e of entries) {
    if (e.absent || !e.sha256) continue;
    const blob = path.join(dir, e.sha256);
    if (!existsSync(blob) || createHash('sha256').update(readFileSync(blob)).digest('hex') !== e.sha256) {
      bad.push(e.path);
    }
  }
  return { exists: true, ok: bad.length === 0, bad: bad.length ? bad : undefined };
}
