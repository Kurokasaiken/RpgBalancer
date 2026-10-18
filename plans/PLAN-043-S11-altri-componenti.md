---
title: "PLAN-043-S11 — Tutti gli altri componenti di /game"
parent: PLAN-043
status: candidate
created: 2026-10-17 (scorporato dal master PLAN-043; lavoro del 2026-10-16)
source_request: R-207
documentation_impact: REQUIRED
doc_targets:
  - src/docs/docs/design/hud_component_guide.md
  - src/docs/docs/plans/PLAN-058_hud_roster_unification.md (gate F1/F4/F5)
---

# PLAN-043-S11 — Tutti gli altri componenti di /game

Master: [PLAN-043](PLAN-043-game-quest-surface-pass.md) · stato operativo in [INDEX](INDEX.md).

## Richiesta (verbatim, 2026-10-16)

> *"1) tutti 2) il colore dello slot nn c sta bene, idem la ghiera."* (2026-10-16 — «tutti» = il piano copre tutti i componenti di `/game`)

## Task

Una **scheda per componente** (scopo, cosa funziona, problemi misurati in F0, proposta: tenere / rifare / unire / togliere), poi il Director decide componente per componente (**D9**), poi un task per componente.

| Gruppo | Componenti |
|---|---|
| HUD fisso | lastra del tempo, lastra risorse, nav, menu di gioco, menu Pannelli, nascondi HUD, cartiglio obiettivo — chiude il **Gate F1 di PLAN-058** |
| Pannelli | Roster V2 (difetti di PLAN-058 T1.6), Eventi, Scheda eroe, Scorta del villaggio, Mercante |
| Villaggio | vista Villaggio, pin/lotti, Registro, dettaglio edificio (verifica d'integrazione con PLAN-042) |
| Mappa | POI Sigillo (sagome, taglie, **colore degli anelli** — chiude il **Gate F4 di PLAN-058**), tooltip delle regioni, marker dell'invasione, edifici sulla mappa |
| Strumenti | cursori (chiude il **Gate F5 di PLAN-058**: la prova Tauri l'ha già fatta il Director), schermata di avvio, Director e Tuning (solo coerenza, sono strumenti di sviluppo) |

- *Accettazione:* per ogni componente toccato: checklist §6.12, guardiani estesi, catture prima/dopo.
- **Gate F6:** sì del Director per gruppo.

## Contratto di chiusura

- D9 componente per componente.
- Checklist §6.12, guardiani estesi, catture prima/dopo per gruppo.
- Bundle di chiusura non ancora prodotto (`.mw/runs/plan043-{sid}/verification.json` → `verify:bundle`).
