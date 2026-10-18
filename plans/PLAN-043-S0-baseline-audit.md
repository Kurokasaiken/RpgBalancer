---
title: "PLAN-043-S0 — Baseline e audit"
parent: PLAN-043
status: completed
created: 2026-10-17 (scorporato dal master PLAN-043; lavoro del 2026-10-16)
source_request: R-207
documentation_impact: NONE
---

# PLAN-043-S0 — Baseline e audit

Master: [PLAN-043](PLAN-043-game-quest-surface-pass.md) · stato operativo in [INDEX](INDEX.md).

## Richiesta (verbatim, 2026-10-16)

> *"E vorrei anche vedere i componenti quando premi i puslanti che aprono compoennti (ad esempio la quest)"*

## Esito

### F0 — Baseline e audit ✅ (Opus)

*Esito (2026-10-16):* T0.1 gate (`F0-gate.md`), T0.2 baseline (`F0-baseline.md`, ~100 catture), T0.3 audit statico (`F0-audit.md`).
**Resta (T0.4):** misure a runtime — contrasto testo/lacca e area cliccabile di ogni controllo su `/game`; cattura della finestra della ricompensa (la run va portata a fine dal driver).
**Gate F0:** priorità confermate dal Director (in corso: questo documento è la risposta).

## Contratto di chiusura

- `test-results/plan-043/F0-gate.md`, `F0-baseline.md`, `F0-audit.md`, catture `capture/shots/` (presenti).
- T0.4 (contrasto, area cliccabile, cattura della ricompensa) non fatto: confluisce in [S12](PLAN-043-S12-riesame-chiusura.md).
- Nessun bundle: fase di sola misura.
