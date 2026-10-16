Extend the metaLayer content config with two new offers:

1. `infil-toll-audit` — family `infiltration`, tier 2, `appearsWhen` `contact:smuggler` >= 1, `requires` `[{kind:'capability', key:'diplomacy', severity:'capability'}, {kind:'stat', key:'cha', min:3, severity:'cost'}]`, `provides` `[{key:'intel:toll-ledgers', delta:1}]`, `durationTicks` 4, `acceptanceTicks` 12, `completionTicks` 8, `riskBand` `[0.25, 0.45]`, `harmProfile` `{wound:0.1, death:0}`, `weight` 7.
2. `race-market-leak` — family `race`, tier 1, `requires` `[{kind:'capability', key:'diplomacy', severity:'capability'}]`, `provides` `[{key:'intel:toll-ledgers', delta:1}]`, `durationTicks` 2, `acceptanceTicks` 10, `completionTicks` 5, `riskBand` `[0.1, 0.3]`, `harmProfile` `{wound:0, death:0}`, `weight` 8, `repeatable` true, `repeatCooldownTicks` 10.

Contract of done — a seeded test exists and must pass:

  npm run test -- tests/unit/metaLayer/benchMetaLayerOffers.contract.test.ts

Do NOT modify the contract test.

## Pre-gathered context (do not re-derive)

- The authored offers live in `META_LAYER_OFFERS` in `src/balancing/config/metaLayer/content.ts`. Append the two offers there, in the appropriate family sections, matching the existing code style (fields in the same order as neighboring offers, comments stay in English).
- The `OfferDef` schema is in `src/balancing/config/metaLayer/schema.ts` — every field named above exists on `OfferDefSchema`; do not invent new fields.
- Valid families: `infiltration`, `delve`, `race`. Valid capability tags are listed in `META_LAYER_CAPABILITY_TAGS` (includes `diplomacy`).
- `intel:toll-ledgers` is a NEW quality key — qualities are created implicitly by `provides` entries; do not register it anywhere else.
- The linter (`lintOpportunityGraph`) is exercised by the contract test: after your edit `report.errors` must be empty and every offer reachable. `appearsWhen`/`requires` entries with `kind:'quality'` need that quality to be reachable — `contact:smuggler` is already provided by `infil-bribe-smuggler`.
- Scope: ONLY `src/balancing/config/metaLayer/content.ts`. Do not touch engine, UI, plans, or tests.
