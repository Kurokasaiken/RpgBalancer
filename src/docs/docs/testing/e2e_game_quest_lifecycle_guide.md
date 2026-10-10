# Guida E2E — ciclo di vita quest «Sterminio dei goblin» su `/game`

**Richiesta:** R-119 · **Suite:** `tests/e2e/idleVillage/gameQuestLifecycle.spec.ts`
**Stato:** 11/11 verdi · **Ultima verifica:** 2026-10-11 · **Evidence:** `test-results/r119-quest-lifecycle-e2e-2026-10-11.log`

Questa guida serve a **far evolvere il flusso poco a poco**: quando un test
fallisce, qui trovi cosa sta controllando, perché può rompersi, e dove andare
a guardare nel codice. Il contratto desiderato è il §4; la tabella dei
fallimenti noti è il §6.

---

## 1. Come si lancia

```bash
source ~/.nvm/nvm.sh && nvm use        # sempre: Node pinnato da .nvmrc

# Suite intera (~2 min: build + 11 test)
npx playwright test tests/e2e/idleVillage/gameQuestLifecycle.spec.ts --project="Desktop Chrome"

# Un solo test (match sul titolo)
npx playwright test tests/e2e/idleVillage/gameQuestLifecycle.spec.ts --project="Desktop Chrome" -g "esito"

# Con browser visibile (debug manuale del flusso)
npx playwright test tests/e2e/idleVillage/gameQuestLifecycle.spec.ts --project="Desktop Chrome" --headed -g "lancio"

# Step-by-step interattivo
npx playwright test tests/e2e/idleVillage/gameQuestLifecycle.spec.ts --project="Desktop Chrome" --debug -g "planning"

# Dopo un fallimento: aprire la trace (screenshot + DOM + timing per ogni step)
npx playwright show-trace test-results/<cartella-del-test>/trace.zip
```

Il `webServer` di Playwright fa da solo `build:playwright` + `vite preview`
sulla porta 5179 — non serve avviare nulla a mano.

Safeguard obbligatori dopo ogni modifica:

```bash
npm run lint -- tests/e2e/idleVillage src/ui/idleVillage/quests src/pages/game-frame-pixi.tsx
npm run test -- tests/unit/idleVillage/quests
npm run build:check
npm run kanban:lint
# regressione: la suite gemella pre-esistente
npx playwright test tests/e2e/idleVillage/gameQuestExpedition.spec.ts --project="Desktop Chrome"
```

---

## 2. Architettura del test: cosa è «reale» e cosa passa dagli hook

Il principio: **interazione DOM vera dove conta, hook di dominio per
determinismo e ispezione**. Gli hook non sono una scorciatoia che bypassa le
regole — `assignToSlot` usa la stessa validazione del drag reale.

