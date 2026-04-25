// Idle Village Files Archive
// Generated: 2025-06-17
// Contains exact source code for requested Idle Village files

// =============================================================================
// FILE: src/ui/idleVillage/MinimalGameplayPage.tsx
// =============================================================================
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { DndContext, type DragEndEvent, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { restrictToWindow } from '@dnd-kit/modifiers';
import { trackTelemetryEvent, traceMinimalGameplay } from '@/analytics/telemetry/telemetryProvider';
import { useMinimalGameplayWithIdleVillageConfig } from '@/store/useMinimalGameplay';
import { useResidentDropValidation } from '@/ui/idleVillage/hooks/useResidentDropValidation';
import { selectResidentRosterStatesForLab } from '@/store/useMinimalGameplay';
import type { TimeEngineResidentState } from '@/engine/game/idleVillage/TimeEngine';
import { StyleLaboratoryPanel } from '@/ui/styleLab/StyleLaboratoryPanel';
import { ResourcePanel } from '@/ui/idleVillage/components/ResourcePanel';
import { ClockWidget } from '@/ui/idleVillage/components/ClockWidget';
import { ActionToolbar } from '@/ui/idleVillage/components/ActionToolbar';
import { VillageRosterSection } from '@/ui/idleVillage/components/VillageRosterSection';
import { MapMiniCard } from '@/ui/idleVillage/components/MapMiniCard';
import { PoiDetailSkinWrapper } from '@/ui/idleVillage/components/PoiDetailSkinWrapper';
import type { VerbDetailPreview } from '@/ui/idleVillage/types/VerbDetailPreview';
import { useThemeSwitcher } from '@/hooks/useThemeSwitcher';
import { useAITutor } from '@/ui/idleVillage/hooks/useAITutor';
import { useActivityScheduler } from '@/ui/idleVillage/hooks/useActivityScheduler';
import { mapActivityToVerbDetailPreview } from '@/ui/idleVillage/utils/activityPreviewMapper';
import { useStyleLabTokens } from '@/ui/styleLab/useStyleLabTokens';
import { useMinimalHUD } from '@/ui/idleVillage/hooks/useMinimalHUD';
import type { GameIntent } from '@/ui/idleVillage/intent/GameIntent';
import { IntentBridge } from '@/ui/idleVillage/intent/GameIntent';

/**
 * Main gameplay page for Idle Village Phase E vertical slice.
 * Integrates drag-and-drop, activity scheduling, and real-time updates.
 */
export const MinimalGameplayPage: React.FC = () => {
  const { activePreset } = useThemeSwitcher();
  const styleTokens = useStyleLabTokens();
  const [selectedActivityId, setSelectedActivityId] = useState<string | null>(null);
  const [hoveredResidentId, setHoveredResidentId] = useState<string | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  // Core gameplay state
  const gameplayState = useMinimalGameplayWithIdleVillageConfig();
  const scheduler = useActivityScheduler();
  const { hudData } = useMinimalHUD();

  // AI Tutor integration
  const aiTutor = useAITutor({
    defaultEnabled: false,
    tutorConfig: {
      detailLevel: 'intermediate',
      enableLearningMode: false,
    },
  });

  // Drop validation
  const dropValidator = useResidentDropValidation({
    enableTelemetry: true,
    tutorConfig: {
      enabled: aiTutor.isEnabled,
      detailLevel: 'intermediate',
      showLearningTips: false,
    },
  });

  // Memoized roster state for performance
  const residentRoster = useMemo(() => {
    return selectResidentRosterStatesForLab(gameplayState.state, gameplayState.config);
  }, [gameplayState.state, gameplayState.config]);

  // Create residents map for efficient lookups
  const residentsMap = useMemo(() => {
    return residentRoster.reduce((map, resident) => {
      map[resident.id] = resident;
      return map;
    }, {} as Record<string, TimeEngineResidentState>);
  }, [residentRoster]);

  // Get activity definition for selected activity
  const selectedActivity = useMemo(() => {
    if (!selectedActivityId) return null;
    return gameplayState.config.activities.find(a => a.id === selectedActivityId) || null;
  }, [selectedActivityId, gameplayState.config.activities]);

  // Generate verb detail preview for selected activity
  const verbDetailPreview = useMemo((): VerbDetailPreview | null => {
    if (!selectedActivity) return null;
    return mapActivityToVerbDetailPreview(selectedActivity, residentsMap, scheduler);
  }, [selectedActivity, residentsMap, scheduler]);

  // Handle drag end event
  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || !active) {
      return;
    }

    const residentId = active.id as string;
    const activityId = over.id as string;

    // Validate the drop
    const resident = residentsMap[residentId];
    const activity = gameplayState.config.activities.find(a => a.id === activityId);

    if (!resident || !activity) {
      console.warn('[MinimalGameplayPage] Invalid drag-drop: resident or activity not found', {
        residentId,
        activityId,
      });
      return;
    }

    const validationResult = dropValidator.validateDrop({
      resident,
      activity,
      context: 'drag_drop_assignment',
    });

    if (!validationResult.isValid) {
      traceMinimalGameplay('drop_validation_failed', {
        residentId,
        activityId,
        failedRule: validationResult.failedRule,
        message: validationResult.message,
      });
      return;
    }

    // Start the activity
    gameplayState.startActivity(residentId, activityId);

    // Track telemetry
    trackTelemetryEvent('activity_assigned_via_drag_drop', {
      residentId,
      activityId,
      activityType: activity.tags[0] || 'unknown',
      residentStatus: resident.status,
    });

    // Update AI Tutor context
    if (aiTutor.isEnabled) {
      aiTutor.updateContext({
        lastAssignment: { residentId, activityId },
        residentStates: residentsMap,
        availableActivities: gameplayState.config.activities,
      });
    }
  }, [residentsMap, gameplayState.config.activities, dropValidator, gameplayState.startActivity, aiTutor]);

  // Handle activity selection
  const handleActivitySelect = useCallback((activityId: string) => {
    setSelectedActivityId(activityId);
    
    // Track telemetry
    const activity = gameplayState.config.activities.find(a => a.id === activityId);
    if (activity) {
      trackTelemetryEvent('activity_selected', {
        activityId,
        activityType: activity.tags[0] || 'unknown',
        dangerRating: activity.dangerRating || 0,
      });
    }
  }, [gameplayState.config.activities]);

  // Handle activity detail close
  const handleActivityDetailClose = useCallback(() => {
    setSelectedActivityId(null);
    
    // Track telemetry
    if (selectedActivityId) {
      trackTelemetryEvent('activity_detail_closed', {
        activityId: selectedActivityId,
      });
    }
  }, [selectedActivityId]);

  // Handle resident hover
  const handleResidentHover = useCallback((residentId: string | null) => {
    setHoveredResidentId(residentId);
  }, []);

  // Handle game control actions
  const handlePauseResume = useCallback(() => {
    if (gameplayState.state.isPaused) {
      gameplayState.resumeGame('user');
    } else {
      gameplayState.pauseGame('user');
    }
  }, [gameplayState.state.isPaused, gameplayState.resumeGame, gameplayState.pauseGame]);

  const handleSpeedChange = useCallback((multiplier: number) => {
    gameplayState.setSpeedMultiplier(multiplier);
  }, [gameplayState.setSpeedMultiplier]);

  const handleReset = useCallback(() => {
    gameplayState.resetGame();
  }, [gameplayState.resetGame]);

  // Handle resource actions
  const handleBuyFood = useCallback((quantity: number) => {
    const result = gameplayState.buyFood(quantity);
    if (!result.success) {
      traceMinimalGameplay('buy_food_failed', {
        quantity,
        reason: result.reason,
        message: result.message,
      });
    }
  }, [gameplayState.buyFood]);

  // Register intent handler
  useEffect(() => {
    const unregister = IntentBridge.registerStoreHandler((intent: GameIntent) => {
      console.log('[MinimalGameplayPage] Received intent:', intent);
      
      switch (intent.type) {
        case 'SHOW_ACTIVITY_DETAIL':
          setSelectedActivityId(intent.payload.activityId);
          break;
        case 'HIDE_ACTIVITY_DETAIL':
          setSelectedActivityId(null);
          break;
        case 'PAUSE_GAME':
          gameplayState.pauseGame('intent');
          break;
        case 'RESUME_GAME':
          gameplayState.resumeGame('intent');
          break;
        case 'SET_SPEED':
          gameplayState.setSpeedMultiplier(intent.payload.multiplier);
          break;
        default:
          console.warn('[MinimalGameplayPage] Unknown intent type:', intent.type);
      }
    });

    return unregister;
  }, [gameplayState.pauseGame, gameplayState.resumeGame, gameplayState.setSpeedMultiplier]);

  // Auto-pause on page visibility change
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && !gameplayState.state.isPaused) {
        gameplayState.pauseGame('visibility_hidden');
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [gameplayState.state.isPaused, gameplayState.pauseGame]);

  // Page background style
  const pageStyle = useMemo(() => {
    const tokens = activePreset.tokens;
    return {
      background: tokens['page-background'] || 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
      minHeight: '100vh',
      position: 'relative' as const,
      overflow: 'hidden',
    };
  }, [activePreset]);

  return (
    <div style={pageStyle}>
      <DndContext
        sensors={sensors}
        onDragEnd={handleDragEnd}
        modifiers={[restrictToWindow]}
      >
        <div className="flex flex-col h-screen">
          {/* Header with resources and controls */}
          <header className="flex items-center justify-between p-4 border-b border-white/10">
            <div className="flex items-center gap-4">
              <ResourcePanel
                resources={gameplayState.state}
                config={gameplayState.config.globalRules}
                onBuyFood={handleBuyFood}
              />
              <ClockWidget
                currentTime={gameplayState.state.currentTime}
                currentDay={gameplayState.state.currentDay}
                isDayPhase={gameplayState.state.isDayPhase}
                cycleProgress={gameplayState.state.cycleProgress}
                config={gameplayState.config.globalRules}
              />
            </div>
            
            <ActionToolbar
              isPaused={gameplayState.state.isPaused}
              speedMultiplier={gameplayState.state.speedMultiplier}
              onPauseResume={handlePauseResume}
              onSpeedChange={handleSpeedChange}
              onReset={handleReset}
              daysRemaining={gameplayState.daysRemaining()}
              gameOver={gameplayState.gameOver()}
              gameOverState={gameplayState.gameOverState}
            />
          </header>

          {/* Main gameplay area */}
          <main className="flex-1 flex p-4 gap-4 overflow-hidden">
            {/* Village roster */}
            <section className="w-80 flex-shrink-0">
              <VillageRosterSection
                residents={residentRoster}
                activeActivities={gameplayState.state.activeActivities}
                onResidentHover={handleResidentHover}
                selectedResidentId={hoveredResidentId}
                hudData={hudData}
              />
            </section>

            {/* Village map */}
            <section className="flex-1 relative">
              <div className="grid grid-cols-2 gap-4 h-full">
                {Object.entries(gameplayState.config.mapSlots).map(([slotId, mapSlot]) => {
                  const activitiesInSlot = gameplayState.config.activities.filter(
                    activity => activity.slotTags?.some(tag => mapSlot.slotTags.includes(tag))
                  );
                  
                  return (
                    <MapMiniCard
                      key={slotId}
                      mapSlot={mapSlot}
                      activities={activitiesInSlot}
                      onSelectActivity={handleActivitySelect}
                      selectedActivityId={selectedActivityId}
                      residents={residentsMap}
                      scheduler={scheduler}
                      hoveredResidentId={hoveredResidentId}
                    />
                  );
                })}
              </div>
            </section>
          </main>

          {/* Activity detail modal */}
          {selectedActivity && verbDetailPreview && (
            <PoiDetailSkinWrapper
              activity={selectedActivity}
              preview={verbDetailPreview}
              onClose={handleActivityDetailClose}
              residents={residentsMap}
              scheduler={scheduler}
              hoveredResidentId={hoveredResidentId}
              onResidentHover={handleResidentHover}
            />
          )}

          {/* AI Tutor Panel */}
          {aiTutor.isEnabled && (
            <div className="fixed bottom-4 right-4 w-80 h-96 bg-black/80 border border-white/20 rounded-lg p-4">
              <h3 className="text-white font-semibold mb-2">AI Tutor</h3>
              <div className="text-white/80 text-sm">
                <p>AI Tutor is active and monitoring your gameplay.</p>
                <p className="mt-2">Last assignment: {aiTutor.context?.lastAssignment ? 
                  `${aiTutor.context.lastAssignment.residentId} -> ${aiTutor.context.lastAssignment.activityId}` : 
                  'None'}</p>
              </div>
              <button
                onClick={() => aiTutor.setEnabled(false)}
                className="mt-4 px-3 py-1 bg-red-500/20 border border-red-500/50 rounded text-red-300 text-sm hover:bg-red-500/30"
              >
                Disable Tutor
              </button>
            </div>
          )}

          {/* Style Laboratory Panel (development only) */}
          {process.env.NODE_ENV === 'development' && (
            <div className="fixed top-4 right-4">
              <StyleLaboratoryPanel />
            </div>
          )}
        </div>
      </DndContext>
    </div>
  );
};

