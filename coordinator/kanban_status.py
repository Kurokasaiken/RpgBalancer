#!/usr/bin/env python3
"""
Kanban Status Parser
Parses agent_assignments.md and generates formatted status report.
"""

import re
from datetime import datetime
from typing import List, Dict, Optional

# Configuration
TODAY = datetime(2026, 7, 15)
ORPHAN_THRESHOLD_DAYS = 30
MAX_ID_LENGTH = 45

# Status emoji mapping
STATUS_EMOJI = {
    "Completato": "🟢",
    "In corso": "🟡",
    "Non assegnato": "⬜",
    "Bloccato": "🔴",
    "Archiviato": "📦",
    "Assegnato": "🟡",  # Treat Assegnato as In corso
}

def parse_date(date_str: str) -> Optional[datetime]:
    """Parse various date formats."""
    if not date_str or date_str.strip() == "-" or date_str.strip() == "":
        return None
    
    date_str = date_str.strip()
    
    # Try ISO format: 2026-07-15T09:42:56.117Z
    try:
        # Remove Z and parse
        clean = date_str.replace("Z", "")
        return datetime.fromisoformat(clean)
    except ValueError:
        pass
    
    # Try YYYY-MM-DD format
    try:
        return datetime.strptime(date_str, "%Y-%m-%d")
    except ValueError:
        pass
    
    # Try other common formats
    formats = [
        "%Y-%m-%d %H:%M:%S",
        "%d/%m/%Y",
        "%m/%d/%Y",
    ]
    
    for fmt in formats:
        try:
            return datetime.strptime(date_str, fmt)
        except ValueError:
            continue
    
    return None

def format_date(date_str: str) -> str:
    """Format date string for display."""
    if not date_str or date_str.strip() == "-" or date_str.strip() == "":
        return "N/A"
    
    # If it's an ISO format with T, truncate to YYYY-MM-DD
    if "T" in date_str:
        return date_str.split("T")[0]
    
    # Otherwise return as-is but truncate if too long
    return date_str[:10] if len(date_str) > 10 else date_str

def calculate_age(start_date: Optional[datetime]) -> str:
    """Calculate age in days from start date to today."""
    if not start_date:
        return "N/A"
    
    delta = TODAY - start_date
    days = delta.days
    
    # If date is in the future, show 0
    if days < 0:
        return "0"
    
    return str(days)

def parse_markdown_table(file_path: str) -> List[Dict]:
    """Parse markdown table from agent_assignments.md."""
    tasks = []
    
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Split by table rows (lines starting with |)
    lines = content.split('\n')
    
    for line in lines:
        line = line.strip()
        
        # Skip empty lines and comments
        if not line or line.startswith("<!--") or line.startswith("#"):
            continue
        
        # Skip separator row (contains only |, -, :, and spaces)
        if re.match(r'^\|[\s\-:]+\|$', line):
            continue
        
        # Skip header rows (contain common header words)
        header_keywords = ["Prompt ID", "Descrizione", "Stato", "Data", "Agente", "Note", "Dipende"]
        if any(keyword.lower() in line.lower() for keyword in header_keywords):
            continue
        
        # Parse table row
        if line.startswith("|") and line.endswith("|"):
            # Split by | and remove empty first/last elements
            parts = [p.strip() for p in line.split("|")]
            parts = [p for p in parts if p]
            
            # Need at least 3 parts to be valid
            if len(parts) < 3:
                continue
            
            # Try to detect column order by looking at content
            # Common patterns:
            # 1: ID | Status | Agent | Date | Note
            # 2: ID | Status | Date | Agent | Note
            
            task = {
                "id": parts[0],
                "status": "",
                "data": "",
                "agent": "",
                "note": "",
                "executor": "",
                "executor_reason": "",
                "prompt": "",
            }
            
            # Detect status column (second position usually)
            status_candidate = parts[1] if len(parts) > 1 else ""
            task["status"] = clean_status(status_candidate)
            
            # Try to detect date column (look for date patterns)
            date_col = -1
            agent_col = -1
            note_col = -1
            
            for i, part in enumerate(parts):
                if parse_date(part):
                    date_col = i
                elif part.lower() in ["cascade", "harness", "agent", "executioner", "manual"]:
                    agent_col = i
                elif i > 1 and "evidence" in part.lower() or "test-results" in part.lower():
                    note_col = i
            
            # If we found a date, use it
            if date_col >= 0:
                task["data"] = parts[date_col]
            elif len(parts) > 2:
                # Fallback: assume third column is date
                task["data"] = parts[2]
            
            # If we found an agent, use it
            if agent_col >= 0:
                task["agent"] = parts[agent_col]
            elif len(parts) > 3:
                # Fallback: assume fourth column is agent
                task["agent"] = parts[3]
            
            # Note is usually the column after agent
            if note_col >= 0:
                task["note"] = parts[note_col]
            elif len(parts) > 4:
                task["note"] = parts[4]
            
            # Parse date
            task["start_date"] = parse_date(task["data"])
            task["age"] = calculate_age(task["start_date"])
            
            # Extract dependencies from note
            dependencies = extract_dependencies(task["note"])
            task["dependencies"] = dependencies
            
            # Only add if it looks like a real task (has valid ID and status)
            if task["id"] and task["status"] and task["id"] != "---":
                tasks.append(task)
    
    return tasks

