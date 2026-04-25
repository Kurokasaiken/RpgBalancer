# Punch Club Surge Resource Tutorial Documentation

## Overview

The Punch Club Surge Resource Tutorial is an interactive, config-first tutorial system designed to teach players how to effectively use the Surge resource in Punch Club. The tutorial provides step-by-step guidance, validation, and comprehensive tracking of player progress.

## Features

### Core Features
- **Interactive Tutorial Steps**: 6 comprehensive steps covering Surge mechanics
- **Config-First Design**: All content and behavior driven by configuration
- **Progress Tracking**: Detailed progress monitoring with KPI collection
- **Mobile Responsive**: Optimized for both desktop and mobile experiences
- **Haptic Feedback**: Tactile feedback for enhanced user experience
- **Telemetry Integration**: Comprehensive analytics for tutorial performance

### Advanced Features
- **Resource Gating**: Smart gating based on player level and progress
- **Validation System**: Step completion validation with time and action requirements
- **Skip Functionality**: Optional step skipping for experienced players
- **Auto-Advance**: Automatic progression when enabled
- **Celebration Effects**: Visual and haptic feedback on completion
- **Export Capabilities**: JSON export of progress and analytics data

## Architecture

### Components

#### `useSurgeTutorial` Hook
Main React hook for managing tutorial state and logic.

**Key Functions:**
- `startTutorial()`: Initialize tutorial session
- `completeStep()`: Mark current step as completed
- `skipStep()`: Skip current step
- `nextStep()` / `previousStep()`: Navigate between steps
- `goToStep()`: Jump to specific step
- `resetTutorial()`: Reset tutorial progress

#### `SurgeResourceModule` Component
Main tutorial UI component with modal/banner views.

**Render Modes:**
- Welcome screen (tutorial not started)
- Step content (active tutorial)
- Completion screen (tutorial finished)
- Mobile optimized version
- Compact banner version

#### `SurgeTutorialConfig` Configuration
Complete configuration system with Zod validation.

**Key Sections:**
- Tutorial metadata and steps
- UI configuration and mobile settings
- Haptic feedback patterns
- Telemetry event configuration
- Resource gating rules

### Configuration Structure

```typescript
interface SurgeTutorialConfig {
  tutorial: {
    id: string;
    name: string;
    description: string;
    version: string;
    author: string;
    estimatedDuration: number;
    difficulty: 'beginner' | 'intermediate' | 'advanced';
    prerequisites: string[];
  };
  steps: TutorialStep[];
  thresholds: {
    minStepTime: number;
    maxStepTime: number;
    minTotalTime: number;
    maxTotalTime: number;
    completionRateThreshold: number;
  };
  ui: {
    showOnFirstVisit: boolean;
    allowSkipping: boolean;
    showProgressIndicator: boolean;
    autoAdvance: boolean;
    showCompletionCelebration: boolean;
    mobile: {
      compactMode: boolean;
      swipeNavigation: boolean;
      touchTargets: boolean;
    };
  };
  haptics: {
    enabled: boolean;
    stepCompletionPattern: string;
    errorPattern: string;
    successPattern: string;
    intensity: {
      light: number;
      medium: number;
      strong: number;
    };
  };
  telemetry: {
    enabled: boolean;
    events: {
      stepStarted: string;
      stepCompleted: string;
      stepSkipped: string;
      tutorialCompleted: string;
      tutorialAbandoned: string;
    };
    batchSize: number;
    flushInterval: number;
  };
  resourceGating: {
    minLevel: number;
    requiredSteps: string[];
    unlockConditions: {
      experience: number;
      money: number;
      completedTraining: string[];
    };
  };
}
```

### Tutorial Steps

#### 1. Introduction
- **Objective**: Welcome players and introduce Surge concept
- **Duration**: 30 seconds
- **Content**: Overview of Surge benefits and tutorial goals
- **Validation**: Read content, minimum 10 seconds

#### 2. Resource Overview
- **Objective**: Familiarize players with Surge UI elements
- **Duration**: 45 seconds
- **Content**: Detailed explanation of Surge meter, controls, and indicators
- **Validation**: Explore UI, identify elements, minimum 15 seconds

