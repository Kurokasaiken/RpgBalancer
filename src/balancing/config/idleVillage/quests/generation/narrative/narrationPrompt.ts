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
import { contractPromptSection, contractRoleFor, nodeContractFor, nodeContractPromptSection, worldPromptSection } from './arcContract';
import type { CopyLocale, NarratedKitMeta, NarratedNodeCopy } from './validateCopy';

export interface NarrationRequest {
  brief: SceneBrief;
  prompt: string;
}

/** Positive voice anchors — excerpt-sized, authored, register reference. */
export const VOICE_ANCHORS = {
  offer: '«Il bosco si è fatto silenzioso. I goblin, no.»',
  scene: '«Il bosco tace in un modo che ai boschi non viene naturale.»',
  option: '«Percezione. Vi abbassate tra le radici.»',
  ending: '«Poi un fischio attraversa gli alberi. Un secondo gli risponde. Quando vi fermate, tutto tace.»',
} as const;

const VOICE_RULES =
  'Register: external narrator, second person plural where addressed; sober and concrete; every image earns its place; a payoff clause closes each scene. No high rhetoric, no combat-movie tone, no exclamation marks.';

/* ------------------------------------------------------------------ */
/* r008 — register profiles by kind. The flat VOICE_RULES above stays  */
/* for the legacy kit path; epistemic briefs get the typed register.   */
/* ------------------------------------------------------------------ */

export const REGISTER_BY_KIND: Record<string, string> = {
  choice:
    'Registro: seconda persona plurale, gesto concreto. La scena prepara la scelta senza spiegarla: niente scopi, niente conseguenze, niente meccanica. Le opzioni nominano SOLO il gesto fisico («Esamina il terreno», «Arrampicati sulla quercia»).',
  check:
    'Registro: il mondo prima del lancio — tensione sensoriale, mai l\'esito. Il failHint è il pericolo percepibile PRIMA del tiro, in una riga. Le righe di verdetto sono post-risoluzione: ognuna mostra SOLO ciò che la sua banda canonica dichiara.',
  info:
    'Registro: quiete tesa, una scena che si deposita — niente scelte, niente pericolo immediato.',
  combat:
    'Registro: epico e sensoriale, non verbale di scontro. Mostra impatto per canali distinti (ferro, fumo, grido, spinta, freddo) — la scena illustrata già mostra il luogo e il soggetto, NON descriverli di nuovo. Mai conteggi di morti/feriti, mai HP, mai stato di gioco: quello è lavoro della UI.',
  harm:
    'Registro: il colpo arriva e basta — una scena, un senso, il taglio netto. La motivazione dell\'opposizione resta quella del contratto.',
  end:
    'Registro: UNA frase densa e poetica che chiude senza riassumere — tiene aperto il mondo, non conta i costi. Mai bilancio, mai morale, mai ' +
    "'la spedizione è finita'" +
    '.',
};

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
    if (en) {
      lines.push(
        `- «...» glossary terms are canonical IT names — render their FUNCTION in English ('the bell wire', 'the hidden stash'), never paste the Italian term.`,
        ``,
      );
    }
    const nodeBlock = nodeContractPromptSection(opts.contract, brief.nodeKey);
    if (nodeBlock) lines.push(nodeBlock, ``);
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
    `{ "title": "≤60 chars", "body": "2-4 sentences ≤400 chars"${brief.outputShape.includes('failHint') ? ', "failHint": "≤80 chars — the danger before the roll"' : ''}${brief.outputShape.includes('option{label,detail}') ? ', "option": {"label": "≤40 chars", "detail": "≤140 chars — stat + cost in words"}' : ''}${brief.outputShape.some((s) => s.startsWith('transit')) ? ', "transit": "≤140 chars"' : ''}${brief.outputShape.some((s) => s.startsWith('verdictFlavor')) ? ', "verdictFlavor": {"win": "≤120", "fail": "≤120", "epicfail": "≤120", "almost": "≤120", "bigwin": "≤120"} — keep EVERY band the draft you revise already has' : ''}${brief.outputShape.some((s) => s.startsWith('outcomeLog')) ? ', "outcomeLog": {"win": "≤140", "bigwin": "≤140"}' : ''} }`,
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
  'mechanical-leak — trait ids, vars, internal ids paraphrased into prose; or option.detail naming a stat the check does NOT test',
  'competition-clarity — the scene/offer does not read as a contest against the rival',
  'prop-as-magic — a named object with no concrete function in the scene',
  'phase-mismatch — the scene narrates content belonging to another phase (e.g. a final check describing the start of the race)',
  'label-indistinction — the option label is interchangeable with a sibling label',
  'grammar — malformed or non-idiomatic language for the target locale',
  'register-drift — high rhetoric, combat-movie tone, melodrama where the voice is sober',
  'lore-invention — facts/lore not entailed by the brief, the contract, or the vocab',
  'unsupported-cost — injuries/costs asserted that the mechanics cannot have produced',
  'outcome-spoiler — an option label/detail reveals what the choice is for, its cost, or its outcome (Director 2026-10-18: options name the gesture, never the payoff)',
  'ending-inconsistency — the text asserts an end-of-quest outcome (camp destroyed, trophy paid/lost, return empty-handed) that contradicts endingFacts or that this node may not claim per endingClaimsAllowed',
  'outcome-entailment — r008: INDEPENDENTLY enumerate every concrete physical-event assertion in each verdictFlavor/attackLines line (cause→effect events like "the branch snaps", "you fall", "the gate breaks" — NOT ambient texture). Then reconcile your enumeration against the line\'s effectBindings one-to-one: an assertion the writer omitted from the sidecar, a binding whose effectId is not entailed by the band\'s canonicalEffects, or a non-entailed claim is a HARD finding — never a soft note',
] as const;

