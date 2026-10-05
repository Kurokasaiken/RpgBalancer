# Fix plan

1. Read `WorldSurfaceRenderer.tsx` and `trailerConfig.ts` to locate the goblin/forest destination.
2. Set `marchTarget` to the `goblin-camp` POI coordinates from `trailerConfig.threat.pois`, converted from percentages to world pixels using `canvasSize`.
3. Keep `fallTarget` at `{ x: 737, y: 859 }` so the goblin lands in the forest first, then marches to the goblin-camp center.
4. Run `npm run build:check` and `curl` smoke test.
5. Commit.
