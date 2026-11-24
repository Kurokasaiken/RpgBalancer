#!/usr/bin/env node
/**
 * _tmp-goblin-scene-gen-cdp — raw-CDP driver for a BACKGROUND Gemini tab on
 * the Director's Chrome (:9222). No foreground focus (background:true /
 * existing tab, all input via CDP).
 *
 * Chrome's Memory Saver DISCARDS freshly-created background tabs within ~30s.
 * Self-heal: on a dead renderer send Page.reload (browser-level, revives the
 * tab) and restart the flow — after submit the chat lives server-side so a
 * reload loses nothing.
 *
 * Usage:
 *   node scripts/_tmp-goblin-scene-gen-cdp.mjs --prompt <txt> --ref <img> --out <png> [--target <id>] [--wait 240]
 */
import fs from 'fs';

const args = process.argv.slice(2);
const get = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const promptFile = get('--prompt');
const refFile = get('--ref');
const outFile = get('--out');
const maxWait = parseInt(get('--wait', '240'), 10);
const grabOnly = args.includes('--grabonly');
const navUrl = get('--nav');
let targetId = get('--target');
if (!outFile || (!grabOnly && !promptFile)) { console.error('usage: --prompt <txt> --ref <img> --out <png> [--target <id>] [--grabonly] [--nav <url>]'); process.exit(2); }
const promptText = promptFile ? fs.readFileSync(promptFile, 'utf8').trim() : '';

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
  const res = await send('Target.createTarget', { url: 'https://gemini.google.com/app', background: true });
  targetId = res.targetId;
}
console.log('target:', targetId);
const { sessionId } = await send('Target.attachToTarget', { targetId, flatten: true });
await send('Page.enable', {}, sessionId).catch(() => {});
await send('DOM.enable', {}, sessionId).catch(() => {});
/* KEY: hidden tabs get rAF/timers frozen — the Angular app never hydrates and
 * input silently does nothing. Focus emulation makes the page behave as
 * visible (no window raised — safe under CTR-foreground-001). */
await send('Emulation.setFocusEmulationEnabled', { enabled: true }, sessionId).catch(() => {});
/* keep Chrome's Memory Saver from discarding the tab mid-run */
await send('Page.setWebLifecycleState', { state: 'active' }, sessionId).catch(() => {});

const tryEval = (expr, ms = 30000) =>
  send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true }, sessionId, ms)
    .then((r) => {
      if (r.exceptionDetails) throw new Error('js: ' + JSON.stringify(r.exceptionDetails.exception?.description ?? r.exceptionDetails.text).slice(0, 200));
      return r.result.value;
    });

/* Revive a discarded tab; returns true once the editor is back. */
const revive = async () => {
  /* a stalled eval can be a busy renderer (file upload), not a dead one —
   * probe patiently before paying the reload cost */
  for (let i = 0; i < 3; i++) {
    const alive = await tryEval('1', 20000).then(() => true).catch(() => false);
    if (alive) return true;
    await sleep(3000);
  }
  console.log('renderer dead — Page.reload to un-discard');
  await send('Page.reload', {}, sessionId, 10000).catch(() => {});
  await sleep(1500);
  /* focus emulation resets on navigation — re-enable to unfreeze hydration */
  await send('Emulation.setFocusEmulationEnabled', { enabled: true }, sessionId).catch(() => {});
  await send('Page.setWebLifecycleState', { state: 'active' }, sessionId).catch(() => {});
  for (let i = 0; i < 45; i++) {
    const ok = await tryEval(`!!document.querySelector('.ql-editor, [contenteditable="true"])`).catch(() => false);
    if (ok) {
      await send('Emulation.setFocusEmulationEnabled', { enabled: true }, sessionId).catch(() => {});
      return true;
    }
    await sleep(2000);
  }
  return false;
};

const waitEditor = async () => {
  /* distinguish hard-timeout (renderer gone → revive) from nav-race errors
   * (eval throws/undefined while the page loads → just retry; a reload here
   * would restart the load forever) */
  for (let i = 0; i < 90; i++) {
    const r = await tryEval(`document.readyState + '|' + !!document.querySelector('.ql-editor, [contenteditable="true"], textarea')`)
      .then((v) => v)
      .catch((e) => (e.message.includes('TIMEOUT') ? 'dead' : 'nav'));
    if (r === true || String(r).endsWith('|true')) return true;
    if (r === 'dead') await revive();
    await sleep(1500);
  }
  return false;
};

