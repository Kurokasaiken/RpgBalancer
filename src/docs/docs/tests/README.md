# Playwright Hooks & Helpers

## `waitForRosterFeedback`

Use the shared matcher in `tests/utils/waitForRosterFeedback.ts` whenever a test needs to wait for assignment feedback emitted by Idle Village. The helper now accepts **arrays of regexes** for both success and error cases, so suites can opt into custom vocab without duplicating logic.

```ts
import { waitForRosterFeedback } from './utils/waitForRosterFeedback';
import { rosterFeedbackPatterns } from './config/rosterFeedbackPatterns';

await waitForRosterFeedback(page, {
  successPattern: [...rosterFeedbackPatterns.success],
  errorPattern: [...rosterFeedbackPatterns.error],
});
```

### Passing custom expectations

Override either pattern with a `RegExp`, an array of `RegExp`, or `null` (to skip that category) when a scenario needs specialized copy:

```ts
await waitForRosterFeedback(page, {
  successPattern: [/pronto per/i],
  errorPattern: [/(impossibile|fatica)/i],
});
```

The helper also reads any diagnostics exposed via `window.__idleVillageTestHooks`, immediately failing when the hooks report an error reason.

## Roster feedback patterns

Keep domain strings inside `tests/config/rosterFeedbackPatterns.ts`. Tests should never hardcode localized text—import the shared config instead so UI copy changes only require editing one file.
