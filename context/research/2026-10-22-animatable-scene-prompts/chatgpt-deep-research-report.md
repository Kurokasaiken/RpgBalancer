Modello di Brief di Scena
Battuta: Descrizione sintetica del contesto narrativo (es. “imboscata nella foresta al crepuscolo”).
Soggetto principale: Il punto focale della scena (es. “un accampamento abbandonato”, “un’antica porta di legno” etc.).
Piani di profondità:
- Primo piano (vicino): elementi di grande dettaglio o occluditori (es. tronchi caduti, folto sottobosco).
- Piano medio: elemento di interesse a distanza media (es. cespugli radi, fuoco spento).
- Sfondo: elementi lontani e atmosfere (es. montagne nebulose, alberi sfocati, cielo aperto).
Occluditore anteriore: Oggetto solido su un lato/angolo (es. “una porta di legno aperta a sinistra” o “ramoscello sul bordo inferiore-destro”), con sagoma ben definita.
Fonti di luce ancorabili: Piccoli elementi luminosi usati dall’animazione (es. una lanterna penzolante, un braciere con fiammelle, una candela su un camino). Vanno dipinti (bocche di fuoco, lampioni) ma non le fiamme o il fumo.
Bande di spazio riservate: Aree “vuote” pittoriche lasciate libere per gli overlay. Tipicamente cielo sgombro in alto (con colori sfumati chiari) e terreno aperto in basso; ad esempio “cielo limpido con poche nuvole leggere” o “erba bassa uniforme nella parte inferiore”.
Mood e tavolozza: Tono emotivo generale (es. “tetro e misterioso”, “epico al tramonto”), palette cromatica (colori caldi/freddi, contrastati). Aggiungere parole come “cinematografico”, “drammatico” se applicabile.
Stile pittorico: Specificare stile e tecnica (es. “pennellate spesse ad olio, impasto marcato”) e aspect ratio 21:9. Gemini suggerisce esplicitamente di includere stile e composizione nel prompt.
Esclusioni/Negative prompt: Cose da evitare (es. “niente persone, nessun animale”, “senza testo o segni moderni”). Inserire eventuali negazioni (es. “no vehicle”, “no text”).
Questo template aiuta a compilare le informazioni chiave prima di scrivere il prompt finale.
Libreria di Clausole per Prompt (per Generatore)
Le frasi di seguito sono esempi di clausole da includere nel prompt (categoria per scopo) e, ove utile, del prompt negativo corrispondente. Sono adattabili in base al modello (Gemini/Nano Banana, Imagen, GPT-image, Midjourney, SDXL/Stable Diffusion).
- Occluditore anteriore:2.5D Cinematic Environment Art: prompt design for a single painted plate
Practitioner research note — 22 October 2026
Scope: one 21:9-ish painted image per scene; baked Depth Anything V2 map; in-place deformation parallax; source-anchored procedural FX; scrolling sky/ground overlays; optional hand-cut, edge-anchored foreground occluder. The pipeline is treated as fixed.
Evidence labels and limits
- [PRIMARY-VERIFIED] The cited official docs, implementation docs, or paper directly support the stated capability/limitation. This does not mean that a particular prompt clause has been empirically proven.
- [BENCHMARK-VERIFIED] Supported by a published benchmark or controlled research result, within that paper's tested models/prompts and date.
- [PIPELINE-OBSERVATION] Reported failure in the described production stack (e.g. a thin object crossing a depth discontinuity tears). This is strong local evidence, but not a broad model benchmark.
- [ENGINEERING-INFERENCE] Practical recommendation inferred from the sources plus the known render mechanics. Treat it as a testable rule, not a guarantee.
- [ANECDOTAL] Community observations or unmeasured reports. Useful for generating a test hypothesis, not for declaring a fact.
This is a source-based engineering report, not a newly run cross-model image-generation benchmark. The prompt clauses below are recommended hypotheses to test against 4–8 outputs, not assertions that all six generators will obey them every time.
Executive findings
Describe visible geometry, not the word “depth.” Give the viewer a large, edge-attached near mass, a separately readable middle-distance focal area, and a distant low-contrast background. Use relative scale and overlap cues. “Three depth planes” by itself is abstract and leaves the model room to improvise. [ENGINEERING-INFERENCE; consistent with composition benchmarks]
Use one main occluder with a broad, continuous silhouette. A thick gate leaf, trunk, rock lip, or overhanging bough mass is safer than a fence, twig lattice, hanging chains, or a fine branch network. Keep most of the occluder at one apparent depth; do not weave it through the focal zone. [PIPELINE-OBSERVATION + ENGINEERING-INFERENCE]
Paint an anchor, not the animated effect. Paint a distinct lantern, fire bowl, brazier, chimney mouth, or window. Animate the glow/smoke/embers from that localized source. Do not paint a large smoke column, rolling mist bank, or detailed moving cloud into a band intended for an overlay. [FIXED-PIPELINE RULE]
“Empty” should mean low-frequency and legible, not blank. A reserved cloud band still needs a softly graded sky, faint horizon haze, and painterly color variation; a ground band can retain sparse grass strokes and broad terrain value changes. Keep high-contrast silhouettes, painted clouds, birds, branches, and architecture out of the exact region where scrolling assets must read. [ENGINEERING-INFERENCE]
Negative prompting is model-specific. Imagen has a separate negative-prompt concept and advises listing unwanted concepts rather than phrasing them as “no X”; Midjourney provides `--no`; SDXL pipelines commonly have a `negative_prompt`; the official FLUX.2 guidance says it does not support negative prompts and recommends positive descriptions instead. GPT Image and the Gemini conversational prompt guide primarily describe natural-language instructions, not a universal negative-prompt field. [PRIMARY-VERIFIED]
Spatial wording is a soft constraint, not a layout lock. Published work finds persistent failures in spatial relations, negation, counting, and complex composition. Named placement is still worth using, but the hypothesis that it is more reliable than an abstract “depth” instruction has not been established for these exact prompts across current model versions. [BENCHMARK-VERIFIED + ENGINEERING-INFERENCE]
Lens language is a look cue, not geometry control. “Wide-angle establishing shot” and “atmospheric perspective” can help signal scale and distance, but should supplement—not replace—named objects, edge coordinates, relative scale, and occlusion. OpenAI’s current guide explicitly says camera specifications are cues to appearance, not a guarantee of physical simulation. [PRIMARY-VERIFIED]
Inspect likely Depth Anything V2 discontinuities before approving an image. The model predicts monocular depth, not a hand-authored set of rigid object layers. It cannot make a thin branch become a coherent rigid object when neighboring pixels receive different depths. In your stack this is already an observed failure mode; the prompt should minimize problematic geometry before the depth map is baked. [PAPER + PIPELINE-OBSERVATION]
One important specification mismatch
The stated dimensions 3168 × 1320 have an aspect ratio of 2.4:1, which is 12:5, not exactly 21:9 (2.333…:1). A 21:9 image 1320 px high would be 3080 px wide; 3168 px wide at 21:9 would be about 1358 px high. Pick one target in your export step. This report treats “21:9” as the composition brief and 3168×1320 as an approximate final raster, but recommends using the actual production crop as the review frame. A composition that barely works at 21:9 may lose a gate or a sky band when cropped to 2.4:1.
1. Generator-specific operating rules
Quick comparison
Generator / workflow
Exclusions
What to emphasize
Main caveat for this use case
Gemini / Nano Banana
Use concise positive descriptions of the desired empty scene; put exclusions in plain language. Do not assume a separate negative-prompt field in every UI/API surface.
Composition, framing, style, location, relative scale, visible anchors, and aspect ratio. Official guidance explicitly recommends describing composition and style; API offers aspect-ratio settings.
The supported ratio/size options are interface/model-specific. Current API docs list 21:9 for supported Nano Banana models, but a UI surface may expose different controls. The text alone is not a hard geometric constraint.
Imagen (Vertex AI)
Use the separate `negative_prompt` field when available. Official guide recommends simple unwanted concepts (`branches, fence`) rather than instructions such as `do not show branches`.
Describe the positive scene with camera distance/position, subject, setting, light and style; state which region each object occupies.
A global negative prompt can remove wanted instances too. Do not put `branches` in a global negative if the gate is framed by one deliberate large bough.
GPT Image (OpenAI)
Use natural-language exclusions in a labeled `Constraints / Exclusions` section; don’t assume a separate negative-prompt API parameter.
Labeled, maintainable sections; explicit shot framing and composition; clear nouns, material, lighting, placement and target aspect ratio.
Official docs still warn that layout-sensitive positioning may be imperfect. Camera/lens words steer appearance; they do not guarantee exact optics or placement.
Midjourney
Use `--no people, text, watermark, fence` for concrete unwanted elements; avoid relying on prose such as “without any …”.
Keep the prompt compact. State the most important composition first, use direct placement language, then style/light. Use `--ar` for the crop and lower `--stylize` when literal adherence matters more than free interpretation.
`--no` is a suppression aid, not local masking. Current docs say “no cake” in prose may still produce cake. Very wide ratios may be less predictable, so inspect the target crop. Check parameters against the actual version selected.
SDXL (Diffusers / compatible UI)
Use `negative_prompt` for global exclusions/artifact classes; exact syntax/weighting depends on the host.
Positive prompt with spatially grounded phrases; a negative prompt for fences/wires/text/people; if permitted, ControlNet depth or Canny/line control to guide a single final image’s layout.
ControlNet is an optional conditioning mechanism, not a layer-export scheme. The final output remains one painted plate. A control map can overconstrain texture and should be kept simple.
FLUX (especially FLUX.2 official guidance)
For FLUX.2, use positive alternatives, not a negative prompt: “open uncluttered sky” instead of “no clouds”; “deserted clearing” instead of “no people.” A third-party wrapper may expose fields that do not behave like BFL’s native model.
Natural-language scene description; concise but concrete composition; name the object and its exact relationship to a frame edge / focal clearing.
Do not paste an SDXL negative prompt into FLUX.2 and assume it is applied. Check the exact checkpoint and inference API; FLUX.1, FLUX.2, custom checkpoints, and wrappers are not interchangeable.
Sources: [Gemini Image prompt guide](https://deepmind.google/models/gemini-image/prompt-guide/), [Gemini API image generation](https://ai.google.dev/gemini-api/docs/image-generation), [Imagen prompt guide](https://cloud.google.com/vertex-ai/generative-ai/docs/image/img-gen-prompt-guide), [OpenAI image prompting](https://developers.openai.com/api/docs/guides/image-prompting), [Midjourney Prompt Basics](https://docs.midjourney.com/hc/en-us/articles/32023408776205-Prompt-Basics), [Midjourney --no](https://docs.midjourney.com/hc/en-us/articles/32173351982093-No), [SDXL release notes](https://platform.stability.ai/docs/release-notes), [Diffusers ControlNet](https://huggingface.co/docs/diffusers/using-diffusers/controlnet), [BFL FLUX.2 negative-prompting note](https://help.bfl.ai/articles/7734566352-does-flux-2-support-negative-prompting).
1.1 Gemini / Nano Banana — clause style
Use: `A wide cinematic establishing view. A massive [object] attached to the bottom-left frame edge forms a clean dark silhouette. Beyond it, [focal subject] occupies the middle distance. Far [landform/trees] fade into blue atmospheric haze. The upper 22% is an open, softly graded sky reserved for moving cloud overlays.`
For an empty band: describe its positive visual state, not only an absence: `The upper fifth is a continuous pale dawn sky with a subtle painterly gradient and only faint horizon haze; the cloud silhouettes remain outside this band.`
For a light anchor: `One small lantern with a clearly visible warm glass pane is fixed to the right gatepost; its warm point of light is distinct from the ambient dawn light.`
Avoid: burying composition between long lore paragraphs; several competing “main” subjects; “lots of depth”; instructions that require several objects to sit at a specific small coordinate while also asking for a complex painterly scene.
Evidence: Official Google prompt guidance specifically calls out style, subject, setting, action, composition, framing and aspect ratio; the API docs expose image size and aspect ratio as structured fields for supported models. That verifies the method of specifying composition, not guaranteed obedience to exact sub-frame percentages. [Gemini prompt guide](https://deepmind.google/models/gemini-image/prompt-guide/) · [Gemini API image guide](https://ai.google.dev/gemini-api/docs/image-generation).
1.2 Imagen — clause style and negative prompt
Positive prompt: `Cinematic widescreen oil painting of [beat]. Composition: a thick [occluder] is attached to the far-left frame edge and occupies only the leftmost foreground; the focal [subject] sits in a clear middle-distance opening; distant [background] is smaller, lower-contrast, and blue with atmospheric haze. A small [lantern/fire bowl] is clearly visible at [position]. Leave the upper [20–25]% as a softly graded open sky for cloud overlays.`
Separate negative prompt, if the chosen Imagen endpoint exposes it: `people, humanoids, text, lettering, watermark, fence, wire mesh, tangled fine branches, high-contrast cloud bank across upper sky, thick painted smoke column, fog covering the focal subject`.
Imagen’s official guide recommends simple unwanted concepts in the negative field, not instructional wording like “do not show walls”. Keep desired and unwanted concepts separated; don’t use negative prompt as a substitute for the positive layout brief. For this pipeline, a negative like `branches` is too broad if you still need a gate framed by foliage. Use `fine branch lattice, twig network` instead.
Evidence: [Imagen prompt guide](https://cloud.google.com/vertex-ai/generative-ai/docs/image/img-gen-prompt-guide).
1.3 GPT Image — clause style
Use labeled sections because the official OpenAI guide recommends a clear, maintainable structure for complex images: scene, subject, details, constraints. A reliable prompt shape is:
SCENE: [one-sentence narrative beat and environment].
COMPOSITION: Wide cinematic establishing shot. A broad [object] is physically attached to the [left/right/bottom] frame edge and forms a simple continuous foreground silhouette. The middle distance is a clear focal opening containing [one focal feature]. The background contains smaller, lower-contrast [mountains/treeline/ruins] softened by atmospheric perspective.
DEPTH READ: Three visible distance groups: large near silhouette; readable middle-distance focal area; distant, smaller, cooler masses. Do not weave narrow structures between these groups.
FX ANCHOR: One small, clearly visible [lantern/fire bowl/chimney mouth] at [position], the only local warm point source. Keep any smoke/glow/embers to be animated out of the painted image.
RESERVED BANDS: Upper [20–25]%: softly graded open sky, with no large cloud silhouettes or branches. Lower [10–15]%: low-detail open ground for a subtle fog overlay.
STYLE: Heavy oil impasto, [palette], visible directional brushwork, cinematic value grouping.
CONSTRAINTS: Environment only; no people, no party, no creatures; no text, signatures, logos or watermarks.
Exclusions: plain English in the `CONSTRAINTS` section, not an assumed special negative field: `Keep the scene unoccupied; no people or creatures are visible. The reserved sky contains no large cloud forms.`
Camera words: `wide-angle establishing view`, `low camera just beyond the threshold`, or `compressed distant ridgeline` can tune the look. Do not use `35 mm` / `24 mm` as if it enforces the location of a tree or a gate. OpenAI states camera specifications are appearance cues rather than a guarantee of physical simulation, and warns that precise layout-sensitive placement can still fail. [OpenAI image prompting](https://developers.openai.com/api/docs/guides/image-prompting) · [OpenAI image generation limitations](https://developers.openai.com/api/docs/guides/image-generation).
1.4 Midjourney — compact, weighted by priority
Midjourney’s own prompt guide favors short, clear prompts, recommends describing what you want rather than writing prose negations, and offers `--no` for actual exclusions. Use one sentence for the scene, one for the composition, and one for the style. Example:
cinematic widescreen oil-impasto environment painting, abandoned forest clearing at dusk; a massive broken gate leaf attached to the bottom-left frame edge, broad continuous silhouette; a small ember bowl in a clear middle-distance opening; distant pine ridge reduced to cool blue atmospheric haze; softly graded open sky across the upper fifth, sparse low-detail ground across the bottom tenth; heavy tactile oil brushwork, restrained amber and deep blue palette --ar 21:9 --no people, creatures, text, signatures, watermark, wire fence, fine twig lattice
Use `--ar 21:9` if that is your chosen target composition ratio; validate whether your current MJ version handles it cleanly, and inspect the final crop. For these scenes, prefer low-to-moderate stylization when the gate placement and negative-space bands are more important than ornamental invention; raise stylization only after spatial structure is correct. Do not rely on the older `object::2` weighting trick without checking version support—the current version/parameter matrix changes, and multi-prompting features are not supported uniformly across versions.
Important: `--no` does not provide regional exclusion. `--no branches` could also remove the very branch mass you want at the edge; use `--no fine twig lattice, tangled thin branches` and positively describe the single broad occluder. Current docs: [Prompt Basics](https://docs.midjourney.com/hc/en-us/articles/32023408776205-Prompt-Basics), [--no](https://docs.midjourney.com/hc/en-us/articles/32173351982093-No), [aspect ratio](https://docs.midjourney.com/hc/en-us/articles/31894244298125-Aspect-Ratio), [parameter/version list](https://docs.midjourney.com/hc/en-us/articles/32859204029709-Parameter-List).
1.5 SDXL — positive prompt + negative prompt; optional ControlNet
Positive prompt: same composition schema as GPT Image, but emphasize visually recognizable objects and simple spatial relations. A workable clause is: `large dark tree trunk cropped by the left border, foreground; open clearing with a small ember basin in the middle distance; distant low pine ridge behind the clearing, smaller and desaturated; atmospheric perspective; uncluttered upper sky band; low-detail ground at the bottom`.
Negative prompt: `people, characters, creatures, text, typography, signature, watermark, fence, wire mesh, tangled twig lattice, thin poles crossing multiple depth zones, large cloud silhouettes in upper band, painted smoke column, dense foreground clutter`.
This field is a global suppression signal; it cannot reliably mean “remove only the upper-right cloud but preserve other clouds”. Avoid negating objects required elsewhere in the image. SDXL supports text-to-image prompts and negative prompts in documented workflows. The exact accepted weights and UI behavior vary by wrapper.
Optional structural control, only if acceptable for the generation setup: a simple hand-drawn single composition guide or depth/edge control image can be fed to ControlNet while still generating one final painted plate. It is not a request for separate output layers and does not change the runtime architecture. Use simple thick silhouettes and broad value blocks; don’t make an intricate line drawing that encourages the model to reproduce thin structures. Hugging Face Diffusers documents ControlNet for both SDXL and FLUX, including Canny/depth conditioning and adjustable conditioning strength. Treat it as a stronger but additional control input, not as a substitute for testing the resulting painting. [ControlNet docs](https://huggingface.co/docs/diffusers/using-diffusers/controlnet) · [Stability AI SDXL release notes](https://platform.stability.ai/docs/release-notes).
1.6 FLUX — say what is present
For FLUX.2, write positive states rather than relying on “no X”. Example:
A deserted forest clearing, with no visible inhabitants expressed as an empty, unoccupied environment. A thick tree trunk is cropped by and physically attached to the left frame edge, forming one broad continuous near silhouette. Behind it, a clear middle-distance clearing contains a small iron ember bowl. Farther back, pine trees become smaller, cooler and softer through blue atmospheric haze. The upper fifth is a clean, softly graded dawn sky with no prominent forms; the lower tenth is open, low-detail ground suitable for drifting fog. Cinematic 21:9 environment painting, heavy oil impasto, rough bristle texture, deep umber foreground, cool blue distance, one controlled amber point source.
That phrase uses `clean, softly graded dawn sky`, `open low-detail ground`, and `unoccupied environment` rather than relying on a negative-prompt parser. If the endpoint supports a 21:9 ratio, set it as a request parameter instead of trusting prose alone. In local pipelines with FLUX ControlNet, a Canny/depth guide is available in Diffusers, but confirm checkpoint and wrapper compatibility.
Evidence: Black Forest Labs’ current FLUX.2 help note says negative prompts are not supported and recommends describing the desired state. This is explicitly about FLUX.2; do not generalize blindly to every third-party FLUX-derived workflow. [BFL FLUX.2 note](https://help.bfl.ai/articles/7734566352-does-flux-2-support-negative-prompting) · [BFL FLUX.1-dev model card](https://github.com/black-forest-labs/flux/blob/main/model_cards/FLUX.1-dev.md) · [Diffusers ControlNet](https://huggingface.co/docs/diffusers/using-diffusers/controlnet).
2. Reusable scene-brief template
Fill this out before writing the final prompt. The template makes image-space requirements explicit without asking the generator to produce layers.
SCENE ID / PURPOSE
- Name:
- Narrative beat (one sentence):
- Intended emotional read:

FRAME
- Target crop: 21:9 composition (review against actual production raster; see ratio note above)
- Camera position / view: [low / eye-level / elevated; looking toward ...]
- Focal area: [central / left third / right third]
- Focal area must remain unobstructed by: [list]

NEAR PLANE (fast parallax / optional hand-cut occluder)
- One edge-anchored mass: [gate leaf / trunk / rock ledge / overhanging bough mass]
- Frame edge: [left / right / bottom-left / bottom-right / top corner]
- Silhouette: [broad / continuous / solid / few large gaps]
- Approximate frame footprint: [e.g. leftmost 12–20%; bottom 8–15%]
- Keep it at one apparent depth? [yes, preferred]
- Prohibited fine structure: [wire lattice / thin poles / tangled twigs]

FOCAL / MIDDLE-DISTANCE PLANE
- Main environmental subject: [clearing / gate / ruins / bridge / camp remains]
- Primary readable shape: [one sentence]
- Details that must remain clear at gameplay scale: [list]
- Clear region around focal feature: [e.g. 15% margin on each side]

FAR PLANE
- Distant mass: [ridge / treeline / cliffs / ruined skyline]
- Scale cue: [smaller, lower contrast, overlapping layers]
- Atmospheric treatment: [cooler, lighter, softer, less saturated]
- Keep distant silhouettes away from reserved sky band? [yes/no]

FX ANCHOR(S) — SOURCE ONLY
- Runtime FX planned: [fire flicker / glow / embers / smoke / dust / low fog]
- Painted source object: [fire bowl / visible lantern / chimney mouth / brazier]
- Image position in fractions: [x 0–1, y 0–1]
- Visible anchor property: [warm glass pane / dark chimney opening / ember bed / fire bowl]
- What must NOT be painted because runtime supplies it: [smoke column / large glow / rolling fog / cloud movement]
- Anchor clear of ambiguous overlaps? [yes/no]

RESERVED OVERLAY BANDS
- Sky: [top y-range as percentage; e.g. 0–22%]
- Sky surface: [subtle painted gradient / distant haze only / no large cloud silhouettes]
- Ground: [bottom y-range; e.g. 88–100%]
- Ground surface: [low-frequency brushwork / sparse grass / no large foreground props]
- Overlay type: [clouds / cloud-shadow / birds / fog veil / ground fog]
- Contrast budget: [low]; keep foreground silhouettes out of it? [yes/no]

STYLE LOCK
- Medium: heavy oil impasto, tactile bristle texture
- Palette: [3–5 colors]
- Lighting / time: [dawn / dusk / overcast / night]
- Value hierarchy: [near darkest; focal clearest; distance softest]
- Texture allowed to be intricate in: [focal island only]
- Texture must remain broad/simple in: [depth boundaries / reserved bands]

EXCLUSIONS
- Always: no people, no player party, no creatures, no text, no signatures, no logos, no watermark
- Scene-specific: [list]
- Global negative prompt supported by chosen model? [yes/no; endpoint]

ACCEPTANCE TEST
- Occluder touches frame edge and has a readable solid silhouette: [pass/fail]
- Three depth groups clearly distinguishable: [pass/fail]
- A visible source exists for each planned FX: [pass/fail]
- Reserved overlay bands are actually usable: [pass/fail]
- No thin high-contrast element crosses a sharp depth boundary: [pass/fail]
- Correct crop and style: [pass/fail]
Starting proportions are heuristics, not universal standards: edge occluder ~10–20% of width/height; focal opening ~35–60% of frame width; reserved sky ~15–25% of height when the scene permits; lower reserved ground ~8–15% when low fog is needed. Adjust to the scene and validate with the final crop.
3. Clause library
The variants below are written to be pasted into the generator-specific prompt body. They are controlled-language building blocks, not independent magic phrases. Avoid using every clause at once: pick one clause per design goal and keep the overall hierarchy simple.
A. Edge-anchored foreground occluder
Core clause:
`The bottom-left corner is framed by one large [object], cropped by the image border and physically continuing beyond the frame. Its silhouette is broad, continuous and easy to read; it occupies only the near edge and does not cross the central focal opening.`
Positive alternatives by model
- Gemini/Nano Banana: `A massive, weathered gate leaf enters from the right border and is cropped by the frame, forming a single clear dark foreground silhouette. The open central view remains unobstructed.`
- Imagen: `At the far-left edge, a thick, solid trunk is cropped by the border; broad silhouette; no fine branch lattice around it.` Use a separately supplied negative prompt for `wire mesh, thin twigs, fence` if appropriate.
- GPT Image: `COMPOSITION: One thick, edge-attached trunk occupies the leftmost 15% of the frame, cropped by the border. Keep its outline continuous and separate from the middle-distance trees.`
- Midjourney: `one massive tree trunk cropped by the left frame edge, broad dark silhouette, central clearing kept open` plus `--no wire fence, thin twig lattice`.
- SDXL: `large dark gate leaf flush with and cropped by right border, solid simple silhouette, foreground only`; negative: `thin fence, wire mesh, twig lattice`.
- FLUX.2: `one broad gate leaf enters from the right edge and continues beyond the frame; the central viewing corridor stays open; its contour is solid and simple`.
Avoid: `foreground branches`, `framing trees`, `rich foliage frame`, `delicate branches reaching across the scene`. These can encourage several crossing filaments instead of one cuttable mass. [ENGINEERING-INFERENCE]
B. Three readable depth groups
Core clause:
`Near: [large, dark, cropped mass]. Middle distance: [one clear focal feature] in an open pocket of space. Far: [smaller, cooler, lower-contrast masses] softened by atmospheric perspective. Clear overlap between the groups; no narrow structure weaves repeatedly between them.`
Strong cues
- Scale: `the far ridge is much smaller in apparent scale than the near trunk`.
- Occlusion: `the near rock lip overlaps the ground behind it; the distant ridge sits behind the tree line`.
- Contrast: `near mass darkest; focal area highest local clarity; background lowest contrast`.
- Atmosphere: `distant trees shift cooler and lighter, with softened edges and less detail`.
- Spacing: `leave a visible patch of open ground between the foreground silhouette and the focal feature`.
By model
- Gemini: use visible subject + setting + wide shot + named `foreground / middle distance / background` clauses.
- Imagen: separate near/middle/far into three short statements; use its global negative prompt only for unwanted structural classes.
- GPT Image: use the labeled `DEPTH READ` section; state relative size and overlap, not just `deep perspective`.
- Midjourney: keep to one short semicolon-separated composition phrase; too many detailed instructions can dilute the main subject.
- SDXL: name concrete objects and relationships, then reinforce with a layout/edge control map if acceptable.
- FLUX.2: state the scene positively and use distinct sentences for near, middle and far masses.
C. FX-anchor source (paint the object, not the effect)
Core clause:
`A single, small [lantern/fire bowl/brazier/chimney mouth] is plainly visible at [position]. It has a clean silhouette and a localized warm source point. Keep its surroundings readable so runtime glow/embers/smoke can be anchored precisely.`
Specific forms
- Lantern glow: `one small lantern with a visible warm amber pane attached to the left gatepost; the pane itself is the only warm point source`.
- Fire flicker / embers: `a compact stone fire bowl with a clearly visible dark rim and a few ember-red points; no large painted flame shape or smoke plume`.
- Chimney smoke: `a single dark chimney mouth on the roofline, clearly separated from the sky; no smoke is painted above it`.
- Window glow: `one small square window with warm light inside a dark wall, distinct from the ambient sky`.
Rule: source object should survive downscaling and remain identifiable at target gameplay scale. Tiny ambiguous orange marks on a busy background are poor anchors. [ENGINEERING-INFERENCE]
D. Reserve the sky band for cloud / bird overlays
Core clause:
`The upper [15–25]% of the image is an uninterrupted, low-detail sky band: a softly graded [palette] with subtle painterly variation and faint haze only at the distant horizon. Keep large cloud silhouettes, branches, roof peaks, smoke and birds outside this band.`
Model translation
- Gemini: `a wide clean sky occupies the upper fifth, with a soft dawn gradient and distant haze only near the horizon`.
- Imagen: positive clause plus negative field `large cloud masses, branches touching top edge, smoke plume, birds`—but do not globally negate `clouds` if some distant clouds are desired outside the band.
- GPT Image: put it in `RESERVED BANDS`; state what the band should look like, then exclusion list.
- Midjourney: `uninterrupted softly graded upper sky, distant haze at horizon only` plus `--no large cloud bank, branch silhouettes across sky, birds`.
- SDXL: positive sky-band clause; negative prompt for cloud/branch silhouettes in general is global and can suppress other wanted clouds elsewhere.
- FLUX.2: `the upper fifth remains open and softly graded, its surface free of prominent silhouettes; only faint horizon haze`.
Visual finish: include broad color modulation, a few low-amplitude brush strokes, and a value gradient. Do not request a sterile flat fill unless the art direction truly needs it.
E. Reserve low ground for drifting fog
Core clause:
`The bottom [8–15]% is low-detail ground with broad, horizontal painterly strokes and gentle value changes. No large props, high-contrast grass clumps or thin vertical stems enter this strip; it remains visually continuous for a drifting fog veil.`
Important: if the overlay is fog, a little painted atmospheric softness below the band may make the transition feel integrated; do not paint a second detailed fog bank within the actual scrolling strip. The fixed background should still make sense when the fog asset is absent.
F. Atmospheric perspective that helps, not harms
Use: `far trees are smaller, cooler, lighter and less detailed; their edges soften into blue-gray haze`.
Avoid: `everything is dreamy, blurry, atmospheric`. Global blur can destroy the sharp silhouette needed by the occluder and the crisp anchor needed by the FX.
Prompt atmospheric perspective in the far plane, not indiscriminately on the whole image.
G. Style lock: heavy oil impasto without clutter
`Heavy oil-impasto environment painting, visible loaded-bristle strokes, broad painterly value masses, rugged tactile surface, selective high-frequency detail around the focal feature only. Preserve a clean outer silhouette on the foreground occluder and broad low-frequency brushwork in the reserved bands.`
This phrasing intentionally separates painterly texture from silhouette complexity. “Highly detailed everywhere” is a poor fit for depth-map parallax and overlay bands.
H. Negative-prompt language by actual mechanism
Mechanism
Use
Example
Imagen `negative_prompt`
Comma-separated unwanted concepts; do not write instructions as sentences.
`people, creatures, typography, watermark, wire fence, twig lattice, large smoke plume`
Midjourney `--no`
End-of-prompt parameter, list concrete unwanted concepts.
`--no people, creatures, text, watermark, wire mesh, tangled twigs`
SDXL `negative_prompt`
Global suppression, endpoint/wrapper syntax applies.
`people, text, signature, fence, wire mesh, thin poles, large clouds across reserved sky`
GPT Image / conversational Gemini
Plain language constraints, no universal separate negative parser assumed.
`The image is an unoccupied environment. No people or creatures are visible; the sky band has no prominent cloud silhouettes.`
FLUX.2
Positive alternative is the preferred form in official guidance.
`deserted clearing; open, uncluttered sky; broad simple foreground silhouette; smooth low-detail ground`
Do not carry one negative prompt unchanged across models. In some systems, exclusion syntax is a real input parameter; in others it is ordinary text that may still activate the concept. In every system, global negation is a poor tool for suppressing an object in just one small region.
4. What survives a depth-map parallax treatment—and why
4.1 Multiplane-camera lesson translated to one raster
Disney’s multiplane camera created an illusion of depth from painted layers at different distances. Your fixed pipeline is not a multiplane camera: it starts from one flattened painting and infers depth per pixel. The transferable lesson is clear depth ordering and large, readable shapes; the non-transferable assumption is that a painted object automatically becomes a coherent rigid layer. [D23’s multiplane camera history](https://d23.com/a-to-z/multiplane-camera/).
Depth-image-based animation research likewise documents holes and visible artifacts when image content is displaced and previously hidden surfaces become exposed; a single still does not contain all the unseen pixels required for arbitrary camera movement. The CVPR 2023 paper 3D Cinemagraphy From a Single Image explicitly treats hole emergence as a central problem in animating one image. [Paper](https://openaccess.thecvf.com/content/CVPR2023/html/Li_3D_Cinemagraphy_From_a_Single_Image_CVPR_2023_paper.html).
Feature survival matrix
Visual feature
Expected survival under mild in-place depth deformation
Prompt consequence
Evidence status
Large contiguous rock, trunk, gate leaf, ruined wall
High relative to fine structures, if mostly on one depth plateau
Prefer one broad silhouette; keep it edge-anchored and visually continuous.
[PIPELINE-OBSERVATION + ENGINEERING-INFERENCE]
Three separated value/scale groups
High; they give the depth estimator a plausible ordering
Use near dark mass, clear focal middle distance, low-contrast far masses.
[ENGINEERING-INFERENCE]
Atmospheric perspective in distant plane
Usually robust visually because small depth errors are masked by low contrast/soft edges
Put softness and low detail in the far plane only; preserve the focal edges.
[ENGINEERING-INFERENCE]
Diffuse textures / broad brushwork
Less likely to reveal local shear than thin high-contrast lines
Use broad impasto in band and boundary regions.
[ENGINEERING-INFERENCE]
Thin poles, railings, fence lattices, chains, twig networks
High risk: each narrow element can overlap pixels assigned to different depths; warping exposes cracks/smears
Do not make these cross near/middle/far transitions. Prefer a thick post or solid gate panel.
[PIPELINE-OBSERVATION]
Tall object that crosses a sharp depth edge
High risk, specifically observed in the user’s stack
Keep a tall occluder mostly within one depth region, or make it an optional hand-cut foreground occluder rather than relying on baked depth.
[PIPELINE-OBSERVATION]
Fine foliage against sky
High risk visually: many tiny depth boundaries create a jagged moving contour
Use a few large leaf/branch masses, not a lacy canopy against overlay sky.
[ENGINEERING-INFERENCE]
Smoke, mist, flame and cloud detail painted as texture
Can double with procedural/scrolling assets and create apparent frozen motion
Paint only the emitting/receiving source; reserve the effect to the runtime layer.
[FIXED-PIPELINE RULE]
Soft horizon and distant cloud haze
Often tolerant if overlay bands are kept distinct
Keep painted haze near horizon; reserve a defined upper band for moving cloud assets.
[ENGINEERING-INFERENCE]
Repeated thin fences or roots crossing ground-fog band
Adds clutter behind fog and causes depth boundary noise
Keep bottom band low-frequency and horizontal.
[ENGINEERING-INFERENCE]
4.2 What to ask the model to draw
Use these phrases:
- `one broad continuous silhouette, mostly contained within the leftmost edge region`;
- `separate masses with visible open ground between them`;
- `far treeline broken into a few large groups, not a dense mesh of branches`;
- `distant forms smaller, cooler, lighter and less detailed`;
- `the foreground trunk stays on the left side and does not cross the focal clearing`;
- `simple horizontal terrain bands with no thin poles or fence lines crossing them`.
Do not ask for:
- `several layers of trees and branches crossing each other everywhere`;
- `intricate lattice fence in the foreground`;
- `wispy twigs silhouetted all over the sky`;
- `lots of parallax depth` without giving the model visible evidence of near/middle/far;
- `separate foreground, midground and background layers` if interpreted as an output segmentation request. Describe one coherent finished painting instead.
4.3 Do not overclaim on Depth Anything V2
The Depth Anything V2 paper reports stronger, more robust monocular depth prediction than its predecessor and discusses challenges in evaluation, including thin structures and benchmark limitations. It does not promise perfect depth boundaries for every painterly fantasy scene. A depth predictor outputs an estimated depth field, not semantic object masks or a physically complete 3D scene. [Depth Anything V2 paper](https://arxiv.org/abs/2406.09414).
For this workflow, design the image to be easy to infer rather than expecting the estimator to resolve ambiguous fine geometry. A thick trunk is a robust visual cue; a tangle of fifty branches against fog is not.
5. Spatial instructions, negation and the “named placement” hypothesis
5.1 What the evidence says
- [BENCHMARK-VERIFIED] T2I-CompBench introduced a 6,000-prompt benchmark over attributes, object relationships, spatial relations and complex composition, reflecting known compositional failures. [NeurIPS paper](https://proceedings.neurips.cc/paper_files/paper/2023/hash/f8ad010cdd9143dbb0e9308c093aff24-Abstract.html).
- [BENCHMARK-VERIFIED] T2I-CompBench++ expanded evaluation to 8,000 prompts including 3D-spatial relations and complex composition, and evaluated several model families including FLUX.1 and SDXL. High image quality is not equivalent to reliably honoring all object relationships. [IEEE paper](https://ieeexplore.ieee.org/abstract/document/10847875/).
- [BENCHMARK-VERIFIED] Relations, Negations, and Numbers tested DALL·E 3 with human judgments (N=178) and found none of the tested logical probes reliably reached 50% human agreement; negation and numbers above three failed especially often. That result concerns the model and task tested, not all current image models. [Paper](https://arxiv.org/abs/2411.17066).
- [BENCHMARK-VERIFIED] ICLR 2026’s SpatialGenEval covers 1,230 information-dense prompts across 25 scene types and ten spatial subdomains; its authors report higher-order spatial reasoning remains a major bottleneck across 23 models. [ICLR 2026 paper](https://proceedings.iclr.cc/paper_files/paper/2026/hash/4a5c76c63f83ea45fb136d62db6c7104-Abstract-Conference.html).
- [BENCHMARK-VERIFIED] The 2026 FoR-T2I paper isolates a subtle but important issue: instructions expressed through an object’s own left/right/front/back frame are much harder than equivalent instructions in camera/image coordinates. Across 22 models, average accuracy was 41.8% lower for object-relative frame-of-reference prompts than for matched camera-view prompts; the best model achieved only 44.3% accuracy on the former. For this pipeline, say `on the left side of the image` or `cropped by the right frame edge`, not merely `to the gate’s left` or `behind the object` when ambiguity matters. [FoR-T2I paper](https://arxiv.org/abs/2608.03357).
- [PRIMARY-VERIFIED] Official provider guides recommend specific compositions, visible details, framing and relative scale; this is useful practical instruction, not proof of guaranteed compliance. OpenAI explicitly warns that precise layout-sensitive positioning may still fail. [OpenAI guide](https://developers.openai.com/api/docs/guides/image-prompting).
5.2 Hypothesis result: “named placement beats abstract depth”
Verdict: operationally plausible, not established as a universal fact. The cited papers establish that spatial relations are difficult; they do not provide an A/B test of these exact phrases (“bottom-left corner frames the view with…”, “middle distance cleared of clutter”) against the standalone word “depth” for every current generator. Treat it as a controlled prompt experiment.
Why concrete clauses are a sensible bet [ENGINEERING-INFERENCE]: they translate a vague latent concept into recognizable objects, image-space locations, relative sizes, and overlaps. “Deep cinematic depth” is semantically broad; “one trunk cropped by the left border, a clear clearing behind it, and a distant smaller blue ridge” provides observable criteria the reviewer can check.
What to trust most, in descending order:
Hard generation controls, when available: requested ratio, actual canvas, and a simple ControlNet layout cue in a local compatible workflow.
Named object + image-space location + relation: `gate leaf cropped by the right edge; focal clearing remains left of it`.
Relative scale and overlap: `the distant ridge is smaller and lies behind the treeline`.
Value / contrast separation: `foreground darkest, focal opening clearest, distance softer`.
Atmospheric/camera language: `wide establishing view`, `atmospheric perspective`, `wide-angle lens look`.
Abstract labels only: `depth`, `layered`, `cinematic composition`.
This hierarchy is a production hypothesis—not a published ranking across all six model families. Camera language is particularly good for aesthetic intent but is not a dependable substitute for object placement.
5.4 Community tests: useful signals, not authority
- [ANECDOTAL / MEASURED BY THE POSTER] A January 2026 r/StableDiffusion post reports a 60-output prompt-adherence comparison across Z Image, FLUX variants and Qwen models, with common settings within the poster’s setup and a 1–5 subjective score per image. The poster ranks FLUX.2 dev highest in that particular exercise (51/60). This is not peer reviewed, the scoring rubric is subjective, and it does not directly isolate environment-art edge occluders, reserved sky bands, or depth-map deformation. Use it as a reason to include FLUX.2 in your own pilot—not as a claim that it is the winner for this pipeline. [Community post](https://www.reddit.com/r/StableDiffusion/comments/1qqv3px/advanced_prompt_adherence_z_images_v_fluxes_v/).
- [ANECDOTAL / WORKFLOW-SPECIFIC] Older FLUX community posts report ways to route a “negative” conditioning input through particular ComfyUI/CFG workflows, but users disagree about behavior, quality and speed. These reports concern specific checkpoints and custom node graphs, and are not in conflict with the narrower official statement that FLUX.2’s supported prompting interface does not accept negative prompts as a model feature. For a production prompt library, use the native endpoint’s documented interface; record any wrapper-specific experiment as a separate adapter. [Example discussion](https://www.reddit.com/r/FluxAI/comments/1ekjomu/alternate_negative_prompt_workflow/).
The right role for community measurements is hypothesis generation: they suggest which model or syntax deserves a local test. They cannot prove behavior for a particular current version or for an unseen prompt.
5.3 More robust phrasing patterns
Instead of: `Create strong depth.`
Use: `A large dark trunk is cropped by the left edge. A small fire bowl sits in a clear middle-distance pocket. The distant ridge is smaller, cooler, lighter and less detailed.`
Instead of: `Leave empty space.`
Use: `The upper fifth is a continuous softly graded sky with low-frequency brushwork; no high-contrast silhouette enters this band.`
Instead of: `No clutter in the middle.`
Use: `Between the edge trunk and the far treeline, preserve one uninterrupted patch of ground around the small fire bowl.`
Instead of: `No smoke.`
Use in a text-only model: `A dark chimney mouth is clearly visible; the air above it is clean and smoke-free.`
Use in FLUX.2: `A dark chimney mouth is clearly visible beneath a clean sky; the smoke animation will originate at the chimney mouth.`
Instead of: `The gate must be separate.`
Use: `One broad gate leaf is cropped by the right border and has a clean, continuous outer contour against the lighter sky; it does not cross the central focal opening.`
6. What not to paint in procedural overlay regions
Sky
If clouds will scroll as asset sprites, avoid baking large, recognizable cloud shapes in the exact band where they will move. A fixed cloud plus a moving cloud can read as duplicated weather, and multiply cloud shadows may fight the painted sky’s value pattern.
Paint instead: a restrained sky gradient, a few broad strokes, a subtle color shift toward the horizon, and optionally very faint stationary haze outside the active cloud band. Preserve a clear value range so white or gray cloud sprites remain visible.
Ground
If low fog drifts along the lower band, don’t fill that strip with bright grass spikes, tiny flowers, fence pickets, scattered stones, or crisp roots. These can create a visual comb through the fog and add thin depth boundaries.
Paint instead: broad horizontal strokes, soft terrain value changes, scattered low-frequency color accents, and clear continuity across the strip. Place major rocks/logs above or behind the band rather than centered inside the most active overlay area.
Smoke and chimney
Paint the chimney opening, stove, campfire bowl, scorched stones, or ember bed. Do not paint a large plume that the runtime then reproduces again. A little static soot around the chimney mouth is fine if it does not visually imply a second moving smoke effect.
Firelight and glow
Paint a visible light source—lantern glass, a compact fire bowl, or a brazier. Avoid baking an enormous bloom halo that will be doubled by procedural flicker. If the light’s main purpose is to anchor runtime glow, it must remain identifiable even with glow turned off.
Birds and cloud-shadow
Keep the actual bird/cloud-shadow sprites off the image; reserve a legible value band for them. Avoid tall branches touching the top edge when a bird strip must scroll across that same height. Where the scene calls for canopy, reserve a different band or omit that overlay type for that scene.
Avoid the “unfinished background” look
A reserved band should read as deliberate atmospheric simplification, not an empty placeholder. Use (1) a clear gradient, (2) broad brush rhythm consistent with the impasto, (3) a controlled value transition near the horizon, and (4) no hard isolated silhouettes. The image should still look like a complete painting if every overlay is temporarily disabled.
7. Failure mode → cause → fix
Failure
Likely cause
Prompt-level fix
Acceptance test
Occluder not touching image border
It was described as “foreground” but not explicitly cropped/attached to an edge
`cropped by and physically continuing beyond the left frame edge`
Can the silhouette be cut by following the image boundary with no invented missing gap?
Occluder becomes a thin branch lattice
Model interprets “framing branches” decoratively
Ask for `one broad bough mass` or `one thick trunk`; exclude `fine twig lattice` with the appropriate model mechanism
From thumbnail size, does it read as one mass rather than dozens of lines?
Gate/trunk smears in parallax
Thin/tall silhouette crosses a large depth transition
Keep it mostly on one depth plateau; prefer broad surface; if necessary use the already-available hand-cut occluder path
In a mild parallax preview, does its contour remain coherent?
Focal zone overgrown by clutter
Multiple equally weighted subjects, or vague “dense forest”
Identify one focal feature and define a clear pocket around it
Is the focal feature readable at final gameplay size?
Three planes collapse into one texture field
“Depth” or “layered” without explicit size, overlap and contrast cues
Name near/middle/far features and describe their scale and contrast
Can a reviewer point to one near, one middle and one far group immediately?
No light source for FX
Prompt asks for mood/glow but not an actual lamp/fire/chimney
Name one physical anchor and its position and visible attribute
Can runtime FX coordinates be placed on a clear painted object?
Smoke baked into image competes with animated smoke
Model interprets “smoldering camp” as a painted plume
Request source-only: `chimney mouth visible; air above it clear` or `ember bowl, no plume`
Turning off FX leaves no frozen plume; turning them on does not double it.
Painted clouds collide with scrolling clouds
Band is filled with high-contrast static cloud shapes
Reserve an uninterrupted upper band; move any static haze toward the horizon
Can a cloud sprite scroll across the band without looking pasted over a duplicate cloud?
Fog overlay hidden by ground detail
Lower band contains grass, roots and small props with high contrast
`low-detail open ground, broad horizontal strokes, no thin vertical stems`
Fog strip has enough calm value area to be visible.
“No people” still yields silhouettes
Natural-language negation is weak or model/version differs
Imagen/SDXL/MJ: use the relevant exclusion mechanism; GPT/Gemini: positive `unoccupied deserted environment` plus explicit constraint; FLUX.2: positive empty-state wording
Check all four corners and the far horizon, not only focal zone.
Reserved space looks blank/unpainted
“empty sky” interpreted as flat void
Add a gradient, subtle impasto and faint horizon haze; reserve detail rather than all texture
Image still feels finished with overlays disabled.
Target crop cuts the occluder or changes the band proportions
The nominal 21:9 wording differs from the exported raster/crop
Review composition in the actual final aspect ratio before approval
The edge anchor and band heights still have useful footprints in the production crop.
Model obeys style but ignores spatial structure
Prompt is dominated by mood/style or has too many equally important details
Move composition to the first paragraph; reduce competing objects; split into labeled fields where supported
Among the 4–8 candidates, at least one meets the spatial acceptance criteria, not just style quality.
Focal and background get equally sharp/detail-heavy
`highly detailed` applies globally
Restrict fine detail to focal region; distant forms smaller and lower contrast; bands low-frequency
Focal hierarchy still reads when thumbnail-sized.
Clouds/birds clip through occluder
Overlay band was not kept clean around high-contrast branches/architecture
Reserve a slightly narrower band or move the occluder below/aside from it
No fast overlay crosses a complex fixed silhouette unless this overlap is deliberate.
8. Pre-generation checklist (12 checks; binary plus scores)
Score each prompt before sending (0 = absent/contradictory, 1 = mentioned but vague, 2 = explicit and testable). Total possible: 24. After generation, repeat the check on the image itself—prompt presence is not image success.
#
Check
Good snippet
Bad snippet
1
Edge-attached occluder is specified by frame edge and crop
`A thick gate leaf is cropped by the right border and continues beyond the frame.`
`Some foreground branches frame the scene.`
2
Occluder has a broad, single-depth silhouette
`One solid trunk mass with a continuous contour, confined to the left edge.`
`Intricate, delicate branches criss-crossing the whole foreground.`
3
Near plane is visually differentiated
`Near mass is largest and darkest, occupying the leftmost 15%.`
`Lots of foreground detail.`
4
Middle-distance focal opening is identified
`A clear central pocket of ground around the small fire bowl.`
`The forest is dense everywhere.`
5
Far plane has explicit scale/contrast cues
`Distant ridge is smaller, cooler, lighter and softer than the focal area.`
`Beautiful deep background.`
6
No thin objects cross depth transitions
`No rails, fine poles or twig lattice between near and far groups.`
`A detailed fence extends from the camera to the distant gate.`
7
At least one real FX anchor is named and located
`A small lantern with a visible amber pane on the right gatepost.`
`Warm magical glow in the scene.`
8
Prompt requests the source, not the moving effect
`Dark chimney mouth clearly visible; the air above it stays clear for runtime smoke.`
`Thick smoke swirls across the whole sky.`
9
Sky band has a defined range and surface
`Upper 20%: uninterrupted, softly graded sky; faint horizon haze only.`
`A dramatic sky with elaborate clouds everywhere.`
10
Ground band has a defined range and surface
`Bottom 10%: low-detail horizontal ground strokes suitable for fog.`
`Dense grass, roots, stones, flowers and fence pickets across the bottom.`
11
Positive/negative syntax matches the actual generator
`FLUX.2: “open uncluttered sky”; Imagen: separate `negative_prompt` concepts.`
Sending the same `--no` / `negative_prompt` text to every provider and assuming identical behavior.
12
Final style/crop constraints are explicit and not overstuffed
`Heavy oil impasto, controlled palette, no people/text/watermark; review in the final crop.`
`Epic, cinematic, hyper-detailed, ultra-realistic, magical, beautiful, lots of depth, everything visible.`
Pre-generation stop rule [ENGINEERING-INFERENCE]: don’t spend one of the 4–8 candidates if checks 1, 4, 7 or 9/10 score 0. Those are key pipeline dependencies: foreground silhouette, focal opening, FX source and overlay reserve.
A compact image-review scorecard
When reviewing each candidate, record:
- Occluder, 0–3: 0 absent; 1 present but floating/thin; 2 edge-attached but busy; 3 edge-attached and clean.
- Depth planes, 0–3: count how many planes are individually readable at thumbnail size.
- Anchor, 0–2: 0 absent/ambiguous; 1 present but hard to locate; 2 unmistakable source.
- Overlay bands, 0–4: sky 0–2 + ground 0–2.
- Parallax risk, 0–4 (reverse risk): 0 many thin cross-depth elements; 2 moderate; 4 broad masses and calm boundaries.
- Exclusions/style, 0–4: unoccupied/no text; painterly lock; palette/value hierarchy; target crop all valid.
Suggested approval threshold: ≥15/20, with no zero on occluder, anchor or overlay band. This threshold is a proposed local rubric—not an externally validated standard. A beautiful picture that fails the anchor/band/depth tests is not a good plate for this stack.
9. Three worked scene briefs and full prompts
All prompts are in English. Each scene is a single finished painting; none asks for separate layers or a depth map. The source objects are painted while runtime smoke/glow/fog/cloud movement is left to the existing pipeline.
Example 1 — Forest ambush site
Brief
- Beat: A forest clearing where a hurried camp was abandoned shortly before dusk; evidence of danger, but no visible people or creatures.
- Near plane: One heavy broken gate-like timber or tree trunk anchored to the bottom-left edge; broad silhouette, no twig lattice.
- Focal plane: Compact fire bowl / ember bed and a torn, low tent shape, separated by open ground. Keep the bowl visible for flicker/glow.
- Far plane: A few large pine groups and a low ridge, smaller, cooler and softened by atmosphere.
- FX anchor: One compact ember bowl with a visible rim and a few ember points. No painted smoke column.
- Bands: Upper 18–22% is quiet dusk sky; lower 8–12% is low-detail ground for fog drift.
- Palette: Soot blue, deep pine green, burnt umber, restrained ember amber.
- Risk to avoid: dense trees from top to bottom; tiny branches crossing the sky; tent guy-lines and stakes running through several depth values.
Full prompt — GPT Image / Gemini natural-language format
A cinematic, wide establishing view of an abandoned forest ambush site at blue-hour dusk, painted as a single finished environment image in heavy oil impasto. The scene feels recently disturbed and watchful, but entirely unoccupied.

COMPOSITION: In the bottom-left corner, one massive broken timber or fallen trunk is cropped by the frame edge and continues beyond it, forming a broad, continuous, dark foreground silhouette. Keep this near object confined to the left edge; it must not cross the central viewing opening. In the middle distance, an open patch of damp earth surrounds a small iron fire bowl with a clearly visible rim and a few faint ember-red points. A collapsed, low canvas shelter sits farther to the right of the bowl, with no thin guy-lines crossing the scene. In the far distance, a few large pine-tree masses and a low ridge become smaller, cooler, lighter and less detailed through blue atmospheric haze.

DEPTH READ: Three clear visual groups: a large near silhouette; a readable middle-distance clearing with the bowl and shelter; a distant, softly simplified treeline and ridge. Leave open ground between the trunk and the focal clearing. Avoid delicate fences, narrow poles, hanging wires and tangled twig lattices.

FX SOURCE: The small ember bowl is the only localized warm point in the clearing and remains clearly identifiable at thumbnail scale. Do not paint a smoke plume, rolling fog bank, drifting embers or a large glow halo; those effects will be animated at runtime from the bowl.

RESERVED BANDS: The upper 20% is a continuous softly graded dusk sky, blue-violet with subtle painterly variation and only faint haze near the horizon. Keep large cloud silhouettes, birds and branches out of this band. The bottom 10% is low-detail ground made of broad horizontal impasto strokes, with no high-contrast grass spikes or narrow roots, suitable for a drifting ground-fog overlay.

STYLE: Rugged oil painting with thick loaded-bristle texture, broad readable value masses, restrained soot-blue, deep pine green, burnt umber and ember amber. The focal clearing is the clearest area; the far trees are softer and lower contrast. The painting must feel complete with all animation overlays disabled.

CONSTRAINTS: No people, no player party, no humanoids, no animals or creatures. No text, lettering, signatures, logos or watermarks. One single coherent painting, not a collage or a set of layers.
Imagen negative prompt, if supported
`people, humanoids, animals, creatures, text, lettering, signature, logo, watermark, wire fence, fine twig lattice, thin poles crossing the scene, large painted smoke plume, large cloud silhouettes across the upper band, high-contrast grass spikes in the bottom band`
Midjourney concise variant
abandoned forest ambush clearing at blue-hour dusk, one massive broken timber cropped by the bottom-left frame edge, broad continuous dark silhouette; clear middle-distance patch of damp earth around a small iron ember bowl with visible rim, low collapsed canvas shelter to the right; distant pine masses and low ridge smaller, cooler and softer in blue haze; uninterrupted softly graded sky in upper fifth, low-detail horizontal ground in bottom tenth; rugged heavy oil impasto, soot blue, pine green, burnt umber, restrained ember amber --ar 21:9 --no people, animals, creatures, text, watermark, wire fence, thin poles, twig lattice, painted smoke plume
Candidate rejection triggers
Reject if the foreground object becomes an intricate branch network, the ember bowl is obscured, painted smoke is already present, the tent’s strings dominate, or the “reserved” sky is filled with high-contrast pine tips.
Example 2 — Departure threshold at dawn
Brief
- Beat: The threshold from safety into an unknown journey; the village is behind the viewer and should not be visible in the frame.
- Near plane: A large, weathered open timber gate leaf attached to the right edge; readable silhouette; no complicated picket grid crossing the sky.
- Focal plane: Clear path leaving through the threshold into open land. A small hanging lantern remains visible on a gatepost as a warm FX anchor.
- Far plane: Low hills and a distant valley, golden-lit but desaturated by atmospheric perspective.
- FX anchor: Small lantern with visible amber glass, not an enormous light bloom.
- Bands: Top 20–25% open dawn sky; bottom 10% low-detail path/grass for ground fog if used.
- Palette: Pale gold, cool mist blue, old wood umber, muted sage.
- Risk to avoid: village rooftops or buildings behind the gate, a centered heroic character, fence bars spanning the entire frame, a busy path full of objects.
Full prompt — GPT Image / Gemini natural-language format
A cinematic dawn landscape at the threshold of departure, seen from just outside an old settlement and looking outward into a vast, unfamiliar country. The village is behind the camera and is not visible anywhere in frame: no roofs, houses, walls or village silhouettes in the distance. This is a single finished environment painting with no people.

COMPOSITION: A weathered open timber gate occupies the right foreground. One broad gate leaf is cropped by and physically continues beyond the right image edge, making a clean, dark, edge-anchored silhouette. Its main outline is simple and mostly stays on one apparent depth plane. The central and left-center viewing corridor remains open. A narrow grassy path begins beyond the threshold and leads through an open meadow toward a distant valley; keep the path free of clutter and readable as one broad directional shape. A small lantern hangs from the gatepost near the right edge. Its amber glass is plainly visible as a compact point of warm light.

DEPTH READ: Near: the dark gate and gatepost. Middle distance: open path and meadow with a few broad patches of grass. Far: low rolling hills and a distant valley, smaller, cooler and lower contrast under the dawn haze. The distant land is visible beyond the gate; the settlement itself is always behind the viewer.

FX SOURCE: The lantern is a discrete source for subtle runtime flicker and glow. Do not paint a large halo, sparks, smoke or drifting fog. Keep the lantern separate from the gate silhouette enough that its warm glass remains visible.

RESERVED BANDS: The upper 22% is open dawn sky, pale warm gold fading to cool blue, with subtle oil-paint variation and faint haze only near the horizon. No large clouds, birds, rooflines or branch silhouettes in this band. The bottom 10% is low-detail grass and path with broad horizontal brushstrokes; no tall stalks, fence pickets or sharp small props, allowing low fog to drift across it.

STYLE: Majestic but restrained, heavy oil impasto with tactile bristle texture, pale gold, cool mist blue, weathered umber and muted sage. Use broad shapes and atmospheric perspective rather than excessive micro-detail. The path and horizon remain visually legible; the gate provides the near/far contrast.

CONSTRAINTS: No people, no heroes, no party, no animals or creatures. No visible village or rooftops. No text, lettering, signature, logo or watermark. One coherent painting, not separate layers.
Imagen negative prompt, if supported
`people, heroes, party, animals, creatures, houses, village rooftops, distant settlement, text, lettering, signature, logo, watermark, fence spanning the full frame, wire mesh, thin pickets across sky, large cloud silhouettes across upper band, large lantern bloom`
Midjourney concise variant
cinematic dawn departure threshold, view from just outside an old settlement looking outward; village remains behind the camera and completely out of frame; one broad weathered timber gate leaf cropped by the right border, clean dark silhouette; small amber-glass lantern on gatepost; open grassy path through middle-distance meadow toward low distant hills, cooler and softer with atmospheric haze; upper fifth an uninterrupted pale gold-to-blue sky, bottom tenth low-detail grass and path; heavy oil impasto, tactile brushwork, restrained gold, mist blue, umber, sage --ar 21:9 --no people, creatures, animals, houses, rooftops, distant village, text, signature, watermark, wire mesh, thin pickets, oversized glow
Candidate rejection triggers
Reject if any village roof appears, the gate is not attached to the right edge, the path is filled with props, the lantern is too tiny to locate or hidden by the gate, or the sky contains high-contrast forms across the overlay band.
Example 3 — Ruined camp aftermath
Brief
- Beat: A camp has been abandoned or destroyed after a struggle; aftermath is communicated by broken equipment and disturbed earth, not by visible victims.
- Near plane: One heavy broken log enters from the lower-left edge, mostly horizontal and with a broad silhouette; keep it out of the entire bottom overlay strip if ground fog uses that strip.
- Focal plane: Torn low tents, a scorched fire ring and a single visible lantern or brazier source; choose one primary anchor to avoid conflicting sources.
- Far plane: Dark treeline and a low ridge under a clear cold night sky.
- FX anchor: A small surviving lantern on a post, or a compact ember bed; choose one and keep it readable.
- Bands: Upper 20% quiet navy sky for cloud-shadow/bird overlays only if appropriate; bottom 10% open, low-detail earth for fog.
- Palette: Blue-black, ash gray, dead grass ochre, one small ember amber accent.
- Risk to avoid: painted smoke columns, multiple competing fire sources, tall stakes and guy-ropes crossing depth planes, highly detailed debris spread across every band.
Full prompt — GPT Image / Gemini natural-language format
A quiet, cinematic night scene of a ruined campsite after an unseen disaster, painted as one finished heavy oil-impasto environment plate. The site is abandoned and still; the damage is told through torn canvas, scorched earth and broken equipment, with no visible people or creatures.

COMPOSITION: A thick broken log enters from the lower-left frame edge and is cropped by the border, forming one broad, rough foreground silhouette. Keep the log mostly horizontal and confined to the near edge; it must not rise into the central focal zone. In the middle distance, two low torn canvas shelters sit at different angles around a scorched fire ring, separated by visible patches of bare earth. One small lantern hangs from a stout post on the right side of the clearing. Its warm pane is clear against the cold surroundings and remains unobstructed. Behind the camp, a few large tree masses form a dark treeline; beyond them, a distant low ridge fades into blue-black night haze.

DEPTH READ: Near broken log; middle-distance damaged camp with the readable fire ring and lantern; far simplified treeline and ridge. Use relative scale, clear overlap and contrast to distinguish the groups. Avoid tall narrow stakes, thin tent lines, wire-like debris, fence lattices or branch networks crossing multiple distance groups.

FX SOURCE: Use the lantern’s small amber pane as the single warm anchor for subtle runtime glow and flicker. Do not paint a large light halo, drifting sparks, fire tongues or a smoke column. The campfire ring may be visibly scorched and contain a few dim embers, but the lantern remains the principal FX anchor.

RESERVED BANDS: The upper 20% is an open, softly graded blue-black night sky with subtle painterly variation and faint horizon haze only. No painted smoke, large cloud silhouettes, bird shapes or branches enter this band. The bottom 10% is low-detail ash-brown earth in broad horizontal strokes, with no tiny scattered debris or sharp grass blades, suitable for a low fog veil.

STYLE: Heavy oil impasto, rough bristle texture, broad masses of blue-black, ash gray and dead-grass ochre, with one restrained amber highlight at the lantern. Keep the tents and debris selectively detailed, not equally sharp everywhere. The picture should read as a complete painting before any runtime effect is enabled.

CONSTRAINTS: No people, no party, no bodies, no animals, no creatures. No text, lettering, signatures, logos or watermarks. One coherent painting only; do not depict separate layers or animation frames.
Imagen negative prompt, if supported
`people, human silhouettes, bodies, animals, creatures, text, lettering, signature, logo, watermark, smoke column, dense painted fog, oversized glow halo, wire-like tent lines, thin stakes crossing the depth, fence lattice, high-detail debris in bottom band, cloud silhouettes across upper band`
Midjourney concise variant
ruined abandoned campsite at cold night, no inhabitants; one thick broken log cropped by the lower-left edge, broad mostly horizontal silhouette; middle-distance torn low canvas shelters around a scorched fire ring, one clear amber-glass lantern on a stout post at right; dark treeline and distant low ridge softened into blue-black atmospheric haze; upper fifth open graded night sky, bottom tenth low-detail ash-brown ground; heavy oil impasto, blue-black, ash gray, dead grass ochre, one restrained amber accent --ar 21:9 --no people, bodies, animals, creatures, text, watermark, smoke plume, dense fog, oversized glow, wire-like lines, thin stakes, fence lattice
Candidate rejection triggers
Reject if there is a painted smoke column; the lantern is obscured; tent lines dominate; small debris fills the fog strip; or the camp and far treeline merge into one texture field.
10. Practical test protocol for 4–8 candidate images
Since the budget is 4–8 candidates per brief, use the candidates to test the image requirements, not to test six unrelated prompt philosophies at once.
First pass: choose the winning composition, not the prettiest image
Write one brief and one provider-appropriate prompt using the clauses above.
Generate 4–8 candidates with the same aspect ratio, quality setting and style settings. If the generator has seeds, record them; do not assume equal seed values across models are comparable.
Score each image with the image-review scorecard in Section 8. Do the first pass at actual target crop and thumbnail scale.
Reject hard failures: no edge-attached occluder, no visible FX source, high-contrast silhouette inside the reserved band, people/text, or a forest/fence lattice crossing the entire image.
Among survivors, prefer the composition with the fewest risky boundaries—not necessarily the one with the most detail.
Second pass: run a small ablation to test the spatial hypothesis
When investigating a provider, make controlled variants rather than changing all wording at once:
- A — abstract: `cinematic deep environment with foreground, midground and background`.
- B — named planes: `large trunk cropped by left edge; clear middle-distance camp; small, cool distant ridge`.
- C — named planes + scale/contrast/negative-space: B plus `foreground darkest; ridge smaller/cooler/softer; upper fifth clean sky; bottom tenth low-detail ground`.
If only 4 candidates are affordable, generate 2 with A and 2 with B to directly test abstract versus named spatial placement; this is only an initial screen, not a statistically conclusive experiment. If 8 are affordable, use 3 with A, 3 with B and 2 with C. This tests the named-placement hypothesis first, then samples the added benefit of scale/contrast/negative-space cues. Run the same semantic brief but adapt syntax to each model’s actual negative-prompt mechanism. Do not compare a short Midjourney prompt with a long GPT Image prompt and attribute the difference to the model alone.
Record the following per output
`provider / exact model version / UI or API / aspect ratio / output dimensions / prompt version / seed if available / occluder score / depth score / anchor score / sky band score / ground band score / parallax-risk score / unwanted object failures / selection decision`.
Success criterion: after reviewing 4–8 candidates, at least one image meets all pipeline-critical gates. If zero pass, change the composition clauses before adding more style adjectives. A successful static image is not yet proof of parallax quality: feed its actual generated image through the existing depth-map and parallax preview, because the prompt cannot predict every pixel-level depth boundary.
11. One-page summary: the ten highest-impact rules
Describe objects and their positions, not just “depth”. `A trunk cropped by the left edge; a clear clearing behind it; a smaller, cooler ridge far away.`
One broad edge occluder beats a tangled frame. Make it cropped, attached to the edge, visually solid, and mostly confined to a single depth region.
Keep the focal opening genuinely open. Name the one focal feature and preserve visible ground around it.
Use scale + overlap + contrast together. Near is larger/darker, focal is clearest, far is smaller/cooler/softer.
Put actual painted objects under runtime FX. Lantern, chimney mouth, fire bowl or brazier—not a painted smoke plume or huge glow effect.
Reserve usable bands, not blank rectangles. Sky and ground should contain broad painterly gradients, with no high-contrast shapes in the strip occupied by moving overlays.
Avoid thin structures on depth boundaries. Fences, wires, poles, tent lines, twig networks and foliage lattices are the most obvious prompt-level risks in this pipeline.
Match exclusion syntax to the model. Imagen/SDXL negative fields, Midjourney `--no`, plain-language constraints for GPT Image/Gemini, positive alternatives for FLUX.2.
Use camera words as seasoning, not geometry control. `wide establishing view` helps the look; it does not guarantee gate placement or the exact empty area.
Approve for runtime behavior, not static beauty alone. Score the generated image at final crop/thumbnail size, then validate it with the baked Depth Anything V2 map and existing parallax preview.
Bibliography and source notes
Official prompt/model documentation
OpenAI — Image prompting. Current guidance on prompt structure, composition, model prompting and iteration; notes that camera specifications are cues and that precise layout-sensitive composition may still fail.
https://developers.openai.com/api/docs/guides/image-prompting
OpenAI — Image generation. Current guide and documented limitations for GPT Image generation.
https://developers.openai.com/api/docs/guides/image-generation
Google DeepMind — How to create effective image prompts with Nano Banana. Official composition, subject, setting, style, framing and iterative prompting guidance.
https://deepmind.google/models/gemini-image/prompt-guide/
Google AI for Developers — Gemini image generation. Current model variants and structured aspect-ratio/image-size settings; verify supported ratios for the precise model/API being used.
https://ai.google.dev/gemini-api/docs/image-generation
Google Cloud — Imagen prompt guide. Official separate negative-prompt guidance; recommends simple unwanted concepts rather than instruction-like “no/don’t” sentences in that field.
https://cloud.google.com/vertex-ai/generative-ai/docs/image/img-gen-prompt-guide
Midjourney — Prompt Basics. Recommends concise prompts, specific visible attributes, and describing what is wanted; documents that natural-language “no cake” can still yield cake.
https://docs.midjourney.com/hc/en-us/articles/32023408776205-Prompt-Basics
Midjourney — No parameter. Official `--no` behavior and syntax.
https://docs.midjourney.com/hc/en-us/articles/32173351982093-No
Midjourney — Aspect ratio. Official `--ar` syntax and caveat that very wide/tall ratios can be experimental or unpredictable.
https://docs.midjourney.com/hc/en-us/articles/31894244298125-Aspect-Ratio
Black Forest Labs — Does FLUX.2 support Negative Prompting? Official statement that FLUX.2 does not support negative prompts and recommends positive descriptions.
https://help.bfl.ai/articles/7734566352-does-flux-2-support-negative-prompting
Black Forest Labs — FLUX.1-dev model card. Version-specific model card and prompt-following caveat.
https://github.com/black-forest-labs/flux/blob/main/model_cards/FLUX.1-dev.md
Stability AI — SDXL release notes. Official SDXL context and examples that use negative prompts.
https://platform.stability.ai/docs/release-notes
Hugging Face Diffusers — ControlNet. Implementation documentation for Canny/depth conditioning with SDXL and FLUX pipelines; explains control strength and multimodal controls.
https://huggingface.co/docs/diffusers/using-diffusers/controlnet
Papers / primary technical sources
Yang et al. — Depth Anything V2 (2024). Monocular depth estimation improvements and benchmark/limitation discussion.
https://arxiv.org/abs/2406.09414
Huang et al. — T2I-CompBench (NeurIPS 2023). Benchmark with spatial relations and complex composition.
https://proceedings.neurips.cc/paper_files/paper/2023/hash/f8ad010cdd9143dbb0e9308c093aff24-Abstract.html
Huang et al. — T2I-CompBench++ (IEEE TPAMI 2025). Expanded benchmark for 2D/3D spatial relations and complex composition across multiple model families.
https://ieeexplore.ieee.org/abstract/document/10847875/
Conwell, Tawiah-Quashie & Ullman — Relations, Negations, and Numbers (2024). Human-evaluated logical probes for DALL·E 3; evidence about tested prompts/model, not universal performance of all current models.
https://arxiv.org/abs/2411.17066
Wang et al. — Everything in Its Place: Benchmarking Spatial Intelligence of Text-to-Image Models (ICLR 2026). SpatialGenEval: large, information-dense prompts; reports continued spatial-reasoning weaknesses across 23 tested models.
https://proceedings.iclr.cc/paper_files/paper/2026/hash/4a5c76c63f83ea45fb136d62db6c7104-Abstract-Conference.html
Gu et al. — Can Text-to-Image Models Draw from the Right Frame of Reference? (2026). FoR-T2I compares object-relative instructions with matched camera-view spatial instructions across 22 models; highly relevant to using image-space coordinates in prompts.
https://arxiv.org/abs/2608.03357
Li et al. — 3D Cinemagraphy From a Single Image (CVPR 2023). Single-image animation and camera-motion research; explicitly addresses holes/artifacts emerging when image content moves.
https://openaccess.thecvf.com/content/CVPR2023/html/Li_3D_Cinemagraphy_From_a_Single_Image_CVPR_2023_paper.html
D23 / Disney — Multiplane camera. Institutional history of the use of painted background planes to create depth in animation.
https://d23.com/a-to-z/multiplane-camera/
Community measurements (anecdotal)
r/StableDiffusion — “advanced prompt adherence: Z image(s) v. Flux(es) v. Qwen(s)” (January 2026). A user-reported 60-output scored test, useful as a screening signal but not a controlled independent benchmark.
https://www.reddit.com/r/StableDiffusion/comments/1qqv3px/advanced_prompt_adherence_z_images_v_fluxes_v/
r/FluxAI — alternate negative-prompt workflow discussion. Illustrates that negative-prompt behavior can depend on checkpoint, sampler/CFG and wrapper nodes; treat as version-specific anecdote.
https://www.reddit.com/r/FluxAI/comments/1ekjomu/alternate_negative_prompt_workflow/
Evidence caution
The sources establish the general limits of image-model composition, documented prompt interfaces, and the mechanics/problems of depth-image animation. They do not establish a universal success rate for exact phrases such as “bottom-left corner frames the view”, nor prove a ranking of all current generators on this pipeline. The recommended clauses and scoring thresholds are explicit engineering hypotheses for local testing, to avoid reproducing the unsupported certainty of generic prompt tips.
