AGENT
Idle Village QA Documentation Specialist – Testing & Verification

ISTRUZIONI AGENTE
Sei un agente Windsurf: consulta la skill `agent-execution-mandate` prima di iniziare, segui il mandato, completa la safeguard suite ed esegui le consegne Kanban.

OBIETTIVO
Extend `ACTIVITY_CAPSULE_TESTING_PLAN.md` con sezione "Cosa mostrare al tester" per ogni blocco (display, interaction, DnD, telemetry, perf) + canali screenshot/video/URL `/test`.

PROMPT READINESS
FILE TARGET
- [esistente] src/docs/docs/ACTIVITY_CAPSULE_TESTING_PLAN.md

STYLE LAB PRESET (per qualsiasi lavoro UI)
- Preset: - (documentation only)
- Overrides/Tokens: -

TEST ROUTE QA (se coinvolge `/test` / drag harness)
- Inserisci esplicitamente nel prompt che l'agente deve seguire `src/docs/docs/QA/test-route-drag-guidelines.md` (mouse reale Playwright, Pixelmatch/Applitools, Trace Viewer, evidence log `test-results/test-route-drag-vrt-<data>.log`).

DATO DI ORIGINE
- Documento: ACTIVITY_CAPSULE_TESTING_PLAN.md §208-212 – questo prompt esiste per creare una checklist QA completa per ActivityCapsule ora che IV-POI-DROP è completato

DIPENDENZE
- IV-POI-DROP (completato)

OPERAZIONI DA ESEGUIRE
1. Leggi `ACTIVITY_CAPSULE_TESTING_PLAN.md` per capire lo stato corrente (IV-POI-DROP completato con drop functionality)
2. Aggiungi una nuova sezione "Cosa mostrare al tester" al testing plan
3. Crea 5 sottosezioni per ogni blocco di testing:
   - **Display**: Screenshots di POI capsule con skin, layout responsive, progress states
   - **Interaction**: Video di click su collect button, hover effects, keyboard navigation
   - **DnD**: Video di resident drag → POI slot, validation failures, right-click detach
   - **Telemetry**: Console logs di eventi, telemetry payload verification, network tab
   - **Performance**: DevTools performance metrics, memory usage, render times
4. Per ogni sottosezione specifica:
   - Cosa catturare (screenshot/video/console)
   - Canali da usare (URL `/test`, DevTools, Playwright recorder)
   - Expected results da verificare
   - Common failure modes da controllare
5. Aggiungi istruzioni per evidence collection:
   - Naming convention per screenshot/video
   - Log locations (`test-results/`)
   - QA report template
6. Aggiorna la sezione "Success Criteria" con i nuovi deliverables QA
7. Verifica che il documento sia coerente con lo stato attuale (IV-POI-DROP completato)

OPERAZIONI VIETATE
- Non modificare le sezioni esistenti del testing plan (solo aggiungere)
- Non creare nuovi file, solo estendere il documento esistente
- Non includere codice o implementazioni, solo procedure di testing

ASSUNZIONI
- IV-POI-DROP è completato e funzionale su `/test`
- Il tester ha accesso a browser DevTools e Playwright
- I canali di capture (screenshot/video/console) sono disponibili
- Il POI capsule su `/test` ha dati di test configurati

REGRESSION SAFEGUARDS
- `npm run lint -- src/docs/docs/ACTIVITY_CAPSULE_TESTING_PLAN.md`
- `npm run build:check`
- `npm run kanban:lint`

AUTONOMIA & CHECK-IN
- Autonomia Alta; procedi con l'estensione del documento basandoti sul testing plan esistente

KANBAN COMPLETION
1. Stato Kanban → "Completato" con data.
2. Evidence `test-results/iv-poi-qa-checklist-<data>.log`.
3. Documento ACTIVITY_CAPSULE_TESTING_PLAN.md esteso con sezione QA completa.

NOTE
- Focus su procedure pratiche di testing, non implementazione
- Includi esempi di come catturare evidence per ogni blocco
- Mantieni coerenza con lo stile e struttura del documento esistente

ANTI-STALL DIRECTIVE
- Procedi autonomamente: non attendere conferme aggiuntive salvo istruzioni contrarie esplicite.

ANTICIPATED QUESTIONS
Q: Devo includere istruzioni per specifici browser?
A: Sì, menziona Chrome DevTools come primary e fallback per altri browser

Q: Come formattare la sezione "Cosa mostrare al tester"?
A: Usa la stessa struttura markdown del documento esistente con sottosezioni chiare e bullet points

Q: Devo includere esempi di comandi Playwright?
A: Sì, includi esempi base per screenshot e video capture se rilevante

EVIDENCE LOG
- test-results/iv-poi-qa-checklist-<data>.log
