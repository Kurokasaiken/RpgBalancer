/**
 * Crew Scheduler Time Travel Slider Component – NP-038 Implementation
 *
 * Provides a UI slider for navigating through crew scheduler timeline snapshots,
 * enabling rewind/fast-forward through scheduler state history.
 *
 * @since NP-038
 */

import React from 'react';
import { UseCrewSchedulerTimeTravelReturn } from '../hooks/useCrewSchedulerTimeTravel';

/**
 * Props for the time travel slider component.
 */
export interface CrewSchedulerTimeTravelSliderProps {
  /** Time travel hook return value */
  timeTravel: UseCrewSchedulerTimeTravelReturn;
  /** Whether the component is disabled */
  disabled?: boolean;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Time travel slider component for navigating scheduler snapshots.
 *
 * Displays a timeline slider with navigation controls for rewind/fast-forward
 * through crew scheduler state history.
 */
export function CrewSchedulerTimeTravelSlider({
  timeTravel,
  disabled = false,
  className = '',
}: CrewSchedulerTimeTravelSliderProps) {
  const {
    timeTravelState,
    goToBeginning,
    goToEnd,
    goToSnapshot,
    rewind,
    fastForward,
    canRewind,
    canFastForward,
    currentSnapshot,
  } = timeTravel;

  const { snapshots, currentIndex, isTimeTraveling, hasSnapshots } = timeTravelState;

  if (!hasSnapshots || disabled) {
    return null;
  }

  const handleSliderChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const index = parseInt(event.target.value, 10);
    goToSnapshot(index);
  };

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  const getOperationLabel = (operation: string) => {
    switch (operation) {
      case 'enqueueTask': return 'Task Added';
      case 'processQueue': return 'Queue Processed';
      case 'rebalanceQueue': return 'Queue Rebalanced';
      case 'consumeAssignment': return 'Assignment Consumed';
      case 'initial': return 'Initial State';
      default: return operation;
    }
  };

  return (
    <div className={`crew-scheduler-time-travel ${className}`}>
      <div className="flex items-center gap-2 p-3 bg-slate-800 border border-slate-600 rounded-lg">
        {/* Navigation Buttons */}
        <button
          onClick={goToBeginning}
          disabled={!canRewind}
          className="px-2 py-1 text-xs bg-slate-700 hover:bg-slate-600 disabled:bg-slate-800 disabled:text-slate-500 rounded border border-slate-600 transition-colors"
          title="Go to beginning"
        >
          ⏮
        </button>

        <button
          onClick={rewind}
          disabled={!canRewind}
          className="px-2 py-1 text-xs bg-slate-700 hover:bg-slate-600 disabled:bg-slate-800 disabled:text-slate-500 rounded border border-slate-600 transition-colors"
          title="Rewind one step"
        >
          ⏪
        </button>

        {/* Slider */}
        <div className="flex-1 flex items-center gap-2">
          <span className="text-xs text-slate-400 min-w-15">
            {currentSnapshot ? formatTimestamp(currentSnapshot.timestamp) : '--:--:--'}
          </span>

          <input
            type="range"
            min={0}
            max={snapshots.length - 1}
            value={currentIndex}
            onChange={handleSliderChange}
            className="flex-1 h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer slider"
            style={{
              background: `linear-gradient(to right, #10b981 0%, #10b981 ${(currentIndex / (snapshots.length - 1)) * 100}%, #374151 ${(currentIndex / (snapshots.length - 1)) * 100}%, #374151 100%)`
            }}
          />

          <span className="text-xs text-slate-400 min-w-10">
            {currentIndex + 1}/{snapshots.length}
          </span>
        </div>

        <button
          onClick={fastForward}
          disabled={!canFastForward}
          className="px-2 py-1 text-xs bg-slate-700 hover:bg-slate-600 disabled:bg-slate-800 disabled:text-slate-500 rounded border border-slate-600 transition-colors"
          title="Fast forward one step"
        >
          ⏩
        </button>

        <button
          onClick={goToEnd}
          disabled={!canFastForward}
          className="px-2 py-1 text-xs bg-slate-700 hover:bg-slate-600 disabled:bg-slate-800 disabled:text-slate-500 rounded border border-slate-600 transition-colors"
          title="Go to end"
        >
          ⏭
        </button>

        {/* Current Operation */}
        <div className="min-w-30 text-xs text-slate-300">
          {currentSnapshot ? getOperationLabel(currentSnapshot.operation) : 'No snapshot'}
        </div>

        {/* Time Travel Indicator */}
        {isTimeTraveling && (
          <div className="px-2 py-1 text-xs bg-amber-900 text-amber-200 rounded border border-amber-700">
            TIME TRAVEL
          </div>
        )}
      </div>

      {/* Snapshot Details */}
      {currentSnapshot && (
        <div className="mt-2 p-2 bg-slate-900 border border-slate-700 rounded text-xs">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-slate-400">Operation:</span>
              <span className="ml-2 text-slate-200">{getOperationLabel(currentSnapshot.operation)}</span>
            </div>
            <div>
              <span className="text-slate-400">Time:</span>
              <span className="ml-2 text-slate-200">{formatTimestamp(currentSnapshot.timestamp)}</span>
            </div>
            <div>
              <span className="text-slate-400">Queue Size:</span>
              <span className="ml-2 text-slate-200">{currentSnapshot.queue.length}</span>
            </div>
            <div>
              <span className="text-slate-400">Avg Priority:</span>
              <span className="ml-2 text-slate-200">
                {currentSnapshot.metadata?.queueStats?.avgPriority?.toFixed(2) || 'N/A'}
              </span>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          height: 16px;
          width: 16px;
          border-radius: 50%;
          background: #10b981;
          cursor: pointer;
          border: 2px solid #1f2937;
        }

        .slider::-moz-range-thumb {
          height: 16px;
          width: 16px;
          border-radius: 50%;
          background: #10b981;
          cursor: pointer;
          border: 2px solid #1f2937;
        }
      `}</style>
    </div>
  );
}
