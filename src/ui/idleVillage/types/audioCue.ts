/**
 * NP-036 – Idle Village Audio Cue Configurator
 * 
 * Audio cue configuration system for drop success/fail, risk events,
 * and other game interactions with telemetry support.
 * 
 * @since 2026-01-13
 * @author Cascade
 */

import { z } from 'zod';

// Audio cue event types
export type AudioCueEventType = 
  | 'drop_success'
  | 'drop_fail'
  | 'drop_risk'
  | 'quest_complete'
  | 'quest_fail'
  | 'resident_arrival'
  | 'resident_departure'
  | 'building_complete'
  | 'building_destroy'
  | 'resource_collect'
  | 'resource_deplete'
  | 'level_up'
  | 'achievement_unlock'
  | 'notification'
  | 'error'
  | 'warning'
  | 'custom';

// Audio cue categories
export type AudioCueCategory = 
  | 'gameplay'
  | 'ui'
  | 'feedback'
  | 'ambient'
  | 'music'
  | 'voice'
  | 'effects'
  | 'system';

// Audio cue priority levels
export type AudioCuePriority = 
  | 'low'
  | 'medium'
  | 'high'
  | 'critical';

// Audio cue playback state
export type AudioCuePlaybackState = 
  | 'idle'
  | 'loading'
  | 'playing'
  | 'paused'
  | 'completed'
  | 'error'
  | 'stopped';

// Audio cue fade types
export type AudioCueFadeType = 
  | 'none'
  | 'in'
  | 'out'
  | 'crossfade'
  | 'fade_in_out';

// Audio cue loop behavior
export type AudioCueLoopBehavior = 
  | 'none'
  | 'once'
  | 'loop'
  | 'ping_pong'
  | 'random';

// Audio cue spatial properties
export interface AudioCueSpatialProperties {
  position: {
    x: number;
    y: number;
    z: number;
  };
  radius: number;
  falloff: 'linear' | 'exponential' | 'logarithmic';
  direction: {
    x: number;
    y: number;
    z: number;
  };
  cone: {
    innerAngle: number;
    outerAngle: number;
    outerGain: number;
  };
}

// Audio cue waveform properties
export interface AudioCueWaveform {
  type: 'sine' | 'square' | 'sawtooth' | 'triangle' | 'noise';
  frequency: number;
  amplitude: number;
  duration: number;
  harmonics: number[];
  envelope: {
    attack: number;
    decay: number;
    sustain: number;
    release: number;
  };
}

// Audio cue filter properties
export interface AudioCueFilter {
  type: 'lowpass' | 'highpass' | 'bandpass' | 'notch' | 'peaking' | 'lowshelf' | 'highshelf';
  frequency: number;
  Q: number;
  gain?: number;
}

// Audio cue compression properties
export interface AudioCueCompression {
  threshold: number;
  knee: number;
  ratio: number;
  attack: number;
  release: number;
  makeupGain: number;
}

// Audio cue reverb properties
export interface AudioCueReverb {
  roomSize: number;
  damping: number;
  wetLevel: number;
  dryLevel: number;
  width: number;
  freeze: boolean;
}

// Audio cue definition
export interface AudioCue {
  id: string;
  name: string;
  description: string;
  eventType: AudioCueEventType;
  category: AudioCueCategory;
  priority: AudioCuePriority;
  
  // Audio source
  source: {
    type: 'file' | 'url' | 'generated' | 'silence';
    path?: string;
    url?: string;
    waveform?: AudioCueWaveform;
    mimeType?: string;
    size?: number;
    duration?: number;
    sampleRate?: number;
    channels?: number;
    bitRate?: number;
  };
  
  // Playback properties
  playback: {
    volume: number; // 0 to 1
    pitch: number; // 0.5 to 2
    pan: number; // -1 to 1
    rate: number; // 0.25 to 4
    loop: AudioCueLoopBehavior;
    fadeIn: number; // seconds
    fadeOut: number; // seconds
    delay: number; // seconds
    maxDuration: number; // seconds
    autoStop: boolean;
  };
  
