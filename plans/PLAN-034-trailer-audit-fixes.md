---
title: 'PLAN-034 — Fix dei 7 problemi dell’audit trailer (R-187/R-188)'
status: completed
created: 2026-10-14
source_request: R-188 (evidenza: R-187, test-results/trailer-report-2026-10-14/)
desiderata: .mw/desiderata.md v2 FROZEN (world surface, tier eventi, invasione goblin)
documentation_impact: traps registration in context/recurring-traps.md; GAME_INVASION_SEQUENCE.md già aggiornato
---

# PLAN-034 — Trailer audit remediation

## Spec

> Battezzato dopo approvazione esplicita del Director («procedi», 2026-10-14).
> Deliberazione multi-AI: 2 run (`20261014-114519`, `20261014-120000`), critiche
> integrate dove valide; controproposte over-scope (GameOverService, CI gates,
> feature-flag, pre-flight hooks) rifiutate per YAGNI.

### Goal

- Eliminare i jank percettibili su `/game` (quest window, map pan, menu open,
  invasion mount): target p95 < 33 ms, 0 frame > 100 ms nei segmenti misurati.
- Bonificare la hub trailer (link canonici `/trailer?scene=<id>`, via le voci
  morte `trailer-threat-iter` / `trailer-legacy-v2`).
- Settlement Lost come trigger dev-only nel `DirectorPanel` di `/game`.
- Verifiche residue (400 Bad Request, hero-components-lab) senza riscritture.

### Decisioni del Director (2026-10-14)

1. **R-185.1 risolto**: il marker goblin a boot da `invasion_v1` persistito è il
   comportamento voluto (PLAN-033 — marcia persistente ~30 gg); contratto
   documentato in `context/GAME_INVASION_SEQUENCE.md` §4. Nessun task.
2. **Settlement Lost** = pulsante nel `DirectorPanel` dev-only (F10) che monta
   l'overlay esistente su `/game`. Nessuna logica canonica day-30 — resta
   descoped come da PLAN-033, sarà parte del futuro piano difesa.
3. **Hub**: eliminare le voci `trailer-threat-iter` e `trailer-legacy-v2`;
   le 7 scene puntano a `/trailer?scene=<id>` (source of truth:
   `trailerConfig.sceneOrder`).
4. Deliberazione multi-AI eseguita (2 run); critiche valide integrate.

### NOT In Scope

- `GameOverService` / trigger canonico day-30 per Settlement Lost.
- Route dedicate per le varianti `iter`/`v2` del trailer.
- Rewrite del renderer Pixi o refactor massivo dello state management (T-05).
- Modifica della marcia `invasion_v1`.
- CI perf gates, monitoring windows, hook pre-flight nelle skill (YAGNI qui).

### Vincoli (da recurring-traps)

- **T-04**: claim percettivi chiusi solo a occhio in browser reale e visibile —
  rAF bloccato con `document.hidden`. Le metriche sono supporto, non verdetto.
- **T-05**: fix ≠ rewrite. Si patcha dentro `QuestRunWindow`, `PixiWorldMap`,
  `WorldSurfaceEventCard`; nessun refactor strutturale non approvato.
- Config-first, PersistenceService, i18n, primitive esistenti (invarianti base).

### Approccio

Ogni fix di performance è **gated dalla propria diagnosi**: prima una trace
documentata con root cause, poi la patch. Le ipotesi senza misura non bastano
(critica deliberazione c1-1). Ogni fix emette un artifact JSON confrontabile
con la baseline `test-results/trailer-report-2026-10-14/metrics2.json`.

Baseline rilevante (headed, GPU reale, finestra visibile):

| Segmento | avgFps | p50 | p95 | worst | long>50ms |
|---|---|---|---|---|---|
| game-idle-map | 57.2 | 16.7 | 17.7 | 83.3 | 2 |
| map-pan | — | 16.8 | **67.3** | **134.2** | 9 |
| map-zoom | — | 16.7 | 33.9 | 50.5 | 1 |
| menu-open | — | 17 | **83** | **150.3** | 4 |
| invasion-curtains | 32.9 | 16.7 | 49 | **832.3** | 3 |
| invasion-peel-fall | 22.6 | 16.7 | 50 | **1083.4** | 5 |
| quest-window-idle | 25 | 17.5 | **115.9** | **216.6** | 12 |
| quest-window-choice | 19.4 | 33.3 | **266.6** | **300.8** | 8 |
| settlement-lost | 47.7 | 16.7 | 49 | 133.3 | 7 |

### Behavioral Verification

- Re-run `capture2.mjs` (esteso dove serve) in finestra visibile: soglie p95
  sopra; artifact per-fix confrontato con baseline.
- Eye-check headed: invasione completa, quest run a ×4, pan/zoom continuo.
- Hub: tutti i link montano la scena attesa (Playwright).
- DirectorPanel: "Settlement Lost" monta/smonta l'overlay su `/game`.
- Safeguard per task: `npm run lint -- <scope>`, `npm run test -- <scope>`,
  `npm run build:check`, `npm run kanban:lint`.

