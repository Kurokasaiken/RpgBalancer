# Day/Night Cycle System - Trusted Contract

## Metadata
- Status: `trusted`
- Area: `time`
- Canonical Name: `Day/Night Cycle System`
- Primary Files:
  - `src/ui/idleVillage/frozen/kits/poiKit.tsx` (certified kit export)
  - `src/ui/idleVillage/components/minimal/DayNightPOI.tsx` (canonical component)
  - `src/ui/idleVillage/components/minimal/DayNightPoiSkin.tsx` (canonical component)
  - `src/ui/idleVillage/map/actionCards/DayNightActionCard.tsx`
  - `src/ui/idleVillage/skins/dayNightPoiSkinConfig.ts`
  - `src/store/useMinimalGameplay.ts` (state integration)
- Runtime/Test Pages:
  - `/minimal-gameplay` (primary)
  - `/idle-village` (secondary)
  - `/poi-quest-detail-roster-time-clock` (UI integration, RT-DAYN-002)
- Last Certified: `2026-08-15`
- Last Updated By: `Devin (DOC-DAYN-STATUS-002)`
- Related Contracts:
  - `[Time Engine Contract](time_engine_trusted.md)`
  - `[Minimal Gameplay Store](../minimal_gameplay_implementation_plan.md)`
  - `[Frozen Kits Pattern](../../../../ui/idleVillage/frozen/README.md)`
  - `[POI Quest Roster Time Clock Page](../poi_quest_detail_roster_time_clock_page_workflow.md)`
- Notes: `RT-DAYN-002: runtime UI tests pass on /poi-quest-detail-roster-time-clock for halo progress, pause and day/night transition.` SVG `metalNoiseId` now clips `feTurbulence` to the source circle with `feComposite in="mono" in2="SourceGraphic" operator="in"` to avoid rectangular alpha artifact on the core medallion. Progress halo `stroke-linecap` changed from `round` to `butt` to eliminate the starting dot / "quadratino" at the 12 o'clock origin.

## 1. Purpose
The Day/Night Cycle System provides visual representation and control of the game's temporal progression. It displays the current phase (day/night), progress through the phase, and allows users to pause/resume the cycle. The system integrates with the Minimal Gameplay store to maintain temporal state consistency across the application.

## 2. Source of Truth
**Authoritative State Source**: `useMinimalGameplay` store
- `state.isDayPhase`: Boolean indicating current phase (true = day, false = night)
- `state.cycleProgress`: Number 0-1 representing progress through current phase
- `state.isPaused`: Boolean indicating if the cycle is paused
- `state.currentTick`: Integer tick count (primary source for phase calculation)

**Configuration Source**: `config.globalRules.dayNightCycle`
- `dayTimeUnits`: Number of ticks for day phase
- `nightTimeUnits`: Number of ticks for night phase

**Visual Configuration**: `dayNightPoiSkinConfig.ts`
- Presets for visual appearance (colors, sizes, animations)
- Default preset: `minimal_frontier_daynight_poi`

**Non-Authoritative Sources**:
- Local component state (only for temporary UI calculations)
- Direct time calculations (must use store values)
- Hardcoded visual parameters (must use config presets)

## 3. Canonical Runtime Contract

### Deve
- Read all temporal state from `useMinimalGameplay` store
- Calculate phase and progress based on `currentTick` and `dayNightCycle` config
- Display appropriate icon (sun for day, moon for night, pause bars for paused)
- Show progress halo with accurate 0-1 progress through current phase
- Emit telemetry events on phase transitions
- Support pause/resume functionality through store actions
- Use Style Laboratory tokens for all visual styling
- Maintain visual consistency with POI family components

### Non deve
- Maintain independent temporal state
- Calculate time using local timers or intervals
- Hardcode phase durations or visual parameters
- Skip progress updates during paused state
- Use legacy CSS classes instead of Style Laboratory tokens
- Create duplicate event systems outside the store

## 4. Visual Contract

### POI Family Membership
**The Day/Night Cycle System belongs to the POI family of world-state indicators** and must follow the same visual grammar, halo conventions, and identity expectations as other POI components. Any deviation from POI family visual patterns constitutes a regression.

