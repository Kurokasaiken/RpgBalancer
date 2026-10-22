# Convergent synthesis — single-plate 2.5D quest-scene prompt contract

**Date:** 2026-10-22 · **Sources:** 5 independent deep-research reports
(`deepseek`, `grok`, `claude`, `gemini`, `chatgpt` — same folder, verbatim).
This document distills convergence and disagreement; it does not replace the
source reports. Evidence labels: **[V]** verified (official docs, papers,
observed production behavior) · **[I]** engineering inference · **[A]** anecdotal ·
**[H]** hypothesis pending our own A/B test.

## 1. The pipeline (fixed, restated)

One painted image per scene → Depth Anything V2 baked relative map → in-place
pixel-deformation parallax → procedural FX anchored to image-fraction
coordinates → asset-backed overlay bands (clouds, cloud-shadows, birds, fog
veils) → optional hand-cut edge occluder as fast layer. No N-layer slicing, no
layered-by-prompt output, no AI video.

**Why composition must be authored, not discovered:** the depth estimator emits
a *transition ramp*, not a step function, at object boundaries. Pixels on the
edge of a thin object receive intermediate Z and smear when displaced — this is
the agguato-foresta pole failure, now explained mechanically (Gemini, ChatGPT
citing Depth Anything V2 + 3D-Cinemagraphy hole-emergence literature). **[V]**

## 2. The convergent contract (unanimous across all 5 reports)

1. **Three non-overlapping depth zones**, named as visible geometry — never the
   word "depth" alone: edge-anchored near mass → open focal midground → small,
   cool, low-contrast far. Use scale + overlap + contrast together. **[I,V]**
2. **One broad edge occluder**, cropped by and physically continuing beyond a
   frame edge; continuous convex silhouette; kept at ~one depth plateau; does
   not cross the focal opening. Rocks, ledges, thick trunks, solid arches,
   gate leaves — not fences, poles, twigs, lattices, ropes. **[V local obs + I]**
3. **Paint the source, not the life.** Chimney/lantern housing/fire-pit yes;
   smoke column, glow halo, embers, fog banks, cloud shapes, birds — no.
   Runtime supplies the motion. **[V fixed-pipeline rule]**
4. **Reserved bands are calm, not blank.** "Empty" = low-frequency gradient +
   impasto texture, no recognizable shapes. A sterile void reads as unfinished;
   painted clouds/birds/fog read as duplicates under scrolling overlays.
   **Name the emptiness positively.** **[I]**
5. **Atmospheric perspective in the far plane only** — global blur destroys the
   occluder silhouette and FX anchors. **[I]**
6. **No thin/tall structures crossing depth transitions** — the single most
   dangerous prompt-level feature (fences, spears, tent guy-lines, rigging,
   bare branches, foliage lattice against sky). **[V local obs]**
7. **One focal subject, composition first.** Spatial clauses lead the prompt;
   style follows. Multiple co-equal subjects collapse the depth read. **[I]**
8. **Image-space / camera-view placement**, not object-relative: "cropped by
   the right frame edge", "upper fifth" — never "to the left of the gate".
   (ChatGPT cites FoR-T2I: object-relative frames measurably worse.) **[V bench]**
9. **Exclusions matched to the generator's actual mechanism** — see §4. And:
   negative fields are *global, not regional* — `--no branches` kills the wanted
   edge bough; negate `fine twig lattice`, not `branches`. **[V docs]**
10. **Approve for runtime behavior, not static beauty** — score at final crop &
    thumbnail, then validate against the baked depth map + parallax preview.
    **[V local process]**

## 3. Numeric budgets (converged ranges)

| Budget | deepseek | grok | claude | gemini | chatgpt | **Contract default** |
|---|---|---|---|---|---|---|
| Sky band (top) | ~30% | ~30% | 30–35% | 30–35% | 15–25% | **20–30%**, scene-tunable |
| Ground band (bottom) | ~15% | ~15% | 15–25% | 20–25% | 8–15% | **10–15%** (25% if fog-led) |
| Edge occluder width | edge-third | edge | ≤15–18% | 15% | 10–20% | **10–20% width** |
| Focal opening | center | — | central clear | 40–50% | 35–60% | **~35–50%** |
| Light anchor size | small | small | small | <3–5% h, <50px | small, readable | **<5% height, readable at thumb** |
| FX anchors per scene | 1–2 | 1–2 | 1–2 | 1–2 | 1 primary | **1–2, one primary** |

New constraint (Gemini): an FX anchor must sit **against a solid background
plane** (lantern on a wall), not straddle a depth boundary — the depth map must
assign the anchor a stable Z for the emitter to lock. **[I]**

## 4. Per-generator routing

