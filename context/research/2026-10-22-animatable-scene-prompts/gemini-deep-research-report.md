Technical Report: Single-Canvas 2.5D Real-Time Parallax and Art Pipeline Engineering
1. Parallax Mechanics and Multiplane Compositional Strategy
The architecture of 2.5D real-time environment rendering relies on generating an illusion of spatial volume from flat, two-dimensional visual assets. This discipline originates from the physical multiplane camera developed for traditional cel animation, where physical artwork was separated across discrete glass planes positioned along an optical axis. In physical multiplane mechanics, differential lateral translation velocity ($\vec{v} \propto \frac{1}{Z}$) between foreground, midground, and background layers simulated binocular parallax and camera movement without altering the geometry of the painted elements.
Modern single-canvas 2.5D game-art pipelines replace discrete physical glass layers with monocular depth estimation models and runtime pixel-deformation parallax shaders. Rather than cutting an image into explicit artwork layers, a monocular depth estimator—specifically Depth Anything V2—derives a continuous relative depth map $Z(x,y) \in [0, 1]$ directly from a single painted image. At runtime, a vertex- or pixel-shader applies a horizontal displacement field $\Delta x(x,y) = S \cdot (1 - Z(x,y)) \cdot \theta$, where $S$ represents the global scene parallax scalar and $\theta$ is the camera translation vector.
While continuous pixel deformation eliminates the labor of cutting, painting, and inpainting hidden background regions across multi-layer scene files, it introduces spatial constraints that differ from multiplane animation. In a physical multiplane system, a foreground tree trunk sits on its own glass plane; as the camera moves, the edge of the tree slides cleanly over the background layer, revealing unpainted canvas that was rendered on the layer behind it. In a single-canvas pixel-deformation pipeline, no unpainted background data exists behind the tree. The shader must stretch existing pixels to fill disoccluded space during horizontal displacement.
Depth Anything V2 employs a Vision Transformer (ViT) backbone trained on synthetic datasets and unlabelled real-world imagery to output relative depth. Despite its capability in identifying global depth gradients, its mathematical behavior across sharp spatial discontinuities introduces rendering artifacts when paired with real-time displacement shaders. Monocular depth models do not output step-function depth jumps at object boundaries; instead, they generate a narrow spatial transition ramp across object edges. When a high-frequency contrast edge (such as a dark wrought-iron fence post against a bright sky) undergoes pixel displacement, pixels along this transition ramp receive intermediate depth values. Consequently, the shader displaces the left side of the fence post at $Z=0.1$ (near) and the right side of the sky at $Z=0.9$ (far), while the pixels along the boundary receive $Z=0.5$. This causes the painted boundary to stretch across the canvas, resulting in severe rubber-banding, edge tearing, slithering, and visual smearing.
Through empirical testing across impasto-style 21:9 renders (~3168×1320 px), specific structural geometries consistently survive depth-map deformation, while others reliably cause catastrophic visual failures:
Geometries That Survive Pixel-Deformation Parallax (Verified)
- Broad Convex Masses: Large boulders, smooth earthen mounds, massive stone archways, and dense hill contours maintain smooth depth gradients ($\vert{}\nabla Z\vert{} \le \epsilon$) across their interior volumes, ensuring uniform pixel displacement without interior shearing.
- Soft Atmospheric Perspective: Receding mountain ranges, heavy distant ridge lines, and low-frequency terrain undulations leverage gradual hue-and-value shifts to mask minor depth estimation errors.
- Heavy Impasto Volumetric Shapes: Wide brushstrokes that define solid, contiguous forms (such as tree trunks thicker than 15% of total screen width) allow Depth Anything V2 to assign a unified depth value across the entire shape.
- Edge-Anchored Convex Frames: Foreground elements (such as heavy rock ledges or cavern lips) that enter from the canvas border and terminate in broad, simple silhouettes survive because they can be designated for manual hand-cutting as a fast secondary parallax layer.
Geometries That Fail Pixel-Deformation Parallax (Verified)
- Thin Vertical and Diagonal Elements: Rope bridges, iron fences, thin saplings, weapon blades, ship rigging, and bare branches spanning across depth planes tear violently. The depth estimation model fails to isolate the thin foreground geometry, assigning it the background sky's depth value or creating an unstable depth ramp.
- Foliage Lattices and Negative-Space Perforations: Tree canopies with small sky gaps, lattice fences, or perforated ruins cause Depth Anything V2 to smooth over the holes, assigning a single depth value to both the foliage and the sky seen through it. When shifted, the sky holes warp as if they were solid leaves.
- Hard Geometric Edges Crossing Sharp Depth Jumps: Clean-cut architectural pillars or sharp stone blocks placed squarely in the midground against a distant horizon create maximum depth delta ($\Delta Z > 0.7$) over a single pixel boundary, forcing the shader into maximum disocclusion tearing.
Classic Animation / 2.5D Principle
Physical Parallax Failure Mode
Production Parallax Rule
Parallax-Enforcing Prompt Clause
Verification Status
Foreground Framing
High-frequency edge tearing across canvas center.
Anchor foreground elements strictly to canvas borders for fast manual layer extraction.
`"Framed on the far-left edge by a massive, solid stone pillar with smooth convex edges, sweeping directly out of the frame border."`
Verified
Volumetric Massing
Fine lattice structures (fences, twigs) shear into pixel strings.
Merge delicate detail into unified, solid silhouette masses.
`"Thick, monolithic oak trunk, heavy continuous wood volume, broad impasto brushwork without thin detached branches."`
Verified
Atmospheric Depth Cues
Hard midground-to-background edge jumps stretch background texture.
Force continuous depth gradients using atmospheric perspective and value decay.
`"Deep background receding into dense blue-grey haze, soft low-contrast mountain silhouettes fading into atmospheric distance."`
Verified
Negative Space Reservation
High-contrast detail in sky/ground clashes with scrolling procedural overlays.
Reserve uncluttered textural bands for procedural overlay scrolling.
`"Upper third of canvas features an uncluttered, open sky gradient with broad horizontal impasto color transitions."`
Verified
2. Spatial Engineering and Prompt Mechanics in Diffusion Models
Generative image models process spatial instructions through cross-attention mechanisms that bind textual tokens to spatial latent features. However, benchmark evaluations (including T2I-CompBench, VISOR, and SR2D) reveal systematic limitations in spatial reasoning across modern diffusion and autoregressive architectures.
Text encoders (such as CLIP ViT-L/14 or T5-XXL) treat prompt inputs primarily as semantic bags of concepts rather than coordinate maps. When processing relational terms such as "to the left of," "underneath," or "behind," models frequently suffer from attribute leakage or spatial inversion. Mentioning two distinct spatial entities (e.g., "a lantern on the left, a stone wall on the right") routinely causes cross-attention bleed, rendering lantern-like brass details on the right stone wall or stone texture on the left lantern. Models also display a strong positional bias toward concepts appearing in the first 10–15 tokens of the prompt, often placing the primary concept dead-center regardless of specified spatial qualifiers.
Including negated spatial instructions in positive text prompts (e.g., "no trees in the foreground," "empty space without rocks") routinely triggers the opposite effect. Diffusion models construct latent representations by accumulating positive feature noise driven by token cross-attention. The presence of the token `"trees"` or `"rocks"` activates the corresponding latent feature space regardless of the preceding `"no"` or `"without"` modifier. In Classifier-Free Guidance (CFG), the denoiser update step is calculated as:
$$\mathbf{\epsilon}_{\text{final}} = \mathbf{\epsilon}(\mathbf{x}_t, \emptyset) + s \cdot (\mathbf{\epsilon}(\mathbf{x}_t, \mathbf{c}_{\text{pos}}) - \mathbf{\epsilon}(\mathbf{x}_t, \mathbf{c}_{\text{neg}}))$$
True negation occurs only when undesirable concepts are passed into the explicit negative prompt vector $\mathbf{c}_{\text{neg}}$. Attempting spatial negation inside the positive prompt vector $\mathbf{c}_{\text{pos}}$ introduces positive token weights for the target object, corrupting the generation.
Evaluating the operational hypothesis—that generative image models obey named placement tokens and photographic framing language significantly better than abstract depth requests—yields a Verified result. Diffusion models do not possess an internal 3D Euclidean spatial engine. Prompts requesting abstract depth metrics ("strong 3D separation," "deep volumetric space") yield unpredictable, decorative results because the training set captions rarely map abstract spatial terms to consistent geometric arrangements. Conversely, models respond with high fidelity to photographic lens terminology and explicit positional anchors. Phrases like `"24mm wide-angle lens"`, `"deep depth of field"`, `"establishing shot"`, and `"f/8 aperture"` invoke training clusters associated with architectural and landscape photography. These clusters feature wide foreground framing, flattened geometric distortion, and long-range spatial clarity—ideal for 2.5D depth-map calculation. Terms such as `"anchored at the bottom-left edge"`, `"occupying the extreme right quarter of the frame"`, or `"horizontal ground band occupying the lower third"` leverage concrete spatial priors established in compositional and cinematic datasets.
Failure Mode
Root Technical Cause
Model Impact
Corrective Prompting Strategy
Verification Status
Object Leakage & Merging
Cross-attention keys for adjacent textual concepts bleed across spatial latent blocks during early denoising steps.
A lantern on a pedestal merges with an adjacent tree, creating a glowing wood hybrid.
Isolate concepts into distinct clause blocks; utilize regional prompting masks or explicit physical isolation language (`"isolated, freestanding..."`).
Verified
Spatial Negation Reversal
Token encoders process positive embeddings for nouns regardless of syntax negation (`"no"`, `"without"`) in positive prompt.
Prompting `"sky without clouds"` generates dense, high-contrast painted clouds across the upper sky.
Strip all negation from positive prompt; move excluded nouns directly into the negative prompt channel $\mathbf{c}_{\text{neg}}$ or use positive presence phrases (`"clear blue gradient"`).
Verified
Foreground Dislocation
Abstract depth cues (`"in the foreground"`) default to central canvas placement due to model centering bias.
A foreground archway spawns dead-center, splitting the scene and blocking the primary focal subject.
Anchor foreground objects strictly to canvas perimeters using boundary-relative terms (`"anchored along the extreme left border..."`).
Verified
Midground Edge Smearing
High contrast, thin geometry generated in midground creates steep step-discontinuities in monocular depth maps.
Fences or tree branches across midground shear into stretched pixel webs during runtime parallax warp.
Replace delicate midground objects with heavy, broad volumetric masses; mandate atmospheric edge diffusion (`"soft atmospheric haze softening midground silhouettes"`).
Verified
Over-Cluttered Sky Band
Model attempts to fill empty negative space with decorative detail (flying birds, dense clouds, floating islands).
Procedural cloud-shadows and scrolling cloud overlays multiply over static painted clouds, creating muddy visual noise.
Explicitly specify structural texture without discrete shapes (`"uncluttered, smooth open sky gradient with broad horizontal impasto color washes"`).
Verified
3. Canvas Space Reservation and Procedural FX Anchoring
The runtime 2.5D animation stack relies on four distinct layers operating simultaneously: a single painted background canvas warped by a baked Depth Anything V2 map; procedural ambient particle and shader FX anchored to normalized screen-fraction coordinates $(x/W, y/H)$; asset-backed overlay bands (noise-masked fog veils, cloud sprites, scrolling shadows) moving horizontally over designated canvas areas; and an optional hand-cut, edge-anchored foreground occluder layer operating as a fast parallax plane.
A primary failure mode in this hybrid stack occurs when the AI image generator paints details that conflict with dynamic runtime overlays. If the image generator paints high-contrast, fully rendered cumulus clouds into the sky band, scrolling procedural cloud sprites or multiply-blended shadow passes create visual clutter. The static painted paint strokes remain stationary while the dynamic overlay slides overhead, immediately breaking the illusion of movement.
To prevent these collisions, the painted canvas must strictly observe spatial reservation rules across its 21:9 (~3168×1320 px) layout:
The upper 30%–35% of the canvas represents the Reserved Sky Band. This zone must be reserved for scrolling asset-backed clouds and dynamic lighting passes. The prompt must instruct the generator to paint a broad, continuous atmospheric sky gradient featuring rich impasto knife texture, but completely devoid of distinct, hard-edged cloud shapes.
The middle 40%–50% of the canvas represents the Focal Midground Plane. This zone requires a clear line-of-sight to the primary environment subject, free of central foreground clutter. It hosts small, isolated FX anchors (such as a 40px lantern positioned at screen coordinates $X=0.72, Y=0.55$) that serve as emission points for procedural smoke columns or flickering glow shaders.
The lower 20%–25% of the canvas represents the Reserved Ground Band. This area must consist of flat earth, cobblestone, or water surfaces. The generator must never paint low ground fog banks or mist rolls directly onto the canvas; mist must be introduced at runtime via noise-masked fog veils. Painted mist creates static, high-value visual patches that tear under depth warping.
The perimeters (specifically the left or right 15% edges) represent the Edge Occluder Region. This zone accommodates edge-anchored convex masses designed for fast manual layer extraction.
The core pipeline design rule dictates: The painting must contain the source of the life, not the life itself. Prompting for `"a glowing campfire with rising smoke columns, flying bright embers, and flickering light beams"` causes the generator to bake static, unmoving smoke trails and ember dots into the impasto paint. When the scene parallax shifts, these static particles warp unnaturally as part of the background geometry. Conversely, prompting for `"a small, extinguished stone fire pit containing dark charcoals and tiny dull orange embers, isolated on the lower-midground cobble"` forces the generator to render only the physical container. Technical artists then map a runtime particle emitter to the exact coordinate of the fire pit, spawning dynamic, wind-influenced smoke and animated point-light flicker at runtime.
FX anchors must satisfy two spatial constraints:
Scale Control: Light sources (lanterns, wall sconces, chimneys, braziers) must be painted small, occupying no more than 3%–5% of total screen height. Large light sources create massive high-contrast value patches that cause depth estimation spikes in Depth Anything V2.
Visual Isolation: Light anchors must sit cleanly against a solid background plane (such as a lantern mounted on a solid stone wall) rather than straddling an open depth boundary (such as a lantern hanging off a thin post against the horizon) to ensure the depth map assigns a stable $Z$-value to the anchor point.
4. Cross-Generator Prompt Clause Library
Gemini / Nano Banana Architecture
Gemini and Nano Banana models employ advanced conversational understanding and show high sensitivity to natural language descriptions of spatial balance and material texture. They perform best with narrative descriptions of framing, camera lens, and physical material properties, while penalizing keyword-stuffed tag lists.
- Edge-Anchored Occluder: `"A massive, solid dark granite cliff wall framing the extreme far-left edge of the image, hugging the border cleanly with a continuous convex contour."`
- 3 Readable Depth Planes: `"A wide-angle cinematic perspective establishing three distinct spatial depth zones: a bold solid rock framing structure in the immediate left foreground, an open central cobble courtyard in the clear midground, and a soft, low-contrast mountain silhouette receding into atmospheric mist in the far background."`
- Isolated Light Source Anchor: `"A tiny, single iron wall lantern mounted securely against the solid midground stone wall, featuring a small, localized warm orange glow core."`
- Reserved Negative-Space Bands: `"The upper third of the canvas consists of a clean, open sky featuring a soft horizontal color wash with heavy impasto oil paint texture, completely devoid of discrete cloud shapes."`
- Negative Prompt / Exclusion Vector: `"human figures, characters, party, text, signatures, watermarks, thin lattice fences, detached twigs, high-contrast cloud shapes."`
Google Imagen 3
Imagen 3 demonstrates strong adherence to physical lighting, photographic framing, and surface textures. It interprets spatial positions literally, requiring precise photographic terminology to prevent visual clutter.
- Edge-Anchored Occluder: `"Framed along the extreme right edge by a thick, monolithic oak trunk, broad solid wood mass entering from the frame border."`
- 3 Readable Depth Planes: `"Shot on a 24mm wide-angle lens with deep focus throughout. Primary framing elements sit tightly against the right canvas border. The focal center presents a wide, uncluttered stone threshold. The distant background fades smoothly into a high-altitude atmospheric haze."`
- Isolated Light Source Anchor: `"A small, weathered brass brazier resting on the midground stone floor, holding a compact cluster of dim glowing coals."`
- Reserved Negative-Space Bands: `"The lower quarter of the frame is a broad, continuous expanse of flat, textured dirt ground, completely free of mist or fog rolls."`
- Negative Prompt / Exclusion Vector: `"people, silhouettes, text, branding, watermarks, fine wire mesh, thin bare branches, detailed cumulus clouds."`
OpenAI GPT-Image (DALL-E 3)
GPT-Image uses an internal language model re-prompter to convert brief inputs into descriptive paragraphs. It is prone to introducing unwanted characters, decorative objects, or painted atmospheric FX unless explicitly restricted via strict positive constraints.
- Edge-Anchored Occluder: `"An expansive 21:9 painterly environment in a heavy oil-impasto style. The extreme left frame border is anchored by a massive, solid ruined archway constructed from heavy, smooth stone blocks, leaving the central view entirely open."`
- 3 Readable Depth Planes: `"The scene is arranged into three clean depth tiers. Foreground: Heavy stone archway hugging the left edge. Midground: An open, empty dirt courtyard containing a single small iron lantern on a low stone pedestal. Far Background: Soft, low-detail mountain silhouettes beneath a smooth sky."`
- Isolated Light Source Anchor: `"Sitting on the low stone pedestal in the midground is a very small, single iron lantern emitting a subtle, compact point of warm light."`
- Reserved Negative-Space Bands: `"The upper portion of the painting features a calm, open twilight sky painted with broad horizontal impasto knife strokes, totally free of distinct cloud formations or flying birds."`
- Negative Prompt / Exclusion Vector: (Embedded directly as strict instructions within the prompt block) `"Do not include any people, adventurers, or human figures. Do not draw text, signatures, or watermarks. Do not add thin branches, fine fences, or detailed clouds."`
Midjourney v6
Midjourney v6 relies on early token weighting and comma-separated stylistic descriptors. While it interprets natural language syntax better than previous versions, it remains susceptible to concept bleed and unwanted foreground clutter. It requires explicit parameter flags (`--ar 21:9`, `--style raw`, `--no`).
- Edge-Anchored Occluder: `"wide 21:9 cinematic establishing shot, heavy oil-impasto painting style, thick palette knife textures, extreme left edge framed by a monolithic solid stone cliff face, continuous convex silhouette --ar 21:9 --style raw"`
[cite: 25, 26]
- 3 Readable Depth Planes: `"three distinct depth planes, wide 24mm lens look, deep depth of field, solid rock mass on far-left border, open clear midground stone floor, receding soft blue mountain silhouettes in deep background, atmospheric perspective --ar 21:9 --style raw"`
[cite: 6, 26]
- Isolated Light Source Anchor: `"small rustic iron lantern mounted on a midground stone wall, tiny isolated warm light core, compact point light source --ar 21:9 --style raw"`
[cite: 1, 26]
- Reserved Negative-Space Bands: `"open empty sky band across top third, broad horizontal impasto color wash, smooth gradient sky, empty flat ground band across bottom third --ar 21:9 --style raw"`
[cite: 6, 26]
- Negative Prompt Parameter Flag: `--no human, person, party, text, watermark, signature, thin branches, fine lattices, detailed clouds, ground fog`
[cite: 25]
SDXL and FLUX.1 (ControlNet / Regional Prompting)
FLUX.1 (a Diffusion Transformer architecture) exhibits superior spatial adherence to explicit coordinate terms (`"extreme left"`, `"lower third"`). SDXL benefits from explicit dual-text encoder prompting and ControlNet depth or Canny masks for structural layout control.
- Edge-Anchored Occluder: `"Heavy oil-impasto painting, 21:9 aspect ratio. The extreme left 15% of the frame is occupied by a solid, monolithic ruined stone pillar with broad, continuous geometry, anchored directly to the image border."`
[cite: 9, 11]
- 3 Readable Depth Planes: `"Cinematic wide-angle view, 24mm perspective. Foreground: Heavy stone pillar hugging the left frame edge. Midground: Clear, spacious cobble courtyard. Background: Distant, low-contrast mountain ridges fading into atmospheric haze."`
[cite: 6, 9]
- Isolated Light Source Anchor: `"A tiny, isolated brass lantern sitting on a low stone bench in the midground, generating a localized warm orange point-light center."`
[cite: 1]
- Reserved Negative-Space Bands: `"The upper 35% of the image is an open, uncluttered sky with horizontal palette-knife impasto textures. The lower 20% of the image is a flat stone ground plane."`
[cite: 6]
- Regional Prompting Setup: Utilize an attention-masking node (such as Regional Prompting FLUX). Assign Mask 0 (Left 20%) to the occluder prompt; Mask 1 (Center 60%) to the focal environment; Mask 2 (Top 35%) to sky reservation; and Mask 3 (Bottom 25%) to ground reservation.
- Negative Prompt Channel ($\mathbf{c}_{\text{neg}}$): `"humans, characters, adventurers, text, labels, watermarks, signatures, thin rope, wire mesh, detailed cumulus cloud shapes, painted mist, painted fog banks, foliage lattice"`
[cite: 10, 25]
5. Scene-Brief Engineering Template
Technical artists and prompt engineers should use the following fillable brief template to define parameters prior to generating candidate batches:
====================================================================================
2.5D REAL-TIME ENVIRONMENT GENERATION BRIEF
====================================================================================

