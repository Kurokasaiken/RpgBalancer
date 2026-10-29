---
title: 'PLAN-102 — Quest Editor (load/play/edit quest scenarios)'
status: battezzato
created: 2026-10-29
request: R-294
debate: mw-web-debate `20261029-quest-editor-plan` — artifact r004 CONVERGED
  4/4 (chatgpt, claude, gemini, deepseek; grok escluso provider_dead)
artifact_sha256: 1e9683fda0d4b400dc53fabce6668c3182afbb7cffba97f5e79f9f85c7f1fb00
---

# PLAN-102 — Quest Editor

Tool per caricare, giocare in debug e modificare quest (testo, numeri di
bilanciamento, struttura di scene). Decisioni dal dibattito multi-AI web;
dissensi e falsificatori registrati in
`mind-weaver/.mw/runs/20261029-quest-editor-plan/`.

## Decisioni (artifact r004)

- **D1 — Placement**: route dedicata `/quest-editor`, composta da moduli
  standalone in `src/ui/idleVillage/questEditor/` (WorkingCopy store,
  loaders, PlaySurface, NodeInspector, ValidationStrip, SaveExport) con
  zero codice page-specific — così `/quest-playground` (PLAN-086) potrà
  montarli dopo come Edit tab; la pagina è un thin shell smontabile.
  Cross-link con `/quest-generation-lab` e il futuro playground.
  *Falsificatore (claude):* se l'estrazione modulare risulta infattibile
  a T-2, il placement flippa a mount nel playground — è criterio di
  accettazione, non speranza.
- **D2 — Save**: tre verbi separati. SAVE DRAFT → autosave `qge:v1:draft`
  via PersistenceService (mai nel candidate store per keystroke).
  SAVE AS CANDIDATE → `provenance:'edited'` + lineage
  `{parentScenarioHash, parentSource, editSummary}`; editare un candidato
  approvato fork-a un nuovo candidato (fork-not-mutate). EXPORT → envelope
  `qgl-export-v1` con **pre-flight validation che rifiuta dati rotti di
  default** + override "diagnostic export" non confondibile con
  l'approvabile. Git resta source of truth; niente write-back sui
  manoscritti TS. Post-v1 candidato: CLI materializer (no Vite middleware)
  che scrive solo file NUOVI.
- **D3 — Play**: GenRunPlayer-contract embedded (motore reale
  `createScenarioInstance`+`createRun`+`applyChoice`; opzioni locked
  visibili con motivo del gate; odds `previewOption`). Run legata a
  snapshot immutabile + seed; edit → banner "stale run" + re-seed
  one-click; nessuna mutazione mid-run. **Inspector odds readout**:
  numeri `previewOption` accanto ai campi di bilanciamento (funzione pura
  della copia valida; dash se invalid). **Live probe debounced: NON v1** —
  falsificatore (deepseek): se lo strumento D7 misura re-seed+renavigate
  ≤2 interazioni/probe sul pass goblin di riferimento, il probe è
  ridondante → v2; altrimenti promosso v1.5.
- **D4 — Authored as fork**: import authored (goblin/rovine) → working
  copy → candidato editato. Nodi con routing engine-hardcoded: badge
  field-level "engine-owned routing", routing read-only; **rifiuto di
  persistere verdictTable su nodi legacy** salvo fork-to-new-id esplicito.
  Node-id referenziati dall'engine/telemetry: locked-id badge su
  rename/remove. **Fork fidelity (repo-verified)**: `applyNodeOutcome`
  chiava su `node.id` (routing sopravvive alla fork se gli id restano),
  ma side-effects chiavano su `state.questId` (XP goblin, stash-loadout
  flags, escalation `campoSveglio`, rovine days/objective-drop) — una
  fork sotto `questId:'gen'` li perde. Il manifest di fedeltà è prodotto
  dallo spike bloccante T-0(b); l'editor mostra un pannello
  "fork fidelity" (node-id-safe vs questId-owned). **Gate obbligatorio
  all'Approve (W-04)**: approve di una fork authored BLOCCATO finché il
  manifest elenca comportamenti questId-owned non risolti — ogni voce va
  migrata (verdictTable/dato) o waiver-ata esplicitamente; il waiver è
  registrato nel manifest del candidato e viaggia nell'envelope.
