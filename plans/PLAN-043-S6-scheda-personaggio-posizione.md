---
title: "PLAN-043-S6 — Scheda personaggio che non copre i pannelli"
parent: PLAN-043
status: completed
created: 2026-10-17 (scorporato dal master PLAN-043; lavoro del 2026-10-16)
source_request: R-207
documentation_impact: OPTIONAL
doc_targets:
  - src/docs/docs/design/hud_component_guide.md (regola di posizionamento)
---

# PLAN-043-S6 — Scheda personaggio che non copre i pannelli

Master: [PLAN-043](PLAN-043-game-quest-surface-pass.md) · stato operativo in [INDEX](INDEX.md).

## Richiesta (verbatim, 2026-10-16)

> *"5) quando si apre una nuova schermata, cm ad esempio la scheda per personaggio quando diventa un tooltip nn deve coprire la quest o altre cose, deve spawnare dove nn occlude la vista di altri componenti, trova una solzione, fa una ricerca"*

## Esito

- **Esito scheda personaggio che non copre i pannelli (Director 2026-10-16: *«quando … diventa un tooltip nn deve coprire la quest o altre cose, deve spawnare dove nn occlude la vista di altri componenti, trova una soluzione, fa una ricerca»*):** *Ricerca:* il modello di Microsoft (`ToolTip.PlacementRect`: un rettangolo che il popup non deve occludere, candidati sopra/sotto/destra/sinistra); Floating UI (`flip`, `shift`, `autoPlacement`) conosce **un solo** riferimento, e un caso noto di clamp al viewport che rimette il popup sopra ciò che doveva lasciare libero; WCAG 2.4.11 (la carta in focus non va coperta del tutto). *Soluzione:* `heroSheetPlacement.ts` — ricerca su candidati (posto naturale, altro lato della carta, bordi dello schermo, spigoli di ogni ostacolo, scansione a passo 48 px): mai sulla carta descritta, dentro lo schermo e **fuori dalle fasce fisse del HUD** (92 px sopra, 100 sotto), costo = area coperta pesata (quest e planner ×4, roster ×1), a parità il più vicino al posto naturale; senza ostacoli il risultato è identico a prima. Gli ostacoli sono letti dal DOM (`[data-hud-panel]` + finestra quest + riquadro del roster tagliato al bordo della colonna) e la scheda si riposiziona quando un pannello si apre o si chiude (subito e dopo 450 ms). *Misura (headless, `hero-sheet-place.spec.ts`):* con il planner aperto a 1280 e 1920 la sovrapposizione col planner è **0 px²**; senza planner il posto naturale resta (a parte la fascia fissa in basso). 8 test unitari nuovi; i 23 sulla macchina della scheda restano verdi. *Limiti:* a 1280 non esiste un posto del tutto libero e la scheda copre un po' l'intestazione del roster; gli altri elementi fissi del HUD oltre alle due fasce non sono ostacoli; non misurato con più pannelli aperti insieme (stash, mercante) né con la scheda fissata (pin).

## Contratto di chiusura

- Unit: `heroSheetPlacement.test.ts` (8), `heroSheet.test.tsx` (23).
- Headless: `f2/hero-sheet-place.spec.ts` (planner coperto 0 px² a 1280 e 1920).
- Sì del Director; misura con più pannelli aperti insieme e con la scheda fissata.
- Bundle di chiusura non ancora prodotto (`.mw/runs/plan043-{sid}/verification.json` → `verify:bundle`).
