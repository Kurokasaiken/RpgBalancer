import type { TemporarySkinConfig } from '../temporary/TemporarySkinConfig';
import { validateTemporarySkinConfig } from '../temporary/TemporarySkinConfig';

export const SLOT_WILDERNESS_BRONZE_SKIN_ID = 'slot_wilderness_bronze';

const SLOT_WILDERNESS_BRONZE_SKIN_HTML = String.raw`
<div class="slot-v12" data-slot-host>
  <svg viewBox="-120 -120 240 240" role="presentation" aria-hidden="true">
    <defs>
      <radialGradient id="slot-v12-cavity" cx="0.36" cy="0.28" r="0.7">
        <stop offset="0%" stop-color="#020101" />
        <stop offset="20%" stop-color="#0a0402" />
        <stop offset="38%" stop-color="#160a05" />
        <stop offset="56%" stop-color="#200f07" />
        <stop offset="74%" stop-color="#2c1709" />
        <stop offset="100%" stop-color="#160c05" />
      </radialGradient>
      <radialGradient id="slot-v12-rim" cx="0.5" cy="0.5" r="0.5">
        <stop offset="0%" stop-color="rgba(0,0,0,0)" />
        <stop offset="35%" stop-color="rgba(70,48,20,0.45)" />
        <stop offset="60%" stop-color="rgba(88,60,24,0.8)" />
        <stop offset="80%" stop-color="rgba(40,24,8,0.3)" />
        <stop offset="100%" stop-color="rgba(40,24,8,0.3)" />
      </radialGradient>
      <linearGradient id="slot-v12-collar" x1="0.14" y1="0.04" x2="0.86" y2="0.96">
        <stop offset="0%" stop-color="#8a5c1e" />
        <stop offset="25%" stop-color="#5c3a0e" />
        <stop offset="50%" stop-color="#2e1c06" />
        <stop offset="75%" stop-color="#180e03" />
        <stop offset="100%" stop-color="#0a0602" />
      </linearGradient>
      <linearGradient id="slot-v12-bezel" x1="0.14" y1="0.04" x2="0.86" y2="0.96">
        <stop offset="0%" stop-color="#c4c4d0" />
        <stop offset="25%" stop-color="#9292a0" />
        <stop offset="50%" stop-color="#646472" />
        <stop offset="75%" stop-color="#464654" />
        <stop offset="100%" stop-color="#2c2c38" />
      </linearGradient>
      <radialGradient id="slot-v12-medal-outer" cx="0.5" cy="0.5" r="0.6">
        <stop offset="0%" stop-color="#fce890" />
        <stop offset="28%" stop-color="#c09030" />
        <stop offset="56%" stop-color="#a05c18" />
        <stop offset="80%" stop-color="#602c08" />
        <stop offset="100%" stop-color="#341604" />
      </radialGradient>
      <radialGradient id="slot-v12-medal-field" cx="0.45" cy="0.35" r="0.6">
        <stop offset="0%" stop-color="#2e2012" />
        <stop offset="40%" stop-color="#1a1008" />
        <stop offset="70%" stop-color="#0e0804" />
        <stop offset="100%" stop-color="#050302" />
      </radialGradient>
      <clipPath id="slot-v12-clip-medal">
        <circle cx="0" cy="0" r="30" />
      </clipPath>
    </defs>

    <g data-slot="shadow-circles">
      <circle cx="0" cy="0" r="90" fill="rgba(0,0,0,0.45)" />
      <circle cx="0" cy="0" r="82" fill="rgba(0,0,0,0.35)" />
    </g>

    <g data-slot="cavity" class="slot-v12-cavity">
      <circle cx="0" cy="0" r="73" fill="url(#slot-v12-cavity)" />
    </g>

    <g data-slot="collar" class="slot-v12-collar">
      <circle cx="0" cy="0" r="62" fill="url(#slot-v12-collar)" />
      <circle cx="0" cy="0" r="53" stroke="rgba(255,235,140,0.22)" stroke-width="2.4" fill="none" />
    </g>

    <g data-slot="bezel" class="slot-v12-bezel">
      <circle cx="0" cy="0" r="73" stroke="rgba(3,2,1,0.92)" stroke-width="2" fill="none" />
      <circle cx="0" cy="0" r="68" stroke="rgba(172,134,34,0.12)" stroke-width="2" fill="none" />
      <circle cx="0" cy="0" r="70" stroke="url(#slot-v12-bezel)" stroke-width="4" fill="none" />
    </g>

    <g data-slot="teeth" class="slot-v12-teeth">
      <path d="M0,-73 L0,-90" />
      <path d="M63,36 L78,45" />
      <path d="M-63,36 L-78,45" />
    </g>

    <g data-slot="arcane" class="slot-v12-arcane">
      <circle cx="0" cy="0" r="64" fill="none" />
    </g>

    <g data-slot="medal" clip-path="url(#slot-v12-clip-medal)" class="slot-v12-medal">
      <circle cx="0" cy="0" r="42" fill="url(#slot-v12-medal-outer)" />
      <circle cx="0" cy="0" r="34" fill="url(#slot-v12-medal-field)" />
      <circle cx="0" cy="0" r="30" stroke="rgba(205,155,50,0.68)" stroke-width="3" fill="none" />
      <text x="0" y="10" text-anchor="middle" font-family="Cinzel,Georgia,serif" font-size="36" font-weight="600" fill="rgba(205,155,50,0.68)">S</text>
    </g>

    <g data-slot="halo">
      <canvas data-slot="halo" width="420" height="420"></canvas>
    </g>
  </svg>
</div>`;

