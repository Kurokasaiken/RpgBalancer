import React, { useCallback, useEffect, useState } from 'react';
import { FantasyButton as Button } from '@/ui/atoms/FantasyButton';
import { X } from 'lucide-react';
import { useActionDetailHarness } from '@/ui/idleVillage/hooks/useActionDetailHarness';
import { RESIDENT_DRAG_MIME } from '@/ui/idleVillage/constants';
import type { ActivityDefinition } from '@/balancing/config/idleVillage/types';
import type { ActivitySlotData } from '@/ui/idleVillage/types/ActivitySlotData';
import type { DropState } from '@/ui/idleVillage/hooks/useSandboxDragController';

/**
 * Props for CardDetail component
 */
export interface CardDetailProps {
  slotId: string;
  activity: ActivityDefinition;
  slot: ActivitySlotData;
  slotDropStates: Record<string, DropState>;
  onClose: () => void;
}

/**
 * Droppable slot for residents
 */
function ResidentSlot({ assignedResidentName, onDrop, dropState }: {
  slotId: string;
  assignedResidentName: string | null;
  onDrop: (residentId: string) => void;
  dropState: DropState;
}) {
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const residentId = e.dataTransfer.getData(RESIDENT_DRAG_MIME);
    if (residentId) {
      onDrop(residentId);
    }
  }, [onDrop]);

  const borderColor = dropState === 'valid' ? 'border-green-500' : dropState === 'invalid' ? 'border-red-500' : 'border-gray-300';

  return (
    <div
      className={`border-2 border-dashed p-2 rounded ${borderColor} ${assignedResidentName ? 'bg-blue-100' : 'bg-gray-100'}`}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {assignedResidentName ? assignedResidentName : 'Drop resident here'}
    </div>
  );
}

/**
 * CardDetail component - Magic-card style activity detail with drag/drop
 */
export function CardDetail({ slotId, activity, slot, slotDropStates, onClose }: CardDetailProps) {
  const [position, setPosition] = useState({ x: 100, y: 100 });

  const {
    actionDetailHarnessState,
    handleAssignResidentToJob,
  } = useActionDetailHarness({
    primaryJobActivity: activity,
    effectiveJobSlotId: slotId,
    jobAssignedResidentId: slot.assignedWorkerId,
    jobAssignedResidentName: slot.assignedWorkerId, 
    jobHelperText: activity.rewards?.[0]?.amountFormula || '',
    slotDropStates,
    jobIsPlaying: false,
    jobProgressFraction: 0,
    jobElapsedSeconds: 0,
    jobTotalDurationSeconds: Number(activity.durationFormula) || 60,
    jobRemainingSeconds: Number(activity.durationFormula) || 60,
    handleWorkerDrop: (_rid: string) => {}, // Replaced by handleAssignResidentToJob in UI
    handleDragOver: () => {},
    formatCycleSeconds: (seconds: number) => `${Math.floor(seconds / 60)}:${(seconds % 60).toString().padStart(2, '0')}`,
    draggingResidentId: null,
  });

  // Handle drag for the card
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  }, [position]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (isDragging) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  }, [isDragging, dragStart]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  // Handle Esc key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const icon = activity.metadata?.icon as string | undefined;
  const isStringIcon = typeof icon === 'string';

  return (
    <div
      className="fixed z-50 bg-white border-2 border-gray-300 rounded-lg shadow-lg max-w-md"
      style={{ left: position.x, top: position.y }}
    >
      <div
        onMouseDown={handleMouseDown}
        className="cursor-move flex justify-between items-center p-2 bg-gray-100 rounded-t-lg"
      >
        <span className="font-semibold text-gray-900">{activity.label}</span>
        <Button variant="secondary" size="sm" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="p-4">
        {isStringIcon && (
          <div className="flex justify-center mb-4 text-4xl">
            {icon as string}
          </div>
        )}
        <p className="text-sm text-gray-600 mb-2">{activity.description}</p>

        {/* Metrics */}
        <div className="mb-4">
          <div className="flex items-center mb-2">
            <div className="w-8 h-8 rounded-full border-4 border-blue-500" style={{
              background: `conic-gradient(blue 0% ${actionDetailHarnessState.progressFraction * 100}%, transparent ${actionDetailHarnessState.progressFraction * 100}% 100%)`
            }}></div>
            <span className="ml-2 text-gray-700">{actionDetailHarnessState.elapsedLabel} / {actionDetailHarnessState.remainingLabel}</span>
          </div>
          <p className="text-gray-600 text-sm">Modifiers: {actionDetailHarnessState.helperText}</p>
        </div>

        {/* Slots */}
        <div className="mb-4">
          <h4 className="font-semibold mb-2 text-gray-900">Assigned Residents</h4>
          <ResidentSlot
            slotId={slotId}
            assignedResidentName={actionDetailHarnessState.assignedResidentName}
            onDrop={handleAssignResidentToJob}
            dropState={slotDropStates[slotId] || 'idle'}
          />
        </div>

        {/* Start Button */}
        <Button
          onClick={() => {/* TODO: start activity */}}
          disabled={actionDetailHarnessState.isPlaying}
          fullWidth
        >
          {actionDetailHarnessState.isPlaying ? 'Running' : 'Start'}
        </Button>
      </div>
    </div>
  );
}
