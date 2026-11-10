/**
 * HudRealLevelUp — PLAN-113/114 F1 port (F3 art pass 2026-11-09):
 * `/assets/ui/hud-real/levelup/frame.webp` (340×712) is the clean panel B
 * extracted from `s09-levelup-0.png`: the sunburst, arched LEVEL UP ribbon,
 * ornate portrait medallion, and baroque emerald shield are preserved; the live
 * roman numeral, portrait, hero ceremony line, real `heroLevelGains` rows, and
 * Continue plaque sit directly in their measured sockets.
 */
import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { prefersReducedMotion } from '@/ui/idleVillage/skins/primitives';
import type { ResidentState } from '@/engine/game/idleVillage/TimeEngine';
import { subscribeHeroLevelUp } from '@/ui/idleVillage/rosterV2/heroLevelUpEvents';
import { heroLevelGains, toRoman } from '@/ui/idleVillage/rosterV2/heroLevelGains';

const FRAME_SRC = '/assets/ui/hud-real/levelup/frame.webp';
const ART_W = 340;
const ART_H = 712;
const C = { ink: '#f3e7c4', muted: '#cfe4d6', goldHi: '#f0d68a', emeraldGlow: '#2fd4a3' } as const;

interface Zone { x: number; y: number; w: number; h: number }
/* Measured on the 340×712 panel B crop (x0=534, y0=34 of 1408×768 s09-levelup-0.png) */
const Z = {
  level: { x: 132, y: 84, w: 76, h: 68 },
  portrait: { x: 123, y: 310, w: 94, h: 94 },
  heroLine: { x: 40, y: 432, w: 260, h: 34 },
  gains: { x: 96, y: 526, w: 148, h: 128 },
  button: { x: 92, y: 668, w: 156, h: 36 },
} satisfies Record<string, Zone>;

const pct = (z: Zone): React.CSSProperties => ({
  position: 'absolute',
  left: `${(z.x / ART_W) * 100}%`,
  top: `${(z.y / ART_H) * 100}%`,
  width: `${(z.w / ART_W) * 100}%`,
  height: `${(z.h / ART_H) * 100}%`,
});

interface Plate { id: string; residentId: string; level: number }
const MAX_PLATES = 4;
const CSS = `@keyframes zlPlateIn { from { transform: translateY(14px); opacity: 0; } to { transform: none; opacity: 1; } }`;

