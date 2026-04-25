# SlottedMedal Implementation Plan
## Integration of HTML Demo into React Architecture

### Overview
Implement the complete SlottedMedal behavior from the HTML demo into our React architecture using dnd-kit + Framer Motion separation pattern.

---

## 📋 **IMPLEMENTATION PLAN**

### Phase 0: Baseline Capture (NP-SM-004) ✅ COMPLETE
- [x] Capture baseline artifacts at commit `39016dd`
  - Valid/invalid drag screenshots
  - Day/Night + ClockWidget + ActiveHUD strip
  - POI capsule idle/active states
  - Full page screenshot
- [x] Run safeguards: lint, test, build:check, kanban:lint
- [x] Document baseline in `docs/CAPSULE_TEST_INTEGRATION.md`
- [x] Evidence log: `test-results/slotted-medal-phase0-baseline.log`
- [x] Baseline artifacts: `test-results/baseline-2026-03-01/`

**Baseline Reference:** See `docs/CAPSULE_TEST_INTEGRATION.md#1-baseline-39016dd` for artifact paths and safeguard results.

### Phase 1: Core Component Architecture
- [x] `useSlottedMedalBehavior.ts` - State machine + animation controls
- [x] `useSlotSounds.ts` - Web Audio API synthetic sounds  
- [x] `SlottedMedal.tsx` - Main React component
- [x] `ResidentSlotRack.tsx` - Integration into DetailSlot

### Phase 2: Visual Perfection (using demo as reference)
- [ ] Refine Framer Motion animations to match demo exactly
- [ ] Implement magnetic pull effect with dragElastic
- [ ] Add completion animations and reward collection
- [ ] Perfect visual depth (idle vs active states)

### Phase 3: Testing & Polish
- [ ] RTL tests for medal behavior
- [ ] E2e tests for drag-drop-detach workflow
- [ ] Performance optimization
- [ ] Accessibility improvements

---

## 🎨 **DEMO REFERENCE CODE**

### HTML Structure (from demo)
```html
<div class="slot-cavity" id="slot-cavity">
  <div class="slot-empty-hint" id="empty-hint">
    <!-- Empty slot indicator -->
  </div>
  
  <div class="medal-wrap idle" id="medal-wrap" style="display:none">
    <canvas id="halo-canvas" width="76" height="76"></canvas>
    <div id="medal-svg-wrap"></div>
    <div class="resist-ring" id="resist-ring"></div>
    <div class="lock-badge" id="lock-badge">
      <!-- Lock icon SVG -->
    </div>
  </div>
</div>
```

### State Machine (from demo)
```javascript
const SM_STATES = {
  empty:      {label:'Empty',      desc:'Slot libero'},
  landing:    {label:'Landing',    desc:'Spring snap'},
  idle:       {label:'Idle',       desc:'Assegnato · rimovibile'},
  active:     {label:'Active',     desc:'In corso · bloccato'},
  completing: {label:'Completing', desc:'Flash finale'},
  done:       {label:'Done',       desc:'Completato'},
};

let state='empty', progress=0, soundEnabled=true;
let holdTimer=null, holdRaf=null, holdStart=0;
let idleHaloFill=0, idleHaloRaf=null;
const HOLD_MS=600;
```

### Audio System (from demo)
```javascript
// Web Audio API synthetic sounds
function osc(ctx,{freq,type='sine',gain,atk,dec,sf,ef},when=0){
  const t=ctx.currentTime+when,o=ctx.createOscillator(),g=ctx.createGain();
  o.type=type;o.frequency.setValueAtTime(sf??freq,t);
  if(ef!=null)o.frequency.exponentialRampToValueAtTime(Math.max(1,ef),t+dec);
  g.gain.setValueAtTime(.001,t);g.gain.linearRampToValueAtTime(gain,t+atk);
  g.gain.exponentialRampToValueAtTime(.001,t+atk+dec);
  o.connect(g);g.connect(ctx.destination);o.start(t);o.stop(t+atk+dec+.05);
}

const SND={
  clank(){if(!soundEnabled)return;const c=getCtx();resume(c).then(()=>{noise(c,.50,.055,1900);osc(c,{freq:220,type:'triangle',gain:.32,atk:.002,dec:.18,sf:290,ef:175});osc(c,{freq:680,gain:.10,atk:.001,dec:.07})})},
  reject(){if(!soundEnabled)return;const c=getCtx();resume(c).then(()=>{osc(c,{freq:80,gain:.42,atk:.003,dec:.22,sf:115,ef:52});noise(c,.28,.10,185)})},
  detach(){if(!soundEnabled)return;const c=getCtx();resume(c).then(()=>{osc(c,{freq:400,gain:.26,atk:.001,dec:.08,sf:530,ef:270});noise(c,.12,.04,3400)})},
  complete(){if(!soundEnabled)return;const c=getCtx();resume(c).then(()=>[{f:330,d:0},{f:440,d:.12},{f:660,d:.24}].forEach(({f,d})=>osc(c,{freq:f,gain:.20,atk:.005,dec:.55},d));noise(c,.07,.12,6200,.24)})},
  resist(){if(!soundEnabled)return;const c=getCtx();resume(c).then(()=>osc(c,{freq:1300,gain:.08,atk:.001,dec:.022}))},
};
```

