/* ═══════════════════════════════════════════════════════════════════
   Material Presets for WanderlustSurface
   ═══════════════════════════════════════════════════════════════════

   Each preset is a "colour bundle" — never change individual hexes in
   isolation.  Update the entire bundle so that highlight → shadow
   relationships, saturation, and noise-tint coherence are preserved.

   Usage:
     import { BRONZE_THEME, SILVER_THEME } from './materialPresets';
     <WanderlustSurfaceDefs material="silver" />
     <WanderlustSurface material="silver" … />
   ═══════════════════════════════════════════════════════════════════ */

export type MaterialPreset = 'bronze' | 'silver' | 'obsidian' | 'jade';

/** A single stop inside a linear or radial gradient. */
interface GradientStop {
  offset: string;
  color: string;
}

/** Complete colour bundle for one material. */
export interface MaterialTheme {
  id: MaterialPreset;
  label: string;

  /* ── Gradients ── */
  body: GradientStop[];        // ws-gb  (main frame)
  bevel: GradientStop[];       // ws-gbv
  ring: GradientStop[];        // ws-gri
  field: GradientStop[];        // ws-gf
  specular: GradientStop[];     // ws-gsp
  diamond: GradientStop[];     // ws-gdm
  bevelEdge: {
    top: GradientStop[];
    left: GradientStop[];
    bottom: GradientStop[];
    right: GradientStop[];
  };
  rim: {
    top: GradientStop[];
    left: GradientStop[];
  };
  ambient: GradientStop[];

  /* ── Noise / filter tints (feColorMatrix RGB multipliers) ── */
  noise: { r: number; g: number; b: number; a: number };
  noise2: { r: number; g: number; b: number; a: number };
  worn: { r: number; g: number; b: number; a: number };
  grime: { r: number; g: number; b: number; a: number };
  fieldNoise: { r: number; g: number; b: number; a: number };

  /* ── Base fills ── */
  baseFill: string;
  ringFill: string;
  fieldFill: string;
  insetFill: string;

  /* ── Rim & ring strokes (RGB only; opacity applied inline) ── */
  rimTopRGB: string;
  rimBrightRGB: string;
  rimDimRGB: string;
  ringLitRGB: string;
  ringShadowRGB: string;
  ringBorderRGB: string;

  /* ── Diamonds ── */
  diamondContactRGB: string;
  diamondStrokeRGB: string;
  diamondLitRGB: string;
  diamondShadowRGB: string;

  /* ── AO / ambient occlusion ── */
  aoRGB: string;
  aoCornerRGB: string;

  /* ── Rim specular ── */
  specularRGB: string;
  specularBrightRGB: string;

  /* ── Patina / scratches ── */
  patinaDark: string;    // '72,44,20'  → rgba(72,44,20,…)
  patinaBright: string;  // '200,155,80'
  patinaGreen: string;    // '80,98,54'
  scratchGroove: string; // '52,30,12'
  scratchExposed: string;// '210,165,80'
}

/* ───────────────────────────────────────────────────────────────────
   BRONZE  (default)
   Warm copper highlight → rich brown shadow.  Darkest allowed: #22140c
   ─────────────────────────────────────────────────────────────────── */
