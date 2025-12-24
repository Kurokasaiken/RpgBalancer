import { promises as fsp } from 'fs';

const memoryStore = new Map<string, string>();

export const __mockFsStore = memoryStore;

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
