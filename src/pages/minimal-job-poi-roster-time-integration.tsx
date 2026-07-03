import { useState } from 'react';
import { DndContext } from '@dnd-kit/core';
import { GenericPoiSkin } from '@/ui/idleVillage/components/minimal/GenericPoiSkin';
import { JobPOI } from '@/ui/idleVillage/components/minimal/JobPOI';
import { RosterDraggable } from '@/ui/idleVillage/frozen/kits/rosterKit';
import { SkinSystemProvider } from '@/ui/idleVillage/hooks/useSkinSystem';
import { SandboxTimingProvider } from '@/ui/idleVillage/hooks/useSandboxTimingBridge';
import DayNightPoiSkin from '@/ui/idleVillage/components/minimal/DayNightPoiSkin';

export default function MinimalJobPoiRosterTimeIntegrationPage() {
  const [jobStatus, setJobStatus] = useState<'idle' | 'working' | 'completed'>('idle');
  const [jobFatigue, setJobFatigue] = useState(0);
  const [isDayPhase, setIsDayPhase] = useState(true);
  const [cycleProgress, setCycleProgress] = useState(0.65);

  return (
    <SkinSystemProvider>
      <SandboxTimingProvider>
        <div data-testid="minimal-job-poi-roster-time-integration-page" className="min-h-screen bg-slate-950 p-8 text-ivory">
          <div className="mx-auto max-w-6xl space-y-8">
            <header>
              <p className="text-[10px] uppercase tracking-[0.45em] text-amber-200/70">Minimal Slice · Job POI + Roster + Time</p>
              <h1 className="text-2xl font-semibold tracking-[0.2em] text-amber-100">JOB POI + ROSTER + TIME INTEGRATION</h1>
              <p className="mt-1 text-sm text-slate-400">Canonical components from TestHub</p>
              <p className="mt-2 text-xs text-slate-500">Route: /minimal-job-poi-roster-time-integration</p>
            </header>

            {/* Day/Night Cycle */}
            <div className="bg-slate-900/30 border border-slate-700/50 rounded-lg p-6">
              <h2 className="text-sm font-semibold text-amber-200 uppercase tracking-wider mb-4">Day/Night Cycle</h2>
              <div className="flex items-center justify-center h-40">
                <DayNightPoiSkin
                  isDayPhase={isDayPhase}
                  cycleProgress={cycleProgress}
                  isPaused={false}
                />
              </div>
              <div className="mt-4 flex gap-2 justify-center">
                <button
                  onClick={() => setIsDayPhase(!isDayPhase)}
                  className="px-3 py-1 rounded text-xs font-medium transition-colors"
                  style={{
                    background: 'rgba(30,41,59,.60)',
                    border: '1px solid rgba(71,85,105,.40)',
                    color: 'rgba(148,163,184,.70)',
                  }}
                >
                  Toggle Day/Night
                </button>
                <button
                  onClick={() => setCycleProgress((p) => (p + 0.1) % 1)}
                  className="px-3 py-1 rounded text-xs font-medium transition-colors"
                  style={{
                    background: 'rgba(30,41,59,.60)',
                    border: '1px solid rgba(71,85,105,.40)',
                    color: 'rgba(148,163,184,.70)',
                  }}
                >
                  Advance Cycle
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Left: Job POI */}
              <div className="space-y-4">
                <div className="bg-slate-900/30 border border-slate-700/50 rounded-lg p-6">
                  <h2 className="text-sm font-semibold text-amber-200 uppercase tracking-wider mb-4">Job POI</h2>
                  <div className="flex items-center justify-center h-80">
                    <GenericPoiSkin
                      icon="🪓"
                      label="Chop Wood"
                      progress={jobStatus === 'working' ? 0.65 : jobStatus === 'completed' ? 1.0 : 0}
                      coronaCore={{ r: 139, g: 105, b: 20 }}
                      coronaGlow={{ r: 180, g: 140, b: 40 }}
                      rimColors={['#fce890', '#c09030', '#200e02']}
                      stoneColors={['#1e1608', '#030202']}
                      stoneAmbient="rgba(255,220,120,.22)"
                      pinColor="rgba(205,190,148,.72)"
                      pillar="wilderness"
                      size={160}
                      enableHover={true}
                      isCompleted={jobStatus === 'completed'}
                    />
                  </div>
                  <div className="mt-4 flex items-center justify-center">
                    <JobPOI
                      activityId="chop-wood"
                      label="Chop Wood"
                      icon="🪓"
                      status={jobStatus}
                      progress={jobStatus === 'working' ? 0.7 : 0.1}
                      rewardLabel="🪵 +10/h"
                      size={100}
                    />
                  </div>
                  <div className="mt-4 flex gap-2 justify-center">
                    {(['idle', 'working', 'completed'] as const).map((s) => (
                      <button
                        key={s}
                        onClick={() => {
                          setJobStatus(s);
                          setJobFatigue(s === 'working' ? 25 : s === 'completed' ? 50 : 0);
                        }}
                        className="px-3 py-1 rounded text-xs font-medium transition-colors"
                        style={{
                          background: jobStatus === s ? 'rgba(34,197,94,.15)' : 'rgba(30,41,59,.60)',
                          border: jobStatus === s ? '1px solid rgba(34,197,94,.45)' : '1px solid rgba(71,85,105,.40)',
                          color: jobStatus === s ? 'rgba(34,197,94,.90)' : 'rgba(148,163,184,.70)',
                        }}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right: Roster */}
              <div className="space-y-4">
                <div className="bg-slate-900/30 border border-slate-700/50 rounded-lg p-6">
                  <h2 className="text-sm font-semibold text-amber-200 uppercase tracking-wider mb-4">Village Roster</h2>
                  <DndContext>
                    <RosterDraggable componentId="job-poi-roster-time" useWanderlustSkin={true} />
                  </DndContext>
                </div>
              </div>
            </div>
          </div>
        </div>
      </SandboxTimingProvider>
    </SkinSystemProvider>
  );
}
