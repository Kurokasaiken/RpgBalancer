---
title: 'PLAN-029 — Quest Generation Lab «completamente operativa»: pick → generate → validate → play → iterate → export'
status: candidate
created: 2026-10-12
desiderata: v24 + deroga S5 (PLAN-026); intento operativo Director R-142
request: R-142 (base: R-140 — pagina lab creata)
parent: PLAN-026 (sistema di generazione quest)
depends: R-140 completato (pagina viewer su main, commit fa3a181b)
documentation_impact: REQUIRED — context/QUEST_GENERATION_* da aggiornare dove l'audit SP-1 diverge; COMPONENT_MASTER_INDEX solo se si toccano componenti trusted
---

# PLAN-029 — Quest Generation Lab operativa (master plan, artifact r003 converged)

Progetto: RpgBalancer
Stato: **candidate** — master plan convergente via mw-web-debate
`20261012-quest-gen-lab-operativa` (artifact r003, sha256
`938ac671…afd9`). Voti: chatgpt ACCEPT (T-017), gemini ACCEPT (T-018),
deepseek CONCEDE (T-015, caveat assorbiti in r002/r003), grok
provider_dead (capacity-limited; ultima posizione valida CONCEDE su
r001, nessuna obiezione aperta vs r003). In attesa di ratifica Director.
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

## Processo

Ogni subplan SP-1…SP-8 riceve un dibattito mw-web-debate dedicato
(clarification → grounding → proposte → cross-examination →
convergenza), come da R-142 («approfondiscili uno ad uno sempre cn le
AI web»). Gli output si registrano in `.mw/runs/` e si consolidano qui.
