---
title: "PLAN-043-S10 — Oro e bloom nel resto del HUD"
parent: PLAN-043
status: superseded
created: 2026-10-17 (scorporato dal master PLAN-043; lavoro del 2026-10-16)
source_request: R-207
documentation_impact: OPTIONAL
---

# PLAN-043-S10 — Oro e bloom nel resto del HUD

Master: [PLAN-043](PLAN-043-game-quest-surface-pass.md) · stato operativo in [INDEX](INDEX.md).

## Richiesta (verbatim, 2026-10-16)

> *"3) il bloom che indica dove può andar eun pg è pacchiano e brutto e rozzo"* · *"4) il colore oro è troppo perfetto e pulito"*

## Stato

Fatto solo per gli slot del planner ([S5](PLAN-043-S5-slot-incastonatura.md)): palette `hud-gold` e bloom «ottone». Il bloom condiviso (`bloomEffect.ts`, look `aaa`) resta su POI e pagine demo; l'oro del HUD (token `--skin-hud-brass-*`) non è stato toccato. Da decidere con il Director dove applicare lo stesso trattamento, dopo che avrà visto lo slot.

## Contratto di chiusura

- Elenco dei componenti con bloom/oro, deciso dal Director.
- Catture prima/dopo.
- Bundle di chiusura non ancora prodotto (`.mw/runs/plan043-{sid}/verification.json` → `verify:bundle`).