const SLOT_WILDERNESS_BRONZE_SKIN_CSS = String.raw`
.slot-v12 {
  position: relative;
  width: 210px;
  height: 210px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.slot-v12 svg {
  width: 100%;
  height: 100%;
  overflow: visible;
}

.slot-v12-bezel circle {
  filter: url(#slot-v12-silver);
}

.slot-v12-teeth path {
  stroke: #c0c0ce;
  stroke-width: 4;
  stroke-linecap: round;
  filter: url(#slot-v12-silver);
}

.slot-v12-arcane circle {
  stroke: rgba(162,188,255,0.13);
  stroke-width: 2.6;
  stroke-dasharray: 4 12;
  animation: slot-v12-arcane-breathe 13s ease-in-out infinite;
}

.slot-v12-medal {
  animation: slot-v12-medal-lock 0.56s ease-in-out forwards;
}

@keyframes slot-v12-arcane-breathe {
  0%, 100% { opacity: 0.55; stroke-width: 1.6; }
  50% { opacity: 1; stroke-width: 2.6; }
}

@keyframes slot-v12-medal-lock {
  0% { transform: scale(1.18) rotate(-30deg); }
  50% { transform: scale(1.0) rotate(0deg); }
  100% { transform: scale(1.0) rotate(0deg); }
}
`;

