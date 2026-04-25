/**
 * Quest Risk Badge Component
 * 
 * Config-first risk badge component for quest feed with fallback support,
 * animations, and comprehensive accessibility features.
 * 
 * @since NP-011
 */

import React, { useMemo, useCallback, useEffect, useState } from 'react';
import clsx from 'clsx';
import type { 
  QuestRiskBadgeConfig, 
  QuestRiskBadgeData, 
  RiskBadgeDiagnostics,
  RiskLevel,
  RiskBadgeVariant,
  RiskBadgeAnimation,
  RiskBadgePosition
} from '@/balancing/config/idleVillage/questRiskBadgeConfig';
import {
  DEFAULT_QUEST_RISK_BADGE_CONFIG,
  TEST_QUEST_RISK_BADGE_CONFIG,
  getRiskLevelFromPercentage,
  calculateOverallRisk,
  validateRiskBadgeConfig,
  shouldShowRiskBadge,
  createFallbackRiskData,
  getRiskLevelColors,
} from '@/balancing/config/idleVillage/questRiskBadgeConfig';
import { createSandboxDiagnostics } from '@/ui/idleVillage/utils/sandboxDiagnostics';

/**
 * Props for the QuestRiskBadge component
 */
export interface QuestRiskBadgeProps {
  /** Quest identifier */
  questId: string;
  
  /** Injury risk percentage (0-100) */
  injuryRisk?: number;
  
  /** Death risk percentage (0-100) */
  deathRisk?: number;
  
  /** Optional custom configuration */
  config?: Partial<QuestRiskBadgeConfig>;
  
  /** Whether to run in test mode */
  testMode?: boolean;
  
  /** Badge variant override */
  variant?: RiskBadgeVariant;
  
  /** Badge position override */
  position?: RiskBadgePosition;
  
  /** Animation override */
  animation?: RiskBadgeAnimation;
  
  /** Optional className for styling overrides */
  className?: string;
  
  /** Whether to show percentage labels */
  showPercentages?: boolean;
  
  /** Whether to show risk level labels */
  showLabels?: boolean;
  
  /** Callback for badge clicks */
  onBadgeClick?: (riskData: QuestRiskBadgeData) => void;
  
  /** Callback for risk level changes */
  onRiskLevelChange?: (riskLevel: RiskLevel, previousRiskLevel: RiskLevel) => void;
  
  /** Whether to enable hover effects */
  enableHover?: boolean;
  
  /** Whether to enable animations */
  enableAnimations?: boolean;
}

/**
 * Quest risk badge component with config-first design and fallback support
 */
