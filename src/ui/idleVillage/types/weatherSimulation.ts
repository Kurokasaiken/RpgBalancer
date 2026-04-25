/**
 * NP-032 – Idle Village Weather Impact Simulation
 * 
 * Weather simulation data types and interfaces for impact calculation,
 * overlay visualization, and telemetry tracking.
 * 
 * @since 2026-01-13
 * @author Cascade
 */

import { z } from 'zod';

// Weather Types and Conditions
export type WeatherType = 'clear' | 'cloudy' | 'rainy' | 'stormy' | 'snowy' | 'foggy' | 'windy' | 'extreme';
export type WeatherSeverity = 'mild' | 'moderate' | 'severe' | 'extreme';
export type SeasonType = 'spring' | 'summer' | 'autumn' | 'winter';
export type TimeOfDay = 'dawn' | 'morning' | 'noon' | 'afternoon' | 'evening' | 'night';

// Weather Condition Interface
export interface WeatherCondition {
  id: string;
  type: WeatherType;
  severity: WeatherSeverity;
  temperature: {
    current: number; // Celsius
    feelsLike: number; // Celsius
    min: number; // Celsius
    max: number; // Celsius
    trend: 'rising' | 'falling' | 'stable';
  };
  humidity: {
    current: number; // Percentage (0-100)
    trend: 'rising' | 'falling' | 'stable';
  };
  wind: {
    speed: number; // km/h
    direction: number; // degrees (0-360)
    gusts: number; // km/h
    trend: 'increasing' | 'decreasing' | 'stable';
  };
  precipitation: {
    type: 'none' | 'rain' | 'snow' | 'sleet' | 'hail';
    intensity: number; // mm/h for rain, cm/h for snow
    probability: number; // Percentage (0-100)
    duration: number; // minutes
  };
  visibility: {
    current: number; // meters
    trend: 'improving' | 'worsening' | 'stable';
  };
  pressure: {
    current: number; // hPa
    trend: 'rising' | 'falling' | 'stable';
  };
  uvIndex: {
    current: number; // 0-11+
    max: number; // 0-11+
  };
  season: SeasonType;
  timeOfDay: TimeOfDay;
  timestamp: number;
  duration: number; // minutes
  forecast: {
    nextChange: number; // minutes until next change
    trend: 'improving' | 'worsening' | 'stable';
  };
}

// Weather Impact Configuration
export interface WeatherImpactConfig {
  id: string;
  name: string;
  description?: string;
  enabled: boolean;
  priority: number;
  conditions: {
    weatherTypes: WeatherType[];
    severities: WeatherSeverity[];
    seasons: SeasonType[];
    timesOfDay: TimeOfDay[];
    temperatureRanges: {
      min: number;
      max: number;
    }[];
  };
  impacts: {
    successRate: {
      modifier: number; // Percentage modifier (-1 to 1)
      calculation: 'linear' | 'exponential' | 'logarithmic' | 'custom';
      thresholds: {
        excellent: number; // > 90%
        good: number; // 75-90%
        fair: number; // 50-75%
        poor: number; // 25-50%
        terrible: number; // < 25%
      };
    };
    fatigue: {
      modifier: number; // Percentage modifier (-1 to 1)
      accumulation: number; // Rate of fatigue accumulation
      recovery: number; // Rate of fatigue recovery
      calculation: 'linear' | 'exponential' | 'logarithmic' | 'custom';
    };
    movement: {
      speed: number; // Movement speed modifier (0-2)
      accuracy: number; // Movement accuracy modifier (0-2)
      energy: number; // Energy consumption modifier (0-2)
    };
    morale: {
      modifier: number; // Morale modifier (-1 to 1)
      decay: number; // Morale decay rate
      recovery: number; // Morale recovery rate
    };
    productivity: {
      modifier: number; // Productivity modifier (-1 to 1)
      quality: number; // Quality modifier (-1 to 1)
      efficiency: number; // Efficiency modifier (-1 to 1)
    };
    resources: {
      consumption: number; // Resource consumption modifier (0-2)
      generation: number; // Resource generation modifier (0-2)
      storage: number; // Storage efficiency modifier (0-2)
    };
  };
  specialEffects: WeatherSpecialEffect[];
  dependencies: string[];
  metadata: {
    version: string;
    author?: string;
    tags: string[];
    category: string;
  };
}

