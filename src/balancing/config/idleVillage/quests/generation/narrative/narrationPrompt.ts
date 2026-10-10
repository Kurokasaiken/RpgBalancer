/**
 * narrationPrompt — per-node prompts for the PLAN-027 r001 pipeline.
 *
 * Pass 1 drafts in English (the structural language); Pass 5 re-voices
 * the locked facts in Italian (a peer render, never a literal
 * translation). Every prompt carries the arc contract, the node's role
 * in the arc, the prop glossary, the option labels already used in the
 * kit, and a story-so-far line per previous scene — a node is no longer
 * written stateless.
 *
 * Voice anchors: POSITIVE excerpts only, from authored quest copy
 * (goblin/rovine) — the rejected corpus is distilled into the critic
 * rubric and the gate rules, never shown as an example to imitate.
 */

import type { SceneBrief } from './sceneBrief';
import type { DomainVocab } from '../domainVocabs';
import type { QuestArcContract } from './arcContract';
import { contractPromptSection, contractRoleFor } from './arcContract';
import type { CopyLocale, NarratedKitMeta, NarratedNodeCopy } from './validateCopy';

export interface NarrationRequest {
  brief: SceneBrief;
  prompt: string;
}

/** Positive voice anchors — excerpt-sized, authored, register reference. */
export const VOICE_ANCHORS = {
  offer:
    '«Terza razzia in un mese. I carri dei mercanti non passano più dal guado: gli ultimi due sono tornati con le casse vuote e le stanghe rotte. Il consiglio non discute più: paga.»',
  scene: '«Il bosco tace in un modo che ai boschi non viene naturale.»',
  option: '«Percezione. Il suolo racconta chi è passato, e quanti erano.»',
  ending: '«La strada scende verso casa. Qualcuno ha cominciato a fischiettare. Poi smette, senza che nessuno dica perché.»',
} as const;

const VOICE_RULES =
  'Register: external narrator, second person plural where addressed; sober and concrete; every image earns its place; a payoff clause closes each scene. No high rhetoric, no combat-movie tone, no exclamation marks.';

export interface NodePromptOpts {
  /** Stub-kit nouns → canonical names chosen by the meta call. */
  canonicalNames?: Record<string, string>;
  /** Pass 0 arc contract — injected verbatim when present. */
  contract?: QuestArcContract;
  /** Option labels already emitted in this kit — must differ. */
  usedLabels?: string[];
  /** One line per previous scene (title + first sentence) — the story
   *  the player has already read. */
  prevScenes?: { key: string; title: string; line: string }[];
  /** Extra must-say lines from the caller (e.g. competition in flavour). */
  extraMustConvey?: string[];
}

