/**
 * sceneBrief — the NarrativeBrief compiler (PLAN-026 T4 / P3, contracts
 * §7). For every node of an emitted QuestScenario it distills the
 * MECHANICAL truth into a compact brief the provider must narrate
 * around — facts it cannot contradict, things it must convey, a
 * whitelist of what it may invent, and the domain bans.
 *
 * Facts come from the scenario's own data (kind, stats, risk, gating,
 * verdict effects) — never from the kit's existing copy: a narrated kit
 * replaces the copy, not the mechanics.
 */

import type {
  QuestNodeSchemaType as QuestNode,
  QuestScenario,
} from '@/balancing/config/idleVillage/quests/questScenario.schema';
import type { DomainVocab } from '../domainVocabs';

/** One node's narration contract — what the provider sees and must obey. */
export interface SceneBrief {
  /** Node key = id minus the kit prefix (the kit's `copy` map key). */
  nodeKey: string;
  nodeId: string;
  kind: QuestNode['kind'];
  beat: number;
  /** Mechanical facts the text must NOT contradict. */
  facts: string[];
  /** What the text MUST convey (checked by the validator). */
  mustConvey: string[];
  /** Whitelisted domain imagery — the model picks from these. */
  mayInvent: string[];
  /** Banned imagery — deterministic validation fails on a hit. */
  forbidden: string[];
  /** The JSON shape the provider must fill for THIS node. */
  outputShape: string[];
}

const RISK_LABEL = (w?: number, d?: number) => {
  const parts: string[] = [];
  if (w) parts.push(`ferita ~${w}%`);
  if (d) parts.push(`morte ~${d}%`);
  return parts.length ? parts.join(', ') : 'nessuna conseguenza fisica diretta';
};

/** Human-readable summary of one verdict row's mechanical effects —
 *  the facts a flavor line must not contradict. */
function describeOutcome(row: NonNullable<QuestNode['verdictTable']>[string]): string {
  const out: string[] = [];
  if (row.takeLoot?.length) out.push(`prende ${row.takeLoot.join(', ')}`);
  if (row.dropLoot?.length) out.push(`perde ${row.dropLoot.length} oggetto/i`);
  if (row.damage) out.push(`danno ${row.damage}`);
  if (row.vars?.length) {
    out.push(
      row.vars
        .map((v) => `${v.var} ${v.op === 'inc' ? '+' : v.op === 'dec' ? '−' : '='}${v.value}`)
        .join(', '),
    );
  }
  if (row.setObjective) out.push(`obiettivo → ${row.setObjective}`);
  if (row.setFlags?.length) out.push(`flag ${row.setFlags.join(', ')}`);
  if (row.rollFlag) out.push(`può attivare '${row.rollFlag.flag}' (${row.rollFlag.chance}%)`);
  if (row.goldDelta) out.push(`oro ${row.goldDelta > 0 ? '+' : ''}${row.goldDelta}`);
  if (row.setInfo?.length) out.push(`rivela '${row.setInfo.join(', ')}'`);
  if (row.goto) out.push(`→ prosegue`);
  return out.length ? out.join('; ') : 'transizione semplice';
}

/** Compact verdict map for the brief — one line per verdict. */
function verdictLines(node: QuestNode): string[] {
  const table = node.verdictTable;
  if (!table) return [];
  return (Object.keys(table) as (keyof typeof table)[])
    .filter((k) => k !== 'else' && table[k])
    .map((k) => `${k}: ${describeOutcome(table[k]!)}`);
}