export const HudRealLevelUp: React.FC<{ residentsById: Record<string, ResidentState> }> = ({ residentsById }) => {
  const { t } = useTranslation('idleVillage');
  const [plates, setPlates] = useState<Plate[]>([]);
  const reduced = prefersReducedMotion();

  useEffect(() => subscribeHeroLevelUp((e) => {
    setPlates((prev) => [...prev.filter((p) => p.residentId !== e.residentId), { id: e.eventId, residentId: e.residentId, level: e.level }].slice(-MAX_PLATES));
  }), []);

  const close = useCallback((id: string) => setPlates((prev) => prev.filter((p) => p.id !== id)), []);

  useEffect(() => {
    if (plates.length === 0) return undefined;
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || event.defaultPrevented) return;
      event.preventDefault();
      setPlates((prev) => prev.slice(0, -1));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [plates.length]);

  if (plates.length === 0) return null;
  return (
    <div
      data-testid="hudreal-levelup-layer"
      style={{
        position: 'fixed', inset: 0, zIndex: 2600,
        display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'center', justifyContent: 'center',
        background: 'radial-gradient(ellipse at 50% 60%, rgba(4,14,16,.5), rgba(2,8,10,.78))',
      }}
    >
      <style>{CSS}</style>
      {plates.map((p) => {
        const resident = residentsById[p.residentId];
        const name = resident?.displayName ?? p.residentId;
        const rows = resident ? heroLevelGains(resident) : [];
        const title = t('gameFrame.heroLevel.ceremonyTitle', { name, level: toRoman(p.level) });
        const portrait = (resident as unknown as { portraitUrl?: string })?.portraitUrl;
        return (
          <section
            key={p.id}
            role="dialog"
            aria-label={title}
            data-testid="hudreal-levelup-plate"
            data-reduced-motion={reduced ? 'true' : 'false'}
            style={{
              position: 'relative', width: 'min(370px, 84vw)', aspectRatio: `${ART_W} / ${ART_H}`,
              containerType: 'size', filter: 'drop-shadow(0 18px 50px rgba(0,0,0,.78))',
              animation: reduced ? undefined : 'zlPlateIn 240ms ease-out both',
            }}
          >
            <img src={FRAME_SRC} alt="" draggable={false} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', display: 'block', borderRadius: 6 }} />

            {/* Roman numeral directly inside the clean sunburst */}
            <div style={{ ...pct(Z.level), display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{
                fontFamily: 'Cinzel, "EB Garamond", serif', fontSize: '6.2cqh', fontWeight: 800,
                color: '#4a2e06', textShadow: '0 0 10px rgba(255,245,200,.95), 0 1px 2px rgba(255,255,255,.85)',
              }}>
                {toRoman(p.level)}
              </span>
            </div>

            {/* Real portrait inside the ornate gold medallion */}
            {portrait && (
              <img
                src={portrait}
                alt=""
                draggable={false}
                style={{ ...pct(Z.portrait), borderRadius: '50%', objectFit: 'cover', boxShadow: 'inset 0 0 8px rgba(0,0,0,.6)' }}
              />
            )}

            {/* Hero name + level ceremony line in the light beam between medallion and shield */}
            <div style={{ ...pct(Z.heroLine), display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{
                fontFamily: 'Cinzel, "EB Garamond", serif', fontSize: '2.1cqh', fontWeight: 700,
                letterSpacing: '0.1em', textTransform: 'uppercase', color: '#fff3c9',
                textShadow: '0 1px 4px rgba(0,0,0,.95), 0 0 10px rgba(0,0,0,.85)', textAlign: 'center',
              }}>
                {title}
              </span>
            </div>

            {/* Real gain rows inside the clean baroque emerald shield */}
            <div style={{ ...pct(Z.gains), display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '0.8cqh', padding: '0.8cqh 1.6cqw', overflow: 'hidden' }}>
              {rows.map((r) => (
                <div key={r.key} data-gain-row={r.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 4, font: '1.8cqh "EB Garamond", serif', color: C.ink, textShadow: '0 1px 2px rgba(0,0,0,.9)', whiteSpace: 'nowrap' }}>
                  <span style={{ color: C.muted, overflow: 'hidden', textOverflow: 'ellipsis' }}>{t(r.labelKey)}</span>
                  <b style={{ fontFamily: 'Cinzel, "EB Garamond", serif', fontSize: '1.8cqh', fontVariantNumeric: 'tabular-nums', color: C.emeraldGlow }}>{r.from} → {r.to}</b>
                </div>
              ))}
            </div>

            {/* Continue plaque at the bottom of the frame */}
            <button
              type="button"
              onClick={() => close(p.id)}
              style={{
                ...pct(Z.button), border: '1.5px solid #c9a94e', cursor: 'pointer', borderRadius: 6,
                background: 'linear-gradient(180deg,#1a7d54,#0d5c40 60%,#083a28)',
                boxShadow: '0 4px 12px rgba(0,0,0,.65), inset 0 1px 3px rgba(255,255,255,.35)',
                fontFamily: 'Cinzel, "EB Garamond", serif', fontSize: '2.1cqh', fontWeight: 800,
                letterSpacing: '0.2em', textTransform: 'uppercase', color: '#eafff5',
              }}
            >
              {t('gameFrame.heroLevel.continue')}
            </button>
          </section>
        );
      })}
    </div>
  );
};

export default HudRealLevelUp;
