/**
 * Mission Planner view model — pure adapter from the engine preview to what the
 * Planner draws. No number here is authored: every value is read from the
 * engine output (`MissionPreviewResult`), the draft, the live roster, the quest
 * blueprint, the slot blueprints or the item catalog.
 */
import {
  memberPhaseRisk,
  type MissionContribution,
  type MissionPlannerInput,
  type MissionPreviewResult,
} from '@/engine/game/idleVillage/missionPlannerMath';
import type { QuestOutcomeTier } from '@/engine/game/idleVillage/questMilestones';
import type { MissionPlannerDraft } from '@/engine/game/idleVillage/missionPlannerDraft';
import type { ResidentState } from '@/engine/game/idleVillage/TimeEngine';
import type { QuestBlueprint } from '@/balancing/config/idleVillage/quests/questBlueprints.schema';
import type { QuestItem, QuestEquipSlot } from '@/balancing/config/idleVillage/quests/questItems.schema';
import type { ResidentSlotBlueprint } from '@/ui/idleVillage/slots/types';
import {
  DEFAULT_QUEST_TIME_SCALE,
  questPhaseDurationMs,
  type QuestTimeScale,
} from '@/balancing/config/idleVillage/quests/questTimeScale';

/** A probability (0-100) with the value shown before the last change. */
export interface PlannerMetric {
  value: number;
  previous?: number;
  higherIsBetter: boolean;
}

/** What a slot modifier acts on. */
export type PlannerModifierKind = 'death' | 'injury';

/** A modifier owned by a slot (pp delta; negative = safer). */
export interface PlannerSlotModifier {
  id: string;
  kind: PlannerModifierKind;
  value: number;
}

/** One equipment socket of a member. */
export interface PlannerSocket {
  slot: QuestEquipSlot;
  item?: QuestItem;
}

/** A drafted member with its own risk. */
export interface PlannerMemberView {
  residentId: string;
  name: string;
  initials: string;
  portraitUrl?: string;
  isHero: boolean;
  death: PlannerMetric;
  injury: PlannerMetric;
  unscathed: number;
  sockets: PlannerSocket[];
  invalid: boolean;
}

/** A quest slot: its role, its own modifiers, its empty cost, its occupant. */
export interface PlannerSlotView {
  id: string;
  label: string;
  role?: string;
  required: boolean;
  requirementLabel?: string;
  modifiers: PlannerSlotModifier[];
  emptyPenalty: PlannerSlotModifier[];
  member?: PlannerMemberView;
}

/** A min–max band of effective risk across the drafted company, in pp. */
export interface PlannerRiskRange {
  min: number;
  max: number;
}

/** One stage of the route — the phase-level preview, distinct from quest totals. */
export interface PlannerPhaseView {
  id: string;
  icon?: string;
  title: string;
  type: string;
  threatLabel?: string;
  hours: number;
  /** P(pass | the company reaches this phase) — conditional, not cumulative. */
  passChance: PlannerMetric;
  baseInjury: number;
  baseDeath: number;
  /** P(at least one member alive after this phase). */
  surviveThrough: number;
  /**
   * Effective per-member injury/death risk in this phase (pp, min–max over the
   * drafted company at full strength). Null when nobody is drafted.
   */
  memberInjury: PlannerRiskRange | null;
  memberDeath: PlannerRiskRange | null;
  /** Dominant tier if the company retreats right after this phase, conditional on reaching it. */
  retreat: { tier: QuestOutcomeTier; chance: number } | null;
}

/** One cause → effect line. */
export interface PlannerWhyLine {
  id: string;
  /** Who/what causes it (resident id, item id, slot id, …). */
  source: MissionContribution['source'];
  sourceLabel: string;
  subjectLabel?: string;
  /** Signed effect: pp for risks, stat points for success. */
  delta: number;
  unit: 'pp' | 'stat' | 'mult' | 'units';
}

/** Lines grouped by the metric they explain. */
export interface PlannerWhyGroup {
  metric: MissionContribution['metric'];
  lines: PlannerWhyLine[];
}

