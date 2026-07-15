#!/bin/bash

# check-legacy-patterns.sh
# Detects legacy patterns in new UI work:
# 1. Duplicate primitive markup/CSS-in-JS (WARNING - heuristic)
# 2. Hardcoded strings not passing through i18n (HARD FAIL)
# 3. New standalone .css files (HARD FAIL)
# 4. Inline styles with hardcoded colors (HARD FAIL)
# Used as safeguard for "verified"/"architectural" tasks touching src/ui/**

set -e

# Colors for output
RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
NC='\033[0m' # No Color

# Directories to check
UI_DIRS=("src/ui" "src/pages")

# Track hard failures vs warnings
HARD_FAILURES=0
WARNINGS=0

# Pattern 1: Detect hardcoded strings in JSX (not wrapped in t() or {t(...)})
# HARD FAIL: All user-facing strings must pass through i18n
echo "Checking for hardcoded strings in JSX..."
HARDCODED_FOUND=0

for dir in "${UI_DIRS[@]}"; do
  if [ -d "$dir" ]; then
    # Find .tsx files modified in the last 24 hours (or all if checking CI)
    # For CI usage, you might want to check all files instead of just recent ones
    while IFS= read -r -d '' file; do
      # Skip if file is in test or __tests__ directory
      if [[ "$file" =~ __tests__|\.test\.|\.spec\. ]]; then
        continue
      fi

      # Check for hardcoded strings - text between > and < that isn't t(...)
      # This is a heuristic; may have false positives
      if grep -E '>[A-Za-z][^<]{3,}<' "$file" | grep -v 't(' | grep -v '{t(' | grep -v 'translation' > /dev/null; then
        echo -e "${RED}HARD FAIL: Hardcoded strings in $file${NC}"
        grep -n -E '>[A-Za-z][^<]{3,}<' "$file" | grep -v 't(' | grep -v '{t(' | grep -v 'translation' | head -5
        HARDCODED_FOUND=1
        HARD_FAILURES=$((HARD_FAILURES + 1))
      fi
    done < <(find "$dir" -name "*.tsx" -print0)
  fi
done

if [ $HARDCODED_FOUND -eq 0 ]; then
  echo -e "${GREEN}✓ No hardcoded strings detected${NC}"
else
  echo -e "${RED}✗ Hardcoded strings found - must pass through i18n${NC}"
fi

# Pattern 2: Detect duplicate primitive patterns
# WARNING: Heuristic check - difficult to detect reliably with regex
echo ""
echo "Checking for duplicate primitive patterns..."
DUPLICATE_FOUND=0

# Known primitive patterns (simplified heuristic)
# In production, this would be more sophisticated
PRIMITIVE_PATTERNS=(
  "className=\".*rounded.*border.*"
  "className=\".*flex.*items-center.*"
  "className=\".*p-.*m-.*"
)

for dir in "${UI_DIRS[@]}"; do
  if [ -d "$dir" ]; then
    while IFS= read -r -d '' file; do
      # Skip if file is in atoms, fantasy/atoms, or skins/primitives directories
      if [[ "$file" =~ atoms/|fantasy/atoms/|skins/primitives/|__tests__|\.test\.|\.spec\. ]]; then
        continue
      fi

      # Check for patterns that might duplicate primitives
      for pattern in "${PRIMITIVE_PATTERNS[@]}"; do
        if grep -E "$pattern" "$file" > /dev/null; then
          # Count occurrences - if many, might indicate duplication
          count=$(grep -cE "$pattern" "$file" || true)
          if [ "$count" -gt 3 ]; then
            echo -e "${YELLOW}WARNING: File $file has many instances of pattern matching primitive style${NC}"
            echo "  Pattern: $pattern"
            echo "  Count: $count"
            echo "  Verify this doesn't duplicate src/ui/atoms/, src/ui/fantasy/atoms/, or src/ui/idleVillage/skins/primitives/"
            DUPLICATE_FOUND=1
            WARNINGS=$((WARNINGS + 1))
          fi
        fi
      done
    done < <(find "$dir" -name "*.tsx" -print0)
  fi
done