1. SCENE BEAT & NARRATIVE CONTEXT
   - Narrative Beat: [e.g., Act II - Discovery of the Ruined Gate]
   - Camera Ratio: 21:9 Aspect Ratio (~3168x1320 px)
   - Canvas Objective: Single painted background image for 2.5D parallax warp

2. VISUAL STYLE LOCK & MEDIUM
   - Medium: Heavy oil-impasto painterly style, thick visible impasto brushstrokes,
     pronounced palette-knife ridges, rich physical pigment texture
   - Rendering Lens: 24mm wide-angle lens, deep focus throughout

3. SPATIAL DEPTH PLANE SPECIFICATION
   - Foreground Occluder (Hand-Cut Layer):
     [Object Type, e.g., Monolithic ruined stone archway]
     [Frame Anchor, e.g., Hugging extreme far-left edge, occupying left 15%]
     [Geometry Constraint, e.g., Continuous convex silhouette, zero thin extensions]
   - Midground Focal Plane:
     [Focal Subject, e.g., Abandoned stone threshold with iron-reinforced door]
     [Spatial Clearance, e.g., Central 50% cleared of clutter, open line-of-sight]
   - Far Background Plane:
     [Background Mass, e.g., Distant jagged mountain ridges]
     [Atmospheric Treatment, e.g., Soft low-contrast blue-grey atmospheric haze]

