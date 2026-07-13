# Wanderlust Triumph — Steam Concept Slice (55s Gameplay Teaser)

**Status:** Planning  
**Scope:** Hollywood-facade gameplay teaser for Steam (not a playable build)  
**Duration:** 55 seconds  
**Goal:** A controlled, deterministic, linear sequence that can be recorded in one take.  
**Constraint:** No real backend or engine simulation; all data is mocked and hardcoded.

---

## 1. Asset Inventory — Code Mapping

All real components already live in the codebase. The teaser reuses them as a **facade**, with no edits to the existing components.

### 1.1 Map & POI

| UI Element | Reusable Source Files |
|------------|----------------------|
| Top-down map shell | `src/ui/idleVillage/map/MapPage.tsx` |
| Map context / hooks | `src/ui/idleVillage/hooks/useMapContext.ts` |
| Location / POI medallions | `src/ui/idleVillage/components/LocationCard.tsx` |
| Quest POI skin | `src/ui/idleVillage/components/QuestPOI.tsx`, `GenericPoiSkin` |
| Action card wrappers | `src/ui/idleVillage/components/ActionCardWrapper.tsx` |
| Map heatmap / density overlay | `src/ui/idleVillage/components/MapHeatmapOverlay.tsx`, `useMapHeatmapData.ts` |
| Resource HUD on map | `src/ui/idleVillage/map/components/ResourcePanel.tsx` |
| Day/night and hunger action cards | `src/ui/idleVillage/map/actionCards/DayNightActionCard.tsx`, `HungerActionCard.tsx` |
| Quest card wrapper | `src/ui/idleVillage/map/actionCards/wrappers/QuestCard.tsx` |
| Route | `src/pages/idle-village.tsx` → just renders `MapPage` |

### 1.2 Village & Worker Placement

| UI Element | Reusable Source Files |
|------------|----------------------|
| Sandbox village shell | `src/ui/idleVillage/VillageSandbox.tsx` |
| Activity area / slots | `src/ui/idleVillage/ActivityArea.tsx`, `ActivitySlot.tsx` |
| Resident slot rack | `src/ui/idleVillage/components/ResidentSlotRack.tsx` |
| Worker roster section | `src/ui/idleVillage/components/VillageRosterSection.tsx` |
| Theater / location detail overlay | `src/ui/idleVillage/components/TheaterOverlay.tsx` |
| Detail panel stack | `src/ui/idleVillage/components/DetailPanelStack.tsx` |
| Map board shell | `src/ui/idleVillage/components/MapBoardShell.tsx` |
| Summary strip (resources) | `src/ui/idleVillage/components/SummaryStrip.tsx` |
| Active HUD | `src/ui/idleVillage/components/ActiveHUD.tsx`, `useActiveHUDState.ts` |

### 1.3 Roster & Hero Detail

| UI Element | Reusable Source Files |
|------------|----------------------|
| Wanderlust bronze-framed card | `src/ui/idleVillage/components/WanderlustRosterCard.tsx` |
| Circular portrait with gold rim | `src/ui/wanderlust-surface/layout/WanderlustPortrait.tsx` |
| Stat bars (HP / stamina) | `src/ui/wanderlust-surface/layout/WanderlustStatBar.tsx` |
| Layout primitives / headings | `src/ui/wanderlust-surface/layout/WanderlustLayout.tsx` |
| Bronze surface frame | `src/ui/wanderlust-surface/WanderlustSurface.tsx` |
| Wanderlust content slots | `src/ui/wanderlust-surface/WanderlustContent.tsx` |
| Character / PG card | `src/ui/idleVillage/components/PgCard.tsx`, `PgCardTS002.tsx` |
| Test roster page | `src/ui/idleVillage/TestRosterPage.tsx`, `src/pages/minimal-roster.tsx` |

### 1.4 Skill Check — Astrolabe

