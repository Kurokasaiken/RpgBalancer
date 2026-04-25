# Agent Coordination Playbook

Questo documento definisce le regole operative per coordinare gli agenti Windsurf sul progetto personale Idle Village, evitando conflitti tra prompt e garantendo parallelizzazione sicura.

## 1. Obiettivo

- Assicurare che ogni prompt assegnato possa essere eseguito in parallelo senza toccare gli stessi file/config.
- Centralizzare la visibilità su chi sta lavorando dove e con quali blocchi.

## 2. Politica sui prompt

1. **Parallelismo obbligatorio:** quando il coordinator fornisce più prompt nello stesso batch, DEVONO essere indipendenti. La descrizione del prompt deve esplicitare "sequenziale" solo se impossibile parallelizzare.
2. **Audit file target:** prima di generare un prompt controlla i file che andranno toccati; se coincidono con un prompt già attivo, posticipa o fondi i task.
3. **Prompt readiness obbligatoria:** ogni prompt deve elencare i file target indicando se sono `esistenti` (devono esserci già nel repo) o `nuovi` (richiedono scaffolding). Se un file è marcato `nuovo`, crea subito il file vuoto con export o inserisci istruzioni esplicite nel prompt.
4. **Regressioni zero:** ogni prompt deve includere il blocco `REGRESSION SAFEGUARDS` del template e riferimenti ai test/QA richiesti, sempre con `npm run build:check`.

## 3. Workflow di lock sui file

1. **Analisi impatto:** identifica file/cartelle interessate e livello (frontend, hook, doc).
2. **Aggiornamento registro:** usa `agent_assignments.md` per registrare Owner, Prompt, File toccati, Stato e KPI.
3. **Verifica pre-lancio:** prima di consegnare prompt multipli controlla che nessun file appaia in due righe con stato `in_progress`.
4. **Chiusura:** quando un agente completa il task, aggiorna il registro marcando `done`, aggiungendo link a diff/log.

## 4. Uso del registro `agent_assignments.md`

- Il file contiene una tabella con colonne: `Prompt ID`, `Descrizione`, `Owner`, `File/Cartelle`, `Stato`, `KPI/Note`.
- Il coordinator aggiunge una riga per ogni nuovo incarico prima di consegnare il prompt.
- Quando un prompt è sequenziale, usa la colonna `Stato` per segnare `blocked (wait <prompt>)` finché il lock non si libera.

## 5. QA e Playwright

- Ogni prompt deve specificare esplicitamente i test Playwright/Vitest/manuali da eseguire.
- Se due prompt avrebbero bisogno della stessa suite, unisci i test in un unico prompt oppure sequenziali.

## 6. Aggiornamenti periodici

- Una volta a settimana verifica l’elenco degli agent gratuiti Windsurf e aggiorna il template dei prompt se cambia.
- Revisiona il registro dei lock a fine giornata / fine sessione per evitare residui `in_progress`.

## 7. Protocollo "Dammi dei prompt"

- Quando l'utente chiede "dammi X prompt", genera **solo** prompt indipendenti che possano essere eseguiti in parallelo.
- **Audit file target OBBLIGATORIO**: prima di generare prompt, analizza sovrapposizioni file/cartelle usando `checkPromptLock` e logica dipendenze
- Se ci sono conflitti, unisci i task o crea sequenza con dipendenze esplicite
- Usa il campo "DIPENDENZE" nel template per gestire sequenze
- Se un prompt richiede sequenza, dichiaralo esplicitamente nel testo (es. "sequenziale: lanciare solo dopo KS-XXX")
- Registra ogni prompt nel Kanban con stato "Non assegnato" e dipendenze appropriate
- **FAIL-SAFE**: `prompt:check -- ID` bloccherà automaticamente se dipendenze non completate
- **Prompt Readiness**: allega sempre il blocco iniziale con elenco file `esistenti` vs `nuovi`. Nessun prompt può uscire senza questa checklist; se un agente riporta file mancanti, aggiorna prontamente la checklist e lo staging.

### 7.1 Backlog pre-caricato (2026-01-13)

- **Soglia minima**: mantenere sempre ≥40 prompt “Non assegnato” già presenti in `agent_assignments.md`.
- **Pipeline**:
  1. Redigere batch nel file di staging `agent_assignments_new_prompts.md`.
  2. Approvazione coordinator → copiare immediatamente il batch nel Kanban con template WS6 completo.
  3. Aggiornare un contatore giornaliero dei prompt disponibili per dominio (STS / Idle Village / Balancer / Coordinator) e citarlo nei report.
  4. Quando i prompt disponibili scendono sotto 20, generare e far approvare un nuovo batch prima della prossima richiesta “dammi X prompt”.
