# Session handoff

**Current state:** `PLAN-011-knowledge-repository-inventory` completato (2026-08-30). Tutti i task T-001..T-007 eseguiti. Desiderata di riferimento: **v18 FROZEN**.

**Next step:** Review umano di `KNOWLEDGE_INVENTORY.md` e `KNOWLEDGE_CONFLICTS.md`, quindi Fase 2 — canonicalizzazione (selezionare ADR da `context/DECISION_LOG.md` e allineare `/docs`) o eventuale commit dello stato attuale.

## Decisions made

- **Piano ombrello per il Knowledge & Design Repository** (2026-08-30, Director «sì»). Fase 1 = inventory read-only, nessuna modifica ai file esistenti, nessun MCP/database.
- **Git resta record system; MCP è solo access layer futuro.**
- **`PLAN-006` non viene duplicato**: idle_village resta in scope di quel piano.
- **Classificazione iniziale**: canonical / candidate / historical / transient / superseded / conflicting.
- **Gerarchia source priority**: Explicit Director approval > Accepted ADR > Canonical /docs > Validated /game-data > Code+tests > AGENTS.md / rules > RICHIESTE.md > context/ > .mw/ > AI conversations.

## Do not touch

- Nessun file esistente (`src/docs/docs/`, `context/`, `.mw/`, `plans/`, root) durante la fase di inventory.
- `PLAN-006-docs-and-code-alignment.md` e il lavoro idle_village ad esso associato.
- Non creare ADR reali: solo template `decisions/ADR-TEMPLATE.md`.

## Working tree non committato

- Nuovi file: `plans/PLAN-011-knowledge-repository-inventory.md`, `scripts/inventory.ts`, `docs/FULL_FILE_LIST.json`, `docs/FILENAMES_METADATA.json`, `docs/CLASSIFICATION.md`, `KNOWLEDGE_INVENTORY.md`, `KNOWLEDGE_CONFLICTS.md`, `docs/SOURCE_PRIORITY.md`, `decisions/ADR-TEMPLATE.md`.
- Modificati: `package.json` (+ script `inventory`), `ROADMAP.md`.
- Da committare su esplicito avallo. Il precedente handoff di `PLAN-010-astrolabe-v63` è nella history git.

## Open questions

- Quale stack per il futuro MCP (Node/TypeScript, Python, stdio/SSE)?
- Quando abilitare il write path del MCP?
- Come trasferire contenuti dalle conversazioni ChatGPT (processo manuale, fuori scope di questo piano).
- Se il pattern Knowledge Repository debba essere clonabile per altri progetti.
- Se `KNOWLEDGE_CONFLICTS.md` va affinato per ridurre ulteriori falsi positivi.
