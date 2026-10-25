QUILL-EMBER-9

Ruthless art-direction review — Wanderlust scene-prompt structure v3

Core diagnosis: v3 specifies what the image contains and how it should be painted, but does not sufficiently specify what the image must mean visually. It has a world rationale, a closed inventory of three elements, a composition vocabulary, and a style register. Those are useful inputs to an image generator, but they do not form a reliable system for translating narrative intent into visual decisions.

The biggest risk is a scene that looks unmistakably like Wanderlust at first glance but belongs to the wrong mood key when you examine its relationships, spatial logic, and emotional impact.

A basalt fortress, an azure sky, a mythic beast, and thick impasto can produce a convincing fantasy painting. They do not, by themselves, communicate Imperial inevitability, wilderness potential, multiversal contamination, or survival in a hostile world.

The fix is not to add more adjectives. It is to give the generator a causal visual brief: what has happened, what relationship defines this scene, and what visible evidence makes that interpretation unavoidable?

A. What is structurally wrong or missing?
1. WORLD describes lore, not observable evidence

“Heart,” “intrusion,” “weight,” and “scar” are excellent art-direction concepts. They are not yet executable visual instructions.

Consider Prismatic. A prompt can say that an alien wreckage has intruded into a mountain valley and still generate a beautiful, harmonious landscape with decorative rainbow glass. Every object is present; the mood is wrong.

The missing field is visual proof of the world's defining condition.

Mood key

	

Abstract intention

	

Required visible evidence




Wilderness — Rude Beauty

	

Unexpressed potential

	

A creature or route oriented toward an expansive, attainable-but-untested frontier; the landscape invites movement beyond the current frame.




Empire — Impero Solare

	

Solar Triumph, heavy nobility

	

Architecture imposes a vertical order; figures submit to, command, or are dwarfed by that order. Light makes the hierarchy monumental.




Prismatic

	

Alien intrusion

	

Foreign material violates the native landscape's construction, continuity, scale, or geometry. The junction itself looks wrong.




Dark Wasteland

	

Survival under hostile conditions

	

The subject occupies a compromised shelter, exposed route, or precarious refuge; ember-light reveals a limited pocket of resistance against vast hostile darkness.

These are not merely four color grades. They are four different relationships between an inhabitant and a world.

Field fix: replace the single WORLD rationale with three fields:

WORLD_CONDITION: what is fundamentally true about this place?

SCENE_CONFLICT: what is resisting, violating, threatening, or challenging that condition?

VISIBLE_PROOF: which two or three specific things in the image must make the interpretation legible?

Require evidence that can be seen in the final still. “The empire is powerful” is not evidence. “A tiny procession climbs a monumental black stair beneath an overhanging throne complex” is.

2. The structure has no explicit semantic acceptance criterion

There is a kill list for familiar generator mistakes, but no equivalent test for a beautiful image that communicates the wrong thing.

That asymmetry is serious. A generator may successfully avoid meteors, signatures, and rounded corners while producing a generic dark-fantasy landscape.

Introduce a MOOD_PROOF field:

If the key name and palette description were removed, which visible spatial or material relationship would still identify the intended mood?

If the answer is “the orange light and indigo sky,” the scene has failed semantically.

This is not a guarantee that the model will comply. It is a criterion for writing, selecting, and rejecting generated images.

3. The subject specification confuses inventory with narrative

The creature–place–relic triad ensures scene completeness. It does not ensure scene coherence.

Three independently evocative objects can still look like a random fantasy illustration. Worse, a closed triad may force the model to invent an arbitrary relic, position the creature beside it, and place both in a decorative environment.

The prompt needs a single dominant visual relationship connecting the elements. The relic might be the thing the creature guards, the thing that wounded it, the thing that destabilizes the location, or the thing it is attempting to reach.

Without that relationship, the triad is a shopping list.

4. COMPOSITION is currently a vocabulary, not a decision system

MONOLITH, CASCADE, VISTA, TABLEAUX, GRID, ARCH, ISLAND, and VOID are labels for possible layouts. They do not determine what a composition should accomplish.

Even if the model interprets every label correctly, the same VISTA could express freedom, imperial domination, alien displacement, or desperate exposure.

The composition brief needs to specify:

Power relationship: what dominates what?

Directional force: where does the eye travel, and why?

Spatial relationship: what is near, distant, obstructed, exposed, or inaccessible?

Focal hierarchy: what reads first, second, and third?

Emotional consequence: what should the arrangement make the viewer feel?

The archetype should follow these decisions, not replace them.

B. Does WORLD justify the triad, or does each element need its own semantic justification?

Each element needs a role, but not three separate lore paragraphs.

This distinction matters. Adding a WHY_CREATURE, WHY_PLACE, and WHY_RELIC field that each asks for backstory would create redundant prose and encourage the generator to illustrate three disconnected explanations.

Instead, assign each element a distinct visual function within one scene-level causal relationship.

CREATURE — the agent or witness

What does it want, endure, protect, fear, or embody? What visible pose, orientation, or interaction communicates that role?

Failure mode: a generic beast included to satisfy the inventory.

