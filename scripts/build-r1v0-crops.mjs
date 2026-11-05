#!/usr/bin/env node
/**
 * build-r1v0-crops.mjs — PLAN-110 §13 R1 v0 (composition gate, ruling Director 2026-11-02).
 *
 * Crops the Director-chosen components UNRESTORED from the mockup sources and
 * writes public/mockups/r1v0/r1v0.json with display rects in 1600x900 design
 * space plus the mapping rule used for each piece — no eyeballed coordinates.
 *
 * Source rects = PLAN-110 §1 table (source px). Position rules:
 *  - zanara sources (1672x941): K = 1600/1672 on x,y,w,h.
 *  - C6 (board-breakdown): zanara-v1 cornerBR slot, height matched.
 *  - C7 (mockup1-classic seal): top-right between resources bar and panel
 *    (mirrors its own mockup placement relative to top bar + right panel).
 *  - C8 (board-palette brand): zanara-v1 brand slot, height matched.
 *  - C9/C10 (busts-voce 1536x1024): size x 1600/1536; top pieces keep top edge,
 *    bottom-docked keep bottom margin scaled by 900/1024.
 */
import sharp from 'sharp';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = join(ROOT, 'public/mockups/hud-lab/sources');
const OUT = join(ROOT, 'public/mockups/r1v0');
const K = 1600 / 1672;      // zanara -> R1
const S = 1600 / 1536;      // 1536-wide sources -> R1 (width)
const SV = 900 / 1024;      // 1536x1024 vertical anchor factor
const ZV1_CORNERBR = [1330, 690, 245, 200]; // zanara-v1 slot, source px
const ZV1_BRAND = [0, 0, 470, 205];         // zanara-v1 slot, source px
const Z_PANEL_TOP = 95 * K;                 // zanara-v3 panel top in R1 px

const PIECES = [
  { id: 'C1-emblem', title: 'Emblema (zanara-v2)', file: 'zanara-v2.png', rect: [0, 0, 232, 227], z: 11 },
  { id: 'C1-roster', title: 'Roster colonna (zanara-v2)', file: 'zanara-v2.png', rect: [5, 190, 240, 440], z: 10 },
  { id: 'C2-resources', title: 'Risorse (zanara-v3)', file: 'zanara-v3.png', rect: [880, 15, 690, 100], z: 10 },
  { id: 'C3-nav', title: 'Nav (zanara-v1)', file: 'zanara-v1.png', rect: [315, 685, 990, 212], z: 10 },
  { id: 'C4-panel', title: 'Pannello contestuale (zanara-v3)', file: 'zanara-v3.png', rect: [1195, 95, 425, 580], z: 10 },
  { id: 'C5-cornerBL', title: 'Angolo sx (zanara-v1)', file: 'zanara-v1.png', rect: [0, 640, 310, 260], z: 10 },
  { id: 'C6-cornerBR', title: 'Globo/dock angolo dx (globe-voyage)', file: 'globe-voyage.png', rect: [765, 400, 259, 176], z: 10 },
  { id: 'C7-seal', title: 'Sigillo verdetto (mockup1-classic)', file: 'mockup1-classic.png', rect: [1285, 75, 210, 190], z: 10 },
  { id: 'C8-brand', title: 'Marchio (board-palette)', file: 'board-palette.png', rect: [5, 10, 480, 180], z: 10 },
  { id: 'C9-bust-R', title: 'Busto dx (busts-voce)', file: 'busts-voce.png', rect: [1430, 0, 106, 140], z: 12 },
  { id: 'C10-voice', title: 'Voce Amanuense (busts-voce)', file: 'busts-voce.png', rect: [0, 740, 455, 270], z: 11 },
];

const disp = (p) => {
  const [x, y, w, h] = p.rect;
  switch (p.id) {
    case 'C6-cornerBR': {
      const th = ZV1_CORNERBR[3] * K, tw = (w / h) * th;
      const right = (ZV1_CORNERBR[0] + ZV1_CORNERBR[3] * 0 + ZV1_CORNERBR[2]) * K;
      const bottom = (ZV1_CORNERBR[1] + ZV1_CORNERBR[3]) * K;
      return { at: [right - tw, bottom - th, tw, th],
        rule: `globo da globe-voyage (ruling Director 2026-11-02) — angolo basso-dx ancorato ai bordi slot zanara-v1 cornerBR, height matched` };
    }
    case 'C7-seal': {
      const dw = (w / 1536) * 1600, dh = dw * (h / w);
      const ax = 1600 - 8 - dw, ay = Z_PANEL_TOP + 20;
      return { at: [ax, ay, dw, dh],
        rule: `top-right tra barra risorse (bottom ${Math.round(110*K)}) e pannello, mirror della posizione in mockup1; width-ratio 210/1536` };
    }
    case 'C8-brand': {
      const th = ZV1_BRAND[3] * K;
      return { at: [ZV1_BRAND[0] * K, ZV1_BRAND[1] * K, (w / h) * th, th],
        rule: `zanara-v1 brand slot ${ZV1_BRAND}, height matched` };
    }
    case 'C9-bust-R': return { at: [1600 - w * S, 0, w * S, h * S], rule: `busts-voce right edge anchored, ×S` };
    case 'C10-voice': {
      const dh = h * S, dw = w * S, bot = (1024 - y - h) * SV;
      return { at: [0, 900 - bot - dh, dw, dh],
        rule: `bottom-left anchored (margin ${14}*SV), size ×S — overlap con C5 è intenzionale, lo vede il Director` };
    }
    default: return { at: [x * K, y * K, w * K, h * K], rule: `mockup pos ×K (${K.toFixed(3)})` };
  }
};

const main = async () => {
  mkdirSync(OUT, { recursive: true });
  const pieces = [];
  for (const p of PIECES) {
    const [x, y, w, h] = p.rect;
    const img = sharp(join(SRC, p.file));
    const meta = await img.metadata();
    const clamp = { left: Math.max(0, x), top: Math.max(0, y),
      width: Math.min(w, meta.width - Math.max(0, x)), height: Math.min(h, meta.height - Math.max(0, y)) };
    const out = `${p.id}.webp`;
    await img.extract(clamp).webp({ quality: 92 }).toFile(join(OUT, out));
    const d = disp(p);
    pieces.push({ id: p.id, title: p.title, src: `/mockups/r1v0/${out}`,
      source: { file: p.file, dims: [meta.width, meta.height], rect: p.rect },
      at: d.at.map((v) => Math.round(v * 10) / 10), z: p.z, rule: d.rule });
    console.log(`${p.id}: src ${clamp.width}x${clamp.height} → R1 [${d.at.map((v) => Math.round(v)).join(',')}] (${d.rule})`);
  }
  writeFileSync(join(OUT, 'r1v0.json'), JSON.stringify({
    design: [1600, 900], generated: new Date().toISOString(),
    note: 'R1 v0 — crop NON restaurati (PLAN-110 §13 ruling Director). Gate di composizione.',
    pieces,
  }, null, 2));
  console.log(`r1v0.json → ${pieces.length} pezzi`);
};

main().catch((e) => { console.error(e); process.exit(1); });
