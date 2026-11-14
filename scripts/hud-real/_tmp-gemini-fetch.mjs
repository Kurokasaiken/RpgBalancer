import WebSocket from 'ws';
import { writeFileSync } from 'fs';
import http from 'http';
const OUT = '/Users/faustoboni/progetti_personali/RPG/.mw/runs/20261110-chatgpt-ghiera/gen/gemini-ghiera-fix.png';
const listJson = () => new Promise((res, rej) => { http.get('http://localhost:9222/json/list', r => { let d=''; r.on('data',c=>d+=c); r.on('end',()=>res(JSON.parse(d))); }).on('error', rej); });
const targets = await listJson();
const page = targets.find(t => t.type==='page' && /gemini\.google\.com\/app$/.test(t.url)) || targets.find(t=>t.type==='page'&&t.url.includes('gemini.google.com'));
const ws = new WebSocket(page.webSocketDebuggerUrl, { maxPayload: 512*1024*1024 });
await new Promise((res, rej) => { ws.on('open', res); ws.on('error', rej); });
let idc=0; const pend=new Map();
ws.on('message', m=>{const j=JSON.parse(m); if(j.id&&pend.has(j.id)){pend.get(j.id)(j);pend.delete(j.id);}});
const send=(method,params={})=>new Promise(res=>{const id=++idc;pend.set(id,res);ws.send(JSON.stringify({id,method,params}));});
const evaljs=async(e)=>{const r=await send('Runtime.evaluate',{expression:e,returnByValue:true,awaitPromise:true});if(r.result?.exceptionDetails)return{err:r.result.exceptionDetails.exception?.description||'ex'};return r.result?.result?.value;};

// still generating? check for stop button / image state
const state = await evaljs(`JSON.stringify({imgs:[...document.querySelectorAll('img')].map(i=>i.src).filter(s=>/blob:|googleusercontent|ggpht/.test(s)).slice(-5), stop: !!document.querySelector('button[aria-label*="top" i]')})`);
console.log(state);

const src='blob:https://gemini.google.com/ffb88fc1-0d55-4d91-b7d9-2fa6838d8f21';
// approach 1: canvas capture from the live img element
const b64 = await evaljs(`(async()=>{const img=[...document.querySelectorAll('img')].find(i=>i.src===${JSON.stringify(src)});if(!img)return 'no-img';await img.decode?.().catch(()=>{});const c=document.createElement('canvas');c.width=img.naturalWidth||img.width;c.height=img.naturalHeight||img.height;c.getContext('2d').drawImage(img,0,0);return c.toDataURL('image/png')})()`);
if (typeof b64==='string' && b64.startsWith('data:image')) {
  writeFileSync(OUT, Buffer.from(b64.split(',')[1],'base64'));
  console.log('saved canvas', OUT);
} else console.log('canvas fail:', JSON.stringify(b64).slice(0,200));
ws.close(); process.exit(0);