// Weather Special Effects
export interface WeatherSpecialEffect {
  id: string;
  name: string;
  type: 'visual' | 'audio' | 'mechanical' | 'behavioral' | 'resource';
  trigger: {
    conditions: Partial<WeatherCondition>;
    probability: number; // 0-1
    cooldown: number; // minutes
  };
  effect: {
    type: 'instant' | 'duration' | 'persistent';
    duration?: number; // minutes
    magnitude: number; // Effect strength (0-1)
    target: 'residents' | 'buildings' | 'resources' | 'activities' | 'all';
    action: string; // Effect action description
  };
  visual?: {
    icon?: string;
    color?: string;
    animation?: string;
    overlay?: string;
  };
  audio?: {
    sound?: string;
    volume?: number; // 0-1
    loop?: boolean;
  };
}

// Weather Simulation State
export interface WeatherSimulationState {
  current: WeatherCondition;
  history: WeatherCondition[];
  forecast: WeatherCondition[];
  impacts: WeatherImpactResult[];
  activeEffects: WeatherSpecialEffect[];
  configuration: WeatherImpactConfig[];
  statistics: WeatherStatistics;
  telemetry: WeatherTelemetryData;
  metadata: {
    simulationId: string;
    startTime: number;
    currentTime: number;
    speed: number; // Simulation speed multiplier
    paused: boolean;
    autoAdvance: boolean;
  };
}

// Weather Impact Result
export interface WeatherImpactResult {
  id: string;
  timestamp: number;
  weatherCondition: WeatherCondition;
  targetId: string;
  targetType: 'resident' | 'building' | 'activity' | 'resource' | 'village';
  impacts: {
    successRate: {
      original: number;
      modified: number;
      modifier: number;
    };
    fatigue: {
      original: number;
      modified: number;
      modifier: number;
    };
    morale: {
      original: number;
      modified: number;
      modifier: number;
    };
    productivity: {
      original: number;
      modified: number;
      modifier: number;
    };
    movement: {
      speed: {
        original: number;
        modified: number;
        modifier: number;
      };
      accuracy: {
        original: number;
        modified: number;
        modifier: number;
      };
      energy: {
        original: number;
        modified: number;
        modifier: number;
      };
    };
    resources: {
      consumption: {
        original: number;
        modified: number;
        modifier: number;
      };
      generation: {
        original: number;
        modified: number;
        modifier: number;
      };
      storage: {
        original: number;
        modified: number;
        modifier: number;
      };
    };
  };
  appliedEffects: string[];
  confidence: number; // 0-1
  metadata: {
    calculationMethod: string;
    factors: string[];
    accuracy: number; // 0-1
  };
}

// Weather Statistics
export interface WeatherStatistics {
  totalSimulationTime: number; // minutes
  weatherDistribution: Record<WeatherType, number>; // minutes per weather type
  severityDistribution: Record<WeatherSeverity, number>; // minutes per severity
  seasonDistribution: Record<SeasonType, number>; // minutes per season
  averageConditions: {
    temperature: number;
    humidity: number;
    windSpeed: number;
    visibility: number;
    pressure: number;
  };
  impactSummary: {
    totalImpacts: number;
    averageSuccessRateModifier: number;
    averageFatigueModifier: number;
    averageMoraleModifier: number;
    averageProductivityModifier: number;
    extremeWeatherEvents: number;
    specialEffectsTriggered: number;
  };
  trends: {
    temperature: 'rising' | 'falling' | 'stable';
    humidity: 'rising' | 'falling' | 'stable';
    pressure: 'rising' | 'falling' | 'stable';
    overall: 'improving' | 'worsening' | 'stable';
  };
}

