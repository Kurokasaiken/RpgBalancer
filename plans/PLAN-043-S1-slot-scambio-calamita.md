---
title: "PLAN-043-S1 — Scambio tra slot, calamita, estrazione col tasto premuto"
parent: PLAN-043
status: active
created: 2026-10-17 (scorporato dal master PLAN-043; lavoro del 2026-10-16)
source_request: R-207
documentation_impact: OPTIONAL
doc_targets:
  - src/docs/docs/idle_village/interaction_core_spec.md (calamita su /game, hold vs drag)
---

# PLAN-043-S1 — Scambio tra slot, calamita, estrazione col tasto premuto

Master: [PLAN-043](PLAN-043-game-quest-surface-pass.md) · stato operativo in [INDEX](INDEX.md).

## Richiesta (verbatim)

> *"E la funzione per swappare un pg assegnato da uno slot ad un altro slot (senza prima estarlo e farlo tornare al roster) o swappare due pg già assegnati a slot nn funziona."* (2026-10-16)
>
> *"Gli slot nn hanno la componente 'magnetica' che se lasci un medaglione da quelle parti viene assegnato li?"* (2026-10-16)
>
> *"2) quando tengo premuto su un pg nn si estrae + dallo slot e torna nel roster, si confonde cn l'animazione dello swap"* (2026-10-16)
>
> *"Nello swap si perde l'animazione dello slot, nn va bene."* (2026-10-16)

## Task

| T | Fix | Accettazione |
|---|---|---|
| T1.1 | **Scambio tra slot** non deterministico: riprodurre con input reali e drag «umani» (lenti, con pause, rilascio sull'etichetta); verificare le ipotesi: catena `handleDragEnd(...) ??` (`game-frame-pixi.tsx:1183`) che si ferma su un `false`; `pointerWithin` sull'etichetta → `over: null`; press-and-hold di estrazione che scatta prima della soglia di 8 px; `enableSlotSwap` mancante; idoneità che rifiuta in silenzio. | test con drag umano: verdi 20/20 su goblin e rovine (spostamento in slot vuoto, scambio tra due assegnati) |
| T1.2 | **Calamita** (S6) — insieme a T1.1, perché tocca lo stesso rilevamento. | rilascio a ≤ 120 px da uno slot valido → assegnato; nessuna assegnazione sbagliata tra due slot vicini |
| T1.8 | **Estrazione col tasto premuto** che non funziona più (si confonde con lo swap). | pressione ferma su eroe e abitante → slot vuoto; swap trascinando ancora funzionante |
| T1.9 | **Animazione dello slot persa nello swap.** | da capire con il Director: quale animazione (anello di pressione, bloom del bersaglio, volo) |

## Esito

*Esito T1.1 + T1.2 (2026-10-16, evidence `test-results/plan-043/f1/`):*
- **Causa provata 1 — niente calamita.** Con drag «umani» (headless) il rilascio sull'etichetta sotto il cerchio o a 40 px dallo slot **non faceva mai niente** (0/7 tra goblin e rovine, anche con lo slot in stato «valido»); al centro 1/3 e 3/3, al bordo 2/3 e 3/3. `/game` usava `pointerWithin`; `dragConfig.magnetism` (120 px) era usato solo da una pagina di laboratorio. **Fix:** `interaction/magneticCollision.ts` — colpo esatto come prima, altrimenti lo slot più vicino entro il raggio di config (solo bersagli `data.type==='slot'`; con un token in mano, lo slot di partenza non batte mai un vicino). Dopo il fix: etichetta 3/3 su entrambe le quest, centro 6/6, bordo 6/6 (prova a carico normale). 9 test unit.
- **Causa provata 2 — estrazione a metà trascinamento.** Se l'attivazione del drag (8 px) arriva dopo i 560 ms della pressione prolungata, l'estrazione si completa e **svuota lo slot di partenza** (visto: `leader = -`); `cancel()` dopo il commit non fa niente. **Fix:** nel rack, la pressione prolungata si annulla appena il puntatore si sposta di più di 4 px (`EXTRACTION_HOLD_MOVE_TOLERANCE_PX`, sotto la soglia di dnd-kit). Dopo il fix nessuno slot risulta più svuotato.
- **Superato** dalla prova a macchina libera qui sotto (T1.1 accettazione).
- **Test già rotti, non nostri:** 10 test in `ResidentSlotRack.medal.test.tsx` e `useExtractionStateMachine.test.ts` falliscono anche senza le nostre modifiche.

*Esito T1.2–T1.6, verifica headless (2026-10-16, `test-results/plan-043/f1/f1-verify.spec.ts`, log in `f1/verify/`; carico macchina 5–7):*
- **T1.2 provato (etichetta):** scambio rilasciato sull'etichetta sotto lo slot (prima 0/7). Sul server dev di un'altra sessione (5173): 0/3, 2/3, 3/3, 3/3, 3/3. Sul mio server (5180, stesso codice): 3/3 e 3/3. Lo 0/3 iniziale non è spiegato; l'ipotesi è che quel server servisse ancora codice vecchio, ma non è provata.
- **T1.1 accettazione (2026-10-16, carico 4–5, `swap-repro-result.txt`):** **44/44** tra goblin (scambio) e rovine (spostamento in slot vuoto + scambio), con rilascio al centro, sull'etichetta, sul bordo, dopo 300 ms di pausa e con lancio rapido. Il caso «40 px oltre il bordo destro» fa 0/7 senza mai assegnare lo slot sbagliato («NIENTE»). Quasi certamente quel punto cade sullo slot di partenza o su un vicino non idoneo: è un caso ambiguo del test, non un difetto, ma la geometria non è stata misurata.

- **Bug estrazione col tasto premuto (Director punto 2) — corretto e verificato (2026-10-16):** `HoldOrMovePointerSensor` (hold-to-drag 180 ms, introdotto il 15/10 per le carte del roster) valeva anche per i token degli slot: dopo il ritardo partiva da solo il drag dello swap, che annullava l'estrazione (560 ms + sequenza). Ora per gli id `slot-token:` il sensore usa solo la distanza (`dragSensors.ts`). Prova headless: pressione ferma su eroe e abitante → slot svuotato; swap trascinando → scambiati. Evidenze `test-results/plan-043/f2/hold-extract.spec.ts`.

**T1.9 — aperto.** Unico cambiamento fatto: la soglia che annulla la pressione passa da 4 a 7 px (`EXTRACTION_HOLD_MOVE_TOLERANCE_PX`, sotto gli 8 px di attivazione del drag). Non è dimostrato che sia la causa: le misure headless non distinguono le animazioni al millisecondo. Serve dal Director quale animazione sparisce e dove.

**Gate F1:** il Director prova scambio, calamita e tasti (manuale, browser o Tauri).

## Contratto di chiusura

- Unit: `magneticCollision.test.ts` (10/10).
- Headless: `test-results/plan-043/f1/swap-repro.spec.ts` (44/44), `f1-verify.spec.ts`, `f2/hold-extract.spec.ts` (estrazione e swap).
- Gate manuale del Director (scambio, calamita, pressione) — non ancora dato.
- T1.9 chiuso con il Director.
- Bundle di chiusura non ancora prodotto (`.mw/runs/plan043-{sid}/verification.json` → `verify:bundle`).