| UI Element | Reusable Source Files |
|------------|----------------------|
| Destiny astrolabe (D100 skill check) | `src/ui/idleVillage/components/destinyAstrolabe/DestinyAstrolabe.tsx` |
| V2 astrolabe | `src/ui/idleVillage/components/destinyAstrolabeV2/DestinyAstrolabeV2.tsx` |
| Astrolabe engine / physics | `src/ui/idleVillage/components/destinyAstrolabe/engine.ts` |
| Standalone routes | `src/pages/minimal-destiny-astrolabe.tsx`, `src/pages/minimal-destiny-astrolabe-v2.tsx` |
| Pinball / physics monitor | `src/ui/idleVillage/components/IdleVillagePinballMonitor.tsx` |
| Skill check preview | `src/ui/testing/SkillCheckPreviewPageLegacy.tsx` |

### 1.5 Notifications, Log, Loot / Outcome

| UI Element | Reusable Source Files |
|------------|----------------------|
| Activity log panel | `src/ui/idleVillage/components/ActivityLogPanel.tsx` |
| HUD notification layer | `src/ui/idleVillage/components/HUDNotificationLayer.tsx`, `useHUDNotifications.ts` |
| Active HUD notifications | `src/ui/idleVillage/components/ActiveHUDNotifications.tsx` |
| Shared notification system | `src/ui/shared/notificationSystem.ts`, `useNotificationSystem.ts`, `NotificationComponents.tsx` |
| Outcome modal (success/injury/death/partial) | `src/ui/idleVillage/MinimalOutcomePage.tsx` (`OutcomeModal` component) |
| Quest outcome analyzer | `src/ui/idleVillage/components/QuestOutcomeAnalyzer.tsx` |
| Victory / reward component | `src/ui/idleVillage/components/VictoryComponent.tsx` |
| Reward / quest telemetry | `src/ui/idleVillage/utils/questTelemetrySelectors.ts` |

### 1.6 App Shell & Routing

| UI Element | Reusable Source Files |
|------------|----------------------|
| App routing | `src/App.tsx` |
| Navigation config | `src/shared/navigation/navConfig.ts` |
| Fantasy layout | `src/ui/fantasy/FantasyLayout.tsx` |
| Wanderlust mockup page | `src/ui/wanderlust/WanderlustMockupPage.tsx` → loads `public/wanderlust-mockup.html` |
| Wanderlust quest demo | `src/pages/wanderlust-quest-demo.tsx` |
| Art direction bible | `src/docs/docs/plans/art_direction_plan.md`, `src/docs/docs/archmage/ArtDirection_Wanderlust.md` |

---

## 2. Teaser Script — 55 Second Timeline

The script is a linear **scene machine**. Each scene is a fullscreen view with deterministic transitions. No real engine state is used.

| Time | Scene | What the viewer sees | Components / Mock data |
|------|-------|----------------------|------------------------|
| `00:00 - 00:05` | **Threat — Map** | The map opens. POIs fade in. A banner event appears and zooms: `GOBLIN INVASION — 5 DAYS REMAIN`. | `MapPage` / `LocationCard` / `QuestPOI` mocked with 3 POIs; a full-screen `TeaserBanner` overlay. Camera pan via CSS transforms. |
| `00:05 - 00:15` | **Choice — Living Village** | Cut to the village: warm golden lights, workers in slots, observatory visible. Asymmetric choice: **Training Grounds** (cost 1 worker, reward +Defense) vs **Forgotten Ruins** (high risk, magic artifact). | `VillageSandbox` or a `TeaserVillageScene` with `WanderlustSurface`, `ResidentSlotRack`, `WanderlustRosterCard`. Two `TeaserChoiceCards` built on `WanderlustSurface`. |
| `00:15 - 00:25` | **Preparation — Roster & Setup** | Click a hero; the hero sheet expands: `Attack 15`, `Defense 8`, `Magic 12`. Drag the hero into the bronze-rimmed slot of `Forgotten Ruins`. The POI starts pulsing. | `WanderlustRosterCard` + `WanderlustPortrait` + `WanderlustStatBar`. Drag uses `@dnd-kit` with a controlled `TeaserDragOverlay`. The POI is a `QuestPOI` or `LocationCard` with `isReady` prop. |
| `00:25 - 00:32` | **Risk — The Astrolabe** | Click the ready POI. `DestinyAstrolabe` opens with corrupted valleys: thorns = 10% wound, black holes = 5% death. The ball spins, decelerates, skims the star, drops into the thorns. Final card: `FAILED` / `HERO INJURED`. | `DestinyAstrolabe` with mocked `skills` and `config` (`dead: 5`, `wound: 10`). `skipAnimation` / `autoThrow` enabled. A `TeaserOutcomeCard` built on `OutcomeModal` style. |
| `00:32 - 00:40` | **Consequence — Settlement Lost** | Immediate cut back to the village. The invasion timer hits zero. The village loses color, desaturating to oxidized grey. Impact overlay: `SETTLEMENT LOST`. | `TeaserVillageScene` with a CSS `filter: grayscale(100%) sepia(30%)` and a `TeaserImpactOverlay`. No engine reset. |
| `00:40 - 00:50` | **Progression — Legacy** | Alchemical transition: `KNOWLEDGE PRESERVED`. Animated list of legacy unlocks: `✓ Ancient Artifact`, `✓ New Blueprint — Sacred Altar`, `✓ Surviving Heroes`. | `TeaserLegacyScreen` with `WanderlustHeading`, `WanderlustSurface`, `WanderlustPortrait` for surviving heroes. |
| `00:50 - 00:55` | **Outro** | Game logo: `WANDERLUST TRIUMPH`. Subtitle: `PREPARE · ENDURE · TRIUMPH`. Animated `WISHLIST NOW ON STEAM` button. | `TeaserOutroScreen` with `WanderlustHeading` + a CTA button. |

