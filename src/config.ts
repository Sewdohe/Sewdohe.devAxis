// =============================================================================
// Axis Theme — Site Configuration
// =============================================================================
// [CONFIG:KEY] markers are used by the Obsidian Axis Settings plugin to
// identify config values it can control. Do not remove them.
// =============================================================================

export type ThemeName =
  | 'axis'
  | 'minimal'
  | 'oxygen'
  | 'dracula'
  | 'nord'
  | 'catppuccin'
  | 'rose-pine'
  | 'gruvbox'
  | 'everforest'
  | 'solarized'
  | 'ayu'
  | 'sky'
  | 'macos'
  | 'atom'
  | 'flexoki'
  | 'charcoal'
  | 'obsidian'
  | 'things';

export type CustomContentKind = 'pageLike' | 'postLike' | 'docLike';

export interface CustomContentType {
  /** Identifier used as the Astro content collection name (and default folder under src/content/). */
  id: string;
  /** Human-friendly label used for headings/nav. */
  label: string;
  /** URL base segment used for routes (e.g. "notes" => /notes/...). */
  routeBase: string;
  /** If false, the section is ignored (no routes generated). */
  enabled: boolean;
  /** Controls schema + layout selection. */
  kind: CustomContentKind;
  /** Include in command palette/search. */
  showInCommandPalette?: boolean;
  /** Show a preview block on homepage (implementation may vary by kind). */
  showOnHomepage?: boolean;
}

export interface SiteConfig {
  // ---- Core ----------------------------------------------------------------
  site: string;
  title: string;
  /** Homepage-specific meta title. Falls back to title if empty. [CONFIG:HOMEPAGE_TITLE] */
  homepageTitle: string;
  author: string;
  description: string;
  /** Language code for the HTML lang attribute.       [CONFIG:LANGUAGE] */
  language: string;
  /** If true, favicon switches between light/dark variants based on browser theme. [CONFIG:FAVICON_THEME_ADAPTIVE] */
  faviconThemeAdaptive: boolean;
  /** @deprecated Use postOptions.postsPerPage instead. Kept for back-compat. */
  postsPerPage: number;
  recentPostsCount: number;
  /** Navigation pages (header + command palette). Use showInNav: false to hide from header but keep in palette (e.g. Home). */
  pages: Array<{ title: string; url: string; icon: string; showInNav?: boolean; children?: Array<{ title: string; url: string; icon?: string }> }>;

  // ---- Theme ---------------------------------------------------------------
  /** Active color theme.                              [CONFIG:THEME] */
  theme: ThemeName;
  /** Themes exposed in the selector. "all" shows all. [CONFIG:AVAILABLE_THEMES] */
  availableThemes: ThemeName[] | 'all';

  // ---- Layout --------------------------------------------------------------
  layout: {
    /** Max content width (CSS length).                [CONFIG:LAYOUT_CONTENT_WIDTH] */
    contentWidth: string;
  };

  // ---- Fonts ---------------------------------------------------------------
  fonts: {
    /** "local" = self-hosted @fontsource, "cdn" = Google Fonts, "astro" = Astro Font API. [CONFIG:FONTS_SOURCE] */
    source: 'local' | 'cdn' | 'astro';
    families: {
      /** Body text font family.                       [CONFIG:FONT_BODY] */
      body: string;
      /** Heading font family.                         [CONFIG:FONT_HEADING] */
      heading: string;
      /** Monospace font family.                       [CONFIG:FONT_MONO] */
      mono: string;
    };
    /** Font-display strategy.                         [CONFIG:FONT_DISPLAY] */
    display: 'swap' | 'fallback' | 'optional';
  };

