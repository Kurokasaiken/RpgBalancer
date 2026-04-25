#!/usr/bin/env python3
"""
Script per rimuovere prompt bloccati dal Kanban.
Rimuove prompt "Non assegnato" con dipendenze non risolte.
"""

import re
import sys
from pathlib import Path
from typing import Optional, Tuple

# Lista prompt da rimuovere (dipendenze non risolte)
BLOCKED_PROMPTS = {
    # Dipendenti da E2E-VRT-001
    "NP-078", "NP-081", "NP-082", "NP-084", "NP-091", "NP-095", "NP-112", "NP-120",
    # Dipendenti da GT-3
    "NP-089", "NP-107", "NP-117",
    # Dipendenti da PC-M3
    "NP-126", "NP-137", "NP-158",
    # Dipendenti da WS6.3-S2
    "NP-064", "NP-102", "NP-149", "NP-150", "NP-151",
    # Dipendenti da Phase 12 Map
    "NP-111", "NP-113", "NP-114", "NP-115", "NP-118", "NP-119",
    "NP-127", "NP-129", "NP-130", "NP-131", "NP-132", "NP-133",
    "NP-134", "NP-135", "NP-136", "NP-139", "NP-140"
}

def extract_prompt_info(line: str) -> Tuple[Optional[str], bool]:
    """Estrae ID e stato del prompt dalla riga della tabella.
    Returns: (prompt_id, is_non_assegnato)
    """
    match = re.match(r'\|\s*([A-Z]+-\d+|NP-\d+|GT-\d+|E2E-[A-Z]+-\d+)\s+–.*?\|\s*(Non assegnato|In corso|Completato)', line)
    if match:
        prompt_id = match.group(1)
        status = match.group(2)
        return (prompt_id, status == "Non assegnato")
    return (None, False)

def is_prompt_start(line: str) -> bool:
    """Verifica se la riga è l'inizio di un prompt."""
    return line.startswith('| ') and '–' in line and '|' in line[2:]

def is_prompt_end(line: str) -> bool:
    """Verifica se la riga è la fine di un prompt."""
    return line.strip() == '```'

def remove_blocked_prompts(input_path: Path, output_path: Path) -> dict:
    """Rimuove i prompt bloccati dal Kanban."""
    with open(input_path, 'r', encoding='utf-8') as f:
        lines = f.readlines()
    
    result = {
        'removed': [],
        'kept': [],
        'total_before': 0,
        'total_after': 0
    }
    
    new_lines = []
    in_prompt = False
    current_prompt_id = None
    current_prompt_lines = []
    skip_current = False
    
    for line in lines:
        # Inizio nuovo prompt
        if is_prompt_start(line):
            # Salva prompt precedente se non skippato
            if in_prompt and not skip_current:
                new_lines.extend(current_prompt_lines)
                result['kept'].append(current_prompt_id)
            elif in_prompt and skip_current:
                result['removed'].append(current_prompt_id)
            
            # Reset per nuovo prompt
            in_prompt = True
            prompt_id, is_non_assegnato = extract_prompt_info(line)
            current_prompt_id = prompt_id
            current_prompt_lines = [line]
            # Skippa solo se è "Non assegnato" E nella lista bloccati
            skip_current = (prompt_id in BLOCKED_PROMPTS and is_non_assegnato)
            result['total_before'] += 1
            
        # Dentro un prompt
        elif in_prompt:
            current_prompt_lines.append(line)
            
            # Fine prompt
            if is_prompt_end(line):
                # Salva se non skippato
                if not skip_current:
                    new_lines.extend(current_prompt_lines)
                    result['kept'].append(current_prompt_id)
                    result['total_after'] += 1
                else:
                    result['removed'].append(current_prompt_id)
                
                # Reset
                in_prompt = False
                current_prompt_id = None
                current_prompt_lines = []
                skip_current = False
        
        # Fuori dai prompt (header, separatori, ecc.)
        else:
            new_lines.append(line)
    
    # Salva ultimo prompt se presente
    if in_prompt and not skip_current:
        new_lines.extend(current_prompt_lines)
        result['kept'].append(current_prompt_id)
        result['total_after'] += 1
    elif in_prompt and skip_current:
        result['removed'].append(current_prompt_id)
    
    # Scrivi output
    with open(output_path, 'w', encoding='utf-8') as f:
        f.writelines(new_lines)
    
    return result

def main():
    base_path = Path(__file__).parent.parent.parent
    input_file = base_path / "src/docs/docs/coordinator/agent_assignments.md"
    output_file = input_file  # Sovrascrive l'originale
    
    # Backup
    backup_file = input_file.with_suffix('.md.backup-blocked')
    print(f"📦 Creazione backup: {backup_file.name}")
    with open(input_file, 'r', encoding='utf-8') as f:
        backup_content = f.read()
    with open(backup_file, 'w', encoding='utf-8') as f:
        f.write(backup_content)
    
    # Rimozione
    print(f"🔍 Analisi prompt bloccati...")
    result = remove_blocked_prompts(input_file, output_file)
    
    # Report
    print(f"\n✅ Rimozione completata!")
    print(f"   Prompt prima:  {result['total_before']}")
    print(f"   Prompt dopo:   {result['total_after']}")
    print(f"   Rimossi:       {len(result['removed'])}")
    print(f"\n📋 Prompt rimossi:")
    for prompt_id in sorted(result['removed']):
        print(f"   - {prompt_id}")
    
    # Verifica
    expected_removed = len(BLOCKED_PROMPTS)
    actual_removed = len(result['removed'])
    if actual_removed != expected_removed:
        print(f"\n⚠️  ATTENZIONE: Attesi {expected_removed} rimossi, trovati {actual_removed}")
        missing = BLOCKED_PROMPTS - set(result['removed'])
        if missing:
            print(f"   Prompt non trovati: {sorted(missing)}")
        return 1
    
    print(f"\n✨ Tutti i {actual_removed} prompt bloccati sono stati rimossi correttamente")
    return 0

if __name__ == "__main__":
    sys.exit(main())
