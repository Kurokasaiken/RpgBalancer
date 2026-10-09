---
title: 'PLAN-019-S2.3 — Offerta POI: questPois config, bande pericolo/reward, resolveQuestOffer + world-scaling'
status: proposed
created: 2026-10-09
revised: 2026-10-09 (r1 figli: claude+chatgpt 2× MAJOR → assorbito. r2: claude MINOR → assorbito, chatgpt failed to load; run `…/s2.3/r2/`)
desiderata: v24 (PLAN-019, stadio S2), D-H (planning surface), D-I (world-scaling — Director 2026-10-09), R-105 (bande pericolo)
request: R-107
parent: PLAN-019-S2 (figlio 3/5)
related: simulateQuest (Monte Carlo — esiste), questPoiSession, TimeEngine (daysPlayed reale), equipmentStorage/heroItems (avgEquipPower), useQuestAssignmentPreview
---

# PLAN-019-S2.3 — Offerta e world-scaling

## Perimetro

Il POI prende i valori dalla config corretta (D-H) e pericolo/reward passano
da un punto unico di risoluzione con modificatori esterni — tra cui il primo
**world-scaling reale** (D-I). Niente UI in questo figlio: produce i dati
che S2.4 mostra.

## Pezzi

### `questPois` config (Zod)

`{id, x, y, questId, availableFromDay/availableUntilDay (giorni TimeEngine —
semantica dichiarata: finestra di apertura dell'offerta), estimatedDurationTicks,
slots: {required[], optional[]}}` — due POI dello slice (goblin, rovine).
**Ruolo della durata deciso** (critica r2 — «display-only» contraddice D-K
che la usa per le finestre dei nodi): `estimatedDurationTicks` è **normativo** —
è la durata totale su cui D-K calcola le finestre e l'halo di D-J; entra in
`resolvedOffer`/`scenarioHash` e la coerenza vs somma transit/costDays è
testata con tolleranza dichiarata. Il coordinamento definitivo con lo
schedule dei nodi è nello spike T-0 di S2.4.

### Due uscite distinte (critica r1 — non confondere)

- **`offerBand`** (metadato POI): fascia **derivata** via `simulateQuest` su
  party di riferimento dichiarato in config, **etichettata «ipotesi sul
  riferimento»** — mai riutilizzata come stima del party corrente né come
  input della preview live. **Il party di riferimento è una fixture
  dichiarata** (critica r2 — D-G vieta party pre-assegnati, e le sue stat
  sono di fatto authored a mano: va detto, non nascosto) con
  `referenceHash` sulla versione della tabella `questMemberStats` di S2.2 —
  se la scala cambia, il test che ricalcola la banda **fallisce** invece di
  lasciarla stantia. Preferenza: banda calcolata a build/test-time, non
  valore salvato.
- **`estimateForParty(resolvedOffer, party)`** → `incomplete | {bands, nSim}`:
  la funzione che S2.4 chiama a ogni cambio di assegnazione; gira sullo
  **stesso `ScenarioInstance`** del run — è il dato di planning, non la
  fascia statica.

### `resolveQuestOffer(offer, modifiers)` — il «constructor»

Punto unico di risoluzione. Tipi Zod distinti: `AuthoredOffer` → `Modifiers`
→ `ResolvedOffer`. `modifiers` = bag di input esterni. **Applicazione dello
scale** (risposta a «come agisce `dangerScale` con motore invariato»):
`resolveQuestOffer` produce uno **`ScenarioInstance`** = scenario S2.1 +
trasformazione pura dichiarata su **whitelist esplicita** (critica r2):
campi scalabili = `risk`/`stats`/`combat` con clamp; **esclusi**:
`costGold`/`grantsGold` (l'economia interna della run non si sposta),
`harm`/`upfrontDamage`, nodi `end`/`info`. La **validazione semantica di
S2.1 gira anche sull'istanza agli estremi di scala** — uno scaling che
rende un check ~0/~1 può alterare la raggiungibilità di un ramo, e la
validazione sullo scenario base non la copre. **`simulateQuest` e
`createRun` consumano ESATTAMENTE quell'istanza** — simulazione e run
reale non possono divergere, e la parità di S2.1 resta intatta (l'istanza
identity-scale ≡ scenario originale).

**Momento di risoluzione** (critica r2): `resolveQuestOffer` è invocato
**una volta all'apertura del detail** — snapshot dei segnali con
`daysPlayed` fissato; lo **stesso `ResolvedOffer` alimenta
`estimateForParty` e viene congelato all'invio** (la stima mostrata e il
run reale non possono divergere); se `daysPlayed` cambia a detail aperto
si ri-risolve **solo su evento esplicito** con avviso UI. Test: il
`resolvedOffer` congelato all'invio è **byte-identico** a quello
dell'ultima stima.

I valori risolti **si congelano nel record persistito del run**:
`resolvedOffer: {offerSchemaVersion, scenarioHash, scales, bandIds,
signals, rewardResolved}` — **`rewardResolved` è il valore assoluto
(intero) della reward nominale già risolta** (critica r2 — senza, S2.5
dovrebbe ricalcolarla dalla config corrente e la congelatura diventa una
facciata); arrotondamento dichiarato. Un run attivo usa **solo** il
resolvedOffer salvato, mai la config corrente; record legacy = migrazione/
default dichiarato; test reload con config modificata.

