#!/usr/bin/env python3
import re
from pathlib import Path
from datetime import datetime

KANBAN = Path(__file__).parent.parent.parent / "src/docs/docs/coordinator/agent_assignments.md"

with open(KANBAN, 'r') as f:
    content = f.read()

# Backup
backup = KANBAN.parent / f"agent_assignments.backup-{datetime.now().strftime('%Y%m%d_%H%M%S')}"
with open(backup, 'w') as f:
    f.write(content)

# Rimuovi prompt completati
lines = content.split('\n')
result = []
skip = False
removed = []

for line in lines:
    if line.startswith('| ') and '–' in line and '| Completato |' in line:
        match = re.match(r'\|\s*([A-Z]+-\d+)', line)
        if match:
            removed.append(match.group(1))
            skip = True
            continue
    
    if skip and line.strip() == '```':
        skip = False
        continue
    
    if not skip:
        result.append(line)

# Salva
with open(KANBAN, 'w') as f:
    f.write('\n'.join(result))

print(f"✅ Rimossi {len(removed)} prompt completati")
print(f"📋 IDs: {', '.join(removed)}")
print(f"💾 Backup: {backup.name}")
