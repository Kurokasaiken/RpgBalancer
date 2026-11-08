/**
 * HudRealLevelUp — PLAN-113/114 F1 port: the level-up ceremony in the signed 9-B
 * "luce ascendente" form (an ascending column of light, a great carved seal with the new
 * level in Roman numerals, the hero's name and the real gains). Same semantics as
 * production `HeroLevelCeremony`: it listens to the same `hero_levelup_mock` presentation
 * bus, stacks one plate per hero (max 4), interrupts for one click — Esc or «Continue»
 * dismisses the top plate. Reduced motion: the seal simply appears.
 */
import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { prefersReducedMotion } from '@/ui/idleVillage/skins/primitives';
import type { ResidentState } from '@/engine/game/idleVillage/TimeEngine';
import { subscribeHeroLevelUp } from '@/ui/idleVillage/rosterV2/heroLevelUpEvents';
import { heroLevelGains, toRoman } from '@/ui/idleVillage/rosterV2/heroLevelGains';
import { Z, ZanaraButton, OrnGem, OrnCorner } from './zanaraOrn';

interface Plate { id: string; residentId: string; level: number }
const MAX_PLATES = 4;

const CSS = `
@keyframes zlSealStamp { 0% { transform: scale(1.7) rotate(-8deg); opacity: 0; } 60% { transform: scale(0.94) rotate(1deg); opacity: 1; } 100% { transform: scale(1) rotate(0); opacity: 1; } }
@keyframes zlPlateIn { from { transform: translateY(14px); opacity: 0; } to { transform: none; opacity: 1; } }
@keyframes zlBeamRise { 0% { transform: translateY(46%) scaleY(.2); opacity: 0; } 55% { opacity: 1; } 100% { transform: translateY(0) scaleY(1); opacity: 1; } }
`;

