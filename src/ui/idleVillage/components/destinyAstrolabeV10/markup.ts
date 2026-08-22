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
          <!-- BRONZO OSSIDATO, iniettato da PoiMatericV3 (g-b).
               Prima era una scala NMM VERTICALE che passava dal crema al bronzo
               scuro restando bronzo per tutta l'altezza: leggeva come un cerchio
               d'oro uniforme, cioe' un hoop, non come metallo. Il bronzo di
               MatericV3 e' DIAGONALE e collassa nel quasi-nero (#060f16) dopo il
               52%: meta' della ghiera sta in ombra, ed e' quella meta' a dire
               "questo e' un oggetto illuminato da una parte" invece di "questo e'
               un anello colorato d'oro". Direzione della luce: alto-sinistra,
               come prescrive la bibbia (Solar Triumph). -->
          <linearGradient id="bezelBand" x1="14%" y1="4%" x2="86%" y2="96%">
            <stop offset="0%"   stop-color="#f0cf6a"/>
            <stop offset="9%"   stop-color="#dfb857"/>
            <stop offset="28%"  stop-color="#8a5a20"/>
            <stop offset="46%"  stop-color="#3d2a12"/>
            <!-- ADATTAMENTO, non porto letterale: su MatericV3 la meta' in ombra
                 e' #060f16 piatto, e su un medaglione da 86px funziona. Su una
                 ghiera da 700px meta' anello in nero piatto diventa un buco —
                 un flat digital plane, che sta nella kill list. Qui l'ombra e'
                 BRONZO IN OMBRA con la componente teal che prescrive la bibbia:
                 resta metallo, e resta scura. -->
            <stop offset="62%"  stop-color="#1a2a2e"/>
            <stop offset="84%"  stop-color="#0e1a20"/>
            <stop offset="100%" stop-color="#152329"/>
          </linearGradient>
          <!-- bevel diagonale di MatericV3 (g-bv): il rilievo sopra il bronzo -->
          <linearGradient id="bezelBevel" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%"   stop-color="rgba(255,240,165,.30)"/>
            <stop offset="22%"  stop-color="rgba(255,225,135,.09)"/>
            <stop offset="58%"  stop-color="rgba(255,210,100,.02)"/>
            <stop offset="100%" stop-color="rgba(0,0,0,.62)"/>
          </linearGradient>
          <!-- anello interno di MatericV3 (g-ri): il gradino ha una sua luce -->
          <linearGradient id="bezelInner" x1="12%" y1="8%" x2="88%" y2="92%">
            <stop offset="0%"   stop-color="#f0cf6a"/>
            <stop offset="16%"  stop-color="#dfb857"/>
            <stop offset="46%"  stop-color="#8a5a20"/>
            <stop offset="80%"  stop-color="#060f16"/>
            <stop offset="100%" stop-color="#060f16"/>
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
        <!-- LA GHIERA: bronzo ossidato + bevel sopra, due passate sulla stessa
             banda. Il bevel e' cio' che la fa leggere sollevata invece che
             dipinta. -->
        <circle cx="500" cy="500" r="469" fill="none" stroke="url(#bezelBand)" stroke-width="46"/>
        <circle cx="500" cy="500" r="469" fill="none" stroke="url(#bezelBevel)" stroke-width="46"/>
        <!-- gradino interno: sottile, con la sua luce diagonale -->
        <circle cx="500" cy="500" r="451" fill="none" stroke="url(#bezelInner)" stroke-width="5"/>
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
