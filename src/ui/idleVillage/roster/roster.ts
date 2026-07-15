// TODO: Implement roster functionality based on trusted documentation
// Trusted documentation: src/docs/docs/idle_village/trusted/roster_drag_trusted.md
import { useSkinPreferences } from '@/shared/skin';
import { DEFAULT_SKIN_PRESET_ID } from '@/shared/constants';
import { useTranslation } from 'react-i18next';

export function Roster() {
  const { t } = useTranslation('idleVillage');
  const skin = useSkinPreferences(DEFAULT_SKIN_PRESET_ID);

  return (
    <div>
      {t('roster.title')}
    </div>
  );
}