#### 3. Surge Basics
- **Objective**: Teach fundamental Surge mechanics
- **Duration**: 60 seconds
- **Content**: Accumulation, activation, duration, and cooldown concepts
- **Validation**: Understand mechanics, minimum 20 seconds

#### 4. First Surge
- **Objective**: Guide players through first Surge activation
- **Duration**: 90 seconds
- **Content**: Practical activation with real gameplay
- **Validation**: Activate Surge, experience effects, minimum 30 seconds

#### 5. Advanced Usage
- **Objective**: Introduce advanced strategies and techniques
- **Duration**: 120 seconds
- **Content**: Timing strategies, combo integration, counter-play
- **Validation**: Learn advanced techniques, minimum 45 seconds

#### 6. Completion
- **Objective**: Celebrate completion and summarize achievements
- **Duration**: 30 seconds
- **Content**: Achievement review and next steps
- **Validation**: Review achievements, minimum 10 seconds

## Usage

### Basic Implementation

```typescript
import { useSurgeTutorial } from '@/ui/punchClub/hooks/useSurgeTutorial';
import { SurgeResourceModule } from '@/ui/punchClub/tutorials/SurgeResourceModule';

function PunchClubGame() {
  const tutorial = useSurgeTutorial(
    // Optional custom configuration
    {
      ui: {
        showOnFirstVisit: true,
        allowSkipping: true,
      },
      haptics: {
        enabled: true,
        intensity: {
          light: 0.2,
          medium: 0.5,
          strong: 0.8,
        },
      },
    },
    // Player state for resource gating
    playerLevel,
    playerExperience,
    playerMoney,
    completedTraining
  );

  return (
    <div className="game-container">
      {/* Game content */}
      
      {/* Tutorial overlay */}
      <SurgeResourceModule
        config={tutorial.config}
        progress={tutorial.state}
        currentStep={tutorial.currentStep}
        isActive={tutorial.isActive}
        canStart={tutorial.canStart}
        isCompleted={tutorial.isCompleted}
        completionPercentage={tutorial.completionPercentage}
        isMobile={isMobile}
        onStartTutorial={tutorial.startTutorial}
        onCompleteStep={tutorial.completeStep}
        onSkipStep={tutorial.skipStep}
        onNextStep={tutorial.nextStep}
        onPreviousStep={tutorial.previousStep}
        onResetTutorial={tutorial.resetTutorial}
        onCloseTutorial={() => {/* Handle close */}}
      />
    </div>
  );
}
```

### Mobile Implementation

```typescript
import { MobileSurgeResourceModule } from '@/ui/punchClub/tutorials/SurgeResourceModule';

function MobilePunchClubGame() {
  const tutorial = useSurgeTutorial();

  return (
    <div className="mobile-game">
      <MobileSurgeResourceModule
        {...tutorial}
        isMobile={true}
      />
    </div>
  );
}
```

### Banner Integration

```typescript
import { CompactSurgeTutorialBanner } from '@/ui/punchClub/tutorials/SurgeResourceModule';

function GameWithBanner() {
  const tutorial = useSurgeTutorial();

  return (
    <div className="game">
      {/* Banner shown when tutorial can start */}
      <CompactSurgeTutorialBanner
        config={tutorial.config}
        progress={tutorial.state}
        currentStep={tutorial.currentStep}
        isActive={tutorial.isActive}
        canStart={tutorial.canStart}
        isCompleted={tutorial.isCompleted}
        completionPercentage={tutorial.completionPercentage}
        onStartTutorial={tutorial.startTutorial}
        onCloseTutorial={() => {/* Handle close */}}
      />
      
      {/* Game content */}
    </div>
  );
}
```

### Custom Configuration

```typescript
const customConfig = {
  tutorial: {
    name: 'Advanced Surge Tutorial',
    difficulty: 'advanced' as const,
    estimatedDuration: 600, // 10 minutes
  },
  steps: [
    // Custom steps...
  ],
  thresholds: {
    minStepTime: 15, // Longer minimum time
    completionRateThreshold: 0.9, // Higher completion requirement
  },
  ui: {
    allowSkipping: false, // No skipping for advanced tutorial
    autoAdvance: true, // Auto-advance steps
  },
  haptics: {
    enabled: true,
    stepCompletionPattern: 'complex-pattern',
    intensity: {
      light: 0.3,
      medium: 0.6,
      strong: 1.0,
    },
  },
};

const tutorial = useSurgeTutorial(customConfig);
```

