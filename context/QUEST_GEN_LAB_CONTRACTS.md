---
title: Quest Gen Lab — Contracts audit (SP-1)
type: contracts-audit
status: ratified — Director ruling 2026-10-23 (gate T-2: doc + DIAGNOSTIC_GATE_IDS tuple approvate)
created: 2026-10-23
plan: PLAN-029 SP-1 (artifact r003) + emendamenti ratifica AMEND-2(a) (PLAN-029 §7)
related: plans/PLAN-029-quest-gen-lab-operativa.md, plans/PLAN-029-SP-1-contracts-audit.md,
         context/QUEST_GENERATION_CONTRACTS.md, context/QUEST_AUTHORING_PLAYBOOK.md
---

# QUEST GEN LAB — Contracts audit

Audit dei contratti che il lab di generazione consuma. **SP-1 congela
contratti; non aggiunge capability.** Scopo: prevenire seam drift,
diagnostic laundering, receipt rot. Ogni claim è etichettato
VERIFIED / PROPOSED / RATIFIED / OPEN con sorgente — i contratti non
testati non sono mai "verified".

## 1. Purpose, scope, authority, non-goals

- **Scope**: le superfici che W2–W6 comporranno — generatori gimmick,
  schema scenario, engine run, simulatore, persistenza, catalogo baked,
  validator journey (AMEND-2a), provenienza per-entry (AMEND-2a).
- **Non-goals**: nessun codice di runtime (kitSchemas/canonicalize/
  registry sono T-3…T-7 dopo ratifica); nessun cambio ai generatori,
  allo schema, al catalogo; nessuna UI.
- **Autorità**: questo doc è il contract-of-record per PLAN-029 v1;
  divergenze scoperte in implementazione si registrano come revisione.

## 2. Evidence ledger