export const BRONZE_THEME: MaterialTheme = {
  id: 'bronze',
  label: 'Bronze',

  body: [
    { offset: '0%', color: '#e8c078' },
    { offset: '8%', color: '#d4a458' },
    { offset: '22%', color: '#b8823c' },
    { offset: '40%', color: '#966428' },
    { offset: '58%', color: '#7c4e20' },
    { offset: '76%', color: '#664018' },
    { offset: '100%', color: '#523414' },
  ],
  bevel: [
    { offset: '0%', color: 'rgba(232,195,130,.38)' },
    { offset: '14%', color: 'rgba(210,170,90,.14)' },
    { offset: '42%', color: 'rgba(180,130,60,.02)' },
    { offset: '74%', color: 'rgba(62,38,16,.30)' },
    { offset: '100%', color: 'rgba(52,30,12,.48)' },
  ],
  ring: [
    { offset: '0%', color: '#dbb060' },
    { offset: '16%', color: '#b88038' },
    { offset: '44%', color: '#8a5824' },
    { offset: '76%', color: '#68401a' },
    { offset: '100%', color: '#523414' },
  ],
  field: [
    { offset: '0%', color: '#42281a' },
    { offset: '35%', color: '#341e10' },
    { offset: '70%', color: '#2a180e' },
    { offset: '100%', color: '#22140c' },
  ],
  specular: [
    { offset: '0%', color: 'rgba(232,195,130,.12)' },
    { offset: '50%', color: 'rgba(210,170,90,.03)' },
    { offset: '100%', color: 'rgba(180,130,60,0)' },
  ],
  diamond: [
    { offset: '0%', color: '#e8c078' },
    { offset: '45%', color: '#b88038' },
    { offset: '100%', color: '#7c4e20' },
  ],
  bevelEdge: {
    top: [
      { offset: '0%', color: 'rgba(220,185,120,.35)' },
      { offset: '100%', color: 'rgba(220,185,120,0)' },
    ],
    left: [
      { offset: '0%', color: 'rgba(220,185,120,.25)' },
      { offset: '100%', color: 'rgba(220,185,120,0)' },
    ],
    bottom: [
      { offset: '0%', color: 'rgba(42,26,12,.50)' },
      { offset: '100%', color: 'rgba(42,26,12,0)' },
    ],
    right: [
      { offset: '0%', color: 'rgba(42,26,12,.40)' },
      { offset: '100%', color: 'rgba(42,26,12,0)' },
    ],
  },
  rim: {
    top: [
      { offset: '0%', color: 'rgba(232,200,140,.48)' },
      { offset: '10%', color: 'rgba(210,175,100,.12)' },
      { offset: '22%', color: 'rgba(180,140,70,0)' },
    ],
    left: [
      { offset: '0%', color: 'rgba(232,200,140,.32)' },
      { offset: '10%', color: 'rgba(210,175,100,.08)' },
      { offset: '22%', color: 'rgba(180,140,70,0)' },
    ],
  },
  ambient: [
    { offset: '0%', color: 'rgba(60,75,45,0)' },
    { offset: '70%', color: 'rgba(55,68,40,.015)' },
    { offset: '100%', color: 'rgba(50,62,38,.025)' },
  ],

  noise: { r: 0.16, g: 0.10, b: 0.05, a: 0.48 },
  noise2: { r: 0.12, g: 0.08, b: 0.04, a: 0.28 },
  worn: { r: 0.32, g: 0.22, b: 0.10, a: 0.35 },
  grime: { r: 0.08, g: 0.05, b: 0.02, a: 0.42 },
  fieldNoise: { r: 0.08, g: 0.05, b: 0.03, a: 0.26 },

  baseFill: '#5c3818',
  ringFill: '#4e3016',
  fieldFill: '#22140c',
  insetFill: '#2a180e',

  rimTopRGB: '232,200,130',
  rimBrightRGB: '240,215,160',
  rimDimRGB: '180,130,60',
  ringLitRGB: '232,200,130',
  ringShadowRGB: '62,38,16',
  ringBorderRGB: '42,26,12',

  diamondContactRGB: '52,30,14',
  diamondStrokeRGB: '58,34,14',
  diamondLitRGB: '240,210,150',
  diamondShadowRGB: '68,40,18',

  aoRGB: '34,20,12',
  aoCornerRGB: '28,16,8',

  specularRGB: '232,200,140',
  specularBrightRGB: '240,215,160',

  patinaDark: '72,44,20',
  patinaBright: '200,155,80',
  patinaGreen: '80,98,54',
  scratchGroove: '52,30,12',
  scratchExposed: '210,165,80',
};

/* ───────────────────────────────────────────────────────────────────
   SILVER
   Cool white highlight → blue-grey shadow.  Low saturation, high
   reflectivity.  Darkest allowed: #1a1a22
   ─────────────────────────────────────────────────────────────────── */
