/**
 * @trailer-only
 *
 * Configuration for Steam teaser trailer production pipeline.
 * Tunable values only — no Zod validation for iteration speed.
 *
 * This config is exempt from gameplay architecture requirements.
 * It exists solely to produce recordable video content.
 */

/**
 * Seeded random number generator for deterministic trailer behavior.
 * Ensures identical particle positions, timing, and poster frames across recordings.
 */
class SeededRandom {
  private seed: number;

  constructor(seed: number) {
    this.seed = seed;
  }

  /**
   * Returns a random number between 0 and 1 (exclusive of 1).
   * Deterministic based on the seed.
   */
  next(): number {
    this.seed = (this.seed * 9301 + 49297) % 233280;
    return this.seed / 233280;
  }

  /**
   * Returns a random integer between min and max (inclusive).
   */
  range(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  /**
   * Returns a random element from an array.
   */
  pick<T>(array: T[]): T {
    return array[this.range(0, array.length - 1)];
  }

  /**
   * Resets the generator to its initial seed.
   */
  reset(): void {
    this.seed = 12345;
  }
}

/**
 * Global seeded random instance for trailer use.
 */
export const trailerRandom = new SeededRandom(12345);

/**
 * Trailer configuration with tunable values for all 7 scenes.
 */
export const trailerConfig = {
  duration: 55000, // Total trailer duration in ms

  sceneOrder: ['threat', 'choice', 'preparation', 'risk', 'consequence', 'legacy', 'outro'],

  capture: {
    seed: 12345,
    autoPlay: true,
    sceneParamName: 'scene',
    freezeAt: undefined as string | undefined,
  },

  threat: {
    duration: 5000,
    announcement: {
      duration: 3000,
      vignetteOpacity: 0.25,
      dimOpacity: 0.35,
      dimFilter: 'brightness(0.55) saturate(0.7)',
      dustCloud: {
        duration: 2400,
        delay: 200,
        width: '60vw',
        opacity: 0.45,
      },
      sticker: {
        width: '42vmin',
        bobDuration: 3200,
        glow: '0 0 40px rgba(201, 162, 39, 0.25)',
      },
      title: 'GOBLIN INVASION',
      subtitle: 'The eastern tribes have begun their march',
      timerRing: {
        size: 92,
        daysText: '5 DAYS REMAIN',
        number: '5',
        rotationDuration: 6000,
      },
      warHorn: '/audio/war-horn.mp3',
    },
    banner: "GOBLIN INVASION — 5 DAYS REMAIN",
    subBanner: "The frontier watch fires have gone dark",
    eventTitle: "GOBLIN INVASION",
    eventPlaque: "⚔️ Invasion",
    mapImage: '/Map finale.jpg',
    goblinImage: '/goblin-march-trasparente.png',
    goblinTotemImage: '/mockups/goblin-totem-pilot/goblin-totem-pilot-20260815-20260814-215742.png',
    goblinInvasionPanel: '/mockups/goblin-totem-pilot/goblin-totem-ipadapter-20260816-20260814-225603.png',
    goblinInvasionHeroAsset: '/mockups/goblin-totem-hero/goblin-totem-asset-v2.png',
    goblin: {
      baseWidth: '50vw',
      scale: 0.33,
      spawnDurationMs: 600,
      toLeftDurationMs: 1000,
      poiFillDurationMs: 2500,
      // 1/10 of current march speed, ending just before the centre of the viewport.
      marchDurationMs: 1000000,
      marchEndPercent: 50,
      marchEndOffsetVw: 2,
    },
    mapBackground: 'radial-gradient(circle at 70% 30%, rgba(139, 92, 43, 0.12) 0%, transparent 55%), radial-gradient(circle at 30% 70%, rgba(60, 20, 20, 0.18) 0%, transparent 50%), #030202',
    baseTealOverlay: {
      background: [
        'radial-gradient(circle at 50% -10%, rgba(0,229,255,0.12) 0%, rgba(0,150,255,0.03) 50%, transparent 80%)',
        '#060f16',
      ].join(', '),
      boxShadow: 'inset 0 0 60px rgba(2,6,10,0.8)',
    },
    pois: [
      { id: 'goblin-camp', label: 'Goblin Camp', icon: '🔥', x: 22, y: 28, delay: 800, dangerRating: 7, status: 'available' as const },
      { id: 'south-pass', label: 'South Pass', icon: '⛰️', x: 48, y: 62, delay: 1800, dangerRating: 4, status: 'available' as const },
      { id: 'east-watch', label: 'East Watch', icon: '🏚️', x: 76, y: 38, delay: 2800, dangerRating: 9, status: 'available' as const },
    ],
  },

  choice: {
    duration: 10000,
    title: "CHOOSE A PATH",
    subtitle: "The village council must decide before nightfall",
    choices: [
      {
        id: 'training',
        type: 'safe' as const,
        label: 'Training Grounds',
        description: 'Steady progress · low risk',
        icon: '🛡️',
        x: 30,
        y: 50,
        dangerRating: 2,
      },
      {
        id: 'ruins',
        type: 'high-risk' as const,
        label: 'Forgotten Ruins',
        description: 'High reward · mortal danger',
        icon: '⚔️',
        x: 70,
        y: 50,
        dangerRating: 9,
      },
    ],
  },

  preparation: {
    duration: 10000,
    hero: {
      name: 'Kaelen',
      role: 'Warden',
      initials: 'KW',
      portraitUrl: '',
      hp: 85,
      maxHp: 100,
      fatigue: 12,
      attack: 15,
      defense: 8,
      magic: 12,
    },
    poi: {
      id: 'forgotten-ruins',
      label: 'Forgotten Ruins',
      icon: '⚔️',
      x: 72,
      y: 50,
      dangerRating: 9,
    },
  },

  risk: {
    duration: 7000,
    camera: {
      initialScale: 0.8,
      focusTarget: "astrolabe",
      shakeAt: ["impact"],
    },
    sequence: [
      { time: 0, event: "spawn" },
      { time: 2000, event: "ballEnter" },
      { time: 5000, event: "nearMiss" },
      { time: 7000, event: "heroInjured" },
    ],
    posterFrames: [
      { id: "nearMiss", time: 5500 },
      { id: "heroInjured", time: 7000 },
    ],
  },

  consequence: {
    duration: 8000,
    timerStart: 5,
    overlay: "greyscale",
    message: "SETTLEMENT LOST",
    subMessage: "The raiders broke through before dawn",
    mapBackground: 'radial-gradient(circle at 50% 60%, rgba(60, 20, 20, 0.25) 0%, transparent 60%), #030202',
    notifications: [
      { id: 'breach', icon: '⚠️', message: 'Wall breached', delay: 1200 },
      { id: 'fallen', icon: '💀', message: 'Kaelen has fallen', delay: 2600 },
      { id: 'lost', icon: '🔥', message: 'Storehouse lost', delay: 4000 },
    ],
  },

  legacy: {
    duration: 10000,
    title: "KNOWLEDGE PRESERVED",
    subtitle: "What survives becomes the foundation",
    items: [
      { id: 'artifact', label: 'Ancient Artifact', icon: '🏺', category: 'Artifact' },
      { id: 'blueprint', label: 'Sacred Altar Blueprint', icon: '📜', category: 'Blueprint' },
      { id: 'heroes', label: 'Surviving Heroes', icon: '🛡️', category: 'Heroes' },
    ],
  },

  outro: {
    duration: 5000,
    title: "WANDERLUST TRIUMPH",
    tagline: "PREPARE · ENDURE · TRIUMPH",
    cta: "WISHLIST NOW ON STEAM",
    steamUrl: 'https://store.steampowered.com',
  },
} as const;

/**
 * Union type of all trailer scene identifiers.
 */
export type TrailerSceneId = (typeof trailerConfig.sceneOrder)[number];

/**
 * Copy constants separated from timing data for easy iteration.
 */
export const TRAILER_COPY = {
  threatBanner: "GOBLIN INVASION — 5 DAYS REMAIN",
  consequenceMessage: "SETTLEMENT LOST",
  legacyTitle: "KNOWLEDGE PRESERVED",
  outroTitle: "WANDERLUST TRIUMPH",
  outroTagline: "PREPARE · ENDURE · TRIUMPH",
  cta: "WISHLIST NOW ON STEAM",
} as const;

/**
 * Reset the seeded random generator to its initial state.
 * Call this before each deterministic sequence.
 */
export function resetTrailerRandom(): void {
  trailerRandom.reset();
}
