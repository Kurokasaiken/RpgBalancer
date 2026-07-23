import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { createCanvas, loadImage } from '@napi-rs/canvas';
const BASE='public/assets/world/wanderlust/base';
const m=JSON.parse(readFileSync(join(BASE,'manifest.fullcanvas.json'),'utf8'));
const layers=[...m.surfaceLayers].filter(l=>!l.tags?.includes('ui')&&!l.tags?.includes('frame')&&!l.tags?.includes('border')).sort((a,b)=>a.zIndex-b.zIndex);
const W=1060,H=707; // 1/4 scala
const cv=createCanvas(W,H); const ctx=cv.getContext('2d');
ctx.fillStyle='#7fb0c8'; ctx.fillRect(0,0,W,H);
for(const l of layers){ const img=await loadImage(join(BASE,'layers-fullcanvas',l.file)); ctx.globalAlpha=l.opacity??1; ctx.drawImage(img,0,0,W,H); }
const out='/private/tmp/claude-504/-Users-faustoboni-progetti-personali-RPG/ce0544c3-e9ae-4a9b-9630-be7003f45cdd/scratchpad/preview-fullcanvas.png';
writeFileSync(out,cv.toBuffer('image/png')); console.log('OK',out);
