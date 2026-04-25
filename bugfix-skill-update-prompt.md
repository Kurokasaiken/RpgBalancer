AGENT
Coordinator – Mandate Updates

ISTRUZIONI AGENTE
Sei un agente Windsurf: consulta la skill `coordinator-mandate` prima di iniziare, segui il mandato, completa la safeguard suite ed esegui le consegne Kanban.

OBIETTIVO
Implementare "Bugfix Exception Path" per permettere fix rapidi in `src/ui/idleVillage/**` mantenendo i quality gates, come documentato in `bugfix-mandate-update.md`.

PROMPT READINESS
FILE TARGET
- [esistente] `.windsurf/skills/agent-execution-mandate/SKILL.md` — aggiungere sezione bugfix exception
- [esistente] `.windsurf/skills/coordinator-mandate/SKILL.md` — aggiungere processo bugfix approval
- [esistente] `src/docs/docs/coordinator/strategy_tasks.md` — aggiungere task BF-001
- [esistente] `src/docs/docs/PROJECT_PHILOSOPHY.md` — aggiungere principi bugfix

DIPENDENZE
-

OPERAZIONI DA ESEGUIRE
1. Aggiornare agent-execution-mandate skill con sezione "Bugfix Exception Path" che definisce condizioni, workflow permesso, safeguards richiesti e requisiti post-fix
2. Aggiornare coordinator-mandate skill con processo "Bugfix Coordination" per approvazione e registrazione rapid fix
3. Aggiungere strategy task BF-001 in strategy_tasks.md con KPIs specifici (resolution time < 30min, documentation 100%, regression 90%)
4. Aggiornare PROJECT_PHILOSOPHY.md con principi bugfix che bilanciano velocità e qualità
5. Testare il nuovo workflow con l'attuale issue Time Engine come caso pilota

OPERAZIONI VIETATE
- Rimuovere safeguards esistenti per feature normali
- Abilitare bugfix exception per modifiche architetturali o nuove feature
- Creare eccezioni senza requisiti di documentazione post-fix

ASSUNZIONI
- Le skill esistenti hanno struttura coerente per aggiunte
- Il sistema Kanban può gestire stato "Bugfix - Rapid"
- I test esistenti possono validare le modifiche alle skill

REGRESSION SAFEGUARDS
- `npm run lint -- .windsurf/skills/`
- `npm run test:unit -- --grep "skill"`
- `npm run build:check`
- `npm run kanban:lint`

AUTONOMIA & CHECK-IN
- Autonomia Alta; procedi con implementazione diretta delle skill

KANBAN COMPLETION
1. Stato Kanban → "Completato" con data
2. Evidence `test-results/bugfix-skill-update-<data>.log`
3. Verifica che le skill aggiornate siano funzionanti

NOTE
- Basato su `bugfix-mandate-update.md` per risolvere blocco development sui bugfix critici
- Mantiene qualità gates abilitando velocità per fix minimali e blocking

DOCS CONSULTED
- PROJECT_PHILOSOPHY.md – principi esistenti da estendere
- bugfix-mandate-update.md – specifiche implementazione complete
- agent-execution-mandate/SKILL.md – struttura da modificare
- coordinator-mandate/SKILL.md – processo da aggiornare
- strategy_tasks.md – dove aggiungere BF-001

EVIDENCE LOG
- test-results/bugfix-skill-update-<data>.log
