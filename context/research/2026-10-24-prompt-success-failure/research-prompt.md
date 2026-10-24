You are a senior prompt engineer for image generation (Gemini Imagen, Grok Imagine, Midjourney-class models) AND a game art director. We have a recurring failure and we want an honest forensic, not reassurance.

## The situation

We generate painted fantasy scene plates (oil impasto, Jaime Jones / Jeff Easley style) for a game's quest cinematics. Fixed contract: luminous high-chroma frames, palette bound to surfaces, no grey/brown/mud, aspect 2.4:1, no text/watermarks.

After several prompt iterations, quality has DROPPED. Early prompts produced spectacular results; our newer "improved" prompts produce mediocre, dark, or off-brief images.

## Real pairs (SUCCESS vs FAILURE)

### SUCCESS A (accepted): "CAMPSITE AT DUSK — painted in heavy oil impasto. A traveller's bivouac at last light in a forest clearing... a small campfire crackling center-left mid-ground — painted flame at its brightest point, the hearth stones and a bedroll beside it; a lantern hung on a post right of center; a dark water pool along the bottom-right holding the sky's last light... warm firelight raking the near ground... PALETTE: cinnabar-amber hearth light, deep teal shadow... The ground plane stays low-frequency; the air above the fire is kept clear... NO embers painted — the flame is painted, the sparks are runtime..."
→ Spectacular result: strong focal fire, layered depth, everything wired for runtime effects.

### SUCCESS B (accepted): "AGGUATO — painted in heavy oil impasto. An ambush at its cocked instant... a quiet forest road openly sunlit, EMPTY... a broad mossy rock-and-root mass fills the lower-left corner... hard midday sun on the road, the near mass in deep saturated shadow..."
→ Strong result: clean staging, real occluder mass, readable hidden figures.

### FAILURE A (rejected twice): "HIDDEN CACHE — ... a canvas-wrapped bundle under a stained tarp — its edge of waxed canvas and one visible corded knot give it away — around it, scattered minor goods: a dented kettle, a coil of rope, a grain sack torn open... forest floor seen from above, no horizon..."
→ Result 1: a padlocked CHEST dead-center at eye level (wrong object, wrong camera). Result 2: teapot, tied parcel, rope and sack scattered openly on the ground — nothing hidden, nothing above.

### FAILURE B (rejected): prompts for a chase/loot aftermath described at dusk in deep teal shadow with subtle relational cues ("a patch put back with too much care", "shapes swallowed by the dark")
→ Dark, murky, low-energy output; the "subtle" instruction was ignored or made it worse.

## Questions — answer honestly, attack our premises

1. What do the successful prompts structurally DO that the failures don't? Look beyond surface wording — what changes in what the model is asked to synthesize?
2. Is the failure caused by: object enumeration becoming salient subjects? relational/subtle instructions that can't be painted? missing dominant light source? unusual camera POVs? invented beats? Rank or reject.
3. What would YOU change in the workflow — not just in prompt text — to reliably get strong painted scenes? (seed images? reference frames? multi-step generation? different task decomposition?)
4. What are we NOT seeing — approaches outside our frame (we write one long prose prompt per scene, generate once, then wire runtime FX)?
5. Give at least one surprising or low-probability/high-upside idea we haven't considered.

Constraints to keep: single painted raster per scene (no per-object layers), luminous high-chroma output, impasto style, 2.4:1.
