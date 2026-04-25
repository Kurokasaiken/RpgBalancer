export async function resolveResource(relativePath: string): Promise<string> {
  if (relativePath.startsWith('../')) {
    return new URL(relativePath, `file://${process.cwd()}/src-tauri/`).pathname;
  }
  return new URL(relativePath, `file://${process.cwd()}/`).pathname;
}
