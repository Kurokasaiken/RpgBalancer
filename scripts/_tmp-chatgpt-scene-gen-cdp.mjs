#!/usr/bin/env node
/**
 * _tmp-chatgpt-scene-gen-cdp — raw-CDP driver for a BACKGROUND ChatGPT tab on
 * the Director's Chrome (:9222). No foreground focus (background:true tab,
 * all input via CDP) — CTR-foreground-001 safe.
 *
 * Usage:
 *   node scripts/_tmp-chatgpt-scene-gen-cdp.mjs --prompt <txt> --ref <img> --out <png> [--target <id>] [--wait 300]
 */
import fs from 'fs';

const args = process.argv.slice(2);
const get = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const promptFile = get('--prompt');
const refFile = get('--ref');
const outFile = get('--out');
const maxWait = parseInt(get('--wait', '300'), 10);
let targetId = get('--target');
if (!outFile || !promptFile) { console.error('usage: --prompt <txt> --ref <img> --out <png> [--target <id>] [--wait 300]'); process.exit(2); }
const promptText = fs.readFileSync(promptFile, 'utf8').trim();

const { webSocketDebuggerUrl } = await (await fetch('http://127.0.0.1:9222/json/version')).json();
const ws = new WebSocket(webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
let msgId = 0;
const pending = new Map();
ws.onmessage = (ev) => {
  const m = JSON.parse(ev.data);
  const key = m.sessionId ? `${m.sessionId}:${m.id}` : `:${m.id}`;
  if (pending.has(key)) { pending.get(key)(m); pending.delete(key); }
};
const rawSend = (method, params = {}, sessionId) => new Promise((res, rej) => {
  const id = ++msgId;
  const key = sessionId ? `${sessionId}:${id}` : `:${id}`;
  pending.set(key, (m) => (m.error ? rej(new Error(method + ': ' + JSON.stringify(m.error))) : res(m.result)));
  ws.send(JSON.stringify({ id, method, params, ...(sessionId ? { sessionId } : {}) }));
});
const send = (method, params = {}, sessionId, ms = 30000) =>
  Promise.race([rawSend(method, params, sessionId), new Promise((_, rej) => setTimeout(() => rej(new Error(method + ' TIMEOUT')), ms))]);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

if (!targetId) {
  const res = await send('Target.createTarget', { url: 'https://chatgpt.com/', background: true });
  targetId = res.targetId;
}
console.log('target:', targetId);
const { sessionId } = await send('Target.attachToTarget', { targetId, flatten: true });
await send('Page.enable', {}, sessionId).catch(() => {});
await send('DOM.enable', {}, sessionId).catch(() => {});
await send('Emulation.setFocusEmulationEnabled', { enabled: true }, sessionId).catch(() => {});
await send('Page.setWebLifecycleState', { state: 'active' }, sessionId).catch(() => {});

const tryEval = (expr, ms = 30000) =>
  send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true }, sessionId, ms)
    .then((r) => {
      if (r.exceptionDetails) throw new Error('js: ' + JSON.stringify(r.exceptionDetails.exception?.description ?? r.exceptionDetails.text).slice(0, 200));
      return r.result.value;
    });

const EDITOR = `document.querySelector('#prompt-textarea, [contenteditable="true"]')`;

const revive = async () => {
  for (let i = 0; i < 3; i++) {
    const alive = await tryEval('1', 20000).then(() => true).catch(() => false);
    if (alive) return true;
    await sleep(3000);
  }
  console.log('renderer dead — Page.reload to un-discard');
  await send('Page.reload', {}, sessionId, 10000).catch(() => {});
  await sleep(1500);
  await send('Emulation.setFocusEmulationEnabled', { enabled: true }, sessionId).catch(() => {});
  await send('Page.setWebLifecycleState', { state: 'active' }, sessionId).catch(() => {});
  for (let i = 0; i < 45; i++) {
    const ok = await tryEval(`!!${EDITOR}`).catch(() => false);
    if (ok) return true;
    await sleep(2000);
  }
  return false;
};

const waitEditor = async () => {
  for (let i = 0; i < 90; i++) {
    const r = await tryEval(`document.readyState + '|' + !!${EDITOR}`)
      .then((v) => v)
      .catch((e) => (e.message.includes('TIMEOUT') ? 'dead' : 'nav'));
    if (r === true || String(r).endsWith('|true')) return true;
    if (r === 'dead') await revive();
    await sleep(1500);
  }
  return false;
};

if (!(await waitEditor())) { console.error('editor never appeared — target:', targetId); process.exit(3); }
/* React hydration settle: send button/attach affordances appear once app is interactive */
for (let i = 0; i < 30; i++) {
  const ok = await tryEval(`!!(${EDITOR} && document.querySelector('button[aria-label*="Aggiungi"], button[aria-label*="Add"], input[type="file"]'))`).catch(() => false);
  if (ok) break;
  await send('Emulation.setFocusEmulationEnabled', { enabled: true }, sessionId).catch(() => {});
  await sleep(3000);
}
await sleep(2000);
console.log('app ready:', await tryEval('location.href').catch(() => '?'));

