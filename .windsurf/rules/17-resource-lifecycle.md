---
trigger: model_decision
description: "Resource lifecycle contract (R-LIFECYCLE/MW PLAN-071+PLAN-075): every agent-spawned process, server, browser tab or temp file must be scoped, leased or kept-registered; canonical MW tooling exposed by symlink. Load when spawning long-lived resources."
---

# R-LIFECYCLE — resource lifecycle for agent-spawned resources (MW PLAN-071+PLAN-075)

Every resource an agent creates (process, server, browser, temp file,
scheduled job) is born with a declared end: `scoped` (dies with the command),
`leased` (TTL), `kept` (registered with owner+purpose, Director-authorized).
Anything else is a leak — a defect, not a style choice.

## Canonical tool source (PLAN-075 D9)

- `tools/resource-lifecycle` in this repo is a **live symlink** whose target is
  `../../mind-weaver/tools/resource-lifecycle` (sibling checkout `../mind-weaver/...`
  from repo root). Do not copy lifecycle tool files into RPG.
- `~/.mw/bin` remains the legacy machine-wide fallback/install target. The RPG
  closure gate resolves the repo symlink first, then `~/.mw/bin`.
- Because the symlink is live, RPG follows the current Mind Weaver working
  tree. If behavior looks unexpected, inspect that source before patching or
  duplicating anything in RPG.

## Contract (one-liners)

- `mw-run -- <cmd>` / `mw-run --ttl 10m -- <cmd>` — scoped; process-group
  kill on exit or timeout. Use for every command that can hang or fork
  children (probes, screenshots, builds).
- `mw-run --lease 2h --port 5173 --purpose "…" -- npm run dev` — detached
  server with expiry; run `mw-ps --port 5173` first, never stack a second.
- `mw-run --keep`/`mw-keep` — persistent resources: fail-closed without a
  `--purpose` citing the Director request.
- `mw-pw <file.mjs>` — Playwright probes: `browser.close()` in finally,
  watchdog + `process.exit` guaranteed, OS-released flock with max 1 heavy
  browser-test, CPU-first pressure gate. **Never** a raw `node -e` with
  `chromium.launch` — that exact pattern leaked 10 headless trees for ~6h
  (incident 2026-11-13).
- `mw-provider-tabs --dry-run` / `mw-provider-tabs --apply` — Canary provider
  tab inventory/close automation; never use it outside the automation Canary
  perimeter.
- `mw-tmp` for temp dirs (`mw-<project>-*` prefix, sweepable).
- `mw-adopt <pid|--port N> --purpose "…"` — adopt an orphan as kept.
- `mw-ps --mine` before declaring done: stop or adopt everything listed;
  paste output in the final message.
- Gate: `mw-reap --gate <project-cwd>` fails on unowned resources (closure
  gate integration point).

## Browser tab lifecycle (PLAN-075, Canary-only)

- Automatic close is allowed only for provider/automation Canary targets:
  profiles under `.mw/providers/profiles/` or an explicitly registered
  `MW_BROWSER_PROFILE`, on a known/registered CDP port. The Director's
  personal Chrome and every unrecognized browser/target are never touched.
- The browser root is persistent/`kept`; tabs are separate logical
  `browser_tab` leases carrying `target_id`, run id, provider, conversation
  URL, purpose, retention class, heartbeat and terminal state.
- A close is legal only when the class is eligible, no active lease/heartbeat
  protects it, and an immediate resnapshot confirms the same `targetId`, the
  same URL and `type=page`. Any mutation or inconsistent registry/CDP state
  aborts the close — fail-closed.
- `run-active` tabs are never closed. Terminal non-visual tabs close only
  after run state/report/artifact sync. `visual-artifact`/mockup tabs stay
  protected until `artifact_persisted=true`, with a 72h backstop.
- `legacy-unbound` and duplicate candidates close only after a 24h TTL from
  recorded `first_seen_at`; `manual/unknown` targets are never auto-closed and
  remain report-only.
- All tab automation must remain background/headless; closing or inspecting a
  tab must never activate a window or steal foreground.

## Pressure/concurrency guard for browser tests

- At most 1 heavy browser-test runs at a time per machine; the lock must be
  OS-released (`flock` or equivalent), not a stale pid file.
- New heavy tests are blocked when `load1 >= 2 × logical cores` or memory
  pressure is critical. At `load1 >= 1.5 × logical cores`, non-essential heavy
  tests are deferred by the agent even if the tool cannot enforce that softer
  throttle yet.
- Override only with explicit `MW_PW_FORCE=1`; the override must be logged.
- The gate prevents new spawn. It does not kill live tests merely because the
  machine load rises.

## Dev server classification

- Unix orphans (`ppid=1`) follow the reaper ladder below.
- A dev server whose parent is still alive but which has no owner/purpose/lease
  is `unregistered-live`: report-only, never auto-killed directly.
- Expired leases or missing heartbeats are escalated in the report; kill
  requires either the existing orphan ladder or a future explicit policy.
- `mw-adopt` is the sanctioned shortcut for declaring an intentional service.

## What the sweep does (launchd `com.mw.reap`)

- L0 signature-kill patterns (for example the githd/git-log loop): auto-kill
  after the configured age, with system/tool safe-list protection.
- L1 certain leaks (headless browsers, `node -e` orphans beyond the minimum
  age): auto-kill the whole process group.
- L2 expired scoped: kill; expired leased: report.
- L3 orphan servers in project cwd: auto-kill the process group by default;
  `MW_REAP_L3_REPORT_ONLY=1` restores report-only mode.
- L4 `mw-*` tmp and stale automation browser profile dirs past their TTL:
  delete.
- L5 pressure hogs: under memory/CPU pressure, heavy orphan processes in
  project roots may be killed; outside project roots they are report-only.
- L6 leaked automation browser roots: orphan or pressure-hog automation
  browser trees may be killed; registered/kept roots are protected.
- L7 orphan workers matching explicit agent/automation patterns: kill only
  when the safe-list and project/cwd rules allow it.
- `unregistered-live` parent-alive dev servers are report-only, never killed.

Detail: canonical contracts `mind-weaver/.mw/contracts/resource-lifecycle.md` /
`mind-weaver/.mw/contracts/provider-tab-lifecycle.md`. Tool implementations live
behind the symlink; do not duplicate them here.
