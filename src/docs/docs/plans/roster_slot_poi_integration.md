# Roster Slot POI Integration Specification

**Version**: 1.0  
**Date**: 2026-03-07  
**Status**: Active  
**Owner**: Idle Village Team  

---

## 📋 **Overview**

Questo documento definisce l'integrazione completa tra Roster Slot POI, Slot Assignment System, e PG (Personaggi Giocabili) nel sistema Idle Village. È il punto di riferimento per tutte le interazioni, comportamenti e test del sistema POI.

---

## 🎯 **Core Concepts**

### **Roster Slot POI**
- **Activity Capsule**: Component UI che visualizza attività e progresso
- **Skin System**: Visual styling con animazioni halo/corona
- **Timer Engine**: Gestione temporale delle attività
- **Collect System**: Raccolta ricompense al completamento

### **Slot Assignment System**
- **Rack Slots**: Postazioni assegnabili (Rack A, Rack B)
- **useResidentSlotController**: Hook per gestione assegnazioni
- **Drag & Drop**: Sistema di trascinamento PG → Slot
- **Validation**: Regole per assegnazione (HP, fatigue, requisiti)

### **PG (Personaggi Giocabili)**
- **ResidentState**: Stato completo del personaggio
- **Character Storage**: Persistenza dati personaggi
- **Stat System**: HP, damage, skill, etc.
- **Status Management**: available, injured, exhausted

---

## 🔄 **Integration Flow**

### **1. Initial State**
```
POI: Idle (no timer progress)
Slots: Empty (no residents assigned)
PG: Available in roster
Timer: Not started
Halo: No animation
```

### **2. Assignment Phase**
```
1. User drags PG from roster → Slot
2. useResidentSlotController validates assignment
3. Slot becomes occupied
4. POI timer starts
5. Halo animation begins
```

### **3. Active Phase**
```
POI: In-progress (progress bar filling)
Slots: Occupied (residents working)
PG: Assigned (fatigue accumulates)
Timer: Counting down
Halo: Active animation
```

### **4. Completion Phase**
```
POI: Completed (progress = 100%)
Slots: Still occupied
PG: Finished activity
Timer: Stopped at 0
Halo: Animation stopped
Collect: Button appears
```

### **5. Collect Phase**
```
1. User clicks "Raccogli oro"
2. Rewards calculated (4 gold × residents)
3. Gold added to player inventory
4. PG fatigue updated
5. POI resets to idle
6. Slots cleared
7. PG return to available status
```

---

## 🎮 **Detailed Interactions**

### **Timer Behavior**

| Condition | Timer State | Progress | Expected Behavior |
|-----------|-------------|----------|------------------|
| No residents assigned | Stopped | 0% | No progress, bar empty |
| 1+ residents assigned | Running | 0%→100% | Linear progress over duration |
| Timer reaches 0 | Stopped | 100% | Full bar, collect button appears |
| After collect | Reset | 0% | Ready for new assignment |

### **Halo/Corona Animation**

| Phase | Animation State | Visual Effect |
|-------|-----------------|---------------|
| Idle | None | POI static |
| Active | Spinning/glowing | Visual indicator of activity |
| Completed | Stopped/glow | Full completion indicator |
| After collect | None | Return to idle state |

### **Collect Button Logic**

```typescript
// Core logic from TestRosterPage.tsx
const canCollect = status === 'completed' && slots.some(s => s.isOccupied);

// Button visibility conditions:
// ✅ status === 'completed' AND slotsOccupied > 0
// ❌ status !== 'completed'
// ❌ slotsOccupied === 0
```

### **Reward Calculation**

```typescript
// Formula: baseReward × residentsCount
const baseReward = 4; // gold per resident
const residentsCount = slots.filter(s => s.isOccupied).length;
const totalReward = baseReward * residentsCount;

// Examples:
// 1 resident = 4 gold
// 2 residents = 8 gold  
// 3 residents = 12 gold
```

---

## 🧪 **Test Coverage**

### **Unit Tests** (`tests/unit/testRosterPage/`)
- ✅ `TestRosterPage.integration.test.tsx` - Basic integration
- ✅ `TestRosterPage.drop-state-validation.test.tsx` - Drop validation
- ✅ `useResidentSlotController.test.ts` - Slot controller logic

### **E2E Tests** (`tests/e2e/idleVillage/testRosterPgCards.spec.ts`)
- ✅ `describe('Roster Slot POI Integration', () => {
  test('should show collect button after timer completion with assigned resident', async ({ page }) => {
    // Test implementation
  });
  test('should not show collect button when no residents assigned', async ({ page }) => {
    // Test implementation
  });
  test('should not start timer when no residents assigned', async ({ page }) => {
    // Test implementation
  });
  test('should start halo animation when timer starts with assigned resident', async ({ page }) => {
    // Test implementation
  });
  test('should stop halo animation and show collect when timer completes', async ({ page }) => {
    // Test implementation
  });
  test('should give correct reward (4 gold per resident) when collect is clicked', async ({ page }) => {
    // Test implementation
  });
  test('should handle multiple residents with correct reward calculation', async ({ page }) => {
    // Test implementation
  });
});`

---

## 🔧 **Implementation Details**

### **Key Files**

