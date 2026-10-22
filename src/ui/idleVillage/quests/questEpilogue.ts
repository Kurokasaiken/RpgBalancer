/**
 * questEpilogue — the expedition's return report (PLAN-019-S4 T-2).
 *
 * `buildQuestEpilogue` is the pure model the `QuestRunWindow` renders when
 * a run ends: ordered sections, each a list of display lines. Numbers come
 * from the REAL settlement contract (`deriveSettlementPlan` — the same
 * effects the village applies), never a second derivation: the report and
 * the ledger can never disagree.
 *
 * Line sources:
 * - dead/wounded — settlement member effects, named from `run.party`;
 * - consumed — `run.consumablesUsed` flags → catalog items (`labelKey`),
 *   unknown flags shown raw (honest, never dropped);
 * - reward/loot/xp — the settlement's `village-gold`/`village-xp` amounts,
 *   reward vs loot split by the effect key (`reward:`/`loot:`); R-183: when
 *   the plan credits members (`resident-xp`) the xp section lists who got
 *   how much instead of the bare village total;
 * - loot names — `run.loot[]` authored labels;
 * - info — `run.info[]` through `scenario.intelLabels`;
 * - titles/diseases/lore — the scenario's `epilogue` authored seam,
 *   granted by `requiresFlag`/`requiresOutcome` on the terminal run.
 */
import type { QuestRunState } from '@/ui/idleVillage/questS1Lab/questRun';
import type { QuestScenario } from '@/balancing/config/idleVillage/quests/questScenario.schema';
import { QUEST_EPILOGUE, type EpilogueSectionId } from '@/balancing/config/idleVillage/quests/questEpilogue';
import { QUEST_FLAG_TO_ITEM, defaultQuestItems } from '@/balancing/config/idleVillage/quests/questItems';
import { deriveSettlementPlan } from './questSettlement';
import { engineText } from '@/ui/idleVillage/questS1Lab/questEngineText';

/** One display line of the report — i18n key + params, or baked authored
 *  text (names, loot labels, intel, grant labels). */
export interface EpilogueLine {
  /** i18n key (namespace `idleVillage`) — wins over `text` when set. */
  key?: string;
  params?: Record<string, string | number>;
  /** Baked authored text (member names, loot/intel/grant labels). */
  text?: string;
  /** Party member the line refers to — the renderer can attach the
   *  resident's recovery countdown to wounded lines. */
  memberId?: string;
}

/** One rendered section: config id + its non-empty line list. */
export interface EpilogueSection {
  id: EpilogueSectionId;
  lines: EpilogueLine[];
}

/**
 * Build the ordered report for a terminal run. `scenario` is optional —
 * without it the authored seams (intel labels, epilogue grants) resolve to
 * their raw ids or stay empty; the mechanical sections always build.
 */
export function buildQuestEpilogue(
  run: QuestRunState,
  scenario?: QuestScenario,
): EpilogueSection[] {
  /* The settlement's own plan — a `settling`/`settled` run reuses its frozen
   * one, a not-yet-settled run derives the same effects the store will. */
  const plan = run.settlement?.plan ?? deriveSettlementPlan(run);
  const nameOf = (id?: string) =>
    run.party.find((m) => m.id === id)?.name ?? id ?? '?';

  const dead: EpilogueLine[] = [];
  const wounded: EpilogueLine[] = [];
  const reward: EpilogueLine[] = [];
  const loot: EpilogueLine[] = [];
  const xp: EpilogueLine[] = [];
  const memberXp: EpilogueLine[] = [];

  for (const e of plan.effects) {
    switch (e.kind) {
      case 'resident-dead':
        dead.push({ text: nameOf(e.residentId), memberId: e.residentId });
        break;
      case 'resident-wounded':
        wounded.push({ text: nameOf(e.residentId), memberId: e.residentId });
        break;
      case 'village-gold':
        (e.key.startsWith('reward:') ? reward : loot).push({
          key: 'gameFrame.questEpilogue.goldAmount',
          params: { amount: e.amount ?? 0 },
        });
        break;
      case 'village-xp':
        xp.push({ key: 'gameFrame.questEpilogue.xpAmount', params: { amount: e.amount ?? 0 } });
        break;
      case 'resident-xp':
        memberXp.push({
          key: 'gameFrame.questEpilogue.memberXp',
          params: { name: nameOf(e.residentId), amount: e.amount ?? 0 },
          /* no `memberId`: the renderer would append the wound countdown,
           *  which belongs to the «wounded» section only */
        });
        break;
      default:
        break; // loadout-release: bookkeeping, no report line
    }
  }

  const consumed: EpilogueLine[] = (run.consumablesUsed ?? []).map((flag) => {
    const itemId = QUEST_FLAG_TO_ITEM.get(flag);
    const item = itemId ? defaultQuestItems[itemId] : undefined;
    return item ? { key: item.labelKey } : { text: flag };
  });

  /* Loot names are the engine's own ids («goblin trophy»): shown in the content locale (R-234). */
  for (const l of run.loot ?? []) loot.push({ text: engineText(l) });

  const info: EpilogueLine[] = (run.info ?? []).map((i) => ({
    text: scenario?.intelLabels?.[i] ?? i,
  }));

  const grantOk = (g: { requiresFlag?: string; requiresOutcome?: readonly string[] }) =>
    (!g.requiresOutcome || g.requiresOutcome.includes(run.outcome)) &&
    (!g.requiresFlag || run.flags.includes(g.requiresFlag));
  const alive = run.party.filter((m) => !m.dead);
  const recipientsOf = (r?: 'leader' | 'survivors' | 'wounded') => {
    if (r === 'leader') return run.party.filter((m) => m.role === 'leader' && !m.dead);
    if (r === 'survivors') return alive;
    if (r === 'wounded') return alive.filter((m) => m.wounded);
    return undefined;
  };
  /* T-C6: a grant with a recipient becomes one line per person (carrying `memberId`); without
   * one it stays a party line. */
  const grants = (list?: { label: string; recipient?: 'leader' | 'survivors' | 'wounded'; requiresFlag?: string; requiresOutcome?: readonly ('reward' | 'survived' | 'fled' | 'wipe')[] }[]): EpilogueLine[] =>
    (list ?? []).filter(grantOk).flatMap((g) => {
      const people = recipientsOf(g.recipient);
      return people ? people.map((m) => ({ text: g.label, memberId: m.id })) : [{ text: g.label }];
    });

  const sections: Record<EpilogueSectionId, EpilogueLine[]> = {
    dead,
    wounded,
    consumed,
    reward,
    loot,
    xp: memberXp.length > 0 ? memberXp : xp,
    info,
    titles: grants(scenario?.epilogue?.titles),
    diseases: grants(scenario?.epilogue?.diseases),
    lore: grants(scenario?.epilogue?.lore),
  };

  return QUEST_EPILOGUE.sections
    .map((id) => ({ id, lines: sections[id] }))
    .filter((s) => s.lines.length > 0);
}