### `worldScaling` v0 (D-I — sostituibile come unità)

`collectWorldProgressSignals()` → segnali → config `worldScaling` (Zod, per
ogni segnale: normalizzazione + dominio + peso + comportamento fuori-dominio
+ default) → `{dangerScale, rewardScale}` nel bag.

| Segnale | Fonte | Stato v0 |
|---|---|---|
| `daysPlayed` | TimeEngine (day index) | **reale — unico segnale nello schema v0** |

**Segnali futuri (nota, non schema)** (critica r2 — campi a peso 0 sono
schema morto da testare/migrare senza beneficio): `avgHeroPower` (power
metric canonica su `statSnapshot` dell'intero roster — non il party) e
`avgEquipPower` (`equipmentStorage`/`heroItems`) si aggiungono allo
schema **quando esiste la metrica**, con `offerSchemaVersion`
incrementato. FACT: equip non modifica le stat combat oggi (S2.2).

**Contratto pubblico minimo (stabile anche se la formula cambia):**
`dangerScale`/`rewardScale` ∈ intervallo dichiarato in config (clamp),
monotoni nel segnale, identità (1.0) a segnali assenti, direzione
dell'effetto dichiarata, fallback a valori neutri. Formula e sorgenti =
unità sostituibile; semantica e invarianti del contratto **non** cambiano
senza versione esplicita. Test: monotonicità, confini, valori mancanti,
determinismo. **Test estremi falsificabile** (critica r2): `daysPlayed ∈
{0, max-dominio, oltre-dominio}` → la banda derivata resta in
`dangerBands` e il caso fuori-dominio applica il **clamp dichiarato** (mai
«o viene segnalata» — un test che passa in entrambi i casi non testa);
il test multi-segnale arriva quando i segnali sono operativi.

### `rewardTiers` (nuovo schema Zod)

Tier = funzione della **sola reward di quest nominale** dopo `rewardScale`
(«reward di quest se completata» — mai tier sul bottino intermedio, che è
condizionale per v24 rev.2). `rewardBase` authored per POI + trasformazione
+ limiti; **soglie dei tier a intervalli semiaperti documentati** con
regola di rounding/clamp ai confini (critica r2 — un `rewardScale` 1.0 vs
1.01 non deve far saltare il tier in modo indefinito); il settlement usa
**la stessa `rewardResolved` congelata nel run** — il tier è
rappresentazione, non seconda fonte. Chiavi i18n nello schema, non
stringhe.

## Stato implementazione (2026-10-09 — commit su main)

- **T-1 FATTO** — `questPois.ts`: `QuestPoiSchema` strict + `QUEST_POIS`
  (poi-goblin 10t×25n=250t, poi-rovine 10t×10n=100t, finestre [0,60) day
  index, slot-partizione per id ⊆ `offer.slots`) + `DANGER_BANDS` canonico
  + `dangerBandFor` (ownership promossa dalla tabella provvisoria del test
  S2.1, che ora importa da qui).
- **T-2 FATTO** — `deriveOfferBand` (sim `referenceParty` sull'istanza →
  `dangerBandFor`, «ipotesi sul riferimento») + `estimateForParty` →
  `incomplete | {sim, bands.danger(party), nSim}` sullo stesso
  ScenarioInstance.
- **T-3 FATTO** — `rewardTiers.ts`: tier su reward nominale risolta
  (`resolveReward` = Math.round dichiarato), intervalli semiaperti,
  confine → tier superiore, chiavi i18n.
- **T-4 FATTO** — `questOffer.ts`: `resolveQuestOffer` →
  `{resolvedOffer: ResolvedOfferRecord, instance: ScenarioInstance}`;
  transform whitelist r2 (check.risk + combat enemies/hitDamage; stats
  categorico no-op dichiarato; economia/harm/upfrontDamage/end/info
  esclusi). Engine: registry istanze (`qsi-<fnv>` content-addressed),
  `nodesFor`/`createRun`/`simulateQuest` su istanza; `QuestRunSave` porta
  lo ScenarioInstance congelato — reload mai su config corrente; fallback
  authored-map = migrazione legacy dichiarata. Estremi di scala
  ri-validati da `QuestScenarioSchema` (test).
- **T-5 FATTO** — `worldScaling.ts` v0: unico segnale `daysPlayed` reale
  (`collectWorldProgressSignals` legge `currentDay` dello store canonico);
  clamp fuori-dominio falsificabile; assenti → identità.
- **T-6 FATTO** — `questOffer.test.ts` 28 + scope quest 139/139 su 10
  file, build:check ✓, kanban:lint ✓, lint n/a (quarantena).
  Evidence: `test-results/s23-offerta-scaling-2026-10-09.log`.

**Finding registrato:** su goblin il canale pericolo scalabile è solo
`combat` (check `risk` authored 0/0; `upfrontDamage` escluso per
contratto r2) — `dangerScale` goblin = leva parziale reale; estendere a
`TUNE`/harm richiede una revisione della whitelist = decisione Director.
Valori bande/scaling/tier = first-pass (numeri: R-105/gate Director).

## Task

- **T-1 — `questPois` schema + 2 POI authored** (goblin, rovine; unità e
  semantica dei campi tempo dichiarate).
- **T-2 — `offerBand` + `estimateForParty`.** Fascia derivata via
  `simulateQuest` su party di riferimento + etichetta «ipotesi sul
  riferimento»; la funzione di stima live che S2.4 consuma.
- **T-3 — `rewardTiers` schema** (tier su reward di quest nominale, chiavi
  i18n).
- **T-4 — `resolveQuestOffer` → `ScenarioInstance` + congelamento.**
  Trasformazione pura dichiarata con clamp; `simulateQuest`/`createRun`
  sulla stessa istanza (test: stessa distribuzione); `resolvedOffer`
  persistito nel run con versioni; migrazione legacy; test reload con
  config modificata.
- **T-5 — `collectWorldProgressSignals` + `worldScaling` config.** v0:
  **solo `daysPlayed`** reale nello schema; hero/equip power = segnali
  futuri in nota (si aggiungono con `offerSchemaVersion` incrementato
  quando esiste la metrica). Test: monotonicità, confini, valori mancanti,
  determinismo, clamp fuori-dominio falsificabile.
- **T-6 — Safeguard + evidence.**

## Fuori scope

UI di presentazione (S2.4) · reward variabili by-party (hook
`rewardPreview`, futuro) · calibrazione letalità R-105 (la fascia sì, i
numeri no) · sorgenti di scaling oltre i 3 segnali (edifici, eventi —
arrivano nel bag quando esistono).

## Stato implementazione (2026-10-10 — in working tree, non committato)

- **T-1 FATTO** — `quests/questPois.ts`: `QuestPoiSchema` strict (finestra
  day-index, `estimatedDurationTicks` normativo = `ticksPerNode ×
  expectedPathNodes` con refine, slots = partizione per id di
  `offer.slots`); `QUEST_POIS` poi-goblin (250t)/poi-rovine (100t);
  **DANGER_BANDS canonico** + `dangerBandFor` (promosso dalla tabella
  provvisoria del test S2.1 — ora importato da qui).
- **T-2 FATTO** — `questS1Lab/questOffer.ts`: `deriveOfferBand` (sim
  `referenceParty` → banda, marcata «ipotesi sul riferimento») +
  `estimateForParty` → `'incomplete' | {sim, bands.danger(party), nSim}`
  sullo stesso `ScenarioInstance` del run.
- **T-3 FATTO** — `quests/rewardTiers.ts`: tier su reward nominale,
  intervalli semiaperti (confine → tier alto), `resolveReward` =
  `Math.round(base×scale)` clamp ≥0, chiavi i18n.
- **T-4 FATTO** — `resolveQuestOffer(poi,{signals?,bandSim?})` →
  `{resolvedOffer, instance}`: `createScenarioInstance` con `instanceId`
  content-addressed `qsi-<fnv>`; whitelist r2 in `transformScenarioNodes`
  (check.risk/combat.enemies+hitDamage scalati, economia/harm/
  upfrontDamage esclusi, stats = no-op categorico dichiarato);
  `QuestRunState += scenarioInstanceId/resolvedOffer`, `nodesFor` risolve
  l'istanza, `createRun` object-form accetta `scenarioInstance`+
  `resolvedOffer`; `useQuestRun` persiste l'istanza nel save e la
  re-registra al reload PRIMA di `setRun`.
- **T-5 FATTO** — `quests/worldScaling.ts`: v0 unico segnale reale
  `daysPlayed` (domain [0,30], clamp); output `dangerScale` [1.0,1.4] e
  `rewardScale` [1.0,1.25] increasing; identità a segnali assenti.
  `collectWorldProgressSignals` legge `currentDay` dallo store canonico.
- **T-6 FATTO** — `questOffer.test.ts` 28/28; scope quest **159/159**;
  `build:check` ✓, `kanban:lint` ✓, lint n/a (quarantena). Evidence:
  `test-results/s23-offerta-scaling-2026-10-09.log`.

**Findings aperti (dall'evidence):** goblin danger-channel stretto
(dangerScale agisce solo su enemies/hitDamage dei combat — i check goblin
hanno risk 0/0 authored; estendere a TUNE/harm = decisione Director);
valori bande/scaling/tier = first-pass (calibrazione numerica = R-105);
posizioni/finestre POI = placeholder authored.

## Acceptance

1. I due POI esistono in config con tutti i valori risolti da schema, nessun
   hardcode.
2. Fascia pericolo derivata (non hardcoded) e marcata come ipotesi sul
   riferimento; reward espresso in tier da config.
3. `resolveQuestOffer` produce offer risolta con scale dal world-scaling;
   i valori entrano congelati nel run.
4. `worldScaling` è una funzione/config sostituibile come unità; segnali
   mancanti elencati come mock-hook nell'evidence.
5. Safeguard verdi + evidence log.
