import React from 'react';
import { useTranslation } from 'react-i18next';
import { SkinBadge, SkinButton } from '@/ui/idleVillage/skins/primitives';
import { ClockEmbed, PgCardEmbed, PoiMedallionEmbed } from './GamePatternEmbeds';

/**
 * HeroShowcase — la prima cosa che vedi aprendo la Review Room.
 *
 * Ruolo rigido: EMOZIONE. In 3 secondi devi capire "questo è il linguaggio
 * visivo del gioco". Regola 80/20: la composizione può non esistere in-game,
 * ma è costruita quasi solo con componenti reali (Clock, POI, PgCard via
 * frozen kit) — mai concept art, mai elementi non producibili.
 *
 * Il preset arriva dallo switcher globale della pagina (unica fonte): un
 * selettore locale duplicherebbe lo stato e violerebbe il ruolo della Matrix
 * (il confronto tra skin vive lì, non qui).
 */
export function HeroShowcase() {
  const { t } = useTranslation('common');

  return (
    <div data-testid="hero-showcase">
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(220px, 1fr) minmax(280px, 1.4fr) minmax(220px, 1fr)',
          gap: '18px',
          alignItems: 'start',
        }}
      >
        {/* Colonna sinistra: il tempo del villaggio */}
        <div data-skin="panel" style={{ padding: '14px' }}>
          <div data-skin="section">{t('designSystem.hero.time', 'Village Time')}</div>
          <ClockEmbed />
        </div>

        {/* Centro: la scoperta — POI + invito all'azione */}
        <div data-skin="panel" style={{ padding: '18px', textAlign: 'center' }}>
          <span data-skin="plaque">{t('designSystem.hero.expedition', 'EXPEDITION')}</span>
          {/* div con ruolo title: la pagina ha già il suo h1 */}
          <div data-skin="title" style={{ fontSize: '24px', margin: '10px 0 2px' }}>
            {t('designSystem.hero.title', 'The Wilds Await')}
          </div>
          <div data-skin="titlesep" aria-hidden />
          <div style={{ display: 'flex', justifyContent: 'center', margin: '12px 0' }}>
            <PoiMedallionEmbed />
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', alignItems: 'center' }}>
            <SkinBadge>{t('designSystem.hero.badge', 'new discovery')}</SkinBadge>
            <SkinButton variant="cta">{t('designSystem.hero.cta', 'Avvia')}</SkinButton>
          </div>
        </div>

        {/* Colonna destra: chi mandiamo */}
        <div data-skin="panel" style={{ padding: '14px' }}>
          <div data-skin="section">{t('designSystem.hero.resident', 'Resident')}</div>
          <PgCardEmbed />
        </div>
      </div>
    </div>
  );
}

export default HeroShowcase;
