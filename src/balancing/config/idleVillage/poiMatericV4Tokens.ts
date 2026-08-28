/**
 * Visual token contract for the POI Materic V4 marker.
 *
 * V4 fixes three defects diagnosed in V3 and reproduced in the "Bronzo e Luce"
 * visual study:
 *
 * 1. **The metal was being repainted per type.** In V3 `rimColors` fed the
 *    medallion body gradient, so a POI type replaced the alloy instead of
 *    adding identity — teal and red read as painted plastic because their mid
 *    tone is a pigment, not a metal. V4 keeps the per-type ring colour — that
 *    is what tells the player which activity this is — but gives every type a
 *    real ALLOY: a three-stop ramp with a warm specular, a saturated mid and a
 *    near-black shadow. The defect was never the colour, it was the ramp.
 *
 * 2. **The seal glow was black.** V3 blurred `SourceGraphic`, so the halo
 *    inherited the colour of what it blurred — and the seal contains a hundred
 *    black letters. A real bloom is built from `SourceAlpha` (the shape),
 *    tinted, and laid UNDER a crisp core pass.
 *
 * 3. **The glow could not follow the type.** V3 hardcoded the accent, ignoring
 *    the `coronaCore` / `coronaGlow` already present in `poiColorConfig`. Here
 *    every type owns its light.
 *
 * Art direction: deep cool teal / emerald shadows, no grey and no brown as a
 * shadow colour (`src/docs/docs/plans/art_direction_plan.md`). Layer count per
 * `src/docs/docs/visual_design_philosophy.md`.
 *
 * No component may hardcode these values.
 */

import { z } from 'zod';

/** One heraldic mark, built by rotating a single arm — never a one-off drawing. */
const iconSchema = z.object({
  /** Path data for the repeated arm, drawn around the origin. */
  arm: z.string(),
  /** Rotation angles, in degrees, at which the arm is stamped. */
  steps: z.array(z.number()).min(1),
  /** Optional shorter arm, for marks that alternate long and short rays. */
  armShort: z.string().optional(),
  /** Rotation angles for the short arm. */
  stepsShort: z.array(z.number()).optional(),
  /** Radius of the central boss. */
  boss: z.number(),
  /** Concentric rings that belong to the mark (rims, hubs). */
  rings: z.array(z.object({ r: z.number(), w: z.number() })),
});

/**
 * Everything a single POI type contributes: its own alloy, its own mark, its
 * own light.
 *
 * The alloy is a three-stop ramp, and its STRUCTURE is what decides whether the
 * ring reads as cast metal or as painted plastic — a bright warm specular, a
 * saturated mid, a near-black shadow. V3's teal failed not because it was teal
 * but because its mid tone (`#30c0b0`) is a pigment: flat, unlit, with nothing
 * above or below it. A patinated alloy keeps the ramp and moves the hue.
 */
const typeIdentitySchema = z.object({
  /** Which heraldic mark this type carries. */
  icon: z.enum(['quest', 'job', 'event']),
  /** Specular / mid / shadow of the type's alloy. Ordered light to dark. */
  alloy: z.tuple([z.string(), z.string(), z.string()]),
  /** Colour of the seal bloom — the type's light. */
  glow: z.string(),
  /** Colour of the two seal rails. */
  rail: z.string(),
  /**
   * The rim glaze: a vitrified lip riding the outermost edge, BRIGHTER than the
   * alloy it sits on. The earlier dark enamel keyline was a saturated pigment
   * over light metal, so wherever it ran it dropped the edge by a third of a
   * stop and read as a black hoop. A glaze adds light instead of subtracting it.
   */
  glaze: z.string(),
});

