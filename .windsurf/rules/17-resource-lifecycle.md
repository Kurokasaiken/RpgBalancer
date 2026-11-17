---
trigger: model_decision
description: "Resource lifecycle contract (R-LIFECYCLE/MW PLAN-071): every agent-spawned process, server, browser or temp file must be scoped, leased or kept-registered; mw-run tooling. Load when spawning long-lived resources."
---

# R-LIFECYCLE — resource lifecycle for agent-spawned resources (MW PLAN-071)

Every resource an agent creates (process, server, browser, temp file,
scheduled job) is born with a declared end: `scoped` (dies with the command),
`leased` (TTL), `kept` (registered with owner+purpose, Director-authorized).
Anything else is a leak — a defect, not a style choice.

## Contract (one-liners, tools in `~/.mw/bin/`)

- `mw-run -- <cmd>` / `mw-run --ttl 10m -- <cmd>` — scoped; process-group
  kill on exit or timeout. Use for every command that can hang or fork
  children (probes, screenshots, builds).
- `mw-run --lease 2h --port 5173 --purpose "…" -- npm run dev` — detached
  server with expiry; run `mw-ps --port 5173` first, never stack a second.
- `mw-run --keep`/`mw-keep` — persistent resources: fail-closed without a
  `--purpose` citing the Director request.
- `mw-pw <file.mjs>` — Playwright probes: `browser.close()` in finally +
  watchdog + `process.exit` guaranteed. **Never** a raw `node -e` with
  `chromium.launch` — that exact pattern leaked 10 headless trees for ~6h
  (incident 2026-11-13).
- `mw-tmp` for temp dirs (`mw-<project>-*` prefix, sweepable).
- `mw-adopt <pid|--port N> --purpose "…"` — adopt an orphan as kept.
- `mw-ps --mine` before declaring done: stop or adopt everything listed;
  paste output in the final message.
- Gate: `mw-reap --gate <project-cwd>` fails on unowned resources (closure
  gate integration point).

## What the sweep does (launchd `com.mw.reap`, every 15 min)

- L1 certain leaks (headless browsers, `node -e` orphans >15min): auto-kill
  the whole process group.
- L2 expired scoped: kill; expired leased: report.
- L3 orphan servers in project cwd: **report only** — never killed. Only the
  Director decides which servers die.
- L4 `mw-*` tmp >24h: deleted.

Detail: `mind-weaver/.agents/skills/resource-lifecycle/SKILL.md`.
