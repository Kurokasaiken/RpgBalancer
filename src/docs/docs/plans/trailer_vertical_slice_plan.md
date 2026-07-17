---
title: Idle Village — Steam Teaser Vertical Slice Implementation Plan v2
status: APPROVED_FOR_IMPLEMENTATION
owner: Cascade
last_updated: 2026-07-16
description: "Pragmatic implementation plan for 55-second Steam teaser: 7 independent recordable cinematic scenes matching StoryboardPage.tsx narrative."

# Idle Village — Steam Teaser Vertical Slice Implementation Plan v2

> **Principle:** This is not a gameplay system. It is a deterministic marketing capture layer built on top of existing game UI components.
>
> **Objective:** Produce a 55-second Steam teaser by creating seven independent recordable cinematic scenes matching StoryboardPage.tsx.
>
> **Primary owner:** Cascade · Go-To-Market Pod
> **Related docs:** [go_to_market_steam_first.md](../strategy/go_to_market_steam_first.md), [MASTER_PLAN.md](../MASTER_PLAN.md), [StoryboardPage.tsx](../../src/ui/storyboard/StoryboardPage.tsx)

---

## 1. Philosophy

The trailer is a temporary marketing asset built on top of existing game systems. It is NOT a gameplay feature.

**DO NOT create:**
- Cinematic engine
- Reusable framework
- Premature abstraction
- Permanent systems

**DO create:**
- Deterministic scenes that produce beautiful frames for capture
- Scripted sequences on top of existing UI components
- Config-driven timing and values for easy iteration

The code serves one purpose: create recordable video content.

---

## 1.1 Trailer-Only Convention

Trailer components are exempt from gameplay architecture requirements.

They MUST preserve presentation architecture requirements:
- Visual consistency
- Deterministic behavior
- Existing component contracts
- Project styling conventions

They are marketing-only implementations.

**File header convention:**
```typescript
/**
 * @trailer-only
 *
 * This component is part of the Steam teaser trailer production pipeline.
 * It is exempt from gameplay architecture requirements but must preserve
 * presentation architecture requirements.
 *
 * NO gameplay logic (scripted sequences, mock data only)
 * NO persistence (marketing asset, not product)
 * NO full i18n (hardcoded copy for iteration speed)
 * NO telemetry (marketing asset, not product)
 * NO Zod validation (tunable config only)
 *
 * MUST preserve:
 * - Visual consistency with existing components
 * - Existing component contracts (reuse, don't fork)
 * - Deterministic behavior for recording
 * - Project styling conventions
 *
 * This code exists solely to produce recordable video content.
 * Do NOT reuse for gameplay features.
 */
```

**Directory isolation:**
```
src/ui/idleVillage/trailer/  # All trailer code lives here
```

**Naming convention:**
- Prefix `Trailer` for all components
- NO reuse in production gameplay
- Trailer code is isolated and disposable
- Cleanup decision happens after release

---

## 2. Frozen Objective

**Definition:** The Trailer Vertical Slice is a controlled, recordable cinematic scene that demonstrates Idle Village fantasy. It does NOT represent a gameplay system and does NOT introduce permanent mechanics.

**Note:** This must be written in the trailer folder README. In 6 months, someone (even you) might think "we have AstrolabeTrailerController, so we can use it in gameplay." NO. It is a controlled mock.

---

## 3. Architecture Rule

**Every trailer component must have this mindset:**

❌ WRONG: "How do I implement the system?"

✅ CORRECT: "How do I create the best frame to capture?"

**Example - Astrolabe:**
- Wrong: Create generic physics replay system
- Correct: Bring DestinyAstrolabe to controlled state, script spectacular sequence, capture

**Example - Forge:**
- Wrong: Create forge system
- Correct: Create screen that communicates "forge progression fantasy"

---

## 4. Seven Recordable Scenes (matching StoryboardPage.tsx)

