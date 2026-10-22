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

/** r008 — action-only option: `detail` is removed from the LLM output
 *  surface (it was the #1 leak vector: purpose, cost, future outcome).
 *  If the runtime still wants a detail, it is injected from
 *  contract/config — never generated. */
export const NarratedOptionLabelOnlySchema = z
  .object({ label: z.string().min(2).max(40) })
  .strict();

const flavor = z.string().min(1).max(160);

/** r008 — one bound assertion→canonicalEffect pair (sidecar, never
 *  rendered). The writer must emit one binding per concrete
 *  physical-event assertion in a verdict/attack line. */
export const EffectBindingSchema = z
  .object({
    assertion: z.string().min(1).max(200),
    effectId: z.string().min(1).max(60),
  })
  .strict();
export type EffectBinding = z.infer<typeof EffectBindingSchema>;

/** A verdict/attack line: bare text, or text + effectBindings sidecar.
 *  The sidecar'd form allows longer prose (bigwin reveals can run to
 *  ~400 chars — the 160 cap belongs to the single-line flavor). */
export const FlavorLineSchema = z.union([
  flavor,
  z
    .object({
      text: z.string().min(1).max(400),
      effectBindings: z.array(EffectBindingSchema).default([]),
    })
    .strict(),
]);
export type FlavorLine = z.infer<typeof FlavorLineSchema>;

export const VerdictBandsSchema = z
  .object({ epicfail: flavor, fail: flavor, almost: flavor, win: flavor, bigwin: flavor })
  .partial()
  .strict();

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

/** r008 — extended copy shape: verdict/attack lines may carry the
 *  effectBindings sidecar; combat nodes add typed attackLines; end
 *  nodes add closingLine. */
export const NarratedNodeCopyR8Schema = NarratedNodeCopySchema.extend({
  verdictFlavor: z
    .object({
      epicfail: FlavorLineSchema,
      fail: FlavorLineSchema,
      almost: FlavorLineSchema,
      win: FlavorLineSchema,
      bigwin: FlavorLineSchema,
    })
    .partial()
    .strict()
    .optional(),
  attackLines: z
    .object({
      epicfail: FlavorLineSchema,
      fail: FlavorLineSchema,
      almost: FlavorLineSchema,
      win: FlavorLineSchema,
      bigwin: FlavorLineSchema,
    })
    .strict()
    .optional(),
  closingLine: z.string().min(10).max(160).optional(),
}).strict();
export type NarratedNodeCopyR8 = z.infer<typeof NarratedNodeCopyR8Schema>;

/** r008 — kind-specific STRICT copy schemas (`copySchemaFor`): the LLM
 *  may only emit the fields its kind actually renders. */
export function copySchemaFor(brief: SceneBrief): z.ZodType<NarratedNodeCopyR8> {
  const base = {
    title: z.string().min(1).max(60),
    body: z.string().min(1).max(800),
  };
  const transitField = brief.outputShape.includes('transit') || brief.epistemic?.transitExpected
    ? { transit: z.string().max(200).optional() }
    : {};
  const verdictShape = z
    .object({
      epicfail: FlavorLineSchema,
      fail: FlavorLineSchema,
      almost: FlavorLineSchema,
      win: FlavorLineSchema,
      bigwin: FlavorLineSchema,
    })
    .partial()
    .strict();
  switch (brief.kind) {
    case 'check':
      return z
        .object({
          ...base,
          ...transitField,
          option: NarratedOptionLabelOnlySchema.optional(),
          verdictFlavor: verdictShape.optional(),
        })
        .strict() as unknown as z.ZodType<NarratedNodeCopyR8>;
    case 'combat':
      return z
        .object({
          ...base,
          ...transitField,
          attackLines: z
            .object({
              epicfail: FlavorLineSchema,
              fail: FlavorLineSchema,
              almost: FlavorLineSchema,
              win: FlavorLineSchema,
              bigwin: FlavorLineSchema,
            })
            .strict(),
        })
        .strict() as unknown as z.ZodType<NarratedNodeCopyR8>;
    case 'end':
      return z
        .object({
          ...base,
          ...transitField,
          closingLine: z.string().min(10).max(160),
        })
        .strict() as unknown as z.ZodType<NarratedNodeCopyR8>;
    case 'info':
      return z
        .object({ ...base, ...transitField })
        .strict() as unknown as z.ZodType<NarratedNodeCopyR8>;
    default:
      return z
        .object({ ...base, ...transitField })
        .strict() as unknown as z.ZodType<NarratedNodeCopyR8>;
  }
}

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
    | 'meta'
    | 'guaranteed-reward'
    | 'unsupported-mechanic'
    /* r008 hard checks */
    | 'pre-reveal-leak'
    | 'banned-setting'
    | 'invented-proper-noun'
    | 'option-mechanical-leak'
    | 'ui-telemetry-leak'
    | 'epicfail-missing-somatic'
    | 'closer-shape'
    | 'direct-loot-gate'
    | 'unsupported-outcome-event'
    | 'title-lock'
    /* r008 soft flags surfaced as issues with flag severity via kit
     * report — never hard-fail. */
    | 'prop-propagation'
    | 'lexical-repetition'
    | 'attack-distinct';
  detail: string;
  /** r008 — 'hard' rejects the copy; 'soft' is a human-review flag. */
  severity?: 'hard' | 'soft';
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

