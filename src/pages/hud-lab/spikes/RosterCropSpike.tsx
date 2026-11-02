/**
 * Roster column test — frame pixels cut DIRECTLY from zanara-v2
 * (scripts/hud-roster-crop.py), content rendered live. Geometry in source px
 * (1672x941) from public/mockups/hud-lab/roster-crop/mount.json; the caller
 * scales the whole column with a CSS transform.
 */

const BASE = '/mockups/hud-lab/roster-crop/';
const PITCH = 94;
const ROW_W = 256;
const TOP_H = 227;
const TOP_W = 232;
const BOT_H = 65;
const HOLE = { cx: 86.8, cy: 47.1, r: 35 };
const NAME_COLOR = '#ddd9c6';
const LV_COLOR = '#b4ccbf';
const BAR = { x: 137, y: 69, w: 79, h: 7 };

export type RosterHero = { id: string; name: string; lv: number; xp: number; portrait: string };

/** One hero row: live portrait under the cut ring, live name/level/xp on the cleaned plaque. */
function RosterRow({ hero, portraitSize, onSelect }: {
  hero: RosterHero; portraitSize: number; onSelect?: (id: string) => void;
}) {
  return (
    <button
      type="button"
      aria-label={`${hero.name}, Lv. ${hero.lv}`}
      onClick={() => onSelect?.(hero.id)}
      style={{ position: 'relative', display: 'block', width: ROW_W, height: PITCH, padding: 0, border: 0, background: 'none', cursor: 'pointer' }}
    >
      <div style={{
        position: 'absolute', left: HOLE.cx - portraitSize / 2, top: HOLE.cy - portraitSize / 2,
        width: portraitSize, height: portraitSize, borderRadius: '50%', overflow: 'hidden', background: '#0b1d1a',
      }}>
        <img src={hero.portrait} alt="" draggable={false} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
        <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', boxShadow: 'inset 0 0 4px 1px rgba(0,0,0,0.45)' }} />
      </div>
      <img src={`${BASE}row-tile.png`} alt="" draggable={false} style={{ position: 'absolute', left: 0, top: 0, width: ROW_W, height: PITCH }} />
      <div style={{
        position: 'absolute', left: 143, top: 28.5, textAlign: 'left', whiteSpace: 'nowrap',
        fontFamily: '"EB Garamond", serif', fontSize: 15.5, lineHeight: '18px', color: NAME_COLOR,
      }}>{hero.name}</div>
      <div style={{
        position: 'absolute', left: 143.5, top: 50, textAlign: 'left',
        fontFamily: '"EB Garamond", serif', fontSize: 12, lineHeight: '13px', color: LV_COLOR,
      }}>Lv. {hero.lv}</div>
      <div style={{
        position: 'absolute', left: BAR.x, top: BAR.y, width: BAR.w, height: BAR.h, boxSizing: 'border-box',
        border: '1px solid #3a2f17', background: 'linear-gradient(180deg, #b39649, #ceb866 45%, #7a5b26)',
      }}>
        <div style={{ width: `${hero.xp}%`, height: '100%', background: 'linear-gradient(180deg, #1dc0a0, #03c5b1 45%, #2d8b61)' }} />
      </div>
    </button>
  );
}

/**
 * Full roster column: emblem cap, one cut row per hero (scrolls past
 * `visibleRows`), band tail + pendant.
 */
export function RosterCropColumn({ heroes, visibleRows = 4, portraitSize = 76, onSelect }: {
  heroes: RosterHero[]; visibleRows?: number; portraitSize?: number; onSelect?: (id: string) => void;
}) {
  const rows = Math.min(heroes.length, visibleRows);
  return (
    <div style={{ position: 'relative', width: 260 }}>
      <img src={`${BASE}top-cap.png`} alt="" draggable={false} style={{ display: 'block', width: TOP_W, height: TOP_H }} />
      <div style={{ height: rows * PITCH, overflowY: 'auto', overflowX: 'hidden', scrollbarWidth: 'none', width: ROW_W }}>
        {heroes.map((h) => <RosterRow key={h.id} hero={h} portraitSize={portraitSize} onSelect={onSelect} />)}
      </div>
      <img src={`${BASE}bottom-cap.png`} alt="" draggable={false} style={{ display: 'block', width: 120, height: BOT_H }} />
    </div>
  );
}
