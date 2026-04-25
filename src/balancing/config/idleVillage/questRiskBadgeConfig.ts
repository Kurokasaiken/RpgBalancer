/**
 * Quest Risk Badge Configuration
 * 
 * Config-first system for risk badges in quest feed with fallback support,
 * styling tokens, and comprehensive configuration options.
 * 
 * @since NP-011
 */

/**
 * Risk level categories for quest badges
 */
export type RiskLevel = 'low' | 'medium' | 'high' | 'critical' | 'unknown';

/**
 * Risk badge variants for different display contexts
 */
export type RiskBadgeVariant = 'compact' | 'detailed' | 'minimal' | 'prominent';

/**
 * Risk badge animation states
 */
export type RiskBadgeAnimation = 'none' | 'pulse' | 'glow' | 'attention';

/**
 * Risk badge positioning in quest feed
 */
export type RiskBadgePosition = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'overlay';

/**
 * Risk data source fallback priority
 */
export type RiskDataSource = 'telemetry' | 'simulation' | 'historical' | 'estimated' | 'fallback';

/**
 * Risk calculation method
 */
export type RiskCalculationMethod = 'weighted_average' | 'max_risk' | 'conservative' | 'aggressive';

/**
 * Risk badge configuration interface
 */
export interface QuestRiskBadgeConfig {
  /** Whether risk badges are enabled */
  enabled: boolean;
  
  /** Default badge variant */
  defaultVariant: RiskBadgeVariant;
  
  /** Badge positioning in quest feed */
  position: RiskBadgePosition;
  
  /** Animation style for risk badges */
  animation: RiskBadgeAnimation;
  
  /** Risk calculation method */
  calculationMethod: RiskCalculationMethod;
  
  /** Data source fallback priority */
  dataSourcePriority: RiskDataSource[];
  
  /** Whether to show percentage values */
  showPercentages: boolean;
  
  /** Whether to show risk level labels */
  showLabels: boolean;
  
  /** Minimum risk percentage to show badge */
  minRiskThreshold: number;
  
  /** Risk level thresholds */
  thresholds: {
    low: number;      // 0-20%
    medium: number;   // 20-40%
    high: number;     // 40-60%
    critical: number; // 60%+
  };
  
  /** Styling configuration */
  styling: {
    /** Badge dimensions */
    size: {
      width: number;
      height: number;
      borderRadius: number;
    };
    
    /** Typography settings */
    typography: {
      fontSize: number;
      fontWeight: 'normal' | 'bold' | 'light' | 'medium' | 'semi-bold';
      fontFamily: string;
    };
    
    /** Risk level colors */
    colors: {
      low: {
        background: string;
        text: string;
        border: string;
        glow?: string;
      };
      medium: {
        background: string;
        text: string;
        border: string;
        glow?: string;
      };
      high: {
        background: string;
        text: string;
        border: string;
        glow?: string;
      };
      critical: {
        background: string;
        text: string;
        border: string;
        glow?: string;
      };
      unknown: {
        background: string;
        text: string;
        border: string;
        glow?: string;
      };
    };
    
    /** Animation settings */
    animations: {
      pulse: {
        duration: number;
        intensity: number;
      };
      glow: {
        duration: number;
        intensity: number;
      };
      attention: {
        duration: number;
        intensity: number;
      };
    };
    
    /** Spacing and positioning */
    spacing: {
      offset: {
        x: number;
        y: number;
      };
      margin: number;
      padding: number;
    };
  };
  
  /** Fallback configuration */
  fallback: {
    /** Whether to use fallback when data is missing */
    enabled: boolean;
    
    /** Default risk level for missing data */
    defaultRiskLevel: RiskLevel;
    
    /** Default percentage for missing data */
    defaultPercentage: number;
    
    /** Whether to show fallback indicator */
    showFallbackIndicator: boolean;
    
    /** Fallback badge styling */
    fallbackStyling: {
      opacity: number;
      borderStyle: string;
      pattern?: string;
    };
  };
  
  /** Accessibility configuration */
  accessibility: {
    /** Whether to enable accessibility features */
    enabled: boolean;
    
    /** ARIA label prefix */
    ariaLabelPrefix: string;
    
    /** Whether to announce risk changes */
    announceChanges: boolean;
    
    /** High contrast mode colors */
    highContrast: {
      low: string;
      medium: string;
      high: string;
      critical: string;
      unknown: string;
    };
  };
  
