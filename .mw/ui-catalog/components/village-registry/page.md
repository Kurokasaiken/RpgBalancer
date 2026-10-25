# village-registry — Settlement Registry drawer

> PLAN-086. Right-edge slide-over inside the **village surface**
> (`VillageScreenView`): the full building catalog — painted pins and
> registry-only specials in one visual grammar (PLAN-042, artifact r005,
> R-206). It is the legend that teaches how to read the painted village.

## What it is / does

- **Drawer** (`data-testid="village-registry"`, `role="complementary"`,
  `HudPlaque`): closed by default, `aria-hidden` mirrors open state,
  transform-only animation with a `prefers-reduced-motion` fallback.
- **Open affordances** (both input-reale): the `village-registry-chip` in
  the village toolbar, or the `r` hotkey — guarded: only while the village
  surface is mounted, no modifiers, target not typing, not inside another
  `[data-hud-panel]` (`VillageScreenView.tsx` ~L306).
- **Rows** (`data-registry-row="<catalogId>"`): icon-first but never
  icon-only — category pin frame (`PIN_FRAME_FOR_CATEGORY`), state badge
  (locked 🔒 / buildable ◆ / built level in Roman numerals), always-visible
  localized name, trailing state glyph, on-map/off-map marker. Clicking a
  *painted* row pins the stage building tooltip (same trigger path as the
  pin itself, R-270); clicking a *registry-only* row drills into an
  in-drawer detail card (`village-registry-card`, `role="dialog"`) — a
  pushed child view, the only focus-trapped layer.
- **Sections**: grouped by category (`data-registry-section`) with
  collapsible headers (`aria-expanded`) and built/total counts; only
  sections containing a buildable entry start expanded. Filter pills
  (`all|locked|buildable|built`, `aria-pressed`) sit over the list.
  Deterministic config order — no search, no virtualization.
- **Scroll fold invariant** (INV-1): the fold boundary lands only on
  section headers or row edges (`FOLD_BOUNDARY_SEL`), never mid-element.
- **Cross-surface sync**: `activeId` lights the row matching the hovered
  stage pin; `VillageRegistryHandle` exposes `escape()` (detail card first,
  then drawer — focus returns to the originating row), `scrollToRow`,
  `focusRow`.
- **Scope-leak guard** (R-234 / contract `village-registry` INV): the
  drawer mounts inside `data-hud-controls`, whose control-pill rule would
  squeeze rows into 26 px caps pills — rows and headers state their own
  geometry via `LIST_BUTTON_RESET` inline styles (`tests/unit/idleVillage/
  villageRegistry.scopeLeak.test.tsx`).

## Declared states

| id | driver | observable assertion |
|---|---|---|
| `default` | surface `S3_VillageRegistry` (village nav → registry chip, input-reale) | `[data-testid="village-registry"]` visible |

State **passes** — status `documented` (V1).

## Capture (V1)

- `shots/V1/meta.json` — frozen build, sourceSha `80aaec6c`, sourceHash
  `53f174ab4a55f037`, metal backend, 1440×900, reduced-motion,
  0 console errors / 0 network failures.
- Reach trail (`ctx-a.json`): `village:input-reale:nav-plinth` →
  `registry:input-reale:chip`.
- `captureSelector`: `[data-testid="village-registry"]` (whole drawer)
  → `iso-0`; `[data-testid="village-registry-list"]` (scrollable list)
  → `iso-1`.
- `deterministicSameBytes: false` — expected (drawer slide settle +
  live surface); byte-compare recorded as data, not pass/fail.
  `ctx-a` may catch the tail of the slide-in; `ctx-b` is the settled
  frame.

## Links

- Source: `src/ui/idleVillage/components/gameFrame/VillageRegistry.tsx`
  (drawer ~L435, list L498, detail card L595), opened by
  `VillageScreenView.tsx` (chip + `r` hotkey ~L306).
- Config: `src/balancing/config/idleVillage/villageBuildingsConfig.ts`
  (`VILLAGE_REGISTRY`, `BUILDING_CATEGORIES`, `toRomanLevel`).
- Contract: `.mw/contracts/components/village-registry.md`.
- Surface driver: `S3_VillageRegistry` in
  `scripts/sentinel/gameSurfaceHarness.ts` `GAME_SURFACE_GRAPH` (L841).

## Art-direction slice (rubric rev 1)

`panel` → ART-DIRECTION L1+L2 + token section: Lacquer Atlas drawer,
category pin frames, engraved state badges, serif row names — materia,
not flat colour; rows own their geometry (no pill squeeze).
