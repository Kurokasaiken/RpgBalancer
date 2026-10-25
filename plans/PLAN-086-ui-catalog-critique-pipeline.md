---
plan: PLAN-086
title: UI Catalog & Critique Pipeline — catalogo vivente dei componenti /game con loop critica multi-AI web
status: in corso (battezzato Director 2026-10-24 «procedi»)
request: R-282
revision: r013 (emendamento web-ai-prompt-protocol — Director «si, emenda adesso» 2026-10-24; r012 = debate decision_memo 4/5 ACCEPT + 11 objections; sha 0a19477f)
created: 2026-10-24
---

# PLAN-086 — UI Catalog & Critique Pipeline

Macchinario persistente: un **catalogo vivente** dei componenti UI visibili
su `/game`, processati componente-per-componente con una pipeline a 3 stadi
logici — Documenter (screenshot+scheda), Critique broker (AI web + mockup),
Implementer (unico stage che tocca `src/**`, solo post-ruling Director).

**Boundary del plan**: il plan consegna il loop *catalogo → critica → mockup
→ ruling Director*. L'implementazione dell'upgrade scelto è SEMPRE un
plan/task separato con il proprio contratto e visual-fork (ruling = design
direction, non codice). Una proposta `structural` non è mai "implementation
ready" senza un feasibility assessment.

Rulings Director: `RICHIESTE.md` R-282 (perimetro = UI visibile; stati;
versioning V1..Vn; AI = filtro, Director = ruling; visione artistica unica;
pilot = Tab HUD top).

## Layout del catalogo

```
.mw/ui-catalog/  (nota: `.mw/catalog/` è il catalogo endpoint AI — dir rinominata)
  manifest.json            ← fonte unica: stati, versioni, coda, hash
  ART-DIRECTION.md         ← rubrica versionata (gate Director sul contenuto)
  index.html               ← wiki generato (job separato, single-writer)
  _builds/<sha>/           ← una frozen build per git SHA, condivisa
  components/<id>/
    page.md                ← scheda corrente + link
    versions/V<n>/         ← shots/ + page-revision + ruling + meta.json
    critiques/             ← risposte grezze + digest.md (Zod-validated)
    mockups/               ← proposte + lint report + ranking AI + ruling
```

## Modello a stati (macchina esplicita)

Enum macchina (Zod, fonte unica — la prosa non ripete):

`unassigned → documenting → documented → in_critique → in_review → ruled`
(terminale per PLAN-086). `implementing → updated` appartengono al plan di
upgrade downstream: solo quel task li scrive, via catalog.mts API —
nessuna competizione di ownership.
Stati di fallimento/invalidazione (mai mascherati da stati normali):
`failed` (stage non completato, artifact + reason preservati),
`stale` (hash dipendenze cambiato fuori pipeline),
`rejected` (Director reject-all, ruling+feedback conservati),
`needs_revision` (Director chiede altro giro di proposte),
`blocked_contract` (direzione in conflitto con contratto vivo).
Re-giro = **append** di una nuova versione: mai reset distruttivo della
storia. Transizioni legali + retry dichiarati nello schema.

Concorrenza: 3 stadi logici eseguiti come **job idempotenti e riprendibili**
(input revision, output artifacts, idempotency key). Tutte le scritture su
`manifest.json` passano da `catalog.mts` (API unica, lock = lease con TTL + owner id (lock scaduto rotto con journal entry), atomic
rename). `index.html` è rigenerato da un job separato dopo i commit batch —
mai dentro il Documenter per-componente. Uno stale job non può committare
contro una revision manifest più nuova senza reconcile esplicito.
Parallelismo consentito SOLO su chiavi manifest diverse con il lock
acquisito; i crash (browser/provider) si recuperano senza rieseguire gli
stage già riusciti.

## Task