  // ---- Navigation ----------------------------------------------------------
  navigation: {
    /**
     * Header nav style.                               [CONFIG:NAVIGATION_STYLE]
     * - "minimal"     — nav links hidden; only visible via command palette
     * - "traditional" — nav links shown in header (default)
     */
    style: 'minimal' | 'traditional';
    /**
     * Mobile nav style.                               [CONFIG:MOBILE_NAV_STYLE]
     * - "minimal"     — no mobile nav; use command palette (default)
     * - "traditional" — hamburger menu with slide-out drawer
     */
    mobileNav?: 'minimal' | 'traditional';
    /** Social icon links shown in the header.         [] */
    social: Array<{ title: string; url: string; icon: string; showInFooter?: boolean }>;
    /** Show social icons next to theme/search buttons.[CONFIG:NAVIGATION_SHOW_SOCIAL_IN_HEADER] */
    showSocialInHeader: boolean;
  };

  // ---- Feature Button ------------------------------------------------------
  /**
   * What the primary floating/header action button does. [CONFIG:FEATURE_BUTTON]
   * - "mode"  — dark/light mode toggle
   * - "graph" — open local graph view
   * - "theme" — open theme selector
   * - "none"  — no button shown
   */
  featureButton: 'mode' | 'graph' | 'theme' | 'none';

  // ---- Features ------------------------------------------------------------
  features: {
    /** Dark/light mode toggle button.                 [CONFIG:FEATURE_DARK_MODE] */
    darkMode: boolean;
    /** Scroll-to-top button.                          [CONFIG:FEATURE_SCROLL_TO_TOP] */
    scrollToTop: boolean;
    /** Show reading time on posts.                    [CONFIG:FEATURE_READING_TIME] */
    readingTime: boolean;
    /** Show word count on posts.                      [CONFIG:FEATURE_WORD_COUNT] */
    wordCount: boolean;
    /** Table of contents on posts.                    [CONFIG:FEATURE_TOC] */
    tableOfContents: boolean;
    /** Max heading depth shown in TOC (2-4).          [CONFIG:FEATURE_TOC_DEPTH] */
    tocDepth: number;
    /** Prev/next post navigation links.               [CONFIG:FEATURE_POST_NAVIGATION] */
    postNavigation: boolean;
    /** Related posts section.                         [CONFIG:FEATURE_RELATED_POSTS] */
    relatedPosts: boolean;
    /** Linked mentions / backlinks component.         [CONFIG:FEATURE_LINKED_MENTIONS] */
    linkedMentions: boolean;
    /** D3 local knowledge graph.                      [CONFIG:FEATURE_LOCAL_GRAPH] */
    localGraph: boolean;
    /** Show local graph on post pages.                [CONFIG:FEATURE_LOCAL_GRAPH_POSTS] */
    localGraphPosts?: boolean;
    /** Show local graph on page pages.                [CONFIG:FEATURE_LOCAL_GRAPH_PAGES] */
    localGraphPages?: boolean;
    /** Show local graph on project pages.            [CONFIG:FEATURE_LOCAL_GRAPH_PROJECTS] */
    localGraphProjects?: boolean;
    /** Show local graph on doc pages.                 [CONFIG:FEATURE_LOCAL_GRAPH_DOCS] */
    localGraphDocs?: boolean;
    /** Image gallery with lightbox.                   [CONFIG:FEATURE_IMAGE_GALLERY] */
    imageGallery: boolean;
    /** Site-wide search via command palette.          [CONFIG:FEATURE_SEARCH] */
    search: boolean;
  };

  // ---- Command Palette ------------------------------------------------------
  /** Enable the command palette.                      [CONFIG:COMMAND_PALETTE_ENABLED] */
  commandPaletteEnabled: boolean;
  /** Keyboard shortcut for command palette.           [CONFIG:COMMAND_PALETTE_SHORTCUT] */
  commandPaletteShortcut: string;
  /** Show actions group in command palette.           [CONFIG:COMMAND_PALETTE_ACTIONS] */
  commandPaletteActions: boolean;
  /** Show pages group in command palette.             [CONFIG:COMMAND_PALETTE_PAGES] */
  commandPalettePages: boolean;
  /** Show social group in command palette.            [CONFIG:COMMAND_PALETTE_SOCIAL] */
  commandPaletteSocial: boolean;

