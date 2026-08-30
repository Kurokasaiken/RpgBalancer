/**
 * Colour-grade tokens for the World Surface event shroud (the parchment
 * curtains that close over the map when a world event fires).
 *
 * Why a gradient map and not `hue-rotate`:
 * the shroud art is warm cream parchment (measured average lit colour
 * rgb(221,202,177), hue 34deg) drawn with dark ink linework. Rotating its hue
 * moves the highlights too, which collapses the asset's tonal range from ~190
 * luma levels to ~85 and turns painted parchment into flat mid-value fog. The
 * art bible asks for the opposite: "Le ombre non sono mai grigie o marroni.
 * Colore Ombre: Deep & Cool Teal" with "Luce: Bianco accecante", and the Kill
 * List forbids "nebbia grigia".
 *
 * A gradient map desaturates to luminance and then re-maps that luminance onto
 * a teal ramp, so the teal lands in the ink and the shadows while the highlights
 * stay bright. Measured on the real asset it preserves ~184 of the original 190
 * luma levels and keeps highlights within +2% of their source brightness.
 *
 * The ramp is expressed as `feComponentTransfer` table values (9 evenly spaced
 * samples per channel, normalised 0..1), which is what the SVG filter consumes
 * directly.
 */

/** A gradient-map ramp as SVG `feComponentTransfer` table values, 0..1. */
export interface ShroudGradeRamp {
  /** Red channel table values, evenly spaced across input luminance. */
  red: readonly number[];
  /** Green channel table values, evenly spaced across input luminance. */
  green: readonly number[];
  /** Blue channel table values, evenly spaced across input luminance. */
  blue: readonly number[];
}

/**
 * Deep teal ("ottanio") ramp for threat-class events.
 *
 * Ramp anchors, as sRGB: ink rgb(7,38,48) -> shadow rgb(18,84,94) ->
 * midtone rgb(158,206,203) -> highlight rgb(250,252,247).
 */
export const EVENT_SHROUD_TEAL_RAMP: ShroudGradeRamp = {
  red: [0.0275, 0.0467, 0.066, 0.2444, 0.4732, 0.6583, 0.7656, 0.873, 0.9804],
  green: [0.149, 0.2296, 0.3101, 0.4809, 0.6803, 0.8272, 0.8809, 0.9345, 0.9882],
  blue: [0.1882, 0.2688, 0.3493, 0.504, 0.6821, 0.8146, 0.8659, 0.9173, 0.9686],
};

/** DOM id of the SVG filter the renderer mounts and the shroud layers reference. */
export const EVENT_SHROUD_FILTER_ID = 'ws-event-shroud-teal';

export const eventShroudGradeConfig = {
  /** Whether the teal grade is applied to the event shroud layers at all. */
  enabled: true,
  ramp: EVENT_SHROUD_TEAL_RAMP,
  filterId: EVENT_SHROUD_FILTER_ID,
  /**
   * How long the grade takes to reach full strength, in ms.
   *
   * The colour arrives *with* the curtains rather than after them: the shroud
   * travel is 900ms, so the grade ramps over the same window and is fully teal
   * at the moment the two halves meet in the centre.
   */
  rampDurationMs: 900,
} as const;

export type EventShroudGradeConfig = typeof eventShroudGradeConfig;
