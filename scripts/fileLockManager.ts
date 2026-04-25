import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

interface FileLock {
  filePath: string;
  promptId: string;
  agent: string;
  timestamp: number;
  expiresAt: number;
}

interface FileLockWarning {
  filePath: string;
  lockedBy: string;
  promptId: string;
  timeRemaining: string;
}

const FILE_LOCKS_PATH = path.resolve(
  'src',
  'docs',
  'docs',
  'coordinator',
  'file_locks.json'
);

const LOCK_DURATION_MS = 2 * 60 * 60 * 1000; // 2 ore

async function loadFileLocks(): Promise<FileLock[]> {
  try {
    const raw = await readFile(FILE_LOCKS_PATH, 'utf8');
    return JSON.parse(raw) as FileLock[];
  } catch {
    return [];
  }
}

async function saveFileLocks(locks: FileLock[]): Promise<void> {
  await writeFile(FILE_LOCKS_PATH, JSON.stringify(locks, null, 2));
}

function cleanExpiredLocks(locks: FileLock[]): FileLock[] {
  const now = Date.now();
  return locks.filter(lock => lock.expiresAt > now);
}

function formatTimeRemaining(ms: number): string {
  const hours = Math.floor(ms / (1000 * 60 * 60));
  const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}

/**
 * Lock file per un prompt specifico
 */
export async function lockFilesForPrompt(
  promptId: string,
  agent: string,
  filePaths: string[]
): Promise<void> {
  const locks = await loadFileLocks();
  const now = Date.now();
  
  // Rimuovi lock esistenti per lo stesso prompt
  const filteredLocks = locks.filter(lock => lock.promptId !== promptId);
  
  // Aggiungi nuovi lock
  const newLocks: FileLock[] = filePaths.map(filePath => ({
    filePath: path.resolve(filePath),
    promptId,
    agent,
    timestamp: now,
    expiresAt: now + LOCK_DURATION_MS
  }));
  
  await saveFileLocks([...filteredLocks, ...newLocks]);
}

/**
 * Rimuovi lock per un prompt specifico
 */
export async function unlockFilesForPrompt(promptId: string): Promise<void> {
  const locks = await loadFileLocks();
  const filteredLocks = locks.filter(lock => lock.promptId !== promptId);
  await saveFileLocks(filteredLocks);
}

/**
 * Controlla se ci sono conflitti con file lock esistenti
 */
export async function checkFileLockConflicts(
  promptId: string,
  filePaths: string[]
): Promise<FileLockWarning[]> {
  const locks = await loadFileLocks();
  const cleanedLocks = cleanExpiredLocks(locks);
  
  // Salva lock puliti
  if (cleanedLocks.length !== locks.length) {
    await saveFileLocks(cleanedLocks);
  }
  
  const conflicts: FileLockWarning[] = [];
  
  for (const filePath of filePaths) {
    const absolutePath = path.resolve(filePath);
    const existingLock = cleanedLocks.find(lock => lock.filePath === absolutePath);
    
    if (existingLock && existingLock.promptId !== promptId) {
      const timeRemaining = existingLock.expiresAt - Date.now();
      
      conflicts.push({
        filePath: absolutePath,
        lockedBy: existingLock.agent,
        promptId: existingLock.promptId,
        timeRemaining: formatTimeRemaining(timeRemaining)
      });
    }
  }
  
  return conflicts;
}

/**
 * Estrai file target da un prompt text
 */
export function extractFileTargets(promptText: string): string[] {
  const fileTargetMatch = promptText.match(/FILE TARGET:\s*(.+?)(?=\n\n|\n[A-Z]|\n#|$)/s);
  if (!fileTargetMatch) {
    return [];
  }
  
  const targetsText = fileTargetMatch[1].trim();
  return targetsText.split(',').map(target => target.trim()).filter(target => target.length > 0);
}

/**
 * Formatta warning per output CLI
 */
export function formatFileLockWarnings(warnings: FileLockWarning[]): string {
  if (warnings.length === 0) {
    return '';
  }
  
  let output = '\n⚠️  File Lock Warnings:\n';
  
  for (const warning of warnings) {
    const relativePath = path.relative(process.cwd(), warning.filePath);
    output += `    - ${relativePath} (locked by ${warning.lockedBy} in ${warning.promptId}, expires in ${warning.timeRemaining})\n`;
  }
  
  output += '\nPuoi procedere, ma fai attenzione ai possibili conflitti.\n';
  
  return output;
}
