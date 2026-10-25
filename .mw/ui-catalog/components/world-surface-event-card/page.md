# world-surface-event-card — World event card + goblin invasion sticker/marker

> PLAN-086. The Goblin Invasion announcement card shown at the peak of the
> event shroud on `/game`, plus the sticker that detaches onto the map and
> the `invasion-goblin-marker` it hands over to. Documented **partial**:
> the declared driver is unreachable on this build — see `fixes.md`.

## What it is / does

- `WorldSurfaceEventCard` mounts at `shroudCovered` + `cardDelayMs`
  (`game-frame-pixi.tsx` ~L1567): a `MatericEventCard` with the bordered
  `GoblinInvasionWindow` (`data-testid="goblin-window-sticker"`) and the
  card body `data-testid="world-event-card-body"`.
- After the player confirms: `peeling` → `falling` (sticker lands on the
  map anchor) → `marching`; in screen mode the sticker flies to
  `landingSelector="[data-testid='invasion-goblin-marker']"` and hands over
  via `onLand` — only one goblin is ever drawn. The marker
  (`game-frame-pixi.tsx` ~L1063) then walks the march progress on the game
  clock and is restored from the `INVASION_KEY` persisted record.
- While the theatre runs the clock is frozen (`timeFrozen`, R-*event
  theatre holds the clock* ruling) and the HUD wakes on `hudWakeSignal`.

## Declared states

| id | driver | observable assertion | result |
|---|---|---|---|
| `default` | surface `S15_GoblinInvasionEvent` (advance game clock ≤120 s, poll `invasion-goblin-marker`) | `invasion-goblin-marker` / `world-event-card-body` / `goblin-window-sticker` visible | **documented_partial — driver unreachable**: no invasion armed in the fresh-session save within the 120 s budget (`reached: false`) |

## Capture (V1)

- `shots/V1/meta.json` — sourceSha `80aaec6c`, sourceHash `40766eb77d5fdd69`,
  metal backend, 1440×900, reduced-motion, captured 2026-10-24T22:58:45Z.
- **No shots** — the documenter captures only on asserted states; `meta.json`
  records `reached: false, asserted: false`.
- The manifest note records that the card+sticker were already visible at
  S1 on the audited build — that depended on a save with the invasion
  already in progress; a fresh headless session has none.

## Fixes

See `fixes.md` — suggested `script` driver through the existing
`__idleVillageTestHooks.startInvasion` E2E seam (verified mounted on this
build) instead of waiting for a natural trigger.

## Links

- Contract: `.mw/contracts/components/world-surface-event-card.md`
- Scope: `src/ui/idleVillage/components/WorldSurfaceEventCard.tsx`,
  `src/ui/idleVillage/components/GoblinInvasionWindow.tsx`,
  `src/pages/game-frame-pixi.tsx`.

## Art-direction slice (rubric rev 3)

`overlay` → materic event card + painted goblin theatre; an in-world
object (sticker lands and marches), not a modal dialog — state transitions
are staged animation, not tint changes.