/** Build the provider prompt for one node — compact, self-contained. */
export function promptForNode(
  brief: SceneBrief,
  vocab: DomainVocab,
  meta: { gimmick: string; mood: string; locale?: CopyLocale },
  opts: NodePromptOpts = {},
): NarrationRequest {
  const en = meta.locale === 'en';
  const banned = en ? (vocab.vietatiEn ?? vocab.vietati) : vocab.vietati;
  const creatures = en ? (vocab.creatureAmmissibiliEn ?? []) : vocab.creatureAmmissibili;
  const roleLine = opts.contract ? contractRoleFor(opts.contract, brief.nodeKey) : undefined;

  const lines: string[] = [
    en
      ? `You are a quest writer for a dark-fantasy RPG. Write ONE scene in English.`
      : `Sei uno scrittore di quest per un RPG dark-fantasy. Scrivi il testo di UNA scena in italiano.`,
    ``,
    `WORLD (${vocab.label}): ${vocab.contractPitch}`,
    `STRUCTURAL GIMMICK: ${meta.gimmick}`,
    `TONE: ${meta.mood}`,
    VOICE_RULES,
    ``,
    `VOICE ANCHORS (register reference only — do not copy content):`,
    `- scene: ${VOICE_ANCHORS.scene}`,
    `- option detail: ${VOICE_ANCHORS.option}`,
    ``,
  ];

  if (opts.contract) {
    lines.push(contractPromptSection(opts.contract), ``);
  }

  lines.push(
    `SCENE: '${brief.nodeKey}' (role: ${brief.kind}, beat ${brief.beat})${roleLine ? ` — arc role: ${roleLine}` : ''}`,
    en ? `MECHANICAL FACTS (must not contradict):` : `FATTI MECCANICI (non contraddire):`,
    ...brief.facts.map((f) => `- ${f}`),
    ``,
    en ? `MUST CONVEY:` : `DEVE COMUNICARE:`,
    ...brief.mustConvey.map((m) => `- ${m}`),
    ...(opts.extraMustConvey ?? []).map((m) => `- ${m}`),
    ``,
    en ? `YOU MAY INVENT only from this whitelist:` : `PUOI INVENTARE solo da questa whitelist:`,
    ...brief.mayInvent
      .filter((m) => !en || !m.startsWith('creatura:')) /* creatures get the locale list below */
      .slice(0, 24)
      .map((m) => `- ${m}`),
    ...(en ? creatures.map((c) => `- creature: ${c}`) : []),
    ``,
    en ? `FORBIDDEN (one hit rejects the whole scene):` : `VIETATO (un solo termine boccia il testo):`,
    ...banned.map((f) => `- ${f}`),
  );

  if (opts.canonicalNames && Object.keys(opts.canonicalNames).length) {
    lines.push(
      ``,
      `CANONICAL NAMES — use ONLY these for objects/places/characters:`,
      ...Object.entries(opts.canonicalNames).map(([stub, canon]) => `- «${canon}» (in facts: '${stub}')`),
    );
  }

  if (opts.usedLabels?.length) {
    lines.push(
      ``,
      `OPTION LABELS ALREADY USED IN THIS KIT — your 'option.label' MUST differ clearly from all of these:`,
      ...opts.usedLabels.map((l) => `- «${l}»`),
    );
  }

  if (opts.prevScenes?.length) {
    lines.push(
      ``,
      `STORY SO FAR (scenes the player has already read — never restate their content):`,
      ...opts.prevScenes.map((s) => `- '${s.key}': ${s.title} — ${s.line}`),
    );
  }

  lines.push(
    ``,
    `RULES:`,
    en
      ? `- English prose. No digits and no + − = symbols anywhere (the UI shows the numbers): write "a step forward", never "+1", "a risk", never "35%".`
      : `- Italiano. Numeri vietati nel testo (i numeri li mostra l'UI): MAI cifre arabe né simboli + − = — scrivi "un passo avanti" non "+1", "un rischio" non "35%".`,
    `- No invented proper nouns outside the whitelist.`,
    `- NEVER cite technical ids ('fv-x', 'CHECK:', option/node names) or the word "check": immersive prose only, mechanics stay backstage.`,
    `- Trait mechanics (who may take an option because of who they are) must NEVER be explained in prose — present the choice, not its gate.`,
    `- Stat names may appear ONLY inside 'option.detail' (authored convention: «Percezione. Il suolo racconta…») — never in title/body/transit/failHint/verdictFlavor.`,
    en ? `- Respond with VALID JSON only, no markdown:` : `- Rispondi SOLO con JSON valido, niente markdown:`,
    `{ "title": "≤60 chars", "body": "2-4 sentences ≤400 chars"${brief.outputShape.includes('failHint') ? ', "failHint": "≤80 chars — the danger before the roll"' : ''}${brief.outputShape.includes('option{label,detail}') ? ', "option": {"label": "≤40 chars", "detail": "≤140 chars — stat + cost in words"}' : ''}${brief.outputShape.some((s) => s.startsWith('transit')) ? ', "transit": "≤140 chars"' : ''}${brief.outputShape.some((s) => s.startsWith('verdictFlavor')) ? ', "verdictFlavor": {"win": "≤120", "fail": "≤120", "epicfail": "≤120"}' : ''}${brief.outputShape.some((s) => s.startsWith('outcomeLog')) ? ', "outcomeLog": {"win": "≤140", "bigwin": "≤140"}' : ''} }`,
  );
  return { brief, prompt: lines.join('\n') };
}

/** Meta-level prompt — the offer envelope. EN draft: for the race
 *  gimmick the flavour MUST name the rival and read as a contest. */
