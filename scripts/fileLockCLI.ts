#!/usr/bin/env tsx

import { lockPromptFiles, unlockPromptFiles, auditActiveLocks } from './promptFileManager.js';

const [, , command, promptId, agent] = process.argv;

async function main() {
  try {
    switch (command) {
      case 'lock':
        if (!promptId || !agent) {
          console.error('Uso: npm run file:lock -- <PROMPT_ID> <AGENT>');
          process.exit(1);
        }
        await lockPromptFiles(promptId, agent);
        break;

      case 'unlock':
        if (!promptId) {
          console.error('Uso: npm run file:unlock -- <PROMPT_ID>');
          process.exit(1);
        }
        await unlockPromptFiles(promptId);
        break;

      case 'audit':
        await auditActiveLocks();
        break;

      default:
        console.error('Comandi disponibili: lock, unlock, audit');
        process.exit(1);
    }
  } catch (error) {
    console.error('Errore:', error);
    process.exit(1);
  }
}

main();
