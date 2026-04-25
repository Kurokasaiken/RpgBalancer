# Training Combo System - NP-215

**Date:** 2026-01-24  
**Agent:** Striker-Combo  
**Status:** ✅ COMPLETED  

## Executive Summary

Sistema combo per training con timing windows (perfect/good/miss), multiplier scaling (1.0x→2.5x), break conditions, e visual feedback con haptic integration.

## Overview

The Training Combo System provides:
- **3 Timing Windows** - Perfect, Good, Miss
- **Multiplier Scaling** - 1.0x to 2.5x with incremental growth
- **Break Conditions** - Miss breaks combo, timeout breaks combo
- **Visual Feedback** - ComboIndicator component with animations
- **Haptic Integration** - NP-212 haptic feedback support
- **Config-First Design** - Zod schema validation

## Timing Windows

### Perfect (150ms)
- **Window**: 0-150ms since last hit
- **Multiplier Bonus**: +0.2 additional increment
- **Visual**: Gold color with glow effect
- **Use Case**: Skilled players, maximum reward

### Good (400ms)
- **Window**: 151-400ms since last hit
- **Multiplier Bonus**: Standard increment
- **Visual**: Green color
- **Use Case**: Normal timing, consistent play

### Miss (>400ms)
- **Window**: >400ms or timeout
- **Effect**: Breaks combo (if enabled)
- **Visual**: Red color
- **Use Case**: Penalty for poor timing

## Multiplier Scaling

### Base Configuration
```typescript
{
  baseMultiplier: 1.0,
  maxMultiplier: 2.5,
  incrementPerHit: 0.1,
  perfectBonus: 0.2,
}
```

### Scaling Formula
```typescript
// Standard hit
multiplier = min(currentMultiplier + 0.1, 2.5)

// Perfect hit
multiplier = min(currentMultiplier + 0.1 + 0.2, 2.5)
```

### Progression Example
1. Hit 1 (Good): 1.0x → 1.1x
2. Hit 2 (Perfect): 1.1x → 1.4x (+0.3)
3. Hit 3 (Good): 1.4x → 1.5x
4. Hit 4 (Perfect): 1.5x → 1.8x (+0.3)
5. Hit 5 (Good): 1.8x → 1.9x
6. Hit 6 (Perfect): 1.9x → 2.2x (+0.3)
7. Hit 7 (Perfect): 2.2x → 2.5x (capped)

## Break Conditions

### Miss Breaks Combo
- **Enabled by default**: true
- **Effect**: Resets combo to 0, multiplier to 1.0x
- **Trigger**: Hit timing = 'miss'

### Timeout Breaks Combo
- **Enabled by default**: true
- **Timeout**: 3000ms (3 seconds)
- **Effect**: Resets combo if no hit within window
- **Trigger**: Time since last hit > maxComboTime

### Minimum Combo for Bonus
- **Default**: 3 hits
- **Effect**: Combo must reach this count for bonus eligibility
- **Use Case**: Prevents trivial combos from counting

## Configuration

### Default Config
```typescript
{
  timing: {
    perfectWindowMs: 150,
    goodWindowMs: 400,
    maxComboTime: 3000,
  },
  multiplier: {
    baseMultiplier: 1.0,
    maxMultiplier: 2.5,
    incrementPerHit: 0.1,
    perfectBonus: 0.2,
  },
  breakConditions: {
    missBreaksCombo: true,
    timeoutBreaksCombo: true,
    minComboForBonus: 3,
  },
  enableHaptics: true,
  enableVisualFeedback: true,
  enableSoundFeedback: true,
}
```

## Usage

### Basic Usage
```typescript
import { createComboSystem } from '@/ui/punchClub/systems/comboSystem';

const combo = createComboSystem();

// Register hit
const result = combo.registerHit(100);
console.log(result);
// {
//   timing: 'good',
//   multiplier: 1.1,
//   score: 110,
//   comboCount: 1,
//   comboBroken: false
// }

// Get state
const state = combo.getState();
console.log(state.currentCombo); // 1
console.log(state.currentMultiplier); // 1.1
```

### With React Component
```tsx
import { ComboIndicator } from '@/ui/punchClub/components/ComboIndicator';
import { createComboSystem } from '@/ui/punchClub/systems/comboSystem';

function TrainingSession() {
  const [combo, setCombo] = useState(() => createComboSystem());
  const [state, setState] = useState(combo.getState());

  const handleHit = () => {
    const result = combo.registerHit(100);
    setState(combo.getState());
  };

  return (
    <>
      <ComboIndicator
        comboCount={state.currentCombo}
        multiplier={state.currentMultiplier}
        maxCombo={state.maxCombo}
        isActive={state.isActive}
      />
      <button onClick={handleHit}>Hit</button>
    </>
  );
}
```

## ComboIndicator Component

