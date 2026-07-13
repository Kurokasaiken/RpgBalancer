import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const configPath = path.resolve(__dirname, 'i18next-parser.config.mjs');
const cliPath = path.resolve(__dirname, '../../node_modules/i18next-parser/bin/cli.js');

function extractKeys(): void {
  console.log(`Extracting i18n keys using ${path.relative(process.cwd(), configPath)}...`);
  execFileSync('node', [cliPath, '-c', configPath], { stdio: 'inherit' });
  console.log('Key extraction complete.');
}

extractKeys();
