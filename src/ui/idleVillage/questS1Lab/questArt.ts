/**
 * questS1Lab/questArt — scene art per quest node, shared by the S1 lab and the
 * running-quest window on /game (R-106). One painting per phase.
 */

/* Painted Wanderlust assets (art_direction_plan.md — Wilderness pillar). */
export const ART = {
  map: '/Map finale.jpg',
  mountains: '/assets/world/wanderlust/base/layers/Zona montana nord.webp',
  village: '/assets/world/wanderlust/base/layers/Villaggio.webp',
  goblinTotem: '/assets/ui/goblin-invasion/goblin-invasion-hero.png',
  goblinMarch: '/goblin-march-trasparente.png',
} as const;

/** Scene art per quest node — the Passo, the goblin camp, the village. */
export const NODE_ART: Record<string, { src: string; fit: 'contain' | 'cover' }> = {
  /* Transit art (PLAN-053/R-263): `viaggio`/`ritorno` now carry the painted
   * journey legs — threshold gate outbound, valley home inbound. */
  viaggio: { src: '/assets/scene-library/viaggio-andata.jpg', fit: 'cover' },
  incidente: { src: ART.mountains, fit: 'contain' },
  avvistamento: { src: ART.mountains, fit: 'contain' },
  approccio: { src: ART.goblinTotem, fit: 'contain' },
  'check-ingresso-agi': { src: ART.goblinTotem, fit: 'contain' },
  'check-ingresso-cha': { src: ART.goblinTotem, fit: 'contain' },
  'check-ingresso-laterale': { src: ART.goblinTotem, fit: 'contain' },
  'check-ingresso-forza': { src: ART.goblinMarch, fit: 'contain' },
  perquisizione: { src: ART.goblinTotem, fit: 'contain' },
  torre: { src: ART.goblinTotem, fit: 'contain' },
  'check-gabbia': { src: ART.goblinTotem, fit: 'contain' },
  obiettivo: { src: ART.goblinMarch, fit: 'contain' },
  'rientra-o-rischi': { src: ART.goblinTotem, fit: 'contain' },
  'check-forziere': { src: ART.goblinTotem, fit: 'contain' },
  risveglio: { src: ART.goblinMarch, fit: 'contain' },
  ritorno: { src: '/assets/scene-library/viaggio-ritorno.jpg', fit: 'cover' },
  /* ---- Le Rovine sotto il Fiume — downloaded scene art (public domain,
   *  one image per phase, per Director request 2026-10-04) --------------- */
  'rv-mercante': { src: '/assets/quest-robine/mercante.jpg', fit: 'cover' },
  'rv-check-osserva': { src: '/assets/quest-robine/mercante.jpg', fit: 'cover' },
  'rv-check-incalza': { src: '/assets/quest-robine/mercante.jpg', fit: 'cover' },
  'rv-fiume': { src: '/assets/quest-robine/fiume.jpg', fit: 'cover' },
  'rv-guardie': { src: '/assets/quest-robine/guardie.jpg', fit: 'cover' },
  'rv-check-sneak': { src: '/assets/quest-robine/guardie.jpg', fit: 'cover' },
  'rv-check-fight': { src: '/assets/quest-robine/guardie.jpg', fit: 'cover' },
  'rv-sala': { src: '/assets/quest-robine/tesoro.jpg', fit: 'cover' },
  'rv-check-trappola': { src: '/assets/quest-robine/tesoro.jpg', fit: 'cover' },
  'rv-tesoro-scelta': { src: '/assets/quest-robine/tesoro.jpg', fit: 'cover' },
  'rv-check-prendi': { src: '/assets/quest-robine/tesoro.jpg', fit: 'cover' },
  'rv-check-sicuro': { src: '/assets/quest-robine/tesoro.jpg', fit: 'cover' },
  'rv-checkpoint': { src: '/assets/quest-robine/rovine-hero.jpg', fit: 'cover' },
  'rv-attrito': { src: '/assets/quest-robine/crollo.jpg', fit: 'cover' },
  'rv-camera': { src: '/assets/quest-robine/camera.jpg', fit: 'cover' },
  'rv-ritorno-evento': { src: '/assets/quest-robine/strada.jpg', fit: 'cover' },
  'rv-fine': { src: ART.village, fit: 'contain' },
  /* ---- Sterminio dei goblin — AI-painted Wanderlust art (Director
   *  2026-10-13; prompts .mw/specs/quest-goblin-scenes/, catalog + reuse
   *  tags in public/assets/scene-library/CATALOG.md). The scene-library
   *  files are named by subject, not by quest phase, so other quests can
   *  reuse them. The optional merchant event node is not authored yet —
   *  its art is cataloged as mercante-strada.jpg. */
  'gob-esplora': { src: '/assets/scene-library/sentiero-tracce.jpg', fit: 'cover' },
  'gob-tracce-per': { src: '/assets/scene-library/sentiero-tracce.jpg', fit: 'cover' },
  'gob-tracce-perfor': { src: '/assets/scene-library/sentiero-tracce.jpg', fit: 'cover' },
  'gob-bottino': { src: '/assets/scene-library/bottino.jpg', fit: 'cover' },
  'gob-accampamento': { src: '/assets/scene-library/accampamento-raider.jpg', fit: 'cover' },
  'gob-stealth': { src: '/assets/scene-library/accampamento-raider.jpg', fit: 'cover' },
  'gob-assalto': { src: '/assets/scene-library/accampamento-raider.jpg', fit: 'cover' },
  'gob-combattimento': { src: '/assets/scene-library/assalto-goblin.jpg', fit: 'cover' },
  'gob-incalzare': { src: '/assets/scene-library/incalzare.jpg', fit: 'cover' },
  'gob-incalza-check': { src: '/assets/scene-library/incalzare.jpg', fit: 'cover' },
  'gob-esplora-extra': { src: '/assets/scene-library/saccheggio.jpg', fit: 'cover' },
  'gob-cerca': { src: '/assets/scene-library/saccheggio.jpg', fit: 'cover' },
  'gob-ritorno': { src: '/assets/scene-library/viaggio-ritorno.jpg', fit: 'cover' },
  'gob-agguato': { src: '/assets/scene-library/agguato-foresta.jpg', fit: 'cover' },
  'gob-agguato-scelta': { src: '/assets/scene-library/agguato-foresta.jpg', fit: 'cover' },
  'gob-ultimo-scontro': { src: '/assets/scene-library/agguato-foresta.jpg', fit: 'cover' },
  'gob-fine': { src: ART.village, fit: 'contain' },
};

