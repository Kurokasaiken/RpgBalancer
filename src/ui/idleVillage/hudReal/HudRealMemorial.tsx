/**
 * HudRealMemorial — PLAN-113/114 E2 port (F3 art pass 2026-11-09):
 * The signed 8-A "Solemn Gallery (A)" of `s08-memorial` is a wide gallery of
 * carved gold bays: each bay has an oval emerald-studded portrait medallion on
 * top, an emerald enamel plaque in the middle, and an arched reliquary niche at
 * the bottom. Live `s.memorial` entries populate the bays; read-only like
 * production MemorialPanel.
 */
import React from 'react';
import { useTranslation } from 'react-i18next';
import { useMinimalGameplayStore } from '@/store/useMinimalGameplay';
import type { MemorialEntry } from '@/ui/idleVillage/memorial/memorialHall';
import { OrnCorner } from './zanaraOrn';

const FRAME_SRC = '/assets/ui/hud-real/memorial/frame.webp';
const C = {
  ink: '#f3e7c4',
  muted: '#9ec4b4',
  goldHi: '#f0d68a',
  gold: '#c9a94e',
  goldDark: '#8a6f35',
  emerald: '#1fb877',
} as const;

const GalleryBay: React.FC<{ entry: MemorialEntry; index: number }> = ({ entry, index }) => {
  const { t } = useTranslation('idleVillage');
  return (
    <li
      data-testid="hudreal-memorial-niche"
      style={{
        listStyle: 'none',
        flex: '1 1 0',
        minWidth: 165,
        maxWidth: 220,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 8,
        padding: '12px 10px 10px',
        borderRadius: 10,
        border: `2px solid ${C.gold}`,
        background: 'linear-gradient(180deg, rgba(24,42,36,.92) 0%, rgba(10,20,18,.95) 100%)',
        boxShadow: 'inset 0 0 0 1px #5e4a20, 0 8px 22px rgba(0,0,0,.65)',
      }}
    >
      {/* Oval emerald-studded memorial medallion (matching 8-A gallery top row) */}
      <div
        aria-hidden
        style={{
          width: 74,
          height: 92,
          borderRadius: '50%',
          border: `3px solid ${C.gold}`,
          boxShadow: `0 0 0 2px #5e4a20, inset 0 0 18px rgba(0,0,0,.8), 0 4px 12px rgba(0,0,0,.6)`,
          background: `radial-gradient(ellipse at 50% 38%, rgba(47,212,163,.24), rgba(8,22,26,.96) 72%)`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
        }}
      >
        {/* 4 cardinal emerald studs on the oval ring */}
        <span style={{ position: 'absolute', top: -5, left: '50%', transform: 'translateX(-50%)', width: 8, height: 8, borderRadius: '50%', background: C.emerald, border: `1px solid ${C.goldHi}` }} />
        <span style={{ position: 'absolute', bottom: -5, left: '50%', transform: 'translateX(-50%)', width: 8, height: 8, borderRadius: '50%', background: C.emerald, border: `1px solid ${C.goldHi}` }} />
        <span style={{ position: 'absolute', left: -5, top: '50%', transform: 'translateY(-50%)', width: 8, height: 8, borderRadius: '50%', background: C.emerald, border: `1px solid ${C.goldHi}` }} />
        <span style={{ position: 'absolute', right: -5, top: '50%', transform: 'translateY(-50%)', width: 8, height: 8, borderRadius: '50%', background: C.emerald, border: `1px solid ${C.goldHi}` }} />
        <svg width="36" height="48" viewBox="0 0 22 30" aria-hidden="true">
          <path d="M11 3 C15 8 16.5 12 11 16 C5.5 12 7 8 11 3 Z" fill={`${C.emerald}88`} stroke={C.goldHi} strokeWidth="0.9" />
          <rect x="9.5" y="16" width="3" height="9" rx="1" fill={C.gold} />
          <circle cx="11" cy="11" r="2.2" fill="#eafff5" opacity={0.85 - index * 0.1} />
        </svg>
      </div>

      {/* Emerald enamel inscription plaque (matching 8-A gallery middle row) */}
      <div
        style={{
          width: '100%',
          padding: '7px 8px',
          borderRadius: 6,
          border: `1.5px solid ${C.gold}`,
          background: 'linear-gradient(180deg, #124838 0%, #092820 100%)',
          boxShadow: 'inset 0 1px 3px rgba(255,255,255,.18), inset 0 -2px 6px rgba(0,0,0,.55)',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
        }}
      >
        <span style={{ fontFamily: 'Cinzel, "EB Garamond", serif', fontSize: 13.5, fontWeight: 700, letterSpacing: '0.08em', color: C.goldHi, textTransform: 'uppercase' }}>
          {entry.name}
        </span>
        <span style={{ font: 'italic 11.5px "EB Garamond", serif', color: C.muted, lineHeight: 1.25 }}>
          {t('gameFrame.menu.memorialLevel', { level: entry.level })}
          {' · '}
          {entry.place}
          {' · '}
          {t('gameFrame.menu.memorialDay', { day: entry.day })}
        </span>
      </div>

      {/* Arched lower reliquary niche (matching 8-A gallery bottom row) */}
      <div
        aria-hidden
        style={{
          width: 58,
          height: 64,
          borderRadius: '29px 29px 6px 6px',
          border: `1.5px solid ${C.goldDark}`,
          background: 'radial-gradient(ellipse at 50% 65%, rgba(240,214,138,.22), rgba(12,18,16,.95) 75%)',
          boxShadow: 'inset 0 4px 10px rgba(0,0,0,.75)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div style={{ width: 14, height: 22, borderRadius: '7px 7px 3px 3px', border: `1px solid ${C.gold}`, background: `radial-gradient(circle at 50% 45%, ${C.emerald}, #083a28)` }} />
      </div>
    </li>
  );
};

export const HudRealMemorial: React.FC<{ onClose?: () => void }> = ({ onClose }) => {
  const { t } = useTranslation('idleVillage');
  const entries = useMinimalGameplayStore((s) => s.memorial);
  return (
    <div
      data-testid="hudreal-memorial"
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        borderRadius: 14,
        border: `3px solid ${C.gold}`,
        boxShadow: '0 18px 54px rgba(0,0,0,.75), inset 0 0 0 1.5px #5e4a20',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        background: '#0b1512',
      }}
    >
      <OrnCorner corner="tl" /><OrnCorner corner="tr" /><OrnCorner corner="br" /><OrnCorner corner="bl" />
      {/* Signed 8-A Solemn Gallery backdrop art */}
      <img
        src={FRAME_SRC}
        alt=""
        draggable={false}
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.42, filter: 'saturate(1.1) contrast(1.05)' }}
      />
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 50% 50%, rgba(8,20,18,.35), rgba(6,14,14,.82))' }} />

      {/* Header bar */}
      <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 22px 8px', borderBottom: '1px solid rgba(201,169,78,.35)' }}>
        <span style={{ fontFamily: 'Cinzel, "EB Garamond", serif', fontSize: 18, fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', color: C.goldHi, textShadow: '0 1px 4px rgba(0,0,0,.9)' }}>
          {t('gameFrame.menu.memorialTitle')}
        </span>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '5px 16px', border: `1.5px solid ${C.gold}`, borderRadius: 7, cursor: 'pointer',
              background: 'linear-gradient(180deg,#1a7d54,#0d5c40)', color: '#eafff5',
              fontFamily: 'Cinzel, "EB Garamond", serif', fontSize: 11.5, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase',
            }}
          >
            {t('gameFrame.menu.close')}
          </button>
        )}
      </div>

      {/* Horizontal gallery bays (8-A Solemn Gallery architecture) */}
      <div style={{ position: 'relative', zIndex: 1, flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '14px 20px', overflowX: 'auto' }}>
        {entries.length === 0 ? (
          <div style={{ font: 'italic 16px "EB Garamond", serif', color: C.muted }}>{t('gameFrame.menu.memorialEmpty')}</div>
        ) : (
          <ol style={{ margin: 0, padding: 0, width: '100%', display: 'flex', justifyContent: 'center', gap: 16 }}>
            {entries.map((e, i) => <GalleryBay key={e.key} entry={e} index={i} />)}
          </ol>
        )}
      </div>
    </div>
  );
};

export default HudRealMemorial;
