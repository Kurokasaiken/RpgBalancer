/**
 * Interactive Drag & Drop Test
 * 
 * This test runs in headed mode so you can see exactly what happens
 * during drag operations in real-time.
 */

import { test, expect, type Page } from '@playwright/test';
import { dragElement } from '../../utils/dragActions';

const CHARACTER_STORAGE_KEY = 'idle_combat_characters';
const FALLBACK_RESIDENTS = [
  {
    id: 'interactive-1',
    name: 'Interactive One',
    aiBehavior: 'balanced',
    statBlock: {
      hp: 155,
      strength: 6,
      endurance: 5,
      agility: 4,
      intelligence: 3,
      perception: 3,
    },
    equippedSpellIds: [],
    status: 'available',
    fatigue: 0,
    currentHp: 155,
    maxHp: 155,
    isInjured: false,
    isHero: false,
    survivalCount: 0,
    survivalScore: 0,
  },
] as const;

const slotButton = (page: Page, slotId: string) => page.getByTestId(`slot-button-${slotId}`);
const slotContainer = (page: Page, slotId: string) => page.locator(`[data-slot-id="${slotId}"][role="listitem"]`);

const seedIfNeeded = async (page: Page): Promise<number> => {
  const cards = page.getByTestId('pg-card');
  const count = await cards.count().catch(() => 0);
  if (count > 0) return count;

  console.log('📦 Auto-seeding Character Manager for interactive test');
  await page.goto('/');
  await page.waitForLoadState('domcontentloaded');
  await page.evaluate(
    ({ key, dataset }) => {
      localStorage.setItem(key, JSON.stringify(dataset));
      window.dispatchEvent(new CustomEvent('characterStorageUpdated'));
    },
    { key: CHARACTER_STORAGE_KEY, dataset: FALLBACK_RESIDENTS },
  );

  await page.goto('/test');
  await page.waitForLoadState('domcontentloaded');
  await expect(page.getByTestId('test-roster-page')).toBeVisible();
  await page.waitForTimeout(1200);
  return page.getByTestId('pg-card').count();
};

