---
title: "PLAN-043-S2 — Pulizie: P/Q, bag, clic sulle regioni, colori, testo piccolo"
parent: PLAN-043
status: active
created: 2026-10-17 (scorporato dal master PLAN-043; lavoro del 2026-10-16)
source_request: R-207
documentation_impact: NONE
---

# PLAN-043-S2 — Pulizie: P/Q, bag, clic sulle regioni, colori, testo piccolo

Master: [PLAN-043](PLAN-043-game-quest-surface-pass.md) · stato operativo in [INDEX](INDEX.md).

## Richiesta (verbatim)

> *"D8. nn so nemmeno xè c siano quei pulsanti, attualmente nn dovrebbero esistere"* · *"d7: no"* (2026-10-16)

Le altre voci vengono dall'audit F0 ([S0](PLAN-043-S0-baseline-audit.md)).

## Task

| T | Fix | Accettazione |
|---|---|---|
| T1.3 | **P (scheda eroe) e Q (quest in corso)**: rimossi dal menu Pannelli, dal menu di gioco e dalle scorciatoie (D8). La finestra della quest resta raggiungibile dal POI e da dove la apre oggi il flusso della quest. | voci e tasti assenti; nessuna regressione su apertura/riduzione della finestra della quest (`gameQuestLifecycle` verde) |
| T1.4 | **Bag**: quattro caselle per tre posti (il picker sembra un quarto slot). | tre slot + un controllo che si legge come «scegli» |
| T1.5 | **Colori fuori palette**: «Abandon» viola e ogni letterale trovato in F0 sui componenti toccati. | zero letterali nuovi; guardiani estesi ai file toccati |
| T1.6 | **Clic su regione che sposta la mappa**: togliere (D7). Il nome della regione può comparire, la camera no. | clic su regione: traslazione 0 px (misura come in F0), test |
| T1.7 | **Testo < 12 px** nei 7 componenti segnalati, **lucide-react** nei 2 rimasti, **`BagStrip`** rimosso se D4 = sì. | audit ripetuto pulito su questi punti |

## Esito

*Esito T1.2–T1.6, verifica headless (2026-10-16, `test-results/plan-043/f1/f1-verify.spec.ts`, log in `f1/verify/`; carico macchina 5–7):*
- **T1.3 provato:** il menu Pannelli elenca solo Roster, Events, Village stash, Merchant, Director, Tuning; i tasti Q e P non aprono niente (0 → 0 pannelli).
- **T1.4 provato:** 3 slot bag; il controllo è una pillola 206×26 px con testo «Choose village items» (lo slot è 44×44); screenshot `verify/bag-pillola.png`.
- **T1.6 provato:** due clic su regioni, camera identica (`panX/panY/zoom` invariati al decimale).
- **T1.7 non fatto**, rimandato ai file che le fasi F2/F4/F5/F6 riscrivono comunque.
- **T1.5 parziale:** il viola di «Abandon» è un token di skin (`--skin-status-death`), non un errore; si rifà nel redesign della famiglia della quest ([S9](PLAN-043-S9-famiglia-quest-redesign.md)). Gli altri letterali seguono i file che S5/S8/S9/S11 riscrivono.
- **D4 (`BagStrip`)** ancora aperta.

**Gate F1:** il Director prova scambio, calamita e tasti (manuale, browser o Tauri).

## Contratto di chiusura

- `hudGameMenu.test.tsx` (voci e tasti P/Q), `f1-verify.spec.ts` (menu, bag, camera).
- T1.5/T1.7 chiusi dentro S9/S11; D4 decisa.
- Bundle di chiusura non ancora prodotto (`.mw/runs/plan043-{sid}/verification.json` → `verify:bundle`).
