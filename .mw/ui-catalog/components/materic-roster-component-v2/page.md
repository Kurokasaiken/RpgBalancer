# materic-roster-component-v2 — Roster stage panel (V2)

> PLAN-086. The resident roster, V2 canonical line: a stage-zone-managed
> panel (`data-stage-panel="roster"`, left wing / lower-left of `/game`)
> rendering `ResidentRosterPanelV2` inside `MatericSkinProvider`
> (`MatericRosterComponentV2` → `RosterDraggableV2` with
> `useWanderlustSkin`). It is also the party picker: when the quest
> planner opens, the same panel force-opens beside it.

## What it is / does

- **Panel** (`data-testid="resident-roster-panel"` on the V2 root;
  `data-stage-panel="roster"` on the stage-zone frame from
  `useGameStageZones`): inline single-line header —
  `[⋮⋮]` GripVertical drag handle (positional window dragging) ·
  Roster `n/m` count · filter dropdown (`rosterFilterConfig`
  `FilterStatKey`s) · sort dropdown (`rosterSortConfig`) · collapse `−`.
  Post-freeze canonical design: no quick-filter buttons, minimal gaps,
  streamlined DOM.
- **Cards**: `WanderlustRosterCardV2` rows (one-line strips in
  `density="compact"`), drag-and-drop routed through
  `ResidentRosterPanelV2` + `CustomDragOverlay`; drops validated by
  `residentDropRules`, feedback via `DropFeedbackHUD`; eligibility
  reasons carry dedicated roster copy keys (QoL-9, R-281).
- **Locked residents** (`lockedResidentIds`): shown as Away/«Assigned»,
  non-interactive — the same panel serves the party-pick surface.
- **Open affordances**: `r` shortcut or the Panels menu
  (`hudPanelRegistry` — `roster`, listed); inside the village surface
  `r` is owned by the village registry instead (VillageScreenView guard).
- **Party-pick**: `S6_QuestPlanner` opens the expedition planner via the
  declared hook-assisted `revealQuestPois` + `expedition.openDetail`
  seam; the roster mounts as the planner's LEFT WING (companions
  roster — drags and keyboard drops land on party slots,
  `QuestExpeditionDetail` header note). The panel ignores outside clicks
  that land on `[data-testid="resident-roster-panel"]`
  (`QuestExpeditionDetail.tsx` ~L484).
- Stage anchor: bottom-left box `config.roster.{leftPx,bottomPx,widthPx}`
  in `gameFrameConfig` (`GameFrame.tsx` ~L645); the anchor deliberately
  has no shadow/baseline transform — the roster carries its own.

## Declared states

| id | driver | observable assertion |
|---|---|---|
| `default` | surface+key `S1_WorldMapIdle` + `r` | `[data-stage-panel="roster"]` or `resident-roster-panel` visible |
| `party-pick` | surface `S6_QuestPlanner` (hook-assisted `openDetail`) | `resident-roster-panel` visible beside the planner |

Both states **pass** — status `documented` (V1). Reach trail for
`party-pick` (`ctx-a.json`): `planner:hook-assisted:openDetail`.
(`expedition.demoLaunch` — the quest-run seam — is broken on this
build/TDZ and is NOT used by this component's states.)

## Capture (V1)

- `shots/V1/meta.json` — frozen build, sourceSha `80aaec6c`, sourceHash
  `c5cdce3c4865ec1f`, metal backend, 1440×900, reduced-motion,
  0 console errors / 0 network failures.
- `captureSelector`: `[data-stage-panel="roster"]` (stage frame incl.
  wing placement) → `iso-0`; `resident-roster-panel` (bare panel)
  → `iso-1`. Same pair captured for `party-pick`.
- `deterministicSameBytes: false` on both states — live map/clock;
  recorded as data, not pass/fail.
- Not exercised: drag/drop interaction, compact density flag,
  collapse/expand, roster filters (single-frame captures only, T-04:
  motion unproven).

## Links

- Source: `src/ui/idleVillage/rosterV2/MatericRosterComponentV2.tsx`
  (provider wrapper), `RosterDraggableV2.tsx`,
  `ResidentRosterPanelV2.tsx` (`resident-roster-panel` testid L122),
  `DragTestContainerV2.tsx` (header/list, L54 ASCII contract),
  `VillageRosterSectionV2.tsx`; stage anchor in
  `components/gameFrame/GameFrame.tsx` L645-666, zone frame in
  `stageZones/useGameStageZones.tsx` L459.
- Config: `config/rosterFilterConfig.ts`, `config/rosterSortConfig.ts`,
  `residentDropRules.ts`, `config.roster` in `gameFrameConfig.ts`.
- Contract: `.mw/contracts/components/materic-roster-component-v2.md`.
- Trusted roster index: `src/docs/docs/idle_village/roster_trusted_components.md`
  (import via `src/ui/idleVillage/roster/index.ts`).

## Art-direction slice (rubric rev 1)

`panel` → ART-DIRECTION L1+L2 + token section: Wanderlust/materic skin
inside `MatericSkinProvider`, engraved header glyphs, one-line resident
strips; the panel lies on the stage as a physical object (own shadow),
not a floating dashboard card.
