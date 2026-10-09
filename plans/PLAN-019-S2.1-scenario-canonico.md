---
title: 'PLAN-019-S2.1 — Scenario quest canonico: schema Zod + migrazione goblin/rovine'
status: draft
created: 2026-10-09
revised: 2026-10-09 (r1 figli: chatgpt+claude 2× MINOR REVISION → assorbito; run `.mw/runs/20261009-plan-s2-children/s2.1/r1/`)
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
- `scenarioVersion`: versione/hash del contenuto **scritta nel run alla
  creazione** e verificata al reload — mismatch → run invalidato con
  messaggio, non catch-up silenzioso su uno scenario diverso (handoff
  esplicito: la scrittura nel run è di S2.2 `createRun`, la verifica al
  reload è del settlement S2.5).
- `offer` = header POI/detail (sostituisce il ruolo dati di `QuestBlueprint`).
  **È contenuto nuovo, non 1:1** — regole esplicite di ownership (critica
  claude): (1) `offer.slots` **riusa il tipo requisito di `statMatching`**
  (allOf/anyOf/noneOf), non ne inventa un altro; (2) `dangerBandRef` è
  **validato in test** contro la banda derivata via Monte Carlo (fallisce se
  discorda); (3) `rewardBase` è **placeholder dichiarato** finché S2.3 non
  definisce `rewardTiers` — l'ownership dei valori è di S2.3, lo schema dei
  campi vive qui; (4) `slots: {required, optional}` tipizzati con ruoli.
- `nodes`: mappa `id → QuestNode` con tutti i kind attuali — stessi campi,
  stessa semantica. **Schema `.strict()`** su nodi/opzioni/harm/combat e
  **vietati `.default()`/`.transform()`/`.coerce()`** (Zod scarta le chiavi
  sconosciute in silenzio: la parità deep-equal confronta l'**oggetto TS
  originale vs output del parse**, non due output parsati) + test di tipo
  che lo schema inferito sia mutualmente assegnabile a `QuestNode`.
- **Integrità referenziale del grafo** (superRefine/validatore nel parse):
  ogni target di opzione/`CHECK:` esiste; ogni nodo raggiungibile dallo
  start; ogni cammino termina in un `end`; `requiresFlag`/`consumesFlag`
  hanno un `sets` a monte. Test negativi con scenari rotti.
- Registry: `QUESTS` passa a `parse` dei moduli `questScenarios.<id>.ts`.
  **Fonte unica dichiarata**: dopo la migrazione il modulo config **è** la
  fonte — il file lab è eliminato o re-esporta dal config; il test di
  parità resta in CI permanente finché esistono due copie. Lo scambio
  effettivo del registry avviene in questo figlio (T-2/T-3).
- i18n: le stringhe authored restano nei contenuti (i18n della *superficie*
  è S2.4); lo schema non impone una forma di testo.

## Task

- **T-1 — `QuestScenarioSchema` + `offer` header.** Schema Zod + tipi
  derivati; documentazione JSDoc su ogni campo nuovo.
- **T-2 — Migrazione `goblin`.** Modulo config authored + `QUESTS` via parse.
- **T-3 — Migrazione `rovine`.** Idem. `cassa` resta nel lab (usa `cha`,
  fuori slice).
- **T-4 — Test di parità a due livelli + copertura.** (a) *strutturale*:
  deep-equal **oggetto TS originale vs output del parse**, ordine di
  `options[]` verificato; (b) *di traccia*: **Monte Carlo seeded con
  politica casuale uniforme sulle opzioni offerte, N≥1000 per scenario**,
  confronto della sequenza deterministica completa (nodi, opzioni, verdetti,
  flag, consumi, frontiere, stato finale); (c) *copertura*: asserisce che
  **ogni nodo e ogni opzione** di goblin/rovine è attraversato almeno una
  volta — un elemento irraggiungibile = test fallito e dichiarato (i rami
  `requiresInfo`/`requiresFlag`/flag mai attraversati sono esattamente dove
  un campo perso dal parse si nasconde); (d) *analisi esatta*: confronto
  delle simulazioni per-check di `questSimulation.ts` pre/post migrazione.
- **T-5 — Safeguard + evidence** (`lint/test/build:check/kanban:lint`,
  `test-results/`).

## Fuori scope

Generazione/DSL di scenari (S5) · migrazione `cassa` · cambi di contenuto o
bilanciamento degli scenari (la migrazione è 1:1) · qualunque modifica al
motore.

## Acceptance

1. `goblin` e `rovine` girano identici da config Zod: parità strutturale e
   di traccia verdi su N seed.
2. Il lab S1 continua a funzionare (preset path intatto).
3. Nessun valore duplicato fuori dai moduli config; `QUESTS` validato a
   boot.
4. Safeguard verdi + evidence log.
