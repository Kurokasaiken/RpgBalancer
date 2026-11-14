import { chromium } from 'playwright';
const b = await chromium.connectOverCDP('http://localhost:9222');
const p = b.contexts()[0].pages().filter(pg => pg.url().includes('grok.com')).pop();
console.log('URL:', p.url());
// scroll to bottom
await p.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
await p.waitForTimeout(2500);
await p.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
await p.waitForTimeout(2500);
await p.screenshot({path:'/tmp/grok-tail.png'});
// dump last message texts
const texts = await p.evaluate(() => {
  const els = [...document.querySelectorAll('.message-bubble, [class*="message"], article')];
  return els.slice(-6).map(e => e.innerText.slice(0, 400));
});
console.log(JSON.stringify(texts, null, 1));
process.exit(0);
