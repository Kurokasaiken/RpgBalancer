/**
 * check-page.mts — pre-publish checks for the Steam page package (`upload/`).
 *
 * Machine-checkable rules only: Steamworks sizes/limits, the claim ledger's
 * banned words, no links in About, BBCode balance, GIF weight. What a script
 * cannot judge (is it real gameplay? does a stranger understand it?) stays in
 * PUBLISH-CHECKLIST.md.
 *
 * Usage: npx tsx marketing/steam/tools/check-page.mts   (exit 1 on any FAIL)
 */
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const U = path.join(ROOT, 'upload');
type Row = { ok: boolean; what: string; note?: string };
const rows: Row[] = [];
const check = (ok: boolean, what: string, note = '') => rows.push({ ok, what, note });

const pngSize = (f: string) => {
  const b = readFileSync(f);
  return { w: b.readUInt32BE(16), h: b.readUInt32BE(20) };
};
const gifSize = (f: string) => {
  const b = readFileSync(f);
  return { w: b.readUInt16LE(6), h: b.readUInt16LE(8) };
};

/* ---- store assets: exact sizes (Steamworks, Aug-2024 sizes) ---- */
const SLOTS: [string, number, number][] = [
  ['capsules/header_capsule_920x430.png', 920, 430],
  ['capsules/small_capsule_462x174.png', 462, 174],
  ['capsules/main_capsule_1232x706.png', 1232, 706],
  ['capsules/vertical_capsule_748x896.png', 748, 896],
  ['library/library_capsule_600x900.png', 600, 900],
  ['library/library_hero_3840x1240.png', 3840, 1240],
  ['library/page_background_1438x810.png', 1438, 810],
  ['icons/community_icon_184x184.png', 184, 184],
  ['icons/client_icon_32x32.png', 32, 32],
];
for (const [rel, w, h] of SLOTS) {
  const f = path.join(U, rel);
  if (!existsSync(f)) { check(false, rel, 'missing'); continue; }
  const s = pngSize(f);
  check(s.w === w && s.h === h, rel, `${s.w}×${s.h}`);
}
{
  const f = path.join(U, 'library/library_logo_1050x720.png');
  const s = existsSync(f) ? pngSize(f) : { w: 0, h: 0 };
  check(s.w > 0 && s.w <= 1280 && s.h <= 720 && (s.w === 1280 || s.h === 720), 'library logo fits 1280×720 (one side exact)', `${s.w}×${s.h}`);
}

/* ---- screenshots ---- */
const shots = readdirSync(path.join(U, 'screenshots')).filter((f) => f.endsWith('.png')).sort();
check(shots.length >= 5, 'screenshots ≥ 5', `${shots.length}`);
for (const s of shots) {
  const d = pngSize(path.join(U, 'screenshots', s));
  check(d.w >= 1920 && d.h >= 1080 && Math.abs(d.w / d.h - 16 / 9) < 0.01, `screenshot ${s} ≥1920×1080, 16:9`, `${d.w}×${d.h}`);
}

/* ---- About GIFs: <5 MB each, <15 MB total ---- */
const gifs = readdirSync(path.join(U, 'about-gifs')).filter((f) => f.endsWith('.gif'));
let gifTotal = 0;
for (const g of gifs) {
  const f = path.join(U, 'about-gifs', g);
  const bytes = statSync(f).size;
  gifTotal += bytes;
  const d = gifSize(f);
  check(bytes < 5 * 1024 * 1024, `GIF ${g} < 5 MB`, `${(bytes / 1048576).toFixed(1)} MB, ${d.w}×${d.h}`);
  check(d.w <= 616, `GIF ${g} width ≤ 616`, `${d.w}`);
}
check(gifTotal < 15 * 1024 * 1024, 'GIFs total < 15 MB', `${(gifTotal / 1048576).toFixed(1)} MB`);

/* ---- copy ---- */
const BANNED = ['hand-painted', 'hand-drawn', 'handcrafted', 'procedural', 'idle', 'incremental', 'offline progress', 'caravan', 'wolves', 'epic battles', 'army', 'hundreds of hours'];
for (const lang of ['en', 'it']) {
  const dir = path.join(U, 'copy', lang);
  const short = readFileSync(path.join(dir, 'short-description.txt'), 'utf8').trim();
  check(short.length <= 300 && short.length > 0, `[${lang}] short description ≤ 300 chars`, `${short.length}`);
  check(!/\[.*\]|\n/.test(short), `[${lang}] short description is plain text (no BBCode/line breaks)`);
  const about = readFileSync(path.join(dir, 'about.bbcode'), 'utf8');
  const text = about.replace(/\[[^\]]*\]/g, ' ');
  const words = text.split(/\s+/).filter(Boolean).length;
  check(words <= 600, `[${lang}] About ≤ 600 words (fits above "Read More")`, `${words}`);
  check(!/https?:|www\.|discord|\[url|@\w+\.\w+/i.test(about), `[${lang}] About has no links/URLs/handles`);
  const bad = BANNED.filter((w) => new RegExp(`\\b${w}\\b`, 'i').test(about + ' ' + short));
  check(bad.length === 0, `[${lang}] no claim-ledger banned words`, bad.join(', '));
  check((about.match(/\[h2\]/g) ?? []).length === (about.match(/\[\/h2\]/g) ?? []).length, `[${lang}] [h2] balanced`);
  check((about.match(/\[list\]/g) ?? []).length === (about.match(/\[\/list\]/g) ?? []).length, `[${lang}] [list] balanced`);
  const imgs = [...about.matchAll(/\[img\]\{STEAM_CLAN_IMAGE\}\/([^\[]+)\[\/img\]/g)].map((m) => m[1]);
  check(imgs.every((i) => gifs.includes(i)), `[${lang}] every [img] has a GIF in upload/about-gifs`, imgs.join(', '));
  check(imgs.length >= 3 && imgs.length <= 5, `[${lang}] 3–5 GIFs in About`, `${imgs.length}`);
  check(/roguelite|strategy rpg|rpg/i.test(short.split(/\s+/).slice(0, 10).join(' ')), `[${lang}] genre keyword in first 10 words of short description`);
}
const en = readFileSync(path.join(U, 'copy/en/short-description.txt'), 'utf8').trim();
const enAbout = readFileSync(path.join(U, 'copy/en/about.bbcode'), 'utf8');
check(!enAbout.includes(en.slice(0, 60)), 'EN About does not repeat the short description');
for (const lang of ['en', 'it']) {
  const f = path.join(U, 'copy', lang, 'system-requirements.txt');
  const sr = existsSync(f) ? readFileSync(f, 'utf8') : '';
  check(/(OS|Sistema operativo):/.test(sr) && /(Memory|Memoria):/.test(sr) && /(Graphics|Scheda video):/.test(sr), `[${lang}] system requirements (OS/RAM/GPU) present`);
}
const tags = readFileSync(path.join(U, 'copy/tags.txt'), 'utf8').split('\n').filter(Boolean);
check(tags.length >= 5 && tags.length <= 20, 'tags 5–20', `${tags.length}`);

/* ---- report ---- */
let fails = 0;
for (const r of rows) {
  if (!r.ok) fails++;
  console.log(`${r.ok ? 'PASS' : 'FAIL'}  ${r.what}${r.note ? `  (${r.note})` : ''}`);
}
console.log(`\n${rows.length - fails}/${rows.length} passed`);
process.exit(fails ? 1 : 0);
