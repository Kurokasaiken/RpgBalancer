import WebSocket from 'ws';
import { readFileSync, writeFileSync } from 'fs';
import http from 'http';

const PROMPT = readFileSync('/Users/faustoboni/progetti_personali/RPG/.mw/runs/20261110-chatgpt-ghiera/prompt8-gemini-fix.txt','utf8');
const IMG = '/Users/faustoboni/progetti_personali/RPG/public/assets/ui/hud-real/ghiera-draghi.png';
const OUT = '/Users/faustoboni/progetti_personali/RPG/.mw/runs/20261110-chatgpt-ghiera/gen/gemini-ghiera-fix.png';
const POLL_MS = 180000;

const listJson = () => new Promise((res, rej) => {
  http.get('http://localhost:9222/json/list', r => { let d=''; r.on('data',c=>d+=c); r.on('end',()=>res(JSON.parse(d))); }).on('error', rej);
});

const targets = await listJson();
const page = targets.find(t => t.type==='page' && /gemini\.google\.com\/app$/.test(t.url))
          || targets.find(t => t.type==='page' && t.url.includes('gemini.google.com'));
if (!page) { console.error('no gemini tab'); process.exit(1); }
console.log('target:', page.url);

const ws = new WebSocket(page.webSocketDebuggerUrl, { maxPayload: 512*1024*1024 });
await new Promise((res, rej) => { ws.on('open', res); ws.on('error', rej); });
let idc = 0; const pend = new Map();
ws.on('message', m => { const j = JSON.parse(m); if (j.id && pend.has(j.id)) { pend.get(j.id)(j); pend.delete(j.id); } });
const send = (method, params={}) => new Promise((res) => { const id=++idc; pend.set(id, res); ws.send(JSON.stringify({id, method, params})); });
const evaljs = async (expr) => {
  const r = await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true });
  if (r.result?.exceptionDetails) return { err: r.result.exceptionDetails.exception?.description || 'ex' };
  return r.result?.result?.value;
};

await send('Runtime.enable'); await send('DOM.enable'); await send('Page.enable');

// wait composer
let ok=false;
for (let i=0;i<20;i++){ if (await evaljs(`!!document.querySelector('div[contenteditable="true"]')`)) { ok=true; break; } await new Promise(r=>setTimeout(r,1000)); }
console.log('composer:', ok);

// baseline images
const baseline = await evaljs(`JSON.stringify([...document.querySelectorAll('img')].map(i=>i.src).filter(s=>/blob:|googleusercontent|ggpht/.test(s)))`) || '[]';
const baseSet = new Set(JSON.parse(baseline));
console.log('baseline imgs:', baseSet.size);

// insert prompt
await evaljs(`(()=>{const c=document.querySelector('div[contenteditable="true"]');c.focus();document.execCommand('insertText',false,${JSON.stringify(PROMPT)});return true})()`);
await new Promise(r=>setTimeout(r,1000));

// attach file: find input[type=file], else click "+" first
const doc = await send('DOM.getDocument',{depth:2});
const rootId = doc.result.root.nodeId;
let q = await send('DOM.querySelectorAll',{nodeId:rootId, selector:'input[type="file"]'});
let inputs = q.result.nodeIds||[];
if (!inputs.length) {
  await evaljs(`(()=>{const btns=[...document.querySelectorAll('button')].filter(b=>/allega|upload|file|immagine|\\+/i.test(b.getAttribute('aria-label')||b.textContent||''));if(btns[0]){btns[0].click();return 'clicked '+(btns[0].getAttribute('aria-label')||btns[0].textContent)}return 'none'})()`).then(r=>console.log('plus click:',r));
  await new Promise(r=>setTimeout(r,1500));
  q = await send('DOM.querySelectorAll',{nodeId:rootId, selector:'input[type="file"]'});
  inputs = q.result.nodeIds||[];
}
console.log('file inputs:', inputs.length);
if (inputs.length) {
  const r = await send('DOM.setFileInputFiles',{files:[IMG], nodeId:inputs[0]});
  console.log('set files:', JSON.stringify(r.result||r.error||{}));
}
await new Promise(r=>setTimeout(r,4000));

// click send
const sent = await evaljs(`(()=>{const sels=['button[aria-label*="nvia"]','button[aria-label*="end message" i]','[data-test-id*="send"]','button.send-button'];for(const s of sels){const b=document.querySelector(s);if(b&&!b.disabled){b.click();return s}}const bs=[...document.querySelectorAll('button')].filter(b=>/invia|send/i.test(b.getAttribute('aria-label')||''));if(bs[0]){bs[0].click();return 'fallback'}return null})()`);
console.log('send clicked:', sent);

// poll for new generated image
let src=null;
const t0=Date.now();
while (Date.now()-t0 < POLL_MS) {
  const cur = await evaljs(`JSON.stringify([...document.querySelectorAll('img')].map(i=>i.src).filter(s=>/blob:|googleusercontent|ggpht/.test(s)))`);
  if (cur) { for (const s of JSON.parse(cur)) if (!baseSet.has(s)) { src=s; break; } }
  if (src) break;
  await new Promise(r=>setTimeout(r,6000));
}
console.log('new img:', src ? src.slice(0,90) : 'NONE');

if (src) {
  await new Promise(r=>setTimeout(r,3000)); // let it finish rendering
  const b64 = await evaljs(`(async()=>{const r=await fetch(${JSON.stringify(src)});const b=await r.arrayBuffer();let s='';const u=new Uint8Array(b);for(let i=0;i<u.length;i+=8192)s+=String.fromCharCode.apply(null,u.subarray(i,i+8192));return btoa(s)})()`);
  if (b64 && !b64.err) { writeFileSync(OUT, Buffer.from(b64,'base64')); console.log('saved', OUT); }
  else console.log('fetch failed', b64);
}
ws.close(); process.exit(0);
