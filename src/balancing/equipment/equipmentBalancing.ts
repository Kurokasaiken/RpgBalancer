/**
 * Equipment Balancing Constants
 *
 * Central configuration for converting item stat power into equipment points.
 * All values are derived from NORMALIZED_WEIGHTS via calculateItemPower.
 */

export const EQUIPMENT_BASE_BUDGET = 10;

/** Each HP-equivalent of power costs this many equipment points. */
export const EQUIPMENT_POWER_TO_POINT_RATIO = 0.2;

export function calculateEquipmentCost(power: number): number {
  return Math.round(power * EQUIPMENT_POWER_TO_POINT_RATIO);
}
