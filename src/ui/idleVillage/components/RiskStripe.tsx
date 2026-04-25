import React, { useMemo } from 'react';
import clsx from 'clsx';
import type { RiskStripeResult } from '@/ui/idleVillage/utils/riskMetrics';

/**
 * Props for the RiskStripe component.
 */
export interface RiskStripeProps {
  /** Calculated risk stripe data */
  riskData: RiskStripeResult;
  /** CSS class for the container */
  className?: string;
  /** Whether to animate changes */
  animate?: boolean;
}

/**
 * Vertical risk stripes component for injury/death visualization.
 * Displays proportional heights with yellow (injury) and red (death) stripes.
 * Config-first, uses Observatory tokens, respects prefers-reduced-motion.
 */
const RiskStripe: React.FC<RiskStripeProps> = ({
  riskData,
  className,
  animate = true,
}) => {
  const { injuryHeight, deathHeight, injuryColor, deathColor, ariaLabel, warnings } = riskData;

  const containerStyle = useMemo(() => ({
    position: 'relative' as const,
    height: '100%',
    width: '8px', // thin vertical stripe
    backgroundColor: 'var(--panel-border, rgba(255, 255, 255, 0.08))',
    borderRadius: '4px',
  }), []);

  const injuryStyle = useMemo(() => ({
    position: 'absolute' as const,
    bottom: 0,
    left: 0,
    right: 0,
    height: `${injuryHeight}%`,
    backgroundColor: injuryColor,
    borderRadius: '0 0 4px 4px',
    transition: animate ? 'height 300ms ease' : 'none',
  }), [injuryHeight, injuryColor, animate]);

  const deathStyle = useMemo(() => ({
    position: 'absolute' as const,
    bottom: `${injuryHeight}%`,
    left: 0,
    right: 0,
    height: `${deathHeight}%`,
    backgroundColor: deathColor,
    borderRadius: '4px 4px 0 0',
    transition: animate ? 'height 300ms ease, bottom 300ms ease' : 'none',
  }), [injuryHeight, deathHeight, deathColor, animate]);

  return (
    <div
      className={clsx('risk-stripe', className)}
      style={containerStyle}
      role="img"
      aria-label={ariaLabel}
      title={warnings.length > 0 ? warnings.join('; ') : undefined}
    >
      <div style={injuryStyle} />
      <div style={deathStyle} />
    </div>
  );
};

export default RiskStripe;
