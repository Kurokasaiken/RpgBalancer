import React from 'react';
import { useSkinPreferences } from './hooks/useSkinPreferences';
import { DEFAULT_IDLE_VILLAGE_CONFIG } from '../../balancing/config/idleVillage/defaultConfig';
import { ActivityDefinition } from '../../balancing/config/idleVillage/types';
import { ActivityCapsule } from './components/ActivityCapsule';
import ActivityCardDetail from './components/ActivityCardDetail';
import { useMinimalGameplayWithIdleVillageConfig } from '@/store/useMinimalGameplay';
import { selectResourceWarnings } from '@/store/useMinimalGameplay';
import { VillageRosterSection, DragProvider, useCanonicalRosterBundle } from './roster';
import type { DragEndEvent } from '@dnd-kit/core';

const MinimalGameplayPage = () => {
  const { skinPreferences: _skinPreferences } = useSkinPreferences();
  const config = DEFAULT_IDLE_VILLAGE_CONFIG;
  const activities: ActivityDefinition[] = config.activities;
  
  // Use canonical roster bundle from shared bundle
  const { residents: canonicalResidents, residentsById: _residentsById } = useCanonicalRosterBundle(0);
  
  // Use minimal gameplay store for gameplay state (food, gold, activities, etc.)
  const gameplayState = useMinimalGameplayWithIdleVillageConfig();
  const { state, config: minimalConfig } = gameplayState;
  
  // Calculate resource warnings
  const resourceWarnings = selectResourceWarnings(state, minimalConfig);
  
  // Handle worker drop (placeholder for future drag & drop)
  const handleWorkerDrop = (event: DragEndEvent) => {
    console.log('Worker dropped:', event);
    // TODO: Implement drag & drop assignment logic
  };

  return (
    <DragProvider>
      <div className="space-y-6 p-6">
        {/* Resource Warnings Banner */}
        {(resourceWarnings.lowFood || resourceWarnings.highFatigue || resourceWarnings.anyResidentInjured) && (
          <div 
            className="rounded-lg border p-4 text-sm"
            style={{
              borderColor: resourceWarnings.lowFood ? 'var(--danger-color)' : 'var(--warning-color)',
              backgroundColor: resourceWarnings.lowFood ? 'rgba(239, 68, 68, 0.1)' : 'rgba(251, 191, 36, 0.1)',
              color: 'var(--text-primary)',
            }}
            role="alert"
            aria-live="polite"
          >
            <div className="space-y-1">
              {resourceWarnings.lowFood && (
                <p style={{ color: 'var(--danger-color)' }}>
                  ⚠️ Scorte di cibo critiche ({state.food} unità rimanenti)
                </p>
              )}
              {resourceWarnings.highFatigue && (
                <p style={{ color: 'var(--warning-color)' }}>
                  ⚠️ Fatica media alta ({Math.round(resourceWarnings.averageFatigue)}%)
                </p>
              )}
              {resourceWarnings.anyResidentInjured && (
                <p style={{ color: 'var(--danger-color)' }}>
                  ⚠️ Residenti feriti presenti
                </p>
              )}
            </div>
          </div>
        )}

        {/* Village Roster Section from shared bundle */}
        <VillageRosterSection
          residents={canonicalResidents.length > 0 ? canonicalResidents : state.residents}
          componentId="minimal-gameplay-roster"
          onDragEnd={handleWorkerDrop}
        />

        {/* Activities */}
        <div className="space-y-4">
          {activities.map((activity) => (
            <ActivityCapsule key={activity.id} activity={activity} />
          ))}
        </div>
        
        <ActivityCardDetail />
      </div>
    </DragProvider>
  );
};

export default MinimalGameplayPage;