// Weather Telemetry Data
export interface WeatherTelemetryData {
  events: WeatherTelemetryEvent[];
  metrics: WeatherTelemetryMetric[];
  performance: WeatherTelemetryPerformance;
  errors: WeatherTelemetryError[];
  metadata: {
    collectionStartTime: number;
    lastUpdateTime: number;
    totalEvents: number;
    totalMetrics: number;
    totalErrors: number;
  };
}

export interface WeatherTelemetryEvent {
  id: string;
  timestamp: number;
  type: 'weather_change' | 'impact_calculated' | 'effect_triggered' | 'simulation_event' | 'error';
  data: {
    weatherCondition?: WeatherCondition;
    impactResult?: WeatherImpactResult;
    specialEffect?: WeatherSpecialEffect;
    simulationEvent?: string;
    error?: string;
  };
  metadata: {
    source: string;
    version: string;
    tags: string[];
  };
}

export interface WeatherTelemetryMetric {
  id: string;
  name: string;
  timestamp: number;
  value: number;
  unit: string;
  type: 'counter' | 'gauge' | 'histogram' | 'timer';
  dimensions: Record<string, string>;
  metadata: {
    description?: string;
    tags: string[];
  };
}

export interface WeatherTelemetryPerformance {
  simulation: {
    averageCalculationTime: number; // milliseconds
    totalCalculations: number;
    errors: number;
    cacheHitRate: number; // 0-1
  };
  rendering: {
    averageRenderTime: number; // milliseconds
    totalRenders: number;
    frameRate: number; // fps
  };
  memory: {
    used: number; // bytes
    peak: number; // bytes
    allocations: number;
  };
}

export interface WeatherTelemetryError {
  id: string;
  timestamp: number;
  type: 'calculation' | 'rendering' | 'data' | 'system';
  message: string;
  stack?: string;
  context: {
    weatherCondition?: WeatherCondition;
    impactConfig?: WeatherImpactConfig;
    operation: string;
  };
  severity: 'low' | 'medium' | 'high' | 'critical';
  resolved: boolean;
  resolution?: string;
}

// Weather Overlay Configuration
export interface WeatherOverlayConfig {
  id: string;
  name: string;
  type: 'radar' | 'heatmap' | 'particles' | 'effects' | 'forecast' | 'impact';
  enabled: boolean;
  visible: boolean;
  opacity: number; // 0-1
  zIndex: number;
  bounds: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
  style: {
    colors: Record<string, string>;
    gradients: Record<string, string[]>;
    sizes: Record<string, number>;
    animations: Record<string, string>;
  };
  data: {
    source: 'simulation' | 'forecast' | 'historical' | 'external';
    refreshInterval: number; // milliseconds
    cacheDuration: number; // milliseconds
  };
  interaction: {
    clickable: boolean;
    hoverable: boolean;
    selectable: boolean;
    tooltips: boolean;
    popups: boolean;
  };
  metadata: {
    version: string;
    author?: string;
    tags: string[];
    category: string;
  };
}

// Weather Simulation Configuration
export interface WeatherSimulationConfig {
  id: string;
  name: string;
  description?: string;
  enabled: boolean;
  simulation: {
    speed: number; // Simulation speed multiplier
    autoAdvance: boolean;
    maxHistorySize: number;
    forecastHorizon: number; // hours
    updateInterval: number; // milliseconds
  };
  weather: {
    patterns: WeatherPattern[];
    transitions: WeatherTransition[];
    extremes: WeatherExtreme[];
  };
  impacts: WeatherImpactConfig[];
  overlays: WeatherOverlayConfig[];
  telemetry: {
    enabled: boolean;
    events: boolean;
    metrics: boolean;
    performance: boolean;
    exportInterval: number; // milliseconds
  };
  validation: {
    strictMode: boolean;
    errorThreshold: number; // 0-1
    warningThreshold: number; // 0-1
  };
  metadata: {
    version: string;
    author?: string;
    tags: string[];
    category: string;
  };
}

