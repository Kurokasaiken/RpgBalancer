# Visual Fidelity Lab — notes

**The single question:** "Can the EXISTING grammar generate a second screen that
belongs to the same game — WITHOUT copying the reference's composition?"

Route: `/visual-fidelity-lab`. No SurfacePreset, no tier, no registry, no
migrations, no refactor, no changes to WanderlustSurface, no new game components.

**Success target (verifiable, not subjective):** the UI must read as *a finished
production asset, not a well-styled prototype*. We do NOT use "AAA Blizzard" — it
is unfalsifiable. Two gate questions, in order:
1. Rebuild alone: *"If this were a Steam screenshot with no context, would I think
   it's Wanderlust?"*
2. Then the references: *"Are these clearly the same material family?"*

---

# The Material Language (the constitution)

The lab's real discovery is NOT "here is a second nice screen." It is that
**WanderlustSurface (a rectangle) and WanderlustMedalOverlay (a medal) are already
two implementations of ONE shared material recipe** — proof, arrived at without
planning it, that the same grammar produces radically different silhouettes. That
is far stronger than curating reference screenshots.

Governance note: there is no "Reference A / Reference B." There are only
**implementations of the same Material Language**. New components do not *copy* an
existing one; they *implement the recipe*, adapted to their silhouette.

```
Visual Design Philosophy
        ↓
Material Language
        ↓
──────────────── Shared Material Recipe ────────────────
 Body · Micro-Texture · Bevel · Rim · Inner Ring · Field
 Specular · Patina · Wear · AO · Lighting Rules · Imperfection Rules
─────────────────────────────────────────────────────────
        ↓
Implementations
   ├── WanderlustSurface        (panel — rectangle, proven)
   ├── WanderlustMedalOverlay   (precious object — circle, proven)
   ├── InsetPanel               (content well — NEXT proof point)
   ├── Reward Plaque
   ├── Character Frame
   └── buttons · slots · tooltips · badges · bars · windows …
```

## Shared Material Recipe (10 universal layers)

Reverse-engineered from both proven implementations. Every material in the world is
built from these, in order. Shape-specific layers sit ABOVE them (edge-bevel for
rectangles, glass dome for curved objects, corner diamonds for panels) — they are
NOT part of the shared recipe.

| # | Layer | Surface | Medal | Role |
|---|---|---|---|---|
| 1 | **Body** | baseFill + 6-stop directional gradient (TL warm → BR dark) | same | mass |
| 2 | **Micro-texture** | feTurbulence coarse (0.6) + fine (1.4) + worn (0.28), overlay | coarse (0.52) + fine (0.90) | grain |
| 3 | **Bevel** | diagonal linear gradient, face split lit-plane / shadow-plane — **direction follows extrusion sign (see Recessive Inversion)** | same | form |
| 4 | **Rim** | partial stroke, TL lit + bright hairline + BR dim | same | **defines the light** |
| 5 | **Inner ring** | separator of the same material, slightly eroded, lit/shadow lip | same | depth hierarchy |
| 6 | **Field** | dark radial (content "carved" into the frame) — **the recess a Sub-Surface Plate sits INTO (see Depth Hierarchy)** | same | recess |
| 7 | **Specular** | TL hotspot (coherent with the rim) | same | highlight |
| 8 | **Patina** | oxidation blobs at edges, warped (feDisplacementMap) | displaced circles | the object's *story* |
| 9 | **Wear** | linear scratches + bright exposed-metal parallel | manual lines | the object's *history* |
| 10 | **AO** | perimetral dark fringe + corner densification where materials meet | bottom arc¹ | contact |

¹ The medal's bottom-heavy AO is NOT gravity — it is the glass-dome meniscus, a
shape-specific artifact living ABOVE the recipe. It is not a precedent for a
directional AO. The recipe's AO is **Uniform Contact Occlusion** (see below).

## Silhouette-adaptation laws (how the recipe survives a new shape)

The recipe was proven on a rectangle (Surface) and a circle (Medal). Adapting it to
a NEW silhouette (InsetPanel = recessed rectangle) is a *decision*, not a mechanical
copy. Three laws resolve the three fault lines, so every future material inherits the
answer instead of re-deciding it.

