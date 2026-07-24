AGENT
ART-DIR-UPDATE-001 — Art Direction Plan: Update to v0.11 + Rendering System Rules

ISTRUZIONI
Sei un agente Windsurf: consulta le skill `agent-execution-mandate` e `coordinator-mandate` prima di iniziare.
Questa e' la fase UPDATE-001 del master task `ART-DIR-001`.

OBIETTIVO
Aggiornare l'Art Direction Plan a v0.11 includendo le regole del rendering system e la kill list aggiornata.

FILE CHIAVE
- `src/docs/docs/plans/art_direction_plan.md` (modifica)
- `src/docs/docs/plans/rendering_system_implementation_plan.md` (riferimento, non modificare se non per link)

INVARIANTI
- Documento e' una bible, non codice; governance sections devono essere sincronizzate con `rendering_system_implementation_plan.md`.
- No duplicazione tra documenti; usare link e riferimenti.
- Markdown lint compliant.

OPERAZIONI DA ESEGUIRE
1. Aggiornare versione a v0.11 nel front matter/changelog.
2. Aggiungere/sezionare "Rendering Grammar" con regole per materiali, frame, layer recipes.
3. Aggiornare "Kill list" con pattern visivi vietati e deprecati.
4. Aggiornare "Pillars" e link a `rendering_system_implementation_plan.md`.
5. Verificare coerenza con `art_direction_plan.md` esistente.

OPERAZIONI VIETATE
- Scrivere codice runtime in questo prompt.
- Duplicare contratti gia' presenti in `rendering_system_implementation_plan.md`.
- Lasciare sezioni placeholder.

ASSUNZIONI
- `rendering_system_implementation_plan.md` e' draft e fornisce input.
- `art_direction_plan.md` esiste gia' come v0.10.

SAFEGUARDS
- `npm run lint -- docs`
- `npm run build:check`
- `npm run kanban:lint`
- Evidence log: `test-results/art-dir-update-001-2026-07-23.log`

NOTE
- Quando prendi questo prompt, imposta la riga `ART-DIR-UPDATE-001` in `src/docs/docs/coordinator/agent_assignments.md` su `In corso`.
- Al completamento: `KANBAN STATUS: ART-DIR-UPDATE-001 – Completato (Evidence: test-results/art-dir-update-001-2026-07-23.log)`
