# Final Deep Research prompt — RPG quest-scene "animatable art" discipline

Synthesis of 4 provider responses (claude, gemini, grok, deepseek) to the
solicitation in this run. ChatGPT unavailable (web free-tier response failures
+ codex usage limit until 2026-11-17).

Paste the block below into ChatGPT Deep Research / Gemini Deep Research:

---

You are a principal technical director specializing in 2.5D real-time game-art
pipelines and image-model prompt engineering. Perform deep research and produce
a practitioner-grade report. Cite primary sources (official prompt guides,
papers, animator/VFX write-ups, measured community tests) and mark each claim
as verified vs anecdotal.

CONTEXT — our pipeline (fixed, do not redesign):
- Each scene is ONE AI-generated painted image: 21:9 cinematic (~3168×1320 px),
  heavy oil-impasto painterly style; no people or player party; no text,
  signatures or watermarks. The image is never sliced into layers and the
  generator is never asked for separate layers.
- Runtime animation stack, already built: (1) a baked depth map (Depth Anything
  V2) drives in-place pixel-deformation parallax — near regions shift more than
  far ones, and thin/tall elements sitting across a depth boundary tear and
  smear (observed failure); (2) procedural ambient FX (fire glow with flicker,
  embers, smoke columns with wind lean, dust motes, low fog drift) anchored to
  image-fraction coordinates — each FX must sit on a small painted source such
  as a lantern, campfire or chimney; (3) asset-backed overlay bands (noise-
  masked fog veils, drifting cloud sprites, multiply cloud-shadows, distant
  bird strips) scrolling over reserved clean bands of the image (open sky,
  low ground); (4) an optional hand-cut, edge-anchored foreground occluder
  (open gate, overhanging branches, rock ledge) as a true fast parallax layer.
- Design rule: the painting must contain the SOURCE of the life, not the life
  itself — we animate the smoke, so the prompt must paint the chimney.

RESEARCH OBJECTIVES (operational clauses, not theory):
(a) Prompt clauses per generator (Gemini/Nano Banana, Imagen, GPT-image,
    Midjourney, SDXL/Flux; ControlNet/regional prompting where relevant) that
    reliably produce: edge-anchored separable foreground occluders with clean
    silhouettes; ~3 readable depth planes (near/focal/far); small isolated
    anchorable light sources; reserved negative-space bands. Give exact
    phrasings (e.g. "bottom-left corner frames the view with [object]",
    "middle distance cleared of clutter") plus negative-prompt phrasing.
(b) Transferable lessons from limited animation, the Disney multiplane camera
    and 2.5D photo-animation: which compositional features survive depth-map
    parallax deformation (large masses, silhouettes, soft edges, atmospheric
    perspective) and which fail (thin verticals, fences, foliage lattices,
    hard edges across depth jumps). Translate each lesson into a prompt clause.
(c) Documented failure modes of image models on spatial/compositional
    instructions (left/right, foreground/background, negation, "empty space")
    and robust phrasings — what models actually respond to (photographic lens
    language, atmospheric perspective, scale cues) vs what they ignore.
    Evaluate the hypothesis: models obey named placement and spatial negation
    better than abstract "depth" requests.
(d) What NOT to paint: guidance for reserving regions that procedural overlays
    will animate — when painted-in fog/clouds conflict with scrolling
    overlays, and where to place "empty" bands without making the image look
    unfinished.

DELIVERABLES:
1. A reusable scene-brief template with fillable slots (beat, focal subject,
   near/focal/far planes, edge occluder, FX-anchor light sources, reserved
   bands, mood, palette, style lock, exclusions).
2. A clause library grouped by purpose, with per-generator variants.
3. A failure-mode → cause → fix table.
4. A pre-generation checklist (10–12 binary or 1–5 items) flagging:
   edge-anchored occluder present, 3 clean planes, anchorable light source,
   reserved sky/ground bands, parallax survivability — with one "good vs bad"
   prompt snippet per item.
5. Three worked example briefs with full prompts (forest ambush site,
   departure threshold at dawn, ruined camp aftermath).
6. One-page summary: the ten highest-impact rules.

Assumptions: prompts are written in English; generation is one-shot with
re-rolls; 4–8 candidate images per brief are affordable; depth maps are baked
offline with Depth Anything V2.
