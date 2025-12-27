#!/usr/bin/env bash
set -euo pipefail
mkdir -p content/recipes
for cook_file in recipes/*.cook; do
    if [ -f "$cook_file" ]; then
        base_name=$(basename "$cook_file" .cook)
        # Convert to markdown
        cook recipe -f markdown "$cook_file" > "content/recipes/${base_name}.md"
        # Post-process to add Hugo front matter fields
        ./scripts/add-hugo-fields.sh "content/recipes/${base_name}.md"
        # Extract and append timers
        ./scripts/extract-timers.sh "$cook_file" "content/recipes/${base_name}.md"
    fi
done
echo "Recipes synced successfully"
