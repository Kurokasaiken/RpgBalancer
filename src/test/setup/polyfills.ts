// Polyfills required by the KS-081 unit suite
// Keep implementations minimal/deterministic for Node test runs.

if (typeof globalThis.structuredClone !== 'function') {
  const structuredClonePolyfill = <T>(value: T): T => {
    if (value === null || typeof value !== 'object') {
      return value;
    }

    if (value instanceof Date) {
      return new Date(value.getTime()) as T;
    }

    if (Array.isArray(value)) {
      return value.map((item) => structuredClonePolyfill(item)) as T;
    }

    const cloned: Record<PropertyKey, unknown> = {};
    for (const [key, val] of Object.entries(value as Record<PropertyKey, unknown>)) {
      cloned[key] = structuredClonePolyfill(val);
    }
    return cloned as T;
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  globalThis.structuredClone = structuredClonePolyfill as any;
}

// jsdom does not implement window.matchMedia; components that read viewport
// breakpoints (useMediaQuery/useMobileFit) would crash the render. A fixed
// matches:false stub is deterministic for the unit suite.
if (typeof window !== 'undefined' && typeof window.matchMedia !== 'function') {
  window.matchMedia = ((query: string): MediaQueryList => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => undefined,
    removeListener: () => undefined,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
    dispatchEvent: () => false,
  })) as typeof window.matchMedia;
}