  // ---- Graph Options --------------------------------------------------------
  /** Enable the graph view.                           [CONFIG:GRAPH_ENABLED] */
  graphEnabled: boolean;
  /** Show graph view in the command palette.           [CONFIG:GRAPH_IN_COMMAND_PALETTE] */
  graphInCommandPalette: boolean;
  /** Max nodes shown in graph view.                   [CONFIG:GRAPH_MAX_NODES] */
  graphMaxNodes: number;
  /** Show orphan nodes in graph view.                 [CONFIG:GRAPH_SHOW_ORPHANS] */
  graphShowOrphans: boolean;

  // ---- Post Options --------------------------------------------------------
  postOptions: {
    /** Posts per page on the /posts listing.          [CONFIG:POST_OPTIONS_POSTS_PER_PAGE] */
    postsPerPage: number;
    /** Show cover image hero at top of post pages.    [CONFIG:POST_OPTIONS_SHOW_COVER_IMAGE] */
    showCoverImage: boolean;
    /**
     * Where to show cover images on post cards.       [CONFIG:POST_OPTIONS_SHOW_POST_CARD_COVER_IMAGES]
     * - "all"               — everywhere (featured hero + all listing cards)
     * - "featured"          — only the featured/hero card on homepage
     * - "home"              — all cards on homepage only
     * - "posts"             — cards on the /posts listing page only
     * - "featured-and-posts"— featured hero + /posts listing
     * - "none"              — no cover images on any cards
     */
    showPostCardCoverImages: 'all' | 'featured' | 'home' | 'posts' | 'featured-and-posts' | 'none';
    /**
     * Aspect ratio for post cards with cover images.  [CONFIG:POST_OPTIONS_POST_CARD_ASPECT_RATIO]
     * Options: "16:9" | "4:3" | "3:2" | "og" | "square" | "golden" | "custom"
     */
    postCardAspectRatio: '16:9' | '4:3' | '3:2' | 'og' | 'square' | 'golden' | 'custom';
    /** CSS ratio string when postCardAspectRatio is "custom" (e.g. "2.5/1"). */
    customPostCardAspectRatio?: string;
    /** Show tags on post pages (same line as date, read time). [CONFIG:POST_OPTIONS_SHOW_TAGS] */
    showTags: boolean;
  };

  // ---- Profile Picture -----------------------------------------------------
  profilePicture: {
    /** Show profile picture / bio card.               [CONFIG:PROFILE_PICTURE_ENABLED] */
    enabled: boolean;
    /** Display name on profile card (falls back to author). [CONFIG:PROFILE_PICTURE_NAME] */
    name?: string;
    /** Bio text on profile card (falls back to site description). [CONFIG:PROFILE_PICTURE_BIO] */
    bio?: string;
    /** Path to profile image (relative to public/).   [CONFIG:PROFILE_PICTURE_IMAGE] */
    image: string;
    /** Alt text for the profile image.                [CONFIG:PROFILE_PICTURE_ALT] */
    alt: string;
    /** Size of the profile image.                     [CONFIG:PROFILE_PICTURE_SIZE] */
    size: 'sm' | 'md' | 'lg';
    /** Optional URL to link the profile image to.     [CONFIG:PROFILE_PICTURE_URL] */
    url?: string;
    /**
     * Where the profile card is shown.                [CONFIG:PROFILE_PICTURE_PLACEMENT]
     * - "homepage" — above/near posts on the homepage
     * - "footer"   — inside the site footer
     * - "header"   — inside the site header
     */
    placement: 'homepage' | 'footer' | 'header';
    /** Shape style for the profile image.             [CONFIG:PROFILE_PICTURE_STYLE] */
    style: 'circle' | 'square' | 'none';
  };

  // ---- Footer --------------------------------------------------------------
  footer: {
    /** Show the site footer.                          [CONFIG:FOOTER_ENABLED] */
    enabled: boolean;
    /**
     * Footer text. Supports {author} and {year} placeholders.
     * HTML links allowed.                             [CONFIG:FOOTER_CONTENT]
     */
    content: string;
    /** Show social icons in the footer.               [CONFIG:FOOTER_SHOW_SOCIAL_ICONS] */
    showSocialIcons: boolean;
  };

