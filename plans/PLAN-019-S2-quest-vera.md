---
title: 'PLAN-019-S2 — La quest vera: POI reali → assegnazione → motore a grafo → conseguenze su /game'
status: draft
created: 2026-10-09
revised: 2026-10-09 (v2 — cold read multi-AI web r1: chatgpt + claude + grok + deepseek, 4× MAJOR REVISION → correzioni assorbite; gemini-web failed. Run `.mw/runs/20261009-plan-s2-web-critique/`. Disaccordi residui in fondo.)
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

## Task

Ogni task richiede lo stato garantito dal precedente.

- **T-001 — Registrazione decisioni (D-A…D-E CHIUSE 2026-10-09).**
  Spike-note D-2 (evidenza esistente, non nuovo lavoro), registrazione
  divergenza «regole non codice» in DECISION_LOG. Nessun codice.
- **T-002 — `QuestScenarioSchema` Zod + migrazione.** Schema in
  `balancing/config/idleVillage/quests/`; `goblin` e `rovine` migrati e
  validati; `QUESTS` legge via parse. **Test a due livelli:** (a) *parità
  strutturale* — deep-equal dei nodi pre/post migrazione con ordine di
  `options[]` verificato (il parse Zod non deve cambiare l'ordine di
  iterazione né la serializzazione dei flag); (b) *parità di traccia* — stesso
  seed, confronto della sequenza deterministica completa: nodi attraversati,
  opzioni offerte, verdetti, flag, consumi, transizioni di frontiera, stato
  finale — non solo l'outcome.
- **T-003 — Pipeline stats reali (D-C).** Config Zod `questMemberStats`:
  tabella di derivazione `LabStat → regola` (`{from:'damage'|'hp'|'hitChance'
  |'evasion'|'mock'|…, scale?}`, `mockChannel` sui canali mock) — unica fonte.
  Adapter `residentToQuestMember(resident)`: legge `statSnapshot` (StatBlock
  combat), applica la tabella, HP da config (regola in TUNE), portrait da
  `getResidentPortraitUrl`, ruolo dagli slot assegnati. `createRun`
  generalizzato a `{party, loadout, seed, clock}`; il path `presetId` resta
  per lab/MC. **Test di equivalenza:** un party costruito per riprodurre un
  preset deve produrre la stessa traiettoria del path `presetId` per N seed.
  **Check di calibrazione (non tuning):** con il party di riferimento reale
  (config), `simulateQuest` deve dare per ogni check una probabilità dentro la
  banda dichiarata in config; fuori banda = finding riportato al Director, non
  aggiustamento silenzioso.
- **T-004 — Item reali.** La sacca legge `questItems` (Zod, MP-02) invece dei
  flag mock `hasPozione`/ecc.; alias config mappa flag storici → item id.
  Lo stash picker (R-102) e il counterfactual consumabile della preview
  continuano a funzionare.
- **T-005 — `questPois` config + fascia.** Due POI (posizione, `questId`,
  `availableDays`); fascia di pericolosità **derivata** via `simulateQuest` su
  party di riferimento dichiarato in config (R-105: mai hardcoded). La fascia
  è **etichettata come ipotesi sul riferimento** nel detail («difficoltà
  stimata per un party di riferimento»), non come promessa sul party assegnato:
  il forecast vivo per-membro resta nella schermata di assegnazione (ibrido
  già ratificato in R-105). Test: la fascia cambia al cambiare dello scenario
  o del party di riferimento.
- **T-006 — Assegnazione giocatore + lancio dal POI (D-G).** Il detail della
  session esistente monta il `ResidentSlotRack` dello stack trusted: il
  giocatore assegna residenti **reali** dal roster via drag o click-to-assign
  (D-G: nessun party pre-assegnato). Le regole di eleggibilità quest vivono
  in `residentDropRules`/`statMatching` da config Zod: residente morto/in
  spedizione/ferito → `compatibilityState='invalid'` (grayscale,
  `aria-disabled`, drag soppresso — usa il meccanismo frozen, non una
  guardia nuova); ruoli obbligatori (leader, bodyguard se richiesto)
  validati, Embark disabilitato finché il party non è completo e valido.
  All'Embark: `residentToQuestMember` → `PartyMember[]` reali →
  `useQuestRun.start` → `QuestRunWindow` presenta (componente battezzato,
  D-F); la sessione POI **rilascia** il suo stato per quel POI (I-4). Chiudi
  ≠ ritirati resta vero; segnale bivio compatibile con PLAN-025 D-6.
  **Contratto congelato con PLAN-025:** firma `useQuestRun` + schema
  persistito concordati prima di questo task; se `ENGINE_SCHEMA_VERSION`
  cambia a metà slice, migrazione versionata dichiarata, non assorbita in
  silenzio. **E2E Playwright reale** (estende il pattern
  `poiQuestDetailRosterTimeClock.spec.ts` sul percorso `/game` vero, hook
  `__idleVillageTestHooks` dove la suite esistente li usa): bloom
  valid/invalid sugli slot mentre si trascina una PgCard reale, residente
  non eleggibile marcato `data-compatibility='invalid'` e non assegnabile,
  assegnazione riflessa nel detail (`[data-resident-id]` nello slot), Embark
  disabilitato a party incompleto.
- **T-007 — Settlement idempotente + tabella transizioni terminali.** Il
  settlement di una spedizione è una transizione persistente **idempotente
  chiavata su `runId`**: un solo write logico applica morti (→ residenti
  morti), ferite (→ downtime `InjuryEngine`), gold/loot (→ risorse), chiusura
  POI e riga ledger; l'esito applicato è marcato nella stessa scrittura
  (`settled: true` nel record persistito). Al boot, un run `ended` non marcato
  riapplica il settlement **una sola volta**. **Tabella delle transizioni
  terminali** (in spec, prima dell'implementazione): completato + leader vivo
  / completato + leader morto / ritirata al checkpoint / abbandono / scadenza
  dell'offerta — per ciascuna: stato finale del run, reward di quest
  (`objectiveSatisfied && leaderReturnedAlive`, v24 rev.2 — fuga con obiettivo
  fallito = bottino conservato, nessuna reward), trattamento del party,
  chiusura POI, riga ledger. **Test:** reload forzato prima, durante e dopo il
  writeback → conseguenze applicate una sola volta; caso «obiettivo fallito +
  leader vivo + fuga» → no reward di quest, sì bottino.
- **T-008 — Secondo POI end-to-end.** Rovine: stesso tubo, contenuto diverso.
  **E2E Playwright reale su `/game`** (non pagina lab): click POI → detail →
  drag PgCard reali → Embark → `QuestRunWindow` si apre sul primo bivio →
  scelta → run avanza → epilogo → settlement → il roster mostra il residente
  morto/ferito → reload a metà run → stessa frontiera. Entrambi i POI
  coperti.
- **T-009 — Artefatto PLAN-018 + docs.** Mappatura riusa/adatta/superato/manca
  (contratto S2); QUEST_RULES §modello aggiornato al grafo; CURRENT_STATE,
  INDEX, kanban, PLAN-019 (S2 avviato).
- **T-010 — Safeguard + acceptance + evidence.** `lint -- <scope>`,
  `test -- <scope>`, `build:check`, `kanban:lint`; harness playtest sui 2 POI;
  evidence `test-results/`.

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