## Resource Gating

The tutorial system includes intelligent resource gating to ensure players are ready for Surge content.

### Gating Rules

#### Level Requirements
```typescript
resourceGating: {
  minLevel: 1, // Minimum player level
}
```

#### Experience Requirements
```typescript
resourceGating: {
  unlockConditions: {
    experience: 0, // Minimum experience points
    money: 0, // Minimum in-game currency
    completedTraining: [], // Required training modules
  },
}
```

#### Step Prerequisites
```typescript
// Each step can have prerequisites
{
  id: 'advanced_usage',
  prerequisites: ['introduction', 'surge_basics', 'first_surge'],
  // ... other step properties
}
```

### Custom Gating Logic

```typescript
const canStart = useMemo(() => {
  // Check player level
  if (playerLevel < config.resourceGating.minLevel) {
    return false;
  }
  
  // Check experience
  if (playerExperience < config.resourceGating.unlockConditions.experience) {
    return false;
  }
  
  // Check completed training
  const hasRequiredTraining = config.resourceGating.unlockConditions.completedTraining
    .every(training => completedTraining.includes(training));
  
  if (!hasRequiredTraining) {
    return false;
  }
  
  return true;
}, [playerLevel, playerExperience, completedTraining]);
```

## Telemetry and Analytics

### Telemetry Events

The tutorial system emits comprehensive telemetry events for analytics:

#### Step Events
```typescript
// Step started
{
  type: 'pc_surge_tutorial_step_started',
  data: {
    tutorialId: 'punch-club-surge-tutorial',
    stepId: 'introduction',
    stepType: 'introduction',
    timestamp: 1642694400000,
  }
}

// Step completed
{
  type: 'pc_surge_tutorial_step_completed',
  data: {
    tutorialId: 'punch-club-surge-tutorial',
    stepId: 'introduction',
    stepType: 'introduction',
    timeSpent: 15000,
    actions: ['read_content'],
    timestamp: 1642694415000,
  }
}

// Step skipped
{
  type: 'pc_surge_tutorial_step_skipped',
  data: {
    tutorialId: 'punch-club-surge-tutorial',
    stepId: 'resource_overview',
    stepType: 'resource_overview',
    timestamp: 1642694420000,
  }
}
```

#### Tutorial Events
```typescript
// Tutorial completed
{
  type: 'pc_surge_tutorial_completed',
  data: {
    tutorialId: 'punch-club-surge-tutorial',
    totalTimeSpent: 375000,
    completedSteps: 6,
    skippedSteps: 0,
    completionRate: 1.0,
    timestamp: 1642694780000,
  }
}

// Tutorial abandoned
{
  type: 'pc_surge_tutorial_abandoned',
  data: {
    tutorialId: 'punch-club-surge-tutorial',
    currentStepId: 'surge_basics',
    completedSteps: 2,
    totalTimeSpent: 120000,
    inactivityTime: 300000,
    timestamp: 1642694800000,
  }
}
```

### KPI Metrics

The tutorial system tracks key performance indicators:

#### Completion Metrics
- **Completion Rate**: Percentage of users completing the tutorial
- **Average Time**: Average time to complete tutorial
- **Step Completion**: Completion rate per step
- **Skip Rate**: Percentage of users skipping steps

#### Engagement Metrics
- **Time on Step**: Average time spent per step
- **Interaction Rate**: User interactions per step
- **Return Rate**: Users returning to tutorial
- **Drop-off Points**: Steps where users abandon

#### Performance Metrics
- **Render Performance**: Component render times
- **Memory Usage**: Tutorial system memory footprint
- **Load Times**: Tutorial initialization time
- **Responsiveness**: UI interaction responsiveness

### Analytics Integration

```typescript
// Custom analytics integration
const handleTelemetry = (event: TelemetryEvent) => {
  // Send to analytics service
  analytics.track(event.type, event.data);
  
  // Update local metrics
  updateTutorialMetrics(event);
  
  // Trigger real-time alerts
  if (event.type === 'pc_surge_tutorial_abandoned') {
    triggerIntervention(event.data);
  }
};

// Integration with tutorial hook
const tutorial = useSurgeTutorial(
  config,
  playerLevel,
  playerExperience,
  playerMoney,
  completedTraining,
  handleTelemetry // Custom telemetry handler
);
```

