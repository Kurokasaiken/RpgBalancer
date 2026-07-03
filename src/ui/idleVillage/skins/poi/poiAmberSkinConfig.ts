import type { TemporarySkinConfig } from '../temporary/TemporarySkinConfig';
import { validateTemporarySkinConfig } from '../temporary/TemporarySkinConfig';

export const POI_AMBER_SKIN_ID = 'poi_wilderness_amber';

const POI_AMBER_SKIN_HTML = String.raw`
<svg data-poi viewBox="-36 -36 72 72" role="presentation" aria-hidden="true">
  <defs>
    <radialGradient id="sf-poi-wilderness-amber" cx="36%" cy="28%" r="70%">
      <stop offset="0%" stop-color="#1e1608"/>
      <stop offset="100%" stop-color="#030202"/>
    </radialGradient>
    <radialGradient id="sa-poi-wilderness-amber" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="rgba(255,220,120,.22)"/>
      <stop offset="100%" stop-color="rgba(0,0,0,0)"/>
    </radialGradient>
    <linearGradient id="bz-poi-wilderness-amber" x1="14%" y1="4%" x2="86%" y2="96%">
      <stop offset="0%" stop-color="#fce890"/>
      <stop offset="28%" stop-color="#c09030"/>
      <stop offset="100%" stop-color="#200e02"/>
    </linearGradient>
    <filter id="fr-poi-wilderness-amber" x="-80%" y="-80%" width="260%" height="260%">
      <feGaussianBlur stdDeviation="1.0" result="b"/>
      <feComposite in="SourceGraphic" in2="b" operator="over"/>
    </filter>
    <filter id="fim-poi-wilderness-amber" x="-5%" y="-5%" width="110%" height="110%">
      <feTurbulence type="fractalNoise" baseFrequency=".8 .4" numOctaves="3" seed="22" result="n"/>
      <feColorMatrix in="n" type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 .18 0" result="nm"/>
      <feComposite in="SourceGraphic" in2="nm" operator="arithmetic" k1="0" k2="1" k3="0.22" k4="0"/>
    </filter>
    <filter id="fn-poi-wilderness-amber" x="-5%" y="-5%" width="110%" height="110%">
      <feTurbulence type="fractalNoise" baseFrequency=".55" numOctaves="4" seed="7" stitchTiles="stitch" result="n"/>
      <feColorMatrix in="n" type="matrix" values="0 0 0 0 .058 0 0 0 0 .040 0 0 0 0 .016 0 0 0 .22 0" result="c"/>
      <feBlend in="SourceGraphic" in2="c" mode="overlay"/>
    </filter>
    <filter id="ftk-poi-wilderness-amber" x="-5%" y="-5%" width="110%" height="110%">
      <feTurbulence type="fractalNoise" baseFrequency=".35 .15" numOctaves="4" seed="3" stitchTiles="stitch" result="n"/>
      <feColorMatrix in="n" type="matrix" values="0 0 0 0 .04  0 0 0 0 .03  0 0 0 0 .02  0 0 0 .30 0" result="c"/>
      <feBlend in="SourceGraphic" in2="c" mode="overlay"/>
    </filter>
    <filter id="fta-poi-wilderness-amber" x="-15%" y="-15%" width="130%" height="130%">
      <feTurbulence type="turbulence" baseFrequency=".008 .04" numOctaves="3" seed="9" result="t">
        <animate attributeName="seed" values="9;10;11;12;9" dur="7.3s" repeatCount="indefinite"/>
        <animate attributeName="baseFrequency" values=".008 .04;.010 .038;.008 .042;.009 .04;.008 .04" dur="11.7s" repeatCount="indefinite"/>
      </feTurbulence>
      <feDisplacementMap in="SourceGraphic" in2="t" scale="3.5" xChannelSelector="R" yChannelSelector="G" result="d"/>
      <feGaussianBlur in="d" stdDeviation=".4"/>
    </filter>
    <filter id="ftb-poi-wilderness-amber" x="-8%" y="-8%" width="116%" height="116%">
      <feTurbulence type="turbulence" baseFrequency=".025 .08" numOctaves="2" seed="33" result="t">
        <animate attributeName="seed" values="33;34;35;33" dur="3.1s" repeatCount="indefinite"/>
      </feTurbulence>
      <feDisplacementMap in="SourceGraphic" in2="t" scale="1.8" xChannelSelector="R" yChannelSelector="G"/>
    </filter>
    <filter id="fg-poi-wilderness-amber" x="-80%" y="-80%" width="260%" height="260%" color-interpolation-filters="sRGB">
      <feGaussianBlur in="SourceGraphic" stdDeviation="1.0" result="g1"/>
      <feGaussianBlur in="SourceGraphic" stdDeviation="2.5" result="g2"/>
      <feColorMatrix in="g2" type="matrix" values="1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 0 0 .38 0" result="g2d"/>
      <feBlend in="g2d" in2="g1" mode="screen" result="b1"/>
      <feBlend in="b1" in2="SourceGraphic" mode="screen"/>
    </filter>
    <filter id="fpg-poi-wilderness-amber" x="-600%" y="-600%" width="1300%" height="1300%">
      <feGaussianBlur stdDeviation="2.2"/>
    </filter>
    <filter id="fd-poi-wilderness-amber" x="-60%" y="-50%" width="220%" height="220%">
      <feDropShadow dx="0" dy="3" stdDeviation="4.5" flood-color="rgba(0,0,0,.55)"/>
      <feDropShadow dx="0" dy="0.8" stdDeviation="1.5" flood-color="rgba(0,0,0,.35)"/>
    </filter>
    <clipPath id="cp-poi-wilderness-amber"><circle cx="0" cy="0" r="14"/></clipPath>
    <clipPath id="cp-rim-poi-wilderness-amber"><circle cx="0" cy="0" r="21"/></clipPath>
    <clipPath id="cp-corona-poi-wilderness-amber"><circle cx="0" cy="0" r="28"/></clipPath>
  </defs>
  
  <!-- Stone field (background circle) -->
  <g data-slot="stone" filter="url(#fd-poi-wilderness-amber)">
    <circle cx="0" cy="0" r="14" fill="url(#sf-poi-wilderness-amber)" filter="url(#fn-poi-wilderness-amber)" opacity=".98"/>
    <circle cx="0" cy="0" r="14.8" fill="url(#sa-poi-wilderness-amber)" class="s-amb"/>
  </g>
  
  <!-- Rim circle (bronze ring) -->
  <g data-slot="rim" filter="url(#fd-poi-wilderness-amber)" class="rim" clip-path="url(#cp-rim-poi-wilderness-amber)">
    <circle cx="0" cy="0" r="19" fill="none" stroke="rgba(0,0,0,.58)" stroke-width="1" filter="url(#ftk-poi-wilderness-amber)"/>
    <circle cx="0" cy="0" r="20.8" fill="none" stroke="rgba(0,0,0,.72)" stroke-width="1.8"/>
    <circle cx="0" cy="0" r="19" fill="none" stroke="url(#bz-poi-wilderness-amber)" stroke-width="1" filter="url(#fim-poi-wilderness-amber)" opacity=".92"/>
    <circle cx="0" cy="0" r="18" fill="none" stroke="rgba(0,0,0,.50)" stroke-width=".7"/>
  </g>

  <!-- Corona glow (outer glow effect) -->
  <g data-slot="corona-glow" clip-path="url(#cp-corona-poi-wilderness-amber)">
    <circle cx="0" cy="0" r="26" fill="none" stroke="rgba(210,138,28,.50)" stroke-width="3" filter="url(#fg-poi-wilderness-amber)"/>
  </g>

  <!-- Corona turbulence A (animated distortion) -->
  <g data-slot="corona-turb-a" clip-path="url(#cp-corona-poi-wilderness-amber)">
    <circle cx="0" cy="0" r="24" fill="none" stroke="rgba(210,138,28,.70)" stroke-width="2" stroke-dasharray="0 151" stroke-linecap="round" transform="rotate(-90)" filter="url(#fta-poi-wilderness-amber)"/>
  </g>

  <!-- Corona turbulence B (faster animated distortion) -->
  <g data-slot="corona-turb-b" clip-path="url(#cp-corona-poi-wilderness-amber)">
    <circle cx="0" cy="0" r="22" fill="none" stroke="rgba(180,105,10,.60)" stroke-width="1.5" stroke-dasharray="0 138" stroke-linecap="round" transform="rotate(-90)" filter="url(#ftb-poi-wilderness-amber)"/>
  </g>

  <!-- Corona reflect (highlight arc) -->
  <g data-slot="corona-reflect" clip-path="url(#cp-corona-poi-wilderness-amber)">
    <path d="M -18,-18 A 25,25 0 0,1 18,-18" fill="none" stroke="rgba(255,255,255,.15)" stroke-width="2" stroke-linecap="round" filter="url(#fr-poi-wilderness-amber)"/>
  </g>
  
  <!-- Pin icon (center pin symbol) -->
  <g data-slot="pin" clip-path="url(#cp-poi-wilderness-amber)">
    <g transform="translate(.3,.4)" opacity=".55">
      <path d="M0,-5 L0,4" fill="none" stroke="rgba(0,0,0,.95)" stroke-width="1.4" stroke-linecap="round"/>
      <path d="M-2.8,-.3 L2.8,-.3" fill="none" stroke="rgba(0,0,0,.90)" stroke-width="1.0" stroke-linecap="round"/>
      <path d="M-.6,3.4 L.6,3.4 L0,5.2 Z" fill="rgba(0,0,0,.90)"/>
    </g>
    <g class="flicker" opacity=".50">
      <path d="M0,-5 L0,4" fill="none" stroke="rgba(205,190,148,.72)" stroke-width="1.1" stroke-linecap="round"/>
      <path d="M-2.2,-.2 L2.2,-.2" fill="none" stroke="rgba(205,190,148,.65)" stroke-width=".8" stroke-linecap="round"/>
      <path d="M-.4,3.2 L.4,3.2 L0,4.8 Z" fill="rgba(205,190,148,.65)"/>
    </g>
    <circle cx=".15" cy=".18" r="14" fill="none" stroke="rgba(0,0,0,.42)" stroke-width="1.2"/>
  </g>
  
  <!-- Particle layer (for animated particles) -->
  <g data-slot="particles" id="ptl-poi-wilderness-amber"></g>
</svg>`;

