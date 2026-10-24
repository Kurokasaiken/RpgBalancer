---
title: 'PLAN-029 — Quest Generation Lab «completamente operativa»: pick → generate → validate → play → iterate → export'
status: active
created: 2026-10-12
ratified: 2026-10-23 (Director ruling — AMEND-THEN-RATIFY, dibattito mw-web-debate
  `20261023-plan029-ratifica` converged 4/4 su artifact r003 sha256 `6f330e22…240c`;
  claude escluso adapter_dead. Emendamenti in §7 — disposizione PLAN-069 T-030)
desiderata: v24 + deroga S5 (PLAN-026); intento operativo Director R-142
request: R-142 (base: R-140 — pagina lab creata)
parent: PLAN-026 (sistema di generazione quest)
depends: R-140 completato (pagina viewer su main, commit fa3a181b)
documentation_impact: REQUIRED — context/QUEST_GENERATION_* da aggiornare dove l'audit SP-1 diverge; COMPONENT_MASTER_INDEX solo se si toccano componenti trusted
---

# PLAN-029 — Quest Generation Lab operativa (master plan, artifact r003 converged)

Progetto: RpgBalancer
Stato: **active** — ratificato dal Director il 2026-10-23 con il verdict
AMEND-THEN-RATIFY del dibattito di revisione
`20261023-plan029-ratifica` (converged 4/4, artifact r003 sha256
`6f330e22…240c`; claude escluso per adapter_dead). Master plan originale
converged via mw-web-debate `20261012-quest-gen-lab-operativa` (artifact
r003, sha256 `938ac671…afd9`). Voti originali: chatgpt ACCEPT (T-017),
gemini ACCEPT (T-018), deepseek CONCEDE (T-015, caveat assorbiti in
r002/r003), grok provider_dead (capacity-limited; ultima posizione valida
CONCEDE su r001, nessuna obiezione aperta vs r003).
Obiettivo: trasformare `/quest-generation-lab` da viewer su 5 scenari
baked in un loop di authoring chiuso — **pick → generate → validate →
play → iterate → export** — sul motore canonico, config-first,
browser-only, coperto da test.

Fonte autoritativa del piano: `artifact-r003.md` nel run Mind Weaver
`.mw/runs/20261012-quest-gen-lab-operativa/` (repo mind-weaver).
Questo file è la registrazione governance; il contenuto tecnico è nel
run artifact.

## 0. Invarianti (ratificati dal dibattito)

1. **Nessun motore parallelo.** Solo composizione dei pezzi canonici:
   `generateRaceScenario`, `generateFloodVault`, `QuestScenarioSchema`/
   `.safeParse`, `createRun`/`applyChoice`/`previewOption`,
   `simulateQuest(Async)`, `PersistenceService`, `LabMember`/
   `PartyPreset`, `ScenarioInstance`.
2. **Config-first.** Ogni nuovo artefatto (kit draft, tuning override,
   soglie MC, envelope export) è uno schema Zod.
3. **Browser-only.** Nessun backend; MC via `simulateQuestAsync` +
   `AbortSignal` (firma verificata: `signal?: AbortSignal`, chunk ≤50ms,
   progress dal conteggio chunk).
4. **Status onesti.** I gate riportano PASS / FAIL / WARNING / NOT RUN
   con motivazione; nessun verdetto automatico non codificato.
5. **IA a sei sezioni estesa, non sostituita.** "Author" è una *modalità*
   con pannelli annidati nelle sezioni esistenti, non una pagina/silo nuovo.

## 1. Decisioni chiave

- **Registry gimmick con typing discriminato per-gimmick:**
  `GimmickRegistry` = 2 righe (race, flood), ognuna
  `{generate(kit,tuning):QuestScenario, kitSchema, tuningSchema, domains}`.
  Solo i contratti genuinamente comuni sono condivisi; i tipi kit/tuning
  sono una union discriminata su gimmickId. I gate sono una **pipeline
  ordinata globale**; opt-out per-gimmick devono essere dichiarati
  esplicitamente sulla riga.