**Law A — Depth Hierarchy (no holes inside holes).** Digging a recess inside a recess
collapses into flat visual mud (2026 canon: the 70/30 rule — at most ~30% of a screen
carries strong relief; over-stacking also breaks WCAG 2.2 contrast). So depth is a
short, SUBTLE ladder, never four dramatic steps:

```
Surface Frame (extruded, +Z)
  → Surface Field (excavated void, −Z)
    → InsetPanel = Sub-Surface Plate (a solid, denser/darker slate seated INTO the
      void — a near-flush inserted object, NOT a second excavation)
      → Slot / Badge (micro-recess or stamped incision INTO the plate)
```

The InsetPanel is a **solid plate**, not a deeper hole. Slots and badges are what get
carved/stamped into it afterward.

**Law B — Uniform Contact Occlusion (AO ≠ light, AO ≠ gravity).** For a rectangular
plate, layer 10 is a symmetric inner gradient identical on all 4 sides — it is only
the dust-and-proximity reaction where the plate meets the walls of the recess. Gravity
and light direction are delegated exclusively to bevels (3) and rim/inner-shadows;
AO stays symmetric to structurally anchor the rectangle to the floor (no side may look
"floating"). PBR-in-UI rule: confusing AO with directional light dirties the silhouette.

**Law C — Recessive Inversion (the psychophysical break-point).** The brain reads depth
from a single top-left light. The canonical "TL warm → BR dark" holds ONLY for
positive-extrusion (+Z) geometries (medals, coins, outer frames). For a recessed /
carved object (−Z: InsetPanel, slot excavations) the bevel **inverts at the pixel**:

| | Extruded (+Z) — medal, coin, frame | Recessed (−Z) — InsetPanel, slot |
|---|---|---|
| Top-left inner lip | Lit plane (warm gold) | **Occlusion shadow — warm-dark ~#0a0704** |
| Bottom-right inner lip | Shadow plane (dark bronze) | **Inner highlight — warm gold rim** |

**Temperature is warm on BOTH poles.** The occlusion shadow is warm-dark (desaturated
warm-black), NOT cool/blue — a cool shadow reads as daylight or sci-fi and turns the
metal to plastic. The world's cool/azure signature (the obsidian "azure light leak")
belongs EXCLUSIVELY to the atmospheric ambient field, never to a material's bevel.

## The artistic laws (belong in the Visual Design Philosophy, not here)

**Material First, Effects Last (THE principle — worth more than ten technical rules).**
Define the object's PHYSICAL GEOMETRY first — the recess, the thickness, the incline,
the junctions — and only THEN add light, wear, patina, specular. Effects must never
*create* the form; they only *reveal* it. Blizzard/Riot/Valve/Relic don't think "add a
shadow" — they think "the metal was carved 2mm here," and the shadow is a *consequence*
of that. The panel must not look *rendered*; it must look *constructed*. Applies to
WanderlustSurface, MedalOverlay, InsetPanel, ProgressBar, every future component.

**Single Physical Geometry (LAW).** Every material owns ONE physical geometry.
*Consequence:* all optical phenomena — bevel, AO, rim light, specular, wear, patina —
must DERIVE from that one geometry, never from independent geometries stacked. (The grey
doubled corners on the first MatericPlate were exactly this failure: bevel=shapeA +
AO=shapeB + rim=shapeC + turbulence=shapeD — four slightly different forms overlaid, and
the eye reads the mismatch as a rendering bug. The defect was never "too many layers"; it
was mismatched geometries.)

The law states WHAT must be true, never HOW. **Implementations are swappable and
NON-binding** — SVG lighting (`feDiffuseLighting`/`feSpecularLighting` over a heightfield),
normal map, SDF, baked height map, painted texture, or anything else — all valid *iff*
they honour the law. Never freeze an implementation in the constitution (same reason
WanderlustSurface ≠ SurfacePreset: freeze the principle, not the API — the constitution
must stay true for years while renderers change). Today's most-available in-browser
implementation is SVG lighting; 9-slice / painted assets remain options too, weighed
against the procedural / stable-seed / per-instance philosophy — neither banned nor
mandated.

**Object-identity (THE test).** Every UI element must answer: *"what physical object
is this in the world?"* If it has no answer, it is still a web component. This is the
real leap — from *graphic component* to *physical object*. The target was never "more
texture"; it is transforming stylized web abstractions into fabricated things.
- Quest panel → tablet / inscription
- Character card → medallion / document
- Reward → relic
- Progress → an incised gauge (a channel carved in metal, not a `div` + green fill)
- Slot → a setting/socket (a carved niche with a portrait seated in it, not a dashed card)
- Resource → a container / reserve

