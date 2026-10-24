CONTEXT — RPG quest theatre: ONE painted image per scene (oil impasto,
2.4:1) + baked depth map → in-place parallax warp, authored camera moves,
and ambient FX drawn as a deterministic canvas layer (particles are pure
functions of a shared clock — seeded, testable, no timestepped state).
We already have: glow, smoke, embers, dust, drift, glint, fireflies,
moths, shaft, fog kits, cloud-shadow, leaves, rain. Images from an image
generator; sprites/plates CAN be generated too.

A lesson learned: hand-rolling effects from zero produces weak results —
we want the COMPLETE family of ambient/living-still effects as practised
in real productions, with their established recipes.

OPEN-HORIZON QUESTION — no prescribed answer shape. Survey across games,
visual novels, cinemagraphs, canvas/WebGL particle libraries (pixi-particles
and friends), theme-park technique, pixel-art era, shader tricks. Then:

1. THE FULL CATALOGUE: every ambient/physical effect type that makes a
   painted still feel alive — particles (leaves, rain, snow, petals, ash,
   birds, insects, embers, dust), surfaces (water flow, reflections,
   fog volumes, cloud banks, heat shimmer), light (glows, shafts, glints,
   moonlight, lightning), texture motion (smoke curls, banners, hair,
   foliage sway, candle flames). For EACH: the reference recipe (how it's
   really done — sprite bake? tumble squash? strip scroll? flow field?
   cel frames?), what it costs, and the tell that separates "alive" from
   "cheap particle spam".
2. WHEN: which effects pair with which scene moods/compositions — what
   does a forest path want vs a torch-lit camp vs a vista vs a battle?
   What NOT to combine (busy scenes, competing motions).
3. LIBRARIES & REUSE: what mature libraries/techniques exist (particle
   emitters, weather kits, sprite sheets, generated stamps) — and what
   survives a determinism constraint (pure function of clock, no state).
4. THE HORIZON: what are we NOT thinking of? Generated sprite stamps in
   the painting's own brush style? Video-model plates for small regions?
   Depth-aware effects? Audio coupling? Name it, sketch cost.
5. Challenge: where does our "procedural canvas deterministic" model hold
   us back — and is it worth keeping for tests vs adopting a real
   particle engine?

Be concrete and surprising-over-safe.
