import type { TemporarySkinConfig } from '../temporary/TemporarySkinConfig';
import { validateTemporarySkinConfig } from '../temporary/TemporarySkinConfig';

// Load the source skin data directly
export const slotV12SkinData = {
  id: "slot-wilderness-bronze",
  name: "Wilderness · Bronzo Selvatico",
  version: "1.0.0",
  author: "skin-devtools",
  quality: "AAA",
  targetVersion: "slot@v12",
  compatibility: ["SlotComponent", "ResidentSlotRack"],
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
    TOOTH_WIDTH: 7.5
  },
  filters: {
    "fn-basalt": {
      label: "Texture basalto ossidiana",
      type: "fractalNoise",
      baseFrequency: "0.88",
      numOctaves: 4,
      seed: 7,
      stitchTiles: "stitch",
      blend: "overlay",
      colorMatrix: { r: 0.014, g: 0.009, b: 0.003, a: 0.28 }
    },
    "fn-vein": {
      label: "Venatura ossidiana (direzione anisotropica)",
      type: "turbulence",
      baseFrequency: "0.012 0.085",
      numOctaves: 4,
      seed: 5,
      stitchTiles: "stitch",
      blend: "overlay",
      colorMatrix: { r: 0.018, g: 0.010, b: 0.003, a: 0.26 }
    },
    "fn-silver": {
      label: "Texture argento (anisotropica fine)",
      type: "fractalNoise",
      baseFrequency: "0.55 0.72",
      numOctaves: 5,
      seed: 31,
      stitchTiles: "stitch",
      blend: "overlay",
      colorMatrix: { r: 0.032, g: 0.032, b: 0.038, a: 0.28 }
    },
    "fn-oxide": {
      label: "Ossidazione ghiera argento (moltiply blend)",
      type: "fractalNoise",
      baseFrequency: "0.20 0.16",
      numOctaves: 4,
      seed: 17,
      stitchTiles: "stitch",
      blend: "multiply",
      colorMatrix: { r: 0.008, g: 0.008, b: 0.010, a: 0.48 }
    },
    "fg-arcane": {
      label: "Bloom luce arcana (glow blu/verde nella cavity)",
      gaussianBlur: 5,
      colorMatrix: {
        note: "Tinta fredda blu-verde, alpha .85",
        rr: 0.42, gg: 0.52, bb: 1.0,
        r_offset: 0.10, g_offset: 0.16, b_offset: 0.50,
        a: 0.85
      }
    }
  },
  animations: {
    "arcane-breathe": {
      label: "Respiro luce arcana nella cavity",
      keyframes: { "0%": 0.55, "50%": 1.0, "100%": 0.55 },
      durationEmpty: "13s",
      durationOccupied: "8s",
      easing: "ease-in-out",
      property: "opacity"
    },
    "seal-pulse": {
      label: "Pulsazione sigillo esagonale (solo vuoto)",
      keyframes: { "0%": 0.10, "50%": 0.22, "100%": 0.10 },
      duration: "14s",
      easing: "ease-in-out",
      property: "opacity"
    },
    "seg-spin": {
      label: "Rotazione lenta segmenti incisi ghiera",
      duration: "65s",
      easing: "linear",
      direction: "clockwise"
    },
    "rim-idle": {
      label: "Respiro bronzo medaglione",
      keyframes: { "0%": 0.92, "45%": 0.68, "75%": 0.85, "100%": 0.92 },
      duration: "9.4s",
      easing: "ease-in-out",
      property: "opacity"
    },
    "lock": {
      label: "Animazione lock — ghiera si chiude sui denti",
      phase1: {
        label: "Bezel scale 1.18→1.0, rotate -30°→0°",
        durationMs: 560,
        easing: "easeInOut",
        startScale: 1.18,
        endScale: 1.0,
        startRotateDeg: -30,
        endRotateDeg: 0
      },
      phase2: {
        label: "Teeth press radiale verso centro +6px",
        durationMs: 180,
        easing: "easeOut",
        pressPx: 6
      },
      phase3: {
        label: "Micro spring-back -2px",
        durationMs: 80,
        easing: "easeOut",
        springBackPx: 2
      }
    },
    "halo-fill": {
      label: "Arco halo canvas si riempie al lock",
      durationMs: 1200,
      easing: "linear",
      startFrac: 0.0,
      endFrac: 1.0
    }
  },
  states: {
    empty: {
      label: "Slot vuoto — nessun medaglione",
      sealVisible: true,
      medalVisible: false,
      haloVisible: false,
      arcaneAlpha: 0.06,
      arcaneStrokeWidth: 1.6,
      arcaneDuration: "13s",
      bezelScale: 1.18,
      bezelRotateDeg: -30
    },
    occupied: {
      label: "Slot occupato — medaglione presente, halo animato",
      sealVisible: false,
      medalVisible: true,
      haloVisible: true,
      arcaneAlpha: 0.13,
      arcaneStrokeWidth: 2.6,
      arcaneDuration: "8s",
      bezelScale: 1.0,
      bezelRotateDeg: 0
    },
    locking: {
      label: "Transizione lock in corso — animazione fase 1-3",
      triggerAnimation: "lock"
    }
  },
  componentSlots: {
    SlotComponent: {
      container: "div.slot-host",
      replaceContent: false,
      preserveStructure: true,
      slotBindings: {
        cavityGroup: "[data-slot='cavity']",
        sealGroup: "[data-slot='seal']",
        arcaneCircle: "[data-slot='arcane']",
        collarGroup: "[data-slot='collar']",
        bezelGroup: "[data-slot='bezel']",
        bezelSegments: "[data-slot='bezel-segments']",
        teeth: "[data-slot='teeth']",
        medalGroup: "[data-slot='medal']",
        medalLetter: "[data-slot='medal-letter']",
        haloCanvas: "canvas[data-slot='halo']"
      }
    }
  },
  metadata: {
    pillar: "Wilderness",
    styleLabPreset: "frontier-bronze",
    layerOrder: [
      "shadow-circles",
      "cavity-group (clipped R_BZ_IN=62)",
      "collar-ring (R_CAV=58 → R_BZ_IN=62)",
      "bezel-group (silver, unclipped, scales)",
      "medal-group (occupied only)",
      "halo-canvas (occupied only, positioned absolute)"
    ],
    notes: "Slot v12 wilderness. Cavity ossidiana con venature anisotropiche. Collare bronzo ossidato. Ghiera argento con 16 segmenti incisi rotanti e 3 denti/artigli (ore 12/4/8). Medaglione bronzo con lettera Cinzel. Halo canvas amber/gold."
  }
};

