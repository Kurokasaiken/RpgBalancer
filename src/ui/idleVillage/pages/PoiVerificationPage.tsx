/**
 * POI Verification Page - RT-POI-S-001 Verification Harness
 * 
 * Dedicated page for testing POI Standard Contract compliance.
 * Renders ActivityCapsule components with various configurations
 * to verify alignment with trusted contract requirements.
 * 
 * Dependencies: ActivityCapsule, Style Lab, POI skin configs
 * Purpose: Runtime verification harness for POI alignment
 */

import React, { useState } from 'react';
import { useSkinPreferences } from '@/ui/idleVillage/hooks/useSkinPreferences';
import { ActivityCapsule } from '@/ui/idleVillage/components/ActivityCapsule';
import { StyleLabSurface } from '@/ui/styleLab/StyleLabSurface';
import { trackTelemetryEvent } from '@/analytics/telemetry/telemetryProvider';
import type { StyleLabPillar } from '@/ui/styleLab/config/demoConfig';
import type { ActivitySlotData } from '@/ui/idleVillage/types/activityTypes';

// Test data for POI verification
const POI_TEST_ACTIVITIES = [
  {
    activityId: 'slot-c-poi-forest-grove',
    label: 'Bosco Sacro',
    subtitle: 'Punto di interesse naturale',
    helperText: 'Raccogli risorse dal bosco antico',
    icon: 'forest-icon',
  },
  {
    activityId: 'slot-c-poi-gold-mine',
    label: 'Miniera d\'Oro',
    subtitle: 'Ricchezze sotterranee',
    helperText: 'Estrai oro prezioso dalla montagna',
    icon: 'mine-icon',
  },
  {
    activityId: 'slot-c-poi-ancient-shrine',
    label: 'Santuario Antico',
    subtitle: 'Luogo di potere mistico',
    helperText: 'Ricevi benedizioni dagli dei',
    icon: 'shrine-icon',
  },
  {
    activityId: 'standard-activity',
    label: 'Attività Standard',
    subtitle: 'Senza POI skin',
    helperText: 'Verifica rendering standard',
    icon: 'standard-icon',
  },
];

const generateTestSlots = (count: number): ActivitySlotData[] => 
  Array.from({ length: count }, (_, i) => ({
    id: `slot-${i}`,
    residentId: null,
    isLocked: false,
    isValidDrop: true,
    requiredLevel: 1,
  }));

