#!/usr/bin/env bash
set -euo pipefail

TEXT="${1:-}"

if [ -z "${TEXT}" ]; then
  echo "Usage: $0 \"Your tweet text here\"" >&2
  exit 1
fi

if [ -z "${X_BEARER_TOKEN:-}" ]; then
  echo "Error: X_BEARER_TOKEN environment variable is not set." >&2
  exit 1
fi

curl -X POST "https://api.x.com/2/tweets" \
  -H "Authorization: Bearer ${X_BEARER_TOKEN}" \
  -H "Content-Type: application/json" \
  -d "$(printf '{"text": "%s"}' "${TEXT}")"
