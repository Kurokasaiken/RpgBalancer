/* Scene chrome markup for DestinyAstrolabeV6.
 *
 * V6 diff vs V1:
 * - the V1 bronze ring (thin ghiera + studs + degree ticks + sheen) is gone
 * - in its place: ONE thick circular bezel, ported from the Visual Fidelity Lab
 *   "Bezel Molding" NMM ladder (src/ui/visualFidelityLab/plateVariants.tsx):
 *   ivory specular crest -> gold -> body -> bronze turn -> warm-umber core at
 *   ~80% -> reflected-light uptick at the bottom. Raised metal lit from above,
 *   warm throughout, no grey. Static: no fly-in, no spin, no sheen animation.
 * - on-board `state-chip` debug label removed
 * - dead #gooWobble / #fluidWobble filter defs removed (nothing applied them)
 */
export const ASTROLABE_MARKUP = `<div class="suite" data-suite data-state="idle" data-tone="">
<div class="scene-col">
    <div class="stage" id="stage">
      <div class="arena" id="arena">
        <canvas id="cv" width="800" height="800"></canvas>
        <div class="fog"></div>
        <div class="vignette"></div>
        <div class="rays"></div>
        <div class="snap-veil"></div>
        <div class="flare" id="flare"></div>
        <div class="climax" id="climax"></div>
        <div class="card" id="card">
          <div class="seal" id="cardSeal">*</div>
          <div class="title" id="cardTitle">-</div>
          <div class="sub" id="cardSub">-</div>
          <div class="nums" id="cardNums">-</div>
          <div class="chips" id="cardChips"></div>
        </div>
      </div>

      <svg class="astro-bezel" viewBox="-100 -100 1200 1200" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <defs>
          <!-- Bronze - warm oxidized -->
          <linearGradient id="mb-g-b" x1="14%" y1="4%" x2="86%" y2="96%">
            <stop offset="0%" stop-color="#f0cf6a" />
            <stop offset="9%" stop-color="#dfb857" />
            <stop offset="28%" stop-color="#8a5a20" />
            <stop offset="52%" stop-color="#5c3a14" />
            <stop offset="76%" stop-color="#3d2610" />
            <stop offset="100%" stop-color="#24180a" />
          </linearGradient>
          <!-- Bevel diagonal -->
          <linearGradient id="mb-g-bv" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="rgba(255,240,165,.30)" />
            <stop offset="22%" stop-color="rgba(255,225,135,.09)" />
            <stop offset="58%" stop-color="rgba(255,210,100,.02)" />
            <stop offset="100%" stop-color="rgba(90,45,12,.40)" />
          </linearGradient>
          <!-- Inner ring -->
          <linearGradient id="mb-g-ri" x1="12%" y1="8%" x2="88%" y2="92%">
            <stop offset="0%" stop-color="#f0cf6a" />
            <stop offset="16%" stop-color="#dfb857" />
            <stop offset="46%" stop-color="#8a5a20" />
            <stop offset="80%" stop-color="#5c3a14" />
            <stop offset="100%" stop-color="#2e1d0b" />
          </linearGradient>
          <!-- Field stone: in tinta con il deepTeal dell'arena -->
          <radialGradient id="mb-g-f" cx="50%" cy="50%" r="70%">
            <stop offset="0%" stop-color="#001620" />
            <stop offset="50%" stop-color="#010810" />
            <stop offset="100%" stop-color="#02020b" />
          </radialGradient>
          <!-- Specular soft -->
          <radialGradient id="mb-g-sp" cx="26%" cy="20%" r="56%">
            <stop offset="0%" stop-color="rgba(255,245,200,.22)" />
            <stop offset="42%" stop-color="rgba(255,232,168,.05)" />
            <stop offset="100%" stop-color="rgba(255,220,140,0)" />
          </radialGradient>
          <!-- Filters -->
          <filter id="mb-f-nm" x="-30%" y="-30%" width="160%" height="160%">
            <feTurbulence type="fractalNoise" baseFrequency="0.52" numOctaves="4" seed="3" stitchTiles="stitch" result="n" />
            <feColorMatrix in="n" type="matrix" values="0 0 0 0 .020  0 0 0 0 .030  0 0 0 0 .040  0 0 0 .25 0" result="c" />
            <feComposite in="c" in2="SourceGraphic" operator="in" result="clip" />
            <feBlend in="SourceGraphic" in2="clip" mode="overlay" />
          </filter>
          <filter id="mb-f-fs" x="-30%" y="-30%" width="160%" height="160%">
            <feTurbulence type="fractalNoise" baseFrequency="0.90" numOctaves="5" seed="11" stitchTiles="stitch" result="n" />
            <feColorMatrix in="n" type="matrix" values="0 0 0 0 .020  0 0 0 0 .030  0 0 0 0 .040  0 0 0 .18 0" result="c" />
            <feComposite in="c" in2="SourceGraphic" operator="in" result="clip" />
            <feBlend in="SourceGraphic" in2="clip" mode="overlay" />
          </filter>
          <filter id="mb-f-dp" x="-30%" y="-30%" width="160%" height="160%">
            <feTurbulence type="turbulence" baseFrequency="0.030" numOctaves="3" seed="7" result="t" />
            <feDisplacementMap in="SourceGraphic" in2="t" scale="3.5" xChannelSelector="R" yChannelSelector="G" />
          </filter>
          <filter id="mb-f-gl" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="1.5" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
          <filter id="mb-f-patina" x="-20%" y="-20%" width="140%" height="140%">
            <feTurbulence type="fractalNoise" baseFrequency="0.15" numOctaves="3" seed="42" result="noise" />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="2.5" xChannelSelector="R" yChannelSelector="G" />
          </filter>

          <!-- Glass convex main body -->
          <radialGradient id="mb-g-glass" cx="50%" cy="48%" r="52%">
            <stop offset="0%" stop-color="rgba(220,235,255,.0)" />
            <stop offset="60%" stop-color="rgba(200,220,255,.028)" />
            <stop offset="100%" stop-color="rgba(180,210,255,.065)" />
          </radialGradient>
          <!-- Glass top-left reflection -->
          <radialGradient id="mb-g-glass-hl" cx="28%" cy="22%" r="38%">
            <stop offset="0%" stop-color="rgba(255,255,255,.26)" />
            <stop offset="35%" stop-color="rgba(255,255,255,.08)" />
            <stop offset="70%" stop-color="rgba(255,255,255,.02)" />
            <stop offset="100%" stop-color="rgba(255,255,255,0)" />
          </radialGradient>
          <!-- Glass bottom-right secondary bounce -->
          <radialGradient id="mb-g-glass-b" cx="74%" cy="78%" r="32%">
            <stop offset="0%" stop-color="rgba(255,255,255,.05)" />
            <stop offset="100%" stop-color="rgba(255,255,255,0)" />
          </radialGradient>
        </defs>

        <!-- L1: Bronze outer body + texture + bevel -->
        <circle cx="500" cy="500" r="455" fill="none" stroke="#060f16" stroke-width="2" />
        <circle cx="500" cy="500" r="455" fill="none" stroke="url(#mb-g-b)" stroke-width="42.5" filter="url(#mb-f-nm)" opacity=".95" />
        <circle cx="500" cy="500" r="455" fill="none" stroke="url(#mb-g-bv)" stroke-width="42.5" filter="url(#mb-f-dp)" opacity=".65" />

        <!-- L2: Rim top - warm light band -->
        <circle cx="500" cy="500" r="462" fill="none"
          stroke="rgba(240,207,106,.26)" stroke-width="5"
          stroke-linecap="round" filter="url(#mb-f-gl)" />
        <circle cx="500" cy="500" r="465" fill="none"
          stroke="rgba(240,207,106,.68)" stroke-width="1.5"
          stroke-linecap="round" />

        <!-- L3: Inner ring separator -->
        <circle cx="500" cy="500" r="450" fill="none" stroke="#02020b" stroke-width="3" />
        <circle cx="500" cy="500" r="450" fill="none" stroke="url(#mb-g-ri)" stroke-width="8" filter="url(#mb-f-nm)" opacity=".85" />
        <circle cx="500" cy="500" r="449" fill="none"
          stroke="rgba(0,22,32,.75)" stroke-width="8"
          transform="translate(1.2,1.4)" />
        <circle cx="500" cy="500" r="447" fill="none"
          stroke="rgba(240,207,106,.18)" stroke-width="3" />

        <!-- L4: Field stone (fills the well between ring and play area) -->
        <circle cx="500" cy="500" r="438" fill="none" stroke="url(#mb-g-f)" stroke-width="7" />
        <circle cx="500" cy="500" r="438" fill="none" stroke="url(#mb-g-sp)" stroke-width="7" />

        <!-- L7: Patina nicks and spots -->
        <circle cx="136" cy="219" r="15" fill="rgba(34,18,8,.40)" filter="url(#mb-f-patina)" />
        <circle cx="106" cy="263" r="9" fill="rgba(28,14,6,.32)" filter="url(#mb-f-patina)" />
        <circle cx="66" cy="347" r="7" fill="rgba(26,12,5,.28)" filter="url(#mb-f-patina)" />
        <circle cx="869" cy="226" r="14" fill="rgba(32,16,8,.36)" filter="url(#mb-f-patina)" />
        <circle cx="840" cy="190" r="8" fill="rgba(28,14,6,.30)" filter="url(#mb-f-patina)" />
        <circle cx="925" cy="326" r="5" fill="rgba(26,12,5,.24)" filter="url(#mb-f-patina)" />
        <circle cx="188" cy="838" r="11" fill="rgba(32,16,8,.34)" filter="url(#mb-f-patina)" />
        <circle cx="840" cy="811" r="10" fill="rgba(28,14,6,.30)" filter="url(#mb-f-patina)" />
        <circle cx="500" cy="40" r="8" fill="rgba(36,20,8,.22)" filter="url(#mb-f-patina)" />

        <!-- Scratches -->
        <line x1="40" y1="539" x2="48" y2="580" stroke="rgba(0,0,0,.44)" stroke-width="4" stroke-linecap="round" />
        <line x1="947" y1="608" x2="926" y2="675" stroke="rgba(0,0,0,.36)" stroke-width="3" stroke-linecap="round" />
        <line x1="43" y1="902" x2="40" y2="959" stroke="rgba(0,0,0,.32)" stroke-width="3" stroke-linecap="round" />
        <line x1="650" y1="935" x2="706" y2="911" stroke="rgba(0,0,0,.28)" stroke-width="3" stroke-linecap="round" />
        <!-- Edge nicks -->
        <path d="M40,514 C42,551 46,591 48,626" fill="none" stroke="rgba(0,0,0,.50)" stroke-width="4" stroke-linecap="round" />
        <path d="M958,441 C960,483 958,523 956,559" fill="none" stroke="rgba(0,0,0,.40)" stroke-width="4" stroke-linecap="round" />
        <!-- Oxidation streaks -->
        <line x1="44"  y1="426" x2="49" y2="426" stroke="rgba(72,92,52,.20)" stroke-width="4" stroke-linecap="round" />
        <line x1="927" y1="670" x2="908" y2="713" stroke="rgba(72,92,52,.16)" stroke-width="3" stroke-linecap="round" />

        <!-- L8: Bottom AO on field -->
        <circle cx="500" cy="500" r="432" fill="none"
          stroke="rgba(0,0,0,.52)" stroke-width="4"
          stroke-linecap="round" />

        <!-- L9: Glass over the skill-check center -->
        <circle cx="500" cy="500" r="400" fill="url(#mb-g-glass)" />
        <circle cx="500" cy="500" r="400" fill="url(#mb-g-glass-hl)" />
        <circle cx="500" cy="500" r="400" fill="url(#mb-g-glass-b)" />
        <circle cx="500" cy="500" r="398" fill="none"
          stroke="rgba(255,255,255,.22)" stroke-width="7"
          stroke-dasharray="1268 2493" stroke-dashoffset="682"
          stroke-linecap="round" />
        <circle cx="500" cy="500" r="398" fill="none"
          stroke="rgba(0,0,0,.30)" stroke-width="6"
          stroke-dasharray="1203 2561" stroke-dashoffset="2136"
          stroke-linecap="round" />
      </svg>
    </div>
  </div>
</div>
<svg style="position:absolute;width:0;height:0;" aria-hidden="true">
  <defs>
    <!-- organic warp for the solar flare blob (the only filter actually mounted) -->
    <filter id="flareWarp" x="-30%" y="-30%" width="160%" height="160%" color-interpolation-filters="sRGB">
      <feTurbulence type="fractalNoise" baseFrequency="0.011 0.014" numOctaves="2" seed="3" result="wn"/>
      <feDisplacementMap in="SourceGraphic" in2="wn" scale="70" xChannelSelector="R" yChannelSelector="G"/>
    </filter>
  </defs>
</svg>`;
