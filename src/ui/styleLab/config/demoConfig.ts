/**
 * Style Lab Demo Configuration
 * 
 * Config-first parameters for Style Laboratory demo components.
 * All timing, animation, and visual values are configurable.
 * 
 * WL-STY-004: Added atomic ActionCard/Halo bridging atoms:
 * - actionCardFeel: physics, visual, interaction tokens for ActionCard base element
 * - mapHaloFeel: visual and interaction tokens for map POI halos
 * - haloShader: shader-like visual effects (gradient, blur, animation) for halos
 * Each atom includes pillar variants (frontier/empire/wilderness) for Wanderlust dual-pillar support.
 */

import { z } from 'zod';

export type StyleLabPillar = 'frontier' | 'empire' | 'wilderness';

const DemoConfigMetaSchema = z.object({
  presetId: z.string().min(1).default('minimalFrontier'),
  presetLabel: z.string().min(1).default('Minimal Frontier'),
  pillar: z.enum(['frontier', 'empire', 'wilderness']).default('frontier'),
  sourceId: z.string().min(1).default('minimalFrontier'),
  isCustom: z.boolean().default(false),
});

export type DemoConfigMeta = z.infer<typeof DemoConfigMetaSchema>;

export const DEFAULT_DEMO_CONFIG_META: DemoConfigMeta = {
  presetId: 'minimalFrontier',
  presetLabel: 'Minimal Frontier',
  pillar: 'frontier',
  sourceId: 'minimalFrontier',
  isCustom: false,
};

/**
 * Layout configuration for split view
 */
export const LayoutConfigSchema = z.object({
  splitRatio: z.number().min(0.1).max(0.9).default(0.6),
  controlWidth: z.number().min(200).max(400).default(300),
  showGrid: z.boolean().default(false),
});

/**
 * Drag & Drop demo configuration
 */
export const DragDropConfigSchema = z.object({
  springStiffness: z.number().min(100).max(500).default(300),
  springDamping: z.number().min(10).max(50).default(25),
  glowIntensity: z.number().min(0.1).max(1.0).default(0.6),
  loopTiming: z.number().min(1000).max(5000).default(2000),
  holdDuration: z.number().min(500).max(3000).default(2000),
  autoLoop: z.boolean().default(true),
  showTrail: z.boolean().default(true),
});

/**
 * Button demo configuration
 */
export const ButtonConfigSchema = z.object({
  squashFactor: z.number().min(0.8).max(1).default(0.85),
  holdDuration: z.number().min(500).max(3000).default(2000),
  clickTiming: z.number().min(1000).max(5000).default(3000),
  autoLoop: z.boolean().default(true),
  showRipple: z.boolean().default(true),
});

/**
 * Slider demo configuration
 */
export const SliderConfigSchema = z.object({
  minValue: z.number().min(0).max(100).default(0),
  maxValue: z.number().min(0).max(100).default(100),
  currentValue: z.number().min(0).max(100).default(50),
  autoMove: z.boolean().default(true),
  moveSpeed: z.number().min(0.5).max(5).default(1.0),
  moveDirection: z.enum(['forward', 'backward', 'random']).default('forward'),
  showValue: z.boolean().default(true),
  stepSize: z.number().min(0.1).max(10).default(1),
  trackHeight: z.number().min(4).max(12).default(8),
});

/**
 * Toggle demo configuration
 */
export const ToggleConfigSchema = z.object({
  isOn: z.boolean().default(false),
  autoToggle: z.boolean().default(true),
  toggleInterval: z.number().min(1000).max(10000).default(3000),
  showLabel: z.boolean().default(true),
  toggleAnimation: z.boolean().default(true),
  switchSize: z.enum(['small', 'medium', 'large']).default('medium'),
});

/**
 * Progress ring demo configuration
 */
export const ProgressRingConfigSchema = z.object({
  percentage: z.number().min(0).max(100).default(0),
  autoFill: z.boolean().default(true),
  fillSpeed: z.number().min(0.5).max(5).default(1.0),
  strokeWidth: z.number().min(2).max(8).default(4),
  ringSize: z.number().min(60).max(200).default(120),
  showPercentage: z.boolean().default(true),
  clockwise: z.boolean().default(true),
});

