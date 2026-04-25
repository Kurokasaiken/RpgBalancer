# Punch Club Gameplay Loop Documentation

## Overview

Punch Club Light is a deterministic gameplay loop that simulates an underground boxing club management experience. The system consists of three main phases that repeat in a cycle: Gym Shift (day), Rest Period (evening), and Underground Bout (night).

## Gameplay Loop Structure

### Phase 1: Gym Shift (Day)
**Component**: `GymShiftCard.tsx`
**Purpose**: Train fighters and generate gold
**Duration**: Configurable (typically 4-6 hours in-game)
**Mechanics**:
- Assign available worker to Gym Shift
- Pay food cost (configurable per activity)
- Generate gold reward (configurable per activity)
- Accumulate fatigue (18-22 points per shift)
- Low injury risk (2% chance)

**Resource Flow**:
```
Food Cost → Gold Reward + Fatigue
```

### Phase 2: Rest Period (Evening)
**Component**: `RestOverlay.tsx`
**Purpose**: Recover worker fatigue for next phase
**Duration**: Configurable (typically 8 hours in-game)
**Mechanics**:
- Open Rest Overlay to start recovery
- Recover 45 fatigue per resident per day (configurable)
- Monitor exhaustion levels
- Prepare workers for night phase

**Resource Flow**:
```
Time → Fatigue Recovery
```

### Phase 3: Underground Bout (Night)
**Component**: `BoutCard.tsx` + `PunchClubDuelSystem.tsx`
**Purpose**: Generate significant rewards through combat
**Duration**: Configurable (typically 2-4 hours in-game)
**Mechanics**:
- Pay gold entry cost (configurable per activity)
- Select opponent from generated pool
- Risk assessment with injury tracking (8% injury chance)
- Combat simulation with damage tracking
- Generate gold and grit rewards

**Resource Flow**:
```
Gold Cost → Gold Reward + Grit Reward ± Injury
```

## Complete Loop Cycle

### Resource Management Targets
- **Gold**: +10 per complete cycle (minimum)
- **Food**: +2 per complete cycle (minimum)
- **Fatigue**: Managed through rest periods
- **Grit**: Accumulated through successful bouts

### Loop Completion Criteria
A complete loop consists of:
1. **Gym Shift** completed with worker assignment
2. **Rest Period** activated with fatigue recovery
3. **Underground Bout** completed with opponent selection
4. **Net Resource Gain**: ≥+10 gold, ≥+2 food

## Component Integration

### Main Page Integration
**File**: `PunchClubPage.tsx`
- Manages preset activation and state
- Integrates all three phase components
- Provides telemetry and diagnostic hooks
- Handles session tagging and analytics

### Phase Components
```typescript
// Gym Shift Integration
<GymShiftCard
  activity={gymActivity}
  villageState={villageState}
  config={config}
  isPlaying={isGymActive}
  assignedResidentId={gymWorkerId}
  onTogglePlay={handleGymToggle}
  onWorkerDrop={handleGymAssignment}
/>

// Rest Period Integration
<RestOverlay
  isVisible={showRestOverlay}
  isResting={isRestActive}
  villageState={villageState}
  config={config}
  onToggleRest={handleRestToggle}
  onClose={handleRestClose}
/>

// Underground Bout Integration
<BoutCard
  activity={boutActivity}
  villageState={villageState}
  isPlaying={isBoutActive}
  assignedResidentId={boutWorkerId}
  onToggleStart={handleBoutToggle}
  onWorkerDrop={handleBoutAssignment}
/>
```

## New Systems Implementation

### FTUE (First-Time User Experience)
**File**: `PunchClubFTUE.tsx`
**Purpose**: Guide users through complete gameplay loop
**Features**:
- 10-step interactive tutorial
- Visual highlighting system
- Progress tracking and navigation
- Telemetry integration for completion tracking

**Tutorial Steps**:
1. Welcome to Punch Club Light
2. Gym Shift - Day Phase
3. Worker Assignment
4. Start Training
5. Rest Period - Evening Phase
6. Fatigue Management
7. Underground Bout - Night Phase
8. Risk Assessment
9. Complete the Loop
10. Telemetry & Analytics

### Duel System Enhancement
**File**: `PunchClubDuelSystem.tsx`
**Purpose**: Advanced combat simulation for Underground Bout
**Features**:
- Dynamic opponent generation (6 opponents)
- Turn-based combat simulation (5 rounds)
- Risk assessment and injury tracking
- Combat logging and visualization
- Dynamic reward calculation

**Combat Mechanics**:
```typescript
interface DuelResult {
  winner: 'fighter' | 'opponent' | 'draw';
  fighterDamage: number;
  opponentDamage: number;
  injuryOccurred: boolean;
  goldReward: number;
  gritReward: number;
  duration: number;
}
```

