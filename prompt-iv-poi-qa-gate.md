AGENT
Coordinator – QA Gatekeeping & Evidence Management

ISTRUZIONI AGENTE
Sei un agente Windsurf: consulta la skill `agent-execution-mandate` prima di iniziare, segui il mandato, completa la safeguard suite ed esegui le consegne Kanban.

OBIETTIVO
Raccogli conferme esplicite dell'owner per ogni deliverable (Keyboard, ARIA, Drop, Skin) con log dedicato `test-results/iv-poi-manual-qa-<date>.log`; aggiornare Kanban solo dopo feedback "implementazione corretta".

PROMPT READINESS
FILE TARGET
- [esistente] test-results/iv-poi-manual-qa-<date>.log (nuovo evidence log)
- [esistente] src/docs/docs/coordinator/agent_assignments.md (update Kanban)

STYLE LAB PRESET (per qualsiasi lavoro UI)
- Preset: - (evidence collection only)
- Overrides/Tokens: -

TEST ROUTE QA (se coinvolge `/test` / drag harness)
- Inserisci esplicitamente nel prompt che l'agente deve seguire `src/docs/docs/QA/test-route-drag-guidelines.md` (mouse reale Playwright, Pixelmatch/Applitools, Trace Viewer, evidence log `test-results/test-route-drag-vrt-<data>.log`).

DATO DI ORIGINE
- Documento: ACTIVITY_CAPSULE_TESTING_PLAN.md §213-216 – questo prompt esiste per finalizzare il processo QA di ActivityCapsule con validazione owner esplicita

DIPENDENZE
- IV-POI-QA-CHECKLIST (ready for execution)

OPERAZIONI DA ESEGUIRE
1. Creare evidence log `test-results/iv-poi-manual-qa-<YYYY-MM-DD>.log` con template per conferme owner
2. Verificare stato completato di tutti i deliverable POI:
   - IV-ACTIVITYSLOT-KEYBOARD (✅ Completato)
   - IV-POI-ARIA-LIVE (✅ Completato) 
   - IV-POI-DROP (✅ Completato)
   - IV-POI-SKIN (✅ Completato)
3. Contattare owner per conferme esplicite su ogni deliverable:
   - **Keyboard**: "ActivitySlot keyboard enhancement funziona correttamente?"
   - **ARIA**: "ARIA live announcements funzionano come previsto?"
   - **Drop**: "Drag & drop su POI capsule è implementato correttamente?"
   - **Skin**: "POI skin integration è funzionante?"
4. Documentare ogni conferma nel evidence log con:
   - Timestamp della conferma
   - Nome dell'owner
   - Feedback esatto ("implementazione corretta" o problemi)
   - Note aggiuntive se presenti
5. Solo dopo ricevere tutte le conferme "implementazione corretta":
   - Aggiornare Kanban IV-POI-QA-GATE → "Completato"
   - Aggiungere note con riepilogo conferme
   - Evidenziare chiusura completa del POI capsule system
6. Se ci sono problemi o feedback negativi:
   - Documentare problemi nel evidence log
   - Creare nuovi task per risolvere i problemi
   - Mantenere IV-POI-QA-GATE aperto fino a risoluzione

OPERAZIONI VIETATE
- Non aggiornare Kanban prima di ricevere tutte le conferme
- Non chiudere IV-POI-QA-GATE con conferme parziali
- Non creare modifiche al codice (solo evidence collection)
- Non procedere senza contatto diretto con l'owner

ASSUNZIONI
- Tutti i deliverable POI sono completati e funzionanti
- Owner è disponibile per fornire conferme esplicite
- Evidence log template è sufficiente per documentazione
- Processo di conferma può essere completato in una sessione

REGRESSION SAFEGUARDS
- `npm run lint -- test-results/iv-poi-manual-qa-*.log` (validate log format)
- `npm run build:check`
- `npm run kanban:lint`

AUTONOMIA & CHECK-IN
- Autonomia Media; procedi con evidence collection ma richiedi check-in prima di aggiornare Kanban

KANBAN COMPLETION
1. Stato Kanban → "Completato" con data.
2. Evidence `test-results/iv-poi-manual-qa-<data>.log`.
3. Riepilogo conferme owner nelle note Kanban.
4. Chiusura completa del POI capsule system.

NOTE
- Questo è un task di gatekeeping, non di implementazione
- Focus su documentazione e conferme esplicite
- Evidence log è la fonte di verità per le conferme
- Processo deve essere rigoroso ma efficiente

ANTI-STALL DIRECTIVE
- Procedi autonomamente: non attendere conferme aggiuntive salvo istruzioni contrarie esplicite.

ANTICIPATED QUESTIONS
Q: Cosa fare se l'owner non è disponibile?
A: Documentare tentativo di contatto e riprogrammare sessione di conferme

Q: Come gestire feedback parziali?
A: Documentare feedback positivi, creare task per problemi, mantenere gate aperto

Q: Devo includere screenshot nel evidence log?
A: Sì, se forniti dall'owner come prova delle conferme

EVIDENCE LOG
- test-results/iv-poi-manual-qa-<YYYY-MM-DD>.log