| Scene | Time | What exists | What to build | Deliverable |
|-------|------|-------------|---------------|-------------|
| **1. Threat** | 0:00-0:05 | MapPage, LocationCard, QuestPOI, MapHeatmapOverlay | TrailerThreat (map + POI appear + GOBLIN INVASION banner) | Wide establishing shot |
| **2. Choice** | 0:05-0:15 | VillageSandbox, ResidentSlotRack, VillageRosterSection, WanderlustSurface | TrailerChoice (village + asymmetric POI choices) | Medium two-shot |
| **3. Preparation** | 0:15-0:25 | WanderlustRosterCard, WanderlustPortrait, WanderlustStatBar, QuestPOI | TrailerPreparation (hero sheet + drag to POI) | Close-up + drag detail |
| **4. Risk** | 0:25-0:32 | DestinyAstrolabe, SkillCheckLegend, OutcomeModal | AstrolabeTrailerController (astrolabe + HERO INJURED) | Close-up on astrolabe (HERO MOMENT) |
| **5. Consequence** | 0:32-0:40 | VillageSandbox, ActiveHUD, HUDNotificationLayer, TeaserImpactOverlay | TrailerConsequence (village lost + greyscale) | Wide village shot |
| **6. Legacy** | 0:40-0:50 | VictoryComponent, ActivityLogPanel, WanderlustSurface, WanderlustPortrait | TrailerLegacy (knowledge preserved list) | Vertical list / scroll |
| **7. Outro** | 0:50-0:55 | WanderlustHeading, WanderlustSurface | TrailerOutro (WANDERLUST TRIUMPH + wishlist CTA) | Title card |

**Total: 55 seconds**

---

## 5. Component Inventory (8 new components)

```
src/ui/idleVillage/trailer/
├── TrailerViewer.tsx              # Shell: /trailer?scene=xxx
├── TrailerThreat.tsx             # Map + POI appear + GOBLIN INVASION banner
├── TrailerChoice.tsx             # Village + asymmetric POI choices
├── TrailerPreparation.tsx        # Hero sheet + drag to POI
├── AstrolabeTrailerController.tsx # Scripted astrolabe sequence + CSS reward burst
├── TrailerConsequence.tsx        # Village lost + greyscale
├── TrailerLegacy.tsx             # Knowledge preserved list
└── TrailerOutro.tsx             # WANDERLUST TRIUMPH + wishlist CTA

src/balancing/config/idleVillage/
└── trailerConfig.ts              # Tunable values only
```

**Existing components to reuse:**
- MapPage, LocationCard, QuestPOI, MapHeatmapOverlay
- VillageSandbox, ResidentSlotRack, VillageRosterSection, WanderlustSurface
- WanderlustRosterCard, WanderlustPortrait, WanderlustStatBar
- DestinyAstrolabe, SkillCheckLegend, OutcomeModal
- ActiveHUD, HUDNotificationLayer, TeaserImpactOverlay
- VictoryComponent, ActivityLogPanel
- WanderlustHeading

---

## 6. Development Sprints (14 days)

### Sprint 1 — Astrolabe Vertical Slice (Days 1-3)
**Priority:** Maximum. This is the hero shot (Scene 4: Risk).

**Build:**
- `AstrolabeTrailerController.tsx` — wrapper on DestinyAstrolabe with internal CSS reward burst

**AstrolabeTrailerController constraints:**
- MAY set initial state
- MAY trigger scripted actions
- MAY control presentation
- MAY include internal CSS reward burst (no separate component)
- MAY NOT change physics
- MAY NOT modify probabilities
- MAY NOT alter gameplay rules
- MAY NOT fork DestinyAstrolabe
- MAY NOT modify DestinyAstrolabe internals

**Detailed Sequence (Scene 4: Risk - 0:25-0:32):**

**0-2 sec — Reveal**
- Don't show everything immediately
- Dark background
- Rings illuminate
- Camera scale-in

**2-5 sec — Tension**
- Ball enters
- Spines visible
- Perceived risk

**5-8 sec — Payoff**
- Near collision
- Success
- Gold burst

**8-10 sec — Hero Frame**
- **Critical:** Best frame of the trailer is probably here
- Freeze
- Why? From this you can get: Steam screenshot, thumbnail, GIF

**Internal CSS reward burst:**
- CSS transforms only
- Predefined particles
- Deterministic positions
- NO physics simulation
- NO particle engine
- NO canvas rendering
- NO separate component

**Success criteria:** Press button → record 7s scripted sequence that looks like real gameplay.

**Value:** First Steam-ready material (GIF, screenshots, devlog).

**Realistic Timeline:**
- Day 1: Don't write elegant code. Just integrate DestinyAstrolabe, get sequence playing
- Day 2: Polish
- Day 3: CSS reward burst + hero frame

If by Day 5 you have a beautiful Astrolabe: the project changes. You already have something to show.

