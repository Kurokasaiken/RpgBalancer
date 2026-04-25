#!/bin/bash

ZIP_NAME="project_clean.zip"
TEMP_DIR="project_clean"

echo "➡️  Pulizia e preparazione cartelle…"

rm -rf "$TEMP_DIR"
mkdir "$TEMP_DIR"

# Copia solo i file importanti
rsync -av --exclude='node_modules' \
          --exclude='dist' \
          --exclude='build' \
          --exclude='.vite' \
          --exclude='.cache' \
          --exclude='*.log' \
          --exclude='src-tauri/target' \
          --exclude='src-tauri/.cargo' \
          --exclude='src-tauri/build' \
          --exclude='public/assets' \
          --exclude='src/assets' \
          --exclude='docs' \
          --exclude='playwright-report' \
          --exclude='test-results' \
          --exclude='*.png' --exclude='*.jpg' --exclude='*.jpeg' --exclude='*.gif' --exclude='*.svg' --exclude='*.ico' \
          --exclude='.DS_Store' \
          --exclude='.vscode' \
          --exclude='.idea' \
          --exclude='*.tmp' \
          --exclude='*.bak' \
          --exclude='coverage' \
          --exclude='test-output.txt' \
          ./ "$TEMP_DIR"

echo "➡️  Creazione ZIP…"

zip -r "$ZIP_NAME" "$TEMP_DIR"

echo "➡️  Fatto! File creato: $ZIP_NAME"

# Cleanup
rm -rf "$TEMP_DIR"