/**
 * Text field demo configuration
 */
export const TextFieldConfigSchema = z.object({
  placeholder: z.string().default('Enter text here...'),
  value: z.string().default(''),
  autoFocus: z.boolean().default(true),
  focusInterval: z.number().min(2000).max(8000).default(4000),
  showClearButton: z.boolean().default(true),
  maxLength: z.number().min(10).max(100).default(50),
  fieldType: z.enum(['text', 'email', 'password', 'search']).default('text'),
});

/**
 * Toast demo configuration
 */
export const ToastConfigSchema = z.object({
  message: z.string().default('Notification message'),
  isVisible: z.boolean().default(false),
  autoShow: z.boolean().default(true),
  showInterval: z.number().min(3000).max(20000).default(5000),
  duration: z.number().min(1000).max(8000).default(3000),
  position: z.enum(['top-left', 'top-right', 'bottom-left', 'bottom-right', 'center']).default('top-right'),
  type: z.enum(['success', 'error', 'info', 'warning']).default('info'),
  showIcon: z.boolean().default(true),
});

/**
 * Hover card demo configuration
 */
export const HoverCardConfigSchema = z.object({
  isHovered: z.boolean().default(false),
  autoHover: z.boolean().default(true),
  hoverDelay: z.number().min(500).max(3000).default(1000),
  contentRotation: z.boolean().default(true),
  rotationSpeed: z.number().min(1).max(10).default(3),
  cardWidth: z.number().min(200).max(400).default(300),
  cardHeight: z.number().min(150).max(300).default(200),
  showShadow: z.boolean().default(true),
  content: z.array(z.string()).default(['Card Content 1', 'Card Content 2', 'Card Content 3']),
});

/**
 * Global animation configuration
 */
export const AnimationConfigSchema = z.object({
  enabled: z.boolean().default(true),
  speed: z.number().min(0.5).max(2.0).default(1.0),
  reducedMotion: z.boolean().default(false),
});

/**
 * Game Feel configuration for Style Laboratory
 */
export const GameFeelConfigSchema = z.object({
  // Animation physics
  springStiffness: z.number().min(100).max(500).default(300),
  dampingRatio: z.number().min(0.1).max(1.0).default(0.7),
  overshootAmount: z.number().min(0).max(50).default(15),
  durationMultiplier: z.number().min(0.5).max(2.0).default(1.0),
  
  // Visual effects
  glowIntensity: z.number().min(0).max(100).default(60),
  particleDensity: z.number().min(0).max(100).default(30),
  shadowDepth: z.number().min(0).max(20).default(8),
  colorSaturation: z.number().min(50).max(150).default(100),
  
  // Audio settings
  masterVolume: z.number().min(0).max(100).default(70),
  effectVolume: z.number().min(0).max(100).default(80),
  pitchVariation: z.number().min(0).max(50).default(10),
  reverbAmount: z.number().min(0).max(100).default(20),
  
  // Haptic settings
  vibrationIntensity: z.number().min(0).max(100).default(50),
  patternComplexity: z.enum(['simple', 'complex']).default('simple'),
  responseDelay: z.number().min(0).max(200).default(50),
  
  // Response timing
  immediateResponseMs: z.number().min(0).max(100).default(50),
  impactResponseMs: z.number().min(100).max(300).default(200),
  communicationMs: z.number().min(300).max(1000).default(600),
});

/**
 * ActionCardFeel configuration – atomic feel tokens for ActionCard base element
 */
