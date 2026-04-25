/**
 * Minimal Frontier Preset for Style Lab Demo
 * 
 * Clean, balanced feel with optimized parameters for all demo components.
 * Baseline Wanderlust aesthetic with subtle animations and clear visual hierarchy.
 */

import type { DemoConfig } from '../config/demoConfig';

/**
 * Minimal Frontier preset configuration
 * Optimized for clean, responsive demo experience
 */
export const minimalFrontierPreset: Partial<DemoConfig> = {
  // Layout: Balanced split with clean proportions
  layout: {
    splitRatio: 0.65, // Slightly more space for components
    controlWidth: 320,
    showGrid: false,
  },
  
  // Drag & Drop: Smooth, predictable physics
  dragDrop: {
    springStiffness: 180,
    springDamping: 22,
    glowIntensity: 0.4, // Subtle glow
    loopTiming: 2500, // Moderate pace
    holdDuration: 1500,
    autoLoop: true,
    showTrail: false, // Clean without trails
  },
  
  // Button: Responsive but not overly animated
  button: {
    squashFactor: 0.94, // Subtle squash
    holdDuration: 1500,
    clickTiming: 3000,
    autoLoop: true,
    showRipple: true, // Clean ripple effect
  },
  
  // Slider: Smooth, predictable movement
  slider: {
    minValue: 0,
    maxValue: 100,
    currentValue: 35, // Start at interesting position
    autoMove: true,
    moveSpeed: 0.8, // Relaxed pace
    moveDirection: 'forward',
    showValue: true,
    stepSize: 1,
    trackHeight: 6, // Clean, visible track
  },
  
  // Toggle: Clear, deliberate switching
  toggle: {
    isOn: false,
    autoToggle: true,
    toggleInterval: 3500, // Comfortable viewing pace
    showLabel: true,
    toggleAnimation: true,
    switchSize: 'medium',
  },
  
  // Progress Ring: Smooth fill animation
  progressRing: {
    percentage: 0,
    autoFill: true,
    fillSpeed: 0.9, // Gentle fill speed
    strokeWidth: 3,
    ringSize: 100, // Clear, readable size
    showPercentage: true,
    clockwise: true,
  },
  
  // Text Field: Natural focus behavior
  textField: {
    placeholder: 'Enter minimal text...',
    value: '',
    autoFocus: true,
    focusInterval: 4000, // Natural timing
    showClearButton: true,
    maxLength: 50,
    fieldType: 'text',
  },
  
  // Toast: Subtle, informative notifications
  toast: {
    message: 'Minimal notification',
    isVisible: false,
    autoShow: true,
    showInterval: 8000, // Not too frequent
    duration: 3000, // Brief but readable
    position: 'top-right',
    type: 'info',
    showIcon: true,
  },
  
  // Hover Card: Elegant reveal animation
  hoverCard: {
    isHovered: false,
    autoHover: true,
    hoverDelay: 1200, // Deliberate timing
    contentRotation: true,
    rotationSpeed: 2, // Gentle rotation
    cardWidth: 280,
    cardHeight: 180,
    showShadow: true,
    content: ['Minimal Content 1', 'Minimal Content 2', 'Minimal Content 3'],
  },
  
  // Animation: Balanced performance
  animation: {
    enabled: true,
    speed: 1.0, // Natural speed
    reducedMotion: false,
  },
};

/**
 * Apply Minimal Frontier preset to base config
 */
export const applyMinimalFrontierPreset = (baseConfig: DemoConfig): DemoConfig => {
  return {
    ...baseConfig,
    ...minimalFrontierPreset,
    // Deep merge for nested objects
    layout: { ...baseConfig.layout, ...minimalFrontierPreset.layout },
    dragDrop: { ...baseConfig.dragDrop, ...minimalFrontierPreset.dragDrop },
    button: { ...baseConfig.button, ...minimalFrontierPreset.button },
    slider: { ...baseConfig.slider, ...minimalFrontierPreset.slider },
    toggle: { ...baseConfig.toggle, ...minimalFrontierPreset.toggle },
    progressRing: { ...baseConfig.progressRing, ...minimalFrontierPreset.progressRing },
    textField: { ...baseConfig.textField, ...minimalFrontierPreset.textField },
    toast: { ...baseConfig.toast, ...minimalFrontierPreset.toast },
    hoverCard: { ...baseConfig.hoverCard, ...minimalFrontierPreset.hoverCard },
    animation: { ...baseConfig.animation, ...minimalFrontierPreset.animation },
  };
};
