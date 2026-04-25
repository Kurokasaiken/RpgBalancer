#!/bin/bash
# Pre-prompt guard script to ensure kanban integrity before generating new prompts

echo "Running kanban lint check..."
npm run kanban:lint

if [ $? -ne 0 ]; then
  echo "Kanban lint failed! Please fix duplicate or invalid prompts before proceeding."
  exit 1
fi

echo "Kanban lint passed. Proceeding with prompt generation."
exit 0