---

### Sprint 2 — Trailer Viewer + Threat + Choice (Days 4-6)
**Build:**
- `TrailerViewer.tsx` — shell with scene selector
- `TrailerThreat.tsx` — map + POI appear + GOBLIN INVASION banner
- `TrailerChoice.tsx` — village + asymmetric POI choices

**TrailerViewer Implementation (keep it STUPID):**
```typescript
// Literally this simple:
switch (scene) {
  case "threat": return <TrailerThreat />
  case "choice": return <TrailerChoice />
  case "preparation": return <TrailerPreparation />
  case "risk": return <AstrolabeTrailerController />
  case "consequence": return <TrailerConsequence />
  case "legacy": return <TrailerLegacy />
  case "outro": return <TrailerOutro />
}
```
NO patterns. NO abstraction. Just routing.

**Features:**
- Route `/trailer` with debug buttons
- Route `/trailer?scene=threat|choice|preparation|risk|consequence|legacy|outro`
- Capture mode: `?capture=true` (hides debug, forces autoplay, resets to t=0)

**Success criteria:** Navigate between scenes, see threat and choice play deterministically.

---

### Sprint 3 — Preparation + Consequence (Days 7-9)
**Build:**
- `TrailerPreparation.tsx` — hero sheet + drag to POI
- `TrailerConsequence.tsx` — village lost + greyscale

**Preparation:**
- Hero sheet: Attack 15, Defense 8, Magic 12
- Drag hero token into QuestPOI
- POI begins pulsing to show ready

**Consequence:**
- Timer reaches zero
- Greyscale filter and impact overlay
- SETTLEMENT LOST

**Success criteria:** Both scenes recordable with no clicks required.

---

### Sprint 4 — Legacy + Outro (Days 10-12)
**Build:**
- `TrailerLegacy.tsx` — knowledge preserved list
- `TrailerOutro.tsx` — WANDERLUST TRIUMPH + wishlist CTA

**Legacy:**
- KNOWLEDGE PRESERVED
- Artifacts, blueprints, surviving heroes appear with checkmarks
- Bronze surface cards for each legacy item

**Outro:**
- WANDERLUST TRIUMPH logo
- PREPARE · ENDURE · TRIUMPH tagline
- Animated wishlist CTA button

**Success criteria:** Both scenes recordable, final CTA compelling.

---

### Sprint 5 — Final Polish and Integration (Days 13-14)
**Build:**
- Timing adjustments across all 7 scenes
- Visual consistency tuning
- OBS capture testing
- Final polish

**Success criteria:** Complete 55s video ready for Steam upload.

---

## 7. Configuration

**File:** `src/balancing/config/idleVillage/trailerConfig.ts`

**Structure (tunable values only):**
```typescript
export const trailerConfig = {
  duration: 55000,

  threat: {
    duration: 5000,
    banner: "GOBLIN INVASION — 5 DAYS REMAIN",
    poiSequence: [
      { id: "poi-1", time: 1000 },
      { id: "poi-2", time: 2000 },
      { id: "poi-3", time: 3000 },
    ],
  },

  choice: {
    duration: 10000,
    choices: [
      { id: "training", type: "safe", label: "Training Grounds" },
      { id: "ruins", type: "high-risk", label: "Forgotten Ruins" },
    ],
  },

  preparation: {
    duration: 10000,
    hero: {
      attack: 15,
      defense: 8,
      magic: 12,
    },
    poi: "Forgotten Ruins",
  },

  risk: {
    duration: 7000,
    camera: {
      initialScale: 0.8,
      focusTarget: "astrolabe",
      shakeAt: ["impact"],
    },
    sequence: [
      { time: 0, event: "spawn" },
      { time: 2000, event: "ballEnter" },
      { time: 5000, event: "nearMiss" },
      { time: 7000, event: "heroInjured" },
    ],
    posterFrames: [
      { id: "nearMiss", time: 5500 },
      { id: "heroInjured", time: 7000 },
    ],
  },

  consequence: {
    duration: 8000,
    timer: 0,
    overlay: "greyscale",
    message: "SETTLEMENT LOST",
  },

  legacy: {
    duration: 10000,
    items: [
      { id: "artifact", label: "Ancient Artifact" },
      { id: "blueprint", label: "Sacred Altar Blueprint" },
      { id: "heroes", label: "Surviving Heroes" },
    ],
  },

  outro: {
    duration: 5000,
    title: "WANDERLUST TRIUMPH",
    tagline: "PREPARE · ENDURE · TRIUMPH",
    cta: "WISHLIST NOW ON STEAM",
  },

  capture: {
    seed: 12345,
    freezeAt: undefined,
  },
};

// Copy constants (separated from timing data)
const TRAILER_COPY = {
  threatBanner: "GOBLIN INVASION — 5 DAYS REMAIN",
  consequenceMessage: "SETTLEMENT LOST",
  legacyTitle: "KNOWLEDGE PRESERVED",
  outroTitle: "WANDERLUST TRIUMPH",
  outroTagline: "PREPARE · ENDURE · TRIUMPH",
  cta: "WISHLIST NOW ON STEAM",
};
```

