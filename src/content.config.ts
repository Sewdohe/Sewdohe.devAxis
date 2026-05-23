import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

/** Supports both folder (slug/index.md) and flat (slug.md). Id = folder name or filename. */
const postsCollection = defineCollection({
  loader: glob({
    pattern: '**/*.{md,mdx}',
    base: './src/content/posts',
    generateId: (opts) => {
      const pathNoExt = opts.entry.replace(/\.(md|mdx)$/i, '');
      return pathNoExt.endsWith('/index') ? pathNoExt.replace(/\/index$/, '') : pathNoExt;
    },
  }),
  schema: z.object({
    title: z.string().default('Untitled Post'),
    published: z.coerce.date().default(() => new Date()),
    updated: z.coerce.date().nullable().optional(),
    description: z.string().nullable().optional().default('No description provided'),
    image: z.any().nullable().optional().transform((val) => {
      if (Array.isArray(val)) return val[0] || null;
      if (typeof val === 'string' && val.trim() !== '') return val;
      return null;
    }),
    imageAlt: z.string().nullable().optional(),
    imageOG: z.boolean().optional(),
    hideCoverImage: z.boolean().optional(),
    tags: z.array(z.string()).nullable().optional(),
    draft: z.boolean().optional(),
    hideTOC: z.boolean().optional(),
    hideLocalGraph: z.boolean().optional(),
    keyword: z.string().nullable().optional(),
    redirects: z.union([
      z.string(),
      z.array(z.string()),
    ]).nullable().optional(),
    aliases: z.union([
      z.string(),
      z.array(z.string()),
    ]).nullable().optional(),
  }),
});

/** Supports both folder (slug/index.md) and flat (slug.md). Id = folder name or filename. */
const pagesCollection = defineCollection({
  loader: glob({
    pattern: '**/*.{md,mdx}',
    base: './src/content/pages',
    generateId: (opts) => {
      const pathNoExt = opts.entry.replace(/\.(md|mdx)$/i, '');
      return pathNoExt.endsWith('/index') ? pathNoExt.replace(/\/index$/, '') : pathNoExt;
    },
  }),
  schema: z.object({
    title: z.string().default('Untitled Page'),
    description: z.string().nullable().optional().default('No description provided'),
    updated: z.coerce.date().nullable().optional(),
    showUpdated: z.boolean().optional().default(false),
    noIndex: z.boolean().optional(),
    hideTOC: z.boolean().optional(),
    draft: z.boolean().optional(),
    image: z.any().nullable().optional().transform((val) => {
      if (Array.isArray(val)) return val[0] || null;
      if (typeof val === 'string' && val.trim() !== '') return val;
      return null;
    }),
    imageAlt: z.string().nullable().optional(),
    imageOG: z.boolean().optional(),
    hideCoverImage: z.boolean().optional(),
    redirects: z.union([
      z.string(),
      z.array(z.string()),
    ]).nullable().optional(),
    aliases: z.union([
      z.string(),
      z.array(z.string()),
    ]).nullable().optional(),
  }).passthrough(),
});

const specialCollection = defineCollection({
  loader: glob({
    pattern: '**/*.{md,mdx}',
    base: './src/content/special',
    generateId: (opts) => {
      const pathNoExt = opts.entry.replace(/\.(md|mdx)$/i, '');
      return pathNoExt.endsWith('/index') ? pathNoExt.replace(/\/index$/, '') : pathNoExt;
    },
  }),
  schema: z.object({
    title: z.string().default('Untitled Page'),
    description: z.string().nullable().optional().default(''),
    updated: z.coerce.date().nullable().optional(),
    showUpdated: z.boolean().optional().default(false),
  }).passthrough(),
});

/** Supports both folder (slug/index.md) and flat (slug.md). Id = folder name or filename. */
const projectsCollection = defineCollection({
  loader: glob({
    pattern: '**/*.{md,mdx}',
    base: './src/content/projects',
    generateId: (opts) => {
      const pathNoExt = opts.entry.replace(/\.(md|mdx)$/i, '');
      return pathNoExt.endsWith('/index') ? pathNoExt.replace(/\/index$/, '') : pathNoExt;
    },
  }),
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
    date: z.coerce.date(),
    updated: z.coerce.date().nullable().optional(),
    categories: z.array(z.string()).optional(),
    tags: z.array(z.string()).optional(),
    draft: z.boolean().optional(),
    image: z.any().nullable().optional().transform((val) => {
      if (Array.isArray(val)) return val[0] || null;
      if (typeof val === 'string' && val.trim() !== '') return val;
      return null;
    }),
    imageAlt: z.string().nullable().optional(),
    imageOG: z.boolean().optional(),
    hideCoverImage: z.boolean().optional(),
    hideTOC: z.boolean().optional(),
    repositoryUrl: z.string().optional(),
    projectUrl: z.string().optional(),
    status: z.enum(['active', 'archived', 'wip']).optional(),
    featured: z.boolean().optional(),
    redirects: z.union([z.string(), z.array(z.string())]).nullable().optional(),
    aliases: z.union([z.string(), z.array(z.string())]).nullable().optional(),
  }),
});

/** Supports both folder (slug/index.md) and flat (slug.md). Id = folder name or filename. */
const docsCollection = defineCollection({
  loader: glob({
    pattern: '**/*.{md,mdx}',
    base: './src/content/docs',
    generateId: (opts) => {
      const pathNoExt = opts.entry.replace(/\.(md|mdx)$/i, '');
      return pathNoExt.endsWith('/index') ? pathNoExt.replace(/\/index$/, '') : pathNoExt;
    },
  }),
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
    category: z.string().optional(),
    order: z.coerce.number().optional().default(0),
    version: z.string().optional(),
    updated: z.coerce.date().nullable().optional(),
    lastModified: z.coerce.date().nullable().optional(),
    image: z.any().nullable().optional().transform((val) => {
      if (Array.isArray(val)) return val[0] || null;
      if (typeof val === 'string' && val.trim() !== '') return val;
      return null;
    }),
    imageAlt: z.string().nullable().optional(),
    imageOG: z.boolean().optional(),
    hideCoverImage: z.boolean().optional(),
    draft: z.boolean().optional(),
    featured: z.boolean().optional(),
    redirects: z.union([z.string(), z.array(z.string())]).nullable().optional(),
    aliases: z.union([z.string(), z.array(z.string())]).nullable().optional(),
  }),
});

const redirectsCollection = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/redirects' }),
  schema: z.object({
    title: z.string(),
    link: z.string(),
    indexed: z.boolean().optional().default(false),
    redirects: z.union([
      z.string(),
      z.array(z.string()),
    ]).nullable().optional(),
    aliases: z.union([
      z.string(),
      z.array(z.string()),
    ]).nullable().optional(),
  }).passthrough(),
});

// =============================================================================
// Custom content types (plugin-managed codegen)
// =============================================================================
// The Obsidian Axis Settings plugin may insert generated collection definitions
// between these markers. Do not edit inside the marked regions by hand.
//
// [CUSTOM_CONTENT_TYPES_COLLECTION_DEFS_START]
// (generated)
// [CUSTOM_CONTENT_TYPES_COLLECTION_DEFS_END]

export const collections = {
  posts: postsCollection,
  pages: pagesCollection,
  special: specialCollection,
  redirects: redirectsCollection,
  projects: projectsCollection,
  docs: docsCollection,

  // [CUSTOM_CONTENT_TYPES_COLLECTION_EXPORTS_START]
  // (generated)
  // [CUSTOM_CONTENT_TYPES_COLLECTION_EXPORTS_END]
};
