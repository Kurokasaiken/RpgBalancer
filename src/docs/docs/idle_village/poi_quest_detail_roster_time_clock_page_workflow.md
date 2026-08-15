---
title: POI Quest — Detail/Roster/Time/Clock Page Workflow
status: draft
updated: 2026-08-15
type: page-workflow
---

# Pagina `/poi-quest-detail-roster-time-clock` — Workflow completo

> Documento di cattura del flusso narrato dal Director. Contiene lo stato desiderato della pagina e del comportamento dei componenti. Alla fine della discussione le parti stabili verranno divise nelle spec singole, nelle spec di interazione e in `gameplay_system_complete.md`.

## 1. Time Governance (pagina-wide)

- Il tempo è gestito a click.
- Esiste un componente `DayNightPOI` che mostra tempo/fase.
- **Regola generica per ogni pagina che usa tempo/tick:** tutto ciò che consuma tempo/tick nella pagina deve essere governato dallo stesso meccanismo di tick/pausa. Questa regola è trasversale e andrà referenziata dal contratto del time engine.

## 2. Componenti in scena

| Componente | Ruolo nella pagina |
|---|---|
| `DayNightPOI` / `DayNightActionCard` | Mostra giorno/notte, permette pausa/resume |
| `QuestPOI` | POI di tipo quest con halo magico che si scrive |
| `VillageRosterSection` + `PgCard` | Roster trascinabile |
| `ResidentSlotRack` + `CardSocket` | Slot interni al POI detail/chronicle |
| `PoiDetailSkinWrapper` / `ActivityCapsuleDetailSkinAware` | Pannello detail flottante |
| `QuestChronicle` | Card cinematografica a fasi |
| `MilestoneCheckModal` | Modale consumabili + skill check |
| `DestinyAstrolabeComponent` (V2) | Risoluzione skill check |
| `QuestRewardPanel` | Schermata ricompense |
| `MagicCircleHalo` | Cerchio magico intorno al POI |

## 3. Stati del Quest POI

```text
idle ──(assemblo party)──► ready
 ready ──(start + tick)──► running
 running ──(milestone)──► check
 check ──(player decide)──► skill check
 skill check ──(resolve)──► running
 running ──(last phase)──► completed
 completed ──(open / click)──► rewards
```

## 4. Regole di interazione

### 4.1 Assegnazione residenti e bloom del POI

- `PgCard` trascinabili dal roster.
- Il `QuestPOI` deve comportarsi come un `ResidentSlotRack` proxy: se almeno una `PgCard` può essere droppata in almeno uno slot interno, il POI fa bloom `valid`.
- Se nessun `PgCard` corrente può essere assegnata a nessuno slot, il POI va in alfa/invalid.
- Stessa logica per **click-to-assign**: se un pg cliccato può andare in uno slot del POI, lo fa.
- Il bloom/alfa del POI si basa sullo stesso `bloomEffect` (`drop-shadow`) e sullo stesso `statMatching` del `ResidentSlotRack`.

### 4.2 Fase pre-start: quest inerte al tempo

- Finché **tutti gli slot obbligatori** non sono assegnati correttamente, il `QuestPOI` **non** interagisce con il tempo.
- Tick, pause, day/night passano sopra la quest senza modificarla.
- Il `MagicCircleHalo` non disegna niente.

### 4.3 Apertura POI detail di una Quest

- Clicco sul `QuestPOI` → si apre il **POI detail** (non la quest chronicle a questo stadio).
- Il POI detail contiene lo `ResidentSlotRack` con i suoi slot.
- Il POI detail deve essere **draggable** trascinando l'intestazione, senza aggiunta di elementi estetici extra.
- **Solo per il POI detail di una Quest**, l'apertura mette automaticamente il gioco in **pausa**.
- La chiusura del POI detail riprende il tempo canonico.
- Il POI detail deve riprendere il look/comportamento di `/poi-quest-detail-roster-integration`: niente ornamenti aggiuntivi, pannello flottante draggabile/minimizzabile/chiudibile.

### 4.4 Posizionamento pannelli

- Ogni pannello fluttuante che si apre (`POI detail`, `QuestChronicle`, `MilestoneCheckModal`, `QuestRewardPanel`, `DestinyAstrolabeComponent`/`MilestoneCheckModal`, schermata ricompense) deve apparire al **centro del div di riferimento** (per questa pagina: il viewport della mappa), non dello schermo intero. Deve essere **completamente visibile** all'interno di quel div.
- Esempio: se c'è un menu laterale, la metà di riferimento è la metà della mappa, non dello schermo.

