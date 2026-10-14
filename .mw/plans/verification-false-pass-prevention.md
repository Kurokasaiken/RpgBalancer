---
title: Verifica post-operazione — impedire il «funziona» senza evidenza
status: candidate
created: 2026-10-14
desiderata: v29 (FROZEN) — «regole preventive lette e usate davvero, preflight» ; estende la voce Still unresolved «guard meccanico»
incident: .mw/bugs/20261014-verification-false-pass/bug.md
Documentation Impact: REQUIRED
---

# BOZZA — architettura approvata dal Director il 2026-10-14 (R-189, D1–D6).
# IMPLEMENTATA il 2026-10-14: gateCore/produceBundle/validateBundle/selftest +
# gate in kanbanLint.ts + step --manifest in agentComplete.js.
# Collaudo self-test: 14/14 casi corretti (10 bypass + green + 3 ledger).
# NON ancora adottabile formalmente: manca il primo verificatore indipendente
# (C3) su un task reale e la decisione su PLAN-034 (riga Completato pre-gate
# non committata, ora flaggata dal lint).

## Architettura del gate (approvata 2026-10-14 — decisioni D1–D6)

Quattro componenti, invariante di composizione:
`CLOSED` = ∀ obbligazioni `PASS` dal validatore ∧ verificatore `CONFIRMED` sulle
obbligazioni percettive ∧ zero `FAIL/NOT_RUN/INCONCLUSIVE/INVALID_ENV` ∧ deroghe
solo `WAIVED-DIRECTOR` esplicite. La dichiarazione dell'agente non è un input.

- **C1 — Contratto di verifica obbligatorio.** Due livelli: contratti permanenti
  `CTR-*` (pavimento per-area) + manifest del task `.mw/runs/<task>/verification.yaml`
  creato **all'avvio** del task. Ogni obbligazione: `requirement` verbatim,
  `source`, `request_hash` (sha256 verbatim+source — impedisce la deriva del
  criterio), `type` (state | dom-temporal | pixel-temporal | fps | human-eye),
  `environment` (headless-ok | headed-required | human-required), `command`,
  `artifacts`, `blocking: true`.
- **C2 — Validatore automatico bloccante.** Script che verifica: artifact
  esistente, fresco (run_id+mtime), dal comando dichiarato, junit per-test
  completo, exit code 0; type-check della prova (un singolo screenshot su
  obbligazione temporale = `INCONCLUSIVE`); attestazione ambiente per type≠state
  (`visibilityState`, viewport>0, contatore rAF>0 su 500 ms, frame-diff>0) →
  `INVALID_ENV` se fallita. Scrive `bundle.json` con verdict + sha256 artifact.
- **C3 — Verificatore indipendente.** Clean-context, **nessun diff di default**.
  Input: richiesta verbatim dal ledger + criteri con `request_hash` + artifact.
  Prima verifica meccanica `criteria_hash == request_hash` → mismatch =
  `CRITERIA_TAMPERED` → block. Verdetto per obbligazione percettiva:
  `CONFIRMED/CONTESTED/UNVERIFIABLE`; non può confermare un non-PASS.
- **C4 — Gate finale. Punto concreto: `kanban:lint` sulla transizione
  `Completato` in `src/docs/docs/coordinator/agent_assignments.md`** — scelto
  perché già obbligatorio nella catena safeguard e già bloccante; copre ogni
  chiusura senza dipendere dall'invocazione di una skill (risponde al gap di
  trigger). Regola: riga `Completato` → deve citare `bundle.json` valido
  (hash ricomputati, verdict PASS); `agentComplete.js` v2 è il produttore
  unico del bundle e scrive lui la riga. Stessa regola su `RICHIESTE.md`
  `fatta` (D2). Modalità **fail-loud** accettata: chi scrive `Completato` a mano
  senza bundle lascia il repo rotto al prossimo lint — niente CI/hook (D3).
  Mind Weaver: `contracts-check.py --enforce` solo nel call-site del gate.

### Decisioni Director (2026-10-14, verbatim esito)
1. Gate su `kanban:lint`/`Completato` — **approvato**.
2. `RICHIESTE.md` `fatta` sotto lo stesso gate — **approvato**.
3. Fail-loud basta, niente CI/pre-commit — **approvato**.
4. Deroga `WAIVED-DIRECTOR` esplicita con motivo verbatim, mai classificata PASS — **voluta**.
5. La linea consultiva è superata in RPG: chiusura meccanicamente bloccata — **approvato**
   (supera D-20260911-002 per questo repo; Mind Weaver resta consultivo finché non si estende).
6. Struttura a due livelli (CTR-* permanenti + manifest per-task) — **delegata, adottata**.

