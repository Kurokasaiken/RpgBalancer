# PLAN-052: Quest scene depth-staging authoring contract

**Status:** `draft` — provisional P8 mapping passes; plan intent review pending before baptism  
**Desiderata:** v34 FROZEN (slice hash `e976ade0c1494f455b7d446e001f971a762b5d1f9b5d529c8d12d9948f44ce1d`)  
**Richiesta:** R-222; extension of R-213 / PLAN-046, complementary to PLAN-050  
**Parent:** PLAN-046 (depth-parallax engine); PLAN-050 (Goblin showcase and juice)

## Intent

Make every newly authored quest-phase image deliberately usable by the existing
single-image depth-map parallax renderer. Before generation, its art brief must
name one or more scene-specific visual anchors that can read at distinct depth
from the focal subject and background.

This is **depth staging inside one coherent painted image**, not a request for
separate generated layers, a depth-colored image, or an N-layer asset pipeline.
The depth map remains derived from the image and runtime motion remains
in-place pixel deformation, with edge safety and the v34 fallback behavior.

The contract must prevent the known failure mode where attractive but thin,
isolated objects (e.g. the agguato-foresta pole) become fragile parallax
anchors. It must not turn every scene into the same "tree on the left" template.

## Research grounding

Findings used to shape the contract:

- 2.5D / multiplane guidance consistently relies on distinct overlapping
  foreground, middle-ground, and background forms; near elements move more than
  distant ones. Larger source images and clear object boundaries help masking
  and motion work. Sources:
  - Pat David, *2.5D Parallax Animated Photo Tutorial*:
    https://patdavid.net/2014/02/25d-parallax-animated-photo-tutorial/
  - Walt Disney Family Museum, *Multiplane Camera*:
    https://www.waltdisney.org/blog/machine-imagination-walt-disneys-pinocchio
  - Toon Boom Harmony, *About Multiplane*:
    https://docs.toonboom.com/help/harmony-25/advanced/staging/about-multiplane.html
- Painterly atmospheric perspective is communicated through a combination of
  value, chroma, edge softness, and detail—not hue alone. Grayscale grouping is
  a useful diagnostic, not a universal palette prescription. Source:
  Art Prof, *Atmospheric Perspective*:
  https://artprof.org/learn/fundamentals/perpective/atmospheric-perspective/
- Depth Anything V2 provides relative depth, not physical depth units, and
  reports finer, more robust predictions than its predecessor; it does not
  make a depth map semantically correct for a stylized painting. Reflective and
  transparent surfaces remain ambiguous cases for monocular depth estimation.
  Sources:
  - Yang et al., *Depth Anything V2*, NeurIPS 2024:
    https://arxiv.org/abs/2406.09414
  - TRICKY 2025 challenge, specular and transparent surfaces:
    https://openaccess.thecvf.com/content/ICCV2025W/TRICKY/papers/Ramirez_TRICKY_2025_Challenge_on_Monocular_Depth_from_Images_of_Specular_ICCVW_2025_paper.pdf

These are authoring heuristics, not guarantees from the model. The bake and
motion review remain authoritative for whether a specific image works.

## Authoring contract

Each quest-scene brief names:

1. **Dramatic function and focal subject** — what the player should read first.
2. **Parallax anchor(s)** — one or more concrete, scene-motivated forms, their
   approximate image region, and their depth relation to the focal subject.
3. **Depth staging** — the intended near / focal / far ordering and the
   overlaps or contours that make that ordering legible.
4. **Value and atmosphere plan** — intended grayscale grouping and any
   atmospheric perspective that fits the lighting and art direction; no
   mandatory hue or fixed RGB scheme.
5. **Risk notes** — thin boundaries, reflections, transparency, repeated
   patterns, painted smoke/light, or important forms crossing depth edges.
6. **Runtime separation** — identify effects intended as separate atmospheric
   overlays rather than falsely reading them as solid geometry in the baked
   depth map.

Good anchor candidates include broad edge-framing tree trunks, rock ledges,
root masses, broken masonry, a grounded cart or barricade, or a strong
foreground terrain lip. They are examples, not a repeated scene template.
Mid-ground focal subjects should usually remain on a stable, readable depth
plane. Distant ridges, treelines, architecture, and canopy masses can form
background structure.

Avoid choosing a thin isolated pole, rope, spear, twig, or grass blade as the
only anchor; avoid placing a face or critical silhouette across a sharp depth
boundary; do not rely on reflective/transparent surfaces or dense repeated
patterns for the depth cue. If a delicate foreground is narratively essential,
flag it as a bake-review risk; a manual hero cutout remains the existing
Director-selected exception, not a new default pipeline.

### Color and value

- Do not use special colors to encode depth. The image stays a natural,
  painterly scene and the depth map is generated separately.
- Prefer readable value/contrast grouping and overlap. Near forms may carry
  crisper edges and more local contrast; distant forms may lose contrast,
  saturation, and detail when consistent with the scene's lighting.
- Cooler/lighter distance is an optional atmospheric convention, not a rule.
  Night scenes, firelight, snow, magical color, and the established palette may
  require another treatment.
- Squint/grayscale review is a diagnostic: if the intended planes merge
  completely, revise the composition or explicitly flag the uncertainty.

## Scope and invariants

