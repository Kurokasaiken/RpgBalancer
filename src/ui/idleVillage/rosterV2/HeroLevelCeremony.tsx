/**
 * HeroLevelCeremony — the level-up plate (PLAN-067 T-C1, R-234, LVL = B).
 *
 * Mock presentation, like the rest of the level-up beat: it listens to the same `hero_levelup_mock` events as
 * the roster's decorative layer and stamps ONE plate per hero — a seal with the new level in Roman numerals, the
 * hero's name, and the real gains (their current values plus the authored deltas from `heroLevelGainsConfig`).
 * It interrupts for one click: it is a reward, not a notification. Esc or «Continue» closes the top plate.
 * Reduced motion: the seal simply appears.
 */
import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { HudPlaque, SkinButton, SkinScope, prefersReducedMotion } from '@/ui/idleVillage/skins/primitives';
import { DEFAULT_GAME_FRAME_CONFIG } from '@/balancing/config/idleVillage/gameFrameConfig';
import type { ResidentState } from '@/engine/game/idleVillage/TimeEngine';
import { subscribeHeroLevelUp } from './heroLevelUpEvents';
import { heroLevelGains, toRoman } from './heroLevelGains';

interface Plate { id: string; residentId: string; level: number }

const MAX_PLATES = 4;
const CSS = `
@keyframes heroSealStamp { 0% { transform: scale(1.7) rotate(-8deg); opacity: 0; } 60% { transform: scale(0.94) rotate(1deg); opacity: 1; } 100% { transform: scale(1) rotate(0); opacity: 1; } }
@keyframes heroPlateIn { from { transform: translateY(10px); opacity: 0; } to { transform: none; opacity: 1; } }
`;

const Seal: React.FC<{ roman: string; reduced: boolean }> = ({ roman, reduced }) => (
  <svg
    viewBox="0 0 86 86" width="72" height="72" aria-hidden
    style={{ animation: reduced ? undefined : 'heroSealStamp 520ms ease-out both', filter: 'drop-shadow(0 4px 8px var(--skin-hud-lacquer-deep))' }}
  >
    <path d="M43 3l9 9h12v12l9 9-9 9v12H52l-9 9-9-9H22V42l-9-9 9-9V12h12z" fill="var(--skin-hud-brass-mid)" stroke="var(--skin-hud-brass-base)" strokeWidth="1.4" />
    <text x="43" y="52" textAnchor="middle" fontFamily="var(--skin-font-display)" fontWeight="700" fontSize={roman.length > 3 ? 18 : 24} fill="var(--skin-hud-lacquer-deep)">{roman}</text>
  </svg>
);

export const HeroLevelCeremony: React.FC<{ residentsById: Record<string, ResidentState> }> = ({ residentsById }) => {
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
    <SkinScope>
      <style>{CSS}</style>
      <div
        data-testid="hero-levelup-layer"
        style={{ position: 'fixed', inset: 0, zIndex: DEFAULT_GAME_FRAME_CONFIG.zLayers.reward, pointerEvents: 'none', display: 'flex', flexWrap: 'wrap', gap: 14, alignItems: 'center', justifyContent: 'center', padding: 24 }}
      >
        {plates.map((p) => {
          const resident = residentsById[p.residentId];
          const name = resident?.displayName ?? p.residentId;
          const rows = resident ? heroLevelGains(resident) : [];
          const title = t('gameFrame.heroLevel.ceremonyTitle', { name, level: toRoman(p.level) });
          return (
            <HudPlaque
              key={p.id}
              shape="panel"
              as="section"
              role="dialog"
              aria-label={title}
              data-testid="hero-levelup-plate"
              data-reduced-motion={reduced ? 'true' : 'false'}
              style={{ pointerEvents: 'auto', width: 300, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, padding: '18px 22px 16px', animation: reduced ? undefined : 'heroPlateIn 220ms ease-out both' }}
            >
              <Seal roman={toRoman(p.level)} reduced={reduced} />
              <h2 style={{ margin: 0, textAlign: 'center', font: '600 17px/1.2 var(--skin-font-display)', letterSpacing: '0.06em', color: 'var(--skin-title-color)' }}>{title}</h2>
              <div aria-hidden style={{ alignSelf: 'stretch', height: 1, background: 'linear-gradient(90deg, transparent, color-mix(in srgb, var(--skin-hud-brass-hi) 60%, transparent), transparent)' }} />
              <div style={{ alignSelf: 'stretch', display: 'flex', flexDirection: 'column', gap: 4 }}>
                {rows.map((r) => (
                  <div key={r.key} data-gain-row={r.key} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, font: '15px var(--skin-font-serif)', color: 'var(--skin-text-primary)' }}>
                    <span style={{ color: 'var(--skin-text-secondary)' }}>{t(r.labelKey)}</span>
                    <b style={{ font: '600 15px var(--skin-font-display)', fontVariantNumeric: 'tabular-nums', color: 'var(--skin-title-color)' }}>{r.from} → {r.to}</b>
                  </div>
                ))}
              </div>
              <SkinButton variant="cta" onClick={() => close(p.id)} style={{ marginTop: 6 }}>
                {t('gameFrame.heroLevel.continue')}
              </SkinButton>
            </HudPlaque>
          );
        })}
      </div>
    </SkinScope>
  );
};

export default HeroLevelCeremony;
