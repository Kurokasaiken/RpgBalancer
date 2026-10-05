# Token Contract — Goblin Event Modal

## Canonical token file

`src/balancing/config/idleVillage/goblinEventModalTokens.ts`

## What it contains

- `palette` — all colors (sky, wood, gold, parchment, crimson, etc.)
- `typography` — sizes, weights and tracking for title, badge, body, warning, button, arrival count
- `spacing` — frame inset and relative vertical positions
- `layout` — absolute percentage positions and sizes of every region
- `effects` — gradients, shadows and clip-paths
- `layers` — semantic layer stack
- `svg` — filter/texture recipe strings

## Validation

The file exports a Zod schema and a `validateGoblinEventModalTokens` function. The runtime contract is validated at module load.

## Usage

The component imports the token object and uses it for all colors, spacing, typography and effects. No hardcoded values remain in the component.
