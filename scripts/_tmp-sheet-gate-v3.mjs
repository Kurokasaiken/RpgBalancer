import sharp from 'sharp';
import fs from 'fs';
const SRC = '.mw/specs/hud-zanara/assets/roster-sheet-v3-0.png';
const { data, info } = await sharp(SRC).raw().toBuffer({ resolveWithObject: true });
const W = info.width, H = info.height, ch = info.channels;
const isBg = (r,g,b) => Math.abs(r-10)+Math.abs(g-22)+Math.abs(b-34) < 55;
const bgMask = new Uint8Array(W*H);
for (let i=0;i<W*H;i++){ const j=i*ch; bgMask[i]=isBg(data[j],data[j+1],data[j+2])?1:0; }
const seen = new Uint8Array(W*H); const q=[];
for (let x=0;x<W;x++){if(bgMask[x])q.push(x);if(bgMask[(H-1)*W+x])q.push((H-1)*W+x);}
for (let y=0;y<H;y++){if(bgMask[y*W])q.push(y*W);if(bgMask[y*W+W-1])q.push(y*W+W-1);}
while(q.length){const i=q.pop();if(seen[i])continue;seen[i]=1;const x=i%W,y=(i/W)|0;
  for(const[dx,dy]of[[1,0],[-1,0],[0,1],[0,-1]]){const nx=x+dx,ny=y+dy;
    if(nx>=0&&ny>=0&&nx<W&&ny<H){const ni=ny*W+nx;if(bgMask[ni]&&!seen[ni])q.push(ni);}}}
const hole=new Uint8Array(W*H);
for(let i=0;i<W*H;i++)hole[i]=bgMask[i]&&!seen[i]?1:0;
const comp=new Int32Array(W*H).fill(-1);const comps=[];
for(let i=0;i<W*H;i++){if(hole[i]&&comp[i]<0){const id=comps.length;const stack=[i];let sx=0,sy=0,n=0,minX=W,maxX=0,minY=H,maxY=0;
  while(stack.length){const j=stack.pop();if(comp[j]>=0)continue;comp[j]=id;const x=j%W,y=(j/W)|0;sx+=x;sy+=y;n++;if(x<minX)minX=x;if(x>maxX)maxX=x;if(y<minY)minY=y;if(y>maxY)maxY=y;
    for(const[dx,dy]of[[1,0],[-1,0],[0,1],[0,-1]]){const nx=x+dx,ny=y+dy;if(nx>=0&&ny>=0&&nx<W&&ny<H){const nj=ny*W+nx;if(hole[nj]&&comp[nj]<0)stack.push(nj);}}}
  comps.push({cx:sx/n,cy:sy/n,n,minX,maxX,minY,maxY});}}
const holes=comps.filter(c=>c.n>W*H*0.005).sort((a,b)=>a.cy-b.cy);
const rings=holes.filter(h=>h.cx<W*0.45), plaques=holes.filter(h=>h.cx>=W*0.45);
console.log('rings:',rings.map(h=>`(${h.cx|0},${h.cy|0})r${((h.maxX-h.minX+1)/2)|0}`).join(' '));
const cy=rings.map(h=>h.cy);
const cuts=[];
for(let i=0;i<rings.length;i++){
  const p=cy[1]?cy[1]-cy[0]:300;
  const top=i===0?Math.max(0,cy[i]-p*0.52):(cy[i-1]+cy[i])/2;
  const bot=i===rings.length-1?Math.min(H,cy[i]+(cy[i]-cy[i-1]||p)*0.52):(cy[i]+cy[i+1])/2;
  cuts.push([Math.round(top),Math.round(bot)]);
}
console.log('cuts:',cuts.map(c=>`${c[0]}-${c[1]}`).join(' '));
const mount={rings:[],plaques:[],rowH:cuts[0][1]-cuts[0][0]};
for(let i=0;i<rings.length;i++){const[a,b]=cuts[i];
  await sharp(SRC).extract({left:0,top:a,width:W,height:b-a}).png().toFile(`public/mockups/hud-lab/attach/sheet-row-${i}.png`);
  mount.rings.push({cx:+rings[i].cx.toFixed(1),cy:+(rings[i].cy-a).toFixed(1),r:+((rings[i].maxX-rings[i].minX+1)/2).toFixed(1)});
  const pl=plaques[i]; if(pl) mount.plaques.push({x0:pl.minX,y0:pl.minY-a,x1:pl.maxX,y1:pl.maxY-a});
}
fs.writeFileSync('public/mockups/hud-lab/attach/sheet-mount.json',JSON.stringify({W,H,...mount},null,1));
console.log('rows cut, mount saved');
