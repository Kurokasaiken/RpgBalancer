# World Surface V3: Hierarchical Perception System

**Status:** Draft  
**Version:** 3.0 (ChatGPT-Reviewed)  
**Last Updated:** 2026-07-22  
**Strategist:** Cascade  

---

## Executive Summary

The World Surface is a **5-layer perception hierarchy**, not a continuous animation system. The map must be **80% calm, 15% communicative, 5% surprising**. Events are **gameplay-driven presages**, not ambient decorations. Rarity creates memory; frequency creates noise.

---

## Design Philosophy

### The Core Principle: Quietness as Strength

A map that constantly animates becomes invisible. The brain filters it out.

A map that occasionally whispers becomes memorable.

**Idle Village's World Surface should:**
- Be **immediately readable** (terrain, cities, resources)
- **Breathe subtly** (clouds, fog, water movement)
- **Communicate via parallax** (depth without distraction)
- **Signal events through anticipation** (presages before crises)
- **Surprise rarely** (wonders that feel like discoveries, not animations)

---

## 5-Layer Perception Hierarchy

### Layer 1: The World (Always Readable)

**Purpose:** Convey game state and strategic information.

**Elements:**
- Terrain (grass, mountains, desert, tundra)
- Forests and vegetation
- Rivers and water bodies
- Cities and settlements
- Roads and trade routes
- Resource nodes (mines, farms, mills)

**Animation:** None. Static or extremely slow (geological timescale).

**Rule:** If the player consciously notices movement, it's too fast.

**Technical:** Base layer, 1.0x parallax, no animation loop.

---

### Layer 2: The Breath (Unconscious Life)

**Purpose:** Give the world life without demanding attention.

**Elements:**
- Clouds (slow drift, 0.3–0.5 opacity)
- Fog and mist (regional, density-based)
- Water surface (gentle ripples, caustics)
- Tree canopy sway (±2–3 pixels, 4–6 second cycle)
- Mountain mist (altitude-based, slow rise/fall)
- Dust devils (rare, desert-only, 30–60 second intervals)

**Animation Rules:**
- Cycle time: 4–8 seconds minimum
- Amplitude: ±2–4 pixels max
- Opacity change: ±10–15% max
- Easing: ease-in-out (never linear)

**Perception Test:** If player says "the forest is breathing," it's perfect. If they say "the forest is oscillating," it's too obvious.

**Technical:** Separate layer group, sine/cosine-based animation, no event-driven changes.

---

### Layer 3: The Depth (Parallax Hierarchy)

**Purpose:** Create visual depth without tilting the camera.

**Camera-Relative Parallax Multipliers:**

```
CAMERA
   ↓
Clouds              1.20x  (moves fastest, farthest away)
Atmosphere          1.10x
Frame (UI border)   1.02x  (almost anchored)
─────────────────────────
WORLD MAP           1.00x  (reference point)
─────────────────────────
Water depth         0.90x  (moves slower, closer to camera)
Underwater          0.75x  (moves much slower, very close)
```

**Key Insight:** The frame is an **anchor**, not a window. The world moves under it, creating the sensation: *"I'm looking at a world inside an object."*

**Implementation:**
- On mouse move, calculate offset from center
- Apply parallax multiplier to each layer
- Clamp movement to prevent excessive displacement
- Transition smoothly (0.3–0.5s easing)

**Rule:** Frame movement should be **barely perceptible**. Player should feel the depth, not see the frame sliding.

**Technical:** CSS transforms or canvas-based parallax, mouse event listener, requestAnimationFrame for smooth updates.

---

### Layer 4: Events (Attention Breakers)

**Purpose:** Break the quietness with meaningful information.

**Event Types:**

| Event | Duration | Scope | Visual |
|-------|----------|-------|--------|
| Goblin Invasion | 2–4 hours | 1 region | Fire, smoke, red glow |
| Plague | 4–8 hours | 1–2 regions | Gray mist, wilting |
| Storm | 30–60 min | 1 region | Dark clouds, rain |
| Festival | 1–2 hours | 1 city | Banners, lights, crowds |
| Fire | 1–3 hours | 1 location | Flames, smoke, embers |
| Discovery | 30 min | 1 POI | Golden glow, sparkles |

**Event Lifecycle: 4-Phase Presage System**

