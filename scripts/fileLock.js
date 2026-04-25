#!/usr/bin/env node

/**
 * File Lock System for Parallel Agent Execution
 * 
 * Prevents multiple agents from working on the same files simultaneously.
 * Uses lock files to coordinate access.
 * 
 * Usage: 
 *   node scripts/fileLock.js lock <TASK_ID> <FILE1> <FILE2> ...
 *   node scripts/fileLock.js unlock <TASK_ID> <FILE1> <FILE2> ...
 *   node scripts/fileLock.js status
 */

const fs = require('fs');
const path = require('path');

const LOCK_DIR = path.join(process.cwd(), '.locks');
const LOCK_TIMEOUT = 30 * 60 * 1000; // 30 minutes

if (!fs.existsSync(LOCK_DIR)) {
  fs.mkdirSync(LOCK_DIR, { recursive: true });
}

function getLockFile(filePath) {
  return path.join(LOCK_DIR, `${filePath.replace(/[\/\\]/g, '_')}.lock`);
}

function isLockExpired(lockFile) {
  if (!fs.existsSync(lockFile)) return true;
  
  const lockTime = parseInt(fs.readFileSync(lockFile, 'utf8'));
  return Date.now() - lockTime > LOCK_TIMEOUT;
}

function getLockInfo(lockFile) {
  if (!fs.existsSync(lockFile)) return null;
  
  const content = fs.readFileSync(lockFile, 'utf8');
  const [taskId, timestamp] = content.split(':');
  
  return {
    taskId,
    timestamp: parseInt(timestamp),
    age: Date.now() - parseInt(timestamp),
    expired: Date.now() - parseInt(timestamp) > LOCK_TIMEOUT
  };
}

function lockFiles(taskId, files) {
  console.log(`🔒 Locking files for task ${taskId}...`);
  
  const lockedFiles = [];
  const conflicts = [];
  
  for (const file of files) {
    const lockFile = getLockFile(file);
    
    // Check if lock exists and is not expired
    if (fs.existsSync(lockFile) && !isLockExpired(lockFile)) {
      const lockInfo = getLockInfo(lockFile);
      conflicts.push({
        file,
        lockedBy: lockInfo.taskId,
        age: Math.round(lockInfo.age / 1000 / 60) // minutes
      });
      continue;
    }
    
    // Create lock
    const lockContent = `${taskId}:${Date.now()}`;
    fs.writeFileSync(lockFile, lockContent);
    lockedFiles.push(file);
    
    console.log(`  🔒 Locked: ${file}`);
  }
  
  if (conflicts.length > 0) {
    console.log(`\n❌ FILE LOCK CONFLICTS:`);
    conflicts.forEach(conflict => {
      console.log(`  📄 ${conflict.file} (locked by ${conflict.lockedBy} for ${conflict.age}min)`);
    });
    
    // Unlock any files we did lock
    unlockFiles(taskId, lockedFiles);
    
    console.log(`\n🔓 Released locks for ${lockedFiles.length} files`);
    process.exit(1);
  }
  
  console.log(`✅ Successfully locked ${lockedFiles.length} files`);
  return lockedFiles;
}

function unlockFiles(taskId, files) {
  console.log(`🔓 Unlocking files for task ${taskId}...`);
  
  let unlockedCount = 0;
  
  for (const file of files) {
    const lockFile = getLockFile(file);
    
    if (fs.existsSync(lockFile)) {
      const lockInfo = getLockInfo(lockFile);
      
      // Only unlock if we own it or it's expired
      if (lockInfo.taskId === taskId || lockInfo.expired) {
        fs.unlinkSync(lockFile);
        unlockedCount++;
        console.log(`  🔓 Unlocked: ${file}`);
      } else {
        console.log(`  ⚠️  Skipping: ${file} (locked by ${lockInfo.taskId})`);
      }
    }
  }
  
  console.log(`✅ Unlocked ${unlockedCount} files`);
}

function showStatus() {
  console.log(`📋 File Lock Status:`);
  
  if (!fs.existsSync(LOCK_DIR)) {
    console.log(`  ℹ️  No lock directory found`);
    return;
  }
  
  const lockFiles = fs.readdirSync(LOCK_DIR);
  
  if (lockFiles.length === 0) {
    console.log(`  ℹ️  No active locks`);
    return;
  }
  
  console.log(`  📊 Active locks: ${lockFiles.length}`);
  
  lockFiles.forEach(lockFile => {
    const lockPath = path.join(LOCK_DIR, lockFile);
    const lockInfo = getLockInfo(lockPath);
    
    if (lockInfo) {
      const status = lockInfo.expired ? '🔴 EXPIRED' : '🟢 ACTIVE';
      const age = Math.round(lockInfo.age / 1000 / 60);
      const originalFile = lockFile.replace('.lock', '').replace(/_/g, '/');
      
      console.log(`  ${status} ${originalFile}`);
      console.log(`    Task: ${lockInfo.taskId}, Age: ${age}min`);
    }
  });
}

function cleanupExpired() {
  console.log(`🧹 Cleaning up expired locks...`);
  
  if (!fs.existsSync(LOCK_DIR)) return;
  
  const lockFiles = fs.readdirSync(LOCK_DIR);
  let cleanedCount = 0;
  
  lockFiles.forEach(lockFile => {
    const lockPath = path.join(LOCK_DIR, lockFile);
    
    if (isLockExpired(lockPath)) {
      fs.unlinkSync(lockPath);
      cleanedCount++;
    }
  });
  
  console.log(`✅ Cleaned up ${cleanedCount} expired locks`);
}

// CLI interface
const command = process.argv[2];
const taskId = process.argv[3];
const files = process.argv.slice(4);

switch (command) {
  case 'lock':
    if (!taskId || files.length === 0) {
      console.error('❌ Usage: node scripts/fileLock.js lock <TASK_ID> <FILE1> <FILE2> ...');
      process.exit(1);
    }
    cleanupExpired();
    lockFiles(taskId, files);
    break;
    
  case 'unlock':
    if (!taskId || files.length === 0) {
      console.error('❌ Usage: node scripts/fileLock.js unlock <TASK_ID> <FILE1> <FILE2> ...');
      process.exit(1);
    }
    unlockFiles(taskId, files);
    break;
    
  case 'status':
    cleanupExpired();
    showStatus();
    break;
    
  case 'cleanup':
    cleanupExpired();
    break;
    
  default:
    console.log(`File Lock System v1.0.0`);
    console.log(``);
    console.log(`Usage:`);
    console.log(`  node scripts/fileLock.js lock <TASK_ID> <FILE1> <FILE2> ...`);
    console.log(`  node scripts/fileLock.js unlock <TASK_ID> <FILE1> <FILE2> ...`);
    console.log(`  node scripts/fileLock.js status`);
    console.log(`  node scripts/fileLock.js cleanup`);
    break;
}
