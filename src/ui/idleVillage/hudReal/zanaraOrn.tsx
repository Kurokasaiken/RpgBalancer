/**
 * zanaraOrn — shared Zanara ornament primitives for the /hud-compose signed surfaces
 * (PLAN-113/114). Extracted verbatim from the signed cassetto primitives (HudRealCassetto,
 * baseline 67c730193c1e): carved gold, filigree, faceted emeralds, deep field enamel.
 * Consolidating HudRealCassetto itself onto this module is a follow-up — the signed
 * baseline stays untouched.
 */
import React from 'react';

/** The signed Zanara palette (same token values as the cassetto). */
export const Z = {
  field: '#0d1f1d', fieldHi: '#143229', navy: '#0a1a22', fieldDark: '#07121a',
  ink: '#f3e7c4', muted: '#8fb2a2',
  gold: '#c9a94e', goldDark: '#8a6f35', goldHi: '#f0d68a', goldDeep: '#5e4a20',
  emerald: '#1fb877', emeraldDark: '#0d5c40', emeraldGlow: '#2fd4a3',
  danger: '#c04f4f', shadow: '0 14px 50px rgba(0,0,0,.6)',
} as const;

/** Faceted emerald — a small carved gem: bright facet + dark rim + gold bezel. */
export const OrnGem: React.FC<{ size?: number; facet?: boolean }> = ({ size = 10, facet = true }) => (
  <svg width={size} height={size} viewBox="0 0 20 20" aria-hidden="true" style={{ display: 'block' }}>
    <defs>
      <radialGradient id={`zgemg${size}`} cx="35%" cy="30%" r="75%">
        <stop offset="0%" stopColor="#aef0cf" />
        <stop offset="40%" stopColor={Z.emeraldGlow} />
        <stop offset="100%" stopColor={Z.emeraldDark} />
      </radialGradient>
    </defs>
    <polygon points="10,1 18,7 15,19 5,19 2,7" fill={`url(#zgemg${size})`} stroke={Z.goldDark} strokeWidth="1.2" />
    {facet && <polygon points="10,4 14,8 10,15 6,8" fill="rgba(255,255,255,.22)" />}
  </svg>
);

/** Organic filigree scroll stroke — one sinuous carved volute. */
export const OrnFiligree: React.FC<{ w: number; h: number; flip?: boolean }> = ({ w, h, flip }) => (
  <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden="true" style={{ display: 'block' }}>
    <g stroke={Z.gold} strokeWidth="2.6" fill="none" strokeLinecap="round" transform={flip ? `scale(-1,1) translate(-${w},0)` : undefined}>
      <path d={`M${w * 0.5} 4 C${w * 0.08} ${h * 0.18}, ${w * 0.92} ${h * 0.30}, ${w * 0.5} ${h * 0.48} C${w * 0.08} ${h * 0.66}, ${w * 0.92} ${h * 0.78}, ${w * 0.5} ${h - 4}`} />
      <path d={`M${w * 0.5} ${h * 0.16} q${w * 0.22} -10 ${w * 0.22} -22`} strokeWidth="2" />
      <path d={`M${w * 0.5} ${h * 0.84} q${w * 0.22} 10 ${w * 0.22} 22`} strokeWidth="2" />
    </g>
  </svg>
);

/** Corner filigree cluster — two carved curls + a gem, placed on the frame corners. */
export const OrnCorner: React.FC<{ corner: 'tl' | 'tr' | 'bl' | 'br' }> = ({ corner }) => {
  const rot = { tl: 0, tr: 90, br: 180, bl: 270 }[corner];
  const pos: React.CSSProperties = {
    tl: { top: -6, left: -6 }, tr: { top: -6, right: -6 },
    br: { bottom: -6, right: -6 }, bl: { bottom: -6, left: -6 },
  }[corner];
  return (
    <div aria-hidden="true" style={{ position: 'absolute', width: 34, height: 34, transform: `rotate(${rot}deg)`, ...pos }}>
      <svg width="34" height="34" viewBox="0 0 34 34">
        <path d="M2 18 Q2 2 18 2 M4 22 Q4 8 20 4" stroke={Z.gold} strokeWidth="2.4" fill="none" strokeLinecap="round" />
        <polygon points="17,4 22,9 17,14 12,9" fill={Z.emerald} stroke={Z.goldDark} strokeWidth="1.2" />
      </svg>
    </div>
  );
};

