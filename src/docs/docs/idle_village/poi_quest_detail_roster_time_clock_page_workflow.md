---
title: POI Quest — Detail/Roster/Time/Clock Page Workflow
status: draft
updated: 2026-08-13
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
- Il POI detail deve riprendere il look/comportamento di `/poi-quest-detail-roster-integration`: niente ornamenti aggiuntivi, pannello flottante draggabile/minimizzabile/chiudibile.

### 4.4 Posizionamento pannelli

- Ogni pannello fluttuante che si apre (`POI detail`, `QuestChronicle`, `MilestoneCheckModal`, `QuestRewardPanel`, `DestinyAstrolabeComponent`/`MilestoneCheckModal`, schermata ricompense) deve apparire al **centro del div di riferimento** (per questa pagina: il viewport della mappa), non dello schermo intero. Deve essere **completamente visibile** all'interno di quel div.
- Esempio: se c'è un menu laterale, la metà di riferimento è la metà della mappa, non dello schermo.

### 4.5 Start della quest

- Quando tutti gli slot obbligatori sono assegnati e i pg soddisfano i requisiti, il pulsante `Start/Embark` è abilitato.
- Il pulsante ha bisogno di un restyling visivo (miglioramento UI).
- `Start` inizia davvero solo se **anche il tempo scorre** (non in pausa).
- Se il gioco è in pausa, `Start` non fa nulla oppure mostra un feedback "riprendi il tempo per iniziare".
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

- `QuestRewardPanel` mostra le ricompense.
- Tra le ricompense c'è anche XP per i pg partecipanti.
- Al click su "Raccogli" i residenti tornano disponibili nel roster, le ricompense vengono applicate, il POI torna in stato idle/disponibile.

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
