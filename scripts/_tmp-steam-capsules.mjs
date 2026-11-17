import sharp from 'sharp';
import { copyFileSync } from 'fs';
const MAP = 'public/assets/world/mappa2/base/layers/base_flat.hi.webp';
const LOGO = 'src/assets/ui/idleVillage/wanderlust-logo.png';
const OUT = 'deliverables/steam-store/capsules';

// crop anchors: [leftFrac, topFrac] sul 5504x3072
const SPECS = [
  ['capsule-header-460x215.png', 460, 215, 0.30, 0.25],
  ['capsule-small-231x71.png',   231,  71, 0.30, 0.35],
  ['capsule-main-616x353.png',   616, 353, 0.30, 0.25],
  ['capsule-vertical-374x448.png',374, 448, 0.45, 0.20],
  ['library-capsule-600x900.png',600, 900, 0.45, 0.10],
  ['library-hero-3840x1240.png',3840,1240, 0.05, 0.35],
  ['library-logo-1280x720.png', 1280, 720, 0.30, 0.30],
];

for (const [name, w, h, fx, fy] of SPECS) {
  // ritaglia regione di mappa all'aspect voluto, poi ridimensiona
  const { width: MW, height: MH } = await sharp(MAP).metadata();
  const targetAR = w / h;
  let cw = MW, ch = Math.round(MW / targetAR);
  if (ch > MH) { ch = MH; cw = Math.round(MH * targetAR); }
  const left = Math.min(Math.round(MW * fx), MW - cw);
  const top = Math.min(Math.round(MH * fy), MH - ch);
  const bg = await sharp(MAP).extract({ left, top, width: cw, height: ch })
    .resize(w, h, { kernel: 'lanczos3' })
    // vignettatura scura leggera sopra/sotto per leggibilità logo
    .composite([{ input: Buffer.from(
      `<svg width="${w}" height="${h}"><defs><radialGradient id="v" cx="50%" cy="45%" r="75%">
      <stop offset="55%" stop-color="#000" stop-opacity="0"/><stop offset="100%" stop-color="#000" stop-opacity="0.45"/></radialGradient></defs>
      <rect width="${w}" height="${h}" fill="url(#v)"/></svg>`), top: 0, left: 0 }])
    .png().toBuffer();
  const logoW = Math.round(w * (h < 100 ? 0.80 : 0.70));
  const logo = await sharp(LOGO).resize(logoW).png().toBuffer();
  await sharp(bg).composite([{ input: logo, gravity: 'center' }]).png().toFile(`${OUT}/${name}`);
  console.log(name);
}

// screenshot: i 6 jpg del dossier Tambù
const SRC = 'deliverables/tambu-prima-pubblicazione/07_Screenshots';
for (const f of ['01-mappa-mondo','02-villaggio','03-spedizione-planner','04-quest-rapporto','05-mappa-notte','06-menu-sessione'])
  copyFileSync(`${SRC}/${f}.jpg`, `deliverables/steam-store/screenshots/${f}.jpg`);
console.log('screenshots x6 copiati');
