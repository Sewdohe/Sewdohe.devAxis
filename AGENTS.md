# AGENTS.md — Axis (Astro + Obsidian premium theme)

Source of truth for AI agents (Claude Code, Cursor, etc.) working in this repo.
**Read this entire file before making changes.** It captures the things that are
non-obvious about how Axis is structured.

If the answer to "how does X work?" isn't here and it took you more than one round of
investigation, **add it here** when you figure it out.

---

## What Axis is

Axis is a premium Astro theme that uses an Obsidian vault as its CMS via Vault CMS.

**Stack and philosophy:**
- Astro 6+ static site generator. Netlify/Cloudflare Pages friendly.
- **Obsidian as CMS via Vault CMS.** The `src/content/` folder is a real Obsidian vault
  (`.obsidian/` config + plugins committed to repo).
- High-performance, lean — no React, no jQuery, vanilla JS only.
- Multiple themes built-in (axis, minimal, oxygen, dracula, nord, catppuccin, etc.)
- Configurable feature flags so users can opt in/out of projects, docs, graph view,
  table of contents, custom content types, etc.

**Core philosophy** — and this is the point of the whole project:

> Content lives in Obsidian. The site is a published view of the vault. Graph view,
> linked mentions, and click-to-open should work *identically* in Obsidian and on the
> live site. A standard markdown link to a `.md` file in the vault should resolve to
> the right URL on the site without any conversion or wikilink syntax.

When you're tempted to take a shortcut that breaks Obsidian-native behavior (e.g.
writing a root-relative URL because it's "easier"), **don't**. The shortcut breaks
the graph and removes the value of using Obsidian as a CMS at all.

---

## Cardinal rules

1. **`pnpm dev`, NEVER `pnpm build`** for normal verification. Build is slow because
   it generates OG images for every page. Only build when verifying production output.
2. **Never add `rel="noopener noreferrer"` or `rel="nofollow"` to links.** External
   links use bare `target="_blank"` only. The rehype plugin is pinned to `rel: []` in
   `astro.config.mjs` — do not change it back to defaults.
3. **Never use destructive commands** (`rm -rf`, `git reset --hard`, force push) without
   explicit approval. Investigate root causes; don't paper over them.
4. **Match existing patterns.** This codebase already solves most problems consistently.
   Search before inventing.
5. **Prefer config flags over hardcoded behavior.** Users will customize this template;
   don't lock them into your decisions.
6. **Don't reinvent the redirect system.** If you find yourself fuzzy-matching a renamed
   slug, stop — see "Redirects" section below.

---

## Repo layout

```
src/
  content/
    posts/{slug}/index.md           # Blog posts (folder per post)
    pages/{slug}/index.md           # Standalone pages (about, etc.)
    projects/{slug}/index.md        # Optional, gated by siteConfig.contentTypes.projects
    docs/{slug}/index.md            # Optional, gated by siteConfig.contentTypes.docs
    special/{name}/index.md         # Listing-page blurbs (home, posts, projects, docs, 404)
    tags/{tag}.md                   # Tag pages (managed by tag-mirror Obsidian plugin)
    redirects/{slug}.md             # Vanity/shortlink redirects
    bases/                          # Obsidian Bases files (.base) for vault navigation
    .obsidian/                      # Obsidian vault config + plugins (yes, in repo)
  pages/                            # Astro routes
    index.astro                     # Homepage
    posts/index.astro               # /posts page 1
    posts/[page].astro              # /posts/2..N pagination
    posts/[...slug].astro           # Post detail
    posts/tag/[tag].astro           # Tag listing
    posts/tag/[tag]/[page].astro    # Tag pagination
    projects/index.astro            # Projects listing (only if enabled)
    projects/[...slug].astro        # Project detail
    docs/index.astro                # Docs listing (only if enabled)
    docs/[...slug].astro            # Doc detail
    [type]/index.astro              # Custom content type listing
    [type]/[...slug].astro          # Custom content type detail
    [...slug].astro                 # Catch-all for pages collection
    open-graph/[...slug].png.ts     # OG image generator (covers all content types)
  layouts/
    BaseLayout.astro                # Wraps every page; runs initPage() on astro:page-load
    PageLayout.astro                # For pages collection
    PostLayout.astro                # For posts collection
    ProjectLayout.astro             # For projects collection
    DocumentationLayout.astro       # For docs collection
  components/
    BaseHead.astro                  # <head> contents
  config.ts                         # Main siteConfig — READ before changing site behavior
  themes/                           # Color theme definitions
  utils/
    internallinks.ts                # The link rewriter
    property-redirects.ts           # Aggregates all redirects
    og-image.ts                     # Satori OG image template
scripts/
  sync-images.js
  generate-graph-data.js
  process-property-redirects.js
plugins/                            # Local Astro/Vite plugins
```