  /** Performance configuration */
  performance: {
    /** Whether to enable caching */
    enableCache: boolean;
    
    /** Cache duration in milliseconds */
    cacheDuration: number;
    
    /** Whether to lazy load badges */
    lazyLoad: boolean;
    
    /** Maximum number of badges to render */
    maxBadges: number;
  };
}

/**
 * Risk badge data interface
 */
export interface QuestRiskBadgeData {
  /** Quest identifier */
  questId: string;
  
  /** Calculated risk level */
  riskLevel: RiskLevel;
  
  /** Injury risk percentage */
  injuryRisk: number;
  
  /** Death risk percentage */
  deathRisk: number;
  
  /** Overall risk percentage */
  overallRisk: number;
  
  /** Data source used for calculation */
  dataSource: RiskDataSource;
  
  /** Whether fallback was used */
  isFallback: boolean;
  
  /** Timestamp of calculation */
  timestamp: number;
  
  /** Additional metadata */
  metadata?: {
    calculationMethod: RiskCalculationMethod;
    confidence: number;
    sampleSize?: number;
    historicalAverage?: number;
    simulationRuns?: number;
  };
}

/**
 * Risk badge diagnostics interface
 */
export interface RiskBadgeDiagnostics {
  timestamp: number;
  questId: string;
  riskLevel: RiskLevel;
  injuryRisk: number;
  deathRisk: number;
  overallRisk: number;
  dataSource: RiskDataSource;
  isFallback: boolean;
  renderTime: number;
  cacheHit: boolean;
  configSource: 'default' | 'custom' | 'test';
}

/**
 * Default risk badge configuration using Style Laboratory tokens
 */
export const DEFAULT_QUEST_RISK_BADGE_CONFIG: QuestRiskBadgeConfig = {
  enabled: true,
  defaultVariant: 'compact',
  position: 'top-right',
  animation: 'pulse',
  calculationMethod: 'weighted_average',
  dataSourcePriority: ['telemetry', 'simulation', 'historical', 'estimated', 'fallback'],
  showPercentages: true,
  showLabels: true,
  minRiskThreshold: 5,
  thresholds: {
    low: 20,
    medium: 40,
    high: 60,
    critical: 80,
  },
  styling: {
    size: {
      width: 32,
      height: 32,
      borderRadius: 4,
    },
    typography: {
      fontSize: 10,
      fontWeight: 'semi-bold',
      fontFamily: 'Inter, system-ui, sans-serif',
    },
    colors: {
      low: {
        background: 'rgba(34, 197, 94, 0.9)',     // green-500
        text: '#ffffff',
        border: 'rgba(34, 197, 94, 1)',
        glow: 'rgba(34, 197, 94, 0.3)',
      },
      medium: {
        background: 'rgba(251, 191, 36, 0.9)',    // amber-400
        text: '#000000',
        border: 'rgba(251, 191, 36, 1)',
        glow: 'rgba(251, 191, 36, 0.3)',
      },
      high: {
        background: 'rgba(249, 115, 22, 0.9)',    // orange-500
        text: '#ffffff',
        border: 'rgba(249, 115, 22, 1)',
        glow: 'rgba(249, 115, 22, 0.3)',
      },
      critical: {
        background: 'rgba(239, 68, 68, 0.9)',      // red-500
        text: '#ffffff',
        border: 'rgba(239, 68, 68, 1)',
        glow: 'rgba(239, 68, 68, 0.3)',
      },
      unknown: {
        background: 'rgba(107, 114, 128, 0.9)',   // slate-500
        text: '#ffffff',
        border: 'rgba(107, 114, 128, 1)',
      },
    },
    animations: {
      pulse: {
        duration: 2000,
        intensity: 0.3,
      },
      glow: {
        duration: 1500,
        intensity: 0.4,
      },
      attention: {
        duration: 1000,
        intensity: 0.5,
      },
    },
    spacing: {
      offset: {
        x: 4,
        y: 4,
      },
      margin: 2,
      padding: 4,
    },
  },
  fallback: {
    enabled: true,
    defaultRiskLevel: 'unknown',
    defaultPercentage: 0,
    showFallbackIndicator: true,
    fallbackStyling: {
      opacity: 0.7,
      borderStyle: 'dashed',
      pattern: 'diagonal-lines',
    },
  },
  accessibility: {
    enabled: true,
    ariaLabelPrefix: 'Quest risk',
    announceChanges: true,
    highContrast: {
      low: '#00ff00',
      medium: '#ffff00',
      high: '#ff8800',
      critical: '#ff0000',
      unknown: '#808080',
    },
  },
  performance: {
    enableCache: true,
    cacheDuration: 300000, // 5 minutes
    lazyLoad: true,
    maxBadges: 100,
  },
};

