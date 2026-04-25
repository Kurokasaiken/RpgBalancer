/**
 * Simple Debug Test - Verifica comportamento reale drag & drop
 */

import { test, expect } from '@playwright/test';

test('🔍 Simple Debug Test - Real Drag Drop Behavior', async ({ page }) => {
  console.log('\n🔍 SIMPLE DEBUG TEST');
  console.log('===================');

  await page.goto('/test');
  await page.waitForSelector('[data-testid="test-roster-page"]');
  await page.waitForTimeout(2000);

  // Setup console logging
  const consoleMessages: string[] = [];
  page.on('console', msg => {
    consoleMessages.push(msg.text());
    console.log('📝 Browser Console:', msg.text());
  });

  // Test 1: Click assignment
  console.log('\n👆 Test 1: Click su slot vuoto');
  const firstSlot = page.getByTestId('slot-button-slot-lab-open-slot-0');
  await expect(firstSlot).toBeVisible();
  await firstSlot.click();
  await page.waitForTimeout(1000);

  // Check for any assignment text
  const anyAssignment = page.locator('text=/assegnato/');
  const assignmentCount = await anyAssignment.count();
  const assignmentTexts = [];
  for (let i = 0; i < assignmentCount; i++) {
    assignmentTexts.push(await anyAssignment.nth(i).textContent());
  }
  console.log('👆 Found assignments:', assignmentTexts);
  const clickResult = assignmentCount > 0;

  // Test 2: Click assignment to restricted slot (should fail due to HP < 200)
  console.log('\n🎯 Test 2: Click assignment su slot restrittivo (dovrebbe fallire)');
  const restrictedSlot = page.getByTestId('slot-button-slot-lab-restricted-slot-0');
  await expect(restrictedSlot).toBeVisible();
  
  // Clear any existing assignments first
  await page.reload();
  await page.waitForSelector('[data-testid="test-roster-page"]');
  await page.waitForTimeout(1000);
  
  // Try to click on restricted slot
  await restrictedSlot.click();
  await page.waitForTimeout(1000);

  const rackBAssignment = page.getByText(/Rack B · assegnato/);
  const restrictedClickResult = await rackBAssignment.first().isVisible();
  console.log('🎯 Click on restricted slot result:', restrictedClickResult);
  
  // Test 3: Manual drag test using dnd-kit compatible method
  console.log('\n🎯 Test 3: Drag manuale su slot restrittivo');
  const residentCard = page.getByTestId('pg-card').first();
  const restrictedSlot2 = page.getByTestId('slot-button-slot-lab-restricted-slot-0');
  
  // Try a more realistic drag approach
  await residentCard.hover();
  await page.waitForTimeout(100);
  await page.mouse.down();
  await page.waitForTimeout(100);
  
  // Move to restricted slot
  const slotBox = await restrictedSlot2.boundingBox();
  if (slotBox) {
    await page.mouse.move(slotBox.x + slotBox.width / 2, slotBox.y + slotBox.height / 2, { steps: 10 });
    await page.waitForTimeout(200);
    await page.mouse.up();
    await page.waitForTimeout(1000);
    
    const rackBAssignment2 = page.getByText(/Rack B · assegnato/);
    const dragResult = await rackBAssignment2.first().isVisible();
    console.log('🎯 Drag to restricted result:', dragResult);
  }

  // Test 4: Test high HP resident acceptance in restricted slot
  console.log('\n🎯 Test 4: PG con HP sufficiente in slot restrittivo (dovrebbe essere accettato)');
  
  // Clear page and get first resident (should have HP=250 now)
  await page.reload();
  await page.waitForSelector('[data-testid="test-roster-page"]');
  await page.waitForTimeout(1000);
  
  const highHpResident = page.getByTestId('pg-card').first();
  const restrictedSlot3 = page.getByTestId('slot-button-slot-lab-restricted-slot-0');
  
  // Try to drag high HP resident to restricted slot
  await highHpResident.hover();
  await page.waitForTimeout(100);
  await page.mouse.down();
  await page.waitForTimeout(100);
  
  const slotBox3 = await restrictedSlot3.boundingBox();
  if (slotBox3) {
    await page.mouse.move(slotBox3.x + slotBox3.width / 2, slotBox3.y + slotBox3.height / 2, { steps: 10 });
    await page.waitForTimeout(200);
    await page.mouse.up();
    await page.waitForTimeout(1000);
    
    const rackBAssignment3 = page.getByText(/Rack B · assegnato/);
    const highHpResult = await rackBAssignment3.first().isVisible();
    console.log('🎯 High HP resident to restricted result:', highHpResult);
  }

  // Test 5: Check console logs
  console.log('\n📝 Console Messages Analysis:');
  const hasHandleDragEnd = consoleMessages.some(msg => msg.includes('handleDragEnd called'));
  const hasValidationRejection = consoleMessages.some(msg => msg.includes('VALIDATION_FAILED'));
  const hasNativeDrop = consoleMessages.some(msg => msg.includes('Native drop event triggered'));
  const hasOnSlotClick = consoleMessages.some(msg => msg.includes('onSlotClick called'));

  console.log('📝 hasHandleDragEnd:', hasHandleDragEnd);
  console.log('📝 hasValidationRejection:', hasValidationRejection);
  console.log('📝 hasNativeDrop:', hasNativeDrop);
  console.log('📝 hasOnSlotClick:', hasOnSlotClick);

  // Simple assertions
  console.log('\n📊 FINAL RESULTS:');
  console.log('👆 Click assignment worked:', clickResult);
  console.log('🎯 Drag to restricted assigned:', (await page.getByText(/Rack B · assegnato/).first().isVisible()));
  console.log('🎯 Any assignment occurred:', (await page.getByText(/Rack [AB] · assegnato/).first().isVisible()));
});
