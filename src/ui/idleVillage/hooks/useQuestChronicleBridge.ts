import { useMemo } from 'react';
import type {
  ActivityDefinition,
  IdleVillageConfig,
  QuestBlueprint,
  QuestState,
} from '@/balancing/config/idleVillage/types';
import type { QuestDefinition } from '@/engine/quest/types';
import type { QuestChroniclePhase } from '@/ui/idleVillage/components/QuestChronicle';
import { buildQuestChroniclePhases, findQuestBlueprintForActivity } from '@/ui/idleVillage/questChronicleHelpers';

/**
 * Bridge interface for QuestBranchDiagram data consumed by LocationDetail.
 * Normalizes quest data so LocationDetail and TheaterOverlay share the same source.
 */
export interface QuestChronicleBridgeData {
  /** Whether a quest definition is available for this activity */
  hasQuest: boolean;
  /** Quest phases for branch diagram visualization */
  phases: QuestChroniclePhase[];
  /** Current active phase index */
  activeIndex: number;
  /** Quest title/label */
  title: string;
  /** Quest summary description */
  summary?: string;
  /** Quest icon */
  icon?: string;
  /** Heroic badge flag derived from quest telemetry */
  hasHeroicBadge: boolean;
  /** Injury percentage from quest telemetry */
  injuryPercentage: number;
  /** Death percentage from quest telemetry */
  deathPercentage: number;
}

/**
 * Parameters for the quest chronicle bridge hook.
 */
export interface UseQuestChronicleBridgeParams {
  /** Current quest activity definition */
  questActivity?: ActivityDefinition | null;
  /** Current quest state (progress, status) */
  questState?: QuestState | null;
  /** Quest definition from config (for advanced quest data) */
  questDefinition?: QuestDefinition | null;
  /** Idle Village config for blueprint lookup */
  config?: IdleVillageConfig | null;
}

/**
 * Hook that bridges quest chronicle data for LocationDetail and TheaterOverlay components.
 * Reads from questDefinition and questState to provide normalized data for QuestBranchDiagram
 * and shared telemetry (injury/death percentages, heroic badge).
 *
 * This ensures LocationDetail, TheaterOverlay, and future QuestChronicle components
 * consume the same quest data source without duplication.
 */
export function useQuestChronicleBridge({
  questActivity,
  questState,
  questDefinition,
  config,
}: UseQuestChronicleBridgeParams): QuestChronicleBridgeData {
  return useMemo(() => {
    if (!questActivity) {
      return {
        hasQuest: false,
        phases: [],
        activeIndex: 0,
        title: '',
        summary: undefined,
        icon: undefined,
        hasHeroicBadge: false,
        injuryPercentage: 0,
        deathPercentage: 0,
      };
    }

    // Try to find quest blueprint from config
    const blueprint = findQuestBlueprintForActivity(config ?? null, questActivity.id);

    let phases: QuestChroniclePhase[] = [];
    let activeIndex = 0;
    let title = questActivity.label ?? questActivity.id;
    let summary = typeof questActivity.description === 'string' ? questActivity.description : undefined;
    let icon = (questActivity.metadata as { icon?: string } | undefined)?.icon;

    if (blueprint) {
      // Use blueprint data for full chronicle
      const chronicle = buildQuestChroniclePhases({ blueprint, questState });
      phases = chronicle.phases;
      activeIndex = chronicle.activeIndex;
      title = blueprint.name;
      summary = blueprint.narrative;
      icon = blueprint.icon;
    } else {
      // Fallback to single phase using activity metadata
      const fallbackPhase = createFallbackPhase(questActivity);
      phases = [
        {
          phase: fallbackPhase,
          state: deriveFallbackPhaseState(questState),
        },
      ];
      activeIndex = 0;
    }

    // Extract telemetry from quest definition or activity metadata
    const telemetry = extractQuestTelemetry({ blueprint, questDefinition, activity: questActivity });

    return {
      hasQuest: true,
      phases,
      activeIndex,
      title,
      summary,
      icon,
      hasHeroicBadge: telemetry.hasHeroicBadge,
      injuryPercentage: telemetry.injuryPercentage,
      deathPercentage: telemetry.deathPercentage,
    };
  }, [questActivity, questState, questDefinition, config]);
}

/**
 * Extracts telemetry data (injury/death percentages, heroic badge) from quest definition
 * or falls back to activity metadata. This normalizes the data source so all components
 * use the same calculation.
 */
function extractQuestTelemetry(params: {
  blueprint?: QuestBlueprint | null;
  questDefinition?: QuestDefinition | null;
  activity?: ActivityDefinition | null;
}): { injuryPercentage: number; deathPercentage: number; hasHeroicBadge: boolean } {
  const { blueprint, questDefinition, activity } = params;

  if (blueprint) {
    const riskProfiles = blueprint.phases
      .map((phase) => phase.riskProfile)
      .filter((profile): profile is NonNullable<typeof profile> => Boolean(profile));
    const injuryPercentage = riskProfiles.length > 0 ? Math.max(...riskProfiles.map((profile) => profile.injuryChance)) : 0;
    const deathPercentage = riskProfiles.length > 0 ? Math.max(...riskProfiles.map((profile) => profile.deathChance)) : 0;
    const hasHeroicBadge = Boolean(
      blueprint.difficulty === 'heroic' ||
        blueprint.tags?.includes('heroic') ||
        blueprint.telemetry.tags?.includes?.('heroic'),
    );

    return {
      injuryPercentage,
      deathPercentage,
      hasHeroicBadge,
    };
  }

  if (questDefinition) {
    return {
      injuryPercentage: Math.min(
        100,
        questDefinition.tags?.includes('high-risk') ? 25 : questDefinition.tags?.includes('danger') ? 15 : 0,
      ),
      deathPercentage: Math.min(
        100,
        questDefinition.tags?.includes('high-risk') ? 10 : questDefinition.tags?.includes('danger') ? 5 : 0,
      ),
      hasHeroicBadge: questDefinition.tags?.includes('heroic') ?? false,
    };
  }

  const metadata = activity?.metadata as {
    injuryPercentage?: number;
    deathPercentage?: number;
    hasHeroicBadge?: boolean;
  } | undefined;

  return {
    injuryPercentage: Math.min(100, metadata?.injuryPercentage ?? 0),
    deathPercentage: Math.min(100, metadata?.deathPercentage ?? 0),
    hasHeroicBadge: metadata?.hasHeroicBadge ?? false,
  };
}

/**
 * Builds a synthetic quest phase using the metadata found on the activity definition.
 * (Reused from useQuestChronicle for consistency)
 */
function createFallbackPhase(activity: ActivityDefinition): QuestChroniclePhase['phase'] {
  const derivedType = deriveFallbackPhaseType(activity);
  const inferredIcon =
    (activity.metadata as { icon?: string } | undefined)?.icon ?? pickDefaultIconForType(derivedType);
  const phaseTitle = activity.label ?? activity.id;
  const narrative =
    typeof activity.description === 'string'
      ? activity.description
      : 'Fase placeholder generata dal quest activity.';

  return {
    id: `${activity.id}_fallback_phase`,
    title: phaseTitle,
    type: derivedType,
    durationValue: 1,
    durationUnits: 'hours',
    copy: {
      summary: narrative,
      narrative,
      callToAction: `Supervisiona ${phaseTitle}`,
    },
    icon: inferredIcon,
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
function deriveFallbackPhaseType(activity: ActivityDefinition): QuestChroniclePhase['phase']['type'] {
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
function pickDefaultIconForType(type: QuestChroniclePhase['phase']['type']): string {
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