/** Ornate inner frame block — the signed "every zone in its own carved frame" wrapper. */
export const ZanaraBlock: React.FC<{ label?: string; children: React.ReactNode; pad?: string; style?: React.CSSProperties }> = ({ label, children, pad = '8px 12px 10px', style }) => (
  <div
    style={{
      position: 'relative', margin: '6px 12px',
      border: `1.5px solid ${Z.gold}`, borderRadius: 10,
      background: `linear-gradient(180deg, #0e2226 0%, ${Z.fieldDark} 100%)`,
      boxShadow: `inset 0 0 0 1px ${Z.goldDeep}, inset 0 2px 10px rgba(0,0,0,.5), 0 2px 6px rgba(0,0,0,.3)`,
      padding: pad,
      ...style,
    }}
  >
    {(['tl', 'tr', 'bl', 'br'] as const).map((c) => <OrnCorner key={c} corner={c} />)}
    {label && (
      <div style={{ textAlign: 'center', fontSize: 11, letterSpacing: 2.4, color: Z.goldHi, textTransform: 'uppercase', textShadow: '0 1px 2px rgba(0,0,0,.7)', marginBottom: 6, fontWeight: 600, fontFamily: 'Cinzel, "EB Garamond", serif' }}>
        {label}
      </div>
    )}
    {children}
  </div>
);

/** The outer carved plaque — thick gold frame + corner clusters + dark field; the signed
 *  envelope of every Zanara surface. Children render inside the field. */
export const ZanaraPlaque: React.FC<{ children: React.ReactNode; style?: React.CSSProperties; title?: string; kicker?: string }> = ({ children, style, title, kicker }) => (
  <div
    style={{
      position: 'relative',
      border: `2.5px solid ${Z.gold}`, borderRadius: 16,
      background: `linear-gradient(180deg, ${Z.fieldHi} 0%, ${Z.field} 34%, ${Z.fieldDark} 100%)`,
      boxShadow: `inset 0 0 0 1.5px ${Z.goldDeep}, inset 0 0 26px rgba(0,0,0,.62), ${Z.shadow}`,
      fontFamily: '"EB Garamond", serif', color: Z.ink,
      overflow: 'hidden',
      ...style,
    }}
  >
    {(['tl', 'tr', 'bl', 'br'] as const).map((c) => <OrnCorner key={c} corner={c} />)}
    {(title || kicker) && (
      <div style={{ padding: '12px 18px 8px', textAlign: 'center', borderBottom: `1px solid color-mix(in srgb, ${Z.gold} 42%, transparent)` }}>
        {kicker && <div style={{ fontSize: 10.5, letterSpacing: 3, color: Z.muted, textTransform: 'uppercase' }}>{kicker}</div>}
        {title && <div style={{ fontFamily: 'Cinzel, "EB Garamond", serif', fontSize: 17, letterSpacing: 2.6, color: Z.goldHi, textTransform: 'uppercase', textShadow: '0 1px 3px rgba(0,0,0,.75)', marginTop: 2 }}>{title}</div>}
      </div>
    )}
    {children}
  </div>
);

/** Enamel cartouche button — the signed CONFIRM/close plaque control. */
export const ZanaraButton: React.FC<{ children: React.ReactNode; onClick?: () => void; disabled?: boolean; tone?: 'gold' | 'emerald' | 'iron'; style?: React.CSSProperties }> = ({ children, onClick, disabled, tone = 'gold', style }) => {
  const tones = {
    gold: { bg: `linear-gradient(180deg, ${Z.goldHi} 0%, ${Z.gold} 55%, ${Z.goldDark} 100%)`, ink: '#241a08', border: Z.goldDeep },
    emerald: { bg: `linear-gradient(180deg, ${Z.emeraldGlow} 0%, ${Z.emerald} 55%, ${Z.emeraldDark} 100%)`, ink: '#052015', border: '#083a28' },
    iron: { bg: 'linear-gradient(180deg, #4d5a5e 0%, #2c3538 100%)', ink: '#dfe8e6', border: '#1a2224' },
  }[tone];
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        fontFamily: 'Cinzel, "EB Garamond", serif', fontSize: 12.5, fontWeight: 700, letterSpacing: 2,
        textTransform: 'uppercase', color: tones.ink,
        background: tones.bg, border: `1.5px solid ${tones.border}`, borderRadius: 9,
        padding: '8px 18px', cursor: disabled ? 'default' : 'pointer',
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,.35), 0 3px 8px rgba(0,0,0,.45)',
        opacity: disabled ? 0.5 : 1,
        ...style,
      }}
    >
      {children}
    </button>
  );
};
