import React from 'react';
import { useTranslation } from 'react-i18next';

const FightPOIDetail = () => {
  const { t } = useTranslation('idleVillage');

  return (
    <div className="fight-poi-detail">
      <h2>{t('fightPOIDetail', 'Fight POI Detail')}</h2>
      {/* Risk assessment display (hp, damage, success chance) */}
      <div className="risk-assessment">
        <span>{t('riskAssessment', 'Risk Assessment')}</span>
        <span className="hp">HP: 100</span>
        <span className="damage">Damage: 25</span>
        <span className="success-chance">Success: 65%</span>
      </div>
      {/* Combat requirements e rewards */}
      <div className="combat-requirements">
        <span>{t('combatRequirements', 'Combat Requirements')}</span>
        <span className="requirements">Strength ≥ 5</span>
        <span className="rewards">Gold: 15, XP: 8</span>
      </div>
      {/* Specialized resident requirements (combat stats) */}
      <div className="resident-requirements">
        <span>{t('residentRequirements', 'Resident Requirements')}</span>
        <span className="stats">Combat Stats Required</span>
      </div>
    </div>
  );
};

export default FightPOIDetail;