/**
 * MinimalActivityIntegration Page
 *
 * Integration test harness for complete gameplay loop.
 * Shows: DayNightComponent + ActivityCard + SlottedMedal + Timer + SkillCheck + Victory
 */

import React, { useState, useEffect, useCallback } from 'react';
import { DndContext, DragEndEvent } from '@dnd-kit/core';
import { DragProvider } from '@/ui/idleVillage/contexts/DragContext';
import { TooltipProvider } from '@/ui/idleVillage/contexts/TooltipContext';
import DayNightComponent from '@/ui/idleVillage/components/DayNightComponent';
import ActivityCard from '@/ui/idleVillage/components/ActivityCard';
import ActivityDetail from '@/ui/idleVillage/components/ActivityDetail';
import SkillCheckComponent from '@/ui/idleVillage/components/SkillCheckComponent';
import VictoryComponent from '@/ui/idleVillage/components/VictoryComponent';
import VillageRosterSection from '@/ui/idleVillage/components/VillageRosterSection';
import SlottedMedal from '@/ui/idleVillage/components/SlottedMedal';
import HaloProgressComponent from '@/ui/idleVillage/components/HaloProgressComponent';
import { useActivityCardState } from '@/ui/idleVillage/hooks/useActivityCardState';

// Mock resident data
const mockResidents = [
  { id: 'alice', name: 'Alice', rarity: 'rare', level: 5, stats: { strength: 12, wisdom: 14, dexterity: 10 } },
  { id: 'borin', name: 'Borin', rarity: 'common', level: 3, stats: { strength: 14, wisdom: 10, dexterity: 11 } },
  { id: 'cleric', name: 'Cleric', rarity: 'uncommon', level: 4, stats: { strength: 10, wisdom: 16, dexterity: 12 } },
  { id: 'david', name: 'David', rarity: 'rare', level: 5, stats: { strength: 13, wisdom: 11, dexterity: 15 } },
  { id: 'eva', name: 'Eva', rarity: 'common', level: 2, stats: { strength: 11, wisdom: 12, dexterity: 13 } },
];

interface ActivityData {
  id: string;
  name: string;
  type: 'job' | 'quest';
  occupancy: number;
  maxSlots: number;
  durationMs: number;
  skillCheckDC: number;
  description: string;
  rewards: Record<string, number>;
}

