# Archmage Vision

## Premise

**Archmage: Transcend the Transcendence** is a narrative/strategy experience where spellcasting is a relationship management exercise. Every spell is a semi-sentient fragment of a multidimensional being; learning a spell means imprisoning that fragment inside the magus’ subconscious (the “Mental Palace”). Casting releases it back into the void, forcing the player to reacquire and re‑tame it. The tension between compassion, control, and raw ambition defines both story and systems.

## Player Fantasy

- Start as an overworked apprentice juggling chores, debt, and cryptic lessons.
- Discover the first imprisoned spell-creature and learn to care for, document, and finally cast it.
- Grow into an archmage able to negotiate with demons, manage entire ecosystems of spells, and reshape reality itself.
- Eventually transcend even transcendence: restart runs with new metaphysical paths unlocked, carrying forward knowledge, allies, or scars.
- Experience combat as **mana-enhanced martial arts**—channel cultivated mana through the body to deliver impossibly precise strikes, while mentors demonstrate full spellcraft (fireball, summons) to establish the aspirational gap.

## Pillars

1. **Living Spell Companions** – Every spell is a creature with needs, moods, and evolution trees; gameplay is about empathy, training, and strategy, not just cooldowns.
2. **Mental Palace Simulation** – The player curates habitats, containment cells, libraries, and labs inside a limitless mental space to harvest mana and nurture spells.
3. **Dual Loop: Incremental + Tactical** – Daily chores, cultivation, and research run semi-automatically, while expeditions and mage duels demand deliberate planning with limited spell availability.
4. **Risky Reciprocity** – Demons and veronomes can betray or empower the player; choices ripple across story arcs and mechanics (injury/death risk, permanent boons, hauntings).
5. **Transcendent Progression** – Each path to “godhood” (alchemy, necromancy, angelic ascent, etc.) reconfigures the rules and encourages replays with new constraints and unlocked knowledge.

## Compatibility Mandates

- **Code**: retain React/TS + config-first balancing systems; reuse PunchClub prototype scaffolding where it accelerates development.
- **Style**: Gilded Observatory components remain the default shell until Wanderlust explorations from the Style Laboratory graduate into production-ready kits.
- **Data**: persistence continues through `PersistenceService.ts` and async flows; weight-based creator patterns stay central to balancing.

## Success Criteria

- Documentation, UI, and systems reference this vision as the single source of truth.
- New features trace back to at least one pillar and avoid ad-hoc exceptions.
- Translation-ready structure enables easy localization once English specs stabilize.

## Demo Hook & Storytelling Requirements

1. **Opening Hook**: Begin with a cinematic/apprentice vignette where the mentor performs an impossible feat (simultaneous summoning + palace projection) while the player is limited to mana-enhanced strikes. Sets tone for “become the most powerful archmage.”
2. **Combat Preview**: Even before full duels unlock, the demo must showcase:
   - Mana cultivation minigame → immediate payoff in a martial exchange.
   - Visualization of mood/ritual interactions feeding deterministic combat buffs.
3. **Narrative Stakes**: Early questline revolves around crafting the first sigil-scroll; wanderlust adventures reveal glimpses of other planes to sustain the “wonder” mood.
