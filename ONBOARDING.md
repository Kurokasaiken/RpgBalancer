# DestinyAstrolabe — Goo-Expand + TIRA Action-Trigger (Session 2)

## Overview
Native React component (canvas-driven, no iframe) that replaces the D100 skill-check system with cinematic ball physics, per-axis geometry (white obelisks = player stats, black obelisks = difficulty), and a central "goo" failure field.

**Latest commit**: `192d595c` — goo-expand springy + TIRA action-trigger gate  
**Status**: Fully functional end-to-end (reveal → goo errupt → button arms → spin on click)

---

## Current State Machine
```
idle → ring-lock → threat-slam → goo-expand [ARMED] → agency-burst → risk-pour
  → action-trigger [WAITING_FOR_INPUT, HOLD] → the-spin → magnetic-snap → resolution
```

### Phase Details
- **threat-slam**: Black obelisks slam down, goo *seeds* (14% opacity, small core only)
- **goo-expand** (NEW, 620ms): Goo *erupts* with `easeOutBack` overshoot (cubic-bezier(0.34,1.56,0.64,1) equiv on canvas), arms the TIRA button
- **agency-burst**: White obelisks erupt, flower unfolds
- **risk-pour**: Wound/Death streams (crimson/purple) pour in, proportional to goo depth
- **action-trigger** (NEW, GATE): Holds. TIRA button visible, pulsing. No auto-advance.
  - Click TIRA → `throwBall()` → snap reveals, warp flash, fire ball
  - Auto-Tiro (if enabled) → auto-throw 0.5s after arming
- **the-spin**: Ball chaotic + magnetic steering
- **magnetic-snap**: Ball converges to target
- **resolution**: Verdict revealed

---

## Key Implementation Details

### Canvas (public/destiny-astrolabe.html + generated engine.ts)
- **Goo breathing** (visual-only): `gooEdgeAt` = static rCheckAt × time-based wobble (surface tension)
  - Ball physics use static rCheckAt, so wobble never shoves the ball
  - Morph in `drawStream`'s radAt (angle-dependent), `gooBlob` (lobes), and `gooEdgeAt` (temporal)
- **Color palette** (researched):
  - Ferita (Wounded): Crimson `#d62034` (body), `#ff969f` (filaments)
  - Morte (Death): Amethyst `#782696` (body), `#d6aaff` (filaments)
  - Critical band: Outer edge of goo (thickness ∝ crit%)
- **Obelisks**: Slender (bw=13.5, tw=5.5, h=112), pyramidion cap, emissive socket at base, aura on tip
- **State machine**: `scene.state` (string), `emitState(s)` hooks React via `onState` callback
- **Armed gate**: `armed` flag, `emitArmed(bool)` signals TIRA visibility to React

### React Overlay (DestinyAstrolabe.tsx + astrolabe-ui.css)
- **TIRA button** (`.da-tira`):
  - Absolute-positioned at canvas center (left:50%, top:50%, translate-based)
  - V8 material (`.wanderlust-artifact`): bronze radial gradient, inset shadows
  - CSS pulse: box-shadow glow (emerald 16x-185-129 halo), 1.5s infinite
  - `:active` scale(0.93) haptic feedback
  - Click → flash (::after pseudo, 0.26s radial scale) + `engine.throw()`
- **Auto-Tiro toggle** (`.da-autotiro`):
  - Bottom-right corner, unobtrusive (opacity 0.8, font 11px)
  - Triggers `setTimeout(() => doThrow(), 500)` when armed
  - Note: "Auto-throw uses base stats, no precision bonus"
- **Animations**: Transform + box-shadow + opacity only (no layout jitter, GPU-composited)
- **Accessibility**: Respects `prefers-reduced-motion: reduce`