const POI_AMBER_SKIN_CSS = String.raw`
[data-poi] {
  width: 60px !important;
  height: 60px !important;
}

[data-poi] circle,
[data-poi] path,
[data-poi] g {
  vector-effect: non-scaling-stroke;
}

/* Pin flicker animation */
@keyframes pin-flicker {
  0%, 100% { opacity: 0.50; }
  25% { opacity: 0.85; }
  50% { opacity: 0.30; }
  75% { opacity: 0.65; }
}

[data-poi] .flicker {
  animation: pin-flicker 4.3s steps(1, end) infinite;
}

/* Stone ambient breathing */
@keyframes stone-ambient {
  0%, 100% { opacity: 0.15; }
  50% { opacity: 0.32; }
}

[data-poi] .s-amb {
  animation: stone-ambient 12.1s ease-in-out infinite;
}

/* Rim breathing effect */
@keyframes rim-breath {
  0%, 100% { opacity: 0.92; }
  45% { opacity: 0.68; }
  75% { opacity: 0.85; }
}

[data-poi] .rim {
  animation: rim-breath 9.4s ease-in-out infinite;
}

/* Particle animations */
@keyframes particle-float {
  0% { transform: translate(0, 0) scale(0); opacity: 0; }
  10% { opacity: 0.8; }
  90% { opacity: 0.8; }
  100% { transform: translate(var(--tx), var(--ty)) scale(1); opacity: 0; }
}

[data-poi] .particle {
  animation: particle-float var(--duration) ease-out infinite;
  animation-delay: var(--delay);
}
`;

