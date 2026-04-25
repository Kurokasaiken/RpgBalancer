import ActionCardBase from '../ActionCardBase';
import ActionProgressBar from '../ActionProgressBar';
import ActionHalo from '../ActionHalo';
import type { ActionCardProps } from '../ActionCard';
import { formatMiniCardCountdown } from '../cardFormatting';
import { buildTimeMetrics, resolveMetrics } from './shared';

export interface MaintenanceCardProps extends Omit<
  ActionCardProps,
  | 'variant'
  | 'showStats'
  | 'hideHeader'
  | 'showStatusLabel'
  | 'countdownFontSizePx'
  | 'countdownFormatter'
  | 'chromeless'
  | 'injuryPercentage'
  | 'deathPercentage'
> {
  upkeepLabel?: string;
  upkeepValue?: string;
  warningLabel?: string;
  warningValue?: string;
}

/**
 * Maintenance wrapper for hunger/injury upkeep with solar variant and CTA support.
 */
export function MaintenanceCard({
  progressFraction,
  elapsedSeconds,
  totalDurationSeconds,
  metrics,
  assignees,
  assigneeDisplayLimit,
  statusLabel,
  dataTestId,
  pillar,
  dropState,
  _onStatusChange,
  _onCollect,
  _collectLabel,
  _collectDisabled,
  upkeepLabel,
  upkeepValue,
  warningLabel,
  warningValue,
  ...rest
}: MaintenanceCardProps) {
  const timeMetrics = buildTimeMetrics(progressFraction, elapsedSeconds, totalDurationSeconds);
  const customMetrics = [
    upkeepLabel && upkeepValue ? { label: upkeepLabel, value: upkeepValue } : null,
    warningLabel && warningValue ? { label: warningLabel, value: warningValue } : null,
  ];

  return (
    <ActionCardBase
      label={rest.label}
      icon={rest.icon}
      subtitle={rest.subtitle}
      helperText={rest.helperText}
      assignees={assignees}
      assigneeDisplayLimit={assigneeDisplayLimit}
      statusLabel={statusLabel}
      metrics={resolveMetrics(metrics, [...customMetrics, ...timeMetrics])}
      dataTestId={dataTestId ?? 'maintenance-action-card'}
      pillar={pillar}
      dropState={dropState}
    >
      {/* Progress ring */}
      <ActionProgressBar
        progressFraction={progressFraction}
        elapsedSeconds={elapsedSeconds}
        totalDurationSeconds={totalDurationSeconds}
        variant="ember"
        countdownFormatter={formatMiniCardCountdown}
        countdownFontSizePx={9}
        pillar={pillar}
      />
      
      {/* Halo for map POI */}
      <ActionHalo
        iconText="MAINT"
        size={32}
        ringWidth={4}
        pillar={pillar}
        enableBloom={true}
      />
    </ActionCardBase>
  );
}

export default MaintenanceCard;
