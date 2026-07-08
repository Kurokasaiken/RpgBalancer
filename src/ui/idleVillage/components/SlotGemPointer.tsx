import React from 'react';

/**
 * SlotGemPointer — the marquise emerald "pointer" gem set at 6 o'clock.
 *
 * This is the seated counterpart of the gem rendered on the dragged token
 * (`WanderlustMedalOverlay`). Rendering it as part of the occupied slot — and,
 * crucially, ABOVE the bezel ring — guarantees the gem never disappears when the
 * token snaps home: the flying token's gem hands off to an identical, always-on-top
 * gem mounted in the slot's 6 o'clock housing.
 *
 * All gradient/filter ids are prefixed (`slot-v12-gem-*`) to avoid collisions with
 * the overlay gem while both are briefly in the DOM during the flight hand-off.
 *
 * @param cy - vertical center of the gem in the parent SVG's viewBox units.
 * @param scale - uniform scale applied to the native gem geometry.
 */
export interface SlotGemPointerProps {
  cy: number;
  scale?: number;
}

export const SlotGemPointer: React.FC<SlotGemPointerProps> = ({ cy, scale = 1.14 }) => {
  return (
    <g
      transform={`translate(0, ${cy}) scale(${scale})`}
      data-layer="gem-pointer"
      style={{ pointerEvents: 'none' }}
      aria-hidden
    >
      <defs>
        <linearGradient id="slot-v12-gem-b" x1="14%" y1="4%" x2="86%" y2="96%">
          <stop offset="0%" stopColor="#fce890" /><stop offset="9%" stopColor="#e4b048" />
          <stop offset="28%" stopColor="#a05c18" /><stop offset="52%" stopColor="#602c08" />
          <stop offset="76%" stopColor="#341604" /><stop offset="100%" stopColor="#0e0602" />
        </linearGradient>
        <linearGradient id="slot-v12-gem-ri" x1="12%" y1="8%" x2="88%" y2="92%">
          <stop offset="0%" stopColor="#f0d070" /><stop offset="16%" stopColor="#c88430" />
          <stop offset="46%" stopColor="#7c3e10" /><stop offset="80%" stopColor="#3c1c04" />
          <stop offset="100%" stopColor="#160a02" />
        </linearGradient>
        <linearGradient id="slot-v12-gem-top" x1="30%" y1="0%" x2="70%" y2="100%">
          <stop offset="0%" stopColor="#d8ffd8" /><stop offset="40%" stopColor="#72ee82" />
          <stop offset="100%" stopColor="#1a7830" />
        </linearGradient>
        <linearGradient id="slot-v12-gem-lu" x1="0%" y1="20%" x2="100%" y2="80%">
          <stop offset="0%" stopColor="#58d868" /><stop offset="100%" stopColor="#0e5c20" />
        </linearGradient>
        <linearGradient id="slot-v12-gem-ru" x1="100%" y1="20%" x2="0%" y2="80%">
          <stop offset="0%" stopColor="#88ee98" /><stop offset="100%" stopColor="#1a6828" />
        </linearGradient>
        <linearGradient id="slot-v12-gem-ll" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#1a6828" /><stop offset="100%" stopColor="#083c14" />
        </linearGradient>
        <linearGradient id="slot-v12-gem-rl" x1="100%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#2a8838" /><stop offset="100%" stopColor="#0a4818" />
        </linearGradient>
        <linearGradient id="slot-v12-gem-bot" x1="30%" y1="0%" x2="70%" y2="100%">
          <stop offset="0%" stopColor="#0e5020" /><stop offset="100%" stopColor="#042810" />
        </linearGradient>
        <radialGradient id="slot-v12-gem-caus" cx="68%" cy="72%" r="44%">
          <stop offset="0%" stopColor="rgba(140,255,160,.30)" /><stop offset="100%" stopColor="rgba(80,220,100,0)" />
        </radialGradient>
        <radialGradient id="slot-v12-gem-flash" cx="32%" cy="22%" r="28%">
          <stop offset="0%" stopColor="rgba(255,255,255,.88)" /><stop offset="50%" stopColor="rgba(255,255,255,.26)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0)" />
        </radialGradient>
        <radialGradient id="slot-v12-gem-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="rgba(58,215,80,.32)" /><stop offset="100%" stopColor="rgba(38,180,60,0)" />
        </radialGradient>
        <radialGradient id="slot-v12-gem-ao" cx="50%" cy="50%" r="50%">
          <stop offset="55%" stopColor="rgba(0,0,0,0)" /><stop offset="80%" stopColor="rgba(0,0,0,.52)" />
          <stop offset="100%" stopColor="rgba(0,0,0,.86)" />
        </radialGradient>
        <filter id="slot-v12-gem-fn" x="-30%" y="-30%" width="160%" height="160%">
          <feTurbulence type="fractalNoise" baseFrequency="0.52" numOctaves={4} seed="3" stitchTiles="stitch" result="n" />
          <feColorMatrix in="n" type="matrix" values="0 0 0 0 .068  0 0 0 0 .046  0 0 0 0 .021  0 0 0 .25 0" result="c" />
          <feBlend in="SourceGraphic" in2="c" mode="overlay" />
        </filter>
      </defs>

      {/* Glow */}
      <ellipse cx="0" cy="0" rx="10" ry="8" fill="url(#slot-v12-gem-glow)" style={{ filter: 'blur(3.5px)' }} />

      {/* 6 claws */}
      <path d="M-1,-9.5 C-.7,-8 -.5,-6.5 -.8,-5.2 C-.5,-4.5 0,-4.2 .8,-5.2 C.5,-6.5 .7,-8 1,-9.5 C.5,-10.2 -.5,-10.2 -1,-9.5 Z" fill="url(#slot-v12-gem-b)" filter="url(#slot-v12-gem-fn)" opacity=".92" />
      <path d="M7.2,-5.5 C6,-4.5 5.4,-3.6 4.8,-2.6 C5.1,-2 5.8,-1.8 6.5,-2.6 C7,-3.6 7.5,-4.5 8.2,-5.3 C7.6,-6.2 6.8,-6 7.2,-5.5 Z" fill="url(#slot-v12-gem-b)" filter="url(#slot-v12-gem-fn)" opacity=".90" />
      <path d="M7.2,5.5 C6,4.5 5.4,3.6 4.8,2.6 C5.1,2 5.8,1.8 6.5,2.6 C7,3.6 7.5,4.5 8.2,5.3 C7.6,6.2 6.8,6 7.2,5.5 Z" fill="url(#slot-v12-gem-b)" filter="url(#slot-v12-gem-fn)" opacity=".90" />
      <path d="M-1,9.5 C-.7,8 -.5,6.5 -.8,5.2 C-.5,4.5 0,4.2 .8,5.2 C.5,6.5 .7,8 1,9.5 C.5,10.2 -.5,10.2 -1,9.5 Z" fill="url(#slot-v12-gem-b)" filter="url(#slot-v12-gem-fn)" opacity=".88" />
      <path d="M-7.2,5.5 C-6,4.5 -5.4,3.6 -4.8,2.6 C-5.1,2 -5.8,1.8 -6.5,2.6 C-7,3.6 -7.5,4.5 -8.2,5.3 C-7.6,6.2 -6.8,6 -7.2,5.5 Z" fill="url(#slot-v12-gem-b)" filter="url(#slot-v12-gem-fn)" opacity=".90" />
      <path d="M-7.2,-5.5 C-6,-4.5 -5.4,-3.6 -4.8,-2.6 C-5.1,-2 -5.8,-1.8 -6.5,-2.6 C-7,-3.6 -7.5,-4.5 -8.2,-5.3 C-7.6,-6.2 -6.8,-6 -7.2,-5.5 Z" fill="url(#slot-v12-gem-b)" filter="url(#slot-v12-gem-fn)" opacity=".90" />

      {/* Base ring */}
      <circle cx="0" cy="0" r="6.2" fill="none" stroke="url(#slot-v12-gem-ri)" strokeWidth="1.4" filter="url(#slot-v12-gem-fn)" opacity=".80" />
      <circle cx="0" cy="0" r="6.2" fill="none" stroke="rgba(0,0,0,.65)" strokeWidth="1.6" transform="translate(.2,.3)" />
      <circle cx="0" cy="0" r="5.8" fill="none" stroke="rgba(255,218,110,.18)" strokeWidth=".6" />

      {/* Gem bed */}
      <ellipse cx="0" cy="0" rx="5.2" ry="6.6" fill="#060402" />
      <ellipse cx="0" cy="0" rx="5.2" ry="6.6" fill="url(#slot-v12-gem-ao)" />

      {/* Facets marquise */}
      <polygon points="0,-6.5 -4.2,0 0,6.5" fill="url(#slot-v12-gem-ll)" opacity=".88" />
      <polygon points="0,-6.5  4.2,0 0,6.5" fill="url(#slot-v12-gem-rl)" opacity=".88" />
      <polygon points="-2.2,3.5 2.2,3.5 0,6.5" fill="url(#slot-v12-gem-bot)" opacity=".95" />
      <polygon points="0,-6.5 -2.8,-2.8 0,-1.4 2.8,-2.8" fill="url(#slot-v12-gem-top)" opacity=".95" />
      <polygon points="0,-6.5 -4.2,0 -2.8,-2.8" fill="url(#slot-v12-gem-lu)" opacity=".90" />
      <polygon points="0,-6.5  4.2,0  2.8,-2.8" fill="url(#slot-v12-gem-ru)" opacity=".90" />
      <polygon points="-2.8,-2.8 0,-1.4 2.8,-2.8 4.2,0 0,2.2 -4.2,0" fill="url(#slot-v12-gem-top)" opacity=".85" />

      {/* Facet lines */}
      <line x1="0" y1="-6.5" x2="-4.2" y2="0" stroke="rgba(255,255,255,.28)" strokeWidth=".4" />
      <line x1="0" y1="-6.5" x2="4.2"  y2="0" stroke="rgba(255,255,255,.22)" strokeWidth=".4" />
      <line x1="0" y1="-6.5" x2="0"    y2="-1.4" stroke="rgba(255,255,255,.35)" strokeWidth=".4" />
      <line x1="-2.8" y1="-2.8" x2="2.8" y2="-2.8" stroke="rgba(255,255,255,.18)" strokeWidth=".35" />
      <line x1="-4.2" y1="0"    x2="4.2" y2="0" stroke="rgba(255,255,255,.14)" strokeWidth=".35" />
      <line x1="0"    y1="2.2"  x2="-4.2" y2="0" stroke="rgba(0,0,0,.20)" strokeWidth=".35" />
      <line x1="0"    y1="2.2"  x2="4.2"  y2="0" stroke="rgba(0,0,0,.16)" strokeWidth=".35" />
      <line x1="0"    y1="2.2"  x2="0"    y2="6.5" stroke="rgba(0,0,0,.24)" strokeWidth=".35" />

      <ellipse cx="0" cy="0" rx="5.2" ry="6.6" fill="url(#slot-v12-gem-caus)" />
      <ellipse cx="0" cy="0" rx="5.2" ry="6.6" fill="url(#slot-v12-gem-flash)" />
      <ellipse cx="0" cy="0" rx="5.2" ry="6.6" fill="rgba(50,210,75,.0)">
        <animate attributeName="rx" values="6.5;9;6.5" dur="3.2s" repeatCount="indefinite" />
        <animate attributeName="ry" values="8.5;12;8.5" dur="3.2s" repeatCount="indefinite" />
        <animate attributeName="fill-opacity" values="0.055;0;0.055" dur="3.2s" repeatCount="indefinite" />
        <animate attributeName="fill" values="rgba(50,210,75,1);rgba(50,210,75,1);rgba(50,210,75,1)" dur="3.2s" repeatCount="indefinite" />
      </ellipse>
    </g>
  );
};

export default SlotGemPointer;
