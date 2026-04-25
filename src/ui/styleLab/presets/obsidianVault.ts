/**
 * Obsidian Vault Preset for Style Lab Demo
 * 
 * Heavy, dense feel with deep visual effects and deliberate timing.
 * Inspired by Obsidian preset typography with rich, tactile interactions.
 */

import type { DemoConfig } from '../config/demoConfig';

/**
 * Obsidian Vault preset configuration
 * Optimized for dense, impactful demo experience
 */
export const obsidianVaultPreset: Partial<DemoConfig> = {
  // Layout: More space for components, narrower controls
  layout: {
    splitRatio: 0.7, // More component space
    controlWidth: 280, // Compact controls
    showGrid: false,
  },
  
  // Drag & Drop: Heavy physics with pronounced effects
  dragDrop: {
    springStiffness: 260, // Stiffer springs
    springDamping: 36, // More resistance
    glowIntensity: 0.78, // Strong glow
    loopTiming: 3500, // Slower, deliberate pace
    holdDuration: 2000,
    autoLoop: true,
    showTrail: true, // Visible trails
  },
  
  // Button: Subtle squash with heavier feel
  button: {
    squashFactor: 0.9, // Less squash
    holdDuration: 2000,
    clickTiming: 4000, // Slower timing
    autoLoop: true,
    showRipple: true,
  },
  
  // Slider: Slow, deliberate movement
  slider: {
    minValue: 0,
    maxValue: 100,
    currentValue: 65, // Start higher
    autoMove: true,
    moveSpeed: 0.5, // Slow pace
    moveDirection: 'forward',
    showValue: true,
    stepSize: 2, // Larger steps
    trackHeight: 8, // Thicker track
  },
  
  // Toggle: Slow, deliberate switching
  toggle: {
    isOn: true, // Start active
    autoToggle: true,
    toggleInterval: 5000, // Slow switching
    showLabel: true,
    toggleAnimation: true,
    switchSize: 'large', // Bigger switches
  },
  
  // Progress Ring: Slow, heavy fill
  progressRing: {
    percentage: 0,
    autoFill: true,
    fillSpeed: 0.6, // Slow fill
    strokeWidth: 6, // Thicker stroke
    ringSize: 120, // Larger ring
    showPercentage: true,
    clockwise: true,
  },
  
  // Text Field: Slower focus behavior
  textField: {
    placeholder: 'Enter obsidian text...',
    value: '',
    autoFocus: true,
    focusInterval: 6000, // Slower timing
    showClearButton: true,
    maxLength: 75, // More characters
    fieldType: 'text',
  },
  
  // Toast: Prominent, longer-lasting notifications
  toast: {
    message: 'Obsidian notification',
    isVisible: false,
    autoShow: true,
    showInterval: 12000, // Less frequent
    duration: 5000, // Longer display
    position: 'center', // Prominent position
    type: 'warning', // More serious tone
    showIcon: true,
  },
  
  // Hover Card: Slow, dramatic reveal
  hoverCard: {
    isHovered: false,
    autoHover: true,
    hoverDelay: 2000, // Slower reveal
    contentRotation: true,
    rotationSpeed: 1, // Very slow rotation
    cardWidth: 320, // Larger cards
    cardHeight: 220,
    showShadow: true,
    content: ['Obsidian Content 1', 'Obsidian Content 2', 'Obsidian Content 3'],
  },
  
  // Animation: Slower, more deliberate
  animation: {
    enabled: true,
    speed: 0.7, // Slower animations
    reducedMotion: false,
  },
};

/**
 * Apply Obsidian Vault preset to base config
 */
export const applyObsidianVaultPreset = (baseConfig: DemoConfig): DemoConfig => {
  return {
    ...baseConfig,
    ...obsidianVaultPreset,
    // Deep merge for nested objects
    layout: { ...baseConfig.layout, ...obsidianVaultPreset.layout },
    dragDrop: { ...baseConfig.dragDrop, ...obsidianVaultPreset.dragDrop },
    button: { ...baseConfig.button, ...obsidianVaultPreset.button },
    slider: { ...baseConfig.slider, ...obsidianVaultPreset.slider },
    toggle: { ...baseConfig.toggle, ...obsidianVaultPreset.toggle },
    progressRing: { ...baseConfig.progressRing, ...obsidianVaultPreset.progressRing },
    textField: { ...baseConfig.textField, ...obsidianVaultPreset.textField },
    toast: { ...baseConfig.toast, ...obsidianVaultPreset.toast },
    hoverCard: { ...baseConfig.hoverCard, ...obsidianVaultPreset.hoverCard },
    animation: { ...baseConfig.animation, ...obsidianVaultPreset.animation },
  };
};
