// raw CDP drive of the live mw Chrome: upload via DOM.setFileInputPaths, prompt, collect last img
// usage: node gemini-cdp-gen.mjs <infile> <outpng> <prompt>
import fs from 'fs';
const [,,infile,out,prompt] = process.argv;
const send=(ws,id,method,params={})=>new Promise((res,rej)=>{
  const h=e=>{const m=JSON.parse(e.data);if(m.id===id){ws.removeEventListener('message',h);m.error?rej(new Error(m.error.message)):res(m.result);}};
  ws.addEventListener('message',h); ws.send(JSON.stringify({id,method,params}));
});
const list = await (await fetch('http://127.0.0.1:9222/json/list')).json();
const target = list.find(t=>t.url.includes('gemini.google.com')) || list[0];
console.log('target:',target.url.slice(0,60));
const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise(r=>ws.onopen=r);
await send(ws,1,'Page.enable'); await send(ws,2,'DOM.enable'); await send(ws,3,'Runtime.enable');
await send(ws,4,'Page.navigate',{url:'https://gemini.google.com/app'});
await new Promise(r=>setTimeout(r,12000));
const {root} = await send(ws,5,'DOM.getDocument',{depth:-1});
const {nodeId} = await send(ws,6,'DOM.querySelector',{nodeId:root.nodeId,selector:'input[type="file"]'}).catch(()=>({nodeId:0}));
console.log('fileinput node:',nodeId);
if(nodeId){ await send(ws,7,'DOM.setFileInputPaths',{nodeId,files:[infile]}); console.log('UPLOADED'); }
else{ // fallback: open upload menu then set on the input it creates
  await send(ws,8,'Runtime.evaluate',{expression:`[...document.querySelectorAll('button')].find(b=>(b.getAttribute('aria-label')||'').match(/pload|Caricamento|tools/i))?.click()`});
  await new Promise(r=>setTimeout(r,2000));
  const {nodeId:n2} = await send(ws,9,'DOM.querySelector',{nodeId:root.nodeId,selector:'input[type="file"]'}).catch(()=>({nodeId:0}));
  console.log('fileinput2:',n2);
  if(!n2){console.log('NO INPUT');process.exit(1);}
  await send(ws,10,'DOM.setFileInputPaths',{nodeId:n2,files:[infile]}); console.log('UPLOADED2');
}
await new Promise(r=>setTimeout(r,5000));
const pj = JSON.stringify(prompt);
await send(ws,11,'Runtime.evaluate',{expression:`
  const box = document.querySelector('div[contenteditable="true"], .ql-editor, textarea');
  box.focus(); box.innerHTML=''; document.execCommand('insertText',false,${pj});
  box.dispatchEvent(new Event('input',{bubbles:true}));
  const btn=[...document.querySelectorAll('button')].find(b=>/send|invia/i.test(b.getAttribute('aria-label')||''));
  btn ? btn.click() : box.dispatchEvent(new KeyboardEvent('keydown',{key:'Enter',code:'Enter',bubbles:true}));
`});
console.log('SUBMITTED');
await new Promise(r=>setTimeout(r,110000));
const {result:ir} = await send(ws,12,'Runtime.evaluate',{expression:`
  (()=>{const ims=[...document.querySelectorAll('img')].filter(i=>{const r=i.getBoundingClientRect();return r.width>300&&i.src;});
  const b=ims[ims.length-1]; return b?b.src.slice(0,200):null;})()`,returnByValue:true});
console.log('lastimg:',(ir.value||'none').slice(0,110));
if(ir.value){
  const {result:br} = await send(ws,13,'Runtime.evaluate',{expression:`
    (async()=>{const r=await fetch(${JSON.stringify('')}+arguments[0]);const ab=await r.arrayBuffer();return btoa(String.fromCharCode(...new Uint8Array(ab.slice(0,30000000))));})()`,
    arguments:[{value:ir.value}],returnByValue:true,awaitPromise:true});
  if(br.value){fs.writeFileSync(out,Buffer.from(br.value,'base64'));console.log('SAVED',out,fs.statSync(out).size);}
}
ws.close();
