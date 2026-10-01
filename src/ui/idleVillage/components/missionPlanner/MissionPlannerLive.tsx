/**
 * MissionPlannerLive — the Planner wired to the real engine.
 *
 * Reads the quest blueprint, the quest slot blueprints, the canonical roster
 * and the quest item catalog from config, runs the draft through
 * `MissionPlannerProvider` (MP-04 → MP-01 engine) and hands the derived
 * `PlannerView` to the pure `MissionPlannerPanel`. Nothing shown is authored
 * in this file.
 */
import React, { useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { DEFAULT_IDLE_VILLAGE_CONFIG } from '@/balancing/config/idleVillage/defaultConfig';
import { defaultQuestBlueprints } from '@/balancing/config/idleVillage/quests/questBlueprints';
import { defaultQuestItems } from '@/balancing/config/idleVillage/quests/questItems';
import { QUEST_EQUIP_SLOTS, type QuestEquipSlot } from '@/balancing/config/idleVillage/quests/questItems.schema';
import { buildMissionPhaseSpecs, serializeOutcome } from '@/engine/game/idleVillage/missionPlannerEngine';
import type { PlannerLiveState } from '@/engine/game/idleVillage/missionPlannerDraft';
import type { MissionPreviewResult } from '@/engine/game/idleVillage/missionPlannerMath';
import type { ResidentState } from '@/engine/game/idleVillage/TimeEngine';
import { MissionPlannerProvider, useMissionPlannerDraft } from '@/ui/idleVillage/hooks/useMissionPlannerDraft';
import { canonicalResidentData } from '@/ui/idleVillage/roster/CanonicalRosterBundle';
import type { ResidentSlotBlueprint } from '@/ui/idleVillage/slots/types';
import { DEFAULT_MISSION_PLANNER_UI_CONFIG } from '@/ui/idleVillage/config/missionPlannerUiConfig';
import { MissionPlannerPanel, type PlannerRosterEntry } from '../MissionPlannerPanel';
import { buildPlannerView } from './plannerViewModel';

/** Props of {@link MissionPlannerLive}. */
export interface MissionPlannerLiveProps {
  /** Quest blueprint / activity id to plan. */
  questId: string;
  /** Called with the validated launch payload. */
  onLaunch?: (payload: unknown) => void;
}

const initialsOf = (name: string): string =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');

/** Keeps the preview shown before the last change, to draw per-stage and per-member deltas. */
function usePreviousPreview(preview: MissionPreviewResult | null): MissionPreviewResult | null {
  const ref = useRef<{ key: string; current: MissionPreviewResult | null; previous: MissionPreviewResult | null }>({
    key: '',
    current: null,
    previous: null,
  });
  const key = preview ? serializeOutcome(preview) : 'none';
  if (key !== ref.current.key) {
    ref.current = { key, previous: ref.current.key === '' ? null : ref.current.current, current: preview };
  }
  return ref.current.previous;
}

function PlannerBody({
  slotBlueprints,
  live,
  questId,
  onLaunch,
}: {
  slotBlueprints: readonly ResidentSlotBlueprint[];
  live: PlannerLiveState;
  questId: string;
  onLaunch?: (payload: unknown) => void;
}): JSX.Element {
  const { t } = useTranslation('idleVillage');
  const ctx = useMissionPlannerDraft();
  const [targetSlotId, setTargetSlotId] = useState<string | undefined>(undefined);
  const previous = usePreviousPreview(ctx.preview);
  const blueprint = defaultQuestBlueprints[questId];

  const view = useMemo(
    () =>
      buildPlannerView({
        blueprint,
        slotBlueprints,
        draft: ctx.draft,
        preview: ctx.preview,
        previous,
        missionInput: ctx.input,
        residentsById: live.residentsById,
        itemCatalog: live.itemCatalog,
        equipSlots: QUEST_EQUIP_SLOTS,
        invalidatedResidentIds: ctx.invalidatedResidentIds,
        whyLinesPerMetric: DEFAULT_MISSION_PLANNER_UI_CONFIG.whyLinesPerMetric,
        translate: (k) => t(k),
      }),
    [blueprint, slotBlueprints, ctx.draft, ctx.preview, ctx.input, previous, live, ctx.invalidatedResidentIds, t],
  );

  const assigned = new Set(Object.values(ctx.draft.assignments));
  const roster: PlannerRosterEntry[] = Object.values(live.residentsById)
    .filter((r): r is ResidentState => !!r && !assigned.has(r.id) && r.status !== 'dead')
    .map((r) => ({
      id: r.id,
      name: r.displayName,
      initials: initialsOf(r.displayName),
      portraitUrl: (r as ResidentState & { portraitUrl?: string }).portraitUrl,
      isHero: r.isHero,
    }));

  const provisions = Object.values(live.itemCatalog)
    .filter((i) => i.kind === 'consumable')
    .map((item) => ({ item, stock: item.qty ?? 0, selected: ctx.draft.consumables[item.id] ?? 0 }));

  const pickResident = (residentId: string): void => {
    const slot = targetSlotId ?? slotBlueprints.find((s) => !ctx.draft.assignments[s.id])?.id;
    if (!slot) return;
    ctx.assignResident(slot, residentId);
    setTargetSlotId(undefined);
  };

  const cycleItem = (residentId: string, slot: QuestEquipSlot): void => {
    const options = Object.values(live.itemCatalog).filter((i) => i.kind === 'equipment' && i.slot === slot);
    const current = ctx.draft.loadouts[residentId]?.[slot];
    const idx = options.findIndex((o) => o.id === current);
    const next = idx + 1 < options.length ? options[idx + 1]?.id : undefined;
    ctx.setLoadoutItem(residentId, slot, next);
  };

  const blockers = [...new Set(ctx.issues.map((i) => t(`missionPlanner.issue.${i.reason}`)))];

  return (
    <MissionPlannerPanel
      view={view}
      roster={roster}
      provisions={provisions}
      targetSlotId={targetSlotId}
      canEmbark={ctx.canEmbark}
      canUndo={ctx.canUndo}
      canReset={ctx.canReset}
      blockers={blockers}
      onTargetSlot={setTargetSlotId}
      onPickResident={pickResident}
      onRemove={ctx.removeMember}
      onCycleItem={cycleItem}
      onProvision={ctx.setConsumableQty}
      onUndo={ctx.undo}
      onReset={ctx.reset}
      onLaunch={() => {
        const result = ctx.buildLaunchPayload();
        onLaunch?.(result);
      }}
    />
  );
}

/**
 * Planner for one quest, fed by config and the canonical roster.
 * @param props - Quest id and launch sink
 */
export function MissionPlannerLive({ questId, onLaunch }: MissionPlannerLiveProps): JSX.Element | null {
  const blueprint = defaultQuestBlueprints[questId];
  const activity = DEFAULT_IDLE_VILLAGE_CONFIG.activities[questId];
  const slotBlueprints = useMemo(
    () => ((activity?.metadata?.slotBlueprints as ResidentSlotBlueprint[] | undefined) ?? []),
    [activity],
  );
  const phases = useMemo(() => (blueprint ? buildMissionPhaseSpecs(blueprint) : []), [blueprint]);
  const live = useMemo<PlannerLiveState>(() => {
    const residents = canonicalResidentData();
    return {
      residentsById: Object.fromEntries(residents.map((r) => [r.id, r])),
      slots: slotBlueprints.map((s) => ({
        id: s.id,
        required: s.required,
        emptyPenalty: s.emptyPenalty,
        residentRiskModifiers: s.residentRiskModifiers,
      })),
      itemCatalog: defaultQuestItems,
    };
  }, [slotBlueprints]);

  if (!blueprint) return null;

  return (
    <MissionPlannerProvider live={live} phases={phases} questId={questId}>
      <PlannerBody slotBlueprints={slotBlueprints} live={live} questId={questId} onLaunch={onLaunch} />
    </MissionPlannerProvider>
  );
}

export default MissionPlannerLive;
