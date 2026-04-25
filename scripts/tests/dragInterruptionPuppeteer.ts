#!/usr/bin/env tsx

/**
 * Puppeteer drag-interruption regression check
 *
 * Launches the TestRosterPage ( `/test` route ) and simulates:
 *  1. Dragging the first PgCard
 *  2. Releasing it outside any valid slot
 *  3. Verifying that the first open slot is still empty and the resident remains available
 *
 * Usage:
 *    PUPPETEER_BASE_URL=http://localhost:4173 \
 *    tsx scripts/tests/dragInterruptionPuppeteer.ts
 *
 * Make sure a dev or preview server is already running that serves the /test page.
 */

import puppeteer, { type ElementHandle } from 'puppeteer';

const BASE_URL = process.env.PUPPETEER_BASE_URL ?? 'http://localhost:4173';
const TEST_ROUTE = `${BASE_URL.replace(/\/$/, '')}/test`;
const OPEN_SLOT_TEST_ID = 'slot-button-slot-lab-open-slot-0';
const OPEN_SLOT_SELECTOR = '[data-testid^="slot-button-slot-lab-open-slot-"]';

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function main() {
  const browser = await puppeteer.launch({ headless: false, slowMo: 120 });
  const page = await browser.newPage();

  try {
    console.log(`🌐 Navigating to ${TEST_ROUTE}`);
    const response = await page.goto(TEST_ROUTE, { waitUntil: 'networkidle0' });
    if (!response || !response.ok()) {
      throw new Error(`Failed to load ${TEST_ROUTE} (status: ${response?.status()})`);
    }

    // Ensure the roster page rendered
    await page.waitForSelector('[data-testid="test-roster-page"]', { timeout: 10_000 });

    const cardHandles = await page.$$('[data-testid="pg-card"]');
    if (!cardHandles.length) {
      throw new Error('No PgCard found on the page; cannot run the test.');
    }

    let firstInteractiveCard: ElementHandle<Element> | null = null;
    for (const handle of cardHandles) {
      const dragState = await handle.evaluate((node) => node.getAttribute('data-drag-state'));
      const isInteractive = dragState !== 'disabled' && dragState !== 'locked';
      if (isInteractive) {
        firstInteractiveCard = handle;
        break;
      }
    }

    if (!firstInteractiveCard) {
      throw new Error('Unable to find an interactive PgCard (all appear disabled or locked).');
    }

    const openSlots = await page.$$(OPEN_SLOT_SELECTOR);
    if (!openSlots.length) {
      throw new Error('No open slots found on the page; cannot verify drag interruption.');
    }

    const initialOccupancy = await Promise.all(
      openSlots.map(async (slot) => {
        const testId = await slot.evaluate((node) => node.getAttribute('data-testid'));
        const assigned = await slot.$('[data-testid="assigned-worker"]');
        return { testId, occupied: Boolean(assigned) };
      }),
    );

    const preOccupied = initialOccupancy.filter((entry) => entry.occupied);
    if (preOccupied.length) {
      throw new Error(
        `Open slots already occupied before drag: ${preOccupied.map((entry) => entry.testId ?? 'unknown').join(', ')}`,
      );
    }

    const cardBox = await firstInteractiveCard.boundingBox();
    if (!cardBox) {
      throw new Error('Unable to compute bounding box for the first PgCard.');
    }

    const startX = cardBox.x + cardBox.width / 2;
    const startY = cardBox.y + cardBox.height / 2;
    const outsideX = startX + Math.max(350, cardBox.width * 2);
    const outsideY = Math.max(20, startY - 220);

    console.log('🖱️  Performing drag outside any slot...');
    await page.mouse.move(startX, startY);
    await page.mouse.down();
    await page.mouse.move(startX + 40, startY + 20, { steps: 5 });
    await page.mouse.move(outsideX, outsideY, { steps: 12 });
    await page.mouse.up();

    await delay(250);

    const postOccupancy = await Promise.all(
      openSlots.map(async (slot) => {
        const testId = await slot.evaluate((node) => node.getAttribute('data-testid'));
        const assigned = await slot.$('[data-testid="assigned-worker"]');
        return { testId, occupied: Boolean(assigned) };
      }),
    );

    const newlyOccupied = postOccupancy.filter((entry) => entry.occupied);

    const residentStatus = (await firstInteractiveCard.evaluate((node) => {
      const text = (node as HTMLElement).textContent || '';
      return text.toLowerCase();
    })) as string;

    const looksAvailable = residentStatus.includes('disponibile') || residentStatus.includes('available');

    const dragState = (await firstInteractiveCard.evaluate((node) => node.getAttribute('data-drag-state'))) as string | null;

    console.log('📊 Results:');
    console.log(`   • Newly occupied slots: ${newlyOccupied.length ? newlyOccupied.map((entry) => entry.testId).join(', ') : 'none'}`);
    console.log(`   • Resident shows available text: ${looksAvailable}`);
    console.log(`   • data-drag-state: ${dragState}`);

    if (newlyOccupied.length) {
      throw new Error(
        `Unexpected assignment detected on slots: ${newlyOccupied.map((entry) => entry.testId ?? 'unknown').join(', ')}`,
      );
    }

    if (dragState && dragState !== 'idle') {
      throw new Error(`Resident did not return to idle state (state=${dragState}).`);
    }

    if (!looksAvailable) {
      throw new Error('Resident no longer appears as available after drag interruption.');
    }

    console.log('✅ Drag interruption behaved as expected.');
  } finally {
    await page.close();
    await browser.close();
  }
}

main().catch((error) => {
  console.error('❌ Puppeteer drag interruption check failed:', error.message);
  process.exitCode = 1;
});
