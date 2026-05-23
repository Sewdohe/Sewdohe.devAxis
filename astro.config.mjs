import { defineConfig, fontProviders } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import sitemap from '@astrojs/sitemap';
import { siteConfig } from './src/config.ts';
import { remarkInternalLinks, remarkFolderImages, remarkImageCaptions } from './src/utils/internallinks.ts';
import remarkCallouts from './src/utils/remark-callouts.ts';
import remarkImageGrids from './src/utils/remark-image-grids.ts';
import remarkMermaid from './src/utils/remark-mermaid.ts';
import { remarkObsidianEmbeds } from './src/utils/remark-obsidian-embeds.ts';
import remarkInlineTags from './src/utils/remark-inline-tags.ts';
import { remarkObsidianComments } from './src/utils/remark-obsidian-comments.ts';
import remarkMath from 'remark-math';
import remarkObsidianDisplayMath from './src/utils/remark-obsidian-display-math.ts';
import remarkObsidianImageSize from './src/utils/remark-obsidian-image-size.ts';
import remarkBreaksSafe from './src/utils/remark-breaks-safe.ts';
import remarkStripTocHeading from './src/utils/remark-strip-toc-heading.ts';
import remarkStripFirstH1 from './src/utils/remark-strip-first-h1.ts';
import { remarkExtendedEmbeds } from './src/utils/remark-extended-embeds.ts';
import remarkDirective from 'remark-directive';
import { parseDirectiveNode } from './src/utils/remark-directive-rehype.js';
import rehypeKatex from 'rehype-katex';
import rehypeMark from './src/utils/rehype-mark.ts';
import rehypeImageAttributes from './src/utils/rehype-image-attributes.ts';
import rehypeFigureCaptions from './src/utils/rehype-figure-captions.ts';
import { rehypeNormalizeAnchors } from './src/utils/rehype-normalize-anchors.ts';
import rehypeSlug from 'rehype-slug';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';
import rehypeExternalLinks from 'rehype-external-links';
import rehypeComponents from 'rehype-components';
import { GithubCardComponent } from './src/utils/rehype-github-card.mjs';
import { fileURLToPath } from 'url';
import { getPropertyRedirects } from './src/utils/property-redirects.ts';

const propertyRedirects = getPropertyRedirects();

const fontDisplay = siteConfig.fonts.display || 'swap';
const astroFonts = siteConfig.fonts.source === 'astro' ? [
  { provider: fontProviders.google(), name: siteConfig.fonts.families.body, cssVariable: '--font-body', display: fontDisplay },
  { provider: fontProviders.google(), name: siteConfig.fonts.families.heading, cssVariable: '--font-heading', display: fontDisplay },
  { provider: fontProviders.google(), name: siteConfig.fonts.families.mono, cssVariable: '--font-mono', display: fontDisplay },
] : [];

export default defineConfig({
  site: siteConfig.site,
  trailingSlash: 'always',
  redirects: propertyRedirects,
  fonts: astroFonts,
  image: {
    service: {
      entrypoint: 'astro/assets/services/sharp',
      config: {
        limitInputPixels: false,
      }
    },
    remotePatterns: [{
      protocol: 'https'
    }]
  },
  integrations: [
    tailwind(),
    sitemap(),
  ],
  markdown: {
    remarkPlugins: [
      remarkDirective,
      parseDirectiveNode,
      remarkInternalLinks,
      remarkInlineTags,
      remarkObsidianComments,
      remarkFolderImages,
      remarkObsidianEmbeds,
      remarkObsidianImageSize,
      remarkImageCaptions,
      remarkMath,
      remarkObsidianDisplayMath,
      remarkCallouts,
      remarkBreaksSafe,
      remarkImageGrids,
      remarkMermaid,
      remarkStripTocHeading,
      remarkStripFirstH1,
      remarkExtendedEmbeds,
    ],
    rehypePlugins: [
      rehypeKatex,
      rehypeMark,
      rehypeImageAttributes,
      rehypeFigureCaptions,
      [rehypeComponents, {
        components: {
          github: GithubCardComponent,
        }
      }],
      [rehypeSlug, {
        test: (node) => node.tagName !== 'h1'
      }],
      [rehypeAutolinkHeadings, {
        behavior: 'wrap',
        test: (node) => node.tagName !== 'h1',
        properties: {
          className: ['anchor-link'],
          ariaLabel: 'Link to this section'
        }
      }],
      [rehypeExternalLinks, {
        target: '_blank',
        rel: [],
      }],
      rehypeNormalizeAnchors,
    ],
    syntaxHighlight: {
      type: 'shiki',
      excludeLangs: ['embed'],
    },
    shikiConfig: {
      theme: 'github-dark',
      wrap: true
    }
  },
  vite: {
    assetsInclude: ['**/*.base', '**/*.home', '**/*.base'],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
        '@/components': fileURLToPath(new URL('./src/components', import.meta.url)),
        '@/layouts': fileURLToPath(new URL('./src/layouts', import.meta.url)),
        '@/utils': fileURLToPath(new URL('./src/utils', import.meta.url)),
        '@/types': fileURLToPath(new URL('./src/types.ts', import.meta.url)),
        '@/config': fileURLToPath(new URL('./src/config.ts', import.meta.url))
      }
    },
    optimizeDeps: {
      include: [
        'medium-zoom',
        'fuse.js',
        'astro/virtual-modules/transitions-router.js',
        'astro/virtual-modules/transitions-events.js',
        'astro/virtual-modules/transitions-types.js',
        'astro/virtual-modules/transitions-swap-functions.js',
      ],
    },
    server: {
      watch: {
        ignored: ['**/.obsidian/**', '**/bases/**'],
        usePolling: process.platform === 'win32',
        interval: 1000
      }
    }
  }
});
