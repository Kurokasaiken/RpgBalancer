# Idle Village Task Mandate

**Status:** Placeholder - Content needs to be exported from Windsurf/Devin Desktop

## Purpose
The Idle Village Task mandate defines specific requirements for work on the Idle Village vertical slice, including skin system usage, i18n requirements, and frozen kit integration.

## Responsibilities (from systems_governance_alignment_plan.md)

According to GOV-004, the Idle Village Task mandate should include:

- **Frozen kit usage**: Use frozen kits from `@/ui/idleVillage/frozen/kits`
- **Kit creation**: Create new kits via `npm run freeze:kit <KitName>`
- **Hub metadata**: Add `hub` metadata for TestHub generation
- **Skin system**: Use default skin system (`useSkinPreferences` / `DEFAULT_SKIN_PRESET_ID`)
- **i18n**: All user-facing strings through `react-i18next` (namespaces: `common`, `idleVillage`)
- **Persistence**: Use `@/shared/persistence/PersistenceService` only
- **Config-first**: Read values from config modules, no hardcoded gameplay/UI values

## Required Content (to be filled from Windsurf export)

1. **Idle Village specific invariants**
   - Skin system requirements
   - POI system requirements
   - Slot rack requirements
   - Resident system requirements

2. **Component reuse rules**
   - When to use existing primitives
   - Primitive directory locations
   - Extension vs duplication

3. **Telemetry requirements**
   - Event emission
   - Event naming conventions
   - Payload requirements

4. **Testing requirements**
   - RTL testing
   - Contract testing
   - Visual testing

## Action Required

Export the actual content from `.windsurf/skills/idle-village-task/SKILL.md` via Windsurf/Devin Desktop and replace this placeholder.
