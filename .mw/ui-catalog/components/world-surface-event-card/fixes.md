# fixes — world-surface-event-card

## `default` — driver unreachable (documented_partial)

**Verbatim documenter result:**

```json
{"id":"default","ok":false,"reason":"driver unreachable/unimplemented"}
```

`meta.json`: `{"id":"default","reached":false,"asserted":false}` — the
`S15_GoblinInvasionEvent` graph node polled `invasion-goblin-marker` for
120 s while advancing the canonical clock (`advanceTicks(30)` per step);
no invasion is armed in a fresh-session save, so the optional node
reported unreachable.

**Suggested fix — script driver via the mounted E2E seam.**

`window.__idleVillageTestHooks.startInvasion` is present on this build
(verified 2026-10-24, probe at S1). Calling it sets `shroudCovered=true`;
`cardDelayMs` later `WorldSurfaceEventCard` mounts with
`world-event-card-body` + `goblin-window-sticker` visible — the exact
elements the assertion names. Suggested driver
`scripts/catalog/drivers/invasionTheatre.ts`:

```ts
export async function drive(ctx: HarnessCtx): Promise<boolean> {
  await ctx.page.evaluate(() => window.__idleVillageTestHooks?.startInvasion?.());
  try {
    await ctx.page.getByTestId('world-event-card-body').waitFor({ state: 'visible', timeout: 15_000 });
    return true;
  } catch { return false; }
}
```

This captures the canonical announcement peak (card + sticker over the
closed shroud). The post-confirm `invasion-goblin-marker` state would need
a second state (confirm click → sticker flight → `onLand`).

**Caveat:** the `world-event-card-body`/`goblin-window-sticker` testids
exist (`WorldSurfaceEventCard.tsx` L373/L479, `GoblinInvasionWindow.tsx`
L463); only the driver was missing.