  // Audio effects
  effects: {
    filters: AudioCueFilter[];
    compression?: AudioCueCompression;
    reverb?: AudioCueReverb;
    distortion?: {
      amount: number;
      oversample: 'none' | '2x' | '4x';
    };
    delay?: {
      delayTime: number;
      feedback: number;
      wetLevel: number;
    };
  };
  
  // Spatial properties
  spatial?: AudioCueSpatialProperties;
  
  // Conditions and triggers
  triggers: {
    events: AudioCueEventType[];
    conditions: string[]; // expression language
    probability: number; // 0 to 1
    cooldown: number; // milliseconds
    maxPlaysPerMinute: number;
    playOnce: boolean;
  };
  
  // Metadata
  metadata: {
    version: string;
    author: string;
    tags: string[];
    createdAt: number;
    updatedAt: number;
    playCount: number;
    lastPlayed: number;
    averagePlayTime: number;
    successRate: number;
    errorCount: number;
  };
  
  // Validation
  validation: {
    isValid: boolean;
    errors: string[];
    warnings: string[];
    score: number; // 0 to 1
  };
  
  // Analytics
  analytics: {
    enabled: boolean;
    trackPlayback: boolean;
    trackPerformance: boolean;
    trackUserInteraction: boolean;
    customMetrics: Record<string, any>;
  };
}

// Audio cue configuration
export interface AudioCueConfig {
  id: string;
  name: string;
  description: string;
  version: string;
  enabled: boolean;
  
  // Global settings
  settings: {
    masterVolume: number; // 0 to 1
    masterMute: boolean;
    maxConcurrentSounds: number;
    sampleRate: number;
    bufferSize: number;
    latency: number; // milliseconds
    crossfadeDuration: number; // seconds
    preloadSounds: boolean;
    cacheSize: number; // MB
  };
  
  // Category settings
  categorySettings: Record<AudioCueCategory, {
    volume: number; // 0 to 1
    mute: boolean;
    maxConcurrent: number;
    priority: AudioCuePriority;
    ducking: {
      enabled: boolean;
      amount: number; // 0 to 1
      duration: number; // seconds
    };
  }>;
  
  // Event mappings
  eventMappings: Record<AudioCueEventType, {
    cueIds: string[];
    priority: AudioCuePriority;
    conditions: string[];
    fallback: string[];
  }>;
  
  // Audio cues
  cues: AudioCue[];
  
  // Validation rules
  validation: {
    enabled: boolean;
    rules: AudioCueValidationRule[];
    strictMode: boolean;
    autoFix: boolean;
  };
  
  // Analytics settings
  analytics: {
    enabled: boolean;
    tracking: {
      playbackEvents: boolean;
      performanceMetrics: boolean;
      userInteractions: boolean;
      errors: boolean;
    };
    reporting: {
      frequency: 'real_time' | 'hourly' | 'daily' | 'weekly';
      formats: ('dashboard' | 'csv' | 'json' | 'pdf')[];
      recipients: string[];
      autoExport: boolean;
    };
    retention: {
      days: number;
      maxEvents: number;
      compression: boolean;
    };
  };
  
  // Export settings
  export: {
    enabled: boolean;
    formats: ('json' | 'csv' | 'xml' | 'wav' | 'mp3' | 'ogg')[];
    destinations: string[];
    schedule: string; // cron expression
    compression: {
      enabled: boolean;
      algorithm: 'gzip' | 'zip' | 'brotli';
      level: number; // 1 to 9
    };
  };
  
  // Metadata
  metadata: {
    version: string;
    createdAt: number;
    updatedAt: number;
    author: string;
    description: string;
    tags: string[];
    dependencies: string[];
    compatibility: {
      minVersion: string;
      maxVersion: string;
    };
  };
}

// Audio cue validation rule
export interface AudioCueValidationRule {
  id: string;
  name: string;
  description: string;
  type: 'audio_format' | 'playback_properties' | 'file_size' | 'duration' | 'volume' | 'custom';
  condition: string; // expression language
  severity: 'error' | 'warning' | 'info';
  message: string;
  enabled: boolean;
  autoFix: boolean;
  metadata: {
    version: string;
    tags: string[];
  };
}

