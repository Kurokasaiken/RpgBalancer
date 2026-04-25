# Game Feel & Juice Design Guide

## Overview
This document defines the "game feel" and "juice" principles for the RPG Balancer project. It serves as the authoritative guide for implementing responsive, satisfying interactions that make the UI feel alive and responsive to user actions.

## Core Philosophy

### What is Game Feel?
Game feel is the tactile, sensory experience of interacting with a system. It encompasses:
- **Visual feedback** - animations, particles, color changes
- **Audio feedback** - sounds, tones, musical cues
- **Haptic feedback** - vibrations, force feedback
- **Timing** - response delays, animation durations
- **Weight** - perceived mass and momentum
- **Impact** - sense of consequence and satisfaction

### Design Principles

#### 1. Immediate Response (0-100ms)
- Every interaction must provide immediate visual feedback
- No action should feel "laggy" or unresponsive
- Use micro-animations for button presses, hovers, and state changes

#### 2. Satisfying Impact (100-300ms)
- Successful actions should feel impactful and rewarding
- Use spring physics, overshoot, and bounce effects
- Combine visual + audio + haptic feedback for maximum satisfaction

#### 3. Clear Communication (300-1000ms)
- State changes should be clearly communicated
- Use color, motion, and sound to indicate success/failure/warning
- Progressive disclosure for complex operations

#### 4. Physical Realism
- Objects should have perceived weight and momentum
- Animations should follow natural physics (gravity, friction, elasticity)
- Use easing functions that mimic real-world movement

## Implementation Guidelines

### Visual Feedback Patterns

#### Button Interactions
```typescript
// Success pattern
const buttonSuccess = {
  scale: [1, 0.95, 1.05, 1], // Squash, then stretch
  duration: 300,
  easing: "cubic-bezier(0.68, -0.55, 0.265, 1.55)", // Overshoot spring
  glow: "0 0 20px rgba(34, 197, 94, 0.6)", // Green glow
  particles: true, // Burst particles on success
};

// Failure pattern
const buttonFailure = {
  shake: { x: [-5, 5, -5, 5, -3, 3, 0] }, // Shake animation
  duration: 400,
  color: "#ef4444", // Red flash
  vibration: "light", // Haptic feedback
};
```

#### ActionCard Interactions
```typescript
// ActionCard hover (Wilderness)
const actionCardHoverWilderness = {
  scale: 1.02,
  shadow: "0 4px 20px rgba(44, 116, 66, 0.3)", // Green glow
  borderColor: "rgba(44, 116, 66, 0.6)",
  duration: 200,
  easing: "ease-out",
  sound: "whoosh-light.mp3",
  haptic: "light",
};

// ActionCard hover (Empire)
const actionCardHoverEmpire = {
  scale: 1.02,
  shadow: "0 4px 20px rgba(205, 127, 50, 0.3)", // Gold glow
  borderColor: "rgba(205, 127, 50, 0.6)",
  duration: 200,
  easing: "ease-out",
  sound: "whoosh-warm.mp3",
  haptic: "light",
};

// ActionCard collect CTA (Wilderness)
const actionCardCollectWilderness = {
  scale: [1, 0.95, 1.05, 1], // Squash-stretch
  glow: "0 0 30px rgba(44, 116, 66, 0.8)",
  particles: "leaves-green",
  sound: "chime-harmonic.mp3",
  haptic: "medium",
  duration: 300,
};

// ActionCard collect CTA (Empire)
const actionCardCollectEmpire = {
  scale: [1, 0.95, 1.05, 1], // Squash-stretch
  glow: "0 0 30px rgba(205, 127, 50, 0.8)",
  particles: "sparks-gold",
  sound: "bell-bronze.mp3",
  haptic: "medium",
  duration: 300,
};
```

