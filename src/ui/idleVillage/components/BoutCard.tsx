import React, { useMemo, useCallback } from 'react';
import type { ActivityDefinition } from '@/balancing/config/idleVillage/types';
import type { VillageState } from '@/engine/game/idleVillage/TimeEngine';
import ActivityActionCard from '@/ui/idleVillage/components/ActivityActionCard';
import { ActionCardWrapper } from '@/ui/idleVillage/components/ActionCardWrapper';
import RiskStripe from '@/ui/idleVillage/components/RiskStripe';
import { calculateRiskStripes } from '@/ui/idleVillage/utils/riskMetrics';
import { createSandboxDiagnostics, type RiskDiagnosticsPayload } from '@/ui/idleVillage/utils/sandboxDiagnostics';
import type { WorkerPickerTelemetryStore } from '@/ui/idleVillage/utils/workerPickerTelemetry';

/**
 * Props for the Bout Card component.
 */
export interface BoutCardProps {
  /** The Bout activity definition from config */
  activity: ActivityDefinition;
  /** Current village state */
  villageState: VillageState;
  /** Idle Village config */
  config?: any;
  /** Residents data for ActionCardWrapper */
  residents?: any;
  /** Whether the card is currently playing (activity active) */
  isPlaying: boolean;
  /** Current assigned resident ID (if any) */
  assignedResidentId?: string | null;
  /** Progress fraction (0-1) for the current activity */
  progressFraction: number;
  /** Elapsed seconds in the current activity */
  elapsedSeconds: number;
  /** Total duration seconds for the activity */
  totalDurationSeconds: number;
  /** Callback to handle worker drop assignment */
  onWorkerDrop?: (workerId: string | null) => void;
  /** Callback to toggle start */
  onToggleStart?: () => void;
  /** Callback on card hover */
  onHoverChange?: (isHovering: boolean) => void;
  /** Visual variant for the card */
  visualVariant?: 'azure' | 'ember' | 'jade' | 'amethyst' | 'solar';
}

/**
 * Bout Card component for Punch Club realistic quest/bout activities.
 *
 * Displays Bout activity with gold costs, injury risk stripes (8%),
 * and start controls. Config-first design using activity definition.
 */