- **T-001** Manifest Zod + inventario iniziale: DOM census headless su
  frozen build + GAME_SURFACE_GRAPH. Voce = **regione visiva** (granularità
  DECISA: "ciò che un UI lead critica come un oggetto"; `children[]`
  opzionale). Schema: `states[]` con driver tipizzato (`{kind:'surface',
  id}` | `{kind:'surface+key', surface, key}` | `{kind:'hook', name}` |
  `{kind:'script', ref}`), `category` enum (hud_cluster|panel|overlay|
  control|marker|view), `links{contract[], trusted[]}` (array — una
  regione mappa su più contratti), `sourceHash` = hash di scopeFiles + closure di dipendenza
  risolta via esbuild metafile (tool nominato; approssimazione conservativa
  dichiarata: import dinamici/CSS runtime-composed possono sfuggire) +
  token `--skin-*` consumati + font/asset. Staleness scoped ai soli input
  *visual-affecting* (hue/ornamento/font/layout token vs file incidentali —
  classificazione dichiarata); secondo detector = perceptual-diff dello
  stato default alla ri-documentazione successiva (render signature).
  Status `stale` BLOCCA il consumo a valle (critique/review) fino a
  re-capture; evidenza storica preservata. Integrità meccanica oltre allo shape: ID unici, driver validi,
  ordinamento versioni, esistenza artifact referenziati, combinazioni
  status/stage legali, leakage guard `ground_truth` sul payload completo
  inviato ai provider (vedi T-004). **Copertura dichiarata non totale**: census +
  discovery incrementale; ogni nuova superficie visibile entra come
  `unassigned`; nessuna claim di completezza.

- **T-001b** `npm run catalog:stale`: confronta `sourceHash` vs repo live;
  drift → status `stale` + report su *quale* input è cambiato (file/import/
  token). Invalida l'evidenza, mai cancella storia.

- **T-002** `ART-DIRECTION.md` versionato: rubrica globale + override
  per-surface (hud|modal|map-overlay). Tre livelli: vincoli immutabili /
  preferenze forti + anti-pattern list / giudizi contestuali che richiedono
  Director. Selezione slice **deterministica per surface-tag**; ogni round
  di critica registra la rubric revision usata. **Gate: ogni revisione della rubrica va in review page al Director
  prima dell'uso** (per-revision, non solo v1 — artefatto di direzione).

- **T-003** Documenter `scripts/catalog/documentComponent.mts`:
  (a) build una tantum per git SHA → `.mw/ui-catalog/_builds/<sha>/` +
  `vite preview` porta dedicata (MAI dev server — T-13/T-17/P-005);
  (b) per ogni stato: reach via driver tipizzato → **assertion sullo stato
  osservabile atteso** (testid/testo/proprietà — uno stato non verificato
  NON viene fotografato) → 2 capture per stato × {in-context crop con
  padding fisso, masked variant via CSS inject che nasconde layer
  non-componente} → doppio shot per determinismo — metrica perceptual-diff
  (pixelmatch-style) con soglia ε dichiarata in config e calibrata su
  catture ripetute della stessa build prima del gate; animazioni congelate:
  reduced-motion + CSS inject + clock canonico tick-advance; meta.json
  registra browser version + GL backend + ε usato; failure ⇒
  `documented_partial` con reason;
  (c) per-stato timeout 30s, failure taxonomy `documented_full |
  documented_partial (quali stati + reason) | documenter_blocked`;
  (d) `meta.json` per shot set: git SHA, viewport, dpr, driver id,
  assertion outcome, timestamp, console errors rilevanti;
  (e) rigenera `page.md` (descrizione, stati, link trusted — un link
  contratto mancante a `.mw/contracts/components/<id>.md` esistente =
  `catalog:validate` FAIL). Tutto headless/background (rule 16).

