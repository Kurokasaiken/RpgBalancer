---
title: "PLAN-011 — Knowledge & Design Repository Inventory"
status: completed
owner: executor
created: 2026-08-30
closed: 2026-08-30
---

# PLAN-011 — Knowledge & Design Repository Inventory

## Goal

Catalogare ogni file di conoscenza che esiste già nel repository RPG (`src/docs/docs/`, `context/`, `plans/`, `.mw/`, root files) senza muoverlo né modificarlo, classificarlo per autorità corrente, rilevare conflitti e produrre i primi artefatti di governance.

## In Scope

- Walk file-system read-only su `src/docs/docs/`, `context/`, `plans/`, `.mw/`, root files (`RICHIESTE.md`, `AGENTS.md`, `.windsurf/rules/`, `DESIGN_PILLARS.md`).
- Estrazione di metadati dai marker di primo livello (`# Canonical`, `# ADR`, `# TODO`, `# Conflict`, `superseded-by:`) e da euristiche su path e nomi.
- Classificazione in: `canonical`, `candidate`, `historical`, `transient`, `superseded`, `conflicting`.
- Produzione di `KNOWLEDGE_INVENTORY.md`, `KNOWLEDGE_CONFLICTS.md`, `docs/SOURCE_PRIORITY.md` (candidato), `decisions/ADR-TEMPLATE.md`.

## NOT In Scope

- Muovere, rinominare o cancellare qualsiasi file esistente.
- Costruire MCP, API, database o qualsiasi layer di scrittura automatica.
- Convertire automaticamente `DECISION_LOG.md` in ADR: si produce solo un template.
- Duplicare o interferire con `PLAN-006-docs-and-code-alignment.md` (idle_village specifico): questo piano è trasversale.

## Decisions

| # | Decision | Reason |
|---|---|---|
| D1 | Inventario via script TypeScript `scripts/inventory.ts` | Stack già presente, YAGNI, nessuna dipendenza nuova. |
| D2 | Catalogo in-place, nessun spostamento | Non perdere informazioni, non creare conflitti di merge. |
| D3 | Classificazione basata su marker espliciti + euristiche path | Deterministica, falsificabile, estensibile. |
| D4 | `KNOWLEDGE_CONFLICTS.md` elenca solo conflitti **diretti** con provenance | Evita falsi positivi; conflitti path+marker espliciti. |
| D5 | `decisions/ADR-TEMPLATE.md` è l'unico output in `decisions/` | Niente ADR reali senza approvazione del Director. |

## Tasks

| ID | Task | Output | Acceptance |
|---|---|---|---|
| T-001 | Walk file system e generare `FULL_FILE_LIST.json` | `docs/FULL_FILE_LIST.json` | Tutti i file rilevanti inclusi; nessun file modificato. |
| T-002 | Estrarre metadata dai marker di primo livello | `docs/FILENAMES_METADATA.json` | ≥90% file parsati, miss loggati. |
| T-003 | Classificare ogni file per regole | `docs/CLASSIFICATION.md` | Ogni file ha una classificazione coerente. |
| T-004 | Generare `KNOWLEDGE_INVENTORY.md` strutturato | `KNOWLEDGE_INVENTORY.md` | Una sezione per classificazione, link ai file. |
| T-005 | Rilevare conflitti tra fonti | `KNOWLEDGE_CONFLICTS.md` | Conflitti con path, motivo, provenance. |
| T-006 | Scrivere candidato `docs/SOURCE_PRIORITY.md` | `docs/SOURCE_PRIORITY.md` | Gerarchia desiderata v18, esempi concreti. |
| T-007 | Creare template ADR | `decisions/ADR-TEMPLATE.md` | YAML front-matter e sezioni obbligatorie. |

## Verification Commands

- `npm run inventory -- --action list` → produce `docs/FULL_FILE_LIST.json`
- `npm run inventory -- --action meta` → produce `docs/FILENAMES_METADATA.json`
- `npm run inventory -- --action classify` → produce `docs/CLASSIFICATION.md`
- `npm run inventory -- --action conflicts` → produce `KNOWLEDGE_CONFLICTS.md`
- `npm run inventory -- --action priority` → produce `docs/SOURCE_PRIORITY.md`
- `npm run inventory -- --action template` → produce `decisions/ADR-TEMPLATE.md`
- `npm run build:check` (se tocca import; per ora read-only, opzionale)
- `npm run kanban:lint` (se il Kanban include piani)

## Acceptance Criteria

1. Nessun file esistente è stato alterato.
2. `FULL_FILE_LIST.json` contiene tutti i file rilevanti.
3. `CLASSIFICATION.md` assegna coerentemente una classificazione a ciascun file.
4. `KNOWLEDGE_INVENTORY.md` è leggibile e strutturato per classificazione.
5. `KNOWLEDGE_CONFLICTS.md` elenca conflitti con path e motivazione.
6. `SOURCE_PRIORITY.md` riflette la gerarchia: Explicit Director approval > Accepted ADR > Canonical docs > Validated game-data > Code+tests > AGENTS.md/rules > RICHIESTE.md > context/ > .mw/ > AI conversations.
7. `ADR-TEMPLATE.md` contiene campi: `title`, `status`, `date`, `decision_owner`, `supersedes`, `superseded_by`, `context`, `decision`, `rationale`, `consequences`, `rejected_alternatives`, `related`.
8. `PLAN-006` non viene toccato né duplicato.

## Risks & Mitigations

| Risk | Mitigation |
|---|---|
| Marker non presenti → classificazione errata | Fallback su path e nome; loggare incertezze. |
| Falsi conflitti per nomi simili | Conflitto solo se marker esplicito o duplicato numero ADR. |
| Script si rompe su file grandi / binari | Escludere `node_modules/`, `dist/`, `public/assets/` per default. |
| Stakeholder dissentono sulla gerarchia | `SOURCE_PRIORITY.md` marcato come `candidate` e pronto per review. |

## Deliverables

- `docs/FULL_FILE_LIST.json`
- `docs/FILENAMES_METADATA.json`
- `docs/CLASSIFICATION.md`
- `KNOWLEDGE_INVENTORY.md`
- `KNOWLEDGE_CONFLICTS.md`
- `docs/SOURCE_PRIORITY.md` (candidate)
- `decisions/ADR-TEMPLATE.md`
