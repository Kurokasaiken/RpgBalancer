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
| `scroll-band-oro-inciso.png` | **Banda di scorrimento — GOLDEN REFERENCE** (ruling Director 2026-11-20 «Oro inciso», fork card `.mw/runs/20261120-scroll-band/visual-fork-scroll-band.md`): pozzetto inciso + thumb ottone champagne + perni. sha256 `99098b02f6e6`. Condivisa Roster/Stash/Ledger (PLAN-125 Fase 7a, PLAN-127 N=3 #1). `scroll-band-oro-inciso-ctx.png` = stessa su roster vero. | harness DOM su token reali, Director-approved |
| `frame-smeraldo-gemini.png` | **Cornice sottile pannelli (panel-frame7) — GOLDEN REFERENCE** (Director-designated 2026-11-19, ruling battesimo 2026-11-20 «Battezza golden»): cornice ottone-vite, gemme smeraldo ai 4 angoli, banda top + spina sinistra dense, fili dx/basso. sha256 `f96e7b32839f`. Slice-kit `panel-frame7` (record `test-results/slicekit/panel-frame7.json`, audit verde); montata su Roster/Stash via `?frame=thin`. | Gemini gen 2026-11-19, Director-approved |
| `ref-eventi-bar-specular-time-2026-11-25.png` | **Componente Eventi — REFERENCE** (Director screenshot 2026-11-25, R-386 «salva questo come referenza e usalo, speculare al compoente tempo. la gemma rossa è x i pericoli, altri colori saranno x altro»): barra orizzontale speculare al Tempo, gemma rossa = pericoli; altri colori per altre categorie. sha256 `2850093cb3f8`. Canonical copy: `.mw/specs/hud-eventi/refs/ref-eventi-bar-specular-time-2026-11-25.png`. | Director screenshot 2026-11-25 |

Plan che usa queste referenze: `../../../../plans/PLAN-125-hud-fix-r357.md` (R-357).

Plan source spec: `../artifact-r004.md` (mw-web-debate run `20261115-wanderlust-ui-plan`,
sha256 `582a2e03048de2a360a1bb3fb9a4f8ea2fb1eceeac98fc3dc4519ebf9e32c33b`).
Cassetto prompt spec: `../prompt-cassetto.md` (R-353).

- `mockup-cassetto-goblin-v3.webp` (604×848, sha256 1366b9d71aac…) — 2026-11-21, Director: nuovo mockup del cassetto Goblin come REFERENZA (cornice simmetrica sottile con diamanti, ritratti nelle ghiere, viaggio a pillola, rischio/ricompensa a due riquadri). Il viaggio è «superiore»: già adottato.
- `icon-journey-glyphs.png` (1792×592) — 2026-11-24, Gemini sheet dei 3 glifi del viaggio (rosa dei venti / spade incrociate / frecce circolari) in oro inciso su navy #0a1622. Sorgente dei pezzi `journey-ico-*.webp` (slices in `scripts/hud-real/specs/cassetto.json`, key flatBgMaxDiff). Prompt: `../prompt-journey-icons.txt`, refs usate: crop banda goblin-v3 + `journey-pill.png`. Gen: `../gen/journey-icons-0.png`, chat `2ee1e82acc8c02b8`.
