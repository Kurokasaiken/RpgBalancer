/**
 * Shared persistence utilities.
 * Currently only exposes a helper to detect whether the app
 * is running inside a Tauri runtime.
 */

declare global {
  interface Window {
    __TAURI__?: unknown;
    __TAURI_IPC__?: unknown;
  }
}

/**
 * Determines whether the current runtime exposes the Tauri bridge APIs.
 */
export const isTauriRuntime = (): boolean =>
  typeof window !== 'undefined' && (Boolean(window.__TAURI__) || Boolean(window.__TAURI_IPC__));
