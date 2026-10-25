# hud-event-ledger — Event ledger panel

> PLAN-086. Stage-zone-managed panel (`data-stage-panel="events"`, right
> wing of `/game`): the «what is coming» list — several upcoming events in
> a small ordered panel, sortable by due date or grouped by type. Replaces
> the single hanging reminder tag. Reached by the `e` shortcut or the
> Panels menu (`hudPanelRegistry` — `events`, listed).

## What it is / does

- **Surface**: `HudPlaque` under the lacquer material, `HudPanel`
  otherwise (`useHudMaterial`), `as="section"`, fixed 300 px width;
  draggable by its header via `useHudPanelDrag`. Every measure is a
  Roster token — the ledger must read as the same family as the Roster
  panel, not as a second one.
- **Header**: display-caps title (`gameFrame.events.title`) + tabular
  event count; sort segmented control (`role="group"`,
  `due`/`type`, `aria-pressed`), close X (`EngravedIcon cmd-close`).
  Sort and expand emit `event_ledger_sort` / `event_ledger_expand`
  telemetry.
- **Rows** (`data-event-id`, `data-event-type`, `data-urgent`): a
  three-column strip — tone-coloured `HudGlyph` type icon · serif title
  (2-line clamp, full text in `title`) · tabular countdown
  («today» when `daysLeft <= 0`). Sort `due` = daysLeft then type
  priority; sort `type` groups rows under per-type labels in priority
  order.
- **Severity reads before words**: `danger`-tone types get a left tone
  edge; rows within `config.urgentWithinDays` light the countdown in the
  type colour (+ a faint danger wash). The panel stays quiet until
  something needs attention; unknown `typeId`s fall back to a neutral
  `other` type (`FALLBACK_TYPE`, priority 99).
- **Collapse contract**: collapsed shows `config.maxVisibleRows` with
  `pinTypesWhenCollapsed` (threats) always making the cut; «show more
  (N)»/`«show less»` toggles (`aria-expanded`). `arriving` rows keep
  their place but stay invisible until the announcement card hands over
  (opacity transition, not layout).
- **Rows actionable** only when the host passes `onSelect` (role=button,
  Enter/Space, camera pan); otherwise inert list. Empty state is a single
  serif line (`gameFrame.events.empty`).

## Declared states

| id | driver | observable assertion |
|---|---|---|
| `default` | surface+key `S1_WorldMapIdle` + `e` | `[data-stage-panel="events"]` visible |

State **passes** — status `documented` (V1).

## Capture (V1)

- `shots/V1/meta.json` — frozen build, sourceSha `80aaec6c`, sourceHash
  `f60746af819f2cef`, metal backend, 1440×900, reduced-motion,
  0 console errors / 0 network failures.
- `captureSelector`: `[data-stage-panel="events"]` → `iso-0`
  (stage frame incl. wing placement).
- `deterministicSameBytes: false` — live map/clock behind the panel;
  recorded as data, not pass/fail.
- Not exercised: `type` sort grouping, expanded «show more», urgent
  `data-urgent` rows (needs dated events on this build), `arriving`
  handover — no seeded-event seam documented yet (see hud-top-tabs
  `event-imminent` partial for the same gap).

## Links

- Source: `src/ui/idleVillage/components/gameFrame/HudEventLedger.tsx`,
  `nextEvent.ts` (next-event selector feeding the top tab).
- Config: `DEFAULT_GAME_FRAME_CONFIG.eventLedger`
  (`types`, `defaultSort`, `maxVisibleRows`, `pinTypesWhenCollapsed`,
  `urgentWithinDays`) in
  `src/balancing/config/idleVillage/gameFrameConfig.ts`; tones via
  `hudTones.ts` `HUD_TONE_COLOR`.
- Contract: `.mw/contracts/components/hud-event-ledger.md`.
- Panel flag: `hudPanelRegistry.ts` (`events`, shortcut `e`); stage frame
  `stageZones/useGameStageZones.tsx` (`data-stage-panel` L459).

## Art-direction slice (rubric rev 1)

`panel` → ART-DIRECTION L1+L2 + token section: Roster-family strips —
gold filet borders, engraved type glyphs, tone as left edge + countdown
colour (materia-coded severity), caps only in header/filters.
