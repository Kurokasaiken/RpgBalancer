/**
 * Catalog driver: land on the title screen. `/game` goes straight into the
 * game on a plain browser visit (`shouldShowTitle`: only `?title=1`, Tauri,
 * or the post-quit session flag) — so the driver navigates with the request
 * param. Verifies via `title-screen`.
 */
import type { HarnessCtx } from '../../sentinel/gameSurfaceHarness';

/** Drive the app into the "title screen shown" state. */
export async function drive(ctx: HarnessCtx): Promise<boolean> {
  const { page } = ctx;
  const url = new URL(page.url());
  url.searchParams.set('title', '1');
  await page.goto(url.toString(), { waitUntil: 'domcontentloaded' });
  try {
    await page.getByTestId('title-screen').waitFor({ state: 'visible', timeout: 60_000 });
    return true;
  } catch {
    return false;
  }
}