const BoutCard: React.FC<BoutCardProps> = ({
  activity,
  villageState,
  config,
  residents,
  isPlaying,
  assignedResidentId,
  progressFraction,
  elapsedSeconds,
  totalDurationSeconds,
  onWorkerDrop,
  onToggleStart,
  onHoverChange,
  visualVariant = 'solar', // Solar for heroic/bout theme
}) => {
  const diagnostics = useMemo(
    () => createSandboxDiagnostics<RiskDiagnosticsPayload>('PunchClubRiskHUD', 'risk'),
    [],
  );
  const assignedResident = assignedResidentId ? villageState.residents[assignedResidentId] : null;

  // Calculate costs and rewards from activity definition
  const costsAndRewards = useMemo(() => {
    const goldCost = activity.costs?.find(c => c.resourceId === 'gold')?.amountFormula ?? 0;
    const goldReward = activity.rewards?.find(r => r.resourceId === 'gold')?.amountFormula ?? 0;
    const gritReward = activity.rewards?.find(r => r.resourceId === 'grit')?.amountFormula ?? 0;
    return { goldCost: parseFloat(goldCost.toString()) || 0, goldReward: parseFloat(goldReward.toString()) || 0, gritReward: parseFloat(gritReward.toString()) || 0 };
  }, [activity.costs, activity.rewards]);

  // Determine if can start (has assigned resident, has gold, etc.)
  const canStart = useMemo(() => {
    if (!assignedResident) return false;
    if (assignedResident.status !== 'available') return false;

    // Check gold cost
    const villageGold = villageState.resources?.gold ?? 0;
    if (villageGold < costsAndRewards.goldCost) return false;

    return true;
  }, [assignedResident, villageState.resources, costsAndRewards.goldCost]);

  // CTA label based on state
  const ctaLabel = useMemo(() => {
    if (isPlaying) return 'IN PROGRESS';
    if (!assignedResident) return 'ASSIGN FIGHTER';
    if (!canStart) return 'INSUFFICIENT GOLD';
    return 'START BOUT';
  }, [isPlaying, assignedResident, canStart]);

  // Risk stripes for injury/death from config (hardcoded for Bout)
  const riskMetrics = useMemo(() => ({
    injuryPct: 8, // 8% injury risk for bouts
    deathPct: 0,
  }), []);

  // Calculate risk stripe data
  const riskData = useMemo(() =>
    calculateRiskStripes(riskMetrics),
    [riskMetrics]
  );

  // Diagnostics and telemetry
  React.useEffect(() => {
    if (riskData.warnings.length > 0) {
      diagnostics.warn('risk-mismatch', { warnings: riskData.warnings, injuryPct: riskMetrics.injuryPct, deathPct: riskMetrics.deathPct });
    }
    diagnostics.debug('risk-trend', { injuryPct: riskMetrics.injuryPct, deathPct: riskMetrics.deathPct });

    // Publish metrics to telemetry
    if (typeof window !== 'undefined') {
      const win = window as Window & { __sandboxTelemetry?: WorkerPickerTelemetryStore };
      const telemetryStore: WorkerPickerTelemetryStore =
        win.__sandboxTelemetry ??
        (win.__sandboxTelemetry = {
          events: [],
          metrics: {
            assignment_latency_ms: null,
            assignment_samples: 0,
            picker_close_rate: null,
            picker_close_samples: 0,
            picker_close_within_target: 0,
          },
          tapCount: 0,
          assignmentInteraction: [],
        });
      telemetryStore.risk = {
        injuryAvg: riskMetrics.injuryPct,
        deathAvg: riskMetrics.deathPct,
      };
    }
  }, [riskData.warnings, riskMetrics, diagnostics]);

  // Legacy riskStripeMetrics removed, replaced by RiskStripe

  // Handle CTA click
  const handleClick = useCallback(() => {
    if (isPlaying || (!assignedResident && !canStart)) return;
    onToggleStart?.();
  }, [isPlaying, assignedResident, canStart, onToggleStart]);

  // Helper text with costs/rewards
  const helperText = useMemo(() => {
    const parts: string[] = [];
    if (costsAndRewards.goldCost > 0) parts.push(`-${costsAndRewards.goldCost} Gold`);
    if (costsAndRewards.goldReward > 0) parts.push(`+${costsAndRewards.goldReward} Gold`);
    if (costsAndRewards.gritReward > 0) parts.push(`+${costsAndRewards.gritReward} Grit`);
    parts.push('8% Injury Risk');
    return parts.join(' • ');
  }, [costsAndRewards]);

  return (
    <div className="relative">
      {config && residents ? (
        <ActionCardWrapper
          activity={activity}
          config={config}
          residents={residents}
          onCollect={handleClick}
          dataTestId={`bout-${activity.id}`}
        />
      ) : (
        <ActivityActionCard
          slotId={`bout_${activity.id}`}
          label="Underground Bout"
          helperText={helperText}
          icon="🥊"
          visualVariant={visualVariant}
          assignedResidentId={assignedResidentId}
          assignedResidentName={assignedResident?.id}
          progressFraction={progressFraction}
          elapsedSeconds={elapsedSeconds}
          totalDurationSeconds={totalDurationSeconds}
          variant="detail"
          canAcceptDrop={true}
          disabled={assignedResidentId ? !canStart && !isPlaying : undefined}
          ctaLabel={ctaLabel}
          onClick={handleClick}
          onWorkerDrop={onWorkerDrop}
          onHoverChange={onHoverChange}
          riskStripeMetrics={undefined} // Replaced by RiskStripe
        />
      )}
      <div className="absolute top-4 right-4">
        <RiskStripe riskData={riskData} />
      </div>
    </div>
  );
};

export default BoutCard;