/**
 * Convert slot-v12-skin.json to TemporarySkinConfig format
 * Wilderness Bronze skin for slot components
 */
export const SLOT_WILDERNESS_BRONZE_CONFIG: TemporarySkinConfig = {
  id: 'slot_wilderness_bronze',
  name: 'Wilderness · Bronzo Selvatico',
  version: '1.0.0',
  author: 'skin-devtools',
  quality: 'final',
  targetVersion: 'slot@v12',
  compatibility: ['SlotComponent', 'ResidentSlotRack'],
  
  // Convert geometry to CSS custom properties
  htmlTemplate: `
    <div class="slot-wilderness-bronze" data-skin-id="slot_wilderness_bronze">
      <div data-slot="cavity" class="cavity-group">
        <svg data-slot="arcane" class="arcane-circle" viewBox="0 0 420 420">
          <circle cx="210" cy="210" r="195" fill="none" stroke="currentColor" stroke-width="2" />
        </svg>
        <div data-slot="seal" class="seal-group">
          <svg viewBox="0 0 420 420">
            <polygon points="210,170 250,210 210,250 170,210" fill="none" stroke="currentColor" stroke-width="0.46" opacity="0.16" />
          </svg>
        </div>
      </div>
      <div data-slot="collar" class="collar-ring"></div>
      <div data-slot="bezel" class="bezel-group">
        <div data-slot="bezel-segments" class="bezel-segments"></div>
        <div data-slot="teeth" class="teeth">
          <div class="tooth" style="transform: rotate(270deg)"></div>
          <div class="tooth" style="transform: rotate(30deg)"></div>
          <div class="tooth" style="transform: rotate(150deg)"></div>
        </div>
      </div>
      <div data-slot="medal" class="medal-group">
        <div data-slot="medal-letter" class="medal-letter"></div>
      </div>
      <canvas data-slot="halo" class="halo-canvas" width="420" height="420"></canvas>
    </div>
  `,

  // Convert colorTokens to CSS variables
  cssStyles: `
    .slot-wilderness-bronze {
      --slot-sz: 210px;
      --r-cav: 58px;
      --r-ring1: 53px;
      --r-ring2: 47px;
      --r-seal: 22px;
      --r-arc: 51px;
      --r-bz-in: 62px;
      --r-bz-out: 73px;
      --r-med-out: 42px;
      --r-med-ring: 34px;
      --r-med-fld: 30px;
      --r-med-por: 27px;
      --tooth-height: 14px;
      --tooth-width: 7.5px;
      
      /* Cavity colors */
      --obsidian-stop0: #020101;
      --obsidian-stop1: #0a0402;
      --obsidian-stop2: #160a05;
      --obsidian-stop3: #200f07;
      --obsidian-stop4: #2c1709;
      --obsidian-stop5: #160c05;
      --rim-stop0: rgba(0,0,0,0);
      --rim-stop1: rgba(70,48,20,.45);
      --rim-stop2: rgba(88,60,24,.80);
      --rim-stop3: rgba(40,24,8,.30);
      --arcane-color: rgba(162,188,255,1);
      --arcane-alpha-empty: 0.06;
      --arcane-alpha-occupied: 0.13;
      --arcane-stroke-width-empty: 1.6px;
      --arcane-stroke-width-occupied: 2.6px;
      
      /* Seal colors */
      --seal-color: rgba(162,188,255,.42);
      --seal-stroke-width: 0.46px;
      --seal-opacity: 0.16;
      
      /* Collar colors */
      --collar-base: #1a0e05;
      --bronze-stop0: #8a5c1e;
      --bronze-stop1: #5c3a0e;
      --bronze-stop2: #2e1c06;
      --bronze-stop3: #180e03;
      --bronze-stop4: #0a0602;
      --collar-specular: rgba(255,235,140,.22);
      
      /* Bezel colors */
      --bezel-foundation: rgba(6,6,10,.98);
      --silver-stop0: #c4c4d0;
      --silver-stop1: #9292a0;
      --silver-stop2: #646472;
      --silver-stop3: #464654;
      --silver-stop4: #2c2c38;
      --bevel-stop0: rgba(255,255,255,.22);
      --bevel-stop1: rgba(255,255,255,.08);
      --bevel-stop2: rgba(0,0,0,.06);
      --bevel-stop3: rgba(0,0,0,.26);
      --border-outer: rgba(3,2,1,.92);
      --border-inner: rgba(172,134,34,.12);
      --bezel-specular: rgba(255,255,255,.25);
      --segments-n: 16;
      
      /* Tooth colors */
      --claw-stop0: #c0c0ce;
      --claw-stop1: #808090;
      --claw-stop2: #3e3e4e;
      --tooth-shadow: rgba(0,0,0,.75);
      --tip-glow: rgba(175,195,255,.18);
      
      /* Medal colors */
      --outer-fill-stop0: #fce890;
      --outer-fill-stop1: #e4b048;
      --outer-fill-stop2: #a05c18;
      --outer-fill-stop3: #602c08;
      --outer-fill-stop4: #341604;
      --outer-fill-stop5: #0e0602;
      --outer-shine-stop0: rgba(255,240,165,.28);
      --outer-shine-stop1: rgba(255,225,135,.08);
      --outer-shine-stop2: rgba(0,0,0,.55);
      --inner-ring-stop0: #f0d070;
      --inner-ring-stop1: #c88430;
      --inner-ring-stop2: #7c3e10;
      --inner-ring-stop3: #3c1c04;
      --inner-ring-stop4: #160a02;
      --field-stop0: #2e2012;
      --field-stop1: #1a1008;
      --field-stop2: #0e0804;
      --field-stop3: #050302;
      --letter-color: rgba(200,155,50,.68);
      --letter-font: "Cinzel",Georgia,serif;
      --letter-weight: 600;
      --highlight-color: rgba(255,255,255,.22);
      --portrait-rim: rgba(180,110,28,.28);
      
      /* Halo colors */
      --track-color: rgba(0,0,0,.45);
      --track-width: 4.5px;
      --glow-color: rgba(255,200,55,.22);
      --glow-blur: 12%;
      --arc-color-start: rgba(190,130,18,.72);
      --arc-color-end: rgba(255,205,55,.92);
      --tip-color: rgba(255,245,190,.85);
      --radius-offset: 5px;
      
      position: relative;
      width: var(--slot-sz);
      height: var(--slot-sz);
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    .cavity-group {
      position: absolute;
      width: calc(var(--r-bz-in) * 2);
      height: calc(var(--r-bz-in) * 2);
      border-radius: 50%;
      background: radial-gradient(circle at 30% 30%, 
        var(--obsidian-stop0) 0%, 
        var(--obsidian-stop1) 20%, 
        var(--obsidian-stop2) 40%, 
        var(--obsidian-stop3) 60%, 
        var(--obsidian-stop4) 80%, 
        var(--obsidian-stop5) 100%);
      clip-path: circle(var(--r-bz-in) at center);
    }
    
    .arcane-circle {
      position: absolute;
      width: 100%;
      height: 100%;
      color: var(--arcane-color);
      opacity: var(--arcane-alpha-empty);
      stroke-width: var(--arcane-stroke-width-empty);
      animation: arcane-breathe 13s ease-in-out infinite;
    }
    
    .slot-wilderness-bronze.occupied .arcane-circle {
      opacity: var(--arcane-alpha-occupied);
      stroke-width: var(--arcane-stroke-width-occupied);
      animation-duration: 8s;
    }
    
    .seal-group {
      position: absolute;
      width: 100%;
      height: 100%;
      opacity: var(--seal-opacity);
    }
    
    .seal-group svg {
      width: 100%;
      height: 100%;
      color: var(--seal-color);
      stroke-width: var(--seal-stroke-width);
      animation: seal-pulse 14s ease-in-out infinite;
    }
    
    .slot-wilderness-bronze.occupied .seal-group {
      display: none;
    }
    
    .collar-ring {
      position: absolute;
      width: calc(var(--r-cav) * 2);
      height: calc(var(--r-cav) * 2);
      border-radius: 50%;
      background: linear-gradient(135deg, 
        var(--bronze-stop0) 0%, 
        var(--bronze-stop1) 25%, 
        var(--bronze-stop2) 50%, 
        var(--bronze-stop3) 75%, 
        var(--bronze-stop4) 100%);
      box-shadow: inset 0 0 10px var(--collar-specular);
    }
    
    .bezel-group {
      position: absolute;
      width: 100%;
      height: 100%;
      background: radial-gradient(circle at 30% 30%, 
        var(--bezel-foundation) 0%, 
        var(--silver-stop0) 10%, 
        var(--silver-stop1) 30%, 
        var(--silver-stop2) 50%, 
        var(--silver-stop3) 70%, 
        var(--silver-stop4) 90%);
      border-radius: 50%;
      box-shadow: 
        inset 0 0 5px var(--bevel-stop0),
        inset 0 0 10px var(--bevel-stop1),
        inset 0 0 15px var(--bevel-stop2),
        inset 0 0 20px var(--bevel-stop3),
        0 0 2px var(--border-outer),
        0 0 1px var(--border-inner);
      transform: scale(1.18) rotate(-30deg);
      transition: transform 0.56s ease-in-out, transform 0.18s ease-out, transform 0.08s ease-out;
    }
    
    .slot-wilderness-bronze.occupied .bezel-group {
      transform: scale(1.0) rotate(0deg);
    }
    
    .bezel-segments {
      position: absolute;
      width: 100%;
      height: 100%;
      background: conic-gradient(from 0deg, 
        transparent 0deg, 
        var(--bevel-stop0) calc(360deg / var(--segments-n) / 2), 
        transparent calc(360deg / var(--segments-n)));
      border-radius: 50%;
      animation: seg-spin 65s linear infinite;
    }
    
    .teeth {
      position: absolute;
      width: 100%;
      height: 100%;
    }
    
    .tooth {
      position: absolute;
      top: 50%;
      left: 50%;
      width: var(--tooth-width);
      height: var(--tooth-height);
      background: linear-gradient(to bottom, 
        var(--claw-stop0) 0%, 
        var(--claw-stop1) 50%, 
        var(--claw-stop2) 100%);
      transform-origin: center bottom;
      box-shadow: 0 5px 10px var(--tooth-shadow);
      border-radius: 2px;
      margin-left: calc(var(--tooth-width) / -2);
      margin-top: calc(var(--r-bz-out) - var(--tooth-height));
    }
    
    .tooth::after {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 2px;
      background: var(--tip-glow);
      border-radius: 1px;
    }
    
    .medal-group {
      position: absolute;
      width: calc(var(--r-med-out) * 2);
      height: calc(var(--r-med-out) * 2);
      border-radius: 50%;
      background: radial-gradient(circle at 30% 30%, 
        var(--outer-fill-stop0) 0%, 
        var(--outer-fill-stop1) 20%, 
        var(--outer-fill-stop2) 40%, 
        var(--outer-fill-stop3) 60%, 
        var(--outer-fill-stop4) 80%, 
        var(--outer-fill-stop5) 100%);
      box-shadow: 
        inset 0 0 10px var(--outer-shine-stop0),
        inset 0 0 20px var(--outer-shine-stop1),
        inset 0 0 30px var(--outer-shine-stop2),
        0 0 5px var(--portrait-rim);
      display: none;
      animation: rim-idle 9.4s ease-in-out infinite;
    }
    
    .slot-wilderness-bronze.occupied .medal-group {
      display: block;
    }
    
    .medal-letter {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      color: var(--letter-color);
      font-family: var(--letter-font);
      font-weight: var(--letter-weight);
      font-size: 24px;
      text-shadow: 0 0 5px var(--highlight-color);
    }
    
    .halo-canvas {
      position: absolute;
      width: 100%;
      height: 100%;
      display: none;
    }
    
    .slot-wilderness-bronze.occupied .halo-canvas {
      display: block;
    }
    
    /* Animations */
    @keyframes arcane-breathe {
      0%, 100% { opacity: 0.55; }
      50% { opacity: 1.0; }
    }
    
    @keyframes seal-pulse {
      0%, 100% { opacity: 0.10; }
      50% { opacity: 0.22; }
    }
    
    @keyframes seg-spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
    
    @keyframes rim-idle {
      0%, 100% { opacity: 0.92; }
      45% { opacity: 0.68; }
      75% { opacity: 0.85; }
    }
    
    @keyframes lock-scale {
      0% { transform: scale(1.18) rotate(-30deg); }
      100% { transform: scale(1.0) rotate(0deg); }
    }
    
    @keyframes lock-teeth-press {
      0% { transform: translateY(0); }
      100% { transform: translateY(6px); }
    }
    
    @keyframes lock-teeth-spring {
      0% { transform: translateY(6px); }
      100% { transform: translateY(4px); }
    }
    
    .slot-wilderness-bronze.locking .bezel-group {
      animation: lock-scale 0.56s ease-in-out forwards;
    }
    
    .slot-wilderness-bronze.locking .tooth {
      animation: lock-teeth-press 0.18s ease-out forwards, lock-teeth-spring 0.08s ease-out 0.18s forwards;
    }
  `,
  
  componentSlots: {
    SlotComponent: {
      container: '.slot-wilderness-bronze',
      replaceContent: false,
      preserveStructure: true,
      slotBindings: {
        cavityGroup: '[data-slot="cavity"]',
        sealGroup: '[data-slot="seal"]',
        arcaneCircle: '[data-slot="arcane"]',
        collarGroup: '[data-slot="collar"]',
        bezelGroup: '[data-slot="bezel"]',
        bezelSegments: '[data-slot="bezel-segments"]',
        teeth: '[data-slot="teeth"]',
        medalGroup: '[data-slot="medal"]',
        medalLetter: '[data-slot="medal-letter"]',
        haloCanvas: '[data-slot="halo"]'
      }
    }
  },
  
  // Convert colorTokens to the expected format
  colorTokens: {
    // Cavity colors
    'obsidian.stop0': '#020101',
    'obsidian.stop1': '#0a0402',
    'obsidian.stop2': '#160a05',
    'obsidian.stop3': '#200f07',
    'obsidian.stop4': '#2c1709',
    'obsidian.stop5': '#160c05',
    'rim.stop0': 'rgba(0,0,0,0)',
    'rim.stop1': 'rgba(70,48,20,.45)',
    'rim.stop2': 'rgba(88,60,24,.80)',
    'rim.stop3': 'rgba(40,24,8,.30)',
    'arcane.color': 'rgba(162,188,255,1)',
    'arcane.alpha.empty': '0.06',
    'arcane.alpha.occupied': '0.13',
    'arcane.strokeWidth.empty': '1.6',
    'arcane.strokeWidth.occupied': '2.6',
    
    // Seal colors
    'seal.color': 'rgba(162,188,255,.42)',
    'seal.strokeWidth': '0.46',
    'seal.opacity': '0.16',
    
    // Collar colors
    'collar.base': '#1a0e05',
    'bronze.stop0': '#8a5c1e',
    'bronze.stop1': '#5c3a0e',
    'bronze.stop2': '#2e1c06',
    'bronze.stop3': '#180e03',
    'bronze.stop4': '#0a0602',
    'collar.specular': 'rgba(255,235,140,.22)',
    
    // Bezel colors
    'bezel.foundation': 'rgba(6,6,10,.98)',
    'silver.stop0': '#c4c4d0',
    'silver.stop1': '#9292a0',
    'silver.stop2': '#646472',
    'silver.stop3': '#464654',
    'silver.stop4': '#2c2c38',
    'bevel.stop0': 'rgba(255,255,255,.22)',
    'bevel.stop1': 'rgba(255,255,255,.08)',
    'bevel.stop2': 'rgba(0,0,0,.06)',
    'bevel.stop3': 'rgba(0,0,0,.26)',
    'border.outer': 'rgba(3,2,1,.92)',
    'border.inner': 'rgba(172,134,34,.12)',
    'bezel.specular': 'rgba(255,255,255,.25)',
    'segments.n': '16',
    
    // Tooth colors
    'claw.stop0': '#c0c0ce',
    'claw.stop1': '#808090',
    'claw.stop2': '#3e3e4e',
    'tooth.shadow': 'rgba(0,0,0,.75)',
    'tip.glow': 'rgba(175,195,255,.18)',
    
    // Medal colors
    'outer.fill.stop0': '#fce890',
    'outer.fill.stop1': '#e4b048',
    'outer.fill.stop2': '#a05c18',
    'outer.fill.stop3': '#602c08',
    'outer.fill.stop4': '#341604',
    'outer.fill.stop5': '#0e0602',
    'outer.shine.stop0': 'rgba(255,240,165,.28)',
    'outer.shine.stop1': 'rgba(255,225,135,.08)',
    'outer.shine.stop2': 'rgba(0,0,0,.55)',
    'inner.ring.stop0': '#f0d070',
    'inner.ring.stop1': '#c88430',
    'inner.ring.stop2': '#7c3e10',
    'inner.ring.stop3': '#3c1c04',
    'inner.ring.stop4': '#160a02',
    'field.stop0': '#2e2012',
    'field.stop1': '#1a1008',
    'field.stop2': '#0e0804',
    'field.stop3': '#050302',
    'letter.color': 'rgba(200,155,50,.68)',
    'letter.font': 'Cinzel,Georgia,serif',
    'letter.weight': '600',
    'highlight.color': 'rgba(255,255,255,.22)',
    'portrait.rim': 'rgba(180,110,28,.28)',
    
    // Halo colors
    'track.color': 'rgba(0,0,0,.45)',
    'track.width': '4.5',
    'glow.color': 'rgba(255,200,55,.22)',
    'glow.blur': '12%',
    'arc.colorStart': 'rgba(190,130,18,.72)',
    'arc.colorEnd': 'rgba(255,205,55,.92)',
    'tip.color': 'rgba(255,245,190,.85)',
    'radius.offset': '5'
  },
  
  // Convert filters
  filters: slotV12SkinData.filters,
  
  // Convert animations to the expected format
  animation: {
    'arcane-breathe': {
      label: 'Respiro luce arcana nella cavity',
      keyframes: { '0%': 0.55, '50%': 1.0, '100%': 0.55 },
      durationEmpty: '13s',
      durationOccupied: '8s',
      easing: 'ease-in-out',
      property: 'opacity'
    },
    'seal-pulse': {
      label: 'Pulsazione sigillo esagonale (solo vuoto)',
      keyframes: { '0%': 0.10, '50%': 0.22, '100%': 0.10 },
      duration: '14s',
      easing: 'ease-in-out',
      property: 'opacity'
    },
    'seg-spin': {
      label: 'Rotazione lenta segmenti incisi ghiera',
      duration: '65s',
      easing: 'linear',
      direction: 'clockwise'
    },
    'rim-idle': {
      label: 'Respiro bronzo medaglione',
      keyframes: { '0%': 0.92, '45%': 0.68, '75%': 0.85, '100%': 0.92 },
      duration: '9.4s',
      easing: 'ease-in-out',
      property: 'opacity'
    },
    'lock': {
      label: 'Animazione lock — ghiera si chiude sui denti',
      phase1: {
        label: 'Bezel scale 1.18→1.0, rotate -30°→0°',
        durationMs: 560,
        easing: 'easeInOut',
        startScale: 1.18,
        endScale: 1.0,
        startRotateDeg: -30,
        endRotateDeg: 0
      },
      phase2: {
        label: 'Teeth press radiale verso centro +6px',
        durationMs: 180,
        easing: 'easeOut',
        pressPx: 6
      },
      phase3: {
        label: 'Micro spring-back -2px',
        durationMs: 80,
        easing: 'easeOut',
        springBackPx: 2
      }
    },
    'halo-fill': {
      label: 'Arco halo canvas si riempie al lock',
      durationMs: 1200,
      easing: 'linear',
      startFrac: 0.0,
      endFrac: 1.0
    }
  },
  
  metadata: {
    pillar: 'Wilderness',
    styleLabPreset: 'frontier-bronze',
    layerOrder: [
      'shadow-circles',
      'cavity-group (clipped R_BZ_IN=62)',
      'collar-ring (R_CAV=58 → R_BZ_IN=62)',
      'bezel-group (silver, unclipped, scales)',
      'medal-group (occupied only)',
      'halo-canvas (occupied only, positioned absolute)'
    ],
    notes: 'Slot v12 wilderness. Cavity ossidiana con venature anisotropiche. Collare bronzo ossidato. Ghiera argento con 16 segmenti incisi rotanti e 3 denti/artigli (ore 12/4/8). Medaglione bronzo con lettera Cinzel. Halo canvas amber/gold.'
  }
};

// Validate the config
validateTemporarySkinConfig(SLOT_WILDERNESS_BRONZE_CONFIG);

export default SLOT_WILDERNESS_BRONZE_CONFIG;
