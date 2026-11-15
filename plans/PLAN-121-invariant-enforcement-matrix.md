# PLAN-121 — Invariant→enforcement matrix + `governance:check` + kernel slim

**Stato:** `draft` — in attesa di battesimo Director (2026-11-15). NON eseguire
prima del ruling.

**Parent:** R-342 (ops: audit contesto fisso Devin + ottimizzazione sistema).

**Fonte approvata:** `artifact-r002.md` del dibattito MW
`20261115-context-budget-audit` (CONVERGED 4/4, sha `e8f1f03f…`) — **Phase-3**
("Enforcement matrix, not blanket tiering"). Phase-1 fatta (igiene, R-342),
Phase-2 fatta via PLAN-120 (catalogo -67%). Questo plan copre solo Phase-3.

**Cosa è:** (1) la matrice invariante→enforcement — artefatto di approvazione
Director che mappa OGNI invariante a {check meccanico nominato | riga kernel
vincolante | human review}, con i gap dichiarati e approvati esplicitamente;
(2) `npm run governance:check`, orchestratore dei gate meccanici esistenti +
check nuovi AST-aware, obbligatorio per riga kernel e wired in pre-commit;
(3) mutation fixtures versionate per ogni check che licenzia demozioni;
(4) demozioni trigger **per-invariante** solo con check fixture-validated;
(5) kernel slim di `00-project-invariants` a parità di copertura; (6) test
empirici di glob-activation per `40-documentation-governance`.

**Cosa NON è:**

- non è blanket tiering / lazy-everything: `model_decision`/`manual` per
  invarianti cross-cutting = auto-selezione probabilistica, non enforcement
  (REJECTED da artifact, R1+R2 consensus);
- non demuove nessuna regola senza check meccanico nominato e fixture-validated
  — nessuna demozione precede il suo check;
- non tocca il trigger di `50-shutdown-governance`: resta `always_on`
  (WITNESS-01, sustained — le regole di session-lifecycle non hanno file
  context su cui globare; la prosa può essere compressa a checklist);
- non demuove `40-documentation-governance` a glob senza prova empirica di
  attivazione sulle superficie richieste;