---

## `siteConfig` — the configurability layer

`src/config.ts` is the **single source of truth** for theme behavior. Most things that
would differ between users are here:

- `site`, `title`, `author`, `description`, `language`
- `theme` and `availableThemes` (which color themes ship and which is default)
- `fonts.source` (`local` / `cdn` / `astro`) and font families
- `layout.contentWidth`
- `pages` (header nav + command palette items, with icons)
- `contentTypes` — `{ projects: bool, docs: bool }` toggles for entire content types
- `routes` — `{ postsBase, projectsBase, docsBase }` URL bases (so users can rename
  `/posts` → `/notes`, etc.)
- `customContentTypes` — user-defined content sections (managed by Axis Settings plugin)
- `home` — homepage layout variant + section toggles
- `features` — `localGraph`, `tableOfContents`, `tocDepth`, etc.
- `postOptions.postsPerPage`
- `cookieConsentEnabled`
- `defaultOgImageAlt`
- `snippets.head` / `snippets.bodyEnd` (header/footer code injection)

Markers like `[CONFIG:KEY]` in comments are read by the **Axis Settings Obsidian plugin**
(`obsidian-axis-settings`) so users can edit config from inside Obsidian. **Do not remove
these markers** when editing `config.ts`.

When you add a new feature, ask: "should this be configurable?" If yes, add it to
`siteConfig` with a `[CONFIG:KEY]` marker.

---

## Internal links — the most important section

Axis supports standard markdown links to `.md` files in the vault. **This is the
primary authoring convention.** Wikilinks (`[[note]]`) are also processed by
`remarkWikilinks` for users who prefer them, but standard links are the recommended
approach because they work uniformly across all content types.

### Why standard markdown links over wikilinks

- **Cross-content-type linking works.** Wikilinks only resolve to posts; standard
  links work for posts, pages, projects, docs, custom types.
- **Obsidian opens them natively.** Click `[text](posts/foo/index.md)` in Obsidian
  and you go to that file. Click on the live site, you go to `/posts/foo/`.
- **Graph view sees them.** Obsidian's graph reads markdown links and shows real
  connections.
- **Linked mentions work.** Backlinks panel lights up.

### Vault path format (what to write in markdown)

| Linking to | Write this | Becomes (with `trailingSlash: 'always'`) |
|---|---|---|
| Another post | `[text](posts/some-slug/index.md)` | `/posts/some-slug/` |
| Post + anchor | `[text](posts/some-slug/index.md#section)` | `/posts/some-slug/#section` |
| A page | `[text](pages/contact/index.md)` | `/contact/` |
| A project | `[text](projects/cool-thing/index.md)` | `/projects/cool-thing/` |
| A doc | `[text](docs/getting-started/index.md)` | `/docs/getting-started/` |
| A tag | `[text](tags/windows.md)` | `/posts/tag/windows/` |
| Custom type entry | `[text](recipes/lasagna/index.md)` | `/recipes/lasagna/` (per `customContentTypes`) |
| The homepage | `[text](special/home/index.md)` | `/` |
| Posts listing | `[text](special/posts/index.md)` | `/posts/` |
| The 404 page | `[text](special/404/index.md)` | `/404/` |
| A heading on this page | `[text](#section-slug)` | `#section-slug` |

