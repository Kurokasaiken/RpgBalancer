import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useQuestChronicle } from '../useQuestChronicle';
import { DEFAULT_IDLE_VILLAGE_CONFIG } from '@/balancing/config/idleVillage/defaultConfig';
import type { IdleVillageConfig, QuestState } from '@/balancing/config/idleVillage/types';

const cloneConfig = (): IdleVillageConfig => structuredClone(DEFAULT_IDLE_VILLAGE_CONFIG);

describe('useQuestChronicle', () => {
  it('returns null when no quest activity is provided', () => {
    const config = cloneConfig();
    const { result } = renderHook(() =>
      useQuestChronicle({
        config,
        questActivity: null,
      }),
    );

    expect(result.current).toBeNull();
  });

  it('returns blueprint chronicle when quest blueprint exists', () => {
    const config = cloneConfig();
    const questActivity = config.activities.quest_frontier_patrol;
    const questState: QuestState = {
      blueprintId: 'quest_frontier_showcase',
      currentPhaseIndex: 1,
      status: 'in_progress',
      phaseResults: [
        {
          phaseId: 'explore_perimeter',
          result: 'success',
          timestamp: Date.now(),
        },
      ],
    };

    const { result } = renderHook(() =>
      useQuestChronicle({
        config,
        questActivity,
        questState,
      }),
    );

    expect(result.current).not.toBeNull();
    expect(result.current?.source).toBe('blueprint');
    expect(result.current?.blueprint?.id).toBe('quest_frontier_showcase');
    expect(result.current?.chronicle.phases).toHaveLength(
      config.questBlueprints?.quest_frontier_showcase.phases.length ?? 0,
    );
    expect(result.current?.chronicle.activeIndex).toBe(1);
    expect(result.current?.title).toBe(config.questBlueprints?.quest_frontier_showcase.label);
  });

  it('falls back to synthetic phase when blueprint is missing', () => {
    const config = cloneConfig();
    const questActivity = config.activities.job_city_rats;

    const { result } = renderHook(() =>
      useQuestChronicle({
        config,
        questActivity,
      }),
    );

    expect(result.current).not.toBeNull();
    expect(result.current?.source).toBe('fallback');
    expect(result.current?.blueprint).toBeNull();
    expect(result.current?.chronicle.phases).toHaveLength(1);
    expect(result.current?.chronicle.phases[0]?.state).toBe('active');
    expect(result.current?.title).toBe(questActivity.label);
  });
});
