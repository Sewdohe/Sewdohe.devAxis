import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

interface Redirect {
  from: string;
  to: string;
}

/**
 * Extracts redirects (old slugs/URLs) from YAML frontmatter.
 */
function extractRedirects(content: string): string[] {
  const frontmatterMatch = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!frontmatterMatch) return [];

  const frontmatter = frontmatterMatch[1];
  const redirectsMatch = frontmatter.match(/^redirects:\s*\r?\n((?:\s+-\s+.+\r?\n?)*)/m);
  if (!redirectsMatch) return [];

  return redirectsMatch[1]
    .split(/\r?\n/)
    .map(line => line.replace(/^\s+-\s+/, '').trim())
    .filter(Boolean);
}

/**
 * Extracts a frontmatter field value (simple string).
 */
function extractField(content: string, field: string): string | null {
  const frontmatterMatch = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!frontmatterMatch) return null;

  const regex = new RegExp(`^${field}:\\s*(.+)$`, 'm');
  const match = frontmatterMatch[1].match(regex);
  return match ? match[1].trim() : null;
}

/**
 * Scans a content directory for redirects (old slugs) in index.md files.
 */
function scanRedirectsFromContent(dir: string, urlPrefix: string): Redirect[] {
  const redirects: Redirect[] = [];
  try {
    const entries = readdirSync(dir);
    for (const entry of entries) {
      const entryPath = join(dir, entry);
      if (!statSync(entryPath).isDirectory()) continue;

      const indexPath = join(entryPath, 'index.md');
      try {
        const content = readFileSync(indexPath, 'utf-8');
        const redirectEntries = extractRedirects(content);
        for (const entrySlug of redirectEntries) {
          redirects.push({
            from: `${urlPrefix}/${entrySlug}`,
            to: `${urlPrefix}/${entry}`,
          });
        }
      } catch {}
    }
  } catch {}
  return redirects;
}

/**
 * Special pages have hardcoded URL mappings.
 */
const SPECIAL_PAGE_URLS: Record<string, string> = {
  home: '/',
  posts: '/posts',
  '404': '/404',
};

/**
 * Scans the special content directory for redirects (old slugs).
 */
function scanSpecialRedirects(dir: string): Redirect[] {
  const redirects: Redirect[] = [];
  try {
    const entries = readdirSync(dir);
    for (const entry of entries) {
      const entryPath = join(dir, entry);
      if (!statSync(entryPath).isDirectory()) continue;

      const targetUrl = SPECIAL_PAGE_URLS[entry];
      if (!targetUrl) continue;

      const indexPath = join(entryPath, 'index.md');
      try {
        const content = readFileSync(indexPath, 'utf-8');
        const redirectEntries = extractRedirects(content);
        for (const entrySlug of redirectEntries) {
          redirects.push({ from: `/${entrySlug}`, to: targetUrl });
        }
      } catch {}
    }
  } catch {}
  return redirects;
}

/**
 * Scans the redirects collection (src/content/redirects/*.md).
 * Each file has frontmatter: title, link.
 * Generates: /[filename] → [link]
 */
function scanRedirectsCollection(dir: string): Redirect[] {
  const redirects: Redirect[] = [];
  try {
    const files = readdirSync(dir).filter(f => f.endsWith('.md'));
    for (const file of files) {
      try {
        const content = readFileSync(join(dir, file), 'utf-8');
        const link = extractField(content, 'link');
        if (!link) continue;
        const slug = file.replace(/\.md$/, '');
        redirects.push({ from: `/${slug}`, to: link });

        // Redirects property on redirect files point to the same destination
        const redirectEntries = extractRedirects(content);
        for (const entrySlug of redirectEntries) {
          redirects.push({ from: `/${entrySlug}`, to: link });
        }
      } catch {}
    }
  } catch {}
  return redirects;
}

/**
 * Returns all dynamic redirects from all content sources.
 */
export function getAllDynamicRedirects(): Redirect[] {
  const cwd = process.cwd();
  return [
    ...scanRedirectsFromContent(join(cwd, 'src', 'content', 'posts'), '/posts'),
    ...scanRedirectsFromContent(join(cwd, 'src', 'content', 'projects'), '/projects'),
    ...scanRedirectsFromContent(join(cwd, 'src', 'content', 'docs'), '/docs'),
    ...scanRedirectsFromContent(join(cwd, 'src', 'content', 'pages'), ''),
    ...scanSpecialRedirects(join(cwd, 'src', 'content', 'special')),
    ...scanRedirectsCollection(join(cwd, 'src', 'content', 'redirects')),
  ];
}

/**
 * Ensure a path has a trailing slash (matches trailingSlash: 'always').
 */
function ensureTrailingSlash(path: string): string {
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  return path.endsWith('/') ? path : `${path}/`;
}

/**
 * Returns redirect map for Astro config.
 */
export function getPropertyRedirects(): Record<string, string> {
  const map: Record<string, string> = {};
  for (const r of getAllDynamicRedirects()) {
    map[ensureTrailingSlash(r.from)] = ensureTrailingSlash(r.to);
  }
  return map;
}