| Strato | Meccanismo | Dove |
|---|---|---|
| Click sul marker mappa | DOM reale (`data-quest-poi-id`) | `openGoblinDetailViaMap` |
| Assegnazione al party | **drag pointer reale** (`dragResidentPointer`) in un test; hook `assignToSlot` (stessa eligibilità) negli altri | test «drag reale» vs helper |
| Click «Invia spedizione» | DOM reale, dopo `bringSendIntoView` | `launchGoblinQuest` |
| Controlli tempo | DOM reale: radiogroup pausa / `×1` `×2` `×4` nel ribbon HUD | test «clock» |
| Chiusura rapporto | DOM reale su `quest-window-close-report` | test «chiusura» |
| Lettura ricompensa | DOM reale: `ResourceReadout` nel ribbon (`role=group`, `aria-label`) | `goldReadoutValue` |
| Lettura stato run/settlement/villaggio | hook `getRun` / `getSettlement` / `getVillage` | ovunque |
| Avanzamento tempo | hook `advanceTicks(n)` = `tick()` canonico dello store | driver helper |
| Scelte nei bivi | hook `choose(optionId)` (i tasti 1–9 esistono ma l'hook è deterministico) | `driveRunToEnd` |

### Mappa degli hook — `window.__idleVillageTestHooks`

```ts
// per-POI: window.__idleVillageTestHooks.expedition[poiId]
openDetail() / closeDetail() / isDetailOpen()
assignToSlot(slotId, residentId) -> boolean      // false = rifiutato, come un drop invalido
checkEligibility(slotId, residentId) -> { eligible, reason? }  // reason es. 'in-expedition'
getAssignments() -> Record<slotId, residentId|null>
getEstimate() / getEstimateJson()                // forecast Monte Carlo
getResolvedOffer()                               // offerta congelata del giorno
send()                                           // equivalente al click «Invia»
getRun() -> { nodeId, frontier: {status:'pending'|'waiting'|'ready', readyAt}, party, ended, outcome?, gold?, xp?, resolvedOffer? } | null
getOptions() -> string[]                          // optionId della frontiera waiting
choose(optionId, useConsumable?)
getSettlement() -> { status, plan: { outcome, effects[] } } | null
getVillage() -> { gold, xp, residents: [{ id, isDead, isInjured, ... }] }
getHalo()

// globali
advanceTicks(n)                                  // n tick sul clock canonico
getClock() -> { currentTick, isPaused, speedMultiplier }
```

### Selettori stabili (contratto test↔UI)

| Selettore | Elemento |
|---|---|
| `[data-quest-poi-id="poi-goblin"]` | marker mappa; stato in `data-quest-status` (`available`/`in_progress`/`completed`/`failed`) |
| `[data-testid="quest-expedition-detail"]` | FloatingPanel del planner |
| `[data-testid="floating-panel-header-quest-expedition-poi-goblin"]` | header (qui vive il **titolo** «Sterminio dei goblin»; nel body c'è l'objective) |
| `[data-testid="quest-expedition-send"]` | bottone «Invia spedizione» |
| `[data-testid="quest-expedition-forecast"]` | forecast; stato in `data-forecast-state` (`incomplete`/`ready`) |
| `[data-slot-id="<poi>:<slot>"]` | drop-zone degli slot party |
| `[data-worker-id="<residentId>"]` | card roster; compatibilità in `data-compatibility` (`valid`/`invalid`) |
| `[data-testid="quest-window"]` | finestra run/teatro |
| `[data-testid="quest-window-close-report"]` | «Chiudi il rapporto» (visibile **solo** a teatro finito) |
| `[role="radiogroup"]` → radio `×1`/`×2`/`×4`, primo radio = pausa | controlli tempo HUD |
| `[role="group"][aria-label^="Gold" o "Oro"]` | readout risorse nel ribbon |

### Fixture

```
POI goblin:    poi-goblin   (quest 'goblin', scenario «Sterminio dei goblin»)
POI controllo: poi-rovine   (quest 'rovine' — verifica che solo goblin si consumi)
Slot:   poi-goblin:goblin-slot-leader | -member-1 | -member-2 | -bodyguard
        poi-rovine:rovine-slot-leader
Residenti: hero-sir-spaccaculi  → eleggibile leader/member/bodyguard
           hero-giggiolillo    → eleggibile member (clarity|precision)
           hero-salvatrice     → NON eleggibile al gate leader (ward/clarity vs edge|fortitude)
```

---

## 3. Gli 11 test e cosa inchiodano

| # | Test | Invariante verificata |
|---|---|---|
| 1 | `boot` | Roster seedato (3 card), marker goblin visibile e `available` |
| 2 | `planning` | Click marker → detail; «Invia» disabilitato a slot vuoti; forecast `incomplete`; salvatrice rifiutata (`checkEligibility:false` + `assignToSlot:false` + card `invalid`) |
| 3 | `planning: drag reale` | Drag pointer card→slot assegna il leader; forecast → `ready`; «Invia» abilitato |
| 4 | `clock: pausa/ripresa` | Pausa: 0 tick in 2.2s; ripresa: tick riparte; **≤3 tick in 2.2s a ×1** (un solo driver!) |
| 5 | `clock: ×4` | delta tick a ×4 ≥ 2× il delta a ×1 |
| 6 | `lancio` | «Invia» → QuestRunWindow; POI `in_progress`; party contiene il leader; leader `in-expedition` per altri slot |
| 7 | `run: frontiera` | Frontiera `pending` congelata in pausa, matura a ×4 sul clock reale |
| 8 | `esito` | Settlement una sola volta: outcome, `loadout-release`, destini residenti come dati (piano **+** store, letti a clock in pausa), **delta gold esatto nello store E nel readout HUD**, nessun doppio settle dopo tick extra |
| 12 | `Director` | Bottone «start goblin quest» del Director panel (F10): `demoLaunch` attraversa la stessa `send()` del click reale → run su grafo goblin, party ⊆ roster, settle + delta gold store/HUD, POI consumato, assente dopo reload |
| 9 | `PG a casa` | Dopo il settle il leader è ri-assegnabile su rovine (salvo morte); `isDead` coerente |
| 10 | `chiusura rapporto` | Click «Chiudi» → window chiusa, **marker goblin sparito**, run `null`, rovine intatto |
| 11 | `reload` | Il POI consumato non torna dopo reload (persistenza `idleVillage.questPois.consumed`); roster operativo |

---

## 4. Il contratto desiderato (cosa deve restare vero)

```
marker available → click → planner → slot riempiti → forecast ready
→ «Invia» → run in window + POI in_progress + party locked
→ frontiere pending maturano SOLO col clock (pausa = congelate)
→ bivi waiting = scelta giocatore
→ ended → settlement ESATTO-UNA-VOLTA (rewards + destini + loadout-release)
→ party di nuovo eleggibile («a casa»)
→ chiusura report → POI consumed + run cleared → marker fuori mappa
→ reload → il POI non resuscita
```

- **Un solo clock driver per screen** (`useTimeEngineLoop` in `GameFrameScreen`). Se a ×1 vedi ~2 tick/s c'è un secondo driver: è già successo (`useCentralizedTiming` doppione, fixato in R-119).
- **Ogni esito terminale ⇒ il POI chiude** (tabella terminali PLAN-019-S2.5). La rimozione avviene alla *chiusura del report*, non al settle.
- **`getVillage()` e il ribbon HUD devono raccontare lo stesso numero.** Il test legge entrambi: se divergono, una delle due superfici mente.
- Persistenza solo via `PersistenceService` — mai storage diretto.
- Le scelte nei test sono deterministiche ma **tolleranti al path**: `driveRunToEnd` ruota le opzioni sui nodi ripetuti (push-your-luck) e accetta `reward|survived|fled|wipe`. Non assumere un esito specifico.

---

## 5. Helper della suite — riusali, non riscriverli

| Helper | Uso |
|---|---|
| `waitForHooks(page)` | dopo ogni `goto`/`reload`: aspetta che gli hook expedition di goblin+rovine esistano |
| `openGoblinDetailViaMap(page)` | click reale sul marker + assert header |
| `bringSendIntoView(page)` | trascina l'header del FloatingPanel finché «Invia» non rientra nel viewport (necessario se il pannello è più alto dello schermo) |
| `launchGoblinQuest(page)` | tutto il pre-volo: marker → assign leader → click «Invia» → window aperta |
| `driveToPending(page)` | risolve bivi finché la frontiera è `pending` (per testare il clock) |
| `driveRunToEnd(page)` | guida la run fino a `ended` (scelte + tick) |
| `waitForSettled(page)` | aspetta `getSettlement().status === 'settled'` |
| `flushBeatTheatre(page)` | preme Enter finché «Chiudi rapporto» appare (skippa il replay dei beat) |
| `goldReadoutValue(page)` | numero gold dal DOM del ribbon HUD |
| `expedition<T>(page, 'metodo', ...args)` / `expeditionFor` | chiamata hook generica per POI |
| `advanceTicks(page, n)` / `getClock(page)` | tempo |

Sequenza tipica di un test «post-lancio»:

```ts
await launchGoblinQuest(page);
const terminal = await driveRunToEnd(page);
await waitForSettled(page);
await flushBeatTheatre(page);              // ← SEMPRE prima di cercare «Chiudi»
await closeReportButton(page).click();
```

---

## 6. Fallimenti noti → diagnosi

Questa è la parte da usare «poco a poco»: ogni riga è un errore già visto,
la causa e dove intervenire.

| Sintomo | Causa probabile | Dove guardare |
|---|---|---|
| `locator.click: element is outside of the viewport` su `quest-expedition-send` | Il planner è più alto dello schermo (es. `panelMaxBodyHeightPx` grande). Il `FloatingPanel` clamp-a solo il top-left, **non** il bordo inferiore. | `QUEST_PLANNER_INFO.outcome.panelMaxBodyHeightPx`; `FloatingPanel` (clamp bottom — **fix UI ancora aperto**, oggi il test aggira con `bringSendIntoView`) |
| `quest-window-close-report` mai visibile / timeout | Il teatro dei beat sta ancora replayando (`presenting`): i controlli del report esistono solo a coda vuota. | `flushBeatTheatre` prima del click; `QuestRunWindow` `beatCursor`/`BeatStage` |
| `toContainText('Sterminio dei goblin')` fallisce sul detail | Il titolo sta nell'**header** del FloatingPanel, non nel body (il body mostra l'objective). | Asserisci su `floating-panel-header-quest-expedition-poi-goblin` |
| `data-compatibility` resta `valid` sul residente invalido | La compatibilità visiva si ricalcola solo quando cambia lo stato planning (es. dopo un'assegnazione che le toglie l'unico slot). | Fai prima un'assegnazione valida, poi asserisci `invalid` |
| Test «pending» trova la run già oltre il nodo atteso | Il clock reale continua a girare mentre il test ragiona: una frontiera può maturare «da sola». | Usa helper tolleranti (`driveToPending`/`driveRunToEnd` accettano transizioni già avvenute); mai asserire un nodo intermedio esatto senza pausa |
| `POI is not defined` dentro `waitForFunction` | La predicate gira **nel browser**: le costanti Node non esistono lì. | Passa gli argomenti a `waitForFunction(fn, arg, opts)` |
| Tick a ×1 ~2× il previsto | Doppio driver del clock montato su `/game`. | Un solo `useTimeEngineLoop` (in `GameFrameScreen`); niente `useCentralizedTiming` nella pagina |
| Delta gold store ≠ delta readout HUD | Settlement scritto nello store ma `ResourceReadout` non ri-renderizza (o legge un selettore diverso). | `buildResourceReadoutItems` / `selectResourceOutlook` / `HudRibbon` |
| `villageAfter.gold - before ≠ expected` | Doppio settle, o `rewardResolved`/`gold` loot non applicato come da contratto (reward solo su `reward`; loot perso su `wipe`). | `questSettlement.ts` `applyQuestSettlement`; marker `settling`→`settled` |
| POI riappare dopo reload | La lista consumed non è persistita/letta. | `idleVillage.questPois.consumed` via `PersistenceService`; filtro anchors in `game-frame-pixi.tsx` |
| `assignToSlot` ritorna false su residente «giusto» | Gate di elegibilità cambiato (tag requirement dello slot o stat del residente). | `questResidentEligibility`; requirement nello scenario `goblin.ts`; stat nel seed roster |
| `member.wounded` ma `resident.isInjured` false (flaky) | **Le ferite scadono**: `QUEST_SETTLEMENT.woundRecoveryTicks` = 5 tick, e `tick()` sana i residenti con `injuredUntilTick <= currentTick`. Sul clock vivo, `flushBeatTheatre`+lettura possono bruciare >5 tick. | Mettere in pausa subito dopo `driveRunToEnd` prima di leggere i destini; il contratto deterministico resta nel `settlement.plan.effects` (`resident-wounded`/`resident-dead`) — asserire entrambi. Nota: i feriti RESTANO eleggibili (`assignableStatuses` include `injured`). |
| Director «start goblin quest» non apre nulla | Il panel è solo dev/playwright (`import.meta.env.DEV \|\| MODE === 'playwright'`) e F10-toggle; `demoLaunch` riempie solo slot **required** coi primi elegibili — se nessuno è eleggibile il detail resta aperto senza lanciare. | `directorEnabled` in `game-frame-pixi.tsx`; `demoLaunch` in `useQuestExpeditionSession`; verifica che esista un residente eleggibile per `goblin-slot-leader` (edge\|fortitude). |
| `waiting frontier without options` | Il nodo è waiting ma `getOptions` è vuoto: scena senza opzioni raggiungibili (config rotta). | `availableOptions(run)`; opzioni del nodo nello scenario |
| Marker mai `available` al boot | Il seed POI non è caricato o è filtrato come consumed residuo da una run precedente. | Seed POI; pulizia storage del context Playwright (ogni test parte da context pulito) |

