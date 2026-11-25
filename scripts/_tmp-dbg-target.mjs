import { chromium } from 'playwright';
const targets = await (await fetch('http://127.0.0.1:9222/json')).json();
const t = targets.find(x => x.id.startsWith('FD6FD6BF'));
console.log('target', t.id, t.url);
const b = await chromium.connectOverCDP(t.webSocketDebuggerUrl);
console.log('contexts:', b.contexts().length);
for (const c of b.contexts()) {
  console.log('ctx pages:', c.pages().length, c.pages().map(p => p.url()));
}
await b.close();
