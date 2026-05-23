import type { Post, WikilinkMatch } from '@/types';
// NOTE: Must use a relative import here, not @/config — this file is loaded at Astro
// config time, before Vite's path alias resolution is active.
import { siteConfig } from '../config';
import { visit } from 'unist-util-visit';
import { readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function createSlugFromTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function decodeAnchorText(encodedText: string): string {
  try {
    return decodeURIComponent(encodedText);
  } catch {
    return encodedText;
  }
}

function createAnchorSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function parseLinkWithAnchor(linkText: string): { link: string; anchor: string | null } {
  const anchorIndex = linkText.indexOf('#');
  if (anchorIndex === -1) return { link: linkText, anchor: null };

  const link = linkText.substring(0, anchorIndex);
  const anchor = linkText.substring(anchorIndex + 1);
  const decodedAnchor = anchor ? decodeAnchorText(anchor) : null;
  return { link, anchor: decodedAnchor };
}

/** Ensure path has trailing slash (site uses trailingSlash: 'always'). Preserves hash. */
function ensureTrailingSlash(url: string): string {
  if (!url || url === '/' || url.startsWith('#')) return url;
  const hashIndex = url.indexOf('#');
  const path = hashIndex === -1 ? url : url.slice(0, hashIndex);
  const hash = hashIndex === -1 ? '' : url.slice(hashIndex);
  if (path.endsWith('/')) return url;
  return path + '/' + hash;
}

function isInsideCodeBlock(parent: any, tree: any): boolean {
  if (!parent) return false;
  if (parent.type === 'inlineCode' || parent.type === 'code') return true;
  let currentNode = parent;
  while (currentNode) {
    if (currentNode.type === 'inlineCode' || currentNode.type === 'code') return true;
    currentNode = currentNode.parent;
  }
  return false;
}

function isWikilinkInCode(content: string, wikilinkIndex: number): boolean {
  const codeBlockRegex = /```[\s\S]*?```/g;
  let codeBlockMatch;
  while ((codeBlockMatch = codeBlockRegex.exec(content)) !== null) {
    const codeBlockStart = codeBlockMatch.index;
    const codeBlockEnd = codeBlockMatch.index + codeBlockMatch[0].length;
    if (wikilinkIndex >= codeBlockStart && wikilinkIndex < codeBlockEnd) return true;
  }

  const backtickRegex = /`([^`]*)`/g;
  let match;
  while ((match = backtickRegex.exec(content)) !== null) {
    const codeStart = match.index;
    const codeEnd = match.index + match[0].length;
    if (wikilinkIndex >= codeStart && wikilinkIndex < codeEnd) return true;
  }
  return false;
}

function isInternalLink(url: string): boolean {
  url = url.trim();
  if (url.startsWith('http://') || url.startsWith('https://')) return false;
  if (url.startsWith('mailto:')) return false;
  if (url.startsWith('#')) return false;

  const { link } = parseLinkWithAnchor(url);

  return (
    link.endsWith('.md') ||
    link.startsWith('/posts/') ||
    link.startsWith('/pages/') ||
    link.startsWith('posts/') ||
    link.startsWith('pages/') ||
    link.startsWith('special/') ||
    link.startsWith('tags/') ||
    link.startsWith('/tags/') ||
    link.startsWith('redirects/') ||
    link.startsWith('/redirects/') ||
    !link.includes('/')
  );
}

function mapRelativeUrlToSiteUrl(url: string): string {
  if (url === '/index/' || url === '/index') return '/';
  if (url.startsWith('special/') || url.startsWith('/special/')) {
    const slug = url.replace(/^\/?special\//, '').replace(/\/index$/, '').replace(/\.md$/, '');
    if (SPECIAL_PAGE_URLS[slug] !== undefined) return SPECIAL_PAGE_URLS[slug];
    return `/${slug}`;
  }
  if (url.startsWith('/pages/')) {
    const pagePath = url.replace('/pages/', '');
    return `/${pagePath}`;
  }
  if (url.startsWith('pages/')) {
    const pagePath = url.replace('pages/', '');
    return `/${pagePath}`;
  }
  return url;
}

function extractLinkTextFromUrlWithAnchor(url: string): { linkText: string | null; anchor: string | null } {
  url = url.trim();
  const { link, anchor } = parseLinkWithAnchor(url);

  if (link.startsWith('posts/')) {
    let linkText = link.replace('posts/', '').replace(/\.md$/, '');
    if (linkText.endsWith('/index') && linkText.split('/').length === 2) {
      linkText = linkText.replace('/index', '');
    }
    return { linkText, anchor };
  }

  if (link.startsWith('/posts/')) {
    let linkText = link.replace('/posts/', '').replace(/\.md$/, '');
    if (linkText.endsWith('/index') && linkText.split('/').length === 2) {
      linkText = linkText.replace('/index', '');
    }
    return { linkText, anchor };
  }

  if (link.startsWith('/pages/')) {
    let linkText = link.replace('/pages/', '').replace(/\.md$/, '');
    if (linkText.endsWith('/index')) linkText = linkText.replace('/index', '');
    return { linkText: linkText === '' ? 'homepage' : linkText, anchor };
  }

  if (link.startsWith('pages/')) {
    let linkText = link.replace('pages/', '').replace(/\.md$/, '');
    if (linkText.endsWith('/index')) linkText = linkText.replace('/index', '');
    return { linkText: linkText === '' ? 'homepage' : linkText, anchor };
  }

  if (link.startsWith('special/') || link.startsWith('/special/')) {
    let linkText = link.replace(/^\/?special\//, '').replace(/\.md$/, '');
    if (linkText.endsWith('/index')) linkText = linkText.replace('/index', '');
    return { linkText, anchor };
  }

  if (link.endsWith('.md')) {
    let linkText = link.replace(/\.md$/, '');
    if (linkText.endsWith('/index') && linkText.split('/').length === 2) {
      linkText = linkText.replace('/index', '');
    }
    return { linkText, anchor };
  }

  if (!link.includes('/')) {
    return { linkText: link, anchor };
  }

  return { linkText: null, anchor: null };
}

// ============================================================================
// PAGE SLUG RESOLUTION (cached, scanned once at build time)
// ============================================================================

let _pageSlugs: Set<string> | null = null;

function getPageSlugs(): Set<string> {
  if (_pageSlugs) return _pageSlugs;
  try {
    const pagesDir = join(process.cwd(), 'src', 'content', 'pages');
    _pageSlugs = new Set(
      readdirSync(pagesDir).filter((entry) => {
        try { return statSync(join(pagesDir, entry)).isDirectory(); } catch { return false; }
      })
    );
  } catch {
    _pageSlugs = new Set();
  }
  return _pageSlugs;
}

// Special pages that resolve to root-level URLs (not in content/pages)
const SPECIAL_PAGE_URLS: Record<string, string> = {
  home: '/',
  posts: '/posts',
  '404': '/404',
};

// ============================================================================
// WIKILINKS (OBSIDIAN-STYLE) - POSTS, PAGES & SPECIAL PAGES
// ============================================================================

export function remarkWikilinks() {
  return function transformer(tree: any, file: any) {
    const nodesToReplace: Array<{ parent: any; index: number; newChildren: any[] }> = [];

    visit(tree, 'text', (node: any, index: any, parent: any) => {
      if (!node.value || typeof node.value !== 'string') return;
      if (isInsideCodeBlock(parent, tree)) return;

      const wikilinkRegex = /!?\[\[([^\]]+)\]\]/g;
      let match;
      const newChildren: any[] = [];
      let lastIndex = 0;
      let hasWikilinks = false;

      while ((match = wikilinkRegex.exec(node.value)) !== null) {
        hasWikilinks = true;
        const [fullMatch, content] = match;
        const isImageWikilink = fullMatch.startsWith('!');
        const [link, displayText] = content.includes('|')
          ? content.split('|', 2)
          : [content, null];

        if (match.index > lastIndex) {
          newChildren.push({ type: 'text', value: node.value.slice(lastIndex, match.index) });
        }

        const linkText = link.trim();
        const finalDisplayText = displayText ? displayText.trim() : linkText;

        if (isImageWikilink) {
          const imagePath = linkText;
          const altText = displayText || '';
          newChildren.push({
            type: 'image',
            url: imagePath,
            alt: altText,
            title: null,
            data: {
              hName: 'img',
              hProperties: { src: imagePath, alt: altText },
            },
          });
        } else {
          const { link: parsedLink, anchor } = parseLinkWithAnchor(linkText);
          const isSamePageAnchor = linkText.startsWith('#') || parsedLink === '';

          let url: string;
          let wikilinkData: string;

          if (isSamePageAnchor) {
            const anchorText = linkText.startsWith('#') ? linkText.substring(1) : linkText;
            const decodedAnchor = decodeAnchorText(anchorText);
            const anchorSlug = createAnchorSlug(decodedAnchor);
            url = `#${anchorSlug}`;
            wikilinkData = '';
          } else if (parsedLink.startsWith('tags/')) {
            const tagSlug = parsedLink.replace('tags/', '').replace(/\.md$/, '').replace(/\/index$/, '');
            url = `/posts/tag/${tagSlug}`;
            wikilinkData = tagSlug;
          } else if (parsedLink.startsWith('redirects/')) {
            const redirectSlug = parsedLink.replace('redirects/', '').replace(/\.md$/, '').replace(/\/index$/, '');
            url = `/${redirectSlug}`;
            wikilinkData = redirectSlug;
          } else if (parsedLink.startsWith('posts/')) {
            const postPath = parsedLink.replace('posts/', '');
            const cleanPath = postPath.endsWith('/index') && postPath.split('/').length === 2
              ? postPath.replace('/index', '')
              : postPath;
            url = `/posts/${cleanPath}`;
            wikilinkData = cleanPath;
          } else if (parsedLink.startsWith('pages/')) {
            const pagePath = parsedLink.replace('pages/', '').replace(/\.md$/, '');
            const cleanPath = pagePath.endsWith('/index') && pagePath.split('/').length === 2
              ? pagePath.replace('/index', '')
              : pagePath;
            url = `/${cleanPath}`;
            wikilinkData = cleanPath;
          } else if (parsedLink.includes('/')) {
            if (parsedLink.endsWith('/index') && parsedLink.split('/').length === 2) {
              const folderName = parsedLink.replace('/index', '');
              url = `/posts/${folderName}`;
              wikilinkData = folderName;
            } else {
              lastIndex = wikilinkRegex.lastIndex;
              continue;
            }
          } else {
            const slugifiedLink = createSlugFromTitle(parsedLink);
            const pageSlugs = getPageSlugs();

            if (pageSlugs.has(slugifiedLink)) {
              url = `/${slugifiedLink}`;
              wikilinkData = slugifiedLink;
            } else if (SPECIAL_PAGE_URLS[slugifiedLink] !== undefined) {
              url = SPECIAL_PAGE_URLS[slugifiedLink];
              wikilinkData = slugifiedLink;
            } else {
              url = `/posts/${slugifiedLink}`;
              wikilinkData = parsedLink.trim();
            }
          }

          if (anchor && !isSamePageAnchor) {
            const anchorSlug = createAnchorSlug(anchor);
            if (!url.includes('#')) url += `#${anchorSlug}`;
          }

          url = ensureTrailingSlash(url);

          newChildren.push({
            type: 'link',
            url,
            title: null,
            data: {
              hName: 'a',
              hProperties: {
                className: ['wikilink'],
                'data-wikilink': wikilinkData,
                'data-display-override': displayText,
              },
            },
            children: [{
              type: 'text',
              value: displayText || (isSamePageAnchor ? linkText.replace(/^#/, '') : parsedLink.trim()),
            }],
          });
        }

        lastIndex = wikilinkRegex.lastIndex;
      }

      if (lastIndex < node.value.length) {
        newChildren.push({ type: 'text', value: node.value.slice(lastIndex) });
      }

      if (hasWikilinks && parent && parent.children) {
        nodesToReplace.push({ parent, index, newChildren });
      }
    });

    nodesToReplace.reverse().forEach(({ parent, index, newChildren }) => {
      if (parent && parent.children && Array.isArray(parent.children)) {
        parent.children.splice(index, 1, ...newChildren);
      }
    });
  };
}

