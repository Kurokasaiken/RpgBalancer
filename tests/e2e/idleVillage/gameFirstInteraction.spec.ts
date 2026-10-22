/**
 * gameFirstInteraction.spec.ts — contratto di prima interazione /game (R-238).
 *
 * Copre i due bug "prima interazione" riportati dal Director sulla superficie
 * roster di /game:
 *
 * INV:custom-drag-overlay.INV-1 — il PRIMO hold su una PgCard mostra il
 *   medaglione senza penalità cold-mount vs gli hold successivi.
 * INV:drag-test-container-v2.INV-1 — tutta la superficie visibile del pill
 *   filtro attiva il <select> nativo, non solo il suo rect (~24px a destra).
 *
 * Nota testimone (T-04): il test A misura l'inserimento del nodo
 * `[data-drag-preview]` (MutationObserver su pointer reale `page.mouse`); il
 * test B verifica la hit-area via `elementFromPoint` — in headless il popup
 * nativo del <select> non renderizza, quindi il testimone visivo resta la run
 * headed (T-04), mentre qui si fissa il contratto DOM.
 */

import { test, expect, type Page } from '@playwright/test';
import { GAME_PERF_BUDGETS } from '../../../src/ui/idleVillage/config/gamePerfBudgets';

type FirstInteractionMarks = { downAt: number; previewAt: number };

/** Apre /game e il pannello roster (shortcut HUD 'r'), pronto alle misure. */
async function openGameWithRoster(page: Page): Promise<void> {
  await page.goto('/game');
  await page.waitForSelector('[data-testid="pixi-world-canvas"]', { timeout: 30_000 });
  await page.waitForSelector('[data-testid="game-boot-screen"]', { state: 'detached', timeout: 30_000 });
  await page.keyboard.press('r');
  await page.waitForSelector('[data-resident-id]', { state: 'visible', timeout: 15_000 });
}

