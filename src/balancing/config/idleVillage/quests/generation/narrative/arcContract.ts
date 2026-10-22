/**
 * arcContract — PLAN-027 Pass 0: the per-kit arc contract.
 *
 * One frontier call (or one human-authored file) fixes WHAT the quest is
 * before any scene is written: the competition framing, the opposition,
 * what each phase is FOR, what every named prop DOES in the story, and
 * which facts an ending may assert. Node prompts receive this contract
 * verbatim — a node can no longer contradict the arc because the arc is
 * declared, reviewable, and stored in the artifact's provenance.
 *
 * The contract is human-approvable: `--contract <file>` lets the
 * Director hand one in; otherwise the driver generates it, validates the
 * schema, and embeds it in the emitted kit.
 */

import { z } from 'zod';
import type { DomainVocab } from '../domainVocabs';
import type { SceneBrief } from './sceneBrief';

/** One phase of the arc: which node keys it covers and what it is for. */
export const ArcPhaseSchema = z
  .object({
    nodes: z.array(z.string().min(1)).min(1),
    /** What this phase does narratively — not 'what happens', 'what it is for'. */
    role: z.string().min(1).max(200),
  })
  .strict();

/** A named prop's concrete story function — answers «che senso ha?». */
export const PropGlossSchema = z
  .object({
    term: z.string().min(1).max(60),
    /** What the thing IS and what it DOES in this quest — concrete,
     *  never symbolic. 'A shift ledger whose entries prove where each
     *  miner was' not 'a mysterious register'. */
    meaning: z.string().min(1).max(200),
  })
  .strict();

/** r008 — a fact with a stable id (framing or verdict-partitioned). */
export const ContractFactSchema = z
  .object({ id: z.string().min(1).max(60), text: z.string().min(1).max(240) })
  .strict();

/** r008 — what ONE verdict band may reveal and assert. These facts and
 *  terms are passed ONLY to the matching band's line — never to
 *  framing fields. */
export const VerdictEffectsSchema = z
  .object({
    /** Facts this band may assert. */
    facts: z.array(ContractFactSchema).default([]),
    /** Terms this band's reveal unlocks — banned in framing fields. */
    revealTerms: z.array(z.string().min(1).max(60)).default([]),
    /** The ONLY concrete physical events this band's line may assert —
     *  every such assertion must bind one of these ids. */
    canonicalEffects: z
      .array(z.object({ id: z.string().min(1).max(60), text: z.string().min(1).max(200) }).strict())
      .default([]),
    /** Somatic anchors for a mechanically-paid epicfail. */
    injuryAnchors: z.array(z.string().min(1).max(40)).optional(),
  })
  .strict();

/** r008 — the closed world: every noun the prose may use lives here,
 *  nothing else exists. */
export const WorldContractSchema = z
  .object({
    /** One line: what the world IS (used verbatim in prompts). */
    closedWorld: z.string().min(1).max(400),
    /** Every entity/proper noun the prose may name. */
    allowedEntities: z.array(z.string().min(1).max(60)).min(1),
    /** Canonical surface term for each contract noun — the ONLY allowed
     *  rendering of that referent. */
    canonicalTerms: z.record(z.string(), z.string().min(1).max(60)),
    /** Motif seeds reserved for the closing line. */
    endSeeds: z.array(z.string().min(1).max(40)).default([]),
    /** Setting terms banned everywhere — revocations (guado, strada…). */
    bannedSettingTerms: z.array(z.string().min(1).max(60)).default([]),
    /** Sensory texture pools — the only permitted imagery channels. */
    texture: z
      .object({
        sound: z.array(z.string().min(1).max(60)).optional(),
        smell: z.array(z.string().min(1).max(60)).optional(),
        light: z.array(z.string().min(1).max(60)).optional(),
        touch: z.array(z.string().min(1).max(60)).optional(),
      })
      .strict()
      .optional(),
    /** Enemy nouns the UI-tally detector scans for. */
    enemyNouns: z.array(z.string().min(1).max(40)).optional(),
  })
  .strict();
export type WorldContract = z.infer<typeof WorldContractSchema>;