**Lighting & luminance hierarchy.** One light direction for the whole world: top-left.
Rim (4), specular (7), bevel lit-plane (3) and AO (10) must all agree with it. Materials
first, light second. AND: light is *narration* — the brightest gold (`#f0cf6a`) is RARE,
reserved for 1–2 focal points (the reward, an alert), never spread everywhere at equal
intensity. Today's flatness is partly that the gold is uniform; hierarchy must come from
luminance, not only text size.

**Tool law — CSS for layout & behaviour, SVG for material & objects.** The flat "web"
feeling came from fighting near-black with CSS `box-shadow` (mathematically invisible on
`#060f16`). The division that matches Medal/Surface:
- **CSS** → flex/grid, responsive, spacing, positioning, interaction states.
- **SVG** → metal, wood, stone, parchment, glass, incisions, bevel, wear, texture.
Progress channel / slot socket / inset surface are *material*, so they are SVG (reusing
`WanderlustSurfaceDefs`), with HTML content riding on top — exactly what WanderlustSurface
already does (`<svg>` material + `.ws-content`).

**Stable Procedural Identity.** *Materials are never hand-authored per instance and
never randomly regenerated. Every material owns a stable procedural identity
generated from a deterministic `materialSeed`.*

- Deterministic (always identical): silhouette, bevel, rim, proportions, light
  direction, primary gradients — the object's *form*.
- Semi-procedural (varies per instance, stable across renders): patina, scratches,
  oxidation, edge wear, micro-deformation — the object's *story*, from the seed.
- Animated (alive): reflections, glow, breathing, particles — the object's *life*.

The seed NEVER changes during the object's life. Quest Detail A (seed 18342) keeps
its scratches every time it reopens; Quest Detail B (seed 9217) has its own. This is
the line between *random* (glitchy, re-rolls every frame) and *procedural* (each
object built and worn individually, once). It removes the classic fantasy-UI tell:
the eye eventually recognizes that every panel has the identical scratches and the
physical-object illusion breaks.

**Current gap (documented, not yet fixed):** `WanderlustSurfaceDefs.tsx` hardcodes
`seed="3/77/42"` in GLOBAL defs → every panel shares one texture. The medal's
scratches are fixed hand-authored coordinates. WanderlustSurface *does* generate
patina/scratches procedurally (`generatePatina(w,h,theme)` /
`generateScratches(w,h,theme)`) but seeds off `w,h,theme`, not an identity. Wiring a
real `materialSeed` is deferred to Consolidation (macro-plan step 5) — it does NOT
block InsetPanel (the 10 layers render fine with a fixed seed).

## Where this sits in the macro-plan (revised phasing)

Governance correction: don't swing from "build a system before proof" to the opposite
error, "build a well-engine because we saw 5 similar cases." We have NOT yet shown that a
single recessed-surface primitive covers inset + slot + progress + plaque without becoming
a giant component full of exceptions. So we extract primitives, we do NOT pre-build an
engine. An engine only earns its existence *after* 2–3 real consumers reveal one.

```
Material Language → Reference implementations → Fidelity Lab → Extract primitives
   (NOT: Material Language → Well Engine → whole game)
```

- **Phase 0 — Visual Consolidation (NOW).** Goal is NOT to build the design system — it
  is to understand and FREEZE the grammar. Output: Material Language documented · lighting
  rules · imperfection rules · material seeds · reference gallery · Fidelity Lab.
