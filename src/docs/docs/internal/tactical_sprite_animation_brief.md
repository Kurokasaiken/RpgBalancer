# Tactical Sprite Animation System Brief

## Background & Goal

- **Project focus**: turn-based tactical RPG prototype with Idle Village lineage.
- **Objective 1**: deliver a convincing **idle turn loop** driven by AI + vibecoding workflows.
- **Scope of this brief**: outline animation set, art direction, and implementation constraints for a reusable sprite system aligned with Config-First + Weight-Based Creator philosophy.

## Art Direction

- **Style**: 2D vector, high fantasy, painterly gradients similar to *League of Legends* splash/UI art.
- **Silhouette**: exaggerated proportions, readable from isometric/tactical zoom (approx. 96–128 px character height at base zoom).
- **Palette**: reuse Gilded Observatory token set (obsidian backgrounds, gold + teal trim) for consistency.
- **Lighting**: rim-light + emissive accents for quick readability on dark boards.

## Animation Set (Phase 1)

| State            | Purpose                                           | Notes                                                                 |
| ---------------- | ------------------------------------------------- | --------------------------------------------------------------------- |
| Idle             | Breathing + subtle cloth/weapon sway              | Loop 1.2–1.8s, supports emotion overlays via blend shapes.            |
| Move             | 6–8 frame run/float cycle, works in 8 directions  | Needs directional masking or bone-driven rotation.                    |
| Attack (primary) | Signature strike or spell cast                    | Anticipation (4f) → action (3f) → recovery (5f).                      |
| Hit / React      | On receiving damage; includes stagger & flash     | Triggerable during any state except death; blend priority high.       |

Future states (not in scope yet): cast/skill variants, death, victory poses.

## Technical Constraints

1. **Sprite Source**: layered SVG/PSD exported to texture atlases via config-driven pipeline (e.g., Lottie → spritesheet or Spine export).
2. **Animation Driver**: lightweight state machine per unit with deterministic RNG hooks.
3. **Data Location**: all frame timings, easing curves, VFX references defined in `src/balancing/config/idleVillage/animation.ts` (to be created).
4. **Blending Rules**: priority table (attack > hit > move > idle). Idle re-blend after any interrupt.
5. **Performance**: target 60 FPS on mid-range laptops; batch draw calls by palette + shader variant.

## Implementation Milestones

1. **Spec & References** (this document) – ✅
2. **Research** – gather best practices for tactical sprite rigs (next step).
3. **Prototype** – build deterministic animation state machine + sample atlas.
4. **Tooling** – integrate AI/vibecoding workflow for generating SVG layers.

## Open Questions

- Preferred authoring tool (Spine, DragonBones, custom SVG animator)?
- Need bone-based rigs or pure frame swapping?
- Required export resolution for future zoom levels?

Last updated: 2025-12-17