// Audio cue playback event
export interface AudioCuePlaybackEvent {
  id: string;
  cueId: string;
  eventType: AudioCueEventType;
  timestamp: number;
  state: AudioCuePlaybackState;
  duration: number;
  volume: number;
  pitch: number;
  pan: number;
  position?: {
    x: number;
    y: number;
    z: number;
  };
  metadata: {
    userId?: string;
    sessionId: string;
    deviceInfo: {
      userAgent: string;
      platform: string;
      audioContext: string;
      supportedFormats: string[];
    };
    performance: {
      loadTime: number;
      playTime: number;
      bufferTime: number;
      cpuUsage: number;
      memoryUsage: number;
    };
  };
}

// Audio cue telemetry data
export interface AudioCueTelemetry {
  id: string;
  timestamp: number;
  sessionId: string;
  userId?: string;
  
  // Playback metrics
  playback: {
    totalPlays: number;
    successfulPlays: number;
    failedPlays: number;
    averagePlayTime: number;
    totalPlayTime: number;
    cueStatistics: Record<string, {
      plays: number;
      successes: number;
      failures: number;
      averageDuration: number;
      lastPlayed: number;
    }>;
  };
  
  // Performance metrics
  performance: {
    averageLoadTime: number;
    averagePlayTime: number;
    bufferUnderruns: number;
    audioContextState: string;
    sampleRate: number;
    bufferSize: number;
    cpuUsage: number;
    memoryUsage: number;
  };
  
  // User interaction metrics
  userInteraction: {
    muteToggles: number;
    volumeChanges: number;
    cueInteractions: Record<string, number>;
    categoryInteractions: Record<AudioCueCategory, number>;
    settingsChanges: number;
  };
  
  // Error metrics
  errors: {
    totalErrors: number;
    errorTypes: Record<string, number>;
    errorMessages: string[];
    affectedCues: string[];
    recoveryAttempts: number;
    successfulRecoveries: number;
  };
  
  // System metrics
  system: {
    audioContextSupported: boolean;
    webAudioSupported: boolean;
    supportedFormats: string[];
    deviceInfo: {
      userAgent: string;
      platform: string;
      hardwareConcurrency: number;
      deviceMemory: number;
    };
  };
  
  // Custom metrics
  custom: Record<string, unknown>;
}

// Audio cue analysis result
export interface AudioCueAnalysisResult {
  id: string;
  timestamp: number;
  config: AudioCueConfig;
  
  // Analysis metrics
  metrics: {
    totalCues: number;
    enabledCues: number;
    disabledCues: number;
    averageVolume: number;
    averageDuration: number;
    totalFileSize: number;
    categoryDistribution: Record<AudioCueCategory, number>;
    eventTypeDistribution: Record<AudioCueEventType, number>;
    priorityDistribution: Record<AudioCuePriority, number>;
  };
  
  // Performance analysis
  performance: {
    estimatedMemoryUsage: number;
    estimatedCpuUsage: number;
    recommendedBufferSize: number;
    recommendedSampleRate: number;
    potentialBottlenecks: string[];
    optimizationSuggestions: string[];
  };
  
  // Validation results
  validation: {
    totalErrors: number;
    totalWarnings: number;
    issues: Array<{
      cueId: string;
      type: 'error' | 'warning';
      message: string;
      severity: 'low' | 'medium' | 'high' | 'critical';
      autoFixable: boolean;
    }>;
    score: number; // 0 to 1
  };
  
  // Usage analytics
  analytics: {
    mostPlayedCues: Array<{
      cueId: string;
      playCount: number;
      averageDuration: number;
    }>;
    leastPlayedCues: Array<{
      cueId: string;
      playCount: number;
      lastPlayed: number;
    }>;
    categoryUsage: Record<AudioCueCategory, {
      plays: number;
      averageVolume: number;
      totalDuration: number;
    }>;
    eventTypeUsage: Record<AudioCueEventType, {
      plays: number;
      successRate: number;
      averageResponseTime: number;
    }>;
  };
  
  // Recommendations
  recommendations: Array<{
    type: 'performance' | 'usability' | 'maintenance' | 'security';
    priority: 'low' | 'medium' | 'high' | 'critical';
    title: string;
    description: string;
    action: string;
    impact: string;
    effort: string;
  }>;
  