```typescript
// Core POI component
src/ui/idleVillage/TestRosterPage.tsx
  ├── poiCapsuleData (memoized POI state)
  ├── canCollect logic
  └── handlePoiCollect

// Slot management
src/ui/idleVillage/slots/useResidentSlotController.ts
  ├── assignResidentToSlot
  ├── clearSlot
  └── getSlotProgress

// POI UI component
src/ui/idleVillage/components/ActivityCapsule.tsx
  ├── Progress bar
  ├── Collect button
  └── Timer display

// POI Skin system
src/ui/idleVillage/skins/activityCapsuleDetail/
  ├── Halo animations
  ├── Visual effects
  └── Style Lab integration

// Configuration
src/balancing/config/idleVillage/testHarnessConfig.ts
  ├── POI activityId: 'job_gold_mine_minimal'
  ├── Duration: 4 ticks (1 minute)
  └── Reward: 6 gold base (overridden to 4 per resident)
```

### **Data Flow**

```typescript
// Assignment flow
Roster PG → dragTo() → Slot → useResidentSlotController.assignResidentToSlot()
  → onAssign callback → assignmentsByScenario update
  → poiCapsuleData recalculation → POI UI update

// Timer flow  
useEffect() → safeCycleProgress → poiCapsuleData.status
  → canCollect logic → Collect button visibility

// Collect flow
handlePoiCollect() → reward calculation → gold update
  → slot clearing → PG status reset → POI reset
```

---

## 🎨 **UI/UX Specifications**

### **Visual States**

| State | POI Appearance | Timer | Progress Bar | Halo | Collect Button |
|-------|----------------|-------|--------------|------|----------------|
| Idle | Normal | Hidden | Empty | None | Hidden |
| Active | Highlighted | Visible | Filling | Spinning | Hidden |
| Completed | Glowing | "0:00" | Full | Stopped | Visible |
| Post-Collect | Normal | Hidden | Empty | None | Hidden |

### **Animation Timing**

```css
/* Halo animation */
@keyframes halo-spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Progress bar fill */
.activity-capsule__progress {
  transition: width 1s linear;
}

/* Collect button appear */
.activity-capsule__cta {
  animation: fadeIn 0.3s ease-in;
}
```

---

## 🚨 **Edge Cases & Error Handling**

### **Validation Rules**

```typescript
// Slot assignment validation
const canAssign = (resident: ResidentState, slot: SlotData) => {
  return resident.status === 'available' && 
         resident.currentHp > 0 && 
         resident.fatigue < 100 &&
         !slot.isOccupied;
};
```

### **Error States**

| Error | Condition | Handling |
|-------|-----------|----------|
| Invalid assignment | PG injured/exhausted | Show error feedback |
| Timer already running | Try to assign during activity | Allow assignment, update progress |
| Collect without completion | Click collect before ready | Button disabled |
| No gold display | UI element missing | Fallback to console log |

---

## 📊 **Performance Considerations**

### **Optimization Points**

1. **Memoized POI State**: `poiCapsuleData` recalculated only when dependencies change
2. **Animation Throttling**: Halo animation uses CSS transforms (GPU accelerated)
3. **Timer Efficiency**: Uses requestAnimationFrame for smooth progress
4. **Lazy Loading**: POI skin assets loaded on demand

### **Memory Management**

```typescript
// Cleanup on unmount
useEffect(() => {
  return () => {
    // Clear animation frames
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId);
    }
    // Reset POI state
    setPoiState(null);
  };
}, []);
```

---

## 🔮 **Future Enhancements**

### **Planned Features**

1. **Multiple POI Types**: Different activities with unique rewards
2. **Combo System**: Bonus rewards for specific resident combinations
3. **Upgrade System**: POI improvements for better rewards
4. **Achievement Tracking**: POI completion milestones
5. **Visual Effects**: Particle effects on collect

### **Extension Points**

```typescript
// Configurable reward system
interface PoiRewardConfig {
  baseReward: number;
  residentMultiplier: number;
  comboBonus: number;
  specialResidentBonus: Record<string, number>;
}

// Extensible animation system
interface PoiAnimationConfig {
  idleAnimation: string;
  activeAnimation: string;
  completedAnimation: string;
  collectAnimation: string;
}
```

---

## 📚 **Related Documentation**

- [Idle Village Plan](../idle_village_plan.md) - Overall system architecture
- [Minimal Gameplay Implementation](../minimal_gameplay_implementation_plan.md) - Core gameplay mechanics
- [Style Lab Integration](../../ui/idleVillage/skins/) - Visual design system
- [Drag & Drop System](../../ui/idleVillage/slots/) - Assignment mechanics

---

## 🔄 **Version History**

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | 2026-03-07 | Initial specification | AI Assistant |
| | | Added complete test coverage | |
| | | Defined reward calculation | |
| | | Documented animation states | |

---

## 🎯 **Acceptance Criteria**

### **Must Have**

- [ ] Timer starts only when residents assigned
- [ ] Halo animation syncs with timer state  
- [ ] Collect button appears only on completion with residents
- [ ] Reward calculation: 4 gold per resident
- [ ] All E2E tests pass
- [ ] Visual states match specifications

### **Should Have**

- [ ] Smooth animations and transitions
- [ ] Error handling for invalid assignments
- [ ] Performance optimization for multiple POI
- [ ] Accessibility compliance

### **Could Have**

- [ ] Combo bonus system
- [ ] Achievement integration
- [ ] Advanced visual effects
- [ ] Sound effects

---

## 📞 **Contact & Support**

**Primary Contact**: Idle Village Development Team  
**Documentation Issues**: Create GitHub issue with `poi-integration` label  
**Test Failures**: Check test logs in `test-results/` directory  
**Performance Issues**: Profile with React DevTools Profiler

---

*This document is the single source of truth for POI-Slot-PG integration. All implementations and tests should reference this specification.*