| # | Claim | Status | Source |
|---|---|---|---|
| L-01 | `generateRaceScenario(kit: RaceDomainKit, tuning?: Partial<RaceTuning>): QuestScenario` — sincrono, self-parsing via `parseQuestScenario` (throw su violazione contratto) | VERIFIED | `generation/raceGimmick.ts:119` |
| L-02 | `generateFloodVault(kit: FloodDomainKit, tuning?: Partial<FloodTuning>): QuestScenario` — stessa forma | VERIFIED | `generation/floodVault.ts:112` |
| L-03 | Merge tuning = `{...DEFAULT_TUNING, ...partial}` — spread JS: chiavi **undefined esplicite** sovrascrivono i default (caveat authoring: i drawer non devono emettere chiavi a undefined) | VERIFIED | `raceGimmick.ts:123`, `floodVault.ts:113` |
| L-04 | `RACE_DEFAULT_TUNING = {goal:6, twistChance:50, twistRearmChance:60}`; `FLOOD_DEFAULT_TUNING = {limite:8, uscitaGoal:5, madreChance:50, pareteChance:35}` — interi percentuali; frazioni non attestate | VERIFIED | `raceGimmick.ts:104`, `floodVault.ts:93` |
| L-05 | `RaceDomainKit.copy: Record<RaceNodeKey(14), RaceNodeCopy>` esaustivo a compile-time; `FloodDomainKit.copy: Record<FloodNodeKey(16), FloodNodeCopy>` idem + `loot{pezzo,cassa,madre,lingotto}` + `intelId` | VERIFIED | `raceGimmick.ts:30-75`, `floodVault.ts:29-67` |
| L-06 | `LocalizedRaceDomainKit`/`LocalizedFloodDomainKit` = wrapper `{en,it}` — variante di kit distinta dalla forma flat | VERIFIED | `raceGimmick.ts:79`, `floodVault.ts:74` |
| L-07 | Kit baked: `PASSO_MONTANO_KIT`, `PALUDE_KIT` (race flat), `MINIERA_FLOOD_KIT` (flood flat), `MARE_FLOOD_KIT` (flood flat, narrated), `MINIERA_RACE_KIT` (**localized** `{en,it}`, narrated) | VERIFIED | `generation/kits.ts`, `floodMiniera.ts`, `narrated/flood-mare.kit.ts:16`, `narrated/race-miniera.kit.ts:292` |
| L-08 | `GENERATED_CATALOG` = `Record<string, QuestScenario>` keyed by id — **8 entry**: 5 gimmick-generate + 3 authored-literal (impr002 palude/mare/miniera); nessun count hard-coded | VERIFIED | `generation/catalog.ts:38` |
| L-09 | Gli scenari imprint-compiled sono **literal authored TS** (`*_SCENARIO_AUTHORED`) passati per `parseQuestScenario` — NON esiste un compilatore a runtime; la "compilazione" è avvenuta a tempo di authoring | VERIFIED | `impr002Palude.ts:826`, `impr002Mare.ts:870`, `impr002Miniera.ts:921` |
| L-10 | `QuestNode.fase?: 'andata'|'svolgimento'|'ritorno'` opzionale (absent=svolgimento); i generatori race/flood **non** emettono `fase` | VERIFIED | `questScenario.schema.ts:368`, raceGimmick/floodVault (grep) |
| L-11 | `validateQuestJourneyDag(input: JourneyDagInput): JourneyDagReport{errors,warnings}` — valida coppia scenario×config-POI (`fasi{pins,travelDays}`, `nodeTicks`, `ticksPerDay`, `edges` da `probeQuestJourneyEdges`); consumata a launch (`useQuestExpeditionSession`); **non** in `superRefine` | VERIFIED | `src/ui/idleVillage/quests/questJourneyAuthoring.ts:42,97`; consumer `useQuestExpeditionSession` |
| L-12 | `QuestPoi.fasi?: QuestJourneyFasi` — assenza = sentinel legacy (`journeyFasiOf(poi)===null`) | VERIFIED | `questPois.ts:88-192` |
| L-13 | Engine surface: `createRun` (overloads), `applyChoice`, `previewOption` in `questRun.ts`; `simulateQuest(state,strategy)` sync + `simulateQuestAsync(state,strategy,{runs,seed,chunkRuns,signal,onChunkTiming})` — chunk ≤50ms via `yieldToEventLoop`, `signal.throwIfAborted()` | VERIFIED | `questRun.ts:921,1796,2911`; `questSimulation.ts:708,749` |
| L-14 | `ScenarioInstance{instanceId,questId,scenarioHash,nodes,startNode?,armRolls?,initialVars?,primaryStats?}`; registry in-mem `registerScenarioInstance` idempotente | VERIFIED | `questRun.ts:100,130` |
| L-15 | `LabMember{id,name,stats,role('leader'|'member'|'bodyguard'),hp?,portrait?,traits?}`; `PartyPreset{id,label,description,gold,members}` | VERIFIED | `questScenario.ts:633,652` |
| L-16 | `computeScenarioVersion(scenario)` = `qsv1-<fnv1a32(JSON.stringify(canonicalize(s)))>` — canonicalize **privato** (chiavi `.sort()` = UTF-16 code-unit, droppa `PRESENTATION_KEYS` + `undefined`); fnv1a è il digest in-repo (browser+test, no crypto dep) | VERIFIED | `questScenario.schema.ts:845-877` |
| L-17 | `PRESENTATION_KEYS` esiste come set chiuso (title/body/copy/log/label/detail/objective/tags/beats/intelLabels/epilogue/statHint/requirementLabel/name/portrait/description/coverArt/dispatch/verdictFlavor/…) — reskin-safe digest | VERIFIED | `questScenario.schema.ts:820-844` |
| L-18 | `QUEST_TRAITS` = registry chiuso `Record<string,QuestTrait>`; lo schema rifiuta trait non registrati | VERIFIED | `questTraits.ts:42`, schema:651,713 |
| L-19 | `PersistenceService` = async `saveData/loadData/clearData/listPersistedKeys`; backend Tauri FS + fallback localStorage; **limiti di quota non documentati nel modulo** | VERIFIED (api) / OPEN (limiti) | `PersistenceService.ts:153,204,286,328,178` |
| L-20 | `validateCopy`/`arcContract`/`narrationPrompt`/`sceneBrief`/`domainVocabs` — pipeline copy consumata solo dentro `generation/narrative/` + `narrated/`; contratto separato dallo scenario-graph | VERIFIED | `generation/narrative/` (grep consumers) |
| L-21 | `exploreScenarioGraph` (probe di certezza) e `deriveOfferBand` esistono come superfici diagnostiche/calibrazione | VERIFIED | `questCertainty.ts:142`, `questOffer.ts:199` |
| L-22 | Gate "hook ≥75%" **non ha implementazione** — è una regola proposta (QUEST_GENERATION_SPEC); nessun checker nel codice | OPEN | assenza in `src/` (grep) |
| L-23 | DomainVocab dichiara "hard coherence rules" (mayInvent/vietati) ma **nessun validator kit↔vocab standalone** esiste — la coerenza è esercitata dentro validateCopy | VERIFIED | `domainVocabs.ts:32` |
| L-24 | `DIAGNOSTIC_GATE_IDS` — la tupla dei gate diagnostici del lab è il deliverable di questo audit (§6 proposta) → **decisione T-2 Director** | OPEN | questo doc §6 |
| L-25 | `generatorVersion` / `schemaVersion` / `engineVersion` — nessuna costante esistente nel repo; ownership da fissare (§11) | OPEN | assenza in `src/` (grep) |