if [ $DUPLICATE_FOUND -eq 0 ]; then
  echo -e "${GREEN}✓ No obvious primitive duplication detected${NC}"
else
  echo -e "${YELLOW}⚠ Potential primitive duplication found - manual review recommended${NC}"
fi

# Pattern 3: Check for new standalone .css files
# HARD FAIL: New skins/themes must use skinConfigRegistry, not standalone CSS
echo ""
echo "Checking for new standalone .css files..."
NEW_CSS_FOUND=0

for dir in "${UI_DIRS[@]}"; do
  if [ -d "$dir" ]; then
    while IFS= read -r -d '' file; do
      # Skip if file is in test or __tests__ directory
      if [[ "$file" =~ __tests__|\.test\.|\.spec\. ]]; then
        continue
      fi

      # Check for .css files (excluding known legacy paths)
      if [[ "$file" =~ \.css$ ]] && [[ ! "$file" =~ _OLD_DEPRECATED|legacy|archive ]]; then
        echo -e "${RED}HARD FAIL: New standalone .css file: $file${NC}"
        echo "  New skins/themes must be implemented as presets in skinConfigRegistry"
        NEW_CSS_FOUND=1
        HARD_FAILURES=$((HARD_FAILURES + 1))
      fi
    done < <(find "$dir" -name "*.css" -print0)
  fi
done

if [ $NEW_CSS_FOUND -eq 0 ]; then
  echo -e "${GREEN}✓ No new standalone .css files detected${NC}"
else
  echo -e "${RED}✗ New standalone .css files found - use skinConfigRegistry instead${NC}"
fi

# Pattern 4: Check for inline style objects with hardcoded colors
# HARD FAIL: Use theme tokens instead of hardcoded colors
echo ""
echo "Checking for inline styles with hardcoded colors..."
INLINE_STYLE_FOUND=0

COLOR_PATTERNS=(
  "style={{.*#[0-9a-fA-F]{3,6}"
  "style={{.*rgb\("
  "style={{.*rgba\("
)

for dir in "${UI_DIRS[@]}"; do
  if [ -d "$dir" ]; then
    while IFS= read -r -d '' file; do
      if [[ "$file" =~ __tests__|\.test\.|\.spec\. ]]; then
        continue
      fi

      for pattern in "${COLOR_PATTERNS[@]}"; do
        if grep -E "$pattern" "$file" > /dev/null; then
          echo -e "${RED}HARD FAIL: Inline style with hardcoded color in $file${NC}"
          grep -n -E "$pattern" "$file" | head -3
          INLINE_STYLE_FOUND=1
          HARD_FAILURES=$((HARD_FAILURES + 1))
        fi
      done
    done < <(find "$dir" -name "*.tsx" -print0)
  fi
done

if [ $INLINE_STYLE_FOUND -eq 0 ]; then
  echo -e "${GREEN}✓ No inline hardcoded colors detected${NC}"
else
  echo -e "${RED}✗ Inline hardcoded colors found - use theme tokens instead${NC}"
fi

# Summary
echo ""
echo "=== Summary ==="
echo "Hard failures: $HARD_FAILURES"
echo "Warnings: $WARNINGS"
echo ""
echo "Check classifications:"
echo "  - Hard failures (BLOCKING): hardcoded strings, new .css files, inline hardcoded colors"
echo "  - Warnings (NON-BLOCKING): duplicate primitive patterns (heuristic, manual review)"
echo ""

if [ $HARD_FAILURES -eq 0 ]; then
  if [ $WARNINGS -eq 0 ]; then
    echo -e "${GREEN}✓ All checks passed${NC}"
    exit 0
  else
    echo -e "${YELLOW}⚠ Warnings detected (non-blocking)${NC}"
    echo "Manual review recommended for primitive duplication patterns."
    exit 0
  fi
else
  echo -e "${RED}✗ Hard failures detected (BLOCKING)${NC}"
  echo "Fix hard failures before proceeding. Warnings can be reviewed separately."
  echo "Legacy debt (30+ hardcoded string files, 37 CSS legacy files) is tracked separately."
  exit 1
fi