  // ---- Content Types -------------------------------------------------------
  contentTypes: {
    /** Enable /projects section.                      [CONFIG:CONTENT_TYPES_PROJECTS] */
    projects: boolean;
    /** Enable /docs section.                          [CONFIG:CONTENT_TYPES_DOCS] */
    docs: boolean;
  };

  // ---- Routes / URL bases --------------------------------------------------
  routes?: {
    /** Base segment for posts listing/detail URLs (default: "posts").     [CONFIG:ROUTES_POSTS_BASE] */
    postsBase?: string;
    /** Base segment for projects listing/detail URLs (default: "projects"). [CONFIG:ROUTES_PROJECTS_BASE] */
    projectsBase?: string;
    /** Base segment for docs listing/detail URLs (default: "docs").       [CONFIG:ROUTES_DOCS_BASE] */
    docsBase?: string;
  };

  // ---- Custom Content Types ------------------------------------------------
  /**
   * User-defined content sections (new collections + routes).
   * This is plugin-managed.                                                 [CONFIG_BLOCK:CUSTOM_CONTENT_TYPES]
   */
  customContentTypes?: CustomContentType[];

  // ---- Homepage ------------------------------------------------------------
  home: {
    /**
     * Homepage layout variant.                        [CONFIG:HOME_LAYOUT]
     * - "minimal"  — simple recent posts list + blurb (default)
     * - "featured" — hero featured post card + recent posts list
     * - "grid"     — 2-column PostCard grid with cover images
     * - "magazine" — large hero PostCard + 2-column grid below (most visual)
     */
    layout: 'minimal' | 'featured' | 'grid' | 'magazine';
    /** Show the blurb from special/home.md.           [CONFIG:HOME_SHOW_BLURB] */
    showBlurb: boolean;
    /** Show a Projects section on the homepage.       [CONFIG:HOME_SHOW_PROJECTS] */
    showProjects: boolean;
    /** Show a Docs section on the homepage.           [CONFIG:HOME_SHOW_DOCS] */
    showDocs: boolean;
    /**
     * Pin a specific post as the hero for featured/magazine layouts.
     * If omitted, the most recent post is used.       [CONFIG:HOME_FEATURED_POST_SLUG]
     */
    featuredPostSlug?: string;
  };

  // ---- Deployment ----------------------------------------------------------
  deployment: {
    /** Target hosting platform.                       [CONFIG:DEPLOYMENT_PLATFORM] */
    platform: 'netlify' | 'vercel' | 'cloudflare' | 'github-pages';
  };

  /**
   * Custom HTML/script injected by Axis Settings. Use for analytics or other third-party code.
   * head: injected at end of <head>. bodyEnd: injected before </body>.   [CONFIG:SNIPPETS_HEAD] / [CONFIG:SNIPPETS_BODY_END]
   */
  snippets?: {
    /** Raw HTML/script injected at end of <head>. */
    head: string;
    /** Raw HTML/script injected before </body>. */
    bodyEnd: string;
  };

  /**
   * When true, show a minimal EU-style cookie choice. Header/footer snippets run only if user chooses "Accept all".
   * Off by default.                                    [CONFIG:COOKIE_CONSENT_ENABLED]
   */
  cookieConsentEnabled?: boolean;

  // ---- Analytics -----------------------------------------------------------
  // ---- OG Image Alt ---------------------------------------------------------
  /** Alt text for the default Open Graph image.       [CONFIG:DEFAULT_OG_IMAGE_ALT] */
  defaultOgImageAlt: string;

  /** GoatCounter site code (e.g. "yoursite" for yoursite.goatcounter.com). Leave empty to disable. [CONFIG:ANALYTICS_GOATCOUNTER_CODE] */
  analytics?: { goatcounterCode: string };
}

