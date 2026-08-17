import { useState } from 'react';
import { DayNightPoiSkin, type DayNightDebugLayers } from '@/ui/idleVillage/frozen/kits/poiKit';

const layerLabels: Record<keyof DayNightDebugLayers, string> = {
  darkBaseRing: 'Dark base ring fill',
  bloom: 'Bloom',
  outerGuide: 'Outer guide (binario)',
  progressHalo: 'Progress halo',
  decorativeMarks: 'Decorative marks',
  coreMedallionOuter: 'Core medallion outer',
  metalNoise: 'Metal noise',
  coreInner: 'Core inner',
  coreHighlight: 'Core highlight',
  outerRim: 'Outer rim',
  dayIcon: 'Day icon',
  nightIcon: 'Night icon',
  frost: 'Frost overlay',
};

const defaultLayers: Required<DayNightDebugLayers> = {
  darkBaseRing: true,
  bloom: true,
  outerGuide: true,
  progressHalo: true,
  decorativeMarks: true,
  coreMedallionOuter: true,
  metalNoise: true,
  coreInner: true,
  coreHighlight: true,
  outerRim: true,
  dayIcon: true,
  nightIcon: true,
  frost: true,
};

export default function DayNightPoiSkinDebugPage() {
  const [isDayPhase, setIsDayPhase] = useState(true);
  const [cycleProgress, setCycleProgress] = useState(0.35);
  const [isPaused, setIsPaused] = useState(false);
  const [layers, setLayers] = useState<DayNightDebugLayers>(defaultLayers);

  const toggle = (key: keyof DayNightDebugLayers) => {
    setLayers((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="min-h-screen bg-slate-950 p-8 text-ivory">
      <div className="mx-auto max-w-3xl space-y-8">
        <div>
          <h1 className="text-2xl tracking-[0.2em]">Day/Night POI Skin — Layer Debug</h1>
          <p className="text-sm text-slate-400">Toggle individual layers to isolate the square artifact.</p>
        </div>

        <div className="flex items-center justify-center rounded-xl border border-white/10 bg-black/45 p-12">
          <DayNightPoiSkin
            isDayPhase={isDayPhase}
            cycleProgress={cycleProgress}
            isPaused={isPaused}
            debug={layers}
          />
        </div>

        <div className="grid gap-4 rounded-xl border border-white/10 bg-black/30 p-6 md:grid-cols-2">
          <div className="space-y-3">
            <h2 className="text-sm uppercase tracking-widest text-white/60">State</h2>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={isDayPhase}
                onChange={(e) => setIsDayPhase(e.target.checked)}
              />
              Day phase
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={isPaused}
                onChange={(e) => setIsPaused(e.target.checked)}
              />
              Paused
            </label>
            <label className="block text-sm">
              Progress: {Math.round(cycleProgress * 100)}%
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={cycleProgress}
                onChange={(e) => setCycleProgress(parseFloat(e.target.value))}
                className="w-full"
              />
            </label>
          </div>

          <div className="space-y-3">
            <h2 className="text-sm uppercase tracking-widest text-white/60">Layers</h2>
            <div className="grid grid-cols-2 gap-2">
              {(Object.keys(layerLabels) as Array<keyof DayNightDebugLayers>).map((key) => (
                <label key={key} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={!!layers[key]}
                    onChange={() => toggle(key)}
                  />
                  {layerLabels[key]}
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
