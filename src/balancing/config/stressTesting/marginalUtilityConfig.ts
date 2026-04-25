/**
 * Configuration for Marginal Utility Calculator
 * 
 * Defines thresholds, simulation parameters, and analysis settings
 * for Phase 10.5 marginal utility analysis pipeline.
 */

/**
 * Synergy thresholds for identifying OP and weak combinations
 */
export interface SynergyThresholds {
  /** Threshold for identifying overpowered synergies (> this multiplier) */
  opThreshold: number;
  /** Threshold for identifying weak synergies (< this multiplier) */
  weakThreshold: number;
}

/**
 * Simulation configuration parameters
 */
export interface SimulationConfig {
  /** Number of Monte Carlo simulations per archetype pair */
  simulationCount: number;
  /** Maximum concurrent simulations to prevent memory issues */
  concurrencyLimit: number;
  /** Random seed for deterministic results */
  seed: number;
}

/**
 * Export configuration for results
 */
export interface ExportConfig {
  /** Enable JSON export */
  enableJson: boolean;
  /** Enable CSV export */
  enableCsv: boolean;
  /** Enable Markdown export */
  enableMarkdown: boolean;
  /** Export directory path */
  exportPath: string;
}

/**
 * Complete marginal utility calculator configuration
 */
export interface MarginalUtilityConfig {
  /** Synergy analysis thresholds */
  thresholds: SynergyThresholds;
  /** Simulation parameters */
  simulation: SimulationConfig;
  /** Export settings */
  export: ExportConfig;
  /** Enable detailed logging */
  enableLogging: boolean;
  /** Cache results for performance */
  enableCaching: boolean;
}

/**
 * Default configuration for marginal utility analysis
 */
export const DEFAULT_MARGINAL_UTILITY_CONFIG: MarginalUtilityConfig = {
  thresholds: {
    opThreshold: 1.15,      // >15% better than expected = OP
    weakThreshold: 0.95,    // <5% worse than expected = weak
  },
  simulation: {
    simulationCount: 10000,  // 10k simulations per pair
    concurrencyLimit: 4,     // Max 4 concurrent simulations
    seed: 12345,             // Default seed for reproducibility
  },
  export: {
    enableJson: true,
    enableCsv: true,
    enableMarkdown: true,
    exportPath: '/data/exports/stressTesting/marginalUtility',
  },
  enableLogging: true,
  enableCaching: true,
};

/**
 * Validation schema for configuration
 */
export function validateMarginalUtilityConfig(config: MarginalUtilityConfig): void {
  if (config.thresholds.opThreshold <= 1.0) {
    throw new Error('OP threshold must be > 1.0');
  }
  
  if (config.thresholds.weakThreshold >= 1.0) {
    throw new Error('Weak threshold must be < 1.0');
  }
  
  if (config.thresholds.opThreshold <= config.thresholds.weakThreshold) {
    throw new Error('OP threshold must be > weak threshold');
  }
  
  if (config.simulation.simulationCount < 100) {
    throw new Error('Simulation count must be at least 100');
  }
  
  if (config.simulation.concurrencyLimit < 1 || config.simulation.concurrencyLimit > 16) {
    throw new Error('Concurrency limit must be between 1 and 16');
  }
  
  if (config.simulation.seed < 0) {
    throw new Error('Seed must be non-negative');
  }
}
