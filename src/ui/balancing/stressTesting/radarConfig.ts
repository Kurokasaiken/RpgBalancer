/**
 * Radar Configuration for StatProfileRadar
 * 
 * Config-first settings for radar chart auto-tuning, visual styling,
 * and performance optimization.
 * 
 * @module radarConfig
 * @since 2026-01-12
 * @author Helix-Radar
 */

import type { RadarAutoTuneConfig } from './radarAutoTuner';

/**
 * Radar chart visual configuration
 */
export interface RadarVisualConfig {
  /** Chart dimensions */
  dimensions: {
    width: number;
    height: number;
    padding: number;
  };
  /** Grid styling */
  grid: {
    levels: number;
    color: string;
    lineWidth: number;
    opacity: number;
  };
  /** Data polygon styling */
  polygon: {
    fillColor: string;
    strokeColor: string;
    strokeWidth: number;
    opacity: number;
    fillOpacity: number;
  };
  /** Point styling */
  points: {
    radius: number;
    color: string;
    strokeColor: string;
    strokeWidth: number;
    hoverRadius: number;
  };
  /** Label styling */
  labels: {
    font: string;
    fontSize: number;
    color: string;
    offset: number;
    showValues: boolean;
  };
  /** Animation settings */
  animations: {
    enabled: boolean;
    duration: number;
    easing: string;
    stagger: number;
  };
}

/**
 * Performance configuration for radar rendering
 */
export interface RadarPerformanceConfig {
  /** Rendering optimization */
  rendering: {
    enableHardwareAcceleration: boolean;
    maxFPS: number;
    enableViewportCulling: boolean;
    enableDataThrottling: boolean;
  };
  /** Data processing */
  dataProcessing: {
    enableBatching: boolean;
    batchSize: number;
    enableCaching: boolean;
    cacheSize: number;
  };
  /** Memory management */
  memory: {
    enableGarbageCollection: boolean;
    maxMemoryUsage: number; // MB
    enableMemoryMonitoring: boolean;
  };
}

/**
 * Complete radar configuration
 */
export interface RadarConfig {
  /** Auto-tuning configuration */
  autoTune: RadarAutoTuneConfig;
  /** Visual styling configuration */
  visual: RadarVisualConfig;
  /** Performance optimization configuration */
  performance: RadarPerformanceConfig;
  /** Feature flags */
  features: {
    enableInteractivity: boolean;
    enableTooltips: boolean;
    enableExport: boolean;
    enableZoom: boolean;
    enablePan: boolean;
    enableSelection: boolean;
  };
  /** Accessibility configuration */
  accessibility: {
    enableScreenReader: boolean;
    enableKeyboardNavigation: boolean;
    highContrastMode: boolean;
    reducedMotion: boolean;
  };
}

/**
 * Default visual configuration
 */
export const DEFAULT_RADAR_VISUAL_CONFIG: RadarVisualConfig = {
  dimensions: {
    width: 400,
    height: 400,
    padding: 20,
  },
  grid: {
    levels: 5,
    color: '#333333',
    lineWidth: 1,
    opacity: 0.6,
  },
  polygon: {
    fillColor: '#00ff88',
    strokeColor: '#00ffaa',
    strokeWidth: 2,
    opacity: 0.8,
    fillOpacity: 0.3,
  },
  points: {
    radius: 4,
    color: '#00ffff',
    strokeColor: '#ffffff',
    strokeWidth: 2,
    hoverRadius: 6,
  },
  labels: {
    font: 'monospace',
    fontSize: 12,
    color: '#00ff00',
    offset: 15,
    showValues: true,
  },
  animations: {
    enabled: true,
    duration: 300,
    easing: 'ease-out',
    stagger: 50,
  },
};

/**
 * Default performance configuration
 */
export const DEFAULT_RADAR_PERFORMANCE_CONFIG: RadarPerformanceConfig = {
  rendering: {
    enableHardwareAcceleration: true,
    maxFPS: 60,
    enableViewportCulling: false,
    enableDataThrottling: true,
  },
  dataProcessing: {
    enableBatching: true,
    batchSize: 100,
    enableCaching: true,
    cacheSize: 50,
  },
  memory: {
    enableGarbageCollection: true,
    maxMemoryUsage: 100, // MB
    enableMemoryMonitoring: false,
  },
};

/**
 * Default complete radar configuration
 */
