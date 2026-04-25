# Archmage Documentation Hub

This folder is the new single source of truth for the **Archmage: Transcend the Transcendence** direction. All forward-looking decisions, lore, gameplay pillars, and production notes live here (English first, translation-ready). Legacy PunchClub-style prototypes remain referenced but are no longer the canonical vision.

## Objectives

- Capture the renewed creative direction (spell-creatures, mental palace, incremental + tactical play).
- Centralize technical guardrails so existing code can be reused safely.
- Establish a documentation lifecycle that prevents drift (inventory → archive → replacement).
- Prepare every document for future localization without duplicating effort now.

## Document Map

| File | Purpose |
| --- | --- |
| `Vision.md` | Narrative pitch, player fantasy, tonal targets. |
| `GameplayPillars.md` | Systems overview: spell lifecycle, idle loops, expeditions/combat, progression arcs. |
| `ArtDirection_Wanderlust.md` | Visual direction using Style Laboratory, relation to Gilded Observatory legacy assets. |
| `TechnicalDirection.md` | Engineering guardrails (React/TS, persistence, config-first, testing). |
| `LocalizationPlan.md` | How we will structure translations once English drafts stabilize. |
| `DocumentationAudit.md` | Snapshot of existing docs with keep/revise/archive status. |

Future specs (economy, UI flows, quest arcs, etc.) should branch from this hub instead of scattering across ad-hoc folders.

## Workflow & Maintenance

1. **Author in EN** using consistent naming (`Archmage_<Topic>.md`).
2. **Reference config-first rules** and Style Laboratory docs instead of duplicating values.
3. **Translate later**: when a document is stable, mirror it under `docs/i18n/<lang>/` with the same filename and note the translation status table.
4. **Monthly review**: verify each file against the project roadmap; outdated sections move to `docs/archive/<quarter>/` with a link back here.

## Next Steps

- Finish the initial audit (see `DocumentationAudit.md`).
- Decide which legacy plans migrate into the new structure vs. archives.
- Extend this hub with feature-specific specs (e.g., spell containment loop, palace management UI) once the pillars are locked.
