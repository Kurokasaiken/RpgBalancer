Act as a principal technical director and lead prompt engineer for a 2.5D real-time game-art pipeline. Conduct deep research to produce a specialized report on image-generation prompt engineering for creating "animation-ready" painted scenes. The goal is to establish a repeatable methodology for prompting text-to-image models to produce a single, flat, cinematic background image that is pre-composed to serve as the base plate for a multi-plane parallax system and procedural animation effects.

The report must detail a strategy for generating images that systematically include the following four elements, focusing on the exact phrasing required to command them:

Separable Foreground Occluders: Investigate clauses that reliably generate a distinct, easy-to-isolate foreground element at the edge of the frame (e.g., "In the bottom-left corner, a large, dark rock ledge frames the view...").

Readable Depth Planes: Research techniques for creating approximately three clear depth planes (near, mid, far). This includes using phrases that define distinct, overlapping masses with diminishing detail, atmospheric perspective, and value separation (e.g., "a mid-ground clearing separated from the far ridge by a band of morning haze").

Reserved Negative-Space Bands: Determine how to consistently generate intentionally un-detailed areas. These "empty" zones (e.g., a clear sky, a flat fog-covered ground) are required as canvases for procedural effects like scrolling fog veils, drifting cloud sprites, or distant bird strips.

Anchorable "Life" Sources: Find phrasing that creates small, isolated light or emissive sources within the scene (e.g., "a single lantern sits on a rock," "embers glow in a darkened campfire"). These serve as anchor points for procedural effects like flickering glows or floating dust motes.

Furthermore, the report must investigate:

Lessons from 2.5D Animation: Analyze principles from limited animation, the Disney multiplane camera, and 2.5D photo-animation. Identify which compositional features are critical for parallax success (e.g., large masses, clean silhouettes, soft edges) and which cause failure (e.g., thin verticals, complex lattices, hard-edged objects at varying depths). Translate these animation principles into prompt clauses.

Failure Modes: Document the common failures of image models (Midjourney, Imagen, SDXL, GPT-image) in adhering to spatial and compositional instructions (e.g., left/right, foreground/background, "empty space"). Identify robust phrasing and prompt structure that forces models to obey layout commands (e.g., using camera-lens terminology vs. simple descriptors).

The final output must be a set of practical, copy-pasteable tools:

A reusable, variable-based scene-brief template.

A library of clauses for the four required elements, categorized by model if necessary.

A failure-mode table that maps common prompting errors to their solutions.

A concise, 10-point pre-generation evaluation checklist to determine if a prompt is likely to produce a usable image.

Three complete worked examples of scene briefs and their corresponding full prompts for different fantasy environments (e.g., a forest path, a desolate mountain pass, a village street).

Constraints: All prompts must specify a heavy oil-impasto painterly style, a 21:9 cinematic aspect ratio, and strictly forbid characters or entities, text, signatures, or watermarks. The output is a single, flat image, not pre-sliced layers. All research must be supported by primary sources (official model documentation, technical papers) or empirical, community-tested findings, clearly marking any claims that are anecdotal or not fully verified.

Generate the polished, all-inclusive master prompt now. It should be a self-contained set of instructions that, when given to an image-generation AI, forces it to produce an image meeting all specified criteria for an animatable canvas.