/** Conventions the critic must know before scoring — everything here is
 *  CORRECT by design, never a finding. Without them the reviewer invents
 *  defects (demands internal ids in prose, forbids the authored
 *  «Percezione.» convention in option.detail, reads a check's local
 *  verdict as a missing ending claim). */
const CRITIC_CONVENTIONS = [
  `internal ids ('gob-…', 'CHECK:…', option ids) NEVER appear in prose — their absence is correct, never flag it`,
  `on choice nodes the per-option label/detail live on the TARGET check node's 'option' — a choice copy without 'option' is correct`,
  `option.detail MAY name the tested stat and a gesture («Percezione. Vi abbassate tra le radici.») — stat+gesture is the authored convention, not a mechanical-leak; flag only if it names a DIFFERENT stat than the check tests, or if it explains the check's purpose/cost/outcome`,
  `verdictFlavor narrates THIS scene's local outcome only — it is not required to assert ending facts; flag it only if it asserts an end-of-quest outcome the node's endingClaimsAllowed does not permit`,
  `a check node's title/body without choice mechanics is correct — choices live on the choice nodes`,
];

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
          `- Ending claims THIS node may assert: ${nodeContractFor(opts.contract, brief.nodeKey)?.endingClaimsAllowed.join(' | ') || 'none — it must not claim end-of-quest outcomes'}`,
        ]
      : []),
    ...(opts.usedLabels?.length ? [`SIBLING LABELS ALREADY USED: ${opts.usedLabels.join(' | ')}`] : []),
    ``,
    `DRAFT:`,
    JSON.stringify(draft, null, 2),
    ``,
    `CONVENTIONS — correct by design, never a finding:`,
    ...CRITIC_CONVENTIONS.map((c) => `- ${c}`),
    ``,
    `RUBRIC — report one finding per defect:`,
    ...CRITIC_CLASSES.filter(
      (c) => opts.contract?.competition || !c.startsWith('competition-clarity'),
    ).map((c) => `- ${c}`),
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
    `REGOLE: niente cifre né simboli; trait/stat/id tecnici mai in prosa; nomi propri locale-invarianti restano identici; nomi comuni li italianizzi. Gli anchor sono SOLO riferimento di registro: MAI copiarne una frase nel testo.`,
    `DRAFT INGLESE BLOCCATO:`,
    JSON.stringify(enCopy, null, 2),
    `Rispondi SOLO con JSON valido: le CHIAVI restano identiche all'inglese (questa scena ha: ${brief.outputShape.join(', ')}) — solo i VALORI sono in italiano. Non aggiungere chiavi che il draft inglese non ha: verdictFlavor contiene solo i verdetti (epicfail/fail/almost/win/bigwin), outcomeLog solo win/bigwin.`,
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

