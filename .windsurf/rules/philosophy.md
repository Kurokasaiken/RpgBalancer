---
trigger: manual
description: RPG Balancer project philosophy — the "why" behind the invariants. Referenced by AGENTS.md and the role skills.
---

# RPG Balancer Philosophy

The enforceable rules live in `00-project-invariants.md` (always on) and the
glob-scoped rule files. This document explains the reasoning so decisions stay
coherent when a situation is not explicitly covered.

## Config-first
Behaviour is data. Stats, tokens, timings, and copy are declared in config modules
(validated with Zod) and consumed read-only by UI/logic. This keeps the game tunable
without code changes and makes generation/testing deterministic.

## Single source of truth
Every concern has exactly one canonical home: persistence → `PersistenceService`,
skins → `skinConfigRegistry`, localization → `@/localization/i18n`, cross-cutting
invariants → `.windsurf/rules/`. Duplication is treated as a bug.

## The rules layer is the shared baseline
`.windsurf/rules/` is what *everyone* (Strategist, Coordinator, Agents) must always
follow. Any new "a-priori" / cross-cutting system (skin system, i18n, telemetry
contract, persistence pattern) MUST be registered here so it becomes part of the
baseline automatically — never left implicit in a single prompt.

## Small, modular, maintainable
Prefer small components/hooks over large files. Split bloated state/logic. Tests-first
for refactors; guardrails before big changes.

## Game feel
UI targets < 16ms/frame, animates with transform/opacity, uses layered feedback
(visual + audio + tactile). See `docs/plans/ui_game_dev_system_prompt.md`.

## Evidence and safety
Nothing is "done" until safeguards pass (lint, test, build:check, kanban:lint) with an
evidence log in `test-results/`. If a request conflicts with an invariant, flag it —
do not silently deviate.