### Engine Handle & Callbacks
```typescript
// public/destiny-astrolabe.html exports factory:
export function createDestinyAstrolabeEngine(
  root: HTMLElement,
  opts: {
    skills: AstrolabeSkill[];
    config?: AstrolabeConfig;
    onResolve?: (r: AstrolabeResult) => void;
    onState?: (state: string) => void;           // NEW: state machine notifications
    onArmed?: (armed: boolean) => void;          // NEW: TIRA visibility signal
  }
): {
  roll: () => void;        // play reveal, hold at action-trigger
  throw: () => void;       // NEW: start spin (TIRA)
  setConfig: (...) => void;
  destroy: () => void;
}
```

---

## Test Page (src/pages/minimal-destiny-astrolabe.tsx)
- Skill editor table (1–5 skills, editable name/stat/difficulty)
- Risk controls (crit%, wound%, death%, force verdict)
- Live result display (verdict, tested skill, D100 roll, risk roll, status)
- Auto-preview the component with controlled inputs

---

## Files Changed (Session 2)
| File | Changes |
|------|---------|
| `public/destiny-astrolabe.html` | threat-slam seed + new goo-expand state, gooEdgeAt breathing, throwBall(), emitState/emitArmed, armed/scene.warp logic |
| `scripts/astrolabe/gen-engine.mjs` | Interface tweaks (onState, onArmed, throw in handle) |
| `src/ui/idleVillage/components/destinyAstrolabe/engine.ts` | REGENERATED (contains throwBall, goo-expand logic) |
| `src/ui/idleVillage/components/destinyAstrolabe/DestinyAstrolabe.tsx` | React state (armed, flash, autoTiro), doThrow callback, wrapper div, TIRA/Auto-Tiro overlays, useEffect for auto-throw |
| `src/ui/idleVillage/components/destinyAstrolabe/astrolabe-ui.css` | NEW: .da-tira (pulse + flash), .da-autotiro (toggle), animations (transform/box-shadow only) |

---

## Verification Checklist
- ✅ goo-expand (springy overshoot) plays 620ms after threat-slam
- ✅ TIRA button appears when armed (rendered over canvas, z-index:5)
- ✅ Action-trigger gate HOLDS (spin doesn't auto-start)
- ✅ Click TIRA → engine.throw() → warp + spin
- ✅ Auto-Tiro toggle auto-throws 0.5s after arming
- ✅ No console errors, TypeScript clean
- ✅ End-to-end flow: reveal → TIRA → spin → resolution

---

## Known Behavior
- **Standalone HTML** (public/destiny-astrolabe.html): Click "Launch" → "TIRA" once armed (space/click both trigger). Useful for testing the engine in isolation.
- **React component** (test page): TIRA appears centered over canvas, Auto-Tiro checkbox in bottom-right, everything event-driven.
- **Preview throttling**: Canvas RAF is throttled in preview; state machine verified with hijacked `performance.now()` step-loop.

---

## Next Steps (If Continuing)
1. **Polish**: Fine-tune goo breathing frequency/amplitude, TIRA pulse timing, flash intensity
2. **Accessibility**: Keyboard trigger for TIRA (Enter, Space, A-key?), focus states
3. **Mobile**: Touch feedback, responsive button sizing
4. **Telemetry**: Log state transitions, throw latency (useful for analytics)
5. **Additional visual feedback**: Warp "zoom" effect when skipping, shockwave on throw
6. **Extended config**: Expose goo breathing params, pulse speed, etc.

---

## Branch / Commit History (Relevant)
- `90e8cc02`: blob goo edge, proportional risk rivers, researched colors, finer obelisks
- `192d595c`: goo-expand springy + TIRA action-trigger gate ← **LATEST**

---

## Quick Dev Workflow
```bash
cd /Users/faustoboni/progetti_personali/RPG
npm run dev                    # Start preview at localhost:5173
# Test page: http://localhost:5173/minimal-destiny-astrolabe
# Edit public/destiny-astrolabe.html (source of truth)
# Run: node scripts/astrolabe/gen-engine.mjs  (regen engine.ts)
# Reload preview (HMR will pick up changes)
```

---

**Session recorded**: This conversation is the official record. Check `/Users/faustoboni/.claude/projects/-Users-faustoboni-progetti-personali-RPG/79a48972-25e4-4352-94a5-d5f96f985bd7.jsonl` for full context.
