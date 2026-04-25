# Focus Shift — January 2026

**Context:** Archmage IP now bifurcates into two standalone games built on the same canon, rules, and tech core.

| Track | Working Title | Elevator Pitch | Target Player | Monetization |
| --- | --- | --- | --- | --- |
| **Core / Idle** | *Archmage: Resonant Sanctum* (TBD) | Boardgame-like worker placement where the magus deploys adepts and lone heroes to harvest mana, defend the sanctum, and run risky solo quests. | Idle/management fans who enjoy deterministic math and low narrative overhead. | Premium (€9.99–12.99) + QoL DLCs. |
| **Story-Driven** | *Archmage: Transcend the Transcendence* | Narrative tactical RPG with mana-enhanced martial arts combat, mentor-led set pieces, and cinematic expeditions. | Strategy + narrative audience (Slay the Spire, Punch Club fans). | Premium (€12.99) + DLC arcs. |

## Why the Split

1. **Faster publication cadence** – Launch the Core game first to establish the brand, gather telemetry, and fund the story-driven production.
2. **Genre clarity** – Each title markets itself honestly (idle vs RPG) while sharing lore and systems.
3. **Tech efficiency** – Shared modules (spell lifecycle, combat simulator, quest/check, economy, PersistenceService) avoid duplicated effort.
4. **Audience cross-pollination** – Players can discover the IP via either entry point; cross-promotions stay in-universe.

## Shared Pillars

- **World Bible**: Wanderlust tone, Mental Palace physics, spell-creature canon (see `Vision.md` and `GameplayPillars.md`).
- **Systems**: Weight-based balancing, Monte Carlo combat validation, quest/theater view, async persistence.
- **Economy**: Single resource taxonomy (mana, reagents, favor, population) surfaced via config so both games remain interoperable.
- **Assets/UI**: Gilded Observatory shells with Wanderlust skins; shared UI kit evolves in tandem.

## Key Differentiators

| Dimension | Core / Idle | Story-Driven |
| --- | --- | --- |
| **Heroes** | Solo operatives auto-resolving quests; optional manual combat with auto-resolve default. | Fully playable tactical combat (mana martial arts + spell deployment) with cutscenes. |
| **Workers** | Meeple-style adepts for labor, defense, rituals. | NPCs with dialogue arcs; their jobs unlock quests and story beats. |
| **Quest Presentation** | Minimalist TheaterView, numeric outcomes. | Narrative sequences, voiced mentor moments, branching resolutions. |
| **Progression** | Boardgame pacing, shorter sessions, prestige cycles for replayability. | Campaign chapters, transcendence meta-paths, cinematic boss fights. |

## Immediate Actions

1. **Document & freeze core modules** – finalize APIs for spell system, combat, quest slots, worker placement.
2. **Roadmap alignment** – maintain a single schedule that sequences Core launch → Story pre-production → Story launch (see `Roadmap.md`).
3. **Marketing prep** – devise messaging kit explaining “two games, one universe.”
4. **Data continuity** – design save schemas to optionally import Core progress into Story (bonus feature, not required at launch).

## Next Priority After Current Prompt

> **Milestone:** *Punch Club Gameplay Loop Closure*  
> **Trigger:** Immediately after the ongoing mega-prompt completes.

1. Lock scope for the playable Punch Club loop (duels, telemetry, tutorial flow).
2. Update Kanban (`agent_assignments`) with a dedicated row (status “In corso” at kickoff).
3. Run safeguard checklist (build, lint, tests) to ensure the legacy loop is shippable as a reference slice.
4. Treat this milestone as the gate before any new Archmage feature work.

*Owner:* Cascade (documentation), Fausto (creative direction).

*Last updated:* 2026-01-08
