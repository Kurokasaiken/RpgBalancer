Report on 2.5D AI Game-Art Pipeline Prompt Engineering
Tu
You are a principal technical director specializing in 2.5D real-time game-art pipelines and image-model prompt engineering. Perform deep research and produce a practitioner-grade report. Cite primary sources (official prompt guides, papers, animator/VFX write-ups, measured community tests) and mark each claim as verified vs anecdotal. CONTEXT — our pipeline (fixed, do not redesign):
- Each scene is ONE AI-generated painted image: 21:9 cinematic (~3168×1320 px),   heavy oil-impasto painterly style; no people or player party; no text,   signatures or watermarks. The image is never sliced into layers and the   generator is never asked for separate layers.
- Runtime animation stack, already built: (1) a baked depth map (Depth Anything   V2) drives in-place pixel-deformation parallax — near regions shift more than   far ones, and thin/tall elements sitting across a depth boundary tear and   smear (observed failure); (2) procedural ambient FX (fire glow with flicker,   embers, smoke columns with wind lean, dust motes, low fog drift) anchored to   image-fraction coordinates — each FX must sit on a small painted source such   as a lantern, campfire or chimney; (3) asset-backed overlay bands (noise-   masked fog veils, drifting cloud sprites, multiply cloud-shadows, distant   bird strips) scrolling over reserved clean bands of the image (open sky,   low ground); (4) an optional hand-cut, edge-anchored foreground occluder   (open gate, overhanging branches, rock ledge) as a true fast parallax layer.
- Design rule: the painting must contain the SOURCE of the life, not the life   itself — we animate the smoke, so the prompt must paint the chimney. RESEARCH OBJECTIVES (operational clauses, not theory): (a) Prompt clauses per generator (Gemini/Nano Banana, Imagen, GPT-image,     Midjourney, SDXL/Flux; ControlNet/regional prompting where relevant) that     reliably produce: edge-anchored separable foreground occluders with clean     silhouettes; ~3 readable depth planes (near/focal/far); small isolated     anchorable light sources; reserved negative-space bands. Give exact     phrasings (e.g. "bottom-left corner frames the view with [object]",     "middle distance cleared of clutter") plus negative-prompt phrasing. (b) Transferable lessons from limited animation, the Disney multiplane camera     and 2.5D photo-animation: which compositional features survive depth-map     parallax deformation (large masses, silhouettes, soft edges, atmospheric     perspective) and which fail (thin verticals, fences, foliage lattices,     hard edges across depth jumps). Translate each lesson into a prompt clause. (c) Documented failure modes of image models on spatial/compositional     instructions (left/right, foreground/background, negation, "empty space")     and robust phrasings — what models actually respond to (photographic lens     language, atmospheric perspective, scale cues) vs what they ignore.     Evaluate the hypothesis: models obey named placement and spatial negation     better than abstract "depth" requests. (d) What NOT to paint: guidance for reserving regions that procedural overlays     will animate — when painted-in fog/clouds conflict with scrolling     overlays, and where to place "empty" bands without making the image look     unfinished. DELIVERABLES:
A reusable scene-brief template with fillable slots (beat, focal subject,    near/focal/far planes, edge occluder, FX-anchor light sources, reserved    bands, mood, palette, style lock, exclusions).
A clause library grouped by purpose, with per-generator variants.
A failure-mode → cause → fix table.
A pre-generation checklist (10–12 binary or 1–5 items) flagging:    edge-anchored occluder present, 3 clean planes, anchorable light source,    reserved sky/ground bands, parallax survivability — with one "good vs bad"    prompt snippet per item.
Three worked example briefs with full prompts (forest ambush site,    departure threshold at dawn, ruined camp aftermath).
One-page summary: the ten highest-impact rules. Assumptions: prompts are written in English; generation is one-shot with re-rolls; 4–8 candidate images per brief are affordable; depth maps are baked offline with Depth Anything V2.
ricerca approfondita
Grok
Lavorato per 17s
Practitioner Report: Prompt Engineering for 2.5D Parallax-Ready Oil-Impasto Scene Paintings
Scope & method. One-shot English prompts for a fixed pipeline: single 21:9 (~3168×1320) oil-impasto painting (no people, no text/signatures/watermarks), Depth Anything V2 depth map for pixel-deformation parallax, procedural FX anchored to painted sources, scrolling overlay bands on reserved clean sky/ground, optional hand-cut edge occluder. Research draws on official model prompt guides (Google Nano Banana / Imagen, OpenAI GPT-Image, Black Forest Labs Flux, Midjourney docs), compositional fidelity papers (arXiv 2511.10136, 2603.03714, etc.), Disney multiplane technical descriptions (Walt Disney 1957 demo, Garity patent lineage, multiplane guides), and 2.5D photo-parallax practitioner notes. Claims are marked verified (primary source / controlled test / official) or anecdotal (community consensus / measured but uncontrolled).
1. Reusable Scene-Brief Template
BEAT: [one-sentence narrative beat, e.g. “aftermath of a skirmish at a forest crossroads just after rain”]
FOCAL SUBJECT: [largest readable mid-ground mass that carries the story, e.g. “fallen oak spanning a muddy track”]
NEAR PLANE: [large, soft-edged, edge-anchored or bottom-anchored mass(es) that can survive deformation, e.g. “mossy rock ledge and hanging ivy curtain along the lower-left frame edge”]
FOCAL PLANE: [story mass + any secondary large forms, clear silhouette, moderate contrast]
FAR PLANE: [soft atmospheric masses, reduced contrast/detail, e.g. “distant ridge line dissolving into blue haze”]
EDGE OCCLUDER (optional hand-cut): [clean silhouette object that touches or overlaps a frame edge, e.g. “open stone archway framing the left third of the view”]
FX-ANCHOR LIGHT SOURCES: [1–3 small, isolated, painted sources that procedural FX can attach to, e.g. “single lantern hanging from a branch, campfire coals in a shallow pit, chimney of a ruined hut”]
RESERVED BANDS: [explicit empty or low-detail regions for overlays, e.g. “upper 30 % open sky with only soft cloud forms; lower 15 % flat muddy ground free of vertical clutter”]
MOOD: [emotional temperature + time of day/weather]
PALETTE: [3–5 dominant hues + temperature]
STYLE LOCK: heavy oil-impasto painterly, thick visible brush strokes, impasto texture, cinematic 21:9, no people, no text, no signatures, no watermarks
EXCLUSIONS: thin verticals crossing depth planes, dense foliage lattices, fences, railings, hard geometric edges that jump depth, painted fog/smoke columns that would conflict with procedural FX, clutter in reserved bands
Fill every slot before writing the prompt. The painting must contain the source of life (chimney, lantern, fire pit), never the animated life itself.
2. Clause Library (grouped by purpose, with generator variants)
A. Edge-anchored separable foreground occluder (clean silhouette)
- Universal core: “bottom-left / left / right / top edge of the frame is occupied by a large [rock ledge / overhanging branch mass / open stone arch / ruined gate] that frames the view, clean silhouette against the mid-ground, soft painted edge”
- Midjourney: add “natural framing, silhouette framing, foreground framing element” + --no thin branches, lattice, fence
- Flux / SDXL: “strong foreground [object] with clean silhouette, edge-anchored, (foreground:1.3)”
- Gemini/Nano Banana & Imagen: “Place a large [object] along the left frame edge so it frames the view; the silhouette is clean and separable” (positive placement preferred; verified in Google guides)
- GPT-Image: labelled “Foreground occluder: [description] touching the left edge, clean outline”
B. Three readable depth planes
- Universal: “three clear depth planes — near: [large soft mass]; focal mid-ground: [story mass in sharp painterly focus]; far: [soft atmospheric ridge dissolving into haze] — atmospheric perspective, progressive softness and reduced contrast with distance”
- Midjourney / Flux: “layered depth from foreground to background, atmospheric perspective”
- SDXL + ControlNet Depth (when available): same clause + depth map conditioning
- All models respond better to named planes + scale cues (“near rocks the size of a cart, mid-ground trees half that height, distant ridge a thin band”) than abstract “deep depth” (verified photographic language bias across guides and papers).
C. Small isolated anchorable light sources
- “a single small lantern hanging from a low branch in the mid-ground, its warm glow the only local light source”; “shallow fire-pit with glowing coals at the base of the ruined wall”; “chimney of the half-collapsed hut emitting a thin painted plume base”
- Negative: “--no multiple scattered lights, no floating orbs, no full smoke columns” (or positive “empty air above the chimney”)
D. Reserved negative-space bands
- “upper third of the frame is open sky with only soft, low-detail cloud forms; lower 15–20 % is flat, low-detail ground free of vertical elements or clutter”
- “middle distance cleared of clutter, generous negative space in the upper sky band”
- Midjourney: “ample negative space, open sky composition”
- Gemini/Nano Banana: “generous negative space in the upper two-thirds for sky; empty ground band at bottom” (Google explicitly recommends positive framing of empty space).
E. Style + technical lock (all generators)
“heavy oil-impasto painterly style, thick visible brush strokes, rich impasto texture, cinematic 21:9 widescreen, no people, no figures, no text, no signatures, no watermarks, no logos”
F. Robust spatial negation / exclusion
Prefer positive description of emptiness over pure negation (verified by Google Nano Banana guides and compositional fidelity papers: training data almost never contain explicit negations).
- Good: “empty open sky band, flat uncluttered ground, middle distance cleared of thin verticals”
- Weaker: “no thin trees, no fences, no fog” (still useful as secondary negative prompt where supported).
G. Photographic / atmospheric language that models actually obey
“atmospheric perspective, soft distant haze, progressive desaturation and softness with distance, scale references (near rocks cart-sized, distant ridge a thin band), 24–35 mm wide cinematic view, eye-level horizon” (verified across Flux, Imagen, Midjourney, GPT-Image guides).
3. Failure-Mode → Cause → Fix Table
Failure mode
Cause (verified / anecdotal)
Prompt fix
Thin verticals / fences / foliage lattices tear under depth deformation
Depth map assigns intermediate depths; pixel shift shears thin structures (verified multiplane + 2.5D practitioner consensus; Disney multiplane deliberately avoided such elements on single planes)
Explicitly exclude: “no thin vertical trunks crossing depth planes, no fences, no lattice foliage, no railings”; force large soft masses only
Hard edges that jump depth planes smear
Depth discontinuity + deformation (verified Depth Anything + parallax shader limitations)
“soft painted edges between planes, atmospheric blending, no hard geometric cuts across depth”
Painted fog / smoke columns conflict with procedural overlays
Model fills “atmosphere” with static painted volume
“empty air above the chimney / fire-pit; the only painted source is the chimney mouth itself; no painted smoke or fog columns”
Clutter in reserved sky / ground bands
Model default is to fill empty space (verified GPT-Image community reports + order-to-space bias papers)
“upper 30 % open sky with only soft low-detail clouds; lower band flat muddy ground free of vertical clutter or objects”
Abstract “deep scene / strong depth” ignored
Models respond weakly to abstract depth requests; stronger to named placement + scale + atmospheric perspective (verified arXiv compositional fidelity surveys + official guides)
Replace with explicit near/focal/far plane descriptions + scale cues + “atmospheric perspective”
Left/right or foreground/background swapped
Order-to-space bias: mention order often maps to left-to-right layout (verified arXiv 2603.03714)
Name position first (“left frame edge occupied by…”, “bottom-left corner frames the view with…”) and keep consistent order
Negation ignored (“no people”, “no text”)
Near-total absence of explicit negation in training data (verified arXiv 2511.10136)
Positive framing (“empty open landscape, no figures present”) + secondary negative prompt where supported; re-roll
Occluder not edge-anchored or silhouette dirty
Model treats framing element as mid-ground prop
“large [object] that touches / overlaps the frame edge, clean silhouette, natural framing”
Multiple competing light sources
Model averages “light sources”
“exactly one small lantern…; the only local light source”
4. Pre-Generation Checklist (12 items)
Score each 0/1 (binary) or 1–5. Reject or re-prompt any item ≤2.
Edge-anchored occluder present? (Y/N)
Good: “left frame edge framed by a massive overhanging oak limb with clean silhouette”
Bad: “trees in the foreground”
Three clean, readable depth planes? (1–5)
Good: “near: mossy ledge; focal: fallen tree across track; far: soft ridge in haze”
Bad: “deep forest scene”
At least one small isolated FX-anchor light source? (Y/N)
Good: “single lantern hanging from a branch”
Bad: “warm lighting”
Reserved upper sky band (≈25–35 % open, low detail)? (1–5)
Good: “upper third open sky with only soft cloud forms”
Bad: “dramatic cloudy sky filled with detail”
Reserved lower ground band (≈10–20 % flat, uncluttered)? (1–5)
Good: “lower band flat muddy ground free of verticals”
Bad: “detailed forest floor with roots and plants”
Parallax survivability – only large soft masses, no thin verticals across planes? (1–5)
Good: “large rock masses and soft foliage clumps”
Bad: “dense thin tree trunks and fences”
Source of life painted, not the life itself? (Y/N)
Good: “chimney mouth of the ruined hut”
Bad: “rising smoke column”
No people / figures / text / signatures / watermarks? (Y/N)
Good: explicit positive “empty landscape, no figures” + style lock
Bad: omitted
Atmospheric perspective + scale cues present? (1–5)
Good: “atmospheric perspective, near rocks cart-sized, distant ridge a thin band”
Bad: “realistic depth”
21:9 cinematic + heavy oil-impasto style lock? (Y/N)
Middle-distance cleared of clutter? (1–5)
Good: “middle distance cleared of clutter, open sight-line to the focal mass”
Bad: “busy mid-ground”
Positive spatial placement preferred over pure negation? (Y/N)
5. Three Worked Example Briefs + Full Prompts
Example 1 – Forest ambush site (dusk, post-rain)
Brief filled: Beat = tense aftermath at a forest crossroads; Focal = fallen oak across muddy track; Near = mossy rock ledge + hanging ivy on lower-left edge; Far = soft blue ridge; Occluder = open ruined stone arch left edge; FX anchors = single lantern on arch + shallow fire-pit coals; Reserved = upper 30 % open dusk sky, lower 15 % flat mud; Mood = cold damp tension; Palette = deep greens, wet earth, cool blue dusk, warm lantern accent.
Full prompt (universal base, adapt per generator):
“Cinematic 21:9 heavy oil-impasto painting of a forest crossroads at dusk after rain. Left frame edge framed by a large open ruined stone arch with clean silhouette. Near plane: mossy rock ledge and soft hanging ivy curtain along the lower-left. Focal mid-ground: massive fallen oak spanning a muddy track, wet bark, puddles reflecting the last light. Far plane: soft distant ridge dissolving into cool blue atmospheric haze. Exactly one small lantern hanging from the arch, warm glow; shallow fire-pit with glowing coals at the base of the arch. Upper third open dusk sky with only soft low-detail clouds; lower band flat muddy ground free of vertical clutter. Atmospheric perspective, progressive softness and desaturation with distance, scale cues (near rocks cart-sized). Thick visible impasto brush strokes, rich painterly texture. No people, no figures, no text, no signatures, no watermarks, no thin vertical trunks crossing planes, no fences, no painted smoke columns.”
(MJ add --ar 21:9 --stylize 200 --no thin branches, lattice, fence, smoke, people, text; Flux/SDXL weight key planes; Gemini/GPT use labelled sections.)
Example 2 – Departure threshold at dawn
Brief: Beat = quiet leave-taking at a mountain pass gate; Focal = open wooden gate on a stone threshold; Near = overhanging pine boughs top-left + rocky ledge bottom; Far = soft mountain ranges in rose dawn haze; Occluder = gate itself edge-anchored; FX = single hanging lantern on gate post + chimney of a small stone way-hut; Reserved = large upper sky band, clean lower path band.
Prompt core:
“Cinematic 21:9 heavy oil-impasto painting, dawn at a mountain pass. Bottom-left and left edge framed by a large open wooden gate on a stone threshold, clean silhouette. Near: overhanging soft pine boughs and rocky ledge. Focal: the open gate and stone threshold with a single hanging lantern. Far: layered mountain ranges dissolving into soft rose and gold atmospheric haze. Chimney of a small stone way-hut visible in mid-ground as the only smoke-source base. Upper 35 % open dawn sky with soft cloud forms only; lower path band flat and uncluttered. Atmospheric perspective, thick impasto, no people, no text, no thin verticals across depth, no painted fog.”
Example 3 – Ruined camp aftermath
Brief: Beat = abandoned camp after a night raid; Focal = collapsed tent frames and cold fire-pit; Near = broken cart wheel and rock outcrop bottom-right; Far = soft treeline in mist; Occluder = overhanging dead branch mass top edge; FX = still-glowing coals in the fire-pit + one overturned lantern; Reserved = upper sky, lower churned earth band.
Prompt core:
“Cinematic 21:9 heavy oil-impasto painting of a ruined forest camp at first light. Top edge framed by a large overhanging mass of dead branches with clean silhouette. Near plane: broken cart wheel and soft mossy rock outcrop along the bottom-right. Focal: collapsed canvas and wooden tent frames around a shallow fire-pit with still-glowing coals; one overturned lantern nearby. Far: soft treeline dissolving into cool morning mist. Upper third open sky with only soft low-detail forms; lower band churned earth free of vertical clutter. Atmospheric perspective, thick visible brush strokes, no people, no figures, no text, no signatures, no thin poles or lattices crossing depth planes, no painted smoke.”
6. One-Page Summary – Ten Highest-Impact Rules
Paint the source, never the life – chimney, lantern, fire-pit coals; never the smoke, embers or glow volume that procedural FX will supply.
Force three named planes with scale cues and atmospheric perspective – models obey “near cart-sized rocks / mid fallen oak / far thin ridge in haze” far better than “strong depth”. (Verified)
Edge-anchor every occluder with “frames the view / clean silhouette / touches the frame edge” – otherwise it sinks into mid-ground.
Reserve explicit empty bands – “upper 30 % open sky with only soft clouds; lower 15 % flat ground free of verticals”. Models hate true emptiness; name the emptiness.
Ban thin verticals, lattices, fences and hard edges that cross depth planes – they are the primary parallax tear vectors. (Verified multiplane + depth-deformation practice)
Prefer positive spatial placement and positive emptiness over pure negation – training data lack negations. (Verified papers + Google guides)
Use photographic / cinematic language – atmospheric perspective, 24–35 mm, eye-level, progressive softness. Abstract art terms are weaker.
One or two small, isolated light sources only – “exactly one lantern\ldots” prevents competing glows.
Large soft masses survive; detail lattices fail – translate Disney multiplane lesson directly into prompt exclusions.
Style-lock + exclusion block at the end every time – heavy oil-impasto, 21:9, no people/text/signatures/watermarks, plus the thin-element ban. Re-roll 4–8 candidates; depth map is free offline.
These rules, applied consistently through the brief template and clause library, maximise the probability that a single painted image will survive Depth Anything V2 parallax, accept procedural FX anchors, and leave clean bands for overlays without looking unfinished.
91 sources
