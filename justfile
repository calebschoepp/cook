# Default recipe shows help
default:
    @just --list

# Sync .cook files to markdown in content/recipes/
sync-recipes:
    ./scripts/sync-recipes.sh

# Internal: Add Hugo-specific front matter fields to a recipe markdown file
_add-hugo-fields file:
    ./scripts/add-hugo-fields.sh {{file}}

# Start Hugo development server
dev:
    just sync-recipes
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
    just _validate-recipe-metadata
    just _validate-course-values

# Run end-to-end tests with Playwright
test:
    npx playwright test

# Internal: Validate that all recipes have required metadata
_validate-recipe-metadata:
    ./scripts/validate-recipe-metadata.sh

# Verify recipes are in sync (for CI)
verify-sync:
    ./scripts/verify-sync.sh

# Internal: Validate that course values are from the allowed list
_validate-course-values:
    ./scripts/validate-course-values.sh
