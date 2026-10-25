# memorial-panel — documenter fixes (PLAN-086 worker)

## `default` — flaked once: `hud-menu-trigger` mounted but not actionable (boot/reveal race)

**Observed.** Run 1: `hudMenuMemorial.drive` threw —
`locator.click: Timeout 30000ms`, `element is not visible` on every
retry. The locator resolved to the real button
(`aria-expanded="false"`, `data-state="closed"`), so the element
existed in the DOM but failed Playwright's actionability check for the
whole 30 s. The exception propagated out of `runDriver` (no try/catch
for `script` drivers) and killed the run without `meta.json`.

**Probe (headless, same build).** Right after `openGame` returns, the
trigger is already 40×40 `inline-flex`, `visibility:visible`, opacity 1
through the whole ancestor chain — and stays so across
`waitBootCleared` + 2 ticks + 1 s. The end-state is clean; the failure
is a reach-window race: `script` drivers run immediately after
`openGame` (expedition hook mounted) with no `waitBootCleared`, and
the HUD chrome entrance/hide transition can keep the cluster hidden
while the wake settles (same class of flake as
`village-screen-view/fixes.md` → T-13: suspect shared timing before
the component).

**Fix applied (driver-side).** `hudMenuMemorial.ts` (and, preventively,
`hudMenuLoadGame.ts` + the title-branch of `hudMenuSettings.ts`) now
await `trigger.waitFor({ state:'visible', timeout: 30_000 })` —
catch → `return false` — before reading `aria-expanded`/clicking. The
throw-then-crash path is gone: a still-hidden trigger becomes an
honest unreached state instead of a run-killing exception.

**Status.** Rerun passed; `meta.json` written, 0 console errors. The
flake is recorded, not assumed fixed root-cause: if the wake itself is
missed (not merely delayed) the same 30 s would still fail — now as a
`documented_partial` state rather than a crash.