/** Compile the per-node narration contract from an emitted scenario. */
export function briefsForScenario(
  scenario: QuestScenario,
  vocab: DomainVocab,
  prefix: string,
): SceneBrief[] {
  const mayInvent = [
    ...vocab.creatureAmmissibili.map((c) => `creatura: ${c}`),
    ...vocab.ruoli.autoritaContratto.map((r) => `autorità: ${r}`),
    ...vocab.ruoli.stakeholderEconomico.map((r) => `stakeholder: ${r}`),
    ...vocab.ruoli.testimoneComune.map((r) => `testimone: ${r}`),
    ...vocab.luoghi.map((l) => `luogo: ${l}`),
    ...vocab.props.map((p) => `prop: ${p}`),
    ...vocab.cicli.map((c) => `ciclo: ${c}`),
    ...vocab.pericoliAmbientali.map((p) => `pericolo: ${p}`),
    ...vocab.tracceAmmissibili.map((t) => `traccia: ${t}`),
  ];

  const briefs: SceneBrief[] = [];
  for (const node of Object.values(scenario.nodes)) {
    const nodeKey = node.id.replace(`${prefix}-`, '');
    const facts: string[] = [];
    const mustConvey: string[] = [];

    facts.push(`nodo ${node.kind}${node.kind === 'check' ? ` — check su ${node.stats?.join('+') ?? '?'}` : ''}`);
    if (node.risk) facts.push(`rischio dichiarato: ${RISK_LABEL(node.risk.wound, node.risk.death)}`);
    if (node.risky) facts.push('marcato RISKY (scelta apertamente pericolosa)');
    if (node.transit) facts.push('è un nodo di passaggio/hub — il testo deve reggere visite ripetute');

    const vLines = verdictLines(node);
    if (vLines.length) facts.push(`verdetti: ${vLines.join(' | ')}`);

    for (const opt of node.options ?? []) {
      const gates: string[] = [];
      if (opt.requiresTrait) gates.push(`trait '${opt.requiresTrait}'`);
      if (opt.requiresInfo) gates.push(`info '${opt.requiresInfo}'`);
      if (opt.requiresFlag) gates.push(`flag '${opt.requiresFlag}'`);
      if (opt.hiddenIfFlag) gates.push(`nascosta se flag '${opt.hiddenIfFlag}'`);
      const target = opt.next.startsWith('CHECK:') ? `check '${opt.next.slice(6)}'` : `'${opt.next}'`;
      facts.push(`opzione '${opt.id}' → ${target}${gates.length ? ` [gate: ${gates.join(', ')}]` : ''}`);
    }

    if (node.kind === 'choice' && node.options?.length) {
      mustConvey.push('ogni opzione deve dichiarare il proprio costo/rischio — il giocatore legge i numeri, il testo spiega il perché');
    }
    if (node.kind === 'check') {
      mustConvey.push('il pericolo dichiarato nel failHint deve essere percepibile PRIMA del lancio');
    }
    if (node.options?.some((o) => o.requiresTrait || o.requiresFlag)) {
      mustConvey.push('le opzioni condizionali NON devono essere anticipate/spoilerate nel testo dei nodi precedenti');
    }
    if (node.kind === 'end') {
      mustConvey.push('tono di chiusura: il bilancio di chi è sceso — costo e bottino, non morale');
    }

    briefs.push({
      nodeKey,
      nodeId: node.id,
      kind: node.kind,
      beat: node.beat ?? 0,
      facts,
      mustConvey,
      mayInvent,
      forbidden: vocab.vietati,
      outputShape: outputShapeFor(node),
    });
  }
  return briefs.sort((a, b) => a.beat - b.beat || a.nodeKey.localeCompare(b.nodeKey));
}

/** The JSON fields a node needs — mirrors `FloodNodeCopy`/`RaceNodeCopy`. */
function outputShapeFor(node: QuestNode): string[] {
  const shape = ['title', 'body'];
  if (node.transit !== undefined) shape.push('transit');
  if (node.kind === 'check') {
    shape.push('failHint');
    /* Option labels/details live on the TARGET check's copy — a choice
     * node presents `CHECK:<id>` options via the check's own `option`
     * (same pattern in both skeletons). */
    shape.push('option{label,detail}');
    if (node.verdictFlavor !== undefined) shape.push('verdictFlavor{epicfail?,fail?,almost?,win?,bigwin?}');
    if (Object.values(node.verdictTable ?? {}).some((r) => r?.log !== undefined)) {
      shape.push('outcomeLog{win?,bigwin?}');
    }
  }
  return shape;
}
