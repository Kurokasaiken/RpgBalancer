// Test fixture: This file SHOULD PASS the legacy patterns check
// It uses i18n correctly and has no hardcoded strings

import React from 'react';
import { useTranslation } from 'react-i18next';

export const GoodComponent = () => {
  const { t } = useTranslation('common');

  return (
    <div>
      <h1>{t('welcome.title')}</h1>
      <p>{t('welcome.description')}</p>
      <button>{t('welcome.action')}</button>
    </div>
  );
};
