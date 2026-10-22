/** T-04 eye-check captures: journey leg art on /theater-lab (headless). */
import { chromium } from 'playwright';
import path from 'path';

const BASE = 'http://localhost:5173';
const OUT = 'test-results';

async function main() {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 760 } });
  for (const scene of ['viaggio-andata', 'viaggio-ritorno']) {
    await page.goto(`${BASE}/theater-lab?scene=${scene}`, { waitUntil: 'networkidle' });
    const stage = page.locator('[data-testid="depth-scene"]');
    await stage.waitFor({ state: 'visible', timeout: 15000 });
    await page.waitForTimeout(3500); // entrance settles into pose + ambient fx
    await stage.screenshot({ path: path.join(OUT, `journey-${scene}.png`) });
    console.log(`captured ${scene}`);
  }
  await browser.close();
}
main().catch((e) => { console.error(e); process.exit(1); });