## 3. Generator contracts

Entrambi i generatori: input `(kit, tuning?)`, output `QuestScenario`
già parsato (il generatore "mangia il proprio contratto": grafo o goto
rotti → throw a generazione). Deterministici dati (kit, tuning): niente
random interno osservato — i twist si armano a runtime via `armRolls`.

| Generatore | Kit type | Tuning type | Defaults | Merge |
|---|---|---|---|---|
| `generateRaceScenario` | `RaceDomainKit` (+`LocalizedRaceDomainKit` variant) | `Partial<RaceTuning>` | `RACE_DEFAULT_TUNING` | `{...default, ...partial}` |
| `generateFloodVault` | `FloodDomainKit` (+`LocalizedFloodDomainKit`) | `Partial<FloodTuning>` | `FLOOD_DEFAULT_TUNING` | `{...default, ...partial}` |

**Merge semantics (parte del contratto, coperta da `generatorVersion`):**
spread JS — una chiave `undefined` esplicita **sovrascrive** il default.
Corollario authoring: i drawer devono emettere chiavi assenti, non
chiavi a `undefined`; `stripUndefinedDeep` (T-3) esiste anche per questo.

## 4. Input schemas & type ownership

- Source of truth authoring-boundary: **Zod schemas** (T-4), da cui
  `z.infer` aliases; le interface TS esistenti restano il contratto
  runtime del generatore — check di compatibilità bidirezionale in test.
- `copy` = `z.object` esaustivo sulle chiavi-nodo (`RaceNodeKey`×14,
  `FloodNodeKey`×16) con strict leaves; variante flat + localized
  `{en,it}` per i kit narrated (L-06/L-07).
- Tuning: schema completo (per `defaultTuning` nel drawer) + partial
  input schema; bounds interi-percentuali dai default (L-04) —
  le frazioni non sono attestate dai default → il doc le marca
  **non-verificate** finché un generatore non le consuma esplicitamente.
- Nessun cross-field superRefine sui kit schema (strutturale soltanto).

## 5. Engine & persistence surface (audit-only)

