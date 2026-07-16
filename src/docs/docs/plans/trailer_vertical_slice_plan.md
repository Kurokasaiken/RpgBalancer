---
title: Idle Village — Steam Teaser Vertical Slice Implementation Plan v2
status: candidate
owner: Cascade
last_updated: 2026-07-16
description: "Pragmatic implementation plan for 45-second Steam teaser: 5 independent recordable cinematic scenes built on existing game UI components."
---

# Idle Village — Steam Teaser Vertical Slice Implementation Plan v2

> **Principle:** This is not a gameplay system. It is a deterministic marketing capture layer built on top of existing game UI components.
>
> **Objective:** Produce a 45-second Steam teaser by creating five independent recordable cinematic scenes.
>
> **Primary owner:** Cascade · Go-To-Market Pod
> **Related docs:** [go_to_market_steam_first.md](../strategy/go_to_market_steam_first.md), [MASTER_PLAN.md](../MASTER_PLAN.md)

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

All trailer components bypass standard project invariants. They are **mocked, scripted, and temporary**.

**File header convention:**
```typescript
/**
 * @trailer-only
 *
 * This component is part of the Steam teaser trailer production pipeline.
 * It does NOT follow standard project invariants:
 * - NO PersistenceService (mock data only)
 * - NO real gameplay logic (scripted sequences)
 * - NO full i18n (hardcoded copy for iteration speed)
 * - NO telemetry (marketing asset, not product)
 * - NO Zod validation (tunable config only)
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
- Delete after trailer production (optional cleanup)

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

## 4. Five Recordable Scenes

| Scene | Time | What exists | What to build | Deliverable |
|-------|------|-------------|---------------|-------------|
| **Intro** | 0-6s | MapPage background, ActionProgressBar | TrailerIntro (background + logo + progress) | Atmospheric opening |
| **Map** | 6-14s | MapPage, QuestPOI, LocationCard | TrailerMapSequence (auto POI appear + zoom) | Exploration showcase |
| **UI** | 14-22s | SpellCreatorNew, CharacterBuilder | TrailerUIShowcase (Hero/Spell/Forge carousel) | Depth montage |
| **Astrolabe** | 22-32s | DestinyAstrolabe (physics, ball, spine) | AstrolabeTrailerController + LootExplosion | Hero moment |
| **Ending** | 32-45s | MapPage background | TrailerEnding (village + Forge + CTA) | Wishlist conversion |

---

## 5. Component Inventory (7 new components)

```
src/ui/idleVillage/trailer/
├── TrailerViewer.tsx              # Shell: /trailer?scene=xxx
├── TrailerIntro.tsx              # Background + logo + progress
├── TrailerMapSequence.tsx        # Map + POI + auto zoom
├── TrailerUIShowcase.tsx         # Hero/Spell/Forge carousel
├── AstrolabeTrailerController.tsx # Scripted astrolabe sequence
├── LootExplosion.tsx            # Gold particles MVP
└── TrailerEnding.tsx            # Village + Forge + CTA