## Haptic Feedback

### Haptic Patterns

The tutorial system supports haptic feedback for enhanced user experience:

#### Step Completion
```typescript
haptics: {
  stepCompletionPattern: 'double-pulse',
  intensity: 0.5, // Medium intensity
}
```

#### Error/Warning
```typescript
haptics: {
  errorPattern: 'long-buzz',
  intensity: 0.3, // Light intensity
}
```

#### Success
```typescript
haptics: {
  successPattern: 'triple-pulse',
  intensity: 0.7, // Strong intensity
}
```

### Implementation

```typescript
const triggerHaptic = (pattern: string, intensity: number) => {
  if (!config.haptics.enabled) return;
  
  // Convert pattern to vibration timing
  const vibrationPattern = pattern === 'double-pulse' 
    ? [100, 50, 100]
    : pattern === 'triple-pulse'
    ? [100, 50, 100, 50, 100]
    : pattern === 'long-buzz'
    ? 500
    : 200;
  
  // Trigger haptic feedback
  if (navigator.vibrate) {
    navigator.vibrate(vibrationPattern);
  }
};
```

## Mobile Optimization

### Mobile-Specific Features

#### Responsive Design
- **Compact Mode**: Reduced UI elements for small screens
- **Touch Targets**: Larger touch targets for mobile interaction
- **Swipe Navigation**: Gesture-based navigation between steps
- **Adaptive Layout**: UI adapts to screen orientation

#### Performance Optimization
- **Reduced Animations**: Simplified animations for mobile performance
- **Lazy Loading**: Load content on-demand
- **Memory Management**: Optimized memory usage for mobile devices
- **Battery Awareness**: Reduced haptic feedback to save battery

### Mobile Configuration

```typescript
mobile: {
  compactMode: true,    // Use compact UI layout
  swipeNavigation: true, // Enable swipe gestures
  touchTargets: true,    // Larger touch targets
}
```

### Mobile Implementation

```typescript
const MobileTutorial = () => {
  const tutorial = useSurgeTutorial();
  
  // Mobile-specific gesture handling
  const handleSwipe = useCallback((direction: 'left' | 'right') => {
    if (direction === 'right') {
      tutorial.nextStep();
    } else if (direction === 'left') {
      tutorial.previousStep();
    }
  }, [tutorial]);

  return (
    <div className="mobile-tutorial">
      <MobileSurgeResourceModule
        {...tutorial}
        isMobile={true}
        onSwipe={handleSwipe}
      />
    </div>
  );
};
```

## Testing

### Unit Tests

The tutorial system includes comprehensive unit tests covering:

#### Configuration Tests
- Configuration validation
- Default value handling
- Schema validation
- Type safety

#### Hook Tests
- State management
- Step navigation
- Progress tracking
- Resource gating

#### Component Tests
- UI rendering
- User interactions
- Mobile responsiveness
- Accessibility

#### Integration Tests
- Hook + component integration
- End-to-end tutorial flow
- Telemetry integration
- Performance testing

### Test Structure

```typescript
describe('Surge Tutorial System', () => {
  describe('Configuration', () => {
    it('should validate default configuration');
    it('should merge custom configuration');
    it('should handle invalid configuration');
  });

  describe('Hook Functionality', () => {
    it('should initialize with default state');
    it('should start tutorial correctly');
    it('should complete steps with validation');
    it('should handle step navigation');
    it('should respect resource gating');
  });

  describe('Component Rendering', () => {
    it('should render welcome screen');
    it('should render tutorial steps');
    it('should render completion screen');
    it('should handle mobile layout');
  });

  describe('Integration', () => {
    it('should complete full tutorial flow');
    it('should emit telemetry events');
    it('should handle edge cases');
  });
});
```

### Running Tests

```bash
# Run all tutorial tests
npm run test -- tests/unit/punchClub/SurgeTutorial.test.tsx

# Run with coverage
npm run test -- tests/unit/punchClub/SurgeTutorial.test.tsx --coverage

# Run specific test groups
npm run test -- tests/unit/punchClub/SurgeTutorial.test.tsx -g "Configuration"
```

## Performance Considerations