if (navUrl) {
  await send('Page.navigate', { url: navUrl }, sessionId).catch((e) => console.log('nav err', e.message));
  await sleep(3000);
  /* emulation resets on navigation — re-enable after nav too */
  await send('Emulation.setFocusEmulationEnabled', { enabled: true }, sessionId).catch(() => {});
}
if (!(await waitEditor())) { console.error('editor never appeared — chat stays open:', targetId); process.exit(3); }
await send('Emulation.setFocusEmulationEnabled', { enabled: true }, sessionId).catch(() => {});
await send('Page.setWebLifecycleState', { state: 'active' }, sessionId).catch(() => {});
/* hydration settle: .ql-editor exists long before Angular is interactive —
 * driving a non-hydrated composer silently does nothing / wedges the tab */
const settleHydration = async () => {
  for (let i = 0; i < 30; i++) {
    /* __ngContext__ appears on elements only once Angular has hydrated —
     * DOM presence alone is not enough (SSR renders markup early) */
    const hydrated = await tryEval(`!!(document.querySelector('.ql-editor') && (document.querySelector('.ql-editor').__ngContext__ || document.querySelector('input-area-v2, INPUT-AREA-V2')?.__ngContext__))`).catch(() => false);
    if (hydrated) return true;
    await sleep(4000);
    await send('Emulation.setFocusEmulationEnabled', { enabled: true }, sessionId).catch(() => {});
  }
  return false;
};
await settleHydration();
await sleep(3000);
console.log('app ready:', await tryEval('location.href').catch(() => '?'));

const attachRef = async () => {
  /* skip if a file is already staged on the input (e.g. retry after discard) */
  const already = await tryEval(`[...document.querySelectorAll('input[type="file"]')].some(i => i.files && i.files.length)`).catch(() => false);
  if (already) return true;
  for (let attempt = 0; attempt < 4; attempt++) {
    await tryEval(`(() => { const b = [...document.querySelectorAll('button')].find(b => /Caricamento|pload|llega|Attach/i.test(b.getAttribute('aria-label')||'')); b && b.click(); return !!b; })()`);
    await sleep(1200);
    const { root } = await send('DOM.getDocument', { depth: 2 }, sessionId);
    const { nodeIds } = await send('DOM.querySelectorAll', { nodeId: root.nodeId, selector: 'input[type="file"]' }, sessionId);
    if (nodeIds.length) {
      await send('DOM.setFileInputFiles', { nodeId: nodeIds[0], files: [refFile] }, sessionId);
      return true;
    }
    await tryEval(`(() => { const it = [...document.querySelectorAll('[role="menuitem"],button,[role="option"]')].find(e => /file/i.test(e.textContent||'')); it && it.click(); return !!it; })()`).catch(() => false);
    await sleep(800);
  }
  return false;
};

const submitPrompt = async () => {
  /* focus, then Input.insertText (trusted input — execCommand fails in bg tabs) */
  await tryEval(`(() => { const e = document.querySelector('.ql-editor, [contenteditable="true"]'); if (e) { e.focus(); e.click(); } return !!e; })()`);
  await sleep(300);
  await send('Input.insertText', { text: promptText }, sessionId);
  await sleep(500);
  const len = await tryEval(`(document.querySelector('.ql-editor')||{innerText:''}).innerText.trim().length`).catch(() => 0);
  if (!len || len < 40) return 'no-text(' + len + ')';
  return tryEval(`(() => {
    const sendBtn = [...document.querySelectorAll('button')].find(b => {
      const l = b.getAttribute('aria-label') || '';
      return /nvia|end mess|submit/i.test(l) && !b.disabled;
    }) || document.querySelector('button.send-button, .send-button-container button');
    if (!sendBtn) return 'no-sendbtn';
    sendBtn.click();
    return 'submitted';
  })()`);
};

/* Chat URL via /json (targetInfo.url follows SPA navigation even when the
 * renderer is discarded) or eval fallback. */
const targetUrlFromJson = async () => {
  try {
    const list = await (await fetch('http://127.0.0.1:9222/json')).json();
    return (list.find((t) => t.id === targetId) || {}).url || null;
  } catch { return null; }
};
const asChat = (u) => (u && /\/app\/[0-9a-f]{8,}/i.test(u) ? u : null);
const readChatUrl = async (tries = 40) => {
  for (let i = 0; i < tries; i++) {
    const u = asChat(await targetUrlFromJson()) || asChat(await tryEval('location.href').catch(() => null));
    if (u) return u;
    await sleep(500);
  }
  return null;
};