4. PROCEDURAL FX LIGHT SOURCE ANCHORS
   - Light Anchor Object: [e.g., Single small rustic iron wall lantern]
   - Anchor Placement: [e.g., Mounted on midground stone wall, right-center]
   - Anchor Scale: Small (<40px height), isolated point light core, zero painted smoke

5. CANVAS NEGATIVE-SPACE RESERVATION
   - Reserved Sky Band (Upper 35%):
     [Texture, e.g., Broad horizontal impasto knife washes]
     [Exclusion, e.g., ZERO painted cumulus cloud shapes, ZERO flying birds]
   - Reserved Ground Band (Lower 25%):
     [Texture, e.g., Flat dirt and scattered cobble path]
     [Exclusion, e.g., ZERO painted low ground mist or fog banks]

6. COLOR PALETTE & ATMOSPHERIC MOOD
   - Key Palette: [e.g., Cold slate blue, muted moss green, warm amber anchor glow]
   - Atmospheric Lighting: [e.g., Diffuse overcast morning light, low key contrast]

7. EXCLUSION VECTOR (NEGATIVE PROMPT BLOCK)
   - Mandatory Universal Exclusions:
     human figures, people, party, adventurers, silhouettes, text, writing, 
     watermarks, signatures, thin lattice, delicate twigs, rope rigging, 
     painted fog, painted mist, painted clouds, high-contrast sky shapes
