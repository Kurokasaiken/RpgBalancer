/**
 * MigrationQueuePanel Component
 *
 * UI panel for managing migration queues between villages.
 * Displays pending migrations and allows processing migration ticks.
 */

import React, { useId } from 'react';
import type { MigrationRequest } from '@/ui/idleVillage/state/VillageRegistry';
import { DEFAULT_MIGRATION_DURATION_TU } from '@/ui/idleVillage/constants';

export interface MigrationQueuePanelProps {
  /** Current migration queue */
  migrationQueue: MigrationRequest[];
  /** Process migration tick callback */
  onProcessMigrationTick: () => MigrationRequest[];
  className?: string;
}

export const MigrationQueuePanel: React.FC<MigrationQueuePanelProps> = ({
  migrationQueue,
  onProcessMigrationTick,
  className,
}) => {
  const panelTitleId = useId();
  const queueSummaryId = useId();

  const handleProcessTick = () => {
    const result = onProcessMigrationTick();
    const completed = Array.isArray(result) ? result : [];
    if (completed.length > 0) {
      console.log('Completed migrations:', completed);
    }
  };

  const formatCost = (cost: Record<string, number>): string => {
    return Object.entries(cost)
      .map(([resource, amount]) => `${amount} ${resource}`)
      .join(', ');
  };

  const getProgressRatio = (timeRemaining: number): number => {
    const elapsed = DEFAULT_MIGRATION_DURATION_TU - timeRemaining;
    const boundedElapsed = Math.max(0, Math.min(DEFAULT_MIGRATION_DURATION_TU, elapsed));
    return boundedElapsed / DEFAULT_MIGRATION_DURATION_TU;
  };

  return (
    <section
      className={`space-y-4 ${className}`}
      aria-labelledby={panelTitleId}
      role="region"
      data-testid="migration-queue-panel"
    >
      <div className="flex items-center justify-between">
        <h3 id={panelTitleId} className="text-lg font-semibold text-blue-200">
          Migration Queue
        </h3>
        <button
          type="button"
          onClick={handleProcessTick}
          disabled={migrationQueue.length === 0}
          aria-controls={queueSummaryId}
          aria-label={migrationQueue.length === 0 ? 'No migrations to process' : 'Process one migration tick'}
          className="rounded-lg border border-blue-400/40 bg-blue-500/10 px-3 py-1 text-sm text-blue-200 hover:bg-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          data-testid="migration-process-tick"
        >
          Process Tick
        </button>
      </div>

      <div className="space-y-2">
        {migrationQueue.map(request => (
          <div
            key={request.id}
            className="rounded-lg border border-white/10 bg-black/20 p-3"
            data-testid={`migration-card-${request.id}`}
            aria-label={`Migration request for ${request.residentId} from ${request.fromVillageId} to ${request.toVillageId}`}
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="text-sm text-slate-200">
                  Resident: {request.residentId}
                </div>
                <div className="text-xs text-slate-400">
                  {request.fromVillageId} → {request.toVillageId}
                </div>
                <div className="text-xs text-slate-500">
                  Time remaining: {request.timeRemaining} TU | Cost: {formatCost(request.costPaid)}
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-slate-400">
                  Progress
                </div>
                <div className="w-16 h-2 bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 transition-all duration-300"
                    role="progressbar"
                    aria-label={`Migration progress for ${request.residentId}`}
                    aria-valuemin={0}
                    aria-valuemax={DEFAULT_MIGRATION_DURATION_TU}
                    aria-valuenow={Math.max(0, DEFAULT_MIGRATION_DURATION_TU - request.timeRemaining)}
                    style={{ width: `${getProgressRatio(request.timeRemaining) * 100}%` }}
                    data-testid={`migration-progress-${request.id}`}
                  />
                </div>
              </div>
            </div>
          </div>
        ))}

        {migrationQueue.length === 0 && (
          <div
            className="rounded-lg border border-dashed border-slate-600 bg-slate-900/20 p-4 text-center"
            data-testid="migration-empty-state"
          >
            <p className="text-sm text-slate-400">No pending migrations</p>
          </div>
        )}
      </div>

      {migrationQueue.length > 0 && (
        <div id={queueSummaryId} className="text-xs text-slate-400 text-center" data-testid="migration-queue-summary">
          {migrationQueue.length} migration{migrationQueue.length !== 1 ? 's' : ''} in queue
        </div>
      )}
    </section>
  );
};

export default MigrationQueuePanel;
