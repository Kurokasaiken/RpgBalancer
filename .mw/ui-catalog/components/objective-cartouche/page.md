# objective-cartouche — Current-objective cartouche (top-left)

> PLAN-086. A `HudPlaque shape="hang"` slip under the top edge: one
> uppercase `hud-objective-label` + one parchment sentence saying what to
> do now, optionally clickable. Documented **partial** — the component is
> absent *by design* on `/game` today; the documenter cannot assert
> absence. See `fixes.md`.

## What it is / does

- `ObjectiveCartouche` returns `null` when no `objective` prop is passed —
  the corner stays free (the "no objects" rule: no pin, no tilt).
- On `/game` the page mounts the slot but never feeds an objective, so the
  cartouche does not render — verified in DOM: `[aria-labelledby="hud-objective-label"]`
  **not in DOM** at S1 (probe 2026-10-24).
- When fed: slides in from the edge (opacity+translateY, 500 ms), label in
  Cinzel uppercase, sentence in EB Garamond on `--skin-hud-parchment`,
  button disabled when `onSelect` is omitted (read-only note).

## Declared states

| id | driver | observable assertion | result |
|---|---|---|---|
| `default` | surface `S1_WorldMapIdle` | `[aria-labelledby="hud-objective-label"]` `visible:false` | **documented_partial — assertion semantics unsupported**: `checkAssertion` returns true only when a selector is *visible*; `expected:"false"` (assert-absent) always fails. DOM truth: element absent, as designed |

## Capture (V1)

- `shots/V1/meta.json` — sourceSha `80aaec6c`, sourceHash `0d215f879a621423`,
  metal backend, 1440×900, reduced-motion, captured 2026-10-24T23:08:03Z;
  `reached: true, asserted: false`, no documenter shots on failure.
- `shots/V1/default-absence-evidence.png` — manual evidence capture
  (same session, healthy `/game` at S1): the top-left corner shows no
  cartouche; `[aria-labelledby="hud-objective-label"]` not in DOM.

## Fixes

See `fixes.md` — documenter needs assert-absent support (or a
positive-state driver feeding an objective).

## Links

- Contract: `.mw/contracts/components/objective-cartouche.md`
- Scope: `src/ui/idleVillage/components/gameFrame/ObjectiveCartouche.tsx`.

## Art-direction slice (rubric rev 3)

`hud_cluster` → hanging parchment slip, level-2 orientation info; a real
object that appears only when there is something to say — absence is the
designed rest state, not a missing feature.
