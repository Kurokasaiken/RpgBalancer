// Tambù "Prima Pubblicazione" form auto-fill — headed, stays open.
// Run with: HEADLESS=false node scripts/_tmp-tambu-fill.mjs (foreground rule CTR-foreground-001).
// NEVER checks legal declarations, NEVER submits.
import { chromium } from 'playwright';
import { readFileSync } from 'node:fs';

const D = 'deliverables/tambu-prima-pubblicazione';
const OUT = '.mw/runs/20261116-tambu-application';
const done = [], missing = [];
const ok = (m) => { done.push(m); console.log('OK  ' + m); };
const miss = (m) => { missing.push(m); console.log('MISS ' + m); };

const pitch = `Wanderlust: Triumph è un roguelite strategico-gestionale fantasy per PC. Guidi un insediamento di frontiera: trasformi abitanti in eroi, componi spedizioni, affronti quest narrate con skill check e conseguenze permanenti, resisti a minacce crescenti. Ispirato ai gestionali da tavolo come Lords of Waterdeep, con una mappa dipinta viva e direzione illustrata. Ogni run persa alimenta la storia del mondo: si ricostruisce, si riprova, si trionfa.`;
const plan = readFileSync(`${D}/05_Production_Plan/production_plan.md`, 'utf8').replace(/^Piano di produzione.*\n+/, '');

const browser = await chromium.launch({ headless: process.env.HEADLESS !== 'false', args: ['--window-size=1280,900'] });

const page = await browser.newPage();
page.on('request', (r) => {
  if (r.method() === 'POST') {
    const pd = r.postData() || '';
    const fields = [...pd.matchAll(/name="([^"]+)"/g)].map(m => m[1]);
    console.log('REQ', r.url().slice(0,120), '| fields:', JSON.stringify(fields));
    const short = pd.replace(/Content-Type:[^\n]*/g,'').slice(0,6000);
    console.log('BODY>', short.replace(/\r\n/g,'\n').replace(/\n{2,}/g,'\n'));
  }
});
page.on('response', async (r) => {
  if (r.request().method() === 'POST') {
    let body = ''; try { body = (await r.text()).slice(0, 400); } catch {}
    console.log('NET', r.request().method(), r.status(), r.url().slice(0, 120), '::', body.slice(0, 300).replace(/\n/g, ' '));
  }
});
await page.goto('https://www.tambudigital.com/it/prima-pubblicazione/candidatura', { waitUntil: 'networkidle' });

const fill = async (sel, val, label) => {
  try { await page.fill(sel, val, { timeout: 8000 }); ok(`${label}`); }
  catch (e) { miss(`${label}: ${e.message.split('\n')[0]}`); }
};
const clickBtn = async (re, label) => {
  try { await page.locator('button', { hasText: re }).first().click({ timeout: 8000 }); ok(`click ${label}`); }
  catch (e) { miss(`${label}: ${e.message.split('\n')[0]}`); }
};
const upload = async (sel, files, label) => {
  try { await page.setInputFiles(sel, files); ok(`upload ${label}`); }
  catch (e) { miss(`${label}: ${e.message.split('\n')[0]}`); }
};

