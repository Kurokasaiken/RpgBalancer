# tuning-panel — Tuning panel (live config sliders)

> PLAN-086 catalog entry. Floating HUD panel, dev instrument: live
> sliders over tuning values so balance/rendering constants can be
> probed on the running screen. Shortcut `t`, also listed in the
> Panels menu.

## What it is / does

- One slider row per `TuningField` (`label`, `value`, `min`/`max`/`step`,
  `hint` — one or two sentences on what the value does and what each end
  means, shown on hover — and `group`, which keeps fields of one section
  together, in order).
- `onCommit(id, value)` fires when a slider is released — committing on
  every pixel of a drag would stutter a map rebuild.
- `onReset` restores the values; `onSave` saves immediately and copies
  the values, with a `saved` flash; an optional `notice` line above the
  fields (e.g. that the system has reduced motion on).
- Chrome is i18n; field labels/hints arrive from the caller.

## Declared states

| id | driver | observable assertion |
|---|---|---|
| `default` | surface+key `t` on `S1_WorldMapIdle` | `[data-testid="tuning-panel"]` visible |

## Capture (V1)

- `shots/V1/meta.json` — frozen build, sourceSha `80aaec6c`, sourceHash
  `69803742da93a192`, metal backend, 1440×900, reduced-motion,
  0 console errors / 0 network failures.
- In-context full-surface shots (ctx-a/ctx-b) + `iso-0` =
  `[data-testid="tuning-panel"]`.
- `deterministicSameBytes: false` — live map behind the panel;
  byte-compare recorded as data, not pass/fail.

## Links

- Contract: `.mw/contracts/components/tuning-panel.md`
- Source: `src/ui/idleVillage/components/gameFrame/TuningPanel.tsx`
- Reach: keyboard `t` (`surface+key` driver); Panels menu in dev builds.

## Art-direction slice (rubric rev 1)

`panel` → ART-DIRECTION L1+L2 + token section: Lacquer Atlas floating
plaque, slider rails and engraved glyphs — dev instrument on the
standard HUD chrome, no bespoke skin.