/** Per-node contract v2 (PLAN-027, ChatGPT critique 2026-10-11): what
 *  THIS node must change/say — stated against any possible entry state,
 *  never presuming a single previous node (routes are alternative). */
export const NodeContractSchema = z
  .object({
    node: z.string().min(1),
    /** What changes in the situation after this node — a delta, not a
     *  restatement of the quest goal. Must hold whichever route the
     *  player took to get here. */
    narrativeDelta: z.string().min(1).max(240),
    /** What the opposition concretely DOES in or around this node —
     *  varied per node, not the same method restated. Empty string when
     *  the rival does not act here. */
    rivalAction: z.string().max(240),
    /** What recurring motifs (props/signals) DO in this scene — their
     *  function, not an obligation to cite them all. Empty string when
     *  none carry narrative weight here. */
    motifFunction: z.string().max(240),
    /** Effects/outcomes this node's copy may claim — only what the
     *  scene brief's mechanics actually pay. */
    mechanicalClaims: z.array(z.string().min(1).max(140)).max(6),
    /** Ending facts this node may anticipate — a subset of endingFacts.
     *  Empty for mid-arc nodes: they must not foreshadow the ending. */
    endingClaimsAllowed: z.array(z.string().min(1).max(140)).max(4),
    /* ---- r008 extensions (optional — legacy contracts keep working) ---- */
    /** Facts observable before choosing/rolling — framing fields only. */
    framingFacts: z.array(ContractFactSchema).optional(),
    /** Per-band reveal/effects partition (epicfail/fail/almost/win/bigwin). */
    verdictEffects: z.record(z.string(), VerdictEffectsSchema).optional(),
    /** A contract-locked title — injected into copy, never generated. */
    titleLock: z.string().min(1).max(60).optional(),
    /** `direct` recovery: no choice, no check — the node IS the reward. */
    recovery: z.literal('direct').optional(),
  })
  .strict();
export type NodeContract = z.infer<typeof NodeContractSchema>;

/** The arc contract — Pass 0 output, human-approvable, provenance-embedded. */
export const QuestArcContractSchema = z
  .object({
    /** One or two sentences: what this quest IS. */
    arcSummary: z.string().min(1).max(400),
    /** How the opposition is framed — for the race: that this is a
     *  contest against a rival, what they compete over, who wins what.
     *  Empty string for gimmicks with no direct opponent. */
    competition: z.string().max(300),
    /** The named opposition the scenes may reference consistently. */
    opposition: z
      .object({ name: z.string().min(1).max(40), role: z.string().min(1).max(160) })
      .strict(),
    /** Phase map — every brief nodeKey must appear in exactly one phase. */
    phases: z.array(ArcPhaseSchema).min(1),
    /** Concrete gloss for every prop/noun the copy may lean on. */
    propGlossary: z.array(PropGlossSchema).min(1),
    /** What the endings may assert — facts a run can actually have
     *  produced. An ending must not claim costs/injuries the run may
     *  not have paid. */
    endingFacts: z
      .object({
        win: z.array(z.string().min(1).max(200)),
        lose: z.array(z.string().min(1).max(200)),
      })
      .strict(),
    /** Locale-invariant facts: names, prize identity, who holds what —
     *  the EN draft and the IT re-render must agree on all of these. */
    lockedFacts: z.array(z.string().min(1).max(200)).min(1),
    /** Contract v2 — per-node deltas/actions/claims. Optional for
     *  backward compat with r001 artifacts; when present every brief
     *  nodeKey must be covered exactly once. */
    nodeContracts: z.array(NodeContractSchema).optional(),
    /** r008 — the closed world. Optional for legacy contracts; when
     *  present it activates the epistemic brief partition + the r008
     *  gate checks (attachEpistemic / validateNodeCopyR8). */
    world: WorldContractSchema.optional(),
  })
  .strict();
export type QuestArcContract = z.infer<typeof QuestArcContractSchema>;

/** Structural validation beyond the schema: every node key covered by
 *  exactly one phase — a node outside the arc map is a node nobody
 *  planned. */