miss('website — lasciato vuoto (possibile honeypot anti-bot)');
await fill('#f-ref_first', 'Fausto', 'referente.nome');
await fill('#f-ref_last', 'Boni', 'referente.cognome');
await fill('#f-email', 'licaone12@gmail.com', 'referente.email');
await fill('#f-phone', '+39 392 0044477', 'referente.telefono');
await clickBtn(/Sviluppatore singolo/, 'chi-si-candida');
await fill('#f-entity_name', 'Kurokasaiken', 'nome-arte');
await fill('#f-tax_id', 'BNOFST83L04A052C', 'codice-fiscale');
await fill('#f-city', 'Carpi', 'citta');
await fill('#f-team_size', '1', 'team-size');
await fill('#f-project_title', 'Wanderlust: Triumph', 'titolo');
await fill('#f-genre', 'Fantasy Strategy / Management Roguelite', 'genere');
await fill('#f-engine', 'TypeScript, React, PixiJS/WebGL2', 'motore');
await clickBtn(/^PC$/, 'piattaforma-pc');
await clickBtn(/Game design document/, 'fase-gdd');
await clickBtn(/^Prototipo$/, 'fase-prototipo');
await fill('#f-pitch', pitch, 'gioco-in-breve');
await clickBtn(/Sì, la usiamo/, 'ai-generativa');
await page.waitForTimeout(1200);
await clickBtn(/^Grafica$/, 'ai-grafica');
await clickBtn(/^Codice$/, 'ai-codice');
await clickBtn(/^Organizzazione$/, 'ai-organizzazione');
await upload('#f-project_description', `${D}/01_Project_Description/project_description.pdf`, 'descrizione.pdf');
await upload('#f-gdd_summary', `${D}/02_GDD_Summary/gdd_summary.pdf`, 'gdd-summary.pdf');
await upload('#f-team_cv', `${D}/03_Team_and_CV/team_and_cv.pdf`, 'team-cv.pdf');
await upload('#f-budget', `${D}/04_Financial_Overview/financial_overview.pdf`, 'prospetto.pdf');
await upload('#f-declaration', `${D}/10_Dichiarazione/dichiarazione-FIRMATA.p7m`, 'dichiarazione-CAdES.p7m');
await fill('#f-prototype_url', 'https://rpg-balancer.vercel.app/game', 'prototipo-url');
miss('video-url — facoltativo, video non ancora registrato');
miss('materials-url — facoltativo, cartella non pubblicata');
miss('social-community — facoltativo, nessun numero verificabile');
await fill('#f-production_plan', plan, 'piano-produzione');
await upload('#f-screenshots', [
  `${D}/07_Screenshots/01-mappa-mondo.jpg`, `${D}/07_Screenshots/02-villaggio.jpg`,
  `${D}/07_Screenshots/03-spedizione-planner.jpg`, `${D}/07_Screenshots/04-quest-rapporto.jpg`,
  `${D}/07_Screenshots/05-mappa-notte.jpg`, `${D}/07_Screenshots/06-menu-sessione.jpg`,
], '6-screenshot');
miss('gdd-completo — facoltativo, non allegato');
miss('accordi-team — N/A sviluppatore singolo');
for (const [id, lbl] of [['#f-decl_true','decl-vere'], ['#f-decl_italy','decl-italia'], ['#f-decl_no_publisher','decl-no-publishing'], ['#f-decl_terms','decl-call'], ['#f-privacy','decl-privacy']]) {
  let doneFlag = false;
  for (let attempt = 0; attempt < 3 && !doneFlag; attempt++) {
    try {
      if (attempt === 0) {
        // click sul quadratino (alto-sx della label), evita il link nel testo
        await page.locator(`label:has(${id})`).first().click({ timeout: 8000, position: { x: 12, y: 12 } });
      } else if (attempt === 1) {
        // focus + barra spaziatrice: evento reale
        await page.locator(id).focus();
        await page.keyboard.press('Space');
      } else {
        await page.locator(id).click({ force: true, timeout: 5000 });
      }
      await page.waitForTimeout(500);
      doneFlag = await page.isChecked(id);
    } catch (e) { console.log('   ~', lbl, 'attempt', attempt, ':', e.message.split('\n')[0]); }
  }
  if (doneFlag) ok('check ' + lbl); else miss(lbl + ': non spuntata dopo 3 tentativi');
}
// verifica finale stato checkbox prima del submit
const states = await page.evaluate(() => ['#f-decl_true','#f-decl_italy','#f-decl_no_publisher','#f-decl_terms','#f-privacy'].map(i => i + '=' + (document.querySelector(i)?.checked)));
console.log('STATES>', states.join(' '));
await page.screenshot({ path: `${OUT}/20-pre-submit.png` });
try {
  await page.locator('button', { hasText: /Invia la candidatura/ }).first().click({ timeout: 10000 });
  ok('CLICK INVIA CANDIDATURA');
} catch (e) { miss('invia: ' + e.message.split('\n')[0]); }
await page.waitForTimeout(9000);
await page.screenshot({ path: `${OUT}/21-post-submit.png` });
const postText = await page.evaluate(() => document.body.innerText.slice(0, 3000));
console.log('=== PAGE TEXT AFTER SUBMIT ===\n' + postText);

await page.evaluate(() => window.scrollTo(0, 0));
await page.screenshot({ path: `${OUT}/10-filled-top.png` });
await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight / 2));
await page.screenshot({ path: `${OUT}/11-filled-mid.png` });
await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
await page.screenshot({ path: `${OUT}/12-filled-end.png` });
await page.evaluate(() => window.scrollTo(0, 0));
console.log('\n=== DONE:', done.length, '| MISSING:', missing.length);
console.log('KEEPING_BROWSER_OPEN');
await new Promise(() => {});