| Simbolo | Ruolo | Note |
|---|---|---|
| `createRun` | run init (overloads: scenario/questId) | firme stabili da PLAN-053 (additive) |
| `applyChoice` | apply opzione/verdetto | invariato |
| `previewOption` | preview esatta opzione | invariato |
| `simulateQuest` / `simulateQuestAsync` | MC sync/async | async: `{runs,seed,chunkRuns,signal,onChunkTiming}`; abort via `throwIfAborted`; yield ≤50ms |
| `LabMember`/`PartyPreset` | party lab | traits string[] gate opzioni/twist |
| `ScenarioInstance` + `registerScenarioInstance` | istanza congelata | registry in-mem, idempotente; `scenarioHash` già campo |
| `computeScenarioVersion` | digest contenuto | `qsv1-fnv1a32` — **owner esistente di scenarioHash** (§11) |
| `PersistenceService` | save/load | async; Tauri FS → localStorage fallback; **quota limits OPEN (L-19)** |

## 6. Diagnostic pipeline & applicability — inventory (proposta §T-2)

Inventario dei diagnostici **distinto** dalla tabella hard-gate (§7).
Status semantico: PASS / FAIL / WARNING / **NOT_RUN / NOT_APPLICABLE**
(status distinto, mai suppressed-PASS). Esecuzione: lab-side (W3/W4),
mai bloccante per run-entry in v1 (policy r003 immutata).

| GateId proposto | Cosa misura | Superficie esistente | Status oggi |
|---|---|---|---|
| `schemaParse` | (NON diagnostico — hard gate, elencato per chiarezza) | `QuestScenarioSchema.safeParse` | esiste |
| `graphIntegrity` | (NON diagnostico — hard gate, §7) | `superRefine` | esiste |
| `graphCoverage` | ogni nodo/opzione attraversato in exploration | `exploreScenarioGraph` | superficie esiste; gate da codificare (W3) |
| `vocabCoherence` | kit↔DomainVocab (mayInvent/vietati/coerenza minaccia) | `DOMAIN_VOCABS` + validateCopy internals | nessun gate standalone (L-23) |
| `hookCoverage` | ≥75% scene con hook (definizione di conteggio SP-3) | **inesistente** (L-22) | da definire |
| `mcDiagnostic` | distribuzione esiti vs banda (soglie in lab config) | `simulateQuestAsync` + `deriveOfferBand` | superficie esiste; gate da codificare (W4) |
| `copyGate` | narrated-kit copy validity | `validateCopy`+`arcContract` | esiste (D1) — classificazione WARNING diagnostico |
| `journeyDag` | scenario×POI legality (pins/fase/edge forward-only) | `validateQuestJourneyDag` | esiste; **applicabile solo se POI target dichiarato** — di default NOT_APPLICABLE nel lab (AMEND-2b) |

**Proposta `DIAGNOSTIC_GATE_IDS`** (da ratificare T-2):
`['graphCoverage','vocabCoherence','hookCoverage','mcDiagnostic','copyGate','journeyDag']` —
`schemaParse`/`graphIntegrity` restano hard gate fuori dalla tupla;
`journeyDag` incluso come diagnostico con criterio di applicabilità
esplicito (POI target), mai run-entry.

## 7. superRefine coverage map — hard-gate table

Source-of-truth: derivata dal file schema committato; **ogni cambio di
schema richiede una nuova revisione di questo audit**.

| Check | Dove |
|---|---|
| `startNode` esiste in nodes | schema:630 |
| ≥1 nodo `end` | :633 |
| `armRolls[].requiresTrait` registrato in QUEST_TRAITS | :651 |
| chiave mappa == `node.id` | :657 |
| target dichiarati esistono | :661 |
| `verdictTable` goto targets esistono | :676 |
| CHECK next-target esiste + kind==='check' | :684,699-701 |
| option `next` targets esistono | :704 |
| flag richiesti/consumati hanno produttore | :708 |
| trait richiesti registrati | :713 |
| ≥1 slot required `leader` | :730 |
| `referenceParty` esattamente 1 leader | :745 |
| `dangerBandRef` ⇒ `referenceParty` presente | :749 |
| stat dei check coperte da statFocus slot | :765 |
| keyStats primary∩secondary=∅; primary∈primaryStats | :778,784 |

