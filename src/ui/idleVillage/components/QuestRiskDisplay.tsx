/**
 * Quest Risk Display Component
 * 
 * Renders risk stripes inside a polygon proportional to injury and death percentages.
 * Config-first design with polygon-based visualization, animations, and telemetry.
 * 
 * @since IV-QuestRisk-stripes
 */

import React, { useMemo, useCallback } from 'react';
import clsx from 'clsx';
import type { RiskDisplayConfig, RiskDisplayDiagnostics } from '@/balancing/config/idleVillage/riskDisplayConfig';
import {
  DEFAULT_RISK_DISPLAY_CONFIG,
  TEST_RISK_DISPLAY_CONFIG,
  calculateStripeLength,
  shouldShowRiskStripes,
  calculateRiskLevel,
  generatePolygonPoints,
  validateRiskDisplayConfig,
} from '@/balancing/config/idleVillage/riskDisplayConfig';
import { createSandboxDiagnostics } from '@/ui/idleVillage/utils/sandboxDiagnostics';

interface RiskDisplayTelemetryEvent {
  type: string;
  questId: string;
  injuryPercentage?: number;
  deathPercentage?: number;
  riskLevel: 'LOW' | 'MED' | 'HIGH';
  timestamp: number;
  stripeType?: 'injury' | 'death';
  percentage?: number;
}

export interface QuestRiskDisplayProps {
  /** Unique identifier for the quest */
  questId: string;
  /** Injury risk percentage (0-100) */
  injuryPercentage: number;
  /** Death risk percentage (0-100) */
  deathPercentage: number;
  /** Optional custom configuration (uses default if not provided) */
  config?: Partial<RiskDisplayConfig>;
  /** Whether to run in test mode (uses test config) */
  testMode?: boolean;
  /** Optional className for styling overrides */
  className?: string;
  /** Callback for risk stripe clicks */
  onStripeClick?: (type: 'injury' | 'death', percentage: number) => void;
  /** Callback for telemetry events */
  onTelemetry?: (event: RiskDisplayTelemetryEvent) => void;
}

/**
 * Quest risk display component showing proportional polygon stripes.
 *
 * Renders yellow and red stripes inside an SVG polygon proportional to injury
 * and death percentages. Polygon shape provides clear visual boundaries for
 * risk assessment with configurable sides, radius, and stripe positioning.
 *
 * @param props - Component props
 * @returns React component
 */