/** The great carved seal — the Roman numeral inside a double gold ring with gem points. */
const GreatSeal: React.FC<{ roman: string; reduced: boolean }> = ({ roman, reduced }) => (
  <svg
    viewBox="0 0 120 120" width="104" height="104" aria-hidden
    style={{ animation: reduced ? undefined : 'zlSealStamp 560ms ease-out 280ms both', filter: `drop-shadow(0 6px 14px rgba(0,0,0,.7)) drop-shadow(0 0 22px ${Z.emeraldGlow}66)` }}
  >
    <circle cx="60" cy="60" r="56" fill="none" stroke={Z.gold} strokeWidth="3" />
    <circle cx="60" cy="60" r="49" fill={`${Z.fieldDark}`} stroke={Z.goldDark} strokeWidth="1.5" />
    <circle cx="60" cy="60" r="44" fill="none" stroke={`${Z.emerald}88`} strokeWidth="1" />
    {[0, 90, 180, 270].map((a) => (
      <polygon key={a} points="60,4 64,10 60,16 56,10" transform={`rotate(${a} 60 60)`} fill={Z.emerald} stroke={Z.goldDark} strokeWidth="0.8" />
    ))}
    <path d="M60 22l7 7h10v10l7 7-7 7v10H67l-7 7-7-7H43V53l-7-7 7-7V29h10z" fill={Z.gold} stroke={Z.goldDeep} strokeWidth="1.4" opacity="0.9" />
    <text x="60" y="70" textAnchor="middle" fontFamily='Cinzel, "EB Garamond", serif' fontWeight="700" fontSize={roman.length > 3 ? 22 : 30} fill={Z.fieldDark}>{roman}</text>
  </svg>
);

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
      style={{ position: 'fixed', inset: 0, zIndex: 2600, pointerEvents: 'none', display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'center', justifyContent: 'center', padding: 24, background: 'radial-gradient(ellipse at 50% 60%, rgba(4,14,16,.55), rgba(2,8,10,.78))' }}
    >
      <style>{CSS}</style>
      {plates.map((p) => {
        const resident = residentsById[p.residentId];
        const name = resident?.displayName ?? p.residentId;
        const rows = resident ? heroLevelGains(resident) : [];
        const title = t('gameFrame.heroLevel.ceremonyTitle', { name, level: toRoman(p.level) });
        return (
          <section
            key={p.id}
            role="dialog"
            aria-label={title}
            data-testid="hudreal-levelup-plate"
            data-reduced-motion={reduced ? 'true' : 'false'}
            style={{
              pointerEvents: 'auto', position: 'relative', width: 320, overflow: 'hidden',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
              padding: '26px 24px 20px', borderRadius: 18,
              border: `2.5px solid ${Z.gold}`,
              background: `linear-gradient(180deg, ${Z.fieldHi} 0%, ${Z.field} 40%, ${Z.fieldDark} 100%)`,
              boxShadow: `inset 0 0 0 1.5px ${Z.goldDeep}, inset 0 0 30px rgba(0,0,0,.6), ${Z.shadow}`,
              animation: reduced ? undefined : 'zlPlateIn 240ms ease-out both',
            }}
          >
            {(['tl', 'tr', 'bl', 'br'] as const).map((c) => <OrnCorner key={c} corner={c} />)}
            {/* the ascending light — a column rising through the plate behind the seal */}
            <div
              aria-hidden
              style={{
                position: 'absolute', left: '50%', bottom: -30, width: 150, height: '118%', transform: 'translateX(-50%)',
                background: `linear-gradient(180deg, transparent 0%, ${Z.emeraldGlow}30 30%, ${Z.emerald}4d 62%, ${Z.goldHi}59 100%)`,
                clipPath: 'polygon(38% 0, 62% 0, 88% 100%, 12% 100%)',
                filter: 'blur(7px)', animation: reduced ? undefined : 'zlBeamRise 900ms ease-out both',
              }}
            />
            <div aria-hidden style={{ position: 'absolute', left: '50%', bottom: -14, transform: 'translateX(-50%)', width: 210, height: 54, borderRadius: '50%', background: `radial-gradient(ellipse, ${Z.goldHi}66, transparent 70%)`, filter: 'blur(6px)' }} />
            <GreatSeal roman={toRoman(p.level)} reduced={reduced} />
            <h2 style={{ margin: 0, position: 'relative', textAlign: 'center', fontFamily: 'Cinzel, "EB Garamond", serif', fontSize: 16.5, fontWeight: 600, letterSpacing: 1.4, color: Z.goldHi, textShadow: '0 1px 3px rgba(0,0,0,.8)' }}>{title}</h2>
            <div aria-hidden style={{ alignSelf: 'stretch', height: 1, background: `linear-gradient(90deg, transparent, ${Z.gold}aa, transparent)` }} />
            <div style={{ alignSelf: 'stretch', position: 'relative', display: 'flex', flexDirection: 'column', gap: 5 }}>
              {rows.map((r) => (
                <div key={r.key} data-gain-row={r.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, font: '15px "EB Garamond", serif', color: Z.ink }}>
                  <span style={{ color: Z.muted }}>{t(r.labelKey)}</span>
                  <b style={{ fontFamily: 'Cinzel, "EB Garamond", serif', fontWeight: 600, fontSize: 14.5, fontVariantNumeric: 'tabular-nums', color: Z.emeraldGlow }}>{r.from} → {r.to}</b>
                </div>
              ))}
            </div>
            <div aria-hidden style={{ display: 'flex', gap: 8, alignItems: 'center' }}><OrnGem size={9} /><OrnGem size={12} /><OrnGem size={9} /></div>
            <ZanaraButton tone="emerald" onClick={() => close(p.id)} style={{ position: 'relative', marginTop: 2 }}>
              {t('gameFrame.heroLevel.continue')}
            </ZanaraButton>
          </section>
        );
      })}
    </div>
  );
};

export default HudRealLevelUp;