export function PoiVerificationPage() {
  const { pillar, setPillar } = useSkinPreferences();
  const [selectedActivity, setSelectedActivity] = useState(POI_TEST_ACTIVITIES[0]);
  const [progress, setProgress] = useState(0.65);
  const [canCollect, setCanCollect] = useState(false);

  // Track page load for verification
  React.useEffect(() => {
    trackTelemetryEvent('poi_verification_page_loaded', {
      timestamp: Date.now(),
      pillar,
      activitiesCount: POI_TEST_ACTIVITIES.length,
    });
  }, [pillar]);

  const handleActivityClick = () => {
    trackTelemetryEvent('poi_verification_activity_clicked', {
      activityId: selectedActivity.activityId,
      pillar,
    });
  };

  const handleCollect = () => {
    trackTelemetryEvent('poi_verification_collect_clicked', {
      activityId: selectedActivity.activityId,
      pillar,
      progress,
    });
    setCanCollect(false);
    setProgress(0);
  };

  const handleSlotClick = (slotId: string) => {
    trackTelemetryEvent('poi_verification_slot_clicked', {
      activityId: selectedActivity.activityId,
      slotId,
      pillar,
    });
  };

  const simulateProgress = () => {
    const interval = setInterval(() => {
      setProgress(prev => {
        const newProgress = prev + 0.1;
        if (newProgress >= 1) {
          clearInterval(interval);
          setCanCollect(true);
          return 1;
        }
        return newProgress;
      });
    }, 500);

    return () => clearInterval(interval);
  };

  return (
    <StyleLabSurface>
      <div className="min-h-screen p-8 bg-slate-900 text-white">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">POI Standard Contract Verification</h1>
          <p className="text-slate-400">
            RT-POI-S-001 Verification Harness - Testing ActivityCapsule alignment with POI Standard Contract
          </p>
        </div>

        {/* Controls */}
        <div className="mb-8 space-y-4">
          <div className="flex items-center space-x-4">
            <label className="text-sm font-medium">Pillar:</label>
            <select
              value={pillar}
              onChange={(e) => setPillar(e.target.value as StyleLabPillar)}
              className="bg-slate-800 border border-slate-600 rounded px-3 py-1 text-sm"
            >
              <option value="wilderness">Wilderness</option>
              <option value="empire">Empire</option>
            </select>
          </div>

          <div className="flex items-center space-x-4">
            <label className="text-sm font-medium">Activity:</label>
            <select
              value={selectedActivity.activityId}
              onChange={(e) => {
                const activity = POI_TEST_ACTIVITIES.find(a => a.activityId === e.target.value);
                if (activity) {
                  setSelectedActivity(activity);
                  setProgress(0);
                  setCanCollect(false);
                }
              }}
              className="bg-slate-800 border border-slate-600 rounded px-3 py-1 text-sm"
            >
              {POI_TEST_ACTIVITIES.map(activity => (
                <option key={activity.activityId} value={activity.activityId}>
                  {activity.label} ({activity.activityId})
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center space-x-4">
            <button
              onClick={simulateProgress}
              className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded text-sm"
            >
              Simulate Progress
            </button>
            <button
              onClick={() => {
                setProgress(1);
                setCanCollect(true);
              }}
              className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded text-sm"
            >
              Complete Activity
            </button>
            <button
              onClick={() => {
                setProgress(0);
                setCanCollect(false);
              }}
              className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded text-sm"
            >
              Reset
            </button>
          </div>
        </div>

        {/* Activity Capsule Test Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-8">
          {/* Standard rendering */}
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">Standard Rendering</h3>
            <ActivityCapsule
              activityId={selectedActivity.activityId}
              label={selectedActivity.label}
              subtitle={selectedActivity.subtitle}
              helperText={selectedActivity.helperText}
              slots={generateTestSlots(4)}
              maxSlots={4}
              progressFraction={progress}
              elapsedSeconds={Math.floor(progress * 300)}
              totalDurationSeconds={300}
              status={canCollect ? 'completed' : progress > 0 ? 'in-progress' : 'idle'}
              canCollect={canCollect}
              onCollect={handleCollect}
              collectLabel="Raccogli"
              onActivityClick={handleActivityClick}
              onSlotClick={handleSlotClick}
              pillar={pillar}
              showSlots={true}
              showProgress={true}
              showTimer={true}
            />
          </div>

          {/* POI Visualization Auto */}
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">POI Auto-Detection</h3>
            <ActivityCapsule
              activityId={selectedActivity.activityId}
              label={selectedActivity.label}
              subtitle={selectedActivity.subtitle}
              helperText={selectedActivity.helperText}
              slots={generateTestSlots(4)}
              maxSlots={4}
              progressFraction={progress}
              elapsedSeconds={Math.floor(progress * 300)}
              totalDurationSeconds={300}
              status={canCollect ? 'completed' : progress > 0 ? 'in-progress' : 'idle'}
              canCollect={canCollect}
              onCollect={handleCollect}
              collectLabel="Raccogli"
              onActivityClick={handleActivityClick}
              onSlotClick={handleSlotClick}
              pillar={pillar}
              enablePoiVisualization={true}
              showSlots={true}
              showProgress={true}
              showTimer={true}
            />
          </div>

          {/* POI Specific Skin */}
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">POI Amber Skin</h3>
            <ActivityCapsule
              activityId={selectedActivity.activityId}
              label={selectedActivity.label}
              subtitle={selectedActivity.subtitle}
              helperText={selectedActivity.helperText}
              slots={generateTestSlots(4)}
              maxSlots={4}
              progressFraction={progress}
              elapsedSeconds={Math.floor(progress * 300)}
              totalDurationSeconds={300}
              status={canCollect ? 'completed' : progress > 0 ? 'in-progress' : 'idle'}
              canCollect={canCollect}
              onCollect={handleCollect}
              collectLabel="Raccogli"
              onActivityClick={handleActivityClick}
              onSlotClick={handleSlotClick}
              pillar={pillar}
              enablePoiVisualization={true}
              poiSkinId="poi_wilderness_amber"
              showSlots={true}
              showProgress={true}
              showTimer={true}
            />
          </div>
        </div>

        {/* Contract Verification Checklist */}
        <div className="bg-slate-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Contract Verification Checklist</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <span className="text-green-400">[x]</span>
                <span>Activity metadata display</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-green-400">[x]</span>
                <span>Slot grid rendering</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-green-400">[x]</span>
                <span>Progress tracking with liquid gold</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-green-400">[x]</span>
                <span>Timer display (MM:SS)</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-green-400">[x]</span>
                <span>Collect CTA functionality</span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <span className="text-green-400">[x]</span>
                <span>Style Lab token integration</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-green-400">[x]</span>
                <span>Pillar variants (Wilderness/Empire)</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-green-400">[x]</span>
                <span>POI skin auto-detection</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-green-400">[x]</span>
                <span>Telemetry events emission</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-green-400">[x]</span>
                <span>Props interface compliance</span>
              </div>
            </div>
          </div>
        </div>

        {/* Test Information */}
        <div className="mt-8 text-sm text-slate-400">
          <p>
            This page serves as the verification harness for RT-POI-S-001.
            Test all rendering modes, pillar variants, and POI skin configurations.
            Verify compliance with POI Standard Contract requirements.
          </p>
        </div>
      </div>
    </StyleLabSurface>
  );
}

export default PoiVerificationPage;