### Self-test del gate (10 casi red + 1 green)
Da `.mw/runs/gate-selftest/` con task finti; ogni caso deve produrre BLOCKED con
prova, poi il green path (R-185 reale, tutto PASS → chiusura ammessa). Casi:
chiusura senza run; screenshot singolo su prova temporale; env invalido
(rAF fermo / hidden / viewport 0); check interrotto; CTR ignorato dal diff;
prova omessa; criterio errato al verificatore (CRITERIA_TAMPERED); bundle
falsificato; evidenza stantia; verifier CONFIRMED su FAIL tecnico.
Adozione dichiarabile solo dopo 10/10 red + 1/1 green osservati.

## Spec originaria (2026-10-14, pre-approvazione)

### Problema (osservato, non ipotizzato)
Il 2026-10-13 l'agente ha dichiarato «funziona» su `/game` evento invasione; il video del 2026-10-14 mostra 5 difetti nella stessa scena. L'incidente nota che **la regola esisteva già** (memoria `verify-visual-changes`, letta a inizio sessione) ed è stata violata. Perciò una regola in più, da sola, non basta (v29 punto 5 lo anticipava: il problema è il momento che la interroga).

### Principio
Un «fatto» è ammesso solo con (a) evidenza prodotta da un testimone che *può* vedere ciò che si afferma, (b) scope coperto dichiarato contro lo scope chiesto dal Director, (c) l'elenco di ciò che NON è stato verificato. Dove il testimone non esiste, l'unico stato ammesso è `NON VERIFICATO`.

### Mappa fallimento → intervento

| Fallimento (incidente) | Cosa l'avrebbe fermato | Task |
|---|---|---|
| Verificato il diff, non la scena | scena-checklist derivata dalla richiesta + frame dell'intera schermata | T-1, T-2 |
| Pane nascosto, animazioni non verificabili, dichiarato comunque | testimone obbligatorio (Playwright con video), altrimenti `NON VERIFICATO` | T-2 |
| Anomalia (marker che deriva) declassata a nota | regola: ogni anomalia osservata è un finding con esito, non una nota | T-1 |
| `tsc` che non controlla, riportato come OK | un controllo che non ha girato = `NON ESEGUITO`, mai «ok» | T-1 |
| Spec/contratti esistenti non letti né eseguiti | pre-flight che li elenca per superficie e li esegue | T-1 |
| Documento che codifica il difetto come comportamento | regola doc: comportamento rifiutato dal Director → sezione `SUPERSEDED` | T-4 |
| Copertura BV minima | test che falliscono oggi sul video del Director | T-3 |

### Task (ognuno produce una capability usabile subito)

**T-0 · Spike del testimone (decisione dati prima di costruire).** Far girare Playwright su `/game` con `video: on` e campionare 1 frame / 0,5 s durante `startInvasion → conferma`; produrre un contact sheet. Esito: «il testimone vede o no» le animazioni (framer, camera Pixi). Se no → il piano cambia (vedi Decisioni aperte). *Acceptance:* un contact sheet reale della sequenza di ieri, letto da un umano.

**T-1 · Gate di chiusura e trigger del pre-flight.** _(Corretto dopo `learn` 2026-10-14: la trappola esiste già — `context/recurring-traps.md` T-04, ora con 3 istanze, proposta P-001. Non va creata una trappola nuova.)_ Due parti: (a) le clausole di P-001 (testimone che può vedere; `NON VERIFICATO` / `NON ESEGUITO`; blocco di chiusura `Richiesto / Verificato con / NON verificato / Anomalie`) entrano in T-04 **solo dopo l'approvazione del Director**; (b) il vero gap: il pre-flight vive solo nello step 5 di `mw-executor`/`mw-planner`, quindi non scatta se si lavora senza invocarli. Serve un punto di controllo che non dipenda dall'invocazione di una skill (pointer in `AGENTS.md`/`CLAUDE.md` — richiede approvazione — e/o controllo meccanico, vedi decisione 2). *Acceptance:* una richiesta diretta «fixa X su /game» senza skill produce comunque il blocco di chiusura.

**T-2 · Registratore di scena (capability riusabile).** Helper Playwright `sceneRecorder` che, per una sequenza data, salva video + contact sheet dell'**intera** schermata e un log di metriche (posizione camera, inset, elementi per `data-testid`). Prima applicazione: la sequenza invasione. *Acceptance:* produce, dal comando di test, lo stesso tipo di sheet del video del Director.

**T-3 · Rete di test sul video del Director (devono essere rossi oggi).** Nuove BV in `gameInvasionSequence.spec.ts` che dipendono solo da decisioni già prese: (a) la camera non cambia pan/zoom fra click e fine tende; (b) dopo la conferma il registro è presente e contiene la riga; (c) mai due goblin visibili nello stesso frame; (d) il marker non è visibile prima dell'atterraggio. *Acceptance:* sulla working tree attuale falliscono quelle corrispondenti ai difetti 3, 4; dopo i fix diventano verdi. (Il difetto 1 e le forme di 2/5 attendono le decisioni del Director.)

