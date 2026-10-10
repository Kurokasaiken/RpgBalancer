/**
 * validateCopy — deterministic validation of provider output
 * (PLAN-026 T4 / P4). The LLM proposes; this validator disposes —
 * schema shape, length caps, banned imagery, digits (the UI owns
 * numbers), and the mustConvey keyword contract. A single violation
 * fails the node: repair = regenerate the whole scenario from seed
 * (contracts §14), never patch text in place.
 */

import { z } from 'zod';
import type { SceneBrief } from './sceneBrief';
import type { DomainVocab } from '../domainVocabs';

/* ------------------------------------------------------------------ */
/* Output schema — mirrors FloodNodeCopy/RaceNodeCopy.                 */
/* ------------------------------------------------------------------ */

export const NarratedOptionSchema = z
  .object({ label: z.string().min(1).max(40), detail: z.string().min(1).max(160) })
  .strict();

const flavor = z.string().min(1).max(160);

export const NarratedNodeCopySchema = z
  .object({
    title: z.string().min(1).max(60),
    body: z.string().min(1).max(800),
    transit: z.string().max(200).optional(),
    failHint: z.string().max(120).optional(),
    option: NarratedOptionSchema.optional(),
    verdictFlavor: z
      .object({ epicfail: flavor, fail: flavor, almost: flavor, win: flavor, bigwin: flavor })
      .partial()
      .strict()
      .optional(),
    outcomeLog: z
      .object({ win: flavor, bigwin: flavor })
      .partial()
      .strict()
      .optional(),
  })
  .strict();
export type NarratedNodeCopy = z.infer<typeof NarratedNodeCopySchema>;

export const NarratedKitMetaSchema = z
  .object({
    title: z.string().min(1).max(40),
    flavour: z.string().min(1).max(140),
    objective: z.string().min(1).max(240),
    intelId: z
      .string()
      .min(1)
      .max(24)
      .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'intelId deve essere kebab-case'),
    loot: z.record(z.string(), z.string().min(1).max(30)).optional(),
    names: z.record(z.string(), z.string().min(1).max(40)).optional(),
  })
  .strict();
export type NarratedKitMeta = z.infer<typeof NarratedKitMetaSchema>;

/* ------------------------------------------------------------------ */
/* Deterministic checks.                                              */
/* ------------------------------------------------------------------ */

export interface ValidationIssue {
  nodeKey: string;
  rule: 'schema' | 'forbidden' | 'digits' | 'length' | 'required' | 'internal-id';
  detail: string;
}

/** All text fields of a copy, flattened for scanning. */
function allText(copy: NarratedNodeCopy): string[] {
  const out = [copy.title, copy.body];
  if (copy.transit) out.push(copy.transit);
  if (copy.failHint) out.push(copy.failHint);
  if (copy.option) out.push(copy.option.label, copy.option.detail);
  for (const v of Object.values(copy.verdictFlavor ?? {})) if (v) out.push(v);
  for (const v of Object.values(copy.outcomeLog ?? {})) if (v) out.push(v);
  return out;
}

/** Word-stem scan: the banned term as a whole word (start, space or
 *  punctuation boundaries — 'mare' does not hit 'maestra'). */
function containsForbidden(text: string, banned: string[]): string | null {
  const t = text.toLowerCase();
  for (const b of banned) {
    const re = new RegExp(`(^|[^\\p{L}\\p{N}])${b.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'iu');
    if (re.test(t)) return b;
  }
  return null;
}

/** Validate one node's provider output against the brief + vocab. */
export function validateNodeCopy(
  raw: unknown,
  brief: SceneBrief,
  vocab: DomainVocab,
): { ok: true; copy: NarratedNodeCopy } | { ok: false; issues: ValidationIssue[] } {
  const issues: ValidationIssue[] = [];
  const parsed = NarratedNodeCopySchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      issues: parsed.error.issues.map((i) => ({
        nodeKey: brief.nodeKey,
        rule: 'schema' as const,
        detail: `${i.path.join('.')}: ${i.message}`,
      })),
    };
  }
  const copy = parsed.data;
  const texts = allText(copy);

  /* Internal identifiers must never surface in prose — 'fv-gabbia',
   * 'CHECK:', option ids. The prefix comes from the node's own id. */
  const nodePrefix = brief.nodeId.split('-')[0];
  const idRe = new RegExp(`\\bCHECK:|\\b${nodePrefix}-[a-z]`, 'i');
  for (const text of texts) {
    const banned = containsForbidden(text, brief.forbidden);
    if (banned) {
      issues.push({ nodeKey: brief.nodeKey, rule: 'forbidden', detail: `termine vietato '${banned}' in: "${text.slice(0, 80)}…"` });
    }
    if (/\d/.test(text)) {
      issues.push({ nodeKey: brief.nodeKey, rule: 'digits', detail: `cifra nel testo (i numeri li mostra l'UI): "${text.slice(0, 80)}…"` });
    }
    if (idRe.test(text)) {
      issues.push({ nodeKey: brief.nodeKey, rule: 'internal-id', detail: `id interno nella prosa: "${text.slice(0, 80)}…"` });
    }
  }

  /* Required fields per outputShape — a scene missing its declared
   *  fields is structurally incomplete, not just weak. */
  for (const key of brief.outputShape) {
    if (key === 'failHint' && !copy.failHint) {
      issues.push({ nodeKey: brief.nodeKey, rule: 'required', detail: 'failHint mancante (check node)' });
    }
    if (key === 'option{label,detail}' && !copy.option) {
      issues.push({ nodeKey: brief.nodeKey, rule: 'required', detail: 'option mancante' });
    }
    if (key === 'transit' && !copy.transit) {
      issues.push({ nodeKey: brief.nodeKey, rule: 'required', detail: 'transit mancante (hub node)' });
    }
  }

  return issues.length ? { ok: false, issues } : { ok: true, copy };
}

/** Extract the JSON object from a provider reply — tolerates a leading
 *  sentence or a fenced block, then strict-parses. */
export function extractJson(reply: string): unknown {
  const fenced = reply.match(/```(?:json)?\s*([\s\S]*?)```/);
  const candidate = fenced ? fenced[1] : reply;
  const start = candidate.indexOf('{');
  const end = candidate.lastIndexOf('}');
  if (start === -1 || end === -1 || end <= start) throw new Error('nessun oggetto JSON nella risposta');
  return JSON.parse(candidate.slice(start, end + 1));
}
