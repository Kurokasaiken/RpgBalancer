declare module '@tauri-apps/api/fs' {
  export function readTextFile(path: string, options?: { dir?: string }): Promise<string>;
  export function writeTextFile(path: string, contents: string, options?: { dir?: string }): Promise<void>;
}

declare module '@tauri-apps/api/path' {
  export function resolveResource(resourcePath: string): Promise<string>;
  export function appDataDir(): Promise<string>;
}

interface FsDirEntry {
  name?: string;
  path: string;
  children?: FsDirEntry[];
}

declare module '@tauri-apps/plugin-fs' {
  export function exists(path: string): Promise<boolean>;
  export function mkdir(path: string, options?: { recursive?: boolean }): Promise<void>;
  export function writeTextFile(path: string, contents: string): Promise<void>;
  export function readTextFile(path: string): Promise<string>;
  export function remove(path: string, options?: { recursive?: boolean }): Promise<void>;
  export function readDir(path: string): Promise<FsDirEntry[]>;
}
