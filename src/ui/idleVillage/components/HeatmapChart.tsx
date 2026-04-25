import React, { useMemo, useState } from 'react';
import clsx from 'clsx';
import type { AssignmentHeatmapData, AssignmentCounts } from '@/ui/idleVillage/utils/workerPickerTelemetry';

/**
 * Props for the HeatmapChart component.
 */
export interface HeatmapChartProps {
  /** Heatmap data from telemetry aggregation */
  data: AssignmentHeatmapData;
  /** Minimum attempts threshold to display a cell */
  minAttempts?: number;
  /** CSS class for the container */
  className?: string;
}

/**
 * Individual cell in the heatmap with tooltip.
 */
interface HeatmapCellProps {
  slotId: string;
  residentId: string;
  counts: AssignmentCounts;
  className?: string;
}

const HeatmapCell: React.FC<HeatmapCellProps> = ({ slotId, residentId, counts, className }) => {
  const [isHovered, setIsHovered] = useState(false);

  const intensity = useMemo(() => {
    // Color intensity based on success rate (0-1)
    return Math.min(1, counts.successRate * 2); // Amplify for better visibility
  }, [counts.successRate]);

  const backgroundColor = useMemo(() => {
    if (counts.attempts === 0) return 'transparent';
    
    // Gilded Observatory color scheme
    const baseHue = counts.successRate > 0.5 ? 45 : 15; // Gold for success, red for failure
    const saturation = 70 + (intensity * 30); // 70-100%
    const lightness = 40 + (intensity * 20); // 40-60%
    
    return `hsl(${baseHue}, ${saturation}%, ${lightness}%)`;
  }, [counts.attempts, counts.successRate, intensity]);

  return (
    <div
      className={clsx(
        'relative w-8 h-8 border border-slate-600/30 rounded-sm transition-all duration-200 cursor-pointer',
        counts.attempts > 0 && 'hover:ring-2 hover:ring-amber-400/50',
        className
      )}
      style={{
        backgroundColor,
        opacity: counts.attempts > 0 ? 0.8 + (intensity * 0.2) : 0.1,
      }}
      data-testid={`heatmap-cell-${slotId}-${residentId}`}
      data-attempts={counts.attempts}
      data-successes={counts.successes}
      data-success-rate={counts.successRate}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {counts.attempts > 0 && (
        <div className="w-full h-full flex items-center justify-center text-xs font-mono text-white font-semibold">
          {counts.attempts}
        </div>
      )}

      {isHovered && counts.attempts > 0 && (
        <div
          className="absolute z-50 p-2 bg-black/90 border border-amber-400/50 rounded-md shadow-lg text-xs text-white whitespace-nowrap pointer-events-none"
          style={{
            top: '-8px',
            left: '50%',
            transform: 'translateX(-50%) translateY(-100%)',
          }}
          data-testid={`heatmap-tooltip-${slotId}-${residentId}`}
        >
          <div className="font-semibold">{slotId} → {residentId}</div>
          <div>Attempts: {counts.attempts}</div>
          <div>Successes: {counts.successes}</div>
          <div>Rate: {(counts.successRate * 100).toFixed(1)}%</div>
          {counts.lastAttempt && (
            <div>Last: {new Date(counts.lastAttempt).toLocaleTimeString()}</div>
          )}
        </div>
      )}
    </div>
  );
};

/**
 * Heatmap visualization for WorkerPicker assignment telemetry.
 * Shows slot×resident matrix with attempt/success frequency.
 * Config-first with Gilded Observatory styling.
 */
export const HeatmapChart: React.FC<HeatmapChartProps> = ({
  data,
  minAttempts = 0,
  className,
}) => {
  const filteredSlotIds = useMemo(() => {
    return data.slotIds.filter(slotId => {
      const slotData = data.matrix[slotId];
      return Object.values(slotData).some(counts => counts.attempts >= minAttempts);
    });
  }, [data.slotIds, data.matrix, minAttempts]);

  const filteredResidentIds = useMemo(() => {
    return data.residentIds.filter(residentId => {
      return data.slotIds.some(slotId => {
        const counts = data.matrix[slotId]?.[residentId];
        return counts && counts.attempts >= minAttempts;
      });
    });
  }, [data.residentIds, data.slotIds, data.matrix, minAttempts]);

  if (filteredSlotIds.length === 0 || filteredResidentIds.length === 0) {
    return (
      <div
        className={clsx('flex items-center justify-center p-8 text-slate-400', className)}
        data-testid="heatmap-empty"
      >
        <div className="text-center">
          <div className="text-lg mb-2">📊 No Data</div>
          <div className="text-sm">
            No assignment attempts found{data.totalEvents > 0 ? ` (filtered ${data.totalEvents} events)` : ''}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={clsx('p-4 bg-black/20 rounded-lg border border-slate-600/30', className)}>
      <div className="mb-4 text-sm text-slate-300">
        <div className="flex items-center gap-4 mb-2">
          <span className="font-semibold">Assignment Heatmap</span>
          <span>({filteredSlotIds.length} slots × {filteredResidentIds.length} residents)</span>
        </div>
        <div className="text-xs text-slate-400">
          Darker = Higher success rate • Numbers = Attempt count
        </div>
      </div>

      <div className="overflow-auto max-h-96">
        <div className="inline-block">
          {/* Header row with resident IDs */}
          <div className="flex mb-1">
            <div className="w-20 h-8" /> {/* Corner spacer */}
            {filteredResidentIds.map(residentId => (
              <div
                key={residentId}
                className="w-8 h-8 flex items-center justify-center text-xs text-slate-400 font-mono truncate"
                title={residentId}
              >
                {residentId.split('-').pop()}
              </div>
            ))}
          </div>

          {/* Data rows */}
          {filteredSlotIds.map(slotId => (
            <div key={slotId} className="flex items-center mb-1">
              {/* Row header with slot ID */}
              <div
                className="w-20 h-8 flex items-center text-xs text-slate-300 font-mono truncate pr-2"
                title={slotId}
              >
                {slotId.split('-').pop()}
              </div>

              {/* Data cells */}
              {filteredResidentIds.map(residentId => {
                const counts = data.matrix[slotId]?.[residentId] || {
                  attempts: 0,
                  successes: 0,
                  successRate: 0,
                  lastAttempt: null,
                };

                return (
                  <HeatmapCell
                    key={`${slotId}-${residentId}`}
                    slotId={slotId}
                    residentId={residentId}
                    counts={counts}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="mt-4 flex items-center gap-4 text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-sm bg-red-500/60" />
          <span>Low success</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-sm bg-yellow-500/60" />
          <span>Medium success</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-sm bg-yellow-300/80" />
          <span>High success</span>
        </div>
      </div>
    </div>
  );
};

export default HeatmapChart;
