---
title: 'PLAN-019-S2.1 — Scenario quest canonico: schema Zod + migrazione goblin/rovine'
status: active
created: 2026-10-09
revised: 2026-10-09 (r1 figli: chatgpt+claude 2× MINOR REVISION → assorbito; run `.mw/runs/20261009-plan-s2-children/s2.1/r1/`. r2: claude MINOR → assorbito; chatgpt failed to load)
desiderata: v24 (PLAN-019, stadio S2), D-A (grafo di nodi canonico — Director 2026-10-09)
request: R-107
parent: PLAN-019-S2 (figlio 1/5)
related: questRun.ts (motore — INVARIATO, I-3), questS1Lab/*.ts (corpus authored), questBlueprints.schema.ts (busta offerta, ruolo ridotto)
---

# PLAN-019-S2.1 — Scenario canonico

## Perimetro

D-A (chiusa): il **grafo di nodi è il formato canonico** di esecuzione;
`QuestBlueprint` si riduce a busta offerta. Questo figlio promuove il modello
dati del motore a config-first: `QuestScenarioSchema` Zod in
`src/balancing/config/idleVillage/quests/`, con migrazione dei due scenari
dello slice (`goblin`, `rovine`) dai file TS authored del lab.

Il motore `questRun.ts` **non cambia** (I-3): lo schema specchia i tipi
esistenti `QuestNode`/`QuestOption`/`CombatSpec`/flag/harm come sono — stessi
campi, stessa semantica. Lo schema descrive il codice, non il contrario.

## Contratto dello schema

- `QuestScenarioSchema`: `{ id, title, scenarioVersion, offer, nodes }`.
- `scenarioVersion`: **questo figlio esporta `computeScenarioVersion(scenario)`**
  — hash di serializzazione canonica (chiavi ordinate, esclusi i campi di
  sola presentazione dichiarati) con test di stabilità su riordino chiavi.
  Scritta nel run alla creazione (S2.2 `createRun`), verificata al reload
  (S2.5) — entrambi **chiamano la funzione**, non reimplementano.
  Mismatch → run invalidato con messaggio, non catch-up silenzioso.
- `offer` = header POI/detail (sostituisce il ruolo dati di `QuestBlueprint`).
  **È contenuto nuovo, non 1:1** — regole esplicite di ownership (critica
  claude): (1) `offer.slots` **riusa il tipo requisito di `statMatching`**
  (allOf/anyOf/noneOf), non ne inventa un altro; (2) `dangerBandRef` è la
  banda nominale dichiarata per un **`offer.referenceParty` esplicito**
  (stat nel modulo scenario) — il test la ricalcola con seed fisso e N
  dichiarato, fallisce solo se la banda differisce di più di un gradino;
  probabilità entro ε dal confine → «borderline», non fail (critica r2);
  (3) `rewardBase` è **placeholder dichiarato** finché S2.3 non
  definisce `rewardTiers` — l'ownership dei valori è di S2.3, lo schema dei
  campi vive qui; (4) `slots: {required, optional}` tipizzati con ruoli.
- `nodes`: mappa `id → QuestNode` con tutti i kind attuali — stessi campi,
  stessa semantica. **Schema `.strict()`** su nodi/opzioni/harm/combat e
  **vietati `.default()`/`.transform()`/`.coerce()`** (Zod scarta le chiavi
  sconosciute in silenzio: la parità deep-equal confronta l'**oggetto TS
  originale vs output del parse**, non due output parsati) + **type-test
  `Equals<ZodInferred, QuestNode>` stretto** (non mutua assegnabilità) —
  guardrail che rompe la build se il tipo del motore cambia senza aggiornare
  lo schema (critica r2).
- **Integrità referenziale del grafo** (superRefine/validatore nel parse):
  ogni target di opzione/`CHECK:` esiste; ogni nodo raggiungibile dallo
  start; ogni cammino termina in un `end`; `requiresFlag`/`consumesFlag`
  hanno un `sets` a monte. Test negativi con scenari rotti.
- **Coerenza `offer`↔`nodes`** (critica r2 — l'offer è contenuto nuovo,
  non coperto dalla parità): ogni stat richiesta da un check raggiungibile
  è coperta da almeno uno slot; il numero di slot `required` copre la
  dimensione di party attesa dal motore; ogni `statMatching` è parsabile.
  Test negativi con offer incoerenti.
- Registry: `QUESTS` passa a `parse` dei moduli `questScenarios.<id>.ts`.
  **Oracolo frozen** (critica r2 — risolve l'ambiguità «eliminato o
  re-esporta»): prima della migrazione si committa una **fixture
  serializzata** dei due scenari originali + tracce Monte Carlo; la parità
  confronta il parse **contro la fixture**, non contro un secondo file
  vivo; dopo il merge il file lab viene eliminato e la fixture resta come
  regression test permanente.
- i18n: le stringhe authored restano nei contenuti — **la forma di testo
  (stringa letterale vs chiave) si decide in questo schema**, perché S2.4
  ci costruisce sopra: decisione registrata qui, non rinviata (critica
  r2). Default: stringa letterale italiana nel contenuto authored, chiavi
  i18n solo per la superficie UI (S2.4).

## Task

- **T-1 — `QuestScenarioSchema` + `offer` header.** Schema Zod + tipi
  derivati; documentazione JSDoc su ogni campo nuovo.
- **T-2 — Migrazione `goblin`.** Modulo config authored + `QUESTS` via parse.
- **T-3 — Migrazione `rovine`.** Idem. `cassa` resta nel lab (usa `cha`,
  fuori slice).
- **T-4 — Parità contro fixture + copertura garantita** (riformulato,
  critica r2). (a) *strutturale*: `toStrictEqual` (distingue `undefined` da
  chiave assente) parse vs fixture, ordine `options[]` verificato; (b) *di
  traccia*: Monte Carlo seeded a politica uniforme, N≥1000, traccia
  deterministica completa vs fixture; (c) *copertura garantita in due
  modi*: (1) **enumerazione statica** dei cammini ammissibili (DFS con
  stato dei flag) produce la lista di (nodo, opzione) da visitare; (2) per
  ogni elemento non raggiunto dal Monte Carlo uniforme si genera una
  **traccia mirata** (policy guidata, seed fisso) confrontata vs fixture;
  un elemento non raggiungibile da nessuna policy = test fallito e
  dichiarato; (d) *analisi esatta*: simulazioni per-check di
  `questSimulation.ts` pre/post; (e) *coerenza offer↔nodes* e test
  negativi come da contratto.
- **T-5 — Safeguard + evidence** (`lint/test/build:check/kanban:lint`,
  `test-results/`).

## Fuori scope

Generazione/DSL di scenari (S5) · migrazione `cassa` · cambi di contenuto o
bilanciamento degli scenari (la migrazione è 1:1) · qualunque modifica al
motore.

## Acceptance

1. `goblin` e `rovine` girano identici da config Zod: parità strutturale e
   di traccia verdi su N seed.
2. La parità confronta il parse con la **fixture committata** (non un
   file vivo); il file lab dei due scenari migrati è eliminato dopo il
   merge e la fixture resta in CI.
3. Nessun valore duplicato fuori dai moduli config; `QUESTS` validato a
   boot.
4. Safeguard verdi + evidence log.

## Stato implementazione (2026-10-09)

**Completato.** `QuestScenarioSchema` strict + integrità grafo + coerenza
offer↔nodes + `computeScenarioVersion` (hash canonico a chiavi ordinate,
esclusi i soli campi presentazione dichiarati, export consumato da S2.2/S2.5)
+ guardrail `Equals<>`; `goblin`/`rovine` migrati 1:1 in
`src/balancing/config/idleVillage/quests/scenarios/`; `QUESTS` legge il
config (motore invariato, I-3); file lab eliminati; preset estratti in
`questLabPresets.ts`. Suite unica `questScenarioConfig.test.ts` (14 test)
su due livelli di fixture:

- **Oracolo di migrazione** `tests/fixtures/idleVillage/quests/
  {id}.oracle.json` — oggetti authored + 1000 digest di traccia MC
  estratti da `git show HEAD:` dei moduli lab eliminati
  (`scripts/generate-quest-scenario-fixture.mts`; solo re-baseline
  intenzionale). Parità `toStrictEqual` grafo/meta/presets + digest
  per-seed riprodotti sulla config migrata.
- **Pin di regressione** `{id}.{coverage,checks}.json` —
  (`UPDATE_QUEST_FIXTURES=1`): witness replay deterministico +
  enumerazione statica dichiarata ⊆ dinamica
  (`questScenarioExplorer.ts`), `analyzeCheck` per-check.

Contratti ulteriori: wiring `QUESTS`↔config (stesso oggetto), calibrazione
`dangerBandRef` su `referenceParty` simulato (N=2000, seed 777, tabella
provvisoria ±1 grado + ε-borderline non-fail — S2.3 la sostituisce con
`dangerBands` canonici), parsabilità `statMatching`.

Safeguard verdi — evidence `test-results/s21-scenario-canonico-2026-10-09.log`.