src/balancing/config/idleVillage/
└── trailerConfig.ts              # Tunable values only
```

**Existing components to reuse:**
- DestinyAstrolabe (physics, ball, spine, verdict)
- SpellCreatorNew, CharacterBuilder
- MapPage, QuestPOI, LocationCard

---

## 6. Development Sprints (14 days)

### Sprint 1 — Astrolabe Vertical Slice (Days 1-5)
**Priority:** Maximum. This is the hero shot.

**Build:**
- `AstrolabeTrailerController.tsx` — wrapper on DestinyAstrolabe
- `LootExplosion.tsx` — MVP canvas/CSS particles

**Detailed Sequence (spend most time here):**

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

**LootExplosion MVP:**
- NO particle engine
- 30 CSS particles are sufficient
- Perception > technique
- Brain sees: gold, explosion, reward
- Doesn't matter if there's a physics system behind it

**Success criteria:** Press button → record 10s scripted sequence that looks like real gameplay.

**Value:** First Steam-ready material (GIF, screenshots, devlog).

**Realistic Timeline:**
- Day 1: Don't write elegant code. Just integrate DestinyAstrolabe, get sequence playing
- Day 2-3: Polish
- Day 4-5: Loot + hero frame

If by Day 5 you have a beautiful Astrolabe: the project changes. You already have something to show.

---

### Sprint 2 — Trailer Viewer + Intro (Days 6-8)
**Build:**
- `TrailerViewer.tsx` — shell with scene selector
- `TrailerIntro.tsx` — background + logo + progress bar

**TrailerViewer Implementation (keep it STUPID):**
```typescript
// Literally this simple:
switch (scene) {
  case "intro": return <TrailerIntro />
  case "map": return <TrailerMapSequence />
  case "ui": return <TrailerUIShowcase />
  case "astrolabe": return <AstrolabeTrailerController />
  case "ending": return <TrailerEnding />
}
```
NO patterns. NO abstraction. Just routing.

**Features:**
- Route `/trailer` with debug buttons
- Route `/trailer?scene=intro|map|ui|astrolabe|ending`
- Capture mode: `?capture=true` (hides debug, forces autoplay, resets to t=0)

**Success criteria:** Navigate between scenes, see intro play deterministically.

---

### Sprint 3 — UI + Map (Days 9-11)
**Build:**
- `TrailerUIShowcase.tsx` — Hero/Spell/Forge carousel with animated numbers
- `TrailerMapSequence.tsx` — auto POI appear + highlight + zoom

**UI Showcase:**
- Hero: Level 12 → 13, skill unlock
- Spell: Arcane Power +50
- Forge: Blueprint unlocked, +30% production
- Fade/scale transitions

**Map Sequence:**
- Map appears
- POI 1 appears
- POI 2 appears
- Dangerous POI highlighted
- Zoom to selected

**Success criteria:** Both scenes recordable with no clicks required.

---

### Sprint 4 — Ending + Polish (Days 12-14)
**Build:**
- `TrailerEnding.tsx` — village + Forge reveal + CTA

**Polish:**
- Timing adjustments
- Visual consistency
- OBS capture testing
- 1080p/60fps output

**Success criteria:** Complete 45s video ready for Steam.

---

## 5. Configuration

**File:** `src/balancing/config/idleVillage/trailerConfig.ts`

**Structure (tunable values only):**
```typescript
export const trailerConfig = {
  duration: 45000,

  intro: {
    duration: 6000,
    fontScale: 1.2,
    title: "Idle Village",
  },

  map: {
    duration: 8000,
    poiSequence: [
      { id: "poi-1", time: 1000, x: 200, y: 150 },
      { id: "poi-2", time: 2000, x: 400, y: 300 },
      { id: "dangerous", time: 3000, x: 600, y: 450, highlight: true },
    ],
  },

  ui: {
    duration: 8000,
    screens: [
      { type: "hero", duration: 2500 },
      { type: "spell", duration: 2500 },
      { type: "forge", duration: 3000 },
    ],
  },

  astrolabe: {
    duration: 10000,
    sequence: [
      { time: 0, event: "spawn" },
      { time: 1000, event: "energy" },
      { time: 3000, event: "ballEnter" },
      { time: 5000, event: "nearMiss" },
      { time: 7000, event: "success" },
      { time: 8000, event: "loot" },
      { time: 10000, event: "freeze" },
    ],
  },

  ending: {
    duration: 13000,
    cta: "Wishlist on Steam",
  },
};
```

**CSS Variables (trailer.css):**
```css
.trailer-root {
  --trailer-bg: #030202;
  --trailer-gold: #d8b13e;
  --trailer-gold-bright: #f0cf6a;
  --trailer-parchment: #ede0c4;
}
```

**Why CSS variables:** Easy palette changes without touching components.

---

## 7. Capture Mode

**URL:** `/trailer?scene=astrolabe&capture=true`

**Behavior (explicit):**
- Autoplay
- Hides controls
- Forces seed
- Disables mouse
- Auto reset

**Implementation:**
```typescript
const isCaptureMode = new URLSearchParams(location.search).get("capture") === "true";
```

**Cost:** 15 minutes. **Value:** Eliminates recording problems.

---

## 8. Definition of Done (per scene)

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

## 9. Decision Order During Development

When time is limited, decide in this order:

**FIRST:** "Does this improve the frame?"
- If yes → do it

**SECOND:** "Does this improve recording?"
- If yes → do it

**LAST:** "Does this improve architecture?"
- Only if it costs very little

---

## 10. Capture Notes Folder

Create: `docs/trailer_capture_notes.md`

**Purpose:** Non-technical notes during final 3 days

**Content:**
- Best timestamps
- Successful screenshots
- Edit ideas
- Problems encountered

**Why:** During final polish, you'll forget what worked. This prevents that.

---

## 11. Scene Done Checklist

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

## 12. What NOT to Build

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

## 13. Success Criteria

**Day 7:** Can record intro + astrolabe + UI (Steam-ready GIF/screenshots/devlog material)

**Day 14:** Complete 45s video ready for Steam upload

---

## 14. Change Log

- `2026-03-02`: Initial plan created (v1)
- `2026-07-13`: Added font size/readability feedback
- `2026-07-16`: Complete rewrite to pragmatic v2 — focus on 5 recordable scenes, Astrolabe-first sprint, capture mode, simplified config, @trailer-only convention, detailed sequence breakdown, decision order, capture notes folder
