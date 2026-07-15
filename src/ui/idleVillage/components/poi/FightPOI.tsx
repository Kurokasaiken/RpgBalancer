import React from 'react';
import { useSkinPreferences } from '../../hooks/useSkinPreferences';
import { useTranslation } from 'react-i18next';

const FightPOI = () => {
  const { presetId } = useSkinPreferences();
  const { t } = useTranslation('idleVillage');

  return (
    <div className="fight-poi">
      <div className="combat-icon">⚔️</div>
      {/* Additional visual states (danger/risk/victory) */}
      <div className="risk-indication">
        <span>{t('riskLevel', 'Risk Level')}</span>
        <span className="risk-level">High</span>
      </div>
      {/* Enhanced hover effects per risk communication */}
      <div className="hover-effect">
        <span>{t('hoverEffect', 'Dangerous Combat')}</span>
      </div>
    </div>
  );
};

export default FightPOI;