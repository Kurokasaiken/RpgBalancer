# Goblin sticker behaviour lost in WorldSurfaceEventCard

## Symptom

In `/world-surface`, when the Shroud event is activated, the goblin sticker no longer falls from above the event panel and marches to `marchTarget`. The characteristic "sticker" animation is missing.

## Expected behaviour (original)

1. Modal phase: a large goblin image hovers above the panel, bottom edge touching the panel top (`goblinBase`).
2. Falling phase: the goblin falls to `fallTarget` over 1.5s.
3. Marching phase: the goblin slowly marches to `marchTarget` over 200s.
4. The goblin size stays large on screen regardless of world camera zoom (`goblinSize = Math.max(600, 400 / camera.zoom)`).

## Current behaviour

The goblin was moved inside `MatericEventCard` as the `image` prop. Because it is now a child of the `MatericEventCard` and is affected by the panel's `framer-motion` `scale`/`x`/`y` transforms, it cannot move independently in world space and cannot keep the original "sticker" size/trajectory.

## Files involved

- `src/ui/idleVillage/components/WorldSurfaceEventCard.tsx`
- `src/ui/designSystem/primitives/MatericEventCard.tsx`

## Root cause

The external `goblin-hero` `motion.div` (with `goblinSize`, `goblinBase`, `fallOffset`, `marchOffset`) was removed to make the goblin "inside the component". The `image` prop approach cannot reproduce the world-space goblin sticker because it is constrained by the card's layout, clipping and panel transforms.

## Proposed fix

Restore the external `goblin-hero` `motion.div` in `WorldSurfaceEventCard` while keeping `MatericEventCard` for the event panel and `MatericCloudWall` for the cloud background. The goblin image inside `MatericEventCard` becomes a small icon (`imageUrl`), and the sticker is the separate world-space goblin hero.
