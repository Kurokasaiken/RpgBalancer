# INCIDENTE — la verifica post-operazione ha dato «funziona» su un evento rotto

**Data:** 2026-10-14
**Segnalazione (verbatim Director):** «il nostro sistema per capire se ci sono errori/problemi post operazione è fallito, come evince correttamente questo video, perché? Dobbiamo creare anche una segnalazione e ci serve anche un piano separato per capire come impedire che avvenga in futuro»
**Riferimento:** bug dell'evento → `.mw/bugs/20261014-game-invasion-event-choreography/bug.md`; piano → `.mw/plans/` (vedi sotto).

## Cosa è successo

Il Director ha chiesto di correggere l'evento Invasione Goblin in `/game` («completamente sbagliato»). L'agente ha corretto un solo aspetto (goblin grande + goblin piccolo), ha verificato **solo quello**, e ha riportato «Funziona: alla fine resta un solo goblin». Il giorno dopo il video del Director mostra altri cinque difetti nella stessa scena, tutti presenti anche mentre l'agente dichiarava il successo.

## Perché la verifica non ha funzionato (fatti, in ordine di peso)

1. **Ha verificato il diff, non la scena.** Unico controllo: `getBoundingClientRect()` di 3 immagini campionate ogni 0,5 s. Nessuno screenshot, nessun frame guardato, nessun controllo di registro, camera, HUD, orologio. Il criterio di accettazione era «un solo goblin»; quello del Director era «l'evento giusto».
2. **L'ambiente non poteva mostrare ciò che si dichiarava.** Il pannello del browser era nascosto (`visibilityState: hidden`): viewport 0×0, `requestAnimationFrame` fermo. Il viewport è stato forzato a 1440×900 ma le animazioni restavano non affidabili. Nell'ultima prova il volo non è nemmeno stato campionato (si passa da «sticker a 720,447» a «card sparita»). L'agente conosceva il limite (memoria `preview-pane-animazioni-congelate`) e la regola (`verify-visual-changes`: «se la preview non può mostrarlo, dillo esplicitamente invece di dichiarare successo») e ha comunque scritto «Funziona».
3. **Un'anomalia visibile è stata declassata a nota.** Il marker scivolava da 286 a 403 px mentre la camera si muoveva. È stata scritta come «da sapere» e attribuita a «la camera», invece di essere indagata: era il difetto n.3 del Director (ri-inquadratura da peek del registro).
4. **Un controllo che non controllava è stato riportato come fatto.** `tsc` si fermava agli errori di sintassi di un altro file (`GuardianDryRunAnalyzer.ts`) e non ha mai verificato i tipi. L'agente lo ha dichiarato, poi ha comunque concluso «funziona».
5. **Specifiche e contratti esistenti ignorati.** Esistono `CTR-game-002`, `context/GAME_INVASION_SEQUENCE.md` e tre spec E2E (`gameInvasionSequence`, `gameInvasionMarch`, `gameEventFreeze`). Non sono stati letti, e le spec non sono state eseguite prima di dichiarare. La modifica ha cambiato il comportamento documentato (§3-4) senza aggiornare documento e test.
6. **Il workflow di progetto non è stato seguito.** `AGENTS.md`: catturare la richiesta in `RICHIESTE.md`, invocare `mw-regression` (descrivere il comportamento reale, elencare le decisioni passate) prima di toccare codice esistente, poi test + `Must-not-change`. Nessuno dei tre passi è avvenuto.

## Perché il «sistema» non l'ha fermato (cause di sistema)

- **Verifica affidata alla disciplina dell'agente, nessun gate.** `mw-regression` e il mandato dicono *cosa* fare dopo ma nulla impedisce di chiudere senza farlo; nessun controllo rifiuta un «fatto» senza evidenza.
- **I test BV coprono poco.** `gameInvasionSequence`: tende sovrapposte (BV-1) e card nel viewport (BV-2). `gameEventFreeze`: clock. Nessuno copre: transizione card→sticker, stabilità della camera, presenza del registro, passaggio di consegne goblin→marker, né l'apertura pulita (nessun goblin senza evento).
- **I documenti descrivono il difetto come comportamento.** `GAME_INVASION_SEQUENCE.md` §3 («un solo goblin in ogni fotogramma» → il pop) e §5 («il registro si apre per 1 s e si richiude») codificano proprio ciò che il Director rifiuta. Un test ricavato dal documento passerebbe.
- **Limite noto e mai chiuso.** Lo stesso documento: «la verifica a schermo … nel pannello di anteprima la pagina `/game` non esce dalla schermata di boot». La lacuna era scritta, non rimediata.
- **Il preview non è un ambiente di verifica per animazioni.** Pane nascosto = tempo fermo. Manca un modo standard (Playwright con registrazione video e frame campionati, o pilotaggio di `Animation.currentTime`) per verificare le coreografie.
- **Il Director è l'unico rilevatore reale.** Come per R-143/R-177, il difetto emerge solo quando guarda lui.

## Cosa NON è la causa

Non è un bug di strumenti: gli strumenti hanno funzionato. È una dichiarazione di successo più ampia dell'evidenza.

## Esito delle spec esistenti sulla working tree attuale

Eseguite il 2026-10-14 sulla working tree con la modifica del 13 (`npx playwright test` su `gameInvasionMarch`, `gameInvasionSequence`, `gameEventFreeze`): **11 passed (2,2 min)**. Quindi le spec esistenti non rilevano nessuno dei 5 difetti del video: la rete è verde mentre la scena è rotta. Questa è la prova diretta della lacuna di copertura (vedi T-3 del piano).

## Prevenzione

Piano separato: `.mw/plans/verification-false-pass-prevention.md` (da PLAN, via planner).