  // Metadata
  metadata: {
    version: string;
    algorithm: string;
    processingTime: number;
    confidence: number; // 0 to 1
  };
}

// Value arrays for type unions
export const AUDIO_CUE_EVENT_TYPES = [
  'drop_success', 'drop_fail', 'drop_risk', 'quest_complete', 'quest_fail',
  'resident_arrival', 'resident_departure', 'building_complete', 'building_destroy',
  'resource_collect', 'resource_deplete', 'level_up', 'achievement_unlock',
  'notification', 'error', 'warning', 'custom'
] as const;

export const AUDIO_CUE_CATEGORIES = [
  'gameplay', 'ui', 'feedback', 'ambient', 'music', 'voice', 'effects', 'system'
] as const;

export const AUDIO_CUE_PRIORITIES = ['low', 'medium', 'high', 'critical'] as const;

export const AUDIO_CUE_PLAYBACK_STATES = [
  'idle', 'loading', 'playing', 'paused', 'completed', 'error', 'stopped'
] as const;

export const AUDIO_CUE_FADE_TYPES = ['none', 'in', 'out', 'crossfade', 'fade_in_out'] as const;

export const AUDIO_CUE_LOOP_BEHAVIORS = ['none', 'once', 'loop', 'ping_pong', 'random'] as const;
export const AudioCueEventTypeSchema = z.enum([
  'drop_success', 'drop_fail', 'drop_risk', 'quest_complete', 'quest_fail',
  'resident_arrival', 'resident_departure', 'building_complete', 'building_destroy',
  'resource_collect', 'resource_deplete', 'level_up', 'achievement_unlock',
  'notification', 'error', 'warning', 'custom'
]);

export const AudioCueCategorySchema = z.enum([
  'gameplay', 'ui', 'feedback', 'ambient', 'music', 'voice', 'effects', 'system'
]);

export const AudioCuePrioritySchema = z.enum(['low', 'medium', 'high', 'critical']);

export const AudioCuePlaybackStateSchema = z.enum([
  'idle', 'loading', 'playing', 'paused', 'completed', 'error', 'stopped'
]);

export const AudioCueFadeTypeSchema = z.enum(['none', 'in', 'out', 'crossfade', 'fade_in_out']);

export const AudioCueLoopBehaviorSchema = z.enum(['none', 'once', 'loop', 'ping_pong', 'random']);

export const AudioCueSpatialPropertiesSchema = z.object({
  position: z.object({ x: z.number(), y: z.number(), z: z.number() }),
  radius: z.number(),
  falloff: z.enum(['linear', 'exponential', 'logarithmic']),
  direction: z.object({ x: z.number(), y: z.number(), z: z.number() }),
  cone: z.object({
    innerAngle: z.number(),
    outerAngle: z.number(),
    outerGain: z.number(),
  }),
});

export const AudioCueWaveformSchema = z.object({
  type: z.enum(['sine', 'square', 'sawtooth', 'triangle', 'noise']),
  frequency: z.number(),
  amplitude: z.number(),
  duration: z.number(),
  harmonics: z.array(z.number()),
  envelope: z.object({
    attack: z.number(),
    decay: z.number(),
    sustain: z.number(),
    release: z.number(),
  }),
});

export const AudioCueFilterSchema = z.object({
  type: z.enum(['lowpass', 'highpass', 'bandpass', 'notch', 'peaking', 'lowshelf', 'highshelf']),
  frequency: z.number(),
  Q: z.number(),
  gain: z.number().optional(),
});

export const AudioCueCompressionSchema = z.object({
  threshold: z.number(),
  knee: z.number(),
  ratio: z.number(),
  attack: z.number(),
  release: z.number(),
  makeupGain: z.number(),
});

export const AudioCueReverbSchema = z.object({
  roomSize: z.number(),
  damping: z.number(),
  wetLevel: z.number(),
  dryLevel: z.number(),
  width: z.number(),
  freeze: z.boolean(),
});