export const ActionCardFeelConfigSchema = z.object({
  enabled: z.boolean().default(true),
  physics: z.object({
    mass: z.number().min(0.5).max(2.0).default(1.0),
    damping: z.number().min(0.1).max(0.5).default(0.2),
    stiffness: z.number().min(100).max(500).default(180),
    liftScale: z.number().min(0.9).max(1.2).default(1.0),
  }),
  visual: z.object({
    frameColor: z.string().default('rgb(71, 85, 105)'), // slate-600
    frameGlow: z.string().default('rgba(71, 85, 105, 0.4)'),
    backgroundColor: z.string().default('rgb(30, 41, 59)'), // slate-800
    shadowDepth: z.number().min(4).max(32).default(12),
    rimLightIntensity: z.number().min(0).max(1).default(0.2),
    borderRadius: z.string().default('8px'),
    padding: z.string().default('16px'),
  }),
  interaction: z.object({
    hoverScale: z.number().min(0.95).max(1.05).default(1.02),
    activeScale: z.number().min(0.9).max(1.0).default(0.96),
    transitionMs: z.number().min(100).max(800).default(200),
    hapticIntensity: z.number().min(0).max(100).default(40),
  }),
  pillars: z.object({
    frontier: z.object({
      frameColor: z.string(),
      frameGlow: z.string(),
      backgroundColor: z.string(),
      rimLightIntensity: z.number(),
    }),
    empire: z.object({
      frameColor: z.string(),
      frameGlow: z.string(),
      backgroundColor: z.string(),
      rimLightIntensity: z.number(),
    }),
    wilderness: z.object({
      frameColor: z.string(),
      frameGlow: z.string(),
      backgroundColor: z.string(),
      rimLightIntensity: z.number(),
    }),
  }),
});

/**
 * MapHaloFeel configuration – atomic feel tokens for map POI halos
 */
export const MapHaloFeelConfigSchema = z.object({
  enabled: z.boolean().default(true),
  visual: z.object({
    haloColor: z.string().default('rgb(71, 85, 105)'), // slate-600
    haloGlow: z.string().default('rgba(71, 85, 105, 0.6)'),
    pulseIntensity: z.number().min(0).max(1).default(0.4),
    pulseSpeed: z.number().min(0.5).max(3).default(1.5),
    ringWidth: z.number().min(2).max(8).default(4),
    ringRadius: z.number().min(20).max(60).default(32),
    iconSize: z.number().min(12).max(32).default(20),
    shadowBlur: z.number().min(4).max(20).default(8),
  }),
  interaction: z.object({
    hoverScale: z.number().min(1.0).max(1.3).default(1.15),
    activeScale: z.number().min(0.9).max(1.1).default(1.05),
    transitionMs: z.number().min(100).max(600).default(180),
    hapticIntensity: z.number().min(0).max(100).default(30),
  }),
  pillars: z.object({
    frontier: z.object({
      haloColor: z.string(),
      haloGlow: z.string(),
      pulseIntensity: z.number(),
    }),
    empire: z.object({
      haloColor: z.string(),
      haloGlow: z.string(),
      pulseIntensity: z.number(),
    }),
    wilderness: z.object({
      haloColor: z.string(),
      haloGlow: z.string(),
      pulseIntensity: z.number(),
    }),
  }),
});

/**
 * HaloShader configuration – shader-like visual effects for halos
 */
export const HaloShaderConfigSchema = z.object({
  enabled: z.boolean().default(true),
  shader: z.object({
    gradientType: z.enum(['radial', 'conic', 'linear']).default('radial'),
    gradientStops: z.array(z.object({
      offset: z.number().min(0).max(1).default(0),
      color: z.string().default('rgba(71, 85, 105, 0.8)'),
      opacity: z.number().min(0).max(1).default(0.8),
    })).default([
      { offset: 0, color: 'rgba(71, 85, 105, 0.8)', opacity: 0.8 },
      { offset: 0.5, color: 'rgba(71, 85, 105, 0.4)', opacity: 0.4 },
      { offset: 1, color: 'rgba(71, 85, 105, 0)', opacity: 0 },
    ]),
    blurRadius: z.number().min(0).max(20).default(6),
    spreadRadius: z.number().min(-10).max(10).default(2),
    animationDuration: z.number().min(0.5).max(5).default(2.0),
    animationEasing: z.string().default('ease-in-out'),
  }),
  pillars: z.object({
    frontier: z.object({
      gradientStops: z.array(z.object({
        offset: z.number(),
        color: z.string(),
        opacity: z.number(),
      })),
    }),
    empire: z.object({
      gradientStops: z.array(z.object({
        offset: z.number(),
        color: z.string(),
        opacity: z.number(),
      })),
    }),
    wilderness: z.object({
      gradientStops: z.array(z.object({
        offset: z.number(),
        color: z.string(),
        opacity: z.number(),
      })),
    }),
  }),
});

