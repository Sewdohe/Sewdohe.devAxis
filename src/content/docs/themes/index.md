---
title: Themes
description: How to change and customize themes in Axis.
category: Axis
order: 1
version: 1.0.0
updated: 2026-03-09
image: palette.jpg
imageAlt: palette
hideCoverImage: false
draft: false
featured: false
---

## Changing the default theme

**In Obsidian:** Use the Axis Settings plugin and set the theme in the plugin settings.

**By hand:** Set the `theme` field in `src/config.ts`:

```typescript
theme: 'nord', // or any of the 17 built-in themes
```

## Available themes

Axis ships with 17 color themes: Axis, Minimal, Oxygen, Dracula, Nord, Catppuccin, Rose Pine, Gruvbox, Everforest, Solarized, Ayu, Sky, macOS, Atom, Flexoki, Charcoal, Obsidian, and Things.

## Restricting available themes

To limit which themes appear in the selector, set `availableThemes` to an array:

```typescript
availableThemes: ['axis', 'nord', 'dracula'],
```

Set to `'all'` to show all themes.
