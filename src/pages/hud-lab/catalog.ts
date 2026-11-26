/**
 * PLAN-129 — `/hud-lab` catalog: the living list of what is baptized on `/game`
 * (Director 2026-11-20: «solo quello che c'è di battezzato su game»).
 * Components first, reusable pieces second. `da-riallineare` is the backport
 * queue — surfaces still on the pre-restyle look.
 *
 * Config-first: cards are data, not JSX. HOSTS maps `host` → React mount
 * (see `hosts.tsx`).
 */

export type LabEntryStatus = 'battezzato' | 'candidato' | 'da-riallineare' | 'deprecato';
export type LabEntryKind = 'component' | 'piece';

export interface LabProvenance {
  /** Director ruling that baptized the entry (verbatim tag / R-NNN / date). */
  ruling: string;
  /** Golden reference or asset the ruling approved, when one exists. */
  ref?: string;
  /** sha256 of the registered reference/asset (as in REGISTERED.md / fork cards). */
  sha256?: string;
}

export interface LabEntry {
  id: string;
  kind: LabEntryKind;
  title: string;
  status: LabEntryStatus;
  /** Family on the PLAN-113 surface taxonomy (chrome, triade, cerimonie, …). */
  family: string;
  /** Key into the HOSTS registry in `hosts.tsx`. */
  host: string;
  provenance: LabProvenance;
  notes?: string;
}