const attachRef = async () => {
  const already = await tryEval(`[...document.querySelectorAll('input[type="file"]')].some(i => i.files && i.files.length)`).catch(() => false);
  if (already) return true;
  const { root } = await send('DOM.getDocument', { depth: 2 }, sessionId);
  const { nodeIds } = await send('DOM.querySelectorAll', { nodeId: root.nodeId, selector: 'input[type="file"][accept*="image"]' }, sessionId);
  for (const nodeId of nodeIds.slice(0, 3)) {
    await send('DOM.setFileInputFiles', { nodeId, files: [refFile] }, sessionId).catch(() => {});
    await sleep(2500);
    /* a staged attachment renders a preview chip/thumbnail near the composer */
    const staged = await tryEval(`!!(document.querySelector('[data-testid*="attachment"], [class*="attachment"] img, #prompt-textarea img, .group\\\\/composer img, form img'))`).catch(() => false);
    if (staged) return true;
  }
  /* fallback: open the attach menu then pick the upload item */
  await tryEval(`(() => { const b = [...document.querySelectorAll('button')].find(b => /Aggiungi file|Add attach|Upload|Allega/i.test(b.getAttribute('aria-label')||'')); b && b.click(); return !!b; })()`).catch(() => false);
  await sleep(1000);
  await tryEval(`(() => { const it = [...document.querySelectorAll('[role="menuitem"],[role="option"],button')].find(e => /computer|upload|carica|file/i.test(e.textContent||'')); it && it.click(); return !!it; })()`).catch(() => false);
  await sleep(1000);
  const d2 = await send('DOM.getDocument', { depth: 2 }, sessionId).catch(() => null);
  if (d2) {
    const q = await send('DOM.querySelectorAll', { nodeId: d2.root.nodeId, selector: 'input[type="file"]' }, sessionId).catch(() => null);
    if (q && q.nodeIds.length) { await send('DOM.setFileInputFiles', { nodeId: q.nodeIds[0], files: [refFile] }, sessionId).catch(() => {}); return true; }
  }
  return false;
};

const submitPrompt = async () => {
  await tryEval(`(() => { const e = ${EDITOR}; if (e) { e.focus(); e.click(); } return !!e; })()`);
  await sleep(300);
  await send('Input.insertText', { text: promptText }, sessionId);
  await sleep(600);
  const len = await tryEval(`(${EDITOR}||{innerText:''}).innerText.trim().length`).catch(() => 0);
  if (!len || len < 40) return 'no-text(' + len + ')';
  /* prefer the send button; fallback trusted Enter */
  const r = await tryEval(`(() => {
    const b = document.querySelector('button[data-testid="send-button"], button[aria-label*="Invia"], button[aria-label*="Send"]');
    if (b && !b.disabled) { b.click(); return 'submitted-btn'; }
    return b ? 'sendbtn-disabled' : 'no-sendbtn';
  })()`);
  if (String(r).startsWith('submitted')) return r;
  await send('Input.dispatchKeyEvent', { type: 'rawKeyDown', windowsVirtualKeyCode: 13, key: 'Enter', code: 'Enter' }, sessionId).catch(() => {});
  await send('Input.dispatchKeyEvent', { type: 'keyUp', windowsVirtualKeyCode: 13, key: 'Enter', code: 'Enter' }, sessionId).catch(() => {});
  await sleep(800);
  const cleared = await tryEval(`((${EDITOR}||{innerText:''}).innerText||'').trim().length < 40`).catch(() => false);
  return cleared ? 'submitted-enter' : 'enter-failed(' + r + ')';
};

const targetUrlFromJson = async () => {
  try {
    const list = await (await fetch('http://127.0.0.1:9222/json')).json();
    return (list.find((t) => t.id === targetId) || {}).url || null;
  } catch { return null; }
};
const asChat = (u) => (u && /chatgpt\.com\/c\/[0-9a-f-]{8,}/i.test(u) ? u : null);
const readChatUrl = async (tries = 40) => {
  for (let i = 0; i < tries; i++) {
    const u = asChat(await targetUrlFromJson()) || asChat(await tryEval('location.href').catch(() => null));
    if (u) return u;
    await sleep(500);
  }
  return null;
};

/* generated image: large <img> inside an assistant article/turn, excluding avatars/attachments */
const IMGFIND = `[...document.querySelectorAll('article img, [data-testid^="conversation-turn"] img, .markdown img, main img')].filter(e => e.naturalWidth >= 512 && e.complete && !/avatar|icon|logo|profile/i.test((e.className||'') + ' ' + (e.alt||'') + ' ' + (e.src||'')) && !e.closest('form'))`;
const RESPDONE = `(() => { const arts = document.querySelectorAll('article, [data-testid^="conversation-turn"]'); const stop = document.querySelector('button[aria-label*="Stop"], button[data-testid*="stop"]'); const last = arts[arts.length-1]; return last && !stop && (last.innerText||'').length > 80; })()`;

