# Gameplay Pillars

## Spell Lifecycle

1. **Acquisition** – Expeditions, rituals, or mental anomalies expose a spell fragment. Capturing it requires narrative choices (mercy vs dominance) that affect loyalty scores.
2. **Containment** – Within the Mental Palace, the spell is housed in a bespoke habitat with upkeep costs, mood modifiers, and hazard levels.
3. **Training & Research** – Idle/automation systems (chores, mana cultivation, study sessions) level up the spell’s abilities and unlock evolutions documented in field notes.
4. **Deployment** – During duels or expeditions the spell emerges from the subconscious at semi-random intervals; the player must decide if/when to cast it, balancing limited mana types and risk.
5. **Recovery** – After casting, the spell returns unstable. The player must re-tune the bond (mini-games, dialogue, offerings) or risk losing it permanently.

## Mental Palace Management

- **Districts as Modules**: Laboratories, arboretums, containment wings, libraries, and reliquaries each grant systemic bonuses (mana efficiency, faster recovery, scouting insights).
- **Upgrade Tree**: Investments unlock automation knobs (auto-care routines, predictive casting alerts) and narrative branches (e.g., demon negotiation wing vs angelic sanctum).
- **Resource Triangle**: Time, mana, and favor (reputation among spell factions) must stay balanced. Ignoring any axis triggers incidents (breakouts, mana droughts, mutinies).

### Light-Touch Creature Stewardship

- Creature care is intentionally **ritualistic, not managerial**. Mood cues and attunement rites are presented as aesthetic interactions that feed deterministic combat modifiers (e.g., “Serene” grants +focus on next duel).
- No “feeding timers” or chore loops: every action the player takes has a calculable payoff in the duel/expedition layer.
- Automation slots inside palace districts handle routine upkeep so strategic players can focus on buildcrafting and transcendence routing.

## Incremental Loop

- Morning chores and town work feed base mana income and narrative beats (apprentice life).
- Midday management cycles handle training queues, crafting reagents, writing grimoires, and negotiating with mentors.
- Night rituals accelerate long-term projects (palace construction, research trees) while exposing the player to dream hazards or veronome summons.

## Tactical Loop

- **Expeditions**: Small tactical encounters with limited map nodes. Focus on scouting, capturing rogue spells, or gathering exotic reagents.
- **Duels**: Structured confrontations with other magi where spell availability is deck-like: a rotating hand from the subconscious with timers per spell.
- **Consequences**: Injuries, corruption, and fatigue persist back into the incremental loop, altering schedules and palace stability.

## Progression & Replayability

- Unlockable “Transcendence Paths” (Alchemy, Necromancy, Angelic, Demonology, Abstract Mind) each provide unique meta bonuses plus restrictions (e.g., demon route increases betrayal risk but opens forbidden spells).
- NG+ keeps archives, research, and certain loyal spells, but reshuffles world states and antagonist agendas.
- PunchClub-era prototypes remain as optional “flashback” chapters/tutorials; core progression now orbits the Mental Palace fantasy.

## Wonder & Wanderlust Tone Guardrails

- **Mood of Discovery**: Post-apprenticeship chapters emphasise awe—new palace wings unfurl as astral diagrams, expeditions are framed as “thought expeditions” into alien manifolds.
- **Laboratory of Transcendence**: Interfaces mimic abstruse instruments (tesseract scopes, alchemical lattices) yet expose clear stats/weights; tooltips show the math so strategy players stay grounded.
- **Extraplanar Entities, Limited Presence**: Contracts with otherworldly beings are peak-moment events (boss contracts, rare relic crafting), never a permanent babysitting chore.

## Compatibility Checklist

- Every new mechanic must:
  - Respect config-first stat/weight tables and PersistenceService storage.
  - Surface data via existing analytics hooks (stress testing, synergy heatmap, etc.).
  - Reference Style Laboratory tokens or Wanderlust mood boards for presentation.