export const siteConfig: SiteConfig = {
  // ---- Core ----------------------------------------------------------------
  language: 'en',                             // [CONFIG:LANGUAGE]
  site: 'https://sewdohe.dev',             // [CONFIG:SITE_URL]
  title: 'Sewdohe.dev',                         // [CONFIG:SITE_TITLE]
  homepageTitle: 'Sewdohe - Personal Blog & Portfolio',                      // [CONFIG:HOMEPAGE_TITLE]
  author: 'Sewdohe',                        // [CONFIG:SITE_AUTHOR]
  description: 'My personal blog and portfolio website.', // [CONFIG:SITE_DESCRIPTION]
  faviconThemeAdaptive: true, // [CONFIG:FAVICON_THEME_ADAPTIVE]
  postsPerPage: 20,
  recentPostsCount: 7,
  // [CONFIG:PAGES]
  pages: [
    { title: 'Home', url: '/', icon: 'home', showInNav: false },
    { title: 'Posts', url: '/posts/', icon: 'pencil-square' },
    { title: 'Projects', url: '/projects/', icon: 'folder', children: [{ title: 'NaviBot', url: '/projects/navibot-discord-engine/' }] },
    { title: 'Docs', url: '/docs/', icon: 'book', children: [{ title: 'Navibot Development', url: '/docs/navibot-development-guide/' }] },
    { title: 'About', url: '/about/', icon: 'user-circle' },
    { title: 'Buy', url: 'https://store.davidvkimball.com/checkout/buy/b942a935-bc8b-4389-a50a-c8aada83002f', icon: 'shopping-bag', showInNav: false }
  ],

  // ---- Theme ---------------------------------------------------------------
  theme: 'catppuccin',            // [CONFIG:THEME]
  availableThemes: 'all',     // [CONFIG:AVAILABLE_THEMES]

  // ---- Layout --------------------------------------------------------------
  layout: {
    contentWidth: '42rem',    // [CONFIG:LAYOUT_CONTENT_WIDTH]
  },

  // ---- Fonts ---------------------------------------------------------------
  fonts: {
    source: 'astro',          // [CONFIG:FONTS_SOURCE]
    families: {
      body: 'Plus Jakarta Sans', // [CONFIG:FONT_BODY]
      heading: 'Merriweather',   // [CONFIG:FONT_HEADING]
      mono: 'JetBrains Mono',    // [CONFIG:FONT_MONO]
    },
    display: 'optional',      // [CONFIG:FONT_DISPLAY]
  },

  // ---- Navigation ----------------------------------------------------------
  navigation: {
    style: 'traditional',     // [CONFIG:NAVIGATION_STYLE]
    mobileNav: 'traditional',     // [CONFIG:MOBILE_NAV_STYLE]
    showSocialInHeader: false, // [CONFIG:NAVIGATION_SHOW_SOCIAL_IN_HEADER]
    // [CONFIG:NAVIGATION_SOCIAL]
    social: [
      { title: 'GitHub', url: 'https://github.com/davidvkimball', icon: 'github' },
      { title: 'Discord', url: 'https://discord.gg/KK287qAdFB', icon: 'discord' },
      { title: 'BlueSky', url: 'https://bsky.app/profile/divnectar.com', icon: 'bluesky' }
    ],
  },

  // ---- Feature Button ------------------------------------------------------
  featureButton: 'graph',     // [CONFIG:FEATURE_BUTTON]

  // ---- Features ------------------------------------------------------------
  features: {
    darkMode: true,           // [CONFIG:FEATURE_DARK_MODE]
    scrollToTop: true,        // [CONFIG:FEATURE_SCROLL_TO_TOP]
    readingTime: true,        // [CONFIG:FEATURE_READING_TIME]
    wordCount: false,         // [CONFIG:FEATURE_WORD_COUNT]
    tableOfContents: true,    // [CONFIG:FEATURE_TOC]
    tocDepth: 3,              // [CONFIG:FEATURE_TOC_DEPTH]
    postNavigation: true,     // [CONFIG:FEATURE_POST_NAVIGATION]
    relatedPosts: false,       // [CONFIG:FEATURE_RELATED_POSTS]
    linkedMentions: true,     // [CONFIG:FEATURE_LINKED_MENTIONS]
    localGraph: true,         // [CONFIG:FEATURE_LOCAL_GRAPH]
    localGraphPosts: true,    // [CONFIG:FEATURE_LOCAL_GRAPH_POSTS]
    localGraphPages: true,    // [CONFIG:FEATURE_LOCAL_GRAPH_PAGES]
    localGraphProjects: true, // [CONFIG:FEATURE_LOCAL_GRAPH_PROJECTS]
    localGraphDocs: true,     // [CONFIG:FEATURE_LOCAL_GRAPH_DOCS]
    imageGallery: true,       // [CONFIG:FEATURE_IMAGE_GALLERY]
    search: true,             // [CONFIG:FEATURE_SEARCH]
  },

  // ---- Command Palette ------------------------------------------------------
  commandPaletteEnabled: true,                 // [CONFIG:COMMAND_PALETTE_ENABLED]
  commandPaletteShortcut: 'k',                // [CONFIG:COMMAND_PALETTE_SHORTCUT]
  commandPaletteActions: true,                // [CONFIG:COMMAND_PALETTE_ACTIONS]
  commandPalettePages: true,                  // [CONFIG:COMMAND_PALETTE_PAGES]
  commandPaletteSocial: true,                 // [CONFIG:COMMAND_PALETTE_SOCIAL]

  // ---- Graph Options --------------------------------------------------------
  graphEnabled: true,                          // [CONFIG:GRAPH_ENABLED]
  graphInCommandPalette: true,                 // [CONFIG:GRAPH_IN_COMMAND_PALETTE]
  graphMaxNodes: 100,                         // [CONFIG:GRAPH_MAX_NODES]
  graphShowOrphans: true,                     // [CONFIG:GRAPH_SHOW_ORPHANS]

  // ---- Post Options --------------------------------------------------------
  postOptions: {
    postsPerPage: 20,         // [CONFIG:POST_OPTIONS_POSTS_PER_PAGE]
    showCoverImage: true,     // [CONFIG:POST_OPTIONS_SHOW_COVER_IMAGE]
    showPostCardCoverImages: 'home', // [CONFIG:POST_OPTIONS_SHOW_POST_CARD_COVER_IMAGES]
    postCardAspectRatio: 'og', // [CONFIG:POST_OPTIONS_POST_CARD_ASPECT_RATIO]
    customPostCardAspectRatio: '2.5/1', // [CONFIG:POST_OPTIONS_CUSTOM_POST_CARD_ASPECT_RATIO]
    showTags: false, // [CONFIG:POST_OPTIONS_SHOW_TAGS]
  },

  // ---- Profile Picture -----------------------------------------------------
  profilePicture: {
    enabled: true,           // [CONFIG:PROFILE_PICTURE_ENABLED]
    name: 'Sewdohe',                // [CONFIG:PROFILE_PICTURE_NAME]
    bio: 'I\'m a mechanic by trade, but a developer and creator by hobby. Linux user for over 10 years now 🦾',                 // [CONFIG:PROFILE_PICTURE_BIO]
    image: '/assets/profile.jpg', // [CONFIG:PROFILE_PICTURE_IMAGE]
    alt: 'Profile picture',   // [CONFIG:PROFILE_PICTURE_ALT]
    size: 'md',               // [CONFIG:PROFILE_PICTURE_SIZE]
    url: '/about/',                  // [CONFIG:PROFILE_PICTURE_URL]
    placement: 'footer',    // [CONFIG:PROFILE_PICTURE_PLACEMENT]
    style: 'circle',          // [CONFIG:PROFILE_PICTURE_STYLE]
  },

  // ---- Footer --------------------------------------------------------------
  footer: {
    enabled: true,            // [CONFIG:FOOTER_ENABLED]
    content: '© {year} {author}. Powered by <a href="https://astro.build" target="_blank" style="color:var(--accent);font-weight:500;">Astro</a>, <a href="https://store.davidvkimball.com/checkout/buy/b942a935-bc8b-4389-a50a-c8aada83002f" target="_blank" style="color:var(--accent);font-weight:500;">Axis</a>, & <a href="https://vaultcms.org" target="_blank" style="color:var(--accent);font-weight:500;">Vault CMS</a>.', // [CONFIG:FOOTER_CONTENT]
    showSocialIcons: true,   // [CONFIG:FOOTER_SHOW_SOCIAL_ICONS]
  },

  // ---- Content Types -------------------------------------------------------
  contentTypes: {
    projects: true,           // [CONFIG:CONTENT_TYPES_PROJECTS]
    docs: true,               // [CONFIG:CONTENT_TYPES_DOCS]
  },

  // ---- Routes / URL bases --------------------------------------------------
  routes: {
    postsBase: 'posts',       // [CONFIG:ROUTES_POSTS_BASE]
    projectsBase: 'projects', // [CONFIG:ROUTES_PROJECTS_BASE]
    docsBase: 'docs',         // [CONFIG:ROUTES_DOCS_BASE]
  },

  // ---- Custom Content Types ------------------------------------------------
  // [CONFIG_BLOCK:CUSTOM_CONTENT_TYPES]
  // [CUSTOM_CONTENT_TYPES_START]
  customContentTypes: [],
  // [CUSTOM_CONTENT_TYPES_END]

  // ---- Homepage ------------------------------------------------------------
  home: {
    layout: 'magazine',        // [CONFIG:HOME_LAYOUT]
    showBlurb: true,          // [CONFIG:HOME_SHOW_BLURB]
    showProjects: true,       // [CONFIG:HOME_SHOW_PROJECTS]
    showDocs: true,           // [CONFIG:HOME_SHOW_DOCS]
    featuredPostSlug: 'hello-world',     // [CONFIG:HOME_FEATURED_POST_SLUG]
  },

  // ---- Deployment ----------------------------------------------------------
  deployment: {
    platform: 'netlify',      // [CONFIG:DEPLOYMENT_PLATFORM]
  },

  // ---- Snippets (Header / Footer code from Axis Settings) -------------------
  snippets: {
    head: '',                 // [CONFIG:SNIPPETS_HEAD]
    bodyEnd: '',              // [CONFIG:SNIPPETS_BODY_END]
  },

  cookieConsentEnabled: true,       // [CONFIG:COOKIE_CONSENT_ENABLED]

  // ---- OG Image Alt ---------------------------------------------------------
  defaultOgImageAlt: '',                      // [CONFIG:DEFAULT_OG_IMAGE_ALT]

  // ---- Analytics -----------------------------------------------------------
  analytics: {
    goatcounterCode: '',  // [CONFIG:ANALYTICS_GOATCOUNTER_CODE] Set to your GoatCounter code (e.g. yoursite for yoursite.goatcounter.com) to enable.
  },
};

