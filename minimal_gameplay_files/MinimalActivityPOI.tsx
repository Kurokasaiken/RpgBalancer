import React, { useState } from 'react';
import type { DragEvent as ReactDragEvent } from 'react';
import { StyleLabSurface } from '@/ui/styleLab/StyleLabSurface';
import type { ResidentState } from '@/engine/game/idleVillage/TimeEngine';
import type { MinimalGameState } from '@/engine/game/idleVillage/minimalSnapshotSerializer';
import { RESIDENT_DRAG_MIME } from '@/ui/idleVillage/constants';
import { useDroppable } from '@dnd-kit/core';

interface MinimalActivityPOIProps {
  activityId: string;
  title: string;
  description: string;
  type: 'job' | 'quest';
  riskLevel: number;
  rewards: { gold?: number; wood?: number; xp?: number };
  duration: number;
  assignedResident?: string;
  onResidentAssign: (residentId: string) => void;
  residents: ResidentState[];
  gameState: MinimalGameState;
}

/**
 * Minimal POI component for vertical slice activity slots
 * Shows activity info, risk, rewards, and supports drag-and-drop resident assignment
 */
const MinimalActivityPOI: React.FC<MinimalActivityPOIProps> = ({
  activityId,
  title,
  description,
  type,
  riskLevel,
  rewards,
  duration,
  assignedResident,
  onResidentAssign,
  residents,
  gameState,
}) => {
  const [dropState, setDropState] = useState<'idle' | 'valid' | 'invalid'>('idle');
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  // Setup droppable target for the slot
  const droppableId = `poi-drop-${activityId}`;
  
  console.log('MinimalActivityPOI - Setup:', { activityId, droppableId });
  
  const { setNodeRef, isOver } = useDroppable({
    id: droppableId,
    data: {
      accepts: ['resident'],
      activityId,
    },
  });

  // Log droppable state changes
  React.useEffect(() => {
    console.log('MinimalActivityPOI - Droppable state:', { 
      activityId, 
      droppableId, 
      isOver, 
      hasSetNodeRef: !!setNodeRef 
    });
  }, [activityId, droppableId, isOver, setNodeRef]);

  // Get assigned resident details
  const assignedResidentData = assignedResident 
    ? residents.find(r => r.id === assignedResident)
    : null;

  // Check if activity is currently running
  const activeActivity = gameState.activeActivities.find(a => a.activityId === activityId);
  const isRunning = !!activeActivity;

  // Format duration
  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    return `${seconds}s`;
  };

  // Get risk color
  const getRiskColor = (level: number) => {
    if (level <= 1) return 'text-green-600';
    if (level <= 2) return 'text-yellow-600';
    if (level <= 4) return 'text-orange-600';
    return 'text-red-600';
  };

  // Get type color
  const getTypeColor = (type: 'job' | 'quest') => {
    return type === 'job' ? 'border-green-300 bg-green-50' : 'border-blue-300 bg-blue-50';
  };

  // Handle dnd-kit drop validation
  React.useEffect(() => {
    console.log('MinimalActivityPOI - Drag state change:', { 
      activityId, 
      isOver, 
      wasDraggingOver: isDraggingOver,
      dropState 
    });
    
    if (isOver) {
      setIsDraggingOver(true);
      // We'll validate on drop, just show visual feedback
      setDropState('valid');
      console.log('MinimalActivityPOI - Drag entered:', { activityId, droppableId });
    } else {
      setIsDraggingOver(false);
      if (dropState !== 'invalid') {
        setDropState('idle');
      }
      console.log('MinimalActivityPOI - Drag left:', { activityId, droppableId });
    }
  }, [isOver, dropState, isDraggingOver, activityId, droppableId]);

  // Calculate progress if running
  const progress = isRunning && activeActivity 
    ? 1 - (activeActivity.ticksRemaining / Math.ceil(duration / 1000))
    : 0;

  return (
    <StyleLabSurface 
      variant="card" 
      className={`relative ${getTypeColor(type)} transition-all duration-200 ${
        isDraggingOver ? 'ring-2 ring-blue-400 ring-opacity-50' : ''
      } ${
        dropState === 'valid' && isDraggingOver ? 'ring-2 ring-green-400 ring-opacity-75 shadow-lg' : ''
      } ${
        dropState === 'invalid' && isDraggingOver ? 'opacity-50' : ''
      }`}
    >
      {/* Activity Header */}
      <div className="p-3 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h4 className="font-semibold text-sm">{title}</h4>
          <span className={`text-xs px-2 py-1 rounded ${
            type === 'job' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
          }`}>
            {type === 'job' ? 'Job' : 'Quest'}
          </span>
        </div>
        <p className="text-xs text-gray-600 mt-1">{description}</p>
      </div>

      {/* Activity Details */}
      <div className="p-3 space-y-2">
        {/* Risk Level */}
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-600">Risk Level:</span>
          <span className={`font-medium ${getRiskColor(riskLevel)}`}>
            {riskLevel}/10 {riskLevel <= 1 ? '(Safe)' : riskLevel <= 2 ? '(Low)' : riskLevel <= 4 ? '(Moderate)' : '(High)'}
          </span>
        </div>

        {/* Duration */}
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-600">Duration:</span>
          <span className="font-medium">{formatDuration(duration)}</span>
        </div>

        {/* Rewards */}
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-600">Rewards:</span>
          <div className="flex gap-2">
            {rewards.gold && <span className="font-medium text-yellow-600">+{rewards.gold} gold</span>}
            {rewards.wood && <span className="font-medium text-green-600">+{rewards.wood} wood</span>}
            {rewards.xp && <span className="font-medium text-purple-600">+{rewards.xp} xp</span>}
          </div>
        </div>

        {/* Progress Bar (if running) */}
        {isRunning && (
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-600">Progress:</span>
              <span className="font-medium">{Math.round(progress * 100)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${progress * 100}%` }}
              />
            </div>
            <div className="text-xs text-gray-500 text-center">
              {activeActivity?.ticksRemaining}s remaining
            </div>
          </div>
        )}
      </div>

      {/* Resident Assignment Slot */}
      <div 
        ref={setNodeRef}
        role="button"
        className={`p-3 border-t border-gray-200 ${
          isDraggingOver ? 'bg-blue-50' : 'bg-gray-50'
        } transition-colors duration-200`}
      >
        <div className="text-xs text-gray-600 mb-2">
          {assignedResidentData ? 'Assigned Resident:' : 'Drop resident here to start:'}
        </div>
        
        {assignedResidentData ? (
          <div className="flex items-center gap-2 p-2 bg-white rounded border border-gray-300">
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
              {(assignedResidentData.displayName || assignedResidentData.id).charAt(0)}
            </div>
            <div className="flex-1">
              <div className="text-sm font-medium">{assignedResidentData.displayName || `Resident ${assignedResidentData.id}`}</div>
              <div className="text-xs text-gray-500">
                {isRunning ? 'Working...' : 'Ready to start'}
              </div>
            </div>
            {isRunning && (
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            )}
          </div>
        ) : (
          <div className={`border-2 border-dashed rounded p-4 text-center ${
            dropState === 'valid' && isDraggingOver 
              ? 'border-green-400 bg-green-50 text-green-700' 
              : dropState === 'invalid' && isDraggingOver
              ? 'border-red-300 bg-red-50 text-red-600'
              : 'border-gray-300 text-gray-400'
          } transition-colors duration-200`}>
            <div className="text-sm">
              {dropState === 'valid' && isDraggingOver 
                ? 'Drop to assign' 
                : dropState === 'invalid' && isDraggingOver
                ? 'Cannot assign'
                : 'Drag resident here'
              }
            </div>
          </div>
        )}
      </div>

      {/* Bloom effect for valid drops */}
      {dropState === 'valid' && isDraggingOver && (
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-br from-green-400/25 via-transparent to-cyan-400/20 rounded-lg" />
        </div>
      )}
    </StyleLabSurface>
  );
};

export default MinimalActivityPOI;
