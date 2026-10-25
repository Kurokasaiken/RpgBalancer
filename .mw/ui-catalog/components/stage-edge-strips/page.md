# stage-edge-strips — Stage edge strips: collapsed-panel tabs and wing rails

> PLAN-086. The fullscreen strips layer of the stage-zone solver
> (`data-stage-strips`): edge tabs to re-expand collapsed stage-managed
> panels (`data-hud-strip-tab`) and thin wing rails (`data-stage-rail`)
> painted where a wing zone is squeezed ≤ `wingRailPx`.

## What it is / does

- Always mounted (`position:fixed; inset:0`, z = `zLayers.panels`,
  `pointer-events: none` on the container); `aria-hidden` only while it
  holds no tabs.
- **Strip tabs**: one vertical (wing) or horizontal (center) button per
  collapsed panel — grab cursor, drag-enabled pointerdown, panel name via
  `aria-label` (`gameFrame.stage.expandPanel`); expansion fires on
  pointerup so a drag never double-fires.
- **Wing rails**: hairline `--skin-hud-row-filet` rules marking a
  squeezed `leftWing`/`rightWing` zone (`0 < w <= wingRailPx`); zero-width
  zones own no edge (phantom-filet fix documented inline).
- Rendered by `useGameStageZones` inside the game frame; populated only
  when a stage-managed panel is collapsed or a wing is squeezed.

## Declared states

| id | driver | observable assertion | result |
|---|---|---|---|
| `default` | surface `S6_QuestPlanner` (`expedition.openDetail` → `quest-expedition-detail`) | `[data-stage-strips]` visible | **passed*** |

\* The asserted node is the always-mounted container. At the moment of the
capture the expedition planner was open (`howStateReached:
planner:hook-assisted:openDetail`); whether strip tabs/rails were actually
populated inside the container is **not separately verified** — see
`fixes.md`. At S1 idle a probe counted `0` `data-hud-strip-tab` and `0`
`data-stage-rail` (expected: nothing collapsed).

## Capture (V1)

- `shots/V1/meta.json` — sourceSha `80aaec6c`, sourceHash `de3b4aa1d79566c6`,
  metal backend, 1440×900, reduced-motion, captured 2026-10-24T23:07:46Z.
- `default-ctx-a.png` / `default-ctx-b.png` — full surface with the quest
  expedition detail open; `default-iso-0.png` — the strips layer element
  (fullscreen container ⇒ iso ≈ ctx shot).
- `deterministicSameBytes: false` — recorded as data.

## Fixes

See `fixes.md` — optional assertion strengthening toward the populated
regime (`data-hud-strip-tab`/`data-stage-rail`) and a collapse driver.

## Links

- Contract: none linked in the manifest.
- Scope: `src/ui/idleVillage/components/gameFrame/stageZones/useGameStageZones.tsx`
  (strips layer ~L565-600).

## Art-direction slice (rubric rev 3)

`overlay` → hairline filet rails and labelled edge tabs on skin tokens;
wayfinding chrome (level-2 info), no decorative weight — the container
itself draws nothing when empty.
