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
 * The anchors are placed against the asset's real luminance histogram, not
 * spread evenly: 98% of the shroud's opaque pixels live between luma 113 and
 * 242 (t 0.44..0.95), with the median cloud body at t=0.845. Spacing the ramp
 * evenly would spend half its resolution on a tonal band the art does not use,
 * which is why an even ramp came out as pale mint — the cloud mass landed on the
 * bright end. Anchoring the median at mid-octane is what makes the curtain read
 * as deep teal.
 *
 * Resulting tones on the real asset: ink #051922, cloud shadow #1a636f,
 * dominant cloud body #3a8e98, lit cloud #78bfc3, specular crown near #cdeae8.
 * Useful tonal range 206 luma levels, against 85 for the `hue-rotate` recipe
 * this replaces.
 */
export const EVENT_SHROUD_TEAL_RAMP: ShroudGradeRamp = {
  red: [
    0.0157, 0.0168, 0.0179, 0.019, 0.0201, 0.0213, 0.0224, 0.0235, 0.0321,
    0.043, 0.0616, 0.0803, 0.099, 0.1795, 0.316, 0.5133, 0.8039,
  ],
  green: [
    0.0784, 0.0851, 0.0918, 0.0985, 0.1052, 0.1119, 0.1185, 0.1252, 0.1811,
    0.2373, 0.2863, 0.3353, 0.3843, 0.4939, 0.6261, 0.7706, 0.9176,
  ],
  blue: [
    0.1059, 0.1142, 0.1226, 0.1309, 0.1393, 0.1477, 0.156, 0.1644, 0.2246,
    0.2843, 0.3333, 0.3824, 0.4314, 0.5361, 0.657, 0.7838, 0.9098,
  ],
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