test.describe('/game first-interaction contract (R-238)', () => {
  // INV:custom-drag-overlay.INV-1
  test('first roster-card hold shows the drag medallion without cold-mount penalty', async ({ page }) => {
    await openGameWithRoster(page);

    // Instrumentazione in-page: timestamp pointerdown → inserimento [data-drag-preview].
    await page.evaluate(() => {
      const w = window as unknown as { __gi?: FirstInteractionMarks };
      w.__gi = { downAt: 0, previewAt: 0 };
      const mo = new MutationObserver(() => {
        if (w.__gi && !w.__gi.previewAt && document.querySelector('[data-drag-preview]')) {
          w.__gi.previewAt = performance.now();
        }
      });
      mo.observe(document.body, { childList: true, subtree: true });
      window.addEventListener(
        'pointerdown',
        () => {
          if (w.__gi) {
            w.__gi.downAt = performance.now();
            w.__gi.previewAt = 0;
          }
        },
        { capture: true },
      );
    });

    /** Il preview è "mostrato" quando il nodo drag-preview porta un resident attivo —
     *  condizione vera solo durante un drag reale, indipendentemente da come il
     *  nodo è montato (inserito vs persistente nascosto). */
    const PREVIEW_SHOWN = '[data-drag-preview][data-debug-active-id]';

    const card = page.locator('[data-resident-id]').first();
    const box = await card.boundingBox();
    expect(box).toBeTruthy();
    const px = box!.x + box!.width / 2;
    const py = box!.y + box!.height / 2;

    /** Tiene premuto sul centro della card finché il preview non monta, poi rilascia.
     *  La detection è poll-based: il nodo [data-drag-preview] può persistere tra un
     *  drag e l'altro (portal dnd-kit), quindi non basta una mutazione DOM. */
    const holdAndMeasure = async (): Promise<number | null> => {
      await page.mouse.move(px, py);
      await page.mouse.down();
      const appeared = await page
        .waitForFunction((sel) => {
          const w = window as unknown as { __gi?: FirstInteractionMarks };
          if (!w.__gi) return false;
          const node = document.querySelector(sel);
          if (node && !w.__gi.previewAt) w.__gi.previewAt = performance.now();
          return Boolean(node);
        }, PREVIEW_SHOWN, { timeout: 8_000, polling: 'raf' })
        .then(() => true)
        .catch(() => false);
      await page.mouse.up();
      const m = await page.evaluate(() => {
        const w = window as unknown as { __gi?: FirstInteractionMarks };
        return { ...(w.__gi ?? { downAt: 0, previewAt: 0 }) };
      });
      return appeared && m.downAt > 0 ? m.previewAt - m.downAt : null;
    };

    /** Attende che nessun preview attivo resti in DOM (clone drop-animation incluso). */
    const waitPreviewGone = () =>
      page.waitForFunction((sel) => !document.querySelector(sel), PREVIEW_SHOWN, { timeout: 5_000 }).catch(() => undefined);

    const first = await holdAndMeasure();
    await waitPreviewGone();
    /* Il rilascio sul punto di pickup genera un click sulla card → apre la
     * hero sheet (con animazione d'ingresso), il cui layer intercetterebbe il
     * pointerdown del secondo hold. Attendiamo che appaia, poi la chiudiamo. */
    const heroSheetClose = page.locator('#hero-sheet button[data-skin="close"]');
    const sheetAppeared = await heroSheetClose
      .waitFor({ state: 'visible', timeout: 3_000 })
      .then(() => true)
      .catch(() => false);
    if (sheetAppeared) {
      await heroSheetClose.click();
      await page.waitForSelector('#hero-sheet', { state: 'detached', timeout: 5_000 }).catch(() => undefined);
    }
    const second = await holdAndMeasure();
    await waitPreviewGone();
    const heroSheetClose2 = page.locator('#hero-sheet button[data-skin="close"]');
    if (await heroSheetClose2.waitFor({ state: 'visible', timeout: 1_500 }).then(() => true).catch(() => false)) {
      await heroSheetClose2.click();
      await page.waitForSelector('#hero-sheet', { state: 'detached', timeout: 5_000 }).catch(() => undefined);
    }
    const third = await holdAndMeasure();

    console.log(`[first-interaction] pointerdown→preview: first=${first?.toFixed(0)}ms second=${second?.toFixed(0)}ms third=${third?.toFixed(0)}ms`);

    expect(first, 'primo hold: il drag preview non è mai apparso').not.toBeNull();
    expect(second, 'secondo hold: il drag preview non è mai apparso').not.toBeNull();
    expect(third, 'terzo hold: il drag preview non è mai apparso').not.toBeNull();

    /* Baseline calda = il MINIMO degli hold successivi (riduce il rumore da
     * carico macchina condiviso sul lato "warm" del confronto). */
    const warmBest = Math.min(second!, third!);

    /* Slack per ambiente automatizzato (come gamePerf.spec): la misura è
     * sensibile al carico macchina — il verdict autorevole resta la run headed
     * (T-04). navigator.webdriver è il segnale affidabile: gli UA Playwright
     * non contengono più "Headless". */
    const automated = await page.evaluate(() => navigator.webdriver || /Headless/.test(navigator.userAgent));
    const warmMax =
      GAME_PERF_BUDGETS.budgets.dragOverlayWarmShowMaxMs *
      (automated ? GAME_PERF_BUDGETS.budgets.headless.p95Multiplier : 1);

    // Il primo hold non può costare più di coldDeltaMax oltre un hold già caldo.
    const coldDelta = first! - warmBest;
    expect(
      coldDelta,
      `cold-mount penalty: first=${first!.toFixed(0)}ms vs warm=${warmBest.toFixed(0)}ms (delta ${coldDelta.toFixed(0)}ms)`,
    ).toBeLessThanOrEqual(GAME_PERF_BUDGETS.budgets.dragOverlayColdDeltaMaxMs);

    // E il percorso caldo stesso resta sotto il budget assoluto.
    expect(warmBest, `warm hold ${warmBest.toFixed(0)}ms > ${warmMax}ms`).toBeLessThanOrEqual(warmMax);
  });

  // INV:drag-test-container-v2.INV-1
  test('the whole filter pill hit-tests the native select, not only its rect', async ({ page }) => {
    await openGameWithRoster(page);

    const select = page.getByTestId('roster-filter-select');
    // Il select può essere a dimensione nulla/skin-dependent: il contratto è sul
    // pill visibile (la label), non sul rect del controllo nativo.
    const labelBox = await select.evaluate((el) => {
      const label = el.closest('label');
      if (!label) return null;
      const r = label.getBoundingClientRect();
      return { x: r.x, y: r.y, width: r.width, height: r.height };
    });
    expect(labelBox, 'label pill del filtro non trovata').toBeTruthy();

    const cy = labelBox!.y + labelBox!.height / 2;
    // Punti rappresentativi della superficie visibile: lato icona (dove l'utente
    // clicca di solito) e centro-sinistra del pill.
    const probeXs = [labelBox!.x + 7, labelBox!.x + labelBox!.width * 0.35];

    for (const px of probeXs) {
      const hit = await page.evaluate(
        ({ x, y }) => {
          const el = document.elementFromPoint(x, y);
          return el?.closest('select')?.getAttribute('data-testid') ?? null;
        },
        { x: px, y: cy },
      );
      expect(
        hit,
        `hit-test sul pill filtro @(${px.toFixed(0)},${cy.toFixed(0)}) deve cadere sul select nativo`,
      ).toBe('roster-filter-select');
    }

    // Il select resta interattivo via API: il change path non deve rompersi.
    const roster = page.getByTestId('drag-test-container');
    const initialCount = await roster.getAttribute('data-filtered-count');
    await select.selectOption('injured');
    await expect.poll(async () => roster.getAttribute('data-filtered-count')).not.toEqual(initialCount);
  });
});
