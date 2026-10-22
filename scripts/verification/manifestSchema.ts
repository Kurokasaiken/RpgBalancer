/**
 * manifestSchema — PLAN-051 T-005: contratto Zod del manifest
 * `verification.json` consumato da produceBundle / `npm run bundle`.
 *
 * Lo schema modella il formato reale dei manifest in `.mw/runs/`:
 * i campi del type `Manifest` in gateCore.ts sono validati, i campi
 * extra (context, created_by, ecc.) passano invariati (passthrough —
 * il contratto vieta il male, non il superfluo).
 *
 * `judgment` come tipo obbligazione NON è stato aggiunto: il tipo
 * `human-eye` + witness binding (reviewer/note/commit_sha) copre già
 * il caso — valutato e scartato in PLAN-051 §7.
 *
 * Retrocompatibilità: lo schema vale per i manifest scritti da T-005 in
 * poi. Manifest storici con vocabolario pre-contratto (`headed-browser`,
 * kind `screenshot`, `task`/`created_at` assenti — es. plan-038/040,
 * r190, bezel-variants-lab) NON validano: restano storia leggibile, e una
 * loro ri-verifica richiede la migrazione al vocabolario corrente.
 */
import { z } from 'zod';
import type { Manifest } from './gateCore';

export const obligationTypeSchema = z.enum([
  'state',
  'dom-temporal',
  'pixel-temporal',
  'fps',
  'human-eye',
]);

export const environmentReqSchema = z.enum([
  'headless-ok',
  'headed-required',
  'human-required',
]);

export const artifactKindSchema = z.enum([
  'junit',
  'json',
  'frames',
  'metrics',
  'env',
  'video',
  'signoff',
  'log',
]);

export const manifestArtifactSchema = z
  .object({
    path: z.string().min(1),
    kind: artifactKindSchema.optional(),
  })
  .passthrough();

export const obligationSchema = z
  .object({
    id: z.string().regex(/^[A-Za-z0-9][A-Za-z0-9_.-]*$/),
    requirement: z.string().min(1),
    source: z.string().min(1),
    request_hash: z.string().optional(),
    type: obligationTypeSchema,
    environment: environmentReqSchema,
    command: z.string().optional(),
    timeout_s: z.number().positive().optional(),
    min_tests: z.number().nonnegative().optional(),
    min_frames: z.number().nonnegative().optional(),
    min_samples: z.number().nonnegative().optional(),
    max_errors: z.number().nonnegative().optional(),
    artifacts: z.array(manifestArtifactSchema),
    blocking: z.boolean(),
    waived: z
      .object({ by: z.literal('director'), reason: z.string().min(1) })
      .passthrough()
      .optional(),
    tier: z.enum(['deterministic', 'perceptual', 'always']).optional(),
  })
  .passthrough();

export const manifestSchema = z
  .object({
    task: z.string().min(1),
    run_id: z.string().optional(),
    created_at: z.string().min(1),
    verifier_required: z.boolean().optional(),
    red_first: z.array(z.string()).optional(),
    intent_gate: z.boolean().optional(),
    decision_report: z.boolean().optional(),
    obligations: z.array(obligationSchema).min(1),
  })
  .passthrough();

/**
 * Valida un manifest grezzo (JSON.parse). Ritorna il Manifest tipizzato o
 * la lista degli issue zod formattati — il chiamante decide il fallimento
 * (produceBundle: exit 2, fail-closed, mai ignorare un manifest malformato).
 */
export function parseManifest(raw: unknown):
  | { ok: true; manifest: Manifest }
  | { ok: false; issues: string[] } {
  const res = manifestSchema.safeParse(raw);
  if (res.success) return { ok: true, manifest: res.data as Manifest };
  return {
    ok: false,
    issues: res.error.issues.map((i) => `${i.path.join('.') || '(root)'}: ${i.message}`),
  };
}