export const SILVER_THEME: MaterialTheme = {
  id: 'silver',
  label: 'Silver',

  body: [
    { offset: '0%', color: '#e0e0e8' },
    { offset: '8%', color: '#c0c0cc' },
    { offset: '22%', color: '#9898a8' },
    { offset: '40%', color: '#787888' },
    { offset: '58%', color: '#606072' },
    { offset: '76%', color: '#4a4a58' },
    { offset: '100%', color: '#383844' },
  ],
  bevel: [
    { offset: '0%', color: 'rgba(200,200,210,.38)' },
    { offset: '14%', color: 'rgba(170,170,185,.14)' },
    { offset: '42%', color: 'rgba(140,140,160,.02)' },
    { offset: '74%', color: 'rgba(40,40,55,.30)' },
    { offset: '100%', color: 'rgba(30,30,42,.48)' },
  ],
  ring: [
    { offset: '0%', color: '#c8c8d8' },
    { offset: '16%', color: '#9898a8' },
    { offset: '44%', color: '#707080' },
    { offset: '76%', color: '#545460' },
    { offset: '100%', color: '#383844' },
  ],
  field: [
    { offset: '0%', color: '#2a2a34' },
    { offset: '35%', color: '#22222c' },
    { offset: '70%', color: '#1a1a22' },
    { offset: '100%', color: '#14141c' },
  ],
  specular: [
    { offset: '0%', color: 'rgba(210,210,220,.12)' },
    { offset: '50%', color: 'rgba(180,180,195,.03)' },
    { offset: '100%', color: 'rgba(150,150,170,0)' },
  ],
  diamond: [
    { offset: '0%', color: '#d8d8e4' },
    { offset: '45%', color: '#9898a8' },
    { offset: '100%', color: '#606072' },
  ],
  bevelEdge: {
    top: [
      { offset: '0%', color: 'rgba(200,200,215,.35)' },
      { offset: '100%', color: 'rgba(200,200,215,0)' },
    ],
    left: [
      { offset: '0%', color: 'rgba(200,200,215,.25)' },
      { offset: '100%', color: 'rgba(200,200,215,0)' },
    ],
    bottom: [
      { offset: '0%', color: 'rgba(30,30,42,.50)' },
      { offset: '100%', color: 'rgba(30,30,42,0)' },
    ],
    right: [
      { offset: '0%', color: 'rgba(30,30,42,.40)' },
      { offset: '100%', color: 'rgba(30,30,42,0)' },
    ],
  },
  rim: {
    top: [
      { offset: '0%', color: 'rgba(210,210,225,.48)' },
      { offset: '10%', color: 'rgba(180,180,200,.12)' },
      { offset: '22%', color: 'rgba(150,150,175,0)' },
    ],
    left: [
      { offset: '0%', color: 'rgba(210,210,225,.32)' },
      { offset: '10%', color: 'rgba(180,180,200,.08)' },
      { offset: '22%', color: 'rgba(150,150,175,0)' },
    ],
  },
  ambient: [
    { offset: '0%', color: 'rgba(45,55,70,0)' },
    { offset: '70%', color: 'rgba(40,50,65,.015)' },
    { offset: '100%', color: 'rgba(38,48,62,.025)' },
  ],

  noise: { r: 0.10, g: 0.10, b: 0.12, a: 0.48 },
  noise2: { r: 0.08, g: 0.08, b: 0.10, a: 0.28 },
  worn: { r: 0.25, g: 0.25, b: 0.28, a: 0.35 },
  grime: { r: 0.05, g: 0.05, b: 0.06, a: 0.42 },
  fieldNoise: { r: 0.06, g: 0.06, b: 0.08, a: 0.26 },

  baseFill: '#484858',
  ringFill: '#3e3e4e',
  fieldFill: '#1a1a22',
  insetFill: '#22222c',

  rimTopRGB: '210,210,225',
  rimBrightRGB: '220,220,235',
  rimDimRGB: '130,130,150',
  ringLitRGB: '210,210,225',
  ringShadowRGB: '50,50,65',
  ringBorderRGB: '35,35,48',

  diamondContactRGB: '40,40,52',
  diamondStrokeRGB: '45,45,58',
  diamondLitRGB: '210,210,225',
  diamondShadowRGB: '55,55,70',

  aoRGB: '25,25,34',
  aoCornerRGB: '20,20,28',

  specularRGB: '210,210,225',
  specularBrightRGB: '220,220,235',

  patinaDark: '60,60,72',
  patinaBright: '170,170,190',
  patinaGreen: '65,80,95',
  scratchGroove: '38,38,48',
  scratchExposed: '190,190,210',
};

/* ───────────────────────────────────────────────────────────────────
   OBSIDIAN
   Dark, mostly reflection.  Very low diffuse, high specular.  Cold.
   ─────────────────────────────────────────────────────────────────── */
