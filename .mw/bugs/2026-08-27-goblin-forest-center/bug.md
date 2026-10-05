# Bug: goblin hero does not move to the center of forest_1_top_left

## Symptom
After PREPARE, the goblin token is not visible and does not move to the center of the `forest_1_top_left` area. The user reports "non succede".

## Reproduction
1. Open `/world-surface` in Puppeteer.
2. Click the event `Event shroud OFF` then `PREPARE THE DEFENSES`.
3. Observe the goblin hero token.

## Expected
- The goblin token should be visible.
- It should fall into the forest and then visibly march toward the center of `forest_1_top_left`.

## Actual root causes
1. `WorldSurfaceRenderer.tsx` set `marchTarget` to the wrong point (goblin-camp POI / same as fallTarget). The actual center of the `forest_1_top_left.webp` layer was unknown.
2. `WorldSurfaceEventCard.tsx` did not add `goblinHalf` to `fallOffset` and `marchOffset`, so the goblin's center never landed on the target (it was offset by half its size to the top-left).
3. The goblin `<img>` had `maxWidth: 100%` from the base `img` reset, but the parent `WorldSurfaceEventCard` div had zero width. This collapsed the goblin's rendered width to `0px` (only height remained), making the token invisible.

## Empirical verification
- Puppeteer measured the `forest_1_top_left.webp` visible forest bounding-box center: (728, 810) in a 3072x2049 image.
- After scaling to the 4240x2828 canvas, the world-space center is `(1005, 1118)`.
- Puppeteer screenshots before and 40s after PREPARE show the goblin token visible and moving from the landing point toward the forest center.
