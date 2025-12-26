# Cook

My personal recipe collection, deployed at [cook.calebschoepp.com](https://cook.calebschoepp.com).

## Overview

Recipes are stored in [Cooklang](https://cooklang.org/) format in the `recipes/` directory. The website is vibe coded and built with Hugo, deployed to GitHub Pages.

## Usage

Interact with the project using the `justfile`:

```bash
# List all available commands
just

# Sync recipes from .cook files to Hugo markdown
just sync-recipes

# Run development server
just dev

# Lint recipe files
just lint

# Run end-to-end tests
just test

# Build the site
just build
```

## Structure

- `recipes/*.cook` - Recipe files in Cooklang format (source of truth)
- `content/recipes/*.md` - Generated Hugo markdown files (auto-synced from .cook files)
- `justfile` - Task automation and build commands
