import ActionCardBase, { type ActionCardBaseProps } from '../ActionCardBase';
import ActionProgressBar from '../ActionProgressBar';
import ActionHalo from '../ActionHalo';
import { formatMiniCardCountdown } from '../cardFormatting';
import { buildTimeMetrics, resolveMetrics } from './shared';

export type QuestCardProps = ActionCardBaseProps & {
  progressFraction: number;
  elapsedSeconds: number;
  totalDurationSeconds: number;
  injuryPercentage?: number;
  deathPercentage?: number;
};

/**
 * Quest wrapper that composes ActionCardBase + ActionProgressBar + ActionHalo.
 * Enables risk stripes, collect CTA, and telemetry forwarding.
 */
export function QuestCard({
  progressFraction,
  elapsedSeconds,
  totalDurationSeconds,
  injuryPercentage = 0,
  deathPercentage = 0,
  metrics,
  assignees,
  assigneeDisplayLimit,
  statusLabel,
  dataTestId,
  pillar,
  dropState,
  ...rest
}: QuestCardProps) {
  const fallbackMetrics = buildTimeMetrics(progressFraction, elapsedSeconds, totalDurationSeconds);

  const totalRisk = injuryPercentage + deathPercentage;
  const riskScale = totalRisk > 100 ? 100 / totalRisk : 1;
  const injuryWidth = injuryPercentage * riskScale;
  const deathWidth = deathPercentage * riskScale;

  return (
    <ActionCardBase
      label={rest.label}
      icon={rest.icon}
      subtitle={rest.subtitle}
      helperText={rest.helperText}
      assignees={assignees}
      assigneeDisplayLimit={assigneeDisplayLimit}
      statusLabel={statusLabel}
      metrics={resolveMetrics(metrics, fallbackMetrics)}
      dataTestId={dataTestId ?? 'quest-action-card'}
      pillar={pillar}
      dropState={dropState}
    >
      {/* Progress ring */}
      <ActionProgressBar
        progressFraction={progressFraction}
        elapsedSeconds={elapsedSeconds}
        totalDurationSeconds={totalDurationSeconds}
        variant="amethyst"
        countdownFormatter={formatMiniCardCountdown}
        countdownFontSizePx={9}
        pillar={pillar}
      />
      
      {/* Halo for map POI */}
      <ActionHalo
        iconText="QUEST"
        size={32}
        ringWidth={4}
        pillar={pillar}
        enableBloom={true}
      />
      
      {/* Risk stripes overlay */}
      {(injuryPercentage > 0 || deathPercentage > 0) && (
        <div
          data-testid="quest-risk-stripes"
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            width: '100%',
            height: '4px',
            display: 'flex',
            borderRadius: '0 0 4px 4px',
            overflow: 'hidden',
          }}
        >
          {injuryPercentage > 0 && (
            <div
              data-testid="quest-injury-risk"
              style={{
                backgroundColor: 'rgba(251, 191, 36, 0.8)',
                height: '100%',
                width: `${injuryWidth}%`,
              }}
            />
          )}
          {deathPercentage > 0 && injuryPercentage > 0 && (
            <div
              data-testid="quest-death-risk"
              style={{
                backgroundColor: 'rgba(239, 68, 68, 0.8)',
                height: '100%',
                width: `${deathWidth}%`,
              }}
            />
          )}
          {deathPercentage > 0 && injuryPercentage === 0 && (
            <div
              data-testid="quest-death-risk"
              style={{
                backgroundColor: 'rgba(239, 68, 68, 0.8)',
                height: '100%',
                width: `${deathWidth}%`,
              }}
            />
          )}
        </div>
      )}
    </ActionCardBase>
  );
}

export default QuestCard;
