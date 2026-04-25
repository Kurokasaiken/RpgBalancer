/**
 * RT-POI-D-001 Verification Page
 * 
 * Dedicated POI Detail verification page that demonstrates PoiDetailSkinWrapper
 * integration with ActivityCapsuleDetailSkinAware and validates compliance
 * with POI Detail trusted contract.
 */

import React, { useState, useCallback, useMemo } from 'react';
import { PoiDetailSkinWrapper } from '../components/PoiDetailSkinWrapper';
import { trackTelemetryEvent } from '@/analytics/telemetry/telemetryProvider';
import type { ActivityDetailSlotData, TelemetryEntry } from '../skins/activityCapsuleDetail/ActivityCapsuleDetailSkinAware';

// Mock data for verification
const mockSlots: ActivityDetailSlotData[] = [
  {
    id: 'slot-1',
    state: 'idle',
    initial: 'AB',
    progress: 0,
    assignedWorkerName: undefined,
  },
  {
    id: 'slot-2', 
    state: 'empty',
    initial: '',
    progress: 0,
  },
  {
    id: 'slot-3',
    state: 'active',
    initial: 'CD',
    progress: 0.65,
    assignedWorkerName: 'Forest Worker',
    assignedWorkerAvatarUrl: '/assets/portraits/worker-1.png',
  },
];

const mockTelemetry: TelemetryEntry[] = [
  {
    id: 'tel-1',
    timestamp: new Date(Date.now() - 3600000),
    message: 'Activity started',
    type: 'start',
  },
  {
    id: 'tel-2',
    timestamp: new Date(Date.now() - 1800000),
    message: 'Worker assigned to slot 3',
    type: 'assign',
  },
  {
    id: 'tel-3',
    timestamp: new Date(Date.now() - 600000),
    message: 'Progress update: 65%',
    type: 'done',
  },
];

