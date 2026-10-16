# No Foreground Windows (ALL SKILLS)

Applies to **every skill, agent, plan, script, and task** that can open a window, browser, app, or preview — automated or interactive. This is the RPG port of Director ruling CTR-foreground-001 (Mind Weaver, `mind-weaver/.mw/contracts/ui-focus.md`, 2026-10-15), issued after an agent opened Chrome for Testing in the foreground.

The Director must never lose the window he is watching. An agent must never steal focus.

## Hard rule

- **NEVER open a window, app, or browser in the foreground automatically.** Not even "just for a second".
- All automated browser runs — Puppeteer / Chrome for Testing, Playwright, CDP probes, screenshot/capture scripts, perf probes, verification harnesses — MUST run **headless** or in the **background**.
- FORBIDDEN without an explicit Director request made in the current session:
  - `headless: false` in any `launch()` call;
  - `playwright test --headed`, `--ui`, `--debug`, `playwright show-report`;
  - `open` without `-g` on macOS, `xdg-open`, `start` (Windows);
  - `osascript -e 'tell application ... to activate'`, `Page.bringToFront`, `window.focus()`, `window.open` issued by automation;
  - **implicit activation**: attaching to a headed/visible browser (`connectOverCDP`, `puppeteer.connect`, CDP `Target.createTarget` without `background:true`, `newPage()` on an attached headed instance). Creating a tab activates it and raises the window even if the browser was launched hidden — the effect is forbidden, not just the explicit API (Mind Weaver REG-001 v3, `.mw/bugs/2026-10-16-cdp-newtab-focus/`);
  - auto-opening a browser preview, Storybook, report HTML, or any OS window as a side effect of a command.

## Opt-in convention

- Scripts that legitimately can show a browser MUST default to headless and gate headed mode on the existing env convention:
  ```ts
  headless: process.env.HEADLESS !== 'false'
  ```
  (`scripts/visual/minimalGameplayBaselineRunner.ts` is the reference pattern.)
- `open` calls that surface a file/URL for the user use the background flag (`open -g`), never plain `open`.
- Legitimate headed entry points exist for **manual** use only (`test:e2e:headed`, `test:e2e:ui:dev`, `test:minimal:headed`, `test:minimal:debug`, `HEADLESS=false`, interactive debug scripts). An agent may use them only when the Director explicitly asks for a visible window in that session — never as a side effect, never "to check quickly".

## Plans and prompts

- Every plan, spec, or prompt that includes runtime verification, screenshots, playtests, or captures MUST state that the run is headless/background.
- If a task genuinely needs a visible window (e.g. human-eye verification), the plan marks it as a manual/Director step. An agent never launches a foreground window on its own initiative — it asks.

## Enforcement

- `npm run foreground:lint` scans the repo and fails on `headless: false` literals, foreground `open`/`xdg-open` calls, `--headed`/`--ui` invocations, `activate`/`bringToFront` in scripts and tests. It does **not** flag `newPage`/`createTarget` (legitimate in self-launched headless runs) — the ban on CDP-attach to headed browsers above is contractual; as of 2026-10-16 no script attaches to an existing browser.
- A task that opens a foreground window is **failed**, not complete: log it in `.mw/bugs/` and flag the Coordinator.
- When in doubt, choose the headless path and report that a visible check was not performed (see T-04 in `context/recurring-traps.md` for perceptual claims).
