Role: Deep Research analyst for a 2D fantasy RPG team.
Goal: Produce a compact, practitioner-grade report on prompt engineering and image composition for painted quest scenes designed for cheap 2.5D animation.

Scene spec: one coherent painted image per scene (21:9, oil-impasto, no people/text), animated via depth-map parallax, procedural FX (glow, embers, smoke, dust), overlay bands (fog, clouds, birds), and optional hand-cut edge-anchored foreground occluders.

Research the exact prompt formulations for these models: Gemini/Nano Banana, Imagen, GPT-image, Midjourney, SDXL. Focus on:
1. Clauses for edge-anchored separable occluders and roughly 3 readable depth planes (near/focal/far).
2. Clauses for small isolated light sources and reserved negative-space bands (e.g., "clear bottom third for fog overlay").
3. Transferable lessons from limited animation, Disney multiplane, and 2.5D photo-animation: which compositional features survive depth-map deformation (masses, silhouettes, soft edges, atmospheric perspective) vs. fail (thin verticals, fences, lattices, hard depth jumps).
4. Documented failure modes of models on spatial/compositional instructions (left/right, foreground/background, negation, "empty space") and robust phrasings. Test hypothesis: models obey named placement and spatial negation better than abstract "depth" requests.
5. A brief prioritized pre-generation checklist flagging risky prompts (no edge occluder, thin geometry, missing band/light source).

Deliverables needed:
- Reusable scene-brief template with slots for the above.
- Clause library grouped by purpose (occluders, depth, light sources, bands).
- Failure-mode table with fixes.
- 3 worked example briefs for different scene types.

Constraints: cite primary sources and empirical tests; mark anecdotal claims; note model-specific differences; include negative-prompt phrasings and placement cues (e.g., "left frame edge," "bottom third").

Now write the polished research prompt, ready to paste into ChatGPT Deep Research or Gemini Deep Research. Max 400 words.
