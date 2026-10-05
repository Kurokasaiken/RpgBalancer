---
title: The New Observatory → Canonical Design-System Primitives (Dual-track)
status: active
created: 2026-08-18
authorized_by: Fausto
reason: avallo via "confermo" in sessione
---

# Goal

Estrarre da *The New Observatory (Prototype)* in `/visual-fidelity-lab` le prime primitive visive canoniche, collocarle in `src/ui/designSystem/primitives/`, e adottarle in parallelo nei componenti RPG. L’ordine non è rigido: inventario, specifica, implementazione e migrazione procedono in parallelo con checkpoint incrociati.

# Vincoli

- Desiderata v8 (Golden UI Foundation) — da verificare/aggiornare se serve.
- `AGENTS.md`: skin system, component reuse, config-first, i18n, JSDoc, safeguards.
- `/visual-fidelity-lab` e `/design-system` sono le superfici di riferimento.
- Non creare primitive speculative (YAGNI). Ogni primitiva nasce da un caso reale e viene “battezzata” solo dopo evidenza + approvazione.

# Track A — Extraction (primitive canoniche)

1. **Inventario** — elenco visivo degli elementi di The New Observatory con screenshot, nome provvisorio, file sorgente.
2. **Decomposizione** — separare livelli: `Frame`, `Surface`, `Inset`, `Medallion`, `StatBar`, `Dial`, `Glyph`, `Typography`.
3. **Specifica** — per ogni candidata: nome, token, stati, props, accessibilità, casi d’uso.
4. **Implementazione** — in `src/ui/designSystem/primitives/<name>.tsx`.
5. **Baptismo** — approvazione esplicita (verbalmente o via doc) + catalogo in `componentCatalog.ts` + trusted doc.

# Track B — Adoption

1. **Mappatura** — ogni componente esistente segnala quale primitiva usa.
2. **Migrazione pilota** — `DragTestContainer` o `PgCard` come primo banco di prova.
3. **Cross-check** — se una primitiva fallisce in un componente, si apre una variante o si scarta/merge.
4. **Regression guard** — build, lint, screenshot Playwright per ogni primitiva adottata.

# Decisioni chiuse

- **Sede primitive:** `src/ui/designSystem/primitives/`.
- **Processo:** nessuna primitiva diventa canonica senza evidenza + approvazione.
- **Ordine:** non rigido, parallelo con checkpoint.

# Decisioni ancora aperte

- `Frame` wrapper o overlay? → si decide sull’inventario reale.
- Consumo: prop/config/wrapper? → si decide sull’adoption pilota.
- Namespace token: `--materic-*` o altro? → si decide con l’audit dei token esistenti.

# Deliverabili

1. Inventario in `.mw/runs/` + catalogo primitiva candidate.
2. Primitiva `MatericFrame` (o primo nome) implementata e documentata.
3. Componente pilota migrato.
4. Baseline Playwright.
5. Trusted doc aggiornato.
