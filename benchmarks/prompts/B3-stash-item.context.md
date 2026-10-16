Add a new stash item to the quest lab's packable items with exactly this contract:

- `flag: 'hasLuckyCharm'`
- `labelKey: 'questS1Lab.item.luckyCharm'`
- `descKey: 'questS1Lab.stash.desc.luckyCharm'`
- `icon: 'clover'` (free-form lucide id, config level only)
- `kind: 'check'`, `bonus: 10`, `stats: ['cha']`

Contract of done — a seeded test exists and must pass:

  npm run test -- tests/unit/idleVillage/benchStashItem.contract.test.ts

Do NOT modify the contract test.

## Pre-gathered context (do not re-derive)

- The stash catalog is `QUEST_STASH.items` in `src/balancing/config/idleVillage/quests/questStash.ts` (schema `StashItemSchema` in the same file — all fields above already exist). Append the item at the END of the `items` array; do NOT add it to `defaultLoadout`.
- i18n keys live in `public/locales/<locale>/idleVillage.json` under nested paths — add `questS1Lab.item.luckyCharm` and `questS1Lab.stash.desc.luckyCharm` in `en`, `it-IT`, and `pseudo`. Keep each file's existing structure/indentation.
- The `pseudo` locale convention wraps values in `!! ... !!` (see neighboring keys, e.g. `questS1Lab.item.potion`); follow it.
- Short authored copy is enough, e.g. en: "Lucky Charm" / "+10 to CHA checks when packed."
- Scope: `src/balancing/config/idleVillage/quests/questStash.ts` + the three `idleVillage.json` locale files only. Nothing under `src/ui/`, `src/engine/`, `plans/`, `.mw/`.