---

## 7. Quando modifichi il gioco: checklist anti-rottura

Prima di toccare un pezzo coperto dalla suite, chiediti quale invariante
muovi e quale test lo inchioda:

- **Cambi il planner/panello expedition?** → test 2, 3, 6 + `bringSendIntoView`. Se il pannello cresce ancora, il trascino ha un limite (4 tentativi): il vero fix è il clamp bottom del `FloatingPanel`.
- **Cambi lo scenario goblin** (nodi, slot, requirement, copia)? → test 2 (gate), 3 (forecast), 7-8 (driver). I titoli dei nodi cambiano: l'unico titolo asserito è quello dello **scenario** nell'header, non dei nodi.
- **Cambi il clock o i controlli HUD?** → test 4, 5, 7. Il radiogroup deve restare `role=radiogroup` con radio `×N`.
- **Cambi il settlement/reward?** → test 8. Tocca sia store sia readout HUD: aggiorna entrambi i lati dell'asserzione se il contratto cambia *intenzionalmente*.
- **Cambi la chiusura/consumo POI?** → test 10, 11. Qualunque via di chiusura (X, «Chiudi», menu pannelli, Q) deve portare a consumed+cleared.
- **Aggiungi un POI quest?** → riusa gli helper con `expeditionFor(page, '<poi-id>', ...)`; il pattern non è goblin-specifico.
- **Rinomini un testid/attributo?** → è un contratto pubblico: aggiorna la suite **e** questa guida (tabella selettori §2).

