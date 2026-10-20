# F3 — Scheda: QuestRunWindow (finestra della quest in corso) (Opus, 2026-10-20)

> Stesso formato della scheda pilota F2. Lo skill check dentro la finestra è in F2: qui il resto.
> Evidenze: `shots/questwindow-f3/` (1440×900, run goblin completa: `series.json` = 160 campioni di barra, tick e fase), `shots/questwindow-f3-1280/`, `shots/questwindow-f3-rm/`. Legenda: **FATTO** · **FLAG** · **NON VERIFICATO**.

---

## 1. Cosa è, per il giocatore

La finestra dove la spedizione «accade»:
- la scena dipinta di ogni fase, con movimento di camera;
- il testo del momento e le scelte, con la probabilità di riuscita;
- la cintura dei consumabili;
- la barra del tempo con le tacche delle fasi e la striscia del viaggio (andata / sul posto / ritorno);
- la cronologia delle fasi con il loro costo;
- alla fine, il rapporto della spedizione.

Si può minimizzare in una plancia sottile e abbandonare.

## 2. Dove vive

| Pezzo | File |
|---|---|
| Finestra, header, teatro, scelte, footer | `components/gameFrame/QuestRunWindow.tsx` (1878 righe) |
| Barra del tempo | `QuestRunWindow.tsx:1549` `TimeBar` (progress = `time.progress`, tacche `questPhaseCheckpoints`, 2 px di larghezza ciascuna) |
| Striscia del viaggio | `QuestJourneyPhaseStrip` (PLAN-053 T-006), montata a `QuestRunWindow.tsx:1791` |
| Abbandono | `QuestRunWindow.tsx:~1805` (icona `ico-banner` 34×34 + tooltip + conferma inline) |
| Rapporto finale | `QuestRewardPopup.tsx` + `QuestEpilogue` |
| Rotta sulla mappa | `QuestJourneyRoute.tsx` (PLAN-053 T-005) |

## 3. Come si presenta (FATTO, 1440×900)

| Stato | Cosa vede il giocatore | Immagine |
|---|---|---|
| Scelta | scena 2.4:1 con titolo di fase inciso, testo in serif, riga di icone-cintura, opzioni numerate «①/②» con «43% → 58%» | `n-gob-esplora-choice.png` |
| Teatro a riposo | **vivo**: 23–26% dei pixel cambiano ogni secondo (deriva di camera post-entrata, PLAN-064) | `notes.json` |
| Header aperto | party (pannello a sinistra), bisaccia (pannellino), cronaca (colonna alta quasi vuota), opzioni check («Skip the opening animation», «Skip the whole check») | `f3-header-opens.png` |
| Abbandono | icona a bandiera + tooltip «Abandon quest»; conferma inline «KEEP GOING» / «ABANDON» (viola su bordo rosso) | `f3-footer-states.png` |
| Footer chiuso | l'intero blocco barra/fasi sparisce; resta una linea da 4 px | `f3-footer-states.png` |
| Minimizzata | plancia 760×42 «⚔ GOBLIN EXTERMINATION 1/7 ●» + pergamena a destra | `60-minimised.png` |
| Fine | popup «EXPEDITION REPORT» sopra la finestra: «SURVIVED — NO REWARD», ferito, consumato, XP, «echi»; pulsante «COLLECT REWARDS» | `91-end-reward-2500.png` |

## 4. La barra in basso che «si dovrebbe colorare» (il tuo punto 5 e R-231 #4)

