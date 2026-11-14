import { chromium } from 'playwright';
const browser = await chromium.connectOverCDP('http://127.0.0.1:9222', { timeout: 90000 });
const ctx = browser.contexts()[0];
const page = ctx.pages().filter(p => p.url().includes('gemini.google.com/app') && p.url().endsWith('/app')).pop()
  ?? ctx.pages().find(p => p.url().includes('gemini.google.com/app'));
console.log('page:', page?.url());
const info = await page.evaluate(() => {
  const out = { inputs: [], buttons: [], menus: [] };
  document.querySelectorAll('input[type="file"]').forEach(i => out.inputs.push({ accept: i.accept, name: i.name, cls: i.className.slice(0,60), multiple: i.multiple }));
  document.querySelectorAll('button').forEach(b => {
    const al = b.getAttribute('aria-label') || '';
    if (/upload|attach|allega|file|foto|aggiungi|carica|plus|immagin|image|add/i.test(al)) out.buttons.push(al.slice(0,80));
  });
  document.querySelectorAll('[role="menu"], [role="listbox"]').forEach(m => out.menus.push(m.className.slice(0,60)));
  return out;
});
console.log(JSON.stringify(info, null, 1));
process.exit(0);