- non misura il contesto (Phase-0) né re-misura (Phase-4) — task separati;
- non esprime regole/kernel in JSON o config parallele (REJECTED: shadow
  enforcement path che drifta dalla trigger machinery dell'IDE);
- non aggiunge una riga "self-check rule lists" come sostituto dell'enforcement
  (REJECTED come sostituto; può solo integrare);
- non è una superficie grafica: `visual-fork: skipped — nessuna decisione
  estetica; scope = regole/hook/script ops, puntatore: artifact-r002 Phase-3`.

## 0. Fatti verificati (2026-11-15)

- **Inventario regole** (`.windsurf/rules/`, 18 file). Trigger attuali:
  - `always_on`: `00-project-invariants`, `40-documentation-governance`,
    `50-shutdown-governance`, `55-delegation-context-budget` (4 file — la 55 è
    stata aggiunta in R-343, dopo l'audit che ne contava 3: va inclusa nella
    matrice);
  - `glob`: `10-ui-invariants`, `20-config-persistence`, `30-frozen-kits`,
    `50-interaction-patterns`;
  - `model_decision`: `10-canonical-dev-port`, `15-browser-preview-guard`,
    `16-no-foreground-windows`, `17-resource-lifecycle`,
    `45-director-intent-to-spec`, `46-approved-references`,
    `85-documentation-impact`, `mw-rpg-bridge`;
  - `manual`: `60-guardian-deploy`, `70-state-docs-sync`,
    `80-quest-rules-maintenance`, `philosophy`.
- **Binding prose fuori da `.windsurf/rules/`**: `AGENTS.md` (scene-author
  gate, visual-fork gate, pre-flight recurring-traps, cattura intent in
  RICHIESTE, no-foreground, T-04 witness, T-13 collisioni), `CLAUDE.md`
  (pre-flight pointer). Sono sorgenti della matrice come "prose vincolante
  altrove" da artifact.
- **Gate meccanici ESISTENTI componibili** (`package.json` + `scripts/`):
  `closure:lint` (compone gateCore/contractsCheck/redFirst/livingSyncGate/
  visualForkGate/intentGate/resourceLifecycleGate), `contracts:check`,
  `contracts:index-sync`, `surface:coverage:check`, `shutdown:lint-capability`,
  `foreground:lint`, `agents:lint`, `prompt:check`, `redfirst:check`,
  `trusted:check`, `lint:docs`, `i18n:validate`/`i18n:audit`, `lint:painter`,
  `check:quest-art`, `astrolabe:baseline:check`. Pattern orchestrazione già
  presente: `closureLint.ts` orchestra le funzioni `check*Gate` di
  `scripts/verification/`.
- **Invarianti SENZA check meccanico noto** (gap candidati, da confermare in
  matrice): Persistence — `eslint.config.js` ha `no-restricted-globals` solo
  per `setTimeout`/`setInterval` in `src/ui/idleVillage`, **nessun** ban su
  `localStorage`/`sessionStorage`; ad-hoc `.css` per skin (forbidden ma non
  lintato); config-first (semantica); i18n hardcoded strings (esistono
  `i18n:validate`/`audit` ma nessun gate "no stringa hardcoded" su diff);
  component-reuse; state-split; JSDoc; node pinning; command timeouts.
- **Hook infra**: `husky` ^9.1.7 installato (`prepare: husky install`),
  `.husky/_/` presente con gli internals, ma **nessun hook attivo** —
  `.husky/pre-commit` non esiste; `HUSKY_SETUP_INSTRUCTIONS.md` descrive un
  setup manuale mai completato. `lint-staged` configurato (eslint --fix su 3
  glob). → il wiring pre-commit = **creare** l'hook, non estenderne uno.
- **Convention fixtures**: `tests/fixtures/`, `tests/unit/sentinel/fixtures/`,
  `tests/e2e/idleVillage/fixtures/` — nessuna dir fixtures governance oggi.
- **Trappole rilevanti**: **T-06** (la matrice è una sintesi sopra un ledger di
  invarianti atomici → coverage check per-ID obbligatorio, altrimenti
  un'invariante non estratta sparisce in silenzio); **T-04** (un check "verde"
  non prova enforcement — la prova è la fixture violata che FALLISCE);
  **T-13** (worktree condiviso: fixtures/hook/script additivi e scoped, niente
  sweep; un failure di gate altrui non è nel nostro scope — riprova, non fixare).
- Phase-2 (PLAN-120) già chiusa: lo sviluppo check può partire subito, come da
  artifact ("runs PARALLEL to Phase 2" — non c'è più attesa).

## 0b. Regola di esecuzione (Director, 2026-11-15)

Vale la regola battezzata in PLAN-120 §0b — **esecuzione tutto d'un fiato,
unica pausa legittima = scelta non prevista che solo il Director può fare** —
con un'aggiunta strutturale per questo plan: **la matrice (T-1) è l'artefatto
di approvazione Director** ("This matrix is the Director's approval artifact",
artifact-r002). Quindi: (a) **pausa obbligata dopo T-1** per sign-off su
matrice + gap dichiarati — non è uno stop tecnico, è il gate del deliverable;
(b) ogni demozione (T-7) è subordinata a quel sign-off; (c) le D-* si risolvono
con la proposta salvo veto.

## 1. Principi

- **P1 — La matrice precede ogni demozione.** Deliverable blocking: finché la
  matrice non esiste ed è firmata, nessun trigger di regola si muove.
- **P2 — Tre sole disposizioni.** Ogni invariante ha `check:<nome>` |
  `kernel:<citazione>` | `human-review:<dove/quando>`. Niente quarta opzione:
  senza una delle tre è un **GAP dichiarato**, approvato come tale dal
  Director, non un'omissione.
- **P3 — Fixture prima della licenza.** Ogni check che licenzia una demozione
  ha una coppia versionata `violation` (MUST fail) + `clean` (MUST pass),
  verificata da `governance:check --selftest`. Check senza fixture = nessuna
  licenza.
- **P4 — governance:check compone, non duplica.** I gate esistenti restano dove
  sono e vengono orchestrati (pattern di `closureLint.ts` su `gateCore` et al.);
  i check nuovi nascono solo dove la matrice dichiara un gap colmabile.
- **P5 — Kernel slim a parità di copertura.** Il rewrite è accettato solo se la
  checklist invarianti + scenari di regressione è interamente preservata;
  ≤3KB è target, non criterio di accettazione.
- **P6 — Glob solo su prova.** `40-documentation-governance` passa a glob solo
  se i test empirici provano firing su tutte le superficie richieste
  dall'artifact; altrimenti resta `always_on` (esito conforme).

## 2. Decisioni aperte

| ID | Decisione | Proposta | Quando |
|---|---|---|---|
| D-1 | Meccanismo pre-commit | `.husky/pre-commit` che esegue `npm run governance:check -- --staged` (husky già installato e `prepare` wired; lint-staged resta per eslint-fix, non orchestrazione — governance:check è tree-scoped, non per-glob) | T-4 |
| D-2 | Formato/location matrice + ledger | `context/governance/invariant-ledger.json` (machine-readable, diffabile) + `context/governance/invariant-enforcement-matrix.md` (tabella human-facing, approval artifact). Alternativa: `src/docs/docs/governance/` (più formale, entra nel perimetro doc-governance) | T-0 |
| D-3 | Scope check nuovi v1 | v1 = solo colmare i gap ad alto valore meccanizzabile: (a) persistence forbidden-API (ban `localStorage`/`sessionStorage` fuori da `PersistenceService`); (b) skin ad-hoc `.css` (glob guard su file `.css` nuovi fuori whitelist legacy). Gli altri gap restano kernel/human finché non esiste check validato | T-3 |
| D-4 | Scope/tempo pre-commit | `--staged` (check filtrati sui file staged via mappa check→globs) default per hook; `--full` per CI/manuale. Per-check timeout ≤30s, totale ≤120s (regola command-timeouts); se il tempo reale supera la tolleranza si restringe la mappa, non si tolgono check | T-4 |
| D-5 | ID scheme ledger | `INV-<file>-<seq>` con slug: es. `INV-00-PERSIST`, `INV-40-SSOT-1`, `INV-50-CAPOWN`, `INV-AGENTS-SCENEAUTH`. ID immutabili anche se il testo si sposta | T-0 |
| D-6 | Tecnica AST | eslint rules dove il check è "vietato X nel codice" (infrastruttura `no-restricted-globals`/`no-restricted-imports` già in uso); script tsx standalone per check non-codice (frontmatter, docs, matrice). Niente grep raw come enforcement su `.ts`/`.tsx` | T-3 |
| D-7 | Destino `.husky` doc | Aggiornare `HUSKY_SETUP_INSTRUCTIONS.md` (ora descrive un setup mai fatto) oppure archiviarla come superata una volta creato l'hook reale | T-4 |

## 3. Fasi / Task

### T-0 — Ledger invarianti (estrazione atomica)

- Enumerare OGNI invariante/riga vincolante da: `00-project-invariants` (15
  sezioni), `40-documentation-governance`, `50-shutdown-governance`,
  `55-delegation-context-budget`, binding prose di `AGENTS.md` + `CLAUDE.md`,
  e i binding-core auto-dichiarati non-negoziabili delle regole
  non-always-on (per completezza di matrice — la loro disposizione resterà
  `human-review`/`kernel` salvo check esistente).
- Ogni voce: `{id, source_file, source_anchor, binding_text, current_trigger}`.
  Doppio pass anti-T-06: estrazione per file + grep su marker vincolanti
  (`MUST`, `FORBIDDEN`, `mai`, `never`, `sempre`, `VIOLATION`, `blocking`)
  per pescare righe sfuggite alla prima passata.
- **Deliverable:** `invariant-ledger.json` (D-2/D-5) + conteggio per sorgente.

### T-1 — Matrice invariante→enforcement (DELIVERABLE 1, blocking)

- Per ogni voce ledger: `enforcement` ∈ {`check:<nome-script>` |
  `kernel:<citazione-riga>` | `human-review:<dove>`} + note.
- Invarianti senza check né kernel → `GAP` con `gap_approval: pending`; il
  Director approva ogni gap esplicitamente (la matrice È l'artefatto).
- `scripts/verification/invariantMatrixCheck.ts`: exit ≠0 se un ID del ledger
  manca dalla matrice, ha enforcement vuoto, o un GAP non ha
  `gap_approval` compilato.
- **PAUSA OBBLIGATA** (§0b): consegna matrice al Director; T-7 non parte prima
  del sign-off. T-2/T-3 (check development) possono procedere — l'artifact
  non subordina lo sviluppo dei check alla firma, solo le demozioni.
- **Deliverable:** matrice + script + report gap per il ruling.

### T-2 — `npm run governance:check` (orchestratore v1)

- `scripts/verification/governanceCheck.ts`: esegue i gate pertinenti in
  sequenza (lista esplicita nel file: `contracts:check`,
  `contracts:index-sync`, `shutdown:lint-capability`, `foreground:lint`,
  `agents:lint`, `prompt:check`, `trusted:check`, `i18n:validate` + check nuovi
  T-3), per-check timeout (default 30s), report tabellare con exit code +
  durata, exit aggregato.
- Modi: `--full` (default), `--staged` (filtra check per file staged via mappa
  check→globs nel file), `--selftest` (batteria fixtures T-3).
- Riga kernel aggiunta a `00-project-invariants`: *"run `npm run
  governance:check` before declaring a task done"* (mandate da artifact).
- **Deliverable:** script + voce `governance:check` in `package.json` + riga
  kernel.

### T-3 — Check nuovi + mutation fixtures (scope D-3)

- Check candidati v1: (a) **persistence** — ban `localStorage`/`sessionStorage`
  fuori da `PersistenceService` (estensione `no-restricted-globals` in
  `eslint.config.js` o script tsx AST-aware; eccezioni documentate e
  versionate: il service stesso, riferimenti third-party legittimi);
  (b) **skin ad-hoc css** — nessun `.css` nuovo fuori da whitelist legacy
  versionata (guard su file staged/creati).
- Per OGNI check (nuovi + esistenti che licenziano demozioni):
  `tests/fixtures/governance/<check-id>/violation.*` (MUST fail) +
  `clean.*` (MUST pass) + README di intent — versionati.
- `governance:check --selftest` fallisce se una fixture `violation` passa o
  una `clean` fallisce → il check non è licensed e la sua demozione non
  può avvenire.
- **Deliverable:** check + fixtures + selftest verde.

### T-4 — Wiring pre-commit (D-1/D-4)

- `.husky/pre-commit` (executable): `npm run lint:staged` + `npm run
  governance:check -- --staged`; exit ≠0 → commit bloccato. L'agente vede i
  failure al commit, non solo in CI (artifact).
- Prova meccanica su branch/worktree di prova (T-13: niente commit nel
  worktree principale che catturi lavoro altrui): staged file con violazione
  seeded → rifiutato; staged clean → passa. Log nel report.
- `HUSKY_SETUP_INSTRUCTIONS.md` allineato o archiviato (D-7).
- **Deliverable:** hook + prova + doc.

### T-5 — Glob-activation empirico per `40-documentation-governance`

- Batteria sulle superficie richieste dall'artifact: write via edit-tool, shell
  redirect (`echo > x.md`), file rename, `.md` nested, `.md` appena creato —
  verificare se la regola con trigger `glob` scelto si attiva nel loader.
- Report `.mw/runs/plan121-glob-activation/report.md` con esito per superficie.
- Demozione a glob SOLO se firing provato su tutte le superficie; altrimenti
  resta `always_on` — entrambi gli esiti chiudono il task.
- **Deliverable:** report + (se verde) nuovo frontmatter, altrimenti nota.

### T-6 — Kernel slim a parità di copertura

- Checklist obbligatoria: per ogni ID ledger marcato `kernel:` la riga
  vincolante deve essere presente (verbatim o equivalenza dichiarata in
  matrice) nel kernel riscritto, scenari di regressione inclusi.
- Rewrite di `00-project-invariants`; compressione prosa di
  `50-shutdown-governance` a checklist **con binding lines intatte**
  (artifact: "may be compressed to checklist form while keeping binding
  lines"); `50` resta `always_on` — frontmatter intoccato.
- `invariantMatrixCheck.ts --kernel`: exit ≠0 se un ID `kernel:` non ha
  citazione presente nel kernel riscritto.
- ≤3KB target per il kernel — **target, non criterio**: vince la parità.
- **Deliverable:** kernel riscritto + `--kernel` verde.

### T-7 — Demozioni per-invariante

- Solo per invarianti/righe con: check fixture-validated (selftest T-3 verde)
  E sign-off Director sulla matrice (T-1). Una demozione alla volta, registrata
  nella matrice (`demoted_on`, `licensed_by_check`) — niente demozioni ombra.
- `50-shutdown-governance` e `55-delegation-context-budget` non sono candidate
  (session-lifecycle: nessun file-context — artifact WITNESS-01 per la 50;
  stessa logica per la 55).
- **Deliverable:** matrice aggiornata con le demozioni licenziate (possibile
  che in v1 siano poche — esito conforme).

### T-8 — Verifica + docs + report

- `governance:check --full` verde, `--selftest` verde, `invariantMatrixCheck`
  verde; `closure:lint` sui file del plan.
- Update: R-342 (Phase-3 → fatta; residuo Phase-0/4), `plans/INDEX.md` riga
  PLAN-121, evidence log `test-results/` (regola 40), run dir
  `.mw/runs/plan121-*/`.
- Commit scoped (plan + ledger + matrice + script + fixtures + hook + kernel
  rewrites) — niente sweep (T-13).
- **Deliverable:** report + docs + bundle.

## 4. Contratto di chiusura (verification.json → verify:bundle → bundle.json)

| OB | Tipo | Obbligazione | Blocking |
|---|---|---|---|
| OB-1 | state | Ledger + matrice esistono ai path dichiarati (D-2); `tsx scripts/verification/invariantMatrixCheck.ts` exit 0: ogni ID del ledger ha `enforcement` non vuoto, ogni `GAP` ha `gap_approval` firmato | sì |
| OB-2 | state | `npm run governance:check -- --full` esiste in `package.json` ed esce 0 su tree pulito; il report elenca ogni check composto con exit code e durata ≤ timeout | sì |
| OB-3 | state | `npm run governance:check -- --selftest` exit 0: ogni `tests/fixtures/governance/*/violation.*` fallisce il suo check, ogni `clean.*` passa; nessun check licenzia demozioni senza coppia fixture | sì |
| OB-4 | state | Hook attivo: `.husky/pre-commit` (o meccanismo D-1) esegue `governance:check --staged`; prova registrata: commit con fixture-violazione rifiutato, clean accettato | sì |
| OB-5 | state | `40-documentation-governance`: report glob-activation copre edit-write + shell-redirect + rename + nested/new `.md`; se demossa, frontmatter `glob` + PASS su tutte le superficie; se non demossa, `trigger: always_on` intatto | sì |
| OB-6 | state | `50-shutdown-governance` e `55-delegation-context-budget` frontmatter `trigger: always_on` invariati (check meccanico sul frontmatter); binding lines di 50 presenti nella forma compressa (citazioni nel ledger) | sì |
| OB-7 | state | Kernel parity: `invariantMatrixCheck.ts --kernel` exit 0 — ogni ID `kernel:` ha la sua citazione vincolante nel kernel riscritto; diff frontmatter confinato: trigger modificati SOLO sui file/licenze elencati in matrice | sì |
| OB-8 | human-eye | Sign-off Director sulla matrice (gap approvals + demozioni licenziate) registrato nella matrice stessa | sì |
| OB-9 | state | Docs: R-342 aggiornata (Phase-3 fatta), `plans/INDEX.md` riga PLAN-121, evidence log `test-results/` + run dir `.mw/runs/plan121-*/`, `HUSKY_SETUP_INSTRUCTIONS.md` risolta (D-7) | sì |

**Nota R-247/equivalente:** il task non muta codice di gioco — il "test di
regressione permanente" è la coppia fixture per check + `--selftest`
rieseguibile (OB-3) + `invariantMatrixCheck` come guard permanente della
matrice (OB-1/OB-7). Nessuna eccezione silentiosa: dichiarata qui.

## 5. Rischi / note

- **Ledger incompleto = matrice incompleta (T-06).** Il punto fragile è
  l'estrazione, non la tabella: un'invariante non enumerata sparisce senza
  traccia. Mitigazione: doppio pass (per-file + grep su marker vincolanti) +
  review Director della matrice (è il suo artefatto).
- **`governance:check` rallenta i commit.** Mitigato da `--staged` + timeout
  per-check; se il tempo reale supera la tolleranza si restringe la mappa
  check→globs (D-4), non si silenziano check.
- **Check nuovi rompono file legacy fuori scope.** Whitelist/eccezioni
  versionate; se un check ha troppo rumore sul codice esistente si parte in
  modalità staged-only (solo file toccati) e si estende dopo.
- **Glob-activation non ispezionabile.** Se il loader non espone come
  verificare l'attivazione, `40` resta `always_on`: l'artifact richiede prova
  PRIMA della demozione, non il contrario.
- **La riga kernel che manda governance:check è essa stessa prosa.** Come la
  safety-net line del rejected: integra l'enforcement meccanico (l'hook è la
  parte dura), non lo sostituisce — dichiarato.
- **Dibattito sul plan:** non proposto — direzione già validata da
  artifact-r002 (CONVERGED 4/4); critica leggera = self-review.
