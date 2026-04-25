#!/bin/bash

# Auto-commit, push e shutdown: esegue commit, push ogni 2 cicli e spegne il PC
# Script completo con Guardian e spegnimento automatico

set -euo pipefail

INTERVAL_MINUTES=${INTERVAL_MINUTES:-60}
SESSION_TIMEOUT_MINUTES=${SESSION_TIMEOUT_MINUTES:-30}
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
  log "Avvio Auto-Commit Guardian (stage=${stage})..."
  node scripts/autoCommit/commitFailureMonitor.js \
    --stage "$stage" \
    --branch "$BRANCH" \
    --log "$log_path" \
    "$@"
  log "Guardian completato per stage ${stage}."
}

shutdown_system() {
  log "Session completed - initiating system shutdown..."
  # Create final session summary
  local final_log="test-results/auto-commit-guardian/$(date -u +%Y-%m-%dT%H:%M:%S)-session-complete.log"
  mkdir -p "$(dirname "$final_log")"
  {
    echo "=== GUARDIAN SESSION COMPLETE ==="
    echo "Timestamp: $(date -u +%Y-%m-%dT%H:%M:%S)"
    echo "Branch: ${BRANCH}"
    echo "Session Duration: ${SESSION_TIMEOUT_MINUTES} minutes"
    echo "Final Status: $1"
    echo "Shutdown Reason: $2"
    echo "================================"
  } > "$final_log"
  
  # Attempt graceful shutdown with unattended safety checks
  if command -v sudo >/dev/null 2>&1 && sudo -n true 2>/dev/null; then
    log "Executing unattended system shutdown..."
    sudo shutdown -h now 2>/dev/null || {
      log "Sudo shutdown failed - trying fallback methods"
    }
  fi
  
  # Fallback to non-interactive methods
  if command -v osascript >/dev/null 2>&1; then
    log "Fallback: using osascript for macOS shutdown..."
    osascript -e 'tell application "System Events" to shut down' 2>/dev/null || {
      log "osascript shutdown failed"
    }
  fi
  
  # Final fallback - log clearly and exit
  log "No unattended shutdown method available - session ended cleanly"
}

check_session_timeout() {
  local session_start
  # macOS compatible: use ps -o pid,etime instead of etimes
  session_start=$(ps -o pid,etime -p $$ | grep "^\s*$$\s" | awk '{print $2}' | tr -d ' ')
  # Convert etime format (DD-HH:MM:SS or HH:MM:SS or MM:SS) to seconds
  local elapsed_seconds=0
  if [[ "$session_start" =~ ^([0-9]+)-([0-9]+):([0-9]+):([0-9]+)$ ]]; then
    # Format: DD-HH:MM:SS
    elapsed_seconds=$(((${BASH_REMATCH[1]} * 86400) + (${BASH_REMATCH[2]} * 3600) + (${BASH_REMATCH[3]} * 60) + ${BASH_REMATCH[4]}))
  elif [[ "$session_start" =~ ^([0-9]+):([0-9]+):([0-9]+)$ ]]; then
    # Format: HH:MM:SS
    elapsed_seconds=$(((${BASH_REMATCH[1]} * 3600) + (${BASH_REMATCH[2]} * 60) + ${BASH_REMATCH[3]}))
  elif [[ "$session_start" =~ ^([0-9]+):([0-9]+)$ ]]; then
    # Format: MM:SS
    elapsed_seconds=$(((${BASH_REMATCH[1]} * 60) + ${BASH_REMATCH[2]}))
  else
    elapsed_seconds=0
  fi
  local elapsed_minutes=$((elapsed_seconds / 60))
  
  if (( elapsed_minutes >= SESSION_TIMEOUT_MINUTES )); then
    log "Session timeout reached (${elapsed_minutes} minutes >= ${SESSION_TIMEOUT_MINUTES})"
    shutdown_system "TIMEOUT" "Session timeout reached"
    exit 0
  fi
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

log "Auto-commit, push e shutdown watcher attivo: ogni ${INTERVAL_MINUTES} minuti eseguo commit, push ogni 2 ore su ${BRANCH}, poi spegni."

push_counter=0

while true; do
  # Check session timeout
  check_session_timeout
  
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
        log "Guardian recovery succeeded - continuing session"
      else
        log "Guardian recovery failed - initiating shutdown"
        shutdown_system "FAILED" "Guardian recovery failed for commit"
        exit 1
      fi
    fi

    push_counter=$((push_counter + 1))
    if (( push_counter % 2 == 0 )); then
      log "Commit effettuato ('${commit_msg}'). Eseguo git push..."
      if git push origin "$BRANCH"; then
        log "Push completato."
      else
        log "Push fallito. Invoco Guardian..."
        if run_guardian push; then
          log "Guardian recovery succeeded - continuing session"
        else
          log "Guardian recovery failed - initiating shutdown"
          shutdown_system "FAILED" "Guardian recovery failed for push"
          exit 1
        fi
      fi
    else
      log "Commit effettuato ('${commit_msg}'). Push saltato (ogni 2 ore)."
    fi
    
    # Check if this was a successful deployment cycle (only on main branch)
    if [[ "$BRANCH" == "main" ]] && (( push_counter % 2 == 0 )); then
      log "Push completed on main - verifying deployment..."
      if npm run deploy:vercel:verify; then
        log "Deployment verified successfully - initiating shutdown"
        shutdown_system "SUCCESS" "Deployment completed and verified"
        exit 0
      else
        log "Deployment verification failed - initiating shutdown"
        shutdown_system "DEPLOYMENT_FAILED" "Deployment verification failed"
        exit 0
      fi
    fi
  fi

  log "Riposo per ${INTERVAL_MINUTES} minuti..."
  sleep $((INTERVAL_MINUTES * 60))
done
