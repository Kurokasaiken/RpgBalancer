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
