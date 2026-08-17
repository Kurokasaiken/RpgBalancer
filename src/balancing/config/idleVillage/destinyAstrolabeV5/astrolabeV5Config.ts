import { z } from 'zod';
import { AstrolabeV3ConfigSchema } from '@/balancing/config/idleVillage/destinyAstrolabeV3/astrolabeV3Config';

/**
 * Destiny Astrolabe V5 — config-first (mandate Idle Village §5).
 *
 * Schema SEPARATO da V3: `astrolabeV3Config` è condiviso con V4 ed è coperto da
 * test che asseriscono i default, quindi non si tocca. V5 ne estende lo *schema*
 * (così `AstrolabeV5Config` resta assegnabile a `AstrolabeV3Config` e la geometria
 * del fiore si riusa verbatim) e aggiunge le proprie manopole.
 *
 * Convenzioni:
 *  - i raggi sono in spazio normalizzato, raggio arena = 1;
 *  - gli angoli di luce sono in gradi canvas: 0° = +x (destra), 90° = +y (basso).
 *    225° = alto-sinistra, coerente col light-leak già cotto nel backdrop.
 */
export const AstrolabeV5ConfigSchema = AstrolabeV3ConfigSchema.extend({
  /* ── Scatola e sizing ─────────────────────────────────────────────────── */
  /** Raggio arena come frazione del lato del board. Manopola viva: il fiore
   *  cresce/rimpicciolisce con questa. 0.44 = parità con V3, 0.36 = default V5
   *  (libera l'anello dei monoliti graduati e delle etichette). */
  arenaRadiusFraction: z.number().min(0.25).max(0.5).default(0.36),
  /** Sotto questa soglia nemmeno il tier "solo segno" dei monoliti è leggibile. */
  minBoardPx: z.number().int().min(120).max(400).default(180),
  /** Tetto: oltre i 720px il board non guadagna informazione, spreca fill rate. */
  maxBoardPx: z.number().int().min(300).max(1600).default(720),
  /** Inviluppo totale disegnato, in multipli di R (monoliti + anello etichette). */
  envelopeR: z.number().min(1).max(1.6).default(1.34),
  /** Raggio dell'anello delle etichette, in multipli di R. */
  labelRingR: z.number().min(1).max(1.5).default(1.3),

  /* ── Monoliti: geometria ──────────────────────────────────────────────── */
  /** Altezza del monolito sopra la base, in multipli di R. V3 era 0.16. */
  pillarHeightR: z.number().min(0.1).max(0.4).default(0.26),
  pillarHalfWidthR: z.number().min(0.02).max(0.1).default(0.055),
  /** Rastremazione: larghezza in punta / larghezza alla base. */
  pillarTaper: z.number().min(0.4).max(0.9).default(0.62),
  /** Frazione dell'altezza occupata dal piramidion. È ciò che fa leggere
   *  "obelisco" invece di "scatola". */
  pyramidionPct: z.number().min(0).max(0.3).default(0.12),
  /** Schiacciamento verticale del piano (vista zenitale obliqua). Governa
   *  l'ellitticità dell'invaso e la proiezione delle ombre. */
  boardTiltKy: z.number().min(0).max(0.8).default(0.34),
  /** Altezza della camera sopra il piano, in multipli di R. È IL parametro che
   *  rende la proiezione una sola per tutti e cinque i monoliti: la punta si
   *  sposta radialmente verso l'esterno di rb·H/(C−H), quindi i pilastri vicini
   *  al bordo si sdraiano più di quelli vicini al centro. V3 spostava la punta
   *  di −h in Y schermo, uguale per tutti, e per giunta verso il centro. */
  cameraHeightR: z.number().min(1.2).max(8).default(2.2),
  /** Profondità dell'invaso in cui il monolito affonda, in multipli di R. */
  socketDepthR: z.number().min(0).max(0.06).default(0.018),

  /* ── Monoliti: luce e materia ─────────────────────────────────────────── */
  /** Direzione dal centro verso la luce, gradi canvas. 225° = alto-sinistra. */
  lightAzimuthDeg: z.number().min(0).max(360).default(225),
  /** Distanza della luce dal centro, in multipli di R. La sorgente di questa
   *  scena è PUNTUALE e a distanza finita: è il light-leak già cotto nel
   *  backdrop a (cx−0.7R, cy−0.7R), cioè raggio ≈0.99R ad azimut 225°.
   *  È questo che fa VENTAGLIARE le ombre. Con una luce direzionale (sole
   *  all'infinito) le cinque ombre resterebbero parallele — ed è esattamente
   *  la firma del collage che V3 esibiva con la sua ellisse identica per tutti. */
  lightDistanceR: z.number().min(0.3).max(6).default(0.99),
  /** Elevazione della luce: bassa = ombre lunghe. */
  lightElevationDeg: z.number().min(10).max(80).default(34),
  pillarAmbient: z.number().min(0).max(0.4).default(0.1),
  /** Salto di valore fra faccia illuminata e faccia in ombra. V3 aveva ~0.03
   *  (8 unità RGB): volume nullo. */
  pillarFaceContrast: z.number().min(0.2).max(1).default(0.72),
  /** Prospettiva atmosferica: quanto i monoliti lontani dalla luce si smorzano. */
  pillarAtmoStrength: z.number().min(0).max(1).default(0.35),
  /** Ombra portata: lunghezza in multipli dell'altezza del monolito. */
  shadowLengthMul: z.number().min(0).max(4).default(1.7),
  shadowAlpha: z.number().min(0).max(1).default(0.42),
  /** Occlusione di contatto: raggio in multipli di R. Stretta e densa. */
  contactAoR: z.number().min(0).max(0.1).default(0.04),
  /** Caustica: cuneo di luce che il vetro concentra sul piano dentro l'ombra. */
  causticEnabled: z.boolean().default(true),
  causticAlpha: z.number().min(0).max(1).default(0.3),

  /* ── Monoliti: semantica (il check avversariale) ──────────────────────── */
  /** L'architrave della difficoltà sporge oltre la larghezza del fusto. */
  lintelOverhang: z.number().min(1).max(2.5).default(1.5),
  lintelLipWidthPx: z.number().min(0).max(4).default(1),
  /** Scarto minimo disegnabile: sotto questa soglia cresta/morso diventano segno. */
  minDeltaPx: z.number().min(1).max(6).default(2),
  /** Riflesso speculare sulla cresta quando la stat supera la difficoltà. */
  crestSpecularEnabled: z.boolean().default(true),
  /** Tratteggio del morso quando la stat è sotto la difficoltà. */
  biteHatchAngleDeg: z.number().min(0).max(180).default(45),
  /** Se true, ogni asse mostra la propria difficoltà. ATTENZIONE: attiva
   *  l'interpolazione a 5 settori di rChallengeAt e cambia la silhouette
   *  dell'arena per ogni caso esistente, snapshot e test compresi. */
  perAxisDifficultyEnabled: z.boolean().default(false),

  /* ── Starfield calmato ────────────────────────────────────────────────── */
  /** Moltiplica le densità V3 (90/45/18 → 40/20/8). */
  starfieldDensityScale: z.number().min(0).max(1).default(0.45),
  starfieldAlphaScale: z.number().min(0).max(1).default(0.75),
  /** V3 era 0.6: il twinkle era il secondo emettitore animato della scena. */
  twinkleAmount: z.number().min(0).max(1).default(0.18),
  starfieldLayers: z.number().int().min(1).max(3).default(2),

  /* ── Timeline: arm ────────────────────────────────────────────────────── */
  /** Clock unico dell'arm. V3 sommava 4 fasi per 3400ms. */
  tArmTotal: z.number().min(0).max(3000).default(900),
  armFrameSetStart: z.number().default(0),
  armFrameSetEnd: z.number().default(260),
  armThreatStart: z.number().default(120),
  armThreatEnd: z.number().default(560),
  armAgencyStart: z.number().default(340),
  armAgencyEnd: z.number().default(760),
  armRiskStart: z.number().default(620),
  armRiskEnd: z.number().default(900),
  pillarStaggerMs: z.number().min(0).max(200).default(55),
  pillarDropMs: z.number().min(50).max(600).default(200),

  /* ── Timeline: spin ───────────────────────────────────────────────────── */
  /** Durata a orologio dello spin. Manopola unica per ritarare tutto: il resto
   *  è disaccoppiato. V3: 3500-4500 + ~1340 di slow-mo = ~4.8s effettivi. */
  tSpinWallMs: z.number().min(600).max(6000).default(1590),
  /** Durata del tempo-traiettoria simulato, campionato PER TEMPO. */
  trajectoryMs: z.number().min(400).max(4000).default(1250),
  physicsSampleHz: z.number().min(30).max(240).default(120),
  /** Inizio del warp verso il landing, come frazione del percorso. */
  warpStart: z.number().min(0).max(1).default(0.25),
  warpSpan: z.number().min(0).max(1).default(0.75),
  /** Rampa continua di slow-mo (sostituisce il gradino di V3). */
  slowMoRampStart: z.number().min(0).max(1).default(0.62),
  slowMoRampSpan: z.number().min(0).max(1).default(0.38),

  /* ── Timeline: esito ──────────────────────────────────────────────────── */
  tHitStopMs: z.number().min(0).max(400).default(90),
  tSettleMs: z.number().min(0).max(600).default(150),
  tVerdictInMs: z.number().min(0).max(800).default(220),
  /** Il silenzio che separa i due dadi. Sotto 200 i due eventi si fondono e il
   *  rischio torna a leggersi come parte del D100. */
  tClosureBeatMs: z.number().min(0).max(800).default(260),

  /* ── Frattura: attivazione e forma ────────────────────────────────────── */
  fractureEnabled: z.boolean().default(true),
  fractureWoundTier: z.enum(['none', 'fissure', 'rift']).default('fissure'),
  fractureDeathTier: z.enum(['none', 'fissure', 'rift']).default('rift'),
  /** Come la crepa attraversa il fiore. 'under' = hairline in ombra sopra i
   *  petali, senza gap: la lastra d'avorio è intatta, il piano sotto è rotto. */
  fractureStarCrossMode: z.enum(['under', 'over', 'avoid']).default('under'),
  /** Ornstein-Uhlenbeck: richiamo verso la direzione radiale. Sotto 0.1 la
   *  crepa muore a metà lastra e si legge come graffio. */
  crackKappa: z.number().min(0).max(1).default(0.22),
  /** Rumore angolare. Sotto 0.2 sembra un raggio vettoriale, sopra 0.45 un
   *  fulmine da cartone animato. */
  crackSigma: z.number().min(0.05).max(0.8).default(0.3),
  crackStepR: z.number().min(0.01).max(0.2).default(0.055),
  crackBranchP0: z.number().min(0).max(1).default(0.3),
  crackBranchLambda: z.number().min(0).max(5).default(1.8),
  crackBranchMaxGen: z.number().int().min(0).max(4).default(2),
  crackForkAngleMin: z.number().min(0).max(2).default(0.52),
  crackForkAngleMax: z.number().min(0).max(2).default(0.92),
  fractureMaxNodes: z.number().int().min(20).max(600).default(160),
  woundBranchCount: z.number().int().min(1).max(8).default(2),
  deathBranchCount: z.number().int().min(1).max(8).default(3),
  /** Esclusione dura attorno al punto di atterraggio: le crepe non lo toccano
   *  mai, o il terremoto si leggerebbe come causa dell'esito. */
  landingExclusionR: z.number().min(0).max(0.5).default(0.18),

  /* ── Frattura: apertura e resa ────────────────────────────────────────── */
  crackWidthWound: z.number().min(0).max(0.05).default(0.007),
  crackWidthDeath: z.number().min(0).max(0.08).default(0.02),
  /** Esponente del nastro: 1.4 fa leggere "rottura", 1.0 fa leggere "cuneo". */
  crackTaperExp: z.number().min(1).max(3).default(1.4),
  /** Precomputato una volta per crepa: per frame sfarfalla. */
  crackWidthJitter: z.number().min(0).max(0.5).default(0.18),
  crackShadowOffsetPx: z.number().min(0).max(8).default(2.2),
  crackShadowAlpha: z.number().min(0).max(1).default(0.55),
  crackLipAlpha: z.number().min(0).max(1).default(0.3),
  crackSemanticAlpha: z.number().min(0).max(1).default(0.55),
  /** Riempimento semantico del nucleo (cremisi ferita / viola morte). */
  crackCoreFillAlpha: z.number().min(0).max(1).default(0.22),
  scarAlpha: z.number().min(0).max(1).default(0.55),
  /** Stelle ridisegnate dentro la fessura, in 'lighter'. */
  crackStarCount: z.number().int().min(0).max(40).default(8),
  debrisEnabled: z.boolean().default(true),
  debrisCount: z.number().int().min(0).max(60).default(14),
  /** Spostamento delle piastre: costa un ridisegno del campo per frame. */
  fracturePlateDisplacement: z.boolean().default(false),
  /** Calotta che sprofonda: solo se morte E landing già dentro una voragine. */
  deathCapRadiusR: z.number().min(0).max(0.4).default(0.13),
  deathCapSinkScale: z.number().min(0.3).max(1).default(0.72),
  deathCapRotateDeg: z.number().min(0).max(15).default(2.5),

  /* ── Frattura: scossa ─────────────────────────────────────────────────── */
  shakeAmpWound: z.number().min(0).max(0.08).default(0.01),
  shakeAmpDeath: z.number().min(0).max(0.08).default(0.024),
  /** Clamp runtime, non solo Zod: lo spread della config bypassa la validazione. */
  shakeAmpMax: z.number().min(0).max(0.08).default(0.026),
  /** Frequenze non armoniche: nessuna periodicità visibile, nessun moto lineare. */
  shakeFreq1Hz: z.number().min(1).max(60).default(17),
  shakeFreq2Hz: z.number().min(1).max(60).default(23),
  shakeTauWoundMs: z.number().min(20).max(1200).default(130),
  shakeTauDeathMs: z.number().min(20).max(1200).default(260),
  /** Sotto questa larghezza lo shake si legge come glitch della UI. */
  shakeMinBoardPx: z.number().int().min(0).max(600).default(240),
  /** Overscan del backdrop per non scoprire il fondo agli angoli. */
  shakeOverscanPx: z.number().min(0).max(20).default(2),

  /* ── Frattura: timing ─────────────────────────────────────────────────── */
  tRiskRevealDelayMs: z.number().min(0).max(2000).default(260),
  quakePreTremorMs: z.number().min(0).max(600).default(120),
  quakeFractureMs: z.number().min(20).max(600).default(90),
  quakeSpreadMs: z.number().min(0).max(900).default(260),
  quakeHealMs: z.number().min(0).max(1500).default(480),
  quakeSinkMs: z.number().min(0).max(1500).default(620),
  /** Solo nel caso doppio ferita+morte, se mai verrà abilitato. */
  quakeBeatBetweenMs: z.number().min(0).max(800).default(160),
  /** Flessione senza frattura quando il dado rischio è superato. Il secondo
   *  dado va VISTO comunque, o il giocatore non impara che è stato tirato. */
  riskFlexMs: z.number().min(0).max(400).default(90),
  riskFlexAmpMul: z.number().min(0).max(1).default(0.4),
  riskFlexFreqHz: z.number().min(1).max(60).default(30),

  /* ── Budget rumore ────────────────────────────────────────────────────── */
  /** Un solo glow primario per fase: idle→fiore, volo→palla, esito→zona. */
  glowPrimaryEnabled: z.boolean().default(true),
  glowSecondaryEnabled: z.boolean().default(true),
  ambientBreathPeriodMs: z.number().min(6000).max(15000).default(9400),
  ambientBreathDelta: z.number().min(0).max(0.25).default(0.06),
  /** Decadimento del flash di zona: esponenziale su dt, non -0.02 per frame. */
  zoneFlashDecayMs: z.number().min(60).max(900).default(240),

  /* ── Regole e rischio (erano inline nell'engine V1/V3) ────────────────── */
  difficultyClampMin: z.number().default(1),
  difficultyClampMax: z.number().default(99),

  /* ── Sampling e qualità ───────────────────────────────────────────────── */
  landingSampleAttempts: z.number().int().min(100).max(50000).default(12000),
  landingCandidateTarget: z.number().int().min(1).max(500).default(60),
  landingFallbackAttempts: z.number().int().min(100).max(50000).default(12000),
  landingFallbackTarget: z.number().int().min(1).max(500).default(20),
  polarSamples: z.number().int().min(120).max(2160).default(720),
  pathSegments: z.number().int().min(60).max(720).default(180),

  /* ── Presentazione e accessibilità ────────────────────────────────────── */
  /** 'brief' collassa il quake a 300ms: per le quest con molte milestone. */
  presentationTier: z.enum(['full', 'brief']).default('full'),
  respectReducedMotion: z.boolean().default(true),

  /* ── Seed ─────────────────────────────────────────────────────────────── */
  /** Salt distinto da quello della traiettoria (0x9e3779b9): la frattura non
   *  deve mai consumare dallo stream che produce roll/riskRoll/landing. */
  fractureSeedSalt: z.number().default(0x5bf03635),
})
  /* ── Refinement cross-campo (in V3 non ne esisteva nessuno) ───────────── */
  .refine((c) => c.warpStart + c.warpSpan <= 1, {
    message: 'warpStart + warpSpan deve stare entro 1',
    path: ['warpSpan'],
  })
  .refine((c) => c.slowMoRampStart + c.slowMoRampSpan <= 1, {
    message: 'slowMoRampStart + slowMoRampSpan deve stare entro 1',
    path: ['slowMoRampSpan'],
  })
  .refine((c) => c.bounceCountMin <= c.bounceCountMax, {
    message: 'bounceCountMin non può superare bounceCountMax',
    path: ['bounceCountMin'],
  })
  .refine((c) => c.minBoardPx <= c.maxBoardPx, {
    message: 'minBoardPx non può superare maxBoardPx',
    path: ['minBoardPx'],
  })
  .refine((c) => c.labelRingR <= c.envelopeR, {
    message: "l'anello etichette deve stare dentro l'inviluppo",
    path: ['labelRingR'],
  })
  .refine((c) => c.crackForkAngleMin <= c.crackForkAngleMax, {
    message: 'crackForkAngleMin non può superare crackForkAngleMax',
    path: ['crackForkAngleMin'],
  })
  .refine((c) => Math.max(c.shakeAmpWound, c.shakeAmpDeath) <= c.shakeAmpMax, {
    message: 'le ampiezze di scossa non possono superare shakeAmpMax',
    path: ['shakeAmpMax'],
  })
  .refine((c) => c.armRiskEnd <= c.tArmTotal, {
    message: "la finestra del rischio deve chiudersi entro l'arm",
    path: ['armRiskEnd'],
  });

export type AstrolabeV5Config = z.infer<typeof AstrolabeV5ConfigSchema>;

export const astrolabeV5Config: AstrolabeV5Config = AstrolabeV5ConfigSchema.parse({});

/**
 * Applica un override parziale rivalidando lo schema.
 * Lo spread diretto bypasserebbe i refinement: questa è la sola via legittima.
 */
export function resolveAstrolabeV5Config(
  overrides?: Partial<AstrolabeV5Config>,
): AstrolabeV5Config {
  if (!overrides) return astrolabeV5Config;
  const parsed = AstrolabeV5ConfigSchema.safeParse({ ...astrolabeV5Config, ...overrides });
  return parsed.success ? parsed.data : astrolabeV5Config;
}
