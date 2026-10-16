Extend the metaLayer content config with two new offers:

1. `infil-toll-audit` — family `infiltration`, tier 2, `appearsWhen` `contact:smuggler` >= 1, `requires` `[{kind:'capability', key:'diplomacy', severity:'capability'}, {kind:'stat', key:'cha', min:3, severity:'cost'}]`, `provides` `[{key:'intel:toll-ledgers', delta:1}]`, `durationTicks` 4, `acceptanceTicks` 12, `completionTicks` 8, `riskBand` `[0.25, 0.45]`, `harmProfile` `{wound:0.1, death:0}`, `weight` 7.
2. `race-market-leak` — family `race`, tier 1, `requires` `[{kind:'capability', key:'diplomacy', severity:'capability'}]`, `provides` `[{key:'intel:toll-ledgers', delta:1}]`, `durationTicks` 2, `acceptanceTicks` 10, `completionTicks` 5, `riskBand` `[0.1, 0.3]`, `harmProfile` `{wound:0, death:0}`, `weight` 8, `repeatable` true, `repeatCooldownTicks` 10.

Both offers provide `intel:toll-ledgers` so the quality has two independent sources — keep at least these two providers.

Contract of done — a seeded test exists and must pass:

  npm run test -- tests/unit/metaLayer/benchMetaLayerOffers.contract.test.ts

Do NOT modify the contract test. Offers must go in the authored content file (not the engine). Keep the whole graph linter-clean: zero errors, every offer reachable.
