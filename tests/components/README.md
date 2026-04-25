# Component-Level Playwright Specs

This directory contains focused Playwright suites that exercise individual Idle Village components in isolation. Each spec mounts the Village Sandbox harness, interacts with test hooks, and verifies visual state toggles using semantic `data-*` attributes.

## Drag Simulation Helper

Use `tests/components/utils/dragResidentCard.ts` (a thin wrapper over the shared helper) to run the fully synthetic drag pipeline. It exposes the same API used by the end-to-end suites:

```ts
import { dragResidentCard } from './utils/dragResidentCard';

await dragResidentCard(page, sourceLocator, targetLocator, {
  stepDelayMs: 25,
});
```

## LocationCard.playwright.spec.ts

The new spec validates the bloom animation and invalid drop styling directly on the `LocationCard` component:

- Seeds the sandbox via `navigateToVillageSandbox` + `seedVillageSandbox`.
- Forces drag state with `setDraggingResidentId` and waits for `getLocationDropState` to surface `valid` / `invalid`.
- Asserts the component-level `data-state`, `data-can-drop`, and `data-bloom-visible` attributes before and after calling `dragResidentCard`.

Run it with:

```bash
npx playwright test tests/components/LocationCard.playwright.spec.ts --project=Desktop-Chrome
```

(If a future `npm run test:components` script is introduced, it can target the same spec via `--grep "LocationCard"`.)
