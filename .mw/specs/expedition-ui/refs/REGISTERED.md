# Registered references — expedition-ui (R-339 / PLAN-119)

Registered per Director ruling 2026-11-14 (R-338 addendum): approved/passed-as-screenshot
artifacts must be preserved as durable references, never left in temp paths.

| File | What | Source |
|---|---|---|
| `mockup-chatgpt.png` | ChatGPT mockup — target visual baseline for Subplan 1 (docked right drawer, roster, slim chrome, sun) | Director screenshot, chosen direction |
| `mockup-chatgpt-alt.png` | ChatGPT mockup variant | Director screenshot |
| `mockup-quest-planner.png` | Additional Director-supplied planner mockup (Downloads) | Director file |
| `mockup-stash-grid.jpg` | Village stash grid + filters + item detail card — content reference for stash tab | Director screenshot 2026-11-15 |
| `screenshot-current-ui.jpg` | Current /game UI — the critique subject | Director screenshot |
| `mockup-cassetto-v2.png` | **Cassetto variant — GOLDEN REFERENCE** (R-353, Director ruling 2026-11-16 «vabene la v2»): expedition console as extracted drawer. Generated via ChatGPT web, run `.mw/runs/20261116-r353-cassetto-mockup/` (`gen/full-3.png`, sha256 `d2f743ab1f7c6108`). NB: verbatim spec (right edge = zero frame, zero map gap) is stricter than this mockup — the exact edge cut is resolved at asset build (lab pick). | ChatGPT gen 2026-11-16, Director-approved |
| `screenshot-r357-hud-2026-11-17.png` | Stato di /game su cui si basa la critica R-357 (HUD attuale, 1474×745) — soggetto della critica e del PLAN-125 | Director screenshot 2026-11-17 |

Plan che usa queste referenze: `../../../../plans/PLAN-125-hud-fix-r357.md` (R-357).

Plan source spec: `../artifact-r004.md` (mw-web-debate run `20261115-wanderlust-ui-plan`,
sha256 `582a2e03048de2a360a1bb3fb9a4f8ea2fb1eceeac98fc3dc4519ebf9e32c33b`).
Cassetto prompt spec: `../prompt-cassetto.md` (R-353).
