# load-game-panel — documenter fixes (PLAN-086 worker)

## Preventive driver hardening (no failure observed on this component)

`hudMenuLoadGame.ts` received the same guard applied to
`hudMenuMemorial.ts` after the `memorial-panel` flake: wait
`hud-menu-trigger` for `state:'visible'` (30 s, catch → `return false`)
before `getAttribute`/click. Rationale: identical entry pattern, same
boot/reveal reach-window — the trigger mounts while the HUD chrome is
still non-actionable and a raw `getAttribute`/`click` turns that into a
run-killing TimeoutError instead of an honest unreached state.

Both states (`in-game-menu`, `title`) passed on the run; no assertion,
selector or product change needed.