Notes:
- All paths are **vault-relative from `src/content/`**, not file-relative.
- Use `index.md` explicitly. Don't bare-name posts.
- If `siteConfig.routes.postsBase` is changed (e.g. to `notes`), the *URL* changes but
  the *vault path* stays `posts/foo/index.md` — the rewriter handles the mapping.

### Anti-patterns

- ❌ `[text](/posts/foo/)` — root-relative URL bypasses graph + rewriter
- ❌ `[text](https://yoursite.com/posts/foo)` — absolute self-URL gets `target=_blank`
  and breaks the graph
- ❌ `[text](../some-post/index.md)` — file-relative path; rewriter expects vault-relative
- ❌ `[text](/posts/tag/windows/)` — link to URL, not the source `tags/windows.md`
- ❌ Wikilinks with custom display text linked to non-post content

### How the rewriter resolves links

`src/utils/internallinks.ts` exports remark plugins:
- **`remarkInternalLinks`** — main entry point. Combines wikilink + standard link handling.
- **`remarkWikilinks`** — `[[...]]` syntax for posts only.
- **`remarkStandardLinks`** — handles standard `.md` links across all content types.

Configurable special-page URL mapping is in `SPECIAL_PAGE_URLS`. The rewriter respects
`siteConfig.routes.{postsBase,projectsBase,docsBase}` so the URL output matches user
config.

---

## Redirects (RENAMING CONTENT — read this before fuzzy-matching anything)

Axis supports the **`file-name-history`** Obsidian plugin (also bundled in the Axis
vault), which **automatically tracks filename changes** when you rename a file in
Obsidian. The old filename is stored in the file's frontmatter as a `redirects:` array.
The build then generates Astro redirect rules from these entries, so old URLs continue
to resolve.

**Users almost never need to do anything manually.** Just rename in Obsidian and it works.

### Three redirect sources, all aggregated by `src/utils/property-redirects.ts`

1. **`redirects:` frontmatter on posts/pages/projects/docs** — most common. Auto-populated
   by `file-name-history`.

   ```yaml
   ---
   title: Recommended Setup and Software for Windows
   redirects:
     - recommended-setup-and-software-for-new-windows-installs
   ---
   ```

2. **`redirects:` on `special/{name}/index.md`** — same idea, mapped to the special page's
   fixed URL via `SPECIAL_PAGE_URLS` in `property-redirects.ts`.

3. **`src/content/redirects/{slug}.md`** — vanity/shortlink redirects:

   ```yaml
   ---
   title: Discord
   link: https://discord.gg/whatever
   indexed: false       # noindex this redirect from sitemap
   ---
   ```
   Generates: `/discord/` → `https://discord.gg/whatever`

The redirect map is built by `getPropertyRedirects()` and passed to Astro's `redirects`
config in `astro.config.mjs`.

### When you encounter a "missing" linked file

If a link points to a slug that doesn't exist, **first check whether the current file has
that old slug in its `redirects:` frontmatter**. If yes, the link is fine. If no:
- The file may have been deleted (link is genuinely broken)
- The file was renamed but `file-name-history` didn't catch it (add the old slug
  manually to the new file's `redirects:` frontmatter)

**Don't fuzzy-match and rewrite the link** without first considering the redirect approach.

---

## Tag system

### How tags work

1. Add `tags: [foo, bar]` to a file's frontmatter (or use Obsidian inline `#tag` syntax).
2. Optionally use the **`tag-mirror`** Obsidian plugin to auto-sync `src/content/tags/{tag}.md`
   files with vault tags. Each generated file has `managed-by: tag-mirror` in frontmatter
   and an Obsidian Bases query block listing matching notes.
