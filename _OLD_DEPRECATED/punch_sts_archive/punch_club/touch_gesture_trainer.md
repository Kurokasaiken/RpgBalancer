# Touch Gesture Trainer Documentation

## Overview

The Touch Gesture Trainer is an interactive tutorial system for teaching mobile touch gestures in Punch Club. It provides real-time feedback, haptic responses, and progress tracking to help players master essential mobile interactions.

**Task**: NP-114 – Mobile Touch Gesture Trainer  
**Agent**: Helios-PC – Touch Tutor  
**Estimated Duration**: 140 minutes  
**Dependencies**: PC-M1 Mobile Landing

## Features

### Core Functionality
- **7 Gesture Types**: Tap, Double Tap, Long Press, Swipe (Up/Down/Left/Right)
- **Real-time Validation**: Immediate feedback on gesture accuracy and timing
- **Haptic Feedback**: Vibration patterns for success, failure, and warnings
- **Progress Tracking**: Persistent storage of training progress and scores
- **Visual Hints**: Optional hand icons, arrows, and target indicators
- **Configurable Difficulty**: Adjustable accuracy thresholds and attempt limits

### Training Steps

1. **Basic Tap** (Required)
   - Quick touch and release
   - Accuracy threshold: 70%
   - 3 successful attempts required
   - Max 10 attempts

2. **Double Tap** (Skippable)
   - Two quick taps in succession
   - Accuracy threshold: 75%
   - Timing window: <500ms between taps

3. **Long Press** (Skippable)
   - Hold for 1+ seconds
   - Accuracy threshold: 80%
   - Haptic feedback on completion

4. **Swipe Up/Down/Left/Right** (Skippable)
   - Directional swipes with minimum 100px distance
   - Accuracy threshold: 70%
   - Speed validation: <1000ms

## Architecture

### Components

#### `TouchGestureTrainer.tsx`
Main React component with three screens:
- **Welcome Screen**: Tutorial overview and start button
- **Training Screen**: Active gesture practice with feedback
- **Completion Screen**: Results summary and score

#### `useTouchGesture.ts`
Custom hook managing:
- Touch event handling (start/move/end)
- Gesture detection and validation
- Progress tracking and persistence
- Haptic feedback triggering
- Telemetry emission

#### `touchGestureConfig.ts`
Config-first configuration with:
- Training step definitions
- Validation thresholds
- Haptic patterns
- Scoring weights
- Telemetry settings

## Configuration

### Default Config

```typescript
{
  tutorial: {
    id: 'punch-club-touch-gestures',
    name: 'Punch Club Touch Gestures',
    difficulty: 'beginner',
    estimatedDuration: 5, // minutes
  },
  settings: {
    showProgressBar: true,
    allowSkipping: true,
    enableHaptics: true,
    enableVisualFeedback: true,
  },
  scoring: {
    accuracyWeight: 0.5,
    speedWeight: 0.3,
    consistencyWeight: 0.2,
    passingScore: 0.7,
  },
}
```

### Customization

```typescript
import { TouchGestureTrainer } from '@/ui/punchClub/tutorials/TouchGestureTrainer';

<TouchGestureTrainer
  onComplete={() => console.log('Training completed')}
  onClose={() => console.log('Training closed')}
  className="custom-styles"
/>
```

## Gesture Validation

### Tap Validation
- **Duration**: <300ms
- **Movement**: <20px
- **Accuracy**: `1 - (duration/300) - (distance/20)`

### Double Tap Validation
- **Time Between Taps**: <500ms
- **Distance Between Taps**: <30px
- **Accuracy**: `1 - (timeDelta/500) - (distance/30)`

### Long Press Validation
- **Minimum Duration**: 1000ms
- **Maximum Movement**: <20px
- **Accuracy**: `min(1, duration/1000) - (distance/20)`

### Swipe Validation
- **Minimum Distance**: 100px
- **Maximum Duration**: 1000ms
- **Direction Accuracy**: 50% weight
- **Distance Accuracy**: 30% weight
- **Speed Accuracy**: 20% weight

## Haptic Patterns

### Success Patterns
- **Light**: `[10]` - Quick tap feedback
- **Heavy**: `[20, 50, 20]` - Step completion

### Failure Patterns
- **Short**: `[50]` - Invalid gesture

### Warning Patterns
- **Pulse**: `[10, 50, 10]` - Low accuracy warning

## Telemetry

### Events Tracked

```typescript
// Training lifecycle
pc_touch_training_started
pc_touch_training_completed
pc_touch_training_reset

// Step events
pc_touch_step_skipped
pc_touch_gesture_started
pc_touch_gesture_completed
```

### Event Payload

```typescript
{
  tutorialId: string;
  stepId: string;
  gestureType: TrainingGestureType;
  valid: boolean;
  accuracy: number;
  timing: number;
  isStepCompleted: boolean;
  isStepFailed: boolean;
}
```

