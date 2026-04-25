#!/usr/bin/env python3
"""
Script per aggiungere nuovi prompt al Kanban da file JSON.
Formato JSON atteso:
[
  {
    "id": "NP-XXX",
    "title": "Titolo",
    "dependencies": "dep1, dep2",
    "body": "corpo del prompt completo"
  }
]
"""
import json
import sys
from pathlib import Path
from datetime import datetime

KANBAN = Path(__file__).parent.parent.parent / "src/docs/docs/coordinator/agent_assignments.md"

def add_prompts(prompts_file):
    # Leggi prompts da JSON
    with open(prompts_file, 'r', encoding='utf-8') as f:
        prompts = json.load(f)
    
    # Leggi Kanban
    with open(KANBAN, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Backup
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    backup = KANBAN.parent / f"agent_assignments.backup-{timestamp}"
    with open(backup, 'w', encoding='utf-8') as f:
        f.write(content)
    
    # Trova posizione di inserimento (dopo header, prima del primo prompt)
    lines = content.split('\n')
    insert_pos = None
    for i, line in enumerate(lines):
        if line.startswith('| ') and '–' in line and not line.startswith('| ID'):
            insert_pos = i
            break
    
    if insert_pos is None:
        print("❌ Errore: non trovata posizione di inserimento")
        return
    
    # Genera righe per nuovi prompt
    new_lines = []
    for p in prompts:
        deps = p.get('dependencies', '-')
        row = f"| {p['id']} – {p['title']} | Non assegnato | - | - | {deps} |"
        body = f"\n```text\n{p['body']}\n```"
        new_lines.append(row)
        new_lines.append(body)
    
    # Inserisci
    result = lines[:insert_pos] + new_lines + lines[insert_pos:]
    
    # Salva
    with open(KANBAN, 'w', encoding='utf-8') as f:
        f.write('\n'.join(result))
    
    print(f"✅ Aggiunti {len(prompts)} prompt al Kanban")
    print(f"📋 IDs: {', '.join([p['id'] for p in prompts])}")
    print(f"💾 Backup: {backup.name}")

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print("Usage: python3 addNewPrompts.py <prompts.json>")
        sys.exit(1)
    
    add_prompts(sys.argv[1])