- **Due receipt, non uno:** `generationReceipt` = hash(canonical(kit)) +
  hash(canonical(tuning)) + generatorId + genVersion + schemaVersion —
  registra input di *generazione* e provenienza (party/seed esclusi:
  non sono input di generazione); `runReceipt` = generationReceipt +
  hash(canonical(party)) + runSeed + engineVersion. La riproducibilità
  si VERIFICA rigenerando e confrontando l'hash dell'output, non è
  dichiarata dal receipt. Serializzazione canonica (ordine chiavi
  stabile, variante locale esplicita) specificata in SP-1/SP-6.
- **Draft ≠ esecuzione, report legati al contenuto:** ogni candidato
  generato porta un content hash; un validation report è legato a quel
  hash. Un edit o una rigenerazione che cambia l'hash marca draft+report
  **STALE** (non merged silenziosamente). L'export incorpora solo report
  freschi, o etichetta lo snapshot come `historical`.
- **Hard gate vs diagnostici:** l'ingresso nel runtime richiede
  schema-parse OK + integrità grafo OK (hard). Hook, vocab, MC sono
  diagnostici — al massimo WARNING, mai bloccanti in v1. La promozione a
  bloccante è decisione solo-Director.
- **Export = envelope versionato:** `{schemaVersion, generatorVersion,
  engineVersion, gimmickId, kit, tuning, generationReceipt,
  validationSnapshot(advisory), scenario}` — l'import ri-parsa e
  ri-valida; gli snapshot sono evidenza storica, non certificazione.
- **MC diagnostico-first:** soglie in lab config (override per-scenario),
  gate a WARNING; etichettato "diagnostic" in UI finché non calibrato.
- **Provenienza baked-5 classificata, non assunta:** SP-1 registra la
  provenienza per voce (generated-from-kit / narrated kit / hand-tuned);
  i test di equivalenza-rigenerazione si applicano solo dove input e
  semantica di uguaglianza sono noti — le voci narrated testano la
  struttura, non l'uguaglianza del copy.
- **Integrità grafo = fatto di schema, diagnostica nuova:** superRefine
  verificato nel codice; SP-3 aggiunge diagnostiche actionable per-nodo
  sopra (non un re-check).
- **Test failure-path obbligatori:** DoD mantiene UN path e2e smoke +
  copertura unit per stale-report, import invalido, regen-mismatch,
  MC cancel, kit malformato.

## 2. Workstream (ranked)

- **W1 — Contracts audit + gimmick registry**: audit firme generatori,
  limiti PersistenceService, SimStrategy, superficie superRefine,
  provenienza baked-5 → contract doc → `GimmickRegistry` (2 righe,
  union discriminata) + schemi Zod kit/tuning.
- **W2 — Live generation panel**: picker gimmick/kit/tuning/run-seed nel
  Generated catalog → genera → albero DFS + dettaglio nodo sul
  candidato fresco.
- **W3 — Validation orchestrator + gate**: hard gate (schema+grafo) +
  diagnostici (hook ≥75% con definizione di conteggio, coerenza
  kit↔vocab, MC); pannello "Quality gates" + badge inline; report
  keyed a content hash.
- **W4 — MC nel lab**: simulateQuestAsync nel run panel + gate MC;
  progress + cancel (API verificata); deterministico dato
  (scenario, party, seed).
- **W5 — Authoring drawer**: editor kit (form + escape raw-JSON, Zod),
  override tuning, party what-if (LabMember); varianti come draft copy;
  draft marcato STALE su regen-mismatch.
- **W6 — Persistence + export**: draft/candidati via PersistenceService;
  export/import envelope versionato; due receipt; semantica staleness
  snapshot.
