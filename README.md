# Axis

A premium Astro theme for personal publishing. Clean, configurable, and Vault CMS-native.

## Features

- **17 color themes** with runtime switching (Axis, Minimal, Oxygen, Dracula, Nord, Catppuccin, Rose Pine, Gruvbox, Everforest, Solarized, Ayu, Sky, macOS, Atom, Flexoki, Charcoal, Obsidian, Things)
- **Dark mode** with system detection and manual toggle
- **Projects section** for showcasing your work
- **Documentation section** with sidebar navigation grouped by category
- **Linked mentions / backlinks** showing which posts reference each other
- **Image gallery** with automatic grid layouts and lightbox
- **Giscus comments** (GitHub-powered, configurable)
- **Command palette** (Ctrl+K) for searching posts, projects, docs, and switching themes
- **Multiple homepage layouts** (minimal, featured, grid)
- **Full config system** with `[CONFIG:KEY]` markers for future Obsidian plugin control
- **Vault CMS-native** content pipeline (Obsidian-compatible markdown)

## Quick Start

```bash
pnpm install
pnpm dev
```

## Updating

Axis ships with an updater that pulls the latest release, swaps in the new framework files, and leaves your content alone.

```bash
pnpm run update
```

**First run** — you'll be prompted for your Axis license key (from your purchase receipt). It's saved to `.env` as `AXIS_LICENSE_KEY` for future runs. The `.env` file is gitignored.

**What gets preserved:**

- `src/content/` — all your posts, pages, projects, docs, and the entire `.obsidian/` vault
- `public/assets/` and user-uploaded files in `public/`
- `.env`, `.env.local`, `.env.production`
- Favicons (`public/favicon.png`, `favicon-dark.png`, `favicon-light.png`)

**What gets replaced:** everything else (framework code, layouts, components, scripts, configs, `package.json`, etc.).

**After updating:**

1. Open your vault in Obsidian
2. Go to Axis Settings
3. Click "Apply all settings" — this rewrites the new `config.ts` with your saved settings
4. Run `pnpm dev` to verify

If your license key ever changes, delete the `AXIS_LICENSE_KEY` line from `.env` and run `pnpm run update` again to be re-prompted.

## Configuration

Edit `src/config.ts` to customize:

- Site metadata (title, description, author, social links)
- Default theme and available themes
- Feature toggles (dark mode, reading time, TOC, linked mentions, etc.)
- Content types (projects, docs)
- Giscus comments
- Homepage layout
- Deployment target

## Content

| Directory | Description |
|-----------|-------------|
| `src/content/posts/` | Blog posts |
| `src/content/pages/` | Static pages (about, etc.) |
| `src/content/projects/` | Project showcases |
| `src/content/docs/` | Documentation pages |
| `src/content/special/` | Special content (homepage blurb) |

## Stack

- [Astro](https://astro.build) 6 with View Transitions
- [Tailwind CSS](https://tailwindcss.com) 3
- [Fuse.js](https://www.fusejs.io/) for search
- [medium-zoom](https://github.com/francoischalifour/medium-zoom) for image zoom
- [KaTeX](https://katex.org/) for math rendering
- [Mermaid](https://mermaid.js.org/) for diagrams
