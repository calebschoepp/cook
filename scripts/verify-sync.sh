#!/usr/bin/env bash
set -euo pipefail
./scripts/sync-recipes.sh
if [ -n "$(git status --porcelain content/recipes/)" ]; then
    echo "ERROR: Recipe markdown files are out of sync with .cook files"
    echo ""
    echo "Modified files:"
    git status --short content/recipes/
    echo ""
    echo "Run 'just sync-recipes' locally and commit the changes"
    exit 1
fi
echo "All recipes are in sync!"