- **W7 — Scenario diffing**: structural + MC diff. v1.1.
- **W8 — MC cost governance**: sweep queue, budget, cancel. v1.1.
- **W9 — Test hardening**: unit per workstream + failure path; UN path
  Playwright DoD; test rigenerazione provenance-aware.
- **W10 — IA/i18n/status pass**: modalità Author, aggiornamenti
  open-issue, aggiornamenti implementation-map.

## 3. Cut line

- **v1 (operativa):** W1–W6, W9, W10 → DoD loop completo su un NUOVO
  candidato generato.
- **v1.1:** W7 diffing, W8 sweep, gimmick extra, MC catalogo-wide, gate
  bloccanti calibrati.

## 4. Subplan (v1: 8 dibattiti; v1.1: 2 spec parcheggiate)

- **SP-1 — Contracts audit + gimmick registry** (W1). Audit FIRST:
  contract doc approvato prima di fissare la forma del registry.
  Sblocca tutto. → **[approfondito](PLAN-029-SP-1-contracts-audit.md)**:
  dibattito `20261012-quest-gen-lab-sp1-contracts`, artifact r003
  converged 4/4 — contract doc `context/QUEST_GEN_LAB_CONTRACTS.md` con
  evidence ledger, kitSchemas/canonicalize/stripUndefinedDeep/registry
  in `generation/`, receipt envelopes pinnati, T-1…T-7.
- **SP-2 — Live generation panel** (W2). Dipende SP-1.
  → **[approfondito](PLAN-029-SP-2-generation-panel.md)**:
  dibattito `20261012-quest-gen-lab-sp2-generation-panel`, artifact r003
  converged 3/3 (grok provider_dead) — LabCandidate entity, useReducer +
  serialization seam per SP-6, LabExplorerEntry union, GenerationRequest
  sincrono + sessionEpoch, tuningFormDescriptors esaustivi, T-1…T-7.
- **SP-3 — Validation orchestrator & gate** (W3). Dipende SP-1; fissa
  hook-counting, regole vocab-coherence, split hard-vs-diagnostic.
  → **[approfondito](PLAN-029-SP-3-validation-gates.md)**:
  dibattito `20261012-quest-gen-lab-sp3-validation-gates`, artifact r006
  converged 4/4 — assi status/execution separati, coverage invariant
  (una riga per gate registrato + report-inventory = hard ∪ tuple),
  rollup con guardia hard-PASS, STALE derivato, slot async per SP-4,
  T-1…T-10.
- **SP-4 — MC integration (single-run)** (W4). Dipende SP-3.
  → **[approfondito](PLAN-029-SP-4-mc-integration.md)**:
  dibattito `20261012-quest-gen-lab-sp4-mc-integration`, artifact r003
  converged 3/3 (grok provider_dead) — mcGate con PARITY INVARIANT
  (seed/runs pinnati a BAND_SEED/BAND_RUNS, bit-exact vs deriveOfferBand),
  referenceParty-only applicability, details.mc payload additivo,
  T-1…T-7.
- **SP-5 — Authoring drawers** (W5). Dipende SP-1; parallelo a
  SP-3/SP-4; possiede la semantica STALE-draft.
  → **[approfondito](PLAN-029-SP-5-authoring-drawers.md)**:
  AuthoringSlice single-slot nel page reducer, materializer puro unico
  (hash+generate+snapshot dallo stesso oggetto), kitId-mismatch bloccante,
  campi opzionali set-or-inherit, what-if execution-only lab-session-scoped,
  narrated read-only + tuning consentito, validazione due tier con parity
  fixture, T-1…T-8.
- **SP-6 — Persistence & export envelope** (W6). Dipende SP-1, SP-3;
  possiede receipt + serializzazione canonica.
  → **[approfondito](PLAN-029-SP-6-persistence-export.md)**:
  qgl:v1:* blobs, report storici plurali, autosave + flush():Promise,
  version ownership co-locata (chiude gate OPEN SP-1), envelope export
  con wrapper receipt discriminated, import a stadi, migration seam vuota,
  T-1…T-7.
