/**
 * Visual verification script for the Goblin Event Modal.
 *
 * - Opens the mockup-to-component lab at V17.1 (skeleton) and V17.7 (finish).
 * - Screenshots the right-side component.
 * - Overlays the reference at 40% onto the finish to produce diff.png.
 * - Writes a landmark report with expected vs measured bounds.
 */

import { chromium } from 'playwright';
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const BASE_URL = 'http://localhost:5173';
const OUT_DIR = 'test-results';
const REFERENCE = 'public/mockups/external/goblin-event-lab/reference.png';

async function main() {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });

  try {
    await page.goto(`${BASE_URL}/mockup-to-component`);
    await page.waitForLoadState('networkidle');

    // Click Prev until we reach V17.1 (skeleton + overlay)
    const label = page.locator('span').filter({ hasText: /V17\.1/ });
    const prevButton = page.getByRole('button', { name: 'Prev' });
    for (let i = 0; i < 20; i += 1) {
      if (await label.isVisible().catch(() => false)) break;
      await prevButton.click();
      await page.waitForTimeout(200);
    }
    const rightCard = page.locator('.grid > div:nth-child(2) > div > div').first();
    await rightCard.waitFor({ state: 'visible' });
    await rightCard.screenshot({ path: path.join(OUT_DIR, 'skeleton.png') });

    // Click Next until we reach V17.7 (finish)
    const nextButton = page.getByRole('button', { name: 'Next' });
    for (let i = 0; i < 20; i += 1) {
      if (await page.locator('span').filter({ hasText: /V17\.7/ }).isVisible().catch(() => false)) break;
      await nextButton.click();
      await page.waitForTimeout(200);
    }
    await rightCard.screenshot({ path: path.join(OUT_DIR, 'finish.png') });

    // Diff: overlay reference at 40% on the finish
    const finishMeta = await sharp(path.join(OUT_DIR, 'finish.png')).metadata();
    const ref = await sharp(REFERENCE)
      .resize(finishMeta.width, finishMeta.height, { fit: 'fill' })
      .toBuffer();
    const finish = await sharp(path.join(OUT_DIR, 'finish.png')).toBuffer();

    await sharp(finish)
      .composite([{ input: ref, blend: 'over', opacity: 0.4 }])
      .toFile(path.join(OUT_DIR, 'diff.png'));

    // Landmark report
    const card = await rightCard.boundingBox();
    const report = {
      reference: 'public/mockups/external/goblin-event-lab/reference.png',
      measuredCard: card,
      expectedAspect: 1086 / 1448,
      notes: 'Tolerance bands: major frame bounds ±2px, typography baseline ±2-3px.',
    };
    fs.writeFileSync(path.join(OUT_DIR, 'landmark-report.json'), JSON.stringify(report, null, 2));

    console.log('Screenshots saved:', path.join(OUT_DIR, 'skeleton.png'), path.join(OUT_DIR, 'finish.png'), path.join(OUT_DIR, 'diff.png'));
  } finally {
    await browser.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
