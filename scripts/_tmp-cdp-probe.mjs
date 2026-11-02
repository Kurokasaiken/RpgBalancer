import { chromium } from 'playwright';
try {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  console.log('connect OK, contexts:', b.contexts().length);
  const ctx = b.contexts()[0];
  const page = await ctx.newPage().catch(e => console.log('newPage fail:', String(e).slice(0,120)));
  console.log('done');
  await b.close();
} catch (e) { console.log('CONNECT FAIL:', String(e).split('\n')[0]); }
process.exit(0);
