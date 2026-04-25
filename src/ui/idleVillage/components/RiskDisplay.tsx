/**
 * Risk Display component for Phase 12 Idle Village.
 * Renders vertical stripes within quest polygons showing injury/death risk.
 * Config-first design with risk profiles and proportional visualization.
 */

import React from 'react';
import clsx from 'clsx';
import { useRiskProfile } from '@/ui/idleVillage/hooks/useRiskProfile';
import type { RiskMetrics } from '@/ui/idleVillage/utils/riskMetrics';
import styles from './RiskDisplay.module.css';

/**
 * Props for RiskDisplay component.
 */
export interface RiskDisplayProps {
  /** Injury and death risk percentages */
  riskMetrics: RiskMetrics;
  /** Optional risk profile ID (defaults to standard) */
  profileId?: string;
  /** CSS class for the container */
  className?: string;
  /** Whether to show tooltip on hover */
  showTooltip?: boolean;
  /** Whether to render as compact (smaller stripes) */
  compact?: boolean;
  /** Custom aria label for accessibility */
  ariaLabel?: string;
  /** Test ID for testing */
  testId?: string;
}

/**
 * Risk Display component with vertical stripes visualization.
 * Shows injury (yellow) and death (red) risk as proportional vertical stripes
 * within quest polygons. Config-first with risk profiles and thresholds.
 */
export const RiskDisplay: React.FC<RiskDisplayProps> = ({
  riskMetrics,
  profileId,
  className,
  showTooltip = true,
  compact = false,
  ariaLabel,
  testId = 'risk-display',
}) => {
  const {
    stripeData,
    riskLevel,
    cssClasses,
    isElevated,
    formattedRisk,
  } = useRiskProfile(riskMetrics, profileId);

  const containerClasses = clsx(
    styles.riskDisplay,
    styles[riskLevel],
    {
      [styles.compact]: compact,
      [styles.elevated]: isElevated,
    },
    cssClasses,
    className
  );

  const containerStyle = {
    '--injury-height': `${stripeData.injuryHeight}%`,
    '--death-height': `${stripeData.deathHeight}%`,
    '--injury-color': stripeData.injuryColor,
    '--death-color': stripeData.deathColor,
  } as React.CSSProperties;

  const tooltipContent = (
    <div className={styles.tooltip}>
      <div className={styles.tooltipTitle}>Risk Assessment</div>
      <div className={styles.tooltipRow}>
        <span className={styles.tooltipLabel}>Injury:</span>
        <span className={styles.tooltipValue}>{formattedRisk.injury}</span>
      </div>
      <div className={styles.tooltipRow}>
        <span className={styles.tooltipLabel}>Death:</span>
        <span className={styles.tooltipValue}>{formattedRisk.death}</span>
      </div>
      <div className={styles.tooltipRow}>
        <span className={styles.tooltipLabel}>Total:</span>
        <span className={styles.tooltipValue}>{formattedRisk.total}</span>
      </div>
      {stripeData.warnings.length > 0 && (
        <div className={styles.tooltipWarnings}>
          {stripeData.warnings.map((warning, index) => (
            <div key={index} className={styles.tooltipWarning}>
              ⚠ {warning}
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div
      className={containerClasses}
      style={containerStyle}
      data-testid={testId}
      data-risk-level={riskLevel}
      data-injury-risk={riskMetrics.injuryPct}
      data-death-risk={riskMetrics.deathPct}
      role="img"
      aria-label={ariaLabel || stripeData.ariaLabel}
      title={showTooltip ? undefined : stripeData.ariaLabel}
    >
      {/* Injury stripe (yellow) */}
      <div
        className={styles.stripe}
        data-testid="injury-stripe"
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: `var(--injury-height)`,
          backgroundColor: `var(--injury-color)`,
          borderRadius: compact ? '2px 2px 0 0' : '4px 4px 0 0',
        }}
      />

      {/* Death stripe (red) */}
      <div
        className={styles.stripe}
        data-testid="death-stripe"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: `var(--death-height)`,
          backgroundColor: `var(--death-color)`,
          borderRadius: compact ? '0 0 2px 2px' : '0 0 4px 4px',
        }}
      />

      {/* Risk level indicator */}
      {!compact && (
        <div
          className={styles.riskIndicator}
          data-testid="risk-indicator"
        >
          <span className={styles.riskLevel}>{riskLevel}</span>
        </div>
      )}

      {/* Tooltip */}
      {showTooltip && (
        <div className={styles.tooltipContainer}>
          {tooltipContent}
        </div>
      )}

      {/* Fallback for low risk */}
      {riskMetrics.injuryPct === 0 && riskMetrics.deathPct === 0 && (
        <div
          className={styles.lowRiskFallback}
          data-testid="low-risk-fallback"
        >
          <span className={styles.lowRiskText}>Low Risk</span>
        </div>
      )}
    </div>
  );
};

export default RiskDisplay;