/**
 * PgCard Medal Skin configuration for Wanderlust preset
 */
export const PgCardSkinConfigSchema = z.object({
  enabled: z.boolean().default(true),
  physics: z.object({
    mass: z.number().min(0.5).max(2.0).default(1.2),
    damping: z.number().min(0.1).max(0.5).default(0.18),
    stiffness: z.number().min(100).max(500).default(160),
  }),
  visual: z.object({
    metalGradient: z.string().default('linear-gradient(135deg, #1a0c04 0%, #4a2c18 50%, #6b4423 100%)'),
    gemGradient: z.string().default('linear-gradient(120deg, #fce890 0%, #e4b048 16%, #a05c18 52%, #602c08 76%, #341604 100%)'),
    shadowDepth: z.number().min(4).max(32).default(16),
    glassTint: z.string().default('rgba(255,255,255,0.08)'),
    patinaOpacity: z.number().min(0).max(1).default(0.4),
    rimLightIntensity: z.number().min(0).max(1).default(0.26),
    glowIntensity: z.number().min(0).max(1).default(0.32),
  }),
  audio: z.object({
    pickupCue: z.string().default('medal.pickup'),
    dropCue: z.string().default('medal.drop'),
    rejectCue: z.string().default('medal.reject'),
    volume: z.number().min(0).max(100).default(80),
  }),
  pillars: z.object({
    wilderness: z.object({
      metalGradient: z.string().default('linear-gradient(135deg, #2a1810 0%, #5a3c28 50%, #7a5438 100%)'),
      gemGradient: z.string().default('linear-gradient(120deg, #d8ffd8 0%, #72ee82 40%, #1a7830 100%)'),
      patinaColor: z.string().default('rgba(44,116,66,0.30)'),
      rimLightColor: z.string().default('rgba(168,200,168,0.26)'),
      glowColor: z.string().default('rgba(58,215,80,0.40)'),
    }),
    empire: z.object({
      metalGradient: z.string().default('linear-gradient(135deg, #0a0402 0%, #3a1c08 50%, #5a2c18 100%)'),
      gemGradient: z.string().default('linear-gradient(120deg, #fce890 0%, #e4b048 16%, #a05c18 52%, #602c08 76%, #341604 100%)'),
      patinaColor: z.string().default('rgba(192,112,40,0.30)'),
      rimLightColor: z.string().default('rgba(255,238,148,0.26)'),
      glowColor: z.string().default('rgba(216,144,64,0.32)'),
    }),
  }),
});

/**
 * Complete demo configuration schema
 */
export const DemoConfigSchema = z.object({
  meta: DemoConfigMetaSchema.default(DEFAULT_DEMO_CONFIG_META),
  layout: LayoutConfigSchema,
  dragDrop: DragDropConfigSchema,
  button: ButtonConfigSchema,
  slider: SliderConfigSchema,
  toggle: ToggleConfigSchema,
  progressRing: ProgressRingConfigSchema,
  textField: TextFieldConfigSchema,
  toast: ToastConfigSchema,
  hoverCard: HoverCardConfigSchema,
  animation: AnimationConfigSchema,
  gameFeel: GameFeelConfigSchema,
  // WL-STY-004: ActionCard/Halo bridging atoms
  actionCardFeel: ActionCardFeelConfigSchema,
  mapHaloFeel: MapHaloFeelConfigSchema,
  haloShader: HaloShaderConfigSchema,
  pgCardSkin: PgCardSkinConfigSchema,
});