const IMGFIND = `[...document.querySelectorAll('img')].filter(e => e.naturalWidth >= 512 && e.complete && !e.closest('USER-QUERY-FILE-PREVIEW, user-query-file-preview') && !/mavatar|user-icon|sparkle/i.test(e.className||''))`;
const RESPDONE = `(document.querySelector('model-response, MODEL-RESPONSE') && !document.querySelector('loading-indicator, LOADING-INDICATOR, .progress-bar') && (document.querySelector('model-response, MODEL-RESPONSE').innerText||'').length > 80)`;

/* Poll for generated image; survive discards during the long wait.
 * Returns 'img' | 'textonly' | 'timeout'. */
const pollImage = async (chatUrl) => {
  let deadStreak = 0;
  let doneNoImg = 0;
  for (let s = 0; s < maxWait; s += 4) {
    const v = await tryEval(`${IMGFIND}.length > 0`).catch(() => 'dead');
    if (v === 'dead') {
      deadStreak++;
      if (deadStreak >= 2) {
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

/* Outer retry: (re)submit if needed, capture chat URL, poll — a discard that
 * kills the tab before URL navigation aborts the round and restarts. */
let chatUrl = asChat(navUrl) || null;
let outcome = null;
for (let round = 0; round < 4 && !outcome; round++) {
  if (!grabOnly && !chatUrl) {
    /* make sure we sit on a fresh /app composer before submitting */
    const u = asChat(await targetUrlFromJson());
    if (u) { await send('Page.navigate', { url: 'https://gemini.google.com/app' }, sessionId).catch(() => {}); await sleep(4000); }
    const alive = await tryEval(`!!(document.querySelector('.ql-editor') && document.querySelector('.ql-editor').__ngContext__)`).catch(() => false);
    if (!alive) { if (!(await waitEditor())) continue; if (!(await settleHydration())) continue; await sleep(2000); }
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
    if (!chatUrl) {
      /* submission may have been discarded with the tab — revive + retry */
      await revive();
      continue;
    }
  }
  outcome = await pollImage(chatUrl);
  if (outcome === 'img') break;
  console.log('poll:', outcome, `(round ${round})`);
  if (outcome === 'textonly') { console.log('text-only response — chat:', chatUrl); process.exit(6); }
  chatUrl = null; /* timeout → fresh round */
}
if (outcome !== 'img') { console.error('no image — chat stays open:', targetId, chatUrl || ''); process.exit(5); }
await sleep(4000);

/* Grab: prefer direct fetch of the lh3 URL (full res, no CORS issue from
 * node); fall back to Page.captureScreenshot clipped to the element. */
const meta = JSON.parse(await tryEval(`(() => { const els = ${IMGFIND}; const el = els[els.length-1];
  el.scrollIntoView({block:'center'});
  const r = el.getBoundingClientRect();
  return JSON.stringify({ src: el.src||'', nw: el.naturalWidth, nh: el.naturalHeight,
    x: r.x, y: r.y, w: r.width, h: r.height, dpr: devicePixelRatio||1 }); })()`));
fs.mkdirSync(outFile.split('/').slice(0, -1).join('/'), { recursive: true });
let saved = false;
if (/^blob:/.test(meta.src)) {
  /* same-origin blob → drawImage does NOT taint the canvas */
  const dataUrl = await tryEval(`(() => { const el = [...document.querySelectorAll('img')].filter(e => e.naturalWidth >= 512 && e.complete && !e.closest('USER-QUERY-FILE-PREVIEW, user-query-file-preview') && !/mavatar|user-icon|sparkle/i.test(e.className||'')).pop();
    const c = document.createElement('canvas'); c.width = el.naturalWidth; c.height = el.naturalHeight;
    c.getContext('2d').drawImage(el, 0, 0); return c.toDataURL('image/png'); })()`, 30000).catch(() => null);
  if (dataUrl && dataUrl.includes('base64,')) { fs.writeFileSync(outFile, Buffer.from(dataUrl.split('base64,')[1], 'base64')); saved = true; }
} else if (/^https?:/.test(meta.src)) {
  try {
    const resp = await fetch(meta.src);
    if (resp.ok) { fs.writeFileSync(outFile, Buffer.from(await resp.arrayBuffer())); saved = true; }
  } catch {}
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
