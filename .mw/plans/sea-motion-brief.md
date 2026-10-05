# Brief — Making a painted sea move, on a baked full-canvas world map

**Purpose:** this document is written to be pasted, whole, into an external AI (ChatGPT, Claude,
Gemini, whatever) that has no access to the repository. Everything needed to reason about the
problem is inlined: the artwork's measured properties, the engine constraints, the full history of
what was tried and why it failed, and the exact questions we want answered.

**Written:** 2026-09-08 · **Project:** RPG / Idle Village, "Wanderlust" world map
**Related:** desiderata v19 (FROZEN), request R-056 ("the map does not breathe"), request R-066.

---

## 1. The one-sentence problem

We have a hand-painted, watercolour-style fantasy world map, shipped as a stack of pre-rendered
full-canvas image layers. The sea is one of those layers — a flat painting. The Director wants the
sea to **look slightly alive**: not animated water, not a simulation, just enough motion that the
map does not read as a dead JPEG. Multiple attempts have failed. We want to know whether the
remaining approaches are worth building, or whether the premise itself is wrong.

## 2. What the map actually is

- A single painting, authored in Photoshop, exported as **24 separate full-canvas layers**
  (background, sea, islands, mountains, forests, village, borders, frame …).
- Manifest canvas: **4240 × 2828** world pixels. Every layer is declared at `offsetX: 0`,
  `offsetY: 0`, `scale: 1`, and each layer file is stretched to fill that canvas. This invariant is
  guarded by a frozen test: any layer with a non-zero offset or a non-1 scale fails the build.
- Layer files are **WebP**. The sea layer (`Mare.webp`) is **3072 × 2049**, 264 KB. The whole layer
  stack is 9.5 MB.
- The sea layer's alpha is its own coastline: opaque where there is water, transparent where the
  land mass sits. Derived masks are generated from that alpha offline:
  `sea_mask.webp`, `land_mask.webp`, `shallow_mask.webp`, and a `points.json` of sampled
  coordinates classified as `coast` / `land` / `sea` / `sky` / `wonder`.
- Rendering is **DOM**, not canvas: each layer is an `<img>` in a stack, inside a pan/zoom box.
  There is a WebGL/Pixi path available but currently unused for the surface.
- The whole thing runs in a browser and, in production, inside a **Tauri WebView** on modest
  hardware. Frame budget is tight and must be measured there, not in desktop Chrome.

### 2.1 Measured properties of the sea painting — the crucial data

We sampled four regions of `Mare.webp` (luminance 0–255, only fully-opaque water pixels):

| Region | size (src px) | mean L | std dev | min–max | **mean abs ΔL over 8 px** |
|---|---|---|---|---|---|
| Open sea, NW band | 369 × 119 | 116.9 | 3.15 | 109–128 | **0.77** |
| West strip | 154 × 410 | 136.1 | 4.36 | 123–144 | **0.44** |
| East strait (2 coasts) | 415 × 492 | 147.0 | 5.16 | 84–182 | **1.14** |
| Small south island | 492 × 307 | 140.6 | 7.67 | 77–174 | **1.79** |

Read the last column carefully. **Over a distance of 8 pixels, the open sea changes brightness by
less than one unit out of 255.** The painted open water is, numerically, a flat field. The only
structure in the whole sea layer is the ink linework around coastlines and a few painted ripple
rings near islands.

This single fact explains every failure below.

## 3. Hard constraints

1. **Full-canvas layers cannot be transformed.** Translating, scaling or rotating a baked
   4240 × 2828 layer with CSS shifts the crop of the painting relative to its neighbours: seams
   open, bare canvas shows at the edges, and the painting slides against its own coastline. This is
   not a tuning issue — the layers are registered to each other pixel-for-pixel. A previous
   "breathing" attempt built a per-layer transform map and it had to be shipped deliberately empty.
2. **No parallax on baked layers**, for the same reason. Parallax is permitted only on *separable*
   overlays (clouds, shadows, light, tokens) that are not part of the registered stack.
3. **`prefers-reduced-motion` must disable every effect.**
4. **Custom shaders are allowed but conditionally**: they require a DOM fallback, a profiling log
   (frame time, DPR, device), and explicit sign-off. They are not forbidden — they are expensive to
   justify.
5. **Config-first**: every new tunable parameter is a schema-validated config value, not a
   hardcoded number.
6. **`requestAnimationFrame` is unreliable in one of our dev surfaces** (a preview pane where the
   document is hidden freezes RAF at t=0). Effects built on CSS keyframes, SMIL, or `setInterval`
   keep running. This is a dev-tooling quirk, not a production constraint, but it has shaped the
   codebase: existing animation code deliberately avoids RAF.
7. The art direction is **painted, hand-drawn, quiet**. Anything that reads as "shader", "glass",
   "sci-fi" or "video game water" is wrong. The reference register is an illustrated atlas, not a
   game ocean.

## 4. What has already been tried, and exactly how it failed

**(a) WebGL displacement filter (Pixi `DisplacementFilter`) over the sea.**
Shipped, then removed. It cost a WebGL context and a ticker and rendered as *nothing*. Post-mortem
in the code: "shifting the sampling coordinates of a low-contrast baked sea moves nothing an eye
can catch". The measurement in §2.1 confirms this quantitatively — displacing by *n* pixels can
only change a pixel's luminance by roughly *n* × 0.1 units.

**(b) Per-layer CSS transform "breathing".**
Abandoned before shipping, for the seam/registration reason in §3.1. The mechanism was later
retried as **opacity pulsing** instead of geometric motion (see the recent commit history:
magnitude raised from 1 px to 5 px, then scale abandoned for opacity, then the formula found to be
inverted, then tuned to an 80–100 % opacity range). It works in the sense that something changes;
it is not the same thing as motion.

