import { useState } from 'react';
import { DndContext } from '@dnd-kit/core';
import { DayNightPoiSkin, GenericPoiSkin, JobPOI, ActivityPOI, QuestPOI } from '@/ui/idleVillage/frozen/kits/poiKit';
import type { JobStatus, ActivityStatus, QuestStatus, QuestPOIPhase } from '@/ui/idleVillage/frozen/kits/poiKit';
import { SkinSystemProvider } from '@/ui/idleVillage/hooks/useSkinSystem';
import { SandboxTimingProvider } from '@/ui/idleVillage/hooks/useSandboxTimingBridge';
import { DEFAULT_IDLE_VILLAGE_CONFIG } from '@/balancing/config/idleVillage/defaultConfig';

const getActivityIcon = (activityId: string): string => {
  const activity = DEFAULT_IDLE_VILLAGE_CONFIG.activities[activityId];
  return (activity?.metadata?.icon as string | undefined) ?? '⚔️';
};

export default function MinimalPoiPage() {
  const [jobStatus, setJobStatus] = useState<JobStatus>('idle');
  const [jobFatigue, setJobFatigue] = useState(0);
  const [activityStatus, setActivityStatus] = useState<ActivityStatus>('idle');
  const [activityProgress, setActivityProgress] = useState(0);
  const [questStatus, setQuestStatus] = useState<QuestStatus>('available');
  const [questPhaseIdx, setQuestPhaseIdx] = useState(0);

  const questPhases: QuestPOIPhase[] = [
    { id: 'p1', state: questPhaseIdx > 0 ? 'success' : questStatus === 'available' ? 'locked' : 'active' },
    { id: 'p2', state: questPhaseIdx > 1 ? 'success' : questPhaseIdx === 1 ? 'active' : 'locked' },
    { id: 'p3', state: questPhaseIdx > 2 ? 'success' : questPhaseIdx === 2 ? 'active' : 'locked' },
    { id: 'p4', state: questStatus === 'failed' ? 'failure' : questPhaseIdx === 3 ? 'active' : 'locked' },
  ];

  return (
    <SkinSystemProvider>
      <SandboxTimingProvider>
        <div data-testid="minimal-poi-page" className="min-h-screen bg-slate-950 p-8 text-ivory">
          <div className="mx-auto max-w-6xl space-y-12">
            {/* Header */}
            <header>
              <p className="text-[10px] uppercase tracking-[0.45em] text-amber-200/70">Minimal Slice · POI</p>
              <h1 className="text-3xl font-semibold tracking-[0.2em] text-amber-100">POI CIRCULAR MEDALLIONS</h1>
              <p className="mt-1 text-sm text-slate-400">Core POI Architecture — Reusable Skin Components</p>
              <p className="mt-2 text-xs text-slate-500">Route: /minimal-poi</p>
            </header>

            {/* DayNightPoiSkin Showcase */}
            <section>
              <div className="mb-4">
                <h2 className="text-sm font-semibold text-amber-200 uppercase tracking-wider">Day/Night POI</h2>
                <p className="text-xs text-slate-400 mt-1">World-state temporal cycle indicator</p>
              </div>
              <div className="flex items-center justify-center h-48 bg-slate-900/30 border border-slate-700/50 rounded-lg">
                <DayNightPoiSkin
                  isDayPhase={true}
                  cycleProgress={0.65}
                  isPaused={false}
                />
              </div>
            </section>

            {/* GenericPoiSkin Examples */}
            <section>
              <div className="mb-6">
                <h2 className="text-sm font-semibold text-amber-200 uppercase tracking-wider">Activity POI (Generic Skin)</h2>
                <p className="text-xs text-slate-400 mt-1">Customizable medallions for jobs, quests, locations</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Job POI - Wilderness */}
                <div className="space-y-4">
                  <div className="flex items-center justify-center h-80 bg-slate-900/30 border border-slate-700/50 rounded-lg">
                    <GenericPoiSkin
                      icon="🪓"
                      label="Chop Wood"
                      progress={0.65}
                      coronaCore={{ r: 139, g: 105, b: 20 }}
                      coronaGlow={{ r: 180, g: 140, b: 40 }}
                      rimColors={['#fce890', '#c09030', '#200e02']}
                      stoneColors={['#1e1608', '#030202']}
                      stoneAmbient="rgba(255,220,120,.22)"
                      pinColor="rgba(205,190,148,.72)"
                      pillar="wilderness"
                      size={160}
                    />
                  </div>
                  <div className="text-xs text-slate-400 space-y-1">
                    <p>Type: <span className="text-amber-300">Job</span></p>
                    <p>Pillar: <span className="text-green-400">Wilderness</span></p>
                    <p>Progress: 65%</p>
                  </div>
                </div>

                {/* Quest POI - Empire */}
                <div className="space-y-4">
                  <div className="flex items-center justify-center h-80 bg-slate-900/30 border border-slate-700/50 rounded-lg">
                    <GenericPoiSkin
                      icon="⚔️"
                      label="Bandits"
                      progress={0.35}
                      coronaCore={{ r: 220, g: 170, b: 40 }}
                      coronaGlow={{ r: 200, g: 150, b: 20 }}
                      rimColors={['#fce890', '#c09030', '#200e02']}
                      stoneColors={['#1e1608', '#030202']}
                      stoneAmbient="rgba(255,220,120,.22)"
                      pinColor="rgba(205,190,148,.72)"
                      pillar="empire"
                      size={160}
                    />
                  </div>
                  <div className="text-xs text-slate-400 space-y-1">
                    <p>Type: <span className="text-orange-300">Quest</span></p>
                    <p>Pillar: <span className="text-yellow-500">Empire</span></p>
                    <p>Progress: 35%</p>
                  </div>
                </div>

                {/* Exploration POI - Frontier */}
                <div className="space-y-4">
                  <div className="flex items-center justify-center h-80 bg-slate-900/30 border border-slate-700/50 rounded-lg">
                    <GenericPoiSkin
                      icon="🔍"
                      label="Explore"
                      progress={0.0}
                      coronaCore={{ r: 91, g: 157, b: 213 }}
                      coronaGlow={{ r: 112, g: 173, b: 71 }}
                      rimColors={['#fce890', '#c09030', '#200e02']}
                      stoneColors={['#1e1608', '#030202']}
                      stoneAmbient="rgba(255,220,120,.22)"
                      pinColor="rgba(205,190,148,.72)"
                      pillar="frontier"
                      size={160}
                    />
                  </div>
                  <div className="text-xs text-slate-400 space-y-1">
                    <p>Type: <span className="text-teal-300">Quest</span></p>
                    <p>Pillar: <span className="text-teal-400">Frontier</span></p>
                    <p>Progress: 0%</p>
                  </div>
                </div>
              </div>
            </section>

            {/* Interactive States */}
            <section>
              <div className="mb-6">
                <h2 className="text-sm font-semibold text-amber-200 uppercase tracking-wider">Interactive States</h2>
                <p className="text-xs text-slate-400 mt-1">Hover for scale + glow, completed state with gray colors</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Hover State */}
                <div className="space-y-4">
                  <div className="flex items-center justify-center h-80 bg-slate-900/30 border border-slate-700/50 rounded-lg">
                    <GenericPoiSkin
                      icon="🪓"
                      label="Hover Me"
                      progress={0.5}
                      coronaCore={{ r: 139, g: 105, b: 20 }}
                      coronaGlow={{ r: 180, g: 140, b: 40 }}
                      rimColors={['#fce890', '#c09030', '#200e02']}
                      stoneColors={['#1e1608', '#030202']}
                      stoneAmbient="rgba(255,220,120,.22)"
                      pinColor="rgba(205,190,148,.72)"
                      pillar="wilderness"
                      size={160}
                      enableHover={true}
                    />
                  </div>
                  <div className="text-xs text-slate-400 space-y-1">
                    <p>State: <span className="text-amber-300">Hover Enabled</span></p>
                    <p>Effect: <span className="text-green-400">5% scale + golden glow</span></p>
                  </div>
                </div>

                {/* Completed State */}
                <div className="space-y-4">
                  <div className="flex items-center justify-center h-80 bg-slate-900/30 border border-slate-700/50 rounded-lg">
                    <GenericPoiSkin
                      icon="⚔️"
                      label="Completed"
                      progress={1.0}
                      coronaCore={{ r: 220, g: 170, b: 40 }}
                      coronaGlow={{ r: 200, g: 150, b: 20 }}
                      rimColors={['#fce890', '#c09030', '#200e02']}
                      stoneColors={['#1e1608', '#030202']}
                      stoneAmbient="rgba(255,220,120,.22)"
                      pinColor="rgba(205,190,148,.72)"
                      pillar="empire"
                      size={160}
                      isCompleted={true}
                    />
                  </div>
                  <div className="text-xs text-slate-400 space-y-1">
                    <p>State: <span className="text-orange-300">Completed</span></p>
                    <p>Effect: <span className="text-gray-400">Gray corona + icon</span></p>
                  </div>
                </div>
              </div>
            </section>

            {/* Scale Test */}
            <section>
              <div className="mb-6">
                <h2 className="text-sm font-semibold text-amber-200 uppercase tracking-wider">Scale Test (Border Thickness)</h2>
                <p className="text-xs text-slate-400 mt-1">Small sizes get thicker borders to prevent flat appearance</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                {/* 40px */}
                <div className="space-y-4">
                  <div className="flex items-center justify-center h-40 bg-slate-900/30 border border-slate-700/50 rounded-lg">
                    <GenericPoiSkin
                      icon="🪓"
                      label="40px"
                      progress={0.5}
                      coronaCore={{ r: 139, g: 105, b: 20 }}
                      coronaGlow={{ r: 180, g: 140, b: 40 }}
                      rimColors={['#fce890', '#c09030', '#200e02']}
                      stoneColors={['#1e1608', '#030202']}
                      stoneAmbient="rgba(255,220,120,.22)"
                      pinColor="rgba(205,190,148,.72)"
                      pillar="wilderness"
                      size={40}
                    />
                  </div>
                  <div className="text-xs text-slate-400 space-y-1">
                    <p>Size: <span className="text-amber-300">40px</span></p>
                    <p>Border: <span className="text-green-400">+80% thickness</span></p>
                  </div>
                </div>

                {/* 60px */}
                <div className="space-y-4">
                  <div className="flex items-center justify-center h-40 bg-slate-900/30 border border-slate-700/50 rounded-lg">
                    <GenericPoiSkin
                      icon="⚔️"
                      label="60px"
                      progress={0.5}
                      coronaCore={{ r: 220, g: 170, b: 40 }}
                      coronaGlow={{ r: 200, g: 150, b: 20 }}
                      rimColors={['#fce890', '#c09030', '#200e02']}
                      stoneColors={['#1e1608', '#030202']}
                      stoneAmbient="rgba(255,220,120,.22)"
                      pinColor="rgba(205,190,148,.72)"
                      pillar="empire"
                      size={60}
                    />
                  </div>
                  <div className="text-xs text-slate-400 space-y-1">
                    <p>Size: <span className="text-orange-300">60px</span></p>
                    <p>Border: <span className="text-green-400">+40% thickness</span></p>
                  </div>
                </div>

                {/* 80px */}
                <div className="space-y-4">
                  <div className="flex items-center justify-center h-40 bg-slate-900/30 border border-slate-700/50 rounded-lg">
                    <GenericPoiSkin
                      icon="🔍"
                      label="80px"
                      progress={0.5}
                      coronaCore={{ r: 91, g: 157, b: 213 }}
                      coronaGlow={{ r: 112, g: 173, b: 71 }}
                      rimColors={['#fce890', '#c09030', '#200e02']}
                      stoneColors={['#1e1608', '#030202']}
                      stoneAmbient="rgba(255,220,120,.22)"
                      pinColor="rgba(205,190,148,.72)"
                      pillar="frontier"
                      size={80}
                    />
                  </div>
                  <div className="text-xs text-slate-400 space-y-1">
                    <p>Size: <span className="text-teal-300">80px</span></p>
                    <p>Border: <span className="text-green-400">+20% thickness</span></p>
                  </div>
                </div>

                {/* 160px (default) */}
                <div className="space-y-4">
                  <div className="flex items-center justify-center h-40 bg-slate-900/30 border border-slate-700/50 rounded-lg">
                    <GenericPoiSkin
                      icon="🗺"
                      label="160px"
                      progress={0.5}
                      coronaCore={{ r: 210, g: 138, b: 28 }}
                      coronaGlow={{ r: 180, g: 105, b: 10 }}
                      rimColors={['#fce890', '#c09030', '#200e02']}
                      stoneColors={['#1e1608', '#030202']}
                      stoneAmbient="rgba(255,220,120,.22)"
                      pinColor="rgba(205,190,148,.72)"
                      pillar="wilderness"
                      size={160}
                    />
                  </div>
                  <div className="text-xs text-slate-400 space-y-1">
                    <p>Size: <span className="text-amber-300">160px</span></p>
                    <p>Border: <span className="text-green-400">Default thickness</span></p>
                  </div>
                </div>
              </div>
            </section>

            {/* ============================================================ */}
            {/* TYPED POI VARIANTS */}
            {/* ============================================================ */}

            {/* JobPOI — Typed Variant */}
            <section>
              <div className="mb-6">
                <h2 className="text-sm font-semibold text-amber-200 uppercase tracking-wider">Job POI — Typed Variant</h2>
                <p className="text-xs text-slate-400 mt-1">Wilderness · continuous cycle · fatigue drain · dnd-kit drop zone</p>
                <p className="text-xs text-slate-500 mt-1">Palette resolved from <code className="text-amber-300/70">jobPoiSkinConfig.ts</code> — zero raw color props</p>
              </div>

              <DndContext>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {/* Idle */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-center min-h-56 bg-slate-900/30 border border-slate-700/50 rounded-lg p-4">
                      <JobPOI
                        activityId="chop-wood-demo"
                        label="Chop Wood"
                        icon="🪓"
                        status="idle"
                        progress={0}
                        rewardLabel="🪵 +8/h"
                        size={120}
                      />
                    </div>
                    <div className="text-xs text-slate-400 space-y-1">
                      <p>Status: <span className="text-slate-300">idle</span></p>
                    </div>
                  </div>

                  {/* Working */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-center min-h-56 bg-slate-900/30 border border-slate-700/50 rounded-lg p-4">
                      <JobPOI
                        activityId="farm-demo"
                        label="Farm Fields"
                        icon="🌾"
                        status="working"
                        progress={0.65}
                        rewardLabel="🌾 +12/h"
                        size={120}
                      />
                    </div>
                    <div className="text-xs text-slate-400 space-y-1">
                      <p>Status: <span className="text-amber-300">working</span></p>
                    </div>
                  </div>

                  {/* Exhausted */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-center min-h-56 bg-slate-900/30 border border-slate-700/50 rounded-lg p-4">
                      <JobPOI
                        activityId="mine-demo"
                        label="Mine Stone"
                        icon="⛏️"
                        status="exhausted"
                        progress={0.1}
                        rewardLabel="🪨 +5/h"
                        size={120}
                      />
                    </div>
                    <div className="text-xs text-slate-400 space-y-1">
                      <p>Status: <span className="text-red-400">exhausted</span></p>
                    </div>
                  </div>
                </div>

                {/* Interactive demo */}
                <div className="mt-6 bg-slate-900/50 border border-slate-700/40 rounded-lg p-4">
                  <p className="text-xs text-amber-200/60 uppercase tracking-widest mb-3">Interactive Demo</p>
                  <div className="flex flex-wrap gap-3 items-start">
                    <div className="flex gap-2">
                      {(['idle', 'working', 'exhausted'] as JobStatus[]).map((s) => (
                        <button
                          key={s}
                          onClick={() => {
                            setJobStatus(s);
                            setJobFatigue(s === 'working' ? 55 : s === 'exhausted' ? 92 : 0);
                          }}
                          className="px-3 py-1 rounded text-xs font-medium transition-colors"
                          style={{
                            background: jobStatus === s ? 'rgba(251,191,36,.20)' : 'rgba(30,41,59,.60)',
                            border: jobStatus === s ? '1px solid rgba(251,191,36,.50)' : '1px solid rgba(71,85,105,.40)',
                            color: jobStatus === s ? 'rgba(251,191,36,.90)' : 'rgba(148,163,184,.70)',
                          }}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                    <div className="flex items-center justify-center">
                      <JobPOI
                        activityId="interactive-job"
                        label="Interactive"
                        icon="🔨"
                        status={jobStatus}
                        progress={jobStatus === 'working' ? 0.7 : 0.1}
                        rewardLabel="🪵 +10/h"
                        size={100}
                      />
                    </div>
                  </div>
                </div>
              </DndContext>
            </section>

            {/* ActivityPOI — Typed Variant */}
            <section>
              <div className="mb-6">
                <h2 className="text-sm font-semibold text-amber-200 uppercase tracking-wider">Activity POI — Typed Variant</h2>
                <p className="text-xs text-slate-400 mt-1">Frontier/Empire · one-shot timer · risk badge · status lifecycle</p>
                <p className="text-xs text-slate-500 mt-1">Palette resolved from <code className="text-amber-300/70">activityPoiSkinConfig.ts</code></p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Frontier idle */}
                <div className="space-y-4">
                  <div className="flex items-center justify-center min-h-56 bg-slate-900/30 border border-slate-700/50 rounded-lg p-4">
                    <ActivityPOI
                      activityId="scouting-demo"
                      label="Scout Region"
                      icon="🔭"
                      pillar="frontier"
                      status="idle"
                      progress={0}
                      dangerRating={2}
                      size={120}
                    />
                  </div>
                  <div className="text-xs text-slate-400 space-y-1">
                    <p>Pillar: <span className="text-teal-400">frontier</span></p>
                    <p>Status: <span className="text-slate-300">idle</span></p>
                    <p>Risk: <span className="text-green-400">2/10 low</span></p>
                  </div>
                </div>

                {/* Frontier in-progress */}
                <div className="space-y-4">
                  <div className="flex items-center justify-center min-h-56 bg-slate-900/30 border border-slate-700/50 rounded-lg p-4">
                    <ActivityPOI
                      activityId="training-demo"
                      label="Combat Training"
                      icon="🗡️"
                      pillar="frontier"
                      status="in-progress"
                      progress={0.55}
                      timeRemainingMs={142000}
                      dangerRating={4}
                      size={120}
                    />
                  </div>
                  <div className="text-xs text-slate-400 space-y-1">
                    <p>Pillar: <span className="text-teal-400">frontier</span></p>
                    <p>Status: <span className="text-amber-300">in-progress</span></p>
                    <p>Timer: <span className="text-teal-300">2m 22s remaining</span></p>
                  </div>
                </div>

                {/* Empire maintenance */}
                <div className="space-y-4">
                  <div className="flex items-center justify-center min-h-56 bg-slate-900/30 border border-slate-700/50 rounded-lg p-4">
                    <ActivityPOI
                      activityId="garrison-demo"
                      label="Garrison Duty"
                      icon="🏰"
                      pillar="empire"
                      status="completed"
                      progress={1.0}
                      dangerRating={7}
                      size={120}
                    />
                  </div>
                  <div className="text-xs text-slate-400 space-y-1">
                    <p>Pillar: <span className="text-yellow-400">empire</span></p>
                    <p>Status: <span className="text-green-400">completed</span></p>
                    <p>Risk: <span className="text-red-400">7/10 high</span></p>
                  </div>
                </div>
              </div>

              {/* Interactive demo */}
              <div className="mt-6 bg-slate-900/50 border border-slate-700/40 rounded-lg p-4">
                <p className="text-xs text-amber-200/60 uppercase tracking-widest mb-3">Interactive Demo</p>
                <div className="flex flex-wrap gap-3 items-start">
                  <div className="flex gap-2">
                    {(['idle', 'in-progress', 'completed', 'blocked'] as ActivityStatus[]).map((s) => (
                      <button
                        key={s}
                        onClick={() => {
                          setActivityStatus(s);
                          setActivityProgress(s === 'in-progress' ? 0.45 : s === 'completed' ? 1.0 : 0);
                        }}
                        className="px-3 py-1 rounded text-xs font-medium transition-colors"
                        style={{
                          background: activityStatus === s ? 'rgba(94,234,212,.15)' : 'rgba(30,41,59,.60)',
                          border: activityStatus === s ? '1px solid rgba(94,234,212,.45)' : '1px solid rgba(71,85,105,.40)',
                          color: activityStatus === s ? 'rgba(94,234,212,.90)' : 'rgba(148,163,184,.70)',
                        }}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                  <div className="flex items-center justify-center">
                    <ActivityPOI
                      activityId="interactive-activity"
                      label="Interactive"
                      icon="⚡"
                      pillar="frontier"
                      status={activityStatus}
                      progress={activityProgress}
                      timeRemainingMs={activityStatus === 'in-progress' ? 88000 : undefined}
                      dangerRating={5}
                      size={100}
                    />
                  </div>
                </div>
              </div>
            </section>

            {/* QuestPOI — Typed Variant */}
            <section>
              <div className="mb-6">
                <h2 className="text-sm font-semibold text-amber-200 uppercase tracking-wider">Quest POI — Typed Variant</h2>
                <p className="text-xs text-slate-400 mt-1">Empire · multi-phase narrative · phase dot row · opens QuestChronicle on click</p>
                <p className="text-xs text-slate-500 mt-1">Palette resolved from <code className="text-amber-300/70">questPoiSkinConfig.ts</code></p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Available */}
                <div className="space-y-4">
                  <div className="flex items-center justify-center min-h-56 bg-slate-900/30 border border-slate-700/50 rounded-lg p-4">
                    <QuestPOI
                      questId="bandit-camp-demo"
                      label={DEFAULT_IDLE_VILLAGE_CONFIG.activities['bandit-camp-demo']?.label ?? 'Bandit Camp'}
                      icon={getActivityIcon('bandit-camp-demo')}
                      status="available"
                      phases={[
                        { id: 'p1', state: 'locked' },
                        { id: 'p2', state: 'locked' },
                        { id: 'p3', state: 'locked' },
                      ]}
                      currentPhaseIndex={0}
                      progress={0}
                      dangerRating={DEFAULT_IDLE_VILLAGE_CONFIG.activities['bandit-camp-demo']?.dangerRating ?? 6}
                      size={120}
                    />
                  </div>
                  <div className="text-xs text-slate-400 space-y-1">
                    <p>Status: <span className="text-slate-300">available</span></p>
                    <p>Phases: <span className="text-slate-500">3 locked</span></p>
                    <p>Risk: <span className="text-amber-400">6/10 moderate</span></p>
                  </div>
                </div>

                {/* In progress */}
                <div className="space-y-4">
                  <div className="flex items-center justify-center min-h-56 bg-slate-900/30 border border-slate-700/50 rounded-lg p-4">
                    <QuestPOI
                      questId="ancient-ruins"
                      label={DEFAULT_IDLE_VILLAGE_CONFIG.activities['ancient-ruins']?.label ?? 'Ancient Ruins'}
                      icon={getActivityIcon('ancient-ruins')}
                      status="in_progress"
                      phases={[
                        { id: 'p1', state: 'success' },
                        { id: 'p2', state: 'active' },
                        { id: 'p3', state: 'locked' },
                        { id: 'p4', state: 'locked' },
                      ]}
                      currentPhaseIndex={1}
                      progress={0.40}
                      dangerRating={DEFAULT_IDLE_VILLAGE_CONFIG.activities['ancient-ruins']?.dangerRating ?? 8}
                      size={120}
                    />
                  </div>
                  <div className="text-xs text-slate-400 space-y-1">
                    <p>Status: <span className="text-amber-300">in_progress</span></p>
                    <p>Phase 2: <span className="text-amber-400">active (1 success)</span></p>
                    <p>Risk: <span className="text-red-400">8/10 high</span></p>
                  </div>
                </div>

                {/* Completed */}
                <div className="space-y-4">
                  <div className="flex items-center justify-center min-h-56 bg-slate-900/30 border border-slate-700/50 rounded-lg p-4">
                    <QuestPOI
                      questId="dragon-lair-demo"
                      label="Dragon Lair"
                      icon="🐉"
                      status="completed"
                      phases={[
                        { id: 'p1', state: 'success' },
                        { id: 'p2', state: 'success' },
                        { id: 'p3', state: 'success' },
                      ]}
                      currentPhaseIndex={2}
                      progress={1.0}
                      dangerRating={10}
                      size={120}
                    />
                  </div>
                  <div className="text-xs text-slate-400 space-y-1">
                    <p>Status: <span className="text-green-400">completed — Victory</span></p>
                    <p>Phases: <span className="text-green-400">3/3 success</span></p>
                    <p>Risk: <span className="text-red-500">10/10 max</span></p>
                  </div>
                </div>
              </div>

              {/* Interactive demo */}
              <div className="mt-6 bg-slate-900/50 border border-slate-700/40 rounded-lg p-4">
                <p className="text-xs text-amber-200/60 uppercase tracking-widest mb-3">Interactive Demo — Phase Progression</p>
                <div className="flex flex-wrap gap-3 items-start">
                  <div className="flex flex-col gap-2">
                    <div className="flex gap-2">
                      {(['available', 'in_progress', 'completed', 'failed'] as QuestStatus[]).map((s) => (
                        <button
                          key={s}
                          onClick={() => {
                            setQuestStatus(s);
                            setQuestPhaseIdx(s === 'in_progress' ? 1 : s === 'completed' ? 3 : 0);
                          }}
                          className="px-3 py-1 rounded text-xs font-medium transition-colors"
                          style={{
                            background: questStatus === s ? 'rgba(248,113,113,.15)' : 'rgba(30,41,59,.60)',
                            border: questStatus === s ? '1px solid rgba(248,113,113,.45)' : '1px solid rgba(71,85,105,.40)',
                            color: questStatus === s ? 'rgba(248,113,113,.90)' : 'rgba(148,163,184,.70)',
                          }}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                    {questStatus === 'in_progress' && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => setQuestPhaseIdx((p) => Math.max(0, p - 1))}
                          className="px-2 py-1 rounded text-xs"
                          style={{ background: 'rgba(30,41,59,.80)', border: '1px solid rgba(71,85,105,.50)', color: 'rgba(148,163,184,.80)' }}
                        >
                          ← Prev phase
                        </button>
                        <button
                          onClick={() => setQuestPhaseIdx((p) => Math.min(3, p + 1))}
                          className="px-2 py-1 rounded text-xs"
                          style={{ background: 'rgba(30,41,59,.80)', border: '1px solid rgba(71,85,105,.50)', color: 'rgba(148,163,184,.80)' }}
                        >
                          Next phase →
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center justify-center">
                    <QuestPOI
                      questId="interactive-quest"
                      label="Interactive"
                      icon="🗺️"
                      status={questStatus}
                      phases={questPhases}
                      currentPhaseIndex={questPhaseIdx}
                      progress={questStatus === 'in_progress' ? questPhaseIdx / 4 : questStatus === 'completed' ? 1.0 : 0}
                      dangerRating={7}
                      size={100}
                    />
                  </div>
                </div>
              </div>
            </section>

            {/* Architecture Documentation */}
            <section className="bg-slate-900/30 border border-slate-700/50 rounded-lg p-6">
              <h2 className="text-sm font-semibold text-amber-200 mb-4 uppercase tracking-wider">Architecture</h2>

              <div className="space-y-6 text-xs text-slate-300">
                <div>
                  <p className="text-amber-200/70 font-semibold mb-2">DayNightPoiSkin</p>
                  <p className="text-slate-400">src/ui/idleVillage/components/minimal/DayNightPoiSkin.tsx</p>
                  <p className="text-slate-500 mt-1">World-state POI showing day/night cycle. Props: isDayPhase, cycleProgress, isPaused. Reads skin config from useSkinPreferences().</p>
                </div>

                <div>
                  <p className="text-amber-200/70 font-semibold mb-2">GenericPoiSkin</p>
                  <p className="text-slate-400">src/ui/idleVillage/components/minimal/GenericPoiSkin.tsx</p>
                  <p className="text-slate-500 mt-1">Base SVG medallion. Raw color props. Used internally by typed variants — prefer JobPOI / ActivityPOI / QuestPOI in product code.</p>
                </div>

                <div>
                  <p className="text-amber-200/70 font-semibold mb-2">Typed POI Variants (NEW)</p>
                  <p className="text-slate-400">JobPOI · ActivityPOI · QuestPOI</p>
                  <p className="text-slate-500 mt-1">Config-first wrappers that resolve colors from domain-specific skin config files. Each variant has a fixed pillar, typed status enum, and domain-specific overlays (fatigue bar, timer, phase dots). Zero raw color props exposed.</p>
                  <div className="text-slate-500 space-y-1 pl-4 border-l border-slate-600 mt-2">
                    <p>• JobPOI → jobPoiSkinConfig.ts · Wilderness · drop zone (dnd-kit)</p>
                    <p>• ActivityPOI → activityPoiSkinConfig.ts · Frontier/Empire · timer + risk badge</p>
                    <p>• QuestPOI → questPoiSkinConfig.ts · Empire · phase dots + danger badge</p>
                  </div>
                </div>

                <div>
                  <p className="text-amber-200/70 font-semibold mb-2">SVG Structure (both)</p>
                  <div className="text-slate-500 space-y-1 pl-4 border-l border-slate-600">
                    <p>• Layer 1: Dark base ring (boundary + clip)</p>
                    <p>• Layer 2: Bloom layer (radial gradient + blur)</p>
                    <p>• Layer 3: Outer guide ring</p>
                    <p>• Layer 4: Progress halo track + animated arc</p>
                    <p>• Layer 5: Core medallion (bronze plating)</p>
                    <p>• Layer 6: Icon slot (SVG or emoji)</p>
                  </div>
                </div>

                <div>
                  <p className="text-amber-200/70 font-semibold mb-2">Customization Points</p>
                  <div className="text-slate-500 space-y-1 pl-4 border-l border-slate-600">
                    <p>• Icon: emoji, SVG path, or React element</p>
                    <p>• Colors: ringColor, glowColor, coreColor per pillar</p>
                    <p>• Progress: animated stroke-dasharray (0-1)</p>
                    <p>• Bloom: intensity multiplier for visual weight</p>
                    <p>• State: isPaused fades icon and reduces glow</p>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>
      </SandboxTimingProvider>
    </SkinSystemProvider>
  );
}
