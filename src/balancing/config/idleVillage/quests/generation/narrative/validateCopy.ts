/**
 * validateCopy — deterministic validation of provider output
 * (PLAN-026 T4 / P4, extended PLAN-027 r001).
 *
 * The LLM proposes; this validator disposes — schema shape, length
 * caps, banned imagery per-locale, digits (the UI owns numbers),
 * internal ids, trait/stat leaks, creature terms outside the domain
 * whitelist, kit-level label/title uniqueness, rival-in-flavour and
 * prize-in-objective coherence. Plus a recurrence counter that FLAGS
 * over-used vocab terms for human review — «allowed but lazy» is a
 * flag, never a judgement: the gate only rejects what is mechanically
 * decidable.
 */

import { z } from 'zod';
import { QUEST_TRAITS } from '@/balancing/config/idleVillage/quests/questTraits';
import type { SceneBrief } from './sceneBrief';
import type { DomainVocab } from '../domainVocabs';

/** Locale the copy is written in — the gate checks the draft's own language. */
export type CopyLocale = 'it' | 'en';

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

/** Pass 3 critic output — structured findings, never prose (PLAN-027). */
export const CriticReportSchema = z
  .object({
    accept: z.boolean(),
    findings: z
      .array(
        z
          .object({
            class: z.string().min(1).max(60),
            field: z.string().min(1).max(40),
            detail: z.string().min(1).max(300),
          })
          .strict(),
      )
      .default([]),
  })
  .strict();
export type CriticReport = z.infer<typeof CriticReportSchema>;

/* ------------------------------------------------------------------ */
/* Deterministic checks.                                              */
/* ------------------------------------------------------------------ */

export interface ValidationIssue {
  nodeKey: string;
  rule:
    | 'schema'
    | 'forbidden'
    | 'digits'
    | 'length'
    | 'required'
    | 'internal-id'
    | 'trait-leak'
    | 'stat-leak'
    | 'creature'
    | 'duplicate'
    | 'meta';
  detail: string;
}

/** A review flag — suspicious, not provably wrong. Human judgement
 *  territory (PLAN-027: «allowed but lazy» stays a flag). */
export interface RecurrenceFlag {
  term: string;
  count: number;
  detail: string;
}

/** All text fields of a copy, flattened for scanning. `includeOption`
 *  controls whether option label/detail are included — the authored
 *  convention legitimately names stats there («Forza. Bonus moderato»),
 *  so leak rules exclude the whole option object. */
function allText(copy: NarratedNodeCopy, includeOption = true): string[] {
  const out = [copy.title, copy.body];
  if (copy.transit) out.push(copy.transit);
  if (copy.failHint) out.push(copy.failHint);
  if (includeOption && copy.option) out.push(copy.option.label, copy.option.detail);
  for (const v of Object.values(copy.verdictFlavor ?? {})) if (v) out.push(v);
  for (const v of Object.values(copy.outcomeLog ?? {})) if (v) out.push(v);
  return out;
}

/** Whole-term scan: the banned term between non-word boundaries on
 *  BOTH sides — 'mare' does not hit 'maestra', 'sea' does not hit
 *  'sealed' (a right-boundary miss cost a whole generation run). */
function containsForbidden(text: string, banned: string[]): string | null {
  const t = text.toLowerCase();
  for (const b of banned) {
    const re = new RegExp(
      `(^|[^\\p{L}\\p{N}])${b.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}([^\\p{L}\\p{N}]|$)`,
      'iu',
    );
    if (re.test(t)) return b;
  }
  return null;
}

/** Word-boundary match for a single term (case-insensitive). */
function hasWord(text: string, term: string): boolean {
  const re = new RegExp(`(^|[^\\p{L}\\p{N}])${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}([^\\p{L}\\p{N}]|$)`, 'iu');
  return re.test(text);
}

/* Stat naming is authored convention INSIDE option.detail («Percezione.
 * Il suolo racconta…») and a leak everywhere else. IT names are
 * distinctive enough to ban case-insensitively; EN names are common
 * nouns, so only the capitalized mid-text form counts. */
const STAT_NAMES_IT = ['forza', 'destrezza', 'agilità', 'agilita', 'costituzione', 'percezione', 'intelligenza', 'carisma', 'volontà'];
const STAT_NAMES_EN = ['Strength', 'Dexterity', 'Agility', 'Constitution', 'Perception', 'Intelligence', 'Charisma', 'Willpower'];

/** Lexemes that signal «a creature is being named» — if one appears, an
 *  allowed creature term must appear with it, else the creature is
 *  off-whitelist (deterministically decidable). */
