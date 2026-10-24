# Guida E2E — ciclo di vita quest «Sterminio dei goblin» su `/game`

**Richiesta:** R-119 (+R-124 reveal, roster 3 eroi + 3 popolani; **R-200** auto-reveal + `repeatable` goblin; driver adattati a R-199; **PLAN-043 WS-4** check in colonna destra, **PLAN-067 T-C2** epilogo→nicchie crew) · **Suite:** `tests/e2e/idleVillage/gameQuestLifecycle.spec.ts`
**Stato:** 13/13 · **Ultima verifica:** 2026-10-23 · **Evidence:** `test-results/r119-quest-lifecycle-e2e-2026-10-11.log`, `test-results/r200-quest-reveal-2026-10-16.log` (bundle PASS 7/7)

Questa guida serve a **far evolvere il flusso poco a poco**: quando un test
fallisce, qui trovi cosa sta controllando, perché può rompersi, e dove andare
a guardare nel codice. Il contratto desiderato è il §4; la tabella dei
fallimenti noti è il §6.

---

## 0. Le due suite — quale lanciare

| Suite | Cosa fa | Quando usarla |
|---|---|---|
| `gameQuestFullFlow.spec.ts` (**R-183**) | **Solo input reali**: auto-reveal (R-200) + Regia F10 → «Show quest» (reveal-ora) → click marker → drag roster→slot → **swap slot↔slot** → bottoni consumabili → «Invia» → ×4 dal ribbon → scelte **cliccate** nella QuestRunWindow, beat saltati con Enter, cintura armata/cura → rapporto → **XP ai PG** → oro nel readout HUD → «Chiudi rapporto» → POI goblin torna `available` → reload. Gli hook servono **solo in lettura** (assegnazioni, run, settlement, villaggio). Salva uno screenshot per passaggio (`QUEST_DOC_SHOTS=1` li scrive in `quest_full_flow/`). | «Il gioco funziona davvero da capo a fondo?» — prova di accettazione, base del documento illustrato |
| `gameQuestLifecycle.spec.ts` (R-119) | 13 test mirati e deterministici: assegnazioni e scelte via hook, tempo via `advanceTicks`. | Diagnosi: quale invariante si è rotta (gate, clock, settlement, reload) |
| `gameQuestReveal.spec.ts` (**R-200**) | Auto-reveal post-veil (un marker alla volta, stagger ~5s, mai scomparsi), «Mostra quest» one-way, Reset ri-arma. | Regressione del canale reveal |

Documento illustrato (cosa succede, quando e come, con gli screenshot della
suite R-183): [`quest_full_flow_walkthrough.md`](./quest_full_flow_walkthrough.md).

```bash
source ~/.nvm/nvm.sh && nvm use
# la suite R-183 (una sola run lunga, ~3-6 min incluso build)
npx playwright test tests/e2e/idleVillage/gameQuestFullFlow.spec.ts --project="Desktop Chrome"
# rigenerare le immagini del documento illustrato (sovrascrive quest_full_flow/*.jpg)
QUEST_DOC_SHOTS=1 npx playwright test tests/e2e/idleVillage/gameQuestFullFlow.spec.ts --project="Desktop Chrome"
# vederla girare
npx playwright test tests/e2e/idleVillage/gameQuestFullFlow.spec.ts --project="Desktop Chrome" --headed
```

Senza `QUEST_DOC_SHOTS` gli screenshot finiscono negli allegati del report
(`npx playwright show-report`) e in `test-results/<cartella-del-test>/`.
L'esito della run (nodi visitati, scelte, consumabili usati) è nelle
*annotations* del test nel report.

**La run non è truccata:** l'esito è quello che esce dai dadi del motore
(seed casuale a ogni «Invia»). La suite accetta `reward|survived|fled|wipe`
e asserisce il contratto di ciascuno (XP solo ai sopravvissuti, nessuna XP
su wipe, oro HUD = effetti `village-gold` del settlement).

---

## 1. Come si lancia

