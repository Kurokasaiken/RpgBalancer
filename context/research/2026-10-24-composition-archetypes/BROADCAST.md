# Broadcast: broadcast-20261023-231759

**Prompt:** You are a senior game director at a AAA studio, expert in systems design and balancing. You are in a free strategic discussion with the project director — wide scope, direction, future of the game. Your task is to think with him, not to close tasks.

Inputs:
- QUESTION: {question}
- CONTEXT: {context}

Rules:
- Think as a direction partner: challenge assumptions, bring genre and state-of-the-art perspective, name trade-offs explicitly.
- Keep the macro scale: direction and macro plans, not implementation detail.
- Distinguish clearly: decided facts vs proposals vs open questions.
- Do a web search if the topic touches recent releases, genre trends, or post-cutoff design discourse.
- If a bounded, actionable topic emerges, mark it explicitly as a desiderata candidate — do not start planning it.

Output format:
- Free-form discussion; end with a short "Seeds for pipeline" list of bounded topics if any emerged.

CONTEXT — We author single painted images (oil-impasto style, 2.4:1 ultra-wide)
for a quest "theatre" in an RPG. Each image is rendered with a baked monocular
depth map (Depth Anything V2), an in-place parallax warp, camera moves
(push-in, lateral pan, slow creep, holds) and procedural ambient layers
(smoke, glow, fog, fireflies, shafts). We discovered our scenes all converge
on ONE skeleton: two dark masses anchored at frame edges + a diagonal lead
into depth ("the tunnel/funnel"). It works but repeats — every scene looks
alike. We need a *taxonomy of composition archetypes* so consecutive scenes
deliberately differ while still feeding the parallax (which needs: near-plane
occluders with clean silhouettes, staggered mid-ground steps, far focal zone,
low-conflict regions for overlays).

RESEARCH QUESTION — Survey how the following media solve compositional
VARIETY and depth staging in a single static frame, and distill a named
archetype vocabulary we can adopt:

1. CLASSICAL PAINTING — the repoussoir technique (Claude Lorrain, Ruysdael,
   Constable, Hudson River School), coulisse, the foreground/mid/background
   triad, and how masters varied it (single-side repoussoir, framing
   overhangs, aerial perspective without occluders).
2. CINEMATOGRAPHY — frame-within-frame, "dirty" foregrounds, over-shoulder
   elements, deep-staging compositions (Wyler, Welles), anamorphic framing,
   and which shot grammar each serves (dolly-in vs lateral dolly vs pan vs
   static hold). How DPs keep consecutive shots from repeating one formula.
3. PHOTOGRAPHY — leading lines, layering, natural framing devices,
   negative-space composition, horizon-height rules.
4. COMICS/MANGA — establishing panels and depth staging in a single panel;
   camera-angle vocabulary (bird's eye, worm's eye, over-shoulder); how page
   flow alternates panel "shot types" to avoid monotony; splash vs tight.
5. POSTERS / KEY ART — theatrical one-sheet composition (Struzan-style
   pyramids, scale hierarchy, hero-vs-vista layouts) and movie-poster depth
   tricks that could transfer to a painted scene.
6. GAME ENVIRONMENT ART / CONCEPT ART — vista design, "hero landmark"
   staging, level-composition archetypes used in AAA concept art briefs.
7. THEATRICAL SCENOGRAPHY — wing flats, sightlines, proscenium depth layers
   (the literal ancestor of our edge occluders).