### Features
- **Timing Feedback**: Shows PERFECT/GOOD/MISS with color coding
- **Combo Counter**: Displays current combo and max combo
- **Multiplier Display**: Shows current multiplier (when >1.0x)
- **Animations**: Pulse effects on hits, timing feedback fade
- **Responsive**: Fixed position, mobile-friendly

### Props
```typescript
interface ComboIndicatorProps {
  comboCount: number;
  multiplier: number;
  timing?: TimingWindow;
  maxCombo: number;
  isActive: boolean;
  onAnimationEnd?: () => void;
}
```

### Visual Design
```
┌─────────────────────────────────┐
│                       PERFECT!   │  ← Timing feedback (gold)
│                                 │
│  ┌───────────────────────────┐  │
│  │         COMBO             │  │
│  │           15              │  │  ← Combo counter
│  │        Max: 20            │  │
│  └───────────────────────────┘  │
│                                 │
│  ┌───────────────────────────┐  │
│  │      × 2.3                │  │  ← Multiplier display
│  └───────────────────────────┘  │
└─────────────────────────────────┘
```

## Combo System API

### Methods

#### registerHit(baseScore, hitTime?)
- **Params**: baseScore (number), hitTime (number, optional)
- **Returns**: ComboResult
- **Effect**: Registers a hit and updates combo state

#### reset()
- **Effect**: Resets combo to initial state
- **Use Case**: Start new training session

#### getState()
- **Returns**: Readonly<ComboState>
- **Effect**: Returns current combo state

#### getCurrentMultiplier()
- **Returns**: number
- **Effect**: Returns current multiplier value

#### getCurrentCombo()
- **Returns**: number
- **Effect**: Returns current combo count

#### getMaxCombo()
- **Returns**: number
- **Effect**: Returns maximum combo achieved

#### getTotalScore()
- **Returns**: number
- **Effect**: Returns total accumulated score

#### hasActiveCombo()
- **Returns**: boolean
- **Effect**: Returns true if combo is active and above minimum

#### updateConfig(config)
- **Params**: Partial<ComboConfig>
- **Effect**: Updates configuration dynamically

#### destroy()
- **Effect**: Cleans up timers and resources

## Haptic Integration (NP-212)

### Haptic Patterns
```typescript
// Perfect hit
haptic.trigger('impact', { intensity: 'heavy' });

// Good hit
haptic.trigger('impact', { intensity: 'medium' });

// Miss
haptic.trigger('impact', { intensity: 'light' });

// Combo broken
haptic.trigger('notification', { type: 'error' });
```

## Performance Optimization

### Memory Management
- Automatic timeout cleanup
- Limited hit history (last 100 hits)
- Efficient state updates

### Animation Performance
- CSS animations (GPU-accelerated)
- RequestAnimationFrame for smooth updates
- Conditional rendering (only when active)

## Best Practices

### 1. Timing Configuration
- **Beginner**: Wider windows (perfect: 200ms, good: 600ms)
- **Intermediate**: Default windows (perfect: 150ms, good: 400ms)
- **Expert**: Tighter windows (perfect: 100ms, good: 300ms)

### 2. Multiplier Tuning
- **Casual**: Lower max (1.5x-2.0x)
- **Competitive**: Higher max (2.5x-3.0x)
- **Speedrun**: Very high max (3.0x-5.0x)

### 3. Break Conditions
- **Forgiving**: missBreaksCombo = false
- **Standard**: Both enabled
- **Hardcore**: Lower timeout (2000ms)

## Troubleshooting

### Issue: Combo Breaking Too Easily

**Solution**: Adjust timing windows or break conditions
```typescript
combo.updateConfig({
  timing: {
    perfectWindowMs: 200,
    goodWindowMs: 500,
    maxComboTime: 4000,
  },
  breakConditions: {
    missBreaksCombo: false,
  },
});
```

### Issue: Multiplier Not Increasing

**Solution**: Check increment and max values
```typescript
combo.updateConfig({
  multiplier: {
    incrementPerHit: 0.15,
    maxMultiplier: 3.0,
  },
});
```

## Future Enhancements

- [ ] Combo chains (different combo types)
- [ ] Combo challenges (reach X combo)
- [ ] Combo leaderboards
- [ ] Combo replays
- [ ] Advanced timing analysis
- [ ] Combo sound effects
- [ ] Combo particle effects

## Resources

### Internal Documentation
- `src/ui/punchClub/config/comboConfig.ts` - Configuration
- `src/ui/punchClub/systems/comboSystem.ts` - Core system
- `src/ui/punchClub/components/ComboIndicator.tsx` - UI component

### Related Documentation
- NP-212 Haptic Feedback System
- PC-M3 Training System

## Conclusion

The Training Combo System provides engaging gameplay mechanics with precise timing windows, rewarding multiplier scaling, and clear visual feedback. Config-first design enables easy tuning for different skill levels and game modes.

---

**Last Updated:** 2026-01-24  
**Next Review:** 2026-04-24  
**Maintainer:** Striker-Combo (Cascade AI)