## Tasks

### Fase A — diagnostica (gating per i fix perf) — COMPLETATA

Root cause documentate in `test-results/trailer-report-2026-10-14/DIAG-034.md`
(CDP Profiler function-level + longtask + MutationObserver; artifact
`diag.json`/`diag2.json`).

- [x] T-001: 400 su `/game` → **transiente dev-server, non riproducibile** in 3 run (headless idle, headless invasione+quest completa, headed stessa sequenza). Benigno-in-dev. ✓
- [x] T-002: quest-window → **RC-1**: `map-quest-poi` mutation storm ~180 mut/s (seal `PoiMatericV3_5` ri-renderizza a ogni tick ×4) + re-render window; 26 longtask cadenzati sul tick; **RC-3**: `jsxDEV` dev-runtime = ~30% CPU. ✓
- [x] T-003: pan/menu → **RC-1** domina sotto quest attiva (pan con quest: longtask 239–317 ms); a riposo pan ~2 longtask 51–66 ms, menu ~94 ms (a freddo 259 — mount lazy dev). ✓
- [x] T-004: invasion → **RC-2**: `playThud` fa `new AudioContext()` sincrono sul main thread = **1151.8 ms self-time (23% del peel)** = il mega-hitch misurato. ✓

### Fase B — fix perf (direzione fissata dalla diagnosi)

- [x] T-005: fix churn tick→render (**RC-1**): quantizzare il render del seal (update solo se `progress` varia oltre soglia visibile o max ~4 Hz), `React.memo` su `PoiMatericV3_5`, memo delle sotto-liste stabili in `QuestRunWindow` (log rows, party). Target: p95 < 40 ms durante run ×4, 0 frame > 100 ms.
  files: src/ui/idleVillage/components/gameFrame/MapQuestPoi.tsx, src/ui/idleVillage/components/gameFrame/QuestRunWindow.tsx, src/ui/idleVillage/components/poi/PoiMatericV3_5.tsx
  depends: —
- [x] T-006: fix pan residuo a riposo (mutations `pixi-world-canvas` + commit React ~97 ms; la componente dominante sotto quest è RC-1, coperta da T-005). Target: p95 < 33 ms pan continuo 10 s, idle.
  files: src/ui/idleVillage/pixiSpike/PixiWorldMap.tsx, src/pages/game-frame-pixi.tsx
  depends: T-005
- [x] T-007: fix menu-open (mount ~94–259 ms; preload contenuto nel warm-up veil / memo). Target: p95 < 33 ms.
  files: src/pages/game-frame-pixi.tsx
  depends: —
- [x] T-008: invasion hitch (**RC-2**): `playThud` → AudioContext condiviso/lazy pre-creato nel warm-up (mai `new` dentro l'animazione) o via registry cue audio. Target: 0 frame > 100 ms shroud→card→land.
  files: src/ui/idleVillage/components/WorldSurfaceEventCard.tsx
  depends: —

### Fase C — superfici

- [x] T-009: hub trailer — link 7 scene a `/trailer?scene=<id>`, eliminare voci iter/v2, test Playwright su tutti i link.
  files: src/ui/idleVillage/SteamTrailerHub.tsx
  depends: —
- [x] T-010: DirectorPanel — pulsante "Settlement Lost" che monta/smonta l'overlay esistente su `/game` (dev-only, no logica canonica).
  files: src/pages/game-frame-pixi.tsx (DirectorPanel), overlay SettlementLost esistente
  depends: —
- [x] T-011: dispatch PLAN-032 (5 sub-plan converged → spec eseguibili → esecuzione). **Fatto 2026-10-14**: artifact copiati in `plans/PLAN-032-SP-1..5-*.md` (sha verificati), righe kanban `PLAN-032-SP1..SP5` in `agent_assignments.md` + `strategy_tasks.md`, pending file SP-1 in `manual-dispatch/pending/`; SP-1 → In corso (Devin), SP-3 Bloccato da SP-2. Esecuzione SP tracciata su PLAN-032.
  files: plans/PLAN-032-teaser-game-components.md
  depends: —

### Fase D — chiusura

- [x] T-012: hero-components-lab — documentare lazy-load ~12 s come noto (dev-only) + prefetch dal test-hub se banale.
  files: src/pages/hero-components-lab (lazy import), hub link
  depends: —
- [x] T-013: traps registration — entry in `context/recurring-traps.md` per ogni problema confermato/fixato; ≥2 occorrenze → candidato PROPOSALS.md.
  files: context/recurring-traps.md
  depends: T-005..T-008
- [x] T-014: behavioral verification finale — re-run capture, artifact JSON vs baseline, eye-check; report di chiusura con checklist T-04/T-05.
  files: test-results/trailer-report-2026-10-14/
  depends: T-005..T-011