/** Everything the Planner renders. */
export interface PlannerView {
  quest: { id: string; name: string; icon?: string; narrative?: string };
  success: PlannerMetric;
  anyDeath: PlannerMetric;
  anyInjury: PlannerMetric;
  expectedDeaths: number;
  hours: number;
  previousHours?: number;
  rewardMult: number;
  phases: PlannerPhaseView[];
  slots: PlannerSlotView[];
  why: PlannerWhyGroup[];
  hasPreview: boolean;
}

/** Inputs of {@link buildPlannerView}. */
export interface PlannerViewInput {
  blueprint: QuestBlueprint;
  slotBlueprints: readonly ResidentSlotBlueprint[];
  draft: MissionPlannerDraft;
  preview: MissionPreviewResult | null;
  previous: MissionPreviewResult | null;
  /** Resolved engine input (member/phase specs) — null when the draft is invalid. */
  missionInput: MissionPlannerInput | null;
  residentsById: Readonly<Record<string, ResidentState | undefined>>;
  itemCatalog: Readonly<Record<string, QuestItem>>;
  equipSlots: readonly QuestEquipSlot[];
  invalidatedResidentIds: readonly string[];
  /** Max WHY lines kept per metric (UI density knob, from config). */
  whyLinesPerMetric: number;
  timeScale?: QuestTimeScale;
  /** Resolves an item label key. */
  translate: (key: string) => string;
}

const pct = (p: number | undefined): number | undefined => (p === undefined ? undefined : p * 100);

const metric = (value: number, previous: number | undefined, higherIsBetter: boolean): PlannerMetric => ({
  value: value * 100,
  previous: pct(previous),
  higherIsBetter,
});

const initialsOf = (name: string): string =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');

/**
 * Aggregates engine contributions into readable WHY lines.
 *
 * Risk contributions repeat once per phase with the same per-roll value, so
 * they are merged by (source, sourceId base, member) keeping the per-roll pp;
 * success contributions keep one line per member and tested stat.
 */
function buildWhy(input: PlannerViewInput, preview: MissionPreviewResult): PlannerWhyGroup[] {
  const { residentsById, itemCatalog, blueprint, slotBlueprints, translate, whyLinesPerMetric } = input;
  const phaseTitle = new Map(blueprint.phases.map((p) => [p.id, p.title]));
  const residentName = (id?: string): string | undefined =>
    id ? residentsById[id]?.displayName ?? id : undefined;
  const itemLabel = (id: string): string => {
    const item = itemCatalog[id];
    return item ? `${item.icon ?? ''} ${translate(item.labelKey)}`.trim() : id;
  };

  const merged = new Map<string, PlannerWhyLine & { metric: MissionContribution['metric'] }>();
  for (const c of preview.contributions) {
    if (c.source === 'phase' || c.source === 'clamp') continue;
    let key: string;
    let sourceLabel: string;
    let subjectLabel: string | undefined = residentName(c.residentId);
    let unit: PlannerWhyLine['unit'] = c.metric === 'success' ? 'stat' : 'pp';

    switch (c.source) {
      case 'stat': {
        const [phaseId, tag] = c.sourceId.split(':');
        key = `${c.metric}|stat|${c.residentId}|${tag}`;
        sourceLabel = tag;
        subjectLabel = residentName(c.residentId);
        void phaseId;
        break;
      }
      case 'slot': {
        const idx = Number(c.sourceId.replace('slot-', ''));
        const bp = slotBlueprints[idx];
        key = `${c.metric}|slot|${c.residentId}`;
        sourceLabel = bp?.label ?? c.sourceId;
        break;
      }
      case 'emptyPenalty':
        key = `${c.metric}|empty`;
        sourceLabel = 'emptySlots';
        subjectLabel = undefined;
        break;
      case 'cover':
        key = `${c.metric}|cover|${c.providerId}`;
        sourceLabel = residentName(c.providerId) ?? '';
        subjectLabel = undefined;
        break;
      case 'consumable': {
        const itemId = c.sourceId.includes(':') ? c.sourceId.split(':')[1] : c.sourceId;
        key = `${c.metric}|consumable|${itemId}`;
        sourceLabel = itemLabel(itemId);
        subjectLabel = undefined;
        if (c.metric === 'reward') unit = 'mult';
        break;
      }
      case 'equipment':
        key = `${c.metric}|equipment|${c.sourceId}`;
        sourceLabel = itemLabel(c.sourceId);
        subjectLabel = undefined;
        unit = c.metric === 'reward' ? 'mult' : c.metric === 'duration' ? (Math.abs(c.delta) < 1 ? 'mult' : 'units') : unit;
        break;
      default:
        key = `${c.metric}|${c.source}|${c.sourceId}`;
        sourceLabel = c.sourceId;
    }
    if (!merged.has(key)) {
      merged.set(key, { id: key, metric: c.metric, source: c.source, sourceLabel, subjectLabel, delta: c.delta, unit });
    }
    void phaseTitle;
  }

  const order: MissionContribution['metric'][] = ['success', 'injury', 'death', 'duration', 'reward'];
  return order
    .map((m) => ({
      metric: m,
      lines: [...merged.values()]
        .filter((l) => l.metric === m)
        .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))
        .slice(0, whyLinesPerMetric)
        .map(({ metric: _m, ...line }) => line),
    }))
    .filter((g) => g.lines.length > 0);
}

