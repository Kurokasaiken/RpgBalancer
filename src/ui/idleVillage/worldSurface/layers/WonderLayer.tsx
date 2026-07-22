```typescript
import React from 'react';
import { useWonderSystem } from '../hooks/useWonderSystem';
import { useSkinPreferences } from '../skins/useSkinPreferences';
import { DEFAULT_SKIN_PRESET_ID } from '../skins/skinPresets';

const WonderLayer = () => {
  const { activeWonder } = useWonderSystem();
  const { skinPresetId } = useSkinPreferences(DEFAULT_SKIN_PRESET_ID);

  if (!activeWonder) return null;

  return (
    <div className={`wonder-layer wonder-${activeWonder.type} skin-${skinPresetId}`}>
      {/* Wonder visuals will be rendered here */}
    </div>
  );
};

export default WonderLayer;