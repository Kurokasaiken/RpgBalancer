/**
 * Creates an in-memory implementation of the Storage API compatible with
 * the browser `localStorage` contract. Useful for running persistence tests
 * and scripts in Node environments where `localStorage` is not available.
 *
 * @returns A Storage-compliant object backed by an internal Map.
 */
export function createMemoryStorage(): Storage {
  const store = new Map<string, string>();

  return {
    get length(): number {
      return store.size;
    },
    clear(): void {
      store.clear();
    },
    getItem(key: string): string | null {
      return store.has(key) ? store.get(key)! : null;
    },
    key(index: number): string | null {
      return Array.from(store.keys())[index] ?? null;
    },
    removeItem(key: string): void {
      store.delete(key);
    },
    setItem(key: string, value: string): void {
      store.set(key, value);
    },
  };
}
