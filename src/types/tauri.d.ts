declare module '@tauri-apps/api/fs' {
  export function readTextFile(path: string): Promise<string>;
  export function writeTextFile(path: string, contents: string | Uint8Array): Promise<void>;
}

declare module '@tauri-apps/api/path' {
  export function resolveResource(path: string): Promise<string>;
}

declare global {
  interface Window {
    __TAURI__?: Record<string, unknown>;
    __TAURI_IPC__?: unknown;
  }
}

export {};