## Telemetry Integration

### Event Tracking
All user interactions are tracked through the existing `WorkerPickerTelemetryEvent` system:

**FTUE Events**:
- `open` - Tutorial step viewed
- `assignment_success` - Tutorial step completed
- `close` - Tutorial completed/dismissed

**Duel Events**:
- `assignment_attempt` - Duel start attempt
- `assignment_success` - Duel completion
- `assignment_cancel` - Duel cancellation

**Phase Events**:
- `open` - Phase started
- `close` - Phase completed
- `candidate_count` - Worker availability

### Diagnostic Integration
All components integrate with the sandbox diagnostic system:
```typescript
const diagnostics = createSandboxDiagnostics<PickerDiagnosticsPayload>(
  'ComponentName',
  'picker'
);
```

## Config-First Architecture

### Activity Definitions
All phase mechanics are defined in the activity configuration:
```typescript
interface ActivityDefinition {
  id: string;
  name: string;
  costs: ResourceCost[];
  rewards: ResourceReward[];
  duration: number;
  metadata: Record<string, unknown>;
}
```

### Risk Configuration
Injury and death risks are configurable:
```typescript
interface RiskMetrics {
  injuryPct: number;  // From activity metadata
  deathPct: number;   // From activity metadata
}
```

### Resource Configuration
All costs and rewards are derived from configuration:
- Food costs from `activity.costs`
- Gold rewards from `activity.rewards`
- Fatigue impact from `activity.metadata`
- Recovery rates from `config.globalRules.fatigueRecoveryPerDay`

## Mobile Optimization

### Touch Targets
- All interactive elements ≥44px minimum touch target
- Optimized tap zones for mobile devices
- Gesture-friendly interface design

### Layout Adaptation
- Vertical stacking under 1024px width
- Mobile-first component design
- Responsive typography and spacing

### Performance Considerations
- Optimized for mobile processors
- Efficient state management
- Minimal re-rendering during phases

## Risk Assessment System

### Injury Tracking
**Bout Card**: 8% injury chance with visual risk stripes
**Gym Shift**: 2% injury chance (low risk)
**Rest Period**: No injury risk

### Visual Indicators
- **Risk Stripes**: Yellow (injury) and red (death) proportional display
- **Fatigue Indicators**: Color-coded resident status
- **Resource Warnings**: Insufficient resource notifications

### Risk Mitigation
- Rest period mandatory before high-risk activities
- Fatigue thresholds prevent overexertion
- Resource validation before phase start

## Testing and Quality Assurance

### Unit Tests
- Component rendering and interaction tests
- Telemetry event validation
- Config integration verification
- Risk calculation accuracy

### Integration Tests
- Complete loop flow testing
- Resource management validation
- Phase transition testing
- Mobile responsiveness verification

### E2E Tests
- User journey through complete loop
- FTUE completion testing
- Duel system functionality
- Telemetry data collection

## Performance Metrics

### KPI Targets
- **Assignment Latency**: <450ms (tap to assignment confirmation)
- **Tap Throughput**: ≤3 taps per worker assignment
- **Resource Delta**: ≥+10 gold, ≥+2 food per cycle
- **FTUE Completion**: >80% completion rate

### Monitoring
- Real-time performance tracking
- User interaction analytics
- Resource balance monitoring
- Error reporting and diagnostics

## Future Enhancements

### Planned Features
- **Tournament Mode**: Multi-round competitions
- **Leaderboards**: Performance ranking system
- **Achievements**: Completion-based rewards
- **Advanced Opponents**: More varied fighter types

### Integration Opportunities
- **Cloud Sync**: Cross-device progress synchronization
- **Analytics Dashboard**: Detailed usage analytics
- **A/B Testing**: Tutorial optimization
- **Performance Monitoring**: Real-time KPI tracking

## Troubleshooting

### Common Issues
1. **Phase Not Starting**: Check resource availability and worker status
2. **Telemetry Not Working**: Verify diagnostic hooks and event tracking
3. **Mobile Layout Issues**: Check responsive breakpoints and touch targets
4. **Resource Imbalance**: Verify config values and phase completion criteria

### Debug Information
All components provide diagnostic information through:
- Console logging in development mode
- Telemetry event tracking
- Diagnostic payload logging
- Performance metrics collection

## Conclusion

The Punch Club gameplay loop provides a complete, deterministic experience with three distinct phases. The system is designed with config-first architecture, comprehensive telemetry, and mobile optimization. The implementation includes advanced features like FTUE guidance and duel system enhancement while maintaining compatibility with existing systems.

The loop is ready for production deployment and provides a solid foundation for underground boxing club management gameplay with full analytics and user guidance capabilities.

---

**Last Updated**: 2026-01-13  
**Version**: 1.0.0  
**Status**: Production Ready