- **SP-7 — Test hardening & Playwright smoke** (W9). Dipende SP-2…SP-6.
  → **[approfondito](PLAN-029-SP-7-test-hardening.md)**:
  dibattito `20261012-quest-gen-lab-sp7-test-hardening`, artifact r003
  converged 2/2 (chatgpt+grok provider_dead documentati) — una spec
  sequenziale `tests/questGenLab.spec.ts` sul loop completo + reload
  post-import, override MC/debounce test-only gated `NODE_ENV=test`,
  evidence fixture con flag FLAKY, seed da provenance, pass pseudo-locale
  scopato, tabella mapping subplan→test, T-1…T-6.
- **SP-8 — IA/i18n/status-honesty pass** (W10). Chiude v1.
  → **[approfondito](PLAN-029-SP-8-ia-i18n-honesty.md)**:
  dibattito `20261012-quest-gen-lab-sp8-ia-i18n-polish`, artifact r003
  converged 3/3 (grok provider_dead ×6) — IA map unica (drawers annidati
  per sezione, persistence in header strip), sub-namespaces i18n +
  status/common condivisi, honesty matrix + assertion su
  data-status-kind, truthfulness eseguibile del registry (file+capability,
  mai file-existence da sola), tassonomia stati a 5 valori con "done"
  solo receipt-backed, T-1…T-5.
- **SP-9 — Scenario diffing** (W7). v1.1 spec parcheggiata.
- **SP-10 — MC cost governance & sweep** (W8). v1.1 spec parcheggiata,
  dipende SP-4+SP-9.

## 5. Rischi

- Platform creep → registry cap a 2, union discriminata, no plugin arch.
- Overclaim receipt → due receipt; hash prova identità+input, non
  compatibilità futura.
- Certificazione stale → report legati a content hash; semantica STALE
  esplicita.
- Falsa confidenza MC → gate diagnostici WARNING; soglie in config;
  promozione Director-only.
- ≥75% gameable → lint meccanico stretto, definizione di conteggio
  fissata in SP-3.
- Assunzioni persistence → SP-1 audita i limiti PersistenceService
  prima del design W6.
- Fatica dibattito → v1 = 8 dibattiti subplan; SP-9/SP-10 parcheggiati
  come spec, non dibattuti ora.

## 6. Definition of done (v1)

«Dalla UI del lab: pick gimmick + kit + tuning + party + run seed →
generate → validation report (hard: schema+grafo; diagnostico:
hook+vocab+MC con soglie in config) → play fino a esito terminale →
export candidato versionato → re-import e re-parse» — coperto da unit
test (incl. failure path) più un path smoke Playwright.

## 7. Emendamenti di ratifica (ruling Director 2026-10-23)

Registrati come update del piano, non riscrittura di r003. Prodotti dal
dibattito di revisione `20261023-plan029-ratifica` sui delta
2026-10-12 → 2026-10-23 (D1 pipeline narrativa irrobustita; D2 `fase` +
journey-DAG validator; D3 terza istanza imprint-compiled; D4 metaLayer;
D5 disposizione PLAN-069). Artifact: `.mw/runs/20261023-plan029-ratifica/artifact-r003.md` (repo mind-weaver).

**AMEND-1 — SP-3 gate inventory re-baseline (delta D1).** Il gate
inventory di SP-3 va ri-derivato sulla copy pipeline attuale
(`validateCopy` ~+600 linee, `arcContract` nuovo, `narrationPrompt`/
`sceneBrief` riscritti, `domainVocabs` estesi): ogni nuovo check
deterministico va enumerato e classificato PASS/FAIL/WARNING
esplicitamente. La policy r003 resta immutata: i diagnostici non
bloccano il run entry in v1; la promozione a bloccante resta
decisione solo-Director.

