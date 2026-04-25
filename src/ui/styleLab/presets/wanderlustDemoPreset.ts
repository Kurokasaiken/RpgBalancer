/**
 * Wanderlust preset for the Style Lab demo components.
 *
 * Provides heavier physics and warm narrative timings aligned with
 * the Wanderlust art direction (nero caldo, bronzo araldico).
 */
import type { DemoConfig } from '../config/demoConfig';

/**
 * Partial demo configuration overrides for Wanderlust.
 */
export const wanderlustPreset: Partial<DemoConfig> = {
  layout: {
    splitRatio: 0.68,
    controlWidth: 300,
    showGrid: false,
  },
  dragDrop: {
    springStiffness: 160,
    springDamping: 18,
    glowIntensity: 0.55,
    loopTiming: 3000,
    holdDuration: 1800,
    autoLoop: true,
    showTrail: false,
  },
  button: {
    squashFactor: 0.92,
    holdDuration: 1600,
    clickTiming: 3200,
    autoLoop: true,
    showRipple: true,
  },
  slider: {
    minValue: 0,
    maxValue: 100,
    currentValue: 42,
    autoMove: true,
    moveSpeed: 0.65,
    moveDirection: 'forward',
    showValue: true,
    stepSize: 1,
    trackHeight: 4,
  },
  toggle: {
    isOn: false,
    autoToggle: true,
    toggleInterval: 4000,
    showLabel: true,
    toggleAnimation: true,
    switchSize: 'medium',
  },
  progressRing: {
    percentage: 0,
    autoFill: true,
    fillSpeed: 0.65,
    strokeWidth: 2.5,
    ringSize: 96,
    showPercentage: true,
    clockwise: true,
  },
  textField: {
    placeholder: 'Cerca nel Roster...',
    value: '',
    autoFocus: true,
    focusInterval: 4500,
    showClearButton: true,
    maxLength: 50,
    fieldType: 'text',
  },
  toast: {
    message: 'Giggiolillo assegnato alla Pattuglia Nord',
    isVisible: false,
    autoShow: true,
    showInterval: 9000,
    duration: 3500,
    position: 'top-right',
    type: 'info',
    showIcon: true,
  },
  hoverCard: {
    isHovered: false,
    autoHover: true,
    hoverDelay: 1400,
    contentRotation: true,
    rotationSpeed: 1.6,
    cardWidth: 280,
    cardHeight: 180,
    showShadow: true,
    content: ['Guerriero — Lv 7', 'HP 150 / STA 100%', 'Disponibile per missioni'],
  },
  animation: {
    enabled: true,
    speed: 0.9,
    reducedMotion: false,
  },
  pgCardSkin: {
    enabled: true,
    physics: {
      mass: 1.3,
      damping: 0.16,
      stiffness: 140,
    },
    visual: {
      metalGradient: 'linear-gradient(135deg, #1a0c04 0%, #4a2c18 50%, #6b4423 100%)',
      gemGradient: 'linear-gradient(120deg, #fce890 0%, #e4b048 16%, #a05c18 52%, #602c08 76%, #341604 100%)',
      shadowDepth: 18,
      glassTint: 'rgba(255,255,255,0.08)',
      patinaOpacity: 0.45,
      rimLightIntensity: 0.28,
      glowIntensity: 0.35,
    },
    audio: {
      pickupCue: 'medal.pickup',
      dropCue: 'medal.drop',
      rejectCue: 'medal.reject',
      volume: 85,
    },
    pillars: {
      wilderness: {
        metalGradient: 'linear-gradient(135deg, #2a1810 0%, #5a3c28 50%, #7a5438 100%)',
        gemGradient: 'linear-gradient(120deg, #d8ffd8 0%, #72ee82 40%, #1a7830 100%)',
        patinaColor: 'rgba(44,116,66,0.35)',
        rimLightColor: 'rgba(168,200,168,0.30)',
        glowColor: 'rgba(58,215,80,0.45)',
      },
      empire: {
        metalGradient: 'linear-gradient(135deg, #0a0402 0%, #3a1c08 50%, #5a2c18 100%)',
        gemGradient: 'linear-gradient(120deg, #fce890 0%, #e4b048 16%, #a05c18 52%, #602c08 76%, #341604 100%)',
        patinaColor: 'rgba(192,112,40,0.35)',
        rimLightColor: 'rgba(255,238,148,0.30)',
        glowColor: 'rgba(216,144,64,0.38)',
      },
    },
  },
};

/**
 * Applies the Wanderlust preset on top of the base demo config.
 */
export const applyWanderlustPreset = (baseConfig: DemoConfig): DemoConfig => {
  return {
    ...baseConfig,
    ...wanderlustPreset,
    layout: { ...baseConfig.layout, ...wanderlustPreset.layout },
    dragDrop: { ...baseConfig.dragDrop, ...wanderlustPreset.dragDrop },
    button: { ...baseConfig.button, ...wanderlustPreset.button },
    slider: { ...baseConfig.slider, ...wanderlustPreset.slider },
    toggle: { ...baseConfig.toggle, ...wanderlustPreset.toggle },
    progressRing: { ...baseConfig.progressRing, ...wanderlustPreset.progressRing },
    textField: { ...baseConfig.textField, ...wanderlustPreset.textField },
    toast: { ...baseConfig.toast, ...wanderlustPreset.toast },
    hoverCard: { ...baseConfig.hoverCard, ...wanderlustPreset.hoverCard },
    animation: { ...baseConfig.animation, ...wanderlustPreset.animation },
    pgCardSkin: { ...baseConfig.pgCardSkin, ...wanderlustPreset.pgCardSkin },
  };
};