---

## 3. Teaser Mode Architecture

### 3.1 Core Principle

A single `TeaserShowcase` route (`/teaser-showcase`) runs the entire sequence. It owns a `TeaserSceneController` that stores `currentScene` and `sceneProgress`. Existing components are **rendered with mocked props only**; no engine, no persistence, no real state mutation.

### 3.2 Files to Create

| File | Responsibility |
|------|----------------|
| `src/pages/teaser-showcase.tsx` | Route entry point, lazy-loaded in `App.tsx`. |
| `src/ui/teaser/TeaserShowcase.tsx` | Orchestrator: full-screen scene container, handles keyboard/spacebar and optional timer. |
| `src/ui/teaser/TeaserSceneController.ts` | Pure state machine: `scene` enum, `advance()`, `rewind()`, `reset()`, `setTimer()` (optional). |
| `src/ui/teaser/TeaserConfig.ts` | Hardcoded timing, copy, palette, mock hero, mock POIs, mock astrolabe result. |
| `src/ui/teaser/TeaserMapScene.tsx` | Scene 1 — threat banner over a mocked map. |
| `src/ui/teaser/TeaserVillageScene.tsx` | Scene 2 & 4 — living village / desaturated village. |
| `src/ui/teaser/TeaserChoiceCard.tsx` | Two asymmetric POI choice cards. |
| `src/ui/teaser/TeaserHeroSheet.tsx` | Hero detail overlay (Attack/Defense/Magic). |
| `src/ui/teaser/TeaserDragOverlay.tsx` | Controlled drag overlay for the hero → POI moment. |
| `src/ui/teaser/TeaserAstrolabeScene.tsx` | Scene 3 — full-screen `DestinyAstrolabe` with deterministic fail. |
| `src/ui/teaser/TeaserOutcomeCard.tsx` | `FAILED / HERO INJURED` card. |
| `src/ui/teaser/TeaserImpactOverlay.tsx` | `SETTLEMENT LOST` impact overlay. |
| `src/ui/teaser/TeaserLegacyScreen.tsx` | Scene 5 — list of preserved legacy. |
| `src/ui/teaser/TeaserOutroScreen.tsx` | Scene 6 — logo, subtitle, wishlist CTA. |
| `src/ui/teaser/TeaserBanner.tsx` | Reusable cinematic banner (event / title). |

### 3.3 Files to Modify (routing only)

- `src/App.tsx` — add a new path check `isTeaserShowcasePath` and lazy-load `TeaserShowcase`.
- `src/shared/navigation/navConfig.ts` — optionally add a `teaserShowcase` tab for internal access (dev-only).

### 3.4 Control Modes

