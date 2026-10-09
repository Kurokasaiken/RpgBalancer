---
title: 'PLAN-019-S2 — La quest vera: POI reali → assegnazione → motore a grafo → conseguenze su /game'
status: draft
created: 2026-10-09
revised: 2026-10-09 (v2 — cold read multi-AI web r1: 4× MAJOR REVISION → correzioni assorbite; v3 — decomposto in 5 figli S2.1…S2.5 su richiesta Director 2026-10-09 «dividilo in sub plan, linkati a questo plan, poi approfondisci plan by plan con le AI web»; questo file resta il contenitore: decisioni, invarianti, contratti condivisi, disaccordi)
children: PLAN-019-S2.1-scenario-canonico, PLAN-019-S2.2-party-reale, PLAN-019-S2.3-offerta-scaling, PLAN-019-S2.4-planning-lancio, PLAN-019-S2.5-settlement-e2e
desiderata: v24 (PLAN-019, stadio S2 «la quest vera»), v27 (frontiera — già implementata in `questRun.ts`)
request: R-107
parent: PLAN-019 (figlio S2)
related: PLAN-025 (teatro, attivo — coordinamento richiesto), PLAN-018 (precedente da mappare), QUEST_RULES.md, quest_theatre_spec.md, roster_drag_trusted.md + roster_slot_rack_interaction_spec.md + roster_slot_interaction_documentation.md + roster_trusted_components.md + slot_rack_spec.md + roster_slot_integration_spec.md + slot_rack_poi_interaction_spec.md (stack assegnazione — trusted/frozen), tests/e2e/idleVillage/poiQuestDetailRosterTimeClock.spec.ts (suite certificata esistente)
---

# PLAN-019-S2 — Un paio di POI funzionanti con POI detail veri

## Perimetro

Il Director chiede (R-107): *«un paio di POI che siano funzionanti, con POI
detail veri»*. Questo piano è il **primo slice esecutivo dello stadio S2** di
PLAN-019: la catena verticale POI → detail → assegnazione → run → conseguenze
sulla superficie canonica `/game`, senza mock sui canali reali (eccezione
dichiarata `int`/`cha`, vedi I-2).

Contenuto dello slice: **due POI** sulle quest già authored e validate nel lab
(`goblin` + `rovine`). La `cassa` resta fuori finché D-C non è chiusa (usa `cha`).

## Stato reale di partenza (FACT, verificato 2026-10-09)

- La **frontiera v27 è già nel motore**: `questRun.ts` ha `submitCommand`,
  `matureReady`, `frontierVersion`, `ENGINE_SCHEMA_VERSION`; `useQuestRun`
  persiste via `PersistenceService` con catch-up deterministico
  (`idleVillage.questRun.<questId>`).
- Su `/game` convivono **due sistemi scollegati**: `useQuestPoiSession`
  (POI → `ActivityCapsuleDetailSkinAware` → slot roster → quest vecchio modello
  blueprint+milestone) e `useQuestRun('goblin')` (motore a grafo, avviato solo
  dalla Regia). Lo slice unisce i due tubi.
- Le stat reali dei residenti sono lo **StatBlock combat** del balancer
  (`statSnapshot: Partial<StatBlock>` — `hp`, `damage`, `txc`, `evasion`,
  `agility`, `hitChance` derivata…). **`charisma` non esiste** — è il nodo
  scoperto di PLAN-019 D-3, chiuso dal Director il 2026-10-09 (vedi D-C).
- Esistono già: `questItems.schema.ts` (Zod, MP-02), `questStash.ts`,
  `getResidentPortraitUrl`, `InjuryEngine`, fascia-banda definita in R-105.
- PLAN-025 (attivo) trasforma la presentazione: questo piano tocca **lancio e
  stato**, quello il rendering. Il lancio punta all'API `useQuestRun`; il
  componente è deciso: **`QuestRunWindow` è il componente battezzato** per la
  quest in corso su `/game` (decisione Director 2026-10-09, D-F) — è quello che
  si apre dalla Regia («Start goblin quest») e dal menu Pannelli (tasto Q), e
  ospita la convergenza col teatro (R-106 iter. 3 «un solo componente»).