## Persistence

### Storage Keys
- **Config**: `punch_club_touch_gesture_config`
- **Progress**: `punch_club_touch_gesture_progress`

### Progress Data

```typescript
{
  currentStepIndex: number;
  completedSteps: string[];
  skippedSteps: string[];
  failedSteps: string[];
  attempts: {
    [stepId: string]: {
      count: number;
      successes: number;
      failures: number;
      averageAccuracy: number;
      averageTime: number;
    };
  };
  startTime: number;
  endTime: number;
  totalDuration: number;
  overallScore: number;
  passed: boolean;
}
```

## Integration

### With Mobile Landing (PC-M1)

```typescript
import { MobileLanding } from '@/ui/punchClub/MobileLanding';
import { TouchGestureTrainer } from '@/ui/punchClub/tutorials/TouchGestureTrainer';

function PunchClubMobile() {
  const [showTrainer, setShowTrainer] = useState(false);

  return (
    <>
      <MobileLanding 
        onGestureTraining={() => setShowTrainer(true)}
      />
      {showTrainer && (
        <TouchGestureTrainer
          onComplete={() => setShowTrainer(false)}
          onClose={() => setShowTrainer(false)}
        />
      )}
    </>
  );
}
```

### With Haptics System

The trainer integrates with the existing `hapticsPatterns.ts` configuration:

```typescript
import { DEFAULT_HAPTICS_PATTERNS } from '@/ui/punchClub/config/hapticsPatterns';

// Patterns used:
// - success-light: Step progress
// - success-heavy: Step completion
// - failure-short: Invalid gesture
// - warning-pulse: Low accuracy
// - notification-gentle: Navigation
```

## Testing

### Manual Testing Checklist

- [ ] Welcome screen displays correctly
- [ ] Start button initiates training
- [ ] Progress bar updates correctly
- [ ] Each gesture type validates properly
- [ ] Haptic feedback triggers on events
- [ ] Visual hints display when enabled
- [ ] Feedback messages show accuracy/timing
- [ ] Skip button works for skippable steps
- [ ] Completion screen shows correct stats
- [ ] Progress persists across sessions

### Test Data IDs

```typescript
// Screens
'touch-gesture-trainer-welcome'
'touch-gesture-trainer-step'
'touch-gesture-trainer-completion'

// Interactive elements
'start-training-button'
'gesture-practice-area'
'skip-step-button'
'complete-training-button'

// Feedback
'gesture-feedback'
'training-progress-bar'
```

## Performance

### Optimization Strategies
- **Touch Event Throttling**: Events processed at 60fps max
- **Lazy Validation**: Validation only on touch end
- **Memoized Calculations**: Distance/angle calculations cached
- **Minimal Re-renders**: State updates batched

### Performance Targets
- **Touch Response**: <16ms (60fps)
- **Validation Latency**: <50ms
- **Haptic Trigger**: <10ms
- **Storage Write**: <100ms (async)

## Accessibility

### Touch Targets
- Minimum 44x44px touch targets (WCAG 2.1 Level AAA)
- Practice area: 256x256px minimum

### Visual Feedback
- High contrast borders (4.5:1 minimum)
- Color-independent feedback (icons + text)
- Large text for instructions (14px+)

### Alternative Input
- Supports mouse events for desktop testing
- Keyboard navigation for skip/close actions

## Troubleshooting

### Common Issues

**Haptics not working**
- Check device support: `'vibrate' in navigator`
- Verify config: `settings.enableHaptics: true`
- Test on physical device (not simulator)

**Gestures not detecting**
- Ensure touch events are not prevented
- Check practice area has proper event handlers
- Verify touch points are within bounds

**Progress not persisting**
- Check PersistenceService availability
- Verify storage keys are correct
- Test with browser DevTools Application tab

## Future Enhancements

### Planned Features
- [ ] Multi-finger gestures (pinch, spread, rotate)
- [ ] Custom gesture recording
- [ ] Difficulty presets (beginner/intermediate/advanced)
- [ ] Gesture speed challenges
- [ ] Leaderboard integration
- [ ] Gesture replay visualization

### Integration Opportunities
- [ ] Surge Tutorial integration
- [ ] Worker picker gesture shortcuts
- [ ] Combat gesture commands
- [ ] Quest interaction gestures

## References

- **PC-M1**: Mobile Landing page implementation
- **Haptics Patterns**: `src/ui/punchClub/config/hapticsPatterns.ts`
- **Gesture Recorder**: `src/ui/punchClub/hooks/useGestureRecorder.ts`
- **Mobile Optimization**: `docs/MOBILE_GUIDELINES.md`

---

**Last Updated**: 2026-01-23  
**Version**: 1.0.0  
**Status**: ✅ Implemented
