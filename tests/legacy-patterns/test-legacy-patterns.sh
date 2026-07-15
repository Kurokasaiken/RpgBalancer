#!/bin/bash

# test-legacy-patterns.sh
# Test script for check-legacy-patterns.sh
# Verifies that the script correctly detects violations and passes clean code

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "=== Testing check-legacy-patterns.sh ==="
echo ""

# Create temporary test directory with proper structure
TEST_DIR=$(mktemp -d)
trap "rm -rf $TEST_DIR" EXIT

mkdir -p "$TEST_DIR/src/ui"
mkdir -p "$TEST_DIR/src/pages"

# Copy fixtures to test directory
cp tests/legacy-patterns/fixture-hardcoded-strings.tsx "$TEST_DIR/src/ui/bad.tsx"
cp tests/legacy-patterns/fixture-clean.tsx "$TEST_DIR/src/ui/good.tsx"

# Test 1: Hardcoded strings should FAIL
echo "Test 1: Verifying hardcoded strings detection (should FAIL)..."
cd "$TEST_DIR"
if bash /Users/faustoboni/progetti_personali/RPG/scripts/check-legacy-patterns.sh 2>&1 | grep -q "HARD FAIL"; then
  echo -e "${GREEN}✓ Test 1 PASSED: Hardcoded strings detected${NC}"
else
  echo -e "${RED}✗ Test 1 FAILED: Hardcoded strings not detected${NC}"
  echo "Output:"
  bash /Users/faustoboni/progetti_personali/RPG/scripts/check-legacy-patterns.sh 2>&1
  exit 1
fi

# Test 2: Clean code should PASS
echo ""
echo "Test 2: Verifying clean code passes (should PASS)..."
rm "$TEST_DIR/src/ui/bad.tsx"
if bash /Users/faustoboni/progetti_personali/RPG/scripts/check-legacy-patterns.sh 2>&1 | grep -q "All checks passed"; then
  echo -e "${GREEN}✓ Test 2 PASSED: Clean code accepted${NC}"
else
  echo -e "${RED}✗ Test 2 FAILED: Clean code rejected${NC}"
  echo "Output:"
  bash /Users/faustoboni/progetti_personali/RPG/scripts/check-legacy-patterns.sh 2>&1
  exit 1
fi

echo ""
echo -e "${GREEN}=== All tests passed ===${NC}"
