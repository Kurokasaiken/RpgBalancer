import { chromium } from 'playwright';
const b = await chromium.launch({args:['--enable-unsafe-swiftshader']});
const page = await b.newPage({viewport:{width:1600,height:900}});
for (const r of ['mappa2-lab','game','mappa2']) {
  const res = await page.goto(`http://localhost:5173/${r}`,{waitUntil:'networkidle',timeout:20000}).catch(()=>null);
  if (res && res.status()===200) { await page.waitForTimeout(4000); await page.screenshot({path:`test-results/mappa2-${r}.png`}); console.log('captured',r); break; }
}
await b.close(); console.log('done');
