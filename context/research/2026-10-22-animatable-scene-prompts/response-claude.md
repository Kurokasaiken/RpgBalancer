Role and goal. You are a research lead for a 2D fantasy RPG team. Produce a compact, practitioner-grade report on prompt engineering and image composition for single painted quest scenes that are deliberately easy to animate with cheap 2.5D techniques: depth-map parallax, procedural ambient FX (glow, embers, smoke, dust), and overlay bands (fog veils, cloud sprites, distant birds). The team already has a runtime that does depth-map deformation, procedural FX, overlays, and one hand-cut edge-anchored foreground occluder. Your job is to write the exact research prompt that a deep-research agent should use to fill gaps.

Operational findings we need the deep-research agent to produce:

Concrete prompt clauses per model — Gemini/Nano Banana, Imagen, GPT-image, Midjourney, SDXL — for edge-anchored separable foreground occluders, roughly three readable depth planes (near, focal, far), small isolated light sources, and reserved negative-space bands for overlays. Use exact phrasing where possible; give negative-prompt phrasings and placement cues.

Transferable lessons from limited animation, the Disney multiplane camera, and 2.5D photo-animation. Tell us which compositional features survive depth-map parallax (large masses, silhouettes, soft edges, atmospheric perspective) and which fail (thin verticals, fences, foliage lattices, hard edges across depth jumps). Translate lessons into prompt clauses.

Documented failure modes of image models on spatial/compositional instructions — left/right, foreground/background, negation, and "empty space" requests — and robust phrasings. Test the hypothesis that models obey named placement and spatial negation better than abstract "depth" requests.

A brief, prioritized, practical checklist to run before generating, flagging risky prompts that lack an edge-anchored occluder, that rely on thin geometry, or that lack a reserved band or an anchorable light source.

The finished prompt the agent should run must specify output shape: a reusable scene-brief template, a clause library grouped by purpose, a failure-mode table, a short checklist, and three worked example briefs. Keep the master prompt under 400 words.

Constraints: fixed oil-impasto painterly style; no people, text, or watermarks; one coherent 21:9 image (never generated layers); cite primary sources and mark anecdotal or uncertain claims.

Write the polished research prompt now, ready to paste into ChatGPT Deep Research or Gemini Deep Research.