export const AudioCueSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  eventType: AudioCueEventTypeSchema,
  category: AudioCueCategorySchema,
  priority: AudioCuePrioritySchema,
  source: z.object({
    type: z.enum(['file', 'url', 'generated', 'silence']),
    path: z.string().optional(),
    url: z.string().optional(),
    waveform: AudioCueWaveformSchema.optional(),
    mimeType: z.string().optional(),
    size: z.number().optional(),
    duration: z.number().optional(),
    sampleRate: z.number().optional(),
    channels: z.number().optional(),
    bitRate: z.number().optional(),
  }),
  playback: z.object({
    volume: z.number().min(0).max(1),
    pitch: z.number().min(0.5).max(2),
    pan: z.number().min(-1).max(1),
    rate: z.number().min(0.25).max(4),
    loop: AudioCueLoopBehaviorSchema,
    fadeIn: z.number().min(0),
    fadeOut: z.number().min(0),
    delay: z.number().min(0),
    maxDuration: z.number().min(0),
    autoStop: z.boolean(),
  }),
  effects: z.object({
    filters: z.array(AudioCueFilterSchema),
    compression: AudioCueCompressionSchema.optional(),
    reverb: AudioCueReverbSchema.optional(),
    distortion: z.object({
      amount: z.number(),
      oversample: z.enum(['none', '2x', '4x']),
    }).optional(),
    delay: z.object({
      delayTime: z.number(),
      feedback: z.number(),
      wetLevel: z.number(),
    }).optional(),
  }),
  spatial: AudioCueSpatialPropertiesSchema.optional(),
  triggers: z.object({
    events: z.array(AudioCueEventTypeSchema),
    conditions: z.array(z.string()),
    probability: z.number().min(0).max(1),
    cooldown: z.number().min(0),
    maxPlaysPerMinute: z.number().min(0),
    playOnce: z.boolean(),
  }),
  metadata: z.object({
    version: z.string(),
    author: z.string(),
    tags: z.array(z.string()),
    createdAt: z.number(),
    updatedAt: z.number(),
    playCount: z.number().min(0),
    lastPlayed: z.number(),
    averagePlayTime: z.number().min(0),
    successRate: z.number().min(0).max(1),
    errorCount: z.number().min(0),
  }),
  validation: z.object({
    isValid: z.boolean(),
    errors: z.array(z.string()),
    warnings: z.array(z.string()),
    score: z.number().min(0).max(1),
  }),
  analytics: z.object({
    enabled: z.boolean(),
    trackPlayback: z.boolean(),
    trackPerformance: z.boolean(),
    trackUserInteraction: z.boolean(),
    customMetrics: z.record(z.unknown()),
  }),
});

export const AudioCueConfigSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  version: z.string(),
  enabled: z.boolean(),
  settings: z.object({
    masterVolume: z.number().min(0).max(1),
    masterMute: z.boolean(),
    maxConcurrentSounds: z.number().min(1),
    sampleRate: z.number().min(8000).max(192000),
    bufferSize: z.number().min(64).max(8192),
    latency: z.number().min(0),
    crossfadeDuration: z.number().min(0),
    preloadSounds: z.boolean(),
    cacheSize: z.number().min(1),
  }),
  categorySettings: z.record(z.object({
    volume: z.number().min(0).max(1),
    mute: z.boolean(),
    maxConcurrent: z.number().min(1),
    priority: AudioCuePrioritySchema,
    ducking: z.object({
      enabled: z.boolean(),
      amount: z.number().min(0).max(1),
      duration: z.number().min(0),
    }),
  })),
  eventMappings: z.record(z.object({
    cueIds: z.array(z.string()),
    priority: AudioCuePrioritySchema,
    conditions: z.array(z.string()),
    fallback: z.array(z.string()),
  })),
  cues: z.array(AudioCueSchema),
  validation: z.object({
    enabled: z.boolean(),
    rules: z.array(z.any()), // Will be defined separately
    strictMode: z.boolean(),
    autoFix: z.boolean(),
  }),
  analytics: z.object({
    enabled: z.boolean(),
    tracking: z.object({
      playbackEvents: z.boolean(),
      performanceMetrics: z.boolean(),
      userInteractions: z.boolean(),
      errors: z.boolean(),
    }),
    reporting: z.object({
      frequency: z.enum(['real_time', 'hourly', 'daily', 'weekly']),
      formats: z.array(z.enum(['dashboard', 'csv', 'json', 'pdf'])),
      recipients: z.array(z.string()),
      autoExport: z.boolean(),
    }),
    retention: z.object({
      days: z.number().min(1),
      maxEvents: z.number().min(100),
      compression: z.boolean(),
    }),
  }),
  export: z.object({
    enabled: z.boolean(),
    formats: z.array(z.enum(['json', 'csv', 'xml', 'wav', 'mp3', 'ogg'])),
    destinations: z.array(z.string()),
    schedule: z.string(),
    compression: z.object({
      enabled: z.boolean(),
      algorithm: z.enum(['gzip', 'zip', 'brotli']),
      level: z.number().min(1).max(9),
    }),
  }),
  metadata: z.object({
    version: z.string(),
    createdAt: z.number(),
    updatedAt: z.number(),
    author: z.string(),
    description: z.string(),
    tags: z.array(z.string()),
    dependencies: z.array(z.string()),
    compatibility: z.object({
      minVersion: z.string(),
      maxVersion: z.string(),
    }),
  }),
});