- **T-004** Image-upload feasibility gate (repo **mind-weaver**, boundary
  dichiarato): estensione adapter `scripts/web_adapters/*` +
  `browser-runtime` con `--image`/file-input per provider. **Canary probe**
  per provider: immagine di test contenente un token random 6-char + forma
  colorata imprevedibile; `provider_capable` SOLO se la risposta riporta il
  canary (prova che il modello ha *visto* l'immagine). Esiti:
  `provider_capable | provider_dead | text_only_fallback` — journaled con
  adapter revision testata + evidenza probe. **Canary in conversazione
  throwaway** (emendamento r013, web-ai-prompt-protocol P1): la canary-image
  NON viaggia più dentro la conversazione di critica — probe inline priminga
  l'inventario (patologia enumerazione, dibattito `20261024-prompt-protocol`).
  Il probe gira in una conversazione separata, canary image only, **una
  volta per provider session** (Grok: per round — capability instabile).
  Esito: boolean+timestamp per quorum, journaled; la sessione di critica
  non vede mai il transcript del probe. Failure ⇒ out of image-quorum per
  quel round; esclusione session solo dopo 2 failure consecutivi.
  **observed_facts → audit post-hoc** (emendamento r013): i fatti non sono
  più chiesti al critico (chiedere "prova di aver visto" inline è
  perception-audit cognition avversaria al gusto). L'orchestratore verifica
  **2-3 claim concreti della critica** contro `ground_truth`
  per-componente — la fixture resta invariata: lista di fatti
  **appearance-specific e discriminanti**
  authored al documenter-time e verificati come effettivamente
  distinguibili nello shot inviato (ogni fatto referenzia la regione/
  dettaglio dello shot ED è legato a uno shot/state preciso della
  chiamata — verificato assente dalla canary-image e dagli altri input
  visivi della stessa call). Esclusi: fatti generici, strutturali
  ("3 linguette") o derivabili dalla semantica di contracts_summary/
  page.md — il fatto deve descrivere l'aspetto del render (pattern
  ornamento in QUESTA build, tinta/spaziatura/glow in QUESTO stato),
  non ciò che un lettore del contratto sa già. Mai presenti nel prompt
  testuale né ricostruibili dagli input. **Gate quorum (r013)**: la
  risposta conta come image-grounded SOLO se l'audit dell'orchestratore
  verifica ≥2 claim concreti della critica contro `ground_truth` —
  prova di *usage*, non di inventory. **Fallback**: se la critica rende
  <2 claim verificabili, probe post-critica obbligatorio per quel round
  (una riga: «descrivi tinta/pattern di X nello shot isolato» — DOPO la
  critica, mai priming). **Fail-closed**: se audit E probe falliscono,
  la critica è trattenuta come evidenza non-grounded (text-only) —
  esclusa dal quorum image-grounded del round, MAI scartata; il round
  prosegue coi membri quorum restanti. In calibrazione si verifica che
  un dettaglio fine reale (es. label di una tab) venga riportato.
  Il canary resta solo capability probe; l'engagement è provato
  dall'audit, non dal canary.
  **Leakage guard (enforced + metodo dichiarato)**: fatti memorizzati
  come coppie `(attribute, expected_value)` normalizzate;
  `catalog:validate` FAIL su match normalizzato (tabella di
  normalizzazione documentata) contro l'**intero payload testuale
  effettivamente inviato** (prompt renderizzato + allegati: page.md,
  focus_notes, states, contracts_summary, digest). Limite dichiarato:
  match meccanico non copre la parafrasi — guardia semantica =
  **gate `documented → in_critique`, codificato**: ogni fatto ha una
  evidence card Zod `{shotId, stateId, region, expectedValue,
  absenceCheck:{method, inputsInspected[], result, at},
  reviewerOutcome}` — `absenceCheck` registra la prova
  dell'ispezione contro gli input effettivamente allegati
  (metodo usato, quali input, esito, timestamp), non un bool
  dichiarativo — campo mancante o
  `absentFromOtherInputs:false` ⇒ il fatto non esiste ai fini del
  quorum. `reviewerOutcome` enum: `verified_absent | verified_present |
  unverifiable`. Regola di approvazione **fail-closed**:
  `ground_truth_approved` (legato alla shot-set revision) vale SOLO se
  OGNI fatto ha `reviewerOutcome=verified_absent` con evidenza
  (regione+valore+check eseguito) — un fatto `verified_present` o
  `unverifiable` è escluso dal quorum e, se il residuo scende sotto
  soglia, blocca la transizione `documented → in_critique` (precondizione
  Zod + regression test sul rifiuto). La review del Director avviene
  PRIMA del dispatch. Al re-giro
  la lista è ri-authored e ri-verificata sul nuovo shot set.
  + fixture di regressione con fatto leakato (incl. caso parafrasato) in
  `tests/catalog/**`. Timeout 180s + 1 retry;
  risultati parziali riprendibili. Il plan RPG non dichiara l'adapter
  funzionante per test propri: solo il probe reale lo prova.