const tokensSchema = z.object({
  /**
   * The mark's own metal, shared by all three types so the heraldic sign always
   * reads as the same struck gold whatever ring surrounds it. The per-type
   * alloys live in `types[*].alloy`.
   */
  metal: z.object({
    light: z.string(),
    mid: z.string(),
    dark: z.string(),
    /** Highlight along the lit edge of a cast form. */
    specular: z.string(),
    /** Mid tone of the icon's metal ramp. */
    iconMid: z.string(),
    /** Shadow tone of the icon's metal ramp. */
    iconDark: z.string(),
    /** Crown of the icon's metal ramp, brighter than `light`. */
    iconCrown: z.string(),
  }),

  /** Geometry, in the 86-unit viewBox inherited from V3. */
  geometry: z.object({
    center: z.number(),
    medalRadius: z.number(),
    innerRingRadius: z.number(),
    fieldRadius: z.number(),
    glassRadius: z.number(),
    glazeRadius: z.number(),
    glazeWidth: z.number(),
    rimLetterRadius: z.number(),
    rimLetterCount: z.number(),
    rimLetterScale: z.number(),
    /** Magic circle: outer and inner rails, and the two letter bands. */
    sealOuterRail: z.number(),
    sealInnerRail: z.number(),
    sealUpperBand: z.number(),
    sealLowerBand: z.number(),
  }),

  /** The magic circle written by the passage of time. */
  seal: z.object({
    letterCount: z.number(),
    letterScale: z.number(),
    /** Halo pass: rails are wider so the bloom has something to bleed from. */
    railWidth: z.number(),
    /** Core pass: the crisp reading layer drawn over the halo. */
    coreRailWidth: z.number(),
    letterWidth: z.number(),
    coreLetterWidth: z.number(),
    /**
     * The narrow shadow rail. V3 used an 11-unit near-black band widened by a
     * 12px blur, which is why the seal never looked luminous: it was a shadow
     * standing where the glow should be. Kept, but narrow — it still earns its
     * place on the light sand and fields of the map.
     */
    trackWidth: z.number(),
    trackColor: z.string(),
    /** Colour of the crisp letter core: near-white, so the light has a source. */
    coreInk: z.string(),
    /**
     * How the circle FILLS rather than extends. A rail composes at constant
     * thickness and constant light; a liquid has a bright meniscus at the front
     * and a wake that settles behind it. These describe that front.
     */
    flow: z.object({
      /** Fraction of the written arc that still counts as wake, behind the head. */
      wakeFraction: z.number(),
      /** Fraction of the written arc that is the bright head itself. */
      headFraction: z.number(),
      /** Radius of the meniscus bead riding the front. */
      headRadius: z.number(),
      /** How many letters behind the front are still flaring. */
      flareLetters: z.number(),
      /** Opacity of the settled body, once the front has passed. */
      settledOpacity: z.number(),
    }),
  }),

  /**
   * Cardinal sparks at twelve, three, six and nine o'clock, ported from
   * runicV1's four-point flares.
   *
   * Two things had to change in the port. In runicV1 they are a flat fill in a
   * single colour; here they belong to the seal, which means they are LIGHT —
   * they ride the same bloom as the script and carry a crisp core, or they
   * would read as four stickers glued onto a glowing ring. And runicV1 lights
   * them in a hardcoded clockwise order; here they are placed and lit along the
   * writing direction, so they still mark the quarters when the clock runs
   * counter-clockwise.
   *
   * On proportion: the reference is the MEDALLION, not the viewBox. runicV1
   * draws a 6.3-unit flare against a 37-unit medallion in a 120-unit box; V4
   * has a 42-unit medallion in an 86-unit box. Normalising against the box —
   * which is what a first pass here did — makes the sparks 1.7x too small,
   * because the two components do not share the same medallion-to-box ratio.
   * Matching runicV1's flare-to-medallion ratio of 0.170 is what preserves the
   * proportion the original got right.
   */
  cardinals: z.object({
    /** Rides the outer rail, so the quarters read as marks ON the circle. */
    radius: z.number(),
    /** Fractions of the circle, measured along the writing direction. */
    fractions: z.array(z.number()),
    path: z.string(),
    scale: z.number(),
    /** The crisp core is a smaller copy of the same flare. */
    coreScale: z.number(),
    /** How quickly a spark comes up once the front has crossed it. */
    riseSpan: z.number(),
    /** Brief overbrightness as the front passes through it. */
    flareSpan: z.number(),
    settledOpacity: z.number(),
  }),

  /** Bloom built from SourceAlpha, so the halo never inherits ink colour. */
  bloom: z.object({
    radii: z.tuple([z.number(), z.number(), z.number()]),
    /** Alpha multiplier of the tinted halo. Above ~1 the ring floods. */
    strength: z.number(),
  }),

  /**
   * How hard the alloy's shadow bites at the outer edge. The ramp needs a dark
   * end to read as metal, but pushed too far it becomes a black hoop that
   * fights the ring's own colour instead of seating it.
   */
  edge: z.object({
    /** Where the ramp starts turning to shadow. Later = a softer rim. */
    shadowStop: z.number(),
    /** Opacity of the body over the dark backing. 1 = no black bleeding through. */
    bodyOpacity: z.number(),
    /** Opacity of the diagonal bevel's shadow end. */
    bevelShadowOpacity: z.number(),
    /** Opacity of the whole bevel pass. */
    bevelOpacity: z.number(),
  }),

  /**
   * The opt-in cast shadow: a PROJECTION, not a copy.
   *
   * The earlier version stacked a contact blob, a cast blob and an occlusion
   * halo — all of them circles, all concentric with the marker. A copy of a
   * circle is a circle, and a circle declares no ground plane, so none of it
   * read as a shadow. What carries the plane is the SHAPE: the silhouette
   * squashed onto the ground and sheared along the light azimuth, which turns
   * a disc into a tilted ellipse.
   *
   * Blending, not painting. Human vision judges luminance relative to the
   * local background (Weber's law: the just-noticeable difference is a roughly
   * constant FRACTION of background luminance, about 1-3%). A fixed-colour
   * shadow therefore has strong contrast on pale sand and almost none on dark
   * forest — the same paint, two different percepts. Multiplying against the
   * backdrop keeps the ratio constant, which is both the physics of a shadow
   * and the only way it reads equally on every terrain.
   */
  shadow: z.object({
    /** Horizontal radius. Narrower than the medallion: a shadow is not a twin. */
    rx: z.number(),
    /** Vertical radius — the squash that declares a ground plane. */
    ry: z.number(),
    /** Clearance between the medallion's bottom edge and the shadow's top. */
    gap: z.number(),
    /** Lateral offset, away from the upper-left light. */
    dx: z.number(),
    /** Tilt of the major axis along the light azimuth, in degrees. */
    tilt: z.number(),
    blur: z.number(),
    /**
     * Deliberately a DARK colour with partial alpha rather than a light
     * multiply factor. Multiply only reaches the map when no ancestor isolates
     * the compositing group — a `transform`, an `opacity` below 1 or a filter
     * anywhere above is enough to cut it off, and then the fill is painted as
     * it is. A light factor degrades into a pale blob, which is worse than no
     * shadow; a dark colour degrades into an ordinary shadow, which is merely
     * less clever. Choose the failure you can live with.
     */
    color: z.string(),
    opacity: z.number(),
    blendMode: z.string(),
  }),

  /** The engraved band inside the medallion. */
  rim: z.object({
    /** Chromatic dark: the band taken to the bottom of its own value. */
    ink: z.string(),
    /** Lower lip of the incision — a hair of metal light under the cut. */
    lipOpacity: z.number(),
    strokeWidth: z.number(),
  }),

  /** Field stone and glass, unchanged in spirit from V3. */
  surface: z.object({
    fieldLight: z.string(),
    fieldDark: z.string(),
    glassHighlight: z.string(),
    glassShadow: z.string(),
    specularFill: z.string(),
    innerShadow: z.string(),
    /**
     * Where the glaze fades out on the unlit side. Never a dark colour: a glaze
     * that terminates in shadow is just the dark hoop again, wearing a new name.
     */
    glazeFadeOpacity: z.number(),
    /** Strength of the alloy's bounce light in the recess. Keep it barely there. */
    bounceOpacity: z.number(),
  }),

  icons: z.object({
    quest: iconSchema,
    job: iconSchema,
    event: iconSchema,
  }),

  types: z.object({
    quest: typeIdentitySchema,
    job: typeIdentitySchema,
    event: typeIdentitySchema,
  }),
});

