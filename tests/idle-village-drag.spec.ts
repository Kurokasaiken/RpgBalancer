import { test, expect } from '@playwright/test';

test('Idle Village drag and drop resident to map slot', async ({ page }) => {
  // Navigate to Idle Village
  await page.goto('/');
  await page.waitForLoadState('networkidle');

  // Click menu or navigate to Idle Village
  const idleVillageLink = page.locator('a, button').filter({ hasText: /Idle Village/i }).first();
  if (await idleVillageLink.isVisible()) {
    await idleVillageLink.click();
    await page.waitForLoadState('networkidle');
  }

  await page.waitForTimeout(2000);

  // Check if we have resident cards
  const residentCards = page.locator('[id^="resident-"]');
  const cardCount = await residentCards.count();
  console.log(`Found ${cardCount} resident cards`);
  expect(cardCount).toBeGreaterThan(0);

  // Get first resident card
  const firstCard = residentCards.first();
  const cardId = await firstCard.getAttribute('id');
  console.log(`Testing drag from: ${cardId}`);

  // Get card position
  const cardBox = await firstCard.boundingBox();
  expect(cardBox).toBeTruthy();
  console.log(`Card box: ${JSON.stringify(cardBox)}`);

  // Find drop targets (map slots)
  const dropTargets = page.locator('[id^="slot-"]');
  const targetCount = await dropTargets.count();
  console.log(`Found ${targetCount} drop targets`);
  expect(targetCount).toBeGreaterThan(0);

  const firstTarget = dropTargets.first();
  const targetId = await firstTarget.getAttribute('id');
  console.log(`Testing drop to: ${targetId}`);

  const targetBox = await firstTarget.boundingBox();
  expect(targetBox).toBeTruthy();
  console.log(`Target box: ${JSON.stringify(targetBox)}`);

  // Perform drag and drop
  console.log('Starting drag and drop...');
  
  // Listen for console messages
  const consoleLogs: string[] = [];
  page.on('console', (msg) => {
    consoleLogs.push(`[${msg.type()}] ${msg.text()}`);
  });

  // Drag from card to target
  await firstCard.dragTo(firstTarget);
  
  await page.waitForTimeout(1000);

  // Check console logs for drag events
  console.log('Console logs:', consoleLogs);
  const dragStartLog = consoleLogs.find((log) => log.includes('[DragStart]'));
  const dragEndLog = consoleLogs.find((log) => log.includes('[DragEnd]'));

  console.log('DragStart logged:', !!dragStartLog);
  console.log('DragEnd logged:', !!dragEndLog);

  // Check if overlay appeared during drag
  const overlayElements = page.locator('div').filter({ has: page.locator('text=/^[A-Z]{2}$/')});
  const overlayCount = await overlayElements.count();
  console.log(`Overlay elements found: ${overlayCount}`);

  // Verify drag events fired
  if (dragStartLog) {
    console.log('✓ DragStart event fired');
  } else {
    console.log('✗ DragStart event NOT fired');
  }

  if (dragEndLog) {
    console.log('✓ DragEnd event fired');
  } else {
    console.log('✗ DragEnd event NOT fired');
  }
});