/* ------------------------------------------------------------------ */
/* r008 — epistemic prompt builder: framing fields see only           */
/* framingFacts; each outcome line sees only ITS band's verdictFacts.  */
/* ------------------------------------------------------------------ */

const BAND_ORDER = ['epicfail', 'fail', 'almost', 'win', 'bigwin'] as const;

/** The verdict/attack line JSON shape when canonicalEffects exist —
 *  every concrete physical-event assertion needs its effectBinding. */
function lineShapeHint(withEffects: boolean, it: boolean): string {
  if (!withEffects) return '"<testo ≤160>"';
  return it
    ? '{ "text": "<testo ≤160>", "effectBindings": [{"assertion": "asserzione fisica ESATTA dal testo", "effectId": "id effetto canonico di QUESTA banda"}] } — UN binding per OGNI evento fisico concreto asserito; eventi ambientali/atmosferici senza effetto meccanico non ne servono'
    : '{ "text": "≤160", "effectBindings": [{"assertion": "exact physical assertion from text", "effectId": "canonical effect id of THIS band"}] } — one binding per concrete physical event asserted';
}

/** r008 — build the per-node prompt from an epistemic brief.
 *  Differences from `promptForNode`: information partition (framing vs
 *  verdict facts), closed world, action-only options, typed registers,
 *  effectBindings schema, and title locks. */
