/**
 * r378Cassetto.spec.ts — R-378 (+rev2, Director 2026-11-24): the signed cassetto
 * on the REAL `/game` route (not the lab host). Asserts the polish rulings in a
 * live browser: mockup-v3 journey glyphs, thin scroll band, empty-vs-occupied
 * seat behaviour (tap→roster only when empty), bag «+»→stash, green victory %
 * on the numbers only, pulsing CTA jewels when the party is complete, and the
 * removed chest scale in the reward well.
 *
 * Assignments go through the eligibility-gated `expedition` hooks — the same
 * gate a real drop crosses (no smuggled residents); seat behaviour is exercised
 * with real pointer clicks on the painted seats.
 */
import { test, expect, type Page } from '@playwright/test';

const POI = 'poi-goblin';
const SLOT_LEADER = `${POI}:goblin-slot-leader`;
const SLOT_MEMBER = `${POI}:goblin-slot-member-1`;
const SLOT_MEMBER_2 = `${POI}:goblin-slot-member-2`;
const SLOT_BODYGUARD = `${POI}:goblin-slot-bodyguard`;

const VALID_LEADER = 'hero-sir-spaccaculi';
const FOLK_FIGHTER = 'villager-mastro-beppe';
const FOLK_SCOUT = 'villager-lisetta';
const FOLK_GUARD = 'villager-baldassarre';

interface TestHooksWindow extends Window {
  __idleVillageTestHooks?: {
    expedition?: Record<string, Record<string, (...a: unknown[]) => unknown>>;
  };
}

const expedition = async <T>(page: Page, action: string, ...args: unknown[]): Promise<T> =>
  page.evaluate(
    ([act, fnArgs]) => {
      const exp = (window as TestHooksWindow).__idleVillageTestHooks?.expedition?.['poi-goblin'];
      if (!exp || typeof exp[act as string] !== 'function') throw new Error(`expedition hook "${act}" missing`);
      return exp[act as string](...(fnArgs as unknown[])) as T;
    },
    [action, args] as const,
  );

const openDetail = async (page: Page) => {
  await expedition<void>(page, 'openDetail');
  await expect(page.locator('[data-cassetto-column]')).toBeVisible({ timeout: 30_000 });
};

const rosterPanel = (page: Page) => page.locator('[data-panel="roster"]');

test.beforeEach(async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/game', { waitUntil: 'domcontentloaded', timeout: 120_000 });
  await page.waitForFunction(
    (poi) => Boolean((window as TestHooksWindow).__idleVillageTestHooks?.expedition?.[poi as string]),
    POI,
    { timeout: 60_000 },
  );
  /* The hooks register before the boot veil lifts — GameBootScreen intercepts
   *  pointer events while assets stream in. Wait it out like a player would. */
  await expect(page.getByTestId('game-boot-screen')).toBeHidden({ timeout: 120_000 });
});

