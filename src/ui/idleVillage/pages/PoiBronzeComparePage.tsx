/**
 * PoiBronzeComparePage — in-context comparison of the bronze POI variants.
 *
 * Places V3, V3.5 and V4 side by side over the canonical painted world surface
 * so the material and seal differences can be judged on the same background.
 * Route: /poi-bronze-compare
 */
import React from 'react';
import { useTranslation } from '@/localization/useTranslation';
import PoiMatericV3, { poiMatericV3Styles } from '../components/poi/PoiMatericV3';
import PoiMatericV3_5, { poiMatericV3_5Styles } from '../components/poi/PoiMatericV3_5';
import PoiMatericV4, { poiMatericV4Styles } from '../components/poi/PoiMatericV4';

export const PoiBronzeComparePage: React.FC = () => {
  const { t } = useTranslation('idleVillage');

  const common = {
    type: 'event' as const,
    state: 'available' as const,
    progress: 1,
    size: 120,
    grounded: true,
  };

  const label = (key: string, fallback: string) =>
    String(t(`poiBronzeCompare.${key}` as never, { defaultValue: fallback }));

  return (
    <div className="poi-bronze-compare">
      <style>{poiMatericV3Styles}</style>
      <style>{poiMatericV3_5Styles}</style>
      <style>{poiMatericV4Styles}</style>
      <style>{poiBronzeCompareStyles}</style>

      <img
        className="poi-bronze-compare__map"
        src={encodeURI('/map orizzontale.png')}
        alt=""
        aria-hidden="true"
      />

      <div className="poi-bronze-compare__overlay">
        <div className="poi-bronze-compare__column">
          <span className="poi-bronze-compare__label">{label('v3', 'V3')}</span>
          <PoiMatericV3 {...common} />
        </div>
        <div className="poi-bronze-compare__column">
          <span className="poi-bronze-compare__label">{label('v3_5', 'V3.5')}</span>
          <PoiMatericV3_5 {...common} />
        </div>
        <div className="poi-bronze-compare__column">
          <span className="poi-bronze-compare__label">{label('v4', 'V4')}</span>
          <PoiMatericV4 {...common} />
        </div>
      </div>
    </div>
  );
};

const poiBronzeCompareStyles = `
.poi-bronze-compare {
  position: relative;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  background: #0a0a0a;
}
.poi-bronze-compare__map {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  opacity: 0.85;
}
.poi-bronze-compare__overlay {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 80px;
  width: 100%;
  height: 100%;
  padding: 40px;
  box-sizing: border-box;
}
.poi-bronze-compare__column {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}
.poi-bronze-compare__label {
  font-family: ui-sans-serif, system-ui, sans-serif;
  font-size: 14px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: rgba(240, 220, 180, 0.75);
  text-shadow: 0 1px 2px rgba(0,0,0,.7);
}
`;

export default PoiBronzeComparePage;
