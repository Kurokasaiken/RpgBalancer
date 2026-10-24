CONTEXT — RPG quest theatre: each scene is ONE painted image (oil impasto,
2.4:1) + a baked depth map → in-place parallax warp, authored camera moves
(creep/push/pan/hold), and procedural ambient layers (glow, smoke, embers,
fog, fireflies, shafts — canvas + DOM sprites). Images come from an image
generator (Gemini/Nano Banana). Everything is a single merged raster — no
layer pipeline by design.

Two things we want that we have NO design for yet:
(A) SCENE VARIANTS — multiple versions of the SAME scene (day/dusk, before/
after an event, hidden vs revealed state) that stay consistent enough to
transition between or mask-delta.
(B) NARRATIVE REVEALS — content that responds to the camera: e.g. hidden
figures "rising" out of vegetation as the camera creeps in — not ambient
life, but story-beat animation.

THIS IS AN OPEN-HORIZON QUESTION — deliberately NOT a taxonomy request.
Do not just answer the two points above: the most valuable part of your
response is what we did NOT think to ask. Survey freely across games,
visual novels, cinemagraphs, animation, shader tricks, theme park rides,
pixel-art-era techniques, interactive film, AR, theatrical automation —
anything that makes stills behave like living scenes. Then:

1. For (A): how do productions actually generate consistent variants of
   one artwork (seed reuse, img2img, edit-model passes, layered plates,
   palette/LUT grading)? Which approaches survive "same scene, changed
   element" without regenerating everything? What transition mechanics
   exist between variants (crossfade, region-masked blend, masked reveal)?
2. For (B): every mechanism you know for staged reveals from stills —
   cutout sandwiches, occlusion masks, animated region plates, depth-sorted
   sprite insertion, and weirder ones. What does the reveal LOOK like when
   done well vs done cheap?
3. THE HORIZON: what are we missing entirely? Techniques for living stills
   that fit "one painted image + depth map + camera + layers" that nobody
   here considered — flow fields, color cycling, parallax puppets, masked
   texture scroll, grading-time travel, stereo tricks, audio coupling —
   name it, sketch how it works, say what it costs.
4. Challenge: which of our constraints should we QUESTION? Single raster?
   Deterministic canvas? The "no layer pipeline" rule? Say where the rule
   buys us little and costs us much.

Be concrete, speculative where honest, and prefer surprising-over-safe.
