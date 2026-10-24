You are a senior art director AND an evaluation-methodology researcher. We need to design a calibration loop, and we want methodological honesty, not a checklist generator.

## The situation

An AI agent (me) authors image-generation prompts for painted fantasy game scenes and judges the outputs. Problem: my aesthetic judgments have repeatedly diverged from the art director's — I approved images he rejected (dark murky palettes, wrong subjects, off-fiction props), and my prompt iterations degraded quality. We need to train MY ability to both generate and recognize good images, calibrated against his taste.

Two distinct tracks run simultaneously:
- **Track A — generic image quality**: is this an appreciable painted image? (beauty, style fidelity to oil-impasto Wanderlust DNA: luminous high-chroma, no grey/brown mud, Jaime Jones / Jeff Easley)
- **Track B — quest-scene animatability**: is this image usable as a living-painting plate? (dominant focal light event, edge-anchored occluders for parallax creep, low-conflict regions reserved for runtime fog/embers/particles, hidden-interaction affordances readable-but-camouflaged, depth-map-friendly layering, 2.4:1)

An image can pass A and fail B (a beautiful but compositionally flat portrait) or fail A while technically passing B.

## What we plan to build (critique this)

1. A per-category rubric (A: focal hierarchy, light event, chroma discipline, technique fidelity, artifacts; B: + occluder anchors, FX-source presence, reserved regions, depth readability, affordance readability) scored blind by me.
2. Blind evaluation on the existing corpus (~15 accepted + several rejected images) → compare my scores to the Director's known verdicts → measure where I diverge.
3. Iteration: score new generations before showing them; the Director only sees my top picks; he corrects misses; error log accumulates.
4. Eventually: I pre-generate variants myself and self-select.

## Questions — attack, don't fill in

1. What does judgment-calibration literature/practice (art school crits, ML preference tuning, QC rater training) actually do that transfers here? What transfers badly — where is my framing wrong?
2. What rubric structure separates "beautiful" from "animatable" so the two don't contaminate each other? Is a single weighted score wrong?
3. How many samples, in what arrangement, does calibration need before my scores predict his verdicts? What statistics tell us I'm calibrated vs lucky?
4. Where will I systematically remain blind — categories of judgment a vision-capable agent can measure but a critic judges differently (e.g., "does it feel alive", "does it read as this world")?
5. What are we NOT seeing — a fundamentally different way to solve "agent generates and self-evaluates images for a taste-critical pipeline"? (Examples to probe: embedding-space similarity to accepted references, pairwise comparison instead of absolute scores, learning a small preference model from his accept/reject history, structured critique formats.)
6. One surprising/high-upside idea.

Constraints: single painted raster per scene; the agent can view images (vision-capable) and compute image statistics; generation is via external image models (Gemini/Grok) driven manually or via UI automation; no GPU training infra — anything learned must be lightweight (few-shot, retrieval, small classifiers).
