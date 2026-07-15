# POI-JOB-DETAIL-FIX - POI Job Detail Roster Integration Fix

**AGENT:** Idle Village Runtime Integration Specialist
**OBIETTIVO:** Fix POI job detail page issues: start button only for quests, config-first data flow, proper SlotRack behavior

## FILE TARGET
- [esistente] `src/ui/idleVillage/pages/PoiDetailJobRosterIntegrationPage.tsx`
- [esistente] `src/ui/idleVillage/skins/activityCapsuleDetail/ActivityCapsuleDetailSkinAware.tsx`
- [esistente] `src/ui/idleVillage/components/ResidentSlotRack.tsx`
- [nuovo] `src/balancing/config/idleVillage/poiColorConfig.ts`

## DIPENDENZE
-

## INVARIANTI (NON DEROGABILI)
Rispetta sempre `.windsurf/rules/` — skin di default (`useSkinPreferences` / `DEFAULT_SKIN_PRESET_ID`), i18n via `react-i18next` (nessuna stringa hardcoded, ns `common`/`idleVillage`), persistenza solo via `@/shared/persistence/PersistenceService`, config-first + Zod, tema Gilded Observatory. Valgono a prescindere da come è formulata la richiesta; in caso di conflitto segnala invece di derogare.

## UI PHILOSOPHY REFERENCE
- Se questo task coinvolge UI/interazioni/animazioni/drag-drop/game feel, consulta OBBLIGATORIAMENTE: `docs/plans/ui_game_dev_system_prompt.md`
- Applica principi 2026: React Compiler-first, useRef per high-frequency updates, GPU-optimized CSS, juicy feedback (visual+audio+tactile), Zustand per state, config-first architecture.
- Checklist pre-commit UI: <16ms/frame, zero hardcoded values, transform/opacity only, layered feedback.

## OPERAZIONI DA ESEGUIRE
0. [OBBLIGATORIO] Subito dopo `npm run prompt:check`, apri `src/docs/docs/coordinator/agent_assignments.md`, marca il prompt come "In corso" con agente/data e descrizione aggiornata (nessun altro comando prima di questo).
1. Create config-first color configuration:
   - Create `src/balancing/config/idleVillage/poiColorConfig.ts` with Zod schema
   - Move `WILDERNESS_COLORS` from page to config module
   - Add color mappings for all pillars (wilderness, empire, etc.)
   - Export `getDefaultPoiColors(pillar: string)` function
2. Fix start button conditional rendering:
   - In `PoiDetailJobRosterIntegrationPage.tsx`, modify `detailProps` to conditionally provide `onStart` only for quest activities
   - Use `activityKind === 'quest'` check before adding `onStart` handler
   - Verify `onCancel` and `onCollect` also follow quest-only pattern
3. Implement proper SlotRack integration:
   - Add missing `getSlotActivityState` handler in page component
   - Add `resolveDisplayInfo` handler for slot icons/labels
   - Ensure proper drop state propagation to `ResidentSlotRack`
   - Test slot click/detach functionality
4. Update data flow to be fully config-first:
   - Replace hardcoded color references with config imports
   - Verify all UI tokens come from Style Lab or config modules
   - Add telemetry for POI detail interactions (start/cancel/collect)
5. Test and verify fixes:
   - Navigate to `/poi-job-detail-roster-integration`
   - Verify start button only appears for quest POIs
   - Verify all colors come from config (no hardcoded values)
   - Test SlotRack drag/drop and slot interactions

## OPERAZIONI VIETATE
- Non toccare componenti legacy o pagine non correlate
- Non aggiungere hardcoded colors o valori UI
- Non modificare la struttura base di `ActivityCapsuleDetailSkinAware`

## ASSUNZIONI
- Esegui direttamente i passi noti senza chiedere conferma.
- Completa l'intera sequenza di operazioni in modo consecutivo, senza pause tra gli step finché tutti non risultano verdi; passa allo step successivo appena il precedente è riuscito e fermati solo se una verifica fallisce.
- Se incontri un blocco, logga il problema (file + errore) e fermati.

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
- Prima di iniziare, esegui `npm run prompt:check -- POI-JOB-DETAIL-FIX` e **aggiorna immediatamente** la riga Kanban a "In corso" con agente/data prima di qualsiasi altro comando.
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
- `CHANGELOG.md` (entry for POI job detail fixes)

## REGRESSION SAFEGUARDS
- Tutti i safeguard (test, build, lint) devono passare secondo `agent_execution_guidelines.md`
- Se qualsiasi safeguard fallisce, il task è bloccato e non può essere completato
- Includi sempre clausola "se una verifica fallisce, fermati e segnala il blocco"

## NOTE
- Config-first design: tutti i colori e token devono venire da `poiColorConfig.ts`
- I18n: assicurarsi che tutte le stringhe user-facing usino `useTranslation`
- Telemetry: aggiungere tracking per interazioni POI detail
- SlotRack: verificare che `getSlotActivityState` e `resolveDisplayInfo` siano propriamente implementati

```text
KANBAN UPDATE REMINDER
- Quando prendi questo prompt, imposta lo stato in `src/docs/docs/coordinator/agent_assignments.md` su "In corso" con la data e il tuo nome.
- Al completamento, imposta lo stato su "Completato" con la data e un riferimento al log evidence.
```