### Halo Canvas (from demo)
```javascript
function drawHalo(overrideFill){
  const ctx=haloC.getContext('2d'),dpr=window.devicePixelRatio||1,sz=76;
  const isIdle=state==='idle',isActive=state==='active',isDone=state==='done'||state==='completing';
  if(state==='empty'||state==='landing')return;
  const cx=sz/2,cy=sz/2;
  
  // Track thickness difference between states
  const trackW=isActive?Math.max(5.5,sz*.092):Math.max(2.8,sz*.040);
  const r=sz/2-1-trackW/2;
  
  // Different rendering for each state
  let fill,cw,c1,c2,dashed;
  if(isIdle){fill=overrideFill??idleHaloFill;cw=false;dashed=true;c1='rgba(128,88,12,.58)';c2='rgba(192,138,30,.76)'}
  else if(isActive){fill=Math.max(0,Math.min(1,progress));cw=true;dashed=false;c1='rgba(212,150,15,.92)';c2='rgba(255,222,78,1.00)'}
  else if(isDone){fill=1;cw=true;dashed=false;c1='rgba(38,178,65,.84)';c2='rgba(78,232,112,.96)'}
  
  // Draw arc with proper styling
  const sa=-Math.PI/2,sw=fill*Math.PI*2,ea=cw?sa+sw:sa-sw;
  if(dashed){ctx.setLineDash([r*.20,r*.11])}
  // ... rest of drawing logic
}
```

### Animations (from demo)
```css
/* Spring snap animation */
@keyframes medal-spring{
  0%{transform:scale(.78) translateY(-12px) rotate(4deg)}
  30%{transform:scale(1.10) translateY(3px) rotate(-1.5deg)}
  55%{transform:scale(.96) translateY(-1px) rotate(.6deg)}
  75%{transform:scale(1.03) translateY(0) rotate(0)}
  100%{transform:scale(1.00) translateY(0) rotate(0)}
}

/* Clank impact */
@keyframes medal-clank{
  0%{transform:scale(1.06) translateY(0) rotate(0)}
  15%{transform:scale(1.04) translateY(0) translateX(-3.5px) rotate(-1.8deg)}
  32%{transform:scale(1.02) translateY(0) translateX(3.5px) rotate(1.2deg)}
  52%{transform:scale(1.01) translateY(0) translateX(-2px) rotate(-.6deg)}
  72%{transform:scale(1.00) translateY(0) translateX(1.2px) rotate(.3deg)}
  100%{transform:scale(1.00) translateY(0) translateX(0) rotate(0)}
}

/* Detach animation */
@keyframes medal-detach{
  0%{transform:scale(.90) translateY(3px)}
  40%{transform:scale(1.12) translateY(-16px)}
  72%{transform:scale(.97) translateY(-10px)}
  100%{transform:scale(1.00) translateY(0)}
}

/* Visual depth states */
.medal-wrap.idle{filter:drop-shadow(0 6px 14px rgba(0,0,0,.68)) drop-shadow(0 2px 4px rgba(0,0,0,.48));transform:scale(1.00) translateY(0px);cursor:grab}
.medal-wrap.active{filter:drop-shadow(0 1px 3px rgba(0,0,0,.42));transform:scale(0.90) translateY(3px);cursor:not-allowed}
.medal-wrap.done{filter:drop-shadow(0 0 18px rgba(50,200,80,.68)) drop-shadow(0 4px 10px rgba(0,0,0,.48));transform:scale(1.00) translateY(0px);cursor:grab}
```

### Hold/Resist System (from demo)
```javascript
function startHold(){
  if(state!=='idle')return;holdStart=performance.now();let lastTick=holdStart;
  function step(ts){
    const pct=Math.min(1,(ts-holdStart)/HOLD_MS);
    resistR.style.borderColor=`rgba(200,50,30,${(.22+pct*.65).toFixed(2)})`;
    mWrap.style.transform=`scale(1.00) translateY(${-pct*6}px)`;
    if(ts-lastTick>140){SND.resist();lastTick=ts}
    // Redraw halo with resist overlay
    drawHalo(idleHaloFill);
    // Add red arc overlay
    if(pct<1)holdRaf=requestAnimationFrame(step);else doDetach();
  }
  holdRaf=requestAnimationFrame(step);holdTimer=setTimeout(doDetach,HOLD_MS+20);
}

function doDetach(){
  clearHold();if(state!=='idle')return;SND.detach();log('⇡ Distacco');
  animMedal('medal-detach',270);doReset()
}
```

