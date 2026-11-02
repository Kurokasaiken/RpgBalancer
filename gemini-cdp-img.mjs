// raw CDP: navigate to a gemini conversation, extract the last big img at max res
// usage: node gemini-cdp-img.mjs <convurl> <out>
import fs from 'fs';
const [,,url,out] = process.argv;
const send=(ws,id,method,params={})=>new Promise((res,rej)=>{
  const h=e=>{const m=JSON.parse(e.data);if(m.id===id){ws.removeEventListener('message',h);m.error?rej(new Error(m.error.message)):res(m.result);}};
  ws.addEventListener('message',h); ws.send(JSON.stringify({id,method,params}));
});
const list = await (await fetch('http://127.0.0.1:9222/json/list')).json();
const target = list.find(t=>t.url.includes('gemini.google.com')) || list[0];
const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise(r=>ws.onopen=r);
await send(ws,1,'Page.enable'); await send(ws,2,'Runtime.enable');
await send(ws,3,'Page.navigate',{url});
await new Promise(r=>setTimeout(r,14000));
// scroll to load lazy images, then grab all imgs + candidate URLs in DOM
const {result:r1} = await send(ws,4,'Runtime.evaluate',{expression:`
  (async()=>{
    for(let i=0;i<6;i++){window.scrollTo(0,document.body.scrollHeight);await new Promise(r=>setTimeout(r,800));}
    const ims=[...document.querySelectorAll('img')].map(i=>i.src).filter(s=>s&&s.length>5);
    const ggs=[...document.documentElement.innerHTML.matchAll(/lh3\\.googleusercontent\\.com\\/gg[^"'\\)\\s\\\\]*/g)].map(m=>m[0]);
    return {ims:ims.slice(-15),ggs:ggs.slice(-6)};
  })()`,returnByValue:true,awaitPromise:true});
const info = r1.value;
console.log('imgs:',(info?.ims||[]).map(s=>s.slice(0,90)));
console.log('ggs:',info?.ggs);
let src = (info?.ggs||[]).pop() || (info?.ims||[]).filter(s=>s.includes('googleusercontent')&&!s.includes('default-user')).pop();
if(!src){console.log('NO IMG');ws.close();process.exit(1);}
// try max-res variants of the lh3 URL
if(!src.startsWith('http'))src='https://'+src; const variants=[src,src+'=w4096',src+'=s0'];
const {result:r2} = await send(ws,5,'Runtime.evaluate',{expression:`
  (async()=>{
    for(const u of ${JSON.stringify(variants)}){
      try{const r=await fetch(u);const ct=r.headers.get('content-type')||'';
        if(ct.includes('image')){const ab=await r.arrayBuffer();return {u,ok:true,n:ab.byteLength,b:btoa(String.fromCharCode(...new Uint8Array(ab)))};}
      }catch(e){}
    } return {ok:false};
  })()`,returnByValue:true,awaitPromise:true});
if(r2.value?.ok){fs.writeFileSync(out,Buffer.from(r2.value.b,'base64'));console.log('SAVED',out,r2.value.n);}
else console.log('FETCH FAIL');
ws.close();
