#!/bin/bash

# Auto-commit script: esegue commit ogni 2 ore senza spegnimento
# Usa il Guardian per recovery ma non spegne il sistema

set -euo pipefail

INTERVAL_MINUTES=${INTERVAL_MINUTES:-120}
BRANCH=${BRANCH:-$(git rev-parse --abbrev-ref HEAD)}

log() {
  echo "[$(date '+%H:%M:%S')] $1"
}

run_guardian() {
  local stage="$1"
  shift || true
  local timestamp
  timestamp=$(date '+%Y%m%d-%H%M%S')
  local log_path="test-results/auto-commit-guardian/${timestamp}-${stage}.log"
  mkdir -p "$(dirname "$log_path")"
  log "Guardian: eseguo recovery per ${stage}..."
  node scripts/autoCommit/commitFailureMonitor.js \
    --stage "$stage" \
    --branch "$BRANCH" \
    --log "$log_path" \
    "$@" || {
    log "Guardian recovery fallito per ${stage} - continuo senza spegnere"
    return 1
  }
  log "Guardian recovery completato per ${stage}"
  return 0
}

print_change_summary() {
  log "git status -sb:"
  git status -sb || true
  log "git diff --stat:"
  git diff --stat --summary --ignore-submodules HEAD || true
}

generate_commit_message() {
  python3 <<'PY'
import fnmatch
import os
import subprocess
import sys

LIMIT = 3
DOC_PATTERNS = [
    "docs/*", "*/docs/*", "*.md", "*.mdx", "*.rst", "*.txt",
    "*.adoc", "*.markdown", "README*", "CHANGELOG*", "LICENSE*", "CONTRIBUTING*",
]

def run_lines(command: str):
    result = subprocess.run(command, shell=True, capture_output=True, text=True)
    if result.returncode != 0:
        return []
    return [line for line in result.stdout.splitlines() if line.strip()]

def normalize_path(raw: str) -> str:
    if " -> " in raw:
        raw = raw.split(" -> ", 1)[1]
    return raw.lstrip("./").strip()

def is_doc(path: str) -> bool:
    for pattern in DOC_PATTERNS:
        if fnmatch.fnmatch(path, pattern):
            return True
    return False

def action_for(status: str) -> str:
    if status.startswith("A") or status == "??":
        return "add"
    if status.startswith("D"):
        return "remove"
    if status.startswith("R"):
        return "rename"
    if status.startswith("C"):
        return "copy"
    return "update"

status_lines = run_lines("git status --porcelain")
if not status_lines:
    print("auto: maintenance")
    sys.exit(0)

file_actions = {}
for entry in status_lines:
    status = entry[:2].strip()
    path = normalize_path(entry[3:])
    if not path:
        continue
    file_actions[path] = action_for(status)

def accumulate(command: str):
    counts = {}
    result = subprocess.run(command, shell=True, capture_output=True, text=True)
    if result.returncode != 0:
        return counts
    for line in result.stdout.splitlines():
        parts = line.split("\t")
        if len(parts) != 3:
            continue
        add, delete, path = parts
        if path in ("", "-"):
            continue
        add = 0 if add == "-" else int(add)
        delete = 0 if delete == "-" else int(delete)
        total = add + delete
        if total == 0:
            continue
        path = path.lstrip("./")
        counts[path] = counts.get(path, 0) + total
    return counts

counts = accumulate("git diff --numstat --ignore-submodules HEAD")
staged = accumulate("git diff --numstat --ignore-submodules --cached HEAD")
for path, value in staged.items():
    counts[path] = counts.get(path, 0) + value

code_counts = {}
doc_counts = {}
for path, value in counts.items():
    if is_doc(path):
        doc_counts[path] = doc_counts.get(path, 0) + value
    else:
        code_counts[path] = code_counts.get(path, 0) + value

def pick_top(source):
    return sorted(source.items(), key=lambda item: (-item[1], item[0]))[:LIMIT]

top_files = [path for path, _ in pick_top(code_counts)]
if len(top_files) < LIMIT:
    top_files.extend(
        [path for path, _ in pick_top(doc_counts) if path not in top_files]
    )

if not top_files:
    for entry in status_lines:
        path = normalize_path(entry[3:])
        if path:
            top_files.append(path)
        if len(top_files) >= LIMIT:
            break

def humanize(path: str) -> str:
    base = os.path.basename(path)
    base = os.path.splitext(base)[0]
    return base.replace("_", " ").replace("-", " ")

summary = []
for path in top_files:
    if not path:
        continue
    action = file_actions.get(path, "update")
    summary.append(f"{action} {humanize(path)}")
    if len(summary) >= LIMIT:
        break

if not summary:
    summary.append("update repository")

message = "auto: " + "; ".join(summary)
remaining = max(len(status_lines) - LIMIT, 0)
if remaining > 0:
    message += f" (+{remaining} more files)"

print(message)
PY
}

log "Auto-commit watcher attivo: ogni ${INTERVAL_MINUTES} minuti eseguo commit su ${BRANCH}."
log "Nota: questo script NON esegue push e NON spegne il sistema."

while true; do
  if git diff --quiet --ignore-submodules HEAD && git diff --quiet --ignore-submodules --cached; then
    log "Nessuna modifica da committare. Salto il ciclo."
  else
    log "Modifiche rilevate. Avvio commit..."
    print_change_summary
    commit_msg=$(generate_commit_message)
    log "Commit message generato: ${commit_msg}"
    git add -A
    if git commit -m "${commit_msg}"; then
      log "Commit completato."
    else
      log "Commit fallito. Invoco Guardian..."
      if run_guardian commit --commit-message "${commit_msg}"; then
        log "Guardian recovery succeeded"
      else
        log "Guardian recovery failed - continuo senza spegnere"
      fi
    fi
  fi

  log "Riposo per ${INTERVAL_MINUTES} minuti..."
  sleep $((INTERVAL_MINUTES * 60))
done