PLACE — the force acting on the scene

Does the environment offer freedom, impose authority, suffer intrusion, or threaten survival? Which spatial feature makes that force visible?

Failure mode: a backdrop that could be exchanged between any of the four keys.

RELIC — the material consequence

Why does this object matter here? Does it belong to the place, embody its power, or visibly violate its material logic?

Failure mode: a glowing collectible inserted for visual interest.

The actual requirement is a relationship graph, not more lore:

Creature ↔ place: what does the environment make the creature do?

Creature ↔ relic: what is the creature's consequential relationship to the object?

Relic ↔ place: how does the object belong to, transform, or violate the environment?

Not every relationship must involve physical contact. A creature staring at an unreachable relic can be stronger than one holding it. What matters is that the relationship is legible.

Concrete example: Prismatic

Weak brief:

WORLD: Alien multiversal wreckage has crashed into an alpine valley.

CREATURE: Intrusion-touched beast.

PLACE: Alpine valley.

RELIC: Iridescent artifact.

This can easily produce a conventional fantasy illustration with rainbow effects.

Stronger brief:

WORLD_CONDITION: Native alpine terrain has been physically invaded by a foreign construction.

CREATURE_ROLE: A native mountain beast recoils from the point where the foreign structure has displaced its familiar ground.

PLACE_ROLE: A familiar river is severed or diverted by an impossibly straight, glass-bronze structure.

RELIC_ROLE: A membrane lens is fused into the rupture, its iridescence restricted to the membrane.

RELATIONSHIP: The foreign structure interrupts the river's natural course; the beast faces the breach rather than presenting itself to the viewer.

Now the palette reinforces a visual argument instead of substituting for one.

Field-level decision: retain the closed triad if it is a useful production constraint, but make every element carry a ROLE, a VISIBLE_CUE, and a RELATIONSHIP. Keep each field to one concise statement. The generator needs operational specificity, not character biographies.

C. The four mood keys need different composition grammars

Yes. They should have preferred archetypes and shot grammars, but not rigidly assigned layouts.

If each key always receives one archetype, the system will become predictable: every Wilderness image becomes a VISTA, every Empire image a MONOLITH, and so forth. That would replace semantic drift with compositional repetition.

The better approach is to define a composition bias, an admissible alternative, and a forbidden semantic outcome for each key.

Wilderness — Rude Beauty
10

Spatial thesis: the world is larger than the subject, and its possibilities extend beyond the current encounter.

Preferred archetypes: VISTA, ISLAND, ARCH.

Shot grammar: broad environmental read; a readable foreground-to-distance route; the creature anchored in the near or middle plane; an open destination or unexplored threshold.

Eye movement: subject → route → distant possibility.

Scale: subject small enough to reveal the world, large enough to remain emotionally legible.

Negative-space logic: open space signifies opportunity, not emptiness.

Reject: a scenic postcard where the creature has no meaningful relationship to the terrain; a composition dominated by enclosing walls or threatening verticals.

The critical difference is not “bright mountains.” It is the invitation to move into the world.

Empire — Impero Solare
7

Spatial thesis: the world has an imposed order, and that order is difficult to escape.

Preferred archetypes: MONOLITH, ARCH, TABLEAUX.

Shot grammar: strong verticals, compressed approach paths, stacked architectural tiers, deep overhangs, figures subordinated to monumental masses.

Eye movement: subject or procession → ascending architecture → overwhelming summit.

Scale: architecture exceeds comfortable human scale; the creature or figure becomes a measure of imperial power.

Negative-space logic: voids are controlled courtyards, abyssal drops, or carefully framed exclusions.

Reject: a generic desert vista with a palace sitting decoratively in the distance; heroic low-angle framing that makes every subject look equally sovereign.

The critical difference is hierarchy made spatial.

Solar Triumph must not become merely warm lighting. Blinding highlights should expose the monument's planes, edges, and mass while saturated shadows preserve the material richness.

Prismatic — alien intrusion

Spatial thesis: two incompatible worlds occupy the same space, and their collision is the subject.

Preferred archetypes: GRID, ISLAND, VOID.

Shot grammar: an interrupted natural horizon, a sharp collision boundary, mismatched scales, misaligned axes, impossible continuity, or a foreign mass occluding familiar terrain.

Eye movement: native form → rupture → alien structure or membrane.

Scale: the intrusion is large enough to alter the environment, but its scale should remain uncanny rather than automatically monumental.

Negative-space logic: absence or discontinuity signals missing, displaced, or violated reality.

Reject: harmonious fantasy ruins; rainbow rays used as shorthand for alienness; iridescence distributed indiscriminately across rocks, clouds, and water.

The critical difference is spatial incompatibility.

The alien material should feel as though it does not obey the same visual grammar as the landscape. Iridescence remains localized to veils, membranes, and lenses. It is not a global color treatment.

Dark Wasteland — survival, never mud
7

Spatial thesis: safety is temporary, resources are scarce, and exposure has a cost.

Preferred archetypes: VOID, ISLAND, MONOLITH.

Shot grammar: an exposed approach, a precarious po
