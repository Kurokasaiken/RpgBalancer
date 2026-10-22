CONTEXT — we are building the "quest theatre" of a 2D fantasy RPG. Each quest phase displays ONE AI-generated painted image (21:9 cinematic, ~3168×1320 px, heavy oil-impasto style) on a stage. The image stays a single coherent painting: we do NOT slice it into layers, and we do NOT ask the generator for separate layers.

HOW WE ANIMATE IT (runtime, already built):
1. Depth-map parallax: a baked depth map (Depth Anything V2) drives in-place pixel deformation. A virtual camera performs push-in / pan / sweep / settle / hold moves; near regions shift more than far ones. Pixels deform — quads never translate — so thin, tall elements sitting across a depth boundary tear and smear (a known, observed failure mode).
2. Procedural ambient FX anchored to image-fraction coordinates: fire glow with flicker, embers, smoke columns with a wind lean, dust motes, low fog drift. To look right, each FX must "sit" on a painted source (a lantern, a campfire, a chimney): the painting must contain the SOURCE of the life, while we animate the life itself.
3. Asset-backed atmosphere overlays: noise-masked fog veils, drifting cloud sprites, multiply cloud-shadows, distant bird strips. They scroll over reserved bands of the image (open sky, low terrain) — so cluttered skies or busy foregrounds defeat them.
4. Optional authored foreground cutout: one edge-anchored occluder (an open gate, overhanging branches, a rock ledge) cut from the scene by hand becomes a real fast parallax layer — our most effective trick, straight out of limited animation / multiplane tradition.

WHAT WE WANT: a repeatable "scene brief" discipline for image-generation prompts, so every generated scene is deliberately easy to animate with the techniques above: strong separable foreground occluders at frame edges, ~3 readable depth planes (near/focal/far), small anchorable light sources, and clean reserved bands (open sky, low ground) where overlays will live.

YOUR TASK: write the best possible Deep Research prompt we can paste into a research agent (ChatGPT Deep Research / Gemini Deep Research). The research we need must cover:
(a) prompt-engineering techniques for image generators (Gemini/Nano Banana, Imagen, GPT-image, Midjourney, SDXL) that reliably produce separable foreground occluders, clean depth planes, and reserved negative space — with concrete clause examples;
(b) transferable lessons from limited animation, the Disney multiplane camera, and 2.5D photo-animation pipelines about which compositional features survive parallax deformation and which fail;
(c) documented failure modes of image models on compositional/spatial instructions and how to phrase them robustly (what image models actually "understand" about depth/layering requests);
(d) a practical evaluation checklist: how to tell, before generating, whether a prompt will yield an image that is easy to animate with cheap high-impact techniques.
Constraints the prompt must encode: fixed painterly oil-impasto style; no people/player party in frame; no text/signatures/watermarks; scenes are 21:9 cinematic; we need operational prompt clauses and checklist items, not pure theory.

Output ONLY the deep-research prompt text — self-contained, in English, ready to paste — max ~400 words. If anything is ambiguous, make a reasonable assumption and state it inside the prompt itself.