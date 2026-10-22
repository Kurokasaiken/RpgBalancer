You are an expert prompt engineer and technical artist specializing in 2.5D game art pipelines for 2D fantasy RPGs. Your task: deliver a compact, actionable report on prompt engineering and compositional strategies to generate single painted quest scenes optimized for cheap animation via depth-map parallax, procedural ambient FX (glow, embers, smoke, dust), and overlay bands (fog veils, cloud sprites, distant birds). The output must be integrated into our runtime: depth-map deformation for parallax, procedural FX anchored to painted sources, overlay bands for atmospheric layers, and optional hand-cut edge-anchored foreground occluders for hero scenes. Focus on researchable gaps — not full implementation.

Research objectives — exact research prompt needed:
Target models: Gemini/Nano Banana, Imagen, GPT-image, Midjourney, SDXL/Flux. Prioritize operator-ready clauses (positive + negative prompts, placement phrases, bbox/coordinate JSON where supported, e.g., Flux layout prompts or Regional Prompter).

Core findings required:
Clauses for edge-anchored, separable foreground occluders (e.g., "bottom-left frame-edge rock with clean silhouette"), ~3 readable depth planes (near foreground / focal midground / distant background), small isolated light sources (lanterns, embers), and reserved negative-space bands for overlays (e.g., "low mist layer in 20% bottom band").

Lessons from limited animation, Disney multiplane, and 2.5D photo-animation: Compositional winners (large masses, silhouettes, soft edges, atmospheric perspective, value gradients) vs. losers (thin verticals, fences, lattices, high-freq details crossing depth planes, hard edges). Translate to prompt clauses and avoidance rules.

Documented failure modes: Spatial/composition errors (left/right swaps, merged planes, ignored negation, "empty space" pollution). Robust phrasings (e.g., "empty sky in upper third" vs "negative space"). Test hypothesis: Does naming depth planes + spatial negation outperform "create depth"?

A 5-10 item pre-gen checklist scoring risk: No edge occluder? Thin geometry? Missing overlay band/light source? Visualize with good/bad prompt snippets.

Deliverables from your research agent:
Reusable scene-brief template (slots for occluder, planes, FX anchors).
Clause library (grouped: occluders, planes, lights, bands; per-model variants).
Failure-mode table (model, issue, fix).
Short checklist (your Q4 output).
3 worked example briefs (e.g., "misty forest quest," "ruined village," "mountain pass").

Style/scene constraints: Oil-impasto painterly (heavy textured brushwork, warm glows, atmospheric depth); 21:9 cinematic (approx 3168x1320); no people/party (focus objects/environments); no text/watermarks/signatures; single coherent image (no explicit layers); empirically cite primary sources (official docs, papers, community tests); flag anecdotes/uncertainties.

Max 400 words for the finished master prompt.