export const DEFAULT_RADAR_CONFIG: RadarConfig = {
  autoTune: {
    rangeStrategy: 'adaptive',
    percentileBounds: { lower: 5, upper: 95 },
    stddevMultiplier: 2,
    minRange: 0.1,
    maxRange: 2.0,
    smoothing: {
      enabled: true,
      algorithm: 'gaussian',
      factor: 0.3,
      windowSize: 3,
    },
    gridOptimization: {
      enabled: true,
      preferredLevels: 5,
      maxLevels: 8,
      minLevels: 3,
    },
  },
  visual: DEFAULT_RADAR_VISUAL_CONFIG,
  performance: DEFAULT_RADAR_PERFORMANCE_CONFIG,
  features: {
    enableInteractivity: true,
    enableTooltips: true,
    enableExport: true,
    enableZoom: false,
    enablePan: false,
    enableSelection: true,
  },
  accessibility: {
    enableScreenReader: true,
    enableKeyboardNavigation: true,
    highContrastMode: false,
    reducedMotion: false,
  },
};

/**
 * Theme presets for radar charts
 */
export const RADAR_THEME_PRESETS = {
  /** Gilded Observatory retro theme */
  retro: {
    visual: {
      ...DEFAULT_RADAR_VISUAL_CONFIG,
      grid: {
        ...DEFAULT_RADAR_VISUAL_CONFIG.grid,
        color: '#1a1a1a',
        opacity: 0.8,
      },
      polygon: {
        ...DEFAULT_RADAR_VISUAL_CONFIG.polygon,
        fillColor: '#00ff00',
        strokeColor: '#88ff00',
        fillOpacity: 0.2,
      },
      points: {
        ...DEFAULT_RADAR_VISUAL_CONFIG.points,
        color: '#00ff00',
        strokeColor: '#ffffff',
      },
      labels: {
        ...DEFAULT_RADAR_VISUAL_CONFIG.labels,
        color: '#00ff00',
        font: 'Courier New, monospace',
      },
    },
  } as Partial<RadarConfig>,

  /** High contrast theme */
  highContrast: {
    visual: {
      ...DEFAULT_RADAR_VISUAL_CONFIG,
      grid: {
        ...DEFAULT_RADAR_VISUAL_CONFIG.grid,
        color: '#ffffff',
        opacity: 1,
      },
      polygon: {
        ...DEFAULT_RADAR_VISUAL_CONFIG.polygon,
        fillColor: '#ffff00',
        strokeColor: '#ffffff',
        fillOpacity: 0.5,
      },
      points: {
        ...DEFAULT_RADAR_VISUAL_CONFIG.points,
        color: '#ffffff',
        strokeColor: '#000000',
      },
      labels: {
        ...DEFAULT_RADAR_VISUAL_CONFIG.labels,
        color: '#ffffff',
      },
    },
    accessibility: {
      enableScreenReader: true,
      enableKeyboardNavigation: true,
      highContrastMode: true,
      reducedMotion: false,
    },
  } as Partial<RadarConfig>,

  /** Minimal theme */
  minimal: {
    visual: {
      ...DEFAULT_RADAR_VISUAL_CONFIG,
      grid: {
        ...DEFAULT_RADAR_VISUAL_CONFIG.grid,
        color: '#e0e0e0',
        opacity: 0.3,
      },
      polygon: {
        ...DEFAULT_RADAR_VISUAL_CONFIG.polygon,
        fillColor: '#4a90e2',
        strokeColor: '#2c5aa0',
        fillOpacity: 0.4,
      },
      points: {
        ...DEFAULT_RADAR_VISUAL_CONFIG.points,
        color: '#4a90e2',
        strokeColor: '#ffffff',
        radius: 3,
      },
      labels: {
        ...DEFAULT_RADAR_VISUAL_CONFIG.labels,
        color: '#333333',
        font: 'Arial, sans-serif',
      },
    },
    animations: {
      enabled: false,
      duration: 0,
      easing: 'linear',
      stagger: 0,
    },
  } as Partial<RadarConfig>,
};

/**
 * Performance presets for different use cases
 */