// =============================================================================
// Utility functions
// =============================================================================

/** Resolve the CSS aspect-ratio string from config. */
export function getPostCardAspectRatio(): string {
  const { postCardAspectRatio, customPostCardAspectRatio } = siteConfig.postOptions;
  const map: Record<string, string> = {
    '16:9': '16 / 9',
    '4:3': '4 / 3',
    '3:2': '3 / 2',
    'og': '1.91 / 1',
    'square': '1 / 1',
    'golden': '1.618 / 1',
    'custom': customPostCardAspectRatio || '1.91 / 1',
  };
  return map[postCardAspectRatio] ?? '1.91 / 1';
}

/** Resolve effective posts-per-page (postOptions takes priority). */
export function getPostsPerPage(): number {
  return siteConfig.postOptions?.postsPerPage ?? siteConfig.postsPerPage ?? 20;
}

/** Base site URL without trailing slash. */
export function getSiteBase(): string {
  return siteConfig.site.replace(/\/+$/, '');
}

/** Full URL for a path, with trailing slash. */
export function siteUrl(path: string): string {
  const base = getSiteBase();
  const p = path.replace(/^\/+/, '').replace(/\/+$/, '') || '';
  return p ? `${base}/${p}/` : `${base}/`;
}

/** Ensure canonical/og URL has trailing slash when it's a path (no file extension). */
export function ensureCanonicalUrl(url: string): string {
  try {
    const u = new URL(url);
    const pathname = u.pathname;
    const hasExtension = /\.[a-z0-9]+$/i.test(pathname);
    if (!pathname.endsWith('/') && !hasExtension) {
      u.pathname = pathname + '/';
      return u.href;
    }
    return url;
  } catch {
    return url;
  }
}

