#!/usr/bin/env bash
set -euo pipefail
errors=0
for cook_file in recipes/*.cook; do
    if [ -f "$cook_file" ]; then
        # Check for title
        if ! grep -q "^title:" "$cook_file"; then
            echo "ERROR: $cook_file is missing 'title' field"
            ((errors++))
        fi
        # Check for description
        if ! grep -q "^description:" "$cook_file"; then
            echo "ERROR: $cook_file is missing 'description' field"
            ((errors++))
        fi
        # Check for course (either single line or list format)
        if ! grep -q "^course:" "$cook_file"; then
            echo "ERROR: $cook_file is missing 'course' field"
            ((errors++))
        fi
    fi
done
if [ $errors -gt 0 ]; then
    echo ""
    echo "Found $errors metadata error(s) in recipe files"
    exit 1
fi
echo "All recipes have required metadata (title, description, course)"
