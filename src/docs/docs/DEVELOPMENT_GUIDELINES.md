---
title: RPG Balancer – Development Guidelines
status: active
owner: Engineering-Lead
last_reviewed: 2026-02-11
domain: core
description: "Operational guardrails translating philosophy and Master Plan into coding rules"
---

# RPG Balancer – Development Guidelines

These guidelines translate the **Project Philosophy** and **MASTER_PLAN Future Direction** into concrete rules for day‑to‑day development.

---

## 1. Sources of Truth

- **MASTER_PLAN.md**
  - Defines long‑term architecture and *future* (non‑implemented) work.
  - Use it to understand where the project is going.
- **IMPLEMENTED_PLAN.md**
  - Describes what is actually implemented vs. partial vs. mock.
  - Use it to avoid re‑inventing or contradicting existing systems.
- **PROJECT_PHILOSOPHY.md**
  - Defines the weight‑based creator pattern and the Style Laboratory design system.
  - Use it as the conceptual reference for all new features.

When in doubt:
- Check **IMPLEMENTED_PLAN.md** to see what exists.
- Check **MASTER_PLAN.md** to see what is planned.
- Align with **PROJECT_PHILOSOPHY.md** before writing new code.
- **Se qualcosa non è chiaro, chiedi subito chiarimenti all'utente / designer di riferimento** prima di procedere.

---

## 2. Config‑First and JSON‑Driven Rules

### Principio Fondamentale (Phase 10+)
**Niente hardcoded per layout, card, stat, formule.** Tutto è definito in config e modificabile da UI.

### Regole Operative

- **No hardcoded balancing values** in UI or logic:
  - ❌ `const hp = 100;`
  - ✅ Read from `BalancerConfigStore` or config modules.
- **Stat definitions** devono essere in `src/balancing/config/`:
  - Schema validato con **Zod**
  - Core stats (hp, damage, htk) hardcoded ma pesi editabili
  - Custom stats creabili/eliminabili da UI
- **Formulas** devono essere:
  - Definite in config, non in componenti
  - Validate con `FormulaEngine` (solo stat esistenti)
  - Editabili da UI con feedback real-time
- **Card** (raggruppamenti di stat) devono essere:
  - Definite in config
  - Creabili/eliminabili da UI (tranne Core)
  - Riordinabili con drag & drop

### File Chiave (Phase 10)
```
src/balancing/config/
├── types.ts              # Interfacce TypeScript
├── schemas.ts            # Zod validation
├── defaultConfig.ts      # Core hardcoded
├── FormulaEngine.ts      # Parser/validator formule
└── BalancerConfigStore.ts # Persistence localStorage
```

Before merging code:
- [ ] No duplicated formulas across files.
- [ ] Any new parameters or presets are declared in config.
- [ ] UI components only *read* from config via `useBalancerConfig()` hook.
- [ ] New stats/cards use Zod validation.

---

## 2.1 Persistence Guardrails (Idle Village + Global)

- **Single Service:** Tutte le letture/scritture devono passare da `src/shared/persistence/PersistenceService.ts` o dai wrapper dedicati (es. `src/ui/idleVillage/state/PersistenceService.ts`).  
  - ❌ `window.localStorage.getItem('foo')` direttamente nel componente.  
  - ✅ `await loadData('foo', defaultValue)` dentro hook/service asincroni.
- **Async-only:** niente API sincrone; ogni operazione deve essere `async`/`await` per supportare Tauri FS e fallback mobile.
- **Helpers per preferenze UI:** anche i flag “leggeri” (preset shell, toggle tema, filtri) devono avere helper centralizzati (`useVillageShellContext`, `useThemeSwitcher`, ecc.) che internamente usano PersistenceService.
- **Testing:** i test devono mockare `PersistenceService` (vedi `useSandboxDemoPanel.test.ts`, `useQuestTelemetry.test.ts`) e coprire sia load che save failure.
- **Documentazione:** ogni nuova feature che persiste dati aggiorna questa sezione + il plan pertinente con chiavi, flusso di salvataggio e motivazione.

> **Regola rapida:** Se un valore deve sopravvivere a reload/app focus, deve passare per PersistenceService – niente eccezioni per Idle Village.

---

## 3. UI/UX and Style Laboratory Canon

- The **Style Laboratory** is the sole UI/UX canon. Every surface must mount the Style Lab provider (e.g., `StyleLaboratoryPanel`, `StyleLabSurface`) or consume tokens via `useStyleLabTokens`.
- All visual work must:
  - Pull palette/typography/density from Style Lab presets (`src/ui/styleLab/presets/**`), never from legacy CSS (`observatory-*`, `color-palette.css`, inline hex values).
  - Declare which preset/preset overrides are in use (e.g., `Minimal Frontier`, `Arcane Tech Glass`). Prompts and PR descriptions must name the preset or note when introducing a new one.
  - Preserve compact, analysis-friendly layouts using Style Lab primitives (`Stack`, `Surface`, `Typography`, `TokenizedCard`).
- **Do not** reintroduce gradients or classes from the deprecated Gilded Observatory theme. If a visual need is missing, extend Style Lab presets/tokens instead of hand-coding styles.

### 3.0.1 Minimal Gameplay Component Reuse

