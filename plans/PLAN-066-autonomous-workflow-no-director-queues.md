# PLAN-066: Workflow autonomo senza code Director

**Status:** `draft` — piano candidato da dibattito multi-AI web, non battezzato.
**Richiesta:** R-230
**Parent:** PLAN-059
**Run:** `mind-weaver/.mw/runs/20261019-r230-autonomous-workflow/`
**Artifact:** `artifact-r006.md` — SHA-256
`e1c03688289cd7f0c6ecb9900855fad7a7c5930edee40f768674864f8f38c038`
**Convergenza:** ChatGPT, Claude, DeepSeek — 3/3 ACCEPT. Gemini no-op dopo
due retry; Grok estrazione/generazione non disponibile; esclusi
dall'elettorato con disposition nel journal.

## 1. Intento

Attuare la direttiva Director del 2026-10-19 — *«nn voglio + cose in attesa
del direttore, possono andare avanti»* — eliminando le code di approvazione
per le operazioni meccaniche, senza fingere che un giudizio umano sia PASS.
Debate e planning non sono obiettivi di ottimizzazione.

## 2. Stato attuale e problema

- PLAN-059 ha già introdotto `task:close` e metriche forensi; il report usa
  churn in righe, che non misura né tempo né numero di operazioni manuali.
- `produceBundle.ts` sovrascrive `bundle.json`: una sequenza BLOCKED→PASS
  non è conservata durevolmente per ogni run.
- `mappingProposal.ts` registra `approved_by: director` senza autenticare
  l'attore; il comando può essere eseguito dall'agente.
- `directorApprove.ts` accetta `--actor=agent:<id> --note=...`, ma l'attore
  è self-report non autenticato: il ledger è un tripwire, non un confine
  crittografico.
- I report non offrono un denominatore affidabile delle operazioni di
  routine né una distinzione completa fra agent e Director.

## 3. Vincoli

- RPG `.mw/desiderata.md` v31: plan → agente locale → `verify:bundle` →
  chiusura con bundle; nessun dispatch.
- v32: il comportamento non verificato non diventa PASS per silenzio o
  nota dell'agente; l'attuale `director_answer` rimane fino a un amendment
  esplicito.
- v35: visual-fork e human-eye restano giudizi con testimone Director.
- Nessuna modifica implicita a desiderata frozen, `CANON.md`, trust policy,
  o semantica `closure:lint`.
- Nessuna nuova infrastruttura a pagamento, agente aggiuntivo o scheduler
  globale.

## 4. Task

### T-001 — Baseline eventi e provenienza

- Aggiungere misure derivate dai comandi già eseguiti: azioni routine
  richieste/completate, attore dichiarato, file di stato aggiornati,
  aperture/esiti dei bundle e disposition non risolte.
- Il report distingue `director`, `agent-self-reported` e `derived`;
  l'actor non prova identità.
- Pubblicare coperto/non coperto e motivi delle disposition irrisolte:
  zero match, match multipli, human-only, policy/gate drift.
- Niente time-saved claim da churn o conteggi. I dati preesistenti restano
  aggregati e non vengono presentati come baseline task-level.

### T-002 — Journal dei tentativi bundle

- `produceBundle.ts` scrive un record start e un record terminal per
  tentativo: task/run, sequenza, timestamp, commit/tree hash, manifest hash,
  bundle hash, obbligazioni, verdetto e hash del record precedente.
- Il bundle nuovo porta il puntatore al record terminale corrente;
  `closure:lint` verifica il puntatore per i run del nuovo formato.
- Start senza terminale = `INTERRUPTED`, mai PASS. Record corrente mancante,
  malformato o non coerente col bundle = `INVALID_EVIDENCE`.
- I run precedenti al rollout sono `LEGACY_UNJOURNALED`, non invalidati
  retroattivamente.
- Il journal locale rileva inconsistenze/interior edits e mismatch sul
  puntatore corrente; non autentica l'attore né prova completezza storica
  contro un agente che riscriva bundle e journal insieme.
- Seed distinti: chain-walk accetta il prefisso valido dopo tail-truncation
  (limite documentato); il verificatore completo rifiuta il puntatore
  corrente mancante se il bundle non è stato alterato.

### T-003 — Mapping routine e attore reale

- Rimuovere il falso `approved_by: director`; registrare `derived`,
  `agent-self-reported` o `director` con fonte e motivo.
- Derivare un mapping solo da una fonte autorevole, versionata e committata,
  con esattamente un risultato e check richiesti definiti.
- La policy stessa non può auto-approvare una propria modifica.
- Zero/multiple matches restano visibili come disposition irrisolte; non
  chiamarle approvate dal Director e non trasformarle in PASS.
- Seed: mapping errato, policy modificata, actor falsificato e copertura
  zero/multipla.

### T-004 — Trust-set: self-approval dichiarata, non nascosta

- Reportare l'attuale trust-set agent action come self-report non
  autenticato; vietato presentarlo come approvazione umana o trust anchor.
