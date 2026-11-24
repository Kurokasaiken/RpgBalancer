import { chromium } from 'playwright';
import path from 'path';
const BASE = 'http://localhost:5173';
async function main() {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 760 } });
  await page.goto(`${BASE}/theater-lab?scene=sentiero-tracce-v3`, { waitUntil: 'networkidle' });
  const stage = page.locator('[data-testid="depth-scene"]');
  await stage.waitFor({ state: 'visible', timeout: 15000 });
  await page.waitForTimeout(3500);
  await stage.screenshot({ path: path.join('test-results', 'witness-sentiero-tracce-v3.png') });
  console.log('captured');
  await browser.close();
}
main().catch((e) => { console.error(e); process.exit(1); });
