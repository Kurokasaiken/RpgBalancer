import { chromium } from 'playwright';
const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
const ctx = b.contexts()[0];
const pages = ctx.pages();
console.log('pages:', pages.length);
for (const p of pages) { const u = p.url(); if (u.includes('gemini')) { console.log('gemini tab:', u.slice(0,80)); await p.screenshot({ path: '/tmp/gemini-peek.png' }); } }
process.exit(0);