export function contractIssues(
  contract: QuestArcContract,
  briefs: SceneBrief[],
): string[] {
  const issues: string[] = [];
  const seen = new Map<string, number>();
  for (const phase of contract.phases) {
    for (const n of phase.nodes) seen.set(n, (seen.get(n) ?? 0) + 1);
  }
  for (const b of briefs) {
    const count = seen.get(b.nodeKey) ?? 0;
    if (count === 0) issues.push(`nodo '${b.nodeKey}' non coperto da alcuna fase del contratto`);
    else if (count > 1) issues.push(`nodo '${b.nodeKey}' coperto da ${count} fasi`);
  }
  for (const n of seen.keys()) {
    if (!briefs.some((b) => b.nodeKey === n)) issues.push(`fase cita nodo '${n}' inesistente nel grafo`);
  }
  if (contract.nodeContracts) {
    const nc = new Map<string, number>();
    for (const c of contract.nodeContracts) nc.set(c.node, (nc.get(c.node) ?? 0) + 1);
    for (const b of briefs) {
      const count = nc.get(b.nodeKey) ?? 0;
      if (count === 0) issues.push(`nodo '${b.nodeKey}' senza nodeContract (delta narrativo mancante)`);
      else if (count > 1) issues.push(`nodo '${b.nodeKey}' ha ${count} nodeContract`);
    }
    for (const n of nc.keys()) {
      if (!briefs.some((b) => b.nodeKey === n)) issues.push(`nodeContract cita nodo '${n}' inesistente`);
    }
  }
  return issues;
}

/** The role a contract assigns to one node — injected into its prompt. */
export function contractRoleFor(contract: QuestArcContract, nodeKey: string): string | undefined {
  return contract.phases.find((p) => p.nodes.includes(nodeKey))?.role;
}

/** The per-node contract entry (v2) for one node, if authored. */
export function nodeContractFor(contract: QuestArcContract, nodeKey: string): NodeContract | undefined {
  return contract.nodeContracts?.find((c) => c.node === nodeKey);
}

/** Render the per-node v2 block — what THIS scene must change and may claim. */
export function nodeContractPromptSection(contract: QuestArcContract, nodeKey: string): string | undefined {
  const nc = nodeContractFor(contract, nodeKey);
  if (!nc) return undefined;
  return [
    `NODE CONTRACT — what this scene must DO (not what it may repeat):`,
    `- Narrative delta (what changes here — state it, never restate the goal): ${nc.narrativeDelta}`,
    ...(nc.rivalAction ? [`- Rival action (what the opposition does here — do not re-explain their method): ${nc.rivalAction}`] : []),
    ...(nc.motifFunction ? [`- Motif function (what recurring signals DO here — cite only if they serve this function): ${nc.motifFunction}`] : []),
    ...(nc.mechanicalClaims.length
      ? [`- Mechanical claims allowed (only what outcomes actually pay):`, ...nc.mechanicalClaims.map((m) => `  · ${m}`)]
      : []),
    ...(nc.endingClaimsAllowed.length
      ? [`- Ending claims this scene may anticipate:`, ...nc.endingClaimsAllowed.map((m) => `  · ${m}`)]
      : []),
  ].join('\n');
}

/** Render the contract as the prompt section every node sees. */
export function contractPromptSection(contract: QuestArcContract): string {
  return [
    `ARC CONTRACT (decided before you — do not contradict):`,
    `- Arc: ${contract.arcSummary}`,
    ...(contract.competition ? [`- Competition: ${contract.competition}`] : []),
    `- Opposition: ${contract.opposition.name} — ${contract.opposition.role}`,
    `- Your node's role in the arc: see SCENA below`,
    `PROP GLOSSARY — what these things concretely ARE (use them with this meaning, never as unexplained artefacts):`,
    ...contract.propGlossary.map((p) => `- «${p.term}»: ${p.meaning}`),
    `FACTS AN ENDING MAY ASSERT (only these — nothing else):`,
    `- win: ${contract.endingFacts.win.join(' | ')}`,
    `- lose: ${contract.endingFacts.lose.join(' | ')}`,
    `LOCKED FACTS (invariant across languages — never restate differently):`,
    ...contract.lockedFacts.map((f) => `- ${f}`),
  ].join('\n');
}