**CSS Variables (trailer.css):**
```css
.trailer-root {
  --trailer-bg: #030202;
  --trailer-gold: #d8b13e;
  --trailer-gold-bright: #f0cf6a;
  --trailer-parchment: #ede0c4;
  --trailer-transition-duration: 0.3s;
  --trailer-glow-intensity: 0.8;
  --trailer-text-scale: 1.2;
}
```

**Why CSS variables:** Easy palette changes without touching components.

---

## 8. Capture Mode

**URL:** `/trailer?scene=astrolabe&capture=true`

**Behavior (explicit):**
- Autoplay
- Hides controls
- Forces seed
- Disables mouse
- Auto reset

**Poster frame capture:**
- URL: `/trailer?scene=astrolabe&frame=nearMiss`
- URL: `/trailer?scene=astrolabe&frame=success`
- Jumps to specific timestamp from config.posterFrames
- Freezes for screenshot capture

**Capture mode must guarantee:**
- Same initial state
- Same animation timing
- Same particle positions
- Same poster frames

**Implementation:**
```typescript
const isCaptureMode = new URLSearchParams(location.search).get("capture") === "true";
const posterFrame = new URLSearchParams(location.search).get("frame");
```

**Cost:** 15 minutes. **Value:** Eliminates recording problems + enables asset production (Steam capsule, Twitter, Discord, devlog, screenshots).

---

## 9. Mock Data Policy

Trailer data is intentionally fake.

**Allowed:**
- heroLevel: 99
- artifactPower: +500
- rareLoot: true
- fake progression numbers
- scripted outcomes

**Forbidden:**
- Modify player save
- Update inventory
- Change economy
- Unlock real content
- Alter gameplay state

The trailer creates an illusion of gameplay, not gameplay state.

---

## 10. No Placeholder Rule

A trailer scene cannot use temporary shapes, debug boxes, fake assets, or developer UI after the first integration day.

Every captured frame must represent final visual language.

**Rationale:** The trailer is the product. Placeholder assets in a trailer become marketing assets. Fix this at the source, not in post-production.

---

## 11. Deterministic Seed Rule

Trailer code cannot use `Math.random()`. All randomness must come from deterministic seed.

**Config:**
```typescript
capture: {
  seed: 12345,
  freezeAt: undefined,
}
```

**Implementation:**
- Use seeded random generator for all random values
- Capture mode forces seed to fixed value
- This guarantees identical particle positions, timing, and poster frames across recordings

**Rationale:** If React mounts/unmounts components, a single `Math.random()` call breaks reproducibility. Deterministic seed prevents this.

---

## 12. Visual Rules

Every scene must follow these presentation rules:

### Background (minimum)
- Base gradient
- Atmospheric particles
- Vignettes
- Depth layer

### Motion (allowed)
- Transform
- Opacity
- Scale
- Rotation

### Motion (avoid)
- Layout animation
- Expensive filters
- Canvas rendering loops

### Text rules
- Max 6 words per screen
- Minimum 48px equivalent at 1080p
- Fade in/out only
- +20% larger than game UI for readability

### Hero Frame requirement
Every scene must produce:
- 1 screenshot-worthy frame
- 1 5-second recording loop

This saves you in the final polish phase and ensures you have marketing assets beyond the video.

---

## 13. Production Gate

A scene is NOT considered complete if:
- It technically works but looks generic
- It requires manual clicks
- It cannot produce a screenshot
- Timing changes require code edits

