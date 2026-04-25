# Vertical Slice - Temporal Skin System Plan

## 1. Objective
Transform the existing skin system into **temporal/time-based skins** that can be activated/deactivated based on game state, time phases, or temporary conditions. All skins become temporary overlays rather than permanent visual states.

## 2. Temporal Skin Architecture

### 2.1 Core Concept
- **Temporal Skins**: Time-limited visual overlays that modify base appearance
- **Skin Layers**: Base skin + temporal overlay(s) = final appearance
- **Duration Control**: Skins have start/end times or trigger conditions
- **Stacking**: Multiple temporal skins can stack with priority rules

### 2.2 Temporal Skin Types
```typescript
export enum TemporalSkinType {
  PERMANENT = 'permanent',           // Base skin (existing)
  TIME_PHASED = 'time_phased',       // Day/night cycles
  EVENT_BASED = 'event_based',       // Quest events, celebrations
  CONDITIONAL = 'conditional',      // Weather, season, player status
  BUFF_DEBUFF = 'buff_debuff',       // Temporary power-ups/curses
  TRANSITIONAL = 'transitional'       // Morphing between states
}
```

### 2.3 Temporal Skin Config Structure
```typescript
export interface TemporalSkinConfig {
  id: string;
  type: TemporalSkinType;
  name: string;
  description: string;
  
  // Timing
  startTime?: number;        // Game time timestamp
  endTime?: number;          // Game time timestamp
  duration?: number;         // Duration in game time units
  
  // Triggers
  triggerConditions?: {
    gamePhase?: 'day' | 'night' | 'dawn' | 'dusk';
    questStatus?: string[];
    playerLevel?: number;
    locationType?: string[];
    weather?: string;
  };
  
  // Visual overrides
  visualOverrides: {
    palette?: Partial<ColorPalette>;
    typographyScale?: number;
    densityMode?: DensityMode;
    interactionPhysics?: Partial<InteractionPhysics>;
    componentThemes?: Partial<ComponentThemes>;
    effects?: {
      glowIntensity?: number;
      particleEffects?: boolean;
      animationSpeed?: number;
      soundProfile?: string;
    };
  };
  
  // Priority & Stacking
  priority: number;          // Higher numbers override lower
  stackable: boolean;        // Can combine with other temporal skins
  
  // Persistence
  persistAcrossSessions?: boolean;
  saveToUserProfile?: boolean;
}
```

## 3. Implementation Plan

### Phase 1: Temporal Skin System Core (High Priority)

#### 3.1 Temporal Skin Manager
**File**: `src/ui/idleVillage/skins/temporal/TemporalSkinManager.ts`

**Responsibilities**:
- Manage active temporal skins lifecycle
- Handle skin stacking and priority resolution
- Trigger skin activation/deactivation
- Calculate final visual state (base + temporal overrides)

**Key Methods**:
```typescript
class TemporalSkinManager {
  addTemporalSkin(config: TemporalSkinConfig): void;
  removeTemporalSkin(skinId: string): void;
  getActiveTemporalSkins(): TemporalSkinConfig[];
  resolveVisualState(baseSkin: SkinConfig, temporalSkins: TemporalSkinConfig[]): VisualState;
  checkTriggerConditions(): void; // Called every game tick
}
```

#### 3.2 Temporal Skin Registry
**File**: `src/ui/idleVillage/skins/temporal/temporalSkinRegistry.ts`

**Content**: Predefined temporal skin configs
```typescript
export const TEMPORAL_SKIN_REGISTRY: Record<string, TemporalSkinConfig> = {
  // Time-based
  'golden_hour': {
    id: 'golden_hour',
    type: TemporalSkinType.TIME_PHASED,
    name: 'Golden Hour',
    description: 'Warm sunset glow during evening hours',
    triggerConditions: { gamePhase: 'dusk' },
    visualOverrides: {
      palette: { warmGold: '#FFD700', sunsetOrange: '#FF6B35' },
      effects: { glowIntensity: 1.5, animationSpeed: 0.8 }
    },
    priority: 10,
    stackable: true
  },
  
  // Event-based
  'festival_celebration': {
    id: 'festival_celebration',
    type: TemporalSkinType.EVENT_BASED,
    name: 'Festival Celebration',
    description: 'Colorful decorations during village festivals',
    triggerConditions: { questStatus: ['festival_active'] },
    visualOverrides: {
      palette: { festivalRed: '#FF1744', festivalGold: '#FFD700' },
      effects: { particleEffects: true, soundProfile: 'festival' }
    },
    priority: 20,
    stackable: true
  },
  
  // Conditional
  'rainy_day': {
    id: 'rainy_day',
    type: TemporalSkinType.CONDITIONAL,
    name: 'Rainy Day',
    description: 'Muted colors and rain effects during weather',
    triggerConditions: { weather: 'rain' },
    visualOverrides: {
      palette: { saturation: 0.7, brightness: 0.8 },
      effects: { glowIntensity: 0.5, animationSpeed: 1.2 }
    },
    priority: 5,
    stackable: true
  }
};
```

