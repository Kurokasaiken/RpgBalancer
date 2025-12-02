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
  - Defines the weight‑based creator pattern and the Gilded Observatory design system.
  - Use it as the conceptual reference for all new features.

When in doubt:
- Check **IMPLEMENTED_PLAN.md** to see what exists.
- Check **MASTER_PLAN.md** to see what is planned.
- Align with **PROJECT_PHILOSOPHY.md** before writing new code.

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

## 3. UI/UX and Gilded Observatory Theme

- The **Gilded Observatory** theme is the canonical UI style.
- All visual work must:
  - Use **theme tokens** (Tailwind config, `fantasy-theme.css`, `color-palette.css`).
  - Avoid raw hex values inside components.
  - Preserve **compact but readable** layouts, especially for Balancer and Spell Creator.

**Do not** mix old glassmorphic specs with the new theme:
- If a design choice conflicts, the **Gilded Observatory** spec wins.

When adding or modifying UI:
- [ ] Use existing compact components when possible (`CompactCard`, `CompactButton`, `CompactInput`, etc.).
- [ ] Keep formulas in **tooltips and docs**, not inline in the main layout.
- [ ] Ensure the page remains usable on mobile (tap targets, spacing, text size).

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
