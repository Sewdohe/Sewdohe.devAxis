---
title: Getting Started
description: How to set up and configure Axis.
category: Axis
order: 0
version: 1.0.0
updated: 2026-03-08
image: arrow.jpg
imageAlt: arrow
hideCoverImage: false
draft: false
featured: false
---

## Installation

1. Clone or download Axis.
2. Run `pnpm install`.
3. Run `pnpm dev` to start the dev server.

## Configuration

**Use Obsidian with the Axis Settings plugin** to change site settings instead of editing `src/config.ts` directly. Open this repo (or your site folder) as an Obsidian vault, install the Axis Settings plugin, and use the plugin’s settings panel to configure theme, navigation, features, and more. Changes are written to `src/config.ts` for you.

If you prefer to edit by hand, all site settings are in `src/config.ts`; see the inline comments for each option.

## Adding content

- **Posts** — `src/content/posts/<slug>/index.md` (one folder per post)
- **Pages** — `src/content/pages/<slug>/index.md` (one folder per page)
- **Projects** — `src/content/projects/<slug>/index.md` (one folder per project)
- **Docs** — `src/content/docs/<slug>/index.md` (one folder per doc)