**Acceptance criteria:**
- Scene runs automatically without interaction
- Produces at least one screenshot-worthy frame
- Can be recorded in OBS with consistent timing
- Visual quality matches game aesthetic

---

## 14. Definition of Done (per scene)

Before moving to the next scene, each must pass:

### Functional Done
- Dedicated URL works
- Starts without clicks
- Reset consistent
- No React warnings

### Visual Done
- Screenshot looks like a real game
- Readable at 1080p
- Colors consistent
- Animations smooth
- At least one "poster frame"

---

## 15. Decision Order During Development

When time is limited, decide in this order:

**FIRST:** "Does this improve the frame?"
- If yes → do it

**SECOND:** "Does this improve recording?"
- If yes → do it

**LAST:** "Does this improve architecture?"
- Only if it costs very little

---

## 16. Capture Notes Folder

Create: `docs/trailer_capture_notes.md`

**Purpose:** Non-technical notes during final 3 days

**Content:**
- Best timestamps
- Successful screenshots
- Edit ideas
- Problems encountered

**Why:** During final polish, you'll forget what worked. This prevents that.

---

## 17. Scene Done Checklist

Every scene must pass:

### Technical Done
- Starts independently (no clicks required)
- Reset always identical
- No console errors
- OBS recordable
- Deterministic timing

### Visual Done
- Readable at 1080p
- Text +20% larger than game UI
- Colors consistent
- Transitions clean
- 5 seconds of stable loop

---

## 18. What NOT to Build

❌ Zustand trailer store
❌ Zod config validation
❌ Full i18n system
❌ Storybook
❌ Visual regression
❌ Telemetry
❌ Particle engine
❌ Generic animation framework
❌ Reusable cinematic components

These are product features. This is marketing.

---

## 19. Success Criteria

**Day 3:** Can record astrolabe (Steam-ready GIF/screenshots/devlog material)

**Day 6:** Can record threat + choice + astrolabe

**Day 9:** Can record preparation + consequence

**Day 12:** Can record legacy + outro

**Day 14:** Complete 55s video ready for Steam upload

**Ultimate metric:** By July 30, can open OBS and capture 7 memorable frames that make someone on Steam say "I want to see this game."

---

## 20. Change Log

- `2026-03-02`: Initial plan created (v1)
- `2026-07-13`: Added font size/readability feedback
- `2026-07-16`: Complete rewrite to pragmatic v2 — focus on 5 recordable scenes, 45s duration, Astrolabe-first sprint, capture mode, simplified config, @trailer-only convention, detailed sequence breakdown, decision order, capture notes folder
- `2026-07-16`: AAA-level critique applied — "exempt from gameplay architecture" instead of "bypass invariants", camera metadata, poster frame capture, visual rules, deterministic particles, TRAILER_COPY separation, hero moment prioritization, production gate, mock data policy, CSS variables tuning
- `2026-07-16`: Final corrections for APPROVED_FOR_IMPLEMENTATION — removed LootExplosion as separate component (internal to AstrolabeTrailerController), reduced Ending to 7s with narrative loop, added No Placeholder Rule, added Deterministic Seed Rule, status set to APPROVED_FOR_IMPLEMENTATION
- `2026-07-16`: Aligned to StoryboardPage.tsx — 7 scenes (Threat, Choice, Preparation, Risk, Consequence, Legacy, Outro), 55s duration, specific narrative elements (GOBLIN INVASION banner, HERO INJURED, SETTLEMENT LOST, KNOWLEDGE PRESERVED, WANDERLUST TRIUMPH), 7 components, 5 sprints
- `2026-07-16`: Sprint 1 (Days 1-3) completed — AstrolabeTrailerController implemented with scripted timeline, CSS reward burst, deterministic seeded random, trailer config, CSS variables, routing at /trailer, safeguards passed (lint, build:check). Evidence: test-results/build-check-2026-07-16.log
- `2026-07-16`: Sprints 2-5 completed — TrailerViewer (scene router), TrailerThreat, TrailerChoice, TrailerPreparation, TrailerConsequence, TrailerLegacy, TrailerOutro, and TeaserImpactOverlay implemented; `trailerConfig.ts` expanded with scene data, positions, and scene order; `App.tsx` wired to `TrailerViewer`; deterministic auto-cycle, query-param scene selection, and capture mode added; safeguards passed (lint, build:check, test, kanban:lint). Evidence: test-results/trailer-sprints-2-5-2026-07-16.md