### 4.5 Start della quest

- Quando tutti gli slot obbligatori sono assegnati e i pg soddisfano i requisiti, il pulsante `Start/Embark` è ancora disabilitato se il gioco è in pausa.
- Il pulsante ha bisogno di un restyling visivo (miglioramento UI).
- `Start` inizia davvero solo se **anche il tempo scorre** (non in pausa).
- Se il gioco è in pausa, `Start` non fa nulla: `handleEmbark` esce precocemente quando `isPaused === true`.
- L'utente deve riprendere il tempo dal `TimeEngineStrip` (pulsante Play) affinché `Start/Embark` si abiliti.
- Dopo lo start, i pg possono essere tolti/scambiati? Sì, finché il tempo è in pausa non succede nulla. Start conta solo se il tick avanza.

## 5. Quest in esecuzione

### 5.1 Dopo lo start

- Da questo momento in poi, al click sul `QuestPOI` non si apre più il POI detail ma la **`QuestChronicle`**.
- Il `QuestChronicle` risente del tempo: fasi, rope, esiti avanzano con i tick.
- `QuestChronicle` deve essere aperta per vedere lo svolgimento, ma le fasi si risolvono anche se è chiusa.

### 5.2 Magic Circle Halo

- L'halo del POI inizia a disegnarsi dalle ore 12 in senso orario.
- Progresso = tempo trascorso / durata totale.
- Quando la quest è completata e non è ancora aperta, il POI **pulsa**.
- Il reskin estetico è un lavoro separato (R-006); il comportamento temporale rimane questo.

### 5.3 Milestone / Skill check

- La quest è divisa in X fasi (da config `QuestPhase`).
- A ogni milestone temporale (equispaziata: durata totale / numero fasi) si interrompe l'avanzamento.
- Appare `MilestoneCheckModal` con opzioni:
  - spendere consumabili;
  - abbandonare la quest;
  - procedere allo skill check.
- Se il giocatore sceglie di procedere, parte lo **skill check**.
- Lo skill check canonico è la **V2** di `DestinyAstrolabeComponent` (`/minimal-destiny-astrolabe` V2).
- All'astrolabe vengono passati:
  - quali skill e quante;
  - percentuali morte, ferita;
  - modificatori a successo e fallimento critico;
  - altri dati definiti nel blueprint della fase.
- Il risultato dello skill check viene salvato nella fase corrispondente del `QuestChronicle`.
- Se passa abbastanza tempo, la fase successiva si risolve nello stesso modo (milestone → modale → skill check).

### 5.4 Risoluzione finale

- Quando tutte le fasi sono risolte, si calcola:
  - esito complessivo (successo / fallimento);
  - ferite, morti, modificatori;
  - ricompense (oro, risorse, oggetti, XP per i pg partecipanti).
- Regola di successo: una quest è considerata successo se `successi >= fasi_totali / 2` (metà inclusa). Esempio: 2 su 4, 3 su 6, 2 su 3 (maggioranza semplice).
- Se successo: appare `QuestRewardPanel`.
- Se fallimento: appare schermata di fallimento corrispondente.

## 6. Quest completata ma non aperta

- Se il tempo passa e la quest si completa mentre `QuestChronicle` è chiusa:
  - il `QuestPOI` pulsa;
  - il giocatore può cliccare per aprire `QuestChronicle` e fare le operazioni mancanti (skill check, consumabili, ecc.);
  - lo stato rimane in "completata in attesa di risoluzione" finché il giocatore non interagisce.

## 7. Reward

- `QuestRewardPanel` mostra le ricompense (`gold`, `food`, `wood`, `xp`) derivate dal blueprint della quest e dal moltiplicatore di esito.
- Al click su "Raccogli" il `QuestRewardPanel` invoca `handleCollect`, che: somma le risorse allo store canonico `useMinimalGameplay` via `addResources`, resetta lo stato della quest, chiude la quest card e rende disponibili i residenti nel roster.
- Il POI torna in stato idle/disponibile.

## 8. Invariants pagina-wide

