---
title: Registro Errori — Pagina POI Quest Detail/Roster/Time/Clock
status: draft
updated: 2026-08-15
type: error-registry
---

# Registro errori — `/poi-quest-detail-roster-time-clock`

> Registro dei difetti/behaviour mismatch trovati nella pagina. Ogni riga ha un ID, una descrizione, la fonte della scoperta (static review / runtime), e lo stato. I fix sono pianificati, non eseguiti in questo turno.

## Errori confermati / mismatch rispetto al workflow desiderato

| ID | Area | Descrizione | Workflow ref | Stato |
|---|---|---|---|---|
| ERR-001 | POI detail | Il POI detail di quest non mette automaticamente il gioco in pausa all'apertura | §4.3 | chiuso — `handlePoiClick` ora chiama `pauseGame('user')` quando apre il detail di una Quest non avviata; verificato da Playwright: `getQuestState().isPaused` passa a `true` |
| ERR-002 | Posizionamento pannelli | I pannelli fluttuanti non si aprono centrati rispetto al viewport della mappa; alcuni escono fuori area o sono posizionati rispetto allo schermo intero | §4.4 | aperto |
| ERR-003 | POI detail estetica | Sono state aggiunte cromature/elementi estetici al POI detail che non fanno parte del contratto di `/poi-quest-detail-roster-integration`; mancano invece funzionalità base | §4.3 | aperto |
| ERR-004 | Start CTA | Il pulsante Start/Embark non ha il restyling visivo richiesto | §4.5 | aperto |
| ERR-005 | Start gating | `Start` non verifica esplicitamente che il tempo scorra (non in pausa) prima di far partire la quest; `handleEmbark` chiama `resumeGame('user')` e parte immediatamente anche se il giocatore è in pausa | §4.5 | chiuso — `startDisabled` include ora `isPaused`; `handleEmbark` esce se `isPaused`; Playwright verifica che Start resti disabilitato con detail aperto e diventi abilitato dopo `resumeIfPaused()` |
| ERR-006 | Magic Circle Halo | Il cerchio magico deve iniziare dalle 12 e andare in senso orario; verificare che `timerDirection` non sia invertito per il POI quest e che non ci siano tracce preesistenti prima dell'avvio | §5.2 | aperto |
| ERR-007 | Quest success threshold | Verificare che `resolveQuestOutcomeTier`/`QuestPowerEngine` usi la regola `successi >= fasi_totali / 2` (metà inclusa) e non maggioranza semplice | §5.4 | aperto |
| ERR-008 | MilestoneCheckModal / Astrolabe | Lo skill check deve usare la V2 di `DestinyAstrolabeComponent` e passare i valori veri della fase (skill, morte/ferita, modificatori) | §5.3 | aperto |
| ERR-009 | Quest inerte pre-start | Verificare che il `QuestPOI` non disegni l'halo e non risponda ai tick finché tutti gli slot obbligatori non sono assegnati e non è stato premuto Start | §4.2 | aperto |
| ERR-010 | Auto-assign / bloom POI | Verificare che il `QuestPOI` faccia bloom `valid`/`invalid` esattamente con la stessa logica del `ResidentSlotRack` e che il click-to-assign scelga il primo slot accettante | §4.1 | chiuso — `__idleVillageTestHooks.fillRequiredResidentSlots` e test UI drop invalid verificano il percorso di assegnazione |
| ERR-011 | QuestChronicle opening | Dopo lo start, il click sul POI deve aprire `QuestChronicle` invece del POI detail; verificare che lo stato `isQuestCardOpen`/`isQuestRunning` commutino correttamente | §5.1 | chiuso — test Playwright verifica che `QuestChronicle`/quest card si apra dopo Start |
| ERR-012 | FloatingPanel draggability | Il POI detail usa `FloatingPanel`, ma va verificato che l'intestazione sia draggabile e che non ci siano elementi extra che catturano i pointer events | §4.3 | chiuso — test UI dragga il pannello dal header e rileva spostamento > 0 |
|| ERR-018 | POI detail close | Chiudere il POI detail non riprendeva il tempo canonico | §4.3 | chiuso — `onClose` del POI detail ora chiama `resumeGame('user')`; verificato da Playwright: `isPaused` torna `false` e il POI si riapre |
|| ERR-019 | Config source — activity | `PoiDetailQuestRosterTimeClockIntegrationPage` legge `DEFAULT_IDLE_VILLAGE_CONFIG.activities.quest_city_rats` invece dell'attività corrente da `useIdleVillageConfig().config.activities` (dall'Activities tab JSON) | §11 | chiuso — `useIdleVillageConfig().config.activities` + `quest_city_rats` fallback; Playwright page load passa |
|| ERR-020 | Config source — quest blueprints | La pagina importa `defaultQuestBlueprints` direttamente dal modulo invece di usare `IdleVillageConfig.questBlueprints` editabile | §11 | chiuso — `idleVillageConfig.questBlueprints[activity.id]`; Playwright end-to-end passa |
|| ERR-021 | Config source — quest power rules | `questPowerRules` fallback a `DEFAULT_QUEST_POWER_RULES` inline; non legge da `config.globalRules.questPowerRules` | §11 | chiuso — `idleVillageConfig.globalRules.questPowerRules ?? DEFAULT_QUEST_POWER_RULES`; Playwright quest run passa |
|| ERR-022 | Config missing — time/skill scale | `questTimeScale` e `questSkillCheckConfig` non sono campi di `IdleVillageConfig`; i motori usano `DEFAULT_QUEST_TIME_SCALE` e `DEFAULT_QUEST_SKILL_CHECK_CONFIG` anziché valori editabili | §11 | chiuso — schema aggiunto a `IdleVillageConfig` (`questTimeScale`, `questSkillCheckConfig`); `build:check`, `kanban:lint` e test idleVillage verdi |
|| ERR-023 | QuestChronicle hardcoded | `QuestChronicle` ha `RISK_FALLBACKS`, `PAL`, `VARIANT_MAP`, gradienti e ombre hardcoded invece di derivarli da `phase.riskProfile` e skin config | §11 | chiuso — hardcoded rimosse, `getQuestChronicleSkinConfig()` e `phase.riskProfile`; build:check e Playwright quest card passano |
|| ERR-024 | MilestoneCheckModal hardcoded | `criticalFailChance` default = 5 non proviene da `questSkillCheckConfig`/`IdleVillageConfig` | §11 | chiuso — `criticalFailChance` calcolato da `questSkillCheckConfig.backgroundResolution.epicFailThreshold`; Playwright skill check passa |
|| ERR-025 | Reward collection incomplete | `handleCollect` applica solo `gold/food/wood/xp`; ignora `materials`, `renown`, `reputation` e `items` definiti nel blueprint | §11 | chiuso — `handleCollect` itera tutte le `rewardLines` e le passa a `addResources`; Playwright collect rewards passa |
|| ERR-026 | Consumables / quest items | `MOCK_QUEST_ITEMS` proviene da `questItemsMock.ts` perché `IdleVillageConfig` non ha ancora un tab/entità Quest Items; non è un bug, è un'implementazione mancante da pianificare | §11 | da pianificare — vedi `poi_quest_system_plan.md` 'Non in scope (R-005)' |
|| ERR-027 | Quest detail kits read default config | `questPoiKit.tsx`/`questDetailKit.tsx` leggono `DEFAULT_IDLE_VILLAGE_CONFIG.resources` per label/icona invece di `IdleVillageConfig.resources` | §11 | chiuso — `questDetailKit` usa `useIdleVillageConfig().config.resources`; `questPoiKit` non importava `DEFAULT_IDLE_VILLAGE_CONFIG`; build:check passa |


