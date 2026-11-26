/**
 * Component charters — PLAN-131 (battezzato Director 2026-11-21, r004).
 *
 * Modulo unico = scelta deliberata (r002): precedente `pieces.json`,
 * import unico per il gate `INV:hud-charters`; se il numero di charter
 * cresce oltre la leggibilità si passa a per-file — la shape non cambia.
 *
 * Ogni entry è validata Zod a import time (`componentCharterSchema`):
 * i vincoli semantici live (join catalogo, materiali ⊆ enum, region ⊆
 * anatomia, hash anatomico, stage derivato+pinnato) sono assert del test
 * `tests/unit/idleVillage/componentCharters.test.ts`.
 *
 * Tutti i seed sono `confidence:'reconstructed'` finché il Director non
 * li rivede — la promozione è un diff per componente che setta
 * `director-verified` + `verifiedBy` + `ornamentLevel` (OB-7, T-003).
 */
import { componentCharterSchema, type ComponentCharter } from './charterSchema';

const CHARTER_DATA: ComponentCharter[] = [
  /* -------------------------------------------------------- cassetto ---
   * Pilota T-002. Compilato da HudRealCassettoV2 (montato in
   * ExpeditionDrawer; V1 congelato in hud_real_cassetto_trusted.md),
   * `cassetto.regions.json` (PLAN-130), ruling R-353/PLAN-125 e audit
   * estetico R-374 (.mw/runs/20261121-cassetto-aesthetic-audit/).
   * Promosso a director-verified dopo la review OB-7 su
   * /hud-charter-review (14/14 voci, ruling JSON 2026-11-21T22:20Z):
   * le correzioni Director sono registrate come openIssues dirette.
   */
  {
    componentId: 'cassetto',
    family: 'expedition',
    confidence: 'director-verified',
    verifiedBy: 'OB-7 review /hud-charter-review — ruling Director 2026-11-21T22:20Z (14/14)',
    ornamentLevel: 'II',
    familyOrigin:
      'REQ:v38-drawer-docked (desiderata v38 FROZEN) + R-357 «È la base» 2026-11-17 — golden mockup-r357-cassetto-largo.png',
    materials: [
      { material: 'smalto-smeraldo', region: 'panel-ground', note: 'marmo smeraldo Gemini 2026-11-21 (mediana ≈ pannello mockup)' },
      { material: 'ottone', region: 'section-frames', note: 'box-frame doppio bordo fine + 4 ghirigori; bordi stretch, angoli no' },
      { material: 'oro-filetto', region: 'cta-plaque' },
      { material: 'smalto-smeraldo', region: 'cta-enamel-layer', note: 'i filtri di stato colpiscono la lacca, la cornice resta oro' },
      { material: 'oro-filetto', region: 'niche', note: 'cornice spessa — sorgente SPESSA o la linea sparisce a 85px' },
      { material: 'oro-filetto', region: 'frame-corner-tl' },
      { material: 'oro-filetto', region: 'frame-corner-bl' },
      { material: 'oro-filetto', region: 'frame-rail-mid' },
      { material: 'oro-filetto', region: 'rim-bottom' },
      { material: 'oro-filetto', region: 'cartouche-corners', note: 'non più montato — cartouche inscatolato rimosso R-378 (titolo+briefing free-floating)' },
      { material: 'gemma-smeraldo', region: 'cartouche-gem', note: 'ora divisore titolo/briefing (era ornamento inferiore del cartouche)' },
      { material: 'osso', region: 'risk-emblem', note: 'teschio; la morte % usa il bordeaux del teschio stesso (#c9140b)' },
      { material: 'oro-filetto', region: 'reward-emblem' },
      { material: 'oro-filetto', region: 'success-laurel' },
      { material: 'champagne', region: 'journey-band', note: 'bordo champagne + gemme smeraldo sul segmento' },
      { material: 'gemma-smeraldo', region: 'journey-band' },
      { material: 'oro-filetto', region: 'scroll-band-x', note: 'oro inciso, sorella orizzontale di HudScrollBand' },
      { material: 'oro-filetto', region: 'seat-rack', note: 'ghiera a draghi approvata; seat-ring-v1 resta candidato non montato' },
      { material: 'champagne', region: 'global', note: 'ink labels/valori (goldInk #f3e193 + muted #cfc796)' },
    ],
    anatomy: {
      kind: 'regions',
      ref: 'scripts/hud-real/specs/cassetto.regions.json',
      hash: 'cc97e0cefd3e97a76a43d64986bec504851e50163e987a33a23d02137b95260e',
    },
    states: {
      default: {
        changes:
          'colonna 512px @1440×900 flush-right su marmo smeraldo; pezzi painted su pozzi nero-teal; CONFIRM placca attiva oro+lacca',
        ruling: 'R-357 «È la base» 2026-11-17 + iterazioni PLAN-125',
      },
      hover: {
        changes:
          'CTA: filtro smalto hover + glow testo; nicchie pouch vuote: brighten + drop-shadow oro; loadout item: lift + glow',
      },
      press: {
        changes: 'CTA translateY(1px); loadout item scale(0.95)',
      },
      focus: {
        changes: 'focus-visible outline oro (--skin-cassetto-cta-focus-ring) su CTA',
        legibility: 'anello 2px offset 3px, visibile su placca dipinta',
      },
      disabled: {
        changes:
          'filtro --skin-cassetto-cta-enamel-* SOLO sulla lacca (ottone resta oro) + testo a opacità ridotta; motivo sr-only via aria-describedby, NON dipinto; nessun gioiello acceso (R-378: le gemme della placca pulsano SOLO a canSend)',
        legibility: 'placca desaturata ma non spenta; il perché è accessibile via AT, invisibile a schermo',
        ruling:
          'OB-7 2026-11-21: «troppo vivo» → prova −40% sat lacca; «motivo visibile» → il motivo va dipinto (allinea REQ:v38-states)',
      },
      empty: {
        changes:
          'nicchie bag vuote: glifo ico-pouch inciso (R-374 F7); seat party vuoto: anello ghiera a draghi; % pending: trattino muted stessa altezza',
        ruling: 'R-374 audit F7 + INV:cassetto-risk-pending-muted',
      },
    },
    appreciated: [
      {
        trait: 'placca CONFIRM dipinta con label Cinzel viva — "un lavoro pulito, non slop"',
        ruling: '«Sì, CONFIRM» 2026-11-17 → confermato OB-7 2026-11-21',
      },
      {
        trait: 'cornice esterna da pezzi standalone (angoli + rotaia piegata), mai ritagli dal golden',
        ruling: 'Director 2026-11-21 — cassetto nuovo battezzato (commit afec2a6f9); confermato OB-7',
      },
      {
        trait: 'vignetta quest a filo bordo con arco oro sul tondo, senza cornice',
        ruling: 'Director 2026-11-21 «Remove frame» + «vignetta da quest» 2026-11-20; confermato OB-7',
      },
      {
        trait: 'emblemi lit/dimmed (teschio/alloro) come linguaggio di stato leggibile',
        ruling: 'R-357 golden + confermato OB-7 2026-11-21 («vanno bene»); R-378 2026-11-24 — scala forzieri rimossa, resta il teschio',
      },
      {
        trait: 'banda viaggio a pill unico, segmento Outbound smalto + gemme + totale',
        ruling: 'Director 2026-11-21 «il viaggio è superiore, prendiamo quello» (mockup v3); confermato OB-7; R-378 rev2 «i glifi dei villaggi nn vanno bene, guarda cm era il mockup» — glifi gambe dal mockup v3: ico-compass/ico-swords/ico-cycle (bussola / spade incrociate / frecce circolari)',
      },
      {
        trait: 'profondità dello scroller party: peek del 4° seat + fade-mask come prova del contenuto oltre',
        ruling: 'R-374 audit F6 + confermato OB-7 2026-11-21 («Si», proporzioni da ritoccare → openIssues)',
      },
      {
        trait: 'campo esterno NERO — «cornice oro su velluto nero con cammei verdi»: il marmo verde è velato ~86% nero, i fill dei frame interni restano i loro',
        ruling: 'Director 2026-11-22 «prova a mettere lo sfondo nero … solo dentro quello esterno» → «battezzo»',
      },
    ],
    typeFloor: [
      { role: 'title', ref: 'fzMin(46) — titolo quest (≈23px @1440×900, floor 11px)' },
      { role: 'label', minPx: 12, ref: 'INV:cassetto-captions-min-size — CASSETTO_MIN_LABEL_PX=12 (floor alzato 11→12, R-378 rev5 Director 2026-11-25 «anche + grande»: a 1280×800 metà dei caption stava esattamente al floor)' },
      { role: 'numeric', ref: 'fzMin(66/48) — grandi % rischio/successo (BigPct)' },
    ],
    proportions: {
      basis: 'hybrid',
      unit: 'u(n) = n/1024 della larghezza colonna in cqw; colonna = columnAspect × viewportHeight (512px @1440×900)',
      resize: 'dom-flow',
      note: 'geometria in cqw scala con la colonna; rack party DOM unscaled; floor tipografico 12px (fzMin) — R-378 rev5',
    },
    openIssues: [
      {
        summary:
          'motivo CTA disabilitata: risolto come NON dipinto (sr-only via aria-describedby) — il ruling 2026-11-22 «togli le scritte» supera OB-7 «motivo-visibile» e riallinea il contratto V2 (states.disabled)',
        ref: 'Director 2026-11-22 «togli le scritte party incomplete ecc.» — IMPLEMENTATO 2026-11-22 (sr-only); supera ruling OB-7 iss-a',
      },
      {
        summary:
          'pozzi: «marmo vellutato» C3 — pietra del campo esterno sotto velo minimo 12-22% (venature ben visibili) + glow smeraldo alto + vignettatura profonda + rim light oro sul bordo interno superiore',
        ref: 'R-378 rev7 Director 2026-11-25 — fork3 `.mw/runs/20261125-cassetto-fork3/board3-venature.png`: scelta «C3 velo minimo» dopo «debolucci» sulla ricetta C pura (rev6, superata); marmo round-1 a velo 45-62% rejected «troppo nero», scelto al velo minimo; conferma occhio live pendente',
      },
      {
        summary:
          'spaziatura orizzontale: componenti troppo vicini al frame sinistro + spazio vuoto a destra — ribilanciare',
        ref: 'OB-7 app-2 nota Director — IMPLEMENTATO V3 2026-11-22 (asse condiviso 530→560, padL 148/padR 52); conferma occhio pendente',
      },
      {
        summary:
          'blocco risk/reward: togliere label RISK/REWARD; % sopra (non sotto) e ben allineate; il reward concreto va MOSTRATO sotto la % di vittoria e presentato "bene" — non nascosto dietro click (ruling rivisto 2026-11-21 dopo advisory esterno: il valore che guida la scelta deve essere in vista prima dell\'impegno); tooltip resta per il dettaglio',
        ref: 'OB-7 app-5 nota Director — IMPLEMENTATO V3 2026-11-22 (no label, % sopra, chips sotto la %); R-378 2026-11-24 «elimina i 5 forzieri speculari ai 5 teschi» — scala forzieri RIMOSSA, restano solo i teschi; R-378 rev2 «la percentuale d vittoria falla verde (solo i numeri)» — tone success #5fd98d sul solo readout, alloro invariato',
      },
      {
        summary:
          'proporzioni scroller party da ritoccare — VINCOLO: non toccare il frame né la barra sotto',
        ref: 'OB-7 app-7 nota Director — IMPLEMENTATO V3 2026-11-22 (seat 230→205u, peek 105→80u); R-378 2026-11-24 «slot pg troppo grandi e toccano il frame» + «barra meno spessa» — seat 205→170u, peek 80→62u, slotSize 42→36, banda 14→8px; R-378 rev2 «gli slot si devono comportare diversamente se sono occupati o no, solo se sono vuoti» — tap→roster SOLO su seat vuoto, occupato resta press-hold estrazione/swap',
      },
      {
        summary:
          'disabled: −40% saturazione lacca CONFERMATO a occhio («mi sembra accettabile») + hover `cursor: not-allowed` aggiunto («il divieto d\'accesso grigio»)',
        ref: 'OB-7 iss-c + α — implementato V3 2026-11-22; CONFERMA OCCHIO Director 2026-11-25 (R-378 rev4) + rev4 cursor not-allowed — CHIUSO',
      },
      {
        summary: 'affordance HudScrollBandX: fade-mask + peek bastano? — lasciato aperto dal Director',
        ref: 'OB-7 iss-d «aperto» + R-374 audit F6',
      },
      {
        summary: 'vignetta: arte dedicata per-quest via pipeline gen (l\'attuale vignette.webp è provvisoria)',
        ref: 'OB-7 β «per-quest» + Director «vignetta da quest» 2026-11-20',
      },
    ],
    openExploration: [
      {
        dimension: 'spessore della cornice esterna — valutare una versione meno spessa',
        ref: 'domanda Director OB-7 app-3 «al massimo possiamo farla un po\' meno spessa?»',
      },
    ],
    rejected: [
      {
        item: 'lacca-petrolio come materiale dei pozzetti',
        reason: 'scelto nero-teal — la lacca misurata non convince il Director (D-open-4 chiuso)',
        ruling: 'OB-7 iss-b «nero-teal» 2026-11-21',
      },
      {
        item: 'edge-tab visibile sul cassetto chiuso',
        reason: 'il cassetto resta chiuso senza tab — amend v38 D6b da formalizzare nelle desiderata',
        ruling: 'OB-7 exp-γ «resta-chiuso» 2026-11-21',
      },
      {
        item: 'fold chip «›» sul bordo sinistro della colonna (e chip ripiegato sul bordo destro)',
        reason: 'nessuna forma intermedia: il cassetto è aperto con quest o assente — chiusura solo via onClose',
        ruling: 'Director 2026-11-22 «c\'è una specie di freccia › — eliminala»',
      },
      {
        item: 'motivo CTA disabilitata dipinto in band sopra la placca',
        reason: 'provato e visto sul witness V3 — il Director lo toglie: niente scritte di servizio dipinte; resta sr-only per aria-describedby',
        ruling: 'Director 2026-11-22 «togli le scritte party incomplete ecc.» — supera OB-7 iss-a «motivo-visibile»',
      },
    ],
  },

  /* ------------------------------------------------------------ nav --- */
  {
    componentId: 'nav',
    family: 'chrome',
    confidence: 'reconstructed',
    materials: [
      { material: 'smalto-smeraldo', region: 'nav-bar', note: 'corpo della plancia — riferimento palette [P3]' },
      { material: 'oro-filetto', region: 'nav-bar', note: 'bordi, anelli socket, astrolabio' },
      { material: 'gemma-smeraldo', region: 'nav-bar', note: 'punte/centro' },
      { material: 'champagne', region: 'nav-sockets', note: 'glifi incisi oro (#f1d88a / #fff1bd attivo)' },
      { material: 'champagne', region: 'global', note: 'label incise Cinzel sotto le voci' },
    ],
    anatomy: {
      kind: 'zones',
      zones: [
        { name: 'nav-bar', medium: 'art' },
        { name: 'nav-sockets', medium: 'dom' },
        { name: 'astrolabe-recenter', medium: 'dom' },
        { name: 'nav-labels', medium: 'dom' },
      ],
    },
    states: {
      default: {
        changes: 'glifi incisi oro su smalto; voce attiva: ring oro + glow radiale + label oro; label Cinzel uppercase sotto',
        ruling: 'PLAN-112 pianta B1 + palette-nav misurata',
      },
      hover: {
        changes: 'glifo: brightness(1.25) + drop-shadow glow oro (solo non-disabled)',
      },
      focus: {
        changes: 'focus-visible outline oro 2px offset 2px sul socket',
        legibility: 'anello su socket tondo, non sul rettangolo del bottone',
      },
      disabled: {
        changes: 'voce locked: glifo dim (#8fa89b, op .55) + badge lucchetto oro in angolo; tooltip porta label+motivo',
        legibility: 'mai label nascosta senza hint — il tooltip resta',
      },
    },
    appreciated: [
      {
        trait: 'medaglione astrolabio centrale = recenter reale della mappa, non decorazione',
        ruling: 'PLAN-110 C3 D-4',
      },
      {
        trait: 'socket esterni in vetro vuoto quando le voci sono <6 — la simmetria della plancia regge',
        ruling: 'socketOrder inner-first alternato (HudRealNav) — PLAN-112 pianta B1',
      },
      {
        trait: 'label incise Cinzel uppercase sotto le voci; la voce attiva legge oro, le altre crema',
        ruling: 'PLAN-112 pianta B1 + palette-nav misurata (material-palette-nav)',
      },
      {
        trait: 'stessa lingua dell\'ancora: nero/verde 0.52 vs 0.58 (±5%) — la densità d\'oro maggiore (astrolabio+socket) è ricchezza, non divergenza',
        ruling: 'Director 2026-11-23 dubbio nero/verde chiuso a misura (audit-asset PAL) — DECISION_LOG 2026-11-23',
      },
      {
        trait: 'plancia scalata al 75% della quota blueprint su tutti i placement — altezza in famiglia con le barre top (~98 px vs 75–85), centro e ancora al fondo invariati',
        ruling: 'Director 2026-11-24 critica HUD multi-AI «N proporzionato a quelli sopra» — NAV_ART_PROPORTION in gameHudPlacement; board mockups/.mw/runs/20261124-hud-critique-multi-ai',
      },
    ],
    typeFloor: [
      { role: 'label', ref: 'hudPx(13) — label Cinzel uppercase sotto le voci (HudRealNav)' },
      { role: 'label', ref: 'tooltip label+hint locked (HudTooltip wrap)' },
    ],
    proportions: {
      basis: 'dom',
      unit: 'px design (BAR.slots su navBarGeometry, host 1000×150 nel lab)',
      resize: 'fixed',
      note: 'barra ancorata al fondo; labelSpread compensa schermi stretti (misurato 2026-11-10 su 390px)',
    },
    openIssues: [
      {
        summary: 'nav 452px > 390px a viewport mobile: fuori budget T-24 (componente pre-esistente, non regredito)',
        ref: 'probe 2026-10-23 test-results/mobile-probe-2026-10-23/',
      },
      {
        summary: 'icone interne crema piatte sotto il livello della cornice (home/mappa/people/scroll) — dipinte via programma D-6',
        ref: 'Director 2026-11-23 «le icone interne non mi fanno impazzire» + PLAN-125 D-6 (plan icone da scrivere)',
      },
    ],
  },

  /* ----------------------------------------------------- top-chrome --- */
  {
    componentId: 'top-chrome',
    family: 'chrome',
    confidence: 'reconstructed',
    materials: [
      { material: 'oro-filetto', region: 'day-banner', note: 'cap filigrana speculare a un pezzo (R-352)' },
      { material: 'smalto-smeraldo', region: 'resource-bar' },
      { material: 'champagne', region: 'resource-readouts', note: 'numeri oro/champagne dei readout' },
      { material: 'oro-filetto', region: 'day-dial', note: 'ghiera sole/luna seduta nello smeraldo' },
    ],
    anatomy: {
      kind: 'zones',
      zones: [
        { name: 'day-banner', medium: 'art' },
        { name: 'day-dial', medium: 'art' },
        { name: 'resource-bar', medium: 'art' },
        { name: 'resource-readouts', medium: 'dom' },
        { name: 'top-right-reserve', medium: 'dom' },
      ],
    },
    states: {
      default: {
        changes: 'banner giorno docked a sinistra; barra risorse centrata su frame.W/2; zona top-right vuota riservata; chip compatto slim: socket + valore soli (nome in tooltip/aria-label, la riga label 10px non dipinta)',
        ruling: 'R-350/R-352 2026-11-15/16 + D10 v38; chip slim senza label: critica HUD multi-AI 2026-11-24 → Director «procedi»',
      },
    },
    appreciated: [
      {
        trait: 'barra risorse centrata sull\'asse orizzontale assoluto del frame, disaccoppiata dal banner',
        ruling: 'R-350 Director 2026-11-15',
      },
      {
        trait: 'capi simmetrici a un pezzo nella lingua del terminale Tempo + sedi simmetriche banner/barra',
        ruling: 'R-350/R-352 2026-11-15/16; R-379 2026-11-24 — il terminale Tempo è il keeper, i capi Risorse adottano la sua punta più sobria (resCapMirror ritirato)',
      },
      {
        trait: 'zona top-right riservata alla futura Chronicle docked — niente tab pendente',
        ruling: 'D10 Director 2026-11-15 (REQ:v38-top-chrome)',
      },
      {
        trait: 'cluster top-left = ANCORA estetica HUD insieme a time-sole (banner giorno + sede risorse centrata sull\'asse)',
        ruling: 'Director 2026-11-23 «quello in alto a sinistra va bene al 90%, il resto si allinea a quello» — DECISION_LOG 2026-11-23',
      },
    ],
    typeFloor: [
      { role: 'numeric', ref: 'readout risorse slim (RES_SLIM_ASSET + buildResourceReadoutItems)' },
      { role: 'label', ref: 'banner giorno (day banner seduto nello smeraldo, TIME_SLIM_BAR)' },
    ],
    proportions: {
      basis: 'dom',
      unit: 'px (frameFor 1440×900; fit condiviso mai oltre 1)',
      resize: 'dom-flow',
      note: 'fit unico banner+barra: (frame.W − 2·(bannerDock+gapPx)) / (2·TIME_SLIM_BAR.w + RES_W)',
    },
  },

  /* -------------------------------------------------------- time-sole --- */
  {
    componentId: 'time-sole',
    family: 'chrome',
    confidence: 'reconstructed',
    materials: [
      { material: 'smalto-smeraldo', region: 'global', note: 'corpo barra tempo' },
      { material: 'oro-filetto', region: 'global', note: 'corona di tacche incise attorno al quadrante' },
      { material: 'champagne', region: 'global', note: 'pill velocità + day label' },
    ],
    anatomy: {
      kind: 'zones',
      zones: [
        { name: 'band', medium: 'art' },
        { name: 'dial-frame', medium: 'art' },
        { name: 'phase-dial', medium: 'dom' },
        { name: 'end-finial', medium: 'art' },
        { name: 'speed-sockets', medium: 'dom' },
        { name: 'day-label', medium: 'dom' },
      ],
    },
    states: {
      default: {
        changes: 'medaglione dipinto `dial-frame.webp` (regen battezzata, 8 pinne, no aletta) seduto sul cap di giunzione, sede centrata (29, 26.9 — dock banner 58), Ø85 — dentro la sede il disco sole/luna al 100% e la corona tick di fase sull\'anello oro; pill velocità data-ctl (radiogroup ≤3 socket): velocità ingaggiata = anello ottone pieno 3px + alone caldo + cifra oro brillante (J, niente riempimento), selezionata in pausa = solo anello armato, inattive incise; stessa marcatura J sul pulsante pausa quando il gioco è fermo',
        ruling: 'Director 2026-11-11 (phase dial) + PLAN-112 F4.1 + Director 2026-11-23 (medaglione gen. Director «prova quella» + posizione via dial-positioner)',
      },
      hover: {
        changes: 'bottone: brightness(1.25) (solo non-locked)',
      },
      focus: {
        changes: 'focus-visible outline oro 2px',
        legibility: 'anello sul socket tondo',
      },
      disabled: {
        changes: 'locked (input time congelato): opacity .5, cursor default — le velocità oltre i socket restano da tastiera',
      },
    },
    appreciated: [
      {
        trait: 'quadrante fase seduto piccolo nello smeraldo, incorniciato dalla corona di tacche incise',
        ruling: 'Director 2026-11-11 (phase dial)',
      },
      {
        trait: 'pill velocità come radiogroup data-ctl — stesso pattern delle tab stash (vocabolario unico)',
        ruling: 'R-353 pattern data-ctl condiviso',
      },
      {
        trait: 'ANCORA ESTETICA della HUD — la lingua si misura su questa barra (banda smalto+ottone, medaglione-emblema); ogni altra superficie si allinea a lei',
        ruling: 'Director 2026-11-23 «va bene al 90%, il resto si allinea a quello» — DECISION_LOG 2026-11-23',
      },
      {
        trait: 'medaglione fase a sbalzo: frame dipinto `dial-frame.webp` (pezzo `dial-frame-v1`, gen. Director + cut alpha + sede centrata) — anello oro inciso, 8 pinne complete, smeraldo profondo, niente aletta, niente foglie-cristallo sx (rimosse via green-marker «nn toccare l\'outer ring»), fermaglio che incontra la giunzione; vecchio medaglione cancellato da `bar-slim.webp` (campo scuro fino al cap); niente backplate («lasciamolo norma»); disco sole/luna al 100% della sede («100%» 2026-11-24) con orbe ricentrato a sub-pixel; dischi alpha («preferisco alfa» 2026-11-24) — niente fondo nero, i raggi/lama stanno sulla gemma dipinta; corona tick di fase sull\'anello oro (r 31)',
        ruling: 'Director 2026-11-23 — immagine generata a mano dal Director «prova quella» + posizione scelta via `scripts/hud-real/dial-positioner.html` (seat -3.5,26.9, Ø85, fill .82) + ritocchi raster stesso giorno (foglie, micro-slop, bar) + witness `lab-timesole.png`; posizione finale Director 2026-11-24 via positioner v2 (cx 29 — seduto sul cap di giunzione, dock 58)',
      },
      {
        trait: 'terminale destro time-sole piccolo e smeraldino — è il keeper della lingua top-row, non va importato verso il quadrante o i socket',
        ruling: 'R-379 Director 2026-11-24 — correzione direzione: il componente Tempo resta invariato, la barra Risorse adotta questo capo',
      },
    ],
    typeFloor: [{ role: 'label', ref: 'day label + pill velocità (hudPx) — nessun testo sotto i socket' }],
    proportions: {
      basis: 'dom',
      unit: 'px (BAR.slots della barra tempo)',
      resize: 'fixed',
    },
    openIssues: [],
  },

  /* ----------------------------------------------------------- roster --- */
  {
    componentId: 'roster',
    family: 'triade',
    confidence: 'reconstructed',
    materials: [
      { material: 'osso', region: 'roster-row', note: 'campo parchment della riga' },
      { material: 'oro-filetto', region: 'portrait-medallion', note: 'bordo oro del medaglione firmato C1' },
      { material: 'champagne', region: 'lv-chip', note: 'badge LV in colonna dedicata' },
      { material: 'oro-filetto', region: 'hover-rail', note: 'rail oro laterale in hover' },
    ],
    anatomy: {
      kind: 'zones',
      zones: [
        { name: 'roster-row', medium: 'dom' },
        { name: 'portrait-medallion', medium: 'dom' },
        { name: 'lv-chip', medium: 'dom' },
        { name: 'hover-rail', medium: 'dom' },
      ],
    },
    states: {
      default: {
        changes: 'riga compatta ~30px: medaglione 50 + nome parchment + chip LV in colonna + due barre sottili',
        ruling: 'R-353 restyle 2026-11-16 + riga rifinita',
      },
      hover: {
        changes: 'inset shadow calda + rail oro laterale; portrait spring-back dal centro reale misurato',
      },
      focus: {
        changes: 'focus-visible sul controllo di riga (sort/filtro nel panel header)',
      },
      disabled: {
        changes: 'membro morto: riga greyed, status-only — mai interattiva',
        legibility: 'lo stato si legge dal grigio + tag, non dal cursore',
        ruling: 'INV:R-241-roster-status-only',
      },
      empty: {
        changes: 'nessun residente: placeholder dichiarato (niente righe inventate)',
      },
    },
    appreciated: [
      {
        trait: 'riga mockup: medaglione firmato C1 + colonna LV dedicata + nome parchment',
        ruling: 'R-353 restyle 2026-11-16 (chip LV in colonna, medaglione 50, nome parchment)',
      },
      {
        trait: 'righe ~30px compact draggable con spring-back calcolato dal centro ritratto reale',
        ruling: 'E-13 production parity — MatericRosterComponentV2',
      },
    ],
    typeFloor: [
      { role: 'label', ref: 'chip LV in colonna dedicata (R-353 riga rifinita)' },
      {
        role: 'body',
        minPx: 11,
        ref: 'floor captions — report slicekit registra 120 testi a 10px, re-run prima del pilota (profilo [P11])',
      },
    ],
    proportions: {
      basis: 'dom',
      unit: 'px (riga ~30px compact, medaglione 50px)',
      resize: 'dom-flow',
    },
    openIssues: [
      {
        summary: 'floor testo: 120 testi a 10px sotto minimo nel report slicekit — re-run obbligatorio prima del pilota',
        ref: 'test-results/slicekit/roster-stash-findings.md (profilo [P11])',
      },
    ],
  },

  /* ------------------------------------------------------------ stash --- */
  {
    componentId: 'stash',
    family: 'triade',
    confidence: 'reconstructed',
    materials: [
      { material: 'smalto-smeraldo', region: 'panel-frame', note: 'corniciStash panel-frame7 thin ×0.5' },
      { material: 'smalto-smeraldo', region: 'detail-card', note: 'medaglione smeraldo+ottone della detail card (R-363)' },
      { material: 'ottone', region: 'stash-grid', note: 'piastrina: cornice hover/selected sulle celle' },
      { material: 'oro-filetto', region: 'scroll-band', note: 'banda oro inciso condivisa' },
      { material: 'champagne', region: 'kind-tabs', note: 'glifi incisi sui tab data-ctl=round' },
    ],
    anatomy: {
      kind: 'zones',
      zones: [
        { name: 'panel-frame', medium: 'art' },
        { name: 'kind-tabs', medium: 'dom' },
        { name: 'stash-grid', medium: 'dom' },
        { name: 'detail-card', medium: 'dom' },
        { name: 'scroll-band', medium: 'dom' },
      ],
    },
    states: {
      default: {
        changes: 'griglia well-cells (il pozzo È la cornice della cella) + kind tabs + detail card a riposo',
        ruling: 'R-353 stash griglia+tab+detail 2026-11-16',
      },
      hover: {
        changes: 'piastrina ottone sulla cella + anteprima nella detail card (hover/focus condivisi)',
        ruling: 'D-20261120-piastrina + ri-significato 2026-11-21; R-353 preview',
      },
      focus: {
        changes: 'stessa anteprima della hover + focus-visible sul controllo',
        legibility: 'tastiera e mouse leggono lo stesso dettaglio',
      },
      disabled: {
        changes: 'item non assegnabile: data-assign-state riflette l\'elegibilità PRIMA del click',
        legibility: 'il divieto si legge sulla cella, non dal fallimento del click',
      },
      empty: {
        changes: 'cella shelf vuota: testo sr-only dentro la cella (la griglia porta il vuoto, non lo nasconde)',
      },
      full: {
        changes: 'shelf oltre capienza: banda oro inciso pilota lo scroll (HudScrollBand)',
      },
    },
    appreciated: [
      {
        trait: 'il pozzo È la cornice della cella — niente secondo box dentro il well',
        ruling: 'Director — R-270/R-353 grid restyle (commento VillageStashPanel)',
      },
      {
        trait: 'piastrina ottone ri-significata: cornice hover/selected, non chrome a riposo',
        ruling: 'D-20261120-piastrina + ri-significato mockup stash 2026-11-21',
      },
      {
        trait: 'kind tabs come radiogroup data-ctl=round con glifi incisi derivati da config',
        ruling: 'R-353 stash griglia+tab 2026-11-16',
      },
      {
        trait: 'medaglione smeraldo+ottone battezzato della detail card',
        ruling: 'R-363 detail card',
      },
    ],
    typeFloor: [
      { role: 'label', ref: 'kind tabs + label celle (data-ctl round)' },
      { role: 'body', minPx: 11, ref: 'floor condiviso col roster — findings [P11] da rieseguire' },
    ],
    proportions: {
      basis: 'dom',
      unit: 'px (VILLAGE_STASH_CONFIG.panel.widthPx; shelf 3×2)',
      resize: 'dom-flow',
      note: 'shelf 3×2 = PLAN-125 Fase 9 + piastrina hover 2026-11-20/21',
    },
    openIssues: [
      {
        summary: 'floor testo condiviso col roster: 120 testi a 10px — re-run findings obbligatorio prima del pilota PLAN-127',
        ref: 'test-results/slicekit/roster-stash-findings.md',
      },
    ],
  },

  /* --------------------------------------------------- victory-reward --- */
  {
    componentId: 'victory-reward',
    family: 'cerimonie',
    confidence: 'reconstructed',
    familyOrigin: 'R-348 — fork card .mw/runs/20261116-r348-victory-ruling/ (pergamena battezzata)',
    materials: [
      { material: 'osso', region: 'parchment-field', note: 'pergamena battezzata rigenerata Gemini' },
      { material: 'champagne', region: 'reward-content', note: 'testo/valori del report sulla pergamena' },
      { material: 'oro-filetto', region: 'seal-affordance', note: 'sigillo/affordance di chiusura (INV-1)' },
    ],
    anatomy: {
      kind: 'zones',
      zones: [
        { name: 'parchment-field', medium: 'art' },
        { name: 'reward-content', medium: 'dom' },
        { name: 'seal-affordance', medium: 'dom' },
      ],
    },
    states: {
      default: {
        changes: 'pergamena ship: campo arte + contenuto report vivo; sigillo preservato',
        ruling: 'PLAN-125 Fase 7d shipping=A pergamena (INV-1 invariato), ruling 2026-11-20',
      },
    },
    appreciated: [
      {
        trait: 'pergamena battezzata rigenerata da Gemini — l\'arte porta il peso emotivo del report di fine run',
        ruling: 'R-348 ruling + rigenerazione Gemini (fork card 20261116-r348-victory-ruling)',
      },
      {
        trait: 'INV-1 invariato: il sigillo/affordance resta dentro la pergamena ship',
        ruling: 'PLAN-125 Fase 7d, ruling 2026-11-20',
      },
    ],
    typeFloor: [{ role: 'title', ref: 'titolo report sulla pergamena (Cinzel)' }],
    proportions: {
      basis: 'dom',
      unit: 'px',
      resize: 'dom-flow',
      note: 'superficie a fine run — montata solo con QuestRunState reale',
    },
    openIssues: [
      {
        summary: 'varianti framed/panel restano in codice dietro ?victory= dev override — non ship né ritirate',
        ref: 'HudRealVictoryReward resolveVictoryVariant',
      },
    ],
  },

  /* ------------------------------------------------------------ triad --- */
  {
    componentId: 'triad',
    family: 'triade',
    confidence: 'reconstructed',
    materials: [
      { material: 'osso', region: 'global', note: 'campo parchment condiviso (gradiente field→#ddd0b4)' },
      { material: 'oro-filetto', region: 'kit-divider' },
      { material: 'champagne', region: 'global', note: 'rail/ink del kit provvisorio' },
    ],
    anatomy: {
      kind: 'zones',
      zones: [
        { name: 'roster-module', medium: 'dom' },
        { name: 'kit-divider', medium: 'art' },
        { name: 'stash-module', medium: 'dom' },
      ],
    },
    states: {
      default: {
        changes: 'fascia unificata: roster reale (46% altezza) + divider kit + stash reale, un solo arredo',
        ruling: 'GC-1 ruling (PLAN-113 family A, composition V2)',
      },
    },
    appreciated: [
      {
        trait: 'roster e stash come moduli di un solo arredo — mai due placche co-espanse',
        ruling: 'GC-1 ruling (PLAN-113 family A) + E-13 production parity',
      },
    ],
    typeFloor: [{ role: 'label', ref: 'righe stash EB Garamond 13px + titolo modulo' }],
    proportions: {
      basis: 'dom',
      unit: 'px + quote (roster 46% altezza, stash flex)',
      resize: 'dom-flow',
    },
    openExploration: [
      {
        dimension: 'cornice esterna provvisoria kit-styled → nine-slice furniture frame dedicato',
        ref: 'commento HudRealTriad «a proper nine-slice tall furniture frame is F3 build work»',
      },
    ],
  },
];

/** Charters validati a import time — una violazione schema esplode subito. */
export const CHARTERS: readonly ComponentCharter[] = Object.freeze(
  CHARTER_DATA.map((c) => componentCharterSchema.parse(c)),
);

/** Lookup per `componentId` (= `LabEntry.id`). */
export const charterFor = (componentId: string): ComponentCharter | undefined =>
  CHARTERS.find((c) => c.componentId === componentId);
