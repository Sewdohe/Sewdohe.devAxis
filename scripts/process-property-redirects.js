#!/usr/bin/env node

import { promises as fs } from 'fs';
import path from 'path';

const isDev = process.env.NODE_ENV !== 'production';
const log = {
  info: (...args) => isDev && console.log(...args),
  error: (...args) => console.error(...args),
  warn: (...args) => console.warn(...args)
};

// Content directories scanned for redirects property (old slugs → redirects)
const CONTENT_DIRS = [
  { dir: 'src/content/posts', urlPrefix: '/posts' },
  { dir: 'src/content/pages', urlPrefix: '' },
];

// Special pages have hardcoded URL mappings
const SPECIAL_PAGE_URLS = {
  home: '/',
  social: '/social',
  posts: '/posts',
  '404': '/404',
};

const REDIRECTS_DIR = 'src/content/redirects';
const MARKER = '# === AUTO-GENERATED REDIRECTS (do not edit below) ===';

function parseFrontmatter(content) {
  const match = content.match(/^---\s*\r?\n([\s\S]*?)\r?\n---\s*\r?\n/);
  if (!match) return null;

  const frontmatterText = match[1];
  const frontmatter = {};
  const lines = frontmatterText.split(/\r?\n/);
  let currentKey = null;
  let currentValue = [];
  let inArray = false;

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed === '' || trimmed.startsWith('#')) continue;

    if (trimmed.includes(':') && (!inArray || !trimmed.startsWith('  '))) {
      if (currentKey) {
        frontmatter[currentKey] = currentValue.length === 1 ? currentValue[0] : currentValue;
      }

      const colonIndex = trimmed.indexOf(':');
      currentKey = trimmed.substring(0, colonIndex).trim();
      const value = trimmed.substring(colonIndex + 1).trim();
      inArray = false;

      if (value.startsWith('[')) {
        inArray = true;
        currentValue = [];
        if (value !== '[') {
          const arrayContent = value.substring(1, value.endsWith(']') ? value.length - 1 : value.length);
          if (arrayContent.trim()) {
            currentValue = arrayContent.split(',').map(item => item.trim().replace(/^["']|["']$/g, ''));
          }
          inArray = false;
        }
      } else if (value) {
        currentValue = [value.replace(/^["']|["']$/g, '')];
      } else {
        currentValue = [];
        inArray = true;
      }
    } else if (inArray && trimmed.startsWith('-')) {
      currentValue.push(trimmed.substring(1).trim().replace(/^["']|["']$/g, ''));
    } else if (inArray && trimmed === ']') {
      inArray = false;
    }
  }

  if (currentKey) {
    frontmatter[currentKey] = currentValue.length === 1 ? currentValue[0] : currentValue;
  }

  return frontmatter;
}

function getSlug(filePath, dir) {
  const normalized = filePath.replace(/\\/g, '/');
  const dirNormalized = dir.replace(/\\/g, '/');
  if (normalized.includes(dirNormalized)) {
    let slug = normalized.split(dirNormalized + '/')[1]?.replace(/\.md$/, '') || '';
    if (slug.endsWith('/index')) slug = slug.replace('/index', '');
    if (slug === 'index') slug = '';
    return slug;
  }
  return null;
}

async function findMarkdownFiles(dirPath) {
  const files = [];
  try {
    const items = await fs.readdir(dirPath, { withFileTypes: true });
    for (const item of items) {
      const fullPath = path.join(dirPath, item.name);
      if (item.isDirectory()) {
        const indexPath = path.join(fullPath, 'index.md');
        try {
          await fs.access(indexPath);
          files.push(indexPath);
        } catch {
          const nested = await findMarkdownFiles(fullPath);
          files.push(...nested);
        }
      } else if (item.isFile() && item.name.endsWith('.md')) {
        files.push(fullPath);
      }
    }
  } catch (error) {
    if (error.code !== 'ENOENT') {
      log.warn(`Warning: Could not read directory ${dirPath}:`, error.message);
    }
  }
  return files;
}

// ============================================================================
// COLLECT REDIRECTS FROM POSTS AND PAGES (redirects property)
// ============================================================================

async function collectFromPostsAndPages() {
  const redirects = [];

  for (const { dir, urlPrefix } of CONTENT_DIRS) {
    const fullPath = path.resolve(dir);
    const files = await findMarkdownFiles(fullPath);

    for (const filePath of files) {
      try {
        const content = await fs.readFile(filePath, 'utf-8');
        const frontmatter = parseFrontmatter(content);
        if (!frontmatter || !frontmatter.redirects) continue;

        const slug = getSlug(filePath, dir);
        if (slug === null) continue;

        const targetUrl = urlPrefix ? `${urlPrefix}/${slug}` : `/${slug}`;
        const redirectEntries = Array.isArray(frontmatter.redirects) ? frontmatter.redirects : [frontmatter.redirects];

        for (const alias of redirectEntries) {
          let cleanAlias = alias.replace(/^\/+/, '');
          const aliasPath = urlPrefix ? `${urlPrefix}/${cleanAlias}` : `/${cleanAlias}`;
          if (aliasPath === targetUrl) continue;

          redirects.push({ from: aliasPath, to: targetUrl });
        }
      } catch (error) {
        log.warn(`Warning: Could not process ${filePath}:`, error.message);
      }
    }
  }

  return redirects;
}

// ============================================================================
// COLLECT REDIRECTS FROM SPECIAL PAGES (redirects property)
// ============================================================================

async function collectFromSpecialPages() {
  const redirects = [];
  const specialDir = path.resolve('src/content/special');

  try {
    const entries = await fs.readdir(specialDir, { withFileTypes: true });
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;

      const targetUrl = SPECIAL_PAGE_URLS[entry.name];
      if (!targetUrl) continue;

      const indexPath = path.join(specialDir, entry.name, 'index.md');
      try {
        const content = await fs.readFile(indexPath, 'utf-8');
        const frontmatter = parseFrontmatter(content);
        if (!frontmatter || !frontmatter.redirects) continue;

        const redirectEntries = Array.isArray(frontmatter.redirects) ? frontmatter.redirects : [frontmatter.redirects];
        for (const alias of redirectEntries) {
          const cleanAlias = alias.replace(/^\/+/, '');
          const aliasPath = `/${cleanAlias}`;
          if (aliasPath === targetUrl) continue;

          redirects.push({ from: aliasPath, to: targetUrl });
        }
      } catch {}
    }
  } catch {}

  return redirects;
}

// ============================================================================
// COLLECT REDIRECTS FROM REDIRECTS COLLECTION
// ============================================================================

async function collectRedirects() {
  const redirects = [];
  const redirectsDir = path.resolve(REDIRECTS_DIR);

  try {
    const files = (await fs.readdir(redirectsDir)).filter(f => f.endsWith('.md'));
    for (const file of files) {
      try {
        const content = await fs.readFile(path.join(redirectsDir, file), 'utf-8');
        const frontmatter = parseFrontmatter(content);
        if (!frontmatter || !frontmatter.link) continue;

        const slug = file.replace(/\.md$/, '');
        redirects.push({ from: `/${slug}`, to: frontmatter.link });

        // Redirects property on redirect files point to the same destination
        if (frontmatter.redirects) {
          const redirectEntries = Array.isArray(frontmatter.redirects) ? frontmatter.redirects : [frontmatter.redirects];
          for (const alias of redirectEntries) {
            const cleanAlias = alias.replace(/^\/+/, '');
            redirects.push({ from: `/${cleanAlias}`, to: frontmatter.link });
          }
        }
      } catch {}
    }
  } catch {}

  return redirects;
}

// ============================================================================
// DETECT DEPLOYMENT PLATFORM FROM CONFIG.TS
// ============================================================================

async function detectPlatform() {
  try {
    const configPath = path.resolve('src/config.ts');
    const content = await fs.readFile(configPath, 'utf-8');
    const match = content.match(/\[CONFIG:DEPLOYMENT_PLATFORM\]\s*\n?\s*platform:\s*['"]([^'"]+)['"]/);
    return match ? match[1] : 'netlify';
  } catch {
    return 'netlify';
  }
}

// ============================================================================
// WRITE REDIRECTS (PLATFORM-AWARE)
// ============================================================================

async function updateNetlifyToml(allRedirects) {
  const tomlPath = path.resolve('netlify.toml');
  let content;
  try {
    content = await fs.readFile(tomlPath, 'utf-8');
  } catch {
    log.info('No netlify.toml found, skipping.');
    return;
  }

  // Remove any previous auto-generated section
  const markerIndex = content.indexOf(MARKER);
  if (markerIndex !== -1) {
    content = content.substring(0, markerIndex).trimEnd() + '\n';
  }
  const oldMarker = '# === AUTO-GENERATED ALIAS REDIRECTS (do not edit below) ===';
  const oldMarkerIndex = content.indexOf(oldMarker);
  if (oldMarkerIndex !== -1) {
    content = content.substring(0, oldMarkerIndex).trimEnd() + '\n';
  }

  if (allRedirects.length === 0) {
    await fs.writeFile(tomlPath, content, 'utf-8');
    log.info('No dynamic redirects found. netlify.toml unchanged.');
    return;
  }

  const redirectLines = [
    '',
    MARKER,
    ...allRedirects.map(r =>
      `[[redirects]]\n  from = "${r.from}"\n  to = "${r.to}"\n  status = 301\n  force = true`
    ),
  ];

  content += redirectLines.join('\n') + '\n';
  await fs.writeFile(tomlPath, content, 'utf-8');
  log.info(`Wrote ${allRedirects.length} dynamic redirects to netlify.toml.`);
}

async function writeVercelJson(allRedirects) {
  const vercelPath = path.resolve('vercel.json');
  let existing = {};
  try {
    existing = JSON.parse(await fs.readFile(vercelPath, 'utf-8'));
  } catch {
    // No existing file, start fresh
  }

  existing.redirects = allRedirects.map(r => ({
    source: r.from,
    destination: r.to,
    permanent: true
  }));

  await fs.writeFile(vercelPath, JSON.stringify(existing, null, 2) + '\n', 'utf-8');
  log.info(`Wrote ${allRedirects.length} dynamic redirects to vercel.json.`);
}

async function writePublicRedirects(allRedirects) {
  // _redirects format used by Cloudflare Pages and GitHub Pages
  const redirectsPath = path.resolve('public/_redirects');
  const lines = allRedirects.map(r => `${r.from} ${r.to} 301`);
  const content = lines.length > 0
    ? MARKER + '\n' + lines.join('\n') + '\n'
    : '';
  await fs.writeFile(redirectsPath, content, 'utf-8');
  log.info(`Wrote ${allRedirects.length} dynamic redirects to public/_redirects.`);
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  log.info('Processing dynamic redirects from content...');

  const platform = await detectPlatform();
  log.info(`Deployment platform: ${platform}`);

  const [fromPostsAndPages, fromSpecial, fromRedirects] = await Promise.all([
    collectFromPostsAndPages(),
    collectFromSpecialPages(),
    collectRedirects(),
  ]);

  const allRedirects = [...fromPostsAndPages, ...fromSpecial, ...fromRedirects];

  if (allRedirects.length > 0) {
    log.info(`Found ${allRedirects.length} dynamic redirects:`);
    for (const r of allRedirects) {
      log.info(`  ${r.from} -> ${r.to}`);
    }
  }

  switch (platform) {
    case 'vercel':
      await writeVercelJson(allRedirects);
      break;
    case 'cloudflare':
      await writePublicRedirects(allRedirects);
      break;
    case 'github-pages':
      await writePublicRedirects(allRedirects);
      break;
    case 'netlify':
    default:
      await updateNetlifyToml(allRedirects);
      break;
  }

  log.info('Redirect processing complete!');
}

main();
