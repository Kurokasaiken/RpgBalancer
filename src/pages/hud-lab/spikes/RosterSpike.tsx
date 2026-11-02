/**
 * T-102a spike v7 — full roster column per zanara-v2 ORIGINAL (not the cut):
 * lateral ornamental pillar (green enamel + gold vines + gems), winged compass
 * emblem on top, 4 generated rows (thick engraved ring + green enamel insert
 * + ornate plaque + gems), gem pendant at bottom. Mount zones measured by
 * script on the generated sheet — no eyeballed positions.
 */

const ROW_SRC = '/mockups/hud-lab/attach/sheet-row-0.png';
const PILLAR_SRC = '/mockups/hud-lab/attach/pillar-band-tile.png';
const EMBLEM_SRC = '/mockups/hud-lab/attach/emblem-alato.png';
const GEM_SRC = '/mockups/hud-lab/attach/gem-cut.png';
const IVORY = '#ece4cf';

const heroes = [
  { name: 'Kael', lv: 12, hp: 92, img: '/assets/portraits/portrait male warrior.png' },
  { name: 'Seraphine', lv: 11, hp: 78, img: '/assets/portraits/portrait female magician.png' },
  { name: 'Bran', lv: 10, hp: 100, img: '/assets/portraits/portrait male warrior.png' },
  { name: 'Lyra', lv: 9, hp: 64, img: '/assets/portraits/portrait female magician.png' },
  { name: 'Torm', lv: 8, hp: 55, img: '/assets/portraits/portrait male warrior.png' },
  { name: 'Wen', lv: 7, hp: 41, img: '/assets/portraits/portrait female magician.png' },
];

function Row({ name, lv, hp, img }: { name: string; lv: number; hp: number; img: string }) {
  return (
    <div style={{ position: 'relative', width: 226 }}>
      <img src={ROW_SRC} alt="" draggable={false} style={{ width: '100%', display: 'block' }} />
      {/* portrait fitted to measured ring hole: cx≈34.4%, cy≈51%, d≈28.5% of row */}
      <div style={{
        position: 'absolute', left: '20%', top: '50%', transform: 'translateY(-50%)',
        width: '28.5%', aspectRatio: '1', borderRadius: '50%', overflow: 'hidden',
        boxShadow: 'inset 0 4px 9px rgba(0,0,0,0.7)',
      }}>
        <img src={img} alt={name} draggable={false} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at 50% 16%, rgba(255,255,255,0.14), transparent 55%)' }} />
      </div>
      {/* name + lv + hp inside measured plaque interior (x≈52-92%, y≈26-82%) */}
      <div style={{ position: 'absolute', left: '52%', top: '30%', right: '8%' }}>
        <div style={{ fontFamily: '"EB Garamond", serif', fontSize: 15, color: IVORY, lineHeight: 1.1, textShadow: '0 1px 2px rgba(0,0,0,0.6)' }}>{name}</div>
        <div style={{ fontFamily: '"EB Garamond", serif', fontSize: 10, color: '#a8cdbb', lineHeight: 1.4 }}>Lv. {lv}</div>
        <div style={{ marginTop: 4, width: '82%', height: 5, borderRadius: 2.5, background: 'rgba(0,0,0,0.45)', border: '1px solid rgba(212,175,55,0.45)', overflow: 'hidden' }}>
          <div style={{ width: `${hp}%`, height: '100%', background: 'linear-gradient(90deg, #0d4a3c, #2aa87e, #5ee6a8)' }} />
        </div>
      </div>
    </div>
  );
}

export function RosterSpike() {
  return (
    <div style={{ position: 'relative', width: 262 }}>
      {/* unified dark enamel backing — subtle, lets the map breathe but binds the column */}
      <div style={{
        position: 'absolute', inset: '8px 0 30px 0', zIndex: 0,
        background: 'linear-gradient(90deg, rgba(2,26,21,0.85), rgba(4,42,34,0.62) 70%, transparent)',
      }} />
      {/* pillar: vertically TILING strip — full column height, vines sit OVER the ring edges */}
      <div style={{
        position: 'absolute', left: 0, top: 14, bottom: 34, width: 56, zIndex: 3,
        backgroundImage: `url(${PILLAR_SRC})`, backgroundRepeat: 'repeat-y', backgroundSize: '56px auto',
      }} />
      {/* winged compass emblem — column cap */}
      <img src={EMBLEM_SRC} alt="" draggable={false}
        style={{ position: 'relative', left: -14, width: 150, height: 'auto', display: 'block', marginBottom: -18, zIndex: 4 }} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 0, paddingLeft: 30 }}>
        <button type="button" title="espandi roster" style={{
          alignSelf: 'flex-end', width: 20, height: 20, borderRadius: '50%', border: '1.2px solid #d4af37',
          background: 'conic-gradient(from 200deg, #8a6a1e, #d4af37, #f4d98b, #d4af37, #8a6a1e)',
          boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.35), 0 1px 3px rgba(0,0,0,0.5)',
          color: '#2e2106', fontSize: 10, fontWeight: 700, lineHeight: 1, cursor: 'pointer', marginBottom: 2, zIndex: 4,
        }}>»</button>
        {/* scrollable roster list — one repeated row asset per hero; rows tuck under the pillar vines */}
        <div style={{ maxHeight: 330, overflowY: 'auto', scrollbarWidth: 'thin', zIndex: 1, position: 'relative' }}>
          {heroes.map((h) => <Row key={h.name} {...h} />)}
        </div>
      </div>
      {/* gem pendant — column bottom cap */}
      <img src={GEM_SRC} alt="" draggable={false}
        style={{ position: 'relative', left: 4, width: 30, height: 'auto', display: 'block', marginTop: -2, zIndex: 4 }} />
    </div>
  );
}