/**
 * Test configuration for development and testing
 */
export const TEST_QUEST_RISK_BADGE_CONFIG: QuestRiskBadgeConfig = {
  ...DEFAULT_QUEST_RISK_BADGE_CONFIG,
  animation: 'none', // Disable animations for testing
  performance: {
    ...DEFAULT_QUEST_RISK_BADGE_CONFIG.performance,
    enableCache: false, // Disable cache for testing
    lazyLoad: false, // Disable lazy loading for testing
  },
  fallback: {
    ...DEFAULT_QUEST_RISK_BADGE_CONFIG.fallback,
    showFallbackIndicator: true, // Always show fallback indicator in tests
  },
};

/**
 * Utility function to determine risk level from percentage
 */
export function getRiskLevelFromPercentage(
  percentage: number,
  thresholds: QuestRiskBadgeConfig['thresholds']
): RiskLevel {
  if (percentage >= thresholds.critical) return 'critical';
  if (percentage >= thresholds.high) return 'high';
  if (percentage >= thresholds.medium) return 'medium';
  if (percentage >= thresholds.low) return 'low';
  return 'unknown';
}

/**
 * Utility function to calculate overall risk from injury and death percentages
 */
export function calculateOverallRisk(
  injuryRisk: number,
  deathRisk: number,
  method: RiskCalculationMethod
): number {
  switch (method) {
    case 'weighted_average':
      // Death risk is weighted more heavily (70% death, 30% injury)
      return (injuryRisk * 0.3 + deathRisk * 0.7);
    case 'max_risk':
      return Math.max(injuryRisk, deathRisk);
    case 'conservative':
      // Use the higher risk with a small safety margin
      return Math.max(injuryRisk, deathRisk) * 1.1;
    case 'aggressive':
      // Average with emphasis on injury risk
      return (injuryRisk * 0.6 + deathRisk * 0.4);
    default:
      return (injuryRisk * 0.3 + deathRisk * 0.7);
  }
}

/**
 * Utility function to validate risk badge configuration
 */
export function validateRiskBadgeConfig(config: QuestRiskBadgeConfig): boolean {
  try {
    // Check required fields
    if (config.enabled === undefined) return false;
    if (!config.thresholds) return false;
    if (!config.styling) return false;
    if (!config.fallback) return false;
    
    // Check threshold values
    const { thresholds } = config;
    if (thresholds.low >= thresholds.medium) return false;
    if (thresholds.medium >= thresholds.high) return false;
    if (thresholds.high >= thresholds.critical) return false;
    
    // Check styling
    if (!config.styling.colors) return false;
    if (!config.styling.size) return false;
    
    return true;
  } catch (error) {
    console.error('[QuestRiskBadgeConfig] Validation error:', error);
    return false;
  }
}

/**
 * Utility function to get risk level colors
 */
export function getRiskLevelColors(
  riskLevel: RiskLevel,
  config: QuestRiskBadgeConfig['styling']['colors']
) {
  return config[riskLevel] || config.unknown;
}

/**
 * Utility function to check if risk badge should be shown
 */
export function shouldShowRiskBadge(
  overallRisk: number,
  config: QuestRiskBadgeConfig
): boolean {
  return config.enabled && overallRisk >= config.minRiskThreshold;
}

/**
 * Utility function to create fallback risk data
 */
export function createFallbackRiskData(
  questId: string,
  config: QuestRiskBadgeConfig
): QuestRiskBadgeData {
  return {
    questId,
    riskLevel: config.fallback.defaultRiskLevel,
    injuryRisk: config.fallback.defaultPercentage,
    deathRisk: config.fallback.defaultPercentage,
    overallRisk: config.fallback.defaultPercentage,
    dataSource: 'fallback',
    isFallback: true,
    timestamp: Date.now(),
    metadata: {
      calculationMethod: config.calculationMethod,
      confidence: 0.1, // Very low confidence for fallback
    },
  };
}