3. The Astro tag listing routes (`src/pages/posts/tag/[tag].astro`) read from the posts
   collection. The `tags/{tag}.md` files exist primarily so tags are first-class in
   Obsidian (graph, linked mentions, click-to-navigate).

### Linking to tags

Always link to the source file: `[text](tags/windows.md)` → resolves to `/posts/tag/windows/`.

### Don't manually edit tag-mirror-managed files

Files with `managed-by: tag-mirror` in frontmatter are regenerated by the plugin. Manual
edits will be overwritten on next sync. Users not using `tag-mirror` can edit `tags/`
files freely.

### Renaming tags

Use the **`tag-wrangler`** Obsidian plugin (bundled) to rename tags across the vault.
`tag-mirror` will then regenerate the `tags/{tag}.md` files automatically.

---

## Bundled Obsidian plugins

Axis ships with a curated Obsidian vault including these plugins. They're located in
`src/content/.obsidian/plugins/`.

| Plugin | Role |
|---|---|
| `vault-cms` | The CMS itself — handles the publishing pipeline |
| `axis-settings` | Edit Axis `siteConfig` from inside Obsidian (reads `[CONFIG:KEY]` markers) |
| `astro-composer` | Creates new posts/pages with the right frontmatter |
| `file-name-history` | Tracks renames → auto-fills `redirects:` frontmatter |
| `nested-properties` | Lets you nest YAML frontmatter properties |
| `bases-cms` | Bases (`.base` files) integration with CMS |
| `home-base` | Sets a `.base` file as the Obsidian homepage |
| `property-over-file-name` | Use `title` frontmatter as primary identifier |
| `data-files-editor` | Edit YAML/JSON data files in Obsidian |
| `image-manager` | Image insertion + optimization |
| `extended-embeds` | Embed tweets, YouTube, etc. |
| `obsidian-git` | Commit + push from inside Obsidian |
| `seo` | SEO checks for content |
| `omnisearch` | Better full-text search |

If you change anything that touches frontmatter conventions, image paths, link rewriting,
or `[CONFIG:KEY]` markers, **double-check that the corresponding plugin still works**.

---

## OG images

`src/pages/open-graph/[...slug].png.ts` generates a 1200×630 PNG for every routable page
via Satori + Resvg. Output is cached at `.cache/og-images/`.

### What gets an OG image

The `getStaticPaths` enumerates **every** routable page across all content types:
- Individual posts
- Individual pages
- Individual projects (if `contentTypes.projects` enabled)
- Individual docs (if `contentTypes.docs` enabled)
- Individual custom-type entries
- Listing pages: posts, projects, docs, custom types
- Pagination for posts and tag listings
- Tag listings
- Default fallback (`index.png`)

### When you add a new page-like route

You **must** do two things:
1. Add a path entry in `src/pages/open-graph/[...slug].png.ts` getStaticPaths
2. Pass `ogImage="/open-graph/{slug}.png"` to `<BaseLayout>` in the page

Layouts (`PostLayout`, `PageLayout`, `ProjectLayout`, `DocumentationLayout`) already
handle this automatically — only bespoke `.astro` routes need the manual hookup.

---

## View Transitions — the big footgun

Every page uses Astro's View Transitions via `<ClientRouter />` in `BaseHead.astro`. DOM
swaps happen without a full page reload. Anything that touches the DOM, mutates state,
or registers listeners must be re-runnable.

### The contract

- **All initialization runs inside `initPage()`** in `BaseLayout.astro`.
- `initPage()` is called on:
  - `DOMContentLoaded` (or immediately if already loaded)
  - `astro:page-load` (after every navigation)
  - `requestAnimationFrame` × 2 (dev-mode safety)
- Every `init*` function MUST be idempotent. They should:
  - Tear down their previous state (observers, listeners, injected DOM)
  - Re-attach to the new DOM
  - Not assume any DOM element is the same instance as before

### Patterns we use

- **Observers**: Stash on `window.__name` and disconnect before re-creating
- **Listeners on persistent elements**: Use `dataset.bound = 'true'` to prevent
  double-binding