// Weather Pattern
export interface WeatherPattern {
  id: string;
  name: string;
  season: SeasonType;
  probability: number; // 0-1
  duration: {
    min: number; // minutes
    max: number; // minutes
    average: number; // minutes
  };
  conditions: Partial<WeatherCondition>;
  transitions: {
    to: string; // pattern ID
    probability: number; // 0-1
  }[];
  metadata: {
    description?: string;
    tags: string[];
  };
}

// Weather Transition
export interface WeatherTransition {
  id: string;
  name: string;
  from: WeatherType;
  to: WeatherType;
  probability: number; // 0-1
  duration: {
    min: number; // minutes
    max: number; // minutes
  };
  conditions: Partial<WeatherCondition>;
  effects: WeatherSpecialEffect[];
  metadata: {
    description?: string;
    tags: string[];
  };
}

// Weather Extreme
export interface WeatherExtreme {
  id: string;
  name: string;
  type: WeatherType;
  severity: 'severe' | 'extreme';
  conditions: Partial<WeatherCondition>;
  triggers: {
    conditions: Partial<WeatherCondition>;
    probability: number; // 0-1
    cooldown: number; // minutes
  };
  effects: WeatherSpecialEffect[];
  duration: {
    min: number; // minutes
    max: number; // minutes
  };
  metadata: {
    description?: string;
    warnings: string[];
    tags: string[];
  };
}

// Zod Schemas
export const WeatherConditionSchema = z.object({
  id: z.string(),
  type: z.enum(['clear', 'cloudy', 'rainy', 'stormy', 'snowy', 'foggy', 'windy', 'extreme']),
  severity: z.enum(['mild', 'moderate', 'severe', 'extreme']),
  temperature: z.object({
    current: z.number(),
    feelsLike: z.number(),
    min: z.number(),
    max: z.number(),
    trend: z.enum(['rising', 'falling', 'stable']),
  }),
  humidity: z.object({
    current: z.number().min(0).max(100),
    trend: z.enum(['rising', 'falling', 'stable']),
  }),
  wind: z.object({
    speed: z.number().min(0),
    direction: z.number().min(0).max(360),
    gusts: z.number().min(0),
    trend: z.enum(['increasing', 'decreasing', 'stable']),
  }),
  precipitation: z.object({
    type: z.enum(['none', 'rain', 'snow', 'sleet', 'hail']),
    intensity: z.number().min(0),
    probability: z.number().min(0).max(100),
    duration: z.number().min(0),
  }),
  visibility: z.object({
    current: z.number().min(0),
    trend: z.enum(['improving', 'worsening', 'stable']),
  }),
  pressure: z.object({
    current: z.number(),
    trend: z.enum(['rising', 'falling', 'stable']),
  }),
  uvIndex: z.object({
    current: z.number().min(0),
    max: z.number().min(0),
  }),
  season: z.enum(['spring', 'summer', 'autumn', 'winter']),
  timeOfDay: z.enum(['dawn', 'morning', 'noon', 'afternoon', 'evening', 'night']),
  timestamp: z.number(),
  duration: z.number().min(0),
  forecast: z.object({
    nextChange: z.number().min(0),
    trend: z.enum(['improving', 'worsening', 'stable']),
  }),
});

