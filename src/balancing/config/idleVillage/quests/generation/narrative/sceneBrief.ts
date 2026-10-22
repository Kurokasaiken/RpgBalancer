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
  VerdictSchemaType,
} from '@/balancing/config/idleVillage/quests/questScenario.schema';
import type { DomainVocab } from '../domainVocabs';
import type { QuestArcContract } from './arcContract';

/* ------------------------------------------------------------------ */
/* r008 — epistemic partition: facts observable BEFORE choosing/rolling */
/* vs facts authorized for a specific outcome band.                    */
/* ------------------------------------------------------------------ */

/** One canonical physical event an outcome band may assert. */
export interface CanonicalEffect {
  id: string;
  text: string;
}

/** The information one verdict band is allowed to reveal — passed ONLY
 *  to the corresponding verdict/attack line, never to framing fields. */
export interface VerdictFacts {
  /** Facts this band may assert (post-resolution only). */
  facts: { id: string; text: string }[];
  /** Terms that THIS band's reveal unlocks — banned pre-roll. */
  revealTerms: string[];
  /** Canonical physical events of THIS band — the only concrete event
   *  assertions allowed, bound via effectBindings. */
  canonicalEffects: CanonicalEffect[];
  /** Somatic anchors for a mechanically-paid epicfail (at least one
   *  must appear when the band pays damage). */
  injuryAnchors?: string[];
}

/** r008 — the closed-world + information-partition contract attached
 *  to a brief. `framingFacts` go to title/body/transit/option.label;
 *  `verdictFacts` go only to the matching outcome band. */
export interface EpistemicBlock {
  /** Facts observable before choosing or rolling. */
  framingFacts: { id: string; text: string }[];
  /** Outcome-partitioned facts — one entry per verdict band. */
  verdictFacts?: Partial<Record<VerdictSchemaType, VerdictFacts>>;
  /** Closed-world description (one line) + content inventories. */
  world?: {
    closedWorld: string;
    allowedEntities: string[];
    canonicalTerms: Record<string, string>;
    endSeeds: string[];
    texture?: Partial<Record<'sound' | 'smell' | 'light' | 'touch', string[]>>;
  };
  /** Proper/entity names allowed in prose (case-insensitive). */
  allowedEntities: string[];
  /** Terms banned in framing fields until a band reveals them. */
  forbiddenPreRevealTerms: string[];
  /** Setting terms banned everywhere (closed world). */
  bannedSettingTerms: string[];
  /** Motif seeds reserved for the closing line. */
  endSeeds: string[];
  /** Enemy nouns the UI-tally detector scans for. */
  enemyNouns?: string[];
  /** A contract-locked title — injected, never generated. */
  titleLock?: string;
  /** `direct` recovery: no choice, no check — option/check copy
   *  generation is forbidden on this node. */
  recovery?: 'direct';
  /** Whether the brief expects a `transit` field. */
  transitExpected?: boolean;
}

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
  /** Loot granted on EVERY verdict row — a reward the check cannot
   *  take away. Copy must never present it as check-dependent. */
  guaranteedRewards?: string[];
  /** r008 — epistemic partition + closed-world contract. When present,
   *  prompts must partition facts by field and the validator runs the
   *  r008 hard checks (validateNodeCopyR8). */
  epistemic?: EpistemicBlock;
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

/** takeLoot ids granted by EVERY verdict row — rewards a check cannot
 *  withdraw. Empty when outcomes genuinely differ (or no table). */
