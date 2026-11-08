import { chromium } from 'playwright';
const b = await chromium.launch({args:['--enable-unsafe-swiftshader']});
for (const [name, path] of [['lost','hud-compose?comp=lost&view=narrative'],['reliquary','hud-compose?comp=reliquary&view=narrative']]) {
  const page = await b.newPage({viewport:{width:1600,height:900}});
  await page.goto(`http://localhost:5173/${path}`,{waitUntil:'networkidle',timeout:30000});
  await page.waitForTimeout(3500);
  await page.screenshot({path:`test-results/signed-${name}.png`});
  await page.close(); console.log(name,'done');
}
await b.close();