/* ------------------------------------------------------------------ */
/* Mechanical-promise lexicons (PLAN-027 gate v2 — ChatGPT critique).    */
/* "A consequence presented as check-dependent must correspond to a     */
/* real difference between outcomes" — deterministically decidable.     */
/* ------------------------------------------------------------------ */

/** Lexemes that invoke the reward/prize without naming it —
 *  «reclamare la vena» IS the prize claim even when the canonical
 *  name never appears. */
const REWARD_LEXEMES: Record<CopyLocale, RegExp> = {
  it: /\b(reclam\w*|premio|licenz\w*|assegnazion\w*|bottino|conquist\w*|vincer\w*|vinta|vinto)\b/i,
  en: /\b(claim\w*|prize|licen[cs]e\w*|reward\w*|loot|win|wins|won)\b/i,
};

/** Disjunctive markers — «reclamare la vena, OPpure tirarsi addosso il
 *  soffitto» puts the prize inside an either/or with catastrophe. */
const DISJUNCTION_LEXEMES: Record<CopyLocale, RegExp> = {
  it: /\b(oppure|altrimenti|o\s+rischi\w*)\b/i,
  en: /\b(or else|otherwise|or)\b/i,
};

/** Loss verbs — a fail-context sentence pairing a reward lexeme with a
 *  loss claims the prize can be taken away. */
const LOSS_LEXEMES: Record<CopyLocale, RegExp> = {
  it: /\b(perd\w+|sfugg\w+|rinunci\w*|senza|scapp\w+)\b/i,
  en: /\b(los[et]\w*|lost|forfeit\w*|without|miss\w*|gone)\b/i,
};

/** Promises of systems that do not exist — contesting a verdict is
 *  authored lore at most, never a player-accessible mechanic. */