#### ActionHalo Interactions
```typescript
// ActionHalo pulse (Wilderness)
const actionHaloPulseWilderness = {
  pulse: {
    scale: [1, 1.1, 1],
    opacity: [0.6, 0.9, 0.6],
  },
  glow: "0 0 25px rgba(44, 116, 66, 0.6)",
  sound: "pulse-gentle.mp3",
  duration: 2500, // 2.5s cycle
  easing: "ease-in-out",
};

// ActionHalo pulse (Empire)
const actionHaloPulseEmpire = {
  pulse: {
    scale: [1, 1.15, 1],
    opacity: [0.7, 1.0, 0.7],
  },
  glow: "0 0 35px rgba(205, 127, 50, 0.8)",
  sound: "pulse-strong.mp3",
  duration: 2000, // 2s cycle
  easing: "ease-in-out",
};

// ActionHalo click (Wilderness)
const actionHaloClickWilderness = {
  ripple: true,
  glow: "0 0 40px rgba(44, 116, 66, 1.0)",
  sound: "chime-harmonic.mp3",
  haptic: "medium",
  duration: 400,
};

// ActionHalo click (Empire)
const actionHaloClickEmpire = {
  ripple: true,
  glow: "0 0 40px rgba(205, 127, 50, 1.0)",
  sound: "bell-bronze.mp3",
  haptic: "medium",
  duration: 400,
};
```

#### Drag & Drop Interactions
```typescript
// Drag start
const dragStart = {
  scale: 1.1,
  shadow: "0 10px 30px rgba(0, 0, 0, 0.3)",
  opacity: 0.8,
  cursor: "grabbing",
  haptic: "medium",
};

// Valid drop
const validDrop = {
  snap: true, // Snap to position
  bounce: 0.2, // Bounce effect
  glow: "0 0 30px rgba(34, 197, 94, 0.8)",
  sound: "success.mp3",
  particles: "confetti",
};

// Invalid drop
const invalidDrop = {
  return: true, // Return to start
  shake: true,
  glow: "0 0 30px rgba(255, 255, 255, 0.3)",
  sound: "error.mp3",
  vibration: "heavy",
};
```

### Audio Feedback System

#### Sound Categories
- **Success**: Pleasant, ascending tones (chimes, bells)
- **Failure**: Descending, muted tones (thuds, buzzes)
- **Warning**: Urgent but not alarming (pulses, beeps)
- **Interaction**: Subtle clicks and whooshes
- **Ambient**: Background sounds that reinforce the theme

#### Audio Implementation
```typescript
interface AudioConfig {
  success: {
    sound: "chime-soft.mp3",
    volume: 0.6,
    pitch: "ascending",
    reverb: "small-room",
  };
  failure: {
    sound: "thud-muted.mp3",
    volume: 0.4,
    pitch: "descending",
    reverb: "none",
  };
  warning: {
    sound: "pulse-gentle.mp3",
    volume: 0.5,
    pitch: "steady",
    reverb: "small-room",
  };
}
```

### Haptic Feedback Patterns

#### Vibration Intensities
- **Light**: Button presses, hover states
- **Medium**: Successful actions, confirmations
- **Heavy**: Errors, warnings, important events
- **Pattern**: Custom sequences for complex feedback

#### Implementation
```typescript
interface HapticConfig {
  buttonPress: "light";
  success: "medium";
  failure: "heavy";
  warning: "pattern-double";
  dragStart: "light";
  validDrop: "medium";
  invalidDrop: "heavy";
}
```

## Style Laboratory Integration

### Game Feel Controls
The Style Laboratory should expose game feel parameters as adjustable controls:

#### Animation Controls
- **Spring Stiffness**: 100-500 (soft to rigid)
- **Damping Ratio**: 0.1-1.0 (bouncy to smooth)
- **Duration Multiplier**: 0.5x-2.0x (speed control)
- **Overshoot Amount**: 0-50% (impact intensity)

#### Visual Effects
- **Glow Intensity**: 0-100% (feedback brightness)
- **Particle Count**: 0-50 (visual feedback density)
- **Shadow Blur**: 0-30px (depth perception)
- **Border Glow**: 0-20px (edge emphasis)

#### ActionCard Specific Controls
- **Hover Scale**: 1.0-1.05 (subtle growth on hover)
- **Click Squash**: 0.9-1.0 (press feedback)
- **Collect Overshoot**: 0-30% (CTA satisfaction)
- **Border Pulse Speed**: 1-5s (attention drawing)

#### ActionHalo Specific Controls
- **Pulse Scale Range**: 1.0-1.2 (breathing effect)
- **Pulse Speed**: 1-5s (attention cycle)
- **Glow Bloom**: 0-50px (POI emphasis)
- **Ripple Duration**: 200-800ms (click feedback)

#### Audio Settings
- **Master Volume**: 0-100%
- **Effect Volume**: 0-100%
- **Pitch Variation**: 0-50% (natural variation)
- **Reverb Amount**: 0-100% (space perception)

