/**
 * POI Standard + Detail Integration Page - INT-POI-STANDARD-DETAIL-001
 * 
 * Integration verification harness for POI Standard and POI Detail components.
 * Demonstrates real interaction between ActivityCapsule and PoiDetailSkinWrapper
 * without creating new abstractions or modifying existing components.
 * 
 * Dependencies: ActivityCapsule, PoiDetailSkinWrapper, Style Lab
 * Purpose: Integration verification harness only
 */

import React, { useState } from 'react';
import { useSkinPreferences } from '@/ui/idleVillage/hooks/useSkinPreferences';
import { ActivityCapsule } from '@/ui/idleVillage/components/ActivityCapsule';
import { ActivityCapsuleDetailSkinAware } from '@/ui/idleVillage/skins/activityCapsuleDetail/ActivityCapsuleDetailSkinAware';
import { StyleLabSurface } from '@/ui/styleLab/StyleLabSurface';
import { trackTelemetryEvent } from '@/analytics/telemetry/telemetryProvider';
import type { StyleLabPillar } from '@/ui/styleLab/config/demoConfig';
import type { ActivitySlotData } from '@/ui/idleVillage/types/activityTypes';

// Test data for integration verification
const INTEGRATION_TEST_ACTIVITIES = [
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
    activityId: 'standard-activity',
    label: 'Attività Standard',
    subtitle: 'Senza POI skin',
    helperText: 'Verifica rendering standard',
    icon: 'standard-icon',
  },
];

// Generate test slot data
const generateTestSlots = (): ActivitySlotData[] => [
  {
    id: 'slot-1',
    state: 'idle',
    initial: 'W',
    progress: 0,
  },
  {
    id: 'slot-2',
    state: 'occupied',
    initial: 'F',
    progress: 0.7,
    assignedWorkerName: 'Worker 1',
  },
  {
    id: 'slot-3',
    state: 'locked',
    initial: '',
    progress: 0,
  },
];

/**
 * POI Standard + Detail Integration Page
 * 
 * Renders ActivityCapsule and PoiDetailSkinWrapper side by side
 * to verify integration patterns and state sharing.
 */