def clean_status(status: str) -> str:
    """Clean status value to standard format."""
    if not status:
        return status
    
    status = status.strip()
    
    # If status contains extra info, extract just the status
    # e.g., "Archiviato - orfano pre-luglio 2026" -> "Archiviato"
    for standard_status in ["Completato", "In corso", "Non assegnato", "Bloccato", "Archiviato", "Assegnato"]:
        if standard_status in status:
            return standard_status
    
    return status

def extract_dependencies(note: str) -> List[str]:
    """Extract task IDs from note that look like dependencies."""
    if not note:
        return []
    
    # Look for patterns like RT-POI-S-001, CR-002, etc.
    # Usually in format: XXX-### or XXX-###-###
    pattern = r'\b[A-Z]{2,}-\d+(?:-\d+)?\b'
    matches = re.findall(pattern, note)
    
    # Filter out common non-dependency patterns
    exclude = {"TEST", "LOG", "EVIDENCE", "HTTP", "HTTPS"}
    dependencies = [m for m in matches if not any(x in m.upper() for x in exclude)]
    
    return dependencies

def format_id(id_str: str) -> str:
    """Truncate ID to max length if needed."""
    if len(id_str) > MAX_ID_LENGTH:
        return id_str[:MAX_ID_LENGTH-3] + "..."
    return id_str

def get_status_emoji(status: str) -> str:
    """Get emoji for status."""
    return STATUS_EMOJI.get(status, "❓")

def is_orphan(task: Dict) -> bool:
    """Check if task is an orphan (In corso > 30 days)."""
    status = task["status"].lower()
    if status not in ["in corso", "assegnato"]:
        return False
    
    try:
        age = int(task["age"])
        return age > ORPHAN_THRESHOLD_DAYS
    except (ValueError, TypeError):
        return False

def check_dependencies_satisfied(task: Dict, all_tasks: Dict[str, Dict]) -> bool:
    """Check if all dependencies are satisfied (Completato)."""
    if not task["dependencies"]:
        return True
    
    for dep_id in task["dependencies"]:
        dep_task = all_tasks.get(dep_id)
        if not dep_task:
            # Dependency not found in tasks
            return False
        if dep_task["status"].lower() != "completato":
            return False
    
    return True