/** Build the Google Fonts URL for the configured font families (CDN mode). */
export function getGoogleFontsUrl(): string {
  const { body, heading, mono } = siteConfig.fonts.families;
  const set = new Set<string>();
  [body, heading, mono].forEach(f => { if (f?.trim()) set.add(f); });
  if (set.size === 0) return '';
  const list = [...set]
    .map(f => `${f.replace(/\s+/g, '+')}:wght@300;400;500;600;700`)
    .join('&family=');
  return `https://fonts.googleapis.com/css2?family=${list}&display=${siteConfig.fonts.display}`;
}

/** Get CSS font-family fallback string for a named font. */
export function getFontFamily(name: string): string {
  const serif = "Georgia, 'Times New Roman', serif";
  const mono = "'Monaco', 'Consolas', 'Courier New', monospace";
  const sans = "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
  const serifFonts = ['Playfair Display', 'Merriweather', 'Lora', 'Crimson Text', 'PT Serif', 'Libre Baskerville'];
  const monoFonts = ['JetBrains Mono', 'Fira Code', 'Source Code Pro', 'IBM Plex Mono'];
  if (serifFonts.includes(name)) return `'${name}', ${serif}`;
  if (monoFonts.includes(name)) return `'${name}', ${mono}`;
  return `'${name}', ${sans}`;
}

