# PLAN-045: Gate d'intento — plan e risultato contro desiderata + chiarimenti Director

**Status:** `baptized (2026-10-17)` — approvato dal Director dopo dibattito
multi-AI (`mind-weaver/.mw/runs/20261017-plan045-intent-gate/`,
decision_memo; ~96 obiezioni disposizionate su 12 revisioni;
ACCEPTED: gemini web ×7 + gemini API, nemotron API; chatgpt+grok
provider_dead; claude/deepseek non rivalutati post-cap ma ogni
obiezione assorbita)
**Desiderata:** v33 FROZEN (2026-10-17) · **Richiesta:** R-210
**Relazioni:** complementare a PLAN-044 (v32, gate meccanici contratto→evidenza).
v33 copre l'asse intento→risultato: l'unico punto del workflow in cui un
giudice LLM è ammesso come gate.

Revisione r012: assorbe l'unica obiezione bloccante del round di
verifica API (nemotron — portabilità): la chiave HMAC di
`mw-director-answer` non è vincolata a macOS Keychain ma a una
**sorgente chiave astratta** con priorità: `security
find-generic-password` (macOS), file `~/.mw/director-key` chmod 600
fuori dal worktree, o variabile `MW_DIRECTOR_HMAC_KEY_FILE`. TTY
reale e firma HMAC-SHA256 sul record strutturato restano obbligatori.

## Invarianti (da v33 FROZEN — non eludibili)

- `fatta`/`completed` richiede **bundle PASS + intent status ∈
  {PASS, WAIVED, SKIPPED_TRIVIAL}**. Intent rosso = plan non concluso,
  con diagnosi plan-stage vs execution-stage ancorata a evidenza.
- Pannello di AI esterne (multi-provider, API, ≥3 per item) in contesto
  pulito: ledger + manifest + plan hash-ato + digest evidenze,
  **mai il diff**, mai conversazioni.
- **Slice FROZEN, mai `desiderata.md` intero** — invariante globale per
  ogni tool/skill/agente/consumatore indiretto.
- Check plan-vs-desiderata **pre-battesimo** legato alla chiusura da un
  record di disposizioni per-ID.
- Giudizio estetico resta `human-eye` + signoff Director.
- Run browser/capture headless o in background.

## Protocollo del gate (regole fisse)

### P1 — Slice e enumerazione item

- `desiderata-slice` emette: testo slice con marker
  `X-Desiderata-Slice: vNN + sha256` e **item list machine-readable**
  (`vNN.item-N`) — universo chiuso per la coverage per-ID.
- `slice_sha256` in hash chain; l'accessor ricalcola e rifiuta su
  mismatch; i consumatori rifiutano input senza marker.

### P2 — Intent ledger

- `.mw/runs/<task>/intent.md`, **append-only**, diviso in **epoch**:
  un emendamento di plan post-battesimo appende un seed `epoch-N+1` che
  referenzia plan hash vecchio e nuovo; il gate valuta solo gli item
  attivi dell'ultimo epoch; i contatori dei cap sono per `item_id` e
  continuano tra gli epoch; il nuovo epoch richiede di nuovo bundle PASS
  e lock red-first (PLAN-044).
- **Epoch N+1 ammesso solo con re-battesimo Director** registrato come
  `director_answer` su record `epoch-rebaptism` (matrice P5; l'executor
  non può ribasare il perimetro da solo). L'emendamento semantico del
  plan per rework plan-stage usa la risposta `rebaptize(plan_hash
  semantico)`; `amend-desiderata` solo se cambiano le desiderata.
- **Monotonia = copertura di lineage** (chiude claude-5/round-4):
  ogni item attivo dell'epoch N deve comparire in N+1 come foglia
  **oppure** avere una catena `superseded_by` confermata verso foglie
  attive di N+1. Item che scompare senza catena → rosso. `manifest_plan`
  è per-epoch (`manifest_plan_sha256[epoch]`); la monotonia si valuta
  **tra epoch consecutivi**: una rimozione richiede `director_answer`
  esplicito con diff — rimozione autorizzata → verde (chiude
  deepseek-B4).
- `clarify` può appendere **solo item additivi** (nessun
  `superseded_by`); ogni supersessione — parziale o split — passa solo
  per `amend-desiderata`.
- Entry: `item_id | class | source | hash`. Mutazione/cancellazione →
  `closure:lint` rosso.
- Classi con default conservativo: `intent-check` default; `technical`
  richiede un obligation ID esistente nel contratto meccanico;
  `human-eye` richiede testo esplicitamente soggettivo/estetico.
- **Tabella transizioni di classe, totale sulle 6 coppie ordinate**:
  libere le transizioni che aggiungono controllo (`technical →
  intent-check`; `technical → human-eye` solo se il testo è
  esplicitamente estetico). Sul percorso gap (awaiting o waiver):
  `human-eye → *` (rimuove signoff), `* → technical` (rimuove
  scrutinio pannello), `intent-check → human-eye` (rimuove verdetto di
  fedeltà) salvo split deciso dal Director via `amend-desiderata`.
  Una riclassificazione consuma il cap nella re-eval che innesca.
- **`misclassified` → verdetto `contested`**: il provider che flagga
  emette comunque un verdetto di coverage marcato `contested`: conta
  ai fini del quorum, può contribuire a `gap` ma **mai a `covered`**
  (il flag non vale come assenso — chiude deepseek-B3 + claude-5/r6,
  senza regalare a un provider solo il potere di rompere il quorum).
  Se `count(misclassified) > n/2` → `class-dispute`, che ha
  **precedenza** su ogni altro stato dell'item: torna all'executor per
  riclassificazione + re-eval del solo item (consuma il cap); seconda
  disputa → `awaiting_director`. La funzione di status esclude da PASS
  qualunque item con flag maggioritario non risolto.
- Precedenza: chiarimento Director in sessione > item FROZEN, con
  `superseded_by`. Lo scope della supersessione è un **campo tipizzato
  del `director_answer`** — `integral | partial`, con `residual_text`
  obbligatorio se partial; default `partial`; mai deciso dall'executor.
  Integrale solo se il chiarimento dichiara esplicitamente di sostituire
  l'intero requisito (chiude chatgpt-O12 + claude-6).
