/**
 * Certification manifest schema (`<kitId>.cert.json`).
 *
 * A cert manifest is the signed promise that a kit's behavior was verified at
 * a given point in time against a specific snapshot of the canonical reference
 * page. Once written, it is immutable until a new certification round bumps
 * `version` and produces a new file.
 *
 * The schema is validated at:
 *  - Write time, by `scripts/freeze-kit.ts` and the cert pipeline.
 *  - Read time, by CI gates that ensure the manifest is well-formed.
 *
 * Part of the Component Freezing & Certification system (see
 * src/docs/docs/plans/component_freezing_certification_plan_v2.md).
 */

import { z } from 'zod';

// ---------------------------------------------------------------------------
// Schema definition
// ---------------------------------------------------------------------------

export const SemVerSchema = z
  .string()
  .regex(/^\d+\.\d+\.\d+$/, 'Version must follow MAJOR.MINOR.PATCH');

export const GitShaSchema = z
  .string()
  .regex(/^[a-f0-9]{7,40}$/i, 'Git SHA must be 7-40 hex chars');

export const EvidenceEntrySchema = z.object({
  /** Human-readable label, e.g. "playwright contract test". */
  label: z.string().min(1),
  /** Path (relative to repo root) of the evidence artifact. */
  path: z.string().min(1),
  /** Optional URL (CI link) for remote evidence. */
  url: z.string().url().optional(),
});

export const CertManifestSchema = z.object({
  /** Kit identifier (matches `ContractConfig.kitId`). */
  kitId: z.string().min(1),
  /** Semantic version of THIS certification round. */
  version: SemVerSchema,
  /** Git commit SHA that the certification was produced against. */
  gitSha: GitShaSchema,
  /**
   * SHA-256 (or git blob hash) of the fixture file, ensuring that changing
   * the canonical fixture forces a re-certification.
   */
  fixtureSha: z.string().min(7),
  /**
   * SHA-256 of the contract subtree HTML (post-normalization), serving as
   * the cryptographic anchor of the certified behavior.
   */
  contractSha: z.string().min(7),
  /** ISO-8601 timestamp at which certification was issued. */
  certifiedAt: z.string().datetime({ offset: true }),
  /**
   * Free-form identifier for who/what produced the manifest (CI job name,
   * human reviewer, etc.).
   */
  certifiedBy: z.string().min(1),
  /** Evidence artifacts (test logs, snapshots, baselines). */
  evidence: z.array(EvidenceEntrySchema).min(1),
  /** Whether the kit is currently certified. Set to false to mark suspension. */
  certified: z.boolean(),
  /** Optional notes (free text). */
  notes: z.string().optional(),
});

export type CertManifest = z.infer<typeof CertManifestSchema>;
export type EvidenceEntry = z.infer<typeof EvidenceEntrySchema>;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Validates a parsed JSON object against the cert manifest schema. Throws a
 * `ZodError` on failure, which provides structured per-field error messages
 * suitable for CI output.
 */
export function parseCertManifest(input: unknown): CertManifest {
  return CertManifestSchema.parse(input);
}

/**
 * Safe variant — returns a discriminated union instead of throwing. Useful in
 * code paths that want to surface validation errors as test failures rather
 * than uncaught exceptions.
 */
export function safeParseCertManifest(input: unknown):
  | { ok: true; manifest: CertManifest }
  | { ok: false; error: z.ZodError } {
  const result = CertManifestSchema.safeParse(input);
  return result.success
    ? { ok: true, manifest: result.data }
    : { ok: false, error: result.error };
}

/**
 * Convenience factory used by the cert pipeline to produce a manifest ready to
 * be serialized as JSON.
 */
export function buildCertManifest(input: {
  kitId: string;
  version: string;
  gitSha: string;
  fixtureSha: string;
  contractSha: string;
  certifiedBy: string;
  evidence: EvidenceEntry[];
  notes?: string;
}): CertManifest {
  const manifest: CertManifest = {
    kitId: input.kitId,
    version: input.version,
    gitSha: input.gitSha,
    fixtureSha: input.fixtureSha,
    contractSha: input.contractSha,
    certifiedAt: new Date().toISOString(),
    certifiedBy: input.certifiedBy,
    evidence: input.evidence,
    certified: true,
    notes: input.notes,
  };
  // Validate via Zod so callers can't accidentally produce malformed output.
  return CertManifestSchema.parse(manifest);
}