---

## 🔄 **REACT MIGRATION STRATEGY**

### 1. State Machine → useSlottedMedalBehavior
```typescript
// Convert demo state machine to React hook
export type MedalSlotState = 'empty' | 'landing' | 'idle' | 'active' | 'completing' | 'done';

export function useSlottedMedalBehavior({
  onDetach,
  soundsEnabled = true,
  holdDurationMs = 600,
}: UseSlottedMedalBehaviorOptions = {}): SlottedMedalBehavior {
  const [slotState, setSlotState] = useState<MedalSlotState>('empty');
  const [isResisting, setIsResisting] = useState(false);
  const [resistProgress, setResistProgress] = useState(0);
  
  // ... rest of hook implementation using demo logic
}
```

### 2. Audio System → useSlotSounds
```typescript
// Convert demo SND object to React hook
export function useSlotSounds(enabled = true): SlotSounds {
  const play = useCallback((synth: (ctx: AudioContext) => void) => {
    if (!enabledRef.current) return;
    const ctx = getCtx();
    if (!ctx) return;
    void ensureResumed(ctx).then(() => synth(ctx));
  }, []);

  return {
    playClank:    useCallback(() => play(synthClank),    [play]),
    playReject:   useCallback(() => play(synthReject),   [play]),
    playDetach:   useCallback(() => play(synthDetach),   [play]),
    playComplete: useCallback(() => play(synthComplete), [play]),
    playResist:   useCallback(() => play(synthResist),   [play]),
  };
}
```

### 3. Halo Canvas → React Component
```typescript
// Convert demo drawHalo function to React component
const HaloCanvas: React.FC<{
  sizePx: number;
  slotState: MedalSlotState;
  progressFraction: number;
  isResisting: boolean;
  resistProgress: number;
}> = ({ sizePx, slotState, progressFraction, isResisting, resistProgress }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const draw = useCallback((overrideFill?: number) => {
    // Direct port of demo drawHalo function
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    // ... exact demo drawing logic
  }, [sizePx, slotState, progressFraction, isResisting, resistProgress]);
  
  // ... React lifecycle management
};
```

### 4. Animations → Framer Motion
```typescript
// Convert CSS animations to Framer Motion
const onDrop = useCallback(() => {
  // Spring snap animation (medal-spring)
  void animateMedal(
    medalScope.current,
    {
      scale:  [0.85, 1.06, 0.97, 1.02, 1.00],
      y:      [-8, 0],
      rotate: [2, -1, 0.5, 0],
    },
    {
      duration:  0.28,  // matches demo SPRING_DURATION
      ease:      [0.22, 1.2, 0.36, 1],  // matches demo spring
    }
  );
  
  // Clank impact (medal-clank)
  setTimeout(() => {
    void animateMedal(
      medalScope.current,
      { x: [0, -3, 3, -2, 2, -1, 0] },
      { duration: 0.22, ease: 'easeOut' }
    );
    sounds.playClank();
  }, 200);  // matches demo CLANK_DELAY_MS
}, [animateMedal, sounds]);
```

### 5. Visual Depth → CSS-in-JS
```typescript
// Convert demo visual depth to React styles
const filterStyle = (() => {
  if (isIdle)    return 'drop-shadow(0 6px 14px rgba(0,0,0,.68)) drop-shadow(0 2px 4px rgba(0,0,0,.48))';
  if (isLocked)  return 'drop-shadow(0 1px 3px rgba(0,0,0,.42))';
  if (slotState === 'done' || slotState === 'completing')
                 return 'drop-shadow(0 0 18px rgba(50,200,80,.68)) drop-shadow(0 4px 10px rgba(0,0,0,.48))';
  return 'none';
})();

// Transform states
const transformStyle = {
  idle: 'scale(1.00) translateY(0px)',
  active: 'scale(0.90) translateY(3px)',
  done: 'scale(1.00) translateY(0px)',
};
```

---

## 🎯 **INTEGRATION CHECKLIST**

### Visual Fidelity
- [ ] Halo thickness matches demo (idle: 2.8px, active: 5.5px)
- [ ] Arc directions correct (idle: CCW, active: CW)
- [ ] Color gradients match demo exactly
- [ ] Drop shadows match visual depth
- [ ] Spring animation timing matches demo