export const OBSIDIAN_THEME: MaterialTheme = {
  id: 'obsidian',
  label: 'Obsidian',

  body: [
    { offset: '0%', color: '#8090a0' },
    { offset: '8%', color: '#607080' },
    { offset: '22%', color: '#485868' },
    { offset: '40%', color: '#384858' },
    { offset: '58%', color: '#2c3c4c' },
    { offset: '76%', color: '#202c38' },
    { offset: '100%', color: '#182028' },
  ],
  bevel: [
    { offset: '0%', color: 'rgba(120,140,160,.38)' },
    { offset: '14%', color: 'rgba(90,110,130,.14)' },
    { offset: '42%', color: 'rgba(60,80,100,.02)' },
    { offset: '74%', color: 'rgba(20,30,40,.30)' },
    { offset: '100%', color: 'rgba(12,18,24,.48)' },
  ],
  ring: [
    { offset: '0%', color: '#708898' },
    { offset: '16%', color: '#506878' },
    { offset: '44%', color: '#385060' },
    { offset: '76%', color: '#283c4c' },
    { offset: '100%', color: '#182028' },
  ],
  field: [
    { offset: '0%', color: '#1c2832' },
    { offset: '35%', color: '#182028' },
    { offset: '70%', color: '#141c24' },
    { offset: '100%', color: '#0e1418' },
  ],
  specular: [
    { offset: '0%', color: 'rgba(130,155,180,.12)' },
    { offset: '50%', color: 'rgba(100,125,150,.03)' },
    { offset: '100%', color: 'rgba(70,95,120,0)' },
  ],
  diamond: [
    { offset: '0%', color: '#8090a0' },
    { offset: '45%', color: '#506878' },
    { offset: '100%', color: '#2c3c4c' },
  ],
  bevelEdge: {
    top: [
      { offset: '0%', color: 'rgba(130,150,170,.35)' },
      { offset: '100%', color: 'rgba(130,150,170,0)' },
    ],
    left: [
      { offset: '0%', color: 'rgba(130,150,170,.25)' },
      { offset: '100%', color: 'rgba(130,150,170,0)' },
    ],
    bottom: [
      { offset: '0%', color: 'rgba(15,22,30,.50)' },
      { offset: '100%', color: 'rgba(15,22,30,0)' },
    ],
    right: [
      { offset: '0%', color: 'rgba(15,22,30,.40)' },
      { offset: '100%', color: 'rgba(15,22,30,0)' },
    ],
  },
  rim: {
    top: [
      { offset: '0%', color: 'rgba(140,165,190,.48)' },
      { offset: '10%', color: 'rgba(110,135,160,.12)' },
      { offset: '22%', color: 'rgba(80,105,130,0)' },
    ],
    left: [
      { offset: '0%', color: 'rgba(140,165,190,.32)' },
      { offset: '10%', color: 'rgba(110,135,160,.08)' },
      { offset: '22%', color: 'rgba(80,105,130,0)' },
    ],
  },
  ambient: [
    { offset: '0%', color: 'rgba(30,40,55,0)' },
    { offset: '70%', color: 'rgba(25,35,50,.015)' },
    { offset: '100%', color: 'rgba(22,32,45,.025)' },
  ],

  noise: { r: 0.10, g: 0.12, b: 0.14, a: 0.48 },
  noise2: { r: 0.08, g: 0.10, b: 0.12, a: 0.28 },
  worn: { r: 0.18, g: 0.22, b: 0.26, a: 0.35 },
  grime: { r: 0.04, g: 0.05, b: 0.06, a: 0.42 },
  fieldNoise: { r: 0.05, g: 0.06, b: 0.07, a: 0.26 },

  baseFill: '#1c2832',
  ringFill: '#182028',
  fieldFill: '#0e1418',
  insetFill: '#182028',

  rimTopRGB: '140,165,190',
  rimBrightRGB: '150,175,200',
  rimDimRGB: '80,105,130',
  ringLitRGB: '140,165,190',
  ringShadowRGB: '30,40,50',
  ringBorderRGB: '20,28,36',

  diamondContactRGB: '25,35,45',
  diamondStrokeRGB: '28,38,48',
  diamondLitRGB: '150,175,200',
  diamondShadowRGB: '35,48,60',

  aoRGB: '15,22,30',
  aoCornerRGB: '12,18,25',

  specularRGB: '140,165,190',
  specularBrightRGB: '150,175,200',

  patinaDark: '35,45,55',
  patinaBright: '120,145,170',
  patinaGreen: '50,70,85',
  scratchGroove: '20,28,36',
  scratchExposed: '140,165,190',
};

/* ───────────────────────────────────────────────────────────────────
   JADE / VERDIGRIS
   Green oxidation aesthetic.  Warm earthy base with verdigris patina.
   ─────────────────────────────────────────────────────────────────── */