export const POI_AMBER_SKIN_CONFIG: TemporarySkinConfig = {
  id: POI_AMBER_SKIN_ID,
  name: 'Ambra Selvatica',
  version: '1.0.0',
  author: 'skin-devtools',
  quality: 'final',
  targetVersion: 'poi@v10',
  compatibility: ['POIComponent'],
  htmlTemplate: POI_AMBER_SKIN_HTML.trim(),
  cssStyles: POI_AMBER_SKIN_CSS.trim(),
  componentSlots: {
    POIComponent: {
      container: 'svg[data-poi]',
      replaceContent: false,
      preserveStructure: true,
      slotBindings: {
        coronaGlow: "[data-slot='corona-glow']",
        coronaTurbA: "[data-slot='corona-turb-a']",
        coronaTurbB: "[data-slot='corona-turb-b']",
        coronaReflect: "[data-slot='corona-reflect']",
        rimCircle: "[data-slot='rim']",
        stoneField: "[data-slot='stone']",
        pinIcon: "[data-slot='pin']",
        particleLayer: "[data-slot='particles']",
      },
    },
  },
  colorTokens: {
    'corona.core': { r: 210, g: 138, b: 28, label: 'Colore principale arco' },
    'corona.glow': { r: 180, g: 105, b: 10, label: 'Glow bloom esterno' },
    'rim.stop0': '#fce890',
    'rim.stop1': '#c09030',
    'rim.stop2': '#200e02',
    'stone.stop0': '#1e1608',
    'stone.stop1': '#030202',
    'stone.ambient': 'rgba(255,220,120,.22)',
    'pin.color': 'rgba(205,190,148,.72)',
  },
  filters: {
    'corona.turbulence.slow': {
      baseFrequency: '0.008 0.04',
      numOctaves: 3,
      animateSeed: true,
      displacementScale: 3.5,
    },
    'corona.turbulence.fast': {
      baseFrequency: '0.025 0.08',
      numOctaves: 2,
      animateSeed: true,
      displacementScale: 1.8,
    },
    'rim.imperfections': {
      baseFrequency: '0.8 0.4',
      numOctaves: 3,
      seed: 22,
      blendAlpha: 0.18,
    },
    'stone.noise': {
      baseFrequency: '0.55',
      numOctaves: 4,
      seed: 7,
    },
  },
  animation: {
    'rim.breath': { duration: '9.4s', easing: 'ease-in-out', opacityMin: 0.68, opacityMax: 0.92 },
    'stone.ambient': { duration: '12.1s', easing: 'ease-in-out', opacityMin: 0.15, opacityMax: 0.32 },
    'pin.flicker': { duration: '4.3s', timingFunction: 'steps(1,end)' },
    'corona.fill': { easing: 'viscous', durationMs: 9000 },
    'corona.pulse': { amplitudeMin: 0.6, amplitudeMax: 1.0, phaseIncrement: 0.015 },
    'corona.reflect': { arcFraction: 0.14, driftSpeed: 0.0008 },
  },
  particles: {
    maxCount: 5,
    spawnIntervalMs: [600, 1800],
    speedRange: [0.0002, 0.0005],
    sizeRange: [0.6, 1.6],
    maxAlphaRange: [0.45, 0.8],
    lifetimeMs: [2800, 5000],
  },
  metadata: {
    pillar: 'wilderness',
    styleLabPreset: 'wanderlust',
    notes: 'Corona turbolenta in ambra/oro su pietra ossidiana. Rim bronzo con imperfezioni organiche. Particelle bolle sull\'arco.',
  },
};

validateTemporarySkinConfig(POI_AMBER_SKIN_CONFIG);

export function getPoiAmberSkinConfig(): TemporarySkinConfig {
  return POI_AMBER_SKIN_CONFIG;
}
