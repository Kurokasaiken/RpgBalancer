Extend the metaLayer content config with two new offers:

1. `infil-toll-audit` — family `infiltration`, tier 2. Requires the `diplomacy` capability; provides the quality `intel:toll-ledgers` (+1) on success. Medium risk.
2. `race-market-leak` — family `race`, tier 1. Low risk; also provides `intel:toll-ledgers` (+1), so the quality has two independent sources (convergent intel, a design convention in this config).

Add them where the other offers live and keep the content graph valid — no unreachable offers, no references to unknown families/qualities that break the linter. Use reasonable values for the fields not specified above, consistent with offers of the same family/tier.