- **D5 — Scope**:
  - **v1**: testo EN (title/body/transit/hints/verdictFlavor/option
    label+detail); campi balance (stats, risk %, upfrontDamage, combat,
    costi/grants, gates, costDays); add/remove scena+opzione con
    **preflight reference-aware** (mostra inbound refs → repoint o
    dangling con badge rosso che blocca Approve, mai l'editing); rewiring
    via picklist node-id; `verdictTable` editor solo nodi non-legacy;
    beat reassign; draft autosave + reset-to-parent + undo strutturale
    shallow (op atomiche; field edit raggruppati); ValidationStrip;
    PlaySurface con stale banner; loop instrument; **minimal IT write
    (W-03)**: la stale list è scrivibile per le entry stale/missing che
    mostra — input inline scrive su overlay payload nel candidato; gli op
    strutturali emettono anche un op `remapOverlayKeys`. Full modal
    translate resta v1.5.
  - **v1.5**: modal Translate completo; envelope overlay slot
    formalizzato; legacy verdictTable path; offer/slots, longForm,
    journey/fasi.
  - **v2**: live probe se il falsificatore scatta; cinematic preview;
    CLI materializer.
- **D6 — Working copy "tolerant draft"**: op-list immutabile sullo
  scenario base (ops nominate e reversibili: setField, addNode,
  removeNode, setOption, rewireNext, setVerdictRow, remapOverlayKeys).
  **Contratto di atomicità (W-01)**: ogni op — incluse compound come
  removeNode+rewire-inbound — è una funzione totale validate-then-apply;
  validazione fallita → draft invariato, errore surfaciato, op mai
  loggata; un op loggato si revoca atomicamente. Tollerante per
  keystroke; Zod+runValidation valutati in continuo per la strip ma
  **gatano solo Approve/Export, mai il typing**. Undo = drop di op
  (per-field, per-op, reset-to-parent = drop all).
- **D7 — Loop instrument** (obbligazione di chiusura): counter dev-only di
  roundtrip edit→probe→observe/min sul pass goblin di riferimento;
  falsifica il claim "<2min" e alimenta il falsificatore D3.
- **D8 — Visual fork**: gate bloccante prima di T-1 — layout materialmente
  conteso (three-pane rail vs stacked/dockable con scenario-picker
  modale); card v35, ruling Director, baseline congelata, obbligazioni
  same-viewport nel contratto.
- **D9 — Safety rails**: preflight destructive ops; export refusal di
  default; autosave mai nel candidate store; fork-not-mutate; il draft
  tollerante non raggiunge mai l'engine se non via snapshot immutabile.

## Task

| T | Task | Dipende da |
|---|------|-----------|
| T-0 ✅ | **Spike bloccanti**: (a) estensione schema candidato `provenance:'edited'`+lineage (backwards compat); (b) **fork-fidelity** — elenco statico comportamenti node-id-keyed vs questId-keyed + goblin-copy sotto `questId:'gen'` a seed fisso → outcome diff → manifest che D4 legge; (c) seam `QuestRunWindow` scenario-prop → documentato | — |
| T-1 | Visual-fork card → ruling Director → baseline congelata | — |
| T-2 ✅ | Package `questEditor/`: tipi TolerantDraft+EditorOp, WorkingCopyStore (ops/undo/dirty/autosave `qge:v1:draft`) | T-0(b) PASS |
| T-3 ✅ | Loaders: catalog / candidato / authored-import / envelope-import | T-2 |
| T-4 ✅ | Route + shell secondo ruling + cross-link | T-1, T-2 |
| T-5 🚧 | NodeList per beat + add/remove/reorder + preflight destructive | T-2, T-4 |
| T-6 🚧 | NodeInspector: testo EN + IT stale-list scrivibile, balance fields + odds readout, options editor, verdictTable editor (non-legacy), beat/stageDirection | T-2, T-4 |
| T-7 🚧 | PlaySurface: GenRunPlayer-contract, snapshot+seed immutabili, stale banner, re-seed | T-2, T-4 |
| T-8 ✅ | ValidationStrip: Zod + runValidation + BFS reachability + warning engine-id/dead-table + pannello fork-fidelity | T-0(b), T-2 |
| T-9 ✅ | Verbi Save/Approve/Export: candidato fork+lineage, export preflight refusal + override diagnostico, gate fork-fidelity all'Approve | T-2, T-8 |
| T-10 🚧 | Loop instrument + i18n chrome (en/it) + test unit/e2e + evidence + bundle di chiusura | T-2..T-9 |

**Blocco**: T-2..T-8 non partono finché T-0(b) non produce il manifest —
se la premessa fork fallisce, D4/D5 si riaprono prima di qualunque build.

## Esiti T-10 (2026-10-29, parziale)

- `questEditor/loopInstrument.ts`: buffer op/reseed/observe, `__qgeLoop`
  (roundtripsPerMin + interactionsPerProbe) — strumento D7 pronto per la
  misura sul pass goblin di riferimento (evidenza KPI ancora da raccogliere).
- Regressioni permanenti `questEditor.t10.test.ts` 5/5: round-trip
  goblin (edit→candidato→export→import = valido, provenance 'edited'),
  export refusal su scenario invalido, fork-gate W-04 (blocca/sblocca su
  waiver), refusal dead-verdictTable/engine-routed, inboundRefs con CHECK:.
- Fix runtime: `computeScenarioVersion` importato da `questScenario.schema`.
- Resta per la chiusura: raccolta KPI loop sul reference pass, eye-check
  Director su `/quest-editor` vs baseline wireframe (T-04), `verify:bundle`.

## Esiti T-8/T-9 (2026-10-29)

- `questEditor/validation.ts`: `validateDraft` (schema errors + dangling
  con CHECK: + unreachable BFS + engine-owned list) — gate Approve/Export.
  `FORK_FIDELITY_MANIFEST` (goblin 5 voci, rovine 3) = pannello waiver.
- `questEditor/editedCandidate.ts`: `buildEditedCandidate` (LabCandidate +
  `editedProvenance` non-breaking su candidate.ts) + `buildEditedExportEnvelope`
  (preflight rifiuta invalid) + `unwaivedFidelityItems` (gate W-04:
  Approve bloccato finché voci non waiver-ate; waiver viaggia nell'envelope).
- `exportEnvelope.ts`: enum provenance + 'edited' (re-import compatibile).
- Pagina: ValidationStrip live, pannello fidelity con checkbox waiver,
  Salva candidato (store condiviso) + Esporta (download JSON) + importa
  envelope da clipboard. Test 6/6 restano verdi.

## Esiti T-5/T-6/T-7 (2026-10-29, v1 in corso)

- `questEditor/EditorPlaySurface.tsx`: run reale (instance+createRun+
  applyChoice+previewOption), party HP bar, flee, seed/re-seed, stale
  banner, `Ed` inline-edit (testo dove lo vedi: title/body/transit/option
  label+detail/verdictFlavor → op `setNodeField`/`setOptionField`),
  stat chips UI stub, placeholder `art · nodeId`.
- `QuestEditorPage` completa: header (Carica authored/catalog/candidates,
  Salva draft `qge:v1:draft`, undo/reset, candidato+export stub T-9),
  scene strip (▶ selezione, +/− scena con guardia inbound), inspector
  3-colonne (numeri %, opzioni→next picklist, riferimenti entranti
  repoint). Manca: immagine NODE_ART vera, consumabili spendibili,
  stat chips funzionanti, IT write, validation strip (T-8), save/export (T-9).

## Esiti T-3/T-4 (2026-10-29)

- `questEditor/loaders.ts`: `loadFromCatalog` (GENERATED_CATALOG),
  `loadFromCandidate` (store condiviso), `loadAuthored` (goblin/rovine
  fork), `loadFromEnvelope` (qgl-export-v1 re-parse) — ogni load produce
  WorkingCopy + parent ref `{source, ref, scenarioHash}` per il draft.
- `/quest-editor` registrato in `src/App.tsx` (lazy + ErrorBoundary,
  pattern dei lab) → `src/ui/idleVillage/pages/QuestEditorPage.tsx`
  shell ruling-B: header load + regioni stub PlaySurface/strip/inspector.

## Esiti T-2 (2026-10-29)

- `src/ui/idleVillage/questEditor/`: `editorOps.ts` (EditorOp union,
  applyOp atomico validate-then-apply, `ENGINE_ROUTED_NODE_IDS` = 29 case
  dello switch, `inboundRefs` con supporto prefisso `CHECK:`),
  `workingCopy.ts` (base+ops, derive replay, undo/revertField/resetToParent,
  dirty), `draftPersistence.ts` (`qge:v1:draft` via PersistenceService),
  `index.ts`. Test `questEditor.workingCopy.test.ts` 6/6: refuse atomico,
  removeNode bloccato su inbound non risolti + atomico con rewires,
  refusal engine-routed (remove + verdictTable), undo/reset.

## Esiti T-0 (2026-10-29, evidence `.mw/runs/plan102-t0/`)

- **T-0(b) PASS**: test `tests/unit/idleVillage/questForkFidelity.t0.test.ts`
  (seed 7, prima opzione abilitata) — diff dinamico: fork perde solo
  `hasBonusForza`/`hasHealing` (stash loadout, `questRun.ts:1005`) + 1 riga
  log (intro generica). Routing preservato (`applyNodeOutcome` = node.id-keyed).
  Manifest statico (10 siti questId-keyed, tutti in questRun.ts): stash
  flags, XP award goblin, `trofeoPerso`→`objectiveLost`, trophy→gold al
  ritorno, epiloghi — questa è la lista del gate D4/W-04.
- **T-0(a)**: `CandidateProvenance` è generation-shaped → serve estensione
  discriminated union `{kind:'edited',parentScenarioHash,parentSource,
  editSummary}` + backfill hydration (old → 'generated'). Piccola, compat.
- **T-0(c)**: `useQuestRun(questId)` supporta già `scenarioInstance`
  (`scenarioInstanceById`/`registerScenarioInstance`) — cinematic preview
  = `useQuestRun('gen')` + istanza registrata; costo post-v1 = plumbing di route.
- **T-1 in corso**: fork card
  `.mw/runs/20261029-quest-editor-visual-fork/visual-fork-editor-layout.md`
  + wireframe `public/quest-editor-fork.html` servito su localhost —
  `selected: null`, attende ruling Director (A three-pane / B stacked+modal).

## Contratto di chiusura (obbligazioni verificabili)

- `npm run build:check` · `npm run lint -- <scope>` · test di scope verdi ·
  `npm run closure:lint` · `plan:stamp` ledger.
- **Test di regressione permanenti** (R-247): round-trip goblin
  (import→edit→candidate→export→import = valido + hash coerente); ops
  tolerant-draft (add/remove nodo, dangling detection); export refusal su
  invalid; stale-run flag; dead-verdictTable refusal; preflight
  destructive blocking; **fork-gate: Approve bloccato su lost-behaviors
  non waiver-ati, passa con waiver registrato o migrazione**.
- `human-eye`: baseline visual-fork vs implementazione, stesse viewport.
- **Loop KPI** in evidence: roundtrips/min sul pass goblin (abbassa un
  death %, stringi un gate).
- Persistenza solo via `PersistenceService`; i18n per chrome UI;
  nessuna nuova dipendenza salvo necessità dimostrata.

## Director note (R-294, verbatim rulings 2026-10-29 — per l'agente che implementa)

1. **Il testo si edita dove lo vedi** — niente campo duplicato: title/body/
   transit/option label+detail sono editabili in-place nella card di gioco.
   La zona inferiore contiene solo ciò che il play non mostra (numeri,
   wiring opzioni/next, verdictFlavor, gates, badge engine-owned).
2. **`%` ovunque, mai `pp`** — nel tool e nel progetto.
3. **Il play è una run REALE e stateful**: cliccare i pulsanti = giocare
   l'avventura vera — si avanza scena→scena e HP persi/feriti/morti/loot/
   flag/consumabili PERSISTONO (nessun teleport/jump in v1).
4. **Consumabili visibili e spendibili** prima di un check (riga bag nel
   pannello play).
5. **Stats del check editabili con chips**: `+ stat` aggiunge, ✕ rimuove —
   le odds si ricalcolano a fianco.
6. **Caricamento include "Nuova da gimmick"**: chips core gimmick
   (race/flood/meld) + kit + tuning → genera → editi la copia.
7. Play top full-width + striscia scene + editor sotto (forma B risolta
   come flusso unico — ruling Director 2026-10-29 «x il resto va bene» +
   iterazioni wireframe: image+party HP+odds reali+inline edit).
8. **Lingua**: toggle EN|IT in header; il testo IT si edita in-place dove
   appare (stessa affordance delle voci EN); le voci stale/missing sono
   marcate e riscrivibili lì — coerente con minimal IT write (W-03).

## Visual-fork marker

`visual-fork: SELECTED B — ruling Director 2026-10-29, baseline wireframe public/quest-editor-fork.html` (layout: three-pane rail vs
stacked/dockable+modal picker — due rappresentazioni materialmente
diverse, nessuna fissata da frozen kit/registry).

## Dissensi registrati (dal dibattito)

- chatgpt+gemini (AX-1): avrebbero esteso `/quest-playground`; risolto dal
  contratto module-extraction (la pagina è shell, i moduli sono
  l'implementazione condivisa).
- deepseek (CP-3): live probe in v1 — minoranza registrata; il
  falsificatore D7 è l'aggiudicazione adottata.
- claude: preferenza slicing A→B→C non-bloccante, registrata come dissent.