export const WeatherImpactConfigSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  enabled: z.boolean(),
  priority: z.number(),
  conditions: z.object({
    weatherTypes: z.array(z.enum(['clear', 'cloudy', 'rainy', 'stormy', 'snowy', 'foggy', 'windy', 'extreme'])),
    severities: z.array(z.enum(['mild', 'moderate', 'severe', 'extreme'])),
    seasons: z.array(z.enum(['spring', 'summer', 'autumn', 'winter'])),
    timesOfDay: z.array(z.enum(['dawn', 'morning', 'noon', 'afternoon', 'evening', 'night'])),
    temperatureRanges: z.array(z.object({
      min: z.number(),
      max: z.number(),
    })),
  }),
  impacts: z.object({
    successRate: z.object({
      modifier: z.number().min(-1).max(1),
      calculation: z.enum(['linear', 'exponential', 'logarithmic', 'custom']),
      thresholds: z.object({
        excellent: z.number(),
        good: z.number(),
        fair: z.number(),
        poor: z.number(),
        terrible: z.number(),
      }),
    }),
    fatigue: z.object({
      modifier: z.number().min(-1).max(1),
      accumulation: z.number(),
      recovery: z.number(),
      calculation: z.enum(['linear', 'exponential', 'logarithmic', 'custom']),
    }),
    movement: z.object({
      speed: z.number().min(0).max(2),
      accuracy: z.number().min(0).max(2),
      energy: z.number().min(0).max(2),
    }),
    morale: z.object({
      modifier: z.number().min(-1).max(1),
      decay: z.number(),
      recovery: z.number(),
    }),
    productivity: z.object({
      modifier: z.number().min(-1).max(1),
      quality: z.number().min(-1).max(1),
      efficiency: z.number().min(-1).max(1),
    }),
    resources: z.object({
      consumption: z.number().min(0).max(2),
      generation: z.number().min(0).max(2),
      storage: z.number().min(0).max(2),
    }),
  }),
  specialEffects: z.array(z.object({
    id: z.string(),
    name: z.string(),
    type: z.enum(['visual', 'audio', 'mechanical', 'behavioral', 'resource']),
    trigger: z.object({
      conditions: z.object({}).passthrough(),
      probability: z.number().min(0).max(1),
      cooldown: z.number().min(0),
    }),
    effect: z.object({
      type: z.enum(['instant', 'duration', 'persistent']),
      duration: z.number().min(0).optional(),
      magnitude: z.number().min(0).max(1),
      target: z.enum(['residents', 'buildings', 'resources', 'activities', 'all']),
      action: z.string(),
    }),
    visual: z.object({
      icon: z.string().optional(),
      color: z.string().optional(),
      animation: z.string().optional(),
      overlay: z.string().optional(),
    }).optional(),
    audio: z.object({
      sound: z.string().optional(),
      volume: z.number().min(0).max(1).optional(),
      loop: z.boolean().optional(),
    }).optional(),
  })),
  dependencies: z.array(z.string()),
  metadata: z.object({
    version: z.string(),
    author: z.string().optional(),
    tags: z.array(z.string()),
    category: z.string(),
  }),
});

// Default configurations
export const DEFAULT_WEATHER_CONDITION: Partial<WeatherCondition> = {
  id: 'default-weather',
  type: 'clear',
  severity: 'mild',
  temperature: {
    current: 20,
    feelsLike: 20,
    min: 15,
    max: 25,
    trend: 'stable',
  },
  humidity: {
    current: 50,
    trend: 'stable',
  },
  wind: {
    speed: 10,
    direction: 0,
    gusts: 15,
    trend: 'stable',
  },
  precipitation: {
    type: 'none',
    intensity: 0,
    probability: 0,
    duration: 0,
  },
  visibility: {
    current: 10000,
    trend: 'stable',
  },
  pressure: {
    current: 1013,
    trend: 'stable',
  },
  uvIndex: {
    current: 5,
    max: 7,
  },
  season: 'spring',
  timeOfDay: 'morning',
  timestamp: Date.now(),
  duration: 60,
  forecast: {
    nextChange: 30,
    trend: 'stable',
  },
};

