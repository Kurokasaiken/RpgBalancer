/**
 * imprintLocale — locale overlays for compiled imprint scenarios (R-168).
 *
 * Imprint scenarios are authored in English (R-135 baseline) as the
 * canonical copy. A locale overlay carries the same presentation fields in
 * another language — a **peer render, not a literal translation**: the
 * contract's rule 7 (every intel states its Meaning in one plain
 * sentence) is what keeps a peer render honest.
 *
 * Design contract (QUEST_GENERATION_CONTRACTS §7):
 * - copy lives in `PRESENTATION_KEYS` — it is excluded from the scenario
 *   content hash, so localizing NEVER invalidates saved runs;
 * - an overlay only touches presentation fields (title/body/transit/
 *   failHint/previewHint/verdictFlavor, option label/detail, CombatSpec
 *   copy fields, intelLabels, epilogue labels, offer objective, scenario
 *   title/flavour/beats). Node ids, option ids, flags, vars, verdicts,
 *   routing — the causal spine — are never translated;
 * - `lockedFacts` declares, per node, the terms that MUST survive the
 *   render (the nine miners, the foreman, the register, drag marks). The
 *   parity test enforces them — this is the same facts-locked discipline
 *   as questNarrate Pass 5, made checkable offline.
 *
 * The overlay format is deliberately regenerable: a future narrate pass
 * (imprint → Pass 5 re-render) can emit this exact shape and replace a
 * hand-authored overlay without touching the engine.
 */

import type {
  QuestNode,
  QuestScenario,
  Verdict,
} from '@/ui/idleVillage/questS1Lab/questScenario';

/** Presentation-only copy for one node, in one locale. */
export interface ImprintNodeOverlay {
  title?: string;
  body?: string;
  transit?: string;
  failHint?: string;
  previewHint?: string;
  verdictFlavor?: Partial<Record<Verdict, string>>;
  /** Option copy, keyed by option id — ids themselves are not translated. */
  options?: Record<string, { label?: string; detail?: string }>;
  /** CombatSpec copy fields (enemyName, lines, cleared/survivors/holding). */
  combat?: {
    enemyName?: string;
    attackLines?: Partial<Record<Verdict, string>>;
    clearedText?: string;
    survivorsText?: string;
    holdingText?: string;
  };
}

/** A full locale overlay for one compiled imprint scenario. */
export interface ImprintLocaleOverlay {
  /** Must match the source scenario id (e.g. 'gen-impr002-miniera'). */
  scenarioId: string;
  locale: 'it';
  /**
   * Facts that must survive the render, per node id: every listed term
   * must appear in that node's rendered `body` (case-insensitive). This
   * is the offline-checkable half of questNarrate's lockedFacts.
   */
  lockedFacts: Record<string, string[]>;
  title?: string;
  flavour?: string;
  objective?: string;
  beats?: string[];
  intelLabels?: Record<string, string>;
  /** Epilogue entries, matched by their `requiresFlag` — never by index. */
  epilogue?: {
    titles?: { flag: string; label: string }[];
    lore?: { flag: string; label: string }[];
  };
  nodes: Record<string, ImprintNodeOverlay>;
}

/**
 * Applies a locale overlay to a scenario, returning a NEW scenario with
 * localized presentation fields. Structural fields (ids, kinds, stats,
 * risks, flags, vars, routing, verdict keys) are never touched.
 *
 * @param scenario the canonical authored scenario (English).
 * @param overlay  the locale overlay to apply.
 * @returns a copy of the scenario with `overlay` copy applied.
 */
export function applyImprintLocale(
  scenario: QuestScenario,
  overlay: ImprintLocaleOverlay,
): QuestScenario {
  if (overlay.scenarioId !== scenario.id) {
    throw new Error(
      `imprintLocale: overlay '${overlay.scenarioId}' cannot apply to scenario '${scenario.id}'`,
    );
  }

  const nodes: Record<string, QuestNode> = {};
  for (const [id, node] of Object.entries(scenario.nodes)) {
    const o = overlay.nodes[id];
    if (!o) {
      nodes[id] = node;
      continue;
    }
    const options = node.options?.map((opt) => {
      const oo = o.options?.[opt.id];
      return oo ? { ...opt, ...(oo.label && { label: oo.label }), ...(oo.detail && { detail: oo.detail }) } : opt;
    });
    const combat = node.combat && o.combat
      ? {
          ...node.combat,
          ...(o.combat.enemyName && { enemyName: o.combat.enemyName }),
          ...(o.combat.attackLines && { attackLines: { ...node.combat.attackLines, ...o.combat.attackLines } }),
          ...(o.combat.clearedText && { clearedText: o.combat.clearedText }),
          ...(o.combat.survivorsText && { survivorsText: o.combat.survivorsText }),
          ...(o.combat.holdingText && { holdingText: o.combat.holdingText }),
        }
      : node.combat;
    nodes[id] = {
      ...node,
      ...(o.title && { title: o.title }),
      ...(o.body && { body: o.body }),
      ...(o.transit && { transit: o.transit }),
      ...(o.failHint && { failHint: o.failHint }),
      ...(o.previewHint && { previewHint: o.previewHint }),
      ...(o.verdictFlavor && { verdictFlavor: { ...node.verdictFlavor, ...o.verdictFlavor } }),
      ...(options && { options }),
      ...(combat && { combat }),
    };
  }

  const epilogue = scenario.epilogue && overlay.epilogue
    ? {
        titles: scenario.epilogue.titles.map((t) => {
          const hit = overlay.epilogue?.titles?.find((e) => e.flag === t.requiresFlag);
          return hit ? { ...t, label: hit.label } : t;
        }),
        lore: scenario.epilogue.lore.map((l) => {
          const hit = overlay.epilogue?.lore?.find((e) => e.flag === l.requiresFlag);
          return hit ? { ...l, label: hit.label } : l;
        }),
      }
    : scenario.epilogue;

  return {
    ...scenario,
    ...(overlay.title && { title: overlay.title }),
    ...(overlay.flavour && { flavour: overlay.flavour }),
    ...(overlay.beats && { beats: overlay.beats }),
    ...(overlay.intelLabels && {
      intelLabels: { ...scenario.intelLabels, ...overlay.intelLabels },
    }),
    ...(epilogue && { epilogue }),
    ...(overlay.objective && scenario.offer && {
      offer: { ...scenario.offer, objective: overlay.objective },
    }),
    nodes,
  };
}
