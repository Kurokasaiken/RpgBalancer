import { useTranslation } from 'react-i18next';
import { PersistenceService } from '../shared/persistence/PersistenceService';

const Onboarding = () => {
  const { t } = useTranslation('idleVillage');
  const persistenceService = new PersistenceService();

  const handleOnboarding = () => {
    // ... handle onboarding ...
  };

  return (
    <div>
      {t('onboarding.title')}
      <button onClick={handleOnboarding}>{t('onboarding.button')}</button>
    </div>
  );
};

export default Onboarding;