- **Phase 1 — Material primitives.** Extract ONLY what recurs, because it recurs (not
  because it's pretty): candidates `MaterialSurface`, `MaterialInset`, `MaterialBadge`,
  `MaterialSlot`, `MaterialBar`, `MaterialPlaque`.
- **Phase 2 — Steam Vertical Slice.** Use those primitives for POI detail, quest,
  character, reward, village elements. NOT yet: translations, editor, huge configs,
  complex registries.
- **Phase 3 — Full Design System / Production Architecture.** i18n, dynamic content,
  config-driven, SurfacePreset, modifiers, rarity, accessibility, responsive, tooling —
  now standing on a *proven* grammar.

## MatericPlate = FIRST material primitive extraction (not an engine)

The SVG rewrite of MatericPlate is Phase-1's first extraction, nothing more. It reuses
`WanderlustSurfaceDefs` (bevel gradients, feTurbulence, `-ws-f-ao`) and mirrors the
CARVED CONTENT WELL that WanderlustSurface already renders (lines ~264–304), with the
bevel polarity inverted (recessive, −Z). The pure-CSS `matericPlate.css` was the wrong
tool (Tool law above) and is being retired. The depth ladder served its purpose — it
taught the perceptual-threshold lesson (two near-blacks are identical) — and is removed.

Same-tool backlog (all *material*, all SVG-reuse, in ROI order — extract as they recur,
do NOT pre-engineer): 1) progress bar → carved channel; 2) crew slot → carved niche +
Medal for filled; 3) inset surface (this); 4) reward plaque → notched variant; 5)
badge/token. World-native list iconography (sigils/ink vs system check/!) is real but
Phase-2/3 asset work, not now.

---

# PART III — THE LIFE LAYER (Motion & Juice)

> **HARD BOUNDARY — read before coding.** The Shared Material Recipe above (form +
> story) is **purely static**. Everything in this Part III is the *third* category of
> Stable Procedural Identity — **life** (reflections, glow, breathing, particles). It
> is NOT part of the Material Recipe, it does NOT touch the InsetPanel material proof,
> and it is delivered ONLY at polish time (macro-plan step 6). Do not fold any of this
> into a material's static layers — that is the exact mistake the warm-teal background
> overlay made: contaminating one layer with another. Material first, static and
> clean; life switched on afterward.

Current state (2026-07): what looks like atmosphere today (e.g. the dots/stars in the
Astrolabe quadrant) is a **static** filter baked into the background. There is no live
particle motion or grain loop yet. This section specs the three effects that turn the
UI from "code" into "a breathing physical object," solo-dev-friendly and
performance-safe.

## 1. Ambient Grain (the alchemical grain in loop)

Imperceptible monochrome noise drifting constantly over oil-canvas and obsidian —
suspended dust in lantern light / old-film grain.

- **Implementation:** one full-screen `pointer-events:none` div, an SVG monochrome
  noise tile at **2×** size. Animate with **`transform: translate` + `steps()`**, NOT
  `background-position`. `transform` stays on the GPU compositor (~zero cost, holds
  60/120 fps incl. Steam Deck); `background-position` forces main-thread repaints.
- **Accessibility (mandatory, not optional — WCAG 2.2 / Steam review passport):**
  gate the whole loop behind `prefers-reduced-motion`; keep opacity very low; mask the
  grain AWAY from text areas so it never erodes contrast.

## 2. Pressure Dust (state transitions)

When a bronze slot ring-locks, or an activity plate drops from above, there is no
physical impact today.

- **Implementation:** a micro CSS particle emitter bound to the landing/snap event —
  spawn 8–10 small gold grains that expand outward and fade (`transform: scale` +
  `opacity: 0`) over ~0.4s. Reads as the UI weighing tons, crushing dust into the table.

## 3. Gold Trail (the marble's wake)

During the Astrolabe spin the ball leaves no trace and is hard to track.

- **Implementation:** motion-blur / gold-dust wake — clone the ball position with a
  small delay (array of prior positions) rendering shrinking circle divs, OR a
  micro-canvas overlay active ONLY during the throw.

**Scope note:** all three are tied to the Astrolabe / drag interactions, NOT to the
InsetPanel. They are step-6 polish material, delivered as time-activated skin
utility classes / micro-stylesheets — never as always-on material layers.

## Why the first spike (`visualGrammarValidation`) was a false positive

1. **Near-isomorphic.** Reference and rebuild had the same section order
   (header → fields → requirements → records). Changing strings + one requirement
   proves relabelling, not generativity.
2. **It skipped the hard part.** It omitted the rich repeated content well
   (slot rack) — exactly where "flat web-app" failure hides.