/** Pass 0 prompt — one frontier call emits the whole contract. Written
 *  in English (the structural language of the pipeline). */
export function promptForArcContract(
  vocab: DomainVocab,
  briefs: SceneBrief[],
  meta: { gimmick: string; mood: string; oppositionHint?: string },
): string {
  const nodeList = briefs.map((b) => `${b.nodeKey} [${b.kind}, beat ${b.beat}]`).join(', ');
  return [
    `You are the narrative architect of a dark-fantasy RPG quest. Before any scene is written, produce the ARC CONTRACT for this kit — the single document every scene writer will obey.`,
    ``,
    `WORLD (${vocab.label}): ${vocab.contractPitch}`,
    `STRUCTURAL GIMMICK: ${meta.gimmick}`,
    `TONE: ${meta.mood}`,
    `COHERENCE RULES OF THE DOMAIN:`,
    ...vocab.coerenza.map((c) => `- ${c}`),
    `AVAILABLE PROPS (give each one a CONCRETE story function — if a prop has no clear function, do not put it in the glossary):`,
    ...vocab.props.map((p) => `- ${p}`),
    ...(meta.oppositionHint ? [`OPPOSITION HINT: ${meta.oppositionHint}`] : []),
    ``,
    `NODES TO COVER (every one must appear in exactly one phase): ${nodeList}`,
    ``,
    `Answer ONLY with valid JSON:`,
    `{`,
    ` "arcSummary": "what this quest is, 1-2 sentences",`,
    ` "competition": "who competes against whom, over what, what winning means — empty string if no direct opponent",`,
    ` "opposition": {"name": "≤40 chars", "role": "their role in the story ≤160"} ,`,
    ` "phases": [{"nodes": ["nodeKey", ...], "role": "what this phase is FOR narratively"}],`,
    ` "propGlossary": [{"term": "prop name", "meaning": "what it IS and DOES concretely"}],`,
    ` "endingFacts": {"win": ["facts the victorious ending may assert"], "lose": ["facts the losing ending may assert"]},`,
    ` "lockedFacts": ["locale-invariant facts: prize identity, who holds what, names"],`,
    ` "nodeContracts": [{`,
    `   "node": "nodeKey — one entry per node",`,
    `   "narrativeDelta": "what CHANGES in the situation here — must hold whichever route brought the player, never restate the quest goal",`,
    `   "rivalAction": "what the opposition concretely does here (varied per node — never the same method restated; empty string if absent)",`,
    `   "motifFunction": "what recurring props/signals DO in this scene (their function — not an obligation to cite them)",`,
    `   "mechanicalClaims": ["effects this node may claim — only what the mechanical outcomes actually pay"],`,
    `   "endingClaimsAllowed": ["subset of endingFacts this node may anticipate — empty for mid-arc nodes"]`,
    ` }]`,
    `}`,
    ``,
    `Rules: endingFacts must be facts a run can actually produce — never 'you lost a hand' unless a mechanism causes it. Prop meanings must be mundane and concrete. nodeContracts: exactly one entry per nodeKey; narrativeDelta must describe a change relative to ANY possible entry state (routes are alternative — never assume a specific previous node); rival actions must differ across nodes (gain / misdirection / limitation — not 'listens to the bell' every time); a reward the player is guaranteed must NEVER appear in mechanicalClaims as check-dependent.`,
  ].join('\n');
}

/* ------------------------------------------------------------------ */
/* r008 — contract lint: the contract's own vocabularies must be       */
/* internally disjoint before any copy is generated.                   */
/* ------------------------------------------------------------------ */

/** Mechanical lexemes that must never appear as allowedEntities — an
 *  entity named 'bottino' would defeat the option-mechanical-leak ban. */
const LINT_MECHANICAL_LEXEMES = [
  'bonus', 'malus', 'rischio', 'costo', 'penalità', 'vantaggio', 'gratis', 'allerta', 'allarme',
  'probabilità', 'turno', 'check', 'tiro', 'carico', 'bottino', 'trofeo', 'sicuro', 'facile',
  'difficile', 'migliore', 'peggiore', 'premio', 'ricompensa',
];
/** Closer lexicon — an entity that reads as the quest tally must not be
 *  a naming primitive either. */
