import { useTranslation } from 'react-i18next';
import { SkinButton } from '../../skins/primitives/SkinButton';
import { SkinScope } from '../../skins/primitives/SkinScope';
import { SkinTitle } from '../../skins/primitives/SkinTitle';

export interface ScenarioSelectorItem {
  id: string;
  labelKey: string;
}

interface ScenarioSelectorProps {
  scenarios: ScenarioSelectorItem[];
  activeId: string;
  onSelect: (id: string) => void;
}

/**
 * Select the active presentation scenario.
 */
export function ScenarioSelector({ scenarios, activeId, onSelect }: ScenarioSelectorProps) {
  const { t } = useTranslation('idleVillage');

  return (
    <SkinScope className="presentation-scenario-selector space-y-2">
      <SkinTitle level="section">{t('presentation.scenarios.title')}</SkinTitle>
      <div className="flex flex-wrap gap-2">
        {scenarios.map((scenario) => (
          <SkinButton
            key={scenario.id}
            variant={activeId === scenario.id ? 'cta' : 'secondary'}
            onClick={() => onSelect(scenario.id)}
            data-testid={`scenario-${scenario.id}`}
          >
            {t(scenario.labelKey)}
          </SkinButton>
        ))}
      </div>
    </SkinScope>
  );
}
