import type { AxisMetaEntry } from './altVisualsAxis';
import { getAltVisualsV8ManifestUrl } from './altVisualsV8Manifest';

export type AltVisualsV8TimelinePhase = 'enemyColumns' | 'puddleMorph' | 'heroAscend' | 'settle';

export interface AltVisualsV8Theme {
  id: 'alt-v8';
  manifestUrl: string;
  axisCount: number;
  axisMetaFallback: readonly AxisMetaEntry[];
  palette: {
    obsidian: string;
    marble: string;
    tar: string;
    moltenGold: string;
    etherBlue: string;
    ember: string;
    grid: string;
  };
  layout: {
    canvasSize: number;
    baseRadius: number;
    columnThickness: number;
    columnDepth: number;
  };
  timings: {
    introDelayMs: number;
    phaseDurationsMs: Record<AltVisualsV8TimelinePhase, number>;
    loopDelayMs: number;
  };
  filters: {
    glow: {
      distance: number;
      outerStrength: number;
      innerStrength: number;
      color: number;
      quality: number;
    };
    bloom: {
      threshold: number;
      bloomScale: number;
      brightness: number;
    };
    rgbSplit: {
      red: { x: number; y: number };
      green: { x: number; y: number };
      blue: { x: number; y: number };
      timeFactor: number;
    };
    noise: {
      seed: number;
      intensity: number;
    };
  };
  columns: {
    heightRange: [number, number];
    wobbleAmplitude: number;
    easing: 'expoOut' | 'quartOut' | 'elasticOut';
    playerLiftOffset: number;
  };
  puddle: {
    radius: number;
    displacementAmplitude: number;
    rippleSpeed: number;
    fadeOpacity: number;
  };
  background: {
    hdrContribution: number;
    vignetteOpacity: number;
    auroraPulseSeconds: number;
  };
  fx: {
    particleCount: number;
    particleSpeedRange: [number, number];
    particleScaleRange: [number, number];
    grainOpacity: number;
    grainScrollSpeed: number;
  };
}

export const ALT_VISUALS_V8_AXIS_META: readonly AxisMetaEntry[] = [
  { name: 'Aggro Pressure', icon: '⛧' },
  { name: 'Arcane Control', icon: '✷' },
  { name: 'Soul Resonance', icon: '❂' },
  { name: 'Ward Stability', icon: '❖' },
  { name: 'Resolve', icon: '◉' },
] as const;

export const ALT_VISUALS_V8_THEME: AltVisualsV8Theme = {
  id: 'alt-v8',
  manifestUrl: getAltVisualsV8ManifestUrl(),
  axisCount: 5,
  axisMetaFallback: ALT_VISUALS_V8_AXIS_META,
  palette: {
    obsidian: '#0b0b12',
    marble: '#f4f0ea',
    tar: '#040305',
    moltenGold: '#f2c94c',
    etherBlue: '#71fff3',
    ember: '#ff8a5b',
    grid: '#1f2337',
  },
  layout: {
    canvasSize: 720,
    baseRadius: 240,
    columnThickness: 48,
    columnDepth: 38,
  },
  timings: {
    introDelayMs: 350,
    phaseDurationsMs: {
      enemyColumns: 1650,
      puddleMorph: 1100,
      heroAscend: 1350,
      settle: 800,
    },
    loopDelayMs: 900,
  },
  filters: {
    glow: {
      distance: 28,
      outerStrength: 1.3,
      innerStrength: 0.25,
      color: 0xf2c94c,
      quality: 0.35,
    },
    bloom: {
      threshold: 0.45,
      bloomScale: 1.1,
      brightness: 1.05,
    },
    rgbSplit: {
      red: { x: 1.25, y: 0.2 },
      green: { x: 0, y: 0 },
      blue: { x: -1.25, y: -0.2 },
      timeFactor: 0.0011,
    },
    noise: {
      seed: 0.42,
      intensity: 0.18,
    },
  },
  columns: {
    heightRange: [120, 320],
    wobbleAmplitude: 18,
    easing: 'expoOut',
    playerLiftOffset: 42,
  },
  puddle: {
    radius: 210,
    displacementAmplitude: 28,
    rippleSpeed: 0.55,
    fadeOpacity: 0.65,
  },
  background: {
    hdrContribution: 0.35,
    vignetteOpacity: 0.4,
    auroraPulseSeconds: 12,
  },
  fx: {
    particleCount: 32,
    particleSpeedRange: [24, 64],
    particleScaleRange: [0.4, 0.95],
    grainOpacity: 0.32,
    grainScrollSpeed: 0.02,
  },
};