export default function MinimalActivityIntegration() {
  const [gameTime, setGameTime] = useState(0);
  const [resources, setResources] = useState({ wood: 30, gold: 50, food: 80, xp: 0 });
  const [assignedResidents, setAssignedResidents] = useState<Record<string, string>>({});

  // Activity card states
  const activity1 = useActivityCardState(0, 2);
  const activity2 = useActivityCardState(0, 2);
  const activity3 = useActivityCardState(0, 1);

  const [activities] = useState<ActivityData[]>([
    {
      id: 'job-1',
      name: 'Taglia Legna',
      type: 'job',
      occupancy: 0,
      maxSlots: 2,
      durationMs: 5000,
      skillCheckDC: 10,
      description: 'Cut wood from the forest',
      rewards: { wood: 15, xp: 50 },
    },
    {
      id: 'job-2',
      name: 'Miniera Oro',
      type: 'job',
      occupancy: 0,
      maxSlots: 2,
      durationMs: 7000,
      skillCheckDC: 12,
      description: 'Mine gold from the mountains',
      rewards: { gold: 25, xp: 75 },
    },
    {
      id: 'quest-1',
      name: 'Cattura Bestia',
      type: 'quest',
      occupancy: 0,
      maxSlots: 1,
      durationMs: 8000,
      skillCheckDC: 15,
      description: 'Capture the wild beast',
      rewards: { gold: 30, xp: 200 },
    },
  ]);

  // Game time progression
  useEffect(() => {
    const interval = setInterval(() => {
      setGameTime((t) => t + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Handle drag and drop
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    const residentId = active.data?.residentId;
    if (!residentId) return;

    const activityId = over.data?.activityId;
    if (!activityId) return;

    // Find activity state hook
    let activityState = null;
    if (activityId === 'job-1') activityState = activity1;
    else if (activityId === 'job-2') activityState = activity2;
    else if (activityId === 'quest-1') activityState = activity3;

    if (!activityState) return;

    // Assign resident
    setAssignedResidents((prev) => ({
      ...prev,
      [residentId]: activityId,
    }));

    activityState.assignResident(residentId);

    // Find activity config
    const activity = activities.find((a) => a.id === activityId);
    if (!activity) return;

    // Start timer
    activityState.startTimer(activity.durationMs);

    // Auto-trigger skill check on completion
    const timerHandle = setTimeout(() => {
      const resident = mockResidents.find((r) => r.id === residentId);
      if (!resident) return;

      // Simple skill calculation: base d20 + resident skill modifier
      const rolled = Math.floor(Math.random() * 20) + 1;
      const skill = (resident.stats.strength + resident.stats.wisdom) / 4; // Average of relevant stats
      activityState.triggerSkillCheck(rolled, Math.floor(skill), activity.skillCheckDC);

      // Show victory on success
      setTimeout(() => {
        if (activityState.data.skillCheckResult?.success) {
          activityState.showVictory(activity.name, activity.rewards);

          // Update resources
          setResources((prev) => ({
            ...prev,
            ...Object.fromEntries(
              Object.entries(activity.rewards).map(([k, v]) => [k, prev[k as keyof typeof prev] + v])
            ),
          }));
        }
      }, 2500);
    }, activity.durationMs);

    return () => clearTimeout(timerHandle);
  };

  const handleActivityClaim = (activityId: string) => {
    let activityState = null;
    if (activityId === 'job-1') activityState = activity1;
    else if (activityId === 'job-2') activityState = activity2;
    else if (activityId === 'quest-1') activityState = activity3;

    if (!activityState) return;

    activityState.claimVictory();

    // Clear assignment
    setAssignedResidents((prev) => {
      const filtered = { ...prev };
      Object.entries(filtered).forEach(([rid, aid]) => {
        if (aid === activityId) delete filtered[rid];
      });
      return filtered;
    });
  };

  return (
    <DndContext onDragEnd={handleDragEnd}>
      <DragProvider>
        <TooltipProvider>
          <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
            {/* Header */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '20px',
                borderBottom: '2px solid #ddd',
                paddingBottom: '10px',
              }}
            >
              <h1 style={{ margin: 0 }}>Minimal Activity Integration</h1>
              <DayNightComponent currentTick={gameTime} ticksPerDay={86400} />
            </div>

            {/* Status HUD */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '10px',
                marginBottom: '20px',
                padding: '10px',
                backgroundColor: '#f0f0f0',
                borderRadius: '4px',
              }}
            >
              <div>Wood: {resources.wood}</div>
              <div>Gold: {resources.gold}</div>
              <div>Food: {resources.food}</div>
              <div>XP: {resources.xp}</div>
            </div>

            {/* Main layout */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '20px' }}>
              {/* Roster */}
              <div style={{ border: '1px solid #ddd', padding: '10px', borderRadius: '4px' }}>
                <h3>Roster</h3>
                <VillageRosterSection
                  residents={mockResidents}
                  onDragStart={() => {}}
                  showStats={true}
                  enableDragDrop={true}
                  sortMode="name-asc"
                />
              </div>

              {/* Activities */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {activities.map((activity, idx) => {
                  const state =
                    idx === 0 ? activity1.data :
                    idx === 1 ? activity2.data :
                    activity3.data;

                  const handlers =
                    idx === 0 ? activity1 :
                    idx === 1 ? activity2 :
                    activity3;

                  return (
                    <ActivityCard
                      key={activity.id}
                      activityId={activity.id}
                      title={activity.name}
                      type={activity.type}
                      occupancy={state.occupancy}
                      maxSlots={activity.maxSlots}
                      icon={activity.type === 'job' ? '⚙️' : '⚔️'}
                    >
                      {/* Expanded content */}
                      <div style={{ padding: '10px 0' }}>
                        <ActivityDetail
                          activityId={activity.id}
                          activityName={activity.name}
                          activityType={activity.type}
                          description={activity.description}
                          skillCheckDC={activity.skillCheckDC}
                          slots={[
                            { id: `${activity.id}-slot-1`, occupied: state.occupancy >= 1, residentId: undefined },
                            { id: `${activity.id}-slot-2`, occupied: state.occupancy >= 2, residentId: undefined },
                          ]}
                          rewards={activity.rewards}
                        />

                        {/* Progress bar */}
                        {state.state === 'timer' && (
                          <div style={{ marginTop: '10px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <HaloProgressComponent
                              progress={state.timerProgress}
                              size={60}
                              medalType="gold"
                              label={`${Math.round(state.timerProgress * 100)}%`}
                            />
                            <span>Activity in progress...</span>
                          </div>
                        )}

                        {/* Skill check overlay */}
                        {state.state === 'skill_check' && state.skillCheckResult && (
                          <div style={{ marginTop: '10px', padding: '10px', backgroundColor: '#f9f9f9', borderRadius: '4px' }}>
                            <SkillCheckComponent
                              dcTarget={state.skillCheckResult.dc}
                              residentSkill={state.skillCheckResult.skill}
                              activityName={activity.name}
                              autoStart={false}
                            />
                            <div style={{ marginTop: '10px', fontSize: '12px' }}>
                              Rolled: {state.skillCheckResult.rolled} + {Math.floor(state.skillCheckResult.skill)} = {state.skillCheckResult.total} vs DC {state.skillCheckResult.dc}
                              {state.skillCheckResult.success ? ' ✅ SUCCESS' : ' ❌ FAILED'}
                            </div>
                          </div>
                        )}

                        {/* Victory overlay */}
                        {state.state === 'awaiting_claim' && state.victory && (
                          <div style={{ marginTop: '10px' }}>
                            <VictoryComponent
                              questTitle={state.victory.title}
                              rewards={state.victory.rewards}
                              onDismiss={() => handleActivityClaim(activity.id)}
                              autoClose={false}
                            />
                          </div>
                        )}
                      </div>
                    </ActivityCard>
                  );
                })}
              </div>
            </div>

            {/* Debug panel */}
            <div
              style={{
                marginTop: '20px',
                padding: '10px',
                backgroundColor: '#f0f0f0',
                borderRadius: '4px',
                fontSize: '12px',
                fontFamily: 'monospace',
              }}
            >
              <h4>Debug Info</h4>
              <div>Game Time: {gameTime}s</div>
              <div>Activity 1 State: {activity1.data.state}</div>
              <div>Activity 2 State: {activity2.data.state}</div>
              <div>Activity 3 State: {activity3.data.state}</div>
              <div>Assignments: {JSON.stringify(assignedResidents, null, 2)}</div>
            </div>
          </div>
        </TooltipProvider>
      </DragProvider>
    </DndContext>
  );
}
