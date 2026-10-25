# village-screen-view — documenter fixes (PLAN-086 worker)

## `default` — intermittent nav-button un-actionable after boot (flaked once, passed on retry)

**Observed.** First run: `S2_VillageView` unreachable —
`openVillageView`'s `ctx.page.locator('[data-nav-id="village"]').click()`
timed out: the button existed (`nav count 4` incl. village) but Playwright
reported it not-visible/not-actionable for ≥30 s after `waitBootCleared`.
`village-screen-view` count stayed 0.

**Repro attempts.** Two independent probes on the same build show the
button fully actionable at ~+80 ms after boot-clear (bbox 100×50 @
(493,842), `visibility:visible`, `elementFromPoint` = the button itself);
the click then mounts `village-screen-view` immediately. Re-running the
documenter passed with no code change → **transient**, not a product bug
(T-13: suspect shared-state/timing before suspecting the component).

**Candidate cause.** HUD chrome entrance/hide-transition racing boot: the
nav plinth slides/fades in after the veil, and `visibility:hidden` on the
chrome cluster (see `slideChrome` in `GameFrame.tsx`) makes the button
un-actionable while the wake settles. If the wake signal itself was
delayed/missed in that run, the hidden state could persist.

**Suggested hardening** (driver-side, `openVillageView` /
`reachState` in `gameSurfaceHarness.ts`):
- Wait for the nav button to be *actionable* before clicking —
  `locator.waitFor({ state: 'visible' })` + a short settle — instead of
  clicking into a possibly-still-hidden cluster.
- On click timeout, retry once after ~1 s rather than failing the reach;
  or fall back to `onNavSelect` via the real keyboard path if one exists.

**Status.** No manifest assertion change needed — the state passes; this
is a reach-stability note for every `S2_*`-dependent component
(`village-building-pins`, `village-slot-overlay`, `village-registry`,
`village-stash-panel`, `merchant-panel` share the same entry click).
