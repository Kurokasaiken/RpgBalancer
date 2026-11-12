/**
 * PlaceHoverCard — scheda hover bassa del Luogo (PLAN-117 rev. 5, T2.1, D-5).
 *
 * Verde e alabastro come da ruling 2026-11-11: l'alabastro è riservato a
 * questo componente (design-intent: eccezione al divieto generale), il verde
 * smalto porta il titolo. Anchored e `pointer-events: none` — è un display
 * puro, mai modale né bloccante (GX-0042, OB-2): nessun controllo dentro,
 * l'interazione sta tutta sul marker/ventaglio.
 */
import React from 'react';
import { useTranslation } from 'react-i18next';
import type { PlaceDefinition } from '@/balancing/config/idleVillage/placesConfig';

export interface PlaceHoverCardProps {
  place: PlaceDefinition;
  /** Card width in px — fixed so hover never reshapes the map layout. */
  widthPx?: number;
}

export const PlaceHoverCard: React.FC<PlaceHoverCardProps> = ({ place, widthPx = 240 }) => {
  const { t } = useTranslation();
  return (
    <div
      data-testid="place-hover-card"
      role="tooltip"
      style={{
        width: widthPx,
        pointerEvents: 'none',
        borderRadius: 10,
        overflow: 'hidden',
        border: '1px solid #3f5a45',
        background: '#0e1a14',
        boxShadow: '0 10px 28px rgba(4,10,8,.65), inset 0 0 0 1px rgba(220,230,210,.06)',
        fontFamily: 'serif',
      }}
    >
      {place.image ? (
        <img src={place.image} alt="" style={{ display: 'block', width: '100%', height: 92, objectFit: 'cover' }} />
      ) : null}
      <div
        style={{
          padding: '8px 12px 10px',
          background: 'linear-gradient(180deg, #173126 0%, #0e1a14 100%)',
        }}
      >
        <div
          data-testid="place-hover-card-title"
          style={{
            color: '#e8ddc0',
            fontSize: 14,
            letterSpacing: '.04em',
            borderBottom: '1px solid rgba(232,221,192,.25)',
            paddingBottom: 5,
            marginBottom: 5,
          }}
        >
          {t(place.titleKey)}
        </div>
        {place.bodyKey ? (
          <div style={{ color: '#bccfb4', fontSize: 12, lineHeight: 1.35 }}>{t(place.bodyKey)}</div>
        ) : null}
        {place.fixture ? (
          <div style={{ color: '#8a9a7c', fontSize: 10, marginTop: 6, fontStyle: 'italic' }}>fixture</div>
        ) : null}
      </div>
    </div>
  );
};

export default PlaceHoverCard;
