---
trigger: glob
globs: src/balancing/config/**,src/**/config/**,src/**/*Store.ts,src/**/persistence/**
description: Config-first + persistence invariants for config modules and stores.
---

# Config & Persistence Invariants

Applies to config modules and persistence/store code.

## Config-first
- Config modules are the single source of truth for stats, tokens, timings, and copy keys.
- Validate config shapes with Zod schemas; export typed accessors, not raw objects.
- No hardcoded gameplay/UI constants leaking into components — expose them here.

## Persistence
- Persist only through `@/shared/persistence/PersistenceService`
  (`saveData` / `loadData` / `clearData`), which handles Tauri FS + web fallback.
- FORBIDDEN: direct `localStorage`/`sessionStorage`, sync persistence, bespoke storage layers.
- Autosave loops ≥ 30s; recurring timers ≥ 500ms.

## Documentation
- JSDoc on every exported function/interface/schema.