### Phase 2: Convert Existing Skins to Temporal (High Priority)

#### 3.3 Transform VillageRosterSectionSkin
**Current**: Permanent skin wrapper
**Target**: Temporal-capable skin system

**Changes needed**:
```typescript
// Before
export interface VillageRosterSectionProps {
  pgCardSkinId?: string;
  pillar?: StyleLabPillar;
}

// After
export interface VillageRosterSectionProps {
  baseSkinConfig?: SkinConfig;
  temporalSkins?: TemporalSkinConfig[];
  enableTemporalEffects?: boolean;
}
```

#### 3.4 Transform PgCard System
**Current**: Static pgCardSkinId prop
**Target**: Dynamic temporal skin system

**Implementation**:
```typescript
// Hook for temporal PgCard skins
export const useTemporalPgCard = (residentId: string, baseSkin: string) => {
  const temporalManager = useTemporalSkinManager();
  
  return {
    currentSkin: temporalManager.resolvePgCardSkin(residentId, baseSkin),
    activeEffects: temporalManager.getActiveEffectsForResident(residentId),
    addTemporalEffect: (effect: TemporalSkinConfig) => temporalManager.addTemporalSkin(effect)
  };
};
```

### Phase 3: Complete Component Coverage (Medium Priority)

#### 3.5 TimeEngineStrip Temporal Enhancement
**File**: `src/ui/idleVillage/components/minimal/TimeEngineStripTemporal.tsx`

**Features**:
- Time-phase aware visual changes
- Celebration effects during special moments
- Weather-based clock appearance
- Event-based countdown animations

#### 3.6 ActiveHUD Temporal Integration
**File**: `src/ui/idleVillage/components/ActiveHUDTemporal.tsx`

**Features**:
- Buff/debuff visual indicators
- Event celebration overlays
- Time-phase aware HUD styling
- Priority-based effect stacking

#### 3.7 ActionHalo Temporal Effects
**File**: `src/ui/idleVillage/map/actionCards/ActionHaloTemporal.tsx`

**Features**:
- Event-based halo colors
- Time-phase glow intensity
- Weather-based halo visibility
- Celebration particle effects

### Phase 4: Integration & Testing (Medium Priority)

#### 3.8 TestRosterPage Temporal Integration
**Tasks**:
- Replace permanent skin wrappers with temporal system
- Add temporal skin control panel
- Implement real-time skin switching
- Add temporal effect timeline visualization

#### 3.9 VerticalSliceTestSection Temporal Controls
**Features**:
- Temporal skin timeline editor
- Real-time trigger condition testing
- Effect stacking visualization
- Performance monitoring

#### 3.10 Temporal Skin Persistence
**Implementation**:
```typescript
// Save temporal skin state
export const saveTemporalSkinState = async (state: TemporalSkinState) => {
  await PersistenceService.saveData('temporal-skin-state', state);
};

// Load and restore temporal skins
export const loadTemporalSkinState = async (): Promise<TemporalSkinState> => {
  return await PersistenceService.loadData('temporal-skin-state', DEFAULT_TEMPORAL_STATE);
};
```

## 4. Technical Implementation Details

### 4.1 Skin Resolution Algorithm
```typescript
export const resolveFinalVisualState = (
  baseSkin: SkinConfig,
  temporalSkins: TemporalSkinConfig[]
): FinalVisualState => {
  // Sort by priority (highest first)
  const sortedSkins = temporalSkins.sort((a, b) => b.priority - a.priority);
  
  // Apply overrides in priority order
  let finalState = { ...baseSkin };
  
  for (const temporalSkin of sortedSkins) {
    if (isTemporalSkinActive(temporalSkin)) {
      finalState = applyVisualOverrides(finalState, temporalSkin.visualOverrides);
    }
  }
  
  return finalState;
};
```

