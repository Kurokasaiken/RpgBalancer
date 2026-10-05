---
trigger: always_on
description: Non-negotiable RPG Balancer invariants that apply to every task, regardless of how the request is phrased.
---

# Project Invariants (ALWAYS ON)

These constraints are **non-negotiable** and apply to any change, on any surface,
no matter how the request is worded. If a request seems to conflict with them,
follow the invariant and flag the conflict instead of silently breaking it.

## Persistence
- All save/load MUST go through the async service `@/shared/persistence/PersistenceService`
  (`saveData` / `loadData` / `clearData`).
- FORBIDDEN: direct `localStorage` / `sessionStorage`, synchronous persistence, or
  ad-hoc storage middleware.

## Config-first
- No hardcoded gameplay/UI values in components. Read stats, tokens, timings, and
  copy keys from config modules (e.g. `src/balancing/config/**`, skin/style configs).
- New config modules use Zod schemas for validation.

## Skin/Theme system
- Ad-hoc CSS for page/component is a LEGACY pattern, deprecated.
- Any new skin/visual theme MUST be implemented as a preset in `skinConfigRegistry`,
  never as a standalone `.css` file.
- If a prompt requests creating a `.css` file for a skin/theme, it is by definition
  in violation of this invariant — do not execute, flag the violation.

## Localization
- No hardcoded user-facing strings. Every user-facing string goes through i18n
  (`react-i18next` `useTranslation`, config in `@/localization/i18n`).
- Namespaces: `common`, `idleVillage`. New keys added to locale resources, not inline.
- Missing keys are telemetered via `translation_missing`; do not suppress them.

## Component Reuse
- Before writing a new UI component, verify if an equivalent primitive exists in
  `src/ui/atoms/`, `src/ui/fantasy/atoms/`, or `src/ui/idleVillage/skins/primitives/`.
- If a primitive covers the use case, reuse or extend it via props.
- NEVER duplicate primitive markup/styling from scratch.
- Creating a new standalone component that duplicates an existing primitive is a
  VIOLATION of this invariant — do not execute, flag the violation.
- If no existing primitive covers the use case, creating a new one is acceptable,
  but it must be added to the correct primitive directory (not left as an isolated
  component in a page).

## State Management
- Zustand store: for domain/game state shared between multiple pages or components
  not necessarily close in the tree (e.g., resources, roster, active quests) — survives
  navigation.
- React Context: for local presentation/UI state scoped to a specific subtree
  (e.g., density mode of a panel, modal open state, theme scoped to a view).
- Decision criterion: if the state is needed outside the subtree of components that
  consume it, use Zustand. If it describes only how a local portion of UI behaves/appears,
  use Context.
- Creating a new Context for data that should be in a shared store (or vice versa) is a
  VIOLATION of this invariant — do not execute, flag the violation.

## Documentation
- Every new function/interface gets JSDoc.
- Update the relevant plan/changelog before marking a task complete.
- Plans are living documents: the Strategist and every Agent must reference the master plan and the relevant implementation plans, cite useful information from them, and update them when the implementation diverges or advances.

## Node / tooling
- Use the pinned Node version from `.nvmrc` (`source ~/.nvm/nvm.sh && nvm use`).
- Never mutate the global Node version.

## Mandatory safeguards before "done"
Run and pass (fix on failure):
```bash
npm run lint -- <scope>
npm run test -- <scope>
npm run build:check
npm run kanban:lint
```
If any safeguard fails, the task is **BLOCKED**, not complete.

## Command timeouts

Every command must have a maximum runtime. If the timeout is exceeded, stop the command, log the event, and switch to a narrower scope or an alternative approach. Default maxima:

- `kanban:lint`: 30s
- `npm run lint -- <scope>`: 120s
- `npm run build:check` / `npm run build`: 180s
- `npm run test -- <scope>`: 300s
- `harness:run` per task: 600s
- `harness:dispatch` total: 1800s

A command that hangs is treated as a failure, not as "still running".

## Separation of concerns

- Personal project only: never import work-project logic, rules, or memories here.
- Do not modify legacy/dev-only tools as part of gameplay work unless explicitly scoped.

## This layer is the shared baseline

- `.windsurf/rules/` is the single source of truth for what everyone (Strategist,
  Coordinator, Agents) must always follow.
- When a new "a-priori" / cross-cutting system becomes mandatory (skin system, i18n,
  telemetry contract, persistence pattern, theming, frozen kits, documentation governance),
  it MUST be registered here — not left implicit in a single prompt. Strategist and
  Coordinator share this duty.
