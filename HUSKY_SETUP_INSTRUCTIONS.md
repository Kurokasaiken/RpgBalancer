# Husky Pre-commit Hook Setup

## Manual Setup Instructions

Run these commands to set up Husky pre-commit hooks:

```bash
# 1. Install Husky
pnpm install husky --save-dev

# 2. Initialize Husky
pnpm exec husky install

# 3. Create pre-commit hook
# Create file: .husky/pre-commit
# Copy content from below

# 4. Make it executable
chmod +x .husky/pre-commit

# 5. Verify
git commit --allow-empty -m "test: verify husky hook"
```

## File: `.husky/pre-commit`

Create this file with the following content:

```sh
#!/bin/sh
set -e

echo "🧪 Minimal Slice: Running pre-commit checks..."

# Check if any minimal slice files were modified
MODIFIED_FILES=$(git diff --cached --name-only)

if echo "$MODIFIED_FILES" | grep -qE '(tests/e2e/minimal_slice_|src/pages/minimal-|src/components/core/)'; then
  echo "⚠️ Minimal slice files detected - running tests..."

  if ! pnpm test:minimal --bail; then
    echo ""
    echo "❌ Minimal slice tests failed - commit aborted"
    echo ""
    echo "To debug:"
    echo "  pnpm test:minimal:headed    # Run tests with browser visible"
    echo "  pnpm test:minimal:debug     # Debug mode"
    echo "  pnpm test:minimal:report    # View HTML report"
    echo ""
    exit 1
  fi

  echo "✓ Minimal slice tests passed"
fi

echo "✓ Pre-commit checks passed"
```

## Adding to package.json

The following script should already be in your `package.json` for Husky to work:

```json
{
  "scripts": {
    "prepare": "husky install"
  }
}
```

This ensures Husky is installed when someone runs `pnpm install`.

## Testing the Hook

```bash
# Try to commit a change to a minimal-slice file
# The hook will run tests automatically

# If tests pass: commit succeeds ✓
# If tests fail: commit is blocked ✗

# To skip hooks (not recommended):
git commit --no-verify -m "..."
```

## Troubleshooting

If the hook doesn't run:

```bash
# 1. Verify Husky is installed
ls -la .husky/

# 2. Check permissions
chmod +x .husky/pre-commit

# 3. Verify pnpm is available in hook
which pnpm
# If not found, update PATH in .husky/pre-commit:
# export PATH="$PATH:$(pnpm env | grep BIN_FOLDER | cut -d'=' -f2)"

# 4. Run hook manually for debugging
./.husky/pre-commit
```

---

**Automated Setup:** A CI/CD workflow will create this automatically if manual setup fails.
