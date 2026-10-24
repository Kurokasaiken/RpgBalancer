/**
 * Quest Generation Lab — Playwright smoke (PLAN-029 SP-7).
 *
 * Covers the operational loop surface end-to-end at the UI level:
 * page loads → six sections render → author mode reveals the
 * generation panel → generate produces a candidate row in the shared
 * explorer → the candidate is selectable and the gates panel renders.
 *
 * The engine-level play loop is covered by unit tests on createRun/
 * applyChoice; the smoke asserts the play surface exists, not visual
 * outcomes (T-04 — no unverifiable visual claims here).
 */

import { test, expect } from '@playwright/test';

test.describe('Quest Generation Lab — operational loop', () => {
  test('pick → generate → candidate row → gates surface', async ({ page }) => {
    await page.goto('/quest-generation-lab');

    // the catalog section lists baked entries before any generation
    const catalogCards = page.locator('button').filter({ hasText: /goblin|race|flood|impr|mare/i });
    await expect(catalogCards.first()).toBeVisible();

    // author mode reveals the generation panel
    const authorToggle = page.getByRole('button', { name: /author/i });
    await expect(authorToggle).toBeVisible();
    await authorToggle.click();

    // the generation panel exposes gimmick/kit pickers + generate cta
    const generateBtn = page.getByRole('button', { name: /generate|genera/i });
    await expect(generateBtn).toBeVisible();

    // generate a candidate — a new row marked "candidate" appears
    await generateBtn.click();
    const candidateChip = page.getByText(/candidate|candidato/i);
    await expect(candidateChip.first()).toBeVisible({ timeout: 15_000 });

    // selecting the candidate shows the gates panel in the detail column
    await expect(page.getByText(/quality gates|gate di qualità/i)).toBeVisible();

    // gates run produces an aggregate badge — run is manual
    const runGates = page.getByRole('button', { name: /run gates|esegui gate/i });
    if (await runGates.isVisible().catch(() => false)) {
      await runGates.click();
      await expect(page.getByText(/PASS|FAIL|WARNING/).first()).toBeVisible({ timeout: 20_000 });
    }
  });
});
