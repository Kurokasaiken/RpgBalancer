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
import { useTranslation } from '@/localization/useTranslation';

interface RiskDisplayTelemetryEvent {
  type: string;
  questId: string;
  injuryPercentage?: number;
  deathPercentage?: number;
  riskLevel: 'LOW' | 'MED' | 'HIGH';
  timestamp: number;
  stripeType?: 'injury' | 'death';
  percentage?: number;
  showStripes?: boolean;
  stripeHeights?: { injury: number; death: number };
  configSource?: string;
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
  /** Explicit SVG height for the risk polygon */
  polygonHeight?: number;
  /** Explicit SVG width for the risk polygon */
  polygonWidth?: number;
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
  polygonHeight: polygonHeightProp,
  polygonWidth: polygonWidthProp,
}) => {
  const { t } = useTranslation('idleVillage');
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

  // Calculate polygon dimensions from optional props or config
  const polygonWidth = polygonWidthProp ?? config.polygon.polygonRadius * 2;
  const polygonHeight = polygonHeightProp ?? config.polygon.polygonRadius * 2;
  const polygonRadius = Math.min(polygonWidth, polygonHeight) / 2;
  const centerX = polygonWidth / 2;
  const centerY = polygonHeight / 2;

  // Calculate stripe dimensions and risk data
  const riskData = useMemo(() => {
    const shouldShow = shouldShowRiskStripes(injuryPercentage, deathPercentage, config);
    const riskLevel = calculateRiskLevel(injuryPercentage, deathPercentage);

    const polygonPoints = generatePolygonPoints(config.polygon.polygonSides, polygonRadius, centerX, centerY);

    if (!shouldShow) {
      return {
        shouldShow: false,
        injuryStripeLength: 0,
        deathStripeLength: 0,
        riskLevel,
        polygonPoints,
        polygonWidth,
        polygonHeight,
        polygonRadius,
        centerX,
        centerY,
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
      const startX = centerX - stripeLength / 2;
      const endX = centerX + stripeLength / 2;
      const y = centerY + (i - 0.5) * (config.polygon.stripeWidthPercent / 100 * polygonRadius);

      stripePositions.push({
        startX,
        endX,
        y,
        color: stripeColor,
        type: stripeType,
        percentage: stripeType === 'injury' ? injuryPercentage : deathPercentage,
        length: stripeLength,
      });
    }

    return {
      shouldShow: true,
      injuryStripeLength: injuryLength,
      deathStripeLength: deathLength,
      riskLevel,
      polygonPoints,
      polygonWidth,
      polygonHeight,
      polygonRadius,
      centerX,
      centerY,
      stripePositions,
    };
  }, [injuryPercentage, deathPercentage, config, polygonWidth, polygonHeight, polygonRadius, centerX, centerY]);

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
    const clickConfigSource = testMode ? 'test' : customConfig ? 'custom' : 'default';
    diagnostics.log('stripe_click', {
      timestamp: Date.now(),
      questId,
      injuryPercentage,
      deathPercentage,
      injuryStripeLength: riskData.injuryStripeLength,
      deathStripeLength: riskData.deathStripeLength,
      polygonRadius: riskData.polygonRadius,
      stripesVisible: riskData.shouldShow,
      riskLevel: riskData.riskLevel,
      configSource: clickConfigSource,
      stripeType: type,
      stripePercentage: percentage,
    });
  }, [
    config.animation.clickableStripes,
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
    riskData.polygonRadius,
    riskData.riskLevel,
    riskData.shouldShow,
    testMode,
  ]);

  // Handle keyboard activation of stripes
  const handleStripeKeyDown = useCallback((event: React.KeyboardEvent<SVGRectElement>, type: 'injury' | 'death', percentage: number) => {
    if (event.key === 'Enter' || event.key === ' ' || event.key === 'Spacebar') {
      event.preventDefault();
      handleStripeClick(type, percentage);
    }
  }, [handleStripeClick]);

  // Emit render telemetry
  React.useEffect(() => {
    const configSource = testMode ? 'test' : customConfig ? 'custom' : 'default';
    if (config.telemetry.enabled && config.telemetry.trackRenders && onTelemetry) {
      onTelemetry({
        type: `${config.telemetry.eventPrefix}_render`,
        questId,
        injuryPercentage,
        deathPercentage,
        riskLevel: riskData.riskLevel,
        timestamp: Date.now(),
        showStripes: riskData.shouldShow,
        stripeHeights: {
          injury: riskData.injuryStripeLength,
          death: riskData.deathStripeLength,
        },
        configSource,
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
      polygonRadius: riskData.polygonRadius,
      stripesVisible: riskData.shouldShow,
      riskLevel: riskData.riskLevel,
      configSource,
    });
  }, [
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
    riskData.polygonRadius,
    riskData.riskLevel,
    riskData.shouldShow,
    testMode,
  ]);

  const transitionDuration = config.animation.enabled ? `${config.animation.durationMs}ms` : '0ms';
  const transitionStyle: React.CSSProperties = {
    transitionDuration,
    transitionProperty: 'all',
    transitionTimingFunction: config.animation.easing,
  };

  // Don't render if no risk stripes should be shown
  if (!riskData.shouldShow) {
    return (
      <div
        className={clsx('relative flex items-center justify-center', className)}
        data-testid="quest-risk-display"
        data-quest-id={questId}
        data-injury-pct={injuryPercentage}
        data-death-pct={deathPercentage}
        data-show-stripes="false"
        style={{ width: riskData.polygonWidth, height: riskData.polygonHeight }}
      >
        <svg
          width={riskData.polygonWidth}
          height={riskData.polygonHeight}
          className="drop-shadow-sm"
          style={transitionStyle}
        >
          <polygon
            points={riskData.polygonPoints}
            fill={config.colors.zeroRiskColor}
            stroke={config.colors.borderColor}
            strokeWidth="2"
            className="transition-all"
          />
          <text
            x={riskData.centerX}
            y={riskData.centerY}
            textAnchor="middle"
            dominantBaseline="middle"
            className="text-xs fill-slate-400 font-medium"
          >
            {t('idleVillage:questRisk.noRisk', { defaultValue: 'No Risk' })}
          </text>
        </svg>
      </div>
    );
  }

  return (
    <div
      className={clsx('relative', className)}
      data-testid="quest-risk-display"
      data-quest-id={questId}
      data-injury-pct={injuryPercentage}
      data-death-pct={deathPercentage}
      data-show-stripes="true"
      data-risk-level={riskData.riskLevel}
      style={{ width: riskData.polygonWidth, height: riskData.polygonHeight }}
    >
      <svg
        width={riskData.polygonWidth}
        height={riskData.polygonHeight}
        className="drop-shadow-sm"
        style={transitionStyle}
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
              y={stripe.y - (config.polygon.stripeWidthPercent / 100 * riskData.polygonRadius) / 2}
              width={stripe.endX - stripe.startX}
              height={config.polygon.stripeWidthPercent / 100 * riskData.polygonRadius}
              fill={stripe.color}
              style={{ fill: stripe.color, ...transitionStyle }}
              rx={config.polygon.stripeBorderRadius === '2px' ? 2 : 1}
              className={clsx(
                'cursor-pointer transition-all',
                config.animation.hover.enabled && 'hover:opacity-80 hover:scale-105'
              )}
              onClick={() => handleStripeClick(stripe.type, stripe.percentage)}
              onKeyDown={(e) => handleStripeKeyDown(e, stripe.type, stripe.percentage)}
              data-testid={`${stripe.type}-stripe`}
              data-stripe-type={stripe.type}
              data-stripe-percentage={stripe.percentage}
              data-stripe-height={stripe.length}
              role="button"
              tabIndex={0}
              aria-label={t(
                `idleVillage:questRisk.stripeAriaLabel.${stripe.type}` as any,
                { percent: stripe.percentage, defaultValue: `${stripe.type === 'injury' ? 'Injury' : 'Death'} risk: {percent}%` }
              )}
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
          x={riskData.centerX}
          y={riskData.centerY * 0.3}
          textAnchor="middle"
          dominantBaseline="middle"
          className={clsx(
            'text-xs font-bold',
            riskData.riskLevel === 'HIGH' ? 'fill-red-500' :
            riskData.riskLevel === 'MED' ? 'fill-amber-500' :
            'fill-slate-600'
          )}
        >
          {t(`idleVillage:questRisk.level.${riskData.riskLevel.toLowerCase()}` as any, { defaultValue: riskData.riskLevel })}
        </text>
      </svg>
    </div>
  );
};

export default QuestRiskDisplay;
