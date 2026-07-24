AGENT
WL-WPG-001-CONCEPT — World Presence Grammar: Goblin Invasion 4-Frame Concept + Delta Test

ISTRUZIONI
Sei un agente Windsurf: consulta le skill `agent-execution-mandate` e `coordinator-mandate` prima di iniziare.
Questa e' la fase CONCEPT del master task `WL-WPG-001`.

OBIETTIVO
Produrre il concept a 4 frame dell'invasione goblin, passare il Delta Test, e draftare la grammar matrix.

FILE CHIAVE
- `docs/art-direction/presences/goblin-invasion-concept.md` (nuovo)
- `src/docs/docs/plans/world_presence_grammar_plan.md` (aggiorna changelog CONCEPT)

INVARIANTI
- Delta Test §4.1: 40px asset, no-hover, 3am test.
- World Presence Grammar Matrix §3.2 implementata come config (draft).
- No codice runtime in questa fase.
- Markdown lint compliant.

OPERAZIONI DA ESEGUIRE
1. Scrivere `goblin-invasion-concept.md` con:
   - 4 frame descritti (idle/presage/active/aftermath).
   - Asset requirements 40px, no-hover states, 3am visibility.
   - Delta Test checklist.
2. Definire draft della Grammar Matrix: entity types, states, transitions, visual grammar rules.
3. Aggiornare `world_presence_grammar_plan.md` changelog CONCEPT.

OPERAZIONI VIETATE
- Implementare `PresenceValidator.ts` o config in questa fase (deve essere WL-WPG-001-CONFIG).
- Scrivere componenti React.
- Lasciare frame o testi placeholder.

ASSUNZIONI
- `art_direction_plan.md` v0.11 sara' disponibile/referenziato.
- Il concept e' documentazione visiva, non asset grafici.

SAFEGUARDS
- `npm run lint -- docs`
- `npm run build:check`
- `npm run kanban:lint`
- Evidence log: `test-results/wl-wpg-001-concept-2026-07-23.log`

NOTE
- Quando prendi questo prompt, imposta la riga `WL-WPG-001-CONCEPT` in `src/docs/docs/coordinator/agent_assignments.md` su `In corso`.
- Al completamento: `KANBAN STATUS: WL-WPG-001-CONCEPT – Completato (Evidence: test-results/wl-wpg-001-concept-2026-07-23.log)`
