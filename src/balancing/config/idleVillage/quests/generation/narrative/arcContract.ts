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
