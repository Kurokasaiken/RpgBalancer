import sharp from 'sharp';
import fs from 'fs';
const SRC = '.mw/specs/hud-zanara/assets/roster-sheet-v2-0.png';
const g = JSON.parse(fs.readFileSync('public/mockups/hud-lab/attach/sheet-holes.json'));
const { W, H, holes } = g;
const rings = holes.filter(h => h.cx < W * 0.45).sort((a, b) => a.cy - b.cy);
const plaques = holes.filter(h => h.cx >= W * 0.45).sort((a, b) => a.cy - b.cy);
console.log('rings:', rings.map(h=>`(${h.cx|0},${h.cy|0}) r${((h.maxX-h.minX+1)/2)|0}`).join(' '));
console.log('plaque interiors:', plaques.map(h=>`x${h.minX}-${h.maxX} y${h.minY}-${h.maxY}`).join(' '));
// pitch check on ring centers
const cy = rings.map(h => h.cy);
const pitch = cy.slice(1).map((c, i) => c - cy[i]);
console.log('pitch:', pitch.map(p => p.toFixed(0)).join(','), '| maxDev:', Math.max(...pitch.map(p=>Math.abs(p-pitch[0]))).toFixed(0),'px');
// row cuts: midpoints between consecutive ring centers
const cuts = [];
for (let i = 0; i < rings.length; i++) {
  const top = i === 0 ? Math.max(0, cy[i] - (pitch[0] || 300) * 0.52) : (cy[i - 1] + cy[i]) / 2;
  const bot = i === rings.length - 1 ? Math.min(H, cy[i] + (pitch[pitch.length - 1] || 300) * 0.52) : (cy[i] + cy[i + 1]) / 2;
  cuts.push([Math.round(top), Math.round(bot)]);
}
console.log('cuts:', cuts.map(c=>`${c[0]}-${c[1]}(${c[1]-c[0]}px)`).join(' '));
const mount = { rings: [], plaques: [] };
for (let i = 0; i < rings.length; i++) {
  const [a, b] = cuts[i];
  await sharp(SRC).extract({ left: 0, top: a, width: W, height: b - a }).png().toFile(`public/mockups/hud-lab/attach/sheet-row-${i}.png`);
  mount.rings.push({ cx: +(rings[i].cx).toFixed(1), cy: +(rings[i].cy - a).toFixed(1), r: +((rings[i].maxX - rings[i].minX + 1) / 2).toFixed(1) });
  const pl = plaques[i];
  mount.plaques.push({ x0: pl.minX, y0: pl.minY - a, x1: pl.maxX, y1: pl.maxY - a });
}
fs.writeFileSync('public/mockups/hud-lab/attach/sheet-mount.json', JSON.stringify(mount, null, 1));
console.log('mount zones saved');
