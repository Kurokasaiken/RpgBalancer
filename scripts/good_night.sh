#!/bin/bash

set -euo pipefail

usage() {
  cat <<'EOF'
Usage: scripts/good_night.sh [--dry-run] [--date YYYY-MM-DD]

Archive the latest coordinator/strategist conversations for the provided date (default: today)
into docs/daily_logs/<date>/ and print the destination folder. With --dry-run no files or
folders are created; operations are only logged.
EOF
}

log() {
  echo "[$(date '+%H:%M:%S')] $1"
}

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
COORDINATOR_DIR="${REPO_ROOT}/docs/coordinator"
STRATEGIST_DIR="${REPO_ROOT}/docs/strategist"
DAILY_LOGS_ROOT="${REPO_ROOT}/docs/daily_logs"

DRY_RUN=false
RUN_DATE=""
AUTO_COMMIT=false

while [[ $# -gt 0 ]]; do
  case "$1" in
    --dry-run)
      DRY_RUN=true
      shift
      ;;
    --date)
      RUN_DATE="${2:-}"
      if [[ -z "$RUN_DATE" ]]; then
        echo "Error: --date requires a value" >&2
        exit 1
      fi
      shift 2
      ;;
    --auto-commit)
      AUTO_COMMIT=true
      shift
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "Unknown option: $1" >&2
      usage >&2
      exit 1
      ;;
  esac
end

if [[ -z "$RUN_DATE" ]]; then
  RUN_DATE="$(date '+%Y-%m-%d')"
fi

TARGET_DIR="${DAILY_LOGS_ROOT}/${RUN_DATE}"
copied_files=()

ensure_directory() {
  local dir="$1"
  if $DRY_RUN; then
    log "DRY RUN: would ensure directory ${dir}"
  else
    mkdir -p "$dir"
  fi
}

list_files_for_date() {
  local dir="$1"
  local day="$2"
  python3 - "$dir" "$day" <<'PY'
import sys
import datetime
from pathlib import Path

root = Path(sys.argv[1])
target_day = datetime.datetime.strptime(sys.argv[2], "%Y-%m-%d").date()

if not root.exists():
    raise SystemExit

paths = []
for path in root.iterdir():
    if path.is_file():
        stamp = datetime.datetime.fromtimestamp(path.stat().st_mtime).date()
        if stamp == target_day:
            paths.append(str(path))

paths.sort()
print("\n".join(paths))
PY
}

archive_role() {
  local role="$1"
  local source_dir="$2"

  if [[ ! -d "$source_dir" ]]; then
    log "⚠️  Directory ${source_dir} not found; skipping ${role}."
    return
  fi

  mapfile -t files < <(list_files_for_date "$source_dir" "$RUN_DATE" || true)

  if [[ ${#files[@]} -eq 0 || -z "${files[0]:-}" ]]; then
    log "ℹ️  Nessun file aggiornato oggi per ${role}."
    return
  fi

  for file in "${files[@]}"; do
    [[ -z "$file" ]] && continue
    local destination_basename="${role}_$(basename "$file")"
    local destination_path="${TARGET_DIR}/${destination_basename}"
    if $DRY_RUN; then
      log "DRY RUN: would copy ${file} -> ${destination_path}"
    else
      cp "$file" "$destination_path"
      copied_files+=("$destination_path")
      log "✅ Copiato ${file} -> ${destination_path}"
    fi
  done
}

log "🌙 Avvio archivio "good night" per la data ${RUN_DATE}"
ensure_directory "$TARGET_DIR"

archive_role "coordinator" "$COORDINATOR_DIR"
archive_role "strategist" "$STRATEGIST_DIR"

if $DRY_RUN; then
  log "🔍 Modalità dry-run completata. Nessun file copiato."
  exit 0
fi

if [[ ${#copied_files[@]} -eq 0 ]]; then
  log "ℹ️  Nessun file archiviato per la data ${RUN_DATE}."
else
  log "📁 Archivio conversazioni coordinator/strategist completo: ${TARGET_DIR}"
fi
if $AUTO_COMMIT; then
  log "🤖 Avvio auto_commit_push.sh per completare il commit/push programmato."
  (cd "$REPO_ROOT" && ./auto_commit_push.sh) || {
    log "⚠️  auto_commit_push.sh ha restituito un errore. Controlla i log sopra."
    exit 1
  }
else
  log "📝 Rivedi le modifiche con 'git status'. Esegui './auto_commit_push.sh' per il commit automatico oppure committa manualmente dopo aver controllato il diff."
fi
