const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.message));
  
  try {
    console.log('Navigating to /test...');
    await page.goto('http://localhost:5173/test');
    
    // Wait for body to be available
    await page.waitForSelector('body');
    console.log('Body loaded');

    // Check content
    const content = await page.content();
    console.log('Page content length:', content.length);
    if (content.includes('test-roster-page')) {
        console.log('Found test-roster-page in content');
    } else {
        console.log('test-roster-page NOT found in content');
    }

    // Wait explicitly for the test id
    console.log('Waiting for test-roster-page selector...');
    await page.waitForSelector('[data-testid="test-roster-page"]', { timeout: 5000 });
    console.log('Page loaded successfully');
  } catch (e) {
    console.log('Navigation failed:', e.message);
  }
  
  await browser.close();
})();