export const JADE_THEME: MaterialTheme = {
  id: 'jade',
  label: 'Jade',

  body: [
    { offset: '0%', color: '#a8d8b8' },
    { offset: '8%', color: '#80b898' },
    { offset: '22%', color: '#58987c' },
    { offset: '40%', color: '#3c7860' },
    { offset: '58%', color: '#2c6050' },
    { offset: '76%', color: '#1e4838' },
    { offset: '100%', color: '#163428' },
  ],
  bevel: [
    { offset: '0%', color: 'rgba(150,210,170,.38)' },
    { offset: '14%', color: 'rgba(110,180,140,.14)' },
    { offset: '42%', color: 'rgba(80,150,110,.02)' },
    { offset: '74%', color: 'rgba(20,50,40,.30)' },
    { offset: '100%', color: 'rgba(12,38,28,.48)' },
  ],
  ring: [
    { offset: '0%', color: '#90c8a8' },
    { offset: '16%', color: '#60a080' },
    { offset: '44%', color: '#407860' },
    { offset: '76%', color: '#285848' },
    { offset: '100%', color: '#163428' },
  ],
  field: [
    { offset: '0%', color: '#1e4038' },
    { offset: '35%', color: '#183830' },
    { offset: '70%', color: '#142c24' },
    { offset: '100%', color: '#0e201a' },
  ],
  specular: [
    { offset: '0%', color: 'rgba(150,215,180,.12)' },
    { offset: '50%', color: 'rgba(110,185,150,.03)' },
    { offset: '100%', color: 'rgba(80,155,120,0)' },
  ],
  diamond: [
    { offset: '0%', color: '#a0d4b8' },
    { offset: '45%', color: '#60a080' },
    { offset: '100%', color: '#2c6050' },
  ],
  bevelEdge: {
    top: [
      { offset: '0%', color: 'rgba(160,220,180,.35)' },
      { offset: '100%', color: 'rgba(160,220,180,0)' },
    ],
    left: [
      { offset: '0%', color: 'rgba(160,220,180,.25)' },
      { offset: '100%', color: 'rgba(160,220,180,0)' },
    ],
    bottom: [
      { offset: '0%', color: 'rgba(18,45,35,.50)' },
      { offset: '100%', color: 'rgba(18,45,35,0)' },
    ],
    right: [
      { offset: '0%', color: 'rgba(18,45,35,.40)' },
      { offset: '100%', color: 'rgba(18,45,35,0)' },
    ],
  },
  rim: {
    top: [
      { offset: '0%', color: 'rgba(165,225,190,.48)' },
      { offset: '10%', color: 'rgba(130,195,160,.12)' },
      { offset: '22%', color: 'rgba(95,165,130,0)' },
    ],
    left: [
      { offset: '0%', color: 'rgba(165,225,190,.32)' },
      { offset: '10%', color: 'rgba(130,195,160,.08)' },
      { offset: '22%', color: 'rgba(95,165,130,0)' },
    ],
  },
  ambient: [
    { offset: '0%', color: 'rgba(35,60,45,0)' },
    { offset: '70%', color: 'rgba(30,55,40,.015)' },
    { offset: '100%', color: 'rgba(28,50,38,.025)' },
  ],

  noise: { r: 0.06, g: 0.12, b: 0.08, a: 0.48 },
  noise2: { r: 0.04, g: 0.10, b: 0.06, a: 0.28 },
  worn: { r: 0.14, g: 0.26, b: 0.18, a: 0.35 },
  grime: { r: 0.03, g: 0.06, b: 0.04, a: 0.42 },
  fieldNoise: { r: 0.04, g: 0.08, b: 0.05, a: 0.26 },

  baseFill: '#1e4038',
  ringFill: '#183830',
  fieldFill: '#0e201a',
  insetFill: '#183830',

  rimTopRGB: '165,225,190',
  rimBrightRGB: '175,230,200',
  rimDimRGB: '95,165,130',
  ringLitRGB: '165,225,190',
  ringShadowRGB: '30,55,42',
  ringBorderRGB: '20,45,35',

  diamondContactRGB: '28,55,42',
  diamondStrokeRGB: '32,58,45',
  diamondLitRGB: '175,230,200',
  diamondShadowRGB: '40,70,55',

  aoRGB: '25,48,38',
  aoCornerRGB: '20,42,32',

  specularRGB: '165,225,190',
  specularBrightRGB: '175,230,200',

  patinaDark: '30,55,42',
  patinaBright: '130,195,155',
  patinaGreen: '65,115,80',
  scratchGroove: '20,42,32',
  scratchExposed: '150,210,175',
};

/** Lookup map for all presets. */
export const MATERIAL_PRESETS: Record<MaterialPreset, MaterialTheme> = {
  bronze: BRONZE_THEME,
  silver: SILVER_THEME,
  obsidian: OBSIDIAN_THEME,
  jade: JADE_THEME,
};

/** Default fallback. */
export const DEFAULT_MATERIAL: MaterialPreset = 'bronze';