export function promptForKitMeta(
  vocab: DomainVocab,
  meta: { gimmick: string; mood: string; extraFields: string[]; locale?: CopyLocale; contract?: QuestArcContract },
): string {
  const en = meta.locale === 'en';
  const banned = en ? (vocab.vietatiEn ?? vocab.vietati) : vocab.vietati;
  return [
    en
      ? `You are a quest writer for a dark-fantasy RPG. Write the quest's OFFER envelope in English — the manifest the player reads before accepting.`
      : `Sei uno scrittore di quest per un RPG dark-fantasy. Scrivi l'involucro dell'offerta in italiano.`,
    `WORLD (${vocab.label}): ${vocab.contractPitch}`,
    `STRUCTURAL GIMMICK: ${meta.gimmick}`,
    `TONE: ${meta.mood}`,
    VOICE_RULES,
    ``,
    `VOICE ANCHOR (register only): ${VOICE_ANCHORS.offer}`,
    ...(meta.contract
      ? [
          ``,
          `ARC CONTRACT (already decided — obey it):`,
          `- Arc: ${meta.contract.arcSummary}`,
          ...(meta.contract.competition ? [`- Competition: ${meta.contract.competition}`] : []),
          `- Opposition: ${meta.contract.opposition.name} — ${meta.contract.opposition.role}`,
        ]
      : []),
    ``,
    `INVENT only from: ${[...vocab.luoghi, ...vocab.props, ...vocab.pericoliAmbientali].slice(0, 20).join(', ')}`,
    `FORBIDDEN: ${banned.join(', ')}`,
    ``,
    `Rules:`,
    `- No digits, no + − = symbols, no technical ids.`,
    meta.gimmick.toLowerCase().includes('corsa') || meta.gimmick.toLowerCase().includes('race')
      ? `- This is a RACE: 'flavour' must name the rival (names.rival) and make the COMPETITION explicit — the player must read that they race AGAINST someone. 'objective' must name the prize (names.prize).`
      : `- 'objective' must state concretely what the player does.`,
    `- 'intelId' is a kebab-case id (e.g. 'mappa-galleria'), not prose.`,
    `Respond with VALID JSON only:`,
    `{ "title": "quest title ≤40", "flavour": "one line ≤120", "objective": "declared objective ≤140", "intelId": "kebab-case ≤24"${meta.extraFields.length ? `, ${meta.extraFields.join(', ')}` : ''} }`,
  ].join('\n');
}

/* ------------------------------------------------------------------ */
/* Pass 3 — critic.                                                    */
/* ------------------------------------------------------------------ */

/** The defect classes the critic scores against — the rejected corpus
 *  distilled into a rubric (never shown to the generator as examples). */
export const CRITIC_CLASSES = [
  'mechanical-leak — trait ids, stats, vars, internal ids paraphrased into prose',
  'competition-clarity — the scene/offer does not read as a contest against the rival',
  'prop-as-magic — a named object with no concrete function in the scene',
  'phase-mismatch — the scene narrates content belonging to another phase (e.g. a final check describing the start of the race)',
  'label-indistinction — the option label is interchangeable with a sibling label',
  'grammar — malformed or non-idiomatic language for the target locale',
  'register-drift — high rhetoric, combat-movie tone, melodrama where the voice is sober',
  'lore-invention — facts/lore not entailed by the brief, the contract, or the vocab',
  'unsupported-cost — injuries/costs asserted that the mechanics cannot have produced',
  'ending-inconsistency — win/lose claims contradicting endingFacts or the prize/objective identity',
] as const;

/** Critic prompt — scores a draft against the rubric; structured output. */
export function promptForCritic(
  brief: SceneBrief,
  draft: NarratedNodeCopy,
  vocab: DomainVocab,
  opts: { locale: CopyLocale; contract?: QuestArcContract; usedLabels?: string[] },
): string {
  return [
    `You are the strictest reviewer on a dark-fantasy RPG writing team. A draft scene is below. Score it against the rubric — find EVERY defect, but do not rewrite.`,
    ``,
    `LOCALE: ${opts.locale}`,
    `SCENE ROLE: '${brief.nodeKey}' (${brief.kind}, beat ${brief.beat})${opts.contract ? ` — arc role: ${contractRoleFor(opts.contract, brief.nodeKey)}` : ''}`,
    `MECHANICAL FACTS IT MUST NOT CONTRADICT:`,
    ...brief.facts.map((f) => `- ${f}`),
    ...(opts.contract
      ? [
          `ARC CONSTRAINTS:`,
          `- Competition: ${opts.contract.competition || 'none'}`,
          `- Prop meanings: ${opts.contract.propGlossary.map((p) => `«${p.term}»=${p.meaning}`).join('; ')}`,
          `- Ending facts — win: ${opts.contract.endingFacts.win.join(' | ')} ; lose: ${opts.contract.endingFacts.lose.join(' | ')}`,
        ]
      : []),
    ...(opts.usedLabels?.length ? [`SIBLING LABELS ALREADY USED: ${opts.usedLabels.join(' | ')}`] : []),
    ``,
    `DRAFT:`,
    JSON.stringify(draft, null, 2),
    ``,
    `RUBRIC — report one finding per defect:`,
    ...CRITIC_CLASSES.map((c) => `- ${c}`),
    ``,
    `Answer ONLY with valid JSON: {"accept": true|false, "findings": [{"class": "rubric-class", "field": "title|body|option|…", "detail": "what is wrong"}]}`,
    `accept=false if ANY finding exists. Be strict — this artefact was already rejected once for professional quality.`,
  ].join('\n');
}

