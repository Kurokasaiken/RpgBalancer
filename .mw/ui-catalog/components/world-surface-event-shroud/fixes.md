# fixes — world-surface-event-shroud

## `default` — driver unreachable (documented_partial)

**Verbatim documenter result:**

```json
{"id":"default","ok":false,"reason":"driver unreachable/unimplemented"}
```

`meta.json`: `{"id":"default","reached":false,"asserted":false}` — same
cause as `world-surface-event-card`: `S15_GoblinInvasionEvent` polls
`invasion-goblin-marker` for 120 s and the fresh-session save never arms
the invasion.

**Suggested fix — script driver via the mounted E2E seam**

`window.__idleVillageTestHooks.startInvasion` (verified present on this
build, 2026-10-24) sets `shroudCovered=true` directly — no natural trigger
needed. Same suggested `scripts/catalog/drivers/invasionTheatre.ts` as the
sibling component; for the shroud wait on the closed half:

```ts
await ctx.page.evaluate(() => window.__idleVillageTestHooks?.startInvasion?.());
await ctx.page.locator('.ws-event-shroud__half--closed').first()
  .waitFor({ state: 'attached', timeout: 10_000 });
```

**Selector strengthening (recommended even with the driver)**

`[data-testid="ws-event-shroud"]` is always mounted and always "visible"
(verified at S1: in DOM, 1440×900, zero `--closed` halves). Asserting the
container alone passes on the *uncovered* state — a vacuous shot. The
meaningful covered state is:

```
.ws-event-shroud__half--closed        (attached, both halves)
```

or `[data-testid="ws-event-shroud"] .ws-event-shroud__half--closed`.
Suggest updating the manifest assertion selector accordingly.