### Required Visual Elements
1. **Progress Halo**: Circular progress indicator showing 0-1 progress
2. **Phase Icon**: Sun (day), Moon (night), or Pause bars (paused)
3. **Color Coding**: 
   - Day: Gold/amber palette (`#E3B24C`, `#F2C14E`)
   - Night: Purple/indigo palette (`#7C5CFF`, `#8B5CF6`)
   - Paused: Gray palette (`#8E97A8`)
4. **Bloom Effect**: Subtle glow with configurable intensity
5. **Decorative Marks**: 8 position markers at cardinal and intercardinal points

### Visual States
- **Day Running**: Gold ring, sun icon, full bloom intensity
- **Night Running**: Purple ring, moon icon, reduced bloom
- **Paused**: Gray ring, pause icon, minimal bloom (0.34 opacity)
- **Transitions**: Smooth 220ms opacity changes between phase icons

### Runtime test attributes (DayNightPoiSkin)
The skin exposes deterministic `data-*` attributes on the root `svg` for UI contract testing:
- `data-testid="day-night-poi-skin"` — root SVG locator
- `data-phase="day" | "night"` — current phase
- `data-paused="true" | "false"` — paused state
- `data-progress="0..100"` — rounded percentage of progress through the current phase

### Forbidden Visual Outcomes
- Missing progress indication
- Incorrect phase icon for current state
- Fallback to placeholder graphics
- Inconsistent color palettes
- Broken progress calculations

## 5. Interaction Contract

### Click/Touch
- **DayNightActionCard**: Toggle pause/resume cycle
- **DayNightPOI**: Visual-only, no interaction (world-state POI)

### Hover
- **DayNightPOI**: Subtle scale increase (1.02x) with transition
- **DayNightActionCard**: Standard button hover feedback

### Drag/Drop
- Not applicable (world-state POI, not draggable)

## 6. Data / Props Contract

### DayNightPOI Component Props
```typescript
interface DayNightPOIProps {
  // No direct props - reads from useMinimalGameplay store
}
```

### DayNightPoiSkin Props
```typescript
interface DayNightPoiSkinProps {
  isDayPhase: boolean;        // From store
  cycleProgress: number;      // 0-1 from store
  isPaused: boolean;          // From store
}
```

### DayNightActionCard Props
```typescript
interface DayNightActionCardProps {
  phaseIcon: ReactNode;       // Sun/moon icon
  isPlaying: boolean;        // !isPaused
  progressFraction: number;  // cycleProgress
  totalSeconds: number;       // Phase duration in seconds
  onToggle: () => void;       // pause/resume action
  // ... optional styling props
}
```

## 7. Integration Rules

### With Minimal Gameplay Store
- Must use `useMinimalGameplayWithIdleVillageConfig()` hook
- Must read `state.isDayPhase`, `state.cycleProgress`, `state.isPaused`
- Must call `pauseGame()`/`resumeGame()` for user interactions
- Must listen to store updates for reactive rendering

### With Style Laboratory
- Must use `useSkinPreferences()` for preset selection
- Must resolve preset via `resolveDayNightPoiPresetId()`
- Must apply visual tokens from `getDayNightPoiSkinForPreset()`

### With Telemetry System
- Must emit `day_night_transition` events on phase changes
- Must include `fromPhase`, `toPhase`, `day`, `cycleProgress` in payload
- Must emit pause/resume events with current state context

## 8. Acceptance Criteria
- [ ] Runtime correctly displays current phase from store
- [ ] Progress accurately reflects 0-1 position in current phase
- [ ] Phase transitions trigger telemetry events
- [ ] Pause/resume functionality works through store
- [ ] Visual styling uses Style Laboratory tokens
- [ ] No hardcoded temporal parameters
- [ ] Component renders correctly in minimal gameplay page
- [ ] `data-testid`, `data-phase`, `data-paused`, `data-progress` attributes are emitted for UI contract tests
- [ ] Visual consistency maintained across all states

## 9. Verification

