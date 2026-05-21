#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

class AuditLog {
  constructor() {
    this.logPath = path.join(process.cwd(), '.audit-log.json');
    this.logs = this.loadLogs();
  }

  loadLogs() {
    if (fs.existsSync(this.logPath)) {
      try {
        return JSON.parse(fs.readFileSync(this.logPath, 'utf8'));
      } catch (e) {
        return [];
      }
    }
    return [];
  }

  log(event) {
    const entry = {
      timestamp: new Date().toISOString(),
      ...event
    };

    this.logs.push(entry);
    this.saveLogs();
    return entry;
  }

  saveLogs() {
    fs.writeFileSync(
      this.logPath,
      JSON.stringify(this.logs, null, 2)
    );
  }

  getLog(filter) {
    return this.logs.filter(entry => {
      for (const key in filter) {
        if (entry[key] !== filter[key]) return false;
      }
      return true;
    });
  }

  report(action = null) {
    console.log('\n📋 Audit Log Report\n');

    let entries = this.logs;
    if (action) {
      entries = entries.filter(e => e.action === action);
    }

    if (entries.length === 0) {
      console.log('No audit entries found\n');
      return;
    }

    const grouped = {};
    for (const entry of entries) {
      const action = entry.action || 'unknown';
      if (!grouped[action]) grouped[action] = [];
      grouped[action].push(entry);
    }

    for (const [action, items] of Object.entries(grouped)) {
      console.log(`${action.toUpperCase()} (${items.length} events):`);
      items.slice(-5).reverse().forEach(item => {
        const { timestamp, ...rest } = item;
        console.log(`  ${timestamp}`);
      });
      console.log('');
    }
  }
}

function main() {
  const audit = new AuditLog();
  const args = process.argv.slice(2);
  const command = args[0];

  if (!command || command === 'report') {
    audit.report(args[1]);
  } else if (command === 'add') {
    const event = {
      action: args[1],
      component: args[2],
      author: args[3] || 'unknown'
    };
    const entry = audit.log(event);
    console.log(`✅ Audit entry added: ${entry.timestamp}`);
  } else if (command === 'clear') {
    audit.logs = [];
    audit.saveLogs();
    console.log('✅ Audit log cleared');
  } else {
    console.log('Usage:');
    console.log('  node scripts/audit-log.js report [action]');
    console.log('  node scripts/audit-log.js add <action> <component> <author>');
    console.log('  node scripts/audit-log.js clear');
  }
}

main();
