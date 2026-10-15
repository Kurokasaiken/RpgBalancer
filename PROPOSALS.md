# PROPOSALS

Candidati a regola. **Non sono canone**: li promuove solo il Director (`CANON.md` / `AGENTS.md` non si toccano da qui).
Soglia: pattern visto in almeno due contesti distinti o in due sessioni diverse.

## P-001 — Un claim di successo ha bisogno di un testimone che possa vedere, e di un blocco di chiusura (2026-10-14)

**Stato:** proposta, in attesa del Director.
**Pattern:** `.mw/runs/20261014-094734-invasion-verification/pattern-candidate.md` §1.
**Istanze (3 contesti):** R-056 mare 2026-09 · R-177 2026-10-08 · invasione `/game` 2026-10-13/14 (`.mw/bugs/20261014-verification-false-pass/bug.md`).
**Già coperto in parte da:** `context/recurring-traps.md` T-04 (claim percettivi: occhio nel browser reale, non solo metrica).

**Cosa si propone di aggiungere a T-04 (3ª istanza):**
1. Il testimone deve *poter* vedere ciò che si afferma. Browser pane `hidden` non lo è per animazioni; Playwright headless con frame sampling e contact sheet sì.
2. Dove il testimone non esiste, l'unico stato ammesso è `NON VERIFICATO`; un controllo che non ha girato è `NON ESEGUITO` (es. `tsc` fermo su errori di sintassi altrui).
3. Blocco di chiusura obbligatorio per modifiche a scene/animazioni: `Richiesto / Verificato con / NON verificato / Anomalie osservate`.
4. Un'anomalia osservata ha un esito, non una nota.

**Applicato 2026-10-14 (Director: «procedi, tocca entrambi»):** pointer al pre-flight delle trappole, valido anche senza invocare skill, in `AGENTS.md` (Workflow) e `CLAUDE.md`. Il testo delle clausole 1-4 in T-04 **non** è stato modificato: resta in attesa.

**Gap che il pointer affronta (1 istanza):** il pre-flight non scatta se non si invoca `mw-executor` — vedi pattern 2 e decisioni 1-2 del piano `.mw/plans/verification-false-pass-prevention.md`.
