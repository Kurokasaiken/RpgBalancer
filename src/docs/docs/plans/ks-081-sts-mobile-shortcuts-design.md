# KS-081-sts-mobile-shortcuts: Mobile Gesture & Shortcut Layer Design

## Overview

Design and implement a comprehensive mobile gesture and shortcut layer for the STS simulator that provides touch-optimized interactions, gesture recognition, and context-aware shortcuts while maintaining compatibility with existing keybinding infrastructure.

## Current Infrastructure Analysis

### Existing Components

#### 1. Mobile Gestures Hook (`useMobileGestures.ts`)
- **Touch Gesture Support**: swipe-left/right, pinch-in/out, double-tap, long-press
- **Mobile Shortcuts**: navigate-next/prev, zoom-in/out, reset-zoom, toggle-realtime
- **Keyboard Support**: Arrow keys, +/- for zoom, space for toggle, 1-3 for navigation
- **Touch Event Handling**: Proper touch start/move/end with gesture detection
- **Configuration**: Customizable thresholds for swipe, pinch, long-press, double-tap

#### 2. STS Keypad (`STSKeypad.tsx`)
- **Mobile-Optimized**: Touch-friendly button layout with proper spacing
- **Command Integration**: STS-specific commands (Play, End, Reset, Help, Status)
- **Haptic Feedback**: Simulated vibration patterns for different button types
- **Auto-Detection**: Shows automatically on mobile devices
- **Accessibility**: Full ARIA support and keyboard navigation

#### 3. Keybinding System (`keybinding/`)
- **useSTSKeybindingManager**: Central keyboard shortcut management
- **useSTSKeybindingPresets**: Preset management with import/export
- **Type Definitions**: Comprehensive type system for keybindings
- **Conflict Detection**: Automatic keybinding conflict resolution
- **Context Awareness**: Different shortcuts for different contexts

#### 4. Command Input (`STSCommandInput.tsx`)
- **Mobile Detection**: Automatic mobile device detection
- **Keypad Integration**: Auto-shows mobile keypad on focus
- **Command Parsing**: Config-first command binding system
- **History Navigation**: Command history with keyboard navigation

## Design Requirements

### 1. Gesture Recognition Enhancement

#### Advanced Gesture Types
```typescript
export type AdvancedTouchGesture =
  | 'swipe-left'      // Navigate to previous section
  | 'swipe-right'     // Navigate to next section  
  | 'swipe-up'        // Show command palette
  | 'swipe-down'      // Show context menu
  | 'pinch-in'        // Zoom out/reset zoom
  | 'pinch-out'       // Zoom in on data
  | 'double-tap'      // Reset view or show overview
  | 'long-press'      // Show context menu
  | 'two-finger-tap'  // Toggle fullscreen
  | 'three-finger-swipe' // Quick action shortcuts
  | 'circular-gesture'; // Rotate through modes
```

#### Gesture Configuration
```typescript
interface AdvancedGestureConfig {
  // Basic thresholds
  swipeThreshold: number;
  swipeTimeThreshold: number;
  pinchThreshold: number;
  longPressThreshold: number;
  doubleTapThreshold: number;
  
  // Advanced configuration
  multiFingerThreshold: number;
  circularGestureMinAngle: number;
  gestureSensitivity: number;
  enableGestureHints: boolean;
  hapticFeedbackPatterns: Record<string, HapticPattern>;
}
```

### 2. Context-Aware Mobile Shortcuts

#### STS-Specific Actions
```typescript
export type STSMobileShortcutAction =
  // Navigation
  | 'navigate-prev' | 'navigate-next'
  | 'goto-combat' | 'goto-hand' | 'goto-log'
  | 'goto-config' | 'goto-presets'
  
  // Combat Actions
  | 'play-card-1' | 'play-card-2' | 'play-card-3'
  | 'play-card-4' | 'play-card-5' | 'end-turn'
  | 'quick-defend' | 'quick-attack'
  
  // Simulation Control
  | 'start-sim' | 'pause-sim' | 'reset-sim'
  | 'step-forward' | 'step-backward'
  | 'toggle-realtime' | 'change-speed'
  
  // UI Control
  | 'toggle-theme' | 'toggle-help'
  | 'show-keyboard' | 'show-gestures'
  | 'export-data' | 'import-preset'
  
  // Zoom & View
  | 'zoom-in' | 'zoom-out' | 'reset-zoom'
  | 'fit-to-screen' | 'toggle-fullscreen';
```

#### Context Mapping
```typescript
interface STSMobileContext {
  currentView: 'combat' | 'terminal' | 'config' | 'presets';
  gameState: 'idle' | 'playing' | 'paused' | 'finished';
  selectedCard: number | null;
  availableActions: STSMobileShortcutAction[];
  gestureHints: Record<TouchGesture, string>;
}
```

### 3. Haptic Feedback System

#### Feedback Patterns
```typescript
interface HapticPattern {
  pattern: number[];
  intensity: 'light' | 'medium' | 'heavy';
  duration: number;
}

const HAPTIC_PATTERNS: Record<string, HapticPattern> = {
  'gesture-start': { pattern: [10], intensity: 'light', duration: 50 },
  'gesture-complete': { pattern: [10, 50, 10], intensity: 'medium', duration: 100 },
  'action-success': { pattern: [25, 25, 25], intensity: 'medium', duration: 75 },
  'action-error': { pattern: [100, 50, 100], intensity: 'heavy', duration: 200 },
  'navigation': { pattern: [15], intensity: 'light', duration: 30 },
  'card-play': { pattern: [20, 10], intensity: 'medium', duration: 60 },
};
```

### 4. Gesture Hint System