3. **Both headers were unstyled.** It used `.skin-*` header classes without their
   CSS (see Finding #2), so both columns matched because both were equally broken.

## Reference (frozen, immutable)

`src/pages/v9-skin-sandbox.tsx`, tab "Layout Primitives", at `/v9-skin-sandbox`.
Not touched. Includes Surface(panel,bronze) + AmbientField + composed header +
FieldGroup + RequirementList + RecordList + InsetPanel + ResidentSlotRackSkin.

## Rebuild — "The Forgotten Observatory"

`ForgottenObservatory.tsx`. Deliberately DIFFERENT hierarchy from the reference:
status → three stacked InsetPanel wells (progress / reward / crew) → chronicle →
warnings. Inset-heavy, progress-driven. Content is new (14 days, Ancient Compass,
Astronomy 5 / Wisdom 8, "Scout entered the ruins" / "Signal detected"). Does NOT
import the reference.

**Allowed to improve:** hierarchy, spacing, rhythm, use of insets.
**NOT allowed to change:** palette, frame, material language. Encoded in
`foundationRecipe.ts` (bronze + same materialLayer + `--skin-surface-bg`).

### The measurand: "Required Crew" slot well

Composed **"poor"** — plain divs inside an `InsetPanel`, styled only with existing
`--skin-*` tokens. NO `ResidentSlotRack`, NO new `SlotWell` component. If this
reads as native → the grammar is rich enough for repeated content wells. If it
reads as a flat web-app list → **Finding: a repeated-content-well primitive is
missing.** Building a new slot component now would destroy this datum.

## Gate (order matters)

1. **Rebuild alone** (it is the top of the page): *"If this were a Steam
   screenshot with no context, would I think it's Wanderlust?"*
2. **Then** open the frozen reference: *"Are these clearly the same family?"*

Success = **same visual family**, not identical.

- ✅ Same family → enough evidence to extract Visual Grammar v1
  (Container language: Surface/InsetPanel · Layout language: Field/Requirement/
  Record/Section · Content-well language: **TBD**). Only after that do we decide
  whether SurfacePreset / Tier / registry are needed.
- ❌ Not same family → do NOT fix the rebuild. Document where the bible is not yet
  codified and build the minimum missing brick.

## Findings surfaced BEFORE the gate (from Step 0 inventory + build)

- **Finding #1 — no repeated-content-well primitive.** The only slot rack
  (`ResidentSlotRackSkin`) is a gameplay-wired component (needs view-models,
  `useSkinPreferences`, `useStyleLabTokens`, framer-motion, telemetry). Not a
  visual primitive. The slot well in the rebuild is composed by hand to measure
  the gap.
- **Finding #1b — z-index.** `WanderlustSurface` renders `.ws-content` (z-index 0)
  behind its frame SVG (z-index 1). Reference works only via a local override.
  Replicated page-scoped in `fidelity-header.css`. Fix belongs in the component.
- **Finding #2 — header language is not a shared primitive.** `.skin-plaque` /
  `.skin-title-row` / `.skin-titlesep` / `.skin-close-corner` are defined as a
  LOCAL `<style>` block inside `v9-skin-sandbox.tsx` (~line 1093). Only the
  `--skin-*` tokens are global. Replicated verbatim in `fidelity-header.css`
  (existing tokens only). This is a second un-extracted "language" alongside the
  slot well.

## Finding #3 — well background is token-driven; do NOT overlay

`--skin-surface-bg` ALREADY carries the V9 anima:
`radial-gradient(circle at 0% 0%, rgba(0,229,255,0.15) 0%, transparent 50%), #060f16`
(azure light leak + sacred obsidian). An early hand-composed warm-teal overlay on
top of it muddied it into flat dark-mode grey — the grammar was fine, the overlay
was the bug. **Extraction rule: the well background IS this token; no per-component
overlay.** Open question to reconcile at extraction: canonical leak position —
token uses top-LEFT (`0% 0%`); design intent ("raining from above") uses top-CENTER
(`50% -10%`), currently applied in the lab. Also standardize the inner vignette
(`inset 0 0 60px rgba(2,6,10,0.8)`) as part of the well token.

## Inventory (Step 0)

| Primitive | Verdict |
|---|---|
| WanderlustSurface | reuse (independent) |
| WanderlustAmbientField | reuse (independent) |
| WanderlustFieldGroup / Field / RequirementList / RecordList / Divider / SectionHeader / StatBar | reuse (independent, barrel) |
| InsetPanel | reuse (independent, CSS-only, token-driven) |
| Header language (plaque/title-row/titlesep/close) | **finding — sandbox-local CSS** |
| ResidentSlotRackSkin | **finding — gameplay-wired, not a visual primitive** |
