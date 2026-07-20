/**
 * Detect whether the current environment supports WebGL.
 *
 * This is intentionally defensive: missing Canvas or context is treated as
 * unsupported so the world surface can fall back to the DOM renderer.
 */
export function isWebGLSupported(): boolean {
  if (typeof document === 'undefined') return false;

  const canvas = document.createElement('canvas');
  const gl =
    canvas.getContext('webgl') ||
    canvas.getContext('experimental-webgl') ||
    canvas.getContext('webgl2') ||
    canvas.getContext('experimental-webgl2');

  return gl != null;
}