Claim "trait checks are hard" → **PROPOSED → RATIFIED a T-2** (era nel
dibattito come non-verificato; la tabella sopra lo localizza a :651/:713).

## 8. Baked catalog provenance (AMEND-2a)

Otto entry, tre meccanismi di riproduzione — classificazione per-entry
(fatto verificato, non assunto):

| Entry | Meccanismo | Kit/provenienza | Evidenza di verifica |
|---|---|---|---|
| `gen-race-passo` | registry-generate | `PASSO_MONTANO_KIT` flat, copy 14/14 (grep) | regen + hash |
| `gen-race-palude` | registry-generate | `PALUDE_KIT` flat, copy 14/14 | regen + hash |
| `gen-flood-miniera` | registry-generate | `MINIERA_FLOOD_KIT` flat, copy 16/16 | regen + hash |
| `gen-flood-mare` | registry-generate (kit narrated) | `MARE_FLOOD_KIT` flat — kit LLM-authored, frozen | regen + hash sullo scenario; il KIT è artifact congelato (non derivato) |
| `gen-race-miniera` | registry-generate (kit narrated) | `MINIERA_RACE_KIT` **localized {en,it}** — variante schema distinta | regen + hash (locale `it` è l'input usato) |
| `gen-impr002-palude` | **authored-literal** | literal TS + `parseQuestScenario`; compilazione a mano (L-09) | re-parse del literal → hash = prova d'identità; **nessuna rigenerazione parametrica possibile** — verification = `source-pinned` |
| `gen-impr002-mare` | authored-literal | idem + `fase:'ritorno'` authored | idem |
| `gen-impr002-miniera` | authored-literal | idem + overlay IT registrato (`SCENARIO_LOCALE_OVERLAYS`) | idem |

Nota AMEND-2a onesta: la classe del dibattito era «imprint-compile» —
l'audit la corregge in **authored-literal**: non esiste compilatore a
runtime da ri-invocare; la verifica-equivalenza è "il literal ri-parsa e
hasha identico" (fonte pinnata, non derivazione). Se in futuro un
compilatore imprint esiste, la classe si allarga.

Le classi `narrated` del dibattito si risolvono così: narrated-kit è una
proprietà della *provenienza del kit*, non del meccanismo scenario —
lo scenario resta registry-generate deterministico dato il kit frozen.
La distinzione copy-vs-struttura (r003: narrated testa struttura, non
copy) si applica ai test di equivalenza **del kit**, non dello scenario.

## 9. Canonical serialization spec (normative — per T-3)

`canonicalize(value: JsonValue): string` in `generation/canonicalize.ts`:

- Chiavi oggetto ordinate per UTF-16 code-unit (`.sort()` — NON
  localeCompare). Array preservano l'ordine. Stringhe: escaping JSON,
  nessuna normalizzazione Unicode. Numeri: semantica JSON; `-0`→`0`;
  NaN/±Infinity **throw**.
- **Throw** su: undefined, function, symbol, bigint, cicli (con path),
  oggetti non-plain.
- `stripUndefinedDeep(value): JsonValue` nello stesso modulo: own-enumerable
  ricorsivo, array-holes throw, symbol/function throw. Contratto:
  `canonicalize(stripUndefinedDeep(x))` per gli input di receipt;
  canonicalize da solo resta strict.
- `canonicalizationVersion = 1` export; cambi semantici → bump.
- **Divergenza dichiarata dal canonicalize privato dello schema (L-16)**:
  quello esistente è lenient (droppa presentation+undefined, output
  object) e serve `computeScenarioVersion`; quello nuovo è strict
  (string output, throw su undefined) e serve gli input-envelope dei
  receipt. **Non si condividono**: scopi e regole diversi — il doc ne
  fa esplicita la separazione per evitare fusioni silenziose.

## 10. Registry contract (per T-5)

`generation/gimmickRegistry.ts`: 2 righe (`race`, `flood-vault`),
`{generate, kitSchema, tuningSchema, domains, declaredOptOuts}` —
union discriminata su gimmickId. `generate` = riferimento identità al
generatore canonico (nessun wrapper). `declaredOptOuts:
readonly DiagnosticGateId[]` — opt-out ⇒ NOT_RUN/NOT_APPLICABLE, v1
ship con `[]`. Gli hard gate non sono rappresentabili nell'union
(test: una riga non può nominarli; id sconosciuto fallisce). Tipi
param da `z.infer` — allarme compile-time su drift interfaccia.

## 11. Receipt shapes + version-field ownership

```ts
GenerationReceipt = { receiptVersion:1, canonicalizationVersion:1,
  gimmickId, generatorVersion, schemaVersion, engineVersion,
  kit:JsonValue, tuning:JsonValue /* merged effettivo */,
  generationInputHash, scenarioHash }
RunReceipt = { receiptVersion:1, canonicalizationVersion:1,
  generatorVersion, schemaVersion, engineVersion,
  scenarioHash, party:JsonValue, runSeed, runInputHash }

GenerationInputEnvelope = {v:1, gimmickId, kit, tuning,
  generatorVersion, schemaVersion, engineVersion}
RunInputEnvelope = {v:1, scenarioHash, party, runSeed, engineVersion}
```

| Campo | Owner proposto | Update rule | Status |
|---|---|---|---|
| `receiptVersion` | modulo receipt SP-6 | bump su cambio forma envelope | PROPOSED |
| `canonicalizationVersion` | `generation/canonicalize.ts` | bump su cambio semantica | PROPOSED |
| `schemaVersion` | **`generation/versions.ts` `SCHEMA_VERSION` (risolto SP-6, 2026-10-24)** | bump su cambio schema | **RESOLVED — owner creato ex-novo** |
| `generatorVersion` | per-gimmick nel registry row (risolto SP-6, 2026-10-24) | bump su cambio generatore/merge | **RESOLVED — `race-gen-v1`/`flood-gen-v1`** |
| `engineVersion` | **`generation/versions.ts` `ENGINE_VERSION` (risolto SP-6, 2026-10-24)** | bump su cambio semantica engine | **RESOLVED — owner creato ex-novo** |
| `scenarioHash` | **`computeScenarioVersion` (esistente, L-16)** — `qsv1-` digest | deriva dal contenuto | **VERIFIED — riuso, non nuovo digest** |
| `generationInputHash`/`runInputHash` | sha256 su `canonicalize(envelope)` | digest sugli input effettivi | OPEN — **nessun sha256 sync in-repo**; fnv1a-32 è il precedente (qsv1) — decisione SP-6/Director se sha256 serve |
| `party` (projection) | SP-6 dopo audit `createRun` | — | OPEN |

Gli OPEN su version-fields bloccano la computazione dei receipt in
SP-6 (unblocker nominato: decisione Director all'ingresso SP-6) — non
bloccano T-3…T-5.

## 12. Task sequence + acceptance + exclusions

T-1 (questo doc) → **T-2 gate Director** (ratifica + tuple gate §6) →
T-3 canonicalize → T-4 kitSchemas → T-5 registry → T-6/7 doc fields.

Acceptance T-1: ogni riga del ledger ha Source; nessun claim "verified"
senza codice citato; gli OPEN sono nominati esplicitamente.

Exclusions (NOT owned): computazione receipt (SP-6), report
hashing/STALE (SP-5/6), progress callback, opt-out per-kit, modifiche a
generatori/schema/catalogo, UI.