export const LAB_CATALOG: readonly LabEntry[] = [
  /* ------------------------------------------------------- components --- */
  {
    id: 'cassetto',
    kind: 'component',
    title: 'Cassetto expedition (drawer destro)',
    status: 'battezzato',
    family: 'expedition',
    host: 'cassetto',
    provenance: {
      ruling: 'R-353 «vabene la v2» 2026-11-16 + PLAN-125/OB-7 (2026-11-21) + battesimo campo nero 2026-11-22 + R-378 (2026-11-24/25: seats autofit, pozzi velluto+vignettatura rev6, floor caption 12px rev5, cursor not-allowed rev4)',
      ref: '.mw/specs/expedition-ui/refs/mockup-cassetto-v2.png',
      sha256: 'd2f743ab1f7c6108',
    },
  },
  {
    id: 'roster',
    kind: 'component',
    title: 'Roster (righe Wanderlust V2)',
    status: 'battezzato',
    family: 'triade',
    host: 'roster',
    provenance: {
      ruling: 'R-353 restyle 2026-11-16 + riga rifinita (chip LV in colonna, medaglione 50, nome parchment)',
      ref: '.mw/specs/expedition-ui/refs/mockup-stash-grid.jpg',
    },
  },
  {
    id: 'stash',
    kind: 'component',
    title: 'Stash villaggio (griglia + tab + detail)',
    status: 'battezzato',
    family: 'triade',
    host: 'stash',
    provenance: {
      ruling: 'R-353 griglia+tab+detail 2026-11-16 + PLAN-125 Fase 9 shelf 3×2 / piastrina hover 2026-11-20/21',
      ref: '.mw/specs/expedition-ui/refs/mockup-stash-grid.jpg',
    },
  },
  {
    id: 'stash-overflow-fixture',
    kind: 'component',
    title: 'Stash — fixture overflow (scroll condizionale)',
    status: 'candidato',
    family: 'triade',
    host: 'stash-overflow',
    provenance: {
      ruling: 'PLAN-136 / R-391 (2026-11-26): la scrollbar laterale appare solo se le righe filtrate superano la capacità visibile (15 alcove)',
    },
    notes: 'Fixture sintetica dichiarata: 18 righe duplicate dai consumabili reali — la config produzione capa a 12 item unici, sotto la capacità visibile, quindi l\'overflow non è altrimenti osservabile. Serve da witness permanente per il scroll condizionale.',
  },
  {
    id: 'victory-reward',
    kind: 'component',
    title: 'Victory / Reward (pergamena)',
    status: 'battezzato',
    family: 'cerimonie',
    host: 'victory',
    provenance: {
      ruling: 'PLAN-125 Fase 7d: shipping = A pergamena (INV-1 invariato), ruling 2026-11-20',
    },
    notes: 'Richiede QuestRunState reale — non montato in card: vedi /game a fine spedizione o il gate dev `?victory=` dentro HudRealVictoryReward.',
  },
  {
    id: 'top-chrome',
    kind: 'component',
    title: 'Top chrome (banner giorno + risorse)',
    status: 'battezzato',
    family: 'chrome',
    host: 'topChrome',
    provenance: {
      ruling: 'R-350/R-352: cap speculare a un pezzo, banner disaccoppiato, sedi simmetriche — 2026-11-16',
    },
  },
  {
    id: 'nav',
    kind: 'component',
    title: 'Nav barra inferiore',
    status: 'battezzato',
    family: 'chrome',
    host: 'nav',
    provenance: {
      ruling: 'PLAN-112 pianta B1 + palette-nav misurata (material-palette-nav)',
      ref: 'test-results/slicekit/material-palette-nav.json',
    },
  },
  {
    id: 'time-sole',
    kind: 'component',
    title: 'Barra giorno (sole + velocità)',
    status: 'battezzato',
    family: 'chrome',
    host: 'time',
    provenance: {
      ruling: 'ANCORA estetica HUD — Director 2026-11-23 «va bene al 90%, il resto si allinea a quello»; residui 10%: sole ~1.6×, aletta, cucitura cap (audit)',
      ref: '.mw/runs/20261123-lingua-audit/AUDIT.md',
    },
  },
  {
    id: 'triad',
    kind: 'component',
    title: 'Triade roster (aperto)',
    status: 'candidato',
    family: 'triade',
    host: 'triad',
    provenance: { ruling: 'montato su /game; ruling estetico non ancora registrato' },
  },
  {
    id: 'villaggio',
    kind: 'component',
    title: 'Vista villaggio (dipinto + pin + registry)',
    status: 'da-riallineare',
    family: 'villaggio',
    host: 'note',
    provenance: { ruling: 'PLAN-035/038/042 — look pre-battesimo' },
    notes: 'Difetto Director 2026-11-20: le immagini ritagliate degli edifici non vanno. Direzione annotata: edifici dipinti dentro l\'opera, non incollati (learn `harmonize-object-in-scene` 2026-11-10 + «frame vuoto rigenerato > patching raster» 2026-11-16).',
  },
  {
    id: 'poi-marker',
    kind: 'component',
    title: 'POI / marker mappa (Sigillo)',
    status: 'da-riallineare',
    family: 'mappa',
    host: 'note',
    provenance: { ruling: 'look pre-battesimo; redesign solo mockup in PLAN-125' },
    notes: 'PLAN-117 baptized (POI Zanara cartografia incisa + luoghi fissi) non ancora atterrato su /game.',
  },
  {
    id: 'quest-teatro',
    kind: 'component',
    title: 'Quest teatro (QuestRunWindow)',
    status: 'da-riallineare',
    family: 'quest',
    host: 'note',
    provenance: { ruling: 'componente battezzato 2026-10-09 (PLAN-019-S2 D-F) — look pre-restyling' },
    notes: 'Contratto runtime battezzato; la pelle non è ancora nel vocabolario nuovo.',
  },

  /* ----------------------------------------------------------- pieces --- */
  {
    id: 'frame-smeraldo',
    kind: 'piece',
    title: 'Cornice smeraldo (slice-kit panel-frame7)',
    status: 'battezzato',
    family: 'cornici',
    host: 'piece-smeraldo',
    provenance: {
      ruling: '«Battezza golden» 2026-11-20 — record test-results/slicekit/panel-frame7.json',
      ref: '.mw/specs/expedition-ui/refs/frame-smeraldo-gemini.png',
      sha256: 'f96e7b32839f',
    },
    notes: '`PanelFrameOrnaments` variant `corniciStash`, manifest `panelFrame7Frame` (thin ×0.5 default su stash).',
  },
  {
    id: 'cornici-mockup',
    kind: 'piece',
    title: 'Angoli cornice estratti dal mockup',
    status: 'battezzato',
    family: 'cornici',
    host: 'piece-corners',
    provenance: {
      ruling: '«ovviamente anche la cornice del mockup x entrambi» 2026-11-16',
      ref: 'public/assets/ui/hud-real/panel-frame/corner-mockup-*.webp',
    },
    notes: 'variant stash = chest-emblem TL; variant roster = acanto. Overlay aria-hidden via `PanelFrameOrnaments`.',
  },
  {
    id: 'scroll-band',
    kind: 'piece',
    title: 'Banda di scorrimento (oro inciso)',
    status: 'battezzato',
    family: 'controlli',
    host: 'piece-band',
    provenance: {
      ruling: '«Oro inciso» 2026-11-20 — fork card .mw/runs/20261120-scroll-band/',
      ref: '.mw/specs/expedition-ui/refs/scroll-band-oro-inciso.png',
      sha256: '99098b02f6e6',
    },
    notes: '`HudScrollBand`, condivisa Roster/Stash/Ledger.',
  },
  {
    id: 'scroll-band-x',
    kind: 'piece',
    title: 'Banda di scorrimento orizzontale (oro inciso, smalto)',
    status: 'battezzato',
    family: 'controlli',
    host: 'piece-bandx',
    provenance: {
      ruling: 'Director 2026-11-21 «non voglio pulsanti per andare a destra o sinistra, ma la barra come hanno già roster e stash»',
      ref: 'src/ui/idleVillage/skins/primitives/HudScrollBandX.tsx',
    },
    notes: 'Sorella orizzontale di `HudScrollBand` (variante A smalto, stesso well + gemma ruotati); file a parte, la banda verticale contrattata non è toccata. Usata dal cassetto su posti e provviste. Nascosta finché la riga entra.',
  },
  {
    id: 'piastrina',
    kind: 'piece',
    title: 'Piastrina ottone (cornice hover/selected)',
    status: 'battezzato',
    family: 'controlli',
    host: 'piece-piastrina',
    provenance: {
      ruling: 'D-20261120-piastrina + ri-significato mockup stash (hover/selected, non chrome a riposo) 2026-11-21',
      ref: 'public/assets/ui/hud-real/piastrina/cornice-hover-a.webp',
    },
  },
  {
    id: 'cta-confirm',
    kind: 'piece',
    title: 'CTA CONFIRM (placca dipinta, rigenerata)',
    status: 'battezzato',
    family: 'controlli',
    host: 'piece-cta',
    provenance: {
      ruling: '«Sì, CONFIRM» 2026-11-17 (placca precedente) → rigenerata da Gemini 2026-11-21 (Director: «un lavoro pulito, non slop») — ruling estetico sulla nuova pendente',
      ref: 'public/assets/ui/hud-real/slicekit/cassetto/cta-plaque.webp',
    },
    notes: 'Solo placca + due diamanti + corona, senza scritta (label Cinzel dal vivo), 1500×381, oro ri-graduato sul valore misurato della nav. Livello `cta-plaque-enamel.webp` separato: i filtri di stato colpiscono la lacca, la cornice resta oro (stati via `--skin-cassetto-cta-enamel-*`). L\'asset in `hud-real/cassetto3/` è la versione vecchia (superata).',
  },
  {
    id: 'stash-tabs',
    kind: 'piece',
    title: 'Tab / filtri (radiogroup, data-ctl="round")',
    status: 'battezzato',
    family: 'controlli',
    host: 'piece-tabs',
    provenance: {
      ruling: 'R-353 stash griglia+tab 2026-11-16 — kind derivati da config, role=radio',
    },
    notes: 'Stesso pattern delle pill velocità (`data-ctl` + skin scope).',
  },
  {
    id: 'palette-nav',
    kind: 'piece',
    title: 'Palette nav misurata (oro / smalto / lacca)',
    status: 'battezzato',
    family: 'materiali',
    host: 'piece-palette',
    provenance: {
      ruling: 'PLAN-112/PLAN-128 canon colore — CIEDE2000 mediana per materiale su `nav/bar.webp`',
      ref: 'test-results/slicekit/material-palette-nav.json',
    },
  },
  {
    id: 'tokens-hud',
    kind: 'piece',
    title: 'Token `--skin-hud-*` (campione)',
    status: 'battezzato',
    family: 'materiali',
    host: 'piece-tokens',
    provenance: { ruling: 'skin system — token vivi letti da getComputedStyle' },
  },
  {
    id: 'ground-marmo',
    kind: 'piece',
    title: 'Sfondo marmo smeraldo (ground)',
    status: 'battezzato',
    family: 'materiali',
    host: 'piece-ground',
    provenance: {
      ruling: 'Director 2026-11-21 «il mockup è molto più bello, ha uno sfondo verde elaborato… fatti creare anche quei componenti separatamente»',
      ref: 'public/assets/ui/hud-real/slicekit/cassetto/ground.webp — .mw/runs/20261121-cassetto-components/',
    },
    notes: 'Generato da Gemini solo come materiale (niente cornici/testo), 687×1024 ingrandito 2×. Mediana (3,40,24) ≈ pannello del mockup (1,32–58,24–31): il gradiente CSS precedente era molto più chiaro. Ricetta: `paintedGround()` in `skins/primitives/paintedPieces.ts`.',
  },
  {
    id: 'box-frame-oro',
    kind: 'piece',
    title: 'Cornice riquadro (doppio bordo oro + angoli)',
    status: 'battezzato',
    family: 'cornici',
    host: 'piece-boxframe',
    provenance: {
      ruling: 'Director 2026-11-21 «i componenti interni più curati» — riquadri PARTY/SUPPLIES/JOURNEY/RISK del mockup',
      ref: 'public/assets/ui/hud-real/slicekit/cassetto/box-frame.webp',
    },
    notes: '`border-image` a 9 fette (angoli 130×105 della sorgente 1024×254), bordi che si allungano. Ricetta: `paintedBoxFrame({y,x})`; tenere x/y ≈ 1,24 per non schiacciare i ghirigori. Header e freccia tolti: sono del contenuto, non della cornice.',
  },
  {
    id: 'niche-oro',
    kind: 'piece',
    title: 'Nicchia inventario (cornice oro spessa)',
    status: 'battezzato',
    family: 'cornici',
    host: 'piece-niche',
    provenance: {
      ruling: 'Director 2026-11-21 (SUPPLIES del mockup) — seconda generazione dopo che la linea sottile spariva a 85 px',
      ref: 'public/assets/ui/hud-real/slicekit/cassetto/niche.webp',
    },
    notes: 'Regola: un pezzo mostrato piccolo vuole una sorgente SPESSA (una linea da 4 px su 1012 diventa 0,3 px). Ricetta: `paintedNiche(edge)` con `border-image … fill`.',
  },
  {
    id: 'rim-oro',
    kind: 'piece',
    title: 'Bordo basso oro (fascia vera del mockup)',
    status: 'battezzato',
    family: 'cornici',
    host: 'piece-rim',
    provenance: {
      ruling: 'Director 2026-11-21 «devi usare la parte sotto dell\'originale»',
      ref: 'public/assets/ui/hud-real/slicekit/cassetto/frame-bottom.webp',
    },
    notes: '932×12, ritagliata dalle righe 1506–1536 del mockup (tratto pulito a destra del riflesso centrale), graduata. Si posa sopra una striscia scura 12 px; non è la barra alta capovolta.',
  },
  {
    id: 'seat-ring',
    kind: 'piece',
    title: 'Anello posto (vuoto, generato)',
    status: 'candidato',
    family: 'controlli',
    host: 'piece-seat',
    provenance: {
      ruling: 'Director 2026-11-21 «non sostituire l\'anello dei posti» — generato e tenuto a disposizione',
      ref: 'public/assets/ui/hud-real/slicekit/cassetto/seat-ring.webp',
    },
    notes: 'NON montato su /game: lì resta la ghiera a draghi approvata. Oro con quattro smeraldi e centro vuoto, utilizzabile da componenti futuri che vogliano l\'anello del mockup.',
  },

  {
    id: 'cornice-cassetto',
    kind: 'piece',
    title: 'Cornice esterna cassetto (angoli + rotaia)',
    status: 'battezzato',
    family: 'cornici',
    host: 'piece-cassettoframe',
    provenance: {
      ruling: 'Director 2026-11-21 — cassetto nuovo battezzato (commit afec2a6f9)',
      ref: 'public/assets/ui/hud-real/slicekit/cassetto/frame-corner-{tl,bl}.webp + rail-mid-fold.webp',
    },
    notes: 'Angoli oro generati standalone (non ritagli dal golden): tl e bl, specchiati per i lati dx; rotaia mediana piegata fra i due angoli. Registry: frame-corner-tl-v1 / frame-corner-bl-v1 / rail-mid-fold-v1.',
  },
  {
    id: 'cartiglio-vignetta',
    kind: 'piece',
    title: 'Cartiglio vignetta (angoli + gemma)',
    status: 'battezzato',
    family: 'cornici',
    host: 'piece-cartouche',
    provenance: {
      ruling: 'Director 2026-11-21 — cassetto nuovo battezzato (commit afec2a6f9)',
      ref: 'public/assets/ui/hud-real/slicekit/cassetto/cart-corner.webp + cart-gem.webp',
    },
    notes: 'Affettati dal golden mockup-r357-cassetto-largo: 4 angoli specchiati + gemma smeraldo sotto il riquadro vignetta. Registry: cart-corner-v1 / cart-gem-v1.',
  },
  {
    id: 'emblemi-cassetto',
    kind: 'piece',
    title: 'Emblemi (teschio / forziere / alloro)',
    status: 'battezzato',
    family: 'emblemi',
    host: 'piece-emblems',
    provenance: {
      ruling: 'Director 2026-11-21 — cassetto nuovo battezzato (commit afec2a6f9)',
      ref: 'public/assets/ui/hud-real/slicekit/cassetto/{skull,chest,laurel}.webp',
    },
    notes: 'Affettati dal golden: teschio (death%/rischio, scala di livelli lit/dimmed), forziere (reward), alloro (success%). Registry: skull-v1 / chest-v1 / laurel-v1.',
  },
];
