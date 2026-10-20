/**
 * Renderer destroy options for every Pixi `Application` in the app.
 *
 * Never call `app.destroy(true)` (or `renderer.destroy(true)`): in Pixi 8 a bare `true` also
 * runs `GlobalResourceRegistry.release()`, which wipes process-wide pools — notably the batch pool —
 * that every other live `Application` shares. The world map (always alive on /game) then renders
 * a sprite whose batch was destroyed under it: `TypeError: Cannot read properties of null (reading 'ids')`
 * in the ticker, and the map stops drawing (R-226 follow-up, found when the quest window's DepthScene unmounted).
 * `{ removeView: true }` removes the canvas and leaves the shared pools alone.
 */
export const KEEP_GLOBAL_RESOURCES = { removeView: true } as const;