## Divergenza da registrare (T-001)

PLAN-019 scriveva *«il codice S1 non viene promosso: si trasferiscono le regole
validate, non l'implementazione»*. Il motore a grafo è diventato **canonico per
costruzione**: la frontiera v27 è implementata lì, PLAN-025 ci costruisce il
teatro sopra, il Monte Carlo lo misura. Riscriverlo sarebbe regressione.
D-2 si chiude con l'evidenza esistente (lo «spike» è già avvenuto in
produzione: 3 quest + frontiera + persistenza), non con un confronto ex-novo.
Da registrare in `DECISION_LOG.md` e in PLAN-019.

## Decisioni del Director (T-001 — CHIUSE 2026-10-09)

| id | Decisione | Esito |
|---|---|---|
| D-A | Formato quest canonico | **CHIUSA 2026-10-09** («procedi»): grafo di nodi canonico; `QuestBlueprint` si riduce a *busta offerta* (metadati POI/detail); scenari promossi a schema Zod config-first. Chiude PLAN-019 D-2 — da registrare in DECISION_LOG. |
| D-B | Superficie di assegnazione | **CHIUSA 2026-10-09** («1 si»): riuso della session POI esistente (detail + slot roster già su `/game`); il Mission Planner completo resta lavoro di **S3** per v24. |
| D-C | Mappatura `LabStat` → stat balancer (PLAN-019 D-3) | **CHIUSA 2026-10-09** (correzione Director in sessione: *«%tohit = percezione, dodge = agilità»*): le competenze si **derivano dallo StatBlock combat reale** — `str←damage`, `con←hp`, `perc←%tohit` (`hitChance`, flat `txc` candidato), `agi←evasion` (dodge); `int` e `cha` **mockate ma dentro la stessa pipeline config-driven** (regola di derivazione in config Zod: quando il Director decide la derivazione reale si cambia solo la config); `cha` nei check usa il canale `int` («rimappa su int»). Tutte le derivazioni vivono in un'unica tabella config (`questMemberStats`). |
| D-D | Quante quest attive | **Una spedizione alla volta** (default conforme; v27 lascia aperto il multi-teatro). |
| D-E | Vecchio path milestone su `/game` | **Bypassato** per le quest a motore nuovo (default conforme); il kit resta vivo solo sulla superficie deprecata. Nessuna riscrittura del session hook — adapter sottile. |
| D-G | Assegnazione party | **CHIUSA 2026-10-09** (Director: *«i pg nn devono essere pre assegnati, devono essere assegnati dal giocatore, dal roster vero… C'è tutta una documentazione specifica per l'interazione tra Roster + pgCard + slot+ slot Rack»*): nessun party pre-assegnato né preset nel percorso POI — il giocatore assegna residenti **reali** dal roster vero agli slot del POI detail tramite lo **stack trusted roster↔slot** esistente (vedi sezione dedicata). Test E2E Playwright **reali** obbligatori, non solo unit. |
| D-H | Contratto POI detail = superficie di planning | **CHIUSA 2026-10-09** (Director, spec verbatim: *«il POI che prende i valori dalla config corretta… i valori sotto che spiegano cosa fanno, che modificiatori hanno, le % di pericolosità, ecc dinamici a seconda di quanti slot sn occupati… la preview della quest totale… la durata, un modo di dire la pericolosità, un modo di esprimere la quantità del reward… un modo x cambiare queste due cose come valori esterni… dopo che i pg sn hanno occupato gli slot obbligatori la quest può essere accettata… "invia spedizione"… l'halo comincia a riempirsi durante il tempo… quando clicchiamo sul POI parte il componente delle quest»*): vedi sezione dedicata — il detail è una superficie di **planning viva**, non una scheda; le parti non ancora implementate (reward-by-party) si marcano come mock tracciati. |
| D-I | Sorgente dei «valori esterni» | **CHIUSA 2026-10-09** (Director: *«un modificatore al pericolo e un modificatore al reward che vengono… nn so da dove… in base a determinati valori bilanci il reward e la difficoltà, ad esempio: da quanti giorni stai giocando, il livello medio dei tuoi eroi, il livello medio degli equipaggiamenti… poi ricreiamo/miglioriamo solo da dove e come viene fatto quel calcolo e il resto lo cerchiamo di lasciare il + simile possibile»*): si costruisce il **primo world-scaling reale** — `collectWorldProgressSignals()` legge segnali di progressione (giorni di gioco dal TimeEngine — reale; potenza media eroi derivata da `statSnapshot` — metrica da definire; potenza media equip da `equipmentStorage`/`heroItems` — reale con hook) → config `worldScaling` (Zod: pesi + bande) → `{dangerScale, rewardScale}` nel bag `modifiers` di `resolveQuestOffer`. La formula e le sorgenti sono **un'unità sostituibile**: il contratto di consumo (`resolveQuestOffer` + congelamento nel run) resta stabile quando la formula viene rifatta. |
| D-J | Semantica halo | **CHIUSA 2026-10-09** (Director: «Puro elapsed/durata»): l'halo si riempie come **tempo trascorso / `estimatedDuration`** da config — stima di avanzamento, non legata alla frontiera, **non si ferma ai bivi**: indica quanto tempo ci vuole a fare la quest. Il badge «decisione in attesa» resta come segnale separato (proposta §D-H-4) perché è un problema diverso dal riempimento. |
| D-K | Gating temporale dei nodi + caricamento della finestra | **CHIUSA 2026-10-09** (Director, verbatim: *«i nodi sono risolti dal giocatore, ma se quella porzione di tempo è già passata puoi risolvere immediatamente anche il nodo successivo. Una quest dura X tick, ha N fasi: devi aspettare la porzione della prima fase, poi della seconda, ecc. Se torni dopo mezza durata puoi risolvere le fasi scadute senza aspettare (e se nel frattempo passa la porzione successiva puoi risolvere anche quella). Anche il componente interno si deve caricare allo stesso modo: solo le icone in fondo — fasi superate + preview della successiva. Durante quegli X tick si mostra la frase di flavour tra l'una e l'altra. Le durate sono in tick, 1 tick = 1 s»*): i nodi hanno **finestre di sblocco su schedule assoluto** — la porzione di tempo di un nodo matura sul clock indipendentemente dalla risoluzione dei nodi precedenti; i nodi scaduti si risolvono dal giocatore **in sequenza senza attesa**. `QuestRunWindow` riflette lo stesso modello: tile fasi = completate + preview della prossima; durante l'attesa si mostra la frase di flavour/transit; durate in **tick** (`1 tick = 1 s`). **Implicazione sul motore (da verificare in T-006):** se la frontiera v27 ferma la maturazione su `awaitingPlayer`, questa decisione la modifica — `readyAt` è schedule-assoluto, la risoluzione del giocatore può avvenire in batch sui nodi scaduti. |
| D-F | Componente quest in corso su `/game` | **CHIUSA 2026-10-09** (Director: *«dentro la pagina /game c'è il componente quest in progress che si apre dal director, quello è il componente corretto»*): **`QuestRunWindow`** (`components/gameFrame/QuestRunWindow.tsx`) è il componente battezzato — si apre dalla Regia («Start goblin quest») e dal menu Pannelli (tasto Q). `QuestTheatre` (PLAN-021/PLAN-025) converge *dentro* `QuestRunWindow`, non il contrario (R-106 iter. 3 «un solo componente»). |

## Invarianti (verificabili)

- **I-1 — Config-first:** scenari e POI validati Zod in
  `src/balancing/config/idleVillage/quests/`; nessun nuovo valore hardcoded.
- **I-2 — Nessun mock sui canali reali** (gate S2-a, emendato per deroga
  esplicita del Director 2026-10-09 — da registrare in DECISION_LOG): stat
  derivabili (`str`/`con`/`perc`/`agi`), HP, item, gold e persistenza vengono
  da residenti/config/store reali. **`int` e `cha` sono eccezioni dichiarate**:
  la tabella `questMemberStats` le marca `mockChannel: true`, i check che le
  usano sono elencabili dalla config, e il gate si valuta consapevolmente sui
  canali reali. Una pipeline configurabile non rende reale un mock: rende
  tracciabile il punto in cui entra — questa è la forma accettata, non la
  negazione dell'eccezione.
- **I-3 — Motore invariato:** `questRun.ts` non cambia regole/numeri/contenuto;
  `createRun` si generalizza, non si riscrive. Lab e Monte Carlo restano verdi
  sul percorso preset.
- **I-4 — Un solo owner del run E della sessione POI attiva:** `useQuestRun`
  resta l'unico owner del run; all'Embark la sessione POI rilascia il proprio
  stato per quel POI (niente doppio stato vivo session+run). I residenti
  assegnati sono marcati `inExpedition` (lock esplicito, rilasciato dal
  settlement o dal ritiro) e non eleggibili altrove finché il lock tiene.
- **I-5 — Persistenza:** tutto via `PersistenceService`; reload a metà run
  riproduce la stessa frontiera (già vero, da non regredire).
- **I-7 — Assegnazione sullo stack trusted:** il party è composto dal
  giocatore via lo stack roster↔slot certificato (RT-ROSTER-001, frozen —
  vedi sezione dedicata); nessun party pre-assegnato o preset nel percorso
  POI, nessun sistema di drag parallelo, nessun duplicato di
  `PgCard`/`ResidentSlotRack`/`statMatching`. Toccare il contratto di
  runtime di questi componenti richiede l'aggiornamento dei trusted doc e di
  `COMPONENT_MASTER_INDEX.md` (governance documentazione).
- **I-6 — i18n e skin:** nuove stringhe in locale; nuove superfici su primitives
  e token `--skin-*`.

## Architettura

```
questPois config (Zod): id, x/y, questId, availableDays, fascia derivata
   └─ MapQuestPoi (esiste) → useQuestPoiSession detail (esiste, sottile)
        └─ Embark → residentToQuestMember(residente) → PartyMember[]
             └─ useQuestRun.start(questId, {party, loadout, seed, clock})
                  └─ questRun (frontiera v27 — ESISTE, I-3)
                       └─ QuestRunWindow (componente battezzato — D-F;
                          PLAN-025 ci fa convergere il teatro)
                            └─ run.ended → writeback
                                 morti/feriti → residenti (InjuryEngine)
                                 gold/loot → risorse villaggio
                                 esito → POI si chiude + riga ledger
```

### Schema quest canonico

`questScenarios.schema.ts` (Zod) specchia `QuestNode`/`QuestOption`/`CombatSpec`
come sono — stessi campi, stessa semantica — più un header `offer`
(titolo, obiettivo, tags, fascia, rewards, `primaryStats`) che sostituisce il
ruolo di `QuestBlueprint` nel detail. Gli scenari authored migrano da
`questS1Lab/*.ts` a config `questScenarios.*.ts`; il registry `QUESTS` legge
via parse. I file lab restano la sorgente della migrazione e il lab continua a
funzionare sui preset.

### Assegnazione dal roster reale (contratto trusted, D-G)

Il party della quest **non è pre-assegnato**: il giocatore compone la
spedizione trascinando (o click-to-assign) residenti reali da
`VillageRosterSection` negli slot del POI detail. Lo slice usa lo **stack
trusted/frozen già certificato** — non si reinventa:

- **Sorgente**: `VillageRosterSection` + `PgCard` (draggable, `didDragRef`),
  `CustomDragOverlay` (preview circolare `snapCenterToCursor`),
  `DragContext`/`DragProvider` per lo stato drag.
- **Target**: `ResidentSlotRack` nel POI detail (gli slot mappano i ruoli
  quest: leader/member/bodyguard); `useResidentSlotController` per
  assegnazione; l'assegnazione si scrive **dopo `onFlightComplete`**, non in
  `onDragEnd`.
- **Validazione**: `useResidentDropValidation` + `residentDropRules` +
  `statMatching` (allOf/anyOf/noneOf) — le regole di eleggibilità quest
  (morto/in spedizione/ferito, requisiti di slot) si esprimono come regole
  config in questo motore, così un residente non eleggibile arriva già come
  `compatibilityState='invalid'` (grayscale, `aria-disabled`, non
  interattivo) come da spec congelata.
- **Invarianti d'interazione**: `collisionDetection={pointerWithin}`,
  sensori da `getCurrentDragConfig()`, `flagResidentAfterRejectedInteraction`
  su drop fuori target, MIME `RESIDENT_DRAG_MIME`, versioni dnd-kit
  congelate. Reload durante il drag = stato volatile che si ricompone dal
  persistito (nessun salvataggio pendente).
- **Riferimenti**: `trusted/roster_drag_trusted.md`,
  `roster_slot_rack_interaction_spec.md`,
  `roster_slot_interaction_documentation.md` (freeze replicabile 1:1),
  `roster_trusted_components.md`, `slot_rack_spec.md`,
  `roster_slot_integration_spec.md`, `slot_rack_poi_interaction_spec.md`,
  `docs/plans/roster_slot_poi_integration.md`. Suite certificata esistente:
  `tests/e2e/idleVillage/poiQuestDetailRosterTimeClock.spec.ts` e
  `rosterSlotPoiIntegration.spec.ts` — i nuovi test E2E dello slice
  **estendono questo pattern**, non inventano un harness parallelo.

### Il POI detail come superficie di planning (contratto, D-H)

Il detail non è una scheda descrittiva: è la superficie dove il giocatore
*capisce e decide* prima di impegnare il party. Contratto dello slice:

- **Offerta da config**: titolo, obiettivo, tags, rewards base, durata e
  slot richiesti/opzionali vengono da `questPois` + `questScenarios.offer`
  (Zod); nessun valore testuale o numerico hardcoded, copy via i18n.
- **Slot con spiegazione**: ogni slot mostra requisito, ruolo coperto
  («cosa fa»), i modificatori che il residente assegnato riceve, e il suo
  contributo al rischio — **dinamico rispetto agli slot occupati** (un
  bodyguard assegnato cambia il rischio del leader, ecc.).
- **Pericolosità dinamica**: a ogni cambio di assegnazione,
  `simulateQuest` (Monte Carlo seeded — **esiste, è reale, non mock**)
  ricalcola la distribuzione esiti del party corrente e il detail mostra
  bande compatte (pulito/ferite/morti/wipe) con etichetta «stima su N
  simulazioni» — mai precisione finta (critica r1). Party incompleto →
  stato «incompleto», non numeri parziali.
- **Preview della quest totale**: la stessa simulazione alimenta un
  riepilogo dell'intera run (esiti attesi, reward atteso, durata).
  **Reward variabili in base al party: non implementati** (Director: «da
  tenerne conto che arriverà») — lo schema `offer` espone il punto di hook
  (`rewardPreview`) e il valore mostrato oggi è il base da config marcato
  come stima.
- **Espressione di pericolo e reward**: entrambi passano da **bande da
  config** — `dangerBands` (R-105, esiste) e `rewardTiers` (nuovo schema
  Zod, stessa idea: label + icona per fascia). Mai numeri crudi in UI.
- **Modificatori esterni — «constructor» + world-scaling (D-I)**: pericolo e
  reward passano da un punto unico di risoluzione,
  `resolveQuestOffer(offer, modifiers)`, dove `modifiers` è un bag di input
  esterni. Il bag oggi contiene `dangerScale`/`rewardScale`/`durationScale`
  **più un primo world-scaling reale** (D-I): `collectWorldProgressSignals()`
  raccoglie i segnali disponibili — `daysPlayed` (TimeEngine, reale),
  `avgHeroPower` (derivato da `statSnapshot`, metrica canonica da definire —
  mock-hook tracciato), `avgEquipPower` (da `equipmentStorage`/`heroItems`,
  hook reale) — la config `worldScaling` (Zod: pesi + bande) li mappa in
  `{dangerScale, rewardScale}`. Formula v0 minimale e **sostituibile come
  unità**: solo «da dove e come viene fatto il calcolo» si riscrive quando
  serve, il contratto di consumo resta. **I valori risolti si congelano
  nell'istanza di run alla creazione** (stile constructor): un run attivo
  non cambia se config o mondo cambiano a metà — coerente con la frontiera
  deterministica.
- **Gate di invio**: il pulsante **«Invia spedizione»** resta disabilitato
  finché tutti gli slot `required` non sono occupati da residenti validi;
  gli slot `optional` (es. bodyguard) non bloccano.
- **Halo del POI** (D-J): a spedizione inviata, l'halo (oggi vuoto) si
  riempie come **tempo trascorso / `estimatedDuration`** da config — pura
  stima di avanzamento, non legata alla frontiera; a run conclusa → pieno +
  esito. Il «quanto dura» resta visibile in detail prima dell'invio. Il
  badge «decisione in attesa» sul POI è un **segnale separato** (proposta
  D-H-4), non parte del riempimento.
- **Click POI per stato**: offerta disponibile → detail planning;
  **spedizione attiva → `QuestRunWindow`** (D-F, «il componente delle
  quest»); dopo settlement → aftermath/riga ledger.

**Aggiunte proposte dal planner** (non nominate dal Director, derivate dal
contratto — da ratificare):

1. **Badge `inExpedition` sul roster**: il residente lockato (I-4) deve
  *vedersi* occupato — PgCard badge «in spedizione» + `compatibilityState`
  per gli altri slot.
2. **Loadout pre-invio**: lo stash picker consumabili (R-102, esiste nel
  lab) va nella detail prima dell'invio — il `loadout` si congela nel run
  come il resto.
3. **Persistenza assegnazione parziale**: chiudere il detail a metà
  assegnazione non perde gli slot (la session è montata a livello pagina —
  verificare che regga anche al reload, altrimenti mock-hook).
4. **Segnale bivio** sul POI/mappa: badge/pulse quando la spedizione aspetta
  una decisione — riusa il meccanismo PLAN-025 D-6, non un secondo canale.

## Task — decomposto in 5 figli (2026-10-09, richiesta Director)

Questo file resta il **contenitore**: decisioni D-A…D-J, invarianti I-1…I-7,
contratti condivisi (stack trusted, planning surface, settlement), gate e
disaccordi residui. L'esecuzione vive nei figli — ciascuno self-contained e
sottoposto a cold read web dedicato, plan by plan.

| Figlio | Scope | Task padre assorbiti | Dipende da |
|---|---|---|---|
| [PLAN-019-S2.1](PLAN-019-S2.1-scenario-canonico.md) | `QuestScenarioSchema` Zod + migrazione goblin/rovine + parità | T-002 | — |
| [PLAN-019-S2.2](PLAN-019-S2.2-party-reale.md) | pipeline stats residenti + item reali + `createRun` generalizzato | T-003, T-004 | — |
| [PLAN-019-S2.3](PLAN-019-S2.3-offerta-scaling.md) | `questPois` + bande + `resolveQuestOffer` + `worldScaling` | T-005 | S2.1 |
| [PLAN-019-S2.4](PLAN-019-S2.4-planning-lancio.md) | detail planning + assegnazione trusted + send + halo + routing | T-006 | S2.1+S2.2+S2.3 |
| [PLAN-019-S2.5](PLAN-019-S2.5-settlement-e2e.md) | settlement idempotente + secondo POI + E2E + chiusura | T-007…T-010 | S2.4 |

T-001 (registrazione decisioni D-A…D-J) è **fatto** in questo file: DECISION_LOG
aggiornato 2026-10-09; deroga `int`/`cha` da registrare a battesimo figli.

## Fuori scope

Mission Planner rimappato (S3) · generazione/tag/archetipi (S5) · registro
narrativo pieno e memoria personaggi (OPEN-016 → S4/S5) · multi-quest parallele
· combat animato · audio · calibrazione letalità R-105 (la fascia sì, i numeri
no) · quest `cassa` reale (dipende da D-C/cha) · modifiche al balancer.

## Acceptance (= gate S2 di PLAN-019)

1. **Gate (a)** — nessun mock sui canali reali (stat derivate, HP, item, gold,
   persistenza); le eccezioni `int`/`cha` sono marcate `mockChannel` in config
   e l'elenco dei check che le usano è generabile — la deroga è esplicita e
   registrata, non nascosta dietro la configurabilità.
2. **Gate (b)** — preservazione delle proprietà: la goblin rigiocata sul
   runtime con party reale conserva le righe di «regole validate» S1 (numeri
   possono cambiare, proprietà decisionali no); le righe con *dipende da stat
   mock = sì* verificate per prime; nessun check degenere (probabilità fuori
   banda dichiarata = finding, non tuning silenzioso).
3. Conseguenze persistite **una sola volta** e visibili: settlement
   idempotente verificato con reload prima/durante/dopo il writeback;
   transizioni terminali conformi alla tabella.
4. Config-first: scenari, POI, fascia ed eleggibilità validati Zod; i18n e
   skin su tutta la nuova superficie.
5. **Assegnazione reale (D-G):** il party è composto dal giocatore dal roster
   vero via stack trusted (drag/click-to-assign, eleggibilità via
   `statMatching`); nessun preset/pre-assegnazione nel percorso POI; E2E
   Playwright reali su `/game` coprono assegnazione → lancio → bivio →
   epilogo → settlement → reload.
6. **Planning surface (D-H):** pericolo dinamico al cambio di assegnazione
   (bande da `simulateQuest`, etichetta stima, stato «incompleto»), preview
   quest, durata, bande pericolo+reward, «Invia spedizione» gated sugli slot
   required, halo che si riempie col tempo (puro elapsed/durata, D-J — non si
   ferma ai bivi), nodi con sblocco a schedule assoluto e risoluzione in batch
   degli scaduti (D-K), click POI attivo
   → `QuestRunWindow`; i mock-hook tracciati (`rewardPreview` base,
   moltiplicatori neutri) sono elencati esplicitamente nell'evidence.
6. **Gate (c)** — giudizio del Director sulle 2 quest lanciate dai POI reali.
7. Safeguard verdi + evidence log.

## Disaccordi residui (critica r1)

- **deepseek (MAJOR):** sostiene che POI/detail/roster anticipino S3
  («preparazione della spedizione») e che lo slice dovrebbe limitarsi al run
  lanciato dalla Regia. **Non assorbito:** la richiesta R-107 del Director è
  esplicitamente «POI funzionanti con POI detail veri» — il tubo POI→lancio è
  l'oggetto dello slice; lo scheduler completo di S3 (planning come fase di
  gioco) resta fuori.
- **grok (MAJOR):** chiedeva «la quest di riferimento» S1 (cassa) invece di
  goblin+rovine. **Non assorbito:** goblin è di fatto la quest che ha passato
  tutte le iterazioni S1 (R-089→R-104, fun audit, rework narrativo); cassa è
  esclusa perché usa `cha` (canale mock finché il Director non decide la
  derivazione reale). Il gate (b) si valuta su goblin come riferimento.
- **chatgpt:** il registro «riga ledger» in T-007 crea un contratto implicito
  sul registro narrativo (OPEN-016, fuori scope). **Parzialmente assorbito:**
  la riga resta solo come fatto di cronaca persistito (serve al reload e al
  POI che si chiude), non come entrypoint del registro narrativo.
- **deepseek:** collocazione di Gate B (playtest non-Director) non tracciata.
  **Registrato:** resta assegnata a PLAN-019 D-5 (battesimo PLAN-019-S4), non
  a questo slice.