export function promptForNodeR8(
  brief: SceneBrief,
  vocab: DomainVocab,
  meta: { gimmick: string; mood: string; locale?: CopyLocale },
  opts: NodePromptOpts = {},
): NarrationRequest {
  const it = meta.locale !== 'en';
  const epi = brief.epistemic!;
  const register = REGISTER_BY_KIND[brief.kind] ?? VOICE_RULES;
  const nc = opts.contract ? nodeContractFor(opts.contract, brief.nodeKey) : undefined;

  const lines: string[] = [
    it
      ? `Sei uno scrittore di quest per un RPG dark-fantasy. Scrivi il testo di UNA scena in italiano.`
      : `You are a quest writer for a dark-fantasy RPG. Write ONE scene in English.`,
    ``,
    `WORLD (${vocab.label}): ${vocab.contractPitch}`,
    register,
    ``,
  ];

  if (opts.contract) {
    lines.push(contractPromptSection(opts.contract), ``);
    const worldBlock = worldPromptSection(opts.contract);
    if (worldBlock) lines.push(worldBlock, ``);
    const nodeBlock = nodeContractPromptSection(opts.contract, brief.nodeKey);
    if (nodeBlock) lines.push(nodeBlock, ``);
  }

  /* ---- FRAMING fields: what the player can already see. ---- */
  lines.push(
    it ? `FRAMING FACTS — osservabili PRIMA della scelta/lancio (solo questi in title/body/transit/label):` : `FRAMING FACTS — observable BEFORE the roll:`,
    ...epi.framingFacts.map((f) => `- ${f.text}`),
    ``,
    ...(epi.forbiddenPreRevealTerms.length
      ? [
          it
            ? `PRE-REVEAL BAN — questi termini NON possono apparire in title/body/transit/label (li sblocca solo il verdetto che li rivela):`
            : `PRE-REVEAL BAN — these terms may NOT appear in framing fields:`,
          ...epi.forbiddenPreRevealTerms.map((t) => `- ${t}`),
          ``,
        ]
      : []),
  );

  /* ---- Per-band verdict facts: each line sees only its own band. ---- */
  const bands = BAND_ORDER.filter((b) => epi.verdictFacts?.[b]);
  if (bands.length && brief.kind !== 'combat') {
    lines.push(
      it ? `VERDICT FACTS — ogni riga vede SOLO la sua banda:` : `VERDICT FACTS — each line sees ONLY its own band:`,
    );
    for (const band of bands) {
      const vf = epi.verdictFacts![band]!;
      lines.push(
        `  ${band}:`,
        ...vf.facts.map((f) => `    - fatto: ${f.text}`),
        ...vf.canonicalEffects.map((e) => `    - effetto ${e.id}: ${e.text}`),
        ...(vf.injuryAnchors?.length ? [`    - ancore somatiche obbligatorie: ${vf.injuryAnchors.join(' | ')}`] : []),
      );
    }
    lines.push(``);
  }
  if (brief.kind === 'combat' && nc) {
    lines.push(
      it
        ? `ATTACK LINES — 5 bande (epicfail→bigwin), una per esito: distinte per canale sensoriale, niente conteggi, niente HP — la UI conta i morti.`
        : `ATTACK LINES — one per verdict band, distinct sensory channels, no tallies.`,
    );
    const bands2 = BAND_ORDER.filter((b) => epi.verdictFacts?.[b]);
    for (const band of bands2) {
      const vf = epi.verdictFacts![band]!;
      for (const e of vf.canonicalEffects) lines.push(`  ${band}.${e.id}: ${e.text}`);
    }
    lines.push(``);
  }

  if (epi.endSeeds.length && brief.kind === 'end') {
    lines.push(
      it
        ? `CLOSING LINE — UNA frase (6-20 parole) che chiude in poesia: semi di motivo disponibili: ${epi.endSeeds.join(', ')}. Mai bilancio, mai morale.`
        : `CLOSING LINE — one dense poetic sentence; motif seeds: ${epi.endSeeds.join(', ')}.`,
      ``,
    );
  }

  /* ---- Output shape. ---- */
  const fields: string[] = [];
  if (epi.titleLock) {
    fields.push(`"title": "${epi.titleLock}" (LOCKED — verbatim)`);
  } else {
    fields.push(`"title": "≤60 chars"`);
  }
  fields.push(`"body": "2-4 sentences ≤400 chars"`);
  if (epi.transitExpected) fields.push(`"transit": "≤140 chars"`);
  if (brief.kind === 'check' && epi.recovery !== 'direct') {
    fields.push(`"option": {"label": "2-6 parole — SOLO il gesto fisico, mai lo scopo, la stat, il costo o l'esito"}`);
    if (bands.length) {
      const withEffects = bands.some((b) => (epi.verdictFacts![b]!.canonicalEffects?.length ?? 0) > 0);
      fields.push(
        `"verdictFlavor": { ${bands.map((b) => `"${b}": ${lineShapeHint(withEffects, it)}`).join(', ')} }`,
      );
    }
  }
  if (brief.kind === 'combat') {
    const withEffects = bands.some((b) => (epi.verdictFacts?.[b]?.canonicalEffects?.length ?? 0) > 0);
    fields.push(
      `"attackLines": { ${BAND_ORDER.map((b) => `"${b}": ${lineShapeHint(withEffects, it)}`).join(', ')} }`,
    );
  }
  if (brief.kind === 'end') fields.push(`"closingLine": "≤160 chars — una sola frase"`);

  lines.push(
    `RULES:`,
    it ? `- Italiano, niente cifre né simboli + − = — i numeri li mostra l'UI.` : `- English, no digits or + − = symbols.`,
    `- NEVER cite technical ids or the word "check".`,
    it
      ? `- Le opzioni sono ACTION-ONLY: «Esamina il terreno», «Arrampicati sulla quercia» — MAI stat, scopo, bonus, costo, ricompensa o conseguenza.`
      : `- Options are ACTION-ONLY: the physical gesture, never purpose/stat/cost/outcome.`,
    it
      ? `- La prosa non ripete ciò che l'illustrazione mostra e non conta ciò che la UI conta (morti, HP, oggetti).`
      : `- Never restate what the illustration shows or what the UI counts.`,
    it ? `- Rispondi SOLO con JSON valido:` : `- Respond with VALID JSON only:`,
    `{ ${fields.join(', ')} }`,
  );

  return { brief, prompt: lines.join('\n') };
}

/** r008 — field-scoped revise: rewrite ONLY the named fields, keep the
 *  rest verbatim. Used by the authored-refine driver so a finding on
 *  one line never licenses a rewrite of the whole scene. */
export function promptForFieldRevise(
  basePrompt: string,
  draft: Record<string, unknown>,
  fields: string[],
  findings: { class: string; field: string; detail: string }[],
): string {
  return [
    basePrompt,
    ``,
    `REVISIONE MIRATA — riscrivi SOLO questi campi: ${fields.join(', ')}. Tutto il resto va ripetuto VERBATIM.`,
    `DRAFT CORRENTE:`,
    JSON.stringify(draft, null, 2),
    `FINDINGS:`,
    ...findings.map((f) => `- [${f.class}] ${f.field}: ${f.detail}`),
  ].join('\n');
}