### Optimization Strategies

#### Memory Management
- **Lazy Loading**: Load tutorial content on-demand
- **Component Unmounting**: Clean up resources when not active
- **State Optimization**: Minimize unnecessary state updates
- **Cache Management**: Cache computed values and calculations

#### Render Performance
- **Memoization**: Cache expensive calculations
- **Virtualization**: Virtualize large lists if needed
- **Debouncing**: Debounce user interactions
- **Batch Updates**: Batch state updates

#### Network Performance
- **Telemetry Batching**: Batch telemetry events
- **Async Operations**: Use async/await for async operations
- **Error Handling**: Graceful error handling and recovery
- **Retry Logic**: Implement retry logic for failed operations

### Performance Metrics

#### Target Metrics
- **Initial Load**: < 100ms
- **Step Navigation**: < 50ms
- **Component Render**: < 16ms
- **Memory Usage**: < 5MB
- **Battery Impact**: Minimal

#### Monitoring

```typescript
// Performance monitoring
const performanceMetrics = {
  renderTime: 0,
  memoryUsage: 0,
  batteryImpact: 0,
  networkLatency: 0,
};

const measurePerformance = (operation: () => void) => {
  const start = performance.now();
  operation();
  const end = performance.now();
  
  performanceMetrics.renderTime = end - start;
  
  // Log performance metrics
  console.log('Performance:', performanceMetrics);
};
```

## Troubleshooting

### Common Issues

#### Tutorial Not Starting
**Problem**: Tutorial doesn't start when expected
**Solution**: Check resource gating requirements
```typescript
// Check player level
if (playerLevel < config.resourceGating.minLevel) {
  console.log('Player level too low for tutorial');
}

// Check prerequisites
const hasPrerequisites = arePrerequisitesSatisfied(
  config.steps,
  'introduction',
  []
);
```

#### Step Validation Failing
**Problem**: Step completion validation fails
**Solution**: Check time and action requirements
```typescript
const validation = validateStepCompletion(step, timeSpent, actions);
if (!validation.valid) {
  console.log('Validation failed:', validation.reasons);
}
```

#### Mobile Layout Issues
**Problem**: Mobile layout not displaying correctly
**Solution**: Check mobile configuration and responsive design
```typescript
if (isMobile && !config.mobile.compactMode) {
  console.warn('Mobile compact mode not enabled');
}
```

#### Haptic Feedback Not Working
**Problem**: Haptic feedback not triggering
**Solution**: Check haptic configuration and browser support
```typescript
if (!config.haptics.enabled) {
  console.log('Haptic feedback disabled');
}

if (!navigator.vibrate) {
  console.log('Vibration API not supported');
}
```

### Debug Mode

Enable debug mode for detailed logging:

```typescript
const debugConfig = {
  ...config,
  debug: {
    enabled: true,
    logLevel: 'verbose',
    performanceTracking: true,
  },
};

const tutorial = useSurgeTutorial(debugConfig);
```

### Error Recovery

Implement graceful error handling:

```typescript
const handleError = (error: Error, context: string) => {
  console.error(`Tutorial error in ${context}:`, error);
  
  // Log error to telemetry
  console.log('Tutorial error:', {
    context,
    error: error.message,
    timestamp: Date.now(),
  });
  
  // Attempt recovery
  try {
    tutorial.resetTutorial();
  } catch (recoveryError) {
    console.error('Recovery failed:', recoveryError);
  }
};
```

## Best Practices

### Configuration Management
- **Centralized Configuration**: Keep all configuration in one place
- **Version Control**: Version configuration changes
- **Validation**: Always validate configuration before use
- **Defaults**: Provide sensible defaults for all options

### User Experience
- **Progressive Disclosure**: Reveal information gradually
- **Clear Instructions**: Provide clear, concise instructions
- **Feedback**: Provide immediate feedback for user actions
- **Flexibility**: Allow users to skip or pause tutorial

### Performance
- **Lazy Loading**: Load resources only when needed
- **Efficient Updates**: Minimize unnecessary re-renders
- **Memory Management**: Clean up resources properly
- **Battery Awareness**: Consider mobile battery life

### Testing
- **Comprehensive Coverage**: Test all functionality
- **Edge Cases**: Test edge cases and error conditions
- **Performance Testing**: Monitor performance metrics
- **User Testing**: Conduct user testing sessions