const CREATURE_LEXEMES: Record<CopyLocale, string[]> = {
  it: ['bestia', 'bestiola', 'creatura', 'mostro', 'belva', 'demone', 'scavatore', 'annegato', 'fuoco fatuo', 'strega', 'cane'],
  en: ['beast', 'creature', 'monster', 'demon', 'digger', 'drowned', 'wisp', 'witch', 'dog'],
};

/** Allowed creature terms for a locale — IT list is canonical, EN is
 *  its declared rendering. */
function allowedCreatures(vocab: DomainVocab, locale: CopyLocale): string[] {
  return locale === 'en' ? (vocab.creatureAmmissibiliEn ?? []) : vocab.creatureAmmissibili;
}

/** Banned imagery for a locale. */
export function forbiddenTerms(vocab: DomainVocab, locale: CopyLocale): string[] {
  return locale === 'en' ? (vocab.vietatiEn ?? vocab.vietati) : vocab.vietati;
}

/** Validate one node's provider output against the brief + vocab. */
export function validateNodeCopy(
  raw: unknown,
  brief: SceneBrief,
  vocab: DomainVocab,
  locale: CopyLocale = 'it',
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
  const banned = forbiddenTerms(vocab, locale);
  const creatures = allowedCreatures(vocab, locale);

  /* Internal identifiers must never surface in prose — 'fv-gabbia',
   * 'CHECK:', option ids. The prefix comes from the node's own id. */
  const nodePrefix = brief.nodeId.split('-')[0];
  const idRe = new RegExp(`\\bCHECK:|\\b${nodePrefix}-[a-z]`, 'i');
  for (const text of texts) {
    const hit = containsForbidden(text, banned);
    if (hit) {
      issues.push({ nodeKey: brief.nodeKey, rule: 'forbidden', detail: `termine vietato '${hit}' in: "${text.slice(0, 80)}…"` });
    }
    if (/\d/.test(text)) {
      issues.push({ nodeKey: brief.nodeKey, rule: 'digits', detail: `cifra nel testo (i numeri li mostra l'UI): "${text.slice(0, 80)}…"` });
    }
    if (idRe.test(text)) {
      issues.push({ nodeKey: brief.nodeKey, rule: 'internal-id', detail: `id interno nella prosa: "${text.slice(0, 80)}…"` });
    }

    /* Trait ids are mechanical gate names — they must never become
     * narrative adjectives («se sei avido» told the player the gating). */
    for (const traitId of Object.keys(QUEST_TRAITS)) {
      if (hasWord(text, traitId)) {
        issues.push({ nodeKey: brief.nodeKey, rule: 'trait-leak', detail: `trait id '${traitId}' usato come aggettivo narrativo: "${text.slice(0, 80)}…"` });
      }
    }
  }

  /* Stat names outside option.detail — inside it the convention is
   * legitimate («Percezione. Il suolo racconta…»). */
  const proseTexts = allText(copy, false);
  for (const text of proseTexts) {
    if (locale === 'it') {
      const hit = containsForbidden(text, STAT_NAMES_IT);
      if (hit) issues.push({ nodeKey: brief.nodeKey, rule: 'stat-leak', detail: `stat nominata '${hit}' in prosa: "${text.slice(0, 80)}…"` });
    } else {
      for (const name of STAT_NAMES_EN) {
        if (hasWord(text, name)) {
          issues.push({ nodeKey: brief.nodeKey, rule: 'stat-leak', detail: `stat named '${name}' in prose: "${text.slice(0, 80)}…"` });
        }
      }
    }
  }

  /* Creature lexemes must come with an allowed creature term — a scene
   * naming 'a beast' with no whitelisted referent is off-vocab. */
  for (const text of texts) {
    const lex = CREATURE_LEXEMES[locale].find((l) => hasWord(text, l));
    if (lex && !creatures.some((c) => text.toLowerCase().includes(c.toLowerCase()))) {
      issues.push({ nodeKey: brief.nodeKey, rule: 'creature', detail: `lessema creatura '${lex}' senza un termine ammesso: "${text.slice(0, 80)}…"` });
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

/* ------------------------------------------------------------------ */
/* Kit-level validation — checks no single node can carry.             */
/* ------------------------------------------------------------------ */

/** Hard kit-level issues + soft recurrence flags for human review. */
export function validateKitCopy(
  meta: NarratedKitMeta,
  copyByNode: Record<string, NarratedNodeCopy>,
  vocab: DomainVocab,
  opts: { gimmick: 'flood' | 'race'; recurrenceThreshold?: number },
): { issues: ValidationIssue[]; flags: RecurrenceFlag[] } {
  const issues: ValidationIssue[] = [];
  const flags: RecurrenceFlag[] = [];
  const allCopies = Object.entries(copyByNode);
  const fullText = allCopies.flatMap(([, c]) => allText(c)).join(' ');

  /* Option labels must be distinguishable across the kit — four routes
   * all called «Scorciatoia pericolosa» give the player no information. */
  const labels = new Map<string, string>();
  for (const [key, c] of allCopies) {
    if (c.option?.label) {
      const norm = c.option.label.toLowerCase().trim();
      if (labels.has(norm)) {
        issues.push({ nodeKey: key, rule: 'duplicate', detail: `label opzione duplicata di '${labels.get(norm)}': «${c.option.label}»` });
      } else labels.set(norm, key);
    }
  }

  /* Titles must differ too — two scenes with the same title read as a
   * generation artefact, not a scene change. */
  const titles = new Map<string, string>();
  for (const [key, c] of allCopies) {
    const norm = c.title.toLowerCase().trim();
    if (titles.has(norm)) {
      issues.push({ nodeKey: key, rule: 'duplicate', detail: `titolo duplicato di '${titles.get(norm)}': «${c.title}»` });
    } else titles.set(norm, key);
  }

  /* Race meta coherence — decidable, therefore a gate: the rival must
   * be named in the offer flavour (a race that doesn't mention its
   * opponent doesn't read as a race) and the prize must appear in the
   * declared objective. */
  if (opts.gimmick === 'race') {
    const rival = meta.names?.rival;
    if (rival && !meta.flavour.toLowerCase().includes(rival.toLowerCase())) {
      issues.push({ nodeKey: '__meta', rule: 'meta', detail: `il rivale «${rival}» non appare nel flavour — la gara non si legge come gara` });
    }
    const prize = meta.names?.prize;
    if (prize && !meta.objective.toLowerCase().includes(prize.toLowerCase())) {
      issues.push({ nodeKey: '__meta', rule: 'meta', detail: `il premio «${prize}» non appare nell'obiettivo — premio e obiettivo incoerenti` });
    }
  }

  /* Recurrence counter — vocab terms used more than the threshold are
   * FLAGS, not issues: «allowed but poorly used» is human judgement. */
  const threshold = opts.recurrenceThreshold ?? 3;
  const terms = [
    ...vocab.creatureAmmissibili,
    ...(vocab.creatureAmmissibiliEn ?? []),
    ...vocab.props,
    ...vocab.luoghi,
    ...vocab.pericoliAmbientali,
    ...vocab.tracceAmmissibili,
  ];
  const lowerText = fullText.toLowerCase();
  for (const term of terms) {
    const escaped = term.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const count = (lowerText.match(new RegExp(escaped, 'g')) ?? []).length;
    if (count > threshold) {
      flags.push({ term, count, detail: `termine vocab '${term}' ricorre ${count}× — verificare pigrizia lessicale` });
    }
  }

  return { issues, flags };
}

/** Locale-invariant fields must be identical between the EN structural
 *  draft and the IT re-render (PLAN-027 D5 — machine-checkable parity). */
export function localeParityIssues(
  en: { id: string; prefix: string; intelId: string; names?: Record<string, string>; loot?: Record<string, string>; copy: Record<string, unknown> },
  it: { id: string; prefix: string; intelId: string; names?: Record<string, string>; loot?: Record<string, string>; copy: Record<string, unknown> },
): string[] {
  const issues: string[] = [];
  for (const field of ['id', 'prefix', 'intelId'] as const) {
    if (en[field] !== it[field]) issues.push(`${field}: EN «${en[field]}» ≠ IT «${it[field]}»`);
  }
  for (const bucket of ['names', 'loot'] as const) {
    const a = en[bucket] ?? {};
    const b = it[bucket] ?? {};
    for (const k of Object.keys(a)) {
      if (a[k] !== b[k]) issues.push(`${bucket}.${k}: EN «${a[k]}» ≠ IT «${b[k]}» (locale-invariant)`);
    }
    for (const k of Object.keys(b)) {
      if (!(k in a)) issues.push(`${bucket}.${k}: presente solo in IT`);
    }
  }
  const enKeys = Object.keys(en.copy).sort();
  const itKeys = Object.keys(it.copy).sort();
  if (enKeys.join('|') !== itKeys.join('|')) issues.push(`copy keys divergono: EN [${enKeys}] vs IT [${itKeys}]`);
  return issues;
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