export function PoiDetailVerificationPage() {
  const [selectedActivity, setSelectedActivity] = useState('forest-hunt');
  const [detailOpen, setDetailOpen] = useState(true);
  const [pillar, setPillar] = useState<'wilderness' | 'empire'>('wilderness');

  // Activity configurations for verification
  const activities = useMemo(() => ({
    'forest-hunt': {
      name: 'Forest Hunt',
      type: 'quest',
      subtitle: 'Hunt wild game in the ancient forest',
      status: 'in-progress' as const,
      progress: 0.65,
      duration: 3600, // 1 hour
      elapsed: 2340, // 39 minutes
      durationDisplay: '1h 0m',
      rewardDisplay: 'Food: +15, Hide: +3',
      etaDisplay: '21m remaining',
    },
    'gold-mine': {
      name: 'Gold Mine',
      type: 'job',
      subtitle: 'Extract precious gold from mountain veins',
      status: 'idle' as const,
      progress: 0,
      duration: 7200, // 2 hours
      elapsed: 0,
      durationDisplay: '2h 0m',
      rewardDisplay: 'Gold: +25',
      etaDisplay: 'Ready to start',
    },
    'market-stall': {
      name: 'Market Stall',
      type: 'shop',
      subtitle: 'Trade goods and resources',
      status: 'completed' as const,
      progress: 1.0,
      duration: 1800, // 30 minutes
      elapsed: 1800,
      durationDisplay: '30m 0s',
      rewardDisplay: 'Gold: +10, Food: +5',
      etaDisplay: 'Completed',
    },
  }), []);

  const currentActivity = activities[selectedActivity as keyof typeof activities];

  const handleStart = useCallback(() => {
    trackTelemetryEvent('poi_detail_verification_start', {
      activityId: selectedActivity,
      pillar,
      timestamp: Date.now(),
    });
    console.log('Start activity:', selectedActivity);
  }, [selectedActivity, pillar]);

  const handleCancel = useCallback(() => {
    trackTelemetryEvent('poi_detail_verification_cancel', {
      activityId: selectedActivity,
      pillar,
      timestamp: Date.now(),
    });
    console.log('Cancel activity:', selectedActivity);
  }, [selectedActivity, pillar]);

  const handleCollect = useCallback(() => {
    trackTelemetryEvent('poi_detail_verification_collect', {
      activityId: selectedActivity,
      pillar,
      timestamp: Date.now(),
    });
    console.log('Collect activity:', selectedActivity);
  }, [selectedActivity, pillar]);

  const handleSlotAssign = useCallback((slotId: string) => {
    trackTelemetryEvent('poi_detail_verification_slot_assign', {
      activityId: selectedActivity,
      slotId,
      pillar,
      timestamp: Date.now(),
    });
    console.log('Assign slot:', slotId);
  }, [selectedActivity, pillar]);

  const handleSlotDetach = useCallback((slotId: string) => {
    trackTelemetryEvent('poi_detail_verification_slot_detach', {
      activityId: selectedActivity,
      slotId,
      pillar,
      timestamp: Date.now(),
    });
    console.log('Detach slot:', slotId);
  }, [selectedActivity, pillar]);

  const handleClose = useCallback(() => {
    trackTelemetryEvent('poi_detail_verification_close', {
      activityId: selectedActivity,
      pillar,
      timestamp: Date.now(),
    });
    setDetailOpen(false);
  }, [selectedActivity, pillar]);

  return (
    <div className="poi-detail-verification-page" data-testid="poi-detail-verification-page">
      <div className="verification-header">
        <h1>POI Detail Verification Page</h1>
        <p>RT-POI-D-001 - POI Detail Runtime Alignment Verification</p>
      </div>

      <div className="verification-controls">
        <div className="control-group">
          <label>Activity:</label>
          <select 
            value={selectedActivity} 
            onChange={(e) => setSelectedActivity(e.target.value)}
            data-testid="activity-selector"
          >
            {Object.entries(activities).map(([id, activity]) => (
              <option key={id} value={id}>{activity.name}</option>
            ))}
          </select>
        </div>

        <div className="control-group">
          <label>Pillar:</label>
          <select 
            value={pillar} 
            onChange={(e) => setPillar(e.target.value as 'wilderness' | 'empire')}
            data-testid="pillar-selector"
          >
            <option value="wilderness">Wilderness</option>
            <option value="empire">Empire</option>
          </select>
        </div>

        <div className="control-group">
          <label>Detail Panel:</label>
          <button 
            onClick={() => setDetailOpen(!detailOpen)}
            data-testid="detail-toggle"
            className="toggle-button"
          >
            {detailOpen ? 'Close' : 'Open'} Detail
          </button>
        </div>
      </div>

      <div className="verification-content">
        <div className="verification-info">
          <h2>Verification Checklist</h2>
          <ul>
            <li>Panel opens and displays POI information correctly</li>
            <li>Skin configuration applies properly ({pillar} pillar)</li>
            <li>Slot management works with all states</li>
            <li>Telemetry events are emitted</li>
            <li>Style Lab tokens are respected</li>
            <li>Integration with ActivityCapsuleDetailSkinAware</li>
            <li>Time layer usage (gameplay layer)</li>
            <li>Accessibility compliance</li>
          </ul>
        </div>

        <div className="verification-component">
          <h2>PoiDetailSkinWrapper Test</h2>
          <PoiDetailSkinWrapper
            activityId={selectedActivity}
            name={currentActivity.name}
            type={currentActivity.type}
            subtitle={currentActivity.subtitle}
            status={currentActivity.status}
            progress={currentActivity.progress}
            duration={currentActivity.duration}
            elapsed={currentActivity.elapsed}
            slots={mockSlots}
            maxSlots={3}
            durationDisplay={currentActivity.durationDisplay}
            rewardDisplay={currentActivity.rewardDisplay}
            etaDisplay={currentActivity.etaDisplay}
            telemetry={mockTelemetry}
            onStart={handleStart}
            onCancel={handleCancel}
            onCollect={handleCollect}
            onSlotAssign={handleSlotAssign}
            onSlotDetach={handleSlotDetach}
            isOpen={detailOpen}
            onClose={handleClose}
            enableDrag={true}
            showTelemetry={true}
            showSlots={true}
            showInfo={true}
            compact={false}
            inlineMode={false}
            ariaLabel={`POI Detail: ${currentActivity.name}`}
            ariaLive="polite"
            enableDevTools={true}
            dataTestId="poi-detail-wrapper-test"
            skinOverrideId={pillar === 'wilderness' ? 'poi_wilderness_amber' : undefined}
          />
        </div>
      </div>

      <style>{`
        .poi-detail-verification-page {
          padding: 2rem;
          max-width: 1200px;
          margin: 0 auto;
          font-family: 'EB Garamond', serif;
          color: #f5f5f4;
        }

        .verification-header {
          margin-bottom: 2rem;
          padding-bottom: 1rem;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .verification-header h1 {
          font-size: 2rem;
          font-weight: 700;
          color: #ffd84a;
          margin: 0 0 0.5rem 0;
        }

        .verification-header p {
          color: rgba(255, 255, 255, 0.6);
          margin: 0;
        }

        .verification-controls {
          display: flex;
          gap: 2rem;
          margin-bottom: 2rem;
          padding: 1rem;
          background: rgba(14, 20, 26, 0.5);
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .control-group {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .control-group label {
          font-size: 0.875rem;
          color: rgba(255, 255, 255, 0.7);
          text-transform: uppercase;
          letter-spacing: 0.1em;
        }

        .control-group select,
        .control-group button {
          padding: 0.5rem 1rem;
          background: rgba(30, 41, 59, 0.8);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 6px;
          color: #f5f5f4;
          font-family: inherit;
          cursor: pointer;
        }

        .control-group button:hover {
          background: rgba(30, 41, 59, 1);
          border-color: #8db3a5;
        }

        .verification-content {
          display: grid;
          grid-template-columns: 1fr 2fr;
          gap: 2rem;
        }

        .verification-info {
          padding: 1rem;
          background: rgba(14, 20, 26, 0.3);
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.05);
        }

        .verification-info h2 {
          font-size: 1.25rem;
          color: #ffd84a;
          margin: 0 0 1rem 0;
        }

        .verification-info ul {
          margin: 0;
          padding-left: 1.5rem;
        }

        .verification-info li {
          margin-bottom: 0.5rem;
          color: rgba(255, 255, 255, 0.8);
        }

        .verification-component {
          padding: 1rem;
          background: rgba(14, 20, 26, 0.2);
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.05);
        }

        .verification-component h2 {
          font-size: 1.25rem;
          color: #ffd84a;
          margin: 0 0 1rem 0;
        }

        @media (max-width: 768px) {
          .verification-content {
            grid-template-columns: 1fr;
          }
          
          .verification-controls {
            flex-direction: column;
            gap: 1rem;
          }
        }
      `}</style>
    </div>
  );
}

export default PoiDetailVerificationPage;
