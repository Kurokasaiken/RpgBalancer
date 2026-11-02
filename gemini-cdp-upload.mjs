// upload+prompt via raw CDP fileChooser interception on the live signed-in Chrome
import fs from 'fs';
const [,,conv,infile,out,prompt] = process.argv;
let msgId=0; const pending=new Map();
const send=(ws,method,params={})=>new Promise((res,rej)=>{const id=++msgId;pending.set(id,{res,rej});ws.send(JSON.stringify({id,method,params}));});
const events=[];
const list = await (await fetch('http://127.0.0.1:9222/json/list')).json();
const target = list.find(t=>t.url.includes('gemini.google.com')) || list[0];
console.log('target:',target.url.slice(0,60));
const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise(r=>ws.onopen=r);
ws.addEventListener('message',e=>{const m=JSON.parse(e.data);
  if(m.id&&pending.has(m.id)){const {res,rej}=pending.get(m.id);pending.delete(m.id);m.error?rej(new Error(m.error.message)):res(m.result);}
  else if(m.method) events.push(m);});
await send(ws,'Page.enable'); await send(ws,'DOM.enable'); await send(ws,'Runtime.enable');
await send(ws,'Page.setInterceptFileChooserDialog',{enabled:true});
await send(ws,'Page.navigate',{url:conv==='new'?'https://gemini.google.com/app':conv});
await new Promise(r=>setTimeout(r,13000));
// open upload menu and click the file option → fileChooserOpened fires
await send(ws,'Runtime.evaluate',{expression:`
  const b=[...document.querySelectorAll('button')].find(x=>(x.getAttribute('aria-label')||'').match(/pload|Caricamento|tools/i)); b&&b.click();`});
await new Promise(r=>setTimeout(r,1800));
await send(ws,'Runtime.evaluate',{expression:`
  const m=[...document.querySelectorAll('[role="menuitem"],button')].find(x=>/file/i.test(x.textContent||'')); m&&m.click();`});
// wait for fileChooserOpened
let fc=null;
for(let i=0;i<40&&!fc;i++){await new Promise(r=>setTimeout(r,500));fc=events.find(e=>e.method==='Page.fileChooserOpened');}
if(!fc){console.log('NO FILECHOOSER-EV',events.map(e=>e.method).slice(-6));process.exit(1);}
const backendNodeId=fc.params?.backendNodeId;
console.log('fileChooserOpened node:',backendNodeId);
await send(ws,'DOM.setFileInputPaths',{files:[infile],backendNodeId});
console.log('UPLOADED');
await new Promise(r=>setTimeout(r,5000));
await send(ws,'Runtime.evaluate',{expression:`
  const box=document.querySelector('div[contenteditable="true"], .ql-editor, textarea');
  box.focus();document.execCommand('insertText',false,${JSON.stringify(prompt)});
  const btn=[...document.querySelectorAll('button')].find(b=>/send|invia/i.test(b.getAttribute('aria-label')||''));
  btn?btn.click():box.dispatchEvent(new KeyboardEvent('keydown',{key:'Enter',bubbles:true}));`});
if(prompt==='NOPROMPT'){console.log('READY',target.url);ws.close();process.exit(0);}
console.log('SUBMITTED');
await new Promise(r=>setTimeout(r,115000));
const {result:ir} = await send(ws,'Runtime.evaluate',{expression:`(()=>{const ims=[...document.querySelectorAll('img')].filter(i=>{const r=i.getBoundingClientRect();return r.width>300&&i.src;});const b=ims[ims.length-1];return b?b.src:null;})()`,returnByValue:true});
console.log('lastimg:',(ir.value||'none').slice(0,110));
if(ir.value){
  // use the page's own download button instead: click download on last image card
  const {result:dl} = await send(ws,'Runtime.evaluate',{expression:`(()=>{const btns=[...document.querySelectorAll('button')].filter(b=>/download|scarica|salva/i.test((b.getAttribute('aria-label')||'')+(b.getAttribute('mattooltip')||'')+(b.title||'')));if(btns.length){btns[btns.length-1].click();return 'ok '+btns.length;}return 'none';})()`,returnByValue:true});
  console.log('download:',dl.value);
}
ws.close();
