import React, { useMemo, useCallback } from 'react';
import type { ActivityDefinition, IdleVillageConfig } from '@/balancing/config/idleVillage/types';
import type { VillageState } from '@/engine/game/idleVillage/TimeEngine';
import ActivityActionCard from '@/ui/idleVillage/components/ActivityActionCard';
import { ActionCardWrapper } from '@/ui/idleVillage/components/ActionCardWrapper';

/**
 * Props for the Gym Shift Card component.
 */
export interface GymShiftCardProps {
  /** The Gym Shift activity definition from config */
  activity: ActivityDefinition;
  /** Current village state for resident availability and assignments */
  villageState: VillageState;
  /** Idle Village config for rules and resources */
  config: IdleVillageConfig;
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
  /** Callback to toggle start/pause */
  onTogglePlay?: () => void;
  /** Callback on card hover */
  onHoverChange?: (isHovering: boolean) => void;
  /** Visual variant for the card */
  visualVariant?: 'azure' | 'ember' | 'jade' | 'amethyst' | 'solar';
}

/**
 * Gym Shift Card component for Punch Club realistic gameplay.
 *
 * Displays Gym Shift activity with costs (food), rewards (gold), fatigue impact,
 * and start/pause controls. Config-first design using activity definition.
 */
const GymShiftCard: React.FC<GymShiftCardProps> = ({
  activity,
  villageState,
  config: _config,
  residents,
  isPlaying,
  assignedResidentId,
  progressFraction,
  elapsedSeconds,
  totalDurationSeconds,
  onWorkerDrop,
  onTogglePlay,
  onHoverChange,
  visualVariant = 'ember', // Ember for training/fire theme
}) => {
  const assignedResident = assignedResidentId ? villageState.residents[assignedResidentId] : null;

  // Calculate costs and rewards from activity definition
  const costs = useMemo(() => {
    const foodCost = Number(activity.costs?.find(c => c.resourceId === 'food')?.amountFormula) || 0;
    const goldReward = Number(activity.rewards?.find(r => r.resourceId === 'gold')?.amountFormula) || 0;
    return { foodCost, goldReward };
  }, [activity.costs, activity.rewards]);

  // Calculate fatigue impact from activity metadata
  const fatigueImpact = useMemo(() => {
    // From Punch Club plan: fatigue gain 18-22
    const meta = activity.metadata as { fatigueGainMin?: number; fatigueGainMax?: number } | undefined;
    const min = meta?.fatigueGainMin ?? 18;
    const max = meta?.fatigueGainMax ?? 22;
    return { min, max };
  }, [activity.metadata]);

  // Determine if can start (has assigned resident, has food, etc.)
  const canStart = useMemo(() => {
    if (!assignedResident) return false;
    if (assignedResident.status !== 'available') return false;

    // Check food cost
    const villageFood = villageState.resources?.food ?? 0;
    if (villageFood < costs.foodCost) return false;

    return true;
  }, [assignedResident, villageState.resources, costs.foodCost]);

  // CTA label based on state
  const ctaLabel = useMemo(() => {
    if (isPlaying) return 'PAUSE';
    if (!assignedResident) return 'ASSIGN WORKER';
    if (!canStart) return 'CANNOT START';
    return 'START GYM SHIFT';
  }, [isPlaying, assignedResident, canStart]);

  // Risk stripes for injury (low risk for gym)
  const riskPercentages = useMemo(() => ({
    injury: 2, // Low injury risk for gym training
    death: 0,
  }), []);

  // Handle CTA click
  const handleClick = useCallback(() => {
    if (isPlaying || (!assignedResident && !canStart)) return;
    onTogglePlay?.();
  }, [isPlaying, assignedResident, canStart, onTogglePlay]);

  // Helper text with costs/rewards
  const helperText = useMemo(() => {
    const parts: string[] = [];
    if (costs.foodCost > 0) parts.push(`-${costs.foodCost} Food`);
    if (costs.goldReward > 0) parts.push(`+${costs.goldReward} Gold`);
    if (fatigueImpact.min > 0) parts.push(`+${fatigueImpact.min}-${fatigueImpact.max} Fatigue`);
    return parts.length > 0 ? parts.join(' • ') : null;
  }, [costs, fatigueImpact]);

  return (
    <>
      {residents ? (
        <ActionCardWrapper
          activity={activity}
          config={_config}
          residents={residents}
          onCollect={handleClick}
          dataTestId={`gym-${activity.id}`}
        />
      ) : (
        <ActivityActionCard
          slotId={`gym_${activity.id}`}
          label="Gym Shift"
          helperText={helperText}
          icon="🏋️"
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
          riskPercentages={riskPercentages}
        />
      )}
    </>
  );
};

export default GymShiftCard;
