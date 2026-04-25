import { cpSync, existsSync, mkdirSync, rmSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..', '..');

const source = path.resolve(projectRoot, 'node_modules', 'playwright-core', 'lib', 'vite', 'traceViewer');
const destinationRoot = path.resolve(projectRoot, 'playwright-report');
const destination = path.resolve(destinationRoot, 'trace');

if (!existsSync(source)) {
  throw new Error(`Cannot find Playwright trace viewer assets at ${source}. Did you run npm install?`);
}

if (!existsSync(destinationRoot)) {
  mkdirSync(destinationRoot, { recursive: true });
}

rmSync(destination, { recursive: true, force: true });
cpSync(source, destination, { recursive: true });

console.log(`[sync-trace-assets] Copied Playwright trace assets to ${destination}`);