/**
 * Builds the Planner view from the engine preview and the live context.
 * @param input - Draft, preview (current and previous), roster, config
 * @returns The fully derived view
 */
export function buildPlannerView(input: PlannerViewInput): PlannerView {
  const { blueprint, slotBlueprints, draft, preview, previous, residentsById, itemCatalog, equipSlots, missionInput } = input;
  const scale = input.timeScale ?? DEFAULT_QUEST_TIME_SCALE;
  const toHours = (ms: number): number => ms / scale.msPerHour;

  const prevMember = new Map((previous?.members ?? []).map((m) => [m.residentId, m]));
  const currMember = new Map((preview?.members ?? []).map((m) => [m.residentId, m]));
  const prevPhase = new Map((previous?.phases ?? []).map((p) => [p.phaseId, p]));
  const currPhase = new Map((preview?.phases ?? []).map((p) => [p.phaseId, p]));

  const slots: PlannerSlotView[] = slotBlueprints.map((bp, index) => {
    const residentId = draft.assignments[bp.id];
    const resident = residentId ? residentsById[residentId] : undefined;
    const modifiers: PlannerSlotModifier[] = [];
    if (bp.residentRiskModifiers?.deathChanceDelta) {
      modifiers.push({ id: `${bp.id}-d`, kind: 'death', value: bp.residentRiskModifiers.deathChanceDelta });
    }
    if (bp.residentRiskModifiers?.injuryChanceDelta) {
      modifiers.push({ id: `${bp.id}-i`, kind: 'injury', value: bp.residentRiskModifiers.injuryChanceDelta });
    }
    const emptyPenalty: PlannerSlotModifier[] = [];
    if (bp.emptyPenalty?.extraDeathChance) {
      emptyPenalty.push({ id: `${bp.id}-ed`, kind: 'death', value: bp.emptyPenalty.extraDeathChance });
    }
    if (bp.emptyPenalty?.extraInjuryChance) {
      emptyPenalty.push({ id: `${bp.id}-ei`, kind: 'injury', value: bp.emptyPenalty.extraInjuryChance });
    }

    let member: PlannerMemberView | undefined;
    if (residentId) {
      const m = currMember.get(residentId);
      const pm = prevMember.get(residentId);
      const loadout = draft.loadouts[residentId] ?? {};
      const name = resident?.displayName ?? residentId;
      member = {
        residentId,
        name,
        initials: initialsOf(name),
        portraitUrl: (resident as (ResidentState & { portraitUrl?: string }) | undefined)?.portraitUrl,
        isHero: resident?.isHero ?? false,
        death: metric(m?.deathChance ?? 0, pm?.deathChance, false),
        injury: metric(m?.injuryChance ?? 0, pm?.injuryChance, false),
        unscathed: (m?.unscathedChance ?? 0) * 100,
        sockets: equipSlots.map((slot) => ({ slot, item: loadout[slot] ? itemCatalog[loadout[slot] as string] : undefined })),
        invalid: input.invalidatedResidentIds.includes(residentId) || !resident,
      };
    }
    void index;
    return {
      id: bp.id,
      label: bp.label ?? bp.id,
      role: bp.role,
      required: bp.required ?? false,
      requirementLabel: bp.requirementLabel ?? bp.requirement?.label,
      modifiers,
      emptyPenalty,
      member,
    };
  });

  const allAliveMask = missionInput && missionInput.members.length > 0
    ? (1 << missionInput.members.length) - 1
    : 0;

  const phases: PlannerPhaseView[] = blueprint.phases.map((phase, index) => {
    const cp = currPhase.get(phase.id);
    const pp = prevPhase.get(phase.id);
    const spec = missionInput?.phases[index];

    let memberInjury: PlannerRiskRange | null = null;
    let memberDeath: PlannerRiskRange | null = null;
    if (missionInput && spec && missionInput.members.length > 0) {
      let injMin = Infinity;
      let injMax = -Infinity;
      let dthMin = Infinity;
      let dthMax = -Infinity;
      for (let i = 0; i < missionInput.members.length; i += 1) {
        const risk = memberPhaseRisk(
          missionInput.members,
          i,
          spec,
          allAliveMask,
          missionInput.consumables,
          missionInput.emptySlotPenalty,
        );
        injMin = Math.min(injMin, risk.injury);
        injMax = Math.max(injMax, risk.injury);
        dthMin = Math.min(dthMin, risk.death);
        dthMax = Math.max(dthMax, risk.death);
      }
      memberInjury = { min: injMin * 100, max: injMax * 100 };
      memberDeath = { min: dthMin * 100, max: dthMax * 100 };
    }

    let retreat: PlannerPhaseView['retreat'] = null;
    if (cp?.retreatTiers) {
      const dominant = (Object.entries(cp.retreatTiers) as Array<[QuestOutcomeTier, number]>).reduce(
        (best, [tier, p]) => (p > best[1] ? [tier, p] : best),
      );
      if (dominant[1] > 0) retreat = { tier: dominant[0], chance: dominant[1] * 100 };
    }

    return {
      id: phase.id,
      icon: phase.icon,
      title: phase.title,
      type: phase.type,
      threatLabel: phase.riskProfile?.threatLabel,
      hours: toHours(questPhaseDurationMs(phase, scale)),
      passChance: metric(cp?.passChance ?? 0, pp?.passChance, true),
      baseInjury: phase.riskProfile?.injuryChance ?? 0,
      baseDeath: phase.riskProfile?.deathChance ?? 0,
      surviveThrough: (cp?.surviveThrough ?? 0) * 100,
      memberInjury,
      memberDeath,
      retreat,
    };
  });

  return {
    quest: { id: blueprint.id, name: blueprint.name, icon: blueprint.icon, narrative: blueprint.narrative },
    success: metric(preview?.questSuccess ?? 0, previous?.questSuccess, true),
    anyDeath: metric(preview?.aggregate.anyDeath ?? 0, previous?.aggregate.anyDeath, false),
    anyInjury: metric(preview?.aggregate.anyInjury ?? 0, previous?.aggregate.anyInjury, false),
    expectedDeaths: preview?.aggregate.expectedDeaths ?? 0,
    hours: toHours(preview?.duration ?? 0),
    previousHours: previous ? toHours(previous.duration) : undefined,
    rewardMult: preview?.expectedRewardMultiplier ?? 0,
    phases,
    slots,
    why: preview ? buildWhy(input, preview) : [],
    hasPreview: preview !== null && slots.some((s) => s.member),
  };
}