export const DEFAULT_WEATHER_IMPACT_CONFIG: Partial<WeatherImpactConfig> = {
  id: 'default-impact',
  name: 'Default Weather Impact',
  description: 'Default weather impact configuration',
  enabled: true,
  priority: 0,
  conditions: {
    weatherTypes: ['clear', 'cloudy', 'rainy', 'stormy', 'snowy', 'foggy', 'windy', 'extreme'],
    severities: ['mild', 'moderate', 'severe', 'extreme'],
    seasons: ['spring', 'summer', 'autumn', 'winter'],
    timesOfDay: ['dawn', 'morning', 'noon', 'afternoon', 'evening', 'night'],
    temperatureRanges: [
      { min: -40, max: 50 },
    ],
  },
  impacts: {
    successRate: {
      modifier: 0,
      calculation: 'linear',
      thresholds: {
        excellent: 90,
        good: 75,
        fair: 50,
        poor: 25,
        terrible: 0,
      },
    },
    fatigue: {
      modifier: 0,
      accumulation: 1,
      recovery: 1,
      calculation: 'linear',
    },
    movement: {
      speed: 1,
      accuracy: 1,
      energy: 1,
    },
    morale: {
      modifier: 0,
      decay: 1,
      recovery: 1,
    },
    productivity: {
      modifier: 0,
      quality: 0,
      efficiency: 0,
    },
    resources: {
      consumption: 1,
      generation: 1,
      storage: 1,
    },
  },
  specialEffects: [],
  dependencies: [],
  metadata: {
    version: '1.0.0',
    tags: ['default', 'weather', 'impact'],
    category: 'weather',
  },
};

export const DEFAULT_WEATHER_OVERLAY_CONFIG: Partial<WeatherOverlayConfig> = {
  id: 'default-overlay',
  name: 'Default Weather Overlay',
  type: 'radar',
  enabled: true,
  visible: true,
  opacity: 0.7,
  zIndex: 100,
  bounds: {
    north: 90,
    south: -90,
    east: 180,
    west: -180,
  },
  style: {
    colors: {
      clear: '#87CEEB',
      cloudy: '#808080',
      rainy: '#4682B4',
      stormy: '#2F4F4F',
      snowy: '#F0F8FF',
      foggy: '#D3D3D3',
      windy: '#B0C4DE',
      extreme: '#8B0000',
    },
    gradients: {
      temperature: ['#0000FF', '#00FF00', '#FFFF00', '#FF0000'],
      precipitation: ['#FFFFFF', '#87CEEB', '#4682B4', '#191970'],
      wind: ['#90EE90', '#FFFF00', '#FF8C00', '#FF0000'],
    },
    sizes: {
      small: 10,
      medium: 20,
      large: 30,
      extreme: 50,
    },
    animations: {
      rain: 'falling',
      snow: 'falling',
      wind: 'blowing',
      storm: 'turbulent',
    },
  },
  data: {
    source: 'simulation',
    refreshInterval: 60000,
    cacheDuration: 300000,
  },
  interaction: {
    clickable: true,
    hoverable: true,
    selectable: true,
    tooltips: true,
    popups: true,
  },
  metadata: {
    version: '1.0.0',
    tags: ['default', 'weather', 'overlay'],
    category: 'visualization',
  },
};

// Utility functions
export function validateWeatherCondition(condition: any): { valid: boolean; errors: string[] } {
  try {
    WeatherConditionSchema.parse(condition);
    return { valid: true, errors: [] };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        valid: false,
        errors: error.errors.map(e => `${e.path.join('.')}: ${e.message}`),
      };
    }
    return {
      valid: false,
      errors: [error instanceof Error ? error.message : 'Unknown validation error'],
    };
  }
}

export function validateWeatherImpactConfig(config: any): { valid: boolean; errors: string[] } {
  try {
    WeatherImpactConfigSchema.parse(config);
    return { valid: true, errors: [] };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        valid: false,
        errors: error.errors.map(e => `${e.path.join('.')}: ${e.message}`),
      };
    }
    return {
      valid: false,
      errors: [error instanceof Error ? error.message : 'Unknown validation error'],
    };
  }
}

export function createWeatherCondition(overrides: Partial<WeatherCondition>): WeatherCondition {
  const condition = { ...DEFAULT_WEATHER_CONDITION, ...overrides };
  const validation = validateWeatherCondition(condition);
  
  if (!validation.valid) {
    throw new Error(`Invalid weather condition: ${validation.errors.join(', ')}`);
  }
  
  return condition as WeatherCondition;
}