def print_table(tasks: List[Dict]):
    """Print formatted table."""
    # Build task lookup for dependency checking
    task_lookup = {t["id"]: t for t in tasks}
    
    # Column widths
    id_width = MAX_ID_LENGTH
    status_width = 12
    agent_width = 12
    date_width = 12
    age_width = 6
    deps_width = 25
    
    # Print header
    header = f"{'ID':<{id_width}} | {'STATUS':<{status_width}} | {'CANALE':<{agent_width}} | {'INIZIO':<{date_width}} | {'ETÀ':>{age_width}} | {'DIPENDENZE':<{deps_width}}"
    print(header)
    print("=" * (id_width + status_width + agent_width + date_width + age_width + deps_width + 15))
    
    # Print rows
    for task in tasks:
        id_str = format_id(task["id"])
        status = task["status"]
        emoji = get_status_emoji(status)
        agent = task["agent"][:agent_width-1] if task["agent"] else "-"
        data = format_date(task["data"])
        age = task["age"]
        
        # Check if orphan
        orphan_marker = " [ORFANO]" if is_orphan(task) else ""
        
        # Format dependencies
        deps = ", ".join(task["dependencies"][:2])
        if len(task["dependencies"]) > 2:
            deps += f" (+{len(task['dependencies'])-2})"
        if not deps:
            deps = "-"
        
        row = f"{id_str:<{id_width}} | {emoji} {status:<10} | {agent:<{agent_width}} | {data:<{date_width}} | {age:>{age_width}} | {deps:<{deps_width}}{orphan_marker}"
        print(row)
    
    print()

def print_summary(tasks: List[Dict]):
    """Print summary sections."""
    task_lookup = {t["id"]: t for t in tasks}
    
    # Count by status
    status_counts = {}
    for task in tasks:
        status = task["status"]
        status_counts[status] = status_counts.get(status, 0) + 1
    
    print("=== RIEPILOGO ===")
    for status, count in sorted(status_counts.items()):
        emoji = get_status_emoji(status)
        print(f"{emoji} {status}: {count}")
    print()
    
    # Orphans
    orphans = [t for t in tasks if is_orphan(t)]
    print(f"=== ORFANI PROBABILI ({len(orphans)}) ===")
    for task in orphans:
        print(f"  - {task['id']}: {task['age']} giorni")
    print()
    
    # Blocked tasks
    blocked = [t for t in tasks if t["status"].lower() == "bloccato"]
    print(f"=== BLOCCATI ({len(blocked)}) ===")
    for task in blocked:
        deps_satisfied = check_dependencies_satisfied(task, task_lookup)
        status = "✓ Dipendenze OK" if deps_satisfied else "✗ Dipendenze non soddisfatte"
        print(f"  - {task['id']}: {status}")
        if task["dependencies"]:
            print(f"    Dipendenze: {', '.join(task['dependencies'])}")
    print()
    
    # Unassigned ready
    unassigned = [t for t in tasks if t["status"].lower() == "non assegnato"]
    unassigned_ready = [t for t in unassigned if check_dependencies_satisfied(t, task_lookup)]
    print(f"=== NON ASSEGNATI PRONTI ({len(unassigned_ready)}) ===")
    for task in unassigned_ready:
        print(f"  - {task['id']}")
    print()
    
    # Unassigned blocked
    unassigned_blocked = [t for t in unassigned if not check_dependencies_satisfied(t, task_lookup)]
    print(f"=== NON ASSEGNATI BLOCCATI ({len(unassigned_blocked)}) ===")
    for task in unassigned_blocked:
        print(f"  - {task['id']}")
        if task["dependencies"]:
            # Show which dependencies are not satisfied
            unsatisfied = []
            for dep_id in task["dependencies"]:
                dep_task = task_lookup.get(dep_id)
                if not dep_task or dep_task["status"].lower() != "completato":
                    status = dep_task["status"] if dep_task else "NON TROVATO"
                    unsatisfied.append(f"{dep_id} ({status})")
            print(f"    Dipendenze non soddisfatte: {', '.join(unsatisfied)}")
    print()

def main():
    """Main entry point."""
    file_path = "src/docs/docs/coordinator/agent_assignments.md"
    
    print(f"Kanban Status Report - {TODAY.strftime('%Y-%m-%d')}")
    print(f"File: {file_path}")
    print()
    
    tasks = parse_markdown_table(file_path)
    
    if not tasks:
        print("No tasks found.")
        return
    
    print(f"Total tasks: {len(tasks)}")
    print()
    
    print_table(tasks)
    print_summary(tasks)

if __name__ == "__main__":
    main()