#### Phase 1: Presage (5–15 minutes before event)

**Goal:** Hint that something is coming.

**Visuals:**
- Distant smoke (barely visible)
- Birds fleeing (small flock animation)
- Merchants changing direction (path adjustment)
- Distant sound (audio cue, optional)
- Color shift in sky (subtle tint)

**Player Experience:** "Something's happening over there..."

**Technical:** Subtle particle effects, path adjustments, color overlay (low opacity).

---

#### Phase 2: Threat (1–5 minutes before event)

**Goal:** Make the threat clear and localized.

**Visuals:**
- Smoke becomes visible (higher opacity, larger area)
- Fire glow appears on horizon
- Creature silhouettes visible
- Merchants fleeing toward safety
- Alarm bells (audio)

**Player Experience:** "That's definitely a problem."

**Technical:** Increased particle density, animated glow, audio event.

---

#### Phase 3: Event (Active)

**Goal:** Full manifestation, localized to one region.

**Visuals:**
- Full animation (fire, creatures, chaos)
- Region becomes "damaged" (visual overlay, desaturated)
- NPCs in panic/defense state
- Gameplay consequences (resource loss, quest generation)

**Player Experience:** "I need to respond to this."

**Technical:** Full animation suite, region state change, quest trigger.

---

#### Phase 4: Consequence (1–4 hours after)

**Goal:** Show lasting impact.

**Visuals:**
- Burned forest (charred texture, no trees)
- Plague-stricken village (gray, quiet)
- Festival aftermath (banners torn, crowds gone)
- Reconstruction (workers, scaffolding)

**Player Experience:** "The world changed because of that event."

**Technical:** Permanent region state change, recovery animation over time.

---

**Event Frequency Rules:**

- **Rare events** (dragon, kraken, meteorite): 1 per 10–30 minutes
- **Common events** (storm, goblin raid): 1 per 5–10 minutes
- **Constant events** (festivals, discoveries): 1 per 2–5 minutes

**Spatial Rule:** Only 1–2 events active simultaneously. If 3+ events are visible, the map becomes chaotic.

**Technical:** Event queue system, cooldown timers, spatial conflict resolution.

---

### Layer 5: Wonders (Rare Moments)

**Purpose:** Create memorable discoveries, not ambient animations.

**Wonder Types:**

| Wonder | Rarity | Scope | Visual | Duration |
|--------|--------|-------|--------|----------|
| Kraken | 1 per 15 min | Underwater | Giant shadow, tentacles | 3–5 sec |
| Whale | 1 per 20 min | Ocean surface | Breach, water spray | 2–3 sec |
| Dragon | 1 per 30 min | Sky | Silhouette, shadow | 5–10 sec |
| Meteor | 1 per 25 min | Sky | Streak, impact glow | 2–4 sec |
| Aurora | 1 per 40 min | Sky (north) | Color bands, shimmer | 10–20 sec |
| Ghost Ship | 1 per 35 min | Ocean | Translucent hull, lights | 5–8 sec |
| Massive Storm | 1 per 45 min | Sky | Lightning, dark clouds | 8–15 sec |
| Flock of Birds | 1 per 10 min | Sky | V-formation, shadow | 3–5 sec |

**Implementation Rules:**