```bash
source ~/.nvm/nvm.sh && nvm use        # sempre: Node pinnato da .nvmrc

# Suite intera (~10 min su macchina carica: build + 13 test)
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
| Click sul marker mappa | DOM reale (`data-quest-poi-id`), **dopo il reveal** | `openGoblinDetailViaMap` → `revealQuestPois` |
| Assegnazione al party | **drag pointer reale** (`dragResidentPointer`) in un test; hook `assignToSlot` (stessa eligibilità) negli altri | test «drag reale» vs helper |
| Click «Invia spedizione» | DOM reale, dopo `bringSendIntoView` | `launchGoblinQuest` |
| Controlli tempo | DOM reale: radiogroup pausa / `×1` `×2` `×4` nel ribbon HUD; **con quest window aperta il gruppo è coperto** (PLAN-067) → `dispatchEvent('click')` | test «clock»; dispatchEvent nei test post-lancio |
| Chiusura rapporto | DOM reale: `quest-reward-close` sul **popup esterno** `QuestRewardPopup` (R-199 — copre fisicamente il vecchio `quest-window-close-report` nella window) | `dismissQuestReport` |
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
revealQuestPois()                                // SOLO per `?capture=1` — la suite usa il vero pulsante Director
```

> **R-124…R-180 — storico; superato da R-200.** Gli anchor expedition sono
> gated su `questShown || poiDemo || autoRevealed || run` — **le offerte
> compaiono da sole**: dopo l'uscita del boot veil un `setTimeout` per-POI
> (`gameFrameConfig.questReveal`: `initialDelayMs` 1000, `staggerMs` 5000,
> ordine authored) monta un marker alla volta in modo additivo (mai spenti;
> «nessun POI al boot» di R-124 vale solo nella finestra prima del primo
> reveal). «Mostra quest» è un trigger **one-way** «reveal ora» (salta lo
> stagger, non nasconde mai); «Reset» svuota il set e ri-arma lo stagger.
> **R-180 resta:** «POI types» rivela ANCHE i marker quest reali — un marker
> quest NON è mai un esemplare demo. **I test rivelano SEMPRE dal vero
> pulsante**: `revealQuestPois(page)` fa F10 → `[data-action-id="quest"]` → F10
> (l'hook window resta solo per `?capture=1`, dove il Director è nascosto).
> Al reveal l'offerta fresca ha halo **vuota** (si riempie solo con
> `activityProgress` della run); in finestra `expiring` l'anello è ambra warn
> e scarica antiorario.

### Selettori stabili (contratto test↔UI)

| Selettore | Elemento |
|---|---|
| `[data-map-quest-poi-target]` | ogni marker quest sulla mappa (count 0 = mappa pulita, R-124) |
| `[data-quest-poi-id="poi-goblin"]` | marker mappa; stato in `data-quest-status` (`available`/`in_progress`/`completed`/`failed`) |
| `[data-testid="quest-expedition-detail"]` | pannello `HudPlaque` del planner (R-146: ex FloatingPanel) |
| `[data-testid="floating-panel-header-quest-expedition-poi-goblin"]` | header (qui vive il **titolo** «Sterminio dei goblin»; nel body c'è l'objective) |
| `[data-testid="quest-expedition-send"]` | bottone «Invia spedizione» |
| `[data-testid="quest-expedition-forecast"]` | forecast; stato in `data-forecast-state` (`incomplete`/`ready`) |
| `[data-slot-id="<poi>:<slot>"]` | drop-zone degli slot party |
| `[data-worker-id="<residentId>"]` | card roster; compatibilità in `data-compatibility` (`valid`/`invalid`) |
| `[data-testid="quest-window"]` | finestra run/teatro |
| `[data-testid="quest-reward-close"]` | «Chiudi» del **popup reward esterno** (R-199) — il report vive lì, non più nella window; il bottone `quest-window-close-report` esiste ancora nel DOM ma è coperto dal popup (z-1200) |
| `[data-testid="quest-window-close-report"]` | «Chiudi il rapporto» dentro la window — **non cliccabile** finché il popup esterno lo copre |
| `.da-tira` (page-level) | **PLAN-043 WS-4** check beat in hold: l'astrolabe vive nella **colonna destra** `quest-check-column` (o nel fallback centrato `quest-check-overlay` quando la window è minimizzata). Il bottone resta montato per TUTTO il beat held — il theatre avanza solo se il tiro risolve o il beat viene saltato via bridge (`progress`/`skip`) |
| `[data-testid="quest-check-column"]` | colonna destra WS-4: `data-check-resolved`/`data-check-armed` segnano verdict dipinto / dismiss armato; click sulla colonna armata = dismiss |
| `[data-testid="quest-verdict-card"]` | card verdict sotto il board — informativa, nessun controllo continue |
| `[data-testid="quest-returned-crew"]` → `crew-niche-<id>` `[data-crew-state]` | **PLAN-067 T-C2** «who came back»: una nicchia per membro (`returned`/`wounded`/`fallen`) — sostituisce le sezioni `dead`/`wounded` dell'epilogo nel report |
| `[role="radiogroup"]` → radio `×1`/`×2`/`×4`, primo radio = pausa | controlli tempo HUD |
| `[role="group"][aria-label^="Gold" o "Oro"]` | readout risorse nel ribbon |
| `[data-testid="slot-token-<poi>:<slot>"]` | **R-183** token del PG dentro lo slot — trascinabile su un altro slot (move/swap); `data-swap-dragging="true"` mentre è in aria |
| `[data-testid="slot-token-ghost"]` | **R-183** fantasma del token che segue il puntatore durante lo swap (portal su `body`) |
| `[data-slot-id] [data-drop-state]` | durante uno swap: `valid`/`invalid` = lo scambio sarebbe accettato/rifiutato dal gate |
| `[data-testid="loadout-item-<itemId>"]` | bottone consumabile nel planner; scelto = `aria-pressed="true"`; borsa piena = gli altri `disabled` |
| `[data-testid="quest-window-choice"][data-option-id]` | **R-183** scelta numerata della finestra run (stesso click del giocatore) |
| `[data-testid="quest-window-beat"]` | beat in scena: input bloccato, Enter/click per avanzare |
| `[data-testid="quest-consumable-belt"]` → `belt-arm-<flag>` / `belt-healing` / `belt-potion` | **R-183** cintura consumabili nella finestra run |
| `[data-testid="quest-epilogue"] [data-epilogue-section="xp"]` | rapporto di ritorno; con R-183 la sezione XP elenca **chi** ha preso quanto |
| `[data-resident-id][data-resident-xp]` | **R-183** XP accumulata dal PG, sulla riga del roster |