export type DemoConfig = z.infer<typeof DemoConfigSchema>;
export type LayoutConfig = z.infer<typeof LayoutConfigSchema>;
export type DragDropConfig = z.infer<typeof DragDropConfigSchema>;
export type ButtonConfig = z.infer<typeof ButtonConfigSchema>;
export type SliderConfig = z.infer<typeof SliderConfigSchema>;
export type ToggleConfig = z.infer<typeof ToggleConfigSchema>;
export type ProgressRingConfig = z.infer<typeof ProgressRingConfigSchema>;
export type TextFieldConfig = z.infer<typeof TextFieldConfigSchema>;
export type ToastConfig = z.infer<typeof ToastConfigSchema>;
export type HoverCardConfig = z.infer<typeof HoverCardConfigSchema>;
export type AnimationConfig = z.infer<typeof AnimationConfigSchema>;
export type GameFeelConfig = z.infer<typeof GameFeelConfigSchema>;
// WL-STY-004: ActionCard/Halo bridging types
export type ActionCardFeelConfig = z.infer<typeof ActionCardFeelConfigSchema>;
export type MapHaloFeelConfig = z.infer<typeof MapHaloFeelConfigSchema>;
export type HaloShaderConfig = z.infer<typeof HaloShaderConfigSchema>;
export type PgCardSkinConfig = z.infer<typeof PgCardSkinConfigSchema>;

/**
 * Default demo configuration
 */