### Runtime verification
1. Navigate to `/minimal-gameplay` and verify POI shows correct phase
2. Trigger pause/resume and verify visual state changes
3. Monitor console for `day_night_transition` telemetry events
4. Verify progress halo advances smoothly during gameplay
5. Test phase transitions at day/night boundaries

### Test files
- `src/ui/idleVillage/map/actionCards/DayNightActionCard.test.tsx`
- Integration tests in `src/store/__tests__/useMinimalGameplay.test.ts`

### Evidence
- `test-results/doc-dayn-trusted-doc-2026-04-22.log`

## 10. Anti-Patterns / Forbidden Outcomes
- Do not introduce local timers for time calculations
- Do not use placeholder JSX as final solution
- Do not hardcode phase durations or visual parameters
- Do not duplicate temporal state in components
- Do not bypass the Minimal Gameplay store
- Do not use legacy CSS classes instead of Style Laboratory tokens
- **Do not drift from POI family visual grammar** (halo conventions, identity patterns, progress indicators)

## 11. Change Policy
Since this component is `trusted`, any modification to:
- behavior (phase calculation, progress tracking)
- visual grammar (colors, icons, animations)
- runtime contract (store integration, props interface)
- source-of-truth usage (store access patterns)

requires:
1. Update of the component code
2. Verification of runtime behavior
3. Update of this trusted documentation
4. Update of related tests if necessary
5. Evidence log with verification results

## 12. Change Log

### 2026-08-15 (SVG metal-noise alpha-bleed fix)
- **STATUS**: Visual fix applied to `DayNightPoiSkin` core medallion
- **Problem**: `feTurbulence` noise in the `metalNoiseId` filter produced a rectangular (square) alpha artifact that protruded from the core medallion region, visible in both `/minimal-clock` and `/poi-quest-detail-roster-time-clock`.
- **Root cause**: The SVG filter generated noise across its rectangular filter region; the output was not composited against the circular `SourceGraphic`, so the unclipped noise produced a visible square.
- **Fix**: Added `feComposite in="mono" in2="SourceGraphic" operator="in"` after `feColorMatrix` in the `metalNoiseId` filter. This clips the monochrome noise to the opaque area of the source circle.
- **Verification**: `npm run build:check` passes; Playwright screenshots of `/day-night-poi-skin-debug` and `/minimal-clock` show the square gone while the core medallion still retains its metal grain.
- **Evidence**: `test-results/minimal-clock-metal-noise-fix.png`

### 2026-08-15 (Progress halo starting dot fix)
- **STATUS**: Visual fix applied to `DayNightPoiSkin` progress halo
- **Problem**: When time starts and `cycleProgress` is near 0, the progress halo at the 12 o'clock origin showed a round starting dot (perceived as a small square/dot) because `stroke-linecap` was `round`.
- **Root cause**: `stroke-linecap="round"` draws a semicircle at each end of a `stroke-dasharray` segment; when the dash is tiny, the two round caps overlap and create a visible dot at the top of the halo.
- **Fix**: Changed the progress halo `<circle>` from `strokeLinecap="round"` to `strokeLinecap="butt"`. With `butt`, the stroke begins cleanly from the top with no dot; the full ring is still a closed circle because at `progress === 1` the dash covers the entire circumference.
- **Verification**: `npm run build:check` passes; Playwright progression screenshots at `/day-night-poi-skin-debug` (progress 3%, 8%, 100%) show the halo starting clean from 12 o'clock.
- **Evidence**: `test-results/debug-progress-5.png` (now clean origin)

### 2026-08-15 (Generic POI and magic circle halo dot fix)
- **STATUS**: Visual fix applied to `GenericPoiSkin` and `MagicCircleHalo`
- **Problem**: On `/poi-quest-detail-roster-time-clock`, the quest medallion showed an unwanted bright dot at the top of the ring both at rest and as time started. Two independent `stroke-linecap="round"` instances caused the dot:
  1. The decorative rim arc in `GenericPoiSkin` (`strokeDasharray="22 71"` / `20 100`) used `round` caps, producing a dot where the short arc started.
  2. The hidden meniscus `<circle>` (`strokeDasharray="0 1000"`) used `round` caps, so a zero-length dash still rendered a round cap as a dot.
