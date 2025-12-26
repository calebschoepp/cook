# Default recipe shows help
default:
    @just --list

# Sync .cook files to markdown in content/recipes/
sync-recipes:
    #!/usr/bin/env bash
    set -euo pipefail
    mkdir -p content/recipes
    for cook_file in recipes/*.cook; do
        if [ -f "$cook_file" ]; then
            base_name=$(basename "$cook_file" .cook)
            # Convert to markdown
            cook recipe -f markdown "$cook_file" > "content/recipes/${base_name}.md"
            # Post-process to add Hugo front matter fields
            just _add-hugo-fields "content/recipes/${base_name}.md"
        fi
    done
    echo "Recipes synced successfully"

# Internal: Add Hugo-specific front matter fields to a recipe markdown file
_add-hugo-fields file:
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
    ' "{{file}}" > "{{file}}.tmp" && mv "{{file}}.tmp" "{{file}}"

# Start Hugo development server
dev:
    hugo server -D --disableFastRender

# Build the Hugo site
build *ARGS:
    hugo --gc --minify {{ARGS}}

# Clean generated files
clean:
    rm -rf public resources

# Lint all recipe files
lint:
    cook doctor validate --base-path recipes --strict

# Verify recipes are in sync (for CI)
verify-sync:
    #!/usr/bin/env bash
    set -euo pipefail
    just sync-recipes
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