- **Consegna rapida**: il coordinator risponde sempre pescando dal Kanban principale; il file di staging non viene più consultato una volta eseguita la migrazione.

## 8. Protocollo “Come rispondo?”

- Interpreta la richiesta come bisogno di un **prompt di risposta** per un agente che ha segnalato un problema.
- Se l’agente ha chiuso con successo, rispondi semplicemente con un riepilogo (“l’agente ha concluso …, nessuna azione richiesta”).
- Non richiedere conferme: esegui direttamente i passi noti e, se mancano informazioni, logga l’assunzione nella risposta.

## 9. Tracciamento dei prompt consigliati

- Ogni volta che suggerisci un prompt che l’utente intende lanciare, aggiungi una riga in `agent_assignments.md` con stato `pending`.
- Quando ricevi feedback dall’agente, aggiorna la riga a `in_progress`, `blocked`, o `done` e aggiungi le note (diff, lint, warning).
- Se arriva “una risposta strana”, consulta il registro per recuperare rapidamente contesto e file coinvolti.
- Il registro funge da memoria temporanea: non appena il task è davvero concluso, marca `done` e, se serve, archivia la riga in uno storico.

## 10. Sistema di Dipendenze (2026-01-07)

### 10.1 Struttura Dipendenze
- **Colonna "Dipende da"** nel Kanban per gestire sequenze
- **Formato**: elenco ID separati da virgola (es. "KS-053A, KS-053B") o "-" se nessuna
- **Script `prompt:check`** verifica automaticamente dipendenze prima di permettere lock

### 10.2 Build Check Obbligatorio
- Tutti i prompt devono includere `npm run build:check` nella safeguard suite
- Se la build fallisce, il task è bloccato e non può essere completato
- Evidence salvate in `test-results/build-check-<data>.log`

### 10.3 Guidelines Centralizzate
- Tutti i prompt seguono `docs/coordinator/agent_execution_guidelines.md`
- Non duplicare regole nei singoli prompt
- Focus su task-specific, non su procedure operative

### 10.4 Esempi Sequenze Corrette
```
KS-053A: Audit DragTestContainer (nessuna dipendenza)
KS-053B: Implementazione refactor (dipende da KS-053A)
```

### 10.5 Esempi Conflitti Risolti
```
❌ KS-058: Component props cleanup (toca test file)
❌ KS-059: Logger integration (toca stesso test file)
✅ KS-058: Props + Logger integration (unificato)
```

## 11. Mandato Coordinator Aggiornato (2026-01-07)

Il coordinator deve:
1. **Memorizzare permanentemente** le regole di coordinazione
2. **Applicare audit file target** automaticamente per ogni richiesta "dammi X prompt"
3. **Usare sistema dipendenze** per gestire sequenze invece di parallelismo forzato
4. **Verificare build check** in ogni safeguard suite
5. **Citare regole specifiche** quando le viola (come fatto in questa sessione)
6. **Garantire Prompt Readiness**: file segnati come esistenti devono esserlo davvero; quelli nuovi necessitano scaffolding/documentazione prima della consegna; aggiornare sia il Kanban sia `agent_assignments_new_prompts.md`.

Seguendo questa struttura il coordinator può orchestrare i lavori senza conflitti o regressioni nascoste.

## 12. Prompt Readiness & Backlog Staging

1. **Blocco obbligatorio nel template**
   - Ogni prompt inizia con lista `FILE TARGET` dove ogni voce indica `[esistente]` o `[nuovo]`.
   - Per i file `nuovo` aggiungi link allo scaffolding o crea il file con TODO/commento base prima di assegnarlo.
2. **Documento di staging**
   - Mantieni `src/docs/docs/coordinator/agent_assignments_new_prompts.md` sincronizzato con questa checklist: nessun prompt passa al Kanban principale senza aver verificato fisicamente i file.
   - Indica nel documento di staging la data dell'ultimo audit e chi ha confermato lo stato dei file.
3. **Workflow**
   - Quando crei nuovi prompt, aggiorna prima il documento di staging con la checklist completata, poi copia la scheda nel Kanban.
   - Se emergono bug di scaffolding (es. file mancanti), correggi immediatamente lo staging e aggiungi nota nel Kanban per tracciare l'incidente.
4. **Validazione automatica**
   - Esegui `npm run coord:prompt-readiness` (quando disponibile) o equivalenti script manuali per assicurarti che i file segnati come esistenti lo siano davvero.