/** Revise prompt — the generator rewrites its own draft with the
 *  critic's findings cited. */
export function promptForRevise(originalPrompt: string, draft: NarratedNodeCopy, findings: { class: string; field: string; detail: string }[]): string {
  return [
    originalPrompt,
    ``,
    `YOUR PREVIOUS DRAFT WAS REJECTED BY REVIEW. Rewrite it fixing EVERY finding — same JSON shape, same constraints.`,
    `PREVIOUS DRAFT:`,
    JSON.stringify(draft, null, 2),
    `FINDINGS:`,
    ...findings.map((f) => `- [${f.class}] ${f.field}: ${f.detail}`),
  ].join('\n');
}

/* ------------------------------------------------------------------ */
/* Pass 5 — facts-locked IT re-render.                                 */
/* ------------------------------------------------------------------ */

/** Re-render prompt — EN structural copy re-voiced in Italian. Facts,
 *  judgements, and locale-invariant names are locked; the voice is free
 *  to be idiomatic. Never a literal translation. */
export function promptForRerender(
  brief: SceneBrief,
  enCopy: NarratedNodeCopy,
  vocab: DomainVocab,
  opts: { contract?: QuestArcContract; canonicalNames?: Record<string, string>; usedLabels?: string[] },
): string {
  return [
    `Sei uno scrittore di quest per un RPG dark-fantasy. Una scena è stata approvata in inglese: ri-vocala in ITALIANO.`,
    `NON è una traduzione letterale: riscrivi con voce italiana idiomatica — stesse scene, stessi fatti, stesse scelte. Puoi cambiare immagini e ritmo, NON puoi cambiare fatti, giudizi, o chi fa cosa.`,
    ``,
    `WORLD (${vocab.label}): ${vocab.contractPitch}`,
    VOICE_RULES,
    `VOICE ANCHORS (register reference):`,
    `- ${VOICE_ANCHORS.scene}`,
    `- ${VOICE_ANCHORS.option}`,
    ...(opts.contract
      ? [
          ``,
          `PROP GLOSSARY (cosa sono concretamente — mantieni questa funzione):`,
          ...opts.contract.propGlossary.map((p) => `- «${p.term}»: ${p.meaning}`),
          `LOCKED FACTS (invarianti — non riformulare diversamente):`,
          ...opts.contract.lockedFacts.map((f) => `- ${f}`),
        ]
      : []),
    ``,
    `SCENA: '${brief.nodeKey}' (ruolo: ${brief.kind})`,
    `FATTI MECCANICI (non contraddire):`,
    ...brief.facts.map((f) => `- ${f}`),
    ``,
    `VIETATO: ${vocab.vietati.join(', ')}`,
    ...(opts.usedLabels?.length
      ? [`LABEL GIÀ USATE (la tua option.label deve distinguersi): ${opts.usedLabels.join(' | ')}`]
      : []),
    ``,
    `REGOLE: niente cifre né simboli; trait/stat/id tecnici mai in prosa; nomi propri locale-invarianti restano identici; nomi comuni li italianizzi.`,
    `DRAFT INGLESE BLOCCATO:`,
    JSON.stringify(enCopy, null, 2),
    `Rispondi SOLO con JSON valido nella stessa forma (campi in italiano).`,
  ].join('\n');
}

/** Re-render the kit meta envelope to IT — same contract as nodes. */
export function promptForMetaRerender(
  enMeta: NarratedKitMeta,
  vocab: DomainVocab,
  opts: { contract?: QuestArcContract },
): string {
  return [
    `Sei uno scrittore di quest per un RPG dark-fantasy. L'involucro dell'offerta è stato approvato in inglese: ri-vocalo in ITALIANO — stessa sostanza, voce idiomatica, non traduzione letterale.`,
    `WORLD (${vocab.label}): ${vocab.contractPitch}`,
    `VOICE ANCHOR (register): ${VOICE_ANCHORS.offer}`,
    ...(opts.contract ? [`COMPETITION: ${opts.contract.competition}`] : []),
    `VIETATO: ${vocab.vietati.join(', ')}`,
    `REGOLE: niente cifre; se c'è un rivale, il flavour DEVE nominarlo e rendere esplicita la gara; l'objective DEVE nominare il premio. I nomi propri restano identici; intelId resta identico.`,
    `DRAFT INGLESE:`,
    JSON.stringify(enMeta, null, 2),
    `Rispondi SOLO con JSON valido nella stessa forma.`,
  ].join('\n');
}
