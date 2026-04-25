# Documentation Audit

This living inventory tracks every relevant document across `docs/`, `src/docs/`, and `public/docs/`. Use it to decide what gets migrated into the Archmage hub, updated, or archived.

## Process

1. Record each file with path, scope, last known relevance, and planned action.
2. When a file is superseded, move it to `docs/archive/<quarter>/` and update this table with the archive path.
3. Link the replacement doc (if any) so future readers can trace lineage.

> **Status legend**: `Keep` = still authoritative; `Revise` = needs update to fit Archmage vision; `Archive` = move to archive directory once replacement is ready.

| Path | Topic | Status | Notes / Replacement |
| --- | --- | --- | --- |
| `docs/archmage/README.md` | New documentation hub | Keep | Source of truth for structure/workflow. |
| `docs/archmage/Vision.md` | Narrative & pillars | Keep | Derived from Archmage discussion log. |
| `docs/archmage/GameplayPillars.md` | Systems overview | Keep | Covers spell lifecycle, palace loops. |
| `docs/archmage/ArtDirection_Wanderlust.md` | Visual direction wrapper | Keep | Points to `src/docs/docs/plans/art_direction_plan.md`. |
| `docs/archmage/TechnicalDirection.md` | Engineering guardrails | Keep | Aligns codebase with new vision. |
| `docs/archmage/LocalizationPlan.md` | Translation workflow | Keep | Await glossary + queue files. |
| `docs/strategy/idle_village_punch_club_vision.md` | Old Idle Village vision | Revise | Extract reusable balancing notes, then archive once Archmage specs replace it. |
| `docs/GAME_VISION_IDLE_INCREMENTAL.md` | Idle Incremental game pitch | Archive | Superseded by `archmage/Vision.md`; move to archive after referencing key data. |
| `docs/MASTER_PLAN.md` | Legacy master plan | Revise | Needs section pointing to Archmage milestones. |
| `src/docs/docs/strategy/Archmage: trascend the trascendence.md` | Raw chat log | Keep | Serve as appendix/reference; summarized in `docs/archmage/*.md`. |
| `docs/plans/config_driven_balancer_plan.md` | Phase 10 plan | Keep | Still relevant (code to preserve). |
| `docs/plans/stat_stress_testing_plan.md` | Phase 10.5 plan | Keep | Drives balancing analytics reused by Archmage. |
| `docs/STORAGE_TESTING_GUIDE.md` | Persistence testing | Keep | Already aligned with PersistenceService rules. |
| `docs/WHATS_MISSING.md` | Legacy gap analysis | Archive | Archived to docs/archive/2026-Q1/WHATS_MISSING.md |
| `docs/IMPLEMENTATION_PLANS_INDEX.md` | Plan list | Revise | Add Archmage entries, flag idle-centric plans for archive. |
| `docs/ARCHITECTURE.md` | High-level architecture overview | Revise | Update sections to reference Archmage modules and doc hub. |
| `docs/ARCHITECTURE_REFERENCE.md` | Detailed architecture reference | Revise | Keep diagrams but relabel features for new pillars. |
| `docs/BALANCING_DEEP_DIVE.md` | Balancing analysis | Keep | Still useful for weight-based creator rules; add Archmage notes when ready. |
| `docs/BALANCING_SYSTEM.md` | System summary | Revise | Needs Mental Palace + spell lifecycle examples. |
| `docs/CODE_AUDIT_REPORT.md` | Historical audit | Archive | Archived to docs/archive/2026-Q1/CODE_AUDIT_REPORT.md |
| `docs/COMBAT_SYSTEM_DESIGN.md` | Combat spec (PunchClub) | Revise | Extract duel mechanics applicable to Archmage; archive rest. |
| `docs/COMPONENTS.md` | UI component catalog | Revise | Tag reusable components vs legacy-only; add Archmage section. |
| `docs/DEVELOPMENT_GUIDELINES.md` | Dev process | Keep | Still authoritative (config-first, persistence) but add Archmage references. |
| `docs/IMPLEMENTED_PLAN.md` | Completed plan log | Archive | Archived to docs/archive/2026-Q1/IMPLEMENTED_PLAN.md |
| `docs/PROJECT_PHILOSOPHY.md` | Philosophy | Revise | Ensure new pillars (spell-creatures, palace) included. |
| `docs/SPELL_CREATION_SPEC.md` | Spell creation | Revise | Align with Archmage lifecycle spec; likely merged into Gameplay docs. |
| `docs/SPELL_CREATOR.md` | Tool spec | Archive | Archived to docs/archive/2026-Q1/SPELL_CREATOR.md |
| `docs/SPELL_TYPE_GUIDELINES.md` | Spell taxonomy | Revise | Convert to Archmage glossary content. |
| `docs/STAT_BALANCING_ANALYSIS.md` | Stat analysis | Keep | Input for Phase 10.5; cross-link to Archmage balancing decisions. |
| `docs/analytics/performance_dashboard_guide.md` | Analytics tooling guide | Keep | Still valid; add Archmage telemetry examples later. |
| `docs/strategy/go_to_market_steam_first.md` | Go-to-market plan | Archive | Archived to docs/archive/2026-Q1/go_to_market_steam_first.md |
| `docs/strategy/idle_village_punch_club_vision.md` | Hybrid vision | Revise | Keep balancing rules (e.g., marginal utility) until Archmage replacements exist. |
| `docs/strategy/idle_village_vision.md` | Idle-specific vision | Archive | Archived to docs/archive/2026-Q1/idle_village_vision.md |
| `docs/strategy/punch_club_playtest.md` | Playtest guide | Keep | Still needed for Punch Club playtest pipeline; note coexistence with Archmage docs. |
| `docs/prompts/prompt_library.md` | Prompt templates | Keep | Still source of reusable agent prompts; ensure Archmage rules are referenced. |
| `docs/prompts/sprite_templates.md` | Sprite prompt templates | Revise | Update examples to Wanderlust terminology once art assets migrate. |
| `docs/coordinator/agent_assignments.md` | Task tracker | Keep | Active Kanban; reference new Archmage workstreams. |
| `docs/coordinator/agent_coordination.md` | Coordination guidelines | Keep | Still dictates task workflow, cross-link to Archmage doc process. |
| `docs/coordinator/agent_execution_guidelines.md` | Execution guardrails | Keep | Mandatory for all agents; ensure Archmage doc requirements included. |
| `docs/coordinator/strategy_tasks.md` | Strategy task list | Revise | Update backlog items to Archmage priorities; archive idle-only entries. |
| `docs/coordinator/time_tracking_guide.md` | Time tracking manual | Keep | Already covers new system; add Archmage-specific categories if needed. |
| `docs/reports/safe-audit-2025-12-24.md` | Safety audit | Keep | Historical audit; keep accessible, add note if replaced by Archmage-specific audit later. |
| `docs/specs/idle_village_action_cards.md` | Action cards spec | Archive | Archived to docs/archive/2026-Q1/idle_village_action_cards.md |
| `docs/specs/idle_village_drag_simulation.md` | Drag simulation spec | Archive | Archived to docs/archive/2026-Q1/idle_village_drag_simulation.md |
| `docs/specs/village_sandbox_perf.md` | Performance spec | Keep | Performance patterns may inform Archmage telemetry; add Archmage notes. |
| `docs/tests/PLAYWRIGHT_GUIDE.md` | Playwright testing guide | Keep | Still authoritative; ensure Archmage test patterns included. |
| `docs/tests/README.md` | Test documentation overview | Keep | General testing guidelines; update with Archmage-specific tests. |
| `docs/moodboards/` | Moodboard assets | Keep | Referenced in ArtDirection_Wanderlust.md; update with Wanderlust examples. |
| `docs/outputs/2026-01-08_archmage_notes.md` | Archmage notes output | Keep | Summarized in Archmage docs; keep as appendix. |