export default MinimalGameplayPage;

// =============================================================================
// FILE: src/ui/idleVillage/components/MapMiniCard.tsx
// =============================================================================
import { useMemo, useCallback } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { motion } from 'framer-motion';
import { trackTelemetryEvent } from '@/analytics/telemetry/telemetryProvider';
import type { MapSlotDefinition } from '@/balancing/config/idleVillage/types';
import type { ActivityDefinition } from '@/balancing/config/idleVillage/types';
import type { TimeEngineResidentState } from '@/engine/game/idleVillage/TimeEngine';
import { useIdleVillageConfig } from '@/balancing/hooks/useIdleVillageConfig';
import { ActivityCapsule } from './ActivityCapsule';
import { ActivitySlotMiniCard } from './ActivitySlotMiniCard';
import { useStyleLabTokens } from '@/ui/styleLab/useStyleLabTokens';
import { useThemeSwitcher } from '@/hooks/useThemeSwitcher';

export interface MapMiniCardProps {
  /** Map slot definition */
  mapSlot: MapSlotDefinition;
  /** Activities that can appear in this slot */
  activities: ActivityDefinition[];
  /** Callback when an activity is selected */
  onSelectActivity: (activityId: string) => void;
  /** Currently selected activity ID */
  selectedActivityId?: string | null;
  /** Available residents for assignment */
  residents: Record<string, TimeEngineResidentState>;
  /** Activity scheduler instance */
  scheduler: any;
  /** Currently hovered resident ID */
  hoveredResidentId?: string | null;
}

/**
 * Mini card representing a map slot on the village map.
 * Shows activities available in the location and handles selection.
 */
export const MapMiniCard: React.FC<MapMiniCardProps> = ({
  mapSlot,
  activities,
  onSelectActivity,
  selectedActivityId,
  residents,
  scheduler,
  hoveredResidentId,
}) => {
  const { activePreset } = useThemeSwitcher();
  const styleTokens = useStyleLabTokens();
  const config = useIdleVillageConfig();

  // Filter activities that are actually available in this slot
  const availableActivities = useMemo(() => {
    return activities.filter(activity => 
      activity.slotTags?.some(tag => mapSlot.slotTags.includes(tag))
    );
  }, [activities, mapSlot.slotTags]);

  // Handle card click
  const handleCardClick = useCallback(() => {
    if (availableActivities.length === 1) {
      onSelectActivity(availableActivities[0].id);
    } else if (availableActivities.length > 1) {
      // If multiple activities, select the first one for now
      // In a full implementation, this would show a selection modal
      onSelectActivity(availableActivities[0].id);
    }
    
    // Track telemetry
    trackTelemetryEvent('map_slot_clicked', {
      slotId: mapSlot.id,
      activityCount: availableActivities.length,
      firstActivityId: availableActivities[0]?.id,
    });
  }, [availableActivities, mapSlot.id, onSelectActivity]);

  // Handle activity selection
  const handleActivitySelect = useCallback((activityId: string) => {
    onSelectActivity(activityId);
    
    // Track telemetry
    trackTelemetryEvent('activity_selected_from_map', {
      slotId: mapSlot.id,
      activityId,
    });
  }, [mapSlot.id, onSelectActivity]);

  // Card style based on theme
  const cardStyle = useMemo(() => {
    const tokens = activePreset.tokens;
    return {
      background: tokens['card-surface'] || 'rgba(15, 23, 42, 0.95)',
      borderColor: tokens['panel-border'] || 'rgba(255, 255, 255, 0.1)',
      boxShadow: `0 4px 6px ${tokens['card-shadow-color'] || 'rgba(0, 0, 0, 0.3)'}`,
    };
  }, [activePreset]);

  // Animation variants
  const cardVariants = {
    idle: { scale: 1, rotate: 0 },
    hover: { scale: 1.02, rotate: 0.5 },
    selected: { scale: 1.05, rotate: 1 },
  };

  const isSelected = selectedActivityId && availableActivities.some(a => a.id === selectedActivityId);

  return (
    <motion.div
      className="relative p-4 border rounded-lg cursor-pointer transition-all duration-200"
      style={cardStyle}
      variants={cardVariants}
      initial="idle"
      animate={isSelected ? "selected" : "idle"}
      whileHover="hover"
      onClick={handleCardClick}
      layoutId={`map-slot-${mapSlot.id}`}
    >
      {/* Slot header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{mapSlot.icon || '·'}</span>
          <div>
            <h3 className="font-semibold text-white">{mapSlot.label}</h3>
            <p className="text-xs text-white/60">{mapSlot.description}</p>
          </div>
        </div>
        
        {/* Status indicator */}
        <div className={`w-3 h-3 rounded-full ${
          mapSlot.isInitiallyUnlocked ? 'bg-green-500' : 'bg-gray-500'
        }`} />
      </div>

      {/* Activities list */}
      <div className="space-y-2">
        {availableActivities.length === 0 ? (
          <div className="text-center py-4 text-white/40">
            <p className="text-sm">No activities available</p>
          </div>
        ) : (
          availableActivities.map((activity) => (
            <div
              key={activity.id}
              className={`p-2 rounded border transition-all duration-200 ${
                selectedActivityId === activity.id
                  ? 'border-blue-400 bg-blue-500/10'
                  : 'border-white/20 hover:border-white/40 hover:bg-white/5'
              }`}
              onClick={(e) => {
                e.stopPropagation();
                handleActivitySelect(activity.id);
              }}
            >
              {/* Render activity capsule or mini card based on type */}
              {activity.cardKind === 'job' ? (
                <ActivityCapsule
                  activity={activity}
                  residents={residents}
                  scheduler={scheduler}
                  hoveredResidentId={hoveredResidentId}
                  compact={true}
                />
              ) : (
                <ActivitySlotMiniCard
                  activity={activity}
                  residents={residents}
                  scheduler={scheduler}
                  hoveredResidentId={hoveredResidentId}
                />
              )}
            </div>
          ))
        )}
      </div>

      {/* Selection indicator */}
      {isSelected && (
        <motion.div
          className="absolute inset-0 border-2 border-blue-400 rounded-lg pointer-events-none"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
        />
      )}
    </motion.div>
  );
};

export default MapMiniCard;

// =============================================================================
// FILE: src/ui/idleVillage/components/ActivityCapsule.tsx
// =============================================================================
import { useCallback, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Clock, Users, AlertTriangle, Play, Pause, Square } from 'lucide-react';
import type { ActivityDefinition } from '@/balancing/config/idleVillage/types';
import type { TimeEngineResidentState } from '@/engine/game/idleVillage/TimeEngine';
import { useResidentDropValidation } from '@/ui/idleVillage/hooks/useResidentDropValidation';
import { useStyleLabTokens } from '@/ui/styleLab/useStyleLabTokens';
import { useThemeSwitcher } from '@/hooks/useThemeSwitcher';
import { trackTelemetryEvent } from '@/analytics/telemetry/telemetryProvider';
import { ActivitySlot } from './ActivitySlot';
import { ProgressBar } from './ProgressBar';
import { RiskIndicator } from './RiskIndicator';

export interface ActivityCapsuleProps {
  /** Activity definition */
  activity: ActivityDefinition;
  /** Available residents */
  residents: Record<string, TimeEngineResidentState>;
  /** Activity scheduler */
  scheduler: any;
  /** Currently hovered resident ID */
  hoveredResidentId?: string | null;
  /** Compact mode for map display */
  compact?: boolean;
  /** On resident drop callback */
  onResidentDrop?: (slotId: string, residentId: string) => void;
  /** On resident detach callback */
  onResidentDetach?: (slotId: string, residentId: string) => void;
}

/**
 * Config-first capsule component for displaying activity information.
 * Integrates with Style Laboratory for theming and supports drag-and-drop.
 */
