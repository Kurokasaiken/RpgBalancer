import sharp from 'sharp';
import { writeFileSync } from 'fs';
const SRC = 'public/assets/world/mappa2/base/layers/base_flat.hi.webp';
const OUT = 'deliverables/map-shop';

// 1. Master vendibile hi-res JPG 300dpi
await sharp(SRC).jpeg({ quality: 92 }).withMetadata({ density: 300 })
  .toFile(`${OUT}/wanderlust-map-print-5504x3072-300dpi.jpg`);

// 2. Wallpaper 4K
await sharp(SRC).resize(3840).jpeg({ quality: 88 })
  .toFile(`${OUT}/wanderlust-map-wallpaper-4k.jpg`);

// 3. Preview 1600px con credit line
const svg = `<svg width="1600" height="60"><text x="800" y="40" text-anchor="middle"
  font-family="Georgia,serif" font-size="26" fill="rgba(255,244,214,0.85)"
  style="paint-order:stroke;stroke:rgba(20,12,4,0.6);stroke-width:2px">
  WANDERLUST: TRIUMPH · © 2026 Fausto Boni · wanderlust-triumph (coming soon)</text></svg>`;
await sharp(SRC).resize(1600)
  .composite([{ input: Buffer.from(svg), gravity: 'south' }])
  .jpeg({ quality: 85 }).toFile(`${OUT}/preview-1600.jpg`);
console.log('done');