8. TOWNSCAPE/ARCHITECTURE — Gordon Cullen's "serial vision": how a sequence
   of framed views is varied on a walk (the exact "consecutive frames must
   differ" problem we have).
9. VISUAL NOVELS / ANIMATION BG — how VN and anime backgrounds vary
   composition across consecutive scenes on a fixed stage.

DELIVERABLE — A named taxonomy of 8-12 composition archetypes. For EACH:
(a) name (coin a short id + media provenance); (b) geometric rule — where
the occluders sit and what stays clear; (c) the staging/mood it communicates;
(d) variation knobs (so the same archetype can differ between scenes);
(e) which camera move it serves best in our set (push-in / pan-lateral /
creep / hold); (f) parallax risk notes for our depth-map warp (thin bare
branches and lattices smear; low-contrast near masses misbake).
Then: 5-8 anti-monotony sequencing principles — how a SEQUENCE of scenes
should alternate archetypes (rhythm of closed vs open frames, escalation,
focal-position rotation, horizon-height rotation). Be concrete and visual;
assume the reader can implement anything you describe.

**Providers:** chatgpt, claude, gemini, grok, deepseek
**Timestamp:** 2026-10-23T23:20:33.813616+00:00

*Attempts listed in completion order (first responder first).*

## claude

**Completed:** #1 · **Duration:** 108368 ms
**Status:** failed
**Error:** No selector matched among ['#static-composer-input', 'div[contenteditable="true"][aria-label*="Message" i]', 'div[contenteditable="true"]', '[role="textbox"]', 'textarea']

## gemini

**Completed:** #2 · **Duration:** 118842 ms
**Status:** success
**Content:**
We hit a classic art-direction wall, but it’s a good problem to have.

What you've run into is what game artists call the "Default Framing Trap." When artists face a 2.4:1 canvas and know a monocular depth map (Depth Anything V2) is going to displace it, they instinctively default to a symmetric "vignette" (two heavy dark masses on the sides) and a deep central vanishing point ("the tunnel"). It's safe, it creates readable depth gradients, and it hides edge-stretching artifacts. But when every quest beats on that same drum, players stop reading the story in the art—they just see the template.

Let's break out of it completely. Below is a macro strategic review, a concrete Taxonomy of 10 Composition Archetypes, and a set of Anti-Monotony Sequencing Rules we can adopt immediately for production.

Macro Design Review & Trade-Offs
Decided Facts vs. Open Questions

Decided Fact: We are using oil-impasto 2.4:1 assets with monocular depth maps and procedural 2.5D ambient layers (fog, glow, particles).

Decided Fact: The current single-skeleton approach ("two side masses + center funnel") causes visual fatigue.

Proposal: Establish an explicit 10-archetype vocabulary to govern stage layout, depth geometry, and camera movement.

Open Question: How much manual geometry fixing or depth-map painting are we willing to do? Depth Anything V2 is crisp, but zero-brushwork depth maps limit silhouette shapes (e.g., lattice or thin foliage will always tear unless clamped or separated).

The Macro Technical & Aesthetic Trade-Off

If we abandon two edge occluders, we expose the frame edges to depth displacement.
When a camera pans horizontally across a scene without a foreground "anchor" on the edge, the viewer sees the background warp directly against the viewport frame.

The Structural Fix: Depth staging isn't just "foreground stuff blocking background stuff." It's about controlling depth gradient deltas. We can achieve parallax stability through heavy horizontal planes, vertical band occlusions, or strong foreground silhouettes placed at different x-positions (not just 
𝑥
=
0
x=0 and 
𝑥
=
𝑚
𝑎
𝑥
x=max).

The Taxonomy of Composition Archetypes

Here is the named vocabulary distilled across landscape painting, cinematography, scenography, urban design, and key art.

+---------------------------------------------------------------------------------------+
| ARCHETYPE OVERVIEW                                                                    |
+---------------------------------------------------------------------------------------+
| 1. Asymmetric Anchor (Single Repoussoir)   6. Overhanging Canopy / Cave Mouth          |
| 2. Low Horizon Vista (The Expanse)         7. Stage Wings / Proscenium Flat            |
| 3. High Horizon Tableaux (Bird's-Eye)      8. Over-the-Shoulder / Dirty Foreground     |
| 4. The Monolith (Hero Focal Focus)         9. The Diagonal Choke (Serial Vision Corner)|
| 5. Stepped Lateral Ridge (Coulisse)       10. Keyhole / Negative Silhouette Frame      |
+---------------------------------------------------------------------------------------+

1. Asymmetric Anchor (ARCH-01: Single Repoussoir)

Provenance: Classical Landscape (Claude Lorrain, Constable).

Geometric Rule: A massive, high-contrast occluder covers 30–45% of the frame on one side only (left or right). The opposite side opens directly into a distant horizon.

Staging / Mood: Discovery, journey, observation, departure.

Variation Knobs: Swap left vs. right anchor; vary the depth offset of the anchor (extreme near vs. mid-near).

Ideal Camera Move: Lateral Pan / Dolly. The single heavy anchor moves rapidly across the foreground while the open landscape glides slowly behind it, creating dramatic parallax.

Parallax Risk Notes: High contrast on the anchor's inner edge can create "edge smearing" if the depth map bleeds onto the background plane. Keep the inner silhouette smooth (avoid fine branches/leaves).

2. Low Horizon Vista (ARCH-02: The Expanse)

Provenance: Hudson River School (Albert Bierstadt), Anamorphic Western Cinematography.

Geometric Rule: Horizon line placed at the bottom 15–20% of the frame. Almost zero foreground occluders. Depth is built purely via atmosphere (aerial perspective, fog, vertical density shift).

Staging / Mood: Isolation, awe, vulnerability, vast scale, quiet tension.

Variation Knobs: Sky/cloud structure (heavy storm clouds vs. open radiant light shafts), ground texture gradient.

Ideal Camera Move: Slow Creep / Hold. Minimal parallax delta across pixels; camera relies on ambient procedural layers (moving wind-blown shafts, drifting volumetric cloud cards).

Parallax Risk Notes: Depth Anything V2 often struggles to assign smooth gradients to featureless terrain or clear skies. Must ensure a continuous linear gradient gradient in the depth map on the ground plane to avoid warping ground artifacts.

3. High Horizon Tableaux (ARCH-03: Bird's-Eye / Downward Inclination)

Provenance: Feudal Japanese Screen Painting, Manga/Comic Establishing Panels, High-Angle Cinematography.

Geometric Rule: Horizon at top 10% or off-camera entirely. Camera looks down onto a terraced or multi-tiered ground. Foreground occupies the bottom edge, stepping up toward the top.

Staging / Mood: Tactical awareness, surveillance, claustrophobia, complex narrative staging.

Variation Knobs: Terracing density (roofs, steps, cliffs), focal target placement along the vertical axis.

Ideal Camera Move: Vertical Tilt / Downward Push-In.

Parallax Risk Notes: Monocular depth often misreads ground-plane depth maps when looking down, turning flat surfaces into vertical walls. Requires clean linear z-gradients from bottom to top.

4. The Monolith (ARCH-04: Hero Focal Focus)

Provenance: AAA Concept Art Briefs / Key Art (Struzan center-pyramid, Elden Ring vistas).

Geometric Rule: A single giant structure (tower, tree, fortress, titan) sits dead-center or near-center in the mid-ground. Foreground is low-profile or completely flat.

Staging / Mood: Confrontation, destiny, monumental goal, looming threat.

Variation Knobs: Foreground clutter (ruins, water reflections), symmetry break (side lighting vs. backlit).

Ideal Camera Move: Push-In (Z-Axis Dolly).

Parallax Risk Notes: The center focal point expands as you push in. Ensure the depth map on the center object is flat/smooth, or the center will warp outwards like a bubble.

5. Stepped Lateral Ridge (ARCH-05: Coulisse / Theater Flats)

Provenance: Theatrical Scenography, Dutch Golden Age (Jacob van Ruisdael).

Geometric Rule: Alternating diagonal layers stepping back like zig-zagging theater wings (Left Foreground 
→
→ Right Midground 
→
→ Left Background 
→
→ Horizon).

Staging / Mood: Progression, traversal, winding journey, suspense.

Variation Knobs: Number of slices (3 to 5 layers), alternating light/dark values (light-dark-light-dark rule).

Ideal Camera Move: Lateral Pan.

Parallax Risk Notes: Fantastic for parallax, but extreme edge-tearing risk between each layer overlap. Overlaps must have clean, painted silhouettes without soft transparent brushwork.

6. Overhanging Canopy (ARCH-06: The Cave Mouth / Vault)

Provenance: Romanticism Painting, Photography Framing Devices.

Geometric Rule: Occluders sit at the top and upper corners (branches, stalactites, archways, beams). Bottom and center stay wide open.

Staging / Mood: Protection, shelter, peering out, secrecy, transition.

Variation Knobs: Framing density (heavy stone arch vs. thin sparse foliage), arch shape (gothic arch vs. low organic cave).

Ideal Camera Move: Low-Angle Push-In.

Parallax Risk Notes: Hanging foliage or delicate geometry creates severe depth-map halos. Upper occluders must be painted with bold, chunky impasto masses rather than delicate individual leaves.

7. Stage Wings (ARCH-07: Proscenium Flat)

Provenance: Renaissance Theater, Early Cinema (Méliès), Visual Novel Narrative Screens.

Geometric Rule: Parallel vertical elements on the extreme left and right (pillars, drapes, trees) creating a strict 1:1 stage frame, but without a continuous ground tunnel or diagonal lead-in. Midground is flat and broad.

Staging / Mood: Formal interaction, dialogue-heavy moments, theatrical elegance, ritual.

Variation Knobs: Width of wing gaps, symmetry (classical symmetry vs. broken architectural ruin).

Ideal Camera Move: Static Hold with Ambient Layers / Slow Lateral Tracking.

Parallax Risk Notes: Highly stable. Minimal depth-warp risk because side wings shield frame edges completely.

8. Over-the-Shoulder (ARCH-08: Dirty Foreground)

Provenance: Narrative Cinematography, Graphic Novels / Manga.

Geometric Rule: Extremely near-plane silhouette (out-of-focus shoulder, weapon, railing, window ledge) occupying 20–30% of the foreground frame, usually in a lower corner.

Staging / Mood: Intimacy, voyeurism, immediate threat, personal perspective.

Variation Knobs: Object type (character silhouette vs. environmental prop), degree of depth blur.

Ideal Camera Move: Creep-in or Slow Pan.

Parallax Risk Notes: High depth separation between 
𝑍
0
Z
0
	​

 (foreground prop) and 
𝑍
1
Z
1
	​

 (scene). Requires heavy depth-of-field blur painted directly into the asset or shader to mask parallax stretching behind the object.

9. The Diagonal Choke (ARCH-09: Serial Vision Corner)

Provenance: Gordon Cullen's Townscape ("Serial Vision" / The Bend in the Road).   
Scribd

Geometric Rule: A solid wall or cliff cuts diagonally across 60% of the frame, completely blocking one side of the background and forcing the eye to look through a tight offset opening on the other side.

Staging / Mood: Anticipation, tension, mystery, threshold, the unknown.

Variation Knobs: Angle of the wall/bend, light spilling from around the corner.

Ideal Camera Move: Lateral Pan toward the reveal.

Parallax Risk Notes: The edge of the blocking wall is subject to high motion vector distortion during lateral pans. Keep the edge geometry sharp and vertical.

10. Keyhole Silhouette (ARCH-10: Negative Frame)

Provenance: Film Noir, Graphic Novel Splash Pages (Frank Miller).

Geometric Rule: The foreground is a complete, dark cutout (door frame, broken wall, grate) that frames a brightly lit, high-detail focal scene inside.

Staging / Mood: Stealth, entrapment, dramatic revelation, focus.

Variation Knobs: Geometry of cutout (geometric architectural vs. organic irregular collapse).

Ideal Camera Move: Direct Z-Axis Push-In (passing through the frame).

Parallax Risk Notes: Requires a distinct 2-layer setup in the depth map. High contrast makes Depth Anything V2 perform well, provided edges are clean.

Anti-Monotony Sequencing Rules

To guarantee consecutive quest scenes do not feel repetitive, the sequence must follow structural alternating rules:

Rule of Horizon Rotation (Vertical Rhythm):

Never keep the horizon in the middle third for two consecutive scenes.

Sequence Pattern: Low Horizon (Vista) 
→
→ High Horizon (Bird's Eye) 
→
→ Mid/Blocked Horizon (Choke/Wings).

Rule of Occluder Alternation (Open vs. Closed):

Alternate between Centripetal (framing elements pushing eye inward) and Centrifugal (open, expansive elements pushing eye outward).

If Scene 
𝐴
A uses Overhanging Canopy (Top/Side closed), Scene 
𝐵
B MUST use Low Horizon Vista (Top/Side open).

Rule of Lateral Weight (Left-Right Balance):

Do not stack single-side focal weights on the same side. If Scene 1 places a heavy Single Repoussoir on the Left, Scene 2 must place its primary mass on the Right or Center.

Rule of Motion Grammar Alignment:

Alternate camera motions to avoid repetitive depth-stretching fatigue:

Lateral Dolly/Pan (Scene A) 
→
→ Z-Push-In (Scene B) 
→
→ Static Hold + Ambient Fog (Scene C).

Rule of Focal Distance Shift:

Shift the primary narrative focal plane between scenes:

Near Focal Zone (Dirty Foreground / OTS) 
→
→ Far Focal Zone (Monolith Vista) 
→
→ Midground Zone (Stage Wings).

Seeds for Pipeline

Here are bounded, actionable topics ready to be broken down into task briefs:

Depth Anything V2 Edge-Clamping Guidelines: A design rulebook for concept artists detailing maximum brush softness/texture allowed on near-plane occluder silhouettes to prevent depth smearing.

Archetype Composition Tags in Asset Pipeline: Adding composition metadata tags (ARCH-01 through ARCH-10) to quest asset briefs to enforce automatic sequencing checks in the quest tool.

2.5D Shading & Blur Masking for Dirty Foregrounds: Technical shader setup for ARCH-08 (OTS/Dirty Foreground) to automatically apply variable defocus blur based on depth-map values, hiding parallax edge tears.

Gordon Cullen Camera Transition Templates: Preset camera tracks tuned specifically to match camera grammar (e.g., ARCH-09 Lateral Reveal Pan vs. ARCH-04 Z-Push) to reduce manual camera tuning per scene.

## chatgpt

**Completed:** #3 · **Duration:** 118876 ms
**Status:** success
**Content:**
Impossibile caricare questa risposta

## grok

**Completed:** #4 · **Duration:** 132412 ms
**Status:** success
**Content:**
Grok
Lavorato per 5s
Director, this is gold. We've been sitting on a killer system (monocular Depth Anything V2 + in-place parallax warp + ambient layers) that already nails the "tunnel/funnel" via two dark edge masses + diagonal lead, but the repetition is killing the quest-theatre immersion. A taxonomy of 8-12 named composition archetypes will give us deliberate variety while still feeding the exact parallax mechanics we need: clean near-plane occluders (silhouettes), staggered mid-ground steps, far focal zone, and low-conflict overlay zones.
We're not starting implementation yet — this is pure macro direction and future-proofing. I'll survey the sources you flagged, distill named archetypes, flag trade-offs, and propose anti-monotony sequencing rules. Everything stays at the level of "how the eye/brain will read the sequence" so we can lock this before any asset pipelines.
Quick Survey of the Sources (high-level only, no implementation)
Classical Painting (Claude Lorrain, Ruysdael, Constable, Hudson River School): Repoussoir is the dominant tool — a dark foreground element on one side (or framing overhang) that "pushes back" the viewer into depth. Masters vary it with single-side vs dual, aerial perspective (no hard occluders), or full triad. Mood: serene invitation or dramatic enclosure.
Cinematography (Wyler/Welles deep-staging, anamorphic framing): Frame-within-frame or dirty foregrounds create nested depth. DPs avoid shot repetition by rotating "grammar" (dolly-in vs lateral vs pan) and using over-shoulder or anamorphic squeeze for wide vistas. Consecutive shots stay fresh through movement language, not static formulas.
Photography: Leading lines, layered planes, natural framing (windows, arches), negative space, horizon-height rules. All keep the viewer moving without clutter.
Comics/Manga: Establishing shots (bird's-eye/worm's-eye/over-shoulder) in splash vs tight panels. Page flow alternates camera angles and panel sizes to prevent monotony while maintaining depth staging.
Posters/Key Art (Struzan-style): Pyramid scale hierarchies, hero-vs-vista layouts, theatrical one-sheets that compress depth.
Game Concept Art/Env Art: Vista "hero landmark" staging in AAA briefs; composition archetypes favor balanced scale hierarchy and foreground interest.
Theatrical Scenography: Literal proscenium depth layers (wings, flats, sightlines) — our edge occluders are the painted equivalent.
Townscape/Architecture (Gordon Cullen serial vision): A sequence of framed views as you walk; variety comes from changing framing devices and horizon rotation without the viewer noticing repetition.
Visual Novels/Anime BG: Fixed-stage backgrounds vary composition across consecutive scenes via layered parallax, slight angle shifts, or alternate foreground placements — exactly our problem in reverse.
Trade-offs we must name upfront
More archetypes = richer quest theatre, but risk diluting our "tunnel/funnel" signature if we over-diversify.
Our baked depth map + warp is forgiving on silhouettes but brittle on lattices/branches or low-contrast near masses (as we discovered).
Ultra-wide 2.4:1 format favors landscape-oriented archetypes (cinematography, townscape, photography) but we can still force portrait via cropping/ambients without losing parallax.
Genre state-of-the-art (AAA quest theatre, visual novels, cinematic trailers): viewers expect depth staging + emotional progression; serial-vision and VN alternation are the proven anti-monotony weapons in 2024-2026 releases.
Named Taxonomy of 10 Composition Archetypes
Each includes (a) name + provenance, (b) geometric rule for our parallax, (c) staging/mood, (d) variation knobs, (e) best camera move, (f) parallax risk notes.
Classic Repoussoir (Classical Painting – Claude Lorrain/Ruysdael)
(a) Name: CR (single-side dark mass left or right edge).
(b) Geometric: One dark edge mass as near-plane occluder; clean lead line into center; mid/background staggered.
(c) Staging/mood: Inviting depth, calm mystery.
(d) Knobs: Mass size/thickness, color temperature, add aerial haze or overhang.
(e) Camera: Hold or slow push-in.
(f) Risk: Thin branches on mass edge smear; low-contrast mass misbakes.
Coulisse Framing (Classical – Constable/Hudson River)
(a) Name: CF (lateral dark masses both edges, mid-line lead).
(b) Geometric: Two symmetric edge masses; staggered mid steps; far focal zone clear.
(c) Staging/mood: Enclosed, theatrical.
(d) Knobs: Mass color (warm/cool), add overhangs.
(e) Camera: Lateral pan or creep.
(f) Risk: Overhangs can occlude mid-plane; lattices on masses.
Frame-within-Frame (Cinematography – Wyler/Welles deep-staging)
(a) Name: FWF (inner framed rectangle with outer dark edge masses).
(b) Geometric: Outer edge masses + inner near occluder; staggered mid; low-conflict center for overlays.
(c) Staging/mood: Confined intimacy, revelation.
(d) Knobs: Inner frame shape (square/oval), add dirt/age.
(e) Camera: Hold or dolly-in.
(f) Risk: Inner frame edges conflict with warp if too busy.
Anamorphic Squeeze (Cinematography – anamorphic lenses)
(a) Name: AS (extreme wide aspect + barrel distortion on edges).
(b) Geometric: Edge masses stretched; mid steps staggered; far zone compressed but still focal.
(c) Staging/mood: Epic scale, drama.
(d) Knobs: Distortion intensity, add lens-flare layers.
(e) Camera: Wide lateral pan.
(f) Risk: Edge stretch can misbake parallax warp; thin elements smear.
Hero Landmark (Game Env Art – AAA concept briefs)
(a) Name: HL (dark mass as hero subject on edge, vista beyond).
(b) Geometric: One dark mass as hero occluder; clean lead; mid/background layers.
(c) Staging/mood: Heroic, scale importance.
(d) Knobs: Hero size relative to frame, add glow.
(e) Camera: Push-in to hero.
(f) Risk: Hero mass low-contrast misbakes; lattices on hero.
Theatrical Wing Flat (Scenography)
(a) Name: TF (layered wings/flat depths — multiple near masses).
(b) Geometric: Stacked near occluders on edges; staggered mids; far clear.
(c) Staging/mood: Theatrical, layered depth.
(d) Knobs: Flat number/layer count, add proscenium arch.
(e) Camera: Lateral pan or hold.
(f) Risk: Multiple near masses increase bake conflicts if low-contrast.
Serial Vision Horizon Rotate (Townscape – Gordon Cullen)
(a) Name: SV (framed horizon with rotating horizon line).
(b) Geometric: Horizon-height variation; edge masses; staggered mids.
(c) Staging/mood: Narrative walk-through, organic.
(d) Knobs: Horizon tilt/height, add aerial perspective.
(e) Camera: Lateral pan or creep (mimics walking).
(f) Risk: Horizon mass edges can smear if textured.
Splash Establishing (Comics/Manga)
(a) Name: SE (full-frame dark masses, no tight panel).
(b) Geometric: Large edge masses; staggered mids; hero zone center.
(c) Staging/mood: Wow introduction, epic.
(d) Knobs: Mass scale, add ambient glows.
(e) Camera: Hold.
(f) Risk: Full-edge masses can occlude parallax near plane.
Tight Over-Shoulder (Comics/Manga + Photography)
(a) Name: TS (over-shoulder element as near occluder).
(b) Geometric: Over-shoulder silhouette as near mass; staggered mid; far clear.
(c) Staging/mood: Intimate observation.
(d) Knobs: Element detail level, add character cutout.
(e) Camera: Hold.
(f) Risk: Over-shoulder thin elements smear in warp.
Layered Negative Space (Photography + VN BG)
(a) Name: LN (minimalist with strong negative space).
(b) Geometric: Edge masses minimal; mid steps subtle; far focal zone.
(c) Staging/mood: Calm, contemplative.
(d) Knobs: Space size, add ambient particles only.
(e) Camera: Hold or slow push-in.
(f) Risk: Minimal masses can feel "empty" in warp — need clean silhouettes.
7 Anti-Monotony Sequencing Principles (concrete visual rules)
These ensure consecutive scenes never repeat the same formula while feeding our parallax perfectly. Think of the sequence as a short film: always vary one axis per scene.
Focal-position rotation: Scene 1 — funnel diagonal left-to-right; Scene 2 — diagonal right-to-left; Scene 3 — vertical center lead.
Repoussoir side alternation: Alternate single-side (left) vs dual-edge (both).
Horizon-height cycle: Low horizon (ground-level masses) then mid, then high (bird's-eye feel) then low again.
Open vs closed frame rhythm: 60% open (wide vistas, less edge mass) vs 40% closed (tight wings/frames) in pairs; alternate "tight theatre" (TF/SE) with "open walk" (SV/LN).
Camera-move grammar rotation: Push-in (CR/HL) one scene, lateral pan (CF/AS/TF), then hold (FWF/LN).
Mood escalation/contrast: Calm serial (SV) alternates with dramatic hero (HL) then intimate over-shoulder (TS).
Ambient-layer contrast: Heavy procedural layers (fog/fireflies) on open archetypes; minimal on tight ones.
Desiderata candidates (bounded, ready for pipeline if we green-light)
Full archetype lookup table + variation generator prompt pack (for concept art/asset pipeline).
Parallax bake test suite: 10 test scenes per archetype with depth-map outputs + warp renders (focus on branch/lattice vs mass cases).
Sequence storyboard prototype: 8 scenes using these rules (one per day of quest "theatre").
Anti-monotony scoring metric (simple 1-10 rubric per archetype pair).
This taxonomy keeps the "tunnel/funnel" DNA while making every scene feel fresh and theatrical. What assumption do you want to challenge first — the ultra-wide format bias, the edge-mass reliance, or the anti-monotony rhythm? Or shall we move to picking 3 archetypes for a quick prototype?
Seeds for pipeline (the bounded ones above — ready when you say go).
90 sources

## deepseek

**Completed:** #5 · **Duration:** 154199 ms
**Status:** success
**Content:**
Decided facts (from the brief): The current skeleton (two edge masses + diagonal depth lead) is the default, not the law. Parallax needs near occluders with clean silhouettes, staggered mid-ground steps, and a far focal zone clear enough for overlays. Thin lattices smear; low-contrast near masses misbake.

Proposals and open questions below are marked as such. I am not closing any of this; I am putting options on the table for you to react to.

What the sources actually give us (and what they don't)

The classical repoussoir/coulisse tradition is the strongest confirmed anchor. Lorrain's ideal landscape is explicitly a three-stratum machine: dark vegetation or architecture at the coulisses (frame edges), a middle plane of ruins or buildings, and a low horizon that lets sky dominate . The coulisse is literally a sliding side flat from theatrical scenography—the ancestor of our edge occluders is not a metaphor, it is the same device . The Bibiena school then broke the central single-point symmetry into vue sur l'angle, an asymmetric diagonal perspective with multiple vanishing points, which is exactly the escape hatch from our current symmetric funnel .-
1
-
3
-

The Hudson River School adds a distinct variation: "detail islands" in the extreme foreground—small, dark, hyper-naturalistic clusters that act as repoussoir against a luminous panoramic field, with an elevated "magisterial gaze" and telescopic detail . This is not the same as a side mass; it is a low foreground island with open air around it. That is a legitimate archetype our current skeleton has no room for.-
7

Cinematography confirms the diagnosis but offers fewer naming conventions. Wyler's deep staging deliberately inverts the foreground/background hierarchy: the dramatic subject is sometimes in depth while a foreground element masks or frames . The Ipcress File is the extremal case—100 shots framed through obstructions, where every foreground object becomes an active framing device rather than the subject . The lesson is not "more dirt"; it is that a foreground occluder can be tonally neutral or thematically loaded, and the shot still reads. DP anti-monotony in practice is largely coverage discipline: master shot plus angled singles, with the depth shot reserved for moments where spatial drama replaces cutting .-
4
-
5
-

The honest gap: I did not find a source that names a formal taxonomy across comics, posters, VN backgrounds, and Gordon Cullen's serial vision in the same vocabulary. The synthesis below is mine, built on the confirmed classical/cinematic pillars and extrapolated where the literature thins. Treat the names as proposals, not canon.

Proposed taxonomy (9 archetypes)
1. Coulisse-Pair (classical/Lorrain; our current default)

(a) Short id: COULISSE. Provenance: Lorrain, Ruysdael, theatrical wing flats.
(b) Two dark masses at opposite frame edges, staggered in depth (one nearer, one mid), a diagonal lead (water, road, ridge) from the nearer coulisse into a low far focal zone. Clean silhouettes on both near masses.
(c) Balanced, legible, slightly theatrical; the "establishing landscape" mood. Good for arrival and orientation.
(d) Knobs: asymmetry ratio (70/30 instead of 50/50), horizon height (low = sky-dominant, high = terrain-dominant), lead curvature (straight vs serpentine), coulisse material (foliage vs architecture vs rock).
(e) Push-in is natural (dollies into the far focal zone between the masses); lateral pan works only if the far zone has lateral interest; hold is safe but becomes monotonous fastest.
(f) Parallax risk: low if both masses are solid blocks. Risk rises if the near coulisse has filigree edge (bare branches, latticework) — that edge will smear. Low-contrast dark foliage against dark sky can misbake as one flat plane.

2. Single-Shoulder (cinematic; dirty foreground / over-shoulder)

(a) Short id: SHOULDER. Provenance: Ipcress File frame-within-frame, Wyler's masking foregrounds.
(b) One large, clean-silhouette mass occupies 30–40% of one side, close to camera, often lower frame. The opposite two-thirds stays open to the far focal zone. The mass reads as "someone/something is here with us," not as a frame post.
(c) Intimate, slightly conspiratorial, claustrophobic-adjacent. Good for scenes where the player is observing, not commanding.
(d) Knobs: shoulder height (low = rock/root, mid = figure/trunk, high = overhang), edge softness (hard silhouette vs soft bokeh-like edge), whether the shoulder has a negative cutout (a gap that frames a sub-focal detail).
(e) Creep is the best fit: the slow lateral move changes the shoulder-to-open ratio without revealing the shoulder's off-frame extent. Push-in works if the shoulder stays static and the far zone opens. Pan-lateral risks losing the shoulder entirely; use only if a second shoulder enters.
(f) Parallax risk: moderate. A hard-edged shoulder is safe. A soft/dark shoulder against a mid-tone background may misbake because the depth model sees little contrast. Avoid thin appendages on the shoulder edge.

3. Detail-Island (Hudson River School; foreground repoussoir cluster)

(a) Short id: ISLAND. Provenance: Hudson River School "detail islands," Gifford/Kensett foreground clusters .-
7

(b) A compact, dark, highly textured cluster sits in the lower third, not touching frame edges. Open air or water surrounds it on at least three sides. The far focal zone is above and beyond it, often luminous. Horizon can be low or mid.
(c) Contemplative, observational, "the eye lands here first, then travels." Excellent for scenes where the player should notice a clue or a small-scale detail before the vista.
(d) Knobs: island placement (lower-left vs lower-right vs lower-center), island material (rocks vs flora vs debris vs architecture fragment), aerial perspective strength (how much the far zone washes out), sky proportion.
(e) Hold is strongest (the island anchors a still frame); creep works if the island's internal texture has parallax (stacked rocks, layered foliage). Push-in from the island toward the far zone is a natural reveal.
(f) Parallax risk: high if the island is thin/branchy. Keep the island's silhouette a solid mass with internal depth steps, not a lattice. The depth model handles stacked rocks better than individual twigs.

4. Overhang-Canopy (classical/romantic; framing from above)

(a) Short id: CANOPY. Provenance: Constable/Ruysdael tree crowns, romantic framing overhangs.
(b) A dark mass enters from the top edge (canopy, cliff lip, ceiling beam, arch) and stops before reaching the bottom or the far zone. The lower frame stays clear to the far focal zone. Side masses may be absent or minimal.
(c) Enclosed, protected, slightly oppressive or sacred depending on texture. Good for interiors-adjacent exteriors, forest thresholds, shrine approaches.
(d) Knobs: overhang depth (how far down it reaches), overhang material (foliage vs stone vs cloth vs smoke bank), whether the overhang has a silhouette gap that lets a shaft of light through, far-zone brightness (the contrast against the dark overhang is the mood dial).
(e) Hold is excellent (the overhang is a static weight). Slow creep works if the overhang has internal parallax (layered leaves, rock strata). Push-in can feel like entering the space under the overhang.
(f) Parallax risk: severe if the overhang is bare branches. A solid canopy mass is safe; a lace of twigs will smear into a grey smear during any warp. Recommend a "solid canopy" rule for any CANOPY scene that needs camera movement beyond a hold.

5. Threshold-Arch (scenography/cinematic; frame-within-frame)

(a) Short id: ARCH. Provenance: proscenium, doorway/window framing, Ipcress File obstructions.
(b) A complete or near-complete frame-within-frame (arch, doorway, window, rock gap, cave mouth) sits in the mid-ground, with the far focal zone visible through it. The outer frame edges can be open or softly filled. The inner opening is the primary composition.
(c) Focused, voyeuristic, "a world within a world." Strong for scene transitions or reveals where the player is about to enter a new space.
(d) Knobs: aperture shape (round vs rectilinear vs organic), aperture size relative to frame (tiny peephole vs wide arch), distance of the arch from camera (near arch = dirty frame; far arch = destination), whether the arch itself is lit or silhouetted.
(e) Push-in is the signature move (through the arch). Hold is strong. Lateral pan is weak unless the arch is one of a series (colonnade, cave openings).
(f) Parallax risk: high on the arch edges if they are thin or irregular. A stone arch is safe; a broken branch arch is not. The interior of the arch must have enough depth separation from the far zone or the warp will shear the opening.

6. Vista-Wall (Hudson River School/cinematic; open frame, no near occluder)

(a) Short id: VISTA. Provenance: panoramic Hudson River School vistas, extreme long shot establishing.
(b) No near-plane occluder at all. The frame is open from edge to edge, with staggered mid-ground steps (ridges, terraces, tree lines) leading to a luminous far focal zone. Horizon placement is the primary composition decision.
(c) Expansive, liberating, sometimes lonely. The "breath" scene after a closed one.
(d) Knobs: horizon height (very low = sky/void, mid = classical landscape, high = terrain-dominant), number of mid-ground steps (2–4), whether a tiny foreground detail (figure, rock, grass tuft) breaks the bottom edge for scale, atmospheric contrast.
(e) Lateral pan is the best fit (the open frame invites scanning). Slow creep also works if the mid-ground steps have parallax. Push-in is weak (nothing to push past); it reads as a zoom, not a move.
(f) Parallax risk: low for the far zone, but the mid-ground steps must have real depth separation or the warp will look like a flat pan. Avoid thin tree lines as the only mid-ground step; they will smear. A VISTA with zero near occluder also loses the parallax anchor entirely—the warp becomes a subtle slide, not a reveal. Use sparingly and deliberately.

7. Diagonal-Cascade (Bibiena/scenography; asymmetric angle view)

(a) Short id: CASCADE. Provenance: Bibiena vue sur l'angle, baroque diagonal perspective .-
3

(b) The lead element (stair, road, ridge, river) enters from one lower corner and exits toward the opposite upper-mid, with masses staggered along the diagonal rather than pinned to frame edges. No symmetric edge pair. The composition reads as one continuous depth recession at an angle.
(c) Dynamic, directional, "the path is the subject." Excellent for travel scenes, ascents, descents, pursuit.
(d) Knobs: diagonal steepness (shallow = lateral journey, steep = vertical ascent), side of entry (left vs right—rotate between scenes), number of cascade steps (3–5), whether the diagonal terminates in a focal object or exits frame.
(e) Creep along the diagonal is the signature (camera follows the line of action). Lateral pan can work if the diagonal is shallow. Push-in works if the diagonal leads to a terminus.
(f) Parallax risk: moderate. The cascade steps need solid silhouettes. Staircases with thin railings will smear; stone steps without railings are safe. The near end of the diagonal must be a clean mass or the warp will tear at the frame edge.

8. Silhouette-Void (poster/key art; negative space dominance)

(a) Short id: VOID. Provenance: theatrical one-sheet negative space, Struzan-style scale hierarchy inverted (hero as small dark shape against vast field).
(b) One small-to-medium dark silhouette (figure, tower, tree, wreck) placed off-center against a large, relatively uniform luminous field (sky, fog bank, water, snow). No near occluder. The "composition" is the silhouette's placement and the field's tonal gradient.
(c) Isolated, mythic, "a figure in a landscape." High impact for key moments, dangerous for consecutive use.
(d) Knobs: silhouette scale (tiny = epic scale, medium = character focus), silhouette placement (rule-of-thirds points, not center), field texture (pure gradient vs layered fog vs subtle mid-ground ridges), whether a second tiny silhouette exists for relationship.
(e) Hold is the only fully safe move. Creep can work if the field has layered atmospheric bands that parallax gently. Push-in toward the silhouette can work but risks exposing the silhouette's flatness (it is a baked depth shell, not a modeled object).
(f) Parallax risk: high if the silhouette is thin (bare tree, thin figure, mast). The depth model will give the silhouette a depth value but the warp will stretch its edges. Keep silhouette silhouettes thick and simple. A VOID scene with camera movement is a gamble; a VOID scene as a hold is the safest card in the deck.

9. Lattice-Grid (architecture/townscape; serial vision framing)

(a) Short id: GRID. Provenance: Gordon Cullen serial vision, colonnades, window grids, fence lines, arcades.
(b) A repeating structural element (columns, window frames, fence posts, tree trunks in an avenue) creates a rhythm across the frame, with the far focal zone visible between the repeats. The grid can be near (large repeats, dirty) or mid (small repeats, architectural).
(c) Ordered, processional, urban or ritual. Good for built environments and approaches to significant places.
(d) Knobs: repeat spacing (wide = airy, tight = compressed), grid angle (frontal vs oblique), whether the grid is symmetric or broken by one missing/irregular element, near vs mid placement.
(e) Lateral pan is the best fit (the grid creates a rhythm of occlusion/reveal as the camera moves). Creep works. Push-in through the grid is strong if the grid is a colonnade.
(f) Parallax risk: highest of the set. Thin lattices (fences, railings, bare tree avenues, window mullions) smear catastrophically under monocular warp. The depth model cannot separate individual thin members. A GRID archetype is only viable with thick members (stone columns, massive tree trunks, heavy timber). Flag this explicitly: if the scene needs a GRID, budget for solid members or accept a hold with no warp.

Proposed anti-monotony sequencing principles

These are proposals for the sequence layer, not the archetype layer. The goal is to make consecutive scenes feel deliberately different at the skeleton level before any camera move or overlay is applied.

1. Closed/Open alternation as the primary rhythm.
Classify every archetype as closed (near occluder present: COULISSE, SHOULDER, CANOPY, ARCH, GRID) or open (no near occluder: VISTA, VOID) or hybrid (ISLAND, CASCADE). Never play three closed scenes consecutively. Never play two open scenes consecutively unless the second is a deliberate escalation (VOID → VISTA as a "release valve," not VOID → VOID). The default pattern is Closed → Hybrid → Open → Hybrid → Closed.

2. Rotate the occluder's frame edge.
If scene N has a left-edge mass, scene N+1 must not have a left-edge mass as its primary occluder. Rotation: left → top → right → bottom/island → none. This is cheap to enforce and immediately breaks the "same tunnel" feeling. The COULISSE default is left+right; if you keep it, the next scene must be SHOULDER (one side only) or CANOPY (top only).

3. Rotate horizon height as a secondary axis.
Horizon height is an independent variable from archetype. A COULISSE with a low horizon and a COULISSE with a high horizon read as different compositions. Track horizon height per scene and enforce no more than two consecutive scenes in the same band (low <33%, mid 33–66%, high >66%). The classical default is low; VISTA can be any; CANOPY often pushes horizon low by default. Use horizon rotation to make repeated archetypes (when unavoidable) feel like different scenes.

4. Escalate the far focal zone's prominence across an arc.
Within a quest act, the far focal zone should grow in clarity and significance. Early scenes: far zone is atmospheric, low-detail, background. Mid: far zone gains a landmark or silhouette. Late: far zone is the brightest or most detailed region, and the near occluders darken to push it forward. This is aerial perspective used as narrative rhythm, not just rendering. The archetype sequence can then mirror the far-zone progression: VISTA (far zone is everything) early establishes the world; ARCH (far zone framed) mid makes it a destination; COULISSE with a bright far zone late makes arrival imminent.

5. Never repeat an archetype in adjacent scenes—but allow a "rhymed return" after three.
The strict rule is no adjacent repeats. The softer rule: if an archetype returns within a sequence, it must return with at least two knobs changed (side, horizon, material, move). A COULISSE → SHOULDER → CANOPY → COULISSE sequence is acceptable only if the second COULISSE has a different asymmetry ratio and a different camera move. This is how DPs avoid formula: the same setup returns, but re-framed.

6. Match camera move to archetype, and rotate moves within a closed stretch.
Do not let every COULISSE scene be a push-in. If three closed scenes appear in a row (which the closed/open rule discourages but quest structure may force), assign moves deliberately: creep → hold → push-in, or lateral → hold → creep. The move rotation is a second layer of variety that costs nothing once the archetype is chosen. A SHOULDER creep and a SHOULDER push-in feel like different shots.

7. Reserve VOID and VISTA as punctuation, not staple.
Open frames are the most powerful and the most fragile. VOID as a hold is a chapter break; VISTA as a lateral pan is a breath. If they appear too often, they lose their release function and the closed archetypes start to feel like the default texture again. Proposed budget: in a 10-scene quest act, 2–3 open or hybrid-open scenes maximum, placed at act transitions or after the most closed/claustrophobic scene.

8. Flag lattice-bearing scenes at the brief stage, before authoring.
Any scene whose archetype or subject requires thin repeating elements (GRID, CANOPY with bare branches, CASCADE with railings, ARCH with broken edges) should be flagged as "parallax-risk: high" at the composition brief, not after the depth map is baked. The mitigation is either a hold-only move for that scene, or a composition revision toward solid members. This is a pipeline seed, not a design rule.

Seeds for pipeline (bounded topics that emerged; not to plan now):

A one-page "archetype card" template with the six fields (geometry, mood, knobs, move, parallax risk) for the art brief, so composers pick an archetype deliberately rather than defaulting to COULISSE.

A sequence-level spreadsheet/tool that tracks archetype, closed/open class, primary occluder edge, horizon band, and camera move across a quest act, with automatic flags for adjacent repeats or three-closed runs.

A parallax-risk pre-check heuristic: any composition where the near occluder's silhouette has more than N thin members (N to be defined by testing) is auto-flagged for hold-only or composition revision.

A test matrix of 3 archetypes (COULISSE, SHOULDER, CANOPY) × 2 moves (creep, push-in) × 2 silhouette types (solid, filigree) to establish the actual smear threshold of the current depth-map pipeline before committing to the taxonomy.