- Il vertical slice Minimal Gameplay **non** deve introdurre versioni "Minimal*" dei componenti Idle Village già esistenti.
- Requisiti:
  - Roster → `src/ui/idleVillage/components/WorkerPanel.tsx` + `WorkerCard.tsx`
  - Activity cards → `src/ui/idleVillage/components/ActivitySlot.tsx`
  - Location/slot surfaces → `LocationCard.tsx` e altri componenti canonici della cartella `components/`
- Wrapper ammessi solo se inoltrano 1:1 props/dati (es. per iniettare config o className).
- Tutti i componenti devono leggere copy, token e soglie dal config (`minimalGameplayConfig`, balancer presets) e non da costanti locali.
- Ogni prompt o piano che tocca Minimal Gameplay deve esplicitare che i componenti Idle Village sono la base e che eventuali placeholder vanno rimossi.

When adding or modifying UI:
- [ ] Wrap the page/component in the Style Lab provider or confirm an ancestor does so.
- [ ] Source colors, spacing, borders, and typography exclusively from Style Lab tokens/config (no inline hex values or Tailwind color literals).
- [ ] Declare the required Style Lab preset (or new preset proposal) inside the prompt/plan and component JSDoc to keep expectations explicit.
- [ ] Keep formulas in **tooltips and docs**, not inline in the main layout.
- [ ] Ensure the page remains usable on mobile (tap targets, spacing, text size).

### 3.1 Legacy Observatory CSS Decommission Plan

- Files slated for archival: `src/styles/observatory.css`, `src/styles/color-palette.css`, `src/styles/fantasy-theme.css`, legacy `observatory-*` utility classes in `src/index.css`.
- Migration steps:
  1. Inventory every import/usage of the files above (use `rg "observatory" src/ -n`).
  2. For each usage, replace gradients/classes with Style Lab tokens/presets. If a token is missing, add it under `src/ui/styleLab/presets/**` with documentation.
  3. Once a file has zero usages, move it to `_OLD_DEPRECATED/styles/` and document the move in `IMPLEMENTED_PLAN.md`.
  4. Run `npm run build:check` to guard against missing imports.
- Until the cleanup is complete, new code **must not** import these legacy files. Reference this plan in prompts when work touches old styling so the executing agent prioritizes the migration path.

---

## 4. Feature Workflows

### 4.1. Adding or Extending a Creator (Spell, Item, Character, etc.)

1. **Check philosophy**
   - Confirm that the feature fits the **weight‑based creator** pattern.
2. **Define configuration**
   - Add/extend stat definitions, ticks/weights, and presets in config/JSON.
3. **Wire pure logic**
   - Implement or extend calculation modules without touching UI.
4. **Build/extend UI**
   - Use shared creator components and compact UI primitives.
5. **Document**
   - Update `IMPLEMENTED_PLAN.md` and, if appropriate, the relevant plan in `docs/plans/`.

### 4.2. Touching Combat or Balancer Logic

- Never introduce new magic numbers in combat calculations.
- Reuse or extend existing modules (hit chance, mitigation, crits, etc.).
- If a formula changes:
  - Update **shared modules**.
  - Update or add **test presets** and non‑regression cases (see Section 5).

---

## 5. Testing and Non‑Regression (JSON‑Driven)

The long‑term goal is to have **JSON‑driven non‑regression tests** for:
- Balancer
- Spell Creator
- Future creators (items, characters, etc.)

Until the full system is in place, follow these rules:

- When adding a new balancing feature or modifying core formulas:
  - Add or update **test presets** in JSON or config.
  - Add tests that:
    - Load the preset.
    - Run the relevant simulators/calculations.
    - Assert that key metrics (EDPT, TTK, attacks per KO) stay within expected ranges.
- Prefer **data‑driven tests** over handwritten per‑case assertions.

Before merging balancing changes:
- [ ] Existing presets still behave as expected.
- [ ] New presets are documented and named clearly.
- [ ] Tests cover the main edge cases for the modified module.

---

## 6. Documentation Hygiene

- **MASTER_PLAN.md** stays focused on **future** work only.
- Any non‑trivial implemented feature must be reflected in:
  - `IMPLEMENTED_PLAN.md` (status and pointers).
  - Optionally, a dedicated plan or spec in `docs/plans/`.
- When deprecating a feature or UI:
  - Mark it as such in `IMPLEMENTED_PLAN.md`.
  - Avoid deleting historical context from old plans; instead, reference the new direction.

Checklist when finishing a meaningful feature:
- [ ] Code merged.
- [ ] Tests added/updated.
- [ ] `IMPLEMENTED_PLAN.md` updated.
- [ ] Any relevant `docs/plans/*.md` updated or referenced.

---

## 7. Practical Do/Donts Summary

- **Do**
  - Centralize stats, weights, and formulas.
  - Use theme tokens and shared UI components.
  - Write JSON‑driven tests where possible.
  - Keep docs in sync with reality (implemented vs. planned).

- **Dont**
  - Hardcode balancing values in components.
  - Introduce new visual styles outside the Gilded Observatory system.
  - Show raw formulas in the main UI instead of tooltips.
  - Add new features without updating docs and tests.

---

*This document is intentionally concise and operational. For deeper rationale, see `PROJECT_PHILOSOPHY.md` and `MASTER_PLAN.md`.*
