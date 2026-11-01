import sharp from 'sharp';
const SRC = '.mw/specs/hud-zanara/assets/medallion-ring-v2-0.png';
const meta = await sharp(SRC).metadata();
console.log('size:', meta.width, 'x', meta.height);
const S = Math.min(meta.width, meta.height), cx = S / 2, cy = S / 2;
// outer r≈0.47*S, inner hole r≈0.385*S
const ro = Math.round(S * 0.47), ri = Math.round(S * 0.385);
const mask = Buffer.from(
  `<svg width="${S}" height="${S}"><path fill="white" fill-rule="evenodd" ` +
  `d="M${cx} ${cy} m-${ro} 0 a${ro} ${ro} 0 1 0 ${ro * 2} 0 a${ro} ${ro} 0 1 0 -${ro * 2} 0 ` +
  `M${cx} ${cy} m-${ri} 0 a${ri} ${ri} 0 1 1 ${ri * 2} 0 a${ri} ${ri} 0 1 1 -${ri * 2} 0"/></svg>`
);
await sharp(SRC).composite([{ input: mask, blend: 'dest-in' }]).png()
  .toFile('public/mockups/hud-lab/attach/ring-gen.png');
console.log('done');
