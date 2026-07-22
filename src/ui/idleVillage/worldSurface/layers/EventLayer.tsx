```typescript
import React from 'react';
import { useEventSystem } from '../hooks/useEventSystem';
import { useSkinPreferences } from '../hooks/useSkinPreferences';
import { DEFAULT_SKIN_PRESET_ID } from '../config/skinConfig';

const EventLayer = () => {
  const { activeEvents } = useEventSystem();
  const { skinPresetId } = useSkinPreferences();

  return (
    <div>
      {activeEvents.map((event) => (
        <div key={event.id} className={`event-${event.phase}`}>
          {/* Visual overrides for each phase */}
          {event.phase === 'presage' && <div className="distant-smoke" />}
          {event.phase === 'threat' && <div className="fire-glow" />}
          {event.phase === 'event' && <div className="region-desaturation" />}
          {event.phase === 'consequence' && <div className="burned-aftermath" />}
        </div>
      ))}
    </div>
  );
};

export default EventLayer;