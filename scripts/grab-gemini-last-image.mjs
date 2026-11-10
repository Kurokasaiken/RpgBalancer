#!/usr/bin/env node
/**
 * grab-gemini-last-image — save the LAST generated image of an already-open Gemini
 * chat tab (CDP :9222) without sending anything. For when the Director iterates
 * by hand in Canary and says "the last image is good".
 *
 * Usage: node scripts/grab-gemini-last-image.mjs <chat-id-or-url-prefix> <out.png>
 */
import { chromium } from 'playwright';
import fs from 'fs';

const [match, out] = process.argv.slice(2);
if (!match || !out) { console.error('usage: <chat-id> <out.png>'); process.exit(2); }
const browser = await chromium.connectOverCDP('http://127.0.0.1:9222');
const page = browser.contexts()[0].pages().find((p) => p.url().includes(match));
if (!page) { console.error('no open tab matches', match); process.exit(3); }
const SEL = 'GENERATED-IMAGE img, SINGLE-IMAGE img';
const n = await page.evaluate((s) => [...document.querySelectorAll(s)].filter((e) => e.naturalWidth > 32).length, SEL);
console.log('generated images in chat:', n);
const b64 = await page.evaluate((s) => {
  const els = [...document.querySelectorAll(s)].filter((e) => e.naturalWidth > 32);
  const el = els[els.length - 1];
  const c = document.createElement('canvas'); c.width = el.naturalWidth; c.height = el.naturalHeight;
  c.getContext('2d').drawImage(el, 0, 0);
  return { w: el.naturalWidth, h: el.naturalHeight, data: c.toDataURL('image/png').split(',')[1] };
}, SEL);
fs.writeFileSync(out, Buffer.from(b64.data, 'base64'));
console.log('saved', out, b64.w + 'x' + b64.h);
process.exit(0);