- **T-005** Critique stage `scripts/catalog/critiqueComponent.mts`
  (emendato r013, `.mw/web-ai-prompt-protocol.md` P0-P5 — commission, mai
  specification): la call di critica è **due turni + probe separato**, non
  un singolo prompt ingegnerizzato.
  **Turn 1 — solicitation (commission)**: prompt libero in italiano
  colloquiale, una breath — persona+authority («sei un lead UI senior
  designer AAA») + stance («critica spietata e costruttiva») + task verb
  sugli allegati («gli allegati SONO il componente») + deliverable in
  prosa («proponi soluzioni con esempi di codice»). VIETATO in turn 1:
  `rubric_slice` (grep-block sull'intero payload: `--skin-hud-*`, nomi
  asse, anti-pattern list), verdict/JSON/schema, sezioni A/B/C, conteggi
  minimi, canary, `observed_facts`. Le slot `{component},{states},
  {contracts_summary},{focus_notes}` vivono come **payload allegato**
  (contesto, non commission) o omesso — gli shot fanno da spec; spec-text
  solo se il comportamento contrattuale conta. Commission clauses
  byte-identical tra provider (hash-enforced per capability-class).
  **Turn 2 — selection** (stessa conversazione): `rubric_slice` presentato
  come grammatica della casa — «quali delle TUE proposte la violano?
  correggile» + richiesta priorità P0-P3 al modello. La rubrica filtra le
  PROPOSTE, mai la critica (turn 1 intoccato).
  **Probe canary**: conversazione throwaway (v. T-004), mai nella
  conversazione di critica.
  **Prompt per capability-class** (invariato): image-capable vs
  text_only_fallback — commission diverse per classe (text-only: preambolo
  "TEXT_ONLY_FALLBACK — DOM snapshot + computed styles, NON presumere il
  visivo"), registrate nel journal; i digest confrontano solo omogenei;
  la capability-class è registrata per round nel digest.
  **Verdict block JSON: ELIMINATO dalla solicitation** — l'orchestratore
  estrae severity/proposals dalla prosa (turn 2 se serve); response senza
  struttura estraibile = 1 turno-2 di estrazione mirata poi `unparsed`
  journaled. Output: `critiques/` grezze + `digest.md` validato Zod con 3
  sezioni obbligatorie: **Consensus / Dissenting-minority (verbatim, mai
  persi) / Quick-wins vs Structural** + conteggio parsed-vs-unparsed;
  il quorum conta solo risposte audit-grounded.
  **Digest rules (P5)**: mapper non judge — vietati score di qualità,
  re-ranking, re-framing; ogni punto della critica preservato VERBATIM
  prima del clustering; punto non mappabile su asse rubrica ⇒ flag
  `orthogonal`, surfaced PRIMO al Director; quote-or-mapping check
  (meccanico: il digest cita solo lingua presente nella critica);
  `orthogonal_rate` per round riportato (drift alarm verso 0); grounding
  path di ammissione al quorum per provider per round (claim-audit vs
  probe); Director giudica su prosa grezza campionata.

- **T-006** Mockup stage: 2-3 proposte generate dall'orchestrator da
  digest + rubrica slice + token reali. Ogni proposta: `proposalId`,
  `type: restyle|structural`, rationale, regione cambiata, implicazioni,
  rischi contratto. **"Materialmente distinte" = differenza in ≥2 di
  {layout/gerarchia, raggruppamento info, trattamento ornamento/frame}**
  + campo "what differs" di una riga. Pilot richiede ≥1 proposta
  `structural`; `mockup:lint` respinge round all-restyle/all-same-layout;
  ≥1 proposta derivata da dissenting-minority o nota "no usable dissent".
  Nel prompt di ranking la provenance del baseline (shot reale) vs mockup
  (harness) è dichiarata per evitare bias "cleanliness". Harness HTML/CSS in sandbox isolata
  (iframe/Shadow DOM, token iniettati esplicitamente) servita su localhost
  con TTL. **Gate meccanico `mockup:lint` prima del Director**: solo token
  (niente hex/px raw fuori grammatica skin), hue-check anti-viola, no
  emoji-glifi, no stringhe letterali, lista conflitti con contratti linkati;
  proposte invalide respinte con reason registrata; allowlist per
  placeholder `data-i18n-key`; self-test su fixture (valid+invalid) in
  OB-5; confine dichiarato meccanico-vs-human-eye. Ranking AI su immagini
  **anonimizzate, ordine randomizzato, 2 passaggi a ordine invertito**;
  disaccordo tra passaggi flaggato; motivazioni obbligatorie; ranking =
  advisory (niente aggregato numerico come verdetto). Structural ⇒
  feasibility assessment = disposition ingegneristica dell'orchestrator +
  classificazione contract-impact; la review page enumera per proposta se
  la selezione implica amend INV con slot request-id pre-draftato — il
  ruling è informato, un amend non è mai autorizzato senza request-id
  Director. Output: review page
  `.mw/review/<round>/` con stato corrente, shot, digest, proposte, lint
  report, ranking individuali → **ruling Director** registrato strutturato
  (selected|reject-all|merge-composite + condizioni + conflitti + request-id
  che autorizza eventuali amend di INV) legato a proposal revision esatto.

- **T-007** (boundary) Implementer = descrizione del contratto a valle,
  NON implementazione in questo plan: per ogni ruling → nuovo task/plan
  con visual-fork baseline + obbligazioni same-viewport; al completamento
  il Documenter ri-cattura e la voce va `updated` con sezione Prima/Dopo;
  versione precedente archiviata `V<n-1>`.

- **T-008** Pilot end-to-end (boundary: fino a review page + ruling):
  voce `hud-top-tabs` (UN entry: tre linguette tempo · prossimo evento ·
  risorse + pulsanti angolo). Stati dichiarati: `default`, `resource-low`,
  `event-imminent`, `hud-hidden` (pearl). Include un **dry-run dello stage-3
  capture loop**: tweak token su branch sacrificabile → re-shot → pagina
  Prima/Dopo dimostrativa (no merge) — prova il diff machinery senza
  implementare upgrade.

- **T-009** Metrics + abort thresholds pre-dichiarati:
  `.mw/runs/plan086-*/metrics.json` — wall-time per stage, esito
  per-provider, minuti Director, shot count. Abort/review dichiarati:
  (a) provider_capable <3 dopo probe+fallback → `failed_experiment`;
  (b) documenter failure >50% sui primi 5 componenti → halt + revisione;
  (c) wall-time stage Critique >45min/componente → halt + revisione (esentato: dibattito completo su richiesta Director, ~2h attese).

## Contratto di chiusura (obbligazioni verificabili)

- `npm run lint -- <scope=scripts/catalog>` · `npm run test -- <scope=tests/catalog>` · `npm run build:check` · `npm run closure:lint`.
- OB-1: `npm run catalog:validate` PASS — manifest Zod + integrità (ID unici, driver validi, transizioni legali, artifact esistenti, link coverage, **leakage guard `ground_truth` sull'intero payload inviato**).
- OB-2: pilot `documented_full` — tutti e 4 gli stati con assertion PASS + doppio shot determinista ≤ε + meta.json completo su build pinnata per SHA.
- OB-3: **image-grounding provato end-to-end** (r013) — ≥3 provider `provider_capable` via canary probe in conversazione throwaway **E ≥3 critiche audit-grounded**: per ognuna l'orchestratore verifica ≥2 claim concreti contro la `ground_truth` indipendente (fatti assenti dal payload inviato). Probe post-critica ammesso come fallback; evidenza text-only/non-grounded NON conta e mai scartata. Sotto quorum → `failed_experiment` dichiarato + canale API-vision valutato.
- OB-4: `digest.md` Zod-valido con ≥3 critiche image-grounded, sezione dissenting presente, verbatim-preservation + flag `orthogonal` + `orthogonal_rate` + capability-class e grounding-path per round (P5).
- OB-5: ≥2 mockup materialmente distinte di cui ≥1 `structural` che passano `mockup:lint` + ranking 2-pass + review page (`human-eye`: ruling Director).
- OB-6: `catalog:stale` su fixture con tamper sintetico flagga correttamente; dry-run stage-3 produce Prima/Dopo.
- **Regressione permanente (R-247)**: `npm run test -- tests/catalog/**` — schema, transizioni di stato, invalidazione, retry-safety, capture-failure handling (fail senza feature). `src/**` non mutato (Auto-Neutral living contracts).
- **Traps ereditate**: T-04 (gli screenshot sono il testimone), T-13 (snapshot congelato), T-17 (preview buildato), T-19 (preview su ROOT), rule 16 (headless), slice-FROZEN (rubrica slice per tag, mai file interi), T-18 (`cmd|tail` exit code nei manifest command).

## Decisioni aperte

- Upload web fallisce ovunque → canale API-vision (openrouter) come provider
  aggiuntivo dell'electorate (decisione Director sul costo).
- Storage: shot di lavoro gitignored; ogni artifact referenziato da un
  ruling completato è retained durable con hash — ruling, proposal text,
  lint report, thumbnails dei round rejected conservati in git (il
  feedback dei rigetti torna come constraint). Formato WebP, viewport
  fissa (a conferma).
- Run di dibattito nel repo mind-weaver `.mw/runs/` (convenzione).

## Fuori scope

- Implementazione upgrade (plan separati). Componenti non visibili su
  `/game`. Mobile nel pilot. Dibattito completo per-componente (broadcast
  default; dibattito solo su divergenza o richiesta Director).

## Dibattito multi-AI

Richiesto dal Director. Artifact = questo plan; run
`.mw/runs/20261024-plan086-ui-catalog/` (mind-weaver). Round-1+2 dispositions:
tutte le obiezioni must-fix incorporate (round 1: state machine, SHA pinning, determinismo, staleness, mockup
gates, digest dissenting, boundary implementazione, failure taxonomy,
verdict schema, granularity=regione, links array; round 2: per-run canary
non-intrusiva + observed_facts, ε dichiarata+browser/GL meta, staleness
scoped visual-affecting + render-signature, state ownership split,
INV-amend visibility sul ruling, dissent-mockup, provenance label, lock
lease TTL, lint allowlist+self-test, parsed-quorum, per-revision rubric
gate, rejected artifacts durable, abort thresholds).

**Emendamento r013 (Director 2026-10-24, «si, emenda adesso»):** adozione di
`.mw/web-ai-prompt-protocol.md` (R-284, dibattito `20261024-prompt-protocol`,
artifact r004 converged 4/4). Motivo: il template critico r012 produceva
risposte rubric-compliance peggiori del prompt libero del Director —
commission→specification substitution. Cambiamenti: canary → conversazione
throwaway (T-004); observed_facts → audit post-hoc su claim vs ground_truth
con fallback probe e fail-closed retention (T-004/OB-3); turn 1 commission +
turn 2 selection rubricata (T-005); verdict JSON eliminato dalla solicitation,
estratti dall'orchestratore (T-005); digest rules P5 (mapper non judge,
verbatim, orthogonal flag/rate, quote-or-mapping) (T-005/OB-4); capability-class
per round nel digest. Invariati: ground_truth fixture + leakage guard + gate
`documented → in_critique`, capability-class split, state machine, boundary
implementazione, mockup gates, abort thresholds. Costo dichiarato: ~1
generazione extra per provider per critica + audit work nel digest.
Dissent registrato (grok, risolto per ablazione A3-vs-A4 P7 non voto):
rubrica in turn-1 payload; delete hat library. Verifica a posteriori:
ablazione A0-A4 (P7) pendente — se A3>A4 su entrambi i provider la riga
rubrica torna a payload.
