/**
 * questS1Lab/questArt — scene art per quest node, shared by the S1 lab and the
 * running-quest window on /game (R-106). One painting per phase.
 */

/* Painted Wanderlust assets (art_direction_plan.md — Wilderness pillar). */
export const ART = {
  map: '/Map finale.jpg',
  mountains: '/assets/world/wanderlust/base/layers/Zona montana nord.webp',
  village: '/assets/world/wanderlust/base/layers/Villaggio.webp',
  goblinTotem: '/mockups/goblin-invasion-painted/goblin-invasion-hero.png',
  goblinMarch: '/goblin-march-trasparente.png',
} as const;

/** Scene art per quest node — the Passo, the goblin camp, the village. */
export const NODE_ART: Record<string, { src: string; fit: 'contain' | 'cover' }> = {
  viaggio: { src: ART.mountains, fit: 'contain' },
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
  ritorno: { src: ART.village, fit: 'contain' },
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
   *  reuse them. `gob-inizio`/`gob-ritorno` still use the public-domain
   *  placeholders (transit art viaggio/ritorno not yet generated); the
   *  optional merchant event node is not authored yet — its art is
   *  cataloged as mercante-strada.jpg. */
  'gob-inizio': { src: '/assets/quest-goblin/assegnazione.jpg', fit: 'cover' },
  'gob-esplora': { src: '/assets/scene-library/sentiero-tracce.jpg', fit: 'cover' },
  'gob-tracce-per': { src: '/assets/scene-library/sentiero-tracce.jpg', fit: 'cover' },
  'gob-tracce-perfor': { src: '/assets/scene-library/sentiero-tracce.jpg', fit: 'cover' },
  'gob-bottino-scelta': { src: '/assets/scene-library/carro-nascosto.jpg', fit: 'cover' },
  'gob-bottino': { src: '/assets/scene-library/carro-nascosto.jpg', fit: 'cover' },
  'gob-accampamento': { src: '/assets/scene-library/accampamento-raider.jpg', fit: 'cover' },
  'gob-stealth': { src: '/assets/scene-library/accampamento-raider.jpg', fit: 'cover' },
  'gob-assalto': { src: '/assets/scene-library/accampamento-raider.jpg', fit: 'cover' },
  'gob-combattimento': { src: '/assets/scene-library/assalto-goblin.jpg', fit: 'cover' },
  'gob-incalzare': { src: '/assets/scene-library/fuga-goblin.jpg', fit: 'cover' },
  'gob-incalza-check': { src: '/assets/scene-library/fuga-goblin.jpg', fit: 'cover' },
  'gob-esplora-extra': { src: '/assets/scene-library/saccheggio.jpg', fit: 'cover' },
  'gob-cerca': { src: '/assets/scene-library/saccheggio.jpg', fit: 'cover' },
  'gob-ritorno': { src: '/assets/quest-goblin/ritorno.jpg', fit: 'cover' },
  'gob-agguato': { src: '/assets/scene-library/agguato-foresta.jpg', fit: 'cover' },
  'gob-agguato-scelta': { src: '/assets/scene-library/agguato-foresta.jpg', fit: 'cover' },
  'gob-ultimo-scontro': { src: '/assets/scene-library/agguato-foresta.jpg', fit: 'cover' },
  'gob-fine': { src: ART.village, fit: 'contain' },
};
