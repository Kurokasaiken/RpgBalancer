const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.message));
  
  try {
    console.log('Navigating to /test...');
    await page.goto('http://localhost:5173/test');
    console.log('Waiting for test-roster-page...');
    await page.waitForSelector('[data-testid="test-roster-page"]', { timeout: 5000 });
    console.log('Page loaded successfully');
  } catch (e) {
    console.log('Navigation failed:', e.message);
  }
  
  await browser.close();
})();