Il tuo intento (R-231 #4, verbatim): *«la sotto deve riempirsi per tutta la durata della quest, se la quest ci mette 2 min a finire allora la barra ci metterà 2 min a riempirsi (magari cn dei check point x ogni fase?)»*. Ruling 2026-10-19: opzione (b), tempo trascorso reale e durata dichiarata separati. PLAN-062 C2: la barra arriva a piena **alla fine reale**, overrun compreso.

**Cosa succede davvero (FATTO, `series.json`):**

| Tick | Fase | Barra | Etichetta |
|---|---|---|---|
| 4 | 1 di 7 | 3% | 3/110 ticks |
| 59 | 3 di 7 | 52% | 57/110 |
| **111** | **4 di 7** (combattimento) | **100%** | 110/110 |
| 129 | 5 di 7 | 100% | 127/110 |
| 177 | 7 di 7 | 100% | 175/**120** |
| 199 (fine) | 7 di 7 | 100% | 197/**140** |

- La barra è `trascorso / durata dichiarata corrente`, **bloccata al 100%**. È piena a metà quest (fase 4 di 7) e **resta piena per l'ultimo ~43% della spedizione** (tick 111 → 199). **FAIL** su PLAN-062 C2 e sul tuo intento.
- Il denominatore **cambia durante la run** (110 → 120 → 130 → 140) man mano che la quest rivela fasi. La barra si ricalcola, ma in questa run lenta il tetto al 100% lo nasconde. **Nella run veloce (reduced-motion, meno catture) la barra torna indietro 4 volte** (95→92, 92→86, 93→89, 94→91 alle fasi 6–7) e **finisce al 95%** a quest conclusa (`questwindow-f3-rm/series.json`). Quindi due difetti, a seconda della velocità del giocatore: (lento) piena a metà; (veloce) regressioni visibili e mai piena. **FAIL** anche su PLAN-062 C1 (monotonia).
- **Le 6 tacche sono a sesti uguali** (16.7%, 33.3%, 50%, 66.7%, 83.3%, 100%), non derivate da `readyAt` di fase come dice PLAN-062. E le fasi sono **7**, le tacche 6.
- **Il tempo scorre mentre il giocatore decide.** Alla prima scelta la barra passa la tacca «Rules of Engagement» mentre l'etichetta dice ancora «Phase 1 of 7» (`f3-footer-states.png`: 46/110 ticks, fase 1). La barra misura il tempo dell'orologio, non il progresso della spedizione.
- **Due unità affiancate**: la barra dice «ticks», la striscia del viaggio sotto dice giorni («2D», «~22D»).
- *Caveat* (onestà): l'harness tiene ×1 e avanza le frontiere in viaggio con `advanceTicks`; durante i check e le catture il tempo scorre come per un giocatore lento. Un giocatore veloce sfora meno, ma il meccanismo (barra ferma al 100% prima della fine, tacche non legate alle fasi) non dipende dalla velocità.

## 5. Documentazione esistente vs realtà

| Doc | Cosa dice | Cosa si vede | Verdetto |
|---|---|---|---|
| RICHIESTE R-231 «Implementazione consolidata» | «#4 TimeBar: `questPhaseCheckpoints` reso visible — tacche incise per fase» | tacche presenti, ma a intervalli uguali e barra piena a metà | **INCOMPLETO**: il punto 4 non è risolto |
| PLAN-062 §3 C2/C3 | piena alla fine reale; tacche ai boundary di fase da `readyAt` | piena a fase 4/7; tacche uniformi | **CONTRADDIZIONE** |
| Stato PLAN-062/063/064 | file: `draft`; INDEX: `in corso`; RICHIESTE: «implementazione consolidata» | — | **tre stati diversi** (F0 §3) |
| `quest_ui_component_guide.md` §1 | layout a cockpit: formazione · scena/astrolabio · orda | scena a piena larghezza in alto, striscia combattimento sotto, astrolabio in colonna esterna | **SUPERATA** (descrive il lab S1) |
| idem §1 | «Le opzioni non scrollano mai» | a 1440 nessuno scroll verticale; `quest-s1-scroll` ha **4 px** di overflow orizzontale (736 vs 732) | **PASS** con nota |
| R-231 #3 header solo icone | richiesto | fatto: le pillole non hanno testo | **COERENTE** |
| R-231 #6 abbandono icona + tooltip, «colore orribile» | richiesto | trigger: icona + tooltip ✓; **la conferma usa ancora viola su bordo rosso** | **PARZIALE** |
| R-231 #7 minimizzata, icone allineate ai bordi | richiesto | ⚔ a ~25 px dal bordo sinistro, pergamena a ~27 px dal destro: simmetrico | **COERENTE** |
| R-231 #9 animazione post-entrata | richiesto, «la parte più importante» | teatro vivo 23–26% px/s | **PRESENTE**; qualità percettiva = FLAG |
| Contratto `quest-run-window.md` | invarianti reali e test elencati | — | **POPOLATO** (a differenza di quelli dello skill check) |

## 6. Stato di salute

**Funziona (FATTO):**
- run completa fino al rapporto;
- barra monotona (0 cali su 160 campioni);
- teatro vivo;
- header solo icone;
- minimizzata simmetrica;
- conferma d'abbandono inline;
- opzioni check «salta intro / salta check» presenti;
- contrasto dentro la finestra **0 testi sotto soglia su 22**.

**Rotto o incompleto (FATTO):**
1. Barra piena a metà spedizione (giocatore lento) oppure che torna indietro e finisce al 95% (giocatore veloce); tacche non legate alle fasi (§4).
2. **Cifre HP impossibili nella cronologia delle fasi**: «−210 HP» (run precedente) e qui «**−600 HP, −156 HP, −65 HP, −50 HP**» con un eroe da 93 HP massimi, sopravvissuto. **Ipotesi da codice**: `questPhaseRecord.ts:66-82` (`recordAction`) somma a ogni azione **tutti** i `checkQueue[].harms` e i `recentHarms` dello stato corrente, senza confrontarli con lo snapshot `before` (come invece fa per log e loot). Se quelle code sopravvivono tra un'azione e l'altra, ogni turno ri-conta i danni precedenti, e così il combattimento a 5 turni gonfia la somma. Da confermare con un test unitario su `recordAction` + `hpLostByMember`.
3. Rapporto: chip «SURVIVED — NO REWARD» e subito sotto il pulsante «**COLLECT REWARDS**». Copy contraddittorio.
4. Il popup del rapporto copre il testo della finestra («The expedition is back at the villa…», «Close the repo…» tagliati).
5. L'immagine del teatro finale «COLD ASH» ha uno stile diverso dalle altre (case piatte, morbide): **FLAG** sulla coerenza dell'arte.
6. Footer chiudibile solo da una linea di **732×4 px** senza affordance.
7. La plancia minimizzata lascia nel DOM il contenitore `data-hud-panel="quest"` con box pieno 760×684. **NON VERIFICATO** se intercetta i click sulla mappa.

## 7. Bug fuori componente scoperto qui: la mappa del mondo sparisce (intermittente)

**FATTO (correlazione su 6 run):**
- In 4 run (tre a 1440×900, una a 1280×800) la mappa del mondo smette di essere disegnata: fondo teal piatto, mentre POI e rotta restano (`60-minimised.png`).
- In tutte e 4 la console registra `TypeError: Cannot read properties of null (reading 'ids')` in Pixi (`checkAndUpdateTexture` → `SpritePipe.validateRenderable`): una sprite con texture distrutta o nulla fa fallire il render del ticker.
- Nelle 2 run senza l'errore (F1b 1280, reduced-motion 1440) la mappa resta visibile per tutta la run.
- **Il viewport non c'entra**: è intermittente. La mia prima lettura («solo a 1440») era sbagliata.
- **Probabile bug reale del gioco** (un'eccezione nel ticker ferma il render del mondo). Causa e sprite colpevole NON localizzati. Va verificato anche in Tauri/Chrome reale. Merita una sessione propria.

## 8. Polish AAA

| # | Misura (root = finestra, 1440) | Esito |
|---|---|---|
| C1 | 0 icone fuori asse; 2 pillole con indicatore (barra/pallino) | **PASS** centratura; indicatori → C4 |
| C2 | una riga `flex-start` con 13.5 px di scarto (titolo colonna vs finestra) | **FAIL** |
| C3 | 9 spaziature (≤6), 5 corpi (≤4), testo a **11 px** nella striscia del viaggio | **FAIL** |
| C4 | 13 icone tutte `engraved` (bene) ma: numerazione «①», icone-cintura in cerchi, pallino/barra in header, chip verde «SURVIVED» | **FAIL** (regola 6b) |
| C5 | `quest-s1-scroll` 4 px di overflow orizzontale; ritaglio della scena voluto | **FAIL** minore |
| C6 | 0/22 nella finestra; fuori: FOOD 2.26 | **PASS** (finestra) |
| C7 | **10** target sotto 32 px: 6 bottoni header 26 px, cintura 24×24, footer 732×4, tacche della barra **2 px** con tooltip | **FAIL** |
| C8 | finestra 760×684 = 40% di 1440×900, centrata; nessuna collisione | **PASS** (fluttuante) |
| C9 | teatro vivo; reduced-motion: vedi §10 | vedi §10 |
| C10 | — | **FLAG** |

## 9. Critica con il cappello

**`ui_developer`** (correctness, neutral)
1. Una sola unità di tempo per la spedizione (o tick o giorni) su barra e striscia.
2. Le tacche diventano boundary reali di fase, e sono quante le fasi.
3. Target ≥ 32 px: cintura, header, toggle del footer (oggi una linea da 4 px: serve una maniglia visibile).
4. Copy del rapporto coerente con l'esito («Close» quando non c'è ricompensa).
5. Cronologia fasi: i valori HP vanno verificati alla fonte prima di essere mostrati.

**`game_director`** (taste → FLAG)
6. La barra è il polso della spedizione: se è piena a metà, il giocatore smette di guardarla quando la tensione sale (combattimento, inseguimento, agguato). Due letture possibili (**visual-fork**):
   - (A) progresso di fasi, che avanza solo quando la spedizione avanza;
   - (B) tempo reale con il denominatore che si allunga quando la spedizione sfora, e il segno dello sforamento.
7. Il tempo che scorre mentre il giocatore sceglie è una scelta di design forte (pressione). Se non è voluta, la barra mente; se è voluta, va **mostrata** (es. il tempo che «brucia»).
8. Il rapporto finale arriva sopra la finestra come una lastra generica: è il momento del ritorno al villaggio e merita la stessa messa in scena dell'uscita.

**`objective_critic`** su questa scheda
1. **ASSUMPTION** — «il tempo scorre mentre il giocatore decide» è osservato con l'harness a ×1 che si ferma a fotografare. Ricerca nel codice: nessuna pausa del clock legata alle frontiere `waiting` (grep su `useQuestExpeditionSession.tsx` e `idleVillage/`). Coerente, ma una ricerca per nomi non è una prova. *Fix*: test con clock simulato.
2. **UNSUPPORTED → in parte risolto** — la sorgente del chip è `hpLostByMember` = somma di `hpBefore − hpAfter` (danno subito, non potenziale). Quindi −600 su 93 HP è un errore di conteggio, non un'altra metrica. La causa (doppio conteggio in `recordAction`) resta un'ipotesi.
3. **RISK** — il bug della mappa può dipendere da Metal headless sotto carico. *Fix*: riprodurre in Chrome reale o Tauri prima di aprire un bug.
4. **CONTRADICTION** — §5 dice R-231 #9 «presente» e §9 lascia la qualità come FLAG: va bene, ma la misura px/s non distingue un movimento bello da un tremolio.
5. **BIAS** — una sola quest (goblin) e un solo party (eroe singolo del `demoLaunch`): le stesse conclusioni potrebbero non valere per «rovine» o per party da 4.

## 10. 1280×800 e reduced-motion (FATTO)

| Run | Barra 100% a | Fine | Cali della barra | Teatro px/s | Errore Pixi / mappa |
|---|---|---|---|---|---|
| 1440×900 | tick 111, fase 4/7 | tick 199, 100% | 0 (tetto) | 23–26% | sì / sparita |
| 1280×800 | tick 112, fase 5/7 | tick 187, 100% | 0 (tetto) | 16–33% | sì / sparita |
| 1440×900 reduced-motion | mai | tick 143, **95%** | **4** | **0%** | no / visibile |

- Reduced-motion **rispettato** dal teatro: 0 px cambiati al secondo.
- 1280×800: stesso comportamento della barra; la finestra entra senza scroll verticale delle opzioni (nessun overflow verticale registrato).

## 11. Prompt potenziato

```
You are a senior UI designer and developer at a AAA studio on the RPG project
(/Users/faustoboni/progetti_personali/RPG), surface /game, component QuestRunWindow
(src/ui/idleVillage/components/gameFrame/QuestRunWindow.tsx) — NOT the skill check (see F2 card).

Inputs:
- DESIDERATA: .mw/desiderata.md (latest FROZEN); DESIGN_PILLARS.md.
- DIRECTOR INTENT (verbatim, R-231 #4): the bar fills over the whole real duration of the quest,
  with checkpoints per phase. Ruling 2026-10-19: option (b), elapsed vs declared kept separate.
- CONTEXT: src/docs/docs/game_surface_audit/F3_scheda_questrunwindow.md (§4 data table, series.json),
  plans/PLAN-062..064, src/docs/docs/design/hud_component_guide.md (rule 6b),
  src/docs/docs/idle_village/quest_ui_component_guide.md.
- HARNESS: src/docs/docs/game_surface_audit/harness/run-f3.mjs.txt (samples bar/ticks/phase over a full run).

Scope (correctness):
1. TimeBar reaches 100% only at the real end of the run (overrun included); denominator changes are
   reflected; never stuck at 100% while phases remain.
2. Checkpoints = real phase boundaries, one per phase (7 for goblin), derived per PLAN-062.
3. One time unit across TimeBar and QuestJourneyPhaseStrip.
4. Phase-history HP chips: verify the source; show only damage actually taken (or label what it is).
5. Report copy consistent with outcome (no "Collect rewards" on NO REWARD).
6. Interactive targets >= 32px (header, belt, footer handle, checkpoints' tooltips).
If a fix needs a choice between representations (bar semantics A vs B), STOP: visual-fork card.

Rules: tokens only, i18n en + it-IT, config in gameFrameConfig (Zod); traps T-02, T-03, T-04, T-13, T-14.
Keep green: questRunWindow.test.tsx, gameQuestFullFlow.spec.ts, gameQuestCluster.spec.ts, questJourneyRoute.spec.ts.
Output: diff + series.json before/after from the harness proving C1..C2 of PLAN-062 + "not verified" list.
```

## 12. Non verificato
Quest «rovine»; party da 4; morte di un membro; audio; build di produzione; Tauri; se il clock si ferma davvero nelle frontiere `waiting`; origine delle cifre HP; intercettazione click della finestra minimizzata; bug della mappa fuori da headless (Chrome reale / Tauri).