const UNSUPPORTED_MECHANICS: Record<CopyLocale, RegExp> = {
  /* 'impugnare' needs its legal object — «impugnano le lance» is a
   * legitimate combat verb, not a verdict contest (false positive in
   * the goblin refine run, R-219). */
  it: /\b(contestabil\w*|contestazion\w*|ricors\w*|appell\w+|impugn\w+\s+(il|la|lo|l'|un|una|i|le)\s+(verdetto|esito|registro|responso|sentenza))\b/i,
  en: /\b(contest\w*|appeal\w*|disput(e|ed|ing)|challeng(e|ing) the (register|record|verdict))\b/i,
};

/** Split into sentence-ish units — commas stay inside the unit so a
 *  «claim X, oppure Y» disjunction is still one clause. */
function sentences(text: string): string[] {
  return text.split(/[.!?;…]+/).map((s) => s.trim()).filter(Boolean);
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

  /* Guaranteed reward (brief.guaranteedRewards): the check prices the
   * physical cost, never possession. Two decidable presentations are
   * forbidden — a reward lexeme inside a disjunction with catastrophe
   * («reclamare la vena, oppure il soffitto»), and, on the fail-side
   * fields only, a reward lexeme paired with a loss verb. */
  if (brief.guaranteedRewards?.length) {
    for (const text of texts) {
      for (const s of sentences(text)) {
        if (REWARD_LEXEMES[locale].test(s) && DISJUNCTION_LEXEMES[locale].test(s)) {
          issues.push({
            nodeKey: brief.nodeKey,
            rule: 'guaranteed-reward',
            detail: `premio garantito (${brief.guaranteedRewards.join(', ')}) in disgiunzione col rischio: "${s.slice(0, 80)}…"`,
          });
        }
      }
    }
    const failSide = [copy.failHint, copy.verdictFlavor?.fail, copy.verdictFlavor?.epicfail]
      .filter((t): t is string => Boolean(t));
    for (const text of failSide) {
      for (const s of sentences(text)) {
        if (REWARD_LEXEMES[locale].test(s) && LOSS_LEXEMES[locale].test(s)) {
          issues.push({
            nodeKey: brief.nodeKey,
            rule: 'guaranteed-reward',
            detail: `premio garantito presentato come perdibile in contesto di fallimento: "${s.slice(0, 80)}…"`,
          });
        }
      }
    }
  }

  /* Unsupported mechanics — the copy must not promise systems that do
   * not exist (contesting a verdict is lore, not a player mechanic). */
  for (const text of texts) {
    const m = text.match(UNSUPPORTED_MECHANICS[locale]);
    if (m) {
      issues.push({
        nodeKey: brief.nodeKey,
        rule: 'unsupported-mechanic',
        detail: `'${m[0]}' promette una meccanica inesistente (contestazione del verdetto): "${text.slice(0, 80)}…"`,
      });
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

/* ------------------------------------------------------------------ */
/* r008 — deterministic tokenizer + light stemmer (shared by every     */
/* kit-level counter; the same implementation must be used everywhere  */
/* so PROP_PROPAGATION/LEXICAL_REPETITION are reproducible).           */
/* ------------------------------------------------------------------ */

/** NFD + diacritic strip + lowercase + apostrophe→space + split on
 *  non-alphanumerics; tokens shorter than 3 chars are dropped. */
export function tokenize(text: string): string[] {
  const norm = text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/['’]/g, ' ');
  return norm.split(/[^\p{L}\p{N}]+/u).filter((t) => t.length >= 3);
}

/** Ordered suffix table — longest match wins; stripping stops when the
 *  remainder would be shorter than 3 chars. Deterministic by spec. */
const STEM_SUFFIXES = [
  'amente', 'mente', 'azioni', 'azione', 'ismi', 'ismo', 'iste', 'isti', 'ista', 'ità', 'ita',
  'ando', 'endo', 'are', 'ere', 'ire', 'ato', 'uto', 'ito', 'ata', 'uta', 'ati', 'uti', 'iti',
  'ate', 'ute', 'ite', 'ano', 'ono', 'ero', 'era', 'ere', 'ino', 'ina', 'ini', 'ine',
  'one', 'oni', 'etto', 'etta', 'etti', 'ette', 'ello', 'ella', 'elli', 'elle', 'ezza', 'ezze',
  'i', 'e', 'a', 'o',
];

/** Light Italian stem — strip the longest matching inflectional suffix
 *  once, keeping at least 3 chars of stem. */
export function stemOf(token: string): string {
  for (const s of STEM_SUFFIXES) {
    if (token.endsWith(s) && token.length - s.length >= 3) {
      return token.slice(0, token.length - s.length);
    }
  }
  return token;
}

/** Fixed Italian stopword list + domain stoplist — never counted as
 *  content stems. */
export const STOPWORDS = new Set([
  'il', 'lo', 'la', 'le', 'li', 'gli', 'un', 'una', 'uno', 'dei', 'del', 'della', 'dello', 'delle', 'degli',
  'di', 'da', 'in', 'con', 'su', 'per', 'tra', 'fra', 'a', 'ad', 'al', 'alla', 'allo', 'alle', 'ai', 'agli',
  'nel', 'nella', 'nello', 'nelle', 'nei', 'negli', 'sul', 'sulla', 'sullo', 'sulle', 'sui', 'sugli',
  'dal', 'dalla', 'dallo', 'dalle', 'dai', 'dagli', 'col', 'coi',
  'e', 'ed', 'o', 'ma', 'se', 'che', 'chi', 'non', 'si', 'ci', 'vi', 'ne', 'noi', 'voi', 'loro',
  'io', 'tu', 'egli', 'ella', 'esso', 'essa', 'essi', 'esse', 'questo', 'questa', 'questi', 'queste',
  'quello', 'quella', 'quelli', 'quelle', 'ciò', 'tutto', 'tutta', 'tutti', 'tutte', 'ogni',
  'mio', 'mia', 'miei', 'mie', 'tuo', 'tua', 'tuoi', 'tue', 'suo', 'sua', 'suoi', 'sue',
  'nostro', 'nostra', 'nostri', 'nostre', 'vostro', 'vostra', 'vostri', 'vostre', 'altrui',
  'più', 'meno', 'molto', 'molta', 'molti', 'molte', 'poco', 'poca', 'pochi', 'poche',
  'come', 'quando', 'dove', 'mentre', 'dopo', 'prima', 'poi', 'già', 'ancora', 'sempre', 'mai',
  'qui', 'qua', 'lì', 'là', 'sopra', 'sotto', 'dentro', 'fuori', 'oltre', 'verso', 'contro',
  'è', 'sono', 'era', 'erano', 'sarà', 'saranno', 'sia', 'siano', 'fosse', 'fossero', 'stato', 'stata', 'stati', 'state',
  'ha', 'hai', 'hanno', 'aveva', 'avevano', 'avrà', 'avete', 'abbiamo', 'ho',
  'fa', 'fanno', 'fare', 'fatto', 'dice', 'dicono', 'dette', 'detto', 'va', 'vanno', 'andare',
  'può', 'possono', 'deve', 'devono', 'vuole', 'vogliono', 'sa', 'sanno',
  'cui', 'quale', 'quali', 'quanto', 'quanta', 'quanti', 'quante', 'altro', 'altra', 'altri', 'altre',
  'stesso', 'stessa', 'stessi', 'stesse', 'solo', 'sola', 'soli', 'sole', 'finché', 'perché', 'quindi',
  'così', 'anche', 'neanche', 'nemmeno', 'invece', 'forse', 'quasi', 'proprio', 'propria',
  'senza', 'addosso', 'davanti', 'attorno', 'intorno', 'dietro', 'presso', 'insieme', 'fino', 'entro',
  'alto', 'alta', 'alti', 'alte', 'basso', 'bassa', 'bassi', 'basse', 'lungo', 'lunga', 'lunghi', 'lunghe',
  'corto', 'corta', 'corti', 'corte', 'ultimo', 'ultima', 'ultimi', 'ultime', 'vicino', 'vicina', 'lontano',
  /* elision residues — «dall'alto» tokenizes as dall+alto; the preposition
   * fragment is never content. */
  'dall', 'dell', 'nell', 'all', 'sull', 'coll', 'quell', 'quest',
  /* domain stoplist — high-frequency non-content nouns (r008 spec). */
  'passo', 'passi', 'volta', 'volte', 'cosa', 'cose', 'modo', 'tempo', 'momento',
]);

/* tokenize() strips diacritics — the stopword set must live in the same
 * normalized space or «più» never matches «piu». */
const STOPWORDS_NORM = new Set(
  [...STOPWORDS].map((w) => w.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()),
);

/** Content stems of a text — what kit-level counters actually count. */
export function contentStems(text: string): string[] {
  return tokenize(text)
    .filter((t) => !STOPWORDS_NORM.has(t))
    .map(stemOf);
}

/** Whole-word / wildcard matcher factory (r008): a bare term needs both
 *  boundaries; a trailing `*` is an explicit prefix wildcard. */
export function matchTerm(text: string, term: string): boolean {
  const t = text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();
  const isWildcard = term.endsWith('*');
  const escaped = (isWildcard ? term.slice(0, -1) : term).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = isWildcard
    ? new RegExp(`(^|[^\\p{L}\\p{N}])${escaped}[\\p{L}\\p{N}]*`, 'iu')
    : new RegExp(`(^|[^\\p{L}\\p{N}])${escaped}(?![\\p{L}\\p{N}])`, 'iu');
  return re.test(t);
}

/* ------------------------------------------------------------------ */
/* r008 — epistemic hard checks (run only when brief.epistemic exists;  */
/* the legacy path is untouched so r001/r002 kits keep validating).    */
/* ------------------------------------------------------------------ */

const ISSUE = (nodeKey: string, rule: ValidationIssue['rule'], detail: string): ValidationIssue => ({
  nodeKey,
  rule,
  detail,
  severity: 'hard',
});

/** Fields that see the world BEFORE the roll — forbiddenPreRevealTerms
 *  applies only here. Verdicts/attackLines/closingLine are post-
 *  resolution payloads and may name what they reveal. */
function framingFields(copy: NarratedNodeCopyR8): [string, string][] {
  const out: [string, string][] = [
    ['title', copy.title],
    ['body', copy.body],
  ];
  if (copy.transit) out.push(['transit', copy.transit]);
  if (copy.option) out.push(['option.label', copy.option.label]);
  return out;
}

/** All post-resolution lines (verdictFlavor + attackLines + outcomeLog). */
function resolutionLines(copy: NarratedNodeCopyR8): [string, FlavorLine | string][] {
  const out: [string, FlavorLine | string][] = [];
  for (const [band, v] of Object.entries(copy.verdictFlavor ?? {})) {
    if (v) out.push([`verdictFlavor.${band}`, v]);
  }
  for (const [band, v] of Object.entries(copy.attackLines ?? {})) {
    if (v) out.push([`attackLines.${band}`, v]);
  }
  for (const [band, v] of Object.entries(copy.outcomeLog ?? {})) {
    if (v) out.push([`outcomeLog.${band}`, v]);
  }
  return out;
}

/** The text of a possibly-sidecar'd line. */
function lineText(l: FlavorLine | string): string {
  return typeof l === 'string' ? l : l.text;
}

/** Mechanical/odds/loot lexemes banned in option labels (whole-word). */
const OPTION_MECHANICAL_LEXEMES = [
  'bonus', 'malus', 'rischio', 'rischi', 'costo', 'costi', 'penalità', 'vantaggio', 'svantaggio',
  'gratis', 'allerta', 'allarme', 'probabilità', 'turno', 'turni', 'check', 'tiro', 'tiri',
  'carico', 'bottino', 'trofeo', 'sicuro', 'sicura', 'facile', 'difficile', 'migliore', 'peggiore',
];

/** UI tally: <count word> + ≤2 tokens + enemy/party noun + ≤2 tokens +
 *  death/wound verb — prose must not narrate the UI's ledger. */
const UI_COUNT_WORDS = ['uno', 'una', 'due', 'tre', 'quattro', 'cinque', 'metà', 'tutti', 'tutte', 'nessuno', 'nessuna'];
const UI_DEATH_VERBS = ['crolla', 'crollano', 'cade', 'cadono', 'cadde', 'caddero', 'muore', 'muoiono', 'mori', 'uccide', 'uccidono', 'ucciso', 'uccisi', 'ferito', 'feriti', 'ferita', 'ferite'];
const UI_HP_RE = /\b(punti\s+ferita|PF|HP|vitalità|ferit[ae]\s+(liev[ei]|moderat[ae]|grav[ei]))\b/iu;

/** Sentence/word shape of the closing line (r008 closer-shape). */
const CLOSER_BANNED_OPENERS = ['così', 'e così', 'alla fine'];
const CLOSER_BANNED_TERMS = ['spedizion*', 'ricompens*', 'bottino', 'monet*', 'oro', 'conta', 'contano', 'lezion*', 'moral*'];

/** Validate one node against the r008 epistemic contract. Runs AFTER
 *  the legacy `validateNodeCopy` checks — it owns only what the legacy
 *  gate cannot decide. */
export function validateNodeCopyR8(
  raw: unknown,
  brief: SceneBrief,
  _vocab: DomainVocab,
  _locale: CopyLocale = 'it',
): { ok: true; copy: NarratedNodeCopyR8 } | { ok: false; issues: ValidationIssue[] } {
  const epi = brief.epistemic;
  if (!epi) {
    const parsed = NarratedNodeCopyR8Schema.safeParse(raw);
    return parsed.success
      ? { ok: true, copy: parsed.data }
      : { ok: false, issues: parsed.error.issues.map((i) => ({ nodeKey: brief.nodeKey, rule: 'schema' as const, detail: `${i.path.join('.')}: ${i.message}` })) };
  }
  const issues: ValidationIssue[] = [];

  /* direct-loot-gate — a `recovery:'direct'` node is the reward itself:
   *  options, verdicts, checks and hints are forbidden on it, whatever
   *  shape the raw draft takes. Checked on the RAW object so the named
   *  rule fires even when the strict schema would reject first. */
  if (epi.recovery === 'direct' && raw && typeof raw === 'object') {
    const r = raw as Record<string, unknown>;
    const offending = ['option', 'options', 'verdictFlavor', 'failHint', 'attackLines'].filter((k) => r[k] !== undefined);
    if (offending.length) {
      issues.push(ISSUE(brief.nodeKey, 'direct-loot-gate', `nodo recovery:'direct' con campi vietati: ${offending.join(', ')} — il recupero è un gesto, non una prova`));
    }
  }

  const parsed = copySchemaFor(brief).safeParse(raw);
  /* Schema failures are recorded but do NOT short-circuit: the other
   *  checks still run on a best-effort view of the raw draft so a writer
   *  gets every violation in one pass (fail-loud, full report). */
  if (!parsed.success) {
    for (const i of parsed.error.issues) {
      issues.push({ nodeKey: brief.nodeKey, rule: 'schema' as const, detail: `${i.path.join('.')}: ${i.message}` });
    }
  }
  const copy: NarratedNodeCopyR8 = parsed.success
    ? parsed.data
    : (() => {
        const r = (raw ?? {}) as Record<string, unknown>;
        return {
          title: typeof r.title === 'string' ? r.title : '',
          body: typeof r.body === 'string' ? r.body : '',
          transit: typeof r.transit === 'string' ? r.transit : undefined,
          failHint: typeof r.failHint === 'string' ? r.failHint : undefined,
          option: r.option && typeof r.option === 'object'
            ? { label: String((r.option as Record<string, unknown>).label ?? ''), detail: typeof (r.option as Record<string, unknown>).detail === 'string' ? (r.option as Record<string, unknown>).detail as string : undefined }
            : undefined,
          verdictFlavor: r.verdictFlavor as NarratedNodeCopyR8['verdictFlavor'],
          attackLines: r.attackLines as NarratedNodeCopyR8['attackLines'],
          outcomeLog: r.outcomeLog as NarratedNodeCopyR8['outcomeLog'],
          closingLine: typeof r.closingLine === 'string' ? r.closingLine : undefined,
        };
      })();
  const framing = framingFields(copy);
  const allLines = [...framing.map(([f, t]) => [f, t] as [string, string]), ...resolutionLines(copy).map(([f, l]) => [f, lineText(l)] as [string, string])];

  /* title-lock — a locked title is injected, not generated: if the copy
   * carries one anyway it must match exactly. */
  if (epi.titleLock && copy.title !== epi.titleLock) {
    issues.push(ISSUE(brief.nodeKey, 'title-lock', `titolo bloccato dal contratto: atteso «${epi.titleLock}», trovato «${copy.title}»`));
  }

  /* pre-reveal-leak — forbidden terms in framing fields only. */
  for (const [field, text] of framing) {
    for (const term of epi.forbiddenPreRevealTerms) {
      if (matchTerm(text, term)) {
        issues.push(ISSUE(brief.nodeKey, 'pre-reveal-leak', `'${term}' nel campo pre-roll '${field}': "${text.slice(0, 80)}…"`));
      }
    }
  }

  /* banned-setting — everywhere (the world must stay closed). */
  for (const [field, text] of allLines) {
    for (const term of epi.bannedSettingTerms) {
      if (matchTerm(text, term)) {
        issues.push(ISSUE(brief.nodeKey, 'banned-setting', `termine di setting vietato '${term}' in '${field}': "${text.slice(0, 80)}…"`));
      }
    }
  }

  /* invented-proper-noun — mid-sentence capitalized token outside the
   *  allowed inventory (sentence-initial capitals are legal). */
  for (const [field, text] of allLines) {
    const inner = text.replace(/(^|[.!?:;—…»«"']\s+)[A-ZÀÈÉÌÒÙ]/g, (m) => m.slice(0, -1));
    for (const m of inner.matchAll(/\b[A-ZÀÈÉÌÒÙ][\p{L}']+/gu)) {
      const token = m[0];
      if (!epi.allowedEntities.some((a) => a.toLowerCase() === token.toLowerCase())) {
        issues.push(ISSUE(brief.nodeKey, 'invented-proper-noun', `nome proprio non ammesso '${token}' in '${field}': "${text.slice(0, 80)}…"`));
      }
    }
  }

  /* option-mechanical-leak — digits, banned punctuation, stat nouns
   *  (except a verb-first token), 'se', mechanical lexemes. */
  if (copy.option) {
    const label = copy.option.label;
    const tokens = tokenize(label);
    if (/\d/.test(label) || /[+\-=—:;%]/.test(label)) {
      issues.push(ISSUE(brief.nodeKey, 'option-mechanical-leak', `cifre o simboli meccanici nella label «${label}»`));
    }
    tokens.forEach((tok, i) => {
      if (i === 0) return; /* token 0 may be a verb (Forza la porta). */
      if (STAT_NAMES_IT.includes(tok)) {
        issues.push(ISSUE(brief.nodeKey, 'option-mechanical-leak', `stat '${tok}' nella label «${label}» — la label nomina il gesto, non la stat`));
      }
    });
    if (tokens.includes('se')) {
      issues.push(ISSUE(brief.nodeKey, 'option-mechanical-leak', `condizionale 'se' nella label «${label}»`));
    }
    for (const lex of OPTION_MECHANICAL_LEXEMES) {
      if (matchTerm(label, lex)) {
        issues.push(ISSUE(brief.nodeKey, 'option-mechanical-leak', `lessema meccanico '${lex}' nella label «${label}»`));
      }
    }
    if (tokens.length > 6) {
      issues.push(ISSUE(brief.nodeKey, 'option-mechanical-leak', `label troppo lunga (${tokens.length} parole > 6): «${label}»`));
    }
    for (const term of epi.forbiddenPreRevealTerms) {
      if (matchTerm(label, term)) {
        issues.push(ISSUE(brief.nodeKey, 'pre-reveal-leak', `'${term}' nella label «${label}»`));
      }
    }
  }

  /* ui-telemetry-leak — digits (already covered), UI tally composites,
   *  HP/wound-severity vocabulary. */
  for (const [field, text] of allLines) {
    if (UI_HP_RE.test(text)) {
      issues.push(ISSUE(brief.nodeKey, 'ui-telemetry-leak', `vocabolario HP/UI in '${field}': "${text.slice(0, 80)}…"`));
    }
    const stems = tokenize(text);
    for (let i = 0; i < stems.length; i++) {
      if (!UI_COUNT_WORDS.includes(stems[i])) continue;
      const window = stems.slice(i + 1, i + 6);
      const enemyIdx = window.findIndex((w) => epi.enemyNouns?.includes(w) ?? ['goblin'].includes(w));
      if (enemyIdx === -1 || enemyIdx > 2) continue;
      const rest = window.slice(enemyIdx + 1, enemyIdx + 4);
      if (rest.some((w) => UI_DEATH_VERBS.includes(w))) {
        issues.push(ISSUE(brief.nodeKey, 'ui-telemetry-leak', `conteggio da UI in '${field}': "${text.slice(0, 80)}…"`));
      }
    }
  }

  /* epicfail-missing-somatic — a mechanically-paid epicfail must carry
   *  one of the contract's injury anchors. */
  const epic = copy.verdictFlavor?.epicfail;
  const anchors = epi.verdictFacts?.epicfail?.injuryAnchors;
  if (anchors?.length && epic && !anchors.some((a) => matchTerm(lineText(epic), a))) {
    issues.push(ISSUE(brief.nodeKey, 'epicfail-missing-somatic', `epicfail senza ancora somatica del contratto (${anchors.join('|')}): "${lineText(epic).slice(0, 80)}…"`));
  }

  /* closer-shape — the ending line is one sharp sentence, not a tally. */
  if (brief.kind === 'end' && copy.closingLine) {
    const cl = copy.closingLine;
    const sentences = cl.split(/[.!?…]+/).map((s) => s.trim()).filter(Boolean);
    const words = tokenize(cl).length;
    const first = tokenize(cl)[0];
    if (sentences.length !== 1 || words < 6 || words > 20 || /[;:]/.test(cl)) {
      issues.push(ISSUE(brief.nodeKey, 'closer-shape', `closingLine fuori forma (1 frase, 6-20 parole, niente ; :): «${cl}»`));
    } else if (CLOSER_BANNED_OPENERS.includes(first ?? '') || CLOSER_BANNED_TERMS.some((t) => matchTerm(cl, t))) {
      issues.push(ISSUE(brief.nodeKey, 'closer-shape', `closingLine suona come bilancio/ricap: «${cl}»`));
    }
  }

  /* unsupported-outcome-event — every bound effectId must exist in ITS
   *  OWN band's canonicalEffects and the bound assertion must appear in
   *  the line. (Independent enumeration stays with the blocking Critic.) */
  for (const [field, l] of resolutionLines(copy)) {
    if (typeof l === 'string') continue;
    const band = field.split('.').pop() as keyof NonNullable<typeof epi.verdictFacts>;
    const allowed = new Set((epi.verdictFacts?.[band]?.canonicalEffects ?? []).map((e) => e.id));
    for (const b of l.effectBindings) {
      if (!allowed.has(b.effectId)) {
        issues.push(ISSUE(brief.nodeKey, 'unsupported-outcome-event', `effectId '${b.effectId}' non nella banda '${band}' di '${field}' (permessi: ${[...allowed].join(', ') || '—'})`));
      }
      if (!lineText(l).toLowerCase().includes(b.assertion.toLowerCase().slice(0, 30))) {
        issues.push(ISSUE(brief.nodeKey, 'unsupported-outcome-event', `asserzione «${b.assertion.slice(0, 50)}» non trovata nel testo di '${field}'`));
      }
    }
  }

  return issues.length ? { ok: false, issues } : { ok: true, copy };
}

/* ------------------------------------------------------------------ */
/* r008 — kit-level soft flags (never reject: human-review surface).   */
/* ------------------------------------------------------------------ */

export interface KitSoftFlag {
  code: 'PROP_PROPAGATION' | 'LEXICAL_REPETITION' | 'ATTACK_DISTINCT';
  stem: string;
  count?: number;
  nodes?: string[];
  detail: string;
}

/** First content token of a line — skipping articles, prepositions and
 *  elision fragments (l', d', un'). */
function firstContentToken(text: string): string {
  const SKIP = new Set(['il', 'lo', 'la', 'le', 'li', 'gli', 'un', 'una', 'uno', 'di', 'da', 'in', 'con', 'su', 'per', 'a', 'e', 'l', 'd', 'un', 'del', 'dei', 'nel', 'sul', 'dal']);
  for (const t of tokenize(text)) {
    if (!SKIP.has(t)) return t;
  }
  return '';
}

function jaccard(a: Set<string>, b: Set<string>): number {
  const inter = [...a].filter((x) => b.has(x)).length;
  const union = new Set([...a, ...b]).size;
  return union ? inter / union : 0;
}

/** Soft kit-level flags for the r008 contract — counted on content
 *  stems of the whole kit, excluding allowedEntities/texture/terms. */
export function kitSoftFlagsR8(
  copyByNode: Record<string, NarratedNodeCopyR8>,
  briefs: SceneBrief[],
): KitSoftFlag[] {
  const flags: KitSoftFlag[] = [];
  const exempt = new Set<string>();
  for (const b of briefs) {
    for (const e of b.epistemic?.allowedEntities ?? []) exempt.add(stemOf(tokenize(e)[0] ?? e));
    for (const list of Object.values(b.epistemic?.world?.texture ?? {})) {
      for (const t of list ?? []) exempt.add(stemOf(tokenize(t)[0] ?? t));
    }
    for (const t of Object.values(b.epistemic?.world?.canonicalTerms ?? {})) {
      for (const tok of tokenize(t)) exempt.add(stemOf(tok));
    }
    for (const t of b.epistemic?.endSeeds ?? []) exempt.add(stemOf(tokenize(t)[0] ?? t));
  }

  const perNode: Record<string, string[]> = {};
  for (const [key, c] of Object.entries(copyByNode)) {
    const text = [...framingFields(c).map(([, t]) => t), ...resolutionLines(c).map(([, l]) => lineText(l))].join(' ');
    perNode[key] = contentStems(text);
  }
  const total: Record<string, number> = {};
  const inNodes: Record<string, Set<string>> = {};
  for (const [key, stems] of Object.entries(perNode)) {
    for (const s of new Set(stems)) {
      total[s] = (total[s] ?? 0) + stems.filter((x) => x === s).length;
      (inNodes[s] ??= new Set()).add(key);
    }
  }
  for (const [stem, nodes] of Object.entries(inNodes)) {
    if (exempt.has(stem)) continue;
    if (nodes.size >= 3) {
      flags.push({ code: 'PROP_PROPAGATION', stem, nodes: [...nodes], detail: `stem '${stem}' in ${nodes.size} nodi — prop non ammesso propagato o motivo da contratto?` });
    }
    if ((total[stem] ?? 0) > 5) {
      flags.push({ code: 'LEXICAL_REPETITION', stem, count: total[stem], detail: `stem '${stem}' ricorre ${total[stem]}× nel kit` });
    }
  }

  /* ATTACK_DISTINCT — pairwise Jaccard < 0.4 and distinct first content
   *  token across every combat node's attackLines. */
  for (const [key, c] of Object.entries(copyByNode)) {
    const lines = Object.values(c.attackLines ?? {}).filter(Boolean).map(lineText);
    const firsts = lines.map(firstContentToken);
    if (new Set(firsts).size !== firsts.length) {
      flags.push({ code: 'ATTACK_DISTINCT', stem: key, detail: `attackLines di '${key}' condividono il primo content-token` });
    }
    for (let i = 0; i < lines.length; i++) {
      for (let j = i + 1; j < lines.length; j++) {
        const sim = jaccard(new Set(contentStems(lines[i])), new Set(contentStems(lines[j])));
        if (sim >= 0.4) {
          flags.push({ code: 'ATTACK_DISTINCT', stem: key, detail: `attackLines '${key}' bande ${i}/${j} Jaccard ${sim.toFixed(2)} ≥ 0.4` });
        }
      }
    }
  }
  return flags;
}
