/**
 * Quest Progress Panel – NP-141
 * 
 * UI component for displaying quest chain progress with milestones,
 * branching paths, and completion rewards.
 * 
 * @since NP-141
 */

import React, { useMemo } from 'react';
import type {
  QuestChainConfig,
  QuestConfig,
  QuestProgressState,
  QuestChainProgressState,
  QuestMilestone,
  QuestObjective,
} from '@/balancing/config/idleVillage/questChainConfig';

/**
 * Quest Progress Panel props.
 */
export interface QuestProgressPanelProps {
  /** Quest chain configuration */
  chain: QuestChainConfig;
  /** Quest chain progress state */
  progress: QuestChainProgressState;
  /** Callback when quest is started */
  onStartQuest?: (questId: string) => void;
  /** Callback when branch is selected */
  onSelectBranch?: (questId: string, branchId: string) => void;
  /** Show completed quests */
  showCompleted?: boolean;
  /** Compact mode */
  compact?: boolean;
}

/**
 * Quest Progress Panel component.
 */
export function QuestProgressPanel({
  chain,
  progress,
  onStartQuest,
  onSelectBranch,
  showCompleted = true,
  compact = false,
}: QuestProgressPanelProps): JSX.Element {
  const stats = useMemo(() => {
    return {
      totalQuests: chain.quests.length,
      completedQuests: progress.completedQuests.length,
      activeQuests: progress.activeQuests.length,
      availableQuests: progress.availableQuests.length,
    };
  }, [chain.quests.length, progress]);

  const visibleQuests = useMemo(() => {
    return chain.quests.filter(quest => {
      const questProgress = progress.questProgress[quest.id];
      if (!questProgress) return false;
      
      if (!showCompleted && questProgress.status === 'completed') return false;
      
      return true;
    });
  }, [chain.quests, progress.questProgress, showCompleted]);

  return (
    <div className="quest-progress-panel bg-stone-900/90 border border-amber-700/30 rounded-lg p-4">
      {/* Header */}
      <div className="mb-4">
        <h2 className="text-xl font-bold text-amber-400 mb-1">{chain.name}</h2>
        <p className="text-sm text-stone-400">{chain.description}</p>
      </div>

      {/* Chain Progress */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-amber-300">Chain Progress</span>
          <span className="text-sm text-stone-400">
            {progress.completionPercentage.toFixed(0)}%
          </span>
        </div>
        <div className="w-full bg-stone-800 rounded-full h-3 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-amber-600 to-amber-400 transition-all duration-500"
            style={{ width: `${progress.completionPercentage}%` }}
          />
        </div>
        <div className="flex items-center gap-4 mt-2 text-xs text-stone-500">
          <span>{stats.completedQuests} completed</span>
          <span>{stats.activeQuests} active</span>
          <span>{stats.availableQuests} available</span>
        </div>
      </div>

      {/* Quest List */}
      <div className="space-y-3">
        {visibleQuests.map(quest => {
          const questProgress = progress.questProgress[quest.id];
          if (!questProgress) return null;

          return (
            <QuestCard
              key={quest.id}
              quest={quest}
              progress={questProgress}
              onStart={onStartQuest}
              onSelectBranch={onSelectBranch}
              compact={compact}
            />
          );
        })}
      </div>

      {/* Chain Completion Rewards */}
      {progress.completed && chain.completionRewards && chain.completionRewards.length > 0 && (
        <div className="mt-6 p-3 bg-amber-900/20 border border-amber-600/30 rounded">
          <h3 className="text-sm font-bold text-amber-400 mb-2">Chain Completed!</h3>
          <div className="space-y-1">
            {chain.completionRewards.map((reward, idx) => (
              <div key={idx} className="text-xs text-stone-300">
                + {reward.description || `${reward.value} ${reward.type}`}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Quest Card props.
 */
interface QuestCardProps {
  quest: QuestConfig;
  progress: QuestProgressState;
  onStart?: (questId: string) => void;
  onSelectBranch?: (questId: string, branchId: string) => void;
  compact?: boolean;
}

/**
 * Quest Card component.
 */
function QuestCard({
  quest,
  progress,
  onStart,
  onSelectBranch,
  compact = false,
}: QuestCardProps): JSX.Element {
  const completionPercentage = useMemo(() => {
    if (progress.status === 'completed') return 100;
    if (progress.status === 'locked' || progress.status === 'available') return 0;

    const totalObjectives = quest.objectives.length;
    const completedObjectives = progress.objectives.filter(
      obj => obj.completed || obj.current >= obj.target
    ).length;

    return totalObjectives > 0 ? (completedObjectives / totalObjectives) * 100 : 0;
  }, [quest.objectives.length, progress]);

  const statusColor = {
    locked: 'text-stone-600',
    available: 'text-emerald-400',
    in_progress: 'text-amber-400',
    completed: 'text-green-400',
    failed: 'text-red-400',
  }[progress.status];

  const statusBg = {
    locked: 'bg-stone-800/50',
    available: 'bg-emerald-900/20 border-emerald-600/30',
    in_progress: 'bg-amber-900/20 border-amber-600/30',
    completed: 'bg-green-900/20 border-green-600/30',
    failed: 'bg-red-900/20 border-red-600/30',
  }[progress.status];

  return (
    <div className={`quest-card ${statusBg} border rounded-lg p-3`}>
      {/* Quest Header */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1">
          <h3 className={`text-sm font-bold ${statusColor}`}>{quest.name}</h3>
          <p className="text-xs text-stone-400 mt-1">{quest.description}</p>
        </div>
        <div className="ml-2">
          {progress.status === 'available' && onStart && (
            <button
              onClick={() => onStart(quest.id)}
              className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white text-xs rounded transition-colors"
            >
              Start
            </button>
          )}
          {progress.status === 'completed' && (
            <span className="px-2 py-1 bg-green-600/20 text-green-400 text-xs rounded">
              ✓ Done
            </span>
          )}
          {progress.status === 'locked' && (
            <span className="px-2 py-1 bg-stone-700/50 text-stone-500 text-xs rounded">
              🔒 Locked
            </span>
          )}
        </div>
      </div>

      {/* Progress Bar (for in_progress quests) */}
      {progress.status === 'in_progress' && !compact && (
        <div className="mb-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-stone-400">Progress</span>
            <span className="text-xs text-amber-400">{completionPercentage.toFixed(0)}%</span>
          </div>
          <div className="w-full bg-stone-800 rounded-full h-2 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-amber-600 to-amber-400 transition-all duration-300"
              style={{ width: `${completionPercentage}%` }}
            />
          </div>
        </div>
      )}

      {/* Objectives */}
      {!compact && progress.status === 'in_progress' && (
        <div className="mb-3 space-y-2">
          {progress.objectives.map(objective => (
            <ObjectiveItem key={objective.id} objective={objective} />
          ))}
        </div>
      )}

      {/* Milestones */}
      {!compact && quest.milestones.length > 0 && (
        <div className="mb-3">
          <h4 className="text-xs font-semibold text-stone-400 mb-2">Milestones</h4>
          <div className="space-y-1">
            {quest.milestones.map(milestone => (
              <MilestoneItem
                key={milestone.id}
                milestone={milestone}
                completed={progress.completedMilestones.includes(milestone.id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Rewards */}
      {!compact && quest.rewards.length > 0 && progress.status !== 'locked' && (
        <div className="pt-2 border-t border-stone-700/50">
          <h4 className="text-xs font-semibold text-stone-400 mb-1">Rewards</h4>
          <div className="flex flex-wrap gap-2">
            {quest.rewards.map((reward, idx) => (
              <span
                key={idx}
                className="px-2 py-1 bg-amber-900/30 text-amber-300 text-xs rounded"
              >
                {reward.description || `${reward.value} ${reward.type}`}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Branching Options */}
      {quest.nextQuests && quest.nextQuests.length > 1 && progress.status === 'completed' && !progress.selectedBranch && onSelectBranch && (
        <div className="mt-3 pt-3 border-t border-stone-700/50">
          <h4 className="text-xs font-semibold text-stone-400 mb-2">Choose Your Path</h4>
          <div className="flex gap-2">
            {quest.nextQuests.map(branchId => (
              <button
                key={branchId}
                onClick={() => onSelectBranch(quest.id, branchId)}
                className="flex-1 px-3 py-2 bg-amber-600/20 hover:bg-amber-600/30 border border-amber-600/30 text-amber-300 text-xs rounded transition-colors"
              >
                {branchId}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Objective Item props.
 */
interface ObjectiveItemProps {
  objective: QuestObjective;
}

/**
 * Objective Item component.
 */
function ObjectiveItem({ objective }: ObjectiveItemProps): JSX.Element {
  const percentage = (objective.current / objective.target) * 100;
  const isCompleted = objective.completed || objective.current >= objective.target;

  return (
    <div className="objective-item">
      <div className="flex items-center justify-between mb-1">
        <span className={`text-xs ${isCompleted ? 'text-green-400 line-through' : 'text-stone-300'}`}>
          {isCompleted && '✓ '}
          {objective.description}
        </span>
        <span className="text-xs text-stone-500">
          {objective.current}/{objective.target}
        </span>
      </div>
      <div className="w-full bg-stone-800 rounded-full h-1.5 overflow-hidden">
        <div
          className={`h-full transition-all duration-300 ${
            isCompleted ? 'bg-green-500' : 'bg-amber-500'
          }`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
    </div>
  );
}

/**
 * Milestone Item props.
 */
interface MilestoneItemProps {
  milestone: QuestMilestone;
  completed: boolean;
}

/**
 * Milestone Item component.
 */
function MilestoneItem({ milestone, completed }: MilestoneItemProps): JSX.Element {
  return (
    <div className={`milestone-item flex items-start gap-2 p-2 rounded ${
      completed ? 'bg-green-900/20' : 'bg-stone-800/30'
    }`}>
      <div className={`mt-0.5 text-xs ${completed ? 'text-green-400' : 'text-stone-500'}`}>
        {completed ? '✓' : '○'}
      </div>
      <div className="flex-1">
        <div className={`text-xs font-medium ${completed ? 'text-green-400' : 'text-stone-400'}`}>
          {milestone.name}
        </div>
        {milestone.rewards.length > 0 && (
          <div className="text-xs text-stone-500 mt-0.5">
            {milestone.rewards.map(r => r.description || `${r.value} ${r.type}`).join(', ')}
          </div>
        )}
      </div>
    </div>
  );
}