export const ActivityCapsule: React.FC<ActivityCapsuleProps> = ({
  activity,
  residents,
  scheduler,
  hoveredResidentId,
  compact = false,
  onResidentDrop,
  onResidentDetach,
}) => {
  const { activePreset } = useThemeSwitcher();
  const styleTokens = useStyleLabTokens();
  const [isExpanded, setIsExpanded] = useState(false);

  // Drop validation
  const dropValidator = useResidentDropValidation({
    enableTelemetry: true,
  });

  // Get activity state from scheduler
  const activityState = useMemo(() => {
    return scheduler.getActivityState?.(activity.id) || null;
  }, [scheduler, activity.id]);

  // Calculate assigned residents
  const assignedResidents = useMemo(() => {
    if (!activityState) return [];
    return Object.entries(activityState.assignments || {})
      .filter(([, residentId]) => residentId)
      .map(([slotId, residentId]) => ({
        slotId,
        residentId,
        resident: residents[residentId],
      }));
  }, [activityState, residents]);

  // Calculate progress
  const progress = useMemo(() => {
    if (!activityState) return 0;
    return activityState.progress || 0;
  }, [activityState]);

  // Calculate time remaining
  const timeRemaining = useMemo(() => {
    if (!activityState) return null;
    const remaining = (activityState.duration || 0) - (activityState.elapsed || 0);
    return Math.max(0, remaining);
  }, [activityState]);

  // Determine status
  const status = useMemo(() => {
    if (!activityState) return 'idle';
    if (activityState.isRunning) return 'running';
    if (activityState.isPaused) return 'paused';
    if (activityState.isCompleted) return 'completed';
    return 'idle';
  }, [activityState]);

  // Handle resident drop
  const handleResidentDrop = useCallback((slotId: string, residentId: string) => {
    const resident = residents[residentId];
    if (!resident) return;

    // Validate drop
    const validationResult = dropValidator.validateDrop({
      resident,
      activity,
      context: 'activity_capsule_drop',
    });

    if (!validationResult.isValid) {
      trackTelemetryEvent('activity_capsule_drop_invalid', {
        activityId: activity.id,
        residentId,
        reason: validationResult.failedRule,
        message: validationResult.message,
      });
      return;
    }

    // Call parent callback
    onResidentDrop?.(slotId, residentId);

    // Track telemetry
    trackTelemetryEvent('activity_capsule_drop_valid', {
      activityId: activity.id,
      residentId,
      slotId,
    });
  }, [residents, activity, dropValidator, onResidentDrop]);

  // Handle resident detach
  const handleResidentDetach = useCallback((slotId: string, residentId: string) => {
    onResidentDetach?.(slotId, residentId);

    // Track telemetry
    trackTelemetryEvent('activity_capsule_detach', {
      activityId: activity.id,
      residentId,
      slotId,
    });
  }, [activity.id, onResidentDetach]);

  // Handle start/pause/cancel
  const handleStart = useCallback(() => {
    if (status === 'idle') {
      scheduler.startActivity?.(activity.id);
      trackTelemetryEvent('activity_capsule_start', { activityId: activity.id });
    } else if (status === 'paused') {
      scheduler.resumeActivity?.(activity.id);
      trackTelemetryEvent('activity_capsule_resume', { activityId: activity.id });
    }
  }, [status, scheduler, activity.id]);

  const handlePause = useCallback(() => {
    if (status === 'running') {
      scheduler.pauseActivity?.(activity.id);
      trackTelemetryEvent('activity_capsule_pause', { activityId: activity.id });
    }
  }, [status, scheduler, activity.id]);

  const handleCancel = useCallback(() => {
    scheduler.cancelActivity?.(activity.id);
    trackTelemetryEvent('activity_capsule_cancel', { activityId: activity.id });
  }, [scheduler, activity.id]);

  // Capsule style
  const capsuleStyle = useMemo(() => {
    const tokens = activePreset.tokens;
    const baseStyle = {
      background: tokens['card-surface'] || 'rgba(15, 23, 42, 0.95)',
      borderColor: tokens['panel-border'] || 'rgba(255, 255, 255, 0.1)',
      boxShadow: `0 4px 6px ${tokens['card-shadow-color'] || 'rgba(0, 0, 0, 0.3)'}`,
    };

    // Add status-based styling
    if (status === 'running') {
      baseStyle.borderColor = tokens['success-border'] || 'rgba(34, 197, 94, 0.5)';
    } else if (status === 'paused') {
      baseStyle.borderColor = tokens['warning-border'] || 'rgba(251, 146, 60, 0.5)';
    } else if (status === 'completed') {
      baseStyle.borderColor = tokens['info-border'] || 'rgba(59, 130, 246, 0.5)';
    }

    return baseStyle;
  }, [activePreset, status]);

  // Animation variants
  const capsuleVariants = {
    idle: { scale: 1, y: 0 },
    hover: { scale: 1.02, y: -2 },
    running: { scale: 1.01, y: -1 },
  };

  if (compact) {
    // Compact version for map display
    return (
      <motion.div
        className="p-2 border rounded-lg"
        style={capsuleStyle}
        variants={capsuleVariants}
        initial="idle"
        animate={status === 'running' ? 'running' : 'idle'}
        whileHover="hover"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg">{activity.cardKind === 'quest' ? '!' : '·'}</span>
            <span className="text-sm font-medium text-white truncate">
              {activity.label}
            </span>
          </div>
          
          <div className="flex items-center gap-1">
            {assignedResidents.length > 0 && (
              <div className="flex items-center gap-1">
                <Users className="w-3 h-3 text-blue-400" />
                <span className="text-xs text-blue-400">{assignedResidents.length}</span>
              </div>
            )}
            
            {activity.dangerRating && activity.dangerRating > 0 && (
              <AlertTriangle className="w-3 h-3 text-orange-400" />
            )}
          </div>
        </div>

        {status === 'running' && (
          <div className="mt-2">
            <ProgressBar progress={progress} compact={true} />
          </div>
        )}
      </motion.div>
    );
  }

  // Full version for detail view
  return (
    <motion.div
      className="p-4 border rounded-lg"
      style={capsuleStyle}
      variants={capsuleVariants}
      initial="idle"
      animate={status === 'running' ? 'running' : 'idle'}
      whileHover="hover"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <span className="text-2xl">
            {activity.cardKind === 'quest' ? '!' : 
             activity.cardKind === 'training' ? '+':
             activity.cardKind === 'maintenance' ? ' wrench' : '·'}
          </span>
          <div>
            <h3 className="font-semibold text-white">{activity.label}</h3>
            <p className="text-sm text-white/60">{activity.description}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Status indicator */}
          <div className={`w-3 h-3 rounded-full ${
            status === 'running' ? 'bg-green-500' :
            status === 'paused' ? 'bg-yellow-500' :
            status === 'completed' ? 'bg-blue-500' : 'bg-gray-500'
          }`} />

          {/* Danger indicator */}
          {activity.dangerRating && activity.dangerRating > 0 && (
            <RiskIndicator rating={activity.dangerRating} />
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-blue-400" />
          <span className="text-sm text-white/80">
            {assignedResidents.length}/{activity.maxSlots === 'infinite' ? 'unlimited' : activity.maxSlots}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-green-400" />
          <span className="text-sm text-white/80">
            {timeRemaining !== null ? `${Math.ceil(timeRemaining)}s` : 'N/A'}
          </span>
        </div>
      </div>

      {/* Progress */}
      {status !== 'idle' && (
        <div className="mb-4">
          <ProgressBar progress={progress} />
          <div className="flex justify-between text-xs text-white/60 mt-1">
            <span>{Math.round(progress * 100)}%</span>
            <span>{status}</span>
          </div>
        </div>
      )}

      {/* Resident slots */}
      <div className="mb-4">
        <h4 className="text-sm font-medium text-white mb-2">Assigned Residents</h4>
        <div className="grid grid-cols-2 gap-2">
          {Array.from({ length: activity.maxSlots === 'infinite' ? assignedResidents.length : activity.maxSlots }).map((_, index) => {
            const assignment = assignedResidents.find(a => a.slotId === `${activity.id}-slot-${index}`);
            return (
              <ActivitySlot
                key={index}
                slotId={`${activity.id}-slot-${index}`}
                resident={assignment?.resident}
                activity={activity}
                onResidentDrop={handleResidentDrop}
                onResidentDetach={handleResidentDetach}
                hoveredResidentId={hoveredResidentId}
                disabled={status === 'running'}
              />
            );
          })}
        </div>
      </div>

      {/* Rewards */}
      {activity.rewards && activity.rewards.length > 0 && (
        <div className="mb-4">
          <h4 className="text-sm font-medium text-white mb-2">Rewards</h4>
          <div className="flex flex-wrap gap-2">
            {activity.rewards.map((reward, index) => (
              <div
                key={index}
                className="px-2 py-1 bg-white/10 rounded text-xs text-white/80"
              >
                {reward.resourceId}: {reward.amountFormula}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex gap-2">
        {status === 'idle' && (
          <button
            onClick={handleStart}
            className="flex items-center gap-2 px-3 py-1 bg-green-500/20 border border-green-500/50 rounded text-green-400 text-sm hover:bg-green-500/30"
          >
            <Play className="w-3 h-3" />
            Start
          </button>
        )}

        {status === 'running' && (
          <button
            onClick={handlePause}
            className="flex items-center gap-2 px-3 py-1 bg-yellow-500/20 border border-yellow-500/50 rounded text-yellow-400 text-sm hover:bg-yellow-500/30"
          >
            <Pause className="w-3 h-3" />
            Pause
          </button>
        )}

        {status === 'paused' && (
          <button
            onClick={handleStart}
            className="flex items-center gap-2 px-3 py-1 bg-green-500/20 border border-green-500/50 rounded text-green-400 text-sm hover:bg-green-500/30"
          >
            <Play className="w-3 h-3" />
            Resume
          </button>
        )}

        {(status === 'running' || status === 'paused') && (
          <button
            onClick={handleCancel}
            className="flex items-center gap-2 px-3 py-1 bg-red-500/20 border border-red-500/50 rounded text-red-400 text-sm hover:bg-red-500/30"
          >
            <Square className="w-3 h-3" />
            Cancel
          </button>
        )}
      </div>
    </motion.div>
  );
};

export default ActivityCapsule;

// =============================================================================
// FILE: src/ui/idleVillage/components/PoiDetailSkinWrapper.tsx
// =============================================================================
import { useCallback, useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import type { ActivityDefinition } from '@/balancing/config/idleVillage/types';
import type { TimeEngineResidentState } from '@/engine/game/idleVillage/TimeEngine';
import type { VerbDetailPreview } from '@/ui/idleVillage/types/VerbDetailPreview';
import { useThemeSwitcher } from '@/hooks/useThemeSwitcher';
import { useStyleLabTokens } from '@/ui/styleLab/useStyleLabTokens';
import { trackTelemetryEvent } from '@/analytics/telemetry/telemetryProvider';
import { ActivityCapsuleDetailSkinAware } from './ActivityCapsuleDetailSkinAware';
import { getTemporarySkinConfig } from '@/ui/styleLab/skinConfigLoader';

export interface PoiDetailSkinWrapperProps {
  /** Activity definition */
  activity: ActivityDefinition;
  /** Verb detail preview */
  preview: VerbDetailPreview;
  /** On close callback */
  onClose: () => void;
  /** Available residents */
  residents: Record<string, TimeEngineResidentState>;
  /** Activity scheduler */
  scheduler: any;
  /** Currently hovered resident ID */
  hoveredResidentId?: string | null;
  /** On resident hover callback */
  onResidentHover?: (residentId: string | null) => void;
}

/**
 * Wrapper component that applies skin configuration to POI detail views.
 * Integrates with Style Laboratory system for consistent theming.
 */
export const PoiDetailSkinWrapper: React.FC<PoiDetailSkinWrapperProps> = ({
  activity,
  preview,
  onClose,
  residents,
  scheduler,
  hoveredResidentId,
  onResidentHover,
}) => {
  const { activePreset } = useThemeSwitcher();
  const styleTokens = useStyleLabTokens();
  const [isOpen, setIsOpen] = useState(true);

  // Load skin configuration
  const skinConfig = useMemo(() => {
    return getTemporarySkinConfig(activity.cardKind || 'job');
  }, [activity.cardKind]);

  // Handle close
  const handleClose = useCallback(() => {
    setIsOpen(false);
    onClose();
    
    // Track telemetry
    trackTelemetryEvent('poi_detail_closed', {
      activityId: activity.id,
      activityType: activity.tags[0] || 'unknown',
    });
  }, [activity.id, activity.tags, onClose]);

  // Handle resident assignment
  const handleResidentAssign = useCallback((slotId: string, residentId: string) => {
    // Track telemetry
    trackTelemetryEvent('poi_detail_resident_assigned', {
      activityId: activity.id,
      slotId,
      residentId,
    });
  }, [activity.id]);

  // Handle resident removal
  const handleResidentRemove = useCallback((slotId: string, residentId: string) => {
    // Track telemetry
    trackTelemetryEvent('poi_detail_resident_removed', {
      activityId: activity.id,
      slotId,
      residentId,
    });
  }, [activity.id]);

  // Handle activity start
  const handleActivityStart = useCallback(() => {
    // Track telemetry
    trackTelemetryEvent('poi_detail_activity_started', {
      activityId: activity.id,
      activityType: activity.tags[0] || 'unknown',
    });
  }, [activity.id, activity.tags]);

  // Modal style
  const modalStyle = useMemo(() => {
    const tokens = activePreset.tokens;
    return {
      background: tokens['modal-background'] || 'rgba(15, 23, 42, 0.98)',
      borderColor: tokens['modal-border'] || 'rgba(255, 255, 255, 0.1)',
      boxShadow: `0 20px 25px -5px ${tokens['modal-shadow-color'] || 'rgba(0, 0, 0, 0.5)'}`,
    };
  }, [activePreset]);

  // Animation variants
  const modalVariants = {
    hidden: { opacity: 0, scale: 0.9, y: 20 },
    visible: { opacity: 1, scale: 1, y: 0 },
    exit: { opacity: 0, scale: 0.9, y: 20 },
  };

  // Track open telemetry
  useEffect(() => {
    trackTelemetryEvent('poi_detail_opened', {
      activityId: activity.id,
      activityType: activity.tags[0] || 'unknown',
      skinType: activity.cardKind || 'job',
    });
  }, [activity.id, activity.tags, activity.cardKind]);

  if (!isOpen) return null;

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Backdrop */}
      <motion.div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={handleClose}
      />

      {/* Modal */}
      <motion.div
        className="relative w-full max-w-2xl max-h-[90vh] overflow-hidden rounded-xl border"
        style={modalStyle}
        variants={modalVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <span className="text-2xl">
              {activity.cardKind === 'quest' ? '!' : 
               activity.cardKind === 'training' ? '+':
               activity.cardKind === 'maintenance' ? ' wrench' : '·'}
            </span>
            <div>
              <h2 className="text-lg font-semibold text-white">{activity.label}</h2>
              <p className="text-sm text-white/60">{activity.description}</p>
            </div>
          </div>

          <button
            onClick={handleClose}
            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
          >
            <X className="w-4 h-4 text-white" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto max-h-[calc(90vh-80px)]">
          <ActivityCapsuleDetailSkinAware
            activity={activity}
            preview={preview}
            residents={residents}
            scheduler={scheduler}
            hoveredResidentId={hoveredResidentId}
            onResidentHover={onResidentHover}
            onResidentAssign={handleResidentAssign}
            onResidentRemove={handleResidentRemove}
            onActivityStart={handleActivityStart}
            skinConfig={skinConfig}
          />
        </div>
      </motion.div>
    </motion.div>
  );
};

export default PoiDetailSkinWrapper;

// =============================================================================
// FILE: src/ui/idleVillage/components/ActivityCardDetail.tsx
// =============================================================================
import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { X, Play } from 'lucide-react';
import type { ActivityDefinition, ResourceDeltaDefinition } from '@/balancing/config/idleVillage/types';
import type { VerbDetailPreview } from '@/ui/idleVillage/types/VerbDetailPreview';
import { useThemeSwitcher } from '@/hooks/useThemeSwitcher';
import ResidentSlotRack, { type ResidentSlotRackProps } from '@/ui/idleVillage/components/ResidentSlotRack';
import type { ResidentSlotViewModel, SlotOverflowPolicy } from '@/ui/idleVillage/slots/types';
import { deriveTheaterRiskStripes } from '@/ui/idleVillage/theater/riskStripes';
import { StatModifierDisplay } from '@/ui/styleLab/components/StatModifierDisplay';
import { useModifierVisualization } from '@/ui/idleVillage/hooks/useModifierVisualization';
import { trackTelemetryEvent } from '@/analytics/telemetry/telemetryProvider';

export type MetricTone = 'neutral' | 'positive' | 'warning' | 'danger';

export interface ActivityCardMetric {
  /** Unique identifier for the metric row. */
  id: string;
  /** Display label. */
  label: string;
  /** Human readable value (already formatted). */
  value: string;
  /** Optional tone used to color the metric. */
  tone?: MetricTone;
  /** Optional helper copy under the value. */
  helperText?: string;
}

export interface ActivityCardDetailProps {
  activity: ActivityDefinition;
  slotLabel?: string;
  preview: VerbDetailPreview;
  slotViewModels: ResidentSlotViewModel[];
  rewards?: ResourceDeltaDefinition[];
  metrics?: ActivityCardMetric[];
  durationSeconds?: number;
  elapsedSeconds?: number;
  onStart?: () => void;
  onClose?: () => void;
  onDropResident?: (slotId: string, residentId: string | null) => void;
  onRemoveResident?: (slotId: string) => void;
  slotOverflowMode?: SlotOverflowPolicy;
  resolveSlotDisplayInfo?: ResidentSlotRackProps['resolveDisplayInfo'];
  isStartDisabled?: boolean;
  draggingResidentId?: string | null;
  onSlotClick?: (slotId: string) => void;
}

const clamp01 = (value: number): number => {
  if (!Number.isFinite(value)) return 0;
  if (value <= 0) return 0;
  if (value >= 1) return 1;
  return value;
};

const mapStatLabelToIcon = (label?: string | null): string => {
  if (!label) return ' ';
  const normalized = label.trim().toLowerCase();
  if (normalized.includes('hp') || normalized.includes('vita')) return ' ';
  if (normalized.includes('dmg') || normalized.includes('danno')) return ' ';
  if (normalized.includes('def')) return ' ';
  if (normalized.includes('agi') || normalized.includes('spd')) return ' ';
  if (normalized.includes('mag') || normalized.includes('mana')) return ' ';
  return label.trim().charAt(0) || ' ';
};

const DRAG_EXEMPT_TAGS = new Set(['BUTTON', 'A', 'INPUT', 'TEXTAREA', 'SELECT', 'LABEL']);

const isDragExemptTarget = (target: EventTarget | null): boolean => {
  if (!(target instanceof HTMLElement)) return false;
  if (DRAG_EXEMPT_TAGS.has(target.tagName)) return true;
  if (target.closest('[data-drag-exempt="true"]')) return true;
  return false;
};

const formatTime = (seconds?: number): string => {
  if (!Number.isFinite(seconds ?? NaN)) return '--';
  const clamped = Math.max(0, Math.round(seconds ?? 0));
  const mins = Math.floor(clamped / 60);
  const secs = clamped % 60;
  if (mins === 0) return `${secs}s`;
  return `${mins}m ${secs.toString().padStart(2, '0')}s`;
};

/**
 * Floating card detail inspired by the Style Laboratory moodboard.
 * Behaves come una carta sul tavolo: draggable, drop targets, metriche compatte.
 */
const ActivityCardDetail: React.FC<ActivityCardDetailProps> = ({
  activity,
  slotLabel,
  preview,
  slotViewModels,
  rewards = [],
  metrics = [],
  durationSeconds,
  elapsedSeconds = 0,
  onStart,
  onClose,
  onDropResident,
  onRemoveResident,
  slotOverflowMode,
  resolveSlotDisplayInfo,
  isStartDisabled = false,
  draggingResidentId,
  onSlotClick,
}) => {
  const { activePreset } = useThemeSwitcher();
  const [position, setPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragOriginRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const pointerOriginRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const riskMetrics = useMemo(
    () =>
      deriveTheaterRiskStripes({
        injuryPercentage: preview.injuryPercentage ?? 0,
        deathPercentage: preview.deathPercentage ?? 0,
      }),
    [preview.deathPercentage, preview.injuryPercentage],
  );
  const riskTooltip = `Injury ${riskMetrics.injuryPercent}% · Death ${riskMetrics.deathPercent}%`;
  const hasSlotOverflow = slotViewModels.length > 4;
  const resolvedSlotOverflow = slotOverflowMode ?? (hasSlotOverflow ? 'scroll' : 'wrap');
  const resolvedDurationSeconds =
    Number.isFinite(durationSeconds ?? NaN) && (durationSeconds ?? 0) > 0 ? (durationSeconds as number) : 0;
  const elapsed = Math.max(0, elapsedSeconds ?? 0);
  const progressRatio = resolvedDurationSeconds > 0 ? clamp01(elapsed / resolvedDurationSeconds) : 0;
  const remainingSeconds =
    resolvedDurationSeconds > 0 ? Math.max(0, resolvedDurationSeconds - elapsed) : undefined;
  const primarySlotId = slotViewModels[0]?.id ?? activity.id;
  const { entries: activityModifiers, isLoading: activityModifiersLoading } = useModifierVisualization('activitySlot', {
    entityId: primarySlotId,
    maxEntries: 4,
  });

  // Telemetry for capsule opened
  useEffect(() => {
    trackTelemetryEvent('activity_capsule_opened', {
      activityId: activity.id,
      slotId: primarySlotId,
      event: 'capsule_opened',
      timestamp: Date.now(),
    });
  }, [activity.id, primarySlotId]);

  const cardFrameStyle: CSSProperties = useMemo(() => {
    const tokens = activePreset.tokens;
    return {
      background: tokens['card-surface'] ?? 'var(--card-surface, rgba(5,7,12,0.95))',
      borderColor: tokens['panel-border'] ?? 'var(--panel-border, rgba(255,215,0,0.35))',
      boxShadow: `0 35px 75px ${tokens['card-shadow-color'] ?? 'rgba(0,0,0,0.65)'}`,
    };
  }, [activePreset]);

  const auraStyle: CSSProperties = useMemo(
    () => ({
      background: activePreset.tokens['card-surface-radial'] ?? 'var(--card-surface-radial, rgba(255,255,255,0.06))',
    }),
    [activePreset],
  );

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose?.();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  useEffect(() => {
    if (!isDragging) return;
    const handlePointerMove = (event: PointerEvent) => {
      const dx = event.clientX - pointerOriginRef.current.x;
      const dy = event.clientY - pointerOriginRef.current.y;
      setPosition({
        x: dragOriginRef.current.x + dx,
        y: dragOriginRef.current.y + dy,
      });
    };
    const handlePointerUp = () => {
      setIsDragging(false);
    };
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [isDragging]);

  const handlePointerDown = (event: React.PointerEvent<HTMLElement>) => {
    if (event.button !== 0) return;
    if (isDragExemptTarget(event.target)) return;
    // Avoid dragging when selecting text (modifier keys)
    if (event.metaKey || event.altKey || event.ctrlKey || event.shiftKey) return;
    event.preventDefault();
    pointerOriginRef.current = { x: event.clientX, y: event.clientY };
    dragOriginRef.current = { ...position };
    setIsDragging(true);
  };

  const handleRackDrop = useCallback<NonNullable<ResidentSlotRackProps['onSlotDrop']>>(
    (slotId: string, residentId: string | null) => {
      onDropResident?.(slotId, residentId ?? null);
    },
    [onDropResident],
  );

  const handleRackClear = useCallback<NonNullable<ResidentSlotRackProps['onSlotClear']>>(
    (slotId) => {
      onRemoveResident?.(slotId);
    },
    [onRemoveResident],
  );

  const meterToneClass = (tone?: MetricTone) => {
    switch (tone) {
      case 'positive':
        return 'text-emerald-300';
      case 'warning':
        return 'text-amber-300';
      case 'danger':
        return 'text-rose-300';
      default:
        return 'text-slate-200';
    }
  };

  const assignmentTitle = slotLabel ?? activity.label;

  const handleSlotClick = useCallback<NonNullable<ResidentSlotRackProps['onSlotClick']>>(
    (slotId) => {
      onSlotClick?.(slotId);
    },
    [onSlotClick],
  );

  const resolveDisplayInfo = useCallback<NonNullable<ResidentSlotRackProps['resolveDisplayInfo']>>(
    (slot) => {
      const statLabel = slot.statHint ?? slot.requirement?.label ?? 'Stat';
      return {
        icon: mapStatLabelToIcon(statLabel),
        label: slot.label,
      };
    },
    [],
  );

  const slotDisplayResolver = resolveSlotDisplayInfo ?? resolveDisplayInfo;

  return (
    <div className="relative pointer-events-auto w-full max-w-85 sm:max-w-85" style={{ transform: `translate(${position.x}px, ${position.y}px)` }}>
      <div className="absolute -inset-5 rounded-[28px] bg-black/30 blur-[28px]" aria-hidden />
      <article
        role="dialog"
        aria-label={`Scheda ${activity.label}`}
        className="relative overflow-hidden rounded-[20px] border px-3.5 py-3.5 backdrop-blur-lg text-[11px] leading-snug"
        style={cardFrameStyle}
        onPointerDown={handlePointerDown}
      >
        <div className="absolute inset-0 opacity-40" style={auraStyle} aria-hidden />
        <div className="relative z-10 flex flex-col gap-3">
          <header className="flex items-start justify-between gap-2.5">
            <div className="flex-1 space-y-0.5">
              <h2 className="text-sm font-semibold leading-tight tracking-wide">{activity.label}</h2>
              <p className="text-[9px] uppercase tracking-[0.15em] text-amber-200/80">{assignmentTitle ?? 'Slot'}</p>
            </div>
            <div className="flex items-center gap-1.5" data-drag-exempt="true">
              <button
                type="button"
                onClick={() => {
                  // Telemetry for capsule closed
                  trackTelemetryEvent('activity_capsule_closed', {
                    activityId: activity.id,
                    slotId: primarySlotId,
                    event: 'capsule_closed',
                    timestamp: Date.now(),
                  });
                  onClose();
                }}
                className="rounded-full border border-white/15 bg-white/5 p-1.5 text-slate-200 hover:border-rose-400/50 hover:text-rose-200"
                aria-label="Chiudi scheda"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          </header>

          <section className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex-1 rounded-lg border border-white/10 bg-black/15 px-3 py-2">
                <div className="flex items-center justify-between text-[9px] uppercase tracking-[0.18em] text-slate-400">
                  <span>Progress</span>
                  <span>{(progressRatio * 100).toFixed(0)}%</span>
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] font-mono text-amber-200">
                  <span>{formatTime(remainingSeconds)} rimanenti</span>
                  <span className="text-slate-400">/ {formatTime(durationSeconds)}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  // Telemetry for capsule collect
                  trackTelemetryEvent('activity_capsule_collect_clicked', {
                    activityId: activity.id,
                    slotId: primarySlotId,
                    event: 'capsule_collect_clicked',
                    timestamp: Date.now(),
                  });
                  onStart();
                }}
                disabled={isStartDisabled}
                className="inline-flex items-center justify-center gap-1 rounded-full border border-emerald-400/70 bg-emerald-500/15 px-3 py-1.5 text-[10px] uppercase tracking-[0.2em] text-emerald-50 transition hover:bg-emerald-500/30 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Play className="h-3 w-3" />
                Start
              </button>
            </div>

            <div className="flex flex-col gap-3 md:flex-row md:items-stretch">
              <div className="flex-1 space-y-1.5">
                <ResidentSlotRack
                  slots={slotViewModels}
                  layout="detail"
                  overflowBehavior={resolvedSlotOverflow}
                  onSlotDrop={handleRackDrop}
                  onSlotClear={handleRackClear}
                  onSlotClick={handleSlotClick}
                  resolveDisplayInfo={slotDisplayResolver}
                  draggingResidentId={draggingResidentId}
                />
                {metrics.length > 0 && (
                  <div className="grid gap-1.5 sm:grid-cols-2">
                    {metrics.map((metric) => (
                      <div
                        key={metric.id}
                        className="rounded-lg border border-white/10 bg-black/25 px-2.5 py-1.5 text-left"
                      >
                        <p className="text-[8px] uppercase tracking-[0.15em] text-slate-500">
                          {metric.label === 'Engine' ? 'Type' : metric.label}
                        </p>
                        <p className={`text-[11px] font-semibold ${meterToneClass(metric.tone)}`}>{metric.value}</p>
                        {metric.helperText && (
                          <p className="text-[9px] leading-tight text-slate-500">{metric.helperText}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                <div className="space-y-1.5">
                  {rewards.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {rewards.map((reward) => (
                        <span
                          key={`${reward.resourceId}-${reward.amountFormula}`}
                          className="rounded-full border border-white/15 bg-white/5 px-2 py-0.5 text-[9px]"
                        >
                          <span className="font-semibold text-amber-200">{reward.resourceId}</span>{' '}
                          <span className="text-[10px] font-mono text-slate-200">{reward.amountFormula}</span>
                        </span>
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-[9px] text-slate-400">
                      Nessuna ricompensa configurata.
                    </div>
                  )}
                </div>
                {(activityModifiersLoading || activityModifiers.length > 0) && (
                  <div className="pt-2">
                    <StatModifierDisplay
                      modifierEntries={activityModifiers}
                      isLoading={activityModifiersLoading}
                      showHeader={false}
                      maxVisible={4}
                      emptyLabel="Nessun modificatore collegato a questa attività"
                      testId="activity-card-modifiers"
                    />
                  </div>
                )}
              </div>
              <div className="flex items-center gap-3 md:flex-col md:items-start md:justify-start" title={riskTooltip}>
                <div className="text-[9px] uppercase tracking-[0.18em] text-slate-400">Risk</div>
                <div
                  data-testid="activity-detail-risk-stripe"
                  className="flex h-20 w-6 flex-col overflow-hidden rounded-full border border-white/10"
                  data-injury-percent={riskMetrics.injuryPercent}
                  data-death-percent={riskMetrics.deathPercent}
                  data-has-risk={riskMetrics.hasRisk ? 'true' : 'false'}
                >
                  {riskMetrics.segments.deathHeightPercent > 0 && (
                    <div
                      className="bg-rose-500/95"
                      style={{ height: `${riskMetrics.segments.deathHeightPercent}%` }}
                      data-segment="death"
                    />
                  )}
                  {riskMetrics.segments.injuryHeightPercent > 0 && (
                    <div
                      className="bg-amber-400/95"
                      style={{ height: `${riskMetrics.segments.injuryHeightPercent}%` }}
                      data-segment="injury"
                    />
                  )}
                  {riskMetrics.segments.safeHeightPercent > 0 && (
                    <div
                      className="flex-1 bg-emerald-500/20"
                      style={{ height: `${riskMetrics.segments.safeHeightPercent}%` }}
                      data-segment="safe"
                    />
                  )}
                </div>
              </div>
            </div>
          </section>
        </div>
      </article>
    </div>
  );
};

export default ActivityCardDetail;

// =============================================================================
// FILE: src/ui/idleVillage/hooks/useResidentDropValidation.ts
// =============================================================================
/**
 * React hook for validating resident drop operations in Idle Village Phase E.
 * 
 * This hook provides a centralized, config-first way to validate drag-and-drop
 * operations for residents being assigned to activities or locations. It integrates
 * with the balancing config system and provides telemetry for validation events.
 * 
 * Features:
 * - Config-first validation rules
 * - Real-time validation feedback
 * - Telemetry integration for tracking validation events
 * - Support for multiple validation contexts (activity slots, locations, etc.)
 */

import { useCallback, useMemo } from 'react';
import type { ActivityDefinition } from '@/balancing/config/idleVillage/types';
import type { ResidentState } from '@/engine/game/idleVillage/TimeEngine';
import { createSandboxDiagnostics } from '@/ui/idleVillage/utils/sandboxDiagnostics';
import { trackFatigueTelemetry, createFatigueTelemetryPayload } from '@/analytics/telemetry/telemetryProvider';
import type { ResidentHUDData, ActivityHUDData } from '@/ui/idleVillage/hooks/useMinimalHUD';
import type {
  DropValidationResult,
  DropValidationRule,
  ResidentDropRulesConfig,
} from '@/ui/idleVillage/config/residentDropRules';
import { createDropValidator, DEFAULT_DROP_RULES_CONFIG } from '@/ui/idleVillage/config/residentDropRules';
import { useAITutor } from './useAITutor';
import type { DropSuggestion } from '../ai/dropSuggestionEngine';

/**
 * Parameters for the useResidentDropValidation hook.
 */
export interface UseResidentDropValidationParams {
  /** Configuration for validation rules */
  config?: Partial<ResidentDropRulesConfig>;
  /** Optional custom validation function */
  customValidator?: (params: {
    resident: ResidentState;
    activity?: ActivityDefinition;
    currentOccupants?: number;
  }) => DropValidationResult;
  /** Whether to enable telemetry logging */
  enableTelemetry?: boolean;
  /** AI Tutor configuration */
  tutorConfig?: {
    /** Enable AI tutor mode */
    enabled?: boolean;
    /** Tutor detail level */
    detailLevel?: 'basic' | 'intermediate' | 'advanced';
    /** Show learning tips */
    showLearningTips?: boolean;
  };
}

/**
 * Return value for the useResidentDropValidation hook.
 */
export interface UseResidentDropValidationReturn {
  /** Validates a resident drop operation */
  validateDrop: (params: {
    resident: ResidentState;
    activity?: ActivityDefinition;
    currentOccupants?: number;
    context?: string;
  }) => DropValidationResult;
  
  /** Validates multiple residents for batch operations */
  validateBatchDrop: (params: {
    residents: ResidentState[];
    activity?: ActivityDefinition;
    currentOccupants?: number;
    context?: string;
  }) => DropValidationResult[];
  
  /** Gets a human-readable error message for a validation rule */
  getErrorMessage: (rule: DropValidationRule, meta?: Record<string, unknown>) => string;
  
  /** Checks if a resident is eligible for an activity (quick boolean check) */
  isResidentEligible: (resident: ResidentState, activity?: ActivityDefinition) => boolean;
  
  /** Current validation configuration */
  config: ResidentDropRulesConfig;

  /** HUD selectors for essential data display */
  hudSelectors: {
    /** Get essential HUD data for a resident */
    getResidentHUDData: (resident: ResidentState) => ResidentHUDData;
    
    /** Get essential HUD data for an activity */
    getActivityHUDData: (activity: ActivityDefinition) => ActivityHUDData;
    
    /** Get validation summary for HUD display */
    getValidationSummary: (result: DropValidationResult) => {
      isValid: boolean;
      errors: string[];
      warnings: string[];
    };
  };

  /** AI Tutor functionality */
  tutor: {
    /** Whether tutor mode is enabled */
    isEnabled: boolean;
    /** Set tutor mode enabled/disabled */
    setEnabled: (enabled: boolean) => void;
    /** Get AI suggestions for a resident */
    getSuggestionsForResident: (resident: ResidentState) => DropSuggestion[];
    /** Get AI suggestions for an activity */
    getSuggestionsForActivity: (activity: ActivityDefinition) => DropSuggestion[];
    /** Explain a suggestion with AI tutor */
    explainSuggestion: (suggestion: DropSuggestion) => void;
    /** Accept current tutor suggestion */
    acceptTutorSuggestion: () => void;
    /** Reject current tutor suggestion */
    rejectTutorSuggestion: () => void;
    /** Close tutor panel */
    closeTutor: () => void;
  };
}

/**
 * Default error messages for validation rules.
 * These can be overridden by the activity definition or custom logic.
 */
const DEFAULT_ERROR_MESSAGES: Record<DropValidationRule, string> = {
  stat_requirement_allOf: 'This resident does not meet the required stats.',
  stat_requirement_anyOf: 'This resident lacks the necessary stats.',
  stat_requirement_noneOf: 'This resident has incompatible stats.',
  fatigue_threshold: 'This resident is too exhausted to work.',
  crew_capacity: 'This activity is already at full capacity.',
  resident_availability: 'This resident is not available.',
  slot_locked: 'This slot is currently locked.',
  scheduler_rejection: 'The assignment was rejected by the scheduler.',
};

/**
 * Hook for validating resident drop operations with config-first rules.
 * 
 * @param params - Hook parameters
 * @returns Validation utilities and state
 */
export function useResidentDropValidation(params: UseResidentDropValidationParams = {}): UseResidentDropValidationReturn {
  const { config: userConfig, customValidator, enableTelemetry = true, tutorConfig } = params;

  // Initialize diagnostics for telemetry
  const diagnostics = useMemo(() => {
    return enableTelemetry ? createSandboxDiagnostics('resident-drop-validation') : null;
  }, [enableTelemetry]);

  // Initialize AI Tutor
  const aiTutor = useAITutor({
    defaultEnabled: tutorConfig?.enabled || false,
    tutorConfig: {
      detailLevel: tutorConfig?.detailLevel || 'intermediate',
      enableLearningMode: tutorConfig?.showLearningTips || false,
    },
    enableTelemetry: enableTelemetry,
  });

  // Create bound validator with user config
  const validator = useMemo(() => {
    if (customValidator) {
      return customValidator;
    }
    
    return createDropValidator(userConfig ?? {});
  }, [customValidator, userConfig]);

  /**
   * Validates a single resident drop operation.
   */
  const validateDrop = useCallback((
    params: {
      resident: ResidentState;
      activity?: ActivityDefinition;
      currentOccupants?: number;
      context?: string;
    }
  ): DropValidationResult => {
    const result = validator({
      resident: params.resident,
      activity: params.activity,
      currentOccupants: params.currentOccupants,
    });

    // Log telemetry event
    if (diagnostics && params.context) {
      if (result.isValid) {
        diagnostics.info('idle_drop_validation_success', {
          residentId: params.resident.id,
          activityId: params.activity?.id,
          context: params.context,
        });
      } else {
        diagnostics.warn('idle_drop_validation_failure', {
          residentId: params.resident.id,
          activityId: params.activity?.id,
          context: params.context,
          failedRule: result.failedRule,
          message: result.message,
        });

        // Emit fatigue threshold telemetry if applicable
        if (result.failedRule === 'fatigue_threshold' && result.meta) {
          const fatigue = (result.meta as DropValidationResult['meta'])?.fatigue;

          if (typeof fatigue?.current === 'number' && typeof fatigue?.threshold === 'number') {
            const eventType = fatigue.current >= fatigue.threshold * 1.5 
              ? 'fatigue_threshold_block' 
              : 'fatigue_threshold_warn';
            
            const fatiguePayload = createFatigueTelemetryPayload(
              params.resident.id,
              params.activity?.id,
              fatigue.current,
              fatigue.threshold,
              params.context,
              {
                previousFatigue: fatigue.previous,
                timeSinceLastEvent: fatigue.timeSinceLastEvent,
                sessionEventCount: fatigue.sessionEventCount || 1,
                activityType: params.activity?.tags?.[0] || 'unknown',
                residentStats: {
                  fatigue: params.resident.fatigue || 0,
                  status: params.resident.status,
                  ...(params.resident.statSnapshot || {}),
                } as unknown as Record<string, number>,
              }
            );
            
            trackFatigueTelemetry(eventType, fatiguePayload);
          }
        }
      }
    }

    return result;
  }, [validator, diagnostics]);

  /**
   * Validates multiple residents for batch operations.
   */
  const validateBatchDrop = useCallback((
    params: {
      residents: ResidentState[];
      activity?: ActivityDefinition;
      currentOccupants?: number;
      context?: string;
    }
  ): DropValidationResult[] => {
    return params.residents.map(resident => 
      validateDrop({
        resident,
        activity: params.activity,
        currentOccupants: params.currentOccupants,
        context: params.context,
      })
    );
  }, [validateDrop]);

  /**
   * Gets a human-readable error message for a validation rule.
   */
  const getErrorMessage = useCallback((
    rule: DropValidationRule,
    meta?: Record<string, unknown>
  ): string => {
    // Check if activity has custom error message
    if (meta && 'activity' in meta) {
      const activity = meta.activity as {
        customErrorMessages?: Record<string, string>;
      };
      if (activity.customErrorMessages?.[rule]) {
        return activity.customErrorMessages[rule];
      }
    }

    // Use default message
    const baseMessage = DEFAULT_ERROR_MESSAGES[rule];
    
    // Add context from metadata if available
    if (meta && 'fatigue' in meta) {
      const fatigue = meta.fatigue as {
        current?: number;
        threshold?: number;
      };
      if (fatigue?.current && fatigue?.threshold) {
        return `${baseMessage} (${fatigue.current.toFixed(1)}% > ${fatigue.threshold}%)`;
      }
    }
    
    if (meta && 'crew' in meta) {
      const crew = meta.crew as {
        occupied?: number;
        capacity?: number;
      };
      if (crew?.occupied && crew?.capacity) {
        return `${baseMessage} (${crew.occupied}/${crew.capacity})`;
      }
    }
    
    if (meta && 'missingStats' in meta) {
      const missingStats = meta.missingStats as string[];
      if (Array.isArray(missingStats) && missingStats.length > 0) {
        return `${baseMessage} Missing: ${missingStats.join(', ')}`;
      }
    }
    
    return baseMessage;
  }, []);

  /**
   * Quick boolean check for resident eligibility.
   */
  const isResidentEligible = useCallback((
    resident: ResidentState,
    activity?: ActivityDefinition
  ): boolean => {
    const result = validateDrop({
      resident,
      activity,
      context: 'eligibility_check',
    });
    return result.isValid;
  }, [validateDrop]);

  // Final configuration (merged with defaults)
  const config = useMemo(() => {
    return { ...DEFAULT_DROP_RULES_CONFIG, ...userConfig };
  }, [userConfig]);

  const hudSelectors = useMemo(() => {
    const mapResidentToHUD = (resident: ResidentState): ResidentHUDData => {
      const maxHp = typeof resident.maxHp === 'number' ? resident.maxHp : resident.currentHp ?? 0;
      const currentHp = typeof resident.currentHp === 'number' ? resident.currentHp : maxHp;
      const fatigue = typeof resident.fatigue === 'number' ? resident.fatigue : 0;
      const stamina = typeof resident.statSnapshot?.stamina === 'number' ? resident.statSnapshot.stamina : 0;

      return {
        id: resident.id,
        name: resident.displayName ?? resident.id,
        hp: currentHp,
        maxHp,
        fatigue,
        stamina,
        status: resident.status ?? 'available',
        isInjured: Boolean(resident.isInjured),
        isAvailable: (resident.status ?? 'available') === 'available',
        canWork:
          ((resident.status ?? 'available') === 'available') &&
          fatigue < config.maxFatigueBeforeExhausted,
      };
    };

    const mapActivityToHUD = (activity: ActivityDefinition): ActivityHUDData => {
      const maxSlotsValue = activity.maxSlots === 'infinite' ? 'infinite' : activity.maxSlots ?? config.defaultCrewSize;
      return {
        id: activity.id,
        name: activity.label,
        description: activity.description ?? '',
        tags: activity.tags ?? [],
        slotTags: activity.slotTags ?? [],
        level: activity.level ?? 1,
        dangerRating: activity.dangerRating ?? 0,
        maxSlots: maxSlotsValue,
      };
    };

    const mapValidationToSummary = (result: DropValidationResult) => ({
      isValid: result.isValid,
      errors: result.isValid ? [] : [result.message ?? 'Validation failed'],
      warnings: [],
    });

    return {
      getResidentHUDData: mapResidentToHUD,
      getActivityHUDData: mapActivityToHUD,
      getValidationSummary: mapValidationToSummary,
    };
  }, [config]);

  return {
    validateDrop,
    validateBatchDrop,
    getErrorMessage,
    isResidentEligible,
    config,
    hudSelectors,
    tutor: {
      isEnabled: aiTutor.isEnabled,
      setEnabled: aiTutor.setEnabled,
      getSuggestionsForResident: (resident: ResidentState) => {
        // Create a basic village context for suggestions
        const context = {
          residents: [resident], // Would need full village state in real implementation
          activities: [], // Would need available activities
          resourceLevels: {},
          resourceNeeds: {},
          currentAssignments: {},
          villageState: { day: 1, season: 'spring' },
        };
        return aiTutor.getSuggestionsForResident(resident, context);
      },
      getSuggestionsForActivity: (activity: ActivityDefinition) => {
        // Create a basic village context for suggestions
        const context = {
          residents: [], // Would need available residents
          activities: [activity],
          resourceLevels: {},
          resourceNeeds: {},
          currentAssignments: {},
          villageState: { day: 1, season: 'spring' },
        };
        return aiTutor.getSuggestionsForActivity(activity, context);
      },
      explainSuggestion: aiTutor.explainSuggestion,
      acceptTutorSuggestion: aiTutor.acceptSuggestion,
      rejectTutorSuggestion: aiTutor.rejectSuggestion,
      closeTutor: aiTutor.closeTutor,
    },
  };
}

// =============================================================================
// FILE: src/ui/idleVillage/slots/useResidentSlotController.ts
// =============================================================================
import { useMemo, useCallback, useEffect } from 'react';
import type { ActivityDefinition, StatRequirement } from '@/balancing/config/idleVillage/types';
import type { ResidentState } from '@/engine/game/idleVillage/TimeEngine';
import type { DropState } from '@/ui/idleVillage/components/ActivitySlot';
import type { ScheduledActivityState } from '@/ui/idleVillage/hooks/useActivityScheduler';
import type {
  ResidentSlotAssignResult,
  AssignmentFailureReason,
} from './types';
import {
  computeDropStateForResident,
  validateResidentAssignment,
} from './residentSlotValidators';
import {
  type ResidentSlotBlueprint,
  type ResidentSlotControllerOptions,
  type ResidentSlotControllerResult,
  type ResidentSlotTelemetryPayload,
  type ResidentSlotViewModel,
  type ResidentSlotWarning,
  type SlotBloomState,
  type ResidentSlotStatus,
  type ActivitySlotModifier,
} from './types';

const DEFAULT_SLOT_LABEL_PREFIX = 'Slot';

/** Creates a fallback slot blueprint used when config does not supply one. */
const buildDefaultBlueprint = (
  activityId: string,
  index: number,
  requirement?: StatRequirement,
  modifiers?: ActivitySlotModifier,
  required = false,
  isVirtual = false,
): ResidentSlotBlueprint & { index: number; isVirtual: boolean } => ({
  id: `${activityId}-slot-${index}`,
  label: `${DEFAULT_SLOT_LABEL_PREFIX} ${index + 1}`,
  requirement,
  modifiers,
  index,
  required,
  isVirtual,
});

/** Resolves the slot modifier for a given index using numeric or string keys. */
const resolveSlotModifier = (
  modifiers: ActivityDefinition['slotModifiers'],
  slotIndex: number,
): ActivitySlotModifier | undefined => {
  if (!modifiers) return undefined;
  const numericMatch = (modifiers as Record<number, ActivitySlotModifier | undefined>)[slotIndex];
  if (numericMatch) {
    return numericMatch;
  }
  return (modifiers as Record<string, ActivitySlotModifier | undefined>)[String(slotIndex)];
};

/** Returns the list of slot blueprints after merging config, assignments and infinite-slot placeholders. */
const deriveSlotBlueprints = (
  activity: ActivityDefinition,
  slotBlueprints: ResidentSlotBlueprint[] | undefined,
  assignments: Record<string, string | null>,
) => {
  const base = (slotBlueprints ?? []).map((slot, index) => ({
    ...slot,
    id: slot.id || `${activity.id}-slot-${index}`,
    index,
    isVirtual: false,
    modifiers: slot.modifiers ?? resolveSlotModifier(activity.slotModifiers, index),
  }));

  const blueprintMap = new Map<string, ReturnType<typeof buildDefaultBlueprint>>();
  base.forEach((slot) => {
    const enriched: ReturnType<typeof buildDefaultBlueprint> = {
      ...slot,
      isVirtual: Boolean((slot as { isVirtual?: boolean }).isVirtual),
    };
    blueprintMap.set(slot.id, enriched);
  });

  Object.keys(assignments).forEach((slotId) => {
    if (!blueprintMap.has(slotId)) {
      const nextIndex = blueprintMap.size;
      blueprintMap.set(
        slotId,
        buildDefaultBlueprint(
          activity.id,
          nextIndex,
          activity.statRequirement,
          resolveSlotModifier(activity.slotModifiers, nextIndex),
          false,
        ),
      );
    }
  });

  const slots = Array.from(blueprintMap.values()).sort((a, b) => a.index - b.index);

  const numericMaxSlots = typeof activity.maxSlots === 'number' ? activity.maxSlots : null;
  if (numericMaxSlots && slots.length < numericMaxSlots) {
    for (let i = slots.length; i < numericMaxSlots; i += 1) {
      slots.push(
        buildDefaultBlueprint(
          activity.id,
          i,
          activity.statRequirement,
          resolveSlotModifier(activity.slotModifiers, i),
          false,
        ),
      );
    }
  }

  const needsVirtual = activity.maxSlots === 'infinite';
  if (needsVirtual) {
    const emptySlotCount = slots.filter((slot) => !assignments[slot.id]).length;
    const placeholdersNeeded = Math.max(0, 1 - emptySlotCount);
    if (placeholdersNeeded > 0) {
      const baseIndex = slots.length;
      for (let i = 0; i < placeholdersNeeded; i += 1) {
        const virtualIndex = baseIndex + i;
        slots.push(
          buildDefaultBlueprint(
            activity.id,
            virtualIndex,
            activity.statRequirement,
            resolveSlotModifier(activity.slotModifiers, virtualIndex),
            false,
            true,
          ),
        );
      }
    }
  }

  return slots;
};

const dropPriority: DropState[] = ['valid', 'locked', 'invalid', 'idle'];

// TODO(style-lab-flexibility): allow Style Lab interactionPhysics.mass/damping to
// influence bloom easing (overshoot) instead of static mapping once the new tokens land.
const mapDropStateToBloom = (dropState: DropState): SlotBloomState => {
  switch (dropState) {
    case 'valid':
      return 'valid';
    case 'invalid':
      return 'idle'; // Invalid drops should not bloom, just fade to alpha
    case 'locked':
      return 'blocked';
    default:
      return 'idle';
  }
};

const deriveTelemetryTags = (
  slot: ResidentSlotBlueprint & { index: number },
  activity: ActivityDefinition,
): string[] => {
  const tags = [`activity:${activity.id}`, `slot:${slot.index}`];
  if (slot.required) tags.push('required');
  if (slot.requirement?.label) tags.push(`requirement:${slot.requirement.label}`);
  if (slot.modifiers?.fatigueMult) tags.push(`fatigue:${slot.modifiers.fatigueMult}`);
  if (slot.modifiers?.riskMult) tags.push(`risk:${slot.modifiers.riskMult}`);
  if (slot.modifiers?.yieldMult) tags.push(`yield:${slot.modifiers.yieldMult}`);
  return tags;
};

const deriveControllerDropState = (slots: ResidentSlotViewModel[]): DropState => {
  for (const state of dropPriority) {
    if (slots.some((slot) => slot.dropState === state)) {
      return state;
    }
  }
  return 'idle';
};

const resolveSlotStatus = (slot: { isVirtual?: boolean }, assignedResidentId: string | null): ResidentSlotStatus => {
  if (assignedResidentId) return 'assigned';
  if (slot.isVirtual) return 'placeholder';
  return 'empty';
};

/**
 * Hook that normalizes resident slots for an activity (board, Theater, Verb detail).
 * Handles infinite placeholders, drop validation, and activity scheduler bridging.
 */
export const useResidentSlotController = ({
  activity,
  assignments,
  residents,
  hoveredResidentId,
  slotBlueprints,
  scheduler,
  onAssign,
  onClear,
  onWarningsChange,
  maxFatigueBeforeExhausted,
  onDuplicatePlaceholder,
  customValidator,
}: ResidentSlotControllerOptions): ResidentSlotControllerResult => {
  const slotViewModels = useMemo(() => {
    const rawSlots = deriveSlotBlueprints(activity, slotBlueprints, assignments);

    return rawSlots.map<ResidentSlotViewModel>((slot) => {
      const assignedResidentId = assignments[slot.id] ?? null;
      const assignedResident = assignedResidentId ? residents[assignedResidentId] : undefined;
      const dropState = computeDropStateForResident(
        hoveredResidentId,
        activity,
        scheduler,
        slot.requirement,
        residents,
        { maxFatigueBeforeExhausted }
      );

      // TODO(style-lab-flexibility): pipe bloomState transitions + interactionPhysics.audioProfile
      // into telemetry/audio/haptic adapters so heavy presets trigger deeper cues.
      const bloomState = mapDropStateToBloom(dropState);
      const status = resolveSlotStatus(slot, assignedResidentId);
      const telemetryTags = deriveTelemetryTags(slot, activity);

      return {
        id: slot.id,
        index: slot.index,
        label: slot.label ?? `${DEFAULT_SLOT_LABEL_PREFIX} ${slot.index + 1}`,
        statHint: slot.statHint ?? slot.requirementLabel,
        required: slot.required,
        assignedResidentId,
        assignedResident,
        requirement: slot.requirement ?? activity.statRequirement,
        modifiers: slot.modifiers,
        isPlaceholder: Boolean(slot.isVirtual && !assignedResidentId),
        dropState,
        bloomState,
        status,
        telemetryTags,
      };
    });
  }, [activity, assignments, hoveredResidentId, residents, scheduler, slotBlueprints, maxFatigueBeforeExhausted]);

  const warnings = useMemo<ResidentSlotWarning[]>(() => {
    const missingRequired = slotViewModels.filter((slot) => slot.required && !slot.assignedResidentId);
    if (missingRequired.length === 0) {
      return [];
    }
    return [
      {
        type: 'REQUIRED_SLOTS_MISSING',
        slotIds: missingRequired.map((slot) => slot.id),
        message:
          missingRequired.length === 1
            ? `${missingRequired[0].label} is required before starting this activity.`
            : `${missingRequired.length} required slots are still empty.`,
      },
    ];
  }, [slotViewModels]);

  useEffect(() => {
    if (!onWarningsChange) return;
    onWarningsChange(warnings);
  }, [onWarningsChange, warnings]);

  const assignResidentToSlot = useCallback<ResidentSlotControllerResult['assignResidentToSlot']>(
    (residentId, slotId) => {
      if (!slotId) {
        return {
          success: false,
          reason: 'VALIDATION_FAILED',
          details: 'Slot specifico richiesto per le operazioni drag.',
        };
      }

      const targetSlot = slotViewModels.find((slot) => slot.id === slotId);

      if (!targetSlot) {
        return {
          success: false,
          reason: 'VALIDATION_FAILED',
          details: 'Slot non disponibile per questa attività.',
          slotId,
        };
      }

      if (customValidator) {
        const customResult = customValidator(residentId, targetSlot.id);
        if (customResult && !customResult.success) {
          return customResult.slotId ? customResult : { ...customResult, slotId: targetSlot.id };
        }
      }

      const validation = validateResidentAssignment({
        residentId,
        activity,
        scheduler,
        residents,
        slotRequirement: targetSlot.requirement,
        maxFatigueBeforeExhausted,
      });

      if (!validation.success) {
        return { ...validation, slotId: targetSlot.id };
      }

      onAssign?.(targetSlot.id, residentId);
      return { success: true, slotId: targetSlot.id };
    },
    [activity, onAssign, residents, scheduler, slotViewModels, maxFatigueBeforeExhausted, customValidator],
  );

  const clearSlot = useCallback<ResidentSlotControllerResult['clearSlot']>(
    (slotId) => {
      if (!slotId) return;
      onClear?.(slotId);
    },
    [onClear],
  );

  const getSlotProgress = useCallback<ResidentSlotControllerResult['getSlotProgress']>(
    (slotId) => {
      const assignedResidentId = assignments[slotId];
      if (!assignedResidentId || !scheduler?.getActivityState) {
        return null;
      }
      const state = scheduler.getActivityState(activity.id, assignedResidentId);
      if (!state) return null;
      const ratio = state.progress;
      return {
        slotId,
        residentId: assignedResidentId,
        elapsedSeconds: state.elapsed,
        totalSeconds: state.duration,
        ratio,
        state,
      };
    },
    [activity.id, assignments, scheduler],
  );

  const getBloomState = useCallback<ResidentSlotControllerResult['getBloomState']>(
    (slotId) => slotViewModels.find((slot) => slot.id === slotId)?.bloomState ?? 'idle',
    [slotViewModels],
  );

  const duplicatePlaceholder = useCallback<ResidentSlotControllerResult['duplicatePlaceholder']>(
    (slotId) => {
      if (activity.maxSlots !== 'infinite') {
        return false;
      }
      if (onDuplicatePlaceholder) {
        onDuplicatePlaceholder(slotId);
        return true;
      }
      return false;
    },
    [activity.maxSlots, onDuplicatePlaceholder],
  );

  const isSlotFull = useCallback<ResidentSlotControllerResult['isSlotFull']>(
    () => {
      if (typeof activity.maxSlots !== 'number') {
        return false;
      }
      return !slotViewModels.some((slot) => !slot.assignedResidentId && !slot.isPlaceholder);
    },
    [activity.maxSlots, slotViewModels],
  );

  const aggregateDrop = useMemo(() => deriveControllerDropState(slotViewModels), [slotViewModels]);

  return {
    slots: slotViewModels,
    assignResidentToSlot,
    clearSlot,
    getSlotProgress,
    getBloomState,
    duplicatePlaceholder,
    isSlotFull,
    dropState: aggregateDrop,
    warnings,
  };
};

/**
 * Builds a canonical telemetry payload for a resident slot event.
 */
export const createResidentSlotTelemetryPayload = (
  slot: ResidentSlotViewModel,
  activityId: string,
): ResidentSlotTelemetryPayload => ({
  activityId,
  slotId: slot.id,
  slotIndex: slot.index,
  assignedResidentId: slot.assignedResidentId,
  requirementLabel: slot.statHint ?? slot.requirement?.label,
  required: Boolean(slot.required),
  bloomState: slot.bloomState,
  dropState: slot.dropState,
  modifiers: slot.modifiers,
  tags: slot.telemetryTags,
});

// =============================================================================
// FILE: src/store/useMinimalGameplay.ts (partial - showing key parts)
// =============================================================================
/**
 * Minimal Gameplay Store
 *
 * Config-first Zustand store for Minimal Gameplay Page state.
 * Integrates PersistenceService for storage and exposes selectors for performant UI updates.
 */

import { create, type StateCreator } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { useMemo } from 'react';
import {
  clearData,
  saveMinimalGameplaySnapshot,
  loadMinimalGameplaySnapshotData,
} from '@/shared/persistence/PersistenceService';
import { trackTelemetryEvent, traceMinimalGameplay } from '@/analytics/telemetry/telemetryProvider';
import { transformIdleVillageToMinimalConfig } from '@/balancing/config/idleVillage/transformations';
import type { MinimalConfig } from '@/balancing/config/idleVillage/minimalConfig';
import type { MinimalGameplayGameOverReason } from '@/balancing/config/idleVillage/minimalGameplayConfig';
import type { MinimalGameplayDropReason } from '@/balancing/config/idleVillage/minimalConfig';
import type { MinimalGameState } from '@/engine/game/idleVillage/minimalSnapshotSerializer';
import type { MinimalResident } from '@/ui/idleVillage/types/gameplayTypes';
import type { MinimalActivityEntry } from '@/ui/idleVillage/config/activityLogPanelConfig';
import { useIdleVillageConfig } from '@/balancing/hooks/useIdleVillageConfig';
import {
  canStartActivity as engineCanStartActivity,
  startActivity as engineStartActivity,
  type GameState,
  type ActivityValidationResult,
  MinimalGameplayActionError,
} from '@/engine/game/idleVillage/minimalGameRules';
import { startQuest } from '@/engine/game/idleVillage/QuestEngine';
import type { QuestState } from '@/balancing/config/idleVillage/types/questTypes';
import { ensureMinimalRngState, type MinimalRngState } from '@/engine/game/idleVillage/RandomHelper';
import type { ResidentState as TimeEngineResidentState } from '@/engine/game/idleVillage/TimeEngine';
import { resolveResidentPortrait } from '@/engine/game/idleVillage/residentVisualResolver';
import type { StatBlock } from '@/balancing/types';
import { IntentBridge } from '@/ui/idleVillage/intent/GameIntent';
import type { GameIntent } from '@/ui/idleVillage/intent/GameIntent';

const PERSISTENCE_KEY = 'minimal-gameplay-state';

const EVENT_LOG_LIMIT = 100;
const FALLBACK_RESIDENT_HP = 100;

/**
 * Minimal resident with warning flags for UI display.
 */
export interface MinimalResidentWithWarning extends MinimalResident {
  fatigueWarning?: boolean;
  injuryWarning?: boolean;
}

/**
 * Represents an activity currently running in the Minimal Gameplay loop.
 */
export interface ActiveActivityState {
  activityId: string;
  residentId: string;
  ticksRemaining: number;
}

/**
 * Game over state with reason and final statistics.
 */
export interface MinimalGameOverState {
  /** Whether the game is in game over state. */
  isGameOver: boolean;
  /** Reason for the game over. */
  reason?: MinimalGameplayGameOverReason;
  /** Final game statistics. */
  summary?: {
    daysSurvived: number;
    goldEarned: number;
    questsCompleted: number;
    residentsLost: number;
    finalRoster: Array<{
      id: string;
      name: string;
      level: number;
      isInjured?: boolean;
    }>;
  };
  /** Timestamp when game over occurred. */
  gameOverAt?: number;
}

export interface MinimalGameplayState {
  // --- STATE ---
  state: {
    gold: number;
    food: number;
    maxFood: number;
    currentDay: number;
    currentTime: number;
    isPaused: boolean;
    speedMultiplier: number;
    residents: MinimalResident[];
    activeActivities: ActiveActivityState[];
    eventLog: MinimalActivityEntry[];
    lastSavedAt?: number;
    rngState?: MinimalRngState;
    // Time engine & day/night cycle state
    isDayPhase: boolean;
    cycleProgress: number; // 0-1 progress through current day/night phase
    tickIntervalMs: number;
  };
  config: MinimalConfig;
  isLoading: boolean;
  error: string | null;
  gameOverState: MinimalGameOverState;

  // --- ACTIONS ---
  tick: (deltaMs: number, source?: 'auto' | 'manual') => void;
  pauseGame: (source: 'user' | 'auto') => void;
  resumeGame: (source: 'user' | 'auto') => void;
  resetGame: () => void;
  buyFood: (quantity: number) => { success: boolean; reason?: string; message?: string };
  setSpeedMultiplier: (multiplier: number) => void;
  startActivity: (residentId: string, activityId: string) => void;
  canStartActivity: (residentId: string, activityId: string) => StoreActivityValidationResult;
  startQuestDemo: (activityId: string, residentIds: string[]) => { success: boolean; reason?: string; message?: string };
  addEvent: (event: MinimalActivityEntry) => void;
  clearEvents: () => void;
  daysRemaining: () => number;
  gameOver: () => boolean;
}

/**
 * Hook to use MinimalGameplay store with real IdleVillageConfig integration.
 * Replaces DEFAULT_MINIMAL_CONFIG fallback with loaded configuration.
 */
export function useMinimalGameplayWithIdleVillageConfig() {
  const idleVillageConfig = useIdleVillageConfig();
  const store = useMinimalGameplayStore();

  // Memoized config that transforms IdleVillageConfig to MinimalConfig
  const config = useMemo(() => {
    // If IdleVillageConfig is available and initialized, transform it to MinimalConfig
    if (idleVillageConfig.initialized && idleVillageConfig.config) {
      return transformIdleVillageToMinimalConfig(idleVillageConfig.config);
    }
    // Fall back to transformed config if IdleVillageConfig is not available
    return transformIdleVillageToMinimalConfig({
      version: '1.0.0',
      resources: {},
      activities: {},
      globalRules: {
        maxFatigueBeforeExhausted: 100,
        defaultActivityFatigueGain: 10,
        startingResidentFatigue: 100,
        fatigueRecoveryPerDay: 50,
        dayLengthInTimeUnits: 5,
        dayNightCycle: { dayTimeUnits: 5, nightTimeUnits: 5 },
        secondsPerTimeUnit: 1,
        fatigueYellowThreshold: 33,
        fatigueRedThreshold: 66,
        baseLightInjuryChanceAtMaxFatigue: 0.3,
        dangerInjuryMultiplierPerPoint: 0.1,
        injuryTiers: {},
        deathRules: {
          baseDeathChanceAtMaxDanger: 0.05,
          dangerDeathMultiplierPerPoint: 0.02,
          injuryTierMultipliers: { light: 0.5, moderate: 1, severe: 1.5 },
          questOutcomeAdjustments: { perfect: -0.02, success: -0.01, partial: 0, fail: 0.03, deadly: 0.1 },
          starvationDeathChancePerDay: 0.02,
        },
        foodConsumptionPerResidentPerDay: 1,
        baseFoodPriceInGold: 25,
        startingResources: { gold: 15, food: 8 },
        questXpFormula: 'level * 10',
        maxActiveQuests: 5,
        questSpawnEveryNDays: 1,
        maxGlobalQuestOffers: 4,
        maxQuestOffersPerSlot: 2,
        verbToneColors: {},
        trialOfFire: { highRiskThreshold: 0.4, statBonusMultiplier: 0.15 },
        defaultRandomSeed: 734003,
      },
      ui: {
        hud: { fields: [], layout: 'horizontal' },
        actionPanel: { buttons: [], layout: 'horizontal' },
        tooltips: { sections: {} },
        thresholds: { foodDangerDays: 2, fatigueDangerPercent: 75 },
      },
      eventLog: { maxEntries: 100, templates: {} },
      buildings: {},
      nightThreat: { enabled: false, difficulty: 'normal' },
    });
  }, [idleVillageConfig.initialized, idleVillageConfig.config]);

  return {
    ...store,
    config,
  };
}

// =============================================================================
// FILE: src/balancing/config/idleVillage/defaultConfig.ts (partial - showing key parts)
// =============================================================================
// src/balancing/config/idleVillage/defaultConfig.ts
// Minimal default IdleVillageConfig. Intentionally almost empty so that
// all domain content is authored via config/UI rather than hardcoded here.

import type { IdleVillageConfig } from './types';
import { DEFAULT_QUEST_TYPES } from './questTypeDefaults';
import { DEFAULT_PASSIVE_EFFECTS } from './passiveEffects';
import { defaultQuestBlueprints } from './quests/questBlueprints';

export const DEFAULT_IDLE_VILLAGE_CONFIG: IdleVillageConfig = {
  version: '1.0.0',

  // Core economic resources for the village meta-game. All values are editable
  // from the Idle Village config UI; these are just safe starting presets for
  // the first playable scenario.
  resources: {
    gold: {
      id: 'gold',
      label: 'Gold',
      description: 'Coins used for wages, equipment and basic upgrades.',
      icon: '',
      colorClass: 'text-amber-300',
      isCore: true,
    },
    food: {
      id: 'food',
      label: 'Food',
      description: 'Daily upkeep for all residents in the village.',
      icon: '',
      colorClass: 'text-emerald-300',
      isCore: true,
    },
    materials: {
      id: 'materials',
      label: 'Materials',
      description: 'Abstract building materials for construction and upgrades.',
      icon: '',
      colorClass: 'text-slate-200',
      isCore: true,
    },
    wood: {
      id: 'wood',
      label: 'Wood',
      description: 'Timber harvested from forests, used for construction and fuel.',
      icon: '',
      colorClass: 'text-amber-700',
      isCore: true,
    },
    xp: {
      id: 'xp',
      label: 'XP',
      description: 'Experience gained from combat and risky jobs.',
      icon: '',
      colorClass: 'text-violet-300',
      isCore: true,
    },
    ember_sigils: {
      id: 'ember_sigils',
      label: 'Ember Sigils',
      description: 'Seared currency granted to residents who survive Trial of Fire assignments.',
      icon: '',
      colorClass: 'text-amber-300',
    },
    radiant_ore: {
      id: 'radiant_ore',
      label: 'Radiant Ore',
      description: 'Luminous ore harvested from stabilized storm nodes.',
      icon: '',
      colorClass: 'text-sky-300',
    },
    ashen_favor: {
      id: 'ashen_favor',
      label: 'Ashen Favor',
      description: 'Political weight issued by the Silent Order for perfect upkeep.',
      icon: '',
      colorClass: 'text-rose-200',
    },
    chronicle_shards: {
      id: 'chronicle_shards',
      label: 'Chronicle Shards',
      description: 'Encoded battle reports, used to unlock high-tier tactics.',
      icon: '',
      colorClass: 'text-emerald-200',
    },
  },

  questTypes: DEFAULT_QUEST_TYPES,

  // Minimal starting activities: core jobs + an early quest to exercise
  // the time, job, quest and injury engines.
  activities: {
    // STABLE JOBS - Low risk, repeatable, consistent rewards
    job_wood_gathering_stable: {
      id: 'job_wood_gathering_stable',
      label: 'Wood Gathering',
      description: 'Collect wood from nearby forest. Stable, low-risk work.',
      tags: ['job', 'stable', 'economy'],
      slotTags: ['village', 'job_site'],
      resolutionEngineId: 'job',
      level: 1,
      dangerRating: 1,
      durationFormula: '4000', // 4 seconds
      rewards: [
        { resourceId: 'wood', amountFormula: '2' },
        { resourceId: 'xp', amountFormula: '1' },
      ],
      statRequirement: {
        allOf: ['strength'],
        anyOf: ['endurance'],
      },
      maxSlots: 'infinite',
      metadata: {
        cardKind: 'job' as const,
        jobType: 'stable',
        riskLevel: 'low',
        repeatable: true,
        autoRepeatEnabled: true,
        mapSlotId: 'wood_gathering_slot',
      },
    },
    // ... many more activities in the full file
  },

  // ... other config sections
};

// =============================================================================
// FILE: src/balancing/config/idleVillage/types.ts (partial - showing key parts)
// =============================================================================
// src/balancing/config/idleVillage/types.ts
// Generic, config-first domain types for the Idle Village meta-game.
// No hardcoded job/quest kinds or enums - everything is tag/ID based
// so new content can be added purely via config/UI.

import type { AppNavTabId } from '@/shared/navigation/navConfig';

/**
 * Config-driven description of a resource that Idle Village systems can exchange.
 */
export interface ResourceDefinition {
  id: string;
  label: string;
  description?: string;
  icon?: string;
  /** Tailwind CSS class for coloring this resource in UI (e.g. "text-amber-300") */
  colorClass?: string;
  /** Reserved for future invariants (e.g. non-removable resources) */
  isCore?: boolean;
}

/**
 * Constraints describing which resident stat tags are required/prohibited.
 */
export interface StatRequirement {
  /**
   * Resident must possess all of these stat tags.
   * Example: ["discipline","lantern"].
   */
  allOf?: string[];
  /**
   * Resident must match at least one of these tags.
   * Example: ["edge","moth"].
   */
  anyOf?: string[];
  /**
   * Resident must not include any of these tags.
   */
  noneOf?: string[];
  /**
   * Optional human-readable label for UI hinting.
   */
  label?: string;
}

/**
 * Generic activity definition. Covers jobs, quests, training, shop actions, etc.
 * Semantic meaning is derived from tags + resolutionEngineId, not from enums.
 */
export type ActivityMaxSlots = number | 'infinite';

/**
 * Per-slot multipliers applied to residents occupying an activity slot.
 */
export interface ActivitySlotModifier {
  /**
   * Multiplier applied to fatigue accumulation for residents occupying this slot.
   */
  fatigueMult?: number;
  /**
   * Multiplier applied to injury/risk calculations for this slot.
   */
  riskMult?: number;
  /**
   * Multiplier applied to resource yields for this slot.
   */
  yieldMult?: number;
}

/**
 * Declarative definition of jobs, quests, trainings, purchases, etc.
 */
export type ActivityResolutionMode = 'tick' | 'final';

export type ActivityCardKind = 'job' | 'quest' | 'training' | 'maintenance';

export interface ActivityDefinition {
  id: string;
  label: string;
  description?: string;

  /** Semantic tags: e.g. ["job"], ["quest","combat"], ["training"], ... */
  tags: string[];

  /**
   * Tags describing which MapSlotDefinition can host this activity.
   * Example: ["village_job"], ["world_quest"], ["shop"]
   */
  slotTags: string[];

  /**
   * Identifier for the resolver/engine used to execute this activity.
   * Example: "job", "quest_dispatch", "quest_combat" - purely string-based.
   */
  resolutionEngineId: string;

  /**
   * Optional recommended level of a "typical" character for this activity
   * (used especially for quests). Purely informational for some engines.
   */
  level?: number;

  /** Approximate danger rating used for injury probabilities (0 = safe). */
  dangerRating?: number;

  /** Core activity duration (excluding travel), as a formula string */
  durationFormula?: string;

  /**
   * Declarative hint describing which ActivityCapsule wrapper should render this activity.
   * Falls back to inference based on tags if omitted.
   */
  cardKind?: ActivityCardKind;

  /** Resource costs paid when scheduling / resolving the activity */
  costs?: ResourceDeltaDefinition[];

  /** Base resource rewards produced by the activity (before variance) */
  rewards?: ResourceDeltaDefinition[];

  /**
   * Optional stat requirement that every assigned resident must satisfy.
   * Used by scheduling UIs to validate drops.
   */
  statRequirement?: StatRequirement;

  /**
   * Maximum concurrent residents that can occupy this activity.
   * Use 'infinite' to preserve the legacy "no limit" behavior.
   */
  maxSlots?: ActivityMaxSlots;

  /**
   * Optional per-slot modifiers applied when residents occupy a specific slot index.
   * Keys are zero-based slot indexes.
   */
  slotModifiers?: ActivitySlotModifierMap;

  /** Open extension point for domain-specific data */
  metadata?: Record<string, unknown>;
}

/**
 * Config describing a resident injury tier and its gameplay multipliers.
 */
export interface InjuryTierDefinition {
  id: string;
  label: string;
  description?: string;
  /** Days required before this injury naturally recovers (integer time units / day) */
  recoveryTimeInDays: number;
  /** Optional multiplier applied to job payouts while the resident is injured */
  jobEfficiencyMultiplier?: number;
  /** Whether the resident can join quests while in this tier */
  questEligibility?: 'full' | 'limited' | 'none';
  /** Optional multiplier applied to fatigue accumulation */
  fatigueGainMultiplier?: number;
  /** Optional Tailwind class for UI indicators */
  colorClass?: string;
}

/**
 * Global death rate config used by quest resolution when computing mortality.
 */
export interface DeathRules {
  /** Base probability of death at maximum danger before modifiers */
  baseDeathChanceAtMaxDanger: number;
  /** Additional death chance per point of activity danger */
  dangerDeathMultiplierPerPoint: number;
  /** Multipliers applied per injury tier id (light/moderate/severe, etc.) */
  injuryTierMultipliers?: Record<string, number>;
  /**
   * Optional adjustments keyed by quest outcome (e.g. success/partial/fail/deadly),
   * where the value is an additive modifier applied to the final death chance.
   */
  questOutcomeAdjustments?: Record<string, number>;
  /** Chance per in-game day that starving residents die */
  starvationDeathChancePerDay?: number;
}

export interface GlobalRules {
  // Fatigue / exhaustion
  maxFatigueBeforeExhausted: number;
  /**
   * Fallback fatigue gain applied to activities that do not define their own profile.
   */
  defaultActivityFatigueGain: number;
  /**
   * Initial fatigue applied to residents when they are seeded into a new run.
   * This value is clamped between 0 and maxFatigueBeforeExhausted.
   */
  startingResidentFatigue?: number;
  fatigueRecoveryPerDay: number;
  dayLengthInTimeUnits: number;
  /**
   * Optional day/night segmentation override. If omitted, day length applies to both phases.
   */
  dayNightCycle?: {
    dayTimeUnits: number;
    nightTimeUnits: number;
  };
  /** Optional override for how many ticks compose a full day (defaults to dayLengthInTimeUnits). */
  ticksPerDay?: number;
  /** Optional override for how many ticks compose a full night (defaults to dayNightCycle.nightTimeUnits or dayLengthInTimeUnits). */
  ticksPerNight?: number;
  /**
   * Ratio (0-1) indicating when residents should stop producing due to fatigue even if the job is still running.
   */
  productionHaltFatigueThreshold?: number;
  /**
   * Optional conversion factor for UI timers (seconds shown in VerbCard timers).
   * Defaults to 60 seconds per village time unit if omitted.
   */
  secondsPerTimeUnit?: number;
  fatigueYellowThreshold: number;
  fatigueRedThreshold: number;

  // Injury
  baseLightInjuryChanceAtMaxFatigue: number;
  dangerInjuryMultiplierPerPoint: number;
  /**
   * Injury severity tiers available in the simulation.
   * These drive UI hints and engine-side recovery windows.
   */
  injuryTiers: Record<string, InjuryTierDefinition>;
  /** Optional configuration for hard-death calculations */
  deathRules?: DeathRules;

  // Food economy
  /** How many units of food each non-dead resident consumes per in-game day */
  foodConsumptionPerResidentPerDay: number;
  /** Baseline price of 1 unit of food in gold (for early-game balancing) */
  baseFoodPriceInGold: number;

  /**
   * Optional starting resources for a new Idle Village run.
   * Keys are resource IDs and values are starting quantities.
   * If omitted, the engine starts with an empty resource map.
   */
  startingResources?: Record<string, number>;

  // Quest XP: expression using at least `level`
  questXpFormula: string;

  // Limits/constraints
  maxActiveQuests: number;

  // Quest spawning (config-driven)
  /** How often the quest spawner runs, in in-game days (>= 1). */
  questSpawnEveryNDays: number;
  /** Maximum number of quest offers that can be present globally at once. */
  maxGlobalQuestOffers: number;
  /** Maximum number of quest offers that can target the same map slot. */
  maxQuestOffersPerSlot: number;

  // Optional UI theme overrides for VerbCard ring colors (CSS color values).
  verbToneColors?: VerbToneColors;

  // Optional seed for deterministic generation (when desired)
  defaultRandomSeed?: number;

  /**
   * Optional Trial of Fire configuration used when processing high-risk survivals.
   */
  trialOfFire?: TrialOfFireRules;
}

export interface IdleVillageConfig {
  version: string;
  resources: Record<string, ResourceDefinition>;
  activities: Record<string, ActivityDefinition>;
  questTypes: Record<string, QuestTypeDefinition>;
  /**
   * Optional collection of quest blueprints that reference activities/slots.
   * Keeps multi-phase quest authoring config-first.
   */
  questBlueprints?: Record<string, QuestBlueprint>;
  mapSlots: Record<string, MapSlotDefinition>;
  mapLayout?: MapLayoutDefinition;
  passiveEffects: Record<string, PassiveEffectDefinition>;
  buildings: Record<string, import('./buildings').BuildingDefinition>;
  variance: ActivityVarianceConfig;
  globalRules: GlobalRules;
  overlaySettings: OverlaySettings;
  uiPreferences?: IdleVillageUiPreferences;
}

// =============================================================================
// ARCHIVE COMPLETE
// =============================================================================
// This archive contains the exact source code for the requested Idle Village files.
// Key files included:
// - MinimalGameplayPage.tsx (main gameplay component)
// - MapMiniCard.tsx (map display component)
// - ActivityCapsule.tsx (activity detail component)
// - PoiDetailSkinWrapper.tsx (skin wrapper component)
// - ActivityCardDetail.tsx (card detail component)
// - useResidentDropValidation.ts (drop validation hook)
// - useResidentSlotController.ts (slot controller hook)
// - useMinimalGameplay.ts (game state store - partial)
// - defaultConfig.ts (configuration - partial)
// - types.ts (type definitions - partial)
//
// Note: Some files are shown as partial due to length limits, but include all
// essential functionality for the Idle Village vertical slice.
// =============================================================================
