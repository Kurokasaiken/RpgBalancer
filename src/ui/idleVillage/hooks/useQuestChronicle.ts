import { useMemo } from 'react';
import type {
  ActivityDefinition,
  IdleVillageConfig,
  QuestBlueprint,
  QuestPhase,
  QuestPhaseType,
  QuestState,
} from '@/balancing/config/idleVillage/types';
import type { QuestChroniclePhase } from '@/ui/idleVillage/components/QuestChronicle';
import { buildQuestChroniclePhases, findQuestBlueprintForActivity } from '@/ui/idleVillage/questChronicleHelpers';

/**
 * High-level view model returned by {@link useQuestChronicle}.
 */
export interface QuestChronicleViewModel {
  title: string;
  summary?: string;
  icon?: string;
  chronicle: {
    phases: QuestChroniclePhase[];
    activeIndex: number;
  };
  blueprint: QuestBlueprint | null;
  /**
   * Indicates whether the chronicle is sourced from a real blueprint or a simple fallback phase.
   */
  source: 'blueprint' | 'fallback';
}

/**
 * Parameters accepted by {@link useQuestChronicle}.
 */
export interface UseQuestChronicleParams {
  config: IdleVillageConfig | null | undefined;
  questActivity?: ActivityDefinition | null;
  questState?: QuestState | null;
}

/**
 * Hook that locates the quest blueprint for the provided activity and returns
 * a UI-ready chronicle descriptor. Falls back to a single-phase chronicle when
 * no blueprint is available so the UI can still render useful information.
 */
export function useQuestChronicle({
  config,
  questActivity,
  questState,
}: UseQuestChronicleParams): QuestChronicleViewModel | null {
  return useMemo(() => {
    if (!questActivity) {
      return null;
    }

    const blueprint = findQuestBlueprintForActivity(config ?? null, questActivity.id);
    if (blueprint) {
      const chronicle = buildQuestChroniclePhases({ blueprint, questState });
      return {
        title: blueprint.name,
        summary: blueprint.narrative,
        icon: blueprint.icon,
        chronicle,
        blueprint,
        source: 'blueprint',
      };
    }

    const fallbackPhase = createFallbackPhase(questActivity);
    return {
      title: questActivity.label ?? questActivity.id,
      summary: typeof questActivity.description === 'string' ? questActivity.description : undefined,
      icon: fallbackPhase.icon,
      blueprint: null,
      chronicle: {
        phases: [
          {
            phase: fallbackPhase,
            state: deriveFallbackPhaseState(questState),
          },
        ],
        activeIndex: 0,
      },
      source: 'fallback',
    };
  }, [config, questActivity, questState]);
}

/**
 * Builds a synthetic quest phase using the metadata found on the activity definition.
 */
function createFallbackPhase(activity: ActivityDefinition): QuestPhase {
  const derivedType = deriveFallbackPhaseType(activity);
  const inferredIcon =
    (activity.metadata as { icon?: string } | undefined)?.icon ?? pickDefaultIconForType(derivedType);
  const phaseTitle = activity.label ?? activity.id;
  const baseSummary =
    typeof activity.description === 'string'
      ? activity.description
      : 'Fase generata automaticamente dalla definizione attività.';

  return {
    id: `${activity.id}_fallback_phase`,
    title: phaseTitle,
    type: derivedType,
    durationValue: 1,
    durationUnits: 'hours',
    icon: inferredIcon,
    copy: {
      summary: baseSummary,
      narrative: baseSummary,
      callToAction: `Monitora ${phaseTitle}`,
    },
    telemetryTags: ['fallback_phase'],
    riskProfile: {
      injuryChance: derivedType === 'fight' ? 35 : 10,
      deathChance: derivedType === 'fight' ? 5 : 0,
    },
  };
}

/**
 * Keeps the fallback chronicle aligned with quest status when available.
 */
function deriveFallbackPhaseState(questState?: QuestState | null): QuestChroniclePhase['state'] {
  if (!questState || questState.status === 'in_progress' || questState.status === 'available') {
    return 'active';
  }
  if (questState.status === 'completed') {
    return 'success';
  }
  if (questState.status === 'failed') {
    return 'failure';
  }
  return 'locked';
}

/**
 * Attempts to infer the most appropriate quest phase type using activity tags.
 */
function deriveFallbackPhaseType(activity: ActivityDefinition): QuestPhaseType {
  const tags = activity.tags ?? [];
  if (tags.includes('combat') || tags.includes('danger')) return 'fight';
  if (tags.includes('stealth')) return 'stealth';
  if (tags.includes('trap')) return 'trap';
  if (tags.includes('explore') || tags.includes('quest')) return 'explore';
  return 'check';
}

/**
 * Returns an emoji aligned with the inferred fallback phase type.
 */
function pickDefaultIconForType(type: QuestPhaseType): string {
  switch (type) {
    case 'fight':
      return '⚔️';
    case 'stealth':
      return '🕶️';
    case 'trap':
      return '🧨';
    case 'explore':
      return '🧭';
    default:
      return '📜';
  }
}