export type PoiMatericV4Tokens = z.infer<typeof tokensSchema>;

export const POI_MATERIC_V4_TOKENS: PoiMatericV4Tokens = tokensSchema.parse({
  metal: {
    light: '#fce890',
    mid: '#c09030',
    dark: '#200e02',
    specular: '#fff8d8',
    iconCrown: '#fff3c4',
    iconMid: '#f0cf6a',
    iconDark: '#4a2f08',
  },

  geometry: {
    center: 43,
    medalRadius: 42,
    innerRingRadius: 34,
    fieldRadius: 30.5,
    glassRadius: 27.5,
    glazeRadius: 41.5,
    glazeWidth: 1.3,
    rimLetterRadius: 38,
    rimLetterCount: 24,
    rimLetterScale: 0.66,
    sealOuterRail: 54,
    sealInnerRail: 45,
    sealUpperBand: 51.5,
    sealLowerBand: 47.5,
  },

  seal: {
    letterCount: 100,
    letterScale: 0.28,
    railWidth: 2.4,
    coreRailWidth: 1.5,
    letterWidth: 0.95,
    coreLetterWidth: 0.85,
    trackWidth: 4.5,
    trackColor: 'rgba(10,12,16,0.72)',
    coreInk: '#fffbe8',
    flow: {
      wakeFraction: 0.22,
      headFraction: 0.05,
      headRadius: 2.6,
      flareLetters: 7,
      settledOpacity: 0.55,
    },
  },

  cardinals: {
    radius: 54,
    fractions: [0, 0.25, 0.5, 0.75],
    path: 'M0 -9 Q0.9 -1.4 8 0 Q0.9 1.4 0 9 Q-0.9 1.4 -8 0 Q-0.9 -1.4 0 -9 Z',
    scale: 0.79,
    coreScale: 0.45,
    riseSpan: 0.1,
    flareSpan: 0.06,
    settledOpacity: 0.72,
  },

  bloom: {
    radii: [0.5, 1.6, 4.2],
    strength: 0.55,
  },

  edge: {
    shadowStop: 0.93,
    bodyOpacity: 1,
    bevelShadowOpacity: 0.44,
    bevelOpacity: 0.4,
  },

  shadow: {
    rx: 33,
    ry: 25,
    gap: 2.5,
    dx: 4,
    tilt: 14,
    blur: 3.5,
    color: '#22322f',
    opacity: 0.56,
    blendMode: 'multiply',
  },

  rim: {
    ink: '#200e02',
    lipOpacity: 0.28,
    strokeWidth: 1.3,
  },

  surface: {
    fieldLight: '#12202a',
    fieldDark: '#04080c',
    glassHighlight: 'rgba(255,255,255,0.26)',
    glassShadow: 'rgba(0,0,0,0.30)',
    specularFill: 'rgba(255,255,255,0.20)',
    innerShadow: 'rgba(0,0,0,0.75)',
    glazeFadeOpacity: 0.05,
    bounceOpacity: 0.16,
  },

  icons: {
    /**
     * quest — the cross fleury already in V3, kept verbatim. It is the quality
     * bar the other two marks are built to stand beside, and the reason it
     * works is that it is a rule, not a drawing: one arm, four rotations.
     */
    quest: {
      arm: 'M-3 -5 L-3 -17 L-6.4 -21 L-3.4 -22.2 L0 -18.4 L3.4 -22.2 L6.4 -21 L3 -17 L3 -5 Z',
      steps: [0, 90, 180, 270],
      boss: 4,
      rings: [],
    },
    /**
     * job — a rectangular paddle stamped six times ON the rim: the mill wheel.
     * An earlier attempt used eight trapezoidal teeth and read as a settings
     * cog, which is the wrong register for a medieval village.
     */
    job: {
      arm: 'M-3 -20.5 L3 -20.5 L3 -12.5 L-3 -12.5 Z',
      steps: [0, 60, 120, 180, 240, 300],
      boss: 5.2,
      rings: [
        { r: 13.5, w: 2.8 },
        { r: 20.5, w: 1.6 },
      ],
    },
    /**
     * event — four long rays plus four short ones on the diagonals. Radiant
     * where the cross is orthogonal: the silhouette says "something is
     * happening" before any colour is read.
     */
    event: {
      arm: 'M0 -22 L2.7 -6.5 L0 -3.6 L-2.7 -6.5 Z',
      steps: [0, 90, 180, 270],
      armShort: 'M0 -13.5 L1.9 -5.4 L0 -3.2 L-1.9 -5.4 Z',
      stepsShort: [45, 135, 225, 315],
      boss: 3.6,
      rings: [],
    },
  },

  /**
   * Three types, three identities. Nothing is shared but the construction rule; what changes is the alloy, the mark, the light and the rim glaze.
   */
  types: {
    /** quest — hot copper: the alloy of an oath, struck and reddened. */
    quest: {
      icon: 'quest',
      alloy: ['#ffdcb4', '#a8542a', '#1d0a04'],
      glow: '#e8604a',
      rail: '#f2a184',
      glaze: '#ffb59a',
    },
    /** job — verdigris bronze: not bronze painted green, bronze that has worked. */
    job: {
      icon: 'job',
      alloy: ['#dcf4e6', '#4e8f78', '#0b201a'],
      glow: '#35c8b6',
      rail: '#7fe6da',
      glaze: '#b6f4e8',
    },
    /** event — the gold ramp that always worked, kept verbatim as the benchmark. */
    event: {
      icon: 'event',
      alloy: ['#fce890', '#c09030', '#200e02'],
      glow: '#f5c24a',
      rail: '#f7d98e',
      glaze: '#ffe9a8',
    },
  },
});
