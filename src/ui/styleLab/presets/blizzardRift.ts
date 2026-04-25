/**
 * Blizzard Rift Preset for Style Lab Demo
 * 
 * Ultra-responsive, light feel with fast animations and icy effects.
 * High-lift experiment for Blizzard ritual references with snappy interactions.
 */

import type { DemoConfig } from '../config/demoConfig';

/**
 * Blizzard Rift preset configuration
 * Optimized for fast, responsive demo experience
 */
export const blizzardRiftPreset: Partial<DemoConfig> = {
  // Layout: Balanced with emphasis on component visibility
  layout: {
    splitRatio: 0.6, // Standard split
    controlWidth: 350, // Wider controls for quick access
    showGrid: false,
  },
  
  // Drag & Drop: Fast, responsive physics
  dragDrop: {
    springStiffness: 120, // Very responsive
    springDamping: 14, // Light damping
    glowIntensity: 0.52, // Subtle glow
    loopTiming: 1500, // Fast loop
    holdDuration: 1000, // Quick hold
    autoLoop: true,
    showTrail: true, // Visible trails for speed
  },
  
  // Button: Highly responsive with minimal squash
  button: {
    squashFactor: 0.97, // Minimal squash
    holdDuration: 1000, // Quick hold
    clickTiming: 2000, // Fast clicking
    autoLoop: true,
    showRipple: true,
  },
  
  // Slider: Fast, energetic movement
  slider: {
    minValue: 0,
    maxValue: 100,
    currentValue: 25, // Start lower
    autoMove: true,
    moveSpeed: 1.8, // Fast movement
    moveDirection: 'random', // More dynamic
    showValue: true,
    stepSize: 1,
    trackHeight: 4, // Thin track for speed feel
  },
  
  // Toggle: Fast switching
  toggle: {
    isOn: false,
    autoToggle: true,
    toggleInterval: 2000, // Fast switching
    showLabel: true,
    toggleAnimation: true,
    switchSize: 'small', // Compact switches
  },
  
  // Progress Ring: Fast fill animation
  progressRing: {
    percentage: 0,
    autoFill: true,
    fillSpeed: 1.8, // Fast fill
    strokeWidth: 2, // Thin stroke
    ringSize: 80, // Compact size
    showPercentage: true,
    clockwise: true,
  },
  
  // Text Field: Fast focus behavior
  textField: {
    placeholder: 'Enter blizzard text...',
    value: '',
    autoFocus: true,
    focusInterval: 2500, // Fast timing
    showClearButton: true,
    maxLength: 40, // Shorter for speed
    fieldType: 'text',
  },
  
  // Toast: Quick, light notifications
  toast: {
    message: 'Blizzard notification',
    isVisible: false,
    autoShow: true,
    showInterval: 5000, // More frequent
    duration: 2000, // Quick display
    position: 'top-left', // Less intrusive
    type: 'info', // Light tone
    showIcon: true,
  },
  
  // Hover Card: Fast, snappy reveal
  hoverCard: {
    isHovered: false,
    autoHover: true,
    hoverDelay: 800, // Fast reveal
    contentRotation: true,
    rotationSpeed: 4, // Fast rotation
    cardWidth: 260, // Compact cards
    cardHeight: 160,
    showShadow: true,
    content: ['Blizzard Content 1', 'Blizzard Content 2', 'Blizzard Content 3'],
  },
  
  // Animation: Fast and responsive
  animation: {
    enabled: true,
    speed: 1.3, // Faster animations
    reducedMotion: false,
  },
};

/**
 * Apply Blizzard Rift preset to base config
 */
export const applyBlizzardRiftPreset = (baseConfig: DemoConfig): DemoConfig => {
  return {
    ...baseConfig,
    ...blizzardRiftPreset,
    // Deep merge for nested objects
    layout: { ...baseConfig.layout, ...blizzardRiftPreset.layout },
    dragDrop: { ...baseConfig.dragDrop, ...blizzardRiftPreset.dragDrop },
    button: { ...baseConfig.button, ...blizzardRiftPreset.button },
    slider: { ...baseConfig.slider, ...blizzardRiftPreset.slider },
    toggle: { ...baseConfig.toggle, ...blizzardRiftPreset.toggle },
    progressRing: { ...baseConfig.progressRing, ...blizzardRiftPreset.progressRing },
    textField: { ...baseConfig.textField, ...blizzardRiftPreset.textField },
    toast: { ...baseConfig.toast, ...blizzardRiftPreset.toast },
    hoverCard: { ...baseConfig.hoverCard, ...blizzardRiftPreset.hoverCard },
    animation: { ...baseConfig.animation, ...blizzardRiftPreset.animation },
  };
};