- Single source di tempo: `TimeEngine` → `useMinimalGameplay`.
- Il `QuestPOI` è inerte finché gli slot obbligatori non sono pieni.
- Apertura `POI detail` di una Quest mette in pausa.
- Dopo lo start il click apre `QuestChronicle`, non il detail.
- Start attivo solo se il tempo non è in pausa.
- Tutti i pannelli si aprono centrati e completamente visibili.
- Il bloom/alfa del POI segue le stesse regole del `ResidentSlotRack`.

## 9. Collegamenti ai doc esistenti (da aggiornare/split)

- [`time_engine_spec.md`](./time_engine_spec.md) — pausa, avanzamento fasi, start condizionato al tick
- [`day_night_poi_spec.md`](./day_night_poi_spec.md) — visualizzazione tempo/fase
- [`poi_spec.md`](./poi_spec.md) — bloom/alfa, inertness pre-start, pulsazione post-completamento
- [`detail_spec.md`](./detail_spec.md) — apertura, pausa automatica per Quest, draggabilità
- [`roster_spec.md`](./roster_spec.md) — PgCard drag, click-to-assign
- [`slot_rack_spec.md`](./slot_rack_spec.md) — slot obbligatori, validazione
- [`quest_spec.md`](./quest_spec.md) — fasi, milestone, skill check, reward
- [`gameplay_system_complete.md`](./gameplay_system_complete.md) — flusso end-to-end aggiornato
- [`poi_quest_interaction_spec.md`](./poi_quest_interaction_spec.md) — POI ↔ Quest
- [`time_engine_quest_interaction_spec.md`](./time_engine_quest_interaction_spec.md) — TimeEngine ↔ Quest

## 10. Verifica runtime — Playwright UI tests

La pagina espone hook test-only sotto `window.__idleVillageTestHooks` per permettere setup deterministici senza simulare dnd-kit:

- `assignResident(residentId: string)` — assegna un residente al primo slot compatibile; ritorna `residentId` o `null`.
- `assignAnyResident()` — assegna il primo residente libero trovato.
- `fillRequiredResidentSlots()` — riempie tutti gli slot obbligatori della quest corrente.
- `resolveActiveMilestone(verdict?)` — risolve il milestone attivo off-screen (uso test-only per sbloccare la chiusura della quest card).
- `findAcceptingSlot(residentId: string)` — ritorna il primo slot libero che accetta il residente (o `null`).
- `getResidentCompatibility(residentId: string)` — ritorna `{ state: 'valid'|'invalid', slotId?, slotLabel?, reason? }`.
- `setDraggingResidentId(id: string | null)` — imposta/resetta lo stato drag per esercitare bloom senza un vero drag.
- `getQuestState()` — ritorna `isQuestRunning`, `isPaused`, `elapsedMs`, `isQuestCardOpen`, `embarkResult`, `activeMilestone`.
- `getAssignments()` — ritorna lo stato slot/residente corrente.

La suite `tests/e2e/idleVillage/poiQuestDetailRosterTimeClock.spec.ts` copre:

1. Page shell (render, clock, roster, QuestPOI).
2. Start gating (CTA disabilitato finché non riempiti slot required).
3. Drop invalido (card rimbalza, rimane disponibile).
4. Drag del pannello POI detail via header.
5. Skill check astrolabe completo (`roll` → `Throw` → risultato → `dismiss`).
6. End-to-end: fill, start, chiudi quest card, auto-resolve milestones, speed 8x, riapri POI, reward panel, `collect` applica ricompense (`gold`/`food`/`wood`/`xp`) allo store, residenti rilasciati.
7. Pause/resume del timer da `TimeEngineStrip`.
8. Residente non compatibile → `data-compatibility='invalid'`, `aria-disabled='true'`, grigio, non assegnabile via click.
9. Bloom POI `valid` per residente compatibile e `invalid` per residente non compatibile.
10. Bloom slot `valid`/`invalid` nel detail quando un residente viene "trascinato" via `setDraggingResidentId`.
11. Assegnazione di un residente compatibile al primo slot libero, con reflection nella UI del detail.
12. Apertura del POI detail e visibilità dello `ResidentSlotRack` interno.
13. Pausa automatica del gioco all'apertura del POI detail di una Quest.

Risultato ultima run: 17 passati / 1 saltato (0 fallimenti); ERR-005 (Start gating) ora chiuso.
Evidence: `test-results/poi-quest-detail-roster-time-clock-runtime-2026-08-14.md`.

## 11. Config-first source of truth

