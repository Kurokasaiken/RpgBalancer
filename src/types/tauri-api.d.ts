declare module '@tauri-apps/api/fs' {
  export function readTextFile(path: string, options?: { dir?: string }): Promise<string>;
  export function writeTextFile(path: string, contents: string, options?: { dir?: string }): Promise<void>;
}

declare module '@tauri-apps/api/path' {
  export function resolveResource(resourcePath: string): Promise<string>;
}