export const QuestRiskBadge: React.FC<QuestRiskBadgeProps> = ({
  questId,
  injuryRisk: rawInjuryRisk,
  deathRisk: rawDeathRisk,
  config: customConfig,
  testMode = false,
  variant: variantOverride,
  position: positionOverride,
  animation: animationOverride,
  className,
  showPercentages: showPercentagesOverride,
  showLabels: showLabelsOverride,
  onBadgeClick,
  onRiskLevelChange,
  enableHover = true,
  enableAnimations: enableAnimationsOverride,
}) => {
  // Merge configuration with appropriate defaults
  const config = useMemo(() => {
    const baseConfig = testMode ? TEST_QUEST_RISK_BADGE_CONFIG : DEFAULT_QUEST_RISK_BADGE_CONFIG;
    const merged = { ...baseConfig, ...customConfig };
    
    if (!validateRiskBadgeConfig(merged)) {
      console.warn('[QuestRiskBadge] Invalid config, falling back to defaults');
      return baseConfig;
    }
    
    return merged;
  }, [customConfig, testMode]);

  // Initialize diagnostics
  const diagnostics = useMemo(
    () => createSandboxDiagnostics<RiskBadgeDiagnostics>('QuestRiskBadge', 'risk'),
    []
  );

  // State for risk level change detection
  const [previousRiskLevel, setPreviousRiskLevel] = useState<RiskLevel>('unknown');
  const [renderStartTime] = useState<number>(() => Date.now());

  // Process risk data with fallback support
  const riskData = useMemo((): QuestRiskBadgeData => {
    // Check if we have valid risk data
    const hasValidData = 
      rawInjuryRisk !== undefined && 
      rawDeathRisk !== undefined && 
      !isNaN(rawInjuryRisk) && 
      !isNaN(rawDeathRisk) &&
      rawInjuryRisk >= 0 && rawInjuryRisk <= 100 &&
      rawDeathRisk >= 0 && rawDeathRisk <= 100;

    let injuryRisk: number;
    let deathRisk: number;
    let dataSource: QuestRiskBadgeData['dataSource'];
    let isFallback: boolean;

    if (hasValidData) {
      injuryRisk = rawInjuryRisk;
      deathRisk = rawDeathRisk;
      dataSource = 'telemetry';
      isFallback = false;
    } else if (config.fallback.enabled) {
      // Use fallback data
      const fallbackData = createFallbackRiskData(questId, config);
      injuryRisk = fallbackData.injuryRisk;
      deathRisk = fallbackData.deathRisk;
      dataSource = 'fallback';
      isFallback = true;
    } else {
      // No data and fallback disabled
      injuryRisk = 0;
      deathRisk = 0;
      dataSource = 'fallback';
      isFallback = true;
    }

    // Calculate overall risk
    const overallRisk = calculateOverallRisk(injuryRisk, deathRisk, config.calculationMethod);
    
    // Determine risk level
    const riskLevel = getRiskLevelFromPercentage(overallRisk, config.thresholds);

    const data: QuestRiskBadgeData = {
      questId,
      riskLevel,
      injuryRisk,
      deathRisk,
      overallRisk,
      dataSource,
      isFallback,
      timestamp: Date.now(),
      metadata: {
        calculationMethod: config.calculationMethod,
        confidence: isFallback ? 0.1 : 0.9,
      },
    };

    return data;
  }, [
    questId, 
    rawInjuryRisk, 
    rawDeathRisk, 
    config.fallback.enabled, 
    config.fallback.defaultRiskLevel,
    config.fallback.defaultPercentage,
    config.thresholds, 
    config.calculationMethod
  ]);

  // Check if badge should be shown
  const shouldShow = useMemo(() => {
    return shouldShowRiskBadge(riskData.overallRisk, config);
  }, [riskData.overallRisk, config]);

  // Get effective variant, position, and animation
  const effectiveVariant = variantOverride || config.defaultVariant;
  const effectivePosition = positionOverride || config.position;
  const effectiveAnimation = animationOverride || config.animation;
  const enableAnimations = enableAnimationsOverride ?? (config.animation !== 'none');

  // Get risk level colors
  const riskColors = useMemo(() => {
    return getRiskLevelColors(riskData.riskLevel, config.styling.colors);
  }, [riskData.riskLevel, config.styling.colors]);

  // Calculate badge styles
  const badgeStyles = useMemo(() => {
    const { size, spacing, typography } = config.styling;
    const { offset } = spacing;
    
    // Position styles
    const positionStyles: Record<RiskBadgePosition, React.CSSProperties> = {
      'top-left': { top: offset.y, left: offset.x },
      'top-right': { top: offset.y, right: offset.x },
      'bottom-left': { bottom: offset.y, left: offset.x },
      'bottom-right': { bottom: offset.y, right: offset.x },
      'overlay': { 
        top: '50%', 
        left: '50%', 
        transform: 'translate(-50%, -50%)' 
      },
    };

    // Variant size adjustments
    const sizeMultipliers: Record<RiskBadgeVariant, number> = {
      compact: 0.75,
      detailed: 1.25,
      minimal: 0.5,
      prominent: 1.5,
    };

    const multiplier = sizeMultipliers[effectiveVariant];
    const adjustedSize = {
      width: size.width * multiplier,
      height: size.height * multiplier,
      borderRadius: size.borderRadius * multiplier,
    };

    return {
      ...positionStyles[effectivePosition],
      width: `${adjustedSize.width}px`,
      height: `${adjustedSize.height}px`,
      borderRadius: `${adjustedSize.borderRadius}px`,
      backgroundColor: riskColors.background,
      borderColor: riskColors.border,
      fontSize: `${typography.fontSize * multiplier}px`,
      fontWeight: typography.fontWeight,
      fontFamily: typography.fontFamily,
      color: riskColors.text,
      margin: `${spacing.margin}px`,
      padding: `${spacing.padding * multiplier}px`,
      opacity: riskData.isFallback ? config.fallback.fallbackStyling.opacity : 1,
      borderStyle: riskData.isFallback ? config.fallback.fallbackStyling.borderStyle : 'solid',
      boxShadow: riskColors.glow && enableAnimations 
        ? `0 0 ${8 * multiplier}px ${riskColors.glow}` 
        : 'none',
    };
  }, [
    config.styling, 
    effectivePosition, 
    effectiveVariant, 
    riskColors, 
    riskData.isFallback, 
    config.fallback.fallbackStyling,
    enableAnimations,
    config
  ]);

  // Animation classes
  const animationClasses = useMemo(() => {
    if (!enableAnimations || effectiveAnimation === 'none') return '';
    
    switch (effectiveAnimation) {
      case 'pulse':
        return 'animate-pulse';
      case 'glow':
        return 'animate-glow';
      case 'attention':
        return 'animate-attention';
      default:
        return '';
    }
  }, [enableAnimations, effectiveAnimation]);

  // Handle badge clicks
  const handleBadgeClick = useCallback(() => {
    diagnostics.info('badge_clicked', {
      questId,
      riskLevel: riskData.riskLevel,
      injuryRisk: riskData.injuryRisk,
      deathRisk: riskData.deathRisk,
      overallRisk: riskData.overallRisk,
      dataSource: riskData.dataSource,
      isFallback: riskData.isFallback,
      timestamp: performance.now(),
    });
    
    onBadgeClick?.(riskData);
  }, [questId, riskData, onBadgeClick, diagnostics]);

  // Handle risk level changes
  useEffect(() => {
    if (riskData.riskLevel !== previousRiskLevel) {
      onRiskLevelChange?.(riskData.riskLevel, previousRiskLevel);
      setPreviousRiskLevel(riskData.riskLevel);
      
      diagnostics.info('risk_level_changed', {
        questId,
        riskLevel: riskData.riskLevel,
        injuryRisk: riskData.injuryRisk,
        deathRisk: riskData.deathRisk,
        overallRisk: riskData.overallRisk,
        dataSource: riskData.dataSource,
        isFallback: riskData.isFallback,
        timestamp: performance.now(),
      });
    }
  }, [riskData.riskLevel, previousRiskLevel, onRiskLevelChange, questId, riskData.overallRisk, diagnostics]);

  // Log diagnostics when component renders
  useEffect(() => {
    const diagnosticData: RiskBadgeDiagnostics = {
      timestamp: performance.now(),
      questId,
      riskLevel: riskData.riskLevel,
      injuryRisk: riskData.injuryRisk,
      deathRisk: riskData.deathRisk,
      overallRisk: riskData.overallRisk,
      dataSource: riskData.dataSource,
      isFallback: riskData.isFallback,
      renderTime: performance.now() - renderStartTime,
      cacheHit: false, // TODO: Implement caching
      configSource: testMode ? 'test' : customConfig ? 'custom' : 'default',
    };

    diagnostics.log('info', 'badge_rendered', diagnosticData);
  }, [
    questId,
    riskData,
    testMode,
    customConfig,
    diagnostics,
    renderStartTime,
  ]);

  // Don't render if badge shouldn't be shown
  if (!shouldShow) {
    return null;
  }

  // Determine what to show based on variant
  const showPercentages = showPercentagesOverride ?? config.showPercentages;
  const showLabels = showLabelsOverride ?? config.showLabels;

  // Generate badge content based on variant
  const getBadgeContent = () => {
    switch (effectiveVariant) {
      case 'minimal':
        return null; // Just color indicator
        
      case 'compact':
        return showLabels ? (
          <span className="text-xs font-bold">
            {riskData.riskLevel.charAt(0).toUpperCase()}
          </span>
        ) : null;
        
      case 'detailed':
        return (
          <div className="text-center">
            {showLabels && (
              <div className="text-xs font-bold leading-tight">
                {riskData.riskLevel.toUpperCase()}
              </div>
            )}
            {showPercentages && (
              <div className="text-xs leading-tight opacity-80">
                {riskData.overallRisk.toFixed(0)}%
              </div>
            )}
          </div>
        );
        
      case 'prominent':
        return (
          <div className="text-center">
            <div className="text-sm font-bold leading-tight">
              {riskData.riskLevel.toUpperCase()}
            </div>
            {showPercentages && (
              <div className="text-xs leading-tight opacity-80">
                {riskData.overallRisk.toFixed(1)}%
              </div>
            )}
            {riskData.isFallback && config.fallback.showFallbackIndicator && (
              <div className="text-xs leading-tight opacity-60">
                ?
              </div>
            )}
          </div>
        );
        
      default:
        return null;
    }
  };

  return (
    <div
      className={clsx(
        'absolute flex items-center justify-center cursor-pointer transition-all duration-200',
        enableHover && 'hover:scale-110 hover:z-10',
        animationClasses,
        riskData.isFallback && 'opacity-70',
        className
      )}
      style={badgeStyles}
      onClick={handleBadgeClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleBadgeClick();
        }
      }}
      aria-label={`${config.accessibility.ariaLabelPrefix}: ${riskData.riskLevel} (${riskData.overallRisk.toFixed(1)}%)`}
      data-testid="quest-risk-badge"
      data-quest-id={questId}
      data-risk-level={riskData.riskLevel}
      data-overall-risk={riskData.overallRisk}
      data-data-source={riskData.dataSource}
      data-is-fallback={riskData.isFallback}
      data-variant={effectiveVariant}
    >
      {getBadgeContent()}
      
      {/* Fallback indicator */}
      {riskData.isFallback && config.fallback.showFallbackIndicator && (
        <div 
          className="absolute top-0 right-0 w-2 h-2 bg-slate-400 rounded-full border border-white"
          title="Using fallback data"
        />
      )}
    </div>
  );
};

export default QuestRiskBadge;