**AMEND-2 — fase/journey + generation-surface audit (delta D2+D3).**
(a) L'audit di SP-1 si estende a: campo `fase`, modulo
`validateQuestJourneyDag`, config journey-fasi dei POI, E alla
provenienza per-entry che registra per ogni voce di catalogo il
**meccanismo di riproduzione** (registry-generate / imprint-compile /
narrate-only) **più l'evidenza di verifica che sostituisce
l'equivalenza-per-rigenerazione in quella classe**: registry →
rigenera + confronta output hash; imprint → ricompila da imprint +
parametri registrati + confronta hash; narrated → uguaglianza strutturale
sola, mai copy equality (regola r003 esistente); input di rigenerazione
ignoti → classificato `verification-not-claimable`, riportato onestamente.
Registrare solo il meccanismo non soddisfa l'invariante di
riproducibilità-verificata.
(b) Classificazione journey-DAG (fatto verificato su codice):
`validateQuestJourneyDag` consuma config journey POI (pins, travelDays,
ticksPerDay) — valida una coppia scenario×POI, quindi NON può essere
hard gate di run-entry nel lab (gli scenari standalone non hanno POI).
Gate al seam export/targeting POI (SP-6) + diagnostico opzionale SP-3
quando un POI target è dichiarato.
(c) Il freshness claim dei report SP-6 è esplicito sullo scope: un
content hash di scenario certifica solo la validità scenario-intrinseca;
la compatibilità POI è o dentro l'identità di validazione del report o
esplicitamente fuori dal suo claim.

**Non emendato** (verificato, nessun intervento): D4 metaLayer (nessun
contratto di ingest per envelope quest); D5 governance (questa ratifica
È la disposizione PLAN-069 T-030); conteggi catalogo (provenienza
per-entry assorbe); smoke Playwright SP-7 (infrastruttura sana).

Subplan toccati: **SP-1** (scope audit), **SP-3** (gate inventory),
**SP-6** (gate export-seam + freshness scope). Gli altri subplan
converged non richiedono modifiche.

## Processo

Ogni subplan SP-1…SP-8 riceve un dibattito mw-web-debate dedicato
(clarification → grounding → proposte → cross-examination →
convergenza), come da R-142 («approfondiscili uno ad uno sempre cn le
AI web»). Gli output si registrano in `.mw/runs/` e si consolidano qui.

## 8. Stato implementazione v1 (2026-10-24)

Implementazione v1 completata in-sessione (agente locale, "senza pause"):

| SP | Esito | Note oneste |
|----|-------|-------------|
| SP-1 | ✅ | contracts doc + tuple + canonicalize + kitSchemas + registry (32 test) |
| SP-2 | ✅ | LabCandidate + reducer + epoch + hashing sha256 + serialization + GenerationPanel + explorer parity (12 test) |
| SP-3 | ✅ | validation/{types,registry,gates,orchestrator,config} + QualityGatesPanel + i18n (6 test) |
| SP-4 | ✅ | mcDiagnostic async runner registrato (parity BAND_SEED/BAND_RUNS, diagnostic-only, abort-aware) |
| SP-5 | ⚠️ parziale | kit JSON drawer + tuning override + narrated read-only fatti; drawer dedicati (party what-if, variant entity) non implementati — il percorso variante passa da kit-edit+generate |
| SP-6 | ✅ core | PersistenceService hydrate+autosave (qgl:v1:candidates), export envelope versionato + staged import, versions.ts (owner creato — risolve T-7) |
| SP-7 | ⚠️ | spec Playwright `tests/e2e/questGenLab.spec.ts` scritta, NON eseguita qui (serve dev server) — unverified per T-04 |
| SP-8 | ⚠️ | i18n en/it/pseudo su tutte le nuove superfici; status onesti ovunque; nessuna status-matrix doc dedicata |

Gap residui noti: drawer SP-5 completi, esecuzione smoke, status matrix.
SP-9/SP-10 restano parked v1.1 come da plan.