const LINT_CLOSER_LEXEMES = ['spedizione', 'ricompensa', 'bilancio', 'conto', 'morale', 'lezione', 'vedette'];

const norm = (s: string) => s.trim().toLowerCase().replace(/\*$/, '');
const stemOverlap = (a: string, b: string) => {
  const x = norm(a);
  const y = norm(b);
  return x === y || x.startsWith(`${y}`) || y.startsWith(`${x}`);
};

/** Deterministic contract lint — hard failures BEFORE generation:
 *  allowedEntities must not intersect bannedSettingTerms, the option-
 *  mechanical lexicon, or the closer lexicon (r008 WITNESS fixes:
 *  'bottino'/'vedette' in the inventory silently defeat the bans). */
export function contractLintIssues(contract: QuestArcContract): string[] {
  const issues: string[] = [];
  const world = contract.world;
  if (!world) return issues;
  for (const entity of world.allowedEntities) {
    const banned = world.bannedSettingTerms.find((t) => stemOverlap(entity, t));
    if (banned) {
      issues.push(`allowedEntities '${entity}' collide col bannedSettingTerms '${banned}'`);
    }
    const mech = LINT_MECHANICAL_LEXEMES.find((t) => stemOverlap(entity, t));
    if (mech) {
      issues.push(`allowedEntities '${entity}' collide col lessico meccanico '${mech}' — la label ban perderebbe il senso`);
    }
    const closer = LINT_CLOSER_LEXEMES.find((t) => stemOverlap(entity, t));
    if (closer) {
      issues.push(`allowedEntities '${entity}' collide col lessico di chiusura '${closer}'`);
    }
  }
  /* Canonical terms must map to allowed entities — a term for nothing
   * is an invention vector. */
  for (const [key, term] of Object.entries(world.canonicalTerms)) {
    if (!world.allowedEntities.some((e) => stemOverlap(e, key) || stemOverlap(e, term))) {
      issues.push(`canonicalTerms '${key}'→'${term}' non copre alcun allowedEntity`);
    }
    const banned = world.bannedSettingTerms.find((t) => stemOverlap(term, t));
    if (banned) {
      issues.push(`canonicalTerms '${term}' coincide col termine vietato '${banned}'`);
    }
  }
  /* endSeeds must not be banned either — the closer needs them legal. */
  for (const seed of world.endSeeds) {
    const banned = world.bannedSettingTerms.find((t) => stemOverlap(seed, t));
    if (banned) issues.push(`endSeeds '${seed}' coincide col termine vietato '${banned}'`);
  }
  return issues;
}

/** r008 — closed-world prompt section: every noun the prose may use
 *  lives in this inventory, nothing else exists. */
export function worldPromptSection(contract: QuestArcContract): string {
  const w = contract.world;
  if (!w) return '';
  return [
    `CLOSED WORLD — ${w.closedWorld}`,
    `ALLOWED ENTITIES (the ONLY nouns/proper names the prose may use — anything else is an invention):`,
    ...w.allowedEntities.map((e) => `- ${e}`),
    `CANONICAL TERMS — the ONLY permitted rendering of each referent:`,
    ...Object.entries(w.canonicalTerms).map(([k, v]) => `- ${k} → «${v}»`),
    ...(w.endSeeds.length ? [`MOTIF SEEDS (reserved for the closing line): ${w.endSeeds.join(', ')}`] : []),
    ...(w.bannedSettingTerms.length
      ? [`BANNED SETTING TERMS (never appear anywhere — revoked by the Director): ${w.bannedSettingTerms.join(', ')}`]
      : []),
    ...(w.texture
      ? [
          `TEXTURE POOLS (the only sensory imagery channels):`,
          ...(Object.entries(w.texture) as [string, string[]][]).map(
            ([ch, items]) => `- ${ch}: ${items.join(', ')}`,
          ),
        ]
      : []),
  ].join('\n');
}
