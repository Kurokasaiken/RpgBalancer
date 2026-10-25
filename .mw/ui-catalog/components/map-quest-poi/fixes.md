# map-quest-poi — documenter fixes (PLAN-086 worker)

## `default` state — assertion races the auto-reveal stagger

**Observed.** `S1_WorldMapIdle` reaches fine (boot veil cleared + 2 ticks),
but `checkAssertion` runs `locator.count()` — an instantaneous snapshot —
~80 ms after `game-boot-screen` detaches. The first quest POI mounts on a
wall-clock timer at `veilGone + questReveal.initialDelayMs` (1000 ms,
`questRevealSchedule.ts` + `gameFrameConfig.ts:973`), so `count() === 0`
and the state fails before the marker exists.

**Probe (headless, this build).** `map-quest-poi` count 0 at +76 ms →
mounted and visible at +1083 ms after boot-clear + 2 ticks. The second POI
(`poi-rovine`) lands ~6 s. `planner-context` passes on the same run because
`revealQuestPois` mounts both sigilli synchronously.

**Suggested repairs (either suffices).**

1. Driver-side — replace the `surface` driver for `default` with a `script`
   driver that awaits the auto-reveal honestly, e.g.
   `await ctx.page.locator('[data-testid="map-quest-poi"]').first()
    .waitFor({ state: 'visible', timeout: 10_000 })` (covers the 1 s
   initial delay; use ≥7 s if both POIs must be in frame). This asserts the
   *product* behavior — auto-reveal — rather than poking `revealQuestPois`.
2. Harness-side — make `checkAssertion` in `documentComponent.mts` wait for
   attach instead of instant count (`loc.waitFor({state:'visible'})`
   already happens via `isVisible({timeout:3000})` **only when count>0**;
   the `count() > 0` pre-check is the non-waiting part that loses).

**Not a product bug.** The marker does mount on this build; the declared
assertion as written cannot observe it inside its 0-wait window. Re-runs
may flake-pass if boot is slow enough to push the check past +1 s.
