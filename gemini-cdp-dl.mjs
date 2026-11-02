import fs from 'fs';
const send=(ws,id,method,params={})=>new Promise((res,rej)=>{
  const h=e=>{const m=JSON.parse(e.data);if(m.id===id){ws.removeEventListener('message',h);m.error?rej(new Error(m.error.message)):res(m.result);}};
  ws.addEventListener('message',h); ws.send(JSON.stringify({id,method,params}));
});
const list = await (await fetch('http://127.0.0.1:9222/json/list')).json();
const target = list.find(t=>t.url.includes('gemini.google.com')) || list[0];
const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise(r=>ws.onopen=r);
await send(ws,1,'Page.enable'); await send(ws,2,'Runtime.enable');
await send(ws,3,'Page.navigate',{url:process.argv[2]});
await new Promise(r=>setTimeout(r,14000));
await send(ws,4,'Browser.setDownloadBehavior',{behavior:'allow',downloadPath:'/Users/faustoboni/Downloads'}).catch(e=>console.log('dl-behavior',e.message));
// click the download button on the LAST generated image card
const {result} = await send(ws,5,'Runtime.evaluate',{expression:`
  (()=>{
    const btns=[...document.querySelectorAll('button')].filter(b=>{
      const a=(b.getAttribute('aria-label')||'')+(b.getAttribute('mattooltip')||'')+(b.getAttribute('data-tooltip')||'')+(b.title||'');
      return /download|scarica|salva/i.test(a);});
    if(btns.length){btns[btns.length-1].click();return 'clicked '+btns.length;}
    // fallback: aria-label on the round icons
    const ico=[...document.querySelectorAll('[aria-label*="ownload"],[aria-label*="carica"]')];
    if(ico.length){ico[ico.length-1].click();return 'ico '+ico.length;}
    return 'none';
  })()`,returnByValue:true});
console.log('click:',result.value);
await new Promise(r=>setTimeout(r,9000));
ws.close();