- **Injected DOM**: Remove old instances by ID before injecting new
- **Third-party scripts**: Initialize on every `astro:page-load`, with detection
  for whether the page actually has the relevant element

**If you add a new third-party script or DOM-touching feature**, you MUST hook it into
`initPage()` and make it idempotent. Don't just put a `<script>` tag in a layout.

---

## Frontmatter conventions

### Posts

```yaml
---
title: My Post
description: One sentence summary.
published: 2025-01-15
updated: 2025-01-20      # optional
tags:
  - productivity
image: cover.png         # optional
imageAlt: Description    # optional
imageOG: true            # use cover image as OG instead of generated
hideCoverImage: false
hideTOC: false
draft: false
redirects:               # auto-populated by file-name-history plugin
  - old-slug
---
```

### Pages

```yaml
---
title: About
description: ...
hideTOC: false
noIndex: false
draft: false
redirects:
  - old-slug
---
```

### Projects

```yaml
---
title: Cool Thing
description: ...
date: 2025-01-15
status: active           # active | wip | archived
featured: true           # show on homepage if home.showProjects = true
tags:
  - tool
image: cover.png
repositoryUrl: https://github.com/...
projectUrl: https://...
draft: false
hideTOC: false
hideCoverImage: false
---
```

### Docs

```yaml
---
title: Getting Started
description: ...
category: setup          # group docs in sidebar
order: 1                 # sort order within category
draft: false
hideTOC: false
---
```

### Redirects

```yaml
---
title: Discord
link: https://discord.gg/whatever
indexed: false
---
```

---

## Image handling

- Images live in the same folder as the content: `src/content/posts/{slug}/cover.png`
- Reference them in markdown as `cover.png` or `images/cover.png`
- `scripts/sync-images.js` runs before dev/build to copy them to `public/posts/{slug}/`
- Cover images are auto-converted to `.webp` in the URL resolver — except `.svg`
  and existing `.webp`
- For OG images, set `imageOG: true` to use the cover instead of the generated Satori PNG

---

## Themes

Multiple color themes ship with Axis (axis, minimal, oxygen, dracula, nord, catppuccin,
rose-pine, gruvbox, everforest, solarized, ayu, sky, macos, atom, flexoki, charcoal,
obsidian, things). They live in `src/themes/`.

- **Default theme**: `siteConfig.theme`
- **Available themes**: `siteConfig.availableThemes` (array, or `'all'`)
- **Theme selector** is mounted only if there's more than the default available
- Themes are CSS variable sets; the active theme's CSS is injected at first paint
  to prevent FOUC
- **Theme persistence across view transitions** is handled in `BaseHead.astro`

When adding a new theme, also add it to the `ThemeName` type in `config.ts` and
register it in `src/themes/index.ts`.

---

## Common scripts

| Command | What it does |
|---|---|
| `pnpm dev` | Start dev server |
| `pnpm build` | Production build |
| `node scripts/sync-images.js` | Sync content images to public/ |
| `node scripts/generate-graph-data.js` | Rebuild link graph data |

---

## Voice + writing style (template content)

Sample content shipped in the Axis vault should be:
- **Helpful and instructional** (not personal opinions)
- **Demo-able** — show off features (callouts, embeds, math, code blocks, etc.)
- **Generic enough** that buyers can read it without being confused about what's "theirs"
  vs "the demo"

---

## When in doubt

- **Read the existing pattern first.** Search the codebase before inventing.
- **Consult this file before guessing.** If something isn't documented here, that's a
  bug in this file — fix it after you figure it out.
- **Ask before doing anything destructive or large-scale.**
- **Test view-transition behavior.** Initial load is not enough. Navigate to a page,
  then to another, then back, and confirm the feature still works.
- **Don't break the Obsidian-native experience.** That's the whole point of the project.
- **Prefer configurability over hardcoding** — Axis is a template, not a personal site.