### 4.2 Performance Optimization
```typescript
// Memoized skin resolution to prevent recalculation
export const useResolvedTemporalSkin = (baseSkin: SkinConfig, temporalSkins: TemporalSkinConfig[]) => {
  return useMemo(() => {
    return resolveFinalVisualState(baseSkin, temporalSkins);
  }, [baseSkin.id, temporalSkins.map(s => s.id).join(',')]);
};
```

### 4.3 Telemetry Integration
```typescript
// Track temporal skin usage
export const trackTemporalSkinEvent = (event: string, data: {
  skinId: string;
  triggerType: string;
  duration?: number;
  stackSize?: number;
}) => {
  trackTelemetryEvent('temporal_skin_event', {
    event,
    timestamp: Date.now(),
    ...data
  });
};
```

## 5. Success Criteria

### 5.1 Functional Requirements
✅ All existing skins support temporal overlays
✅ Temporal skins can be triggered by time, events, conditions
✅ Multiple temporal skins can stack with priority rules
✅ Smooth transitions between skin states
✅ Performance remains < 16ms per frame with 5+ active temporal skins

### 5.2 Visual Requirements
✅ Seamless visual blending of base + temporal skins
✅ Clear visual hierarchy for stacked effects
✅ Consistent temporal effects across all components
✅ Accessibility maintained with temporal skins active

### 5.3 Technical Requirements
✅ Zero breaking changes to existing component APIs
✅ Backward compatibility with permanent skins
✅ Config-first temporal skin definitions
✅ Full test coverage for temporal skin lifecycle

## 6. Implementation Timeline

### Week 1: Core System (High Priority)
- TemporalSkinManager implementation
- Temporal skin registry with basic examples
- Skin resolution algorithm
- Basic persistence system

### Week 2: Component Conversion (High Priority)
- Convert VillageRosterSectionSkin to temporal
- Convert PgCard system to temporal
- Convert ResidentSlotRackSkin to temporal
- Update TestRosterPage integration

### Week 3: Complete Coverage (Medium Priority)
- TimeEngineStrip temporal enhancement
- ActiveHUD temporal integration
- ActionHalo temporal effects
- VerticalSliceTestSection temporal controls

### Week 4: Testing & Polish (Medium Priority)
- Complete test suite (RTL, Playwright, performance)
- Telemetry integration
- Documentation updates
- Performance optimization

## 7. Files to Create/Modify

### New Files
- `src/ui/idleVillage/skins/temporal/TemporalSkinManager.ts`
- `src/ui/idleVillage/skins/temporal/temporalSkinRegistry.ts`
- `src/ui/idleVillage/skins/temporal/temporalSkinSchemas.ts`
- `src/ui/idleVillage/hooks/useTemporalSkin.ts`
- `src/ui/idleVillage/components/minimal/TimeEngineStripTemporal.tsx`
- `src/ui/idleVillage/components/ActiveHUDTemporal.tsx`
- `src/ui/idleVillage/map/actionCards/ActionHaloTemporal.tsx`

### Modified Files
- `src/ui/idleVillage/components/VillageRosterSectionSkin.tsx`
- `src/ui/idleVillage/components/ResidentSlotRackSkin.tsx`
- `src/ui/idleVillage/components/SlottedMedalSkin.tsx`
- `src/ui/idleVillage/components/ActivityCapsule.tsx`
- `src/ui/idleVillage/TestRosterPage.tsx`
- `src/ui/idleVillage/components/VerticalSliceTestSection.tsx`

## 8. Risks & Mitigations

### Risk 1: Performance Impact
**Mitigation**: Memoized skin resolution, efficient trigger checking, effect pooling

### Risk 2: Visual Complexity
**Mitigation**: Clear priority rules, visual hierarchy guidelines, accessibility testing

### Risk 3: Breaking Changes
**Mitigation**: Backward compatibility layer, gradual migration path, comprehensive testing

### Risk 4: State Management Complexity
**Mitigation**: Centralized TemporalSkinManager, clear state contracts, persistence validation

This plan transforms the static skin system into a dynamic temporal skin system while maintaining backward compatibility and performance. The phased approach allows for incremental delivery and testing.
