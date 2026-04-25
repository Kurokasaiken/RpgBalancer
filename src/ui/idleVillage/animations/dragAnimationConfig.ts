import { z } from 'zod';

export const EasingFunctionSchema = z.enum([
  'linear',
  'ease',
  'ease-in',
  'ease-out',
  'ease-in-out',
  'ease-in-quad',
  'ease-out-quad',
  'ease-in-out-quad',
  'ease-in-cubic',
  'ease-out-cubic',
  'ease-in-out-cubic',
  'ease-in-quart',
  'ease-out-quart',
  'ease-in-out-quart',
  'ease-in-back',
  'ease-out-back',
  'ease-in-out-back',
  'spring',
]);

export type EasingFunction = z.infer<typeof EasingFunctionSchema>;

export const TransformConfigSchema = z.object({
  scale: z.number().min(0).max(2).default(1.05),
  rotate: z.number().min(-180).max(180).default(0),
  translateZ: z.number().min(0).max(100).default(10),
  opacity: z.number().min(0).max(1).default(0.9),
});

export type TransformConfig = z.infer<typeof TransformConfigSchema>;

export const AnimationPhaseConfigSchema = z.object({
  duration: z.number().min(0).max(2000).describe('Duration in milliseconds'),
  easing: EasingFunctionSchema,
  transform: TransformConfigSchema,
  delay: z.number().min(0).max(1000).default(0).describe('Delay before animation starts (ms)'),
});

export type AnimationPhaseConfig = z.infer<typeof AnimationPhaseConfigSchema>;

export const DragAnimationConfigSchema = z.object({
  enabled: z.boolean().default(true),
  
  pickup: AnimationPhaseConfigSchema.describe('Animation when item is picked up'),
  
  dragging: AnimationPhaseConfigSchema.describe('Animation while dragging'),
  
  hover: AnimationPhaseConfigSchema.describe('Animation when hovering over valid drop target'),
  
  drop: AnimationPhaseConfigSchema.describe('Animation when item is dropped'),
  
  cancel: AnimationPhaseConfigSchema.describe('Animation when drag is cancelled'),
  
  invalid: AnimationPhaseConfigSchema.describe('Animation when hovering over invalid drop target'),
  
  telemetry: z.object({
    enabled: z.boolean().default(true),
    eventName: z.string().default('iv_drag_animation_played'),
    includePerformance: z.boolean().default(true),
    includeDuration: z.boolean().default(true),
  }).default({}),
  
  performance: z.object({
    useGPUAcceleration: z.boolean().default(true),
    willChange: z.array(z.string()).default(['transform', 'opacity']),
    reducedMotion: z.boolean().default(true).describe('Respect prefers-reduced-motion'),
  }).default({}),
});

export type DragAnimationConfig = z.infer<typeof DragAnimationConfigSchema>;

export const EASING_FUNCTIONS: Record<EasingFunction, string> = {
  'linear': 'linear',
  'ease': 'ease',
  'ease-in': 'ease-in',
  'ease-out': 'ease-out',
  'ease-in-out': 'ease-in-out',
  'ease-in-quad': 'cubic-bezier(0.55, 0.085, 0.68, 0.53)',
  'ease-out-quad': 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
  'ease-in-out-quad': 'cubic-bezier(0.455, 0.03, 0.515, 0.955)',
  'ease-in-cubic': 'cubic-bezier(0.55, 0.055, 0.675, 0.19)',
  'ease-out-cubic': 'cubic-bezier(0.215, 0.61, 0.355, 1)',
  'ease-in-out-cubic': 'cubic-bezier(0.645, 0.045, 0.355, 1)',
  'ease-in-quart': 'cubic-bezier(0.895, 0.03, 0.685, 0.22)',
  'ease-out-quart': 'cubic-bezier(0.165, 0.84, 0.44, 1)',
  'ease-in-out-quart': 'cubic-bezier(0.77, 0, 0.175, 1)',
  'ease-in-back': 'cubic-bezier(0.6, -0.28, 0.735, 0.045)',
  'ease-out-back': 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
  'ease-in-out-back': 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  'spring': 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
};

export const DEFAULT_DRAG_ANIMATION_CONFIG: DragAnimationConfig = {
  enabled: true,
  
  pickup: {
    duration: 150,
    easing: 'ease-out-back',
    delay: 0,
    transform: {
      scale: 1.05,
      rotate: 2,
      translateZ: 10,
      opacity: 0.95,
    },
  },
  
  dragging: {
    duration: 100,
    easing: 'ease-out',
    delay: 0,
    transform: {
      scale: 1.08,
      rotate: 3,
      translateZ: 20,
      opacity: 0.9,
    },
  },
  
  hover: {
    duration: 200,
    easing: 'ease-in-out',
    delay: 0,
    transform: {
      scale: 1.1,
      rotate: 0,
      translateZ: 15,
      opacity: 1,
    },
  },
  
  drop: {
    duration: 250,
    easing: 'ease-out-back',
    delay: 0,
    transform: {
      scale: 1,
      rotate: 0,
      translateZ: 0,
      opacity: 1,
    },
  },
  
  cancel: {
    duration: 300,
    easing: 'ease-in-out-cubic',
    delay: 0,
    transform: {
      scale: 1,
      rotate: 0,
      translateZ: 0,
      opacity: 1,
    },
  },
  
  invalid: {
    duration: 150,
    easing: 'ease-in-out',
    delay: 0,
    transform: {
      scale: 0.95,
      rotate: -2,
      translateZ: 5,
      opacity: 0.6,
    },
  },
  
  telemetry: {
    enabled: true,
    eventName: 'iv_drag_animation_played',
    includePerformance: true,
    includeDuration: true,
  },
  
  performance: {
    useGPUAcceleration: true,
    willChange: ['transform', 'opacity'],
    reducedMotion: true,
  },
};

export function validateDragAnimationConfig(config: unknown): DragAnimationConfig {
  return DragAnimationConfigSchema.parse(config);
}

export function mergeDragAnimationConfig(
  base: DragAnimationConfig,
  override: Partial<DragAnimationConfig>
): DragAnimationConfig {
  return DragAnimationConfigSchema.parse({
    ...base,
    ...override,
    pickup: { ...base.pickup, ...override.pickup },
    dragging: { ...base.dragging, ...override.dragging },
    hover: { ...base.hover, ...override.hover },
    drop: { ...base.drop, ...override.drop },
    cancel: { ...base.cancel, ...override.cancel },
    invalid: { ...base.invalid, ...override.invalid },
    telemetry: { ...base.telemetry, ...override.telemetry },
    performance: { ...base.performance, ...override.performance },
  });
}

export function buildTransformString(transform: TransformConfig): string {
  const parts: string[] = [];
  
  if (transform.scale !== 1) {
    parts.push(`scale(${transform.scale})`);
  }
  
  if (transform.rotate !== 0) {
    parts.push(`rotate(${transform.rotate}deg)`);
  }
  
  if (transform.translateZ !== 0) {
    parts.push(`translateZ(${transform.translateZ}px)`);
  }
  
  return parts.join(' ') || 'none';
}

export function buildTransitionString(phase: AnimationPhaseConfig): string {
  const easingCss = EASING_FUNCTIONS[phase.easing] || 'ease';
  const duration = `${phase.duration}ms`;
  
  return `transform ${duration} ${easingCss}, opacity ${duration} ${easingCss}`;
}
