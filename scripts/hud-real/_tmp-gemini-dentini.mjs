import { chromium } from 'playwright';
const b = await chromium.connectOverCDP('http://localhost:9222');
const p = b.contexts()[0].pages().find(pg => pg.url().includes('gemini.google.com'));
await p.waitForTimeout(2000);
const tools = p.locator('button[aria-label*="Caricamento"]').first();
await tools.click({timeout:10000});
await p.waitForTimeout(1500);
const [chooser] = await Promise.all([
  p.waitForEvent('filechooser', {timeout:15000}),
  p.locator('button, [role="menuitem"]', {hasText: 'Carica file'}).first().click(),
]);
await chooser.setFiles([
  '.mw/runs/20261110-chatgpt-ghiera/ghiera-zanara-prova.png',
  '.mw/runs/20261110-chatgpt-ghiera/medaglione-battezzato-v3.png',
  'public/assets/ui/hud-real/ghiera-doppiobraccio.webp',
]);
await p.waitForTimeout(8000);
const box = p.locator('[contenteditable="true"]:visible, textarea:visible').first();
await box.click();
const prompt = `CONTESTO — asset di gioco reale.

IMG 1 è il design FIRMATO originale: ghiera «zanara» con DENTINI eleganti e raffinati — piccoli denti scolpiti che mordono appena il bordo del medaglione. È questo il meccanismo voluto.
IMG 2 è il medaglione battezzato (C1) che starà dentro la ghiera — resterà invariato.
IMG 3 è la versione attuale BOCCIATA: ganasce massicce, effetto rozzo e grosso. La qualità scultorea è quella giusta (bronzo antico opaco cesellato, smalto smeraldo, perni) ma le ganasce vanno sostituite dai dentini fini di IMG 1.

GENERA: una sola ghiera (anello meccanico ornato) vista frontale, centrata su sfondo scuro uniforme.

VINCOLI:
- Foro centrale VUOTO e pulito (niente medaglione, niente ritratti, niente callout/testo)
- Al posto delle ganasce: 4-6 DENTI PICCOLI ed eleganti sulle diagonali/bordi, come in IMG 1 — zanne sottili forgiate che spuntano dalla banda interna e sfiorano il foro, con piccoli perni a cerniera alla base
- Banda ricca: bronzo antico OPACO cesellato con intarsi in smalto smeraldo profondo — stessa ricchezza di IMG 3, non un'icona piatta
- Smeraldo solo a ore 12
- Proporzioni: diametro esterno ~1.7x il diametro del foro (ghiera tirata sul medaglione, non gigante)
- Posa CHIUSA: i denti sulle diagonali (formazione a X)

Un solo render grande, alta qualità.`;
await box.fill(prompt);
await p.waitForTimeout(500);
await p.keyboard.press('Enter');
console.log('sent, waiting...');
await p.waitForTimeout(120000);
await p.screenshot({path:'/tmp/gemini-dentini.png'});
const srcs = await p.evaluate(() => [...document.querySelectorAll('img')].map(i=>({src:i.src.slice(0,130),w:i.naturalWidth})).filter(i=>i.w>300));
console.log(JSON.stringify(srcs.slice(-5)));
process.exit(0);