### Audio Fidelity  
- [ ] Same frequencies as demo (clank: 220Hz, reject: 80Hz, etc.)
- [ ] Same envelope timing (attack, decay)
- [ ] Same noise filtering parameters
- [ ] Same resist tick timing (150ms intervals)

### Interaction Fidelity
- [ ] Hold duration exactly 600ms
- [ ] Resist ring color progression matches demo
- [ ] Detach animation matches demo curve
- [ ] Lock badge appears at correct timing

### State Machine Fidelity
- [ ] All 6 states implemented
- [ ] Transitions match demo timing
- [ ] Progress tracking works
- [ ] Error handling matches demo

---

## 📁 **FILE STRUCTURE**

```
src/ui/idleVillage/
├── components/
│   ├── SlottedMedal.tsx              # Main component (medal-wrap + halo + SVG)
│   └── ResidentSlotRack.tsx          # Integration point
├── hooks/
│   ├── useSlottedMedalBehavior.ts    # State machine + animations
│   └── useSlotSounds.ts              # Audio system
└── styles/
    └── slotted-medal.css             # Visual depth styles (if needed)
```

---

## 🧪 **TESTING STRATEGY**

### Unit Tests
```typescript
// Test state machine transitions
test('empty → landing → idle transition', async () => {
  const { result } = renderHook(() => useSlottedMedalBehavior());
  act(() => result.current.onDrop());
  expect(result.current.slotState).toBe('landing');
  await waitFor(() => expect(result.current.slotState).toBe('idle'));
});

// Test hold resistance
test('hold 600ms triggers detach', async () => {
  const onDetach = jest.fn();
  const { result } = renderHook(() => useSlottedMedalBehavior({ onDetach }));
  
  act(() => result.current.onHoldStart());
  expect(result.current.isResisting).toBe(true);
  
  act(() => {
    jest.advanceTimersByTime(600);
  });
  
  expect(onDetach).toHaveBeenCalled();
  expect(result.current.slotState).toBe('empty');
});
```

### Visual Tests
```typescript
// Test halo rendering
test('halo renders correctly in idle state', () => {
  render(<HaloCanvas sizePx={76} slotState="idle" progressFraction={0} isResisting={false} resistProgress={0} />);
  const canvas = screen.getByRole('img'); // canvas gets img role
  expect(canvas).toBeInTheDocument();
  // Verify canvas content using canvas testing library
});
```

---

## 🚀 **NEXT STEPS**

1. **Immediate**: Refine Framer Motion animations to match demo exactly
2. **Short-term**: Add magnetic pull effect with dragElastic  
3. **Medium-term**: Implement completion animations and reward collection
4. **Long-term**: Add comprehensive test coverage and performance optimization

---

## 📊 **SUCCESS METRICS**

- ✅ Visual fidelity: 100% match to demo
- ✅ Audio fidelity: Identical frequencies and timing
- ✅ Performance: < 16ms frame time
- ✅ Accessibility: Full keyboard navigation
- ✅ Test coverage: > 90%

This implementation plan provides a complete roadmap to integrate the HTML demo's perfect behavior into our React architecture while maintaining the dnd-kit + Framer Motion separation pattern.

---

### Phase 4: Failed State Implementation ✅ COMPLETED

**Status:** ✅ Implemented (2026-03-01)

**Overview:** Extended the SlottedMedal system with comprehensive failure state handling for Idle Village activities.

**New Features Added:**
- **Failed State Type:** Added `'failed'` to `MedalState` enum
- **Failure Classification:** `ActivityFailureType` for injury/death/mission_failure
- **State Mapping Utility:** `resolveSlotState()` for engine→UI state conversion
- **Failed Animation:** Shake + fade sequence with configurable timing
- **Failure Sounds:** Type-specific audio feedback using existing synth system
- **Telemetry Events:** `slot_activity_failed` with complete payload

**Component Enhancements:**
- **useSlottedMedalBehavior:** Added `handleFailed()` method
- **SlottedMedal:** Added `forwardRef` support for external control
- **ResidentSlotRack:** Added `getSlotActivityState` prop integration
- **DetailSlot:** Added activity state monitoring and failed state triggering

**Files Modified:**
- `src/ui/idleVillage/slots/types.ts` - Extended type definitions
- `src/ui/idleVillage/utils/slotStateMapping.ts` - New state mapping utility
- `src/ui/idleVillage/hooks/useSlottedMedalBehavior.ts` - Failed state behavior
- `src/ui/idleVillage/components/SlottedMedal.tsx` - Ref support implementation
- `src/ui/idleVillage/components/ResidentSlotRack.tsx` - Activity state integration

**Documentation:** Complete implementation guide available at `docs/SLOTTED_MEDAL_FAILED_STATE_IMPLEMENTATION.md`
