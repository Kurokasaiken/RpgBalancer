import { chromium } from 'playwright';
const b = await chromium.launch({args:['--enable-unsafe-swiftshader']});
const shots = [
  ['reliquary', 'hud-compose?comp=reliquary&view=narrative'],
  ['memorial', 'hud-compose?comp=memorial&seed=memorial&view=narrative'],
  ['levelup-idle', 'hud-compose?comp=levelup&view=narrative'],
  ['lost', 'hud-compose?comp=lost&view=narrative'],
];
for (const [name, path] of shots) {
  const page = await b.newPage({viewport:{width:1600,height:900}});
  await page.goto(`http://localhost:5173/${path}`,{waitUntil:'networkidle',timeout:30000});
  await page.waitForTimeout(3500);
  if (name === 'levelup-idle') {
    await page.click('[data-testid="hudreal-levelup-trigger"]');
    await page.waitForTimeout(1200);
    await page.screenshot({path:`test-results/signed-levelup.png`});
  } else {
    await page.screenshot({path:`test-results/signed-${name}.png`});
  }
  await page.close();
  console.log(name, 'done');
}
await b.close();
