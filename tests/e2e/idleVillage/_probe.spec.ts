import { test } from '@playwright/test';

test('probe5: BV-01 exact sequence', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto('/game');
  await page.waitForFunction(() => Boolean((window as any).__idleVillageTestHooks?.expedition?.['poi-goblin']), null, { timeout: 30_000 });
  const exp = (act: string, ...a: any[]) => page.evaluate(({ act, a }) => (window as any).__idleVillageTestHooks.expedition['poi-goblin'][act](...a), { act, a });
  const run = () => exp('getRun');
  const opts = () => exp('getOptions');
  const dump = async (tag: string) => {
    const info = await page.evaluate(() => {
      const r = (sel: string) => {
        const el = document.querySelector(`[data-testid="${sel}"]`);
        if (!el) return null;
        const b = el.getBoundingClientRect();
        return { x: +b.x.toFixed(0), y: +b.y.toFixed(0), w: +b.width.toFixed(0), h: +b.height.toFixed(0) };
      };
      return {
        geo: document.querySelector('[data-testid="quest-stage-cluster"]')?.getAttribute('data-geo'),
        window: r('quest-window'), column: r('quest-check-column'), compL: r('quest-companion-left'), compTab: r('quest-companion-tab'),
      };
    });
    console.log(tag, JSON.stringify(info));
  };
  const reachWaiting = async () => {
    for (let i = 0; i < 40; i++) {
      const r = await run();
      if (r?.frontier?.status === 'pending') await page.evaluate(() => (window as any).__idleVillageTestHooks.advanceTicks?.(60));
      for (let j = 0; j < 20; j++) {
        if (await page.getByTestId('quest-window-choice').first().isVisible().catch(() => false)) break;
        if (await page.getByTestId('quest-check-column').isVisible().catch(() => false)) break;
        const beat = await page.$('[data-testid="quest-window-beat"]');
        if (await beat?.isVisible().catch(() => false)) await beat.click();
        await page.waitForTimeout(120);
      }
      const o = await opts();
      if (r?.frontier?.status === 'waiting' && o.length) return;
    }
  };
  await exp('demoLaunch');
  await page.waitForSelector('[data-testid="quest-window"]', { timeout: 30_000 });
  await reachWaiting();
  await dump('A');
  await page.getByTestId('quest-party-toggle').click();
  await page.waitForTimeout(500);
  await dump('B');
  // driveToCheck equivalent
  await reachWaiting();
  const o = await opts();
  await exp('choose', o[0]);
  await page.waitForSelector('[data-testid="quest-check-column"]', { timeout: 15_000 });
  // poll every 60ms to catch the transient overlap
  for (let i = 0; i < 20; i++) {
    await dump(`c${i}`);
    await page.waitForTimeout(60);
  }
});