export const RADAR_PERFORMANCE_PRESETS = {
  /** High performance for large datasets */
  highPerformance: {
    performance: {
      rendering: {
        enableHardwareAcceleration: true,
        maxFPS: 30,
        enableViewportCulling: true,
        enableDataThrottling: true,
      },
      dataProcessing: {
        enableBatching: true,
        batchSize: 200,
        enableCaching: true,
        cacheSize: 100,
      },
      memory: {
        enableGarbageCollection: true,
        maxMemoryUsage: 200,
        enableMemoryMonitoring: true,
      },
    },
    features: {
      enableInteractivity: false,
      enableTooltips: false,
      enableExport: true,
      enableZoom: false,
      enablePan: false,
      enableSelection: false,
    },
    animations: {
      enabled: false,
      duration: 0,
      easing: 'linear',
      stagger: 0,
    },
  } as Partial<RadarConfig>,

  /** Balanced performance for general use */
  balanced: {
    performance: {
      rendering: {
        enableHardwareAcceleration: true,
        maxFPS: 60,
        enableViewportCulling: false,
        enableDataThrottling: true,
      },
      dataProcessing: {
        enableBatching: true,
        batchSize: 100,
        enableCaching: true,
        cacheSize: 50,
      },
      memory: {
        enableGarbageCollection: true,
        maxMemoryUsage: 100,
        enableMemoryMonitoring: false,
      },
    },
  } as Partial<RadarConfig>,

  /** Low power for mobile devices */
  lowPower: {
    performance: {
      rendering: {
        enableHardwareAcceleration: false,
        maxFPS: 30,
        enableViewportCulling: true,
        enableDataThrottling: true,
      },
      dataProcessing: {
        enableBatching: true,
        batchSize: 50,
        enableCaching: true,
        cacheSize: 25,
      },
      memory: {
        enableGarbageCollection: true,
        maxMemoryUsage: 50,
        enableMemoryMonitoring: true,
      },
    },
    features: {
      enableInteractivity: true,
      enableTooltips: false,
      enableExport: false,
      enableZoom: false,
      enablePan: false,
      enableSelection: true,
    },
    animations: {
      enabled: false,
      duration: 0,
      easing: 'linear',
      stagger: 0,
    },
  } as Partial<RadarConfig>,
};

/**
 * Configuration validator
 */
export function validateRadarConfig(config: Partial<RadarConfig>): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Validate dimensions
  if (config.visual?.dimensions) {
    const { width, height, padding } = config.visual.dimensions;
    if (width && (width < 100 || width > 2000)) {
      errors.push('Width must be between 100 and 2000 pixels');
    }
    if (height && (height < 100 || height > 2000)) {
      errors.push('Height must be between 100 and 2000 pixels');
    }
    if (padding && (padding < 0 || padding > 100)) {
      warnings.push('Padding should be between 0 and 100 pixels');
    }
  }

  // Validate performance settings
  if (config.performance?.rendering) {
    const { maxFPS } = config.performance.rendering;
    if (maxFPS && (maxFPS < 15 || maxFPS > 120)) {
      warnings.push('FPS should be between 15 and 120 for optimal performance');
    }
  }

  // Validate memory settings
  if (config.performance?.memory) {
    const { maxMemoryUsage } = config.performance.memory;
    if (maxMemoryUsage && (maxMemoryUsage < 10 || maxMemoryUsage > 1000)) {
      warnings.push('Memory usage should be between 10 and 1000 MB');
    }
  }

  // Validate auto-tune settings
  if (config.autoTune) {
    const { minRange, maxRange } = config.autoTune;
    if (minRange !== undefined && maxRange !== undefined && minRange >= maxRange) {
      errors.push('minRange must be less than maxRange');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Merge configurations with validation
 */
export function mergeRadarConfig(
  base: RadarConfig = DEFAULT_RADAR_CONFIG,
  override: Partial<RadarConfig>
): RadarConfig {
  const validation = validateRadarConfig(override);
  
  if (!validation.isValid) {
    console.warn('Radar config validation failed:', validation.errors);
  }

  if (validation.warnings.length > 0) {
    console.warn('Radar config warnings:', validation.warnings);
  }

  return {
    autoTune: { ...base.autoTune, ...override.autoTune },
    visual: {
      ...base.visual,
      ...override.visual,
      dimensions: { ...base.visual.dimensions, ...override.visual?.dimensions },
      grid: { ...base.visual.grid, ...override.visual?.grid },
      polygon: { ...base.visual.polygon, ...override.visual?.polygon },
      points: { ...base.visual.points, ...override.visual?.points },
      labels: { ...base.visual.labels, ...override.visual?.labels },
      animations: { ...base.visual.animations, ...override.visual?.animations },
    },
    performance: {
      ...base.performance,
      ...override.performance,
      rendering: { ...base.performance.rendering, ...override.performance?.rendering },
      dataProcessing: { ...base.performance.dataProcessing, ...override.performance?.dataProcessing },
      memory: { ...base.performance.memory, ...override.performance?.memory },
    },
    features: { ...base.features, ...override.features },
    accessibility: { ...base.accessibility, ...override.accessibility },
  };
}
