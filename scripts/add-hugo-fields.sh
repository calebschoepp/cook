#!/usr/bin/env bash
set -euo pipefail
# Use awk to inject Hugo fields and rename course to courses
awk '
BEGIN { in_frontmatter=0; frontmatter_done=0; }
/^---$/ {
    if (!in_frontmatter) {
        in_frontmatter=1;
        print;
        next;
    } else if (!frontmatter_done) {
        # Add Hugo fields before closing ---
        print "type: recipe"
        print "layout: single"
        frontmatter_done=1;
    }
}
/^course:/ {
    # Rename course to courses for Hugo taxonomy
    sub(/^course:/, "courses:");
    print;
    next;
}
{ print }
' "$1" > "$1.tmp" && mv "$1.tmp" "$1"
