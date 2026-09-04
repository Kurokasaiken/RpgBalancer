/**
 * Config for the V6.2 "tar goo" challenge surface of the Destiny Astrolabe.
 *
 * The goo is rendered as a WebGL2 SDF metaball field (smooth-min) with a
 * viscous-tar material (near-black albedo, tight warm specular, teal fresnel
 * rim) and animated by a per-angle spring simulation with heavy damping.
 *
 * Values derived from the R-032 research convergence (multi-AI explorer +
 * web verification): tar reads as tar — not water/jelly — when viscosity is
 * high (damping 0.88–0.95), gravity-like drift is slow, the specular lobe is
 * tight, and lobes merge through surface-tension bridges (smooth-min).
 *
 * No component should hardcode these values.
 */

import { z } from 'zod';

/** RGB triple in 0..1 linear-ish space, consumed directly by the shader. */
const rgbSchema = z.tuple([z.number().min(0).max(1), z.number().min(0).max(1), z.number().min(0).max(1)]);

/**
 * Zod schema for the tar-goo rendering/simulation contract.
 */
const tarGooConfigSchema = z.object({
  timing: z.object({
    /** Black obelisks slam and the tar nucleus seeds (fast, percussive). */
    seedMs: z.number().int().min(200).max(1200),
    /** Main tar pour / spread. >= 1000 ms to avoid a watery snap. */
    pourMs: z.number().int().min(600).max(3000),
    /** How much goo is present at the end of the seed phase (0..1). */
    seedReveal: z.number().min(0).max(0.5),
  }),
  simulation: z.object({
    /** Number of radial spring samples around the rim (shader uniform size). */
    rimSamples: z.number().int().min(16).max(128),
    /** Spring stiffness pulling each rim sample toward rCheckAt(θ). Low = slow surge. */
    stiffness: z.number().min(0.001).max(0.2),
    /** Per-frame velocity retention. 0.88–0.95 = "sticky tar". */
    damping: z.number().min(0.5).max(0.99),
    /** Max radial speed in px/frame — caps spikes so the mass feels heavy. */
    maxSpeed: z.number().min(0.5).max(40),
    /** Number of crawling droplets merged into the rim field. */
    dropletCount: z.number().int().min(0).max(12),
    /** Droplet angular crawl speed range (rad/s) — tar creeps, it never darts. */
    dropletCrawlSpeed: z.tuple([z.number(), z.number()]),
    /** Droplet radius range in px. */
    dropletRadius: z.tuple([z.number(), z.number()]),
    /** How far outside the rim a droplet may bulge, in px (keeps obelisks legible). */
    dropletOvershoot: z.number().min(0).max(40),
    /** Falling tar drops before the main pour starts. */
    seedDropCount: z.number().int().min(0).max(8),
    /** Seed drop radius range in px. */
    seedDropRadius: z.tuple([z.number(), z.number()]),
    /** Seed drop gravity in px / ms^2 (viscous = low). */
    seedDropGravity: z.number().min(0).max(5),
    /** Per-frame velocity retention for falling drops (viscous damping). */
    seedDropDamping: z.number().min(0).max(1),
    /** Horizontal scatter from the central vertical at spawn. */
    seedDropScatter: z.number().min(0).max(120),
    /** Spawn height above the centre in px. */
    seedDropHeight: z.number().min(50).max(400),
    /** Delay between consecutive seed drops in ms. */
    seedDropStagger: z.number().min(0).max(1000),
  }),
  field: z.object({
    /** Smooth-min blend distance k in px — the surface-tension bridge width. */
    smoothMinK: z.number().min(1).max(80),
    /** Low-frequency silhouette undulation amplitude in px. */
    undulationAmp: z.number().min(0).max(12),
    /** Undulation speed multiplier (breathing tempo). */
    undulationSpeed: z.number().min(0).max(2),
  }),
  material: z.object({
    /** Near-black tar body — never pure black or the surface reads flat. */
    albedo: rgbSchema,
    /** Slightly lifted tone toward the lit side of the mass. */
    albedoLit: rgbSchema,
    /** Warm-white specular tint (the "wet" gleam). */
    specularColor: rgbSchema,
    /** Specular intensity 0.3–0.5: tar is glossy, not mirror. */
    specularIntensity: z.number().min(0).max(1),
    /** Blinn-Phong exponent — tight highlight = dense, viscous read. */
    specularExponent: z.number().min(4).max(256),
    /** Dark crimson/blood fresnel rim — reads as a danger/corruption line. */
    fresnelColor: rgbSchema,
    /** Fresnel rim intensity at grazing angles. */
    fresnelIntensity: z.number().min(0).max(1),
    /** Fresnel falloff power. */
    fresnelPower: z.number().min(0.5).max(8),
    /** Height profile: how "puffed" the mass reads near the edge (px falloff). */
    edgeHeightFalloff: z.number().min(2).max(60),
    /**
     * IL CORDOLO DEL BORDO (CP-H). Un bordo di catrame non e' un contorno: e' un
     * rigonfiamento dove la tensione superficiale accumula la materia. Misurato
     * prima: corpo piatto a luminanza 8, poi una fascia chiara larga 6px uguale
     * tutt'attorno — cioe' uno stroke luminoso su una sagoma nera, non un fluido.
     * `beadHeight` quanto si rialza, `beadPos` dove (0 = sul bordo, 1 = dentro),
     * `beadWidth` quanto e' stretto. `rimDirectional` quanto il riflesso dipende
     * dalla direzione della LUCE invece che dalla sola vista: a 0 e' un anello
     * uniforme, a 1 e' un cordolo illuminato da un lato.
     */
    beadHeight: z.number().min(0).max(2),
    beadPos: z.number().min(0).max(1),
    beadWidth: z.number().min(0.02).max(1),
    rimDirectional: z.number().min(0).max(1),
    /**
     * RILIEVO INTERNO. Il vortice esisteva gia' ma TINGEVA soltanto: entrava nel
     * mix del colore, non nell'altezza, quindi dentro il corpo la normale restava
     * verticale e non c'era nessuna ombreggiatura. Misurato: il 94% dei pixel del
     * catrame in un solo bin di luminanza — un buco, non una materia.
     * Qui il vortice entra nell'ALTEZZA prima che si calcoli la normale, cosi'
     * produce diffusa e speculare vere. E' il canale che Motoyoshi indica come
     * unico modo perche' una superficie scura venga riconosciuta come materiale.
     */
    swirlRelief: z.number().min(0).max(2),
    /** Internal swirl contrast (slow moving darker/lighter veins). */
    swirlIntensity: z.number().min(0).max(1),
    /** Light direction (unit-ish vec3, z up toward viewer). Top-left to match backdrop. */
    lightDir: z.tuple([z.number(), z.number(), z.number()]),
  }),
  /** Astral board backdrop — must contrast with the near-black tar. */
  backdrop: z.object({
    inner: z.string(),
    outer: z.string(),
    leakCore: z.string(),
    leakMid: z.string(),
    leakEdge: z.string(),
  }),
  /** Star/flower shape. The silhouette morphs from rounded petals to a sharp star
      as the player stat reaches and exceeds the skill check. */
  star: z.object({
    /** Valley depth when the player is well below the skill check (rounded flower). */
    valleyFlower: z.number().min(0).max(1),
    /** Valley depth when the player is at or above the skill check (sharp star). */
    valleyStar: z.number().min(0).max(1),
    /** Fraction of the arena radius over which the flower → star transition occurs. */
    transitionR: z.number().min(0).max(1),
  }),
  /**
   * V6.3 — LA COLATA VISCOSA (PLAN-010 CP-E).
   *
   * Blocco separato, e non per ordine: `simulation` e `timing` sono letti anche
   * dalla V6.2, che deve restare confrontabile fino a fine piano. Cambiare li'
   * muoverebbe il termine di paragone insieme all'esperimento.
   */
  v63: z.object({
    /**
     * Esponente della legge di Huppert (1982, JFM 121:43-58) per un flusso di
     * gravita' viscoso: `r ~ t^((3a+1)/8)` con volume `~ t^a`. A flusso costante
     * (a=1) l'esponente e' 1/2.
     *
     * Sostituisce una smoothstep, la cui derivata `6t(1-t)` e' ZERO all'inizio e
     * MASSIMA a meta': il catrame accelerava nella prima meta' della colata, che
     * e' l'opposto di viscoso. Con 1/2 la derivata decresce sempre — «sempre piu'
     * lentamente» diventa letterale invece che un'impressione.
     */
    pourExponent: z.number().min(0.05).max(1),
    /**
     * Smorzamento del bordo. Il numero non e' il fine: il fine e' che il bordo
     * arrivi e si fermi, senza assestamento oscillante. Col valore condiviso
     * (0.985) il rapporto di smorzamento vale 0.061 — gravemente sottosmorzato,
     * e infatti il bordo scavallava a 267px con il muro a 205 ed era ancora a 240
     * quando l'onda era gia' tornata a zero: suonava come gelatina, non catrame.
     */
    damping: z.number().min(0.5).max(0.99),
    /** Rigidezza della molla del bordo. */
    stiffness: z.number().min(0.001).max(0.2),
    /**
     * IL CONTATTO (CP-F). Larghezza in px dell'ombra che la stella proietta sul
     * catrame, e del menisco che il catrame forma arrampicandosi sul suo fianco.
     * Entrambi vivono SOLO dal lato del catrame: la silhouette della stella — che
     * porta la probabilita' — non si sposta di un pixel.
     */
    contactShadowPx: z.number().min(0).max(40),
    contactMeniscusPx: z.number().min(0).max(12),
    /**
     * CP-G — LA CONCA CHE SI RIEMPIE. Le gocce nascono su un anello FUORI
     * dall'arena e convergono verso il centro, invece di cadere dall'alto su un
     * punto centrale: il goo e' la difficolta', una condizione che c'e' gia', non
     * un evento che nasce al centro e invade.
     * `spawnRingFactor` e' il raggio di nascita in frazioni del raggio dell'arena;
     * `axisBias` quanto le gocce si addensano sugli assi piu' difficili (0 = niente).
     */
    spawnRingFactor: z.number().min(1).max(2),
    axisBias: z.number().min(0).max(1),
    /**
     * CP-H — IL FONDO E' PARTE DEL SISTEMA DI CONTRASTO, non decorazione postuma.
     * Misurare la materia del catrame su un fondo e poi cambiarlo invalida la
     * misura, quindi il fondo si congela PRIMA. Qui stanno le varianti fra cui
     * scegliere; `backdrop` dice quale e' attiva, e `?bg=<nome>` la sovrascrive a
     * runtime per poterle confrontare senza ricompilare.
     */
    backdrop: z.string(),
    backdrops: z.record(z.string(), z.object({
      inner: z.string(), outer: z.string(),
      leakCore: z.string(), leakMid: z.string(), leakEdge: z.string(),
    })),
    /**
     * CP-H — LA STELLA E' ACCOPPIATA AL FONDO. Misurato: su pergamena l'avorio
     * attuale scende a 1.10 di contrasto contro la pagina, cioe' sparisce. La
     * palette del personaggio non e' indipendente dal fondo su cui vive, e per
     * questo si sceglie insieme. `?star=<nome>` la sovrascrive a runtime.
     *
     * `face` sono i tre stop della faccia (centro, mezzo, bordo); `rimDark` e
     * `rimA`/`rimB` la ghiera; `core` i tre stop del nucleo.
     */
    star: z.string(),
    stars: z.record(z.string(), z.object({
      face: z.tuple([z.string(), z.string(), z.string()]),
      rimDark: z.string(),
      rimA: z.string(), rimB: z.string(),
      core: z.tuple([z.string(), z.string(), z.string()]),
    })),
    /**
     * V6.3 — IRIDESCENZA SOTTILE BENZINA (v20 FROZEN).
     * Colori cangianti sulle creste e sul bordo del catrame per leggere come
     * materia densa, non come buco. Intensita' bassa, non psichedelica.
     */
    iridescence: z.object({
      colorA: rgbSchema, colorB: rgbSchema, colorC: rgbSchema,
      power: z.number().min(0).max(1),
      speed: z.number().min(0).max(5),
      spread: z.number().min(0).max(4),
    }),
  }),
});

