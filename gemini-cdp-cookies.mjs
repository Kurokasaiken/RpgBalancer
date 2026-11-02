// extract live cookies from mw Chrome on 9222 via raw CDP websocket (Node built-in WebSocket)
const list = await (await fetch('http://127.0.0.1:9222/json/list')).json();
const gem = list.find(t=>t.url.includes('gemini.google.com')) || list.find(t=>t.url.includes('google'));
console.log('targets:',list.length,'picked:',gem?.url?.slice(0,70));
if(gem){
  const ws = new WebSocket(gem.webSocketDebuggerUrl);
  await new Promise(r=>ws.onopen=r);
  ws.send(JSON.stringify({id:1,method:'Network.getCookies',params:{urls:['https://gemini.google.com','https://accounts.google.com','https://www.google.com']}}));
  const msg = JSON.parse(await new Promise(r=>{ws.onmessage=e=>{const m=JSON.parse(e.data);if(m.id===1)r(e.data);}}));
  const ck = msg.result.cookies;
  console.log('cookies:',ck.length);
  const fs=await import('fs');
  fs.writeFileSync('test-results/mappa2-upscale/atlas/live-cookies.json',JSON.stringify(ck));
  ws.close();
}