const pollImage = async (chatUrl) => {
  let deadStreak = 0, doneNoImg = 0;
  for (let s = 0; s < maxWait; s += 4) {
    const v = await tryEval(`${IMGFIND}.length > 0`).catch(() => 'dead');
    if (v === 'dead') {
      if (++deadStreak >= 2) {
        await revive(); deadStreak = 0;
        const u = await tryEval('location.href').catch(() => null);
        if (chatUrl && u && !asChat(u)) {
          console.log('navigating back to', chatUrl);
          await send('Page.navigate', { url: chatUrl }, sessionId).catch(() => {});
          await sleep(5000);
        }
      }
    } else {
      deadStreak = 0;
      if (v) return 'img';
      const done = await tryEval(RESPDONE).catch(() => false);
      doneNoImg = done ? doneNoImg + 1 : 0;
      if (doneNoImg >= 15) return 'textonly';
    }
    await sleep(4000);
  }
  return 'timeout';
};

let chatUrl = null;
let outcome = null;
for (let round = 0; round < 4 && !outcome; round++) {
  if (!chatUrl) {
    const u = asChat(await targetUrlFromJson());
    if (u) { await send('Page.navigate', { url: 'https://chatgpt.com/' }, sessionId).catch(() => {}); await sleep(4000); }
    const alive = await tryEval(`!!${EDITOR}`).catch(() => false);
    if (!alive) { if (!(await waitEditor())) continue; await sleep(2000); }
    try {
      if (refFile) {
        const attached = await attachRef();
        console.log('ref attached:', attached, `(round ${round})`);
        await sleep(2000);
      }
      const res = await submitPrompt();
      console.log('submit:', res);
      if (!String(res).includes('submit')) { await sleep(1500); continue; }
    } catch (e) {
      console.log('flow err:', e.message.slice(0, 80), '— healing');
      await revive();
      continue;
    }
    chatUrl = await readChatUrl();
    console.log('chat-url:', chatUrl);
    if (!chatUrl) { await revive(); continue; }
  }
  outcome = await pollImage(chatUrl);
  if (outcome === 'img') break;
  console.log('poll:', outcome, `(round ${round})`);
  if (outcome === 'textonly') {
    const txt = await tryEval(`(() => { const a=[...document.querySelectorAll('article, [data-testid^="conversation-turn"]')]; return (a[a.length-1]?.innerText||'').slice(0,400); })()`).catch(() => '?');
    console.log('text-only response — chat:', chatUrl, '\nresponse:', txt);
    process.exit(6);
  }
  chatUrl = null;
}
if (outcome !== 'img') { console.error('no image — chat stays open:', targetId, chatUrl || ''); process.exit(5); }
await sleep(4000);

const meta = JSON.parse(await tryEval(`(() => { const els = ${IMGFIND}; const el = els[els.length-1];
  el.scrollIntoView({block:'center'});
  const r = el.getBoundingClientRect();
  return JSON.stringify({ src: el.src||'', nw: el.naturalWidth, nh: el.naturalHeight,
    x: r.x, y: r.y, w: r.width, h: r.height, dpr: devicePixelRatio||1 }); })()`));
fs.mkdirSync(outFile.split('/').slice(0, -1).join('/'), { recursive: true });
let saved = false;
if (/^https?:/.test(meta.src)) {
  try {
    const resp = await fetch(meta.src);
    if (resp.ok) { fs.writeFileSync(outFile, Buffer.from(await resp.arrayBuffer())); saved = true; }
  } catch {}
}
if (!saved && /^blob:|^https?:/.test(meta.src)) {
  const dataUrl = await tryEval(`(async () => { const el = ${IMGFIND}.pop();
    try { const b = await (await fetch(el.src)).blob();
      return await new Promise(res => { const fr = new FileReader(); fr.onload = () => res(fr.result); fr.readAsDataURL(b); }); }
    catch(e) { return 'fetcherr:'+e.message; } })()`, 60000).catch(() => null);
  if (dataUrl && dataUrl.includes('base64,')) { fs.writeFileSync(outFile, Buffer.from(dataUrl.split('base64,')[1], 'base64')); saved = true; }
}
if (!saved) {
  await sleep(800);
  const shot = await send('Page.captureScreenshot', { format: 'png',
    clip: { x: meta.x, y: meta.y, width: meta.w, height: meta.h, scale: Math.min(2, meta.nw / Math.max(1, meta.w)) } }, sessionId, 30000);
  fs.writeFileSync(outFile, Buffer.from(shot.data, 'base64'));
}
console.log('saved', outFile, `${meta.nw}x${meta.nh}`, meta.src.slice(0, 120), saved ? '(fetch)' : '(screenshot)');
console.log('chat-target:', targetId);
process.exit(0);