test.describe('Interactive Drag & Drop Test', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/test');
    await page.waitForLoadState('domcontentloaded');
    await expect(page.getByTestId('test-roster-page')).toBeVisible();

    const residentCards = page.getByTestId('pg-card');
    const cardCount = await seedIfNeeded(page);
    expect(cardCount).toBeGreaterThan(0);
    console.log(`✅ Found ${cardCount} residents`);
    
    // Add monitoring script
    await page.addInitScript(() => {
      console.log('🎯 Interactive Drag Test Started');
      
      // Monitor drop state changes
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.attributeName === 'data-drop-state') {
            const element = mutation.target as HTMLElement;
            const slotId = element.getAttribute('data-slot-id');
            const dropState = element.getAttribute('data-drop-state');
            console.log(`🔄 Drop State Changed: Slot ${slotId} → ${dropState}`);
          }
        });
      });
      
      // Start observing after page loads
      setTimeout(() => {
        document.querySelectorAll('[data-slot-id]').forEach(slot => {
          observer.observe(slot, { attributes: true });
        });
        console.log(`👀 Monitoring ${document.querySelectorAll('[data-slot-id]').length} slots`);
      }, 500);
    });
  });

  test('🎮 Interactive: Drag resident to valid slot', async ({ page }) => {
    console.log('🚀 Starting interactive drag test...');
    
    // Find first resident card
    const residentCard = page.getByTestId('pg-card').first();
    await expect(residentCard).toBeVisible();
    console.log('✅ Found resident card');
    
    // Find target slot
    const slotId = 'slot-lab-open-slot-0';
    const targetSlot = page.getByTestId(`slot-button-${slotId}`);
    const slotContainer = page.locator(`[data-slot-id="${slotId}"]`);
    await expect(targetSlot).toBeVisible();
    console.log('✅ Found target slot');
    
    // Get positions for debugging
    const residentBox = await residentCard.boundingBox();
    const targetBox = await targetSlot.boundingBox();
    
    console.log('📍 Positions:', {
      resident: { x: residentBox?.x, y: residentBox?.y, w: residentBox?.width, h: residentBox?.height },
      target: { x: targetBox?.x, y: targetBox?.y, w: targetBox?.width, h: targetBox?.height }
    });
    
    // Wait for user to see the setup
    console.log('⏸️ Pausing for 3 seconds - observe the initial state...');
    await page.waitForTimeout(3000);
    
    // Perform drag with intermediate steps
    console.log('🖱️ Starting drag operation...');
    
    // Start drag
    await residentCard.hover();
    await page.mouse.down();
    await page.waitForTimeout(500);
    
    // Move to target
    if (targetBox && residentBox) {
      const targetCenter = {
        x: targetBox.x + targetBox.width / 2,
        y: targetBox.y + targetBox.height / 2
      };
      
      console.log(`🎯 Moving to target at (${targetCenter.x}, ${targetCenter.y})`);
      
      // Move in steps to see intermediate states
      const steps = 10;
      const startX = residentBox.x + residentBox.width / 2;
      const startY = residentBox.y + residentBox.height / 2;
      
      for (let i = 1; i <= steps; i++) {
        const progress = i / steps;
        const currentX = startX + (targetCenter.x - startX) * progress;
        const currentY = startY + (targetCenter.y - startY) * progress;
        
        await page.mouse.move(currentX, currentY);
        await page.waitForTimeout(100);
        
        // Check drop state at midpoint
        if (i === Math.floor(steps / 2)) {
          const validSlots = page.locator('[data-slot-id][data-drop-state="valid"]');
          const count = await validSlots.count();
          console.log(`🔍 Mid-drag: Found ${count} valid slots`);
        }
      }
    }
    
    // Drop
    console.log('🎯 Dropping on target...');
    await page.mouse.up();
    await page.waitForTimeout(1000);
    
    // Verify results
    console.log('🔍 Checking results...');
    
    // Check for assignment
    const assignmentText = page.getByText(/Rack A · assegnato/);
    const assignmentExists = await assignmentText.first().isVisible();
    
    console.log(`📊 Assignment result: ${assignmentExists ? '✅ SUCCESS' : '❌ FAILED'}`);
    
    // Check drop states
    const validSlots = page.locator('[data-slot-id][data-drop-state="valid"]');
    const validCount = await validSlots.count();
    
    const invalidSlots = page.locator('[data-slot-id][data-drop-state="invalid"]');
    const invalidCount = await invalidSlots.count();
    
    console.log(`📊 Final drop states: ${validCount} valid, ${invalidCount} invalid`);
    
    // Take screenshot for evidence
    await page.screenshot({ 
      path: 'test-results/interactive-drag-result.png',
      fullPage: true 
    });
    console.log('📸 Screenshot saved to test-results/interactive-drag-result.png');
    
    // Final assertion
    expect(assignmentExists).toBeTruthy();
    
    console.log('🎉 Interactive test completed successfully!');
  });

  test('🎮 Interactive: Drag resident to invalid slot', async ({ page }) => {
    console.log('\n🎮 Testing: Drag resident to invalid slot');
    
    await page.reload();
    await page.waitForLoadState('domcontentloaded');
    await expect(page.getByTestId('test-roster-page')).toBeVisible();

    const residentCard = page.getByTestId('pg-card').first();
    const restrictedSlot = slotButton(page, 'slot-lab-restricted-slot-0');
    
    await expect(residentCard).toBeVisible();
    await expect(restrictedSlot).toBeVisible();
    
    console.log('🚀 Starting invalid drag test...');
    
    await dragElement(page, residentCard, restrictedSlot, { steps: 12 });
    await page.waitForTimeout(500);
    
    const assignmentButton = slotContainer(page, 'slot-lab-restricted-slot-0').getByRole('button', { name: /^Clear$/i });
    const hasAssignment = await assignmentButton.isVisible().catch(() => false);
    
    if (!hasAssignment) {
      console.log('✅ Invalid slot correctly rejected (no Clear button)');
    } else {
      console.log('❌ Invalid slot rejection failed (Clear button visible)');
    }
    
    expect(hasAssignment).toBe(false);
    
    console.log('🎉 Invalid drag test completed successfully!');
  });
});
