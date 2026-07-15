import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

const DestinyAstrolabeV3 = () => {
  const { t } = useTranslation('idleVillage');
  const [isSpinning, setIsSpinning] = useState(false);

  const handleThrow = () => {
    setIsSpinning(true);
    // Implement THROW logic
  };

  const handleSkip = () => {
    setIsSpinning(false);
    // Implement SKIP logic
  };

  return (
    <div className="flex items-center justify-center h-full">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-amber-400 mb-4">Destiny Astrolabe V3</h2>
        <p className="text-gray-300 mb-6">Componente in sviluppo - Fase F3 completata ma UI non ancora implementata</p>
        <div className="flex gap-4 justify-center">
          <button
            onClick={handleThrow}
            disabled={isSpinning}
            className="px-6 py-2 rounded font-bold bg-amber-600 text-black hover:bg-amber-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSpinning ? 'Spinning...' : t('THROW', { defaultValue: 'THROW' })}
          </button>
          <button
            onClick={handleSkip}
            className="px-6 py-2 rounded font-bold bg-gray-700 text-gray-300 hover:bg-gray-600"
          >
            {t('SKIP', { defaultValue: 'SKIP' })}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DestinyAstrolabeV3;