- **Root cause**: `round` caps always append a semicircle at the end of a dash. When the dash is tiny or zero, that semicircle collapses to a visible dot.
- **Fix**: Changed `GenericPoiSkin` decorative rim `ellipse`/`circle` and meniscus `circle` to `strokeLinecap="butt"`. Also changed `MagicCircleHalo` glyph paths and `HaloProgressComponent` progress circle to `butt` for the same reason.
- **Verification**: `npm run build:check` passes; Playwright screenshot of `/poi-quest-detail-roster-time-clock` shows the top dot gone while the medallion and halo still render correctly.
- **Evidence**: `test-results/poi-quest-square-0.png` (dot removed)

### 2026-08-15 (Day/Night binario/outer guide and progress track removal)
- **STATUS**: Visual fix applied to `DayNightPoiSkin`
- **Problem**: The day/night clock showed a faint circular track ("binario") around the medallion at all times, which became more prominent as time started and remained after pausing. A second track ring was also rendered inside the progress halo layer. Both violated the FROZEN contract that no ring/track may telegraph the path at progress 0.
- **Root cause**:
  1. The `Layer 2: outer guide` `<circle>` was always drawn with `opacity: 0.16` regardless of `progress`.
  2. The `Layer 3: progress halo` group contained a separate static track ring (`opacity: 0.14`) behind the animated progress arc.
- **Fix**:
  1. Left `Layer 2: outer guide` intentionally empty while keeping the layer flag for the debug page; the visual circle is no longer rendered.
  2. Removed the static track `<circle>` from `Layer 3: progress halo`, keeping only the animated progress arc. The arc itself already hides with `g opacity: 0` when `progress < 0.01`.
- **Verification**: `npm run build:check` passes; Playwright screenshots of `/day-night-poi-skin-debug` at progress 0% and 35% show no track/binario and a clean halo start.
- **Evidence**: `test-results/daynight-debug-0.png`, `test-results/daynight-debug-35.png`

### 2026-04-24 (RT-DAYN-001 Audit Completed)
- **STATUS**: Full compliance verified - implementation already aligned with trusted contract
- **Audit Methodology**: Candidate reference approach - preserved existing compliant implementation
- **Compliance Verification**: All 8 acceptance criteria met (state integration, progress tracking, visual styling, etc.)
- **Modifications Applied**: 
  - Added comprehensive JSDoc documentation to all components per project philosophy
  - Fixed component usage pattern in MinimalGameplayPage (use DayNightPOI wrapper)
  - Enhanced documentation coverage for interfaces and functions
- **Key Findings**: 
  - State integration: All components correctly use `useMinimalGameplayWithIdleVillageConfig()`
  - Visual compliance: POI family grammar maintained, Style Laboratory tokens used
  - Time layer separation: No local timers, authoritative store usage verified
  - Anti-pattern compliance: Zero violations of forbidden patterns
- **Evidence**: `test-results/rt-dayn-001-alignment-2026-04-24.log`

### 2026-01-20 (Kit Pattern Adoption)
- **STATUS**: Kit pattern adopted for Day/Night components
- **Changes Applied**:
  - DayNightPOI now exported from `src/ui/idleVillage/frozen/kits/poiKit.tsx`
  - All pages updated to import from kit instead of direct minimal path
  - Barrel export created at `src/ui/idleVillage/frozen/kits/index.ts`
  - ESLint rule enforces kit imports over deep imports
- **Impact**: Single source of truth maintained, propagation via re-export
- **Evidence**: Kit refactoring completed, all imports verified

### 2026-04-22
- Initial trusted documentation creation
- Analyzed existing day/night implementation
- Defined canonical contracts and integration rules
- Established Style Laboratory token requirements
- Created verification criteria and acceptance tests

---

**Governance Note**: This document serves as the single source of truth for the Day/Night Cycle System. All implementations must conform to this contract. Changes to runtime behavior require corresponding updates to this documentation.