// =============================================================================
// Build-time validation
// =============================================================================

function validateSiteConfig(config: SiteConfig): void {
  const errors: string[] = [];

  if (!config.site || !config.site.startsWith('http')) {
    errors.push('site: must be a full URL starting with http(s).');
  }
  if (!config.title?.trim()) errors.push('title: cannot be empty.');
  if (!config.author?.trim()) errors.push('author: cannot be empty.');
  if (!config.description?.trim()) errors.push('description: cannot be empty.');

  // Theme validation: built-in themes are checked, custom themes are allowed
  // (custom themes are loaded dynamically from src/themes/custom/ at build time)
  if (!config.theme || !config.theme.trim()) {
    errors.push('theme: cannot be empty.');
  }

  if (!['local', 'cdn', 'astro'].includes(config.fonts.source)) {
    errors.push('fonts.source: must be "local", "cdn", or "astro".');
  }
  if (!config.fonts.families.body?.trim()) errors.push('fonts.families.body: cannot be empty.');
  if (!config.fonts.families.heading?.trim()) errors.push('fonts.families.heading: cannot be empty.');
  if (!config.fonts.families.mono?.trim()) errors.push('fonts.families.mono: cannot be empty.');

  if (!config.layout.contentWidth?.match(/^\d+(\.\d+)?(rem|px|em|ch|vw)$/)) {
    errors.push(`layout.contentWidth: "${config.layout.contentWidth}" must be a valid CSS length (e.g. "680px", "42rem").`);
  }

  const validNavStyles = ['minimal', 'traditional'];
  if (!validNavStyles.includes(config.navigation.style)) {
    errors.push('navigation.style: must be "minimal" or "traditional".');
  }

  const validLayouts = ['minimal', 'featured', 'grid', 'magazine'];
  if (!validLayouts.includes(config.home.layout)) {
    errors.push(`home.layout: "${config.home.layout}" is not valid. Use "minimal", "featured", "grid", or "magazine".`);
  }

  if (!['netlify', 'vercel', 'cloudflare', 'github-pages'].includes(config.deployment.platform)) {
    errors.push('deployment.platform: must be "netlify", "vercel", "cloudflare", or "github-pages".');
  }

  if (errors.length > 0) {
    throw new Error(
      `[Axis] Invalid site configuration:\n${errors.map(e => `  • ${e}`).join('\n')}\n\nFix these in src/config.ts.`
    );
  }
}

validateSiteConfig(siteConfig);