**T-4 · Documenti che non difendono il difetto.** Aggiornare `context/GAME_INVASION_SEQUENCE.md` §3, §5 e `CTR-game-002` quando i fix atterrano; regola in `.windsurf/rules/85-documentation-impact.md`: un comportamento rifiutato dal Director marca la sezione `SUPERSEDED` con data e verbatim.

**T-5 · Chiusura = fix + retro-test.** Applicare il gate T-1 al fix dei 5 difetti: il bug non si chiude senza T-3 verde, sheet T-2 letto, `bug.md` aggiornato. È la prova che il piano funziona, non solo che esiste.

### Fuori scope (esplicito)
- Nuovi registri di osservazioni (v29 lo esclude).
- Un sistema generale di test visivi per tutto il gioco: solo la sequenza invasione, poi estensione se il meccanismo regge.
- Estensione a Mind Weaver (v29: passo successivo separato).

### Decisioni aperte (del Director)
1. ~~**Chi è il gate?**~~ → **chiusa 2026-10-14 (D5):** opzione (b) + più: verificatore indipendente senza diff (C3) **e** gate meccanico (C4). La linea consultiva è superata in RPG.
2. ~~**Hook meccanico?**~~ → **chiusa 2026-10-14 (D1–D3):** `kanban:lint` sulla transizione `Completato` (+ `RICHIESTE.md` `fatta`), `agentComplete.js` produttore unico del bundle; fail-loud accettato, niente CI/hook.
3. **Quando il video è obbligatorio:** parzialmente chiusa — il gate decide per `type` di obbligazione (`pixel-temporal` richiede frame+metriche, `fps` richiede ambiente headed). Resta aperta la soglia concreta: ogni modifica a `/game` o solo ad animazioni/sequenze? → delegata al manifest per-task (D6).
4. ~~**Se T-0 dice «Playwright non vede le animazioni»**~~ → **risolta dai fatti:** T-0 ha risposto positivamente — headless vede rAF e DOM-metrics (scene.mjs), headed vede il footage reale (R-187). L'ambiente invalido dell'incidente era il pane IDE hidden, non Playwright. Il gate non si fida più comunque: l'attestazione ambiente (rAF>0, viewport>0, frame-diff>0) è parte del bundle.

### Decisioni residue per l'implementazione
- D7 — Se/quando estendere il gate a Mind Weaver (D5 l'ha approvato solo per RPG).
- D8 — Soglie concrete: min frame per `pixel-temporal`, frame-diff minimo, timeout per-check (tarare nel self-test, non a tavolino).
- D9 — Forma del verificatore indipendente (C3): subagent clean-context con input contract fisso — stesso meccanismo della BV, reso obbligatorio dal gate.

## Claim da mettere alla prova (evidence sheet, prima del critico)

```
CLAIM:        Il fallimento è di processo, non di strumenti.
EVIDENCE:     incidente §«Perché»: gli strumenti hanno risposto correttamente a ciò che è stato misurato.
WHY MATERIAL: se fossero gli strumenti (es. preview fuorviante), T-1 sarebbe inutile e servirebbe T-2/T-0 da soli.

CLAIM:        Una regola letta all'inizio non basta (serve un meccanismo al momento della chiusura).
EVIDENCE:     la regola `verify-visual-changes` era in contesto e violata il 2026-10-13.
WHY MATERIAL: se basta, T-1 è superfluo e il costo va su T-2/T-3.

CLAIM:        Playwright (video/frame) può «vedere» le animazioni dell'evento.
EVIDENCE:     nessuna. Il documento sequenza dice che `/game` nel pannello anteprima non esce dal boot; le spec attuali non campionano frame.
WHY MATERIAL: T-2, T-3 e la decisione 4 dipendono da questo.

CLAIM:        Un verificatore indipendente senza il diff coglie ciò che l'autore manca.
EVIDENCE:     nessuna (ipotesi). Un caso: il Director, che non vede il diff, ha colto in 11 s ciò che l'autore non ha colto.
WHY MATERIAL: giustifica o elimina l'opzione (b) della decisione 1.

CLAIM:        I 4 test di T-3 dipendono solo da decisioni già prese.
EVIDENCE:     parziale: (a),(c) discendono da punti 3/«un goblin»; (b) dal punto 4; (d) dal fix del volo.
WHY MATERIAL: se dipendessero da A/B/C, scriverli ora fisserebbe una scelta del Director.

CLAIM:        Il run E2E è eseguibile in tempi accettabili su questa macchina.
EVIDENCE:     il build `playwright` è ancora in corso dopo >5 min.
WHY MATERIAL: un gate che costa 10+ min a chiusura verrà aggirato.
```