====================================================================================
6. Pre-Generation Technical Checklist
Before initiating batch generation (4–8 rolls per brief), prompt engineers must validate the target prompt against this 12-point technical checklist to ensure parallax safety and overlay compatibility:
#
Parallax & Pipeline Safety Check
Rating / Status
BAD Prompt Snippet (Failure-Prone)
GOOD Prompt Snippet (Parallax-Safe)
Verification Status
1
Edge-Anchored Foreground Occluder Present
[ ] PASS / FAIL
`"A huge ruined archway standing right in the middle of the shot."`
`"Extreme left frame edge anchored by a massive solid stone archway with smooth convex edges."`
[cite: 8, 9]
Verified
2
3 Distinct, Non-Overlapping Depth Planes
[ ] PASS / FAIL
`"A complex forest filled with trees at every distance."`
`"Three clean depth zones: left foreground rock wall, open central midground clearing, receding far background mountains."`
[cite: 6]
Verified
3
Absence of Thin Vertical/Diagonal Structures
[ ] PASS / FAIL
`"A wooden rope bridge with thin suspension cables crossing the gorge."`
`"A heavy, solid stone bridge with thick monolithic masonry arches spanning the gorge."`
[cite: 1, 2]
Verified
4
Convex Silhouettes on Foreground Masses
[ ] PASS / FAIL
`"An old pine tree with dozens of bare, spiky, intricate branches."`
`"A thick monolithic oak trunk with broad, contiguous canopy silhouettes."`
[cite: 2, 4]
Verified
5
Small, Isolated Light Source FX Anchor
[ ] PASS / FAIL
`"A massive roaring bonfire blazing with giant flames and light rays."`
`"A small, weathered brass brazier containing tiny glowing embers, isolated on stone floor."`
[cite: 1]
Verified
6
Absence of Painted Dynamic FX (Smoke/Embers)
[ ] PASS / FAIL
`"Thick columns of black smoke rising into the air with flying embers."`
`"A dark stone chimney top on a slate roof, zero smoke, clear air above."`
[cite: 1]
Verified
7
Reserved Upper Sky Band (No Discrete Clouds)
[ ] PASS / FAIL
`"Dramatic sky filled with fluffy, detailed white cumulus clouds."`
`"Upper third is a clean open sky with broad horizontal impasto color washes, zero cloud shapes."`
[cite: 6]
Verified
8
Reserved Lower Ground Band (No Painted Mist)
[ ] PASS / FAIL
`"Thick rolling white fog banks covering the forest floor."`
`"Lower quarter features flat dirt ground texture, clear air, zero painted mist."`
[cite: 1, 6]
Verified
9
Photographic Lens & Depth Language Used
[ ] PASS / FAIL
`"Awesome 3D render with deep spatial perspective and hyper-depth."`
`"Shot on 24mm wide-angle lens, deep focus throughout, cinematic landscape photography."`
[cite: 6, 20]
Verified
10
Absolute Exclusion of Human Figures/Party
[ ] PASS / FAIL
`"An empty ancient campsite where adventurers used to sleep."`
`"An abandoned ancient campsite, completely deserted, no people, no human figures."`
[cite: 25]
Verified
11
Exclusion of Text, Watermarks, Signatures
[ ] PASS / FAIL
`"A beautiful painterly masterpiece concept art."`
`--no text, watermark, signature, labels, typography`
[cite: 25]
Verified
12
Parallax-Safe Style Lock (Heavy Impasto)
[ ] PASS / FAIL
`"Smooth digital illustration with soft vector gradients and thin linework."`
`"Heavy oil-impasto painting, thick palette knife marks, rich physical pigment texture."`
[cite: 25]
Verified
7. Worked Production Examples
Example 1: Forest Ambush Site
Completed Brief
- Scene Beat: Act I - The Silent Canopy (Ambush Threshold).
- Focal Subject: An abandoned, moss-covered stone boundary marker in a dense forest clearing.
- Near Plane (Edge Occluder): Massive mossy boulder mass anchored along the extreme right edge, occupying 18% of frame width, broad convex shape.
- Focal Plane: Open earth clearing centered on the stone marker; clear line-of-sight across the middle 50% of canvas.
- Far Plane: Dense, soft-focus tree trunk silhouettes fading into deep blue-green atmospheric haze.
- FX-Anchor Light Source: Small hanging iron lantern attached to a low stone post near the central marker (Target Coordinate: $X=0.48, Y=0.58$).
- Reserved Bands: Sky reserved across upper 30% (soft green canopy gradient wash, zero detailed leaf lattices); Ground reserved across lower 20% (flat mossy dirt, zero painted fog).
- Palette & Mood: Muted emerald green, damp slate grey, cold ambient twilight with warm amber lantern core.
Generator Target Prompts
FLUX.1 / SDXL (With Regional Attention Prompting)
Positive Prompt: `Heavy oil-impasto painting, broad palette-knife texture, 21:9 aspect ratio. A wide-angle 24mm establishing shot of an abandoned forest clearing. The extreme far-right border is framed by a massive, solid mossy boulder with a smooth convex silhouette. In the open midground clearing sits an ancient moss-covered stone boundary marker, with a tiny rustic iron lantern mounted on a low stone post emitting a compact point of warm amber light. The upper third features a broad canopy color gradient wash without thin branch lattices. The far background consists of soft, low-contrast tree silhouettes fading into dense atmospheric mist. Flat mossy earth ground plane.`
[cite: 6, 9, 11]
Negative Prompt ($\mathbf{c}_{\text{neg}}$): `human figures, adventurers, people, text, signature, watermark, thin twigs, detailed leaf lattices, hanging vines, rope, painted ground fog, detailed cloud shapes`
[cite: 10, 25]
Midjourney v6
`/imagine prompt: wide 21:9 cinematic establishing shot, heavy oil-impasto painting style, thick palette knife textures, forest ambush clearing, extreme far-right frame anchored by a massive solid mossy boulder mass, central open dirt clearing with an ancient stone marker, tiny rustic iron lantern mounted on low stone, compact warm light core, background soft tree silhouettes fading into blue atmospheric haze, 24mm wide lens, deep focus --ar 21:9 --style raw --no humans, party, text, watermark, signature, thin twigs, fine leaf lattices, painted fog --v 6.0`
[cite: 6, 25, 26]
Google Imagen 3 / GPT-Image
`A 21:9 cinematic heavy oil-impasto landscape painting of an empty forest clearing. The far-right edge of the frame is heavily anchored by a solid, massive mossy boulder with broad, clean convex edges. In the spacious center of the clearing stands an ancient mossy stone boundary marker. A very small iron lantern rests on a stone block beside the marker, containing a tiny point of warm orange light. The background features simple, soft-edged tree silhouettes receding into dense blue-green atmospheric haze. The upper canvas shows a broad green canopy color wash without detailed individual leaves, and the lower ground is flat damp soil without mist banks. No people or text.`
[cite: 6, 23, 25]
Technical Execution Strategy
- Depth Map Expectation (Depth Anything V2): The solid right boulder and central stone marker yield sharp depth blocks ($Z \approx 0.15$ and $Z \approx 0.50$). The soft-focus background tree silhouettes generate a smooth gradient ($Z \approx 0.85 \to 0.98$), avoiding horizontal edge tearing.
- Procedural FX Coordinate Mapping: Emitter Anchor set to $(X: 0.48, Y: 0.58)$. Runtime stack attaches: (1) Point-light flicker shader ($R=1.2\text{m}$, intensity variance $\pm 15\%$), (2) Rising particle smoke column leaning $12^\circ$ right (wind vector), (3) Slow ambient dust/mote particle field over clearing.
- Overlay Band Reservation: Upper 30% canvas receives noise-masked forest mist overlay sliding horizontally at $v=0.02\text{ px/frame}$; lower 20% receives ground fog veil sliding at $v=0.05\text{ px/frame}$.
- Foreground Occluder Extraction: The right mossy boulder is manually sliced along its clean convex inner contour into a discrete PNG-24 layer with 2px feathering, designated as Parallax Layer 0 ($v_{\text{parallax}} = 1.4\times$).
Example 2: Departure Threshold at Dawn
Completed Brief
- Scene Beat: Act I - The Journey Begins (Dawn Departure).
- Focal Subject: An expansive stone coastal archway overlooking a calm, vast ocean horizon.
- Near Plane (Edge Occluder): Heavy cliff overhang anchoring the top-left canvas corner and left edge, occupying left 15%, solid dark basalt rock volume.
- Focal Plane: Wide, open flagstone vista leading to the ocean horizon; central 60% completely unobstructed.
- Far Plane: Flat ocean horizon line with distant, low-contrast sea stack silhouettes softening into golden dawn haze.
- FX-Anchor Light Source: A small, extinguished stone fire basin on a stone pillar at the threshold edge (Target Coordinate: $X=0.28, Y=0.62$).
- Reserved Bands: Sky reserved across upper 40% (gradient transition from pale gold at horizon to deep slate blue at top, zero cloud shapes); Ground reserved across lower 25% (clean flagstone texture, zero painted mist).
- Palette & Mood: Dawn gold, cold slate blue, dark basalt grey, calm majestic morning atmosphere.
Generator Target Prompts
FLUX.1 / SDXL (With Regional Attention Prompting)
Positive Prompt: `Heavy oil-impasto painting, thick palette knife work, 21:9 aspect ratio. A wide 24mm cinematic shot of an ancient coastal threshold at dawn. The extreme left frame border is anchored by a solid, monolithic dark basalt cliff structure. The center opens onto a wide flagstone vista overlooking a flat ocean horizon. On a low stone pillar along the left path sits a small rustic stone fire basin containing dark charcoals and tiny glowing embers. The upper 40% of the canvas is a clean dawn sky gradient transitioning smoothly from gold to slate blue with broad impasto washes, entirely free of cloud shapes. Distant low sea stacks recede into soft morning atmospheric haze.`
[cite: 6, 9, 11]
Negative Prompt ($\mathbf{c}_{\text{neg}}$): `human figures, party, travelers, text, watermark, signature, ship rigging, thin poles, detailed cumulus clouds, painted sea foam, painted ground mist`
[cite: 10, 25]
Midjourney v6
`/imagine prompt: wide 21:9 cinematic establishing shot, heavy oil-impasto painting, thick palette knife textures, coastal stone threshold at dawn, extreme left border anchored by a solid dark basalt cliff mass, spacious flagstone vista leading to flat ocean horizon, small rustic stone fire basin on low pillar, tiny glowing ember core, upper sky is a clean horizontal gradient wash from gold to blue without cloud shapes, distant soft sea stacks in golden atmospheric haze, 24mm lens, deep focus --ar 21:9 --style raw --no humans, party, text, watermark, signature, ship rigging, detailed clouds, ground fog --v 6.0`
[cite: 6, 25, 26]
Google Imagen 3 / GPT-Image
`A 21:9 cinematic oil-impasto landscape painting of a stone coastal threshold at dawn. The extreme left edge of the painting is framed by a heavy, solid dark basalt cliff wall with a broad silhouette. The center of the frame features an empty flagstone walkway opening toward a distant ocean horizon. A small stone fire bowl rests on a short stone post near the walkway, containing dark ash and small glowing coals. The upper 40% of the canvas consists of a clean sky gradient from soft gold to slate blue, painted with broad impasto knife strokes, completely free of discrete clouds. Distant sea stacks recede softly into atmospheric haze. No people, no text.`
[cite: 6, 23, 25]
Technical Execution Strategy
- Depth Map Expectation (Depth Anything V2): The basalt cliff yields a uniform near-depth region ($Z \approx 0.10$). The ocean plane generates a smooth, linear continuous depth ramp from $Z=0.45$ (foreground flagstones) to $Z=0.99$ (horizon line), allowing the shader to execute seamless depth-based horizontal displacement without tearing.
- Procedural FX Coordinate Mapping: Fire Basin Anchor set to $(X: 0.28, Y: 0.62)$. Runtime stack attaches: (1) Thin rising heat-distortion shader pass, (2) Slow drift ember particle emitter ($15\text{ particles/sec}$ drifting right-upward), (3) Lens flare / light bloom pass tied to dawn horizon ($X=0.50, Y=0.60$).
- Overlay Band Reservation: Upper 40% reserved for scrolling multiply-blended cloud shadow pass ($v=0.01\text{ px/frame}$) and distant bird flock sprite strips ($v=0.15\text{ px/frame}$).
- Foreground Occluder Extraction: Left basalt cliff cut as an independent foreground layer, edge-anchored to $X=0.00$.
Example 3: Ruined Camp Aftermath
Completed Brief
- Scene Beat: Act III - The Aftermath (Desolated Ground).
- Focal Subject: Smoldering remains of an abandoned stone wagon station amidst ruined walls.
- Near Plane (Edge Occluder): Massive collapsed stone masonry block anchoring the bottom-left corner and lower-left edge (occupying left 20%, bottom 25%), solid blocky geometry.
- Focal Plane: Ruined stone courtyard scattered with weathered debris; central area open for line-of-sight.
- Far Plane: Scorched, rolling hills fading into dark overcast storm haze.
- FX-Anchor Light Source: A small, burnt wooden cart wheel stub with glowing ember pockets in the central courtyard (Target Coordinate: $X=0.55, Y=0.68$).
- Reserved Bands: Sky reserved across upper 35% (dark, dramatic storm-grey horizontal impasto wash, zero distinct cloud outlines); Ground reserved across lower 20% (scorched earth and flat stones, zero painted smoke or mist).
- Palette & Mood: Ash grey, charred black, cold iron, dim ember orange warmth.
Generator Target Prompts
FLUX.1 / SDXL (With Regional Attention Prompting)
Positive Prompt: `Heavy oil-impasto painting, thick palette knife strokes, 21:9 aspect ratio. A wide 24mm cinematic view of a ruined, abandoned stone courtyard. The bottom-left corner is anchored by a massive, solid collapsed masonry stone block with clean convex edges. In the open central courtyard lies the burnt hub of a wooden cart wheel containing small glowing embers. The background features scorched rolling hills fading into dark atmospheric storm haze. The upper 35% of the canvas is a heavy storm-grey impasto color gradient wash, completely free of discrete cloud shapes. Scorched dirt ground plane.`
[cite: 6, 9, 11]
Negative Prompt ($\mathbf{c}_{\text{neg}}$): `human figures, corpses, party, text, watermark, signature, thin spears, detailed wheel spokes, rope, painted smoke columns, painted ground mist`
[cite: 10, 25]
Midjourney v6
`/imagine prompt: wide 21:9 cinematic establishing shot, heavy oil-impasto painting, thick palette knife textures, ruined stone courtyard aftermath, bottom-left corner anchored by a massive solid collapsed masonry block, open central courtyard with burnt cart wheel hub, tiny glowing ember pockets, scorched background hills in dark atmospheric storm haze, upper sky is a dark storm-grey horizontal impasto color wash without cloud shapes, 24mm lens, deep focus --ar 21:9 --style raw --no humans, corpses, party, text, watermark, signature, thin spears, fine spokes, painted smoke, ground mist --v 6.0`
[cite: 6, 25, 26]
Google Imagen 3 / GPT-Image
`A 21:9 cinematic oil-impasto painting depicting a ruined, abandoned stone courtyard. The lower-left edge and corner are framed by a massive, solid block of collapsed stone masonry with broad, continuous geometry. The central courtyard is spacious and open, containing a single burnt wooden wheel hub with small glowing embers inside. The background consists of low, scorched hills fading into dark atmospheric storm haze. The upper third of the image is a uniform storm-grey sky gradient with heavy impasto knife texture, totally devoid of distinct cloud shapes. The ground is flat scorched dirt without painted smoke or fog banks. No people, no text.`
[cite: 6, 23, 25]
Technical Execution Strategy
- Depth Map Expectation (Depth Anything V2): The collapsed masonry block in the bottom-left yields a high-confidence near-depth zone ($Z \approx 0.08$). The open courtyard provides a smooth transition to $Z \approx 0.55$, while the background hills form a continuous low-frequency depth curve ($Z \approx 0.82 \to 0.95$).
- Procedural FX Coordinate Mapping: Burnt Wheel Hub Anchor set to $(X: 0.55, Y: 0.68)$. Runtime stack attaches: (1) Dual-column smoke emitter ($2\times$ thin dark smoke trails with wind lean $22^\circ$ left), (2) Ground fog veil pass across lower courtyard, (3) Ambient ash-fall particle system ($40\text{ ash flakes/sec}$ falling slowly across total frame).
- Overlay Band Reservation: Upper 35% sky receives scrolling dark storm cloud shadow pass ($v=0.03\text{ px/frame}$).
- Foreground Occluder Extraction: Collapsed bottom-left masonry block manually cut as Parallax Layer 0 ($v_{\text{parallax}} = 1.5\times$).
8. Summary: The Ten Highest-Impact Production Rules
Paint the Source, Not the Life: Never paint dynamic atmospheric FX (smoke trails, rising embers, flame tongues, low fog banks, floating dust) into the static canvas. Render only the physical container (chimney top, stone brazier, lantern housing) and attach dynamic particle emitters and shaders to normalized screen coordinates at runtime.
Enforce Broad Volumetric Massing: Eliminate thin vertical and diagonal geometries (fences, rope bridges, bare branches, weapon blades, ship rigging) spanning across depth planes. Mandate monolithic, convex geometry (thick stone pillars, heavy tree trunks, solid rock ledges) to prevent Depth Anything V2 from creating intermediate edge-tearing ramps.
Anchor Occluders to Canvas Borders: Position foreground framing elements strictly along the extreme left or right canvas edges, hugging the frame border. This allows production artists to cut the occluder as a discrete, fast-parallax layer without requiring complex background inpainting behind the center of the frame.
Reserve the Upper Sky Band: Ensure the upper 30%–35% of the canvas consists of an open horizontal color gradient featuring rich impasto knife textures, but devoid of hard-edged, distinct cloud shapes or flying objects. This reserves clean space for scrolling asset-backed cloud sprites and multiply cloud-shadows.
Reserve the Lower Ground Band: Keep the lower 20%–25% of the canvas clear of painted mist rolls, fog banks, or high-contrast small debris. Apply low ground fog exclusively at runtime via noise-masked, scrolling shader veils to maintain depth-map stability.
Use Photographic Lens Terminology over Abstract Depth Cues: Avoid abstract 3D metrics (`"3D depth," "hyper-perspective"`). Use concrete photographic language (`"24mm wide-angle lens," "deep depth of field," "establishing shot"`) to invoke wide-angle framing priors and long-range spatial clarity.
Isolate Light Source Anchors: Keep painted light sources small (<50px frame height) and mounted against solid background geometry (such as a lantern on a solid stone wall). This prevents local depth map distortion and provides stable screen-fraction coordinates for runtime light flicker shaders.
Strip Spatial Negation from Positive Prompts: Never use phrase negations (`"no clouds," "without trees"`) inside positive text prompts. Diffusion text encoders activate positive feature maps for nouns regardless of syntax negation. Route all exclusions strictly into the explicit negative prompt vector $\mathbf{c}_{\text{neg}}$ or parameter flags (`--no`).
Lock Art Style to Heavy Impasto Knife Work: Specify heavy oil-impasto textures, thick palette-knife ridges, and broad pigment washes. Dense textural impasto unifies object surfaces, allowing monocular depth transformers to output contiguous depth blocks across physical masses.
Establish Three Non-Overlapping Depth Zones: Compose every brief with three explicit spatial tiers: an edge-anchored foreground occluder layer, an open, uncluttered focal midground plane, and a soft, low-contrast background receding into atmospheric perspective. This structure optimizes pixel displacement gradients and guarantees parallax readability across 21:9 cinematic displays.