export const QuestRiskDisplay: React.FC<QuestRiskDisplayProps> = ({
  questId,
  injuryPercentage,
  deathPercentage,
  config: customConfig,
  testMode = false,
  className,
  onStripeClick,
  onTelemetry,
}) => {
  // Merge configuration with appropriate defaults
  const config = useMemo(() => {
    const baseConfig = testMode ? TEST_RISK_DISPLAY_CONFIG : DEFAULT_RISK_DISPLAY_CONFIG;
    const merged = { ...baseConfig, ...customConfig };
    
    if (!validateRiskDisplayConfig(merged)) {
      console.warn('[QuestRiskDisplay] Invalid config, falling back to defaults');
      return baseConfig;
    }
    
    return merged;
  }, [customConfig, testMode]);

  // Initialize diagnostics
  const diagnostics = useMemo(
    () => createSandboxDiagnostics<RiskDisplayDiagnostics>('QuestRiskDisplay', 'risk'),
    []
  );

  // Calculate stripe dimensions and risk data
  const riskData = useMemo(() => {
    const shouldShow = shouldShowRiskStripes(injuryPercentage, deathPercentage, config);
    const riskLevel = calculateRiskLevel(injuryPercentage, deathPercentage);

    if (!shouldShow) {
      return {
        shouldShow: false,
        injuryStripeLength: 0,
        deathStripeLength: 0,
        riskLevel,
        polygonPoints: generatePolygonPoints(config.polygon.polygonSides, config.polygon.polygonRadius),
        stripePositions: [],
      };
    }

    const injuryLength = calculateStripeLength(injuryPercentage, config);
    const deathLength = calculateStripeLength(deathPercentage, config);

    // Calculate stripe positions inside the polygon
    const stripePositions = [];
    const totalStripes = 2; // injury and death

    for (let i = 0; i < totalStripes; i++) {
      const stripeType: 'injury' | 'death' = i === 0 ? 'injury' : 'death';
      const stripeLength = stripeType === 'injury' ? injuryLength : deathLength;
      const stripeColor = stripeType === 'injury' ? config.colors.injuryColor : config.colors.deathColor;

      // Calculate stripe start and end positions
      const centerX = config.polygon.polygonRadius;
      const centerY = config.polygon.polygonRadius;
      const startX = centerX - stripeLength / 2;
      const endX = centerX + stripeLength / 2;
      const y = centerY + (i - 0.5) * (config.polygon.stripeWidthPercent / 100 * config.polygon.polygonRadius);

      stripePositions.push({
        startX,
        endX,
        y,
        color: stripeColor,
        type: stripeType,
        percentage: stripeType === 'injury' ? injuryPercentage : deathPercentage,
      });
    }

    return {
      shouldShow: true,
      injuryStripeLength: injuryLength,
      deathStripeLength: deathLength,
      riskLevel,
      polygonPoints: generatePolygonPoints(config.polygon.polygonSides, config.polygon.polygonRadius),
      stripePositions,
    };
  }, [injuryPercentage, deathPercentage, config]);

  // Handle stripe clicks
  const handleStripeClick = useCallback((type: 'injury' | 'death', percentage: number) => {
    if (config.animation.clickableStripes && onStripeClick) {
      onStripeClick(type, percentage);
    }

    // Emit telemetry event
    if (config.telemetry.enabled && config.telemetry.trackClicks && onTelemetry) {
      onTelemetry({
        type: `${config.telemetry.eventPrefix}_stripe_click`,
        questId,
        stripeType: type,
        percentage,
        timestamp: Date.now(),
        riskLevel: riskData.riskLevel,
      });
    }

    // Log diagnostics
    diagnostics.log('stripe_click', {
      timestamp: Date.now(),
      questId,
      injuryPercentage,
      deathPercentage,
      injuryStripeLength: riskData.injuryStripeLength,
      deathStripeLength: riskData.deathStripeLength,
      polygonRadius: config.polygon.polygonRadius,
      stripesVisible: riskData.shouldShow,
      riskLevel: riskData.riskLevel,
      configSource: testMode ? 'test' : customConfig ? 'custom' : 'default',
      stripeType: type,
      stripePercentage: percentage,
    });
  }, [
    config.animation.clickableStripes,
    config.polygon.polygonRadius,
    config.telemetry.enabled,
    config.telemetry.eventPrefix,
    config.telemetry.trackClicks,
    customConfig,
    deathPercentage,
    diagnostics,
    injuryPercentage,
    onStripeClick,
    onTelemetry,
    questId,
    riskData.deathStripeLength,
    riskData.injuryStripeLength,
    riskData.riskLevel,
    riskData.shouldShow,
    testMode,
  ]);

  // Emit render telemetry
  React.useEffect(() => {
    if (config.telemetry.enabled && config.telemetry.trackRenders && onTelemetry) {
      onTelemetry({
        type: `${config.telemetry.eventPrefix}_render`,
        questId,
        injuryPercentage,
        deathPercentage,
        riskLevel: riskData.riskLevel,
        timestamp: Date.now(),
      });
    }

    // Log render diagnostics
    diagnostics.log('render', {
      timestamp: Date.now(),
      questId,
      injuryPercentage,
      deathPercentage,
      injuryStripeLength: riskData.injuryStripeLength,
      deathStripeLength: riskData.deathStripeLength,
      polygonRadius: config.polygon.polygonRadius,
      stripesVisible: riskData.shouldShow,
      riskLevel: riskData.riskLevel,
      configSource: testMode ? 'test' : customConfig ? 'custom' : 'default',
    });
  }, [
    config.polygon.polygonRadius,
    config.telemetry.enabled,
    config.telemetry.eventPrefix,
    config.telemetry.trackRenders,
    customConfig,
    deathPercentage,
    diagnostics,
    injuryPercentage,
    onTelemetry,
    questId,
    riskData.deathStripeLength,
    riskData.injuryStripeLength,
    riskData.riskLevel,
    riskData.shouldShow,
    testMode,
  ]);

  // Don't render if no risk stripes should be shown
  if (!riskData.shouldShow) {
    const svgSize = config.polygon.polygonRadius * 2;
    return (
      <div
        className={clsx('relative flex items-center justify-center', className)}
        data-testid="quest-risk-display"
        data-quest-id={questId}
        data-injury-pct={injuryPercentage}
        data-death-pct={deathPercentage}
        data-show-stripes="false"
      >
        <svg
          width={svgSize}
          height={svgSize}
          className="drop-shadow-sm"
          style={{
            transition: config.animation.enabled ? `all ${config.animation.durationMs}ms ${config.animation.easing}` : 'none',
          }}
        >
          <polygon
            points={riskData.polygonPoints}
            fill={config.colors.zeroRiskColor}
            stroke={config.colors.borderColor}
            strokeWidth="2"
            className="transition-all"
          />
          <text
            x={config.polygon.polygonRadius}
            y={config.polygon.polygonRadius}
            textAnchor="middle"
            dominantBaseline="middle"
            className="text-xs fill-slate-400 font-medium"
          >
            No Risk
          </text>
        </svg>
      </div>
    );
  }

  const svgSize = config.polygon.polygonRadius * 2;

  return (
    <div
      className={clsx('relative', className)}
      data-testid="quest-risk-display"
      data-quest-id={questId}
      data-injury-pct={injuryPercentage}
      data-death-pct={deathPercentage}
      data-show-stripes="true"
      data-risk-level={riskData.riskLevel}
    >
      <svg
        width={svgSize}
        height={svgSize}
        className="drop-shadow-sm"
        style={{
          transition: config.animation.enabled ? `all ${config.animation.durationMs}ms ${config.animation.easing}` : 'none',
        }}
      >
        {/* Background polygon */}
        <polygon
          points={riskData.polygonPoints}
          fill={config.colors.backgroundColor}
          stroke={config.colors.borderColor}
          strokeWidth="2"
          className="transition-all"
        />

        {/* Risk stripes */}
        {riskData.stripePositions.map((stripe, index) => (
          <g key={`${stripe.type}-${index}`}>
            {/* Stripe rectangle */}
            <rect
              x={stripe.startX}
              y={stripe.y - (config.polygon.stripeWidthPercent / 100 * config.polygon.polygonRadius) / 2}
              width={stripe.endX - stripe.startX}
              height={config.polygon.stripeWidthPercent / 100 * config.polygon.polygonRadius}
              fill={stripe.color}
              rx={config.polygon.stripeBorderRadius === '2px' ? 2 : 1}
              className={clsx(
                'cursor-pointer transition-all',
                config.animation.hover.enabled && 'hover:opacity-80 hover:scale-105'
              )}
              style={{
                transition: config.animation.enabled ? `all ${config.animation.durationMs}ms ${config.animation.easing}` : 'none',
              }}
              onClick={() => handleStripeClick(stripe.type, stripe.percentage)}
              data-testid={`${stripe.type}-stripe`}
              data-stripe-type={stripe.type}
              data-stripe-percentage={stripe.percentage}
            />

            {/* Percentage label */}
            {config.showPercentageLabels && stripe.percentage >= 5 && (
              <text
                x={(stripe.startX + stripe.endX) / 2}
                y={stripe.y}
                textAnchor="middle"
                dominantBaseline="middle"
                className="text-xs font-semibold fill-white drop-shadow-md pointer-events-none"
                style={{ fontSize: '10px' }}
              >
                {stripe.percentage.toFixed(0)}%
              </text>
            )}
          </g>
        ))}

        {/* Risk level indicator */}
        <text
          x={config.polygon.polygonRadius}
          y={config.polygon.polygonRadius * 0.3}
          textAnchor="middle"
          dominantBaseline="middle"
          className={clsx(
            'text-xs font-bold',
            riskData.riskLevel === 'HIGH' ? 'fill-red-500' :
            riskData.riskLevel === 'MED' ? 'fill-amber-500' :
            'fill-slate-600'
          )}
        >
          {riskData.riskLevel}
        </text>
      </svg>
    </div>
  );
};

export default QuestRiskDisplay;
