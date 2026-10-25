# fixes — error-boundary

## `default` — assert-absent is not expressible (documented_partial)

**Verbatim documenter result:**

```json
{"id":"default","ok":false,"reason":"assertion failed"}
```

`meta.json`: `{"id":"default","reached":true,"asserted":false}`.

**This is a documenter limitation, not a component failure.**

`checkAssertion` in `scripts/catalog/documentComponent.mts` returns `true`
only when a selector is visible; `property:'visible', expected:'false'`
cannot pass. Assert-absent states need first-class support (pass when no
selector matches a visible element).

**DOM truth (verified by direct probe at S1, 2026-10-24):**

```json
{"sel":"[data-testid=\"error-message\"]","inDom":false,"visible":false}
```

Absent = healthy. No error was raised on the route.

**Positive-state capture (crash plate visible):** no clean seam exists
today. The only witnessed path was the quest-run `demoLaunch` TDZ circular
import — a known bug, unreachable by design, and it kills the route (not a
recoverable per-component crash). A dedicated seam (e.g. a dev-only hook
that throws inside the boundary, or a `?crash-test=1` route) would be
needed to document the rendered fallback; not fabricated here.

Evidence shot added manually: `shots/V1/default-absence-evidence.png`.
