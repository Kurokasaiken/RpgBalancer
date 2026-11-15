/**
 * Voce (HudRealVoce) runtime configuration — R-338.
 *
 * Config-first timing for the /game mount. Kept out of the shared
 * `gameFrameConfig` helper on purpose: that module sits inside the
 * import-closure of ~50 living-contract INVs, so appending to it trips
 * the sync gate for every unrelated task. A dedicated module keeps the
 * Voce timing local to its surface.
 */

import { z } from 'zod';

export const VoceConfigSchema = z.object({
  /**
   * Milliseconds after which an open plaque (bandiera) retires to the
   * persistent bust. A bust click or a new message brings it back —
   * the bandiera only stays while it has something to say (R-338).
   */
  autoCloseMs: z.number().nonnegative(),
});
export type VoceConfig = z.infer<typeof VoceConfigSchema>;

export const VOCE_CONFIG: VoceConfig = VoceConfigSchema.parse({
  autoCloseMs: 15000,
});