| Mode | Trigger | Use |
|------|---------|-----|
| Manual | `Space` / `ArrowRight` | Step to the next scene. |
| Auto-play | `?autoplay=true` URL param | Auto-advance after scene duration; pause on `p` key. |
| Reset | `r` key | Return to scene 0. |
| Timer overlay | `t` key | Show/hide debug scene timer. |

### 3.5 Mock Data Strategy

All mock data is centralized in `TeaserConfig.ts`:

- `HERO` — `id: 'hero-aldric'`, `attack: 15`, `defense: 8`, `magic: 12`, `portrait: '/portraits/aldric.png'`.
- `POIS` — `trainingGrounds` (low risk, +defense), `forgottenRuins` (high risk, artifact).
- `ASTROLABE` — `skills: [{ stat: 15, difficulty: 18 }]`, `config: { dead: 5, wound: 10 }`, forced outcome `wound`.
- `LEGACY` — `['Ancient Artifact', 'Sacred Altar Blueprint', 'Surviving Heroes']`.
- `TIMING` — scene durations in ms.

No `PersistenceService`, no `useIdleVillageConfig`, no real engine `tick`. The teaser page bypasses all of them.

### 3.6 Visual Style

- Use the **Wanderlust surface system** (`WanderlustSurface`, `WanderlustContent`, `WanderlustHeading`, `WanderlustPortrait`, `WanderlustStatBar`) for all chrome.
- Background palette: `#060604` void, bronze/gold accents, deep teal shadows (see `public/wanderlust-mockup.html` and `art_direction_plan.md`).
- Typography: `Cinzel` for display, `EB Garamond` for body.
- Transitions: CSS `opacity`/`transform` with `cubic-bezier(0.4, 0, 0.2, 1)`; 800ms for scene cuts.

### 3.7 Recording Guardrails

- All animations are deterministic (no random physics or `Math.random()` unless seeded).
- `DestinyAstrolabe` runs with `autoThrow` and a mocked `onResolve` that forces the injury outcome.
- No loading states, no async data fetches.
- The page exposes `window.__teaserController` for external automation (e.g., record scripts).

---

## 4. Implementation Plan

1. **Day 1 — Scaffolding**
   - Create `src/ui/teaser/` directory and `TeaserConfig.ts`.
   - Create `TeaserSceneController.ts` and `TeaserShowcase.tsx`.
   - Add `/teaser-showcase` route in `App.tsx`.
   - Verify the route loads with `npm run build:check`.

2. **Day 2 — Scene Composites**
   - Build `TeaserMapScene`, `TeaserVillageScene`, `TeaserChoiceCard`.
   - Wire `WanderlustSurface` and `WanderlustHeading`.
   - Mock `QuestPOI` / `LocationCard` with static props.

3. **Day 3 — Hero, Drag & Astrolabe**
   - Build `TeaserHeroSheet` and `TeaserDragOverlay`.
   - Integrate `DestinyAstrolabe` with forced outcome.
   - Build `TeaserOutcomeCard`.

4. **Day 4 — Consequence, Legacy, Outro**
   - Build `TeaserImpactOverlay` and greyscale village.
   - Build `TeaserLegacyScreen` and `TeaserOutroScreen`.
   - Add `WISHLIST NOW ON STEAM` button.

5. **Day 5 — Polish & Controls**
   - Add keyboard controls, autoplay, and debug timer.
   - Add `window.__teaserController` automation hooks.
   - Run lint, build, and visual regression.

---

## 5. Documentation & Traceability

- This plan: `src/docs/docs/plans/wanderlust_triumph_steam_concept_slice_plan.md`
- Update `src/docs/docs/MASTER_PLAN.md` with a new `Wanderlust Triumph — Steam Concept Slice` section.
- Evidence log: `test-results/wanderlust-triumph-teaser-<date>.log`.

---

## 6. Open Questions

1. Should the `MapPage` be used directly, or is a simplified `TeaserMapScene` with `LocationCard` components preferred?
2. Should the existing `WanderlustMockupPage` (`/wanderlust`) be replaced or left as a separate design mock?
3. Which exact portrait assets are available for the hero and surviving heroes?
4. Does the user want the `/teaser-showcase` route visible in the nav bar, or hidden and accessed by URL only?