// Default configurations
export const DEFAULT_AUDIO_CUE_CONFIG: AudioCueConfig = {
  id: 'default-audio-cue-config',
  name: 'Default Audio Cue Configuration',
  description: 'Default configuration for audio cue management',
  version: '1.0.0',
  enabled: true,
  
  settings: {
    masterVolume: 0.8,
    masterMute: false,
    maxConcurrentSounds: 8,
    sampleRate: 44100,
    bufferSize: 2048,
    latency: 50,
    crossfadeDuration: 0.1,
    preloadSounds: true,
    cacheSize: 100,
  },
  
  categorySettings: {
    gameplay: {
      volume: 0.8,
      mute: false,
      maxConcurrent: 4,
      priority: 'high',
      ducking: {
        enabled: true,
        amount: 0.3,
        duration: 0.5,
      },
    },
    ui: {
      volume: 0.6,
      mute: false,
      maxConcurrent: 2,
      priority: 'medium',
      ducking: {
        enabled: false,
        amount: 0,
        duration: 0,
      },
    },
    feedback: {
      volume: 0.9,
      mute: false,
      maxConcurrent: 3,
      priority: 'high',
      ducking: {
        enabled: true,
        amount: 0.2,
        duration: 0.3,
      },
    },
    ambient: {
      volume: 0.4,
      mute: false,
      maxConcurrent: 2,
      priority: 'low',
      ducking: {
        enabled: true,
        amount: 0.5,
        duration: 1.0,
      },
    },
    music: {
      volume: 0.7,
      mute: false,
      maxConcurrent: 1,
      priority: 'medium',
      ducking: {
        enabled: true,
        amount: 0.4,
        duration: 0.8,
      },
    },
    voice: {
      volume: 0.9,
      mute: false,
      maxConcurrent: 2,
      priority: 'critical',
      ducking: {
        enabled: true,
        amount: 0.6,
        duration: 0.4,
      },
    },
    effects: {
      volume: 0.8,
      mute: false,
      maxConcurrent: 6,
      priority: 'medium',
      ducking: {
        enabled: true,
        amount: 0.3,
        duration: 0.5,
      },
    },
    system: {
      volume: 0.7,
      mute: false,
      maxConcurrent: 1,
      priority: 'critical',
      ducking: {
        enabled: true,
        amount: 0.7,
        duration: 0.2,
      },
    },
  },
  
  eventMappings: {
    drop_success: {
      cueIds: ['drop-success-cue'],
      priority: 'high',
      conditions: [],
      fallback: ['notification-cue'],
    },
    drop_fail: {
      cueIds: ['drop-fail-cue'],
      priority: 'high',
      conditions: [],
      fallback: ['error-cue'],
    },
    drop_risk: {
      cueIds: ['drop-risk-cue'],
      priority: 'medium',
      conditions: [],
      fallback: ['warning-cue'],
    },
    quest_complete: {
      cueIds: ['quest-complete-cue'],
      priority: 'high',
      conditions: [],
      fallback: ['notification-cue'],
    },
    quest_fail: {
      cueIds: ['quest-fail-cue'],
      priority: 'medium',
      conditions: [],
      fallback: ['error-cue'],
    },
    resident_arrival: {
      cueIds: ['resident-arrival-cue'],
      priority: 'medium',
      conditions: [],
      fallback: ['notification-cue'],
    },
    resident_departure: {
      cueIds: ['resident-departure-cue'],
      priority: 'medium',
      conditions: [],
      fallback: ['notification-cue'],
    },
    building_complete: {
      cueIds: ['building-complete-cue'],
      priority: 'high',
      conditions: [],
      fallback: ['notification-cue'],
    },
    building_destroy: {
      cueIds: ['building-destroy-cue'],
      priority: 'medium',
      conditions: [],
      fallback: ['warning-cue'],
    },
    resource_collect: {
      cueIds: ['resource-collect-cue'],
      priority: 'low',
      conditions: [],
      fallback: [],
    },
    resource_deplete: {
      cueIds: ['resource-deplete-cue'],
      priority: 'medium',
      conditions: [],
      fallback: ['warning-cue'],
    },
    level_up: {
      cueIds: ['level-up-cue'],
      priority: 'high',
      conditions: [],
      fallback: ['notification-cue'],
    },
    achievement_unlock: {
      cueIds: ['achievement-unlock-cue'],
      priority: 'high',
      conditions: [],
      fallback: ['notification-cue'],
    },
    notification: {
      cueIds: ['notification-cue'],
      priority: 'medium',
      conditions: [],
      fallback: [],
    },
    error: {
      cueIds: ['error-cue'],
      priority: 'critical',
      conditions: [],
      fallback: [],
    },
    warning: {
      cueIds: ['warning-cue'],
      priority: 'high',
      conditions: [],
      fallback: ['notification-cue'],
    },
    custom: {
      cueIds: [],
      priority: 'medium',
      conditions: [],
      fallback: ['notification-cue'],
    },
  },
  
  cues: [],
  
  validation: {
    enabled: true,
    rules: [],
    strictMode: false,
    autoFix: true,
  },
  
  analytics: {
    enabled: true,
    tracking: {
      playbackEvents: true,
      performanceMetrics: true,
      userInteractions: true,
      errors: true,
    },
    reporting: {
      frequency: 'daily',
      formats: ['dashboard', 'csv', 'json'],
      recipients: [],
      autoExport: false,
    },
    retention: {
      days: 30,
      maxEvents: 10000,
      compression: true,
    },
  },
  
  export: {
    enabled: true,
    formats: ['json', 'csv'],
    destinations: ['/exports/audio-cues'],
    schedule: '0 0 * * *',
    compression: {
      enabled: true,
      algorithm: 'gzip',
      level: 6,
    },
  },
  
  metadata: {
    version: '1.0.0',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    author: 'system',
    description: 'Default audio cue configuration',
    tags: ['default', 'audio', 'cue', 'config'],
    dependencies: [],
    compatibility: {
      minVersion: '1.0.0',
      maxVersion: '2.0.0',
    },
  },
};