function guaranteedTakeLoot(node: QuestNode): string[] {
  const rows = Object.values(node.verdictTable ?? {}).filter((r) => r?.takeLoot?.length);
  const allRows = Object.values(node.verdictTable ?? {}).filter(Boolean);
  if (!rows.length || rows.length !== allRows.length) return [];
  const first = new Set(rows[0]!.takeLoot);
  return [...first].filter((item) => rows.every((r) => r!.takeLoot!.includes(item)));
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
    if (node.upfrontDamage) {
      facts.push(
        `pedaggio deterministico a prescindere dal dado: danno ${node.upfrontDamage.amount}${node.upfrontDamage.epicfailAmount ? ` (${node.upfrontDamage.epicfailAmount} su epicfail)` : ''} — la scena PUÒ nominare sangue/fatica certi, non sono unsupported-cost`,
      );
    }
    if (node.risky) facts.push('marcato RISKY (scelta apertamente pericolosa)');
    if (node.transit) facts.push('è un nodo di passaggio/hub — il testo deve reggere visite ripetute');

    const vLines = verdictLines(node);
    if (vLines.length) facts.push(`verdetti: ${vLines.join(' | ')}`);

    /* Reward granted on every verdict = guaranteed: the check prices
     * the physical cost, never possession. Declared as a fact so the
     * model cannot frame the prize as at-risk (sicuro/varco bug). */
    const guaranteed = guaranteedTakeLoot(node);
    if (guaranteed.length) {
      facts.push(
        `premio garantito su OGNI verdetto: ${guaranteed.join(', ')} — il check determina il costo fisico, MAI la perdita del premio`,
      );
    }

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
      /* r008/Director 2026-10-18: la chiusa è poetica e tagliente, non
       * un bilancio — la UI già mostra costo e bottino. */
      mustConvey.push('tono di chiusura: una frase densa e poetica che tiene aperto il mondo — MAI un bilancio di costi, bottino o morale');
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
      guaranteedRewards: guaranteed.length ? guaranteed : undefined,
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

/* ------------------------------------------------------------------ */
/* r008 — attachEpistemic: project the arc contract's closed world +    */
/* per-node contracts onto the briefs, then promote path-unlocked      */
/* facts into successors' framingFacts.                                */
/* ------------------------------------------------------------------ */

/** Node ids that flow INTO `targetId` — direct routing only
 *  (`option.next`, `verdictTable.*.goto`, plain `next` on info/harm). */
function inboundSources(scenario: QuestScenario, targetId: string): { nodeId: string; band?: VerdictSchemaType }[] {
  const out: { nodeId: string; band?: VerdictSchemaType }[] = [];
  for (const node of Object.values(scenario.nodes)) {
    for (const opt of node.options ?? []) {
      const next = opt.next.startsWith('CHECK:') ? opt.next.slice(6) : opt.next;
      if (next === targetId) out.push({ nodeId: node.id });
    }
    for (const [band, row] of Object.entries(node.verdictTable ?? {})) {
      if (row?.goto === targetId) out.push({ nodeId: node.id, band: band as VerdictSchemaType });
    }
    if (node.next === targetId) out.push({ nodeId: node.id });
  }
  return out;
}

/** Facts a verdict row unlocks (`setInfo`) — promotable to successors
 *  only when EVERY inbound route grants them. */
function promotedFacts(scenario: QuestScenario, targetId: string): { id: string; text: string }[] {
  const inbound = inboundSources(scenario, targetId);
  if (!inbound.length) return [];
  /* Facts granted by every parent check on every band that reaches the
   * target — plus every plain routing edge counts as 'no unlock'. */
  const granted = new Map<string, number>();
  let routes = 0;
  for (const src of inbound) {
    const node = scenario.nodes[src.nodeId];
    const table = node?.verdictTable ?? {};
    const relevantRows = src.band
      ? [table[src.band]].filter(Boolean)
      : Object.values(table).filter(Boolean);
    if (!relevantRows.length) {
      routes += 1; /* plain option edge — no facts */
      continue;
    }
    for (const row of relevantRows) {
      routes += 1;
      for (const info of row!.setInfo ?? []) {
        granted.set(info, (granted.get(info) ?? 0) + 1);
      }
    }
  }
  return [...granted.entries()]
    .filter(([, n]) => n === routes && routes > 0)
    .map(([id]) => ({ id, text: `sbloccato su ogni percorso entrante: '${id}'` }));
}

/** r008 — attach the epistemic partition to a compiled brief set.
 *  The contract's `world` block becomes the closed world; each
 *  `nodeContracts[]` entry contributes revealTerms / canonicalEffects /
 *  injuryAnchors / titleLock / recovery. Facts unlocked on EVERY
 *  inbound route are promoted into framingFacts. */
export function attachEpistemic(
  briefs: SceneBrief[],
  contract: QuestArcContract,
  scenario: QuestScenario,
): SceneBrief[] {
  const world = contract.world;
  const byNode = new Map((contract.nodeContracts ?? []).map((n) => [n.node, n]));
  return briefs.map((b) => {
    const nc = byNode.get(b.nodeKey);
    const node = scenario.nodes[b.nodeId];

    /* Per-band verdict facts: the band SET comes from the contract's
     * `verdictEffects` keys UNION the scenario's own verdictTable —
     * authored scenarios may carry no table at all (verdictFlavor only,
     * engine-side routing), and the contract is then the only source
     * of which bands exist. */
    const verdictFacts: EpistemicBlock['verdictFacts'] = {};
    const bands = [
      ...new Set([
        ...(Object.keys(node?.verdictTable ?? {}).filter((k) => k !== 'else') as VerdictSchemaType[]),
        ...(Object.keys(nc?.verdictEffects ?? {}) as VerdictSchemaType[]),
      ]),
    ];
    for (const band of bands) {
      const declared = nc?.verdictEffects?.[band];
      const row = node?.verdictTable?.[band];
      verdictFacts[band] = {
        facts: declared?.facts ?? [],
        revealTerms: declared?.revealTerms ?? [],
        canonicalEffects: declared?.canonicalEffects ?? [],
        injuryAnchors:
          declared?.injuryAnchors ??
          (band === 'epicfail' && (row?.damage || node?.upfrontDamage?.epicfailAmount)
            ? ['ferit*', 'sangu*', 'dolore', 'cadut*']
            : undefined),
      };
    }

    const forbiddenPreReveal = [
      ...new Set(
        Object.values(verdictFacts).flatMap((v) => v?.revealTerms ?? []),
      ),
    ];

    const framingFacts: { id: string; text: string }[] = [
      ...(nc?.framingFacts ?? []),
      ...promotedFacts(scenario, b.nodeId),
    ];

    const epistemic: EpistemicBlock = {
      framingFacts,
      verdictFacts: bands.length ? verdictFacts : undefined,
      world: world
        ? {
            closedWorld: world.closedWorld,
            allowedEntities: world.allowedEntities,
            canonicalTerms: world.canonicalTerms,
            endSeeds: world.endSeeds,
            texture: world.texture,
          }
        : undefined,
      allowedEntities: world?.allowedEntities ?? [],
      forbiddenPreRevealTerms: forbiddenPreReveal,
      bannedSettingTerms: world?.bannedSettingTerms ?? [],
      endSeeds: world?.endSeeds ?? [],
      enemyNouns: world?.enemyNouns,
      titleLock: nc?.titleLock,
      recovery: nc?.recovery,
      transitExpected: node?.transit !== undefined,
    };
    return { ...b, epistemic };
  });
}