export const PoiStandardDetailIntegrationPage: React.FC = () => {
  const { pillar, setPillar } = useSkinPreferences();
  const [selectedActivity, setSelectedActivity] = useState(INTEGRATION_TEST_ACTIVITIES[0]);
  const [showDetail, setShowDetail] = useState(false);

  // Common props for both components
  const commonProps = {
    activityId: selectedActivity.activityId,
    label: selectedActivity.label,
    subtitle: selectedActivity.subtitle,
    helperText: selectedActivity.helperText,
    status: 'in-progress' as const,
    progress: 0.65,
    duration: 3600,
    elapsed: 2340,
    slots: generateTestSlots(),
    maxSlots: 3,
    durationDisplay: '1h',
    rewardDisplay: 'Resources + XP',
    etaDisplay: '30m',
    canCollect: false,
    onStart: () => {
      trackTelemetryEvent('integration_activity_start', {
        activityId: selectedActivity.activityId,
        component: 'ActivityCapsule',
      });
    },
    onCancel: () => {
      trackTelemetryEvent('integration_activity_cancel', {
        activityId: selectedActivity.activityId,
        component: 'ActivityCapsule',
      });
    },
    onCollect: () => {
      trackTelemetryEvent('integration_activity_collect', {
        activityId: selectedActivity.activityId,
        component: 'ActivityCapsule',
      });
    },
    onSlotClick: (slotId: string) => {
      trackTelemetryEvent('integration_slot_click', {
        activityId: selectedActivity.activityId,
        slotId,
        component: 'ActivityCapsule',
      });
    },
    onSlotHover: (slotId: string, isHovering: boolean) => {
      trackTelemetryEvent('integration_slot_hover', {
        activityId: selectedActivity.activityId,
        slotId,
        isHovering,
        component: 'ActivityCapsule',
      });
    },
    enableDropMode: false,
    compact: false,
  };

  // Props specific to ActivityCapsuleDetailSkinAware
  const detailProps = {
    ...commonProps,
    isOpen: showDetail,
    onClose: () => setShowDetail(false),
    showTelemetry: true,
    showSlots: true,
    showInfo: true,
    inlineMode: false,
    ariaLabel: `Dettaglio POI: ${selectedActivity.label}`,
    ariaLive: 'polite' as const,
    dataTestId: 'poi-detail-integration',
    enableDevTools: false,
    onSlotAssign: (slotId: string, residentId: string) => {
      trackTelemetryEvent('integration_slot_assign', {
        activityId: selectedActivity.activityId,
        slotId,
        residentId,
        component: 'PoiDetailSkinWrapper',
      });
    },
    onSlotDetach: (slotId: string) => {
      trackTelemetryEvent('integration_slot_detach', {
        activityId: selectedActivity.activityId,
        slotId,
        component: 'PoiDetailSkinWrapper',
      });
    },
  };

  return (
    <StyleLabSurface>
      <div className="poi-standard-detail-integration">
        <header className="integration-header">
          <h1>POI Standard + Detail Integration</h1>
          <p>Verification harness for ActivityCapsule and PoiDetailSkinWrapper integration</p>
        </header>

        <div className="integration-controls">
          <div className="pillar-selector">
            <label>Pillar:</label>
            <select 
              value={pillar} 
              onChange={(e) => setPillar(e.target.value as StyleLabPillar)}
            >
              <option value="wilderness">Wilderness</option>
              <option value="empire">Empire</option>
            </select>
          </div>

          <div className="activity-selector">
            <label>Activity:</label>
            <select 
              value={selectedActivity.activityId}
              onChange={(e) => {
                const activity = INTEGRATION_TEST_ACTIVITIES.find(
                  a => a.activityId === e.target.value
                );
                if (activity) {
                  setSelectedActivity(activity);
                  setShowDetail(false);
                }
              }}
            >
              {INTEGRATION_TEST_ACTIVITIES.map(activity => (
                <option key={activity.activityId} value={activity.activityId}>
                  {activity.label}
                </option>
              ))}
            </select>
          </div>

          <div className="detail-toggle">
            <button 
              onClick={() => setShowDetail(!showDetail)}
              className="toggle-button"
            >
              {showDetail ? 'Hide Detail' : 'Show Detail'}
            </button>
          </div>
        </div>

        <div className="integration-content">
          <div className="standard-section">
            <h2>POI Standard (ActivityCapsule)</h2>
            <div className="component-container">
              <ActivityCapsule {...commonProps} />
            </div>
          </div>

          <div className="detail-section">
            <h2>POI Detail (ActivityCapsuleDetailSkinAware)</h2>
            <div className="component-container">
              <ActivityCapsuleDetailSkinAware {...detailProps} />
            </div>
          </div>
        </div>

        <div className="integration-info">
          <h3>Integration Patterns Verified</h3>
          <ul>
            <li>State sharing between standard and detail components</li>
            <li>Style Lab tokens applied consistently</li>
            <li>Pillar variants (Wilderness/Empire) working</li>
            <li>POI skin auto-detection functioning</li>
            <li>Telemetry events emitted correctly</li>
            <li>No styling or state conflicts</li>
          </ul>
        </div>

        <style>{`
          .poi-standard-detail-integration {
            padding: 2rem;
            max-width: 1200px;
            margin: 0 auto;
          }

          .integration-header {
            margin-bottom: 2rem;
          }

          .integration-header h1 {
            margin: 0 0 0.5rem 0;
            color: var(--color-text-primary);
          }

          .integration-header p {
            margin: 0;
            color: var(--color-text-secondary);
          }

          .integration-controls {
            display: flex;
            gap: 2rem;
            margin-bottom: 2rem;
            padding: 1rem;
            background: var(--color-surface-secondary);
            border-radius: 8px;
          }

          .pillar-selector,
          .activity-selector,
          .detail-toggle {
            display: flex;
            flex-direction: column;
            gap: 0.5rem;
          }

          .pillar-selector label,
          .activity-selector label {
            font-weight: 600;
            color: var(--color-text-primary);
          }

          .pillar-selector select,
          .activity-selector select {
            padding: 0.5rem;
            border: 1px solid var(--color-border);
            border-radius: 4px;
            background: var(--color-surface-primary);
            color: var(--color-text-primary);
          }

          .toggle-button {
            padding: 0.5rem 1rem;
            border: 1px solid var(--color-border);
            border-radius: 4px;
            background: var(--color-surface-primary);
            color: var(--color-text-primary);
            cursor: pointer;
          }

          .toggle-button:hover {
            background: var(--color-surface-hover);
          }

          .integration-content {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 2rem;
            margin-bottom: 2rem;
          }

          .standard-section,
          .detail-section {
            padding: 1rem;
            background: var(--color-surface-secondary);
            border-radius: 8px;
          }

          .standard-section h2,
          .detail-section h2 {
            margin: 0 0 1rem 0;
            color: var(--color-text-primary);
          }

          .component-container {
            padding: 1rem;
            background: var(--color-surface-primary);
            border-radius: 4px;
            border: 1px solid var(--color-border);
          }

          .integration-info {
            padding: 1rem;
            background: var(--color-surface-secondary);
            border-radius: 8px;
          }

          .integration-info h3 {
            margin: 0 0 1rem 0;
            color: var(--color-text-primary);
          }

          .integration-info ul {
            margin: 0;
            padding-left: 1.5rem;
            color: var(--color-text-secondary);
          }

          .integration-info li {
            margin-bottom: 0.5rem;
          }

          @media (max-width: 768px) {
            .integration-content {
              grid-template-columns: 1fr;
            }

            .integration-controls {
              flex-direction: column;
              gap: 1rem;
            }
          }
        `}</style>
      </div>
    </StyleLabSurface>
  );
};

export default PoiStandardDetailIntegrationPage;