### Fixture

```
POI goblin:    poi-goblin   (quest 'goblin', scenario «Sterminio dei goblin»)
POI controllo: poi-rovine   (quest 'rovine' — **one-shot**, controllo del consumo; goblin è `repeatable` da R-200 e non si consuma mai)
Slot:   poi-goblin:goblin-slot-leader | -member-1 | -member-2 | -bodyguard
        poi-rovine:rovine-slot-leader
Residenti (TEST_ROSTER_RESIDENTS = TEST_ROSTER_HEROES + TEST_ROSTER_VILLAGERS,
file `src/balancing/config/idleVillage/testRosterResidents.ts` — tutti
SavedCharacter che passano da `savedCharacterToResident`, la stessa via del
Character Manager):

  hero-sir-spaccaculi    → eleggibile leader/member/bodyguard
  hero-giggiolillo       → eleggibile member (clarity|precision)
  hero-salvatrice        → NON eleggibile al gate leader (ward/clarity vs edge|fortitude)
  villager-mastro-beppe  → member-1   ('fortitude')
  villager-lisetta       → member-2   ('precision')
  villager-baldassarre   → bodyguard  ('warden')

`launchGoblinQuest` trascina REALMENTE 1 eroe + i 3 popolani nei 4 slot
(party completo) prima di «Invia» — è il flow che il Director gioca a mano.
```

---

## 3. I 13 test e cosa inchiodano