/** Inferred tar goo config type. */
export type TarGooConfig = z.infer<typeof tarGooConfigSchema>;

/**
 * Canonical tar-goo parameters for DestinyAstrolabe V6.2.
 */
export const tarGooConfig: TarGooConfig = tarGooConfigSchema.parse({
  timing: {
    seedMs: 900,
    pourMs: 1100,
    seedReveal: 0.08,
  },
  simulation: {
    rimSamples: 96,
    stiffness: 0.015,
    damping: 0.985,
    maxSpeed: 5.0,
    dropletCount: 12,
    dropletCrawlSpeed: [0.04, 0.12],
    dropletRadius: [9, 22],
    dropletOvershoot: 16,
    seedDropCount: 6,
    seedDropRadius: [14, 24],
    seedDropGravity: 0.0012,
    seedDropDamping: 0.94,
    seedDropScatter: 90,
    seedDropHeight: 220,
    seedDropStagger: 60,
  },
  field: {
    smoothMinK: 26,
    undulationAmp: 4.5,
    undulationSpeed: 0.42,
  },
  material: {
    albedo: [0.012, 0.016, 0.034],
    albedoLit: [0.05, 0.07, 0.11],
    /* IL RIFLESSO BAGNATO. Era [0.55,0.04,0.02] a intensita' 0.25: rosso scuro e
       fioco, cioe' incapace di produrre un solo pixel luminoso. Il corpo del
       catrame DEVE restare nerissimo — l'albedo non si tocca — ma un liquido
       scuro si riconosce dai riflessi, non dal colore: e' la popolazione di
       pixel brillanti di Motoyoshi. Bianco appena freddo, come il cielo che il
       catrame rispecchia. */
    specularColor: [0.86, 0.93, 1.0],
    specularIntensity: 1.0,   /* il tetto dello schema: non lo allargo per un ritocco */
    /* 42 spegneva la speculare nel corpo: con la superficie piatta la direzione
       riflessa da' R.z = 0.56, e pow(0.56,42) vale 2e-11. Serviva un esponente
       compatibile con l'inclinazione che il rilievo produce davvero. */
    specularExponent: 12,
    /**
     * NIENTE BORDO ROSSO. Era un cremisi dichiarato «danger/corruption line»:
     * rosso-uguale-pericolo e' un SIMBOLO, cioe' una convenzione da imparare, e
     * per giunta un bordo continuo rinforza la CHIUSURA — che e' la firma del
     * contenitore, l'opposto di «perdita». Il bordo ora e' un colmo bagnato
     * freddo: si legge per rilievo, non per convenzione, come nella V16.
     */
    fresnelColor: [0.36, 0.62, 0.60],
    fresnelIntensity: 0.85,
    fresnelPower: 3.0,   /* stretta: un cordolo, non un lavaggio */
    edgeHeightFalloff: 8,
    beadHeight: 0.55,
    beadPos: 0.30,
    beadWidth: 0.18,
    rimDirectional: 0.8,
    swirlRelief: 1.6,
    swirlIntensity: 0.22,
    lightDir: [-0.55, -0.62, 0.56],
  },
  backdrop: {
    inner: 'rgba(80,160,155,1)',
    outer: 'rgba(38,105,102,1)',
    leakCore: 'rgba(0,229,255,.50)',
    leakMid: 'rgba(0,229,255,.22)',
    leakEdge: 'rgba(0,0,0,0)',
  },
  star: {
    /** Very rounded when the player is below the check — reads as a 5-petal flower. */
    valleyFlower: 0.78,
    /** Very sharp when the player matches/exceeds the check — a true star. */
    valleyStar: 0.12,
    transitionR: 0.25,
  },
  v63: {
    pourExponent: 0.5,   // flusso costante: r ~ t^(1/2)
    damping: 0.75,       // rapporto di smorzamento ~1.0 con la rigidezza qui sotto
    stiffness: 0.015,
    contactShadowPx: 16,
    contactMeniscusPx: 3,
    spawnRingFactor: 1.18,
    axisBias: 0.6,
    /* CP-H: fondo congelato dal Director (2026-08-31). Da qui la materia si tara su questo. */
    backdrop: 'ardesia',
    backdrops: {
      /** quello attuale, tenuto come termine di paragone */
      teal: {
        inner: 'rgba(80,160,155,1)', outer: 'rgba(38,105,102,1)',
        leakCore: 'rgba(0,229,255,.50)', leakMid: 'rgba(0,229,255,.22)',
        leakEdge: 'rgba(0,0,0,0)',
      },
      /** la candidata del Director: inchiostro su pergamena si riconosce a colpo d'occhio */
      pergamena: {
        inner: 'rgba(236,219,183,1)', outer: 'rgba(188,163,120,1)',
        leakCore: 'rgba(255,244,214,.55)', leakMid: 'rgba(255,236,190,.24)',
        leakEdge: 'rgba(0,0,0,0)',
      },
      /** pergamena vecchia: piu' calda e piu' sporca, meno contrasto col catrame */
      pergamenaScura: {
        inner: 'rgba(206,183,141,1)', outer: 'rgba(150,124,88,1)',
        leakCore: 'rgba(255,232,186,.42)', leakMid: 'rgba(226,199,152,.20)',
        leakEdge: 'rgba(0,0,0,0)',
      },
      /** ardesia: fondo freddo e scuro, il catrame si distingue per riflesso e non per valore */
      ardesia: {
        inner: 'rgba(74,84,96,1)', outer: 'rgba(38,44,54,1)',
        leakCore: 'rgba(180,206,232,.34)', leakMid: 'rgba(150,178,206,.16)',
        leakEdge: 'rgba(0,0,0,0)',
      },
      /** ciano-petrolio: schiarito e raffreddato per staccare il catrame nero */
      deepTeal: {
        inner: 'rgba(0,26,38,1)', outer: '#02020b',
        leakCore: 'rgba(0,235,225,.45)', leakMid: 'rgba(0,165,175,.22)',
        leakEdge: 'rgba(0,0,0,0)',
      },
      /** fumo: grigio caldo-neutro, stacca il nero senza essere freddo */
      smoke: {
        inner: 'rgba(110,118,132,1)', outer: 'rgba(36,40,48,1)',
        leakCore: 'rgba(225,230,245,.35)', leakMid: 'rgba(180,188,206,.17)',
        leakEdge: 'rgba(0,0,0,0)',
      },
    },
    star: 'avorio',
    stars: {
      /** l'attuale: avorio e oro pallido. Nato su fondo scuro, su pergamena sparisce. */
      avorio: {
        face: ['#ffffff', '#fdf8e9', '#ecd49a'],
        rimDark: '#602c08', rimA: '#fce890', rimB: '#a06a1e',
        core: ['#f7e1ad', '#cf9d4a', '#7d4d12'],
      },
      /** bronzo brunito: un sigillo di metallo intarsiato nella pagina. */
      bronzo: {
        face: ['#e8b968', '#c08a34', '#8a5a16'],
        rimDark: '#3a1c04', rimA: '#f0cf7e', rimB: '#6d4310',
        core: ['#f2d79a', '#a8722a', '#4a2c08'],
      },
      /** ceralacca: rosso sangue di bue, il sigillo posato sul foglio. */
      ceralacca: {
        face: ['#c4553f', '#9b3526', '#6b1f16'],
        rimDark: '#2e0c07', rimA: '#e8a48c', rimB: '#5c1a12',
        core: ['#dda08c', '#a34430', '#4a120c'],
      },
      /** verderame: la palette fredda della bibbia, portata sul caldo della carta. */
      verderame: {
        face: ['#7fc4ad', '#3f8d78', '#1f5546'],
        rimDark: '#0c2a22', rimA: '#a8ddca', rimB: '#2a6b58',
        core: ['#b6e0d0', '#3c8b74', '#123b30'],
      },
    },
    iridescence: {
      colorA: [0.18, 0.92, 0.72],
      colorB: [0.85, 0.28, 0.48],
      colorC: [0.35, 0.68, 1.0],
      power: 0.45,
      speed: 0.35,
      spread: 2.0,
    },
  },
});
