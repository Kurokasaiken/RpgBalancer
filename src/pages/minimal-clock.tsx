import { useState, useEffect, useRef } from 'react';
import DayNightPoiSkin from '@/ui/idleVillage/components/minimal/DayNightPoiSkin';
import { TimeEngineStrip } from '@/ui/idleVillage/components/minimal/TimeEngineStrip';
import { SkinSystemProvider } from '@/ui/idleVillage/hooks/useSkinSystem';
import { SandboxTimingProvider } from '@/ui/idleVillage/hooks/useSandboxTimingBridge';

export default function MinimalClockPage() {
  const [isPaused, setIsPaused] = useState(true);
  const [speed, setSpeed] = useState(1);
  const [currentDay, setCurrentDay] = useState(1);
  const [hour, setHour] = useState(6);
  const [progressFraction, setProgressFraction] = useState(0);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Space key handler: toggle pause/play, scroll if playing
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        if (isPaused) {
          setIsPaused(false);
        } else {
          window.scrollBy({ top: 300, behavior: 'smooth' });
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPaused]);

  useEffect(() => {
    if (isPaused) {
      if (tickRef.current) clearInterval(tickRef.current);
      return;
    }
    tickRef.current = setInterval(() => {
      setHour((h) => {
        if (h >= 23) {
          setCurrentDay((d) => d + 1);
          return 0;
        }
        return h + 1;
      });
      setProgressFraction((p) => {
        const next = p + 1 / 24;
        return next >= 1 ? 0 : next;
      });
    }, 1000 / speed);
    return () => { if (tickRef.current) clearInterval(tickRef.current); };
  }, [isPaused, speed]);

  const isDayTime = hour >= 6 && hour < 20;
  const phaseIcon = (
    <DayNightPoiSkin
      isDayPhase={isDayTime}
      cycleProgress={progressFraction}
      isPaused={isPaused}
    />
  );

  const emptyHudState = {
    activities: [],
    totalActive: 0,
    totalCompleted: 0,
    counts: { jobs: 0, quests: 0, maintenance: 0, total: 0 },
    hasActiveActivities: false,
    persistence: {
      lastSaveTime: null,
      isDirty: false,
      preferences: {
        collapsed: false,
        maxVisible: 5,
        sortBy: 'remaining-time' as const,
        showTypeBadges: true,
        compactMode: false,
      },
      uiState: {
        selectedTypeFilter: 'all' as const,
        telemetryPanelOpen: false,
        position: 'top' as const,
      },
      metadata: {
        lastSaved: 0,
        version: '1.0.0',
      },
    },
  };

  return (
    <SkinSystemProvider>
      <SandboxTimingProvider>
        <div data-testid="minimal-clock-page" className="min-h-screen bg-slate-950 p-8 text-ivory">
          <div className="mx-auto max-w-5xl space-y-8">
            <header>
              <p className="text-[10px] uppercase tracking-[0.45em] text-amber-200/70">Minimal Slice · Clock + Day/Night</p>
              <h1 className="text-2xl font-semibold tracking-[0.2em] text-amber-100">CLOCK & DAY/NIGHT ISOLATED</h1>
              <p className="mt-1 text-sm text-slate-400">Route: /minimal-clock</p>
            </header>

            {/* Compact TimeEngineStrip — same as /test page */}
            <TimeEngineStrip
              phaseIcon={phaseIcon}
              isPlaying={!isPaused}
              progressFraction={progressFraction}
              totalSeconds={86400}
              onToggle={() => setIsPaused(!isPaused)}
              label="Day/Night Cycle"
              clockProps={{
                currentDay,
                isPaused,
                speedMultiplier: speed,
                defaultSpeedMultiplier: 1,
                maxSpeedMultiplier: 8,
                tickIntervalMs: 1000,
                warmupDelayMs: 0,
                accentHex: '#f59e0b',
                onSpeedChange: (s: number) => setSpeed(s),
                availableSpeeds: [1, 2, 4, 8],
              }}
              hudState={emptyHudState}
              villageState={{ resources: { gold: 0, wood: 0, stone: 0 } }}
              secondsPerTimeUnit={1}
              temporalDisplay={{
                year: `ANNO ${currentDay}`,
                season: isDayTime ? 'GIORNO' : 'NOTTE',
                time: `ORA ${String(hour).padStart(2, '0')}:00`,
              }}
              compact
            />
          </div>
        </div>
      </SandboxTimingProvider>
    </SkinSystemProvider>
  );
}