**(c) `WorldSurfaceWaterField` — two scrolling micro-detail tiles plus 12 pulsing "light pools",
tinted from the sea's own average colour (rgb 110,136,141).**
Built, judged insufficient, and left **disabled by default**. The failure mode: at map zoom, tiled
detail either disappears entirely or reveals its tiling.

**(d) `WorldSurfaceWaves` — the current shipped approach, and the only one that works.**
Painted wave sprites (`onda1`, `onda2`, `ondine1`, `schiuma1`) placed at coordinates sampled from
the real coastline, masked by `sea_mask`, each fading in over ~2 s, drifting 3 world px, fading
out, on a 30 s cycle with scattered negative delays so only a handful show at once. No RAF: a
single CSS keyframe. **Currently only 7 marks** across a 4240 px map, though the generator script
that produced them was written for 150.

**Why (d) works and (a)–(c) do not:** the wave sprites *bring their own painted texture*. They do
not attempt to manipulate the existing paint. Everything else tries to modulate a field that has no
structure to modulate.

**(e) Also present and shipped:** coastal foam (a scrolling, pulsing texture masked to the
shoreline, opacity 0.10–0.22, 90 s drift), cloud shadows, birds, and rare "sea wonder" creature
events. So the map is not motionless — but the *water itself* is.

## 5. The comparison instrument that now exists

A lab page renders **12 candidate techniques as small tiles, side by side, showing only the sea
layer** — no clouds, no foam, no frame, no camera. Four selectable crops (two open-water, one
strait, one island). Two controls that matter:

- **Zoom**: screen pixels per source pixel, defaulting to 0.33 (the real map scale). All
  pixel-based effect parameters scale with it, so tiles are comparable.
- **Gain**: an intensity multiplier up to 4× beyond any plausible production value. Its purpose is
  diagnostic: it separates *"too subtle to see"* from *"there is nothing to see"*.

The 12 tiles: static control · painted dashes · travelling light band · displacement ripple at
three strengths (`feTurbulence` + `feDisplacementMap`, animated via SMIL) · second copy of the sea
drifting in soft-light · scrolling micro-detail tiles · pulsing specular glints · shimmer through a
scrolling mask · colour-only pulse · combination.

**Result so far:** on the open-water crops, at 4× gain, only the painted dashes are visible. The
displacement variants are indistinguishable from the static control. On the island crop — where the
painting has ink linework — the same filters finally have something to act on.

## 6. The question we are actually asking

Given a **flat, low-contrast, hand-painted water field** that **cannot be geometrically
transformed** and must stay **stylistically quiet**, what techniques can make it read as slightly
alive?

We can see three families, and we suspect the list is incomplete:

1. **Move the matter** — deform the paint itself. Measurably dead on this artwork unless we first
   give the water texture to deform.
2. **Move the light** — leave geometry alone, animate luminance: travelling specular bands, slow
   caustic pooling, breathing colour temperature. Cheap, safe, but risks reading as "glass".
3. **Move objects on the water** — painted sprites with their own texture, the only proven
   approach. Risks reading as decoration scattered on a still surface rather than as a living sea.

### Specific questions

1. **Is there a fourth family we have not named?** Techniques from cartography, animated
   illustration, cel animation, or 2D game art that create the impression of living water on
   deliberately flat painted surfaces.
2. **If the answer is "give the water texture first"** — what is the right texture? A painted
   swell pattern baked into the sea layer? A separate, registered detail layer? Generated
   procedurally offline to match the artist's hand? And how do you keep it from reading as tiling
   or as noise at a map zoom of 0.33?
3. **Multi-frame approaches.** Exporting 2–4 warped variants of the sea layer and cross-fading
   between them avoids all runtime cost and all transform problems. Our worry is that cross-fading
   reads as *pulsing*, not as *motion*. Is there a known way to make a 3-frame loop of a painted
   surface read as directional movement rather than throbbing? (Consider: how traditional
   animation and ukiyo-e-influenced game art cycle water in 3–4 frames.)
4. **Perceptual thresholds.** At map scale, with a mean local contrast under 1/255, what is the
   minimum luminance modulation and the minimum spatial frequency at which a human reliably
   perceives "movement" rather than "flicker"? We would rather derive the target from perception
   than tune blindly.
5. **The honest alternative.** Is it defensible to conclude that open water on this map should
   simply stay still, and that all motion belongs at the coastlines, where the painting already has
   structure? What would be lost?
6. **Cost.** For each proposal: what does it cost in a DOM-based renderer inside a WebView on
   modest hardware, and what is the DOM fallback if it needs GPU?

### What a useful answer looks like

Concrete techniques with a named mechanism, an honest statement of what each one requires from the
artwork, and the strongest argument *against* each. We are not looking for a list of effects — we
are looking for the one or two that survive the constraint that the paint is flat and cannot be
moved. If your recommendation requires changing the artwork, say so plainly: that is an acceptable
answer, it just has a different cost owner.

### What we are not asking for

- Realistic water simulation, Gerstner waves, FFT oceans, or anything that reads as 3D.
- Anything requiring the full-canvas layers to be translated, scaled, or parallaxed.
- "Just add a shader" without saying what the shader operates on, given §2.1.

## 7. Open items on our side, stated for completeness

- The frozen alignment test is currently red (25 of 49): it validates layer dimensions by reading a
  PNG IHDR header, while the shipped assets are WebP. It must be repaired before any asset work.
- No technique has been profiled on the Tauri WebView yet.
- The Director has not yet chosen between the three families above; this brief exists to widen the
  option space before that choice.
