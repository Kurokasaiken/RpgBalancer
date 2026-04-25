import type {
  IdleVillageConfig,
  QuestBlueprint,
  QuestPhaseResult,
  QuestState,
} from '@/balancing/config/idleVillage/types';
import type { QuestChroniclePhase } from '@/ui/idleVillage/components/QuestChronicle';

/**
 * Returns the first quest blueprint that references the provided activityId.
 *
 * @param config - Idle Village configuration containing quest blueprints.
 * @param activityId - Activity identifier to search for.
 */
export function findQuestBlueprintForActivity(
  config: Pick<IdleVillageConfig, 'questBlueprints'> | null | undefined,
  activityId?: string | null,
): QuestBlueprint | null {
  if (!config?.questBlueprints || !activityId) return null;
  return (
    Object.values(config.questBlueprints).find((blueprint) => blueprint.activityId === activityId) ?? null
  );
}

/**
 * Builds QuestChronicle phase descriptors by merging blueprint data with quest state.
 *
 * @param params.blueprint - Declarative quest blueprint.
 * @param params.questState - Optional runtime quest state tracked on scheduled activities.
 */
export function buildQuestChroniclePhases(params: {
  blueprint: QuestBlueprint;
  questState?: QuestState | null;
}): { phases: QuestChroniclePhase[]; activeIndex: number } {
  const { blueprint, questState } = params;
  const totalPhases = blueprint.phases.length;
  const activeIndex =
    questState && questState.currentPhaseIndex >= 0 && questState.currentPhaseIndex < totalPhases
      ? questState.currentPhaseIndex
      : 0;

  const resultByPhase: Record<string, QuestPhaseResult> = {};
  questState?.phaseResults.forEach((entry) => {
    resultByPhase[entry.phaseId] = entry;
  });

  const phases: QuestChroniclePhase[] = blueprint.phases.map((phase, index) => {
    const recordedResult = resultByPhase[phase.id];
    let state: QuestChroniclePhase['state'] = 'locked';
    if (recordedResult) {
      state = recordedResult.result === 'success' ? 'success' : 'failure';
    } else if (index === activeIndex && (!questState || questState.status === 'in_progress')) {
      state = 'active';
    } else if (questState && index < activeIndex) {
      state = questState.status === 'failed' ? 'failure' : 'success';
    }
    return {
      phase,
      state,
      result: recordedResult,
    };
  });

  return {
    phases,
    activeIndex,
  };
}

/**
 * Creates a default quest state pointing at the first phase.
 *
 * @param blueprint - Target quest blueprint.
 */
export function createInitialQuestState(blueprint: QuestBlueprint): QuestState {
  return {
    blueprintId: blueprint.id,
    currentPhaseIndex: 0,
    status: 'in_progress',
    phaseResults: [],
  };
}

/**
 * Applies the outcome of the current quest phase, advancing or failing the quest.
 *
 * @param params.state - Current quest state snapshot.
 * @param params.blueprint - Blueprint definition for reference.
 * @param params.result - Result emitted by the resolving module.
 */
export function applyPhaseResult(params: {
  state: QuestState;
  blueprint: QuestBlueprint;
  result: QuestPhaseResult['result'];
}): QuestState {
  const { state, blueprint, result } = params;
  const currentPhase = blueprint.phases[state.currentPhaseIndex];
  if (!currentPhase) return state;

  const nextPhaseResults = state.phaseResults.filter((entry) => entry.phaseId !== currentPhase.id);
  nextPhaseResults.push({
    phaseId: currentPhase.id,
    result,
    timestamp: Date.now(),
  });

  const isLastPhase = state.currentPhaseIndex >= blueprint.phases.length - 1;
  const nextStatus =
    result === 'success'
      ? isLastPhase
        ? 'completed'
        : 'in_progress'
      : 'failed';

  const nextPhaseIndex =
    result === 'success' && !isLastPhase ? state.currentPhaseIndex + 1 : state.currentPhaseIndex;

  return {
    ...state,
    currentPhaseIndex: nextPhaseIndex,
    status: nextStatus,
    phaseResults: nextPhaseResults,
  };
}

/**
 * Rolls back quest progress by one phase for sandbox/debug controls.
 *
 * @param params.state - Current quest state snapshot.
 * @param params.blueprint - Blueprint definition for reference.
 */
export function revertPhase(params: { state: QuestState; blueprint: QuestBlueprint }): QuestState {
  const { state, blueprint } = params;
  if (state.currentPhaseIndex <= 0 && state.phaseResults.length === 0) {
    return createInitialQuestState(blueprint);
  }

  const previousIndex = Math.max(0, state.currentPhaseIndex - 1);
  const previousPhase = blueprint.phases[previousIndex];
  const filteredResults = state.phaseResults.filter((entry) => entry.phaseId !== previousPhase?.id);

  return {
    ...state,
    currentPhaseIndex: previousIndex,
    status: 'in_progress',
    phaseResults: filteredResults,
  };
}