export const defaultDemoConfig: DemoConfig = {
  meta: DEFAULT_DEMO_CONFIG_META,
  layout: {
    splitRatio: 0.6,
    controlWidth: 300,
    showGrid: false,
  },
  dragDrop: {
    springStiffness: 300,
    springDamping: 25,
    glowIntensity: 0.6,
    loopTiming: 2000,
    holdDuration: 2000,
    autoLoop: true,
    showTrail: true,
  },
  button: {
    squashFactor: 0.85,
    holdDuration: 2000,
    clickTiming: 3000,
    autoLoop: true,
    showRipple: true,
  },
  /**
   * Advanced components configuration
   */
  slider: {
    minValue: 0,
    maxValue: 100,
    currentValue: 50,
    autoMove: true,
    moveSpeed: 1.0,
    moveDirection: 'forward',
    showValue: true,
    stepSize: 1,
    trackHeight: 8,
  },
  toggle: {
    isOn: false,
    autoToggle: true,
    toggleInterval: 3000,
    showLabel: true,
    toggleAnimation: true,
    switchSize: 'medium',
  },
  progressRing: {
    percentage: 0,
    autoFill: true,
    fillSpeed: 1.0,
    strokeWidth: 4,
    ringSize: 120,
    showPercentage: true,
    clockwise: true,
  },
  textField: {
    placeholder: 'Enter text here...',
    value: '',
    autoFocus: true,
    focusInterval: 4000,
    showClearButton: true,
    maxLength: 50,
    fieldType: 'text',
  },
  toast: {
    message: 'Notification message',
    isVisible: false,
    autoShow: true,
    showInterval: 5000,
    duration: 3000,
    position: 'top-right',
    type: 'info',
    showIcon: true,
  },
  hoverCard: {
    isHovered: false,
    autoHover: true,
    hoverDelay: 1000,
    contentRotation: true,
    rotationSpeed: 3,
    cardWidth: 300,
    cardHeight: 200,
    showShadow: true,
    content: ['Card Content 1', 'Card Content 2', 'Card Content 3'] as string[],
  },
  animation: {
    enabled: true,
    speed: 1.0,
    reducedMotion: false,
  },
  gameFeel: {
    // Animation physics
    springStiffness: 300,
    dampingRatio: 0.7,
    overshootAmount: 15,
    durationMultiplier: 1.0,
    
    // Visual effects
    glowIntensity: 60,
    particleDensity: 30,
    shadowDepth: 8,
    colorSaturation: 100,
    
    // Audio settings
    masterVolume: 70,
    effectVolume: 80,
    pitchVariation: 10,
    reverbAmount: 20,
    
    // Haptic settings
    vibrationIntensity: 50,
    patternComplexity: 'simple',
    responseDelay: 50,
    
    // Response timing
    immediateResponseMs: 50,
    impactResponseMs: 200,
    communicationMs: 600,
  },
  // WL-STY-004: ActionCard/Halo bridging atoms (frontier defaults)
  actionCardFeel: {
    enabled: true,
    physics: {
      mass: 1.0,
      damping: 0.2,
      stiffness: 180,
      liftScale: 1.0,
    },
    visual: {
      frameColor: 'rgb(71, 85, 105)', // slate-600
      frameGlow: 'rgba(71, 85, 105, 0.4)',
      backgroundColor: 'rgb(30, 41, 59)', // slate-800
      shadowDepth: 12,
      rimLightIntensity: 0.2,
      borderRadius: '8px',
      padding: '16px',
    },
    interaction: {
      hoverScale: 1.02,
      activeScale: 0.96,
      transitionMs: 200,
      hapticIntensity: 40,
    },
    pillars: {
      frontier: {
        frameColor: 'rgb(71, 85, 105)',
        frameGlow: 'rgba(71, 85, 105, 0.4)',
        backgroundColor: 'rgb(30, 41, 59)',
        rimLightIntensity: 0.2,
      },
      empire: {
        frameColor: 'rgb(120, 53, 15)', // amber-800
        frameGlow: 'rgba(120, 53, 15, 0.5)',
        backgroundColor: 'rgb(28, 25, 23)', // stone-900
        rimLightIntensity: 0.3,
      },
      wilderness: {
        frameColor: 'rgb(34, 197, 94)', // green-500
        frameGlow: 'rgba(34, 197, 94, 0.4)',
        backgroundColor: 'rgb(20, 83, 45)', // green-900
        rimLightIntensity: 0.25,
      },
    },
  },
  mapHaloFeel: {
    enabled: true,
    visual: {
      haloColor: 'rgb(71, 85, 105)', // slate-600
      haloGlow: 'rgba(71, 85, 105, 0.6)',
      pulseIntensity: 0.4,
      pulseSpeed: 1.5,
      ringWidth: 4,
      ringRadius: 32,
      iconSize: 20,
      shadowBlur: 8,
    },
    interaction: {
      hoverScale: 1.15,
      activeScale: 1.05,
      transitionMs: 180,
      hapticIntensity: 30,
    },
    pillars: {
      frontier: {
        haloColor: 'rgb(71, 85, 105)',
        haloGlow: 'rgba(71, 85, 105, 0.6)',
        pulseIntensity: 0.4,
      },
      empire: {
        haloColor: 'rgb(217, 119, 6)', // amber-600
        haloGlow: 'rgba(217, 119, 6, 0.7)',
        pulseIntensity: 0.5,
      },
      wilderness: {
        haloColor: 'rgb(34, 197, 94)', // green-500
        haloGlow: 'rgba(34, 197, 94, 0.6)',
        pulseIntensity: 0.45,
      },
    },
  },
  haloShader: {
    enabled: true,
    shader: {
      gradientType: 'radial',
      gradientStops: [
        { offset: 0, color: 'rgba(71, 85, 105, 0.8)', opacity: 0.8 },
        { offset: 0.5, color: 'rgba(71, 85, 105, 0.4)', opacity: 0.4 },
        { offset: 1, color: 'rgba(71, 85, 105, 0)', opacity: 0 },
      ],
      blurRadius: 6,
      spreadRadius: 2,
      animationDuration: 2.0,
      animationEasing: 'ease-in-out',
    },
    pillars: {
      frontier: {
        gradientStops: [
          { offset: 0, color: 'rgba(71, 85, 105, 0.8)', opacity: 0.8 },
          { offset: 0.5, color: 'rgba(71, 85, 105, 0.4)', opacity: 0.4 },
          { offset: 1, color: 'rgba(71, 85, 105, 0)', opacity: 0 },
        ],
      },
      empire: {
        gradientStops: [
          { offset: 0, color: 'rgba(217, 119, 6, 0.9)', opacity: 0.9 },
          { offset: 0.5, color: 'rgba(217, 119, 6, 0.5)', opacity: 0.5 },
          { offset: 1, color: 'rgba(217, 119, 6, 0)', opacity: 0 },
        ],
      },
      wilderness: {
        gradientStops: [
          { offset: 0, color: 'rgba(34, 197, 94, 0.85)', opacity: 0.85 },
          { offset: 0.5, color: 'rgba(34, 197, 94, 0.45)', opacity: 0.45 },
          { offset: 1, color: 'rgba(34, 197, 94, 0)', opacity: 0 },
        ],
      },
    },
  },
  pgCardSkin: {
    enabled: true,
    physics: {
      mass: 1.2,
      damping: 0.18,
      stiffness: 160,
    },
    visual: {
      metalGradient: 'linear-gradient(135deg, #1a0c04 0%, #4a2c18 50%, #6b4423 100%)',
      gemGradient: 'linear-gradient(120deg, #fce890 0%, #e4b048 16%, #a05c18 52%, #602c08 76%, #341604 100%)',
      shadowDepth: 16,
      glassTint: 'rgba(255,255,255,0.08)',
      patinaOpacity: 0.4,
      rimLightIntensity: 0.26,
      glowIntensity: 0.32,
    },
    audio: {
      pickupCue: 'medal.pickup',
      dropCue: 'medal.drop',
      rejectCue: 'medal.reject',
      volume: 80,
    },
    pillars: {
      wilderness: {
        metalGradient: 'linear-gradient(135deg, #2a1810 0%, #5a3c28 50%, #7a5438 100%)',
        gemGradient: 'linear-gradient(120deg, #d8ffd8 0%, #72ee82 40%, #1a7830 100%)',
        patinaColor: 'rgba(44,116,66,0.30)',
        rimLightColor: 'rgba(168,200,168,0.26)',
        glowColor: 'rgba(58,215,80,0.40)',
      },
      empire: {
        metalGradient: 'linear-gradient(135deg, #0a0402 0%, #3a1c08 50%, #5a2c18 100%)',
        gemGradient: 'linear-gradient(120deg, #fce890 0%, #e4b048 16%, #a05c18 52%, #602c08 76%, #341604 100%)',
        patinaColor: 'rgba(192,112,40,0.30)',
        rimLightColor: 'rgba(255,238,148,0.26)',
        glowColor: 'rgba(216,144,64,0.32)',
      },
    },
  },
};

