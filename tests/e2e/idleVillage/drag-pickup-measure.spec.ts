import { test, expect } from '@playwright/test';

/**
 * Drag Pickup Measurement Probe.
 *
 * Strumento di MISURA, non di signoff. Per handoff §4.C, le conferme automatiche
 * NON chiudono bug visivi. Questo test produce solo numeri:
 *  - rect dell'overlay durante il drag
 *  - posizione cursore simulato
 *  - delta atteso (0,0 se centrato) vs misurato
 *
 * Il signoff finale rimane utente runtime.
 *
 * Uso:
 *   npm run dev     # in un altro terminale, lascia girare
 *   npx playwright test tests/e2e/idleVillage/drag-pickup-measure.spec.ts --headed --project="Desktop Chrome"
 *
 * Output: console.log con numeri + uno screenshot in test-results/.
 */

test('measure pickup alignment at drag start', async ({ page }) => {
  // 1. Apri la surface canonical
  await page.goto('http://localhost:5173/minimal-gameplay', {
    waitUntil: 'networkidle',
  });

  // 2. Trova il primo PG token draggabile nel roster
  // (selettore probabilmente data-testid o ruolo button con label resident)
  const pgCard = page.locator('[data-testid^="pg-card-"]').first();
  await expect(pgCard).toBeVisible({ timeout: 10_000 });

  // 3. Misura rect del PG card e portrait interno PRIMA del drag
  const beforeDrag = await pgCard.evaluate((el) => {
    const cardRect = el.getBoundingClientRect();
    const portrait = el.querySelector('[aria-hidden="true"]') as HTMLElement | null;
    const portraitRect = portrait?.getBoundingClientRect();
    return {
      card: {
        left: cardRect.left,
        top: cardRect.top,
        width: cardRect.width,
        height: cardRect.height,
        centerX: cardRect.left + cardRect.width / 2,
        centerY: cardRect.top + cardRect.height / 2,
      },
      portrait: portraitRect
        ? {
            left: portraitRect.left,
            top: portraitRect.top,
            width: portraitRect.width,
            height: portraitRect.height,
            centerX: portraitRect.left + portraitRect.width / 2,
            centerY: portraitRect.top + portraitRect.height / 2,
          }
        : null,
    };
  });

  console.log('\n=== BEFORE DRAG ===');
  console.log('Card rect:', beforeDrag.card);
  console.log('Portrait rect:', beforeDrag.portrait);

  // 4. Punto di pickup: centro del portrait (il caso comune per l'utente).
  //    Se vogliamo testare il caso "click off-center", cambiare qui.
  const pickupX = beforeDrag.portrait
    ? beforeDrag.portrait.centerX
    : beforeDrag.card.centerX;
  const pickupY = beforeDrag.portrait
    ? beforeDrag.portrait.centerY
    : beforeDrag.card.centerY;

  console.log('\n=== PICKUP TARGET ===');
  console.log(`Click point: (${pickupX.toFixed(1)}, ${pickupY.toFixed(1)})`);

  // 5. Avvia drag: mouse down sul portrait, poi muovi
  await page.mouse.move(pickupX, pickupY);
  await page.mouse.down();

  // dnd-kit ha activation distance / delay; muovi di parecchi pixel
  await page.mouse.move(pickupX + 200, pickupY + 100, { steps: 10 });
  await page.waitForTimeout(150); // dà tempo a CustomDragOverlay di mountare

  // 6. Misura overlay durante il drag
  const duringDrag = await page.evaluate(() => {
    const overlay = document.querySelector('[data-drag-preview="true"]') as HTMLElement | null;
    if (!overlay) return null;
    const rect = overlay.getBoundingClientRect();
    // Cerca anche il medaglione interno (SVG/canvas)
    const medal = overlay.querySelector('.tok-svg, svg, canvas') as HTMLElement | null;
    const medalRect = medal?.getBoundingClientRect() ?? null;
    return {
      overlay: {
        left: rect.left,
        top: rect.top,
        width: rect.width,
        height: rect.height,
        centerX: rect.left + rect.width / 2,
        centerY: rect.top + rect.height / 2,
      },
      medal: medalRect
        ? {
            left: medalRect.left,
            top: medalRect.top,
            width: medalRect.width,
            height: medalRect.height,
            centerX: medalRect.left + medalRect.width / 2,
            centerY: medalRect.top + medalRect.height / 2,
          }
        : null,
    };
  });

  console.log('\n=== DURING DRAG ===');
  console.log('Cursor position:', { x: pickupX + 200, y: pickupY + 100 });
  console.log('Overlay rect:', duringDrag?.overlay);
  console.log('Medal-inside-overlay rect:', duringDrag?.medal);

  // 7. Calcola delta: dove SI ASPETTA il centro overlay vs dove È
  if (duringDrag) {
    const expectedCenterX = pickupX + 200;
    const expectedCenterY = pickupY + 100;

    const overlayDeltaX = duringDrag.overlay.centerX - expectedCenterX;
    const overlayDeltaY = duringDrag.overlay.centerY - expectedCenterY;

    console.log('\n=== DELTA (overlay center vs cursor) ===');
    console.log(`X: ${overlayDeltaX.toFixed(1)} px ${overlayDeltaX < 0 ? '(overlay shifted LEFT)' : overlayDeltaX > 0 ? '(overlay shifted RIGHT)' : '(centered)'}`);
    console.log(`Y: ${overlayDeltaY.toFixed(1)} px ${overlayDeltaY < 0 ? '(overlay shifted UP)' : overlayDeltaY > 0 ? '(overlay shifted DOWN)' : '(centered)'}`);

    if (duringDrag.medal) {
      const medalDeltaX = duringDrag.medal.centerX - expectedCenterX;
      const medalDeltaY = duringDrag.medal.centerY - expectedCenterY;
      console.log(`\nMedal-center delta — X: ${medalDeltaX.toFixed(1)} px, Y: ${medalDeltaY.toFixed(1)} px`);
    }

    // Screenshot per archivio
    await page.screenshot({
      path: `test-results/drag-pickup-measure-${Date.now()}.png`,
      fullPage: false,
    });
  }

  // 8. Cleanup: rilascia il mouse
  await page.mouse.up();

  // NESSUNA expectation di pass/fail — questo è un probe di misura.
  // L'output va letto a mano e confrontato con la percezione utente.
});