| # | Test | Invariante verificata |
|---|---|---|
| 1 | `boot` | Roster seedato (**6 card**: 3 eroi + 3 popolani); marker presenti via **auto-reveal** (R-200) o `revealQuestPois` → `available` con **sigillo vuoto** (0 path nell'halo) |
| 2 | `planning` | Click marker → detail; «Invia» disabilitato a slot vuoti; forecast `incomplete`; salvatrice rifiutata (`checkEligibility:false` + `assignToSlot:false` + card `invalid`) |
| 3 | `planning: drag reale` | Drag pointer card→slot (con `scrollIntoViewIfNeeded` su entrambi gli endpoint) assegna il leader; forecast → `ready`; «Invia» abilitato |
| 4 | `clock: pausa/ripresa` | Pausa: 0 tick in 2.2s; ripresa: tick riparte; **≤3 tick in 2.2s a ×1** (un solo driver!) |
| 5 | `clock: ×4` | delta tick a ×4 ≥ 2× il delta a ×1 |
| 6 | `lancio` | 4 drag reali (eroe + 3 popolani) → «Invia» → QuestRunWindow; POI `in_progress`; **party = 4 membri ⊆ roster**; leader `in-expedition` per altri slot |
| 7 | `run: frontiera` | **Pausa PRIMA di drivare** (race col tick reale): frontiera `pending` congelata in pausa, matura a ×4 alla ripresa |
| 8 | `esito` | Settlement una sola volta: outcome, `loadout-release`, destini residenti come dati (piano **+** store, letti a clock in pausa), **delta gold esatto nello store E nel readout HUD**, nessun doppio settle dopo tick extra |
| 9 | `PG a casa` | Dopo il settle il leader è ri-assegnabile su rovine (salvo morte) e **nessun sopravvissuto resta `in-expedition`**; `isDead` coerente; ferita ancora attiva **oppure** legittimamente sanata (col pacing R-199 la marcia può bruciare i `woundRecoveryTicks`) |
| 10 | `chiusura rapporto` | Click «Chiudi» sul **popup esterno** → run sganciata, **`poi-goblin` RESTA — `repeatable` (R-200): torna `available`, riproponibile**, rovine intatto |
| 11 | `epilogo + journal` | Il rapporto ricco (nel popup) narra i destini; il villaggio ha scritto l'esito |
| 12 | `reload` | **Repeatable**: il POI goblin **torna** dopo reload (mai scritto in `idleVillage.questPois.consumed`); roster operativo |
| 13 | `Director` | Bottone «start goblin quest» del Director panel (F10): stessa `send()` del click reale → run, settle + delta gold store/HUD, POI **torna `available`** e resta dopo reload |

---

## 4. Il contratto desiderato (cosa deve restare vero)

```
boot → veil → AUTO-REVEAL a stagger (goblin ~+1s, rovine ~+5s, mai scomparsi)
→ (oppure) «Mostra quest» = reveal ora one-way → marker available, halo vuota
→ click → planner → slot riempiti → forecast ready
→ «Invia» → run in window + POI in_progress + party locked
→ frontiere waiting committabili solo da readyAt; pending maturano SOLO col clock (pausa = congelate)
→ bivi waiting = scelta giocatore
→ ended → settlement ESATTO-UNA-VOLTA (rewards + destini + loadout-release)
→ party di nuovo eleggibile («a casa»)
→ chiusura report (popup esterno) → run cleared
   → goblin `repeatable`: marker RESTA/torna `available`, mai in consumedPoiIds
   → rovine one-shot: consumed + marker fuori mappa
→ reload → goblin riappare (repeatable); rovine non resuscita
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
| `revealQuestPois(page)` | R-143: **vero pulsante** F10 → `[data-action-id="quest"]` → F10 + attesa anchor layer + marker (mai l'hook) |
| `openGoblinDetailViaMap(page)` | reveal + click reale sul marker + assert header |
| `assignViaRealDrag(page, residentId, slotId)` | drag pointer card→slot con `scrollIntoViewIfNeeded` su entrambi gli endpoint (il planner è più alto del viewport); **auto-verificante** — dopo il drop attende `getAssignments[slotId] === residentId`, ritenta una volta se il drop non ha preso, poi fallisce onestamente |
| `bringSendIntoView(page)` | trascina l'header della `HudPlaque` finché «Invia» non rientra nel viewport (necessario se il pannello è più alto dello schermo) |
| `launchGoblinQuest(page)` | tutto il pre-volo: reveal → marker → **4 drag reali** (eroe+3 popolani) → click «Invia» → window aperta |
| `driveToPending(page)` | risolve bivi finché la frontiera è `pending` (per testare il clock). Usa `advanceTicks` → **funziona anche a clock in pausa** (l'hook sblocca/ri-pausa da sé) |
| `driveRunToEnd(page)` | guida la run fino a `ended` (scelte + tick). **R-199:** una frontiera `waiting` committa solo da `readyAt` — il driver avanza il clock allo slot prima di `choose`. Preme anche Enter a ogni giro: i commit accodano beat più in fretta di quanto la window li replayi — senza flush continuo alla fine restano ~28 beat held da smaltire dentro il timeout del test (23-10) |
| `waitForSettled(page)` | aspetta `getSettlement().status === 'settled'` |
| `flushBeatTheatre(page)` | avanza i beat finché il controllo di chiusura appare. **Ogni giro preme Enter** (`advancePresentation`→`progress()`→throw/skip) **e** fa `dispatchEvent('click')` su `.da-tira` quando visibile **e** sulla colonna se `data-check-armed`: `.da-tira` resta montato per tutto il beat held, quindi un ramo «click O Enter» può non premere mai Enter (leak-guard 45s per check) e un `.click().catch()` senza timeout brucia fino a **30s di actionability** per chiamata quando il bottone è coperto da verdict card/FX (doppio bug di driver trovato il 23-10) |
| `dismissQuestReport(page)` | chiude il rapporto dal **popup esterno** (`quest-reward-close`; fallback `quest-window-close-report`) — il popup R-199 copre il bottone della window |
| `goldReadoutValue(page)` | numero gold dal DOM del ribbon HUD |
| `expedition<T>(page, 'metodo', ...args)` / `expeditionFor` | chiamata hook generica per POI |
| `advanceTicks(page, n)` / `getClock(page)` | tempo |

Sequenza tipica di un test «post-lancio»:

```ts
await launchGoblinQuest(page);
const terminal = await driveRunToEnd(page);
await waitForSettled(page);
await flushBeatTheatre(page);              // ← SEMPRE prima di cercare «Chiudi»
await dismissQuestReport(page);            // popup esterno R-199 (quest-reward-close)
```

---

## 6. Fallimenti noti → diagnosi

Questa è la parte da usare «poco a poco»: ogni riga è un errore già visto,
la causa e dove intervenire.

| Sintomo | Causa probabile | Dove guardare |
|---|---|---|
| `locator.click: element is outside of the viewport` su `quest-expedition-send` | Il planner è più alto dello schermo (es. `panelMaxBodyHeightPx` grande). Il pannello (`HudPlaque`+`useHudPanelDrag`, R-146) **non** clamp-a il bordo inferiore. | `QUEST_PLANNER_INFO.outcome.panelMaxBodyHeightPx`; `useHudPanelDrag` (clamp bottom — **fix UI ancora aperto**, oggi il test aggira con `bringSendIntoView`) |
| `quest-window-close-report` mai visibile / timeout | Il teatro dei beat sta ancora replayando (`presenting`): i controlli del report esistono solo a coda vuota. | `flushBeatTheatre` prima del click; `QuestRunWindow` `beatCursor`/`BeatStage` |
| Theatre fermo su un check beat (Enter non avanza) | **PLAN-043 WS-4:** l'astrolabe vive nella colonna `quest-check-column` — un check **armato in attesa di tiro** (`data-state="action-trigger"`) aspetta il lancio; senza input il leak-guard `checkHoldMs` (45s) lo sblocca comunque. | Enter raggiunge `progress()`→`astro.throw()` anche se il click su `.da-tira` è intercettato — premi Enter a OGNI giro; post-verdict `progress()` è no-op e vale l'auto-dismiss (`dismissArmDelayMs`+`verdictAutoDismissMs`) o il click sulla colonna armata |
| Driver flush/settle lentissimo fino al timeout (report/check mai raggiunti) | `.click().catch()` **senza `timeout:`** su `.da-tira`/colonna/board: il bottone resta *visibile ma coperto* da verdict card/FX e Playwright attende l'actionability fino al default **30s per chiamata** — non un bug di prodotto, è lo stallo dell'hit-test. | `dispatchEvent('click')` sui controlli held-check (vero handler React, salta l'hit-test) — già usato su `flushBeatTheatre`, `settleCheck`, `dismissColumn`, input-coordination |
| `quest-check-column`/`quest-verdict-card` spariti prima che il test li legga (race C→D) | Due input `progress()` post-mount bastano a completare throw→skipToResult→verdict→auto-settle (`checkVerdictMs` 2400) — la colonna muore prima del probe. | In `driveToCheck` ricontrolla la colonna SUBITO dopo ogni click di stage → zero input post-mount → check held deterministico in `action-trigger`; il probe del verdict legge subito (non aspettare `waitStableRects` 2.5s) e tollera `verdictSeen:false` nei sample |
| Click radio pausa/×N intercettato da `quest-window` | **PLAN-067 cluster:** la quest window aperta copre il radiogroup velocità nel ribbon (top-left dietro l'header); Space è `defaultPrevented` mentre `presenting`. | Nei test con window aperta usa `radio.dispatchEvent('click')` (vero handler React, salta solo l'occlusione). Nei test «clock» senza quest il click DOM resta la via. Finding aperto §9: l'utente non raggiunge i controlli tempo col pointer finché la window è su |
| `data-epilogue-section="dead"/"wounded"` assente nel report | **PLAN-067 T-C2/R-234:** `crewShown` sposta caduti/feriti nelle nicchie `QuestReturnedCrew`; l'epilogo nel popup le filtra via `withoutCrewLines`. | Asserisci `crew-niche-<id>` con `data-crew-state="fallen"/"wounded"/"returned"`; le sezioni `reward`/`xp` restano in `quest-epilogue` |
| Click «Chiudi rapporto» intercettato / timeout | **R-199:** `QuestRewardPopup` è una placca fissa centrata (z-1200) e copre fisicamente `quest-window-close-report` nella window. | Chiudere dal popup: `quest-reward-close` (vedi `dismissQuestReport`) |
| `choose` sembra non fare nulla / run ferma su `waiting` | **R-199:** la frontiera `waiting` committa solo a `tick >= readyAt` (fasi future visibili ma locked); `choose` col tick live viene rifiutato. | `advanceTicks` fino a `readyAt` prima di `choose` (già dentro `driveRunToEnd`/`driveToPending`) |
| Test «pending» trova la run già oltre il nodo atteso (nonostante la pausa cliccata) | Col pacing R-199 il `readyAt` è vicino: tra il return del driver e il click su Pausa il clock reale può maturare la frontiera. | **Pausa prima** di drivare (i drive usano `advanceTicks`, imperativi anche in pausa) |
| `toContainText('Sterminio dei goblin')` fallisce sul detail | Il titolo sta nell'**header** del pannello, non nel body (il body mostra l'objective). | Asserisci su `floating-panel-header-quest-expedition-poi-goblin` |
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
| `quest-check-column` muore ~450-600ms real dopo `page.clock.runFor(760)` durante la misura BV-04 | **`page.clock.install()` NON congela**: il fake clock di Playwright parte in modalità real-time (`ClockController._syncRealTime` avanza i tick col tempo reale trascorso). Ogni probe/`waitForTimeout` reale brucia la stessa finestra che si sta misurando: l'auto-dismiss R-259 (`dismissArmDelayMs`350+`verdictAutoDismissMs`1000 = +1350) scatta ~590ms real dopo `runFor(760)` → `bridge.onDismiss` → `cursor.skip()` → colonna smontata a metà misura. | `page.clock.pauseAt(Date.now()+50)` subito dopo `install` congela i tick: i timer pagano solo dentro `runFor` (+50 di margine: `pauseAt` fast-forwards fino al tempo dato e lancia su target passato). Nota: `setFixedTime` NON ferma i tick; `clock.uninstall` non esiste nel client API. I timer reali già pendenti pre-install NON vengono adottati — installa il clock prima che il check possa risolversi |
| Marker mai `available` al boot | **R-200:** i POI si auto-rivelano a stagger dopo il veil (primo ~1s, poi ~5s). Se non appaiono, l'auto-reveal è rotto (`questReveal` config o scheduling), non è più «corretto per design» come in R-124. | `questRevealSchedule`/`questReveal` in `gameFrameConfig`; gate `questShown \|\| poiDemo \|\| autoRevealed \|\| run` in `game-frame-pixi.tsx` |
| Marker presente ma `element(s) not found` dopo reload | Per un POI **one-shot** (es. `poi-rovine`) la run precedente *dello stesso test* lo ha consumato. `poi-goblin` è `repeatable` (R-200): torna sempre — se manca dopo reload il bug è reale. | Usa un test separato con context fresco per i one-shot; per goblin indaga `consumedPoiIds`/`repeatable` in `questPois.ts` |
| Swap slot↔slot non committa (`waitForAssignment` timeout dopo il drop) | `collisionDetection` è `pointerWithin`: `over` è il droppable sotto il PUNTATORE — mirare al wrapper `data-slot-id` (label sotto il cerchio) lasciava il puntatore fuori dal `slot-button-*` vero → drop perso in silenzio. Inoltre il primo move deve superare gli 8px di attivazione *prima* del press-and-hold estrazione (~560ms). | `dragSlotToken` mira al centro di `slot-button-<slotId>`, fa kick di attivazione, micro-move+settle prima del `mouse.up`, e il call-site ritenta una volta come farebbe un giocatore |
| `getAssignments()` null dopo un drag «andato a buon fine» | Il pointer drop è atterrato fuori dalla drop-zone: lo slot era sotto il fold (planner più alto del viewport) o coperto. | `assignViaRealDrag` fa `scrollIntoViewIfNeeded` su card **e** slot prima del drag — usa quello, mai `dragResidentPointer` nudo |
| Timeout 120s mid-drive / check held con Enter morto (diagnosi: `state=action-trigger`, nessun presenter) | **Bug di prodotto — check stale held (fixato, `quest-run-window.INV-7`):** `astroShownFor` teneva held beat check già dismessi (`checkSeq <= dismissedUpTo` — hydration riassorbe i settled, `dismissOutcome` del toast alza il mark mid-run). Colonna E overlay usano lo stesso gate → nessun presenter monta → `bridge.handle` null → `progress()` no-op → il beat si liberava solo a `checkHoldMs` (45s a check → pile-up → timeout). | Fix in `astroShownFor` (`QuestRunWindow`): un check che fallisce `isStaleCheckEvent` scorre come beat a tempo, mai held. Se ricompare: verifica `dismissedUpTo` sul run (`getRun`) e chi lo alza mentre un beat check è in coda |
| `waitForDraggingHook` 2s timeout su card ben visibile; nello snapshot card «Assigned»/disabled e slot già occupati | **Race del driver (fixata):** `onDragEnd`/`onDragStart` della pagina committano `setDraggingResidentId` in `startTransition` — sotto carico seriale il flush arriva DOPO lo sleep 1.5s di `performCdpDrag` e clobbera l'id che il drag successivo ha appena settato via hook → `getDraggingResidentId()` resta null → timeout spurio (i drag precedenti erano riusciti, ecco perché slot/card risultano occupati/disabled). | `dragResidentPointer` chiude con `waitForDragSettled` (`get→null`) prima di uscire; budget hook 5s. Se ricompare: log del getter a ogni tentativo + verifica che nessun'altra sessione pubblichi `setDraggingResidentId` sullo stesso stato |
| `scrollIntoViewIfNeeded` muore su «waiting for element to be stable» | Su `/game` live le card si muovono di continuo (Pixi/re-render): la stability gate di Playwright (2 frame bbox identici) non scatta mai → timeout. | `assignViaRealDrag` ora usa `el.scrollIntoView({block:'nearest'})` in-page — niente stability gate. Regola: su superficie live preferisci sempre lo scroll in-page al locator gated |
| Swap valido «revertito» dopo un drop rifiutato (`assignments` = esatto pre-swap) | **Race del retry del driver, non un bug:** lo swap committa al LANDING del token (flight + `startTransition`), e `commitSwap` ri-pianifica `planSlotSwap` sulle assegnazioni correnti all'atterraggio. Se il driver giudica «drop perso» su una vista stale e ri-swappra, il secondo commit legittimo produce il revert (lo swap è non-idempotente, a differenza dell'assign). | `gameQuestFullFlow`: il testimone atomico è `getSeatNonces` — `seatNonces[toSlot]` bumpa nella STESSA `startTransition` del commit, quindi quando cambia anche `getAssignments` è fresco (il getter è una closure ripubblicata a ogni render: può restare una pubblicazione indietro anche a `__dragFlightActive` false). Retry solo se il nonce NON si muove (8s). `planSlotSwap`/`useQuestExpeditionSession` sono corretti |
| «N beats left» con run finita (`outcome to collect`, toast VITTORIA) e flush lento | **Drain rate del driver, non deadlock:** `advanceTicks`/×4 accodano beat più in fretta di quanto un Enter per round-trip (~300ms) li consumi; a fine run restano 15-28 beat narrativi e il budget muore nel drenaggio. `skip()` è un update funzionale → N keydown consumano N beat. | `drainBeats(page, 8)`: keydown sintetici su `window` (target non-Element → il guard R-199 instrada in `advancePresentation`, focus-proof) in `driveRunToEnd`/`flushBeatTheatre`/`playRunPhaseByPhase` |
| Timeout 120s su test che fanno tutto il ciclo (reveal → 4 drag → run → teatro → settle) | Budget strutturale: reveal con ancore Pixi fino a 60s sotto carico + 4 drag CDP ~3-8s + drive + teatro > 120s. Non è uno stallo se lo snapshot mostra progresso mid-drive. | `test.setTimeout(300_000)` nel `beforeEach` del describe R-119 (FullFlow R-183 dichiara 420s per lo stesso percorso); se un test resta fermo a 300s lo snapshot è la diagnosi |
| `locator.click` >10s actionability su `[data-action-id="quest"]` / `quest-expedition-send` | Hit-test blocked dal layer pannello/scroll residue sotto carico — il listener React è lo stesso del click giocatore. | `dispatchEvent('click')` (come già su `.da-tira`/colonna/radio) — `revealQuestPois` e `launchGoblinQuest` aggiornati |

---

## 7. Quando modifichi il gioco: checklist anti-rottura

Prima di toccare un pezzo coperto dalla suite, chiediti quale invariante
muovi e quale test lo inchioda:

- **Cambi il planner/panello expedition?** → test 2, 3, 6 + `bringSendIntoView`. Se il pannello cresce ancora, il trascino ha un limite (4 tentativi): il vero fix è il clamp bottom del pannello (`useHudPanelDrag`).
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
| Roster di test (3 eroi + 3 popolani) | `src/balancing/config/idleVillage/testRosterResidents.ts` → `CanonicalRosterBundle.canonicalResidentData` + `createInitialState` |
| Config planner | `QUEST_PLANNER_INFO` |
| Suite gemella (regressione) | `tests/e2e/idleVillage/gameQuestExpedition.spec.ts` |

---

## 9. Finding aperti (da chiudere «poco a poco»)

1. **Pannello planner senza clamp sul bordo inferiore** — con
   `panelMaxBodyHeightPx: 700` e viewport 720p «Invia spedizione» finisce
   fuori schermo. Oggi il test aggira (`bringSendIntoView`), ma un giocatore
   su schermo piccolo ha lo stesso problema. Valeva per `FloatingPanel`,
   vale anche per `useHudPanelDrag` (R-146): nessuno dei due clamp-a il
   bordo inferiore. Fix candidato: clamp bottom o scroll interno del body.
2. **Asserzioni visive del forecast** — il test legge `data-forecast-state`
   e l'`estimate` via hook; il contenuto visivo del forecast (probabilità,
   bande) non è asserito nel DOM.
3. **Copertura esiti** — il driver accetta qualunque esito; non esiste un
   test che forzi `wipe` o `fled` per verificare i rami di reward/zero-loot.
4. **Consumabili/scelte numeriche da tastiera** — `choose` via hook copre la
   logica; la suite R-183 clicca le scelte e la cintura nel DOM, ma i tasti
   1–9 non sono ancora asseriti.
5. **Inventario consumabili (R-183)** — la borsa pesca da un catalogo
   (`QUEST_STASH`/`questItems`) **senza quantità**: scegliere un consumabile
   non lo toglie a nessun magazzino e quelli usati in run non si scalano da
   un inventario di villaggio (che non esiste ancora). Il loot non-oro della
   run (`run.loot`, es. «goblin trophy») compare nel rapporto ma non finisce
   in un inventario/HUD: oggi tutto il loot goblin è già convertito in oro.
   È una decisione di design (inventario di villaggio), non un bug del test.
6. **XP senza curva (R-183)** — i PG accumulano `xp` (store + roster), ma
   livelli/curva sono OPEN (`PROGRESSION.md` §3): il numero non sblocca
   ancora nulla. Default `QUEST_SETTLEMENT.residentXp.mode = 'full'` (ogni
   sopravvissuto prende tutta la XP della run) — PROPOSTA da confermare.
7. **Controlli tempo irraggiungibili col pointer durante una run (23-10)** —
   la quest window in cluster copre il radiogroup pausa/×N del ribbon (la
   strip minimizzata occupa la stessa fascia, minimizzare non basta) e Space
   è `defaultPrevented` mentre `presenting`: finché la window è aperta
   l'utente non può cambiare pausa/velocità. Forse intenzionale (teatro =
   modalità focalizzata); se non lo è serve una via (es. speed keys non
   consumate dal capture handler, o radio spostato). I test aggirano con
   `dispatchEvent`.
