AGENT
Documentation Specialist – Plan Integration

ISTRUZIONI AGENTE
Sei un agente Windsurf: consulta la skill `agent-execution-mandate` prima di iniziare, segui il mandato, completa la safeguard suite ed esegui le consegne Kanban.

OBIETTIVO
Aggiornare piani esistenti (MASTER_PLAN, progression system, etc.) per integrare gameplay modifier registry.

PROMPT READINESS
FILE TARGET
- [esistente] docs/MASTER_PLAN.md
- [esistente] docs/plans/idle_village_progression_system_plan.md
- [esistente] docs/plans/idle_village_tick_fatigue_plan.md
- [esistente] .windsurf/plans/style-lab-flexibility-1a9890.md
- [esistente] docs/plans/idle_village_modifiers_plan.md (da GM-REG)

STYLE LAB PRESET
- N/A (task documentazione)

TEST ROUTE QA
- N/A (nessuna superficie /test coinvolta)

DATO DI ORIGINE
- Documento: strategy_tasks.md GM-MP – Core Plan Updates per Gameplay Modifier System

DIPENDENZE
- GM-ENG completato (engine implementation disponibile)

OPERAZIONI DA ESEGUIRE
1. **MASTER_PLAN Integration**: Aggiungere sezione gameplay modifiers con reference al registry, timeline, KPI
2. **Progression System Update**: Integrare modifier system in idle_village_progression_system_plan.md con esempi di usage
3. **Tick/Fatigue Plan**: Collegare modifier system con idle_village_tick_fatigue_plan.md per fatigue modifiers
4. **Style Lab Alignment**: Aggiornare style-lab-flexibility-1a9890.md con modifier metadata rendering tokens
5. **Cross-References**: Aggiungere link al registry in tutti i piani correlati, rimuovere hardcoded numbers
6. **Modifier Plan Completion**: Finalizzare idle_village_modifiers_plan.md con engine integration examples

OPERAZIONI VIETATE
- Vietato introdurre nuovi hardcoded numbers nei piani
- Vietato creare nuovi panni (solo aggiornare esistenti)
- Vietato skip cross-reference linking

ASSUNZIONI
- Tutti i piani target esistono e sono editabili
- Registry e engine details disponibili da GM-REG/GM-ENG
- Style Lab tokens possono essere referenziati

REGRESSION SAFEGUARDS
- `npm run lint -- docs/`
- `npm run build:check`
- `npm run kanban:lint`

AUTONOMIA & CHECK-IN
- Autonomia media; apri blocker solo se piani non sono editabili

KANBAN COMPLETION
1. Stato Kanban -> "Completato" con data odierna
2. Evidence: `test-results/gm-mp-plan-updates-<YYYY-MM-DD>.log`
3. Report finale con: piani aggiornati, cross-reference complete, hardcoded numbers rimossi

NOTE
- Citare nei log: `PROJECT_PHILOSOPHY.md`, tutti i piani aggiornati, `style-lab-flexibility-1a9890.md`
- Integration-focused: focus su collegare registry esistente, non creare nuovo
- Consistency: assicurarsi che tutti i piani usino la stessa terminology

ANTI-STALL DIRECTIVE
Procedi autonomamente: non attendere conferme aggiuntive salvo istruzioni contrarie esplicite.

CONFIG STRUCTURE
- Nessun nuovo config (task di documentazione)
- Update esistenti con riferimenti a `gameplayModifierRegistry.ts` e `gameplayModifierEngine.ts`

EVIDENCE LOG
- test-results/gm-mp-plan-updates-<YYYY-MM-DD>.log