## Errori sospetti / da verificare in runtime

| ID | Area | Descrizione | Come verificare | Stato |
|---|---|---|---|---|
| ERR-013 | Resident release | Dopo la raccolta ricompense, i residenti devono tornare disponibili nel roster; verificare che `handleClear` venga chiamato per tutti gli slot e non solo per quelli visibili | Avviare e completare una quest | chiuso — test end-to-end verifica `[data-worker-id]:disabled` = 0 e nessun `Away` dopo collect |
| ERR-014 | Milestone auto-resolve | Se `QuestChronicle` è chiusa quando scatta una milestone, la fase deve risolversi fuori scena; verificare che `isMilestoneMinimized` o la chiusura della card non blocchino `useMilestoneEngine` | Chiudere la card e aspettare una milestone | confermato — la coda auto-risolve solo milestone in coda; il milestone attivo resta bloccato se `QuestChronicle` viene chiuso; richiede hook `resolveActiveMilestone` per sbloccare |
| ERR-015 | Pausa e slot swap | Durante la pausa, dopo Start, i pg possono essere tolti/scambiati; verificare che il countdown non avanzi e che non si rompa lo stato | Avviare, mettere in pausa, rimuovere pg | aperto |
| ERR-016 | Reward panel | `QuestRewardPanel` deve mostrare XP per i pg partecipanti; verificare che il payload contenga `xp` per ogni residente assegnato | Completare una quest con successo | aperto |

## Nuovi errori runtime (2026-08-15)

| ID | Area | Descrizione | Stato | Test |
|---|---|---|---|---|
| ERR-028 | Magnetic snap | Il residente draggato non viene attratto al centro del QuestPOI, ma cade sulla posizione del puntatore | confermato | `poiQuestRegressions.spec.ts` — `should magnetically snap a resident to the Quest POI center on drop` |
| ERR-029 | Pause state restore | Chiudere il POI detail fa ripartire il tempo anche se prima dell'apertura il gioco era già in pausa | confermato | `poiQuestRegressions.spec.ts` — `should preserve the pre-open pause state when the POI detail is closed` (test.fail) |
| ERR-030 | Drag preview visibility | Il `pgDraggableToken` diventa invisibile quando si trascina sopra il POI detail (probabile problema di asse z/overlay) | confermato | `poiQuestRegressions.spec.ts` — `should keep the resident drag preview visible when hovering the POI detail` |
| ERR-031 | Slot rack overflow | Quando tutti gli slot sono occupati ne appare uno aggiuntivo, ma il POI detail si espande invece di aggiungere una barra di scorrimento orizzontale | confermato | `poiQuestRegressions.spec.ts` — `should add a scrollable slot row instead of expanding the POI detail` |
| ERR-032 | Quest start gating | La quest non parte anche se tutti i residenti obbligatori sono assegnati correttamente | confermato | `poiQuestRegressions.spec.ts` — `should start the quest after manually filling all required slots` |
| ERR-033 | Day/Night ring alpha | Il componente tone con i ring mostra un quadrato attorno in alfa che diventa più visibile quando l'halo si colora | confermato | `poiQuestRegressions.spec.ts` — `should render day/night ring tone without visible alpha square artifact` |

## Note

- Il registro è vivo: ogni fix dovrà aggiornare lo stato in questo file e produrre evidenza.
- ERR-017 è stato rimosso: era un falso positivo generato dal test. Il test stava usando un selettore sbagliato (`slot-medal-*`) e una simulazione di drag che non scatenava il drop corretto. Il comportamento della pagina è corretto, il problema è nel test.
- Prossimo passo: stabilizzare il test di auto-assign identificando il pg compatibile o correggendo la simulazione del drag.
