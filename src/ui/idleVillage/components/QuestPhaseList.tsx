/**
 * QuestPhaseList Component
 *
 * Displays a compact visualization of quest phases with branching support.
 * Shows the quest progression tree, current phase, completed phases,
 * and available branching choices.
 */

import React, { useMemo } from 'react';
import clsx from 'clsx';
import type { QuestDefinition, QuestState, QuestPhase, BranchDecision } from '@/engine/quest/types';

interface QuestPhaseListProps {
  quest: QuestDefinition;
  questState: QuestState;
  className?: string;
  compact?: boolean;
}

/**
 * Individual phase node in the quest tree.
 */
interface PhaseNodeProps {
  phase: QuestPhase;
  isCompleted: boolean;
  isCurrent: boolean;
  isBranchPoint: boolean;
  hasChoices: boolean;
  branchDecisions: BranchDecision[];
  compact: boolean;
}

const PhaseNode: React.FC<PhaseNodeProps> = ({
  phase,
  isCompleted,
  isCurrent,
  isBranchPoint,
  hasChoices,
  branchDecisions,
  compact,
}) => {
  const getPhaseIcon = (phaseType: QuestPhase['type']): string => {
    switch (phaseType) {
      case 'check': return '🔍';
      case 'fight': return '⚔️';
      case 'stealth': return '👤';
      case 'trap': return '🪤';
      case 'explore': return '🗺️';
      case 'dialogue': return '💬';
      case 'branch': return '🔀';
      case 'timedChoice': return '⏱️';
      default: return '❓';
    }
  };

  const getPhaseColor = (phaseType: QuestPhase['type']): string => {
    switch (phaseType) {
      case 'check':
      case 'stealth':
      case 'explore':
        return 'text-purple-300 border-purple-400/40';
      case 'fight':
        return 'text-orange-300 border-orange-400/40';
      case 'trap':
        return 'text-emerald-300 border-emerald-400/40';
      case 'dialogue':
      case 'timedChoice':
        return 'text-blue-300 border-blue-400/40';
      case 'branch':
        return 'text-yellow-300 border-yellow-400/40';
      default:
        return 'text-slate-300 border-slate-400/40';
    }
  };

  const chosenChoice = branchDecisions
    .find(d => d.phaseId === phase.id)?.outcome.metadata?.choiceMade as string;

  return (
    <div className={clsx(
      'relative flex items-center gap-2 rounded-lg border p-2 transition-all',
      getPhaseColor(phase.type),
      isCompleted && 'bg-green-500/10 border-green-400/60',
      isCurrent && 'bg-amber-500/20 border-amber-400/80 ring-1 ring-amber-400/40',
      isBranchPoint && 'border-yellow-400/60',
      compact ? 'text-xs' : 'text-sm'
    )}>
      {/* Phase Icon */}
      <span className="text-lg" role="img" aria-label={phase.type}>
        {getPhaseIcon(phase.type)}
      </span>

      {/* Phase Info */}
      <div className="flex-1 min-w-0">
        <div className={clsx(
          'font-medium truncate',
          compact ? 'text-xs' : 'text-sm'
        )}>
          {phase.title}
        </div>
        {!compact && phase.description && (
          <div className="text-xs text-slate-400 truncate mt-0.5">
            {phase.description}
          </div>
        )}

        {/* Show chosen choice for dialogue/timedChoice phases */}
        {chosenChoice && (
          <div className="text-xs text-amber-300/80 mt-0.5 italic">
            Chose: {chosenChoice}
          </div>
        )}
      </div>

      {/* Status Indicators */}
      <div className="flex items-center gap-1">
        {isCompleted && (
          <span className="text-green-400 text-xs" aria-label="Completed">
            ✓
          </span>
        )}
        {isCurrent && (
          <span className="text-amber-400 text-xs animate-pulse" aria-label="Current">
            ●
          </span>
        )}
        {isBranchPoint && (
          <span className="text-yellow-400 text-xs" aria-label="Branch point">
            🔀
          </span>
        )}
        {hasChoices && !chosenChoice && (
          <span className="text-blue-400 text-xs" aria-label="Choices available">
            ?
          </span>
        )}
      </div>
    </div>
  );
};

/**
 * Connection line between phases.
 */
