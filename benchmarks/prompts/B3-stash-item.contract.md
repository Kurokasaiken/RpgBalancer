Add a new stash item to the quest lab's packable items with exactly this contract:

- `flag: 'hasLuckyCharm'`
- `labelKey: 'questS1Lab.item.luckyCharm'`
- `descKey: 'questS1Lab.stash.desc.luckyCharm'`
- `icon: 'clover'` (free-form lucide id, config level only)
- `kind: 'check'`, `bonus: 10`, `stats: ['cha']`

The label/description keys must exist in the `idleVillage` namespace for `en`, `it-IT`, and `pseudo` locales.

Contract of done — a seeded test exists and must pass:

  npm run test -- tests/unit/idleVillage/benchStashItem.contract.test.ts

Do NOT modify the contract test. Keep every file valid (JSON stays parseable, TS compiles).
