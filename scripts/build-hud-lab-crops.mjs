#!/usr/bin/env node
/**
 * build-hud-lab-crops.mjs — R-303 /hud-lab asset pipeline.
 *
 * Crops HUD component regions out of mockup source PNGs into
 * public/mockups/hud-lab/crops/<slot>/<sourceId>.webp and writes
 * public/mockups/hud-lab/manifest.json consumed by src/pages/hud-lab.tsx.
 *
 * Modes:
 *   --grid   emit grid/box-overlay debug images (public/mockups/hud-lab/grid/)
 *            to verify/adjust the slot boxes below.
 *   (none)   emit crops + manifest.
 *
 * Box coordinates are pixel rectangles in source-image space:
 *   [x, y, width, height].
 */
import sharp from 'sharp';
import { mkdirSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const BASE = join(ROOT, 'public/mockups/hud-lab');
const SRC_DIR = join(BASE, 'sources');
const CROP_DIR = join(BASE, 'crops');
const GRID_DIR = join(BASE, 'grid');

/** Canonical slots rendered by /hud-lab. */
const SLOT_ORDER = ['brand', 'resources', 'roster', 'panel', 'nav', 'cornerBL', 'cornerBR', 'seal'];
const SLOT_LABELS = {
  brand: 'Logo / Brand',
  resources: 'Risorse',
  roster: 'Roster',
  panel: 'Pannello contestuale',
  nav: 'Navigazione',
  cornerBL: 'Angolo basso sx',
  cornerBR: 'Angolo basso dx',
  seal: 'Sigillo vittoria',
};

/**
 * Per-source crop boxes. Keys = slot ids; values = [x, y, w, h] in source px.
 * Missing key = source has no iteration for that slot.
 */
const SOURCES = [
  {
    id: 'zanara-v1',
    label: 'Zanara v1',
    file: 'zanara-v1.png',
    slots: {
      brand: [0, 0, 470, 205],
      resources: [885, 10, 690, 105],
      roster: [5, 190, 245, 430],
      panel: [1225, 95, 395, 635],
      nav: [315, 685, 990, 212],
      cornerBL: [0, 640, 310, 260],
      cornerBR: [1330, 690, 245, 200],
    },
  },
  {
    id: 'zanara-v2',
    label: 'Zanara v2 (statuette)',
    file: 'zanara-v2.png',
    slots: {
      brand: [0, 0, 475, 210],
      resources: [880, 15, 690, 100],
      roster: [5, 190, 240, 440],
      panel: [1195, 95, 425, 580],
      nav: [310, 660, 995, 235],
      cornerBL: [0, 630, 310, 260],
      cornerBR: [1310, 630, 362, 260],
    },
  },
  {
    id: 'zanara-v3',
    label: 'Zanara v3',
    file: 'zanara-v3.png',
    slots: {
      brand: [0, 0, 475, 210],
      resources: [880, 15, 690, 100],
      roster: [5, 190, 240, 440],
      panel: [1195, 95, 425, 580],
      nav: [310, 660, 995, 235],
      cornerBL: [0, 630, 310, 260],
      cornerBR: [1310, 630, 362, 260],
    },
  },
  {
    id: 'board-palette',
    label: 'Tavola palette',
    file: 'board-palette.png',
    slots: {
      brand: [5, 10, 480, 180],
      resources: [740, 35, 495, 70],
      roster: [10, 190, 225, 375],
      panel: [1035, 115, 270, 500],
      nav: [325, 575, 915, 175],
      cornerBL: [10, 575, 265, 180],
      cornerBR: [1170, 575, 155, 180],
    },
  },
  {
    id: 'board-breakdown',
    label: 'Tavola breakdown',
    file: 'board-breakdown.png',
    slots: {
      brand: [10, 10, 480, 205],
      resources: [735, 20, 520, 85],
      roster: [15, 190, 225, 360],
      panel: [1195, 130, 340, 470],
      nav: [325, 570, 925, 200],
      cornerBL: [5, 570, 330, 205],
      cornerBR: [1285, 570, 251, 205],
    },
  },
  {
    id: 'mockup1-classic',
    label: 'Mockup 1 (classico)',
    file: 'mockup1-classic.png',
    slots: {
      brand: [5, 5, 360, 75],
      resources: [890, 0, 560, 55],
      roster: [45, 72, 325, 210],
      panel: [1285, 275, 210, 235],
      nav: [495, 520, 550, 84],
      cornerBL: [95, 500, 300, 104],
      cornerBR: [1365, 540, 135, 55],
      seal: [1285, 75, 210, 190],
    },
  },
  // Production sources (screenshots of /game) get appended here after
  // scripts/capture-hud-production.mjs drops them into sources/.
  {
    id: 'production-base',
    label: 'Produzione /game',
    file: 'production-base.png',
    optional: true,
    slots: {
      brand: [10, 0, 305, 75],
      resources: [1190, 0, 410, 72],
      nav: [520, 805, 545, 80],
      cornerBR: [1415, 815, 155, 70],
    },
  },
  {
    id: 'production-roster',
    label: 'Produzione /game',
    file: 'production-roster.png',
    optional: true,
    slots: { roster: [580, 90, 400, 270] },
  },
  {
    id: 'production-panel',
    label: 'Produzione /game',
    file: 'production-panel.png',
    optional: true,
    slots: { panel: [540, 95, 675, 570] },
  },
];

const SLOT_COLORS = {
  brand: '#ff5c5c', resources: '#ffb84d', roster: '#5cff9d', panel: '#5cc8ff',
  nav: '#ff8de1', cornerBL: '#c9a0ff', cornerBR: '#ffd24d', seal: '#7dffd4',
};

const gridSvg = (w, h, slots) => {
  const lines = [];
  for (let x = 100; x < w; x += 100) {
    lines.push(`<line x1="${x}" y1="0" x2="${x}" y2="${h}" stroke="#ffffff55" stroke-width="1"/>`);
    lines.push(`<text x="${x + 3}" y="14" font-size="12" fill="#ffffffcc" font-family="monospace">${x}</text>`);
  }
  for (let y = 100; y < h; y += 100) {
    lines.push(`<line x1="0" y1="${y}" x2="${w}" y2="${y}" stroke="#ffffff55" stroke-width="1"/>`);
    lines.push(`<text x="3" y="${y - 3}" font-size="12" fill="#ffffffcc" font-family="monospace">${y}</text>`);
  }
  for (const [slot, box] of Object.entries(slots)) {
    const [x, y, bw, bh] = box;
    if (bw <= 0 || bh <= 0) continue;
    const c = SLOT_COLORS[slot] ?? '#ffffff';
    lines.push(`<rect x="${x}" y="${y}" width="${bw}" height="${bh}" fill="none" stroke="${c}" stroke-width="3"/>`);
    lines.push(`<text x="${x + 4}" y="${y + 18}" font-size="14" font-weight="bold" fill="${c}" font-family="monospace">${slot}</text>`);
  }
  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">${lines.join('')}</svg>`);
};

const main = async () => {
  const gridMode = process.argv.includes('--grid');
  mkdirSync(CROP_DIR, { recursive: true });
  mkdirSync(GRID_DIR, { recursive: true });

  const manifest = { generated: new Date().toISOString(), slots: [] };

  for (const source of SOURCES) {
    const srcPath = join(SRC_DIR, source.file);
    if (!existsSync(srcPath)) {
      if (!source.optional) console.warn(`SKIP ${source.id}: missing ${srcPath}`);
      continue;
    }
    const img = sharp(srcPath);
    const meta = await img.metadata();
    const w = meta.width, h = meta.height;

    if (gridMode) {
      const out = join(GRID_DIR, `${source.id}-grid.png`);
      await img.clone().composite([{ input: gridSvg(w, h, source.slots), top: 0, left: 0 }]).png().toFile(out);
      console.log(`grid → ${out}`);
      continue;
    }

    for (const [slot, box] of Object.entries(source.slots)) {
      const [x, y, bw, bh] = box;
      if (bw <= 0 || bh <= 0) continue;
      const clamped = {
        left: Math.max(0, Math.round(x)),
        top: Math.max(0, Math.round(y)),
        width: Math.min(Math.round(bw), w - Math.max(0, Math.round(x))),
        height: Math.min(Math.round(bh), h - Math.max(0, Math.round(y))),
      };
      const slotDir = join(CROP_DIR, slot);
      mkdirSync(slotDir, { recursive: true });
      const outName = `${source.id}.webp`;
      await img.clone().extract(clamped).webp({ quality: 92 }).toFile(join(slotDir, outName));
      console.log(`crop ${slot}/${outName} ${clamped.width}x${clamped.height}`);
    }
  }

  if (gridMode) return;

  for (const slot of SLOT_ORDER) {
    const dir = join(CROP_DIR, slot);
    if (!existsSync(dir)) continue;
    const iterations = readdirSync(dir)
      .filter((f) => f.endsWith('.webp'))
      .map((f) => {
        const id = f.replace(/\.webp$/, '');
        const src = SOURCES.find((s) => s.id === id);
        return {
          id,
          label: src?.label ?? id,
          src: `/mockups/hud-lab/crops/${slot}/${f}`,
          provenance: src ? `sources/${src.file}` : f,
        };
      })
      .sort((a, b) => {
        const ia = SOURCES.findIndex((s) => s.id === a.id);
        const ib = SOURCES.findIndex((s) => s.id === b.id);
        return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib);
      });
    manifest.slots.push({ id: slot, label: SLOT_LABELS[slot] ?? slot, iterations });
  }

  writeFileSync(join(BASE, 'manifest.json'), JSON.stringify(manifest, null, 2));
  console.log(`manifest → ${join(BASE, 'manifest.json')} (${manifest.slots.length} slots)`);
};

main().catch((err) => { console.error(err); process.exit(1); });