#### Visual Feedback
```typescript
interface GestureHint {
  gesture: TouchGesture;
  description: string;
  visualIndicator: 'arrow' | 'circle' | 'path' | 'highlight';
  position: 'top' | 'bottom' | 'left' | 'right' | 'center';
  trigger: 'on-start' | 'on-progress' | 'on-complete';
  animation: 'fade-in' | 'slide-in' | 'pulse' | 'bounce';
}
```

## Implementation Plan

### Phase 1: Enhanced Gesture Recognition
1. **Extend useMobileGestures** with advanced gesture types
2. **Add multi-finger gesture support** (2-finger tap, 3-finger swipe)
3. **Implement circular gesture detection** for mode rotation
4. **Add gesture hint system** with visual feedback
5. **Enhance haptic feedback** with context-aware patterns

### Phase 2: STS-Specific Mobile Shortcuts
1. **Create STSMobileShortcutManager** hook
2. **Implement context-aware action mapping**
3. **Add combat-specific gestures** (swipe to play cards, tap to select)
4. **Create mobile command palette** with gesture triggers
5. **Integrate with existing keybinding system**

### Phase 3: UI Integration & Polish
1. **Create MobileGestureOverlay component** for visual hints
2. **Add gesture tutorial system** for new users
3. **Implement gesture customization panel**
4. **Add mobile shortcut editor** similar to keybinding panel
5. **Create comprehensive test suite**

## File Structure

```
src/ui/tools/sts/mobile/
├── hooks/
│   ├── useAdvancedMobileGestures.ts      # Enhanced gesture recognition
│   ├── useSTSMobileShortcuts.ts           # STS-specific shortcuts
│   └── useMobileHapticFeedback.ts        # Haptic feedback system
├── components/
│   ├── MobileGestureOverlay.tsx           # Visual gesture hints
│   ├── MobileShortcutPalette.tsx          # Command palette
│   ├── GestureTutorial.tsx                # Tutorial system
│   └── MobileShortcutEditor.tsx           # Shortcut customization
├── config/
│   ├── mobileGestureConfig.ts             # Gesture configuration
│   ├── mobileShortcutConfig.ts            # Shortcut definitions
│   └── hapticPatterns.ts                  # Haptic feedback patterns
├── types/
│   └── mobileTypes.ts                     # Mobile-specific types
└── styles/
    ├── mobile-gestures.module.css         # Gesture overlay styles
    └── mobile-shortcuts.module.css       # Shortcut UI styles
```

## Integration Points

### 1. With Existing Keybinding System
```typescript
// Extend existing keybinding types
interface STSKeybinding {
  // ... existing fields
  mobileGesture?: TouchGesture;
  mobileShortcut?: STSMobileShortcutAction;
  hapticPattern?: HapticPattern;
}
```

### 2. With Command System
```typescript
// Extend command bindings for mobile
interface STSCommandBinding {
  // ... existing fields
  mobileTrigger?: {
    gesture?: TouchGesture;
    shortcut?: STSMobileShortcutAction;
    hapticFeedback?: HapticPattern;
  };
}
```

### 3. With STS Components
```typescript
// Integration with STSNumericSimulator
const STSNumericSimulator: React.FC = () => {
  const mobileGestures = useAdvancedMobileGestures();
  const mobileShortcuts = useSTSMobileShortcuts();
  
  // Handle gestures and shortcuts
  // ...
};
```

## Testing Strategy

### 1. Unit Tests
- Gesture recognition accuracy
- Haptic feedback patterns
- Context-aware shortcut mapping
- Mobile device detection

### 2. Integration Tests
- Gesture to command mapping
- Shortcut to action execution
- Haptic feedback integration
- UI component interaction

### 3. E2E Tests
- Complete gesture workflows
- Mobile-specific user journeys
- Cross-device compatibility
- Performance under load

## Performance Considerations

### 1. Touch Event Optimization
- Debounce rapid touch events
- Passive event listeners where possible
- Efficient gesture calculation algorithms
- Memory cleanup for gesture state

### 2. Haptic Feedback Efficiency
- Respect device capabilities
- Batch haptic patterns
- Provide fallback for unsupported devices
- User preference respect

### 3. Rendering Performance
- CSS transforms for gesture animations
- Hardware acceleration for overlays
- Efficient re-render patterns
- Lazy loading of gesture hints

## Accessibility

### 1. Motor Accessibility
- Adjustable gesture sensitivity
- Alternative input methods
- Gesture timeout configuration
- One-handed operation support

### 2. Visual Accessibility
- High contrast gesture hints
- Adjustable hint opacity
- Screen reader support
- Color-blind friendly indicators

### 3. Cognitive Accessibility
- Clear gesture instructions
- Progressive disclosure of features
- Gesture learning curve management
- Contextual help system

## Browser Compatibility

### 1. Touch Events
- Modern browsers: Full support
- Legacy browsers: Mouse fallback
- Progressive enhancement approach
- Feature detection and graceful degradation

### 2. Haptic Feedback
- Vibration API support detection
- Fallback patterns for unsupported devices
- User preference respect
- Battery consideration

### 3. CSS Features
- CSS Grid and Flexbox with fallbacks
- CSS transforms with vendor prefixes
- Custom properties for theming
- Media queries for responsive design

## Success Metrics

### 1. User Experience
- Gesture recognition accuracy > 95%
- Shortcut execution latency < 100ms
- User satisfaction score > 4.5/5
- Learning curve < 5 minutes

### 2. Technical Performance
- Touch event processing < 16ms (60fps)
- Memory usage < 10MB for gesture system
- Battery impact < 5% during active use
- Cross-device compatibility > 90%

### 3. Adoption
- Mobile user engagement increase > 20%
- Gesture usage frequency > 60% of mobile users
- Shortcut customization rate > 30%
- Tutorial completion rate > 80%