// Utility functions
export function validateAudioCue(cue: AudioCue): boolean {
  try {
    AudioCueSchema.parse(cue);
    return true;
  } catch {
    return false;
  }
}

export function validateAudioCueConfig(config: AudioCueConfig): boolean {
  try {
    AudioCueConfigSchema.parse(config);
    return true;
  } catch {
    return false;
  }
}

export function createAudioCue(overrides: Partial<AudioCue> = {}): AudioCue {
  const now = Date.now();
  return {
    id: `cue-${now}-${Math.random().toString(36).substr(2, 9)}`,
    name: 'New Audio Cue',
    description: 'A new audio cue',
    eventType: 'notification',
    category: 'ui',
    priority: 'medium',
    source: {
      type: 'silence',
      duration: 0.1,
    },
    playback: {
      volume: 0.8,
      pitch: 1,
      pan: 0,
      rate: 1,
      loop: 'none',
      fadeIn: 0,
      fadeOut: 0,
      delay: 0,
      maxDuration: 10,
      autoStop: true,
    },
    effects: {
      filters: [],
    },
    triggers: {
      events: ['notification'],
      conditions: [],
      probability: 1,
      cooldown: 0,
      maxPlaysPerMinute: 60,
      playOnce: false,
    },
    metadata: {
      version: '1.0.0',
      author: 'system',
      tags: [],
      createdAt: now,
      updatedAt: now,
      playCount: 0,
      lastPlayed: 0,
      averagePlayTime: 0,
      successRate: 1,
      errorCount: 0,
    },
    validation: {
      isValid: true,
      errors: [],
      warnings: [],
      score: 1,
    },
    analytics: {
      enabled: true,
      trackPlayback: true,
      trackPerformance: true,
      trackUserInteraction: true,
      customMetrics: {},
    },
    ...overrides,
  };
}

