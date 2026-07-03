/**
 * RT-POI-D-001 Verification Page
 * 
 * Dedicated POI Detail verification page that demonstrates PoiDetailSkinWrapper
 * integration with ActivityCapsuleDetailSkinAware and validates compliance
 * with POI Detail trusted contract.
 */

import React, { useState, useCallback, useMemo } from 'react';
import { ActivityCapsuleDetailSkinAware } from '../skins/activityCapsuleDetail/ActivityCapsuleDetailSkinAware';
import { GenericPoiSkin } from '../components/minimal/GenericPoiSkin';
import { trackTelemetryEvent } from '@/analytics/telemetry/telemetryProvider';
import { DEFAULT_IDLE_VILLAGE_CONFIG } from '@/balancing/config/idleVillage/defaultConfig';
import type { ActivityDetailSlotData, TelemetryEntry } from '../skins/activityCapsuleDetail/ActivityCapsuleDetailSkinAware';
import { TooltipProvider } from '@radix-ui/react-tooltip';

// Use existing quest from config
const questConfig = DEFAULT_IDLE_VILLAGE_CONFIG.activities.quest_dangerous_hunt;
const questDurationSeconds = parseInt(questConfig.durationFormula, 10);
const questProgress = 0.65;
const questElapsedSeconds = Math.floor(questDurationSeconds * questProgress);
const questRemainingSeconds = questDurationSeconds - questElapsedSeconds;

// Color mapping from poiAmberSkinConfig for wilderness pillar
const WILDERNESS_COLORS = {
  coronaCore: { r: 210, g: 138, b: 28 },
  coronaGlow: { r: 180, g: 105, b: 10 },
  rimColors: ['#fce890', '#c09030', '#200e02'] as [string, string, string],
  stoneColors: ['#1e1608', '#030202'] as [string, string],
  stoneAmbient: 'rgba(255,220,120,.22)',
  pinColor: 'rgba(205,190,148,.72)',
};

// Mock data for verification
const mockSlots: ActivityDetailSlotData[] = [
  {
    id: 'slot-1',
    state: 'empty',
    initial: '',
    progress: 0,
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
  const [detailOpen, setDetailOpen] = useState(true);

  const handleClose = useCallback(() => {
    setDetailOpen(false);
  }, []);

  const handlePoiClick = useCallback(() => {
    setDetailOpen(true);
  }, []);

  return (
    <TooltipProvider>
      <div className="poi-detail-verification-page" data-testid="poi-detail-verification-page">
        <div className="poi-trigger-container" onClick={handlePoiClick}>
          <GenericPoiSkin
            icon="🏹"
            progress={0.65}
            coronaCore={WILDERNESS_COLORS.coronaCore}
            coronaGlow={WILDERNESS_COLORS.coronaGlow}
            rimColors={WILDERNESS_COLORS.rimColors}
            stoneColors={WILDERNESS_COLORS.stoneColors}
            stoneAmbient={WILDERNESS_COLORS.stoneAmbient}
            pinColor={WILDERNESS_COLORS.pinColor}
            pillar="wilderness"
            size={160}
            enableHover={true}
          />
        </div>

        <ActivityCapsuleDetailSkinAware
        activityId={questConfig.id}
        name={questConfig.label}
        type="quest"
        subtitle={questConfig.description}
        status="in-progress"
        progress={questProgress}
        duration={questDurationSeconds}
        elapsed={questElapsedSeconds}
        slots={mockSlots}
        maxSlots={questConfig.maxSlots === 'infinite' ? 99 : questConfig.maxSlots}
        durationDisplay={`${questDurationSeconds}s`}
        rewardDisplay={questConfig.rewards.map(r => `${r.resourceId}: +${r.amountFormula}`).join(', ')}
        etaDisplay={`${questRemainingSeconds}s`}
        telemetry={mockTelemetry}
        isOpen={detailOpen}
        onClose={handleClose}
        enableDrag={true}
        showTelemetry={true}
        showSlots={true}
        showInfo={true}
        compact={false}
        inlineMode={false}
        ariaLabel={`POI Detail: ${questConfig.label}`}
        ariaLive="polite"
        enableDevTools={true}
        dataTestId="poi-detail-wrapper-test"
        skinOverrideId="poi_wilderness_amber"
      />

      <style>{`
        .poi-detail-verification-page {
          padding: 2rem;
          max-width: 1200px;
          margin: 0 auto;
          font-family: 'EB Garamond', serif;
          color: #f5f5f4;
        }
        .poi-trigger-container {
          display: flex;
          justify-content: center;
          align-items: center;
          margin-bottom: 2rem;
          cursor: pointer;
          transition: transform 0.2s ease;
        }
        .poi-trigger-container:hover {
          transform: scale(1.05);
        }
      `}</style>
      </div>
    </TooltipProvider>
  );
};

export default PoiDetailVerificationPage;