1. **Wonders are not always visible.** Player may miss them entirely.
2. **Wonders appear in random locations** (within biome constraints).
3. **Wonders have no gameplay impact** (they're pure wonder).
4. **Wonders are brief** (2–20 seconds max).
5. **Wonders are silent or have subtle audio** (no dramatic music).

**The Kraken Example:**

❌ **Bad:** Kraken always visible under water, constantly moving.
- Player: "Oh, the Kraken animation again."
- Becomes: ambient decoration.

✅ **Good:** Kraken appears once every 15 minutes, in a random ocean tile, for 3–5 seconds.
- Player sees a giant shadow pass under the water.
- Player: "Wait... did I just see something?"
- Becomes: a memory, a story to tell.

**Technical:**
- Rare event system (separate from gameplay events)
- RNG-based spawn (seeded for determinism in replays)
- Short animation sequences (3–20 frame loops)
- Optional telemetry (wonder_spotted event)

---

## The Underwater Depth System

**Concept:** The sea is a separate world, with its own hierarchy.

```
SEA SURFACE
    ↓
Caustics (light refraction)
    ↓
Depth (color shift, darkness)
    ↓
Underwater Silhouettes (rocks, plants, ruins)
    ↓
Rare Events (kraken, whale, ghost ship)
```

**Implementation:**

### Surface Layer
- Ripples (gentle, constant)
- Foam (where water meets land)
- Reflection of sky (subtle)

### Caustic Layer
- Light patterns (moving, 0.5–1.0 opacity)
- Refraction effect (optional, expensive)
- Depth-based color shift (blue → dark blue → black)

### Depth Layer
- Underwater terrain (rocks, coral, ruins)
- Seaweed (swaying, 4–6 second cycle)
- Bioluminescence (rare, glowing creatures)

### Rare Events
- Kraken shadow (once per 15 min, 3–5 sec)
- Whale breach (once per 20 min, 2–3 sec)
- Ghost ship (once per 35 min, 5–8 sec)
- Sunken ruins (static, discoverable)

**Visual Design:**

```
Water Surface:
    ~~~~~~~~
  ~          ~
     ◐ (sun reflection)
  ~~~~~~~~~~~~

After 30 seconds:
    ~~~~~~~~
        ◯
  ~~~~~~~~~~~~
  
(Giant shadow passes under)

Then nothing for 15 minutes.
```

---

## Particle System: Context-Driven Only

**Rule:** Every particle must have a reason to exist.

**Allowed Particles:**

| Location | Particle | Reason | Frequency |
|----------|----------|--------|-----------|
| Desert | Sand dust | Wind | Constant, low density |
| Forest | Falling leaves | Autumn/wind | Seasonal, low density |
| Mountain | Snow | Winter | Seasonal, altitude-based |
| Fire event | Embers | Combustion | Event-active only |
| Plague | Miasma | Disease | Event-active only |
| Swamp | Fireflies | Bioluminescence | Night-only, rare |
| Coast | Sea spray | Wave action | Constant, low density |
| Waterfall | Mist | Water impact | Static location |

**Forbidden Particles:**

❌ Golden sparkles (generic fantasy)  
❌ Floating orbs (generic magic)  
❌ Parchment dust (generic UI)  
❌ Constant glitter (visual noise)  

**Technical:** Particle system with context flags (biome, season, event, time of day).

---

## The 80/15/5 Rule

**Calibration Principle:**

- **80% of the map is calm** → Player can read everything
- **15% communicates activity** → Player notices something is happening
- **5% surprises** → Player discovers something unexpected

**Measurement:**

```
At any given moment:
- 80% of regions: no animation, no events
- 15% of regions: breathing animation + presage/event
- 5% of regions: wonder or active event
```

**Implementation:**
- Event queue limits (max 2 active events)
- Wonder spawn rate (1 per 10–45 minutes)
- Breathing animation (always present, never intrusive)

---

## Technical Architecture

### Layer Structure

```
src/ui/idleVillage/worldSurface/
├── layers/
│   ├── WorldLayer.tsx          (terrain, cities, roads)
│   ├── BreathLayer.tsx         (clouds, fog, water, trees)
│   ├── ParallaxController.ts   (depth multipliers, mouse tracking)
│   ├── EventLayer.tsx          (presages, active events, consequences)
│   └── WonderLayer.tsx         (rare moments, wonders)
├── config/
│   ├── worldSurfaceConfig.ts   (animation timings, colors, frequencies)
│   ├── eventConfig.ts          (event types, phases, durations)
│   └── wonderConfig.ts         (wonder types, rarity, animations)
├── hooks/
│   ├── useWorldSurfaceState.ts (event queue, wonder spawning)
│   ├── useParallax.ts          (mouse tracking, parallax calculation)
│   └── useBreathAnimation.ts   (sine/cosine animation)
├── utils/
│   ├── eventPresageSystem.ts   (4-phase event lifecycle)
│   ├── wonderSpawner.ts        (RNG-based wonder generation)
│   └── particleContext.ts      (context-driven particle emission)
└── WorldSurface.tsx            (main component, layer composition)
```

### Config-First Design

**worldSurfaceConfig.ts:**

```typescript
export const WORLD_SURFACE_CONFIG = {
  // Parallax multipliers
  parallax: {
    clouds: 1.20,
    atmosphere: 1.10,
    frame: 1.02,
    world: 1.00,
    waterDepth: 0.90,
    underwater: 0.75,
  },
  
  // Breathing animation
  breath: {
    clouds: { cycle: 6000, amplitude: 3, opacity: 0.15 },
    fog: { cycle: 8000, amplitude: 2, opacity: 0.10 },
    water: { cycle: 4000, amplitude: 4, opacity: 0.12 },
    trees: { cycle: 5000, amplitude: 2, opacity: 0.08 },
  },
  
  // Event frequencies
  events: {
    rareEvents: { interval: 600000, maxActive: 2 },
    commonEvents: { interval: 300000, maxActive: 2 },
  },
  
  // Wonder rarity
  wonders: {
    kraken: { interval: 900000, duration: 4000 },
    whale: { interval: 1200000, duration: 2500 },
    dragon: { interval: 1800000, duration: 7000 },
    // ... etc
  },
  
  // Calibration
  calibration: {
    calmPercent: 80,
    activePercent: 15,
    wonderPercent: 5,
  },
};
```

### State Management

**useWorldSurfaceState.ts:**

```typescript
interface WorldSurfaceState {
  // Event queue
  activeEvents: Event[];
  eventQueue: Event[];
  
  // Wonder system
  nextWonderTime: number;
  wonderHistory: Wonder[];
  
  // Parallax
  mousePos: { x: number; y: number };
  parallaxOffset: { x: number; y: number };
  
  // Breathing
  breathPhase: number; // 0–1, updated by animation loop
}
```

---

## Implementation Phases

### Phase 1: Foundation (1–2 days)
- [ ] Create layer structure
- [ ] Implement parallax controller
- [ ] Add breathing animation system
- [ ] Config-first design

### Phase 2: Events (2–3 days)
- [ ] Event queue system
- [ ] 4-phase presage lifecycle
- [ ] Event visualization (fire, plague, etc.)
- [ ] Consequence system

### Phase 3: Wonders (1–2 days)
- [ ] Wonder spawner (RNG-based)
- [ ] Kraken, whale, dragon animations
- [ ] Rare event telemetry
- [ ] Discovery system

### Phase 4: Underwater (1 day)
- [ ] Caustic layer
- [ ] Depth coloring
- [ ] Underwater silhouettes
- [ ] Underwater wonders

### Phase 5: Polish & Testing (1–2 days)
- [ ] Calibration (80/15/5 rule)
- [ ] Performance optimization
- [ ] Playwright E2E tests
- [ ] Documentation

---

## Success Criteria

- [ ] Map is immediately readable (no animation noise)
- [ ] Breathing animation is unconscious (player doesn't notice)
- [ ] Parallax creates depth without distraction
- [ ] Events follow 4-phase presage system
- [ ] Wonders are rare and memorable
- [ ] 80/15/5 calibration maintained
- [ ] Performance: 60 FPS on target hardware
- [ ] Telemetry: event_presaged, event_active, wonder_spotted
- [ ] Documentation: complete with ASCII diagrams

---

## Guardrails

- **No continuous animation everywhere** → Breathing only, subtle
- **No "fantasy UI filter"** → Particles context-driven only
- **No event spam** → Max 2 active events, cooldown timers
- **No wonder visibility guarantee** → Player may miss them
- **No gameplay impact from wonders** → Pure visual delight
- **Config-first design** → All timings, colors, frequencies in config
- **i18n for event messages** → All presage/event text localized
- **Telemetry for analytics** → Track event presages, wonders spotted

---

## References

- **Previous Plan:** `world_surface_v2_strategic_plan.md`
- **ChatGPT Critique:** Hierarchical perception, rarity-driven wonders, presage system
- **Related:** Idle Village event system, POI system, time engine
- **Art Direction:** "Il Drago" (Realismo Eroico Classico)

---

## Next Steps

1. **Coordinator:** Convert this plan into 4–5 executable prompts
2. **Strategist:** Create implementation specs for each phase
3. **Agents:** Execute Phase 1 (Foundation) with config-first design
4. **Review:** Validate 80/15/5 calibration with playtesting

---

**Status:** Ready for Coordinator review and prompt generation.
