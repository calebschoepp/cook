#!/usr/bin/env bash
set -euo pipefail
# Valid course values (case-insensitive)
valid_courses=("main" "appetizer" "side" "soup" "salad" "dessert" "baked good")
errors=0

for cook_file in recipes/*.cook; do
    if [ -f "$cook_file" ]; then
        # Extract course values from the file
        # Handle both single-line format (course: Main) and list format (course:\n  - Main)
        courses=$(awk '
            BEGIN { in_course_list=0 }
            /^course:/ {
                # Check if it has a value on the same line
                if ($0 ~ /^course:[[:space:]]+.+/) {
                    # Single value format: course: Main
                    sub(/^course:[[:space:]]+/, "")
                    print tolower($0)
                } else {
                    # List format starts
                    in_course_list=1
                }
                next
            }
            in_course_list && /^[[:space:]]+-[[:space:]]+/ {
                # List item: "  - Main"
                sub(/^[[:space:]]+-[[:space:]]+/, "")
                print tolower($0)
                next
            }
            in_course_list && /^[^[:space:]]/ {
                # End of list (new field or content)
                in_course_list=0
            }
        ' "$cook_file")

        # Check each extracted course value
        while IFS= read -r course; do
            if [ -n "$course" ]; then
                # Check if course is in valid list
                is_valid=0
                for valid in "${valid_courses[@]}"; do
                    if [ "$course" = "$valid" ]; then
                        is_valid=1
                        break
                    fi
                done

                if [ $is_valid -eq 0 ]; then
                    echo "ERROR: $cook_file has invalid course value '$course'"
                    echo "       Valid values are: main, appetizer, side, soup, salad, dessert, baked good"
                    ((errors++))
                fi
            fi
        done <<< "$courses"
    fi
done

if [ $errors -gt 0 ]; then
    echo ""
    echo "Found $errors course validation error(s) in recipe files"
    exit 1
fi
echo "All course values are valid"
