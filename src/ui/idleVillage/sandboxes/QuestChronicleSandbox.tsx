/**
 * QuestChronicleSandbox – QST-03
 * Visual sandbox for QuestChronicle component with debug controls.
 */

import React, { useState, useMemo } from 'react';
import { QuestManager } from '@/engine/game/idleVillage/quests/QuestManager';
import QuestChronicle from '../components/QuestChronicle';
import { DEFAULT_IDLE_VILLAGE_CONFIG } from '@/balancing/config/idleVillage/defaultConfig';
import type { QuestState } from '@/balancing/config/idleVillage/types';

const QuestChronicleSandbox: React.FC = () => {
  const manager = useMemo(() => new QuestManager({ config: DEFAULT_IDLE_VILLAGE_CONFIG }), []);
  const [selectedBlueprintId, setSelectedBlueprintId] = useState<string>('quest_city_rats');
  const [questState, setQuestState] = useState<QuestState | null>(null);

  const blueprint = useMemo(() => {
    const bps = DEFAULT_IDLE_VILLAGE_CONFIG.questBlueprints;
    return bps ? bps[selectedBlueprintId] : null;
  }, [selectedBlueprintId]);

  const startQuest = () => {
    if (!blueprint) return;
    const party = ['resident-1'];
    const scheduled = manager.startQuest(selectedBlueprintId, party);
    setQuestState(scheduled.questState as QuestState);
  };

  const advancePhase = () => {
    if (!questState || !blueprint) return;
    const mockScheduled = {
      id: 'mock',
      activityId: blueprint.activityId,
      characterIds: ['resident-1'],
      slotId: 'village_square',
      startTime: 0,
      endTime: 1,
      status: 'running' as const,
      isAuto: false,
      isCompleted: false,
      snapshotDeathRisk: 0,
      questState,
    };
    const result = manager.completePhase(mockScheduled, 'success');
    setQuestState(result.updatedActivity.questState as QuestState);
  };

  const failPhase = () => {
    if (!questState || !blueprint) return;
    const mockScheduled = {
      id: 'mock',
      activityId: blueprint.activityId,
      characterIds: ['resident-1'],
      slotId: 'village_square',
      startTime: 0,
      endTime: 1,
      status: 'running' as const,
      isAuto: false,
      isCompleted: false,
      snapshotDeathRisk: 0,
      questState,
    };
    const result = manager.completePhase(mockScheduled, 'failure');
    setQuestState(result.updatedActivity.questState as QuestState);
  };

  const reset = () => {
    setQuestState(null);
  };

  const onPhaseSelect = (phaseIndex: number) => {
    if (!questState) return;
    setQuestState({ ...questState, currentPhaseIndex: phaseIndex });
  };

  const blueprintOptions = Object.keys(DEFAULT_IDLE_VILLAGE_CONFIG.questBlueprints || {});

  return (
    <div style={{ padding: '20px' }}>
      <h1>Quest Chronicle Sandbox</h1>
      <select value={selectedBlueprintId} onChange={(e) => setSelectedBlueprintId(e.target.value)}>
        {blueprintOptions.map((id) => (
          <option key={id} value={id}>
            {id}
          </option>
        ))}
      </select>
      <button onClick={startQuest}>Start Quest</button>
      <button onClick={advancePhase} disabled={!questState}>
        Advance Phase
      </button>
      <button onClick={failPhase} disabled={!questState}>
        Fail Phase
      </button>
      <button onClick={reset}>Reset</button>
      {questState && blueprint && (
        <QuestChronicle
          questState={questState}
          blueprint={blueprint}
          onPhaseSelect={onPhaseSelect}
          isCollapsed={false}
        />
      )}
    </div>
  );
};

export default QuestChronicleSandbox;