| Generator | Exclusion mechanism | 21:9 / ratio | Notes |
|---|---|---|---|
| Gemini / Nano Banana | plain-language exclusions + positive-absence phrasing | API exposes 21:9 on supported models **[V]** | Primary production path. Narrative composition clauses, early layout tokens |
| GPT Image | labeled `CONSTRAINTS` section in-prompt | multiple-of-16 dims; 3168×1320 may fail → 2560×1088+upscale or 3168×1328 exp. | Re-prompter invents people/props; strict constraints needed |
| Imagen (Vertex) | dedicated `negative_prompt` field (concept lists, not "do not…") | no native 21:9 → gen 16:9 + crop, recompute bands | Negative availability is surface-dependent **[H]** |
| Midjourney | `--no` flag | `--ar 21:9`; very wide ratios less predictable | Compact prompt; lower `--stylize` when placement matters |
| SDXL | `negative_prompt` | flexible | Optional ControlNet Canny/depth greybox — conditioning, not layer export |
| FLUX.1/.2 | **no native negative prompt** — positive state descriptions only | per endpoint | Regional attention masking possible; don't paste SDXL negatives |

Universal rule (all 5): **never reuse one negative string across generators.**

## 5. Cue trust hierarchy (ChatGPT, endorsed by others)

Hard controls (ratio param, canvas, ControlNet) > named object + image-space
location > relative scale & overlap > value/contrast separation > camera/lens
language > abstract labels ("depth", "layered", "cinematic").

**Divergence flagged:** Gemini treats lens language ("24mm", "deep focus") as a
verified strong prior; ChatGPT (citing OpenAI docs) calls it seasoning, not
geometry control. Contract position: **use it, but never as the depth cue
itself** — geometry comes from named masses and their placement. **[H until tested]**

## 6. Aspect-ratio spec mismatch (ChatGPT, unresolved — decision needed)

3168×1320 = **2.4:1 (12:5), not 21:9** (2.333:1). True 21:9 = 3080×1320 or
3168×1358. Runtime target is 2.4:1. Prompts currently say "21:9". A composition
correct at one ratio can lose the occluder or band area when cropped to the
other. **Open decision: declare canonical ratio (likely 2.4:1) and say it in
prompts — or accept 21:9 wording and review at the 2.4:1 production crop.**

## 7. What NOT to paint (consolidated "life exclusion" list)

- Dynamic FX: smoke columns, embers/sparks, flame tongues, glow halos/bloom,
  painted fog/mist rolls, dust motes, distinct cloud silhouettes, birds.
- Thin cross-depth geometry: fences, wires, ropes, tent guy-lines, spears,
  poles, rigging, bare twig networks, foliage lattice against sky, pickets.
- In reserved bands: any high-contrast silhouette, hard-edged shape, or
  recognizable object (band = gradient + texture only).
- FX anchors: big bright sources (>5% height), anchors on thin posts against
  sky, multiple competing warm sources.
- Always: people, party, creatures, text, signatures, watermarks; global
  "hyper-detailed everywhere" (destroys hierarchy).

## 8. Life plan schema (merged from Gemini's Technical Execution Strategy + brief slots)

For each painted element that will support runtime life:

| Field | Example |
|---|---|
| Painted source | stone fire-pit with dark coals |
| Runtime effect | smoke column + embers + flicker point-light |
| Anchor position (fraction) | x 0.48, y 0.58 |
| Depth behavior | sits on midground plateau, solid backing |
| Band/overlap | emitter column rises into reserved sky band — keep band clear |
| Why (the reasoning) | embers painted would smear in warp; pit survives as broad mass |

This "because" clause is the Director's original ask: the brief explains *why*
each compositional choice exists, so future prompt edits don't silently break
the runtime contract.

## 9. Validation protocol (fused: ChatGPT §10 + Claude §8 + all reports' 4–8 roll budget)

**Pre-generation:** score the prompt against the 12-check checklist (ChatGPT
§8 = most operational). Stop-rule: don't spend candidates if occluder / focal
opening / FX anchor / bands score 0.

**Post-generation scorecard (0–20):** occluder 0–3 · depth planes 0–3 · anchor
0–2 · bands 0–4 · parallax risk 0–4 · exclusions/style 0–4. Approve ≥15 with
no zero on occluder/anchor/bands. Then bake the depth map and preview parallax —
image quality is not parallax proof.

**Ablation (tests the [H] claims):** same brief, three arms —
A: abstract ("cinematic deep environment, foreground/midground/background")
B: named planes ("trunk cropped by left edge; clear camp middle; small cool ridge")
C: B + scale/contrast/band clauses.
4–8 candidates total (2A+2B at minimum; 3A+3B+2C preferred), same ratio/quality,
record per-output: provider/version/UI-API/ratio/dims/prompt-version/seed/scores/
failures/decision. Success = ≥1 image passes all pipeline gates; then depth-map
preview on the winner.

## 10. What is still hypothesis

- Exact clause phrasings and band percentages → **[H]** until the ablation runs.
- Lens-language strength → **[H]** (provider disagreement).
- Order-of-tokens bias (Grok/Gemini) → **[I]** plausible, cheap to adopt: put the
  occluder/layout clause first.
- Imagen `negative_prompt` on the access surface we'd actually use → **[H]** verify.
- "Horizontal flip in post fixes wrong-edge placement" (Claude) → **[I]** cheap and safe.