- Applies to new quest-phase scene art and its authored generation brief.
- Does not regenerate, retouch, or rebake existing art in this plan.
- Does not require separate image layers, prompt-dependent layered output,
  systematic raster slicing, AI video, or a new image-generation engine.
- Does not alter runtime camera, shader, quest narrative, or gameplay.
- Preserves config-first manifest mapping, reduced-motion behavior, fallback,
  and edge-safety certification from v34.
- Quest-scene commissioning must use the brief before generation. The exact
  enforcement point depends on the workflow audit in T-001: integrate into an
  existing common entry point if one exists; otherwise provide a lightweight
  brief validator, not another generator.

**Visual-fork skip:** this plan defines a text-only authoring/validation
contract and generates no image or UI representation. Scene-specific
composition remains authored per brief; any future task that produces
materially different visual candidates must use PLAN-047's visual-fork gate.

## Tasks

| ID | Task | Acceptance |
|---|---|---|
| T-001 | Audit and document the actual authoring/generation paths used for quest scene images; identify the narrowest shared pre-generation gate. | Workflow map names supported paths and their owners; no assumption that the UI mockup generator is the quest-art pipeline. |
| T-002 | Add a reusable quest-scene depth-staging brief/template and prompt clause, keeping the scene-specific fields separate from generic creature, UI, and world-art prompts. | Every new quest-scene brief has focal subject, ≥1 named parallax anchor, depth relation, value/atmosphere plan, and risk notes; no fixed repeated anchor or color code. |
| T-003 | Wire the contract into the existing quest-image authoring path; if no common prompt entry point exists, add a small validator for the brief fields. | A missing anchor or depth relation is rejected before image generation; unrelated image-generation paths remain unchanged. |
| T-004 | Add text-only examples across distinct dramatic functions (e.g. discovery, observation, confrontation) and verify the template/validator. | Examples use different diegetic anchors and obey v34's single-image and no-N-layer constraints; positive and missing-field cases are tested. |
| T-005 | Publish the bake-review checklist for each commissioned image: depth-map semantics, edge/halo behavior, silhouette integrity, and a headless camera-motion capture. | Checklist includes explicit reject conditions; asset acceptance still requires a Director eye-check under T-04. |

## Closure contract

- **OB-1** A quest-scene brief requires at least one scene-specific parallax
  anchor, its depth relationship, and an authored focal subject.
- **OB-2** The prompt/brief preserves a single coherent painting and rejects
  separate-layer generation, depth-color encoding, and thin isolated sole
  anchors; atmospheric overlays are identified separately from solid depth
  geometry.
- **OB-3** Value/color guidance is conditional and painterly; no fixed RGB or
  universal near-dark/far-blue rule is embedded.
- **OB-4** The pre-generation path or validator rejects incomplete briefs and
  leaves non-quest image workflows unchanged.
- **OB-5** Text-only examples cover distinct dramatic functions without
  repeating one composition; validator tests pass.
- **OB-6** Bake review requires headless motion evidence and a Director
  human-eye gate before any produced asset is accepted. Metrics alone cannot
  close the visual claim (T-04).
- **OB-7** The contract does not alter beat-camera ownership or cutout policy:
  camera remains config-driven in `questTheatreFx`, and manual hero cutouts
  remain a small Director-selected exception.
- **Expected checks:** governance-docs surface has no mechanical command in
  `.mw/surface-map.json`; plan/brief validator tests (if created), scoped lint,
  `npm run build:check`, and `npm run closure:lint`. Bundle obligations and
  evidence are instantiated at execution.

## Open implementation detail

The repository contains a general mockup workflow (`rpg-gen-mockup.py` and the
`mockup-generator` skill), but no dedicated quest-scene image-generation
entrypoint was found in the initial search. T-001 must confirm whether
quest-scene art uses that workflow or is commissioned elsewhere before T-003
chooses an enforcement point.

## Plan disposition draft (v34)

The proposed mapping is task/gate-only; no item is silently dropped:

| Slice item | Proposed disposition | Obligation |
|---|---|---|
| v34.item-1 — systematic cinematic quality on present/future art | task | OB-1 |
| v34.item-2 — depth-map parallax in-place | task | OB-1, OB-6 |
| v34.item-3 — beat-directed camera | gate: do not change camera; preserve existing `questTheatreFx` ownership | OB-7 |
| v34.item-4 — separable atmospheric overlays | gate: identify overlay candidates without baking them as false geometry | OB-2 |
| v34.item-5 — Director-selected manual hero cutouts | gate: this workflow does not promote cutouts to a systematic generation path | OB-7 |
| v34.item-6 — exclusions for N-layer slicing/layered-by-prompt/video | gate | OB-2 |

This mapping is provisional. The mechanical P8 preview passes; the v33 intent
review remains outstanding. Do not baptize while the intent review reports
blocked, ambiguous, or missing evidence.

## Research limitations

The web search found useful technical/art-school references. The initial
external AI review was unavailable: Codex returned a usage-limit response and
Gemini returned HTTP 429. A subsequent plan critique through
`mw-critique-plan.py` also timed out for ChatGPT, Claude, and DeepSeek
(`.mw/runs/plan-052-depth-staging/intent-review/critique-report.md`). This draft
is therefore a synthesis, not a multi-provider consensus; intent review remains
open.