- **Provenienza vincolata**: `closure:lint` verifica
  `hash(riga RICHIESTE.md) == hash(verbatim nel record director_answer)`
  e l'identità Director nel record; una riga RICHIESTE aggiunta
  dall'executor che cita un director_answer estraneo non vale.
  Inoltre un `director_answer` è valido solo se emesso dal comando di
  gate (`mw-director-answer`) che **richiede TTY reale** (rifiuta
  stdin piped/here-doc/env) e **firma il record con HMAC-SHA256**
  la cui chiave proviene da una **sorgente astratta non leggibile
  dal worktree**, risolta in questo ordine: (1) macOS Keychain via
  `security find-generic-password` (prompt di autorizzazione di
  sistema = gate umano); (2) file `~/.mw/director-key` chmod 600
  fuori dal worktree; (3) variabile `MW_DIRECTOR_HMAC_KEY_FILE`
  che punta a un file fuori dal worktree. Su piattaforme senza
  Keychain le opzioni (2)/(3) mantengono il gate senza bloccare
  CI/Linux (chiude nemotron-1/api). `closure:lint` ricalcola l'HMAC sull'**intero record strutturato**
  `(gate, item_id, tipo_risposta, target, verbatim, epoch)` — un
  retype/replay invalida la firma (chiude deepseek-B2/r10); senza
  firma valida il record è
  `unconfirmed` (chiude claude-1/r9 + deepseek-B1/r9). L'evento è
  registrato nel journal con `tty_attested`, timestamp e nonce.
  `RICHIESTE.md` è verificato append-only contro git
  rispetto al commit di battesimo. Supersessione senza queste
  verifiche = `unconfirmed` →
  blocca il gate (chiude claude-6 + claude-9).
- **La conferma di supersessione non avviene nel riepilogo di signoff**:
  passa solo per `director_answer` tipizzato `amend-desiderata` → epoch
  N+1 → nuovo ciclo di gate. Il signoff finale conferma solo lo stato
  degli item dell'epoch corrente, non lo modifica (chiude deepseek-B5).
- Item attivi = foglie del grafo di supersessione. **Supersessione
  parziale = split dichiarato**: il nodo origine ha due figli foglia
  legittimi (`residual` dal `residual_text` + `clarification`). La
  regola >1 foglia → `ambiguous` si applica solo a rami con un arco
  senza `kind: partial` dichiarato (chiude claude-7 + deepseek-N4).
- `RICHIESTE.md`, `plans/`, `context/`, le directory di rules entrano
  nelle classi "loaded" (mai trivial-skippable).
- **Seed del ledger** = record del check pre-battesimo (P8). L'executor
  non può scostarsene senza una riga `misclassified` contestabile.
- Multi-slice: alla creazione si dichiara per ogni coppia
  `non-conflicting` o precedenza `vNN > vMM`; conflitto non dichiarabile
  = drift desiderata.

### P3 — Pannello

- ≥3 provider **API** per item (configurabili, MW-P-016). Structured
  output/JSON mode; ≤1 repair retry. **Due classi di fallimento
  distinte** (chiude claude-3/r7): fallimenti **call-level** (timeout,
  errore HTTP, JSON/schema non parsabile) ripetuti 2× →
  `PROVIDER_MALFORMED` per la run → fallback su backup; **omissioni o
  invenzioni di item_id** → sempre esclusione per-item dopo 1 retry,
  nessun backup.
- **Pool backup**: solo provider `calibrated` (stato nel config,
  verificato da `closure:lint`); selezione deterministica per ordine
  dichiarato; un backup della stessa model-family di un provider valido
  non è eleggibile; nessuno eleggibile → `BLOCKED_INFRA`.
- **Provider valido** = esattamente un verdetto per ogni item_id attivo,
  senza duplicati né ID ignoti; altrimenti malformed → 1 retry →
  escluso per quegli item.
- Payload: ledger (epoch corrente) + `verification.json` + plan
  hash-ato + digest evidenze + allowlist path citabili. Nessun diff.
- **Digest pipeline deterministico, mai LLM**: estrazione per
  `evidence_locator` (regex/jsonpath). Ogni evidenza — required o
  aggiunta dall'executor — dichiara il suo locator (`verification.json`
  per le required; **addendum hash-ato di `manifest_closure`** per le
  aggiunte). Un'aggiunta senza locator non è citabile e non entra nel
  change-detection (chiude claude-4/r5). Regione estratta ≤32KB;
  `digest_strategy: full|windowed` in `intent.json`. Locator non
  soddisfacibile entro il budget → `unverifiable`, mai troncamento
  silenzioso né summary generato come prova.
- **Normalizzatore per change-detection**: specifico per tipo di
  artefatto + schema, con allowlist esplicita dei campi eliminabili
  (dichiarata per tipo). Campo sconosciuto, schema cambiato o
  normalizzazione non verificabile → rivalutazione forzata, mai
  conservazione del PASS (chiude chatgpt-O-02).
- Alfabeto verdetti dipendente dalla classe:
  - `intent-check|technical` → `covered | gap | unverifiable`
  - `human-eye` → `classification_verdict: legitimate|illegitimate`
    con citazione.
- **Citazione validata meccanicamente**, in **due domini** (chiude
  claude-3/r8): (i) **evidenza** — sottostringa verbatim di un
  segmento estratto del digest in `manifest_closure`; (ii)
  **specifica** — segmento verbatim dei file hash-ati nella catena
  (ledger epoch corrente, plan battezzato, `verification.json`,
  slice): usato per criterio, legittimità di classe, mapping
  pre-battesimo e `not-applicable`. `covered` richiede entrambe le
  citazioni; validazione identica nei due domini (path ∈ allowlist,
  excerpt verbatim, hash == catena). Mai su campi di summary.
- `covered` richiede la catena `item_id → criterio di accettazione →
  evidenza puntuale che soddisfa il criterio`; una citazione autentica
  ma irrilevante non basta (chiude chatgpt-O13).
