#!/bin/bash

# sync-skills-to-windsurf.sh
# Sync agent skills from versioned source (coordinator/skills/) to Windsurf working directory (.windsurf/skills/)
# This script should be run after committing changes to coordinator/skills/

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Paths
VERSIONED_SKILLS="coordinator/skills"
WINDSURF_SKILLS=".windsurf/skills"

echo "=== Syncing agent skills to Windsurf working directory ==="
echo ""

# Check if versioned skills directory exists
if [ ! -d "$VERSIONED_SKILLS" ]; then
  echo -e "${RED}Error: Versioned skills directory not found: $VERSIONED_SKILLS${NC}"
  exit 1
fi

# Create Windsurf skills directory if it doesn't exist
if [ ! -d "$WINDSURF_SKILLS" ]; then
  echo -e "${YELLOW}Creating Windsurf skills directory: $WINDSURF_SKILLS${NC}"
  mkdir -p "$WINDSURF_SKILLS"
fi

# Sync files from versioned to Windsurf
echo "Copying files from $VERSIONED_SKILLS to $WINDSURF_SKILLS..."
cp -r "$VERSIONED_SKILLS"/* "$WINDSURF_SKILLS/"

echo -e "${GREEN}✓ Sync complete${NC}"
echo ""
echo "Windsurf working directory now reflects versioned source."
echo "Next steps:"
echo "1. Restart Windsurf/Devin Desktop to pick up the changes"
echo "2. Verify that Windsurf recognizes the updated skills"