// ============================================================================
// STANDARD MARKDOWN LINKS - POSTS + PAGES
// ============================================================================

export function remarkStandardLinks() {
  return function transformer(tree: any, file: any) {
    visit(tree, 'link', (node: any) => {
      if (!node.url) return;

      // Same-page anchor links
      if (node.url.startsWith('#') && node.url.length > 1) {
        let anchorText = node.url.substring(1);
        try { anchorText = decodeURIComponent(anchorText); } catch {}
        const anchorSlug = createAnchorSlug(anchorText);
        const normalizedUrl = `#${anchorSlug}`;

        node.url = normalizedUrl;
        if (!node.data) node.data = {};
        if (!node.data.hProperties) node.data.hProperties = {};
        node.data.hProperties.href = normalizedUrl;
        node.data.hProperties.className = node.data.hProperties.className || [];
        if (!Array.isArray(node.data.hProperties.className)) {
          node.data.hProperties.className = [node.data.hProperties.className];
        }
        if (!node.data.hProperties.className.includes('wikilink')) {
          node.data.hProperties.className.push('wikilink');
        }
        return;
      }

      if (isInternalLink(node.url)) {
        const { linkText, anchor } = extractLinkTextFromUrlWithAnchor(node.url);
        if (linkText) {
          // Handle /pages/ URLs
          if (node.url.startsWith('/pages/') && !node.url.endsWith('.md') && !node.url.includes('.md#')) {
            let mappedUrl = mapRelativeUrlToSiteUrl(node.url);
            if (anchor && !mappedUrl.includes('#')) {
              mappedUrl += `#${createAnchorSlug(anchor)}`;
            }
            node.url = mappedUrl;
          }
          // Handle tag links (tags/foo.md → /posts/tag/foo)
          else if (node.url.startsWith('tags/') || node.url.startsWith('/tags/')) {
            const tagSlug = node.url.replace(/^\/?tags\//, '').replace(/\.md$/, '').replace(/\/index$/, '');
            node.url = `/posts/tag/${tagSlug}`;
            if (!node.data) node.data = {};
            if (!node.data.hProperties) node.data.hProperties = {};
            const existingClasses = node.data.hProperties.className || [];
            node.data.hProperties.className = Array.isArray(existingClasses)
              ? [...existingClasses, 'wikilink']
              : [existingClasses, 'wikilink'].filter(Boolean);
          }
          // Handle redirect links (redirects/book.md → /book)
          else if (node.url.startsWith('redirects/') || node.url.startsWith('/redirects/')) {
            const redirectSlug = node.url.replace(/^\/?redirects\//, '').replace(/\.md$/, '').replace(/\/index$/, '');
            node.url = `/${redirectSlug}`;
            if (!node.data) node.data = {};
            if (!node.data.hProperties) node.data.hProperties = {};
            const existingClasses = node.data.hProperties.className || [];
            node.data.hProperties.className = Array.isArray(existingClasses)
              ? [...existingClasses, 'wikilink']
              : [existingClasses, 'wikilink'].filter(Boolean);
          }
          // Handle .md file references
          else if (node.url.endsWith('.md') || node.url.includes('.md#')) {
            let baseUrl = '';
            // Strip .md extension and anything after (anchor is handled separately via `anchor`)
            const strippedUrl = node.url.replace(/\.md.*$/, '');

            if (linkText === 'homepage') {
              baseUrl = '/';
            } else if (strippedUrl.startsWith('special/') || strippedUrl.startsWith('/special/')) {
              baseUrl = mapRelativeUrlToSiteUrl(strippedUrl);
            } else if (strippedUrl.startsWith('posts/') || strippedUrl.startsWith('/posts/')) {
              let postPath = strippedUrl.replace(/^\/?posts\//, '');
              if (postPath.endsWith('/index') && postPath.split('/').length === 2) {
                postPath = postPath.replace(/\/index$/, '');
              }
              baseUrl = `/posts/${postPath}`;
            } else if (strippedUrl.startsWith('pages/') || strippedUrl.startsWith('/pages/')) {
              let pagePath = strippedUrl.replace(/^\/?pages\//, '');
              if (pagePath.endsWith('/index')) {
                pagePath = pagePath.replace(/\/index$/, '');
              }
              baseUrl = pagePath === '' ? '/' : `/${pagePath}`;
            } else if (strippedUrl.startsWith('../') || strippedUrl.startsWith('./')) {
              // Relative path (e.g., Obsidian exports like `../sibling-post/index.md`).
              // Strip leading ../ and ./ segments; resolve against the current collection.
              let cleanPath = strippedUrl.replace(/^(?:\.\.\/)+/, '').replace(/^\.\//, '');
              if (cleanPath.endsWith('/index') && cleanPath.split('/').length === 2) {
                cleanPath = cleanPath.replace(/\/index$/, '');
              }
              // Determine collection from the current file's path; default to posts.
              let collection: 'posts' | 'pages' = 'posts';
              if (file && (file as any).path) {
                const normalizedPath = String((file as any).path).replace(/\\/g, '/');
                if (normalizedPath.includes('/pages/')) collection = 'pages';
              }
              baseUrl = collection === 'pages' ? `/${cleanPath}` : `/posts/${cleanPath}`;
            } else {
              // Check built-in projects/docs and user-defined custom content types
              // before falling back to /posts/ for backward compatibility.
              const projectsBase = siteConfig.routes?.projectsBase ?? 'projects';
              const docsBase = siteConfig.routes?.docsBase ?? 'docs';
              const customType = siteConfig.customContentTypes?.find(
                (ct: any) => ct.enabled && (strippedUrl.startsWith(`${ct.id}/`) || strippedUrl.startsWith(`/${ct.id}/`))
              );

              if (strippedUrl.startsWith('projects/') || strippedUrl.startsWith('/projects/')) {
                let typePath = strippedUrl.replace(/^\/?projects\//, '');
                if (typePath.endsWith('/index')) typePath = typePath.replace(/\/index$/, '');
                baseUrl = `/${projectsBase}/${typePath}`;
              } else if (strippedUrl.startsWith('docs/') || strippedUrl.startsWith('/docs/')) {
                let typePath = strippedUrl.replace(/^\/?docs\//, '');
                if (typePath.endsWith('/index')) typePath = typePath.replace(/\/index$/, '');
                baseUrl = `/${docsBase}/${typePath}`;
              } else if (customType) {
                let typePath = strippedUrl.replace(new RegExp(`^\\/?${customType.id}\\/`), '');
                if (typePath.endsWith('/index')) typePath = typePath.replace(/\/index$/, '');
                baseUrl = `/${customType.routeBase}/${typePath}`;
              } else {
                // Assume posts for backward compatibility (bare `foo/index.md`)
                let cleanLinkText = (linkText || '').replace(/\/index$/, '');
                baseUrl = `/posts/${cleanLinkText}`;
              }
            }

            baseUrl = baseUrl.replace(/\/index$/, '');
            baseUrl = baseUrl.replace(/\/index#/, '#');

            if (anchor) {
              baseUrl += `#${createAnchorSlug(anchor)}`;
            }

            node.url = baseUrl.replace(/\/index(?=#|$)/g, '');
          } else {
            // Non-.md URLs
            if (node.url.startsWith('posts/')) {
              let postPath = node.url.replace('posts/', '');
              const pathWithoutAnchor = postPath.split('#')[0];
              const cleanPath = pathWithoutAnchor.replace(/\/index$/, '');
              let mappedUrl = `/posts/${cleanPath}`;
              if (anchor) mappedUrl += `#${createAnchorSlug(anchor)}`;
              node.url = mappedUrl;
            } else {
              let mappedUrl = mapRelativeUrlToSiteUrl(node.url);
              if (anchor && !mappedUrl.includes('#')) {
                mappedUrl += `#${createAnchorSlug(anchor)}`;
              }
              node.url = mappedUrl;
            }
          }

          // Clean /index from any /posts/ URL
          if (node.url && typeof node.url === 'string' && node.url.startsWith('/posts/')) {
            node.url = node.url.replace(/\/index(?=#|$)/g, '');
            node.url = node.url.replace(/\/index$/g, '');
          }

          if (node.url && typeof node.url === 'string' && node.url.startsWith('/')) {
            node.url = ensureTrailingSlash(node.url);
          }

          if (node.url && typeof node.url === 'string') {
            if (!node.data) node.data = {};
            if (!node.data.hProperties) node.data.hProperties = {};
            node.data.hProperties.href = node.url;
          }

          // Add wikilink styling to internal post links
          if (node.url.startsWith('/posts/') || (node.url.startsWith('posts/') && !node.url.startsWith('posts/posts/'))) {
            if (!node.data) node.data = {};
            if (!node.data.hProperties) node.data.hProperties = {};
            const existingClasses = node.data.hProperties.className || [];
            node.data.hProperties.className = Array.isArray(existingClasses)
              ? [...existingClasses, 'wikilink']
              : [existingClasses, 'wikilink'].filter(Boolean);
          }
        }
      }
    });
  };
}

// ============================================================================
// COMBINED LINK PROCESSING
// ============================================================================

export function remarkInternalLinks() {
  return function transformer(tree: any, file: any) {
    const wikilinkPlugin = remarkWikilinks();
    wikilinkPlugin(tree, file);

    const standardLinkPlugin = remarkStandardLinks();
    standardLinkPlugin(tree, file);
  };
}

// ============================================================================
// IMAGE PROCESSING
// ============================================================================

function convertToWebP(imagePath: string): string {
  if (!imagePath ||
      imagePath.startsWith('http') ||
      imagePath.toLowerCase().endsWith('.svg') ||
      imagePath.toLowerCase().endsWith('.webp')) {
    return imagePath;
  }
  return imagePath.replace(/\.(jpg|jpeg|png|gif|bmp|tiff|tif)$/i, '.webp');
}

export function remarkFolderImages() {
  return function transformer(tree: any, file: any) {
    visit(tree, 'image', (node: any) => {
      if (!node.url || node.url.startsWith('/') || node.url.startsWith('http')) return;

      // Skip non-image files
      const urlLower = node.url.toLowerCase();
      const nonImageExtensions = ['.mp3', '.wav', '.ogg', '.m4a', '.3gp', '.flac', '.aac',
                                  '.mp4', '.webm', '.ogv', '.mov', '.mkv', '.avi', '.pdf'];
      if (nonImageExtensions.some(ext => urlLower.endsWith(ext))) return;

      let collection: string | null = null;
      let contentSlug: string | null = null;
      let isFolderBased = false;

      if (file.path) {
        const normalizedPath = file.path.replace(/\\/g, '/');
        const pathParts = normalizedPath.split('/');

        if (normalizedPath.includes('/posts/')) {
          collection = 'posts';
          const postsIndex = pathParts.indexOf('posts');
          isFolderBased = normalizedPath.endsWith('/index.md');
          contentSlug = isFolderBased ? pathParts[postsIndex + 1] : null;
        } else if (normalizedPath.includes('/pages/')) {
          collection = 'pages';
          const pagesIndex = pathParts.indexOf('pages');
          isFolderBased = normalizedPath.endsWith('/index.md');
          contentSlug = isFolderBased ? pathParts[pagesIndex + 1] : null;
        }
      }

      let imagePath = node.url;
      if (imagePath.startsWith('./')) imagePath = imagePath.slice(2);

      if (!collection && imagePath.startsWith('attachments/')) {
        collection = 'pages';
      }

      if (!collection) return;

      if (isFolderBased && contentSlug) {
        let cleanImagePath = imagePath;
        if (cleanImagePath.startsWith('images/') || cleanImagePath.startsWith('attachments/')) {
          cleanImagePath = cleanImagePath.replace(/^(images|attachments)\//, '');
        }
        let finalUrl = `/${collection}/${contentSlug}/${cleanImagePath}`;
        finalUrl = convertToWebP(finalUrl);
        node.url = finalUrl;
      } else if (imagePath.startsWith('attachments/')) {
        let finalUrl = `/${collection}/${imagePath}`;
        finalUrl = convertToWebP(finalUrl);
        node.url = finalUrl;
      } else {
        let finalUrl = `/${collection}/attachments/${imagePath}`;
        finalUrl = convertToWebP(finalUrl);
        node.url = finalUrl;
      }

      if (node.data && node.data.hProperties) {
        node.data.hProperties.src = node.url;
      }
    });
  };
}

export function remarkImageCaptions() {
  return function transformer(tree: any) {
    visit(tree, 'image', (node: any) => {
      if (node.title) {
        if (!node.data) node.data = {};
        if (!node.data.hProperties) node.data.hProperties = {};
        node.data.hProperties['data-caption'] = node.title;
        node.data.hProperties.title = node.title;
      }
    });
  };
}

// ============================================================================
// LINKED MENTIONS (Backlinks)
// ============================================================================

function extractWikilinksFromBody(body: string): WikilinkMatch[] {
  const matches: WikilinkMatch[] = [];
  const regex = /\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g;
  let m;
  while ((m = regex.exec(body)) !== null) {
    const link = m[1];
    const display = m[2] || link;
    const slug = createSlugFromTitle(link.replace(/#.*$/, ''));
    matches.push({ link, display, slug });
  }
  return matches;
}

function extractStandardLinksFromBody(body: string): WikilinkMatch[] {
  const matches: WikilinkMatch[] = [];
  const regex = /\[([^\]]+)\]\(([^)]+)\)/g;
  let m;
  while ((m = regex.exec(body)) !== null) {
    const display = m[1];
    let url = m[2].replace(/#.*$/, '');
    // Only process internal post links
    if (url.startsWith('/posts/')) {
      url = url.replace('/posts/', '').replace(/\.md$/, '');
    } else if (!url.startsWith('http') && !url.startsWith('#')) {
      url = url.replace(/\.md$/, '');
    } else {
      continue;
    }
    // Strip folder prefixes and suffixes for proper slug matching
    // e.g. "posts/my-post/index.md" -> "my-post"
    url = url.replace(/^posts\//, '');
    url = url.replace(/\/index$/, '');
    url = url.replace(/\/$/, '');
    const slug = createSlugFromTitle(url);
    matches.push({ link: display, display, slug });
  }
  return matches;
}

export function findLinkedMentions(
  posts: Post[],
  targetSlug: string,
) {
  return posts
    .filter((post) => post.id !== targetSlug && post.body)
    .map((post) => {
      const wikilinks = extractWikilinksFromBody(post.body!);
      const standardLinks = extractStandardLinksFromBody(post.body!);
      const allLinks = [...wikilinks, ...standardLinks];
      const match = allLinks.find((link) => link.slug === targetSlug);
      if (!match) return null;
      return {
        title: post.data.title,
        slug: post.id,
        draft: post.data.draft ?? false,
      };
    })
    .filter(Boolean) as Array<{ title: string; slug: string; draft: boolean }>;
}
