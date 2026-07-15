# POI-DETAIL-VISUAL-IMPROVEMENTS - POI Detail Visual Improvements

**AGENT:** Idle Village Runtime Integration Specialist  
**OBIETTIVO:** Fix POI detail panel drag behavior and apply material-consistent visual improvements to roster frame, stat bars, portraits, and filter controls

## FILE TARGET
- [esistente] `src/ui/idleVillage/pages/PoiDetailJobRosterIntegrationPage.tsx`
- [esistente] `src/ui/wanderlust-surface/layout/WanderlustStatBar.tsx`
- [esistente] `src/ui/wanderlust-surface/layout/WanderlustPortrait.tsx`
- [esistente] `src/ui/idleVillage/components/ResidentRosterPanel.tsx`
- [esistente] `src/ui/idleVillage/skins/rosterSkinConfig.ts`
- [esistente] `src/ui/wanderlust-surface/matericSkinConfig.ts`

## DIPENDENZE
-

## INVARIANTI (NON DEROGABILI)
Rispetta sempre `.windsurf/rules/` — skin di default (`useSkinPreferences` / `DEFAULT_SKIN_PRESET_ID`), i18n via `react-i18next` (nessuna stringa hardcoded, ns `common`/`idleVillage`), persistenza solo via `@/shared/persistence/PersistenceService`, config-first + Zod, tema Gilded Observatory. Valgono a prescindere da come è formulata la richiesta; in caso di conflitto segnala invece di derogare.

## UI PHILOSOPHY REFERENCE
- Se questo task coinvolge UI/interazioni/animazioni/drag-drop/game feel, consulta OBBLIGATORIAMENTE: `docs/plans/ui_game_dev_system_prompt.md`
- Applica principi 2026: React Compiler-first, useRef per high-frequency updates, GPU-optimized CSS, juicy feedback (visual+audio+tactile), Zustand per state, config-first architecture.
- Checklist pre-commit UI: <16ms/frame, zero hardcoded values, transform/opacity only, layered feedback.

## OPERAZIONI DA ESEGUIRE

### 0. [OBBLIGATORIO] Kanban Update
Subito dopo `npm run prompt:check`, apri `src/docs/docs/coordinator/agent_assignments.md`, marca il prompt come "In corso" con agente/data e descrizione aggiornata (nessun altro comando prima di questo).

### 1. Fix POI Detail Drag Behavior
**Problema:** Il pannello POI detail si trascina in modo strano e lo slotRack al suo interno non si comporta come dovrebbe (e come fa nel detail della quest).

**Azioni:**
- Compara `PoiDetailJobRosterIntegrationPage.tsx` con `PoiDetailQuestRosterIntegrationPage.tsx`
- Identifica le differenze nella logica di positioning e integrazione slot rack
- Allinea la logica di drag con l'implementazione quest detail
- Verifica che lo slot rack riceva la corretta propagazione dello stato drag
- Testa le operazioni drag end-to-end

### 2. Uniformare la Cornice del Roster
**Problema:** Il pannello "Roster 3/3" è una scatola di plastica arrotondata trasparente invece di avere la stessa cornice della scheda di destra.

**Fix:**
- Estendi `rosterSkinConfig.ts` con token per la cornice del roster
- Aggiungi variabili per bordo bronzo/dark
- Aggiungi token per border radius e smusso (2-3px invece di rounded-lg)
- Aggiungi token per profondità background e ombre
- Sostituisci `rounded-lg border` con styling driven da config
- Applica bordo bronzo/dark dallo skin config
- Riduci border radius a leggero smusso
- Mantieni trasparenza aggiungendo profondità materiale

### 3. Scavare le barre di HP e Stamina
**Problema:** Le barre sono "tubi" di plastica lisci e arrotondati (stile pillola) invece di sembrare incise nella pietra.

**Fix:**
- Aggiorna `matericSkinConfig.ts` con token per track scavato
- Riduci border radius a 2px o angoli netti
- Aggiungi forte ombra interna al background del track: `box-shadow: inset 0 2px 4px rgba(0,0,0,0.6)`
- Assicurati che il fill HP appaia come linfa verde nel canale scavato
- Assicurati che il fill Stamina appaia come polvere d'oro nel canale scavato
- Mantieni specular highlight per effetto gemma liquida
- Config tokens controllano tutti i valori shadow e radius

### 4. I Ritratti dei Personaggi come "Cammei"
**Problema:** I ritratti circolari fluttuano con un cerchietto luminoso attorno che fa molto "fantascienza/cyberpunk".

**Fix:**
- Aggiorna `matericSkinConfig.ts` con token per frame cameo
- Sostituisci bordo glowing sci-fi con materiale bronzo/ottone
- Allinea il frame al visual language dei perni dell'astrolabio
- Riduci o rimuovi effetto glow sci-fi
- Assicurati che il ritratto appaia come medaglia fisica
- Il ritratto deve sembrare un cammeo incastonato in una medaglia fisica di metallo

### 5. I Filtri in alto a destra (TUTTI, Spade, Occhio)
**Problema:** Quel dropdown "TUTTI" e i due cerchietti di filtro sono troppo minimalisti e "web-style".