- Nel batch di decisioni del §6 fissare se il self-sealing agent copre
  gate/bundler/trusted/frozen files. Se escluso, il gate rifiuta il
  self-seal di modifiche a questi file nello stesso run.
- Includere nel medesimo batch il bootstrap del journal: `produceBundle.ts`
  è a sua volta protetto.
- Seedare entrambe le semantiche: residual bypass esplicito se self-seal
  autorizzato; `INVALID` per gate edit + self-seal nello stesso run se
  escluso.

### T-005 — Progresso senza risolvere decisioni umane

- L'obbligo human-only resta non-PASS; eseguire gli altri task elencati e i
  check deterministici invece di interrompersi al primo disposition umano.
- Un task è indipendente solo se inputs, outputs, prerequisiti e acceptance
  mostrano che non consuma la decisione umana pendente. Overlap file è un
  segnale conservativo, ma file disgiunti da soli non provano indipendenza.
- Non costruire uno scheduler generico. Se il contratto non dimostra
  indipendenza, non dichiarare completato il task interessato; i task
  indipendenti espliciti continuano.
- `closure:lint` resta il gate finale. Nessun task/plan con obbligazioni
  richieste unresolved viene chiuso completamente.
- L'amendment v32 proposto nel §6 non produce director_answer automatici;
  v35 resta invariato.

### T-006 — Bookkeeping idempotente

- Rendere `task:close` idempotente per chiave `(entity, bundle hash)`.
- Aggiornare solo indici e campi meccanici sostenuti dal bundle; preservare
  testo narrativo e decisioni.
- Reportare il numero di file status/index aggiornati manualmente vs da
  `task:close`; non chiamarlo conteggio di gesti umani senza eventi diretti.
- Non promettere riduzioni causali o di tempo su campioni piccoli.

### T-007 — Dogfood e misura

- Eseguire i fault seed di T-002..T-005 e dogfood su almeno un task reale.
- Confrontare gli eventi pre/post disponibili con `n`, finestre temporali e
  limiti espliciti; non usare plan richness o `oop scope` come outcome.
- Metriche primarie: code di routine effettivamente coperte (contatore e
  denominatore), disposition unresolved per causa, retry/flip bundle.
- Metriche secondarie: file bookkeeping aggiornati per chiusura e task
  indipendenti che hanno continuato.

## 5. Acceptance

- Nessuna operazione nel perimetro routine aspetta il Director senza
  comparire nel denominatore e nella tabella delle cause.
- I verdetti dei nuovi run sono tracciati; PASS richiede bundle e puntatore
  journal coerenti. I limiti del journal su tail/full rewrite sono testati
  e dichiarati, non mascherati.
- Un'azione `agent` non è mai riportata come `director`; nessun actor è
  presentato come autenticato.
- Errori di mapping/policy non possono diventare PASS per auto-approvazione.
- Human-only resta non-PASS; task esplicitamente indipendenti continuano;
  `closure:lint` non chiude il lavoro incompleto.
- `task:close` ripetuto sullo stesso entity+bundle non duplica effetti.
- Unit test, `build:check`, `verify:bundle` e `closure:lint` secondo
  contratto; qualsiasi failure di worktree condiviso applica T-13 prima di
  toccare file altrui.

## 6. Un solo batch policy prima dell'esecuzione

1. Self-sealing agent: includere o escludere gate/bundler/trusted/frozen
   files? La scelta include il bootstrap T-002. Default del piano se non
   autorizzato: rifiutare self-seal same-run su quei file.
2. v32: accettare che una decisione human-only blocchi solo il lavoro che la
   consuma, mentre gli altri task elencati proseguono? Nessuna eccezione
   converte l'obbligo umano in PASS.

Nessun altro ruling Director è richiesto dal piano. v35 non cambia.

## 7. Sequenza

T-001 baseline/provenance → batch §6 → T-002 journal → T-003 mapping →
T-004 policy tripwire → T-005 progress contract → T-006 idempotenza →
T-007 dogfood. Ogni slice produce il proprio bundle; no closure completa
prima degli acceptance.

## 8. Provenienza

- R-230; follow-up a PLAN-059 (T-001 rework metrics, T-002 `task:close`),
  PLAN-048 (forensics) e PLAN-051 (bundle/trust/tiering).
- `src/docs/docs/MASTER_PLAN.md` letto; le sue fasi attive sono gameplay
  (archetypes/scenario/atomic UI), quindi non c'è un workstream pertinente
  per questa modifica al workflow di progetto.
- Vincoli riletti: `.mw/desiderata.md` v31/v32/v35; `RICHIESTE.md` R-230.
- Dibattito multi-AI converged: ChatGPT, Claude, DeepSeek, 3/3 ACCEPT su
  `artifact-r006.md`; Gemini non ha postato risposta dopo due tentativi
  sicuri; Grok non ha prodotto una risposta correlabile.
- WITNESS-01..16 e dispositions: `mind-weaver/.mw/runs/20261019-r230-autonomous-workflow/`.