Regola pratica: **un test rosso dopo una tua modifica è un segnale, non un
fastidio** — prima chiediti «il contratto è cambiato apposta?» Se sì,
aggiorna il test e la guida; se no, hai trovato un bug.

---

## 8. File del flow (mappa rapida per il debug)

| Area | File |
|---|---|
| Pagina `/game` (anchors, consumo POI, clock) | `src/pages/game-frame-pixi.tsx` |
| Marker mappa | `src/ui/idleVillage/components/gameFrame/MapQuestPoi.tsx` |
| Planner/detail | `src/ui/idleVillage/quests/QuestExpeditionDetail.tsx` |
| Sessione spedizione (hook, assignment, send, settle) | `src/ui/idleVillage/quests/useQuestExpeditionSession.tsx` |
| Run attiva (frontiere, scelte, clock-sync) | `src/ui/idleVillage/quests/useQuestRun.ts` |
| Settlement (piano + apply idempotente) | `src/ui/idleVillage/quests/questSettlement.ts` |
| Finestra run + teatro beat | `src/ui/idleVillage/components/gameFrame/QuestRunWindow.tsx` |
| Store villaggio/clock | `useMinimalGameplayStore` |
| Driver clock `/game` | `useTimeEngineLoop` (in GameFrameScreen) |
| Readout risorse HUD | `ResourceReadout` + `buildResourceReadoutItems` |
| Scenario authored | `src/balancing/config/idleVillage/quests/scenarios/goblin.ts` |
| Config planner | `QUEST_PLANNER_INFO` |
| Suite gemella (regressione) | `tests/e2e/idleVillage/gameQuestExpedition.spec.ts` |

---

## 9. Finding aperti (da chiudere «poco a poco»)

1. **`FloatingPanel` senza clamp sul bordo inferiore** — con
   `panelMaxBodyHeightPx: 700` e viewport 720p «Invia spedizione» finisce
   fuori schermo. Oggi il test aggira (`bringSendIntoView`), ma un giocatore
   su schermo piccolo ha lo stesso problema. Fix candidato: clamp bottom o
   scroll interno del body del panel.
2. **Asserzioni visive del forecast** — il test legge `data-forecast-state`
   e l'`estimate` via hook; il contenuto visivo del forecast (probabilità,
   bande) non è asserito nel DOM.
3. **Copertura esiti** — il driver accetta qualunque esito; non esiste un
   test che forzi `wipe` o `fled` per verificare i rami di reward/zero-loot.
4. **Consumabili/scelte numeriche da tastiera** — `choose` via hook copre la
   logica, i tasti 1–9 del DOM non sono asseriti.