**Fix:**
- Aggiorna `rosterSkinConfig.ts` con token per controlli filtro
- Applica background più scuro al selettore "TUTTI"
- Aggiungi bordo bronzo al dropdown
- Styla i pulsanti spade/occhio come borchie/fustelle metalliche premute
- Aggiungi ombre interne e bordi materiali per profondità fisica
- I due pulsanti rotondi devono sembrare delle piccole borchie o fustelle metalliche premute nel pannello

### 6. Verifica Coerenza Visiva
**Azioni:**
- Compara cornice roster con trattamento bordo pannello destro
- Verifica che le barre stat corrispondano all'estetica pietra scavata
- Controlla che i frame ritratto corrispondano al visual language astrolabio
- Conferma che i controlli filtro corrispondono ad altri controlli materiali
- Testa tutti i miglioramenti in contesti light e dark

### 7. Test Drag and Drop Functionality
**Azioni:**
- Testa drag resident da roster a POI detail
- Testa drag resident da roster a slot rack detail
- Testa assegnazione click
- Testa clear slot e animazione return
- Verifica animazioni flight funzionino correttamente

### 8. Safeguard Suite
**Azioni:**
1. Prima di qualsiasi modifica: `npm run build` (baseline)
2. Ogni 10min: `npm run build` (incrementale)
3. Prima di completare: `npm run safeguard suite`
4. Se build fallisce: FERMATI e segnala blocco
5. Evidence log DEVE contenere output completo di: `npm run build`, `npm run lint`, `npm run test`

## OPERAZIONI VIETATE
- Non toccare la sezione "Requirements" (Strength/Endurance) - l'utente ha notato che è perfetta
- Non modificare tipografia e spaziature - l'utente ha notato che sono perfetti
- Non aggiungere hardcoded colors o valori UI
- Non creare nuovi skin system standalone
- Non modificare componenti legacy non correlati

## ASSUNZIONI
- Esegui direttamente i passi noti senza chiedere conferma.
- Completa l'intera sequenza di operazioni in modo consecutivo, senza pause tra gli step finché tutti non risultano verdi; passa allo step successivo appena il precedente è riuscito e fermati solo se una verifica fallisce.
- Se incontri un blocco, logga il problema (file + errore) e fermati.
- Config-first design: tutti i colori e token devono venire da skin config modules
- Tutti i miglioramenti devono mantenere performance <16ms/frame

## NODE.JS LOCALE (OBBLIGATORIO)
Prima di qualsiasi comando npm/eslint/test esegui **dentro il progetto**:
```bash
source ~/.nvm/nvm.sh
nvm use 20.19.6
node --version
```
Non aggiornare/alterare la versione globale di Node.js: usa solo quanto definito in `.nvmrc`.

## KANBAN SAFETY
- **GUIDELINES OBBLIGATORIE**: Segui `docs/coordinator/agent_execution_guidelines.md` per lock, safeguard suite, evidence collection, e completamento Kanban.
- Prima di iniziare, esegui `npm run prompt:check -- POI-DETAIL-VISUAL-IMPROVEMENTS` e **aggiorna immediatamente** la riga Kanban a "In corso" con agente/data prima di qualsiasi altro comando.
- Dopo completamento, esegui safeguard suite (test + build + lint) e aggiorna Kanban secondo le guidelines.

## SAFEGUARD MANDATORY STEPS
1. Prima di qualsiasi modifica: `npm run build` (baseline)
2. Ogni 10min: `npm run build` (incrementale)
3. Prima di completare: `npm run safeguard suite`
4. Se build fallisce: FERMATI e segnala blocco
5. Evidence log DEVE contenere output completo di: `npm run build`, `npm run lint`, `npm run test`

## BLOCCANTI ASSOLUTI
- ❌ TypeScript errors (anche 1 solo)
- ❌ Lint errors (anche 1 solo)
- ❌ Test failures (anche 1 solo)
- ❌ Kanban lint fallito

**SE QUALSIASI DI QUESTI FALLISCE, IL TASK È BLOCCATO.**

## OUTPUT ATTESI
- Segui safeguard suite da `agent_execution_guidelines.md` (test + build + lint)
- Evidence log in `test-results/` secondo le guidelines
- Report finale con lock, safeguard, e Kanban update evidence

## DOCUMENTAZIONE DA AGGIORNARE
- `src/docs/docs/plans/idle_village_plan.md` (section on POI detail integration)
- `CHANGELOG.md` (entry for POI detail visual improvements)

## REGRESSION SAFEGUARDS
- Tutti i safeguard (test, build, lint) devono passare secondo `agent_execution_guidelines.md`
- Se qualsiasi safeguard fallisce, il task è bloccato e non può essere completato
- Includi sempre clausola "se una verifica fallisce, fermati e segnala il blocco"

## NOTE
- Config-first design: tutti i colori e token devono venire da skin config modules
- I18n: assicurarsi che tutte le stringhe user-facing usino `useTranslation`
- Telemetry: aggiungere tracking per interazioni POI detail
- Drag behavior: deve corrispondere esattamente al comportamento quest detail
- Tutti i miglioramenti devono mantenere performance <16ms/frame
- Preserve Requirements section (Strength/Endurance) - user noted it's perfect
- Preserve typography and spacing - user noted they're perfect

```text
KANBAN UPDATE REMINDER
- Quando prendi questo prompt, imposta lo stato in `src/docs/docs/coordinator/agent_assignments.md` su "In corso" con la data e il tuo nome.
- Al completamento, imposta lo stato su "Completato" con la data e un riferimento al log evidence.
```