export function createWeatherImpactConfig(overrides: Partial<WeatherImpactConfig>): WeatherImpactConfig {
  const config = { ...DEFAULT_WEATHER_IMPACT_CONFIG, ...overrides };
  const validation = validateWeatherImpactConfig(config);
  
  if (!validation.valid) {
    throw new Error(`Invalid weather impact config: ${validation.errors.join(', ')}`);
  }
  
  return config as WeatherImpactConfig;
}

export function getWeatherSeverityFromConditions(condition: Partial<WeatherCondition>): WeatherSeverity {
  const factors = [];
  
  // Temperature factor
  if (condition.temperature) {
    const temp = condition.temperature.current;
    if (temp < -20 || temp > 40) factors.push('extreme');
    else if (temp < -10 || temp > 35) factors.push('severe');
    else if (temp < 0 || temp > 30) factors.push('moderate');
    else factors.push('mild');
  }
  
  // Wind factor
  if (condition.wind) {
    const wind = condition.wind.speed;
    if (wind > 100) factors.push('extreme');
    else if (wind > 70) factors.push('severe');
    else if (wind > 40) factors.push('moderate');
    else factors.push('mild');
  }
  
  // Precipitation factor
  if (condition.precipitation) {
    const intensity = condition.precipitation.intensity;
    if (intensity > 50) factors.push('extreme');
    else if (intensity > 25) factors.push('severe');
    else if (intensity > 10) factors.push('moderate');
    else factors.push('mild');
  }
  
  // Visibility factor
  if (condition.visibility) {
    const visibility = condition.visibility.current;
    if (visibility < 100) factors.push('extreme');
    else if (visibility < 500) factors.push('severe');
    else if (visibility < 1000) factors.push('moderate');
    else factors.push('mild');
  }
  
  // Determine severity based on worst factor
  if (factors.includes('extreme')) return 'extreme';
  if (factors.includes('severe')) return 'severe';
  if (factors.includes('moderate')) return 'moderate';
  return 'mild';
}

export function calculateWeatherImpactScore(condition: WeatherCondition, config: WeatherImpactConfig): number {
  // Check if conditions match
  const matchesType = config.conditions.weatherTypes.includes(condition.type);
  const matchesSeverity = config.conditions.severities.includes(condition.severity);
  const matchesSeason = config.conditions.seasons.includes(condition.season);
  const matchesTimeOfDay = config.conditions.timesOfDay.includes(condition.timeOfDay);
  
  // Check temperature range
  const matchesTempRange = config.conditions.temperatureRanges.some(range => 
    condition.temperature.current >= range.min && condition.temperature.current <= range.max
  );
  
  if (!matchesType || !matchesSeverity || !matchesSeason || !matchesTimeOfDay || !matchesTempRange) {
    return 0;
  }
  
  // Calculate base impact score
  let score = 0;
  
  // Temperature impact
  const tempImpact = Math.abs(condition.temperature.current - 20) / 40; // Normalize around 20°C
  score += tempImpact * 0.3;
  
  // Wind impact
  const windImpact = Math.min(condition.wind.speed / 100, 1);
  score += windImpact * 0.2;
  
  // Precipitation impact
  const precipImpact = Math.min(condition.precipitation.intensity / 50, 1);
  score += precipImpact * 0.2;
  
  // Visibility impact
  const visibilityImpact = Math.max(0, 1 - condition.visibility.current / 10000);
  score += visibilityImpact * 0.15;
  
  // Humidity impact
  const humidityImpact = Math.abs(condition.humidity.current - 50) / 50;
  score += humidityImpact * 0.15;
  
  return Math.min(score, 1);
}

// Type exports
export type WeatherConditionType = z.infer<typeof WeatherConditionSchema>;
export type WeatherImpactConfigType = z.infer<typeof WeatherImpactConfigSchema>;
