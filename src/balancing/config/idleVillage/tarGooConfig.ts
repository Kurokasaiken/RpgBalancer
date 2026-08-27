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
    /** Teal fresnel rim, matches the board's azure light-leak. */
    fresnelColor: rgbSchema,
    /** Fresnel rim intensity at grazing angles. */
    fresnelIntensity: z.number().min(0).max(1),
    /** Fresnel falloff power. */
    fresnelPower: z.number().min(0.5).max(8),
    /** Height profile: how "puffed" the mass reads near the edge (px falloff). */
    edgeHeightFalloff: z.number().min(2).max(60),
    /** Internal swirl contrast (slow moving darker/lighter veins). */
    swirlIntensity: z.number().min(0).max(1),
    /** Light direction (unit-ish vec3, z up toward viewer). Top-left to match backdrop. */
    lightDir: z.tuple([z.number(), z.number(), z.number()]),
  }),
});

/** Inferred tar goo config type. */
export type TarGooConfig = z.infer<typeof tarGooConfigSchema>;

/**
 * Canonical tar-goo parameters for DestinyAstrolabe V6.2.
 */
export const tarGooConfig: TarGooConfig = tarGooConfigSchema.parse({
  timing: {
    seedMs: 520,
    pourMs: 1300,
    seedReveal: 0.08,
  },
  simulation: {
    rimSamples: 96,
    stiffness: 0.024,
    damping: 0.925,
    maxSpeed: 7,
    dropletCount: 7,
    dropletCrawlSpeed: [0.03, 0.09],
    dropletRadius: [9, 22],
    dropletOvershoot: 14,
  },
  field: {
    smoothMinK: 26,
    undulationAmp: 3.6,
    undulationSpeed: 0.24,
  },
  material: {
    albedo: [0.012, 0.016, 0.034],
    albedoLit: [0.05, 0.07, 0.11],
    specularColor: [1.0, 0.94, 0.82],
    specularIntensity: 0.42,
    specularExponent: 64,
    fresnelColor: [0.0, 0.9, 1.0],
    fresnelIntensity: 0.34,
    fresnelPower: 3.0,
    edgeHeightFalloff: 22,
    swirlIntensity: 0.22,
    lightDir: [-0.55, -0.62, 0.56],
  },
});
