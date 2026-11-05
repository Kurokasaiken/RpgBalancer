#!/usr/bin/env node
/**
 * kit-all-sheet — assemble the single "choose everything" sheet for PLAN-109:
 * one labeled row per piece, stacking the per-piece compare sheets.
 *
 * Usage: node scripts/kit-all-sheet.mjs --gen-dir .mw/specs/hud-zanara/kit/gen --out .mw/specs/hud-zanara/kit/gen/ALL-compare.png
 */
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const argv = process.argv.slice(2);
const opt = (n, d) => { const i = argv.indexOf(`--${n}`); return i >= 0 ? argv[i + 1] : d; };
const genDir = opt('gen-dir', '.mw/specs/hud-zanara/kit/gen');
const out = opt('out', path.join(genDir, 'ALL-compare.png'));
const ORDER = ['K2', 'K3', 'K4', 'K5', 'K6', 'K7', 'K8', 'K9', 'K10', 'K11', 'K12', 'K13', 'K14a', 'K14b', 'K15', 'K16a', 'K16b', 'K17'];
const TITLES = {
  K2: 'placca nome (3 fette)', K3: 'banda verticale', K4: 'castoni ×6', K5: 'emblema sole', K6: 'terminale banda',
  K7: 'lastra 9 fette', K8: 'cartiglio evento', K9: 'giunto', K10: 'foglio alabastro', K11: 'tile smalto',
  K12: 'tile alabastro', K13: 'sigillo verdetto', K14a: 'quadrante Voce', K14b: 'ago Voce', K15: 'icone mondo ×7',
  K16a: 'busto SX barra alta', K16b: 'busto DX barra alta', K17: 'Voce — Amanuense',
};
const MAXW = 1180, BAR = 30, GAP = 14;

const rows = [];
for (const id of ORDER) {
  const f = path.join(genDir, id, `${id}-compare.png`);
  if (!fs.existsSync(f)) { console.log(`${id}: no sheet, skipped`); continue; }
  const img = sharp(f);
  const m = await img.metadata();
  const sc = Math.min(1, MAXW / m.width);
  rows.push({ id, buf: await img.resize(Math.round(m.width * sc), Math.round(m.height * sc)).png().toBuffer(), w: Math.round(m.width * sc), h: Math.round(m.height * sc) });
}
const W = MAXW + 12;
const H = rows.reduce((s, r) => s + r.h + BAR + GAP, 12);
const parts = [{ input: Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}"><rect width="100%" height="100%" fill="#081018"/></svg>`), top: 0, left: 0 }];
let y = 8;
for (const r of rows) {
  parts.push({ input: Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${BAR}"><text x="8" y="${BAR - 9}" fill="#e8d9a0" font-size="17" font-family="monospace" font-weight="bold">${r.id} — ${TITLES[r.id] || ''}</text></svg>`), top: y, left: 6 });
  y += BAR;
  parts.push({ input: r.buf, top: y, left: 6 });
  y += r.h + GAP;
}
await sharp({ create: { width: W, height: H, channels: 4, background: { r: 8, g: 16, b: 24, alpha: 1 } } })
  .composite(parts).png().toFile(out);
console.log('ALL_SHEET', out, `${W}x${H}`, `${rows.length} rows`);
