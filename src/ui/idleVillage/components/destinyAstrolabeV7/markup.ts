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

      <svg class="astro-bezel" viewBox="0 0 1000 1000" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <defs>
          <!-- NMM ladder: raised metal read as one vertical light -->
          <linearGradient id="bezelBand" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stop-color="#fff3c9"/>
            <stop offset="11%"  stop-color="#f0cf6a"/>
            <stop offset="33%"  stop-color="#dfb857"/>
            <stop offset="55%"  stop-color="#b0803a"/>
            <stop offset="80%"  stop-color="#5f3f16"/>
            <stop offset="100%" stop-color="#7a5220"/>
          </linearGradient>
          <!-- contact shadow the raised bezel casts down into the well -->
          <linearGradient id="bezelDrop" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"  stop-color="rgba(0,3,8,0.72)"/>
            <stop offset="42%" stop-color="rgba(0,3,8,0)"/>
            <stop offset="100%" stop-color="rgba(0,3,8,0)"/>
          </linearGradient>
          <!-- load-bearing cue: warm gold lit lip on the bottom inside edge -->
          <linearGradient id="bezelLip" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stop-color="rgba(240,207,106,0)"/>
            <stop offset="62%"  stop-color="rgba(240,207,106,0)"/>
            <stop offset="100%" stop-color="rgba(240,207,106,0.40)"/>
          </linearGradient>
        </defs>

        <!-- dark seat line: separates the molding from the field -->
        <circle cx="500" cy="500" r="497" fill="none" stroke="rgba(0,0,0,0.6)" stroke-width="3"/>
        <!-- THE molding: one thick band, one vertical light -->
        <circle cx="500" cy="500" r="469" fill="none" stroke="url(#bezelBand)" stroke-width="46"/>
        <!-- hard inner step edge -->
        <circle cx="500" cy="500" r="446" fill="none" stroke="rgba(1,3,6,0.85)" stroke-width="2.5"/>
        <!-- shadow cast into the well, and the lit lip at the bottom -->
        <circle cx="500" cy="500" r="438" fill="none" stroke="url(#bezelDrop)" stroke-width="16"/>
        <circle cx="500" cy="500" r="443" fill="none" stroke="url(#bezelLip)" stroke-width="3"/>
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
