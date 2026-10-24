CONTEXT — We author single painted images (oil-impasto style, 2.4:1 ultra-wide)
for a quest "theatre" in an RPG. Each image is rendered with a baked monocular
depth map (Depth Anything V2), an in-place parallax warp, camera moves
(push-in, lateral pan, slow creep, holds) and procedural ambient layers
(smoke, glow, fog, fireflies, shafts). We discovered our scenes all converge
on ONE skeleton: two dark masses anchored at frame edges + a diagonal lead
into depth ("the tunnel/funnel"). It works but repeats — every scene looks
alike. We need a *taxonomy of composition archetypes* so consecutive scenes
deliberately differ while still feeding the parallax (which needs: near-plane
occluders with clean silhouettes, staggered mid-ground steps, far focal zone,
low-conflict regions for overlays).

RESEARCH QUESTION — Survey how the following media solve compositional
VARIETY and depth staging in a single static frame, and distill a named
archetype vocabulary we can adopt:

1. CLASSICAL PAINTING — the repoussoir technique (Claude Lorrain, Ruysdael,
   Constable, Hudson River School), coulisse, the foreground/mid/background
   triad, and how masters varied it (single-side repoussoir, framing
   overhangs, aerial perspective without occluders).
2. CINEMATOGRAPHY — frame-within-frame, "dirty" foregrounds, over-shoulder
   elements, deep-staging compositions (Wyler, Welles), anamorphic framing,
   and which shot grammar each serves (dolly-in vs lateral dolly vs pan vs
   static hold). How DPs keep consecutive shots from repeating one formula.
3. PHOTOGRAPHY — leading lines, layering, natural framing devices,
   negative-space composition, horizon-height rules.
4. COMICS/MANGA — establishing panels and depth staging in a single panel;
   camera-angle vocabulary (bird's eye, worm's eye, over-shoulder); how page
   flow alternates panel "shot types" to avoid monotony; splash vs tight.
5. POSTERS / KEY ART — theatrical one-sheet composition (Struzan-style
   pyramids, scale hierarchy, hero-vs-vista layouts) and movie-poster depth
   tricks that could transfer to a painted scene.
6. GAME ENVIRONMENT ART / CONCEPT ART — vista design, "hero landmark"
   staging, level-composition archetypes used in AAA concept art briefs.
7. THEATRICAL SCENOGRAPHY — wing flats, sightlines, proscenium depth layers
   (the literal ancestor of our edge occluders).
8. TOWNSCAPE/ARCHITECTURE — Gordon Cullen's "serial vision": how a sequence
   of framed views is varied on a walk (the exact "consecutive frames must
   differ" problem we have).
9. VISUAL NOVELS / ANIMATION BG — how VN and anime backgrounds vary
   composition across consecutive scenes on a fixed stage.

DELIVERABLE — A named taxonomy of 8-12 composition archetypes. For EACH:
(a) name (coin a short id + media provenance); (b) geometric rule — where
the occluders sit and what stays clear; (c) the staging/mood it communicates;
(d) variation knobs (so the same archetype can differ between scenes);
(e) which camera move it serves best in our set (push-in / pan-lateral /
creep / hold); (f) parallax risk notes for our depth-map warp (thin bare
branches and lattices smear; low-contrast near masses misbake).
Then: 5-8 anti-monotony sequencing principles — how a SEQUENCE of scenes
should alternate archetypes (rhythm of closed vs open frames, escalation,
focal-position rotation, horizon-height rotation). Be concrete and visual;
assume the reader can implement anything you describe.