const PhaseConnection: React.FC<{
  fromPhaseId: string;
  toPhaseIds: string[];
  branchDecisions: BranchDecision[];
  compact: boolean;
}> = ({ fromPhaseId, toPhaseIds, branchDecisions, compact }) => {
  const takenPath = branchDecisions.find(d => d.phaseId === fromPhaseId);
  const takenPhaseIds = takenPath?.outcome.nextPhaseIds || [];

  return (
    <div className="relative">
      {/* Vertical connection line */}
      <div className={clsx(
        'absolute left-4 top-0 bottom-0 w-0.5 bg-slate-600',
        compact ? 'left-3' : 'left-4'
      )} />

      {/* Branch indicators */}
      {toPhaseIds.length > 1 && (
        <div className="absolute left-2 top-1/2 transform -translate-y-1/2">
          <div className="relative">
            {toPhaseIds.map((toPhaseId, index) => {
              const isTaken = takenPhaseIds.includes(toPhaseId);
              const angle = (index / (toPhaseIds.length - 1)) * 180 - 90; // Spread branches

              return (
                <div
                  key={toPhaseId}
                  className={clsx(
                    'absolute w-8 h-0.5 origin-left transform rotate-0',
                    isTaken ? 'bg-amber-400' : 'bg-slate-500'
                  )}
                  style={{
                    transform: `rotate(${angle}deg)`,
                    top: `${index * 4}px`,
                  }}
                />
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Main QuestPhaseList component.
 */
export const QuestPhaseList: React.FC<QuestPhaseListProps> = ({ quest, questState, className, compact = false }) => {
  const questDurationSeconds = useMemo(() => {
    if (typeof questState.startTime !== 'number' || typeof questState.lastActivityTime !== 'number') {
      return 0;
    }
    return Math.max(0, Math.floor((questState.lastActivityTime - questState.startTime) / 1000));
  }, [questState.lastActivityTime, questState.startTime]);

  // Build phase tree structure
  const phaseTree = useMemo(() => {
    const phaseMap = new Map<string, QuestPhase>();
    quest.phases.forEach(phase => phaseMap.set(phase.id, phase));

    // For now, create a simple linear representation
    // In a full implementation, this would build a proper tree structure
    return quest.phases.map(phase => ({
      phase,
      children: [], // Would be populated from branch outcomes
    }));
  }, [quest.phases]);

  const getBranchDecisionsForPhase = (phaseId: string): BranchDecision[] => {
    return questState.branchHistory.filter(d => d.phaseId === phaseId);
  };

  const hasChoices = (phase: QuestPhase): boolean => {
    switch (phase.type) {
      case 'dialogue':
        return phase.choices.length > 0;
      case 'timedChoice':
        return phase.choices.length > 0;
      default:
        return false;
    }
  };

  return (
    <div className={clsx('space-y-2', className)}>
      <header className="flex items-center justify-between">
        <h3 className={clsx(
          'font-semibold text-amber-200 uppercase tracking-wide',
          compact ? 'text-sm' : 'text-base'
        )}>
          Quest Progression
        </h3>
        <span className="text-xs text-slate-400">
          {questState.completedPhaseIds.length}/{quest.phases.length} phases
        </span>
      </header>

      <div className={clsx(
        'space-y-3',
        compact ? 'max-h-48 overflow-y-auto' : 'max-h-64 overflow-y-auto'
      )}>
        {phaseTree.map(({ phase }, index) => {
          const isCompleted = questState.completedPhaseIds.includes(phase.id);
          const isCurrent = questState.currentPhaseId === phase.id;
          const phaseBranchHistory = getBranchDecisionsForPhase(phase.id);
          const isBranchPoint = ['branch', 'dialogue', 'timedChoice'].includes(phase.type);
          const choicesAvailable = hasChoices(phase);

          return (
            <React.Fragment key={phase.id}>
              <PhaseNode
                phase={phase}
                isCompleted={isCompleted}
                isCurrent={isCurrent}
                isBranchPoint={isBranchPoint}
                hasChoices={choicesAvailable}
                branchDecisions={phaseBranchHistory}
                compact={compact}
              />

              {/* Connection to next phase(s) */}
              {index < phaseTree.length - 1 && (
                <PhaseConnection
                  fromPhaseId={phase.id}
                  toPhaseIds={[phaseTree[index + 1].phase.id]} // Simplified
                  branchDecisions={questState.branchHistory}
                  compact={compact}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Quest status summary */}
      <footer className="pt-2 border-t border-slate-600/50">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span>
            Branches taken: {questState.branchHistory.length}
          </span>
          <span>
            Duration: {questDurationSeconds}s
          </span>
        </div>
      </footer>
    </div>
  );
};

export default QuestPhaseList;
