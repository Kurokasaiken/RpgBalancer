# PLAN-068: Director review round — gate aggregato unico (R-235)

**Status:** `baptized` — Director 2026-10-20 («chiudi tutto quello che aspetta me / crea questo plan»). Pattern convalidato da PLAN-067 (audit unico → difetti numerati → ruling in blocco).
**Richiesta:** `R-235` (2026-10-20). Verbatim: *«la cosa che aspetta me x chiudere nn so se m piaccia. ho poco tempo x testare le cose, e tendenzialmente testo tutto in una volta e trovo tutt le cose che nn vanno»* + *«chiudi tutto quello che aspetta me»*.
**Problema:** i gate umani sono sparpagliati in ~7 piani (OB-7, eye-check, D9, F1, D6, WKWebView, playtest). Ognuno blocca il suo plan e aspetta un momento Director diverso. Il Director testa invece in sessioni uniche, trovando molti difetti insieme.
**Modello:** questo plan **non implementa nulla** — è la checklist di acceptance. Ogni voce ha un witness già pronto e la domanda esatta a cui rispondere. I difetti trovati diventano task numerati qui dentro (se piccoli) o plan figli (se grossi), come in PLAN-067.

---

## Regole del round

1. Ogni voce chiude con **un ruling** (`OK` / opzione scelta / nota difetto).
2. Un difetto piccolo → task `DF-NNN` in §3 di questo plan. Un difetto grosso → plan figlio linkato, la voce chiude con `→ PLAN-NNN`.
3. I plan sorgente non restano bloccati a livello di gate: il gate è **scaricato qui** (nota nel plan sorgente). La chiusura formale dei plan sorgente segue le regole dei loro bundle, che citano questo plan come sede del gate.
4. Quando tutte le voci hanno ruling → `verify:bundle` → chiusura. Nuovi gate umani accumulati nel frattempo entrano nel round successivo (`PLAN-068-R2` o voce aggiunta qui se non ancora chiuso).

## 2. Voci del round corrente

| # | Gate sorgente | Witness pronto | Domanda per il Director | Ruling |
|---|---|---|---|---|
| G-01 | PLAN-043-S11 · B4-map fork POI | `/poi-marker-lab` sezione «Sigillo fork» + `.mw/runs/plan043-s11-b4-poi-fork/` | Quale direzione? (baseline / A metalli / B campo+bordo / C halo-sagoma — anche combinata) | **differita** (visuale, R-236) |
| G-02 | PLAN-053 · OB-7 eye-check T-005 (rotta journey) | `/game` con journey attiva; baseline `.mw/runs/plan053-t005-route-visual-fork/` | La traccia villaggio→POI si riempie come da card A? | **differita** (visuale, R-236) |
| G-03 | PLAN-053 · OB-7 eye-check T-006 (strip 3 barre) | `/game`, quest window durante journey | Le 3 barre leggono andata/svolgimento/ritorno? | **differita** (visuale, R-236) |
| G-04 | PLAN-064 · eye-check moto post-entry | `/theater-lab` oppure PNG `post-entry-t0/t1` | La qualità percettiva del moto è accettabile? | **differita** (visuale, R-236) |
| G-05 | PLAN-043-S11 · decisioni D9 per batch | **`.mw/review/plan068-round/index.html`** (schede audit renderizzate + screenshot + **riconciliazione 2026-10-20 sera**: gran parte già fixata onda A PLAN-067 o rulata v1–v6) | solo le **decisioni residue**: F7 3 domande, CIN-1/2/3, ROS-H, BTN-1, v6/T-C2 dati, DN-3, DN-6/7, COL-D notte | aperta |
| G-06 | PLAN-043-S1 · verifica manuale F1 | checklist in `PLAN-043-S1` | F1 passa? | **differita** (visuale, R-236) |
| G-07 | PLAN-043-S2 · verifica manuale F1 | checklist in `PLAN-043-S2` | F1 passa? | **differita** (visuale, R-236) |
| G-08 | PLAN-027 · D6 review kit | **`.mw/review/plan068-round/index.html`** §G-08 — kit `src/balancing/config/idleVillage/quests/generation/narrated/race-miniera.kit.ts`, nodi r002 `viaA`/`imboscata`/`vetta` EN+IT | D6 ratificato? | aperta |
| G-09 | PLAN-050 · T-012 profiling WKWebView | hardware reale | Metriche entro soglia? | **differita** (hardware, R-236) |
| G-10 | PLAN-019-S1 · playtest quest | `/game` | La quest regge il playtest? | **differita** (esperienziale, R-236) |
| G-11 | PLAN-051 · trust-set approval | `npm run trusted:check` mostra il drift | Approvi il re-seal di `produceBundle.ts` (schema manifest T-005)? Azione: `npm run trusted:seal` + `npm run approve -- --kind=trust-set` | aperta (ledger) |

### Convenzione di presentazione (R-236, Director 2026-10-20)

> *«chiudi tutto quello che aspetta una mia decisione visiva»* + *«le cose come G05 voglio che siano aperte in un bel file, con immagini, ecc nella barra laterale, non un .md se devono essere sottoposte a me»*.

- Gate **visuali/esperienziali** (occhio su UI, gioco manuale, hardware): differiti alla sessione dedicata del Director — non bloccano il lavoro corrente.
- Gate **decisionali** (ruling su proposte, copy, ledger): presentati come **review page statica con immagini nella sidebar**, mai come `.md` nudi.
- Generatore: `npx tsx .mw/review/build-review.mts` → `.mw/review/plan068-round/index.html`; servire root repo (`python3 -m http.server 5199`) e aprire la preview su `/.mw/review/plan068-round/index.html`. Vale anche per i round futuri.

Nuove voci si accodano qui (stessa tabella) o al round successivo se questo è già in `verify:bundle`.

## 3. Difetti trovati nel round

| ID | Voce | Difetto | Fix | Stato |
|---|---|---|---|---|
| — | — | (vuota — si popola alla sessione del Director) | | |

## Contratto di chiusura

- Ogni voce §2 ha un ruling registrato (colonna «Ruling» compilata).
- Ogni `DF-NNN` ha una disposizione (fix qui o → plan figlio).
- Bundle `plan068-review-round` via `verify:bundle`; INDEX → `completato` solo dopo `plan:stamp close`.