/**
 * Travel-leg paintings (PLAN-053/R-263, .mw/specs/quest-journey-legs):
 * a journey fase owns no scenario node — while the beat queue is drained
 * the theatre shows the leg art instead of the last arrived node's
 * painting. `andata` = the open gate threshold; `ritorno` = the village
 * valley at sunset. Generic by design: every quest reuses them.
 */
export const JOURNEY_LEG_ART: Record<'andata' | 'ritorno', { src: string; fit: 'cover' }> = {
  andata: { src: '/assets/scene-library/viaggio-andata.jpg', fit: 'cover' },
  ritorno: { src: '/assets/scene-library/viaggio-ritorno.jpg', fit: 'cover' },
};

/**
 * Catalogued scene-library assets not yet bound to a quest node
 * (PLAN-052 flagship candidates previewed in /theater-lab). Entries
 * here carry a `key` only for the lab picker — no quest node resolves
 * through them. Promote to NODE_ART when a node adopts the art.
 */
export const LIBRARY_ART: Record<string, { src: string; fit: 'cover' }> = {
  'santuario-valle': { src: '/assets/scene-library/santuario-valle.jpg', fit: 'cover' },
  /* f3-gola-dusk showcase candidate (bake-tested, contract v2 brief). */
  'gola-raider': { src: '/assets/scene-library/gola-raider.jpg', fit: 'cover' },
  /* Lab A/B: same painting as viaggio-ritorno with the pre-boost ambient
   *  set — pick it in /theater-lab to compare "prima e dopo". */
  'viaggio-ritorno-prev': { src: '/assets/scene-library/viaggio-ritorno-prev.jpg', fit: 'cover' },
  /* Showcase "tutto il kit" (2026-10-24): bivacco al crepuscolo — CANOPY
   *  + SHOULDER, il maggior numero di tipi FX su una scena. */
  'bivacco': { src: '/assets/scene-library/bivacco.jpg', fit: 'cover' },
  'intrusi': { src: '/assets/scene-library/intrusi.jpg', fit: 'cover' },
  /* Stock riuso (2026-10-24): fuori nodo — il bottino è ora `bottino`,
   *  l'incalzare è `incalzare`. Restano asset validi per altri beat. */
  'carro-nascosto': { src: '/assets/scene-library/carro-nascosto.jpg', fit: 'cover' },
  'fuga-goblin': { src: '/assets/scene-library/fuga-goblin.jpg', fit: 'cover' },
  /* PLAN-052 wide-plate experiment (2026-10-26): the alpine ridge march —
   *  a 3.6:1 painted plate, lateral focal subject, terrain continuing past
   *  both edges. Picked in /theater-lab with `traverse=<r>` it is the test
   *  bed for true horizontal parallax (A13 protocol rules applied). */
  'marcia-crinale': { src: '/assets/scene-library/marcia-crinale.jpg', fit: 'cover' },
  /* Horizontally TILEABLE variant of the same plate (2026-10-26): the
   *  i3 image rolled 50%, the center seam healed in Gemini, rolled back —
   *  left/right edges now continue into each other (the crag splits
   *  across the border). Test bed for the `train` wrap-scroll mode. */
  'marcia-crinale-loop': { src: '/assets/scene-library/marcia-crinale-loop.jpg', fit: 'cover' },
};
