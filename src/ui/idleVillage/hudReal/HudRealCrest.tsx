/** Phoenix + Sol Invictus crest (amend G1 #4, PLAN-112 §29). Shared by the roster mockup and /hud-compose. */
export const CREST_SIZE = 156;
const CREST = CREST_SIZE;
const GOLD = '#d8b866';
const GOLD_DK = '#7a5a1c';
const ENAMEL = '#0f3d38';
const ENAMEL_DK = '#082824';
const INK = '#efe6c8';
const SUB = '#b9d2c4';

/* ───────────────────────── Crest: phoenix + Sol Invictus instrument ───────────────────────── */

export function HudRealCrest({ size = CREST, ready, total, open, onToggle }: { size?: number; ready: number; total: number; open: boolean; onToggle: () => void }) {
  const s = size / CREST;
  return (
    <button type="button" onClick={onToggle} aria-expanded={open} aria-label={open ? 'Chiudi la compagnia' : 'Apri la compagnia (R)'}
      data-mock-crest="" style={{ position: 'relative', width: size, height: size, padding: 0, border: 0, background: 'none', cursor: 'pointer' }}>
      {/* armillary crest (Director's chosen piece): core centred on the box, side wings overhang */}
      <img src="/assets/ui/hud-real/crest/crest.webp" alt="" draggable={false}
        style={{ position: 'absolute', left: -11 * s, top: 7 * s, width: 175 * s, height: (175 * 431 / 529) * s, filter: 'drop-shadow(0 3px 5px rgba(2,16,14,.8))', pointerEvents: 'none' }} />
    </button>
  );
}

/** Small engraved plaque beside the crest: the company in one line (balances the top row). */
export function CompanyPlaque({ ready, total }: { ready: number; total: number }) {
  return (
    <div data-mock-plaque="" style={{
      display: 'flex', flexDirection: 'column', justifyContent: 'center', height: 56, padding: '0 18px 0 26px',
      background: `linear-gradient(180deg, #164c45, ${ENAMEL} 55%, ${ENAMEL_DK})`,
      border: `2px solid ${GOLD}`, borderLeft: 0, borderRadius: '0 28px 28px 0',
      boxShadow: `inset 0 0 0 1px ${GOLD_DK}, 0 2px 6px rgba(1,14,18,.7)`,
    }}>
      <span style={{ fontFamily: '"Cinzel", serif', fontSize: 14, letterSpacing: 2, color: SUB, lineHeight: '16px' }}>COMPAGNIA</span>
      <span style={{ fontFamily: '"Cinzel", serif', fontSize: 22, color: INK, lineHeight: '26px', whiteSpace: 'nowrap' }}>
        {ready}<span style={{ color: SUB, fontSize: 16 }}> / {total} pronti</span>
      </span>
    </div>
  );
}