/**
 * Demo configuration presets
 */
export const demoPresets = {
  minimal: {
    ...defaultDemoConfig,
    dragDrop: {
      ...defaultDemoConfig.dragDrop,
      glowIntensity: 0.3,
      showTrail: false,
    },
    button: {
      ...defaultDemoConfig.button,
      showRipple: false,
    },
  },
  dynamic: {
    ...defaultDemoConfig,
    dragDrop: {
      ...defaultDemoConfig.dragDrop,
      springStiffness: 400,
      glowIntensity: 0.8,
      showTrail: true,
      holdDuration: 2000,
    },
    button: {
      ...defaultDemoConfig.button,
      squashFactor: 0.8,
      showRipple: true,
    },
    slider: {
      ...defaultDemoConfig.slider,
      moveSpeed: 1.5,
      autoMove: true,
      moveDirection: 'random',
    },
    toggle: {
      ...defaultDemoConfig.toggle,
      autoToggle: true,
      toggleInterval: 2000,
      switchSize: 'large',
    },
    progressRing: {
      ...defaultDemoConfig.progressRing,
      fillSpeed: 1.5,
      autoFill: true,
      strokeWidth: 6,
    },
    toast: {
      ...defaultDemoConfig.toast,
      autoShow: true,
      showInterval: 3000,
      duration: 2000,
      position: 'center',
    },
    hoverCard: {
      ...defaultDemoConfig.hoverCard,
      autoHover: true,
      hoverDelay: 500,
      rotationSpeed: 5,
      content: ['Advanced Card 1', 'Advanced Card 2', 'Advanced Card 3'] as string[],
    },
  },
  accessible: {
    ...defaultDemoConfig,
    animation: {
      ...defaultDemoConfig.animation,
      speed: 0.7,
      reducedMotion: true,
    },
    slider: {
      ...defaultDemoConfig.slider,
      moveSpeed: 0.5,
      autoMove: false,
    },
    toggle: {
      ...defaultDemoConfig.toggle,
      autoToggle: false,
      toggleAnimation: false,
    },
    progressRing: {
      ...defaultDemoConfig.progressRing,
      fillSpeed: 0.5,
      autoFill: false,
    },
    toast: {
      ...defaultDemoConfig.toast,
      autoShow: false,
      showInterval: 8000,
      duration: 5000,
    },
    hoverCard: {
      ...defaultDemoConfig.hoverCard,
      autoHover: false,
      contentRotation: false,
    },
  },
} as const;

export { DemoConfigSchema as schema };