### Flusso previsto

Tutti i dati delle quest devono arrivare dalla configurazione editabile caricata da `IdleVillageConfigStore`:

- L'utente modifica le attività nel tab **Activities** di `/idle-village-config` (`IdleVillageConfigRoute` → `IdleVillageActivitiesTab`), che importa/esporta JSON e persiste in `IdleVillageConfigStore`.
- `useIdleVillageConfig()` espone `config` a runtime.
- `useMinimalGameplayWithIdleVillageConfig()` trasforma `IdleVillageConfig` in `MinimalConfig` per lo store di gioco.
- `PoiDetailQuestRosterTimeClockIntegrationPage` dovrebbe leggere: l'activity da `config.activities`, il blueprint da `config.questBlueprints`, le regole di power da `config.globalRules.questPowerRules`, le risorse da `config.resources`.
- `questTotalDurationMs`, `buildAstrolabeSkillsForPhase`, `resolveMilestoneWithoutAnimation` devono ricevere `questTimeScale` e `questSkillCheckConfig` dal medesimo snapshot, non dai default inline.
- `QuestChronicle`, `MilestoneCheckModal` e `MagicCircleHalo` devono leggere palette/risk/timing da skin/quest config, senza fallback hardcoded.

### Mismatch confermati (static review)

- `PoiDetailQuestRosterTimeClockIntegrationPage.tsx` importa `DEFAULT_IDLE_VILLAGE_CONFIG` e usa `DEFAULT_IDLE_VILLAGE_CONFIG.activities.quest_city_rats` e `DEFAULT_IDLE_VILLAGE_CONFIG.globalRules` invece di `useIdleVillageConfig().config`.
- `defaultQuestBlueprints` è importato direttamente dal modulo invece di `config.questBlueprints`.
- `questPowerRules` fallback a `DEFAULT_QUEST_POWER_RULES` (definiti nel file del motore) anziché da `config.globalRules.questPowerRules`.
- `questTimeScale` e `questSkillCheckConfig` non sono campi di `IdleVillageConfig`; i motori usano `DEFAULT_QUEST_TIME_SCALE` e `DEFAULT_QUEST_SKILL_CHECK_CONFIG`.
- `QuestChronicle.tsx` ha `RISK_FALLBACKS`, `PAL`, `VARIANT_MAP`, `FILL_GRADIENTS`, `FILL_SHADOWS` hardcoded.
- `MilestoneCheckModal.tsx` default `criticalFailChance = 5` non proviene dalla config.
- `handleCollect` applica solo `gold/food/wood/xp` e ignora `materials`, `renown`, `reputation`, `items` del blueprint.
- `MOCK_QUEST_ITEMS` è un mock temporaneo; `IdleVillageConfig` non ha ancora un tab Quest Items. Questo non è un bug da chiudere qui, ma un'implementazione mancante tracciata come ERR-026 nel master plan.
- `questPoiKit.tsx`/`questDetailKit.tsx` leggono resource label/icon da `DEFAULT_IDLE_VILLAGE_CONFIG.resources`.

Vedi `poi_quest_detail_roster_time_clock_error_registry.md` per gli ID (ERR-019 – ERR-027).

## Comportamenti attesi (2026-08-15)

I seguenti comportamenti, derivati dalle indicazioni del Director, sono catturati in `tests/e2e/idleVillage/poiQuestRegressions.spec.ts` e nel registro errori (`ERR-028..033`). Ogni voce punta alla spec che contiene il contratto completo; non duplicare il testo, ma usarla come riferimento.

- **Magnetic snap** — il residente draggato verso il QuestPOI si ancora al centro del POI: `poi_quest_interaction_spec.md`
- **Ripristino pausa** — chiudere il POI detail preserva lo stato di pausa precedente: `poi_detail_interaction_spec.md`, `time_engine_quest_interaction_spec.md`
- **Drag overlay visibile** — il token trascinato sopra il POI detail resta visibile: `poi_detail_interaction_spec.md`, `floating_panel_spec.md`
- **Slot rack overflow** — slot extra = scroll orizzontale, nessun allargamento del detail: `roster_slot_rack_interaction_spec.md`
- **Quest start** — con tutti i pg correttamente assegnati, Start avvia la quest: `poi_quest_interaction_spec.md`
- **Day/night tone ring** — nessun quadrato alfa attorno ai ring: `day_night_poi_spec.md`