- `misclassified` = meta-flag, non verdetto di coverage.
- Aggregatore = script deterministico, mai LLM.
- **Nessuna cache di verdetti** (gemini-1): ogni re-eval riesegue le
  chiamate per gli item interessati. Il **change-detection** opera
  sull'insieme di **tutte le evidenze collegate all'item in
  `manifest_closure`** (obbligazioni, locator, aggiunte dell'executor)
  più `item_hash`: item senza variazione di hash normalizzato non
  vengono riesaminati; un re-eval executor-richiesto a hash invariato è
  rifiutato (eccezione: re-panel di integrità per config/prompt/model,
  vedi P5). Le citazioni sono ammesse su **tutto `manifest_closure`**
  (required del plan + aggiunte), purché ogni file sia hash-ato nella
  catena (chiude claude-2 e il buco cross-ruling: `manifest_plan` ⊆
  `manifest_closure` mantiene il vincolo required).

### P4 — Voto e quorum

- **Quorum per-item**: ogni item richiede ≥3 verdetti validi; item con
  <3 → `unverifiable` per-item → awaiting_director. `BLOCKED_INFRA` è
  riservato al caso in cui **nessun** item raggiunge il quorum.
- Funzione di voto per item `intent-check|technical` su n voti validi:
  `gap` blocca se `count(gap) > n/2`; altrimenti `covered` passa se
  `count(covered) > n/2`; ogni altro caso → awaiting_director.
- Funzione di voto per item `human-eye`: vota su
  `classification_verdict` — `illegitimate` blocca se `count > n/2`;
  `legitimate` con maggioranza stretta → stato
  `human-eye-pending-signoff`; altrimenti awaiting.
- **Split di un `illegitimate` = evento Director, non aggregatore**
  (chiude claude-8 + deepseek-B1): il record va `awaiting_director` con
  richiesta `clarify`; il Director emette i sotto-item `derived_from`
  via `amend-desiderata` → epoch N+1 (sono item del nuovo epoch,
  riclassificati per P2 — non entrano nell'universo chiuso della item
  list corrente, coerente con P1). `closure:lint` verifica che
  l'unione dei sotto-item copra il testo originale.
- **`unverifiable` ha due tipi**: `verdict-unverifiable` (evidenza
  presente, non probante → matrice `clarify | waive | amend-desiderata`)
  e `quorum-short` (item con <3 verdetti validi → matrice
  `retry-panel | waive-infra`; retry non consuma cap perché non ci sono
  verdetti; `waive-infra` si espande per-item come per `BLOCKED_INFRA`)
  — chiude claude-4.
- `origin` per ogni `gap`: **discriminatore meccanico sul seed record**
  (P8) — item con disposizione `task/gate` nel seed → `execution-stage`;
  item `open` o senza mapping → `plan-stage`; se il seed non decide,
  fallback: citazioni ∩ artefatti required di `manifest_plan`
  (execution) vs assenza (plan); residuo `ambiguous` → voto dei soli
  provider che hanno votato gap; maggioranza stretta o awaiting
  (chiude claude-8 + deepseek-N3; sostituisce il computo su
  `verification.json` corrente).
- `BLOCKED_INFRA` (nessun item raggiunge il quorum): retry-panel senza
  consumare il cap; dopo K tentativi il Director può emettere **un solo
  atto `waive-infra`** che il parser espande in N record per-item
  (ciascuno con item_hash, evidence_hash, verbatim, identità — chiude
  claude-11); tag metrico separato.

### P5 — Hash chain e stati

- **Funzione di status** (chiude claude-1 + chatgpt-O-03):
  `PASS` se e solo se ogni item attivo è `covered` **oppure** `human-eye`
  con signoff Director valido **oppure** `waived`. `WAIVED` = `PASS`
  con almeno un waiver (riportato come tale).
  `human-eye-pending-signoff` è **non terminale**: blocca `fatta` finché
  non esiste un signoff per ogni item human-eye attivo. Item con flag
  `misclassified` maggioritario non risolto, `pending` o `awaiting` →
  status non valido → non chiudibile.
  **Tabella `item_state` totale** (chiude claude-4/r8/r9): `covered`
  → soddisfa; `human-eye` + signoff valido → soddisfa;
  `waived`/`waived-infra` → soddisfa (conta waiver);
  `not-applicable` non riattivato → soddisfa; `not-applicable`
  riattivato → blocca fino a giudizio; `open` con `plan_waived` →
  richiede `covered`; `gap`/`unverifiable`/`class-dispute`/
  `unconfirmed` → blocca; `contested` conta verso `gap`, mai verso
  `covered`; `human-eye-pending-signoff`/`pending`/`awaiting` →
  non terminale; `technical` risolto da evidenza meccanica nel
  percorso SKIPPED_TRIVIAL → soddisfa. **Default-deny**: stato non
  elencato → blocca. **Regola di transizione** (chiude claude-4/r9):
  waiver/signoff decaduto → l'item torna allo stato dell'ultimo
  verdetto non disposto (`gap`/`cap-exhausted` → riemette quel
  record; altrimenti re-eval correttivo ammesso che consuma cap).
  OB-21 verifica la totalità enumerando le righe contro il registro
  unico.
- **Signoff vincolato**: valido solo per l'esatto `(item_id, epoch,
  item_hash, plan_hash_semantico, evidence_hash)` — ogni item derivato
  richiede un **nuovo signoff** (chiude chatgpt-O-01/r4). Per
  `human-eye` senza artefatto required, `evidence_hash: null` è
  tipizzato e ammesso; la decadenza scatta su cambio di `item_hash` o
  `plan_hash_semantico`, di `evidence_hash` se non nullo — e, per
  signoff con `evidence_hash: null`, su cambio di
  `changed_files_sha256` (il risultato visto non è più quello firmato —
  chiude claude-6/r5).
- `intent.json` lega: `task_id`, `run_id`, `epoch`, `slice_sha256`,
  `ledger_sha256`, `manifest_plan_sha256_chain` (lista `{epoch,
  sha256}`) + `manifest_plan_sha256_current`. **Il ledger contiene, a
  ogni seed di epoch, lo snapshot completo delle tuple**
  `(path, locator, obligation_id)` di `manifest_plan` e di
  `verification.json` — append-only le copre; il lint calcola gli
  insiemi dagli snapshot (non dagli hash: chiude claude-4/r7) e
  verifica `required(plan[N]) ⊆ required(plan[N+1])` salvo
  `director_answer` con diff, e `required(plan[epoch corrente]) ⊆
  required(manifest_closure)`. Locator/obbligazioni required mutati
  fuori epoch → rosso (chiude claude-3/r6).
  `manifest_closure_sha256`, `changed_files_sha256`,
  `params_sha256_snapshot` (tabella parametri **snapshot nel ledger al
  seed di epoch** — la tabella live che cambia in un'altra sessione si
  applica solo ai task che iniziano dopo: chiude claude-6/r7),
  `map_golden_sha256_snapshot` (mappa consumer→path snapshot nel
  ledger al seed), `panel.config_sha256` (config risolta: provider +
  model id pinnato + `prompt_sha256` + `schema_version` + sampling;
  esclusi timeout e backup non invocati),
  `panel.effective_providers` (set ordinato hash-ato di chi ha
  prodotto ≥1 verdetto valido; fallback list ordinata inclusa nella
  config), per-item
  `verdict|origin|citations|class|input_vector_hash`.
- **Operazione `reseal`** (meccanica, senza chiamate di pannello —
  chiude claude-2/r6): ricalcola i campi di catena, copia i verdetti
  il cui `input_vector_hash` è identico (vedi sotto), rivaluta il
  predicato trivial, e **appende entry `signoff-invalidated`** al
  ledger per ogni signoff con `evidence_hash: null` (l'append-only è
  rispettato; `intent.json` referenzia l'entry; lo stato letto è il
  più recente — chiude deepseek-B2/r7). La variazione di
  `changed_files` per sé → `reseal`; il rosso resta per divergenza tra
  lista dichiarata e lista calcolata da git.
- **`input_vector_hash` per verdetto** = `(item_hash, refines_hash,
  evidence_hashes normalizzati, panel.config_sha256,
  plan_hash_semantico, epoch, verification_json_sha256[epoch],
  params_sha256_snapshot)` (params incluso: chiude deepseek-B2/r8).
  `reseal` copia il verdetto solo se il vettore corrente è identico;
  la change-detection usa lo stesso vettore (chiude claude-2/r7 +
  deepseek-B1/r7). Qualunque disposizione (`waiver` o `signoff`) con
  `evidence_hash: null` decade su variazione di
  `changed_files_sha256` (chiude claude-2/r7).
- **Due inventari distinti** (chiude deepseek-B3/r9):
  `changed_files_for_integrity` — esclude i file generati dal gate
  (`.mw/runs/<task>/**` e append del canale Director in RICHIESTE.md)
  e alimenta `changed_files_sha256` (chiude claude-2/r8 — livelock);
  `changed_files_for_predicates` — include **tutto**, usato da P6(a)
  predicato trivial e P8 surface-check (un ledger `intent.md` mutato
  resta visibile al predicato; una surface che copre `.mw/` riattiva
  il `not-applicable`). `plan_hash_semantico` è calcolato solo
  sulle sezioni dichiarate (tabella task, contratto OB,
  `plan_disposition`) — status e campi di avanzamento esclusi.
- **`epoch-reeval` (chiude claude-5/r8)**: la rivalutazione dovuta
  solo a variazione di epoch/vettore su un item il cui ultimo
  verdetto era `covered` non consuma il cap per-item (che si consuma
  solo su rivalutazione correttiva dopo `gap`/`unverifiable`); conta
  nel `GLOBAL_INVOCATION_CAP` e non è soggetta a
  `MAX_INTEGRITY_REPANEL`.
- **Ordinamento del lint** (chiude deepseek-B2/r9): `closure:lint`
  esegue **prima** l'espansione `surface(changed_files_for_predicates)`
  via mappa file→surface PLAN-044, **poi** calcola la tabella
  `item_state`. Se la mappa non è disponibile (dipendenza non
  landed), ogni `not-applicable` è trattato come `pending` → non
  soddisfa, forza giudizio. **Default-deny su file non mappati**
  (chiude claude-3/r9): un changed file senza surface riattiva
  tutti i `not-applicable` del task.
- `closure:lint` richiede: `required(manifest_plan[epoch corrente]) ⊆
  required(manifest_closure)` calcolato dagli **snapshot tuple nel
  ledger**; monotonia tra snapshot di epoch consecutivi; config
  ricalcolata == hash; catena valida contro **il task/run attivo**
  (niente riferimenti
  cross-run).
- **Tabella esiti su mismatch** (chiude claude-3/4 r4 + deepseek-B4):
  - **Rosso** (integrità violata): ledger mutato, `manifest_plan`
    ridotto **rispetto all'epoch precedente senza `director_answer`
    con diff**, manifest ridotto sotto required, locator/obbligazioni
    required modificati fuori epoch, slice, run_id/task_id,
    changed-file list divergente da git, RICHIESTE non append-only,
    **divergenza tra lo snapshot dell'epoch corrente nel ledger e
    quello dichiarato in `intent.json`** (params, mappa, tuple);
    l'append di un nuovo snapshot per epoch N+1 è legittimo e
    tracciato dalla monotonia (chiude deepseek-B1/r10). Il ricalcolo
    live divergente dallo snapshot resta warning, non rosso.
  - **Re-panel di integrità** — ristretto alle **variazioni lato
    pannello** (config, prompt, model id, schema_version): rivaluta
    solo gli item il cui verdetto era stato prodotto con la config
    precedente; non consuma il cap per-item ma è bounded da
    `MAX_INTEGRITY_REPANEL` (valore scritto nel contratto); al tetto →
    record `integrity-cap-exhausted` (matrice `waive |
    amend-desiderata`), NON `BLOCKED_INFRA`. Un'aggiunta a
    `manifest_closure` NON è mismatch di integrità: passa per
    change-detection + cap per-item (chiude il vote shopping di
    claude-4/r4).
  - **Re-eval executor** (consuma il cap per-item): ammesso solo se
    l'hash normalizzato dell'insieme evidenze dell'item è cambiato.
- **Plan hash normalizzato** (chiude deepseek-B2): si legano
  `plan_hash_cosmetico` e `plan_hash_semantico` (campi volatili rimossi
  per lista dichiarata: whitespace, ordinamento celle). Solo variazione
  del **semantico** invalida l'intent PASS → riesegue il check
  pre-battesimo (epoch N+1 con re-battesimo); variazione cosmetica →
  re-hash del record `plan_disposition`, nessun re-check
  (chiude chatgpt-O14 nella forma corretta).
- Preflight meccanico prima del pannello: manifest-hash + inventario
  artefatti required (derivato da `verification.json`, l'executor
  aggiunge ma non rimuove/ridefinisce) + hash dei file prodotti.
  Mismatch → integrità, non verdetto.
- State machine condivisa (PLAN-044 T-003): record indicizzati
  `(gate, item_id)` con campo `precondition` `{bundle, quorum, panel}`;
  un `director_answer` scarica solo il proprio record.
- `director_answer` tipizzato **per tipo di record** — matrice parser
  **totale** (un solo registro; ogni tipo emesso ha ≥1 risposta —
  chiude claude-2/6):
  - `BLOCKED_INFRA` → `retry-panel | waive-infra`
  - `quorum-short` → `retry-panel | waive-infra`
  - pareggio / `verdict-unverifiable` / `gap` (incluso `gap` su item
    con `plan_waived: true` — il waive-plan-gap è un atto
    pre-battesimo, non un waiver a chiusura; chiude deepseek-B3/r8)
    → `clarify | waive | amend-desiderata`
  - `cap-exhausted` → `clarify | waive | amend-desiderata`
  - `integrity-cap-exhausted` → `waive | amend-desiderata`
  - `global-ceiling-exhausted` → `waive | amend-desiderata`
  - `ambiguous` (DAG, origin) → `clarify | amend-desiderata`
  - `class-dispute` / `illegitimate` → `clarify | amend-desiderata`
  - `unconfirmed` (supersessione) → `amend-desiderata`
  - `epoch-rebaptism` → `rebaptize(plan_hash_semantico) |
    amend-desiderata`
  - **pre-battesimo** `gap`/pareggio → `revise-plan | waive-plan-gap |
    amend-desiderata` (`waive-plan-gap` vale solo a livello plan, mai
    come waiver a chiusura); pre-battesimo infrastrutturale →
    `retry-panel` (niente `waive-infra` prima del battesimo).
  - risposta fuori tabella → rifiutata dal parser.
- `clarify` su `cap-exhausted` autorizza **esattamente un** re-eval
  fuori cap: campo `clarify_budget_used: bool` per `(gate, item_id)` —
  `clarify` ammesso solo se `false`; il re-eval fuori cap lo pone a
  `true` indipendentemente dall'esito; un `gap` risultante ritorna in
  `cap-exhausted` con solo `waive | amend-desiderata` (chiude
  deepseek-B2/r6). Il cap si resetta solo via `amend-desiderata` (nuovo
  `item_id`, nuova lineage). Retry-panel di infrastruttura non conta
  nel tetto globale ma ha tetto K.
- **`clarify` porta `refines: item_id` tipizzato**: l'insieme di
  ingresso della change-detection per quell'item include l'hash delle
  entry `refines` attive — un clarify valido cambia l'ingresso e rende
  il re-eval ammissibile (chiude claude-3/r5).
  `clarify` appende al ledger + re-eval degli item coinvolti; **non
  azzera il cap cumulativo** — la lineage dell'item è immutabile e il
  contatore sopravvive al clarify; il cap si resetta solo per un
  requisito genuinamente nuovo confermato dal Director
  (chiude chatgpt-O-01). `retry-panel` su item già giudicati ammesso
  solo se l'hash normalizzato dell'evidenza è cambiato (altrimenti
  rifiutato — chiude claude-2).
- Waiver e signoff bound a `(item_hash, plan_hash, evidence_hash)`;
  evidenza cambiata (hash normalizzato) → disposizione decaduta.
- Re-eval = chiamata pannello su ≥1 item; cap per-item (2, cumulativo,
  non azzerato da churn) + tetto globale di invocazioni per task;
  ogni re-eval registra gap precedente + modifica correttiva.

### P6 — skipped:trivial

- Predicato: (a) intero inventario changed-file ⊆ allowlist positiva
  (docs/, *.md fuori `.mw/`, fixture non-golden); path ignoto o scope
  misto → squalificato; **lista "loaded" esplicita con precedenza
  sull'allowlist**: skills, `AGENTS.md`, rules, config, contracts,
  `verification.json`, `intent.*`, `desiderata.md`, `.mw/`,
  `RICHIESTE.md`, `plans/`, `context/` → qualsiasi intersezione =
  pannello forzato (chiude claude-9).
  (b) **Reachability dal lint, mappa snapshot + ricalcolo**: la mappa
  consumer→path è snapshot-tata nel ledger al seed di epoch
  (`map_golden_sha256_snapshot`; la versione "loaded" live è
  modificabile solo via `amend-desiderata`). `closure:lint` ricalcola
  deterministicamente la mappa dai consumatori correnti e usa
  l'**unione** ricalcolo ∪ snapshot: file con consumatore nel
  ricalcolo → pannello forzato (chiude claude-8/r6); ricalcolo ⊂
  snapshot → warning telemetrico, non rosso (consumatori rimossi da
  altre sessioni non bloccano task estranei — chiude claude-6/r7);
  rosso solo se lo **snapshot nel ledger** è mutato.
  `map_exists=false` → skip mai vero. **SKIPPED_TRIVIAL ammesso solo
  se `surface(changed_files_for_predicates) ∩ scope_surfaces = ∅`
  per tutti i `not-applicable` del ledger, valutato al momento dello
  skip** (default-deny: mappa assente o file non mappato → skip
  rifiutato); una riattivazione scoperta a chiusura su uno status
  già SKIPPED_TRIVIAL → rosso, non "SKIPPED_TRIVIAL con nota"
  (chiude deepseek-B3/r10).
  (c) Task con dipendenze dichiarate o genitore: niente skip per un
  task docs-only legato a un task comportamentale correlato non ancora
  verificato (chiude chatgpt-O15).
  (d) Ledger con `human-eye` o chiarimento Director in sessione →
  niente skip. (e) **`SKIPPED_TRIVIAL` valido solo se non esistono item
  attivi senza disposizione terminale valida**: un item `technical`
  coperto da evidenza meccanica valida conta come risolto; un item
  `intent-check`/`human-eye`/`open` non disposizionato → pannello
  obbligatorio (chiude chatgpt-O-02/r4 + O-01/r5).
- Registrati `changed_files_sha256` + ID regole matchate.

### P7 — Audit consumatori

- `desiderata-slice` unica via di egress da `.mw/desiderata.md` radice.
- **Enforcement al punto di consumo** (non AST — chiude gemini-4):
  il wrapper centralizzato delle chiamate LLM rifiuta prompt che
  includono testo desiderata senza marker `X-Desiderata-Slice`; per i
  call-site freeform (broadcast web) il rifiuto vive nel
  **payload-builder** — non si costruisce il payload se la sorgente
  non è una slice marcata (chiude deepseek-N8).
- OB-2 = grep (telemetria) + **fixture negativa** per ogni call-site
  auditato (input non marcato → rifiuto; caso broadcast incluso: testa
  il builder, non il modello).

### P8 — Legame pre-battesimo ↔ chiusura

- Check pre-battesimo: input = draft plan + item list slice; output
  record `plan_disposition`: `item_id → {task|gate|open|human-eye|
  not-applicable}` — `task|gate` richiedono **citazione a
  obbligazione concreta + criterio di accettazione osservabile**
  (mapping generico o privo di criterio → rifiutato, chiude
  chatgpt-O11); **`open` richiede solo `acceptance_criterion`
  testuale osservabile** con obbligazione assente e dichiarata tale —
  `waive-plan-gap` produce `open` con `plan_waived: true`, e l'item
  entra nel ledger attivo e va `covered` a chiusura (chiude
  claude-1/r7); `human-eye` richiede motivazione estetica;
  **`not-applicable` richiede motivazione di scope citata**
  (riferimento all'item della slice + motivo) ed è **votato dal
  pannello pre-battesimo** — dominio `applicable|not-applicable` solo
  in questa fase; passa solo con maggioranza stretta, esito non
  maggioritario → `ambiguous` → record, non PASS (chiude
  deepseek-B4/r6 + chatgpt-O-01/r6). Ogni `not-applicable` dichiara
  `scope_surfaces` = **surface IDs del dominio PLAN-044** (in
  allowlist del payload pannello): a chiusura il lint espande
  `changed_files` via la mappa file→surface di PLAN-044 e verifica
  `surface(changed_files) ∩ scope_surfaces ≠ ∅` → item **riattivato**
  e giudicato; soddisfatto nella funzione di status solo se non
  riattivato (chiude claude-4/r6 + deepseek-B3/r7). Terminale, non
  modificabile dall'executor. Record hash-ato con `plan_hash`,
  indicizzato `(plan_id, plan_hash, item_id)`. **A ogni epoch N+1 il
  pannello pre-battesimo rivaluta il `not-applicable`** (chiude
  deepseek-B1/r8): confermato → record re-indicizzato su
  `plan_hash_semantico` corrente con gli stessi `scope_surfaces`
  verificati; non confermato → l'item diventa `open` e va giudicato.
  Rebattesimo senza rivalutazione → rosso (OB-45).
- Le `plan_disposition` non valgono **mai** come waiver a chiusura:
  sono il seed vincolante del ledger; item `open` entra nel ledger
  attivo e va `covered` o disposizionato a chiusura.
- `gap` pre-battesimo → non battezzabile (o awaiting con record
  indicizzato `(plan_id, plan_hash, item_id)`); revision loop con cap
  dichiarato nel contratto (numero scritto).
- `closure:lint` asserisce: ogni `gap`/`unverifiable` pre-battesimo ha
  una disposizione in chiusura.

### P9 — Telemetria e calibrazione

- Metrica per chiusura: invocazioni pannello, skip trivial, waiver
  (rate per item_id e classe di task), bloccati, misalignment — contro
  il denominatore dei task elegibili. `found-by: intent-panel` basso
  senza invocazioni non è un successo.
- Waiver-rate è **telemetria, non gate**: segnale di review al
  Director, mai rifiuto automatico; non esiste una "soglia nel
  contratto" che finga enforcement (chiude deepseek-N7 con la sua
  alternativa onesta).
- Calibrazione: overlap provider/model-family riportato; fixture
  `known-red`/`known-green` a ogni cambio config; config che fallisce
  non produce verdetti; backup solo da pool `calibrated`.

## Parametri fissi (tabella — `params_sha256` in catena)

| Parametro | Valore | Uso |
|-----------|--------|-----|
| `QUORUM_MIN` | 3 | verdetti validi per item |
| `RE_EVAL_CAP_ITEM` | 2 | re-eval executor per item_id, cumulativo |
| `MAX_INTEGRITY_REPANEL` | 3 | re-panel integrità per task → poi `integrity-cap-exhausted` |
| `INFRA_RETRY_K` | 3 | retry-panel su `BLOCKED_INFRA`/`quorum-short` prima di `waive-infra` |
| `GLOBAL_INVOCATION_CAP` | 12 | invocazioni pannello per task (costo) → `global-ceiling-exhausted` |
| `REVISION_LOOP_CAP` | 3 | revisioni plan pre-battesimo |
| `PANEL_TIMEOUT_S` | 30 | timeout per call API (escluso da config hash) |
| `DIGEST_BUDGET_KB` | 32 | regione estratta per evidenza |

Il lint verifica che i valori usati dal codice siano uguali alla
tabella (`params_sha256` in `intent.json`).

## Trappole rilevanti

- **T-06** — coverage per-ID su universo enumerato dalla slice.
- **T-13** — `intent.*` nella run dir; `task_id`+`run_id` in catena;
  `panel.config_sha256` + `effective_providers` contro config drift.
- **T-14** — artefatto assente/stale = integrità (preflight), non
  verdetto del pannello.

## Tasks

| Task | Contenuto | Dipendenze |
|------|-----------|------------|
| T-001 | `scripts/desiderata-slice.*` — slice marcata `X-Desiderata-Slice: vNN + sha256` + item list `vNN.item-N`; unica egress da `desiderata.md`; rifiuta hash mismatch; test fixture multi-versione | — |
| T-002 | Audit + fix consumatori (cross-repo symlink): `mw-critique-plan.py`, `mw-iterative-deliberate.py --desiderata`, web debate/broadcast, skill `--desiderata`, wrapper. Enforcement: wrapper LLM rifiuta input non marcato; payload-builder freeform idem. Produce la **mappa consumer→path** (chi consuma cosa) usata dal predicato reachability di P6 | T-001 |
| T-003 | Intent ledger append-only a epoch `.mw/runs/<task>/intent.md` per tutti i task: seed = `plan_disposition` (P8); classi con tabella transizioni; supersessioni integrale/parziale + conferma (director_answer o signoff); DAG una-foglia; dichiarazione conflitti multi-slice; hook in `mw-executor` | T-001, T-002, T-006 |
| T-004a | Motore pannello `scripts/verification/intent-panel.*` — payload generico, digest pipeline, validatore citazioni, aggregatore deterministico, funzione di voto. **Nessuna dipendenza dal ledger** | T-001 |
| T-004b | Assemblaggio `intent.json` + hash chain P5 + `reseal` | T-003, T-004a |
| T-005a | State machine e registro tipi: estensione `awaiting_director`/`director_answer` di PLAN-044 T-003 con **registro unico dei tipi di record e risposte** (righe pre-battesimo incluse), comando `mw-director-answer` interattivo con provenance journal; OB-32 | PLAN-044 T-003 |
| T-005b | Gate chiusura: `verify:bundle`/`closure:lint` richiede status ∈ {PASS, WAIVED, SKIPPED_TRIVIAL}; preflight integrità; tabella esiti rosso/re-panel/reseal; origin da seed+manifest_plan; RICHIESTE append-only vs git | T-002, T-004b, T-005a, PLAN-044 (mappa file→surface landed) |
| T-006 | Check pre-battesimo in `mw-planner`: stesso motore pannello (T-004a); output `plan_disposition` con obbligazione+criterio/`scope_surfaces` per item; `gap` non disposizionati → non battezzabile | T-004a, T-005a, PLAN-044 (mappa file→surface landed) |
| T-007 | Skill updates (`mw-executor` manifest+ledger+SESSION-GUARD; `mw-planner` checklist+seed). **Contratto di sezione concordato con PLAN-044 T-006**: sviluppo in parallelo su schema condiviso, **land sequenziato** (non prima di PLAN-044 T-006 committed+validated); validazione strutturale dei file skill | T-005b, T-006 |
| T-008 | Dogfood: task reale con `intent.md`; seeded misalignment → rosso → fix → verde; `found-by: intent-panel` | T-005b |

## Contratto di verifica (obbligazioni)

- OB-1: `desiderata-slice` su fixture multi-versione: solo FROZEN
  richiesta, sha256 stabile, item list `vNN.item-N`.
- OB-2: grep telemetrico + fixture negativa su ogni call-site auditato
  (incluso payload-builder broadcast: input non marcato → rifiuto).
- OB-3: `intent.md` da seed pre-battesimo; schema valido; append-only
  (mutazione → rosso); epoch su emendamento plan.
- OB-4: `intent-panel` → `intent.json` su universo item list, citazioni
  verbatim su segmenti digest, su bundle storico; fixture `human-eye`
  produce entrambi gli esiti; locator non soddisfacibile →
  `unverifiable`.
- OB-5: chiusura bloccata senza status valido (fixture rossa/verde);
  preflight manifest/files prima del pannello.
- OB-6: checklist+seed in `mw-planner`/`mw-executor` (verifica
  strutturale file skill).
- OB-7: dogfood misalignment → rosso → fix → verde,
  `found-by: intent-panel`.
- OB-8: unit test funzione di voto per n∈{3,4} su tutte le combinazioni,
  inclusa tabella `human-eye`; quorum per-item (provider malformed su
  2 item → `unverifiable` locale, non `BLOCKED_INFRA`).
- OB-9: mutation test sulla catena — ledger, manifest_plan/closure,
  evidenza citata, config, prompt, changed-file list, slice,
  run_id/task_id, plan hash → ciascuna mutazione invalida o instrada
  per la tabella esiti; hash normalizzato stabile a ri-esecuzione.
- OB-10: mutazione riga ledger → rosso; supersessione senza conferma →
  blocco; DAG multi-foglia → `ambiguous`.
- OB-11: file list non triviale con `skipped:trivial` → pannello
  forzato (incluse classi loaded + RICHIESTE/plans/context/rules).
- OB-12: waiver/signoff su evidenza con hash normalizzato cambiato →
  invalidato.
- OB-13: provider che omette/inventa item_id → malformed → escluso per
  quegli item.
- OB-14: citazione non-verbatim, fuori `manifest_closure`, su summary
  o su segmento non estratto dal digest → malformed.
- OB-15: fixture trivial — docs-only → skip; mixed-scope → forzato;
  docs consumata da skill/agente (reachability) → forzato; frammento
  coordinato (task padre comportamentale non verificato) → forzato.
- OB-16: fixture cross-run — receipt che cita altra run → rosso.
- OB-17: calibrazione known-red/known-green su config nuova; backup non
  calibrato o stessa model-family → ineleggibile.
- OB-18: fixture supersessione parziale — residuo del FROZEN resta nel
  perimetro del gate; chiarimento integrale lo esclude.
- OB-19: fixture citazione autentica-ma-irrilevante → non `covered`;
  `covered` richiede catena item→criterio→evidenza.
- OB-20: `retry-panel` su evidenza a hash normalizzato invariato →
  rifiutato dal parser; `director_answer` fuori matrice → rifiutato.
- OB-21: funzione di status — fixture con mix
  covered+waived+human-eye-signoff → PASS/WAIVED; con item pending o
  human-eye senza signoff → non chiudibile.
- OB-22: quorum-short su 2 item di 10 → `retry-panel|waive-infra` su
  quegli item, non `BLOCKED_INFRA`; retry non consuma cap.
- OB-23: `illegitimate` human-eye → awaiting con richiesta `clarify`;
  split arriva solo via `amend-desiderata`+epoch N+1, con verifica di
  copertura dell'unione.
- OB-24: normalizzatore — mutazione di campo non-eliminabile o schema
  sconosciuto → rivalutazione forzata; ri-esecuzione identica → hash
  stabile.
- OB-25: epoch N+1 senza `director_answer` di re-battesimo → rosso;
  item attivo di N scomparso senza catena `superseded_by` confermata →
  rosso; lineage coperta → verde; rimozione `manifest_plan` tra epoch
  consecutivi senza `director_answer` con diff → rosso, autorizzata →
  verde.
- OB-26: `clarify` ripetuto sullo stesso item → cap cumulativo non
  azzerato; N re-panel di integrità consecutivi → `MAX_INTEGRITY_REPANEL`
  → record `integrity-cap-exhausted`.
- OB-27: reachability — `map_exists=false` → skip sempre rifiutato;
  changed file con consumatore non vuoto nella mappa golden → pannello
  forzato; snapshot mappa nel ledger mutato → rosso; ricalcolo ⊂
  snapshot → warning.
- OB-28: supersessione — hash riga RICHIESTE ≠ hash verbatim
  `director_answer` → `unconfirmed` → blocco; parziale → residuo attivo;
  signoff con supersessione pendente → rifiutato con richiesta
  `amend-desiderata`; `clarify` con `superseded_by` → rifiutato.
- OB-29: lineage — supersessione confermata → epoch verde (attivi N
  coperti da foglie N+1); item scomparso senza catena → rosso;
  signoff del parent riusato su child `derived_from` → rifiutato.
- OB-30: `misclassified` maggioritario su item `covered` → non PASS;
  re-eval di riclassificazione consuma cap; seconda disputa →
  awaiting.
- OB-31: `cap-exhausted` + `clarify` → esattamente un re-eval fuori
  cap, poi solo `waive|amend-desiderata`; aggiunte a
  `manifest_closure` → change-detection+cap, non re-panel integrità;
  re-eval fuori cap che produce `gap` → ritorno in `cap-exhausted`.
- OB-32: matrice totale — ogni tipo di record emesso ha ≥1 risposta
  `director_answer` ammessa; `epoch-rebaptism` accetta
  `rebaptize(plan_hash)`.
- OB-33: `clarify` con `refines: item_id` su pareggio → re-eval
  ammissibile (ingresso change-detection include hash entry refines).
- OB-34: `not-applicable` — fixture con motivazione di scope → votato
  dal pannello; `technical` coperto da evidenza meccanica →
  `SKIPPED_TRIVIAL` possibile; `intent-check` non disposizionato →
  forzato.
- OB-35: signoff `evidence_hash: null` + modifica `changed_files` →
  decaduto.
- OB-36: `reseal` — variazione `changed_files` → verdetti validi copiati
  (evidence+config invariati), trivial rivalutato, signoff null
  invalidati; divergenza lista dichiarata vs git → rosso.
- OB-37: `clarify_budget_used` — secondo `clarify` sullo stesso
  `(gate,item_id)` → rifiutato; re-eval fuori cap → gap → ritorno in
  `cap-exhausted` con solo `waive|amend-desiderata`.
- OB-38: `contested` — flag `misclassified` minoritario: verdetto del
  flaggante conta per quorum, contribuisce a `gap` mai a `covered`;
  maggioritario → `class-dispute` con precedenza.
- OB-39: `not-applicable` — `scope_surfaces` intersect `changed_files`
  → riattivato + `SKIPPED_TRIVIAL` negato; esito non maggioritario →
  `ambiguous` non PASS.
- OB-40: `manifest_plan_sha256_chain` — catena non monotona → rosso;
  locator required mutato fuori epoch → rosso; assenza catena → rosso.
- OB-41: mappa — ricalcolo ⊋ snapshot usa unione (file consumato nel
  ricalcolo → forzato); ricalcolo ⊂ snapshot → warning; snapshot nel
  ledger mutato → rosso.
- OB-42: parametri — codice che usa valori ≠ snapshot →
  `params_sha256` mismatch → rosso; tabella live aggiornata da altra
  sessione → task in volo prosegue sullo snapshot.
- OB-43: `open` — item `plan_waived: true` entra attivo nel ledger e
  richiede `covered` a chiusura; `open` con obbligazione → rifiutato.
- OB-44: `reseal` — `input_vector_hash` diverso (refines, verification
  json, epoch, plan semantico) → verdetto non copiato; waiver
  `evidence_hash: null` + modifica `changed_files` → decaduto; entry
  `signoff-invalidated` appesa al ledger.
- OB-45: superfici — changed file nella stessa surface (path diverso)
  → `not-applicable` riattivato.
- OB-45b: `not-applicable` a rebattesimo — senza rivalutazione del
  pannello → rosso; confermato → re-indicizzato su plan_hash corrente.
- OB-46: esclusioni provider — omissione item_id → per-item; errore
  call-level 2× → fallback; omissione non attiva backup.
- OB-47: provenance — `director_answer` senza entry journal
  (timestamp+nonce del comando interattivo) → blocco; riga RICHIESTE
  senza provenance non autentica.
- OB-48: livelock — append di un signoff null-evidence o marcatura
  `fatta` non varia `changed_files_sha256` né `plan_hash_semantico`.
- OB-49: dominio citazioni — citazione su ledger/plan/slice (dominio
  specifica) accettata per class/mapping/not-applicable; `covered`
  senza citazione di entrambi i domini → non covered.
- OB-50: `epoch-reeval` — due epoch consecutivi su item `covered` non
  consumano il cap per-item; `gap` correttivo sì.
- OB-51: grafo task — ogni input usato da un task è coperto da una
  dipendenza dichiarata (audit deterministico su T-00x).
- OB-52: provenance HMAC — record senza firma valida → `unconfirmed`;
  invocazione non-TTY (`DIRECTOR_NONINTERACTIVE=1` o stdin piped) →
  nessun token → blocco.
- OB-53: file non mappato a surface → riattiva tutti i
  `not-applicable`; mappa PLAN-044 assente → `not-applicable` =
  `pending`.

## Rischi accettati

- Falso `gap` → `unverifiable` → `awaiting_director` tipizzato.
- Quorum failure → `unverifiable` per-item prima, `BLOCKED_INFRA` solo
  a run completamente scoperta; `waive-infra` in un atto.
- Costo → digest estrattivo bounded, re-eval solo su item cambiati,
  `skipped:trivial` con predicato stretto.
- Complessità → rimossi cache verdetti e AST; ogni regola residua è un
  gate meccanico che chiude un falso PASS osservato nel dibattito.

## Post-battesimo (non bloccanti)

- Raffinamenti ergonimici del digest (finestre adattive) se i fixture
  mostrano `unverifiable` sistematici.
- UI/report di sintesi delle disposizioni per il Director.

## Avanzamento (2026-10-17)

- **T-001 ✓** — `mind-weaver/scripts/desiderata_slice.py` (libreria) +
  `mw-desiderata-slice.py` (CLI) + symlink `RPG/scripts/` via forward.py.
  Slice marcata `X-Desiderata-Slice: vNN sha256:…`, item `vNN.item-N`,
  rifiuta non-FROZEN e hash mismatch. 13 test su fixture multi-versione
  (`tests/fixtures/desiderata-multi.md`). Live: v33 → 12 item, sha
  `bd3710ab…`.
- **T-002 ✓** — enforcement runtime al punto di consumo:
  `load_desiderata_input` (slice marcata → verificata; file
  multi-versione → auto-slice ultima FROZEN con warning; altro →
  refused). Call-site fixati: `mw-critique-plan.py` (bug T-014),
  `mw-iterative-deliberate.py`, `mw-deliberate-legacy.py`; skill
  `explorer`/`planner` ora generano la slice prima di `--desiderata`.
  Mappa `mind-weaver/.mw/desiderata-consumers.json`. 5 test fixture
  negative inclusi.
- **T-004a ✓** — `mind-weaver/scripts/verification/intent_panel.py`:
  `PanelConfig`+`config_sha256`, digest pipeline (locator
  `full|regex|jsonpath`, budget 32KB, mai troncamento silenzioso),
  normalizzatore per-tipo con allowlist (sconosciuto → forced re-eval),
  validatore citazioni due domini (evidenza/specifica), parse provider
  (call-level vs per-item), backup deterministico (calibrated, no
  stessa family di un provider valido), voto per-item (quorum ≥3,
  contested→gap, misclassified>n/2 → class-dispute, alfabeto
  `applicability`), origin discriminator meccanico. 36 test.
- Test totali: 49/49 verdi (`pytest tests/unit/test_desiderata_slice.py
  tests/unit/test_intent_panel.py`).
- Restano: T-003 (ledger — dipende T-006+T-002 ✓), T-004b (intent.json
  assembly), T-005a/b, T-006, T-007, T-008 — bloccati su PLAN-044
  (state machine T-003, mappa file→surface T-002) per dipendenze
  dichiarate.