## Future Enhancements

### Planned Features
- **Adaptive Difficulty**: Adjust difficulty based on player performance
- **Personalization**: Customize tutorial based on player preferences
- **Social Features**: Share progress and achievements
- **Analytics Dashboard**: Advanced analytics dashboard for tutorial performance
- **A11y Improvements**: Enhanced accessibility features

### Extension Points
- **Custom Steps**: Plugin system for custom tutorial steps
- **Custom Validation**: Extensible validation framework
- **Custom Telemetry**: Custom telemetry providers
- **Custom UI**: Custom UI components and themes

### Integration Opportunities
- **Game Systems**: Integration with other game systems
- **Analytics Platforms**: Integration with analytics platforms
- **Learning Management**: Integration with LMS systems
- **Community Features**: Integration with community features

## API Reference

### Hooks

#### `useSurgeTutorial`
Main hook for tutorial management.

```typescript
const tutorial = useSurgeTutorial(
  config?: Partial<SurgeTutorialConfig>,
  playerLevel?: number,
  playerExperience?: number,
  playerMoney?: number,
  completedTraining?: string[]
);
```

**Returns:**
```typescript
{
  state: TutorialProgress;
  currentStep: TutorialStep | undefined;
  steps: TutorialStep[];
  config: SurgeTutorialConfig;
  isActive: boolean;
  canStart: boolean;
  isCompleted: boolean;
  completionPercentage: number;
  statistics: TutorialStatistics;
  startTutorial: () => void;
  completeStep: (actions?: string[]) => void;
  skipStep: () => void;
  nextStep: () => void;
  previousStep: () => void;
  goToStep: (stepId: string) => void;
  resetTutorial: () => void;
  updateConfig: (config: Partial<SurgeTutorialConfig>) => void;
}
```

### Components

#### `SurgeResourceModule`
Main tutorial component.

**Props:**
```typescript
interface SurgeResourceModuleProps {
  config: SurgeTutorialConfig;
  progress: TutorialProgress;
  currentStep: TutorialStep | undefined;
  isActive: boolean;
  canStart: boolean;
  isCompleted: boolean;
  completionPercentage: number;
  isMobile: boolean;
  onStartTutorial: () => void;
  onCompleteStep: (actions?: string[]) => void;
  onSkipStep: () => void;
  onNextStep: () => void;
  onPreviousStep: () => void;
  onResetTutorial: () => void;
  onCloseTutorial: () => void;
}
```

#### `MobileSurgeResourceModule`
Mobile-optimized tutorial component.

#### `CompactSurgeTutorialBanner`
Compact tutorial banner component.

### Utility Functions

#### Configuration Functions
- `createSafeSurgeTutorialConfig()`: Create safe configuration
- `createSafeTutorialProgress()`: Create safe progress object
- `isValidSurgeTutorialConfig()`: Validate configuration

#### Step Navigation Functions
- `getTutorialStepById()`: Get step by ID
- `getNextTutorialStep()`: Get next step
- `getPreviousTutorialStep()`: Get previous step
- `getTutorialStepByType()`: Get step by type

#### Validation Functions
- `validateStepCompletion()`: Validate step completion
- `arePrerequisitesSatisfied()`: Check prerequisites
- `validateTutorialIntegrity()`: Validate tutorial integrity

#### Utility Functions
- `calculateCompletionPercentage()`: Calculate completion percentage
- `formatTimeDisplay()`: Format time for display
- `generateTutorialStatistics()`: Generate statistics
- `exportTutorialProgress()`: Export progress data

## Conclusion

The Punch Club Surge Resource Tutorial provides a comprehensive, config-first solution for teaching players about the Surge resource. With its robust architecture, comprehensive testing, and mobile optimization, it offers an excellent foundation for player education and onboarding.

The system follows RPG Balancer philosophy with:
- **Config-First Design**: All behavior driven by configuration
- **Type Safety**: Comprehensive TypeScript support
- **Performance Optimization**: Efficient rendering and memory usage
- **Extensibility**: Plugin-ready architecture for future enhancements
- **Comprehensive Testing**: Full test coverage and validation

The tutorial system is ready for production deployment and can be easily extended and customized to meet specific game requirements.