test.describe('R-378 — cassetto polish on the real /game drawer', () => {
  /* INV:cassetto-v2-journey-glyphs — rev2: mockup v3 glyphs (compass / crossed
   *  swords / chasing arrows), not the provisional boot/tent/arrow set. */
  test('journey legs carry the mockup v3 glyphs', async ({ page }) => {
    await openDetail(page);
    const strip = page.locator('[data-block="journey-strip"]');
    await expect(strip.locator('[data-engraved="ico-compass"]')).toHaveCount(1);
    await expect(strip.locator('[data-engraved="ico-swords"]')).toHaveCount(1);
    await expect(strip.locator('[data-engraved="ico-cycle"]')).toHaveCount(1);
    await expect(strip.locator('[data-engraved="ico-target"], [data-engraved="ico-axe"], [data-engraved="ico-gust"], [data-engraved="ico-boot"], [data-engraved="ico-tent"], [data-engraved="ico-return"]')).toHaveCount(0);
  });

  /* R-378: «la barra … occupa troppo spazio, falla + piccola (meno spessa)» —
   *  the band under the party seats is the 8px variant (default stays 14). */
  test('party scroll band is the thin 8px variant', async ({ page }) => {
    await openDetail(page);
    const band = page.locator('[data-cassetto-party-scroller] [data-hud-band-x]');
    await expect(band).toHaveCount(1);
    const box = await band.boundingBox();
    expect(box, 'band must have a box').not.toBeNull();
    expect(box!.height).toBeGreaterThan(0);
    expect(box!.height).toBeLessThanOrEqual(10);
  });

  /* R-378 rev2: «gli slot si devono comportare diversamente se sono occupati o
   *  no. solo se sono vuoti deve fare questo comportamento» — tap on an empty
   *  seat opens the roster; tap on an occupied seat does not (and stays a
   *  no-op, press-hold extraction lives on the hold path). */
  test('seat tap opens the roster only on an empty seat', async ({ page }) => {
    await openDetail(page);
    const emptySeat = page.locator(`[data-testid="slot-button-${SLOT_LEADER}"]`);
    await expect(emptySeat).toBeVisible();
    await expect(rosterPanel(page)).toBeHidden();

    // Empty seat → roster opens.
    await emptySeat.click();
    await expect(rosterPanel(page)).toBeVisible({ timeout: 10_000 });
    await page.keyboard.press('Escape');
    await expect(rosterPanel(page)).toBeHidden({ timeout: 10_000 });

    // Occupy the seat through the real eligibility gate. Wait for the painted
    // token (React must re-render the seat as occupied — a tap that lands
    // while the seat still mounts empty is an honest empty-tap), and close the
    // roster if the assign flow itself summoned it.
    expect(await expedition<boolean>(page, 'assignToSlot', SLOT_LEADER, VALID_LEADER)).toBe(true);
    await expect(page.locator(`[data-testid="slot-token-${SLOT_LEADER}"]`)).toBeVisible({ timeout: 10_000 });
    if (await rosterPanel(page).isVisible()) {
      await page.keyboard.press('Escape');
      await expect(rosterPanel(page)).toBeHidden({ timeout: 10_000 });
    }
    const occupiedSeat = page.locator(`[data-testid="slot-button-${SLOT_LEADER}"]`);
    await occupiedSeat.click();
    await page.waitForTimeout(600);
    await expect(rosterPanel(page)).toBeHidden();

    // And the seat is still occupied: the quick tap was not an extraction.
    const assignments = await expedition<Record<string, string | null>>(page, 'getAssignments');
    expect(assignments[SLOT_LEADER]).toBe(VALID_LEADER);
  });

  /* R-378: «il componente x gli slot consumables che ha dentro il + si deve
   *  aprire lo stash» — the empty pouch niche opens the bound village stash. */
  test('empty bag niche opens the village stash', async ({ page }) => {
    await openDetail(page);
    const niche = page.locator('[data-testid^="bag-slot-empty-"]').first();
    await expect(niche).toBeVisible();
    await niche.click();
    await expect(page.getByTestId('stash-shelf')).toBeVisible({ timeout: 15_000 });
    await page.keyboard.press('Escape');
  });

  /* R-378: «nella parte reward elimina i 5 forzieri speculari ai 5 teschi» —
   *  the reward well keeps emblem + % + concrete chips, no lit/dimmed chests. */
  test('reward well has no chest scale (skulls stay on risk)', async ({ page }) => {
    await openDetail(page);
    const wells = page.locator('[data-block="risk-rewards"]');
    await expect(wells.locator('[data-chest]')).toHaveCount(0);
    await expect(wells.locator('[data-skull]').first()).toBeVisible();
    await expect(wells.locator('[data-testid="cassetto-reward-items"]')).toBeVisible();
  });

  /* R-378 rev2: with a complete party the forecast paints the victory % in
   *  emerald on the numbers only, and the plaque jewels pulse (animation
   *  actually running — measured, not just mounted). */
  test('complete party: green victory % and pulsing jewels', async ({ page }) => {
    await openDetail(page);
    expect(await expedition<boolean>(page, 'assignToSlot', SLOT_LEADER, VALID_LEADER)).toBe(true);
    expect(await expedition<boolean>(page, 'assignToSlot', SLOT_MEMBER, FOLK_FIGHTER)).toBe(true);
    expect(await expedition<boolean>(page, 'assignToSlot', SLOT_MEMBER_2, FOLK_SCOUT)).toBe(true);
    expect(await expedition<boolean>(page, 'assignToSlot', SLOT_BODYGUARD, FOLK_GUARD)).toBe(true);

    /* Victory % — the emerald readout (#5fd98d = rgb(95,217,141)) on the
     *  numbers; the laurel keeps its painted gold. */
    const pct = page.getByTestId('cassetto-success-pct');
    await expect(pct).toBeVisible({ timeout: 30_000 });
    await expect(pct).toHaveCSS('color', 'rgb(95, 217, 141)');

    /* Jewels: mounted only when canSend, animation live — two samples show a
     *  different opacity/transform (the pulse is real, not a static glow). */
    const jewels = page.locator('.cta-jewel');
    await expect(jewels).toHaveCount(3, { timeout: 15_000 });
    const first = jewels.first();
    const sample = () =>
      first.evaluate((el) => {
        const s = getComputedStyle(el);
        return `${s.animationName}|${s.opacity}|${s.transform}`;
      });
    const a = await sample();
    expect(a).toContain('cassettoJewelPulse');
    let pulsed = false;
    for (let i = 0; i < 10 && !pulsed; i++) {
      await page.waitForTimeout(300);
      pulsed = (await sample()) !== a;
    }
    expect(pulsed, 'jewel opacity/transform must change over time (pulse)').toBe(true);
  });
});