export const SLOT_WILDERNESS_BRONZE_SKIN_CONFIG: TemporarySkinConfig = {
  id: SLOT_WILDERNESS_BRONZE_SKIN_ID,
  name: 'Wilderness · Bronzo Selvatico',
  version: '1.0.0',
  author: 'skin-devtools',
  quality: 'final',
  targetVersion: 'slot@v12',
  compatibility: ['SlotComponent', 'ResidentSlotRack'],
  htmlTemplate: SLOT_WILDERNESS_BRONZE_SKIN_HTML.trim(),
  cssStyles: SLOT_WILDERNESS_BRONZE_SKIN_CSS.trim(),
  componentSlots: {
    SlotComponent: {
      container: 'div[data-slot-host]',
      replaceContent: false,
      preserveStructure: true,
      slotBindings: {
        shadowCircles: "[data-slot='shadow-circles']",
        cavityGroup: "[data-slot='cavity']",
        collarGroup: "[data-slot='collar']",
        bezelGroup: "[data-slot='bezel']",
        teeth: "[data-slot='teeth']",
        arcaneCircle: "[data-slot='arcane']",
        medalGroup: "[data-slot='medal']",
        haloCanvas: "canvas[data-slot='halo']",
      },
    },
  },
  colorTokens: {
    'cavity.obsidian.stop0': '#020101',
    'cavity.obsidian.stop1': '#0a0402',
    'cavity.obsidian.stop2': '#160a05',
    'cavity.obsidian.stop3': '#200f07',
    'cavity.obsidian.stop4': '#2c1709',
    'cavity.obsidian.stop5': '#160c05',
    'rim.arcane.color': 'rgba(162,188,255,1)',
    'collar.bronze.stop0': '#8a5c1e',
    'collar.bronze.stop1': '#5c3a0e',
    'collar.bronze.stop2': '#2e1c06',
    'collar.bronze.stop3': '#180e03',
    'collar.bronze.stop4': '#0a0602',
    'medal.outer.fill.stop0': '#fce890',
    'medal.outer.fill.stop5': '#0e0602',
    'medal.field.stop0': '#2e2012',
    'medal.field.stop3': '#050302',
    'halo.track.color': 'rgba(0,0,0,0.45)',
    'halo.glow.color': 'rgba(255,200,55,0.22)',
  },
  filters: {
    'slot-v12-basalt': {
      label: 'Texture basalto ossidiana',
      type: 'fractalNoise',
      baseFrequency: '0.88',
      numOctaves: 4,
      seed: 7,
      stitchTiles: 'stitch',
      blend: 'overlay',
    },
    'slot-v12-oxide': {
      label: 'Ossidazione ghiera argento',
      type: 'fractalNoise',
      baseFrequency: '0.20 0.16',
      numOctaves: 4,
      seed: 17,
      blend: 'multiply',
    },
    'slot-v12-silver': {
      label: 'Texture argento',
      type: 'fractalNoise',
      baseFrequency: '0.55 0.72',
      numOctaves: 5,
      seed: 31,
      stitchTiles: 'stitch',
      blend: 'overlay',
    },
    'slot-v12-fg-arcane': {
      label: 'Bloom luce arcana',
      gaussianBlur: 5,
    },
  },
  animation: {
    'arcane-breathe': {
      label: 'Respiro luce arcana nella cavity',
      duration: '13s',
      easing: 'ease-in-out',
      property: 'opacity',
    },
    'seal-pulse': {
      label: 'Pulsazione sigillo esagonale',
      duration: '14s',
      easing: 'ease-in-out',
      property: 'opacity',
    },
    'seg-spin': {
      label: 'Rotazione segmenti incisi',
      duration: '65s',
      easing: 'linear',
    },
    'rim-idle': {
      label: 'Respiro bronzo medaglione',
      duration: '9.4s',
      easing: 'ease-in-out',
      property: 'opacity',
    },
    lock: {
      label: 'Animazione lock ghiera',
      durationMs: 560,
      easing: 'easeInOut',
    },
  },
  metadata: {
    pillar: 'wilderness',
    styleLabPreset: 'wanderlust',
    geometry: {
      SZ: 210,
      R_CAV: 58,
      R_RING1: 53,
      R_RING2: 47,
      R_SEAL: 22,
      R_ARC: 51,
      R_BZ_IN: 62,
      R_BZ_OUT: 73,
      R_MED_OUT: 42,
      R_MED_RING: 34,
      R_MED_FLD: 30,
      R_MED_POR: 27,
      TOOTH_HEIGHT: 14,
      TOOTH_WIDTH: 7.5,
    },
    notes: 'Slot v12 wilderness: cavity ossidiana, collare bronzo ossidato, ghiera argento con artigli, medaglione bronzo Cinzel.',
    arcane: {
      alphaEmpty: 0.06,
      alphaOccupied: 0.13,
      strokeWidthEmpty: 1.6,
      strokeWidthOccupied: 2.6,
    },
  },
};

validateTemporarySkinConfig(SLOT_WILDERNESS_BRONZE_SKIN_CONFIG);

export function getSlotWildernessBronzeSkinConfig(): TemporarySkinConfig {
  return SLOT_WILDERNESS_BRONZE_SKIN_CONFIG;
}