#### Haptic Settings
- **Vibration Intensity**: 0-100%
- **Pattern Complexity**: simple/complex
- **Response Delay**: 0-200ms (tactile timing)

## Component-Specific Guidelines

### Buttons
- **Press**: Immediate scale down (0.95) + haptic light
- **Release**: Scale up with overshoot (1.05 → 1.0) + sound
- **Success**: Green glow + particles + medium haptic
- **Failure**: Red flash + shake + heavy haptic

### Sliders
- **Drag**: Scale up handle + shadow + continuous haptic
- **Snap**: Spring to position + click sound
- **Boundary**: Resistance vibration + visual warning

### Cards/Items
- **Pickup**: Scale up + lift shadow + pickup sound
- **Drag**: Smooth follow + glow + trail effect
- **Drop**: Impact effect + success/failure feedback
- **Return**: Smooth return + negative feedback

### Notifications
- **Appear**: Slide in with bounce + attention sound
- **Success**: Green theme + positive sound
- **Warning**: Yellow theme + urgent sound
- **Error**: Red theme + alarm sound + vibration

### Idle Village – Roster Drag Example
- **Deterministic drag start tick**: use `statWeights.drag` config for lift amount, never inline values.
- **Valid drop feedback**: Style Lab preset `Emerald Frontier` → glow intensity 65%, vibration medium.
- **Invalid drop**: auto-trigger `ValidationFailureDetails` copy (no hardcode) + heavy haptic.

### Testing Hooks
- Use `tests/unit/testRosterPage/TestRosterPage.integration.test.tsx` to assert drag/drops play `gameFeel` events.
- Add `gameFeelChecklist` stories under Style Lab to verify reduced motion fallback.

## Performance Considerations

### Optimization Rules
1. **60fps Target**: All animations must maintain 60fps
2. **GPU Acceleration**: Use transform and opacity properties
3. **Throttle Events**: Limit rapid interactions (mouse moves, scrolls)
4. **Pool Objects**: Reuse particles and effects
5. **Lazy Load**: Load audio/haptic resources on demand

### Fallback Patterns
- **Reduced Motion**: Respect user preferences
- **Low-End Devices**: Simplify effects automatically
- **Accessibility**: Provide alternatives for motion/sound sensitivities

## Testing & Validation

### Game Feel Checklist
- [ ] Every interaction has immediate feedback (<100ms)
- [ ] Success actions feel satisfying and rewarding
- [ ] Failure actions are clear but not punishing
- [ ] Animations follow natural physics
- [ ] Audio cues match visual feedback
- [ ] Haptic feedback enhances but doesn't distract
- [ ] Performance remains smooth under load
- [ ] Accessibility options are functional

### User Testing Metrics
- **Response Time**: How fast users feel the system responds
- **Satisfaction Rating**: How rewarding interactions feel
- **Error Recovery**: How well users understand and recover from mistakes
- **Learnability**: How quickly users understand the feedback system

## Implementation Examples

### Complete Button Component
```typescript
interface GameFeelButtonProps {
  onClick: () => void;
  variant: 'primary' | 'secondary' | 'danger';
  size: 'small' | 'medium' | 'large';
  gameFeel?: GameFeelConfig;
}

const GameFeelButton: React.FC<GameFeelButtonProps> = ({
  onClick,
  variant,
  size,
  gameFeel = defaultGameFeel,
}) => {
  const [state, setState] = useState<'idle' | 'pressing' | 'success' | 'error'>('idle');
  
  const handleClick = () => {
    setState('pressing');
    
    // Immediate feedback
    playSound('button-press');
    triggerHaptic('light');
    
    // Execute action
    try {
      onClick();
      setState('success');
      playSound('success');
      triggerHaptic('medium');
      showParticles('success');
    } catch (error) {
      setState('error');
      playSound('error');
      triggerHaptic('heavy');
      shakeElement();
    }
    
    // Reset after animation
    setTimeout(() => setState('idle'), 300);
  };
  
  return (
    <motion.button
      onClick={handleClick}
      className={buttonStyles(variant, size)}
      variants={buttonVariants}
      animate={state}
      transition={gameFeel.animation}
    >
      {children}
    </motion.button>
  );
};
```

## Conclusion

Game feel is not optional—it's essential for creating satisfying, professional user experiences. By following these guidelines and leveraging the Style Laboratory's configuration system, we can create UI that feels alive, responsive, and delightful to use.

Remember: **Every pixel, every millisecond, every sound matters.**