export function createAudioCueConfig(overrides: Partial<AudioCueConfig> = {}): AudioCueConfig {
  const now = Date.now();
  return {
    id: `config-${now}-${Math.random().toString(36).substr(2, 9)}`,
    name: 'New Audio Cue Configuration',
    description: 'A new audio cue configuration',
    version: '1.0.0',
    enabled: true,
    settings: DEFAULT_AUDIO_CUE_CONFIG.settings,
    categorySettings: DEFAULT_AUDIO_CUE_CONFIG.categorySettings,
    eventMappings: DEFAULT_AUDIO_CUE_CONFIG.eventMappings,
    cues: [],
    validation: DEFAULT_AUDIO_CUE_CONFIG.validation,
    analytics: DEFAULT_AUDIO_CUE_CONFIG.analytics,
    export: DEFAULT_AUDIO_CUE_CONFIG.export,
    metadata: {
      version: '1.0.0',
      createdAt: now,
      updatedAt: now,
      author: 'system',
      description: 'New audio cue configuration',
      tags: [],
      dependencies: [],
      compatibility: {
        minVersion: '1.0.0',
        maxVersion: '2.0.0',
      },
    },
    ...overrides,
  };
}

export function getEventTypeDescription(eventType: AudioCueEventType): string {
  switch (eventType) {
    case 'drop_success': return 'Successful drop action';
    case 'drop_fail': return 'Failed drop action';
    case 'drop_risk': return 'Risky drop action';
    case 'quest_complete': return 'Quest completed successfully';
    case 'quest_fail': return 'Quest failed';
    case 'resident_arrival': return 'New resident arrived';
    case 'resident_departure': return 'Resident departed';
    case 'building_complete': return 'Building construction completed';
    case 'building_destroy': return 'Building destroyed';
    case 'resource_collect': return 'Resource collected';
    case 'resource_deplete': return 'Resource depleted';
    case 'level_up': return 'Player leveled up';
    case 'achievement_unlock': return 'Achievement unlocked';
    case 'notification': return 'General notification';
    case 'error': return 'Error occurred';
    case 'warning': return 'Warning message';
    case 'custom': return 'Custom event';
  }
}

export function getCategoryDescription(category: AudioCueCategory): string {
  switch (category) {
    case 'gameplay': return 'Gameplay-related audio cues';
    case 'ui': return 'User interface audio cues';
    case 'feedback': return 'User feedback audio cues';
    case 'ambient': return 'Ambient audio cues';
    case 'music': return 'Music audio cues';
    case 'voice': return 'Voice audio cues';
    case 'effects': return 'Sound effects';
    case 'system': return 'System audio cues';
  }
}

export function getPriorityDescription(priority: AudioCuePriority): string {
  switch (priority) {
    case 'low': return 'Low priority audio cue';
    case 'medium': return 'Medium priority audio cue';
    case 'high': return 'High priority audio cue';
    case 'critical': return 'Critical priority audio cue';
  }
}

export function getPlaybackStateDescription(state: AudioCuePlaybackState): string {
  switch (state) {
    case 'idle': return 'Audio cue is idle';
    case 'loading': return 'Audio cue is loading';
    case 'playing': return 'Audio cue is playing';
    case 'paused': return 'Audio cue is paused';
    case 'completed': return 'Audio cue completed playback';
    case 'error': return 'Audio cue encountered an error';
    case 'stopped': return 'Audio cue was stopped';
  }
}
