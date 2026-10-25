# fixes — objective-cartouche

## `default` — assert-absent is not expressible (documented_partial)

**Verbatim documenter result:**

```json
{"id":"default","ok":false,"reason":"assertion failed"}
```

`meta.json`: `{"id":"default","reached":true,"asserted":false}`.

**This is a documenter limitation, not a component failure.**

`checkAssertion` in `scripts/catalog/documentComponent.mts` returns `true`
only when a selector resolves to a visible element. For
`{ selector: '[aria-labelledby="hud-objective-label"]', property:
'visible', expected: 'false' }` the intended semantics is "pass when the
element is absent or hidden" — instead the loop finds nothing and returns
`false`. Assert-absent states can never pass today.

**DOM truth (verified by direct probe at S1, 2026-10-24):**

```json
{"sel":"[aria-labelledby=\"hud-objective-label\"]","inDom":false,"visible":false}
```

The component returns `null` because `/game` never passes an `objective` —
absent by design, matching the manifest note.

**Suggested fixes:**

1. `checkAssertion`: honor `expected === 'false'` for `property 'visible'`
   → pass when no selector matches a visible element.
2. Optional positive state (if an objective feed ever lands): a `script`
   driver that mounts/feeds an objective, asserting the label visible —
   no such seam exists today; do not fabricate one.

Evidence shot added manually: `shots/V1/default-absence-evidence.png`
(healthy S1, no cartouche).
