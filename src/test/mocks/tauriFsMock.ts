import { promises as fsp } from 'fs';

const memoryStore = new Map<string, string>();

export const __mockFsStore = memoryStore;

type MkdirOptions = {
  recursive?: boolean;
};

export async function exists(path: string): Promise<boolean> {
  if (memoryStore.has(path)) {
    return true;
  }
  try {
    await fsp.access(path);
    return true;
  } catch {
    return false;
  }
}

export async function mkdir(path: string, options?: MkdirOptions): Promise<void> {
  // The in-memory store does not need explicit directory creation,
  // but we mimic the API for compatibility with getFsHelpers caching.
  try {
    await fsp.mkdir(path, { recursive: options?.recursive ?? false });
  } catch {
    // Ignore mkdir errors in tests; directories may already exist.
  }
}

export async function readTextFile(path: string): Promise<string> {
  if (memoryStore.has(path)) {
    return memoryStore.get(path)!;
  }
  return fsp.readFile(path, 'utf8');
}

export async function writeTextFile(path: string, contents: string | Uint8Array): Promise<void> {
  const data = typeof contents === 'string' ? contents : Buffer.from(contents).toString('utf8');
  memoryStore.set(path, data);
}

export async function remove(path: string): Promise<void> {
  memoryStore.delete(path);
  try {
    await fsp.rm(path, { force: true });
  } catch {
    // ignore
  }
}

interface MockDirEntry {
  name?: string;
}

export async function readDir(path: string): Promise<MockDirEntry[]> {
  const prefix = path.endsWith('/') ? path : `${path}/`;
  const entries: MockDirEntry[] = [];
  for (const key of memoryStore.keys()) {
    if (key.startsWith(prefix)) {
      const relative = key.slice(prefix.length);
      const [name] = relative.split('/');
      if (name) {
        entries.push({ name });
      }
    }
  }
  return entries;
}
